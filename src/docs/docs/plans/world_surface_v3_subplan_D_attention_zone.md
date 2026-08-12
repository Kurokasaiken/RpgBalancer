---
title: World Surface V3 — Sub-plan D — AttentionZone Resolver
status: Draft
parent_plan: world_surface_v3_tactical_plan.md
node: D
classification: sub-plan
execution_hint: verified
created: 2026-08-13
---

# Sub-plan D — AttentionZone Resolver

## Classificazione e giustificazione

`sub-plan`. State machine, spatial indexing (QuadTree), coordinate space sotto pan/zoom, persistence, risoluzione overlap e demo: più decisioni architetturali e più file con dipendenze non ovvie.

## Intent

Implementare il resolver AttentionZone: state machine `UNSEEN → ELIGIBLE → ATTENDING → OBSERVED → COOLDOWN → LOCKED`, trigger `camera-enter` (principale) + `pointer-dwell` (secondario, 1200ms, tolleranza Δ15px), QuadTree per la risoluzione spaziale solo al cambio camera/viewport, overlap resolution "smallest wins with floor priority", e hook `useAttentionZone.ts` che aggiorna React solo ai cambi di stato.

## Acceptance

- RTL test: dwell completo emette `zone_observed`; `pointerleave`, drag, pan/zoom, modal, `visibilitychange` cancellano; zone sovrapposte → una sola attiva (priority, poi area minore, poi ID); zone non-vincitrici in `suppressed` rivalutate ogni 250ms.
- Persistence: `worldSurface.attentionZone.visited.${zoneId}` (boolean, no TTL) e `worldSurface.attentionZone.lastVisited.${zoneId}` (timestamp, per `revisit`) via `PersistenceService`.
- Demo su `/world-surface-v3`: almeno `village_market_01` (pointer-dwell → `merchant_idle_whisper`) funzionante.
- Il 99% dei tick non produce re-render React (test no-rerender).
- `world-state` non scatta con Tier 3 attivo.
- `npm run build:check` verde.

## Invariants (RPG)

- Persistence solo via `@/shared/persistence/PersistenceService` (mai `localStorage` diretto).
- i18n: ogni reazione con testo ha `labelKey` in namespace `idleVillage`.
- No `Date.now()`: dwell/cooldown su `WorldClock` (sub-plan B).
- React non re-renderizza a 60 FPS: stato interno in ref/store, update solo su transizione.
- Component reuse: hitbox come overlay DOM semantico, non nuovo componente grafico.

## Constraints

- Solo le 8 zone minime del piano tattico §9; `observation-chain` deferito a V4.
- Cooldown in-memory per sessione; solo `enter`/`revisit` persistiti.
- Coordinate canoniche `world_pixels`; conversioni zoom/pan centralizzate.
- `i18n.hasLoadedNamespace('idleVillage')` richiesto prima di montare l'hook.

## Approach notes

- QuadTree costruito una volta dalla config, interrogato su `viewportchange`, non in polling.
- `pointerenter/leave` su hitbox DOM accessibile (ARIA) per accessibilità tastiera/controller (`focus-dwell`).
- Stato condiviso: valutare Zustand vs Context secondo invariant (stato di dominio → Zustand).

## File targets

- `src/ui/idleVillage/worldSurface/hooks/useAttentionZone.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/utils/attentionZoneResolver.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/config/attentionZoneConfig.ts` (da sub-plan A)
- `src/ui/idleVillage/worldSurface/layers/WorldLayer.tsx` (montare hitbox)
- `tests/unit/idleVillage/WorldSurfaceV3Attention.test.tsx` (nuovo)

## Dependencies

- Sub-plan A (schema `AttentionZone`, enum biomi, `reactionId`).
- Sub-plan B (`WorldClock` per dwell/cooldown).

## Safeguards

```bash
npm run lint -- src/ui/idleVillage/worldSurface tests/unit/idleVillage/WorldSurfaceV3Attention.test.tsx
npm run test -- WorldSurfaceV3Attention
npm run build:check
npm run kanban:lint
```

## Open questions

- Trigger principale definitivo: `camera-enter`, `pointer-dwell` o combinazione (decidere dopo test UX sulla demo).
- Forma esatta delle chiavi persistence se il run ha un `runId`: aggiungere segmento `runId`?
