#!/usr/bin/env node
// testApi.js - Basic API smoke tests (runs against a running server)
const http = require('http');

const BASE = process.env.API_URL || 'http://localhost:3001';
let passed = 0;
let failed = 0;

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function run() {
  console.log(`\n🧪 NetCompare API Tests → ${BASE}\n`);

  // Health
  console.log('--- Health ---');
  const health = await request('/api/health');
  assert('GET /api/health returns 200', health.status === 200);
  assert('Health status is ok', health.body.status === 'ok');
  assert('Health db is ok', health.body.db === 'ok');

  // Endpoints (empty)
  console.log('\n--- Endpoints ---');
  const epList = await request('/api/endpoints');
  assert('GET /api/endpoints returns 200', epList.status === 200);
  assert('Endpoints response has data array', Array.isArray(epList.body.data));

  // Register endpoint - validation fail
  const badEp = await request('/api/endpoints', 'POST', { participant_id: '', site_label: 'Test', access_medium: 'fiber', isp: 'TestISP', device_connection: 'wifi' });
  assert('POST /api/endpoints with empty ID returns 400', badEp.status === 400);

  // Register endpoint - success (use timestamp-unique ID so reruns don't collide)
  const testId = 'TEST' + Date.now().toString().slice(-6);
  const newEp = await request('/api/endpoints', 'POST', {
    participant_id: testId,
    site_label: 'Test Site',
    access_medium: 'fiber',
    isp: 'TestISP',
    device_connection: 'ethernet',
    notes: 'API test endpoint',
  });
  assert('POST /api/endpoints returns 201', newEp.status === 201);
  assert('New endpoint has participant_id', newEp.body.data?.participant_id === testId);
  const endpointId = newEp.body.data?.id;

  // Register duplicate
  const dupEp = await request('/api/endpoints', 'POST', { participant_id: testId, site_label: 'X', access_medium: 'fiber', isp: 'Y', device_connection: 'wifi' });
  assert('Duplicate participant_id returns 409', dupEp.status === 409);

  // Submit measurement
  console.log('\n--- Measurements ---');
  const meas = await request('/api/measurements', 'POST', {
    endpoint_id: endpointId,
    measured_at: new Date().toISOString(),
    latency_ms: 18.5,
    packet_loss_percent: 0.2,
    dns_response_ms: 22.1,
    throughput_mbps: 75.3,
    measurement_status: 'ok',
    measurement_method: 'api-test',
  });
  assert('POST /api/measurements returns 201', meas.status === 201);
  assert('Measurement has correct latency', meas.body.data?.latency_ms === 18.5);

  // Submit failed measurement
  const failMeas = await request('/api/measurements', 'POST', {
    endpoint_id: endpointId,
    measured_at: new Date().toISOString(),
    measurement_status: 'failed',
    failure_reason: 'Connection timeout during test',
  });
  assert('POST /api/measurements (failed) returns 201', failMeas.status === 201);
  assert('Failed measurement status is failed', failMeas.body.data?.measurement_status === 'failed');

  // Submit measurement with missing required metric
  const badMeas = await request('/api/measurements', 'POST', {
    endpoint_id: endpointId,
    measured_at: new Date().toISOString(),
    measurement_status: 'ok',
    // no metrics
  });
  assert('POST /api/measurements (ok, no metrics) returns 400', badMeas.status === 400);

  // Get measurements
  const measList = await request('/api/measurements?limit=10');
  assert('GET /api/measurements returns 200', measList.status === 200);
  assert('Measurements response has data array', Array.isArray(measList.body.data));

  // Dashboard summary
  console.log('\n--- Dashboard ---');
  const summary = await request('/api/dashboard/summary');
  assert('GET /api/dashboard/summary returns 200', summary.status === 200);
  assert('Summary has pilot object', summary.body.data?.pilot != null);
  assert('Summary has metrics object', summary.body.data?.metrics != null);

  // Dashboard trends
  const trends = await request('/api/dashboard/trends');
  assert('GET /api/dashboard/trends returns 200', trends.status === 200);
  assert('Trends returns an array', Array.isArray(trends.body.data));

  // Dashboard comparison
  const comparison = await request('/api/dashboard/comparison');
  assert('GET /api/dashboard/comparison returns 200', comparison.status === 200);
  assert('Comparison returns an array', Array.isArray(comparison.body.data));

  // 404
  console.log('\n--- Error Handling ---');
  const notFound = await request('/api/nonexistent');
  assert('Unknown route returns 404', notFound.status === 404);

  // Summary
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
