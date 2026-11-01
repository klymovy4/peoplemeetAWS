require('dotenv').config();
const express = require('express');
const multer = require('multer'); // For handling multipart/form-data
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
import { Database } from "bun:sqlite";
import bcrypt from 'bcrypt'; // For password hashing
import crypto from 'crypto'; // For generating session tokens
// const nodemailer = require('nodemailer');
const sendgrid = require("@sendgrid/mail");
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
// Sender address. Set MAIL_FROM in .env (e.g. "PeopleMeet <noreply@peoplemeet.com.ua>") once the
// domain is authenticated in SendGrid; a @gmail.com sender fails DMARC and often lands in spam
const MAIL_FROM = process.env.MAIL_FROM || "klymovy4roman@gmail.com";
const MAX_THOUGHTS_LENGTH = 100;
const MAX_NAME_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 1000;
const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 64; // bcrypt only uses the first 72 bytes anyway
const MIN_AGE = 18;
const MAX_AGE = 90;
const ALLOWED_SEX = ['male', 'female'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Emails are compared case-insensitively: "Roman@x.com" and "roman@x.com" are one account
const normalizeEmail = (email) => String(email).trim().toLowerCase();

const passwordError = (password) => {
    if (typeof password !== 'string') return "Password is required.";
    if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (password.length > MAX_PASSWORD_LENGTH) return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
    return null;
};

// Simple in-memory rate limiter (one server process): at most `max` hits per `windowMs` per key
const rateLimitHits = new Map();
function isRateLimited(key, max, windowMs) {
    const now = Date.now();
    const entry = rateLimitHits.get(key);
    if (!entry || entry.resetAt <= now) {
        rateLimitHits.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }
    entry.count += 1;
    return entry.count > max;
}
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitHits) {
        if (entry.resetAt <= now) rateLimitHits.delete(key);
    }
}, 10 * 60 * 1000);

// Client IP: requests come through Cloudflare -> nginx, so the socket address is the proxy's
const clientIp = (req) =>
    req.headers['cf-connecting-ip'] ||
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress;

const MINUTE = 60 * 1000;
// Express middleware: limit by client IP (and by email in the body when there is one)
const limit = (name, { perIp, perEmail, windowMs }) => (req, res, next) => {
    const tooMany = () => res.status(429).json({ message: "Too many attempts. Please try again later." });
    if (perIp && isRateLimited(`${name}:ip:${clientIp(req)}`, perIp, windowMs)) return tooMany();
    if (perEmail && req.body?.email && isRateLimited(`${name}:email:${normalizeEmail(req.body.email)}`, perEmail, windowMs)) {
        return tooMany();
    }
    next();
};
const RECOVERY_CODE_LENGTH = 6;
const RECOVERY_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_RECOVERY_ATTEMPTS = 5;

function sendRecoveryCodeEmail(email, recoveryCode) {
    const emailHtml = '<div style="text-align: center;">Code: ' + recoveryCode + '</div>';
    const emailText = 'Your PeopleMeet password reset code is: ' + recoveryCode;
    const options = {
        from: MAIL_FROM,
        to: email,
        subject: "PeopleMeet Password Reset Code",
        html: emailHtml,
        text: emailText
    }
    // Without catch a SendGrid error becomes an unhandled rejection that can crash the process
    sendgrid.send(options)
        .then(() => console.log('Recovery email sent to ' + email))
        .catch(error => console.error('Recovery email error:', error));
}

// Cryptographically secure code, e.g. "048213"
function generateRecoveryCode() {
    return crypto.randomInt(0, 10 ** RECOVERY_CODE_LENGTH).toString().padStart(RECOVERY_CODE_LENGTH, '0');
}

const db = new Database("/home/ubuntu/db/peoplemeet.db");

// Create users table
db.run(`
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT UNIQUE, 
        password TEXT, 
        age INTEGER, 
        sex TEXT, 
        description TEXT, 
        thoughts TEXT, 
        image TEXT, 
        lat REAL, 
        lng REAL, 
        is_online INTEGER DEFAULT 0,
        last_time_online DATETIME,
        recovery_code TEXT
    )
`);

// Add recovery code expiry and attempt counter (existing databases were created without them)
const recoveryUserColumns = db.query("PRAGMA table_info(users)").all().map(column => column.name);
if (!recoveryUserColumns.includes('recovery_expires_at')) {
    db.run("ALTER TABLE users ADD COLUMN recovery_expires_at DATETIME");
}
if (!recoveryUserColumns.includes('recovery_attempts')) {
    db.run("ALTER TABLE users ADD COLUMN recovery_attempts INTEGER DEFAULT 0");
}

// Create sessions table
db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER,
        expires_at DATETIME
    )
`);

// Create messages table
db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read INTEGER DEFAULT 0 -- 0 for unread, 1 for read
    )
`);

// Create user_blocks table. A block hides both users from each other
db.run(`
    CREATE TABLE IF NOT EXISTS user_blocks (
        blocker_id INTEGER NOT NULL,
        blocked_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (blocker_id, blocked_id)
    )
`);
db.run("CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks (blocked_id)");

// Create user_reports table. message_text is a copy: messages are deleted after 12 hours
db.run(`
    CREATE TABLE IF NOT EXISTS user_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL,
        reported_id INTEGER NOT NULL,
        message_id INTEGER,
        message_text TEXT,
        reason TEXT NOT NULL,
        comment TEXT,
        status TEXT DEFAULT 'new', -- new | action_taken | dismissed
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME
    )
`);
db.run("CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports (status, created_at)");

// "Delete for everyone" on a single message: both users see "Message deleted", but the text
// stays in the DB until the 12-hour cleanup so moderators can still see it in reports
const messageColumns = db.query("PRAGMA table_info(messages)").all().map(column => column.name);
if (!messageColumns.includes('deleted_at')) {
    db.run("ALTER TABLE messages ADD COLUMN deleted_at DATETIME");
}

