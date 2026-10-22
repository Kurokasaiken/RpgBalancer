---
id: drop-feedback-ui
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/DropFeedbackUI.tsx
scope_files:
  - src/ui/idleVillage/ai/aiTutorMode.ts
  - src/ui/idleVillage/ai/dropSuggestionEngine.ts
  - src/ui/idleVillage/components/DropFeedbackUI.tsx
  - src/ui/idleVillage/hooks/useAITutor.ts
  - src/ui/idleVillage/hooks/useDropFeedback.ts
  - src/ui/idleVillage/hooks/useMinimalHUD.ts
  - src/ui/idleVillage/hooks/useResidentDropValidation.ts
fast_checks:
  - tests/unit/idleVillage/dragDropStressTest.test.ts
  - tests/unit/idleVillage/dropAISuggestions.test.tsx
  - tests/unit/idleVillage/useDropFeedback.test.tsx
  - tests/unit/idleVillage/useResidentDropValidation.test.tsx
e2e_checks: []
e2e_trigger_globs: []
invariants: []
---

# drop-feedback-ui

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/DropFeedbackUI.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/components/DropFeedbackUI.tsx`.

## Scope

- `src/ui/idleVillage/ai/aiTutorMode.ts`
- `src/ui/idleVillage/ai/dropSuggestionEngine.ts`
- `src/ui/idleVillage/components/DropFeedbackUI.tsx`
- `src/ui/idleVillage/hooks/useAITutor.ts`
- `src/ui/idleVillage/hooks/useDropFeedback.ts`
- `src/ui/idleVillage/hooks/useMinimalHUD.ts`
- `src/ui/idleVillage/hooks/useResidentDropValidation.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
