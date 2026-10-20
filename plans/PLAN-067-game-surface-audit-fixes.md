# PLAN-067: /game visto dal giocatore — difetti dell'audit, fork scelti, Director e mock del ciclo (R-234)

**Status:** `baptized` — Director 2026-10-20 («Battezzo PLAN-067: fai il check delle disposizioni e parti con T-000; DN-3 resta aperto»). Check P8: `baptizable: true` (v36: 7 task, item-5 `open` — plan non passato da `mw-web-debate`), record in `.mw/plan-dispositions/`, verdetto `.mw/runs/plan067-baptism/verdict.json`.
**Richiesta:** `R-234` (2026-10-20). Verbatim: *«Sì, scrivi ora il plan unico (mw-planner): difetti 1-21, fork scelti v1-v3, riparazioni Director, mock del ciclo con reliquiario dinamico dagli edifici.»*
**Desiderata:** v36 FROZEN (contratti vivi per-componente su `/game`), v35 FROZEN (visual fork gate), v34 (cinematica). Nessun drift: il piano corregge e realizza fork già decisi, non cambia obiettivi.
**Fonte:** audit `src/docs/docs/game_surface_audit/` — F0…F6, `F4_documento_finale.md` (difetti 1–10, Parte 3 schizzi di codice), `F5_secondo_giro.md` §10 (difetti 11–21), `F6_director_e_mock_di_ciclo.md`, ruling in `rulings/2026-10-20-fork-rulings.md`, baseline + sha256 in `rulings/baseline-sha256.txt`.
**Fuori scope (piani separati):** i POI (sessione dedicata «POI: interazioni, rischio e reveal», ruling POI-T B incluso); la cinematica della quest (fork CIN-1/2/3 non ancora decisi); il bug della mappa che sparisce (fix nella sessione dedicata, qui solo il merge, T-000).

---

## 0. Decisioni Director già prese (vincolanti)

| Fork | Scelta | Baseline (sha256 in `rulings/baseline-sha256.txt`) |
|---|---|---|
| SC-1 comando di lancio | **A** stella con etichetta incisa + anello che respira + probabilità | `board-armed.png` |
| SC-2 idle dopo il verdetto | **A2** marea d'inchiostro (vittoria: scintille d'oro; sconfitta: cenere fredda) | `board-parked.png`, `board-defeat-parked.png` |
| QW-1 barra | **B** tempo reale, scala che si allunga, sforo a brace; **I1** sigilli d'ottone sulla barra al posto delle tessere | `timebar-overrun.png`, `phase-tiles.png` |
| PL-3 apri magazzino | **A** icona + tooltip HUD (grammatica abbandono R-231) | `bagrow.png` |
| HUD-1 cibo | **A** brace sulla tessera scura | `food.png` |
| HUD-2 lastre in alto | **H1** tre lastre di una famiglia | `top-strip.png` |
| LVL level-up mock | **B** cerimonia | `v3-levelup.png` |
| EXP sconfitta spedizione | **A** lapidi sulla scena spenta | `v3-expedition-lost.png` |
| SET caduta insediamento | **B** la mappa si spegne | `v3-settlement-lost.png` |
| LEG eredità | **B** reliquiario con scelta — **slot dinamici dagli edifici costruiti** («sarà dinamico») | `v3-legacy.png` |
| FAM-1 schede teaser | **A** famiglia Roster (hero sheet, stash, mercante, tooltip edifici) | `v3-herosheet.png`, `v3-stash.png` |
| INV-1 oggetto | **B** riga comune, tre vesti (tessera / riga / riga + prezzo) | `v3-stash.png` |
| DEATH-1 eroe caduto | **B** sala dei caduti (voce di menu «Memoriale») | `v3-roster-dead.png` |

Mockup di riferimento: `mockups/fork-mockups{,-v2,-v3}.html` (sha in `rulings/`). Ogni task visivo cita la sua opzione; nessun elemento estraneo alla baseline scelta.

## 1. Decisioni aperte (NON decise dal piano — il task relativo resta bloccato finché non c'è ruling)