// "Delete conversation" only hides it for the user who deleted it: the partner keeps it
// (and can still report it). Messages up to cleared_up_to_id are hidden for user_id;
// they are physically removed by the usual 12-hour cleanup
db.run(`
    CREATE TABLE IF NOT EXISTS conversation_clears (
        user_id INTEGER NOT NULL,
        partner_id INTEGER NOT NULL,
        cleared_up_to_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, partner_id)
    )
`);

// Add is_banned to users (existing databases were created without it)
const userColumns = db.query("PRAGMA table_info(users)").all().map(column => column.name);
if (!userColumns.includes('is_banned')) {
    db.run("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0");
}

// Location privacy: other users get a position shifted by 50-150 m in a random direction.
// The shift is chosen when the user goes online and kept until they go offline: a new random
// shift on every poll could be averaged out to the real position, a fixed one can't
if (!userColumns.includes('fuzz_dlat')) {
    db.run("ALTER TABLE users ADD COLUMN fuzz_dlat REAL DEFAULT 0");
    db.run("ALTER TABLE users ADD COLUMN fuzz_dlng REAL DEFAULT 0");
}
const FUZZ_MIN_M = 50;
const FUZZ_MAX_M = 150;
const METERS_PER_DEGREE_LAT = 111320;

function randomLocationFuzz(lat) {
    const distance = FUZZ_MIN_M + crypto.randomInt(0, 10001) / 10000 * (FUZZ_MAX_M - FUZZ_MIN_M);
    const angle = crypto.randomInt(0, 360000) / 1000 * Math.PI / 180;
    const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.max(0.01, Math.cos(lat * Math.PI / 180));
    return {
        dlat: (distance * Math.cos(angle)) / METERS_PER_DEGREE_LAT,
        dlng: (distance * Math.sin(angle)) / metersPerDegreeLng,
    };
}

// Users who were already online before this feature get a shift right away
for (const user of db.query(
    "SELECT id, lat FROM users WHERE is_online = 1 AND lat IS NOT NULL AND fuzz_dlat = 0 AND fuzz_dlng = 0"
).all()) {
    const fuzz = randomLocationFuzz(user.lat);
    db.run("UPDATE users SET fuzz_dlat = ?, fuzz_dlng = ? WHERE id = ?", [fuzz.dlat, fuzz.dlng, user.id]);
}

const REPORT_REASONS = ['spam', 'harassment', 'inappropriate_photo', 'fake_profile', 'underage', 'other'];
const MAX_REPORT_COMMENT_LENGTH = 500;
const REPORTS_EMAIL = process.env.REPORTS_EMAIL || 'klymovy4roman@gmail.com';

// SQL condition: no block between :me and the user aliased as `u`, in either direction.
// Expects the current user's id twice in the query parameters
const NOT_BLOCKED_SQL = `
    NOT EXISTS (
        SELECT 1 FROM user_blocks b
        WHERE (b.blocker_id = ? AND b.blocked_id = u.id)
           OR (b.blocker_id = u.id AND b.blocked_id = ?)
    )`;

function isBlockedBetween(userA, userB) {
    return !!db.query(
        `SELECT 1 FROM user_blocks
         WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`
    ).get(userA, userB, userB, userA);
}

// Users blocked BY userId. Their conversations are hidden only for the blocker: the blocked
// user keeps the conversation (read-only) so they can still report what was written
function getUsersBlockedBy(userId) {
    const rows = db.query("SELECT blocked_id AS id FROM user_blocks WHERE blocker_id = ?").all(userId);
    return new Set(rows.map(row => row.id));
}

// Last messages between two users for a report email, including ones deleted for everyone
function getConversationExcerpt(userA, userB, limit = 20) {
    const rows = db.query(
        `SELECT id, sender_id, message_text, created_at, deleted_at FROM messages
         WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
         ORDER BY id DESC LIMIT ?`
    ).all(userA, userB, userB, userA, limit).reverse();
    return rows.map(m => `  [${m.created_at}] #${m.sender_id}${m.deleted_at ? ' (DELETED BY SENDER)' : ''}: ${m.message_text}`);
}

// Context for the moderator: is this a pattern (many different reporters) or one person
// who reports everyone? Counts include the report that was just created
function getReportStats(reporterId, reportedId) {
    const against = db.query(
        "SELECT COUNT(*) AS total, COUNT(DISTINCT reporter_id) AS reporters FROM user_reports WHERE reported_id = ?"
    ).get(reportedId);
    const byReporter = db.query(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END), 0) AS dismissed,
                COALESCE(SUM(CASE WHEN status = 'action_taken' THEN 1 ELSE 0 END), 0) AS confirmed
         FROM user_reports WHERE reporter_id = ?`
    ).get(reporterId);
    const reporterReported = db.query(
        "SELECT COUNT(DISTINCT reporter_id) AS reporters FROM user_reports WHERE reported_id = ?"
    ).get(reporterId);
    return { against, byReporter, reporterReported };
}

function sendReportEmail(report, reporter, reported) {
    const stats = getReportStats(reporter.id, reported.id);
    const hasEvidence = !!report.message_text;
    const lines = [
        `Report #${report.id}`,
        `Reason: ${report.reason}`,
        `Reporter: #${reporter.id} ${reporter.name || ''} <${reporter.email}>`,
        `Reported: #${reported.id} ${reported.name || ''} <${reported.email}>`,
        `Reported image: ${reported.image ? 'https://peoplemeet.com.ua/uploads/' + reported.image : '-'}`,
        `Reported thoughts: ${reported.thoughts || '-'}`,
        `Message (from the server, can't be faked): ${report.message_text || '-'}`,
        `Comment (reporter's words, not evidence): ${report.comment || '-'}`,
        '',
        '--- Recent conversation (server copy, includes deleted messages) ---',
        ...(() => {
            const excerpt = getConversationExcerpt(reporter.id, reported.id);
            return excerpt.length ? excerpt : ['  (no messages - they are deleted after 12 hours)'];
        })(),
        '',
        '--- History ---',
        `Reports against #${reported.id}: ${stats.against.total} from ${stats.against.reporters} different user(s)`,
        `Reports filed by #${reporter.id}: ${stats.byReporter.total} (confirmed ${stats.byReporter.confirmed}, dismissed ${stats.byReporter.dismissed})`,
        `Reporter #${reporter.id} was reported by ${stats.reporterReported.reporters} user(s)`,
        '',
        hasEvidence || stats.against.reporters >= 2
            ? 'Has evidence or several reporters - check and decide.'
            : 'No message evidence and a single reporter - do NOT ban on this alone (check the photo link).',
        '',
        `Ban: UPDATE users SET is_banned = 1 WHERE id = ${reported.id}; UPDATE user_reports SET status = 'action_taken', reviewed_at = CURRENT_TIMESTAMP WHERE reported_id = ${reported.id} AND status = 'new';`,
        `Dismiss: UPDATE user_reports SET status = 'dismissed', reviewed_at = CURRENT_TIMESTAMP WHERE id = ${report.id};`,
    ];
    sendgrid.send({
        from: MAIL_FROM,
        to: REPORTS_EMAIL,
        subject: `PeopleMeet report #${report.id}: ${report.reason}${hasEvidence ? ' [message]' : ''} (${stats.against.reporters} reporter(s))`,
        text: lines.join('\n'),
    }).catch(error => console.error("Report email error:", error));
}

