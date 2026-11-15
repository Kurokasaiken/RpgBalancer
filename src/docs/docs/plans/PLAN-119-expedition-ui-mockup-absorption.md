# PLAN-119 — Expedition planning UI: assorbimento mockup ChatGPT (Subplan 1)

**Richiesta:** R-339 · **Stato:** in corso (battezzato su desiderata v38 FROZEN, ledger aperto 2026-11-15) · **Data:** 2026-11-15
**Spec sorgente:** `.mw/specs/expedition-ui/artifact-r004.md` (dibattito multi-AI web
`20261115-wanderlust-ui-plan`, sha256 `582a2e03…f9e32c33b` — ACCEPT 4/4 + ruling Director D10).
**Baseline visive:** `.mw/specs/expedition-ui/refs/` — `mockup-chatgpt.png` è la baseline
direzione scelta dal Director; `mockup-stash-grid.jpg` è il riferimento contenuto stash.
Visual-fork: **skipped — la baseline è il mockup approvato dal Director** (scelta esplicita
tra mockup concorrenti, registrata in `refs/REGISTERED.md`); ogni deriva estetica rispetto
alla baseline va segnalata in chiusura, non decisa in silenzio.

## Goal

Portare la struttura del mockup su `/game` senza introdurre superfici flottanti:
drawer expedition docked flush-right, colonna sinistra Roster|Stash a tab, top chrome
snellito a sinistra con zona top-right riservata alla futura Chronicle (D10, ruling
Director — niente tab pendente), mappa protagonista (canvas full-bleed + insets via
Zustand + pan/zoom clamp al rettangolo libero).

## Superfici e vincoli ereditati

- `game-hud` (`src/ui/idleVillage/components/gameFrame/**`, `gameFrameConfig.ts`) →
  expected_checks: CTR-game-002/003/004/005/006/007/009.
- `game-map-pixi` (canvas `/game`) → CTR-game-001/002/005/008.
- Traps di superficie: T-01, T-02, T-03, **T-04** (claim UI solo con testimone visivo —
  screenshot headless, mai "da diff"), T-07, **T-13** (worktree condiviso: failure di
  gate sospettare collisione, mai commit che catturino lavoro altrui).
- Invarianti: config-first (Zod), skin via `skinConfigRegistry`, i18n `common`/`idleVillage`,
  riuso primitivi `src/ui/{atoms,fantasy/atoms,idleVillage/skins/primitives}`, Zustand per
  stato condiviso, JSDoc su nuove funzioni/interfacce, `PersistenceService` dove serve.
- Tutte le run di verifica sono **headless/background** (regola 16-no-foreground-windows).

## Task (da artifact-r004, T1–T9 + nota Claude su T3)

- **T1** Token skin (drawer clamp 360/23vw/460, rail width, snap detents mobile, colori
  barre, CTA enabled/muted, inset fondo medaglione + **inset zona top-right riservata
  Chronicle**) — Zod schema + `skinConfigRegistry`.
- **T2** `ExpeditionDrawer` (docked / collapse chip / edge-tab per no-quest) + blocchi
  `QuestBanner`, `PartySlots`, `BagSlots`, `JourneyStrip` ("N days" + "Total: N days"),
  `RiskRewards`, `LaunchCta`.
- **T3** Slot party/bag: vuoto = icona ruolo + drop target; pieno = ritratto; selettore
  condiviso col roster; **tap slot party vuoto → apre rail su tab Roster, tap membro →
  riempie lo slot** (secondo passo esplicito, nota Claude); bag slot display-only (S2).
- **T4** Stati CTA: enabled / disabled + motivo inline (party incompleto) / hidden-in-empty.
- **T5** Colonna Roster|Stash: tab segmentati, ritratti, barre config-driven, righe stash
  icona+nome+una riga effetto, stat-chip compatti per membro nel tab Stash, persistente
  di default con collapse chip; altezza max sopra il medaglione bottom-left (inset).
- **T6** Top chrome: day banner + resource bar snelliti **a sinistra/centro** (top-right
  libero per Chronicle), nuovo sole ornamentale via skin.
- **T7** i18n EN/IT: estrazione chiavi, fix mixed-language, zero chiavi mancanti nel flow.
- **T8** Mobile/narrow: bottom sheet non-modale (peek/half/full, safe-area, wrapper
  pointer-events:none + sheet auto, drag solo da handle 44px), mutua esclusione
  superfici laterali ≤1100px testata a 1024 e 1100, mappa sempre interattiva.
- **T9** Docs trusted + mapping skin + test di regressione per tutti gli stati; **owner del
  mode-contract planning↔run**: test runtime che `QuestRunWindow` resta inalterato.

## Contratto di chiusura (obbligazioni verificabili)

1. **Drawer docked, no overlap** — `type: state` headless probe: canvas `/game` con
   drawer aperto → `insets.right` pubblicato nello store layout, rect mappa libera senza
   intersezione col drawer; pan/zoom clampato (test unitario sui bounds).
