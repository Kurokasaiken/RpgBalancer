---
type: visual-fork-card
status: ruled
plan: PLAN-110-hud-mockup-to-real-components
desiderata: v35+
---

# Visual Fork Card — HUD Zanara: dai mockup ai componenti reali

Retroattiva (2026-11-03): documenta il fork visivo già avvenuto nelle sessioni
PLAN-109/110/111 — mockup, generazione del kit e componenti reali — perché la
copertura del gate resta verificabile.

## Scope

- Componenti HUD reali dal kit zanara: `src/ui/idleVillage/hudReal/`
  (`HudRealRoster`, `HudRealBrand`, `HudRealBust`, `HudRealCompass`,
  `HudRealGlobe`, `HudRealNav`, `HudRealPanel`, geometrie `*Geometry.ts`).
- Prototipi di laboratorio: `src/ui/idleVillage/zanara/` (`ZanaraRoster`,
  `ZanaraResources`, `ZanaraTooltip`, `zanaraKit`, `zanaraRosterKit`,
  `zanaraRosterState`).
- Superfici di prova: `/hud-compose`, `/hud-real-roster`, `/hud-zanara-roster`,
  `/hud-r1`, `/hud-target` (`src/pages/hud-*.tsx`).

## Opzioni

| id | nome | intento | riferimento |
|----|------|---------|-------------|
| mockup1 | HUD base GPT | baseline materia | `public/hud-target/` |
| zanara-v1 | Zanara nav+cluster | nav, angolo basso-sx | `zanara-v1 2085467d68251258` |
| zanara-v2 | Zanara roster colonna | roster, emblema | `zanara-v2 9eb79d66a4a2f238` |
| zanara-v3 | Zanara risorse+pannello | risorse, dettaglio POI | `zanara-v3 4d214e37aabc5a7f` |
| kit K1–K12 | pezzi in 4 varianti (K9 in 2) | materiali del kit | `.mw/specs/hud-zanara/kit/gen/` |

## Ruling

- 2026-11-02, Director: mockup zanara-v1/v2/v3 scelti come riferimento di layout
  per C1–C6 (tabella in `plans/PLAN-110-hud-mockup-to-real-components.md` §C1–C5);
  `LINGUAGGIO-v1.md` approvato come regola madre.
- 2026-11-02, Director: ruling `zanara-Z1…Z11` registrati in
  `.mw/ui-catalog/ART-DIRECTION.md` (scala slot reali e budget 18%, niente
  edera, roster a colonna, Voce/Amanuense, oro NMM opaco 35–45°, busti solo come
  terminali della barra alta).
- 2026-11-02, Director: varianti del kit scelte sui fogli di confronto;
  le approvate vivono in `.mw/specs/hud-zanara/kit/approved/` (K1–K12).
- 2026-11-03, Director: C1 `HudRealRoster` su pezzi approvati (anello g4,
  placca g4); grade oro/smalto da feedback «oro non brillante, verde non
  abbastanza profondo» (PLAN-110, nota 2026-11-03); riallineamento alle misure
  di zanara-v2 (`align-compare*.png`).

## Evidenza

- Fogli di confronto e varianti: `.mw/specs/hud-zanara/kit/gen/`, `kit/approved/`.
- Catture del componente C1: `.mw/specs/hud-real/C1/component/`
  (`mockup-vs-now.png`, `align-compare.png`, `align-compare-rowmod.png`,
  `grade-compare.png`).
- Verifica headless 1600×900 DPR 2: placca su hover/focus/selezione, scroll,
  nessun testo fuori campo — `scripts/hud-real-g0-probe*.mjs`, report in
  PLAN-110 (nota C1).
