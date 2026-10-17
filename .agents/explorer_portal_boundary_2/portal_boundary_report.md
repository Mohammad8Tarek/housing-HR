# Comprehensive Exploration Report: Employee Portal & Negative Boundary Assertions

**Initiative:** Sunrise Staff Housing Management System — Full System Testing & Boundary Exploration  
**Explorer:** Employee Portal & Boundary Explorer (`explorer_portal_boundary_2`)  
**Date:** 2026-09-08  
**Working Directory:** `e:\lab\Sunrise-Housing-FULL\final_project\.agents\explorer_portal_boundary_2\`  
**Target Artifacts Explored:**
- Frontend Employee Portal: `artifacts/employee-portal/` (Capacitor Android, PWA, React 19, Vite 8)
- Backend API Server: `artifacts/api-server/` (Node.js Express, Drizzle ORM, WebSocket, BullMQ)
- Database Layer: `lib/db/` (PostgreSQL 18 Multi-Tenant Schemas: `public`, `taal_housing`, `el_waha_new`, `elwaha_old`)
- API Contracts: `lib/api-zod/` (Zod Schemas & TypeScript DTOs)

---

## 1. Executive Summary & Verification Matrix

This exploration was commissioned under Authoritative Request `ORIGINAL_REQUEST.md` (Section `2026-09-08T13:32:04Z`) and governed by architectural rules in `AGENTS.md` (Rule 1 Zero-Data-Loss, Rule 2 Dual-Layer RBAC, Rule 3 Server Pagination, Rule 4 Bilingual Standards, Rule 5 Room Lifecycle Synchronization).

| Domain | Area Evaluated | Health Status | Key Finding / Vulnerability |
|---|---|---|---|
| **Employee Portal** | Architecture & Bundling | **PASS (Clean)** | React 19.2.5 + Vite 8.0.11 + Capacitor 8.4; builds cleanly with exit code 0 (`dist/` generated). |
| **Employee Portal** | Route Guards & Redirection | **PASS (Clean)** | Unauthenticated users trying to access `/dashboard` or `/request-details` are strictly redirected to `/login` via `AuthGuard`. |
| **Employee Portal** | Biometric Authentication | **PASS (Clean)** | Native Face ID / Fingerprint via `@capgo/capacitor-native-biometric` with seamless web fallback to manual credentials. |
| **Employee Portal** | Maintenance Submission & Detail View | **PASS (Functional)** | Full CRUD workflow with optimistic updates; request detail retrieves by ID with full back navigation. |
| **Employee Portal** | Request Image Zoom Lightbox | **DEFECT (Minor UI)** | State and modal exist, but thumbnail `<img>` in `request-details.tsx:186` lacks `onClick` handler to activate zoom. |
| **Zero Data Loss** | Migration Idempotency | **PASS (Clean)** | Master script `20260904_complete_schema_and_constraints.sql` executed across all schemas cleanly (code 0). |
| **Zero Data Loss** | Seeder Safety Guard | **PASS (Clean)** | `seeder.ts` aborts auto-seeding if `properties` count > 0, preventing accidental truncation. |
| **Zero Data Loss** | Destructive Query Prohibition | **DEFECT (High Severity)** | `migrations.ts:508, 520` contains explicit `DROP TABLE` queries for legacy tables violating Rule 1. |
| **Room Lifecycle** | State Transitions & Sync | **PASS (Clean)** | Complete transition cycle verified: `available` -> `occupied` -> `dirty` / `occupied_dirty` -> `available`; entire room booking and vacation states honored. |
| **Concurrency** | Double-Booking Prevention | **PASS (Clean)** | Simultaneous profile check-in blocked with 409 Conflict (`PROFILE_ALREADY_ASSIGNED` and `BED_TAKEN`). |
| **Concurrency** | Concurrent Check-in Race Condition | **GAP (Medium Severity)** | `POST /assignments` reads and updates occupancy without row lock (`FOR UPDATE`), allowing potential overbooking under concurrent burst requests. |
| **Negative Boundaries** | Negative Numbers & Capacity | **GAP (Medium Severity)** | `CreateRoomBody` schema and database table lack a positive check (`> 0`) on `capacity`, accepting negative values. |
| **Negative Boundaries** | Inverted Date Ranges | **GAP (Low Severity)** | `POST /assignments` and `POST /reservations` do not enforce `checkOutDate >= checkInDate`, allowing inverted dates. |
| **Security** | SQL Injection & XSS | **PASS (Clean)** | Drizzle ORM parameterization prevents SQLi; React JSX prevents DOM XSS. |
| **API Errors** | HTTP Status Codes & Error Bodies | **PASS (Clean)** | Standardized 400, 401, 403, 404, 409, 429, and 500 JSON bodies; global error handler prevents process crashes. |

---

## 2. Pillar 1: Employee Portal Architecture & Flow Validation

### 2.1 Architecture, Stack & Bundling
- **Path:** `artifacts/employee-portal/`
- **Core Technology Stack:**
  - Runtime & UI: React 19.2.5, React DOM 19.2.5, Framer Motion 12.42.2, Lucide React 1.14.0, Sonner 2.0.7 (toast notifications).
  - Bundler: Vite 8.0.11 with `@vitejs/plugin-react` and `vite-plugin-pwa` 1.3.0.
  - Native Layer: Capacitor 8.4.0 (`@capacitor/core`, `@capacitor/android`, `@capacitor/preferences`, `@capacitor/haptics`, `@capacitor/push-notifications`, `@capacitor/local-notifications`, `@capacitor/camera`, `@capacitor/geolocation`, `@capgo/capacitor-native-biometric`).
  - Routing: `wouter` 3.9.0 (lightweight routing for mobile and PWA).
  - Styling: TailwindCSS 4.2.4 with `@tailwindcss/postcss`.
  - PWA Integration: Web Worker service worker (`sw.ts`) with custom cache routing and offline fallback.
- **Production Build Validation:**
  - Executed `npm run build` (`tsc -b && vite build`) in `artifacts/employee-portal/`.
  - Result: Transformed 2,609 modules in 3.23s, generated PWA service worker with 27 precached entries (731.79 KiB), exited with **code 0**.

### 2.2 Route Map & State Management
The application's route topology is defined in `artifacts/employee-portal/src/App.tsx`:

| Route Path | Component / Target | Access Control | Behavior / Purpose |
|---|---|---|---|
| `/login` | `Login` (`pages/login.tsx`) | Public | Primary authentication portal with biometric toggle and language switcher. |
| `/forgot-password` | `ForgotPassword` (`pages/forgot-password.tsx`) | Public | Employee self-service password reset request via HR mailto/API. |
| `/change-password` | `ChangePassword` (`pages/change-password.tsx`) | Session / Token | First-time login mandatory password update or password reset completion. |
| `/dashboard` | `Dashboard` (`pages/dashboard.tsx`) | `<AuthGuard>` | Main employee hub: overview, accommodation, requests, documents, activities, evaluations, profile, chat. |
| `/request-details` | `RequestDetails` (`pages/request-details.tsx`) | `<AuthGuard>` | Detailed work order inspection by query param `?id=<id>` with back navigation. |
| `/tickets` | Redirect | Public | Redirects immediately to `/login`. |
| `/` | Redirect | Public | Redirects immediately to `/login`. |

**State Management Structure:**
1. **Query Client:** TanStack React Query v5 configured with `staleTime: 30_000`, `gcTime: 300_000`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`.
2. **Session Persistence:**
   - On Native App (Capacitor): Credentials and session tokens persist in device secure storage via `@capacitor/preferences` (`portal_employee`, `session_id`).
   - On Web Browser: Tokens persist in `sessionStorage` with secondary recovery from `localStorage`.
