---
title: Richieste esplicite
type: intent-ledger
updated: 2026-08-18
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

**Aggiornamento 2026-08-12 (atmosfera: onde, uccelli, maschere terreno):**
- `WorldSurfaceSeaRipple` (Pixi DisplacementFilter) **rimosso**: il piano tattico §294 budgeta l'acqua come "texture/sprite motion (no UV ripple se non profilato)" e il filtro era esattamente l'UV ripple escluso, non profilato — oltre a essere invisibile a schermo.
- Sostituito da `WorldSurfaceWaves`: 18 segni di risacca vettoriali in mare aperto, che compaiono e svaniscono su ciclo di 15s. Posizioni derivate da `points.json`, campionato dall'alfa dei layer con una fascia di esclusione attorno a ogni costa.
- Nuovo `scripts/build-terrain-masks.mjs`: emette `sea_mask`/`land_mask` complementari (per lo switch nuvola→ombra), `shallow_mask` (tinta acqua bassa cotta, zero costo runtime) e i punti di posizionamento per onde e stormi.
- **Bug corretto in `build-foam-mask.mjs`**: la sfocatura di una maschera che tocca i bordi della canvas accendeva l'intera cornice (valore 241 nell'angolo, media 143 sul bordo), quindi la schiuma disegnava una fascia lungo tutto il perimetro della mappa. Margine ora azzerato; copertura scesa a 2.28%.
- Uccelli riscritti come **evento**: decollo in formazione da un punto entroterra, salita diagonale, ~1.2s di volo, poi cielo vuoto per ~1 minuto. Coerente con `DESIGN_PILLARS.md` §22 ("vita ambientale rara, non rumore continuo", "stormo" fra le sorprese rare).
- Aggiunte vignettatura e ombra portata della cornice.
- **Verificato al browser**: pan mano(-180,-110) → mondo (-180,-110) esatto; zoom rotella 1.000 → 1.100; 18 onde / 12 uccelli / 8 nuvole / 8 ombre montati; tinta acqua bassa attiva.
- Safeguard: 22 test verdi (4 file), lint 0 errori, `build:check` passato.
- **Aperto**: la forma delle onde è in scelta fra tre candidate (swell / anelli / galloni); il runtime `/world-presentation-director` è `trusted` ma non è consumato da `WorldSurfaceRenderer` (0 riferimenti) — è la sede naturale per eventi rari tipo mostri marini.

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

**Aggiornamento 2026-08-17:** nuova contro-proposta ricevuta dal Director (critica ChatGPT alla mappa viva). Creato `src/docs/docs/plans/world_surface_reactive_artifact_plan.md`: piano no-parallax con 6 effetti prioritari e fette verticali; da avallare in sessione.
|
**Risposte Director (sessione 2026-08-17):** (1) mappa come manufatto sul tavolo — confermata idea iniziale; (2) parallasse non usabile; (3) 6 priorità diventano P0; (4) inchiostro via paintover: provare e decidere.
|
|**Collegamenti:** `src/docs/docs/plans/world_surface_v3_strategic_plan.md`, `src/docs/docs/plans/world_surface_v3_tactical_plan.md`, `src/docs/docs/plans/world_surface_v3_subplans_index.md`, `src/docs/docs/plans/component_based_world_surface_plan.md`, `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` (riga `world-surface-component`), `DESIGN_PILLARS.md`, `src/ui/idleVillage/worldSurface/`, `/tmp/ws_broadcast/BROADCAST.md` (output multi-AI), `.mw/desiderata.md`, `src/ui/idleVillage/frozen/kits/clockKit.tsx`, `test-results/world-surface-v3-subplan-A-critique/synthesis.md`.

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

**Round 3 — desiderata v4 (2026-08-12):** il Director ha elencato sei problemi e li ha promossi a desiderata (`.mw/desiderata.md` **v4 FROZEN**). Risolti tutti:
- **Pannelli flottanti** (`FloatingPanel`, nuovo): detail, quest card e skill check si spostano trascinando l'intestazione, si riducono a icona, si chiudono, e **non bloccano più la pagina** (nessun backdrop; verificato via hit-test che il clock resta raggiungibile). Lo stack porta davanti l'ultimo pannello toccato.
- **Ritmo delle fasi**: mentre un check è aperto il tempo della quest non avanza, quindi le fasi si risolvono **una alla volta con tempo che scorre in mezzo**. Con 3 fasi su 6s le milestone scattano a 2.0s / 4.0s / 6.0s (verificato). Ridurre a icona il check lo fa risolvere fuori scena e la quest riprende.
- **Schermata ricompensa** (`QuestRewardPanel`, nuovo): riscritta da zero sui ruoli di `/design-system` (`SkinScope`, `data-skin="panel|section|badge|title|cta"`, token `--skin-*`); un test verifica che nessun elemento imposti un colore letterale.
- `MilestoneCheckModal` è ora contenuto puro, ospitato in un pannello.
- **Difetti corretti**: il drag dipendeva dal successo di `setPointerCapture`; una posizione NaN veniva scartata silenziosamente da React; `rect.width ?? width` non intercettava `width: 0`.
- **Safeguard**: tsc, build:check, kanban:lint, eslint verdi; **124 test passed** (26 nuovi); route 200.

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

---

## R-007 — Invasione Goblin: sostituire la WorldSurfaceEventCard con GoblinEventModal

**Richiesta:** *"Ecco una struttura pronta in React... mettilo come elemento quando si fa Event Shroud a psoto di quello che c'è adesso (deve essere centrato rispetto alla mappa quando appare)."*
**Data:** 2026-08-12
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v2 — World Surface: mappa viva (trattamento cinematografico per eventi run-threatening).
**Cosa è successo:** riscritto `src/ui/idleVillage/components/WorldSurfaceEventCard.tsx` con il flusso cloud → modale goblin → split in sticker sulla mappa e widget evento top-right; usati `useTranslation` (i18n), asset e countdown da `trailerConfig`, primitive skin (`WanderlustSurface`, `SkinTitle`, `SkinBadge`, `SkinButton`); aggiunte chiavi `world.goblinInvasion` in `en` e `it-IT`; `build:check` e `eslint` passati.

