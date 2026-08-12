---
title: World Surface V3 — Sub-plan F — Wonder Spawner + Object Pool
status: Draft
parent_plan: world_surface_v3_tactical_plan.md
node: F
classification: sub-plan
execution_hint: verified
created: 2026-08-13
---

# Sub-plan F — Wonder Spawner + Object Pool

## Classificazione e giustificazione

`sub-plan`. Tocca Pixi object pool, texture lifecycle, seeded RNG, eligibility multipla, integrazione con budget e UI. Decisioni architetturali su gestione texture e allocazioni.

## Intent

Implementare `wonderSpawner.ts` con: object pool per Pixi sprites (non allocazione/distruzione continua), seeded `Mulberry32` per determinismo, texture warmup (caricamento 30s prima dello spawn effettivo), release texture 10s dopo fine animazione con `texture.destroy(true)`, eligibility (`mustBeInViewport`, no Tier 3 attivo, no heavy effect attivo, bioma visibile), e una sola wonder visibile alla volta. Aggiornare `useWonderSystem.ts` / `WonderLayer.tsx`.

## Acceptance

- Test unitari: stesso `runId:dayIndex:biomeId` produce stessa selezione; spawn oltre rate limit blocca; wonder non spawna fuori viewport; wonder non spawna durante Tier 3 o heavy effect; bioma invisibile escluso.
- Test object pool: una stessa `Sprite` (pool) viene riutilizzata per più spawn dello stesso tipo; nessuna `Texture` allocata oltre quella prescelta; `texture.destroy(true)` chiamata dopo il release.
- GC test: 100 spawn consecutivi dello stesso tipo non allocano nuovi sprite Pixi.
- Demo: almeno una wonder casuale appare su `/world-surface-v3` entro i test.
- `npm run build:check` verde.

## Invariants (RPG)

- No `Date.now()`: tutti i timestamp da `WorldClock` (sub-plan B).
- Seeded RNG per replay deterministici.
- Texture lifecycle esplicito (warmup/destroy); niente leak WebGL.
- Telemetry con schema tipizzato: `wonder_spotted`.
- Wonder visuale, nessun impatto gameplay.
- Component reuse: `WonderLayer` riusa primitive Pixi dove possibile.

## Constraints

- Catalogo V0 del piano tattico §12 (8 wonders); catalogo esteso V4.
- Una wonder visibile alla volta; durata 2–20s.
- Texture warmup: non caricare tutte le texture all'avvio.
- `wonder.meteor_shower` (visuale) e `worldEvent.meteor_impact` (Tier 3) separate.

## Approach notes

- Pool keyed by `WonderType` con `Sprite[]`; `acquire` setta `visible=true`, `alpha` animato; `release` setta `visible=false`, `alpha=0`.
- `EffectAdmissionController` (sub-plan C) controlla heavy effect; `EventSeverity` (sub-plan E) segnala Tier 3 attivo.
- `WorldSurfaceV3Page` fornisce viewport/biome correnti.

## File targets

- `src/ui/idleVillage/worldSurface/utils/wonderSpawner.ts` (riscrittura)
- `src/ui/idleVillage/worldSurface/hooks/useWonderSystem.ts` (integrare pool)
- `src/ui/idleVillage/worldSurface/layers/WonderLayer.tsx` (nuovo o consolidare)
- `tests/unit/idleVillage/WorldSurfaceV3Wonders.test.tsx` (estendere)

## Dependencies

- Sub-plan A (schema Wonder, biomi, heavy effect schema).
- Sub-plan B (`WorldClock`, seed giorno).
- Sub-plan C (`EffectAdmissionController`).
- Sub-plan E (Tier 3 attivo).

## Safeguards

```bash
npm run lint -- src/ui/idleVillage/worldSurface tests/unit/idleVillage/WorldSurfaceV3Wonders.test.tsx
npm run test -- WorldSurfaceV3Wonders
npm run build:check
npm run kanban:lint
```

## Open questions

- Le texture delle wonders dove vivono (public/assets/...)? Path da configurare ora o lasciare stub?
- Kraken o altre wonders che sono anche eventi Tier 0: come evitare collisione visiva con `EventLayer`?
