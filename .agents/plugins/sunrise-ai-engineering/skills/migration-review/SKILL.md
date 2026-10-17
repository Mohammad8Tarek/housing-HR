---
name: migration-review
description: Audits PostgreSQL database schema migrations for zero data loss, multi-tenant idempotency, and Drizzle alignment.
---

# Database Migration Review Skill

## When to Use
Activate when adding, updating, or reviewing database columns, constraints, tables, or indexes.

## Procedure
1. **Zero Data Loss Audit:**
   - Scan for forbidden keywords: `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`.
   - Ensure all operations are idempotent (`IF NOT EXISTS`).
2. **Four-Point Alignment Checklist:**
   Whenever modifying a database entity, verify all four locations:
   - Drizzle schema: `lib/db/src/schema/*.ts`
   - API route / service: `artifacts/api-server/src/routes/*.ts`
   - Runtime migration runner: `artifacts/api-server/src/lib/migrations.ts` (`MIGRATIONS` & `TENANT_MIGRATIONS`)
   - Standalone SQL script: `lib/db/src/migrations/20260904_complete_schema_and_constraints.sql`
3. **Execution Verification:**
   - Run `npx tsx src/run-migration.ts` in `lib/db` to verify execution across `public` and all tenant schemas (`taal_housing`, `el_waha_new`, `elwaha_old`).
