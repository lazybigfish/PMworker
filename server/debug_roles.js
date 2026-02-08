const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- Checking User Roles ---");
    db.all("SELECT ur.*, r.code FROM user_roles ur JOIN roles r ON ur.role_id = r.id", (err, rows) => {
        if(err) console.error(err);
        else console.log(rows);
    });
});