| ID | Domanda | Default proposto per il mock (solo se il Director lo approva) | Blocca |
|---|---|---|---|
| **DN-1** ✅ **DECISO 2026-10-20**: Magazzino → oggetti, Santuario → eroi, Torre del mago → progetti; **slot = livello dell'edificio**; nessun edificio = nessuno slot di quella categoria | Quale edificio salva quale categoria di eredità, e quanti slot per livello? (Lose to Progress, `GAME_VISION_IDLE_INCREMENTAL.md` §2; Legacy Vault in `MASTER_PLAN.md`: `storedItems`, `hallOfHeroes`, `unlockedBlueprints`; edifici in `villageBuildingsConfig.ts`) | Magazzino → oggetti (slot = livello); Santuario/Cimitero → eroi (slot = livello); Torre del mago / Gilda → progetti (slot = livello); nessun edificio = nessuno slot di quel tipo | T-C4 |
| DN-2 ✅ **DECISO 2026-10-20: togliere il badge** | Badge del menu Pannelli (F-HUD-2): via o «eventi non letti»? | — | T-B9 (parte badge) |
| DN-3 (resta **aperto**: il Director non ha espresso preferenza il 2026-10-20 né sulla posizione né sul testo) | Cartiglio obiettivo (F-HUD-3): cartiglio appeso o dentro la lastra del tempo? Che cosa dice? | — | T-B9 (parte obiettivo) |
| DN-4 | Il danno in combattimento è −12 per turno con qualunque esito: voluto? | — | nessun task (segnalato) |
| DN-5 | Fame accesa dal giorno 1–2 in ogni partita nuova: pressione voluta? | — | nessun task (segnalato) |
| DN-6 | Tema Lacquer Atlas ancora nel menu del giocatore (bocciato 2026-10-16): togliere? | togliere dal menu, tenere solo `?skin=` dev | T-A12 |
| DN-7 | «Load game / Quit to title / All settings» disabilitati: implementare, spiegare (tooltip «presto»), o nascondere in demo? | spiegare | T-A12 |
| DN-8 ✅ **DECISO 2026-10-20: amend ratificato** — BV-04 = «0 ridisegni del canvas da parcheggiato; CSS transform/opacity ammesso» | `BV-04 settledIdle` (PLAN-043-S9 r003, gate battezzato): SC-2 A2 lo ridefinisce come «0 ridisegni del **canvas** da parcheggiato; animazioni CSS transform/opacity ammesse». Serve ratifica esplicita dell'amend. | ratifica | T-B2 |

## 2. Trappole e contratti ereditati (acceptance automatici)

