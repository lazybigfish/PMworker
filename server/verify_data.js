const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const assert = require('assert');

const dbPath = path.resolve(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath);

async function verify() {
    console.log("--- Starting Data Verification ---");
    
    // 1. Verify Project-Supplier Linkage
    db.all(`SELECT p.name as project_name, count(s.id) as supplier_count 
            FROM projects p 
            LEFT JOIN suppliers s ON p.id = s.project_id 
            GROUP BY p.id`, (err, rows) => {
        if(err) {
            console.error("Verification Failed:", err);
            process.exit(1);
        }
        
        console.log("Project Supplier Counts:");
        let passed = true;
        rows.forEach(r => {
            console.log(`- ${r.project_name}: ${r.supplier_count} suppliers`);
            // Basic logic check: Projects should have suppliers based on our seed data
            // Project 1: 2, Project 2: 1, Project 3: 2
            if (r.project_name.includes("智慧城市") && r.supplier_count !== 2) passed = false;
            if (r.project_name.includes("CRM") && r.supplier_count !== 1) passed = false;
            if (r.project_name.includes("金融") && r.supplier_count !== 2) passed = false;
        });

        if (passed) console.log(">>> Data Integrity Check: PASS");
        else console.error(">>> Data Integrity Check: FAIL");

        // 2. Verify Foreign Keys (Manual Check since SQLite FKs might be disabled)
        db.get(`SELECT count(*) as count FROM suppliers s WHERE s.project_id NOT IN (SELECT id FROM projects)`, (err, row) => {
            if (row.count === 0) console.log(">>> Orphaned Supplier Check: PASS");
            else console.error(`>>> Orphaned Supplier Check: FAIL (${row.count} orphans)`);
            
            db.close();
        });
    });
}

verify();
