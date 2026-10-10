---
title: 'PLAN-019-S3 — La parte precedente: Planner vivo (BY MEMBER + WHY + delta), informazione nota/ignota, check certi, trade-off misurati'
status: completed
created: 2026-10-09
baptized: 2026-10-09 (Director «approvo»: D-S3-1, D-S3-3 con `revealAtPlanning` in scope, draft party persistente — tutte ratificate)
desiderata: v23 FROZEN (Mission Planner, rev.1–4), v24 FROZEN (stadio S3 «la parte precedente», rev.1 p.10 preview sui check certi + rev.2 preview compound su ipotesi)
request: R-118
parent: PLAN-019 (figlio S3)
related: PLAN-018 (precedente implementativo da mappare riusa/adatta/superato/manca), PLAN-019-S2.4 (planning surface v0 già su /game), PLAN-019-S2.2 (adapter residente→party, mockChannel int/cha), quest_theatre_spec.md, QUEST_RULES.md, `.mw/runs/20261004-rovine-preview-chatgpt/preview-prompt.md` (spec preview MC — tensione MC vs DP chiusa qui), DECISION_LOG 2026-10-01 (informazione secondaria, morte=risorsa, slot obbl/secondari)
---

# PLAN-019-S3 — La parte precedente

**Domanda (v24):** «Preparare la spedizione è altrettanto interessante?»
**Esito voluto:** il giocatore può decidere **chi mandare e perché** — trade-off
reali, non «il numero più alto».

## Stato ereditato (fatto, non da rifare)

S2 ha già consegnato una planning surface v0 su `/game` (S2.4):

- `QuestExpeditionDetail` (FloatingPanel, POI → detail): slot rack trusted
  filtrato su `poi.slots`, drag dal roster reale, eleggibilità
  (`questResidentEligibility`: morto/away/esaurito/inExpedition/incompatibile),
  forecast aggregato `estimateForPartyAsync` (MC chunked+abortable, stessa
  `ScenarioInstance` congelata che il run gioca) con chip reward/ferita/morte/
  wipe + durata, sacca con riserva loadout, `send()` con ri-validazione.
- `QuestSimResult.perMember` **già accumula** `woundPct`/`deathPct` per membro —
  i dati BY MEMBER esistono, non sono esposti.
- Feriti ammessi con penalità nei dati (HP ridotti + modificatori
  `InjuryEngine` dentro `residentToQuestMember`); morti fuori.
- Conseguenze persistenti reali (S2.5): morte/ferita/bottino/delta su store.

## Gap vs contratto v23 FROZEN + v24 — il perimetro di S3

| # | Contratto | Oggi | S3 deve |
|---|---|---|---|
| G1 | Tre zone PARTY/LOADOUT/OUTCOME con INPUT/OUTPUT netti | PARTY parziale (slot rack), LOADOUT solo sacca, OUTCOME = riga di chip | OUTCOME diventa zona: aggregato + BY MEMBER sempre visibile + WHY + delta |
| G2 | BY MEMBER obbligatorio (chi assorbe il rischio è visibile, «carne da macello») | `perMember` esiste nel sim, non mostrato | esporre per-slot: ferita/morte/esposizione per membro |
| G3 | WHY causa→effetto (`+ Companion → +Str → − injury`) | assente | contributi per sorgente (stat, slot, loadout, ferito) in linguaggio non tecnico |
| G4 | Delta vs configurazione precedente (`18% → 11% ↓`), reversibilità esatta | forecast ricalcola ma non mostra delta | delta su ogni metrica; ripristino config → outcome identici (test) |
| G5 | Informazione nota/ignota: preview solo sui **check certi**; primaria sempre nota, secondarie/pericoli rivelate | forecast aggregato su tutta la run, nessuna distinzione | modello «cosa si sa a planning» (T-1) — preview per-check **ridiretta** dal Director 2026-10-10 a forecast aggregato orientativo |
| G6 | Successo/durata/rischio leggibili come conseguenza delle scelte | chip aggregati | delta + WHY li rendono causali |
| G7 | Mappatura PLAN-018 riusa/adatta/superato/manca | mai scritta | artefatto T-0 |
| G8 | Trade-off reali misurati (gate a/b) | nessuna misura | sweep MC: nessun party dominante + run non risolta nel planner |

