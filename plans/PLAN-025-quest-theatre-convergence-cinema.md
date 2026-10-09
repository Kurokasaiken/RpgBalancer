---
title: 'PLAN-025 — Un solo componente per la quest in corso su /game: frontiera v27, convergenza QuestRunWindow → QuestTheatre, pacing a beat e juice'
status: active
created: 2026-10-08
revised: 2026-10-08 (v4 — cold read multi-AI web ×3, chatgpt + claude. r1: MAJOR/MAJOR → v2; r2: MAJOR/MAJOR → v3; r3: chatgpt MAJOR (punti di specifica) / claude MINOR → v4. Run `.mw/runs/20261008-plan-025-theatre-convergence/`. Disaccordi residui registrati in fondo.)
desiderata: v27 (FROZEN — QuestTheatre, "storia a nodi che aspetta ai bivi")
request: R-106 (iterazione 3 — Director: «Un solo componente»), R-103 (contenuto), R-105 (fuori scope)
parent: PLAN-021 (QuestTheatre, Phase 1 parziale)
related: PLAN-022, PLAN-023/024, hud_component_guide.md, quest_ui_component_guide.md, quest_theatre_spec.md
---

# PLAN-025 — Frontiera v27 + teatro unico + beat + juice (v4 draft)

## Perimetro

Oggi su `/game` ci sono due componenti per lo stesso ruolo: `QuestTheatre`
(PLAN-021) e `QuestRunWindow` (R-106). Decisione del Director: **un solo
componente**. Su `/game` quel componente deve rispettare la **v27 FROZEN**:
solo il tempo scorre; la quest si ferma alla prima fase che richiede il
giocatore; chi apre in ritardo gioca le fasi pendenti senza attese.

Oggi `applyChoice()` risolve, in un click, un check **e tutta la catena
automatica** che lo segue: nessun pacing visivo rende conforme questo modello.
L'ordine del piano è quindi:

1. frontiera vera nel dominio;
2. convergenza del teatro;
3. beat di presentazione;
4. juice minimo.

Ogni passo è misurato con un harness.

**Cambia il motore** (`questRun.ts`): l'avanzamento automatico viene separato
in due operazioni di dominio (vedi T-003), a regole, numeri e contenuto
invariati. La pagina lab continua a usare il modo attuale, marcato legacy (la
v27 non si applica alla pagina lab).

## Evidenze di partenza (playtest 2026-10-08)

Run reale su `/game` con Playwright, giocatore avido; screenshot in
`test-results/quest-window-play*/`.

| # | Osservato | Stato |
|---|---|---|
| E1 | 3 morti in un click di F6 → un paragrafo, 0 s di pausa, stessa immagine | → T-008/T-009 |
| E2–E5 | Consumabile speso senza chiedere; flavor del verdetto assente; «nessuna conseguenza» sopra danni reali; testo doppio | **corretti (T-000)** |
| E6 | `transit` mai mostrato; il sollievo di F7 sovrascritto dall'agguato nello stesso click | → T-004 + T-008 |
| E7 | Combattimento: chi viene colpito non si vede | → T-010 |
| E8 | Run persa al reload | → T-005 |
| E9 | Barra del tempo decorativa | → T-004 |
| E10 / E11 | Arte incoerente / roster ≠ party | fuori scope |
| E12 | **Crash di `/game`** (pedaggio d'esito che uccideva l'ultimo membro senza `wipe`) | **corretto (T-000)** |

## Decisioni del Director (T-001 — CHIUSE 2026-10-08)

Il Director ha risposto «procedi» ai default conformi; D-8 era già decisa
esplicitamente. Le scelte registrate:

- **D-1 — Integration Gate di PLAN-021:** anticipato per la sola quest goblin
  S1. La frontiera di T-004 è un contratto provvisorio con scadenza
  (sostituito in S2, tracciato in kanban).
- **D-2:** la v27 «nessuna applicazione al lab S1» vieta di sostituire la
  *pagina* lab, non di leggere il motore S1 tramite adapter.
