<!-- markdownlint-disable MD013 -->
# World Presentation Runtime — Implementation Plan

> Stato: **approved plan v1.4**, close-out in progress for `WORLD-PRESENTATION-RUNTIME-FOUNDATION`.  
> Include `WORLD-PRESENTATION-RUNTIME-DEMO` come Milestone A: visual verb `show_threat_presence` + presentazione ambientale parallela.  
> RFC di riferimento: `world_presentation_runtime_rfc.md` (v1.4).  
> Owner: Strategia / Coordinator.

---

## 0. Obiettivo

Costruire il primo loop end-to-end che traduce lo stato del mondo di Wanderlust in una rappresentazione visiva leggibile e deterministica. Il focus di questa evoluzione è il **visual verb**: una funzione semantica pura che mappa `WorldPresentationModel` → percezione visiva.

```text
GAMEPLAY TRUTH
WorldState
    │
    ▼
SEMANTIC TRANSLATION
WorldPresentationModel
    │
    ▼
VISUAL LANGUAGE
show_threat_presence
show_threat_arrival
show_threat_communication
show_weather_storm
show_region_corruption
...
    │
    ▼
COMPOSITION
OutputComposer
    │
    ▼
PRESENTATION CONTRACT
PresentationOutput
    │
    ▼
RENDERING
WorldSurfaceRenderer
    │
    ▼
Player perceives world
```

Il primo task (`WORLD-PRESENTATION-RUNTIME-FOUNDATION`) produce il **primo organo sensoriale del runtime**: `WorldState → PresentationOutput`. `WORLD-PRESENTATION-RUNTIME-DEMO` (Milestone A) dimostra il primo visual verb `show_threat_presence`. Non include Goblin Arrival, cinematiche né Director tooling completo.

---

## 1. Scope

### In scope (Foundation)

1. **Contratti & schemi** (`Zod` + `TypeScript`) per:
   - `PresentationRules`
   - `WorldPresentationModel`
   - `PresentationContext`
   - `PresentationEffect`
   - `PresentationSequence`
   - `PresentationOutput`
   - `PresentationPreset` (schema base)
2. **Runtime core**:
   - `buildWorldPresentationModel(worldState, rules)` — funzione pura, deterministic, unit tested
   - `WorldPresentationRuntime` — update loop, effect registry
   - `PresentationRandom` — seeded RNG stream scoped per effetto
   - `OutputComposer` — `compose(baseOutput, overrides[]): PresentationOutput`; nessun arbitration complesso
3. **TimeEngine integration**:
   - fixed timestep default 60 Hz
   - `tick` + `deltaTick` passati a ogni effetto
   - nessun `requestAnimationFrame` delta
4. **Adapter `WorldSurfaceRenderer`**:
   - mappatura di `PresentationOutput` su `WorldSurfaceRenderer` props
   - conferma supporto a `visualStateOverrides`
5. **Sandbox Director shell** (evoluzione di `WorldSurfaceTestPage`):
   - viewport
   - scenario selector
   - playback controls (play / pause / seed / tick counter)
   - static preset loader
6. **Determinism test**:
   - `tests/unit/idleVillage/WorldPresentationRuntime.replay.test.ts`
7. **World Translation Test**:
   - `tests/unit/idleVillage/WorldPresentationRuntime.translation.test.ts`
8. **UI compliance**:
   - i18n (`idleVillage` namespace)
   - skin tokens / `src/ui/idleVillage/skins/primitives`
   - JSDoc per ogni funzione/interfaccia pubblica
9. **Error/empty states**:
   - manifest missing
   - scenario missing o non valido
10. **`WORLD-PRESENTATION-RUNTIME-DEMO` — primo visual verb concreto**:
    - `ThreatPresenceEffect` come visual verb `show_threat_presence`
    - nessun `SequenceScheduler` in Milestone A; la transizione è calcolata da `update` in base al tick
    - output deterministico: `visualStateOverrides` con tint, aura e marker statico
11. **Renderer integration test**:
    - `visualStateOverrides` prodotte dal runtime arrivano al `WorldSurfaceRenderer` e modificano il layer
    - focus/camera state in `PresentationOutput`

### Out of scope