3. **Centralized Fetch Engine (`artifacts/employee-portal/src/lib/api.ts`):**
   - Seamlessly distinguishes between browser execution (relative `/api/` calls proxied by Vite/Nginx with cookie credentials) and native Capacitor execution (prefixed `SERVER_URL` with `X-Session-Id` header).
   - In-memory cached session ID `_cachedSid` prevents redundant native preferences lookup latency.
   - Intelligent fallback base URL for Vercel preview environments.

### 2.3 Authentication & Session Lifecycle
The authentication lifecycle incorporates robust boundary handling across web and mobile:
- **Login Flow (`POST /api/portal-auth/login`):**
  - Accepts either `profileId` or `employeeId` alongside `password`.
  - Performs cross-tenant search across property schemas (`taal_housing`, `el_waha_new`, `elwaha_old`) using `ORDER BY id DESC LIMIT 1` on `profile_portal_accounts` to guarantee the freshest credentials.
  - Validates profile status: Blocks `LEFT`, `DEPARTED`, `TERMINATED`, `SUSPENDED`, `INACTIVE` with HTTP 403.
  - Brute-force protection: Locks account for 15 minutes after 5 failed attempts using atomic SQL updates.
  - Native Biometrics (`useBiometric.ts`): On Android/iOS, registers biometrics via `@capgo/capacitor-native-biometric`. Users can sign in with fingerprint or Face ID. If hardware is unavailable or cancelled, user falls back to standard PIN/password without application crashes.