---

## R-008 — Lab per iterare i tipi di GoblinEventModal

**Richiesta:** *"creami una pagina dove vedo: GoblinEventModal di tutti i tipi isolata e iteriamo li"*
**Data:** 2026-08-12
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v2 — World Surface: mappa viva (trattamento cinematografico per eventi run-threatening).
**Cosa è successo:** creati `src/ui/idleVillage/trailer/GoblinEventModal.tsx` (componente controllato con stage `clouds | modal | splitting | done`), `src/ui/idleVillage/pages/GoblinEventLabPage.tsx` (griglia 2x2 con i 4 stage) e rotta `/goblin-event-lab` in `App.tsx`; `build:check` e lint sui nuovi file passati.

---

## R-009 — GoblinEventModal: cancella varianti, congela V1 e itera

**Richiesta:** *"cancella tutti tranne v4, chiamala v1. smettila d usare sempre la v4, devi continuare a farne di nuovi partendo dalla nuova v1 (poi v2, ecc)"*
**Data:** 2026-08-13
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v2 — World Surface: mappa viva (trattamento cinematografico per eventi run-threatening).
**Cosa è successo:** cancellati `GoblinEventModal.tsx`, `GoblinEventModalObservatory.tsx`, `GoblinEventModalCinematic.tsx`, `GoblinEventModalCard.tsx`, `GoblinEventModalProduction.tsx`, `GoblinEventModalV4.tsx`; creato `src/ui/idleVillage/trailer/GoblinEventModalV1.tsx` (la variante V4 precedente rinominata e definitiva); aggiornata `src/ui/idleVillage/pages/GoblinEventLabPage.tsx` per mostrare solo V1. Le prossime iterazioni partiranno da V1 come baseline.

---

## R-010 — Workflow di pagina specifica: documentazione e catalogazione componenti

**Richiesta:** *"voglio parlare di una pagina in particolare, questa pagina tocca tanti componenti, devi scrivere nei documenti giusti le parti corrette, che devono essere linkati tra loro, ecc. alla fine del mio discorso, con domande di chiarimento (usa explorer) dobbiamo avere tutto il workflow corretto per questa pagina, e tutte le parti devono essere state spiegate correttamente, e catalogate correttamente."*
**Data:** 2026-08-13
**Stato:** `da chiarire`
**Desiderata FROZEN:** nessuna corrispondente; da determinare quando sarà chiara la pagina.

---

## R-011 — GoblinEventModal: mockup HTML reale e V4 con CTA a strati, icona teschio e glow card

**Richiesta:** *"la forma del pulsante non mi piace per niente, cerca online il modo più interessante di fare pulsanti per qualcosa di simile, usa cappello appropriato e prompt potenziati, poi fammi proposte."* Evoluta in: critica V3, sintesi con ricerca (Hearthstone, They Are Billions, Returnal, GameJuice) e direttiva di costruire un mockup HTML/CSS/JS vero apribile/testabile, poi una nuova versione V4 a partire da quel mockup.
**Data:** 2026-08-13
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v2 — World Surface: mappa viva (trattamento cinematografico per eventi run-threatening).
**Cosa è successo:** creato `public/mockups/goblin-event-v4-mockup.html` con nuvole scure, icona SVG teschio-goblin + asce incrociate, contatore esagonale, glow rosso pulsante attorno alla card, bottone Hearthstone a due strati (cornice ferro/inserto pelle/rivetti) con squash & stretch elastico via JS; implementato `src/ui/idleVillage/trailer/GoblinEventModalV4.tsx` portando il mockup in React con `framer-motion` per il pulse della card, stato `docked` con la stessa icona, e `CtaButton` a molla; aggiornata `GoblinEventLabPage` per confronto V3/V4. Lint e build passati.
**Cosa manca:** nome/path della pagina; elenco dei componenti coinvolti; riferimenti ai doc esistenti da aggiornare o creare.

---

## R-012 — GoblinEventModal V5: riallineamento alla foundation recipe

**Richiesta:** *"è inguardabile, bruttissimo, nn rispecchia nulla della filosofia estetica del progetto"* in risposta a V4; direttiva di procedere con una versione riallineata a `DESIGN_PILLARS.md` §1 e `foundationRecipe.ts`.
**Data:** 2026-08-13
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v2 — World Surface: mappa viva (trattamento cinematografico per eventi run-threatening).
**Cosa è successo:** creato `src/ui/idleVillage/trailer/GoblinEventModalV6.tsx` e `src/ui/idleVillage/trailer/GoblinEventModalV7.tsx` (con V7A, V7B, V7C). V6 ha forma esterna V3, frame ferro freddo, sfondo obsidian, titolo "Invasion" e CTA `SkinButton`. V7A integra lo sticker goblin con vignetta rossastra, `mask-image` radiale, color-grade e ombra di contatto. V7B inserisce lo goblin in uno scudo intagliato in ferro freddo. V7C usa l'illustrazione goblin come full-bleed con maschera radiale e gradiente di lettura. Tutte usano `SkinScope`, `SkinTitle`, `SkinButton`. `GoblinEventLabPage` aggiornata per V1–V7C. Lint e build passati.

---

## R-013 — Test UI Playwright per /poi-quest-detail-roster-time-clock