- Goblin Arrival finale
- Particle editor
- Shader editor
- Audio mixer
- Curve editor avanzato
- Asset browser
- Node graph
- Timeline editing completo (drag/resize/duplicate/undo)
- Capture frame workflow
- `@dnd-kit` clip drag
- Preset management completo (dirty state / beforeunload / import / export / undo)
- Nuovi effetti complessi oltre a `ThreatPresenceEffect` (differiti a `WORLD-PRESENTATION-GOBLIN-ARRIVAL`)
- Sequence orchestration completa (differita a `WORLD-PRESENTATION-SEQUENCE-ORCHESTRATION`)
- Movimento/path interpolation del marker e HUD countdown (differiti a `WORLD-PRESENTATION-GOBLIN-ARRIVAL` e `WORLD-PRESENTATION-THREAT-UX`)
- Ambient Presentation (nuvole, mare, vento, sole, nebbia, vegetazione) come asse parallelo; placeholder/layer possono essere preparati ora, ma non devono essere confusi con `show_threat_arrival`.

## 1.1 Visual Verb & Ambient Presentation Architecture

```text
GAMEPLAY TRUTH
WorldState
    │
    ▼
SEMANTIC TRANSLATION
WorldPresentationModel
    │
    ├───────────────────┬───────────────────┐
    ▼                   ▼                   ▼
Semantic Verbs      Ambient Life       OutputComposer
show_threat_...     animate_clouds          │
                    animate_ocean           │
                    animate_wind            │
                    animate_fog             │
                    animate_vegetation      ▼
                    animate_sun       PresentationOutput
    │                                       │
    └───────────────────┬───────────────────┘
                        ▼
                WorldSurfaceRenderer
                        │
                        ▼
              Player perceives world
```

- `show_threat_presence` è il primo **Semantic Verb**.
- **Ambient Life** (`animate_clouds`, `animate_ocean`, `animate_wind`, `animate_fog`, `animate_vegetation`, `animate_sun`) è un asse parallelo: dà vita al mondo ma non racconta eventi.
- `OutputComposer` compone semplicemente gli override provenienti da entrambi gli assi.
- `PresentationOutput` è l'unico contratto con il renderer.

---

## 2. Dipendenze

- `IV-WORLD-SURFACE-001` ✅ (base renderer, manifest, TestHub page)
- `IV-WORLD-SURFACE-002` ✅ (`WorldState`, `RuntimeObject`, `WorldEvent`)
- Time Engine Contract ✅ (`src/docs/docs/idle_village/trusted/time_engine_trusted.md`)
- `IV-WORLD-SURFACE-003` ⛔ non bloccante (WebGL evaluation)

---

## 3. Architettura

### 3.1 Integration Boundary

| Sistema | Legge | Scrive | Non deve fare |
| --- | --- | --- | --- |
| `WorldState` | — | stato gameplay | conoscere presentazione |
| `worldSurfaceConfig.ts` | manifest / coordinate | — | logica evento |
| `TimeEngine` | tick | — | animazioni proprie |
| `WorldPresentationRuntime` | model / rules / sequence | `PresentationOutput` | mutare `WorldState` |
| `WorldSurfaceRenderer` | `PresentationOutput` | DOM/canvas | mutare mondo |
| `PersistenceService` | preset/rules | preset/rules | salvare stato temporale runtime |

### 3.2 Core Pipeline

```text
WorldState
    │
    ▼
buildWorldPresentationModel(worldState, rules)
    │
    ▼
WorldPresentationModel
    │
    ▼
WorldPresentationRuntime
    │---- Semantic Verbs  (show_threat_presence, show_threat_arrival, ...)
    │---- Ambient Life    (animate_clouds, animate_ocean, animate_wind, ...)
    │---- OutputComposer  // compose(baseOutput, overrides[]): PresentationOutput
    │
    ▼
PresentationOutput
    │
    ▼
WorldSurfaceRenderer
    │
    ▼
Player perceives world
```

### 3.3 Determinismo

- `fixed timestep` fornito da `TimeEngine` (default 60 Hz)
- `PresentationRandom` seedato e isolato per effetto
- `PresentationOutput` JSON-serializzabile
- nessun `Math.random`, `Date.now`, `requestAnimationFrame` delta

---

## 4. Struttura file

```text
src/
├── engine/
│   └── world/
│       └── presentation/
│           ├── README.md
│           ├── types.ts
│           ├── PresentationRules.ts
│           ├── WorldPresentationModel.ts
│           ├── buildWorldPresentationModel.ts
│           ├── PresentationContext.ts
│           ├── PresentationEffect.ts
│           ├── PresentationSequence.ts
│           ├── PresentationOutput.ts
│           ├── OutputComposer.ts
│           ├── PresentationRandom.ts
│           ├── WorldPresentationRuntime.ts
│           └── config/
│               └── presentationRulesRegistry.ts
├── ui/
│   └── idleVillage/
│       ├── config/
│       │   └── presentationConfig.ts
│       ├── hooks/
│       │   └── useWorldPresentationRuntime.ts
│       ├── pages/
│       │   └── WorldPresentationDirectorPage.tsx
│       └── components/
│           └── presentation/
│               ├── PresentationDirectorShell.tsx
│               ├── ScenarioSelector.tsx
│               └── PlaybackControls.tsx
├── tests/
│   └── unit/
│       └── idleVillage/
│           ├── buildWorldPresentationModel.test.ts
│           ├── WorldPresentationRuntime.replay.test.ts
│           ├── WorldPresentationRuntime.translation.test.ts
│           └── OutputComposer.test.ts
└── docs/
    └── docs/
        └── plans/
            └── world_presentation_runtime_implementation_plan.md
```