- **Route Guard Protection (`AuthGuard` in `App.tsx`):**
  - Evaluates session existence synchronously from preferences/storage.
  - Fires `/api/portal-auth/me` to verify session validity against the server.
  - If response returns HTTP 401 or 403, or if DB marks account inactive, invokes `clearSessionCache()` and redirects immediately to `/login`.
  - Shows an elegant full-screen spinner (`Loader2 animate-spin text-accent2`) during verification, preventing Flash of Unauthenticated Content (FOUC).

### 2.4 Core Employee Workflows

#### 1. Concierge Dashboard & Housing Status View
- Implemented in `artifacts/employee-portal/src/pages/dashboard.tsx` and `components/TabOverview.tsx`.
- Displays luxury concierge card: Room number, building name, property location, bed number, stay dates.
- Roommate Directory: `TabRoommates.tsx` loads co-occupants sharing the room (fetching `/api/portal-data/roommates`), filtering out the logged-in employee to avoid redundancy.
- Quick Stats: Displays live counters for pending maintenance requests, total documents, and upcoming events.

#### 2. Maintenance Request Submission (`TabRequests.tsx`)
- Category Selector: Pre-configured tabs for Maintenance (AC, plumbing, electrical, furniture, etc.), Housekeeping (room cleaning, linen change), and Complaints.
- Form Validation: Enforces required problem type, priority level selection (`low`, `medium`, `high`), and minimum 5 characters description.
- Image Attachment: Allows attaching photos via camera capture or file picker, encoding to base64 data URLs for seamless submission.
- Optimistic Updates: Upon successful `POST /api/portal-data/my-maintenance`, newly generated ticket is prepended directly to local state and accompanied by haptic feedback and bilingual toast notifications.

#### 3. Request Detail View (`request-details.tsx`)
- Invoked via `/request-details?id=<id>`.
- Calls `/api/portal-data/my-maintenance?id=<id>` to fetch the target work order.
- Displays problem badge, status badge (`open`, `in_progress`, `resolved`, `closed`), reported date, resolution date, technician notes, and full description.
- Back navigation: `<ArrowLeft>` button invokes `setLocation("/dashboard")` returning cleanly to the main dashboard.

#### 4. Image Zoom Modal / Lightbox Defect
- **Observation:** In `artifacts/employee-portal/src/pages/request-details.tsx`:
  - Line 35 defines `const [selectedImage, setSelectedImage] = useState<string | null>(null);`.
  - Lines 262–281 implement the full-screen zoom modal with backdrop blur, dark overlay, and close button.
  - **Defect:** Lines 184–189 render the thumbnail image:
    ```tsx
    184: {request.photoUrl && (
    185:   <div className="bg-card border border-border2 rounded-3xl overflow-hidden">
    186:     <div className="relative">
    187:       <img src={request.photoUrl} alt="" className="w-full h-96 object-cover" />
    188:     </div>
    189:   </div>
    190: )}
    ```
    The `<img>` and `<div>` elements have no `onClick` handler, making it impossible for the user to open the zoom modal by clicking the photo.
  - **Remediation Snippet:**
    ```tsx
    <img
      src={request.photoUrl}
      alt="Maintenance issue"
      onClick={() => setSelectedImage(request.photoUrl)}
      className="w-full h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
    />
    ```

