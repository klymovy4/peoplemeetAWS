
require('dotenv').config();
// Import the Express module
const express = require('express');
const path = require('path');
import { Database } from "bun:sqlite";
const db = new Database("/home/ec2-user/db/peoplemeet.db");
db.run("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT, email TEXT, password TEXT, age INTEGER, sex TEXT, description TEXT, image TEXT, lat REAL, lng REAL, is_online INTEGER)");

// insert into users (name,email,age,sex,description,image,lat,lng, is_online) VALUES ('vasya','vasya@gmail.com',50,'male','just vasya', 'vasya.jpg',49.39898288068253,49.39898288068253,TRUE);

// Create an instance of an Express app
const app = express();

// Define a port
const PORT = 3000;

const staticAssetsPath = '/usr/share/nginx/html/peoplemeetAWS/dist/assets';
app.use('/assets', express.static(staticAssetsPath));

app.get('/signup_process', (req, res) => {
    const { email, password } = req.body; // Extract data from POST request
    console.log(`Received: ${email}, ${password}`);
    res.json({ message: "User registered successfully", data: req.body });
});

app.get('/read', (req, res) => {
    const rows = db.query("SELECT * FROM users").all();
    res.json(rows);
});

// Define a simple route
app.get('*', (req, res) => {
    //  res.send('Hello, World!');
    res.sendFile('/usr/share/nginx/html/peoplemeetAWS/dist/index.html');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
