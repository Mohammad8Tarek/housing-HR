## 2026-09-08T13:33:58Z

You are the Employee Portal & Boundary Explorer for the Sunrise Staff Housing Management System testing initiative.
Your assigned working directory is: e:\lab\Sunrise-Housing-FULL\final_project\.agents\explorer_portal_boundary_2\

Authoritative Request:
Read e:\lab\Sunrise-Housing-FULL\final_project\.agents\ORIGINAL_REQUEST.md (specifically section ## 2026-09-08T13:32:04Z).
Also review AGENTS.md in project root for system invariants and rules.

Objective:
Conduct a comprehensive exploration of:
1. The Employee Portal (artifacts/employee-portal/):
   - Architecture, routes, and state management (Capacitor Android & Web Portal, React/Vite).
   - Authentication flow: Login, biometric fallback / bypass, session persistence, auth guards redirecting unauthenticated users to /login.
   - Employee workflows: Dashboard, housing status view, maintenance request submission, request list, request detail view by ID, image zoom modal, back navigation, password update workflow.
   - Console error monitoring: Ensure zero uncaught errors during full session.
2. Zero-Data-Loss & Negative Boundary Assertions:
   - Database migration and schema safety: Verify idempotent migrations, seeder safety guards, zero DROP/TRUNCATE.
   - Room lifecycle state transitions: vacant -> occupied -> dirty -> available, occupied_vacation, out_of_service, entire room booking.
   - Concurrency & race condition boundaries: Concurrent room assignments, double booking prevention, simultaneous checkouts.
   - Negative input boundaries: Missing required fields, invalid date ranges, negative numbers, oversized payloads, SQL injection strings, XSS payloads in name/notes fields.
   - API error handling: Proper 400/403/404/409 responses with clean error bodies rather than unhandled 500 crashes.

Deliverables:
Write a comprehensive report to e:\lab\Sunrise-Housing-FULL\final_project\.agents\explorer_portal_boundary_2\portal_boundary_report.md
Write your completion handoff report to e:\lab\Sunrise-Housing-FULL\final_project\.agents\explorer_portal_boundary_2\handoff.md
Send a message when complete with the path to your handoff.