## Decisioni di struttura registrate nel piano (da ratificare al battesimo)

- **D-S3-1 — Il Planner È il detail evoluto, non un secondo pannello.**
  v23 chiede «pannello separato, FloatingPanel non bloccante, apribile prima
  della partenza»: separato *dalla vista di run*, non dal detail.
  `QuestExpeditionDetail` è già esattamente quello — FloatingPanel aperto dal
  POI prima del lancio. S3 lo evolve a Planner completo invece di creare una
  superficie parallela — coerente con D-F («un solo componente»).
  (Rilievo critico r1: la formulazione ambigua «il detail evoluto» sembrava
  negare il requisito «pannello separato» — chiarito; il vincolo v23 è già
  soddisfatto in struttura, il task è riempirlo del contratto OUTCOME.)
- **D-S3-2 — MC, non DP esatta.** La tensione R-082 (MC vs DP) si chiude a
  favore del Monte Carlo **sullo stesso motore del run**: su grafo con scelte
  la DP esatta di PLAN-018 (sequenza lineare) non è applicabile; la stima MC
  campiona la stessa distribuzione da cui il resolver campiona → il contratto
  «preview = distribuzione giocata» è preservato. La preview sui **check
  certi** (v24 rev.1 p.10) resta un numero puntuale per check, non la stima
  composta.
- **D-S3-3 — Informazione secondaria legata all'esplorazione, non al party.**
  DECISION_LOG 2026-10-01: la stat primaria di ogni fase è sempre nota; le
  secondarie e i pericoli sono informazione rivelata dall'esplorazione. A
  **planning** (pre-lancio) il giocatore vede: primaria di ogni fase sul
  percorso nominale + indici sui pericoli dichiarati `previewHint` authored;
  le rivelazioni più profonde restano dentro la quest (esplorazione = scelta
  in-run, non bonus di planning). Un membro con tag esploratore alto può
  rivelare indizi aggiuntivi a planning — meccanica opzionale, proposta
  `revealAtPlanning` per-slot a soglia di stat derivata.

## Modello «check certi» (v24 rev.1 p.10)

Un check è **certo** a planning se: (a) ogni cammino dal nodo di partenza a
un qualsiasi terminale passa per lui — **dominatore** di tutti i cammini
residui sul grafo dello scenario congelato nell'offerta, e (b) la stat
primaria è nota. Algoritmo: sui successori dello start, si marca il check
candidato come «muro» e si verifica con reachability che nessun terminale è
più raggiungibile senza attraversarlo; i grafi hanno cicli (loop F6) →
visita con `visited` set, il ciclo non inganna il dominatore (un check sul
ciclo non domina: esiste sempre un cammino che lo evita). Solo i certi
entrano nella preview numerica per-check; gli incerti mostrano primaria +
indizi, mai una percentuale inventata (niente numeri dove manca il modello —
mitigazione macro-plan registrata). Test obbligatori in T-1/T-4: grafo
lineare, ramificato senza dominatore, dead-end, ciclo (F6), checkpoint
opzionale.

La preview composta di run resta MC su ipotesi dichiarate: la strategia di
simulazione usata è dichiarata nella UI («ipotesi: percorso X, consumabili Y»)
— niente numero secco presentato come verità.

## Task

- **T-0 — Mappatura PLAN-018 (FATTO 2026-10-09).** Tabella completa in
  appendice «Mappatura PLAN-018» sotto. Righe controverse: nessuna bloccante —
  l'unica decisione è il destino delle superfici lab legacy, già assegnato a
  S4 dal macro-plan. `MissionPlannerLive` resta su `/primitives` (strumento
  storico) finché S4 non decide.
