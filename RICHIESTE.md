---
title: Richieste esplicite
type: intent-ledger
updated: 2026-08-07
---

# Richieste esplicite

Questo file è la bussola operativa. Contiene ciò che Fausto ha chiesto, con le sue parole.

## Stati

`da chiarire` · `aperta` · `in corso` · `fatta` · `ridotta` · `rinviata` · `ritirata`

`ridotta`, `rinviata` e `ritirata` solo con approvazione esplicita.

---

## R-001 — Sfruttare Mind Weaver per produrre autonomamente un gioco riusando RPG

**Richiesta:** *"Voglio vedere cosa Mind Weaver riesce a fare autonomamente, più che stime di guadagno massimizzate. Se il risultato finale è interessante provo a pubblicarlo. Voglio che tu prenda il più possibile dal progetto RPG."*
**Data:** 2026-08-10
**Stato:** `da chiarire`
**Desiderata FROZEN:** nessuna corrispondente; `.mw/desiderata.md` v1 riguarda l'adozione del protocollo Mind Weaver in RPG. Questa richiesta richiede una nuova desiderata.
**Cosa manca:** genere/tema del gioco e stack tecnologico specifici; la base è chiara.
**Chiarimento del Director (2026-08-10):** il progetto è nuovo (nuovo nome, nuovo brand, nuovo tutto). Da RPG si possono prendere solo riferimenti utili (estetica/Style Lab, filosofia config-first, metodo componenti, ecc.), non asset o brand. Se interessante, può essere pubblicato.

---

## R-002 — Rendere le skill Mind Weaver di RPG cross-IDE

**Richiesta:** *"procedi"* (risposta alla proposta di creare i symlink per rendere le skill di RPG visibili a tutti gli IDE).
**Data:** 2026-08-10
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** creati symlink `.claude/skills`, `.devin/skills` e `.agents/skills` in RPG che puntano a `coordinator/skills`. `.windsurf/skills` era già un symlink allo stesso target. `find -L` conferma che tutte e quattro le directory vedono gli stessi 9 `SKILL.md`. Le skill di RPG sono già caricate nella sessione corrente (viste in `available_skills`).

---

## R-003 — Critica spietata e proposta per il piano "mappa viva" di World Surface