// Always UTC, like SQLite's CURRENT_TIMESTAMP, so comparisons don't depend on the server timezone
// WAL lets reads (polling every 3s) run while writes happen; indexes for the hot queries
db.run("PRAGMA journal_mode = WAL");
db.run("CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (sender_id)");
db.run("CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver_id)");
db.run("CREATE INDEX IF NOT EXISTS idx_users_online ON users (is_online)");
db.run("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id)");

function formatDateTimeForSQL(d) {
    const year = d.getUTCFullYear();
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = d.getUTCDate().toString().padStart(2, '0');
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    const seconds = d.getUTCSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function deleteExpiredTokens() {
    const now = formatDateTimeForSQL(new Date()); // Get current time in ISO format

    try {
        const result = db.run("DELETE FROM sessions WHERE expires_at <= ?", now);
        if (result.changes > 0) {
            console.log(`Deleted ${result.changes} expired sessions.`);
        } else {
            // console.log("No expired sessions to delete."); // Less verbose
        }
    } catch (error) {
        console.error("Error deleting expired tokens:", error);
    }
}

deleteExpiredTokens();
setInterval(deleteExpiredTokens, 60 * 60 * 1000); // Every hour

function setUsersOffline() {
    const now = new Date();
    // Users who haven't polled for 3 minutes (app closed or in the background) go offline
    const threeMinutesAgo = formatDateTimeForSQL(new Date(now.getTime() - 3 * 60 * 1000));

    try {
        const result = db.run("UPDATE users SET is_online = 0, lat = null, lng = null WHERE is_online = 1 AND last_time_online <= ?", threeMinutesAgo);
        // if (result.changes > 0) {
        //     // console.log(`Set ${result.changes} users offline due to inactivity.`);
        // } else {
        //     // console.log("No users to set offline due to inactivity."); // Less verbose
        // }
    } catch (error) {
        console.error("Error setting users offline:", error);
    }
}
setInterval(setUsersOffline, 60 * 1000); // every minute

function deleteOldMessages() {
    // Calculate the timestamp for twelve hours ago in ISO format
    const twelveHoursAgo = formatDateTimeForSQL(new Date(Date.now() - 12 * 60 * 60 * 1000));
    try {
        const result = db.run("DELETE FROM messages WHERE created_at <= ?", twelveHoursAgo);
        if (result.changes > 0) {
            // Log a message if messages were deleted
            console.log(`Deleted ${result.changes} messages older than 12 hours. Time ${twelveHoursAgo}`);
        } else {
            // Optionally, log if no messages were deleted (commented out for less verbosity)
            // console.log(`No messages older than 12 hours to delete. Time ${twelveHoursAgo}`);
        }
    } catch (error) {
        // Log any errors that occur during the deletion process
        console.error("Error deleting old messages:", error);
    }
}
setInterval(deleteOldMessages, 60 * 60 * 1000);

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(bodyParser.json());

const PORT = 3000;

const staticAssetsPath = '/home/ubuntu/peoplemeetAWS/dist/assets';
app.use('/assets', express.static(staticAssetsPath));

const staticUploadsPath = '/home/ubuntu/uploads';
app.use('/uploads', express.static(staticUploadsPath));
// A missing photo is a 404, not the web app's index.html
app.use('/uploads', (req, res) => res.status(404).end());

// Checks a recovery code. Every wrong attempt is counted, and after MAX_RECOVERY_ATTEMPTS
// or RECOVERY_CODE_TTL_MS the code stops working, so it can't be brute-forced.
// Returns the user id when the code is valid, otherwise null
function verifyRecoveryCode(email, recoveryCode) {
    const user = db.query(
        "SELECT id, recovery_code, recovery_expires_at, recovery_attempts FROM users WHERE lower(email) = ?"
    ).get(normalizeEmail(email));

    if (!user || !user.recovery_code || !user.recovery_expires_at
        || user.recovery_attempts >= MAX_RECOVERY_ATTEMPTS
        || user.recovery_expires_at <= formatDateTimeForSQL(new Date())) {
        return null;
    }

    if (user.recovery_code !== String(recoveryCode)) {
        db.run("UPDATE users SET recovery_attempts = recovery_attempts + 1 WHERE id = ?", [user.id]);
        return null;
    }

    return user.id;
}

// Middleware to authenticate user and get user_id from token
async function authenticateUser(req, res, next) {
    const { token } = req.body; // Assuming token is always in the body for these protected routes
    if (!token) {
        return res.status(400).json({ message: "Token is required" });
    }

    try {
        const session = db.query(
            `SELECT s.user_id, u.is_banned
             FROM sessions s JOIN users u ON u.id = s.user_id
             WHERE s.token = ? AND s.expires_at > ?`
        ).get(token, formatDateTimeForSQL(new Date()));
        if (!session) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        if (session.is_banned) {
            return res.status(403).json({ message: "Your account has been blocked", error: "banned" });
        }
        req.userId = session.user_id; // Attach userId to request object
        next(); // Proceed to the next handler
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({ message: "An error occurred during authentication" });
    }
}


app.post('/send_recovery_code', limit('recovery', { perIp: 10, perEmail: 3, windowMs: 60 * MINUTE }), async (req, res) => {
    const email = req.body.email ? normalizeEmail(req.body.email) : '';
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    // Always the same answer, so this endpoint can't be used to check who is registered
    const genericResponse = { message: "If this email is registered, a recovery code has been sent" };

    try {
        const existingUser = db.query("SELECT id, email FROM users WHERE lower(email) = ?").get(email);
        if (!existingUser) {
            return res.status(200).json(genericResponse);
        }

        const recoveryCode = generateRecoveryCode();
        const expiresAt = formatDateTimeForSQL(new Date(Date.now() + RECOVERY_CODE_TTL_MS));
        db.run(
            "UPDATE users SET recovery_code = ?, recovery_expires_at = ?, recovery_attempts = 0 WHERE id = ?",
            [recoveryCode, expiresAt, existingUser.id]
        );
        sendRecoveryCodeEmail(existingUser.email, recoveryCode);
        res.status(200).json(genericResponse);
    } catch (error) {
        console.error("Send recovery code error:", error);
        res.status(500).json({ message: "Error processing request" });
    }
});

app.post('/check_recovery_code', limit('check_code', { perIp: 30, windowMs: 15 * MINUTE }), async (req, res) => {
    const { email, recoveryCode } = req.body;
    if (!email || !recoveryCode) {
        return res.status(400).json({ message: "Email and recovery code are required" });
    }
    try {
        if (verifyRecoveryCode(email, recoveryCode)) {
            res.status(200).json({ message: "Recovery code is valid" });
        } else {
            res.status(400).json({ message: "Invalid or expired recovery code" });
        }
    } catch (error) {
        console.error("Check recovery code error:", error);
        res.status(500).json({ message: "Error processing request" });
    }
});

app.post('/change_password', limit('check_code', { perIp: 30, windowMs: 15 * MINUTE }), async (req, res) => {
    const { email, recoveryCode, password } = req.body;

    if (!email || !recoveryCode || !password) {
        return res.status(400).json({ message: "Email, recovery code, and new password are required." });
    }
    if (String(recoveryCode).length !== RECOVERY_CODE_LENGTH) {
        return res.status(400).json({ message: `Recovery code must be ${RECOVERY_CODE_LENGTH} digits.` });
    }
    const passwordProblem = passwordError(password);
    if (passwordProblem) {
        return res.status(400).json({ message: passwordProblem });
    }

    try {
        const userId = verifyRecoveryCode(email, recoveryCode);
        if (!userId) {
            return res.status(400).json({ message: "Invalid or expired recovery code" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            "UPDATE users SET password = ?, recovery_code = NULL, recovery_expires_at = NULL, recovery_attempts = 0 WHERE id = ?",
            [hashedPassword, userId]
        );
        // Log out everywhere: if the account was stolen, the old sessions must stop working
        db.run("DELETE FROM sessions WHERE user_id = ?", [userId]);
        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: 'Error setting new password' });
    }
});

app.post('/signup', limit('signup', { perIp: 10, windowMs: 60 * MINUTE }), async (req, res) => {
    const { password } = req.body;
    let { name } = req.body;

    if (!req.body.email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    const email = normalizeEmail(req.body.email);
    if (!EMAIL_RE.test(email) || email.length > 254) {
        return res.status(400).json({ message: "Please enter a valid email." });
    }
    const passwordProblem = passwordError(password);
    if (passwordProblem) {
        return res.status(400).json({ message: passwordProblem });
    }

    if (typeof name !== 'string') {
        name = '';
    }
    name = name.trim().slice(0, MAX_NAME_LENGTH);

    try {
        const existingUser = db.query("SELECT id FROM users WHERE lower(email) = ?").get(email);
        if (existingUser) {
            return res.status(409).json({ message: "Email already exists" }); // 409 Conflict
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = db.run(
            "INSERT INTO users (name, email, password, last_time_online) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, formatDateTimeForSQL(new Date())] // Set last_time_online on signup
        );

        if (result.changes > 0) {
            const userId = result.lastInsertRowid;
            const token = crypto.randomBytes(64).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [token, userId, formatDateTimeForSQL(expiresAt)]);
            res.status(201).json({ message: "User registered successfully", token: token, userId: userId }); // 201 Created
        } else {
            res.status(500).json({ message: "Failed to register user" });
        }
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "An error occurred during signup" });
    }
});

