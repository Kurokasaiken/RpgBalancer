---
id: quest-run-window
kind: component
role: ui-component
tier: 2
root_file: src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx
scope_files:
  - src/ui/idleVillage/audio/questTheatreAudio.ts
  - src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx
  - src/ui/idleVillage/components/gameFrame/questBag.ts
  - src/ui/idleVillage/questS1Lab/questTheatreSequencer.ts
  - src/ui/idleVillage/questS1Lab/render/cameraEval.ts
  - src/ui/idleVillage/questS1Lab/render/depthTransform.ts
  - src/ui/idleVillage/questS1Lab/render/sceneManifest.ts
  - src/ui/idleVillage/questS1Lab/render/trauma.ts
fast_checks:
  - tests/unit/idleVillage/combatStrip.test.tsx
  - tests/unit/idleVillage/questBag.test.tsx
  - tests/unit/idleVillage/questCheckOptions.test.tsx
  - tests/unit/idleVillage/questCinematics/atmosphereLayer.test.tsx
  - tests/unit/idleVillage/questCinematics/cameraEval.test.ts
  - tests/unit/idleVillage/questCinematics/edgeSafety.test.ts
  - tests/unit/idleVillage/questCinematics/runtimeInvariants.test.tsx
  - tests/unit/idleVillage/questCinematics/sceneManifest.test.ts
  - tests/unit/idleVillage/questCinematics/trauma.test.ts
  - tests/unit/idleVillage/questRunWindow.test.tsx
  - tests/unit/idleVillage/questTheatreSequencer.test.ts
e2e_checks:
  - tests/e2e/idleVillage/questCinematicsShowcase.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/audio/questTheatreAudio.ts
  - src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx
  - src/ui/idleVillage/components/gameFrame/questBag.ts
  - src/ui/idleVillage/questS1Lab/questTheatreSequencer.ts
  - src/ui/idleVillage/questS1Lab/render/cameraEval.ts
  - src/ui/idleVillage/questS1Lab/render/depthTransform.ts
  - src/ui/idleVillage/questS1Lab/render/sceneManifest.ts
  - src/ui/idleVillage/questS1Lab/render/trauma.ts
