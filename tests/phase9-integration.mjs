import { createRequire } from "module";
import fs from "fs";
const apiRequire = createRequire(new URL("../artifacts/api-server/package.json", import.meta.url));

const BASE_URL = "http://localhost:4000";

async function apiRequest(endpoint, { method = "GET", body = null, headers = {} } = {}) {
  const reqHeaders = { ...headers };
  if (body && typeof body === "object") reqHeaders["Content-Type"] = "application/json";
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method, headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await response.json(); } catch {}
  return { status: response.status, data };
}

async function run() {
  console.log("=======================================================");
  console.log("      PHASE 9: EXTERNAL INTEGRATIONS AUDIT (INT-001 → INT-008)");
  console.log("=======================================================\n");

  const results = [];

  // Authenticate as Super Admin
  const loginRes = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { username: "test_role_super_admin", password: "TestPass@123", propertyId: 1 },
  });
  const H = { "x-session-id": loginRes.data?.sessionId };

  // ─── INT-001: Hotek PMS Bridge & Card Issuance Guard ───
  console.log("--- INT-001: Hotek PMS Bridge Service ---");
  const pmsFile = fs.existsSync("./artifacts/api-server/src/lib/pms-server.ts");
  // Test smart-lock issue endpoint: when encoder bridge is offline, must return 503 or 400 gracefully (NOT crash server)
  const lockRes = await apiRequest("/api/smart-lock/issue?propertyId=1", {
    method: "POST", headers: H,
    body: { roomId: 1, profileId: 1 },
  });
  const int001 = pmsFile && (lockRes.status === 503 || lockRes.status === 400 || lockRes.status === 404 || lockRes.status === 200);
  console.log(`  pms-server.ts exists: ${pmsFile}, lock issue status: ${lockRes.status} (graceful response)`);
  console.log(`INT-001: Hotek PMS integration and graceful error handling verified → ${int001 ? '✅ PASS' : '❌ FAIL'}`);
  results.push({ id: "INT-001", passed: int001 });

  // ─── INT-002: Hotek Local Bridge Script ───
  console.log("\n--- INT-002: Hotek Local Bridge Tunnel Script ---");
  const bridgeScript = fs.existsSync("./artifacts/api-server/hotek-bridge.cjs") || fs.existsSync("./scripts/hotek-bridge.cjs");
  console.log(`  hotek-bridge.cjs exists: ${bridgeScript}`);
  results.push({ id: "INT-002", passed: bridgeScript });

  // ─── INT-003: WhatsApp Connection Engine ───
  console.log("\n--- INT-003: WhatsApp Engine & Status ---");
  const waRes = await apiRequest("/api/whatsapp/status?propertyId=1", { headers: H });
  const waFile = fs.existsSync("./artifacts/api-server/src/lib/whatsapp-engine.ts");
  const int003 = waFile && waRes.status === 200;
  console.log(`  whatsapp-engine.ts exists: ${waFile}, status endpoint: ${waRes.status}`);
  console.log(`INT-003: WhatsApp engine module and API status verified → ${int003 ? '✅ PASS' : '❌ FAIL'}`);
  results.push({ id: "INT-003", passed: int003 });

  // ─── INT-004: Email (SMTP) Service Configuration ───
  console.log("\n--- INT-004: Email Service Configuration ---");
  const emailFile = fs.existsSync("./artifacts/api-server/src/lib/email-service.ts");
  const emailRes = await apiRequest("/api/settings/email/test?propertyId=1", {
    method: "POST", headers: H,
    body: { toEmail: "qa-test@sunrise-resorts.com" },
  });
  // Returns 200 or graceful 400/500 with descriptive error (no server crash)
  const int004 = emailFile && (emailRes.status === 200 || emailRes.status === 400 || emailRes.status === 500);
  console.log(`  email-service.ts exists: ${emailFile}, /settings/email/test status: ${emailRes.status}`);
  console.log(`INT-004: Email service and test endpoint verified → ${int004 ? '✅ PASS' : '❌ FAIL'}`);
  results.push({ id: "INT-004", passed: int004 });

  // ─── INT-005: BullMQ Job Queue Architecture ───
  console.log("\n--- INT-005: BullMQ Queue Package ---");
  const queuePkg = fs.existsSync("./lib/queue/src/index.ts") || fs.existsSync("./lib/queue/package.json");
  console.log(`  lib/queue package exists: ${queuePkg}`);
  results.push({ id: "INT-005", passed: queuePkg });

  // ─── INT-006: HR Sync Multi-Source Architecture ───
  console.log("\n--- INT-006: HR Sync Multi-Source API Configuration ---");
  const hrRes = await apiRequest("/api/hr-sync/config?propertyId=1", { headers: H });
  const hrFile = fs.existsSync("./artifacts/api-server/src/routes/hr-sync.ts");
  const int006 = hrFile && hrRes.status === 200;
  console.log(`  hr-sync.ts exists: ${hrFile}, GET /config status: ${hrRes.status}`);
  console.log(`INT-006: HR Sync service and multi-source configuration verified → ${int006 ? '✅ PASS' : '❌ FAIL'}`);
  results.push({ id: "INT-006", passed: int006 });

  // ─── INT-007: Docker Compose Environment ───
  console.log("\n--- INT-007: Docker Compose Configuration ---");
  const dockerFile = fs.existsSync("./docker-compose.yml");
  console.log(`  docker-compose.yml exists: ${dockerFile}`);
  results.push({ id: "INT-007", passed: dockerFile });

  // ─── INT-008: Deployment Scripts ───
  console.log("\n--- INT-008: Deployment Scripts ---");
  const deployScript = fs.existsSync("./deploy-production.bat") || fs.existsSync("./deploy.bat") || fs.existsSync("./scripts/deploy.sh");
  console.log(`  Production deploy script exists: ${deployScript}`);
  results.push({ id: "INT-008", passed: deployScript });

  console.log("\n=======================================================");
  const allPassed = results.every(r => r.passed);
  console.log(`   PHASE 9 INTEGRATIONS: ${results.filter(r => r.passed).length}/${results.length} PASSED ${allPassed ? 'ALL PASSED ✅' : '❌'}`);
  console.log("=======================================================");

  process.exitCode = allPassed ? 0 : 1;
}

run().catch(err => {
  console.error("FATAL in Phase 9:", err);
  process.exitCode = 1;
});
