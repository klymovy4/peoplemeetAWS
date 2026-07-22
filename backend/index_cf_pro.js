import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';

const app = new Hono();
const MAX_THOUGHTS_LENGTH = 100;

app.use('*', cors({
    origin: 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Хелперы
function formatDateTimeForSQL(d) {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function generate4RandomNumbersForRecovery() {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateToken() {
    const array = new Uint8Array(64);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sendRecoveryCodeEmail(email, recoveryCode, apiKey) {
    const emailHtml = `<div style="text-align: center;">Code: ${recoveryCode}</div>`;
    const emailText = `Your PeopleMeet password reset code is: ${recoveryCode}`;
    
    await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: "klymovy4roman@gmail.com" },
            subject: "PeopleMeet Password Reset Code",
            content: [
                { type: "text/plain", value: emailText },
                { type: "text/html", value: emailHtml }
            ]
        })
    });
}

// Middleware для аутентификации
async function authenticateUser(c, next) {
    // Пытаемся получить body, если это не multipart/form-data
    let token;
    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
        const formData = await c.req.parseBody();
        token = formData['token'];
    } else {
        const body = await c.req.json().catch(() => ({}));
        token = body.token;
    }

    if (!token) return c.json({ message: "Token is required" }, 400);

    const session = await c.env.DB.prepare(
        "SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?"
    ).bind(token, formatDateTimeForSQL(new Date())).first();

    if (!session) return c.json({ message: "Invalid or expired token" }, 401);

    c.set('userId', session.user_id);
    await next();
}

// === РОУТЫ ===

app.post('/send_recovery_code', async (c) => {
    const { email } = await c.req.json();
    if (!email) return c.json({ message: "Email is required" }, 400);

    const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (!existingUser) return c.json({ message: "Email doesn't exist" }, 404);

    const recoveryCode = generate4RandomNumbersForRecovery();
    await c.env.DB.prepare("UPDATE users SET recovery_code = ? WHERE email = ?").bind(recoveryCode, email).run();
    
    c.executionCtx.waitUntil(sendRecoveryCodeEmail(email, recoveryCode, c.env.SENDGRID_API_KEY));
    return c.json({ message: "Recovery code sent to email" });
});

app.post('/check_recovery_code', async (c) => {
    const { email, recoveryCode } = await c.req.json();
    const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE email = ? AND recovery_code = ?").bind(email, recoveryCode).first();
    return existingUser ? c.json({ message: "Recovery code is valid" }) : c.json({ message: "Invalid email or recovery code" }, 400);
});

app.post('/change_password', async (c) => {
    const { email, recoveryCode, password } = await c.req.json();
    if (!email || !recoveryCode || !password || recoveryCode.length !== 4 || password.length < 4) {
        return c.json({ message: "Invalid input" }, 400);
    }

    const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE email = ? AND recovery_code = ?").bind(email, recoveryCode).first();
    if (existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await c.env.DB.prepare("UPDATE users SET password = ?, recovery_code = NULL WHERE email = ?").bind(hashedPassword, email).run();
        return c.json({ message: "Password changed successfully" });
    }
    return c.json({ message: "Invalid email or recovery code" }, 400);
});

app.post('/signup', async (c) => {
    let { email, password, name } = await c.req.json();
    if (!email || !password) return c.json({ message: "Email and password are required." }, 400);
    name = name || '';

    const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existingUser) return c.json({ message: "Email already exists" }, 409);

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await c.env.DB.prepare(
        "INSERT INTO users (name, email, password, last_time_online) VALUES (?, ?, ?, ?) RETURNING id"
    ).bind(name, email, hashedPassword, formatDateTimeForSQL(new Date())).first();

    if (result) {
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await c.env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, result.id, formatDateTimeForSQL(expiresAt)).run();
        return c.json({ message: "User registered successfully", token, userId: result.id }, 201);
    }
    return c.json({ message: "Failed to register user" }, 500);
});

app.post('/login', async (c) => {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ message: "Email and password are required." }, 400);

    const user = await c.env.DB.prepare("SELECT id, password FROM users WHERE email = ?").bind(email).first();
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return c.json({ message: "Invalid email or password" }, 401);
    }

    await c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id).run();
    
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await c.env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, user.id, formatDateTimeForSQL(expiresAt)).run();

    return c.json({ message: "Login successful", token, userId: user.id });
});

app.post('/self', authenticateUser, async (c) => {
    const userId = c.get('userId');
    const user = await c.env.DB.prepare("SELECT id, name, email, age, sex, thoughts, description, image, lat, lng, is_online, last_time_online FROM users WHERE id = ?").bind(userId).first();
    return user ? c.json(user) : c.json({ message: "User not found" }, 404);
});

app.post('/profile', authenticateUser, async (c) => {
    const { name, age, sex, description, thoughts } = await c.req.json();
    const userId = c.get('userId');

    if (thoughts !== undefined && thoughts.length > MAX_THOUGHTS_LENGTH) {
        return c.json({ message: `Thoughts cannot exceed ${MAX_THOUGHTS_LENGTH} characters.` }, 400);
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push("name = ?"); values.push(name); }
    if (age !== undefined) { updates.push("age = ?"); values.push(age); }
    if (sex !== undefined) { updates.push("sex = ?"); values.push(sex); }
    if (description !== undefined) { updates.push("description = ?"); values.push(description); }
    if (thoughts !== undefined) { updates.push("thoughts = ?"); values.push(thoughts); }

    if (updates.length === 0) return c.json({ message: "No updates provided" });

    values.push(userId);
    await c.env.DB.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    
    return c.json({ message: "Profile updated successfully" });
});

