require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
import { Database } from "bun:sqlite";
import bcrypt from 'bcrypt'; // For password hashing
import crypto from 'crypto'; // For generating session tokens

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
        is_online INTEGER
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


const app = express();
app.use(bodyParser.json());

const PORT = 3000;

const staticAssetsPath = '/usr/share/nginx/html/peoplemeetAWS/dist/assets';
app.use('/assets', express.static(staticAssetsPath));

app.post('/signup', async (req, res) => {
    const { email, password, name, age, sex, description } = req.body;

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


app.get('/read', (req, res) => {
    const rows = db.query("SELECT * FROM users").all();
    res.json(rows);
});

app.get('*', (req, res) => {
    res.sendFile('/usr/share/nginx/html/peoplemeetAWS/dist/index.html');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});