app.post('/login', limit('login', { perIp: 20, perEmail: 10, windowMs: 15 * MINUTE }), async (req, res) => {
    const { password } = req.body;
    if (!req.body.email || typeof password !== 'string' || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    const email = normalizeEmail(req.body.email);

    try {
        const user = db.query("SELECT id, password, is_banned FROM users WHERE lower(email) = ?").get(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.is_banned) {
            return res.status(403).json({ message: "Your account has been blocked", error: "banned" });
        }

        // Invalidate old sessions for the user (optional, but good practice)
        db.run("DELETE FROM sessions WHERE user_id = ?", user.id);

        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [token, user.id, formatDateTimeForSQL(expiresAt)]);

        // Every login starts offline: the user decides when (and where) to appear on the map
        db.run("UPDATE users SET is_online = 0, lat = NULL, lng = NULL WHERE id = ?", [user.id]);

        res.json({ message: "Login successful", token: token, userId: user.id });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
});

// Use authenticateUser middleware for routes that require a valid token
app.post('/self', authenticateUser, async (req, res) => {
    try {
        const user = db.query("SELECT id, name, email, age, sex, thoughts, description, image, lat, lng, is_online, last_time_online FROM users WHERE id = ?").get(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" }); // Should not happen if token is valid
        }
        res.json(user);
    } catch (error) {
        console.error("Self error:", error);
        res.status(500).json({ message: "An error occurred fetching user data" });
    }
});

app.post('/profile', authenticateUser, async (req, res) => {
    const { name, age, sex, description, thoughts } = req.body; // Token is handled by middleware
    const userId = req.userId;

    const invalid = (message) => res.status(400).json({ message });
    if (name !== undefined && (typeof name !== 'string' || name.length > MAX_NAME_LENGTH)) {
        return invalid(`Name must be text up to ${MAX_NAME_LENGTH} characters.`);
    }
    // Adults only: strangers meet in person
    if (age !== undefined) {
        const ageNum = Number(age);
        if (!Number.isInteger(ageNum) || ageNum < MIN_AGE || ageNum > MAX_AGE) {
            return invalid(`Age must be between ${MIN_AGE} and ${MAX_AGE}.`);
        }
    }
    if (sex !== undefined && sex !== '' && !ALLOWED_SEX.includes(sex)) {
        return invalid("Invalid gender.");
    }
    if (description !== undefined && (typeof description !== 'string' || description.length > MAX_DESCRIPTION_LENGTH)) {
        return invalid(`Description must be text up to ${MAX_DESCRIPTION_LENGTH} characters.`);
    }
    if (thoughts !== undefined && (typeof thoughts !== 'string' || thoughts.length > MAX_THOUGHTS_LENGTH)) {
        return invalid(`Thoughts must be text up to ${MAX_THOUGHTS_LENGTH} characters.`);
    }

    try {
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push("name = ?"); values.push(name); }
        if (age !== undefined) { updates.push("age = ?"); values.push(Number(age)); }
        if (sex !== undefined) { updates.push("sex = ?"); values.push(sex); }
        if (description !== undefined) { updates.push("description = ?"); values.push(description); }
        if (thoughts !== undefined) { updates.push("thoughts = ?"); values.push(thoughts); }

        if (updates.length === 0) {
            return res.status(200).json({ message: "No updates provided" });
        }

        values.push(userId);
        const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
        const result = db.run(updateQuery, values);

        if (result.changes > 0) {
            return res.json({ message: "Profile updated successfully" });
        } else {
            // This could happen if the data sent is the same as current data
            return res.json({ message: "Profile updated (no changes detected) or user not found" });
        }
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: "An error occurred updating profile" });
    }
});

