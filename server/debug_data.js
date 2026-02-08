const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- Checking Projects ---");
    db.all("SELECT * FROM projects", (err, rows) => {
        if(err) console.error(err);
        else console.log(rows);
    });

    console.log("--- Checking Project Members ---");
    db.all("SELECT * FROM project_members", (err, rows) => {
        if(err) console.error(err);
        else console.log(rows);
    });
    
    console.log("--- Checking Users ---");
    db.all("SELECT id, username, real_name FROM users", (err, rows) => {
        if(err) console.error(err);
        else console.log(rows);
    });
});

// db.close();