**Richiesta:** *"voglio che tu faccia un set di test per questa pagina, questi test devono verificare tutto quello che ho detto a run time con playwright o quello che preferisci, ma da UI e devono essere veri. TUTTO. Quindi ci serve un sistema per passare dai documenti di specifica ai test di integrazione automaticamente (un workflow? dimmi tu, proponi). Ogni cosa scritta deve essere esaminata, divisa in verità, creato un test, verificato e in caso di trovare un errore popoliamo la lista degli errori da fixare. Procedi uno alla volta. Se ci sono altre cose che ti serve sapere, quando esamini quella riga/parte e non trovi nella documentazione le risposte falle a me. Una volta che finisci dimmi cosa abbiamo di errori, io farò un giro a FE e ti dirò se trovo altri errori, o se alcuni degli errori che hai trovato non sono veri errori, ecc. Io nel workflow ho scordato sicuramente cose, ad esempio quando provi a rilasciare un pgTokenDraggable in un punto non corretto (che deve tornare indietro con lo spring), altri dettagli tipo del roster, ecc. che adesso non erano super pertinenti con questa pagina di preciso, ma lo sono in generale. Devi verificare anche tutte quelle cose degli altri .md. Tutto deve essere corretto e funzionante."*
**Data:** 2026-08-13
**Stato:** `in corso`
**Desiderata FROZEN:** `.mw/desiderata.md` v3 — POI quest system (meccaniche base implementate).
**Cosa è successo:** installati browser Playwright; creato `tests/e2e/idleVillage/poiQuestDetailRosterTimeClock.spec.ts`; test #1 page load e test #3/4 (drop invalid e drag pannello) passati; test #2 Start gating ancora instabile: il `PointerSensor` di dnd-kit non si attiva con `locator.dragTo` / `page.mouse` (emittono solo mouse events) e neppure con `dragResidentCard` in quanto la sequenza pointer synthetic è incompleta; ERR-017 rimosso dal registro perché falso positivo.
**Cosa manca:** stabilizzare il drag per dnd-kit `PointerSensor`, quindi continuare con gli altri requisiti uno alla volta e creare tracciabilità spec-to-test.

---

## R-014 — CTA canonico `SkinButton` a bronze/gold nello skin system

**Richiesta:** *"dammi un prompt x cambiare altrove skinbutton canonico"*
**Data:** 2026-08-13
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v2 — World Surface: mappa viva (trattamento cinematografico per eventi run-threatening).
**Cosa è successo:** aggiornati i token CTA in `skinCssVariables.ts` (`--skin-cta-bg`, `--skin-cta-border`, `--skin-cta-shadow`, `--skin-cta-hover-glow`, `--skin-cta-text-shadow`, `--skin-cta-ornament-color`, nuovo `--skin-cta-rivet`) per una placca bronzo/oro con inserto in pelle scura, borchie dorate e glow caldo senza rosso; aggiunto pseudo `::after` in `skinScope.css` con i rivetti. Nessun consumatore toccato. `build:check`, `kanban:lint` e lint sul file toccato passati. Screenshot di confronto salvati in `test-results/cta-design-system-full.png` e `test-results/cta-goblin-lab.png`.
**Cosa manca:** —

---

## R-015 — CTA su Wanderlust DNA / principi UI

**Richiesta:** *"bruttissimo, inguardabile. il prompt era sbagliato: quello che voglio è che fai un bottone all'altezza del resto dei componenti, seguendo i precetti di Wanderlust DNA e dei principi su come fare le UI."* (con critica di Claude su gerarchia, semantica colore, staffe pixel, stati, juice, icona, bevel).
**Data:** 2026-08-13
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v2 — World Surface: mappa viva (trattamento cinematografico per eventi run-threatening).
**Cosa è successo:** redesign globale del `SkinButton` `cta` in azzurro/viola, senza `◈`, con bevel, sheen, stati hover/pressed, juice via `framer-motion` (`whileHover`/`whileTap`) e nessun ornamento di default. Toccati `skinCssVariables.ts`, `skinScope.css`, `SkinButton.tsx`. `build:check`, `kanban:lint` e lint passati. Screenshot `test-results/cta-design-system-v2.png`.
**Cosa manca:** —

---

## R-016 — Installare il bridge Telegram di Mind Weaver su RPG

**Richiesta:** *"quando abbiamo installato Mind Weaver nn abbiamo installato il bridge telegram su RPG, installalo adesso, mi serve"*
**Data:** 2026-08-13
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** copiati `tools/telegram-mw-bridge.py`, `tools/telegram_state.py`, `.env.example`, `.mw/telegram-state/authorized-chats.yaml.example` da mind-weaver a RPG; aggiunto `.mw/telegram-state/` a `.gitignore`. Il bridge cerca automaticamente la runtime di Mind Weaver in `RPG` e, se manca, fallback a `/Users/faustoboni/progetti_personali/mind-weaver`.
**Cosa manca:** creare `.env` reale e configurare `TELEGRAM_BOT_TOKEN`, `TELEGRAM_USER_ID`, provider/model opzionali.

---

## R-017 — Portare il runtime multi-AI e le skill Mind Weaver in RPG

**Richiesta:** *"voglio poter lavorare su RPG, invocare le skill di Mind Weaver e utilizzare tutte le sue potenzialità, compresa la suit multi ai, ai web e qualsiasi altra cosa"*
**Data:** 2026-08-13
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** scelta l'architettura proxy: skill operative, runtime Python, config, catalogo, provider e web sessions di `mind-weaver` rese disponibili in `RPG` tramite symlink e un forwarder `.mw/bin/forward.py`; i wrapper in `RPG/scripts/` eseguono gli script di `mind-weaver` con `cwd=RPG` così piani e run vengono creati nel progetto RPG. Test passati: `mw-ask.py --help` e `mw-iterative-deliberate.py --help` eseguiti con l'interprete `RPG/.mw/venv/bin/python`. `.gitignore` aggiornato per escludere `.mw/venv`, runs, manual-dispatch, provider auth/profiles, prefect.
**Cosa manca:** usare i comandi con un prompt reale e fornire API key/web sessions in `mind-weaver/.env` o nelle variabili d'ambiente.

---

## R-018 — Documentare in context come le skill di RPG usano i protocolli multi-AI di Mind Weaver

**Richiesta:** *"scrivi nel contesto di RPG cm le skill possono e devoo usare i protocolli multi Ai, e come farlo"*
**Data:** 2026-08-13
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** creato `context/MIND_WEAVER_MULTI_AI_PROTOCOLS.md` con architettura proxy, tabella symlink, comandi per `mw-ask`, `mw-iterative-deliberate`, `mw-broadcast`, `mw-critique-plan`, `mw-web-cookie-import`, regole per le skill, bridge Telegram e riferimenti; aggiunto al `context/INDEX.md`.

---

