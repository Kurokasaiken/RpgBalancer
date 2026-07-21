<!-- markdownlint-disable MD013 -->
# World Presentation Runtime — RFC v1.4

> Stato: **frozen** / approved.  
> Scopo: definire il layer che traduce lo stato del mondo di Wanderlust in una rappresentazione visiva leggibile dal giocatore.

---

## 1. Purpose

`WorldPresentationRuntime` è il layer che traduce lo stato del mondo di Wanderlust in una rappresentazione visiva leggibile dal giocatore.

Non decide:

- eventi gameplay
- conseguenze
- stato persistente del mondo

Decide:

- come lo stato viene percepito
- quali segnali visivi emergono
- come la transizione viene raccontata nel tempo

Principio:

```text
World State
    |
    v
World Presentation Model
    |
    v
WorldPresentationRuntime
    |
    v
WorldSurfaceRenderer
```

---

## 2. Integration Boundary

### Sistemi esistenti

| Sistema | Responsabilità | Legge | Scrive | Non deve fare |
| --- | --- | --- | --- | --- |
| `WorldState` | Gameplay truth | stato gioco | — | effetti visivi |
| `WorldPresentationModel` | traduzione semantica | `WorldState` | — | rendering |
| `worldSurfaceConfig.ts` | configurazione mappa | manifest / config | — | logica evento |
| `WorldSurfaceRenderer` | rendering | `PresentationOutput` | DOM / canvas | mutare mondo |
| `TimeEngine` | clock deterministico | tick | — | animazioni proprie |
| `PersistenceService` | salvataggio preset / tooling | config sandbox | preset | world state |

Regola:

> Il Presentation Runtime non può mai modificare `WorldState`.

---

## 3. Core Pipeline

```text
WorldState
    |
    |
buildWorldPresentationModel()
    |
    |
WorldPresentationRuntime
    |
    +---- PresentationEffects
    |
    +---- PresentationSequence
    |
    +---- OutputComposer  // compose(baseOutput, overrides[]): PresentationOutput
    |
    v
PresentationOutput
    |
    v
WorldSurfaceRenderer
```

---

## 4. WorldPresentationModel

Responsabilità: rappresentare cosa il giocatore deve percepire.

Esempio:

```json
{
  "threatLevel": "high",
  "activeThreats": [
    {
      "id": "goblin_invasion",
      "origin": "north",
      "intensity": 0.8
    }
  ]
}
```

Non contiene:

- coordinate pixel
- particelle
- animazioni
- timing trailer

---

## 5. buildWorldPresentationModel

Funzione obbligatoriamente pura:

```ts
function buildWorldPresentationModel(
  worldState: WorldState,
  rules: PresentationRules
): WorldPresentationModel
```

Vincoli:

- deterministic
- no side effect
- unit tested
- config driven

---

## 6. PresentationEffect Contract

```ts
interface PresentationEffect {
  id: string;

  mount(context: PresentationContext): void;

  update(context: PresentationContext): PresentationOutput;

  dispose(): void;
}
```

Regole:

- ogni `mount` crea stato nuovo
- nessun `Math.random`
- nessun riferimento DOM
- nessuna persistenza interna

---

## 7. PresentationContext

```ts
interface PresentationContext {
  model: WorldPresentationModel;
  manifest: WorldSurfaceManifest;
  tick: number;
  deltaTick: number;
  interpolation: number; // 0..1 between ticks, for rendering smoothness
  random: PresentationRandom;
}
```

Clock:

```text
TimeEngine
     |
     +---- tick simulation
     |
     +---- presentation interpolation alpha
     v
WorldPresentationRuntime.update()
```

- Replay and determinism use `tick`.
- Rendering may use `interpolation` for visual smoothness.

Mai:

- `requestAnimationFrame` delta

---

## 8. Deterministic Replay

Vincoli:

- fixed timestep
- seeded RNG
- no wall clock
- output serializzabile

Test:

```text
tests/unit/idleVillage/WorldPresentationRuntime.replay.test.ts
```

Acceptance:

```ts
expect(outputRun1).toEqual(outputRun2)
```

Stesso:

- scenario
- seed
- tick

---

## 9. PresentationSequence

La sequence non modifica il mondo. È un asset narrativo e un **intent layer**.

`PresentationSequence` dice "racconta questo significato", non "esegui questa simulazione".

Può emettere solo presentation intents. Non può invocare azioni di gameplay.

Esempio corretto — Goblin Arrival:

```text
WorldState
{
  threat: { type: "goblin", active: true, origin: "north" }
}
        |
        v
PresentationModel
{
  threatLevel: "high",
  threatOrigin: "north"
}
        |
        v
Sequence intent: "show_threat_arrival"
        |
        v
Visual Output
- banner
- tint
- runtime object
- camera hint
```

Consentito:

```json
{ "intent": "show_threat_arrival", "intensity": 0.8 }
```

Vietato:

```json
{ "action": "spawn_goblins", "position": "north", "count": 20 }
```

```text
WorldPresentationModel
          |
          v
     triggers
          |
          v
PresentationSequence
          |
          v
Effects
```

