# DOSSIER — Wanderlust: Triumph / RpgBalancer

> Ultimo consolidamento: 2026-10-28. Non è stato consultato direttamente il repository in questa operazione.

## 1. Identità e visione

- **FACT** — Repository: `Kurokasaiken/RpgBalancer`, indicato come progetto personale. README ricordato: `RPG Combat Simulator & Balancing Tool`.
- **FACT** — Nome/identità del gioco: `Wanderlust: Triumph`.
- **VERIFIED (2026-10-28)** — Eroe esiliato che giunge al villaggio (`GAMEPLAY_DESIGN.md` L80); `Solar Triumph` citato in `NARRATIVE.md` L21 (tono: no grim/mud).
- **DECISION** — Tono: meraviglia, scoperta e bellezza rude.
- **DECISION** — Tagline: `PREPARE · ENDURE · TRIUMPH`.
- **FACT** — L'idea è un roguelite strategico RPG incrementale sulla comunità/villaggio e sugli abitanti che diventano eroi.
- **VERIFIED (2026-10-28)** — Mondo persistente su più run, 5–10 run ~200 anni (`NARRATIVE.md` L308, L134). La parte “centinaia di ore” resta dichiarazione di intenti dei riepiloghi.
- **VERIFIED (2026-10-28)** — `Cultist Simulator` (halos, slot-verbi, skill check, estetica carte) e `Lords of Waterdeep` (gameplay loop) sono nei documenti canonici (`GAMEPLAY_DESIGN.md`, `DESIGN_PILLARS.md` Pillar 2).
- **UNVERIFIED** — They Are Billions, Frosthaven, XCOM, Darkest Dungeon e MTG “Value vs Response” non risultano nei documenti canonici consultati: restano riferimenti ricordati dai riepiloghi.
- **FACT** — Bozza di descrizione Steam ricordata: “A roguelite strategy RPG about the villagers who dare to become heroes...”.
- **FACT** — Pagina Steam “Coming Soon” prevista sotto Kurokasaiken, ma non c'è fretta di pubblicarla prima di avere teaser/video.

## 2. Personaggi e statistiche

- **CORRECTION (2026-10-28)** — Nel codice i canali stat implementati sono sei: `str, agi, con, int, perc, cha` (`src/balancing/config/idleVillage/quests/questScenario.schema.ts:33`, `questMemberStats.ts`). Il set canonico resta una questione aperta nel design (`GAMEPLAY_DESIGN.md` ~L224: full D&D o subset). La lista a cinque stats dei riepiloghi (Forza/Intelligenza/Destrezza/Costituzione/Carisma) è superata: non usarla come verità.
- **FACT** — Regola di distribuzione ricordata: eroe `+25/+10/+5`; non-eroe `+5` in una o due statistiche e `−10` nelle altre. **OPEN** — Il riepilogo non specifica integralmente a quali statistiche o contesti si applichi ogni valore; verificare nel codice/design.
- **CORRECTION (2026-10-28)** — `S1`–`S4` non sono slot: sono gli **stadi del macro-plan quest** (PLAN-019, desiderata v24; `context/GOOD_QUEST_DEFINITION.md`). Gli slot equipaggiamento reali sono `weapon, armor, mount, trinket` (`questItems.schema.ts:25`).
- **VERIFIED (2026-10-28)** — I giorni-uomo esistono nel Quest Simulation Preview (`QuestSimulationPreview.tsx`: tempo/giorni-uomo per outcome).
- **VERIFIED (2026-10-28)** — I consumabili sono reali (`consumables.json`, `heroItems.ts`; `deathChanceDelta`/`injuryChanceDelta`/`rewardMultiplierDelta`; pool party, decisione D3) e la ritirata è checkpoint continua/ritirati dopo ogni fase (D2). Nel preview di quest-total i consumabili sono però ignorati per scelta del Director (restano commitment per-check nel pre-check).
- **FACT** — Lo scout rivela statistiche secondarie.
- **PROPOSAL** — Considerare in futuro una struttura tattica a griglia, con riferimenti a Heroes/Final Fantasy; non è documentato come decisione implementativa.
- **FACT** — Il motore di combattimento precedente era ritenuto corretto e preciso e non doveva essere sostituito solo per inseguire una nuova architettura.
- **OPEN** — Mancano in questo contesto schema completo delle statistiche, formule, API, formato dei salvataggi e test del motore.

## 3. Combattimento e progressione

- **FACT** — Esisteva un auto-battler; il motore di combattimento preesistente era considerato adeguatamente corretto.
- **OPEN** — La varietà di incantesimi/abilità non è ancora stata completata; l'utente ha sottolineato la necessità di molte spell e opzioni per costruire personaggi differenti.
- **PROPOSAL** — Trattare l'equipaggiamento come “average gear” e mantenerne i contributi separati dalle statistiche di nascita del personaggio. Da verificare se sia stata congelata come decisione.
- **FACT** — Le ispirazioni Value vs Response indicano interesse per scelte tattiche in cui valore e risposta dell'avversario siano parte del bilanciamento; non implica da sola una meccanica precisa.
- **OPEN** — Non sono disponibili formule complete di danno, priorità, AI avversaria o sistema di status.

## 4. Quest e contenuti

