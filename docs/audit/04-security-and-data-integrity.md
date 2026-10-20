# 04 — Security and Data Integrity Audit

## 1. Identified Security Vulnerabilities (P0 & P1)

### Finding SEC-01: Hardcoded Supervisor Financial PIN
- **Severity:** P0 (Critical Vulnerability)
- **Affected File:** [`artifacts/api-server/src/routes/hr-auth.ts`](file:///e:/lab/Sunrise-Housing-FULL/final_project/artifacts/api-server/src/routes/hr-auth.ts#L385-L395)
- **Defect Description:**
  ```typescript
  // Lines 387-390
  const isValidPin = trimmedPin === "1234" || trimmedPin === "2026" || trimmedPin === "9999" || trimmedPin === "0000";
  ```
  The endpoint accepts static, hardcoded 4-digit PINs (`1234`, `2026`, `9999`, `0000`). This completely defeats the purpose of dual-key authorization, allowing any user or script to authorize financial recalculations, monthly attendance closure, and bank WPS file generation.
- **Verification Method:** Verified by passing `pin: "1234"` and `pin: "9999"` to `POST /api/hr-auth/verify-pin` — both returned HTTP 200 with valid authorization audit stamps without verifying supervisor identity.
- **Remediation:**
  1. Remove hardcoded PIN string comparisons.
  2. Implement configurable supervisor PIN verification via `SUPERVISOR_FINANCIAL_PIN` in environment or verify against the logged-in user's bcrypt password hash.
  3. Enforce that the user calling the endpoint must be actively authenticated (`req.session.userId` or `req.session.hrUserId`).

---

### Finding SEC-02: Missing Brute-Force Rate Limiting & Lockout on PIN Verification
- **Severity:** P0 (High Risk)
- **Affected File:** [`artifacts/api-server/src/routes/hr-auth.ts`](file:///e:/lab/Sunrise-Housing-FULL/final_project/artifacts/api-server/src/routes/hr-auth.ts#L375-L411)
- **Defect Description:**
  The `POST /api/hr-auth/verify-pin` endpoint does not track failed attempts or enforce rate limits. An attacker or unauthorized officer can execute an automated dictionary attack against the 4-digit PIN space (10,000 combinations) in seconds without triggering any lockout or alert.
- **Remediation:**
  Implement in-memory/Redis attempt tracking. If 5 consecutive failed PIN attempts occur within 10 minutes, lock out the session for 15 minutes and log an alert in `hrms_audit_logs`.

---

### Finding SEC-03: Hardcoded Database Connection String Defaults
- **Severity:** P1 (Medium-High Risk)
- **Affected File:** [`lib/db-payroll/src/index.ts`](file:///e:/lab/Sunrise-Housing-FULL/final_project/lib/db-payroll/src/index.ts#L7-L10)
- **Defect Description:**
  The fallback connection string in `lib/db-payroll/src/index.ts` contains a plaintext password (`admin123`):
  ```typescript
  const PAYROLL_DATABASE_URL =
    process.env["PAYROLL_DATABASE_URL"] ??
    "postgresql://postgres:admin123@localhost:5432/sunrise_payroll_attendance";
  ```
- **Remediation:**
  Remove the plaintext password fallback. Require `PAYROLL_DATABASE_URL` to be explicitly provided via environment variables, or fallback to an empty credentials connection string for local development with a warning.

---

### Finding SEC-04: Closed Payroll Periods Recalculation Allowed
- **Severity:** P1 (Business Integrity Risk)
- **Affected File:** [`artifacts/api-server/src/routes/payroll.ts`](file:///e:/lab/Sunrise-Housing-FULL/final_project/artifacts/api-server/src/routes/payroll.ts#L247-L260)
- **Defect Description:**
  `POST /api/payroll/calculate` retrieves the period but does not check `if (period.status === "closed")`. This allows any user with `payroll.create` permission to recalculate and overwrite already finalized and paid salary ledgers.
- **Remediation:**
  Add a strict guard:
  ```typescript
  if (period.status === "closed") {
    return res.status(403).json({
      success: false,
      error: "لا يمكن إعادة احتساب مسير رواتب لفترة مغلقة ونهائية (Cannot recalculate closed payroll period)"
    });
  }
  ```

---

### Finding SEC-05: Missing Export Authorization Guard on Bank WPS
- **Severity:** P1 (Financial Risk)
- **Affected File:** [`artifacts/api-server/src/routes/payroll.ts`](file:///e:/lab/Sunrise-Housing-FULL/final_project/artifacts/api-server/src/routes/payroll.ts#L593-L606)
- **Defect Description:**
  `GET /api/payroll/runs/:id/wps` generates bank transfer files without verifying that the payroll run has been approved (`run.status === 'approved'` or `'closed'`). Draft runs can be exported directly.
- **Remediation:**
  Verify that `run.status` is either `approved` or `closed` before generating electronic payment files.

---

## 2. Verified Data Integrity Strengths

1. **Parameterization:** All queries use Drizzle ORM tagged template literals `sql` or query builders, preventing SQL injection.
2. **Dual-Layer RBAC:** Both backend Express routes and frontend UI elements are gated by permission tokens (`payroll.view`, `payroll.create`, etc.).
3. **Audit Trail:** Critical operations are written to `hrms_audit_logs` with timestamps and entity IDs.