Esempio:

```json
{
  "id": "goblin_arrival",
  "clips": [
    {
      "start": 0,
      "action": "spawn_threat"
    },
    {
      "start": 2,
      "action": "activate_threat_presence"
    }
  ]
}
```

---

## 10. PresentationOutput

Output puro:

- JSON serializable
- nessuna classe
- nessun DOM reference

Compatibile con `WorldSurfaceRendererProps`.

Include:

```json
{
  "activeVisualStateId": "...",
  "runtimeObjects": [],
  "visualStateOverrides": [],
  "camera": {},
  "layerOffsets": {},
  "layerScales": {}
}
```

---

## 11. Sandbox Director

Non è un debug panel. È un tool di regia.

Layout:

```text
Scenario | Seed | Playback
--------------------------------

            VIEWPORT

--------------------------------

            TIMELINE

--------------------------------

Effects | Inspector | Presets
```

### Timeline requirements

Obbligatorio:

- tracks
- clips
- drag
- resize
- zoom
- pan
- snap tick
- fit view
- playhead
- live preview

Durante drag:

```text
drag clip
    |
    v
runtime preview update
    |
    v
commit
    |
    v
undo stack
```

---

## 12. Director Features

### Playback

- Play
- Pause
- Restart
- Loop
- Speed
- Tick counter

### Camera

Modalità:

```text
Camera Hint
    |
Runtime controlla camera


Manual Camera
    |
Designer controlla camera
```

### Preset

Supporta:

- create
- rename
- duplicate
- delete
- import JSON
- export JSON
- thumbnail future support

### Capture Frame

Formato: `PNG`

Output: `Blob` / `base64`

Source: `WorldSurfaceRenderer` canvas / render surface.

Regola:

> Capture must capture the renderer output, not reconstruct the DOM.

Priorità:

1. Renderer native snapshot.
2. Canvas API sul renderer output.
3. DOM screenshot solo come fallback.

Modalità:

- viewport corrente
- preset trailer `1920x1080`

---

## 13. UI Compliance

Obbligatorio:

- i18n
- skin tokens
- frozen primitives
- JSDoc
- keyboard shortcuts
- ARIA

Drag: usare `@dnd-kit`, non HTML5 drag.

---

## 14. Error Handling

Il runtime deve degradare.

Esempi:

- **Manifest missing**: viewport mostra `"World surface unavailable"`
- **Effect failure**: effect skipped, runtime continues

---

## 15. First Implementation Task

`WORLD-PRESENTATION-RUNTIME-FOUNDATION`

Scope: creare il guscio end-to-end.

Include:

### Runtime

- `WorldPresentationRuntime`
- `PresentationContext`
- `PresentationOutput`
- Effect registry

### Integration

- `TimeEngine` connection
- `WorldSurfaceRenderer` adapter

### Sandbox (Foundation Director)

- viewport
- scenario selector
- playback controls (play / pause / seed / tick)
- static preset loader

Non include:

- timeline editing
- capture workflow
- preset management completo
- undo
- `@dnd-kit` clip drag
- import / export
- Goblin Arrival finale
- particelle
- shader
- polish

### Acceptance Criteria

#### Functional

Scenario: `WorldState → PresentationModel → Runtime → Output → Renderer` funziona.

#### Determinism

Test `WorldPresentationRuntime.replay.test.ts` passa.

#### World Translation Test

Test automatico che protegge il significato:

```ts
const worldState = { threat: { active: true } };
const output = runtime.update(tick, seed);
expect(output.activeVisualStateId).toBe('threatened');
```

File: `tests/unit/idleVillage/WorldPresentationRuntime.translation.test.ts`.

Acceptance umana:

- Screenshot senza testo.
- Domanda: "questa zona è in pericolo?"
- ≥ 4/5 risposte corrette.

#### Repository safeguards

Prima della chiusura:

```bash
npm run lint -- <scope>
npm run test -- <scope>
npm run build:check
npm run kanban:lint
```

### Governance Checklist

Dopo implementazione:

- [ ] aggiornare `COMPONENT_MASTER_INDEX.md`
- [ ] creare / promuovere `world_presentation_runtime_trusted.md`
- [ ] salvare evidence in `test-results/WORLD-PRESENTATION-RUNTIME-FOUNDATION-<date>.log`

---

## 16. Ultima nota da lead

> `WorldPresentationRuntime` is intentionally not a general rendering engine. Any feature that introduces new rendering primitives must first prove that existing `WorldSurfaceRenderer` capabilities are insufficient.
>
> `PresentationOutput` is the only contract between world perception and rendering. New visual systems must consume or extend this contract. `<GoblinOverlay />`, `<ThreatBanner />` e `<WeatherLayer />` non possono esistere come componenti UI sparsi: devono emergere da `PresentationOutput` e essere renderizzati da `WorldSurfaceRenderer`.

Con questa aggiunta il documento è effettivamente RFC-ready. La prossima attività non dovrebbe essere ulteriore design, ma il task `FOUNDATION` e poi il primo caso reale: **Goblin Arrival** come prova del linguaggio visivo.
