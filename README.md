# peoplemeetAWS

To develop at mobile you need change
1. "dev": "vite", => "dev": "vite --host", // Not necessary
2. npm run dev -- --host
3. Open on mobile Network: http://{xxx.xxx.x.xxx}:5173/


# backend

start server to test
/home/ec2-user/.bun/bin/bun /home/ec2-user/peoplemeetAWS/backend/index.js

view server logs
sudo journalctl -n 20 -u bun-service

start server
sudo service bun-service start

cd /home/ec2-user/peoplemeetAWS/backend/
bun install multer
bun install cors
bun install @sendgrid/mail


# Configure service
sudo nano /etc/systemd/system/peoplemeet.service

[Unit]
Description=PeopleMeet Backend Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/peoplemeetAWS/backend
ExecStart=/usr/local/bin/bun /home/ubuntu/peoplemeetAWS/backend/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

--------

sudo systemctl restart peoplemeet

------------

# Nginx Reverse Proxy Config

server {
    listen 80;
    server_name default_server;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Necessary headers for proxying
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Forward real client IP addresses
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

