# Quest UI Component Guide

Guida prescrittiva per costruire schermate di quest (lab S1 e successivi). Nasce dal
redesign cockpit di `QuestS1LabPage` (PLAN-023, artifact multi-AI
`.mw/runs/20261007-quest-s1-lab-ui-redesign/artifact-r005.md`). Vale per ogni nuova
superficie quest.

> **Componente battezzato su `/game` (Director 2026-10-09, PLAN-019-S2 D-F):**
> `QuestRunWindow` (`src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx`)
> è la superficie canonica della quest in corso — Regia/menu Pannelli (tasto Q),
> motore `useQuestRun`/`questRun.ts`; il teatro PLAN-025 converge dentro di esso.
> Le regole di questa guida si applicano a `QuestRunWindow` e a ogni sua
> evoluzione.

> **Superfici e colori**: questa guida governa *layout e pipeline di presentazione*.
> Per estetica, superfici (`HudPlaque`), token `--skin-hud-*`, controlli e tipografia
> il riferimento è `src/docs/docs/design/hud_component_guide.md` —
> in particolare §6b «Schermate d'azione a pagina intera», scritta per questo lab
> (PLAN-024). Per gli slot meccanici della pianificazione il metallo è la rampa
> **worn brass** (`--skin-hud-brass-*` + profilo bloom `brass` in `bloomEffect.ts`,
> PLAN-043 WS-0/WS-1) — non la rampa Lacquer Atlas.

## 1. Layout: cockpit a tre regioni, zero scroll

Una schermata di quest risponde in uno sguardo a tre domande: *dove sono, chi sta
per pagare, cosa posso fare*. Il layout è quindi:

```
┌──────────────────────────────────────────────────────────┐
│ context strip  (titolo, seed, oro, ritmo, controlli)     │
├──────────────────────────────────────────────────────────┤
│ formazione (party slot)   │ scena/astrolabio │ orda      │
├──────────────────────────────────────────────────────────┤
│ Action Zone: opzioni → cinematica → verdict → prossima   │
│             azione; cintura consumabili in fondo          │
└──────────────────────────────────────────────────────────┘
```

- **Zero scroll** nel viewport di riferimento (1366×768). Le dimensioni verticali
  arrivano da `questLabPresentation.layout` (contextStripVh / stageBandVh /
  actionZoneVh), mai hardcoded nel JSX.
- **Le opzioni non scrollano mai** nel caso normale (Director 2026-10-13):
  l'action zone deve contenere header + body + belt + tutte le opzioni del
  nodo. Budget attuale 6/36/58 — la stage band (flex-1, min-h-0) cede
  spazio per prima, croppa l'art mai i pulsanti. A ~650px di viewport le
  opzioni restano interamente leggibili (scroll residuo ≤ 7px); sotto,
  scrolla solo la lista opzioni, mai l'intera zona.
- Il **log/cronaca è un drawer**, non una colonna a pari larghezza. La decisione
  domina lo schermo; la consultazione è occasionale.
- L'**Action Zone è stateful**: `idle` (opzioni) → `presenting` (cinematica) →
  `verdict` (card) → di nuovo `idle`. Il verdict *sostituisce* il contenuto della
  zona, non è una banda extra.

## 2. La regola d'oro: eventi strutturati, mai parsing del log

La UI anima **dati strutturati emessi dall'engine**, non testo:

- `ResolvedCheck` → `id`, `harms: HarmEvent[]`, `exposure`, `kills`,
  `authoredText`/`harmLines` (già splittati), `transit`, `flavor`.
- `QuestRunState.recentHarms` → danni ambientali (fuori dai check).

Chi ha bisogno di un'informazione nuova la aggiunge al contratto engine, non
parsa `outcomeText` né il chronicle.

## 3. Presented vs committed: la pipeline di presentazione

L'engine **committa subito**; la UI **presenta** in beat:

`cinematic → verdict → kills → harm (uno alla volta) → settle → settled`

