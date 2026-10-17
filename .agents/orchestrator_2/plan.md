# Master Orchestration Plan — Comprehensive E2E Testing

## Objective
Execute comprehensive automated end-to-end testing of every interactive element, button, modal dialog, permission check, and business workflow across the Sunrise Staff Housing Management system and the Employee Portal, fulfilling R1-R4 and generating a Full System Health Report.

## Approach & Pattern
Project Orchestrator pattern with Dual Track:
- Track A: E2E Testing Track (test harness, runners, and automated execution scripts)
- Track B: Implementation / Verification Track (validating and asserting zero console errors, zero data loss, bilingual toasts, RBAC gates, and portal flows)

## Step-by-Step Plan

### Phase 0: Survey & Scoping (3 Parallel Explorers)
1. **Explorer 1 (Housing UI & Interactive Elements)**:
   - Catalog all pages, tabs, buttons, modals, dropdowns, filters, and pagination controls in rtifacts/housing/src/pages/.
   - Identify form fields, validation requirements, bilingual toasts, and dialog triggers.
2. **Explorer 2 (Dual-Layer RBAC & API Matrix)**:
   - Inspect all routes in rtifacts/api-server/src/routes/ for equirePermission.
   - Inspect all frontend components for <PermissionGate>.
   - Catalog property schema isolation and single/multi-property data leak boundaries.
3. **Explorer 3 (Employee Portal & Boundary/Edge Cases)**:
   - Catalog all screens, flows, buttons, and state transitions in rtifacts/employee-portal/.
   - Inspect auth guards, request details view, image zoom modal, back navigation, password update.
   - Catalog negative boundary cases, concurrency hazards, and zero-data-loss invariants.

### Phase 1: Feature Inventory & Milestones Decomposition
- Consolidate explorer findings into updated PROJECT.md Feature Inventory.
- Decompose into 4 focused Milestones:
  - M1: Housing Core UI & Button Interaction Suite (R1)
  - M2: Dual-Layer RBAC & Permission Matrix Verification (R2)
  - M3: Employee Portal Comprehensive Flow Testing (R3)
  - M4: Zero-Data-Loss & Negative Boundary Assertions (R4)
- Setup E2E Test Infra track.

### Phase 2: Execution & Sub-Orchestration
- Dispatch Sub-Orchestrators / Test Writers / Workers for each milestone.
- Run automated test scripts exercising UI buttons, API permissions, portal flows, and negative edge cases.
- Capture console logs, HTTP status codes, response times, and DOM coverage.

### Phase 3: Review, Challenge & Forensic Audit
- Independent Reviewers verify test results and assertions.
- Challengers perform adversarial boundary testing.
- Forensic Auditor validates authentic test execution and zero falsification.

### Phase 4: Final Synthesis & Health Report
- Synthesize all findings into the Full System Health Report.
- Verify frontend and API server production builds (
pm run build).
- Deliver final handoff and report to user.
