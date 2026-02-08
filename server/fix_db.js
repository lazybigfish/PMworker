const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS project_members", (err) => {
        if(err) console.error(err);
        else console.log("Dropped project_members");
    });

    db.run(`CREATE TABLE project_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        user_id INTEGER,
        role TEXT DEFAULT 'MEMBER', 
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
    )`, (err) => {
        if (err) console.error(err);
        else console.log('Recreated project_members with UNIQUE constraint');
    });
});

db.close();