- **D-3 — Futuro visibile:** regola conforme v27 — solo i nodi risolti e
  quello corrente, senza conteggi che rivelino la topologia. **La tile
  «prossima fase» di R-106 è ritirata**; se il Director la rivuole è una
  deroga da dichiarare.
- **D-4 — Consumabili:** il teatro su `/game` parte sempre disarmato; armare
  (= premere l'icona dell'oggetto) è un'intenzione esplicita — l'oggetto si
  spende solo quando il check si risolve. Il lab resta armato.
- **D-5 — Sequenza:** frontiera prima, juice dopo (T-009, non quick-win).
- **D-6 — Segnale a teatro ridotto:** pillola che pulsa per il **bivio in
  attesa** (urgente), punto statico per **novità da presentare** (passivo).
- **D-7 — Expanded:** nessun expanded; T-002 misura cosa entra in 460 px e
  fissa il comportamento deterministico in overflow.
- **D-8 — Peso della morte** (deciso per iscritto): tono spento/scuro su
  scena e ritratto, riga della morte leggibile, **clic ovunque per
  continuare**. Niente hold obbligato. La soglia anti doppio-click resta
  solo come protezione da input accidentale.

## Invarianti (verificabili)

- **I-1 — Ownership.** Il teatro non muta il run e non calcola esiti.
- **I-2 — Un'unica fonte di verità.** La **frontiera committed** è l'unica
  verità di gameplay. La coda di presentazione è una *proiezione*: contiene
  beat con id stabile, legati a `frontierVersion` + `engineSchemaVersion`. Se
  al reload non corrispondono, la coda si scarta e si mostra un riepilogo della
  frontiera.
- **I-3 — Frontiera v27.** Nessuna scelta, check o checkpoint viene
  auto-risolto. Un comando del giocatore risolve solo il nodo corrente.
  L'avanzamento automatico matura solo i nodi senza decisione, solo col clock
  di gioco, e si ferma al primo `waitingForPlayer`. Il tempo offline non
  risolve mai un bivio.
- **I-4 — Lock locale.** Nessun beat blocca `/game`; il teatro ignora l'input
  solo per la soglia anti doppio-click (D-8).
- **I-5 — Reduced motion.** Spegne il movimento; il contenuto resta identico.

## Architettura

```
questRun (regole invariate)
   ├─ submitCommand(run, cmd)   risolve SOLO il nodo corrente → frontiera      ← T-004
   ├─ matureReady(run, tick)    consuma i nodi senza decisione maturati, stop al primo bivio
   └─ applyChoice (legacy)      = submitCommand + matureReady(∞): usato dal lab e dal Monte Carlo
useQuestRun (owner unico): frontiera committed + clock + catch-up + persistenza
questRunTheatreAdapter (pure) → TheatreRunView v2 (+ coda proiettata)
QuestTheatre (pelle di QuestRunWindow)
   ├─ BeatSequencer (Context): consuma la proiezione, skip policy, I-4
   └─ CinemaFx: letterbox, flash del ritratto, typewriter
```

### Frontiera temporale (spec in T-004)

- **Durate senza numeri nuovi:** la durata di ogni nodo senza decisione si
  ricava dai **giorni già autorati** della quest, ripartiti sulle fasi (regola
  di ripartizione in spec, configurabile). Totale identico a oggi: «il gameplay
  è identico» (v27 punto 3).
- Stato del nodo: `pending | ready | waitingForPlayer | resolved`;
  `startedAt` e `readyAt` sul tick di gioco; in pausa non matura nulla.
- **Reopen:** il catch-up di gameplay è **istantaneo** fino al primo
  `waitingForPlayer`. Ciò che è maturato a teatro chiuso si presenta in **modo
  compatto** (righe di cronaca + un beat riassuntivo per morte), skippabile in
  blocco con «vai al bivio». La riproduzione piena vale solo per ciò che
  matura a teatro visibile. Il tempo reale non viene mai ricreato come attesa.
- **Tetto della coda:** oltre N beat pendenti (config), i più vecchi si
  compattano in cronaca.

### Contratto read-model v2 (non normativo, delta su v1)

