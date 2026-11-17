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
  condiviso col roster; **tap slot party vuoto → apre il pannello roster
  (`panels.roster`), tap membro → riempie lo slot** (secondo passo esplicito,
  nota Claude); bag slot display-only (S2).
- **T4** Stati CTA: enabled / disabled + motivo inline (party incompleto) / hidden-in-empty.
- **T5** ~~Colonna Roster|Stash: tab segmentati, ritratti, barre config-driven, righe stash~~ **REVERTED 2026-11-15 (ruling Director): roster e stash restano superfici sempre divise e separate** — vedi banner nel ledger T5.
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
- Edge-tab riposo no-quest `ExpeditionEdgeTab` docked `right:0` (INV-5, D6-b). Witness: right=1440 @1440px. **← SUPPRIMÉ par R-351 (2026-11-15, ruling Director : « questo componente nn deve esistere ») — aucune surface au repos sans quest.**
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

**Non fatto (prossime sessioni):** T1 token skin (clamp 360/23vw/460, detents), ~~T2 struttura completa oltre l'esistente~~ (fatto, vedi ledger T2), ~~T3 bag assign (S2)~~ (fatto, vedi ledger T3/S2), ~~T6 top chrome + sole + zona Chronicle~~ (fatto, vedi ledger T6), T8 mobile bottom-sheet, cablaggio insets→safeFit. File sporchi della sessione parallela (voce R-338, poi-radial, reliquary/cassettoDetail) non toccati né committati.

### Seal + contratti (2026-11-15, ruling Director)
- `trusted:seal` eseguito (×2): BASE = HEAD. Errori miei risolti: unità `expedition-edge-tab` creata (INV-1, ex INV-5), inventory rigenerato via `componentInventory.ts --write`, scaffold `place-fan-cards` auto-creato. Push su main.
- `contracts:check` resta FAIL solo per **drift estero/preesistente** (amanuense, game-save, game-menu-screens, ~strict 0-owner, tier-1 zero-invariants, `research-prompt-protocol.md` frontmatter): serve passata governance dedicata o eccezioni.

## Ledger — T5 colonna Roster|Stash (2026-11-15, stessa sessione)

> **REVERTED — ruling Director 2026-11-15:** *«qualche AI ha mischiato roster e
> stash su /game, riportalo com'era prima»*. La colonna unica Roster|Stash è
> stata rimossa (`RosterStashRail`, `useExpeditionRail`, test e contratto
> `roster-stash-rail` cancellati; `onOpenRoster` → `panels.set('roster', true)`;
> INV-3 ripristinata; config `rail.*` e i18n `gameFrame.rail.*` rimossi;
> eccezione coverage dello store ritirata). **Invariante registrata: roster e
> stash su /game restano superfici SEMPRE divise e separate** — il roster è il
> pannello flottante `panels.roster` (`MatericRosterComponentV2`), lo stash è il
> magazzino `panels.villageStash` (`VillageStashPanel`); nessuna colonna, tab o
> superficie unificata. Chiunque proponga di nuovo una fusione deve passare da
> ruling Director esplicito. Il ledger sotto resta come storia.

**Fatto (poi revertito, vedi banner sopra):**
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

## Ledger — T6 top chrome slim (2026-11-15, stessa sessione)

**Fatto:**
- `GameTopChrome` (`components/gameFrame/`): cluster docked fascia superiore, day banner + resource bar come due `data-hudslot` separati (`time`/`resources`), arte slim firmata `bar-slim.webp` (PLAN-112 F4) via `timeSlimGeometry`/`resourcesSlimGeometry`. Solo blueprint mode — phone/landscape mantengono il chrome full-size esistente.
- Posizionamento: bordo sinistro = `insets.left/scale + topChrome.marginPx` (segue il fold della rail), bordo destro ≤ `W - chronicleReserve.widthPx` — **zona top-right riservata** alla futura Chronicle docked (D3+D10, niente tab pendente). Fit = min(1, banda/naturale); sotto `topChrome.minFitScale` la riserva cede e il bound duro resta `W - marginPx` (mai fuori schermo).
- Sole ornamentale (D3): dial di fase riusato — disco `sun.webp`/`moon.webp` + corona tick seduto nell'emerald della slim bar, geometria misurata `timeOfDay.dialSlim` in `gameFrameConfig` (Zod), colori/URL da config.
- `useGameLayoutInsets.insets.top` pubblicato = `marginPx` + riga scalata (× fit × frame.scale); 0 quando nascosto/smontato; cassetto `right`, `left` non posseduto (rail revertita 2026-11-15 — chrome resta a `marginPx`).
- `HudRealTime`/`HudRealTimeConnected`/`HudRealResources` parametrizzati (variante `slim`/`compact`, bar URL e geometria da config/prop) — nessuna superficie duplicata; chip compatti per gli slot risorse più stretti.
- Config: `topChrome{marginPx, chronicleReserve.widthPx, minFitScale}` in `cassettoLayoutConfig` (Zod). i18n `gameFrame.topChrome.*` EN/IT; tipi rigenerati.
- Contratto `.mw/contracts/components/game-top-chrome.md` INV-1..5; riga in `COMPONENT_MASTER_INDEX` via `contracts:index-sync`.