## R-019 — Rendere `learn` skill core di Mind Weaver, portarla in RPG e integrarla automaticamente in esplorazione/pianificazione

**Richiesta:** *"Io adesso se esploro idee e spiego cose ai miei agenti voglio che usino learn automaticamente x migliorare la documentazione. Funziona su RPG? dovremmo mettere learn come protocollo? la facciamo chiamare da una skill quando trova info nuove? E' molto importante x quel progetto. Il workflow che descrivi sembra ottimale x fare bugfixing, che problemi ci sono a trapiantarla"*
**Data:** 2026-08-14
**Stato:** `in corso`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** creata `mind-weaver/.agents/skills/learn/SKILL.md` come skill core adattata da `work-solver`; symlinkata in `RPG/.agents/skills/learn` e `RPG/.windsurf/skills/learn`. Integrato il trigger `learn` nelle skill `mw-explorer`, `mw-planner` e `mw-executor` di RPG: ogni sessione che produce una nuova assunzione, workaround, bugfix o pattern invoca `learn` e scrive `.mw/runs/<timestamp>/pattern-candidate.md`.
**Cosa manca:** testare il trigger reale in una sessione di esplorazione/pianificazione/esecuzione su RPG e verificare che `pattern-candidate.md` venga prodotto.

---

## R-020 — Generalizzare il workflow `contract-ladder` di work-solver per bugfix in tutti i progetti Mind Weaver

**Richiesta:** *"contract-ladder è il workflow giusto x fare bugfix. dovrebbe essere generico su tutti i progetti che possono aver bisogno di bugfix, come RPG"*
**Data:** 2026-08-14
**Stato:** `in corso`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** creato `mind-weaver/.agents/skills/bugfix/SKILL.md` e `tools/bugfix-run.py` come workflow generico di bugfix ispirato a `contract-ladder`; rinominato `contract-ladder` → `bugfix`; symlink in `RPG/.agents/skills/bugfix` e `RPG/.windsurf/skills/bugfix`. Testato `bugfix-run.py` su un bug di esempio: produce `investigation.json`, `exploration.json`, `plan.md`, `prompt.txt`, `result.json`; il tool di `learn` scatta automaticamente in caso di test falliti.
**Cosa manca:** testare `bugfix` su un bug reale di RPG e verificare che l'agente lo invochi come workflow.

---

## R-021 — Estendere `learn` per manutenzione attiva di contesto e documentazione

**Richiesta:** *"learn si deve occupare anche della manutenzione del contesto/documentazione, lo fa? se presento nuove informazioni o cambio idea va e modifica quello che deve modificare? i riferimenti, ecc?"*
**Data:** 2026-08-14
**Stato:** `in corso`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** estesa `mind-weaver/.agents/skills/learn/SKILL.md` con la fase `Mantieni contesto`: `learn` ora confronta il nuovo pattern con `context/INDEX.md` e `context/DECISION_LOG.md`, scrive esplicitamente i cambi di idea (`Da... A... Motivo... Fonte...`) e aggiorna i riferimenti. Non modifica `CANON.md`, `DESIGN_PILLARS.md` o `AGENTS.md` senza approvazione esplicita.
**Cosa manca:** testare il nuovo comportamento in una sessione reale di esplorazione/bugfix in cui emerga un pattern che contraddice una decisione precedente.

---

## R-022 — Eseguire il bugfix in locale sul bug reale ERR-019/ERR-027 (config-first POI quest)

**Richiesta:** *"eseguiamo in locale, meglio cambiare finestra di contesto però. prepara tutto e dimmi come lo lancio un'altra discussione"*
**Data:** 2026-08-15
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** eseguiti TP1–TP5: `questTimeScale` e `questSkillCheckConfig` aggiunti a `IdleVillageConfig`, la pagina `/poi-quest-detail-roster-time-clock` legge tutto da `useIdleVillageConfig().config`, `QuestChronicle` deriva palette e rischi dalla skin config e da `phase.riskProfile`, `MilestoneCheckModal` riceve `criticalFailChance` dalla config, `questDetailKit` legge risorse dalla config attiva. `build:check`, `kanban:lint`, `npm run test -- idleVillage` e Playwright `poiQuestDetailRosterTimeClock.spec.ts` (17 passed, 1 skipped) verdi.
**Cosa manca:** nessuna azione rimanente; seguire il workflow Mind Weaver per apprendimento e chiusura registry.


---

## R-022 — Scolpire materialmente il marker POI runico

**Richiesta:** *"The user wants to make the POI marker in src/ui/idleVillage/components/poi/PoiMarkerRunicV1.tsx look materially heavy and sculpted, like the golden-shield reference from Gemini."*
**Data:** 2026-08-14
**Stato:** `in corso`
**Desiderata FROZEN:** `.mw/desiderata.md` v4 — POI Quest System: pannelli flottanti e ritmo delle fasi.
**Vincoli:** SVG inline self-contained; nessun asset/font esterno; leggibile a ~32px; invariati hover-only, chase orario singolo e seal esterno da 100 glifi; niente selected state.
**Cosa è successo:** deliberazione multi-AI API reale eseguita con Groq e Cerebras, evidence in `.mw/runs/explore-poi-marker-sculpted-a/`. Il Director ha scelto l'approccio A: geometria SVG stratificata con pochi filtri compositing. Da produrre raccomandazione e piano, senza implementazione in questa richiesta.
**Cosa manca:** approvazione/esecuzione del piano di modifica del componente e verifica visuale/performance.

---

## R-023 — Implementare protocollo free da mockup AI a componente React + asset ad hoc

**Richiesta:** *"fai tutto tu"* — eseguire il protocollo scelto (C: Flux.1 dev / Stable Diffusion free) per generare mockup, valutarli, scomporli e produrre un componente React funzionante con asset corretti per RPG.
**Data:** 2026-08-14
**Stato:** `in corso`
**Desiderata FROZEN:** `.mw/desiderata.md` v5 — Mockup AI → componente React + asset ad hoc: protocollo generale.
**Cosa è successo:** installato venv `/Users/faustoboni/.venvs/rpg-assetgen` con Python 3.12, PyTorch MPS e diffusers; scaricato SDXL `stabilityai/stable-diffusion-xl-base-1.0`; creato `scripts/rpg-gen-mockup.py`; generati primi mockup di prova in `public/mockups/quest-card/` e `public/mockups/quest-card-empire/`; creato skill `.devin/skills/mockup-generator/SKILL.md` e workflow operativo `src/docs/docs/plans/ai_mockup_workflow.md`; aggiornati `context/INDEX.md`, `.gitignore` (`public/mockups/`) e `RICHIESTE.md`.

