# F3 — Scheda: POI sulla mappa · Planner (POI detail) · Roster · Slot (Opus, 2026-10-20)

> Formato F2. Evidenze: `shots/poi-planner-f3/` (1440×900) e `shots/poi-planner-f3-1280/`. Drag fatti **solo con il mouse, senza hook** (a differenza della suite R-183, vedi §4). Legenda: **FATTO** · **FLAG** · **NON VERIFICATO**.

---

## 1. Cosa sono, per il giocatore

- **POI**: un sigillo sulla mappa dipinta che dice «qui c'è un'opportunità». Cliccandolo si apre il planner.
- **Planner** (POI detail): la tavola della spedizione. In alto il cartiglio con Pericolo, Ricompensa e Durata; sotto l'ordine di marcia (4 slot), la bisaccia (3 consumabili), il pulsante per aprire il magazzino, «Send expedition» / «Back to map»; a destra la previsione (successo, ferite, morti, chi rischia e perché).
- **Roster**: l'elenco dei residenti, da cui si trascinano i compagni negli slot. È il riferimento di stile di tutta la HUD (guida HUD §1).
- **Slot**: i castoni dell'ordine di marcia. Accettano, rifiutano o scambiano.

## 2. Dove vivono

| Pezzo | File |
|---|---|
| Marker POI | `components/gameFrame/MapQuestPoi.tsx` (usa `PoiMatericV3_5`), taglie `poiSigillo.ts`, reveal `questRevealSchedule.ts` |
| Planner | `quests/QuestExpeditionDetail.tsx` (1273 righe), cluster `QuestStageCluster.tsx` |
| Apri magazzino | `QuestExpeditionDetail.tsx:~906` `data-testid="quest-open-stash"`, label `gameFrame.village.openStash` |
| Roster V2 | `rosterV2/` (`DragTestContainerV2`, `WanderlustRosterCardV2`) |
| Slot | rack del planner, `slot-button-*`, `slot-token-*`, `data-drop-state` |

## 3. Come si presentano (FATTO, 1440×900)

| Stato | Cosa si vede | Immagine |
|---|---|---|
| Mappa al boot | un solo POI (goblin) appare da solo dopo il velo; più tardi ne compare un secondo (stivali) | `01-map-boot-pois.png`, `70-roster-alone.png` |
| POI a riposo / hover | sigillo rotondo a goccia con tenda; hover: **6,7% dei pixel del marker cambiano**, nessun tooltip | `crops/poi-marker-rest-hover.png` |
| Planner vuoto | **il roster si apre insieme al planner** (ala sinistra); cartiglio, 4 castoni vuoti con icone di ruolo, bisaccia 0/3, «Send» spento, forecast «Fill the required slots» | `10-planner-empty.png` |
| Drag valido | fantasma del token sul castone, castone `valid`; il residente trascinato diventa «AWAY» nel roster | `30-drag-midway-valid.png` |
| Drop su slot occupato | `data-drop-state="locked"`, nessun cambio | `31-…` |
| Party completo | 1 ritratto (eroe) + **3 sagome generiche** per i popolani; esposizioni 0/0/20/80% | `crops/poi-rack-full.png` |
| Swap in volo | **sul castone appare il testo grezzo «slot token:poi-goblin:goblin-slot-leader»** | `crops/poi-swap-zoom.png` |
| Tray | tab «Companions | Bag», 6 consumabili con contatore, «Drag a companion onto a slot» | `crops/poi-tray-sheet.png` |
| Pronto | forecast «SUCCESS 56% · WOUNDS 100% · DEATHS 100% · WIPE 0%», per membro, «Where the risk comes from» | `crops/poi-forecast.png` |
| Chiusura planner | **si chiude anche il roster** | `70-roster-alone.png` |

## 4. Interazione con gli slot: misure dei drag solo-mouse

| Gesto | Esito | Nota |
|---|---|---|
| Beppe → leader | assegnato | commit **dopo > 500 ms** dal rilascio |
| Eroe → member-1 | assegnato | |
| Lisetta → leader (occupato) | rifiutato, stato `locked` | corretto |
| Lisetta → member-2 | assegnato | commit **> 500 ms** |
| Baldassarre → bodyguard | assegnato | |
| Swap leader ↔ member-1 | **riuscito**, commit **> 600 ms** | durante il volo mostra l'ID grezzo |

