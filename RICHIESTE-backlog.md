---
title: Richieste esplicite
type: intent-ledger
updated: 2026-11-19
---

# Richieste esplicite

Questo file è la bussola operativa. Contiene ciò che Fausto ha chiesto, con le sue parole.

## Stati

`da chiarire` · `proposta` · `aperta` · `in corso` · `fatta` · `ridotta` · `rinviata` · `ritirata`

`proposta` = candidato di design in attesa di ratifica Director (non lavoro impegnato).
`ridotta`, `rinviata` e `ritirata` solo con approvazione esplicita.
Triage 2026-10-12 (R-156): 28 voci chiuse su evidenza kanban/artefatto — `context/request-triage-2026-10-12.md`.

---

# RICHIESTE-backlog — voci open-family antecedenti 2026-11-16 (split PLAN-121 2026-11-15)

## R-329 — HUD/UI non scala con la dimensione dello schermo (mobile "enorme")

**Richiesta (verbatim, 2026-11-14):** *"la HUD e UI nn scala cn la grandezza dello schermo correttamente, devo pensarci dopo?"* → *"enorme"* (osservazione su telefono, app salvata su Home).
**Data:** 2026-11-14
**Stato:** `aperta`
**Contesto rilevato:** su viewport phone la HUD blueprint B1 (PLAN-112, pensata ≥768px) non deve applicarsi — il reflow stacked <768px è specificato in `gameHudPlacement.ts` (PLAN-083 mobile-fit) ed è **in lavorazione attiva** (file hud-real modificati non committati nel worktree). Il deploy `a4awsqpvk` contiene la HUD pre-fit.
**Verifica da fare:** dopo il merge/deploy del lavoro hud-real corrente, controllare su viewport 390×844 che resources/time/nav siano stacked e scalati alla larghezza; se ancora sproporzionata → bug da fixare, non scope nuovo.

---

## R-330 — Icona PWA "salva su Home" da rivedere (rinviata)

**Richiesta (verbatim, 2026-11-14):** *"ho salvato sul mobile quella pagina cm app e c'è una icona strana, possiamo cambiarla?"* → *"c pensiamo poi all'icona"*.
**Data:** 2026-11-14
**Stato:** `aperta` (rinviata dal Director — scelta artistica da fare insieme)
**Difetti tecnici già accertati (indipendenti dall'arte):** `apple-touch-icon` punta a `/vite.svg` — iOS non supporta SVG come icona Home e usa uno screenshot della pagina (l'«icona strana» vista); il manifest dichiara `maskable-icon-512.png` che non esiste (404 su Android); manca `apple-touch-icon` PNG 180×180.

---

## R-331 — /game: zoom-out mouse morto, HUD deve restare fissa, pulsante village → zoom default

**Richiesta (verbatim, 2026-11-14):** *"in /game ho difficoltà cn il zoom out da mouse. quando zoomo la HUD deve rimanere fissa nella poszione e nelle proporzioni. Quando clicco il pulsante village, oltre a riportarmi al centro del villaggio m deve portare anche allo zoom d default"*
**Data:** 2026-11-14
**Stato:** `in corso`
**Diagnosi (2026-11-14, probe headless `scripts/_tmp-zoom-probe.mjs`):**
- `/game` (mappa2, canvas 2752×1536) non passa alcun `safeFit` a `PixiWorldMap` → `margin=marginY=0` → `floorZoom() = max(W/2752, H/1536)` = cover-fit (0.586 @1440×900). Lo zoom-out utente è matematicamente morto: `userFloor = max(floor, minZoom)` = 0.586 = resting zoom; `ctl.set({zoom:0.4})` viene ri-clampato a 0.586 entro ~100 ms.
- Wheel/ctrl+wheel sul chrome HUD non raggiunge il canvas (listener su `hostRef`): zona morta + possibile page-zoom browser (HUD che scala — viola «HUD fissa in posizione e proporzioni»).
- Click nav `village` → `setView('village')` senza toccare la camera: al ritorno su mappa lo zoom utente stantio persiste.
**Fix previsto:** prop `seaMargin` su `PixiWorldMap` (portata mare senza safe-fit, cover-fit preservato) alimentata da `mappa2ApprovedLook` (3600/1800, precedente R-148); guard wheel globale (ctrl/meta+wheel → preventDefault page-zoom; wheel su chrome non scrollabile → zoom mappa); nav village → `onRecenter()` (refit = zoom default + utente resettato).

**Stato (2026-11-14):** `in corso` — **fix implementato e verificato, chiusura formale bloccata da stato condiviso del worktree (T-13).**
**Delivered:** prop `seaMargin` su `PixiWorldMap` + guard wheel globale (no dead zone su chrome, no page-zoom ctrl+wheel, step proporzionale) + `seaMargin` R-148 in `mappa2ApprovedLook` + nav village → `onRecenter()` (zoom/centro default al ritorno su map).
**Verificato:** red-first registrato (`.mw/red-first/tests-e2e-idleVillage-gameMappa2.spec.ts-2026-11-14T11-14-24-419Z.log`); spec camera 2/2 verdi (zoom-out < cover fit, wheel su HUD zooma, `visualViewport.scale`=1, bbox nav invariato, village→zoom default); `verify:bundle` OB-1/OB-2 **PASS**; lint 0 err; `build:check` OK; contratti INV-10/INV-11 aggiunti.
**Blocco chiusura:** verdict `verify:bundle` BLOCKED — baseline capture impossibile (worktree sporco di lavoro parallelo PLAN-117/R-327), trusted-lock drift su file altrui, ~150 finding foreign; in-scope residui meccanici (`R-331 non risolvibile a BASE`, `blocco mutato` su file condiviso accumulati da entrambe le sessioni). Richiede `waived-director` o chiusura dopo che il lavoro parallelo atterra.
**Evidence:** `test-results/r331-zoom/evidence.md` — bundle: .mw/runs/r331-game-zoom-out/bundle.json (verdict BLOCKED, obbligazioni PASS).