2. **Larghezze misurate** — probe headless a 1366/1440/1920: mappa libera ≥65% (rail
   chiusa) / ≥50% (entrambe aperte). Registrato in `verification.json`, non claim.
3. **Zona top-right riservata** — rect top chrome (banner+risorse) non interseca la zona
   Chronicle riservata (probe layout).
4. **Stati party/CTA** — `npm run test -- tests/unit/idleVillage/r339*` (regressione
   permanente, R-247): slot vuoto→icona+drop-target, pieno→ritratto, CTA disabilitata
   + motivo, tap vuoto→rail Roster, tap membro→slot riempito, empty-state edge-tab.
5. **Journey labels** — test su `JourneyStrip`: "N days" per segmento + totale da config.
6. **Stash tab** — righe icona+nome+effetto singola riga, stat-chip visibili, inset sopra
   medaglione.
7. **i18n zero missing** — check chiavi EN+IT sul flow expedition (test o probe).
8. **Niente CSS ad-hoc** — token tracciabili a `skinConfigRegistry` (grep check + review).
9. **Mobile/narrow** — test/probe: sheet non-modale (no scrim, no focus trap), target
   ≥44px, testo ≥16px, mutua esclusione a 1024 e 1100.
10. **Mode contract** — test runtime: `QuestRunWindow` renderizza invariato (confronto
    struttura/snapshot di contratto) mentre la planning UI è montata.
11. **Witness visivo (T-04)** — screenshot headless `/game` 1440×900 con drawer+rail:
    side-by-side baseline `mockup-chatgpt.png` vs implementazione; obbligazione
    `human-eye` esplicita (NOT_COMPARABLE ≠ PASS).
12. **Safeguards** — `lint -- <scope>` 0 errori, `build:check` OK, `closure:lint` OK,
    suite adiacenti verdi.

**Nota T-13:** la chiusura `fatta` dipende da `verify:bundle`; se `contracts:check`
fallisce solo su drift di sessioni parallele (precedente R-338), si registra il blocco
e si attende re-seal/ruling — niente commit scoped che catturino lavoro altrui.

## Fuori scope (dichiarato)

Tipografia funzionale/sentence-case, food-cost preview, bag-assign interattivo → **S2**.
Accenti blu/verde, map coverage/dim/recenter → **S3**. Unificazione frame, a11y scale,
gamepad, audit placeholder → **S4**. Port superficie Chronicle → slice dedicata (zona
riservata da D10). Nessuna modifica a regole gameplay/quest.

## Ledger — stato al 2026-11-15 (sessione overnight, agente locale)

**Fatto (slice sicura del cassetto + fondamenta):**
- Journey: etichette `legDays` i18n ("N days") + riga `journeyTotal` (INV-1). Visibile nel witness.
- CONFIRM disabilitato: motivo inline `confirmReason.*` + `aria-describedby` (INV-2).
- Slot party vuoto → `onOpenRoster` → `panels.set('roster', true)` su /game (INV-3).
- Edge-tab riposo no-quest `ExpeditionEdgeTab` docked `right:0` (INV-5, D6-b). Witness: right=1440 @1440px.
- Ledger insets Zustand `useGameLayoutInsets`; il cassetto pubblica `right = aspect × viewportH` (INV-4). NON ancora cablato a `safeFit`/pan-clamp (dedicato a T-01/T-04-safe).
- Lab host (`/hud-compose?comp=cassetto`) allineato: `totalDays` + `disabledReason` come l'adapter di /game.
- Bugfix wash dawn/dusk: `warm` era dead code con night plates attive → `washGradeFor` in `timeOfDay.ts` (regressione `r339DawnDuskWash.test.ts`).
- i18n: sezione `gameFrame.cassetto` completa EN+IT (le chiavi leg.* / demo.subtitle erano già referenced dal lab → `translation_missing`; ora coperte). Tipi rigenerati.
- Contratto `.mw/contracts/components/hud-real-cassetto.md` INV-1..5; test `r339ExpeditionStates.test.tsx` 10/10.
- Exception `useGameLayoutInsets` + retire amend-authorization registrati.

**Verifiche eseguite:** test 10/10 + `r339DawnDuskWash` + `r337CassettoBagSlots` 4/4 green; `build:check` green (`test-results/build-check-2026-11-15.log`); `contracts:index-sync` sincronizzato; witness headless `/game` + `/hud-compose` (screenshot `test-results/r339-*.png`, nessun pageerror).

**Blocchi documentati (NON risolti):**
- `contracts:check`: fallisce su baseline sealed `547c021c` — "R-339 cited by retire does not exist at BASE" (il commit `aea7f87a` post-data il seal) + drift estero (amanuense, quest-run-window, ecc.). Nessun aggiornamento seal fatto.
- `closure:lint`: timeout >30s sul worktree condiviso sporco (T-13). Nessun `fatta` in RICHIESTE.
- ESLint scopato: i file `src/ui/idleVillage/**` e `tests/unit/**` risultano ignored dalla config — copertura lint non significativa.
- `tests/i18n/icuInterpolation.test.ts`: 2 failure preesistenti su placeholder `{{...}}` legacy in `questGenLab` — NON causati da questa slice.

