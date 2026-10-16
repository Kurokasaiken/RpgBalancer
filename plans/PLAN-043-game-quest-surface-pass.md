---
title: "PLAN-043 — /game, superficie quest: slot (bug di scambio, lucchetto, colori), preview quest, finestra della quest «Sterminio dei goblin», pulsanti, esiti, skill check, riesame della pagina"
status: in corso
baptized: 2026-10-16 (Director «il piano è finito, procedi», dopo la chiusura di PLAN-042)
owner: Mind Weaver
created: 2026-10-16
source_request: R-207
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md
  - RICHIESTE.md (esito R-207)
  - CURRENT_STATE.md
  - src/docs/docs/design/hud_component_guide.md
  - src/docs/docs/idle_village/quest_ui_component_guide.md (oggi superata in due punti, vedi §2)
  - src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md
  - src/docs/docs/plans/PLAN-058_hud_roster_unification.md (chiusura gate F1/F4/F5)
desiderata: nessuna nuova — lavora dentro v4, v11–v20, v23, v27 (+ deroghe R-199), v30 FROZEN
related: PLAN-036 (planner, completed), PLAN-040 (QuestRunWindow rev.3, in corso), PLAN-042 (Registro villaggio, proposed), PLAN-058 (HUD come il Roster)
---

# PLAN-043 — `/game`, superficie quest

## 0. Richiesta del Director (2026-10-16, verbatim)

> *"dobbiamo finire quel lavoro se nn è finito"* · *"c'è da riesaminare"* · *"chiuso tauri, direi"*
>
> *"Cosa importantissima: il componente della Preview Quest deve essere esaminato attentamente e riscritto al meglio, attualmente nn sn molto convinto di cosa è dove, ecc. Inoltre gli slot esteticamente nn m convincono tantissimo come colori cn questa nuovo setup d colori, e quando c'è una pg assegnato nn vedo + il coso sopra che lo blocca. E la funzione per swappare un pg assegnato da uno slot ad un altro slot (senza prima estarlo e farlo tornare al roster) o swappare due pg già assegnati a slot nn funziona."*
>
> *"Stesso discorso x il componente che mostra la quest vera (cominciamo da sterminio goblin). Attualmente i componenti interni sn strani, brutti, ecc (il 'Mini roster', la bag, ecc), c'è da lavorarci. I pulsanti sn tipo poco visibili, occupano una quantità di spazio nn corretta, e nn lo vedo abbastanza 'cinematografica', gli esiti nn m piace come sono comunicati, e vorrei un po' + tipo 'esperienza cinematografica'. Anche la presentazione dello skill check nn m fa impazzire, le proporzioni, ecc."*
>
> *"stiamo facendo anche il pulsante del villaggio e gestione degli edifici. aspetto che siano finiti i lavori sulle altre cose prima"* · *"sì, fai il piano"*

## 1. Goal, scope, non-goals

**Goal.** Portare la superficie quest di `/game` a un livello che il Director approva, in quest'ordine: prima ciò che non funziona (scambio tra slot), poi ciò che si vede male (lucchetto, colori degli slot), poi i due componenti da ripensare (preview quest, finestra della quest), poi il linguaggio trasversale (pulsanti, esiti, skill check, taglio cinematografico), infine un riesame completo della pagina.

**Scope.**
1. Slot del planner: bug dello scambio (slot→slot vuoto, PG↔PG), lucchetto visibile sopra il PG assegnato, colori nella palette Lacquer Atlas.
2. Preview quest (`QuestExpeditionDetail`): riesame dei contenuti («cosa è dove») e nuovo layout.
3. Finestra della quest (`QuestRunWindow`, prima quest: Sterminio dei goblin): componenti interni (mini roster, bag/belt, strisce, tile, scelte, header).
4. Trasversale alla superficie quest: pulsanti, comunicazione degli esiti, presentazione dello skill check, taglio cinematografico.
5. Audit dei componenti di `/game` e riesame finale della pagina.