- **T-1 — Modello informazione (FATTO 2026-10-09).** Schema config (Zod)
  `questPlannerInfo` (`QUEST_PLANNER_INFO`): budget probe + cap hint +
  switch `revealAtPlanning`. Schema scenario: `previewHint`/`revealHint` sui
  nodi, `revealAtPlanning {stat, threshold, reveals?}` sugli slot — authored
  su goblin (esploratore perc≥60; hint su combattimento/incalza/cerca/
  agguato). `questCertainty.ts`: `certainChecks` = dominanza-per-rimozione
  sul grafo nodo→nodo **estratto dal motore reale** (BFS su stati astratti;
  opzioni check espanse per OGNI dado via seam `forceDie` in `submitCommand`
  → copertura verdetti esatta, routing legacy e `verdictTable` inclusi;
  conservativo: edge mancante = certezza negata, mai falsa). `planningHints`
  + `memberReveals` per la meccanica reveal. Test 10/10: matrice piano
  (lineare/ramificato/dead-end/ciclo/checkpoint/split-verdict) + goblin/
  rovine reali. **Finding strutturale: goblin ha ZERO check certi** — ogni
  check sta su un ramo evitabile (approcci alternativi + ritirate) → il
  pannello «check certi» sarà vuoto su questa quest; rovine ha `rv-fiume`.
  Segnale per T-4: la preview numerica per-check si accende solo dove la
  struttura la giustifica — coerente col vincolo «niente numeri dove manca
  il modello».
- **T-2 — OUTCOME zone nel detail.** ✅ **Fatto 2026-10-09** — BY MEMBER
  (per-slot da `sim.perMember`), delta vs configurazione precedente, WHY
  con contributi per sorgente, contratto overflow e misura MC.
  **Implementazione:** `QuestSimResult.whyBySource` raccoglie i `HarmEvent`
  per `source` (titolo nodo — ogni path di danno lo stampa: check, combat,
  imboscate, toll, attrition) dentro gli STESSI run MC — zero sim extra;
  `computeForecastDelta` = diff pp sulle metriche headline; la sessione
  tiene il previous-estimate (mai 'incomplete' come baseline); la UI
  `QuestExpeditionDetail` mostra `aggregato → BY MEMBER → WHY → intel` in
  regione scrollabile (`quest-s1-scroll`, cap 320px) mentre header/rack/
  loadout/send restano ancorati — pattern D-7, `FloatingPanel.maxBodyHeight`
  700px. Intel authored (`previewHint` sempre + `revealHint` se lo slot
  `revealAtPlanning` è sbloccato) atterrata qui come prima UI del modello
  T-1. Config: `QUEST_PLANNER_INFO.outcome` (maxWhySources 5 =
  degradazione display-side, analysisMaxHeightPx, panelMaxBodyHeightPx).
  **Misura MC:** forecast completo goblin 400 run = ~65ms vs budget
  `forecastBudgetMs` 300 — l'attribuzione WHY è O(#eventi) dentro i run,
  non sim parziali per sorgente: il budget plan temuto non serve, la soglia
  resta la `forecastBudgetMs` esistente (misura nel log evidence).
  **Reversibilità:** E2E `A→A+PG→A+PG+item→A` bit-identico verificato; la
  gamba item documenta il contratto (consumabili esclusi dal forecast →
  nessun ricalcolo). Test: 4 unit (attribution/shares/delta/reversibilità)
  + E2E con asserzioni BY MEMBER/WHY/intel.
