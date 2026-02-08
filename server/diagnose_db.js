const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath);

async function diagnose() {
    console.log("--- Starting Database Diagnosis ---");
    
    // 1. Check Table Counts
    const counts = {};
    const tables = ['projects', 'suppliers', 'project_members', 'tasks'];
    
    for (const table of tables) {
        await new Promise((resolve) => {
            db.get(`SELECT count(*) as count FROM ${table}`, (err, row) => {
                if(err) console.error(`Error counting ${table}:`, err.message);
                else {
                    console.log(`Table '${table}' count: ${row.count}`);
                    counts[table] = row.count;
                }
                resolve();
            });
        });
    }

    // 2. Check Supplier Orphans
    console.log("\n--- Checking Orphaned Suppliers ---");
    await new Promise((resolve) => {
        db.all(`SELECT s.id, s.name, s.project_id FROM suppliers s LEFT JOIN projects p ON s.project_id = p.id WHERE p.id IS NULL AND s.project_id IS NOT NULL`, (err, rows) => {
            if (err) console.error(err);
            else {
                if (rows.length === 0) console.log("No orphaned suppliers found.");
                else {
                    console.log(`Found ${rows.length} orphaned suppliers:`);
                    rows.forEach(r => console.log(`  - ID: ${r.id}, Name: ${r.name}, Invalid ProjectID: ${r.project_id}`));
                }
            }
            resolve();
        });
    });

    // 3. Check Project Data Integrity
    console.log("\n--- Checking Project Integrity ---");
    await new Promise((resolve) => {
        db.all(`SELECT id, name, manager_id FROM projects`, (err, rows) => {
            if (rows.length === 0) console.log("WARNING: No projects found!");
            else {
                 // Check if manager exists
                 rows.forEach(p => {
                     if (!p.manager_id) console.log(`Project ${p.id} (${p.name}) has no manager_id`);
                 });
            }
            resolve();
        });
    });
    
    console.log("\n--- Diagnosis Complete ---");
    db.close();
}

diagnose();
