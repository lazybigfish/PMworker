const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pm_system.db');
const db = new sqlite3.Database(dbPath);

console.log('Connected to database for seeding...');

db.serialize(() => {
    // 1. Clear Data
    console.log('Clearing existing simulation data...');
    const tables = [
        'task_dependencies',
        'tasks',
        'project_functions',
        'suppliers',
        'project_milestones',
        'project_members',
        'projects',
        'audit_logs',
        'documents'
    ];
    
    tables.forEach(table => {
        db.run(`DELETE FROM ${table}`);
        db.run(`DELETE FROM sqlite_sequence WHERE name='${table}'`); // Reset Auto Increment
    });

    // 2. Insert Projects
    console.log('Seeding Projects...');
    const projects = [
        { 
            name: '智慧城市交通管理系统', 
            description: '基于AI和大数据技术的全城交通流量实时监控与智能调度系统，旨在降低拥堵率20%。', 
            department: 'IT部', 
            customer: '市交通管理局', 
            start_date: '2023-01-10', 
            end_date: '2023-12-30', 
            budget: 5000000, 
            priority: 'HIGH', 
            current_phase: '实施阶段', 
            manager_id: 1 
        },
        { 
            name: '企业级CRM客户关系管理平台升级', 
            description: '替换旧版CRM系统，集成全渠道营销与销售自动化功能，支持私有化部署。', 
            department: '研发部', 
            customer: '集团总部', 
            start_date: '2023-03-01', 
            end_date: '2023-09-30', 
            budget: 2000000, 
            priority: 'MEDIUM', 
            current_phase: '启动阶段', 
            manager_id: 1 
        },
        { 
            name: '金融风控数据中台建设项目', 
            description: '构建统一的数据中台，整合内部交易数据与外部征信数据，提供实时风控API服务。', 
            department: '数据中心', 
            customer: '某商业银行', 
            start_date: '2023-05-15', 
            end_date: '2024-05-14', 
            budget: 8500000, 
            priority: 'HIGH', 
            current_phase: '进场前阶段', 
            manager_id: 2 
        },
        { 
            name: '移动端App重构项目', 
            description: '使用Flutter重构现有iOS和Android应用，提升跨平台开发效率与用户体验。', 
            department: '移动开发部', 
            customer: '产品运营中心', 
            start_date: '2023-02-20', 
            end_date: '2023-08-20', 
            budget: 1200000, 
            priority: 'LOW', 
            current_phase: '初验阶段', 
            manager_id: 2 
        }
    ];

    const projectStmt = db.prepare("INSERT INTO projects (name, description, department, customer, start_date, end_date, budget, priority, current_phase, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    projects.forEach((p, index) => {
        projectStmt.run(p.name, p.description, p.department, p.customer, p.start_date, p.end_date, p.budget, p.priority, p.current_phase, p.manager_id, function(err) {
            if (err) console.error(err);
            const projectId = this.lastID;
            
            // Seed Project Functions
            seedFunctions(projectId, index);
            
            // Seed Suppliers
            seedSuppliers(projectId, index);
            
            // Seed Milestones (Init from template logic simulation)
            // We can skip detailed milestones or insert a few key ones
            seedMilestones(projectId);
        });
    });
    projectStmt.finalize();
});

function seedFunctions(projectId, projectIndex) {
    // Different functions for different projects
    let functions = [];
    if (projectIndex === 0) { // Smart City
        functions = [
            { name: '视频监控子系统', budget: 1500000, level: 1, children: [
                { name: '高清视频采集', budget: 500000 },
                { name: '人脸识别模块', budget: 600000 },
                { name: '车辆违章抓拍', budget: 400000 }
            ]},
            { name: '交通信号控制子系统', budget: 2000000, level: 1, children: [
                { name: '智能信号灯控制', budget: 1000000 },
                { name: '绿波带优化算法', budget: 800000 },
                { name: '应急车辆优先通行', budget: 200000 }
            ]},
            { name: '指挥中心大屏可视化', budget: 500000, level: 1, children: [] }
        ];
    } else if (projectIndex === 1) { // CRM
        functions = [
            { name: '客户管理模块', budget: 300000, level: 1, children: [
                { name: '客户公海池', budget: 100000 },
                { name: '360度客户视图', budget: 200000 }
            ]},
            { name: '销售自动化(SFA)', budget: 800000, level: 1, children: [
                { name: '商机管理', budget: 300000 },
                { name: '报价单生成', budget: 200000 },
                { name: '合同审批流', budget: 300000 }
            ]}
        ];
    } else {
        functions = [
            { name: '基础架构搭建', budget: 500000, level: 1, children: [] },
            { name: '核心业务逻辑开发', budget: 1000000, level: 1, children: [] }
        ];
    }

    insertFunctions(projectId, null, functions);
}

function insertFunctions(projectId, parentId, list) {
    const stmt = db.prepare("INSERT INTO project_functions (project_id, parent_id, name, budget, content, level) VALUES (?, ?, ?, ?, ?, ?)");
    list.forEach(f => {
        stmt.run(projectId, parentId, f.name, f.budget, f.name + '的详细功能描述...', f.level || (parentId ? 2 : 1), function(err) {
            const funcId = this.lastID;
            if (f.children && f.children.length > 0) {
                insertFunctions(projectId, funcId, f.children);
            }
            
            // Seed Tasks linked to functions
            seedTasks(projectId, funcId, f.name);
        });
    });
    stmt.finalize();
}

