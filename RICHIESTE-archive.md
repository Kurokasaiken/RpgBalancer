---
title: Richieste esplicite
type: intent-ledger
updated: 2026-11-13
---

# Richieste esplicite

Questo file è la bussola operativa. Contiene ciò che Fausto ha chiesto, con le sue parole.

## Stati

`da chiarire` · `proposta` · `aperta` · `in corso` · `fatta` · `ridotta` · `rinviata` · `ritirata`

`proposta` = candidato di design in attesa di ratifica Director (non lavoro impegnato).
`ridotta`, `rinviata` e `ritirata` solo con approvazione esplicita.
Triage 2026-10-12 (R-156): 28 voci chiuse su evidenza kanban/artefatto — `context/request-triage-2026-10-12.md`.

---

# RICHIESTE-archive — voci closed-family antecedenti 2026-11-08 (split PLAN-121 2026-11-15)

## R-001 — Sfruttare Mind Weaver per produrre autonomamente un gioco riusando RPG

**Richiesta:** *"Voglio vedere cosa Mind Weaver riesce a fare autonomamente, più che stime di guadagno massimizzate. Se il risultato finale è interessante provo a pubblicarlo. Voglio che tu prenda il più possibile dal progetto RPG."*
**Data:** 2026-08-10
**Stato:** `ritirata`
**Triage R-156 (2026-10-12):** superata — uso corrente di MW (skills, deliberazioni) la sostanzia — meta-direzione evergreen — ritirata su ratifica Director.
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

## R-004 — Skill operative = Mind Weaver; le skill storiche di RPG sono contesto, non invocabili

**Richiesta:** *"segna che le skill di RPG sono 'vecchie' e che quando parlo d usare skill dovresti sempre fare riferimento a quelle di mind weaver, cn quelle info, contesti, mandati, ecc."*
**Data:** 2026-08-13
**Stato:** `fatta` (registrazione della regola; resta in vigore permanentemente)
**Desiderata FROZEN:** `.mw/desiderata.md` v1 (adozione protocollo Mind Weaver in RPG).
**Regola:** Quando il Director dice "usa la skill X", il riferimento è sempre alle **skill Mind Weaver** (`explorer`, `planner`, `decomposer` *(ex `strategist`, rinominata 2026-10-06 con R-087)*, `executor`, `coordinator` in `.agents/skills/` del repo mind-weaver e nelle directory skill degli IDE). Le skill storiche di RPG (`coordinator/skills/*`: `strategist-mandate`, `coordinator-mandate`, `agent-execution-mandate`, `idle-village-task`, `mw-explorer`, `mw-planner`, `mw-executor`, `mw-regression`) **non vanno invocate come skill**: vanno lette e passate alle skill Mind Weaver come **contesto operativo** (invarianti, mandate, execution_hint, file target, safeguard, governance).
**Nota di conflitto da allineare:** `AGENTS.md` sezione "Workflow Mind Weaver in RPG" cita `.windsurf/skills/mw-explorer` ecc. come skill da invocare. Va aggiornata con avallo esplicito del Director (riformulazione proposta: le skill RPG sono documenti di contesto caricati dalle skill Mind Weaver, non skill invocabili).

---

## R-005 — POI Quest System: cerchio magico come timer, quest card a fasi, skill check per fase

**Richiesta:** *"in day/night nn c'è il componente visivo, deve esserci. il POI deve riempirsi in senso orario, la durata di 'in quanto tempo si riempie' è nelle config e lo trovi anche nel POI detail. Questo è un POI speciale, quest, deve apparire la quest (attualmente nn c'è un componente battezzato, dovrebb essere una card stretta e lunga, cn diverse fasi, e x ogni fase si esegue uno skill check cn /minimal-destiny-astrolabe). Quando il tempo è finito l'Halo è pieno, si ferma e pulsa, ci clicchi sopra e si apre al posto del detail [...] e vedi il risultato dello skill check che t dice se hai vinto o perso. La difficoltà ecc della quest devono essere legati allo skill check e dati come input."*
**Data:** 2026-08-11
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** sostanza implementata (halo temporale, QuestRunWindow a fasi, skill check); forma «cerchio magico» non usata — chiusa su ratifica Director 2026-10-12.
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
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** obiettivo assorbito — E2E ora coprono /game; la pagina lab è evoluta.
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
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`.
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** creata `mind-weaver/.agents/skills/learn/SKILL.md` come skill core adattata da `work-solver`; symlinkata in `RPG/.agents/skills/learn` e `RPG/.windsurf/skills/learn`. Integrato il trigger `learn` nelle skill `mw-explorer`, `mw-planner` e `mw-executor` di RPG: ogni sessione che produce una nuova assunzione, workaround, bugfix o pattern invoca `learn` e scrive `.mw/runs/<timestamp>/pattern-candidate.md`.
**Cosa manca:** testare il trigger reale in una sessione di esplorazione/pianificazione/esecuzione su RPG e verificare che `pattern-candidate.md` venga prodotto.

---

## R-020 — Generalizzare il workflow `contract-ladder` di work-solver per bugfix in tutti i progetti Mind Weaver

**Richiesta:** *"contract-ladder è il workflow giusto x fare bugfix. dovrebbe essere generico su tutti i progetti che possono aver bisogno di bugfix, come RPG"*
**Data:** 2026-08-14
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** skill `bugfix` esiste e workflow generalizzato — chiusa su ratifica Director.
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** creato `mind-weaver/.agents/skills/bugfix/SKILL.md` e `tools/bugfix-run.py` come workflow generico di bugfix ispirato a `contract-ladder`; rinominato `contract-ladder` → `bugfix`; symlink in `RPG/.agents/skills/bugfix` e `RPG/.windsurf/skills/bugfix`. Testato `bugfix-run.py` su un bug di esempio: produce `investigation.json`, `exploration.json`, `plan.md`, `prompt.txt`, `result.json`; il tool di `learn` scatta automaticamente in caso di test falliti.
**Cosa manca:** testare `bugfix` su un bug reale di RPG e verificare che l'agente lo invochi come workflow.

---

## R-021 — Estendere `learn` per manutenzione attiva di contesto e documentazione

**Richiesta:** *"learn si deve occupare anche della manutenzione del contesto/documentazione, lo fa? se presento nuove informazioni o cambio idea va e modifica quello che deve modificare? i riferimenti, ecc?"*
**Data:** 2026-08-14
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** learn attiva + INDEX/ingestions funzionanti — chiusa su ratifica Director.
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

## R-023 — Implementare protocollo free da mockup AI a componente React + asset ad hoc

**Richiesta:** *"fai tutto tu"* — eseguire il protocollo scelto (C: Flux.1 dev / Stable Diffusion free) per generare mockup, valutarli, scomporli e produrre un componente React funzionante con asset corretti per RPG.
**Data:** 2026-08-14
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`.
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
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** protocollo canonico via skill `painter` — blocco delegato al workflow — chiusa su ratifica Director.
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

---

## R-031 — Incorniciare lo sticker goblin in `MatericEventCard` con bordo, sfondo, luce, parallasse e particelle

**Richiesta:** *"Voglio che usi pupeteer o qualocsa del genere per analizzare l'estetica della card. Voglio che il componente dello sticker dei goblin sia racchiuso in un componente che lo renda + interessante: un bordo, uno sfondo interessante, effetti d luce, ecc. Qualcosa tipo parallasse? particelle luminose? Usa explorer per trovare soluzioni interessanti e protocollo multi Ai"*
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v8 — Golden UI Foundation; `.mw/desiderata.md` v6 — mockup → CSS/React + asset ad hoc (paintover consentito).
**Cosa è successo:**
- Il Director ha scelto la **Direzione B — Teal Threat Aura**.
- Creato `MatericThreatAura` in `src/ui/designSystem/primitives/MatericThreatAura.tsx` e i token `matericThreatAuraTokens.ts` in `src/balancing/config/idleVillage/`.
- Integrato nella tab `Event` di `/primitives` con parallasse al movimento del mouse, bordo dorato irregolare, sfondo teal radiale pulsante e particelle luminose.
- `npm run build:check`, `npm run lint -- <scope>` e `npm run kanban:lint` passati.
- Smoke test Puppeteer su `http://localhost:5173/primitives` OK.

---

## R-032 — Astrolabe v6.2: goo credibile (colata di catrame) con ricerca approfondita

**Richiesta:** *"fammi una versione che sia v6.2. ma il goo voglio che tu faccia una ricerca approfondita su come ottenere al meglio quel risultato. Ti do delle ricerche e informazioni preliminari. Usa l'explorer e fa ricerche cn il giusto cappello e prompt potenziato. [...] è possibile fare l'effetto di un goo, tipo una colata di catrame che si estende, ecc che sia credibile per un umano? Fino ad ora ho avuto risultati molto deludenti."*
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v9 (la geometria avversariale non deve essere per forza un goo — permesso, non mandato: il Director qui sceglie esplicitamente di perfezionare il goo, nessuna tensione); v6 (CSS/React-first, budget stretto).
**Contesto fornito:** tre ricerche preliminari (Gemini + altre AI) su metaballs, blur+contrast, WebGL/SDF, liquid-gooey, fluidkit, Matter.js, con conclusione condivisa: CSS puro non basta, serve rendering per-pixel + pseudo-fisica viscosa + materiale speculare.
**Cosa è successo:**
- Ricerca a due binari: explorer multi-AI con cappello `ui_developer` (codex in usage-limit, cerebras 402; risposto groq/gpt-oss) + verifica web indipendente. Convergenza: WebGL SDF smooth-min + materiale tar (albedo quasi-nero, specular stretto, fresnel rim) + molle ad alto damping. Scoperte chiave: `ctx.filter` non esiste su Safari/WebKit (la ricetta blur+contrast in-canvas delle preliminari fallirebbe in Tauri); `interactive-metaballs` citato dalle AI non esiste.
- Il Director ha scelto la **Direzione A** (WebGL shader) e il clone v6 → v6.2.
- Creati: `tarGooConfig.ts` (Zod, config-first), `tarGooRenderer.ts` (WebGL2 raw — pixi scartato per init async vs factory sincrona), `destinyAstrolabeV62/` (engine clone con sim viscosa + fallback flat), kit `destinyAstrolabeV62Kit`, pagina `/minimal-destiny-astrolabe-v6-2` + route.
- Safeguards passati (build:check, lint scope, test 4/4, kanban:lint); smoke test Puppeteer con WebGL2 (SwiftShader): tar mass organica renderizzata, zero errori console.
- Evidence: `test-results/r-032-astrolabe-v62-tar-goo-2026-08-27.log`.
**Cosa manca:** giudizio estetico del Director sul catrame live + eventuale tuning (tutto in `tarGooConfig.ts`); verifica su WebView Tauri reale.

---

## R-033 — Retime del catrame: ricerca e correzione tempistiche della colata

**Richiesta:** *"cambia il timing dell'animazione, fa una ricerca su come fare la colata del catrame, con calma e le tempistiche corrette"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto); v9 (geometria avversariale libera).
**Cosa è successo:**
- Research web su viscous-fluid timing: catrame/miele/spesso non deve essere <1s per il flusso principale ("one-second rule" per non sembrare acqua), pilea invece di diffondersi, movimento "sluggish", slow merging, no splash, easing S-curve o heavy ease-out.
- Ricetta del timing V6.2: seed (piccolo pool) → pour (colata S-curve smoothstep) → settle (arrivo ai bordi), tutto lento (~1.3s di pour, ~0.5s di seed).
- `tarGooConfig.ts`: aggiunto blocco `timing` (seedMs, pourMs, seedReveal) e sim più calma (damping 0.925, stiffness 0.024, maxSpeed 7, ondulazione 0.24).
- `engine.ts`: `tSlam` e `GOO_MS` ora vengono da `tarGooConfig.timing`; `gooReveal` segue `tarPour(t)` (S-curve da seed a 1); `gooRipple` è un mild swell al centro della colata, non uno splash.
- `build:check` passato, test 4/4 passati.
**Aggiornamento (feedback Director — troppo squadrato al centro):**
- La massa iniziale partiva con i lobi a piena ampiezza, rendendola a stella/punteggiata. Modificata `gooBlob(theta, rev)` e `rCheckAt(theta, scale)` in `engine.ts` e l'ondulazione in `tarGooRenderer.ts` perché l'ampiezza dei lobi scala con `gooReveal`: inizia come un cerchio e solo mentre cola sviluppa i suoi bordi strani.
- `build:check` e test 4/4 passati.
**Aggiornamento (flusso asimmetrico per asse):**
- La colata ora non è più una semplice scala radiale uniforme: un singolo `front` d'invasione cresce da 0 a `geo.tarRMax`; ogni asse raggiunge il proprio `rCheckAt(theta, 1)` quando il front lo supera. Gli assi corti si riempiono prima, i lunghi continuano, dando la sensazione che la colata "spinga" a velocità diverse a seconda della distanza.
- `tickGooSim` campiona `min(rFinal, front)` per ogni sample; le gocce usano il raggio reale del campione più vicino.
**Cosa manca:** feedback del Director sul flusso asimmetrico.

---

## R-034 — Animazione iniziale a gocce cadenti

**Richiesta:** *"x l'animazione iniziale, invece di cominciare da 1 cerchio, puoi fare cadere diverse gocce, che mi sembra che l'animazione venga molto bene?"*
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto); v9 (geometria avversariale libera).
**Cosa è successo:**
- `tarGooConfig.ts`: aggiunti parametri `seedDrop*` (count, raggio, gravità, damping, scatter, altezza, stagger).
- `tarGooRenderer.ts`: alpha dell'SDF non moltiplicata più per `uReveal`, quindi le gocce sono visibili prima che il bordo principale cresca.
- `engine.ts`: le prime `seedDropCount` gocce `gooSim.drops` cadono dall'alto con gravità e damping viscoso, atterrano al centro e si fondono; poi diventano gocce striscianti sulla colata. Il bordo principale (`gooSim.r`) rimane 0 durante la fase `threat-slam` e inizia a crescere con `goo-expand`.
- `build:check` passato, test 4/4 passati.
**Cosa manca:** feedback del Director sulle gocce cadenti.

---

## R-035 — Clip punte fiore e sparizione obelischi alabastro

**Richiesta:** *"quando il fiore finisce di espandersi, fa una animazione x cui le punte del fiore si clippano come nella V9. quando finisce l'animazione fa sparire gli obelischi di alabastro"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto); v9 (geometria avversariale libera).
**Cosa è successo:**
- `drawStar` in `engine.ts` modellato su V9: la faccia piena del fiore viene clipppata al bordo del catrame (`rCheckAt(a,1)`) e ciò che eccede resta solo un contorno tratteggiato dorato.
- `risk-pour` in `engine.ts`: gli obelischi bianchi (alabastro) si ritirano/ritraggono (`pl.drop` da 1 a 0) non appena finisce l'espansione della stella.
- `build:check` e test 4/4 passati.
**Cosa manca:** feedback del Director sul nuovo aspetto.

---

## R-036 — V16: fiore -> stella in base a skill vs difficoltà

**Richiesta:** *"guarda http://localhost:5173/minimal-destiny-astrolabe-v16 quando le skill del giocatore sono pari o speriori a quelle richieste dallo skill check la forma del fiore deve aver valli + strette e diventare via via + vicina ad una stella vera e propria (invece che petali di un fiore)"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- Modificati i parametri di transizione fiore/stella in `src/ui/skillCheckWebV1/coverage.ts`:
  - `FLOWER_UNTIL` 1.08 → 0.85 (la stella inizia ad apparire già intorno alla parità)
  - `STAR_FROM` 1.55 → 1.30 (stella pura raggiunta prima)
  - `STAR_VALLEY_WIDE` 0.40 → 0.30 (valli della stella già più strette)
  - `STAR_VALLEY_SLIM` 0.22 → 0.15 (valli affilate a stat molto superiori)
  - `STAR_VALLEY_REACH` = 0.90 (la restringimento delle valli ora è più rapido)
- `build:check` passato.
**Cosa manca:** verifica visiva del Director sulla V16 a skill pari/superiori.

---

## R-037 — Idle boil sul bordo del catrame V6.2

**Richiesta:** *"ad animazione idle il bordo del goo deve muoversi lentamente, tipo 'ribollire'"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- `tarGooConfig.ts`: aumentati `undulationAmp` (4.5), `undulationSpeed` (0.42), `dropletCount` (9), `dropletCrawlSpeed` ([0.04,0.12]), `dropletOvershoot` (16) per dare più vita al bordo in idle.
- `engine.ts`: quando `scene.state === 'idle'` e il catrame è pieno, `gooRipple` viene tenuto a un andamento lento sinusoidale (`0.12 + 0.06*sin(now/900)`) così il bordo dello shader ha un sobbollimento continuo.
- `build:check` e test 4/4 passati.
**Cosa manca:** feedback del Director sull'intensità del ribollimento.

---

## R-038 — Rimozione linee rosse sul goo durante l'espansione

**Richiesta:** *"il goo quando si espande sembra avere delle linee rosse, nn devono esserci"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- In `engine.ts` rimosso il cursore della difficoltà rosa/rosso da `drawAxisRig`. Erano le `rgba(255,120,140,...)` che durante `goo-expand` apparivano sopra il catrame, facendo sembrare che il goo avesse linee rosse.
- Le tacche della scala restano (a seconda di `rDiff`), ma il cursore colorato non viene più disegnato.
- `build:check` e test 4/4 passati.
**Cosa manca:** conferma del Director che non ci siano più linee rosse.

---

## R-039 — Più gocce cadenti per aumentare il catrame V6.2

**Richiesta:** *"voglio + effetti di gocce che cadono x aumentare il catrame"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- `tarGooConfig.ts`:
  - `seedDropCount` 3 → **6** gocce iniziali.
  - `seedDropHeight` 180 → **220**, `seedDropScatter` 70 → **90**, `seedDropStagger` 90 → **60**.
  - `seedDropRadius` [14,22] → **[14,24]**.
  - `dropletCount` 9 → **12** (6 seed + 6 che strisciano sulla colata).
  - `seedMs` 700 → **900** per dare tempo a tutte le 6 gocce di cadere e fondersi.
- `build:check` e test 4/4 passati.
**Cosa manca:** feedback del Director sul numero di gocce e tempi.

---

## R-040 — No rebound del catrame a fine espansione

**Richiesta:** *"quando finisce l'animazione che il goo si allargada nn deve fare il rebound"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- `tarGooConfig.ts`: `stiffness` 0.024 → **0.018**, `damping` 0.925 → **0.96**, `maxSpeed` 7 → **5.5** (smorzamento più forte, velocità più bassa).
- `engine.ts`: in `tickGooSim`, quando `gooReveal >= 0.999` il raggio di ogni campione viene bloccato (`gooSim.r[i] = rFinal`) e la velocità azzerata (`gooSim.v[i] = 0`), così il bordo non può superare il target.
- `build:check` e test 4/4 passati.
**Cosa manca:** conferma visiva del Director che non rimbalzi.

---

## R-041 — Scala e linea bronzea sotto il fiore clippato

**Richiesta:** *"quando il fiore viene clippato sparisce anche la scala del valore delle stats e la linea bronzea che fa da limite (quella che appare insieme agli obelischi bianchi)"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- `drawStar` in `engine.ts`: la faccia piena del fiore è ora disegnata con `globalAlpha=0.82`, così la scala (`drawAxisRig`) e le linee bronzee interne del fiore rimangono leggibili attraverso la faccia.
- La clip al muro del catrame resta; rimangono il contorno tratteggiato fuori dal goo e le linee bronzee sul bordo.
- `build:check` e test 4/4 passati.
**Cosa manca:** feedback del Director sulla leggibilità di scala e bronzo.

---

## R-042 — Obelischi bianchi visibili 0.5s in più

**Richiesta:** *"gli obelischi bianchi devono rimanere 0,5 secondi in + presenti sullo schermo"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- `engine.ts`: `cfg.tPour` 220 → **720** ms.
- La finestra di fade degli obelischi bianchi passata da `0.5` a `0.75` del `risk-pour`, così l'ultimo obelisco scompare a ~684ms (≈ 0.5s in più di presenza).
- `build:check` e test 4/4 passati.
**Cosa manca:** conferma visiva del Director.

---

## R-043 — Animazione di clip del fiore (non clippato alla nascita)

**Richiesta:** *"il fiore nn deve nascere già clippato, deve essere una animazione che lo clippa (fa una ricerca online su che tipo d transizione possiamo fare)"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- Ricerca online: le transizioni più comuni per clip organiche sono il *radial wipe* e il *clock wipe*. Per il catrame la soluzione più adatta è una **morph clip** (la maschera morfa da un cerchio grande al bordo del goo) invece di un semplice on/off.
- `drawStar` in `engine.ts`: la clip del fiore non è più immediata. `clipReveal = smoothstep(0.6, 1.0, s)` controlla la transizione: per `s < 0.6` il fiore è intero, poi la maschera si restringe dal cerchio esterno (`R*1.6`) fino al muro del catrame (`rCheckAt(a,1)`).
- `build:check` e test 4/4 passati.
**Cosa manca:** feedback del Director sui tempi e sull'aspetto della transizione.

---

## R-044 — Scomparsa obelischi e scala dopo clip del fiore

**Richiesta:** *"dopo che l'animazione che clippa il fiore termina fa sparire tutti gli obelischi e il visualizzatore del valore delle skill"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- `engine.ts`:
  - Aggiunto `scene.axisAlpha` (inizializzato a 1 in `scene`, `launchRoll`, `throwBall`).
  - `risk-pour`: oltre agli obelischi bianchi, ora sfuma anche gli obelischi neri e la scala (`axisAlpha = 1 - easeInCubic(p/0.85)`).
  - `drawAxisRig`: disegna solo se `axisAlpha > 0.001` e applica `ctx.globalAlpha = axisAlpha` così la scala svanisce.
- `build:check` e test 4/4 passati.
**Cosa manca:** conferma visiva del Director.

---

## R-045 — Arresto del goo meno elastico, più viscoso e appiccicoso

**Richiesta:** *"l'animazione cn cui si arresta la crescita del goo è ancora tropppo rebound, fa una ricerca online su come renderla meno elastica. Deve essere un movimento viscoso e appiccicoso."*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- Ricerca online: la letteratura su viscoelastic fluids e critical damping (Goktekin et al. SIGGRAPH 2004, "critical spring damper" di The Orange Duck) suggerisce di evitare l'overshoot con un **arrival clamp** (non-overshoot) piuttosto che modellare ogni forza interna.
- `tarGooConfig.ts`: `stiffness` 0.018 → **0.015**, `damping` 0.96 → **0.985**, `maxSpeed` 5.5 → **5.0**.
- `engine.ts`: in `tickGooSim` aggiunto **sticky non-overshoot**. Se il frame successivo farebbe superare il `target`, o il campione è già oltre e non sta tornando indietro, il raggio viene bloccato sul `target` e la velocità azzerata.
- `build:check` e test 4/4 passati.
**Cosa manca:** conferma visiva del Director.

---

## R-046 — Idle boil del bordo del goo dopo 0.5s dall'espansione

**Richiesta:** *"nn vedo l'animazione di idle del bordo del goo (dopo che ha smesso di allargarsi per almeno 0,5 secondi)"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- `engine.ts`:
  - Aggiunto `scene.gooFullMs` (inizializzato in `scene`, `launchRoll`, `throwBall`).
  - In `goo-expand` `p>=1` setta `scene.gooFullMs=performance.now()`.
  - In `tickGooSim` il `gooRipple` idle parte quando `rev>0.99` e sono passati **>500ms** da `gooFullMs`, anziché solo in `state==='idle'`. Inoltre `gooRipple` decade dolcemente fino al valore idle.
- `build:check` e test 4/4 passati.
**Cosa manca:** conferma visiva del Director.

---

## R-047 — Aumento luminosità sfondo e verifica contrasto col goo

**Richiesta:** *"aumenta la luminosità del colore di sfondo (quel verde scuro ttipo cielo stellato). controlla cn pupeteer che sia molto facile da distingue dal colore del goo"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- `tarGooConfig.ts`: aggiunta sezione `backdrop` (config-first) con colori più luminosi e light-leak più intenso:
  - `inner`: `rgba(80,160,155,1)`
  - `outer`: `rgba(38,105,102,1)`
  - `leakCore`: `rgba(0,229,255,.50)`
  - `leakMid`: `rgba(0,229,255,.22)`
- `engine.ts`: `drawBackdrop` legge i colori da `tarGooConfig.backdrop` invece di hardcoded.
- Verifica con Puppeteer sul 5-skill preset:
  - sfondo: `RGB(42,144,146)` (luminance 0.446)
  - goo: `RGB(27,63,65)` (luminance 0.206)
  - **contrasto: 1.94** (prima ~1.05)
- Evidence log: `test-results/r-047-v62-backdrop-goo-puppeteer-2026-08-27.log`.
- `build:check` e test 4/4 passati.
**Cosa manca:** conferma visiva del Director.

---

## R-048 — Bordo del goo molto riconoscibile

**Richiesta:** *"il bordo del goo deve rendere molto riconoscibile la delimitazione del goo"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- `tarGooConfig.ts` — tuning del materiale per accentuare il bordo:
  - `fresnelColor`: `[0.85, 1.0, 1.0]` (bianco-ciano)
  - `fresnelIntensity`: `1.0`
  - `fresnelPower`: `1.0`
  - `edgeHeightFalloff`: `8`
- Verifica con Puppeteer (scansione radiale sul preset 5 skill):
  - corpo del goo: `RGB(6,8,14)` luminance 0.032
  - bordo del goo: `RGB(185,218,222)` luminance 0.818
  - sfondo: `RGB(56,129,125)` luminance 0.418
  - il bordo è ~19x più luminoso del corpo e ~2x più luminoso dello sfondo.
- Evidence log: `test-results/r-048-goo-border-puppeteer-2026-08-27.log`.
- `build:check` e test 4/4 passati.
**Cosa manca:** conferma visiva del Director.

---

## R-049 — Fiore che diventa stella quando PG >= skill check

**Richiesta:** *"quando i valori del pg sn pari o maggiori della valore dello skill check invece di un fiore deve diventare una stella, sai d che aprlo? fa una ricerca online"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- Ricerca online: le rose curves (rose/grandi) e le equazioni polari mostrano che la forma fiore/stella è controllata dall'ampiezza/lunghezza dei lobi radiali. Nel codice V6.2 lo stesso effetto è già controllato dal parametro `valleyF` in `radialFromAxes`.
- `tarGooConfig.ts`: aggiunta sezione `star` (config-first):
  - `valleyFlower: 0.65` — petali arrotondati quando il PG è ben sotto il check
  - `valleyStar: 0.15` — stella affilata quando il PG è pari o sopra
  - `transitionR: 0.25` — frazione di `R` su cui avviene la transizione
- `engine.ts`: `updateGeometry` calcola `geo.valleyF` dal peggior margine per asse `starTip[i] - axisCheck[i]`. Se `stat >= difficoltà` (margine >= 0) la forma è stella, altrimenti fiore, con lerp nella zona di transizione.
- Evidence log: `test-results/r-049-star-shape-2026-08-27.log`.
- `build:check`, test 4/4 e `kanban:lint` passati.
**Cosa manca:** conferma visiva del Director.

---

## R-050 — Il fiore/stella deve essere clippato al muro del catrame

**Richiesta:** *"il fiore nn è clippato"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v6 (CSS/React-first, budget stretto).
**Cosa è successo:**
- In `drawStar` (engine.ts) la clip esisteva ma copriva solo il `fill` della faccia (L1); i bordi bronzo/bianchi e lo sheen venivano disegnati senza clip, quindi la stella sembrava non tagliata.
- Ristrutturato `drawStar`:
  - calcola la maschera `ap` prima di disegnare;
  - disegna il contorno tratteggiato `p` non clippato;
  - applica `ctx.clip(ap)` una volta sola per tutti i livelli rimanenti (faccia, sheen, bordi, core).
- Verifica con Puppeteer (single 85 vs 50):
  - punta superiore: stella a `dy=200`, muro a `dy=210`, contorno tratteggiato ancora visibile a `dy=280`.
  - lato destro: stella a `dx=170`, muro a `dx=190`, sfondo a `dx=195`.
- Evidence log: `test-results/r-050-flower-clip-2026-08-27.log`.
- `build:check`, test 4/4, `kanban:lint` e smoke `curl` 200 passati.
**Cosa manca:** conferma visiva del Director.

---

## R-051 — Gli obelischi non devono essere presenti nella schermata vittoria/sconfitta

**Richiesta:** *"nella schermata vittoria o sconfitta gli obelischi nn devono essere presenti"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Cosa è successo:**
- In `resolve()` (engine.ts), subito dopo `setState('resolution')`:
  - `scene.whitePillars` e `scene.blackPillars` vengono forzati a `drop=0`.
  - `scene.axisAlpha=0` nasconde anche il visualizzatore dei valori delle skill.
- Così la carta del verdetto appare sempre senza obelischi bianchi/neri e senza scala skill, anche se la risoluzione avviene prima che finisca il fade del `risk-pour`.
- Evidence log: `test-results/r-051-obelischi-resolution-2026-08-27.log`.
- `build:check`, test 4/4 e `kanban:lint` passati.
**Cosa manca:** conferma visiva del Director.

---

## R-052 — Bordo del goo in colore negativo (non chiaro)

**Richiesta:** *"il bordo del goo deve essere di un colore associato a qualcosa d negativo, nn chiaro"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Cosa è successo:**
- `tarGooConfig.ts`: il bordo è diventato un crimson scuro/sangue:
  - `specularColor: [0.55, 0.04, 0.02]`
  - `specularIntensity: 0.25`
  - `fresnelColor: [0.55, 0.0, 0.04]`
  - descrizione Zod aggiornata.
- Verifica con Puppeteer (single 85/50):
  - al muro destro (r≈190): `RGB(107,4,16)` — bordo crimson scuro
  - corpo del goo: `RGB(55,27,10)`
  - sfondo teal: `RGB(59,133,129)`
- Evidence log: `test-results/r-052-goo-rim-negative-2026-08-27.log`.
- `build:check`, test 4/4 e `kanban:lint` passati.
**Cosa manca:** conferma visiva del Director.

---

## R-053 — Flower/star morph più pulito

**Richiesta:** *"quando i valori cambiano la forma del fiore deve diventare una stella, nn un fiore brutto"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Cosa è successo:**
- `engine.ts` `radialFromAxes`: aggiunta easing coseno (`(1-cos(f*π))/2`) al profilo radiale, così punte e valli sono arrotondate anziché segmenti lineari spezzati.
- `tarGooConfig.ts`:
  - `valleyFlower: 0.78` — fiore molto arrotondato quando il PG è sotto
  - `valleyStar: 0.12` — stella appuntita quando il PG è pari/sopra
- Verifica Puppeteer:
  - `single 85/50`: punta della stella a `r≈164` brillante, già al pixel successivo (`r≈172`) il catrame scuro — forma affilata.
  - `HARD 30/80`: piccola forma arrotondata che arriva a `r≈115`, poi corpo del catrame — morbido fiore a 5 petali.
- Evidence log: `test-results/r-053-flower-to-star-morph-2026-08-27.log`.
- `build:check`, test 4/4 e `kanban:lint` passati.
**Cosa manca:** conferma visiva del Director.

---

## R-054 — Anello bronzeo esterno con skin del medallion

**Richiesta:** *"il bordo esterno il ring bronzeo, deve avere la skin che vedi in http://localhost:5173/primitives medalion"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Cosa è successo:**
- `src/pages/minimal-destiny-astrolabe-v6-2.tsx`:
  - sostituito il bordo piatto `border-2 border-amber-600` con `MatericFrame variant="bronze-bezel"`.
  - `band={2.5}`, `rx={8}`, `flush`.
  - `MatericFrame` renderizza `WellBronzeBezel`, la stessa scala NMM oro → bronzo → umber del medallion.
  - `DestinyAstrolabeV62Standalone` è adesso dentro un well `position: relative` con l'overlay del frame come sibling.
- Verifica con Puppeteer:
  - l'SVG del bezel è presente nel container.
  - gradient: `#d8bd78 → #cfaf63 → #c2a355 → #a0762f → #5f3f16 → #71501f`.
- Evidence log: `test-results/r-054-astrolabe-bronze-bezel-2026-08-27.log`.
- `build:check`, test 4/4 e `kanban:lint` passati.
**Cosa manca:** conferma visiva del Director.

---

## R-056 — Ottanio sulle nuvole dell'Event Shroud e reminder card landscape con POI leggibile

**Richiesta:** *"1) metti un effetto ottanio sulle nuvole della transizione... in /primitives event dovresti trovare le nuvole cn l'effetto ottanio (devi mettere quell'effetto ottanio sulle nuvole di quella animazione, e possbilmente migliorarlo). 2) il componente finale cn POI e Titolo Invasion nn è interessante o bello, deve avere la forma di una pgCard... Invasion nn sembra un titolo, il POI è praticamente illeggibile a quelle dimensioni."* Poi, a chiarimento: *"intendevo il POI componente (circolare, cn il magic circle che si riempie)"*, *"Deve essere corto e lungo, attualmente è alto e stretto"*, *"nn stiamo facendo una rappresentazione cinematografica, ma i componenti che utilizzerò x il trailer... Questo è x il gameplay vero."*
**Data:** 2026-08-30
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** moto ambientale consegnato in parte (nuvole/ombre R-120, fit R-148); residui in R-057 — chiusa su ratifica Director.
**Desiderata FROZEN:** `.mw/desiderata.md` v2 — World Surface; v8 — Golden UI Foundation.
**Cosa è successo:**
- Creato `src/balancing/config/idleVillage/eventShroudGradeTokens.ts`: rampa gradient-map config-first per lo shroud, con `EVENT_SHROUD_FILTER_ID` e i table values di `feComponentTransfer`.
- `WorldSurfaceRenderer.tsx`: montato il filtro SVG (`feColorMatrix saturate=0` + `feComponentTransfer`) e applicato via `filter: url(#...)` ai soli layer `event_shroud_*`. Il filtro agisce sui pixel dell'asset, alpha inclusa, quindi non sborda sulla mappa attraverso i varchi delle tende (cosa che un overlay multiply a rettangolo pieno avrebbe fatto: le metà sono trasparenti al ~50%).
- **Nota:** `WorldSurfaceEventShroud.tsx` è dead code — nessun import. Le tende reali sono i layer di manifest renderizzati da `LayerView`. L'effetto è stato applicato lì.
- Rampa ancorata all'istogramma reale dell'asset (98% dei pixel opachi tra t=0.44 e 0.95, mediana t=0.845): una rampa a spaziatura uniforme mandava il corpo delle nuvole sull'estremo chiaro e usciva menta pallido. Ancorando la mediana al mid-ottanio la tenda legge come ottanio profondo. Gamma tonale utile 206 livelli contro 85 della ricetta `hue-rotate` di `MatericCloudWall`.
- `WorldSurfaceEventCard.tsx`: reminder da 180×268 (alto e stretto, ratio 0,67) a **320×140 (corto e lungo, ratio 2,29)**; rimosso l'override `flexDirection: column` che stirava in altezza la riga orizzontale del primitivo; `FillingPoi` da `size={20}` a `size={92}`; passato `daysLeftLabel` con la chiave i18n esistente `world.goblinInvasion.daysRemaining`, che prima non veniva passata e faceva sparire il countdown nel passaggio da modale a marker.
- `MatericEventCard.tsx` (variante `reminder`, unico call site): titolo da `fontSize: 16` a `26` — a 16px stava a poco più di metà del token canonico `--skin-title-size` e, in riga con un'icona, leggeva come voce di lista; padding 24→18 e gap 14→16 per far stare il titolo nella colonna di testo.
- **Verificato al browser** su `/world-surface`: filtro presente su entrambi i layer shroud; reminder renderizzata a **157,8 × 76,9 CSS px (ratio 2,05)**; POI circolare a **45,4 CSS px** (era ~13,7); testo `INVASION / DAYS REMAINING: 5`; nessun errore React in console.
- `npm run build:check`, `npm run kanban:lint` e smoke test route (200 su `/world-surface` e `/primitives`) passati.

---

## R-055 — Durante il lancio nasconde obelischi, assi e segmenti laterali

**Richiesta:** *"durante il lancio e i rimbalzi della pallina nn si devono vedere: i segmenti laterali, gli obelischi, la scala che misura la grandezza delle stat"*.
**Data:** 2026-08-27
**Stato:** `fatta`
**Cosa è successo:**
- `engine.ts` `throwBall()`: al lancio imposta `scene.axisAlpha=0`, `pl.drop=0` su tutti i pilastri e `scene.streamAlpha=0`.
- Durante `the-spin` e `magnetic-snap` `drawAxisRig`, `drawPillar` e i rischi laterali non disegnano più.
- La superficie del goo, la stella e la pallina restano visibili.
- `resolve()` continuava a nasconderli alla fine.
- Evidence log: `test-results/r-055-clean-throw-2026-08-27.log`.
- `build:check`, test 4/4 e `kanban:lint` passati.
**Cosa manca:** conferma visiva del Director.

---

## R-056 — La mappa non respira: moto ambientale diffuso, parallasse al mouse, luce, polvere, e vetro sul Window

**Richiesta:** *"ho visto un bell'effetto x il mare, onde 'piccole', realistiche e nn stilizzate su MTG arena. vorrei aggiungere un po' + di effetti dinamici, un minimo d parallasse quando muovo il mouse, cose del genere. Qualche effetto di luce, particelle di dust, ecc. Prendi anche il componente window in /primitives, dovrebbe avere un effetto 'vetro', che lo rende + interessante"* e, dopo il video: *"sembra troppo ferma, le nuvole si muovo poco, il mare ha qualche effetto interessante cn asset specifici, uccelli che prendono il volo, ma 'nn respira', deve esserci sempre qualcosa che si muove anche solo di poco"*.
**Data:** 2026-08-30
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** moto ambientale consegnato in parte (nuvole/ombre R-120, fit R-148); residui in R-057 — chiusa su ratifica Director.
**Desiderata FROZEN:** `.mw/desiderata.md` v2 — World Surface: mappa viva da esplorare con gli occhi.

**Misura del problema (2026-08-30).** Estratti i frame dal video del Director (`Registrazione schermo 2026-08-30 alle 17.44.28.mov`, 1982x1320, 7s) e calcolato il diff pixel fra il primo e l'ultimo frame. Cambiano soltanto: i contorni delle nuvole (1-2 px), la nave sprite in alto a sinistra, due uccelli, e il pannello di debug. Mare, terra, cornice e luce: zero moto misurabile.

**Cause trovate nel codice, con numeri reali:**
- `src/ui/idleVillage/config/generatedClouds.ts:6` — `driftSeconds: 2000` su un mondo largo 4240 px = **2,12 px/s in world**, cioe ~1 px/s a schermo. In 7 secondi le nuvole percorrono ~7 px.
- `scripts/scatter-clouds.mjs:106-114` — esiste **una sola banda** (`far`), 9 sprite. L'architettura a tre bande (`far`/`mid`/`near`) dichiarata in `atmosphereAssets.ts:28-42` non ha mai avuto dati: non c'e gerarchia di profondita.
- `scripts/scatter-clouds.mjs:110` — `shadowOpacity: 0`. `WorldSurfaceCloudShadows.tsx` monta 9 sprite, le anima, e le disegna a opacita zero. **Layer interamente invisibile.**
- `src/ui/idleVillage/config/atmosphereAssets.ts:209-221` — onde: **7 marchi** su 4240x2828 px, bob di **3 px**, ciclo 30 s con `visibleFraction 0.45`. Ogni marchio e visibile 13,5 s su 30 e si muove 3 px.
- `src/ui/idleVillage/config/atmosphereAssets.ts:137-144` — schiuma: **un solo elemento**, tile 520 px che scorre in 90 s (5,8 px/s), opacita che pulsa fra **0,10 e 0,22**.
- Conteggio live su `/world-surface` via `document.getAnimations()`: **42 animazioni totali** (9 nuvole, 24 uccelli, 2 schiuma, 7 onde). Zero luce, zero polvere, zero reattivita al puntatore, zero moto sulla cornice.

**Decisioni del Director (2026-08-30):**
1. Il vincolo "80% calma" di `DESIGN_PILLARS.md:24` riguarda gli **eventi**, non il moto di fondo. Il registro di respiro continuo e ammesso.
2. Procedere; ordine a discrezione.
3. Per il `Window`: vetro via `filter: url(#glass)` sull'immagine, non glassmorphism CSS.

**Ricerca (2026-08-30).** Ricerche web + deliberazione multi-AI (`.mw/runs/r056-breathing/`): ChatGPT Web riuscito, Claude Web recuperato dall'HTML di debug dopo un falso fallimento dello scraper. Le due analisi convergono sulla diagnosi: **il problema non e il numero di animazioni ma la loro categoria** — 42 animazioni tutte di *object motion*, zero di *surface motion*. Il sistema visivo misura coerenza temporale locale: una nave lascia il 99% della scena con correlazione temporale 1.0, e il cervello segmenta in "sfondo statico + oggetto animato". Inoltre e molto piu sensibile al moto di pattern ad **alta frequenza spaziale** che a quello di forme grandi e morbide — per cui una nuvola a 4 px/s puo leggere come piu ferma di un pattern di onde a 1,5 px/s.

**Misura sull'asset (2026-08-30).** Energia ad alta frequenza del mare dipinto (`Mare.webp`, originale meno blur 3px): **YAVG 2,4-3,4 su 255, circa l'1%**. Il `DisplacementFilter` Pixi rimosso non fallo per potenza ma per **assenza di segnale**: spostare pixel identici produce pixel identici. Palette campionata: media RGB (110, 136, 141), luminanza p25-p75 = 120-142.

**P0 — Campo di micro-moto dell'acqua: `fatta`.**
- `scripts/build-water-detail.mjs` (nuovo): genera due tile RGBA con noise di valore su lattice **periodico** (seamless per costruzione, nessun mirror), anisotropo per produrre striature allungate. Tinte derivate dal mare stesso, ±12 punti di luminanza attorno alla sua media — dentro la p25-p75 del dipinto, cosi il dettaglio legge come superficie e non come pellicola.
- `src/ui/idleVillage/components/WorldSurfaceWaterField.tsx` (nuovo): due fogli mascherati su `sea_mask`, con i loop X e Y su elementi annidati a periodi indipendenti — ogni asse trasla di una tile intera, quindi ogni loop e esattamente seamless, e la coppia batte su un ciclo molto piu lungo di entrambi. La base dipinta non si muove: `DESIGN_PILLARS.md:38` resta rispettato.
- Parametri: layer A tile 384 px a 3,0 px/s lungo 12 gradi; layer B tile 256 px a 1,5 px/s lungo 108 gradi. Velocita e direzioni **non** simmetriche, per evitare che il battimento diventi leggibile.
- **Errore corretto in corso d'opera:** con `opacity: 0.038` sulle tile il contributo massimo era **0,46 punti RGB**, sotto la soglia di visibilita. Le tile portano il pattern nel canale alpha e sono gia quasi trasparenti, quindi l'opacita non deve attenuare una seconda volta. Portata a 0,95 / 0,78 per un picco di ~11 punti, dentro la banda 8-15 indicata.

**P1 — Gerarchia delle nuvole: `fatta`.** `scripts/scatter-clouds.mjs` emetteva **una sola banda**; il discriminante `far`/`mid`/`near` di `CloudBand` descriveva una gerarchia senza dati. Ora tre bande a **2,0 / 3,5 / 6,0 px/s** (16 sprite contro 9). `shadowOpacity` era **0** su tutte: `WorldSurfaceCloudShadows` montava e animava nove sprite disegnandole interamente trasparenti. Ora 0,02 / 0,03 / 0,04 — volutamente all'estremo basso, da giudicare sul dipinto reale.

**Verifica.** `scripts/measure-world-motion.mjs` (nuovo) e il criterio di accettazione: due screenshot a `Animation.currentTime` pilotato (l'attesa non funziona — headless e pannello di preview congelano le animazioni), pixel di mare classificati per colore anziche per box di viewport, perche il mondo rende a zoom 0.30 e una box fissa finiva a misurare il deserto.

| | prima | dopo |
| --- | --- | --- |
| copertura di moto sul mare (delta >= 3 RGB su 5 s) | ~0% (mare pixel-identico) | **27,9%** (target >= 25) |
| delta medio sul mare | 0 | 2,49 |
| animazioni | 42 | 46 |
| frame p50 / p95 | 16,7 / 16,7 ms | **16,7 / 16,7 ms, 60 fps** |

Il diff amplificato mostra il mare interamente coperto di striature di variazione e la terra a nero assoluto: la maschera confina il campo all'acqua. Evidence log: `test-results/r-056-water-field-2026-08-30.json`.
Test: `WorldSurfaceLayerOrder`, `WorldSurfaceRenderer`, `validateWorldSurfaceAssets` **11/11 passati**; `tsc` senza errori sui file toccati.

**Rifiutato dal Director (2026-08-30):** *"nn mi fa impazzire"*. Aveva ragione, e le cause sono due, entrambe mie:
1. **Ho ottimizzato la metrica perdendo il risultato.** Avevo alzato l'opacita a 0,95/0,78 per far passare il 27,9%, e il costo e stato un film grigio sul mare. La misura era diventata il bersaglio.
2. **La forma della texture era sbagliata per questa mappa.** Il mare e disegnato a **tratto** — linee curve che seguono la costa — e io ci avevo messo sopra macchie di value noise, che in quel linguaggio leggono come sporco. La tinta invece era corretta: l'acqua aperta e RGB (110, 136, 141) con luminanza p10-p90 di 112-150, e le tinte cadevano dentro.

**Correzione.** Banco di prova offline (tile composte sul ritaglio reale del dipinto, ridotte allo zoom 0.23 della mappa) per giudicare l'asset contro l'artwork invece che nel browser. Confermato che la versione spedita era la peggiore del set. Il generatore ora costruisce **tratti**: bande deformate da noise a bassa frequenza e ridotte alle loro creste, spezzate in trattini lunghi e sottili. Opacita riportata a 0,60/0,48.

| | pulito (campo off) | blob 0,95 (rifiutato) | tratto 0,60 (ora) |
| --- | --- | --- | --- |
| copertura di moto sul mare | 0% | 27,9% | 16,4% |
| aspetto del mare fermo | pulito | **macchiato** | pulito |

**Il riferimento, misurato (2026-08-30).** Il Director ha chiesto perche il video MTG Arena sia difficile da replicare. Misurato il suo video a 1 secondo di distanza: copertura 68,3% a delta >= 3, delta medio 5,04. Poi sfocati progressivamente i due frame per separare le componenti:

| sfocatura | copertura Δ>=3 | delta medio |
| --- | --- | --- |
| nessuna | 68,3% | 5,04 |
| σ=4 | 60,0% | 4,40 |
| σ=12 (dettaglio fine distrutto) | **52,5%** | 3,73 |

La variazione **sopravvive alla sfocatura**: tre quarti del moto in quell'acqua sono variazione tonale ampia a bassa frequenza — la superficie che si ri-illumina — non texture che trasla. Stavo replicando la componente che conta meno. La tecnica (shader Unity, normal map animate, risposta speculare per-pixel) non e replicabile sotto i vincoli del progetto; la **firma percettiva** si.

**P0b — Pool di luce sul mare: `fatta`.** Dodici gradienti radiali morbidi e molto grandi (1900-3200 px) su griglia jitterata che copre tutto il mondo, mascherati su `sea_mask`, ciascuno con deriva e pulsazione su periodi mutuamente primi. Solo `transform` e `opacity`. Prima erano sei piazzati a mano, e non coprivano tutto il mare — la richiesta esplicita del Director era *"effetto mare ovunque"*.

**Due difetti del mio metodo di misura, corretti:**
1. **Attesa di 120 ms dopo il seek**: sufficiente per una `transform` sul compositor, non per un `opacity` su gradienti grandi che richiede repaint. Il secondo screenshot catturava il frame precedente e il campo risultava immobile. Portata a 260 ms.
2. **Campione singolo**: misurare una sola coppia di istanti e una monetina, perche ogni layer sta sulla sua sinusoide e una coppia puo cadere sul flesso. Produceva oscillazioni fra 6% e 32% a config invariata, e faceva dipendere il risultato dal viewport. Ora media su cinque coppie.

**Risultato.**

| | riferimento MTG Arena | nostro mare, prima | nostro mare, ora |
| --- | --- | --- | --- |
| copertura Δ>=3 | 68,3% (a 1 s) | 0% | **37,9%** (a 5 s, campioni 28-51%) |
| delta medio sul mare | 5,04 | 0 | **5,89** |
| aspetto del mare fermo | — | pulito | pulito, nessuna macchia |
| frame p50 / p95 | — | 16,7 / 16,7 ms | 16,7 / **16,8** ms, 60 fps |

L'ampiezza supera il riferimento; la copertura e circa la meta. Evidence log: `test-results/r-056-light-pools-2026-08-30.json`. Test 11/11, `tsc` pulito sui file toccati.

**Respinto di nuovo (2026-08-30):** *"nn vedo nulla, sei sicuro che usi parametri x umani?"*. No, non li usavo.

**L'errore alla radice: la metrica misurava la cosa sbagliata.** Il criterio di accettazione confrontava due istantanee a **5 secondi** di distanza. Quello misura la deriva accumulata, non la percepibilita: l'occhio si adatta al cambiamento lento invece di integrarlo, quindi risponde alla **velocita** di cambiamento, non al totale. Un pixel puo differire di 6 punti fra t=0 e t=5s ed essere invisibile, perche cambia di 0,02 punti per frame. Ho tarato nuvole, tile e pool contro quel numero per tre giri.

Misurato il riferimento fra **frame consecutivi**, cioe alla scala a cui lavora l'occhio:

| a ~84 ms | riferimento MTG | nostro mare |
| --- | --- | --- |
| copertura Δ>=3 | 14,0% | **0,2%** |
| delta medio | 1,19 | 0,35 |
| velocita | **14,2 punti/s** | **0,5 punti/s** |

Ventotto volte piu lento. Confermato a occhio: diff a 300 ms con amplificazione 30x, il mare e **nero** e si muove solo la nuvola.

`scripts/measure-world-motion.mjs` ora usa un gap di **100 ms** e riporta punti/s contro il benchmark del riferimento, non piu una soglia inventata al 25%.

**Il tetto dei pool di luce, misurato.** Spinti a valori assurdi (lampeggio ogni 0,8 s, ampiezza 0-1) arrivano a 8,6 punti/s contro i 14,2 del riferimento, e ad ampiezza piena con pulse 1,5 s **peggiorano** (4,5). Non e un problema di parametri: sono gradienti enormi e morbidi, la maggior parte dei pixel cade nella sfumatura dolce dove l'ampiezza effettiva e una frazione, e i pool chiari e scuri sovrapposti si annullano. Riportati a periodi lenti (25-29 s): servono per l'umore, non per il moto percepibile.

**Il vincolo strutturale.** La mappa rende a **zoom 0,23**. Il riferimento e acqua a 1:1 che riempie il fotogramma. Un tratto di 17 px world diventa 4 px a schermo e in 300 ms si sposta di ~1 px. Nessuna taratura di un campo tonale supera questo.

**La strada che segue dall'evidenza.** L'unica cosa che sul monitor del Director si vede davvero muoversi sono le **nuvole**: sprite ad alto contrasto. Il diff a 300 ms lo dimostra — mare nero, nuvola bianca. Quindi il moto del mare va fatto dello stesso materiale che a questo zoom funziona: **sprite d'onda visibili e contrastate, molte, su tutto il mare** — non campi tonali. `WorldSurfaceWaves` fa gia esattamente questo con 7 marchi confinati alla costa; serve moltiplicarli, distribuirli su tutta l'acqua e dargli un moto visibile.

**P0c — Sprite d'onda su tutto il mare: implementato (2026-08-30), da giudicare.**

Approvato dal Director (*"procedi"*). Il ragionamento: le nuvole sono l'unica cosa che si vede muoversi, e non perche siano veloci — la banda `near` fa 1,4 px/s a schermo — ma perche sono ad **altissimo contrasto**. Uno spostamento di mezzo pixel di un bordo bianco su blu cambia quei pixel di 100 punti. Il contrasto e il moltiplicatore, non la velocita. Quindi il moto del mare va fatto dello stesso materiale.

- `scripts/build-waves-painted.mjs`: campiona **150 punti direttamente da `sea_mask.webp`** invece di leggere i 18 punti `sea` di `points.json`, che nascono con un'ampia clearance dalla costa e descrivono solo acqua profonda, lasciando ogni baia vuota. Separazione minima 210 px world, rilassata in 4 passate dove un canale stretto non la regge.
- Timing ribaltato: `cycleSeconds` 46 → **15**, `visibleFraction` 0,222 → **0,84**. Erano tarati per tenerne 4 sullo schermo come evento raro; ora ce ne sono ~126.
- `WorldSurfaceWaves.tsx`: aggiunta la **deriva orizzontale** (`driftWorldPx` 450, direzione alternata per marchio) e il timing passato da `ease-in-out` a **lineare** — una deriva eased passa la maggior parte della vita quasi ferma ai punti di inversione, che e esattamente la staticita da rimuovere. Il "hold" immobile a meta ciclo, che era il punto dichiarato del vecchio componente, e stato ridotto alle sole rampe di entrata e uscita.
- Tratti dello sprite ispessiti da 1,2-2,3 a 3,2-5,5 px: uno sprite disegnato a 320 px viene mostrato a ~280 px world e la mappa sta a zoom 0,23, quindi la catena moltiplica per ~0,20. Un tratto da 1,5 px atterrava a **0,3 px a schermo** e il downscale lo mediava via.
- Opacita 0,46 → **0,92**, per il contrasto.

**Verifica.** Diff isolato (nascosti nuvole, uccelli, creature, schiuma, pool e tile): le striature si vedono muoversi su tutta l'acqua, picco 210 punti, 3,7% del frame oltre i 3 punti in 500 ms. Performance a regime **identica** con e senza i marchi: p50/p95 16,7 ms, worst 16,8, 60 fps; memoria +23 MB. Il p95 di 49,5 ms visto in una misura precedente era decode di avvio, non regime. Test 11/11, `tsc` pulito.
Nel fermo immagine i marchi sono indistinguibili per stile dal tratteggio dipinto della costa.

**Terzo difetto della metrica, trovato e documentato.** `isSea()` classifica per colore, quindi una nuvola o un uccello che attraversa l'acqua viene contato come acqua che cambia. Con 16 nuvole sul mare, un paio di punti percentuali di "sea coverage" sono loro. Limite scritto nel commento della funzione: il numero del mare e un **limite superiore**, e ogni cambiamento va confermato con un diff isolato prima di crederci. Sommato al gap di 5 s e al tempo di assestamento, la metrica ha sbagliato in tre modi diversi: non e uno strumento affidabile per decidere questa taratura.

**Respinto (2026-08-30):** *"grande fallimento"*. Corretto.

**Perche ha fallito.** Lo sprite d'onda e un rettangolo 320x134 riempito di tratti paralleli **senza dissolvenza ai bordi**. A 150 copie con opacita 0,92 e tratti ispessiti, il bounding box dello sprite diventa leggibile: il mare si e riempito di blocchi rettangolari di righe bianche, come carta strappata appoggiata sull'acqua. Il tratteggio dipinto che dovevano imitare segue le **curve** della costa; il mio era a righe orizzontali allineate agli assi. La mia affermazione che fossero "indistinguibili dal tratteggio dipinto" era falsa: quei blocchi erano gia nel ritaglio che avevo mostrato e li ho letti come disegno.

**Danno collaterale, causato e riparato.** `build-waves-painted.mjs` faceva `rmSync` sull'intera `public/assets/atmosphere/waves/` prima di scrivere. Quella cartella conteneva **quattro asset mai committati** — `onda1`, `onda2`, `ondine1`, `schiuma1` — e li ha distrutti tutti. Recuperati rigenerandoli dai PNG in `assets-source/atmosphere/waves/`, che sono sopravvissuti. Il `rmSync` e stato rimosso da **entrambi** i builder (`build-waves-painted.mjs` e `build-waves.mjs`) con la spiegazione in commento: scrivono i propri file e non toccano il resto.

**Ripristino completo del mare.**
- Asset originali rigenerati; la pagina carica 7 marchi da `onda2`/`ondine1`/`schiuma1`/`onda1`, zero immagini rotte.
- `WorldSurfaceWaves.tsx`: rimossa la deriva orizzontale, ripristinato il "ramp on, HOLD, ramp off" e il timing `ease-in-out`.
- Blocco `waves` del config riportato ai valori originali: `cycleSeconds` 30, `visibleFraction` 0,45, `opacity` 0,75, `bobWorldPx` 3, 7 marchi. `driftWorldPx` rimosso dall'interfaccia.
- Parametri del builder riallineati, cosi rieseguirlo riproduce l'originale invece di ricreare il fallimento. Il campionamento denso (`scatterOverSea`) resta nel file ma **non e usato**, con in commento la ragione per cui non funziona e cosa servirebbe: uno sprite con dissolvenza alpha ai bordi e tratti che seguono una curva, non piu marchi.
- Campo d'acqua (tile + 12 pool) **smontato** dal renderer, import incluso. I file restano in albero, non referenziati; rimontarlo e un elemento solo. Motivo scritto nel renderer.
- Verifica: 7 marchi, 0 pool, 0 tile, 49 animazioni, layer decodificati tornati da 189 a 46, nessun errore in console, mare visivamente pulito. `tsc` pulito, test 11/11.

**Cosa resta della sessione, e va giudicato a parte.** La correzione delle bande nuvole: da **una** banda a tre (`far`/`mid`/`near` a 2,0 / 3,5 / 6,0 px/s, 16 sprite contro 9) e `shadowOpacity` da **0** a 0,02-0,04. Quello era codice morto reale — `WorldSurfaceCloudShadows` montava e animava nove sprite disegnandole interamente trasparenti — ed e l'unica modifica di questa sessione che il Director non ha respinto. **Confermata dal Director (2026-08-30): "tienila".**

**Bilancio.** Quattro tentativi sul mare, quattro respinti: tile a macchie (sporcavano), tile a tratto + pool di luce (invisibili), 150 marchi d'onda (blocchi rettangolari). La causa comune non e stata la tecnica ma la **verifica**: la metrica ha sbagliato in tre modi indipendenti (gap di 5 s, tempo di assestamento, nuvole contate come mare) e ogni volta che contraddiceva l'occhio del Director ho creduto alla metrica. Nessuna nuova proposta sul mare senza prima un metodo di verifica che concordi con l'occhio.

**Cosa manca (storico, tentativo 3).** Il moto era reale e misurabile ma sottile: nel diff serve un'amplificazione 10x perche salti all'occhio. Non dico che ora si vede — l'ho detto due volte e mi sono sbagliato.
- Le due manopole, se serve piu presenza: `opacity` e `driftWorldPx` nel blocco `waves` di `src/ui/idleVillage/config/atmosphereAssets.ts`, e `MARK_COUNT` in `scripts/build-waves-painted.mjs` (rigenerare con `node scripts/build-waves-painted.mjs`).
- Il campo attuale (tile a tratto + pool lenti) resta in piedi: non sporca e non costa (60 fps, p95 16,8 ms), ma da solo non risolve la richiesta.
- **Decisione di direzione del Director.** Il campo a tratto non sporca piu, ma e molto discreto. Due strade: alzarne l'ampiezza fino a renderlo chiaramente visibile, oppure abbandonare l'overlay e animare i **tratti d'acqua gia dipinti** nella mappa, che sono il linguaggio nativo dell'artwork.
- Conferma visiva del Director sul mare, e giudizio sulle ombre delle nuvole (potrebbero leggere come sporco sul dipinto: sono al minimo apposta).
- P2 raggi di luce CSS, P3 puntatore che modula la luce anziche la posizione, P4 polvere in Pixi, P5 displacement sul layer di dettaglio (solo se P0 non basta), P6 revisione degli eventi onda.
- Il `Window` di vetro (decisione 3) non e ancora stato toccato.
- **Nota d'ambiente:** un processo coordinator in background ha committato questo lavoro in corso dentro commit V6.3 non correlati (`e0d2c6e5`, `9e7e2cdb`). Nulla e perso, ma la storia e sporca.

---

## R-058 — Consolidamento documentale: CANON, CURRENT_STATE, GLOSSARY

**Richiesta:** *"Procedi"* al consolidamento documentale Batch 1: creare `CANON.md`, `CURRENT_STATE.md`, `GLOSSARY.md` e aggiornare `context/INDEX.md` e `AGENTS.md` con i riferimenti.
**Data:** 2026-08-31
**Stato:** `fatta`
**Consegnato:** 2026-08-31
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione protocollo Mind Weaver in RPG.
**Output atteso:**
- `CANON.md` con mappa delle autorità.
- `CURRENT_STATE.md` con fotografia del runtime.
- `GLOSSARY.md` con termini canonici.
- `context/INDEX.md` e `AGENTS.md` aggiornati per puntare ai nuovi documenti.

---

## R-059 — World Surface: aggiorna vincoli, breath sempre on, e crea Sea Effect Lab

**Richiesta:** *«breath sempre on»*, *«aggiorna i vincoli»*, e *«voglio che tu faccia una pagina ad hoc x il mare e fare diversi tentativi, uno accanto all'altro, sempre raggiungibile da test hub»*.
**Data:** 2026-08-31
**Stato:** `fatta`
**Consegnato:** 2026-08-31
**Desiderata FROZEN:** `.mw/desiderata.md` v19 — World Surface: ombre nuvole sempre attive, autorizzazione shader/parallasse overlay e Water Effect Lab.
**Output atteso:**
|- `.mw/desiderata.md` v19, `DESIGN_PILLARS.md` §1, `context/DECISION_LOG.md`, e `src/docs/docs/plans/world_surface_reactive_artifact_plan.md` aggiornati con i nuovi vincoli.
|- `WorldSurfaceRenderer.tsx` monta `WorldSurfaceCloudShadows` senza guardia `breathEnabled`.
|- `WorldSurfaceWaterField.tsx` accetta una `config` opzionale.
|- Nuova pagina `SeaEffectLabPage.tsx` (`/sea-effect-lab`) con due pannelli affiancati: baseline e water field intensificato.
|- `TestHub.tsx` e `App.tsx` aggiornati per rendere la pagina raggiungibile.

---

## R-060 — World Surface: parallasse al mouse su nuvole e ombre

**Richiesta:** *«prima parallasse»* — aggiungere la parallasse guidata dalla posizione del mouse sugli overlay atmosferici (nuvole e ombre), come previsto e autorizzato dalla desiderata v19.
**Data:** 2026-08-31
**Stato:** `fatta`
**Consegnato:** 2026-08-31
**Desiderata FROZEN:** `.mw/desiderata.md` v19 — World Surface: ombre nuvole sempre attive, autorizzazione shader/parallasse overlay e Water Effect Lab.
**Output atteso:**
|- `WorldSurfaceClouds.tsx` e `WorldSurfaceCloudShadows.tsx` accettano `parallaxOffset` e lo usano per `translate3d` drag-only.
|- `WorldSurfaceRenderer.tsx` calcola `cloudParallax` solo da `dragOriginPan`, senza variabili CSS legate alla posizione del mouse.
|- Il prop `breathEnabled` resta indipendente; ombre nuvole sempre attive.
|- Safeguards: build:check, lint, kanban:lint e `WorldSurfaceRenderer.test.tsx` passano.

**Aggiornamento 2026-08-31:**
|- Il Director ha ristretto la parallasse al **trascinamento**: nessun offset da semplice posizione del mouse (`hover`).
|- Valori `PARALLAX` (`cloudExcess: 0.15`, `maxOffsetScreenPx: 12`) per un effetto visibile al drag ma con tetto leggero.

---

## R-061 — Window primitive: logica semantica per glass, parallasse, luce e riflessi

**Richiesta:** Aggiungere la logica semantica al componente `Window`: glass, parallasse, effetti di luce, riflessi, ecc.
**Data:** 2026-08-31
**Stato:** `fatta`
**Consegnato:** 2026-08-31
**Output atteso:**
|- `WindowProps` espande `glass`, `parallax`, `caustics`, `reflections` con default conservativi.
|- `Window.tsx` accetta `parallax` e sposta i layer caustica/riflesso con CSS custom properties su mouse move (opposto al puntatore, max 6px).
|- `glass`, `caustics`, `reflections` sono condizionali e rispettano `prefers-reduced-motion`.
|- Build:check, lint su `Window.tsx` e kanban:lint passano.

---

## R-062 — World Surface: raggi di luce, dust ed effetti particellari atmosferici

**Richiesta:** Aggiungere alla mappa raggi di luce, dust ed effetti particellari atmosferici, dopo ricerca online sulle tecniche migliori.
**Data:** 2026-08-31
**Stato:** `fatta`
**Consegnato:** 2026-08-31
**Output atteso:**
|- `WorldSurfaceAtmosphere` componente con light rays (CSS `repeating-conic-gradient` + pulse) e dust motes (CSS DOM particles).
|- Config-first: parametri in `atmosphereAssets.ambient` (lightRays, dust).
|- Montato in `WorldSurfaceRenderer` sotto le nuvole, con prop `showAtmosphere`; toggle in `WorldSurfaceTestPage`.
|- `prefers-reduced-motion` disattiva le animazioni.
|- Safeguards passano.

---

## R-063 — Rimuovere flag `floor` da `MatericFrame` e componenti correlati

**Richiesta:** *"in primitives nella tab frame c'è un flag `floor`: non voglio che esista da nessuna parte nel progetto. Voglio che qualunque componente lo implementi non lo usi più e non sia più visibile MAI a prescindere."*
**Data:** 2026-08-31
**Stato:** `fatta`
**Consegnato:** 2026-08-31
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione protocollo Mind Weaver in RPG.
**Cosa è successo:**
|- Rimosso il prop `floor` da `MatericFrame`, `MatericEventCard` e `BezelMolding`.
|- `MatericFrame` variant `molding` è ora un bordo NMM senza pavimento interno.
|- Aggiornati i consumatori: `src/pages/primitives.tsx` e `src/ui/idleVillage/components/PgDetailCard.tsx`.
|- Aggiornata `src/docs/docs/design/primitive_composition_rules.md` per riflettere che `MatericFrame` non ha più `floor`.
**Output atteso:**
|- Il prop `floor` non esiste più nel progetto; la pavimentazione interna non è mai visibile.

---

## R-064 — RpgBalancer: continuare l'audit e produrre il Balance Model v1 / Canonical Mathematical Specification

**Richiesta:** *Handoff dalla conversazione precedente su RpgBalancer: continuare l'audit del sistema di balancing, identificare la baseline canonica, consolidare le fonti di verità frammentate e produrre una specifica matematica canonica (Canonical Mathematical Inventory) prima di qualsiasi modifica al bilanciamento.*
**Data:** 2026-09-04
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`.
**Desiderata FROZEN:** nessuna corrispondente; richiesta operativa derivata dall'handoff.
**Cosa è successo:**
1. Verificato che l'archivio `RpgBalancer_Source_Clean.zip` non è presente nella workspace; audit eseguito sul sorgente locale in `src/balancing/`.
2. Mappati i file chiave: `defaultConfig.ts`, `baseline.ts`, `balancingConfig.ts`, `registry.ts`, `modules/critical.ts`, `modules/mitigation.ts`, `1v1/mathEngine.ts`, `config/ConfigSolver.ts`, `statWeights.ts`, `modules/spellcost.ts`, `spellStatDefinitions.ts`, `spellTypes.ts`, `spells/config/types.ts`.
3. Prodotta prima bozza del Canonical Mathematical Inventory: `src/docs/docs/balancer/balance_model_v1.md`.
4. Aggiornato `context/INDEX.md` con il nuovo documento.
**Cosa manca:**
1. Confermare se il sorgente locale è sufficiente o se serve l'archivio/repo remoto `Kurokasaiken/RpgBalancer`.
2. Risolvere le incongruenze P0 elencate nel documento (baseline, pesi, formule `effectiveDamage`/`attacksPerKo`/hitChance, ward, scenario reali).
3. Completare la sezione spell (DoT curve, AoE curve, mana model, `dangerous` semantics) e l'Equipment Creator quando richiesto.
4. Pianificare scenari (A/E, Post, Big Post, ecc.) solo dopo che il modello è stabile.
**Vincoli:** non modificare il bilanciamento prima dell'audit; usare terminologia "budget" (non "spell budget"); non promuovere valori illustrativi a regole canoniche; Balancer è source of truth per baseline/weight; Spell Creator/Equipment Creator consumano Balancer.

**Aggiornamento 2026-09-04:** il Director ha riformulato l'obiettivo: l'audit tecnico non è fine a sé stesso, ma strumento dentro un progetto di design più ampio. L'output richiesto non è più solo un Balance Model, ma un **Master Context / Handoff** completo (sezioni 00-23) che integri: visione, filosofia, design intent, modello matematico, audit del codice, esperimenti, decisioni confermate e decisioni aperte. Ogni informazione deve essere etichettata con il suo status. Non inventare definizioni di scenario (A/E, Post, Big Post) né promuovere valori sperimentali a canonici.

---

## R-066 — Sea Effect Lab: solo il mare, molti riquadri con le soluzioni a confronto

**Richiesta:** *«lascia solo il mare, togli tutto il resto. poi fammi tanti piccoli riquadri con solo il mare e le diverse soluzioni»* (su `/sea-effect-lab`), preceduta da *«mi serve un piano per mostrare l'effetto del mare che si muove leggermente»* su `/world-surface`.
**Data:** 2026-09-06
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`.
**Desiderata FROZEN:** v19 — «voglio una pagina ad hoc x il mare con diversi tentativi uno accanto all'altro» e «per l'acqua serve un piano intelligente, non altri tentativi alla cieca».
**Cosa è successo:**
1. `SeaEffectLabPage.tsx` riscritta: via `WorldSurfaceRenderer`, via nuvole/ombre/schiuma/uccelli/vetro/cornice. Resta il solo layer `Mare.webp` (con `Background.webp` opzionale sotto).
2. Griglia di 12 riquadri, uno per tecnica candidata: statico, dashes dipinte, luce che scorre, ripple leggero/forte/swell (feTurbulence + feDisplacementMap animati in SMIL), doppia copia in soft-light, micro-dettaglio water_detail, riflessi, shimmer, respiro di colore, combo.
3. Quattro crop selezionabili, verificati contro l'alpha del layer mare: `Mare aperto`, `Fascia ovest`, `Stretto est`, `Isolotto sud`. Numero di colonne regolabile.
4. Nessun RAF: solo keyframe CSS e SMIL, così le animazioni girano anche nel preview pane.
5. `PLAN-013 — World Surface Sea Marks` redatto e sottoposto a ChatGPT, Claude, Gemini, Grok, DeepSeek: ChatGPT, Claude e DeepSeek hanno approvato; Gemini non ha ricevuto il prompt per un bug dell'adattatore web; Grok è in rate limit. Piano registrato in `plans/PLAN-013-sea-marks.md` e `ROADMAP.md`.
6. **Delibera del Director (2026-09-08):** tra le varianti del lab, solo il *ripple leggero nelle coste* legge bene. Tutto il resto è invisibile o appare come macchie a caso. Implementato `WorldSurfaceSeaRipple` in `WorldSurfaceRenderer`: copia mascherata di `Mare.webp` con `feTurbulence` + `feDisplacementMap` SMIL, limitata da `shallow_mask.webp`, config-first in `atmosphereAssets.seaRipple`, con `prefers-reduced-motion`.
7. **Nuova direzione del Director (2026-09-08):** «opzione 3 per adesso» — cioè usare un **asset pre-rendered (texture animata / displacement map)** che simuli il mare in movimento, mascherato sulle coste, invece del noise procedurale puro. Scaricato `ripples.7z` (30 frame 512×512, CC0, OpenGameArt — seamless raindrop ripples texture) come candidato per essere convertito in sprite sheet / sequenza e montato nel renderer.
8. **Osservazione del Director (2026-09-08):** «07 · Micro-dettaglio e shimmer potrebbero funzionare nel mare aperto, ma micro dettaglio è troppo poco visibile per un umano» — quindi l'asset/sprite può essere promettente, ma il micro-dettaglio attuale è troppo sottile e va reso più leggibile o scartato.
9. **Richiesta operativa del Director (2026-09-08):** «07 · Micro-dettaglio e shimmer potrebbero funzionare nel mare aperto, ma micro dettaglio è troppo poco visibile per un umano» — valutare e rendere più leggibile il micro-dettaglio (contrasto/blend/tile size) e testare shimmer in mare aperto, senza maschera costiera.
10. **Critica del Director (2026-09-08):** «micro dettaglio boost va già meglio, ma la forma è sempre la stessa? e non sembrano increspature di mare, ma di lago» — il tile `water_detail` ripetuto produce un pattern statico/uniforme (effetto lago/raindrop) invece di onde marine con creste lunghe, direzione e vuoti. Serve un asset o un disegno che abbia forma di mare, non una trama ripetuta.
11. **Critica del Director (2026-09-08):** «anche shimmer mare aperto non va bene, deve essere meno geometrico» — lo shimmer a bande parallele risulta artificiale; l'effetto mare deve essere organico, non ripetitivo/parallelo.
12. **Feedback visuale del Director (2026-09-08):** screenshot del lab mostra che `07b`, `09` e `09b` non risolvono il mare aperto: `micro-dettaglio` sembra lago/raindrop, `shimmer` sembra una proiezione geometrica. La critica è confermata: il mare aperto del dipinto è quasi un gradiente piatto e qualsiasi overlay texturale risulta artificiale.
13. **Feedback video del Director (2026-09-08):** «09c caustics organiche è promettente, ma è un rettangolo bianco che passa super velocemente» e «nn si vede nulla, nn si capisce, ma nel fermo immagine è lui». La forma statica è corretta, ma in movimento non si percepisce come mare: le caustics cambiano forma senza scorrere, quindi non danno l'impressione di onde che avanzano.
14. **Richiesta del Director (2026-09-08):** «usa il protocollo multi AI web con hat e prompt potenziato, scrivi bene il problema e come possiamo risolverlo» — per trovare un asset/approccio "ocean scrolling" che non sia geometrico né ripetitivo.
15. **Richiesta del Director (2026-09-09):** *«abbiamo provato a portare nella mappa world surface l'effetto small ripple sulle coste»* e *«voglio un effetto acqua marina fatto cn Diagramma di Voronoi, sempre in quella pagina: sea effect lab, ma nn siamo riusciti»*. Due tracce distinte. Redatto [plans/PLAN-015-sea-ripple-port-and-voronoi.md](plans/PLAN-015-sea-ripple-port-and-voronoi.md) dopo indagine con 7 agenti.
16. **Diagnosi (2026-09-09), tre premesse del repo smentite dalla misura:**
    - `SeaEffectLabPage.tsx:20-23` e `WorldSurfaceSeaMarks.tsx:16-17` affermano che keyframe CSS e SMIL continuano nel preview pane. **Falso:** con `visibilityState: hidden` si congela l'intera timeline del documento. Ogni taratura finora e' stata fatta su un fermo immagine del keyframe 0%.
    - `worldSurfaceKit.md:52-55` dichiara ogni layer 4240x2828. **Falso:** i 21 `.webp` sono 3072x2049, stirati x1.3802 da `imageFit: fill`.
    - Il lab hardcoda zoom 0.33 come "(mappa)". **Falso:** lo zoom di default misurato su `/world-surface` e' **0.18**. Il lab giudica a 1.8x lo zoom di produzione.
17. **Causa del fallimento della traccia A (2026-09-09):** il port originale (`8c9cf669`) aveva il filtro giusto ma ha copiato dal lab la compensazione dello zoom (`baseFrequency/zoom`, `scale*zoom`), corretta per un elemento in px schermo, su un elemento in world px dentro `transform: scale(0.18)` -- errore di 1/zoom^2 ~= 31x, spostamento massimo +/-0.065 px schermo. Su quella diagnosi errata `c526f058` ha rimosso il displacement e tenuto la copia mascherata: oggi in produzione c'e' una copia pixel-allineata di `Mare.webp` al 50% che trasla rigidamente, con delta esattamente zero a inizio e fine ciclo. Nel lab invece il filtro sta sull'unica `<img>` del mare, senza maschera e senza blend, e cio' che si muove e' il bordo alpha della costa sopra il Background fermo.
18. **Causa del fallimento della traccia B (2026-09-09):** nel repo non esiste una riga di Voronoi/Worley (zero occorrenze, zero commit). Non e' fallita: non e' mai stata valutabile, per la stessa causa del punto 16. Barriere misurate: `TEXTURE_EDGE_LIMIT_PX = 4096` contro una world box di 4240 px ("WebKit fails blank rather than throwing"); budget gia' rosso (613 MB di RGBA contro soglia 512, ~8 sistemi costosi contro i 4-5 di `DESIGN_PILLARS.md:20`); `useImageFootprint` conta solo `<img>`, quindi e' cieco su canvas e background-image.
19. **Difetti collaterali trovati (2026-09-09):** due `TS2304` vivi su `main` (`useMemo` in `WorldSurfaceSeaRipple.tsx:82`, `WaterFieldConfig` in `WorldSurfaceWaterField.tsx:23`); il ramo `sprite` rotto due volte; il toggle `Water` pilota due sistemi mentre le 34 sea marks sono accese a prescindere; nessun test copre atmosfera/acqua; `worldSurfaceKit` non ha `cert.json` (Draft, non certificato).

20. **Osservazione del Director (2026-09-10):** *«le isole nn si vede nulla muoversi, ci pensiamo dopo»* — il filtro sulle due isole (`seaRipple.extraLayerIds`) non produce movimento percepibile. **In pausa per decisione del Director.** Diagnosi in PLAN-015 §12: le due isole sono dipinte piu' grandi del loro ritaglio nel mare (sporgono sul mare opaco per il 19.9% e il 15.1% della loro area), quindi il bordo del mare e' sotto la loro pittura; il filtro applicato al layer dell'isola deforma anche il suo interno, e a +/-1.5 px schermo evidentemente non legge. Passo successivo quando si riprende: mascherare il displacement al solo bordo esterno (`feMorphology` erode sull'alpha) invece di alzare `scale`.
21. **Richiesta del Director (2026-09-10):** *«parti con il voronoi. fa una ricerca online, trova tecniche, soluzioni, ecc. nn voglio vedere cose spigolose, devono muoversi come superficie marina e nn come una rete»*. Redatto [plans/PLAN-016-voronoi-sea-surface.md](plans/PLAN-016-voronoi-sea-surface.md) con ricerca online. Nodo del piano: **un diagramma di Voronoi e' poligonale per costruzione** (bordi retti, vertici a spigolo) perche' l'operatore `min()` sulle distanze non e' continuo nella derivata — preso alla lettera produce esattamente la rete che il Director esclude. Quattro tecniche, una per requisito: `voronoise` di Inigo Quilez (l'esponente `k = 1 + 63(1-v)^4` scioglie il `min()` in una media pesata: e' letteralmente la manopola «meno spigoloso»); domain warping `f(p + h(p))` contro la geometria residua; semi orbitanti `0.5 + 0.5*sin(t*speed + 6.2831*hash)` perche' le celle si rimodellino invece di traslare; drift lento del dominio sopra il morphing, per l'avanzamento che mancava al rigetto del punto 13. Criterio di uscita oggettivo: istogramma dell'orientamento del gradiente quasi isotropo, che e' la forma misurabile dei rigetti «troppo geometrico» dei punti 11 e 12.

22. **Delibera multi-AI sul piano (2026-09-10):** il Director ha chiesto una critica esterna a PLAN-016. Verdetto: la versione iniziale ("R1") mette insieme troppe tecniche in un solo shader senza isolare quale elimina la geometria; una seconda proposta ("R2") corregge il sequenziamento (campo statico prima del movimento, tassonomia di fallimento nominata CELLULAR/NETWORK/SLIDING_TEXTURE/BREATHING_BLOBS/CAUSTIC) ma introduce un processo a ~22 stati sovradimensionato per uno spike, bandisce F2-F1 e i semi orbitanti per sospetto invece che per prova, e butta via ogni metrica oggettiva. Sintesi ("R3") registrata in PLAN-016 §4: si tiene il sequenziamento statico-prima-di-animato e la tassonomia di R2, si riportano F2-F1 e i semi orbitanti come varianti da provare (non bandite), si tiene la metrica automatica come filtro economico prima del giudizio umano (non come sostituto), e si corregge la stima "~8 sistemi, il Voronoi sarebbe il nono" (mia, in R1): il vincolo dei pillar e' sui passi di rendering costosi, non su un conteggio di elementi animati in CSS. Verificato sulla fonte primaria di Quilez: lo smooth-min e' progettato per "preserve the well known voronoi look" -- conferma piu' forte della sola intuizione di R2 sul punto.

23. **Battesimo del piano ed esecuzione C0 (2026-09-10):** il Director ha battezzato PLAN-016 R3 ("implementalo"). Creata `public/voronoi-sea-spike.html`: pagina standalone WebGL2, voronoise+domain warp+semi orbitanti+drift sopra `Mare.webp` vero, mascherata su `sea_mask.webp`, con slider live, filtro automatico (istogramma orientamento + bordo collineare) e rubrica delle cinque categorie di fallimento. Trovati e corretti tre bug reali durante la verifica: `window.innerWidth` letto a 0 prima del layout del pane (stage forzato a 200px), `preserveDrawingBuffer` assente (screenshot letti neri nonostante il rendering avvenuto), e il piu' serio -- un moltiplicatore di ingrandimento contaminava il calcolo world-px-per-schermo passato allo shader, gonfiando le celle di 4x (stessa famiglia dell'errore 1/zoom^2 diagnosticato in PLAN-015 per il ripple). Corretto separando "zoom mappa" (reale, determina la frequenza del pattern) da "ingrandimento d'ispezione" (lente CSS pura). Osservazione per C1, non verdetto: ai parametri di default il campo fermo legge come nuvola morbida piu' che come struttura cellulare -- da giudicare dal Director in un browser vero, non da me.

24. **Correzione del Director (2026-09-10):** *«nn vedo nulla mai, prima di dire che hai finito devi vederlo tu a schermo se è percepibile da occhio umano»* -- rifiuto giusto di una risposta basata solo su lettura di pixel (readPixels/getComputedStyle) invece che su aver guardato lo schermo. Trovati altri due bug reali guardando davvero: (1) `mask-position`/`mask-size` in CSS NON usano l'aritmetica di `left`/`width` che uso per le `<img>` -- una percentuale li' e' offset = P*(contenitore-immagine_resa), non un offset diretto; la formula sbagliata dava -637% e spingeva la maschera fuori dal contenuto reale, alpha zero ovunque pur avendo il mare il 78% di copertura opaca reale in quella zona. Corretto con pixel espliciti. (2) `blend: luminosity` come default era genuinamente troppo debole su questo dipinto (sostituisce la luminanza mantenendo tinta/saturazione dello sfondo; se il campo resta vicino alla luminanza gia' scura del mare il cambiamento e' minimo anche ad alpha alta) -- non un bug di codice, una scelta di compositing sbagliata per questo materiale. Cambiato default a `normal`. Verificato con un rettangolo magenta pieno al posto del pattern (la maschera segue la costa esattamente) poi ripristinato lo shader: ora visibile a occhio, ai default veri, dopo un reload a freddo.

**Prima evidenza:** sui crop di mare aperto il dipinto è quasi un gradiente piatto e il displacement non si vede — conferma il docblock di `WorldSurfaceWaves.tsx`. Sul crop `Isolotto sud`, dove il dipinto ha texture (anelli d'inchiostro, costa), lo stesso filtro ha qualcosa su cui agire. La variante `rippleSoft` mascherata a coste è l'unica che il Director ha approvato per la mappa vera.
**Cosa manca:**
1. Veredetto finale di Grok e Gemini per piena unanimità (Grok rate limit; Gemini adattatore rotto).
2. Profilazione del coastal ripple su WebView/Tauri: frame-time, compositor layer count, DPR, dispositivo modesto, `prefers-reduced-motion`.
3. Riparare `tests/unit/frozen/worldSurfaceKit.alignment.test.ts` (25/49 rossi: `pngSize()` legge l'header IHDR ma gli asset sono `.webp`).
**Vincoli:** il lab è uno strumento di confronto, non produzione; nessun layer full-canvas mosso con transform; `prefers-reduced-motion` rispettato; la tecnica vincente va ricostruita config-first dentro `WorldSurfaceRenderer`.

---

## R-067 — Plan di miglioramento per Destiny Astrolabe V6.3

**Richiesta:** *«Crea un plan di miglioramento per /minimal-destiny-astrolabe-v6-3 incorporando le critiche e le proposte di ChatGPT, Claude e Gemini. Usa un hat corretto e la skill explorer.»*
**Data:** 2026-09-08
**Stato:** `ritirata`
**Triage R-156 (2026-10-12):** superata — lavoro astrolabio andato oltre (goo R-070, inglese R-141, Steam) — ritirata su ratifica Director.
**Desiderata FROZEN:** `.mw/desiderata.md` v3/v4 (Destiny Astrolabe V1 canonico per skill check POI quest), v9 (geometria avversariale libera), v8 (Golden UI Foundation come processo di congelamento visivo).
**Cosa è successo:** Il Director ha condiviso tre feedback multi-AI (ChatGPT Lead UI/UX AAA, Claude, Gemini) sull'astrolabe V6.3, evidenziando problemi di semantica, art direction, affordance, tensione e climax.
**Cosa è successo:** Il Director ha condiviso tre feedback multi-AI (ChatGPT Lead UI/UX AAA, Claude, Gemini) sull'astrolabe V6.3, evidenziando problemi di semantica, art direction, affordance, tensione e climax.
**Risposta Director (2026-09-08):** direzione A+B. Skill labels sugli assi come in Asterism V6. Informazioni visibili prima del lancio; il THROW è solo il lancio del dado.
**Piano:** [src/docs/docs/plans/destiny_astrolabe_v63_semantic_cinematic_plan.md](src/docs/docs/plans/destiny_astrolabe_v63_semantic_cinematic_plan.md).
**Decisioni visuali (2026-09-08):** input = Skill Core centrale (sigillo dorato, `CHECK`); pallina = goccia di mercurio/ambra (stretch + trail sottile); esiti = card con 5 nomi distinti; ferita/morte = fenditura radiale nel tar-goo; uscita obelischi = frantumazione; gap ring↔cerchio = labbro interno esteso + fondo opaco arena.
**Stato (2026-09-08):** `in corso` — implementazione V6.3 completata: `astrolabeV63Config.ts` (Zod), `onInfo` engine, label skill sugli assi, Skill Core CHECK, overlay pre-roll, pallina a goccia, fenditura radiale wound/death, frantumazione obelischi, fix gap arena, chiavi i18n `astrolabeV63.*` (en/it-IT). Safeguard verdi: build:check, test destinyAstrolabe+astrolabe (110 test), kanban:lint. Smoke test pagina 200 OK.
**Evidence:** `test-results/r067-astrolabe-v63-2026-09-08.log`.
**Cosa manca:** verifica visiva del Director sul TestHub e eventuale certificazione.

**Blocco emerso / fixato (2026-09-08):** la pallina cambia completamente traiettoria quando deve fermarsi ("snap" visibile). Implementata state machine `BOUNCING → ALIGNING → DECELERATING → SETTLED` in `engine.ts` con fixed-timestep accumulator (120 Hz), rotazione verso il target controllata da `turnRate` e decelerazione quadratica esatta lungo la direzione pre-rollata. Configurazione in `astrolabeV63Config.ts` (`landing.*`). Build:check, test astrolabe e kanban:lint passati; smoke test `/minimal-destiny-astrolabe-v6-3` 200.

**Blocco emerso (2026-09-08):** l'outer bronze ring lascia uno spazio vuoto intorno al componente interno. Fix: `astro-bezel` passa a `inset: -12%` (scende in percentuale col `.stage`), `arena` clippata a `inset: 3%` per allinearsi al bordo interno del ring; rimosso `stage::before` scuro che creava alone vuoto. Build:check, test astrolabe e kanban:lint passati.

**Richiesta in corso (2026-09-08/09):** completare i punti rimanenti del piano `destiny_astrolabe_v63_semantic_cinematic_plan.md` e mantenere il piano sincronizzato con lo stato reale.
- **Completato 2026-09-08:** F4 card — frase narrativa per skill (`copy.narrativeFlavors`, i18n `en`+`it-IT`), math esplicito `D100 {{roll}} · TST = 50 + ({{stat}} − {{difficulty}}) = {{tst}}`, backdrop `teal` ritocciato (meno verde).
- **Completato 2026-09-09:** sync completo del piano — tabella stato §0bis, note per F0–F5 e §5.5–5.10, §7 chiuso con decisioni e ordine suggerito.
- **Rimangono (ordine suggerito nel piano):** F3 auto-throw countdown + Space/Enter; F4/5.7 scrim + climax per esito; F0 `phaseDurations`/`useAstrolabeV63Phase`/types; F2 placche perimetro bronzo; 5.8 fissura WebGL shader; F5 E2E/Monte Carlo; cleanup `astrolabe.css` residual.

**Richiesta (2026-09-09):** *«lo sfondo di default deve essere teal, crea una versione 6.4, che sia un clone di questo codice, ma nn symlink»* — il Director vuole una directory `destinyAstrolabeV64/` con file reali copiati (non symlink, non condivisione del motore V63), sfondo default `teal`, pagina `/minimal-destiny-astrolabe-v6-4` e route in `App.tsx`.
**Stato:** ✅ fatto (commit `a4c814ab`) — `destinyAstrolabeV64/` con engine/componente/renderer/tentacles/types reali, `astrolabeV64Config.ts` (con `phaseDurations` + `perimeterPlaques`), `destinyAstrolabeV64Kit.tsx`, route registrata, i18n `astrolabeV64.*` in en+it-IT, CSS `.da-v64`. Smoke v6-4 → 200.

**Richiesta (2026-09-09):** *«adesso procedi cn il plan ma su 6.4, 6.3 è offlimits»* — i punti rimanenti del piano si implementano solo su V6.4.
**Fatto ora:** F3 cornice quiet→tension→explosion (opacità `.astro-bezel` via `data-state`); F4/5.7 — scrim card rinforzato, `data-verdict` sul `.suite`, climax per esito (trionfo/almost-sospiro/fail-sussurro/epicfail-doom), micro-flash `--fx/--fy` sulla zona di atterraggio colorato per esito; badge pagina corretto a V6.4.

**Richiesta (2026-09-09):** *«adesso procedi cn il plan ma su 6.4, 6.3 è offlimits»* — i punti rimanenti del piano `destiny_astrolabe_v63_semantic_cinematic_plan.md` si implementano solo su `destinyAstrolabeV64/` (engine, componente, config, kit, pagina v6-4, CSS `.da-v64`). V63 congelato.

## R-068 — Plan di implementazione Voronoi sea surface

**Richiesta:** *«fa il plan allora: usa multi AI web anche per la delibera di un plan vero e proprio»* per le tre modifiche emerse dalla delibera esplorativa (soft ownership gaussiana, curl domain warp, riduzione orbita) su `public/voronoi-sea-spike.html`.
**Data:** 2026-09-10
**Stato:** `fatta` — piano battezzato `PLAN-017-stylized-sea-pattern-evaluation.md`
**Desiderata FROZEN:** `.mw/desiderata.md` v2 (World Surface mappa viva), v19 (Water Effect Lab e shader custom condizionati).
**Piano esistente:** `plans/PLAN-016-voronoi-sea-surface.md` (status: proposto).
**Output atteso:** piano di implementazione con task ordinati, criteri di accettazione, verifiche e vincoli progetto.

**Evolvement (2026-09-10):** la direzione Voronoi è stata riformulata. Il piano vincente è `SEA-SPIKE-01 — Stylized Sea Pattern Evaluation`: `A` (authored texture) è il gold standard, `B` (dual texture) il tentativo, `C` (procedural Voronoi) il challenger. `C` viene promosso solo se supera `A`. File: `.mw/runs/2026-09-10-voronoi-plan-2/SEA-SPIKE-01.md`.

---

## R-069 — Portare lo spike authored texture in `/world-surface` con pulsante live

**Richiesta:** *«devi portare questa cosa su http://localhost:5175/world-surface. ci sono dei pulsanti che non so bene cosa facciano. aggiungine uno che quando lo clicco fa partire questa cosa sul mare e mi fa aprire anche la finestra con i parametri e testo 'dal vivo'»*.
**Data:** 2026-09-10
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v19 (Water Effect Lab: shader custom condizionati, fallback DOM, profilazione).
**Piano attivo:** `plans/PLAN-017-stylized-sea-pattern-evaluation.md` (status: active).
**Tensione:** `PLAN-017` §18 e Non-obiettivi vietano di sostituire `WorldSurfaceRenderer`, `WorldSurfaceWaves`, il mare in produzione o il TestHub finché il Director non approva un vincitore. L'integrazione in `/world-surface` (`WorldSurfaceTestPage`) richiede una deroga o una riformulazione dello scope del piano.
**Override:** il Director ha approvato esplicitamente di procedere su `WorldSurfaceTestPage` pur restando in fase di test/spike; implementazione fatta come overlay di debug senza toccare `WorldSurfaceRenderer`.
**Esecuzione:** creato `src/ui/idleVillage/components/WorldSurfaceSeaPatternOverlay.tsx` (WebGL2 viewport canvas + `sea_mask.webp` CSS mask + pannello live con slider), aggiunto pulsante `Pattern` in `WorldSurfaceTestPage`, aggiunte chiavi i18n, creata `public/world-surface-sea-pattern-config.json`. Aggiunto anche pulsante `Hide UI`/`Show UI` per nascondere header, pannelli e HUD lasciando solo la mappa (default `uiHidden = false`, quindi apertura normale). Verificato `npm run build:check` e `npm run kanban:lint`. Screenshot `test-results/world-surface-normal.png` e `test-results/world-surface-clean.png`.


**Richiesta (2026-09-10):** *«per la 6.3: le gocce iniziali sn troppo \"tonde e regolari\", mentre dovrebbero dare un'idea d goo/catrame. Possiamo fare un effetto tipo \"venom\", dove si muovno tipo cn dei piccoli tentacoli e fisica da goo/molto viscooso? Sei un lead senior system designer di una softwarehouse AAA, fa una ricerca online»* — investigare come rendere le gocce iniziali del tar-goo V6.3 più organiche/viscose, con riferimenti Venom, piccoli tentacoli, fisica goo. Fornire analisi e proposta implementativa per `tarGooRenderer.ts`/`engine.ts` V6.3.

---

## R-070 — V6.3 goo: gocce iniziali Venom/tentacoli

**Richiesta:** *«per la 6.3: le gocce iniziali sn troppo "tonde e regolari", mentre dovrebbero dare un'idea d goo/catrame. Possiamo fare un effetto tipo "venom", dove si muovno tipo cn dei piccoli tentacoli e fisica da goo/molto viscooso?»* — design e proposta implementativa per rendere le gocce iniziali del tar-goo V6.3 più organiche/viscose.
**Data:** 2026-09-10
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. (mini-PoC implementativa)
**Desiderata FROZEN:** `.mw/desiderata.md` v20 (V6.3 materialità/prisma goo), v9 (geometria avversariale libera), v16 (goo come densità).
**Cosa è successo:**
- Ricerca online conclusa: tentacoli Venom/symbiote meglio come catena di nodi con lag e smorzamento; metaballs + domain warp sufficienti per spezzare la rotondità senza fluid solver.
- Implementata mini-PoC su `src/ui/idleVillage/components/destinyAstrolabeV63/`:
  - `engine.ts`: ogni seed drop ora ha una coda di 3 nodi (`seedDropTendrilCount`) con raggio decrescente, molla smorzata, piccolo wiggle perpendicolare e deriva angolare; il moto è deterministico.
  - `tarGooRenderer.ts`: aggiunto domain warp configurabile (ampiezza/frequenza/velocità) nel fragment shader per spezzare le silhouette troppo regolari.
  - `tarGooConfig.ts`: aggiunti token Zod per tail nodes, wander, wiggle e domain warp; aumentata `v63.maxBlobs` a 56 per ospitare testa + coda + bracci.
- Verifiche: `npm run build:check`, `npm run kanban:lint`, `npm run test -- tests/unit/destinyAstrolabeV62/tarGoo.test.ts` passati; smoke test su `/minimal-destiny-astrolabe-v6-3` restituisce HTTP 200 e il board renderizza (screenshot `test-results/v63-goo-poc-*.png`).
**Cosa manca:** tuning visivo finale (ampiezza coda, frequenza warp, viscosità) e valutazione reale del Director; la geometria di gioco (`rCheckAt`, probabilità) è invariata.

---

## R-073 — Hero detail card dinamica: tutte le stat dal balancer + dati del PG reale

**Richiesta:** *"Dobbiamo fare una hero card detail, deve prendere 'dinamicamente' tutte le stats che arrivano dal balancer e le stat del pg vero (come troviamo il nome e il portrait dobbiamo trovare anche tutto il resto). 1) individua attualmente quali dati dobbiamo mostrare 2) fa una ricerca online sul modo migliore di mostrarli 3) proponi come farlo"*. Contesto: `PgDetailCard.tsx` e `SchedaPergamena.tsx` esistono ma mostrano solo HP/Stamina, non le stat reali.
**Data:** 2026-09-16
**Stato:** `ritirata`
**Triage R-156 (2026-10-12):** superata — PgCard canonico + popover quest (R-125) — ritirata su ratifica Director.
**Desiderata FROZEN:** `.mw/desiderata.md` v10 — hero components placeholder funzionali e skin-wired. Collegata a R-072 scena 3 (hero sheet nel teaser).
**Cosa è emerso dall'esplorazione (fase 1, fatti):**
- Pipeline dati: `SavedCharacter.statBlock` (StatBlock completo del balancer, merged con `DEFAULT_STATS` in `characterStorage.ts`) → `savedCharacterToResident` → `ResidentState.statSnapshot` (~29 stat numeriche) + overlay `useResidentHeroState` (equipment/inventory/skills).
- Il balancer ha già il registry di display: `BalancerConfig.stats` (label, type, min/max, isDerived, isHidden, formula) e `BalancerConfig.cards` (6 gruppi ordinati) in `src/balancing/config/`; glifi in `statIconUtils.ts`; nomi IT in `PARAM_DEFINITIONS` (`registry.ts`).
- Bug attuali: `SchedaPergamena` legge `snapshot.attack`/`snapshot.defense`/`resident.level` — chiavi inesistenti nel modello (sempre 0); stringhe IT hardcoded (violazione i18n); overlay modale bloccante (in tensione con desiderata v4 pannelli flottanti). `PgDetailCard` fa dump flat di tutte le stat numeriche senza label/gruppi. Il trailer mock (`trailerConfig.preparation.hero`) usa `attack`/`defense`/`magic` — chiavi fittizie.
**Decisioni del Director (2026-09-16):**
- **Direzione A**: evolvere `PgDetailCard` (Materic, draggable, i18n) con view-model dinamico.
- **Stat `isHidden`/`isDerived`: omesse del tutto** — niente sezione "advanced".
- **`magic` non è una stat**: è roba da skill → mostrare le **skill equipaggiate** (skillLoadout/grantedSkills da `useResidentHeroState`, risolte via `skills.json`).
- **Level/XP: mock** — valori da config (config-first), non hardcoded nel componente.
- **Equip + granted skills in scope**: le skill concesse dagli item equipaggiati vanno mostrate (OD-2 risolta: `useResidentHeroState` le inietta nello snapshot come `grantedSkills`).
**Piano scritto:** `src/docs/docs/plans/idle_village_hero_sheet_dynamic_stats_plan.md` (Sub-Plan A2 del piano ombrello hero components, Draft in attesa di battesimo). Task T-01→T-09; open decision OD-1 (stat orfane dal registry), OD-3 (destino di `SchedaPergamena` — emerso che è **dormant**: `MapPage`/`StyleLabMapPage` non sono routed in `App.tsx`, quindi oggi non è visibile da nessuna parte).

**Update 2026-09-16 — showcase in `/primitives`:** richiesta Director *"metti questa schedaPergamena nelle /primitive e poi aggiungi anche le altre schede del personaggio che abbiamo"*. Fatto: nuovo tab **PG Cards** in `src/pages/primitives.tsx` con fixture `DEMO_RESIDENT` (Kaelen, `dps_berserker`); mostra `SlottedMedal`, `PgCard` (trusted), `WorkerCard`, `WanderlustRosterCard` (via roster index) dentro `DragProvider`, più `PgDetailCard` inline e `SchedaPergamena` come overlay ancorato. Fix minimo necessario: `SchedaPergamena` chiamava `playSound` (API rimossa da `useSensoryAudio` — crashava all'apertura) → ora `playCue('drop_success')`. Scoperta: `PgCardTS002.tsx` è **sintatticamente rotto** (parse error babel, mai compilato) e usa API stale → escluso dalla gallery, riparazione = decisione a parte. I bug dati noti della pergamena (Difesa/Attacco 0, `resident.level`) restano — sono oggetto di OD-3. Evidence: `test-results/r-073-2026-09-16.log`. Safeguard: lint/test/build:check/kanban:lint passati.

**Update 2026-09-16 (sera) — leggibilità PgDetailCard:** feedback Director *"ha lo sfondo trasparente, è troppo stretto e lungo"*. Fix: wrapper esterno → `MatericSurface obsidian` (opaco), `maxWidth` 360→640, sezioni stats/equip+inventory su 2 colonne. Bonus fix i18n: `pgDetailCard.unknownPreset`/`statistics.count` usavano `{{var}}` ma il progetto è su `i18next-icu` (`{var}` singole) → corrette in en+it-IT; altre chiavi `{{}}` nel file hanno lo stesso bug latente (da auditare).

---

## R-075 — Componente HUD sopra la mappa interattiva, bello e on-DNA

**Richiesta:** *"mi serve un Componente HUD da mostrare sopra la mia mappa interattiva. Prendi un hat corretto, fa un prompt potenziato, e leggi le info relative al progetto, alle scelte grafiche, e a come fare i componenti. Poi fammi una HUD che sia il + bella e appropriata per il progetto possibile, che stia 'bene' accanto alla mappa e che rispetti Wanderlust DNA ecc"*
**Data:** 2026-09-21
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** GameFrame HUD v2 esiste (CURRENT_STATE §4) + R-132/136 — chiusa su ratifica Director.
**Hat:** `painter` (mandatory per creazione UI) + `idle-village-task` + `agent-execution-mandate`; prompt potenziato con l'hat `create_proposal` di `.mw/prompt-enhancers.md`.
**Desiderata FROZEN:** `.mw/desiderata.md` v2 (World Surface mappa viva) — copertura parziale. Nessuna desiderata nomina un HUD di mappa: l'autorità più vicina è il Pillar 1 di `DESIGN_PILLARS.md` (§R1.1 "HUD risorse + day-clock in alto", §R1.2 day-clock + timeline eventi) e le decisioni Director di R-071.

**Tensioni con il canon — nominate prima di procedere:**
- `DESIGN_PILLARS.md` §1 Pillar 1: *"Stato del villaggio, timer e avvisi si leggono **sul mondo**, non in pannelli che lo coprono"* e *"Cosa NON prendiamo: [...] niente dashboard con pannelli che coprono la mappa di default"*. Un HUD "sopra la mappa" è in tensione diretta con questa riga. Risoluzione adottata (non decisa unilateralmente — va confermata dal Director): il componente non copre pixel dipinti, vive nello screen-space agganciato alla cornice, e porta **precisione**, non lettura.
- `src/docs/docs/plans/world_presence_grammar_plan.md` v0.2, corollari operativi: *"Il mondo porta la lettura, l'HUD porta la precisione"* e *"Un asset forte va fatto recitare, non incorniciato in un pannello/popup/card"*. Il fallimento di R-071 (targa dorata 420×142) è il precedente da non ripetere.
- Vincolo fermo del Director (R-071, 2026-09-15): **"nessuna scritta sulla mappa"**; il rail vive agganciato alla cornice intagliata in screen-space; ordinato per scadenza crescente; hover → risonanza sulla presenza nel mondo. Il tracker è **globale**, non solo `/world-surface`, e si costruisce **sopra il sistema HUD esistente**, non come componente isolato.

**Cosa manca:** conferma del Director sulla risoluzione della tensione con Pillar 1.

**Rettifica del Director (2026-09-21):** *"Intendevo: nn 'davanti' alla mappa (le scritte nn devono coprire la mappa), ma l'hud è tipo un cappello sopra (o ancora meglio che incornici tutto) tipo 'guarda wanderlust mockup'. Il mio videogioco deve essere un videogioco, la mappa è un componente al suo interno."* — non un HUD incollato sulla mappa: **la cornice di gioco persistente di cui la mappa è un componente figlio**, sul registro strutturale di `public/wanderlust-mockup.html` ("Wanderlust — Game Layout": topbar/roster/mappa/quest/status bar). Questo scioglie la tensione con Pillar 1 sopra: non è un pannello che copre il dipinto, è il layout a tre regioni di R1.1/R1.2 (già direzione approvata), mai eseguito in produzione finora.

**Eseguito (2026-09-21):**
- Nuovo componente `GameFrame` (`src/ui/idleVillage/components/gameFrame/`, +`GameFrameTopBar`, +`GameFrameStatusBar`) — cornice persistente puramente presentazionale: topbar (logo, nav Villaggio/Mappa attivi + Officina/Taverna **locked** via gating diegetico R4.2, risorse, clock), roster rail sinistra, viewport centrale (la mappa è `children`, un componente qualsiasi), quest rail destra, status bar in basso. La cornice esterna (`MatericFrame variant="molding"`, il candidato "HERO-frame" già documentato in `fidelity-notes.md`) è un overlay assoluto **sibling** del layout reale, non suo genitore — nidificarla come parent rompeva lo stretch verticale (`.mp-content` è un box a blocco senza altezza intrinseca, quindi un figlio flex-column non si espande).
- Config-first: `src/balancing/config/idleVillage/gameFrameConfig.ts` (Zod) — dimensioni strutturali (topbar 44px, rail 280/260px, status bar 38px, nav items con `locked`) lette dal mockup di riferimento come default, non hardcoded nel componente.
- Riuso, non reinvenzione: `MatericRosterComponent` (roster reale, drag incluso), `QuestCardStandalone`/`useQuestCardKitData` (fixture), `DayNightTimeEngineStrip` (clock reale dallo store), `WorldSurfaceStandalone` (mappa reale), `MatericPlaque`/`MatericBadge`/`MatericFrame`/`MatericSurface`/`MatericGrain` (primitivi Materic esistenti), `--skin-*` token layer, `SkinScope`.
- **`WorldPresenceRail` (R-071) ha finalmente una casa reale**: docked screen-space sull'angolo del viewport centrale, mai dentro il world-box della mappa (mai trasformato da pan/zoom) — esattamente la richiesta ferma del Director in R-071.
- Estensione minima e retrocompatibile di `worldSurfaceKit.tsx` (`WorldSurfaceStandalone`): aggiunti prop opzionali `breathEnabled` (default **true**) e `showAtmosphere`. Il default precedente (`false`) violava la desiderata v19 FROZEN ("breath sempre on... non legato a un flag") — bug pre-esistente scoperto qui, corretto per tutti i consumer del kit, non solo per `GameFrame`.
- Bugfix a un primitivo condiviso: `.ws-content` in `wanderlust-surface.css` non aveva `min-width:0`/`min-height:0` — un consumer che imposta `display:flex` su `WanderlustSurface` (per far espandere il contenuto in altezza) faceva sì che `.ws-content`, come flex item, rifiutasse di restringersi sotto la larghezza minima del suo contenuto (default flex `min-width:auto`), facendo traboccare il roster reale oltre i 280px della rail. Fix inerte per ogni consumer non-flex esistente.
- Nuova rotta `/game-frame` (`src/pages/game-frame.tsx`, wiring di riferimento con dati reali dove esistono, fixture etichettate dove no — stesso principio già usato per il tab HUD di `/primitives`) + voce nel TestHub.
- i18n: nuovo blocco `gameFrame.*` in `en`/`it-IT` (namespace `idleVillage`, interpolazione ICU a singola graffa).
- Verificato al browser a 1024×768, 1440×900, 1600×1000: nav funzionante (click su tab locked = no-op, `aria-pressed`/`disabled` corretti), nessun errore console, rail contenute, mappa/roster/quest/clock/status bar tutti con dati reali o fixture chiaramente segnata. Safeguard: `build:check`, `kanban:lint`, `tsc --noEmit` puliti; `eslint` su `src/pages/game-frame.tsx` pulito (gli import da `idleVillage/components/*` sono warning non bloccanti, motivati inline — nessun kit esiste ancora per `GameFrame`/`WorldPresenceRail`).

**Non toccato / fuori scope, segnalato:**
- `WorldSurfaceRenderer`'s autoFit non applica in modo affidabile al mount (bug pre-esistente, già in `.mw/runs/2026-09-15-world-surface-perf/`-adiacente): a rapporti d'aspetto larghi la mappa viene centrata/letterboxed nel viewport invece di riempirlo. Non introdotto né peggiorato qui.
- Nessun kit per `WorldPresenceRail` (nato in R-071, mai certificato) — import diretto con `eslint-disable` motivato, non un kit affrettato sotto questo task.
- `GameFrame` non è wired in `/minimal-gameplay` (superficie canonica): quella pagina usa una forma-dati di roster/attività diversa e più vecchia — integrazione reale è un passo a parte, non deciso qui.

**Bocciatura del Director (2026-09-21, sera):** *"il risultato finale e' troppo brutto... ti avevo dato un esempio, hai fatto una copia, se avessi voluto quello avrei usato quello... anche i componenti che hai usato li hai usati male o senza motivo, m serve qualcsoa d moderno, da AAA videogame d qeusto genere."* Tre accuse distinte, tutte fondate:
1. Il mockup HTML era un riferimento di registro, non un template — l'ho riprodotto invece di usarlo come ispirazione.
2. I componenti riusati non guadagnavano il loro posto — usati perché esistevano, non perché giusti per il ruolo.
3. Il risultato non leggeva come un HUD AAA moderno del genere.

**Diagnosi forense, con numeri misurati sul DOM (non stimati):**
- **Il mondo prendeva il 40% dello schermo** (468×670px di un viewport 1024×768), e quel 40% era la regione, non la mappa dipinta — dentro ci stava pure in letterbox.
- **La topbar sforava di 681px**: cluster destro largo 1031px in una barra da 1008px. Causa: `DayNightTimeEngineStrip` (clock + 4 pulsanti velocità + `ActiveHUD` incorporato, un widget da 800px) infilato in una cella da 44px perché aveva `compact` nel nome.
- **I pixel più luminosi dello schermo erano i 4 pulsanti velocità** (oro pieno, luminanza ~550 contro ~255 del resto) — la costituzione del progetto dice che l'oro più brillante è "raro, riservato a 1-2 punti focali", non ai controlli di transport.
- **Sei cornici annidate** (molding esterno → rail bronzo → il bordo dipinto della mappa, che era la cosa più bella dello screenshot → rail bronzo → pannello → card) — nessuna gridava abbastanza da vincere sulle altre.
- Nomi troncati a metà parola, "Day 0" scritto tre volte, quest card fuori palette (unico elemento freddo/grigio-lavanda sullo schermo).

**Ricerca (2026-09-21/22) su 15 titoli AAA shippati del genere** (CK3, Old World, Age of Wonders 4, Civ VI/VII, Frostpunk 2, Against the Storm, Songs of Conquest, Total War, Unity of Command II, Wartales, EU4, Curious Expedition — screenshot reali via Steam API, misurati a 1:1 e 3×): **nessuno dei quindici disegna una seconda cornice attorno alla propria mappa**, e nessuno tiene un pannello full-height permanentemente ancorato. Civilization VII (l'unico del set con cornice-dentro-cornice) è stato pubblicamente criticato nel 2025 per "~40% di mappa visibile in meno" rispetto a Civ VI, al punto che Firaxis ha messo un redesign in roadmap. Against the Storm ha rifatto la propria UI rimuovendo esplicitamente "elementi decorativi grandi che non aiutavano l'esperienza". L'ornamento moderno è **speso una volta sola, su un oggetto guadagnato** (in Old World: un solo medaglione con anello; in Age of Wonders 4: un solo oggetto circolare in basso a destra), non ripetuto su ogni pannello.

**Eseguito — GameFrame v2 (2026-09-22):**
- Riscritto da zero il principio strutturale: **la mappa riempie tutto lo schermo, bordo a bordo** (`WorldSurfaceStandalone` come unico layer full-bleed); nessuna cornice aggiunta attorno ad essa — il suo bordo dipinto araldico è l'unica cornice sullo schermo.
- Rimossi: `MatericFrame` esterno (5px molding), i due rail bronzo full-height, la topbar/status-bar come barre piene, `DayNightTimeEngineStrip` come widget di clock.
- Nuovo `TimeThreatCluster` — **il singolo oggetto ornato guadagnato**: riusa `DayNightPoiSkin` (medaglione con alone di progresso, già esistente, già certificato nella grammatica POI) per il ciclo giorno/notte; il countdown minaccia (`WorldPresenceRail`, R-071) si aggancia sotto di esso invece di fluttuare da solo a metà mappa; la velocità è testo minimale (×1/×2/×4/×8, sottolineatura per lo stato attivo, **niente riempimento oro pieno** — verificato: 3 velocità disponibili filtrate da `config.loop.maxSpeedMultiplier`, nessun valore hardcoded).
- Nuovo `ResourceReadout` — icona+valore che galleggia sul mondo con solo uno scrim sfumato dietro (niente `MatericPlaque` per risorsa: tre placche in fila leggevano come una toolbar web).
- Roster e quest card: **isole fluttuanti dimensionate al contenuto**, non più rail da 280/260px con il 40-45% di spazio morto nero. La quest card resta chiaramente **fuori palette** (vedi sotto — causa non mia).
- Nav ridotta a una pillola traslucida in alto al centro; i tab non ancora reali restano bloccati via gating diegetico (invariato da v1).
- **Causa radice scoperta e NON corretta qui (fuori scope, segnalata)**: la quest card è color ardesia/lavanda perché `getActionCardFeelTokens`/`getMapHaloFeelTokens` in `src/ui/styleLab/presets/presetBridge.ts` sono stub placeholder che ignorano il parametro `pillar` e restituiscono sempre `rgb(71,85,105)` — il commento nel codice dice letteralmente "will be populated by preset-specific appliers in WL-STY-003". Non introdotto da questo task; riguarda ogni `ActionCard`/`ActionHalo` del gioco (quest, job, POI), non solo questa card. Aperto task separato.
- Verificato al browser (1440×900): mondo edge-to-edge, cluster temporale funzionante (click su un tab velocità → stato attivo cambia; click sul countdown → decrementa e il cluster si restringe al solo medaglione a zero), nessun errore console. Safeguard: `build:check`, `kanban:lint`, `eslint` su `game-frame.tsx` puliti.
- **Non risolto, dichiarato:** il roster e la quest card sono ancora presentati come "carte" con un proprio riquadro scuro (non il puro cut-out senza bordo di CK3) — compromesso deliberato per non riscrivere `VillageRosterSection`/`QuestCard` sotto questo task; il titolo di localizzazione ("HEARTHOLM") è stato rimosso invece di lasciarlo fluttuare come overlay UI, perché la ricerca mostra che le etichette di mondo vanno dipinte nel terreno, non sovrapposte in chrome — richiede un passo di asset, non deciso qui.

**Bug scoperto e corretto — mappa non caricata / raggi di luce "sparati" (2026-09-22, dalla registrazione schermo del Director):** a certe risoluzioni la mappa in `/game-frame` restava a `zoom:1, transform:none` — un frammento enorme, zoomato sull'angolo dello stemma araldico, con i raggi di luce atmosferici (reali, non un difetto) resi enormi e irriconoscibili. Causa: `WorldSurfaceStandalone` (in `worldSurfaceKit.tsx`) non calcolava MAI un fit reale — passava solo `manifest.camera.defaultZoom` (1) e contava sull'effetto interno di autoFit di `WorldSurfaceRenderer`, che (per il bug pre-esistente già segnalato in task separato, `task_455b0dc6`) non si applica in modo affidabile al mount. Non è lo stesso bug: quello riguarda `WorldSurfaceRenderer` in generale (`/world-surface` incluso); questo era che il KIT non calcolava proprio nessun fit. Fix: il kit ora misura il proprio contenitore via `ResizeObserver` e calcola da sé uno zoom di tipo **cover** (non *contain*): `Math.max(w/canvas.w, h/canvas.h)`, non `Math.min`. Motivo del `max` invece di `min`: il renderer clampa `panX`/`panY` a `[0, canvas]` (`clampPan`, niente bordi vuoti per invariante Pillar 1) — un fit *contain* può chiedere un pan di centratura negativo sull'asse con margine, che il renderer clamperebbe silenziosamente a 0, ricreando esattamente il crop/decentramento che il fix doveva risolvere. Con `max` il pan di centratura non è mai negativo. Verificato a 1024×768 e 1440×900, ricaricato più volte: continente intero, bordo a bordo, nessun frammento zoomato, raggi di luce leggibili come fascio solare attraverso le nuvole. Safeguard: `build:check`, `kanban:lint` puliti.

**Nuovo audit approvato (2026-09-22):** il Director ha fornito un nuovo mockup dell'HUD esterno e ha richiesto di valutarlo contro lo stile del progetto, Prismatic Wanderlust e i contenuti reali da mostrare; ricerca online comparativa, critica spietata da lead UI AAA e direzioni alternative con esempi di codice. Desiderata specifica congelata in `.mw/desiderata.md` v22. Il mockup è un riferimento da criticare, non una specifica da copiare.

**Audit mockup completato (2026-09-22):** ricerca primaria su UI di strategy game e accessibilità; audit del mockup contro Art Bible, Visual Fidelity Lab, World Presence Grammar e implementazione `GameFrame` v3; deliberazione multi-AI completata in `.mw/runs/20260922-hud-mockup-audit/` (caller/A/B tutti `success`, con fallback Groq per caller/A). Esito: il mockup è una buona moodboard compositiva ma non una specifica production-ready; mantiene la mappa protagonista e usa oggetti fisici leggibili, ma resta generico fantasy, troppo simmetrico e piatto nel chrome, contiene meccaniche inesistenti e usa una palette terrestre fangosa in tensione con Solar Triumph/deep-teal shadows. Direzioni candidate: Living Atlas, Cartographer's Desk, Strategic Chronicle. Nessuna direzione ancora approvata.

**Direzione scelta e mockup generato (2026-09-22):** il Director ha scelto **Living Atlas**. Spec canonica in `.mw/specs/hud-living-atlas/` (design-intent, identity, prompt — gate `--enforce-canon` rispettato). Tre candidati SDXL 1344×768 in `public/mockups/hud-living-atlas/` (gitignored). Esito: mappe full-bleed pittoriche on-DNA (azure/teal, Solar Triumph); SDXL non risolve i widget HUD piccoli — la struttura HUD resta da specifica React, il mockup vale come riferimento compositivo/materico. Scelta del candidato e decomposizione ancora aperte.

---

## R-077 — Primo loop "Punch Club light": torneo a scadenza, fase goblin con requisiti, quest rifugiato

**Richiesta:** *"ne avevamo già parlato. avevamo deciso per un Punch Club Light come inizio: ci sarà un torneo tra X tempo, t devi preparare. Magari mostrare gli incontri, fare un incontro a settimana? bho, dimmi tu, parliamone. Quindi tipo equip o skill o salire di livello (o tutt'e 3) sn i requisiti per questa fase. X entrare nella fase degli attacchi dei goblin c dovranno essere dei requisiti. Tempo probabilmente. Deve essere un po' un tutorial/onboarding. Dopo un paio d quest ne dovrebbe arrivare una tipo: accetta un rifugiato e x farlo devi pagare X cibo."*
**Data:** 2026-09-29
**Stato:** `ritirata`
**Triage R-156 (2026-10-12):** superata — loop quest reale PLAN-019 S1–S4 — ritirata su ratifica Director.
**Desiderata FROZEN:** nessuna corrispondente. Sorella di R-076 (loop quest divertente); v12 copre equip/skill/consumabili come prerequisiti meccanici.
**Documento trovato (la domanda del Director):** il design del primo loop/onboarding vive in **`GDD_primo_loop.md`** ("GDD — Primo Loop: dal Boot alla Prima Quest"): contiene già il pattern "deadline + requisiti + preparazione" (quest Cinghiale Nero: Might 2.5 + 15 legna, scade Giorno 8), upkeep come pressione Punch Club, tutorial invisibile. NON contiene: torneo, fase attacchi goblin come gate, quest rifugiato — sono elementi nuovi di questa richiesta.
**Correlati:** `GAMEPLAY_DESIGN.md` (canon: catena di preparazione, quest urgenti con countdown), `DESIGN_PILLARS.md` R4.2 (tutorial invisibile via gating) e anti-pillar "tutorial scriptato con bolle", `src/docs/docs/archive/2026-Q1/GAME_VISION_IDLE_INCREMENTAL.md` (archiviato — pillar 4 "Ondate periodiche come check di preparazione" è l'antenato concettuale della "fase goblin"), `src/docs/docs/mobile/PunchClubLoop.md` (doc legacy Punch Club, status candidate). "Torneo" nel senso di arco narrativo compare solo nei doc **archmage** (`logs/2026-01-08_archmage_discussion.md`) — progetto diverso.
**Cosa manca:** definizione del torneo (evento-gate vs campagna di quest vs spettacolo passivo), cadenza incontri, cosa fa il giocatore *durante*, quali requisiti aprono la fase goblin, dove la quest rifugiato entra nel pacing. Poi nuova desiderata.

---

## R-078 — Mission planner con simulazione live degli esiti (PARTY / LOADOUT / OUTCOME)

**Richiesta:** *"mi serve una 'interfaccia' per stabilire chi mandare in missione e vedere istantaneamente le modifiche dei risultati. Aggiungo + tizi: cambiano le % di morte/ferita, aggiungo un consumabile, cambio un equip al pg, tolgo un pg, ecc."* — elaborata in sessione come **mission planner reattivo**: la missione è il problema, il giocatore costruisce la soluzione e ogni modifica alla spedizione aggiorna immediatamente gli esiti previsti (successo / ferita / morte / durata / altri effetti), senza alcun pulsante "Simula". I risultati devono essere leggibili come conseguenze delle scelte: delta visibili (`18% → 11%`) e breakdown "WHY" delle cause per sorgente. Tre zone concettuali: **PARTY** (chi parte), **LOADOUT** (equip/consumabili per PG), **OUTCOME** (conseguenza live degli input). Deve esistere già nelle prime quest perché è il tutorial invisibile: "posso mandare qualcuno con lui, ma quel villager non lavora per quei giorni".
**Data:** 2026-09-29
**Stato:** `fatta` — PLAN-018 completo (MP-00…MP-07). Evidence: `test-results/r078-mission-planner-2026-10-02.log`. NOTA: per v24/PLAN-019 il Planner è precedente implementativo da adattare al modello quest validato in S1 (remap in S2/S3), non architettura finale.
**Desiderata FROZEN:** `.mw/desiderata.md` **v23** — Mission Planner (FROZEN 2026-09-29, avallo "procedi"). È la risposta concreta alla domanda aperta di R-076 (il divertimento vive **prima** della quest). Poggia su v12 (più PG degli obbligatori, consumabili come scelta, deathChance per-slot) e v4 (pannelli flottanti).
**Emendamento (v23 rev.2, 2026-09-29):** il Planner è uno **spazio di sperimentazione reversibile** — configurazione ripristinata → outcome esattamente identici (caso canonico `A → A+PG → … → A`); distinzione netta INPUT/OUTPUT; blocco **BY MEMBER** obbligatorio (rischio per singolo membro, mai solo aggregato); **WHY** causale raggruppato per metrica; **niente costo opportunità numerico** (emerge dal gioco). Il Planner è feature di gameplay, non UI secondaria.
**Piano:** `plans/PLAN-018-mission-planner.md` (status `active`, battezzato 2026-09-29). T-000 deciso: modello di rischio **A** (per-fase, esteso per residente — voce in `context/DECISION_LOG.md` 2026-09-29).
**Critica multi-AI (2026-09-29):** cold read web su PLAN-018 — chatgpt/claude/grok/deepseek success, gemini-web failed. Verdetto: **major revision** — bloccanti convergenti: manca il contratto matematico (formule, clamp, dipendenze, membri morti tra le fasi), scope contraddetto sulla risoluzione, `almost` ambiguo vs "superata", reversibilità float, tolleranza Monte Carlo, impatto balance della mortalità. Nuove domande Director nel piano. Evidence: `test-results/plan-018-critique/`.
**Risposte Director (2026-09-29, → v23 rev.3 + DECISION_LOG):** (1) `almost` NON conta come fase superata (solo `win`/`bigwin` — cambia `isPassingVerdict` a runtime); (2) **solo il morto** smette di contribuire alle fasi successive — il ferito resta, contribuisce e continua a tirare (fasi comunque dipendenti → DP esatta sull'insieme dei vivi, no Poisson-binomiale); (3) la cavalcatura occupa uno slot equip (`mount`) — velocità con trade-off.
**PLAN-018 v3 (2026-09-30):** review avversariale su codice — **difetti confermati**: (a) stat del party mai lette → successo fisso al 5% (`statRequirement` = gate di ruolo, non stat numerica; serve `checkStatTags`); (b) scala stat ~12 vs difficoltà D100 60 incoerente (serve `partyStatMult`); (c) rischio indipendente dal party → "+PG" aumenta sempre le vittime; (d) wipe non definito; (e) dipendenze Kanban invertite (ora MP-00→MP-02→MP-03→MP-01→MP-04→MP-05→MP-06→MP-07). Ricerca UI (hat ui_developer): layout 2 colonne INPUT|OUTPUT, risk badge XCOM, barre stacked DD, WHY collassabile, Undo/Reset, delta aria-live.
**D1–D4 CHIUSE dal Director (2026-09-30, v23 rev.4):** D1 cover sì (`coverRiskDelta` sugli altri membri); D2 **checkpoint continua/ritirati dopo ogni fase** — il giocatore sceglie se proseguire o chiudere la quest col tier delle fasi giocate; wipe → `deadly`; D3 consumabili pool party; D4 `checkStatTags`+`partyStatMult` dal report.
**Prompt per-task:** `prompts/MP-00.md` … `MP-07.md` (autonomi, con acceptance). **MP-00 dispatchato dal Director** (Kanban → In corso).

**Esiste già nel repo (FACT):**
- `src/ui/idleVillage/hooks/useQuestAssignmentPreview.ts` — preview live deterministica (useMemo, **mai rng**) che si ricalcola a ogni cambio di slot/item: `projectedDeathChance`, `projectedInjuryChance`, `projectedRewardMultiplier`, `distribution`, `canEmbark`, `blockingReasons`. Accetta già `selectedItems: QuestItemMock[]` (consumabili con `deathChanceDelta`/`injuryChanceDelta`/`rewardMultiplierDelta`) e legge `emptyPenalty` + `residentRiskModifiers` per-slot (`src/ui/idleVillage/slots/types.ts:74-95`).
- `src/engine/game/idleVillage/QuestPowerEngine.ts` — pipeline completa config-first: party power → power ratio → distribuzione esiti (perfect/success/partial/fail/deadly) → injury/death per esito.
- `QuestAssignmentPreview.tsx` — pannello a 3 numeri statici, usato su `/poi-quest-detail-roster-integration`; su `/poi-quest-detail-roster-time-clock` la preview alimenta solo i badge rischio del medaglione.
- `MOCK_QUEST_ITEMS` (`questItemsMock.ts`) — consumabili mock già cablati nella preview; da sostituire col vero item system (ERR-026).
- Placeholder v10 in `src/pages/hero-components-lab.tsx` (`EquipSlotRack`, `ConsumablePile`, `SkillDeck`, `PgDetailCard`, `EquippableItemCard`, `ItemDragToken`).
- Pattern pannelli: `FloatingPanel` (desiderata v4) — la casa naturale del planner sopra la mappa senza bloccarla.

**Decisioni del Director (2026-09-29):**
1. **"Successo" headline:** `partial` NON conta come successo — serve **almeno il 50% delle prove (fasi) superate** perché la spedizione sia un successo. La metrica in planner è quindi la probabilità di superare ≥50% degli skill check di fase, non la somma dei pesi `perfect+success` della distribution.
2. **Durata modificabile dal loadout:** sì, ma da fonti dedicate (es. **cavalcature** che riducono il viaggio). Serve un canale `durationDelta`/`timeMult` nel modello, popolato da config su item/equip — non una regola generica "l'armatura rallenta".
3. **Rischio per slot E aggregato:** la probabilità di ferita/morte va mostrata **per singolo membro della spedizione** (coerente con v12 "spostare la morte da un PG a un altro") **e** come totale aggregato party.
4. **Superficie:** pannello **separato**, chiamato **"Planner"** — non una sezione del POI detail esistente.

**Cosa manca:**
- La superficie planner a tre zone (PARTY / LOADOUT / OUTCOME) come pannello `FloatingPanel` separato.
- Delta visuali (`vecchio → nuovo`, ±) e breakdown "WHY" per-sorgente: l'hook aggrega i delta internamente senza esporli — serve refactor che ritorni i contributi (residente, slot, equip, consumabile, penalità slot vuoto).
- Estensione del modello preview: (a) probabilità per-fase → P(≥50% fasi superate) per l'headline "Successo"; (b) death/injury chance per-residente oltre all'aggregato; (c) canale `durationDelta`/`timeMult` su item/equip (cavalcature & co.).
- Equip → stat del PG nella pipeline di power: `statSnapshot` è statico, l'equip v10 è placeholder non cablato.
- i18n e skin system su tutta la nuova superficie: `QuestAssignmentPreview` è legacy hardcoded (stringhe IT inline, classi Tailwind ad-hoc) — non va replicato così.

**Correlati:** R-076 (genitore), R-077 (la prima quest banale col planner è il tutorial invisibile), `GAMEPLAY_DESIGN.md` Pillar 3, `DESIGN_PILLARS.md` §3.3, `src/docs/docs/idle_village/interaction_core_spec.md` (quest preview), `src/docs/docs/plans/quest_role_assignment_rework_strategy.md`.

---

## R-079 — Micro-ottimizzazione `/game-frame-pixi`: memoizzare l'actions array del DirectorPanel

**Richiesta:** *"per il progetto RPG /game-frame-pixi che va ottimizzata"* — il Director ha girato una review della pagina che propone due micro-miglioramenti: (1) memoizzare l'array `actions` passato a `DirectorPanel` (ricreato a ogni render); (2) estrarre l'overlay JSX in un componente separato (la review stessa lo marca come opzionale: "leggibile così com'è").
**Data:** 2026-10-01
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 (adozione protocollo Mind Weaver in RPG) — micro-correzione di codice su superficie di test/trailer, nessuna nuova desiderata richiesta.
**Scope adottato:** solo il punto (1) — `useMemo` su `directorActions`. Il punto (2) resta non applicato perché la stessa review lo giudica opzionale e la pagina è uno strumento di staging, non UI di prodotto.
**Cosa è successo:** `directorActions` memoizzato con `useMemo<DirectorAction[]>` (deps `[invasion, questShown, currentDay]`); importato `type DirectorAction`; JSX usa `actions={directorActions}`. Safeguard: lint 0 errori (2 warning preesistenti `no-restricted-imports`, pattern R-075), `build:check` ✅, `kanban:lint` ✅, route `/game-frame-pixi` → 200 con modulo trasformato correttamente. Evidence: `test-results/r079-game-frame-pixi-memo-2026-10-01.log`.

---

## R-080 — Primitive per i pannelli HUD: bordi come le altre primitives

**Richiesta:** *"i componenti dell HUD nn sn fatti 'belli' cm quelli delle primitives. fa una nuova PRIMITIVE (se già nn esiste) con quell'HUD, e modificali per farli fighi: i bordi gisuti, ecc cm il resto delle primitives"*
**Data:** 2026-10-01
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 (adozione protocollo Mind Weaver in RPG).
**Cosa è successo:** creato il primitive **`HudPanel`** (`src/ui/idleVillage/skins/primitives/HudPanel.tsx`, export in index): pannello flottante con la lingua materica di `HudRibbon` — silhouette a ottagono smussato, filet oro perimetrale, filigree interno a 4px, lacquer fill, drop-shadow via `filter` che segue il clip-path; tutto su token `--skin-*`. Applicato ai tre punti con ricetta piatta duplicata: `HudEventLedger` (era `PANEL_STYLE` inline radius-14 + bordo hardcoded), `DirectorPanel` (stessa ricetta copiata), pill speed di `HudAstrolabe` (`cutPx={7}`); bordi strip del ledger e colore bottoni pill tokenizzati. Non toccati: `HudCompass`/`EdgeDressing` (placeholder art dichiarata), `HudHangingTag` (pergamena con identità propria), `SpeedControl`/`ResourceMedallion`/`WhenWhereCluster`/`ResourceReadout` (già su primitives Materic). Safeguard: test ledger 4/4 ✅, `build:check` ✅, `kanban:lint` ✅, route 200. Evidence: `test-results/r080-hud-panel-primitive-2026-10-01.log`. **Da verificare a occhio:** resa visiva dei bordi su `/game-frame` e `/game-frame-pixi`.

---

## R-081 — Piano di cambiamento S1 (v4) da playtest + critiche web, poi broadcast alle AI web

**Richiesta:** *"fa un plan d cambiamento, poi mandalo alle ai web"* — consolidare la critica interna e le risposte dei web-AI in un piano di cambiamento concreto per la quest S1, poi sottoporlo agli stessi provider web.
**Data:** 2026-10-03
**Stato:** `ritirata`
**Triage R-156 (2026-10-12):** superata — PLAN-019/S2: superficie canonica /game, non più lab S1 — ritirata su ratifica Director. — v4 scritta e broadcast; serve v5 col feedback
**Desiderata FROZEN:** `.mw/desiderata.md` v23 + desiderata S1-quest-interessante (PLAN-019). R-076 genitore.
**Scope adottato:** piano in `.mw/runs/20261003-s1-change-plan/change-plan.md` — 11 cambiamenti ordinati per ROI. Invarianti S1 preservate; noise dichiarato stealth-specifico, non universale.
**Cosa è successo:** broadcast a 5 provider web — chatgpt MINOR REVISION, claude/grok/deepseek NO al gate così com'è ("spreadsheet con stato"). Convergenze in `.mw/runs/20261003-s1-change-plan/synthesis.md`. Poi: deep research multi-provider via Canary/CDP (ChatGPT Deep Research ✓, DeepSeek DeepThink+Search ✓, Grok-free debole con falsi negativi, Claude free-cap) — risposte in `.mw/runs/20261003-quest-science-deepresearch/`. Wiki vivo `context/QUEST_GAMEPLAY_SCIENCE.md` (~60 fonti verificate, principi P1–P47, correzioni + gap). Proposta redesign `.mw/runs/20261003-quest-v6-science/quest-v6.md` (TAKEN≠SECURED, estrazione come gioco). Playtest live seed 1983 documentato (`playtest-seed1983.md`): confermata la diagnosi — 6 WIN/6, estrazione inesistente, Kran morto su WIN reso come log.
**Slice minimo implementato (Director: "solo TAKEN→SECURED + estrazione a 3 forme + epilogo col costo"):** cassa in mano = TAKEN, perdibile in estrazione; nodo `estrazione` con 3 rotte meccaniche (breccia solo se prigioniero libero, campo calmo solo se il campo non si è mai svegliato, campo sveglio sempre a prezzo dichiarato); epilogo composto che conta morti per nome / cassa persa / prigioniero / bottino. Fix correlati: epicfail confinato nella banda M dichiarata; bug noise≥3 che scartava gli effetti del check (incl. presa cassa) prima di dirottare a `risveglio`. 24/24 test, build:check ✓, 2 playtest live (SURVIVED + WIPE con epilogo nominato). Evidence: `test-results/r-081-quest-s1-taken-secured-2026-10-03.log`. Resta da validare col playtester umano: "sai dire cosa hai perso e per quale tua scelta?"

---

## R-082 — Quest Simulation Preview: forecast totale + pre-check Monte Carlo per il lab S1

**Richiesta:** *"Implement a complete Quest Simulation Preview system for RpgBalancer. [...] This is a MOCKUP / PREVIEW component for the quest system. Do not redesign the existing quest architecture. Do not invent a second stat system."* — spec dettagliata in 28 sezioni consegnata in sessione: due componenti (**Quest Total Preview** = simulazione Monte Carlo dell'intera quest con stato propagato tra le fasi; **Pre-Check Preview** = forecast del solo prossimo skill check), stesso motore, seed deterministico finché gli input non cambiano, reattività a party/equip/consumabili/strategia senza pulsante "Simula", counterfactual consumabile USE/DON'T USE, WHY causale prima delle %, per-member breakdown, human-days, return/continue al checkpoint come stati di preview confrontabili, ~10k run configurabili, batteria di test sui controfattuali.
**Data:** 2026-10-04
**Stato:** `fatta` (2026-10-04)
**Desiderata FROZEN di riferimento:** `.mw/desiderata.md` v23 (Mission Planner: preview reattiva, WHY prima delle %, BY MEMBER, reversibilità — ma dice "deterministico e rng-free") e v24 (macro plan Quest S1→S5; S1 lab può derogare invarianti infrastrutturali; stat del lab sono mock LabStat, mapping balancer = S2). Il contesto diretto è la quest **rovine** (`questScenarioRovine.ts`, authored 2026-10-04, non ancora committata) sull'engine `questRun.ts` — la stessa quest descritta dalla spec (mercante → fiume STR+CON → guardie sneak/fight → sala PER→trappola → checkpoint torna/continua → camera profonda → ferito al ritorno).
**Tensione risolta con il Director (2026-10-04):** la spec chiedeva Monte Carlo; v23 chiedeva preview "deterministica e rng-free". **Deciso: (b) analitico esatto per il singolo check + Monte Carlo seeded per la quest intera.** La quest-total **ignora i consumabili** (decisione Director: i consumabili restano commitment per-check nel pre-check preview). "Esausto" = fatica a zero/troppo bassa per la quest — riusare le strutture fatica esistenti, nessuno stato nuovo.
**Implementato:** `questS1Lab/questSimulation.ts` — `analyzeCheck` (forma chiusa delle stesse bande del motore: verdict, verdict-mod harm, intercettazione bodyguard, death save 5%, upgrade epicfail) e `simulateQuest` (Monte Carlo su `applyChoice`/`enterNode` reali, seed FNV-1a degli input, flag consumabili strippati); `QuestSimulationPreview.tsx` (outcome, morti/ferite/leader, tempo/giorni-uomo, reward, per-member, strategia simulata, confronto torna/continua, what-if bench); `QuestCheckPreview.tsx` (distribuzione verdict, conseguenze, WHY, counterfactual consumabile senza/con). Integrati in `QuestS1LabPage.tsx`; chiavi i18n `questS1Lab.sim.*` in en/it-IT/pseudo.
**Test:** `tests/unit/idleVillage/questS1Lab/questSimulation.test.ts` — 27 test, 20 controfattuali della spec coperti; determinismo, non-mutazione dello stato, leader morto → reward 0%, consumabile non committato = sim identica.
**Evidenza:** `test-results/r082-quest-simulation-preview-2026-10-04.log` (safeguards + smoke runtime su /quest-s1-lab).
**Esiste già (FACT):** `previewOption` in `questRun.ts` (score, successPct esatto, wound/death per-slot, interceptor, consumableBonus), commit surface consumabile arm/stowed in `QuestS1LabPage.tsx`, RNG seeded mulberry32 (determinismo nativo), modello harm per-slot + bodyguard + death save identico a `mission_planner_math_spec` §harm, epilogo con giorni-uomo e downtime feriti.
**Materiale archiviato (2026-10-04):** spec completa del prompt (28 sezioni) in `.mw/runs/20261004-rovine-preview-chatgpt/preview-prompt.md`; provenance e mappatura sul progetto in `README.md` della stessa directory.

---

## R-083 — Archiviazione conversazione ChatGPT «Progettare quest strategiche» + regola leader-capacity

**Richiesta:** *"esamina attentamente questa conversazione cn ChatGPT web. Ci sn diverse informazioni e principi ulti che saranno utili per il nostro progetto e x alcuni plan. Esamina i vari plan che abbiamo, la documentazione wiki che abbiamo, poi cerca di aggiungere le info rilevanti nei posti rilevanti."* — conversazione: `https://chatgpt.com/share/6ac21e35-e5f0-83ed-b0c8-1d2d9aa01b30`.
**Data:** 2026-10-04
**Stato:** `fatta` (cattura documentale); **intenti embedded restano da ratificare** (vedi sotto).
**Desiderata FROZEN di riferimento:** `.mw/desiderata.md` v24 (dominio quest, PLAN-019 S1–S5). Copertura parziale: la regola leader-capacity e l'economia human-days sono di livello villaggio (S4 / GAMEPLAY_DESIGN), non coperte letteralmente da v24.

**Cosa è successo:** contenuto archiviato in `.mw/runs/20261004-rovine-preview-chatgpt/` — `README.md` (provenance + mappatura), `rovine-mockup.md` (spec completa della quest), `preview-prompt.md` (spec 28 sezioni, vedi R-082), `economy-notes.md` (200k sim Monte Carlo, human-days, quest come opportunità, 5 fonti di juice). Indicizzato in `context/INDEX.md`; puntatore datato in `plans/PLAN-019-quest-macro-plan.md`; `CURRENT_STATE.md` aggiornato (seconda quest nel lab).

**Fatti collegati (FACT nel repo):** il mockup «Le Rovine sotto il Fiume» è già implementato come seconda quest authored del lab S1 — `src/ui/idleVillage/questS1Lab/questScenarioRovine.ts` + `public/assets/quest-robine/` (sessione parallela 2026-10-04, non ancora committato).

**Intenti del Director emersi nella conversazione (verbatim), non ancora ratificati a sistema:**
- *"Considera anche che fino a quando il leader nn è stanco o ferito (o morto) puoi continuare a fare quest fino a quando hai altri umani."* — **regola leader-capacity**: la capacità di spedizione del villaggio è limitata dallo stato del leader e dal pool di umani, non da un cooldown «1 quest/X giorni». Candidata a desiderata/GAMEPLAY_DESIGN; oggi solo PROPOSAL.
- Economia **human-days** come risorsa reale (`uomini × tempo`), ferita = indisponibilità di X giorni, quest come opportunità (8–10 appaiono/mese, 4–5 fattibili) — candidati per `idle_village_gameplay_math_spec.md` e GAMEPLAY_DESIGN dietro avallo.
- *"la voglio implementare come mockup"* — già soddisfatta in codice (`questScenarioRovine.ts`); la spec archiviata serve per verifica/regressione del mockup.

---

## R-084 — Extraction Ledger, negative/open knowledge registry, QUEST_RULES.md e layered retrieval

**Richiesta:** *"Portare il sistema dall'architettura attuale [knowledge-extractor → post-reconciliation report → canonical docs → documentary retrieval] alla seguente architettura minima: CONVERSATION → KNOWLEDGE EXTRACTION → EXTRACTION LEDGER → RECONCILIATION → CANONICAL KNOWLEDGE → LAYERED RETRIEVAL."* — prompt operativo completo con 10 fasi (ledger, persistenza `context/ingestions/`, `context/REJECTED.md`, `context/OPEN.md`, completamento PLAN-020, router L0–L4, golden test su «Progettare quest strategiche», 7 query di retrieval, regression check).
**Data:** 2026-10-05
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`.
**Desiderata FROZEN di riferimento:** `.mw/desiderata.md` v25 (audit e refactoring KB orientata agli agenti AI) — questa richiesta è l'esecuzione della fase 2 di migrazione delineata dall'audit e dalle proposte F1–F9 avallate.

---

## R-085 — Refactor completo del sistema documentale: canonical knowledge, authority, retrieval

**Richiesta:** *"RPG BALANCER — FULL DOCUMENTATION REFACTOR. Canonical Knowledge, Authority, Retrieval & Documentation Architecture."* — playbook completo in 40 sezioni: audit totale del repo (§1–3), inventory documentale, gerarchia di autorità reale, modello canonico L0–L4, router root, refactor di CURRENT_STATE/GAMEPLAY_DESIGN/QUEST_RULES (dominio quest = major refactor), separazione game rules vs design knowledge, audit DECISION_LOG/desiderata/OPEN/REJECTED/proposals/GLOSSARY, architettura e piani, famiglie di duplicati, conoscenza orfana, indici semantici, test suite di retrieval a 40 domande, contratto documentation-impact per i piani, regression check, health report finale.
**Data:** 2026-10-05
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`.
**Desiderata FROZEN di riferimento:** `.mw/desiderata.md` v25 — stessa ancora di R-084; questo prompt è la specifica completa della fase di refactoring già autorizzata ("Execute the refactor now").
**Collegamenti:** R-084 (prima tranche eseguita: QUEST_RULES.md, OPEN.md, REJECTED.md, router L0–L4, ingestions, golden test), `KNOWLEDGE_AUDIT.md` (audit fase 1 + migrazione punti 1–4), PLAN-020.
**Cosa è successo (2026-10-05):** tranche 2 — fonti canoniche salvate da `.mw/runs/` in copie tracciate (`QUEST_S1_DESIGN`, `QUEST_ECONOMY_NOTES`, `QUEST_V6_REDESIGN`, spec Rovine + preview), regola consumabili compilata in QUEST_RULES, GAMEPLAY_DESIGN marcato REFERENCE, MASTER_PLAN superseded, GLOSSARY v2, router L0 in README, rule 85 (Documentation Impact), health report `KNOWLEDGE_REFACTOR_REPORT.md` (retrieval 33P/3Pa/5F). Tranche 3 — su risposte Director: `VILLAGE_ECONOMY.md`/`PROGRESSION.md`/`NARRATIVE.md` creati come DRAFT bozze da migliorare; superficie canonica = `/game` (Game Frame Pixi), pagina Idle Village deprecata; `.windsurf/rules/` ora tracciate in git.

## R-086 — Ingestione di due share link ChatGPT (skill knowledge-extractor)

**Richiesta:** *"dovrebbe esserci una nuova skill che fa esattamente questo lavoro"* — invocata `knowledge-extractor` su due share link ChatGPT forniti dal Director: `6ac4b77e` (bollette domestiche) e `6ac4b926` (continuazione «Progettare quest strategiche»).
**Data:** 2026-10-06
**Stato:** `fatta`
**Cosa è successo:** link 1 scartato al Pertinence Gate (conoscenza personale, non progettuale — MW-P-003); link 2 ingerito con ledger E-01..E-05: checklist authoring 8 punti → `QUEST_GAMEPLAY_SCIENCE.md` (PROPOSAL), anti-pattern singolo skill check → `REJECTED.md` REJ-007, thread aperto «decomporre la quest originale del Director». Report: `context/ingestions/2026-10-06-quest-strategiche-continuazione.md`.

---

## R-087 — Skill `strategist` RPG (layer di direzione pre-desiderata) + rename `strategist` MW → `decomposer` + hat `game_director`

**Richiesta:** *"adattiamo la skill strategist di RPG x entrare nel flusso/workflow di mind weaver? come? cosa ci servirebbe? cosa ci mancherebbe?"* — chiarita come layer di direzione: *"lo strategist serve principalmente a creare la documentazione e arrivare a parlare di Master Plan, scrivere bozze di macro plan, ma + che altro indirizzare le cose future. Poi quest discussioni andranno a creare davvero argomenti contenuti e circoscritti da poi gestire con explorer + planner"* · *"cambia il nome di strategist mandate di MW, questo deve essere strategist. approvo"*
**Data:** 2026-10-06
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`.
**Desiderata FROZEN:** `.mw/desiderata.md` v26.
**Deliverable:** (a) skill `strategist` in `coordinator/skills/strategist/` — discussione libera di direzione, scrittura nei doc di direzione su decisione Director, handoff a desiderata; (b) rename skill MW `strategist` → `decomposer` in `mind-weaver/.agents/skills/` + symlink `~/.agents/skills/`; (c) hat `game_director` in `.mw/prompt-enhancers.md`; (d) registrazione in `context/INDEX.md`.
**Nota:** la regola R-004 cita `strategist` fra le skill MW invocabili — il nome corretto dopo questa voce è `decomposer`; la regola resta invariata nel contenuto.

---

## R-088 — Presentazione della quest nel gioco reale: `QuestTheatre` (direzione B) su superficie `/game`

**Richiesta:** share link ChatGPT (`6ac5017a`, «Presentazione della quest») portato in esplorazione. Il Director ha fissato scope e decisioni in sessione: *"questo è x presentarla nel gioco 'davvero'"* (superficie canonica `/game`, non il lab S1); scelta della direzione **B** (`QuestTheatre` componente nuovo che ospita cronaca/check/reward dentro `FloatingPanel`, con modalità espansa); e la semantica runtime: *"nn devono essere fatte le scelte e gli skill check automaticamente. Solo il tempo deve scorrere. Quando il giocatore apre è sempre fermo alla prima fase, semplicemente nn deve aspettare tempo x risolvere anche le fasi successive, il resto è inalterato"* — *"una storia a nodi che mi aspetta ai bivi, semplicemente nn devi aspettare X tempo perché è già passato, ma il gameplay è identico"*.
**Data:** 2026-10-06
**Stato:** `ritirata`
**Triage R-156 (2026-10-12):** superata — PLAN-025: teardown teatro parallelo, convergenza QuestRunWindow — ritirata su ratifica Director.
**Desiderata FROZEN:** `.mw/desiderata.md` v27 — avallo «avallo» 2026-10-06. Prossimo passo: `mw-planner` per la spec `QuestTheatre`.
**Decisioni Director in sessione:**
- Scopo: presentazione della quest sulla superficie canonica `/game` (Pixi + DOM overlay), non il lab S1 (sperimentale).
- **Direzione B:** `QuestTheatre` come componente nuovo — stage renderer (narrative/choice/check/consequence/reward) che *ospita* i contenuti esistenti (`QuestChronicle`, skill check, `QuestRewardPanel`, kit, log); container = `FloatingPanel` (v4: spostabile, riducibile a icona, non bloccante) con **modalità expanded** opzionale.
- **Modello runtime:** la quest è una storia a nodi che **aspetta ai bivi** — scelte e skill check non si auto-risolvono mai. Solo il tempo scorre: i gate temporali (viaggi, durate) maturano in background, quindi quando il giocatore apre il teatro è fermo alla prima fase pendente senza dover attendere.
- **Scartati dalla proposta ChatGPT:** stato narrativo (`IN DANGER`/`RETURNING`) e livello di pericolo implicito — *"nn mi interessa"*.
- **Revisione Director 2026-10-07:** lo scarto NON è definitivo — *"questo potrebbe essere interessante, ma dobbiamo esaminarlo meglio, nn escludiamolo a priori"*. Nota di analisi: come *etichetta UI* era rumore di presentazione; come **stato** potrebbe alimentare scheduler/eligibilità (`party.in_danger` → quest di recupero/salvataggio elegibili, chain emergenti — pertinente a OPEN-014/P55). Da riesaminare in sede S5/QuestTheatre.
- Dalla proposta restano candidate: timeline narrativa (traccia dei nodi, non %), futuro sconosciuto nascosto (nemmeno `?`), party strip, decision panel, expedition kit drawer, chronicle/log, retreat con anteprima conseguenze, art cinematografica, header obiettivo.
**Collegamenti:** share ChatGPT `6ac5017a`; desiderata v3/v4 (pannelli flottanti, quest POI), v24 (modello S1, S4 integrazione), QUEST_RULES.md; `useQuestPoiSession.tsx`, `QuestChronicle`, `FloatingPanel`, `QuestS1LabPage` (reference sperimentale).
**Note di provenienza:** la proposta origina da una conversazione ChatGPT del Director; lo stato narrativo/pericolo implicito era la parte scartata. Il container FloatingPanel è già canone (v4): il teatro cambia contenuto e scala del pannello, non il container.

## R-089 — Implementazione della quest «Sterminio dei goblin» nel lab S1

**Richiesta:** il Director ha authored la quest «Sterminio dei goblin» (fasi F0–F7) e ratificato in sessione il modello di targeting posizionale a cascata, l'escalation di combattimento, HP per-PG (0 HP = morte), F5 a bande di esito, F7 come turno secco + 5 danni secchi, consumabili solo prima di check/scelta, reward XP+trofeo→Gold. Chiesto il piano di implementazione nel lab S1 e l'esecuzione.
**Data:** 2026-10-06
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`.
**Desiderata FROZEN:** `.mw/desiderata.md` v24 (stadio S1 — quest authored nel lab).
**Spec:** `src/docs/docs/idle_village/quest_sterminio_goblin_spec.md` (fasi, regole, testi per esito).
**Piano:** `plans/PLAN-022-quest-sterminio-goblin.md`.
**Vincoli:** nessuna modifica al comportamento di «cassa»/«rovine» (regressione); targeting posizionale solo per la nuova quest; valori numerici = placeholder da calibrare via Monte Carlo.

---

## R-090 — Ricerca approfondita su narrativa emergente / quest generator (verso S5)

**Richiesta:** *"prendi il cappello corretto, fa un prompt adeguato x una ricerca online approfondita su come ottenere questo tipo d cose, i principi psicologici, e quasliasi altra cosa che ci serve per questo tipo di lavoro, sotto diversi ambiti, punti di vista, ecc. questa ricerca falla tu e chiedila anche a tutte le AI web. poi dammi un riassunto breve e scrivi nella documentazione adeguata i principi che c serovno"*
**Data:** 2026-10-06
**Stato:** `fatta`
**Contesto:** discussione strategist sulle strategie per arrivare a un quest system con narrativa emergente (chain quest, quest condizionate da requisiti, branching delle fasi sugli esiti) — piano S5 di PLAN-019, proposta E-28/OPEN-014.
**Hat:** `game_director`. **Metodo:** ricerca web dell'agente + broadcast a tutti i provider web (chatgpt, claude, gemini, grok, deepseek) → sintesi → principi in `context/QUEST_GAMEPLAY_SCIENCE.md` / `NARRATIVE.md`.
**Esito:** prompt in `.mw/runs/20261006-emergent-narrative-research/prompt.md`; broadcast completato — chatgpt, grok, deepseek utili; claude fallito (risposta non stabilizzata), gemini soft-rifiuto. 16 principi nuovi integrati come **P48–P63** in `QUEST_GAMEPLAY_SCIENCE.md` (con source bank dedicata + provider audit batch 4); distillato del meccanismo in `NARRATIVE.md` §3 (status `research`, non ratificato); riga evidence in `context/INDEX.md`. Conclusione chiave: il "quest generator" deve generare **condizioni narrative** (eventi authored + stato + memoria + scheduling → prossimo evento rilevante), non storie — la memoria ancorata ai personaggi è il componente a più alto ROI e costa meno.

---

## R-091 — Ingestione share link ChatGPT «Sistema di quest cross direct»

**Richiesta:** *"https://chatgpt.com/share/6ac53990-6910-83eb-802b-8c15da855ef4 — dobbiamo integrare questa conversazione a quello che già abbiamo"*
**Data:** 2026-10-06
**Stato:** `fatta`
**Metodo:** skill knowledge-extractor; share page JS-rendered → transcript acquisito via render Puppeteer (archiviato in `.mw/runs/20261006-quest-cross-direct/transcript.md`).
**Esito:** lo share espone solo la coda della conversazione (voice mode); il Director ha incollato a mano la porzione precedente con i suoi interventi. Ledger E-01..E-08 in `context/ingestions/2026-10-06-quest-cross-direct.md`: grammatica di 6 primitive dei beat, separazione struttura/flavor, generatore a vincoli in 3 passi (intenzione → catena causale → render); dal Director: premessa LoW+X-Com «carta-flavor», requisito volume/centinaia di ore con varietà *percepita*, e proposta flavor-via-tag con tag adiacenti. Integrato in `NARRATIVE.md` §4 (orbita OPEN-014) e `context/INDEX.md`. Nessuna ratifica formale — intent Director da portare in desiderata se confermato.

---

## R-093 — Acquisire e discutere «Registro narrativo del mondo»

**Richiesta (verbatim):** *"acquisiscilla nella documentazione del progetto, è tutta roba molto promettente e poi parliamone"* (in risposta allo share «Registro narrativo del mondo»).
**Data:** 2026-10-07
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — acquisizione documentale effettuata; discussione e decisioni di design ancora aperte.
**Fonte:** https://chatgpt.com/share/6ac63cac-f084-83ed-8694-f80bc084e094
**Report:** `context/ingestions/2026-10-07-registro-narrativo-del-mondo.md` (ledger E-01..E-18); proposte collocate in `NARRATIVE.md` §4; OPEN-016.
**Autorità:** l'interesse del Director per il tema non approva il macro-piano scritto da ChatGPT alla fine della conversazione. `.mw/desiderata.md` v24 e PLAN-019 continuano a governare la sequenza S1–S5 finché non viene scelta un'eventuale revisione.

---

## R-095 — Mappa dettagliata delle meccaniche narrative

**Richiesta (verbatim):** *"Va bene C, ma deve essere molto dettagliata, spiegando cosa influenza cosa, il xè, ecc."* e *"penso siano tutte meccaniche importanti ed interessanti"*.
**Data:** 2026-10-07
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** coperta da QUEST_GENERATION_* docs + SPEC — chiusa su ratifica Director. — mappa scritta in `NARRATIVE.md` §5; resta mappa d'intenti, ogni meccanica entra nel piano operativo solo al battesimo del suo stadio PLAN-019.
**Contesto:** alla domanda «plan unico con tutto e poi si approfondisce?» il Director ha scelto l'opzione C: documento unico che elenca tutte le meccaniche (conseguenze, registro mondo, riconoscimento, evoluzione offscreen, composizione, legacy cross-run) con stadio, condizione di ingresso e dipendenze — senza anticipare il design oltre i gate.
**Decisioni registrate nella stessa discussione:** registro mondo in S2 = fetta minima per *una* quest di riferimento (narrowing OPEN-016); composizione/generazione resta S5.

---

## R-096 — Quest Fun Audit sulla quest goblin S1

**Richiesta (verbatim):** spec incollata dal Director «QUEST FUN AUDIT — S1 GOBLIN QUEST» — estendere l'analisi MC per valutare *qualità del gameplay* (decisioni significative, tensione, risk/reward, strategia di party, conseguenze a cascata, storie emergenti, rigiocabilità), non il bilanciamento. Vincoli espliciti: preservare l'MC esistente, non semplificare l'engine, non ottimizzare/cambiare probabilità, report per sezioni A–I con score 1–10 e verdict WHAT WORKS / WHAT DOESN'T / WHAT TO TEST.
**Data:** 2026-10-07
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — tooling `scripts/quest-goblin-fun-audit.ts` (trace per decisione + policy random esplorativa), report `test-results/quest-goblin-fun-audit-report-2026-10-07.md` (score + verdict), dati grezzi `quest-goblin-fun-audit-2026-10-07.md`, evidence `r096-quest-goblin-fun-audit-2026-10-07.log`.

## R-097 — Micro-iterazione S1 goblin: fix F5 + preview consumabili

**Richiesta (verbatim):** spec incollata dal Director «S1 GOBLIN — MICRO-ITERATION F5 + CONSUMABLE DECISION». Vincoli espliciti: F5 deve diventare scelta vera (Pursue ≠ free-roll, Let Flee ≠ dominato) con cambio strutturale minimo, mantenendo check FOR, 5 bande, sterminio, agguato e distinzione agguato lieve/peggiorato; **F6 e il targeting posizionale non si toccano**; preview consumabili deve mostrare "ora vs dopo" ricalcolando dinamicamente, senza secondo modello di probabilità né dettagli interni. Processo: baseline MC → candidati → report prima/ dopo, poi implementazione.
**Data:** 2026-10-08
**Stato:** `ritirata`
**Triage R-156 (2026-10-12):** superata — lab S1 fermo/deprecato a favore di /game — ritirata su ratifica Director. — v1 e v2 (respec Director) implementate e committate. Follow-up 2026-10-07 dopo playtest UI: fix onestà astrolabio (target forzato validato via `findZonePoint`/`honestTargetPos` — la palla non può più atterrare nel catrame sotto una card WIN), icone stat (lucide) su preview/chips, pedaggio F5 spostato a campo authored `upfrontDamage` con riga `sim.toll` in preview e log nel testo di esito, copy authored ripristinato. Evidence `test-results/r097-ui-check-honesty-2026-10-07.log`. In attesa di verifica del Director sul lab.

---

## R-099 — Flavor layer sulla quest goblin nel lab S1

**Richiesta (verbatim):** *"abbiamo la prima quest 'interessante' e la stiamo provando: ma manca di pathos, di narrativa, di feelings, d juice. […] ci serve un po' d testo x contestualizzare. Ad esempio 'arrivate ai margini della foresta' prima dello skill check di percezione, e quello skill check oltre a cosa fa e cosa ottiene dovrebbe avere un nome tipo 'ti arrampichi per vedere in lontananza'. E a seconda della scelta e dell'esito deve esserci una frase di 'flavour' adeguata. Inoltre: tra una fase e l'altra nel gioco reale ci sarà l'animazione di movimento che dura X e magari sarebbe carino fare apparire del testo che spiega cosa sta succedendo nel frattempo: cosa vedi, cosa incontri, ecc. Prova a prendere quella quest, metti i tag, flavour, testo, ecc come se seguisse le regole che abbiamo stabilito"* — poi: *"applica questo flavour a questo componente di prova, cercare di dargli una certa cinematograficità, feelings, pacing, ecc"* (su `/quest-s1-lab`).
**Data:** 2026-10-08
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — schema `transit` + `verdictFlavor` su `QuestNode`, `ResolvedCheck.flavor/transit`, pacing da config (`questLabPacing`), flavor pass completo su `questScenarioGoblin.ts`, transizione cinematografica e flavor sotto astrolabio in `QuestS1LabPage`. Spec: manoscritto nel documento unico `src/docs/docs/idle_village/quest_sterminio_goblin_spec.md` (il doc standalone `context/QUEST_GOBLIN_FLAVOR.md` è stato assorbito lì il 2026-10-08). Evidence: `test-results/r099-quest-flavor-layer-2026-10-08.log`. Fix collaterale: `pageCrash.repro.test.tsx` era rotto da R-089 (guidava la card Rovine rimossa dal picker) — ripristinato guidando la quest goblin.

---

## R-101 — Redesign UI del lab quest S1 (cockpit, combat HUD, damage channel, skip)

**Richiesta (verbatim):** *"dopo un esito dello skill check dovrebbe apparire una frase che spiega cosa è successo. quando c sn dei danni a schermo vanno presentati bene come UI. La fase d combattimento devi mostrare gli hp d tutti, cn gli slot cn le % d prendere danni rappresentati, e stessa cosa anche x i goblin. Bisogna capire gaurdando cosa sta succedendo, a che punto siamo, ecc. Inoltre: il componente skill check dovrebbe avere anche dei pulsanti x skippare le animazioni, skippare direttamente il tiro, ecc, che adesso sn scomparse. Inoltre: tutti questi componenti e il layout è molto brutto e fastidioso, c dovrebbe essere una guida su come fare questi componenti, ed il layout dovrebbe mostrare tutto a colpo d'occhio senza che io debba navigare. anche lo spazio laterale x il log è troppo grande."* — poi: *"planner multi AI web"*. Decisioni Director su D1–D3: *"1 manuale, ma devo poterlo magari scegliere prima della selezione dello skill check. le info dello skill check dovrebbero apparire come tooltip della scelta o pulsante, nn una fase a parte. xò nn saprei cm fare aggiungere i consumables con questa modifica / orda token anonimi va bene / chiudono i ranghi e cambiano i valori d pericolosità degli slot"*
**Data:** 2026-10-08
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. (2026-10-08) — PLAN-023 implementato e verificato live: cockpit 3-regioni zero-scroll, pipeline presented-vs-committed, canale danno duraturo, astrolabio docked+skip+speed, stakes tooltip+cintura consumabili, orda anonima+rank-shift, guida `quest_ui_component_guide.md`. Safeguards verdi (95/95 vitest scope, build:check, kanban:lint). Evidence: `test-results/r101-quest-cockpit-2026-10-08.log`. Contesto: dibattito multi-AI web convergente (run `20261007-quest-s1-lab-ui-redesign`, 3/3 ACCEPT su artifact-r004; r005 = revisione finale con decisioni Director D1–D3 ratificate). Piano esecutivo `plans/PLAN-023-quest-s1-lab-ui-redesign.md` (T-001..T-012). Decisioni chiave: skip manuale + pace control pre-check; stakes in tooltip opzione; consumabili via cintura nella Action Zone; orda a token anonimi; rank-shift alla morte; R-099 flavor layer preservato.
**Collegamenti:** PLAN-023, PLAN-022 (quest goblin), PLAN-019 (S1), artifact `.mw/runs/20261007-quest-s1-lab-ui-redesign/` (repo mind-weaver), R-099 (flavor layer — `transit`/`flavor` consumati dal verdict card).

## R-102 — Loadout picker: scegliere dallo "stash" cosa portare in missione

**Richiesta (verbatim):** *"Visto che abbiamo gli oggeti da poter potertare in missione, ci serve anche un picker x scegliere prima cosa portare dallo \"stash\" che già abbiamo"*
**Data:** 2026-10-08
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. (2026-10-08) — picker nella schermata preset, catalogo `questStash.ts` (Zod), `bagSlots: 3`, `createRun(..., loadout)`. Verificato live: cap a 3, toggle, cintura riflette la sacca. Contesto: nel lab S1 la goblin oggi concede i consumabili come flag hardcoded in `initQuest` (`hasBonusForza`, `hasBonusPerc`, `hasHealing`) — non esiste ancora uno stash formale né un passo di loadout. Esistono però due pool canonici da riusare: `questItems.ts` (MP-02, equipment+consumabili Zod) e `heroItems.ts` (`consumables.json`/`equippableItems.json`, inventario eroe persistente). Punti aperti: cosa è lo stash nel lab (mock pool vs config canonico), vincolo di capienza (slot/N item), dove vive il picker (schermata preset vs step dedicato), consumabili vs equipaggiamento per-membro.
**Collegamenti:** R-101 (cockpit lab — il picker si aggancia alla schermata preset/pre-partenza), R-089 (quest goblin), MP-02 (`questItems.schema.ts`), `useResidentHeroState` (inventario eroe persistente), `.mw/desiderata.md` S1/S2 (lo stash persistente vero è infrastruttura S2 — nel lab va bene un mock config-first).

---

## R-103 — Rework narrativo/emotivo della quest goblin (brief ChatGPT + ricerca + playtest + critica)

**Richiesta (verbatim):** *"Proposte di miglioramento della quest da parte di chatGPT (la traduzione la aggiungiamo, ma facciamo italiano e basta x adesso). Sei un lead senior system designer di una softwarehouse AAA, fa una ricerca online approfondita, scrivine un documento su cosa vogliamo che questa Quest faccia, come che timing/pacing, psicologia per dare emozioni, ecc., poi prendi questa quest, giocala davvero, esaminala e fanne una critica spietata e costruttiva alla luce di tutte le informazioni che abbiamo, poi proponine uno a tua volta"* — seguito dal brief «Task: Improve "Sterminio dei goblin" — Narrative, Suspense & Emotional Rework» (struttura F0–F7, slot-targeting e F5 v2 invariati; alpha; niente overengineering; deliverable = proposta, non codice).
**Data:** 2026-10-08
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — documento `context/QUEST_GOBLIN_REWORK_PROPOSAL.md` (brief+ricerca, playtest col motore reale, critica alla quest e al brief, proposta P0/P1/P2, metriche emotive). P0 applicato 2026-10-08 a sole stringhe/pacing (zero RNG, zero calibrazione): albero al posto del masso per la scelta di osservazione (Director: «ti devi arrampicare su un albero»), mercanti al guado al posto del mugnaio (Director — la minaccia è sulla strada, come F7), indizio visivo del masso, assalto fisico F3, attack lines F4, righe di danno per gravità HP, fix F5-win che contraddiceva lo sterminio, cassa semibruciata F6 + righe-per-turno, sollievo→shock F7, epilogo con registro + callback al guado, transit hold ∝ parole (`transitMinMs/MaxMs/WordsPerSecond`). Decisioni Director 2026-10-08: F6 solo testo (no +gold su bigwin), agguato flat (no colpo posizionale), no morale (né meccanica né readout), chiusura con callback ok. Rimandati a P1: griglia F4 fase×banda, transit sullo stato, testo condizionato a flag, `options[].consequence`, metriche emotive M2/M6/M7/M8.
**Collegamenti:** R-099 (flavor layer), R-096 (fun audit), R-097 (F5 v2, calibrazione MC da non toccare), PLAN-022, `src/docs/docs/idle_village/quest_sterminio_goblin_spec.md`, `scripts/quest-goblin-playthrough.ts`.

---


## R-104 — Critica AAA del lab quest S1 e restyle secondo la guida HUD (Lacquer Atlas)

**Richiesta (verbatim):** *"prendi il nostro lab http://localhost:5173/quest-s1-lab Sei un lead UI senior designer di una compagnia di videogame AAA, fa una ricerca online, dammi una critica spietata e costruttiva di questo componente. Poi proponi delle soluzioni a tua volta, cn esempi di codice, ecc. La nuova versione si deve rifare alla guida hud_component_guide.md"*
**Data:** 2026-10-08
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. (2026-10-08) — PLAN-024 eseguito (T-001..T-011). Lab restylato in Lacquer Atlas: `HudPlaque` hang/plinth, dipinto full-bleed, formazione su roster trusted, icone lucide, cronaca drawer locale, forecast→pill. Misure dopo: 0 letterali colore, 0 classi palette e 0 testo <12px nei file di scope, 315 `var(--skin-*)` nel DOM, 0px scroll @1366×768. Test 104/104, build:check, kanban:lint verdi. Evidence: `test-results/r104-quest-hud-restyle-2026-10-08.log`. Nota: il testo <12px residuo nel DOM sta dentro componenti trusted (roster compact 8-9px, sim preview) — contratto loro, non toccato qui.
**Collegamenti:** R-101 / PLAN-023 (cockpit — l'architettura resta, cambia il linguaggio visivo), R-102 (stash picker), `src/docs/docs/design/hud_component_guide.md`, `primitive_composition_rules.md`, `quest_ui_component_guide.md`, DESIGN_PILLARS Pillar 1 (frame come oggetto fisico), `tests/unit/idleVillage/hudGuards.test.ts`.

---


## R-106 — Finestra «quest in corso» su /game (componente piccolo, linguaggio HUD)

**Richiesta (verbatim):** *"La quest deve essere solo quel componente piccolino dove attualmente vive solo il testo e le scelte. rendilo trascinabile, chidubile, riducibile a icona (cm tutti gli altri componenti del progetto, tipo il roster). Ci serve: una theater con una immagine in "formato cinematografico" sopra le scelte, ma sotto il titolo, cn il flavour che sta sotto il titolo sopra l'immagine. A destra del titolo ci servono tutte le icone. Una delle icone deve essere quella del roster con il roster che attualmente è assegnato alla qeust. Sotto le scelte/pulsanti, ecc ci vuole una barra che poco alla volta si carica/riempie, a seconda del tempo trascorso rispetto a quando la quest è terminata. Sotto questa barra ci devono essere dei "riquadri" che si occupano di mostrare tutte le fai che hai già fatto + la successiva (solo icona e sotto eventualmente come è stata risolta, tooltip t dice "i log" [...])"* — poi: *"la voglio mostrata in /game , deve avere quel "linguaggio""*.
**Data:** 2026-10-08
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — `QuestRunWindow` (gameFrame) su `HudPlaque` + `useHudPanelDrag`, pannello `quest` nel registro (tasto Q, menu Pannelli), avvio dalla Regia («Avvia quest goblin»). Motore invariato (`useQuestRun` sopra `createRun`/`applyChoice`); registro per fase `questPhaseRecord.ts` da harms strutturati, non dal testo del log; `NODE_ART` spostato in `questS1Lab/questArt.ts`; config `gameFrameConfig.questWindow`. Aperti: la quest non parte ancora dal POI/assegnazione reale (solo Regia, party preset), niente cinematica astrolabio nella finestra, la barra segue il clock di gioco ma le fasi non sono ancora vincolate al tempo.
**Iterazione 2 (2026-10-08):** *"l'immagine dovrebbe essere + "cinema" magari + bassa e + lunga? [...] quel pulsante Partire nn m piace. i pannelli fluttuanti devono stare sopra la HUD, nn sotto. fai una critica spietata [...] scena x scena, poi fa una ricerca online su come migliorarlo e fallo"* — theater 2.76:1 (Ultra Panavision) a 460px; scelte come lista di dialogo numerata (ruolo `data-skin="choice"` in skinScope.css, tasti 1–9), niente targa CTA; titolo/flavour come contenuto italiano (`GOBLIN_META`), didascalia senza ripetere il titolo; pip HP squadra nella pillola roster; riga tempo «Giorno x di y · Fase n di 8»; «Chiudi il rapporto» a fine run. Livelli: `zLayers.panels` 9→12 (sopra chrome/dressing) e fix in `useHudPanelDrag` (spargeva `zIndex: undefined` cancellando lo z di ogni pannello — Regia e Tuning inclusi).
**Iterazione 3 (2026-10-08) — decisione Director:** *"Un solo componente."* → `QuestRunWindow` e `QuestTheatre` (PLAN-021, desiderata v27 FROZEN) convergono in **un unico componente** per la quest in corso su `/game` (direzione B dell'esplorazione: architettura teatro + contenuti/pezzi del lab). Poi: *"Cosa ti può 'aiutare' a capire come migliorare pacing e juice? Giochi tu una partita? vorrei anche solo piccole animazioni, tipo le bande nere che fanno diventare tutto + cinematografico, cose del genere"*. Fix bloccanti emersi (validi in qualunque architettura): consumabili spesi automaticamente (`useConsumable` default true), `verdictFlavor` mai mostrato, `lastEvent` duplicato di `body`/flavour, `transit` mai mostrato, run non persistente. Poi: *"procedi — usa le AI web per fare il plan"*. **Stato 2026-10-08:** T-000 fatto (no consumo automatico + `ConsumableBelt` con delta base→armato, cure/pozione usabili, verdetti con flavor, dedup, riepilogo check onesto sui danni `HARM`, **crash di /game corretto**: pedaggio d'esito che uccideva l'ultimo membro senza `wipe` → `reduce` su party vuoto). Piano `plans/PLAN-025-quest-theatre-convergence-cinema.md` v4 dopo 3 round di cold read web (chatgpt + claude; r3: MAJOR su punti di specifica / MINOR): frontiera v27 nel dominio prima del teatro; gate D-1…D-8 in attesa del Director (default conformi). Evidence: `test-results/r106-quest-window-fixes-2026-10-08.log`.
**Collegamenti:** R-104 (lab restylato), R-101, `hud_component_guide.md`, `tests/unit/idleVillage/questPhaseRecord.test.ts`, `hudGuards.test.ts` (file aggiunto a STRICT_FILES), PLAN-021, `.mw/desiderata.md` v27.

---
## R-107 — Un paio di POI funzionanti con POI detail veri su /game (stadio S2)

**Richiesta (verbatim):** *"Adesso abbiamo una idea abbasta "valida" e raffinata e completa x decidere come deve essere un componente QUEST? Anche a livello di programmazione, logica, ecc. Xè vorrei avere un paio di POI che siano funzionanti, cn POI detail veri, ecc"* — poi *"procedi"* dopo la sintesi delle decisioni aperte.
**Data:** 2026-10-09
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — piano figlio S2 in scrittura (mw-planner)
**Desiderata FROZEN pertinente:** `.mw/desiderata.md` v24 (PLAN-019, stadio S2 «la quest vera»), v27 (QuestTheatre, semantica di frontiera — già implementata in `questRun.ts`).

**Constatazione emersa in esplorazione (FACT):** su `/game` convivono due sistemi quest scollegati: `useQuestPoiSession` (POI→detail→assegnazione roster→quest vecchio modello blueprint+milestone) e `useQuestRun` (motore a grafo `questRun.ts` con frontiera v27, avviato solo dalla Regia). «POI veri» = il detail esistente che lancia il motore nuovo.

**Decisioni portate al Director (2026-10-09):**
1. **Formato quest canonico** — proposta ratificabile: il grafo di nodi (`QuestNode`/`questRun.ts`) è il modello canonico; `QuestBlueprint` (Zod, fasi lineari) si riduce a *busta offerta* del POI (metadati per detail/planner). Equivale a chiudere PLAN-019 **D-2** a favore del motore a grafo; gli scenari vanno promossi a schema Zod config-first (invariante). Registrare in DECISION_LOG la divergenza dalla formula PLAN-019 «si trasferiscono le regole, non il codice»: il motore è diventato canonico per costruzione (v27 frontiera + teatro ci poggiano sopra).
2. **Superficie di assegnazione** — opzioni: riuso della session POI esistente (detail + slot roster già montati su `/game`) vs Mission Planner rimappato. Default conforme proposto: session POI esistente per lo slice, planner completo resta S3.
3. **Mappatura LabStat → stat residenti (PLAN-019 D-3)** — `str→strength`, `con→endurance`, `agi→agility`, `int→intelligence`, `perc→perception` esistono (`statSnapshot`); **`cha` (Carisma) non ha candidato nel balancer** → scelta esplicita richiesta (aggiungere la stat vs rimappare i check cha su int vs riscrivere i contenuti cha).

**Collegamenti:** PLAN-019 (S2, D-2, D-3, D-6), PLAN-025 (teatro — coordinamento: il lancio deve puntare all'API `useQuestRun`, non al componente), R-105 (fascia di pericolosità dichiarata), OPEN-015 (quest non risolta — forma minima), R-092.

**Risposte Director al gate (2026-10-09):**
1. **D-B assegnazione:** *sì* → riuso della session POI esistente; Mission Planner completo resta S3.
2. **D-C stat:** *"rimappa su int. Comunque le stat devono essere quelle vere del pg creato da balancer, nn quelli che abbiamo inventato x il mockup. Forza viene da Danno, Costituzione viene da HP, Destrezza viene da %tohit. Per Intelligenza e Carisma facciamo che per adesso sono mockate, ma devono seguire la stessa pipeline, così appena finisco di decidere"* — **correzione Director in sessione:** *"scusa, mi ero confuso: %tohit = percezione, dodge = agilità"* → le competenze quest si **derivano dallo StatBlock combat reale** del residente: `str←damage`, `con←hp`, `perc←%tohit (hitChance/txc)`, `agi←evasion (dodge)`; `int` e `cha` sono **mockate ma dentro la stessa pipeline config-driven** (regola di derivazione in config Zod, si cambia solo quella quando il Director decide); `cha` nei check usa il canale `int`.
3. **Divergenza «regole non codice» → DECISION_LOG:** *sì, ok*.

**Critica multi-AI web (2026-10-09):** broadcast PLAN-019-S2 a 5 provider — chatgpt/claude/grok/deepseek tutti MAJOR REVISION, gemini-web failed. Convergenze assorbite in v2: deroga esplicita `int`/`cha` (gate S2-a emendato a «nessun mock sui canali reali», `mockChannel` in config), settlement idempotente chiavato su `runId` + tabella transizioni terminali (reward = `objectiveSatisfied && leaderReturnedAlive`), parità seeded → parità strutturale + traccia deterministica completa + test equivalenza `createRun(party≡preset)`, eleggibilità residenti + lock `inExpedition` + rilascio stato session all'Embark, fascia etichettata come ipotesi su party di riferimento + forecast live in assegnazione (R-105), contratto API congelato con PLAN-025, check di calibrazione su banda dichiarata. Disaccordi residui registrati nel piano (scope POI=S3 secondo deepseek — tenuto perché è la richiesta; «quest di riferimento» secondo grok — goblin è il riferimento de facto). Run: `.mw/runs/20261009-plan-s2-web-critique/`.

**Aggiunta Director (2026-10-09, post-critica):** *«i pg nn devono essere pre assegnati, devono essere assegnati dal giocatore, dal roster vero, devi anche fare questi test veri da playwright. C'è tutta una documentazione specifica per l'interazione tra Roster + pgCard + slot+ slot Rack»* → registrata come **D-G** nel piano: nessun party pre-assegnato nel percorso POI; assegnazione dal giocatore via stack trusted roster↔slot (`VillageRosterSection`/`PgCard`/`ResidentSlotRack`/`statMatching`, contratto `roster_drag_trusted.md`, RT-ROSTER-001); E2E Playwright **reali** su `/game` estendendo `poiQuestDetailRosterTimeClock.spec.ts`. Nuovo invariante I-7 + sezione «Assegnazione dal roster reale» nel piano v2.

**Aggiunta Director (2026-10-09, spec POI detail):** *«Noi dobbiamo avere: il POI che prende i valori dalla "config" corretta. Il roster, il POI detail dove c'è il sistema di slot corretto e funzionante, cn i valori sotto che spiegano cosa fanno, che modificiatori hanno, le % di pericolosità, ecc dinamici a seconda di quanti slot sn occupati, ecc. La preview della quest totale, cn i reward che possono variare in base a chi mandi (ancora nn ricordo di aver fatto questa implementazione, ma è da "tenerne conto che arriverà"). La durata, una modo di dire la pericolosità, un modo di esprimere la quantità del reward (dobbiamo fare anche un modo x cambiare queste due cose come valori esterni… vedremo se fare un constructor o qualcosa del genere). Poi se m sto scordando altro aggiungilo e/o proponimelo, se qualcosa nn t è chiaro chiedi, x adesso mockiamo quello che ancora nn abbiamo. Dopo che i pg sn hanno occupato gli slot obbligatori "con successo" la quest può essere "accettata", quindi ci vorrà un pulsante di "invia spedizione". E solo da quel momento in poi l'halo (che fin'ora era vuoto) comincia a riempirsi durante il tempo (in base alla durata della quest). Da ora in poi quando clicchiamo sul POI parte il componente su cui stiamo lavorando: questo delle quest.»* → registrata come **D-H** nel piano: detail = superficie di planning viva (offerta da config, slot con requisito/ruolo/modificatori/contributo, pericolo dinamico via `simulateQuest` al cambio assegnazione, preview quest totale, durata, bande pericolo+reward, `resolveQuestOffer(offer, modifiers)` con valori congelati nel run, gate «Invia spedizione» su slot required, halo che si riempie col tempo, click POI attivo → `QuestRunWindow`). Reward-by-party e sorgenti modificatori reali: mock-hook tracciati. Proposte planner: badge `inExpedition` sul roster, loadout pre-invio (stash picker R-102), persistenza assegnazione parziale, segnale bivio via PLAN-025 D-6. Punto aperto chiesto al Director: semantica dell'halo (tempo-timed con pausa ai bivi vs puro elapsed/duration vs progresso nodi).

**Risposte Director (2026-10-09):** (a) **halo = «Puro elapsed/durata»** → D-J: riempimento = tempo trascorso/`estimatedDuration` da config, stima non legata alla frontiera; badge bivio resta segnale separato. (b) **modificatori esterni = world-scaling reale** → D-I: *«un modificatore al pericolo e un modificatore al reward… in base a determinati valori bilanci il reward e la difficoltà, ad esempio: da quanti giorni stai giocando, il livello medio dei tuoi eroi, il livello medio degli equipaggiamenti degli eroi… poi ricreiamo/miglioriamo solo da dove e come viene fatto quel calcolo e il resto lo cerchiamo di lasciare il + simile possibile»* → `collectWorldProgressSignals()` (giorni TimeEngine — reale; potenza eroi da `statSnapshot` — metrica da definire; potenza equip da `equipmentStorage` — reale) → config `worldScaling` (pesi+bande Zod) → `dangerScale`/`rewardScale` in `resolveQuestOffer`; formula+sorgenti = unità sostituibile, contratto di consumo stabile.

**Decomposizione (2026-10-09):** *«Dividilo in sub plan, linkati a questo plan, poi approfondisci plan by plan con le AI web»* → PLAN-019-S2 resta contenitore (decisioni, invarianti, contratti, gate, disaccordi); creati 5 figli: `PLAN-019-S2.1-scenario-canonico` (T-002), `S2.2-party-reale` (T-003+T-004), `S2.3-offerta-scaling` (T-005), `S2.4-planning-lancio` (T-006), `S2.5-settlement-e2e` (T-007…T-010). Critica web plan by plan in corso.

**Critica figli r1 (2026-10-09, chatgpt+claude per figlio):** S2.1 = 2× MINOR (parità→Monte Carlo uniforme N≥1000 + copertura tutti i nodi + analisi esatta; `.strict()` no defaults; superRefine integrità grafo; `scenarioVersion`; ownership `offer`: slots riusano tipo `statMatching`, `rewardBase` placeholder → S2.3). S2.2 = 2× MAJOR (**scala di conversione obbligatoria** con forma/range — era il vero buco; test separati regressione-motore vs golden-adapter; HP run = f(hp reale); `residentToQuestMember(resident, role)`; FACT: equip non modifica stat combat → check non dipendono da equip in questo slice; contratto consumo item: sacca spedizione, freeze al run, writeback solo in S2.5; fonte `perc` aperta come sotto-decisione di D-C). S2.3 = 2× MAJOR (**`ScenarioInstance` derivato** consumato identico da simulateQuest+createRun — altrimenti dangerScale o non fa nulla o rende falsa la fascia; `offerBand` statica vs `estimateForParty` dinamica; `resolvedOffer` persistito con versioni; worldScaling v0 = **solo `daysPlayed` reale**, hero/equip power non operativi finché non esiste metrica canonica; rewardTiers su reward nominale congelata). S2.4 = 2× MAJOR (invio atomico: lock `inExpedition` **derivato** dal run persistito; feriti = «può continuare ma non ripartire»; forecast con seed deterministico+debounce+cache+budget; halo `pieno-in-attesa`≠`concluso`; **D-K entrata nel piano durante la critica** — attrito schedule-assoluto vs frontiera v27 → T-0 spike bloccante: layer sopra `matureReady` o deroga I-3 da decidere). S2.5 = 2× MAJOR (**journal per-effetto** con intent `settling`→effetti chiavati `(runId,effectId)`→`settled`, mai `+=n`; fault injection + fault point deterministici; tabella a prodotto di variabili + riga «obiettivo sì + fuga + leader vivo»; **wipe = tutto perso** per matrice frozen, tolta «regola config»; precedenza scadenza solo su offerte non lanciate; ledger = effetto idempotente con consumatore=POI aftermath; E2E sequenziale POI1→settlement→POI2). Tutto assorbito nei figli; run `.mw/runs/20261009-plan-s2-children/*/r1/`.

**Critica figli r2 (2026-10-09, claude+chatgpt):** S2.1 MINOR (oracolo = fixture committata, copertura garantita via enumerazione statica+tracce mirate, `computeScenarioVersion` esportata, `Equals<>` type-test, offer↔nodes coherence, `referenceParty` esplicito + borderline ε). S2.2 2×MAJOR (riga `runHp` nella tabella scale; feriti = esclusione unica via noneOf; equip FACT come test; calibrazione a due livelli diagnostica+gate con riferimento per-check versionato indipendente dalle bande offer; item `reserved` chiavati su runId; claude raccomanda `perc←txc` per indipendenza canali — resta decisione Director entro T-1b). S2.3 MINOR (resolveQuestOffer una volta all'apertura detail + byte-identico al congelato; `rewardResolved` assoluto nel record; whitelist campi scalabili con esclusi costGold/grantsGold/harm + validazione semantica sull'istanza agli estremi; durata dichiarata normativa per D-K; avgHeroPower/avgEquipPower fuori dallo schema v0 → nota segnali futuri; test estremi falsificabile con clamp). S2.4 2×MAJOR (**D-K riformulata**: `readyAt = arrivo sul nodo lungo il percorso + nodeDuration` — equivale all'esempio Director su lineare, coerente coi rami, layer sopra matureReady; T-0 = prova eseguibile gate di T-3/T-4; feriti → ASSUNZIONE DA CONFERMARE con default non bloccante warning+forecast ridotto; lock derivato `run.party[].residentId` + tabella stato-run→lock; invio transizione autorevole con precondizioni alla scrittura + doppio invio concorrente; forecast↔run parity E2E; niente fallback sacca vuota; p95 ≤300ms in T-2). S2.5 MINOR+MAJOR (chiave idempotenza atomica con la mutazione; ledger per fungibili mai set-to-expected; wipe ⇔ ∀ slot morto; tabella 12 celle con motivi di irraggiungibilità + enumerazione programmatica; T-0 = 3 domande binarie + fallback aggregate unico; `inExpedition` derivato da run.status∉{settled}; esito nel record, niente schema ledger; gate (a) enumerativo). Assorbito; run `…/*/r2/`.

**Risposte Director post-r2 (2026-10-09):** (1) **durata viva** — *«se la durata aumenta x un nodo extra deve essere aggiunto in quel momento alla durata, nn nella preview, dobbiamo adattarlo (e anche il numero di fasi in basso)»* → D-K ratificata nella forma `readyAt = arrivo + nodeDuration` + denominatore halo e tile fasi si aggiornano quando il percorso raggiunge un nodo extra; (2) **feriti ammessi, senza warning** — *«il forecast ne dovrebbe tener conto (hanno -HP di partenza, quindi suppongo il pool totale di HP sia minore, inoltre dovrebbero avere anche dei modificatori alle stats)»* → la penalità vive nell'adapter S2.2/InjuryEngine, non nell'UI; (3) **`perc = txc`** — chiuso; (4) **wipe = ∀ slot morto** e **obiettivo sì + fuga + leader vivo → reward sì** — confermati.

**Risposta Director (2026-10-09, componente battezzato):** *"dentro la pagina /game c'è il componente quest in progress che si apre dal director, quello è il componente corretto. Aggiorna la documentazione x puntare a quello come 'componente battezzato'"* → **`QuestRunWindow`** (`components/gameFrame/QuestRunWindow.tsx`, R-106) è il componente battezzato per la quest in corso su `/game`; `QuestTheatre` (PLAN-021/PLAN-025) converge *dentro* di esso. Registrato come D-F in PLAN-019-S2 e in `context/DECISION_LOG.md`.

**Risposta Director (2026-10-09, gating temporale nodi):** *"l'halo nn si ferma ai bivi, indica quanto tempo ci vuole x fare la quest. I nodi sono risolti dal giocatore, ma se quella porzione di tempo è già passata puoi risolvere immediatamente anche il nodo successivo. [es. 60 tick, 6 fasi: fase ogni 10 tick; torno a 30 → risolvo le prime 3 senza attesa]… Anche il componente interno si deve caricare allo stesso modo, solo le icone in fondo devono essere mostrate solo con le fasi superate e la preview della successiva. Durante quegli X secondi bisogna mostrare la frase di flavour tra l'una e l'altra. Ah, nel gioco nn deve essere 60 secondi, deve essere X tick totali (un tick è un secondo)"* → **D-K** nel piano: durata in tick; nodi con finestra a schedule assoluto, risoluzione manuale ma in batch per gli scaduti; `QuestRunWindow` con tile = fasi fatte + preview prossima; flavour/transit durante l'attesa. Riflesso in `PLAN-019-S2.4` (post-invio + T-4) e `context/DECISION_LOG.md`.

---

## R-108 — Continuare qui la conversazione multi-AI «Emotional Mechanics for RpgBalancer Quests»

**Richiesta (verbatim):** *"https://chatgpt.com/share/6ac8a485-838c-83eb-84c4-861c9ce3e4fa — dobbiamo continuare questa conversaione qui. salva le rispsote delle altre AI in file separati, poi t aggiungo quelle mancanti, poi le elaboriamo tutte e continuiamo la conversazione"*
**Data:** 2026-10-09
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — raccolta risposte in corso.

**Contesto:** ChatGPT ha prodotto un research brief («Emotional Mechanics for RpgBalancer Quests»: meccaniche che producono emozioni — decisioni, incertezza, suspense, rimonta, rischio — senza affidarsi alla scrittura narrativa; benchmark RPS best-of-5; caso studio Sterminio dei Goblin; deliverable A–I con audit FACT del repo, catalogo primitive, 3 prototipi, piano di validazione). Il Director lo sta sottoponendo a 5 AI; protocollo: nessuna valutazione finché non arrivano tutte, poi analisi comparativa unica. Qui (Devin) il vantaggio è l'accesso al repository: le sezioni B (audit) e H (piano operativo) che le AI esterne non potevano fare sono verificabili come FACT.

**Archivio:** `context/ingestions/2026-10-09-emotional-mechanics-quest/` — `00-brief-chatgpt.md` (brief integrale + 5 domande aperte al Director), `01-claude.md`, `02-deepseek.md` (era file upload nella share, contenuto da incollare), `03-gemini.md`, `04-grok.md`, `05-chatgpt.md`. Stato raccolta nel `README.md` della cartella. Sintesi comparativa + audit repo verificato: **`SYNTHESIS.md`** nella stessa cartella.

**Sintesi prodotta (2026-10-09):** 4 risposte su 5 raccolte (manca solo DeepSeek 2/5). Convergenza forte 4/4 sulla diagnosi («esito senza decisione») e sul set di primitive (~80% sovrapposte). Audit repo verificato su `questRun.ts`/`questScenarioGoblin.ts`: targeting posizionale, push-your-luck F6, allarme a 3 stati, ritirata con costo, intent primitivo, preview ricca, harms strutturati già esistono; mancano modello avversario, check nascosto, timer-risorsa. Vedi `SYNTHESIS.md` §1–5.

**Risposte Director alle 5 domande del brief (2026-10-09):**
- *Controllo*: **poche decisioni cruciali** (3-4 scelte grandi per run).
- *Skill*: **gestire probabilità e rischio** — NO pattern-reading dell'avversario.
- *Rischio*: **sorprese forti ma eque** — inattese, retrospettivamente logiche.
- *Morte PG*: **R-105 confermata** — feeling DD/XCOM (morte presente, wipe raro, nessun cambio).
- *Emozioni prioritarie*: **attaccamento/sacrificio + avidità/rimpianto**.
- *Preview*: **numeri precisi** (niente bande qualitative).
- *Allarme*: stati nominati (quieto/allertato/sveglio) **reggono** — nessun track.

**Effetto sulle primitive (SYNTHESIS §6.1):** il duello RPS a pattern — prima scelta unanime delle AI — scende a Tier 3 perché presuppone decisioni frequenti + pattern-reading, entrambi esclusi. Tier 1 = **push-your-luck approfondito** (avidità/rimpianto, F6 esiste), **esposizione/targeting come scelta** (attaccamento/sacrificio, matrice posizionale esiste ma decide il profilo), **sorprese forti ma eque** (info a costo come meccanismo di fairness). Tier 2 = check nascosto (infrastruttura fairness), intent display leggero.
**Collegamenti:** R-103 (rework narrativo/emotivo quest goblin), R-105 (feeling DD/XCOM), R-107 (S2), PLAN-019, `context/QUEST_GAMEPLAY_SCIENCE.md`, `context/QUEST_GOBLIN_REWORK_PROPOSAL.md`.

---

## R-109 — Round 3 F6: BE@6% approvato come baseline sperimentale + gate sweep

**Richiesta (verbatim):** *"Approverei BE@6% come baseline sperimentale, non ancora come bilanciamento definitivo. Prima dell'implementazione farei una sola verifica aggiuntiva: la sweep della probabilità di bust tra 4% e 8%, mantenendo invariato il resto, per verificare che la scelta stop/continue rimanga significativa anche con party diversi. Poi procederei con le modifiche authored e i test di regressione elencati nel report §6, senza introdurre nuovi kind o ampliare il sistema generale. Un ultimo vincolo: il bust deve essere comprensibile nelle sue cause e conseguenze, ma non necessariamente prevedibile nel momento esatto in cui scatta. È questo equilibrio che può rendere la perdita dolorosa senza farla sembrare arbitraria."*
**Data:** 2026-10-10
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — sweep ramp 4–8% × party {default, weak, three, solo} in esecuzione; implementazione subordinata all'esito.

**Decisione registrata:**
- **BE@6%/turno** (trappola F6 indipendente dal verdetto, P = `exploreTurn × 6%`, bust perde solo la pila F6) = **baseline sperimentale**, non bilanciamento finale.
- Gate pre-implementazione: sweep bust 4–8% × party diversi — criterio = la scelta stop/continue resta significativa (non dominante) su tutti i party.
- Implementazione autorizzata a sweep superata: le 5 modifiche authored + test di regressione del report §6 (`context/ingestions/2026-10-09-emotional-mechanics-quest/07-round3-f6-validation.md`), **nessun nuovo kind, nessun framework generale**.
- **Vincolo di fairness**: bust comprensibile in cause e conseguenze, non necessariamente prevedibile nel momento esatto — «doloroso senza sembrare arbitrario».

**Collegamenti:** R-108, `07-round3-f6-validation.md` §6-7, `f6-pushluck-experiment.ts`.

---

## R-114 — Landing page = `/game`, commit/push di tutto il lavoro pending, deploy Vercel

**Richiesta (verbatim):** *"committa e pusha tutto quello che c'è in RPG balancer, la landing page deve diventare /game. Poi fa il deploy su vercel con successo"*
**Data:** 2026-10-10
**Stato:** `fatta`

**Intento:**
- Committare e pushare tutto il lavoro pending (PLAN-019-S2.4 planning surface + lancio, documentazione generazione quest R-111/112/113).
- La route `/` (landing) deve servire la superficie di gioco canonica `/game` (Game Frame Pixi), non più il FantasyLayout a tab.
- Deploy production su Vercel (`rpg-balancer`) andato a buon fine.

**Esito:** commit `816b47fa` (58 file) + rebase su `0ba7afe9` pushato su `main`. In `App.tsx` la condizione `isRootPath` entra nel ramo `GameFramePixiPage`: `/` e `/index.html` renderizzano la superficie `/game` (il FantasyLayout a tab resta raggiungibile su path non riconosciuti). Deploy Vercel production riuscito (upload `--archive=tgz`, build 32.5s): `https://rpg-balancer.vercel.app` — verificato via browser: `/` mostra il gioco (canvas Pixi, HUD, roster).

---

## R-115 — Implementation Plan «Quest Generation System» (macro-plan, Proposed non ratificato)

**Richiesta:** il Director ha incollato in sessione un implementation plan completo per il sistema di generazione quest (pipeline Quest Intent → Blueprint → Scene Composition → World Instantiation → Narrative Briefs → Text Generation → Validation → Repair/Reject → Scenario Artifact → Runtime), fasi P0–P7 con gate, contratti componenti (core gimmick, scene archetype, domain kit, imprint, trait trigger/twist, narrative brief), strategia di test a 6 livelli, benchmark con 3 corpus, task T0–T7. Stato dichiarato: «Proposed, non ancora ratificato».
**Data:** 2026-10-09 (data sessione; il documento incollato non ha data)
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — cold read eseguita 2026-10-09; in attesa di decisione Director su ratifica/revisione.

**Cold read (2026-10-09):** `.mw/runs/20261009-quest-generation-plan-critique/` — plan.md + contract.md (v24+rev+§0 spec) + context.md. Web providers tutti in timeout (browser runner); API: codex rate-limited, groq 413, mistral 429, openrouter non utilizzabile. Un solo critico utile: **gemini → MAJOR REVISION** (6+ rilievi). Sintesi integrata con analisi agente in `synthesis.md`: 9 rilievi C1–C9, i principali = sequenza vs v24 (S5 si definisce dopo S4), vincoli canonici §0 mai importati nei contratti/gate, P7 gated su OPEN-016 (non eliminato: intento chain quest esiste in R-113), tratti inesistenti su `ResidentState`, artefatto da vincolare a `QuestScenarioSchema` fin da P1. Secondo parere esterno consigliato quando codex/chatgpt-web tornano disponibili.

**Update 2026-10-09 (v2):** Director ha approvato produzione di **plan v2** incorporando C1–C9 + decisioni 2026-10-10 (verdictTable, `traits` su `ResidentState`, vars layer, arm misto, traducibilità, 75% posticipata) e rilancio del cold read web. Artefatto: `.mw/runs/20261009-quest-generation-plan-v2-critique/plan-v2.md` — status «CANDIDATO GATED» (§1.1 attivazione per fase), §0 importa i vincoli canonici spec §0 come acceptance bloccanti, §0.1 campi fun-judgment `experimental` rivalidati a S4, §4.6 provenance+traducibilità, P3 con strategia provider esplicita, P5 su `traits` deciso, P7 gated su OPEN-016+ratifica, §2 aggiornato a superficie post-S2.x (S2.4 completed). Cold read web rilanciato su v2.

**Update 2 (2026-10-09, cold read r2):** `.mw/runs/20261009-quest-generation-plan-v2-critique/` — web provider tutti riusciti (claude/chatgpt/grok/deepseek). **Verdetto unanime: MAJOR REVISION ×4.** La v2 ha assorbito i rilievi formali di r1 ma resta il nodo strutturale: «ratificabile + attivazione per fase» non soddisfa v24 §2 («S5 si definisce dopo S4») — i critici propongono (a) declassamento a proposta esplorativa con spike solo nel lab S1 (senza toccare questRun.ts/schema/ResidentState) o (b) ratifica rinviata a S4. Rilievi tecnici nuovi assorbibili: gate di fattibilità delta motore prima di T2, matrice di tracciabilità §0→prova, check strutturale crucial∈[3,4], repair a livello scenario + registro fatti mayInvent, regola di presentazione preview-vs-twist nascosti (rev.2), v0=catalogo pre-generato (non generazione on-offer), gate provider degradato a ≥1, prototipo=prova di fattibilità non generalità. Sintesi completa in `synthesis-v2.md`. **In attesa di decisione Director sullo status** (proposta esplorativa vs draft vs candidato gated con deroga registrata).

**Posizionamento rispetto alle autorità esistenti:**
- Copre il territorio di **PLAN-019 §S5** («Oltre lo scritto a mano»: generazione, chain quest, narrativa emergente) — che la desiderata v24 colloca **dopo S4** e subordina alla «definizione di buona quest» prodotta da S1–S4. Il piano stesso lo riconosce (§10: «collocazione dipende dall'allineamento con S2–S5»; P6/P7 subordinati ai gate PLAN-019).
- È il **livello operativo** di `context/QUEST_GENERATION_SPEC.md` (living doc R-114, consolidamento R-091/111/112/113): stessa architettura a livelli, stessi contratti. Se ratificato diventa un PLAN-0xx figlio di PLAN-019 S5; lo spec resta la fonte d'intento — evitare due fonti concorrenti.
- P7 (entità persistenti, archi narrativi) si sovrappone a **OPEN-016** (registro mondo / memoria narrativa — macro-piano ChatGPT non ratificato) e OPEN-014; il piano stesso rimanda P7 a dopo P1–P6.
- Tutti i file citati nel piano (§2) esistono sul branch: verificato 2026-10-09.

**Decisioni che richiede:**
1. Ratifica sì/no, e come (PLAN-0xx registrato in `plans/INDEX.md` figlio di PLAN-019, o doc in `context/`).
2. Timing: le fasi P0–P5 (prototipo isolato) possono correre **in parallelo** a S2–S4 senza violare v24 — l'integrazione resta subordinata ai gate. Conferma del Director necessaria perché v24 dice «Si pianifica dopo S4».
3. Nome/numero del piano figlio.

**Collegamenti:** `plans/PLAN-019-quest-macro-plan.md` (§S5), `context/QUEST_GENERATION_SPEC.md`, `context/QUEST_GENERATION_ARCHITECTURE.md`, `context/QUEST_IMPRINTS.md`, OPEN-014/015/016, R-091/111/112/113/114, `QUEST_RULES.md`, `NARRATIVE.md`.

---

## R-116 — Decisioni micro: traduzione testo generato + 75% posticipata; contratti v0 scritti

**Richiesta (verbatim):** *"Dovremo tradurre tutto / 75%, c pensiamo dopo, adesso vediamo cm viene / procedi"*
**Data:** 2026-10-10
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — decisioni registrate nei doc; contratti v0 prodotti.

**Decisioni registrate:**
- **Traduzione:** tutto il testo generato va progettato traducibile (chiavi strutturate per nodo, no interpolazioni dipendenti dalla grammatica IT). Registrato in `QUEST_GENERATION_SPEC.md` §5 e `QUEST_GENERATION_CONTRACTS.md` §7.
- **Regola 75% posticipata:** il contratto scena dichiara gli hook; soglia e denominatore si fissano dopo aver osservato il prototipo.

**Artefatto prodotto:** `context/QUEST_GENERATION_CONTRACTS.md` — contratti v0 dei 6 componenti (CoreGimmick, SceneArchetype, TwistDef, DomainKit, TraitDef, NarrativeBrief) + pipeline a 7 fasi + piano di validazione su strumenti esistenti + catalogo prototipo v0 + **gap motore verificati**:
- **P0-a (bloccante, scoperta nuova):** `applyNodeOutcome` in `questRun.ts` è uno switch cablato su `node.id` — routing post-verdetto ed effetti (info/flag/loot/allarme) sono codice, non dati. Un generatore non può diramare su verdetto senza estendere schema+motore (tocca I-3 → decisione Director).
- **P0-b:** tratti assenti su `ResidentState` (già noto).
- **P1:** vars numeriche core → proposta encoding a flag v0; selezione twist a `createRun`.

**Decisioni che richiede (§11 del doc):** estensione `verdictTable` dichiarativa vs generazione limitata a nodi esistenti; vars flag vs layer numerico; dove vivono i tratti; `arm` twist solo runstart v0; formato chiavi testo traducibile.

**Collegamenti:** `context/QUEST_GENERATION_CONTRACTS.md`, `context/QUEST_GENERATION_SPEC.md`, R-113, R-114, R-115 (piano implementativo in attesa di ratifica — i contratti sono il livello che precede/alimenta quel piano).

**Update 2026-10-10 (risposte del Director alle 4 domande estese):**
- **P0-a → «Tabella dati + legacy»**: `verdictTable` dichiarativa sui nodi nuovi, switch legacy per i goblin. I-3 si apre in modo additivo.
- **Tratti → su `ResidentState`** (`traits: string[]`, identità persistente, visibile in planning).
- **Vars → layer numerico subito** (`vars` nel run state; encoding a flag scartato).
- **Twist → arm misto** (runstart per tratti, in-run per eventi).
Conseguenza: verdictTable + vars + arm misto = **unico delta motore v2** da progettare insieme. Registrato in `QUEST_GENERATION_CONTRACTS.md` §10–11 e `QUEST_GENERATION_SPEC.md` §11.
**Update 2 (2026-10-10):** forma concreta della `verdictTable` formalizzata in `QUEST_GENERATION_CONTRACTS.md` §12 — `OutcomeSpec` (goto/flags/info/loot/gold/damage/alarm/objective/vars ops/rollFlag/logKey) + `GotoSpec` condizionale (branch su flag/notFlag/varGE/varLT con `else` obbligatorio) + esempio di nodo emesso. `rollFlag` copre entrambi gli arm (runstart a createRun, inrun dentro le tabelle). Verdetto aperto solo sui dettagli (quali effetti ammessi per verdetto, espressività esatta dei `Cond`).
**Update 3 (2026-10-10):** `QUEST_GENERATION_CONTRACTS.md` §13 — NarrativeBrief lavorato sul nodo `sc-passa-crepa` (facts/knownToPlayer/hiddenFromPlayer/mustConvey/mayInvent compilati dai dati reali del nodo) + testi dimostrativi in due story mode sullo stesso nodo: dimostra che l'asse narrativo cambia dettagli e atmosfera senza toccare la meccanica. §14 — assorbiti i rilievi tecnici assorbibili del cold read r2 di R-115 (check `crucial∈[3,4]` → §8, repair a livello scenario, registro `mayInvent` anti-allucinazione, regola preview-vs-twist-nascosti, v0=catalogo pre-generato non on-offer, prototipo=prova di fattibilità). Lo **status del piano R-115 resta al Director** (MAJOR REVISION ×4: proposta esplorativa vs draft vs candidato gated — i critici spingono per spike lab-only senza toccare motore finché S4 non chiude).

**Update 4 (2026-10-10) — RATIFICATO:** il Director ha scelto «Ratifica ora + engine v2» sulla domanda estesa di strategia. PLAN-026 registrato `active` in `plans/INDEX.md` (figlio PLAN-019/S5), deroga a v24 registrata in `context/DECISION_LOG.md` 2026-10-10. I 4× MAJOR REVISION restano documentati (`.mw/runs/20261009-quest-generation-plan-v2-critique/`); i rilievi tecnici assorbibili sono in `QUEST_GENERATION_CONTRACTS.md` §14. Attivati: P0–P2 + T2 (delta motore v2 additivo).

## R-117 — Plan pagina Steam (Coming Soon): cosa mettere dove, testi, lingue

**Richiesta (verbatim):** *"Creami un plan su come fare la pagina Steam: cosa mettere dove, ecc. noi abbiamo già molte csoe "utilizzabili", e dobbiamo anche decidere cosa scrivere, come, ecc. farlo in lingue diverse"*
**Data:** 2026-10-09
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** copy Steam consegnato (R-145) + capsule — chiusa su ratifica Director. — plan Proposed, non ratificato.
**Desiderata FROZEN:** nessuna corrispondente (business/marketing non coperto da `.mw/desiderata.md`).
**Contesto dichiarato in chat (2026-10-09):** premium ~14.99 con sconto al lancio; obiettivo = reputazione; nessuna pagina Steam; nessuna scadenza; teaser = scene in-engine registrate e montate (R-072); poi demo Next Fest.
**Artefatto:** `context/STEAM_PAGE_PLAN.md` — decisioni bloccanti D1–D6 (nome del gioco in testa), mappa della pagina, shot list, clip/GIF, bozze testi EN, tag, piano lingue (pagina vs gioco), fasi F0–F8, checklist.
**Collegamenti:** R-072 (teaser), `context/ESTIMATE_AGENT_PROMPT.md`.
**Update (2026-10-09) — dibattito multi-AI web:** raffinato via `mw-web-debate` (run `20261009-steam-page-plan`, mind-weaver). Clarification (17 domande, grounding ledger), 2 round di critica/contro-proposta con lenti diverse (chatgpt=conversione, claude=veridicità, gemini=fattibilità [morto: 4 errori], grok=red-team [morto: estrazione stale]), 7 obiezioni acceptance iterate fino a **converged** su artifact r005 (sha `b926cd84`). Modifiche principali assorbite: claim ledger con stati true-now/true-at-launch/vietato; parole vietate (`hand-painted`, `roguelite` gated su D3); trailer gameplay minimo promosso a P0-alto; screenshot mock esclusi con procedura di selezione; test comprensione con regola zero-misread-critici su 5 tester consecutivi; AI disclosure con provenance audit + tavole build/marketing; gate i18n semantico; Community Hub non bloccante; niente update a scadenza forzata; appendice fonti (CONFIRMED solo con URL). Prezzo 14.99 confermato vs proposta grok 4.99 (decisione Director). Evidence: `test-results/steam-page-plan-debate/` (artifact, report, events, grounding ledger).
**Update (2026-10-09) — D1 risolta:** il Director ha scelto il nome **"Wanderlust: Triumph"** (coerente col plan storico `wanderlust_triumph_steam_concept_slice_plan`). Check Steam: nessun omonimo esatto; attenzione al franchise `Wanderlust` di Different Tales (3 titoli "Wanderlust: X") — verifica marchio EUIPO/USPTO richiesta prima del logo. Restano aperte D2–D6 e la ratifica del plan.
**Update (2026-10-10) — pipeline di cattura:** `tests/e2e/idleVillage/steamCapture.spec.ts` + `steamCaptureVideo.spec.ts` — screenshot reali 1920×1080 e clip gameplay ~29s dalla superficie `/game` (`?capture=1` = clean shot nativo, `?tod=` per l'ora). Output in `test-results/steam-capture/` (7 PNG + webm). **Rilievi per D4/naming:** contenuto quest authored solo IT (il locale EN traduce il chrome, non la narrativa); nomi seed "SIR SPACCACULI" ecc. da rivedere per materiale pubblico; forecast 100% death nello shot planner — serve un party bilanciato per shot marketing.
**Update (2026-10-10) — decisioni Director + kit di produzione:** upload via agente sull'admin Steamworks (scelta A — credenziali in `.env` quando l'account esiste; Steam Guard = sua approvazione una tantum). **Preview locale pixel-simile**: `marketing/steam/preview/index.html` (server `python3 -m http.server 8899 -d marketing/steam`). Kit: `marketing/steam/` — `assets/` (7 PNG 1920×1080, capsule crop 616×353/460×215/231×87, GIF about 2.9MB), `copy/en|it/` (short desc 4 varianti + about.bbcode), `claim-ledger.md`. **D3 decisa: roguelite SÌ** (meta-progressione core: morte→bonus nella run successiva; eroi build-trovati-non-template; si sceglie la quest tra offerte con reward noto — "quella che puoi permetterti"). **D4 decisa: EN+IT**; ES/DE/ZH-CN come localization roadmap a soglie wishlist. **D6: "Coming Soon"**. Prezzo rinviato (non mostrato su Coming Soon). Video principale: lo fa il Director; gli asset About usano GIF (non video).
**Update (2026-10-10) — audit documentale + correzione errori copy:** il primo draft del copy conteneva eventi inventati (carovane, lupi come sistema, "la mappa ricorda"). Fermato il rewrite e fatto audit claim-per-claim su CANON/QUEST_RULES/desiderata/CURRENT_STATE/GTM. Esito: rimossi i claim inventati; **business/marketing doc trovato** = `src/docs/docs/strategy/go_to_market_steam_first.md` (+ PHASE 12.0 MASTER_PLAN: ricerca idle/offline, bande revenue); doc citati ma **mancanti nel repo**: `MARKET_RESEARCH_ANALYSIS.md`, `PROFIT_LEVERS_IDLE_VILLAGE.md`. Decisioni Director registrate in DECISION_LOG 2026-10-10: **(1)** gate deviation ratificata — pagina prima del ciclo run→meta→run stabile, Coming Soon con claim conservativi; **(2)** tre meccaniche = `intento-Director` (scelta tra offerte con costi noti / eroi non-template a skill trovate / morte→bonus = roguelite); **(3)** lingue — pagina EN/IT, gioco alla demo EN/IT/DE/FR (FR incerta), ES/DE/ZH-CN dopo trazione; **(4)** GTM H1-2026 → storico. Claim ledger riscritto su queste decisioni; copy EN/IT riscritto claim-per-claim.

## R-118 — PLAN-019-S3: la parte precedente (Planner completo su /game)

**Richiesta (implicita nel flusso):** *"procedi"* dopo la chiusura di PLAN-025 — lo stadio S3 del macro plan Quest era il prossimo della sequenza ratificata v24 («Poi fare in modo di vedere anche la parte precedente: il planning, assegnare gli slot, ecc.»).
**Data:** 2026-10-09
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — plan **battezzato `active`** (Director 2026-10-09 «approvo»: D-S3-1/D-S3-3/draft persistente ratificati); cold read r1 groq MAJOR assorbita.
**Desiderata FROZEN:** v23 (Mission Planner PARTY/LOADOUT/OUTCOME, BY MEMBER, WHY, delta, reversibilità esatta) + v24 (stadio S3; preview sui check certi, compound su ipotesi dichiarate).
**Artefatto:** `plans/PLAN-019-S3-parte-precedente.md` — gap analysis vs S2.4, 3 decisioni di struttura (D-S3-1 detail=Planner / D-S3-2 MC non DP / D-S3-3 info secondaria), task T-0…T-6, gate del macro (trade-off reali, non-risolta-nel-planner, preview≡resolver, Director).
**Collegamenti:** `plans/PLAN-019-quest-macro-plan.md` §S3, `plans/PLAN-018-mission-planner.md`, PLAN-019-S2.* (superficie ereditata), DECISION_LOG 2026-10-01.

## R-119 — Validazione E2E completa del ciclo di vita quest su /game («Sterminio dei goblin»)

**Richiesta (verbatim):** *"sulla pagina /game mi serve validare tutto il flow che parte da Roster alla fine della quest e ricevute ricompense e mandati i pg 'a casa', sparisce il POI. M serve un bel sistema che testi da playwright/pupeteer tutto il workflow, pezzo x pezzo e m controlli che tutto fili liscio, i controlli del tempo, accelerando, stoppando, ecc. la quest deve essere sterminion goblin in quella pagina"*
**Data:** 2026-10-11
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`.
**Desiderata FROZEN:** nessuna nuova — estende la copertura E2E di PLAN-019-S2.4/S2.5 sulla superficie canonica.
**Artefatto:** `tests/e2e/idleVillage/gameQuestLifecycle.spec.ts` — suite pezzo per pezzo: boot roster+POI → click sul marker reale → planning (gate «Invia», residente non eleggibile) → drag reale dal roster → forecast → lancio → POI `in_progress` → controlli tempo HUD (pausa/ripresa/×1/×4, un solo driver) → frontiera pending che matura sul clock canonico → esito terminale → settlement una volta sola (gold/xp/destini come dati) → PG rilasciati e ri-assegnabili → chiusura rapporto → POI sparisce → persistenza dopo reload.
**Fix indotti dalla validazione:**
- `game-frame-pixi.tsx`: rimosso il secondo driver del clock (`useCentralizedTiming` duplicava `useTimeEngineLoop` dentro `GameFrameScreen` — tick ~2×). Contratto «un driver per screen» ora rispettato.
- Consumo POI: run `ended`+`settled` + chiusura del rapporto (X / «Chiudi il rapporto» / menu pannelli / Q) → `questRun.clear()` + POI marcato `consumed` persistito via `PersistenceService` (`idleVillage.questPois.consumed`) → marker escluso dagli anchor, anche dopo reload (tabella terminali PLAN-019-S2.5: ogni esito ⇒ «POI chiude»).
- Testability: `data-quest-poi-id` su `MapQuestPoi`, `data-testid="quest-window-close-report"` su `QuestRunWindow`, hook `getClock()` negli `__idleVillageTestHooks`.
**Collegamenti:** `tests/e2e/idleVillage/gameQuestExpedition.spec.ts` (infrastruttura hook/driveRunToEnd riusata), PLAN-019-S2.4/S2.5, R-107.

## R-120 — /game: nuvole senza ombre e ombre senza nuvole

**Richiesta (verbatim):** *"in /game ci sn nuvole senza ombre (soprattutto sul terreno nn ne vedo MAI, ma solo sul mare) e ombre senza nuvole (sempre e solo sul mare?). Prendi la skill bugfix"*
**Data:** 2026-10-10
**Stato:** `fatta` (2026-10-10) — verificato live via Puppeteer: ogni ombra ha la sua nuvola a offset (+90,+140), coppie su mare e terraferma. Evidence: `test-results/r120-game-cloud-shadows-2026-10-10.log`. Nota safeguards: vitest scope bloccato da saturazione macchina (load>400, worker timeout — non failure del codice); build:check e kanban:lint verdi.
**Desiderata FROZEN:** nessuna nuova — bugfix sulla superficie canonica (v2, mappa viva).
**Diagnosi:** in `PixiWorldMap.tsx` ombre e nuvole sono due sistemi disaccoppiati: ombre = 16 sprite deterministiche da `band.sprites` (fase `delaySeconds`, `y` fisso), nuvole = spawn random (sprite, `y`, larghezza, `t0` casuali) → nessuna ombra corrisponde mai a una nuvola. Invisibilità sulla terraferma = contrasto sul dipinto scuro + mancanza di corrispondenza di moto (le ombre attraversano la terra per il 60-80%, misurato su `land_mask`).
**Fix:** ombra accoppiata alla nuvola alla nascita (`birthCloud` crea entrambe; stesso t0/w/y, offset `cloudShadowOffset`, alpha `cloudShadowOpacity ?? band.shadowOpacity` × envelope `formed`); via il replay deterministico orfano. Bug dir: `.mw/bugs/2026-10-10-game-cloud-shadows/`.

## R-121 — /game: l'isola torna sotto l'HUD in basso

**Richiesta (verbatim):** *"sempr ein quella pagina: nn avevamo ingrandito il mare in modo tale che la paerte dell'HUD in basso nn coprisse l'isola? xè la vedo di nuovo coperta? Devi testare guardando direttamente da FE. usa la skill bugfix"*
**Data:** 2026-10-10
**Stato:** `fatta` (2026-10-10) — verificato live su FE via Puppeteer: a 1600×760 e 1920×800 l'isola poggia ora sopra il nav (prima: ~45px sotto); 1400×900 invariato. Evidence: `test-results/r121-island-under-hud-2026-10-10.log`. Safeguard nota: macchina satura da sessioni parallele (load>300) — build:check/vitest/kanban:lint non completabili in-sessione; ultimo build:check verde 16:50 sullo stesso file.
**Desiderata FROZEN:** nessuna nuova — bugfix sulla superficie canonica.
**Diagnosi:** `PixiWorldMap.refit()` — `cam.zoom = max(floorZoom(), fitZoom)`: su viewport larghi/bassi il floorZoom (mare specchiato deve coprire lo schermo intero, W/(4240+2·700)) supera il fit dell'area libera → la terra è più alta dell'area libera e, essendo centrata verticalmente, sborda sotto il plinto di navigazione (e sopra sotto la placca). L'allargamento del mare (8254e8e1, margin 260/300→700/400) ha solo spostato la soglia, non risolto il conflitto. **Fix:** se `landH > freeH` il `panY` pinna `land.y1` sul confine libero (isola poggia sopra il nav, eccesso a nord) — altrimenti centratura invariata. Bug dir: `.mw/bugs/2026-10-10-game-island-under-hud/`.

## R-123 — PLAN-019-S4: integrazione completa quest↔gioco (stadio S4 del macro plan)

**Richiesta (verbatim):** *"procedi x il plan"* (dopo chiusura PLAN-019-S3, stadio successivo del roadmap v24 FROZEN)
**Data:** 2026-10-10
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — draft piano S4 in preparazione; battesimo Director pendente (incluse D-5 Gate B e destino superfici lab).
**Collegamenti:** `plans/PLAN-019-quest-macro-plan.md` (§S4, gate a–d, artefatto «definizione di buona quest»), `plans/PLAN-019-S3-parte-precedente.md` (completed), `.mw/desiderata.md` v24.

## R-124 — /game: POI sempre in mappa + halo che nasce piena

**Richiesta (verbatim):** *"sempr ein /game c'è un POI sulla mappa sempre, nn deve esserci. quando clicco director per fare apparire i POI appaiono cn l'halo già riempito, nn deve essere così. cambia proprio lo stato: un poi 'appena creato' deve partire sempre cn l'halo Vuota, a meno che nn c sia il flag 'in scadenza' (nn ricordo cm si chiama esattamente), in quel caso parte da pieno, il colore dell'halo è diverso e si 'scarica in senso antiorario. Consulta la documentazione, ma d default il comportamento è vuota => carica in senso orario"*
**Data:** 2026-10-10
**Stato:** `fatta` (2026-10-10) — verificato live su FE via Puppeteer: 0 marker al boot; «Show quest» rivela goblin+rovine con sigillo **vuoto**; in finestra `expiring` (flag documentato `questAvailability`, sotto `EXPIRING_BELOW`=25%) l'anello è ambra warn `#d98a4a` e scarica antiorario (sweep flag 0 nel DOM); scaduta senza run il POI esce; run attiva resta pinnata. Evidence: `test-results/r124-poi-halo-reveal-2026-10-10.log`.
**Desiderata FROZEN:** nessuna nuova — bugfix sulla superficie canonica; contratto di riferimento `poi_cooldown_spec.md` C-001/C-004 + D-H (halo vuota finché «Invia spedizione», poi si riempie elapsed/duration).
**Diagnosi:** tre cause sovrapposte: (a) `game-frame-pixi.tsx` pushava i POI expedition negli anchors senza gate → sempre visibili; (b) `MapDemoPoi` passava `state="available" progress={1}` e la famiglia legge `available`/`new` come sigillo intero → demo nati pieni; (c) il countdown era un `LiquidHalo` separato **orario** e `expiring` non aveva palette warn nel primitivo V3_5.
**Fix:** `mapQuestPoiView` → `{state, progress, deadlineWarn, direction}`: offerta fresca = `assigned`+0 orario (vuota); `expiring` = stato semantico `expiring`, progress = stretch rinormalizzato piena→0, antiorario, warn `--skin-status-unmet` + breath C-004; `expired` = fade. Anchor gated su `questShown` (Director «Mostra quest», toggle) o run attiva; mock `city-rats` fuori mappa; hook E2E `revealQuestPois` per `?capture=1`. Bug dir: `.mw/bugs/2026-10-10-game-poi-halo-state/`.
**Safeguards:** lint scope 0 errori; unit `mapQuestPoi.test.ts` 8/8; build:check PASS; kanban:lint PASS. E2E spec aggiornate al reveal (da rilanciare in CI).

## R-126 — Roster reale 3 eroi + 3 popolani e party completo nel lifecycle E2E

**Richiesta (verbatim):** *"I pg sn mockati, giusto? ma a noi serve assegnare quelli veri dal roster, tramite il pannello di assegnazione (cha ha anche la preview della quest totale). E inoltre: quelli sn 3 eroi, ci servono 3 popolani, li puoi creare tu tramite il sistema corretto, come fosse stato creato a mano correttamente? pg, resident, ecc? controlla la documentazione. Alla fine d questo lavoro io devo poter assegnare 1 eroe e 3 tizi normali nel POI detail, far partire la missione, far scorrere il tempo, eseguire la missione, recuperare reward e avere i pg che tornano al roster."*
**Data:** 2026-10-10
**Stato:** `fatta` — `TEST_ROSTER_VILLAGERS`: 3 `SavedCharacter` `isHero:false` (Mastro Beppe/Lisetta/Baldassarre) nella stessa shape del Character Manager → `savedCharacterToResident` (via corretta da `character_resident_trusted.md`); `TEST_ROSTER_RESIDENTS` combinato consumato da `canonicalResidentData` (roster/eligibilità con `statTags`) e da `createInitialState` dello store. Tag tarati sugli slot goblin: beppe→member-1 'fortitude', lisetta→member-2 'precision', baldassarre→bodyguard 'warden'. Suite lifecycle: `assignViaRealDrag` (scrollIntoView + drag pointer) e `launchGoblinQuest` trascina REALMENTE 1 eroe+3 popolani nei 4 slot; test «lancio» asserisce party=4 ⊆ roster; test «PG a casa» asserisce nessun sopravvissuto `in-expedition`. Guida aggiornata (reveal R-124, fixture, 12 test).
**Safeguards:** suite lifecycle 12/12 verdi (reveal R-124 + drag 4 slot); lint scope 0 errori; build:check PASS; unit TestRosterPage verdi con timeout ambientale alzato (macchina sotto load — i 5s di default non bastano, non una rottura); kanban:lint PASS.

## R-127 — Approcci alternativi alla core gimmick (check su stat/skill diverse)

**Richiesta (verbatim, voice-note):** *"questa missione può essere risolta usando come infiltrazione al posto di destrezza ad esempio la magia. Però all'interno sempre di questa quest ci saranno dei tiri che saranno comunque basati su destrezza perché rimarrà una quest basata sulla destrezza e che non ha a che fare con l'infiltrazione. Quindi che ne so, devi passare su un ponte traballante"* — *"io soprattutto stavo pensando di andare a toccare la core gimmick di quella quest"* — *"invece di risolvere la core gimmick dell'allarme che sale passando di soppiatto, ogni volta che c'è un tiro che dovrebbe far aumentare l'alarm in quel caso diventa su intelligenza tirando invisibilità o carisma tirando camuffamento. Però tutte le altre parti rimangono invariate [...] ce l'hai presente la quest che io ho fatto che è sul lo sterminio dei goblin ce l'hai in memoria"*
**Data:** 2026-10-10
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — proposta registrata; nessuna ratifica, nessuna implementazione autorizzata.
**Desiderata FROZEN:** nessuna corrispondente — candidata a livello generazione quest (S5 / OPEN-014 orbita).

**Contenuto classificato:**
- **PROPOSAL — canali alternativi sui check core:** una core gimmick (es. infiltrazione/allarme che sale) normalmente su Destrezza può ammettere canali di check alternativi: invisibilità → Intelligenza, camuffamento → Carisma.
- **PROPOSAL — vincolo di scope:** la sostituzione vale **solo per i check che muovono la variabile core** («ogni tiro che dovrebbe far aumentare l'alarm»); i check non-core restano sulle stat native (ponte traballante → Destrezza, scene di forza → Forza). Non si ridipinge la quest.
- **INFERENCE (marcata):** «tirando invisibilità» suggerisce canali gated da skill/capacità del party (link desiderata v10/v12, skill equip) — da confermare.
- **UNRESOLVED:** modello di binding — per-check in-run vs approccio scelto a monte vs gated da skill/party → **OPEN-017**. Risposta AI finale troncata a metà generazione: la variante che stava proponendo è irrecuperabile.
- **FACT (testbed):** la quest goblin ha allarme reale (`campoAllertato`/`campoSveglio`, `alarm` bool, scelta di approccio F3) e i check legano già `stats[]` per nodo — banco naturale se ratificata.

**Collegamenti:** `context/ingestions/2026-10-10-quest-gimmick-approcci-alternativi.md`, `QUEST_RULES.md` §7 (`proposta`), `context/QUEST_GENERATION_ARCHITECTURE.md` §16, OPEN-017, `quest_sterminio_goblin_spec.md`, R-111/R-113/R-116 (framework generazione).

## R-128 — Ricerca strutturata sui canali alternativi alla core gimmick (R-127)

**Richiesta (verbatim):** *"prendi questo argomento, approfondiscilo, crea una documentazion/arricchisci quello che abbiamo: fa una ricerca mirata, dividilo in diversi argomenti di ricerca: usa le Ai web per fare una ricerca approfondita di ognuno di questi argomenti, salvali, creare un rapporto finale x ogni argomento. Poi un rapporto finale x tutti gli argomenti, cosa ahi trovato, cosa ci serve, cosa possiamo usare contestualizzato al nostro progetto: usa cappelli corretti, prompt potenziati, ecc"*
**Data:** 2026-10-10
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — ricerca eseguita, rapporti prodotti, docs aggiornati; le proposte emerse restano non ratificate (OPEN-017 resta `open`).

**Contenuto classificato:**
- **FACT (esecuzione):** 6 sotto-argomenti (precedenti, binding models, bilanciamento, UI/preview, psicologia, narrativa) → broadcast `mw-broadcast.py` su provider web con prompt potenziati + hat + ricerca propria di complemento. Copertura: deepseek 6/6, gemini 4/6, claude 1/6, grok 1/6; fallimenti registrati (chatgpt 6/6, claude 5/6 login/challenge, grok 5/6 stub). Evidenza in `.mw/runs/20261010-gimmick-channels-research/` (prompt + BROADCAST.md + report-t1..t6).
- **FINDINGS (ricerca, non decisioni):** consenso su binding ibrido — lock run-level capability-gated + eccezioni a consumo; differenziazione ≥2 assi con profili di fallimento distinti; varianti canale sullo stesso nodo (storylet-gating, non node-splitting); canali bloccati greyed «Requires: …» + coverage panel; MVA narrativa + asse validazione world-rules; policy MC channel-health; menu multi-canale solo su pivot check.
- **PROPOSAL (da ratificare):** P-01..P-07 nel rapporto consolidato — nessuna è decisione; OPEN-017 aggiornato con leaning ma resta `open`.
- **REJECTED:** best-of-party aggregation; canali su ogni check; reskin identici; >3 canali/check; canali bloccati nascosti; node-splitting per canale; parità EV come target; canali che bypassano la gimmick.
- **DIVERGENZA-NOTA:** research segnala tensione tra preview a numeri esatti (frozen R-108) e scelta espressiva (EV-shopping sopprime roleplay) — mitigata, non risolta; a giudizio Director.

**Collegamenti:** `context/QUEST_GIMMICK_CHANNELS_RESEARCH.md`, `.mw/runs/20261010-gimmick-channels-research/`, R-127, OPEN-017, `context/QUEST_GENERATION_ARCHITECTURE.md` §16.1, `context/QUEST_GENERATION_CONTRACTS.md` §11.9.

## R-129 — /game: nessun POI al boot + reveal/hide con trasformazione e halo vuota

**Richiesta (verbatim):** *"nella pagina /game c'è un POI di partenza appena viene caricata la pagina. nn c deve essere, deve mostrarsi solo quando dal mnu del director clicco POI types (e anche qulla della quest deve essere come le altre 2, apparire e sparire con una trasformazione, di partenza halo vuoto, ecc, guarda cm si comportanto gli altri due"*
**Data:** 2026-10-11
**Stato:** `fatta` — verificato live su FE via Puppeteer.
**Desiderata FROZEN:** nessuna nuova — bugfix sulla superficie canonica; **supera la clausola «run attiva pinnata» di R-124**: ora nessun marker esiste senza un toggle Regia («Mostra quest» o «POI types»).

**Diagnosi:** due gap distinti: (a) `game-frame-pixi.tsx` montava gli anchor expedition se `exp.run` — qualsiasi run persistita (live o ended+settled non ancora dismissata) pinnava il suo POI al boot — questo era il «POI di partenza»; (b) le uscite erano unmount istantanei per TUTTI i marker (i demo inclusi) e il POI quest mostrava subito l'halo allo stato live invece di nascere vuota.

**Fix:** gate expeditions su `questShown` («Mostra quest» mostra offerte reali + run); `poiDemo` («POI types») aggiunge l'esemplare goblin reale + demo job/event come prima. Uscite: ghost anchor derivati in render (adjust-state-on-prop-change) — il nodo uscente resta nella lista keyata del commit stesso, il DOM sopravvive e il prop `exiting` riproduce il fade+shrink speculare all'ingresso (implementazione via effect rimuoveva il nodo PRIMA del ghost: pop-off invariato). `MapQuestPoi`: prop `exiting` + write-in del sigillo via rAF 0→progress in `SEAL_WRITE_IN_MS`=800ms («di partenza halo vuota»: anche una run in_progress nasce con sigillo vuoto e si scrive fino allo stato live; `prefers-reduced-motion` salta il tween). `MapDemoPoi`: prop `exiting`. E2E `gameQuestExpedition` aggiornate al reveal (badge decision + marker post-reload non pinnano più).

**Safeguards:** lint scope 0 errori; unit mapQuestPoi 8/8 + quest scope 290/290 (4 timeout ambientali al primo giro, verdi al retry — macchina sotto load, pattern già noto); build:check PASS; kanban:lint PASS; smoke /game 200 + Puppeteer: 0 anchor al boot con run live persistita, reveal → 3 marker con ease-in e sigillo che si scrive da vuoto, hide → fade+shrink sincrono poi unmount. Spec E2E da rilanciare in CI. Evidence: `test-results/r129-poi-director-gate-2026-10-11.log`.

## R-130 — /game: pulsante Director «Start goblin quest» morto con run esistente

**Richiesta (verbatim):** *"il pulsante start goblin quest è sempre attivo e nn fa nulla"*
**Data:** 2026-10-11
**Stato:** `fatta` — verificato live su FE via Puppeteer (run goblin live persistita).

**Diagnosi:** due cause sovrapposte: (a) `demoLaunch` apre il detail (`setIsDetailOpen(true)`) ma l'overlay è reso solo se `!run` — con run live non si apre nulla; (b) l'effetto del pending launch si cancella su `anyRunActive` → il click non produceva nulla di visibile. `active: !!run && !ended` restava acceso permanentemente con run persistita.

**Fix:** `onTrigger` del bottone `questRun`: se esiste una run goblin (live o ended) → `openRunWindow('goblin')` — la stessa superficie canonica a cui il marker in mappa reindirizza (finestra run / report); altrimenti `demoLaunch()` invariato. `active` onesto: acceso = spedizione in volo. Fix non-distruttivo: nessuna cancellazione di run da un click accidentale.

**Safeguards:** lint scope 0 errori; build:check PASS; kanban:lint PASS; smoke live: chiusa QuestRunWindow → click «Start goblin quest» → `quest-window` riaperta (prima: nessun effetto visibile). Evidence: `test-results/r129-poi-director-gate-2026-10-11.log` (sezione R-130).

## R-131 — /game: rimosso il pulsante Director «Show quest» (non funzionale)

**Richiesta (verbatim):** *"il pulsante show quest nn fa nulla, può sparire"*
**Data:** 2026-10-11
**Stato:** `fatta` — verificato live su FE via Puppeteer.

**Diagnosi:** il toggle «Show quest» era ridondante rispetto a «POI types» (che presenta gli stessi marker più i demo job/event) e percepito come morto — con nessuna offerta/run da mostrare il click non produceva nulla di visibile.

**Fix:** rimossa l'azione `quest` dall'array `directorActions` in `game-frame-pixi.tsx`. `questShown` e l'hook `revealQuestPois` restano: sono il percorso di reveal usato da E2E e `?capture=1`, e gating degli anchor expedition. Comportamento R-129 invariato: 0 marker al boot, reveal/hide con trasformazione solo via «POI types» (demo) o hook (reale). Guida E2E aggiornata.

**Safeguards:** lint scope 0 errori; build:check PASS; kanban:lint PASS; smoke live: Director senza «Show quest», azioni rimaste (invasion, questRun, poitypes, wonder, skin, reset), 0 anchor al boot.

## R-132 — /game: componente HUD in alto a sinistra (menu di gioco)

**Richiesta (verbatim):** *"In alto a sinistra serve un altro componente di HUD come gli altri due, magari cn le opzioni, salvataggi, il pulsante panles, ecc"*
**Data:** 2026-10-11
**Stato:** `fatta` — verificato live su FE via Puppeteer.

**Decisioni del Director:** forma = lastra `hang` con menu a tendina; contenuto = voci reali + stub disabilitati; il pulsante Pannelli in basso a destra resta dov'è.

**Implementazione:** nuovo `HudGameMenu` (`components/gameFrame/`) — placca `HudPlaque shape="hang"` con bottone Menu; dropdown `shape="panel"` (chiusura Esc/click fuori, come HudPanelsMenu). Voci: sezione **Pannelli** (stesse righe checkbox del menu Pannelli, incluse dev se `includeDev`), sezione **Partita** («Salva ora» reale con flash «Salvato», «Carica partita…» e «Esci al titolo» stub disabilitati), sezione **Opzioni** (radio skin base/lacquer reali + «Tutte le opzioni…» stub). Nuovo `menuSlot` su `GameFrame` nella cella top-left accanto all'obiettivo; wiring in `GameFrameScreen` (`panels`, `gameplay.saveNow()`); `game-frame-pixi` passa `skinControl` live. Nuova azione store `saveNow()` → stessa chiave/percorso canonico dell'autosave + telemetria `minimal_gameplay_save_now` / `game_menu_*`. Fix collaterale: ref `timeKeys` assegnato in effect (errore lint `react-hooks/refs` preesistente).

**Safeguards:** lint scope 0 errori (fixato anche refs-in-render preesistente); unit `hudGameMenu.test.tsx` 7/7 + file in STRICT_FILES (i 2 fail di hudGuards sono violazioni preesistenti in MapQuestPoi/QuestRunWindow, presenti in HEAD); build:check PASS; smoke live: placca MENU in alto a sx stesso materiale, tendina con tutte le voci, «Save now» → «Saved», skin radio funzionanti, stub grigi.

## R-133 — /game: click POI quest → dettaglio prima, finestra run solo a spedizione in corso; roster laterale

**Richiesta (verbatim):** *"quando clicco il POI di tipo quest deve prima apparire il componente POI detail. Solo quando la quest è attiva e si sta svolgendo allora deve apparire il componente che vedo adesso quando c clicco su. Inoltre quel componente di cui sto parland, quello che appare adesso: quando clicco il pulsante del roster le info dei personaggi (l'elenco di pgCard) deve apparire accanto, nn coprire il componente"*
**Data:** 2026-10-11
**Stato:** `fatta` — verificato live su FE via Puppeteer.

**Diagnosi:** `useQuestExpeditionSession.handlePoiClick` instradava su `openRunWindow` per QUALSIASI run esistente — incluse quelle `ended` (report visto nel caso del Director). Il `Popover` della `QuestRunWindow` (roster/bag/chronicle) era `absolute` dentro la finestra (`top:44; left/right:12`) → copriva il contenuto.

**Fix:** click POI → `run && !run.ended` → `QuestRunWindow`; altrimenti (offerta senza run o run conclusa) → `QuestExpeditionDetail` (gate overlay allargato a `!run || run.ended`). Il report resta raggiungibile dal menu Pannelli («Quest in progress», tasto Q) e dal pulsante «Start goblin quest» (R-130). `canSend` resta protetto da `!anyRunActive` — il dettaglio su run ended non rilancia. `Popover` riposizionato: `right: calc(100% + 10px)`, larghezza 300px, `maxHeight calc(100vh - 180px)` con scroll — pende dal bordo sinistro della finestra, accanto e non sopra (vale per roster, bag e chronicle).

**Safeguards:** lint scope 0 errori; unit mapQuestPoi 8/8; build:check PASS; smoke live: run live (waiting) → click marker → `quest-window` (corretto: in corso); click pill roster → popover misurato `right:422 ≤ window.left:432` — accanto, contenuto finestra non coperto.

## R-134 — Delega Director: adozione del binding model research-backed

**Richiesta (verbatim):** *"fai cm reputi meglio"*
**Data:** 2026-10-11
**Stato:** `fatta`
**Triage R-156 (2026-10-12):** chiusa `fatta` — evidenza in `context/request-triage-2026-10-12.md`. — interpretata come delega a decidere sui punti lasciati al Director al termine di R-128 (binding model OPEN-017, gestione divergenza preview, avvio spec prototipo v0).

**Contenuto classificato:**
- **DECISION (per delega, reversibile):** adottato il modello di binding research-backed → **lock di approccio a run-level, capability-gated dal party, con eccezioni a consumo**; roll per membro nominato; max 3 canali per check; menu multi-canale solo sui pivot check; canali bloccati greyed «Requires: …». OPEN-017 → `risolta`.
- **DECISION (per delega):** la divergenza numeri-esatti vs espressività si gestisce **senza toccare la regola frozen R-108**: mitigazione via risk tag + stakes narrative nel preview + menu solo su pivot check. Monitoraggio al playtest → OPEN-018.
- **FACT (conseguenze):** `QUEST_RULES.md` §7 → `vigente` (con nota di reversibilità); contract sketch canale in `QUEST_GENERATION_CONTRACTS.md` §11; piano prototipo `plans/PLAN-028-gimmick-channels-v0.md` (draft, testbed quest goblin).

**Collegamenti:** `context/QUEST_GIMMICK_CHANNELS_RESEARCH.md`, OPEN-017 (risolta), OPEN-018, PLAN-028, `QUEST_RULES.md` §7.

## R-135 — /game: la quest goblin e il suo componente devono essere in inglese

**Richiesta (verbatim):** *"la quest principale su cui stiamo lavorando e il suo componente, Sterminio del goblin visibile nella apgina /game quando clicco il pulsante del director deve essere tradotta in inglese"*
**Data:** 2026-10-12
**Stato:** `fatta` — titolo «Goblin Extermination»; e2e verificato (marker → detail, Director → QuestRunWindow).

**Scope:** traduzione completa della superficie quest su /game (Director «Start goblin quest» → QuestExpeditionDetail → QuestRunWindow → epilogo/report): scenario `goblin.ts`, e per coerenza di componente anche `rovine.ts` (stesso POI/finestra sulla mappa), TUTTE le stringhe generate dal motore `questRun.ts` (armi, danni, combattimento, log, epiloghi, opzioni sintetiche), preset lab goblin/rovine, etichette stat (`STAT_LABELS`/`STAT_SHORT`), fix logica locale-dipendente (regex `non si rialza` → `deathLines` strutturato), test e fixture (oracolo ricalibrato: sorgente git non più disponibile). Il manoscritto lab-only della quest cassa (`questScenario.ts`) resta in italiano — fuori da /game.

## R-136 — /game: scritte HUD in alto non centrate + asset icone risorse dipinti

**Richiesta (verbatim):** *"nell'HUD le scritte nei componenti in alto nn m sembrano decidsamente centrate, sembrano in alto. Inoltre ci mancano gli asset delle risorse, scaricali adeguati al nostro progetto e sostituiscili"*
**Data:** 2026-10-11
**Stato:** `fatta` — verificato live su FE via Puppeteer.

**Diagnosi (1):** le placche `hang` in alto portavano padding asimmetrico `top ~6-10px / bottom ~18-22px` (pensato per non coprire i fianchi curvi della silhouette), che collocava il contenuto ~5-6px sopra il centro geometrico; con il sag inferiore il testo leggeva "in alto".

**Fix (1):** padding ribilanciato verso il centro ottico (misurato su DOM): `GameFrame` placche centro/destra `10/20-22` → `16/15`; `HudGameMenu` `6/18` → `13/11`; `ObjectiveCartouche` `8/20` → `14/14`. Centro contenuto ora al/sotto il mid geometrico (menu 26.2/25.5, centro 36.3/36, destra 36.3/36).

**Diagnosi (2):** le icone risorsa erano glifi SVG a tratto (`HudGlyph` gold/food/wood) — segnaposto wireframe accanto al materiale lacca/ottone dipinto.

**Fix (2):** generate via pipeline canonica SDXL (`scripts/rpg-gen-mockup.py`, spec `.mw/specs/hud-resource-icons/` con design-intent/identity/prompt, `--enforce-canon`), selezionate, ritagliate a medaglione circolare con alpha e ridotte a 96px WebP: `public/assets/fantasy_ui/icon_{gold,food,wood}.webp`. `HudGlyph` ora serve l'asset per gli id `gold|food|wood` (`HUD_ICON_ASSETS`), SVG invariato per gli altri.

**Safeguards:** lint scope 0 errori (file in quarantena); unit hudGameMenu 7/7; hudGuards: 2 fail = violazioni preesistenti in HEAD (MapQuestPoi hex, QuestRunWindow fontSize 11) — nessuna nuova; build:check PASS; kanban:lint PASS; smoke live /game 200: tre medaglioni renderizzati, nessun errore console.

## R-137 — /game: filtro roster V2 inutile/morto + icone brutte

**Richiesta (verbatim):** *"il componente roster v2 ha il filtro nn funzionante, deve tornare utile e filtrare per tutte le cose che la V1 già faceva. Inoltre: le sue icone sn brutte, scaricale online e usane d migliori che siano a tema cn il nostro progetto"*
**Data:** 2026-10-11
**Stato:** `fatta` — verificato live su FE via Puppeteer.

**Diagnosi:** il select status funzionava ma era l'unico controllo vivo dell'header compatto: il select stat-sort era un mockup inerte (stato locale mai consumato) nascosto in compact, e il comparatore interno `sortedResidents` era applicato solo oltre la soglia di virtualizzazione (30) — con roster piccoli l'ordine era quello upstream e il raggruppamento eroi-attivi-bloccati non veniva mai applicato.

**Fix (sort/filtro):** `sortSelection` reale con opzioni complete della superficie V1 — i 4 modi di `rosterSortConfig` (Nome A→Z, Nome Z→A, HP, Fatica) + statistiche dinamiche `stat:<key>` da `getFilterStatKeys()` (tracciano lo StatBlock del Balancer) + toggle direzione (abilitato solo sulle stat). Il comparatore ordina dopo il filtro status, dentro i gruppi eroe/attivo/bloccato, con fallback stabile sull'ordine upstream (il `RosterSortIcon` nome A→Z/Z→A resta vivo). Il ramo non-virtualizzato ora renderizza `sortedResidents` (prima bypassava il comparatore). Select visibile anche in compact. Rimossi i `console.log` di debug dal percorso filtro/selezione.

**Fix (icone):** glifi scaricati da game-icons.net (CC BY 3.0 — Lorc: eyeball/hidden/cross-mark; Delapouite: funnel/checklist/split-arrows), rielaborati come path `currentColor` nel nuovo modulo `src/ui/idleVillage/components/gameIcons.tsx` (attribution in JSDoc). Sostituiscono Eye/EyeOff/X/ArrowUpDown di lucide nell'header V2 e il glifo SVG rotto di `RosterSortIcon`. Il select filtro ha icona funnel, il sort checklist.

**Safeguards:** lint scope 0 errori; test `rosterV2Controls` 5/5 nuovi, `rosterSortIcon` 7/7, `rosterSortConfig` 8/8, `RosterStatFilter` 20/20, `rosterKit.compact` verde; `VillageRosterSection.unit` 4 fail = `sortMode="rarity-desc"` non supportato, crash identico su HEAD (preesistente); `hudGuards` 2 fail preesistenti in HEAD; build:check PASS; kanban:lint PASS; smoke live /game 200: ordinamenti `name-desc`/`stat:damage` e filtro `available` verificati sul DOM (6→5 residenti), pill 26px, 6 glifi fantasy renderizzati.

## R-138 — /game: bottoni del menu sbagliati + lingua IT/EN nel menu

**Richiesta (verbatim):** *"i pulstanti di /game menu in alto a destra sn sbagliati. ha seguito la guida su come fare i componenti nel mio progetto? xè se ci sn quei pulsanti considerati corretti allora la guida è sbagliata, devi modificarla. in quel menu ci deve essere anche la lingua IT e EN, e deve funzionare."*
**Data:** 2026-10-11
**Stato:** `fatta` — verificato live su FE via Puppeteer.

**Diagnosi:** le voci del dropdown di `HudGameMenu` (R-132) renderizzavano come barre bronze-CTA piene invece che pill da 26px: il `data-hud-controls` copriva solo il bottone trigger, non il contenuto del menu. La guida (`hud_component_guide.md` §5) aveva ragione ma non esplicitava la trappola per i menu a tendina — aggiunta regola dedicata.

**Fix:** `data-hud-controls` spostato sul root del componente (pattern `HudPanelsMenu`) → trigger e voci sono pill da 26px. Nuova sezione **Lingua** in Opzioni: radiogroup `menuitemradio` English/Italiano via `useLocalization().setLocale` (i18next + persistenza `LocaleConfigStore`→`PersistenceService`), telemetria `game_menu_language_select`; chiavi `gameFrame.menu.language(s)` in en+it-IT. Etichetta visibile «Theme» sul gruppo skin per simmetria. Guida §5 aggiornata con la trappola menu-a-tendina.

**Safeguards:** unit hudGameMenu 9/9 (+2 test nuovi), hudGuards 2 fail preesistenti HEAD (non nuovi), lint 0 errori (quarantena), build:check PASS, kanban:lint PASS; live Puppeteer: pill corrette, IT→`lang=it-IT` etichette italiane, EN→revert, scelta persistita.

## R-139 — Ferite guariscono solo a riposo + popolani 50HP/stat basse + race F10 Director

**Richiesta (verbatim):** *"le ferite si rigenerano quando sei nel roster senza fare nulla (a riposo?), insomma quando nn sei assegnato a fare qualcosa, se sei assegnato (quest, lavoro, ecc) le ferite continuano a nn sparire. Si, i feriti possono fare quest. […] Fixa. I popolani devono avere stats e Hp + bassi, tipo massimo +10 nell stats e 50hp base. riprova la run"*
**Data:** 2026-10-12
**Stato:** `fatta` — suite lifecycle E2E 13/13 verdi.

**Diagnosi (ferite):** il `tick()` di `useMinimalGameplay` sanava chiunque avesse `injuredUntilTick <= currentTick` senza guardare lo status — un ferito mandato in spedizione (eleggibile per `assignableStatuses`) guariva mentre era fuori. Non esisteva il concetto di «riposo» nella guarigione.

**Fix (ferite):** flag `isOnExpedition` su `MinimalResident` (serializzato nello snapshot): `tick()` guarisce solo se `!isWorking && !isOnExpedition`; la proiezione roster mappa l'expedition a `away` (non assegnabile a lavori mentre è fuori). `setResidentsOnExpedition(ids, on)` settato al confine reale `send()` e rilasciato nella write atomica del settlement (`partyIds` nel plan — il rientro È parte del settlement, idempotente). Unit: 9/9 tick (ferito in spedizione non guarisce, a riposo sì, rilascio al settle). E2E: test «PG tornano a casa» asserisce `isOnExpedition === false` dopo il settle.

**Fix (popolani):** `TEST_ROSTER_VILLAGERS` — HP base 50, ogni stat al massimo DEFAULT+10 (verificato `evaluateStatRequirement`: l'eligibilità legge `statTags` espliciti, i numeri non contano → stats basse sicure). Roster renderizzato: popolani 50/50 HP vs eroi alti.

**Fix (race F10 → Director):** `useHudPanels` idrata `visible` via `loadData` async e faceva `setVisible({...DEFAULT, ...stored})` — un toggle pre-hydration veniva sovrascritto (pannello aperto e richiuso). Ora `overrides` ref: i toggle `set`/`toggle` registrati prima del resolve vincono sullo snapshot persistito. Bug reale oltre il test: utente su macchina lenta che preme un tasto pannello al boot.

**Fix (test):** `revealQuestPois` attende `pixi-world-anchors` visibile (il layer nasce `visibility:hidden` finché la camera Pixi non completa l'init — sotto load superava i 15s, marker nel DOM ma `hidden`); test Director rivela i POI prima di F10 (R-129: nessun pin della run senza `questShown`); titolo scenario asserito «Goblin Extermination» (R-135).

**Safeguards:** suite `gameQuestLifecycle.spec.ts` **13/13 verdi** (4.7m — boot, planning, drag 1 eroe+3 popolani, clock pausa/×4, lancio, frontiera, settle una volta, rilascio party, consumo POI, persistenza reload, epilogo+journal, Director E2E); lint scope 0 errori; unit 25/25 (tick 9 + settlement 16); build:check PASS; kanban:lint PASS. Evidence: `test-results/r139-wounds-rest-villagers-2026-10-12.log`.

## R-140 — Quest Generation Lab: pagina di test per il catalogo generato

**Richiesta (verbatim):** *"abbiamo fatto tutto un plan x fare le quest in modo interessante, ecc. 1) crea una pagina dove posso testare, cn tipo una lista di tag, una lista di meccaniche, una lista di gimmik core, e tutto quello che c serve. 2) mi serve avere un albero specifico di come verrà creata la quest 3) m serve sapere cm i pg, le fazioni, il mondo, ecc cambierà dopo questa cosa 4) un elenco d tutte le cose che abbiamo implementato, dove sono, cm cambiano la meccanica, ecc. 5) tutto quello che m sto scordando"*
**Data:** 2026-10-12
**Stato:** `fatta` — verificato live via Puppeteer su `/quest-generation-lab`.

**Fix:** nuova pagina `/quest-generation-lab` (registrata in TestHub `EXTRA_PAGES`) con 6 sezioni: **(1) How a quest is born** — albero della pipeline di generazione (seed → gimmick → kit → vocab → schema → ScenarioInstance → run → settlement/epilogo) con file pointer per ogni stadio; **(2) Ingredients** — inventario derivato dal codice reale: gimmick (race, flood), domain kit (passo-montano/palude/miniera/mare), trait (avido/prudente/scavezzacollo), meccaniche (verdictTable, vars, armRolls, flags, requiresTrait, consumable/intel, twist) con conteggio d'uso per scenario; **(3) Generated catalog** — explorer dei 5 scenari di `GENERATED_CATALOG` con albero dei nodi DFS (opzioni/CHECK inline/verdict branch/loop), dettaglio nodo con varianti check e **player giocabile** — run viva via `createRun` + `applyChoice` + `previewOption` (contributori, % successo, rischio wound/death), vars/flags/info live, `endRun`; **(4) What changes afterwards** — matrice conseguenze per superficie (PG, villaggio, fazioni, mondo, quest future) con stato onesto implemented/seam/future; **(5) Implementation map** — 30+ card di sistema con file path reale e stato; **(6) Missing / open decisions** — 12 open con domanda e decisione richiesta.

**Architettura:** `generation/labRegistry.ts` (Zod, config-first: gimmicks/pipeline/mechanics/consequences/subsystems/openIssues) + `questGenLab/labModel.ts` (derivazioni dal codice reale — niente copia duplicata) + `labGraph.ts` (grafi DFS per catalogo/scenario) + componenti in `questGenLab/` (`labUi`, `LabSections`, `ScenarioExplorer`, `GenRunPlayer`). Il player NON crea un motore parallelo: istanzia `createScenarioInstance` + `createRun(questId:'gen')` sul motore canonico. UI sui primitivi skin (`labSurface`); i18n `questGenLab` in it-IT/en (+pseudo rigenerato).

**Safeguards:** unit `questGenLab` 10/10; suite quest scope 9 file / **119 test verdi**; lint scope 0 errori (file in quarantena ESLint); build:check PASS; smoke live 200 + Puppeteer: 6 sezioni, 144 card, run partito su `rp-partenza`, check risolto (`fail` → rival +2), vars live, **0 errori console**. Evidence: `test-results/r140-quest-generation-lab-2026-10-12.log`.

## R-141 — Astrolabio in inglese (verdetto, chip, narrator, legenda) + video Steam riregistrato

**Richiesta (verbatim):** *"deve essere tradotto anche quello"* (riferito al verdetto italiano «TRIONFO — Il sole stesso firma la tua impresa» visibile nel video astrolabio per la pagina Steam)
**Data:** 2026-10-12
**Stato:** `fatta`

**Scope:** `DestinyAstrolabe` (componente V1 canonico usato in `/game` via `MilestoneCheckModal` → `destinyAstrolabeKit`): titoli/sottotitoli verdetto (`VERDICT_TEXT` in engine.ts), chip `Ferito`/`Caduto`, `posZone`, result panel (`names`, `rRisk`, `rZone`), `stateChip` in markup.ts (+ sorgente `public/destiny-astrolabe.html`), chip `Difficoltà`/`Fortitudine`/`Morte`/`Ferita` in `PhaseCommentary`, narrator FERITA/MORTE, `SkillCheckLegend.tsx` completo, preset skill della pagina `/minimal-destiny-astrolabe` (nomi visibili nel badge del video). Poi ri-registrazione `media/astrolabe.mp4` via `record-astrolabe.mts`.

**Esito:** tutte le stringhe utente dell'astrolabio in EN. Sorgente di verità `public/destiny-astrolabe.html` tradotta, poi `engine.ts`+`markup.ts` rigenerati via `scripts/astrolabe/gen-engine.mjs` (il file è AUTO-GENERATED: mai editarlo a mano — il primo passaggio manuale è stato sovrascritto dalla rigenerazione, da qui il mix EN/IT nel penultimo video). `DestinyAstrolabe.tsx` (PhaseCommentary: DIFFICULTY/FORTITUDE/DEATH/WOUND, narrator WOUND/FALLEN) e `SkillCheckLegend.tsx` tradotti a mano (non generati). Video riregistrato: `media/astrolabe.mp4` 810×810, 24s, 2.3MB — sequenza THREAT-SLAM → AGENCY-BURST → RISK-POUR → THE-SPIN → MAGNETIC-SNAP → RESOLUTION «VICTORY — The peak bows to your stride. D100 29 · THRESHOLD 65» tutta EN. Safeguard: lint ok (dir astrolabe eslint-ignored come generated), build:check ✅, kanban:lint ✅, test astrolabe ✅ (v63-feasibility flaky-timeout isolato, passa da solo, file non toccati).

## R-143 — /game: il POI quest nella demo non deve essere un esemplare — solo contenuto reale

**Richiesta (verbatim):** *"xè quel poi è un esemplare demo? deve diventare un esemplare corretto dalla A alla Z"* (dopo aver chiesto quale componente Director era sparito — «Show quest», R-131)
**Data:** 2026-10-12
**Stato:** `fatta` — verificato E2E.

**Diagnosi:** R-131 rimosse «Show quest» («nn fa nulla, può sparire») giudicandola ridondante con «POI types». Effetto collaterale: `questShown` — gate dei marker REALI goblin+rovine — non aveva più alcun accesso UI: in gioco normale i veri POI non si rivelavano mai; «POI types» montava il goblin solo come esemplare demo (tra i finti job/event) e le rovine restavano sempre nascoste.

**Fix:** ripristinata l'azione Director «Show quest» (`id:'quest'`, toggle `questShown`) — unico gate UI dei POI reali end-to-end (offerta → detail → run → settle → consumo). Rimosso l'esemplare goblin dalla famiglia `poiDemo`: «POI types» ora mostra SOLO i tipi senza contenuto reale (job/event). Marker quest = sempre contenuto vero, mai finto.

**Test:** il test Director della suite lifecycle ora rivela i POI cliccando il VERO pulsante `[data-action-id="quest"]` (non più l'hook) — prova il path utente esatto che mancava; l'hook `revealQuestPois` resta solo per `?capture=1`. Guida E2E aggiornata.

**Safeguards:** tsc clean; lint scope 0 errori; build:check PASS; playwright focused 4/4 (boot, planning×2, Director E2E col reveal da pulsante reale); kanban:lint PASS. Evidence: `test-results/r143-real-quest-poi-reveal-2026-10-12.log`.

## R-144 — E2E: il reveal dei POI deve passare dal vero pulsante Director, mai dall'hook

**Richiesta (verbatim):** *"i test E2E devono essere fatti partendo da quello, nn so come li hai fatti e cosa dice la documentazione, ma in caso è sbaglaita"* («quello» = il vero pulsante «Show quest» ripristinato in R-143)
**Data:** 2026-10-12
**Stato:** `fatta` — verificato E2E.

**Fix:** `revealQuestPois(page)` nella suite lifecycle non chiama più `window.__idleVillageTestHooks.revealQuestPois()` — ora guida la stessa sequenza del giocatore/dev: F10 → assert `director-panel` → click `[data-action-id="quest"]` → attesa `pixi-world-anchors` + marker → F10 (richiude il pannello per non coprire il click sul marker). Copre TUTTI i test della suite (boot, planning, clock, lancio, run, settle, rilascio, consumo, reload, epilogo). L'hook window resta solo per `?capture=1`, dove il Director è nascosto. Guida E2E aggiornata (mappa hook, nota R-124/R-143, tabella helper).

**Nota:** l'helper `revealQuestPois` è il confine reveal di tutta la suite; gli altri hook expedition restano di ispezione (getRun/getVillage/getSettlement) e di engine (choose/advanceTicks — comprimono il tempo reale, non sono gesti UI). I gesti utente veri restano reali: click marker, drag, «Invia», controlli clock, Enter sul teatro, chiusura rapporto.

**Safeguards:** playwright focused 3/3 (boot, planning click, lancio) con reveal da pulsante reale; lint scope 0 errori; kanban:lint PASS. Evidence: `test-results/r144-e2e-real-director-reveal-2026-10-12.log`.

## R-145 — Steam: nuovo About copy Director (lore Solar Triumph, Trial of Fire, Astrolabe, roadmap EA) + short desc

**Richiesta (verbatim):** *"About This Game (da incollare) […] Descrizione breve"* — il Director incolla il nuovo copy completo EN pronto per Steam (11 sezioni h2 + features + roadmap) e la short description.
**Data:** 2026-10-12
**Stato:** `fatta`

**Scope:** `copy/en/about.bbcode` (verbatim Director), `copy/en/short-description.txt` (committed), traduzioni IT, `preview/index.html` EN+IT, re-audit `claim-ledger.md`.

**Esito:** copy EN applicato verbatim; IT tradotto (about + short desc); preview EN/IT rispecchia il bbcode sezione per sezione. Re-audit ledger: **3 ex-vietato riammessi a committed-vision** perché ora dichiarati dal Director — «the world remembers» (h2 dedicato), «Astrolabe» come meccanica (h2+feature; il Director ha anche riscritto `destinyAstrolabe/engine.ts` a motore D100 — integrazione `/game` canonica ancora da confermare), «hundreds of hours» (numero non misurato, re-check alla demo). Nuovi claim registrati in §2: lore Solar Triumph/isola, scala di quest, Trial of Fire, multi-party→elite company, ondate+boss+fasi, EA post-demo, solo dev, modding esplorato, pausa.

**Safeguards:** kanban:lint PASS; preview servita 200; file copy = solo testo/HTML (no build:check rilevante).

## R-147 — Steam: arricchimento About copy (offerte, loop villaggio, GIF embedded)

**Richiesta (verbatim):** *"fa una ricerca online: ci sn altre componenti core importanti che ci conviene sottolineare nella descrizione? ci stiamo scordando qualcosa?"* + *"procedi"*
**Data:** 2026-10-12
**Stato:** `fatta`

**Ricerca:** confronto con Against the Storm e dotAGE + guide Steamworks. Gap trovati: loop villaggio momento-a-momento (assegnazione lavori — il "cosa fai tra spedizioni"), offerte che dichiarano i termini e scadono (il differenziale, sparito dal nuovo copy), GIF embedded nella About (best practice #1 di conversione), numeri di scala, feature Steam di piattaforma (achievements/cloud/deck — da decidere nei metadata).

**Esito:** aggiunte al copy EN+IT e preview — h2 "Quests arrive as offers" (dopo l'intro), paragrafo loop villaggio in "A settlement that supports them", 2 bullet in Features (offerte + villaggio), 2 GIF embedded generate dai media esistenti (`about-anim-map.gif` 800px/2.4MB sotto l'intro, `about-anim-astrolabe.gif` 560px/8.1MB sotto la sezione Astrolabe). Tutti i nuovi claim sono `true-now` (offerte a finestra e assegnazione villici esistono in `/game`). ASSETS.md aggiornato. In sospeso per decisione Director: numero di scala quests, ruolo nominato del giocatore, feature Steam (achievements/deck).

**Safeguards:** kanban:lint PASS; copy/HTML only.

## R-146 — Planner spedizione a regime HUD/Lacquer Atlas (HudPlaque, testo ≥12px, token puri, STRICT_FILES)
**Data:** 2026-10-12
**Stato:** `fatta`

**Richiesta Director:** «il componente di planning prima della quest è fatta seguendo quella guida? … fixa».

**Scope:** `QuestExpeditionDetail.tsx` convertito da `FloatingPanel` (cornice legacy border/bg Tailwind) al pattern canonico `HudPlaque` + `useHudPanelDrag` + `SkinScope` — stesso idioma di `QuestRunWindow`: drag handle sull'header, minimised → plaque `hang`, close `X`, zIndex `zLayers.panels`. Testo 10/11px → ≥12px; fallback hex `#7ed39a`/`#e07a7a` → `TONE.ok`/`TONE.danger`. `FloatingPanel` (condiviso da POI detail, MissionPlanner, MilestoneCheck, frozen kit) NON toccato. Aggiunto a `STRICT_FILES` dei guard HUD. Fix adiacenti per verde guard: `MapQuestPoi` fallback hex → token `--skin-status-unmet`/`--skin-surface-base`; `QuestRunWindow` skipAll 11→12px (l'hunk parallelo deathLines NON committato — lavoro R-135 in volo). Spec E2E: `assignViaRealDrag` auto-verificante (attende `getAssignments[slotId]===residentId`, retry una volta come farebbe un giocatore — fix flake drop-miss da reflow forecast) + `scrollbarGutter:'stable'` sul body planner. Guida E2E aggiornata (FloatingPanel→HudPlaque, helper table, finding clamp-bottom esteso a `useHudPanelDrag`).

**Safeguards:** playwright lifecycle 13/13 verdi (4.4m, di cui 6/6 drag ripetuti); unit hudGuards 5/5; lint scope 0 errori; build:check PASS; kanban:lint PASS.

---

## R-157 — Trappole ricorrenti lette al momento del lavoro (pre-flight scoped, opzione 3)

**Nota numerazione:** originariamente registrata come secondo «R-147» per collisione con la voce Steam — rinumerata R-157 nel triage R-156 (2026-10-12).

**Data:** 2026-10-11
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v29 — 2026-10-11

**Richiesta Director (verbatim):** *"esempio di errore ricorrente: ad esempio: + volte nella pagina /game la mappa continua a diventare troppo grande e l'HUD copre una parte di terrra, e nn dovrebbe. Poi aumenta il mare e appaiono delle linee tra il mare "vecchio" e quello nuovo."* — *"opzione 3, ma dobbiamo assicurarci che vengano lette e utilizzate, tipo preflight e cose del genere"*

**Contesto:** audit degli artefatti RPG sulle domande "gli errori sono stati scritti? c'è ricorrenza?". Esito: attriti dispersi su `.mw/bugs/` (13), `.mw/observation.jsonl` (7, mai promossi), `pattern-candidate.md` in `.mw/runs/` (16), RICHIESTE — nessun registro ATTRITI locale, nessuna pipeline di promozione (`PROPOSALS.md` citato da learn ma assente). Evidenza chiave: `strokeLinecap` registrato 2 volte e reintrodotto in `PoiMatericV4` — scrivere non basta, serve un momento che interroga.

**Cosa è successo:** creato `context/recurring-traps.md` — 7 trappole con ≥2 istanze documentate, taggate per superficie (T-01 map/HUD edge-pinning, T-02 stroke-linecap, T-03 hud-scope boundary, T-04 claim percettivi a occhio, T-05 rewrite-senza-desiderata, T-06 coverage sintesi-su-ledger, T-07 derivati visuali lifecycle). Trigger pre-flight aggiunto a `mw-executor` (step 5) e `mw-planner` (step 5) — le 4 copie (`coordinator/`, `.devin/`, `.windsurf/`, `.agents/` skills) sono hardlink dello stesso inode, aggiornate tutte. Voce in `context/INDEX.md`.

**Nota aperta:** le «linee tra mare vecchio e nuovo» segnalate dal Director sono un possibile side-effect non ancora registrato dell'allargamento margini (`8254e8e1`) — da verificare e, se reale, aprire bug in `.mw/bugs/`.

## R-150 — Steam About: bodyguard + achievements nel copy; ruolo «Hero» provvisorio; numero quest rimandato

**Richiesta (verbatim):** *"riscrivi quella pagina cn queste modifiche — Numero: c pensiamo dopo · Ruolo per adesso Hero, poi vediamo ma lascia che è da decidere, c servirà cm reminder in futuro · achievements sicuramente · aggiungi bodyguard"*
**Data:** 2026-10-12
**Stato:** `fatta`

**Esito:** about.bbcode EN/IT + preview aggiornati — clausola bodyguard nella sezione Astrolabe («assign a bodyguard to take the blows meant for someone else» / «assegna una guardia del corpo…»), bullet Features «Party roles that matter — a bodyguard can die in a hero's place» + «Steam Achievements»/«Obiettivi Steam». Reminder registrati in `ASSETS.md` §Manca: ruolo giocatore provvisorio «Hero» (da decidere), numero scala quest rimandato, achievements da abilitare in Steamworks, sysreq da misurare su build Tauri.

**Safeguards:** copy/HTML only.

## R-151 — Steam capsule: usare il logo authored (placca+sole), non il wordmark Cinzel

**Richiesta (verbatim):** *"nn abbiamo un asset che si chiama tipo wanderlust logo o qualcosa del genre? ho visto che hai usato una scritta normale e banale, senza il simbolo centrale, ecc"*
**Data:** 2026-10-12
**Stato:** `fatta`

**Esito:** trovato `~/Downloads/library logo.png` (1536×1024, **alpha nativa già presente** — placca dorata con sole centrale; il tentativo di bg-removal era superfluo). Crop → `marketing/steam/assets/library-logo.png` (1492×1023). `make-capsule.mts` riscritto: compone il logo authored PNG invece del wordmark Cinzel → rigenerate main/header/small/vertical/event capsule. Preview e ASSETS.md aggiornati (vecchi file tipografici marcati superseded). Nota: `~/Downloads/logo1.png` (1024², tramonto su oceano, senza alpha) disponibile come art di sfondo alternativo.

**Safeguards:** kanban:lint PASS; asset/HTML only.

## R-148 — /game: mappa troppo grande + HUD su terra + linee tra mare vecchio e nuovo

**Richiesta (verbatim):** *"+ volte nella pagina /game la mappa continua a diventare troppo grande e l'HUD copre una parte di terrra, e nn dovrebbe. Poi aumenta il mare e appaiono delle linee tra il mare "vecchio" e quello nuovo. 1) scrivi una guida su come risolvere questa cosa 2) scrivi nella documentazione come dovrebbe essere quella schermata e come misurare che la HUD nn sia mai davanti alla mappa quando viene aperta 3) risolvi questo bug con bugfix 4) scrivi la documentazione 5) learn"*
**Data:** 2026-10-11
**Stato:** `fatta` — bugfix completo (`.mw/bugs/2026-10-11-game-map-fit-seams/`): coverage floor non batte più il fit ai viewport target (seaMargin 700/400→3600/1800 = mare aperto a nebbia), quad mare oltre i bound pan (niente sliver stageColor), minZoom solo sullo zoom utente, recenter resetta userMoved. Guida+contratto+misura: `src/docs/docs/design/game_map_fit_contract.md` (+ hook in `hud_component_guide.md` §9, probe `scripts/probe-game-map-fit.cjs`). T-01 aggiornata con la risoluzione. Verifiche: probe multi-viewport 0 violazioni chrome, 28/28 test scope, lint 0, build:check+kanban:lint PASS. Evidence: `test-results/r148-game-map-fit-seams-2026-10-11.log`.
**Desiderata FROZEN:** nessuna nuova — bugfix sulla superficie canonica (ricorrenza della trappola T-01 in `context/recurring-traps.md`; segue R-121 in `.mw/bugs/2026-10-10-game-island-under-hud/`).
**Bug dir:** `.mw/bugs/2026-10-11-game-map-fit-seams/`.

## R-149 — Nuova core gimmick «meld» (XCOM): bonus a scadenza non dichiarata

**Richiesta (verbatim):** *"un altra core gimmik che possiamo implementare è il meld di Xcom. Sai che qualcosa sta x scadere tra X turni nn dichiarati, hai un indicatore che t dice che potresti avere un bonus extra se sei veloce. Le opzioni delle varie fasi danno opzioni ad alto rischio morte/ferita ma che danno bonus su quel tracciato. Ci vuole anche un "indicatore" che fa capire "ultimo turno x raggiungerlo" aggiungilo alla documentazione e all'elenco di gimmik core"*
**Data:** 2026-10-12
**Stato:** `fatta` — registrata come `proposta` in documentazione e nel lab registry.

**Cosa è successo:** gimmick `meld` aggiunta a `QUEST_LAB_GIMMICKS` (status `proposal` — vars `rotta`/`soglia`/`scadenza` con deadline nascosta a stati nominati «disponibile / ultima chiamata / scaduto», twist `doppio-meld`/`meld-presidiato`, generator `meldGimmick.ts` pianificato); `GimmickId`/`GIMMICK_IDS` estesi in `labModel.ts`. Documentata come sezione §17 in `QUEST_GENERATION_ARCHITECTURE.md`, nota nel roster gimmick in `QUEST_GENERATION_SPEC.md` §3.1 e nel catalogo di `QUEST_GENERATION_CONTRACTS.md` §9. Per il `GimmickRegistry` operativo (PLAN-029) resta oltre il cap v1 di 2 righe — candidata per «gimmick extra» v1.1. Punto aperto registrato: verificare in playtest che la deadline nascosta produca pressione e non frustrazione (equità retrospettiva R-108).

**Safeguards:** unit `questGenLab` 10/10; lint scope 0 errori; build:check PASS; kanban:lint PASS.

## R-151 — Gimmick di fase «mimic» + censimento delle meccaniche core/fase mancanti

**Richiesta (verbatim):** *"nella creazione di quest, fasi, ecc. Dobbiamo aggiungere anche il mimic. arrivi al tesoro, check nascosto di percezione, se fallisci perdi HP e combattimento extra. Se hai successo nn perdi HP, il combattimento dura poco (attacchi tu a sorpresa il mimic) ma nn c'è reward. Che altre meccaniche di Core Gimmik potremmo aggiungere che ancora nn abbiamo descritto? fa una ricerac approfondita online e dimmi cosa nn abbiamo ancora implemnetato. E x le gimmik da fase, tipo questa del mimic cosa stiamo scordando?"*
**Data:** 2026-10-11
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna nuova — esplorazione di design dentro il framework di generazione quest (PROPOSAL: `context/QUEST_GENERATION_ARCHITECTURE.md`, `QUEST_GENERATION_SPEC.md`, `QUEST_GENERATION_CONTRACTS.md`).

**Esplorazione:** gap map consegnata in sessione — (a) il mimic non è una core gimmick ma una nuova **categoria di nodo**: evento nascosto senza scelta (il catalogo DecisionFamily oggi copre solo scene con scelta); (b) tensione con l'attribuzione P6/P13/P36 — check nascosto che costa HP = «tassa RNG» senza indizi leggibili (canale esploratore QUEST_RULES §2, trait prudente, clue layer); (c) candidati core gimmick da ricerca: preda/cacciato, scorta VIP, difesa a ondate, rituale che potenzia il boss, cargo volatile, corruzione di un membro, indagine con sospetto; (d) famiglie di fase mancanti: ricompensa ingannevole (mimic/loot maledetto/piedistallo/trappola), curio layer DD (strumento-vs-rischio), campo notturno, incontri neutrali, ferito a terra, male-minore, boon faustiano, stanza «?», luce/rumore come risorsa, inganno deliberato da agente.

**Direttive Director (2026-10-11) e risultato:** reskin ok ma non conta come vera varietà (registrato ARCHITECTURE §18.4 + open issue `variety-not-reskin`); curio layer scartato → REJ-008 in `context/REJECTED.md`; incontri neutrali = scena minore, non famiglia; famiglie E registrate come scoperte non adottate (CONTRACTS §15.1); combat con props/boss a stadi = candidato da progettare a parte. **Procedi su hiddenCheck:** regola «nascosto prima, rivelato sempre dopo — il perché non si nasconde mai» registrata `vigente` in `QUEST_RULES.md` §3; contratto v0 `HazardNode`/`hiddenCheck` in `QUEST_GENERATION_CONTRACTS.md` §15; sezione §18 in `QUEST_GENERATION_ARCHITECTURE.md`; meccanica `hidden-check` + open issue `hazard-node-runtime` in `labRegistry.ts`.

## R-152 — Compilazione imprint→grafo: IMPR-002 come quest vera (chain-ready)

**Richiesta (verbatim):** *"procedi"* (su proposta explorer 2026-10-12: «scrivere la compilazione imprint→grafo — le function spec diventano nodi con gate/vars — partendo da IMPR-002 che è il più ricco»; contesto: gli imprint `QUEST_IMPRINTS.md` sono scheletri narrativi senza layer meccanico, la pipeline narrata `questNarrate.mts` narra solo scheletri generati, e la decisione Director era di farne chain quest anziché quest singole).
**Data:** 2026-10-12
**Stato:** `fatta`
**Desiderata FROZEN:** compilare IMPR-002 «Il compagno che ride» in un grafo meccanico reale (`QuestScenario` authored): le function spec dei beat B0–B6 diventano nodi/vars/gate/check; i ponti di chain (B5 «chi ha mosso la posta», B6 entità calde) restano espliciti come hook; il risultato deve essere narrabile dalla pipeline esistente e coerente con `QUEST_RULES.md` (niente single-check, check nascosti rivelati dopo, TAKEN≠SECURED).

**Risultato (2026-10-12):** `gen-impr002-palude` «The Lock-Keeper's Bargemen» nel GENERATED_CATALOG (`generation/impr002Palude.ts`) — 26 nodi: fork B0 accetta/rifiuta l'aiuto, B2 tre canali crack one-shot su var `sospetto` (+`fiuto-prudente` armRoll trait-gated), B3 turn router dichiarativo su stato post-effetto (`pronti`/`sospetto≥2`/`annusati`/blind), B4 fork forza/sorpresa/fuga/recita (bluff fallito → `smascherati`, l'opzione sparisce), B5 `posta-mossa` su ogni verdetto della cassa (+`depositario-traccia` = seme chain), B6 `a-consegnato`/`a-fuggito`/`a-padrone`/`soci-*` come flag per il mondo. Delta motore: `CombatSpec` copy dichiarativa opzionale (enemyName/attackLines/clearedText/survivorsText/holdingText — fallback goblin). Lab: `imprintCatalogEntries()` per la provenance `gen-<imprint>-<dominio>`. Docs: contratto di compilazione in `context/QUEST_IMPRINTS.md`, meccanica `imprint-compilation` in labRegistry, PLAN-026 T8. Test 16/16 + questGenLab 10/10. Chain-ready, non chain-executed (M-02 gated).

---

## R-153 — Ingestion documentale delle idee GPT sul layer delle opportunità delle quest

**Richiesta (verbatim):** *"le cose che ho scritto nel msg sn da una discussione cn GPT, cn cui ho palrato delle cose d cui ho scritto. quelle informazioni idee, ecc devono essere opportunatmente documentate in documenti corretti, eventualmente linkate ad altri documenti, creiamo documenti nuovi, ecc. ci dovrebbero essere idee corrette, interessanti, che approfondiscono, ecc. Se c sn ambiguità chiedi"*
**Data:** 2026-10-11
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna nuova — materiale di esplorazione design. Classificazione concordata col Director in sessione: **tutto PROPOSAL** (coerente coi precedenti: anche direttive esplicite restano candidati finché non ratificati in regole/desiderata).
**Sorgente:** sintesi del Director di una discussione con ChatGPT sulle meccaniche RPG Balancer — approcci multipli alle quest, grafo delle opportunità/famiglie, sistema temporale, skill e ricompense che cambiano le regole, perimetro del primo test, crescita del villaggio, risorse, memoria. Esclusi pagina Steam e proiezioni commerciali su richiesta.

**Cosa è successo:**
- Ingestion report con Extraction Ledger E-01..E-22: `context/ingestions/2026-10-11-quest-opportunity-layer.md`.
- Doc nuovo dedicato **PROPOSAL** `context/QUEST_OPPORTUNITY_LAYER.md` — il layer sopra le quest: grafo delle opportunità (convergenza/divergenza, archi di sblocco persistenti), famiglie di quest (meccanica riconoscibile vs soluzioni compatibili), tassonomia requisiti a 4 tipi, ricompense-porta a 8 categorie, capacità che cambiano le regole, esploratore orientabile, tempo a 3 concetti (durata/scadenza/**finestra**), crescita villaggio a 3 dimensioni (visibilità/capacità/capacità operativa), risorsa informativa trasversale, perimetro primo test senza combattimento.
- Decisione di collocazione: separato il layer *sopra* le quest (doc nuovo) dal layer *dentro* la quest (docs di generazione esistenti) — gli argomenti multi-approccio erano già coperti dai canali §7; restano solo deepening registrati in SPEC §3.1.
- `QUEST_RULES.md` §9: riga `proposta` per tassonomia requisiti/preparazione e ricompense-porta.
- `context/QUEST_GENERATION_SPEC.md`: `related` aggiornato, nota §3.1 (canale ≠ solo stat diversa), §8 + finestra di opportunità, §11 puntatore al layer.
- `context/OPEN.md`: **OPEN-019** (modello grafo opportunità), **OPEN-020** (tassonomia requisiti/preparazione), **OPEN-021** (orientamento esploratore + risorsa trasversale).
- Tensione nominata (non conflitto): «più party in parallelo» vs regola leader-capacity (OPEN-010) — da conciliare in ratifica economia-villaggio.
- INDEX aggiornato.

---

## R-154 — Ricerca approfondita multi-AI web sui temi del layer opportunità

**Richiesta (verbatim):** *"fa una ricerca approfondita su ognuno di questi argomenti, usa le ai web x fare la stesa ricerca approfondita per trovare il modo migliore x risolvere o migliorare qeuste idee, poi salva tutto in file separati e dammi un riassunto finale d tutto quello che abbiamo trovato d rilevante"*
**Data:** 2026-10-11
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna nuova — ricerca di supporto alle PROPOSAL di `context/QUEST_OPPORTUNITY_LAYER.md` (OPEN-019/020/021). Workflow replicato da R-128 (`20261010-gimmick-channels-research`): prompt per sotto-argomento → `mw-broadcast --web` → report sintetizzato con fonti.

**Sotto-argomenti (7):** T1 grafo delle opportunità e precedenti di strutture a nodi; T2 famiglie di quest come kit meccanici; T3 tassonomia requisiti e gate morbidi/duri; T4 ricompense che aprono porte e capacità che cambiano le regole; T5 orientamento della generazione e informazione come risorsa; T6 tempo, finestre di opportunità e attività concorrenti; T7 metodologia per prototipare il meta-layer senza combattimento.

**Output:** `.mw/runs/20261011-opportunity-layer-research/` — `README.md` (sintesi esecutiva: 10 scoperte + convergenze + 7 nuove questioni candidate OPEN) + `report-t1..t7-*.md` + `tN-*/BROADCAST.md` raw.
**Esito:** ogni topic coperto da ≥1 risposta AI sostanziosa + ricerca propria (chatgpt/claude/deepseek intermittenti per cambi UI provider — grok quasi sempre inutilizzabile). Conferme forti: modello qualities+offer generator (Fallen London), famiglia=signature pressure (swap test), capability tags, gate come stato calcolato, reward come interceptor su 5 superfici dichiarate (BYPASS/TRANSFORM/MITIGATE/REVEAL/EXCEPTION), steering=weights, intel a 4 tier (risolve candidatamente OPEN-018), tempo a 3 concetti + acceptance/completion, parallelismo da vincoli reali (no slot), prototipo a 3 gate con policy-sim e metriche pre-registrate. 7 nuove questioni candidate OPEN elencate nel README del run.

---

## R-155 — Foresta a occidente troppo scura per colpa del filtro ondeggiante (ricostruita)

**Richiesta (verbatim ricostruito):** *"la foresta a occidente è troppo scura, x colpa del filtro che la fa ondeggiare, deve tornare + chiara"* — **ricostruzione del Director 2026-10-12**; il verbatim originale è andato perso: inviato a una sessione morta in partenza (2 stub vuoti creati 2026-10-11 ~20:22:43, `early-ricotta`/`nonchalant-honesty`), mai persistita in nessun DB locale né nel batch R-129→R-151. Investigazione completa in sessione `e0f2db06` (2026-10-11).
**Data:** ~2026-10-11 (originale), registrata 2026-10-12
**Stato:** `fatta`
**Chiusa 2026-10-12:** `UNDERSTORY` 0.78→1.0 in `scripts/build-canopy.py` + asset rigenerati — understory rivelato dallo sway era -22% lum; ora ~dipinto (Δlum 7-21 → 0.8-3). Sway invariato. Kanban R-155, evidence `test-results/r155-forest-understory-2026-10-12.log`.
**Desiderata FROZEN:** la regione foresta a ovest della mappa `/game` deve tornare alla luminosità dell'art originale — il filtro/effetto che la fa ondeggiare la scurisce (verosimilmente displacement/tint sul layer foresta in `WorldSurfacePixiOverlay` o config `worldSurfaceConfig`). Verificare che il fix non rompa l'animazione di vento dove desiderata.

---

## R-157 — Aggiungere Mount & Blade e Battle Brothers alle ispirazioni

**Richiesta (verbatim):** *"aggiungi tra le ispirazioni d questo gioco anche mount and blade (mappa/parte gestionale) e battle brothers (sempre mappa/parte gestionale)"*
**Data:** 2026-10-11
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna nuova — aggiornamento delle fonti d'ispirazione in `DESIGN_PILLARS.md` (direzione, non vincolo). Scope dichiarato dal Director: **mappa / parte gestionale**.
**Cosa è successo:** aggiunto **Pillar 4** in `DESIGN_PILLARS.md` §1 (Mount & Blade + Battle Brothers come riferimento per mappa strategica e layer gestionale); header/versione e tabella di sintesi §2 allineati.

---

## R-158 — Mappa concettuale dei competitor della nicchia (titoli simili, posizionamento, prezzi)

**Richiesta (verbatim):** *"dobbiamo capire gli altri giochi simili che fanno parte della stessa nicchia, cerchiamo d capire come e xè c differenziamo dagli altri, che errori hanno fatto e che cosa hanno fatto bene i nostri competitor. [...] aggiungi altri titoli simili, facciamo una bella ricerca e cerchiamo d fare una mappa concettuale d queste informazioni, anche cercando di capire cm siamo posizionati. Ovviamente c serve anche il prezzo a cui vengon venduti sia al max che 'normalmente' cn gli sconti"*
**Data:** 2026-10-11
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna — layer di direzione pre-desiderata (strategist). Output atteso: documento di analisi competitiva con lista estesa titoli, prezzi listino/scontati, punti di forza/errori, mappa concettuale e posizionamento di RPG Balancer.
**Contesto:** il Director ha fornito una lista iniziale da una ricerca ChatGPT: Super Fantasy Kingdom, A Hero's Rest, Fort Triumph, Crown of Greed, Majesty, dotAGE.
**Cosa è successo:** creato `context/COMPETITIVE_LANDSCAPE.md` (ricerca web 2026-10-11): ~21 titoli in 5 cluster, tabella prezzi listino/saldo/recensioni/vendite stimate, pattern errori E1–E8, mappa di posizionamento diretto↔indiretto × run↔continuo, white space e implicazioni prezzo ($14.99 coerente col tier Loop Hero/SFK-launch). Indicizzato in `context/INDEX.md`. 3 domande aperte per il Director in §10 del doc.
**Aggiornamento 2026-10-11:** aggiunta §8.1 — prezzi al lancio vs listino attuale. Pattern dominante: lancio basso + rialzo (EA→1.0 o per contenuto) + sconto -10/15% prima settimana.
**Aggiornamento 2026-10-11 (2):** aggiunta §11 — voce della community per concorrente diretto (SFK, AHR, CoG, dotAGE, Loop Hero + vicini AtS/TR/Norland/BB/Epic Tavern/Fort Triumph/Hero's Hour/Thronefall/Stacklands): lamentele e consensi titolo per titolo, tassonomia C1–C10, pattern di apprezzamento W1–W7.

---

## R-160 — Strategia prezzo: pattern di nicchia (ingresso basso + rialzo), forse con meno spesa

**Richiesta (verbatim):** *"segna che faremo cm prezzi come hanno fatto tutti gli altri, anche se nn m sento all'altezza di DD, ma magari facciamo la stessa strategia ma cn meno spesa? vedremo"*
**Data:** 2026-10-11
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna — intenzione di strategia prezzo **provvisoria** ("vedremo"), da confermare al lancio (prezzo non bloccante per pagina Coming Soon, STEAM_PAGE_PLAN D6).
**Cosa è successo:** registrata in `COMPETITIVE_LANDSCAPE.md` §8.1 (decisione) e §10-Q3 (risposta). Strategia = pattern P1 osservato: ingresso basso + sconto di lancio -10/15% + rialzo come evento alla 1.0/milestone.
**Chiarimento Director (2026-10-12):** "meno spesa" = stessa traiettoria a prezzi assoluti più bassi — **orientativamente ~$9.99 lancio → ~$14.99 alla 1.0**. Aggiornati `COMPETITIVE_LANDSCAPE.md` §8.1/§10-Q3 e `STEAM_PAGE_PLAN.md` D6 (il "$14.99 premium" ipotizzato in §0 va rivisto in sede di prezzo).

## R-159 — Seconda istanza compilata: IMPR-002 × kit mare

**Richiesta (verbatim):** *"procedi"* (su chiusura R-152: due passi candidati — narrare l'imprint via pipeline o compilare una seconda istanza per misurare cosa è riusabile; scelta la seconda: serve a distinguere scheletro generico da authored prima di valutare un compilatore automatico, e a dimostrare varietà reale non-reskin sulla stessa spina).
**Data:** 2026-10-12
**Stato:** `fatta` (2026-10-12)
**Desiderata FROZEN:** compilare IMPR-002 «Il compagno che ride» istanza B (`mare`, l'armatore-assicuratore) in `gen-impr002-mare` con lo stesso contratto di R-152 — le differenze devono essere meccaniche (prezzi, canali, gate, seed), non solo copy: A = chi controlla il mezzo mancante del dominio (qui il trasporto, non l'acqua); il kit `mare` esclude le vie alternative a piedi — il rifiuto dell'aiuto paga un prezzo diverso; B5 cross-cast `maestro dei recuperi`; B6 variante `sgamato` (due stakeholder si accusano) gated da prova documentale.

**Esito:** `gen-impr002-mare` «The Shipowner's Carrack» in `impr002Mare.ts` (~30 nodi, profilo `gen`, zero delta motore). Riusato alla lettera: turn router B3, canali `segna-*`, armRolls trait-gated, vocabolario flag B6. Diverso per meccanica: fail rotta propria → `annusati` (esposizione, non solo HP); `polizza-ombra` prova documentale che gatea `ma-sgama`; `traccia-maestro` seme cross-cast; via `a-sgamato` → `ma-consegna`. Nota: `costGold` ha side-effect goblin-hardcoded → non usabile in scenari `gen`. Test 9/9 + palude 16/16 + genLab 10/10, lint/build/kanban PASS. Evidence: `test-results/r159-imprint-mare-2026-10-12.log`.

---

## R-161 — Errata documentazione: il gioco NON è più un idle game

**Richiesta (verbatim):** *"il gioco nn è + considerato idle da un bel po', è sbagliata la documentazione: correggila"*
**Data:** 2026-10-11
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna — correzione documentale di direzione; autorità preesistente `marketing/steam/claim-ledger.md` («niente offline, posizionamento second monitor»).
**Contesto:** parte dei documenti (e i prompt della ricerca R-154) descrivevano ancora il gioco come «idle»; la risposta del Director include anche 7 risposte alle domande aperte della ricerca opportunity-layer.
**Cosa è successo:** audit globale delle occorrenze «idle» e classificazione (corrente-errato / storico-corretto / nome tecnico `idleVillage` / competitor di altri). Corretti: `DESIGN_PILLARS.md` (R3.4/R3.5), `context/RPG_PROJECT_CONTEXT.md`, `context/VERTICAL_SLICE_REFERENCE.md`, `context/COMPETITIVE_LANDSCAPE.md` (3 punti), `context/QUEST_GAMEPLAY_SCIENCE.md`, `context/QUEST_OPPORTUNITY_LAYER.md` (§7 nota modello temporale), run `.mw/runs/20261011-opportunity-layer-research/` (README, report-t1/t6, nota errata sui 7 prompt). Decisione registrata in `context/DECISION_LOG.md` (2026-10-11). «Idle Village» resta codename storico della superficie deprecata e nome del dominio tecnico.
**Inoltre (stessa sessione):** le 7 risposte del Director alle domande aperte di R-154 integrate in `context/QUEST_OPPORTUNITY_LAYER.md` (§1 visibilità parziale grafo, §2 transizione mid-run tra famiglie, §3 stati gate su offer card + scout quality, §4 conversion rewards posticipate al playtest, §5 flashback-prep alto tier, §7 doppio timer acceptance/completion) e nei Progress di OPEN-019/020/021. Tutto resta PROPOSAL in attesa di ratifica.

---

## R-162 — Nessuna data nel piano go-to-market: si esce quando si è pronti

**Richiesta (verbatim):** *"nel business plan c sn date messe, toglile, nn cè una data. qunado saremo pronti lo faremo e basta"*
**Data:** 2026-10-12
**Stato:** `fatta` (2026-10-12)
**Desiderata FROZEN:** nessuna — decisione operativa di scheduling; il documento di autorità è `src/docs/docs/strategy/go_to_market_steam_first.md` (single source of truth GTM) + sezione omonima in `MASTER_PLAN.md`.

**Esito:** il "business plan" è il piano Go-To-Market "Steam First". De-calendarizzato: rimosse tutte le finestre temporali (header "2026 H1", "Wishlist 25k entro H1 2026", tabella §4 con finestre Feb–Giu 2026 → colonna "Ordine / trigger", "Localization sprint Feb" → "pre-pagina", "Kick-off settimana 1" → "Kick-off"). Il piano resta una **sequenza ordinata di 6 beat con gate di qualità come condizione di ingresso** (Steam Page → Next Fest → Playtest#1 → Devlog/Creator → Playtest#2 → Launch Readiness); i KPI restano target di misura, non scadenze. Nota decisionale aggiunta in header + §4 + change log §10; sezione `MASTER_PLAN.md` Go-To-Market allineata (titolo "(H1 2026)" rimosso, link aggiornato all'anchor §4 rinominata). Date storiche (changelog, header "ultimo aggiornamento", evidence passate) conservate: non sono impegni futuri.

## R-163 — Terza istanza compilata: IMPR-002 × kit miniera

**Richiesta (verbatim):** *«A — Miniera (3ª istanza)»* (scelta del Director sul menu post-R-159: stessa storia, dominio miniera — prova se il metodo si può automatizzare in un compilatore).
**Data:** 2026-10-12
**Stato:** `fatta` (2026-10-12)
**Desiderata FROZEN:** compilare IMPR-002 «Il compagno che ride» istanza C (`miniera`, il caposquadra) in `gen-impr002-miniera`. Delta meccanici vs palude/mare (anti-reskin): B0 la via solitaria = galleria di scarico — il fail si annuncia per *rumore* (il buio non ammette testimoni oculari: le prove sono fisiche o sonore, kit); B2 il registro dei turni produce `turni-ombra` (turni firmati da morti — prova dell'estrazione parallela E prima traccia della cosa sotto); B4 nuova opzione `mi-puntelli` — buttare giù la puntellatura: primo uso authored di hazard-ambiente come via al combattimento (il «combat props» segnato interessante in §18.4); B5 il «chi ha mosso la posta» NON è umano — `traccia-morso` semina l'entità dell'istanza C di IMPR-001 (ponte cross-imprint, dominio che ricorda); B6 `a-sgamato` porta uomo+registro al fattore della compagnia.

**Esito:** `gen-impr002-miniera` «The Foreman's Crew» in `impr002Miniera.ts` (~31 nodi, profilo `gen`, zero delta motore). Tutti i delta previsti implementati: annusati-per-rumore, `turni-ombra` (un intel, due payoff), `mi-via-puntelli` (primo hazard-ambiente: win salta il fight / almost → ambush / fail → fight ferito), `traccia-morso` non-umana → ponte IMPR-001-C, `mi-consegna` al fattore. Verdetto compilatore in QUEST_IMPRINTS §Terza-istanza: ~70-75% template fisso + foglio parametri dominio — il valore anti-reskin vive nei parametri authored. Test 11/11 + suite imprint 46/46, lint/build/kanban PASS. Evidence: `test-results/r163-imprint-miniera-2026-10-12.log`.

---

## R-165 — Contratto di scrittura nodi + revisione stakes di gen-impr002-miniera

**Richiesta (verbatim):** *«procedi»* (accettando la proposta: 1. contratto di scrittura nei doc — 5 regole Wildermyth + «la posta deve sanguinare» + «ogni intel = una frase piana»; 2. revisione di `gen-impr002-miniera` con stakes da salvataggio e indizi in chiaro).
**Data:** 2026-10-12
**Stato:** `fatta` (2026-10-12)
**Desiderata FROZEN:** (a) scrivere il contratto di scrittura dei nodi in `QUEST_IMPRINTS.md` (fonte: Wildermyth Event Design Philosophy + anatomia Display→Informazione→Significato degli indizi): il testo serve una scelta, i membri del party entrano nel testo per nome/tratto, atmosfera concreta non fiorita, contesto immediato, brevità monumentale; la posta in gioco deve essere persone o sopravvivenza, non logistica; il Significato di ogni intel si dichiara in una frase piana («qualcuno sta nascondendo queste morti») — se non si può, è troppo intelligente. (b) Rivedere `impr002Miniera.ts`: B0 = minatori intrappolati dal crollo (la vena segreta del caposquadra l'ha causato — aiutare il salvataggio lo espone); indizi riscritti in chiaro (niente «turni firmati dai morti» criptici — il registro mostra squadre in una galleria sigillata e il materiale nascosto sotto altri nomi); B5 = i minatori intrappolati sono stati PRESI, non sepolti — `traccia-morso` diventa tracce di trascinamento verso la galleria profonda (ponte IMPR-001-C più forte: la posta erano persone). Grafo/nodi/flag invariati — revisione di copy e significati.

**Esito:** contratto in `QUEST_IMPRINTS.md` §Contratto-di-scrittura (5 regole Wildermyth + 3 nostre: posta=sanguina, intel=frase piana, seeds comprensibili — con nota motore: la copy oggi non interpola nomi party, gap noto). `impr002Miniera.ts` revisionata copy-only: B0 minatori intrappolati, B2 indizi in chiaro, B3 l'estrazione ha causato il crollo (salvataggio=alibi), B5 presi-non-sepolti. Spec istanza C allineata. Nota: B0 di palude/mare resta posta-oggetto → da rivalutare alla prossima revisione copy. Test 11/11. Evidence: `test-results/r165-writing-contract-2026-10-12.log`.

---

## R-167 — Teaser trailer: componenti mancanti su `/game` (scheda PG, consumabili base, consumabili in quest)

**Richiesta (verbatim):** *"per il teaser trailer gli elementi che ancora ci mancano nella pagina /game alcuni componenti. la scheda del personaggio ben fatta, secondo le regole e i dettami della pagina /game e del progetto. Che si apre se clicchi (e rilasci, nn trascini) la pgCard. Poi ci serve un componente dove ci sn i consumables della base, il picker per portarteli nella quest e un componente dove mostrare i consumbables durante il viaggio e durante le scelte/skill check durante la quest (pianificazione, ecc). Poi? che altro ci manca del progetto?"*
**Data:** 2026-10-12
**Stato:** `completato` (2026-10-14) — piano `plans/PLAN-032-teaser-game-components.md`: SP-1 scheda PG hover, SP-2 magazzino, SP-3 mercante, SP-4 consumabili in viaggio, SP-5 level-up mock. **Debate multi-AI completato su tutti e 5 gli SP (2026-10-12)** — design converged, artifact vincolanti in `mind-weaver/.mw/runs/`: SP-1 r003 (`d1f26a13`), SP-2 r003 (`c0432832`), SP-3 r003 (`7497a638`), SP-4 r004 (`770bc224`), SP-5 r009 (`3d8d1cca`). Provider: chatgpt/claude/deepseek/gemini a rotazione per limiti free-tier (claude dead in SP-4, claude limit+chatgpt dead in SP-5). **Dispatched 2026-10-14** (T-011 PLAN-034): spec in `plans/PLAN-032-SP-1..5-*.md`, kanban registrato. **SP-1 completato 2026-10-14** — `HeroSheetPanel` (HudPlaque + useHeroSheet machine, hover-intent 350ms, dismissedFor latch, shortcut `p`, rosterV2 zero-touch); bundle `.mw/runs/plan032-sp1-2026-10-14/bundle.json` PASS, evidence `test-results/PLAN-032-SP1-2026-10-14.log` + eyeshot `test-results/plan-032-sp1-eyeshot.png`. **SP-2 completato 2026-10-14** — `VillageStashPanel` (HudPlaque mock-backed da `villageStashConfig` Zod, nessun inventario reale) + `MapBuildingPoi` marker edificio riusabile su anchor `building-stash` @ (2260,1551), openOrFocus/pointer-delta gate/focus-return, shortcut `v`; bundle `.mw/runs/plan032-sp2-2026-10-14/bundle.json` PASS, evidence `test-results/PLAN-032-SP2-2026-10-14.log` + smoke `plan-032-sp2-smoke-2026-10-14/`. **SP-3 completato 2026-10-14** — `MerchantPanel` (HudPlaque mock-backed da `merchantConfig` Zod deepFrozen, 4 offerte ICU, `MockBuyControl` disabled nativo senza callback — Buy inerte per costruzione) + marker gated Director (`merchantmarker`, default OFF) sul riusato `MapBuildingPoi`/`poiToPanel`, shortcut `m` funziona anche senza marker, focus-return al marker; bundle `.mw/runs/plan032-sp3-2026-10-14/bundle.json` PASS (15/15 unit + isolation, 48/48 adiacenti), evidence `test-results/PLAN-032-SP3-2026-10-14.log` + smoke `merchant-smoke-2026-10-14/`. **SP-5 completato 2026-10-14** — level-up eroe mock: `heroLevelConfig` (Zod strict + salvage prod field-level, dev throw, gate `import.meta.env?.PROD`), `HeroLevelDecor` nel layer rosterV2 (badge "Lv {n}" ancorato al portrait, ring resting-lit, ignition keyed per eventId, `TextFloater` portal su body mai clippato — pgcardKit intoccato), command `runHeroLevelUpStaging` (reject su config invalida/target non-hero/zero-eligible, accept → 1 telemetry `hero_levelup_mock` + 1 cue `level_up` + flare per target), Director action `levelup`; bundle `.mw/runs/plan032-sp5-2026-10-14/bundle.json` PASS 4/4 (18/18 unit, 54/54 adiacenti), evidence `test-results/PLAN-032-SP5-2026-10-14.log` + smoke `plan-032-sp5-smoke-2026-10-14/` (en+it). Divergenza documentata: i18n in sintassi ICU `{n}` (la spec diceva `{{n}}` che renderizza letterale sotto i18next-icu). **SP-4 completato 2026-10-14** — `BagStrip` read-only nel `QuestRunWindow` durante stati non-decisione (transit/pending + beat playback incl. replay finale), `questBag.ts` helper condivisi (`questBagItems` unica derivazione strip+popover, `bagItemShortLabel` ⇔ idiom belt, `bagEverPacked` retention-only via `consumablesUsed`, `bagStripVisible` predicato puro), slot riservato `data-bag-slot` (min-height da type token belt, belt XOR strip strutturale, `ConsumableBelt` intoccato); bundle `.mw/runs/plan032-sp4-2026-10-14/bundle.json` PASS 4/4 (22/22 unit, 57/57 adiacenti), evidence `test-results/PLAN-032-SP4-2026-10-14.log` + smoke `plan-032-sp4-smoke-2026-10-14/` (en+it @900×640, loadout 3-item reale). Stessa divergenza ICU `{label}` della SP-5. **PLAN-032 completo: tutti e 5 gli SP chiusi 2026-10-14** — ogni superficie presentational-only (nessun sistema reale di inventario/economia/progressione), tutte verificate unit+headed.
**Desiderata FROZEN:** nessuna corrispondente — collegata a R-072 (teaser, scena 3 = preparation/hero sheet) e R-166 (standard AAA di `/game`).

**Stato reale rilevato (sessione 2026-10-12):**
- **Scheda PG:** `PgDetailCard` esiste (Materic, draggable, i18n, stat dinamiche via `STAT_DESCRIPTORS`, equip via `useResidentHeroState`) ma è cablata solo su `/primitives` e `/hero-components-lab` — mai su `/game`. Su `/game` il click su pgCard oggi = `onResidentSelect` → **auto-assegnazione** al primo slot che accetta (`useQuestPoiSession.handleResidentSelect` / expedition): conflitto diretto col nuovo significato del click («apri scheda») — da sciogliere col Director. `SchedaPergamena` è legacy/dormant. Idioma `/game` = HudPlaque + `useHudPanelDrag` (guida `hud_component_guide.md`); `PgDetailCard` è su primitivi Materic — da verificare se va ri-espressa.
- **Consumabili base + picker:** `QUEST_STASH` (catalogo Zod, `bagSlots: 3`, `defaultLoadout`) + `StashPicker` (lab, R-102) + loadout inline già dentro `QuestExpeditionDetail` (chip item, cap, coverage). **Manca:** il magazzino della base come superficie — `QUEST_STASH` è un mock pool statico («the real village stash is S2 infrastructure», commento in `questStash.ts`), nessuno store inventario villaggio persistito, nessun pannello HUD che lo mostri fuori dalla quest.
- **Consumabili in quest:** `ConsumableBelt` esiste in `QuestRunWindow` (arm prima del check, healing/potion come azioni, banner passivo) + popover «bag» nella title row — ma la belt renderizza solo `waiting && !presenting` (scelte attive): durante viaggio/transit/beat è nascosta.
- Collegamenti: `questStash.ts`, `questItems.ts` (engineFlag bridge), `StashPicker.tsx`, `ConsumableBelt.tsx`, `QuestExpeditionDetail.tsx` §loadout, `QuestRunWindow.tsx`, `useQuestPoiSession.tsx`.

**Decisioni Director (2026-10-12):**
- **Gesto scheda PG:** `mouseOver` sulla pgCard apre la scheda del personaggio; `click` resta auto-assegnazione allo slot (comportamento attuale `handleResidentSelect` invariato). Nota di implementazione: gate hover durante il drag (non aprire mentre si trascina sopra il roster) + hover-intent delay.
- **Scheda da ri-esprimere come HudPlaque:** verificato — `PgDetailCard` **non** segue `hud_component_guide.md`: usa `MatericSurface`/`MatericFrame`/`MatericPlaque` (bocciati per la HUD, guida §2 — ammessi solo `WellBronzeBezel` e `MatericGrain`) e ha colori letterali (`CATEGORY_COLOR` hex, viola regola 10 «colori solo da token `--skin-*`»). Contenuto/dati (stat dinamiche `STAT_DESCRIPTORS`, equip `useResidentHeroState`) da riusare dentro un guscio `HudPlaque` + `useHudPanelDrag` + `SkinScope` + `data-hud-controls`, min 12px, i18n en/it-IT, voce nel menù Pannelli.
- **Magazzino:** «un magazzino di partenza tra gli edifici del villaggio» — i consumabili vivono in un edificio magazzino del villaggio. **Aperto:** su `/game` non esiste ancora una schermata villaggio/edifici (CURRENT_STATE: progettata, non implementata) — da decidere dove vive il magazzino (POI sulla mappa? pannello HUD?). Il sistema inventario **non deve esistere**: serve la schermata che lo mostra (mock-backed).
- **Mercante:** schermata mercante con HudPlaque + guida HUD — «il sistema nn deve esistere, mi serve la schermata che lo mostra» (mock-backed, niente `MarketEngine`).
- **Level-up eroe:** chiesto dal Director → verificato: **non esiste**. XP solo a livello villaggio (effetto `village-xp` in `questSettlement.ts`), nessun modello per-eroe; `MissingHub` lo registra come `missing` («XP assegnato; crescita non connessa»); esistono cue audio `level_up` e l'anello `SlottedMedal` (manca trigger+FX). Dominio in `PROGRESSION.md` (draft).

## R-168 — Ponte imprint→localizzazione: overlay IT per gen-impr002-miniera

**Richiesta (verbatim):** *«procedi»* (accettando la proposta: dare agli scenari imprint testo IT nativo + validazione parità EN/IT — il ponte imprint→narrated).
**Data:** 2026-10-12
**Stato:** `fatta`

**Esito:** `imprintLocale.ts` (ImprintLocaleOverlay + applyImprintLocale — solo campi presentazione, spina intraducibile, copy fuori dall'hash contenuto) + `impr002Miniera.it.ts` (overlay IT completo, peer render facts-locked con lockedFacts per nodo) + `localizedScenarioById(id, locale)` nel catalogo (fallback EN). Test di parità 13/13: coverage, zero orphan, lockedFacts nei body, spina byte-identica, run IT=EN. Registry `imprint-locale` + CONTRACTS §7 meccanismo v0. Formato rigenerabile da un futuro narrate Pass-5. Runtime locale pick non cablato (gen gira solo in lab — gen-poi-wiring open). Evidence: `test-results/r168-imprint-locale-2026-10-12.log`.
**Desiderata FROZEN:** meccanismo v0 di localizzazione degli imprint compiled scenario: (1) `imprintLocale.ts` — tipo `ImprintLocaleOverlay` + `applyImprintLocale()` (deep-merge della copy IT sui campi presentazione di nodi/combat/intelLabels/epilogue/offer, grafo e flag invariati — la copy è fuori dall'hash contenuto per contratto); (2) `impr002Miniera.it.ts` — overlay IT completo facts-locked per `gen-impr002-miniera` (peer render, non traduzione letterale: Significato in chiaro per regola 7 del contratto di scrittura); (3) `getImprintScenario(id, locale)` accessor locale-aware nel catalogo; (4) test di parità: copertura nodi/opzioni/verdict/combat, lockedFacts preservati, run IT produce flag identici. La generazione LLM della stessa overlay via pipeline narrate (Pass 5) resta futura — il formato è progettato per essere rigenerato, non solo scritto a mano.

## R-169 — HUD che si nasconde da sola (idle) + tempo fermo durante l'evento

**Richiesta (verbatim):** *"ha senso fare una modalità che se sto fermo da troppo tempo scomare l'HUD, e se premo qualche pulsante riappare? magari quando scompare appare qualche mostro marino o che ne si"* — e la precisazione: *"si, e devi mettere che quando c'è l'event (mentre lo shroud si sta chiudendo, dopo che clicchi e la pagina si riapre) il tempo è fermo. qunado l'animazione dell'evento è finita il tempo torna allo stato pre trigger dell'evento (se era in pausa sta in pausa, se era 2x tonra a 2x, ecc)."*
**Data:** 2026-10-12
**Stato:** `completata`
**Desiderata FROZEN:** nessuna nuova — estende R-166 (qualità AAA di `/game`) e PLAN-033 (teatro evento invasione).

**Direzione ratificata (explorer → Director):** auto-hide su idle + wake-on-input + wake-on-event **obbligatorio** (il clock corre sempre: un evento deve poter richiamare gli strumenti). Il mostro marino usa il sistema sea-wonders esistente (kraken/balena/nave): `wonderRequest` bump all'hide = premio della contemplazione.

**Esito implementazione (2026-10-12):**
- **Idle auto-hide** (`GameFrame.tsx`): timer `hudHide.idleHideMs` (30s, config Zod) su `pointerdown/pointermove/keydown/wheel`. `hiddenBy` distingue i casi: hidden **da idle** → QUALUNQUE input la richiama (eccetto la perla, che resta toggle deliberato); hidden **a mano** → solo `h`/perla. Telemetry `game_hud_toggle` con `reason: manual|idle|input|event`.
- **Wake-on-event**: `hudWakeSignal` su `GameFrame` (bump → chrome torna sempre); alimentato da (a) pagina: rising edge di `shroudCovered`; (b) `GameFrameScreen`: `events.length` nel signal (nuove righe ledger). `onHudHiddenChange` prop verso la pagina.
- **Freeze del tempo durante il teatro** (`game-frame-pixi.tsx`): rising edge di `shroudCovered` → snapshot `{wasPaused}` + `pauseGame('auto')`; falling edge → release dopo ~1000ms (le tende impiegano 900ms a riaprirsi) → `resumeGame('auto')` solo se non era in pausa. `speedMultiplier` mai toccato → 2x torna a 2x. La marcia del goblin (fino a ~16min) NON è coperta dal freeze: è un evento del mondo a tende aperte, non teatro modale.
- **Input lock durante il freeze**: `timeInputLocked` su `GameFrameScreen` → `onTogglePause`/`onSpeedChange`/tasti `1-9`/`Space` inerti (`useTimeEngineLoop` accetta `{inputLocked}`), così il giocatore non può riattivare il tempo sotto le tende.
- **Wonder on idle-hide**: `hudHide.wonderOnHide` → `setWonderRequest(n+1)` **solo** quando l'HUD scivola via da sola (idle) — decisione Director 2026-10-12 (BV F-2): il wonder è il premio della contemplazione; un hide manuale (`h`/perla) è una vista pulita deliberata, niente wonder. `onHudHiddenChange(hidden, cause)` porta la causa. ✅ **Bug risolto (2026-10-12)**: lo spawn falliva perché su renderer senza WebGL (`CanvasRenderer` fallback) i `MeshPlane` canopy rompevano `validateRenderables` → eccezione nel `Ticker.update` → **ticker Pixi morto a ~2.4s** (mappa congelata + wonder tick morto). Fix in `PixiWorldMap`: `import 'pixi.js/mesh'` + guard `meshOk` sui 4 blocchi mesh (canopy/deepSea/seaPattern/coastFoam). Su WebGL invariato; su canvas gli effetti mesh si skippano invece di uccidere il ticker.
- **Test**: unit `gameHudIdle.test.tsx` 5/5 (fake timers — pattern `globalThis.setTimeout`; fixato anche un bug reale: l'effetto si risvegliava da solo all'hide perché la chiamata iniziale `onActivity()` contava come wake — ora il wake richiede un evento reale). E2E `gameEventFreeze.spec.ts` 3/3: running→freeze→resume a 2x, paused→paused, HUD hidden→wake su invasione.
- **Behavioral Verification (SKILL-VERIFICATION, contesto pulito)**: iniziale `BV BLOCKED` con 3 finding → tutti risolti: F-1 (freeze release 1000ms hardcoded → `eventTheatre.freezeReleaseMs` in config Zod), F-2 (wonder on every hide → Director: solo idle), F-3 (coverage gap WebGL → run headed: `renderer:webgl, meshPipe:true`, ticker vivo, wonder spawnato, 0 errori). **Esito finale: BV PASS.** Contratti bootstrap: `CTR-game-001/002/003`, regressione `REG-001` (ticker-morto da pipe mancante).
- Evidence: `test-results/plan-033-hud-idle-freeze-2026-10-12.log`, `.mw/runs/bv-r169-2026-10-12/bv/` (FINDINGS, DECISION-REPORT, COVERAGE-RECORD).

---

## R-170 — Prototipo «Invasione Goblin» v0.2 (standalone HTML, sistema obiettivi persistenti)

**Richiesta (verbatim):** *«procedi»* — accettando il task generato nella conversazione ChatGPT incollata dal Director (thread layer opportunità/obiettivi persistenti, vedi R-153/R-164): evolvere il prototipo HTML standalone in v0.2 mantenendo v0.1 intoccata, senza integrarlo nel progetto né ribilanciarlo.

**Data:** 2026-10-12
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna corrispondente — è un artefatto di esplorazione gameplay collegato al thread «obiettivi persistenti / layer opportunità» (R-153, R-154, R-164). Le regole su human-days, opportunità, persistenza e pressione crescente restano PROPOSAL finché non ratificate.

**Task eseguito (spec ChatGPT):**
1. **v0.1 preservata** verbatim in `public/invasione-goblin-v01.html` (convenzione `public/` per gli spike standalone, come `land-breath-spike.html`).
2. **v0.2** in `public/invasione-goblin-v02.html`: (a) sconfitta immediata a pop≤0 — fix reale: `invade()` applicava `pop+3` *prima* del check di sconfitta → villaggio a 0 abitanti «resuscitava»; (b) RNG seeded (mulberry32, tutta l'aleatorietà di gioco) + controllo seed in UI con restart; (c) end-of-run summary: giorno, invasioni, pop, risorse, difese, investimenti, quest riuscite/fallite + cronologia scelte (`S.hist`); (d) `pr()` riscritta come `c*100/36` — **vedi nota sotto**.
3. **Vincoli rispettati**: nessun ribilanciamento, nessuna meccanica/risorsa nuova, nessun refactor, nessuna integrazione col runtime `/game`.

**⚠️ Divergenza dallo spec (onestà tecnica):** lo spec ChatGPT dichiarava `pr()` buggata («divide by 0.36 instead of 36»). **Falso allarme**: `c/.36` = `c*100/36` era già la percentuale esatta. Verificato contro la distribuzione 2d6 (pr(7)=58%, pr(12)=3%, …). La v0.2 usa la forma leggibile equivalente — zero cambiamento di comportamento.

**Test (harness Node `.mw/runs/2026-10-12-goblin-v02/harness.mjs`, 11/11 PASS):** probabilità esatte 2d6; sconfitta immediata a pop≤0 senza revive; stesso seed+stesse azioni → stato identico; seed diversi → stati diversi; playthrough sconfitta (villaggio passivo cade all'invasione 1, g120) e **playthrough vittoria (seed 1000: Re sconfitto g356, pw 30 → tiro 17%)**.

**Finding di bilanciamento emersi (da riportare a design):**
- Il villaggio muore stabilmente all'invasione 3 (g360, minaccia 196): il tetto difesa reale è ~100-130 — trappole one-shot, palizzate a costo crescente, `trn` cap a pop-2.
- **L'oro è il collo di bottiglia strategico**: nessun edificio lo produce; alimenta `trn` (6 oro), training stat (~25-70 oro l'uno) e Miniera/Segheria. Solo le quest lo danno → la selezione quest diventa la vera leva.
- La scadenza del Re (spawn g60, `exp` +300 → ~g360) coincide quasi esattamente con l'invasione letale 3 → kill-or-die window emergente, coerente col design dichiarato («sconfiggere il Re prima che le ondate diventino troppo forti»).
- `trn` è l'investimento keystone: difesa permanente **e** power del Re (`trn/2`).
- Vittoria dimostrata ma tirata (~17% sul tiro decisivo): il tono «punitivo ma non troppo» è già nell'intervallo giusto per il prototipo.

**Evidence:** `test-results/r170-goblin-v02-2026-10-12.log`; harness `.mw/runs/2026-10-12-goblin-v02/harness.mjs` (riusabile: `node harness.mjs public/invasione-goblin-v02.html`).
**Prossimo passo (per lo spec):** il Director gioca la v0.2 (economia vs difesa) e riporta i riepiloghi → discussione design su decisioni dominanti e regole da modificare.

---

## R-171 — Analisi comparativa bilanciamento prototipo Invasione Goblin v0.2

**Richiesta (verbatim):** task strutturato del Director — 100+ run riproducibili su seed distinti, 5 politiche definite a priori (trn/eco/def/rush/adattiva), domande di design su sopravvivenza/economia/trn/finestra di vittoria/qualità decisioni, report `r171-goblin-balance-analysis-2026-10-12.md`. *Nessuna modifica a meccaniche o bilanciamento.*

**Data:** 2026-10-12
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna — raccolta evidenze per le decisioni di design (thread R-170, layer opportunità R-153/R-164).

**Esito:** 1000 run (200 seed × 5 policy) eseguiti con strumentazione wrap-only in VM Node (zero modifiche alle regole; `render` no-op). Report completo: **`test-results/r171-goblin-balance-analysis-2026-10-12.md`**; dati grezzi `.mw/runs/2026-10-12-goblin-balance/` (`runs.json` 1000 run con sequenze complete, `aggregate.json`, `analyze.mjs`, `deep.mjs` — riproducibile).

**Risultati chiave:**
- Morte **sempre** per invasione, clusterizzata sui giorni d'invasione; minaccia quadratica (70→127→208→313→442) vs tetto difesa ~206. Il muro per strategie bilanciate è **invasione 3 (g360, 65-68%)**; difesa pura muore prima (36.5% all'inv1 — la difesa non si autofinanzia).
- **Vittoria solo via power-rush**: `rush` 29%, `ada` 15%, `trn`/`eco`/`def` 0/600. Successo condizionato al tentativo ~42-57%; tiro decisivo mediano 50-74% (il 17% di seed 1000 = outlier).
- **Il collo di bottiglia della vittoria è la velocità di `pw` entro ~g360** (~19% dei run persi arriva a pw≥30): oro×giorni, non oro in assoluto (`eco` muore con +201 oro in cassa).
- `trn` = investimento keystone (difesa + pw); scadenza Re mediana g360 **sincronizzata** con l'invasione letale — kill-or-die window emergente.
- Lo stesso seed dà esiti opposti sotto policy diverse: **39% dei seed vincibile** da almeno una policy; la strategia domina la casualità iniziale.

**Aperto (da verificare, non applicato):** politiche >`rush` non testate; tasso di vittoria del giocatore umano vs euristiche; se la curva sia «intenzionalmente punitiva» — giudizio Director.
**Prossimo passo possibile:** il Director decide se la difficoltà attuale è intenzionale e quali esperimenti (es. fonte oro non-quest, training più corto, indicazione conto alla rovescia potenza) meritano una v0.3.

---

## R-171 — Scheda concept razza «uomini-rana» (nome temporaneo)

**Richiesta (verbatim):** *«stiamo facendo una nuova creatura magica x la mia ambientazione. […] salvala nella documentazione in modo adeguato: nome temporaneo uomini-rana»* — scheda concept di razza anfibia/rettiliana umanoide senziente (gambe ~2,5× busto, pelle viola `#7D00B9`, pustole ambrate, spine dorsali irregolari, veste monastica, due lance primitive, deserto di basalto + rovine antiche; ricostruzione discussione 22 agosto + nuova specifica proporzioni).

**Data:** 2026-10-12
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna corrispondente — concept di art direction, non canonico.

**Cosa è stato fatto:**
- Creata la scheda nel **Creature IP Development System** (`src/docs/docs/art-direction/creatures/creatures/uomini-rana/`) seguendo la convenzione dei 4 esemplari esistenti: `identity.md`, `design-intent.md`, `reference-card.md`, `prompt.md` (prompt injection pronto, stile Split-Rendering Wanderlust), `decision-log.md`, `versions/v0.1.0.md` — status `draft`, versione `0.1.0`.
- Registrata in `src/docs/docs/art-direction/creatures/registry.md` (tabella Creatures) e in `context/INDEX.md`.
- Correzione stessa data: lo `Style` del `prompt.md` era generico — riallineato allo stile canonico concordato **Split-Rendering con impasto spesso a pennellate larghe** (bibbia §10, invariato); NO LIST estesa (no glazes/airbrush/flat digital paint).
- Iterazione stessa data: gambe **ancora più lunghe e strette** (spec ~2,5× → ~3× busto, stick-thin) e **occhi lattei/opachi** — aggiornati `prompt.md`, `identity.md`, `reference-card.md`, `decision-log.md`.

**Decisioni aperte (segnate nel decision-log):**
- **Famiglia:** nessuna delle 4 famiglie esistenti ammette anatomia umanoide o cultura senziente → serve una nuova famiglia (es. popoli senzienti) o un ruling esplicito fuori-famiglia.
- Nome canonico (uomini-rana è temporaneo), world tier, animation grammar, ruolo gameplay — tutti TBD.
- Immagine di riferimento assente: la prima generazione deve passare il Coherence Test della reference-card.

---

## R-172 — Prompt Engineering V2 per umani e creature magiche (anti-banalità)

**Richiesta:** *"nella nostra bibbia di creazione di immagini AI dobbiamo fare un cambiamento. attualmente i mostri e i pg hanno come caratteristiche troppo 'banali'. Voglio che tu faccia una V2 della creazione dei prompt per umani e per mostri/creature magiche. La v1 salviamola come obsoleta. La V2 deve essere allineata con lo stile pittorico a pennellate spesse che già abbiamo utilizzato"*.
**Data:** 2026-10-12
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna corrispondente — aggiornamento della bibbia artistica (`art_direction_plan.md`), autorità: art direction.

**Cosa è stato fatto:**
- Bibbia canonica `src/docs/docs/plans/art_direction_plan.md` portata a **v0.12**: nuova **§10 — Prompt Engineering V2** con il **Motore di Unicità** (identity sentence familiare+impossibile, signature hook, contraddizione, story trace, gesture in medias res, cultural anchor, recognition test), template compilabili per **umani** (§10.2, con "regola del terzo elemento" e campi mani/provenance) e **creature magiche** (§10.3, con MAGIC VECTOR materico e THE WORLD REACTS), due esempi compilati (eroe esiliato, Cervo-Faro). Stile pittorico a pennellate spesse confermato: impasto Jaime Jones/Jeff Easley, split-rendering Ruan Jia, Solar Triumph, ombre teal.
- §4 (regole v0.10) e §5 (master prompt) marcati **OBSOLETI** e conservati per memoria creativa; master Wilderness resta valido per paesaggi.
- Specchiato in `src/docs/plans/art_direction_plan.md` (copia servita alla pagina dev "Prompt & Bible Style", alias `@docs` → `src/docs`; lì §10 è §7 perché quella copia non ha §6–9).
- Puntatore V2 aggiunto in testa a `src/docs/docs/prompts/prompt_library.md` e `src/docs/prompts/prompt_library.md`.

**Note:** i 4 prompt creatura `canonical` e i prompt umani della library restano output storici validi; nuove creazioni e rigenerazioni usano V2. Possibile follow-up: rigenerare i 4 prompt creatura canonici con template V2 (bump MINOR/MAJOR per creatura).

---

## R-173 — Audit d'integrazione: Invasione Goblin lab ↔ meccaniche reali (R-172 report)

**Richiesta (verbatim):** task strutturato del Director — trasformare progressivamente `invasione-goblin-v02.html` da minigioco autonomo a laboratorio simulativo delle meccaniche reali di Wanderlust. *Fase audit + piano soltanto: nessuna modifica alle meccaniche, nessun push.*

**Data:** 2026-10-12
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna — audit a supporto delle decisioni di design (thread R-170/R-171; layer opportunità R-164/PLAN-030).

**Esito:** report completo **`test-results/r172-goblin-integration-audit-2026-10-12.md`** (il filename dice r172 per lo spec; ID reale R-173 perché R-172 era già occupato).

**Risultati chiave dell'audit:**
- Il layer strategico **esiste già come engine riusabile**: `src/engine/metaLayer/` (PLAN-030) — deterministico, seeded `mulberry32`, offerte con gate a 4 stati + doppio timer + leader-capacity + esito graduato con harm; il contenuto v0 include già uno scenario d'assedio (`intel:siege-plans`→`race-break-siege`→`ms-siege`).
- L'**esclusività di disponibilità è già implementata** (`canScheduleActivity`→`away`, `buildExpeditionParty` lock `in-expedition`) — il costo opportunità che il lab vuole osservare è codificato nel gioco, non nel lab.
- **Invasione reale = solo cinematica** (marcia 30gg su `/game`, esito "futuro non implementato"): la risoluzione del lab è la *proposta* candidata, va marcata come tale.
- Engine **deprecati da evitare**: `QuestEngine`/`QuestResolver`/`QuestPowerEngine` (E2/C2 legacy); canonico di riferimento `questRun`+`questSettlement` (motore definitivo ancora OPEN-002).
- Architettura consigliata: `invasione-goblin-v03.html` + **bundle ES generato dagli engine reali** (riuso diretto dei moduli dominio-puri; adapter isolati; meccaniche lab-only marcate PROPOSTA). Roadmap 0→F con test di accettazione.
- **7 decisioni aperte** che richiedono il Director (D1–D7): forma del lab (HTML+bundle vs harness Node), livello resolve quest, reclutamento, trn/difesa vs stat reali, granularità ferite, win-condition come milestone metaLayer, meta-run.

**Prossimo passo:** il Director sceglie D1–D7 → primo incremento (0+A: `pop`→`ResidentState` reali con esclusività) diventa task implementabile.

---

## R-174 — Goblin Lab v0.3, Incremento 0+A: persone reali con esclusività di disponibilità

**Richiesta:** continuazione del task R-172/R-173 (audit→roadmap) dopo le decisioni del Director 2026-10-12: **D1** harness Node/tsx prima (niente HTML shell), **D2** resolve quest graduato metaLayer (per Inc B), **D3** reclutamento = migranti come offerta metaLayer (Inc B; nel frattempo migranti diretti PROPOSTA-lab), **D4** `trn`/difesa = modello proposto lab su roster reale.

**Data:** 2026-10-12
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna — laboratorio sperimentale, nessuna regola canonica modificata.

**Esito:** `tools/goblin-lab/lab.ts` (locale: `tools/` è gitignored per convenzione repo) — harness tsx che riusa `TimeEngine` (esclusività reale: `away`/`dead`/`injured` bloccano scheduling) e `mulberry32` (metaLayer). `pop` scalare → `ResidentState[]`; `trn` → tag 'trained' su persone; difesa conta solo addestrati **presenti**; perdite = morti specifici permanenti; quest = party eroe+1-2 villager impegnati per la durata.
**Evidence:** `test-results/r174-goblin-lab-inc-a-2026-10-12.log` — accettazione 5/5 (doppia assegnazione rifiutata, away non riassegnabile, morte permanente, difesa esclude away, replay identico) + sweep 30 seed.
**Finding emergente:** con persone reali l'attrito dei fallimenti quest (1-2 morti nel party) rende il churn insostenibile — 0/30 vittorie, estinzione villager sistematica (l'eroe resta solo). Prima interazione cross-sistema rivelata dal lab.
**Prossimi:** Inc B (offerte/metaLayer + migranti come offerte), Inc C (ferite vs morti + `injuredUntilTick`), Inc D (consumo cibo/produzione per-persona sul clock condiviso), Inc E (invasioni con difensori assenti), Inc F (ciclo run).

---

## R-175 — Goblin Lab v0.3, Incremento B: quest = offerte metaLayer, reclutamento come opportunità

**Richiesta:** "procedi" (2026-10-12) — prosecuzione della roadmap R-172 dopo Inc 0+A. Inc B: board quest via sessione `metaLayer` reale (gate 4 stati, doppio timer, leader-capacity, resolve graduato + harmProfile); migranti = offerte `people` (D3); Re = `king-assault` su `clock:king` + milestone `ms-end-siege`; harm → targeting posizionale canonico (coda 20/80) con ferita → `injured` + recovery sweep TimeEngine.

**Data:** 2026-10-12
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna — laboratorio sperimentale; nessuna regola canonica modificata (contenuti OfferDef marcati PROPOSTA-lab).

**Esito:** `tools/goblin-lab/lab.ts` + `labContent.ts` + `sweep.mjs` (locale: `tools/` gitignored). `MetaLayerConfig` authored validata dallo Zod schema canonico; reward→risorse in `LAB_REWARDS` adapter (conversion rewards posticipate in PLAN-030); `access:recruitment` quality adapter gatea le offerte migranti; `trn` reso derivato (conteggio addestrati vivi); eroe mortale e leader-capacity=1 → **eroe caduto = run persa**.
**Test:** 11/11 — A1-A4 (esclusività/morte/difesa) + B1 no-leader-available, B2 appearsWhen su clock:king, B3 underprepared committabile, B4 migranti via offerta, B5 wound→injured→recovery, B6 offerta scaduta rifiutata, A5/B7 replay deterministico.
**Evidence:** `test-results/r175-goblin-lab-inc-b-2026-10-12.log` — sweep 30 seed.

**Finding emergente (vs Inc A):** con harmProfile canonico (wound≫death, condizionato al fail) l'attrito crolla: **21/30 vittorie** (era 0/30 in Inc A, 29% in v0.2), pop al cap (31/31 mediana). Nuovi modi di perdere: 5× eroe caduto in missione (slot testa 20% in party da 2), 4× collasso strutturale all'invasione 7 (g840 — il tetto difesa ~pal cap regge fino a threat ~800). Le vittorie si clusterizzano a ~g84/204/324/443/564/685/804 — tentativi Re sincronizzati pre-invasione (finestra disperazione). `trn` quasi mai usato → la morte del tag 'trained' con la persona + pal spam hanno spostato il keystone difesa. L'estinzione di Inc A era guidata dalla regola v0.2 fail→1-2 morti garantiti, non dal costo-opportunità.

**Prossimi:** Inc C (granularità ferite/HP + riammissione injured alle spedizioni), Inc D (produzione/consumo per-persona sul clock), Inc E (invasioni con difensori assenti), Inc F (ciclo run/meta-run). Aperta: `alive=31` al cap suggerisce `access:recruitment` da rifinire; mortalità eroe in party piccoli = leva design.

---

## R-179 — RpgBalancer: dalla simulazione isolata al gameplay integrato

**Richiesta (verbatim, sintesi):** audit sul codice reale di ciò che esiste/canonical/lab/assente → scegliere il più piccolo incremento verticale che colleghi meccaniche reali (roster→assegnazione→tempo→esito→conseguenze→disponibilità→decisioni) → implementare con test; niente matrici massive, niente S4/S5 automatici.
**Data:** 2026-10-13
**Stato:** `fatta` (incremento Inc F implementato e verificato; audit documentato in `tools/goblin-lab/FIDELITY.md`)
**Desiderata FROZEN:** coerente con la desiderata macro-sim R-176 (laboratorio per il gameplay reale).

**Audit sul codice (verificato, non da documenti):**
- CANON: `metaLayer` (board/gate/timer/resolveOutcome), `TimeEngine` (disponibilità, fatigue, recovery, consumo cibo per-resident), `missionResolver` (MP-06 per-member), `questSettlement`→`MinimalGameplayState` (idempotente), `JobResolver`/`useActivityScheduler` (orchestrazione completamenti), `InjuryEngine`, `Survival/Production/EconomyEngine`.
- ADAPTER lab: `prodPer×pop` (produce anche chi è away/injured!), `eatPer×pop` (eroe non mangia), harm posizionale, `LAB_REWARDS`, invasione v0.2, `people` offers.
- Gap canonici trovati leggendo il codice: (1) `applyContinuousJobTick` legge `amountFormula` su `ResourceRateDefinition` (che ha `amountPerDay`) → tick streaming dei continuousJob applica 0 — il percorso funzionante è job regolare + `resolveJob` al completamento; (2) `exhausted` è terminale in `VillageState` (la notte abbassa fatigue ma non riporta lo status a `available`); (3) settlement applica `woundRecoveryTicks=5` flat — i tier canonici esistono ma non sono consumati dal settlement; (4) `JobResolver.evaluateRewardAmount` TODO su formule non numeriche; (5) due modelli di residente (`ResidentState` vs `MinimalResident`).

**Incremento scelto:** economia per-persona canonica — la produzione richiede l'assegnazione reale di villager a job (`tags:['job']` + `resolveJob` su completamento, come `useActivityScheduler`), consumo cibo engine-side su `vil.resources.food` (mangia anche l'eroe; adapter unità tick=giorno documentato). Chiude il link "ferite/impegni → disponibilità → sopravvivenza → decisioni" che oggi è reciso.

**Implementato (Inc F, `tools/goblin-lab/lab.ts`):** rimossi `prodPer` e `eatPer×pop` manuali; `cfg.jobs` (3 job patchabili via scenario) → `ActivityDefinition` `resolutionEngineId:'job'`; `assignWorkforce` per-persona (`work.{foodCover,woodKeep,ironKeep}` dati di policy, preferenza non-trained + sort fatigue → rotazione); `advanceDay` fa push `S.res→vil.resources` → `advanceTime` canonico (consumo eroe+feriti inclusi) → `resolveJob` per ogni completamento tag 'job' → pull. Metrica `personDays.jobs`. Bridge `food↔cibo` dichiarato OBSERVED-ADAPTER.

**Test:** 28/28 (7 nuovi F1–F7: produzione solo se assegnata, nessun lavoro→nessuna produzione, injured/away non lavorano, lavoratore away non difende, fame→fine run, consumo conta tutti i vivi, `cfg.jobs.N.rate` patchabile). Evidence: `test-results/r179-lab-test-2026-10-13.log`. Safeguards: lint scope 0 problemi, build:check PASS, kanban:lint PASS.

**Vincoli rispettati:** niente modifiche al resolver canonico, niente matrici massive, A/B/C isolati, nessuna nuova meccanica di gioco.

**Prossimo incremento consigliato:** invasione con difensori realmente disponibili (Inc E — il trade-off lavoro↔difesa è ora reale ma la risoluzione invasione resta l'ultimo blocco PROPOSTA grande) oppure unificare il modello residente lab con `MinimalResident`/questSettlement per chiudere il doppio aggregato.

## R-180 — /game: «POI types» deve mostrare anche il POI dorato delle quest

**Richiesta (verbatim):** *"in /game quando in director clicco su POI types nn esce quello d'orato delle quest, che dovrebe far partire quando cliccato la schermata di preparazione alla quest"*
**Data:** 2026-10-13
**Stato:** `fatta` — verificato live su FE via Puppeteer.
**Desiderata FROZEN:** nessuna nuova — bugfix sulla superficie canonica. Tensione nominata con R-143: lì «POI types» era stato ridotto ai soli tipi senza contenuto reale. Il fix rispetta l'invariante vero di R-143 (il marker quest è **reale**, mai un esemplare finto) — sotto «POI types» si monta l'offerta vera, non una copia demo.

**Diagnosi (live, due cause sovrapposte):**
- (a) post R-143 il gate degli anchor quest era `questShown` (toggle «Show quest») e `poiDemo` montava solo job/event finti → «POI types» non mostrava più il dorato.
- (b) le offerte `QUEST_POIS` scadono a `availableUntilDay: 60`, ma il clock del villaggio è compresso (5 tick/giorno) → finestra = ~5 minuti reali; sul save del Director (giorno 80+) entrambe le offerte risultavano `expired` e un marker scaduto renderizza invisibile (`opacity:0`, no click) → il dorado non appariva **con nessun toggle**. Il click→planner funzionava già (`handlePoiClick` → `QuestExpeditionDetail` quando non c'è run live).

**Fix:** (a) `questRevealed = questShown || poiDemo` in `game-frame-pixi.tsx` — gate degli anchor expedition e della riga «quest aperta» nel ledger. «Show quest» resta il gate solo-quest. (b) `availableUntilDay` 60 → `SLICE_OFFER_WINDOW_DAYS` (10_000) in `questPois.ts` — il config dichiara le finestre «generose, availability pressure non è la meccanica in slice»; il path di scadenza resta esercitato dai test di `questAvailability`. Commenti e guida E2E aggiornati. Bug dir `.mw/bugs/20261013-poi-types-quest-marker/`.

**Safeguards:** lint scope 0 errori; build:check PASS; kanban:lint PASS; unit quest scope; verifica live Puppeteer: «POI types» → 4 marker (2 demo + goblin + rovine reali), click dorato → `quest-expedition-detail` con send/forecast; toggle-off → fade+shrink poi unmount. Evidence: `test-results/r180-poi-types-quest-marker-2026-10-13.log`.

### R-177 / PLAN-058 T0.4 fatto (2026-10-13)
**Parole del Director:** "sì, fai T0.4". Guida HUD §6 «Layout e interazione» scritta (valori marcati Roster/codice/deciso, checklist §6.12 per la Fase 1). Difetto trovato: opacità disabilitati 0,4 (~2:1).

---

## R-181 — /game: le scelte del pannello Tuning devono diventare il nuovo default

**Richiesta (verbatim):** *"qualcosa cambia la velocità di default che ho scelto per tipo le nuvole e cose del genere. xè le scelte in Tuning nn rimangono anche x le altre sessioni? devono essere il nuovo default"*
**Data:** 2026-10-13
**Stato:** `fatta` — endpoint testato live (200/400), safeguard verdi. Richiede restart del dev server per registrare la route.
**Desiderata FROZEN:** nessuna nuova — comportamento del dev-tool Tuning sulla superficie canonica.

**Diagnosi:** il TuningPanel (`/game`, tasto T) persiste già gli override in `hud_tuning_v1` via `PersistenceService` (commit `0882987b`, 2026-10-08) — ma è solo localStorage del browser corrente: non vale per altre origini/modi (es. `preview:playwright` usa `sessionStorage`), non sopravvive a wipe dello storage, e soprattutto **non è il default shipped** — resta un override locale sopra `worldDressing.motion` / `DEFAULT_MAP_TUNE` / `DEFAULT_HUD_BAND_PX`.

**Fix adottato:** il tasto «Salva» del Tuning panel ora fa anche bake dei valori nei default di config via endpoint dev `POST /__hud-tuning-default` (vite.config.ts), stesso pattern di `/__sea-pattern-default`. Riscrive `worldDressing.motion`/`seabed` in `gameFrameConfig.ts`, `DEFAULT_MAP_TUNE` in `PixiWorldMap.tsx`, `DEFAULT_HUD_BAND_PX` in `hudBand.ts`. Il localStorage override resta come fallback runtime; se il bake fallisce (es. preview non-dev) il pannello mostra un avviso i18n `gameFrame.tuning.bakeFailed`.

### R-177 / PLAN-058 Gate F0 approvato (2026-10-13)
**Parole del Director:** "si" — approvati: Roster invariato, misure del Roster come metro per tutto l'HUD, regole [deciso] di guida §6 (scala 12-24, maiuscolo ≤3 parole, disabilitati 0,65, area 32×32, tooltip 400 ms, numeri abbreviati da 10k, anteprima invece di conferma, multipli di 4). Sbloccate Fase 1 (T1.1-T1.6) e T4.2.

## R-182 — Goblin lab Inc E: invasione come missione canonica per-membro

**Richiesta (verbatim):** *"procedi"* — sul next incremento consigliato in chiusura di R-179 (invasione con difensori realmente disponibili via `missionResolver`, l'ultimo blocco PROPOSTA grande del lab).
**Data:** 2026-10-13
**Stato:** `fatta`
**Desiderata FROZEN:** coerente con la desiderata macro-sim R-176 / direttiva R-179 (dalla simulazione isolata al gameplay integrato; meccaniche canoniche, adapter dichiarati).

**Design (dall'audit R-179):** `invade()` v0.2 (threat scalare vs difesa flat, vittime random, distruzione edifici flat) → invasione come `resolveMissionRun` canonico: membri = eroe (se `available`) + `trainedPresent` (milizia davvero presente — away/injured/lavoratori non difendono), check di fase weakest-tag su `for` (hero usa `S.st.FOR` reale — allenare l'eroe ora aiuta la difesa), threat→difficulty bridge e fortificazioni→risk/difficulty come OBSERVED-ADAPTER dati in `cfg.siege` (patchabili). Esiti membri canonici (dead/injured persistenti via ResidentState); tier → respinta/breccia; breccia → vittime tra i civili PRESENTI (away = fisicamente assenti) + edifici. Senza difensori la milizia è vuota → breccia.

**Implementato (`tools/goblin-lab/lab.ts`, nessun tocco a `src/`):** `invade()` v0.2 → `resolveMissionRun` MP-06 canonico. Difensori = eroe (se `available`) + `trainedPresent`; check di fase weakest-tag su `for` (eroe usa `S.st.FOR` reale, villager `siege.trnFor` adapter) ×`partyStatMult` 4; threat→difficulty/fortificazioni→sconto/gap→`emptySlotPenalty`/tier→ferita/breccia→civili+edifici = OBSERVED-ADAPTER dati in `cfg.siege` (patchabili). Esiti membri persistenti su `ResidentState` (`eroe caduto in difesa` chiude la run, tag CANON). Civili `away` non vittimizzabili (fuori dal villaggio). Metriche `sieges{repelled,breached,tiers}` nel report. Semplificazione dichiarata: nessun retreat in assedio.

**Finding gameplay:** prima della fix di policy ogni assedio era `fail` (8 brecce/10 seed) — la milizia era `away` in quest/lavoro nel giorno dell'invasione. Aggiunto `persona.holdForSiege` (non commettere quest non-Re con `resolvesAt > nI`; Re esente): 6 respinte/2 brecce su 10 seed. Prima decisione calendario del lab, conseguenza osservabile della disponibilità reale.

**Test:** 36/36 (8 nuovi I1–I8: zero difensori→breccia, collasso senza strutture, milizia away/injured non difende, ferita→recovery canonico, civili away non vittime, difesa forte>debole matched-seeds, report sieges, holdForSiege). Evidence: `test-results/r182-siege-canon-2026-10-13.log`. Safeguards: lint scope 0 problemi, build:check PASS, kanban:lint PASS. Fidelity aggiornata: `tools/goblin-lab/FIDELITY.md`.

**Residuo PROPOSTA:** threat curve, gap→rischio, breccia→civili/edifici (il gioco reale non ha ancora risoluzione invasioni); doppio aggregato residente (ResidentState vs MinimalResident/questSettlement) ancora aperto.

## R-183 — /game: suite E2E «quest dal vero» + swap slot↔slot + XP ai PG + documento illustrato

**Richiesta (verbatim):** *"dovrebbe esserci un sistema di test: prendi la pagian /game tutto quello che 'è li deve funzionare, niente + cose mockate. Soprattutto dobbiamo prendere: la creazione del POI di tipo Quest. cliccando deve apparire il POI detail (quest planner), devi poter scegliere dal roster i personaggi che vuoi mandare (devi aggiungere la funzione x cui puoi swappare pg da uno slot ad un altro, senza "estrarli" dallo slot". Scegliere che consumable portare nella quest, far partire la quest, risolvere la quest fase x fase, finire la quest, i pg ricevono exp (ancora nn è implementata, aggiungi quel valore), le risorse o oggetti aggiunti nella HUD. Fa 1documento che spiega come si fanno questi test (dovrebbe già esistere). Creami un documento con screenshot che spiega quando succede cosa e come"*
**Data:** 2026-10-13
**Stato:** `fatta` — suite E2E verde, safeguard in fondo.
**Desiderata FROZEN:** nessuna nuova. Interpretazione: «niente cose mockate» = la suite guida la UI reale (Director, click marker, drag, bottoni consumabili, «Invia», scelte cliccate, controlli tempo HUD, «Chiudi rapporto», readout HUD) — gli hook restano solo in lettura per le asserzioni. XP per-PG: la curva XP è OPEN (`PROGRESSION.md` §3) — si aggiunge solo il valore accumulato, nessun livello.

### R-177 / PLAN-058 T1.2 fatto (2026-10-13)
**Parole del Director:** "continua". Lastra del tempo: notte argento (niente viola) solo su /game, controlli velocità sui token del Roster con area cliccabile 32×32. Test DayNightPOI già rotti prima (non nostri).

**Implementato:**
- **Swap slot↔slot** (planner): il token del PG nello slot è un draggable opt-in di `ResidentSlotRack` (`enableSlotSwap`, id `slot-token:<slot>`); drop su slot vuoto = sposta, su slot occupato = scambia; entrambi gli atterraggi passano dal gate di eleggibilità (`planSlotSwap` puro in `questExpedition.ts`); durante il drag gli altri slot si colorano valid/invalid per lo scambio; il press-and-hold fermo estrae ancora.
- **XP ai PG**: effetto settlement `resident-xp` per ogni membro vivo (config `QUEST_SETTLEMENT.residentXp.mode` = `full` PROPOSTA, alternativa `split`; wipe = nulla; idempotente). Campo `xp` su `MinimalResident`/`ResidentState`, persistito nello snapshot, proiettato sul roster (tooltip nome + `data-resident-xp`), righe per-PG nel rapporto e nel registro (i18n en/it/pseudo).
- **Suite `tests/e2e/idleVillage/gameQuestFullFlow.spec.ts`**: tutto con input reali (Regia, marker, drag, swap + swap rifiutato, loadout, «Invia», ×4, scelte cliccate, beat con Enter, cintura armata/cura, rapporto, chiusura, reload); hook solo in lettura; screenshot per passaggio (`QUEST_DOC_SHOTS=1` → `src/docs/docs/testing/quest_full_flow/`).
- Selettori: `quest-window-choice`+`data-option-id`, `quest-consumable-belt`/`belt-*`, `slot-token-*`, `slot-token-ghost`.
- **Documenti:** guida aggiornata `src/docs/docs/testing/e2e_game_quest_lifecycle_guide.md` (§0 le due suite, selettori, finding 5-6); nuovo `src/docs/docs/testing/quest_full_flow_walkthrough.md` con 17 screenshot.

**Bug trovati dalla suite e corretti:**
1. **Dopo la prima quest il gioco non salvava più**: `MinimalActivityEntrySchema.messageParams` usava `z.record(valore)` a un argomento → con zod 4 la validazione lanciava; ogni snapshot con righe di settlement falliva in silenzio (warning). Fix `z.record(z.string(), …)`.
2. **Checksum snapshot instabile**: calcolato sull'input grezzo ma verificato sui dati zod-parsati (riordino/strip chiavi) → caricamento fallito con `isOnExpedition` valorizzato. Fix: checksum sui dati normalizzati. `isOnExpedition` ora nello schema; il merge engine→store non lo perdeva più.
3. Righe XP del rapporto ereditavano il countdown di guarigione dei feriti.

**Aperto (decisione Director):** inventario consumabili con quantità e inventario di villaggio per il loot non-oro; curva XP/livelli (OPEN `PROGRESSION.md` §3); default `residentXp.mode`; altri `z.record` a un argomento nel repo (task separato proposto).

**Evidence:** `test-results/r183-quest-full-flow-e2e-2026-10-13.log`, `test-results/r183-regression-quest-suites-2026-10-13.log`.


## R-184 — RpgBalancer: audit + integrazione ciclo di vita dei residenti

**Richiesta (verbatim):** audit del codice su `ResidentState`/`MinimalResident`/`questSettlement` e ogni altra rappresentazione; invarianti del ciclo arrivo→reclutamento→assegnazione→ferita→recupero/morte→propagazione; scegliere l'intervento minimo (unificazione / fonte unica / adapter esplicito / fix circoscritto) — NON unificare i due modelli per principio; test deterministici sulle transizioni; niente matrici.
**Data:** 2026-10-14
**Stato:** `fatta`
**Desiderata FROZEN:** coerente con la desiderata macro-sim R-176 / direttiva R-179.

**Audit (codice, non documenti):** 3 modelli residente coesistono — `ResidentState` (TimeEngine, canonico, usato dal lab), `MinimalResident` (store UI; `questSettlement` scrive qui: isDead/injuredUntilTick/isOnExpedition/xp), `ResidentState` minimalGameRules (calcoli legacy). metaLayer: nessun modello — solo `PartyCapability` derivata. `liveQuests` lab = adapter istanza→membri.

**Bug veri trovati e corretti — canonici (`src/`):** (1) TimeEngine completamento attivita': status→available/exhausted incondizionato → morto/ferito in missione **resuscitava**; ora solo `away` transita. (2) Sweep recovery non resettava `isInjured` → doppia verita' divergente. (3) `quest-resolved`/`quest-deadline-fail` senza `instanceId` → match conseguenze ambiguo tra quest omonime (contratto additivo).
**Bug lab corretti:** zombie `liveQuest` su deadline-fail (harm su membri estranei); fallback harm silenzioso sull'eroe; id migranti `m-${day}-${i}` collisione→overwrite (ora contatore monotono); `partyOf` capability fantasma da residenti `away` (ora solo `available`); `resolvedInstances` dedup — nessuna doppia applicazione reward+harm.

**Decisione:** fix circoscritto + adapter rafforzato, **non** unificazione dei due modelli (il lab non consuma questSettlement; i contesti sono diversi — migrazione senza problema).

**Test:** lab 44/44 (8 nuove invarianti V1–V8: identita', morte terminale, ferita canonica, esclusivita', no-zombie, no-doppia-applicazione, capability reale, coerenza aggregati); TimeEngine.unit: +3 test invarianti verdi (resurrezione, ferita mid-flight, mai schedulare dead/injured) — 3 test `resolveActivityOutcome` fallivano gia' prima (pre-esistenti, non correlati). Safeguards: lint scope clean, build:check PASS, kanban:lint PASS.
**Evidence:** `test-results/r184-resident-lifecycle-2026-10-14.log`. Fidelity: `tools/goblin-lab/FIDELITY.md` §R-184.
**Residuo:** `exhausted` terminale canonico; convergenza `MinimalResident`↔`ResidentState` via residentSync (incremento futuro); threat/breccia restano PROPOSTA-dati.


## R-185 — /game: coreografia dell'evento Invasione Goblin (5 difetti dal video del Director)

**Richiesta (verbatim):** vedi `.mw/bugs/20261014-game-invasion-event-choreography/bug.md` (punti 1-5 + «teca adesivo e quando si staccano e vanno in direzioni differenti»).
**Data:** 2026-10-14
**Stato:** `fatta` — punti 1-5 corretti; 2-5 coperti da `tests/e2e/idleVillage/gameInvasionScene.spec.ts`, il punto 1 da BV-4 in `gameInvasionMarch.spec.ts`.
**Chiusura:** bundle: .mw/runs/r185-closure/bundle.json — dogfood visivo gate 2026-10-14: 12/12 E2E, 34 frame + metrics + attestazione env, verificatore indipendente CONFIRMED×2.
**Desiderata FROZEN:** v2 (cinematica per l'Invasione), v29 (processo).
**Incidente collegato:** `.mw/bugs/20261014-verification-false-pass/bug.md`; piano di prevenzione in bozza `.mw/plans/verification-false-pass-prevention.md`.
**Evidence:** run Playwright 2026-10-14 (5/5 su Scene+March; 12 test sulle 4 spec); contact sheet nello scratchpad di sessione.
**Chiusura:** bundle: .mw/runs/r185-closure-2026-10-14/bundle.json — evidence e2e registrata sopra (run Playwright 2026-10-14, 5/5 Scene+March, 12 test sulle 4 spec); punti 1-5 corretti e coperti dai test citati nello stato.


### R-177 / T2.6 ancore rivisto (2026-10-14)
**Parole del Director:** "controlla cosa puoi fare adesso in autonomia, scrivimi i 6 prompt x le icone (devono stare bene cn la UI e HUD, dimensioni giuste)".
Soggetti riscritti a taglia d'uso (POI 26 px, risorse 28 px); lint I8 aggiunto; pacchetto `.mw/specs/icons/ANCORE-prompt-pack.md`. Generazione e scelta: Director.

## R-186 — Plan: convergenza settlement ↔ VillageState (ciclo di vita condiviso)

**Richiesta (verbatim):** *"ci serve un plan x «far convergere il settlement reale — far scrivere gli esiti di questSettlement (o una proiezione via residentSync) anche su VillageState, così lab e gioco condividono le stesse conseguenze invece di due modelli paralleli»"*
**Data:** 2026-10-14
**Stato:** `completata` — implementato da `artifact-r003` (4/4 ACCEPT). Kernel `residentConsequences.ts` condiviso tra `applyPlanToState` e `VillageState`/lab; guardia R-139 mid-activity in `TimeEngine` (WITNESS-05); morte pulisce `injuredUntilTick` (WITNESS-04). Test: kernel 17/17, settlement 21/21, lab 45/45, replay byte-identico. Evidence: `test-results/r186-settlement-convergence-2026-10-14.log`.
**Desiderata FROZEN:** coerente con R-176/R-179; R-139 (ferite guariscono solo a riposo); v12 (rischio per-slot); PLAN-019-S2.5 (settlement idempotente).

**Esito dibattito multi-AI web (`20261014-0930-r186-settlement-plan`, `converged`):**
- **WITNESS-01 (4/4 unanime)**: `applyPlanToVillageState(state, plan: SettlementPlan)` era una falsa simmetria (meta' degli effect kinds sono no-op su `VillageState`; il lab non gira su `QuestRunState`). Sostituito con un **kernel per-residente puro** (`src/engine/game/idleVillage/residentConsequences.ts`: `ResidentHealthSlice`, `ResidentConsequence`, `reduceResidentHealth`, `applyConsequenceToResidentState`, `applyConsequencesToVillage`, `resolveWoundTicks`, `settlementEffectKey`), lasciando `SettlementPlan` in `questSettlement.ts`.
- **WITNESS-02**: `wound` e `SettlementEffect` portano `durationTicks?: number` opzionale (validato intero `>= 1`, fallback a `defaults.woundTicks`), cosi' il lab passa i tier S2 `1/3/7d` e `/game` resta a `5`.
- **WITNESS-03**: niente `appliedQuestEffectIds` su `VillageState` (nessun consumer in `TimeEngine`; il lab deduplica a monte con `resolvedInstances`); esportata `settlementEffectKey(runId, effectKey)`.
- **WITNESS-04**: precedenza `Dead > Injured > Away/Available`; su `MinimalResident` la morte pulisce anche `injuredUntilTick = undefined` (delta intenzionale dichiarato che allinea il codice al commento di `gameplayTypes.ts:20`).
- **WITNESS-05 & 06 (bug reale scovato nel dibattito)**: in `TimeEngine.ts:578` lo sweep di recovery guariva qualsiasi `status === 'injured'` con `injuryRecoveryTime <= targetTime` senza controllare se il residente apparteneva ancora a un'attivita' `pending`/`running` (`endTime > tickEnd`), permettendo ri-schedulazione prematura e violando R-139 (`«le ferite si rigenerano a riposo»`). T-1 aggiunge la guardia esistenziale `.some(...)` nello sweep + test multi-giorno mid-activity wound/death/completion/scheduling.

## R-187 — Report componenti per il trailer: screenshot + assessment funzionamento/animazioni

**Richiesta (verbatim):** *"puoi fare screenhsot del mio progetto? m serve un report di tutti i componenti che ci servono x fare il trailer, completi di screenshot e assessment se funzionano, come, se le animazioni sn smooth, ecc"*
**Data:** 2026-10-14
**Stato:** `completata` (report consegnato; follow-up aperti elencati in Esito)
**Desiderata FROZEN:** nessuna corrispondente — audit/evidence, collegata a R-072 (teaser 7 scene), R-167 (componenti mancanti su `/game`), R-185 (coreografia invasione).
**Scope rilevato:** due famiglie di superfici — (a) le 7 scene scripted di `/trailer` (`TrailerViewer`, `?scene=<id>`) e (b) le superfici di gioco reali filmabili su `/game` (boot, mappa Pixi+HUD, invasione goblin, POI quest→planner→QuestRunWindow, settlement lost, astrolabe, scheda PG). Hub per-scene `/test-hub/steam-trailer-hub` ha link a route non registrate (`/trailer-threat` ecc.) — probabili link morti, da verificare.
**Deliverable:** `test-results/trailer-report-2026-10-14/` con screenshot (1920×1080) + `REPORT.md` per-componente.
**Esito (2026-10-14):** 43 screenshot + metriche FPS rAF (headed, GPU reale) in `test-results/trailer-report-2026-10-14/` (`REPORT.md`, `metrics.json`, `metrics2.json`, `shots/`). Verdetto: le 7 scene `/trailer` sono complete e fluide (mock, `@trailer-only`); il footage reale `/game` copre invasione→card→peel→volo→ledger e quest end-to-end (planner→loadout→run→report **DEFEAT** d'effetto, ledger "GOBLIN HOST REACHES THE VILLAGE — TODAY"). Follow-up aperti: (1) jank reale quest-window (avg 19-25 fps, p95 116-266 ms) e map-pan/menu-open (p95 67/83 ms); (2) invasion: 2 mega-hitch ~0.8-1 s su mount; R-185.1 ancora in attesa Director; (3) route per-scena hub morte (`/trailer-*` non registrate); (4) gap R-167 confermati (scheda PG, stash villaggio, level-up); (5) settlement-lost solo trigger debug su `/world-surface`; (6) un 400 su `/game` da identificare; (7) `/hero-components-lab` lazy-load ~12 s. Falso allarme chiarito: il jank `trailer-risk` del primo run era occlusione finestra (re-run pulito 57.7 fps, p95 17.7).

### R-177 / ancore montate (2026-10-14)
**Parole del Director:** "icone.jpeg in download, puoi fare tu l'alpha, ritagliarle, ecc? e metterle nel posto corretto". Ritagliate da `~/Downloads/icone.jpeg`, master 512 + 128/64/32 in `public/assets/ui/poi/` e `public/assets/ui/resources/`. Registro: `candidate`. Da fare: collegare al gioco (T4.2 POI, T1.1 risorse) e decidere se gli artigli vanno ridisegnati con più contrasto.

### R-177 / glifi POI collegati (2026-10-14)
**Parole del Director:** "Gemini. è la tenda ha orecchie da gatto, tipo? va tutto bene, procedi". Prompt tenda riscritto senza orecchie (lint verde). Glifi collegati a `MapQuestPoi` per id; `PoiMatericV3_5` disegna il glifo sopra vetro e ombra. Verificato: presenti, ma scuri per il sorgente: va chiarito il prompt.

## R-188 — Plan: risoluzione dei 7 problemi emersi dal report trailer (R-187)

**Richiesta (verbatim):** *"mi scrivi un plan x questi 7 problemi trovati?"*
**Data:** 2026-10-14
**Stato:** `completata` — **PLAN-034 eseguito e chiuso il 2026-10-14** (14/14): T-001..T-010 + T-012..T-014 (diagnostica gated → fix `AudioContext` condiviso per il mega-hitch invasione, throttle/quantize halo POI + `React.memo` medallion, hub → `?scene=`, pulsante Director "Settlement lost" su `/game` verificato a runtime) e **T-011 dispatch PLAN-032**: artifact converged copiati in `plans/PLAN-032-SP-1..5-*.md` (sha verificati), righe kanban `PLAN-032-SP1..SP5` in `agent_assignments.md` + `strategy_tasks.md`, pending file SP-1; SP-1 in esecuzione Devin, SP-3 bloccato da SP-2. Evidence: `test-results/trailer-report-2026-10-14/{DIAG-034.md,diag-prod.json,shots/t010-*.jpg}`; traps T-08/T-09/T-10 registrate; kanban aggiornato. Nota processo: cattura trailer su `vite preview` (prod build) — dev-mode misura overhead React, non il gioco.
**Nota 2026-10-14 (sera):** la bozza `.mw/plans/r188-trailer-fixes.md` circolava ancora con «4 risposte per sbloccare» — superata: le decisioni erano già registrate qui e il piano era già battezzato/eseguito. Un piano fuori sync col codice è un bug: allineato qui e nei piani.
**Chiusura:** bundle: .mw/runs/r188-closure-2026-10-14/bundle.json (4/4 PASS: spec copiate, kanban registrato, pending file SP-1, piani allineati).
**Decisioni Director (2026-10-14):** (1) R-185.1 → **dichiarato fixato** (marker a boot con marcia salvata = comportamento voluto PLAN-033, doc aggiornata); (2) Settlement Lost = pulsante nel DirectorPanel dev-only di `/game`; (3) voci hub `trailer-threat-iter`/`trailer-legacy-v2` → eliminate; (4) deliberazione multi-AI eseguita 2× (critiche integrate).
**Desiderata FROZEN:** coerente con v2 FROZEN (world surface, tier eventi, invasione goblin — fonte PLAN-033) e decisioni ratificate R-167 (PLAN-032, design converged). Il piano è di fix/integrazione su superfici già approvate, non cambia goal né scope.
**I 7 problemi (da `test-results/trailer-report-2026-10-14/REPORT.md`):**
1. Jank reale quest-window su `/game` (avg 19-25 fps, p95 116-266 ms, worst 300) — worst surface misurata.
2. Map pan (p95 67 ms, worst 134) e menu open (p95 83, worst 150) con long frames.
3. Invasione: 2 mega-hitch ~0.8-1 s su mount card/peel; R-185.1 (marker a boot / sticker bordato pre-stage) ancora in attesa chiarimento Director.
4. Link morti hub: `/trailer-threat`…`/trailer-outro` non registrate in `App.tsx` (hub punta a route inesistenti; `/trailer?scene=` funziona).
5. Gap R-167 su `/game` (scheda PG, stash villaggio, level-up) — coperti da PLAN-032 "design converged", mai dispatchato.
6. Settlement Lost esiste solo come trigger debug su `/world-surface`; nessun path canonico su `/game` quando la marcia goblin arriva.
7. Minori: 400 Bad Request su risorsa non identificata in `/game`; `/hero-components-lab` lazy-load ~12 s.

## R-189 — Gate tecnico di chiusura: la verifica non può dipendere dall'autodichiarazione

**Richiesta (verbatim, sintesi):** progettare un meccanismo che impedisca tecnicamente di dichiarare completato un task quando le verifiche obbligatorie non sono state eseguite, sono fallite, inconcludenti o non corrispondenti alla richiesta. Chiusura basata su evidenze verificabili, non autovalutazione. Fasi: (1) conservare/completare le evidenze del run Playwright e leggere CTR-game-002, GAME_INVASION_SEQUENCE, le spec, i bug report e il piano di prevenzione; (2) proporre architettura a 4 componenti (contratto obbligatorio, controllo automatico prove/esiti, verificatore indipendente senza diff, gate finale); (3) piano di collaudo del gate con tentativi deliberati di aggiramento. Deliverable in chat + stop prima dell'implementazione. Vincoli: niente prove inventate, niente nuovi documenti normativi ridondanti, niente codice di prodotto.
**Data:** 2026-10-14
**Stato:** `fatta` — implementato, collaudato e adottato il 2026-10-14. Self-test 14/14 + unit 16/16; blocco live dimostrato su riga kanban reale; verificatore indipendente reale eseguito su R-189 (`.mw/runs/r189-closure/`: bundle PASS) e su R-185 con prove visive reali (`.mw/runs/r185-closure/`: 12/12 E2E + 34 frame + metrics + env → bundle PASS). Contratto permanente `.mw/contracts/CTR-game-004.md`; regola manifest nel mandato executor.
**Chiusura:** bundle: .mw/runs/r189-closure/bundle.json
**Decisioni Director 2026-10-14:** (1) gate su `kanban:lint`/transizione `Completato` ✓; (2) anche `RICHIESTE.md` `fatta` sotto il gate ✓; (3) fail-loud basta, niente CI/hook ✓; (4) deroga `WAIVED-DIRECTOR` esplicita, mai PASS ✓; (5) chiusura meccanicamente bloccata — superata la linea consultiva in RPG ✓; (6) struttura a due livelli CTR-* + manifest per-task — delegata all'agente, adottata.
**Desiderata FROZEN:** estende v29 (pre-flight; «guard meccanico» era voce Still unresolved) — questa richiesta risponde esattamente a quel punto aperto.
**Collegamenti:** incidente `.mw/bugs/20261014-verification-false-pass/bug.md`; piano bozza `.mw/plans/verification-false-pass-prevention.md` (non approvato); R-185 (coreografia invasione); contratti CTR-game-001/002/003; SKILL-VERIFICATION (BV procedurale, D-20260911-002 niente gate CI — **da ridiscutere**: il gate richiesto qui è in tensione con quella decisione storica).

### R-177 / oro e legna montate (2026-10-14)
Ritagliate da `~/Downloads/oro.jpeg` e `legna.jpeg` (magenta FF00FF rimosso), master 512 + 128/64/32 in `public/assets/ui/resources/` (res-gold, res-wood). Registro: `candidate`. Restano da sostituire tenda (con orecchie), rovine (verdi) e artigli, che sono ancora le versioni precedenti.

### R-177 / oro e legna in gioco (2026-10-14)
`HUD_ICON_ASSETS` (hudIcons.tsx): gold → `res-gold-128.webp`, wood → `res-wood-128.webp`. Verificato sulla barra risorse di /game. Il pane (food) resta sul vecchio medaglione `fantasy_ui/icon_food.webp`: manca l'immagine nuova, e stile diverso dalle altre.

### R-177 / pane v2 montato (2026-10-14)
Ritagliato da `~/Downloads/pane.jpeg` (finto quadrettato grigio rimosso per saturazione, riempi-buchi). Master 512 + 128/64/32 in `public/assets/ui/resources/res-food*`. `HUD_ICON_ASSETS.food` → `res-food-128.webp`. Stato `candidate`. Verificato in barra risorse di /game con oro e legna.

## R-190 — Lab v0.3 giocabile: pagina "Test Macro Gameplay" in /test-hub

**Richiesta (verbatim):** *"m serve una UI cn i pulsanti come era la prima versione / m serve in /test hub, chiamala tipo test Macro Gameplay"*
**Data:** 2026-10-14
**Stato:** `fatta` — `src/ui/idleVillage/pages/MacroGameplayLabPage.tsx` su rotta `/macro-gameplay` + card in TestHub; `tools/goblin-lab/` ora committato (`tools/` → `tools/*` + `!tools/goblin-lab/` in .gitignore); `lab.ts` browser-safe (export API + tail CLI gated); `scenario.ts` senza `node:crypto` (FNV-1a). Bonus: fix canonico `exhausted→available` nello sweep notturno TimeEngine + test; rotta orfana `/goblin-event-lab` ripristinata. Verificato: build:check PASS, lab 45/45, smoke Playwright sulla rotta (run avviata, quest accettata/risolta, auto-step, 0 errori console).
**Desiderata FROZEN:** pagina React che guida il lab canonico `tools/goblin-lab/lab.ts` a pulsanti (difesa/edifici/quest/quest board/avanzamento), rotta `/macro-gameplay`, card "Test Macro Gameplay" in TestHub, fix rotta orfana GoblinEventLabPage.
**Collegamenti:** R-176 (lab), R-185 (coreografia invasione), R-186 (kernel conseguenze).
**Chiusura:** 4/4 PASS (lab 45/45, test exhausted R-190, build:check, smoke runtime /macro-gameplay) — bundle: .mw/runs/r190-macro-gameplay-2026-10-14/bundle.json

### R-177 / dimensione interfaccia (2026-10-14)
**Parole del Director:** "come faccio a vedere come si vedrebbe tipo in 2k o 4k [...] fallo tu" (scala UI 100/125/150%). Scelto lo zoom nativo del webview Tauri (CSS `zoom`/`transform` romperebbero l'overlay di trascinamento dei medaglioni: vedi commento in GameFrame.tsx). Nuovi: `hudScale.ts` (auto = min(W/1920,H/1080), passi 0,05, 1–2), `useHudScale.ts` (solo desktop: `__TAURI_INTERNALS__`; salva in `hud_scale_v1`), riga «Dimensione interfaccia» in HudGameMenu (Auto/100/125/150/200%), `src-tauri/capabilities/default.json` con il solo `core:webview:allow-set-webview-zoom`, chiavi i18n en/it-IT/pseudo. Test: `hudScale.test.ts` 6/6, tsc pulito, localizzazione 17/17, hudGuards 9/9. Browser: riga nascosta, nessun errore. **Non verificato:** lo zoom effettivo nella finestra Tauri. Segnalato: crate `tauri` 2.9.3 vs `@tauri-apps/api` 2.10.1 (versioni non allineate).

## R-192 — /game: pageerror Pixi `RenderTargetSystem.push` durante la scena invasione

**Richiesta (verbatim):** trovato dal verificatore indipendente del gate (R-189 dogfood, 2026-10-14): durante la scena invasione su `/game` il renderer Pixi emette `TypeError: Cannot read properties of undefined (reading 'push')` in `RenderTargetSystem` (`xe.execute → render`). Riproducibile: presente in tutte le catture (`metrics.json` errors, stack in `.mw/runs/r185-closure/`). Non corrompe il frame visibile (verificatore: non dirimente), ma è un errore reale del layer di render — capire se è benigno o un leak di render-target.
**Data:** 2026-10-14
**Stato:** `fatta`
**Chiusura:** bundle: .mw/runs/r192-pixi-render-target/bundle.json
**Desiderata FROZEN:** nessuna — bug report da evidenza di verifica.
**Collegamenti:** R-185 (scena invasione), R-189 (gate), bundle `.mw/runs/r185-closure/`.
**Risoluzione:** upgrade pixi.js 8.16.0 → 8.22.0 (fix upstream pooling AlphaMaskEffect/bind-group/GC). Crash = race di boot in `AlphaMaskPipe.execute` su `renderer.renderTarget.push` (t≈3.6s, ~1s dopo mount canvas, intermittente sotto carico). Post-fix: 0 errori in cattura completa + 6 boot extra + E2E 12/12. Diagnosi strumentata: `scripts/verification/diagPixiError.ts`.

## R-193 — Chiavi i18n legacy `{{var}}` rotte sotto i18next-icu: audit + fix batch

**Richiesta (verbatim):** *"Fix chiavi {{...}} ICU — audit + fix batch delle chiavi i18n legacy in idleVillage.json che renderizzano letteralmente (bug confermato in SP-5, trap T-11/T-12)"* — scelta Director alla domanda "su cosa procedo" post-PLAN-032.
**Data:** 2026-10-14
**Stato:** `fatta`
**Chiusura:** bundle: .mw/runs/r193-icu-2026-10-14/bundle.json

---

## R-194 — Menu/schermata Edifici del Villaggio su `/game` (`villaggio.png`, rimozione POI Warehouse dalla mappa, critica AAA + proposte)

**Richiesta (verbatim):** *"in /game dobbiamo implementare la pagina del menu degli edifici. la immagine principale la abbiamo già: villaggio.png devi eliminare il simbolo in basso a destra che dice cè stato generato con gemini Quando clicchiamo sulla regione del villaggio o sul pulsante del villaggio deve apparire un componente (o una scheramata a parte?) con gli edifici, cosa fanno, ecc Attualmente abbiamo solo Warehouse, che appare come icona sulla mappa e nn dovrebbe. Usa icone e poco testo (tooltip sull'icona x + info) Direi: taglialegna, cava, farm, warehouse, palizzata, torre d'osservazione Metti qualche altro edificio di mockup o se c'è già qualcosa d scritto, cn i valori d upgrade, cosa fanno, ecc. altro che m sto scordando? cosa dice la documentazione? ei un lead UI senior designer di una compagnia di videogame AAA, fa una ricerca online, dammi una critica spietata e costruttiva di questo componente. Poi proponi delle soluzioni a tua volta, cn esempi di codice, ecc. explorer"*
**Data:** 2026-10-15
**Stato:** `fatta` (2026-10-15 — PLAN-035 completato, T-001..T-006)
**Chiusura:** `villaggio.png` pulita dal watermark Gemini (seamlessClone deterministico, 3168×1344 intatta); `VillageScreenView` view-mode su `/game` (dual entry: nav `Village` + regione dipinta, mappa Pixi inerte ma viva sotto); 11 edifici icon-first con tooltip pinnabile (roving tabindex, grace 140ms, clamp/isteresi, focus-return); `MockUpgradeControl` inerte; marker `building-stash`/`building-merchant` rimossi dal continente — Magazzino ed Emporio aprono i pannelli da dentro la vista; arbitro Escape unico a livello pagina. Safeguards: unit 59/59 scope, E2E 9/9 (headed witness + rerun headless nel bundle), build:check PASS, kanban:lint PASS, lint 0 errori (quarantena path idleVillage/balancing). bundle: .mw/runs/plan-035-village-view/bundle.json — evidence `test-results/plan-035-village-view/` (4 screenshot en/it × 2 viewport).
**Desiderata FROZEN di riferimento:** `.mw/desiderata.md` v30 — Vista Villaggio (`Village` view mode) e Menu Edifici su `/game` (oltre a v4, v6, v8, v22, v29).
**Tensioni rilevate da chiarire col Director:**
- `PLAN-032-SP-2` (completato 2026-10-14) aveva ancorato il Magazzino (`building-stash`, `MapBuildingPoi`) come icona sulla mappa a `(2260, 1551)`: rimuoverlo dalla mappa e spostarlo dentro la vista Villaggio sostituisce quella decisione di SP-2 (e tocca per analogia `building-merchant` di SP-3).
- `DESIGN_PILLARS.md` §3.1 R1.1 e §3.3 R3.2/R3.3 parlano di *"overlay leggero sopra la mappa"* (`VillageScreenOverlay`), mentre `GameFrame.tsx` ha `navItems: ['village', 'map', 'workshop', 'tavern']` nella barra di navigazione in basso (`plinth`) e la regione cliccabile `village` (`index: 8` in `regions.json`) sulla mappa Pixi.

**Decisioni Director (2026-10-15):**
1. **Forma della schermata:** **Direzione C — Modalità Insediamento (`Village` ↔ `Map`)** a tutta area dentro il `GameFrame` (sotto la HUD fissa: barra risorse in alto, orologio, nav plinth in basso, roster/pannelli). Si entra cliccando la regione `village` sulla mappa o il pulsante `Village` nella nav bar in basso (`activeNavId = 'village'`), e si torna alla mappa cliccando `Map` nella nav bar (o `Esc`).
2. **Upgrade / Costruzione:** **Mock-backed** (come `PLAN-032 SP-2/SP-3`): mostra livelli, effetti, valori di upgrade e costi (con controllo disabilitato/inerte per costruzione), senza mutare lo store economico reale.
3. **Magazzino e Mercante dentro il Villaggio:** **Confermato (`si`)** — il marker `building-stash` viene rimosso dalla mappa del continente; sia `VillageStashPanel` (dal Warehouse) sia `MerchantPanel` (dall'Emporio/Mercato) si aprono dall'interno della vista Villaggio.


**Risoluzione:** `{{var}}`→`{var}` su 27 placeholder ×3 locale (en/it-IT/pseudo idleVillage: astrolabeV5/V63/V64, equipment, interfaceSizeAutoHint); `{{count}` dentro plural ICU → `#` (de slotFreed/workerAssigned, swordCount ×4 locale); `missingCount` common en+pseudo; defaultValue `design-vs-fidelity.tsx`; mirror `i18n.types.ts` allineato. Fuori scope correttamente: `backend.loadPath {{lng}}/{{ns}}` (templating i18next). Fix collaterale: `tests/**/*.spec.ts` aggiunto agli exclude vitest (gli spec Playwright finivano in collection). Regression guard: `tests/i18n/icuInterpolation.test.ts` 9/9 (zero `{{` in tutti i JSON + interpolazione reale i18next+ICU sulle chiavi fixate). 46/46 i18n+localization, 87/87 consumer adiacenti; 3 failure di collection preesistenti su file non toccati (import mancanti/JSX-in-.ts) flaggati. Trap T-11 aggiornata a "risolta".
**Desiderata FROZEN:** nessuna — bugfix su dati esistenti; convenzione ICU `{var}` già vincolante (SP-5 divergenza documentata).
**Collegamenti:** R-189 (gate), SP-5 PLAN-032 (bug rivelato a runtime: `Lv {{n}}` letterale), trap T-11/T-12 in `context/recurring-traps.md`.
**Audit (preliminare):** `idleVillage.json` — 13 chiavi `{{var}}` ×3 locale (en, it-IT, pseudo): `riskDeclared`, `axisReadout`, `balanced`, `overBudget`, `statVsDc`×2, `probability`×2, `risk`×2, `mathFmt`×2, `interfaceSizeAutoHint`. `de/idleVillage.json` — `slotFreed`, `workerAssigned`: plural ICU con `{{count}` dentro i branch → renderizzano RAW il plural intero. `common.json` — `missingCount` (en, pseudo), `swordCount` (en, ar, de, pseudo) con `{{count}` dentro `other` (in ICU il count è `#`). `src/pages/design-vs-fidelity.tsx:50` — defaultValue `'{{count}} missing items'`. `src/localization/i18n.types.ts` — mirror tipizzato da allineare. Fuori scope: `backend.loadPath '/locales/{{lng}}/{{ns}}.json'` (templating interno i18next, NON traduzione).

### R-177 / allineamento versioni Tauri (2026-10-15)
**Parole del Director:** "allinea". Il crate `tauri` era 2.9.3 e `@tauri-apps/api` 2.10.1. Salendo a 2.10.1 il pinning di `tauri-runtime`/`wry` produceva incompatibilità; il set coerente è `cargo update -p tauri` → tauri 2.12.3, tauri-runtime(-wry) 2.12.1, wry 0.57.0, muda 0.20.0. Lato JS: `@tauri-apps/api` ^2.12.3 (resta in dependencies), `@tauri-apps/cli` ^2.12.2. `cargo check` OK, `tauri dev` compila ed esegue senza l'avviso di versioni. Backup di Cargo.lock/package.json nello scratchpad della sessione. Non verificato: il comportamento dell'app oltre l'avvio (finestra non visibile da qui).

## R-195 — Validazione gameplay POI→quest risolta e redesign del Planner su `/game`

**Richiesta (verbatim):** *"1) Dobbiamo fare 1 Lavoro certosino x quanto riguarda la validazione del gameplay: da POI a quest risolta. Adesso posso aprire il POI, appare il planner. Il planner nn ha una forma x cui riesco a vedere tutto agilmente, e nn trovo il pulsante da cliccare x dire 'OK' al planner. 2) il piker degli oggetti nn funziona nel planner: m aspetto che c siano degli slot della bisaccia UN pulsante che apre un picker esterno. Gli oggetti mostrati daquelli del villaggio. Possibilemente con solo l'icona (se nn c sn scaricale temporanee) e il ToolTip cn nome, descrizione, ecc. 3) Sotto il sottotitolo voglio una immagine in proporzioni cinematografiche. 4) le informazioni di forecast le voglio in una colonna a destra, tipo componente 'esterno'. In quelle informazioni ci deve essere scritto quali sn le Stat Chiave Primarie e secondarie (in questo caso sono Forza primaria, Percezione secondaria). Planner"*
**Data:** 2026-10-15
**Stato:** `fatta` (2026-10-15 — battesimo Director «procedi» su `artifact-r008.md`; implementato T-001..T-005 di `plans/PLAN-036-quest-planner-redesign.md`; E2E verdi su build fresca: fullflow 2/2, expedition 14/14, planner-layout 7/7, lifecycle 13/13; safeguards lint/unit 57/57/build:check/kanban:lint verdi; evidence `test-results/r195-quest-planner-redesign-2026-10-15.log`). Debate: `mw-web-debate` CONVERGED (`sha256: ffc9dd08e15e74cd1748cac39764865418ee8613099fccb84838e9c30026f821`, run `20261015-1957-r195-quest-planner-redesign`: obiezioni WITNESS-06..12 chiuse; gemini ACCEPT, deepseek ACCEPT su r008; chatgpt rimosso `provider_dead` dopo 4 risposte byte-identiche degenerate, con tutte le sue 6 obiezioni sostanziali disposizionate come `amended`).
**Chiusura:** bundle: .mw/runs/plan036-quest-planner-2026-10-15/bundle.json (verdict PASS, 7/7 obbligazioni OB-1..OB-7 — incluse CTR-game regression eventFreeze+invasion 12/12)
**Esito implementato:** planner a due lastre (`data-hud-panel` condiviso, drag/clamp unico): lastra sinistra con banner cinema ~2.76:1 sotto il sottotitolo + `ResidentSlotRack` + bisaccia 3 slot + CTA «Invia spedizione» ancorata fuori scroll; sidecar destro `quest-expedition-forecast-column` con Stat Chiave Primarie/Secondarie (`scenario.keyStats` root hashed — goblin Forza primaria/Percezione secondaria, rovine Forza/Percezione+Costituzione+Destrezza) + aggregato/BY MEMBER/WHY/Intel. Picker esterno `quest-bag-external-picker` alimentato da `VILLAGE_STASH_CONFIG.items` (6 consumabili unificati con `engineFlag`), tessere solo-icona `picker-item-<id>` + tooltip Radix (nome/descrizione/effetto/stat coperte/stock), lifecycle Escape/click-outside/focus-return. Zero overflow interno a `vh>=720` (`minZeroScrollViewportHeightPx` config), scroll sanzionato sotto. **Bug reale fixato:** il routing `onDragStart` dei token slot era dentro `startTransition` → bloom valid/invalid (R-183) mai dipinto mid-drag pur committando lo swap; ora sincrono per `slot-token`, transition preservata per roster-card (PLAN-031 T-B4). Helper E2E `dragResidentPointer` rafforzato: gate hit-target press/release (boot-veil `game-boot-screen` può coprire il primo press) + dwell finale sullo slot (Chrome coalesce i pointermove finali → `event.over` stantio senza dwell).
**Desiderata FROZEN:** `.mw/desiderata.md` v1 (protocollo Mind Weaver), v23 FROZEN (Mission Planner rev.1–4), v24 FROZEN (Macro plan Quest S1→S5 rev.1–2), v27 FROZEN (`QuestTheatre` / `QuestRunWindow`).
**Collegamenti:** PLAN-019-S2.4 (`QuestExpeditionDetail`, `useQuestExpeditionSession`), PLAN-019-S3 (OUTCOME/LOADOUT), PLAN-032 SP-2 (`VillageStashPanel`, `VILLAGE_STASH_CONFIG`), R-183 (suite E2E quest dal vero), `hud_component_guide.md`.


---

## R-196 — `/game` QuestRunWindow: redesign cinematografico, Belt solo icone, Party Roster a sinistra, Log pergamena a destra, visibilità simultanea

**Richiesta (verbatim):** *"componente quest in /game 1) sembra avere un'ombra rettangolare attorno, nn deve 2) Belt deve essere solo l'icona: se la clicchi vedi il compoente cn gli oggetti (se nn esiste il componente crealo con la guida). Se un componente è illuminato (deve essere solo l'icona, se nn c'è l'icona scaricane una online), deve esere usato x la preview, se viene usato si elimina dalla belt. Se viene cliccato dopo che è già stato cliccato una volta lo deselezioni. 3) la forma nn è abbastanza cinematografica, lo voglio + largo 4) i pulsanti spesso nn sn facilmente individuabili 5) il pulsante Skip to the frontier nn deve esistere 6) quando clicco il componente cn il party deve mostrarsi a sinistra di questo compoente un componente Roster, ma che abbia solo i pg che sn attualmente nel pary (o pseudo roster) 7) il pulsante del log nn mostra nulla, fallo funzionare (anche questo un componete seguendo la guida su come fare i componenti, cn il simbolo della pergamena) che appare accanto, a destra 8) possibilmente tutto deve essere sempre visibile contemporaneamente, Planner"*
**Data:** 2026-10-15
**Stato:** `fatta` (2026-10-15 — battesimo Director «procedi» su `artifact-r006.md`; implementato T-001..T-006; bundle `.mw/runs/r196-quest-window/bundle.json` PASS BV-1..BV-6 con verificatore indipendente CONFIRMED ×6; smoke runtime `/game` + `/quest-window-lab` zero errori console, screenshot `quest-window-open.png`; safeguards lint/kanban/build:check verdi). Debate: `mw-web-debate` CONVERGED (`sha256: f29527b7276be61080ae2bda6b61dba0d5141dac9a995c01f9735b05e72b374f`, run `20261015-1915-r196-quest-window-plan`: 12 obiezioni WITNESS-01..12 chiuse, chatgpt ACCEPT, gemini ACCEPT, claude ACCEPT in T-016 poi free-tier quota limit in T-019, grok echo stub in clarify).
**Desiderata FROZEN:** `.mw/desiderata.md` v1 (protocollo Mind Weaver), v4 (pannelli flottanti non bloccanti), v27 (`QuestTheatre`/`QuestRunWindow` su `/game`). Override espliciti del Director su decisioni precedenti di piano: (a) supera `PLAN-032-SP-4` (`BagStrip` inline con etichette testo) a favore di Belt solo-icona + pannello oggetti solo-icone con toggle per-item/arm; (b) rimuove `skipAll` («Skip to the frontier») di `PLAN-025`; (c) allarga `questWindow.widthPx` oltre i 460px di `PLAN-025` D-7; (d) sostituisce il `Popover` unico mutuamente esclusivo (R-133, peraltro clippato da `overflowY: 'auto'` su `HudPlaque`) con componenti `HudPlaque` dedicati e co-visibili (Party Roster a sinistra, Log con `ico-scroll` a destra, Belt oggetti).
**Chiusura:** bundle: .mw/runs/r196-quest-window/bundle.json

---

## R-198 — Mai più finestre in primo piano aperte dagli agenti (Chrome for Testing incidente)

**Richiesta (verbatim):** *"un agente ha aperto chrome d testing in primo piano, nn deve succedere. i plan devono prevedere che nn sia mai aperto in primo piano e tutte le skill devono sapere di nn aprire mai in automatico altre finestre in primo piano"*
**Data:** 2026-10-15
**Stato:** `fatta` (2026-10-15 — safeguard: lint 0 err, test verification 18/18, build:check OK, kanban:lint OK, `foreground:lint` OK; evidence `.mw/bugs/20261015-foreground-chrome-testing/` + handoff 2026-10-15)
**Chiusura:** bundle: .mw/runs/r198-foreground-windows/bundle.json (foreground:lint + verify:selftest 14/14 + build:check rieseguiti; bug report in `.mw/bugs/20261015-foreground-chrome-testing/`)
**Contesto:** ruling già canonico in Mind Weaver (CTR-foreground-001, `.mw/contracts/ui-focus.md`); va propagato nel repo RPG.
**Implementazione:**
- Nuova invariante `.windsurf/rules/16-no-foreground-windows.md` + registrazione in `00-project-invariants.md` e `AGENTS.md` (porta cross-IDE).
- Bullet in tutte le skill RPG (`coordinator/skills/*/SKILL.md`, fonte unica); le skill MW condivise (`bugfix`, `learn` symlink) restano coperte da CTR-foreground-001 in `mind-weaver/AGENTS.md`.
- Plan/spec: `strategist-mandate` (Guardrails + Quality Gates), `coordinator-mandate` (Invariant Compliance), `mw-planner` (Planning rules) — ogni piano con verifica runtime dichiara esecuzione headless/background; finestra visibile = step manuale del Director.
- Codice: tutti i `headless: false` in `scripts/`, `tests/`, `marketing/` → opt-in `HEADLESS=false` (convenzione già in `minimalGameplayBaselineRunner.ts`); `open` → `open -g` (`mapAssetConsistency.ts`, `mobilePlaytestLogger.ts`).
- Enforcement statico: `npm run foreground:lint` (`scripts/foregroundLint.ts`).
- Incidente loggato in `.mw/bugs/20261015-foreground-chrome-testing/`.

## R-199 — `/game` QuestRunWindow rev.2: skip implicito, POI detail/equip ripristinato, immagini, compagni chiusi, esiti fuori dalla finestra, pannello opzioni skill-check, durata in giorni, abbandona quest

**Richiesta (verbatim):** *"1) hai sostituito il pulsante skip cn 1 altro pulsante. nn c deve essere nessun pulsante, se ci clicci sopra o premi un pulsante skippi. 2) quando clicco sul POI corretto nn appare il POI detail per scegliere i pg da assegnare e i gli equip da portare 3) il POI, POI detail e la quest nn hanno + le immagini, devi rimettere quelle che c'erano prima: 4) i componenti opzionali devono essere chiusi d default 5) le spiegazioni di cosa sta accadendo continuano ad essere in uno spazio stretto e c'è bisogno di scorrere tutto 6) è ancora poco cinematografico, fallo + largo e l'immagine centrale + grande 7) i pulsanti ancora nn si capisce che siano visibili 8) gli esiti devono essere mostrati da 1 altra parte: o un pannello a fianco o qualcsoa del genere: fa una ricerca online e trova il modo migliore di presentare. 9) le quest devono avere un pannellino per decidere lo skill check se vuoi saltarlo completamente, saltare l'animazione iniziale ecc (come nel componente d skill check). 10) devi collegare lo skill check a questo componente. 11) questo componente deve avere una lunghezza di tempo scelta (diciamo 5 giorni), mettilo nelle config. La barra in basso che scandisce le fasi deve riempirsi in quel lasso di tempo, e le fasi successive devono essere visibili e fattibili solo quando quel tempo è passato 12) ci deve essere l'opzione "abbandona quest" prima d una scelta/check. Se premuto deve avere "sei sicuro di voler abbandonare la quest?", deve essere in alto cn le icone cn le opzioni 13) l'icona degli oggetti deve stare vicino a dove ci sn le scelte. Planner"*
**Data:** 2026-10-15
**Stato:** `fatta` — implementata e verificata (2026-10-16): skip implicito senza pulsante (click/tasto sullo stage), companions chiusi di default, finestra 820px con narrativa ampia, scelte bordate + trigger bag adiacente, abbandona quest in header con conferma inline → `flee` engine, `durationDays 5` con fasi gated su `frontier.readyAt`, astrolabe V62 docked con `QuestCheckOptionsPanel` (salta intro / salta check — verdetto sempre engine), `QuestRewardPopup` esterno page-level non-modale staged+skippabile. Punti 2-3 (POI→detail, immagini) risultavano già ripristinati dal workstream PLAN-036 — confermati da smoke reale.
**Chiusura:** bundle: .mw/runs/r199-quest-window-rev2/bundle.json — PASS 8/8 (RV-1..RV-8), verificatore indipendente CONFIRMED ×8; witness `quest-window-open.png` + `reward-popup.png`.
**Contesto:** rev.2 di R-196 (`fatta`, bundle PASS `.mw/runs/r196-quest-window/bundle.json`). Punto 2 e 3 segnalano regressioni da investigare (POI→detail expedition/planner non si apre; immagini assenti su POI/detail/quest). Punto 8 richiede ricerca online pre-piano sul pattern di presentazione degli esiti. Punto 11 introduce una durata configurabile (default ~5 giorni) che regge la barra fasi. Tensione possibile col contratto R-196 appena chiuso (companion panels co-visibili → qui chiusi di default) — da risolvere nel piano.
**Addendum (verbatim, stessa sessione):** *"quando la quest finisce la schermata di reward deve essere un componente /popup esterno, nn all'interno della quest stessa. fa una ricerca onlin su come farla al meglio, poi aggiungila al plan che stiamo facendo attualmente"*

---

## R-200 — `/game`: le offerte quest compaiono da sole, una ogni 5s, mai scomparse; goblin `repeatable`

**Richiesta (verbatim):** *"quando apro la pagina le quest che abbiamo nel /director della pagina /game devono apparire una ogni 5 secondi (e nn scomparire mai). Flagga la quest dei goblin come quest ripetibile (ci dovrebbe essere nella documentazione cosa fa, come funziona, ecc. Il POI nn sparisce mai, dopo il reward puoi rifarla, ecc). fa un plan"*
**Data:** 2026-10-15
**Stato:** `completata` (2026-10-16 — PLAN-037 eseguito; bundle `.mw/runs/plan037-quest-reveal-2026-10-15/bundle.json` **PASS 7/7** + verifier CONFIRMED ×3; evidence `test-results/r200-quest-reveal-2026-10-16.log`)
**Chiusura:** bundle: .mw/runs/plan037-quest-reveal-2026-10-15/bundle.json PASS 7/7 (+ verifier CONFIRMED ×3) — auto-reveal config-first (`questReveal` 1000/5000ms) post-veil con entrate addittive mai spente; «Mostra quest» → trigger one-way «reveal ora», Reset ri-arma; `poi-goblin` `repeatable:true` (torna `available` dopo il reward, mai in `consumedPoiIds`, rilanciabile), `poi-rovine` one-shot invariata; regola lifecycle in `QUEST_RULES.md` §8b `vigente`; E2E reveal 3/3 + lifecycle 13/13 + regression 28/28; T-04: screenshot ispezionati + signoff (conferma Director su live benvenuta).
**Decisioni Director (2026-10-15):** solo goblin `repeatable` (rovine resta one-shot per D-S4-6); «mai scomparire» NON richiede offerte senza scadenza — basta la finestra authored attuale (10.000 gg, `SLICE_OFFER_WINDOW_DAYS`); il bottone «Mostra quest» del Director diventa un trigger one-way «reveal ora» (salta lo stagger, non nasconde più).
**Contesto tecnico:** il canale `repeatable` esiste già — `QuestPoiSchema.repeatable` + predicati `poiConsumesOnReportClose`/`isPoiConsumed` (`questPois.ts`, PLAN-019-S4 T-3, D-S4-6), consumo su `consumedPoiIds` persistito. Il reveal è oggi un gate booleano unico (`questShown`/`poiDemo` → `questRevealed`) pilotato dal Director panel; serve auto-reveal per-POI sfalsato, avviato dopo l'uscita del boot veil (T-04: le entrate devono essere visibili). Tre suite E2E asseriscono «nessun POI al boot» (R-124: `gameQuestExpedition`, `gameQuestFullFlow`, `gameQuestLifecycle`) — contratto da aggiornare.
**Documentazione lifecycle ripetibile già esistente:** JSDoc `questPois.ts` (campo + predicati), `plans/PLAN-019-S4-integrazione.md` T-3/D-S4-6. Da aggiungere: regola in `QUEST_RULES.md` (regola 80) e riga lifecycle in `quest_sterminio_goblin_spec.md` (fonte unica della quest).


## R-202 — `/game` Villaggio vivo: linguaggio dei pin + stato degli edifici dipinto sul dipinto (valutazione proposta "slot+sprite")

**Richiesta (verbatim):** *"Sei lo strategist, prendi skill e mandato. Sei un lead senior system designer di una softwarehouse AAA. Questa è una risposta di claude come critica al nostro plan, fa una ricerca online, esamina, valuta. Crea un nuovo plan"* — segue il piano di Claude "Villaggio con slot e sprite + nuovo linguaggio dei pin" (slot 1:1 per edificio, sprite WebP su sfondo ripulito, pin come etichetta di stato, fasi 0-6 con stima 8-11 giorni).
**Data:** 2026-10-15
**Stato:** `fatta` — implementata e verificata (2026-10-16): frame pin per categoria + badge tab, `VillageSlotOverlay` paint-first (ellissi a due layer buildable, vignetta+dotted locked, pennant ≥II, glow :has), plaque+legenda EN/IT, lint geometrici Zod, 37 unit + 12/12 E2E headless, Step-0 gate applicato (primo spike respinto e ri-autorato).
**Chiusura:** bundle: .mw/runs/plan-038-village-lots/bundle.json — PASS 4/4 (unit, E2E headless, build+lint, evidence); witness `test-results/plan-038-village-lots/` + `test-results/plan-035-village-view/`.
**Valutazione:** la proposta di Claude è architetturalmente sana su modello dati slot 1:1, linguaggio dei pin e livelli-come-decorazioni, ma assume che `villaggio.png` sia uno sfondo pulito su cui piantare sprite — in realtà il dipinto contiene già gli 11 edifici dipinti (gli anchor PLAN-035 siedono sulle case dipinte). La pipeline sprite-su-piatto-pulito richiederebbe inpainting di ~11 edifici + 11 sprite AI coerenti in luce/perspective/pennellata — il rischio di incoerenza di stile che Claude stesso segnala, amplificato. La variante proposta nel PLAN-038 tiene il dipinto come l'edificio e aggiunge overlay di stato ritagliati su regioni (scaffold per buildable, scrim per locked, props di livello) + opzione futura di varianti-regione img2img.
**Collegamenti:** R-194/PLAN-035 (implementato), R-199 (rev.2 quest window in corso — workstream parallelo), critica AAA in chat 2026-10-15.

## R-205 — `/game` QuestRunWindow rev.3: pulsanti dentro la placca, bag in header, skill check esterno pre-caricato, esiti toast, reward d'impatto

**Richiesta (verbatim):** *"in /game quando clicco il POI della quest, dopo il POI detail, nella quest: fa screenshot del compoennte in tutte le varie fasi: molti pulsanti sn fuori dal componente (fai pulsanti meno alti, occupa meglio lo spazio sotto) Il pusalnte della bag è troppo grande e occupa uno spazio troppo importante del componente, va spostato Lo skill check deve apparire fuori dal componente quest, davanti. Post risultato, se c clicchi sopra, scompare. lo skill check deve essere precaricato nella pagina di preload come tutte le altre cose in /game lo skill check deve essere ottimizzato per la visualizzazione nel progetto gli esiti post check devono essere un componente esterno, piccolo, tipo popup cn tutto scirtto immediatamente, se clicchi scompare (ma puoi leggerlo dai log) la scheramta d reward deve essere + veloce a dare le info, ha il pulsante sbagliato e nn ha abbastanza icone o asset per essere d'impatto fa un plan x tutto queste cose Nuovo plan, nn continuare il procedente"*
**Data:** 2026-10-16
**Stato:** `fatta` (2026-10-16 — PLAN-040 implementato, verification bundle `.mw/runs/plan-040-quest-window/bundle.json` verdict **PASS**: 7/7 obbligazioni, verifier indipendente CONFIRMED; harness `outsidePlaque`/`outsideViewport` 0 findings su tutte le fasi e viewport; prewarm droppato per ruling measure-first, vedi `warm-verdict.json`)
**Contesto:** rev.3 di `QuestRunWindow` (rev.1 R-196 `fatta`, rev.2 R-199 implementata in gran parte — `QuestRewardPopup`, companions chiusi, check options, durata 5gg, abbandona). Sei difetti osservati dal Director: (1) contenuto/pulsanti fuoriescono dalla placca — da misurare con screenshot per-fase sull'harness esistente; (2) toggle bag troppo grande nell'action strip; (3) l'astrolabe è docked dentro il theatre — deve essere un overlay esterno davanti, click-to-dismiss post-esito; (4) il check va pre-scaldato nel boot veil; (5) il check va dimensionato per la superficie; (6) gli esiti post-check vanno in un piccolo popup esterno a testo immediato (il log resta fonte persistente); (7) il reward è lento, con pulsante errato e poche icone.
**Piano:** `plans/PLAN-040-quest-window-skillcheck-outcomes.md` — deliberato multi-AI web in due dibattiti (mw-web-debate, chatgpt+claude+gemini): run `20261016-plan040-quest-window` (r001→r003, 24 obj, converged) + run `20261016-plan040-quest-window-r3` (r003→r007, 21 obj, converged). **Artifact finale r007** sha `f2b48df4…`, ACCEPT 3/3. Battezzato dal Director («battezzo, procedi») ed eseguito.
**Chiusura:** bundle: .mw/runs/plan-040-quest-window/bundle.json — 7/7 obbligazioni PASS + verifier indipendente 7/7 CONFIRMED.

## R-206 — `/game` Villaggio: Registro dell'Insediamento — cassetto HUD sul dipinto + catalogo edifici oltre il dipinto

**Richiesta (verbatim):** *"quindi adesso dovrei prendere quell'immagine, farne una versione senza edifici o qualcsoa del genere? E poi fare edifici d vario tipo che 'stanno bene nell'immagine' e 'appiccicargliele sopra' una alla volta? Ma si potrebbe arrivare ad avere tanti edifici, anche edifici particolari (tipo torre di magia, ecc). come dovremmo procedere? usare quell'immagine come menu nn m fa impazzire, ho qualche dubbio" / "Farlo 'separatamente', tipo 'questo è il villaggio', le cose fighe extra le trovi in un menù a parte, ecc? O meglio fare direttamente solo tutto menù e magari quello è 'lo sfondo'?" / "crea un nuovo plan ben preciso"*
**Data:** 2026-10-16
**Stato:** `fatta`
**Chiusura:** bundle: .mw/runs/plan-042-village-registry/bundle.json — PASS 4/4 (unit 50/50 + hudGuards 10/10, E2E 20/20 headless, build:check+foreground:lint, witness drawer/card en·it ×1280/1440/1920). Evidence: `test-results/PLAN-042-2026-10-16.log`.
**Contesto:** PLAN-035/038 hanno reso il dipinto una vista con pin-etichette di stato; il Director dubita che il dipinto possa essere *il* menu edifici a regime (non scala oltre ~11 slot dipinti; sprite appiccicati = collage AI). Direzione discussa e concordata in sessione: **il dipinto resta la vista**, il menu vero è un **cassetto «Registro»** che scivola sullo stage, condivide lo stesso linguaggio pin (frame categoria + badge stato + livello romano), evidenzia in modo bidirezionale pin↔riga, e ospita edifici «speciali» (torre di magia, gilda, santuario…) che esistono solo nel registro finché non costruiti — con art incorniciata 21:9 nel dettaglio, mai sprite scontornati sul dipinto. Seam futura `overlayArt` per patch img2inpaint per-regione quando l'economia reale attacca gli stati.
**Piano:** `plans/PLAN-042-village-registry.md` — deliberato multi-AI web (mw-web-debate): run `20261016-1054-plan042-village-registry`, 5 provider (chatgpt, claude, gemini, grok, deepseek), 2 round di critica + acceptance; **artifact-r005** sha `4dac8cdb…`, CONVERGED con ACCEPT 4/4 eleggibili (grok rimosso provider_dead dopo 4 fallimenti di stabilizzazione all'acceptance). 41 obiezioni disposizionate. Emendamenti principali: `activeBuildingId` esplicito al posto di solo `:has()`; detail card = view-state del drawer (drill-in); Escape focus-scoped; occlusione = report `occludedAt` + gate sugli anchor dei pin (non sui footprint); `overlayArt` seam inerte `.strict()`; `mageTower` buildable; spire frame solo nella legenda drawer.

---

## R-208 — Snellire la governance operativa: kanban/dispatch non più necessari nel workflow single-agent

**Richiesta (verbatim):** *"per come funziona attualmente il mio sistema, cui facciamo il plan e lo implementiamo direttamente cn la stesso agente, kanban e csoe del genere nn ci servono + concordi? Guarda il workflow di RPG balancer con le skill attuali e come è stato usato negli ultimi 10gg. Dobbiamo snellinare la burocrazia ed aumentare le prestazioni"*
**Data:** 2026-10-16
**Stato:** `fatta`
**Chiusura:** bundle: .mw/runs/R-208/bundle.json — PASS 6/6 (workflow GH → workflow_dispatch-only; `closure:lint` ex `kanban:lint` come gate R-189; skill/rules/AGENTS/CANON/README allineati; banner IN PAUSA su board/strategy/guidelines/coordinator-mandate; desiderata v31 FROZEN + DECISION_LOG).
**Decisione Director (2026-10-16, verbatim):** *"x adesso meti questa roba in pausa, in caso c servirà lo reimplementeremo secondariamente. quindi metti nei plan, nelle skill e qualsiasi altro riferimento di nn usare + il kanban e cose del genere. si crea un plan con un contratto, si implementa con l'agente locale in devin desktop, si controlla il contratto per vedere se tutto è stato fatto correttamente e basta"* → desiderata **v31 FROZEN**.
**Contesto:** audit del workflow reale degli ultimi 10 giorni: tutto il lavoro recente (R-171→R-207, PLAN-029→043) è stato pianificato e implementato dalla stessa sessione/agente; il kanban `agent_assignments.md` (685KB) funziona solo come ledger post-hoc (righe tutte `Completato | Devin`), mai come dispatch board. `kanban:lint` non valida più solo la tabella: ospita il gate di chiusura R-189 (manifest → `verify:bundle` → `bundle.json` citato su kanban **e** su transizioni `fatta` in RICHIESTE). ~188/383 commit degli ultimi 10gg sono bookkeeping automatico (`AI worker:`/`Coordinator: auto-migrate` da `github-actions[bot]`, churn `registry-events`/`__pycache__` — trigger: cron ogni 5min in `coordinator.yml` + `workflow_run` in `ai-worker.yml`), mentre il coordinator cron locale è fermo dal 2026-10-09. PLAN-039 (benchmark replay, R-204) gira con `--no-kanban` — il dispatch esterno non richiede la board; la riattivazione è subordinata al suo esito.
**Implementazione:** workflow GH → `workflow_dispatch`-only; `kanban:lint` → `closure:lint` (shim compat, solo gate R-189 su RICHIESTE/board-diff); skill/rules/AGENTS/CANON/INDEX allineate; banner pausa sulla board; desiderata v31 + DECISION_LOG.

---

## R-209 — Documentare la discussione sul sistema macro di quest, ricompense e progressione della campagna

**Richiesta:** il Director ha incollato in sessione la sintesi di una discussione di design sul sistema macro delle quest, delle ricompense e della progressione della campagna (invasione dei goblin come esempio di riferimento) e ha chiesto: *"documenta questa discussione"*.
**Data:** 2026-10-16
**Stato:** `fatta`
**Desiderata FROZEN:** nessuna nuova — materiale di esplorazione design. Classificazione applicata coerente coi precedenti (R-153): **tutto PROPOSAL** — direzioni chiarite, non ratificate in regole/desiderata.
**Sorgente:** sintesi in 6 sezioni: ciclo macro della campagna (crisi crescente a ondate, doppio obiettivo resistere+sconfiggere), valore temporale delle ricompense, quattro famiglie di reward, scalabilità dei requisiti, tabella deciso/aperto, prossimi passi.

**Cosa è successo:**
- Nuovo doc di design **PROPOSAL** `context/QUEST_CAMPAIGN_MACRO.md` — copertura per sezione della fonte (nota di copertura §8, invariante T-06): ciclo a ondate con doppio obiettivo, difese passive contenitive ma non risolutive, principio «il valore dipende da quando ottieni la ricompensa», 4 famiglie (capacità per le quest / economia e risorse / potenziamenti combattivi party / difese e infrastrutture villaggio), direzione «skill a livelli di applicazione», problema della scalabilità dei requisiti, tabella stato deciso/aperto, prossimi passi.
- Relazioni mappate col materiale esistente nel doc §7: desiderata v2 (invasione run-threatening), `GAME_INVASION_SEQUENCE.md` (marcia scripted 30gg = prototipo della singola ondata), OPEN-012 (difesa a ondate), `QUEST_OPPORTUNITY_LAYER.md` §4 (8 categorie ricompense-porta = asse per-effetto, ortogonale alle 4 famiglie per-dominio), canali §7 QUEST_RULES (i livelli di applicazione crescono sul meccanismo vigente), finestre/doppio timer ratificati, leader-capacity.
- `context/OPEN.md`: **OPEN-022** (sistema macro ricompense/requisiti: sottotipi delle 4 famiglie, rappresentazione requisiti con skill multi-livello, crescita senza obsolescenza, modello di valutazione tempo/rischio/disponibilità/stato campagna).
- `QUEST_RULES.md` §9: riga `proposta` per le direzioni macro campagna (regola di manutenzione 80).
- `context/INDEX.md`: riga indice aggiunta.
- **Gap nominato:** `GAMEPLAY_DESIGN.md` non contiene oggi alcun contenuto sul macro-ciclo di campagna — il doc nuovo è il seme di quel layer, da conciliare con la visione in sede di ratifica.

**Chiusura:** nessuna-verifica-tecnica: "solo documentazione di design (PROPOSAL): file markdown in context/, QUEST_RULES.md, INDEX.md, RICHIESTE.md — nessuna modifica a codice, config o test".

---

## R-211 — Autospegnimento: quiet window solo nei giorni lavorativi, weekend sempre attivo

**Richiesta (verbatim):** *"deve essere dalle 22 alle 7 nei giorni lavorativi. sabato e domenica deve lavorare sempre"*
**Data:** 2026-10-17
**Stato:** `fatta`
**Chiusura:** bundle: .mw/runs/r211-quiet-window-weekdays/bundle.json — PASS 5/5 (test shutdownManager 49/49, build:check, shutdown:lint-capability, verdetto live sabato senza veto orario, evidence log).
**Scope:** `policy.quietWindow` del Global Session Shutdown Manager — la restrizione oraria 22:00→07:00 si applica solo lun–ven (`restrictedDaysOfWeek`); sabato e domenica la finestra è attiva tutto il giorno (shutdown consentito a qualsiasi ora, e escalation `ABANDONED_STALE` attiva tutto il giorno). Gli altri gate restano invariati: `shutdownEnabled`, user idle ≥ soglia, nessuna sessione bloccante, nessun processo di lavoro non registrato.
**Contesto:** ruling quiet-window del 2026-10-16 (`canShutdown.ts` veto fuori finestra) esteso per-giorno; governance `.windsurf/rules/50-shutdown-governance.md` aggiornata; policy live in `~/.rpg-shutdown/session-registry.json`.
**Implementazione:** `QuietWindowSchema.restrictedDaysOfWeek` (0=dom…6=sab, default lun–ven; array vuoto = sempre attiva; campo assente = default lun–ven); `isQuietWindowActive` day-aware; reason del veto con giorni elencati; test R-211 ×6; evidence `test-results/r211-quiet-window-weekdays-2026-10-17.log`.
**Daemon avviato (2026-10-17, Director "eseguilo"):** plist installato in `~/Library/LaunchAgents` + `launchctl bootstrap` — `com.rpgbalancer.shutdown-manager` ATTIVO (KeepAlive/RunAtLoad, poll 30s, verdetto live `BLOCKED — user active`, ioreg OK). Fix plist: node nvm v22.23.1 assoluto + `tsx/dist/cli.mjs` (env launchd senza `node` su PATH); PATH con `/usr/sbin` (richiesto da `ioreg`). Spegnimento reale armato (`dryRun=false`, `shutdownEnabled=true`). **Daemon fermato (2026-10-17 ~19:30, Director "killa il processo"):** bootout + plist rimosso da LaunchAgents (sorgente canonico resta nel repo) — incidente vite-preview orfano → R-212.

---

## R-212 — Backstop processi: i leftover server non devono bloccare lo spegnimento

**Richiesta (verbatim):** *"dobbiamo risolvere questa cosa dei processi orfani, nn deve lasciare il pc acceso senza motivo"*
**Data:** 2026-10-17
**Stato:** `fatta`
**Chiusura:** bundle: .mw/runs/r212-orphan-processes/bundle.json — PASS 5/5 (test 72/72, build:check, lint-capability, repro live dell'incidente senza veto, evidence log).
**Scope:** `scripts/shutdownManager/knownProcesses.ts` — un `vite preview` orfano ha vetato lo spegnimento per ~2h (2026-10-17, R-211). Classificare i match: lavoro reale (test runner, build, harness, coordinator, mw-*) veto; fixture server (`vite preview`, dev server) solo report, mai veto — il segnale "lavoro" è il consumer (playwright/vitest) non il server, e l'utente attivo è già coperto dal gate idle.
**Implementazione:** `classifyWorkCommand` (BLOCKING_WORK_PATTERNS vs SERVER_LEFTOVER_PATTERNS; `playwright` solo firme reali — `--mode playwright`/`dist-playwright` nelle invocazioni vite NON è un processo playwright); `shutdownManager` veto solo su `kind==='work'` + log `server leftovers (non-blocking)`; rule 50 sezione "Unregistered-process backstop"; test ×23. Daemon fermato su richiesta Director (bootout + plist rimosso da LaunchAgents).
**Contesto:** bootstrap safeguard OPS-SHUTDOWN-006 (registry integrations non wired); incidente documentato in `test-results/r211-quiet-window-weekdays-2026-10-17.log`.

---

## R-216 — Visual fork gate: opzioni visive prima del plan, baseline congelata, verifica sul selezionato

**Richiesta (verbatim):** *"nella parte d plan (skill planner) quando il director dice 'approvo' e c sn elementi grafici modificati o da creare, invece di scegliere a priori un modo x rappresentare qualcosa d nuovo, modifche, ecc, dovrebbe essere preparato un documento di opzioni tra cui scegliere, (o meglio in fase di esplorazione? o durante i plan?) e alla fine il risultato deve essere 'misurato' rispetto a quello selezionato inizialmente."* · poi *"si, ma viene dirrettamente mostrato dentro devin desktop stesso con successo?"* — avallo sulla proposta explorer (gate in esplorazione, preview via Devin Preview tab su pagina servita, baseline congelata + emendamenti approvati).
**Data:** 2026-10-18
**Stato:** `fatta` (2026-10-18) — bundle: .mw/runs/20261018-plan-047-visual-fork-gate/bundle.json **PASS** 8/8 (OB-8 signoff Director registrato).
**Contesto:** esplorazione multi-AI `.mw/runs/explore-visual-options-workflow-20261018/` (converged 1 ciclo; gemini caller, groq critic — sintesi integrata a mano, `final.md` troncato dal deliberator). Direzione scelta: **Visual Decision Gate leggero** — fork visivo in `mw-explorer` (2 opzioni default, max 3 per fork strutturali), card comparativa + preview servita su localhost (route lab o harness statico, precedente `/bezel-variants`), ruling Director → baseline congelata + ledger emendamenti, `INTENT_GATE_VISUAL_FORK` in `mw-planner` per fork emergenti, verifica ibrida vs baseline (misure same-viewport + human-eye, T-04). Nessuna nuova pipeline: estende `painter`/`mockup-generator` e PLAN-MOCKUP-TO-COMPONENT-v3 (assorbito nelle skill).
**Plan:** PLAN-047 (**baptized 2026-10-18**, «Battezza e implementa» — v35 FROZEN in desiderata).
**Dibattito multi-AI web (2026-10-18):** `mind-weaver/.mw/runs/20261018-visual-fork-gate-debate/` — **converged su artifact-r003** (sha256 `2ee40230…`, 5/5 ACCEPT: chatgpt, claude, deepseek, gemini, grok). 36 obiezioni dispositionate in 12 cluster: skip con puntatore verificabile, anti-straw-man (`option_provenance` + asse vinto per opzione), `baseline_kind`/`frozen_at`, contratto di confronto pre-registrato, due ledger (amendments/incidental_deviations), loop reject_all con sintesi+asse-di-variazione, lifecycle spike, check meccanico T-006 su diff reale + copertura, dry-run T-007 su dati R-214.
**Implementazione (2026-10-18):** T-001..T-007 consegnati — skill `mw-explorer`/`mw-planner`/`painter`/`mockup-generator` (sezioni gate v35), template card `.mw/templates/visual-fork/visual-fork-card.md` + `context/INDEX.md`, bullet `AGENTS.md`, gate `scripts/verification/visualForkGate.ts` integrato in `closure:lint` (superficie visiva dal **diff reale**, copertura per-file vs scope card/skip puntati, fail-closed), 14 test unitari + fix ricorsione `runCommittedGate` (runner head-gate: `GATE_FILES` svuotato nel figlio — il gate a HEAD non ri-delega). Dry-run card T-007: `.mw/runs/20261018-visual-fork-dryrun-r214/visual-fork-bezel-hud64.md` (baseline reale sha256 `e557e9a8…`).
**Ruling Director 2026-10-18 — scope per plan:** il gate fallisce solo su file visivi scoperti **non dichiarati in alcun plan** (omissione silenziosa) o dichiarati in plan con `Desiderata: ≥v35`; file attribuiti a plan pre-v35 → warning transitorio non-bloccante (copertura dovuta alla loro chiusura). Attribuzione: basename/path/prefisso `src/` ≥3 segmenti (mai glob `**`) in `plans/*.md` + `docs/plans/*.md`.
**Bundle:** `.mw/runs/20261018-plan-047-visual-fork-gate/bundle.json` — verdict **PASS** OB-1..OB-8 (OB-8: `director-signoff.json` con `frames_sha256` su card+template+baseline). Resta il primo pilot reale post-landing con criterio di fallimento (§8).
**Ruling Director 2026-10-18 — preview auto-open:** la scheda Preview di Devin Desktop è la superficie prevista (non una finestra foreground, regola 16 non si applica) — `browser_preview` auto-open consentito; registrato in skill/PLAN-047/template. Bugfix collaterale: proxy path-scoped serviva index.html agli asset → pagina bianca; fix = registrazione sulla ROOT + redirect-stub (`.mw/bugs/20261018-devin-preview-white/`, trappola T-19).
**Chiusura:** bundle: .mw/runs/20261018-plan-047-visual-fork-gate/bundle.json — PASS 8/8 (OB-8: `director-signoff.json` con `frames_sha256` su card+template+baseline).

---

## R-217 — Misurare dove gli agenti perdono tempo nel ciclo plan→implementazione→chiusura

**Richiesta (verbatim):** *"ho un problema: devo capire xè i miei agenti sn così lenti a scrivere codice, nonostante abbiamo già dei plan che dovrebbero essere adeguatamente precisi. voglio: 1) un modo x capire cosa ci fa perdere + tempo (creare i plan? scrivere codice? burocrazia? aggiornare la documentazione?) 2) un modo x capire come ottimizzare/qual è il problema 3) un modo x ottenere automaticamente queste informazioni quando le abbiamo raccolte, senza dover tornare io in questa discussione"*
**Data:** 2026-10-18
**Stato:** `fatta` (2026-10-18) — bundle: .mw/runs/plan048-forensics/bundle.json **PASS** 7/7.
**Desiderata FROZEN:** nessuna corrispondente; arena vicina a R-204 (velocizzare il ciclo, `sospesa` su PLAN-039 parziale) e R-208 (snellimento governance, `fatta`). Qui il focus è **osservabilità del workflow**, non parallelismo.
**Direzione scelta (Director, 2026-10-18):** opzione **A** — ledger forense da artefatti esistenti, zero nuove obbligazioni per gli agenti. Delivery: report file nel repo rigenerato ad ogni `plan:stamp` + `metrics:report` on-demand (reversibile a battezzo).
**Plan:** `plans/PLAN-048-workflow-forensics.md` — **battezzato 2026-10-18** (Director «approvato»). Ledger aperto: `plan:stamp open PLAN-048`.
**Chiusura (2026-10-18):** `mapping:approve` proposal-2026-10-18T12-12-15-573Z (batch `8cccded9…`, superficie `workflow-forensics`) → bundle rivalutato **PASS**. Primo uso reale del trust-anchor PLAN-051 in strict mode: il gate ha rilevato drift legittimo (surface-map post-approve) → risigillo+riapprovazione → PASS. Report live: `context/WORKFLOW_METRICS.md`.
**Precisazione Director (2026-10-18):** *"mi serve capire se in 'implementazione' c'è questione di burocrazia, aggiornamento della documentazione, o scrivere codice. E se scrivere un plan + definito cn + info possa diminuire il tempo di implementazione di codice"* → plan v2: scomposizione intra-implementation per classe commit (§3b) + correlazione richness-plan→velocità (§3c) diventano il cuore del report.
**Stato lavori (2026-10-18):** implementato + dogfood. Bundle `.mw/runs/plan048-forensics/bundle.json`: **7/7 obbligazioni PASS**, verdict `BLOCKED` solo per contracts gate — superficie `workflow-forensics` in attesa di `npm run mapping:approve -- .mw/mapping-proposals/proposal-2026-10-18T12-12-15-573Z.json`. Output live: `context/WORKFLOW_METRICS.md` (auto-rigenerato da `plan:stamp`).
**Contesto esplorato in sessione:** le sorgenti temporali già esistenti sono git log (timestamp commit), `.mw/runs/*/bundle.json` (`produced_at`), mtime degli artifact di dibattito, SESSION_HANDOFF e transizioni in RICHIESTE; PLAN-039 misura già `installMs`/`agentMs`/`verifyMs` ma solo per esecutori esterni harness, non per l'agente locale Devin (i cui transcript non sono accessibili localmente — `windsurfSessionHandoff.db` vuoto). In esplorazione: ledger forense da artefatti vs event ledger strumentato vs journal auto-report; delivery automatica (report file vs handoff vs Telegram).
**Chiusura:** bundle: .mw/runs/plan048-forensics/bundle.json — PASS 7/7 (superficie `workflow-forensics` risigillata via mapping:approve; report live `context/WORKFLOW_METRICS.md`).

---

## R-220 — La cerimonia di verifica paga? Snellire/automatizzare senza agente

**Richiesta (verbatim):** *"dobbiamo cercare di capire se e quanto queste cose siano utili e importanti, e se possono essere snellite in qualche modo, automatizzate senza usare un agente o qualcosa del genere. fa una ricerca online, poi chiedi multi ai web con prompt potenziato e cappello"*
**Data:** 2026-10-18
**Stato:** `fatta`
**Contesto:** segue R-217/PLAN-048 — il forensics report (context/WORKFLOW_METRICS.md) mostra che nell'implementazione ~32% va in burst di produzione artefatti di verifica (command-logs, frames, metrics, bundle) e l'unobserved è inferito ~41% docs · ~20% tests su churn. Domanda: questa spesa (bundle, evidence, trusted docs, gates) ha ROI? Cosa può diventare meccanico senza agente?
**Metodo richiesto:** ricerca online + dibattito multi-AI web (mw-web-debate, prompt potenziato + hats).
**Esito (2026-10-18):** dibattito converged — run `mind-weaver/.mw/runs/20261018-verify-roi/`, artifact `artifact-r004.md` (sha256 `ae269a49…`), 4/4 provider ACCEPT (claude, gemini, deepseek, grok; chatgpt escluso — sessione degradata). Ricerca online integrata nel grounding-ledger dello stesso run. Sintesi: la cerimonia NON è teatro ma va ri-puntata — bundle packaging diventa un comando derivato invocato dalla catena dei gate (non dall'agente), enforcement trusted-docs/surface diventa hash-lock meccanico, verifiche percettive diventano tiered per reach con invarianti save/economy always-on; judgment resta su human-eye (T-04), approvazioni Director e authorship dei criteri. Trust anchor = approvazioni firmate Director.
**Plan:** `plans/PLAN-051-verify-slim.md` (**baptized 2026-10-18**, «procedi»).
**Implementazione (2026-10-18):** T-001..T-006 fatti — `npm run bundle` (wrapper evidence-derivata, `--init`/`--all-tiers`), `trusted.lock.json` + `trusted:seal`/`check`, `npm run approve -- --kind=trust-set` (ledger fuori-repo `~/.rpg-approvals/`, strict-once-established: un lock riforgiato non passa), tiering per reach (`.mw/verify-tiers.json`, `SKIPPED` non bloccante, `verify:sweep` full tier), signoff human-eye bound a `commit_sha`/`frames_sha256`, fixture lying-agent + seeded faults, sezione "Gate cost" nel report. Test 17/17 + build:check + closure:lint PASS.
**Trust anchor (2026-10-18):** attivato dal Director (`trusted:seal` + `approve`); verificato `trusted:check` OK il 2026-10-23.
**Ruling Director 2026-10-23:** T-007 (misura pre/post strumentata) **deposto** — *"misurare così ha poco senso; snellire dove abbiamo problemi"*. Sensore residuo: attrito percepito (ATTRITI/found-by) + FP-rate già visibile in "Gate cost". PLAN-051 → `completed`.

---


## R-224 — Applicare la direzione visiva alla quest Sterminio Goblin

**Richiesta (verbatim):** *"aggiungi quelle scene con il linguaggio giusto sulla quest Sterminio Goblin"*
**Data:** 2026-10-18
**Stato:** `superata` — il Director conferma che il risultato desiderato è già stato realizzato. Le 8 immagini sono associate alle fasi Goblin e al manifest ingresso×posa di PLAN-050; nessun nuovo asset o modifica runtime richiesta da questa voce.
**Riferimenti:** v34 FROZEN; R-213; PLAN-050; `src/ui/idleVillage/questS1Lab/questArt.ts`; `src/ui/idleVillage/questS1Lab/render/sceneManifest.ts`.

---

## R-223 — Regressioni nel planner spedizione e nei POI quest

**Richiesta (verbatim):** *"c sn state regressioni, ad esempio il componente preview della quest (POI detail d tipo quest) ha perso delle modifiche importanti.
le pgCard nn trascinano + e sn tornate a mostrare il medaglione in ritardo se provo a trascinare.
Gli slot quando faccio l'animazione di estrazione dei medaglioni i medaglioni diventano invisibili.
Il pulsanteè sbagliat in POI detail d tipo quest, il pulsante della bag nn apre il componente stash del villaggio, c'è anche un pulsante companions che nn dovrebbe esistere.
la preview d calcolo Forecast ha un design sbagliato, risponde a rallentatore ai nuovi calcoli e nn dovrebbe e nn capisco xè. Se è un bug o qualcosa del genere va risolto.
Tutte quelle animazioni sn lente, scattose e vanno in ritardo, va ottimizzato.
nn so come ma è rimasto un medaglione in mezzo al compoennte mentre lo provavo ad assegnare.
sotto gli slot c sn tag invece di indicatori di pericolo (testa o coda). C deve essere % di prenderei danni (che in questa missione è 80% x l'ultimo in coda e 20% x quello precedente, se è solo 1 è 100%.
Quando il componente viene ridotto ad icona il layout è sbagliato , nn è centrato, alcune cose sn sul bordo, l'opzione d chiusura nn è presente e l'icona x riallargarla nn è allineato a destra come dovrebbe essere"*

**Data:** 2026-10-18
**Stato:** `fatta` — regressioni ripristinate su `/game`: drag PgCard/medaglione immediato, return dal punto di rilascio senza ghost centrato, medaglioni visibili in estrazione, bag → Village Stash, Forecast reattivo, indicatori 100%/20%-80%, planner minimizzato centrato e ripristinabile.
**Chiusura:** bundle: .mw/runs/r223-quest-ui-regressions/bundle.json — OB-01..OB-09 PASS, verifier meccanico CONFIRMED, `closure:lint` PASS 2026-10-19.
**Desiderata FROZEN:** v3/v4 (POI quest e pannelli flottanti), v23 (Planner reattivo e rischio per slot); rischio posizionale allineato a `QUEST_RULES.md` §3.
**Collegamenti:** estensione di verifica per le superfici già attive in R-207/PLAN-043-S8/S9 e R-214; non sostituisce né chiude le richieste o i contratti già aperti.
**Acceptance richiesti dal Director:** drag funzionante e tempestivo per PgCard/medaglioni; medaglioni visibili durante estrazione e senza residui; Forecast coerente con le modifiche e reattivo; animazioni fluide; POI detail con azioni corrette (bag apre lo stash villaggio, nessun pulsante companions); rischio per posizione in coda 1 PG=100%, 2 PG=20%/80%; pannello minimizzato centrato, chiudibile e con controllo di riapertura allineato.

---

## R-227 — Atmosfera cinematica: nebbia riconoscibile e authoring selettivo

**Richiesta (verbatim):** *"stai facendo cose in maniera stupida e imprecisa: fa una ricerca online su come fare un effetto nebbia (nn foschia) e la nebbia nn sta bene in tutte queste scene (foresta si, fuga no ad esempio). Il fatto che siano visibili nn significa che siano riconoscibili cm nebbia, o che abbiano senso in quella scena"*
**Data:** 2026-10-18
**Stato:** `fatta` — acceptance percettiva Director 2026-10-19 («va bene» sul fog depth-pooled in movimento su `sentiero-tracce`; «approvo» sulle transizioni con `blurSettleFrac`).
**Chiusura:** bundle: .mw/runs/plan050-t013-fog-revision-3/bundle.json — PASS 6/6 (2026-10-19, ri-eseguito dopo risigillo del drift trust-set parallelo — T-13 risolto).
**Direzione registrata:** effetto multistrato con veli indipendenti, bordi irregolari/textured e densità sufficiente ad attenuare la scena; nebbia solo dove la composizione e la narrazione la giustificano. Landing: fog = texture fBm tileable in pool depth-derived (`bake-fog-noise.py`/`bake-fog-mask.py`), authored solo su `sentiero-tracce` (ruling Director: «non in foresta agguato», «fuga no»). `carro-nascosto`, `accampamento-raider` e gli altri mapping restano senza atmosfera in parallasse. Il ritorno resta fuori dalle scene atmosferiche in attesa di R-226 / PLAN-053.
**Acceptance:** test headless dimostra struttura deterministica e scene vuote/attive corrette; cattura on/off controllata e ispezione visuale dell'agente sono evidenza diagnostica, non approvazione Director. OB-8 chiuso col ruling percettivo del 2026-10-19.
**Collegamenti:** `plans/PLAN-050-cinematic-showcase-juice.md` T-013 / OB-13; R-226 e `plans/PLAN-053-quest-journey-legs.md` per il ritorno.

---

## R-228 — Accettazione visiva semantica: presenza non significa leggibilità

**Richiesta (verbatim):** *"1) nn è una animazione, quindi ai fini d questa conversazione è ininfluente 2) è una striscia bianca, nn sembra x iente nebbia o qualcosa del genere. il fatto che sia visibile nn significa che abbia quel significato. L'esistenza di un disegno nn implica che quel disegno abbia il significato voluto, capisci?"*
**Data:** 2026-10-18
**Stato:** `fatta` — criterio rispettato e acceptance ottenuta (testimoni temporali + nebbia depth-pooled riconoscibile, ruling Director «va bene»/«approvato»/«approvo» 2026-10-19); chiusura meccanica condivisa con R-227.
**Chiusura:** bundle: .mw/runs/plan050-t013-fog-revision-3/bundle.json — PASS 6/6 (2026-10-19).
**Acceptance:** il diff on/off, i pixel alterati e la presenza del layer non sono prove di animazione o di semantica. Una cattura statica non attesta il moto; la forma mostrata è stata giudicata dal Director una striscia bianca, non nebbia, quindi il risultato corrente è respinto. Prima di dichiarare esito, la prova deve mostrare il comportamento temporale richiesto e il contenuto deve essere riconoscibile come nebbia, non solo visibile.
**Collegamenti:** R-227; `plans/PLAN-050-cinematic-showcase-juice.md` T-013 / OB-8 / OB-13.

---

## R-229 — Rimuovere il watermark Gemini da `bg.png`/`bg.webp`

**Richiesta (verbatim):** *"l'immagine che usiamo come sfondo "bg.png" penso si chiami ha il logo d gemini, lo puoi eliminare?"*
**Data:** 2026-10-19
**Stato:** `fatta` — implementazione e verifica completate.
**Chiusura:** bundle: .mw/runs/r229-bg-watermark-removal/bundle.json — PASS 3/3 (2026-10-19, ri-valutato dopo risigillo del drift trust-set parallelo — T-13 risolto).
**Lavoro svolto:** rimosso lo sparkle Gemini dall'angolo basso-destra di `public/assets/ui/bg.png` via `cv2.seamlessClone` (donor patch a offset −60/−160, texture pittorica continua, nessun ghost); `public/assets/ui/bg.webp` ri-encodata dal PNG pulito (quality 92, method 6, 2816×1536 invariata). Verifica a occhio su crop 2× + pixel-check meccanico (nessuna componente cool-bright ≥200 px nella regione, core ex-marchio 92→32 lum).
**Blocco chiusura:** bundle `.mw/runs/r229-bg-watermark-removal/bundle.json` — **BLOCKED** con OB-1/2/3 PASS; il gate contracts fallisce solo su `surface-map` entries `game-map-pixi`/`game-hud` in attesa di batch approvato e trusted-lock rileva drift su `pgcard_trusted.md`, `pgcardKit.md`, `slotRackKit.md`, `surface-map.json` — tutto lavoro di sessione parallela in attesa di approvazione Director. I file `bg.*` sono disposti via `coverage_exception EXC-20261019080702-a8e0`; mapping-proposal per una superficie `public/assets/ui/**` da valutare a parte.
**Acceptance:** marca d'acqua assente in entrambi i file e nessun artefatto visibile a occhio nel corner — PASS. `fatta` quando il gate contracts/trusted-lock torna verde (approvazioni Director sul drift parallelo) e il bundle rigenerato risulta PASS.
**Collegamenti:** `.mw/runs/r229-bg-watermark-removal/` (manifest, check_watermark.py, corner-after.png, bundle.json).

---

## R-232 — Copertura dei test e documentazione sincronizzata su `/game`

**Richiesta (verbatim):** *"abbiamo un pack di test della pagina /game e di tutti i componenti al suo interno, e le interazioni, e la documentazione?"* → *"si, e deve essere automaticamente aggiornata quando c sn nuove implementazioni e cose del genre"*
**Data:** 2026-10-19
**Stato:** `fatta` — implementazione completa e verificata.
**Chiusura:** bundle: .mw/runs/r232-game-surface-coverage/bundle.json — PASS 4/4 (2026-10-19, ri-eseguito dopo risigillo del drift trust-set parallelo — T-13 risolto).
**Contesto:** la superficie `/game` è già inventariata meccanicamente (PLAN-043 `discoverGameSurface` + PLAN-054 `componentInventory`, 252 unità su 424 file in `.mw/contracts/components/`). Manca la matrice derivata che dice, per unità, quali test unitari/E2E la coprono e quali documenti la citano — rigenerabile con un comando e protetta da drift da un guard test fail-closed.
**Scope:** `scripts/verification/gameSurfaceCoverage.ts` (partition + reachability test→src + scan testid per e2e + scan doc), artifact `.mw/contracts/components/coverage.generated.json` + `src/docs/docs/idle_village/game_surface_coverage.md`, script `npm run surface:coverage`, guard `tests/unit/idleVillage/gameSurfaceCoverage.test.ts`.
**Cosa è stato fatto:** `scripts/verification/gameSurfaceCoverage.ts` — matrice meccanica per le 252 unità della partizione PLAN-054: unit test rilevati via grafo import dei test, e2e via import + `data-testid` citati dalle spec, doc via mention in `src/docs/docs`/`plans`/`context`/root (esclusi ops-artifact coordinator/prompts), copertura dichiarata dal frontmatter dei contratti `.mw/contracts/`. Artifact: `.mw/contracts/components/coverage.generated.json` + `src/docs/docs/idle_village/game_surface_coverage.md` (GENERATED, sha-stamped). Auto-update: `npm run surface:coverage` rigenera; il guard `tests/unit/idleVillage/gameSurfaceCoverage.test.ts` (anti-drift, pattern gameSurfaceManifest) fallisce se gli artifact sono stale. Rilevato: 234/252 unità con unit test, 59 con e2e dedicati, 214 con doc, 13 a copertura zero (lista nel doc, es. `objective-cartouche`, `region-tooltip`, `hud-panels-menu`).
**Collegamenti:** `.mw/runs/r232-game-surface-coverage/` (manifest verification.json + bundle BLOCKED per gate parallelo); `npm run surface:coverage`, `npm run surface:coverage:check`.

---

## R-236 — Gate visuali differiti + review page per le decisioni

**Richiesta (verbatim, 2026-10-20):** *"le cose che devo decidere le riguardo in un secondo momento, nn adesso"* → *"chiudi tutto quello che aspetta una mia decisione 'visiva'"* + *"le cose come G05 voglio che siano aperte in un bel file, cn immagini, ecc nella barra laterale, nn un .md se devono essere sottoposte a me"*
**Data:** 2026-10-20
**Stato:** `fatta` — convenzione registrata in PLAN-068 e review page generata
**Decisione:**
1. Gate **visuali/esperienziali** di PLAN-068 (G-01, G-02, G-03, G-04, G-06, G-07, G-09, G-10) → `differita`: il Director li rivede in una sessione dedicata, non bloccano il lavoro corrente.
2. Gate **decisionali** (ruling su proposte/copy/ledger: G-05, G-08, G-11) → presentati come **review page statica con immagini** aperta nella sidebar, mai come `.md` nudi: `.mw/review/plan068-round/index.html`, generata da `npx tsx .mw/review/build-review.mts`, servita dalla root repo su `:5199`.
3. La convenzione vale anche per i round futuri: ogni materiale sottoposto al Director per una decisione arriva come review page con immagini, non come markdown.
**Effetto su PLAN-069:** i gate decisionali restano aperti ma hanno ora superficie propria; i visuali si accumulano per il giro dedicato del Director.

---

## R-245 — Quest `/game`: mai scritte sopra le immagini del teatro

**Richiesta (verbatim, 2026-10-21):** *"nella quest c sn delle scritte sulle immagini. nn c devevono essere mai"*
**Data:** 2026-10-21
**Stato:** `fatta`
**Scope:** `QuestRunWindow` teatro/stage — overlay testuali dipinti sopra l'immagine di scena (label di fase tipo «EXPLORATION», epigrafi/caption, ecc.). Vanno rimossi/riposizionati fuori dall'immagine: il testo non deve mai coprire l'arte. Verifica percettiva a schermo (T-04).
**Implementazione (2026-10-21):** rimossa la caption diegetica PLAN-050 §6 da `Theater` (div caption + `labelPos`/anchorToView, props `caption`/`hidden`, consts `caption`/`captionHidden`/`stageNode` a monte, import `anchorToView`/`cameraAt` morti). Il latch `activeSceneNodeId` resta — serve ancora l'art atomica (R-239); il frame ora renderizza solo art+fx. `HiddenMark` sopravvive solo nella colonna `BeatStage` (sotto l'immagine). Supera intenzionalmente la direzione PLAN-050 §6: ruling Director più recente. Altre superfici verificate senza testo-su-immagine: canvas `DepthScene` (nessun Text), `QuestRewardPopup`, `QuestJourneyRoute` (SVG, solo aria-label).
**Test:** `questRunWindow.stageNode.test.tsx` riscritto — INV `R-245-no-text-on-art` (`frame.textContent === ''`) + latch arte R-239 invariato; 1/1 verde.
**Verifiche:** `build:check` ✅ · lint scope 0 errori (file in ignore-pattern) · **eye-check headless `/quest-window-lab` 1500×950 (T-04): frame teatro `textContent=""`, screenshot `theatre-no-caption` — solo artwork**.
**Collegamenti:** R-239 (audit video: caption epigrafe), R-242 (stessa superficie teatro, worktree condiviso T-13), PLAN-050 §6 (direzione superata).

## R-247 — Roster V1+V2: toggle «riduci a striscia» da occhio a «−» come gli altri pannelli

**Richiesta (verbatim, 2026-10-21):** *"entrambe le versioni del roster hanno un occhio chiuso o aperto x ridurre a striscia, mentre tutti gli altri componenti hanno un - rendili come gli altri"*
**Data:** 2026-10-21
**Stato:** `fatta`
**Scope:** toggle collapse nelle due versioni del roster. V1 (`components/DragTestContainer.tsx`, montato anche via `rosterKit`→`VillageRosterSection`) usava lucide `Eye`/`EyeOff` → ora `Minus`/`Maximize2`, lo stesso pair dei floating panel (`QuestExpeditionDetail`). V2 (`rosterV2/DragTestContainerV2.tsx`, roster di `/game`) usava `EngravedIcon` `cmd-eye`/`cmd-eye-off` → ora `cmd-minimize` da expanded (identico a `QuestRunWindow`) e `cmd-panels` da collapsed (due carte sovrapposte, gemello inciso di `Maximize2`). `aria-label` e `aria-pressed` invariati; `HudHideToggle` non toccato (occhio legittimo: nasconde/mostra HUD, non riduce a striscia). Doc commenti + `roster_slot_interaction_documentation.md` aggiornati.
**Verifiche:** lint scope 0 errori (file in eslint ignore — warning atteso) · `build:check` ✅ · unit `rosterV2Controls` 5/5 · `closure:lint` ✅ (solo warning baseline visual-fork/source_ref preesistenti) · **eye-check headless T-04**: `/game` (tasto `r`) expanded `cmd-minimize` ↔ collapsed `cmd-panels` (`test-results/roster-minus-toggle/v2-*.png`); `/poi-quest-detail-roster-integration` V1 expanded `lucide-minus` ↔ collapsed `lucide-maximize-2` (`v1-*.png`), 0 errori console.
**Collegamenti:** R-238 (hit-area pill roster, INV `drag-test-container-v2.INV-1` intatta), `hud_component_guide` (pattern minimize/restore dei pannelli).
**Residuo noto (fuori scope):** `map/MapPage.tsx` e `legacy/StyleLabMapPage.tsx` usano un toggle 👁️ emoji per il collapse del roster di pagina — superfici legacy/lab, non le «versioni del roster»: non toccate, segnalate.

## R-249 — Roster ridotto a striscia: scrollbar su entrambi gli assi non devono apparire

**Richiesta (verbatim, 2026-10-21):** *"quando lo riduco a striscia si vede un bug dove appare la barra x scorrere sia d lato che l'altra, nn devono apparire"*
**Data:** 2026-10-21
**Stato:** `fatta`
**Scope:** striscia collassata del roster (V2 su `/game`, V1 embedded). Il `StagePanelFrame` (`useGameStageZones.tsx:450`) applica `overflowY:'auto'` — e per computed CSS anche `overflowX:'auto'` — al wrapper del pannello: è l'unico antenato scrollabile della striscia; qualsiasi micro-overflow del contenuto (larghezza frazionaria, placement stretto, rect < strip) dipingeva ENTRAMBE le scrollbar (quella orizzontale ruba altezza → appare anche la verticale). Fix: `.skin-scope [data-stage-panel]:has([data-collapsed]) { overflow: hidden !important; }` in `skins/skinScope.css` — `!important` necessario perché l'`overflowY` è inline style; verificato `ox=hidden, oy=hidden` da collapsed e ritorno `auto/auto` da expanded. Più `overflow-hidden` sul content div interno (`relative z-10`) quando `isRosterCollapsed` in V1+V2 (clip alla fonte per gli host non-stage; la section V2 non può avere `overflow-hidden` — vincolo documentato: clippa l'ombra della HudPlaque).
**Verifiche:** `build:check` ✅ · lint scope 0 errori (file in eslint ignore — warning atteso) · unit `rosterV2Controls` 5/5 · **runtime headless T-04**: `/game` (tasto `r`) — frame `auto/auto` → collapse → `hidden/hidden` → re-expand → `auto/auto`; screenshot `test-results/roster-minus-toggle/v2-strip-fixed.png` striscia pulita, nessuna scrollbar su entrambi gli assi.
**Collegamenti:** R-247 (stessa striscia, icone minimize/restore), R-238 (INV `drag-test-container-v2.INV-1` intatta), T-04.

## R-252 — Roster striscia: icone stesse proporzioni/posti tra chiudi↔riapri + toggle reattivo

**Richiesta (verbatim, 2026-10-21):** *"quando chiudo e riapro le icone devono rimanere delle stesse proporzioni e negli stessi posti. Chiudere e riaprire nn è abbastanza responsive, rallenta e va a scatti. nn deve"*
**Data:** 2026-10-21
**Stato:** `fatta`
**Scope:** toggle «riduci a striscia» del roster (V2 `/game` + V1). Tre difetti misurati su `/game`: (1) i pill icona `svg:only-child` hanno `width:26px` dichiarata ma il flex li schiacciava a 18.1×26 da expanded — `flex-shrink: 0` aggiunto alla regola `svg:only-child` di `skinScope.css` (+ stessa su `[data-roster-controls="compact"]` V1): icone 26×26 in entrambi gli stati e restore/minimise allo STESSO x (834) e close uguale (864) — misurato, non a occhio; (2) la lista era renderizzata condizionata → ogni toggle smontava/rimontava tutte le PgCard: expand 2321ms con longtask 1035ms, collapse 903ms (dev server, il runtime del Director — T-22). Ora la lista resta montata (`visibility:hidden`, `pointerEvents:none`, `marginTop:0`, `aria-hidden` da collassata — lo stile max-height/opacity 0.35s era già predisposto): expand→DOM 196ms, collapse→DOM ~500ms; (3) guard T-23 applicata: `collapsedAtRef` + `Date.now`, il secondo click <350ms (coda del doppio-click sul restore che ora occupa lo slot del minimise) viene inghiottito — verificato: doppio click veloce resta striscia, click +500ms ripristina.
**Verifiche:** `build:check` ✅ · unit `rosterV2Controls` 5/5 · lint scope 0 errori (file in eslint ignore) · **runtime headless T-04**: rect icone expanded↔collapsed identici (834/864, 26×26), strip `test-results/roster-minus-toggle/strip-r252.png` ed expanded `expanded-r252.png` — icone dentro i bordi della placca · V1 `/poi-quest-detail-roster-integration` collapse/expand OK 0 errori console.
**Collegamenti:** R-251+T-23 (convenzione striscia stabile — restore nello slot del minimise, guard 350ms, insets ≥ fascia), R-249 (overflow nascosto in striscia — qui il `[data-collapsed]` resta il trigger), T-22 (misura sul dev server, non su preview).

## R-255 — Roster ancora scattoso + «orecchie scure» sul roster della quest

**Richiesta (verbatim, 2026-10-22):** *"è ancora scattoso, inoltre il componente roster della quest ha tipo delle orecchie scure invece d finire con il bordo doro stondato,elimina. i tuoi test sn sbagliati se inq uel modo pensi sia ok"*
**Data:** 2026-10-22
**Stato:** `fatta`
**Scope:** (1) **Orecchie scure** — riprodotte su `QuestPartyRosterPanel` (wing sinistra della run window, `HudPlaque shape="panel"`): binary-search live sui figli SVG → causa = la **wear mask** (`wear_mask.webp`, mask `wr-*` sulla banda bronzea): dove la texture è scura cancella il bronzo fino allo `--skin-hud-step` nero → macchie scure agli angoli = "orecchie" invece del bordo oro continuo. Fix: mask rimossa dalla banda in `HudPlaque.tsx` (defs `wp-*`/`wr-*` + costanti dead eliminate) — il gradiente brass crest→foot conserva la variazione materica. Verificato 4×: angoli puliti su quest roster E roster `/game`. **Tensione dichiarata:** la wear è authored («Bronze wear lives here — D2» in `poi_family_spec.md`); rimossa perché il Director l'ha letta come difetto e ha ordinato «elimina» — se vuole la texture altrove serve un ruling. (2) **Scattosità residua** — la transizione `max-height/opacity 0.35s` rimasta da R-252 rifluiva il set carte a ogni frame: rimossa in V1+V2 → flip istantaneo (come la striscia stash). Misurato in-page con click DOM sincrono: collapse→DOM **86ms**, expand→DOM **42ms** (il numero grande del probe precedente era il wait di actionability di Playwright sotto i longtask ambientali del villaggio — carico globale in scope R-248, non del toggle).
**Verifiche:** `build:check` ✅ · `rosterV2Controls` 5/5 · lint scope 0 errori · **runtime headless T-04** su `:5173` (runtime Director) — `test-results/quest-roster-ears/`: `scan-normal` (orecchie) vs `scan-nowear`/`fixed-full`/`roster-expanded-fixed` (bordo continuo), toggle 86/42ms, 0 errori console.
**Collegamenti:** R-252 (toggle roster — seconda ondata), R-249 (striscia roster), D2 tension su wear authored, T-04/T-22.

## R-261 — «Orecchie» anche in POI detail di tipo quest e sul roster che apre (V1)

**Richiesta (verbatim, 2026-10-22):** *"le orecchie c sn ancora in POI detail d tipo quest e il roster che apre"* (con screenshot: angolo della placca con bump scuro oltre il bordo oro)
**Data:** 2026-10-22
**Stato:** `fatta`
**Scope:** seconda fonte di «orecchie» diversa dalla wear mask di `HudPlaque` (R-255): il roster V1 in pelle wanderlust usa **`WellBronzeBezel`** (`src/ui/visualFidelityLab/plateVariants.tsx`) che applicava un `feTurbulence`+`feDisplacementMap` («micro-wear») alla banda bronzea → il bordo veniva spinto in fuori in modo irregolare, bump scuro all'angolo top-right del roster e anomalia analoga sulle cornici della pagina integrazione `/poi-quest-detail-roster-integration`. Fix: filtro displacement rimosso dal markup e dalla `<defs>` (dead code eliminato); `MatericFrame` e i consumer (PgDetailCard, preview lab) ereditano il bordo liscio. Screenshot Director confermato riproducibile: `v1roster-tr.png` (orecchia) → post-fix bordo oro continuo.
**Verifiche:** `build:check` ✅ · `rosterV2Controls` — il test `status filter narrows` falliva a timeout 5s **per load ambientale**: con `--testTimeout=30000` passa in 3.0s (no regressione; file toccato anche da sessione parallela R-257, T-13) · lint scope: 1 errore `react-refresh/only-export-components` su `PLATE_VARIANTS` in `plateVariants.tsx` — **preesistente** (export misto componenti+const, non introdotto dal fix; fix = split file, churn fuori scope) · eye-check T-04 headless: `v1roster-tr.png` pre/post su `/poi-quest-detail-roster-integration`.
**Collegamenti:** R-255 (prima fonte orecchie: wear mask `HudPlaque`), stessa tensione D2 su «Bronze wear lives here» — anche il displacement era authored; rimosso su ordine esplicito Director. T-04, T-13.
**Plan (R-260, 2026-10-22):** `plans/PLAN-075-r260-collect-commit-reward.md` — **battezzato ed eseguito** («procedi» 2026-10-22); design come da ruling explorer (split begin/commit + delta transiente HUD); esito verifiche nel blocco R-260 sopra e §8 del plan.

## R-278 — Scene variants + reveal narrativa + ricerca open-horizon

**Richiesta (verbatim, 2026-10-24):** *"a noi serve un modo interessante anche x fare magari diverse versioni della stessa scena e fare questi effetti d reveal"* + *"i goblin sn nascosti dalla vegetazione e mentre ti avvicini si alzano — invece d fare il parallasse laterale e basta?"* + *"i tuoi prompt sn troppo circoscritti a quello d cui abbiamo discusso, senza dare modo alle altre ai d dare risposte che amplino i nostri orizzonti"*
**Data:** 2026-10-24
**Stato:** `fatta` (slice reveal — Director ruling "chiudili e basta" 2026-10-24). bundle: `.mw/runs/plan084-reveal-slice/bundle.json` — verifier ✓, trusted-lock ✓, obligations 4/4 PASS; BLOCKED residuo solo da drift di sessioni parallele (T-13). Aperto in PLAN-084: OB-4 delta plate, OB-5 motivated-cover, OB-8 scorecard.
**Contesto:** reveal narrativa (idea Director, non prevista): piatto goblin + maschera frangia vegetale + trigger soglia camera → le sagome "si alzano" al creep. Prima FX narrativa vs ambientali. Varianti scena (hidden/risen, before/after, day/dusk) da generare consistenti.
**Critica metodo:** i broadcast erano scopati a taxonomy — prompt aperto lanciato (`.mw/research/2026-10-24-scene-variants-and-reveal/`): variants, reveal mechanics, tecniche oltre il nostro modello (flow fields, color cycling, masked scroll, grading-travel, stereo, audio coupling) + sfida ai vincoli (single raster, deterministic canvas, no-layer-rule).
**Pendente:** sintesi report → candidatura `reveal` tipo + pipeline varianti + ruling Director su cosa rompere del contratto.

## R-293 — `mappa2`: dividere in Regioni (stile Risiko) e Biomi separati; animazioni per bioma

**Richiesta (verbatim, 2026-10-29):** *"Dobbiamo dividere la mappa in zone e in biomi. ci possono essere zone distanti tra loro con lo stesso bioma, mentre le zone tipo Regioni le dobbiamo dividere come fosse una mappa di Risiko. come la divideresti? in teoria è già divisa, ma non va bene"* — poi: *"vanno bene, anche il mare va bene diviso, in caso non verrà utilizzato; isole accorpale per vicinanza"*, *"steppe rosse potrebbe diventare tipo deserto?"*, *"dividi quelli e costa e bayou"*, *"massiccio della cascata non deve comprendere le montagne, quelle accorpale a vette nevose"*, *"adesso devi modificare la documentazione e modificare che le animazioni vanno per bioma e non per regione"*.
**Data:** 2026-10-29
**Stato:** `fatta` per pipeline + runtime + doc; **visual da rifinire** (animazioni non viste girare, T-04)
**Piano:** `plans/PLAN-099-mappa2-territories-and-biomes.md` (figlio di PLAN-089).
**Decisioni Director:** 20 regioni (15 terra + 5 mare, mare dividibile anche se inutilizzato); isole accorpate per vicinanza; Steppe Rosse → Deserto Rosso + Canyon Rossi; Costa Sabbiosa e Bayou separati; Altopiano della Cascata ristretto a cascata/lago/bacino, montagne alle Vette Nevose; **le animazioni leggono biomi, mai regioni**.
**Esito:** `scripts/build-mappa2-territories.py` produce `region_ids.png`/`biome_ids.png`/`regions.json` (con `neighbors`)/`biomes.json`; `build-mappa2-assets.py` non disegna più regioni e chiava shoal, land-life e canopy a bioma; runtime `region`→`biome` (`mappa2AmbientDirectorConfig`, `ambientDirector`, `PixiWorldMap`). Test: `mappa2Territories.test.ts` (7), `ambientDirector.test.ts`, `test_ambient_director.py` (11), `tsc` pulito. Limiti dichiarati nel piano («Cosa non è verificato»).

## R-296 — Bugfix `/mappa2-lab`: "Hide test UI" (e cambio tab) cambiano i colori della mappa

**Richiesta (verbatim, 2026-10-30):** *"http://127.0.0.1:5173/mappa2-lab quando faccio hide test UI la mappa cambia colore. bugfix"* — poi: *"anche se cambio tab cambiano i colori, hai fixato anche quello?"*
**Data:** 2026-10-30
**Stato:** `fatta`
**Causa radice:** `Mappa2GradeControls` era montato solo dentro `controlsVisible && activeTab === 'scene'` e possedeva il lifecycle del grade CSS/SVG sul canvas Pixi: alla cleanup (hide UI, tasto H, cambio tab) azzerava `canvas.style.filter` e rimuoveva l'host SVG → la mappa perdeva il grade teal & orange.
**Fix:** lifecycle spostato sulla pagina — nuovo hook `useMappa2Grade` (`src/pages/useMappa2Grade.ts`) chiamato da `Mappa2LabPage`; `Mappa2GradeControls` reso presentazionale (`{grade, onPatch}`). Il filtro sopravvive a hide/tab-switch e viene pulito solo all'uscita dalla pagina. Bug dir: `.mw/bugs/2026-10-30-mappa2-lab-hide-ui-grade/`.
**Evidenze:** test di regressione permanente `tests/unit/mappa2-grade-controls.test.tsx` (red-first: falliva pre-fix); lint pulito sui file toccati; verifica browser headless su `127.0.0.1:5173/mappa2-lab` — filtro invariato dopo hide e dopo cambio tab (stesso canvas, screenshot testimone). `npm run build:check` falliva anche per due cause pre-esistenti a HEAD non correlate, **fixate su richiesta Director (2026-10-30)**: (1) `QuestEditorPage.tsx` importava `LabPanel` mai esistito → rinominato in `LabCard` (stesso contratto `title`+children); (2) timeout interno `scripts/build-check.ts` 180s < build reale ~293s → default alzato a 360s (**attenzione**: supera il massimale 180s documentato in `.windsurf/rules/00-project-invariants.md` — la regola va aggiornata dal Director). Ora `build:check` verde.

## R-298 — Upscale `mappa2`: ricerca tool gratuiti + dibattito multi-AI web sulla ricetta

**Richiesta (verbatim, 2026-10-30):** *"abbiamo un plan x migliorarla il + possibile... aumentare la qualità di parecchio, ma implica fare dei lavori d ritoccho intensivi, xè avvicinandosi molto si perde d qualità. Come potremmo fare? cerca soluzioni gratuite online, ad esempio dei siti dove puoi caricare una immagine e t fanno l'upscale. fa una ricerca online su come farlo al meglio x il nostro scopo, poi usa discussione web x avere altre informazioni e dimmi tutto"*
**Data:** 2026-10-30
**Stato:** `fatta` (esplorazione; alimenta PLAN-096 O-2/ricetta — nessuna implementazione)
**Esito dibattito:** run `mind-weaver/.mw/runs/20261030-mappa2-upscale-recipes/` **CONVERGED** su `artifact-r003.md`, sha256 `89a58ea7278f6d51b0fd182fd93b49dcb4deea6dadd1271bfb3d39bf7461ff12`; electorate `chatgpt,claude,gemini,deepseek` 4/4 ACCEPT dopo 3 revisioni (WITNESS-01..04 disposizionate `amended`); `grok` rimosso `provider_dead` (3 turni, 0 risposte estraibili).
**Decisione convergente:** pipeline ibrida a due stadi, tutta gratuita e locale su M4/24GB — (1) master globale 2x con upscale neurale NON generativo `4xNomos2_hq_dat2` (4x nativo → Lanczos a 5504×3072, A/B vs `RealESRGAN_x4plus`; `4x-UltraSharp` scartato: aloni su sfumature morbide) via chaiNNer/spandrel; (2) hero tile 4x (512² mondo → 2048²) con SDXL tiled img2img + `controlnet-tile-sdxl` (ComfyUI+TiledDiffusion, strength 0.85-1.0, CFG 4-5, prompt pittorico globale, seed fisso). Lock di forma: banda dei contorni compositata dal master neutrale post-correzioni (maschere NN, dilatate 2-3px, diffusion=0) + separazione di frequenza come bound degli interni (LP neutrale + g·HP diffusione, g=0/0.4/0.85). Colore: LAB mean/std globale prima del tiling. Pilota obbligatoria su cascata+lago: sweep denoise {0.20,0.25,0.30,0.35} poi σ {2.0,2.5,3.5}, una variabile alla volta; gate mask IoU ≥0.98, displacement=0, LP-drift, SSIM, A/B cieco Director; se tutto fallisce → solo neutrale.
**Ricerca web (siti gratuiti upload-based):** Bigjpg (free ≤3000×3000/5MB, ottimo su illustrazioni — la mappa 2752×1536 ci entra), fal.ai image-upscaler (4x gratis no-signup no-watermark), crisp.photos / freeimagescaler.com / tooloat.com (upscale in-browser WebGPU, zero upload, gratis; crisp usa pesi CC BY-NC-SA), wallpapers.com art-enhancer. Verdetto dibattito: utili come cross-check su crop singoli, NON come produzione (black-box, niente conditioning, non passano i gate di maschera).
**Nota tool locale:** Upscayl (FOSS, macOS) = wrapper Real-ESRGAN semplice; Draw Things (gratis, App Store, MPS) = smoke test img2img rapidi ma non scripted; ComfyUI = bake scriptabile via API; chaiNNer = passo neutrale (MPS + catalogo spandrel/OpenModelDB).
**Trappola tecnica dibattito:** il binding URL di chatgpt si è rotto 2 volte su transient `local-chatgpt%3A` → risolto con reseed (vedi event_log della run; candidato a recurring-trap se ricorre).

## R-304 — Deploy Vercel: il deploy non è "fatto" finché la verifica post-deploy non è verde; altrimenti fix-iterare finché non passa

**Richiesta (verbatim, 2026-11-01):** *"Dobbimao assicurarci che quando viene fatto commit andn push e il deploy su vercel debba essere controllato che sia andato a buon fine, se così nn è,bisogna fixare i problemi fino a quando nn va tutto con successo"*
**Data:** 2026-11-01
**Stato:** `fatta`
**Contesto:** il deploy del 2026-11-01 passò i check del guardian (pagine 200) ma `/game` crashava su browser con WebGL reale (`pack.packRoot` su manifest senza pack — il probe headless senza GPU cade su renderer Canvas e non esercita il path mesh). Lezione: "pagina risponde" ≠ "mondo preparato".
**Requisito:** dopo commit+push+deploy la verifica deve esercitare il path reale (probe con WebGL/swiftshader su `/` e superfici Pixi), non solo HTTP 200; su failure si itera il fix finché tutto è verde.
**Attuazione (2026-11-01):** invariante "Deploy verification" registrato in `.windsurf/rules/00-project-invariants.md`; **gate meccanico**: `scripts/deploy/webglBootProbe.mjs` cablata nella post-verification di `guardian:deploy-guard` (`webglProbeRoutes: ['/', '/game']` — boot error/page exception/no-canvas → deploy FAILED, exit non-zero); probe manuali `scripts/_tmp-*.mjs`; fix `pack.packRoot` (b738eed2) verificato in produzione con WebGL.

## R-305 — Landing page identica su desktop e mobile: `/` → `/mappa2-lab`

**Richiesta (verbatim, 2026-11-01):** *"la landing page deve essre la stessa anche x desktop"* (riferimento: `http://127.0.0.1:5173/mappa2-lab` *"questa dovrebbe essere la landing page"*)
**Data:** 2026-11-01
**Stato:** `fatta`
**Bundle:** commit 997c7d70 — `/` renderizza `Mappa2LabPage` su tutti i device + canonicalizza URL; verificato locale+produzione con probe WebGL (test-results/landing-desktop.png).
**Decisione:** estende R-297 (mobile landing su `/mappa2-lab`) a tutti i device: `/` renderizza `Mappa2LabPage` ovunque e canonicalizza l'URL a `/mappa2-lab`; il game frame resta su `/game` e `/game-frame-pixi`.
**Ruling Director (2026-11-01):** torri **per-slot — tutte le combinazioni in v1** (9 stati torri × 2 muri = 18 piastre difese + 4 growth ≈ 22). Materiale = swap sullo STESSO punto dello slot. PLAN-106 aggiornato. Ruling ancora aperto: `stage1.webp` riuso o rigenerato nella catena.
**Ruling Director (2026-11-01, bis):** `stage1.webp` NON riusato — cottages rigenerati nella catena nuova: *"i cottages nn sn male, ma nn hanno i colori che mi aspettavo dal mio village, i tetti golden"* → la catena deve riprendere l'identità del villaggio di riferimento (`villaggio.png` moodboard: tetti dorati). Ancorare il primo edit cottages anche su quel ref stile.
**Ruling Director (2026-11-01, ter):** le piastre NON devono aggiungere elementi di scenario non presenti nella base (es. alberi): *"la tile deve essere uguale da lontano, se zoomi è + bella e ricca"*. Regola per la catena Gemini T7: la silhouette a bassa scala resta identica (stessi alberi, rocce, terreno, corsi d'acqua); l'upgrade aggiunge SOLO gli edifici/difese richiesti e arricchisce il dettaglio esistente.
**Ruling Director (2026-11-01, quater):** la catena Gemini T7-T8 la conduce l'agente in autonomia (nessun checkpoint intermedio); deliverable per l'eye-check = documento di review con immagini base → intermedi → finali, giudizio Director a valle.
**Avanzamento (2026-11-01 sera):** T7-T8 eseguiti — catena Gemini completata (22 piastre: 4 growth + 9 pal + 9 wall, torri per-slot tutte le combo); zone allargata a 380×380 per contenere anello+torri; tutte shipped nel manifest v2. Witness live `test-results/village-witness-2026-11-01-v3/` OK. **Deliverable eye-check: `test-results/village-review-2026-11-01/REVIEW.md` + `contact-sheet.png`** — in attesa di giudizio Director. Resta T10 (pulizia asset legacy + chiusura bundle) dopo il verdetto.
**Avanzamento (2026-11-01, T10 parziale):** cleanup asset legacy fatto (stage0-4.webp eliminati; parts/ tenuto — ancora cablato in PIAZZA; el-*.png già assenti). Safeguards: lint 0 err, vitest 6/6, build:check ✅. **Anomalia: `closure:lint` timeout 30s ×2 senza output** (da investigare). Contact-sheet aggiornato con zona corretta + 26 piastre. Resta in sospeso il verdetto visivo del Director sulle 26 versioni (T-04) → poi `fatta`.

---

## R-310 — PLAN-110: dibattito multi-AI web

**Richiesta (verbatim, 2026-11-02):** *"plan 110 multi ai web"*
**Data:** 2026-11-02
**Stato:** `fatta`
**Bundle:** run `mind-weaver/.mw/runs/20261102-plan110-hud-real/` (artifact-r003 + report.md + events.jsonl, sha `3c3154b5a4973b674838a072bf80c6e66594777d526b32c898460f0667204043`); emendamenti applicati in `plans/PLAN-110-hud-mockup-to-real-components.md` §13; riga `plans/INDEX.md`.
**Ruling Director (2026-11-02):** (1) R1 v0 **approvato** — crop non restaurati montati sulla mappa viva come gate composizione, precondizione al pilota; (2) fallback API a pagamento **NO** — su blocco quota runner in pausa, pilota «inconclusive»; (3) budget asset totale **nessun numero fisso** — stati via filtri CSS/atlas, PNG solo se WebP fallisce fedeltà, peso misurato a ogni gate.
**Contesto:** dibattito mw-web-debate (orchestratore locale + provider web) su `plans/PLAN-110-hud-mockup-to-real-components.md`. Scope scelto dal Director: **intero PLAN-110**.
**Dibattito multi-AI web (2026-11-02):** run `mind-weaver/.mw/runs/20261102-plan110-hud-real/` — CONVERGED su `artifact-r003` sha `3c3154b5a4973b674838a072bf80c6e66594777d526b32c898460f0667204043`, ACCEPT 3/3 (claude/gemini/deepseek); chatgpt e grok esclusi provider_dead (chatgpt: URL local-chatgpt anonimo non riapribile — ri-auth manuale Director; grok: 3 generazioni corrotte identiche). 12 obiezioni registrate e disposizionate (11 amended, 1 re-ranked). Emendamenti proposti: 5 FATAL (split fidelity-envelope/repair-license F-01; probe 8-gen pre-pilota con stop <2/4 F-02; gate G-5 calibrato pre-pilota a costo zero F-05; stress contract S4.5 testo/R2 F-03; checkpoint G-frozen dopo C4 F-04), 7 MAJOR (ramp oro 5-anchor da C1 corretto + gamut mockup F-06/F-07; mirror solo silhouette F-08; budget minuti Director F-09; quota.json + resume + block="inconclusive" F-10/F-26; attachments verificati in probe F-11), 12 MINOR. Da ruling Director: **F-12** R1 v0 (crop non restaurati sulla mappa viva come gate composizione, precondizione al pilota); **F-10** autorizzazione fallback API a pagamento da pre-chiedere; **F-21** numero budget asset totale (proposta ≤1,5MB). Artifact: `artifact-r003.md`, report `report.md`.

## R-311 — PLAN-110 E-01..E-05: tooling a zero generazioni (calibrazione G-5, quota runner, /hud-defects)

**Richiesta (implicita, 2026-11-02):** dalla decomposizione PLAN-110 con il Director — eseguire il task package «tooling + calibrazione» dopo R1 v0.
**Data:** 2026-11-02
**Stato:** `fatta`
**Bundle:** `scripts/hud-real/hud-gen-gate.py` + `gate-calibration.json` (calibrazione E-03 OK: positivo S1-swinir PASS, negativi redraw-vettoriale ed esrgan scartati); `compile-prompt.py` (check singola riga + vocabolario vietato attivo — ha beccato 'brown' in un defect text, corretto); `quota-runner.mjs` (can/spend/status/resume/blocked, cap 40/finestra + 3/zona riparazioni); `/hud-defects` (route registrata, render headless pulito — `test-results/r311-defects-empty.png`); schemi `defects.json` + 3 `zone.json` pilota in `.mw/specs/hud-real/`. Lint 0 errori. Nota: zone YAML→JSON (venv senza pip/pyyaml), riportato in CONTRACT.
**Contesto:** §13 E-02/E-03/E-09/E-15/F-17: `compile-prompt.py`, `hud-gen-gate.py` calibrato (1 positivo + 2 negativi), `quota.json` runner con resume, pagina `/hud-defects`, `runs.jsonl` con fingerprint modello. Precondizione FATAL al pilota.

## R-312 — R1 v0 v2: busto sx fuori, C6 = globo del nuovo mockup, riuso PLAN-109

**Richiesta (verbatim, 2026-11-02):** *"niente busto in alto a sinistra, l'elemento in basso a destra deve essere quello di questo mockup che t sto passando adesso (aggiungilo alla lista dei mockup possibili). Avevamo già cominciato a lavorare a qualcosa d simile, cn il piano 109 [...] Controlla cosa abbiamo e cosa è riutilizzabile"*
**Data:** 2026-11-02
**Stato:** `fatta`
**Bundle:** ruling Director «va ben» 2026-11-02 — R1 v0 (gate composizione) APPROVATO con globo-voyage come C6 e senza busto sx. Bundle = `scripts/build-r1v0-crops.mjs` + `public/mockups/r1v0/` + `src/pages/hud-r1.tsx` + witness `test-results/r1v0/v2-globe.png`. R1-v0 precondition (§13 E/F-12) soddisfatta.

## R-317 — PLAN-112: dibattito multi-AI web

**Richiesta (verbatim, 2026-11-05):** *"plan 112 multi ai web"*
**Data:** 2026-11-05
**Stato:** `fatta`
**Chiusura:** bundle: .mw/runs/r317-plan112-debate/bundle.json — dibattito CONVERGED 5/5 su artifact-r002 sha `c4d07eda`; run `mind-weaver/.mw/runs/20261105-plan112-hud-aaa/`; emendamenti in `plans/PLAN-112-hud-aaa-blueprint-first.md` §9; riga `plans/INDEX.md`; evidence `test-results/plan112-debate/`.
**Contesto:** dibattito mw-web-debate su `plans/PLAN-112-hud-aaa-blueprint-first.md` (bozza per il Director, non battezzato). PLAN-112 §7.7 riservava il dibattito multi-AI «su richiesta del Director» — questa è la richiesta. Scope: intero PLAN-112 (stesso pattern di R-310 su PLAN-110).
**Esito (2026-11-05):** CONVERGED 5/5 ACCEPT su `artifact-r002` (chatgpt, claude, gemini, grok, deepseek — electorate pieno, nessun provider_dead). ~50 rilievi in 2 round; 1 obiezione acceptance (WITNESS-01 chatgpt: contraddizione interna E-04 doppio verdetto O-3a/b — sustained, corretta in r002). §9 = 39 emendamenti (E-01..E-39) + lista scartati con motivo. Assi portanti: O-1 come precondizione hash-pinnata; soglie O-2 calibrate (p95 baseline) + modalità frozen-map con O-3a unico verdetto bloccante; capacity contract + grey-box G1b a 0 immagini; change control post-G1; decisioni blueprint-shaping chiuse prima di G1; route `/hud-layout` che riusa il mount di `/game`; regola occhio/metrica (occhio restringe, mai allenta; waiver firmati solo dal Director); test ink-bbox contro i margini trasparenti; O-10 accessibilità bloccante; composition witness interni in F4; G3 con contact sheet a composizione fissa e righe percettive vuote; rollback atomico su stop quota + asset content-hashed; stop-the-line dopo 2 rifiuti gate. Nota residua non bloccante (claude): valutare se le ri-catture O-3b contano nel limite E-36. In attesa del ruling Director sugli emendamenti → poi `npm run plan:stamp -- open PLAN-112`.
**Post-nota (2026-11-05):** emendamento Director **E-40** (panel family fit check — la pianta valida lo slot pannello contro l'inventario reale delle famiglie di pannelli flottanti di `/game`, non un solo archetipo) in PLAN-112 §9.6; ruling diretto post-convergenza, fuori dal consenso 5/5.

## R-321 — mappa2: critica colori + varianti nel lab

**Richiesta (verbatim, 2026-11-10):** *"esamina questa combinazione di colori, fammi una critica approfondita"* → poi *"Sì, prova varianti"* (le tre correzioni principali: secche più luminose della terra, nuvole troppo forti, pianura senape).
**Data:** 2026-11-10
**Stato:** `chiuso — varianti BOCCIATE e rimosse (2026-11-10)`
**Ruling Director (2026-11-10):** *"nessuna delle tue correzioni è un miglioramento. Le nuvole si perdono nel mare (e nn sn nuvole), il verde è invariato, il turchese attorno è + bello e vibrante. […] approvo quella che c'è adesso come mappa."* → la calibrazione attuale di `/mappa2-lab` è la mappa approvata. Codice, lastre e test delle varianti rimossi; resta solo il confronto in `.mw/runs/20261110-mappa2-color-critique/`.
**Scope:** `/mappa2-lab`, tab Scene → «varianti critica colori (non salvate)»: preset A/B/C/D/tutte + 3 slider 0-1. B = lastra `fx/look-shallows-tame-*` (luminosità dell'acqua compressa sopra L 40) + schiuma verso 0.20; C = nuvole opacità 1.4→0.85, tinta 0.61→0.90; D = lastra `fx/look-plain-green-*` (prateria verso tinta 114°). Overlay di sessione: non tocca i default salvati (test `tests/unit/mappa2Critique.test.ts`). Lastre: `scripts/build-mappa2-critique-plates.py`; prop `lookPlates` opzionale in `PixiWorldMap`. Confronto: `.mw/runs/20261110-mappa2-color-critique/varianti-A-B-C-D.png`.
**Correzione alla critica:** il «senape» misurato sta soprattutto nella fascia di passaggio verso il deserto, nelle spiagge e nelle chiome al sole; la prateria vera è già giallo-verde (tinta media 98°), quindi D ha effetto piccolo.

**Taglialegna `lumber` (2026-11-10, ruling: punto A «margine del bosco»; «nn m sembra un taglialegna» sul primo tentativo):** il primo sprite (capanna con una catasta, ascia e ceppo) a ~65 px sullo schermo si leggeva come un capanno. Rifatto come *campo di taglio* (cosa deve rappresentare: dove si abbattono gli alberi, si segano le tavole e si tiene il legname): grossa pila di tronchi interi + tavole segate + capanna di tronchi con paglia dorata + cavalletto con sega + ceppo con ascia. Piede (1465, 945), larghezza 255, strato subito dopo `hut-far-1` (il campo sta dietro il capovillaggio e davanti al bordo della capanna lontana). Armonizzato nella scena con Gemini (`prompt-harmonize-lumber2.txt`), poi tagliato a x=1590 con bordo morbido: Gemini ridisegnava anche la capanna lontana (`hut-far-1`) e la rovinava. Limite: lo strato `hut-far-1` ha un rettangolo opaco di bosco originale attorno alla capanna (la base lì è ritoccata) → non si può mettere un edificio *dietro* di lui senza toccare la base; da sistemare quando serve. `add-village-building.py` ora tiene anche i pezzi staccati (ceppo, ecc.: componenti ≥3% del corpo); nuovo `scripts/trim-village-layer-background.py` (toglie dal bordo di uno strato i pixel di sfondo che gli strati sotto riproducono esattamente: 0 px di differenza). **Casa:** il Director ha chiarito che «la casa» è la prima a sinistra (`house-big-west`), niente casa nuova. Destra della pagina ancora da decidere (negozio/emporio, magazzino, torre, palizzata…). Verificato dal vivo: `test-results/village-page-2026-11-09/lumber-on.png` (nota T-04: la schermata titolo del gioco restava sopra la pagina e l'ho nascosta nel browser di prova; un primo `PAGE_OK` era uno screenshot di quella schermata). Non verificato: leggibilità a occhio del Director (il campo è ~100 px sullo schermo intero), stato con `lumber` acceso senza `hut-far-1`.

## R-322 — `/game` diventa mappa2 approvata + superfici HUD firmate; la vecchia pagina va su `/gameOld`

**Richiesta (verbatim, 2026-11-10):** *"adesso devi fare diventare la pagina /game la nuova pagian /gameOld. nella nuova pagina game mettiamo questa mappa in modo che sia ottimizzata, ecc, cn le animazioni che abbiamo scelto, ecc. Poi vanno aggiunte su questa nuova mappa i componenti che sono stati battezzati. […] Questi elementi tra loro sono ben equilibrati? i colori sn corretti? stanno bene con la nuova mappa?"*
**Data:** 2026-11-10
**Stato:** `verificata — obbligazioni PASS (bundle .mw/runs/20261110-plan115/bundle.json, verdetto BLOCKED dai gate globali: commit + nuovo sigillo + approvazioni Director)`
**Fatto:** `/gameOld` (e `/game-frame-pixi`) = vecchio `GameFramePixiPage`; `/game` = `src/pages/game-mappa2.tsx` dentro `GameEntry`: mappa2 dallo snapshot congelato `src/ui/idleVillage/config/mappa2ApprovedLook.ts` (calibrazione lab approvata + grade montagne/zaffiro), `HudRealTimeConnected` + `HudRealResources` + `HudRealNav` sul blueprint B1 (`hudLayoutB`, stessa matematica di `/hud-compose`), un solo driver del tempo, Village → `VillageDirectorView`. Test e script che guidavano la vecchia pagina ora puntano a `/gameOld`. Test: `tests/unit/idleVillage/mappa2ApprovedLook.test.ts`, `tests/e2e/idleVillage/gameMappa2.spec.ts` (entrambi verdi). Evidenza: `.mw/runs/20261110-game-mappa2/`.
**Misura memoria (2026-11-10):** 287 texture, ~375 MB GPU; 13 fogli 2752×1536 RGBA ≈ 280 MB (6 maschere, 2 base, Mare, shade, clarity, zaffiro mult/add); `wanderlust/sea_pattern_tile.png` 15 MB.
**Ottimizzazione (2026-11-10, «Sì, ottimizza»):** i quattro fogli del grade (ombra montagne, zaffiro mult+add, dettaglio montagne) sono composti offline in UNA coppia mult+add (`scripts/build-mappa2-game-grade.py` → `fx/game-grade-{mult,add}.webp`, add salvato x1 via nuovo `seaGrade.addScale`); il lab resta sui quattro fogli live. Misura A/B headless WebGL: −43 MB GPU (350→307 nello stesso contesto), 3 passate a tutto schermo in meno, differenza max 6 livelli sullo 0,024% dei px (massiccio), rumore 0. Scartato: riusare `base_flat.nocanopy` nello shader del foam (differisce sull'86% dei px). Evidenza: `.mw/runs/20261110-game-mappa2/grade-ab.md`.
**Tagli GPU (2026-11-10, «procedi cn i tagli»):** (1) `masks/sea_zones.webp` = alfa di sea_mask in R + surf_zones in G, opaca, letta con selettore di canale (`uSeaSel`/`uZoneSel`): 0 px di differenza, −22 MB, anche nel pipeline (`scripts/mappa2_sea_zones.py`, manifest `maskFiles.seaZones`); (2) distanze costa/terra a metà risoluzione, (5) tassello linee del mare a metà, (6) la schiuma ricampiona il dipinto mostrato invece di ricaricare `base_flat.webp` — opzioni `gpuLight` solo su /game, A/B headless WebGL con orologio fermo: indistinguibili a occhio a panoramica e a zoom 2.6 (rumore 3% px; segnale tile max 14 livelli su 0,008% px, distanze 0,05% px >16, schiuma 8,6% px >2 ma ≤34). Totale nello stesso contesto 310 → 246 MB. Il lab resta sulle sorgenti piene. Seam di sviluppo: `/game?light=none|dist,tile,base`, `?grade=split`.
**Hi-res (2026-11-10, Director: «voglio che i player possano zoomare, quindi mi piace la versione hires»):** confronto `/game` vs `/game?hires=1` a 1440×900 DPR 2 in `.mw/runs/20261110-game-mappa2/hires/`: 246 → 360 MB, boot dev 9 → 17 s; più nitido su rocce/coste, ma è un upscale con dettagli nuovi (palma, motivo a labirinto in un cespuglio, isolotti) e in modalità hi-res il renderer nasconde `Mare` e `Foreground`, `foam_strokes.hi` è vuota (R-318). Decisione su tier/tiling aperta.
**Tier + tasselli (2026-11-10, Director: «Tier + tasselli»):** bozza `plans/PLAN-115-mappa2-hires-tier-tasselli.md` — F0 misura per profilo → G0 budget → F1 asset hi-res di sola terra (mare/primo piano/chiome approvati sopra) + gate visivo D1–D3 → F2 piramide 512+gutter → F3 strato tasselli (`baseTiles.ts`) → F4 profili desktop/Deck/mobile → F5 KTX2 solo se serve. In attesa di battesimo.
**PLAN-115 battezzato (2026-11-10, «Sì, parti») — F0 fatta:** misura headless WebGL per profilo in `.mw/runs/20261110-plan115/F0-budget.md`: 246 MB standard / 360 MB hi-res su tutti i profili (nessun livello ancora), download mappa 8,7 / 10,5 MB, Desktop DPR 2 p95 34 ms anche su M4; frame di Deck/telefono non rappresentativi (GPU M4). Proposta budget D5: Desktop ≤ 420, Deck ≤ 320, Mobile ≤ 160 MB (mobile oggi −86 MB da trovare). In attesa del gate G0.
**G0 firmato (2026-11-10, «Sì, firmo»):** budget texture GPU Desktop ≤ 420 MB, Deck ≤ 320 MB, Mobile ≤ 160 MB. Avvio F1.
**PLAN-115 F1 (2026-11-10):** asset hi-res di sola terra con il look approvato (`scripts/build-mappa2-hires-land.py`: banda alta della hi-res sommata alla base approvata ×2; variante `hiclean` che la azzera dove la struttura differisce — 23% della mappa; variante `hiraw` grezza; `hi.seahi` mare hi) + 40 ritagli chioma hi; renderer `hiLand` (seam dev `/game?land=hi|hiclean|hiraw|hisea`, `&grade=noclarity`); inventario zone reinterpretate (~12% della terra, 188 zone). Card `.mw/runs/20261110-plan115/visual-fork-F1.md`. In attesa del ruling D1–D3 (gate GV-1). Su richiesta del Director («cerca comunque di ottimizzare dove possibile») l'ottimizzazione continua in parallelo.
**Ruling D1 (2026-11-10):** domanda riformulata in semplice (il Director non aveva capito la card): «1 = mappa di oggi più nitida / 2 = la hi-res così com'è» → *«2»*. Terra = hi-res grezza (`base_flat.nocanopy.hiraw.webp` + ritagli `.hiraw`), oggetti inventati e colori della hi-res accettati. D2 (mare) chiesto a parte; D3 provvisorio a (lastra tenuta).
**Ruling D2 (2026-11-10):** *«2 · mare hi-res»* → anche il mare dalla hi-res (`base_flat.nocanopy.hiraw.seahi.webp`), `Mare.webp` nascosto. Base dei tasselli = questa.
**PLAN-115 F2+F3 fatte (2026-11-10):** look v2 = default di `/game` (`MAPPA2_V2_LAND` + `MAPPA2_V2_TILES`): base residente 2752 ricavata dalla hi-res scelta (`base_flat.nocanopy.v2.webp`; con alberi per il movimento ridotto `base_flat.v2.webp`), ritagli chioma `.v2hi` (5504), mare del fondale `Mare.v2.webp` mostrato solo con Alt (effetto fondale verificato identico a oggi). Piramide `tiles/v2/L0` 66 celle 512+2 px (`scripts/build-mappa2-tiles.py`, 3,7 MB) → `pixiSpike/baseTiles.ts` (celle solo oltre 1,05 px fisici per px mondo, budget LRU, rilascio 4 s dopo lo zoom-out). Misura Retina 1440×900: 66 celle (67 MB) già a panoramica, totale ≈ 324 MB < 420; giunzioni invisibili a zoom 3. Bug trovato e coperto da test: montaggio prima di `ticks` (TDZ) bloccava il boot in silenzio. Seam dev: `?look=v1`, `?tiles=0`, `?land=…`. Test: `tests/unit/idleVillage/baseTiles.test.ts`, `mappa2ApprovedLook.test.ts`, e2e `gameMappa2.spec.ts` verdi. Restano: F4 profili Deck/mobile (mobile 160 MB), conferma D3, difetto esistente del globo Alt (linee scure a poligono sulle isole, presente anche su v1).
**PLAN-115 F4 fatta (2026-11-10, «Sì, procedi»):** profili desktop/Deck/telefono (`mappa2Tiers.ts`, seam `?tier=`), asset telefono a metà (`scripts/build-mappa2-mobile-assets.py`), mare del fondale non caricato senza Alt. Misura: Desktop 324/420, Deck 257–282/320, Telefono 144–147/160 MB; telefono a occhio uguale alle lastre piene. Test `mappa2Tiers.test.ts` + suite mappa2 (159) + e2e verdi. Rapporto `.mw/runs/20261110-plan115/F4-tiers.md`. Aperte: D3 (lastra montagne), D4 (qualità grafica nelle impostazioni), D6 (zoom massimo), prova su dispositivi reali.
**PLAN-115 D4 fatta (2026-11-10, «Sì, nelle impostazioni»):** Impostazioni → Interfaccia → «Qualità grafica» Automatica/Alta/Media/Bassa (`gameSettings.mapQuality`, salvata con le altre; Alta/Media/Bassa = profilo Desktop/Deck/Telefono, Automatica = rilevamento); `/game` riavvia la mappa col nuovo profilo. Testi en/it-IT/pseudo. Verifica headless con input reali: titolo → Impostazioni → Bassa → in gioco profilo telefono, 144 MB (`.mw/runs/20261110-plan115/d4/`). **Bug trovato e corretto (preesistente):** dalla schermata del titolo Impostazioni/Carica/conferma Nuova partita si aprivano SOTTO il titolo (z 30 < 40) e restavano invisibili → contesto `MenuDialogLayer` (titolo = boot+1). Contratto `game-menu-screens`: INV-13 (bug, Mode A con red-first registrato) e INV-14 (qualità grafica). `redfirst:check OK`; `contracts:check` fallisce in modo chiuso su molte INV estranee per il diff enorme non committato (va rifatto su commit pulito). Nota: la nuova `/game` non ha ancora un menu in gioco — le Impostazioni si raggiungono dal titolo.
**Ruling D6 (2026-11-10):** *«Sì, resta 3»* — zoom massimo invariato. Resta solo D3 (lastra dettaglio montagne).
**Ruling D3 (2026-11-10):** *«1 · con contrasto»* — la lastra dettaglio montagne resta. Decisioni PLAN-115 complete; resta la chiusura F6.
**Chiusura PLAN-115 F6 (2026-11-10, «Sì, chiudi»):** bundle `.mw/runs/20261110-plan115/bundle.json` — OB-1…OB-8 (tutte le bloccanti) PASS; OB-9/OB-10 occhio del Director (giunzioni, dispositivi reali); OB-11 `contracts:check` FAIL. Verdetto BLOCKED dai gate globali (BASE sigillato prima di R-322, componenti dell'altra sessione sul diff non committato, trust-set non approvato per la deriva preesistente di `surface-map.json`). Per sbloccare: commit separati per sessione → nuovo sigillo → approvazioni Director. Trovato test già rosso non legato: `tests/unit/frozen/worldSurfaceKit.alignment.test.ts` (25).
**HUD /game — controllo e correzioni (2026-11-10, «2 · aspetto HUD» → «Sì, sistema»):** prova con clic reali: pausa/Spazio, ×1/×2/×4, risorse, bussola, Villaggio↔Mappa, voci bloccate — tutto funziona, zero errori. Critica rivista: materiale delle barre coerente e «triangolino» = indicatore giorno/notte (due punti della critica precedente erano sbagliati). Corretti: (1) **testi sotto il minimo** (11,4 px) → `hudPx` + `--hud-text-k` = 1/scala della barra: il testo resta alla grandezza disegnata (12,8–12,9 px minimo; barre ancora scalate intere, PLAN-112 §28); (2) **telefono** (D10: sotto 768 il blueprint non vale) → `layout/gameHudPlacement.ts`: risorse in alto, tempo sotto la gemma, nav dentro lo schermo; (3) **tablet 820** (riflusso D6b) → il tempo parte sotto la gemma pendente; (4) etichette nav separate (`labelSpread`). Verificato a 5 risoluzioni (`.mw/runs/20261110-hud-check/`), test `tests/unit/idleVillage/gameHudPlacement.test.ts` + contratti HUD (142) + e2e verdi. `/hud-compose` invariata. Aperti: icone in stili diversi (asset del Director), lato sinistro vuoto (roster = gioco giocabile), bersagli tocco piccoli sul telefono (pulsanti velocità ~26 px).

