## 2026-09-08T13:42:42Z
You are the Boundary & Master Health Test Writer for Milestone M4 of the Sunrise Staff Housing Management System.
Your assigned working directory is: e:\lab\Sunrise-Housing-FULL\final_project\.agents\test_writer_m4_2\

Authoritative Request:
Read e:\lab\Sunrise-Housing-FULL\final_project\.agents\ORIGINAL_REQUEST.md (specifically section ## 2026-09-08T13:32:04Z).
Review survey reports:
- e:\lab\Sunrise-Housing-FULL\final_project\.agents\explorer_survey_ui_2\survey_report.md
- e:\lab\Sunrise-Housing-FULL\final_project\.agents\spec_miner_rbac_2\rbac_spec_matrix.md
- e:\lab\Sunrise-Housing-FULL\final_project\.agents\explorer_portal_boundary_2\portal_boundary_report.md
Review PROJECT.md in workspace root and follow runbook invariants in AGENTS.md.
Load skill: e:\lab\Sunrise-Housing-FULL\final_project\.agents\skills\sunrise-housing\SKILL.md

Write Ownership:
You exclusively own:
- tests/e2e-zero-data-loss-boundaries.test.mjs
- tests/run-all-tests.mjs (master test runner orchestrating all suites and generating health report)
- TEST_READY.md (updating test documentation with full test suite stats)
Do NOT touch files owned by other workers.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective & Scope:
1. Zero-Data-Loss & Negative Boundary Test Suite (tests/e2e-zero-data-loss-boundaries.test.mjs):
   - Idempotent Migrations: Verify master SQL migration (20260904_complete_schema_and_constraints.sql) runs idempotently across all schemas (public, taal_housing, el_waha_new, elwaha_old) with zero data loss and zero DROP TABLE in production.
   - Seeder Safety: Assert seeder guard verifies property record counts and prevents overwriting existing data.
   - Room Lifecycle State Machine: Test transitions (available -> occupied -> dirty -> available, occupied_vacation, out_of_service, entire_room booking).
   - Concurrency & Race Conditions: Test concurrent bed bookings, double booking prevention, and simultaneous checkouts.
   - Negative Boundaries: Test SQL injection strings, XSS in notes/names, inverted date ranges (checkOutDate < checkInDate), capacity <= 0, oversized payloads, and ensure graceful 400/403/404/409 error responses without 500 server crashes.
2. Master Test Runner & Full System Health Report (tests/run-all-tests.mjs):
   - Orchestrate running tests/e2e-housing-ui.test.mjs, tests/e2e-rbac-matrix.test.mjs, tests/e2e-employee-portal.test.mjs, and tests/e2e-zero-data-loss-boundaries.test.mjs.
   - Measure test execution latencies and assertion counts.
   - Generate structured Full System Health Report detailing pass/fail status, response times, and DOM coverage percentage.
   - Output structured summary and update TEST_READY.md.

Verification & Delivery:
1. Run tests/e2e-zero-data-loss-boundaries.test.mjs: node tests/e2e-zero-data-loss-boundaries.test.mjs
2. Run master test suite: node tests/run-all-tests.mjs
3. Verify all assertions pass cleanly with exit code 0.
4. Document all results, test counts, assertion details, and commands in e:\lab\Sunrise-Housing-FULL\final_project\.agents\test_writer_m4_2\handoff.md.
5. Send a completion message with the path to your handoff.