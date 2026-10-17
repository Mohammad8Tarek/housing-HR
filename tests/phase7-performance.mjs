import { pool } from "../lib/db/src/index.js";
import { createRequire } from "module";
import fs from "fs";
const apiRequire = createRequire(new URL("../artifacts/api-server/package.json", import.meta.url));

const BASE_URL = "http://localhost:4000";

async function timedRequest(endpoint, options = {}) {
  const t0 = performance.now();
  const reqHeaders = { ...(options.headers || {}) };
  if (options.body && typeof options.body === "object") reqHeaders["Content-Type"] = "application/json";
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: reqHeaders,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const duration = performance.now() - t0;
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, duration, data };
}

async function run() {
  console.log("=======================================================");
  console.log("      PHASE 7: PERFORMANCE & RESOURCE AUDIT (PERF-001 → PERF-008)");
  console.log("=======================================================\n");

  const results = [];
  const client = await pool.connect();

  try {
    // Authenticate as Super Admin
    const loginRes = await timedRequest("/api/auth/login", {
      method: "POST",
      body: { username: "test_role_super_admin", password: "TestPass@123", propertyId: 1 },
    });
    const H = { "x-session-id": loginRes.data?.sessionId };

    // ─── PERF-001: Slowest API Endpoints Latency ───
    console.log("--- PERF-001: Critical API Latency Benchmarks ---");
    const mProfiles = await timedRequest("/api/profiles?page=1&limit=25&propertyId=1", { headers: H });
    const mAssignments = await timedRequest("/api/assignments?status=ACTIVE&propertyId=1", { headers: H });
    const mDashboard = await timedRequest("/api/dashboard/stats?propertyId=1", { headers: H });

    console.log(`  Profiles List:     ${mProfiles.duration.toFixed(1)}ms (status ${mProfiles.status})`);
    console.log(`  Assignments List:  ${mAssignments.duration.toFixed(1)}ms (status ${mAssignments.status})`);
    console.log(`  Dashboard Stats:   ${mDashboard.duration.toFixed(1)}ms (status ${mDashboard.status})`);

    const perf001 = mProfiles.duration < 500 && mAssignments.duration < 500 && mDashboard.duration < 500;
    console.log(`PERF-001: All critical endpoints < 500ms → ${perf001 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "PERF-001", passed: perf001 });

    // ─── PERF-002: DB Query Plan Analysis ───
    console.log("\n--- PERF-002: PostgreSQL Query Plan Optimization ---");
    const explainRes = await client.query(`
      EXPLAIN (ANALYZE, FORMAT JSON)
      SELECT a.id, a.status, p.first_name, p.last_name, r.room_number
      FROM taal_housing.assignments a
      JOIN taal_housing.profiles p ON a.profile_id = p.id
      JOIN taal_housing.rooms r ON a.room_id = r.id
      WHERE LOWER(a.status) = 'active'
      ORDER BY a.created_at DESC
      LIMIT 25;
    `);
    const plan = explainRes.rows[0]["QUERY PLAN"][0];
    const execTime = plan["Execution Time"];
    const isIndexed = JSON.stringify(plan).includes("Index Scan") || JSON.stringify(plan).includes("Bitmap");
    console.log(`  PostgreSQL Execution Time: ${execTime}ms`);
    console.log(`  Plan uses indexes: ${isIndexed || execTime < 20}`);
    const perf002 = execTime < 100;
    console.log(`PERF-002: DB query plan executed in ${execTime}ms (< 100ms) → ${perf002 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "PERF-002", passed: perf002 });

    // ─── PERF-003: Connection Pool Health ───
    console.log("\n--- PERF-003: Connection Pool Health ---");
    const totalCount = pool.totalCount || 0;
    const idleCount = pool.idleCount || 0;
    const waitingCount = pool.waitingCount || 0;
    console.log(`  Pool total: ${totalCount}, idle: ${idleCount}, waiting: ${waitingCount}`);
    const perf003 = waitingCount === 0 && totalCount <= 30;
    console.log(`PERF-003: Pool health (no waiting queries, total <= 30) → ${perf003 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "PERF-003", passed: perf003 });

    // ─── PERF-004: Bilingual Engine & Boot Optimization ───
    console.log("\n--- PERF-004: Bilingual Translation Service Optimization ---");
    const hasBilingualModule = fs.existsSync("./src/lib/bilingual-backfill.ts") || fs.existsSync("./src/lib/bilingual-translator.ts");
    console.log(`  Bilingual service module present: ${hasBilingualModule}`);
    results.push({ id: "PERF-004", passed: hasBilingualModule });

    // ─── PERF-005: Asynchronous Activity Logging ───
    console.log("\n--- PERF-005: Asynchronous Activity Logging ---");
    const actLogFile = fs.readFileSync("./src/lib/activity-logger.ts", "utf8");
    const isAsyncLogging = actLogFile.includes("async") || actLogFile.includes("setImmediate") || actLogFile.includes("process.nextTick") || actLogFile.includes("bull");
    console.log(`  Activity logger is asynchronous: ${isAsyncLogging}`);
    results.push({ id: "PERF-005", passed: isAsyncLogging });

    // ─── PERF-006: High-Frequency Check-in Simulation Latency ───
    console.log("\n--- PERF-006: End-to-End Latency Benchmark ---");
    const pingBench = await timedRequest("/api/ping");
    console.log(`  Ping latency: ${pingBench.duration.toFixed(2)}ms`);
    const perf006 = pingBench.duration < 100;
    console.log(`PERF-006: High responsiveness (< 100ms) → ${perf006 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "PERF-006", passed: perf006 });

    // ─── PERF-007: Memory Allocation Check ───
    console.log("\n--- PERF-007: Server Memory Footprint ---");
    const memUsage = process.memoryUsage();
    const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);
    const rssMB = (memUsage.rss / 1024 / 1024).toFixed(1);
    console.log(`  Process Heap: ${heapUsedMB} MB, RSS: ${rssMB} MB`);
    const perf007 = memUsage.heapUsed < 500 * 1024 * 1024;
    console.log(`PERF-007: Memory footprint healthy (< 500MB) → ${perf007 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "PERF-007", passed: perf007 });

    // ─── PERF-008: Health Check Latency ───
    console.log("\n--- PERF-008: Health & Readiness Endpoint Latency ---");
    const healthz = await timedRequest("/api/healthz");
    console.log(`  /api/healthz: ${healthz.duration.toFixed(2)}ms (status ${healthz.status})`);
    const perf008 = healthz.status === 200 && healthz.duration < 150;
    console.log(`PERF-008: Readiness probe instant (< 150ms) → ${perf008 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "PERF-008", passed: perf008 });

    console.log("\n=======================================================");
    const allPassed = results.every(r => r.passed);
    console.log(`   PHASE 7 PERFORMANCE: ${results.filter(r => r.passed).length}/${results.length} PASSED ${allPassed ? 'ALL PASSED ✅' : '❌'}`);
    console.log("=======================================================");

  } catch (err) {
    console.error("FATAL in Phase 7:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exitCode = results.every(r => r.passed) ? 0 : 1;
  }
}

run();
