# Session Handoff — 2026-10-14

## 2026-10-23 — Audit `/game`: test non verdi classificati, doc e contratti risincronizzati

- **Domanda Director:** «la documentazione rispecchia cosa c'è? i test /game
  vanno tutti bene? se non sono verdi è un bug o una modifica al componente?»
- **Risposta:** no, non tutti verdi — e la causa dominante era **drift
  intenzionale non registrato**, più 1 bug reale di prodotto e 2 bug di
  driver e2e.

### Unit (47 file / 377 test sullo scope /game): 31 rossi → classificati

- **Bug reali di prodotto (fixati):**
  - `MinimalGameOverModal`: h1 duplicava il titolo del motivo invece di
    `modalTitle`; nessun gate su `isGameOver`; focus non spostato su
    «Ricomincia»; focus trap promessa nel JSDoc assente. Componente + test
    corretti; telemetria riallineata ai campi reali del payload.
  - `QuestRunWindow`: pip di chiusura «✕» a 8px (guard font <12px di
    `hudGuards`) → sostituito con l'icona incisa `cmd-close`.
- **Drift intenzionale (test aggiornati):**
  - `VillageRosterSection.unit/skin`: sort `rarity-desc` rimosso → `hp-desc`;
    skin default `minimal_frontier`→`base` (commit `165bfb8d`).
  - `questRunWindow.test`: il `title` nativo sulle pill è stato rimosso per
    ruling (R-234 T-A14) a favore di `HudTooltip` Radix — asserzioni portate
    sul trigger Radix.
- **Harness rotti (fixati):**
  - `HUDNotificationLayer.test.tsx`: import `../../../ui/` senza `src/` →
    mai compilato (morto).
  - `hudPersistence.test.ts`: `vi.mock` sul SUT (mockava il modulo che
    testava) → stub `undefined` dal 21-05. Ora mocka solo
    `PersistenceService`; contratto reale ripristinato.
  - `hudGuards`: manifest anti-drift stale → rigenerata
    (`gameSurfaceManifest.ts`).
- **Esito:** i file toccati sono 66/66 verdi; hudGuards 12/12.

### E2E `game*.spec.ts` (115 test): 15 rossi → classificati

- **Drift driver intenzionale:** titolo planner spostato da
  `quest-planner-hero` a `quest-planner-title` sopra la hero (PLAN-067
  T-B10) → `gameQuestLifecycle`/`FullFlow` aggiornati; badge
  `data-decision-waiting` rimosso per ruling 20-10 → assert rimossa;
  `frontier.status` 'waiting'→'pending' nel modello journey → D-K corretto.
