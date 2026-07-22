import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import sendgrid from '@sendgrid/mail';

type Bindings = {
    DB: D1Database;
    BUCKET: R2Bucket;
    SENDGRID_API_KEY: string;
};

type Variables = {
    userId: number;
};

const app = new Hono < { Bindings: Bindings; Variables: Variables } > ();

const MAX_THOUGHTS_LENGTH = 100;

// CORS
app.use('*', (c, next) => {
    const corsMiddleware = cors({
        origin: ['http://localhost:5173'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    return corsMiddleware(c, next);
});

// Helper Functions
function formatDateTimeForSQL(d: Date): string {
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

function generate4RandomNumbersForRecovery(): string {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    return Array.from(array, byte => (byte % 10).toString()).join('');
}

function generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sendRecoveryCodeEmail(apiKey: string, email: string, recoveryCode: string) {
    sendgrid.setApiKey(apiKey);
    const emailHtml = `<div style="text-align: center;">Code: ${recoveryCode}</div>`;
    const emailText = `Your PeopleMeet password reset code is: ${recoveryCode}`;
    await sendgrid.send({
        from: "klymovy4roman@gmail.com",
        to: email,
        subject: "PeopleMeet Password Reset Code",
        html: emailHtml,
        text: emailText
    });
}

// Auth Middleware
async function authenticateUser(c: any, next: () => Promise<void>) {
    let token: string | undefined;

    if (c.req.method === 'POST') {
        try {
            const body = await c.req.parseBody();
            token = body.token as string;
            if (!token) {
                const jsonBody = await c.req.json().catch(() => ({}));
                token = jsonBody.token;
            }
        } catch { }
    }

    if (!token) {
        return c.json({ message: "Token is required" }, 400);
    }

    const now = formatDateTimeForSQL(new Date());
    const session = await c.env.DB.prepare(
        "SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?"
    ).bind(token, now).first();

    if (!session) {
        return c.json({ message: "Invalid or expired token" }, 401);
    }

    c.set('userId', session.user_id as number);
    await next();
}

// Clean-up tasks (For Cron Trigger)
async function performCleanup(env: Bindings) {
    const now = formatDateTimeForSQL(new Date());
    const fiveMinutesAgo = formatDateTimeForSQL(new Date(Date.now() - 5 * 60 * 1000));
    const twelveHoursAgo = formatDateTimeForSQL(new Date(Date.now() - 12 * 60 * 60 * 1000));

    await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now).run();
    await env.DB.prepare("UPDATE users SET is_online = 0, lat = null, lng = null WHERE is_online = 1 AND last_time_online <= ?").bind(fiveMinutesAgo).run();
    await env.DB.prepare("DELETE FROM messages WHERE created_at <= ?").bind(twelveHoursAgo).run();
}

// --- ROUTES ---

app.post('/send_recovery_code', async (c) => {
    const { email } = await c.req.json();
    if (!email) return c.json({ message: "Email is required" }, 400);

    const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (!existingUser) return c.json({ message: "Email doesn't exist" }, 404);

    const recoveryCode = generate4RandomNumbersForRecovery();
    await c.env.DB.prepare("UPDATE users SET recovery_code = ? WHERE email = ?").bind(recoveryCode, email).run();

    await sendRecoveryCodeEmail(c.env.SENDGRID_API_KEY, email, recoveryCode);
    return c.json({ message: "Recovery code sent to email" }, 200);
});

app.post('/check_recovery_code', async (c) => {
    const { email, recoveryCode } = await c.req.json();
    if (!email || !recoveryCode) return c.json({ message: "Email and recovery code are required" }, 400);

    const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE email = ? AND recovery_code = ?").bind(email, recoveryCode).first();
    if (existingUser) {
        return c.json({ message: "Recovery code is valid" }, 200);
    }
    return c.json({ message: "Invalid email or recovery code" }, 400);
});

app.post('/change_password', async (c) => {
    const { email, recoveryCode, password } = await c.req.json();

    if (!email || !recoveryCode || !password) return c.json({ message: "Email, recovery code, and new password are required." }, 400);
    if (recoveryCode.length !== 4) return c.json({ message: "Recovery code must be 4 digits." }, 400);
    if (password.length < 4) return c.json({ message: "Password must be at least 4 characters." }, 400);

    const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE email = ? AND recovery_code = ?").bind(email, recoveryCode).first();
    if (!existingUser) return c.json({ message: "Invalid email or recovery code" }, 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    await c.env.DB.prepare("UPDATE users SET password = ?, recovery_code = NULL WHERE email = ?").bind(hashedPassword, email).run();

    return c.json({ message: "Password changed successfully" }, 200);
});

app.post('/signup', async (c) => {
    const { email, password } = await c.req.json();
    let { name } = await c.req.json();

    if (!email || !password) return c.json({ message: "Email and password are required." }, 400);
    name = name || '';

    const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existingUser) return c.json({ message: "Email already exists" }, 409);

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = formatDateTimeForSQL(new Date());

    const result = await c.env.DB.prepare(
        "INSERT INTO users (name, email, password, last_time_online) VALUES (?, ?, ?, ?)"
    ).bind(name, email, hashedPassword, now).run();

    const userId = result.meta.last_row_id;
    const token = generateToken();
    const expiresAt = formatDateTimeForSQL(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    await c.env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, userId, expiresAt).run();

    return c.json({ message: "User registered successfully", token, userId }, 201);
});

app.post('/login', async (c) => {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ message: "Email and password are required." }, 400);

    const user: any = await c.env.DB.prepare("SELECT id, password FROM users WHERE email = ?").bind(email).first();
    if (!user) return c.json({ message: "Invalid email or password" }, 401);

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return c.json({ message: "Invalid email or password" }, 401);

    await c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id).run();

    const token = generateToken();
    const expiresAt = formatDateTimeForSQL(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    await c.env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, user.id, expiresAt).run();

    return c.json({ message: "Login successful", token, userId: user.id });
});

