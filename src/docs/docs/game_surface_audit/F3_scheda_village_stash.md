# F3 — Scheda: Village Stash (ingressi + pannello) (Opus, 2026-10-20)

> Formato F2. Evidenze: `shots/village-stash-f3/` (1440×900) e `shots/village-stash-f3-1280/`. Legenda: **FATTO** · **FLAG** · **NON VERIFICATO**.

---

## 1. Cosa è, per il giocatore

Lo scaffale del villaggio: i consumabili da spedizione che il villaggio possiede (bonus di Forza e Percezione, bomba fumogena, corda, cura, pozione), con la quantità e una capienza «7 OF 12 GOODS IN STORE». Si apre da quattro punti. È **dichiarato mock in sola lettura**: nessun inventario dietro, le righe non hanno comandi (`VillageStashPanel.tsx:11-20`), e «`qty` è un badge, non un registro» (`villageStashConfig.ts`, PLAN-036).

## 2. Dove vive

| Pezzo | File |
|---|---|
| Pannello | `components/gameFrame/VillageStashPanel.tsx` (131 righe), view-model `villageStashViewModel.ts`, icone `villageStashItemIcons.tsx` |
| Config | `balancing/config/idleVillage/villageStashConfig.ts` (Zod: 3–6 righe, `capacityMax`, validazione contro il catalogo `questItems`) |
| Ingresso 1: tasto **V** / menu **Panels** | `hudPanelRegistry.ts:19`, `HudPanelsMenu.tsx` |
| Ingresso 2: vista **Village** → tooltip «Warehouse» → «OPEN WAREHOUSE» | `VillageScreenView.tsx:831-841` (`village-open-stash`) |
| Ingresso 3: planner → «OPEN WAREHOUSE» | `QuestExpeditionDetail.tsx:~905` (`quest-open-stash`) |
| Ingresso 4: marker edificio sulla mappa | **rimosso** da PLAN-035 (0 marker `data-building-poi` misurati) |

## 3. Come si presenta (FATTO, 1440×900)

| Stato | Cosa si vede | Immagine |
|---|---|---|
| Aperto con V | lastra 400×327 centrata in alto, sopra la mappa, **copre il POI goblin**; titolo «VILLAGE STASH», 6 righe testuali con icona ciano, nome + «×n», descrizione; piè «7 OF 12 GOODS IN STORE» | `10-stash-via-v.png`, `11-stash-crop.png` |
| Hover su una riga | nessuna reazione (coerente col contratto read-only) | `14-stash-row-hover.png` |
| Menu | «Panels → Village Stash V» presente | `21-menu-stash-entry.png` |
| Vista Village | scena illustrata con pin; tooltip «WAREHOUSE · CIVIC · LV II/III · Storage capacity: **24 → 48**» + «UPGRADE (preview only)» + «OPEN WAREHOUSE» | `crops/stash-wh-tooltip.png` |
| Dal planner | stash in basso a sinistra sotto il roster; planner al centro, forecast a destra; **42% del viewport** coperto da pannelli | `40-planner-plus-stash.png` |
| Dopo aver riempito la bisaccia | **quantità invariate** («×2», «7 OF 12»); il tooltip della bisaccia dice «In store: ×2» e **resta aperto sopra lo stash, coprendo la X** | `43-stash-after-pack.png` |

## 4. Documentazione esistente vs realtà

| Doc | Dice | Si vede | Verdetto |
|---|---|---|---|
| `VillageStashPanel.tsx:14` (commento) | «opened from the building POI on the map or the Panels menu» | il marker sulla mappa non esiste più | **SUPERATO** (PLAN-035 lo ha tolto; il commento no) |
| PLAN-032 SP-2 (artifact r003) | mock; **«no quest-loadout coupling»**; il picker resta nel planner | PLAN-036 ha fatto dello scaffale la **fonte del picker** e il planner ha un pulsante «OPEN WAREHOUSE» | **SUPERATO** da PLAN-036: oggi sono accoppiati in vista, non nei numeri |
| `villageStashConfig.ts` (PLAN-036) | «what the village stocks is exactly what the bag can hold»; `qty` = badge, non registro | gli stessi 6 oggetti nel tray e nello stash ✓; le quantità **non scendono** quando li imballi | **COERENTE col codice**, **incoerente per il giocatore** |
| tooltip edificio Warehouse | «Storage capacity: 24 → 48» | il pannello dice «7 OF **12** GOODS» | **CONTRADDIZIONE** di numeri tra due superfici |
| guida HUD §1 «deve sembrare il Roster» | stessa tipografia, densità | stash in **sans-serif 12 px** (`var(--skin-font-sans)`), roster e planner in serif | **CONTRADDIZIONE** (C10) |
| Nomi | — | «Village stash» (titolo), «Warehouse» (pin e pulsanti), «goods in store» (piè), «In store» (tooltip) | **INCOERENZA** di vocabolario |

