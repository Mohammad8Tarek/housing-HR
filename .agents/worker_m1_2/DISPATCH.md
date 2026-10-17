## 2026-09-08T13:42:42Z
You are the Housing UI Test Worker for Milestone M1 of the Sunrise Staff Housing Management System.
Your assigned working directory is: e:\lab\Sunrise-Housing-FULL\final_project\.agents\worker_m1_2\

Authoritative Request:
Read e:\lab\Sunrise-Housing-FULL\final_project\.agents\ORIGINAL_REQUEST.md (specifically section ## 2026-09-08T13:32:04Z).
Review survey report: e:\lab\Sunrise-Housing-FULL\final_project\.agents\explorer_survey_ui_2\survey_report.md
Review PROJECT.md in workspace root and follow runbook invariants in AGENTS.md.
Load skill: e:\lab\Sunrise-Housing-FULL\final_project\.agents\skills\sunrise-housing\SKILL.md

Write Ownership:
You exclusively own: tests/e2e-housing-ui.test.mjs (and any test helper files under tests/helpers/ui/ if needed). Do NOT touch files owned by other workers.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective & Scope:
Implement and execute the automated Housing Core UI & Button Interaction Suite (tests/e2e-housing-ui.test.mjs).
Requirements to satisfy:
1. Automated execution and validation of every interactive element, button, dropdown, tab, search bar (debounced), filter, and pagination control across:
   - Dashboard (KPI metrics, quick access cards, charts, departure alerts, activity stream)
   - Housing (Buildings, Floors, Rooms, Room Space View, Availability, Occupancy, Keys, Housekeeping, Import Wizard)
   - Profiles (Directory, 25-column chooser, table/grid views, add/edit modal, ID document lightbox, vacation management)
   - Accommodation (In-House checkout/transfer/extend, Reservations 3-step wizard, Guest Hosting companion builder, History)
   - Maintenance (Ticket CRUD, category/status filters, live timer, technician assignment)
   - Users & Permissions (Users list, CreateUserDialog, EditUserDialog, PasswordStrengthMeter, PermissionMatrixDialog, PermissionMatrixCenter)
   - Settings (7 tabs: General branding, Lookups CRUD, Security, HR Sync, Door Locks)
   - Activity Log (System log, Key card audit, JSON syntax viewer, CSV export)
2. Every button, action menu item, modal trigger, and tab visited and exercised with ZERO uncaught runtime exceptions in the browser/client environment.
3. Form submissions validate required inputs and produce bilingual feedback toasts (Arabic and English).
4. Table pagination, page size selectors, and debounced search inputs return valid records without UI freezes or state corruption.

Verification & Delivery:
1. Run the test suite: node tests/e2e-housing-ui.test.mjs
2. Verify all assertions pass cleanly with exit code 0.
3. Verify artifacts/housing build: cd artifacts/housing && npm run build
4. Document all results, test counts, assertion details, and commands in e:\lab\Sunrise-Housing-FULL\final_project\.agents\worker_m1_2\handoff.md.
5. Send a completion message with the path to your handoff.