party (`hp`, `maxHp`, `wounded`, `exposurePct?`) · `resolved[]` dell'ultimo
comando (`verdict`, `title`, `flavor?`, `harmLines[]`, `authoredText?`,
`harms[]`) · `transit?`, `sceneArt?`, `caption?` · stato dei nodi + `readyAt?`
· `bag[]` + `armed` + intent `toggleArm`/`useItem` · `frontierVersion`,
`engineSchemaVersion` · avanzamento secondo D-3. Il contratto canonico **non**
ha la modalità istantanea.

### Riuso (nessun duplicato)

`WanderlustRosterCard`/`DamageChannel` (party, entro il budget di T-002) ·
badge + flavor di `VerdictCard` (niente astrolabio nel teatro) · `TransitView`
· `usePresentationTimeline` + `questLabPacing` · `ConsumableBelt` (già
montata) · `ChronicleDrawer`/`QuestChronicle` · `QuestRewardPanel`.

## Skip policy e budget

- Tutti i beat sono skippabili (click o Spazio) dopo la soglia anti
  doppio-click; «vai al bivio» è sempre disponibile.
- Morti multiple: in sequenza accelerata, peso secondo D-8.
- **Budget:** prima si misura la baseline (T-003). Poi si fissano, come
  percentuale di quella baseline, l'overhead senza skip e la mediana con la
  skip policy del bot dichiarata (skip al primo frame utile dopo la soglia).

## Mappa beat → juice

Ridotta ancora dopo r3.

| Beat | Teatro | Juice | Durata |
|---|---|---|---|
| Transit (maturato live) | `TransitView` sull'arte di destinazione | testo in dissolvenza, Ken Burns | ∝ parole (2–7 s) |
| Bivio | scelte + chip rischio | nessuno | attende |
| Verdetto | badge + flavor | **typewriter** nel colore del verdetto | 1,2–1,8 s |
| Colpo | strip + orda | **flash del ritratto colpito** + floater −HP | 0,6 s |
| Morte | riga della morte + scena/ritratto in tono spento (D-8: colore, non blocco) | **letterbox che si chiude**; clic ovunque continua | fino al clic |
| Agguato | arte che si stringe | **letterbox che si chiude** 400 ms | immediato |
| Sollievo F7 | body leggibile (la frontiera non lo sovrascrive più) | nessuno | ∝ parole |

Il letterbox si usa solo per segnalare un **cambio di tono** (morte,
agguato). Tagliati: letterbox in partenza e in fine, scossa, warm grade,
pulsazione, desaturazione animata, astrolabio compatto. Audio → fuori scope
(piano successivo).

## Task

Ogni task richiede lo stato garantito dal precedente.

- **T-000 — Fix bloccanti (FATTO, 2026-10-08).** E2–E5, E12. Test
  `tests/unit/idleVillage/questRunWindow.test.tsx` (7); Monte Carlo invariato;
  evidence `test-results/r106-quest-window-fixes-2026-10-08.log`.
- **T-001 — Gate D-1…D-8** (default conformi se non decisi). Nessun codice.
- **T-002 — Spike del layout a 460 px (FATTO 2026-10-08).** Baseline misurata
  dall'harness (seed 1–7 greedy, seed 1 cautious, `?seed=` su
  `/quest-window-lab`): la finestra è **754–820 px di altezza** a 460 px di
  larghezza — già ~85–90% di un viewport da 900 px, con `overflow: 0` (niente
  scroll interno oggi: tutto si impila). 17–20 passi greedy, 12 cauti.
  Conseguenza: il blocco combat di T-010 **non entra gratis** — serve una
  regione narrativa con scroll interno oppure la strip party va nel budget
  header. Comportamento deterministico in overflow: la zona testo+verdetto
  scorre, header/teatro/scelte restano ancorati.
- **T-003 — Harness + baseline (FATTO 2026-10-08).**
  `scripts/quest-theatre-playtest.ts`: seed iniettato via `?seed=`,
  policy greedy|cautious|first, `--video`, metriche DOM per step
  (`winH/overflow/choicesH` + altezze sezioni), `metrics.json` + transcript.
  Baseline: presentazione istantanea (0 ms overhead), 12.7 s wall mediana
  greedy a 450 ms/passo. **Budget di presentazione:** overhead senza skip
  ≤ +50% della mediana baseline per passo (≈ +225 ms medi, assegnati ai beat
  sotto) e mediana con skip ≤ +10%; morte fino al primo clic libero.
