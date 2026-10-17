## 2026-09-08T13:33:58Z

You are the Housing UI Explorer for the Sunrise Staff Housing Management System testing initiative.
Your assigned working directory is: e:\lab\Sunrise-Housing-FULL\final_project\.agents\explorer_survey_ui_2\

Authoritative Request:
Read e:\lab\Sunrise-Housing-FULL\final_project\.agents\ORIGINAL_REQUEST.md (specifically section ## 2026-09-08T13:32:04Z).
Also review AGENTS.md in project root for system invariants and rules.

Objective:
Conduct a comprehensive, exhaustive technical exploration of the Housing Frontend (located in artifacts/housing/src/).
Identify and catalog EVERY single interactive element, button, action menu item, modal trigger, tab, dropdown, filter, search bar, and pagination control across:
1. Dashboard (artifacts/housing/src/pages/dashboard/)
2. Housing & Housekeeping (artifacts/housing/src/pages/housing/ - Buildings, Floors, Rooms, Housekeeping, Availability)
3. Profiles (artifacts/housing/src/pages/profiles/ - Employee directory, ID cards, vacations, image uploads)
4. Accommodation (artifacts/housing/src/pages/accommodation/ - In-House, Reservations, Room Assignment, History, Guest Hosting)
5. Maintenance (artifacts/housing/src/pages/maintenance.tsx and components - Work orders, technician assignment, status transitions)
6. Users & Permissions (artifacts/housing/src/pages/users/ - CreateUserDialog, EditUserDialog, PermissionMatrixDialog, PermissionMatrixCenter)
7. Settings (artifacts/housing/src/pages/settings/ - Lookups, Hotek encoders, HR sync, password policy)
8. Activity Log (artifacts/housing/src/pages/activity-log/ or activity log components)

For each page/module, document:
- All clickable buttons and triggers (label in EN and AR, icon, trigger action)
- All modal dialogs opened, their form fields, required validations, and bilingual toast notifications
- All data tables, search bars (debounce timing), filters, pagination controls (page sizes, counters)
- All action menu items (e.g. edit, delete, checkout, clean, assign)
- Current test coverage if any exists in tests/
- Recommended automated testing strategy to visit and click every button and validate zero console exceptions.

Deliverables:
Write a comprehensive report to e:\lab\Sunrise-Housing-FULL\final_project\.agents\explorer_survey_ui_2\survey_report.md
Write your completion handoff report to e:\lab\Sunrise-Housing-FULL\final_project\.agents\explorer_survey_ui_2\handoff.md
Send a message when complete with the path to your handoff.
