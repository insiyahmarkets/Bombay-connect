#!/usr/bin/env node
/**
 * NetCompare Volunteer Measurement Agent
 * ========================================
 * Project: A3-PS014-TC466 | Bombay Connect | AIORI Hackathon 3
 *
 * This script runs on a volunteer's device and performs network quality
 * measurements, then submits results to the NetCompare backend.
 *
 * IMPORTANT LIMITATIONS (read before using):
 * - Latency is measured using HTTP round-trip to the configured server.
 *   It is NOT an ICMP ping. Results may differ from true ICMP latency.
 * - Packet loss is simulated by counting HTTP probe failures within a timeout.
 *   Firewalls, NAT, and server load can affect this measurement.
 * - DNS response time uses Node.js dns.resolve() which may return cached results
 *   from the OS resolver. Results may not reflect cold DNS lookups.
 * - Throughput is measured by downloading a configurable payload from your
 *   own server. It reflects the HTTP download speed, not raw link capacity.
 * - All four metrics are subject to congestion, server load, and routing changes.
 * - None of these measurements are perfect. They are indicative only.
 *
 * Run with: node src/agent.js
 * Run once: node src/agent.js --once
 *
 * Configure with .env file in the agent/ directory.
 */

'use strict';

const http = require('http');
const https = require('https');
const dns = require('dns');
const path = require('path');
const fs = require('fs');

// Load environment
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath });

// ---- Configuration ----
const CONFIG = {
  // Your NetCompare backend URL
  BACKEND_URL: process.env.NETCOMPARE_BACKEND || 'http://localhost:3001',

  // The endpoint ID you registered in the dashboard
  ENDPOINT_ID: process.env.ENDPOINT_ID || '',

  // Measurement server for latency/throughput (must be a server you control)
  // For local testing this defaults to the backend itself.
  MEASURE_SERVER: process.env.MEASURE_SERVER || 'http://localhost:3001',

  // DNS hostname to resolve (timing purposes)
  DNS_HOST: process.env.DNS_HOST || 'example.com',

  // DNS resolver address (leave blank to use system default)
  DNS_RESOLVER: process.env.DNS_RESOLVER || '',

  // Number of HTTP probes for packet loss estimation
  PROBE_COUNT: parseInt(process.env.PROBE_COUNT || '10', 10),

  // Timeout per probe in milliseconds
  PROBE_TIMEOUT_MS: parseInt(process.env.PROBE_TIMEOUT_MS || '3000', 10),

  // Throughput test payload size in bytes
  THROUGHPUT_BYTES: parseInt(process.env.THROUGHPUT_BYTES || '524288', 10), // 512 KB default

  // How often to run measurements (milliseconds). 0 = run once and exit.
  INTERVAL_MS: parseInt(process.env.INTERVAL_MS || '300000', 10), // 5 minutes default
};

// ---- Helpers ----
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { ...options, timeout: options.timeout || 10000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ---- Measurements ----

/**
 * Latency: HTTP round-trip to /api/health
 * Returns milliseconds or null on failure.
 */
async function measureLatency() {
  const url = `${CONFIG.MEASURE_SERVER}/api/health`;
  const results = [];

  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    try {
      await makeRequest(url, { timeout: CONFIG.PROBE_TIMEOUT_MS });
      results.push(Date.now() - start);
    } catch {
      // failed probe
    }
    if (i < 4) await sleep(200);
  }

  if (results.length === 0) return null;
  // Use median of successful probes
  results.sort((a, b) => a - b);
  return results[Math.floor(results.length / 2)];
}

/**
 * Packet loss: N HTTP probes to /api/health, count failures.
 * Returns percentage or null if all probes fail.
 */
async function measurePacketLoss() {
  const url = `${CONFIG.MEASURE_SERVER}/api/health`;
  let failures = 0;

  for (let i = 0; i < CONFIG.PROBE_COUNT; i++) {
    try {
      await makeRequest(url, { timeout: CONFIG.PROBE_TIMEOUT_MS });
    } catch {
      failures++;
    }
    if (i < CONFIG.PROBE_COUNT - 1) await sleep(300);
  }

  return parseFloat(((failures / CONFIG.PROBE_COUNT) * 100).toFixed(2));
}