invariants:
  - id: quest-window-immediate-hidden-loot
    source: code-baseline
    source_ref: PLAN-054
    statement: Nodo loot immediate:true si sblocca all'arrivo senza attesa mentre i nodi normali rispettano nodeTicks.
    test_refs:
      - tests/unit/idleVillage/questRunWindow.test.tsx
  - id: quest-window-header-icon-only
    source: code-baseline
    source_ref: PLAN-054
    statement: Le pill header della run-window sono bottoni icon-only con nomi accessibili e tooltip.
    test_refs:
      - tests/unit/idleVillage/questRunWindow.test.tsx
  - id: quest-window-abandon-icon-tooltip
    source: code-baseline
    source_ref: PLAN-054
    statement: Il toggle abbandono della run-window è icon-only con nome accessibile e tooltip.
    test_refs:
      - tests/unit/idleVillage/questRunWindow.test.tsx
  - id: quest-window-minimised-space-between
    source: code-baseline
    source_ref: PLAN-054
    statement: La plaque minimizzata usa layout space-between a larghezza piena con controllo restore allineato a destra.
    test_refs:
      - tests/unit/idleVillage/questRunWindow.test.tsx
  - id: quest-window-timebar-checkpoints-monotone
    source: code-baseline
    source_ref: PLAN-054
    statement: La TimeBar renderizza i checkpoint di fase lungo la barra di progresso in ordine monotono.
    test_refs:
      - tests/unit/idleVillage/questRunWindow.test.tsx
  - id: quest-window-1280x720-no-inner-scroll
    source: code-baseline
    source_ref: PLAN-054
    statement: >-
      Il locked frontier renderizza phaseLocked una sola volta (fuori da quest-window-stage) — nessuno scroll interno a
      1280×720.
    test_refs:
      - tests/unit/idleVillage/questRunWindow.test.tsx
  - id: quest-window-post-settle-certified
    source: code-baseline
    source_ref: PLAN-054
    statement: >-
      Il breathing 2.5D post-settle è C1-continuo a durMs, muove camVec/zoom dopo durMs e resta nei bound UV
      certificati.
    test_refs:
      - tests/unit/idleVillage/questRunWindow.test.tsx
  - id: R-234-verdict-once
    source: director-bug
    source_ref: R-234
    statement: >-
      Nel cluster il verdetto di un check si dice una volta sola, nella Verdict Card dell'ala destra; il beat della
      finestra tiene solo il titolo del tentativo (guida quest §1, PLAN-067 T-A4)
    test_refs:
      - tests/unit/idleVillage/questRunWindow.verdictOnce.test.tsx
  - id: R-239-check-held-window
    source: director-bug
    source_ref: R-239
    statement: >-
      Check attivo e finestra minimised: la colonna astrolabe resta orfana sulla mappa alla vecchia geometria wing;
      finestra chiusa con X durante il check: la UI evapora (bridge muore con la finestra, nessun fallback monta). Fix:
      minimised propagato alla page (wings giu', overlay fallback), close disabilitato mentre un check e' held
    test_refs:
      - tests/unit/idleVillage/questRunWindow.checkHeld.test.tsx
  - id: R-239-theatre-entry
    source: director-bug
    source_ref: R-239
    statement: >-
      Ingresso teatro quasi nero ~1100ms: velo CenterApertureReveal authored troppo chiuso/lungo (inset 46%, revealMs
      1400) + scene art non precaricata (decode a freddo). Fix: revealStartInsetPct=34 + revealMs=900 in config,
      NODE_ART warm-decodato al boot
    test_refs:
      - tests/unit/idleVillage/questTheatreEntry.test.ts
  - id: R-239-stage-node-atomic
    source: director-bug
    source_ref: R-239, R-245
    statement: >-
      Arte teatro desincronizzata dal nodo in scena: src da activeSceneNodeId latched (avanza col beat, mai col commit
      scelta). R-245 (Director 2026-10-21): la caption diegetica PLAN-050 §6 e' RIMOSSA — mai testo sopra l'artwork; il
      frame renderizza solo art+fx. Identita' scena nella colonna BeatStage.
    test_refs:
      - tests/unit/idleVillage/questRunWindow.stageNode.test.tsx
  - id: R-239-choices-fold
    source: director-bug
    source_ref: R-239
    statement: >-
      Lista scelte clippa una riga a meta': cap fisso choicesMaxHeightPx non allineato al pitch riga + strip
      frontierLocked dentro lo scrollable. Fix: cap arrotondato al multiplo del pitch misurato (rAF/ResizeObserver),
      strip pinnata sopra
    test_refs:
      - tests/unit/idleVillage/questRunWindow.choicesCap.test.tsx
  - id: R-239-time-bar-label
    source: director-bug
    source_ref: R-239
    statement: >-
      Time bar saturata ambigua: '110/110 TICKS' a run viva (pieno-in-attesa) leggeva come finita + jargon engine. Fix:
      questRunTimeLabel -> giorni con ~stima in marcia, stato awaiting nominato a saturazione, esito a fine
    test_refs:
      - tests/unit/idleVillage/questRunTimeLabel.test.ts
  - id: R-239-combat-legend
    source: director-bug
    source_ref: R-239
    statement: combat pips senza polarita' leggibile (downed=standing) e score chip «85/50» criptico
    test_refs:
      - tests/unit/idleVillage/questCombatLegend.test.tsx
  - id: quest-run-window.INV-1
    source: director-bug
    source_ref: R-241
    statement: >-
      R-241 B1c: durante check/harm beat activeSceneNodeId cadeva su run.nodeId (art swap istantaneo al click) — l'art
      cambia solo quando la scene beat va in scena
    test_refs:
      - tests/unit/idleVillage/questRunWindow.stageArtLatch.test.tsx
  - id: quest-run-window.INV-3
    source: director-bug
    source_ref: R-241
    statement: >-
      R-241 B3c: advancePresentation usava skipToResult sul check held — deve chiamare progress (throw-or-skip) per non
      saltare l'animazione
    test_refs:
      - tests/unit/idleVillage/questRunWindow.checkProgress.test.tsx
  - id: R-239-header-tooltips
    source: director-bug
    source_ref: R-239
    statement: >-
      icone header cluster con hint incoerenti (title nativi mutevoli); nessun tooltip stilato consistente su
      roster/bag/log/check-options/minimise/close
    test_refs:
      - tests/unit/idleVillage/questRunWindow.headerTooltips.test.tsx
  - id: R-239-contrast
    source: director-bug
    source_ref: R-239
    statement: >-
      toni status wound/death usati come testo nudo: 2.5-2.8:1 su lacquer (misura live + matrice token); solo i chip
      erano liftati (R-234)
    test_refs:
      - tests/unit/idleVillage/questContrast.test.ts
  - id: quest-run-window.INV-4
    source: director-bug
    source_ref: R-242
    statement: >-
      Close+reopen a run viva: il cursore beat viene da useQuestRun.beatCursorRef — la finestra riapre sul beat held
      (stessa scena latched, stesse ali cluster) e NON ripropone beat consumati; epochRef del Theater seeda il clock di
      mount cosi' il shot replaya coerente coi layer WAAPI
    test_refs:
      - tests/unit/idleVillage/questRunWindow.test.tsx
      - tests/unit/idleVillage/questS1Lab/beatSequencer.test.ts
  - id: quest-run-window.R-254-sample-wins
    source: director-bug
    source_ref: R-254
    statement: >-
      sample decodificato vince sulla voce synth; fetch/decode fallito o non ancora pronto mantiene la voce synth
      (BV-13, la cue non si perde mai)
    test_refs:
      - tests/unit/idleVillage/questTheatreSequencer.test.ts
  - id: quest-run-window.R-254-riser-bed
    source: director-bug
    source_ref: R-254
    statement: >-
      il riser dello spin loopa il bed decodificato (vento reale) sotto lo sweep bandpass; il noise synth resta fallback
      pre-load
    test_refs:
      - tests/unit/idleVillage/questTheatreSequencer.test.ts
  - id: quest-run-window.R-254-sample-fallback
    source: director-bug
    source_ref: R-254
    statement: fetch/decode del sample fallito o assente mantiene la voce synth — la cue suona sempre
    test_refs:
      - tests/unit/idleVillage/questTheatreSequencer.test.ts
  - id: R-253-stage-top-flow
    source: director-bug
    source_ref: R-253
    statement: >-
      Bottom-anchor respinto dal Director: testo deve sedere sotto l'art e TUTTO (immagine+testo+opzioni) visibile
      insieme; la finestra quest può andare sopra l'HUD. Vigente (R-259): il testo fluisce dall'alto dentro il box
      (mai ancorato al bordo inferiore, nessun flex-end), clusterEnvelope in regime run si estende sulle bande chrome
      per questChromeOverlap, stack centrato
    test_refs:
      - tests/unit/idleVillage/questRunWindow.stageAnchor.test.tsx
  - id: R-253-timebar-adaptive-phases
    source: director-bug
    source_ref: R-253
    statement: >-
      La TimeBar non si adatta se il journey acquisisce una fase in piu': i checkpoint enumeravano solo [0,
      beats.length). Fix: i beat visitati oltre range creano marker + il totale fase adatta
    test_refs:
      - tests/unit/idleVillage/questS1Lab/questSchedule.adaptivePhases.test.ts
  - id: R-259-textbox-fit
    source: director-bug
    source_ref: R-259
    statement: >-
      Le stage narratif hug son contenu (maxHeight cap, pas de height fixe) : les choix se collent a la fin du texte,
      scroll interne seul, overflowX hidden
    test_refs:
      - tests/unit/idleVillage/questRunWindow.stageHeight.test.tsx
  - id: R-259-no-component-scroll
    source: director-bug
    source_ref: R-259
    statement: 'La colonne de contenu ne scrolle jamais (overflow hidden) : seule la box texte scrolle en interne'
    test_refs:
      - tests/unit/idleVillage/questRunWindow.stageAnchor.test.tsx
  - id: R-259-centered-stack
    source: director-bug
    source_ref: R-259
    statement: >-
      Art+texte+choix forment un seul stack verticalement centre (justifyContent center) : le slack se repartit
      au-dessus/en-dessous
    test_refs:
      - tests/unit/idleVillage/questRunWindow.stageAnchor.test.tsx
  - id: R-239-chrome-select
    source: director-bug
    source_ref: R-239
    statement: >-
      Trascinare la finestra non deve selezionare testo: la placca è user-select: none.
    test_refs:
      - tests/unit/idleVillage/questCopyLabels.test.tsx
  - id: R-245-no-text-on-art
    source: director-bug
    source_ref: R-245
    statement: >-
      Il frame del teatro non contiene nodi testo — mai testo sopra l'artwork (R-245).
    test_refs:
      - tests/unit/idleVillage/questRunWindow.stageNode.test.tsx
  - id: quest-run-window.INV-6
    source: director-bug
    source_ref: R-263
    statement: >-
      Una fase di viaggio non possiede nodi scenario — con coda drenata il teatro mostra l'art di gamba
      (JOURNEY_LEG_ART: andata=cancello, ritorno=valle) invece del nodo latched; una scene beat montata vince
      sempre e un run ended mantiene l'art di arrivo
    test_refs:
      - tests/unit/idleVillage/questRunWindow.journeyLegArt.test.tsx
