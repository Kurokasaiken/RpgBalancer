# Sintesi dibattito — contratto dati scena dalla quest-gen
Run: `20261024-scene-quest-data-contract` · 5/5 provider · 2026-10-24

## CONVERGENZA FORTE (5/5)

1. **Intent è authored, mai inferito** — il compiler è proof-checker, non
   co-autore. Inferenza da prosa = la causa esatta dei fallimenti visti.
2. **Fail-closed** — campo mancante → nessun prompt, nodo flaggato.
   Nessun fallback silenzioso (warning solo con flag Director).
3. **Enum controllati ovunque** — verb, feeling, lightEvent, archetype,
   shot, FX, affordance: tutti da vocabolari esistenti (archetypes,
   shot grammar, A1–A8, FX types). Il drift di enum è il nemico a scala.
4. **Validazioni incrociate meccaniche** — playerVerb ∈ options[];
   lightEvent fisicamente motivato; archetype ↔ affordance feasibility;
   FX ↔ reservedRegion; hotspot camuffato ↔ occluder coverage;
   beat↔body similarity (cattura "scena per nodo inesistente").
5. **Provenance first-class** — `hand | generated | generated+reviewed`;
   il generatore emette lo stesso blocco e passa lo stesso schema.

## DIVERGENZE (ruling Director necessario)

- **Quanto può inferire il compiler**: deepseek/chatgpt → zero intent;
  gemini → "Type-Level Intent Ownership" (inferenza strutturale ok,
  intent narrativo no); grok → campo `inferred` separato popolato a
  compile-time. **Tutti d'accordo che l'intent narrativo non si inferisce.**
- **states[]**: chatgpt lo rifiuta come prerequisito ("don't block on the
  reveal plan"); deepseek lo vuole progettato ora (single-element, shared
  geometry). Compromesso proposto: campo opzionale con shape fissata.
- **Uno o due blocchi**: deepseek propone split `sceneDesign` (authored)
  + `sceneContract` (derivato, machine-checked). Più pulito per
  provenance e re-derivazione.

## IL CAMPO LISTA (consenso, merged)

```
sceneDesign (authored):
  beat            ≤140 chars, cross-checked vs body
  playerVerb      enum; primary + verbOptionIds[] (multi-option fan-out)
  feeling         enum (dread/awe/relief/tension/triumph/grief/wonder/menace)
  lightEvent      {source: enum(hearth/moon/dawn/forge/storm/...), event: static|flicker|sweep|shaft}
  compositionArchetype  enum (SHOULDER…VOID)
  shotGrammar     enum (enter-creep/…/hold)
  ambientFX       enum[] — ogni FX richiede reservedRegion
  affordances     [{id: A1..A8, rect img-fraction, serves: verbOptionId,
                    camouflage: bool, depthLayer}]
  occluders       [{polygon img-fraction, depthLayer, parallaxFactor}]
  reservedFXRegions [{rect, fxType}]
  depthHint       {focalPlane, nearClutter, farSilhouette}
  states          optional, shape fissata (reveal-ready)
  provenance      hand | generated | generated+reviewed

sceneContract (compiler-derived, re-derivable):
  hash(sceneDesign) + canonVersion → prompt fragments + playability check
```

## VOCI SOLITARIE / HIGH-UPSIDE

- **deepseek — "playability proof"**: gli occluder+affordance authored
  permettono di PROVARE che il plate è giocabile prima di dipingerlo, e
  di usare quella mask come ControlNet conditioning della generazione —
  il dato animabile diventa vincolo di generazione, non annotazione.
  Il lever più forte contro "bello ma inutilizzabile".
- **grok — templateRef**: blocco default per famiglia di nodi
  ("goblin_encounter_core") — l'autore edita 6 campi, non 20.
- **chatgpt**: separare manifest regioni (runtime-owned) da sceneDesign
  (intent) — i due oggetti hanno lifecycle diversi.

## DECISION MEMO (da ratifica Director)

Proposta: (d) — `sceneDesign` authored obbligatorio + `sceneContract`
derivato dal compiler; intent mai inferito; fail-closed; enum condivisi
come SSoT; `states[]` opzionale con shape fissata; `provenance` gate in
ship-builds; più tardi: playability-proof come conditioning di
generazione. Campo su `QuestScenarioSchema`, SSoT enum esportata dal
pacchetto schema.
