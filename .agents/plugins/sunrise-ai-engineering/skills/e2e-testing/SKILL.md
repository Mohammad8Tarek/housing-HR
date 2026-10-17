---
name: e2e-testing
description: Playwright and Puppeteer end-to-end browser automation and API integration testing runbook.
---

# End-to-End & Browser Testing Skill

## When to Use
Activate when validating end-to-end user workflows, testing authentication, permission gates, or verifying complex multi-step UI flows.

## Procedure
1. **Ensure Services are Live:**
   - Backend API: port 4000
   - Housing Frontend: port 9000
   - Employee Portal: port 9050
2. **Execute Automated Test Scripts:**
   - Run `node tests/phase1-db-integrity.mjs`
   - Run `node tests/phase2-auth-rbac.mjs`
   - Run `node tests/phase3-core-api.mjs`
3. **Browser Automation via Puppeteer / Playwright:**
   - Use Puppeteer MCP `puppeteer_navigate` to open `http://localhost:9000/`.
   - Use `puppeteer_evaluate` to verify DOM elements and state.
   - Use `puppeteer_screenshot` on failures to capture visual evidence.
4. **Verification Report:**
   - Log exit codes, response times, and pass/fail counts.