**Verifiche:** `r339TopChrome.test.tsx` 11/11 (insets.top+cleanup, hidden, zoom, left=rail+margin, riserva, chip fold, naturale@1920, fallback stretto, slot separati, chip compatti, sole/luna); `r339ExpeditionStates` 10/10 + `gameHudPlacement` 19/19 + `r339DawnDuskWash` 8/8 verdi; `i18n:types` OK; `build:check` OK (`test-results/build-check-2026-11-15.log`); lint scope 0 errori (file idleVillage/tests ignored, già noto). Witness headless `/game?poiDemo=1` (`test-results/r339-topchrome-{1440,railfold,1024,full}.png`): left=332=rail(320)+12, right=1081=riserva(1440-360), phase=day sun.webp, 3 chip; fold rail → left=52; 1024 → right=1013 in-window. Reload HMR della sessione parallela (T-13) gestito nel probe (click DOM + strip veil).

**Blocchi esteri (non miei):** `r339RosterStashRail.test.tsx` 10/10 rosso — il rail ora monta `useDndMonitor`/`DragProvider` (drag roster, sessione parallela R-340bis) e il test lo renderizza senza provider; da sistemare nel suo scope.

**Chronicle: NON implementata** — solo la zona top-right è riservata (D10); port dedicato in slice futura.

**Aggiornamento 2026-11-15 (R-350, ruling Director + fix regressione segnalata dal Director):** la resource bar non è più nel cluster left/center — è **centrata sul centro orizzontale assoluto del frame** (`resLeft = (W − RES_W·fit)/2`); il day banner era rimasto staccato a margine («la parte a sinistra è di nuovo sfalsata») e ora siede **a filo alla sinistra della barra** (`bannerLeft = resLeft − gapPx − TIME_W·fit`) — la coppia resta unita. `insets.left` diventa il bound del bordo sinistro della coppia (stessa disuguaglianza del vecchio cluster: `fit ≤ overlapFit`); riserva Chronicle soft → cede sotto `minFitScale`; bordo finestra hard. Contratto `game-top-chrome` INV-2/INV-4 amendati + `sync-amend-override`; test `r339TopChrome` 11/11; witness headless `test-results/r350-resources-centre-{1440,1920}.png` (centro barra = centro frame Δ0, pairGap=10=gapPx).

**Aggiornamento 2026-11-16 (R-352, ruling Director):** la resource bar è **speculare da capo a capo** — il cap sinistro è UN solo pezzo capovolto — la fetta di coda scelta dal Director nel cap-mirror lab (`topChrome.resCapMirror` = src `{x:298,y:2.5,w:61,h:57}` → dest `{x:1.5,y:2.5}`, flip-H sull'arte 360×62) — e **pareggiata in altezza di capsula** col banner: `topChrome.capsulePx {time:52.5, resources:56}` (misure sulle bande solide dell'arte firmata, orpelli esclusi) → `RES_K=0.9375`; tutta la matematica del chrome usa `RES_W/RES_H` effettivi (slot 337.5×58.1). Nuovo `game-top-chrome.INV-6` + `sync-amend-override`; test `r339TopChrome` 13/13; witness `test-results/r352-cap-zoom.png`.