## 5. Stato di salute

**Funziona (FATTO):**
- 3 ingressi su 3 aprono lo stesso pannello con gli stessi dati;
- V apre e chiude;
- voce nel menu;
- righe inerti come da contratto;
- contrasto **20/20** sopra soglia (8.1–9.8:1);
- 0 icone fuori asse;
- 0 clipping.

**Rotto o incompleto (FATTO):**
1. **Le quantità non riflettono la bisaccia.** Imballi un bonus Forza, il magazzino ne mostra ancora 2. Voluto (mock), ma il pulsante del planner presenta il magazzino come la fonte, e il giocatore legge un errore.
2. **Capienza contraddittoria**: 24 (edificio) contro 12 (pannello).
3. Tooltip della bisaccia sopra la X dello stash: compare in 2 run su 2, ma con il puntatore rimasto sopra lo slot. **Probabile artefatto dell'harness**; resta il punto di z-order (un tooltip che copre la chiusura di un altro pannello).
4. Aperto con V **copre il POI** al centro della mappa.
5. Nomi oggetto che ripetono l'effetto («Strength Bonus — +15 to one check» + «+15 to Strength checks»).
6. Semantica delle icone discutibile: **ancora** per la corda, cerchio con punto per la Percezione (regola 6b).
7. Il pulsante d'ingresso nel planner trabocca (vedi scheda POI/planner §6.1); quello nella vista Village è alto 26 px.

## 6. Polish AAA

| # | Misura | Esito |
|---|---|---|
| C1 | 0 fuori asse | **PASS** |
| C2 | righe `flex-start` con 6.5 px tra icona e testo (scelta: icona in testa alla riga) | **PASS** con nota |
| C3 | 5 spaziature, 2 corpi (12, 13 px) | **PASS** |
| C4 | 7 icone engraved; 6 in **ciano `#00e5ff`** (`--skin-icon-accent`) e 1 in ottone; ancora/cerchio-con-punto | **FAIL** (6b) + **FLAG** sul ciano |
| C5 | 0 | **PASS** |
| C6 | 20/20 | **PASS** |
| C7 | close ≥ 24 px; «OPEN WAREHOUSE» del Village alto **26 px**; tooltip che copre la chiusura | **FAIL** |
| C8 | da solo copre il POI; nel planner 3 pannelli + forecast = 42% | **FLAG** |
| C9 | nessuna animazione d'apertura misurata | NON VERIFICATO |
| C10 | sans contro serif; lista testuale invece di scaffale | **FLAG** |

## 7. Critica con il cappello

**`ui_developer`** (correctness, neutral)
1. Un solo nome (magazzino / stash) in titolo, pin, pulsanti e tooltip.
2. Una sola capienza, dalla stessa fonte di config.
3. Un tooltip non copre mai i comandi di un altro pannello (z-order).
3b. A 1280×800 lo stash resta dentro lo schermo (oggi esce di 17 px).
4. Tipografia della famiglia Roster (serif display + corpo coerente), oppure una deroga scritta nella guida.
5. Le icone ruolo-oggetto seguono la 6b (sagome, non cerchi con simbolo).

