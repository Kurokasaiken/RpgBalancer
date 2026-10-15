# Manual Task: PLAN-032-SP5

## Title
Level-up eroe (presentazione mock) — PLAN-032 SP-5

## Description
Implementare SP-5 di PLAN-032 secondo la spec vincolante
`plans/PLAN-032-SP-5-hero-levelup.md` (artifact r009, sha256
`3d8d1cca68d8f42db167ca25be39e15f81c0b1503b4986777b90b8fd74706845`).

Badge "Lv N" su pgCard, SlottedMedal ring (resting lit + ignition pulse keyed
per eventId), cue `level_up`, floater "Livello N" — tutto mock config
`heroLevelConfig.ts`, nessun sistema progressione reale (PROGRESSION.md resta
draft, MissingHub `levelUp` resta `missing`).

Command `runHeroLevelUpStaging`: reject su config invalida/target non-hero,
reject no-op su zero eligible (card montata), accept → N eventi
`hero_levelup_mock` (eventId `<seq>:<idx>`), 1 telemetry `feature_action`,
1 audio cue. Decorative layer in rosterV2, pgcardKit intoccato.

## Constraints
- Config Zod con parse two-layer (dev throw / prod field-level salvage).
- Floater text-variant del DamageFloater (stesso modulo/ciclo vita), supersede
  per eventId, mai merge.
- i18n `gameFrame.heroLevel.*` en + it-IT.
- STRICT_FILES guard + evidence log `test-results/PLAN-032-SP5-2026-10-14.log`.

## Acceptance
- Tutti gli outcome del command coperti da test.
- Badge/ring/floater verificati a runtime headed su `/game` via Director
  "Level up", eye-check T-04.
- Bundle di verifica PASS prima di marcare `fatta`.

## Esito
Completato 2026-10-14 — bundle PASS `.mw/runs/plan032-sp5-2026-10-14/bundle.json`
(4/4 obbligazioni). Evidence `test-results/PLAN-032-SP5-2026-10-14.log` +
smoke headed `test-results/plan-032-sp5-smoke-2026-10-14/`.

Implementato:
- `heroLevelConfig.ts` (Zod strict + salvage field-level prod, dev throw;
  gate `import.meta.env?.PROD` robusto fuori da Vite)
- `heroLevelViewModel` / `heroLevelUpEvents` / `mountedCardRegistry` /
  `runHeroLevelUpStaging` / `heroLevelCue` in `rosterV2/`
- `HeroLevelDecor` (badge ancorato a `data-wanderlust-portrait`, ring resting,
  ignition keyed eventId, TextFloater portal su body — mai clippato)
- `TextFloater` + `prefersReducedMotion` in `skins/primitives/cinemaFx.tsx`
- Director action `levelup` in `game-frame-pixi.tsx`
- i18n `gameFrame.heroLevel.*` en+it — **sintassi ICU `{n}`** (la spec diceva
  `{{n}}` che renderizza letterale sotto i18next-icu; divergenza documentata)
- 18 test dedicati + 54 adiacenti verdi; STRICT_FILES += HeroLevelDecor
