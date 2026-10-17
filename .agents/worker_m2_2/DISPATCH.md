# DISPATCH — 2026-09-08T13:42:42Z

## Task Assignment
- **Role:** RBAC Test Worker for Milestone M2
- **Assigned Directory:** e:\lab\Sunrise-Housing-FULL\final_project\.agents\worker_m2_2\
- **Exclusive Write Ownership:** 	ests/e2e-rbac-matrix.test.mjs (and helpers under 	ests/helpers/rbac/ if needed)
- **Objective:** Implement and execute the automated Dual-Layer RBAC & Permission Matrix Verification suite (	ests/e2e-rbac-matrix.test.mjs)
- **Key Requirements:**
  1. Dual-Layer RBAC Enforcement:
     - Frontend: Verify across standard roles and custom matrices that UI buttons/actions wrapped in PermissionGate are properly hidden/disabled when permission is lacking (covering all 63 PermissionGate points cataloged in rbac_spec_matrix.md).
     - Backend API: Verify that direct API requests to protected endpoints across all 41 route files return HTTP 403 Forbidden with proper JSON error payload when called without the required permission.
  2. Custom Permission Matrix Behaviors:
     - Dynamic inheritance when permissions = [] (inherits baseline role defaults).
     - Explicit zero permissions when permissions = [none] (all actions denied).
     - Module.action and module:action dot/colon normalization.
     - Super admin self-lockout immunity.
  3. Multi-Tenant Property Schema Isolation:
     - Verify single-property users are strictly restricted to their assigned property schema (taal_housing, el_waha_new, elwaha_old).
     - Verify withTenant search_path clamping.
     - Assert zero data leaks across properties when querying users, profiles, rooms, or reservations.
  4. Run test suite: 
ode tests/e2e-rbac-matrix.test.mjs and verify all assertions pass cleanly with exit code 0.
  5. Document results in handoff.md and send completion message.
