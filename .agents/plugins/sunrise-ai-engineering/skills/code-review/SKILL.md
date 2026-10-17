---
name: code-review
description: Comprehensive checklist and guidelines for peer review and independent diff inspection.
---

# Code Review Skill

## When to Use
Activate when conducting final pre-commit code review on modified files.

## Review Checklist
1. **Scope & Cleanliness:**
   - Are changes strictly relevant to the task?
   - Are there accidental formatting churns or unrelated refactorings?
2. **Rules Adherence:**
   - [ ] Rule 1: Zero Data Loss
   - [ ] Rule 2: Dual-Layer RBAC
   - [ ] Rule 3: Server-side pagination & debounced search
   - [ ] Rule 4: Bilingual RTL/LTR balance without table overflow
   - [ ] Rule 5: Room lifecycle & state synchronization
   - [ ] Rule 6: Cross-property transfers
   - [ ] Rule 7: Egyptian DD/MM/YYYY date formatting
3. **Type Safety & Build:**
   - Does TypeScript compile without errors?
   - Does `npm run build` succeed?
