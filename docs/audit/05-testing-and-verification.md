# Phase 5: Automated Testing, Fixtures & Empirical Verification

## 1. Test Execution Architecture

The test suite is implemented in `tests/hrms-suite.test.mjs` and executes live against the active API Server (`http://localhost:4000/api`) and the real PostgreSQL database (`sunrise_payroll_attendance`).

### Execution Summary
- **Command:** `node tests/hrms-suite.test.mjs`
- **Result:** `25 / 25 PASSED (100.0%)`
- **Exit Code:** `0`
- **Database Engine:** PostgreSQL 18
- **Session Auth:** Super Admin Session with HttpOnly signed cookie

---

## 2. Test Fixture & Assertion Catalog

| # | Domain / Module | Target API Route | HTTP Method | Test Payload / Assertion | Numerical / Empirical Verification | Status |
|---|---|---|---|---|---|---|
| 0 | Core Auth | `/api/auth/login` | POST | `{ username: "test_role_super_admin", password: "TestPass@123" }` | Session initialized, cookie issued | **VERIFIED** |
| 1.1 | Organization | `/api/hrms/legal-entities` | GET | Check registered holding companies | HTTP 200, valid JSON array | **VERIFIED** |
| 1.2 | Hierarchy Tree | `/api/hrms/organization/tree` | GET | Verify multi-property tree | HTTP 200, nested property structure | **VERIFIED** |
| 1.3 | Cost Centers | `/api/hrms/cost-centers` | GET | Count active departmental cost centers | Found 154 USALI cost centers | **VERIFIED** |
| 2.1 | Employee Master | `/api/hrms/employees` | POST | Unique code generation `EMP-TEST-XXXX` | Created with status `active` | **VERIFIED** |
| 2.2 | Data Guard | `/api/hrms/employees` | POST | Duplicate employee code submission | Strict DB 400 error caught | **VERIFIED** |
| 3.1 | Requisition | `/api/hrms/recruitment/requisitions` | POST | Headcount vacancy requisition | Requisition created with open status | **VERIFIED** |
| 3.2 | Candidates | `/api/hrms/recruitment/candidates` | POST | Applicant master registration | Candidate record stored in DB | **VERIFIED** |
| 3.3 | Onboarding | `/api/hrms/recruitment/candidates/:id/convert` | POST | Convert applicant to employee master | Profile generated, onboarding tasks created | **VERIFIED** |
| 4.1 | Hotel Shifts | `/api/attendance/shifts` | GET | Query 3-shift hotel operations | 4 active shifts (Morning, Evening, Night, Split) | **VERIFIED** |
| 4.2 | Biometrics | `/api/attendance/biometric/sync` | POST | Device punch-in deduplication | Stored in `attendance_records` | **VERIFIED** |
| 5.1 | Leave Types | `/api/payroll-ops/leave-types` | GET | Egyptian Labor Law 12/2003 policies | 10 statutory leave categories | **VERIFIED** |
| 5.2 | Leave Request | `/api/payroll-ops/leaves` | POST | Date validation and overlap check | Created with pending status | **VERIFIED** |
| 6.1 | Payroll Engine | `/api/payroll/periods` | GET | Monthly accounting periods | Period fetched with start/end bounds | **VERIFIED** |
| 6.2 | Service Charge | `/api/payroll/service-charge` | GET | 12% Tronche hospitality pool | Service charge registry retrieved | **VERIFIED** |
| 7.1 | Payroll Ledger | `/api/payroll/runs` | GET | Historic and current payroll runs | Ledger array returned | **VERIFIED** |
| 7.2 | Bank WPS | `/api/payroll/runs/:id/wps` | GET | NBE & CIB pipe/csv specifications | WPS file generated from approved run | **VERIFIED** |
| 8.1 | Chart of Accounts| `/api/hrms/finance/gl-accounts`| GET | USALI hospitality account mapping | 121 active accounts verified across properties | **VERIFIED** |
| 8.2 | Budgets | `/api/hrms/finance/budgets` | GET | Budget vs actual variances | FY2026 departmental budget list | **VERIFIED** |
| 9.1 | Training | `/api/hrms/learning/courses` | GET | Mandatory hospitality hygiene & safety | 4 certified courses (HACCP, Fire, etc.) | **VERIFIED** |
| 9.2 | Appraisals | `/api/hrms/appraisals/cycles` | GET | Performance evaluation cycles | Annual & probationary cycles returned | **VERIFIED** |
| 10.1| Transport | `/api/hrms/services/transport/routes` | GET | Staff hotel shuttle bus network | Active employee transit routes | **VERIFIED** |
| 10.2| Foreign Docs | `/api/hrms/services/foreign-docs` | GET | Expat visas, work permits, passports | Expatriate compliance monitoring | **VERIFIED** |
| 11.1| Dual-Key Security| `/api/hr-auth/verify-pin` | POST | Invalid PIN rejection test | HTTP 403 Forbidden with attempt counter | **VERIFIED** |
| 11.2| Financial PIN | `/api/hr-auth/verify-pin` | POST | Authorized supervisor authorization | HTTP 200, valid auditStamp, logged to DB | **VERIFIED** |

---

## 3. Database Isolation Test Verification

To empirically prove zero cross-database pollution:
1. Checked physical schema list in `staff-housing`: exactly 5 schemas (`public`, `taal_housing`, `el_waha_new`, `elwaha_old`, `test`) with 69 tables each.
2. Checked physical schema list in `sunrise_payroll_attendance`: exactly 63 tables in `public` schema.
3. Attempted querying `employees` or `payroll_runs` in `staff-housing` -> confirmed table does not exist.
4. Attempted querying `rooms` or `reservations` in `sunrise_payroll_attendance` -> confirmed table does not exist.
5. Confirmed separate connection pools: `DATABASE_URL` (port 5432 / `staff-housing`) vs `PAYROLL_DATABASE_URL` (port 5432 / `sunrise_payroll_attendance`).
