---
title: 'PLAN-025 — Un solo componente per la quest in corso su /game: frontiera v27, convergenza QuestRunWindow → QuestTheatre, pacing a beat e juice'
status: draft
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

## Decisioni del Director (T-001)

La v27 non è in discussione: questi punti sono decisioni di sequenza, forma o
UX che la v27 lascia aperte, oppure deroghe che si possono chiedere solo in
modo esplicito. **Ogni voce ha un default conforme**, usato se il Director non
decide diversamente.

- **D-1 — Integration Gate di PLAN-021.** Proposta: «un solo componente»
  anticipa il gate per la sola quest goblin S1; la frontiera di T-004 è un
  contratto provvisorio con scadenza (sostituito in S2, tracciato in kanban).
  **T-007 (convergenza) e T-012 (rimozione di `QuestRunWindow`) non partono
  senza D-1 approvato per iscritto.**
- **D-2 — v27 «nessuna applicazione al lab S1».** Proposta: vieta di
  sostituire la *pagina* lab, non di leggere il motore S1 tramite adapter.
- **D-3 — Futuro visibile.** *Default conforme alla regola candidata v27:*
  solo i nodi risolti e quello corrente, senza conteggi che rivelino la
  topologia. R-106 chiedeva «la successiva»: tenerla (tile anonima della fase,
  o «fase N di 8») è una deroga esplicita del Director.
- **D-4 — Consumabili.** *Default:* il teatro su `/game` parte sempre
  disarmato; armare è un'intenzione esplicita. Il lab resta armato (D1,
  pagina sperimentale).
- **D-5 — Sequenza.** *Default:* frontiera prima, juice dopo. Alternativa:
  quick win delle sole bande cinema sulla finestra attuale, dichiarato non
  conforme e da rifare in T-009.
- **D-6 — Segnale a teatro ridotto.** Due segnali distinti: **bivio in
  attesa** (urgente) e **novità da presentare** (passivo). Forma: pillola /
  alone sul POI / tick sul day-clock. *Default:* pillola che pulsa per il
  bivio, punto statico per le novità.
- **D-7 — Expanded.** *Default:* nessun expanded. T-002 misura cosa entra in
  460 px; se non entra, si sceglie qui tra docked e floating massimizzato, non
  dentro T-010.
- **D-8 — Peso della morte.** (a) Beat non bloccante: il ritratto resta in
  grigio nella strip e la riga resta fissa in cima al teatro finché il
  giocatore non conferma; (b) come (a) più un hold breve skippabile.
  *Default (a).* I 400 ms di input ignorato servono solo come anti
  doppio-click, mai come enfasi.

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
| Morte | ritratto **in grigio come stato** (non fx), riga fissa fino a conferma (D-8) | **letterbox che si chiude** | — |
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
- **T-002 — Spike del layout a 460 px.** Altezze in pixel per bivio,
  combattimento, morte multipla e verdetto; limite misurabile del contenuto
  obbligatorio; comportamento deterministico quando lo supera (input per
  D-7). Doc + screenshot.
- **T-003 — Harness + baseline.** Promuove `scripts/_tmp-play-quest-window.ts`
  a `scripts/quest-theatre-playtest.ts` (seed iniettato, policy, video, beat
  e overhead → JSON); misura la baseline su seed E1 + 3 seed greedy e cauti;
  fissa i budget di presentazione.
- **T-004 — Frontiera v27 nel dominio.** `submitCommand` + `matureReady` +
  `applyChoice` legacy; durate dai giorni autorati; clock, catch-up,
  `frontierVersion`, `engineSchemaVersion`; spec in `quest_theatre_spec.md`.
  **Test di riferimento:** scenario A→B→CHOICE→C→CHECK→D, in cui il clock
  matura A e B ma mai CHOICE né CHECK; `submitDecision` risolve solo CHOICE e
  si ferma al primo nodo successivo che richiede input; il catch-up offline dà
  lo stesso snapshot senza risolvere CHOICE né CHECK; in pausa non matura
  nulla. Regressione: questGoblin, questRun, repro, questSimulation e Monte
  Carlo invariati sul percorso legacy.
- **T-005 — Persistenza.** Si salva **dopo il commit e prima del primo beat**:
  frontiera + seed + versioni, più la proiezione della coda (id stabili). Test:
  serializzabilità (RNG incluso); reload a metà di una morte multipla → stessa
  frontiera e stessa coda residua; mismatch di versione → coda scartata e
  riepilogo; reload al bivio → stesso bivio.
- **T-006 — Contratto v2 + adapter.** Delta su `theatreContract.ts`, fixture
  (morte multipla, combattimento, sacca, nodi pending/ready), adapter puro +
  intent. Test: stesso stato → stesso snapshot; nessun comando duplicato;
  `stale` rifiutato.
- **T-007 — Convergenza UI** (gate D-1). `QuestTheatre` con la vista di
  `QuestRunWindow`, che resta montabile in parallelo fino a T-012; `/game` con
  l'adapter reale; segnali D-6. RTL: rendering identico live/reopen; chiudi ≠
  ritirati.
- **T-008 — BeatSequencer.** Consuma la proiezione; skip policy; reopen
  compatto + «vai al bivio»; tetto della coda; I-2 e I-4. Test con fake timer.
- **T-009 — CinemaFx.** Primitiva in `skins/primitives/` (letterbox, flash del
  ritratto, typewriter), config Zod `questTheatreFx`, I-5. Test: reduced
  motion; mappa beat→fx.
- **T-010 — Combattimento leggibile.** Strip + orda entro il limite di T-002
  (o la forma decisa in D-7); esposizione visibile; flash e floater sul
  colpito.
- **T-011 — Safeguard + acceptance + evidence.** `lint`, `test -- <scope>`,
  `build:check`, `kanban:lint`, smoke `/game` e `/game-frame-theatre`;
  harness contro i budget di T-003; docs (`quest_theatre_spec.md`,
  `COMPONENT_MASTER_INDEX`, `quest_ui_component_guide.md`, PLAN-021).
- **T-012 — Rimozione di `QuestRunWindow`** (dopo l'acceptance 1–5,
  reversibile fino a qui).

## Fuori scope

Assegnazione dal POI, fascia di pericolosità, stash (R-105) · multi-quest ·
segnalino animato sulla mappa · arte (E10) · letalità (R-105) · audio.

## Acceptance

1. Un solo componente monta la quest in corso su `/game` (dopo T-012, `QuestRunWindow` non esiste più).
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
