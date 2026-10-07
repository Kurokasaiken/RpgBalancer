---
title: 'PLAN-022 — Quest «Sterminio dei goblin» nel lab S1: targeting posizionale, HP, combattimento a turni'
status: active
created: 2026-10-06
desiderata: v24 (FROZEN) — stadio S1, quest authored nel lab
request: R-089
parent: PLAN-019 (stadio S1)
related: quest_sterminio_goblin_spec.md (authored Director), questRun.ts, questScenario*.ts, QuestS1LabPage
---

# PLAN-022 — «Sterminio dei goblin» nel lab S1

## Perimetro

Implementare la quest authored dal Director (`quest_sterminio_goblin_spec.md`,
F0–F7) come **terzo scenario del lab S1** (`questId: 'goblin'`), con il modello
di **targeting posizionale a cascata** e **HP per-PG** definiti dal Director.

**In scope:** meccaniche della quest, scenario hardcoded, UI lab, simulazione
MC per calibrazione, testi per esito.

**Fuori scope:** motore generico/DSL (S2+), mapping stat reali → HP
(produzione), QuestTheatre/PLAN-021, modifiche alle quest cassa/rovine.

## Regole vigenti ratificate (dalla spec — fonte unica)

- **Targeting posizionale:** 1→100 / 2→20·80 / 3→0·20·80 / 4→0·0·20·80 sugli
  slot **vivi**; a ogni morte gli slot scalano e il profilo si ricalcola.
- **HP:** eroe 100, altri 60 (mock — ereditati dalle stat reali in produzione).
  **0 HP = morte.** La ferita resta la meccanica separata vigente.
- **F4 combattimento:** 4–6 turni; check `FORZA` diff 25 a turno (attacco);
  colpi al party: 1 a T1–T2, 2 da T3, mai stesso bersaglio nello stesso turno;
  escalation T1 `0/0/20/80` → T2 `0/5/25/70` → T3+ `5/10/25/60` (placeholder);
  **nessuna morte secca in F4** — solo danno HP.
- **F1:** solo 2 check — `PER` (successo → bonus Stealth F3) e `PER+FOR`
  (successo → apre F2, fallimento → −10 HP).
- **F2:** gated da F1 `PER+FOR` riuscita; `DEX` → oggetto comunque; fail =
  10 danni + `campoAllertato` (malus F4).
- **F3:** Stealth (`DEX`: +Danno F4 / fail = Allerta→malus F4) vs Assalto
  (`FOR`: +Danno moderato F4 / fail = niente).
- **F5:** scelta — lasciar fuggire (agguato mite) vs incalzare (`FOR` a bande:
  bigwin/win = sterminio; almost = fuga, agguato mite; fail = agguato
  peggiorato; epicfail = danni + agguato peggiorato).
- **F6:** turni esplorazione — danni 5→10→15… profilo slot + check `INT`/`PER`
  a turno; fermarsi = libero.
