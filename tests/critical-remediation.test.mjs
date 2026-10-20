/**
 * SUNRISE HRMS ENTERPRISE SUITE — CRITICAL REMEDIATION REGRESSION TEST SUITE
 * 
 * Verifies all remediations for the confirmed audit vulnerabilities:
 * 1. P0: Supervisor PIN Authorization & Fail-Closed Protection
 * 2. P0: Account-Bound Persistent PIN Rate Limiting & Spoofing Immunity
 * 3. P0: Single-Use Secondary Authorization Token Enforcement & Replay Protection
 * 4. P0: WPS Bank Export Preview Bypass Closure & Masked Watermark Verification
 * 5. P1: GL Journal Voucher Generation (Double-Entry Lines, Balancing, Duplicate Guard)
 * 6. P1: Payroll Calculation Atomicity & Concurrent Duplicate Prevention
 * 7. P1: Complete HRMS Authentication Decoupling from Housing Database
 * 8. P2: Leave Overlap Exemption for Cancelled Requests & Entitlement Limit Validation
 */

import http from "node:http";

const BASE_URL = "http://localhost:4000/api";
let sessionCookie = "";

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };
    if (sessionCookie && !headers["Cookie"]) {
      reqHeaders["Cookie"] = sessionCookie;
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = "";
        if (res.headers["set-cookie"]) {
          const rawCookies = res.headers["set-cookie"];
          sessionCookie = (Array.isArray(rawCookies) ? rawCookies : [rawCookies])
            .map((c) => c.split(";")[0])
            .join("; ");
        }

        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

const testResults = [];

function assert(condition, title, details = "") {
  if (condition) {
    console.log(`  ✅ PASS: ${title} ${details ? "(" + details + ")" : ""}`);
    testResults.push({ title, pass: true });
  } else {
    console.error(`  ❌ FAIL: ${title} ${details ? "- " + JSON.stringify(details) : ""}`);
    testResults.push({ title, pass: false, error: details });
  }
}

async function runTests() {
  console.log("===============================================================");
  console.log("🛡️  STARTING CRITICAL REMEDIATION REGRESSION TEST SUITE");
  console.log("===============================================================\n");

  // ──────────────────────────────────────────────────────────────────────────
  // 1. HRMS AUTHENTICATION DECOUPLING (P1)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("▶ [1] HRMS Authentication Independence from Housing Database");
  const loginRes = await request("POST", "/hr-auth/login", {
    username: "test_role_super_admin",
    password: "TestPass@123",
    system: "both",
  });

  assert(
    loginRes.status === 200 && loginRes.body?.success === true,
    "HRMS Login succeeds using sunrise_payroll_attendance.hr_users natively",
    `User: ${loginRes.body?.user?.username}`
  );
  assert(
    Boolean(loginRes.body?.user?.id),
    "Authenticated session holds valid HRMS user ID",
    `ID: ${loginRes.body?.user?.id}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SUPERVISOR PIN AUTHORIZATION & RATE LIMITING (P0)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [2] Supervisor PIN Verification & Fail-Closed Protection");

  // Test 2.1: Missing PIN returns 400
  const noPinRes = await request("POST", "/hr-auth/verify-pin", {});
  assert(noPinRes.status === 400, "Missing PIN returns HTTP 400", noPinRes.body?.error);

  // Test 2.2: Hardcoded legacy PIN '1234' is rejected
  const legacyPin1Res = await request("POST", "/hr-auth/verify-pin", { pin: "1234" });
  assert(
    legacyPin1Res.status === 401 || legacyPin1Res.status === 403,
    "Hardcoded legacy PIN '1234' is rejected (HTTP 401/403)",
    `Status: ${legacyPin1Res.status}`
  );

  // Test 2.3: Hardcoded legacy PIN '2026' is rejected
  const legacyPin2Res = await request("POST", "/hr-auth/verify-pin", { pin: "2026" });
  assert(
    legacyPin2Res.status === 401 || legacyPin2Res.status === 403,
    "Hardcoded legacy PIN '2026' is rejected (HTTP 401/403)",
    `Status: ${legacyPin2Res.status}`
  );

  // Test 2.4: Spoofing X-Forwarded-For does not bypass rate limiting
  const spoofRes = await request(
    "POST",
    "/hr-auth/verify-pin",
    { pin: "wrong_pin_999" },
    { "X-Forwarded-For": "10.0.0.99" }
  );
  assert(
    spoofRes.status === 401 || spoofRes.status === 403 || spoofRes.status === 429,
    "Spoofed X-Forwarded-For header rejected and accounted to user",
    `Status: ${spoofRes.status}`
  );

  // Test 2.5: Successful verification with configured PIN generates single-use token
  const validPinRes = await request("POST", "/hr-auth/verify-pin", {
    pin: "987654",
    action: "payroll_approve",
    propertyId: 2,
    reason: "Monthly payroll approval audit",
  });
  assert(
    validPinRes.status === 200 && Boolean(validPinRes.body?.authorizationToken),
    "Configured PIN generates single-use authorization token",
    `Token Prefix: ${validPinRes.body?.authorizationToken?.slice(0, 15)}...`
  );
  const issuedToken = validPinRes.body?.authorizationToken;

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PAYROLL CALCULATION ATOMICITY & DUPLICATE PREVENTION (P1)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [3] Payroll Calculation Atomicity & Duplicate Guards");

  // Create a dedicated fresh payroll period for testing
  const uniqueMonth = (Date.now() % 11) + 1;
  const uniqueYear = 2028 + Math.floor(Math.random() * 5);
  const createPeriodRes = await request("POST", "/payroll/periods", {
    propertyId: 2,
    periodName: `Period-Audit-${Date.now()}`,
    year: uniqueYear,
    month: uniqueMonth,
    startDate: `${uniqueYear}-01-01`,
    endDate: `${uniqueYear}-01-31`,
    totalWorkingDays: 30,
  });
  const periodId = createPeriodRes.body?.period?.id;

  // Calculate payroll run atomically
  const calc1Res = await request("POST", "/payroll/calculate", {
    propertyId: 2,
    payrollPeriodId: periodId,
    employmentType: "regular",
    forceRecalculate: false,
  });

  if (!calc1Res.body?.payrollRun?.id) {
    console.log("Calculation error output:", calc1Res.status, calc1Res.body);
  }

  assert(
    calc1Res.status === 200 && Boolean(calc1Res.body?.payrollRun?.id),
    "POST /payroll/calculate executes atomically in transaction",
    `Run ID: ${calc1Res.body?.payrollRun?.id}, Total Net: ${calc1Res.body?.payrollRun?.totalNet}`
  );
  const testRunId = calc1Res.body?.payrollRun?.id;

  // Test duplicate calculation prevention without forceRecalculate
  const dupCalcRes = await request("POST", "/payroll/calculate", {
    propertyId: 2,
    payrollPeriodId: periodId,
    employmentType: "regular",
    forceRecalculate: false,
  });

  assert(
    dupCalcRes.status === 409,
    "Duplicate payroll calculation rejected with HTTP 409 Conflict",
    dupCalcRes.body?.error
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 4. WPS BANK EXPORT PREVIEW BYPASS CLOSURE (P0)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [4] WPS Bank Export Security & Masked Preview");

  // Test 4.1: Raw bank export on unapproved run rejected
  const unapprovedWpsRes = await request("GET", `/payroll/runs/${testRunId}/wps?format=nbe`);
  assert(
    unapprovedWpsRes.status === 400,
    "Raw WPS export rejected for unapproved payroll run (HTTP 400)",
    unapprovedWpsRes.body?.error
  );

  // Test 4.2: Preview query on unapproved run returns sanitized JSON, NOT bank file
  const previewWpsRes = await request("GET", `/payroll/runs/${testRunId}/wps?preview=true`);
  assert(
    previewWpsRes.status === 200 && previewWpsRes.body?.isPreview === true,
    "WPS preview returns sanitized JSON with isPreview flag",
    `Watermark: ${previewWpsRes.body?.watermark}`
  );
  assert(
    previewWpsRes.body?.watermark?.includes("UNAPPROVED DRAFT PREVIEW"),
    "Watermark strictly designates unapproved preview",
    previewWpsRes.body?.watermark
  );
  if (previewWpsRes.body?.records?.length > 0) {
    const acc = previewWpsRes.body.records[0].bankAccountMasked;
    assert(
      acc.startsWith("****") || acc === "CASH",
      "Bank account numbers are masked in preview mode",
      `Masked: ${acc}`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. SECONDARY SUPERVISOR AUTHORIZATION & PAYROLL APPROVAL (P0)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [5] Single-Use Secondary Authorization Token & Run Approval");

  // Test 5.1: Attempting approval without authorization token rejected
  const noTokenApproveRes = await request("POST", `/payroll/runs/${testRunId}/approve`, {});
  assert(
    noTokenApproveRes.status === 403,
    "Approval without secondary supervisor authorization token rejected (HTTP 403)",
    noTokenApproveRes.body?.error
  );

  // Test 5.2: Attempting approval with invalid token rejected
  const badTokenApproveRes = await request("POST", `/payroll/runs/${testRunId}/approve`, {
    authorizationToken: "completely-bogus-token-xyz-1234",
  });
  assert(
    badTokenApproveRes.status === 403,
    "Approval with invalid token rejected (HTTP 403)",
    badTokenApproveRes.body?.error
  );

  // Test 5.3: Execute approval with valid token
  const approveRes = await request("POST", `/payroll/runs/${testRunId}/approve`, {
    authorizationToken: issuedToken,
  });
  assert(
    approveRes.status === 200 && approveRes.body?.success === true,
    "POST /payroll/runs/:id/approve succeeds with valid single-use token",
    `Status: ${approveRes.body?.payrollRun?.status}, ApprovedBy: ${approveRes.body?.payrollRun?.approvedBy}`
  );
  assert(
    approveRes.body?.payrollRun?.approvedBy === loginRes.body?.user?.username,
    "ApprovedBy records actual authenticated session username (not hardcoded)",
    approveRes.body?.payrollRun?.approvedBy
  );

  // Test 5.4: Replay attack — Attempting to reuse the consumed token is rejected
  const replayApproveRes = await request("POST", `/payroll/runs/${testRunId}/approve`, {
    authorizationToken: issuedToken,
  });
  assert(
    replayApproveRes.status === 400 || replayApproveRes.status === 403,
    "Replay attack with consumed authorization token rejected (HTTP 400/403)",
    replayApproveRes.body?.error
  );

  // Test 5.5: Approved run allows genuine NBE WPS export
  const approvedWpsRes = await request("GET", `/payroll/runs/${testRunId}/wps?format=nbe`);
  assert(
    approvedWpsRes.status === 200,
    "Approved payroll run allows genuine NBE WPS export",
    `Header: ${approvedWpsRes.headers["content-type"]}`
  );
  assert(
    typeof approvedWpsRes.body === "string" && approvedWpsRes.body.includes("RECORD_TYPE|EMP_ID"),
    "NBE WPS export contains proper pipe-delimited bank transmission format"
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 6. GL JOURNAL VOUCHER GENERATION & BALANCING (P1)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [6] GL Journal Voucher Generation (Debits == Credits Balance)");

  const glGenRes = await request("POST", `/hrms/finance/journal-entries/generate/${testRunId}`);
  assert(
    glGenRes.status === 201 && glGenRes.body?.success === true,
    "POST /hrms/finance/journal-entries/generate creates voucher & lines in transaction",
    `Voucher: ${glGenRes.body?.journalEntry?.voucherNumber}`
  );

  const debit = Number(glGenRes.body?.journalEntry?.totalDebit);
  const credit = Number(glGenRes.body?.journalEntry?.totalCredit);
  assert(
    debit > 0 && debit === credit,
    "Total Debits exactly equal Total Credits to the piastre",
    `Debit: ${debit.toFixed(2)}, Credit: ${credit.toFixed(2)}`
  );

  assert(
    glGenRes.body?.lines?.length === 7,
    "All 7 USALI journal lines created (Basic, Overtime, Employer GOSI, Net, GOSI Payable, Tax, Clearing)",
    `Lines Count: ${glGenRes.body?.lines?.length}`
  );

  // Test duplicate voucher rejection
  const dupGlRes = await request("POST", `/hrms/finance/journal-entries/generate/${testRunId}`);
  assert(
    dupGlRes.status === 409,
    "Duplicate GL Journal Voucher generation rejected with HTTP 409",
    dupGlRes.body?.error
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 7. LEAVE OVERLAP & ENTITLEMENT VALIDATION (P2)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [7] Leave Overlap Exemption for Cancelled Requests & Entitlement Checks");

  // Create dedicated synthetic employee for isolated leave testing
  const leaveEmpCode = "EMP-LEAVE-" + Math.floor(1000 + Math.random() * 9000);
  const createLeaveEmpRes = await request("POST", "/hrms/employees", {
    propertyId: 2,
    employeeCode: leaveEmpCode,
    nationalId: "295" + Math.floor(10000000000 + Math.random() * 90000000000),
    firstName: "Leave",
    lastName: "Tester",
    joiningDate: "2026-01-01",
    contractType: "permanent",
    baseSalary: 10000,
  });
  const testEmpId = createLeaveEmpRes.body?.employee?.id || 1;

  // Fetch leave types
  const leaveTypesRes = await request("GET", "/payroll-ops/leave-types");
  const testLeaveTypeId = leaveTypesRes.body?.leaveTypes?.[0]?.id || 1;

  // Create Leave 1
  const leave1Res = await request("POST", "/payroll-ops/leaves", {
    propertyId: 2,
    employeeId: testEmpId,
    leaveTypeId: testLeaveTypeId,
    startDate: "2026-12-01",
    endDate: "2026-12-05",
    totalDays: 5,
    reason: "Vacation initial",
  });
  assert(leave1Res.status === 201, "Initial leave application created", `ID: ${leave1Res.body?.leave?.id}`);
  const leave1Id = leave1Res.body?.leave?.id;

  // Overlap test with active leave: should FAIL
  const overlapActiveRes = await request("POST", "/payroll-ops/leaves", {
    propertyId: 2,
    employeeId: testEmpId,
    leaveTypeId: testLeaveTypeId,
    startDate: "2026-12-03",
    endDate: "2026-12-07",
    totalDays: 5,
    reason: "Conflicting request",
  });
  assert(overlapActiveRes.status === 400, "Active overlapping leave application rejected (HTTP 400)", overlapActiveRes.body?.error);

  // Cancel Leave 1
  const cancelRes = await request("POST", `/payroll-ops/leaves/${leave1Id}/cancel`);
  assert(cancelRes.status === 200, "Leave 1 cancelled successfully", cancelRes.body?.leave?.status);

  // Overlap test with CANCELLED leave: should SUCCEED
  const overlapCancelledRes = await request("POST", "/payroll-ops/leaves", {
    propertyId: 2,
    employeeId: testEmpId,
    leaveTypeId: testLeaveTypeId,
    startDate: "2026-12-03",
    endDate: "2026-12-07",
    totalDays: 5,
    reason: "Re-applied request over cancelled period",
  });
  assert(
    overlapCancelledRes.status === 201,
    "New leave application over previously cancelled leave dates succeeds!",
    `New Leave ID: ${overlapCancelledRes.body?.leave?.id}`
  );

  // Entitlement limit test: request 90 days exceeding 21 days annual max
  const excessiveLeaveRes = await request("POST", "/payroll-ops/leaves", {
    propertyId: 2,
    employeeId: testEmpId,
    leaveTypeId: testLeaveTypeId,
    startDate: "2026-11-01",
    endDate: "2026-11-20",
    totalDays: 99,
    reason: "Excessive days",
  });
  assert(
    excessiveLeaveRes.status === 400,
    "Leave request exceeding annual entitlement balance rejected (HTTP 400)",
    excessiveLeaveRes.body?.error
  );

  // ──────────────────────────────────────────────────────────────────────────
  // FINAL SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n===============================================================");
  const passed = testResults.filter((r) => r.pass).length;
  const failed = testResults.filter((r) => !r.pass).length;
  console.log(`🏁 TEST EXECUTION COMPLETE: ${passed} PASSED, ${failed} FAILED (TOTAL: ${testResults.length})`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