- **FATTO**: un giocatore vero riesce a comporre il party col solo mouse (4/4) e a fare lo swap.
- **FATTO**: il commit è visibilmente in ritardo in 3 casi su 6. Per mezzo secondo il castone non dice ancora se il drop è andato.
- **FATTO — doc vs realtà dei test**: la suite R-183 (`gameQuestFullFlow.spec.ts`) si dichiara «SOLO input reali», ma il suo helper `dragResidentPointer` (`tests/utils/dragResident.ts:500-502`) chiama prima l'hook `setDraggingResidentId`. Il suo verde non prova il drag del giocatore; questo audit sì.

## 5. Documentazione esistente vs realtà

| Doc | Dice | Si vede | Verdetto |
|---|---|---|---|
| PLAN-043-S8 (WS-3 «Dispatch Table») | planner al centro, hero letterbox ~150 px, rack, loadout, Selection Tray ~88 px, footer ancorato, forecast a destra, **ala sinistra = pool compagni** | tutto presente; **l'ala sinistra è il Roster completo**, non un pool | **COERENTE** con nota |
| idem, R-223 | esposizione numerica, **neutra (niente rosso/verde)**, legenda persistente | esposizione neutra ✓, legenda «Share of incoming impacts…» ✓; **ma** cartiglio «Danger **High**» rosso e «Reward **Decent**» verde, pillole forecast verde/arancio/rosso | **CONTRADDIZIONE** sullo spirito del ruling (valenza rosso/verde) e sulla regola 6b |
| guida HUD §4.5 «difetti del Roster da non copiare» | filtro troncato «A…», «100/100» visibile, icone 12 px; da correggere in PLAN-058 T1.6 | **tutti ancora presenti** il 2026-10-20; PLAN-058 è superato e assorbito in PLAN-043-S11, che attende le tue decisioni D9 | **APERTO da 7 giorni** |
| idem | — | **nuovo, non in elenco**: il badge «LV 4/5/3» copre le prime lettere dei nomi | **MANCANTE** |
| PLAN-043-S11, addendum 2026-10-19 | reveal dei POI con «poca presenza», visual-fork da preparare | il fork non c'è; il POI appare senza coreografia percepibile nei frame | **APERTO** (è il «plan POI non finito») |
| guida HUD regola 6b | niente «cerchio con dentro un simbolo» | il sigillo POI è un cerchio con un simbolo; i castoni hanno gemme verdi | **TENSIONE**: il Sigillo è stato progettato prima (PLAN-058) e la 6b lo colpisce. Decisione tua |
| PLAN-004 / PLAN-005 | chiusi 2026-10-18 | — | non sono il plan aperto (F0) |
| cartiglio «DURATION 22 DAYS» | — | in run la striscia del viaggio dice 2D + ~22D + 2D = **26 giorni** | **INCOERENZA** tra planner e finestra |

## 6. Stato di salute

**Funziona (FATTO):**
- drag solo-mouse 4/4;
- rifiuto sullo slot occupato;
- swap;
- tray con due modalità;
- forecast ricco e calcolato;
- «Send» si abilita a party pronto;
- contrasto del planner 24/25 testi sopra soglia.

**Rotto o incompleto (FATTO):**
1. **«OPEN WAREHOUSE» trabocca e copre «PER»** nella riga bisaccia. Area cliccabile `quest-open-stash` 26×26 px con un'etichetta più lunga del bottone.
2. **ID grezzo visibile** durante lo swap («slot-token:poi-goblin:goblin-slot-leader»): è l'id dnd-kit del drag (`ResidentSlotRack.tsx:294`), dipinto da un componente non ancora localizzato.
3. **Badge LV sopra i nomi** nel roster.
4. **Castoni pieni indistinguibili da quelli vuoti** per i popolani (sagoma generica scura in un anello scuro).
5. Chiudere il planner chiude anche il roster aperto con R.
6. Commit di drag e swap dopo oltre mezzo secondo: voluto (volo del token, `poi_family_spec.md:104`), ma senza stato intermedio visibile.
7. Testi a **9 px** (etichette dei ruoli), 10-11 px (Danger/Reward/Duration, «Covers»).
8. Roster: elenco con scroll interno (6 residenti, ne entrano ~4), filtro e ordinamento troncati; a 1280 controlli sovrapposti e nomi spariti nelle schede assegnate (§10).
9. «DEATHS 100%» accanto a «SUCCESS 56%»: dato coerente (Baldassarre muore nel 96% dei casi) ma **ambiguo**. Si legge «muoiono tutti»; vuol dire «almeno un morto».
10. Terminologia: slot «Fighter/Scout», forecast «member»; slot «Bodyguard», forecast «guard»; pulsante «Warehouse», pannello «Village Stash».

