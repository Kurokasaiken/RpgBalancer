---
title: World Surface V3 — Sub-plan A.3 — Registry e migrazione consumer (v2)
status: Draft
version: 2
parent_plan: world_surface_v3_tactical_plan.md
node: A.3
classification: sub-plan
execution_hint: verified
created: 2026-08-13
revised: 2026-08-13
---

# Sub-plan A.3 — Registry e migrazione consumer (v2)

## Classificazione e giustificazione

`sub-plan`. Chiude il flusso authored-to-runtime: costruisce il registry read-only dalla config normalizzata e migra i consumer elencati in `CONSUMER_AUDIT.md`. È eseguibile perché A.2 congela il contratto e A.1 congela la lista dei consumer.

## Intent

1. Implementare `createWorldSurfaceV3Registry(normalizedConfig)` in `src/ui/idleVillage/worldSurface/utils/worldSurfaceRegistry.ts`.
2. Implementare `WorldSurfaceV3Provider` + `useWorldSurfaceRegistry()` in `src/ui/idleVillage/worldSurface/hooks/useWorldSurfaceRegistry.ts`.
3. Rimuovere `useWorldSurfaceState.ts`.
4. Migrare ogni consumer di `CONSUMER_AUDIT.md` con disposizione `adapt`.
5. Produrre `CONSUMER_MIGRATION.md` con matrice before/after/test per ogni consumer.

## Registry ownership e lifecycle (congelati in v2)

- **Ownership:** `WorldSurfaceV3Page.tsx` crea il registry al mount con `useMemo(...)` e lo passa a `WorldSurfaceV3Provider`.
- **Propagazione:** `WorldSurfaceV3Provider` (React Context) rende il registry disponibile ai discendenti.
- **Durata:** il registry vive fino all'unmount della pagina. Config statica per istanza; nessun hot-reload in V3.
- **Accesso:** i consumer usano `useWorldSurfaceRegistry()`. Non importano preset o config locali.
- **Purity:** `createWorldSurfaceV3Registry` è pura, sincrona, non-validante, non-mergeante.

## Public API del registry (congelata in v2)

```ts
interface WorldSurfaceV3Registry {
  readonly config: Readonly<WorldSurfaceV3Config>;

  getReaction(id: EntityId): Reaction | undefined;
  hasReaction(id: EntityId): boolean;
  getZone(id: EntityId): AttentionZone | undefined;
  hasZone(id: EntityId): boolean;
  getEventSeverity(id: EntityId): EventSeverity | undefined;
  hasEventSeverity(id: EntityId): boolean;
  getWonder(id: EntityId): Wonder | undefined;
  hasWonder(id: EntityId): boolean;
  getBiome(id: BiomeId): Biome | undefined;
  hasBiome(id: BiomeId): boolean;

  // esposte per consumer che iterano (es. WorldAttentionDirector)
  readonly reactionsById: ReadonlyMap<EntityId, Reaction>;
  readonly zonesById: ReadonlyMap<EntityId, AttentionZone>;
  readonly eventSeveritiesById: ReadonlyMap<EntityId, EventSeverity>;
  readonly wondersById: ReadonlyMap<EntityId, Wonder>;
  readonly biomesById: ReadonlyMap<BiomeId, Biome>;
}
```

- I valori sono già immutabili perché `normalizeWorldSurfaceV3Config` chiama `deepFreeze`.
- Le mappe interne sono `Map`; vengono `Object.freeze` insieme al registry.
- `getX`/`hasX` sono il primary API; le `ReadonlyMap` sono esposte per iterazione e debug.

## Acceptance

- `createWorldSurfaceV3Registry(config)` accetta solo `WorldSurfaceV3Config` normalizzata; rifiuta input non normalizzati a compile-time (tipo) e a runtime (asserzione `Object.isFrozen` oppure brand type).
- Espone `getX`/`hasX` per tutte le cinque collection e le mappe `ReadonlyMap`.
- `Object.isFrozen(registry)` e `Object.isFrozen(registry.reactionsById)` sono `true`.
- `useWorldSurfaceRegistry()` restituisce il registry dal Context; fallisce se chiamato fuori provider.
- `useWorldSurfaceState` viene rimosso; nessun altro hook lo importa.
- `CONSUMER_MIGRATION.md` elenca per ogni consumer: sorgente attuale, sorgente nuova, API registry, stato (`migrated`/`compat`/`removed`), test di verifica.
- Ogni consumer in `CONSUMER_AUDIT.md` con disposizione `adapt` è migrato.
- Test di integrazione: fragments → compose → validate → normalize → registry → `WorldSurfaceV3Page` render.
- Test di behavioral parity per: `WorldLayer` opacity, `BreathLayer` opacity, `ParallaxController` offset, `EventLayer` fase, `WonderLayer` tipo.
- `npm run build:check` verde.

## Invariants (RPG)

- Registry read-only: nessuna mutazione esposta; valori e mappe frozen.
- I consumer non importano preset o schemi locali; usano `useWorldSurfaceRegistry`.
- `world_pixels/top_left` implementato in ogni layer che usa coordinate (inizialmente `ParallaxController`, `WonderLayer`, `EventLayer`, `UnderwaterLayer`).
- i18n: chiavi `labelKey` risolte via `useTranslation` nel layer, non nel registry.
- Nessun `Date.now()` nel registry; i consumer che usano tempo dipendono da `WorldClock` (sub-plan B).