- Un solo reducer (`usePresentationTimeline` in `questS1Lab/presentationTimeline.ts`),
  keyed by `resolution.id` (o seq dell'ultimo harm ambientale).
- **Invariante:** `presentedHp == committedHp` dopo flush o settle — testata in
  `presentationTimeline.test.ts`.
- Ogni accelerazione (skip, fast, flush) attraversa lo stesso reducer. **Mai**
  un secondo canale che muta lo stato mostrato.
- Flush forzato su `visibilitychange` e unmount. `inputGuardMs` dal config
  separa lo skip dal click sull'azione successiva.
- Skip **progressivo**: un solo bottone che avanza di beat in beat; premuto in
  rapida successione equivale a flush-all.

## 4. Il canale danno (un canale, due stati)

- **Floater transiente**: `−N` che sale e svanisce sopra la card bersaglio
  (`FloatingText`, timing/stagger/max da `PRES.damage`).
- **Chip delta duraturo**: `−12` pinnato sulla card fino all'azione successiva —
  il residuo che risponde "chi ha preso quanto" anche a skip avvenuto.
- **Ghost layer sulla barra HP**: il segmento perso drena verso il nuovo valore.
- **Tombstone + rank-shift**: alla morte lo slot mostra la lapide; i vivi
  chiudono i ranghi verso l'orda e i valori di exposure ricalcolano.

L'HP nel verdict card NON si ripete in prosa — va sul canale visivo. La card
porta solo chip non-HP (kill, trofei, flag).

## 5. Formazione ed esposizione

- Party in **ordine fisico** (formazione Darkest-Dungeon-like): il front-liner è
  adiacente all'orda, non al centro.
- Exposure = probabilità per singolo hit: icona tier + pips + % + banda superiore
  della card. Tier da `PRES.formation.exposureTiers`.
- **Spent marker**: pallino su chi è già stato colpito nel turno corrente.
- Orda: **token anonimi** + `×N/total` + intent glyph `⚔×k` (hits/turno è
  costante di spec, noto prima del click).

## 6. Astrolabio: quando e come

- `DestinyAstrolabeV62` è il componente canonico. Estensioni di presentazione
  (`speed`, `skipToResult`, docked) si aggiungono al kit/engine, non si forkano.
- **Narrativa**: centrato, overlay della scena, full-motion.
- **Combattimento**: dockato nello stage-gap tra formazione e orda — il giocatore
  tiene gli occhi su HP ed esposizione mentre la ruota gira.
- Il verdetto è già deciso dall'engine: `skipToResult` è gratuito e sempre onesto
  (`honestTargetPos` garantisce coerenza palla/verdetto).

## 7. Stakes e consumabili: niente fasi separate

- **Stakes pre-click nel tooltip dell'opzione** (hover/focus): success bound,
  ferita%, morte%, pedaggio deterministico, contributor stat con icone.
- **Cintura consumabili** nella Action Zone: click = arm per il *prossimo* check.
  Una volta armato, tutti i tooltip mostrano il delta live (`45→60 ✦`). L'engine
  consuma solo al commit. Nessun modale, nessuna fase.

## 8. Config e primitive

- Ogni timing/dimensione/soglia vive in `questLabPresentation.ts` (Zod) o nel
  config di dominio. **Zero numeri nel JSX.**
- Superfici: primitive canoniche (`Materic*`/`SkinScope`) dove esistono; i layout
  di cockpit usano markup ad hoc solo per la griglia di regione (non è una
  superficie materica).
- Reduced motion: `PRES.motion.defaultMotionLevel` — floaters/ghost degradano a
  cambio di stato immediato.

## 9. i18n

Ogni stringa visibile va in `idleVillage.questS1Lab.*` (en + it-IT + pseudo per
le chiavi nuove). Icone stat via `STAT_ICONS`/`getStatIconComponent` in
`questRun.ts` — la stessa icona in preview, titolo check e card party.

**Plurale:** il progetto usa `i18next-icu` — i suffissi `_one`/`_other` **non
risolvono** (chiave grezza a schermo). Usare la sintassi ICU
`{count, plural, one{…} other{…}}` in una singola chiave.

## 10. La pipeline dei beat (PLAN-025, dentro `QuestRunWindow`)

Sopra le regole §2–§3 c'è un livello più alto: **`beatSequencer.ts`**
(`questS1Lab`). L'engine committa sul log (`NODE`/`CHECK`/`WOUND`/`DEATH`/`HARM`/
`QUEST_END`); `projectBeats(mark, after)` proietta **solo il diff committato** in
beat ordinati con id stabili (`scene-N`, `chk-N`, `harm-seq`, `end`, `recap`):

- una morte = un beat: tre morti in un commit scorrono **membro per membro**,
  mai in un paragrafo;
