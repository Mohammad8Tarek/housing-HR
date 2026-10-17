---
name: security-review
description: Audits Dual-Layer RBAC compliance, secret leakage, SQL injection prevention, and authentication safety.
---

# Security Review Skill

## When to Use
Activate before merging any code changes, creating new routes, or reviewing authorization mechanisms.

## Procedure
1. **RBAC Dual-Layer Verification:**
   - Every Express route in `artifacts/api-server/src/routes/` must invoke `requirePermission` or `requireSuperAdmin`.
   - Every UI mutation button or sensitive view must be wrapped with `<PermissionGate>`.
2. **Secret Scanning:**
   - Verify no hardcoded passwords, JWT secrets, or DB connection strings are committed in code.
   - All secrets must use `process.env`.
3. **Multi-Tenant Leakage Check:**
   - Verify that non-admin queries always scope to the authenticated property using `withTenant`.
4. **Input Validation:**
   - Verify Zod schema validation on all request bodies.
