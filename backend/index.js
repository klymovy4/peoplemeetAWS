
require('dotenv').config();
// Import the Express module
const express = require('express');
const path = require('path');

// Create an instance of an Express app
const app = express();

// Define a port
const PORT = 3000;

const staticAssetsPath = '/usr/share/nginx/html/peoplemeetAWS/dist/assets';
app.use('/assets', express.static(staticAssetsPath));

app.get('/test', (req, res) => {
    res.send('Test');
});

// Define a simple route
app.get('*', (req, res) => {
    //  res.send('Hello, World!');
    res.sendFile('/usr/share/nginx/html/peoplemeetAWS/dist/index.html');
});


//app.get('/', (req, res) => {
//res.send('Hello, World!');
//    res.sendFile('/usr/share/nginx/html/peoplemeetAWS/dist/index.html');
//});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
