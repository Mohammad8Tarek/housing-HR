/**
 * SUNRISE HOUSING MANAGEMENT SYSTEM — MASTER REGRESSION TEST SUITE
 * Consolidated verification across all 9 operational phases.
 * 
 * Usage:
 *   $env:DATABASE_URL="postgresql://postgres:admin123@localhost:5432/staff-housing"
 *   node tests/regression-system.test.mjs
 */

import { spawn } from "child_process";
import path from "path";

const PHASES = [
  { name: "Phase 1: Database Integrity", script: "tests/phase1-db-integrity.mjs", cwd: "artifacts/api-server" },
  { name: "Phase 2: Authentication & RBAC", script: "tests/phase2-auth-rbac.mjs", cwd: "artifacts/api-server" },
  { name: "Phase 3: Core API Routes", script: "tests/phase3-core-api.mjs", cwd: "artifacts/api-server" },
  { name: "Phase 4: Business Workflows", script: "tests/phase4-business-workflows.mjs", cwd: "artifacts/api-server" },
  { name: "Phase 5: WebSocket Real-Time", script: "tests/phase5-websocket.mjs", cwd: "artifacts/api-server" },
  { name: "Phase 6: Security & Boundary", script: "tests/phase6-security.mjs", cwd: "artifacts/api-server" },
  { name: "Phase 7: Performance & Resources", script: "tests/phase7-performance.mjs", cwd: "artifacts/api-server" },
  { name: "Phase 8: Frontend Quality & RBAC", script: "tests/phase8-frontend.mjs", cwd: "." },
  { name: "Phase 9: External Integrations", script: "tests/phase9-integration.mjs", cwd: "." },
];

function runPhase(phase) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    console.log(`\n===============================================================`);
    console.log(`▶ RUNNING: ${phase.name}`);
    console.log(`===============================================================`);

    const isWindows = process.platform === "win32";
    const runner = phase.script.endsWith(".mjs") && phase.cwd === "artifacts/api-server" ? "npx" : "node";
    const args = runner === "npx" ? ["tsx", path.resolve(phase.script)] : [path.resolve(phase.script)];

    const child = spawn(runner, args, {
      cwd: path.resolve(phase.cwd),
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:admin123@localhost:5432/staff-housing" },
      shell: isWindows,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      const duration = ((performance.now() - t0) / 1000).toFixed(2);
      const passed = code === 0;
      console.log(`\n[${phase.name}] Finished with exit code ${code} in ${duration}s (${passed ? 'PASSED ✅' : 'FAILED ❌'})`);
      resolve({ name: phase.name, passed, duration, code });
    });

    child.on("error", (err) => {
      const duration = ((performance.now() - t0) / 1000).toFixed(2);
      console.error(`[${phase.name}] Process error:`, err);
      resolve({ name: phase.name, passed: false, duration, code: 1 });
    });
  });
}

async function main() {
  console.log("###############################################################");
  console.log("   SUNRISE STAFF HOUSING MANAGEMENT SYSTEM — FULL REGRESSION");
  console.log("   Timestamp: " + new Date().toISOString());
  console.log("###############################################################");

  const results = [];
  const start = performance.now();

  for (const phase of PHASES) {
    const result = await runPhase(phase);
    results.push(result);
  }

  const totalDuration = ((performance.now() - start) / 1000).toFixed(2);
  const totalPassed = results.filter(r => r.passed).length;
  const allPassed = totalPassed === results.length;

  console.log("\n\n###############################################################");
  console.log("                   MASTER VERIFICATION SUMMARY");
  console.log("###############################################################\n");

  for (const r of results) {
    const statusMark = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${r.name.padEnd(35)} : ${statusMark} (${r.duration}s)`);
  }

  console.log("\n---------------------------------------------------------------");
  console.log(`TOTAL PHASES: ${results.length} | PASSED: ${totalPassed} | FAILED: ${results.length - totalPassed}`);
  console.log(`TOTAL DURATION: ${totalDuration}s`);
  console.log(`FINAL STATUS: ${allPassed ? "100% VERIFIED & PRODUCTION READY ✅" : "ATTENTION REQUIRED ❌"}`);
  console.log("###############################################################\n");

  process.exitCode = allPassed ? 0 : 1;
}

main().catch(err => {
  console.error("FATAL in Master Regression:", err);
  process.exitCode = 1;
});