**Aggiornamento 2026-08-14 (delibera multi-AI su v1):**
- Scritto `plans/PLAN-MOCKUP-TO-COMPONENT-v1.md` e sottoposto a critica spietata con `mw-broadcast.py --web --providers chatgpt,claude` nel ruolo "lead senior system designer AAA", con ricerca online richiesta.
- **Esito: ChatGPT `success` (24.344 char), Claude `success` al retry (13.293 char, troncato a metà del suo piano).** Al primo giro Claude ha restituito 114 char ("Searching the web") — risposta non stabilizzata, stesso pattern già visto in R-003.
- **Verdetto convergente: v1 non è una pipeline, è "un handoff artistico informalizzato".** Entrambi chiedono un cambio di architettura, non una revisione minore.
- **6 critiche BLOCKING convergenti:** (1) il piano confonde mockup e asset di produzione — un raster SDXL non ha layer né bounding box semantici; (2) l'alpha è enunciato come problema e mai risolto (`sharp` converte formati, non rimuove sfondi); (3) il limite 77 token CLIP è osservato ma non corretto, quindi l'errore si riprodurrà a ogni esecuzione; (4) manca la gate di implementabilità tra scelta del Director e implementazione; (5) il workflow può partire senza aver prima cercato nei 24 frozen kit — violazione diretta dell'invariante di component reuse; (6) la coerenza di stile non è ottenibile da un prompt, serve un conditioning package versionato.
- **Critiche nuove rilevanti:** FLUX.1 **[dev]** è **non-commercial/non-production** (licenza 25 nov 2025), FLUX.1 **[schnell]** è Apache-2.0 — la licenza del modello deve entrare nell'artefatto di pipeline (tocca R-001); "dimensioni Tauri-friendly" è insufficiente, la performance gate deve essere runtime (decode, texture memory, DOM, compositing) non filesize; il "filtro tecnico" unico è teatro e va separato in **machine gates** vs **human art gate**.
- **Fatti tecnici dalla ricerca:** `rembg` 2.0.75 con alpha matting e modelli SAM; `LayerDiffuse` per alpha nativa su SDXL; **trucco white/black background con stesso seed** per recuperare soft-edge che i background-remover binari distruggono; `compel` e `lpw_stable_diffusion_xl` per superare i 77 token; **ConsisLoRA** addestra un LoRA di stile in ~12 min su 4090 (3-5× su MPS) con 20-50 immagini; **VTracer** (O(n), colore) vs **Potrace** (2 colori, SVG più pulito); GDC 2026: la generazione di asset è al **19%** fra gli studi che usano AI, il human paintover è stadio standard.
- Evidence: `.mw/runs/explore-mockup-to-component/` (BROADCAST.md, SYNTHESIS.md, PROMPT.md) e `.mw/runs/explore-mockup-to-component-claude/`.

**Aggiornamento 2026-08-14 (decisioni Director + v2 + cold read):**
- **Decisioni del Director ratificate:** (1) soglia comparabilità **12/14**; (2) whitelist licenze = SDXL 1.0 + FLUX.1 [schnell] ammessi, **FLUX.1 [dev] e tutte le varianti [dev] vietate**; (3) asset ownership **caso per caso**, dichiarato in fase contract; (4) art gate **non bloccante** — l'asset può andare in produzione, il Director rivede e chiede modifiche; (5) ROI = **regola categoriale**, con il vincolo esplicito *"vorrei tenere al minimo l'uso di asset, vorrei fosse il + css/react possibile"*; (6) **zero iterazioni di paintover** da parte del Director. Rotta 2 (rigenerazione condizionata da mockup esterno) approvata *"ma solo quando riesce"*.
- Richiesta esplicita del Director: **i mockup provenienti da fuori devono essere parte del piano** → aggiunto l'ingresso `F0-EXT` con triage A/B/C e tre rotte.
- Scritto `plans/PLAN-MOCKUP-TO-COMPONENT-v2.md` (12 fasi, 2 ingressi, 9 machine gate, whitelist licenze verificata, scala di fallback rotta 2, rubrica 12/14).
- **Cold read avversariale eseguito.** ChatGPT `success` (risposta completa); **Claude `failed` ×2** (`response did not stabilize`, prompt da 30k char) — stesso pattern di R-003.
- **Verdetto: NO, non eseguibile così com'è. 5 blocking.** Il colpo centrale: la v2 dichiarava che il principio CSS/React-first *dissolve per costruzione* tre critiche di v1; il cold read dimostra che **una si riduce (layer/stati), una si sposta (alpha), una si riduce solo statisticamente** — *"rischia di passare la delibera non perché abbia risolto v1, ma perché ha rinominato i failure mode"*.
- **Blocking:** (B1) 12/14 non è una metrica riproducibile — manca algoritmo, valutatore, tolleranze; (B2) *"rotta 1 legalmente sicura"* è una falsa garanzia giuridica (somiglianza sostanziale, trade dress) e la provenance del modello non copre reference/LoRA/adapter/ToS; (B3) il gate alpha G7 verifica solo che esista un pixel semitrasparente, non che l'alpha sia corretta; (B4) **F11 non ha budget: zero paintover + art gate non bloccante = rework potenzialmente infinito**, "macchina a ciclo aperto"; (B5) G9 non è un gate finché non ha numeri.
- **Mancanze gravi rilevate:** accessibilità assente del tutto; nessuno stress test i18n (grave con i18n obbligatoria); nessun golden visual test né regressione cross-component; nessuna decisione di abort del *componente*; nessun change flow dopo la review; provenance ferma al modello invece di coprire l'intera catena; **l'ipotesi centrale del piano non viene mai misurata**.
- **Correzione tecnica:** *"IP-Adapter a peso alto sovrascrive ControlNet"* è troppo forte — è un'euristica, non una legge. `rembg`/BiRefNet sono MIT come **codice**, i checkpoint hanno licenze proprie.
- Evidence: `.mw/runs/coldread-mockup-v2/SYNTHESIS.md`, `.mw/runs/coldread-mockup-v2-chatgpt/`, `.mw/runs/coldread-mockup-v2-claude{,-retry}/`.

