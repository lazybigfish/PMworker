const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath);

const suppliers = [
    // For Project 1: 智慧城市交通管理系统
    {
        name: "海康威视数字技术股份有限公司",
        module: "摄像头与监控硬件",
        amount: 1200000,
        contact_person: "张伟",
        phone: "13800138001",
        email: "zhangwei@hikvision.test",
        project_index: 0
    },
    {
        name: "阿里云计算有限公司",
        module: "云服务器与数据存储",
        amount: 800000,
        contact_person: "李娜",
        phone: "13900139002",
        email: "lina@aliyun.test",
        project_index: 0
    },
    // For Project 2: 企业级CRM客户关系管理平台
    {
        name: "Salesforce中国",
        module: "CRM核心引擎授权",
        amount: 500000,
        contact_person: "Mike Chen",
        phone: "13700137003",
        email: "mike@salesforce.test",
        project_index: 1
    },
    // For Project 3: 金融风控数据中台
    {
        name: "同盾科技",
        module: "反欺诈数据服务",
        amount: 1500000,
        contact_person: "王强",
        phone: "13600136004",
        email: "wangqiang@tongdun.test",
        project_index: 2
    },
    {
        name: "Oracle甲骨文",
        module: "数据库许可证",
        amount: 2000000,
        contact_person: "赵敏",
        phone: "13500135005",
        email: "zhaomin@oracle.test",
        project_index: 2
    }
];

db.serialize(() => {
    console.log("Cleaning Suppliers Data...");
    db.run("DELETE FROM suppliers");
    db.run("DELETE FROM sqlite_sequence WHERE name='suppliers'");
    
    // Log cleanup
    db.run(`INSERT INTO audit_logs (username, action, target_module, details) VALUES (?, ?, ?, ?)`,
        ['system', 'CLEANUP', 'SUPPLIER', 'Cleared all suppliers for re-seeding']);

    console.log("Fetching Projects...");
    db.all("SELECT id, name FROM projects ORDER BY id ASC", (err, projects) => {
        if (err) {
            console.error(err);
            return;
        }

        if (projects.length === 0) {
            console.error("No projects found to link suppliers to!");
            return;
        }

        console.log("Seeding Suppliers...");
        const stmt = db.prepare(`INSERT INTO suppliers (project_id, name, module, amount, contact_person, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)`);

        suppliers.forEach(s => {
            const project = projects[s.project_index];
            if (project) {
                stmt.run([project.id, s.name, s.module, s.amount, s.contact_person, s.phone, s.email], (err) => {
                    if (err) console.error(err);
                    else console.log(`Added supplier ${s.name} to project ${project.name}`);
                });
            }
        });
        
        stmt.finalize();
        console.log("Supplier Seeding Completed.");
    });
});

// db.close() handled by process exit usually, but here explicit
// setTimeout(() => db.close(), 1000); 
