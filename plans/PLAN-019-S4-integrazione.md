---
title: 'PLAN-019-S4 — Integrazione: villaggio → planning → quest → ritorno → conseguenze come un unico gioco'
status: active
created: 2026-10-10
baptized: 2026-10-10 (Director «Va bene nei log … procedi»: D-S4-1..6 ratificate — epilogo ricco obbligatorio, niente scouting, coverRiskDelta cablato, destino lab differito, Trial by Fire invariato, POI repeatability per-POI con default one-shot)
desiderata: v24 FROZEN (stadio S4 «Integrazione»: «È diventata parte del gioco, non una demo isolata?»)
request: R-123
parent: PLAN-019 (figlio S4)
related: PLAN-019-S2.5 (settlement idempotente + overlay conseguenze), PLAN-019-S3 (planner completo — seam `revealAtPlanning`, `coverRiskDelta`), PLAN-025 (teatro/convergenza cinematica), PLAN-026 (generazione, parallela — campi `experimental` fino al gate S4), QUEST_RULES.md, DECISION_LOG (D-5/D-6 da chiudere qui o esplicitamente rinviare)
---

# PLAN-019-S4 — Integrazione

**Domanda (v24):** «È diventata parte del gioco, non una demo isolata?»
**Esito voluto (macro-plan):** villaggio → planning → quest → ritorno →
conseguenze sulla superficie canonica `/game`, con schermate corrette e
interessanti e invarianti rispettati. Destino delle superfici lab S1 deciso
(archiviate o strumenti di test).

## Stato ereditato (fatto, non da rifare — audit 2026-10-10)

- **Loop completo su `/game`:** POI → `QuestExpeditionDetail` (planner S3:
  party/loadout/forecast/BY MEMBER/WHY/draft) → `QuestRunWindow` (teatro,
  battiti, combat strip, hidden events) → `settleRun` journal idempotente →
  `applyQuestSettlement` → effetti su store (gold, xp, `isDead`, `isInjured`,
  `injuredUntilTick`, `isWorking=false`).
- **Conseguenze come DATO:** `CanonicalRosterBundle` mergea le conseguenze nel
  roster (`status: 'dead' | 'injured'`); `useResidentDropValidation` ammette
  solo `status === 'available'` → feriti/morti non assegnabili al lavoro;
  guarigione automatica a `injuredUntilTick`; `all_injured` → game over.
- **POI sulla mappa:** `questStatus` available/in_progress/completed/failed,
  halo di progresso, badge «decisione in attesa».
- **Seam noti e documentati:** `revealAtPlanning` (scouting esterno futuro —
  nessun edificio/residente esploratore esiste oggi su `/game`), `coverRiskDelta`
  (canale dichiarato ma non cablato nel motore — corazza onestamente esclusa
  dalla sacca), `certainChecks` (modello grafo, non più driver della preview).

## Gap vs contratto S4 — audit preliminare (da validare in T-0)

| # | Contratto | Oggi | Gap candidato |
|---|---|---|---|
| G1 | Conseguenze **visibili** sul villaggio (gate a) | dati persistiti e roster con status; `eventLog` del villaggio NON registra esiti quest/morti/feriti | il villaggio «sa cosa è successo»: voci di journal/ledger per esito, caduti, feriti, bottino |
| G2 | Legame planning → esito → conseguenza riconosciuto (gate b) | la quest finisce con outcome + «chiudi»; nessun debrief | superficie di ritorno: rapporto di spedizione (esito, caduti/feriti, bottino, cosa è cambiato) |
| G3 | «Ritorno» come fase del gioco | il run finisce e la finestra si chiude; membri rilasciati dal settlement | da verificare: la fiction del rientro esiste già nel grafo («Via del ritorno», «Ritorno al villaggio») — decidere se basta |
| G4 | Il villaggio continua dopo la quest | POI → completed/failed; blocchi sequenziali ok | lifecycle offerta: il POI ripropone quest? cooldown? nuove offerte? oggi l'offerta è statica |
| G5 | Schermate corrette e interessanti | planner/run-window/halo funzionano | inventario qualità: cosa manca per «interessante» (valutazione Director) |
| G6 | Destino superfici lab deciso | `QuestS1LabPage` ancora routata; `MissionPlannerLive` su `/primitives`; `questPoiKit`+`useQuestPoiSession` e `QuestPowerEngine` vivi per le superfici lab | archivio vs strumento di test — decisione + esecuzione |
| G7 | Seam chiusi o esplicitamente rinviati | `coverRiskDelta` non cablato; scouting esterno assente | cablare o ridefinire; scouting: in scope S4 o differito (edificio esploratore = sistema nuovo) |
| G8 | Artefatto «definizione di buona quest» | non scritto | sintesi regole validate S1–S4 → ingresso S5 |

