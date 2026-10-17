const fs = require('fs');
const path = require('path');

const routes = JSON.parse(fs.readFileSync(path.join(__dirname, 'all_routes_mapped.json'), 'utf8'));
const gates = JSON.parse(fs.readFileSync(path.join(__dirname, 'permission_gate_scan.json'), 'utf8'));

let md = `# Dual-Layer Role-Based Access Control (RBAC) & Multi-Tenant Specification Matrix
**Application:** Sunrise Staff Housing Management System  
**Document Type:** Authoritative Specification & Verification Matrix  
**Generated Date:** 2026-09-08  
**Scope:** Frontend (\`artifacts/housing\`), Backend API (\`artifacts/api-server\`), Database Schemas (\`lib/db\`)

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Dual-Layer RBAC (Frontend) | UI Component Gate (\`<PermissionGate>\`) | Conditionally renders interactive UI controls (buttons, menus, switches, tabs) only when the active user possesses the required \`module.action\` permission. | \`module: Module\`, \`action: Action\`, \`fallback?: ReactNode\`, \`children: ReactNode\` | Renders \`children\` if permitted; renders \`fallback\` (or \`null\`) if denied. | Silent suppression / fallback rendering (DOM omission). | \`artifacts/housing/src/components/ui/permission-gate.tsx\` |
| 2 | Dual-Layer RBAC (Frontend) | Route & Page Level Gate (\`ProtectedRoute\`) | Guards client-side routes in \`App.tsx\`. Unauthenticated users are redirected to \`/login\`; unauthorized users see a full-page bilingual 403 boundary. | Route navigation URL, \`module: Module\`, \`action?: Action\` | Renders page component if permitted. | Renders bilingual Access Denied (403) page with "Go to Home" button. | \`artifacts/housing/src/App.tsx:105-162\` |
| 3 | Dual-Layer RBAC (Frontend) | Dynamic Root Redirection | Evaluates user permissions on root path (\`/\`) and redirects to the first accessible module in priority order. | User effective permissions | Redirect to first permitted path (\`/dashboard\`, \`/housing\`, \`/profiles\`, etc.). | Redirects to \`/login\` if unauthenticated. | \`artifacts/housing/src/App.tsx:164-185\` |
| 4 | Dual-Layer RBAC (Frontend) | Sidebar Navigation Filtering | Filters navigation items in the main sidebar so that users only see links to modules they have \`view\` permission for. | User effective permissions | Filtered list of visible sidebar links (\`visibleNavItems\`). | Non-permitted module links omitted from sidebar DOM. | \`artifacts/housing/src/components/layout/AppLayout.tsx:383-387\` |
| 5 | Dual-Layer RBAC (Backend) | Global Session Guard | Intercepts all administrative Express routes mounted after line 80 in \`routes/index.ts\` and enforces active user session. | \`req.session.userId\` | Calls \`next()\` if session exists. | Returns HTTP 401 \`{ success: false, message: "Unauthorized" }\`. | \`artifacts/api-server/src/routes/index.ts:72-80\` |
| 6 | Dual-Layer RBAC (Backend) | Exact Route Permission Guard (\`requirePermission\`) | Protects Express route handlers by verifying that the authenticated user possesses the specific \`module.action\` permission. | \`module: PermissionModule\`, \`action: PermissionAction\`, user session | Calls \`next()\` if permission granted. | Returns HTTP 403 \`{ error: "Permission denied: module.action" }\`. | \`artifacts/api-server/src/middlewares/permissions.ts:473-494\` |
| 7 | Dual-Layer RBAC (Backend) | Disjunctive Permission Guard (\`requireAnyPermission\`) | Allows access if the user has ANY of the specified \`[module, action]\` permission pairs. | Array of \`[PermissionModule, PermissionAction]\` | Calls \`next()\` if at least one check passes. | Returns HTTP 403 \`{ error: "Permission denied. Requires one of: ..." }\`. | \`artifacts/api-server/src/middlewares/permissions.ts:496-522\` |
| 8 | Dual-Layer RBAC (Backend) | Dynamic Payload Mutation Guard | Inspects payload fields on user update and dynamically requires \`users.manage_permissions\`, \`users.reset_password\`, or \`users.edit\`. | \`req.body\` keys (\`permissions\`, \`roles\`, \`password\`) | Executes appropriate permission middleware chain. | Returns HTTP 403 on first failing guard. | \`artifacts/api-server/src/routes/users.ts:43-66\` |
| 9 | Dual-Layer RBAC (Backend) | Inline Multi-Action Guard | Verifies user has at least one of \`accommodation:edit\`, \`housing:edit\`, or \`housekeeping:edit\` for room status mutations. | User session, room ID, new status | Passes to handler if any of the 3 permissions exist. | Returns HTTP 403 \`{ error: "Permission denied. Requires accommodation:edit, housing:edit, or housekeeping:edit" }\`. | \`artifacts/api-server/src/routes/rooms.ts:827-847\` |
| 10 | Baseline Roles & RBAC | Role Inheritance Engine | Resolves inherited roles (e.g. \`manager\` automatically inherits all \`receptionist\` permissions) via recursive traversal. | \`user.roles: string[]\` | Set of effective role names and all inherited permissions. | Defaults to empty set for unknown roles. | \`artifacts/api-server/src/middlewares/permissions.ts:85-106\` |
| 11 | Baseline Roles & RBAC | Baseline Technical Roles | 9 baseline technical roles configured with granular permission mappings. | Role key string | Pre-configured permission set per role. | Unrecognized role yields no default permissions. | \`artifacts/api-server/src/middlewares/permissions.ts:108-258\` |
| 12 | Custom Overrides | Strict Override Mode | When \`user.permissions\` array is non-empty, role defaults are completely suppressed; only explicit permissions apply. | \`user.permissions: string[]\` | Set of explicitly granted permissions. | Role defaults excluded. | \`artifacts/api-server/src/middlewares/permissions.ts:303-330\` |
| 13 | Custom Overrides | Zero-Permission Override Safeguard | Saving \`["none"]\` allows explicit revocation of all permissions while preventing fallback to role defaults. | \`permissions = ["none"]\` | Effective permission set size = 0. | All protected actions return HTTP 403. | \`artifacts/housing/src/pages/users/components/PermissionMatrixCenter.tsx:481-483\` |
| 14 | Custom Overrides | Dynamic Role Inheritance Mode | Saving an empty array \`[]\` restores dynamic inheritance, causing the user to inherit baseline role permissions automatically. | \`permissions = []\` | \`permissions.length === 0\` triggers role defaults fallback. | None; returns role defaults. | \`artifacts/housing/src/pages/users/components/PermissionMatrixCenter.tsx:479-480\` |
| 15 | Security Hardening | Super Admin Self-Lockout Immunity | Guarantees \`super_admin\` and \`system_admin\` always retain \`users.view\` and \`users.manage_permissions\` regardless of custom overrides. | User role = \`super_admin\` / \`system_admin\` | Injects \`users.view\` and \`users.manage_permissions\` into effective permissions. | Impossible to lock admin out of user permissions. | \`artifacts/api-server/src/middlewares/permissions.ts:318-327\` |
| 16 | Multi-Tenant Isolation | Schema-Isolated Transaction Runner (\`withTenant\`) | Executes database queries within tenant schema using transaction-scoped \`SET LOCAL search_path\`. | \`propertyId: number\`, callback | Executes callback with \`tenantDb\` scoped to property schema. | Throws Error if \`propertyId\` invalid or schema missing. | \`lib/db/src/index.ts:154-190\` |
| 17 | Multi-Tenant Isolation | Single-Property User Restriction | Strictly restricts single-property users to their assigned property; rejects any request referencing another property. | \`req.query.propertyId\`, \`req.body.propertyId\` | Permits query if property in \`authUser.propertyIds\`. | Returns HTTP 403 \`{ error: "Access denied to this property" }\`. | \`artifacts/api-server/src/middlewares/permissions.ts:433-437\` |
| 18 | Multi-Tenant Isolation | Multi-Property Switching | Allows users with multiple \`propertyIds\` to switch active property and persists selection. | \`PATCH /api/users/me/last-property\`, body \`{ propertyId }\` | Updates \`usersTable.lastPropertyId\`. | Returns HTTP 400 if ID not number; HTTP 401 if unauthenticated. | \`artifacts/api-server/src/routes/users.ts:709-731\` |
| 19 | Multi-Tenant Isolation | Automated Tenant Schema Provisioner | Automatically provisions new PostgreSQL schema and clones 28 operational tables with sequence resets upon property creation. | \`POST /api/properties\`, body: property metadata | Creates schema \`"{schemaName}"\`, creates 28 tables, resets sequences. | Returns HTTP 400 on validation error, 500 on SQL failure (with rollback). | \`artifacts/api-server/src/routes/properties.ts:51-243\` |
| 20 | Authentication Boundary | Machine-to-Machine Webhook Authentication | Secures HR sync webhooks using cryptographic \`x-api-key\` header verification against \`HR_SYNC_API_KEY\`. | \`req.headers["x-api-key"]\` | Authorizes profile synchronization batch. | Returns HTTP 401 if key invalid; HTTP 403 in production if key not set. | \`artifacts/api-server/src/routes/hr-sync.ts:157-168\` |
| 21 | Authentication Boundary | Employee Portal Session Segregation | Isolates resident portal accounts (\`req.session.portal\`) from administrative staff accounts (\`req.session.userId\`). | Session cookie, \`requirePortalAuth\` | Permits access to self-service endpoints (\`/api/portal-data/*\`). | Returns HTTP 401 if portal session missing; denies admin accounts without portal credentials. | \`artifacts/api-server/src/routes/portal-auth.ts\` |
| 22 | Security Hardening | User Signature Access Protection | Restricts viewing and uploading signatures for other users strictly to system administrators. | \`GET / POST /api/users/:id/signature\` | Retrieves or saves PNG/JPEG data URL signature. | Returns HTTP 403 \`{ error: "Only system admins can..." }\` for non-admin callers. | \`artifacts/api-server/src/routes/user-signature.ts:124-173\` |
| 23 | Hardware Integration | Hotek PMS Smart Lock Socket Bridge | Bridges Express API with Hotek PMS TCP socket listener on port 10006 for RFID key card issuance and audit logging. | Room ID, guest ID, validity dates | Dispatches TCP packet to encoder; logs operation to \`key_audit_log\`. | Returns HTTP 503 if Hotek PMSServer is not connected. | \`artifacts/api-server/src/routes/smart-lock.ts\` & \`lib/pms-server.ts\` |
| 24 | Background Processing | Asynchronous Export Queue | Enqueues heavy report exports (Excel, PDF, CSV) to Redis BullMQ with tenant tagging and delivers via download endpoint. | \`POST /api/jobs/export\`, body: format, reportType | Returns HTTP 202 \`{ jobId }\`; serves artifact via \`/api/jobs/:id/download\`. | Returns HTTP 503 if Redis down; HTTP 404/410 if job expired. | \`artifacts/api-server/src/routes/jobs.ts\` |

---

## Edge Cases

| # | Feature | Input / Condition | Observed Behavior |
|---|---------|-------------------|-------------------|
| 1 | Single-Property User Isolation | Single-property user (assigned to Property 1) issues \`GET /api/assignments/in-house?propertyId=2\` | Request is intercepted by \`loadAuthUser\`. \`requestedPropertyId(req)\` extracts 2. Since 2 is not in \`authUser.propertyIds\`, the server immediately responds with HTTP 403 Forbidden \`{ "error": "Access denied to this property" }\`. No database query is executed. |
| 2 | Body Parameter Property Tampering | Single-property user posts \`POST /api/maintenance\` with JSON body \`{ "propertyId": 2, "title": "AC Broken" }\` | \`loadAuthUser\` extracts \`req.body.propertyId\` (2). Evaluates \`!propertyIds.includes(2)\` and immediately aborts with HTTP 403 Forbidden \`{ "error": "Access denied to this property" }\`. |
| 3 | Omission of Property Parameter | User submits request without \`?propertyId\` or body \`propertyId\` | \`getTenantId(req)\` falls back to \`req.session.propertyId\`. During \`loadAuthUser\`, \`req.session.propertyId\` is verified and clamped to \`propertyIds[0]\`. Query executes safely in assigned property schema. If user has no assigned property, \`getTenantId\` returns 0, and route returns HTTP 400 \`{ "error": "propertyId is required" }\`. |
| 4 | Super Admin vs Admin on \`properties\` | User with role \`admin\` attempts \`POST /api/properties\` | Evaluates \`requirePermission("properties", "create")\`. The baseline \`admin\` role explicitly excludes \`properties\` module. Request is rejected with HTTP 403 Forbidden \`{ "error": "Permission denied: properties.create" }\`. Only \`super_admin\` can manage properties. |
| 5 | Cross-Tenant Entity ID Query | User authenticated to Property 1 attempts \`GET /api/profiles/:id\` using an ID that exists only in Property 2 | Handler invokes \`withTenant(1)\`, setting \`search_path TO taal_housing, public\`. The SQL query searches \`taal_housing.profiles\`. Because the record resides in \`el_waha_new.profiles\`, 0 rows match. Server returns HTTP 404 Not Found \`{ "error": "Profile not found" }\`. |
| 6 | Zero-Permission Override (\`["none"]\`) | User with role \`manager\` has explicit permissions set to \`["none"]\` | In \`effectivePermissions()\`, \`user.permissions.length > 0\` activates Strict Mode. \`"none"\` is ignored during iteration. The resulting permission set is empty (\`Set(0)\`). When calling \`GET /api/assignments/in-house\`, \`hasPermission\` returns false. Server returns HTTP 403 Forbidden. Role defaults are completely suppressed. |
| 7 | Dynamic Inheritance Override (\`[]\`) | User with role \`manager\` has permissions updated to empty array \`[]\` | In \`effectivePermissions()\`, \`user.permissions.length > 0\` is false. The engine falls back to \`resolveInheritedRoles(user.roles)\`, populating all baseline manager permissions. Calling \`GET /api/assignments/in-house\` succeeds with HTTP 200. |
| 8 | Super Admin Lockout Attempt | Admin user sets \`super_admin\` user's permissions to \`["none"]\` | In \`effectivePermissions()\`, despite Strict Mode and empty set, lines 318-327 explicitly inject \`users.view\` and \`users.manage_permissions\`. The super admin can still view the users list and open the Permission Matrix Center to fix permissions. |
| 9 | Inactive Account Session | Account status is updated to \`status = 'inactive'\` in database while user has an active session | On the user's next request, \`loadAuthUser\` queries \`usersTable\`. It detects \`status === 'inactive'\`, destroys the session via \`req.session.destroy()\`, and returns HTTP 403 Forbidden \`{ "error": "Account disabled" }\`. |
| 10 | Portal User Calling Admin Route | Resident with active portal session submits request to \`GET /api/users\` | Express reaches line 78 of \`routes/index.ts\`. It checks \`req.session?.userId\`. Portal users only have \`req.session.portal\`, so \`userId\` is undefined. Express immediately responds with HTTP 401 Unauthorized \`{ "success": false, "message": "Unauthorized" }\`. |
| 11 | Admin Calling Portal Endpoint | Housing staff member with admin session calls \`GET /api/portal-data/profile\` without a portal account | Endpoint is guarded by \`requirePortalAuth\` in \`portal-data.ts:45\`. \`req.session.portal\` is undefined. Middleware responds with HTTP 401 Unauthorized \`{ "success": false, "message": "Portal authentication required" }\`. |
| 12 | HR Webhook Without API Key in Production | Attacker sends \`POST /api/hr-sync/receive\` without \`x-api-key\` when \`NODE_ENV=production\` and \`HR_SYNC_API_KEY\` is not set | Route checks lines 165-167 of \`hr-sync.ts\`. Server immediately returns HTTP 403 Forbidden \`{ "error": "HR_SYNC_API_KEY not configured — webhook access denied in production" }\`. |
| 13 | Cross-User Signature Access | Non-admin user (ID 5) requests \`GET /api/users/2/signature\` | \`user-signature.ts:131\` checks \`!admin.isSystemAdmin && targetUserId !== admin.userId\`. Since user 5 is not system admin and 2 !== 5, server responds with HTTP 403 Forbidden \`{ "success": false, "message": "Only system admins can view other users' signatures" }\`. |
| 14 | Room Status Multi-Permission Update | User with only \`housekeeping.edit\` (no \`housing.edit\` or \`accommodation.edit\`) patches \`PATCH /api/rooms/10/status\` | \`rooms.ts:835-842\` evaluates disjunctive check. Because \`hasPermission(user, "housekeeping", "edit")\` is true, the request is authorized and succeeds with HTTP 200. |
| 15 | Header Injection (\`x-property-id\`) | Malicious user supplies header \`x-property-id: 2\` to bypass query validation on \`GET /api/assignments/in-house\` | \`getTenantId(req)\` evaluates only \`req.query.propertyId\`, \`req.body.propertyId\`, and \`req.session.propertyId\`. The header \`x-property-id\` is completely ignored for database routing. Tenant schema remains strictly tied to session/query. |
| 16 | Case-Insensitive Role Normalization | User record has roles stored as \`["Manager", "RECEPTIONIST"]\` | \`normalizeRoles\` converts all role strings to lowercase (\`manager\`, \`receptionist\`). Inheritance engine resolves both without error. Permissions match correctly. |

---

## 1. Executive Architecture Summary

The Sunrise Staff Housing Management System employs a **Dual-Layer RBAC Architecture** paired with a **PostgreSQL 18 Multi-Tenant Schema Isolation** mechanism:

1. **Layer 1 — Frontend Enforcement (\`artifacts/housing\`):**
   - **UI Control Gating:** Interactive components, buttons, actions, and dialog triggers are wrapped in \`<PermissionGate module="{module}" action="{action}">\` from \`@/components/ui/permission-gate.tsx\`. Non-permitted elements are cleanly removed from the DOM or rendered as disabled fallbacks.
   - **Route / Page Protection:** Page routes are protected in \`App.tsx\` using \`<PermissionLayout module="..." action="...">\`. Unauthenticated users are redirected to \`/login\`, while authenticated users without module permission see a dedicated bilingual \`403 Access Denied\` boundary.
   - **Sidebar Navigation Filtering:** Navigation items in \`AppLayout.tsx\` evaluate \`canView(module)\` from \`usePermission()\`. Tabs and menus for forbidden modules are hidden from view.
   - **Dynamic Root Redirection:** The root URL (\`/\`) redirects users to their first permitted module via \`RootRedirect()\`.

2. **Layer 2 — Backend API Enforcement (\`artifacts/api-server\`):**
   - **Global Session Guard:** Express router-level middleware in \`routes/index.ts\` (lines 72-80) intercepts all administrative endpoints and asserts an active user session (\`req.session.userId\`), returning HTTP \`401 Unauthorized\` if missing.
   - **Route Guarding:** Endpoints apply \`requirePermission(module, action)\` or \`requireAnyPermission(...)\` from \`middlewares/permissions.ts\`. Forbidden attempts immediately return HTTP \`403 Forbidden\`.
   - **Dynamic Mutation Guards:** Sensitive endpoints such as \`PATCH /api/users/:id\` apply \`requireUserUpdatePermission\`, dynamically asserting \`users.manage_permissions\`, \`users.reset_password\`, or \`users.edit\` based on the mutated payload keys.
   - **Webhook & Machine Authentication:** External webhooks (e.g. HR sync) authenticate using cryptographic API keys (\`x-api-key\` matching \`HR_SYNC_API_KEY\`).
   - **Employee Portal Boundary:** Portal routes use dedicated portal sessions (\`req.session.portal\`) enforced by \`requirePortalAuth\`. Cross-talk between administrative and portal sessions is strictly rejected.

3. **Multi-Tenant Schema Isolation:**
   - Global administrative entities (\`users\`, \`properties\`, \`user_sessions\`, \`password_history\`, \`user_signatures\`) reside in the \`public\` schema.
   - Operational entities (\`buildings\`, \`floors\`, \`rooms\`, \`profiles\`, \`assignments\`, \`reservations\`, \`maintenance\`, \`activity_logs\`, \`settings\`, \`hostings\`, \`documents\`, etc.) are partitioned into hotel property schemas (\`taal_housing\`, \`el_waha_new\`, \`elwaha_old\`, and dynamic \`prop_{id}\`).
   - Isolation is enforced inside \`withTenant(propertyId, callback)\` via SQL transaction-scoped search paths (\`SET LOCAL search_path TO "{schemaName}", public\`). Search path changes do not leak across connection pool re-use.

---

## 2. Baseline Roles & Permission Hierarchy

### 2.1 Technical Role Hierarchy & Default Permissions
The system defines 9 core technical roles in \`middlewares/permissions.ts\` and \`artifacts/housing/src/lib/permissions.ts\`:

| Role Key | Arabic Display Name | English Display Name | Inherited Roles | Default Permissions Scope |
| :--- | :--- | :--- | :--- | :--- |
| \`super_admin\` | مدير النظام العام | Super Admin | None | All modules, all actions (\`*\`). Full access to \`properties\` and multi-tenant management. |
| \`system_admin\` | مدير النظام التقني | System Admin | None | All modules, all actions (\`*\`). Same as \`super_admin\`. |
| \`admin\` | مدير النظام | Property Admin | None | All module actions EXCEPT \`properties\` module. Includes \`users.unlock\`. |
| \`manager\` | مدير المجمع | Property Manager | \`receptionist\` | Inherits all \`receptionist\` permissions plus CRUD on housing, profiles, housekeeping, maintenance, accommodation, reservations, guest hosting, evaluations, users view/edit/manage_permissions/unlock, settings, documents, billing, activity log audit. |
| \`receptionist\` | موظف استقبال | Receptionist | None | Front desk operations: view/export housing, view housekeeping, view profiles, full in-house assignments/checkin/checkout/approve, reservations CRUD/checkin/checkout/approve, guest hosting CRUD, maintenance view/create/edit, reports view/export, activity log view. |
| \`maintenance_staff\` | موظف صيانة | Maintenance Staff | None | Maintenance operations: dashboard view, housing view, housekeeping view/edit, maintenance view/create/edit/assign/approve, profiles view, activity log view, documents view. |
| \`hr_admin\` | مسؤول الموارد البشرية | HR Admin | None | HR & personnel operations: dashboard view/export, profiles CRUD/export, evaluations CRUD/export, surveys CRUD, activities CRUD/publish, documents CRUD, portal content CRUD, communications CRUD, reports view/export, hosting requests CRUD, guest hosting CRUD. |
| \`portal_admin\` | مسؤول البوابة | Portal Admin | None | Portal content management: dashboard view, activities CRUD/publish, documents CRUD, portal content CRUD, communications CRUD, reports view. |
| \`security_staff\` | موظف أمن | Security Staff | None | Security & gate management: dashboard view, housing view, accommodation view, smart locks CRUD, activities view. |

### 2.2 Functional Role Mapping (Business Presets)
In accordance with system specifications and business workflows, specialized business roles map to the technical roles and presets as follows:

| Functional Role | Mapped Technical Role / Preset | Typical Workflow Responsibilities |
| :--- | :--- | :--- |
| **Super Admin** | \`super_admin\` | Complete multi-property governance, hotel provisioning, user provisioning across properties. |
| **General Manager** | \`manager\` (with \`dashboard.audit\`) | High-level property oversight, occupancy KPI monitoring, cross-department auditing. |
| **HR Director** | \`hr_admin\` | Staff onboarding, identity records, evaluations, leave/vacation synchronizations. |
| **Housing Manager** | \`manager\` | Building capacity allocations, room policy overrides, approval workflows. |
| **Housing Supervisor** | \`manager\` / \`receptionist\` | Room inspections, key allocations, floor readiness, check-in/out execution. |
| **Maintenance Supervisor**| \`maintenance_staff\` (with \`maintenance.assign\`, \`approve\`) | Work order dispatching, technician scheduling, repair SLA tracking. |
| **Front Desk** | \`receptionist\` | Resident registration, guest check-in, key card encoding, daily movements. |
| **Auditor** | Read-Only Preset + Audit perms | Read-only inspection of reports, historical transactions, system activity logs (\`activity_log.view\`, \`activity_log.audit\`, \`reports.audit\`). |
| **Viewer** | Read-Only Preset | Read-only visibility across modules without create/edit/delete/export actions. |

---

## 3. Custom Permission Overrides & Safeguards

### 3.1 Storage & Formats
- Custom permissions are stored in \`usersTable.permissions\` as a PostgreSQL string array (\`text[]\`).
- Dot notation (\`module.action\`) and colon notation (\`module:action\`) are symmetrically supported.
- Legacy alias \`employees.*\` is automatically mapped to \`profiles.*\`.

### 3.2 Dynamic Inheritance (\`[]\`) vs. Zero-Permission Safeguard (\`["none"]\`)
- **Empty Array (\`[]\`):** Treated as uncustomized. The user dynamically inherits default permissions from their assigned roles and role hierarchy.
- **Zero-Permission Override (\`["none"]\`):** Explicitly revokes all permissions while preventing fallback to role defaults. \`effectivePermissions()\` skips \`"none"\`, producing an empty set (0 permissions).
- **Admin Lockout Immunity:** Even with \`["none"]\`, \`super_admin\` and \`system_admin\` retain \`users.view\` and \`users.manage_permissions\`.

---

## 4. Multi-Tenant Property Isolation Architecture

### 4.1 Schema Isolation & Provisioning
- Hotel properties operate in distinct PostgreSQL schemas (\`taal_housing\`, \`el_waha_new\`, \`elwaha_old\`, \`prop_{id}\`).
- Created via \`POST /api/properties\`, which automatically clones 28 operational tables and initializes default settings.

### 4.2 Data Leak Vectors & Verification Assertions

| # | Vulnerability Vector | Attack Scenario | Defensive Mechanism | Expected Test Assertion |
| :- | :--- | :--- | :--- | :--- |
| **V1** | **Query Parameter Tampering** | Single-property user on Property 1 sends \`GET /api/assignments/in-house?propertyId=2\` | \`loadAuthUser\` extracts \`req.query.propertyId\`, validates against \`authUser.propertyIds\`. | HTTP \`403 Forbidden\` (\`"Access denied to this property"\`). |
| **V2** | **Payload Body Tampering** | Single-property user posts \`POST /api/maintenance\` with body \`{ propertyId: 2, ... }\` | \`loadAuthUser\` extracts \`req.body.propertyId\`, validates against \`authUser.propertyIds\`. | HTTP \`403 Forbidden\` (\`"Access denied to this property"\`). |
| **V3** | **Missing Property Parameter** | User omits \`propertyId\` query and body parameters | \`getTenantId(req)\` falls back to \`req.session.propertyId\`, clamped to \`propertyIds[0]\`. | Successfully queries assigned property; no cross-tenant leakage. |
| **V4** | **Cross-Tenant Entity ID Query** | User on Property 1 requests \`GET /api/profiles/:id\` using ID belonging to Property 2 | Query runs inside \`withTenant(1)\`, where \`SET LOCAL search_path TO taal_housing, public\`. Record does not exist in schema. | HTTP \`404 Not Found\`. |
| **V5** | **Header Tampering (\`x-property-id\`)** | Malicious client sends header \`x-property-id: 2\` to manipulate schema | \`getTenantId(req)\` strictly ignores \`x-property-id\` for database operations. | Operation executes strictly within session/query property schema. |
| **V6** | **Global Property Mutation** | Non-super-admin attempts \`POST /api/properties\`, \`PATCH /api/properties/:id\`, or \`DELETE /api/properties/:id\` | Protected by \`requirePermission("properties", "create" \| "edit" \| "delete")\`. Baseline \`admin\` has properties module excluded. | HTTP \`403 Forbidden\` (\`"Permission denied: properties.*"\`). |
| **V7** | **Portal Account Session Hijacking** | Employee portal user sends cookie to core admin endpoint \`/api/users\` | Global middleware in \`routes/index.ts:79\` requires \`req.session.userId\`. Portal users only have \`req.session.portal\`. | HTTP \`401 Unauthorized\` (\`{ success: false, message: "Unauthorized" }\`). |
| **V8** | **HR Sync Webhook Impersonation** | External attacker hits \`POST /api/hr-sync/receive\` without API key | Webhook asserts \`req.headers["x-api-key"] === process.env["HR_SYNC_API_KEY"]\`. Denies access in production if key is not configured. | HTTP \`401 Unauthorized\` or \`403 Forbidden\`. |
| **V9** | **Zero-Permission Override Bypass** | User with role \`manager\` has permissions set to \`["none"]\` | \`effectivePermissions()\` skips \`"none"\` and treats permissions set as empty (0 permissions). | HTTP \`403 Forbidden\` on all protected endpoints. |

---

## 5. Frontend PermissionGate Mapping Matrix

Every \`<PermissionGate>\` instance across the Housing frontend (\`artifacts/housing/src/\`) mapped to its file, control element, and wrapped action:

| # | File Path | Line | Module | Action | Wrapped Control Element | UI Description / Label |
| :- | :--- | :- | :--- | :--- | :--- | :--- |
`;