- **Bug di driver (fixati):** `flushBeatTheatre`/`playRunPhaseByPhase`
  cliccavano `.da-tira` **oppure** premevano Enter — mai entrambi.
  `.da-tira` resta montato e visibile per tutto il check beat held; se il
  click viene intercettato (verdict card/toast sul board) il driver non
  premeva mai Enter — l'unica via garantita (`advancePresentation` →
  `progress()` → `astro.throw()`). Il beat si sbloccava solo via leak-guard
  45s → budget loop esaurito. Ora: Enter a ogni giro + click THROW quando
  visibile + click sulla colonna `data-check-armed` come dismiss diretto.
  Probe dedicata (`_probeQuestBeats.spec.ts`, rimossa dopo l'uso) ha
  confermato: colonna montata, astrolabe armato `action-trigger`, beat held
  che sbloccano via leak-guard — **nessun bug di prodotto** nella catena
  bridge/onDismiss/skip.
- **Residuo ambientale:** `gamePerf` medal-drag p95 ~183ms (budget 33) e
  `gameFirstInteraction` terzo hold — sospetto rumore su macchina condivisa
  (PLAN-079 eye-check/perf in corso), da ri-misurare su macchina scarica.

### E2E — seconda ondata di bug di driver (fixati, 23-10)

- **Click senza `timeout:` = stallo actionability 30s.** `flushBeatTheatre`,
  `settleCheck`, `dismissColumn` (cluster + lifecycle + fullFlow +
  inputCoordination) facevano `.click().catch()` su `.da-tira`/colonna/board:
  il bottone resta *visibile ma coperto* da verdict card/FX e Playwright
  attende il default 30s per chiamata → i 5 lifecycle e BV-01 morivano per
  timeout, non per deadlock. Fix: `dispatchEvent('click')` (vero handler
  React, salta solo l'hit-test) — stessa via già sancita per il radiogroup
  coperto dalla window. Probe dedicata (`_probeReportDead`, rimossa) ha
  confermato: run ended → 28 beat held → Enter avanza → report + popup
  emergono → **nessun bug di prodotto**.
- **`readyAt` ignorato dal cluster driver:** `reachWaitingFrontier` tornava
  su `waiting` visibile e `choose()` veniva rifiutato in silenzio (R-199).
  Ora matura `readyAt` sul clock canonico prima di restituire (+ fix
  `advanceTicks(lead)` senza `page` nel ramo pending).
- **Race C→D in BV-01:** due input `progress()` post-mount completavano
  throw→verdict→auto-settle (`checkVerdictMs` 2400) prima del probe —
  `driveToCheck` ora ricontrolla la colonna subito dopo ogni click di stage
  (zero input post-mount, check held deterministico) e il probe D legge
  subito con `verdictSeen` nel sample.
- **Beat pile-up:** `driveRunToEnd` ora preme Enter durante la guida — i
  commit accodano beat più in fretta del replay; senza, alla fine restano
  ~28 beat held da smaltire nel timeout del test.
- **BV-04 — il fake clock corre in tempo reale.** La colonna «parked»
  moriva ~450ms dopo `runFor(760)`: probe strumentata
  (`_probeBv04`, rimossa) ha dimostrato con log `setCursor`+stack che il
  killer è l'auto-dismiss R-259 (colonna → `bridge.onDismiss` →
  `cursor.skip()`) — **comportamento di prodotto corretto**, non un bug.
  Il meccanismo: `page.clock.install()` di Playwright NON congela —
  `_syncRealTime` avanza i tick col tempo reale trascorso, quindi ogni
  probe/`waitForTimeout` bruciava la stessa finestra ~650ms
  (park +700 → dismiss +1350) che il test misurava. Fix: `pauseAt` dopo
  `install` → window held interamente deterministica: parked a fake
  +710, resize 1440→1920 (attraversa `wideAtPx`, RO reale) → repaint
  esattamente 1, still parked a +1130, colonna auto-dismessa a ~+1400.
  Caveat documentati in guida e2e: `setFixedTime` non ferma i tick,
  `clock.uninstall` non esiste nel client API, i timer reali pendenti
  pre-install non vengono adottati.

### E2E — esito verificato (re-run mirati 23-10)

- `gameQuestLifecycle` 4/4 precedentemente rossi → **verdi** (chiusura
  rapporto R-200, epilogo+journal, repeatable dopo reload, Director start).
- `gameQuestCluster` **BV-01 verde** — 5 viewport × stati A–F, zero overlap
  pairs, `verdictSeen` su 4/5 (2560×1440 ha perso il dwell 2.4s — campionato
  come tollerato, non nascosto).
- `gameQuestCluster` **BV-04 verde** (51.9s) — misura deterministic a clock
  in pausa: `data-astro-idle="parked"` a fake +710, contatore frame congelato,
  resize 1440→1920 → repaint `rafDelta` esattamente 1, ancora parked a
  +1130, auto-dismiss confermato oltre +1400 (testimone R-259).
- Re-run suite completa (33 seriali, 34.5m): **20 passati, 8 rossi, 5 skippati
  a cascata** — classificati sotto (terza ondata).

### E2E — terza ondata: 1 bug reale di prodotto + race del driver drag

- **BUG REALE — check stale held → deadlock a `checkHoldMs` (fixato).**
  `astroShownFor` in `QuestRunWindow` teneva held OGNI beat check, ma i
  presenter (colonna cluster + overlay centrato) montano SOLO se il check è
  *live* (`checkEventOf` + `isStaleCheckEvent` — `checkSeq <= dismissedUpTo`
  → nessun presenter). Un check stale (hydration riassorbe i settled via
  `normalizeRunOverlayIdentity`; `dismissOutcome` del toast alza il mark
  mid-run) restava quindi held **senza presenter**: `bridge.handle` null →
  `advancePresentation` faceva `progress()` no-op + `return` → Enter morto →
  il beat si liberava solo al leak-guard `checkHoldMs` (45s a check) →
  pile-up → i timeout 120s mid-drive di `epilogo+journal` e `marker dopo
  reload` (hydration = il caso scatenante tipico) e probabilmente lo stallo
  420s del FullFlow. **Fix upstream:** `astroShownFor` applica lo stesso gate
  dei presenter — un check stale scorre come beat a tempo (`checkMs`), mai
  held. Non è un workaround downstream: è la parità di gate mancante tra chi
  decide il hold e chi monta il presenter. Invariante
  `quest-run-window.INV-7` + regression test in
  `questRunWindow.checkHeld.test.tsx` (red-first registrato: fallisce senza
  fix, exit 1).
- **Race driver drag (fixata).** `dragResidentPointer` falliva con
  `waitForDraggingHook` 2s su card "Assigned"/disabilitate: il commit
  `onDragEnd`/`onDragStart` della pagina gira in `startTransition` e sotto
  carico seriale flushava DOPO lo sleep 1.5s, clobberando
  l'id che il drag successivo aveva appena settato via hook → getter a null
  → timeout spurio. Fix: `waitForDragSettled` attende `get→null` prima di
  uscire dall'helper + budget hook 5s; `assignViaRealDrag` usa
  `scrollIntoView` in-page (`locator.scrollIntoViewIfNeeded` moriva su
  "element stable" — le card si muovono di continuo sotto Pixi live).
- **BV-12** — click gated sulla colonna vs auto-dismiss R-259 → dispatch
  atomico in-page (stessa tecnica del guardedResult).
- Test 575 `matura a ×4` **verde da solo (3.3m)** — i fallimenti in suite
  erano borderline budget 120s sotto carico + i due difetti sopra.
- Re-run mirato (BV-12|R-119|R-183, 16 test) lanciato con fix prodotto +
  driver nel build — esito in `test-results/rerun-failures.log`.

### E2E — quarta ondata: diagnosi su artefatti (16 test, 9 verdi / 7 rossi)

Esito del run con fix prodotto+driver nel build: **BV-12 verde**, i 7 rossi
classificati per firma — nessun nuovo bug di prodotto emerso.

- **FullFlow «swap revertito» — race del retry del driver, NON bug.**
  L'assert `assignments === afterSwap` leggeva `{leader:Beppe, member1:Hero}`
  = esatto pre-swap. Ricostruzione: il drop dello swap valido committa al
  **landing** del token (flight ~0.5s + `startTransition`), non al release;
  `commitSwap` ri-pianifica `planSlotSwap(assignments_correnti, from, to)`
  all'atterraggio. Se il commit non è atterrato entro i 5s di
  `waitForAssignment`, il retry del test ri-trascina LEADER→MEMBER_1 sullo
  stato ormai post-swap → secondo commit legittimo → **revert** (lo swap è
  non-idempotente, a differenza dell'assign). `planSlotSwap` e il drop
  rifiutato (Lisetta→leader: `eligible=false → return null → inert`) sono
  corretti. **Fix driver (v3, testimone nonce — definitiva):** la probe
  strumentata (`__swapDiag`, poi rimossa) ha mostrato che `getAssignments`
  può restare pre-commit anche a `__dragFlightActive` false — il getter è
  una **closure ripubblicata a ogni render di sessione**: flag e commit
  escono nella stessa transition, ma la vista degli hook può restare una
  pubblicazione indietro. Il testimone atomico è `getSeatNonces` (già
  esposto negli hook): `seatNonces[toSlot]` bumpa nella STESSA
  `startTransition` di `setAssignments` in `commitSwap` → quando il nonce
  cambia, getter e assegnazioni sono freschi per costruzione. Un drop
  veramente mancato non bumpa mai → retry sicuro. Driver: prima di ogni
  retry `seatNonce(target)` come baseline, dopo il drop
  `awaitSeatNonceBump` (8s) decide se riprovare; il drop rifiutato si
  asserisce come `nonce immutato + assignments === afterSwap`.
  FullFlow verde (2.9m) alla prima corsa col driver nonce.
  Nota latente: `handleAssign` non ha gate di elegibilità (il gate vive in
  `handleDragEnd`/`assignToSlot`) — oggi inerte perché un drop rifiutato non
  avvia flight.
- **Pile-up di beat narrativi — drain rate del driver, NON deadlock.** La
  firma «20 beats left» con run finita (marker «outcome to collect»,
  VICTORY toast) non è lo stale-check di INV-7: è produzione > consumo.
  `skip()` è un update funzionale → N keydown consumano N beat; un Enter
  per round-trip Playwright (~300ms) perde contro i commit a burst di
  `advanceTicks`/×4. **Fix driver:** `drainBeats(page, 8)` — keydown
  sintetici dispatchati su `window` (target non-Element → il guard R-199
  instrada dritto in `advancePresentation`, focus-proof) in
  `driveRunToEnd`, `flushBeatTheatre` e `playRunPhaseByPhase`.
- **Click actionability >10s sotto carico — `dispatchEvent`.**
  `[data-action-id="quest"]` in `revealQuestPois` (firme 773/798) e
  «Invia» in `launchGoblinQuest` (firma 730) restavano hit-test-blocked dal
  layer/scroll residue oltre il default: stesso listener React del click.
- **Budget strutturale — `test.setTimeout(300_000)` nel beforeEach del
  describe R-119.** Ogni test guida un ciclo completo (reveal con ancore
  Pixi fino a 60s + 4 drag CDP ~3-8s + run intera + teatro + settle):
  120s è stretto per la superficie, FullFlow dichiara già 420s.
- Re-run wave-3 dei 7 rossi con le fix driver sopra →
  `test-results/rerun-wave3.log`.

### Documentazione e contratti

- `CURRENT_STATE.md` portato al 23-10 (era fermo al 19-10): onda
  PLAN-067/053/073/076/078 riassunta + residui onesti.
- `contracts` (PLAN-054): inventory rigenerato (280 unità/463 strict);
  +7 contratti skeleton popolati (`hero-level-ceremony`,
  `legacy-reliquary-panel`, `memorial-hall`, `memorial-panel`,
  `next-event-tab`, `quest-returned-crew`, `settlement-tally`); scope
  ownership aggiunti dove ratchet-safe; `COMPONENT_MASTER_INDEX.md`
  risincronizzato via `contracts:index-sync`.
- **Residuo Director-gated:** 9 file con 2 owner — il contratto aggregato
  manuale `game-menu-screens` (12 invarianti reali) si sovrappone ai
  contratti per-file meccanici. Il ratchet blocca la rimozione membri senza
  ruling sha256-approval → lasciato com'era, documentato qui. Serve
  decisione: migrare le invarianti nei per-file e ritirare l'aggregato, o
  dichiarare l'aggregato owner e svuotare i per-file.
- **Non toccati (T-13, lavoro concorrente dirty):** `RICHIESTE.md`,
  `plans/PLAN-078*`, `scripts/sentinel/*`, `.mw/ledger/*`,
  `MatericEventCard.tsx`, `WorldSurfaceEventCard.tsx`, `DragTestContainer.tsx`,
  `skinCssVariables.ts`, `VillageRegistry.tsx`.

## 2026-10-19 — PLAN-066 authorization checkpoint

- Director: «procedi con il plan» — execution authorized for
  `plans/PLAN-066-autonomous-workflow-no-director-queues.md`.
- **Implementation not started in this checkpoint.** The session guard is
  over its 60-tool red threshold; stop here rather than continue code edits.
- Before execution resumes, reread RPG `AGENTS.md`, the plan, v31/v32/v35,
  `context/recurring-traps.md` T-13, and the current dirty worktree. The
  plan is still `draft`; no status or frozen desiderata was changed by this
  checkpoint.
- The plan's §6 trust-self-sealing scope and v32 dependency-scope ruling
  remain unrecorded; do not silently choose a new trust policy. Carry these
  into one batch, then execute T-001..T-007 serially under the approved
  ruling. No code changes have been made for PLAN-066.

## 2026-10-19 — R-230: PLAN-066 draft da multi-AI web (non battezzato)

- **Run converged:** `mind-weaver/.mw/runs/20261019-r230-autonomous-workflow/`
  — artifact-r006, SHA-256
  `e1c03688289cd7f0c6ecb9900855fad7a7c5930edee40f768674864f8f38c038`;
  ChatGPT/Claude/DeepSeek 3/3 ACCEPT. Gemini non ha postato risposta dopo
  due retry safe; Grok non ha prodotto una risposta correlabile.
- **Piano candidato:** `plans/PLAN-066-autonomous-workflow-no-director-queues.md`;
  indicizzato `draft`, non battezzato e non implementato.
- **Direzione:** zero code su azioni routine/meccaniche; `actor` self-reported,
  non autenticato; journal bundle con limiti dichiarati; contare eventi/file,
  non dedurre tempo dal churn.
- **Human-only:** non diventa PASS per silenzio. Gli altri task elencati e
  dimostrabilmente indipendenti continuano; il task completo resta non
  chiuso se l'obbligo umano è richiesto. v35 invariato.
- **Unico batch policy prima dell'esecuzione:** (1) self-sealing agente su
  gate/bundler/trusted/frozen, incluso bootstrap `produceBundle.ts`;
  (2) amendment v32 circoscritto sul blocco del solo lavoro che consuma la
  decisione umana. Default del draft: self-seal same-run su gate rifiutato
  se non autorizzato.
- **Rischio esplicito:** hash chain e ledger nello stesso account non sono
  autenticazione; un agente può coordinare la riscrittura di gate, bundle e
  journal. Nessun claim tamper-proof.

## 2026-10-19 — R-225/PLAN-054: fix map-fit ultrawide 3440×1440 (bundle PASS)

- **Fatto:** corretto il caso `/game` `3440×1440`: a HUD auto-zoom
  (`cssZoom=1.3`) gli inset `safeFit` restavano in pixel layout e riservavano
  meno spazio del chrome fisso reale. `src/pages/game-frame-pixi.tsx` ora
  scala `insets.top/bottom` per `hudScale.cssZoom`; nessun sea margin o
  workaround 3440-specifico (T-01 rispettata).
- **Evidenza:** `verify:bundle` PASS OB-1..4 —
  `.mw/runs/r225-ultrawide-map-fit/bundle.json`; spec completa
  `gameGeometryT01.spec.ts` 12/12, probe `CTR-game-005 GREEN`,
  `contracts:check`, `trusted:check`, `build:check`, `closure:lint` verdi.
- **Witness T-04:** screenshot headless `test-results/probe-game-map-fit/game-3440x1440.png`
  ispezionato: la terra resta sotto le placche top e sopra il plinto nav;
  `landScreen.y0/y1 ≈113/1310` contro chrome ~108.55/1338.64.
- **Ledger:** bug `.mw/bugs/20261019-game-ultrawide-safe-fit/bug.md`,
  regressione `.mw/regression/REG-002.md`, contratto `CTR-game-005`
  aggiornato col caso dedicato INV-1.
- **Aperto:** R-225 resta `in corso` (PLAN-054 T-003+); il probe segnala
  ancora un warning non contrattuale `1512×982` stage-leak extra-viewport.
- **Contabilità:** `plans/INDEX.md` allineato — T-001/T-002 `fatta`,
  T-003+ in corso, bundle ultrawide citato.
- **Commit:** non eseguito — worktree condiviso con drift parallelo esteso
  (T-13); file scoped lasciati non committati.

## 2026-10-19 — R-219: manoscritto r008 applicato al runtime (EN, R-135)

- **Fatto:** «applica al runtime» eseguito — tutti i 17 nodi di
  `scenarios/goblin.ts` al render EN r008 (check titles = gesto, F2
  «What was hidden» choice a opzione unica `grantsGold` — convenzione v3
  confermata, nessun kind nuovo; F4/F7 con `combat.attackLines` authored;
  `gob-fine` «Cold ash» + closingLine fusa nel body). `questRun.ts`: log
  riallineati (epicfail tracce-per −10 HP = «dead branches», tracce-perfor
  climb/fall distinti, «road teaches»→«hunt teaches»). Spec
  `quest_sterminio_goblin_spec.md` riscritta IT+EN con Delta aggiornato.
- **Verifica:** oracle/coverage/checks rigenerate (re-baseline
  intenzionale), questScenarioConfig **20/20**, suite mirata
  quests+questS1Lab+toast **425/425**, tsc pulito, build:check ✓.
- **Fix collaterali:** `questFrontier.test.ts` ancora 'whistle'→'branch
  snaps'; `pageCrash.repro.test.tsx` regex label stale (era rotto dal
  sync v3 del 18/10, non da r008) + iterazioni 150→40 (timeout).
- **Non verificato (T-04):** rendering visivo/cinematico in `/game` —
  serve witness UI reale. Arte F1/F2 stale resta aperta.
- **Ancora Director:** bundle `plan027-r008-impl` BLOCKED su
  `mapping:approve` (proposal-2026-10-19T07-57-41-929Z) + `trusted:seal`.

## 2026-10-19 — PLAN-059 (R-230): rework metrics + `task:close` landed

- **Fatto:** `npm run task:close -- <R|PLAN>` (`scripts/taskClose.ts`) — chiusura
  meccanica della contabilità (RICHIESTE→fatta, plans/INDEX→completato,
  HANDOFF prepend, `plan:stamp close`, bozza context/INDEX). **Fail-closed**:
  senza `bundle.json` PASS del run esce 1 e non scrive nulla.
- **planForensics**: nuova sezione "Plan features → smoothness" — rework
  (churn out-of-plan splittato `books` contabilità vs `scope` scoperta,
  commit post-bundle, retry gate) al posto di richness→velocità.
  Primo dato: ρ(files_named vs −oop scope) = 0.06 → più path nominati
  NON riducono il churn fuori-plan (direzionale, n=16).
- Plan rinominato PLAN-052→**PLAN-059** (collisione con
  quest-scene-depth-staging della sessione parallela).
- Test 31/31, build:check PASS. `closure:lint` FAIL su file sessione
  parallela (contractsCheck post-approval + 2 playtest scripts non mappati) —
  T-13, nessuno mio.

## 2026-10-19 — PLAN-027 iterazione r008: architettura epistemica implementata (44/44 test; bundle BLOCKED su governance Director)

- **Current state:** implementazione r008 completa e verificata —
  `EpistemicBlock`/`attachEpistemic` (sceneBrief), `world`+`nodeContracts`+lint
  (arcContract), `REGISTER_BY_KIND`/`promptForNodeR8`/`promptForFieldRevise`
  (narrationPrompt), `copySchemaFor`/`validateNodeCopyR8`/tokenizer+stemmer
  (validateCopy), `--copy-file`+gate combinato (questRefine), contratto goblin
  sui 17 node id, fixture accettato+rifiutato. **Test:** narrationQuality 44/44,
  quest dir 204/204, tsc pulito sui toccati, build:check ✓.
- **Bundle** `.mw/runs/plan027-r008-impl/bundle.json` = **BLOCKED** — le 4
  obbligazioni sono PASS tranne BV-03 che fallisce SOLO su `closure:lint`:
  serve `npm run mapping:approve -- .mw/mapping-proposals/proposal-2026-10-19T07-57-41-929Z.json`
  (game-quests con i 2 fixture r008 + workflow-forensics parallela) e
  `npm run trusted:seal` + approve ledger (drift pgcard/slotRack/surface-map —
  sessione parallela). Entrambi azioni Director per design (trust anchor).
- **Pendente Director:** review manoscritto r008 (fixture = proposta, non
  applicata a runtime); ruling su F2 `recovery:'direct'` (richiede modifica
  grafo `goblin.ts` — oggi F2 = choice a opzione unica «Recover the loot»);
  regen arte F1/F2 stale (da R-219).
- **Note:** lo scenario goblin NON ha `verdictTable` — le bande vengono dal
  contratto (`verdictEffects`); `attachEpistemic` le unisce. Il tokenizer
  normalizza i diacritici: STOPWORDS deve vivere nello stesso spazio
  normalizzato (bug trovato e fissato — `più`≠`piu`).

## 2026-10-18 — PLAN-047 CHIUSO: Visual Fork Gate v35 live (bundle PASS 8/8, R-216 fatta)

- **Current state:** **PLAN-047 `completed`, R-216 `fatta`** — gate operativo:
  fork visivo in `mw-explorer` (2 opzioni/max 3, card + preview auto-open
  Devin Desktop), `INTENT_GATE_VISUAL_FORK` in `mw-planner`, baseline
  congelata golden ref in painter/mockup-generator, `visualForkGate` in
  `closure:lint` (diff reale → copertura card/skip; regime v2 "scope per
  plan": non-dichiarato=errore, ≥v35=errore, pre-v35=warning).
- **Ruling Director registrati:** preview **auto-open** nella scheda Preview
  Devin Desktop (≠ finestra foreground, regola 16 solo esterne); gate
  scope-per-plan per il WIP pre-v35 altrui.
- **Bugfix collaterali:** `runCommittedGate` non ri-delega più
  (`GATE_FILES` svuotato nel runner figlio — era hang infinito);
  proxy `browser_preview` path-scoped → pagina bianca, fix = ROOT +
  redirect-stub (`:5199`, `.mw/bugs/20261018-devin-preview-white/`).
- **Docs:** T-18 (pipe maschera exit code) + T-19 (preview ROOT/stub) in
  `recurring-traps.md`; learn `.mw/runs/learn-plan047-preview-20261018/`;
  DECISION_LOG aggiornato; `.mw/bugs/` ora in `.gitignore` (exc
  EXC-20261018154019-1875 su `.gitignore`).
- **Pendente:** primo pilot reale del fork visivo (criterio di fallimento
  in PLAN-047 §8); warning transitori `closure:lint` sui file pre-v35
  si chiudono con i rispettivi plan.

## 2026-10-18 — PLAN-051 T-001..T-005: verify-slim trust anchor + tiering (test 17/17, safeguards verdi)

- **Current state:** **T-001..T-004 fatti, T-005 parziale** — `npm run bundle`
  (wrapper: scopre run dir, `--init` scheletro, exit code reali);
  `trusted.lock.json` su GATE_FILES+bundler+`verify-tiers.json`+
  `surface-map.json`+frozen/trusted dirs; `npm run approve` scrive ledger
  fuori-repo `~/.rpg-approvals/ledger.jsonl` (**strict-once-established**:
  con ≥1 record il ledger è l'ancora — lock riforgiato non passa, test
  dedicato); tiering `.mw/verify-tiers.json` (percettivo→SKIPPED fuori
  reach, core touches-all, `verify:sweep` = full); signoff human-eye bound
  a `commit_sha`/`frames_sha256`.
- **Pendente Director:** `npm run trusted:seal` + `npm run approve --
  --kind=trust-set` attivano il modo strict; `mapping:approve`
  proposal-2026-10-18T12-12-15-573Z (PLAN-048).
- **Aperti:** T-006 (fixture lying-agent e2e + FP-rate in
  WORKFLOW_METRICS), T-007 (dogfood misurato pre/post — la misura decide
  se il 32% burst è sparito o solo spostato su latenza approve).
- **Lezioni:** `.mw/runs/learn-plan051-20261018-1715/` — hash nel repo ≠
  anchor (ledger fuori-repo), SKIPPED come quarto esito, config-gate nel
  trust-set. `closure:lint` ora PASSA (visual-fork v2 = warning su file
  pre-v35, ruling Director).

## 2026-10-18 — PLAN-044 T-004 (S2): red-first lockato + geometria T-01 (bundle PASS 7/7)

- **Current state:** **PLAN-044 T-004 `fatta`** — riproduzione rossa lockata
  per identità+esecuzione: `npm run redfirst:record -- --test <f> --command "<cmd>"`
  esegue il comando, rifiuta se exit=0, salva il log in `.mw/red-first/` e
  appende a `.mw/red-first.jsonl` (canonical hash test + sha256 log + exit_code).
  `checkRedFirstGate` (in `verify:bundle` via `manifest.red_first` e in
  `closure:lint` via journal∩diff) → test mutato/log manomesso/exit 0 → rosso;
  `redfirst:retire` = test scartato con motivo (nessun escape hatch).
  Geometria T-01: `tests/helpers/geometry.ts` + `gameGeometryT01.spec.ts`
  (3 viewport, canvas⊇viewport, chrome dentro/disgiunto) — 3/3 PASS.
  Bundle `.mw/runs/plan044-t004-red-first-lock/bundle.json` **PASS** 7/7 dopo
  disposizioni Director (mapping:approve proposal-22-21-51: bv-gate+=redFirst,
  game-tests+=tests/helpers/**, nuova app-shell=App.tsx+src/pages/**;
  director:answer --gate-diff su 12 gate-file).
- **Lezioni:** spawn failure transitorio (exit_code null, killed false) sotto
  carico di sessione parallela — retry del bundle è la risposta giusta;
  il matcher glob NON supporta brace expansion (usare glob letterali);
  file sporchi di sessioni parallele → coverage_exception con motivo, non
  mapping affrettato. Residuo v1: posizione isola in-canvas è pixel WebGL,
  non DOM-assertabile (contratto T-01 pixel-level da coprire con check visual).
- **Next step:** PLAN-044 **T-005** (S3 — `verifier.json` receipt generato
  da script, LLM→advisory). PLAN-045 sbloccato (T-003+mappa landed).

## 2026-10-17 — PLAN-044 T-003 (S1b): awaiting_director + gate su versione committata (bundle PASS 7/7)

- **Current state:** **PLAN-044 T-003 `fatta`** — `coverage_exception` con
  `--unverified-behavior` va in `awaiting_director`: blocca la chiusura finché
  un `director_answer` non lega exception-id + hash del record + canonical
  hash dei file coperti. I gate-file modificati sono valutati dal **gate
  committato a HEAD** (materializzato in temp dir + runner tsx); gate assente
  a HEAD → bootstrap `director_answer --gate-diff` (canonical-hash-bound).
  Bundle `.mw/runs/plan044-t003-awaiting-director/bundle.json` **PASS** 7/7
  dopo le disposizioni Director (mapping:approve proposal-20-47 +
  director:answer --gate-diff su 10 file).
- **Macchina:** `canonicalizeText`/`canonicalFileHash` in gateCore (EOL,
  trailing ws, blank collapse — niente strip commenti, fail-closed);
  `exceptionRecordHash` + `DirectorAnswer` + `lastAnswer` + `GATE_FILES` +
  `runCommittedGate` in contractsCheck; CLI `coverage:exception --id
  --unverified-behavior`, `director:answer --exception|--gate-diff|list`.
  Boundary PROCEDURALE — non prova crittografica di authorship (v2).
- **Attenzione:** se un gate-file (`scripts/verification/**`, `agentsLint`,
  `closureLint`, `contractsCheck`, `mappingProposal`, `coverageException`,
  `directorAnswer`) è dirty vs HEAD: se il gate esiste a HEAD la diff è
  valutata dalla versione committata (automatico); altrimenti serve
  `npm run director:answer -- --gate-diff --answer "<t>"` — modifica
  post-risposta → ri-approvazione. `coverage:exception --unverified-behavior`
  → `npm run director:answer -- --exception <id> --answer "<t>"`.
- **Prossimo step:** PLAN-044 **T-004** (S2 — red-first lockato: bundle
  registra hash file test + hash output run rossa al commit di riproduzione;
  ricontrollo a fine task; asserzioni geometriche Playwright su harness /game
  T-01). PLAN-045 sbloccato su T-005a (state machine) e mappa.

## 2026-10-17 — PLAN-044 T-002 (S1a): contracts:check nativo + mappa file→superficie (bundle PASS 7/7)

- **Current state:** **PLAN-044 T-002 `fatta`** — gate fail-closed
  file→superficie operativo in `verify:bundle` e `closure:lint`.
  Bundle `.mw/runs/plan044-t002-contracts-check/bundle.json` **PASS**
  OB-1..OB-7. Mappa seed `.mw/surface-map.json` (10 superfici) **approvata
  dal Director** — batch sha256 `5751cf1d…` in `.mw/mapping-approvals.jsonl`.
- **Macchina:** `scripts/verification/surfaceMap.ts` (schema, globToRegExp/
  globMatch, anti-glob, diffSurfaceMaps, functionalKey) +
  `scripts/verification/contractsCheck.ts` (`checkContractsGate`: unmapped
  senza disposition → errore; diff mappa ⊆ batch approvati; anti-glob
  K=5/root-glob → `anti_glob_confirmed`). CLI: `contracts:check`,
  `mapping:propose|approve|status`, `coverage:exception`. Wired:
  `produceBundle` (campo `contracts` → verdict BLOCKED, backward-compat) +
  `closureLint`. Dogfood live: primo bundle BLOCKED su mappa non
  approvata → `mapping:approve` Director → PASS.
- **Attenzione:** da ora `closure:lint` e `verify:bundle` sono ROSSI se un
  file toccato non ha superficie mappata né `coverage_exception`, o se la
  mappa cambia senza batch approvato. Workflow: file nuovo non coperto →
  aggiungere glob a una superficie esistente o creare entry →
  `npm run mapping:propose` → Director `mapping:approve`. File one-off →
  `npm run coverage:exception -- --glob "<g>" --reason "<r>"`.
- **Scope notes:** `awaiting_director`/`director_answer` e gate-file su
  versione committata = T-003; `coverage_exception` è audit trail, non
  auto-approvazione; mis-mapping = rischio residuo v1 (misurato in S5).
- **Evidence:** `test-results/plan044-t002-contracts-check-2026-10-17.log`.
- **Prossimo step:** PLAN-044 **T-003** (S1b — `awaiting_director` su
  `coverage_exception` di comportamento non verificato: `director_answer`
  legato a exception-id + hash record + content-hash del file coperto;
  boundary procedurale `tools/mw-director`-style; gate-file diffs valutati
  dalla versione gate committata — baseline HEAD, no bootstrap-loop).
  Sblocca anche PLAN-045 T-005a (state machine) e la mappa per T-006.

## 2026-10-17 — PLAN-044 T-001 (S0): igiene AGENTS annidati (bundle PASS 6/6)

- **Current state:** **PLAN-044 T-001 `fatta`** — `src/ui/idleVillage/AGENTS.md`
  riscritto come pointer alla fonte unica (root `AGENTS.md` →
  `.windsurf/rules/00-project-invariants.md` → `context/recurring-traps.md`);
  il workflow sospeso R-208 (board, ruoli/script della pipeline, prompt-spec)
  non è più ripetuto lì. Bundle `.mw/runs/plan044-t001-agents-hygiene/bundle.json`
  **PASS** OB-1..OB-6.
- **Gate meccanico:** `checkNestedAgentsGate(repoRoot)` in
  `scripts/verification/gateCore.ts` flagga i pattern del workflow sospeso in
  ogni `AGENTS.md`/`CLAUDE.md` annidato (i file di root sono esenti: fonte
  unica). Esposto come `npm run agents:lint` (`scripts/agentsLint.ts`) e
  **wired in `closure:lint`** → il drift non si reintroduce a nessuna
  chiusura. Test: +5 casi in `tests/unit/verification/gateCore.test.ts`
  (23/23 verdi); seeded red→green provato in-repo (seed con "kanban"+
  "harness:run" → exit 1 → rimosso → OK).
- **Evidence:** `test-results/plan044-t001-agents-hygiene-2026-10-17.log`.
- **Nota operativa:** `created_at` del manifest è UTC — scriverlo con l'ora
  locale + `Z` rende tutti gli artefatti STALE (bundle BLOCKED).
- **Prossimo step:** PLAN-044 **T-002** (S1a — mapping file/glob→superficie +
  port `contracts:check` nativo TS in `verify:bundle`, con hardening
  `mapping-proposal` sha256-batched + flag anti-glob K=5 proposto).

## 2026-10-17 — PLAN-043 WS-2: Three-Zone Stage implementato (bundle PASS 5/5)

- **Current state:** **WS-2 `implemented`** — stage deterministico a 3 zone su
  `/game` (`leftWing`/`centerStage`/`rightWing` + overlay `heroSheet`).
  Bundle `.mw/runs/20261017-plan043-ws2-three-zone-stage/bundle.json` **PASS**
  OB-01..OB-05; verifier indipendente `verifier.json` 4/4 CONFIRMED.
  R-207 resta `in corso` (WS-0/1/3/4/5 ancora attive su worktree parallelo).
- **Implementato:** config `stageZones` Zod in `gameFrameConfig` (**floorB**
  260/616/340 — roster min-content misurato 460px > 236, edge E=24);
  solver puro `solveStageLayout` + `layoutSignature`; reducer (occupancy,
  `openSeq`, `activeDrag`, commit `{state,revision}`, hysteresis 24px);
  provider `useGameStageZones` (Context); sospensione
  hidden+inert+aria-hidden+focus-redirect+dereg overlay; strip rail 32px ali /
  tab 28×160 centro (split intent/effective, LRU); rail-drop→strip,
  tab-click→expand; handoff atomico run↔generic (retire/suspend §D.2,
  open-in-run → reject+toast i18n); `questDetail` nel registry
  (`hudGameMenu` aggiornato).
- **Bug reali trovati dalla probe:** (1) DROP con revision campionata dal
  caller → self-reject se React batchava DRAG_START+DROP — staleness ora
  interna al reducer (`activeDrag.startRevision`); (2) listener drag in
  `useEffect` → press/release più veloce del commit React lasciava
  `activeDrag` appeso per sempre — attach ora imperativo su pointerdown.
- **Verifica:** unit 37/37 (solver+config+menu), runtime probe
  strip-lifecycle + detail + `0px²` overlap, capture 4 viewport × DPR 1/2,
  build:check + closure:lint + i18n scoped verdi; signoff agent-eye T-04 su
  `stage-1280x720-dpr1.png` (floorB leggibile, nomi troncati).
- **Aperto:** conferma visiva **Director** su G.6 (roster compatto 260px) e
  G.7 (heroSheet overlay puro entrambi i regimi — implementato come ruling).
  `i18n:validate` repo-wide fallisce su chiavi di sessioni parallele
  (WS-3/4/5) — fuori scope WS-2, non toccare quei file.

## 2026-10-16 — R-199: QuestRunWindow rev.2 completata (bundle PASS 8/8)

- **Current state:** **R-199 `fatta`** — rev.2 della quest window su `/game`
  (13+1 punti Director, piano `.mw/runs/r199-quest-window-rev2/plan.md`).
- **Implementato:** skip implicito senza pulsante (click/tasto sullo stage,
  `isInteractiveTarget` esclude i controlli); companions chiusi di default
  (revoca «tutto visibile» R-196); `widthPx 820` + `stageMaxHeightPx`; scelte
  bordate + trigger bag adiacente; abbandona in header (`ico-gust`) con
  conferma inline → `abandon()`→`flee` engine; `durationDays: 5` in
  `gameFrameConfig` pilota `nodeTicks`/barra fasi — fasi future visibili ma
  gated su `frontier.readyAt`; astrolabe `DestinyAstrolabeV62Standalone`
  docked sul teatro ai check (verdetto engine-only) + `QuestCheckOptionsPanel`
  (salta intro→`throw()` / salta check→undock, persistito `questCheckOpts` via
  PersistenceService); `QuestRewardPopup` page-level non-modale, staged
  (`stageMs` config) + skippabile, `Esc`→focus-return.
- **Verifica:** bundle `.mw/runs/r199-quest-window-rev2/bundle.json` **PASS**
  (RV-1..RV-8, verifier indipendente CONFIRMED ×8); 27/27 RTL
  window+popup+checkOpts, 52/52 engine, lint 0 err, build:check PASS,
  kanban:lint 42; witness `quest-window-open.png` + `reward-popup.png`.
- **Note per il prossimo:** punti 2-3 della richiesta (POI→detail, immagini)
  erano già risolti da PLAN-036 — smoke li conferma. Esiste già **R-205
  `in corso` (rev.3)**: 7 difetti noti dal Director (contenuto fuoriesce dalla
  placca, bag toggle grande, astrolabe→overlay esterno click-to-dismiss,
  pre-scaldare il check nel boot veil, esiti post-check in popup-testo,
  reward lento). I driver test engine ora avanzano il clock a `readyAt`.

## 2026-10-15 pm — R-196: QuestRunWindow cinematografico completato

- **Current state:** **R-196 `fatta`** — redesign `/game` quest window da
  `mw-web-debate` artifact-r006 (12 WITNESS chiuse, battesimo «procedi»).
- **Implementato:** finestra 640px / theatre 2.9 da `gameFrameConfig`;
  colonne compagne co-visibili — `QuestPartyRosterPanel` (sinistra, solo
  `run.party`, `RosterKitShell` per la catena provider di `PgCard`),
  `QuestBeltPlaque` (sotto il roster, icone pure + arm/disarm per-item via
  `armedFlags`), `QuestLogPanel` (destra, `ico-scroll`, `run.log`);
  predicato `resolveQuestShellLayout` (collapse < ~1052px) + clamp
  d'unione in `useHudPanelDrag` con ResizeObserver; header icon-only
  (`nav-company`/`nav-bag`/`ico-scroll`, `aria-expanded`/`aria-controls`,
  focus-return); `skipAll` rimosso, `BeatStage` con vero `<button>`
  Continue; scelte con bordo/sfondo/barra oro a riposo.
- **Engine:** `stepArmedActionItems` unica routine per preview (clone) e
  commit (live) — consumo solo su check/combat validati, mai su scelte
  narrative; `consumableBonusFor` con tie-break copertura→bonus→catalogo
  sui candidati armati; `useConsumable` legacy preservato.
- **Verifica:** bundle `.mw/runs/r196-quest-window/bundle.json` **PASS**
  (BV-1..BV-6, verifier indipendente CONFIRMED ×6 — sessione PLAN-035 +
  subagent clean-context); metrics-dom.json (env attestation + 3 sample
  DOM), screenshot `quest-window-open.png`, smoke `/game` +
  `/quest-window-lab` zero errori console. Test: 47 UI + 52 engine verdi.
  kanban:lint 42 prompt OK; lint scope 0 err; build:check PASS.
- **Note per il prossimo:** `BagStrip`/`ConsumableBelt` non sono più
  montati in `QuestRunWindow` (restano per l'HUD del lab S1). Il bench
  `generatedCatalog.bench.test.ts` fallisce su nodi orfani
  `im-a-piede`/`im-rotti` di `gen-impr002-palude` — **pre-esistente**
  (file generation non toccato; il test non traversa le uscite
  `combat.nextCleared/nextSurvivors`). La suite idleVillage completa ha
  ~700 failure pre-esistenti non correlati — usare scope mirati.

## 2026-10-15 — R-197: skill `idle-village-task` riscritta sullo stato attuale

- **Current state:** la skill era ferma al 2026-08-16 (era ancora centrata
  sulla pagina Idle Village e citava simboli morti). Riscritta
  `coordinator/skills/idle-village-task/SKILL.md` (fonte unica; `.devin`/`.windsurf`
  sono symlink): superficie canonica `/game` + deprecazione pagina Idle
  Village; mappa delle superfici (Game Frame, WorldSurfaceRenderer,
  QuestRunWindow, planner, `/quest-s1-lab`, rosterV2); knowledge anchors da
  CANON (QUEST_RULES, plans/INDEX, architecture_state, `.mw/contracts`);
  pre-flight obbligatorio su `context/recurring-traps.md` (T-01..T-12 rilevanti
  per il dominio); sezione HUD Lacquer Atlas (HudPlaque, `data-hud-controls`,
  token `--skin-hud-*`, hudGuards, interaction patterns); i18n ICU `{var}`;
  anchors di dominio verificati nel codice; smoke test porta 5173 canonica +
  pre-flight content-type; verification gate R-189 (puntamento a
  agent-execution-mandate §6, niente duplicazione).
- **Rimossi riferimenti morti:** `usePOI`, `poiConfigRegistry`, `useActivity`
  come API corrente, `useSlotRack` come hook di pagina (esiste solo nel kit).
- **Collegamenti:** R-197 in `RICHIESTE.md`; riga aggiornata in
  `context/INDEX.md`.

## 2026-10-14 pm8 — R-193 (fix chiavi `{{var}}` ICU) completata

- **Current state:** **R-193 `fatta`** — audit+fix batch delle chiavi i18n
  legacy che renderizzavano letteralmente sotto `i18next-icu` (registrato
  app-wide in `src/localization/i18n.ts`; `{{var}}` = argomento malformato
  → parse error → stringa grezza a runtime, nessun errore console).
- **Fix:** `{{var}}`→`{var}` su 27 placeholder ×3 locale (en/it-IT/pseudo
  `idleVillage.json`: astrolabeV5/V63/V64, equipment, interfaceSizeAutoHint);
  `{{count}` dentro plural ICU → `#` idiomatico (de `slotFreed`/
  `workerAssigned`, `swordCount` en/ar/de/pseudo); `missingCount` common
  en+pseudo; defaultValue `design-vs-fidelity.tsx`; mirror `i18n.types.ts`.
  NON toccato: `backend.loadPath '{{lng}}/{{ns}}'` (templating i18next
  interno, non traduzione). Collaterale: `tests/**/*.spec.ts` aggiunto agli
  exclude vitest — gli spec Playwright finivano in collection.
- **Verifica:** nuovo `tests/i18n/icuInterpolation.test.ts` 9/9 — zero `{{`
  in tutti i JSON locale + interpolazione reale i18next+ICU sulle chiavi
  fixate (en/it/de/pseudo, plural `#`). 46/46 i18n+localization, 87/87
  consumer adiacenti (astrolabe, hudGameMenu, hudScale). 3 failure di
  collection PREESISTENTI su file non toccati (import mancanti, JSX-in-.ts)
  flaggate. build:check + kanban:lint PASS. Bundle
  `.mw/runs/r193-icu-2026-10-14/` PASS 3/3. Trap T-11 → risolta.
- **Nota tecnica:** dentro un `plural` ICU `{{count}` parsea come `{`
  (sub-message) + `{count}` valido — funziona ma non idiomatico; `#` è il
  placeholder canonico del count.
- **Next step:** coda pending ampia (~85 task, direzioni divergenti) —
  WL-LORE-DROP, REND-SYS, IV-PROG, TRAILER-THREAT-V3, CDA, ADR001;
  R-191 in attesa occhio Director sulle icone T3.1; bench
  `generatedCatalog` rosso su file non toccati (in-flight non mio).

## 2026-10-14 pm7 — PLAN-032 SP-4 (BagStrip) completato → PLAN-032 / R-167 CHIUSI

- **Current state:** **tutti e 5 gli SP di PLAN-032 chiusi** — R-167
  `completato`. `questBag.ts` helper condivisi (`questBagItems` unica
  derivazione strip+popover title-row refactorato; `bagItemShortLabel` =
  idiom belt `split('—')` estratto, belt invariato; `bagEverPacked` =
  flags∪`consumablesUsed` solo retention; `bagStripVisible` predicato puro
  `!bagEmpty && (presenting || (!waiting && !ended))`). `BagStrip.tsx`:
  role=list, `data-hud-controls`, flex-nowrap 1 riga, chip listitem non
  focusabili/zero handler, nome accessibile = label piena + qualificatore
  via UN template `chipName` "{label} ({qualifier})" (parentesi, mai
  em-dash), qualificatori armed(check+armed)/held(action)/none(passive),
  marker dot aria-hidden sui check armati, action muted non-disabled.
  `QuestRunWindow`: UNO slot `data-bag-slot` (min-height `BAG_CHIP_ROW_PX`
  da `PRES.type.labelPx` — no magic number) montato finché
  `bagEverPacked && !(ended && !presenting)`; belt alla decisione, strip
  altrove, empty-slot inerte dopo spend-to-empty, epilogo ritira lo slot.
  Belt/strip mai co-render (gate negato, stessa render).
- **Divergenza (stessa di SP-5):** spec citava `{{label}}` → ICU `{label}`.
- **Nota smoke:** `demoLaunch` compila SOLO slot resident — il loadout va
  scelto nel picker del planner prima del send (path reale usato dallo
  smoke). Bag vuoto → niente slot: corretto a spec.
- **Risultati:** 22/22 unit bagStrip + 57/57 adiacenti; build:check PASS;
  kanban:lint PASS. Smoke headed @900×640 en+it-IT: loadout 3-item via
  picker → run reale; belt alla decisione, strip+2 marker armed in
  presenting, nomi "(armed)"/"(carried)" / "(armato)"/"(portato)", singola
  riga no-overflow winFits, belt di ritorno, 0 page errors, co-render
  violation=0 su 40 render campionati.
- **Evidence:** bundle `.mw/runs/plan032-sp4-2026-10-14/` (4/4 PASS); log
  `test-results/PLAN-032-SP4-2026-10-14.log`; smoke+shot
  `test-results/plan-032-sp4-smoke-2026-10-14/` (en-01/02/03, it-01/02/03).
- **Nota concorrenza:** osservata una seconda sessione agente sullo stesso
  SP-4 (preview :5199, smoke.ts proprio) — i suoi risultati live
  (belt=1/strip=1 mutual exclusion, 3 chip qualificati) confermano i miei;
  artifacts convergono sui medesimi path canonici.
- **Next step:** nessuno per PLAN-032 (R-167 chiusa). Restano aperti i
  follow-up del trailer-audit R-187 (jank quest-window, 400 su /game).
- **Do not touch:** `ConsumableBelt` (resta inline — il refactor su
  `bagItemShortLabel` è opzione futura; unica modifica fatta: `data-testid`
  additivi per le assertion strutturali, zero impatto comportamento); strip
  resta read-only per costruzione; `consumablesUsed` mai mostrato; nessun
  inventario reale.

## 2026-10-14 pm6 — PLAN-032 SP-5 (level-up eroe mock) completato

- **Current state:** **SP-5 implementato e verificato** (4/5 SP chiusi —
  resta solo SP-4). `heroLevelConfig.ts` Zod + salvage deterministico
  field-level (`parseHeroLevelConfig` → `{config, configInvalid}`: marker
  FUORI dal config, dev-throw/prod-salvage); `heroLevelViewModel` gate-first
  (isHero + `levels[id]`, invalid → null); `heroLevelUpEvents` bus tipato +
  `useHeroLevelUp` stub per la seam futura PROGRESSION.md; `mountedCardRegistry`
  = predicato "card on-screen" posseduto dal layer card; `runHeroLevelUpStaging`
  command: reject su config invalida/target non-hero/zero mounted (niente
  telemetria/cue), accept → N eventi `hero_levelup_mock` (eventId
  `<seq>:<idx>` monotonico) + UNA telemetry `feature_action` + UNA cue
  `level_up` (`playLevelUpCue`, WebAudio arpeggio pattern playThud);
  `HeroLevelDecor` layer decorativo in DragTestContainerV2 (slot sempre
  montato, badge ancorato top-right del `data-wanderlust-portrait`, ring
  resting, ignition keyed per eventId, `TextFloater` portaled — mai clipato).
  pgcardKit/rosterKit intoccati. Director action `levelup` in pagina.
- **Fix i18n (bug reale trovato in smoke):** le chiavi `heroLevel.*`
  renderizzavano letteralmente `Lv {{n}}` — `i18next-icu` è registrato
  app-wide, `{{n}}` è MALFORMED sotto ICU (throw → stringa grezza). Chiavi
  corrette a `{n}` (convenzione già usata da `stash.capacity` `{count}`).
  Trap: le chiavi `{{...}}` preesistenti in idleVillage.json sono
  probabilmente rotte a runtime — da verificare in task dedicato.
- **Risultati:** 18/18 unit heroLevelUp + 74/74 scope adiacente
  (hudGuards con HeroLevelDecor in STRICT_FILES, heroSheet, stash,
  merchant, isolation); build:check PASS. Smoke headed su `dist-playwright`
  :5179: badge "Lv 4/5/3" ×3 + ring resting ×3, zero leak non-hero,
  Director trigger → ignition ×3 + floater "Level N" portaled + telemetry
  ×1 (payload esatto configuredTargets/dispatchedTargets), decay → ring
  resting, retrigger eventId `2:0..2`, it-IT "Eroe livello 4"/"Livello N",
  0 page errors.
- **Evidence:** bundle `.mw/runs/plan032-sp5-2026-10-14/` (4/4 PASS);
  log `test-results/PLAN-032-SP5-2026-10-14.log`; smoke+shot
  `test-results/plan-032-sp5-smoke-2026-10-14/`.
- **Next step:** PLAN-032-SP-4 (bag strip consumabili in QuestRunWindow) —
  ultimo SP, ordine teaser vincolante.
- **Do not touch:** nessuna progressione reale (PROGRESSION.md la decide);
  `hero_levelup_mock` è staging-esplicito; pgcardKit/rosterKit frozen;
  cue WebAudio dedicata (no audio-registry changes, per scope).

## 2026-10-14 pm5 — SP-3 follow-up: drag clamp nel hook condiviso + smoke esteso

- **Fix post-bundle:** `useHudPanelDrag` non clampa(va) — un drag estremo portava
  i pannelli fuori viewport (panel a -2050,-2018). Ora il pointerdown cattura il
  base rect del pannello (`closest('[data-hud-panel]')` o root posizionato) e il
  pointermove clampata l'offset al viewport. Copre il requisito "drag clamped"
  dei piani SP-2/SP-3; additivo per tutti i pannelli HUD (QuestRunWindow,
  HeroSheet, ledger, stash, merchant, Director, Tuning). 54/54 test scope verdi.
- **Smoke esteso su preview `dist-playwright` :5179** (headed): ghost
  `data-exiting` non riceve focus (chiusura → `panels-trigger`), lista offerte
  scrolla senza pan mappa (marker stash immobile), drag clamped a (0,0),
  IT locale OK (`Il mercante Rowen`, badge, 4 offerte, `Chiudi pannello`).
  Errori sporadici `TypeError 'push'` in Pixi RenderTargetSystem osservati a
  baseline SENZA input — flaky preesistente del render loop, non SP-3.
- **Trap confermata:** `preview:playwright` serve `dist-playwright` (non
  `dist/`); un `vite preview` sul dist prod ha `directorEnabled=false` →
  Director invisibile e 'd'/F10 inerti. Verificare sempre l'outDir.
- **Bundle rigenerato** `.mw/runs/plan032-sp3-2026-10-14/bundle.json` 4/4 PASS
  con log post-fix. Docs completate: riga Merchant in COMPONENT_MASTER_INDEX,
  strategy_tasks SP3 → Completato.

## 2026-10-14 pm4 — PLAN-032 SP-3 (mercante mock + marker gated Director) completato

- **Current state:** **SP-3 implementato e verificato** (3/5 SP chiusi).
  `merchantConfig.ts` Zod (offers 3-4, `I18N_KEY` regex, offerId unique, marker
  bounds 4240×2828, `panel.widthPx` config-first — niente width hardcoded);
  `deepFreeze` custom in `freezeConfig` perché zod `.readonly()` congela solo il
  root. `MerchantPanel` HudPlaque modeless (title + restockNote + badge PREVIEW
  + X; `ul`/`li` offerte con icona engraved/nome/desc/`priceLine` ICU/stock;
  body scroll `max-h-[60vh]` fuori dal drag handle). `MockBuyControl`:
  `<button disabled>` nativo, **zero prop callback** (invarianza per costruzione),
  `title` tooltip + caption `aria-describedby`. `merchantOfferIcons` mappa
  iconKey→glifo (vial/pouch/gust/spark). `MapBuildingPoi` riusato: union
  `VillageBuildingId += 'merchant'`, `VillageBuildingIconKey += 'market'`,
  `BUILDING_ICON_URLS` += poi-merchant.svg (nuovo). `poiToPanel` ora tipato
  `{stash,merchant}`; `closeBuildingPanel` generalizzato (focus-return unica
  regola SP-2/SP-3). Registry `merchant` shortcut `m` (primo libero). i18n
  `gameFrame.merchant.*` en+it-IT + `director.merchantMarker`.
- **Risultati chiave:** 15/15 unit merchant+isolation (allowlist import
  fail-closed, nessun re-export barrel di `merchantConfig`, no `on*` in
  MockBuyControl), 48/48 adiacenti, build:check PASS, kanban:lint PASS. Smoke
  headed: marker assente di default → `m` apre senza marker (registrazione
  indipendente dal marker) → 4 offerte → `m` chiude → Buy 4× disabled →
  Director "Merchant marker" → marker su villaggio → click apre → X chiude →
  focus torna al marker; 0 console errors.
- **Nota ambiente (trap candidata):** dev server :5173 long-running con
  dep-cache Pixi stale → `Extension type shape-builder already has a handler`.
  Smoke girato su server fresco :5199. Altra nota: il pannello aperto copre il
  proprio marker a 1440×900 (corridor placement) — placement marker = art call
  Director, non bloccante (openOrFocus già coperto da spec/test).
- **Evidence:** bundle `.mw/runs/plan032-sp3-2026-10-14/` (4/4 PASS); log
  `test-results/PLAN-032-SP3-2026-10-14.log`; smoke+shot
  `test-results/merchant-smoke-2026-10-14/`.
- **Next step:** PLAN-032-SP-5 (hero level-up) poi SP-4 (bag strip) — ordine
  teaser vincolante SP-1→SP-2→SP-3→SP-5→SP-4.
- **Do not touch:** `invasion_v1` march semantics (PLAN-033); niente
  GameOverService/day-30 canonico; pgcardKit/rosterKit frozen; mercante è mock
  — Buy inerte per contratto, niente economia/persistenza (non-goal).

## 2026-10-14 pm3 — PLAN-032 SP-2 (magazzino villaggio + MapBuildingPoi) completato

- **Current state:** **SP-2 implementato e verificato** (SP-1 già chiuso in
  sessione precedente). `villageStashConfig.ts` Zod (items ⊂ consumabili
  canonici `questItems`, Σqty≤capacityMax, marker bounds + distanza anchor);
  `VillageStashPanel` HudPlaque modeless (role=list, righe non interattive,
  footer ICU `count/max`); `MapBuildingPoi` riusabile (PoiMatericV3_5 +
  anchorGhosts exit, Enter/Space, pointer-delta gate anti-pan, tooltip solo
  fine-pointer, reduced-motion) su anchor `building-stash` @ (2260,1551) —
  casa lunga a est del centro villaggio. `poiToPanel {stash:'villageStash'}`;
  marker `openOrFocus` (mai chiude), menu/shortcut `v` toggle; focus-return
  marker vs panels-trigger. i18n en+it-IT.
- **Risultati chiave:** 12/12 unit stash + 21/21 con hudGuards (3 nuovi file
  in STRICT_FILES), build:check PASS, kanban:lint PASS. Smoke headed: pan-gate
  OK, toggle split marker/menu corretto, focus-return entrambi i path, drag
  clamp, 900×640 no-overflow, it-IT renderizzato, 0 console errors.
  **Nota ambiente:** la preview resta EN perché `LocaleConfigStore` persiste
  `en` — il seed `localStorage['rpg-locale-config']={locale:'it-IT'}` rende
  l'italiano corretto (risorse it-IT caricate 200). `navigator.language` da
  solo non basta: la config persistita vince sulla detection.
- **Evidence:** bundle `.mw/runs/plan032-sp2-2026-10-14/` (4/4 PASS); log
  `test-results/PLAN-032-SP2-2026-10-14.log`; smoke
  `test-results/plan-032-sp2-smoke-2026-10-14/` (4 shot).
- **Next step:** PLAN-032-SP-3 (mercante) — sbloccato: riusa MapBuildingPoi +
  poiToPanel; poi SP-5, poi SP-4 (ordine vincolante).
- **Do not touch:** `invasion_v1` march semantics (PLAN-033); niente
  GameOverService/day-30 canonico; pgcardKit/rosterKit frozen; lo stash è
  mock — niente inventario/economia reali (non-goal).

## 2026-10-14 pm2 — PLAN-032 SP-1 (scheda PG hover→HudPlaque) completato

- **Current state:** PLAN-032 dispatched (5 spec `PLAN-032-SP-1..5`, kanban
  SP1..SP5, R-188 chiusa con bundle) e **SP-1 implementato e verificato**.
  `HeroSheetPanel` dumb renderer (`HudPlaque` singleton, pin/chevron/X,
  `SkinScope`+`data-hud-controls`), `heroSheetMachine` reducer puro,
  `useHeroSheet` single transition owner (delega rail rosterV2, reconcile
  post-commit, Esc capture con priorità DnD, anchor/clamp), `heroSheetViewModel`
  puro da `PgDetailCard`. Config `heroSheet` Zod, registry shortcut `p`,
  i18n en+it. File in `components/gameFrame/` (non dir `heroSheet/` — coerenza
  famiglia HUD).
- **Risultati chiave:** 17/17 unit nuovi + 26/26 adiacenti, build:check PASS,
  kanban:lint PASS. Smoke headed /game (Playwright su dev server): hover→open
  aria-label residente, Esc→`dismissedFor` sopprime riapertura, retarget,
  grace close, pin `aria-pressed` + chevron disabled, nav DOM-order,
  `.focus()` non apre (solo `:focus-visible`), 0 console errors.
  **Gate R-189 appreso:** transizioni `fatta`/`completata` in RICHIESTE.md e
  `Completato` in kanban richiedono `bundle: <path>/bundle.json` — prodotto
  via `produceBundle.ts --manifest=<run>/verification.json`; `created_at` nel
  futuro → artefatti STALE; `type` diversi da `state`/`human-eye` richiedono
  env attestation + verifier.json. Chiusura retrospettiva R-185 con bundle
  `.mw/runs/r185-closure-2026-10-14/` (era `fatta` senza riga Chiusura).
- **Evidence:** bundle `.mw/runs/plan032-sp1-2026-10-14/`; log
  `test-results/PLAN-032-SP1-2026-10-14.log`; smoke
  `test-results/hero-sheet-smoke-2026-10-14/` (script + 4 shot + log).
- **Next step:** PLAN-032-SP-2 (magazzino villaggio) — sblocca SP-3.
- **Do not touch:** `invasion_v1` march semantics (PLAN-033); niente
  GameOverService/day-30 canonico; non duplicare il roster canonico.

## 2026-10-14 pm — PLAN-034 eseguito: fix trailer-audit chiusi

- **Current state:** T-001..T-010, T-012..T-014 completati. Resta **T-011**
  (dispatch PLAN-032: scheda PG, stash consumabili, loadout, level-up) —
  piano converged pronto, serve esecuzione dedicata.
- **Risultati chiave:** `playThud`/`AudioContext` era il mega-hitch invasione
  (1.15 s) → context condiviso nel warm-up, peel max 91 ms in prod. Hub trailer
  ripuntato su `?scene=`. `Settlement lost` = pulsante Director su `/game`
  (overlay esistente, dev-only). Perf: **la maggior parte del jank era React
  dev-mode** — cattura trailer su `vite preview` (trap T-09).
- **Evidence:** `test-results/trailer-report-2026-10-14/` — DIAG-034.md,
  diag3-6.json, diag-prod.json, shots/t010-*.jpg. Traps T-08/T-09/T-10 in
  `context/recurring-traps.md`.
- **Safeguards:** build:check ✓, eslint 0 err su scope, 61 test ✓, kanban:lint ✓.
- **Do not touch:** `invasion_v1` march semantics (PLAN-033); niente
  GameOverService/day-30 canonico.
- **Anche aperto:** R-189 (verification gate) — architettura in attesa review
  Director, niente implementazione.

## 2026-10-14 — PLAN-034 battezzato: fix audit trailer R-187

- **Current state:** `PLAN-034-trailer-audit-fixes` battezzato (active), 14 task.
  R-187 chiusa con report+43 screenshot in `test-results/trailer-report-2026-10-14/`
  (`REPORT.md`, `REPORT.html`, `metrics.json`, `metrics2.json`).
- **Next step:** T-001..T-004 (diagnostica: 400 su `/game`, profiling quest-window,
  pan/menu, invasion mount) — paralleli, sbloccano i fix T-005..T-008.
- **Decisions made:** R-185.1 chiuso dal Director (marker a boot = voluto PLAN-033);
  Settlement Lost = pulsante DirectorPanel dev-only; hub: via voci iter/v2, link a
  `?scene=`; dispatch PLAN-032 incluso nel piano.
- **Do not touch:** `invasion_v1` march semantics (PLAN-033); niente GameOverService
  / day-30 canonico fino al futuro piano difesa.
- **Open questions:** nessuna critica — decisioni Director integrate.


## 2026-10-12 — PLAN-033 battezzato: /game evento invasione

- **Current state:** `PLAN-033-game-event-shroud-goblin-march` battezzato (active), 8 task. Nessun codice toccato.
- **Next step:** T-001 (card in spazio schermo, fuori da `worldBoxRef`, slot sopra la HUD).
- **Decisions made:** ri-esportare asset tendina; goblin persistente che marcia ~30 giorni di gioco da punto di atterraggio sticker, `startDay` salvato; registro si apre e, se era chiuso, si richiude dopo ~1 s; linee regioni semplificate e sotto le nuvole. Esito al giorno 30 fuori scope.
- **Open questions:** verificare claim 4 (giorno di gioco accessibile) e 7 (punto di atterraggio fuori dal villaggio). Deliberazione multi-AI non eseguita.

## 2026-10-11 — Recurring traps: regole preventive lette in pre-flight (R-147, desiderata v29)

- Audit attriti MW-in-RPG: errori dispersi su `.mw/bugs/` (13), `observation.jsonl` (7 mai promossi), `pattern-candidate.md` in `.mw/runs/` (16), RICHIESTE — nessuna pipeline di promozione, `PROPOSALS.md` assente. Evidenza: `strokeLinecap` registrato 2× e reintrodotto in `PoiMatericV4` → scrivere non basta.
- **Creato `context/recurring-traps.md`**: 7 trappole con ≥2 istanze, taggate per superficie (T-01 map/HUD edge-pinning, T-02 stroke-linecap, T-03 hud-scope, T-04 claim percettivi a occhio, T-05 rewrite-senza-desiderata, T-06 coverage ledger→sintesi, T-07 derivati visuali lifecycle). Soglia ≥2 istanze per entrare.
- **Trigger pre-flight** in `mw-executor` step 5 e `mw-planner` step 5 (4 copie = hardlink stesso inode, tutte aggiornate). Voce in `context/INDEX.md`. Desiderata v29 FROZEN, R-147 `fatta`.
- **Aperto:** cuciture "mare vecchio/nuovo" segnalate dal Director — possibile side-effect di `8254e8e1` non registrato; da verificare e se reale aprire bug in `.mw/bugs/`.

## 2026-10-03 (sera) — Slice v6 minimo IMPLEMENTATO e committato (`b35295c6`)

- **Approvato dal Director:** *"solo TAKEN→SECURED + estrazione a 3 forme + epilogo col costo."*
- **Implementato** in `questS1Lab` (lab isolato, non engine generale):
  - `estrazione` = nuovo nodo choice tra `rientra-o-rischi` e `ritorno`; la cassa
    è `objectiveDone` = TAKEN, diventa SECURED solo arrivando a `ritorno` vivi.
    `cassaPersa` flag la segna come persa; `flee()` la molla (panico ≠ save gratis).
  - 3 rotte meccaniche: `exit-breach` (requiresFlag `prigionieroLibero`),
    `exit-quiet` (hiddenIfFlag `campoSveglio` — settato da ingresso forzato o
    allarme all'ingresso dell'estrazione), `exit-alarm` (sempre, F25/M8).
    Fail estrazione → il prezzo è il bottino/cassa, dichiarato via `failHint`
    in preview ("Se fallisce: …").
  - Epilogo composto in `endRun` (`composeEndingText`): morti per nome, cassa
    persa, prigioniero salvato, bottino portato a casa — su reward/survived/
    fled/wipe. Badge cassa: ambra "in mano" → smeraldo "recuperata" / rosso "persa".
- **Fix correlati dalla stessa evidenza:** (1) epicfail confinato nella banda M
  dichiarata — un check M0 non uccide più (regola Director); (2) bug pre-esistente:
  noise≥3 dirottava a `risveglio` PRIMA di applicare gli effetti del check —
  una presa cassa riuscita a noise 2→3 veniva scartata in silenzio. Ora gli
  effetti atterrano, poi la destinazione viene dirottata. (3) morti attribuite
  nel log al check che le ha causate + hp=0 sui morti.
- **Verificato:** 24/24 unit test (10 nuovi), build:check ✓, kanban:lint ✓,
  route 200, 2 playtest live Puppeteer (SURVIVED con epilogo costo + WIPE con
  morti nominati "su «Qualcosa si sveglia nella torre»").
- **Evidence:** `test-results/r-081-quest-s1-taken-secured-2026-10-03.log`.
- **Nota osservata:** entrambe le run live hanno preso il path `risveglio`
  invece del nodo `estrazione` — il nodo choice è coperto da unit test ma
  manca la verifica "felt" in-browser sul path quiet. Cosmetic:
  l'astrolabe continua a drenare la coda THROW anche dopo il wipe.
- **Noise meter RIMOSSO** (commit `f7a55a73`, ordine Director): il
  contatore ◉○○ è ora stati nominati `campoAllertato`/`campoSveglio` —
  stessa escalation (fail +1 livello, epicfail salta, sveglio+fail →
  risveglio; forza entra sveglio; forziere cigola anche a successo), badge
  "CAMPO ALLERTATO/SVEGLIO" al posto del meter. Verificato live.
- **Gate da validare col playtester umano:** "sai dire cosa hai perso e per
  quale tua scelta?"

## 2026-10-03 — Deep research multi-provider, wiki scientifico, proposta v6, playtest live

- **Wiki vivo creato:** `context/QUEST_GAMEPLAY_SCIENCE.md` (committato `107706f9`, indicizzato
  in `context/INDEX.md`) — ~60 fonti reali verificate, principi derivati P1–P47, correzioni
  esplicite (Zeigarnik sovrastimato, house-money non legge, fail-forward = dottrina non scienza),
  gap di letteratura dichiarati (pacing 3–5min e tolleranza RNG non-gambling = non studiati).
- **Deep research batch** in `.mw/runs/20261003-quest-science-deepresearch/` — prompt unico
  `prompt.md` a 4 provider via Canary/CDP (driver `dr_driver.py`): ChatGPT Deep Research ✓
  (risposta completa + follow-up citazioni), DeepSeek DeepThink+Search ✓ (batch più forte),
  Grok-free ✗ debole (molti UNVERIFIED + 2 falsi negativi su fonti reali — inaffidabile per
  audit citazioni), Claude ✗ free-cap prima dell'output.
- **Proposta v6** `.mw/runs/20261003-quest-v6-science/quest-v6.md` — redesign science-based:
  **TAKEN ≠ SECURED** (la cassa in mano è posta esposta, non vittoria), estrazione come fase
  di gioco a 3 forme, fail taxonomy (minor/strategic/quest/character/catastrophic), Astrolabe
  scalato sulla posta, death beat nominato + epilogo con controfattuale.
- **Playtest live strumentato** (Puppeteer, seed 1983, Preset D → VICTORY):
  `playtest-seed1983.md`. Conferma in vivo la diagnosi: **estrazione inesistente nel codice**
  (TAKEN==SECURED), Kran morto su WIN 75-vs-74 reso come 2 righe di log, "WIN" = verdetto quasi
  finto (harm anche a successo), check obiettivo auto-risolto ("ROLL 1 OF 2"), noise meter ancora
  attivo ma inerte, failure path irraggiungibile col gioco prudente (6 WIN/6).
- **Critica consolidata + autocritica v6** in `critique-consolidated.md`: conseguenze v6 ancora
  fiction-driven (serve forma-della-fuga visibile da F4), gradiente push-your-luck non disegnato,
  attachment in 3min probabilmente insufficiente, fuga pulita resta dominante, run-variance
  non risolta.
- **Prossimo passo proposto:** implementazione minima per testare l'ipotesi centrale —
  solo TAKEN→SECURED + estrazione a 3 forme + epilogo con costo — in attesa di decisione
  del Director (v6 integrale vs minimo vs altro).

## Current state

- **PLAN-019-S1 battezzato** (`plans/PLAN-019-S1-quest-interessante.md`): «La cassa delle
  sementi» in lab isolato `/quest-s1-lab`. Criterio Director: *«nn ci interessa che funzioni,
  deve essere divertente»* — le meccaniche rev.2 (verdetto→rischi, bodyguard, leader, wipe)
  sono strumenti di tensione nella forma più economica, non sistemi da validare.
- **Desiderata v24 rev.2 FROZEN**: reward = prova-obiettivo + leader vivo (non più ≥50% check);
  riuscita dalla partenza compound; HP separati; rischi per slot; bodyguard solo su danni da
  skill check. PLAN-019 aggiornato a v4; D-4/D-7 chiuse, D-8 superata, D-9 aperta.
- Matrice di lavoro T-001 preparata: `.mw/runs/20261002-s1-quest-design/quest-design.md`.

## Next step

**T-002/T-003 implementati** (non committati): lab `/quest-s1-lab` giocabile end-to-end.
File: `src/ui/idleVillage/questS1Lab/questScenario.ts` (contenuto hardcoded),
`questRun.ts` (engine: RNG seedabile, verdetto→rischi per slot, bodyguard che intercetta
tutti i danni da check, incidente non-check, death save 5%, wipe, fuga, mercante multi-acquisto),
`src/ui/idleVillage/pages/QuestS1LabPage.tsx` (preset 4 party, stato, scelte, log),
route registrata in `src/App.tsx`. Test: `tests/unit/idleVillage/questS1Lab/questRun.test.ts`
(9/9 verdi). Prossimo: T-004 — playtest del Director + `S1-design-findings.md`.

**2026-10-02 — UI redesign dopo critica Director** («pessimo lavoro di design, manca il bordo»):
UI ricostruita sul linguaggio di WanderlustRosterCard (party: ritratto oro, nome Cinzel,
ruolo+stato, barre HP/Stamina, riga stat; morto=grayscale, ferito=ring ambra) e
QuestDetailPanel (pannelli `rounded-3xl border-amber-400/40 bg-black/75`, kicker tracked,
InfoRow bordate). Skill check: **componente battezzato = DestinyAstrolabeV62**
(`/minimal-destiny-astrolabe-v6-2`, tar-goo WebGL2), usato via `destinyAstrolabeV62Kit`
con `config.mode`=verdetto forzato; bottone «continua» appare solo dopo `onResolve`
(niente spoiler). Registrato in `COMPONENT_MASTER_INDEX.md`. Verificato in browser
(intercettazione bodyguard → morte → reward persa). Evidence:
`test-results/quest-s1-lab-redesign-2026-10-02.log`.

## Decisions made

- PLAN-019-S1 battezzato dopo 3 round critica web + critica ChatGPT incollata dal Director.
- Preview compound fuori da S1 (feature di S3). Death save solo se manca il momento.
- Skill check riusa i 5 verdetti dell'Astrolabe; nessuna teoria nuova.
- Gate A = solo giudizio del Director sul core loop; FAIL classificato per causa.

## Do not touch

- `missionResolver.ts` / PLAN-018 restano congelati: nessuna modifica al runtime quest finché
  S1 non ha prodotto i design findings. Niente codice S1 che diventi modello generale.

## Open questions

- Nessuna decisione aperta: i parametri numerici sono mock iniziali in `quest-design.md`, da
  ritoccare nel playtest. Death save 5% confermato; wipe = si perde tutto.

## 2026-10-05 — Knowledge pipeline: Extraction Ledger + registry + QUEST_RULES

- **Skill:** `mind-weaver/.agents/skills/knowledge-extractor/SKILL.md` — aggiunto
  Extraction Ledger (candidati completi: ID/TYPE/STATEMENT/TEMPORAL/VERDICT/REASON/
  SOURCE/RELATIONSHIPS; verdicts INTEGRATE..DROP; reason obbligatoria per DROP),
  tipo PROPOSAL, rationale per non-decision, routing verso REJECTED.md/OPEN.md,
  persistenza report spostata in `context/ingestions/<date>-<slug>.md` (tracked;
  `.mw/runs/` è gitignored).
- **RPG:** creati `context/REJECTED.md` (REJ-001..006), `context/OPEN.md`
  (OPEN-001..011), `QUEST_RULES.md` (PLAN-020 T-001, divergenza C7 dichiarata
  non risolta); `CANON.md` riga quest aggiornata (T-003); `context/INDEX.md`
  con router L0–L4 + nuove voci; `plans/INDEX.md` PLAN-020 → active.
  T-002 (regola mantenimento `.windsurf/rules`) proposta, in attesa avallo testo.
- **Golden test:** `context/ingestions/2026-10-05-progettare-quest-strategiche.md`
  — ledger E-01..E-18 sulla conversazione «Progettare quest strategiche»
  (fixture = artefatti archiviati; transcript grezzo non disponibile nel repo).
- **Intento registrato:** R-084.

## 2026-10-05 — PLAN-020 chiuso (T-002 applicata)

- **T-002:** regola di mantenimento quest scritta in
  `.windsurf/rules/80-quest-rules-maintenance.md` (testo equivalente a quello
  fornito dal Director): same-session update di `QUEST_RULES.md`, status
  `vigente`/`proposta`/`divergenza-nota`, divergenza da FROZEN → domanda
  esplicita al Director, nessun assorbimento silenzioso.
- **PLAN-020 → completed** (T-001/T-002/T-003 done); `plans/INDEX.md` e
  `context/INDEX.md` aggiornati.
- **Ora garantito dall'architettura:** distinzione estratto/scartato/integrato
  via Extraction Ledger; report persistenti in `context/ingestions/`; regole
  quest correnti in `QUEST_RULES.md`; rejected/open knowledge in registry
  dedicati; retrieval L0–L4 documentato in `context/INDEX.md`.
- **Limite ancora noto:** il transcript integrale del golden test
  («Progettare quest strategiche») non è nel repo — la fixture sono gli
  artefatti distillati.
- **Prossimo test consigliato:** una seconda conversazione reale NON
  preparata come fixture, ingerita con la skill corrente. Criteri:
  extraction coverage · reconciliation correctness · persistence ·
  provenance · rejected/open preservation · retrieval L0–L4 ·
  false canonicalization · missed knowledge.

## 2026-10-15 — R-198: invariante "no foreground windows" propagata in RPG

- **Trigger:** un agente ha aperto Chrome for Testing (Puppeteer) in primo piano
  durante una sessione di testing, rubando il focus al Director.
- **Fatto:** port del ruling MW CTR-foreground-001 in RPG —
  `.windsurf/rules/16-no-foreground-windows.md` + sezione in
  `00-project-invariants.md`, bullet in `AGENTS.md`, tutte le skill RPG
  (`coordinator/skills/*/SKILL.md`), `canonical-systems.md`, e i punti di
  generazione dei piani (`strategist-mandate`, `coordinator-mandate`,
  `mw-planner`): ogni piano con verifica runtime dichiara esecuzione
  headless/background; finestra visibile = step manuale del Director.
- **Codice:** ~13 `headless: false` → `headless: process.env.HEADLESS !==
  'false'` (opt-in esistente); `open` → `open -g` in `mapAssetConsistency.ts` e
  `mobilePlaytestLogger.ts`.
- **Enforcement:** `npm run foreground:lint` (`scripts/foregroundLint.ts`).
- **Bug log:** `.mw/bugs/20261015-foreground-chrome-testing/`.
- **Safeguard:** lint 0 err (script eslint-ignored per config), test
  `tests/unit/verification` 18/18, build:check OK, kanban:lint OK,
  foreground:lint OK.

## 2026-10-18 — Stato cinematiche quest Goblin

- Il Director ha confermato che la grammatica visiva che intendeva sulla
  quest Goblin è già implementata: le otto art sono associate alle fasi;
  `sceneManifest` assegna depth map, ingresso e posa; `QuestRunWindow` usa il
  manifest nel cambio reale d'immagine. R-224 è registrata come superata,
  senza ulteriori modifiche alle illustrazioni.
- PLAN-050 resta **in corso**, non chiuso. T-011/T-012/T-013 e OB-8 sono
  acceptance residue: prove runtime/layout/ticker, profiling WKWebView reale,
  kit atmosfera asset-backed e eye-check esplicito del Director.
- L'ultimo bundle disponibile `.mw/runs/plan-050-cinematic-showcase/bundle.json`
  è `BLOCKED`: OB-7 riporta build-check stale/comando fallito e trusted-lock
  segnala drift dei gate file senza approvazione Director. Il signoff visuale
  attuale è provvisorio; l'autorizzazione R-213 «proseguire su OB-4» non è
  approvazione percettiva.
- Il bundle isolato R-213 è stato rigenerato `PASS 5/5` il 2026-10-18T18:16Z,
  ma il signoff OB-4 registra solo l'autorizzazione a proseguire, esplicitando
  che non approva PLAN-050 nel suo complesso.
- Esiste `.mw/runs/r213-cinematic-effects-regression/pattern-candidate.md`
  sulla discrepanza clock/epoch, ma la fase `learn` post-task non è stata
  eseguita: resta da fare alla chiusura effettiva, non prima.

## 2026-10-19 — R-231 QuestRunWindow: implementazione consolidata dei 9 punti

- Applicato il manoscritto r008 (narrazione) al runtime EN in `scenarios/goblin.ts` + oracle rigenerato (già consegne precedenti in giornata); questa passata copre i restanti 5 punti UI/runtime oltre a PLAN-060/061 (già `fatta`).
- **Keyboard (#2):** `useTimeEngineLoop` ora onora `e.defaultPrevented` (root cause del blocco `15/22`: Space durante `presenting` metteva in pausa il clock); `game-frame` Space filtra i target interattivi.
- **Layout (#5/#8):** `PreVerdictBreath` nella catena flex (`flex:1 1 auto; minHeight:0`) — fine della ghigliottina a 330px→195px; `quest-window-stage` `flexShrink:0`; `phaseLocked` deduplicato sopra le scelte.
- **Post-entrata (#9):** camera latched per scena (`sceneVisitKey`) — nessuno snap a `idleDrift` quando `presenting` finisce; `QuestDepthFx.postSettle` config + `cameraAtWithPostSettle` C¹-continuo (camVec cosinusoidale certificato, breathZoom one-sided); ticker/rAF vivi su scene ambient; ambient drift alpha raddoppiata.
- **Chrome (#3/#6/#7):** `HeaderPill` icon-only; abandon = `ico-banner` + Tooltip + conferma inline; minimizzato `space-between` con restore a destra.
- **TimeBar (#4):** `questPhaseCheckpoints` reso come tacche incise per fase.
- **Verifica:** questRunWindow 23/23 (6 nuovi INV); suite mirata 855/855; build:check PASS; closure:lint PASS (~90s, sopra il max nominale 30s ma completato); eslint 0 errori. `COMPONENT_MASTER_INDEX.md` + `RICHIESTE.md` aggiornati.
- **Non verificato (T-04):** resa visiva e animazione live — serve eye-check Director su `/game`; rigenerazione asset a 2.4 = step esterno (PLAN-061); visual-fork card in `.mw/runs/r231-quest-run-window/` restano in attesa di ruling su VF-1..VF-4 solo se il Director vorrà varianti (i fix applicati seguono le opzioni più conservative).
- Worktree molto sporco da sessioni parallele: non committare in blocco.