app.post('/online_users', authenticateUser, async (c) => {
    const userId = c.get('userId');
    await c.env.DB.prepare("UPDATE users SET last_time_online = ? WHERE id = ?").bind(formatDateTimeForSQL(new Date()), userId).run();
    const { results } = await c.env.DB.prepare("SELECT id, name, age, sex, thoughts, description, image, lat, lng FROM users WHERE is_online = 1 AND id != ?").bind(userId).all();
    return c.json(results);
});

// Загрузка фото в R2 Cloudflare
app.post('/upload', authenticateUser, async (c) => {
    const userId = c.get('userId');
    const formData = await c.req.parseBody();
    const file = formData['photo'];

    if (!file || !(file instanceof File)) {
        return c.json({ error: 'No file uploaded' }, 400);
    }

    const user = await c.env.DB.prepare("SELECT image FROM users WHERE id = ?").bind(userId).first();
    if (!user) return c.json({ message: "User not found" }, 404);

    // Удаляем старое фото из R2, если было
    if (user.image) {
        c.executionCtx.waitUntil(c.env.BUCKET.delete(user.image));
    }

    // Сохраняем новое фото в R2
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = file.name.split('.').pop();
    const filename = `photo-${uniqueSuffix}.${extension}`;

    await c.env.BUCKET.put(filename, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type }
    });

    await c.env.DB.prepare("UPDATE users SET image = ? WHERE id = ?").bind(filename, userId).run();
    
    // Раздача картинок будет происходить с привязанного домена R2 или через Worker
    return c.json({ message: 'File uploaded successfully!', filename, filePath: `/uploads/${filename}` });
});

// Роут для отдачи изображений из R2 (заменяет express.static)
app.get('/uploads/:filename', async (c) => {
    const filename = c.req.param('filename');
    const object = await c.env.BUCKET.get(filename);
    if (!object) return c.text('Not found', 404);
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    return new Response(object.body, { headers });
});


// === Остальные методы чата (get_messages, send_message) ===
app.post('/send_message', authenticateUser, async (c) => {
    const sender_id = c.get('userId');
    const { receiver_id, message_text } = await c.req.json();

    if (!receiver_id || !message_text) return c.json({ message: "Invalid input" }, 400);
    if (sender_id === parseInt(receiver_id)) return c.json({ message: "Cannot send to yourself" }, 400);

    const result = await c.env.DB.prepare("INSERT INTO messages (sender_id, receiver_id, message_text) VALUES (?, ?, ?) RETURNING *")
        .bind(sender_id, receiver_id, message_text).first();

    return c.json({ message: "Message sent", sentMessage: result }, 201);
});

app.post('/get_messages', authenticateUser, async (c) => {
    const userId = c.get('userId');
    const { results: messages } = await c.env.DB.prepare(`SELECT * FROM messages WHERE sender_id = ? OR receiver_id = ? ORDER BY created_at ASC`).bind(userId, userId).all();

    const interactedUserIds = [...new Set(messages.flatMap(m => [m.sender_id, m.receiver_id]).filter(id => id !== userId))];
    let usersMap = {};

    if (interactedUserIds.length > 0) {
        const placeholders = interactedUserIds.map(() => '?').join(',');
        const { results: users } = await c.env.DB.prepare(`SELECT id, name, age, sex, description, image, is_online, last_time_online FROM users WHERE id IN (${placeholders})`).bind(...interactedUserIds).all();
        users.forEach(u => usersMap[u.id] = u);
    }

    const conversations = {};
    messages.forEach(msg => {
        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        if (!conversations[otherId]) conversations[otherId] = [];
        conversations[otherId].push(msg);
    });

    return c.json({ messages: conversations, users: usersMap });
});


// Export Cloudflare Worker (Fetch handler + Cron Triggers)
export default {
    fetch: app.fetch,
    async scheduled(event, env, ctx) {
        const now = new Date();
        const sqlNow = formatDateTimeForSQL(now);
        
        // Каждую минуту: пользователи оффлайн
        const fiveMinsAgo = formatDateTimeForSQL(new Date(now.getTime() - 5 * 60 * 1000));
        await env.DB.prepare("UPDATE users SET is_online = 0, lat = null, lng = null WHERE is_online = 1 AND last_time_online <= ?").bind(fiveMinsAgo).run();

        // Если сработал крон в начале часа (или проверяем минуты)
        if (now.getMinutes() === 0) {
            // Удаляем сессии
            await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(sqlNow).run();
            // Удаляем старые сообщения
            const twelveHoursAgo = formatDateTimeForSQL(new Date(now.getTime() - 12 * 60 * 60 * 1000));
            await env.DB.prepare("DELETE FROM messages WHERE created_at <= ?").bind(twelveHoursAgo).run();
        }
    }
};