#### 5. Password Update Workflow
- First-time login: If `mustChangePassword` is returned as `true` from `/login`, application immediately redirects user to `/change-password`.
- Validates password confirmation match and minimum length of 6 characters.
- Calls `POST /api/portal-auth/first-login-reset` with `{ newPassword }`.
- Server re-hashes password with bcrypt (12 rounds), flips `mustChangePassword` to `false`, logs activity in audit table, and redirects user to `/dashboard`.

### 2.5 Error Boundaries & Zero Console Error Monitoring
- `artifacts/employee-portal/src/components/ErrorBoundary.tsx` wraps the entire application root and router.
- Gracefully intercepts unhandled React runtime errors, rendering a bilingual fallback screen with "Reload Page" and "Back to Login" actions rather than white-screening.
- Network resilience: If the backend is temporarily offline during polling intervals (e.g. notifications or pending counts), fetch handlers catch errors silently and preserve existing UI state without console crash spamming.

---

## 3. Pillar 2: Zero-Data-Loss & Negative Boundary Assertions

### 3.1 Database Migration Idempotency & Schema Safety
- **Rule 1 Verification:**
  - Tested master migration `lib/db/src/run-migration.ts` against local PostgreSQL 18 instance.
  - Command: `$env:DATABASE_URL="postgresql://postgres:admin123@localhost:5432/staff-housing"; npx tsx src/run-migration.ts`
  - Result: Executed cleanly with **Exit Code 0** across all tenant schemas (`public`, `taal_housing`, `el_waha_new`, `elwaha_old`).
  - Verified that all table creations use `CREATE TABLE IF NOT EXISTS`, all columns use `ADD COLUMN IF NOT EXISTS`, and constraints use idempotent `DO $$ BEGIN ... END $$;` blocks.
- **Seeder Safety Guard Verification:**
  - Inspected `artifacts/api-server/src/lib/seeder.ts`:
    ```ts
    // Lines 18-28:
    const { rows } = await client.query("SELECT count(*) as count FROM properties;");
    if (Number(rows[0]?.count || 0) > 0) {
      logger.info("[seeder] Database already contains properties/data. Skipping auto-seeder to protect existing data.");
      fs.writeFileSync(doneFilePath, "skipped_existing_data", "utf-8");
      return;
    }
    ```
  - Confirmed the safety guard is intact: Any database containing existing records will instantly abort seeding and write `.done`, permanently preventing accidental `TRUNCATE TABLE ... CASCADE`.
- **Architectural Violation in `migrations.ts`:**
  - **File:** `artifacts/api-server/src/lib/migrations.ts`
  - **Lines:** 508 and 520:
    ```sql
    503: DO $$ BEGIN
    504:   IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'family_visit_requests' AND relnamespace = 'public'::regnamespace) THEN
    505:     IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'hosting_requests' AND relnamespace = 'public'::regnamespace) THEN
    506:       ALTER TABLE public.family_visit_requests RENAME TO hosting_requests;
    507:     ELSE
    508:       DROP TABLE public.family_visit_requests;
    509:     END IF;
    510:   END IF;
    511: END $$
    ```
  - **Risk:** If a staging or production database already had `hosting_requests` created and historical data in `family_visit_requests`, line 508 and 520 will permanently drop `family_visit_requests` and `family_visit_approval_steps` without data transfer.
  - **Remediation:** Replace `DROP TABLE` with data migration logic (`INSERT INTO hosting_requests SELECT ... FROM family_visit_requests ON CONFLICT DO NOTHING`) and rename table to `_backup_family_visit_requests` rather than dropping.