gates.forEach((g, idx) => {
  md += `| ${idx + 1} | \`${g.file}\` | ${g.line} | \`${g.module}\` | \`${g.action}\` | ${g.controlType} | ${g.label.replace(/\|/g, '\\|')} |\n`;
});

md += `
---

## 6. Comprehensive Backend API Route & Permission Matrix

Enumeration of all Express route endpoints across \`artifacts/api-server/src/routes/\`:

| # | Route File | Method | Full API Route Path | Permission Guard / Security Middleware | Tenant Isolation Mode |
| :- | :--- | :- | :--- | :--- | :--- |
`;

routes.forEach((r, idx) => {
  md += `| ${idx + 1} | \`${r.file}\` | ${r.method} | \`${r.endpoint}\` | ${r.permissionGuard} | ${r.tenantIsolation} |\n`;
});

md += `
---

## 7. Automated Test Assertion Suite Recommendations

To achieve 100% verification of the Dual-Layer RBAC and Multi-Tenant Isolation as mandated by ORIGINAL_REQUEST.md (#2026-09-08T13:32:04Z), automated tests must assert the following matrix:

1. **Dual-Layer RBAC Positive & Negative Tests:**
   - **Role Default Assertions:** For each baseline role, authenticate as a user with that role and verify access to permitted routes returns HTTP 200/201, while restricted routes return HTTP 403.
   - **Zero-Permission Assertion (\`["none"]\`):** Create a user with role \`manager\`, assign permissions \`["none"]\`. Assert that calling \`GET /api/assignments/in-house\` returns HTTP 403 Forbidden, proving role defaults are suppressed.
   - **Dynamic Role Inheritance Assertion (\`[]\`):** Set user permissions to \`[]\`. Assert that role defaults are dynamically restored and succeed with HTTP 200.
   - **Frontend Button Visibility:** For each PermissionGate test account, load the DOM and assert that non-permitted action buttons do not exist in the DOM tree.

2. **Multi-Tenant Property Boundary Tests:**
   - **Parameter Tampering Boundary:** As a user assigned only to Property 1 (\`taal_housing\`), issue \`GET /api/assignments/in-house?propertyId=2\`. Assert HTTP 403 Forbidden with exact body \`{ "error": "Access denied to this property" }\`.
   - **Body Injection Boundary:** Issue \`POST /api/maintenance\` with JSON body \`{ "propertyId": 2, "title": "Leak" }\`. Assert HTTP 403 Forbidden.
   - **Cross-Tenant ID Probing:** Issue \`GET /api/profiles/{id_from_property_2}?propertyId=1\`. Assert HTTP 404 Not Found.
   - **Properties API Restriction:** As \`admin\` (not \`super_admin\`), issue \`POST /api/properties\`. Assert HTTP 403 Forbidden (\`Permission denied: properties.create\`).

3. **Portal vs Admin Session Segregation:**
   - As an authenticated Portal resident, issue \`GET /api/users\`. Assert HTTP 401 Unauthorized.
   - As an authenticated Housing Admin, issue \`GET /api/portal-data/my-profile\` without a portal session. Assert HTTP 401 Unauthorized.
`;

fs.writeFileSync(path.join(__dirname, 'rbac_spec_matrix.md'), md, 'utf8');
console.log('Successfully generated full rbac_spec_matrix.md, size:', md.length);