- **F7:** se F5 non chiude → agguato: **5 danni secchi a tutti** + scelta:
  lasciare trofeo (quest persa) o combattere (**un turno secco** F4-like,
  qui la morte esiste — attesa: muoiono quasi tutti tranne l'eroe).
- **Consumabili:** solo prima di check/scelta — Bonus Forza ×1 fase, Bonus
  Percezione ×1 fase, Healing +20 HP.
- **Reward:** XP sempre; trofeo → Gold al ritorno; abbandono trofeo = quest
  persa.
- **Testi:** ~75 righe per esito authored nella spec (sezione «Testi per
  esito») — da usare come narrato dei nodi.

## Must-not-change (regressione)

- `questRun.ts`/`questSimulation.ts`/`QuestS1LabPage.tsx`: il comportamento di
  `questId 'cassa'` e `'rovine'` resta identico — targeting posizionale e HP
  attivi solo per `'goblin'` (gating per questId).
- `SLOT_RISK`, intercettazione bodyguard, `TUNE`, verdicts e bande esistenti.
- Logica animazioni/UI dei componenti esistenti (vincolo Director).

## Task

- **T-001 — Engine: HP + targeting posizionale.**
  `RuntimeMember` + `hp`/`maxHp` (mock 100/60, 0=morte). Nuovo
  `rollPositionalTarget(state)` — profilo su slot vivi, ricalcolo alla morte.
  Estendere `applyHarm`/risoluzione danni per `'goblin'` senza toccare il
  path cassa/rovine. Test: profilo per 1/2/3/4 occupati, scaling alla morte,
  nessun doppio colpo sullo stesso PG nello stesso turno.
  depends: —
- **T-002 — Scenario `questScenarioGoblin.ts` + tipi.**
  Nodi F0–F7 dalla spec con testi authored; `QuestId` + `'goblin'`; party
  preset fisso (eroe + 3 membri, Forza-based). Nuovi kind minimi:
  `combat` (F4, F7-fight) con param `turns`, `hitsPerTurn`, `checkPerTurn`,
  `escalation`; gate per F2 su flag F1; F6 come nodo loop decision/check.
  Test: grafo raggiungibile, beat monotoni, flag F2.
  depends: T-001
- **T-003 — Run engine: fasi goblin.**
  Resolver per `combat` (turni, escalation, colpi mai stesso bersaglio,
  no death in F4, death in F7-fight), F5 a bande (map almost→fuga mite),
  F6 loop (danno crescente 5+5k), F7 (5 danni ingresso + scelta + turno
  secco), reward XP+trofeo→Gold, consumabili gateati su check/choice.
  Test: bande F5, escalation T1/T2/T3+, no instant death F4, F7 5-danni,
  trofeo perso = quest persa, XP sempre.
  depends: T-002
- **T-004 — UI lab.**
  `QuestS1LabPage` + componenti: selezione scenario goblin, rendering turni
  di combattimento nel log (colpo per colpo, profilo slot visibile), scelta
  F7 trofeo/combatti, F6 continua/fermati, HP nella party strip,
  consumabili solo su nodi check/choice. i18n chrome `idleVillage:`.
  depends: T-003
- **T-005 — Simulazione MC + calibrazione.**
  `questSimulation.ts` su scenario goblin: output per-slot morte/danno%;
  verifica attese Director (S4 muore mediamente, S2 20–30%, S3 50–70%;
  F7-fight: quasi tutti tranne l'eroe). Correggere i placeholder
  (danni/turno, agguato mite/peggiorato, +Danno/Allerta F3, limite F6) e
  riportare i valori finali nella spec.
  depends: T-004

## Safeguards

`npm run lint -- <scope>` · `npm run test -- <scope>` · `npm run build:check`
· `npm run kanban:lint` · evidence log `test-results/plan-022-<data>.log` ·
smoke manuale su `/quest-s1-lab` (3 scenari).

## Changelog

- **2026-10-06 — Polish lab (Director feedback).** Pagina navigabile con
  scrollbar dedicata sempre visibile (wrapper `quest-s1-scroll` + regole
  `::-webkit-scrollbar` in `index.css`, ambient fissato a `h-screen`, overlay
  check scrollabile); arte online public domain per ogni fase goblin
  (`public/assets/quest-goblin/`, provenance in `SOURCES.md`, mapping
  `NODE_ART` per tutti i nodi `gob-*`); `ResolvedCheck.outcomeText` — dopo la
  risoluzione la cinematica mostra la frase che spiega cosa è successo con
  quell'esito (narrativa authored + conseguenze fisiche, anche per i turni di
  combattimento); picker ridotto alla sola quest «Sterminio dei goblin»;
  chiavi i18n `questS1Lab.quests.goblin.*` + `pickQuest` aggiornata; scene art
  usa il campo `fit` (cover/contain) e altezza aumentata.
- **2026-10-06 — Calibrazione check combattimento (Director).** Il bound del
  turno F4 era `score + 25` → ~95% a turno (combattimento deterministico).
  Ora `TUNE.goblinCheckDifficulty = 20` **sottratta** allo score: miglior FOR
  del party (70) → ~50% a turno; vantage assalto +10 → 60%, stealth +15 → 65%,
  allarme → 40%. Stessa formula per l'ultima mischia F7 (ora un coin flip
  drammatico). Spec authored aggiornata (riga parametri + sezione F4).
  Verificato live: turno 1 bound 60 con `vantaggioPiccolo`.
