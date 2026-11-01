// Daily SQLite backup, run by cron:
//   15 3 * * * /home/ubuntu/.bun/bin/bun /home/ubuntu/peoplemeetAWS/backend/backup-db.js >> /home/ubuntu/backups/backup.log 2>&1
// Uses VACUUM INTO, which writes a consistent copy even while the API is writing (WAL mode),
// unlike a plain `cp` of the database file. Keeps the last KEEP_DAYS backups.
import { Database } from "bun:sqlite";
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || "/home/ubuntu/db/peoplemeet.db";
const BACKUP_DIR = process.env.BACKUP_DIR || "/home/ubuntu/backups";
const KEEP_DAYS = 14;

fs.mkdirSync(BACKUP_DIR, { recursive: true });

const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
const target = path.join(BACKUP_DIR, `peoplemeet-${stamp}.db`);
if (fs.existsSync(target)) fs.unlinkSync(target); // VACUUM INTO refuses to overwrite

const db = new Database(DB_PATH, { readonly: true });
db.run(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
db.close();

// Sanity check: the copy opens and has the users table
const copy = new Database(target, { readonly: true });
const users = copy.query("SELECT COUNT(*) AS n FROM users").get().n;
copy.close();

// Remove backups older than KEEP_DAYS
const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
for (const file of fs.readdirSync(BACKUP_DIR)) {
    if (!/^peoplemeet-\d{4}-\d{2}-\d{2}\.db$/.test(file)) continue;
    const full = path.join(BACKUP_DIR, file);
    if (fs.statSync(full).mtimeMs < cutoff) fs.unlinkSync(full);
}

console.log(`${new Date().toISOString()} backup ok: ${target} (${fs.statSync(target).size} bytes, ${users} users)`);
