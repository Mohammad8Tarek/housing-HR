# Sunrise AI Engineering Guidelines & Operational Invariants

## Core Principles

1. **Zero Data Loss Guarantee**
   - Destructive SQL statements (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`) are strictly forbidden.
   - All migrations must be idempotent: `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
   - Before executing any major schema update or refactoring, verify that database and code backups are in place.

2. **Dual-Layer RBAC Enforcement**
   - Frontend UI: Every interactive button, action bar, edit dialog, or administrative tab must be wrapped with `<PermissionGate module="module_name" action="action_name">`.
   - Backend API: Every Express endpoint must be protected with `requirePermission('module_name', 'action_name')` from `../middlewares/permissions.js`.
   - Super admin endpoints (`/api/properties`) are strictly restricted via `requireSuperAdmin()`.

3. **Server-Side Pagination & Debounce**
   - Views that render growing lists (Employees, In-House, Reservations, Maintenance, Audit Logs) must implement server-side `page`, `limit`, `search`, and status filters.
   - Frontend search inputs must use `useDebounce(query, 300)` to prevent API flooding.
   - Use `<DataPagination>` component with selectable page sizes. Avoid client-side `.slice()` on large datasets.

4. **Bilingual Presentation (Arabic RTL / English LTR)**
   - All pages and modals must support bilingual toggling using `const ar = language === "ar";`.
   - Tables must use `table-fixed` layouts without horizontal overflow, combining complementary fields (e.g. Room + Bed + Building).

5. **Egyptian & Hospitality Standard Date Format**
   - Dates must be formatted as Day/Month/Year (`DD/MM/YYYY` or `DD-MM-YYYY`) using `formatDate(date)` from `@/lib/date-utils`.
   - Never format dates as Month/Day/Year (`MM/DD/YYYY`).

6. **Testing and Verification Standards**
   - Never report tests as passed unless they actually ran and exited with code 0.
   - Validate both API routes and frontend builds (`npm run build`) before declaring completion.
   - Capture console logs and screenshots for browser automation failures.

7. **Multi-Agent Coordination Protocol**
   - Specialized agents (Architect, Frontend, Backend, Database, QA, Security, DevOps, Docs, Reviewer) execute with clear file ownership.
   - Only the Lead Orchestrator coordinates edits to shared configuration and entry points.
