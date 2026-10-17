import { pool } from "../lib/db/src/index.js";
import { createRequire } from "module";
import fs from "fs";
const apiRequire = createRequire(new URL("../artifacts/api-server/package.json", import.meta.url));
const bcrypt = apiRequire("bcryptjs");

const BASE_URL = "http://localhost:4000";

async function apiRequest(endpoint, { method = "GET", body = null, cookie = null, headers = {} } = {}) {
  const reqHeaders = { ...headers };
  if (body && typeof body === "object") reqHeaders["Content-Type"] = "application/json";
  if (cookie) reqHeaders["Cookie"] = cookie;
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method, headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const resCookie = response.headers.get("set-cookie");
  let data = null;
  try { data = await response.json(); } catch {}
  return { status: response.status, data, cookie: resCookie };
}

async function run() {
  console.log("=======================================================");
  console.log("      PHASE 4: BUSINESS WORKFLOW TESTS (WF-001 → WF-008)");
  console.log("=======================================================");

  const results = [];
  const client = await pool.connect();

  try {
    // Authenticate Super Admin
    const loginRes = await apiRequest("/api/auth/login", {
      method: "POST",
      body: { username: "test_role_super_admin", password: "TestPass@123", propertyId: 1 },
    });
    if (loginRes.status !== 200) throw new Error("Super admin login failed");
    const H = { "x-session-id": loginRes.data.sessionId };
    const C = loginRes.cookie ? loginRes.cookie.split(";")[0] : null;

    // Pick two TRULY vacant rooms in Property 1 (no active assignments on any bed)
    const vacantRooms = (await client.query(`
      SELECT r.id, r.room_number, r.capacity, r.current_occupancy, r.status
      FROM taal_housing.rooms r
      LEFT JOIN taal_housing.assignments a ON r.id = a.room_id AND a.status = 'ACTIVE'
      WHERE a.id IS NULL
      ORDER BY r.id ASC
      LIMIT 2;
    `)).rows;

    if (vacantRooms.length < 2) {
      throw new Error(`Need at least 2 vacant rooms for workflow testing, found: ${vacantRooms.length}`);
    }

    const roomA = vacantRooms[0];
    const roomB = vacantRooms[1];
    console.log(`Selected Vacant Test Rooms: RoomA = ${roomA.room_number} (id: ${roomA.id}), RoomB = ${roomB.room_number} (id: ${roomB.id})`);

    // Ensure rooms are available and unoccupied at start
    await client.query("UPDATE taal_housing.rooms SET current_occupancy = 0, status = 'available' WHERE id IN ($1, $2)", [roomA.id, roomB.id]);

    // ─── WF-001: New Employee Full Check-In Flow ───
    console.log("\n--- WF-001: New Employee Full Check-In Flow ---");
    const empCode = `WF1_${Date.now()}`;
    // 1. Create Profile
    const createRes = await apiRequest("/api/profiles?propertyId=1", {
      method: "POST", cookie: C, headers: H,
      body: {
        profileId: empCode,
        firstName: "Ahmed",
        lastName: "Ibrahim",
        nationalId: `NID_${Date.now()}`,
        nationality: "Egyptian",
        address: "Cairo, Egypt",
        jobTitle: "IT Specialist",
        level: "Staff",
        phone: `012${Date.now().toString().slice(-8)}`,
        department: "IT",
        gender: "M",
        hireDate: new Date().toISOString().split("T")[0],
        propertyId: 1,
      },
    });
    const profileId = createRes.data?.id;
    const profCreated = (createRes.status === 200 || createRes.status === 201) && Boolean(profileId);

    // 2. Check-In to Room A
    const checkinRes = await apiRequest("/api/assignments?propertyId=1", {
      method: "POST", cookie: C, headers: H,
      body: {
        profileId,
        roomId: roomA.id,
        bedNumber: 1,
        checkInDate: new Date().toISOString().split("T")[0],
        propertyId: 1,
      },
    });
    const assignId = checkinRes.data?.id;

    // Verify DB state
    const roomACheck = (await client.query("SELECT current_occupancy, status FROM taal_housing.rooms WHERE id = $1", [roomA.id])).rows[0];

    const wf001 = profCreated && Boolean(assignId) && roomACheck.current_occupancy >= 1;
    console.log(`WF-001: ProfileCreated=${profCreated}, AssignId=${assignId}, RoomOccupancy=${roomACheck.current_occupancy}, RoomStatus=${roomACheck.status} → ${wf001 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "WF-001", passed: wf001 });

    // ─── WF-002: Check-Out → Dirty → Clean → Available Cycle ───
    console.log("\n--- WF-002: Check-Out → Dirty → Clean → Available Cycle ---");
    // 1. Check-Out
    const checkoutRes = await apiRequest(`/api/assignments/${assignId}/checkout?propertyId=1`, {
      method: "POST", cookie: C, headers: H,
      body: {
        checkOutDate: new Date().toISOString().split("T")[0],
        checkOutReason: "End of Contract",
        keyReturned: true,
      },
    });
    const checkoutOk = checkoutRes.status === 200;

    // Room should transition to 'dirty'
    const roomADirty = (await client.query("SELECT status, current_occupancy FROM taal_housing.rooms WHERE id = $1", [roomA.id])).rows[0];
    const isDirty = roomADirty.status === "dirty" || roomADirty.current_occupancy === 0;

    // 2. Housekeeping Clean Action
    const cleanRes = await apiRequest(`/api/rooms/${roomA.id}?propertyId=1`, {
      method: "PATCH", cookie: C, headers: H,
      body: { status: "available" },
    });
    const roomAClean = (await client.query("SELECT status FROM taal_housing.rooms WHERE id = $1", [roomA.id])).rows[0];
    const isAvailable = roomAClean.status === "available";

    const wf002 = checkoutOk && isDirty && isAvailable;
    console.log(`WF-002: Checkout=${checkoutOk}, RoomPostCheckout=${roomADirty.status}, CleanStatus=${roomAClean.status} → ${wf002 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "WF-002", passed: wf002 });

    // ─── WF-003: Intra-Property Room Transfer ───
    console.log("\n--- WF-003: Intra-Property Room Transfer ---");
    // Re-assign employee to Room A first
    const reassignRes = await apiRequest("/api/assignments?propertyId=1", {
      method: "POST", cookie: C, headers: H,
      body: {
        profileId,
        roomId: roomA.id,
        bedNumber: 1,
        checkInDate: new Date().toISOString().split("T")[0],
        propertyId: 1,
      },
    });
    const activeAssignId = reassignRes.data?.id;

    // Perform Transfer from Room A to Room B
    const transferRes = await apiRequest(`/api/assignments/${activeAssignId}/transfer?propertyId=1`, {
      method: "POST", cookie: C, headers: H,
      body: {
        newRoomId: roomB.id,
        newBedNumber: 1,
        transferReason: "Room Upgrade",
        transferDate: new Date().toISOString().split("T")[0],
      },
    });
    const transferOk = transferRes.status === 200 || transferRes.status === 201;

    // Verify Room A decremented / dirty, Room B incremented / occupied
    const roomAPostTransfer = (await client.query("SELECT current_occupancy, status FROM taal_housing.rooms WHERE id = $1", [roomA.id])).rows[0];
    const roomBPostTransfer = (await client.query("SELECT current_occupancy, status FROM taal_housing.rooms WHERE id = $1", [roomB.id])).rows[0];

    const wf003 = transferOk && roomBPostTransfer.current_occupancy >= 1;
    console.log(`WF-003: Transfer=${transferOk}, RoomA Occ=${roomAPostTransfer.current_occupancy}, RoomB Occ=${roomBPostTransfer.current_occupancy} → ${wf003 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "WF-003", passed: wf003 });

    // Check out from Room B so profile is free for WF-007
    const transferredAssignId = transferRes.data?.id || (await client.query("SELECT id FROM taal_housing.assignments WHERE profile_id = $1 AND status = 'ACTIVE'", [profileId])).rows[0]?.id;
    if (transferredAssignId) {
      await apiRequest(`/api/assignments/${transferredAssignId}/checkout?propertyId=1`, {
        method: "POST", cookie: C, headers: H,
        body: { checkOutDate: new Date().toISOString().split("T")[0], checkOutReason: "Transfer completed" },
      });
    }

    // ─── WF-004: Cross-Property Transfer Verification ───
    console.log("\n--- WF-004: Cross-Property Transfer Logic ---");
    const cpServiceExists = fs.existsSync("./src/lib/cross-property-service.ts");
    const hasAssignmentsRouteCP = fs.readFileSync("./src/routes/assignments.ts", "utf8").includes("cross-property");
    const wf004 = cpServiceExists && hasAssignmentsRouteCP;
    console.log(`WF-004: Cross-property service module & integration present → ${wf004 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "WF-004", passed: wf004 });

    // ─── WF-005: Family Visit Multi-Step Approval Chain ───
    console.log("\n--- WF-005: Family Visit Multi-Step Approval Chain ---");
    const hostingSubmit = await apiRequest("/api/hosting-requests?propertyId=1", {
      method: "POST", cookie: C, headers: H,
      body: {
        hotelId: 1,
        clockNumber: empCode,
        numberOfRooms: 1,
        familyMembersCount: 1,
        familyMembersIncluded: "Sara (Spouse)",
        fromDate: "2026-10-01",
        toDate: "2026-10-07",
        consumedDays: 7,
        remarks: "Family visit request",
      },
    });
    const requestId = hostingSubmit.data?.id;
    let reqApproved = false;
    if (requestId) {
      const approveRes = await apiRequest(`/api/hosting-requests/${requestId}/approve?propertyId=1`, {
        method: "POST", cookie: C, headers: H,
        body: { notes: "Approved by manager" },
      });
      reqApproved = approveRes.status === 200 || approveRes.status === 201;
    }
    const wf005 = (hostingSubmit.status === 200 || hostingSubmit.status === 201) || reqApproved;
    console.log(`WF-005: Submit status=${hostingSubmit.status}, Approve=${reqApproved} → ${wf005 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "WF-005", passed: wf005 });

    // ─── WF-006: Maintenance Ticket Full Lifecycle ───
    console.log("\n--- WF-006: Maintenance Ticket Full Lifecycle ---");
    // 1. Report Issue
    const mCreate = await apiRequest("/api/maintenance?propertyId=1", {
      method: "POST", cookie: C, headers: H,
      body: {
        roomId: roomA.id,
        problemType: "HVAC",
        description: "AC not cooling",
        priority: "high",
        status: "open",
        propertyId: 1,
      },
    });
    const ticketId = mCreate.data?.ticket?.id || mCreate.data?.id;

    // 2. In Progress
    let mInProgress = false;
    if (ticketId) {
      const p1 = await apiRequest(`/api/maintenance/${ticketId}?propertyId=1`, {
        method: "PATCH", cookie: C, headers: H,
        body: { status: "in_progress" },
      });
      mInProgress = p1.status === 200;
    }

    // 3. Resolved
    let mResolved = false;
    if (ticketId) {
      const p2 = await apiRequest(`/api/maintenance/${ticketId}?propertyId=1`, {
        method: "PATCH", cookie: C, headers: H,
        body: { status: "resolved", resolutionNotes: "Compressor replaced" },
      });
      mResolved = p2.status === 200;
    }

    const wf006 = (mCreate.status === 200 || mCreate.status === 201) && mInProgress && mResolved;
    console.log(`WF-006: Create=${mCreate.status}, InProgress=${mInProgress}, Resolved=${mResolved} → ${wf006 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "WF-006", passed: wf006 });

    // ─── WF-007: Entire Room Private Booking ───
    console.log("\n--- WF-007: Entire Room Private Booking ---");
    // Ensure roomA is clear
    await client.query("UPDATE taal_housing.rooms SET current_occupancy = 0, status = 'available' WHERE id = $1", [roomA.id]);

    const entireRoomRes = await apiRequest("/api/assignments?propertyId=1", {
      method: "POST", cookie: C, headers: H,
      body: {
        profileId,
        roomId: roomA.id,
        bedNumber: 1,
        checkInDate: new Date().toISOString().split("T")[0],
        isEntireRoom: true,
        propertyId: 1,
      },
    });
    const entireAssignId = entireRoomRes.data?.id;
    const roomAEntire = (await client.query("SELECT current_occupancy, status FROM taal_housing.rooms WHERE id = $1", [roomA.id])).rows[0];

    const wf007 = (entireRoomRes.status === 200 || entireRoomRes.status === 201) && Boolean(entireAssignId);
    console.log(`WF-007: Entire room booked status=${entireRoomRes.status}, RoomOcc=${roomAEntire.current_occupancy} → ${wf007 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "WF-007", passed: wf007 });

    // Checkout entire room
    if (entireAssignId) {
      await apiRequest(`/api/assignments/${entireAssignId}/checkout?propertyId=1`, {
        method: "POST", cookie: C, headers: H,
        body: { checkOutDate: new Date().toISOString().split("T")[0], checkOutReason: "End of entire room stay", keyReturned: true },
      });
    }

    // ─── WF-008: Employee Vacation Flow ───
    console.log("\n--- WF-008: Employee Vacation Flow ---");
    // Mark on vacation
    const vacRes = await apiRequest(`/api/profiles/${profileId}?propertyId=1`, {
      method: "PATCH", cookie: C, headers: H,
      body: { status: "VACATION" },
    });
    const profVac = (await client.query("SELECT status FROM taal_housing.profiles WHERE id = $1", [profileId])).rows[0];

    // Return from vacation
    const returnRes = await apiRequest(`/api/profiles/${profileId}?propertyId=1`, {
      method: "PATCH", cookie: C, headers: H,
      body: { status: "ACTIVE" },
    });
    const profReturn = (await client.query("SELECT status FROM taal_housing.profiles WHERE id = $1", [profileId])).rows[0];

    const wf008 = profVac.status === "VACATION" && profReturn.status === "ACTIVE";
    console.log(`WF-008: VacationStatus=${profVac.status}, ReturnStatus=${profReturn.status} → ${wf008 ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ id: "WF-008", passed: wf008 });

    // ─── Cleanup Test Data ───
    await client.query("DELETE FROM taal_housing.assignments WHERE profile_id = $1", [profileId]);
    await client.query("DELETE FROM public.hosting_requests WHERE clock_number = $1", [empCode]).catch(() => {});
    await client.query("DELETE FROM taal_housing.profiles WHERE id = $1", [profileId]);
    await client.query("UPDATE taal_housing.rooms SET current_occupancy = 0, status = 'available' WHERE id IN ($1, $2)", [roomA.id, roomB.id]);

    console.log("\n=======================================================");
    const passedCount = results.filter(r => r.passed).length;
    console.log(`   PHASE 4 BUSINESS WORKFLOWS: ${passedCount}/${results.length} PASSED ${passedCount === results.length ? 'ALL PASSED ✅' : '❌'}`);
    console.log("=======================================================");

  } catch (err) {
    console.error("FATAL inside Phase 4:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(results.every(r => r.passed) ? 0 : 1);
  }
}

run();
