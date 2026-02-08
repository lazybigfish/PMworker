const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath);

const projects = [
    {
        name: "智慧城市交通管理系统",
        description: "基于AI和大数据分析的城市交通流量监控与优化系统，旨在缓解拥堵，提升出行效率。",
        department: "智慧城市事业部",
        customer: "市交通局",
        start_date: "2024-01-10",
        end_date: "2024-12-30",
        budget: 5000000,
        priority: "HIGH",
        status: "IN_PROGRESS",
        health_score: 92,
        manager_id: 1 // admin
    },
    {
        name: "企业级CRM客户关系管理平台",
        description: "为大型零售企业定制的CRM系统，集成全渠道会员管理、精准营销与销售自动化功能。",
        department: "企业软件部",
        customer: "环球百货集团",
        start_date: "2024-03-01",
        end_date: "2024-09-30",
        budget: 2000000,
        priority: "MEDIUM",
        status: "PLANNING",
        health_score: 100,
        manager_id: 2 // alice
    },
    {
        name: "金融风控数据中台",
        description: "构建高性能数据中台，支持实时交易风控、反欺诈检测及信用评分模型。",
        department: "金融科技部",
        customer: "未来银行",
        start_date: "2023-11-01",
        end_date: "2024-06-30",
        budget: 8500000,
        priority: "HIGH",
        status: "IN_PROGRESS",
        health_score: 85,
        manager_id: 1
    }
];

const tasksData = [
    // Project 1 Tasks
    [
        { name: "需求调研与分析", phase: "Requirement", status: "COMPLETED", priority: "HIGH", start_date: "2024-01-10", end_date: "2024-01-25", progress: 100 },
        { name: "系统架构设计", phase: "Design", status: "COMPLETED", priority: "HIGH", start_date: "2024-01-26", end_date: "2024-02-15", progress: 100 },
        { name: "交通流量算法开发", phase: "Development", status: "IN_PROGRESS", priority: "HIGH", start_date: "2024-02-16", end_date: "2024-05-20", progress: 45 },
        { name: "前端监控大屏开发", phase: "Development", status: "PENDING", priority: "MEDIUM", start_date: "2024-04-01", end_date: "2024-06-01", progress: 0 },
    ],
    // Project 2 Tasks
    [
        { name: "竞品分析报告", phase: "Requirement", status: "IN_PROGRESS", priority: "MEDIUM", start_date: "2024-03-01", end_date: "2024-03-15", progress: 60 },
        { name: "UI/UX 原型设计", phase: "Design", status: "PENDING", priority: "HIGH", start_date: "2024-03-16", end_date: "2024-04-10", progress: 0 },
    ],
    // Project 3 Tasks
    [
        { name: "数据采集模块上线", phase: "Milestone", status: "COMPLETED", priority: "HIGH", start_date: "2023-11-01", end_date: "2024-01-15", progress: 100 },
        { name: "风控规则引擎优化", phase: "Development", status: "IN_PROGRESS", priority: "HIGH", start_date: "2024-01-20", end_date: "2024-04-30", progress: 80 },
        { name: "压力测试", phase: "Testing", status: "PENDING", priority: "HIGH", start_date: "2024-05-01", end_date: "2024-05-20", progress: 0 },
    ]
];

db.serialize(() => {
    console.log("Cleaning old data...");
    db.run("DELETE FROM projects");
    db.run("DELETE FROM tasks");
    db.run("DELETE FROM project_members");
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('projects', 'tasks', 'project_members')");

    console.log("Inserting new data...");
    
    const insertProject = db.prepare("INSERT INTO projects (name, description, department, customer, start_date, end_date, budget, priority, status, health_score, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const insertTask = db.prepare("INSERT INTO tasks (project_id, name, description, phase, status, priority, start_date, end_date, progress, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const insertMember = db.prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)");

    let completed = 0;

    projects.forEach((p, index) => {
        insertProject.run([p.name, p.description, p.department, p.customer, p.start_date, p.end_date, p.budget, p.priority, p.status, p.health_score, p.manager_id], function(err) {
            if (err) console.error(err);
            const projectId = this.lastID;
            
            insertMember.run(projectId, p.manager_id, 'PROJECT_MANAGER');
            const otherUser = p.manager_id === 1 ? 2 : 1;
            insertMember.run(projectId, otherUser, 'MEMBER');

            const tasks = tasksData[index];
            if (tasks) {
                tasks.forEach(t => {
                    const assignee = Math.random() > 0.5 ? p.manager_id : otherUser;
                    insertTask.run([projectId, t.name, t.name + "的具体实施工作", t.phase, t.status, t.priority, t.start_date, t.end_date, t.progress, assignee]);
                });
            }
            
            completed++;
            if (completed === projects.length) {
                console.log("All projects inserted.");
                insertProject.finalize();
                insertTask.finalize();
                insertMember.finalize();
                db.close();
            }
        });
    });
});
