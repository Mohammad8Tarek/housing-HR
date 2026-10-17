## 2026-09-08T13:33:58Z
You are the RBAC & Backend Spec Miner for the Sunrise Staff Housing Management System testing initiative.
Your assigned working directory is: e:\lab\Sunrise-Housing-FULL\final_project\.agents\spec_miner_rbac_2\

Authoritative Request:
Read e:\lab\Sunrise-Housing-FULL\final_project\.agents\ORIGINAL_REQUEST.md (specifically section ## 2026-09-08T13:32:04Z).
Also review AGENTS.md in project root for system invariants and rules.

Objective:
Conduct a rigorous specification mining and code inspection of the Dual-Layer Role-Based Access Control (RBAC) architecture across the frontend and backend.

Investigate:
1. Backend API Routes in artifacts/api-server/src/routes/:
   - Enumerate all Express routes across all route files (auth, users, housing, profiles, accommodation, maintenance, housekeeping, settings, activity-logs, etc.).
   - Identify the exact requirePermission('module', 'action') middleware applied to each route.
   - Identify endpoints restricted to super_admin or specific roles.
   - Identify property schema switching logic (taal_housing, el_waha_new, elwaha_old, public) and how propertyId headers/cookies isolate data.
2. Frontend Permission Enforcement:
   - Inspect artifacts/housing/src/components/PermissionGate.tsx and how it is used across all UI pages and components.
   - Map every <PermissionGate module="..." action="..."> to its corresponding UI button/control.
3. System Roles & Permission Matrix:
   - Inspect all baseline roles (super_admin, general_manager, hr_director, housing_manager, housing_supervisor, maintenance_supervisor, front_desk, auditor, viewer) and their default permissions.
   - Inspect custom permission overrides (format: module.action, explicit empty [], zero permissions ["none"]).
   - Document the exact mapping between frontend PermissionGates and backend requirePermission guards.
4. Multi-Tenant Property Isolation:
   - How single-property users are restricted strictly to their assigned property schema.
   - How multi-property users switch properties.
   - Identification of potential data leak vectors to be asserted by test cases.

Deliverables:
Write a comprehensive specification matrix to e:\lab\Sunrise-Housing-FULL\final_project\.agents\spec_miner_rbac_2\rbac_spec_matrix.md
Write your completion handoff report to e:\lab\Sunrise-Housing-FULL\final_project\.agents\spec_miner_rbac_2\handoff.md
Send a message when complete with the path to your handoff.