**Non-goals (YAGNI).**
- Meccaniche del motore quest (`questRun.ts`, grafo, scenari, risoluzione): read-only, come in PLAN-040.
- Il board dell'astrolabio `DestinyAstrolabeV62` (kit frozen): si incapsula, non si modifica (quest_ui_component_guide §6).
- Villaggio ed edifici: appartengono a PLAN-042 e alla sessione del villaggio. Qui c'è solo il controllo d'integrazione finale (F7).
- Colore degli anelli del Sigillo: decisione aperta di PLAN-058, resta lì.
- Nuove quest, nuovi contenuti, audio (i suoni dello skill check restano `removeSounds`, PLAN-040 §5).

## 2. Stato di partenza (FACT, inventario 2026-10-16)

> Raccolto da codice e git, **non** da screenshot: va confermato a schermo in F0 (T-04).

**Lavoro in corso da altre sessioni sullo stesso worktree (T-13).**
- PLAN-040 (QuestRunWindow rev.3) è battezzato e in corso: i suoi file sono **non committati** — `QuestSkillCheckOverlay.tsx`, `QuestOutcomeToast.tsx`, `QuestRewardPopup.tsx`, `QuestCheckOptionsPanel.tsx`, `questOverlays.tsx`, `overlayStack.ts`, `questSkillCheckWarm.ts`, più `QuestRunWindow.tsx`, `QuestEpilogue.tsx`, `useQuestExpeditionSession.tsx` modificati.
- PLAN-042 (Registro villaggio) è `proposed`; `VillageScreenView.tsx`, `VillageSlotOverlay.tsx`, `villageBuildingsConfig.ts` sono modificati o nuovi.

**Preview quest.** `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx` (738 righe), montato da `useQuestExpeditionSession.tsx:881`, posizionato tra roster e registro (`gameFrameConfig.questDetail`, larghezza 680). Due lastre affiancate (PLAN-036): principale 460 px (header, obiettivo, tag, banner cinema 2.76:1, `ResidentSlotRack` 56 px, bisaccia 3×44 px + picker esterno, CTA «Invia spedizione» fuori scroll) e sidecar «Forecast» 340 px (stat chiave, copertura del loadout, chip di esito, BY MEMBER, WHY, intel).

**Slot.** `ResidentSlotRack.tsx` (892 righe) → `Slot.tsx` → `SlotV12Renderer.tsx` (678 righe, SVG).
- Lucchetto: il «heavy-bronze lock» (keyframe `bezelSlam`, layer 3 bezel/teeth, `SlotV12Renderer` :521-529) è disegnato **sotto** il ritratto, che è un div fratello `absolute inset-0 z-10` (:572-578). Spiega «non vedo più il coso sopra che lo blocca».
- Colori: SVG con hex/rgba scritti a mano (:337-357, :462-507); bordi e testo con `var(--slot-rack-*)` e fallback letterali (:469-517). Nessun token Lacquer Atlas.
- Scambio: **previsto dal codice.** Il token nello slot è trascinabile (`useDraggable`, id `slot-token:<slotId>`, `ResidentSlotRack.tsx:282-286`, `disabled: !enableSlotSwap || !slot.assignedResidentId`); `handleDragEnd` (`useQuestExpeditionSession.tsx:704`) chiama `planSlotSwap` (`questExpedition.ts:169`): slot vuoto = spostamento, slot occupato = scambio, entrambi soggetti all'idoneità. Esiste un E2E con input reali (`gameQuestFullFlow.spec.ts:176-202`). Il Director lo vede **non funzionare**: è un bug di runtime, da riprodurre.

**Finestra della quest.** `QuestRunWindow.tsx` (1293 righe) con interni nello stesso file: `PartyPips` :875, `BeatStage` :902, `CombatStrip` :1025, `Theater` :1144, `TimeBar` :1172, `PhaseTile` :1214, `NextTile` :1284. Companion: `QuestPartyRosterPanel.tsx` («mini roster»), `QuestBeltPlaque.tsx` (bag), `QuestLogPanel.tsx`. `BagStrip.tsx` è **orfano** (nessun import in `src`).