## Constraints

- `worldSurfaceRegistry.ts` è puro data: **non** importa React, Zustand, i18n, Pixi, `useTranslation`, `Date.now`.
- `useWorldSurfaceRegistry.ts` può importare React per Context.
- Nessun `compat-adapter` a meno di approvazione esplicita in `CONSUMER_MIGRATION.md`.
- La logica di business (spawn, event FSM, etc.) resta nei rispettivi hook/utils, non nel registry.
- La conversione `world_pixels ↔ screen/Pixi` vive in `ParallaxController.ts` o in un nuovo `worldToScreen.ts`, non nel registry.

## Consumer migration matrix (obbligatoria in A.3)

| Consumer | Sorgente attuale | Nuova sorgente | API registry | Test |
|---|---|---|---|---|
| `useBreathAnimation` | `WORLD_SURFACE_CONFIG.breath` | `registry.config.breath` | `registry.config.breath` | `BreathLayer` render con opacità variabile |
| `useParallax` / `ParallaxController` | `WORLD_SURFACE_CONFIG.parallax` | `registry.config.parallax` + camera | `registry.config.parallax` | offset in range atteso |
| `useEventSystem` | `eventConfig` + `useWorldSurfaceState` | `registry` + `WorldClock` | `registry.getEventSeverity`, `registry.config.worldAttentionDirector` | `EventLayer` render condizionale per fase |
| `useWonderSystem` | `wonderSpawner` + `useWorldSurfaceState` | `registry` | `registry.getWonder`, `registry.config.biomes` | `WonderLayer` render quando `activeWonder` |
| `useUnderwaterSystem` | `UNDERWATER_CONFIG` + `useWorldSurfaceState` | `registry.config.underwaterV3` | `registry.config.underwaterV3` | `UnderwaterLayer` render condizionale |
| `WorldLayer` | `WORLD_SURFACE_CONFIG.calibration` | `registry.config.layerBudget`? `registry.config.calibration?` | `registry.config` | opacità base render |
| `EventLayer` | `useEventSystem().activeEvents` | `useEventSystem()` (adattato) | `registry` via hook | classi CSS per fase |
| `WonderLayer` | `useWonderSystem().activeWonder` | `useWonderSystem()` (adattato) | `registry` via hook | `data-testid` e class CSS |
| `useAttentionZone` (da creare) | n/a | `registry` | `registry.getZone`, `registry.getReaction` | dwell → reaction |

## Approach notes

- Scrivere `worldSurfaceRegistry.ts` prima di toccare i consumer.
- Scrivere `WorldSurfaceV3Provider` e `useWorldSurfaceRegistry`.
- Rimuovere `useWorldSurfaceState.ts` e aggiornare i hook che lo importavano.
- Migrare i consumer in ordine: `useBreathAnimation`, `useParallax`, `useEventSystem`, `useWonderSystem`, `useUnderwaterSystem`, `useAttentionZone`, `layers`.
- `WorldSurfaceV3Page` monta il provider.
- I test di behavioral parity confrontano snapshot/valori prima e dopo la migrazione.

## File targets

- `src/ui/idleVillage/worldSurface/utils/worldSurfaceRegistry.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/hooks/useWorldSurfaceRegistry.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/hooks/useWorldSurfaceState.ts` (rimuovere)
- `src/ui/idleVillage/worldSurface/hooks/useBreathAnimation.ts` (adattare)
- `src/ui/idleVillage/worldSurface/hooks/useParallax.ts` (adattare)
- `src/ui/idleVillage/worldSurface/layers/ParallaxController.ts` (adattare)
- `src/ui/idleVillage/worldSurface/hooks/useEventSystem.ts` (adattare)
- `src/ui/idleVillage/worldSurface/hooks/useWonderSystem.ts` (adattare)
- `src/ui/idleVillage/worldSurface/hooks/useUnderwaterSystem.ts` (adattare)
- `src/ui/idleVillage/worldSurface/hooks/useAttentionZone.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/layers/*.tsx` (adattare)
- `src/ui/idleVillage/worldSurface/pages/WorldSurfaceV3Page.tsx` (montare provider)
- `src/ui/idleVillage/worldSurface/CONSUMER_MIGRATION.md` (nuovo)
- `tests/unit/idleVillage/WorldSurfaceV3Registry.test.tsx` (nuovo)
- `tests/unit/idleVillage/WorldSurfaceV3ConsumerParity.test.tsx` (nuovo)
- `test-results/world-surface-v3-A3-registry.md` (evidence log)

## Dependencies

- Sub-plan A.1 — `CONSUMER_AUDIT.md` e `CONSUMER_AUDIT.md`.
- Sub-plan A.2 — schemi, composer, validator, normalizer.
- Sub-plan B (`WorldClock`) — per `useEventSystem`, `useWonderSystem`, `useAttentionZone`.

## Safeguards

```bash
npm run lint -- src/ui/idleVillage/worldSurface
npm run test -- WorldSurfaceV3Registry
npm run test -- WorldSurfaceV3ConsumerParity
npm run build:check
npm run kanban:lint
```

## Open questions

- La conversione `world_pixels ↔ screen/Pixi` vive in `ParallaxController.ts` o in un modulo `worldToScreen.ts` separato? (default: `ParallaxController.ts` per V3, modulo separato P1)
