# Dual-Layer Role-Based Access Control (RBAC) & Multi-Tenant Specification Matrix
**Application:** Sunrise Staff Housing Management System  
**Document Type:** Authoritative Specification & Verification Matrix  
**Generated Date:** 2026-09-08  
**Scope:** Frontend (`artifacts/housing`), Backend API (`artifacts/api-server`), Database Schemas (`lib/db`)

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Dual-Layer RBAC (Frontend) | UI Component Gate (`<PermissionGate>`) | Conditionally renders interactive UI controls (buttons, menus, switches, tabs) only when the active user possesses the required `module.action` permission. | `module: Module`, `action: Action`, `fallback?: ReactNode`, `children: ReactNode` | Renders `children` if permitted; renders `fallback` (or `null`) if denied. | Silent suppression / fallback rendering (DOM omission). | `artifacts/housing/src/components/ui/permission-gate.tsx` |
| 2 | Dual-Layer RBAC (Frontend) | Route & Page Level Gate (`ProtectedRoute`) | Guards client-side routes in `App.tsx`. Unauthenticated users are redirected to `/login`; unauthorized users see a full-page bilingual 403 boundary. | Route navigation URL, `module: Module`, `action?: Action` | Renders page component if permitted. | Renders bilingual Access Denied (403) page with "Go to Home" button. | `artifacts/housing/src/App.tsx:105-162` |
| 3 | Dual-Layer RBAC (Frontend) | Dynamic Root Redirection | Evaluates user permissions on root path (`/`) and redirects to the first accessible module in priority order. | User effective permissions | Redirect to first permitted path (`/dashboard`, `/housing`, `/profiles`, etc.). | Redirects to `/login` if unauthenticated. | `artifacts/housing/src/App.tsx:164-185` |
| 4 | Dual-Layer RBAC (Frontend) | Sidebar Navigation Filtering | Filters navigation items in the main sidebar so that users only see links to modules they have `view` permission for. | User effective permissions | Filtered list of visible sidebar links (`visibleNavItems`). | Non-permitted module links omitted from sidebar DOM. | `artifacts/housing/src/components/layout/AppLayout.tsx:383-387` |
| 5 | Dual-Layer RBAC (Backend) | Global Session Guard | Intercepts all administrative Express routes mounted after line 80 in `routes/index.ts` and enforces active user session. | `req.session.userId` | Calls `next()` if session exists. | Returns HTTP 401 `{ success: false, message: "Unauthorized" }`. | `artifacts/api-server/src/routes/index.ts:72-80` |
| 6 | Dual-Layer RBAC (Backend) | Exact Route Permission Guard (`requirePermission`) | Protects Express route handlers by verifying that the authenticated user possesses the specific `module.action` permission. | `module: PermissionModule`, `action: PermissionAction`, user session | Calls `next()` if permission granted. | Returns HTTP 403 `{ error: "Permission denied: module.action" }`. | `artifacts/api-server/src/middlewares/permissions.ts:473-494` |
| 7 | Dual-Layer RBAC (Backend) | Disjunctive Permission Guard (`requireAnyPermission`) | Allows access if the user has ANY of the specified `[module, action]` permission pairs. | Array of `[PermissionModule, PermissionAction]` | Calls `next()` if at least one check passes. | Returns HTTP 403 `{ error: "Permission denied. Requires one of: ..." }`. | `artifacts/api-server/src/middlewares/permissions.ts:496-522` |
| 8 | Dual-Layer RBAC (Backend) | Dynamic Payload Mutation Guard | Inspects payload fields on user update and dynamically requires `users.manage_permissions`, `users.reset_password`, or `users.edit`. | `req.body` keys (`permissions`, `roles`, `password`) | Executes appropriate permission middleware chain. | Returns HTTP 403 on first failing guard. | `artifacts/api-server/src/routes/users.ts:43-66` |
| 9 | Dual-Layer RBAC (Backend) | Inline Multi-Action Guard | Verifies user has at least one of `accommodation:edit`, `housing:edit`, or `housekeeping:edit` for room status mutations. | User session, room ID, new status | Passes to handler if any of the 3 permissions exist. | Returns HTTP 403 `{ error: "Permission denied. Requires accommodation:edit, housing:edit, or housekeeping:edit" }`. | `artifacts/api-server/src/routes/rooms.ts:827-847` |
| 10 | Baseline Roles & RBAC | Role Inheritance Engine | Resolves inherited roles (e.g. `manager` automatically inherits all `receptionist` permissions) via recursive traversal. | `user.roles: string[]` | Set of effective role names and all inherited permissions. | Defaults to empty set for unknown roles. | `artifacts/api-server/src/middlewares/permissions.ts:85-106` |
| 11 | Baseline Roles & RBAC | Baseline Technical Roles | 9 baseline technical roles configured with granular permission mappings. | Role key string | Pre-configured permission set per role. | Unrecognized role yields no default permissions. | `artifacts/api-server/src/middlewares/permissions.ts:108-258` |
| 12 | Custom Overrides | Strict Override Mode | When `user.permissions` array is non-empty, role defaults are completely suppressed; only explicit permissions apply. | `user.permissions: string[]` | Set of explicitly granted permissions. | Role defaults excluded. | `artifacts/api-server/src/middlewares/permissions.ts:303-330` |
| 13 | Custom Overrides | Zero-Permission Override Safeguard | Saving `["none"]` allows explicit revocation of all permissions while preventing fallback to role defaults. | `permissions = ["none"]` | Effective permission set size = 0. | All protected actions return HTTP 403. | `artifacts/housing/src/pages/users/components/PermissionMatrixCenter.tsx:481-483` |
| 14 | Custom Overrides | Dynamic Role Inheritance Mode | Saving an empty array `[]` restores dynamic inheritance, causing the user to inherit baseline role permissions automatically. | `permissions = []` | `permissions.length === 0` triggers role defaults fallback. | None; returns role defaults. | `artifacts/housing/src/pages/users/components/PermissionMatrixCenter.tsx:479-480` |
| 15 | Security Hardening | Super Admin Self-Lockout Immunity | Guarantees `super_admin` and `system_admin` always retain `users.view` and `users.manage_permissions` regardless of custom overrides. | User role = `super_admin` / `system_admin` | Injects `users.view` and `users.manage_permissions` into effective permissions. | Impossible to lock admin out of user permissions. | `artifacts/api-server/src/middlewares/permissions.ts:318-327` |
| 16 | Multi-Tenant Isolation | Schema-Isolated Transaction Runner (`withTenant`) | Executes database queries within tenant schema using transaction-scoped `SET LOCAL search_path`. | `propertyId: number`, callback | Executes callback with `tenantDb` scoped to property schema. | Throws Error if `propertyId` invalid or schema missing. | `lib/db/src/index.ts:154-190` |
| 17 | Multi-Tenant Isolation | Single-Property User Restriction | Strictly restricts single-property users to their assigned property; rejects any request referencing another property. | `req.query.propertyId`, `req.body.propertyId` | Permits query if property in `authUser.propertyIds`. | Returns HTTP 403 `{ error: "Access denied to this property" }`. | `artifacts/api-server/src/middlewares/permissions.ts:433-437` |
| 18 | Multi-Tenant Isolation | Multi-Property Switching | Allows users with multiple `propertyIds` to switch active property and persists selection. | `PATCH /api/users/me/last-property`, body `{ propertyId }` | Updates `usersTable.lastPropertyId`. | Returns HTTP 400 if ID not number; HTTP 401 if unauthenticated. | `artifacts/api-server/src/routes/users.ts:709-731` |
| 19 | Multi-Tenant Isolation | Automated Tenant Schema Provisioner | Automatically provisions new PostgreSQL schema and clones 28 operational tables with sequence resets upon property creation. | `POST /api/properties`, body: property metadata | Creates schema `"{schemaName}"`, creates 28 tables, resets sequences. | Returns HTTP 400 on validation error, 500 on SQL failure (with rollback). | `artifacts/api-server/src/routes/properties.ts:51-243` |
| 20 | Authentication Boundary | Machine-to-Machine Webhook Authentication | Secures HR sync webhooks using cryptographic `x-api-key` header verification against `HR_SYNC_API_KEY`. | `req.headers["x-api-key"]` | Authorizes profile synchronization batch. | Returns HTTP 401 if key invalid; HTTP 403 in production if key not set. | `artifacts/api-server/src/routes/hr-sync.ts:157-168` |
| 21 | Authentication Boundary | Employee Portal Session Segregation | Isolates resident portal accounts (`req.session.portal`) from administrative staff accounts (`req.session.userId`). | Session cookie, `requirePortalAuth` | Permits access to self-service endpoints (`/api/portal-data/*`). | Returns HTTP 401 if portal session missing; denies admin accounts without portal credentials. | `artifacts/api-server/src/routes/portal-auth.ts` |
| 22 | Security Hardening | User Signature Access Protection | Restricts viewing and uploading signatures for other users strictly to system administrators. | `GET / POST /api/users/:id/signature` | Retrieves or saves PNG/JPEG data URL signature. | Returns HTTP 403 `{ error: "Only system admins can..." }` for non-admin callers. | `artifacts/api-server/src/routes/user-signature.ts:124-173` |
| 23 | Hardware Integration | Hotek PMS Smart Lock Socket Bridge | Bridges Express API with Hotek PMS TCP socket listener on port 10006 for RFID key card issuance and audit logging. | Room ID, guest ID, validity dates | Dispatches TCP packet to encoder; logs operation to `key_audit_log`. | Returns HTTP 503 if Hotek PMSServer is not connected. | `artifacts/api-server/src/routes/smart-lock.ts` & `lib/pms-server.ts` |
| 24 | Background Processing | Asynchronous Export Queue | Enqueues heavy report exports (Excel, PDF, CSV) to Redis BullMQ with tenant tagging and delivers via download endpoint. | `POST /api/jobs/export`, body: format, reportType | Returns HTTP 202 `{ jobId }`; serves artifact via `/api/jobs/:id/download`. | Returns HTTP 503 if Redis down; HTTP 404/410 if job expired. | `artifacts/api-server/src/routes/jobs.ts` |

