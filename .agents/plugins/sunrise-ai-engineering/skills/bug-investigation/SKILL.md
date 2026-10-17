---
name: bug-investigation
description: Structured root-cause analysis workflow for backend exceptions, frontend render crashes, and database constraints.
---

# Bug Investigation & Root-Cause Analysis Skill

## When to Use
Activate when diagnosing runtime errors, failed SQL queries, unhandled promise rejections, or frontend blank screens.

## Procedure
1. **Reproduce & Capture:**
   - Read server log output or browser console logs.
   - For database errors, check exact SQL parameters and schema constraints using Postgres MCP `query`.
2. **Constraint Verification:**
   - Inspect check constraints: `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'rooms'::regclass;`.
3. **Trace Root Cause:**
   - Check if error is frontend payload mismatch, backend Drizzle schema omission, or database constraint drift.
4. **Targeted Remedy:**
   - Fix in code, Drizzle schema, and idempotent migration scripts simultaneously.
5. **Regression Verification:**
   - Re-run the exact failing scenario and verify HTTP 200 / successful render.