**Aggiornamento 2026-08-14 (esempio esterno di mockup):**
- Spostati i file `goblin invasion mockup.png`, `goblin invasion mockup copy.png`, `Goblin march trasparente.png` e `Goblin march trasparente no freccia.png` dalla root del repo a `public/mockups/external/goblin-event-lab/`.
- Creato `public/mockups/external/goblin-event-lab/MOCKUP.md` con: elenco file, analisi visiva, note per la pipeline (testo baked, candidate classification), provenance da verificare, target component `GoblinEventLabPage` (`/goblin-event-lab`).
- **Nota:** il mockup contiene **testo baked** e dettagli dipinti. Non è un asset di produzione. Serve come caso pilota per il workflow mockup→componente.

**Aggiornamento 2026-08-14 (cold read v2 con Grok, Gemini, DeepSeek):**
- Claude non risponde più su prompt lunghi; richiesta del Director: provare Grok, Gemini, DeepSeek.
- **Grok** `success` tecnico ma output inutile — ha restituito frammenti del piano senza fare il cold read.
- **Gemini** `success` tecnico ma risposta inutile — ha chiesto di fornire "il documento" invece di leggere il `prompt-file`.
- **DeepSeek** `success` — risposta completa, aggressiva, con verifiche tecniche extra.
- **Nuove verifiche tecniche di DeepSeek:** `rembg` come **software** è MIT, ma i modelli scaricati (`bria-rmbg-1.4` e `RMBG v2.0`) sono **CC BY-NC 4.0 non-commerciali** — se finiscono in pipeline, G7 deve bloccarli; `LayerDiffuse` supporta **SD1.5 e SDXL** (non solo SDXL); IP-Adapter su MPS ha problemi noti (`bitsandbytes` non compatibile, `dtype shifting`); ordine di caricamento ControlNet → `load_ip_adapter()` è critico; FLUX.1 [dev] v2.0 (25 nov 2025) include esplicitamente anche Kontext, Krea, Redux, ecc.
- **3 nuovi blocking da DeepSeek:** (a) F5 non è enforceable — l'agente classificherà tutto `RGBA_TEXTURE` se non c'è un gate automatico che provi CSS/SVG prima; (b) Rotta 2 (IP-Adapter/img2img) **non è testata su MPS** e il piano la usa come percorso normale — rischio crash; (c) il loop Director-review in F11 **rompe la sincronia mockup/componente**, rendendo F8 insostenibile dopo iterazioni.
- **Nuove correzioni richieste da DeepSeek:** gate F5 automatico con distanza percettiva CSS vs raster; script di integrazione MPS per rotta 2; F8 non bloccante dopo la prima iterazione o meccanismo di aggiornamento mockup; `pixelmatch`/`SSIM` al posto di 12/14; fast path per componenti con <3 regioni e nessun assetSlot; criterio di scelta candidate; provenance dinamica con download `LICENSE.md`.

**Aggiornamento 2026-08-14 (decisioni Director per v3):**
- **(1) Budget di rework:** *"fino a quando non sono soddisfatto"* — nessun limite numerico predefinito. **Nota di rischio:** con zero paintover, questo può generare molte iterazioni CSS/React; il costo è mitigato dal fast path e dalla preferenza per i primitivi, ma non è azzerato. Se le iterazioni diventano eccessive, si attiva il fallback di semplificazione.
- **(2) Metrica 12/14:** **ibrida** — automatica per silhouette/layout/palette (pixelmatch/SSIM/distanza colore), umana del Director per materiale/identità visiva.
- **(3) Fast path:** **sì** — se il contract ha < 3 regioni semantiche e zero `assetSlot`, si salta mockup, style lock e visual match.
- **(4) Componente pilota:** **confermato** `GoblinEventLabPage` (`/goblin-event-lab`), con mockup esterno già collocato in `public/mockups/external/goblin-event-lab/`.

**Aggiornamento 2026-08-14 (v3 scritta):**
- Scritto `plans/PLAN-MOCKUP-TO-COMPONENT-v3.md` con: principio corretto ("riduce", non "dissolve"); metrica ibrida; fast path; governance ridotta; triage/rotte per mockup esterno; MPS test prerequisito per rotta 2; provenance dinamica; pilot su `GoblinEventLabPage`.
- `context/INDEX.md` aggiornato.

**Aggiornamento 2026-08-14 (cold read v3 con ChatGPT + DeepSeek, Claude failed):**
- **Verdetto: NO. v3 è ancora non eseguibile.** ChatGPT e DeepSeek concordano: *"buon documento di visione, non un workflow eseguibile"*, *"sostanzialmente over-engineered e under-specified"*.
- **Colpo centrale:** 11 fasi, molte soglie arbitrarie (`<3`, `60 token`, `3 immagini`, `4 candidate`, `3 tentativi`, `12/14`, ecc.), e 5 punti aperti che devono essere risolti *prima* del pilot rendono il piano un piano-per-preparare-il-piloto, non un workflow.
- **Critiche convergenti più gravi:**
  - Il pilot non può confermare la tesi principale perché manca una **baseline economica** (quanto tempo/costo per componente) e non misura il costo introdotto dalla pipeline stessa.
  - **Soglie aperte** (F5, G9, MPS, alpha, modello segmentazione) devono essere tarate prima di dichiarare il piano operativo.
  - **"Fino a soddisfazione" senza termination condition** = loop potenzialmente infinito.
  - **Provenance ≠ legal clearance** — hashare LICENSE non risolve il problema legale; rotta 2 su categoria B è rischiosa.
  - **Contraddizione con Mind Weaver / KISS/YAGNI:** v3 prescrive troppi "come l'AI deve ragionare" prima di averne evidenza dai fallimenti reali.