---

## Edge Cases

| # | Feature | Input / Condition | Observed Behavior |
|---|---------|-------------------|-------------------|
| 1 | Single-Property User Isolation | Single-property user (assigned to Property 1) issues `GET /api/assignments/in-house?propertyId=2` | Request is intercepted by `loadAuthUser`. `requestedPropertyId(req)` extracts 2. Since 2 is not in `authUser.propertyIds`, the server immediately responds with HTTP 403 Forbidden `{ "error": "Access denied to this property" }`. No database query is executed. |
| 2 | Body Parameter Property Tampering | Single-property user posts `POST /api/maintenance` with JSON body `{ "propertyId": 2, "title": "AC Broken" }` | `loadAuthUser` extracts `req.body.propertyId` (2). Evaluates `!propertyIds.includes(2)` and immediately aborts with HTTP 403 Forbidden `{ "error": "Access denied to this property" }`. |
| 3 | Omission of Property Parameter | User submits request without `?propertyId` or body `propertyId` | `getTenantId(req)` falls back to `req.session.propertyId`. During `loadAuthUser`, `req.session.propertyId` is verified and clamped to `propertyIds[0]`. Query executes safely in assigned property schema. If user has no assigned property, `getTenantId` returns 0, and route returns HTTP 400 `{ "error": "propertyId is required" }`. |
| 4 | Super Admin vs Admin on `properties` | User with role `admin` attempts `POST /api/properties` | Evaluates `requirePermission("properties", "create")`. The baseline `admin` role explicitly excludes `properties` module. Request is rejected with HTTP 403 Forbidden `{ "error": "Permission denied: properties.create" }`. Only `super_admin` can manage properties. |
| 5 | Cross-Tenant Entity ID Query | User authenticated to Property 1 attempts `GET /api/profiles/:id` using an ID that exists only in Property 2 | Handler invokes `withTenant(1)`, setting `search_path TO taal_housing, public`. The SQL query searches `taal_housing.profiles`. Because the record resides in `el_waha_new.profiles`, 0 rows match. Server returns HTTP 404 Not Found `{ "error": "Profile not found" }`. |
| 6 | Zero-Permission Override (`["none"]`) | User with role `manager` has explicit permissions set to `["none"]` | In `effectivePermissions()`, `user.permissions.length > 0` activates Strict Mode. `"none"` is ignored during iteration. The resulting permission set is empty (`Set(0)`). When calling `GET /api/assignments/in-house`, `hasPermission` returns false. Server returns HTTP 403 Forbidden. Role defaults are completely suppressed. |
| 7 | Dynamic Inheritance Override (`[]`) | User with role `manager` has permissions updated to empty array `[]` | In `effectivePermissions()`, `user.permissions.length > 0` is false. The engine falls back to `resolveInheritedRoles(user.roles)`, populating all baseline manager permissions. Calling `GET /api/assignments/in-house` succeeds with HTTP 200. |
| 8 | Super Admin Lockout Attempt | Admin user sets `super_admin` user's permissions to `["none"]` | In `effectivePermissions()`, despite Strict Mode and empty set, lines 318-327 explicitly inject `users.view` and `users.manage_permissions`. The super admin can still view the users list and open the Permission Matrix Center to fix permissions. |
| 9 | Inactive Account Session | Account status is updated to `status = 'inactive'` in database while user has an active session | On the user's next request, `loadAuthUser` queries `usersTable`. It detects `status === 'inactive'`, destroys the session via `req.session.destroy()`, and returns HTTP 403 Forbidden `{ "error": "Account disabled" }`. |
| 10 | Portal User Calling Admin Route | Resident with active portal session submits request to `GET /api/users` | Express reaches line 78 of `routes/index.ts`. It checks `req.session?.userId`. Portal users only have `req.session.portal`, so `userId` is undefined. Express immediately responds with HTTP 401 Unauthorized `{ "success": false, "message": "Unauthorized" }`. |
| 11 | Admin Calling Portal Endpoint | Housing staff member with admin session calls `GET /api/portal-data/profile` without a portal account | Endpoint is guarded by `requirePortalAuth` in `portal-data.ts:45`. `req.session.portal` is undefined. Middleware responds with HTTP 401 Unauthorized `{ "success": false, "message": "Portal authentication required" }`. |
| 12 | HR Webhook Without API Key in Production | Attacker sends `POST /api/hr-sync/receive` without `x-api-key` when `NODE_ENV=production` and `HR_SYNC_API_KEY` is not set | Route checks lines 165-167 of `hr-sync.ts`. Server immediately returns HTTP 403 Forbidden `{ "error": "HR_SYNC_API_KEY not configured — webhook access denied in production" }`. |
| 13 | Cross-User Signature Access | Non-admin user (ID 5) requests `GET /api/users/2/signature` | `user-signature.ts:131` checks `!admin.isSystemAdmin && targetUserId !== admin.userId`. Since user 5 is not system admin and 2 !== 5, server responds with HTTP 403 Forbidden `{ "success": false, "message": "Only system admins can view other users' signatures" }`. |
| 14 | Room Status Multi-Permission Update | User with only `housekeeping.edit` (no `housing.edit` or `accommodation.edit`) patches `PATCH /api/rooms/10/status` | `rooms.ts:835-842` evaluates disjunctive check. Because `hasPermission(user, "housekeeping", "edit")` is true, the request is authorized and succeeds with HTTP 200. |
| 15 | Header Injection (`x-property-id`) | Malicious user supplies header `x-property-id: 2` to bypass query validation on `GET /api/assignments/in-house` | `getTenantId(req)` evaluates only `req.query.propertyId`, `req.body.propertyId`, and `req.session.propertyId`. The header `x-property-id` is completely ignored for database routing. Tenant schema remains strictly tied to session/query. |
| 16 | Case-Insensitive Role Normalization | User record has roles stored as `["Manager", "RECEPTIONIST"]` | `normalizeRoles` converts all role strings to lowercase (`manager`, `receptionist`). Inheritance engine resolves both without error. Permissions match correctly. |

---

## 1. Executive Architecture Summary

The Sunrise Staff Housing Management System employs a **Dual-Layer RBAC Architecture** paired with a **PostgreSQL 18 Multi-Tenant Schema Isolation** mechanism:

1. **Layer 1 — Frontend Enforcement (`artifacts/housing`):**
   - **UI Control Gating:** Interactive components, buttons, actions, and dialog triggers are wrapped in `<PermissionGate module="{module}" action="{action}">` from `@/components/ui/permission-gate.tsx`. Non-permitted elements are cleanly removed from the DOM or rendered as disabled fallbacks.
   - **Route / Page Protection:** Page routes are protected in `App.tsx` using `<PermissionLayout module="..." action="...">`. Unauthenticated users are redirected to `/login`, while authenticated users without module permission see a dedicated bilingual `403 Access Denied` boundary.
   - **Sidebar Navigation Filtering:** Navigation items in `AppLayout.tsx` evaluate `canView(module)` from `usePermission()`. Tabs and menus for forbidden modules are hidden from view.
   - **Dynamic Root Redirection:** The root URL (`/`) redirects users to their first permitted module via `RootRedirect()`.

2. **Layer 2 — Backend API Enforcement (`artifacts/api-server`):**
   - **Global Session Guard:** Express router-level middleware in `routes/index.ts` (lines 72-80) intercepts all administrative endpoints and asserts an active user session (`req.session.userId`), returning HTTP `401 Unauthorized` if missing.
   - **Route Guarding:** Endpoints apply `requirePermission(module, action)` or `requireAnyPermission(...)` from `middlewares/permissions.ts`. Forbidden attempts immediately return HTTP `403 Forbidden`.
   - **Dynamic Mutation Guards:** Sensitive endpoints such as `PATCH /api/users/:id` apply `requireUserUpdatePermission`, dynamically asserting `users.manage_permissions`, `users.reset_password`, or `users.edit` based on the mutated payload keys.
   - **Webhook & Machine Authentication:** External webhooks (e.g. HR sync) authenticate using cryptographic API keys (`x-api-key` matching `HR_SYNC_API_KEY`).
   - **Employee Portal Boundary:** Portal routes use dedicated portal sessions (`req.session.portal`) enforced by `requirePortalAuth`. Cross-talk between administrative and portal sessions is strictly rejected.

3. **Multi-Tenant Schema Isolation:**
   - Global administrative entities (`users`, `properties`, `user_sessions`, `password_history`, `user_signatures`) reside in the `public` schema.
   - Operational entities (`buildings`, `floors`, `rooms`, `profiles`, `assignments`, `reservations`, `maintenance`, `activity_logs`, `settings`, `hostings`, `documents`, etc.) are partitioned into hotel property schemas (`taal_housing`, `el_waha_new`, `elwaha_old`, and dynamic `prop_{id}`).
   - Isolation is enforced inside `withTenant(propertyId, callback)` via SQL transaction-scoped search paths (`SET LOCAL search_path TO "{schemaName}", public`). Search path changes do not leak across connection pool re-use.

---

## 2. Baseline Roles & Permission Hierarchy