- **T-004 — Frontiera v27 nel dominio (FATTO 2026-10-08).**
  `submitCommand`/`matureReady`/`arriveNode`/`matureNode` in `questRun.ts`;
  `applyChoice` = submit + catch-up istantaneo (lab/MC invariati);
  `frontier{status,startedAt,readyAt}` + `frontierVersion` +
  `engineSchemaVersion` + `nodeTicks` (0 = istantaneo); durate =
  `nodeDurationTicks(questId, totalTicks)` dai tick autoriali; effetti harm
  alla maturazione, scena all'arrivo. Spec: `quest_theatre_spec.md` §
  «Frontiera temporale». Test: `questFrontier.test.ts` (9 — catena
  info→harm→choice, rifiuto comandi su pending, catch-up deterministico,
  parità legacy stesso seed). 115/115 verdi.
- **T-005 — Persistenza (FATTO 2026-10-08, parziale).** `useQuestRun` ora usa
  `submitCommand` + `syncClock(tick)` (frontiera viva su `/game` via
  `currentTick` di sessione — gioco in pausa = quest in pausa; sul lab-window
  un tick driver locale da 1 s, `LAB_NODE_TICKS=3`). Persistenza via
  `PersistenceService` (`idleVillage.questRun.<questId>`, busta
  schema-stamped `ENGINE_SCHEMA_VERSION`: run + phase record; mismatch →
  scartato). Ripresa al reload = frontiera committata; il primo `syncClock`
  fa il catch-up deterministico. `QuestRunWindow` mostra `node.transit` in
  corsivo mentre la frontiera è pending (E6). **Resta per T-006:** la
  proiezione della coda con id stabili (oggi si persiste lo stato dominio,
  non la presentazione) e i test di serializzazione espliciti (RNG incluso,
  reload a metà morte multipla).
- **T-006 — Contratto v2 + adapter (FATTO 2026-10-08).** `theatreContract.ts`
  v2: `runState+'survived'`, `node.pending{startedAt,readyAt}`, `party hp/maxHp`,
  `run.tick/bag/combat`, intent `useItem` + `submitDecision.useConsumable`,
  reject `duplicate`. `questRun.ts`: `visitedNodes` append-only (i nodi
  risolti dello snapshot vengono dalla storia, mai dal grafo),
  `ENGINE_SCHEMA_VERSION=2` (save vecchi scartati). `questRunAdapter.ts`:
  `snapshotQuestRun` puro + `createQuestRunAdapter(getRun,{getTick,onMutate})`
  con guard stale/nodeId/pending + dedupe commandId; retreat/collectReward
  rifiutati onestamente (motore senza flussi generici). Fixture = stati reali
  via `createRun`+`submitCommand` (seed fissi): scelta con preview, pending
  gob-ritorno, combat live, multi-morte all'agguato, sacca, esiti terminali.
  Test `questRunAdapter.test.ts` 13: stesso stato → stesso snapshot, stale/
  duplicate rifiutati, pending rifiuta decisioni, useItem, armed-consumable
  end-to-end. 102/102 verdi nello scope quest.
