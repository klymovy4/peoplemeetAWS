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

function testEmail() {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    const emailHtml = 'Hello from people meet';
    const options = {
        from: "klymovy4roman@gmail.com",
        to: "joyview@gmail.com",
        // to: "klymovy4roman@gmail.com",
        subject: "PeopleMeet",
        html: emailHtml,
    }
    try {
        sendgrid.send(options);
        console.log('Email sent');
    } catch (error) {
        console.error('Error sending email:', error);
    }
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

// async function sendEmail() {
//     // Create a transporter object using Gmail SMTP
//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: 'peoplemeet.ua@gmail.com', // Your Gmail address
//             pass: process.env.GMAIL_PASSWORD // Your App password or Gmail password (if less secure apps is enabled)
//         }
//     });

//     // Define the email options
//     const mailOptions = {
//         from: 'peoplemeetua@gmail.com', // Sender address
//         to: 'klymovy4roman@gmail.com',   // List of recipient(s)
//         subject: 'PeopleMeet', // Subject line
//         // text: 'Hello from people meet.', // Plain text body
//         html: '<b>Here your code ' + generate4RandomNumbersForRecovery() + '</b>' // HTML body (optional)
//     };

//     try {
//         // Send the email
//         const info = await transporter.sendMail(mailOptions);
//         console.log('Email sent: ' + info.response);
//     } catch (error) {
//         console.error('Error sending email:', error);
//     }
// }

// sendEmail();
// testEmail();

const db = new Database("/home/ec2-user/db/peoplemeet.db");

// Create users table if it doesn't exist, include password field.
db.run(`
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY, 
        name TEXT, 
        email TEXT UNIQUE, 
        password TEXT, 
        age INTEGER, 
        sex TEXT, 
        description TEXT, 
        image TEXT, 
        lat REAL, 
        lng REAL, 
        is_online INTEGER,
        last_time_online DATETIME,
        recovery_code TEXT
    )
`);

// Create sessions table
db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER,
        expires_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);


function deleteExpiredTokens() {
    const now = new Date().toISOString(); // Get current time in ISO format

    try {
        const result = db.run("DELETE FROM sessions WHERE expires_at <= ?", now);
        if (result.changes > 0) {
            console.log(`Deleted ${result.changes} expired sessions.`);
        } else {
            console.log("No expired sessions to delete.");
        }
    } catch (error) {
        console.error("Error deleting expired tokens:", error);
    }
}

deleteExpiredTokens();

setInterval(deleteExpiredTokens, 60 * 60 * 1000); // Every hour (milliseconds)

function setUsersOffline() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString(); // Subtract 5 minutes in milliseconds

    try {
        // Set user offline if last_time_online is older than 5 minutes ago
        const result = db.run("UPDATE users SET is_online = 0, lat = null, lng = null WHERE is_online = 1 AND last_time_online <= ?", fiveMinutesAgo);
        if (result.changes > 0) {
            console.log(`Set ${result.changes} user offline.`);
        } else {
            console.log("No users to set offline.");
        }
    } catch (error) {
        console.error("Error setting user offline:", error);
    }
}
setInterval(setUsersOffline, 60 * 1000); // every minute


const app = express();

// Разрешаем запросы с localhost:5173
app.use(cors({
    origin: 'http://localhost:5173', // Адрес локального клиента
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // Если нужно передавать cookies или другие данные аутентификации
}));

app.use(bodyParser.json());

const PORT = 3000;

const staticAssetsPath = '/usr/share/nginx/html/peoplemeetAWS/dist/assets';
app.use('/assets', express.static(staticAssetsPath));

const staticUploadsPath = '/home/ec2-user/uploads';
app.use('/uploads', express.static(staticUploadsPath));

