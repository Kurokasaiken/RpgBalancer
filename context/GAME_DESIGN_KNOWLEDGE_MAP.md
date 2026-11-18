# Game Design Knowledge Map — Wanderlust: Triumph / RpgBalancer

**Status:** reference / navigation aid — non-canonical  
**Created:** 2026-11-18  
**Purpose:** permettere a Director e collaboratori di ragionare sul game design usando il contesto corretto, senza confondere visione, regole ratificate, proposte, stato del runtime e piani.

> Questo documento NON introduce, ratifica o modifica regole di gioco. Non sostituisce `CANON.md`, `.mw/desiderata.md`, `context/DECISION_LOG.md`, `RICHIESTE.md`, `QUEST_RULES.md`, `DESIGN_PILLARS.md` o gli altri documenti cui rimanda. In caso di conflitto prevale sempre la gerarchia di `CANON.md` e il protocollo `AGENTS.md`.

## 1. Come leggere il progetto senza confondere le fonti

Ogni affermazione usata in una discussione di design va trattata in una di queste categorie:

- **FACT** — verificabile nello stato del repository/runtime/test. Per lo stato del gioco consultare `CURRENT_STATE.md`; una feature progettata non è per questo implementata.
- **DECISION** — scelta approvata e registrata in una fonte con autorità: desiderata FROZEN, decision log, canon o richiesta esplicitamente ratificata.
- **PROPOSAL** — modello o idea non ratificata. Può essere criticata, confrontata e sviluppata, ma non va presentata come regola.
- **OPEN** — questione ancora da decidere o validare, tracciata in `context/OPEN.md`.
- **OBSOLETE / SUPERSEDED** — idea o regola superata da una decisione successiva. Non va riutilizzata come stato corrente.

Regole di lettura:
1. `CANON.md` decide quale fonte ha autorità su ciascun dominio.
2. `DESIGN_PILLARS.md` esprime direzione, non specifica di sistema.
3. `GAMEPLAY_DESIGN.md` descrive identità e visione del gioco; è reference, non la fonte delle regole quest correnti.
4. `QUEST_RULES.md` è la fonte canonica per le regole correnti di risoluzione delle quest.
5. `CURRENT_STATE.md` è una fotografia temporale dell'implementazione, non una decisione di design.
6. `context/DECISION_LOG.md` registra storia e motivazioni: non sostituisce lo stato corrente.
7. `RICHIESTE.md` registra richieste esplicite e lavoro attivo; per le voci antecedenti consultare gli archivi indicati in `AGENTS.md`.
8. `.mw/desiderata-digest.md` è un read-path delle desiderata FROZEN; il canonico resta `.mw/desiderata.md`.

## 2. Identità e direzione del gioco

**Identità registrata:** Village / incremental management RPG con drag & drop, elementi di RPG e un laboratorio Balancer integrato. La superficie di gioco canonica è `/game` (Game Frame Pixi); la vecchia pagina Idle Village è deprecata.

**Pillar di design da usare come lente critica:**
- **World Surface:** il mondo è una superficie da esplorare con gli occhi, non una dashboard tattica astratta.
- **Cultist Simulator:** grammatica di POI, halo, slot e verbi; il mondo comunica opportunità e stati attraverso elementi leggibili.
- **Lords of Waterdeep approfondito:** worker placement / engine building come riferimento per il loop strategico.
- **Mount & Blade / Battle Brothers:** riferimento per mappa strategica e gestione.

Questi sono riferimenti e principi di direzione, non autorizzazioni a importare automaticamente sistemi o meccaniche dai giochi citati. Per dettagli e anti-pillar: `DESIGN_PILLARS.md`.

**Visione e descrizione del gameplay:** `GAMEPLAY_DESIGN.md`, da leggere tenendo presenti le sezioni esplicitamente superseded (modello Dispatch e vecchia estetica). Non usare le descrizioni storiche come regole attuali.

## 3. Mappa dei domini di game design

### 3.1 Quest: struttura, risoluzione e qualità