**Non fatto (prossime sessioni):** T1 token skin (clamp 360/23vw/460, detents), T2 struttura completa oltre l'esistente, T3 bag assign (S2), T6 top chrome + sole + zona Chronicle (D-227), T8 mobile bottom-sheet, cablaggio insets→safeFit. File sporchi della sessione parallela (voce R-338, poi-radial, reliquary/cassettoDetail) non toccati né committati.

### Seal + contratti (2026-11-15, ruling Director)
- `trusted:seal` eseguito (×2): BASE = HEAD. Errori miei risolti: unità `expedition-edge-tab` creata (INV-1, ex INV-5), inventory rigenerato via `componentInventory.ts --write`, scaffold `place-fan-cards` auto-creato. Push su main.
- `contracts:check` resta FAIL solo per **drift estero/preesistente** (amanuense, game-save, game-menu-screens, ~strict 0-owner, tier-1 zero-invariants, `research-prompt-protocol.md` frontmatter): serve passata governance dedicata o eccezioni.

## Ledger — T5 colonna Roster|Stash (2026-11-15, stessa sessione)

**Fatto:**
- `RosterStashRail` (`components/gameFrame/`): docked `left:0`, `HudPlaque` panel 320px, top `rail.marginPx`, bottom `rail.bottomInsetPx` (D8 — sopra il medaglione voce). Tab segmentati Roster|Stash; collapse chip come unica forma ripiegata; expanded di default (D2).
- Roster tab: riga per membro — medaglione ritratto (`getResidentPortraitUrl`), nome, badge `Lv N` (`heroLevelView`), stato (`zanaraRosterState` + `roster.status.locked`/zanara.state.*), barre da `rail.bars` in config (hp/stamina, labelKey + token skin `--skin-statbar-*` — config-driven, zero hardcode).
- Stash tab: stat-chip compatti per membro (ritratto+nome+micro-barre config) poi righe ledger `villageStashViewModel` (tile+nome+una riga effetto ellissata, tooltip completo Radix); click→`assign(owner,itemId)` identico al magazzino quando `activeStashOwner` bound (la pagina ora binda anche con tab Stash aperto, non solo `villageStash` panel).
- Store `useExpeditionRail` (Zustand): `expanded` default true, `tab`, `mutexCollapsed`, `open(tab)`, `applyDrawerMutex`. Pubblica `insets.left` = 320 espansa / 40 chip / 0 nascosta-smontata.
- Mutual exclusion ≤1100 (D2): drawer aperto → rail ripiega mutex-owned e ripristina alla cessione; espansione esplicita della rail → la pagina chiude il detail (transizione false→true, niente veto su rail già espansa).
- Empty party seat (AC4): `onOpenRoster` → `useExpeditionRail.getState().open('roster')` — INV-3 cassetto emendata (retire registrato; statement ratchet pendente approvazione Director).
- Config: `rail.marginPx=24`, `bottomInsetPx=240`, `chipWidthPx=40`, `bars[hp,stamina]` in `cassettoLayoutConfig` (Zod). i18n `gameFrame.rail.*` + `roster.status.locked` EN/IT; tipi rigenerati.
- `r339ExpeditionStates.test.tsx` ripristinato da `be53077e^` (era stato svuotato in 4a3b4b15 mentre i contratti lo citavano): tag INV-5→`expedition-edge-tab.INV-1`, wiring regex→rail.

**Verifiche:** `r339RosterStashRail.test.tsx` 10/10 + `r339ExpeditionStates` 10/10 + scoped stash/cassetto verdi (2 failure in `r335CassettoResources`/`r337CassettoBagSlots` = diff estero su `HudRealCassettoDetail.tsx`, T-13 non mio); `build:check` green; `contracts:index-sync`+inventory rigenerati (scaffold hero-level-*/village-stash-* auto-creati); witness headless `/game` 1440×900 (`test-results/r339-rail-*.png`): rail left:0 top:24 bottomGap:240, 6 righe, stash 6 chip+6 items "6 of 24 goods", collapse→chip 40px→restore con tab ricordato; narrow 1024 mount ok.

**Pendenze Director:** statement `hud-real-cassetto.INV-3` mutato (ratchet richiede approvazione, non solo journal); sync-gate 25 amend/retire > cap 3 (cumulato BASE..WT, serve sync-amend-override); file esteri UNMAPPED (reliquary/probe sessione parallela).

### safeFit wiring — scoperta: NON è una prop, è un cambio di framing
`/game` monta `PixiWorldMap` **senza** `safeFit` → cover-fit, "the framing the Director approved" (commento in pagina). Attivare safeFit con `insets.right` dal ledger richiede: `landBounds` dal manifest + `seaMarginPx/YPx` + verifica che a riposo il framing non cambi (T-01) + witness T-04 su apertura/chiusura drawer. Task dedicato, stimato non banale — NON fatto.
### Prossimi: T6 chrome+sole (hudLayoutB ruling ok) · T8 sheet · T1/T2/T3 restanti · gate chiusura R-339.
