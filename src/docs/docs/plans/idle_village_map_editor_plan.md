# Idle Village Map Editor Plan

**Status:** Draft · **Owner:** Idle Village pod · **Last Updated:** 2025-12-19

## 0. Scope & Guardrails

1. **Config-first:** All map values (layout, slots, tags) must remain in `IdleVillageConfig`; UI reads/writes via `useIdleVillageConfig` only.
2. **Pixel-normalized coordinates:** Activities tab, legacy page, and new map must all share the helpers in `mapLayoutUtils`.
3. **Single source of truth for state:** No ad-hoc React state duplicating config; rely on store updates and derived selectors.

## 1. Objectives

1. Provide a complete editing surface for map layout + slot metadata directly from the Activities tab.
2. Ensure designers can trust placement accuracy (pixel preview == runtime position).
3. Surface slot/activity compatibility and validation warnings inline.
4. Keep resident drag affordances minimal but discoverable.

## 2. Deliverables

- `mapLayoutUtils.ts` (shared clamp/normalization helpers) — already created, referenced here for completeness.
- Updated `IdleVillageActivitiesTab.tsx` with:
  - Editable `mapLayout` inputs (pixel width/height) + validation.
  - Slot inspector panel with numeric X/Y fields (px) + tag/activity compatibility info.
  - Visual warnings when markers fall outside the map or overlap.
- Updated `IdleVillageMapPage.tsx` + `IdleVillagePage.tsx` to consume shared helpers (done, but regressions should be checked when adding validations).
- Optional: documentation snippet in `BALANCING_SYSTEM.md` describing the pixel-normalized workflow.

## 3. Phases

### Phase A — Layout Controls & Persistence (In Progress)
1. Add `mapLayout` info card (read-only summary + edit toggle) in Activities tab.
2. Implement inputs for `pixelWidth`/`pixelHeight` with basic validation (>= 100, <= 4096) and `updateConfig` wiring.
3. Ensure existing map preview re-renders when layout changes.
4. Manual QA: change layout values and verify IdleVillageMapPage markers align.

### Phase B — Slot Inspector Enhancements (Pending)
1. For selected slot, show numeric X/Y (px) inputs with stepper and direct edit.
2. Display accepted `slotTags` and highlight matching activities (list of labels/IDs).
3. Add "Compatible activities" counter + tooltip linking to `activities` list.
4. Provide quick toggle to mark slot as `isInitiallyUnlocked` + icon picker (existing) grouped in inspector.

### Phase C — Validation & Warnings (Pending)
1. Visual overlays for out-of-bounds slots (turn marker red + banner).
2. Optional snapping when dragging near bounds.
3. Warning badge when two slots are within N pixels of each other (threshold configurable in file-level constant).
4. Update docs with troubleshooting tips + mention shared helper usage.

### Phase D — Resident Drag UX Polish (Completed)
1. Confirm single-icon drag ghost è consistente tra IdleVillageMapPage e legacy IdleVillagePage.
2. Aggiungere halo "Drop Resident" durante il drag.
3. Resettare stato drag se `mapLayout` cambia.

### Phase E — Drag → Scheduling Reale (In Progress)
1. Esporre roster residenti (mini stack o picker) per selezionare chi trascinare.
2. Validare il drop rispetto ai `slotTags` e stato del resident (fatigue, availability).
3. Collegare `handleDropResident` a `scheduleActivity` generando effettivamente una nuova card nel cluster.
4. Mostrare feedback (“Assigned to X”) e aggiornare `villageState` locale.

### Phase F — Passive/Hunger Overview (Pending)
1. Badge riassuntivi per fame, manutenzione ferite e risorse principali.
2. Evidenziare effetti passivi attivi direttamente sulla mappa (overlay).

### Phase G — Completion Feedback (Pending)
1. Animazione/halo quando una card termina + liberazione residenti visibile.
2. Toast o log sintetico con risorse guadagnate.

### Phase H — Blueprint & Quest Interactivity (Pending)
1. Rendere cliccabili i blueprint per aprire un drawer e schedulare manualmente.
2. Consentire accettazione quest/offerte direttamente dal cluster VerbCard.

## 4. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Layout edits break persisted configs | Validate values + clamp ranges before saving. |
| Slot compatibility list becomes heavy | Memoize derived lists and paginate if needed. |
| Visual overlaps hard to detect | Provide numeric readouts and highlight conflicting IDs in inspector. |

## 5. Tracking

- **Phase A:** starting now (current session)
- **Phase B-D:** pending after layout controls land