- **Autorità delle regole correnti:** [`QUEST_RULES.md`](../QUEST_RULES.md).
- **Definizione qualitativa di una buona quest:** [`GOOD_QUEST_DEFINITION.md`](GOOD_QUEST_DEFINITION.md), artefatto finale PLAN-019 S1–S4.
- **Ricerca e principi di game design:** [`QUEST_GAMEPLAY_SCIENCE.md`](QUEST_GAMEPLAY_SCIENCE.md), reference di ricerca; non tutte le checklist o proposte contenute sono regole approvate.
- **Visione più ampia:** `GAMEPLAY_DESIGN.md` e `DESIGN_PILLARS.md`.

La definizione di buona quest mette in primo piano: la ricompensa deve nominare l'obiettivo; il costo va reso leggibile prima dell'esito; le conseguenze devono sia agire sia essere narrate; la quest non deve essere già risolta nel planner; il push-your-luck deve avere un limite authored; i ruoli devono produrre differenze meccaniche; l'informazione è una risorsa authored; la bisaccia è pre-commitment e non inventario; il POI ha un lifecycle authored; i seam devono essere authored e non inventare sistemi impliciti.

### 3.2 Quest: sistema di opportunità, generazione e campagna

Quest rules e quest generation non sono lo stesso problema. Le regole di risoluzione sono canoniche; l'architettura di generazione, il grafo delle opportunità e il ciclo macro di campagna hanno ancora questioni da risolvere.

Fonti da consultare:
- `context/OPEN.md`: OPEN-014 (architettura narrativa per situazioni), OPEN-015 (mancata risoluzione e conseguenze), OPEN-016 (registro mondo/memoria/macro-piano), OPEN-017/018 (approcci alternativi e preview), OPEN-019/020/021 (grafo opportunità, requisiti/preparazione, informazione/scout), OPEN-022 (ricompense e requisiti di campagna), OPEN-023/024 (investigation e tassonomia gimmick).
- `context/QUEST_OPPORTUNITY_LAYER.md`, `context/QUEST_CAMPAIGN_MACRO.md`, `context/QUEST_GIMMICK_CHANNELS_RESEARCH.md` e ingestion associate, quando pertinenti. Verificare sempre lo status riportato nell'index e in OPEN: un documento di ricerca o una proposta non equivale a ratifica.
- `.mw/desiderata-digest.md`: v24 e v27, oltre alle versioni pertinenti, per vincoli FROZEN. v27 definisce la presentazione della quest come storia a nodi che aspetta ai bivi; non cambia le regole di gameplay.

### 3.3 Bilanciamento, statistiche, competenze e rischio

- `QUEST_RULES.md` §3–§7 contiene le regole quest su skill check, rischio, bodyguard/death save, checkpoint/fuga/wipe, vittoria/reward e stat/competenze, con status espliciti e riferimenti alle OPEN.
- `context/OPEN.md` OPEN-003, OPEN-006, OPEN-007, OPEN-008 e OPEN-009 segnala le questioni di mapping stat/competenze, death save, modificatori, precisione della preview e danni durante la fuga.
- `src/docs/docs/balancer/balance_model_v1.md` è indicato nell'index come inventario matematico canonico del Balancer, con audit in corso: consultarlo quando la discussione richiede formule, distribuzioni o calibrazione numerica.
- `context/QUEST_GAMEPLAY_SCIENCE.md` offre principi e bibliografia per la progettazione, non sostituisce dati di playtest.

**Regola di metodo:** distinguere sempre tra probabilità del singolo check, probabilità compound della spedizione, preview mostrata al giocatore, risoluzione effettiva e calibrazione osservata nei playtest. Non assumere che una simulazione o una preview sia completa solo perché esiste uno strumento.

### 3.4 Villaggio, economia e scarsità

- `VILLAGE_ECONOMY.md` è esplicitamente **DRAFT**; le proposte sono tracciate in OPEN-010 e non vanno presentate come sistema ratificato.
- OPEN-012: difesa del villaggio e categorie di potere.
- OPEN-013: scarsità single-player e modello del party.
- OPEN-010/012/013 sono collegate: produzione, costo opportunità, disponibilità di persone, spedizioni e difesa devono essere valutate come un sistema, non come numeri indipendenti.
- `GAMEPLAY_DESIGN.md` conserva la visione del loop di gestione e divisione dei personaggi, ma le parti economiche non ratificate restano visione/proposta.
- Lo stato runtime in `CURRENT_STATE.md` segnala che l'economia reale del villaggio (upgrade/costruzione con detrazione risorse e persistenza) non è ancora implementata; non confondere vista villaggio, registro edifici o mock con un'economia giocabile.

