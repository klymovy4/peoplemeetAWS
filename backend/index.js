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

function sendRecoveryCodeEmail(email, recoveryCode) {
    const emailHtml = '<div style="text-align: center;">Code: ' + recoveryCode + '</div>';
    const emailText = 'Your PeopleMeet password reset code is: ' + recoveryCode;
    const options = {
        from: "klymovy4roman@gmail.com",
        to: email,
        subject: "PeopleMeet Password Reset Code",
        html: emailHtml,
        text: emailText
    }
    sendgrid.send(options);
    console.log('Email sent to ' + email);
}


function generate4RandomNumbersForRecovery() {
    const recoveryCode = [];
    for (let i = 0; i < 4; i++) {
        // Generate a random integer between 0 and 9 (inclusive)
        const randomNumber = Math.floor(Math.random() * 10);
        recoveryCode.push(randomNumber);
    }
    return recoveryCode.join(''); // Join the numbers into a string
}

const db = new Database("/home/ec2-user/db/peoplemeet.db");

// Create users table if it doesn't exist, include password field.
db.run(`
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT UNIQUE, 
        password TEXT, 
        age INTEGER, 
        sex TEXT, 
        description TEXT, 
        image TEXT, 
        lat REAL, 
        lng REAL, 
        is_online INTEGER DEFAULT 0,
        last_time_online DATETIME,
        recovery_code TEXT
    )
`);

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

function deleteExpiredTokens() {
    const now = new Date().toISOString(); // Get current time in ISO format

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
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    try {
        const result = db.run("UPDATE users SET is_online = 0, lat = null, lng = null WHERE is_online = 1 AND last_time_online <= ?", fiveMinutesAgo);
        if (result.changes > 0) {
            console.log(`Set ${result.changes} users offline due to inactivity.`);
        } else {
            // console.log("No users to set offline due to inactivity."); // Less verbose
        }
    } catch (error) {
        console.error("Error setting users offline:", error);
    }
}
setInterval(setUsersOffline, 60 * 1000); // every minute

function deleteOldConversations() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    try {
        const usersToDelete = db.query(`
            SELECT DISTINCT m1.sender_id AS user1_id, m1.receiver_id AS user2_id
            FROM messages m1
            INNER JOIN messages m2 ON (m1.sender_id = m2.receiver_id AND m1.receiver_id = m2.sender_id)
            WHERE m1.is_read = 1
              AND m2.is_read = 1
              AND m1.created_at <= ?
              AND m2.created_at <= ?
            GROUP BY user1_id, user2_id
            HAVING MAX(m1.created_at) <= ? AND MAX(m2.created_at) <= ?
              AND (SELECT is_online FROM users WHERE id = user1_id) = 0
              AND (SELECT is_online FROM users WHERE id = user2_id) = 0
              AND (SELECT last_time_online FROM users WHERE id = user1_id) <= ?
              AND (SELECT last_time_online FROM users WHERE id = user2_id) <= ?
        `).all(oneHourAgo, oneHourAgo, oneHourAgo, oneHourAgo, oneHourAgo, oneHourAgo);

        let deletedMessageCount = 0;
        usersToDelete.forEach(pair => {
            const result = db.run(`
                DELETE FROM messages
                WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            `, [pair.user1_id, pair.user2_id, pair.user2_id, pair.user1_id]);
            deletedMessageCount += result.changes;
        });

        if (deletedMessageCount > 0) {
            console.log(`Deleted ${deletedMessageCount} messages from old conversations.`);
        } else {
            // console.log("No old conversations to delete."); // Less verbose
        }

    } catch (error) {
        console.error("Error deleting old conversations:", error);
    }
}
setInterval(deleteOldConversations, 60 * 60 * 1000); // Every hour
// deleteOldConversations();

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(bodyParser.json());

const PORT = 3000;

const staticAssetsPath = '/usr/share/nginx/html/peoplemeetAWS/dist/assets';
app.use('/assets', express.static(staticAssetsPath));

const staticUploadsPath = '/home/ec2-user/uploads';
app.use('/uploads', express.static(staticUploadsPath));

// Middleware to authenticate user and get user_id from token
async function authenticateUser(req, res, next) {
    const { token } = req.body; // Assuming token is always in the body for these protected routes
    if (!token) {
        return res.status(400).json({ message: "Token is required" });
    }

    try {
        const session = db.query("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?").get(token, new Date().toISOString());
        if (!session) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        req.userId = session.user_id; // Attach userId to request object
        next(); // Proceed to the next handler
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({ message: "An error occurred during authentication" });
    }
}


app.post('/send_recovery_code', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    const existingUser = db.query("SELECT id FROM users WHERE email = ?").get(email);
    if (!existingUser) {
        return res.status(404).json({ message: "Email doesn't exist" });
    }
    const recoveryCode = generate4RandomNumbersForRecovery();
    try {
        db.run(
            "UPDATE users SET recovery_code = ? WHERE email = ?",
            [recoveryCode, email]
        );
        sendRecoveryCodeEmail(email, recoveryCode);
        res.status(200).json({ message: "Recovery code sent to email" });
    } catch (error) {
        console.error("Send recovery code error:", error);
        res.status(500).json({ message: "Error processing request" });
    }
});

app.post('/check_recovery_code', async (req, res) => {
    const { email, recoveryCode } = req.body;
    if (!email || !recoveryCode) {
        return res.status(400).json({ message: "Email and recovery code are required" });
    }
    const existingUser = db.query("SELECT id FROM users WHERE email = ? AND recovery_code = ?").get(email, recoveryCode);
    if (existingUser) {
        res.status(200).json({ message: "Recovery code is valid" });
    } else {
        res.status(400).json({ message: "Invalid email or recovery code" });
    }
});