function seedSuppliers(projectId, projectIndex) {
    const suppliers = [];
    if (projectIndex === 0) {
        suppliers.push(
            { name: '海康威视', module: '视频监控子系统', amount: 1200000, contact: '张伟', phone: '13800138001', status: 'ACTIVE' },
            { name: '阿里云计算', module: '云服务器与数据存储', amount: 800000, contact: '李娜', phone: '13900139002', status: 'ACTIVE' },
            { name: '华为技术', module: '网络设备', amount: 1500000, contact: '王强', phone: '13700137003', status: 'PROJECT_CONSTRUCTION' }
        );
    } else if (projectIndex === 1) {
        suppliers.push(
            { name: 'Salesforce中国', module: 'CRM核心引擎授权', amount: 500000, contact: 'Mike Chen', phone: '13600136004', status: 'ACTIVE' },
            { name: 'Oracle甲骨文', module: '数据库许可证', amount: 200000, contact: '赵敏', phone: '13500135005', status: 'FINISHED' }
        );
    }
    
    const stmt = db.prepare("INSERT INTO suppliers (project_id, name, module, amount, contact_person, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    suppliers.forEach(s => {
        stmt.run(projectId, s.name, s.module, s.amount, s.contact, s.phone, s.status);
    });
    stmt.finalize();
}

function seedTasks(projectId, functionId, functionName) {
    // Generate 1-2 tasks per function
    const tasks = [
        { name: functionName + ' - 需求确认', phase: '需求分析', status: 'COMPLETED', priority: 'HIGH', duration: 5 },
        { name: functionName + ' - 详细设计', phase: '设计', status: 'IN_PROGRESS', priority: 'MEDIUM', duration: 10 },
        { name: functionName + ' - 代码开发', phase: '开发', status: 'PENDING', priority: 'HIGH', duration: 20 },
        { name: functionName + ' - 单元测试', phase: '测试', status: 'PENDING', priority: 'LOW', duration: 5 }
    ];

    const stmt = db.prepare("INSERT INTO tasks (project_id, function_id, name, phase, status, priority, duration, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    // Insert first task
    const t1 = tasks[0];
    stmt.run(projectId, functionId, t1.name, t1.phase, t1.status, t1.priority, t1.duration, '2023-01-15', '2023-01-20', function(err) {
        const t1Id = this.lastID;
        
        // Insert second task
        const t2 = tasks[1];
        stmt.run(projectId, functionId, t2.name, t2.phase, t2.status, t2.priority, t2.duration, '2023-01-21', '2023-01-31', function(err) {
            const t2Id = this.lastID;
            
            // Add dependency: T2 depends on T1
            db.run("INSERT INTO task_dependencies (task_id, predecessor_id) VALUES (?, ?)", [t2Id, t1Id]);
            
            // Insert third task
            const t3 = tasks[2];
            stmt.run(projectId, functionId, t3.name, t3.phase, t3.status, t3.priority, t3.duration, '2023-02-01', '2023-02-20', function(err) {
                 const t3Id = this.lastID;
                 // T3 depends on T2
                 db.run("INSERT INTO task_dependencies (task_id, predecessor_id) VALUES (?, ?)", [t3Id, t2Id]);
            });
        });
    });
    stmt.finalize();
}

function seedMilestones(projectId) {
    // Restore Design: Init milestones from System Templates (active version or templates)
    // Query active version
    db.get("SELECT content FROM milestone_versions WHERE is_active = 1", (err, version) => {
        if (!version) {
            // Fallback to templates table if no active version
            db.all("SELECT * FROM milestone_templates ORDER BY order_index ASC", (errT, templates) => {
                if (!templates || templates.length === 0) return;
                insertMilestonesFromList(projectId, templates);
            });
        } else {
            // Parse version content
            try {
                const tree = JSON.parse(version.content);
                const flatList = [];
                let orderIndex = 1;
                tree.forEach(phase => {
                    if (phase.children) {
                        phase.children.forEach(proc => {
                            flatList.push({
                                phase: phase.name,
                                name: proc.name,
                                description: proc.description,
                                is_required: proc.is_required,
                                input_docs: proc.input_docs,
                                output_docs: proc.output_docs,
                                order_index: orderIndex++
                            });
                        });
                    }
                });
                insertMilestonesFromList(projectId, flatList);
            } catch (e) {
                console.error("Failed to parse milestone version", e);
            }
        }
    });
}

function insertMilestonesFromList(projectId, list) {
    const stmt = db.prepare("INSERT INTO project_milestones (project_id, phase, name, description, is_required, input_docs, output_docs, order_index, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    // Get Project Phase to simulate status
    db.get("SELECT current_phase FROM projects WHERE id = ?", [projectId], (err, project) => {
        const currentPhase = project ? project.current_phase : '进场前阶段';
        const phases = ['进场前阶段', '启动阶段', '实施阶段', '初验阶段', '试运行阶段', '终验阶段', '运维阶段'];
        const currentPhaseIdx = phases.indexOf(currentPhase);
        
        list.forEach(m => {
            let status = 'PENDING';
            const mPhaseIdx = phases.indexOf(m.phase);
            
            if (mPhaseIdx < currentPhaseIdx) {
                status = 'COMPLETED';
            } else if (mPhaseIdx === currentPhaseIdx) {
                // Randomly set some to COMPLETED, IN_PROGRESS, PENDING
                const rand = Math.random();
                if (rand > 0.6) status = 'IN_PROGRESS';
                else if (rand > 0.3) status = 'COMPLETED';
                else status = 'PENDING';
            }
            
            stmt.run(projectId, m.phase, m.name, m.description, m.is_required, m.input_docs, m.output_docs, m.order_index, status);
        });
        stmt.finalize();
    });
}

// Allow some time for async inserts to finish (simple hack for script)
setTimeout(() => {
    console.log('Seeding completed.');
}, 3000);
