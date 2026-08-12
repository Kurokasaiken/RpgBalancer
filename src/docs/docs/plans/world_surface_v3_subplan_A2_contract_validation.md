---
title: World Surface V3 — Sub-plan A.2 — Fragments, schemas, validation e normalizzazione (v2)
status: Draft
version: 2
parent_plan: world_surface_v3_tactical_plan.md
node: A.2
classification: sub-plan
execution_hint: architectural
created: 2026-08-13
revised: 2026-08-13
---

# Sub-plan A.2 — Fragments, schemas, validation e normalizzazione (v2)

## Classificazione e giustificazione

`sub-plan`. Definisce e implementa la forma del contratto centralizzato. È il nodo più denso dello split A perché produce i tipi, gli schemi, la logica di composizione, la referential/semantic validation e la normalizzazione. Nessun consumer viene modificato qui.

## Intent

Produrre un contratto validato e immutabile per World Surface V3:

- Schemi Zod `WorldSurfaceV3Config`, `WorldSurfaceV3Fragment` e tutte le entità in `src/ui/idleVillage/config/worldSurfaceConfig.ts`.
- `composeWorldSurfaceV3(fragments): WorldSurfaceV3UnvalidatedConfig` in `src/ui/idleVillage/worldSurface/utils/worldSurfaceComposer.ts`.
- `validateWorldSurfaceV3Config(config)` (structural + referential + semantic) con `ZodError` di percorso.
- `normalizeWorldSurfaceV3Config(config)` che valida e restituisce il grafo deep-frozen.
- Convertire i preset esistenti in `WorldSurfaceV3Fragment`.

## Public API (congelata in A.2)

```ts
// src/ui/idleVillage/config/worldSurfaceConfig.ts
export const WorldSurfaceV3ConfigSchema: z.ZodSchema<WorldSurfaceV3Config>;
export const WorldSurfaceV3FragmentSchema: z.ZodSchema<WorldSurfaceV3Fragment>;
export type WorldSurfaceV3Config = z.infer<typeof WorldSurfaceV3ConfigSchema>;
export type WorldSurfaceV3Fragment = z.infer<typeof WorldSurfaceV3FragmentSchema>;

// src/ui/idleVillage/worldSurface/utils/worldSurfaceComposer.ts
export const composeWorldSurfaceV3 = (
  fragments: readonly WorldSurfaceV3Fragment[]
): WorldSurfaceV3UnvalidatedConfig;

// src/ui/idleVillage/worldSurface/utils/worldSurfaceValidator.ts (nuovo)
export const validateWorldSurfaceV3Config = (
  unvalidated: WorldSurfaceV3UnvalidatedConfig
): WorldSurfaceV3Config;

// src/ui/idleVillage/worldSurface/utils/worldSurfaceNormalizer.ts (nuovo)
export const normalizeWorldSurfaceV3Config = (
  unvalidated: WorldSurfaceV3UnvalidatedConfig
): Readonly<WorldSurfaceV3Config>;
```

## Lifecycle esplicito

```text
author fragment (preset)
→ strict `WorldSurfaceV3FragmentSchema.parse(fragment)`
→ `composeWorldSurfaceV3(fragments)`
  - ordina per `source`
  - concatena collection
  - rifiuta ID duplicati nello stesso collection
  - rifiuta season duplicate
  - materializza collection assenti come `[]`
  - impone `version: 'v3'`
→ `WorldSurfaceV3ConfigSchema.safeParse(composed)` per structural
→ `validateWorldSurfaceV3Config(composed)` per referential + semantic
→ `normalizeWorldSurfaceV3Config(composed)` = validate + `deepFreeze`
→ output: `Readonly<WorldSurfaceV3Config>`
```

## Validation ownership

| Phase | Validates | Output | Error policy |
|---|---|---|---|
| Fragment schema strict | shape, unknown keys, types, ranges, local duplicate IDs | `WorldSurfaceV3Fragment` | `ZodError` con path (es. `attentionZones[0].id`) |
| Composer | `source` unico, ordering, collection merge, duplicate IDs cross-fragment, missing singleton | `WorldSurfaceV3UnvalidatedConfig` | `Error` con `source` e `path` in `message` |
| Root structural schema | ogni root field, cardinalità, `version`, `min(1)` per `reactions`/`biomes` | `WorldSurfaceV3Config` | `ZodError` |
| Referential validator | ogni riga della matrice referenziale del domain model | — | `ZodError` via `ctx.addIssue` |
| Semantic validator | `activation` vs triggers, underwater enabled, parallax z-index unici | — | `ZodError` via `ctx.addIssue` |
| Demo profile | `attentionZones.length >= 1` | `DemoWorldSurfaceV3Config` | `Error` opzionale, se usata dalla demo H |

