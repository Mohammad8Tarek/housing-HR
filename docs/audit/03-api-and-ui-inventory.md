# 03 — API and UI Inventory: Empirical Route Catalog

## 1. HRMS Backend Route Inventory (`artifacts/api-server/src/routes/`)

| Route File | Base Path | Key Methods & Endpoints | Required Permission |
|---|---|---|---|
| `hr-auth.ts` | `/api/hr-auth` | `GET /properties-vault`<br>`POST /login`<br>`GET /me`<br>`POST /logout`<br>`POST /verify-pin`<br>`GET/POST /users` | Public / Session Auth |
| `hrms-employees.ts` | `/api/hrms` | `GET /employees`<br>`POST /employees`<br>`GET /employees/:id`<br>`PUT /employees/:id`<br>`POST /employees/:id/documents`<br>`POST /employees/:id/history`<br>`POST /employees/bulk-import` | `payroll.view`<br>`payroll.create`<br>`payroll.edit` |
| `hrms-org.ts` | `/api/hrms` | `GET /organization/tree`<br>`GET/POST /legal-entities`<br>`GET/POST /cost-centers`<br>`GET/POST /sections`<br>`GET/POST /job-grades`<br>`GET/POST /holidays`<br>`GET /workflows` | `payroll.view`<br>`payroll.create`<br>`attendance.view`<br>`attendance.create` |
| `hrms-recruitment.ts` | `/api/hrms/recruitment` | `GET/POST /requisitions`<br>`PATCH /requisitions/:id/status`<br>`GET/POST /vacancies`<br>`GET/POST /candidates`<br>`PATCH /candidates/:id/stage`<br>`GET/POST /interviews`<br>`GET/POST /offers`<br>`POST /candidates/:id/convert-to-employee`<br>`GET /onboarding-tasks` | `payroll.view`<br>`payroll.create`<br>`payroll.edit` |
| `attendance.ts` | `/api/attendance` | `GET/POST /shifts`<br>`POST /checkin`<br>`GET /records`<br>`POST /process-punches`<br>`POST /sync-to-payroll`<br>`GET/POST /devices`<br>`GET /monthly-summaries` | `attendance.view`<br>`attendance.create` |
| `payroll.ts` | `/api/payroll` | `GET/POST /periods`<br>`GET/POST /runs`<br>`POST /calculate`<br>`POST /runs/:id/approve`<br>`GET /runs/:id/slips`<br>`GET /runs/:id/wps`<br>`GET/POST /service-charge` | `payroll.view`<br>`payroll.create`<br>`payroll.edit`<br>`payroll.export` |
| `payroll-operations.ts` | `/api/payroll-ops` | `GET /leave-types`<br>`GET/POST /leaves`<br>`PATCH /leaves/:id/approve`<br>`GET/POST /penalties`<br>`GET/POST /loans`<br>`POST /loans/:id/installments` | `payroll.view`<br>`payroll.create`<br>`payroll.edit` |
| `hrms-finance.ts` | `/api/hrms/finance` | `GET/POST /gl-accounts`<br>`GET/POST /budgets`<br>`GET /journal-entries`<br>`POST /journal-entries/generate/:payrollRunId` | `payroll.view`<br>`payroll.create` |
| `hrms-learning.ts` | `/api/hrms` | `GET/POST /learning/courses`<br>`GET/POST /learning/sessions`<br>`GET/POST /learning/enrollments`<br>`GET/POST /appraisals/cycles`<br>`GET /appraisals/templates`<br>`GET/POST /appraisals` | `payroll.view`<br>`payroll.create`<br>`payroll.edit` |
| `hrms-services.ts` | `/api/hrms/services` | `GET/POST /transport/routes`<br>`GET/POST /transport/assignments`<br>`GET/POST /foreign-docs`<br>`GET/POST /medical-records`<br>`GET /document-categories`<br>`GET/POST /documents`<br>`GET /audit-logs`<br>`GET /notifications` | `payroll.view`<br>`payroll.create` |

---

## 2. Frontend Screens & Components Inventory (`artifacts/housing/src/`)

| Page / Component Path | URL Route | Core Capabilities | UI Controls & Modals |
|---|---|---|---|
| `pages/auth/HrPropertyGatePage.tsx` | `/hr-portal`, `/payroll/login`, `/attendance/login` | Pre-entry Hotel Vault Selector (Meraki, Crystal Bay, Montemare, Romance) | Scoped credential form, 4-digit PIN field, scope warning banner |
| `components/layout/HrSuiteLayout.tsx` | All HRMS subroutes | Universal persistent HRMS Topbar & Sidebar | Locked Property Badge, Language switcher, Theme toggle, Direct module navigation |
| `pages/hrms/index.tsx` | `/hrms` | Central HRMS Operations Hub with 5 primary operational tabs | Employee Master table, Add Employee dialog, View Profile modal, Organization hierarchy tree, Recruitment pipeline, Training courses, Medical & Transport tabs |
| `pages/payroll/index.tsx` | `/payroll` | Monthly Payroll Ledger & Financial Control Center | 5 tabs: Payroll Runs, Employee Salary Config, 12% Service Charge pool, Operations (Loans, Penalties, EOS, Tax Simulator), Reports & Slips |
| `pages/attendance/index.tsx` | `/attendance` | Biometric Attendance & Shift Management | 5 tabs: Daily Attendance, Punch Ingestion, Biometric Terminals, Shift Definitions & Monthly Rosters, Leave Applications & Multi-Level Approvals |
| `components/modals/DualKeyAuthModal.tsx` | Modal trigger | Secondary Supervisor PIN Challenge | Blocks sensitive operations until supervisor PIN is verified via API |
