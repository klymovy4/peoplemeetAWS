
require('dotenv').config();
// Import the Express module
const express = require('express');
const path = require('path');
import { Database } from "bun:sqlite";
const db = new Database("/home/ec2-user/db/hello.db");

// Create an instance of an Express app
const app = express();

// Define a port
const PORT = 3000;

const staticAssetsPath = '/usr/share/nginx/html/peoplemeetAWS/dist/assets';
app.use('/assets', express.static(staticAssetsPath));

app.get('/test', (req, res) => {
    // res.send('Test');
    db.run("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, text TEXT)");
    db.run("INSERT INTO messages (text) VALUES ('Hello, World 2!')");
    const row = db.query("SELECT text FROM messages").get();
    res.send(row.text);
});

app.get('/read', (req, res) => {
    const row = db.query("SELECT text FROM messages").get();
    res.send(row.text);
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
