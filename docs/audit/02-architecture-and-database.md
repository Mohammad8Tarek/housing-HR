# 02 — Architecture and Database Integrity Audit

## 1. Physical and Logical Database Separation

Empirical verification executed via PostgreSQL query on `information_schema.tables`:

### Database 1: `staff-housing`
- **Connection Variable:** `DATABASE_URL`
- **Schemas Identified:**
  - `public`: 69 tables (global users, properties, settings, audits)
  - `taal_housing`: 69 tables (tenant schema for TAAL Resident)
  - `el_waha_new`: 69 tables (tenant schema for El Waha New)
  - `elwaha_old`: 69 tables (tenant schema for El Waha Old)
  - `test`: 69 tables (tenant schema for testing)
  - `drizzle`: 70 migration tracking entries
- **Total Tables in Tenant Schemas:** 345 tenant tables + 69 public tables

### Database 2: `sunrise_payroll_attendance`
- **Connection Variable:** `PAYROLL_DATABASE_URL`
- **Schema Identified:** `public`
- **Total Tables:** Exactly **63 tables** (verified via `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`)

```
Database Isolation Architecture:
+------------------------------------+       +------------------------------------+
|            DATABASE 1              |       |            DATABASE 2              |
|          "staff-housing"           |       |   "sunrise_payroll_attendance"     |
|                                    |       |                                    |
| • public.users                     |       | • public.employees                 |
| • public.properties                |       | • public.payroll_runs              |
| • taal_housing.assignments         |       | • public.salary_slips              |
| • taal_housing.rooms               |       | • public.attendance_records        |
| • el_waha_new.assignments          |       | • public.biometric_devices         |
| • el_waha_new.rooms                |       | • public.legal_entities            |
+------------------------------------+       +------------------------------------+
                  ▲                                             ▲
                  │                                             │
      Connection: DATABASE_URL                     Connection: PAYROLL_DATABASE_URL
      Pool: globalThis.__sunrise_pg_pool__         Pool: payrollPool
                  │                                             │
      [Housing Modules & Routes]                   [HRMS & Payroll Modules & Routes]
```

---

## 2. Integrity & Constraint Verification

1. **Foreign Key Integrity:**
   - In `employees`: Foreign keys to `departments(id)`, `designations(id)`, `sections(id)`, `cost_centers(id)`, `job_grades(id)` use `ON DELETE SET NULL`.
   - In `salary_slips`: References `payroll_runs(id)` and `employees(id)` with `ON DELETE RESTRICT`, preventing accidental cascade deletion of financial records.
2. **Uniqueness Constraints:**
   - `employees(employee_code)` has a strict `UNIQUE` constraint, verified to reject duplicate employee codes with HTTP 409.
   - `holiday_calendars` and `training_courses` enforce uniqueness on code identifiers.
3. **Monetary Precision:**
   - Financial money columns (`base_salary`, `total_gross`, `total_deductions`, `total_net`, `social_insurance_employee`, `income_tax`, `deduction_amount`) are declared as `numeric(12, 2)` or `numeric(14, 2)`.
   - Decimal-safe string conversion is enforced prior to SQL insertion.
4. **Data Loss Invariant:**
   - Zero destructive queries (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`) exist in the codebase.
   - Migrations in `lib/db-payroll/src/migrations/` use `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