### 2.1 Technical Role Hierarchy & Default Permissions
The system defines 9 core technical roles in `middlewares/permissions.ts` and `artifacts/housing/src/lib/permissions.ts`:

| Role Key | Arabic Display Name | English Display Name | Inherited Roles | Default Permissions Scope |
| :--- | :--- | :--- | :--- | :--- |
| `super_admin` | مدير النظام العام | Super Admin | None | All modules, all actions (`*`). Full access to `properties` and multi-tenant management. |
| `system_admin` | مدير النظام التقني | System Admin | None | All modules, all actions (`*`). Same as `super_admin`. |
| `admin` | مدير النظام | Property Admin | None | All module actions EXCEPT `properties` module. Includes `users.unlock`. |
| `manager` | مدير المجمع | Property Manager | `receptionist` | Inherits all `receptionist` permissions plus CRUD on housing, profiles, housekeeping, maintenance, accommodation, reservations, guest hosting, evaluations, users view/edit/manage_permissions/unlock, settings, documents, billing, activity log audit. |
| `receptionist` | موظف استقبال | Receptionist | None | Front desk operations: view/export housing, view housekeeping, view profiles, full in-house assignments/checkin/checkout/approve, reservations CRUD/checkin/checkout/approve, guest hosting CRUD, maintenance view/create/edit, reports view/export, activity log view. |
| `maintenance_staff` | موظف صيانة | Maintenance Staff | None | Maintenance operations: dashboard view, housing view, housekeeping view/edit, maintenance view/create/edit/assign/approve, profiles view, activity log view, documents view. |
| `hr_admin` | مسؤول الموارد البشرية | HR Admin | None | HR & personnel operations: dashboard view/export, profiles CRUD/export, evaluations CRUD/export, surveys CRUD, activities CRUD/publish, documents CRUD, portal content CRUD, communications CRUD, reports view/export, hosting requests CRUD, guest hosting CRUD. |
| `portal_admin` | مسؤول البوابة | Portal Admin | None | Portal content management: dashboard view, activities CRUD/publish, documents CRUD, portal content CRUD, communications CRUD, reports view. |
| `security_staff` | موظف أمن | Security Staff | None | Security & gate management: dashboard view, housing view, accommodation view, smart locks CRUD, activities view. |

### 2.2 Functional Role Mapping (Business Presets)
In accordance with system specifications and business workflows, specialized business roles map to the technical roles and presets as follows:

| Functional Role | Mapped Technical Role / Preset | Typical Workflow Responsibilities |
| :--- | :--- | :--- |
| **Super Admin** | `super_admin` | Complete multi-property governance, hotel provisioning, user provisioning across properties. |
| **General Manager** | `manager` (with `dashboard.audit`) | High-level property oversight, occupancy KPI monitoring, cross-department auditing. |
| **HR Director** | `hr_admin` | Staff onboarding, identity records, evaluations, leave/vacation synchronizations. |
| **Housing Manager** | `manager` | Building capacity allocations, room policy overrides, approval workflows. |
| **Housing Supervisor** | `manager` / `receptionist` | Room inspections, key allocations, floor readiness, check-in/out execution. |
| **Maintenance Supervisor**| `maintenance_staff` (with `maintenance.assign`, `approve`) | Work order dispatching, technician scheduling, repair SLA tracking. |
| **Front Desk** | `receptionist` | Resident registration, guest check-in, key card encoding, daily movements. |
| **Auditor** | Read-Only Preset + Audit perms | Read-only inspection of reports, historical transactions, system activity logs (`activity_log.view`, `activity_log.audit`, `reports.audit`). |
| **Viewer** | Read-Only Preset | Read-only visibility across modules without create/edit/delete/export actions. |

---

## 3. Custom Permission Overrides & Safeguards

### 3.1 Storage & Formats
- Custom permissions are stored in `usersTable.permissions` as a PostgreSQL string array (`text[]`).
- Dot notation (`module.action`) and colon notation (`module:action`) are symmetrically supported.
- Legacy alias `employees.*` is automatically mapped to `profiles.*`.

### 3.2 Dynamic Inheritance (`[]`) vs. Zero-Permission Safeguard (`["none"]`)
- **Empty Array (`[]`):** Treated as uncustomized. The user dynamically inherits default permissions from their assigned roles and role hierarchy.
- **Zero-Permission Override (`["none"]`):** Explicitly revokes all permissions while preventing fallback to role defaults. `effectivePermissions()` skips `"none"`, producing an empty set (0 permissions).
- **Admin Lockout Immunity:** Even with `["none"]`, `super_admin` and `system_admin` retain `users.view` and `users.manage_permissions`.

---

## 4. Multi-Tenant Property Isolation Architecture

### 4.1 Schema Isolation & Provisioning
- Hotel properties operate in distinct PostgreSQL schemas (`taal_housing`, `el_waha_new`, `elwaha_old`, `prop_{id}`).
- Created via `POST /api/properties`, which automatically clones 28 operational tables and initializes default settings.

### 4.2 Data Leak Vectors & Verification Assertions

| # | Vulnerability Vector | Attack Scenario | Defensive Mechanism | Expected Test Assertion |
| :- | :--- | :--- | :--- | :--- |
| **V1** | **Query Parameter Tampering** | Single-property user on Property 1 sends `GET /api/assignments/in-house?propertyId=2` | `loadAuthUser` extracts `req.query.propertyId`, validates against `authUser.propertyIds`. | HTTP `403 Forbidden` (`"Access denied to this property"`). |
| **V2** | **Payload Body Tampering** | Single-property user posts `POST /api/maintenance` with body `{ propertyId: 2, ... }` | `loadAuthUser` extracts `req.body.propertyId`, validates against `authUser.propertyIds`. | HTTP `403 Forbidden` (`"Access denied to this property"`). |
| **V3** | **Missing Property Parameter** | User omits `propertyId` query and body parameters | `getTenantId(req)` falls back to `req.session.propertyId`, clamped to `propertyIds[0]`. | Successfully queries assigned property; no cross-tenant leakage. |
| **V4** | **Cross-Tenant Entity ID Query** | User on Property 1 requests `GET /api/profiles/:id` using ID belonging to Property 2 | Query runs inside `withTenant(1)`, where `SET LOCAL search_path TO taal_housing, public`. Record does not exist in schema. | HTTP `404 Not Found`. |
| **V5** | **Header Tampering (`x-property-id`)** | Malicious client sends header `x-property-id: 2` to manipulate schema | `getTenantId(req)` strictly ignores `x-property-id` for database operations. | Operation executes strictly within session/query property schema. |
| **V6** | **Global Property Mutation** | Non-super-admin attempts `POST /api/properties`, `PATCH /api/properties/:id`, or `DELETE /api/properties/:id` | Protected by `requirePermission("properties", "create" | "edit" | "delete")`. Baseline `admin` has properties module excluded. | HTTP `403 Forbidden` (`"Permission denied: properties.*"`). |
| **V7** | **Portal Account Session Hijacking** | Employee portal user sends cookie to core admin endpoint `/api/users` | Global middleware in `routes/index.ts:79` requires `req.session.userId`. Portal users only have `req.session.portal`. | HTTP `401 Unauthorized` (`{ success: false, message: "Unauthorized" }`). |
| **V8** | **HR Sync Webhook Impersonation** | External attacker hits `POST /api/hr-sync/receive` without API key | Webhook asserts `req.headers["x-api-key"] === process.env["HR_SYNC_API_KEY"]`. Denies access in production if key is not configured. | HTTP `401 Unauthorized` or `403 Forbidden`. |
| **V9** | **Zero-Permission Override Bypass** | User with role `manager` has permissions set to `["none"]` | `effectivePermissions()` skips `"none"` and treats permissions set as empty (0 permissions). | HTTP `403 Forbidden` on all protected endpoints. |

---

## 5. Frontend PermissionGate Mapping Matrix

Every `<PermissionGate>` instance across the Housing frontend (`artifacts/housing/src/`) mapped to its file, control element, and wrapped action:

| # | File Path | Line | Module | Action | Wrapped Control Element | UI Description / Label |
| :- | :--- | :- | :--- | :--- | :--- | :--- |
| 1 | `components/ui/permission-gate.tsx` | 19 | `users` | `create` | Button | Add User |
| 2 | `pages/accommodation/guest-hosting/GuestHostingPage.tsx` | 1134 | `guest_hosting` | `export` | Button | AR: "تصدير Excel" / EN: "Export Excel" |
| 3 | `pages/accommodation/history.tsx` | 849 | `accommodation` | `delete` | Button | AR: "حذف السجل" / EN: "Delete Record" |
| 4 | `pages/accommodation/in-house.tsx` | 877 | `accommodation` | `edit` | Button | AR: "تمديد إقامة جماعي" / EN: "Bulk Extend" |
| 5 | `pages/accommodation/in-house.tsx` | 894 | `accommodation` | `checkout` | Button | AR: "تسجيل خروج جماعي" / EN: "Bulk Check-out" |
| 6 | `pages/accommodation/in-house.tsx` | 1217 | `accommodation` | `edit` | DropdownMenuItem | AR: "تمديد الإقامة" / EN: "Extend Stay" |
| 7 | `pages/accommodation/in-house.tsx` | 1226 | `accommodation` | `edit` | DropdownMenuItem | AR: "إعادة إصدار مفتاح" / EN: "Re-issue Key" |
| 8 | `pages/accommodation/in-house.tsx` | 1242 | `accommodation` | `export` | DropdownMenuItem | AR: "طباعة خطاب السكن" / EN: "Print Housing Letter" |
| 9 | `pages/accommodation/in-house.tsx` | 1250 | `accommodation` | `edit` | DropdownMenuItem | AR: "تسجيل عودة من الإجازة" / EN: "Return from Vacation" |
| 10 | `pages/accommodation/in-house.tsx` | 1280 | `accommodation` | `checkout` | DropdownMenuItem | AR: "خروج" / EN: "Checkout" |
| 11 | `pages/accommodation/in-house.tsx` | 1298 | `accommodation` | `transfer` | DropdownMenuItem | AR: "نقل لغرفة أخرى" / EN: "Room Move" |
| 12 | `pages/accommodation/reservations/ReservationsPage.tsx` | 1210 | `accommodation` | `create` | Button | AR: "حجز / تسكين جديد" / EN: "New Reservation / Assignment" |
| 13 | `pages/accommodation/reservations/ReservationsPage.tsx` | 1489 | `accommodation` | `edit` | DropdownMenuItem | AR: "تعديل" / EN: "Edit" |
| 14 | `pages/accommodation/reservations/ReservationsPage.tsx` | 1495 | `accommodation` | `edit` | DropdownMenuItem | AR: "إلغاء الحجز" / EN: "Cancel Reservation" |
| 15 | `pages/accommodation/reservations/ReservationsPage.tsx` | 1504 | `accommodation` | `delete` | DropdownMenuItem | AR: "حذف" / EN: "Delete" |
| 16 | `pages/dashboard.tsx` | 560 | `housing` | `view` | Unknown | AR: "عرض الكل" / EN: "View all" |
| 17 | `pages/dashboard.tsx` | 641 | `accommodation` | `view` | Unknown | AR: "عرض" / EN: "View" |
| 18 | `pages/documents.tsx` | 187 | `documents` | `create` | Button | AR: "رفع مستند" / EN: "Upload Document" |
| 19 | `pages/documents.tsx` | 305 | `documents` | `delete` | Button | AR: "حذف المستند" / EN: "Delete document" |
| 20 | `pages/housing/components/buildings/BuildingsTab.tsx` | 380 | `housing` | `create` | Button | AR: "إضافة مبنى" / EN: "Add Building" |
| 21 | `pages/housing/components/buildings/BuildingsTab.tsx` | 479 | `housing` | `edit` | Button | <Button |
| 22 | `pages/housing/components/buildings/BuildingsTab.tsx` | 489 | `housing` | `delete` | Button | <Button |
| 23 | `pages/housing/components/buildings/BuildingsTable.tsx` | 106 | `housing` | `edit` | Button | <Button |
| 24 | `pages/housing/components/buildings/BuildingsTable.tsx` | 116 | `housing` | `delete` | Button | <Button |
| 25 | `pages/housing/components/floors/FloorsTab.tsx` | 159 | `housing` | `create` | Button | AR: "إضافة طابق" / EN: "Add Floor" |
| 26 | `pages/housing/components/floors/FloorsTable.tsx` | 88 | `housing` | `edit` | Button | <Button |
| 27 | `pages/housing/components/floors/FloorsTable.tsx` | 98 | `housing` | `delete` | Button | <Button |
| 28 | `pages/housing/components/rooms/RoomsTab.tsx` | 480 | `housing` | `export` | Button | AR: "تصدير Excel" / EN: "Export Excel" |
| 29 | `pages/housing/components/rooms/RoomsTab.tsx` | 491 | `housing` | `create` | Button | AR: "إضافة غرفة" / EN: "Add Room" |
| 30 | `pages/housing/components/rooms/RoomsTab.tsx` | 505 | `housing` | `delete` | Button | AR: "حذف الغرف المحددة" / EN: "Delete Selected" |
| 31 | `pages/housing/components/rooms/RoomsTable.tsx` | 158 | `housing` | `edit` | Button | <Button |
| 32 | `pages/housing/components/rooms/RoomsTable.tsx` | 168 | `housing` | `delete` | Button | <Button |
| 33 | `pages/housing/HousingPage.tsx` | 136 | `housing` | `export` | Button | AR: "ar" / EN: "en" |
| 34 | `pages/housing/HousingPage.tsx` | 147 | `housing` | `create` | Button | AR: "استيراد غرف (Excel / CSV)" / EN: "Import Rooms (Excel / CSV)" |
| 35 | `pages/maintenance.tsx` | 957 | `maintenance` | `delete` | Button | AR: "حذف المحدد" / EN: "Delete" |
| 36 | `pages/maintenance.tsx` | 1227 | `maintenance` | `delete` | Button | <Button |
| 37 | `pages/profiles/components/ProfileGrid.tsx` | 234 | `profiles` | `edit` | Button | AR: "تعديل" / EN: "Edit" |
| 38 | `pages/profiles/components/ProfileGrid.tsx` | 264 | `profiles` | `edit` | DropdownMenuItem | AR: "تعديل الملف الشخصي" / EN: "Edit Profile" |
| 39 | `pages/profiles/components/ProfileGrid.tsx` | 270 | `profiles` | `edit` | DropdownMenuItem | AR: "إعادة تعيين كلمة المرور" / EN: "Reset Password" |
| 40 | `pages/profiles/components/ProfileGrid.tsx` | 276 | `profiles` | `delete` | DropdownMenuItem | AR: "حذف الملف الشخصي" / EN: "Delete Profile" |
| 41 | `pages/profiles/ProfilesPage.tsx` | 469 | `profiles` | `create` | Button | AR: "إضافة ملف شخصي" / EN: "New Profile" |
| 42 | `pages/profiles/ProfilesPage.tsx` | 557 | `profiles` | `delete` | Button | AR: "حذف المحدد" / EN: "Delete Selected" |
| 43 | `pages/profiles/ProfilesPage.tsx` | 991 | `profiles` | `edit` | DropdownMenuItem | AR: "تعديل" / EN: "Edit" |
| 44 | `pages/profiles/ProfilesPage.tsx` | 997 | `profiles` | `edit` | DropdownMenuItem | AR: "إعادة تعيين كلمة المرور" / EN: "Reset Password" |
| 45 | `pages/profiles/ProfilesPage.tsx` | 1003 | `profiles` | `delete` | DropdownMenuItem | AR: "حذف" / EN: "Delete" |
| 46 | `pages/properties.tsx` | 455 | `properties` | `create` | Button | AR: "إضافة عقار" / EN: "Add Property" |
| 47 | `pages/properties.tsx` | 616 | `properties` | `edit` | Button | AR: "استيراد تكوين الغرف والمباني" / EN: "Import Housing Config" |
| 48 | `pages/properties.tsx` | 638 | `properties` | `delete` | Button | AR: "هل أنت متأكد؟" / EN: "Are you sure?" |
| 49 | `pages/settings/components/LookupSection.tsx` | 308 | `settings` | `create` | Button | AR: "عدد الأسرة" / EN: "Number of beds" |
| 50 | `pages/settings/components/LookupSection.tsx` | 612 | `settings` | `edit` | Button | AR: "تعديل" / EN: "Edit" |
| 51 | `pages/settings/components/LookupSection.tsx` | 642 | `settings` | `delete` | Button | AR: "حذف" / EN: "Delete" |
| 52 | `pages/settings/index.tsx` | 158 | `settings` | `edit` | Button | AR: "جاري الحفظ..." / EN: "Saving..." |
| 53 | `pages/settings/index.tsx` | 263 | `settings` | `edit` | Button | AR: "جاري الحفظ..." / EN: "Saving..." |
| 54 | `pages/users/components/CreateUserDialog.tsx` | 309 | `users` | `create` | Button | AR: "إضافة مستخدم جديد" / EN: "Add New User" |
| 55 | `pages/users/index.tsx` | 418 | `users` | `create` | Unknown | <CreateUserDialog properties={properties ?? []} /> |
| 56 | `pages/users/index.tsx` | 443 | `users` | `manage_permissions` | Unknown | AR: "مركز ومصفوفة الصلاحيات الشاملة" / EN: "Permissions Center" |
| 57 | `pages/users/index.tsx` | 709 | `settings` | `delete` | Button | AR: "حذف المحدد" / EN: "Delete Selected" |
| 58 | `pages/users/index.tsx` | 1148 | `users` | `manage_permissions` | Button | AR: "إدارة الصلاحيات" / EN: "Manage Permissions" |
| 59 | `pages/users/index.tsx` | 1170 | `users` | `edit` | DropdownMenuItem | AR: "تعديل البيانات" / EN: "Edit User Data" |
| 60 | `pages/users/index.tsx` | 1181 | `users` | `manage_permissions` | DropdownMenuItem | AR: "تعديل سريع للصلاحيات" / EN: "Quick Permissions Edit" |
| 61 | `pages/users/index.tsx` | 1227 | `users` | `reset_password` | DropdownMenuItem | AR: "إعادة تعيين كلمة المرور" / EN: "Reset Password" |
| 62 | `pages/users/index.tsx` | 1241 | `users` | `unlock` | DropdownMenuItem | AR: "فتح قفل الحساب" / EN: "Unlock Account" |
| 63 | `pages/users/index.tsx` | 1254 | `users` | `delete` | DropdownMenuItem | AR: "حذف المستخدم" / EN: "Delete User" |

---

## 6. Comprehensive Backend API Route & Permission Matrix

Enumeration of all Express route endpoints across `artifacts/api-server/src/routes/`:

| # | Route File | Method | Full API Route Path | Permission Guard / Security Middleware | Tenant Isolation Mode |
| :- | :--- | :- | :--- | :--- | :--- |
| 1 | `activities.ts` | GET | `/api/activities` | requirePermission("activities", "view") | withTenant(propertyId) -> Schema isolated |
| 2 | `activities.ts` | POST | `/api/activities` | requirePermission("activities", "create") | withTenant(propertyId) -> Schema isolated |
| 3 | `activities.ts` | PUT | `/api/activities/:id` | requirePermission("activities", "edit") | withTenant(propertyId) -> Schema isolated |
| 4 | `activities.ts` | GET | `/api/activities/:id/registrations` | requirePermission("activities", "view") | withTenant(propertyId) -> Schema isolated |
| 5 | `activities.ts` | DELETE | `/api/activities/:id` | requirePermission("activities", "delete") | withTenant(propertyId) -> Schema isolated |
| 6 | `activity_logs.ts` | GET | `/api/activity-logs` | requirePermission("activity_log", "view") | withTenant(propertyId) -> Schema isolated |
| 7 | `activity_logs.ts` | GET | `/api/activity-logs/security` | requirePermission("activity_log", "view") | withTenant(propertyId) -> Schema isolated |
| 8 | `assignments.ts` | GET | `/api/assignments/in-house` | requirePermission("accommodation", "view") | withTenant(propertyId) -> Schema isolated |
| 9 | `assignments.ts` | GET | `/api/assignments/history` | requirePermission("accommodation", "view") | withTenant(propertyId) -> Schema isolated |
| 10 | `assignments.ts` | GET | `/api/assignments` | requirePermission("accommodation", "view") | withTenant(propertyId) -> Schema isolated |
| 11 | `assignments.ts` | POST | `/api/assignments` | requirePermission("accommodation", "create") | withTenant(propertyId) -> Schema isolated |
| 12 | `assignments.ts` | POST | `/api/assignments/:id/checkout` | requirePermission("accommodation", "edit") | withTenant(propertyId) -> Schema isolated |
| 13 | `assignments.ts` | POST | `/api/assignments/:id/transfer` | requirePermission("accommodation", "edit") | withTenant(propertyId) -> Schema isolated |
| 14 | `assignments.ts` | PATCH | `/api/assignments/:id` | requirePermission("accommodation", "edit") | withTenant(propertyId) -> Schema isolated |
| 15 | `assignments.ts` | DELETE | `/api/assignments/:id` | requirePermission("accommodation", "delete") | withTenant(propertyId) -> Schema isolated |
| 16 | `assignments.ts` | POST | `/api/assignments/bulk-delete` | requirePermission("accommodation", "delete") | withTenant(propertyId) -> Schema isolated |
| 17 | `auth.ts` | POST | `/api/auth/login` | None | Public / Global |
| 18 | `auth.ts` | GET | `/api/auth/ws-token` | None | Public / Global |
| 19 | `auth.ts` | POST | `/api/auth/logout` | None | Public / Global |
| 20 | `auth.ts` | GET | `/api/auth/me` | None | Public / Global |
| 21 | `auth.ts` | POST | `/api/auth/change-password` | None | Public / Global |
| 22 | `auth.ts` | POST | `/api/auth/switch-property` | None | Public / Global |
| 23 | `buildings.ts` | GET | `/api/buildings` | requireAnyPermission(housing.view, accommodation.view, housekeeping.view, reservations.view, maintenance.view, reports.view) | withTenant(propertyId) -> Schema isolated |
| 24 | `buildings.ts` | POST | `/api/buildings` | requirePermission("housing", "create") | withTenant(propertyId) -> Schema isolated |
| 25 | `buildings.ts` | PATCH | `/api/buildings/:id` | requirePermission("housing", "edit") | withTenant(propertyId) -> Schema isolated |
| 26 | `buildings.ts` | DELETE | `/api/buildings/:id` | requirePermission("housing", "delete") | withTenant(propertyId) -> Schema isolated |
| 27 | `dashboard.ts` | GET | `/api/dashboard/all-stats` | requirePermission("dashboard", "audit") | withTenant(propertyId) -> Schema isolated |
| 28 | `dashboard.ts` | GET | `/api/dashboard/stats` | requirePermission("dashboard", "view") | withTenant(propertyId) -> Schema isolated |
| 29 | `dashboard.ts` | GET | `/api/dashboard/pending` | requirePermission("dashboard", "view") | withTenant(propertyId) -> Schema isolated |
| 30 | `dashboard.ts` | GET | `/api/dashboard/recent-activity` | requirePermission("dashboard", "view") | withTenant(propertyId) -> Schema isolated |
| 31 | `dashboard.ts` | GET | `/api/dashboard/occupancy-by-building` | requirePermission("dashboard", "view") | withTenant(propertyId) -> Schema isolated |
| 32 | `documents.ts` | GET | `/api/documents` | requirePermission("documents", "view") | withTenant(propertyId) -> Schema isolated |
| 33 | `documents.ts` | POST | `/api/documents` | requirePermission("documents", "create") | withTenant(propertyId) -> Schema isolated |
| 34 | `documents.ts` | DELETE | `/api/documents/:id` | requirePermission("documents", "delete") | withTenant(propertyId) -> Schema isolated |
| 35 | `evaluations.ts` | GET | `/api/evaluations` | requirePermission("evaluations", "view") | withTenant(propertyId) -> Schema isolated |
| 36 | `evaluations.ts` | POST | `/api/evaluations` | requirePermission("evaluations", "create") | withTenant(propertyId) -> Schema isolated |
| 37 | `evaluations.ts` | PUT | `/api/evaluations/:id/items` | requirePermission("evaluations", "edit") | withTenant(propertyId) -> Schema isolated |
| 38 | `evaluations.ts` | GET | `/api/evaluations/stats` | requirePermission("reports", "view") | withTenant(propertyId) -> Schema isolated |
| 39 | `evaluations.ts` | GET | `/api/evaluations/:id/responses` | requirePermission("evaluations", "view") | withTenant(propertyId) -> Schema isolated |
| 40 | `evaluations.ts` | DELETE | `/api/evaluations/:id` | requirePermission("evaluations", "delete") | withTenant(propertyId) -> Schema isolated |
| 41 | `floors.ts` | GET | `/api/floors` | requireAnyPermission(housing.view, accommodation.view, housekeeping.view, reservations.view, maintenance.view, reports.view) | withTenant(propertyId) -> Schema isolated |
| 42 | `floors.ts` | POST | `/api/floors` | requirePermission("housing", "create") | withTenant(propertyId) -> Schema isolated |
| 43 | `floors.ts` | PATCH | `/api/floors/:id` | requirePermission("housing", "edit") | withTenant(propertyId) -> Schema isolated |
| 44 | `floors.ts` | DELETE | `/api/floors/:id` | requirePermission("housing", "delete") | withTenant(propertyId) -> Schema isolated |
| 45 | `health.ts` | GET | `/api/healthz` | None | Public / Global |
| 46 | `hosting-requests.ts` | POST | `/api/hosting-requests` | requirePermission("hosting_requests", "create") | Public / Global |
| 47 | `hosting-requests.ts` | GET | `/api/hosting-requests/history/:clockNumber` | requirePermission("hosting_requests", "view") | Public / Global |
| 48 | `hosting-requests.ts` | GET | `/api/hosting-requests` | requirePermission("hosting_requests", "view") | Public / Global |
| 49 | `hosting-requests.ts` | GET | `/api/hosting-requests/counts` | requirePermission("hosting_requests", "view") | Public / Global |
| 50 | `hosting-requests.ts` | GET | `/api/hosting-requests/pending-my-signature` | requirePermission("hosting_requests", "view") | Public / Global |
| 51 | `hosting-requests.ts` | POST | `/api/hosting-requests/:id/create-guest-hosting` | requirePermission("hosting_requests", "create") | Public / Global |
| 52 | `hosting-requests.ts` | GET | `/api/hosting-requests/:id` | requirePermission("hosting_requests", "view") | Public / Global |
| 53 | `hosting-requests.ts` | POST | `/api/hosting-requests/:id/sign` | requirePermission("hosting_requests", "approve") | Public / Global |
| 54 | `hosting-requests.ts` | POST | `/api/hosting-requests/:id/reject` | requirePermission("hosting_requests", "approve") | Public / Global |
| 55 | `hosting-requests.ts` | POST | `/api/hosting-requests/:id/reback` | requirePermission("hosting_requests", "edit") | Public / Global |
| 56 | `hosting-requests.ts` | PUT | `/api/hosting-requests/:id` | requirePermission("hosting_requests", "edit") | Public / Global |
| 57 | `hosting-requests.ts` | DELETE | `/api/hosting-requests/:id` | requirePermission("hosting_requests", "delete") | Public / Global |
| 58 | `hostings.ts` | GET | `/api/hostings` | requirePermission("guest_hosting", "view") | withTenant(propertyId) -> Schema isolated |
| 59 | `hostings.ts` | POST | `/api/hostings` | requirePermission("guest_hosting", "create") | withTenant(propertyId) -> Schema isolated |
| 60 | `hostings.ts` | GET | `/api/hostings/:id` | requirePermission("guest_hosting", "view") | withTenant(propertyId) -> Schema isolated |
| 61 | `hostings.ts` | PATCH | `/api/hostings/:id` | requirePermission("guest_hosting", "edit") | withTenant(propertyId) -> Schema isolated |
| 62 | `hostings.ts` | DELETE | `/api/hostings/:id` | requirePermission("guest_hosting", "delete") | withTenant(propertyId) -> Schema isolated |
| 63 | `hostings.ts` | POST | `/api/hostings/:id/approve` | requirePermission("guest_hosting", "approve") | withTenant(propertyId) -> Schema isolated |
| 64 | `hostings.ts` | POST | `/api/hostings/:id/checkin` | requirePermission("guest_hosting", "checkin") | withTenant(propertyId) -> Schema isolated |
| 65 | `hostings.ts` | POST | `/api/hostings/:id/checkout` | requirePermission("guest_hosting", "checkout") | withTenant(propertyId) -> Schema isolated |
| 66 | `hostings.ts` | GET | `/api/hostings/:id/companions` | requirePermission("guest_hosting", "view") | withTenant(propertyId) -> Schema isolated |
| 67 | `hostings.ts` | POST | `/api/hostings/:id/companions` | requirePermission("guest_hosting", "create") | withTenant(propertyId) -> Schema isolated |
| 68 | `hostings.ts` | DELETE | `/api/hostings/:id/companions/:companionId` | requirePermission("guest_hosting", "delete") | withTenant(propertyId) -> Schema isolated |
| 69 | `hotek-config.ts` | GET | `/api/hotek/config` | requirePermission("settings", "view") | Public / Global |
| 70 | `hotek-config.ts` | POST | `/api/hotek/servers` | requirePermission("settings", "edit") | Public / Global |
| 71 | `hotek-config.ts` | PATCH | `/api/hotek/servers/:id` | requirePermission("settings", "edit") | Public / Global |
| 72 | `hotek-config.ts` | POST | `/api/hotek/servers/:id/test` | requirePermission("settings", "view") | Public / Global |
| 73 | `hotek-config.ts` | DELETE | `/api/hotek/servers/:id` | requirePermission("settings", "edit") | Public / Global |
| 74 | `hr-sync.ts` | GET | `/api/hr-sync/config` | requirePermission("settings", "view") | Public / Global |
| 75 | `hr-sync.ts` | PUT | `/api/hr-sync/config` | requirePermission("settings", "edit") | Public / Global |
| 76 | `hr-sync.ts` | POST | `/api/hr-sync/receive` | x-api-key (HR_SYNC_API_KEY) | withTenant(propertyId) -> Schema isolated |
| 77 | `hr-sync.ts` | POST | `/api/hr-sync/sync` | requirePermission("settings", "edit") | Public / Global |
| 78 | `hr-sync.ts` | GET | `/api/hr-sync/logs` | requirePermission("settings", "view") | withTenant(propertyId) -> Schema isolated |
| 79 | `hr-sync.ts` | GET | `/api/hr-sync/profiles/:profileId` | x-api-key (HR_SYNC_API_KEY) | withTenant(propertyId) -> Schema isolated |
| 80 | `hr-sync.ts` | POST | `/api/hr-sync/notify-departure` | x-api-key (HR_SYNC_API_KEY) | withTenant(propertyId) -> Schema isolated |
| 81 | `jobs.ts` | POST | `/api/jobs/export` | router.use(requireAuth) | Public / Global |
| 82 | `jobs.ts` | GET | `/api/jobs/:id/status` | router.use(requireAuth) | Public / Global |
| 83 | `jobs.ts` | GET | `/api/jobs/:id/download` | router.use(requireAuth) | Public / Global |
| 84 | `lookup_values.ts` | GET | `/api/lookup-values` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 85 | `lookup_values.ts` | POST | `/api/lookup-values` | requirePermission("settings", "create") | withTenant(propertyId) -> Schema isolated |
| 86 | `lookup_values.ts` | PATCH | `/api/lookup-values/:id` | requirePermission("settings", "edit") | withTenant(propertyId) -> Schema isolated |
| 87 | `lookup_values.ts` | DELETE | `/api/lookup-values/:id` | requirePermission("settings", "delete") | withTenant(propertyId) -> Schema isolated |
| 88 | `maintenance.ts` | GET | `/api/maintenance` | requirePermission("maintenance", "view") | withTenant(propertyId) -> Schema isolated |
| 89 | `maintenance.ts` | GET | `/api/maintenance/:id` | requirePermission("maintenance", "view") | withTenant(propertyId) -> Schema isolated |
| 90 | `maintenance.ts` | POST | `/api/maintenance` | requirePermission("maintenance", "create") | withTenant(propertyId) -> Schema isolated |
| 91 | `maintenance.ts` | PATCH | `/api/maintenance/:id` | requirePermission("maintenance", "edit") | withTenant(propertyId) -> Schema isolated |
| 92 | `maintenance.ts` | DELETE | `/api/maintenance/:id` | requirePermission("maintenance", "delete") | withTenant(propertyId) -> Schema isolated |
| 93 | `maintenance.ts` | GET | `/api/maintenance/:id/sub-tickets` | requirePermission("maintenance", "view") | withTenant(propertyId) -> Schema isolated |
| 94 | `maintenance.ts` | POST | `/api/maintenance/:id/sub-tickets` | requirePermission("maintenance", "create") | withTenant(propertyId) -> Schema isolated |
| 95 | `notifications.ts` | GET | `/api/notifications` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 96 | `portal-analytics.ts` | GET | `/api/portal-analytics` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 97 | `portal-analytics.ts` | GET | `/api/portal-analytics/trends` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 98 | `portal-analytics.ts` | GET | `/api/portal-analytics/content-performance` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 99 | `portal-auth.ts` | GET | `/api/portal-auth/ping` | None | withTenant(propertyId) -> Schema isolated |
| 100 | `portal-auth.ts` | POST | `/api/portal-auth/login` | None | withTenant(propertyId) -> Schema isolated |
| 101 | `portal-auth.ts` | GET | `/api/portal-auth/profiles` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 102 | `portal-auth.ts` | GET | `/api/portal-auth/me` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 103 | `portal-auth.ts` | POST | `/api/portal-auth/change-password` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 104 | `portal-auth.ts` | POST | `/api/portal-auth/first-login-reset` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 105 | `portal-auth.ts` | POST | `/api/portal-auth/logout` | None | withTenant(propertyId) -> Schema isolated |
| 106 | `portal-auth.ts` | POST | `/api/portal-auth/reset-password` | requirePermission("profiles", "reset_password") | withTenant(propertyId) -> Schema isolated |
| 107 | `portal-auth.ts` | POST | `/api/portal-auth/set-password` | requirePermission("profiles", "reset_password") | withTenant(propertyId) -> Schema isolated |
| 108 | `portal-auth.ts` | GET | `/api/portal-auth/accounts` | requirePermission("profiles", "view") | withTenant(propertyId) -> Schema isolated |
| 109 | `portal-auth.ts` | POST | `/api/portal-auth/toggle-access` | requirePermission("profiles", "edit") | withTenant(propertyId) -> Schema isolated |
| 110 | `portal-auth.ts` | POST | `/api/portal-auth/forgot-password/verify` | None | withTenant(propertyId) -> Schema isolated |
| 111 | `portal-auth.ts` | POST | `/api/portal-auth/forgot-password/reset` | None | withTenant(propertyId) -> Schema isolated |
| 112 | `portal-categories.ts` | GET | `/api/portal-categories` | requireAuth | Public / Global |
| 113 | `portal-categories.ts` | GET | `/api/portal-categories/statuses` | requireAuth | Public / Global |
| 114 | `portal-categories.ts` | POST | `/api/portal-categories` | requireAuth | Public / Global |
| 115 | `portal-categories.ts` | GET | `/api/portal-categories/tags` | requireAuth | Public / Global |
| 116 | `portal-categories.ts` | POST | `/api/portal-categories/tags` | requireAuth | Public / Global |
| 117 | `portal-categories.ts` | GET | `/api/portal-categories/search` | requireAuth | Public / Global |
| 118 | `portal-chat.ts` | GET | `/api/portal-chat/conversations` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 119 | `portal-chat.ts` | POST | `/api/portal-chat/conversations` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 120 | `portal-chat.ts` | GET | `/api/portal-chat/conversations/:id/messages` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 121 | `portal-chat.ts` | POST | `/api/portal-chat/conversations/:id/messages` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 122 | `portal-chat.ts` | PUT | `/api/portal-chat/conversations/:id/read` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 123 | `portal-chat.ts` | POST | `/api/portal-chat/conversations/:id/typing` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 124 | `portal-chat.ts` | GET | `/api/portal-chat/admin/conversations` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 125 | `portal-chat.ts` | GET | `/api/portal-chat/admin/conversations/:id/messages` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 126 | `portal-chat.ts` | POST | `/api/portal-chat/admin/conversations/:id/messages` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 127 | `portal-chat.ts` | DELETE | `/api/portal-chat/admin/messages/:id` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 128 | `portal-chat.ts` | GET | `/api/portal-chat/admin/stats` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 129 | `portal-contacts.ts` | GET | `/api/portal-contacts` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 130 | `portal-contacts.ts` | POST | `/api/portal-contacts` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 131 | `portal-contacts.ts` | PUT | `/api/portal-contacts/:id` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 132 | `portal-contacts.ts` | DELETE | `/api/portal-contacts/:id` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 133 | `portal-data.ts` | GET | `/api/portal-data/profile` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 134 | `portal-data.ts` | GET | `/api/portal-data/room` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 135 | `portal-data.ts` | GET | `/api/portal-data/notifications` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 136 | `portal-data.ts` | GET | `/api/portal-data/alerts` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 137 | `portal-data.ts` | GET | `/api/portal-data/my-profile` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 138 | `portal-data.ts` | PATCH | `/api/portal-data/my-profile` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 139 | `portal-data.ts` | GET | `/api/portal-data/my-room` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 140 | `portal-data.ts` | GET | `/api/portal-data/roommates` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 141 | `portal-data.ts` | GET | `/api/portal-data/my-maintenance` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 142 | `portal-data.ts` | POST | `/api/portal-data/my-maintenance` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 143 | `portal-data.ts` | GET | `/api/portal-data/my-contacts` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 144 | `portal-data.ts` | GET | `/api/portal-data/contacts` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 145 | `portal-data.ts` | GET | `/api/portal-data/documents` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 146 | `portal-data.ts` | GET | `/api/portal-data/catalog` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 147 | `portal-data.ts` | GET | `/api/portal-data/my-activities` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 148 | `portal-data.ts` | GET | `/api/portal-data/my-evaluations` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 149 | `portal-data.ts` | POST | `/api/portal-data/my-evaluations/:id/respond` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 150 | `portal-data.ts` | POST | `/api/portal-data/activity-registration` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 151 | `portal-data.ts` | DELETE | `/api/portal-data/activity-registration` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 152 | `portal-data.ts` | POST | `/api/portal-data/activity-attendance` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 153 | `portal-feedback.ts` | GET | `/api/portal-feedback/:contentType/:contentId` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 154 | `portal-feedback.ts` | POST | `/api/portal-feedback/feedback` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 155 | `portal-feedback.ts` | POST | `/api/portal-feedback/comments` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 156 | `portal-feedback.ts` | DELETE | `/api/portal-feedback/comments/:id` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 157 | `portal-feedback.ts` | POST | `/api/portal-feedback/comments/:id/like` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 158 | `portal-feedback.ts` | GET | `/api/portal-feedback/stats` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 159 | `portal-food-transport.ts` | GET | `/api/portal-food/menu` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 160 | `portal-food-transport.ts` | GET | `/api/portal-food/my-orders` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 161 | `portal-food-transport.ts` | POST | `/api/portal-food/order` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 162 | `portal-food-transport.ts` | PUT | `/api/portal-food/order/:id/cancel` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 163 | `portal-food-transport.ts` | GET | `/api/portal-food/schedules` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 164 | `portal-food-transport.ts` | GET | `/api/portal-food/my-bookings` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 165 | `portal-food-transport.ts` | POST | `/api/portal-food/book` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 166 | `portal-food-transport.ts` | PUT | `/api/portal-food/booking/:id/cancel` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 167 | `portal-food-transport.ts` | GET | `/api/portal-food/admin/menu` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 168 | `portal-food-transport.ts` | POST | `/api/portal-food/admin/menu` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 169 | `portal-food-transport.ts` | DELETE | `/api/portal-food/admin/menu/:id` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 170 | `portal-food-transport.ts` | PUT | `/api/portal-food/admin/menu/:id` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 171 | `portal-food-transport.ts` | GET | `/api/portal-food/admin/schedules` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 172 | `portal-food-transport.ts` | POST | `/api/portal-food/admin/schedules` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 173 | `portal-food-transport.ts` | DELETE | `/api/portal-food/admin/schedules/:id` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 174 | `portal-food-transport.ts` | PUT | `/api/portal-food/admin/schedules/:id` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 175 | `portal-food-transport.ts` | GET | `/api/portal-food/admin/stats` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 176 | `portal-notifications.ts` | GET | `/api/portal-notifications/my` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 177 | `portal-notifications.ts` | PUT | `/api/portal-notifications/read/:id` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 178 | `portal-notifications.ts` | PUT | `/api/portal-notifications/read-all` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 179 | `portal-notifications.ts` | GET | `/api/portal-notifications` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 180 | `portal-notifications.ts` | POST | `/api/portal-notifications` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 181 | `portal-notifications.ts` | DELETE | `/api/portal-notifications/:id` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 182 | `portal-notifications.ts` | GET | `/api/portal-notifications/stats` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 183 | `portal-reports.ts` | GET | `/api/portal-reports` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 184 | `portal-reports.ts` | POST | `/api/portal-reports/generate` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 185 | `portal-reports.ts` | GET | `/api/portal-reports/evaluations-report` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 186 | `portal-reports.ts` | GET | `/api/portal-reports/activities-report` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 187 | `portal-reports.ts` | GET | `/api/portal-reports/engagement-report` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 188 | `portal-reports.ts` | GET | `/api/portal-reports/custom-report` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 189 | `portal-reports.ts` | GET | `/api/portal-reports/templates/list` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 190 | `portal-reports.ts` | GET | `/api/portal-reports/departments` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 191 | `portal-schedule.ts` | GET | `/api/portal-schedule` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 192 | `portal-schedule.ts` | GET | `/api/portal-schedule/calendar` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 193 | `portal-schedule.ts` | GET | `/api/portal-schedule/priorities` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 194 | `portal-schedule.ts` | GET | `/api/portal-schedule/reminders` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 195 | `portal-schedule.ts` | POST | `/api/portal-schedule/calendar/events` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 196 | `portal-schedule.ts` | POST | `/api/portal-schedule/reminders/:id/snooze` | requireAuth | Public / Global |
| 197 | `profiles.ts` | GET | `/api/profiles` | requirePermission("profiles", "view") | withTenant(propertyId) -> Schema isolated |
| 198 | `profiles.ts` | GET | `/api/profiles/search` | requirePermission("profiles", "view") | withTenant(propertyId) -> Schema isolated |
| 199 | `profiles.ts` | GET | `/api/profiles/check-duplicate` | requirePermission("profiles", "view") | withTenant(propertyId) -> Schema isolated |
| 200 | `profiles.ts` | GET | `/api/profiles/existing-identifiers` | requirePermission("profiles", "view") | withTenant(propertyId) -> Schema isolated |
| 201 | `profiles.ts` | POST | `/api/profiles` | requirePermission("profiles", "create") | withTenant(propertyId) -> Schema isolated |
| 202 | `profiles.ts` | POST | `/api/profiles/bulk` | requirePermission("profiles", "create") | withTenant(propertyId) -> Schema isolated |
| 203 | `profiles.ts` | GET | `/api/profiles/:id` | requirePermission("profiles", "view") | withTenant(propertyId) -> Schema isolated |
| 204 | `profiles.ts` | PATCH | `/api/profiles/:id` | requirePermission("profiles", "edit") | withTenant(propertyId) -> Schema isolated |
| 205 | `profiles.ts` | DELETE | `/api/profiles/:id` | requirePermission("profiles", "delete") | withTenant(propertyId) -> Schema isolated |
| 206 | `profiles.ts` | PATCH | `/api/profiles/:id/photo` | requirePermission("profiles", "edit") | withTenant(propertyId) -> Schema isolated |
| 207 | `profiles.ts` | PATCH | `/api/profiles/:id/id-image` | requirePermission("profiles", "edit") | withTenant(propertyId) -> Schema isolated |
| 208 | `profiles.ts` | GET | `/api/profiles/:id/photo` | requirePermission("profiles", "view") | withTenant(propertyId) -> Schema isolated |
| 209 | `profiles.ts` | POST | `/api/profiles/:id/vacation` | requirePermission("profiles", "edit") | withTenant(propertyId) -> Schema isolated |
| 210 | `profiles.ts` | POST | `/api/profiles/:id/return-vacation` | requirePermission("profiles", "edit") | withTenant(propertyId) -> Schema isolated |
| 211 | `properties.ts` | GET | `/api/properties` | requireAuth | public.properties (Filtered by authUser.propertyIds) |
| 212 | `properties.ts` | POST | `/api/properties` | requirePermission("properties", "create") | public.properties (Filtered by authUser.propertyIds) |
| 213 | `properties.ts` | GET | `/api/properties/:id` | requireAuth | public.properties (Filtered by authUser.propertyIds) |
| 214 | `properties.ts` | PATCH | `/api/properties/:id` | requirePermission("properties", "edit") | public.properties (Filtered by authUser.propertyIds) |
| 215 | `properties.ts` | DELETE | `/api/properties/:id` | requirePermission("properties", "delete") | public.properties (Filtered by authUser.propertyIds) |
| 216 | `push-notifications.ts` | GET | `/api/push/vapid-key` | None | withTenant(propertyId) -> Schema isolated |
| 217 | `push-notifications.ts` | POST | `/api/push/subscribe` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 218 | `push-notifications.ts` | POST | `/api/push/unsubscribe` | requirePortalAuth | withTenant(propertyId) -> Schema isolated |
| 219 | `reports.ts` | GET | `/api/reports` | requirePermission("reports", "view") | withTenant(propertyId) -> Schema isolated |
| 220 | `reservations.ts` | GET | `/api/reservations` | requirePermission("reservations", "view") | withTenant(propertyId) -> Schema isolated |
| 221 | `reservations.ts` | POST | `/api/reservations` | requirePermission("reservations", "create") | withTenant(propertyId) -> Schema isolated |
| 222 | `reservations.ts` | GET | `/api/reservations/:id` | requirePermission("reservations", "view") | withTenant(propertyId) -> Schema isolated |
| 223 | `reservations.ts` | PATCH | `/api/reservations/:id` | requirePermission("reservations", "edit") | withTenant(propertyId) -> Schema isolated |
| 224 | `reservations.ts` | DELETE | `/api/reservations/:id` | requirePermission("reservations", "delete") | withTenant(propertyId) -> Schema isolated |
| 225 | `reservations.ts` | POST | `/api/reservations/:id/checkin` | requirePermission("reservations", "edit") | withTenant(propertyId) -> Schema isolated |
| 226 | `reservations.ts` | PATCH | `/api/reservations/:id/checkout` | requirePermission("reservations", "edit") | withTenant(propertyId) -> Schema isolated |
| 227 | `reservations.ts` | PATCH | `/api/reservations/:id/cancel` | requirePermission("reservations", "edit") | Public / Global |
| 228 | `reservations.ts` | POST | `/api/reservations/:id/cancel` | requirePermission("reservations", "edit") | Public / Global |
| 229 | `room-import.ts` | POST | `/api/rooms/import/execute` | requirePermission("housing", "create") | withTenant(propertyId) -> Schema isolated |
| 230 | `room-import.ts` | GET | `/api/rooms/import/history` | requirePermission("housing", "view") | withTenant(propertyId) -> Schema isolated |
| 231 | `room-import.ts` | GET | `/api/rooms/import/templates` | requirePermission("housing", "view") | withTenant(propertyId) -> Schema isolated |
| 232 | `room-import.ts` | POST | `/api/rooms/import/templates` | requirePermission("housing", "create") | withTenant(propertyId) -> Schema isolated |
| 233 | `rooms.ts` | GET | `/api/rooms/:id/bed-status` | requireAnyPermission(housing.view, accommodation.view, housekeeping.view, reservations.view, maintenance.view, reports.view) | withTenant(propertyId) -> Schema isolated |
| 234 | `rooms.ts` | GET | `/api/rooms/by-number` | requireAnyPermission(housing.view, accommodation.view, housekeeping.view, reservations.view, maintenance.view, reports.view) | withTenant(propertyId) -> Schema isolated |
| 235 | `rooms.ts` | GET | `/api/rooms` | requireAnyPermission(housing.view, accommodation.view, housekeeping.view, reservations.view, maintenance.view, reports.view) | withTenant(propertyId) -> Schema isolated |
| 236 | `rooms.ts` | GET | `/api/rooms/:id/history` | requirePermission("housing", "view") | withTenant(propertyId) -> Schema isolated |
| 237 | `rooms.ts` | POST | `/api/rooms` | requirePermission("housing", "create") | withTenant(propertyId) -> Schema isolated |
| 238 | `rooms.ts` | GET | `/api/rooms/:id` | requireAnyPermission(housing.view, accommodation.view, housekeeping.view, reservations.view, maintenance.view, reports.view) | withTenant(propertyId) -> Schema isolated |
| 239 | `rooms.ts` | PATCH | `/api/rooms/:id` | requireAnyPermission(housing.edit, housekeeping.edit) | withTenant(propertyId) -> Schema isolated |
| 240 | `rooms.ts` | PATCH | `/api/rooms/:id/features` | requirePermission("housing", "edit") | withTenant(propertyId) -> Schema isolated |
| 241 | `rooms.ts` | PATCH | `/api/rooms/:id/status` | inline: accommodation.edit OR housing.edit OR housekeeping.edit | withTenant(propertyId) -> Schema isolated |
| 242 | `rooms.ts` | POST | `/api/rooms/bulk-delete` | requirePermission("housing", "delete") | withTenant(propertyId) -> Schema isolated |
| 243 | `rooms.ts` | DELETE | `/api/rooms/:id` | requirePermission("housing", "delete") | withTenant(propertyId) -> Schema isolated |
| 244 | `settings.ts` | GET | `/api/settings` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 245 | `settings.ts` | PATCH | `/api/settings` | requirePermission("settings", "edit") | withTenant(propertyId) -> Schema isolated |
| 246 | `settings.ts` | GET | `/api/settings/portal-contacts` | requireAuth | withTenant(propertyId) -> Schema isolated |
| 247 | `smart-lock.ts` | GET | `/api/encoder/status` | requirePermission("smart_locks", "view") | Public / Global |
| 248 | `smart-lock.ts` | POST | `/api/encoder/connect` | requirePermission("smart_locks", "edit") | Public / Global |
| 249 | `smart-lock.ts` | POST | `/api/encoder/disconnect` | requirePermission("smart_locks", "edit") | Public / Global |
| 250 | `smart-lock.ts` | POST | `/api/encoder/read-card` | requirePermission("smart_locks", "view") | Public / Global |
| 251 | `smart-lock.ts` | POST | `/api/encoder/eject` | requirePermission("smart_locks", "edit") | Public / Global |
| 252 | `smart-lock.ts` | POST | `/api/encoder/encode` | requirePermission("smart_locks", "create") | Public / Global |
| 253 | `smart-lock.ts` | POST | `/api/encoder/smart/checkin-issue-key` | requirePermission("smart_locks", "create") | withTenant(propertyId) -> Schema isolated |
| 254 | `smart-lock.ts` | GET | `/api/io` | None | withTenant(propertyId) -> Schema isolated |
| 255 | `smart-lock.ts` | GET | `/api/locks` | requirePermission("smart_locks", "view") | withTenant(propertyId) -> Schema isolated |
| 256 | `smart-lock.ts` | POST | `/api/locks` | requirePermission("smart_locks", "create") | withTenant(propertyId) -> Schema isolated |
| 257 | `smart-lock.ts` | PATCH | `/api/locks/:id` | requirePermission("smart_locks", "edit") | withTenant(propertyId) -> Schema isolated |
| 258 | `smart-lock.ts` | GET | `/api/keys` | requirePermission("smart_locks", "view") | withTenant(propertyId) -> Schema isolated |
| 259 | `smart-lock.ts` | POST | `/api/keys/issue` | requirePermission("smart_locks", "create") | withTenant(propertyId) -> Schema isolated |
| 260 | `smart-lock.ts` | GET | `/api/io` | requirePermission("smart_locks", "edit") | withTenant(propertyId) -> Schema isolated |
| 261 | `smart-lock.ts` | POST | `/api/keys/:id/revoke` | requirePermission("smart_locks", "edit") | withTenant(propertyId) -> Schema isolated |
| 262 | `smart-lock.ts` | GET | `/api/io` | requirePermission("smart_locks", "edit") | withTenant(propertyId) -> Schema isolated |
| 263 | `smart-lock.ts` | POST | `/api/keys/:id/extend` | requirePermission("smart_locks", "edit") | withTenant(propertyId) -> Schema isolated |
| 264 | `smart-lock.ts` | GET | `/api/keys/audit` | requirePermission("smart_locks", "view") | withTenant(propertyId) -> Schema isolated |
| 265 | `user-signature.ts` | GET | `/api/users/me/signature` | router.use session check + self / isSystemAdmin | Public / Global |
| 266 | `user-signature.ts` | POST | `/api/users/me/signature` | router.use session check + self / isSystemAdmin | Public / Global |
| 267 | `user-signature.ts` | GET | `/api/users/:id/signature` | router.use session check + self / isSystemAdmin | Public / Global |
| 268 | `user-signature.ts` | POST | `/api/users/:id/signature` | router.use session check + self / isSystemAdmin | Public / Global |
| 269 | `users.ts` | GET | `/api/users` | requirePermission("users", "view") | public.users (Filtered by sessionPropertyId / propertyIds) |
| 270 | `users.ts` | GET | `/api/users/:id` | requirePermission("users", "view") | public.users (Filtered by sessionPropertyId / propertyIds) |
| 271 | `users.ts` | POST | `/api/users` | requirePermission("users", "create") | public.users (Filtered by sessionPropertyId / propertyIds) |
| 272 | `users.ts` | PATCH | `/api/users/:id` | requireUserUpdatePermission (dynamic: users.manage_permissions / reset_password / edit) | public.users (Filtered by sessionPropertyId / propertyIds) |
| 273 | `users.ts` | POST | `/api/users/:id/unlock` | requirePermission("users", "unlock") | public.users (Filtered by sessionPropertyId / propertyIds) |
| 274 | `users.ts` | DELETE | `/api/users/:id` | requirePermission("users", "delete") | public.users (Filtered by sessionPropertyId / propertyIds) |
| 275 | `users.ts` | PATCH | `/api/users/me/last-property` | requireAuth | public.users (Filtered by sessionPropertyId / propertyIds) |