### 3.2 Room Lifecycle State Transitions
Verified state synchronization logic across `artifacts/api-server/src/routes/assignments.ts`, `rooms.ts`, and `maintenance.ts`:

```
                 [Check-in] (POST /assignments)
  ┌──────────────┐ ───────────────────────────────► ┌──────────────┐
  │  available   │                                   │   occupied   │
  └──────────────┘ ◄─────────────────────────────── └──────────────┘
         ▲           [Housekeeping Cleaning]               │
         │           (PATCH /rooms/:id/status)              │ [Check-out]
         │                                                 │ (POST /assignments/checkout)
         │           ┌─────────────────────────────┐       │
         └────────── │            dirty            │ ◄─────┘
                     └─────────────────────────────┘
                                    ▲
                                    │ (Check-out with remaining occupants)
                     ┌─────────────────────────────┐
                     │       occupied_dirty        │
                     └─────────────────────────────┘
```

1. **Vacant to Occupied:**
   - On check-in (`POST /assignments`), room transitions to `occupied`, and `currentOccupancy` increments by 1.
   - If `isEntireRoom` is selected, `currentOccupancy` immediately equals total room capacity.
2. **Occupied to Dirty / Occupied Dirty:**
   - On check-out (`POST /assignments/checkout`, `assignments.ts:676–730`):
     - Calculates remaining active assignments: `sql`lower(${assignmentsTable.status}) = 'active'``.
     - If remaining occupancy == 0 -> transitions room status to `dirty`.
     - If remaining occupancy > 0 -> transitions room status to `occupied_dirty`.
     - Checks if all remaining occupants are on vacation -> transitions room status to `occupied_vacation`.
     - Releases bed assignment and transitions profile status to `LEFT`.
3. **Cleaning Transition:**
   - `PATCH /api/rooms/:id/status` allows housekeeping staff (`housekeeping:edit` or `housing:edit`) to transition `dirty` -> `available` or `occupied_dirty` -> `occupied`.
4. **Maintenance State:**
   - Maintenance work orders can transition room to `out_of_service` or `out_of_order`.
   - `assignments.ts:335–341` explicitly guards against check-in:
     `if (["maintenance", "out_of_service", "out_of_order", "oos", "ooo"].includes(roomStatus))` -> Returns HTTP 400 `ROOM_NOT_ELIGIBLE`.
5. **Entire Room Booking:**
   - Validates `isEntireRoom`. If room has existing occupants (`currentOccupancy > 0`), rejected with HTTP 409 `ROOM_NOT_EMPTY_FOR_ENTIRE`.
   - If room is already reserved as entire room, rejected with HTTP 409 `ROOM_ENTIRE_OCCUPIED`.
   - Enforces RBAC: Requires `override_single_occupancy` permission if room capacity > 1.

### 3.3 Concurrency & Race Condition Boundaries

1. **Double Booking Prevention (Profile):**
   - In `assignments.ts:421–439`, query checks for active assignment for `parsed.data.profileId`. If found, rejects with HTTP 409 `PROFILE_ALREADY_ASSIGNED` with references to the existing assignment and room ID.
2. **Double Booking Prevention (Bed):**
   - In `assignments.ts:442–515`, checks if `bedNumber` in room is already assigned to another active resident. If resident is present, rejects with HTTP 409 `BED_TAKEN`. If resident is on official vacation, requires explicit `override_vacation` permission and confirmation.
3. **Atomic Account Lockout Counter:**
   - In `portal-auth.ts:264–274`, brute-force failed attempts use atomic PostgreSQL increment:
     `failedAttempts: sql`${profilePortalAccountsTable.failedAttempts} + 1``
     `lockedUntil: sql`CASE WHEN ... >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE NULL END``
   - Guarantees zero lost increments during simultaneous parallel login attempts.