- oltre `questWindow.beats.maxQueue` (config Zod) la testa compatta in un beat
  `recap` — il reopen non ri-traversa la storia;
- `useBeatCursor` auto-avanza col timing da config; click/Enter/Spazio = skip
  (D-8), `flush` = «vai al bivio»; **reduced-motion = drain istantaneo**.

Mentre la coda presenta, `BeatStage` sostituisce scelte/sacca (input gated) e i
beat `scene` tagliano l'immagine del teatro (`nodeKind` propagato).

**CinemaFx** (`skins/primitives/cinemaFx.tsx`): `Letterbox` (CSS transition,
token lacquer), `EdgeFlash` (WAAPI, keyed per beat), `TypewriterText`,
`DamageFloater`. La mappa `fxForBeat` è l'unica fonte beat→fx; letterbox solo
sui **cambi di tono** (harm/combat scene, check con kills, morte, end). Tutto
in `quests/questTheatreFx.ts` (Zod), silenziabile per canale e per trigger.

**CombatStrip** (in `QuestRunWindow`, solo nodi `combat`): pips orda
(`goblinLeft`) + intent (`nextCombatHits`), celle membro `nome + barra HP +
esposizione%` (`currentExposure`, max in danger), cella del colpito marcata +
`DamageFloater` durante l'harm beat.

**Frontiera v27**: `submitCommand`/`matureReady` nel dominio — un comando alla
volta, nodi `info`/`harm` maturano a `readyAt`, gli effetti atterrano alla
maturazione, catch-up deterministico. Persistenza via `PersistenceService`
(`idleVillage.questRun.<questId>`, `engineSchemaVersion=2`). Route su
adapter reale: `/game` (canonica), `/quest-window-lab` (componente isolato).
La superficie parallela `/game-frame-theatre` è stata smontata (PLAN-025
T-012, rimozione totale 2026-10-09).

## 12. Planner spedizione e POI quest detail (v23, PLAN-043 WS-3, R-223)

`QuestExpeditionDetail` è la superficie di composizione prima della partenza;
`QuestRunWindow` resta la quest già avviata. Mantieni i due contratti distinti:

- **Party**: le PgCard del roster si trascinano direttamente sui castoni.
  Attivare un castone vuoto può aprire il Selection Tray per la scelta da
  tastiera/click; non duplicare l'accesso con un pulsante «Companions» nel rack.
- **Loadout**: il pulsante pouch apre il `VillageStashPanel` del villaggio.
  L'attivazione di uno slot borsa vuoto apre invece il Selection Tray per
  scegliere l'item. I due controlli non sono intercambiabili.
- **Esposizione**: sotto ogni slot occupato si mostra il valore numerico del
  profilo posizionale di `QUEST_RULES.md` §3 (1 residente = 100%; 2 = 20%/80%).
  È la quota di impatti in arrivo assegnata dalla posizione, non la probabilità
  Forecast di ferita/morte: la colonna Forecast resta l'unica fonte per quelle
  percentuali. La legenda è persistente e neutra (senza semantica rosso/verde);
  `TESTA`/`CODA` restano nel nome accessibile del valore.
- **Forecast**: ogni configurazione committata avvia subito la simulazione
  deterministica e chunked; niente debounce dopo il drop/click. Il calcolo
  rispetta `QUEST_PLANNING.forecastBudgetMs` (p95 300ms); delta e stato
  computing appartengono alla colonna pinned approvata in PLAN-043 WS-3
  artifact-r005.
- **Estrazione**: il ritratto resta visibile mentre il castone esegue il hold
  e il bezel completa la sequenza. Il token lascia lo slot solo quando
  `onExtracted` trasferisce la proprietà alla flight condivisa.
- **Minimizzato**: il pill è centrato nel viewport; il controllo di ripristino
  è il controllo più a destra e la chiusura resta disponibile accanto.

Le verifiche comportamentali collegate sono
`tests/e2e/idleVillage/r223QuestUiRegressions.spec.ts`,
`tests/e2e/idleVillage/gameQuestExpedition.spec.ts` (drop reale) e
`tests/unit/idleVillage/questExpeditionBag.test.tsx`.

## 11. Contratto rev.2 (R-199, 2026-10-16)