---

## 7. Automated Test Assertion Suite Recommendations

To achieve 100% verification of the Dual-Layer RBAC and Multi-Tenant Isolation as mandated by ORIGINAL_REQUEST.md (#2026-09-08T13:32:04Z), automated tests must assert the following matrix:

1. **Dual-Layer RBAC Positive & Negative Tests:**
   - **Role Default Assertions:** For each baseline role, authenticate as a user with that role and verify access to permitted routes returns HTTP 200/201, while restricted routes return HTTP 403.
   - **Zero-Permission Assertion (`["none"]`):** Create a user with role `manager`, assign permissions `["none"]`. Assert that calling `GET /api/assignments/in-house` returns HTTP 403 Forbidden, proving role defaults are suppressed.
   - **Dynamic Role Inheritance Assertion (`[]`):** Set user permissions to `[]`. Assert that role defaults are dynamically restored and succeed with HTTP 200.
   - **Frontend Button Visibility:** For each PermissionGate test account, load the DOM and assert that non-permitted action buttons do not exist in the DOM tree.

2. **Multi-Tenant Property Boundary Tests:**
   - **Parameter Tampering Boundary:** As a user assigned only to Property 1 (`taal_housing`), issue `GET /api/assignments/in-house?propertyId=2`. Assert HTTP 403 Forbidden with exact body `{ "error": "Access denied to this property" }`.
   - **Body Injection Boundary:** Issue `POST /api/maintenance` with JSON body `{ "propertyId": 2, "title": "Leak" }`. Assert HTTP 403 Forbidden.
   - **Cross-Tenant ID Probing:** Issue `GET /api/profiles/{id_from_property_2}?propertyId=1`. Assert HTTP 404 Not Found.
   - **Properties API Restriction:** As `admin` (not `super_admin`), issue `POST /api/properties`. Assert HTTP 403 Forbidden (`Permission denied: properties.create`).

3. **Portal vs Admin Session Segregation:**
   - As an authenticated Portal resident, issue `GET /api/users`. Assert HTTP 401 Unauthorized.
   - As an authenticated Housing Admin, issue `GET /api/portal-data/my-profile` without a portal session. Assert HTTP 401 Unauthorized.
