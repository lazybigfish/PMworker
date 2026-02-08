const assert = require('assert');

const BASE_URL = 'http://localhost:3002/api';

async function testProjectFlow() {
    console.log('--- Starting Project API Tests ---');

    // 1. Create Project
    console.log('1. Testing Create Project...');
    const createRes = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': '1' }, // Admin
        body: JSON.stringify({
            name: 'Test Project 1',
            department: 'IT',
            priority: 'HIGH'
        })
    });
    
    if (!createRes.ok) {
        console.error('Create failed:', await createRes.text());
        process.exit(1);
    }

    const project = await createRes.json();
    console.log('Project Response:', project);
    assert.strictEqual(project.name, 'Test Project 1');
    assert.strictEqual(project.manager_id, 1);
    console.log('   Create Project: PASS (ID:', project.id, ')');

    // 2. Get Project Details
    console.log('2. Testing Get Details...');
    const detailRes = await fetch(`${BASE_URL}/projects/${project.id}/details`, {
        headers: { 'x-user-id': '1' }
    });
    const details = await detailRes.json();
    assert.strictEqual(details.info.manager_id, 1);
    // Check if manager is in members
    const managerMember = details.members.find(m => m.user_id === 1);
    assert.ok(managerMember, 'Manager should be in members');
    assert.strictEqual(managerMember.role, 'PROJECT_MANAGER');
    console.log('   Get Details: PASS');

    // 3. Transfer Manager
    console.log('3. Testing Transfer Manager...');
    // Create another user first (Mock or use existing)
    // We assume user 2 exists (Alice)
    const transferRes = await fetch(`${BASE_URL}/projects/${project.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
        body: JSON.stringify({ newManagerId: 2 })
    });
    
    if (!transferRes.ok) {
        console.error('Transfer failed:', await transferRes.text());
        process.exit(1);
    }
    console.log('   Transfer Request: PASS');

    // Verify Transfer
    const verifyRes = await fetch(`${BASE_URL}/projects/${project.id}/details`, {
        headers: { 'x-user-id': '1' }
    });
    const verifyDetails = await verifyRes.json();
    assert.strictEqual(verifyDetails.info.manager_id, 2);
    
    // Check roles
    const oldManager = verifyDetails.members.find(m => m.user_id === 1);
    const newManager = verifyDetails.members.find(m => m.user_id === 2);
    
    assert.strictEqual(oldManager.role, 'MEMBER');
    assert.strictEqual(newManager.role, 'PROJECT_MANAGER');
    console.log('   Verify Transfer: PASS');

    console.log('--- All Tests Passed ---');
}

testProjectFlow().catch(console.error);