- **Raccomandazioni convergenti:** ridurre a 4-6 fasi, fondere F4+F5, risolvere le 5 cose aperte prima del pilot, definire metriche di successo del pilota (tempo, asset, iterazioni), aggiungere gate di uscita (max iterazioni), chiarire se ogni fase è manuale/automatica/semi-automatica.
- Evidence: `.mw/runs/critique-mockup-v3/critique-report.md` e `.mw/runs/critique-mockup-v3/synthesis.md`.

**Aggiornamento 2026-08-14 (chiusura sessione):**
- Sessione chiusa. Creato handoff `.mw/runs/handoff-mockup-to-component-20260814.md`.
- **Lezioni:** il workflow Mind Weaver è stato saltato (nessuna invocazione iniziale di `explorer`/`planner`); la desiderata v5 non è stata mantenuta come ancora durante le iterazioni; si sono prodotti piani v1/v2/v3 troppo grandi a priori invece di risolvere gli still unresolved uno per uno con evidenza.
- **Decisione:** non si procede con v4. Alla ripresa, si parte da zero con un piano minimo ancorato alla desiderata v5.

**Aggiornamento 2026-08-14 (desiderata v6 + paintover + IP-Adapter funzionante):**
- Il Director ha ridefinito la regola operativa: **paintover consentito**. Nuova desiderata FROZEN `.mw/desiderata.md` v6.
- Test IP-Adapter su MPS **riuscito** con `ip-adapter_sdxl.safetensors` + `laion/CLIP-ViT-H-14-laion2B-s32B-b79K` image encoder; `ip-adapter-plus_sdxl_vit-h` fallisce per mismatch 1664 vs 1280.
- Generato asset pilota con IP-Adapter: `public/mockups/goblin-totem-pilot/goblin-totem-ipadapter-20260816-20260814-225603.png` (composizione fedele al mockup esterno, testo cotto).
- Creato `GoblinEventModalV15` e integrato in `GoblinEventLabPage`; `npm run build:check` e lint passati.
- Pattern-candidate documentato in `.mw/runs/learn-mockup-to-component-20260814-224334/pattern-candidate.md`.

**Cosa manca per chiudere R-023:**
1. Art gate umano sull'asset IP-Adapter (o sua variante senza testo).
2. Eventuale paintover per pulire testo/sigilli e separare asset da componente.
3. Integrazione finale in `GoblinEventLabPage` con `npm run build:check` verde.
4. Aggiornare `ai_mockup_workflow.md` con i risultati evidenziati e la v6.

---

## R-024 — Bloccare generazione di mockup/asset senza workflow canonico

**Richiesta:** *"dobbiamo impedire che vengano create cose senza seguire il workflow corretto, prendere le specifiche, creare i prompt adeguatamente, ecc. Se i prompt non sono adeguati i mockup non sono adeguati, se non lo sono inutile farli diventare componenti. Questo è un problema più pressante."*
**Data:** 2026-08-15
**Stato:** `in corso`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 — Mockup → CSS/React + asset ad hoc: paintover consentito.
**Vincoli:** Non fermare il workflow, ma aggiungere un pre-flight gate che obblighi artefatti canonici prima della generazione. Non creare burocrazia, ma prevenire generazione con prompt generici.
**Cosa è successo:**
- Definito pre-flight gate minimo: `design-intent.md`, `identity.md`, `prompt.md` in `--spec-dir`.
- Implementato in `scripts/rpg-gen-mockup.py`: flag `--spec-dir` e `--enforce-canon`. Senza spec, esce con errore. Senza `--enforce-canon`, avvisa ma non blocca (legacy).
- Aggiornate `.devin/skills/mockup-generator/SKILL.md` e `src/docs/docs/plans/ai_mockup_workflow.md` con la sezione "Canon hard gate".
- Smoke test del gate: `--enforce-canon` senza `--spec-dir` esce; spec con file mancanti esce; build:check passa.
**Cosa manca:**
1. Creare template `templates/mockup-asset-spec/` (o `.mw/templates/`) per `design-intent.md`, `identity.md`, `prompt.md`.
2. Portare i pilot esistenti (goblin) a usare `--enforce-canon` con una spec canonica.
3. `npm run lint` su scope script e `kanban:lint`.

---

## R-025 — POI Family: contratto comune + specializzazioni per job/training/maintenance/cooldown/quest

**Richiesta:** *"dovremmo fare anche gli altri POI, che hanno logiche differenti. Distingui in una desiderata nuova, le cose specifiche della quest saranno in quella precedente. Meglio uno spec x tutte le cose che sn in comune, e poi le differenze in spec figlie. reward collection è per i POI nn continuativi. La pausa nn è automatica: quando il tempo nn scorre, anche se assegno tutti i pg e clicco Start/embark, nn 'parte davvero' a meno che il tempo nn scorra. HUD deve essere reso canonico, ma per testare attualmente va bene. Le quest con probabilità mortali hanno la meccanica TRIAL of fire. Slot devono avere modificatori per slot e slot addizionali opzionali che alterano % di morire."*
**Data:** 2026-08-15
**Stato:** `proposta`
**Desiderata FROZEN:** `.mw/desiderata.md` v4 — da congelare.
**Vincoli:**
- Non duplicare contratti: `poi_family_spec.md` root unica; figlie per differenze.
- Mappatura slot modifier: `ActivitySlotModifier` (multiplier per indice su fatigue/risk/yield) vs `residentRiskModifiers` (flat delta death/injury per blueprint).
- Pause non automatica all’apertura detail; `Embark` è un’intenzione valida solo finché lo stato assegnazioni non cambia.
- `dailyRewardProfile` e `resourceHud` da rendere canonici o collegati.
- `trialOfFire` va collegato al skill check delle quest fatali.
**Cosa manca:**
1. Avallo della desiderata v4 e congelamento in `.mw/desiderata.md`.
2. Scrittura di `poi_family_spec.md` e spec figlie con `learn`.
3. Verifica di `types.ts` / `defaultConfig.ts` per campi non documentati (`dailyRewardProfile`).

