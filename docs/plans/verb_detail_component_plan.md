# Verb Detail Component – Implementation Plan

## Objective
Deliver a VerbCard + VerbDetailCard experience inside the Verb Detail Sandbox that mirrors the production Idle Village behavior:
- Config-first data (activities, slots, residents, stat requirements).
- Stat matching powered by `evaluateStatRequirement`/`getResidentStatTags`.
- VerbCard UI limited to essential info (shape, progress, risk) with accurate ARIA/tooltip wiring.
- Shared run state (progress timer, risk preview, resource deltas) consistent with Idle Village.

## Constraints & Principles
1. **Config-driven**: No inline mock stats or residents. Read from `IdleVillageConfig` or a test harness derived from it.
2. **Stat requirements**: Slots consume `StatRequirement` definitions (allOf/anyOf/noneOf). Drops must leverage `statMatching.ts` helpers.
3. **UI parity**: VerbCard/VerbDetailCard props must match those used in IdleVillagePage (tone, tooltip, progress ring, drop feedback).
4. **Minimal noise**: Remove legacy mock text/notes that are not part of the product spec.
5. **Testability**: Sandbox should act as a thin harness so designers/devs can validate the Verb flow without touching the live village state.

## Work Breakdown
1. **Data Wiring**
   - Create a lightweight provider/hook that returns a sample `IdleVillageConfig` activity + residents pulled from config/presets.
   - Replace `mockActivity`, `mockResidents`, `residentStatTags`, `SLOT_BLUEPRINT` with the provider outputs.

2. **Stat Matching Integration**
   - Replace `requiredStatId` checks with `evaluateStatRequirement` results per slot.
   - Surface the missing/allOf/blocked feedback for invalid drops (optional highlight in UI).

3. **VerbCard/VerbDetailCard Props Cleanup**
   - Feed real `slotRequirementLabel`, `assignedLabel`, risk %, rewards labels computed from config.
   - Ensure ARIA roles, tooltip content, and `isInteractive` behavior match the latest VerbCard spec.
   - Remove placeholder copy (“mock preview”, etc.).

4. **Run State + Effects**
   - Mirror Idle Village timers: start on satisfied assignment, show progress ring + countdown.
   - Optionally hook into resource delta animation helpers if available; otherwise stub a config-based preview.

5. **Verification & Docs**
   - Manually exercise drag/drop and timers in the sandbox.
   - Log any remaining deltas vs. production behavior back into `docs/WHATS_MISSING.md`.

## Milestones
| Milestone | Deliverable |
| --- | --- |
| M1 | Data provider returns config-based activity + residents |
| M2 | DnD drop validation uses `statMatching.ts` |
| M3 | VerbCard displays spec-compliant UI |
| M4 | VerbDetail card + timers mirror production flow |
| M5 | Sandbox tested & notes updated |

## Open Questions
- Should the sandbox mutate shared IdleVillage state or operate on isolated copies? (default: isolated copies seeded from config.)
- Do we need to visualize hunger/injury auto-verbs here, or only quest/job verbs?

Document owner: Cascade assistant. Last updated: 2025-12-15.