**Ruling supplementare A (2026-11-14, verbatim):** *"il pulsante mappa è quello che deve farti tornare al centro del villaggio e allo zoom d default, nn il compoenten centrale"* — il recenter-on-village si sposta dal pulsante `village` al pulsante `map`: `setView('map')` + glide su `place_village_start.worldPoint` a zoom = cover fit (`focusRequest.zoom` esplicito, niente `floor*1.5`). Bussola centrale invariata (recenter generico su centro canvas).
**Ruling supplementare B (2026-11-14, verbatim):** *"nn dobbiamo poter zoomare + indietro d quanto è alla partenza (+ lontano). fixalo come massimo"* — **inverte l'approccio seaMargin**: `seaMargin` mappa2 → `{0,0}` (rimosso), floor = cover fit = resting zoom = massimo zoom-out. Il mare procedurale non si mostra mai; zoom-out clampato allo stato di partenza.
**Implementato + verificato (2026-11-14, round 2):** `focusRequest` accetta `zoom` opzionale (glide onora lo zoom esplicito); spec camera 2/2 verdi riscritte sui nuovi ruling (wheel-out clampa al resting + HUD fissa + no page-zoom; map nav → villaggio proiettato a centro schermo ±15% — clamp pan impedisce il centro esatto a zoom fit, il villaggio non è al centro canvas); pin test 12/12; lint 0 err; `build:check` OK; screenshot `test-results/r331-zoom/max-zoomout.png` — al massimo zoom-out il mondo riempie lo schermo col suo oceano dipinto, zero fascia procedurale. Commit `bf86a58c` contiene solo il round 1; il round 2 è uncommitted.
**Nota transform stale:** Vite ha servito due volte una transform parzialmente stale di `PixiWorldMap.tsx` (definizioni sì, call site/attach no) — il tab del browser eseguiva il bundle pre-fix. `touch` sul file invalida la cache; il page-zoom persistente di Chrome sul profilo normale (`Cmd+0` per azzerare) ha reso la HUD "enorme" finché l'utente non ha testato in incognito.

---

## R-332 — Mobile: il gioco va giocato in orizzontale (landscape), non verticale

**Richiesta (verbatim, 2026-11-14):** *"sarebbe da giocare in orizzontale, nn in verticale"* — detto durante il fork visivo sulle proporzioni HUD mobile.
**Data:** 2026-11-14
**Stato:** `aperta`
**Tensione da nominare:** PLAN-083 (mobile-fit /game) elenca landscape phone tra i **non-goals rimandati a v1.1**. Questo ruling inverte il deferral: landscape diventa l'orientamento target su telefono. Impatti: il reflow stacked <768px di `gameHudPlacement.ts` è pensato per portrait (844px di altezza) — in landscape (390px di altezza) occuperebbe quasi tutto lo schermo; servirà un ramo landscape (verosimilmente più vicino al blueprint B1, dato che i rapporti d'aspetto si avvicinano al desktop). Anche il fork HUD-proporzioni (R-329) va rivalutato su viewport landscape.

---

## R-333 — Ghiera DRAGHI battezzata come slot corretto; montata nel cassetto

**Richiesta (verbatim, 2026-11-14):** *"perfetto. adesso questo è battezzato come slot corretto, segnalo ovunque nella documentazione. Poi deve sostituire nel componente cassetto lo slot che c'è adesso, d quella dimensione"*.
**Data:** 2026-11-14
**Stato:** `in corso`
**Cosa è battezzato:** preset `BEZEL_PRESETS.draghi` in `SlotV12Renderer.tsx` — ghiera firmata dall'utente (medaglione-draghi: banda treccia + cornici a X con kite smeraldo + ring interno oro + disco smaltato col drago) dentro la meccanica reale dello slot (slam 440ms, posa aperta -30°/1.18×, niente denti). Layering sandwich: disco-drago dietro (portal z-5) → medaglione residente (z-10) → ring+banda forata davanti (z-20 in bezel group). Proporzione tuned dal Director via slider lab: `bandImageScale 1.15` / `portraitScale 0.9` (fattori relativi → valgono a ogni taglia). Medaglione = `medaglione-battezzato-v3` firmato; per la produzione è FRAME (`medaglione-battezzato-v3-frame.webp`, foro ritratto trasparente) con il ritratto reale del residente nel foro. Oro ghiera ri-matchato sul gold del medaglione in LAB (L' 1.75L-15.9, chroma ×1.43; smeraldo allineato).
**Montato:** `HudRealCassetto.tsx` `bezelPreset="b"` → `"draghi"` (stesso `slotSize 42` / `scale(0.56)`). Lab `/bezel-variants` prima riga con slider tuning.
**Asset:** `public/assets/ui/hud-real/ghiera-draghi.webp` (integrale, 1012²), `ghiera-draghi-top.webp` (foro r<330), `medaglione-battezzato-v3-frame.webp` (foro r256), fonte `.mw/runs/20261110-chatgpt-ghiera/medaglione-battezzato-v3.png`.

---

## R-335 — Cassetto come componente vero ovunque + medaglione roster mozzato + dimensione