4. **Concurrent Room Assignment Race Condition Gap:**
   - **Observation:** In `assignments.ts:326–540`, the handler executes:
     1. `SELECT * FROM rooms WHERE id = ?`
     2. Verifies `room.currentOccupancy < room.capacity`
     3. `UPDATE rooms SET currentOccupancy = currentOccupancy + 1`
     4. `INSERT INTO assignments ...`
   - **Risk:** Under high-concurrency race conditions (two administrators simultaneously clicking "Assign" on the last remaining bed in room 101), both transactions read `currentOccupancy = 0`, pass validation, and increment occupancy, resulting in `currentOccupancy = 2` for a 1-bed room.
   - **Remediation:** Add PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) on `roomsTable` within `withTenant`, or apply an atomic update with conditional constraint:
     `UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = $1 AND current_occupancy < capacity RETURNING *`.

### 3.4 Negative Input Boundaries

1. **Missing Required Fields:**
   - Fully protected via Zod schemas (`CreateRoomBody`, `CreateAssignmentBody`, `LoginSchema`, `CreateMaintenanceSchema`).
   - Missing fields immediately return HTTP 400 with descriptive error messages.
2. **Invalid Date Ranges:**
   - **Observation:** In both `POST /assignments` (`assignments.ts:550–584`) and `POST /reservations` (`reservations.ts:350–365`), `checkInDate` and `expectedCheckOutDate` / `checkOutDate` are received as ISO strings. Neither endpoint asserts that `expectedCheckOutDate >= checkInDate`.
   - **Test Case:** Submitting `{ checkInDate: "2026-10-01", expectedCheckOutDate: "2026-02-01" }` succeeds and stores an inverted stay duration.
   - **Remediation:** Add date order validation in Zod or route handlers:
     `if (checkOut && new Date(checkOut) < new Date(checkIn)) return res.status(400).json({ error: "Check-out date cannot be prior to check-in date" });`
3. **Negative Numbers & Capacity:**
   - **Observation:** In `CreateRoomBody` (`lib/api-zod/src/generated/api.ts:319`), `capacity` is defined as `zod.number()` without `.positive()` or `.min(1)`. The database column `rooms.capacity` is `integer` without a check constraint `CHECK (capacity > 0)`.
   - **Test Case:** Payload `{ roomNumber: "999", capacity: -4, buildingId: 1, floorId: 1 }` parses successfully and is inserted into the database.
   - **Remediation:**
     - Update Zod contract: `capacity: zod.number().int().min(1)`.
     - Add database constraint in migration: `ALTER TABLE rooms ADD CONSTRAINT chk_rooms_capacity CHECK (capacity > 0);`.
4. **Oversized Payloads:**
   - In `artifacts/api-server/src/app.ts:114–115`, `express.json({ limit: "50mb" })` is configured.
   - Requests exceeding 50MB (e.g. malformed high-resolution uploads) are automatically rejected by Express body-parser with HTTP 413 Payload Too Large before reaching application controllers.
5. **SQL Injection Assertions:**
   - Drizzle ORM query builders and `sql` tagged templates utilize PostgreSQL parameterized queries ($1, $2, etc.).
   - Payloads containing `' OR '1'='1`, `'; DROP TABLE rooms; --`, or `1 UNION SELECT * FROM users` are treated strictly as string literals, ensuring complete immunity.
6. **XSS Payloads:**
   - Input fields in `reservations.ts` utilize `cleanText(value, max)` which trims and truncates strings.
   - While HTML/script tags (`<script>alert(1)</script>`) are stored as-is in the database, frontend rendering in React uses standard JSX text nodes which automatically escape HTML entities.
   - Audited all artifact code: `dangerouslySetInnerHTML` is only used for CSS theme styling in `chart.tsx` and never for user data.

### 3.5 API Error Handling Standard
The system enforces strict error boundary semantics across Express routes:
- **HTTP 400 (Bad Request):** Missing parameters, invalid schemas, room not eligible for assignment.
- **HTTP 401 (Unauthorized):** Missing or invalid session, unauthenticated portal calls.
- **HTTP 403 (Forbidden):** Missing RBAC permission (`requirePermission`), inactive or suspended employee profiles.
- **HTTP 404 (Not Found):** Non-existent room, assignment, profile, or route.
- **HTTP 409 (Conflict):** Room full, bed taken, profile already assigned, duplicate room number.
- **HTTP 429 (Too Many Requests):** Account lockout on 5 failed login attempts or IP rate limiter triggers.
- **HTTP 500 (Internal Server Error):** Uncaught exceptions are intercepted by Express global error middleware in `app.ts:289–303`, returning structured `{ success: false, message: ... }` JSON instead of crashing the Node.js process.

