const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('Running Task Module Tests...');

  const baseUrl = {
    hostname: 'localhost',
    port: 3001,
    headers: { 'Content-Type': 'application/json', 'X-User-ID': '1' }
  };

  // 1. Create Task
  console.log('\n[Test] Create Task');
  const taskData = {
    project_id: 1,
    name: 'Unit Test Task',
    description: 'Testing task creation',
    status: 'PENDING',
    priority: 'HIGH',
    type: 'TASK'
  };
  
  let res = await request({ ...baseUrl, path: '/api/tasks', method: 'POST' }, taskData);
  console.log(`Status: ${res.status}`);
  if (res.status !== 200) throw new Error('Create failed');
  const taskId = res.body.id;
  console.log(`Task Created ID: ${taskId}`);

  // 2. Update Task Status
  console.log('\n[Test] Update Task Status (Transition)');
  res = await request({ ...baseUrl, path: `/api/tasks/${taskId}`, method: 'PUT' }, { status: 'IN_PROGRESS' });
  console.log(`Status: ${res.status}`);
  
  // Verify History
  console.log('\n[Test] Verify History');
  res = await request({ ...baseUrl, path: `/api/tasks/${taskId}/history`, method: 'GET' });
  console.log(`History entries: ${res.body.length}`);
  if (res.body.length < 1) console.warn('Warning: No history found');

  // 3. Batch Update
  console.log('\n[Test] Batch Update');
  res = await request({ ...baseUrl, path: '/api/tasks/batch', method: 'POST' }, { ids: [taskId], status: 'COMPLETED' });
  console.log(`Status: ${res.status}`);

  // 4. Soft Delete
  console.log('\n[Test] Soft Delete');
  res = await request({ ...baseUrl, path: `/api/tasks/${taskId}`, method: 'DELETE' });
  console.log(`Status: ${res.status}`);

  // Verify Deletion
  res = await request({ ...baseUrl, path: `/api/tasks/${taskId}`, method: 'GET' });
  console.log(`Get Deleted Task Status: ${res.status} (Expected 404)`);
  if (res.status !== 404) throw new Error('Soft delete failed');

  console.log('\nAll Tests Passed!');
}

// Wait for server to start if running via script, but here we assume server is running
// We will wrap this in a timeout to allow server start
setTimeout(runTests, 2000);