**Richiesta (verbatim, 2026-11-14):** *"bisogna fare in mdo che il componente "cassetto" doventi un componente vero, che legga le info del POI che lo genera e le mostri, che abbia gli slot, i pulsanti funzionanti, gli slot cn le animazioni vere, ecc. Inoltre il roster ha come nuovo medaglione l'immagine mozzata, nn quella vera che nn ha la parte a sinistra mozzata. Il compoennte cassetto è troppo piccolo, nn si legge molto, dovrebbe essere + largo e occupare + spazio. Avrebbe senso fare in modo che le sezioni siano cliccabili e ne aprano una versione singola voltante, invece di farlo + grande?"*
**Data:** 2026-11-14
**Stato:** `da chiarire`
**Contesto rilevato (2026-11-14, pre-esecuzione):**
- **Su `/game` il cassetto è già reale** (R-334, verificato live): `HudRealCassettoDetail` monta `HudRealCassetto` con le props reali della sessione expedition per-POI. Su `/hud-compose?comp=cassetto` `HudRealCassettoHost` monta la sessione reale ma pinnata a `poi-goblin` (fixture lab, pulsante `dbg`, colonna 360 px).
- **Dimensione:** il cassetto è `height:100%` × aspect 639/1613 → ~356 px a 900 px di viewport; i testi sono in `cqw` → ~5–10 px effettivi, sotto il minimo contrattuale HUD di 12 px (già documentato nell'esplorazione R-323). Ruling R-323 già preso: colonna destra 420/400 px, risorse dentro la cornice.
- **Medaglione:** `C1/ring-fused.webp` (usato da `C1Medallion` → medaglione degli slot non-draghi, drag overlay, flight proxy) ha la mezzaluna sinistra **tagliata al bordo immagine**. `C1/ring.webp` (colonne roster) e `medaglione-battezzato-v3-frame.webp` (preset draghi, montato nel cassetto per R-333) hanno la parte sinistra completa. Da chiarire quale superficie/medaglione intende il Director.
- **Domanda aperta del Director:** sezioni del cassetto cliccabili → versione singola fluttuante, invece di allargarlo. È una scelta di rappresentazione materiale ≥2 → visual fork (PLAN-047 gate) prima dell'implementazione.
- **Addendum (verbatim, 2026-11-14):** *"ah, e il roster mostrano in /game ha del testo invece delle icone come era negli esempi e in /game Old, fixalo"* — il roster su `/game` (MatericRosterComponentV2) mostra testo dove gli esempi/la superficie vecchia mostrano icone.

**Fatto (2026-11-14):**
- **Bug icone roster — fixato e verificato live.** Root cause: `game-mappa2.tsx` non monta `GameFrame`, quindi la pagina restava fuori da `.skin-scope` e la regola `label select { opacity: 0 }` (INV:drag-test-container-v2.INV-1) non matchava → le `<select>` native di filtro/sort erano visibili ("All", "Sort by..."). Fix: `className="game-frame skin-scope"` sul root della pagina, parità con `/gameOld` (GameFrame wrappa tutto in `<SkinScope>`). Verificato headless 1440×900: le pill ora mostrano solo icone (`▼⌄ ≡⌄ ↕ ☰ − ×`), niente testo select.
- **Medaglione mozzato — fixato e verificato live.** `C1Medallion` montava `C1/ring-fused.webp`: pezzo da row-module con la fascia gemme **tagliata al bordo sinistro** (col x=0 interamente opaca — la fascia continua nella band-tile). Swap → `C1/ring.webp` + `C1_GEOMETRY` (ornamento completo, stesso asset delle colonne roster `HudRealRoster`/`HudRealRosterColumn`). Copre drag overlay, flight proxy, slot rack non-draghi, bezel-variants. Verificato su `/bezel-variants`: fascia gemme completa.
- **Regression test permanente:** `tests/unit/idleVillage/r335RosterChrome.test.ts` (4 test: skin-scope sul root, regola select, asset + geometria medallion). `lint` 0 errori, `build:check` ✓, `closure:lint` ✓, `tsc` pulito.
- **Ancora aperto:** dimensione/leggibilità cassetto + domanda Director su sezioni cliccabili → pannello fluttuante (richiede visual fork PLAN-047); "cassetto componente vero" è già reale su `/game` (R-334), fixture su `/hud-compose`.
- **Addendum 2 (verbatim, 2026-11-14):** *"in cassetto: i nuovi slot nn devono toccare i margini del settore dove sono inseriti"* — gli slot party nel cassetto non devono toccare i margini della loro zona (padding interno richiesto).
- **Fatto (2026-11-14):** i bezel draghi dipingono oltre il token box da 44px e a scala 0.56 sfioravano i bordi del pozzetto Party Slots (~8px). Scala del rack ridotta a 0.44 in `HudRealCassetto` → margini netti su tutti i lati, verificato headless su `/hud-compose?comp=cassetto`.
- **Addendum 3 (verbatim, 2026-11-14):** *"cassetto: avevo scelto il mockup cn all'interno il componente in alto al suo interno, quello che mostra le risorse, xè invece quel componente scompare?"* — nel mockup scelto il cassetto ha in alto AL SUO INTERNO il componente risorse; oggi non si vede (o scompare). Ripristinare la risorsa-bar dentro il cassetto come da mockup.
- **Fatto (2026-11-14):** il componente risorse ora vive DENTRO il cassetto, nel pozzetto navy superiore (ruling 2026-11-10 "resources incorporated inside the cassetto's space" mai applicato). `HudRealCassetto` ha prop `resourceItems` + zona top interna e renderizza `HudRealResources`; `HudRealCassettoDetail` (`/game`) e `HudRealCassettoHost` (lab) calcolano gli items dallo store reale (`useMinimalGameplayWithIdleVillageConfig` → `selectResourceOutlook` → `buildResourceReadoutItems`). Rimosso l'overlay esterno top-right da `/hud-compose?comp=cassetto` (era appiccicato sopra la cornice / coperto dal drawer su `/game`). Verificato headless su `/hud-compose?comp=cassetto`: barra visibile dentro il pozzetto navy. **Non verificato:** screenshot del cassetto aperto su `/game` (i marker quest-POI non si proiettano in headless: `map-ready` non raggiunto in 120s+, blocco probe preesistente non legato al diff).
- **Regression test permanente:** `tests/unit/idleVillage/r335CassettoResources.test.ts` + `r335RosterChrome.test.ts`.
- **Governance (2026-11-14):** coverage exceptions per i 4 file `hudReal/HudRealCassetto*` (EXC-…-9798) e `C1Medallion.tsx` (EXC-…-6c9d); visual-fork card per il medallion swap; fix marker malformati in `plans/PLAN-118` e `.mw/runs/r325-game-restore`. Mode A canonico per `c1-medallion.INV-1` (sync:bug + `// INV:` + redfirst:record su run rossa genuina da codice BASE); **47 retire** (`redfirst:retire` citando R-335) per gli INV la cui import-closure include `C1Medallion.tsx`; `sync-amend-override` Director registrato per i 47 (cap amend=3 superato); **re-seal `trusted:seal`** a HEAD 547c021c con approvazione trust-set nel ledger (R-335 risolvibile a BASE).
- **Bug gate trovati e fixati (2026-11-14):** la catena attestazione `executedCount` era strutturalmente rotta per ogni test dentro `describe` — (1) `invBlocks.describePath` conservava le virgolette sorgente (`canonText`) mentre `testTitles` usa il literal foldato → match impossibile; (2) `loadCountEntries` sniffava `'{'` → `JSON.parse` sull'intero JSONL → `[]` sempre; (3) il reporter `invAssertionCounts` scriveva `ctx.task.name` (foglia) invece del full title `describe + test`. Fix su `invBlocks.ts` + `invCounts.ts` (protetti: drift approvato nel ledger) + reporter; blocchi fusi multi-describe/multi-file risolti via suffisso-template + fallback all-files. Counts sigillati 15→**281 numeric** / 25 unknown. `checkLivingSync` scoped sul diff R-335: **0 errori / 0 warnings / 49 amend autorizzati**. `trusted:check` OK, `redfirst:check` OK, `build:check` OK.
- **Richiesta (verbatim, 2026-11-14):** *"se battezzo una cosa va conservata come reference, idem se lo passo in chaat cm screnshot e dico che è una referenza o una cosa simile. questo va segnato negli agenti di MW, protocolli, ecc, nello specifico anche x RPG da ora in poi"* — gli artefatti battezzati dal Director (approvati o passati in chat come screenshot/reference) vanno preservati come riferimento duraturo, non lasciati in path temporanei o sovrascrivibili. Registrare in agenti/protocolli MW + rules RPG.
- **Richiesta (verbatim, 2026-11-14):** *"il cassetto ti ho detto che dovrebbe essere + largo, nn lo è / il cassetto doveva essere la versione cn all'interno integrata la barra delle risorse, invece gliel'hai mesa d sopra e piccola, grande fallimento. Hai perso il mockup che avevamo scelto?"* — due verifiche negative: (1) il cassetto restava ~356px perché l'art singolo 639×1613 fitta l'altezza; il ruling R-323 (colonna 420px @1440 / 400px @1280, cornice estendibile non stirata) era approvato ma mai implementato; (2) la barra era `HudRealResources` intera scalata nel pozzetto → microscopica, mentre la baseline approvata (`column/fork-closeup-1440.png`) mostra **targhette** nella fascia testata pulita. Il mockup non era perso ma **mai registrato in `refs/`** (violazione regola 46 appena scritta).
- **Fatto (2026-11-14):** (a) **Reference registrati** in `.mw/specs/hud-real/refs/` + `REGISTERED.md`: `approved-cassetto-rich.png` (mockup scelto), `approved-cassetto-column-fork-{1440,1280,closeup-1440}.png` (baseline fork, ruling «1 · Dentro la cornice»), `gen-cassetto-column-frame_v2.py` (generatore). (b) **Colonna larga implementata** come da PLAN-116 F1/F3: `scripts/hud-real/build-cassetto-column.py` estende la cornice solo nei campi neutri (ornamenti/gemma/placca CONFIRM intatti), pulisce la fascia icone dipinta (header 'A'), riposiziona CONFIRM a proporzioni native → `column-1440.webp` (753×1613 → 420px @900h) e `column-1280.webp` (806×1613 → 400px @800h) + `cassettoColumnGeometry.ts` generato con le zone rimappate. `layout/cassettoColumn.ts`: breakpoint 1360px. (c) **Targhette risorse** nella fascia pulita (placche dark-glass + socket ottone + valore/label, danger tone + tooltip), non più la barra scalata. Font e controlli ridimensionati (~×1.7) verso il floor HUD. (d) **Verificato headless 1440×900 e 1280×800** su `/hud-compose?comp=cassetto`: drawer misurato **420.1px** e **399.75px**, targhette leggibili, titolo intero, CONFIRM con aria. Slot `hud-compose` → `width:50vh`. Su `/game` il cassetto eredita la stessa larghezza (mount fixed inset:0). **Non verificato:** screenshot `/game` aperto (blocco map-ready headless preesistente). Leg "—" a centro journey e "—" sotto teschio = dati reali della fixture lab (estimate senza bande), non difetti layout.
- **Regression test permanente:** `r335CassettoResources.test.ts` aggiornato (5 test: targhette non barra, art colonna da geometria generata, pipeline dati reale, slot 50vh).

---

## R-338 — /game: montare la Voce (C10) alimentata dal feed eventi

**Richiesta (verbatim, 2026-11-14):** *"in /game nn c'è il componente Voce, dovrebbe esserci. Ma nn so se è un buon posto x fare apparire le informazioni"* → esplorazione: direzione **A** scelta (canale narrativo passivo: obiettivo/prossimo evento, NON alert urgenti) — *"per adesso solo A va bene"*; *"averlo sempre presente e fare apparire 'la bandiera' solo quando ha qualcosa da dire"* → approvato; *"feed eventi va bene. monta quello su /game"*.
**Data:** 2026-11-14
**Stato:** `in corso`
**Decisioni Director (questa sessione):**
1. Nuovo messaggio a bandiera aperta → **sostituisce** con animazione uscita/entrata (opzione a), NON coda. Click sul busto riapre l'ultimo.
2. Busto sempre presente in bottom-left; bandiera appare solo quando c'è un messaggio (nessun messaggio → solo busto, non cliccabile).
3. Sorgente: **feed eventi** (`gameEvents` → `nextEventModel`, stati alarm/quiet/none — niente finestra <10gg → silenzio).
4. Posizione: slot `voce` del blueprint B1 firmato (`hudLayoutB`, anchor bl, w 360) — visual-fork skipped: posizione e grammatica già battezzate (PLAN-110 C10 `[0,740,455,270]` + ruling "esiti escono da Voce").
**Scope:** estendere `HudRealVoce` (children opzionale, `messageKey` per replace, placca mount/unmount con animazione entrata, busto riapre solo a messaggio corrente); `placeGameHud` espone il rect `voce` (blueprint + landscape; phone senza blueprint → assente); mount in `game-mappa2` `data-hudslot="voce"`; config `gameFrameConfig.voce.autoCloseMs`; i18n `gameFrame.voce.*`; telemetria `voce_message`/`voce_dismiss`/`voce_reopen`; test permanente `tests/unit/idleVillage/r338VoceOnGame.test.tsx`.
**Fuori scope:** esiti/alert come sorgenti (direzione B/C), coda messaggi, phone portrait <768px (il blueprint non si applica — D10).

**Stato (2026-11-15):** `in corso` — **implementato e verificato sul vivo, chiusura formale bloccata da stato condiviso del worktree (T-13, identico a R-331).**
**Delivered:** `HudRealVoce` esteso (children opzionale, `messageKey` → replace uscita/entrata senza coda, placca mount/unmount animata, busto persistente che riapre a messaggio corrente, `dismiss` folda solo la bandiera); `voceFeed.ts` puro (`voceMessageFor` su `nextEventModel`, chiavi `idleVillage:` prefissate per il validatore statico); `placeGameHud` espone `voce` (blueprint B1 anchor bl, phone assente); mount `data-hudslot="voce"` su `/game`; config dedicata `src/ui/idleVillage/config/voceConfig.ts` (`autoCloseMs: 15000` — tenuta fuori da `gameFrameConfig.ts`, helper di ~50 INV); i18n `gameFrame.voce.*` en+it; telemetria `voce_message`/`voce_dismiss`/`voce_reopen`; seam E2E `__idleVillageTestHooks.confirmInvasion`.
**Verificato:** test permanente `r338VoceOnGame` **9/9**; witness headless `scripts/_tmp-r338-witness.mjs` **verde** su `/game?poiDemo=1` — silent {bust:true, plaque:false} → `confirmInvasion` → Voce parla «Threat — Warning: Goblin host reaches the village — in 5 days.» (evento reale, stato alarm) → placca 202×188 @ bottom-left → click × → placca chiusa, busto resta → click busto → placca riaperta; screenshot `test-results/r338-voce-*.png`. `lint` 0 err, `build:check` OK, suite adiacenti 99/99 (hudLayoutContract/r335/r337 intatti). Bug reali trovati dal loop: (a) timer leave perso in cleanup → ref; (b) i fallimenti "unclickable" del witness erano gara con `autoClose` 15s sotto pressione RAM (`held` mai attivato per hover stallato — probe `elementFromPoint` ha dimostrato chain pointer-events pulita); witness ora pinna `held` via mouseover sintetico.
**Blocco chiusura:** `verify:bundle` (`.mw/runs/r338-voce-su-game/bundle.json`) → **OB-1/OB-2/OB-3 PASS**, verifier ok — verdict **BLOCKED** solo sul gate `contracts:check`: 132 reason, **0 sui file R-338** (verificato per filename su scope_files), tutte su drift strutturale/parallelo (poi-radial, PlaceFanCards, game-menu-screens, game-save, owner duplicati STRICT_FILES — lavoro di sessione parallela). `scope_files` nel manifest: 120 file classificati `foreign_scope` advisory. Coverage exceptions HudRealVoce/voceFeed + visual-fork skip card `voceConfig.ts` registrati. Chiusura `fatta` attende re-seal/cleanup worktree condiviso o ruling Director (precedenti R-331/R-258/R-260).

---

## R-339 — /game: assorbimento mockup ChatGPT — expedition planning UI (Subplan 1)

**Richiesta (verbatim, 2026-11-15):** *"xò come prima parte in assoluto voglio che sia l'assorbimento d questo mockup di di gpt, o come fase iniziale o come subplan 1. approvo"* — poi *"plan multi ai web, a cui devi dare anche come immagini il mockup che t ho passato e questa immagine che trovi in dowload. salva il mockup tra i reference"* — poi ruling: *"per adesso voglio che sia in alto a destra e il resto si sposti a sinistra, poi si vede, niente tab pendente"* (superficie eventi/Chronicle) — infine *"procedi"* (formalizzazione in plan-con-contratto).
**Data:** 2026-11-15
**Stato:** `in corso`
**Origine:** dibattito multi-AI web `20261115-wanderlust-ui-plan` (mind-weaver), artifact-r004 accettato — 4/4 provider ACCEPT su r003 + ruling Director D10 → r004 (sha256 `582a2e03048de2a360a1bb3fb9a4f8ea2fb1eceeac98fc3dc4519ebf9e32c33b`). Spec sorgente copiata in `.mw/specs/expedition-ui/artifact-r004.md`; reference mockup registrati in `.mw/specs/expedition-ui/refs/` (REGISTERED.md).
**Scope:** portare la struttura del mockup ChatGPT su `/game`: drawer expedition docked flush-right (clamp 360/23vw/460), colonna sinistra Roster|Stash a tab segmentati (persistente, collassabile, mutua esclusione ≤1100px), top chrome snellito spostato a sinistra (zona top-right riservata alla futura superficie Chronicle — docked, NON tab pendente), sole ornamentale via skin. Stati minimi: CTA disabilitata + motivo inline, slot party vuoto/pieno, empty-state edge-tab (D6 mode b), journey "N days" + totale. Bag slot display-only (assegnazione → S2). Mobile: bottom sheet non-modale peek/half/full.
**Decisioni registrate:** D1–D10 in artifact-r004 (stash docked-tab; rail persistente; drawer token-driven con insets Zustand + pan/zoom clamp; Chronicle top-right ruling Director; i18n EN/IT; tutto via skinConfigRegistry + primitivi esistenti).
**Piano:** `src/docs/docs/plans/PLAN-119-expedition-ui-mockup-absorption.md`
**Deferred:** S2 tipografia funzionale + costo food + bag-assign · S3 accenti + mappa · S4 frame unificati + a11y · Chronicle port (slice dedicata, zona già riservata).

## R-339 — /game: ciclo giorno/notte esiste ma alba/tramonto (warm) non raggiungono la mappa

**Richiesta (verbatim, 2026-11-15):** *"ma il ciclo giorno notte della mappa è stato aggiunto? e la versione alba tramonto è stata fatta? xè dovrebbe esistere a codice, ma nn so se è implementata, se nn lo è cerca e fallo"*
**Data:** 2026-11-15
**Stato:** `in corso`
**Diagnosi:** il ciclo **esiste già** — `timeOfDay.map` in `gameFrameConfig` (curve, `nightLight` 0.35, placche notte baked `night-mult/night-add/bio-a/bio-b`), `game-mappa2` calcola `ambient` via `ambientForPhase` (preview `?tod=night|dusk|day`, hold su pausa, day-lock oltre `maxSpeed`) e passa `ambient` + `nightLight={TOD.plates}` a `PixiWorldMap` → nMult multiply + nAdd finestre/lava che respirano + bio mare, sole/luna sul dial di `HudRealTime`. Witness stage: sprite z=20 presenti, alpha in easing — notte funzionante.
**Bug trovato:** il wash multiply (unico consumatore di `warm` = ambra alba/tramonto) faceva early-return quando `nightLightRef.current` esiste («the night plates own the night») → su `/game` il canale warm era dead code: `?tod=dusk` mostrava solo l'oscuramento parziale delle placche, nessuna ambra.
**Fix:** nel tick del wash, con placche attive `night=0` e visibilità governata solo da `warm` — la notte resta alle placche, l'ambra torna a raggiungere la mappa. Surfaces senza `nightLight` (lab) invariate. Formula estratta in helper puro `washGradeFor(lit, hasPlates)` in `src/ui/idleVillage/config/timeOfDay.ts` (config-first, niente numeri nel render loop).
**Verifica (T-04):** witness headless dev-server (`import.meta.env.DEV=true`) su `/game?tod=day|dusk|night`, viewport 800×600 — `test-results/tod-{day,dusk,night}-final.png`: giorno saturo → dusk con velo ambra + finestre a mezza potenza → notte scura con luci finestre dorate + bioluminescenza mare. Probe stage: `nMult multiply z=20 α≈0.92`, `nAdd` respirante, `bio-a/b` in cross-fade. Clone-test isolato (stessa texture, tint bianco) conferma che il pipeline blend è sano e il grade notturno baked è **volutamente morbido** (~25-30% di scurimento — luna, non buio pesto; se il Director vuole notte più profonda è tuning di `night-mult.webp`/`fullNightAt`, non bug).
**Test:** `tests/unit/idleVillage/r339DawnDuskWash.test.ts` 8/8 (regressione permanente su washGradeFor: notte senza placche, warm-only con placche, giorno neutro) · `npm run build:check` ✅.
**Trappole probe incontrate (da non ripetere):** (a) `?tod=` è silenziosamente **morto su `vite preview`/build prod** (`DEV_Q` è vuoto fuori da `import.meta.env.DEV`) — screenshot "giorno pieno" da preview NON sono prova di bug; (b) `__pixiApp` può puntare all'istanza StrictMode smontata (stage senza placche) — verificare sempre che `__pixiApp.canvas` sia la canvas nel DOM prima di trarre conclusioni.

## R-342 — ops: audit contesto fisso Devin + ottimizzazione sistema

**Richiesta (verbatim, 2026-11-15):** *"c'è un modo x alleggerire qualsiasi cosa sia alleggeribile, senza perdere funzionalità?"* — poi *"c serve un plan x esaminare al meglio tutta la dinamica, xè c sn cose pesanti e come ottimizzare il mio sistema"* — poi *"19 file sn tanti, magari anche cercare di caricare le cose 'nel caso servano' e solo 'indici e descrizioni quando nn servono. Devi fare un audit,e cc?"* — poi *"plan multi ai web"*
**Data:** 2026-11-15
**Stato:** `in corso`
**Audit eseguito (fase 1-3, vedi handoff):** regole sempre-on reali ≈23KB (solo 3 rule `always_on` + AGENTS.md; le altre 14 già lazy via trigger frontmatter — 8 senza frontmatter, attivazione ambigua); MCP github/vercel falliscono `list_tools` (dead weight), puppeteer ok + risorse stale; skill dirs = symlink, dedup attivo; gap: componenti visibili non spiegano 262k a sessione "fresca" (probabile carried-over o overhead harness).
**Dibattito (2026-11-15, thread 3 — CONVERGED):** run `mind-weaver/.mw/runs/20261115-context-budget-audit/` — 5 provider (chatgpt/claude/gemini/grok/deepseek), R1 proposte → R2 critiche incrociate blindate (7 WITNESS disposizionati) → artifact-r002 sha `e8f1f03f` ACCEPT 4/4 eleggibili (grok rimosso `provider_dead`: 3 risposte incoerenti consecutive su acceptance). `report.md` scritto (Converge/Diverge/Only-one). Raccomandazione finale = `artifact-r002.md`: Phase-0 misura a delta (3 condizioni ×2 rep, nessuno stop-gate) → Phase-1 igiene zero-risk (MCP morti, stale resources, 4 skill obsolete, frontmatter alle 8 regole orfane) → Phase-2 slim catalogo pixijs (≤200 char, verifica primaria = telemetry `skill-usage.jsonl`, canary stratificato secondario) → Phase-3 **matrice invariante→enforcement** come artifact di approvazione Director (governance:check + pre-commit, mutation fixtures per check, demozione solo per-invariante con check validato; shutdown-governance resta always_on; doc-governance a glob solo dopo test empirici di attivazione) → Phase-4 re-misura, solo delta misurati.
**Regola:** applicazione modifiche SOLO dopo ruling Director (governance) — la lista ottimizzazioni attende approvazione.
**Phase-1 applicata; Phase-2 fatta via PLAN-120 (catalogo 21.763→7.274 char, -67%, pixijs -75%, guard `mw-skill-desc.py audit --fail-over 240`, telemetry soak advisory +7gg) — restano Phase 0/3/4 (2026-11-15, ruling Director "procedi"):** (a) MCP `github-mcp-server` (token vuoto) e `vercel` (config vuota) rimossi da `~/.config/devin/mcp_config.json` e `~/.codeium/windsurf/mcp_config.json` (backup `.bak-20261115`; `git` disabilitato e `puppeteer` conservati — puppeteer verificato sano: 7 tool, risorse stale già assenti); (b) 4 skill obsolete archiviate fuori dai path scansionati: `demo` → `~/.cursor/skills-archive/`, `coordinator` → `mind-weaver/.agents/skills-archive/` (+3 symlink rimossi da ~/.agents|~/.claude|~/.cursor/skills), `strategist-mandate`+`coordinator-mandate` → `RPG/coordinator/skills-archive/`; (c) frontmatter `trigger: model_decision` + description aggiunto alle 8 regole orfane (10-canonical-dev-port, 15-browser-preview-guard, 16-no-foreground-windows, 17-resource-lifecycle, 45-director-intent-to-spec, 46-approved-references, 85-documentation-impact, mw-rpg-bridge) — binding cores restano in 00-invariants always_on; queste erano non-iniettate, ora scopribili on-demand.
**Residuo R-342:** Phase-0 (misura a delta), Phase-2 (slim catalogo pixijs + telemetry), Phase-3 (matrice invariante→enforcement + governance:check), Phase-4 (re-misura) — da pianificare come task dedicati.

## R-345 — ops: resync meccanico contratti (closure:lint, parte non gated)

**Richiesta (implicita, 2026-11-15):** scelta Director "Sì, ora — io + deleghe" dopo recon subagent_explore sul drift `closure:lint`.
**Data:** 2026-11-15
**Stato:** `in corso` — **meccanica eseguita + cap override apposto (Director "go" 2026-11-15). Restano per-INV B-amend, decisione re-seal, drift parallelo.**
**Scope:** solo MECHANICAL dal piano subagent. **Escluso** il 2-owner game-menu (Director-gated, R-341 residui).
**Delega (eseguita):** recon `subagent_explore` → drift map completo; scope edits inline; popolamento stub + regen + verify a `subagent_general` (foreground).

**Eseguito:**
- Scope sync su 7 contratti all'inventory autoritativa (rigenerata 13:02): `c1-medallion` (`c1RowModGeometry`→`c1Geometry`, coerente con R-335), `game-frame-pixi` (−12/+3), `depth-scene` (+2), `quest-run-window` (−2), `use-quest-poi-session` (−1), `village-director-view` (−1), `game-top-chrome` (−1).
- 26 id INV bare → qualificati: `game-menu-screens` ×12, `game-settings` ×5, `game-save` ×9.
- Subagent: ~33 INV dichiarate negli stub (game-top-chrome, amanuense-page, world-surface-event-card, game-frame-pixi.INV-3, canonical-data-bridge, drag-sensors, use-drag-outcome, altri); 11 record `redfirst:retire` appendati (ref BASE R-279/R-241, precedente hud-real-cassetto.INV-3); 2 test file nuovi come host INV (`memorialHall.idempotent`, `settlementTally.wipe`) perché gli host naturali erano hash-locked red-first — locked files revertiti byte-identici.
- inventory regen 305 unità + `contracts:index-sync` OK; 112/112 test verdi sui file verificati; 0 tag orfani nello scope.

**Blocco (serve Director):**
- ~~`sync-gate: 43 amend/retire > cap 3`~~ → RISOLTO: 2 record `sync-amend-override` apposti (2026-11-15, "go" Director): `amanuense-page.INV-1..10`, `game-frame-pixi.INV-3`, `PLAN-073-stash-dual-mode`, `hud-real-cassetto.INV-3`. **Re-seal eseguito**: `trusted:seal` → `sealed_base_sha = c351430a` (HEAD), 346 executed_counts catturati, 142 file protetti.
- **Resume point — residui post re-seal (`contracts:check` exit 1):** (a) ~14 INVs `executedCount(BASE) unknown — fail closed` (game-top-chrome 1-5, hud-real-cassetto 1-4, roster-stash-rail 1-5, expedition-edge-tab.1: dichiarati in contratti non committati → serve "checkout al sigillo + run reale", NON fattibile con worktree condiviso in volo — si risolve quando si committa + re-sigilla a lavori fermi); (b) ~35 B-amend per-INV su skin/roster/menu/save/settings — drift NON committato della sessione parallela (skinCssVariables, cassettoLayoutConfig — loro PLAN-119/T1 in corso); (c) skin-css-variables Mode C ×3; (d) game-save source_ref PLAN-076. **Il rosso residuo è tutto lavoro parallelo in volo o gated — nessuna nostra modifica è più tra gli uncovered.**
- 2-owner menu cluster: ruling pendente dal 2026-10-23 (opzione A per-file owner vs B aggregato owner — piano completo nel report subagent).

**Non nostro (T-13, sessione parallela):** ~90 errori da drift altrui — `skinCssVariables.ts` Mode B sui contratti skin, gate-file `contractSchema.ts`/`syncBug.ts` da re-approvare, tag duplicati `pixi-world-map.INV-8`/`use-quest-expedition-session.INV-5`, `game-menu-screens.INV-12` non estraibile.

## R-347 — /game: roster e stash tornano superfici sempre separate (revert rail Roster|Stash)

**Richiesta (verbatim, 2026-11-15):** *"qualche AI ha mischiato roster e stash su /game, riportalo cm era prima. e senga nei plan e documentazione che devono essere sempre divisi e separati"*.
**Data:** 2026-11-15
**Stato:** `in corso` — implementazione eseguita, salvaguardi in corso.

**Contesto:** R-339/PLAN-119 T5 (commit `35b9f7e0`) aveva introdotto `RosterStashRail` — colonna docked a sinistra con tab segmentati **Roster|Stash** — fondendo le due superfici in una sola. Il Director ha stabilito che roster e stash devono restare **sempre divisi e separati**: roster = pannello flottante `panels.roster` (`MatericRosterComponentV2`), stash = magazzino `panels.villageStash` (`VillageStashPanel`).

**Eseguito:**
- `game-mappa2.tsx`: rimosso mount `RosterStashRail` + tutto il wiring (import, `useExpeditionRail`, mutex ≤1100px, `railStashOpen`/`stashSurfaceOpen`, `residents`, guard `source==='roster-rail'`); `onOpenRoster` tornato a `panels.set('roster', true)`; `usePanelWhileOpen(panels,'roster', anyExpeditionDetailOpen)` ripristinato incondizionato (contratto R-184 — rende obsoleti i workaround R-340bis/R-346).
- Cancellati: `RosterStashRail.tsx`, `useExpeditionRail.ts`, `r339RosterStashRail.test.tsx`, contratto `roster-stash-rail.md`, `scripts/_tmp-r339-rail-witness.mjs`.
- `hud-real-cassetto.INV-3` ripristinata a `panels.set('roster', true)`; test `r339ExpeditionStates` aggiornato al wiring roster-pannello (red-first: la regex sul pannello falliva sul codice rail).
- Config `rail.*` rimossa da `cassettoLayoutConfig` (schema+RAW); i18n `gameFrame.rail.*` rimossa EN/IT + tipi rigenerati; eccezione coverage `useExpeditionRail` ritirata.
- Ledger/docs: banner REVERTED + invariante in `PLAN-119` (ledger T5, T3/AC4, AC2 → mappa libera ~70,8% @1440), riga master-index marcata REMOVED, commenti `useGameLayoutInsets`/`useExpeditionDrawer`/`GameTopChrome`/`HudRealCassettoDetail` aggiornati.
- `useGameLayoutInsets` tenuto (ledger condiviso: drawer→right, chrome→top; `left` ora non posseduto).

## R-348 — Mockup victory/reward path (da superficie attuale /game, via GPT o Gemini)

**Richiesta (verbatim, 2026-11-15):** *"mockup usando la superficie attuale di /game e fattele creare da GPT o se non è disponibile gemini e mostramele"*.
**Data:** 2026-11-15
**Stato:** `in corso` — **ruling acquisito**: baseline battezzata V5 pergamena (2026-11-16). Residuo = porting su produzione (nuovo task/plan).

**Progresso (2026-11-15):**
- Witness superficie stock: `node scripts/_tmp-r348-reward-witness.mjs` → `demoLaunch` + drive canonico a `ended`; outcome `reward`. Screenshot in `.mw/runs/20261115-r348-victory-mockup/` (`witness-popup.png` = placca, `witness-full.png` = in contesto).
- **Bugfix in-scope:** `QuestRunWindow.tsx` usava `SceneRevealLayer` senza import → `ReferenceError` con error boundary durante il reveal. Aggiunto l'import (come in `TheaterLabPage`); tsc pulito. *Senza questo fix il reward path crashava — la witness stessa lo certifica.*
- Generazione: ChatGPT web via CDP :9222 (`mw-web-turn` attach-fallback → driver manuale `scripts/_tmp-r348-gpt-turn.mjs` + harvest blob full-res). **1 turno → griglia 2×2 con 4 varianti nominate.**
- Varianti (file per opzione in `.mw/runs/20261115-r348-victory-mockup/variants/`): **A** `Stele del trionfo`, **B** `Pergamena suggellata`, **C** `Altare del ritorno`, **D** `Stendardo della vittoria`.
- Conversazione: `chatgpt.com/c/6af99fad-1b70-83ed-8271-6c02c5aca2d3` (prompt in `prompt.txt`, allegati = witness).

**Scope:** il reward path vittoria (`QuestRewardPopup` / `QuestRewardPanel` / `QuestChronicle`) è l'ultima superficie /game ancora stock senza controparte firmata. Serve mockup Zanara basato sulla superficie attuale di /game → generazione via **ChatGPT** (fallback **Gemini** se quota esaurita) → mostrare le varianti al Director per ruling (visual fork PLAN-047).

**Ripresa esatta:**
1. Catturare witness della superficie stock attuale: Playwright headless `/game?poiDemo=1` → `__idleVillageTestHooks.expedition['poi-goblin'].openDetail()` → completare/forced-victory per far apparire `QuestRewardPopup`/`QuestRewardPanel` (staging button "Quest victory" se esiste nel Director staging; altrimenti forzare via hook). Screenshot = riferimento per il prompt.
2. Generare mockup via AI web — stesso workflow dei mockup precedenti (ghiera/cassetto usavano `scripts/mw-web-turn.py` o broadcast one-shot; verificare quota ChatGPT prima, poi Gemini).
3. Presentare varianti → ruling → solo dopo arte firmata si può portare (nuovo `HudReal*` o estensione esistente).
4. Gate obbligatori: painter/scene-author skill per arte scena; visual fork card in explorer prima di implementare.

**Contesto critico (cambiato sotto il thread):** R-347 ha **revertito** la colonna Roster|Stash — roster e stash su /game sono **sempre superfici separate** (ruling Director, invariante in PLAN-119 + PLAN-124). Il lavoro rail R-340bis/R-346 è superato: roster = pannello flottante `panels.roster`, stash = `panels.villageStash`. T3/S2 bag-assign + food-cost preview fatti; cost cell popolata. Restano per chiusura lane Zanara: victory mockup (questa), QuestRunWindow stock (arte), Merchant BUY (design), R-335 sezioni cliccabili (ruling), Chronicle drawer (mockup PLAN-119), T8 sheet, insets→safeFit.

**Ruling (2026-11-16):** famiglia scelta «B pergamena» → iterazioni: V3/V4 (B patchata a mano, **bocciata** per texture sintetica/cuciture/scritte) → **V5** = frame rigenerato pulito da **Gemini web** via CDP (`gen/B-gemini-clean.png` 1024×745, zero scritte, anello→medaglione battezzato) + zone DOM. Verbatim finale: **«approvato, battezza»**. Fork card: `.mw/runs/20261116-r348-victory-ruling/visual-fork-victory-reward.md`; baseline in `.mw/specs/hud-real/refs/` (`approved-victory-pergamena-frame.png` sha ea1bccc3…, `approved-victory-reward-v5-witness.png` sha c69626ec…, generatori `gen-victory-frame-gemini.mjs`+prompt). Mockup: `public/mockups/victory-reward/v5.html`. Lezione: rigenerazione AI frame > patching raster. **Next:** porting `QuestRewardPopup`/reward path su produzione col frame battezzato (task/plan nuovo, contratto di porting nella fork card).

**Porting eseguito (2026-11-16):** la pergamena battezzata è un componente di produzione reale — `src/ui/idleVillage/hudReal/HudRealVictoryReward.tsx` montato sul reward path di `/game` (game-mappa2, in sostituzione dello `QuestRewardPopup` stock che resta sulla route legacy `/game-frame-pixi`). Contratto: `.mw/contracts/components/hudreal-victory-reward.md` (INV-1..5); test: `tests/unit/idleVillage/hudRealVictoryReward.test.tsx` (4/4) + one-title verde; coverage exception per file/asset/probe (famiglia `hudReal/**` in attesa di batch mapping). Witness live T-04: run reale poi-goblin → outcome reward → report firmato con dati veri, settlement→settling corretto (`.mw/runs/20261116-r348-victory-porting/witness-*.png`, signoff vincolato sha256). Bundle: `.mw/runs/20261116-r348-victory-porting/bundle.json` — **OB-1..OB-5 PASS** (test, lint --no-ignore, build:check, index-sync, human-eye); **verdict BLOCKED solo su OB-6** (`closure:lint` rosso per ~45 amend/retire + deliverables non mappati + trusted-lock — tutto fuori scope R-348, lavoro delle sessioni parallele R-339/R-352). Amend R-234-report-one-title autorizzato via ruling Director (sync-amend-override + redfirst:retire su entrambi gli host). Nota witness: Escape premuto mentre il report monta lo chiude (pari allo stock) — il driver aggira via `quest-window-close-report`. **Stato:** non `fatta` — in attesa del batch sync-amend worktree (responsabilità delle sessioni che hanno prodotto gli amend) o di una deroga Director esplicita.