- **T-007 — Convergenza UI (FATTO 2026-10-08/09, direzione invertita da D-F).**
  D-F (Director 2026-10-09): **`QuestRunWindow` è il componente battezzato** —
  il teatro converge *dentro* la finestra, non il contrario. Fatto: `useQuestRun`
  espone `adapter` (istanza stabile, dedupe commandId sopravvive ai re-render,
  mutazioni via `act` → fasi + persistenza oneste); `/game-frame-theatre`
  monta `QuestTheatre` **sull'adapter reale** in parallelo (fixture fake
  rimossi dalla rotta dev; tick driver locale 1s, `THEATRE_NODE_TICKS=3`,
  toggle orologio in Regia); `QuestTheatre` impara `combat` (decisione +
  telemetria turno/nemici) e `pending` (barra di maturazione, nessun input);
  `runState.survived` + i18n en/it/pseudo. `QuestTheatre` resta montabile in
  parallelo fino a T-012; la finestra canonica resta engine-native (più ricca:
  verdict flavor, delta armato, tile fasi) — il contratto serve le superfici
  parallele e la futura presentazione.
  **Porting candidati da `QuestChronicle` (audit 2026-10-09):** (a) **lore
  drop sbloccato a completamento** (`useQuestLoreDrop`) — payoff narrativo
  vero, allineato al pillar delle conseguenze → T-008 o task dedicato;
  (b) **corda/scadenza quest** — la rope di Chronicle rende il tempo che
  *manca* (invasione goblin tra 5 giorni, R-092 «non risolta» ha un gancio
  visivo) → T-008; (c) **tinte per tipo di fase** sulle tile (ember/jade/
  amethyst) → T-008; (d) splash d'esito + collect gate — già coperto dal
  rapporto di fine run, non portare il peso.
- **T-008 — BeatSequencer (FATTO 2026-10-09).** `questS1Lab/beatSequencer.ts`:
  `projectBeats(mark, after, {maxBeats})` cammina il diff del log committato
  (NODE→scene, CHECK→check, WOUND/DEATH/HARM→un beat per harm, QUEST_END→end)
  con id stabili (`scene-N`, `chk-N`, `harm-seq`, `end`, `recap`); oltre il
  tetto la testa saltata compatta in un beat `recap` («vai al bivio»).
  `useBeatCursor` riproduce con timing da `gameFrameConfig.questWindow.beats`,
  click/Enter/Spazio = skip, `flush` = drain, reduced-motion = drain istantaneo.
  `useQuestRun` espone `beats` (append-only per commit; reload → coda vuota, il
  mark parte dalla frontiera ripristinata). `QuestRunWindow` mostra `BeatStage`
  al posto di scelte/sacca mentre i beat sono in scena; i beat scena tagliano
  anche l'immagine del teatro. E1 (multi-morte) ora scorre membro per membro.
  Test: `beatSequencer.test.ts` (11: ordine, id, tetto, fake timer, reduced
  motion). Fix collaterale: attesa dell'harness riscritta Node-side — la probe
  in-page compilata da tsx lanciava `__name is not defined` e sviava come
  timeout.
- **T-009 — CinemaFx (FATTO 2026-10-09).** `skins/primitives/cinemaFx.tsx`:
  `Letterbox` (bande CSS-transition sul layer teatro, colore dal token
  `--skin-hud-lacquer-deep`), `EdgeFlash` (Web Animations, keyato per beat),
  `TypewriterText` (rivelazione per carattere); `fxForBeat` mappa il beat agli
  effetti: letterbox solo su cambi di tono (scene harm/combat, turno di
  combattimento = check con kills, morte, fine), flash sul verdetto del check,
  typewriter sul body delle scene. Config Zod `quests/questTheatreFx.ts`
  (durate, heightPct, charsPerSecond, toggle per canale e per trigger) — ogni
  canale può essere silenziato da config. I-5: `detectCapabilities().
  prefersReducedMotion` → nessuna primitiva renderizza nulla. I beat portano
  `nodeKind` e `check.kills` dal sequencer. Test: `cinemaFx.test.tsx` (10:
  mappa beat→fx, override config, reduced-motion, fake timer).
- **T-010 — Combattimento leggibile (FATTO 2026-10-10).** `CombatStrip` in
  `QuestRunWindow` sotto il teatro (solo nodi `combat`, un blocco compatto —
  nessun expanded, D-7): orda in piedi come pips (`goblinLeft`/`enemies`) +
  `nextCombatHits` («N colpi in arrivo»), e per ogni membro vivo la cella
  `nome + micro-barra HP + esposizione%` da `currentExposure` (il più esposto
  in tono danger). Mentre un harm beat è in scena, la cella del colpito si
  marca (danger/death) e `DamageFloater` (nuova primitiva cinemaFx, WAAPI,
  canale `damageFloater` in `questTheatreFx`) fa salire il `-N` — chi paga è
  visibile, E7 chiuso. i18n `questWindow.combat.*`. **Fix collaterale i18n**:
  il progetto usa i18next-icu — i suffissi `_one/_other` non risolvono;
  convertiti in plurale ICU `loot`, `moreLines`, `beats.more` (latenti da
  T-008, mostravano la chiave grezza) + le nuove chiavi combat. Test:
  `combatStrip.test.tsx` (4: pips orda, esposizione ~100%, assenza fuori
  combat, floater sul membro giusto).