**Aggiornamento 2026-11-15 (R-351, ruling Director):** `ExpeditionEdgeTab` supprimé — le tab vertical « SELECT A QUEST MARKER » au repos ne doit pas exister ; la page ne monte plus aucune surface expedition sans quest sélectionnée (le cassetto signé apparaît directement à l'ouverture d'un detail). Composant + contrat `expedition-edge-tab` retirés ; `expedition-drawer.INV-1` et `expedition-bottom-sheet` amendés ; test `r339ExpeditionStates` mis à jour (pin d'absence).

### safeFit wiring — scoperta: NON è una prop, è un cambio di framing
`/game` monta `PixiWorldMap` **senza** `safeFit` → cover-fit, "the framing the Director approved" (commento in pagina). Attivare safeFit con `insets.right` dal ledger richiede: `landBounds` dal manifest + `seaMarginPx/YPx` + verifica che a riposo il framing non cambi (T-01) + witness T-04 su apertura/chiusura drawer. Task dedicato, stimato non banale — NON fatto.

## Ledger — T1 token skin completamento (2026-11-15, stessa sessione)

**Stato T1 all'apertura:** layout già tokenizzati in `cassettoLayoutConfig` (commit `be53077e`): drawer clamp {360, 0.23, 460} (consumato come cap in `cassettoColumnWidthFor`), rail {320/40/margin/bottomInset/mutex 1100}, `bottomSheet` detents {56, .5, .92} (consumo in T8), `topChrome.chronicleReservePx` (consumato in T6), `rail.bars[].fill` → `var(--skin-statbar-*)`. **Unico residuo: "CTA enabled/muted"** — i colori/opacity del CONFIRM erano hardcoded in `HudRealCassetto` (`RACK_SCOPED_CSS` + inline `opacity 0.55` + `color #eafff5`).

**Fatto:**
- 10 nuovi token `--skin-cassetto-cta-*` in `BASE_SKIN_CSS_VARS` (`skinCssVariables.ts`): text, textShadow, mutedOpacity, sheen, sheenRing, pressSheen, pressRing, pressTransform, hoverTextGlow, focusRing — override per preset possibili, nessun componente tocca più un letterale colore/opacity per la CTA.
- `cassettoLayoutConfig.cta.vars` (blocco Zod strict): dichiara i NOMI dei token consumati — catena tracciabile config → `var(--skin-*)` → registry (AC8), stesso pattern di `rail.bars[].fill`.
- `HudRealCassetto`: `RACK_SCOPED_CSS` interpola `CTA_VARS.*`; lo stato muted è una regola `:disabled` nel foglio scoped (`opacity: var(--skin-cassetto-cta-muted-opacity)`) — rimosso l'inline `opacity 0.55` e il colore/test-shadow letterali di `.confirm-text`. Delta visivo: **zero** (valori identici, ora da token).
- Test permanente `tests/unit/idleVillage/r339ExpeditionTokens.test.tsx` 6/6: pin schema (strict, numeri T1), cap `widthMaxPx`, tracciabilità token (ogni `var(--skin-*)` nominato in config esiste in `BASE_SKIN_CSS_VARS`), regole CONFIRM senza letterali colore, muted via token.
- Contratto `.mw/contracts/components/expedition-layout-tokens.md` (INV-1..3, shared-kernel t2; scope solo `cassettoLayoutConfig.ts` + `cassettoColumn.ts` — i file strict già owned restano ai loro contratti).

**Verifiche:** nuovo test 6/6; suite adiacenti `r339ExpeditionStates` 10/10, `r339DawnDuskWash` 8/8, `r339TopChrome` 11/11, `r339RosterStashRail` 10/10 verdi; `i18n:types` OK; `build:check` OK (`test-results/build-check-2026-11-15.log`); lint scope 0 errori (file ignored — gap noto). `contracts:index-sync` "già sincronizzato" (unit non in inventory: `componentInventory --write` è bloccato dal drift partition estero — 2-owner su `gameFrame/menu/*` + `placeFanGeometry.ts` — stessa situazione di `hud-real-cassetto`; riga index in attesa di re-seal). Witness headless **lab** `/hud-compose?comp=cassetto` (`test-results/r339-cta-tokens-lab.png`): computed `opacity 0.55` (muted, party vuota), `color rgb(234,255,245)`, sheen gradient risolti via `var()` dal layer skin — token live, visual identico.

**Nota T-13 (witness /game):** il witness diretto su `/game?poiDemo=1` è rimasto bloccato dalla tempesta HMR della sessione parallela — 18 navigations in ~170s, boot Pixi (fasi manifest→assets→build→warmup→ready) resettata in loop; un unico quiet window ha raggiunto `phase:"ready"` + `data-map-ready` alle ~163s, poi reload prima del click POI. Stessa componente già witnessata su /game nelle slice T5/T6; il delta T1 è pura estrazione token (verificato computed-identico sul lab). Il probe retry è in `scripts/hud-real/_tmp-probe-game-cta.mjs` per la prossima finestra calma. **Inoltre la prima stesura di questa voce di ledger è stata cancellata dal worktree churn (pull --rebase + checkout della sessione parallela): riapplicata.**

**Misura AC2 (da registrare, non risolta):** con rail 320 + colonna art 420px @1440×900 la mappa libera è (1440-320-420)/1440 = **48,6%** — sotto il 50% "both open" del contratto D4. Il token `widthVwFraction`/clamp era stato pensato per un drawer 360–460px; l'art firmata R-323 (420px) eccede il budget solo a 1440 (a 1366 ≈50,4% e a 1920 ≈59,4% restano sopra). Serve ruling: accettare 48,6%, estendere il mutex band, o ridurre la riserva. Il probe misurato (obbligazione 2) confermerà. **Risolto dal ruling 2026-11-15:** la rail è stata rimossa del tutto → a 1440 la mappa libera con cassetto aperto torna (1440-420)/1440 ≈ **70,8%**.

**Scope residue del file:** `HudRealCassetto.tsx` mantiene letterali colore legacy fuori dal path CONFIRM (palette `C.*`, risorse, bag slots) — la tokenizzazione completa del file è oltre T1 (flaggato, non fatto in silenzio).

## Ledger — T2 ExpeditionDrawer primitiva (2026-11-15, stessa sessione)

**Fatto:**
- `ExpeditionDrawer` (`components/gameFrame/`): la primitiva drawer expedition — wrapper docked del `HudRealCassetto` firmato + contratto di piega. Due sole forme con quest selezionata: colonna espansa (invariata) e chip destro ripiegata; il riposo no-quest resta `ExpeditionEdgeTab` (superficie diversa, contratto `expedition-edge-tab`), non un modo del drawer.
- Fold chip sul bordo sinistro vivo della colonna — offset `min(aspect × 100vh, widthMaxPx)` in CSS puro (stessa regola di `cassettoColumnWidthFor`, nessun secondo listener); chip ripiegata 40×72 docked `right:0`, mirror di `rail-expand-chip` (pouch + chevron).
- `useExpeditionDrawer` (Zustand): `expanded` default true, persiste tra remount e switch quest come intenzione utente (mirror D2 "state preserved"). Store proprio perché il drawer monta dentro `wrapDetail` e superfici sorelle (mutex rail ≤1100, sheet T8) possono dover pilotare il fold dall'esterno.
- Sei blocchi nominati `data-block` (`quest-banner`, `party-slots`, `bag-slots`, `journey-strip`, `risk-rewards`, `launch-cta`) via wrapper `display:contents` in `HudRealCassetto` — zero delta layout. Cella costo riservata `cassetto-cost-slot` (`data-placeholder="cost-preview"`, vuota e non interattiva, flaggata) nel gap risk↔rewards — sede della preview food-cost S2 (artifact-r004 "reserved cost slot").
- Config: `drawer.chipWidthPx=40` (schema strict + RAW); il pin T1 in `r339ExpeditionTokens` aggiornato alla nuova shape. Occupazione onesta: il chip pubblica `chipWidthPx` in `insets.right`, espanso la colonna continua a possedere la propria misura (mai clobberata), unmount/`visible=false` → 0.
- Wiring: `HudRealCassettoDetail` (/game via `wrapDetail`) e `HudRealCassettoHost` (lab) montano `ExpeditionDrawer` — stesse prop, stesso stato sessione (fold solo visivo, nessun closeDetail). `useCassettoColumnSpec` esportato da `HudRealCassetto` per il chip.
- i18n `gameFrame.cassetto.collapse` / `.expand` EN+IT; tipi rigenerati. Contratto `.mw/contracts/components/expedition-drawer.md` INV-1..5.

**Verifiche:** `r339ExpeditionDrawer.test.tsx` 7/7 + tutte le suite r339 (52 test) verdi; `r335CassettoResources`/`r337CassettoBagSlots` 1 failure ciascuna = **asserzioni statiche stale preesistenti su `HudRealCassettoDetail` (rosse già a HEAD, già note nel ledger T5 — non mie)**; `i18n:types` OK; `build:check` OK (`test-results/build-check-2026-11-15.log`); `contracts:index-sync` "già sincronizzato" (unit non in inventory: `componentInventory --write` bloccato dal drift partition estero come T1 — riga index in attesa di re-seal); lint scope 0 errori (file ignored — gap noto). Witness headless **lab** `/hud-compose?comp=cassetto` (`test-results/r339-t2-lab-{expanded,foldchip,chip,edgechip,restored}.png`): EXPANDED sei `data-block` + cost-slot, fold chip `min(46.68vh,460px)` sul bordo sinistro colonna; FOLDED solo chip 40×72 a `right:1440` (insets.right=chipWidthPx); RESTORED colonna+CONFIRM.

**Nota T-13:** il witness diretto su `/game?poiDemo=1` resta bloccato dalla tempesta HMR della sessione parallela (boot reset in loop, identico a T1) — retry probe `scripts/hud-real/_tmp-probe-game-drawer.mjs`. Il lab monta fixture proprie sopra i chip (debug roster strip x740–1040, POI card sul bordo destro) — occlusioni di laboratorio, non del drawer; click DOM + occluder nascosti solo per gli screenshot dei chip.

## Ledger — T3/S2 bag-assign + food-cost preview (2026-11-15, stessa sessione)

**Fatto:**
- `expeditionBagAssign.ts` (`components/gameFrame/`, nuovo): due helper puri — `bagAssignEligibility(bag, itemId, bagSlots)` → `eligible | packed | bagFull`, specchio dei reject del ledger (`alreadyInBag`/`bagFull`) sulla bag SPARSA (posizioni fisse, bag assente = `bagSlots` liberi); `expeditionFoodCost(party, days, rate)` = ceil(party × days × `globalRules.foodConsumptionPerResidentPerDay`) — la stessa tariffa del TimeEngine, display-only, input malformati → 0. JSDoc su entrambi.
- `HudRealCassetto`: `CassettoQuest.costPreview?: { icon, qty, insufficient? }`; la cella riservata `cassetto-cost-slot` ora dipinge caption `gameFrame.cassetto.cost` + icona `res-food-64` + qty, `data-tone="danger"` quando insufficiente — `pointer-events:none` in entrambe le forme, segnaposto flaggato quando la preview manca.
- `HudRealCassettoDetail` (/game): ripristinato il mirror della bag sparsa — `useVillageStashStore((s) => s.bags[p.poi.id])` + `emptyStashBag().map` (era tornato denso su `selectedItemIds` per churn; `r337CassettoBagSlots` torna verde). `costPreview` derivata da party riempiti × `totalDays` × rate config vs la food viva della `resourceItems` (`id==='food'` → `insufficient`).
- `HudRealCassettoHost` (lab): stessa formula → `quest={{ ...quest, costPreview }}` — il testimone lab mostra la cella popolata.
- `VillageStashPanel` (magazzino canonico — superficie separata per ruling Director): righe bound portano `data-assign-state` (eligible → wash accento `--skin-icon-accent`; packed/bagFull → opacity .55, click SEMPRE verso `store.assign` — i reject annunciano via `lastEvent`, nessuna seconda autorità); hint `stash-bag-full-hint` (`gameFrame.stash.bagFullHint` EN+IT) quando la bag è piena e restano righe. Read-only: nessun marker (INV-2).
- i18n `gameFrame.cassetto.cost` (Cost/Costo) + `gameFrame.stash.bagFullHint`; tipi rigenerati; pseudo rigenerato.
- Contratti: nuovo `expedition-bag-assign.md` (INV-1/-2); `expedition-drawer.INV-4` emendato (cella popolabile, mai interattiva); `village-stash-panel.INV-2` nuovo (marker eleggibilità); `hud-real-cassetto.INV-5` nuovo (costPreview + mirror sparso). Riga inventory inserita a mano + `contracts:index-sync` eseguito.

**Verifiche:** `r339BagAssign.test.tsx` nuovo **16/16** (helper, cella costo popolata/danger/placeholder, eleggibilità shelf eligible/packed/bagFull/hint/readonly, wiring statico Detail/Panel/Host); suite r339+r337 **62/62 verdi** (r337 incluso — la regression sparse-bag è chiusa dal mirror ripristinato); `i18n:types` OK (`i18n:validate` 217 missing key = debito preesistente `poiDetail`/`testRoster`/`questS1Lab` — nessuna chiave mia); `build:check` OK (`test-results/build-check-2026-11-15.log`); `contracts:index-sync` eseguito (riga `expedition-bag-assign` nel master index; `--check` residui: drift sha + two-owner `gameFrame/menu/*`+`placeFanGeometry` = foreign, documentato, `--write` non forzato; warning "expedition-bag-assign non in inventory" perché la partition vede solo file tracciati — si risolve al commit). Witness headless **lab** (`test-results/r339-t3s2-cost-slot.png` + probe `_tmp-probe-t3s2-cost.mjs`): cella popolata "Cost" + icona food + qty 0 (party lab vuota — 0×giorni×rate è il valore corretto), `pointer-events:none`, placeholder sollevato.

**Nota T-13:** `/game?poiDemo=1` resta bloccato dalla tempesta HMR della sessione parallela (3 round, mai `data-map-ready`) — retry probe `_tmp-probe-t3s2-game.mjs` scritto per la prossima finestra calma (copre cella + `data-assign-state` sulla shelf bound end-to-end). Click roster nel lab non assegna via headless (path click→assign è session/drag-driven, plumbing di laboratorio — non superficie del contratto); il valore non-zero e il tono danger sono coperti dai test unit.

## Ledger — T8 mobile bottom-sheet (2026-11-15, stessa sessione)

**Fatto:**
- `ExpeditionBottomSheet` (`components/gameFrame/`): la forma mobile/narrow della superficie expedition (D5). Shell non-modale: wrapper `position:fixed; inset:0; pointer-events:none`, solo il box dello sheet `pointer-events:auto` — nessuno scrim, nessun focus trap, `role="region"` (mappa sempre interattiva, AC9).
- Detent dai token `bottomSheet`: `peek` = `calc(56px + env(safe-area-inset-bottom))` (la strip CTA resta visibile), `half` = 50vh, `full` = 92vh. Stato in `useExpeditionSheet` (Zustand — sopravvive ai remount come intenzione utente, stesso contratto del fold drawer).
- Drag SOLO sulla strip handle+header ≥44px (`touch-action:none`): pointerdown → window pointermove/up, live-height clampata peek↔full, rilascio → snap al detent più vicino. Il body scrolla e non dragga mai; CONFIRM/chevron non iniziano un drag (`closest('button…')` veto). Chevron toggla peek ⇄ half come affordance non-drag.
- Stessi sei blocchi nominati `data-block` e testid del cassetto (`cassetto-confirm`, `cassetto-confirm-reason`+`aria-describedby`, `cassetto-journey-total`, `cassetto-cost-slot` flaggato, `bag-slot-*`, `loadout-item-*`, `ResidentSlotRack` reale a `slotPx`=48): `launch-cta` siede nella strip (peek = CTA row per D5), gli altri nel body scrollabile. Testo ≥`minTextPx` (16) ovunque; CONFIRM riusa `cta.vars` (`--skin-cassetto-cta-*`), nessun letterale colore/opacity per la CTA.
- Mutua esclusione (AC10, boundary incluso ≤1100): `useExpeditionSheetMode` (matchMedia `max-width: 1100px`, stesso token) — `ExpeditionDrawer` in quella banda monta lo sheet al posto della colonna: colonna ed entrambi i chip NON montano mai, anche con `expanded=false`; `insets.right` resta 0. La pagina esclude `ExpeditionEdgeTab` con `win.w > maxWidthPx`. Sopra 1100 il drawer mantiene la colonna (test di boundary).
- Occupazione onesta: l'altezza misurata dello sheet pubblica `insets.bottom` (fallback al token del detent quando `offsetHeight`=0); unmount/`visible=false` → 0.
- i18n `gameFrame.sheet.{expand,collapse}` EN+IT; tipi rigenerati; pseudo rigenerato.
- Contratto `.mw/contracts/components/expedition-bottom-sheet.md` INV-1..7.
- **Nota scope (drift D5 → ruling):** D5 prevedeva "stash = terzo tab (Quest|Party|Stash)" — NON implementato: il ruling Director 2026-11-15 (roster e stash sempre superfici separate) prevale; lo sheet non ospita tab. Flagged per il record.

**Verifiche:** `r339ExpeditionSheet.test.tsx` nuovo **19/19** (shell non-modale, detent da token, drag solo handle + snap-nearest entrambe le direzioni, sei blocchi + cost-slot, CTA muted/enabled, insets.bottom + cleanup, target ≥44/testo ≥16, mutua esclusione ≤1100 sia folded sia expanded + boundary >1100). Suite r33* **99/100** — unico rosso = `r335CassettoResources` static assertion stale preesistente (identica a HEAD, già documentata T2/T5, estera). `i18n:types` OK; `build:check` OK (`test-results/build-check-2026-11-15.log`); lint scope 0 errori (file idleVillage/tests ignored — gap noto). `contracts:index-sync` "già sincronizzato" — unit NON in inventory (drift partition estero come T1/T2/T3: riga index in attesa di re-seal, `--write` non forzato per istruzione). `contracts:check` timeout >170s sul worktree condiviso (T-13) — blocco documentato, non risolto.

**Witness headless LAB** `/hud-compose?comp=cassetto` @1024×800 (`test-results/r339-t8-sheet-{peek,half,full,backpeek}-lab-1024.png`): PEEK strip 56px a bottom con pouch+reason+CONFIRM+chevron, `pointer-events` wrapper none/sheet auto, zero colonna/chip/edgeTab, sei `data-block`; HALF h=400=50vh esatto; drag up → FULL h=736=92vh; drag down → HALF (snap-nearest). Artefatto lab: lo sheet è largo 400px perché il lab monta il drawer dentro un contenitore trasformato (il `position:fixed` si ancora al contenitore, non al viewport) — su /game il wrapper `wrapDetail` è `fixed inset:0` senza transform → sheet full-width. Non verificato su /game.

**Nota T-13:** il witness diretto su `/game?poiDemo=1` resta bloccato dalla tempesta HMR della sessione parallela (2 round, mai `data-map-ready` in 300s+200s) — retry probe `scripts/hud-real/_tmp-probe-t8-sheet.mjs` scritto per la prossima finestra calma (copre edge-tab assente pre-quest + sheet + detent + mutua esclusione a 1024). Probe lab in `_tmp-probe-t8-sheet-lab.mjs` / `_tmp-probe-t8-drag.mjs`.

### Re-verifica post-churn (2026-11-15, sessione serale)

La storia riscritta dalla sessione parallela non ha toccato i file T8 — tutto
il materiale è intatto nel worktree (`ExpeditionBottomSheet.tsx`,
`useExpeditionSheet.ts`, `r339ExpeditionSheet.test.tsx`, contratto, wiring
`game-mappa2`/`ExpeditionDrawer`, token `bottomSheet`, i18n `gameFrame.sheet.*`).
Ri-verifica completa eseguita sui file vivi:

- `r339ExpeditionSheet.test.tsx` **19/19** verdi; suite `r33*` **99/100** —
  unico rosso `r335CassettoResources` (asserzione statica stale su
  `useMinimalGameplayWithIdleVillageConfig`: 0 occorrenze nel file a HEAD,
  rossa già prima di questa slice — estera, già documentata in T2/T5).
- `i18n:types` rigenerati OK; `build:check` OK (`test-results/build-check-2026-11-15.log`);
  lint scope 0 errori (file idleVillage/tests ignored — gap noto).
- **Inventory/index:** `componentInventory --check` conferma il blocco estero
  (sha partizione `18f0fdc9` ≠ stored `4b806791` + 2-owner `gameFrame/menu/*` +
  `placeFanGeometry.ts` + `scene-reveal-layer` senza contratto) — `--write` non
  forzato per istruzione. Riga `expedition-bottom-sheet` inserita a mano in
  `inventory.json` (precedente T3 per `expedition-bag-assign`: la partizione
  meccanica GIÀ calcola l'unità — nessun warning "non in inventory" — manca
  solo la riga stored; `content_sha256` lasciato com'è perché la deriva è
  estera e va vista, non mascherata). `contracts:index-sync` → riga in
  `COMPONENT_MASTER_INDEX` (r.268), `--check` **drift zero**.
- **Witness lab re-run** `/hud-compose?comp=cassetto` @1024×800: PEEK h=56,
  wrapper `pointer-events:none` / sheet `auto`, zero colonna/chip/edgeTab,
  sei `data-block`, CONFIRM in strip; HALF h=400=50vh esatto; probe drag
  dedicato `_tmp-probe-t8-drag.mjs` (presa a x+20 sulla strip) → FULL
  h=736=92vh, drag down → HALF 400 (snap-nearest). Screenshot aggiornati
  `test-results/r339-t8-sheet-{peek,half,full,backpeek}-lab-1024.png`.
  Nota probe: il drag dead-center di `_tmp-probe-t8-sheet-lab.mjs` resta a
  `half` perché a 400px di larghezza il centro della strip cade sul CONFIRM —
  veto corretto di INV-3 (i figli interattivi non iniziano un drag), artefatto
  del probe non difetto dello sheet.
- **Witness /game:** ancora bloccato — `_tmp-probe-t8-sheet.mjs` ha esaurito
  il deadline 420s in 3 round senza mai `data-map-ready` (tempesta HMR
  estera persistente, identica a T1/T2/T3). Retry probe invariato.
- **Gate T8-specifici chiusi:** `closure:lint` (~94s sul worktree sporco)
  resta FAIL ma le due voci T8 sono risolte: (a) `useExpeditionSheet.ts`
  «file senza superficie mappata» → `coverage_exception`
  `EXC-20261115205437-8t8s` (stesso percorso di `useGameLayoutInsets` T1);
  (b) `visual-fork: useExpeditionSheet.ts … ≥v35 senza card né skip puntato`
  → card di skip registrata `.mw/runs/r339-expedition-ui/visual-fork-t8-bottom-sheet.md`
  (baseline = mockup approvato Director, scope = i due file T8). I tre probe
  `_tmp-probe-t8-*.mjs` coperti da `EXC-20261115205911-p3t8`; lo store del
  drawer (debito T2, stessa classe) coperto da `EXC-20261115210122-d2st`.
- **Residui closure:lint NON miei (documentati):** `deliverables/tambu-*`
  (file esteri); assert BASE rail rimossi (`expedition-layout-tokens.INV-1/-3`,
  `hud-real-cassetto.INV-3` — conseguenza del revert rail, ratchet pendente
  approvazione Director); Mode B-amend `game-menu-screens`/`game-save`/`game-settings`
  (esteri); sync-gate 50 amend/retire > cap 3 (cumulato, override pendente);
  `expedition-drawer` scope diverge dall'unità inventory (regen estero ha
  perso `useExpeditionDrawer.ts` dallo scope — precedente del T2); probe
  `_tmp` delle slice precedenti senza exception; `executedCount(BASE) unknown`
  su `expedition-edge-tab`/`game-top-chrome`/`hud-real-cassetto` (re-seal
  pendente, T-13: niente checkout consentito).

