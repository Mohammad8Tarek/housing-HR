---
name: repo-discovery
description: Rapidly maps and investigates codebase architecture, module dependencies, route registries, and schema structures.
---

# Repository Discovery Skill

## When to Use
Activate when onboarding to a new task, inspecting an unfamiliar module, or locating where a specific business feature is implemented across frontend, backend, or database.

## Procedure
1. Consult the fast lookup CLI: `node scripts/code-lookup.mjs <feature_name>`.
2. Inspect `CODEBASE_MAP.md` for architectural mapping and component directory paths.
3. Review `SYSTEM_DOCUMENTATION.md` for system architecture, tenant schemas, and data flow.
4. Verify active ports and services:
   - API Server: `http://localhost:4000/api`
   - Housing Frontend: `http://localhost:9000/`
   - Employee Portal: `http://localhost:9050/`
   - PostgreSQL: port 5432