**Pulsanti.** Header: pillole `data-hud-controls` alte 26 px; scelte `data-skin="choice"` (griglia 24 px/1fr, bordo oro sinistro 3 px); bottoni di abbandono con stili inline (`QuestRunWindow.tsx:630-665`).

**Guardiani.** 18 componenti su 50 di `gameFrame/` + `rosterV2/` non sono coperti da `hudGuards.test.ts`, tra cui `QuestEpilogue`, `QuestRewardPopup`, `QuestOutcomeToast`, `QuestSkillCheckOverlay`, `QuestCheckOptionsPanel`, `questOverlays`.

**Documenti superati.** `quest_ui_component_guide.md` dice ancora che il toggle della bag sta accanto alle scelte (è nell'header, PLAN-040 T-002) e che l'astrolabio è agganciato al theatre (ora è in `#game-modal-root`).

## 3. Vincoli, desiderata e trappole

| Vincolo | Cosa impone a questo piano |
|---|---|
| v4 FROZEN | Pannelli flottanti, spostabili, riducibili, chiudibili; **nessun backdrop né modale bloccante**. Il «cinematografico» non può diventare uno schermo modale che blocca il mondo. |
| v23 FROZEN (Mission Planner) | La preview mantiene le zone PARTY / LOADOUT / OUTCOME, i delta live, la sezione WHY, il non-blocco. «Riscrivere» = nuovo layout e nuove gerarchie **dentro** queste zone (vedi D1). |
| v27 FROZEN (+ deroghe R-199) | Il theatre ospita, non rifà; niente auto-risoluzione; reward fuori dal theatre; companion chiusi di default; arte cinematografica, UI sobria «quasi da libro illustrato». |
| v11–v20 FROZEN | Materia e regole visive dell'astrolabio. |
| quest_ui_component_guide §6 | Astrolabio V62 canonico: si estende, mai si forka; il verdetto è sempre del motore. |
| PLAN-058 / `hud_component_guide.md` | Regola madre «sembra il Roster»; §6 layout e interazione (area cliccabile ≥ 32×32, scala 12/13/14/16/20/24, stati, tooltip 400 ms, checklist §6.12); §5b.7 la mappa non si muove per i pannelli. |
| Regola 16 (no finestre in primo piano) | **Ogni verifica a runtime è headless/background.** La finestra Tauri o qualsiasi finestra visibile è solo uno step manuale del Director. |
| T-04 | Ogni claim visivo si chiude con un testimone che vede (screenshot ingranditi), non con il diff. |
| T-05 | «Riscrivi la preview» su un componente governato da v23: prima D1 (patch o revisione), poi il codice; massimo ~200 LOC prima della prima verifica a schermo. |
| T-13 | Sessioni parallele sullo stesso worktree: niente prove mentre un'altra sessione scrive gli stessi file; un dev server per sessione. |
| T-03 | Ogni popover/menu dentro `data-hud-controls` sul contenitore che include il grilletto e il dropdown. |

## 4. Fasi e task

Un task per sessione, impegno indicato. Ogni fase si chiude con un **gate del Director** su screenshot headless. Un task inizia solo se la fase precedente ha il suo gate.

### F0 — Precondizioni e baseline (Opus, medio)

**T0.1 · Gate di partenza.** Verificare, senza modificare nulla: PLAN-040 chiuso (bundle PASS, file committati); PLAN-042 battezzato e implementato **oppure** esplicitamente rinviato dal Director; nessun altro piano attivo che tocchi i file del §2; Tauri chiuso. Se una condizione manca, il piano si ferma qui.
*Accettazione:* tabella condizione → evidenza (commit, bundle) in `test-results/plan-043/F0-gate.md`.

**T0.2 · Baseline a schermo.** Estendere l'harness esistente (`scripts/quest-theatre-playtest.ts` su `/quest-window-lab?seed=N`, già allargato da PLAN-040 T-000) per catturare, headless, a 1280×720, 1920×1080, 2560×1440: preview goblin e rovine (vuota, parziale, completa, CTA disabilitata/abilitata), slot (vuoto, assegnato, durante il drag, rifiuto), finestra della quest goblin in ogni fase (scelta, beat, check, toast, harm, fine, reward).
**Aggiunta del Director (2026-10-16):** *"vorrei anche vedere i componenti quando premi i pulsanti che aprono componenti (ad esempio la quest)"* — la baseline include ogni componente che si apre da un pulsante o da un tasto: menu di gioco, menu Pannelli, Roster, Eventi, Quest (finestra della quest in corso), Scheda eroe, Scorta del villaggio, Mercante, vista Villaggio e Registro, Director, Tuning, popover interni della quest (bag, party, log, opzioni del check).
*Accettazione:* foglio di contatto per stato + misura degli elementi fuori dalla placca.

**T0.3 · Audit automatico dei componenti.** Per ogni componente di `/game` (inclusi i 18 non coperti): letterali di colore e misura fuori token, testo < 12 px, contrasto testo/lacca ≥ 4,5:1, area cliccabile ≥ 32×32, icone fuori dal set inciso/dipinto, file orfani (`BagStrip`).
*Accettazione:* `test-results/plan-043/F0-audit.md`, una riga per componente con le violazioni misurate.

*Esito F0 (2026-10-16):* T0.1 `test-results/plan-043/F0-gate.md` — PLAN-040 e PLAN-042 chiusi ma **non committati** (F1 bloccato finché non c'è un commit di base). T0.2 `test-results/plan-043/F0-baseline.md` — 48 + 54 catture headless a 1280/1920/2560, 15 osservazioni; manca la finestra della ricompensa (run non finita entro 240 s) e la preview rovine a 1280. T0.3 `test-results/plan-043/F0-audit.md` — 64 componenti, 29 senza guardiani, 11 con colori letterali (292 occorrenze; i più carichi `PoiMatericV3_5`, `SlotV12Renderer`, `WanderlustRosterCardV2`, `ResidentSlotRack`), 7 con testo < 12 px, 2 con lucide-react, `BagStrip` orfano confermato. Contrasto e area cliccabile a runtime: non ancora misurati.

**Gate F0:** il Director vede baseline e audit e conferma l'elenco delle priorità.

### F1 — Bug dello scambio tra slot (Sonnet, medio)

**T1.1 · Riprodurre.** Con input reali (Playwright headless, mouse down/move/up, rispettando l'hold-to-drag introdotto il 2026-10-15), sul planner di **entrambe** le quest: (a) PG assegnato → slot vuoto; (b) PG assegnato ↔ PG assegnato. Annotare quale caso fallisce e dove.
Ipotesi da verificare, nessuna data per buona:
1. Catena `handleDragEnd(event) ?? …` in `game-frame-pixi.tsx:1183-1185`: un `false` («rifiutato») non è nullo, quindi il gestore successivo non viene mai chiamato. Se il gestore goblin risponde `false` a un evento della quest rovine, lo scambio rovine non arriva mai al suo gestore.
2. Conflitto tra hold-to-drag del medaglione e press-and-hold di estrazione dello slot (`ResidentSlotRack.tsx:447`).
3. `enableSlotSwap` non passato in qualche montaggio del rack.
4. Idoneità che rifiuta in silenzio (nessun feedback visivo).
*Accettazione:* test che fallisce oggi per ciascun caso rotto, con la causa provata.

**T1.2 · Correggere** la causa provata, più il feedback di rifiuto (cursore «rilascio no» di `hud_component_guide.md` §5c e un motivo leggibile, §6.5).
*Accettazione:* i nuovi test passano su goblin e rovine; `gameQuestFullFlow`, `gameQuestExpedition`, `residentXpAndSwap` verdi; l'estrazione con press-and-hold funziona ancora.

**Gate F1:** il Director prova lo scambio (step manuale, in browser o Tauri a sua scelta).

### F2 — Slot: lucchetto e colori (Sonnet, medio)

**T2.1 · Lucchetto sopra il PG assegnato.** Il layer bezel/denti (o un anello di blocco dedicato) va disegnato **sopra** il ritratto, non sotto, senza rompere il ghost del drag (portal z 10000) né l'estrazione.

**T2.2 · Colori Lacquer Atlas.** Gli slot dentro `/game` leggono i token (`--skin-hud-*`, bronzo/lacca) al posto dei letterali. `SlotV12Renderer` è condiviso: la nuova resa passa per una prop o uno scope (come `sigillo` in `PoiMatericV3_5`), le altre pagine restano identiche. File toccati aggiunti a `STRICT_FILES`.
*Accettazione F2:* screenshot ingranditi e campionamento pixel di vuoto/assegnato/drag/rifiuto su lacca, a 1280 e 1920; altre pagine che usano il renderer identiche (confronto prima/dopo); guardiani verdi.

**Gate F2:** sì del Director sugli screenshot.

### F3 — Preview quest (Opus progetta, Sonnet implementa)

**T3.1 · Riesame dei contenuti (Opus, alto).** Per ogni elemento della preview: a quale decisione del giocatore serve (chi mando, cosa porto, che rischio corro, parto?), in che ordine va letto, cosa è ridondante o fuori posto. Uscita: 2–3 layout alternativi come mockup (pagina artifact), ciascuno con le zone v23, misure secondo la guida HUD, una raccomandazione.
**D1 (Director):** quale layout, e se resta dentro v23 (patch) o serve una revisione della desiderata.

**T3.2 · Implementazione (Sonnet, medio).** Solo layout e presentazione: `useQuestExpeditionSession` e il motore non cambiano logica. Prima verifica a schermo entro ~200 LOC (T-05).
*Accettazione:* checklist §6.12 compilata; `gameQuestPlannerLayout`, `gameQuestExpedition`, `gameQuestFullFlow` verdi; screenshot a 3 dimensioni.

**Gate F3:** sì del Director.

### F4 — Finestra della quest: Sterminio dei goblin (Opus progetta, Sonnet implementa)

**T4.1 · Scheda per componente (Opus, alto).** Sul risultato di PLAN-040, per ogni interno — header, `PartyPips`, `QuestPartyRosterPanel` (mini roster), `QuestBeltPlaque` (bag), `CombatStrip`, `Theater`/`BeatStage`, scelte, `TimeBar`, `PhaseTile`/`NextTile`, `QuestLogPanel` — scopo, problemi misurati, proposta (tenere / rifare / unire / togliere), con mockup per quelli da rifare. `BagStrip` orfano: proposta di rimozione.

**T4.2 · Direzione cinematografica (Opus, alto).** Ricerca online e 2–3 direzioni concrete compatibili con v4 e v27 (nessun modale bloccante): rapporto immagine/testo, letterbox, tipografia del racconto, transizioni tra beat, ritmo dei reveal. Uscita: mockup e una raccomandazione.
**D2 (Director):** direzione cinematografica e schede di T4.1.

**T4.3 · Implementazione (Sonnet, medio)**, un componente per sessione, nell'ordine deciso in D2.
*Accettazione:* `questRunWindow.test`, `gameQuestLifecycle`, `gameQuestFullFlow` verdi; foglio per fase da T0.2 rifatto; nessun elemento fuori dalla placca.

**Gate F4:** sì del Director.

### F5 — Pulsanti, esiti, skill check (Opus progetta, Sonnet implementa)

**T5.1 · Sistema dei pulsanti della superficie quest.** Gerarchia primario / secondario / terziario, dimensioni, contrasto, spazio: una sola grammatica per header, scelte, CTA, abbandona, reward. Rispetta §6.4 (area ≥ 32×32, stati, disabilitato con motivo) e il Roster come metro.

**T5.2 · Comunicazione degli esiti.** Partendo da quello che PLAN-040 ha consegnato (`QuestOutcomeToast`, `QuestRewardPopup`), ricerca e 2–3 proposte coerenti con la direzione D2 e con DESIGN_PILLARS R2.4 (esito come carta che si rivela).
**D3 (Director):** linguaggio degli esiti.

**T5.3 · Skill check: presentazione e proporzioni.** Intorno al kit V62 (incapsulato, non modificato): dimensione e rapporto della board a 1280/1920/2560, cornice, posizione, legame con l'esito.

**T5.4 · Implementazione (Sonnet, medio)** di T5.1–T5.3 dopo D3.
*Accettazione:* foglio stati del check e degli esiti a 3 dimensioni; `questOutcomeToast.test`, `questRewardPopup.test`, `questCheckOptions.test` verdi; nessun pannello modale o backdrop (v4).

**Gate F5:** sì del Director.

### F6 — Villaggio ed edifici (fuori da questo piano)

Appartengono a PLAN-042 e alla sessione del villaggio. Questo piano non tocca i loro file. In F7 se ne controlla solo la coerenza con il resto della pagina.

### F7 — Riesame completo di `/game` e chiusura (Opus, medio)

**T7.1 · Riesame della pagina:** audit di T0.3 ripetuto, baseline di T0.2 ripetuta a 3 dimensioni, confronto prima/dopo, schede dei componenti aggiornate, coerenza con il villaggio (PLAN-042).
**T7.2 · Guardiani:** i componenti di `/game` coperti da `hudGuards` (o motivazione scritta per ciascuno escluso).
**T7.3 · Documenti:** `quest_ui_component_guide.md` (i due punti superati), `hud_component_guide.md`, `COMPONENT_MASTER_INDEX.md`, `CURRENT_STATE.md`, chiusura dei gate F1/F4/F5 di PLAN-058.
**T7.4 · Prova in Tauri:** step **manuale del Director** (regola 16), con elenco di cosa guardare.

## 5. Decisioni aperte (non prese da questo piano)

- **D1** — Layout della preview, e se resta dentro v23 (patch) o serve una revisione della desiderata.
- **D2** — Direzione cinematografica della finestra della quest; destino dei componenti interni.
- **D3** — Linguaggio degli esiti (dopo aver visto il risultato di PLAN-040).
- **D4** — Rimozione di `BagStrip` (orfano).
- **D5** — Chi esegue: questo piano assume Opus per progettare e rivedere, Sonnet per eseguire un task per sessione. PLAN-039/041 (R-204) misurano alternative multi-agente: se il benchmark le promuove, l'esecuzione delle fasi F1–F5 può cambiare.
- Il colore degli anelli del Sigillo resta in PLAN-058, non qui.

## 6. Verifica finale (misurabile)

Fine F7, tutto headless:
- E2E verdi: `gameQuestFullFlow`, `gameQuestExpedition`, `gameQuestLifecycle`, `gameQuestPlannerLayout`, `gameQuestReveal`.
- Unit verdi: `questRunWindow`, `questExpeditionBag`, `ResidentSlotRack.*`, `residentXpAndSwap`, `questOutcomeToast`, `questRewardPopup`, `questCheckOptions`, `hudGuards`.
- Nuovi test dello scambio (T1.1) verdi su entrambe le quest.
- Audit T0.3 ripetuto: zero violazioni non motivate sui componenti toccati.
- Foglio di contatto a 1280/1920/2560 di tutti gli stati di T0.2, con zero elementi fuori dalla placca.
- Evidence in `test-results/plan-043/` e bundle di chiusura.