---

## 5. Step-by-step

### Step 1 — Config & contracts

- Creare schemi Zod e tipi TypeScript in `src/engine/world/presentation/`.
- Definire `PresentationRules` schema; esempio base con threat mapping.
- Definire `PresentationSequence` schema con tracce e clip; la sequence è un **intent layer** (`intent: "show_threat_arrival"`), mai azione di gameplay (`action: "spawn_goblins"`).
- Definire `PresentationOutput` come `WorldSurfaceRenderer` props serializzabili.
- JSDoc su ogni interfaccia e schema.

### Step 2 — Runtime core

- `buildWorldPresentationModel`: `(WorldState, PresentationRules) => WorldPresentationModel`.
- `PresentationRandom`: seeded Mulberry32 o PRNG esistente.
- `WorldPresentationRuntime`:
  - `register(effect)` / `unregister(id)`
  - `update(tick, deltaTick, interpolation)` → `PresentationOutput`
  - `setSequence(sequence)`
  - `setSeed(seed)`
- `OutputComposer`: `compose(baseOutput, overrides[]): PresentationOutput`. Nessun arbitration complesso in Foundation.

### Step 3 — TimeEngine integration

- Consumare tick da `src/engine/game/idleVillage/TimeEngine.ts` o dal suo bus.
- Se il TimeEngine non espone un clock tick-by-tick adatto, creare un `PresentationClock` adapter minimal che usa `TimeEngine` e emette `tick` a fixed timestep.
- Fornire `interpolation` (0..1 tra due tick) per rendering smooth; `tick` e `deltaTick` restano deterministici.
- Separare simulation truth (`tick`) da rendering smoothness (`interpolation`).

### Step 4 — WorldSurfaceRenderer adapter

- `useWorldPresentationRuntime` produce `PresentationOutput`.
- Page/wrapper mappa `PresentationOutput` su props di `WorldSurfaceRenderer`:
  - `activeVisualStateId`
  - `visualStateOverrides`
  - `runtimeObjects`
  - `camera`
  - `visibleLayerIds`
  - `layerScales` / `layerOffsets`

### Step 5 — Sandbox Director shell

- Evolvere `WorldSurfaceTestPage.tsx` in `WorldPresentationDirectorPage.tsx`.
- Aggiungere in `TestHub.tsx` route `/world-presentation-director`.
- Componenti (riuso primitive `Skin*`):
  - `PresentationDirectorShell` (layout)
  - `ScenarioSelector`
  - `PlaybackControls`
- Capture frame (priorità: renderer native snapshot → Canvas API → DOM fallback), timeline editing, dnd-kit, preset management completo, undo: rimandati a `WORLD-PRESENTATION-DIRECTOR-TOOLING`.

### Step 6 — Runtime Demo (`WORLD-PRESENTATION-RUNTIME-DEMO`) — Milestone A: `show_threat_presence` (Semantic Verb)

- Inquadramento: `ThreatPresenceEffect` implementa il primo **visual verb** `show_threat_presence`. Traduce un `WorldEvent` threat attivo in uno stato visivo persistente, config-driven, deterministico. Non è un'animazione e non usa `SequenceScheduler`.
- Implementare `ThreatPresenceEffect` in `src/engine/world/presentation/effects/ThreatPresenceEffect.ts`:
  - `enabled(ctx)`: true se `ctx.model.activeEvents` contiene almeno un `WorldEvent` con `category === 'threat'` e `lifecycle.state === 'active'`.
  - `update(ctx)`: calcola la fase da `ctx.tick` e restituisce `Partial<PresentationOutput>` con `activeVisualStateId`, `visualStateOverrides` (`tint_layer`, `set_opacity`, `set_animation`) e `runtimeObjects` (marker statico).