app.post('/online_users', authenticateUser, async (req, res) => {
    const userId = req.userId;
    try {
        // Update the current user's last_time_online
        db.run("UPDATE users SET last_time_online = ? WHERE id = ?", [formatDateTimeForSQL(new Date()), userId]);

        const onlineUsers = db.query(
            `SELECT u.id, u.name, u.age, u.sex, u.thoughts, u.description, u.image,
                    u.lat + u.fuzz_dlat AS lat, u.lng + u.fuzz_dlng AS lng
             FROM users u
             WHERE u.is_online = 1 AND u.id != ? AND u.is_banned = 0 AND ${NOT_BLOCKED_SQL}`
        ).all(userId, userId, userId);

        res.json(onlineUsers);
    }
    catch (error) {
        console.error("Online users fetch error:", error);
        res.status(500).json({ message: "An error occurred fetching online users" });
    }
});

app.post('/online', authenticateUser, async (req, res) => {
    const { is_online, lat, lng } = req.body; // Token handled by middleware
    const userId = req.userId;

    try {
        const updates = [];
        const values = [];

        // Going online (from offline): pick a new location shift for this online session
        if (is_online && typeof lat === 'number') {
            const current = db.query("SELECT is_online FROM users WHERE id = ?").get(userId);
            if (!current?.is_online) {
                const fuzz = randomLocationFuzz(lat);
                updates.push("fuzz_dlat = ?", "fuzz_dlng = ?");
                values.push(fuzz.dlat, fuzz.dlng);
            }
        }

        if (is_online !== undefined) {
            updates.push("is_online = ?");
            values.push(is_online ? 1 : 0); // Ensure boolean is converted to 0 or 1
            updates.push("last_time_online = ?"); // Always update last_time_online when status changes
            values.push(formatDateTimeForSQL(new Date()));
        }

        if (is_online !== undefined && !is_online) {
            // Going offline: the position is removed
            updates.push("lat = NULL", "lng = NULL");
        } else if (typeof lat === 'number' && typeof lng === 'number') {
            // Going online, or a position update while online
            updates.push("lat = ?", "lng = ?");
            values.push(lat, lng);
        } else if (is_online) {
            // Online without a position: don't keep a stale one
            updates.push("lat = NULL", "lng = NULL");
        }


        if (updates.length === 0) {
            return res.status(200).json({ message: "No online status updates provided" });
        }

        values.push(userId);
        const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
        const result = db.run(updateQuery, values);

        if (result.changes > 0) {
            return res.json({ message: "Online status updated successfully" });
        } else {
            return res.json({ message: "Online status updated (no changes detected) or user not found" });
        }
    } catch (error) {
        console.error("Online status update error:", error);
        res.status(500).json({ message: "An error occurred updating online status" });
    }
});

// Configure Multer storage (where to save the uploaded file)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/ubuntu/uploads/'); // Create an 'uploads' folder in your project
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
    fileFilter: (req, file, cb) => { // Optional: Filter file types
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('File upload only supports the following filetypes - ' + allowedTypes));
    }
});

