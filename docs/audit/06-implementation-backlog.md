# Phase 6: Implementation Remediation Backlog & Resolution Matrix

This document tracks all defects, architectural gaps, and security vulnerabilities identified during the audit, their severity classification, affected files, resolution actions, and verification status.

---

## 1. Defect Classification & Remediation Status

| ID | Module | Severity | Description | Affected Files | Resolution Action | Verification |
|---|---|---|---|---|---|---|
| **SEC-01** | Dual-Key Auth | **P0 (Critical)** | Hardcoded supervisor PINs (`1234`, `2026`, `9999`, `0000`) accepted without supervisor identity verification. | `artifacts/api-server/src/routes/hr-auth.ts` | Removed trivial PINs (`9999`, `0000`), enforced session authentication, env-configured PIN fallback, and logged security stamps to `hrms_audit_logs`. | **VERIFIED (PASSED)** |
| **SEC-02** | Dual-Key Auth | **P0 (Critical)** | Missing rate limiting on `POST /hr-auth/verify-pin`, enabling brute-force PIN attacks. | `artifacts/api-server/src/routes/hr-auth.ts` | Enforced strict in-memory tracker (5 attempts max, 15-minute temporary lockout), returning HTTP 429 when locked. | **VERIFIED (PASSED)** |
| **FIN-01** | GL Accounting | **P1 (High)** | Journal voucher generation wrote `0.00` because it read `run.totalNetPay` instead of schema column `run.totalNet`, and `periodLabel` read `run.periodId` instead of `run.payrollPeriodId`. | `artifacts/api-server/src/routes/hrms-finance.ts` | Corrected column references to `run.totalNet` and `run.payrollPeriodId`. | **VERIFIED (PASSED)** |
| **FIN-02** | GL Accounting | **P1 (High)** | Chart of accounts in `gl_accounts` had 0 rows, preventing general ledger posting and mapping. | `lib/db-payroll/src/seed-hrms-foundation.ts` | Created idempotent unique index `idx_gl_accounts_prop_acc` and seeded 121 standard USALI hospitality accounts across all 11 properties. | **VERIFIED (PASSED)** |
| **PAY-01** | Payroll Engine | **P1 (High)** | Payroll calculation did not verify if the accounting period was closed, potentially allowing recalculation on closed historical payroll runs. | `artifacts/api-server/src/routes/payroll.ts` | Added strict validation rejecting `POST /payroll/calculate` with HTTP 400 if `period.status === "closed"`. | **VERIFIED (PASSED)** |
| **PAY-02** | Bank WPS Export | **P1 (High)** | WPS bank file export permitted downloading files for unapproved draft payroll runs. | `artifacts/api-server/src/routes/payroll.ts` | Added `POST /payroll/runs/:id/approve` endpoint and restricted `GET /payroll/runs/:id/wps` to runs with `status === "approved" \|\| status === "closed"`. | **VERIFIED (PASSED)** |
| **LEV-01** | Leave Ops | **P2 (Medium)** | Leave applications did not validate that `startDate <= endDate` and lacked collision detection for overlapping requests. | `artifacts/api-server/src/routes/payroll-operations.ts` | Added date range validation and database query checking for overlapping active leave records for the same employee. | **VERIFIED (PASSED)** |
| **DB-01** | Multi-DB Isolation| **P1 (High)** | Audit logging cross-reference bug where Housing `user_id` was written to `hrms_audit_logs.user_id` violating foreign key to `hr_users`. | `artifacts/api-server/src/routes/hr-auth.ts` | Updated audit logging to only write `user_id` when authenticated via `hrUserId`, storing portal usernames safely in jsonb `details`. | **VERIFIED (PASSED)** |

---

## 2. Summary of Residual Technical Debt & Future Enhancements

1. **Hardware Biometric TCP Listener:** Currently, biometrics are accepted via standard REST sync endpoint (`POST /api/attendance/biometric/sync`). Direct ZKTeco/Hikvision push protocol daemon can be placed alongside Hotek PMS socket bridge.
2. **SSO Identity Federation:** Authentication is unified at the portal level via session bridge; future federation with corporate SAML 2.0 / Microsoft Entra ID can be layered over the existing auth routes.
3. **Automated End-of-Month Payroll Lock:** Cron job for auto-closing payroll periods after financial director review.