---

## R-026 — Documentazione AI-friendly + suite di test per l’integrazione di componenti in pagine

**Richiesta:** *"dobbiamo fare in modo che, quando io voglia mettere dei componenti in una pagina, i miei agenti sappiano come devono comportarsi senza farmi domande, senza che io debba fare sempre le stesse domande. Serve documentazione adeguata, AI friendly, e una suite di test ad hoc, linkata nella documentazione, per beccare eventuali regressioni."*
**Data:** 2026-08-15
**Stato:** `proposta`
**Desiderata FROZEN:** `.mw/desiderata.md` v7 — congelata.
**Vincoli:**
- Ogni pagina/componente integrato deve avere: contratto, spec di interazione, test di regressione linkati, e esempi minimi.
- I test devono essere facili da eseguire per un agente: comandi Playwright/RTL scolpiti, hook di test esposti, dati di test JSON-driven.
- La documentazione deve essere scritta per essere consumata da un LLM: sezioni esplicite, contratti Gherkin, esempi di input/output, e riferimenti incrociati.
- Il primo caso d’uso è la **POI family** (v4).
- Niente duplicazione: la spec root contiene il contratto, le figlie specializzano, i test puntano alle spec.
**Cosa manca:**
1. Avallo e congelamento di `.mw/desiderata.md` v5.
2. Definizione di un template/canvas per spec AI-friendly.
3. Creazione della suite di test per POI family come primo esempio.

---

## R-027 — Debug strutturato dell'artefatto quadrato nel Day/Night clock

**Richiesta:** *"Abbiamo bisogno di un modo strutturato per risolvere il problema del quadrato nel day/night clock. Cerca su git se nel passato era diverso o se c'è un commit che specifica questo problema risolto. Se non lo trovi, fai una pagina con solo il componente e separa ogni pezzo in modo che io possa dire in che layer è. Usa il protocollo multi-AI per il plan di bugfix."*
**Data:** 2026-08-15
**Stato:** `in corso`
**Desiderata FROZEN:** nessuna corrispondente; il bug è tracciato come `.mw/bugs/2026-08-15-clock-halo-binario`.
**Cosa è successo:**
- Ricerca git su `DayNightPoiSkin.tsx` e `TimeEngineStrip.tsx` non ha trovato commit specifici sul quadrato.
- Creato multi-AI plan con `mw-ask` (groq/llama-3.3-70b).
- Implementata pagina di debug `/day-night-poi-skin-debug` con toggle per ogni layer: dark base ring, bloom, outer guide, progress halo, decorative marks, core medallion, metal noise, core inner, core highlight, outer rim, day/night icon, frost overlay.
- `DayNightPoiSkin` esteso con prop `debug?: DayNightDebugLayers` senza modificare il rendering di default.
- `build:check` passa.
**Cosa manca:**
1. L'utente usa la pagina per identificare il layer incriminato.
2. Fix mirato sul layer identificato.
3. Verifica visuale e regression test.

---

## R-028 — Golden UI Foundation: eseguire Phase 1 Forensic UI/Art Audit

**Richiesta:** *"v2 APPROVATO come direzione. Esegui Phase 1 — Forensic UI/Art Audit sul repository e fai emergere i veri candidati Golden."*
**Data:** 2026-08-17
**Stato:** `in corso`
**Desiderata FROZEN:** `.mw/desiderata.md` v8 — Golden UI Foundation.
**Cosa è successo:** piano v2 approvato con 3 micro-correzioni (Golden 0 da audit, metrica Identity, Target Freeze su artefatti visivi); avviato CDP; deliberazione web non eseguibile per sessioni scadute; plan v2 integrato con critiche DeepSeek/Cerebras/ChatGPT e ricerca web; desiderata v8 FROZEN; prodotta `UI_AUDIT.md` preliminare basata su repo.
**Cosa manca:**
1. Completare valutazione Identity/Visual Quality con screenshot o Director review.
2. Eseguire Golden 0 forensics sui componenti confermati.
3. Produrre `GOLDEN_0_DNA.md`.

---

## R-029 — Hero components placeholder: test hub e sub-plan B–E

**Richiesta:** *"continua con il resto del plan"* in risposta al completamento del Sub-Plan A e della pagina `HeroComponentsLab`. Il Director conferma di voler procedere con C, D ed E "tutti insieme", con Sub-Plan B in modalità drag-and-drop e modificabile a piacere.
**Data:** 2026-08-18
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v10 — Hero Components placeholder.
**Cosa è successo:**
- Completato Sub-Plan B (`EquipSlotRack`, `useEquipment`, `ItemDragToken`) con drag-and-drop.
- Completati Sub-Plan C (`EquippableItemCard`), D (`ConsumablePile`), E (`SkillDeck` + `useSkillLoadout`).
- Aggiornata `HeroComponentsLabPage` con tutti i componenti A–E.
- Aggiunte prove di salvaguardia `build:check`, `lint`, `test`, `kanban:lint` e smoke test 200 OK.

---

## R-030 — Collegare i hero components placeholder alla logica di gioco

**Richiesta:** *"adesso dobbiamo collegare davvero quei componenti alla logica"*.
**Data:** 2026-08-18
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v10 — Hero Components placeholder.
**Cosa è successo:**
1. Creato `src/balancing/config/idleVillage/heroItems.ts` con Zod schemas e JSON (`equippableItems.json`, `consumables.json`, `skills.json`) — source of truth per item/consumabili/skill.
2. Creato `useResidentHeroState` che lega `ResidentState` a stato hero (equip, inventario, skill loadout) con persistenza `PersistenceService`.
3. `HeroComponentsLabPage` ora usa i dati JSON, `useResidentHeroState` e riflette le modifiche in `PgDetailCard`.
4. Lo `SkillDeck` persiste il loadout ma non tocca il skill check (R-030 escludeva il skill check).
5. Fix test `PgDetailCard` per compatibilità con `Materic*`/`WanderlustSurface`.