/**
 * DNS: time to resolve DNS_HOST using Node's dns module.
 * Returns milliseconds or null on failure.
 */
async function measureDns() {
  return new Promise((resolve) => {
    // Note: OS-level caching may affect this result.
    const resolver = CONFIG.DNS_RESOLVER ? new dns.Resolver() : dns;
    if (CONFIG.DNS_RESOLVER && resolver.setServers) {
      try { resolver.setServers([CONFIG.DNS_RESOLVER]); } catch { /* ignore */ }
    }

    const start = Date.now();
    resolver.resolve4(CONFIG.DNS_HOST, (err) => {
      if (err) {
        resolve(null);
      } else {
        resolve(Date.now() - start);
      }
    });
  });
}

/**
 * Throughput: download THROUGHPUT_BYTES from /api/health or a dedicated endpoint.
 * This approximates download speed to your measurement server only.
 * Returns Mbps or null on failure.
 */
async function measureThroughput() {
  // We download from /api/health repeatedly to approximate throughput.
  // For a proper throughput test, set up a dedicated download endpoint on your server.
  const url = `${CONFIG.MEASURE_SERVER}/api/health`;
  const targetBytes = CONFIG.THROUGHPUT_BYTES;
  let downloaded = 0;
  const start = Date.now();

  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { timeout: 15000 }, (res) => {
      res.on('data', chunk => { downloaded += chunk.length; });
      res.on('end', () => {
        const elapsed = (Date.now() - start) / 1000;
        if (elapsed <= 0) return resolve(null);
        // Convert bytes/s to Mbps
        const mbps = (downloaded * 8) / (elapsed * 1_000_000);
        // If payload is too small, the result is not meaningful
        if (downloaded < 100) return resolve(null);
        resolve(parseFloat(mbps.toFixed(2)));
      });
      res.on('error', () => resolve(null));
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ---- Submission ----
async function submitMeasurement(result) {
  const endpoint = await lookupEndpoint();
  if (!endpoint) {
    console.error('[Agent] Could not find endpoint. Check ENDPOINT_ID config.');
    return;
  }

  const payload = JSON.stringify({
    endpoint_id: endpoint.id,
    measured_at: result.measured_at,
    latency_ms: result.latency_ms,
    packet_loss_percent: result.packet_loss_percent,
    dns_response_ms: result.dns_response_ms,
    throughput_mbps: result.throughput_mbps,
    measurement_status: result.measurement_status,
    failure_reason: result.failure_reason || null,
    measurement_method: 'netcompare-agent-v1',
  });

  try {
    const res = await makeRequest(`${CONFIG.BACKEND_URL}/api/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      body: payload,
      timeout: 10000,
    });

    if (res.status === 201) {
      console.log('[Agent] ✅ Measurement submitted successfully.');
    } else {
      console.error(`[Agent] ❌ Submission failed: HTTP ${res.status} — ${res.body}`);
    }
  } catch (err) {
    console.error('[Agent] ❌ Network error during submission:', err.message);
  }
}

let _endpointCache = null;
async function lookupEndpoint() {
  if (_endpointCache) return _endpointCache;
  if (!CONFIG.ENDPOINT_ID) {
    console.error('[Agent] ENDPOINT_ID is not set. Please configure it in .env or environment.');
    return null;
  }
  try {
    const res = await makeRequest(`${CONFIG.BACKEND_URL}/api/endpoints?demo=false`, { timeout: 5000 });
    const data = JSON.parse(res.body);
    const ep = data.data?.find(e => e.participant_id === CONFIG.ENDPOINT_ID);
    if (!ep) {
      console.error(`[Agent] Endpoint "${CONFIG.ENDPOINT_ID}" not found. Register it via the dashboard first.`);
      return null;
    }
    _endpointCache = ep;
    return ep;
  } catch (err) {
    console.error('[Agent] Could not fetch endpoints:', err.message);
    return null;
  }
}

// ---- Main run loop ----
async function runMeasurement() {
  const measuredAt = new Date().toISOString();
  console.log(`\n[Agent] 🔬 Starting measurement at ${measuredAt}`);

  const result = {
    measured_at: measuredAt,
    latency_ms: null,
    packet_loss_percent: null,
    dns_response_ms: null,
    throughput_mbps: null,
    measurement_status: 'ok',
    failure_reason: null,
  };

  const errors = [];

  // Latency
  try {
    console.log('[Agent] Measuring latency…');
    result.latency_ms = await measureLatency();
    if (result.latency_ms === null) errors.push('latency: no successful probes');
    else console.log(`[Agent]   Latency: ${result.latency_ms} ms`);
  } catch (err) {
    errors.push(`latency: ${err.message}`);
  }

  // Packet loss
  try {
    console.log('[Agent] Measuring packet loss…');
    result.packet_loss_percent = await measurePacketLoss();
    console.log(`[Agent]   Packet loss: ${result.packet_loss_percent}%`);
  } catch (err) {
    errors.push(`packet_loss: ${err.message}`);
  }

  // DNS
  try {
    console.log('[Agent] Measuring DNS response time…');
    result.dns_response_ms = await measureDns();
    if (result.dns_response_ms === null) errors.push('dns: resolution failed');
    else console.log(`[Agent]   DNS: ${result.dns_response_ms} ms`);
  } catch (err) {
    errors.push(`dns: ${err.message}`);
  }

  // Throughput
  try {
    console.log('[Agent] Measuring throughput…');
    result.throughput_mbps = await measureThroughput();
    if (result.throughput_mbps === null) errors.push('throughput: measurement failed');
    else console.log(`[Agent]   Throughput: ${result.throughput_mbps} Mbps`);
  } catch (err) {
    errors.push(`throughput: ${err.message}`);
  }

  // Determine status
  const hasAny = result.latency_ms !== null || result.packet_loss_percent !== null ||
    result.dns_response_ms !== null || result.throughput_mbps !== null;
  const hasAll = result.latency_ms !== null && result.packet_loss_percent !== null &&
    result.dns_response_ms !== null && result.throughput_mbps !== null;

  if (!hasAny) {
    result.measurement_status = 'failed';
    result.failure_reason = 'All measurements failed: ' + errors.join('; ');
  } else if (!hasAll) {
    result.measurement_status = 'partial';
    result.failure_reason = errors.join('; ');
  } else {
    result.measurement_status = 'ok';
  }

  console.log(`[Agent] Status: ${result.measurement_status}`);
  if (errors.length) console.log(`[Agent] Issues: ${errors.join('; ')}`);

  await submitMeasurement(result);
}

// ---- Entry point ----
const runOnce = process.argv.includes('--once');

if (!CONFIG.ENDPOINT_ID) {
  console.error('\n[Agent] ⚠  ENDPOINT_ID is not configured.');
  console.error('[Agent]    Create an agent/.env file and set ENDPOINT_ID=<your-participant-id>');
  console.error('[Agent]    Then register that ID in the NetCompare dashboard.\n');
}

if (runOnce) {
  console.log('[Agent] Running single measurement…');
  runMeasurement().then(() => {
    console.log('[Agent] Done. Exiting.');
    process.exit(0);
  }).catch(err => {
    console.error('[Agent] Unexpected error:', err);
    process.exit(1);
  });
} else {
  const interval = CONFIG.INTERVAL_MS;
  console.log(`\n[Agent] 🚀 NetCompare Measurement Agent started`);
  console.log(`[Agent]    Endpoint: ${CONFIG.ENDPOINT_ID || '(not configured)'}`);
  console.log(`[Agent]    Backend:  ${CONFIG.BACKEND_URL}`);
  console.log(`[Agent]    Server:   ${CONFIG.MEASURE_SERVER}`);
  console.log(`[Agent]    Interval: ${interval / 1000}s`);
  console.log(`[Agent]    Press Ctrl+C to stop.\n`);

  runMeasurement();
  setInterval(runMeasurement, interval);
}