## Decisioni ratificate al battesimo (Director, 2026-10-10)

- **D-S4-1 — Gate B:** *«quando siamo convinti lo farò»* — Gate B è
  un'attività del Director, non un task di S4. S4 prepara la build
  «giocabile end-to-end»; il playtest esterno scatta quando il Director lo
  convoca. Chiude macro-plan D-5.
- **D-S4-2 — Scouting esterno:** *«adesso niente scouting»* — **differito**.
  Il seam `revealAtPlanning` resta documentato; nessun edificio/residente
  esploratore in S4.
- **D-S4-3 — `coverRiskDelta`:** *«cablare»* — il canale va consumato dal
  motore (il portatore copre gli altri membri vivi). Una volta cablato la
  corazza rientra in sacca (il gate onesto `isExpeditionItem` la riammette
  da solo).
- **D-S4-4 — Destino lab:** *«differito»* — `QuestS1LabPage`,
  `MissionPlannerLive`, `useQuestPoiSession`/`questPoiKit`,
  `QuestPowerEngine` restano come sono; la decisione di archivio è rinviata.
- **D-S4-5 — Trial by Fire:** *«lasciamo il trial così come è»* — morte/
  ferita persistenti di S2.5 bastano; nessuna conseguenza «forte» ulteriore
  in S4.
- **D-S4-6 — Lifecycle offerta POI:** *«alcuni POI avranno attività
  ripetibili, non tutte; di default le quest una volta sparite non
  riappaiono»* — campo authored `repeatable` (o equivalente) su `questPois`;
  default **one-shot**: quest completata/fallita → offerta consumata, non
  ritorna.
- **T-1 ledger:** *«va bene nei log»* — il canale «il villaggio sa» è
  l'`eventLog`/ledger esistente, non una superficie nuova.
- **T-2 epilogo:** *«ci vuole una schermata di epilogo della quest»* —
  **obbligatoria e ricca**: morti, feriti, cose spese/distrutte
  (consumabili), reward vari, exp, titoli, malattie, informazioni, lore,
  ecc. La lista è estensibile (config-first): categorie mostrate solo se
  presenti nel settlement — titoli/malattie/lore sono categorie seam
  (authored sullo scenario, nessun sistema nuovo).

## Task

- **T-0 — Audit integrazione.** ✅ **Fatto 2026-10-10.** Tabella
  «effetto → visibile? → agisce?» in appendice «Audit T-0» sotto.
  **Esiti principali:** (1) le conseguenze **agiscono** già (feriti/morti
  esclusi dal lavoro via `status`, guarigione a `injuredUntilTick`, game
  over `all_injured`) ma **non sono narrate**: `applyPlanToState` non
  scrive in `eventLog` → T-1 confermato. (2) Epilogo assente: la quest
  finisce con una riga `outcome` + «Chiudi il rapporto» → T-2 confermato;
  i dati ci sono già (`run.party` dead/wounded, `run.gold`, `run.xp`,
  `run.loot`, `run.log` con WOUND/DEATH/LOOT+`source`, `resolvedOffer.
  rewardResolved`, flags consumabili). (3) **POI già one-shot**:
  `consumedPoiIds` persistito consuma il POI alla chiusura del rapporto
  (`game-frame-pixi.tsx` ~337) → T-3 si riduce al flag authored
  `repeatable` + test. (4) Loadout: gli item usati sono tracciati solo
  via flags cancellate — per «cose spese/distrutte» serve un record
  esplicito sul run (T-2).
- **T-1 — Il villaggio sa cosa è successo.** ✅ **Fatto 2026-10-10.**
  `applyPlanToState` scrive in `eventLog` (canale ratificato): headline
  outcome (ledger key `${runId}:log:outcome`, dedup sullo stesso ledger
  degli effetti — replay mai narra due volte) + una voce per effetto
  applicato (dead/wounded nominati dal roster, gold reward/loot distinti,
  xp; `loadout-release` silenzioso). Entry i18n: `messageKey` +
  `messageParams` (ICU) con `message` fallback; `type` badge
  (`quest_outcome`/`quest_settlement`) aggiunto allo schema entry —
  il campo esisteva già nel contratto del panel/test. Severità da
  `QUEST_SETTLEMENT.logSeverity`; `SettlementPlan.questTitle` passato dal
  chiamante (`scenario?.title`, niente ciclo import). `ActivityLogPanel`
  preferisce `t(messageKey, params)` su `message`.
  Evidence: `test-results/s4-t1-eventlog-2026-10-10.log`.
