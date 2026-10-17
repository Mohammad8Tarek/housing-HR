---
name: safe-implementation
description: Guides minimal, backward-compatible code edits with strict zero-breakage and zero-data-loss guarantees.
---

# Safe Feature Implementation Skill

## When to Use
Activate when implementing a new feature, modifying existing components, or altering API routes in the Sunrise ecosystem.

## Procedure
1. **Pre-edit Inspection:** Check `git status -s` and inspect target files before modifying.
2. **Minimal Diff Principle:** Implement the smallest sufficient change without unrelated refactoring.
3. **Dual-Layer Enforcement:**
   - Add `<PermissionGate>` around new interactive UI controls.
   - Add `requirePermission` on corresponding backend API routes.
4. **Bilingual & Responsive UI:**
   - Include Arabic and English labels (`const ar = language === "ar"`).
   - Use `table-fixed` layouts without horizontal scroll.
5. **Post-edit Build Verification:**
   - Run `npm run build` in modified artifacts.