function deleteOldPhoto(filePath) {
    if (!filePath) {
        console.warn('No file path provided for deletion.');
        return;
    }
    const fullPath = filePath; // Assuming filePath is already the full path
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            console.warn('Old photo file does not exist, cannot delete:', fullPath);
            return;
        }
        fs.unlink(fullPath, (err) => {
            if (err) {
                console.error('Error deleting old photo file:', err);
                return;
            }
            console.log('Old photo file deleted successfully:', fullPath);
        });
    });
}

// Don't use authenticateUser middleware, process token manually. Because it doesn't work before upload.single('photo'). It works after, but can't delete uploaded file if no token.
app.post('/upload', upload.single('photo'), async (req, res) => {
    const { token } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or file type not allowed.' });
    }
    if (!token) {
        // delete uploaded file
        fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error("Token is required. Error deleting file after an error:", unlinkErr);
        });
        return res.status(400).json({ message: "Token is required" });
    }

    try {
        const session = db.query(
            `SELECT s.user_id, u.is_banned
             FROM sessions s JOIN users u ON u.id = s.user_id
             WHERE s.token = ? AND s.expires_at > ?`
        ).get(token, formatDateTimeForSQL(new Date())); // Check expiry

        if (!session || session.is_banned) {
            // delete uploaded file
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Session expired or user banned. Error deleting file after an error:", unlinkErr);
            });
            if (session) {
                return res.status(403).json({ message: "Your account has been blocked", error: "banned" });
            }
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = session.user_id;

        const user = db.query("SELECT image FROM users WHERE id = ?").get(userId);
        if (!user) {
            // This case should ideally be caught by authenticateUser if user somehow deleted during session
            fs.unlinkSync(req.file.path); // Delete the newly uploaded file if user is not found
            return res.status(404).json({ message: "User not found" });
        }

        if (user.image) {
            deleteOldPhoto(path.join(staticUploadsPath, user.image));
        }

        const result = db.run("UPDATE users SET image = ? WHERE id = ?", [req.file.filename, userId]);
        if (result.changes > 0) {
            res.json({ message: 'File uploaded successfully!', filename: req.file.filename, filePath: `/uploads/${req.file.filename}` });
        } else {
            fs.unlinkSync(req.file.path); // Delete uploaded file if DB update fails
            res.status(500).json({ message: "Failed to update user profile with new image." });
        }
    } catch (error) {
        console.error("File upload processing error:", error);
        if (req.file && req.file.path) { // Attempt to delete uploaded file on error
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting file after an error:", unlinkErr);
            });
        }
        res.status(500).json({ message: "An error occurred during file upload" });
    }
});

