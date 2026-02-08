const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Add manager_id to projects if not exists
    db.run("ALTER TABLE projects ADD COLUMN manager_id INTEGER", (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding manager_id:', err.message);
        } else {
            console.log('Added manager_id to projects');
        }
    });

    // 2. Create project_members table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS project_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        user_id INTEGER,
        role TEXT DEFAULT 'MEMBER', -- PROJECT_MANAGER, MEMBER, TESTER
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
    )`, (err) => {
        if (err) console.error(err);
        else console.log('Ensured project_members table');
    });

    // 3. Migrate existing members logic if necessary
    // (Assuming previous logic might have used a different way, but since we are refactoring, we ensure this table exists)
});

db.close();