---
# quest-run-window

Unità `ui-component` (tier 2, default) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Superficie quest completa — implementazione di proprietà WS-3 (planner PASS) e WS-4 (in corso).

## Scope

- `src/ui/idleVillage/audio/questTheatreAudio.ts`
- `src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`
- `src/ui/idleVillage/components/gameFrame/questBag.ts`
- `src/ui/idleVillage/questS1Lab/questTheatreSequencer.ts`
- `src/ui/idleVillage/questS1Lab/render/cameraEval.ts`
- `src/ui/idleVillage/questS1Lab/render/depthTransform.ts`
- `src/ui/idleVillage/questS1Lab/render/sceneManifest.ts`
- `src/ui/idleVillage/questS1Lab/render/trauma.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.
- PLAN-043 WS-5 scheda `quest-ws34-boundary` (batch B5-tools, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — keep — nessun tocco in WS-5; eventuali fix passano per WS-3/WS-4 o D9 esplicita.
- PLAN-043 WS-5 scheda `bagstrip-orphan` (batch B5-tools, ratified); decisione — Director "approvo" 2026-10-18 — ratifica audit WS-5, disposizioni come proposte; proposta — remove — a meno che il bag strip non rientri nel design WS-4 quest window; stato — resolved — remove eseguito (componente, export morti, chiavi i18n, test migrati a questBag.test.tsx).

<!-- /plan054:generated -->
