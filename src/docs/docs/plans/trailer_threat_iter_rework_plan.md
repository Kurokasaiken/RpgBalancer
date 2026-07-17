# TrailerThreatIter V2 — Visual Rework Plan

> **Task ID:** TRAILER-THREAT-ITER-V2  
> **Scope:** Trailer-only marketing asset (`/trailer-threat-iter`)  
> **Status:** draft  
> **Owner:** Strategist → Coordinator → Execution Agent  
> **Plan Reference:** trailer_v9_skin_alignment_plan.md, trailer_vertical_slice_implementation_plan.md  
> **Visual References:** /visual-fidelity-lab, /minimal-poi, /poi-detail-verification  

---

## 1. User Clarifications (source of truth)

| # | Question | Answer |
| --- | ---------- | -------- |
| 1 | Map asset | Use `map.jpg` from repo root. |
| 2 | Base teal aesthetic | From **Visual Fidelity Lab** (`/visual-fidelity-lab`): obsidian base `#060f16` with an azure/cyan radial light leak from the top, as seen in `ForgottenObservatory.tsx` (`radial-gradient(circle at 50% -10%, rgba(0,229,255,0.12) 0%, ...)`). |
| 3 | POI detail as title/timer base | Yes. Create a **copy/fork** of the POI detail component (`ActivityCapsuleDetailSkinAware` from `/poi-detail-verification`) to use as the central title/timer panel, so it can be modified freely without breaking the rest of the project. |
| 4 | POI nodes | Use the **Minimal POI** components already visible on `/minimal-poi`: `GenericPoiSkin` (or `QuestPOI`/`ActivityPOI` if typed states are needed), imported from `@/ui/idleVillage/frozen/kits/poiKit`. |
| 5 | Route | `/trailer-threat-iter` remains unchanged. |

---

## 2. Objective

Rewrite `src/ui/idleVillage/trailer/TrailerThreatIter.tsx` so the Threat scene is visually faithful to:

- **Visual Fidelity Lab** teal/obsidian base (`/visual-fidelity-lab`),
- **Minimal POI** medallion style (`/minimal-poi`),
- **POI Detail** title/timer panel (`/poi-detail-verification`),
- `map.jpg` as the map background.

The result must be a static (no gameplay logic, no new animations/particles), recordable marketing asset. It must reuse existing frozen kit components, not recreate them.

---

## 3. Visual References

### 3.1 Teal base (Visual Fidelity Lab)

From `src/ui/visualFidelityLab/ForgottenObservatory.tsx`:

```tsx
background: [
  'radial-gradient(circle at 50% -10%, rgba(0,229,255,0.12) 0%, rgba(0,150,255,0.03) 50%, transparent 80%)',
  '#060f16',
].join(', '),
boxShadow: 'inset 0 0 60px rgba(2,6,10,0.8)',
```

Use the same `WanderlustSurface` + `WanderlustAmbientField` grammar and `--skin-*` tokens.  
Foundation constants are in `src/ui/visualFidelityLab/foundationRecipe.ts`.

### 3.2 POI nodes (Minimal POI)

Use `GenericPoiSkin` from `src/ui/idleVillage/components/minimal/GenericPoiSkin.tsx` (re-exported by `@/ui/idleVillage/frozen/kits/poiKit`).  
Props to use: `icon`, `label`, `progress`, `size`, `pillar`, `dangerRating`, `showRiskBadges`, `enableHover`.  
For the threat scene, `enableHover` should be `false` and `showRiskBadges` can remain `false`.

### 3.3 Title/timer panel (POI Detail)

The POI detail component used by `/poi-detail-verification` is `ActivityCapsuleDetailSkinAware` in `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx`.  
Create a local fork `TrailerThreatDetailPanel.tsx` under `src/ui/idleVillage/trailer/` that borrows its frame, header, typography, and `GenericPoiSkin` mirror, but only renders title, subtitle, plaque, and a timer row.

---

## 4. Implementation Scope

### 4.1 Files to create

1. `src/ui/idleVillage/trailer/TrailerThreatDetailPanel.tsx`  
   - Fork of `ActivityCapsuleDetailSkinAware` (or `WanderlustSurface` + `InsetPanel` composition if the fork is too heavy).  
   - Accept `title`, `subtitle`, `plaque`, `timeRemaining` props.  
   - Keep `WanderlustSurface` frame, bronze material, VFL teal well background.  
   - Render a `GenericPoiSkin` mirror for the icon/crest.  
   - Keep the timer as a Whisper inset panel (`InsetPanelDelicate`) with old-gold heraldic text and strong shadows.

2. `src/ui/idleVillage/trailer/TrailerThreatPoiMarker.tsx` (optional thin wrapper)  
   - Wraps `GenericPoiSkin` with absolute positioning and config-driven size.  
   - Maps `trailerConfig.threat.pois` entries to `GenericPoiSkin` props.

