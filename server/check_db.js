const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
        return;
    }
});

db.serialize(() => {
    db.all("SELECT id, username, password_hash, status FROM users WHERE username = 'admin'", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Admin User Info:', JSON.stringify(rows, null, 2));
        }
    });
});

db.close();