- **2026-10-07 — Fun Audit (R-096).** Tooling `scripts/quest-goblin-fun-audit.ts`:
  stesso engine reale, 4 policy fisse preservate + policy `random` esplorativa
  (N=20k) con trace per decisione (snapshot before/after, checkQueue per
  attribuzione corretta dei verdict). Report designer:
  `test-results/quest-goblin-fun-audit-report-2026-10-07.md` (sezioni A–I,
  score + verdict). Findings principali: F5 «Incalzare» strutturalmente
  dominante (free-roll: win→sterminio+no agguato, fail→stesso agguato di
  default); F6 razzia = unica sorgente di wipe (escalation danno) e tradeoff
  gold↔morti vero; F7 = scelta di valuta pulita confermata; timing consumabili
  con valore futuro reale (save≥1 → reward 63.7% vs always-spend 53.7%);
  designated victim Kran (44% dei colpi); nessun comeback meccanico
  (recovery 1.5%). Nessuna modifica all'engine o al bilanciamento.
- **2026-10-08 — Micro-iterazione F5 + consumabili (R-097).** F5 non era più un
  free-roll: `gob-lascia-fuggire` ora setta `agguatoMite` (flag prima morto —
  mischia F7 a 20), fail/epicfail su `gob-incalza-check` paga pedaggio
  posizionale immediato (10/20, TUNE `pursuitFailDamage`/`pursuitEpicfailDamage`)
  e setta `agguatoPeggiore` che (a) alza la mischia a 30 e (b) **nasconde
  «Lasciare il trofeo»** (`hiddenIfFlag`) — mischia obbligata, niente bailout.
  Sweep `scripts/quest-goblin-f5-sweep.ts` su 4 candidati → scelto C2.
  Preview consumabili: `consumableFutureChecks()` in questRun lista i check
  authored futuri che accettano la flag (stesso `consumableBonusFor` del
  resolver, stato ipotetico); `QuestCheckPreview` mostra la riga "later"
  sotto il controfattuale, ricalcolata da `run` a ogni render. Chiavi i18n
  `sim.consumableLater`/`consumableLast` (en/it-IT/pseudo). Spec authored
  aggiornata (F5). Test: +6 in questGoblin.test.ts (14/14).
- **2026-10-08 — R-097 v2 (Director respec).** Il gradiente F5 è invertito:
  `gob-lascia-fuggire` → `agguatoPeggiore` (si riorganizzano, mischia a 30);
  Incalzare paga **sempre** il pedaggio `pursuitTollDamage` (10, epicfail 20)
  e la fuga post-fail setta `agguatoMite` (mischia a 20). Bailout F7
  riabilitato su tutte le varianti. Struttura risultante: flee = resa
  differita (agguato pesante + bailout), pursue = sangue certo ora + 77%
  pulito + fail→agguato debole. Test consumabili: scope one-check e
  parity preview↔resolver verificati. 19/19 goblin tests.
- **2026-10-07 — UI honesty hotfix (R-097 follow-up).** Tre bug/gap dal
  playtest del Director: (a) astrolabio V62 — il target forzato del verdetto
  cadeva fuori dalla propria zona (valli stella a ~37% della punta; bound >82
  oltre il muro) → palla nel catrame con card WIN; fix `honestTargetPos` +
  `findZonePoint` in `ballGuidance.ts` (scansione zona-validata,
  preferenza sull'angolo authored, null→fallback authored). (b) icone stat
  mancanti: `STAT_ICONS` (LabStat→lucide) in questRun.ts, resi in
  QuestCheckPreview + chips contributor/party della pagina. (c) pedaggio F5
  invisibile: spostato da TUNE a campo authored `upfrontDamage` sul nodo
  (sorgente unica per resolver e preview); `analyzeCheck` espone `toll`
  (amount/epicfail/expected/targetName modale), la riga `sim.toll` mostra il
  costo certo prima delle bande, e il log HARM/DEATH del pedaggio entra in
  `outcomeText` sotto la cinematica. Copy authored F5/F7 ripristinato
  (semantica v2 invariata). Test: +5 findZonePoint (14/14 astrolabe),
  19/19 goblin, suite quest 76/77 (pageCrash.repro pre-esistente).