- **T-3 — LOADOUT zone.** ✅ **Fatto 2026-10-10** — canale durata reale
  (non delta rischio finti), draft persistito POI+giorno, eleggibilità
  onesta degli item.
  **Implementazione:** `loadoutDuration(ids, ticksPerNode, estimatedTicks)`
  in `questExpedition.ts` — `durationMult`/`durationDelta` degli item
  dichiarati in schema rimappano il passo per-nodo; `send` passa
  `clock.nodeTicks = expeditionDuration.nodeTicks` → `state.nodeTicks` è
  il vero passo del run e `questDurationTicks` (halo) lo usa (fallback
  `poi.ticksPerNode` per run legacy con nodeTicks 0): Planner, run e halo
  condividono la STESSA derivazione. `isExpeditionItem` stretto: eleggibile
  solo se OGNI canale di gioco dichiarato è consumato dal motore
  (engineFlag o durata) — `quest_armor_heavy_plate` escluso perché dichiara
  `deathChanceDelta` non consumato (niente promesse false nella sacca).
  `descKey` su item + mount `quest_mount_draft_horse` (×0.5) authored.
  Detail: chip durata con fattore ×N (tone ok/warn), tooltip effetto.
  **Draft (ratifica battesimo):** `idleVillage.questExpeditionDraft.<poi>.<day>`
  via `saveData`/`loadData`/`clearData` (sessionStorage in playwright) —
  scrittura debounced 600ms, restore con re-validazione per eleggibilità
  (un caduto non risorge), clear al send. Fix reale trovato dai test: il
  gate restore→write era un ref (mai re-armato se un edit arrivava durante
  il load) → `draftReady` come state. Hook E2E: `toggleItem`, `clearSlot`,
  `getClock` + `currentDay`.
  **Test:** unit `loadoutDuration` (identità/cavallo ×0.5/consumabili
  neutri/clamp ≥1) + `isExpeditionItem` onesto; E2E draft — write-path su
  record persistito reale, close/reopen in-memory, restore post-reload con
  seed della chiave del giorno corrente (il clock gira live e l'autosave è
  ≥30s: il legame giorno-chiave non è allineabile in-test — documentato).
- **T-4 — Preview + authoring pass (ridiretto Director 2026-10-10).**
  Il pannello pre-lancio mostra il forecast **aggregato e orientativo** del
  party (% successo / ferita / morte — già live da T-2); **non** rivela la
  strada vera né chance puntuali per check: il risultato dipende da scelte,
  consumabili e push-your-luck in-run. Il modello `certainChecks` resta
  (seam per-gate (c)), ma il pannello non è per-check. Contenuto del task:
  copy pass goblin («Un nascondiglio»→«Tesoro nascosto», titoli scena
  «Assalto»/«Incalzare», trade-off tesoro reso esplicito nel copy), marker
  `hidden` sui nodi fuori percorso (icona eye-off + tooltip «Evento
  nascosto» in caption e titoli dei beat), rimozione di `revealAtPlanning`
  dallo slot Esploratore — il campo resta nello schema come seam authored
  ma la sorgente intel sarà un sistema di scouting esterno (edificio/
  residente esploratore, non esiste su /game): TODO in schema+sessione.
- **T-5 — Misura dei trade-off (gate a/b preparatorio).** ✅ 2026-10-10.
  `questTradeoffSweep.test.ts` — sweep MC (800 run/cella, seed 7) su 6 party
  plausibili × 4 archetipi-strategia. Esiti: **(i)** fronte di Pareto ≥2
  (sentinelle scambiano reward per sopravvivenza, falange il contrario);
  **(ii)** varianza in-run enorme — sanguinario 99.3% reward/73% morti vs
  cauto 5.5%/42% (reward richiede inseguire+finire: «sterminio» coerente);
  **(iii)** BY MEMBER identifica chi paga: il bodyguard intercetta (Kran
  71.8% morti) e protegge la recluta (19.5%); senza scudo il debole esposto
  paga lui (64.4%). Evidenza authored: la razzia ricircola e il danno scala
  per giro — «spingi per sempre» = wipe certo (muro push-your-luck reale).
  Test con timeout espliciti; tabelle stampate → evidence log.
- **T-6 — Docs + safeguard + evidence.** ✅ 2026-10-10. Mappatura PLAN-018
  aggiornata (righe concluse marcate riusa/adatta→seam), gate con esiti,
  DECISION_LOG: ratifica Director del gate (d) — reward quasi-zero senza
  violenza totale, wound 100% e muro push-your-luck sono authored voluti.

## Gate (macro-plan S3) — ESITI 2026-10-10

- **(a) Trade-off reali: PASS** — T-5: fronte di Pareto ≥2 (sentinelle
  reward↔sopravvivenza vs falange/banda); milizia paga di più — difficoltà
  leggibile. Il BY MEMBER rende esplicito chi paga (bodyguard intercetta,
  debole esposto identificabile).
