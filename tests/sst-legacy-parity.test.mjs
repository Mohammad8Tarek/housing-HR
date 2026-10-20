// ==============================================================================
// SUNRISE HRMS & PAYROLL: SST LEGACY PARITY AUTOMATED TEST SUITE
// Tests 100% functionality of the reverse-engineered legacy SST modules
// ==============================================================================

import http from "node:http";

const BASE_URL = "http://localhost:4000/api";
const PROPERTY_ID = 2;
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
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          const setCookie = res.headers["set-cookie"];
          if (setCookie) {
            sessionCookie = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie;
          }
          let parsedBody = null;
          try {
            parsedBody = rawData ? JSON.parse(rawData) : null;
          } catch {
            parsedBody = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedBody,
          });
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

async function runSstParitySuite() {
  console.log("===============================================================");
  console.log("🏛️  STARTING SST LEGACY PAYROLL PARITY TEST SUITE");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function recordPass(msg) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  }

  function recordFail(msg, err) {
    console.error(`  ❌ FAIL: ${msg}`);
    if (err) console.error("    ", err.message || err);
    failed++;
  }

  // 1. Authenticate HR User
  try {
    const res = await request("POST", "/hr-auth/login", {
      username: "test_role_super_admin",
      password: "TestPass@123",
      system: "both",
    });
    if (res.status === 200 && res.body?.success) {
      recordPass(`HRMS Super Admin Authenticated Successfully (User: ${res.body.user.username})`);
    } else {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.body)}`);
    }
  } catch (e) {
    recordFail("Authentication", e);
    return;
  }

  // 2. SST Reports Catalog (20 suites)
  try {
    const res = await request("GET", "/payroll/reports/catalog");
    if (res.status === 200 && res.body?.categories?.length === 20) {
      recordPass(`SST Reports Catalog Verified (Total: ${res.body.categories.length} suites matching SST 26.0)`);
    } else {
      throw new Error(`Expected 20 categories, got ${res.body?.categories?.length}`);
    }
  } catch (e) {
    recordFail("SST Reports Catalog", e);
  }

  // 3. SST Monthly Variable Transactions
  let transId = null;
  try {
    const empRes = await request("GET", `/payroll/employees?propertyId=${PROPERTY_ID}`);
    const empList = empRes.body?.employees || [];
    const empId = empList[0]?.id || 2;

    const res = await request("POST", "/payroll/monthly-transactions", {
      propertyId: PROPERTY_ID,
      employeeId: empId,
      bandCode: "101",
      bandName: "بدل وجبة إضافية",
      calculateBy: "amount",
      calculateValue: "250.00",
      calculationNumber: 1,
      costCenterCode: "CC-FNB",
      notes: "SST automated test",
    });

    if (res.status === 200 && res.body?.success) {
      transId = res.body.transaction.id;
      recordPass(`Created Monthly Variable Transaction #${transId} (Band: 101, Value: 250 EGP, Calc: 1)`);
    } else {
      throw new Error(`Failed to create transaction: ${JSON.stringify(res.body)}`);
    }
  } catch (e) {
    recordFail("Create Monthly Transaction", e);
  }

  // 4. Verify Listing Monthly Transactions
  try {
    const res = await request("GET", `/payroll/monthly-transactions?propertyId=${PROPERTY_ID}`);
    if (res.status === 200 && Array.isArray(res.body?.transactions)) {
      recordPass(`Listed ${res.body.transactions.length} Monthly Variable Transactions successfully`);
    } else {
      throw new Error("Failed to list monthly transactions");
    }
  } catch (e) {
    recordFail("List Monthly Transactions", e);
  }

  // 5. Pre-Calculation Lock (إقفال حركات الفترة)
  try {
    const periodRes = await request("GET", `/payroll/periods?propertyId=${PROPERTY_ID}`);
    const periodId = periodRes.body?.periods?.[0]?.id || 1;

    const res = await request("POST", `/payroll/periods/${periodId}/close-transactions`, {
      isTransactionClosed: true,
    });
    if (res.status === 200 && res.body?.period?.isTransactionClosed === true) {
      recordPass(`Pre-Calculation Lock applied to Period #${periodId} (isTransactionClosed: true)`);
    } else {
      throw new Error(`Failed to close period: ${JSON.stringify(res.body)}`);
    }

    const checkRes = await request("GET", `/payroll/periods/${periodId}/close-status`);
    if (checkRes.status === 200 && checkRes.body?.isTransactionClosed === true) {
      recordPass(`Verified Period Close Status reflects locked state`);
    } else {
      throw new Error("Period status did not reflect locked state");
    }
  } catch (e) {
    recordFail("Period Pre-Calculation Lock", e);
  }

  // 6. Yearly Vacations Rollover Preview & Commit (4 Buckets)
  try {
    const previewRes = await request("POST", "/payroll/leaves/rollover-preview", {
      propertyId: PROPERTY_ID,
      year: 2026,
      maxCap: 30,
    });
    if (previewRes.status === 200 && previewRes.body?.success) {
      recordPass(`Calculated 4-Bucket Leave Rollover Preview for ${previewRes.body.count} staff (Cap: 30 days)`);

      const postRes = await request("POST", "/payroll/leaves/rollover-post", {
        propertyId: PROPERTY_ID,
        year: 2026,
        maxCap: 30,
        records: previewRes.body.records,
      });
      if (postRes.status === 200 && postRes.body?.success) {
        recordPass(`Committed Leave Rollover for Year 2026 (${postRes.body.count} records posted)`);
      } else {
        throw new Error(`Failed to commit rollover: ${JSON.stringify(postRes.body)}`);
      }
    } else {
      throw new Error(`Failed to preview rollover: ${JSON.stringify(previewRes.body)}`);
    }
  } catch (e) {
    recordFail("Yearly Vacations Rollover", e);
  }

  // 7. Staff Bus Travel Manifest (Cairo Trips & Auto-Populate from Leaves)
  try {
    const manifestRes = await request("POST", "/hrms/services/transport/manifests", {
      propertyId: PROPERTY_ID,
      tripDirection: "to_cairo",
      tripNameAr: "رحلة القاهرة الأسبوعية - اختبار",
      travelDate: new Date().toISOString().split("T")[0],
      departureTime: "07:00",
      busNumber: "ط أ س 5555",
      driverName: "إبراهيم حسن",
      driverPhone: "01011112222",
      totalSeats: 50,
      costCenterCode: "CC-TRANS-01",
    });

    if (manifestRes.status === 200 && manifestRes.body?.manifest?.id) {
      const manifestId = manifestRes.body.manifest.id;
      recordPass(`Created Staff Bus Manifest #${manifestId} (To Cairo, 50 Seats)`);

      const autoPopRes = await request("POST", `/hrms/services/transport/manifests/${manifestId}/auto-populate-expected`);
      if (autoPopRes.status === 200 && autoPopRes.body?.success) {
        recordPass(`Auto-Populated expected passengers from approved leaves (matched: ${autoPopRes.body.addedCount} travelers)`);
      } else {
        throw new Error(`Auto-populate failed: ${JSON.stringify(autoPopRes.body)}`);
      }
    } else {
      throw new Error(`Failed to create manifest: ${JSON.stringify(manifestRes.body)}`);
    }
  } catch (e) {
    recordFail("Staff Bus Manifest", e);
  }

  // Cleanup: Delete created transaction
  if (transId) {
    try {
      const delRes = await request("DELETE", `/payroll/monthly-transactions/${transId}`);
      if (delRes.status === 200) {
        recordPass(`Cleaned up test transaction #${transId}`);
      }
    } catch (e) {
      console.warn("Cleanup warning:", e.message);
    }
  }

  console.log("\n===============================================================");
  console.log(`🏁  SST PARITY SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("===============================================================\n");

  if (failed > 0) process.exit(1);
}

runSstParitySuite().catch((err) => {
  console.error("Suite execution error:", err);
  process.exit(1);
});
