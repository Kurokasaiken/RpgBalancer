<!-- markdownlint-disable MD013 -->
# World Presentation Runtime

This package translates existing `WorldState` into `PresentationOutput`. It is a thin layer between gameplay truth and the `WorldSurfaceRenderer`.

## Responsibility

- Read `WorldState` and produce `WorldPresentationModel`.
- Drive `PresentationEffects` and `PresentationSequences` to emit `PresentationOutput`.
- Stay deterministic, serializable, and headless.

## Forbidden

This package must **never**:

- create gameplay entities
- mutate simulation / `WorldState`
- own rendering technology
- replace `WorldSurfaceRenderer`
- introduce new rendering primitives without proving existing `WorldSurfaceRenderer` capabilities are insufficient

## Golden rule

> `WorldPresentationRuntime` translates world truth into perception. It never creates world truth.

Esempio di flusso corretto:

```text
World Simulation
       |
       v
WorldState
       |
       v
Presentation Model
       |
       v
Presentation Runtime
       |
       v
Renderer
```

Un `PresentationEffect` non può mai chiamare `createGoblin()` o mutare `WorldState`.