- Progressione temporale deterministica:
  - tick 0..4: `activeVisualStateId` `default` (SAFE), nessun override, nessun marker.
  - tick 5..14: fase `manifesting`, tint/opacity parziali, marker statico a nord visibile.
  - tick 15+: `activeVisualStateId` `threatened`, tint/opacity persistenti, marker persistente.
  - tick 30: conferma persistenza; stesso output di tick 15.
- Tutti i valori (tick di fase, colori, opacity, posizione/appearance marker) vivono in `threatPresenceEffectConfig.ts` validato con Zod, mai hardcoded nell'effetto.
- Creare `presentationEffectRegistry.ts` con factory `createThreatPresenceEffect(config)` e id `threat_presence`; lo scenario `threat` dichiara `sequenceId: 'show_threat_presence'`, `effectIds: ['threat_presence']` e `useWorldPresentationRuntime` registra gli effetti dal registry. Non introdurre SequenceScheduler in Milestone A.
- La fixture dello scenario `threat` è un `WorldEvent` reale di categoria `threat` (es. `id: 'goblin-threat-north'`, `lifecycle.state: 'active'`, `data: { origin: 'north', regionId: 'enchanted_forest' }`).
- Aggiungere un mini Output Debug Inspector in `PresentationDirectorShell` che mostri `activeVisualStateId`, numero di `runtimeObjects`, numero di `visualStateOverrides` e tick corrente, usando i18n e SkinBadge/SkinScope.
- **Validazione visiva**: la domanda fondamentale è "Guardando la mappa per 3 secondi, senza testo, capisco che qualcosa di pericoloso sta succedendo?". Se sì → A è riuscita; se no → migliorare tint/aura/marker/intensità. Non aggiungere movimento, HUD, countdown o cinematiche.
- Verificare replay e World Translation: stesso scenario/seed/tick → stesso output; screenshot senza testo, ≥ 4/5 osservatori identificano "zona in pericolo".

### Step 7 — Determinism & Perception test

- `WorldPresentationRuntime.replay.test.ts`:
  - stesso scenario, seed, tick
  - `expect(output1).toEqual(output2)`
- `WorldPresentationRuntime.translation.test.ts`:
  - `WorldState` con `threat.active = true`
  - `expect(output.activeVisualStateId).toBe('threatened')`
- `WorldPresentationRuntime.demo.test.ts`:
  - tick 0/5/15/30 progression
  - deterministic output
- `WorldPresentationRuntime.perception.test.ts` (manuale / Playwright):
  - screenshot senza testo, esposizione 3 secondi
  - domanda: "Guardando questa mappa, qualcosa di pericoloso sta succedendo?"
  - ≥ 4/5 risposte corrette → `show_threat_presence` validato
- `OutputComposer.test.ts`:
  - `compose(baseOutput, overrides[])`
  - override precedence

### Step 8 — i18n & skin tokens

- Aggiungere chiavi in `public/locales/en/idleVillage.json`:
  - `presentation.play`, `presentation.pause`, `presentation.seed`, `presentation.scenario`, `presentation.preset`
  - `world.states.default`, `world.states.threatened`, `world.states.corrupted`
  - `world.region.enchanted_forest`
  - `world.anchors.village_01`
- Usare `SkinButton`, `SkinBadge`, `SkinScope`, `SkinTitle`, `SkinCloseButton` da `src/ui/idleVillage/skins/primitives`.

### Step 9 — Error / empty states

- Viewport mostra messaggio se manifest mancante.
- Viewport mostra messaggio e fallback se scenario non trovato o non valido.
- Stato di errore localizzato tramite i18n.

---

## 6. Criteri di accettazione

### Functional

- `/world-presentation-director` caricabile dal TestHub.
- Selezione scenario produce `WorldPresentationModel` corretto.
- Play produce output deterministico: stesso scenario + seed + tick → stesso `PresentationOutput`.
- `PresentationOutput` viene passato a `WorldSurfaceRenderer` e renderizza la mappa.
- `WorldPresentationRuntime.translation.test.ts` passa (es. `threat.active = true` → `activeVisualStateId === 'threatened'`).
- `WORLD-PRESENTATION-RUNTIME-DEMO` / `WorldPresentationRuntime.demo.test.ts` passa: progressione tick 0/5/15/30, `activeVisualStateId` corretto, `visualStateOverrides` con `tint_layer`/`set_opacity` su `vignette`, replay identico.
- `visualStateOverrides` del runtime arrivano al `WorldSurfaceRenderer` e modificano il layer (`WorldSurfaceRenderer` integration test).
- **Perception test**: screenshot senza testo, 3 secondi di esposizione, ≥ 4/5 osservatori percepiscono la minaccia prima di passare a `show_threat_arrival`.