- **T-2 — Schermata di epilogo.** ✅ **Fatto 2026-10-10.** `QuestEpilogue`
  dentro `QuestRunWindow` a `run.ended` (dopo l'ultimo beat — il rapporto È
  lo stato finale, la chiusura resta «Chiudi il rapporto»).
  `buildQuestEpilogue(run, scenario)` è il modello puro: sezioni ordinate
  da `QUEST_EPILOGUE.sections` (Zod), mostrate solo se non vuote, numeri
  presi dal **piano settlement reale** (`run.settlement?.plan ?? derive`)
  — report e ledger non possono divergere. Sezioni: dead/wounded (nomi dal
  party + recovery countdown `~Nd` dal roster), consumed
  (`run.consumablesUsed` — nuovo record motore ai 4 punti di spesa flag:
  drinkPotion, useHealing, consumable check, `option.consumesFlag`; flag
  catalogo → `labelKey`, ignoti raw), reward/loot/xp (split per chiave
  effetto), info (`intelLabels`), **titoli/malattie/lore** = seam authored
  `ScenarioEpilogueSchema` sullo scenario con grant `requiresFlag`/
  `requiresOutcome` — `epilogue` in `PRESENTATION_KEYS` (non invalida run).
  Authored su goblin: titolo «Sterminatori dei goblin» (reward) + lore.
  Prop `scenario` su QuestRunWindow (mount `/game` + lab page).
  Evidence: `test-results/s4-t2-epilogue-2026-10-10.log`.
- **T-3 — Lifecycle POI (D-S4-6).** ✅ **Fatto 2026-10-10.** `repeatable`
  authored su `QuestPoiSchema` (absent = one-shot; entrambi i POI dello
  slice restano one-shot). Il consumo one-shot esisteva già
  (`consumedPoiIds` persistito, POI consumato alla chiusura del rapporto
  su run ended+settled); il task ha aggiunto il canale authored e i
  predicati puri `poiConsumesOnReportClose`/`isPoiConsumed` — un
  repeatable ignora anche un record consumato stale (migrazione onesta).
  `game-frame-pixi` li usa nei 3 punti (consume-write, filtro anchor,
  filtro exemplar). `run.clear()` invariato: `questStatus` derivato torna
  `available` finché la finestra è aperta. `questStatus` resta derivato
  dal run — il «persistito» di questa fase è `consumedPoiIds`.
  Test in `questOffer.test.ts` (29/29).
  Evidence: `test-results/s4-t3-poi-lifecycle-2026-10-10.log`.
- **T-4 — ~~Convergenza superfici~~ → differita (D-S4-4).** Le superfici lab
  restano invariate; si registra solo l'inventario nel piano (T-0) e il
  rinvio esplicito.
- **T-5 — `coverRiskDelta` cablato (D-S4-3).** ✅ **Fatto 2026-10-10.**
  `coverDeltaFor(state, memberId)` nel motore: pp-delta dei flag-item con
  `coverRiskDelta` applicato a OGNI altro membro vivo finché il portatore
  regge. **Portatore = leader** (convenzione S4: nel bag party-level non
  esiste assegnazione per-membro; il leader è lo slot richiesto — il
  porta-stendardo; se cade l'aura cade; non beneficia del proprio
  stendardo). Snapshot al roll: portatore caduto SU quel check copre
  comunque quel check. Cablato in `rollCheckHarms`, `memberRisk` (param
  opzionale cover), `previewOption.perSlot`/`interceptor`,
  `questSimulation` (entrambi i call-site) — forecast e motore dicono lo
  stesso numero. Stendardo: `engineFlag 'hasGuardianBanner'` + voce stash
  `kind:'passive'` (nuovo enum — la belt non lo rende cliccabile, il bag
  popover lo elenca). `isExpeditionItem`: `coverRiskDelta` esce dalla
  lista fake → stendardo eleggibile; corazza e lama restano fuori
  (`deathChanceDelta`/`statDeltas` carrier ancora non cablati — onesto).
  Nota authored: i check goblin hanno tutti `risk:{0,0}` (danno
  posizionale HP) — il canale è reale e misurato (test su check a banda
  reale), la presa authored arriverà con bande di rischio future.
  Residuo preesistente registrato: `createRun` risolve il loadout flag
  solo su `questId==='goblin'` — item flag packed su rovine sono muti
  (gap già presente, non T-5). Test: 3 nuovi engine + eleggibilità
  aggiornata; 186/186 scope quest, digest MC intatti.
  Evidence: `test-results/s4-t5-cover-risk-2026-10-10.log`.
