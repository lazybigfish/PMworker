
const API_URL = 'http://localhost:3002/api';
let projectId;
let taskId1;
let taskId2;

async function request(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', 'x-user-id': '1', ...options.headers };
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data.error || res.statusText);
        err.response = { status: res.status, data };
        throw err;
    }
    return { data };
}

async function runTests() {
    console.log("Starting Integration Tests for Business Rules...");

    try {
        // 1. Create Project
        console.log("Creating Project...");
        const projectRes = await request(`${API_URL}/projects`, {
            method: 'POST',
            body: JSON.stringify({
                name: "Rule Test Project",
                description: "Test project for business rules",
                department: "IT",
                start_date: "2023-01-01",
                end_date: "2023-12-31",
                budget: 10000
            })
        });
        projectId = projectRes.data.id;
        console.log("Project Created:", projectId);

        // 2. Create Task 1
        console.log("Creating Task 1...");
        const task1Res = await request(`${API_URL}/tasks`, {
            method: 'POST',
            body: JSON.stringify({
                project_id: projectId,
                name: "Task 1",
                status: "PENDING",
                priority: "MEDIUM"
            })
        });
        taskId1 = task1Res.data.id;
        console.log("Task 1 Created:", taskId1);

        // 3. Start Task 1
        console.log("Starting Task 1...");
        await request(`${API_URL}/tasks/${taskId1}/status`, {
            method: 'POST',
            body: JSON.stringify({ status: "IN_PROGRESS" })
        });
        console.log("Task 1 Started");

        // 4. Update Progress to 50%
        console.log("Updating Task 1 Progress to 50%...");
        await request(`${API_URL}/tasks/${taskId1}`, {
            method: 'PUT',
            body: JSON.stringify({ progress: 50 })
        });
        console.log("Task 1 Updated (50%)");

        // 5. Update Progress to 100% (Should Auto-Complete)
        console.log("Updating Task 1 Progress to 100%...");
        await request(`${API_URL}/tasks/${taskId1}`, {
            method: 'PUT',
            body: JSON.stringify({ progress: 100 })
        });
        
        // Verify Status
        const t1Check = await request(`${API_URL}/tasks?project_id=${projectId}`);
        const t1 = t1Check.data.find(t => t.id === taskId1);
        if (t1.status === 'COMPLETED') {
            console.log("PASS: Task 1 Auto-Completed when progress=100");
        } else {
            console.error("FAIL: Task 1 Status is", t1.status);
            process.exit(1);
        }

        // 6. Try to Update Completed Task (Should Fail)
        console.log("Attempting to edit Completed Task 1...");
        try {
            await request(`${API_URL}/tasks/${taskId1}`, {
                method: 'PUT',
                body: JSON.stringify({ description: "Hacked" })
            });
            console.error("FAIL: Edit on Completed Task should have failed");
            process.exit(1);
        } catch (e) {
            if (e.response && e.response.status === 409) {
                console.log("PASS: Edit Rejected (409 Conflict)");
            } else {
                console.error("FAIL: Unexpected error code", e.response ? e.response.status : e.message);
                process.exit(1);
            }
        }

        // 7. Create Task 2 (In Progress)
        console.log("Creating Task 2...");
        const task2Res = await request(`${API_URL}/tasks`, {
            method: 'POST',
            body: JSON.stringify({
                project_id: projectId,
                name: "Task 2",
                status: "IN_PROGRESS",
                priority: "MEDIUM"
            })
        });
        taskId2 = task2Res.data.id;

        // 8. Batch Update (Task 1 Completed, Task 2 In Progress)
        console.log("Batch Updating Task 1 and Task 2...");
        const batchRes = await request(`${API_URL}/tasks/batch`, {
            method: 'POST',
            body: JSON.stringify({
                taskIds: [taskId1, taskId2],
                updates: { priority: "HIGH" }
            })
        });
        
        console.log("Batch Result:", batchRes.data);
        
        if (batchRes.data.skipped.includes(taskId1) && batchRes.data.updated.includes(taskId2)) {
             console.log("PASS: Batch Update skipped Completed task and updated In-Progress task");
        } else {
             console.error("FAIL: Batch logic incorrect");
             process.exit(1);
        }

        console.log("ALL TESTS PASSED");

    } catch (e) {
        console.error("Test Failed:", e.message);
        process.exit(1);
    }
}

runTests();