### 3.5 Progressione, eroi e legacy

- `PROGRESSION.md` è **DRAFT**: non costituisce un modello completo ratificato.
- `QUEST_RULES.md` §6–§7 e `context/OPEN.md` OPEN-003 sono fonti necessarie per reward, XP, stat e competenze.
- Verificare `CURRENT_STATE.md` per distinguere sistemi presenti, placeholder e sistemi solo progettati.
- Le meccaniche di morte, memoria, eredità e conseguenze di campagna vanno lette insieme a OPEN-015/016 e alle decisioni pertinenti; non inferire una struttura definitiva dal solo fatto che esistano superfici UI per memoriale o reliquiario.

### 3.6 Narrativa, mondo e situazioni

- `NARRATIVE.md` è **DRAFT**.
- OPEN-014 governa l'architettura narrativa delle situazioni; OPEN-015 le conseguenze delle quest non risolte; OPEN-016 registro del mondo, memoria e macro-piano.
- `QUEST_RULES.md` §8 definisce le conseguenze oltre l'esito immediato; lo status segnala che le conseguenze sulle quest terminate sono implementate parzialmente, mentre la mancata risoluzione e la memoria narrativa hanno ancora lavoro aperto.
- Per le gimmick d'indagine consultare OPEN-023/024 e la ricerca/ingestion collegata. Non generalizzare una proposta di generazione narrativa a tutto il sistema senza verificarne lo status.

### 3.7 Mappa, POI, luoghi e opportunità

- La direzione spaziale canonica è **World Surface**, non la vecchia mappa Dispatch.
- OPEN-025 riguarda LocationHub / luoghi con molte opportunità.
- OPEN-026 riguarda la tassonomia quest / job / attività sulla mappa `/game`.
- PLAN-117 è il piano del layer opportunità sulla mappa: consultare lo stato effettivo in `plans/INDEX.md`, `RICHIESTE.md` e il ruling/decision log prima di descriverne ogni parte come definitiva.
- Le decisioni estetiche recenti sui POI e sull'HUD non devono essere scambiate per una ratifica delle regole economiche o del modello di opportunità sottostante.

## 4. Fotografia del progetto: cosa non va dato per completato

La fotografia di `CURRENT_STATE.md` consultata per questa mappa è aggiornata al **2026-11-15** (con R-359 del 2026-11-18 citato nel documento). Indica, tra l'altro:
- superficie canonica `/game` e World Surface;
- quest planner, quest run window e journey engine presenti in vari gradi di maturità;
- il core loop completo non è ancora assemblato;
- economia reale del villaggio non implementata (upgrade/costruzione con detrazione e persistenza);
- equipaggiamento, consumabili e skill degli eroi ancora placeholder;
- alcuni kit/integrazioni e il POI quest kit risultano parziali o draft.

Questa fotografia può essere superata da commit successivi. Prima di una discussione che dipenda dallo stato attuale, controllare `CURRENT_STATE.md`, `SESSION_HANDOFF.md`, `RICHIESTE.md`, `plans/INDEX.md` e, se serve, i test o le evidenze più recenti. La UI visibile non prova da sola che il loop sottostante sia attivo.

## 5. Questioni di design da tenere sul radar

Il registro corrente `context/OPEN.md` contiene OPEN-001…OPEN-026. Per le discussioni di gameplay, le famiglie più rilevanti sono:

| Famiglia | Questioni |
|---|---|
| Regole numeriche e rischio | OPEN-003, 006, 007, 008, 009 |
| Economia, villaggio, scarsità e difesa | OPEN-010, 012, 013 |
| Narrazione, conseguenze e memoria | OPEN-014, 015, 016 |
| Gimmick, approcci e informazione | OPEN-017, 018, 021, 023, 024 |
| Opportunità, requisiti e campagna | OPEN-019, 020, 022 |
| POI, luoghi e tassonomia sulla mappa | OPEN-025, 026 |

Non assumere che tutte siano ancora aperte allo stesso modo: leggere il corpo della singola OPEN prima di discutere. Alcune contengono risoluzioni parziali, dipendenze o decisioni successive.