- **Superfici** (`.mw/surface-map.json`): `game-hud` → CTR-game-002/003/004/005/006/007/009; `game-quests` → `npm run test -- tests/unit/idleVillage`, e2e quest, CTR-game-007/008/009; `game-map-pixi` → CTR-game-001/002/005/008; `game-interaction` → unit idleVillage. Ogni task eredita i check della superficie che tocca.
- **Trappole** (`context/recurring-traps.md`): T-01 (inset/terra quando cambia l'altezza delle lastre H1), T-02 (archi da 0 con cap tondo: sigilli/barra), T-03 (scope `data-hud-controls` per tooltip/menu), T-04 (ogni claim visivo chiuso da testimone harness), T-07 (derivati visivi legati alla sorgente: brace del cibo, sigilli sulla barra), T-13 (sessioni parallele: commit scoped, sospetto collisione), T-14 (driver E2E dopo spostamenti di testid/timing), T-15 (`page.evaluate`/helper condivisi).
- **Contratti vivi (PLAN-054)**: ogni bug Director entra con `npm run sync:bug -- --component <id> --source-ref R-234 --desc …` + `redfirst:record` + tag `// INV:` nel test di regressione (Mode A). Gli amend di invarianti esistenti sono dichiarati (Mode B-amend) con R-234.
- **Harness di verifica**: `src/docs/docs/game_surface_audit/harness/*.txt` (WebGL Metal headless, vite con `watch.ignored`, clock tardivo, `lensAudit` L1–L9, `plaqueClearance`). Porta propria, mai 5191 (sessione B4-map) né 5173. Tutte le catture **headless/background**; l'eye-check visivo è un passo manuale del Director.

---

## 3. Task

### T-000 — Prerequisiti (blocca tutto il resto)
1. **Merge del fix mappa** dal branch `refs/heads/claude/eloquent-goodall-4d2bf1` (sessione «Mappa /game sparisce»: `DepthScene` `app.destroy(true)` libera il pool condiviso Pixi 8.22) — solo su ordine del Director, dopo aver letto il diff e il suo test di guardia. Verifica: harness `tour-b` (quest intera) senza `reading 'ids'` in 3 run su 3.
2. **Riconciliazione stato PLAN-062/063/064** (file `draft`, INDEX `in corso`, RICHIESTE «consolidata»): questo piano **assorbe** la parte barra di PLAN-062 (T-B3) e la parte chrome di PLAN-063 che tocca header/minimizzata; PLAN-064 resta separato. Aggiornare i tre frontmatter + `plans/INDEX.md`.
- *Done:* fix in main con test verde; tre stati allineati.
- ✅ **Fatto 2026-10-20** (non committato): fix applicato nel checkout principale, guard test 1/1, 3 quest complete headless senza `reading 'ids'` e con mappa visibile; stati PLAN-062/063/064 allineati. Evidenza `.mw/runs/plan067-t000/evidence.md`.

### Onda A — Correttezza (nessun gusto: regole già scritte o bug misurati). Mode A, red-first.

| Task | Difetto | File (giudizio) | Acceptance (misurabile) |
|---|---|---|---|
| **T-A1** | 2 · HP impossibili nella cronologia (−600 HP su 93) | `questS1Lab/questPhaseRecord.ts` (`recordAction` ri-somma `checkQueue[].harms` + `recentHarms` senza snapshot) | test rosso: 5 turni da −12 → `hpLostByMember` = 60; poi verde. Run harness: nessun chip HP > HP max |
| **T-A2** | 4 · riga duplicata in 7/7 carte; HP in prosa (guida quest §4) | `QuestSkillCheckColumn.tsx:278-287`; sorgente testi in `ResolvedCheck` | 0 righe duplicate su 7 check (harness `run-fullrun`); HP solo sul canale visivo |
| **T-A3** | 3 · quadrante tagliato su 4 lati | contenitore `quest-check-board` (override CSS ospite, il kit V6.2 è congelato) | `div.arena` contenuto nel riquadro a 1440×900, 1280×800, 1280×720; coerenza palla/verdetto (`honestTargetPos`) invariata; test kit verdi |
| **T-A4** | verdetto mostrato due volte (finestra + carta) — guida §1 | `QuestRunWindow.tsx` (beat), colonna | verdetto in un solo posto; testo del beat non ripete la carta |
| **T-A5** | 6 · ID grezzo `slot-token:…` nel fantasma dello swap | trovare chi rende l'id dnd-kit (overlay/cursore); `ResidentSlotRack.tsx:294` | 0 testi `slot-token:` visibili durante swap (screenshot a metà percorso) |
| **T-A6** | 7 · badge LV sopra il nome; nomi spariti a 1280; testata roster sovrapposta | `rosterV2/WanderlustRosterCardV2`, `DragTestContainerV2` (V1 certificato intatto) | `lensAudit` L1 = 0 nel roster a 1440 e 1280; nome sempre visibile |
| **T-A7** | 8 · capienza 12 (pannello) vs 24 (edificio); stash fuori schermo a 1280 | `villageStashConfig.ts` (capienza derivata dal livello del Magazzino), `VillageStashPanel` | un solo numero di capienza; pannello dentro il viewport a 1280×800 da tutti e 3 gli ingressi |
| **T-A8** | 11 · sigilli della preview sopra il titolo con tray aperto | `QuestExpeditionDetail.tsx` (testata compatta WS-3) | L1 = 0 nel planner con tray aperto (en + it-IT) |
| **T-A9** | 12 · tooltip del tray che esce dal planner sopra il roster | tray / tooltip (T-03) | tooltip dentro il planner o sopra senza coprire comandi di altri pannelli |
| **T-A10** | 14 · Registro del villaggio: 10 collisioni + 8 troncamenti | `VillageRegistry.tsx` | L1 = 0, L2 = 0 (o troncamento con tooltip completo) |
| **T-A11** | 15 · rapporto finale: lastra trasparente, titolo doppio, chip rosso su rosso | `QuestRewardPopup.tsx`, `QuestEpilogue` | lastra opaca (0 testo dietro leggibile), un titolo, contrasto chip ≥ 4.5:1 — la forma finale arriva con EXP A (T-C2) |
| **T-A12** | 16, 17, 20 + DN-6/DN-7 · invasione «Maximum update depth» ×2; pulsante attivo prima del goblin; voci menu disabilitate mute; tema bocciato nel menu | `WorldSurfaceEventCard.tsx`/`GoblinInvasionWindow.tsx` (individuare il componente in loop), `HudGameMenu.tsx` | 0 errori React nella sequenza; «Prepare the defenses» armato solo a goblin visibile; voci disabilitate con spiegazione; menu senza Lacquer Atlas (se DN-6) |
| **T-A13** | 19 · contenuti quest non tradotti in it-IT | i18n quest (titolo, descrizioni, ruoli slot, nomi prove, intel) | giro `tour-a` in it-IT: 0 stringhe inglesi nel planner e nella finestra quest |
| **T-A14** | 9 (parte) · focus ring di sistema; Tab non visivo; tooltip nativi `title` | `skinScope.css`, `GameFrame.tsx`, `WhenWhereCluster`, `ResourceReadout` | focus ring skinnato su tutti i controlli HUD; ordine Tab = ordine visivo; tooltip HUD (nome + scorciatoia) al posto dei `title`; annunci dnd-kit (`DndLiveRegion`) senza id grezzi («Draggable item slot-token:poi-goblin:…», visto in T-A5): `accessibility.announcements` localizzati con nomi di persone e slot |
| **T-A15** | Director: chiave grezza `resetInitial`, «Skin» porta alla skin bocciata, «POI types» mostra la croce provvisoria | `game-frame-pixi.tsx` (directorActions), i18n | etichetta tradotta en+it; Skin limitata alla base (o rimossa); POI types nascosto finché non ci sono i glifi (S11) |
| **T-A16** | nuovo (visto verificando T-A2, run `ta2-1` c08): contatore «315/110 TICKS» oltre il massimo nella finestra quest | `QuestRunWindow.tsx` (striscia tick/fase) | contatore mai oltre il massimo (o massimo che cresce con la fase) su una run completa; test rosso prima |

**Stato onda A (2026-10-20, non committato):**
- ✅ **T-A1** — `recordAction` deduplica per `seq` (`INV:R-234-phase-hp-once`, contratto `game-frame-pixi`); red-first in `.mw/red-first/`.
- ✅ **T-A2** — la carta non dipinge più `outcomeText`, solo `flavor` + `authoredText`, il danno resta sui chip (`INV:R-234-verdict-card-once`, contratto `quest-skill-check-column`). Testimone: run completa headless, 9/9 carte con 0 righe duplicate e 0 «HP». Evidenza `.mw/runs/plan067-t-a2/`.
- ✅ **T-A3** — la causa misurata **non** era `div.arena` (contenuta: 279 in 340). Era la ghiera, a `inset:-80px` fisso (473 px dentro una board da 340 con `overflow:hidden`), più l'ombra di V1 che trapela (`destinyAstrolabe/astrolabe.css:43`, stesso selettore) e viene ritagliata in un quadrato, più il fondo ossidiana quadrato. Override nell'ospite (`BOARD_FIT_CSS`, kit intatto): ghiera proporzionale, stage dimensionato perché anello + ombra stiano nel lato, fondo come disco. Anello 300 px con 20 px di margine sui 4 lati a 1440×900, 1280×800 e 1280×720; arena da 279 a 237 px; test kit verdi. Niente red-first in jsdom (non ha layout, T-04): rosso/verde è il probe headless. Evidenza `.mw/runs/plan067-t-a3/`.
- ✅ **T-A4** — nel cluster il beat della finestra tiene solo titolo + transito, il verdetto vive nella Verdict Card (`verdictInColumn`, `INV:R-234-verdict-once`, contratto `quest-run-window`). Fuori dal cluster e con «salta tutto il check» resta invariato. Testimone: run completa headless, 0 righe della carta ripetute su 8/8. Per l'occhio del Director: durante il verdetto la zona testo della finestra resta quasi vuota. Evidenza `.mw/runs/plan067-t-a4/`.
- ✅ **T-A5** — l'overlay condiviso non dipinge nulla per gli id `slot-token:`, il fantasma è quello del rack (`INV:R-234-no-raw-drag-id`, contratto `custom-drag-overlay`). Testimone: swap con il mouse a metà percorso, 0 testo nell'overlay. Evidenza `.mw/runs/plan067-t-a5/`.
- ◐ **T-A6** — fatto: badge LV mai sul nome (`INV:R-234-level-badge-clear-of-name`), nomi visibili a 1280 (lo stato cede per primo). **Non fatto:** testata del roster a 1280, dove le icone si impilano. Due tentativi ritirati (overflow a sinistra; testata su 3 righe): è un bivio visivo → fork **ROS-H** in mockup (roster più largo a 1280 / direzione visibile solo con ordinamento per stat / filtro + ordinamento in un solo menu). Evidenza `.mw/runs/plan067-t-a6/`.
- ✅ **T-A7** — capienza da una sola fonte, il livello del Magazzino: 24, come il tooltip (`INV:R-234-stash-capacity-one-source`). Stash limitato all'altezza della zona del solver (`INV:R-234-stash-inside-zone`): a 1280 dal planner il fondo è a 700 (prima 817). Evidenza `.mw/runs/plan067-t-a7/`.
- ⏸ **T-A8** — sostituito dal ruling Director 2026-10-20 (sotto): le scritte escono dall'immagine, quindi i sigilli non vanno più fatti stare nell'eroe compresso. Diventa **T-B10**.
- ✅ **T-A9** (testimone: 4/4 tooltip dentro il planner a 1440 e 1280, `.mw/runs/plan067-t-a9/`) — i tooltip oggetti del planner (vassoio e borsa) collidono con il guscio del planner (`collisionBoundary`, `PlannerBoundaryContext`; `INV:R-234-planner-tooltip-inside`, contratto `quest-expedition-detail`).
- ✅ **T-A10** — il registro non eredita più la regola-pillola dello scope `data-hud-controls` (T-03): righe con geometria propria (`INV:R-234-registry-rows-own-geometry`). L1/L2 da 10/8 a **0/0** a 1440 e 1280. Evidenza `.mw/runs/plan067-t-a10/`.

**Ruling Director 2026-10-20 sul POI detail (planner):**
1. «Il pulsante nel POI detail non va bene, non deve mai essere usato in quello stile.» Da confermare quale: si presume il pulsante tondo «OPEN WAREHOUSE» (`quest-open-stash`, 26 px con etichetta che trabocca sulla riga borsa). Quello stile è vietato in tutta l'interfaccia.
2. «Le scritte sull'immagine del POI detail non ci devono essere: tutte quelle info vanno nel componente preview a destra, che deve avere un design migliore.» Escono dall'immagine sigilli (Pericolo / Ricompensa / Durata), titolo e riga d'invio. La colonna di previsione a destra le ospita e va ridisegnata.


### Onda B — Fork già scelti (visivi: ogni task cita opzione + baseline)

| Task | Fork | Dove | Acceptance |
|---|---|---|---|
| **T-B1** | SC-1 A | `QuestSkillCheckColumn` + stella `.da-tira` | `visual-fork: SC-1=A — baseline board-armed.png`; etichetta incisa, anello che respira, probabilità leggibile; target ≥ 32 px; reduced-motion statico |

> Nota T-B1 (misurata in T-A3): il pulsante DOM `.da-tira` porta anche `wanderlust-artifact`. Quella regola globale (`src/ui/styleLab/tokens/v8-wanderlust-artifact.css:51`, `position: relative`) batte il suo `position:absolute`, quindi il pulsante scende nel flusso 170 px sotto il quadrante e la board lo nasconde: è il «nn ha il pulsante x lanciare». Con `absolute` ripristinato diventa una lastra d'oro **sopra la stella** (zona Big Win), contro la baseline SC-1 A. L'etichetta incisa va quindi **sotto** il quadrante (spazio da riservare nella board) e il gesto resta il click sulla stella.

| **T-B2** | SC-2 A2 (**Mode B-amend** BV-04, DN-8) | `QuestSkillCheckColumn` (CSS `[data-astro-idle]`), engine V6.2 **non** ridisegna | da parcheggiato: `astroFrames` fermo (0 ridisegni canvas) **e** px cambiati > 0 nella marea (CSS transform/opacity); variante sconfitta visibile; reduced-motion = 0 px |
| **T-B3** | QW-1 B + I1 (assorbe PLAN-062) | `QuestRunWindow.tsx` `TimeBar`, `questPhaseCheckpoints`, cronologia fasi | `series.json` su run lenta e veloce: barra monotona (0 cali), 100% solo a run finita, tacche = fasi reali (7 per goblin); sigilli I1 senza cerchi/spunte/verde (6b); sforo marcato a brace; una sola unità di tempo con la striscia del viaggio |
| **T-B4** | PL-3 A | `QuestExpeditionDetail.tsx:~905` | icona 36 px + tooltip «Magazzino · V»; L1 = 0 nella riga bisaccia |
| **T-B5** | HUD-1 A | `ResourceReadout.tsx` | brace sulla tessera scura; contrasto ≥ 4.5:1; T-07 (derivato legato a `daysLeft`) |
| **T-B6** | HUD-2 H1 | `GameFrame.tsx` lastre MENU/tempo/risorse, `gameFrameConfig` inset | tre lastre stessa altezza; `plaqueClearance` ≥ 22 px su MENU e risorse; regione del tempo visibile a 1280; **T-01**: rimisura inset, fissi non coprono la terra (`game_map_fit_contract`) |
| **T-B7** | FAM-1 A | `HeroSheetPanel`, `VillageStashPanel`, `MerchantPanel`, tooltip edifici in `VillageScreenView` | L3: solo Cinzel + EB Garamond; L4: 0 ciano/verde/rosso di significato; zeri nascosti nella scheda eroe; BUY disabilitato leggibile (≥ 4.5:1) |
| **T-B8** | INV-1 B | tray (`picker-item-*`), stash, mercante | stessa icona incisa, font e ottone nelle tre vesti; quantità/prezzo nella posizione fissata dalla baseline |
| **T-B9** | (parte HUD restante) | `HudPanelsMenu`, `ObjectiveCartouche` | **badge rimosso** (DN-2): pulsante Pannelli senza numero, L7 = 0; **obiettivo bloccato da DN-3** (resta `open`) |
| **T-B10** | ruling 2026-10-20 (POI detail) | `QuestExpeditionDetail.tsx` (eroe = sola immagine), colonna di previsione a destra, pulsante «OPEN WAREHOUSE» | `visual-fork: POI-D — baseline da produrre (mockup prima del codice)`; 0 testo sopra l'immagine; tutte le info del POI nella preview destra ridisegnata; nessun pulsante nello stile vietato; L1 = 0 a 1440 e 1280 con vassoio aperto e chiuso |

### Onda C — Director e mock del ciclo (tutto dichiaratamente mock: nessuna persistenza reale salvo ruling)

| Task | Cosa | Acceptance |
|---|---|---|
| **T-C1** | LVL B · level-up mock con cerimonia; il pulsante Director apre il roster se chiuso; il livello sale davvero (4 → 5) in mock | lastra con sigillo e guadagni veri da config; rifiuto silenzioso eliminato; una lastra per eroe; reduced-motion |
| **T-C2** | EXP A · rapporto di sconfitta della spedizione (sostituisce la forma attuale, chiude T-A11) + **nuova azione Director «Expedition lost»** | lastra opaca, scena desaturata, una lapide per caduto, oggetti persi a brace, un titolo; azione Director che lo mette in scena senza perdere davvero |
| **T-C3** | SET B · caduta dell'insediamento: la mappa si spegne verso il villaggio; **z-order sopra ogni finestra** (oggi invisibile con la quest aperta); **statistiche vere** (giorni, caduti, oro: `buildGameOverSummary`); la CTA porta all'eredità (T-C4) | visibile con finestra quest aperta; «giorni» = giorno corrente; perdite dal journal, non testo fisso |
| **T-C4** | LEG B · reliquiario su `/game` (mock), **slot dinamici dagli edifici costruiti** (DN-1 deciso): config Zod `legacyReliquaryConfig` con `warehouse → items`, `sanctuary → heroes`, `mageTower → blueprints`, `slots = livello dell'edificio` (0 se non costruito), letto dallo stato del villaggio; nuova azione Director «Legacy» | 0 slot per categorie senza edificio; slot = livello (test su livelli 0/I/II/III); scelta salvata solo in memoria (mock) salvo ruling; `TrailerLegacyV2` resta file del trailer (si riprende il linguaggio, non il file) |
| **T-C5** | DEATH-1 B · Sala dei caduti (voce di menu «Memoriale»); il caduto non sparisce senza traccia; alimenta T-C4 (eroi da ricordare) | ogni morte di run produce una voce (nome, livello, luogo, giorno); voce di menu en+it |

### T-Z — Verifica finale (misurabile, chiude il piano)
Headless, porta propria, dopo T-000:
1. `tour-a` (1440×900 en, 1280×800 it-IT) + `tour-b` (quest intera) + `run-director` con `lensAudit`: **L1 = 0, L2 = 0 non dichiarati, L4 = 0 (fuori palette), L8 = 0, L9 = 0** sulle superfici toccate; tabella prima/dopo per ogni task.
2. `run-f3` lenta + veloce: barra conforme a T-B3; `run-fullrun`: 0 duplicati, 0 HP impossibili.
3. `npm run test -- tests/unit/idleVillage`, e2e `gameQuestFullFlow`, `gameQuestCluster` (BV-01..14 con BV-04 amend), `gameQuestPlannerLayout`, `gameVillageView`, `gameInvasionSequence`, `questJourneyRoute`; `hudGuards.test.ts`; `build:check`; `contracts:check` (sync gate).
4. Side-by-side baseline vs implementazione per ogni fork (`human-eye`, Director).
- *Done:* `verification.json` → `verify:bundle` → `bundle.json` PASS; `R-234` → `fatta` con `bundle:`.

## 4. Contratto di chiusura

| ID | Obbligazione | Verifica |
|---|---|---|
| OB-1 | T-000: fix mappa in main; 0 `reading 'ids'` in 3 quest complete | log harness `tour-b` ×3 |
| OB-2 | Onda A: ogni difetto con test red-first + `// INV:` (Mode A) e misura harness dopo | `redfirst` records + `contracts:check` |
| OB-3 | Barra (T-B3): monotona, 100% solo a fine, tacche = fasi reali, su run lenta e veloce | `series.json` prima/dopo |
| OB-4 | Lenti L1/L2/L4/L8/L9 a zero sulle superfici toccate, 1440 en + 1280 it-IT | `*.lens.json` aggregati |
| OB-5 | BV-04 amend (DN-8, ratificato 2026-10-20) con test aggiornato; SC-2 A2 con canvas fermo e marea viva | ruling + `gameQuestCluster` |
| OB-6 | H1 non copre la terra (T-01) | `game_map_fit_contract` probe |
| OB-7 | Mock del ciclo: LVL/EXP/SET/LEG/DEATH raggiungibili dal Director, LEG con slot dagli edifici (DN-1) | e2e mirato + catture |
| OB-8 | Suite e build verdi (§T-Z.3) | log comandi |
| OB-9 | `human-eye`: side-by-side baseline vs implementazione per ogni fork in §0 | artefatto + firma Director |

## 5. Rischi

- **Sessioni parallele** (B4-map su 5191, PLAN-053, POI): file condivisi (`QuestRunWindow.tsx`, `QuestExpeditionDetail.tsx`) → commit scoped, T-13, rebase prima di ogni onda.
- **Kit congelati** (V6.2 astrolabio, Roster V1): solo override nell'ospite o copia V2.
- **Gate battezzati** toccati: BV-04 (DN-8); «niente Continua» r003 non toccato (la cerimonia LVL e il rapporto EXP stanno fuori dalla superficie quest; da confermare al battesimo).
- **Ampiezza**: 30+ task. Proposta di esecuzione: un'onda per volta, chiusura a bundle per onda (A → B → C → Z).

## 6. Documentation impact

REQUIRED: `quest_ui_component_guide.md` (§1 verdetto unico, §4, §6 astrolabio in colonna), `hud_component_guide.md` (H1, focus ring, tooltip, §4.5 difetti Roster chiusi), `COMPONENT_MASTER_INDEX.md`, contratti dei componenti toccati, `skill_check_workflow_spec.md` (obsoleta: aggiornare a V6.2), `plans/INDEX.md`, `RICHIESTE.md` R-234.
