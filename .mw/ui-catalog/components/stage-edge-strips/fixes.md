# fixes — stage-edge-strips

## `default` — passed, but the assertion is weaker than the state's intent (note, not a failure)

**Verbatim documenter result:**

```json
{"id":"default","ok":true}
```

Reached via `S6_QuestPlanner` (`expedition openDetail`, `howStateReached:
planner:hook-assisted:openDetail`). The assertion passed on
`[data-stage-strips]` — which is the **always-mounted fullscreen
container** (probe at S1: in DOM, 1440×900, `data-hud-strip-tab`=0,
`data-stage-rail`=0). The pass proves the layer mounts; it does **not**
prove a populated regime (tabs/rails) was captured.

**Suggested strengthening — pick one:**

1. Selector: `[data-hud-strip-tab], [data-stage-rail]` (any populated
   strip element) instead of the container.
2. Driver to the populated regime: collapse a stage-managed panel (e.g.
   drag the roster wing below `wingRailPx`, or use the stage-zone collapse
   affordance) — the manifest note already marks S6 planner+roster wings
   as "the most reliable populated regime witnessed".

`captureSelector` already lists `[data-hud-strip-tab]|[data-stage-rail]`
alternates — no iso shot of them was produced this run because the
container matched first and the populated elements were absent/unchecked.