## 6. Protocollo operativo per le prossime discussioni con il Director

Prima di rispondere a una domanda di game design:

1. Identificare i domini toccati e consultare questa mappa come router.
2. Leggere le fonti autoritative di quei domini, non l'intero repository indiscriminatamente.
3. Recuperare le desiderata FROZEN e le decisioni pertinenti; controllare eventuali emendamenti successivi.
4. Leggere le OPEN collegate e distinguere ciò che è risolto, parziale o ancora da decidere.
5. Controllare `CURRENT_STATE.md` quando la proposta dipende da ciò che il giocatore può già fare.
6. Formulare l'analisi separando: **stato accertato**, **vincoli**, **problema di design**, **ipotesi/proposte**, **trade-off**, **decisione richiesta al Director**.
7. Non trasformare una proposta in decisione, non riscrivere il canon e non colmare silenziosamente i vuoti.
8. Quando emerge una decisione del Director, seguire il workflow Mind Weaver previsto da `AGENTS.md` e registrarla nella sede corretta; non aggiornare questa mappa per ogni singola decisione.

### Template di analisi di un sistema

Per ogni sistema discusso, rispondere a queste domande:
- **Scopo nel gioco:** quale esperienza o problema del giocatore serve?
- **Loop:** input → scelta → costo/rischio → esito → conseguenza → nuova opportunità.
- **Regole ratificate:** quali sono, con fonte e stato?
- **Dipendenze:** quali altri sistemi lo alimentano o ne subiscono gli effetti?
- **Economia e bilanciamento:** quali risorse, tempi, probabilità e opportunità consuma o genera?
- **Informazione e agency:** cosa sa il giocatore prima di impegnarsi e cosa può ancora controllare?
- **Failure states:** cosa succede in caso di errore, rinuncia, scadenza o perdita?
- **Stato reale:** implementato, parziale, mock, progettato o assente?
- **OPEN e prove mancanti:** cosa impedisce una decisione solida?
- **Proposta:** opzioni, conseguenze sistemiche, raccomandazione e cosa deve approvare il Director.

## 7. Limiti e manutenzione

- Questa mappa è un ausilio alla navigazione, non una nuova fonte di verità.
- È stata costruita consultando `main` il 2026-11-18; le fonti possono cambiare.
- Aggiornarla solo quando cambia in modo sostanziale la struttura della knowledge base o la mappa delle autorità. Non duplicare qui i dettagli delle regole.
- Ogni sessione futura deve comunque verificare le fonti aggiornate: il documento non è un indice automaticamente sincronizzato e non garantisce monitoraggio in background.

## 8. Fonti principali

- [CANON.md](../CANON.md) — autorità per dominio.
- [AGENTS.md](../AGENTS.md) — protocollo Mind Weaver per gli agenti.
- [DESIGN_PILLARS.md](../DESIGN_PILLARS.md) — direzione e anti-pillar.
- [GAMEPLAY_DESIGN.md](../GAMEPLAY_DESIGN.md) — visione del gameplay.
- [QUEST_RULES.md](../QUEST_RULES.md) — regole quest vigenti.
- [CURRENT_STATE.md](../CURRENT_STATE.md) — stato del runtime.
- [context/INDEX.md](INDEX.md) — router L0–L4 e catalogo knowledge.
- [context/OPEN.md](OPEN.md) — questioni irrisolte.
- [context/DECISION_LOG.md](DECISION_LOG.md) — decisioni e razionali attivi.
- [RICHIESTE.md](../RICHIESTE.md) — richieste attive.
- [plans/INDEX.md](../plans/INDEX.md) — stato dei piani.
- [GOOD_QUEST_DEFINITION.md](GOOD_QUEST_DEFINITION.md) — definizione qualitativa di una buona quest.
- [QUEST_GAMEPLAY_SCIENCE.md](QUEST_GAMEPLAY_SCIENCE.md) — ricerca sul game design delle quest.
- [VILLAGE_ECONOMY.md](../VILLAGE_ECONOMY.md), [PROGRESSION.md](../PROGRESSION.md), [NARRATIVE.md](../NARRATIVE.md) — draft dei rispettivi domini.