// send a message
app.post('/send_message', authenticateUser, async (req, res) => {
    const sender_id = req.userId;
    const { receiver_id, message_text } = req.body;

    if (!receiver_id || typeof message_text !== 'string' || message_text.trim() === "") {
        return res.status(400).json({ message: "Receiver ID and message text are required." });
    }
    if (message_text.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.` });
    }

    if (sender_id === parseInt(receiver_id)) {
        return res.status(400).json({ message: "Cannot send message to yourself." });
    }

    try {
        // Check if receiver exists
        const receiverExists = db.query("SELECT id, is_banned FROM users WHERE id = ?").get(receiver_id);
        if (!receiverExists || receiverExists.is_banned) {
            return res.status(404).json({ message: "Receiver not found." });
        }

        if (isBlockedBetween(sender_id, receiverExists.id)) {
            return res.status(403).json({ message: "You can't message this user.", error: "blocked" });
        }

        const result = db.run(
            "INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)",
            [sender_id, receiver_id, message_text]
        );

        if (result.changes > 0) {
            const messageId = result.lastInsertRowid;
            // Fetch the created message to return it (optional, but good for client-side updates)
            const newMessage = db.query("SELECT * FROM messages WHERE id = ?").get(messageId);
            res.status(201).json({ message: "Message sent successfully", sentMessage: newMessage });
        } else {
            res.status(500).json({ message: "Failed to send message." });
        }
    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ message: "An error occurred while sending the message." });
    }
});


// read message
app.post('/read_messages', authenticateUser, async (req, res) => {
    const current_user_id = req.userId;
    const { chat_partner_id } = req.body;
    try {
        // Mark messages sent by chat_partner_id to current_user_id as read
        db.run(
            "UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0",
            [current_user_id, chat_partner_id]
        );
        res.status(200).json({ message: "Messages marked as read." });
    } catch (error) {
        console.error("Error in read_messages endpoint:", error);
        res.status(500).json({ message: "An unexpected error occurred while processing the request." });
    }
});

// get messages between the authenticated user and another user
app.post('/get_messages', authenticateUser, async (req, res) => {
    const current_user_id = req.userId;

    try {
        const hiddenUserIds = getUsersBlockedBy(current_user_id);
        // Conversations this user deleted: partner id -> last hidden message id
        const clearedUpTo = new Map(
            db.query("SELECT partner_id, cleared_up_to_id FROM conversation_clears WHERE user_id = ?")
                .all(current_user_id)
                .map(row => [row.partner_id, row.cleared_up_to_id])
        );

        // Fetch messages where the current user is either sender or receiver
        const messages = db.query(
            `SELECT id, sender_id, receiver_id, message_text, created_at, is_read, deleted_at
             FROM messages
             WHERE sender_id = ? OR receiver_id = ?
             ORDER BY created_at ASC`
        ).all(current_user_id, current_user_id)
            // Deleted for everyone: send only a placeholder flag, never the text
            .map(({ deleted_at, ...msg }) => deleted_at ? { ...msg, message_text: '', is_deleted: 1 } : { ...msg, is_deleted: 0 })
            // Hide conversations with blocked users (kept in the DB for moderation)
            // and messages from conversations this user deleted
            .filter(msg => {
                const otherUserId = msg.sender_id === current_user_id ? msg.receiver_id : msg.sender_id;
                if (hiddenUserIds.has(otherUserId)) return false;
                const clearedId = clearedUpTo.get(otherUserId);
                return clearedId === undefined || msg.id > clearedId;
            });

        // Extract unique user IDs involved in the messages (excluding the current user)
        const interactedUserIds = new Set();
        messages.forEach(msg => {
            if (msg.sender_id !== current_user_id) {
                interactedUserIds.add(msg.sender_id);
            }
            if (msg.receiver_id !== current_user_id) {
                interactedUserIds.add(msg.receiver_id);
            }
        });
        const userIdsArray = Array.from(interactedUserIds);

        let interactedUsers = [];
        if (userIdsArray.length > 0) {
            // Fetch details of the interacted users
            const placeholders = userIdsArray.map(() => '?').join(',');
            interactedUsers = db.query(
                `SELECT id, name, age, sex, description, image, is_online, last_time_online
                 FROM users
                 WHERE id IN (${placeholders}) AND is_banned = 0`
            ).all(...userIdsArray);
        }
        // Banned users are left out: their conversations disappear from the list
        const visibleUserIds = new Set(interactedUsers.map(user => user.id));

        // Organize messages by conversation (with each interacted user)
        const conversations = {};
        messages.forEach(msg => {
            const otherUserId = msg.sender_id === current_user_id ? msg.receiver_id : msg.sender_id;
            if (!visibleUserIds.has(otherUserId)) return;
            if (!conversations[otherUserId]) {
                conversations[otherUserId] = [];
            }
            conversations[otherUserId].push(msg);
        });

        // Create a map of users for easier access in the frontend
        const usersMap = {};
        interactedUsers.forEach(user => {
            usersMap[user.id] = user;
        });

        res.json({ messages: conversations, users: usersMap });

    } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ message: "An error occurred while fetching conversations." });
    }
});

// Delete one of your own messages for everyone
app.post('/delete_message', authenticateUser, async (req, res) => {
    const current_user_id = req.userId;
    const message_id = parseInt(req.body.message_id);

    if (!message_id) {
        return res.status(400).json({ message: "message_id is required." });
    }

    try {
        const message = db.query("SELECT id, sender_id, deleted_at FROM messages WHERE id = ?").get(message_id);
        if (!message) {
            return res.status(404).json({ message: "Message not found." });
        }
        if (message.sender_id !== current_user_id) {
            return res.status(403).json({ message: "You can delete only your own messages." });
        }

        if (!message.deleted_at) {
            db.run("UPDATE messages SET deleted_at = ? WHERE id = ?", [formatDateTimeForSQL(new Date()), message_id]);
        }
        res.status(200).json({ message: "Message deleted." });
    } catch (error) {
        console.error("Delete message error:", error);
        res.status(500).json({ message: "An error occurred while deleting the message." });
    }
});

// "Delete conversation": hide all messages with a chat partner for the current user only
app.post('/remove_conversation', authenticateUser, async (req, res) => {
    const current_user_id = req.userId;
    const { chat_partner_id } = req.body;

    if (!chat_partner_id) {
        return res.status(400).json({ message: "chat_partner_id is required." });
    }

    if (current_user_id === parseInt(chat_partner_id)) {
        return res.status(400).json({ message: "Cannot remove conversation with yourself." });
    }

    try {
        // Check if the chat partner exists (optional, but good practice)
        const partnerExists = db.query("SELECT id, name FROM users WHERE id = ?").get(chat_partner_id);
        if (!partnerExists) {
            return res.status(404).json({ message: "Chat partner not found." });
        }

        // Hide the conversation for the current user only; the partner still sees it and can
        // report it, so an abuser can't wipe the evidence. New messages will show up again
        const lastMessage = db.query(
            `SELECT MAX(id) AS id FROM messages
             WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`
        ).get(current_user_id, partnerExists.id, partnerExists.id, current_user_id);

        db.run(
            `INSERT INTO conversation_clears (user_id, partner_id, cleared_up_to_id) VALUES (?, ?, ?)
             ON CONFLICT(user_id, partner_id) DO UPDATE SET cleared_up_to_id = excluded.cleared_up_to_id`,
            [current_user_id, partnerExists.id, lastMessage?.id || 0]
        );

        res.status(200).json({ message: `Conversation with "${partnerExists.name}" deleted for you.` });
    } catch (error) {
        console.error("Remove conversation error:", error);
        res.status(500).json({ message: "An error occurred while removing the conversation." });
    }
});

app.post('/send_thoughts', authenticateUser, async (req, res) => {
    const { thoughts } = req.body; // Token is handled by middleware
    const userId = req.userId;

    // Validate if thoughts are provided, though an empty string might be acceptable
    if (thoughts === undefined) {
        return res.status(400).json({ message: "Thoughts are required." });
    }

    // Validate the type and length of thoughts
    if (typeof thoughts !== 'string' || thoughts.length > MAX_THOUGHTS_LENGTH) {
        return res.status(400).json({ message: `Thoughts must be text up to ${MAX_THOUGHTS_LENGTH} characters.` });
    }

    try {
        const result = db.run(
            "UPDATE users SET thoughts = ? WHERE id = ?",
            [thoughts, userId]
        );

        if (result.changes > 0) {
            return res.json({ message: "Thoughts updated successfully" });
        } else {
            // This could happen if the thoughts sent are the same as current thoughts,
            // or if the user ID somehow doesn't exist (though authenticateUser should prevent this).
            return res.json({ message: "Thoughts updated (no changes detected) or user not found" });
        }
    } catch (error) {
        console.error("Thoughts update error:", error);
        res.status(500).json({ message: "An error occurred updating thoughts" });
    }
});

// Block a user: both users disappear from each other's map and chats
app.post('/block_user', authenticateUser, async (req, res) => {
    const current_user_id = req.userId;
    const user_id = parseInt(req.body.user_id);

    if (!user_id) {
        return res.status(400).json({ message: "user_id is required." });
    }
    if (user_id === current_user_id) {
        return res.status(400).json({ message: "Cannot block yourself." });
    }

    try {
        const userExists = db.query("SELECT id FROM users WHERE id = ?").get(user_id);
        if (!userExists) {
            return res.status(404).json({ message: "User not found." });
        }

        // Blocking twice is not an error
        db.run("INSERT OR IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)", [current_user_id, user_id]);
        res.status(200).json({ message: "User blocked." });
    } catch (error) {
        console.error("Block user error:", error);
        res.status(500).json({ message: "An error occurred while blocking the user." });
    }
});

app.post('/unblock_user', authenticateUser, async (req, res) => {
    const current_user_id = req.userId;
    const user_id = parseInt(req.body.user_id);

    if (!user_id) {
        return res.status(400).json({ message: "user_id is required." });
    }

    try {
        db.run("DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?", [current_user_id, user_id]);
        res.status(200).json({ message: "User unblocked." });
    } catch (error) {
        console.error("Unblock user error:", error);
        res.status(500).json({ message: "An error occurred while unblocking the user." });
    }
});

// Users blocked by the current user (for the "Blocked users" screen)
app.post('/get_blocked_users', authenticateUser, async (req, res) => {
    const current_user_id = req.userId;
    try {
        const users = db.query(
            `SELECT u.id, u.name, u.image, b.created_at AS blocked_at
             FROM user_blocks b JOIN users u ON u.id = b.blocked_id
             WHERE b.blocker_id = ?
             ORDER BY b.created_at DESC`
        ).all(current_user_id);
        res.json({ users });
    } catch (error) {
        console.error("Get blocked users error:", error);
        res.status(500).json({ message: "An error occurred while fetching blocked users." });
    }
});

// Report a user (optionally a specific message). The reported user is blocked right away
app.post('/report_user', authenticateUser, async (req, res) => {
    const current_user_id = req.userId;
    const user_id = parseInt(req.body.user_id);
    const { reason, message_id } = req.body;
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';

    if (!user_id || !reason) {
        return res.status(400).json({ message: "user_id and reason are required." });
    }
    if (user_id === current_user_id) {
        return res.status(400).json({ message: "Cannot report yourself." });
    }
    if (!REPORT_REASONS.includes(reason)) {
        return res.status(400).json({ message: `reason must be one of: ${REPORT_REASONS.join(', ')}` });
    }
    if (comment.length > MAX_REPORT_COMMENT_LENGTH) {
        return res.status(400).json({ message: `Comment cannot exceed ${MAX_REPORT_COMMENT_LENGTH} characters.` });
    }

    try {
        const reported = db.query("SELECT id, name, email, image, thoughts FROM users WHERE id = ?").get(user_id);
        if (!reported) {
            return res.status(404).json({ message: "User not found." });
        }

        // The message must belong to the conversation between these two users
        let messageText = null;
        if (message_id) {
            const message = db.query(
                `SELECT message_text FROM messages
                 WHERE id = ? AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))`
            ).get(message_id, user_id, current_user_id, current_user_id, user_id);
            if (!message) {
                return res.status(400).json({ message: "Message not found in this conversation." });
            }
            messageText = message.message_text;
        }

        db.run("INSERT OR IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)", [current_user_id, user_id]);

        // At most one report per pair per 24 hours - repeated reports just succeed silently
        const dayAgo = formatDateTimeForSQL(new Date(Date.now() - 24 * 60 * 60 * 1000));
        const recentReport = db.query(
            "SELECT id FROM user_reports WHERE reporter_id = ? AND reported_id = ? AND created_at > ?"
        ).get(current_user_id, user_id, dayAgo);
        if (recentReport) {
            return res.status(200).json({ message: "Report received." });
        }

        const result = db.run(
            `INSERT INTO user_reports (reporter_id, reported_id, message_id, message_text, reason, comment, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [current_user_id, user_id, message_id || null, messageText, reason, comment || null, formatDateTimeForSQL(new Date())]
        );

        const reporter = db.query("SELECT id, name, email FROM users WHERE id = ?").get(current_user_id);
        sendReportEmail(
            { id: result.lastInsertRowid, reason, message_text: messageText, comment },
            reporter,
            reported
        );

        res.status(200).json({ message: "Report received." });
    } catch (error) {
        console.error("Report user error:", error);
        res.status(500).json({ message: "An error occurred while sending the report." });
    }
});