**Richiesta:** *"Ho raccolto diverse opinioni e plan per migliorare la mia mappa cn effetti, ecc. [...] Sei un lead senior system designer di una softwarehouse AAA, fa una ricerca online, poi prendi questo implementation plan proposto e fanne una critica spietata e costruttiva alla luce di tutte le informazioni che abbiamo, poi proponine uno a tua volta. Usa la modalità explorer multi ai con ChatGPT Web e Claude Web e Gemini Web."* Il Director ha incollato 4 risposte già raccolte esternamente (ChatGPT, Claude, Gemini, Grok) su come rendere viva/reattiva la mappa `/world-surface`.
**Data:** 2026-08-11
**Stato:** `in corso`
**Desiderata FROZEN:** `.mw/desiderata.md` v2 — World Surface: mappa viva da esplorare con gli occhi (FROZEN il 2026-08-12 con rettifiche: nessun numero fisso di layer, V3 scaffold come base).
**Cosa manca:** approvazione dei 9 sub-plan draft e delibera multi-AI (ChatGPT Web + Claude Web) sul primo sub-plan (A — contratto centrale); poi esecuzione in ordine di dipendenze.
**Aggiornamento 2026-08-11:**
- Confermato dal Director: la filosofia "mondo da esplorare con occhi" **sostituisce** il Pillar 1 (Dispatch) in `DESIGN_PILLARS.md` — proposta di riformulazione pronta, non ancora scritta nel file (in attesa di avallo esplicito).
- Diagnosticato e corretto il motivo per cui `WorldSurfaceV3Page` non si apriva: quasi tutti i file sotto `src/ui/idleVillage/worldSurface/` (layers, hooks, config, utils, test) contenevano fence markdown letterali (` ```typescript `) e mismatch export default/named — codice che non compilava affatto, nonostante il Kanban segnasse le 4 fasi V3 "Completato" (2026-07-22). Sistemati gli export, rimosse le fence, allineati i tipi di ritorno degli hook; la logica reale (event queue, wonder spawner, caustics) resta TODO/stub, solo ora la pagina è render-safe. Aggiunta voce "World Surface V3 (scaffold)" nel TestHub (`/world-surface-v3`), route in `App.tsx`. Verificato: `tsc --noEmit`, `npm run build:check`, `npm run kanban:lint`, e i 4 file di test coinvolti passano (6 passed, 5 todo espliciti).
- Eseguita discussione multi-AI (ChatGPT Web + Gemini Web, contesto reale del progetto incluso) su 3 domande aperte: budget layer/effetti con target Tauri desktop, trigger alternativo ai click-sequence per easter egg, tiering degli eventi cinematici. Risposta integrata fornita in sessione.
**Aggiornamento 2026-08-12:**
- Pillar 1 in `DESIGN_PILLARS.md` riscritto e congelato; tabella di sintesi (§2) e raffinamenti World Surface (§3.1) allineati al nuovo Pillar.
- Corretti due file non compilanti segnati come Completato a Kanban: `src/ui/idleVillage/components/destinyAstrolabeV3/palette.ts` (ASTRO-V3-F1) e `tests/unit/idleVillage/WorldSurfaceV3Underwater.test.tsx` (V3 Underwater); safeguard di scope passati (lint, test, build:check, kanban:lint).
- Desiderata v2 FROZEN in `.mw/desiderata.md` con l'intento "World Surface: mappa viva da esplorare con gli occhi" e V3 scaffold come base strategica.
**Aggiornamento 2026-08-12 (piano):**
- Scritto e connesso `src/docs/docs/plans/world_surface_v3_tactical_plan.md`: risolve i 3 punti aperti (budget layer/effetti, trigger AttentionZone, tier eventi); fasi d'esecuzione e criteri di successo definiti; `world_surface_v3_strategic_plan.md` aggiornato con Next Steps coerenti.

**Aggiornamento 2026-08-12 (piano v2.2):**
- Integrata la seconda round di review multi-AI (Gemini Web, Claude Web, cold read ChatGPT API) nel piano tattico: Engine Pipeline Pattern, QuadTree/spatial indexing, hover intent tolerance, texture warmup, background pause, HiDPI scaling, preemption matrix, wonder timeline, catalogo biomi con ambient life, FrameBudget/quality profiles, World Clock frozen kit (`clockKit`), correzioni FSM, Tier 3 de-escalation, persistence keys, testing aggiornato.
- Verificato che il World Clock è già un frozen kit certificato (`clockKit`) importabile con una singola riga; non serve fix.

**Aggiornamento 2026-08-13 (decomposizione):**
- Il Director richiede di usare la **skill `strategist` di Mind Weaver** per la decomposizione del piano tattico v2.2, passando come contesto i mandate RPG `strategist-mandate` e `coordinator-mandate`.
- L'output deve essere una suddivisione in sub-piani/task con classificazione `direct`/`task`/`sub-plan` e, per ogni nodo, i campi `invariants`, `constraints`, `approach_notes`, `execution_hint` e `safeguards` derivati dai mandate RPG.

**Aggiornamento 2026-08-13 (delibera A):**
- Eseguita delibera multi-AI su **Sub-plan A — Contratto centrale** con ChatGPT Web e Claude Web tramite `mw-critique-plan.py` di Mind Weaver.
- Esito: **118 critique items unici**; entrambi i provider richiedono una **major revision (v2)** prima del "battesimo".
- Critiche principali: (1) shape completa di `WorldSurfaceV3ConfigSchema` non definita; (2) manca il modello di ownership tra schema, registry e preset; (3) relazioni referenziali incomplete (unicità ID, riferimenti inversi, error handling); (4) `Dependencies: Nessuna` fuorviante — richiede discovery dei consumer esistenti.
- Evidence log copiato in: `test-results/world-surface-v3-subplan-A-critique/`.

**Aggiornamento 2026-08-13 (delibera A v2):**
- Riscritto Sub-plan A in v2 con shape root esplicita, modello di ownership, referential validation e consumer discovery.
- Eseguita seconda delibera: **Claude Web `failed`** (response did not stabilize), **ChatGPT Web `success`**.
- Esito ChatGPT: **375 unique critique items**; verdetto generale: il contratto radice tenta di definire troppo in un colpo solo — mancano le shape delle singole entità (`EventSeverity`, `Reaction`, `Wonder`, `Biome`, ecc.), il modello preset (parziale vs completo) è contraddittorio, esiste un conflitto `biomes[].id` vs enum biomi, e `attentionZones` non può essere opzionale se la demo la richiede.
- Evidence log: `test-results/world-surface-v3-subplan-A-critique-v2/`.

**Aggiornamento 2026-08-13 (fase esplorativa B):**
- Il Director ha scelto l'opzione **B**: usare la skill `explorer` di Mind Weaver per definire il domain model prima di riscrivere i sub-plan.
- Obiettivo dell'esplorazione: chiudere i conflitti `biomes enum vs ID`, `preset parziale vs completo`, lifecycle `authoring → validation → normalization → registry → runtime`, e definire le shape complete di ogni entità.
- Attivata deliberazione multi-AI iterativa con `mw-iterative-deliberate.py` (Mind Weaver): convergenza in 1 ciclo.

**Aggiornamento 2026-08-13 (domain model e split A.1/A.2/A.3):**
- Domain model congelato in `src/docs/docs/plans/world_surface_v3_domain_model_decision.md`: biomi = closed vocabulary + authored catalog; `EventSeverity` = eligibility profile, non evento; `WorldSurfaceV3Fragment` per preset parziali; composizione deterministic; registry read-only derivato; matrice referenziale completa.
- Sub-plan A spezzato in tre:
  - **A.1** — Consumer audit e freeze public API (`createWorldSurfaceV3Registry(config)`).
  - **A.2** — Fragments, schemas, composer, referential/semantic validation, normalizzazione, deep-freeze.
  - **A.3** — Registry e migrazione consumer.
- Indice aggiornato in `src/docs/docs/plans/world_surface_v3_subplans_index.md`.
- Evidence log: `test-results/world-surface-v3-domain-model-deliberation/`.
- I vecchi `world_surface_v3_subplan_A_root_config.md` v1/v2 restano nel repo come storia ma non sono più nel percorso attivo.

**Aggiornamento 2026-08-13 (delibera su A.1/A.2/A.3):**
- Il Director ha scelto l'opzione **2**: eseguire una **delibera multi-AI** sui tre sub-plan A.1, A.2, A.3 prima di congelarli.
- Risultato:
  - **A.1** — ChatGPT Web `success`, Claude Web `failed` (response did not stabilize). Verdetto: il nodo è **prematuro come "contract freeze"** ma sensato come consumer discovery/audit; i blocking sono il freeze del coordinate system non giustificato, l'API nominale non contratto, e `Dependencies: Nessuna` contraddetta dal riferimento al domain model.
  - **A.2** — ChatGPT Web `success` e Gemini Web `success` al retry. **325 unique critique items**; verdetto: **NON READY FOR EXECUTION**, **major revision (v2)** richiesta. Critiche principali: manca il contratto operativo del composer (lifecycle, immutabilità, mappe), `ReadonlyMap` ≠ immutabilità, `verified` incompatibile con open questions.
  - **A.3** — ChatGPT Web `success` e Gemini Web `success` al retry. **325 unique critique items**; verdetto: **NON READY FOR EXECUTION**, **major revision (v2)** richiesta. Critiche principali: ownership/lifecycle del registry non deciso, `ReadonlyMap` nominale, migrazione completa ma verifica parziale, confine registry/hook/state non definito.
- Evidence log copiato in:
  - `test-results/world-surface-v3-subplan-A1-critique/`
  - `test-results/world-surface-v3-subplan-A2-critique/`
  - `test-results/world-surface-v3-subplan-A3-critique/`
- I sub-plan A.1/A.2/A.3 restano in stato `Draft`.

**Aggiornamento 2026-08-13 (riduzione A.1 e inizio esecuzione):**
- Il Director ha scelto l'opzione **2**: ridurre A.1 a **discovery senza freeze**, eseguire l'audit reale e poi usare l'evidenza per riescrivere A.2/A.3.
- A.1 v2: audit puro, nessun freeze di API o coordinate; output `CONSUMER_AUDIT.md` con consumer diretti, indiretti, field usati, coordinate, disposizioni candidate (da validare in A.2/A.3).
- In esecuzione: discovery dei consumer attuali e stesura `CONSUMER_AUDIT.md`.

**Aggiornamento 2026-08-13 (riscrittura A.2/A.3 v2):**
- Il Director ha scelto l'opzione **3**: riscivere **A.2** (contratto/validation) e **A.3** (registry/migrazione) in v2, basandosi su `CONSUMER_AUDIT.md` e sulle critiche multi-AI.
- Obiettivo: piani sufficientemente concreti da poter essere eseguiti senza decidere architettura al volo.
- Stesura di `world_surface_v3_subplan_A2_contract_validation.md` v2 e `world_surface_v3_subplan_A3_registry_migration.md` v2 completata.

**Aggiornamento 2026-08-13 (prossimi piani):**
- Il Director ha risposto `no` alle opzioni 1/2/3 precedenti (delibera/congelare/eseguire A.2/A.3) e ha chiesto di procedere con i **prossimi piani**.

**Aggiornamento 2026-08-13 (sub-plan B + cold read):**
- Il Director ha scelto di riscivere **Sub-plan B — WorldClock adapter** e di fare un **cold read** (delibera multi-AI) su di esso.
- Risultato cold read: **Claude Web `failed`**, **ChatGPT Web `success`**. **337 unique critique items**.
- Verdetto: **NON PRONTO**. Critiche bloccanti: (1) semantica di `now` non definita; (2) duplicazione source of truth tra `clockKit` e `controller` locale; (3) API dichiarata "congelata" con decisioni fondamentali ancora aperte; (4) `speed` introduce scope non giustificato; (5) background policy insufficiente per Tauri; (6) `requestAnimationFrame` in tensione con no-render-60-FPS.
- Evidence log: `test-results/world-surface-v3-subplan-B-critique/`
- Sub-plan B resta `Draft`.

**Aggiornamento 2026-08-11 (pivot a counter-plan, esecuzione diretta):**
- Il Director ha chiesto una critica spietata al piano tattico e ha approvato la **contro-proposta** in `src/docs/docs/plans/world_surface_v3_critique_and_counterplan.md`.
- Decisioni Director prese in sessione: (1) `/world-surface-v3` cancellato, la mappa è `/world-surface`; (2) asset morti spostati fuori da `public/` (non cancellati); (3) Linux non è target di rilascio.
- Esecuzione diretta (nessun ulteriore piano): 5 fette verticali su `/world-surface`.
- **Slice 0** ✅: scaffold V3 rimosso, 51 MB fuori da public/, HUD perf deployato, pipeline WebP (27.9 MB→1.9 MB, max edge 3072 px < 4096 px WebKit ceiling).
- **Slice 1** ❌ **approccio scartato per evidenza empirica** (questo era lo scopo della fetta): il breath CSS del piano §7 non è implementabile sugli asset attuali.
  - Provato: `transform: translateX` sui layer foresta, `opacity` shimmer sul mare.
  - **Esito osservato dal Director:** *"c'è una foresta intera a blocco intero che si sposta lateralmente e lascia spazi neri"*.
  - **Causa:** i 21 layer sono PNG **full-canvas baked**. Traslare il layer "foresta" non fa ondeggiare le fronde — fa slittare un ritaglio rettangolare della mappa dipinta, staccando gli alberi dalle loro ombre ed esponendo canvas nudo al bordo. Sul layer `sea` (base che riempie i vuoti fra le isole) qualsiasi transform apre buchi neri e qualsiasi variazione di opacità è visibile attraverso i bordi trasparenti delle coste come mismatch di colore.
  - **Il piano presupponeva asset che questo mondo non ha**: la colonna "Tecnica" di §7 dice nuvole = *sprite-sheet drift*, nebbia = *overlay gradient*, acqua = *texture/sprite motion*. Sono elementi separabili. Un layer di terreno baked non lo è.
  - **Due rotte praticabili, nessuna è una transform CSS su questi file:** (1) creare asset atmosferici dedicati (sprite nuvole, overlay nebbia, pass chiome) e animare solo quelli — corrisponde al piano come scritto; (2) deformare *dentro* la texture con un displacement filter WebGL, così il quad non si muove e nessun bordo si scopre.
  - `BREATH_MAP` resta in `WorldSurfaceRenderer.tsx` **vuoto e documentato**, così la rotta (1) costa una entry per asset e non un refactor.
- **Slice 2** ✅ (parziale): reaction zone hard-coded sul villaggio, due trigger commutabili a runtime (`camera-enter` / `pointer-dwell 2s`) per decidere per osservazione quale adottare. **Il feedback visivo attuale è un rettangolo giallo di debug e va sostituito** — una reazione che si annuncia con un riquadro e la scritta "qualcosa si muove" contraddice §14 e il principio della scoperta. Nota: l'anchor `village_01` del manifest (624,416) **non corrisponde** alla posizione in cui il villaggio è dipinto (~2078,1554 world) — da riconciliare.
- **Slice 1-bis** ✅ **breath dell'acqua via WebGL displacement**, rientrando nei binari del piano dopo il fallimento della via CSS:
  - Il piano colloca il breath in `Container_Breath` **dentro Pixi** (§3), non in CSS: la prima implementazione era fuori architettura.
  - Vincoli del piano rispettati: acqua = *"texture/sprite motion (no UV ripple **se non profilato**)"* (§7), *"underwater ridotto a **surface ripple** + silhouette shadow"* (§33), *"Vietato in V3: **shader custom**"*. Usato `DisplacementFilter`, filtro **built-in** di Pixi — nessuno shader custom. La clausola "se non profilato" è soddisfatta dall'HUD di Slice 0.
  - `WorldSurfaceSeaRipple.tsx`: sprite del mare + mappa di displacement **generata proceduralmente** (nessun asset da creare), che deriva in loop. Lo sprite del mare **non si muove mai** — si muove il campo di displacement — quindi nessuna costa viene scoperta: è il difetto che affondava la via CSS.
  - Backing store a **1060×707** (RENDER_RESOLUTION 0.25) scalato via CSS a 4240×2828: render target ~3 MB invece di 48 MB. L'acqua è imagery a bassa frequenza, il quarto di risoluzione non è distinguibile.
  - **Fail-safe:** il canvas è sovrapposto all'`<img>` statico, non lo sostituisce. Se WebGL manca o Pixi non inizializza, il mare resta dipinto e fermo invece di sparire.
  - Verificato in-browser: canvas WebGL vivo, backing 1060×707, 21/21 layer, nessuna regressione visiva. **L'animazione non è osservabile nel browser pane** (`document.hidden=true` blocca rAF e quindi il ticker Pixi): va guardata in un browser reale.

**Collegamenti:** `src/docs/docs/plans/world_surface_v3_strategic_plan.md`, `src/docs/docs/plans/world_surface_v3_tactical_plan.md`, `src/docs/docs/plans/world_surface_v3_subplans_index.md`, `src/docs/docs/plans/component_based_world_surface_plan.md`, `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` (riga `world-surface-component`), `DESIGN_PILLARS.md`, `src/ui/idleVillage/worldSurface/`, `/tmp/ws_broadcast/BROADCAST.md` (output multi-AI), `.mw/desiderata.md`, `src/ui/idleVillage/frozen/kits/clockKit.tsx`, `test-results/world-surface-v3-subplan-A-critique/synthesis.md`.

---

## R-004 — Skill operative = Mind Weaver; le skill storiche di RPG sono contesto, non invocabili

**Richiesta:** *"segna che le skill di RPG sono 'vecchie' e che quando parlo d usare skill dovresti sempre fare riferimento a quelle di mind weaver, cn quelle info, contesti, mandati, ecc."*
**Data:** 2026-08-13
**Stato:** `fatta` (registrazione della regola; resta in vigore permanentemente)
**Desiderata FROZEN:** `.mw/desiderata.md` v1 (adozione protocollo Mind Weaver in RPG).
**Regola:** Quando il Director dice "usa la skill X", il riferimento è sempre alle **skill Mind Weaver** (`explorer`, `planner`, `strategist`, `executor`, `coordinator` in `.agents/skills/` del repo mind-weaver e nelle directory skill degli IDE). Le skill storiche di RPG (`coordinator/skills/*`: `strategist-mandate`, `coordinator-mandate`, `agent-execution-mandate`, `idle-village-task`, `mw-explorer`, `mw-planner`, `mw-executor`, `mw-regression`) **non vanno invocate come skill**: vanno lette e passate alle skill Mind Weaver come **contesto operativo** (invarianti, mandate, execution_hint, file target, safeguard, governance).
**Nota di conflitto da allineare:** `AGENTS.md` sezione "Workflow Mind Weaver in RPG" cita `.windsurf/skills/mw-explorer` ecc. come skill da invocare. Va aggiornata con avallo esplicito del Director (riformulazione proposta: le skill RPG sono documenti di contesto caricati dalle skill Mind Weaver, non skill invocabili).

---

## R-005 — POI Quest System: cerchio magico come timer, quest card a fasi, skill check per fase

**Richiesta:** *"in day/night nn c'è il componente visivo, deve esserci. il POI deve riempirsi in senso orario, la durata di 'in quanto tempo si riempie' è nelle config e lo trovi anche nel POI detail. Questo è un POI speciale, quest, deve apparire la quest (attualmente nn c'è un componente battezzato, dovrebb essere una card stretta e lunga, cn diverse fasi, e x ogni fase si esegue uno skill check cn /minimal-destiny-astrolabe). Quando il tempo è finito l'Halo è pieno, si ferma e pulsa, ci clicchi sopra e si apre al posto del detail [...] e vedi il risultato dello skill check che t dice se hai vinto o perso. La difficoltà ecc della quest devono essere legati allo skill check e dati come input."*
**Data:** 2026-08-11
**Stato:** `aperta`
**Desiderata FROZEN:** nessuna corrispondente. `.mw/desiderata.md` v2 riguarda World Surface; questa richiesta tocca la meccanica POI/quest (Pillar 2 e 3) e richiede una **nuova desiderata v3**.
**Documento di esplorazione:** [src/docs/docs/plans/poi_quest_system_exploration.md](src/docs/docs/plans/poi_quest_system_exploration.md)

**Confermato dal Director in sessione (2026-08-11):**
- Il loop è: tempo scorre → milestone temporali → uno skill check per milestone → al 100% cerchio pieno che si ferma e pulsa → click → quest card con esito.
- L'halo **non ruota, si scrive**: iscrizione magica in calligrafia arcana che si materializza carattere per carattere partendo dalle ore 12, senza binari né cerchio preesistente (riferimento: Frieren). Spec visiva completa verbatim nel documento di esplorazione §2.
- Lo skill check **non interrompe** il gioco: il giocatore vede cosa succede nella quest **solo se ha aperto** il detail/quest card.
- Cliccando sul POI a spedizione avviata si apre la **quest card sola**, non il POI detail.
- A cerchio completo si vede un **esito combinato finale** (non le 4 fasi in narrazione sequenziale).
- La card si chiude con un pulsante **"Raccogli ricompense"**, per dare tempo di leggere cosa è successo.
- Forma della card: rettangolo stretto e lungo cinematografico, BG image, bordo, titolo, descrizione breve, **rope stile Hearthstone** in basso che si riempie sulla durata della quest, e **un riquadro per fase** con icona ed esito.

**Trovato nel repo (l'"90% completo" indicato dal Director):**
- `src/ui/idleVillage/components/QuestChronicle.tsx` — cornice cinematografica 21/9, BG, titolo, progress bar segmentata per fase, card per fase con stato `locked/active/success/failure` e rischi, overlay di esito. Mancano rope, pulsante di raccolta, cablaggio time engine + astrolabe. Non è ancora un frozen kit.
- Modello di dominio già completo: `QuestBlueprint`, `QuestPhase` (con `durationValue`/`durationUnits`), `TrialPhaseRequirement.skillCheckId`/`difficultyLabel`/`requiredStatTags`, `QuestPhaseRiskProfile`, `QuestState`, `QuestPhaseResult`.
- `DestinyAstrolabeComponent` accetta già `skills[]` con difficoltà individuali, `criticalFailChance`, `woundedChance`, `deathChance`, `onComplete`.
- Day/night visivo esistente: `DayNightPOI` / `DayNightPoiSkin`, pagina `/minimal-time-daynight-integration`.

**Risposte ricevute dal Director (2026-08-11):**
- **Q1 milestone**: equispaziate — 25% / 50% / 75% / 100%.
- **Q2 durata**: a codice le due sorgenti divergono (`durationFormula='3'` secondi vs fasi=6h). Le `QuestPhase.durationValue/durationUnits` sono l'autorità; `durationFormula` va allineato o ignorato per i POI quest.
- **Q3 clock**: sì, tutto si collega al time engine (velocità, pause).
- **Q4 stat**: somma delle stat dei residenti presenti negli slot, filtrate per `requiredStatTags` della fase.
- **Q5 Astrolabe**: V1 canonica.
- **Q6 visibilità**: l'animazione Astrolabe è visibile nella card. Prima del lancio automatico il giocatore può spendere consumabili.
- **Q7 fallimento**: non interrompe la quest automaticamente. Ogni fase produce ferite/morte/modificatori loot. Il giocatore può interrompere manualmente.
- **Q8 rope**: si riempie di luce (linguaggio visivo del progetto: spento → pieno).
- **Q9 raccolta**: raccolta manuale. Residenti tornano nel roster. Cerchio si dissolve. POI torna pre-assegnazione. Altri POI hanno comportamenti diversi (scomparsa, auto-collect per job/training su cicli da config).
- **Q10 perimetro**: modifica la pagina esistente `/poi-quest-detail-roster-time-clock`.
- **Q11 glifi**: separato in task R-006 (POI reskin). Task corrente usa il cerchio come componente funzionale; reskin skin verrà dopo.
- **Q12 day/night**: `DayNightPOI` è il componente mancante.

**Vincolo architetturale trasversale (enunciato dal Director):**
Tutto (time engine, slots → comportamento, resident assignment, bloom, cerchio magico) deve essere valido per **tutta la famiglia POI**, non solo per il POI quest. Tutto deve essere **portabile con una riga** (frozen kit) e valido per tutti i POI.

**Due task separati:**
- **R-005** (questo): quest system — cerchio magico come timer, quest card, astrolabe, day/night, sulla pagina esistente.
- **R-006**: POI reskin — ActionHalo → nuovo halo skin, nuovo body medaglione, sistema condiviso famiglia POI.

**Stato aggiornato:** `fatta` (esecuzione R-005) — vedi sotto.

**Esecuzione (2026-08-11):**
- **Desiderata v3 FROZEN** in `.mw/desiderata.md` (avallo "procedi").
- **Piano:** [poi_quest_system_plan.md](src/docs/docs/plans/poi_quest_system_plan.md), T-001→T-009 eseguiti.
- **Consegnato:** `MagicCircleHalo` (iscrizione che si scrive dalle ore 12, nessun binario, stop+pulsazione a chiusura), `useMilestoneEngine` (una milestone per fase, equispaziate), `MilestoneCheckModal` (consumabili → Destiny Astrolabe), `QuestChronicle` estesa con rope luminosa e gate "Raccogli ricompense", `DayNightPOI` aggiunto alla pagina, `QuestPOI` della famiglia al posto di `GenericPoiSkin`, frozen kit **`questPoiKit`** (status `draft`).
- **Config-first:** durata da `QuestPhase.durationValue` via `questTimeScale` (Zod), difficoltà via `questSkillCheckConfig` (Zod), glifi/timing/palette via `magicCircleHaloSkinConfig`.
- **Difetti preesistenti corretti:** la quest si risolveva all'istante dell'avvio (rendendo morto l'effetto di auto-fail); il moltiplicatore di velocità del clock non aveva effetto; chiudere il pannello conseguenze scartava l'esito; chiavi React duplicate; chiavi i18n mancanti. Più un bug Zod 4 sui default annidati colto dai test.
- **Safeguard:** tsc, lint, build:check, kanban:lint verdi; **72 nuovi test passed**; route 200.
- **Evidence:** [poi-quest-system-r005-2026-08-11.md](test-results/poi-quest-system-r005-2026-08-11.md).
- **Aperto:** `questPoiKit` da portare a `certified` con il suo contract.

**Correzioni dopo i rilievi del Director (2026-08-12):**
- **Day/night collegato al time engine**: `DayNightPOI` accetta props controllate (fallback allo store); la pagina ha ora una sola sorgente di tempo da cui derivano clock, fase e countdown. Riposizionato con la struttura di `/minimal-time-daynight-integration`.
- **Cerchio perfettamente attorno al POI**: era sfasato di 68px (si centrava sul wrapper con badge e label) e troppo largo (raggio 113px su orbo da ~65px). `QuestPOI` espone `medallionOverlay` ancorato al quadrato del medaglione — fix valido per tutti i POI quest — e il cerchio condivide `size` col medaglione con `radiusRatio` 0.78.
- **Detail e quest card centrati** in overlay `fixed`, interamente visibili (misurato).
- **Testo e badge del POI** visibili; danger non più duplicato; badge riancorati al medaglione.
- **Altri difetti corretti**: dopo Start restava aperto il detail invece della quest card; esito finale incoerente ("PERFETTO" con 0/3 fasi) ora derivato dalle fasi via `resolveQuestOutcomeTier`; durata "6MS"; namespace i18n `activityCapsule` assente; interpolazione i18n con parentesi doppie invece che singole; rumore floating point nei rischi; ref scritto durante il render in `useMilestoneEngine`.
- **Safeguard**: tsc, kanban:lint, build:check (con il polyfill crypto) verdi; **98 test passed**; route 200.
- **Segnalato a parte**: `tests/unit/idleVillage/DayNightPOI.test.tsx` ha 13/14 test rossi, verificato **preesistente** (identici su HEAD) — il file asserisce una vecchia API.

---

## R-006 — POI Reskin: nuovo halo, medaglione, sistema famiglia POI

**Richiesta:** *"noi stavamo lavorando a un restyling del POI, quindi halo e quel tipo di componente che ti chiedevo facevano parte di questo cambiamento della skin, va fatto, insieme al nuovo body del medaglione, ecc."*
**Data:** 2026-08-11
**Stato:** `da chiarire`
**Desiderata FROZEN:** nessuna corrispondente.

**Confermato dal Director:**
- ActionHalo e il body del medaglione fanno parte di un restyling della famiglia POI.
- Tutto quello che viene implementato per il POI quest (time engine, slot→comportamento, resident assignment, bloom, cerchio magico) deve essere **valido per tutta la famiglia POI** e **portabile con una riga** (frozen kit).
- Il linguaggio glifico del cerchio magico appartiene a questo task, non a R-005.
- R-005 e R-006 condividono il vincolo architetturale: sistema famiglia POI condiviso e freezabile.

**Cosa manca:** spec del nuovo halo (forma, animazioni), spec del nuovo body medaglione, inventario completo dei componenti POI da reskinare, definizione del sistema condiviso famiglia POI (quali comportamenti, quali hook, quale config).