- **(b) La quest non è risolta nel Planner: PASS** — T-5: spread in-run
  reward 5.5→99.3pp / morti 42→73.4pp tra archetipi a parità di party.
- **(c) Preview↔resolver sui check certi: RIDIRETTO** — Director 2026-10-10:
  preview = forecast aggregato orientativo (T-2), niente strada vera né
  per-check. `certainChecks` (T-1) resta come seam del modello
  informazione; su goblin ogni check è evitabile (zero certi) — onestà
  strutturale confermata dalla sweep.
- **(d) Gate Director: PASS** — 2026-10-10: «La missione si chiama
  sterminio: ovviamente senza violenza totale nn la soddisfi. Si, sn tutte
  cose sensate e volute.» Reward quasi-zero senza completamento violento,
  wound 100% (pedaggio certo) e muro push-your-luck = authored voluti.

## Fuori scope

Risoluzione in-run (v3/v4 + PLAN-025 chiuso), arte (E10), audio, letalità,
conseguenze su quest non risolte (regola vigente §8 ma trigger post-S3),
generazione (PLAN-026 parallelo, confine = i contratti scenario già fissi),
modifiche al balancer, calibrazione scale S2.2 (rinviata per decisione).

## Rischi

- **Spazio verticale nel pannello** (460px budget v23 rev.2 / D-7): BY MEMBER
  + WHY + check-certi competono col rack; mitigazione = gerarchia (aggregato
  → dettaglio) decisa su mockup, non a runtime.
- **MC cost**: forecast debounced esiste (400×chunk100 ~25ms/task); WHY per-
  sorgente può richiedere sim parziali extra — budget T-2 con soglia in
  config, mai per-frame.
- **«Non risolta nel planner»** è il rischio strutturale: se la composizione
  del party determina troppo, il gate (b) rimanda a S1 — è un esito onesto
  del piano, non un fallimento del piano.

## Cold read

- **r1 (2026-10-09, groq `objective_critic` — web providers falliti per
  sessioni stale, run `.mw/runs/20261009-s3-critique-r1/`):** MAJOR REVISION,
  5 punti — tutti assorbiti come precisazioni (D-S3-1 chiarita, algoritmo
  `certainChecks` + matrice test, overflow contract + misura MC in T-2,
  determinismo già invariante esistente). Nessun redesign.

## Domande aperte (battesimo) — CHIUSE 2026-10-09 (Director «approvo»)

1. **D-S3-1 confermata** — `QuestExpeditionDetail` è il Planner; nessun
   secondo pannello.
2. **D-S3-3 `revealAtPlanning` in scope S3** — l'esploratore rivela indizi
   secondari già a planning (soglia su stat derivata, in config).
3. **Draft persistente** — il party/loadout del Planner sopravvive alla
   chiusura del pannello: draft chiavato su POI+giorno via
   `PersistenceService` (chiude il punto `unresolved` di v23 rev.2).

---

## Appendice — Mappatura PLAN-018 (T-0, FATTO 2026-10-09)

Legenda: **riusa** (invariato) · **adatta** (concetto portato, forma nuova) ·
**superato** (il nuovo modello lo sostituisce) · **manca** (da costruire in S3).

### Motore / matematica