app.post('/send_recovery_code', async (req, res) => {
    const { email } = req.body;
    const existingUser = db.query("SELECT id FROM users WHERE email = ?").get(email);
    if (!existingUser) {
        return res.status(400).json({ message: "Email doesn't exist" });
    }
    const recoveryCode = generate4RandomNumbersForRecovery();
    const result = db.run(
        "UPDATE users SET recovery_code = ? WHERE email = ?",
        [recoveryCode, email]
    );
    return res.status(200).json({ message: "Recovery code sent to email" });
});

app.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // 1. Check if the user with this email already exists
        const existingUser = db.query("SELECT id FROM users WHERE email = ?").get(email);

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" }); // Return a 400 Bad Request error
        }

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // 3. Insert user into the database
        const result = db.run(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        if (result.changes > 0) {
            const userId = result.lastInsertRowid; // Get the ID of the newly inserted user

            // 3. Generate a session token
            const token = crypto.randomBytes(64).toString('hex');

            // 4. Store the session in the database
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [token, userId, expiresAt.toISOString()]);

            // 5. Return the token to the client
            res.json({ message: "User registered successfully", token: token, userId: userId });
        } else {
            res.status(500).json({ message: "Failed to register user" }); // Or a more specific error
        }
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "An error occurred during signup" });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find the user by email
        const user = db.query("SELECT id, password FROM users WHERE email = ?").get(email);

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" }); // 401 Unauthorized
        }

        // 2. Compare the provided password with the stored hash
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 3. Generate a new session token
        const token = crypto.randomBytes(64).toString('hex');

        // 4. Store the session (you might want to invalidate old sessions for the user)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [token, user.id, expiresAt.toISOString()]);

        // 5. Return the token and user ID to the client
        res.json({ message: "Login successful", token: token, userId: user.id });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
});

app.post('/self', async (req, res) => {
    const { token } = req.body;

    try {
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // 1. Find the session
        const session = db.query("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?").get(token, new Date().toISOString()); // Check expiry

        if (!session) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        // 2. Get the user details (excluding the password)
        const user = db.query("SELECT id, name, email, age, sex, description, image, lat, lng, is_online FROM users WHERE id = ?").get(session.user_id);

        if (!user) {  // Should not happen, but good to check
            return res.status(500).json({ message: "User not found" });
        }

        // 3. Return the user details
        res.json(user);

    } catch (error) {
        console.error("Self error:", error);
        res.status(500).json({ message: "An error occurred" });
    }
});

app.post('/profile', async (req, res) => {
    const { token, name, email, age, sex, description } = req.body;

    try {
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        const session = db.query("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?").get(token, new Date().toISOString()); // Check expiry

        if (!session) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = session.user_id;

        // Build the update query dynamically
        const updates = [];
        const values = [];

        if (name) {
            updates.push("name = ?");
            values.push(name);
        }
        if (age) {
            updates.push("age = ?");
            values.push(age);
        }
        if (sex) {
            updates.push("sex = ?");
            values.push(sex);
        }
        if (description) {
            updates.push("description = ?");
            values.push(description);
        }

        if (updates.length === 0) {
            return res.status(200).json({ message: "No updates provided" }); // Or 204 No Content
        }

        values.push(userId); // Add the WHERE clause parameter

        const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

        const result = db.run(updateQuery, values);

        if (result.changes > 0) {
            return res.json({ message: "Profile updated successfully" });
        } else {
            return res.status(500).json({ message: "Failed to update profile" }); // Likely no changes or user not found
        }

    } catch (error) {
        console.error("Self error:", error);
        res.status(500).json({ message: "An error occurred" });
    }
});

app.post('/online_users', async (req, res) => {
    const { token } = req.body;

    try {
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }
        const session = db.query("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?").get(token, new Date().toISOString()); // Check expiry
        if (!session) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        const userId = session.user_id;

        // Update the current user's last_time_online
        db.run("UPDATE users SET last_time_online = ? WHERE id = ?", [new Date().toISOString(), userId]);

        // ---- Select all users online except current userId ----
        // Select relevant user data (excluding password) for users who are online
        // and are not the user making the request.
        const onlineUsers = db.query(
            `SELECT id, name, email, age, sex, description, image, lat, lng 
             FROM users 
             WHERE is_online = 1 AND id != ?`
        ).all(userId); // Pass the current user's ID as a parameter to exclude them

        // Return the list of online users
        res.json(onlineUsers);
    }
    catch (error) {
        console.error("Self error:", error);
        res.status(500).json({ message: "An error occurred" });
    }
});