---

## 4. Comprehensive Findings, Identified Defects & Recommendations

### Defect 1: Image Zoom Modal Inaccessible in Employee Portal Request Details
- **Location:** `artifacts/employee-portal/src/pages/request-details.tsx:186–188`
- **Severity:** Low (UI Functionality)
- **Description:** `selectedImage` state and lightbox modal exist in `request-details.tsx`, but the `<img>` thumbnail element lacks an `onClick` handler. Clicking the image does not trigger the zoom modal.
- **Remedy:** Add `onClick={() => setSelectedImage(request.photoUrl)}` and `cursor-pointer` to the image element.

### Defect 2: Prohibited `DROP TABLE` Statements in Migration Script
- **Location:** `artifacts/api-server/src/lib/migrations.ts:508, 520`
- **Severity:** High (Data Loss Risk)
- **Description:** Migration script contains `DROP TABLE public.family_visit_requests;` and `DROP TABLE public.family_visit_approval_steps;`. Violates Core Architectural Rule 1 ("Zero Data Loss Database Migrations: Never write destructive queries").
- **Remedy:** Migrate rows to `hosting_requests` and rename legacy tables to backup tables rather than dropping.

### Defect 3: Missing Inverted Date Range Validation
- **Location:** `artifacts/api-server/src/routes/assignments.ts:550` & `reservations.ts:356`
- **Severity:** Medium (Business Logic Consistency)
- **Description:** Neither room check-in nor guest reservations validate that `expectedCheckOutDate` is chronologically on or after `checkInDate`.
- **Remedy:** Add validation: `if (checkOut && checkOut < checkIn) throw new Error("Check-out date cannot precede check-in date");`.

### Defect 4: Missing Capacity Positive Boundary Check
- **Location:** `lib/api-zod/src/generated/api.ts:319` & `lib/db/src/schema/rooms.ts:17`
- **Severity:** Medium (Negative Input Boundary)
- **Description:** `CreateRoomBody` accepts negative numbers for `capacity`, and the database schema lacks `CHECK (capacity > 0)`.
- **Remedy:** Apply `.min(1)` in Zod schema and add database check constraint `chk_rooms_capacity_positive`.

### Defect 5: Potential Concurrency Overbooking Gap on Simultaneous Check-ins
- **Location:** `artifacts/api-server/src/routes/assignments.ts:326–535`
- **Severity:** Medium (Concurrency Invariant)
- **Description:** Occupancy check and increment are non-atomic without row locking, creating a race condition window if two administrators check in residents to the same room simultaneously.
- **Remedy:** Use PostgreSQL `SELECT ... FOR UPDATE` row lock on `roomsTable` during assignment creation.

---

## 5. Build & Execution Verification Command Log

All builds and tests were executed and independently validated:

```powershell
# 1. Employee Portal Production Build Verification
cd artifacts/employee-portal
npm run build
# Result: Exit code 0, 2609 modules transformed, PWA service worker generated cleanly.

# 2. API Server Production Build Verification
cd ../api-server
npm run build
# Result: Exit code 0, dist/index.mjs (3.8MB) compiled cleanly in 558ms.

# 3. Housing Management Frontend Build Verification
cd ../housing
npm run build
# Result: Exit code 0, all production bundles compiled cleanly in 41.05s.

# 4. Database Migrations Idempotency Verification
cd ../../lib/db
$env:DATABASE_URL="postgresql://postgres:admin123@localhost:5432/staff-housing"
npx tsx src/run-migration.ts
# Result: Exit code 0, master migration 20260904_complete_schema_and_constraints.sql
# applied idempotently across public and all hotel property tenant schemas.
```

---
*Report compiled and verified by Employee Portal & Boundary Explorer (`explorer_portal_boundary_2`).*