- **T-6 — Artefatto finale + loop E2E + chiusura.** «Definizione di buona
  quest» (ingresso S5, da proprietà emerse S1–S4); E2E del loop completo
  villaggio→quest→epilogo→conseguenze→villaggio (incluso POI one-shot
  consumato); safeguard completi; aggiornamento piani/kanban; gate Director.

## Gate (macro-plan)

- (a) conseguenze visibili **e agenti** sul villaggio — non solo persistite;
- (b) il giocatore riconosce il legame planning → esito → conseguenza;
- (c) loop completo verificato E2E + safeguard di progetto verdi;
- (d) giudizio del Director. Gate B (playtest esterno) candidato qui → D-S4-1.

## Rientri

- Se il gate (b) fallisce perché il problema è la *quest*, non la
  superficie → si torna a S1/S3 sulle regole, non si rattoppa il debrief.
- Se T-4 scopre che una superficie lab è ancora l'unica fonte di una
  funzionalità → si porta la funzionalità, non si cancella la pagina.

## Note di coordinamento

- **PLAN-026 in parallelo:** i campi generazione restano `experimental` fino
  al gate S4 (deroga registrata 2026-10-10). Non toccare file `generation/**`
  in questo piano.
- Invarianti: config-first/Zod, i18n, primitive esistenti, PersistenceService,
  Zustand per stato dominio, JSDoc, evidence in `test-results/`.

## Appendice — Audit T-0 (2026-10-10)

Verifica per-effetto: il settlement produce questi effetti
(`deriveSettlementPlan` → `applyPlanToState` → store + ledger dedup).

| Effetto settlement | Agisce? | Visibile oggi? | Gap |
|---|---|---|---|
| `resident-dead` → `isDead`, `isWorking=false` | ✅ roster `status:'dead'` (CanonicalRosterBundle merge), drop-validation esclude ≠'available', permanente | ⚠️ parziale — il roster mostra lo status ma niente lo *racconta* | eventLog |
| `resident-wounded` → `isInjured`, `injuredUntilTick`, `isWorking=false` | ✅ escluso da lavoro/quest, guarisce a `injuredUntilTick` | ⚠️ parziale — idem | eventLog |
| `village-gold` / `village-xp` | ✅ risorse aggiornate | ⚠️ implicito nei contatori HUD | eventLog |
| `loadout-release` | ✅ riserva sacca rilasciata | ❌ nessuna traccia | epilogo (T-2) |
| outcome quest (reward/survived/fled/wipe) | ✅ `questStatus` POI + blocchi sequenziali | ⚠️ solo chip stato sul POI | eventLog + epilogo |

**Loop POI (verificato):** il POI è già **one-shot** — alla chiusura del
rapporto su run ended+settled, `game-frame-pixi` marca `consumedPoiIds`
(persistito via PersistenceService) e fa `run.clear()`: il POI esce dalla
mappa per sempre. T-3 = flag authored `repeatable` su `questPois` che salta
il consume (i POI ripetibili restano, le quest di default spariscono —
D-S4-6).

**Inventario dati per l'epilogo (T-2):**

| Categoria epilogo | Fonte oggi | Stato |
|---|---|---|
| Morti / feriti | `run.party[].dead/wounded` + `run.log` (WOUND/DEATH con testo authored) | ✅ |
| Reward | `run.resolvedOffer.rewardResolved` + `run.gold` (bottino separato) | ✅ |
| Exp | `run.xp` | ✅ |
| Bottino / loot | `run.loot[]`, `run.bottinoOro` | ✅ |
| Informazioni scoperte | `run.info[]` | ✅ |
| Cose spese/distrutte | flags consumabili rimossi dal set iniziale | ⚠️ serve record esplicito (`consumablesUsed` sul run) |
| Titoli / malattie / lore | — | 🔲 seam authored: `epilogue` opzionale sullo scenario |