app.post('/online', async (req, res) => {
    const { token, is_online, lat, lng } = req.body;

    try {
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        const session = db.query("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?").get(token, new Date().toISOString()); // Check expiry

        if (!session) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = session.user_id;

        // Build the update query dynamically
        const updates = [];
        const values = [];

        updates.push("is_online = ?");
        values.push(is_online);

        if (lat) {
            updates.push("lat = ?");
            values.push(lat);
        }
        else {
            updates.push("lat = null");
        }

        if (lng) {
            updates.push("lng = ?");
            values.push(lng);
        }
        else {
            updates.push("lng = null");
        }

        if (updates.length === 0) {
            return res.status(200).json({ message: "No updates provided" }); // Or 204 No Content
        }

        values.push(userId); // Add the WHERE clause parameter

        const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

        const result = db.run(updateQuery, values);

        if (result.changes > 0) {
            return res.json({ message: "is_online updated successfully" });
        } else {
            return res.status(500).json({ message: "Failed to update is_online" }); // Likely no changes or user not found
        }

    } catch (error) {
        console.error("Self error:", error);
        res.status(500).json({ message: "An error occurred" });
    }
});

// Configure Multer storage (where to save the uploaded file)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/home/ec2-user/uploads/'); // Create an 'uploads' folder in your project
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExtension = file.originalname.split('.').pop(); // Get file extension
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + fileExtension); // Rename to avoid conflicts
    },
});

const upload = multer({ storage: storage }); // Create the Multer instance

function deleteOldPhoto(filePath) {
    if (!filePath) {
        console.error('No file path provided.');
        return; // Or throw an error if you prefer
    }

    // const fullPath = path.join(__dirname, filePath); // Important: Use path.join!
    const fullPath = filePath;

    fs.access(fullPath, fs.constants.F_OK, (err) => { // Check if the file exists
        if (err) {
            console.error('File does not exist:', fullPath);
            return; // Or throw an error
        }

        fs.unlink(fullPath, (err) => { // Delete the file
            if (err) {
                console.error('Error deleting file:', err);
                return; // Or throw the error
            }

            console.log('File deleted successfully:', fullPath);
        });
    });
}

app.post('/upload', upload.single('photo'), (req, res) => {  // 'photo' MUST match frontend name
    const { token } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // req.file contains information about the uploaded file
    console.log('File uploaded:', req.file);


    try {
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        const session = db.query("SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?").get(token, new Date().toISOString()); // Check expiry

        if (!session) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = session.user_id;

        const user = db.query("SELECT image FROM users WHERE id = ?").get(userId);

        if (!user) {  // Should not happen, but good to check
            return res.status(500).json({ message: "User not found" });
        }

        // remove old photo
        if (user.image) {
            deleteOldPhoto('/home/ec2-user/uploads/' + user.image);
            // console.log('/home/ec2-user/uploads/' + user.image);
        }

        // Build the update query dynamically
        const updates = [];
        const values = [];

        updates.push("image = ?");
        values.push(req.file.filename);

        if (updates.length === 0) {
            return res.status(200).json({ message: "No updates provided" }); // Or 204 No Content
        }

        values.push(userId); // Add the WHERE clause parameter

        const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;


        const result = db.run(updateQuery, values);
    } catch (error) {
        console.error("Self error:", error);
        res.status(500).json({ message: "An error occurred" });
    }

    // Respond with success and maybe some file info
    // path: req.file.path
    res.json({ message: 'File uploaded successfully!', filename: req.file.filename });  // Send back info about the file
});

app.get('*', (req, res) => {
    res.sendFile('/usr/share/nginx/html/peoplemeetAWS/dist/index.html');
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