app.post('/change_password', async (req, res) => {
    const { email, recoveryCode, password } = req.body;

    if (!email || !recoveryCode || !password) {
        return res.status(400).json({ message: "Email, recovery code, and new password are required." });
    }
    if (recoveryCode.length !== 4) { // Assuming 4-digit code
        return res.status(400).json({ message: "Recovery code must be 4 digits." });
    }
    if (password.length < 4) { // Example minimum password length
        return res.status(400).json({ message: "Password must be at least 4 characters." });
    }

    const existingUser = db.query("SELECT id FROM users WHERE email = ? AND recovery_code = ?").get(email, recoveryCode);
    if (existingUser) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run(
                "UPDATE users SET password = ?, recovery_code = NULL WHERE email = ?", // Clear recovery code
                [hashedPassword, email]
            );
            res.status(200).json({ message: "Password changed successfully" });
        } catch (error) {
            console.error("Change password error:", error);
            res.status(500).json({ message: 'Error setting new password' });
        }
    } else {
        res.status(400).json({ message: "Invalid email or recovery code" });
    }
});

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    let { name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    if (!name) {
        name = '';
    }
    // Add more validation as needed (e.g., password strength, email format)

    try {
        const existingUser = db.query("SELECT id FROM users WHERE email = ?").get(email);
        if (existingUser) {
            return res.status(409).json({ message: "Email already exists" }); // 409 Conflict
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = db.run(
            "INSERT INTO users (name, email, password, last_time_online) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, new Date().toISOString()] // Set last_time_online on signup
        );

        if (result.changes > 0) {
            const userId = result.lastInsertRowid;
            const token = crypto.randomBytes(64).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [token, userId, expiresAt.toISOString()]);
            res.status(201).json({ message: "User registered successfully", token: token, userId: userId }); // 201 Created
        } else {
            res.status(500).json({ message: "Failed to register user" });
        }
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "An error occurred during signup" });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const user = db.query("SELECT id, password FROM users WHERE email = ?").get(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Invalidate old sessions for the user (optional, but good practice)
        db.run("DELETE FROM sessions WHERE user_id = ?", user.id);

        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [token, user.id, expiresAt.toISOString()]);

        // Update last_time_online and is_online status
        db.run("UPDATE users SET last_time_online = ?, is_online = 1 WHERE id = ?", [new Date().toISOString(), user.id]);

        res.json({ message: "Login successful", token: token, userId: user.id });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
});

// Use authenticateUser middleware for routes that require a valid token
app.post('/self', authenticateUser, async (req, res) => {
    try {
        const user = db.query("SELECT id, name, email, age, sex, description, image, lat, lng, is_online, last_time_online FROM users WHERE id = ?").get(req.userId);
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
    const { name, age, sex, description } = req.body; // Token is handled by middleware
    const userId = req.userId;

    try {
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push("name = ?"); values.push(name); }
        if (age !== undefined) { updates.push("age = ?"); values.push(age); }
        if (sex !== undefined) { updates.push("sex = ?"); values.push(sex); }
        if (description !== undefined) { updates.push("description = ?"); values.push(description); }

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
        db.run("UPDATE users SET last_time_online = ? WHERE id = ?", [new Date().toISOString(), userId]);

        const onlineUsers = db.query(
            `SELECT id, name, email, age, sex, description, image, lat, lng 
             FROM users 
             WHERE is_online = 1 AND id != ?`
        ).all(userId);

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

        if (is_online !== undefined) {
            updates.push("is_online = ?");
            values.push(is_online ? 1 : 0); // Ensure boolean is converted to 0 or 1
            updates.push("last_time_online = ?"); // Always update last_time_online when status changes
            values.push(new Date().toISOString());
        }

        // Only update lat/lng if user is going online and values are provided
        if (is_online && lat !== undefined) {
            updates.push("lat = ?");
            values.push(lat);
        } else { // If going offline or lat not provided, set to null
            updates.push("lat = NULL");
        }

        if (is_online && lng !== undefined) {
            updates.push("lng = ?");
            values.push(lng);
        } else { // If going offline or lng not provided, set to null
            updates.push("lng = NULL");
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
        cb(null, '/home/ec2-user/uploads/'); // Create an 'uploads' folder in your project
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // Limit file size to 100MB
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
        const session = db.query("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?").get(token, new Date().toISOString()); // Check expiry

        if (!session) {
            // delete uploaded file
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Session expired. Error deleting file after an error:", unlinkErr);
            });
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

    if (!receiver_id || !message_text || message_text.trim() === "") {
        return res.status(400).json({ message: "Receiver ID and message text are required." });
    }

    if (sender_id === parseInt(receiver_id)) {
        return res.status(400).json({ message: "Cannot send message to yourself." });
    }

    try {
        // Check if receiver exists
        const receiverExists = db.query("SELECT id FROM users WHERE id = ?").get(receiver_id);
        if (!receiverExists) {
            return res.status(404).json({ message: "Receiver not found." });
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
        // Fetch messages where the current user is either sender or receiver
        const messages = db.query(
            `SELECT id, sender_id, receiver_id, message_text, created_at, is_read
             FROM messages
             WHERE sender_id = ? OR receiver_id = ?
             ORDER BY created_at ASC`
        ).all(current_user_id, current_user_id);

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
                `SELECT id, name, email, image, is_online, last_time_online
                 FROM users
                 WHERE id IN (${placeholders})`
            ).all(...userIdsArray);
        }

        // Organize messages by conversation (with each interacted user)
        const conversations = {};
        messages.forEach(msg => {
            const otherUserId = msg.sender_id === current_user_id ? msg.receiver_id : msg.sender_id;
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

app.get('*', (req, res) => {
    res.sendFile('/usr/share/nginx/html/peoplemeetAWS/dist/index.html');
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
