---
title: World Surface V3 — Sub-plan A — Contratto centrale (v2)
status: Draft
version: 2
parent_plan: world_surface_v3_tactical_plan.md
node: A
classification: sub-plan
execution_hint: architectural
created: 2026-08-13
revised: 2026-08-13
---

# Sub-plan A — Contratto centrale (Root Config) v2

## Classificazione e giustificazione

`sub-plan`. Tocca più file con dipendenze non ovvie, richiede decisioni architetturali (ownership del contratto, schema vs registry vs preset, referential validation, coordinate space) ed è fondazione di tutti gli altri nodi. La v1 era stata bocciata dalla delibera multi-AI per via della forma del root schema e del modello di ownership irrisolto.

## Intent

Produrre un **contratto centrale esplicito e verificabile** in `src/ui/idleVillage/config/worldSurfaceConfig.ts` composto da:

1. **Schemi Zod** per ogni entità condivisa (`LayerBudget`, `HeavyEffect`, `AttentionZone`, `AttentionZoneTrigger`, `EventSeverity`, `Reaction`, `Wonder`, `Biome`, `Breath`, `Parallax`, `SeasonModifier`, `UnderwaterV3`, `WorldAttentionDirector`).
2. **`WorldSurfaceV3ConfigSchema` radice** con elenco completo delle collection, cardinalità, policy unknown keys, e `.superRefine` per referential validation.
3. **Runtime registry** derivato (`WorldSurfaceV3Registry`) che carica la config validata e fornisce lookup maps (`reactionsById`, `zonesById`, `eventsById`, `wondersById`, `biomesById`) senza duplicare schemi.
4. **Audit dei consumer esistenti** prima di qualsiasi modifica ai contratti per evitare rotture.

## Shape di `WorldSurfaceV3ConfigSchema` (esplicita)

```typescript
export const WorldSurfaceV3ConfigSchema = z.object({
  layerBudget: LayerBudgetSchema,
  worldAttentionDirector: WorldAttentionDirectorSchema,
  attentionZones: z.array(AttentionZoneSchema).max(256),
  reactions: z.array(ReactionSchema).max(256),
  events: z.array(EventSeveritySchema).max(64),
  wonders: z.array(WonderSchema).max(64),
  biomes: z.array(BiomeSchema).max(64),
  breath: BreathConfigSchema,
  parallax: ParallaxConfigSchema,
  seasonModifiers: z.record(SeasonIdSchema, SeasonModifierSchema),
  underwaterV3: UnderwaterV3Schema,
}).strict().superRefine(referentialValidation);
```

**Cardinalità / opzionalità:**

- `layerBudget`, `worldAttentionDirector`, `breath`, `parallax`, `seasonModifiers`, `underwaterV3`: **required, singleton**.
- `reactions`, `biomes`: **required, min 1**; `reactions` deve contenere almeno tutti i `reactionId` referenziati dalle `attentionZones`.
- `attentionZones`, `events`, `wonders`: **optional arrays**, ma `attentionZones` deve esistere per la demo verticale.

**Unknown keys policy:** `.strict()` per tutti gli schemi. Nessuna chiave non documentata passa la build.

## Modello di ownership (schema vs registry vs preset)

| Concetto | Dove vive | Ruolo |
|---|---|---|
| **Schema** | `src/ui/idleVillage/config/worldSurfaceConfig.ts` | Fonte di verità sulla forma. Definisce tipi, parsing, validazione, errori. |
| **Preset / fixture** | `src/ui/idleVillage/worldSurface/config/*.ts` | Istanze concrete validate. Ogni file esporta un `WorldSurfaceV3Config` parziale o completo. Non contengono schemi. |
| **Runtime registry** | `src/ui/idleVillage/worldSurface/utils/worldSurfaceRegistry.ts` (nuovo) | Lookup maps derivate dalla config validata. Non è source of truth, è indice di sola lettura. |
| **Reaction registry** | derivato da `reactions[]`; nessun file `reactionRegistry.ts` separato | `reactionId` sono stringhe ID uniche all'interno di `reactions[]`; le zone referenziano `reaction.id`. |

**Decisione:** nessun registry separato per `reactionId`. `reactions[]` nel contratto centrale è il registro implicito. L'unicità e l'esistenza dei riferimenti sono validate da `.superRefine`.

## Referential validation (completa)

La funzione `referentialValidation` controlla e restituisce `ZodError` per:

- **Unicità ID** all'interno di ogni collection (`reactions[].id`, `attentionZones[].id`, `events[].id`, `wonders[].id`, `biomes[].id`).
- **`AttentionZone.reactionId`**: esiste in `reactions[].id`.
- **`AttentionZone.biome`**: se presente, esiste in `biomes[].id`.
- **`EventSeverity.biomeRefs`** / `wonderRefs`: se definiti, ogni ID esiste in `wonders[].id`.
- **`Wonder.eligibleBiomes`**: ogni ID esiste in `biomes[].id`.
- **Riferimenti inversi opzionali**: reaction inutilizzate non sono errore (sono un catalogo), ma una reaction referenziata da due zone è ok; zone duplicate con stesso ID sono errore; ID dangling in `AttentionZone.reactionId` sono errore.
- **Error path**: ogni errore di referential validation riporta il `path` Zod (es. `attentionZones[3].reactionId`) per DX.