app.post('/self', authenticateUser, async (c) => {
    const userId = c.get('userId');
    const user = await c.env.DB.prepare(
        "SELECT id, name, email, age, sex, thoughts, description, image, lat, lng, is_online, last_time_online FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) return c.json({ message: "User not found" }, 404);
    return c.json(user);
});

app.post('/profile', authenticateUser, async (c) => {
    const userId = c.get('userId');
    const { name, age, sex, description, thoughts } = await c.req.json();

    if (thoughts !== undefined && thoughts.length > MAX_THOUGHTS_LENGTH) {
        return c.json({ message: `Thoughts cannot exceed ${MAX_THOUGHTS_LENGTH} characters.` }, 400);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push("name = ?"); values.push(name); }
    if (age !== undefined) { updates.push("age = ?"); values.push(age); }
    if (sex !== undefined) { updates.push("sex = ?"); values.push(sex); }
    if (description !== undefined) { updates.push("description = ?"); values.push(description); }
    if (thoughts !== undefined) { updates.push("thoughts = ?"); values.push(thoughts); }

    if (updates.length === 0) return c.json({ message: "No updates provided" }, 200);

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    await c.env.DB.prepare(query).bind(...values).run();

    return c.json({ message: "Profile updated successfully" });
});

app.post('/online_users', authenticateUser, async (c) => {
    const userId = c.get('userId');
    const now = formatDateTimeForSQL(new Date());

    await c.env.DB.prepare("UPDATE users SET last_time_online = ? WHERE id = ?").bind(now, userId).run();

    const { results } = await c.env.DB.prepare(
        `SELECT id, name, age, sex, thoughts, description, image, lat, lng
         FROM users 
         WHERE is_online = 1 AND id != ?`
    ).bind(userId).all();

    return c.json(results);
});

app.post('/online', authenticateUser, async (c) => {
    const userId = c.get('userId');
    const { is_online, lat, lng } = await c.req.json();

    const updates: string[] = [];
    const values: any[] = [];

    if (is_online !== undefined) {
        updates.push("is_online = ?");
        values.push(is_online ? 1 : 0);
        updates.push("last_time_online = ?");
        values.push(formatDateTimeForSQL(new Date()));
    }

    if (is_online && lat !== undefined) {
        updates.push("lat = ?");
        values.push(lat);
    } else {
        updates.push("lat = NULL");
    }

    if (is_online && lng !== undefined) {
        updates.push("lng = ?");
        values.push(lng);
    } else {
        updates.push("lng = NULL");
    }

    if (updates.length === 0) return c.json({ message: "No online status updates provided" }, 200);

    values.push(userId);
    await c.env.DB.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();

    return c.json({ message: "Online status updated successfully" });
});

// Загрузка изображений в Cloudflare R2
app.post('/upload', async (c) => {
    const body = await c.req.parseBody();
    const photo = body['photo'] as File;
    const token = body['token'] as string;

    if (!photo) return c.json({ error: 'No file uploaded' }, 400);
    if (!token) return c.json({ message: "Token is required" }, 400);

    const now = formatDateTimeForSQL(new Date());
    const session: any = await c.env.DB.prepare("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?").bind(token, now).first();

    if (!session) return c.json({ message: "Invalid or expired token" }, 401);

    const userId = session.user_id;

    // Чтение существующего изображения пользователя
    const user: any = await c.env.DB.prepare("SELECT image FROM users WHERE id = ?").bind(userId).first();
    if (!user) return c.json({ message: "User not found" }, 404);

    // Удаление старого изображения из R2
    if (user.image) {
        await c.env.BUCKET.delete(user.image);
    }

    // Сохранение нового в R2
    const fileExtension = photo.name.split('.').pop();
    const filename = `photo-${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExtension}`;

    await c.env.BUCKET.put(filename, await photo.arrayBuffer(), {
        httpMetadata: { contentType: photo.type }
    });

    await c.env.DB.prepare("UPDATE users SET image = ? WHERE id = ?").bind(filename, userId).run();

    return c.json({
        message: 'File uploaded successfully!',
        filename: filename,
        filePath: `/uploads/${filename}`
    });
});

// Отдача изображений из R2
app.get('/uploads/:filename', async (c) => {
    const filename = c.req.param('filename');
    const object = await c.env.BUCKET.get(filename);

    if (!object) return c.text('File Not Found', 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new Response(object.body, { headers });
});

app.post('/send_message', authenticateUser, async (c) => {
    const sender_id = c.get('userId');
    const { receiver_id, message_text } = await c.req.json();

    if (!receiver_id || !message_text || message_text.trim() === "") {
        return c.json({ message: "Receiver ID and message text are required." }, 400);
    }

    if (sender_id === Number(receiver_id)) {
        return c.json({ message: "Cannot send message to yourself." }, 400);
    }

    const receiverExists = await c.env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(receiver_id).first();
    if (!receiverExists) return c.json({ message: "Receiver not found." }, 404);

    const result = await c.env.DB.prepare(
        "INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?)"
    ).bind(sender_id, receiver_id, message_text).run();

    const newMessage = await c.env.DB.prepare("SELECT * FROM messages WHERE id = ?").bind(result.meta.last_row_id).first();

    return c.json({ message: "Message sent successfully", sentMessage: newMessage }, 201);
});

app.post('/read_messages', authenticateUser, async (c) => {
    const current_user_id = c.get('userId');
    const { chat_partner_id } = await c.req.json();

    await c.env.DB.prepare(
        "UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0"
    ).bind(current_user_id, chat_partner_id).run();

    return c.json({ message: "Messages marked as read." }, 200);
});

app.post('/get_messages', authenticateUser, async (c) => {
    const current_user_id = c.get('userId');

    const { results: messages }: any = await c.env.DB.prepare(
        `SELECT id, sender_id, receiver_id, message_text, created_at, is_read
         FROM messages
         WHERE sender_id = ? OR receiver_id = ?
         ORDER BY created_at ASC`
    ).bind(current_user_id, current_user_id).all();

    const interactedUserIds = new Set < number > ();
    messages.forEach((msg: any) => {
        if (msg.sender_id !== current_user_id) interactedUserIds.add(msg.sender_id);
        if (msg.receiver_id !== current_user_id) interactedUserIds.add(msg.receiver_id);
    });

    const userIdsArray = Array.from(interactedUserIds);
    let interactedUsers: any[] = [];

    if (userIdsArray.length > 0) {
        const placeholders = userIdsArray.map(() => '?').join(',');
        const { results } = await c.env.DB.prepare(
            `SELECT id, name, age, sex, description, image, is_online, last_time_online
             FROM users
             WHERE id IN (${placeholders})`
        ).bind(...userIdsArray).all();
        interactedUsers = results;
    }

    const conversations: Record<string, any[]> = {};
    messages.forEach((msg: any) => {
        const otherUserId = msg.sender_id === current_user_id ? msg.receiver_id : msg.sender_id;
        if (!conversations[otherUserId]) conversations[otherUserId] = [];
        conversations[otherUserId].push(msg);
    });

    const usersMap: Record<string, any> = {};
    interactedUsers.forEach((user: any) => {
        usersMap[user.id] = user;
    });

    return c.json({ messages: conversations, users: usersMap });
});

app.post('/remove_conversation', authenticateUser, async (c) => {
    const current_user_id = c.get('userId');
    const { chat_partner_id } = await c.req.json();

    if (!chat_partner_id) return c.json({ message: "chat_partner_id is required." }, 400);

    const partnerExists: any = await c.env.DB.prepare("SELECT id, name FROM users WHERE id = ?").bind(chat_partner_id).first();
    if (!partnerExists) return c.json({ message: "Chat partner not found." }, 404);

    const result = await c.env.DB.prepare(
        `DELETE FROM messages 
         WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`
    ).bind(current_user_id, chat_partner_id, chat_partner_id, current_user_id).run();

    return c.json({
        message: `Successfully removed conversation with user "${partnerExists.name}". ${result.meta.changes} messages deleted.`
    });
});

app.post('/send_thoughts', authenticateUser, async (c) => {
    const { thoughts } = await c.req.json();
    const userId = c.get('userId');

    if (thoughts === undefined) return c.json({ message: "Thoughts are required." }, 400);
    if (thoughts.length > MAX_THOUGHTS_LENGTH) {
        return c.json({ message: `Thoughts cannot exceed ${MAX_THOUGHTS_LENGTH} characters.` }, 400);
    }

    await c.env.DB.prepare("UPDATE users SET thoughts = ? WHERE id = ?").bind(thoughts, userId).run();
    return c.json({ message: "Thoughts updated successfully" });
});

// Cloudflare Export (Worker & Scheduled Cron Tasks handler)
export default {
    fetch: app.fetch,
    async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
        ctx.waitUntil(performCleanup(env));
    },
};