### 4.2 Files to modify

1. `src/ui/idleVillage/trailer/TrailerThreatIter.tsx`  
   - Replace previous `BronzeMedalNode` and `MatericPlate` imports.  
   - Replace background image with `map.jpg`.  
   - Apply VFL teal/obsidian base overlay.  
   - Render POI nodes with `GenericPoiSkin` from the POI kit.  
   - Render title/timer through `TrailerThreatDetailPanel`.  
   - Keep route and timing logic intact.

2. `src/balancing/config/idleVillage/trailerConfig.ts`  
   - Add `threat.mapImage: '/map.jpg'` or `/assets/map.jpg` once asset location is finalized.  
   - Optionally add `threat.baseTealOverlay` tokens for the VFL aesthetic if they need to be tunable.

3. `public/map.jpg` or `public/assets/map.jpg`  
   - Ensure `map.jpg` from repo root is available to the dev server. If it is not in `public/`, copy or symlink it there.

### 4.3 Files NOT to modify

- Do NOT modify `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx`.  
- Do NOT modify `GenericPoiSkin` or `poiKit`.  
- Do NOT change the route in `src/App.tsx`.  
- Do NOT create standalone `.css` files; use existing skin variables and inline styles for trailer-only assets.

---

## 5. Guardrails & Invariants

`@trailer-only` convention applies:

- **EXEMPT:** Persistence, i18n copy, telemetry, gameplay state mutation. Hardcoded trailer copy is allowed.
- **MUST PRESERVE:**
  - Config-first: timings, copy, POI positions, sizes, and palette go through `trailerConfig.ts`.
  - Component reuse: use `GenericPoiSkin` and `WanderlustSurface`/`WanderlustAmbientField` from existing frozen/primitive layers.
  - No standalone `.css` files for theming.
  - State management: React Context or local `useState` only; no new Zustand stores.
  - JSDoc on all new functions/interfaces.
  - Route `/trailer-threat-iter` unchanged.

---

## 6. Success Criteria

- `/trailer-threat-iter` renders without runtime errors.
- Background uses `map.jpg`.
- Base has the VFL teal/obsidian aesthetic.
- POI nodes are `GenericPoiSkin` (or typed POI kit variants) from `/minimal-poi`, not custom bronze medals.
- Central title/timer is a copied/adapted POI detail panel from `/poi-detail-verification`, with old-gold heraldic text and strong weighted shadows.
- Route remains `/trailer-threat-iter`.
- `npm run lint -- src/ui/idleVillage/trailer/` passes (warnings acceptable, 0 errors).
- `npm run build:check` passes.
- `npm run kanban:lint` passes.

---

## 7. Safeguards

| Command | Scope | Timeout |
| --- | --- | --- |
| `npm run lint -- src/ui/idleVillage/trailer/` | Trailer directory only | 120s |
| `npm run build:check` | Full TypeScript check | 180s |
| `npm run kanban:lint` | Kanban validation | 30s |

Evidence log: `test-results/trailer-threat-iter-v2-<YYYY-MM-DD>.log`

---

## 8. Documentation Updates

1. Update this plan (`docs/plans/trailer_threat_iter_rework_plan.md`) with final decisions and asset paths before marking complete.
2. Update `docs/plans/trailer_v9_skin_alignment_plan.md` changelog if this work advances Phase 2.
3. No COMPONENT_MASTER_INDEX updates required (trailer-only, no trusted/frozen component changes).

---

## 9. Final Decisions & Asset Paths

Implemented on 2026-07-17 by Cascade:

- **Map asset:** `public/map.jpg` copied from repo root; served at `/map.jpg`.
- **Config tokens:** `trailerConfig.threat.mapImage`, `trailerConfig.threat.baseTealOverlay`, `trailerConfig.threat.eventTitle`, `trailerConfig.threat.eventPlaque`.
- **POI nodes:** `GenericPoiSkin` from `@/ui/idleVillage/frozen/kits/poiKit`, `size={72}`, `pillar="wilderness"`, `enableHover={false}`.
- **Detail panel:** `TrailerThreatDetailPanel.tsx` created as a reduced fork using `WanderlustSurface` (bronze), `WanderlustAmbientField`, and `InsetPanelDelicate`.
- **VFL base:** `#060f16` obsidian + radial azure light leak from top, box-shadow inset.
- **Route:** `/trailer-threat-iter` unchanged.

Safeguards passed: lint, build:check, kanban:lint, smoke test (200, no console errors).
Evidence: `test-results/trailer-threat-iter-v2-2026-07-17.log`.

---

## 10. Handoff to Coordinator

Insert `TRAILER-THREAT-ITER-V2` into `src/docs/docs/coordinator/agent_assignments.md` as a new `Non assegnato` row, with this plan linked and the full prompt in the Note/Prompt column.  
Assign to an execution agent with `idle-village-task` skill and `@trailer-only` exemption.