## Consumer discovery (dipendenza reale)

Prima di applicare i nuovi schemi, auditare e documentare i consumer attuali:

- `src/ui/idleVillage/worldSurface/hooks/useEventSystem.ts`
- `src/ui/idleVillage/worldSurface/hooks/useWonderSystem.ts`
- `src/ui/idleVillage/worldSurface/hooks/useUnderwaterSystem.ts`
- `src/ui/idleVillage/worldSurface/hooks/useWorldSurfaceState.ts`
- `src/ui/idleVillage/worldSurface/hooks/useAttentionZone.ts`
- `src/ui/idleVillage/worldSurface/layers/*.tsx`
- `src/pages/world-surface-v3.tsx`

L'acceptance include un documento `CONSUMER_AUDIT.md` (o sezione nel sub-plan) che elenca per ogni file quali campi assume, quali importa e quali va adattare.

## Acceptance (v2 — falsificabile)

- La root config `WorldSurfaceV3ConfigSchema.parse(completeFixture)` passa; `parse(invalidFixture)` fallisce con `ZodError` e `path` specifico.
- Test negativi specifici per: unicità ID, `reactionId` dangling, `biome` inesistente, unknown key, array vuoto dove proibito.
- I preset esistenti (`eventConfig.ts`, `wonderConfig.ts`, `underwaterConfig.ts`, `attentionZoneConfig.ts`) vengono convertiti in fixture valide e passano `WorldSurfaceV3ConfigSchema` o `sotto-schema` dedicato.
- `CONSUMER_AUDIT.md` (o riga in evidence log) elenca consumer e campi usati.
- Il runtime registry `useWorldSurfaceConfig()` (o `getWorldSurfaceRegistry()`) è testato: lookup `reactionsById`, `zonesById` funzionano.
- `npm run build:check` verde.

## Invariants (RPG)

- Config-first: nessun valore di dominio fuori dai config (`.windsurf/rules/00-project-invariants.md`).
- Zod obbligatorio per nuovi config; unknown keys rifiutati (`.strict()`).
- i18n: ogni stringa user-facing è `labelKey`, namespace `idleVillage`.
- Un solo coordinate space canonico: `world_pixels` con origin `top_left`.
- Nessuna duplicazione di schemi tra contratto centrale e config locali.
- Runtime registry è read-only, derivato, non source of truth.

## Constraints

- Owner del contratto: `src/ui/idleVillage/config/worldSurfaceConfig.ts`.
- File in `worldSurface/config/` contengono solo preset validati, non schemi.
- Enum biomi: `forest, desert, mountain, ocean, swamp, tundra, volcano, plains, coast, ruins`.
- Durate fasi evento: tuple `[min, max]`, inclusività chiusa a sinistra (`[min, max]`).
- Hardware placeholder (`maxPixiObjects`, `textureVramBudgetMb`) stanno in `LayerBudgetSchema` come default profilabili, con commento di provenienza placeholder.

## Approach notes

1. Audit consumer e stub esistenti.
2. Definire schemi in `worldSurfaceConfig.ts` partendo da `z.object` espliciti, poi `.superRefine`.
3. Definire `WorldSurfaceV3Registry` in `worldSurfaceRegistry.ts` come funzioni pure che accettano `WorldSurfaceV3Config` e restituiscono mappe.
4. Convertire i preset in fixture; rimuovere schema duplicati dai file `worldSurface/config/`.
5. Aggiornare i consumer con i nuovi `WorldSurfaceV3Config` / registry.

## File targets

- `src/ui/idleVillage/config/worldSurfaceConfig.ts` (estendere con schemi e root)
- `src/ui/idleVillage/worldSurface/utils/worldSurfaceRegistry.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/config/eventConfig.ts` (preset)
- `src/ui/idleVillage/worldSurface/config/wonderConfig.ts` (preset)
- `src/ui/idleVillage/worldSurface/config/underwaterConfig.ts` (preset)
- `src/ui/idleVillage/worldSurface/config/attentionZoneConfig.ts` (preset)
- `tests/unit/idleVillage/WorldSurfaceV3Config.test.tsx` (nuovo)
- `tests/unit/idleVillage/fixtures/worldSurfaceV3Fixtures.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/CONSUMER_AUDIT.md` (nuovo o evidence log)

## Dependencies

- Discovery/audit dei consumer esistenti (output `CONSUMER_AUDIT.md`).
- Nessuna modifica runtime può iniziare prima che il contratto e il registry esistano.

## Safeguards

```bash
npm run lint -- src/ui/idleVillage/config src/ui/idleVillage/worldSurface/utils tests/unit/idleVillage/WorldSurfaceV3Config.test.tsx
npm run test -- WorldSurfaceV3Config
npm run build:check
npm run kanban:lint
```

## Open questions

- I target hardware placeholder (`maxPixiObjects: 150`, `textureVramBudgetMb: 128`) restano nel config con marker `// profiling placeholder` o vanno in `LayerBudgetSchema` + file `performance-targets.md` separato?
- L'attuale `worldSurfaceDebugContract.ts` viene promosso in `WorldSurfaceV3ConfigSchema` o resta locale? (decidere in esecuzione in base all'audit.)
- Versioning config: serve `.version: 'v3'` nel root per futura migrazione, o si differisce a P1?