// Delete the account and the user's data (required by the App Store and Google Play).
// The email becomes free and can be registered again. Banned users never get here
// (authenticateUser returns 403), so their row and email stay and they can't re-register.
// Reports against the user are kept as moderation history
app.post('/delete_account', authenticateUser, async (req, res) => {
    const userId = req.userId;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: "Password is required." });
    }

    try {
        const user = db.query("SELECT id, password, image FROM users WHERE id = ?").get(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Incorrect password." });
        }

        // All or nothing: a half-deleted account would be worse than none
        db.transaction(() => {
            db.run("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?", [userId, userId]);
            db.run("DELETE FROM conversation_clears WHERE user_id = ? OR partner_id = ?", [userId, userId]);
            db.run("DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?", [userId, userId]);
            db.run("DELETE FROM user_reports WHERE reporter_id = ?", [userId]);
            db.run("DELETE FROM sessions WHERE user_id = ?", [userId]);
            db.run("DELETE FROM users WHERE id = ?", [userId]);
        })();

        if (user.image) {
            deleteOldPhoto(path.join(staticUploadsPath, user.image));
        }

        console.log(`Account #${userId} deleted`);
        res.status(200).json({ message: "Account deleted." });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ message: "An error occurred while deleting the account." });
    }
});

app.get('*', (req, res) => {
    res.sendFile('/home/ubuntu/peoplemeetAWS/dist/index.html');
});

// Errors thrown by middleware (e.g. multer rejecting a file type or size) as JSON, without stack traces
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || /File upload only supports/.test(err?.message || '')) {
        return res.status(400).json({ message: err.message });
    }
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ message: "Invalid JSON." });
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "An unexpected error occurred." });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