### Prossimi: cablaggio insets→safeFit · witness /game T8 in finestra calma · gate chiusura R-339.

## Ledger — T10 cassetto "estratto" R-353 (2026-11-16)

**Richiesta (verbatim Director):** *"voglio che la parte 'a destra' nn abbia nulla tipo frame, cornici, ecc, ma deve essere tipo estratto da li"* → solo il bordo che arriva da fuori schermo perde frame/cornice: **top/bottom/sinistra tengono cornice, destra a filo schermo — zero frame, zero fessura di mappa**. Ruling raccolti: variante **coesiste** con arte R-323 (non sostituita); ambito solo pannello expedition (roster/stash esclusi, restano flottanti con mockup come riferimento estetico); golden reference = `mockup-cassetto-v2.png` (sha256 `d2f743ab`, ChatGPT gen, «vabene la v2») — il taglio netto si risolve in asset build via lab pick.

**Approccio tecnico:** clip esterna sul wrapper colonna — la colonna `HudRealCassetto` resta a larghezza piena dentro un clip `overflow:hidden` di larghezza `W − clip`, posizionata `right: −clip` (zones intatte, coord relative alla colonna piena); `insets.right` pubblica `W − clip` (occupazione onesta); chip fold sul bordo sinistro vivo = `W − clip` dal bordo destro. Config `drawer.edgeClipPx {1440, 1280}` (design px, pick Director in `public/mockups/cassetto-edge-lab/`) + `drawer.edgeMode` per la coesistenza 'framed'/'extracted'.