- **Skip implicito, nessun pulsante**: lo stage avanza/salta il beat su click
  ovunque o su *qualunque* tasto; gli eventi da controlli interattivi
  (`isInteractiveTarget`: bottoni, input, l'astrolabe) non avanzano. Il vecchio
  `<button>` Continue (D-8) è ritirato — stesso path reducer, a11y via
  aria-live + focus handoff.
- **Companion chiusi di default**: `party`/`belt`/`log` partono da
  `questWindow.companionsDefaultOpen` (false) — revoca esplicita del
  «tutto visibile» di R-196. Il trigger della Belt vive **accanto alle
  scelte** (`quest-action-strip`), non in header.
- **Belt a righe (R-244, 2026-10-21)**: `QuestBeltPlaque` non è più
  icona-pura — ogni oggetto è una riga `medaglione icona + nome + effetto
  (`item.descKey`) + qualifier di stato`, la riga intera è l'area di
  arm/disarm (`aria-pressed`); i passivi restano righe non-toggle
  (`data-belt-status="passive"`). Il micro-belt inline accanto alle scelte
  resta icon-only via `BeltItemChips` (dual-affordance WS-4 invariata).
  Opt-out skin su `[data-belt-rows]` in `skinScope.css`; contatore items in
  header come il roster.
- **Abbandono**: icona `ico-gust` in header (prima di minimize/close) →
  conferma inline «Sei sicuro…» → `abandon()` sull'hook → `flee` engine
  (ritirata = quest fallita, bottino raccolto resta — QUEST_RULES).
- **Tempo**: `questWindow.durationDays` (5) → `nodeTicks` via
  `useQuestExpeditionSession`; ogni `waiting`/`pending` arma `readyAt` —
  scelte e fasi future **visibili ma non committabili** finché il clock non
  matura (`availableOptions` le marca disabled). La barra fasi segue lo stesso
  span.
- **Check**: `DestinyAstrolabeV62Standalone` docked sopra il teatro mentre il
  beat check presenta; `QuestCheckOptionsPanel` (icona `ico-spark` in header,
  persistito `questCheckOpts` via PersistenceService) decide `skipIntro`
  (→`throw()`) e `skipCheck` (→ l'astrolabe non si monta). Verdetto **sempre**
  engine (`ResolvedCheck`), l'astrolabe solo dipinge; il beat tiene `hold`
  finché l'animazione non atterra (`beats.checkHoldMs`/`checkVerdictMs`).
- **Esiti fuori**: a run finito e beat presentati, `QuestRewardPopup` si apre
  a **livello pagina** (`game-frame-pixi`), placca `HudPlaque` fluttuante
  **non modale** (no backdrop/`aria-modal`, mappa visibile, draggable):
  reveal staged `rewardPopup.stageMs` (esito → sezioni `QuestEpilogue` →
  Chiudi), click/tasto anticipa lo stadio, `Esc` chiude con focus-return e
  valgono le stesse semantiche di dismiss del report (settled-run clear +
  release loadout + consumo POI). `QuestEpilogue` non è più renderizzato
  dentro lo stage della window — questa è la deroga alla direzione B di v27
  («ospita il reward panel»), richiesta esplicita del Director in R-199.

## 12. Planner spedizione e POI quest detail (v23, PLAN-043 WS-3, R-223)

`QuestExpeditionDetail` è la superficie di composizione prima della partenza;
`QuestRunWindow` resta la quest già avviata. Mantieni i due contratti distinti:

- **Party**: le PgCard del roster si trascinano direttamente sui castoni.
  Attivare un castone vuoto può aprire il Selection Tray per la scelta da
  tastiera/click; non duplicare l'accesso con un pulsante «Companions» nel rack.
- **Loadout**: il pulsante pouch apre il `VillageStashPanel` del villaggio.
  L'attivazione di uno slot borsa vuoto apre invece il Selection Tray per
  scegliere l'item. I due controlli non sono intercambiabili.
- **Esposizione**: sotto ogni slot occupato si mostra il valore numerico del
  profilo posizionale di `QUEST_RULES.md` §3 (1 residente = 100%; 2 = 20%/80%).
  È la quota di impatti in arrivo assegnata dalla posizione, non la probabilità
  Forecast di ferita/morte: la colonna Forecast resta l'unica fonte per quelle
  percentuali. La legenda è persistente, il valore è neutro (senza semantica
  rosso/verde) e `TESTA`/`CODA` restano nel nome accessibile del valore.
- **Forecast**: ogni configurazione committata avvia subito la simulazione
  deterministica e chunked; niente debounce dopo il drop/click. Il calcolo
  rispetta `QUEST_PLANNING.forecastBudgetMs` (p95 300ms); delta e stato
  computing appartengono alla colonna pinned approvata in PLAN-043 WS-3
  artifact-r005.
- **Estrazione**: il ritratto resta visibile mentre il castone esegue il hold
  e il bezel completa la sequenza. Il token lascia lo slot solo quando
  `onExtracted` trasferisce la proprietà alla flight condivisa.
- **Minimizzato**: il pill è centrato nel viewport; il controllo di ripristino
  è il controllo più a destra e la chiusura resta disponibile accanto.

Le verifiche comportamentali collegate sono `tests/e2e/idleVillage/r223QuestUiRegressions.spec.ts`,
`gameQuestExpedition.spec.ts` (drop reale) e `tests/unit/idleVillage/questExpeditionBag.test.tsx`.

## 13. Run window: contratti R-241 (2026-10-21)

Cinque regressioni Director fissate su `/game` — causa radice in
`.mw/bugs/20261021-quest-run-window-five/bug.md`, verifica in
`.mw/runs/r241-quest-run-window-five/`.

- **Scena atomica, mai swap al click** (`quest-run.INV-2`,
  `beat-sequencer.INV-2`, `quest-run-window.INV-1`): il percorso
  `next: 'CHECK:<id>'` committa il check node in `visitedNodes` **con** il
  suo `NODE` log (invariante visita↔NODE ripristinata); i nodi `kind:'check'`
  non emettono scene beat — la scene beat si lega al nodo d'arrivo reale.
  In `QuestRunWindow` la scena mostrata (`activeSceneNodeId`, fonte unica
  per l'art) è **latched**: si muove solo quando una scene beat va in
  scena o la coda drena alla frontiera, mai quando `run.nodeId` committa.
  R-245 (Director 2026-10-21): la caption diegetica sull'immagine è
  **rimossa** — il teatro non dipinge mai testo sopra l'artwork; titolo e
  corpo scena vivono nella colonna narrativa (`BeatStage`) sotto il frame.
- **Stage narrativo ad altezza fissa** (`quest-run-window.INV-2`): resting
  stage e `BeatStage` usano entrambi `height: questWindow.stageMaxHeightPx`
  con `overflowY:auto` **e `flexShrink:0`** — senza il lock di shrink il
  flex parent comprimeva il beat a ~69px live; scelte/micro-belt/footer non
  si spostano con la lunghezza del testo.
- **Click sul board = throw-then-skip** (`quest-skill-check-column.INV-1`,
  `quest-skill-check-overlay.INV-1`, `quest-run-window.INV-3`): colonna e
  overlay espongono `progress()` sul bridge — primo click `throw()`
  (l'engine fa no-op se già in `the-spin`/`resolution`), i click successivi
  `skipToResult()`. `advancePresentation` usa `progress()`, mai skip
  diretto. Una memoria di lancio per-checkKey copre il gap in cui
  `data-state` non è ancora flushato.
- **Luci lente da parcheggiato** (`quest-skill-check-column.INV-2`): con
  `data-astro-idle="parked"` tutte le animazioni si fermano **tranne**
  `.rays`, che gira a `skillCheck.parkedRaysDurationMs` (config); reduced
  motion la ferma comunque; il parcheggio rAF del canvas (BV-04) è intatto.
- **Roster in quest = status, non planning** (`quest-party-roster-panel.INV
  R-241-roster-status-only`, `use-quest-poi-session.INV-1`,
  `game-frame-pixi.INV-3`): due superfici. Il **party roster della quest**
  (`quest-party-toggle` → `QuestPartyRosterPanel`, la superficie che il
  giocatore apre a run viva) monta `PgCard` con `compatibilityState="idle"`
  esplicito — `undefined` non è `idle` e dipingeva «Nessuno slot
  compatibile» su ogni membro. Il **roster villaggio** (sospeso sotto il
  regime run, mounted-hidden): `getResidentCompatibility` si astiene mentre
  il ciclo quest è vivo (`isQuestRunning || embarkResult`); su `/game`
  `composeRosterCompatibility` (`quests/rosterCompatibility.ts`) collassa
  l'intera catena a `undefined` quando **qualsiasi** contesto quest è attivo
  — le card mostrano gli status (ferito, morto in grigio via `disabled` →
  `grayscale`, away, assegnato), mai «Nessuno slot compatibile».

Test: red-first `.mw/red-first.jsonl` (11 record, exit 1) + verdi
`tests/unit/idleVillage/questS1Lab/beatSequencer.test.ts`,
`questRunWindow.{stageArtLatch,stageHeight,checkProgress}.test.tsx`,
`questSkillCheck{Column,Overlay}.throwClick.test.tsx`,
`useQuestPoiSession.compatibilityGuard.test.tsx`,
`questPartyRosterPanel.compat.test.tsx`. Integrazione live:
`tests/e2e/idleVillage/r241QuestWorkflow.spec.ts` (3/3 — witness in
`test-results/r241-*.png`).

## 14. Run window: cursore beat cross-mount R-242 (2026-10-21)

Close→reopen a run viva riproponeva **l'intera coda** `beats` (append-only,
mai potata): il cursore di `useBeatCursor` era `useState(0)` per-mount.
Replay di beat già presentati → scena stale in scena, cue `reveal`/`push`/
`expanded` ri-fuoco in sequenza, flap `wings.expanded` del cluster (slot
`left/top/width` che transiziona) e canvas Pixi in boot-fade — il
«conflitto resize/effetti» visto dal Director. Causa radice e metriche in
`.mw/bugs/20261021-quest-window-reopen/bug.md`, verifica in
`.mw/runs/r242-quest-window-reopen/`.

- **Il cursore vive nel proprietario della coda** (`beat-sequencer.INV-3`,
  `quest-run-window.INV-4`): `useQuestRun.beatCursorRef` sopravvive ai
  mount; `useBeatCursor` lo seeda al mount e ci scrive ogni avanzamento
  (reset solo con `setBeats([])` in `start`/`clear`). Il remount riprende
  dal beat held — il contratto "reopen-compact" (solo pending tail) diventa
  finalmente vero.
- **`Theater.epochRef` seeda `documentClock()` al mount** (non `t:0`):
  i layer WAAPI ripartono comunque al remount, quindi un epoch azzerato
  lasciava la camera GPU già landed sotto il veil che riapriva — desync.
- Reopen atteso: stesso beat held, stessa scena latched, ali stabili → solo
  il re-boot Pixi (fade ~300-600ms) sopra il fallback DOM.

Test: `beatSequencer.test.ts` (resume/write-through),
`questRunWindow.test.tsx` (ref esposto+reset, remount mostra il beat held).
Probe live: `.mw/bugs/20261021-quest-window-reopen/probe.mjs` (evidence in
`test-results/r242-quest-window-reopen-report.json`).

### 14a. Teatro: la camera vede il box reale, non l'aspect configurato (R-242 bis)

Dopo il fix del cursore il Director vedeva ancora «l'immagine che si
ridimensiona strano» a ogni (ri)montaggio — incluso minimise→restore.
Seconda causa: il teatro è il **reservoir di shrink** della placca
(`theaterMinHeightPx 190` ⇒ box reale ~3.85:1) ma `DepthScene` campionava
la finestra camera su `viewAspect` = aspect **di config** (2.4): DOM
cover+transform e shader GPU divergevano → reframe visibile al fade-in del
canvas; e l'img DOM dipingeva raw-cover per i primi frame (transform in
`useEffect`+rAF).

- **`depth-scene.INV-1`**: `DepthScene` misura l'aspect dell'host
  **pre-paint** (`useLayoutEffect` + `getBoundingClientRect`) e lo mantiene
  con `ResizeObserver`; `liveAspect` alimenta `domTransform`, uniform GPU
  e layer ambient/atmosphere — DOM e GPU campionano la stessa finestra.
  Il prop `viewAspect` resta seed/fallback (the authored *preferred* ratio).
- Il fallback DOM applica il transform **sincrono pre-paint**
  (`useLayoutEffect` + primo `tick()` immediato) — niente flash raw-cover.
- Verifica filmstrip: `.mw/bugs/20261021-quest-window-reopen/evidence-resize/film/`
  (open/restore/reopen corretti dal frame 0).

Test: `runtimeInvariants.test.tsx` describe «measured host aspect» (aspect
misurato vs prop, retune live, transform pre-paint).

## 15. Run window: baseline stage + jank skill check (R-241 follow-up, 2026-10-21)

Follow-up dell'eye-check Director — dettagli e metriche in
`.mw/bugs/20261021-skillcheck-jank/bug.md`.

- **Stage bottom-anchored — SUPERSEDED da R-253/R-259** (`quest-run-window.R-241-stage-bottom-anchor` retired):
  il ruling R-253 ha respinto l'ancoraggio al fondo («la soluzione di
  allineare il testo in basso è pessima»); il layout corrente è quello di
  §17 — box che abbraccia la copy con cap `stageMaxHeightPx`, stack
  centrato, solo il box testo scrolla.
- **Atmosphere solo-compositato** (`atmosphere-layer.R-241-atmosphere-composited`):
  il loop rAF scrive solo `transform`/`opacity`. Veils host-sized con
  `transformOrigin: 0 0` — rect via `scale`, scroll del noise piegato nel
  `translateX` (clampato all'overscan destro per non esporre il bordo);
  `mask-size` locale compensa la scala; pool mask e veil tile skippano
  stringhe identiche. Sprite: `translate + scale` uniforme (equivale al
  vecchio width-resize).
- **Goo raster a mezza risoluzione** (`destiny-astrolabe-v62.R-241-goo-raster-scale`):
  `tarGooConfig.rendering.gooScale` (Zod `[0.25,1]`, default `0.5`) — il
  layer WebGL2 SDF nasce a `W·scale`; lo shader lavora in field space via
  `uFieldScale` (radii/blob/materiale in board px invariati, normali
  corrette per la derivata); `drawImage(layer,0,0,W,W)` upscala — tar
  soft-edge, indistinguibile. Misurato: p95 gap goo-phases 66–116ms →
  16.8–50ms dev+prod, `the-spin` prod 0% frame >50ms.

## 16. Teatro audio: sample reali al posto dei synth (R-254, 2026-10-22)

Le 13 cue del teatro erano sintetizzate (oscillatori + brown noise):
grammatica corretta, timbro elettronico generico — il Director le ha
giudicate «molto brutte». Ora `QUEST_THEATRE_AUDIO_MAP`
(`balancing/config/idleVillage/quests/questTheatreAudioMap.ts`) lega ogni
cue a un asset **CC0** in `public/assets/audio/questTheatre/` scelto su
OpenGameArt cercando per descrizione: dark stinger sul reveal, vera
sguainata di seax sul j-cut, battito cardiaco con riverbero sotto lo
snap, impatto foley bass-boosted, ambience da passaggio oscuro sul
letterbox, pad+campane «cathedral in the forest» come riser dello spin,
fanfara «return of the king» sul trionfo, corni da guerra sulla
vittoria, chime sospesa sul per-un-pelo, rintocco bronzeo pitchato sul
fallimento, horror sting sull'epic fail. Dettagli/provenienza in
`.mw/bugs/20261022-quest-audio-samples/bug.md`.

- **Sample wins, synth fallback** (`quest-run-window.R-254-sample-wins` /
  `-sample-fallback`): `loadSamples()` fetch+decode lazy su
  prewarm/resume/play; `play()` usa la buffer-source se il sample è
  decodificato, altrimenti la voce synth (BV-13: la cue suona sempre).
- **Riser su bed reale** (`quest-run-window.R-254-riser-bed`): lo spin
  loopa il wav di vento sotto lo stesso sweep bandpass.
- Grammatica invariata: `THEATRE_CUE_MS`, scheduling, drain BV-08,
  `cancelCurrentBeatAudio`. Cue `loop` escluse dal one-shot `play`.
- Asset: mp3 per i one-shot, wav per il loop del riser (mp3 edge-padding
  cliccherebbe al loop point).

Test: `questTheatreSequencer.test.ts` describe «R-254 sample layer».
Probe live: `.mw/bugs/20261022-quest-audio-samples/probe.mjs` (evidence in
`test-results/r254-quest-audio-samples-report.json`). T-04: il giudizio
sul timbro resta ear-check Director.

## 17. Run window: dati reali, chrome overlap, fasi adattive, layout centrato (R-253 + R-259, 2026-10-22)

Due eye-check Director consecutivi — dettagli e probe in
`.mw/bugs/20261022-quest-ui-r253/bug.md` e
`.mw/bugs/20261022-quest-ui-r259/bug.md`.

### Dati e superficie dello skill check (R-253)

- **Silhouette dalle stat reali** (`quest-skill-check-column.R-253-check-real-data`):
  la colonna passava `skills=[{stat: check.score}]` — una sola skill →
  tutte e 5 le punte della stella identiche. Ora `ResolvedCheck.stats`
  porta le stat del check e `axisProfile` (display-only) guida le punte;
  il verdetto resta su `check.score` — la pallina *sceglie* la skill
  dall'angolo di atterraggio, quindi riempire `skills` avrebbe
  ri-dato il check.
- **Icona stat** (`R-253-stat-icons`): `STAT_ICONS`/`getStatIconComponent`
  accanto al titolo, `quest-check-stat-*` in DOM.
- **Chrome overlap** (`stage-zones-solver.R-253-chrome-overlap`):
  `gameFrameConfig.questChromeOverlap` (Zod) — in regime `run` la
  finestra ignora le bande chrome dell'HUD (ruling Director: «il
  componente quest può andare sopra l'HUD»). Viola INV-1 di CTR-game-006
  in regime run — contratto emendato.
- **Checkpoint adattivi** (`quest-schedule.R-253-adaptive-phases`):
  `questPhaseCheckpoints` include i beat visitati oltre
  `beats.length` e ridistribuisce le frazioni — una fase nuova produce
  marker invece di essere scartata.
- **Banda pin viaggio** (`quest-journey-authoring.R-253-pin-band`):
  `validateQuestJourneyDag` impone pin ∈ [0.25, 0.75] per eventi di
  viaggio non terminali; `gob-ritorno` corretto 0.2→0.4.

### Layout centrato + auto-avanzamento (R-259)

- **Box testo che abbraccia la copy** (`quest-run-window.R-259-textbox-fit`):
  stage `height`→`maxHeight` su resting e `BeatStage` (`heightPx`→
  `maxHeightPx`) — testo corto → box basso → pulsanti a ridosso della
  fine del testo; `overflowY:'auto'`/`overflowX:'hidden'`/
  `flexShrink:1`/`minHeight:0`. Solo il box scrolla.
- **Stack centrato, componente mai scrollabile** (`R-259-centered-stack`,
  `R-259-no-component-scroll`): wrapper `justifyContent:'center'` attorno
  a `{flavour+teatro+CombatStrip+stage+scelte}`; colonna esterna
  `overflow:'hidden'` — niente barra verticale né orizzontale; teatro
  senza `flexGrow` (aspect authored).
- **Auto-avanzamento post-verdict** (`quest-skill-check-column.R-259-auto-dismiss`):
  `verdictAutoDismissMs: 1000` — ~1s di finestra click post-verdict, poi
  il beat si settle come un click manuale (wiring preesistente via
  `dismissArmDelayMs`). Lettura presa: «dopo uno skill check» = post-
  verdetto; l'auto-lancio della pallina sarebbe `bridge.autoThrow`.
- **Toast esito a destra + identico alla card** (`quest-outcome-toast.R-259-toast-right`,
  `R-259-toast-identical`): `outcomeToast.anchor: 'right'` + slide-in
  `questToastInRight` (reduced-motion rispettato). Il body del verdetto
  vive in `QuestVerdictCardBody` (`QuestVerdictCard.tsx`) — chip verdict +
  chip harm + flavor + authored — condiviso tra la card della colonna e il
  toast: il popup **è** lo stesso blocco del risultato («identico
  all'esito», «a destra cm se fosse nato dallo skill check»). Il toast
  resta la superficie di fallback exactly-once: soppresso quando la card
  ha già portato l'esito.

Test: `questRunWindow.{stageHeight,stageAnchor}.test.tsx`,
`questSkillCheckColumn.{axisProfile,autoDismiss,throwClick,verdictCard}.test.tsx`,
`questOutcomeToast{.anchor}.test.tsx`,
`questS1Lab/questSchedule.adaptivePhases.test.ts`,
`questJourneyAuthoring.test.ts`, `stageZonesSolver.test.ts`.
Probe: `.mw/bugs/20261022-quest-ui-r259/probe.mjs` (layout + auto-advance
su :5173). T-04 residuo: eye-check Director su composizione centrata e
toast a destra.
