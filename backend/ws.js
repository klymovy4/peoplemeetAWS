const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
	console.log('Client connected');

	ws.on('message', message => {
		console.log(`Received message: ${message}`);

		// Echo the message back to the client
		ws.send(`Server received: ${message}`);
	});

	ws.on('close', () => {
		console.log('Client disconnected');
	});

	ws.on('error', error => {
		console.error(`WebSocket error: ${error}`);
	});

	// Send a message to the client on connection
	ws.send('Welcome to the WebSocket server!');
});

console.log('WebSocket server started on port 8080');