- **VERIFIED (2026-10-28)** — `R-099` è la richiesta del *flavor layer* sulla quest goblin nel lab S1 (chiusa `fatta`). La fonte di verità della quest è la spec `src/docs/docs/idle_village/quest_sterminio_goblin_spec.md`; piani collegati: PLAN-022 (quest goblin), PLAN-023 (UI redesign S1 lab).
- **VERIFIED (2026-10-28)** — `resolveMissionRun` esiste: `src/engine/game/idleVillage/missionResolver.ts:221`. Gestisce outcome per membro (dead/injured), fasi sequenziali e **ritirata al checkpoint dopo ogni fase** (`shouldContinue`, decisione D2). Il requisito FOR/disponibilità/addestramento deriva dalla spec MP-06; il dettaglio per-stat va verificato sulla spec, non dedotto.
- **OPEN** — Non sono disponibili il testo integrale della quest, il contratto di `resolveMissionRun`, i criteri di successo/fallimento o i test.
- **FACT** — La conversazione del 2026-10-22 ha individuato un problema di design investigativo: le gimmick delle scene d'indagine erano considerate promettenti, ma mancava una meccanica chiara per raccogliere informazioni e investigare oltre la singola scena.
- **OPEN** — Il modello completo di raccolta indizi, inferenze, registrazione e verifica delle informazioni non è presente nel riepilogo.

## 5. Stato di sviluppo ricordato

- **FACT** — Intorno al 2026-10-22 era stata fatta una prima prova di una quest con un amico; erano emersi problemi di UI e integrazione.
- **FACT** — L'utente riferiva circa sette agenti AI in esecuzione e desiderava un dispatcher/coda, concorrenza dinamica e audit notturno con screenshot e auto-spegnimento.
- **DECISION** — Valutare il comportamento reale del repository, non fidarsi di piani o dichiarazioni dell'agente senza verifica.
- **OPEN** — Non è verificato se dispatcher, audit, UI, bug o feature siano stati implementati dopo il 2026-10-22.

## 6. Creature, mappe e direzione artistica

- **FACT** — Pipeline 2.5D descritta: un'immagine panoramica 21:9, circa 3168×1320, con forte impasto/pittura a olio, senza persone né testo; Depth Anything V2 per generare parallax.
- **FACT** — Direzione creature: combinazioni di tratti riconoscibili ma poco usati, originalità desiderata 4/5.
- **FACT** — Esempi: gorgone + leone (capelli/criniera come tratto condiviso); drago + ali di libellula.
- **FACT** — Un concept recente prevedeva una creatura anfibia/rettiliana con ispirazione nudibranco, gambe lunghe circa 2,5 volte il torso, braccia lunghe e mani snelle con poche dita.
- **REJECTED** — Evitare che il risultato sembri un goblin o una semplice ondata di zombie.
- **OPEN** — Le immagini discusse nelle chat non sono incluse in questo dossier; senza allegati non si possono ricostruire esattamente composizione, palette o silhouette.

## 7. Decisioni, alternative e cautele

- **DECISION** — Conservare il motore di combattimento esistente come baseline valida, salvo evidenze concrete che ne richiedano la sostituzione.
- **DECISION** — Non pubblicare frettolosamente la pagina Steam prima di avere materiali teaser/video adeguati.
- **REJECTED** — Non inventare feature del gioco o trasformare ispirazioni in meccaniche già implementate.
- **PROPOSAL** — Tenere separati, nella documentazione, fatti del repository, intenzioni di design e idee future.
- **OPEN** — Verificare nel repository il README, il codice corrente, le decisioni congelate e la corrispondenza fra documenti e implementazione.

## 8. Documenti da allegare in una nuova sessione

- Base: `PROFILO.md` + `PROGETTI.md` + questo dossier.
- Se si lavora sulla direzione artistica: aggiungere `DOSSIER_ARTE_CREATURE_MAPPE.md` e le immagini di riferimento correnti.
- Se si lavora su quest/indagini: aggiungere `DOSSIER_QUEST_E_INDAGINI.md` e i file canonici del repository.
- Se si lavora sulla musica: aggiungere `DOSSIER_MUSICA.md`.

## 9. Stato verificato nel repository (2026-10-28)

Verifica eseguita su checkout reale; i riferimenti puntano ai file.

- **VERIFIED** — Mission planner reattivo esiste: `useQuestAssignmentPreview.ts` (preview deterministica rng-free, delta live), desiderata FROZEN v23; decisioni Director D1–D4 chiuse (cover, checkpoint ritirata, consumabili party, stat tags).
- **VERIFIED** — Quest Simulation Preview implementata nel lab S1: `questS1Lab/questSimulation.ts` (`analyzeCheck` analitico + `simulateQuest` Monte Carlo seeded FNV-1a), `QuestSimulationPreview.tsx`, `QuestCheckPreview.tsx` con counterfactual consumabili e giorni-uomo.
- **VERIFIED** — Quest goblin giocabile nel lab: `questScenarioGoblin.ts`, flavor layer completo (transit + verdictFlavor, pacing da config).
- **VERIFIED** — Combat/balancing: `src/balancing/1v1/simulator.ts`, `matrixRunner.ts`, `EHPCalculator.ts`; motore quest `src/engine/game/idleVillage/` (missionResolver, QuestPowerEngine).
- **VERIFIED** — Superficie di gioco canonica: `/game` (Game Frame Pixi); `/world-surface` mappa viva; governance in `AGENTS.md`, `CANON.md`, `RICHIESTE.md`, `.windsurf/rules/`.
- **UNVERIFIED** — Regola di distribuzione eroe `+25/+10/+5`: non trovata nei documenti/codice consultati (resta da riepiloghi).
- **UNVERIFIED** — Tagline `PREPARE · ENDURE · TRIUMPH`: non trovata nei documenti canonici.
- **UNVERIFIED** — “Scout rivela statistiche secondarie”: non verificato.
- **OPEN** — L'indice `context/OPEN.md` e gli ingest `context/ingestions/` contengono meccaniche discusse (Exposure Targeting E-06, profili letalità E-08) che possono essere evolute: lo stato va riletto sul repository.