- **T-011 — Safeguard + acceptance + evidence (FATTO 2026-10-10).**
  Safeguard: scope quest 142/142, `build:check`, `kanban:lint`, lint 0 errori.
  Smoke Playwright (console+pageerror): `/game`, `/game-frame-theatre`,
  `/quest-window-lab` — tutte 200, zero errori, zero error boundary. Harness
  seed-42-greedy esteso con `waitMs`/`beatMs`/`pendingMs` + flag `--skip-beats`:
  no-skip 74.4 s wall (beat 62.5 s su 16 attese, pending frontiera 4 s),
  skip 24.5 s; 0 righe/opzioni duplicate, overflow 0. **Divergenza registrata —
  Acceptance 4 parziale:** overhead no-skip ≈ 1750 ms/comando, sopra il budget
  T-003 (+50% ≈ 675 ms); con skip ≈ 191 ms/comando, dentro (+10% ≈ 495 ms).
  Il budget era calibrato pre-frontiera su beat-paragrafo: il cinema authored
  non ci rientra — rinegoziare il budget o stringere `questWindow.beats` è
  decisione del Director. Gate umano A (morte su seed E1) ancora aperto.
  Evidence: `test-results/t011-quest-theatre-acceptance-2026-10-10.log` +
  `test-results/t011/`.
- **T-012 — Rimozione del montaggio parallelo** (dopo l'acceptance 1–5,
  reversibile fino a qui). Direzione D-F: `QuestRunWindow` **resta** il
  componente canonico — si rimuove la superficie dev `QuestTheatre` su
  `/game-frame-theatre` (o si retrocede a puro strumento Regia senza run
  proprio), non la finestra.

## Fuori scope

Assegnazione dal POI, fascia di pericolosità, stash (R-105) · multi-quest ·
segnalino animato sulla mappa · arte (E10) · letalità (R-105) · audio.

## Acceptance

1. Un solo componente monta la quest in corso su `/game`: `QuestRunWindow` (battezzato, D-F). Dopo T-012 non esiste più la superficie parallela `QuestTheatre`/`/game-frame-theatre`.
2. I-1…I-5 coperti da test, **incluso lo scenario A→B→CHOICE→C→CHECK→D**.
3. **Seed E1:** 3 morti presentate in sequenza, ciascuna leggibile secondo D-8, nessun input ignorato oltre la soglia anti doppio-click.
4. **Budget:** overhead e mediana entro le percentuali fissate in T-003; 0 righe duplicate; reopen dopo N fasi maturate → bivio raggiunto senza attese.
5. **Persistenza:** reload a metà beat o al bivio → stessa frontiera; mismatch di versione gestito.
6. **Gate umano A (Director):** leggibilità della morte sul seed E1 (il punto che il playtest del 2026-10-08 ha mostrato fallito). Il resto della checklist (irritazione, combattimento, tono, sacca) è un rituale di review, non un gate.
7. Safeguard verdi + evidence log.

## Disaccordi residui (cold read r3)

- **chatgpt (MAJOR):** chiedeva che la coda di presentazione **non** fosse
  persistita finché non è dimostrata necessaria. v4: è persistita solo come
  proiezione con id stabili e viene scartata al mismatch (I-2). Il
  disaccordo resta sul *se* persisterla.
- **chatgpt:** D-3 e D-4 andrebbero chiusi nel piano, non lasciati al
  Director. v4: hanno un default conforme e restano decisioni del Director,
  perché R-106 e D1 sono richieste sue.
- **claude (MINOR):** nessun punto aperto oltre a quelli assorbiti.
