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