**`game_director`** (taste → FLAG)
6. Un magazzino che non si svuota quando prendi le cose comunica «questo schermo non conta». Due direzioni (**visual-fork / decisione di design**):
   - (A) lo stash diventa un registro vero (si scala all'imballo, torna a fine run, PLAN futuro);
   - (B) resta mock ma dice di esserlo: niente quantità, solo «disponibile».
   
   Oggi è a metà strada.
7. Un deposito di villaggio in un gioco «settlement» è una superficie di orgoglio (cosa abbiamo accumulato). Una lista testuale lo rende un menu. Uno scaffale illustrato in griglia, con le pile, è la direzione di genere; serve un tuo ruling (C10).

**`objective_critic`** su questa scheda
1. **ASSUMPTION** — «il giocatore legge un errore» (§5.1): è un'inferenza sul giocatore, non un test con giocatori. *Fix*: tenerlo come FLAG, non come bug.
2. **CONTRADICTION** — §4 dice PLAN-036 «coerente col codice» e §5 lo chiama «rotto». Va scritto chiaro: rotto **per il giocatore**, corretto **per il contratto**; la decisione è tua.
3. **UNSUPPORTED** — «capienza 24 contro 12» potrebbero essere due cose diverse (capienza dell'edificio al livello II contro scaffale di consumabili). *Fix*: se sono diverse, vanno etichettate diverse.
4. **RISK → accolto** — il tooltip è con ogni probabilità un artefatto (puntatore fermo sullo slot): declassato in §5.3.
5. **BIAS** — nessuna cattura dopo una run (consumabili usati o restituiti): il punto (A) di §7.6 non è stato misurato.

## 8. Visual fork / decisioni necessarie

| Fork | A | B |
|---|---|---|
| F-ST-1 natura dello stash | registro vero (si scala, torna) | mock dichiarato (niente quantità) |
| F-ST-2 forma | scaffale illustrato in griglia con pile | lista HUD in famiglia Roster |
| F-ST-3 ciano `--skin-icon-accent` | resta accento ciano (ma solo per stati) | rientra nell'ottone/inchiostro della 6b |

## 9. 1280×800 (FATTO, `shots/village-stash-f3-1280/`)

- Il pannello si restringe a **260×417 px**. Le righe vanno a capo su 3 righe ciascuna, la lista si allunga.
- Aperto dal planner a y=400: **il fondo arriva a 817 px su 800**, cioè 17 px fuori schermo; il piè «7 OF 12 GOODS IN STORE» è tagliato. **FAIL** C5/C8 (guida HUD regola 8: nessuna sovrapposizione/uscita a 1280×800).
- Nella stessa vista il roster tronca i nomi («GIGG…», «SALV…», «SIR S…», «BALD…»).
- Stessi dati e stessa invarianza delle quantità che a 1440.

## 10. Prompt potenziato

```
You are a senior UI designer and developer at a AAA studio on the RPG project
(/Users/faustoboni/progetti_personali/RPG), surface /game, component VillageStashPanel
(src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx) and its entry points
(VillageScreenView warehouse tooltip, QuestExpeditionDetail quest-open-stash, Panels menu / key V).

Inputs:
- DESIDERATA: .mw/desiderata.md (latest FROZEN); DESIGN_PILLARS.md.
- CONTRACTS: PLAN-032 SP-2 (read-only mock), PLAN-036 (shelf = bag picker catalogue, qty is a badge).
  Do NOT turn the stash into a ledger without an explicit Director ruling (F-ST-1).
- CONTEXT: src/docs/docs/game_surface_audit/F3_scheda_village_stash.md; hud_component_guide.md
  (§1 Roster family, rule 6b, tokens); villageStashConfig.ts (Zod).
- HARNESS: src/docs/docs/game_surface_audit/harness/run-f3stash.mjs.txt (own vite port).

Scope (correctness):
1. One name across title, pins, buttons, tooltips (i18n en + it-IT).
2. One capacity source (or two clearly different labels).
3. Bag tooltip closes on Escape/pointer-leave and never covers another panel's controls.
4. Entry buttons >= 32px tall, label contained.
5. Update stale doc comment (map building POI removed by PLAN-035).
Rules: tokens only, config in Zod, traps T-03 (data-hud-controls scope), T-04, T-13.
Keep green: gameVillageView.spec.ts, gameQuestFullFlow.spec.ts, villageStash unit tests.
Output: diff + before/after harness PNGs at 1440x900 and 1280x800 + C1..C9 + "not verified".
```

## 11. Non verificato
Stato dello stash dopo una run (consumabili usati o restituiti); animazione d'apertura; trascinamento del pannello; tastiera e screen reader; it-IT; Tauri.