## Acceptance

- Schemi Zod e tipi TypeScript esistono per tutte le entità del domain model.
- `WorldSurfaceV3ConfigSchema` e `WorldSurfaceV3FragmentSchema` sono `.strict()`.
- `composeWorldSurfaceV3` implementa tutte le regole di composizione del domain model e ha test dedicati.
- `validateWorldSurfaceV3Config` implementa la matrice referenziale completa e la semantic validation.
- `normalizeWorldSurfaceV3Config` restituisce un oggetto `Object.freeze` ricorsivo; due chiamate con stesso input producono oggetti `Object.is` per i valori interni (stessi riferimenti, non clonati).
- Test unitari:
  - fixture valida completa passa;
  - fixture invalida per ogni riga della matrice referenziale fallisce con path specifico;
  - unknown keys, ID duplicati, season conflittuali, `source` duplicato, `reactions`/`biomes` vuoti falliscono;
  - `normalize` produce oggetto frozen (verifica con `Object.isFrozen`).
- I preset esistenti (`eventConfig.ts`, `wonderConfig.ts`, `underwaterConfig.ts`) diventano `WorldSurfaceV3Fragment` con `source` e validano.
- `npm run build:check` verde.

## Invariants (RPG)

- Config-first: nessun valore di dominio hardcoded; i default vivono negli schemi.
- Zod per nuovi config; `.strict()` per default.
- i18n: `labelKey` per ogni stringa user-facing.
- `world_pixels/top_left` è il coordinate space canonico (verificato in A.1, adottato da A.2).
- Nessun `Date.now()` nel contratto (tempo da `WorldClock`, sub-plan B).
- Nessun duplicazione di schemi: i config locali `worldSurface/config/*.ts` diventano solo preset.

## Constraints

- `version: 'v3'` è imposto dal composer; i fragment non lo possono sovrascrivere.
- `reactions` e `biomes` hanno `min(1)` nel root; gli altri array possono essere vuoti.
- `UnderwaterV3`: se `enabled`, `biomeId`, `waterlineY`, `depthPx`, `causticOpacity` diventano required (semantic validation).
- `EventSeverity` è profilo di eleggibilità, non istanza evento.
- `heavyEffect` in `Reaction` resta un sotto-oggetto inline in P0; nessun catalogo separato.
- `WorldAttentionDirector` è entità separata, non dentro `LayerBudget`.

## Approach notes

- Partire da `z.object` espliciti e `.strict()`; usare `z.infer` per i tipi.
- `composeWorldSurfaceV3` è pura e non tocca React.
- `validateWorldSurfaceV3Config` usa `.superRefine` con `ctx.addIssue`.
- `normalizeWorldSurfaceV3Config` chiama `validate` poi `deepFreeze`.
- I file `worldSurface/config/*.ts` esportano un oggetto `WorldSurfaceV3Fragment` con `source` (es. `source: 'event-preset'`) e nessun schema Zod locale.

## File targets

- `src/ui/idleVillage/config/worldSurfaceConfig.ts` (schemi + tipi centrali)
- `src/ui/idleVillage/worldSurface/utils/worldSurfaceComposer.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/utils/worldSurfaceValidator.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/utils/worldSurfaceNormalizer.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/config/eventConfig.ts` (fragment)
- `src/ui/idleVillage/worldSurface/config/wonderConfig.ts` (fragment)
- `src/ui/idleVillage/worldSurface/config/underwaterConfig.ts` (fragment)
- `src/ui/idleVillage/worldSurface/config/attentionZoneConfig.ts` (fragment)
- `tests/unit/idleVillage/WorldSurfaceV3Config.test.tsx` (nuovo)
- `tests/unit/idleVillage/fixtures/worldSurfaceV3Fixtures.ts` (nuovo)
- `test-results/world-surface-v3-A2-contract.md` (evidence log)

## Dependencies

- Sub-plan A.1 — `CONSUMER_AUDIT.md` fornisce la lista dei consumer e dei field da soddisfare.
- Sub-plan B (`WorldClock`) — solo per fixture/test temporali e per consumer runtime, non per il contratto.

## Safeguards

```bash
npm run lint -- src/ui/idleVillage/config src/ui/idleVillage/worldSurface/utils tests/unit/idleVillage/WorldSurfaceV3Config.test.tsx
npm run test -- WorldSurfaceV3Config
npm run build:check
npm run kanban:lint
```

## Open questions

- La demo profile (`attentionZones.length >= 1`) deve essere una funzione separata o un `z.refine` sul root schema? (decidere in esecuzione; default: funzione separata in `worldSurfaceValidator.ts`)