**Contratto:** `.mw/runs/r353-cassetto-edge/verification.json` — edge-flush (test) · coexist (test) · occupancy (test + drawer suite) · witness T-04 headless side-by-side vs mockup-cassetto-v2 (human-eye).

**Implementato (2026-11-16, pick Director dal lab):** spec congelato in `src/balancing/config/idleVillage/cassettoExtractedEdge.json` — edgeClip {1440:72 (filetto oro), 1280:76 (default content-safe, pick Director 1280 ancora da fare)} + pieces cluster d'angolo. `scripts/build-cassetto-extracted.mjs` (sharp) bake `column-{1440,1280}-extracted.webp`. Wiring: `drawer.edgeMode` ('extracted' default, 'framed' coesiste) + `edgeClipPx` in `cassettoLayoutConfig` (import JSON = fonte unica config↔bake).

**Rework stretch (2026-11-16, ruling Director):** *"elimina il pezzo a sinistra … lascia sol il frame/bordo"* + *"stretchiamo a sinistra del 33% — tutte le aree anche all'interno … + grande a sinistra"*. Nel bake: `leftTrim.eraseRects` (ciondoli/smeraldo/stub via dest-out) → `barTile` (barra gold ripavimentata) → `pieces` (angolo top-left = bottom-left specchiato flipV, `dest.y=-8`, `feather`+`gamma` anti-cucitura) → crop bilaterale `leftCutPx`+`edgeClipPx` → **stretch orizzontale ×wideFactor (4/3)**. `drawer.leftCutPx`+`wideFactor` in config (JSON = fonte unica); zone `(x−leftCut)·wide` in `EXTRACTED_SPECS`. Bake: 731×1800 (1440) / 715×1600 (1280). Nota: sharp applica extract prima di composite → pipeline spezzata in due chiamate. Test `r353CassettoEdge` 7/7 + `r339ExpeditionStates` 9/9; `build:check` verde via tsx diretto (mw-run lease bug timezone pre-esistente; `closure:lint` timeout pre-esistente). Witness `test-results/r353-cassetto-stretch-witness.png` (hud-compose @1440×900): barra sx ✓, zero ciondoli ✓, aree stirate ✓, bordo dx a filo ✓. **Residuo:** lieve banding tile sulla barra; pick Director clip 1280 (provvisorio 76); restyle estetico roster/stash (scope aperto R-353); witness /game reale.

**Pass correttivo (2026-11-16, ruling Director):** *"le risorses proporzionate · pezzo d'oro coi ciondoli in alto a destra da rigenerare · teschio e reward ripristinati 1:1 · pulsante in basso che tocca il frame"*. Lo stretch globale diventa **selettivo**: `drawer.unstretchedZones` (`resources|riskValue|rewards|confirm`) — zone DOM 1:1 ri-centrate sul centro stirato; `restore[]` nel bake ricompone teschio/forziere/placca CONFIRM 1:1 post-stretch (patch lacca sul ghost + icona centrata); festone top-right rimosso specchiando la regione sinistra omologa (flipH + `brighten`/`gamma` + feather; ricostruisce anche la punta dx della placca title — erase/patch sotto il pezzo rimossi perché il ghost generava il rettangolo visibile). Witness `test-results/cassetto-review/` @1440+1280. Test 7/7 + 9/9, `build:check` verde.