| Componente PLAN-018 | Ruolo | Verdetto | Note |
|---|---|---|---|
| `QuestPowerEngine` | power→distribuzione→conseguenze su blueprint lineare | **superato** | il run vive su grafo `questRun.ts`; preview = `estimateForParty` MC sullo stesso engine (D-S3-2). Resta vivo solo perché alimenta superfici lab legacy — destino deciso in S4 |
| `missionPlannerMath`/`missionPlannerEngine` (DP esatta) | preview rng-free a forma chiusa | **superato** | DP esatta presuppone sequenza lineare; su grafo con scelte la stima compound è MC su ipotesi dichiarate (v24 rev.2). La proprietà «preview = distribuzione giocata» è preservata: MC campiona lo stesso ScenarioInstance del run |
| `useQuestAssignmentPreview` / `QuestAssignmentPreview.tsx` | preview live aggregata | **superato** (impl.) / **adatta** (contratto) | reattività+delta+BY MEMBER sopravvivono come requisito su `QuestExpeditionDetail`; il componente legacy è hardcoded/non skin → deprecato già in PLAN-018 |
| `resolveQuestOutcomeTier` (≥50% fasi) | regola vittoria | **superato** | v24 rev.2: reward = prova-obiettivo + leader vivo; ≥50% conta solo per il calcolo di vittoria "a consuntivo" ereditato (oggi `outcomePct` del sim) |
| `buildAstrolabeSkillsForPhase`, `applyConsumableRiskEffects`, `resolvePhaseDifficulty`, `questSkillCheckConfig` | check a fasi, rischi | **superato** | i check del nuovo engine usano LabStat derivate (`questMemberStats`) + `verdictTable`; le costanti di taratura restano fonte storica |
| `questBlueprints` (`quest_city_rats`) | contenuto quest lineare | **superato** | contenuto di riferimento storico; scenari canonici = `questScenario` config S2.1 |
| `questItemsMock`/`MOCK_QUEST_ITEMS` | consumabili | **superato** | `questStash` Zod (S2.2) |
| `questTimeScale`/`questTotalDurationMs` | durata = somma fasi | **superato** | durata viva D-K (`questSchedule`) + `estimatedDurationTicks` dell'offerta |
| `MilestoneCheckModal`, `QuestChronicleSandbox`, `missionResolver` | superfici lab risoluzione | **superato** | cronaca/teatro = `QuestRunWindow` + beat/cinema (PLAN-025) |

### Meccaniche di design

| Concetto | Verdetto | Dove vive oggi |
|---|---|---|
| Slot obbligatori/secondari | **riusa** | `poi.slots.required/optional` (questPois, S2.3) |
| Rischio per slot + aggregato | **riusa** | `sim.perMember` (wound/death per membro) + aggregati |
| `checkStatTags` (stat del check distinte dal gate) | **adatta** | `statFocus`/statTags su slot + scenario (S2.1/2.2) |
| `coverRiskDelta` (D1 cover) | **adatta** | schema su `questItems`; T-3 ha reso onesta l'eleggibilità: item con canali non cablati esclusi dal pool — wiring del delta resta aperto |
| Slot `bodyguard` | **riusa** | `role:'bodyguard'` + `goblin-slot-bodyguard`; T-5 misura il valore: intercetta e muore al posto dei membri (BY MEMBER lo mostra) |
| Consumabili pool party (D3) | **riusa** | sacca run + flag `questStash` |
| Checkpoint «continua/ritirati» prima dei check rischiosi | **adatta** | non più automatico: è un nodo decisionale authored nel grafo (es. `gob-fermati`) — la frontiera si ferma ai bivi per costruzione |
| Draft persistente del party | **riusa (T-3)** | `idleVillage.questExpeditionDraft.<poi>.<day>` via PersistenceService |
| `revealAtPlanning` (esploratore rivela indizi) | **adatta→seam esterno** | T-1 schema+engine; T-4 Director 2026-10-10: sorgente = scouting esterno futuro (non slot party) — TODO in schema/sessione |
| WHY / delta / BY MEMBER UI | **riusa (T-2)** | zona OUTCOME nel Planner: `whyBySource` per nodo, delta ±pp, per-membro |
| Preview per-check sui certi | **adatta (T-4 redirect)** | preview = forecast aggregato orientativo; `certainChecks` resta seam del modello informazione |

### Superfici

| Superficie | Verdetto | Note |
|---|---|---|
| `MissionPlannerLive` su `/primitives` | **adatta→deprecare** | resta come strumento storico fino a S4 (macro: destino lab deciso lì); non si investe più sopra |
| `questPoiKit` + pagine integrazione legacy (`useQuestPoiSession`) | **adatta** | stack vecchio ancora su pagine dev; `/game` canonico usa `useQuestExpeditionSession` — convergenza completa in S4 |
| `FloatingPanel` | **riusa** | superficie del Planner (già in uso nel detail) |
