const assert = require('assert');

const BASE_URL = 'http://localhost:3002/api';

async function testConsistency() {
    console.log('--- Starting Cross-Module Consistency Tests ---');

    // 1. Test Admin Access (SUPER_ADMIN)
    console.log('\n1. Testing Admin Access (User ID: 3)...');
    const adminRes = await fetch(`${BASE_URL}/tasks`, { headers: { 'x-user-id': '3' } });
    const adminTasks = await adminRes.json();
    console.log(`   Admin sees ${adminTasks.length} tasks.`);
    assert.ok(adminTasks.length > 0, "Admin should see all tasks");

    // 2. Test Project Manager Access (Alice, User ID: 1)
    // Alice is manager of Project 1 & 3, member of Project 2? Let's assume she has access to some.
    console.log('\n2. Testing Manager Access (User ID: 1)...');
    const aliceRes = await fetch(`${BASE_URL}/tasks`, { headers: { 'x-user-id': '1' } });
    const aliceTasks = await aliceRes.json();
    console.log(`   Alice sees ${aliceTasks.length} tasks.`);
    assert.ok(aliceTasks.length > 0, "Alice should see tasks");
    
    // Check if Alice only sees tasks for projects she is associated with
    // We can't easily verify "only" without querying DB, but we can verify she sees *some* and maybe less than admin if there are private projects?
    // In our seed data, Alice and Bob are on almost all projects.
    
    // 3. Test Unassociated User (Charlie, User ID: 999)
    console.log('\n3. Testing Unassociated User (User ID: 999)...');
    const charlieRes = await fetch(`${BASE_URL}/tasks`, { headers: { 'x-user-id': '999' } });
    const charlieTasks = await charlieRes.json();
    console.log(`   Charlie sees ${charlieTasks.length} tasks.`);
    assert.strictEqual(charlieTasks.length, 0, "Unassociated user should see 0 tasks");

    const charlieSuppliersRes = await fetch(`${BASE_URL}/suppliers`, { headers: { 'x-user-id': '999' } });
    const charlieSuppliers = await charlieSuppliersRes.json();
    console.log(`   Charlie sees ${charlieSuppliers.length} suppliers.`);
    assert.strictEqual(charlieSuppliers.length, 0, "Unassociated user should see 0 suppliers");

    console.log('\n--- All Consistency Tests Passed ---');
}

testConsistency().catch(err => {
    console.error(err);
    process.exit(1);
});
