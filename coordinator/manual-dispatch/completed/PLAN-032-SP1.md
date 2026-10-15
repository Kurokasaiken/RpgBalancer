# Manual Task: PLAN-032-SP1

## Title
Scheda personaggio su /game — hover su pgCard apre `HeroSheetPanel` (HudPlaque singleton)

## Description
Implementare SP-1 di PLAN-032 secondo la spec vincolante
`plans/PLAN-032-SP-1-hero-sheet.md` (artifact r003, sha256
`d1f26a136baa88fcef740800a63bc9b72151ac36bb49d783acd9c709ee762ccf`).

Pezzi:
- `heroSheetViewModel` pura (estratta da `PgDetailCard` — la card lab non si tocca)
- `heroSheetMachine.ts` reducer puro (closed/intending/open, grace = timer
  dentro open, dismissedFor latch, retarget dwell)
- `useHeroSheet` single transition owner (registry `useHudPanels` riflette, mai guida)
- `HeroSheetPanel` `HudPlaque shape="panel"` + `useHudPanelDrag` + `SkinScope`
  + `data-hud-controls`, X + pin toggle + chevron prev/next
- Wiring: pointer events delegati sul rail rosterV2 (relatedTarget containment
  filter), `rosterReconciled` rect-based post-commit, lastPointerRef page-level
- Config `heroSheet` Zod in `gameFrameConfig.ts` (widthPx, railOffsetXPx,
  hoverIntentMs ~350, graceMs ~400, retargetDwellMs ~120, anchorTolerancePx,
  nav keys, z-order)
- Registrazione `useHudPanels` id `heroSheet` + voce menù + shortcut
- i18n `gameFrame.heroSheet.*` en + it; telemetry hero_sheet_open/retarget/close
- A11y WCAG 2.2 AA: role=region, aria-label retarget, live region polite,
  controlli ≥24px, reduced-motion

## Files to Modify
- `src/ui/idleVillage/components/heroSheet/` (nuovo: viewModel, machine, hook, panel)
- `src/pages/game-frame-pixi.tsx` (wiring, anchor, reconcile, config)
- rosterV2 rail container (prop `onResidentPointer` — pgcardKit NON si tocca)
- `src/balancing/config/idleVillage/gameFrameConfig.ts`
- `public/locales/en/idleVillage.json`, `public/locales/it/idleVillage.json`
- test: unit reducer + RTL delegati

## Expected Output
Hover su pgCard (no drag) apre la scheda dopo ~350ms intent; click resta
auto-assegnazione; pannello trascinabile/pinnabile/chiudibile; retarget su
altra card con dwell; Esc latch dismissedFor; nessuna apertura durante drag.
Safeguard: `npm run lint -- <scope>`, `npm run test -- <scope>`,
`npm run build:check`, `npm run kanban:lint`. Verifica a occhio (T-04) in
browser reale + evidence `test-results/plan-032-sp1-<date>.log`.

## Dependencies
none

## Timestamp
2026-10-14

## Executor
manual
