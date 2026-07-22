# WORLD-PRESENTATION-RUNTIME-DEMO — World Presentation Runtime Demo

## Title

World Presentation Runtime Demo — Milestone A: `show_threat_presence`

## Description

Prima prova concreta del vocabolario visivo del runtime: il visual verb `show_threat_presence` traduce un WorldEvent `threat` attivo in una percezione persistente sulla mappa (tint + aura + marker statico), senza SequenceScheduler, senza movimento del marker e senza HUD/countdown.

## Prompt

```text
AGENT
Idle Village Task — World Presentation Runtime Demo (Milestone A)

ISTRUZIONI AGENTE
Consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare, segui i mandati, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Implementare la Milestone A "Threat Semantic Presence" come primo visual verb: `show_threat_presence`. Un `WorldEvent` di categoria `threat` con `lifecycle.state === 'active'` viene letto dal `WorldPresentationModel` e tradotto da `ThreatPresenceEffect` in uno stato visivo persistente e deterministico. Non si costruisce SequenceScheduler, non si muove il marker, non si aggiunge HUD o countdown.

CONCETTO CHIAVE — VISUAL VERB
- `show_threat_presence` è il primo "visual verb" del runtime: una `PresentationEffect` pura, config-driven e deterministica che traduce uno stato del mondo (`WorldEvent` threat attivo) in uno stato visivo (`PresentationOutput`).
- Un visual verb non è un'animazione, non è un HUD, non è un testo: è una funzione semantica tra `WorldPresentationModel` e percezione.
- L'output di `show_threat_presence` è persistente: tint + aura + marker statico a nord che rimangono visibili finché il threat è attivo.
- La transizione SAFE → manifesting → THREATENED è calcolata dal tick, non da animazione o wall clock.

ROADMAP RIFERIMENTO — A-E SEMANTIC VERBS + AMBIENT PRESENTATION
FOUNDATION ✅
    │
    ▼
A — `show_threat_presence` (questo task)
│   La minaccia è presente: tint + aura + marker statico a nord.
│   Nessun movimento, nessun HUD, nessun countdown, nessun SequenceScheduler.
    │
    ▼
B — `show_threat_arrival` (future)
│   La minaccia sta arrivando: marker che si muove dall'origine verso la regione.
    │
    ▼
C — `show_threat_communication` (future)
│   Il sistema comunica tempo residuo e urgenza (countdown, indicatori).
    │
    ▼
D — `show_threat_cinematic` (future)
│   Il runtime racconta l'evento attraverso una sequenza temporale (usa SequenceScheduler, ma resta un visual verb).
    │
    ▼
E — `Director Authoring` (future)
    Il designer compone e modifica i visual verb senza programmare.

ASSE PARALLELO — AMBIENT PRESENTATION
- `animate_clouds`, `animate_ocean`, `animate_wind`, `animate_fog`, `animate_vegetation`, `animate_sun`
- Dà vita alla mappa anche senza eventi importanti.
- Non racconta la minaccia; non deve essere confuso con `show_threat_arrival`.
- Placeholder e layer separati possono essere preparati in parallelo alla Milestone A.

FILE TARGET
- [nuovo] src/engine/world/presentation/effects/ThreatPresenceEffect.ts
- [nuovo] src/engine/world/presentation/config/threatPresenceEffectConfig.ts
- [nuovo] src/engine/world/presentation/config/presentationEffectRegistry.ts
- [modifica] src/engine/world/presentation/types.ts (opzionale: estendere solo se manca il tipo per effectIds sullo scenario)
- [modifica] src/engine/world/presentation/buildWorldPresentationModel.ts (filtrare activeEvents a eventi con lifecycle.state === 'active')
- [modifica] src/ui/idleVillage/config/presentationConfig.ts (scenario `threat` con `sequenceId: 'show_threat_presence'`, WorldEvent reale ed effetto `threat_presence`)
- [modifica] src/ui/idleVillage/hooks/useWorldPresentationRuntime.ts (registrare effetti dal registry in base allo scenario)
- [modifica] src/ui/idleVillage/components/presentation/PresentationDirectorShell.tsx (mini Output Debug Inspector)
- [modifica] public/locales/en/idleVillage.json (nuove chiavi per stato `threat_manifesting` e inspector)
- [nuovo] tests/unit/idleVillage/WorldPresentationRuntime.demo.test.ts
- [modifica] tests/unit/idleVillage/buildWorldPresentationModel.test.ts (aggiornare se activeEvents filtro cambia semantica)
- [esistente] src/docs/docs/plans/world_presentation_runtime_implementation_plan.md (changelog)

DIPENDENZE
- WORLD-PRESENTATION-RUNTIME-FOUNDATION (architettura e contracts già in place)
- IV-WORLD-SURFACE-001 / IV-WORLD-SURFACE-002 (renderer e world state)

SCENARIO FIXTURE
Scenario `threat` in `presentationConfig.ts` deve contenere un `WorldEvent` reale:

{
  id: 'goblin-threat-north',
  type: 'goblin_invasion',
  category: 'threat',
  lifecycle: { state: 'active', startAt: 0, endAt: 300 },
  data: { origin: 'north', regionId: 'enchanted_forest' }
}

Il `worldState` dello scenario può continuare a contenere `threat: { active: true }` per il mapping base `threatened`, ma l'effetto deve poter sovrascrivere `activeVisualStateId` durante la fase di manifestazione.

PROGRESSIONE TEMPORALE DETERMINISTICA
Tutti i valori (tick di fase, colori, opacity, posizione marker) vivono in `threatPresenceEffectConfig.ts` validato con Zod.

TICK 0..4
- activeVisualStateId: 'default' (SAFE)
- Nessun override, nessun runtime object

TICK 5..14
- activeVisualStateId: 'threat_manifesting' (aggiungere questo visual state al manifest)
- visualStateOverrides: tint_layer leggero su `vignette` + set_opacity parziale
- runtimeObjects: marker statico a nord (visibilità parziale)

TICK 15+
- activeVisualStateId: 'threatened'
- visualStateOverrides: tint_layer persistente su `vignette` + set_opacity finale
- runtimeObjects: marker statico a nord persistente

TICK 30+ conferma persistenza: stesso output di TICK 15.

CONTRATTO ThreatPresenceEffect
- `enabled(ctx)`: true se `ctx.model.activeEvents` contiene almeno un evento `category === 'threat'` con `lifecycle.state === 'active'`.
- `update(ctx)`: calcola fase da `ctx.tick`, legge config, restituisce `Partial<PresentationOutput>` con `activeVisualStateId`, `visualStateOverrides`, `runtimeObjects`.
- Nessun `mount`/`dispose` richiesto: la transizione è calcolata da `update` in base al tick.
- Nessun `Math.random`, `Date.now`, `performance.now`.
- Non muta mai `WorldState` o `ctx.model`.

REGISTRY EFFETTI
Creare `presentationEffectRegistry.ts` con factory `createThreatPresenceEffect(config)` e id `threat_presence`. Lo scenario `threat` dichiara `effectIds: ['threat_presence']`. `useWorldPresentationRuntime` risolve id da registry e registra effetti sul runtime. NO hardcoded effect nel hook.

MARKER STATICO
Prima versione: `RuntimeObject` con `location` derivata da `event.data.origin` attraverso la mappa `originPositions` in config, `renderMode: 'shape'` o `'sprite'`, `visual.tint` e `visual.glow` da config. Il marker non si muove; verifica solo che `runtimeObjects` arrivi a `WorldSurfaceRenderer` e sia visibile.

AURA/NEBBIA
Usare solo `visualStateOverrides`:
- `tint_layer` per colore threat sul layer target
- `set_opacity` per intensità
- `set_animation` opzionale per pulse/glow (NO particle system)

NO countdown, NO HUD, NO movimento in questo task.

ARCHITETTURA A DUE ASSI
`show_threat_presence` appartiene all'asse `SEMANTIC VERBS` (stato del mondo → percezione).  
L'asse `AMBIENT LIFE` (nuvole, mare, vento, nebbia, vegetazione, sole) è parallelo e indipendente: dà vita alla mappa ma non racconta la minaccia. Entrambi gli assi convergono in `OutputComposer` → `PresentationOutput` → `WorldSurfaceRenderer`.

VALIDAZIONE VISIVA — IL TEST FONDAMENTALE
La domanda non è "Il codice funziona?".  
La domanda è: "Guardando la mappa per 3 secondi, senza testo, capisco che qualcosa di pericoloso sta succedendo?"  
- Se sì → A è riuscita.  
- Se no → si agisce su tint, aura, marker, intensità, composizione visiva.  
Non si aggiunge movimento, HUD, countdown o cinematiche.

NOTA SULLA PERCEZIONE
Con una mappa quasi finita, il rischio principale è artistico, non tecnico. Un runtime perfettamente architettato può produrre un linguaggio visivo debole. Milestone A serve a validare il primo mattone visivo prima di ogni altra complessità.

OUTPUT DEBUG INSPECTOR
Aggiungere in `PresentationDirectorShell` un pannello laterale che mostri:
- activeVisualStateId
- numero di runtimeObjects
- numero di visualStateOverrides
- tick corrente

Usare i18n per le label (`presentation.inspector.*`) e SkinBadge/SkinScope per lo stile. Non creare componente separato se non necessario; inserire nella sidebar esistente.

OPERAZIONI DA ESEGUIRE
1. Aggiungere `threatPresenceEffectConfig.ts` con Zod schema: phaseTicks, colors, opacity, marker location/visual per `origin`, layer target, manifesting visual state id, threatened visual state id.
2. Aggiungere `presentationEffectRegistry.ts` con mappa id -> factory e helper `resolvePresentationEffect`.
3. Implementare `ThreatPresenceEffect.ts` con `enabled` e `update` che emettono la progressione temporale.
4. Aggiornare `buildWorldPresentationModel` per filtrare `activeEvents` a eventi con `lifecycle.state === 'active'` (aggiornare test se necessario).
5. Aggiornare `presentationConfig.ts` scenario `threat`: aggiungere `sequenceId: 'show_threat_presence'`, `events` con goblin threat e `effectIds: ['threat_presence']`. Aggiungere visual state `threat_manifesting` al manifest.
6. Aggiornare `useWorldPresentationRuntime` per registrare effetti dallo scenario tramite registry.
7. Aggiornare `PresentationDirectorShell` con Output Debug Inspector e chiavi i18n.
8. Scrivere `WorldPresentationRuntime.demo.test.ts`:
   - tick 0: activeVisualStateId 'default', no overrides, no runtimeObjects
   - tick 5: activeVisualStateId 'threat_manifesting', marker presente, tint/opacity parziali
   - tick 15: activeVisualStateId 'threatened', tint/opacity finali, marker persistente
   - tick 30: uguale a tick 15
   - replay con stesso seed/tick produce output identico
9. Eseguire safeguard suite: lint, test (scope demo + presentation), build:check, kanban:lint.
10. Salvare evidence log e aggiornare `world_presentation_runtime_implementation_plan.md` changelog.

OPERAZIONI VIETATE
- Non introdurre SequenceScheduler o orchestrazione sequence in questo task.
- Non implementare movimento/path interpolation del marker.
- Non aggiungere ThreatStatusIndicator, countdown o altro HUD.
- Non creare particle system o shader custom.
- Non mutare `WorldState` dal runtime o dagli effetti.
- `PresentationOutput` deve rimanere JSON-serializzabile.
- Nessun `Math.random`, `Date.now`, `performance.now` all'interno dell'effetto.
- Nessun valore hardcoded in `ThreatPresenceEffect`; tutto da config Zod.

ASSUNZIONI
- `WorldSurfaceRenderer` supporta `visualStateOverrides` e `runtimeObjects`.
- `WorldPresentationRuntime` ha registro effetti; `useWorldPresentationRuntime` è l'unico binding scenario/runtime.
- `buildWorldPresentationModel` può essere esteso per filtrare eventi attivi.

REGRESSION SAFEGUARDS
- npm run lint -- src/engine/world/presentation src/ui/idleVillage
- npm run test -- tests/unit/idleVillage/WorldPresentationRuntime.demo.test.ts tests/unit/idleVillage/WorldPresentationRuntime.replay.test.ts tests/unit/idleVillage/WorldPresentationRuntime.translation.test.ts tests/unit/idleVillage/buildWorldPresentationModel.test.ts tests/unit/idleVillage/OutputComposer.test.ts
- npm run build:check
- npm run kanban:lint

KANBAN COMPLETION
1. Stato Kanban per `WORLD-PRESENTATION-RUNTIME-DEMO` → "Completato" con data.
2. Evidence `test-results/WORLD-PRESENTATION-RUNTIME-DEMO-<date>.log`.
3. Changelog in `src/docs/docs/plans/world_presentation_runtime_implementation_plan.md`.

NOTE
- Piano di riferimento: `src/docs/docs/plans/world_presentation_runtime_implementation_plan.md` v1.4 (visual verb + ambient axis).
- RFC di riferimento: `src/docs/docs/plans/world_presentation_runtime_rfc.md` v1.4.
- Execution hint: verified.

EVIDENCE LOG
- test-results/WORLD-PRESENTATION-RUNTIME-DEMO-YYYY-MM-DD.log
```

## Expected Output

- `ThreatPresenceEffect` con `enabled`/`update` config-first e determinista
- `presentationEffectRegistry.ts` con factory per effetti
- Scenario `threat` con `WorldEvent` reale ed effetto `threat_presence`
- `useWorldPresentationRuntime` che carica effetti dallo scenario tramite registry
- `PresentationDirectorShell` con Output Debug Inspector
- `WorldPresentationRuntime.demo.test.ts` passante con progressione tick 0/5/15/30
- Evidence log

## Dependencies

- WORLD-PRESENTATION-RUNTIME-FOUNDATION
- IV-WORLD-SURFACE-001
- IV-WORLD-SURFACE-002

## Timestamp

2026-07-22T11:15:00+02:00

## Executor

Cascade (manual)