## 7. Polish AAA

| # | Misura | Esito |
|---|---|---|
| C1 | 0 icone fuori asse (planner, roster) | **PASS** |
| C2 | «OPEN WAREHOUSE» su due righe sopra la riga; badge LV sopra i nomi | **FAIL** |
| C3 | planner: 11 spaziature, 5 corpi, testo a **9/10/11 px** | **FAIL** |
| C4 | planner: 12 icone `engraved` + 12 `other`; dimensioni 11–15 px; sigillo POI e gemme = cerchi con simbolo | **FAIL** |
| C5 | collisione testo/bottone nella riga bisaccia; roster con scroll interno | **FAIL** |
| C6 | 1 fallimento su 25: «High» 2.42:1; pillole rosso/verde | **FAIL** minore |
| C7 | 3 target da 26 px (minimizza, chiudi, **apri magazzino**); hover del POI senza tooltip; castoni pieni senza segno di stato | **FAIL** |
| C8 | roster + planner = 32% del viewport, 0 collisioni | **PASS** |
| C9 | commit ritardato senza stato intermedio | **FAIL** |
| C10 | — | **FLAG** |

## 8. Critica con il cappello

**`ui_developer`** (correctness, neutral)
1. Il bottone del magazzino deve contenere la sua etichetta (o essere solo icona + tooltip, come per l'abbandono in R-231).
2. Il token in volo non deve mai mostrare un ID: serve un fallback visivo (iniziale, sagoma del ruolo).
3. Badge LV fuori dal nome (sul ritratto o dopo il nome).
4. Castone pieno ≠ castone vuoto a colpo d'occhio, anche per i popolani senza ritratto.
5. Durante il commit, uno stato «in assegnazione» sul castone (anche di 100 ms), così il giocatore non rifà il drag.
6. Un vocabolario solo: magazzino/stash, guard/bodyguard, member/fighter.

**`game_director`** (taste → FLAG)
7. Il planner è la decisione più importante del loop (chi rischia la vita). Oggi ci sono tre posti che dicono il rischio (esposizione in %, pillole, per membro): sono tanti numeri e poche facce. Due direzioni (**visual-fork**):
   - (A) i ritratti dicono il rischio (alone, crepa, ombra sul castone);
   - (B) una sola riga di rischio aggregata, il dettaglio a richiesta.
8. Il POI è il primo invito alla quest e sulla mappa è un badge piccolo: già richiesto da te (addendum S11), fork ancora da preparare.
9. «DEATHS 100%» detto così spinge a non partire mai. Se il rischio di morte del bodyguard è voluto al 96%, il gioco deve dirlo come scelta («chi sacrifichi?»), non come statistica.

**`objective_critic`** su questa scheda
1. **ASSUMPTION → risolta in parte** — il ritardo è **voluto**: `poi_family_spec.md:104` dice che il token in slot «appears only after flight lands», e «AWAY» è lo stato documentato del residente bloccato durante il volo. Il punto 6 di §6 resta come domanda di ritmo (`taste`), non come bug: il giocatore vede mezzo secondo di vuoto.
2. **UNSUPPORTED → corretta** — non è l'alt di un'immagine: il ghost di `ResidentSlotRack.tsx:741-765` ha `alt=""`. Il testo mostrato coincide con l'id dnd-kit del drag (`slotTokenDragId` = `slot-token:<slotId>`, `ResidentSlotRack.tsx:294`). Chi lo dipinge **non è localizzato**.
3. **RISK** — il roster che si chiude col planner potrebbe essere voluto (roster «ala» del planner). Allora il bug è che R lo apre come pannello indipendente. *Fix*: chiederlo a te.
4. **BIAS** — un solo POI (goblin) e un solo stato di POI (available): in corso, risolto e bloccato non sono stati catturati.
5. **CONTRADICTION** — §5 segnala la 6b sul Sigillo, ma il Sigillo è un lavoro approvato (PLAN-058 T4.2). La regola successiva non annulla da sola un'approvazione precedente.

## 9. Visual fork necessari

| Fork | A | B |
|---|---|---|
| F-POI-1 presenza/reveal del POI (già chiesto da te) | marker che «nasce» dalla mappa (inchiostro che si spande, poi sigillo) | marker che arriva come sigillo calato dall'alto con ombra |
| F-POI-2 rischio nel planner | rischio sui ritratti | riga aggregata + dettaglio a richiesta |
| F-POI-3 apri magazzino | icona + tooltip (grammatica dell'abbandono R-231) | bottone testuale a larghezza piena nella riga bisaccia |

## 10. 1280×800 (FATTO, `shots/poi-planner-f3-1280/`, `crops/poi-roster-1280.png`)

- **Roster, testata**: filtro e ordinamento diventano sole icone; i controlli di destra (direzione, comprimi, chiudi) **si sovrappongono**, con la X disegnata sopra le altre icone.
- **Roster, schede assegnate**: **il nome sparisce**, resta solo «ASSIGNED». Non si capisce chi è assegnato. A 1440 si legge «Sir Spaccaculi ASSIGNED».
- **Cartiglio**: «DURATION 22 DAYS» va a capo su una seconda riga sopra l'immagine.
- «OPEN WAREHOUSE» sovrapposto come a 1440.
- Forecast a tutta altezza (≈100→697 px) con testo tagliato in fondo («…gives at the slightest»), scroll interno.
- Planner alto ≈465 px: dentro il budget AC-02 (≤540 px, misurato però a 1280×720, **non** verificato a 720).
- Drag solo-mouse: 4/4 assegnati, commit ritardato in 3 casi su 4 (volo del token).

## 11. Prompt potenziato

```
You are a senior UI designer and developer at a AAA studio on the RPG project
(/Users/faustoboni/progetti_personali/RPG), surface /game: quest planner (QuestExpeditionDetail.tsx),
slot rack, Roster V2 (src/ui/idleVillage/rosterV2/), quest POI marker (MapQuestPoi.tsx).

Inputs:
- DESIDERATA: .mw/desiderata.md (latest FROZEN); DESIGN_PILLARS.md.
- RULINGS: PLAN-043-S8 WS-3 «Dispatch Table» (layout fixed), R-223 (numeric neutral exposure, legend),
  PLAN-043-S11 pending D9 decisions (do NOT redesign the POI Sigillo or its reveal: visual fork first).
- CONTEXT: src/docs/docs/game_surface_audit/F3_scheda_poi_planner_roster_slot.md; hud_component_guide.md
  (§1 Roster as reference, §4.5 known Roster defects, rule 6b).
- HARNESS: src/docs/docs/game_surface_audit/harness/run-f3poi.mjs.txt (mouse-only drags, no hooks;
  run vite on your own port, not 5191).

Scope (correctness):
1. "Open warehouse" control contains its label (no overlap with the bag row) and has a >= 32px target.
2. Drag ghost never shows a raw id; fallback visual for tokens without portrait.
3. LV badge never covers the name.
4. Filled vs empty slot distinguishable for residents without portrait.
5. A visible "assigning" state between drop and commit.
6. Roster §4.5 defects (truncated filter, "100/100" at full, 12px icons) fixed in V2 only (V1 kit frozen).
7. Text >= 12px in the planner.
Rules: tokens only, i18n en + it-IT, config in Zod; traps T-03, T-04, T-13, T-14 (tests pinning testids/timing).
Keep green: gameQuestFullFlow, gameQuestPlannerLayout, gameQuestDragFeedback, gameQuestExpedition, rosterSlotPoiIntegration.
Output: diff + before/after harness PNGs at 1440x900 and 1280x800 + C1..C9 table + "not verified".
```

## 12. Non verificato
Stati del POI in corso/risolto/bloccato/in scadenza; secondo POI; quest «rovine»; tastiera (drag accessibile); touch; Tauri; tempi reali del commit al frame; perché il roster si chiude col planner.
