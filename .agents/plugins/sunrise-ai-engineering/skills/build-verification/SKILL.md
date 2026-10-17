---
name: build-verification
description: Verifies production compilation, bundling, and type checking across all frontend and backend workspaces.
---

# Build Verification Skill

## When to Use
Activate before finishing any coding task or committing changes.

## Verification Commands
```bash
# 1. Housing Admin Frontend Build
cd artifacts/housing
npm run build

# 2. API Server Build
cd ../api-server
npm run build

# 3. Employee Portal Build
cd ../employee-portal
npm run build

# 4. Database Migrations Idempotency
cd ../../lib/db
$env:DATABASE_URL="postgresql://postgres:admin123@localhost:5432/staff-housing"
npx tsx src/run-migration.ts
```

All commands must complete with exit code 0.