### Non-functional

- `PresentationOutput` serializzabile in JSON (no DOM refs, no class instances).
- `PresentationOutput` è l'unico contratto tra percezione del mondo e rendering; nuovi sistemi visivi devono consumare o estendere questo contratto.
- Nessun componente sotto `WorldPresentationRuntime` modifica `WorldState`.
- `WorldPresentationRuntime` translates world truth into perception. It never creates world truth.

### Safeguards

```bash
npm run lint -- src/engine/world/presentation src/ui/idleVillage
npm run test -- src/engine/world/presentation tests/unit/idleVillage
npm run build:check
npm run kanban:lint
```

---

## 7. Governance Checklist

Dopo implementazione:

- [ ] Aggiornare `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
- [ ] Creare/promuovere `src/docs/docs/idle_village/trusted/world_presentation_runtime_trusted.md`
- [ ] Salvare evidence in `test-results/WORLD-PRESENTATION-RUNTIME-FOUNDATION-<date>.log`
- [ ] Aggiornare `src/docs/docs/coordinator/strategy_tasks.md` (stato Foundation + nuova riga `WORLD-PRESENTATION-RUNTIME-DEMO`)
- [ ] Creare prompt dispatch `coordinator/manual-dispatch/pending/WORLD-PRESENTATION-RUNTIME-DEMO.md`

---

## 8. Task successivi

| Task ID | Descrizione | Dipende da |
| --- | --- | --- |
| `WORLD-PRESENTATION-RUNTIME-DEMO` | Primo visual verb: `show_threat_presence` con progressione 0/5/15/30, percezione visiva validata | `WORLD-PRESENTATION-RUNTIME-FOUNDATION` |
| `WORLD-PRESENTATION-DIRECTOR-TOOLING` | Director tooling completo: timeline editing, capture workflow, preset management (dirty state, undo, import/export), `@dnd-kit` clip drag | `WORLD-PRESENTATION-RUNTIME-FOUNDATION` |
| `WORLD-PRESENTATION-GOBLIN-ARRIVAL` | `show_threat_arrival`: goblin origin, march, threat transition, `ThreatPresence` lifecycle, trailer capture preset | `WORLD-PRESENTATION-DIRECTOR-TOOLING` |
| `WORLD-PRESENTATION-THREAT-UX` | `show_threat_communication`: countdown, `ThreatStatusIndicator`, urgenza | `WORLD-PRESENTATION-GOBLIN-ARRIVAL` |
| `WORLD-PRESENTATION-SEQUENCE-ORCHESTRATION` | `show_threat_cinematic`: sequence orchestration, transizioni tra visual verb | `WORLD-PRESENTATION-THREAT-UX` |
| `WORLD-PRESENTATION-AMBIENT-LIFE` | `animate_*` placeholders: nuvole, mare, vento, sole, nebbia, vegetazione; layer separati e vita alla mappa | `WORLD-PRESENTATION-RUNTIME-FOUNDATION` (parallel) |

---

## 9. Open questions — resolved

1. **TimeEngine tick bus** — `TimeEngine.ts` è puro e non espone un bus tick-by-tick. `useSandboxClock` esiste a livello UI ma è legato al village sandbox. Per `WorldPresentationRuntime` si usa un `PresentationClock` adapter autonomo (`usePresentationClock`) con fixed timestep (`tick`) + `requestAnimationFrame` per l'`interpolation` di rendering.
2. **Dynamic `visualStateOverrides`** — `WorldSurfaceRenderer` non le supportava; esteso con prop `visualStateOverrides` che si somma agli override dello stato visivo attivo del manifest. `worldSurfaceConfig.ts` non richiede modifiche strutturali.
3. **Capture frame** — confermato: usare **renderer snapshot** come metodo primario per documentare l'output visivo. Canvas API diretta come seconda opzione; DOM / `html2canvas` solo fallback. In Foundation il capture non è implementato, ma la scelta architetturale è congelata.

---

## 10. Changelog

| Data | Autore | Modifica |
| --- | --- | --- |
| 2026-07-20 | Strategia | Approved implementation plan v1.0 from RFC v1.3. |
| 2026-07-20 | Strategia | v1.1 — aggiunto `WORLD-PRESENTATION-RUNTIME-DEMO`, criteri close-out Foundation, governance checklist estesa. |
| 2026-07-22 | Strategia | v1.4 — visual verb architecture con `show_threat_presence`, A-E semantic verb roadmap, assi `Ambient Life` paralleli, validazione percezione 3-secondi, `sequenceId` sullo scenario, nessun SequenceScheduler in Milestone A. |
