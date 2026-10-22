# PLAN-074: Quest journey UX evolution — rotta nascosta in svolgimento, marker «!», pausa su decisione, vignette viaggio (R-250)

**Status:** `baptized` — Director 2026-10-22 («procedi»); ledger aperto `plan:stamp open`
**Desiderata:** R-250 `in corso` (2026-10-21)
**Dibattito multi-AI web:** run `mind-weaver/.mw/runs/20261021-r250-journey-ux/` —
**CONVERGED** su `artifact-r002.md`, sha256 `88185967ca29dcba67d4e3208c0e87ff990d1e68d2b2143b104f11ec2b03edd0`.
3/3 ACCEPT degli elettori elegibili (deepseek, gemini, grok); `chatgpt` rimosso
come `provider_dead` (5 fallimenti generativi consecutivi; la sua proposta era
già integrata in r001, nessuna objection aperta); `claude` morto in
chiarimento/reseed, fuori dall'elettorato.
**Relazioni:** figlio diretto di PLAN-053 (quest journey legs — evolve la stessa
superficie, nessun redesign); PLAN-054 (living contracts — intent classificati
per file toccato); PLAN-047 (visual-fork obbligatorio); PLAN-052 (contratto di
authoring scene — applicato alle vignette); R-245 (niente testo su arte);
R-253 (pin-band 25–75% — ortogonale, nessun cambio al validator).

**Richiesta Director (verbatim):**
> *"una volta che il tragitto del party è arrivato alla quest nn deve essere
> mostrato + sulla mappa. Quando la quest è finita e riparte il ritorno si rifà
> la stessa animazione ma al contrario. Il tempo di andata e di ritorno ho
> cambiato idea: va mostrato nel componente quest, poi m devi dare un prompt x
> creare le immagini adeguate. Quando accade un evento durante andata e/o
> ritorno al posto del simbolo del party deve apparire un ! e l'indicatore
> dell posizione del party deve rimanere dove è fino a quando nn è risolto.
> Mentre un giocatore ha la schermata della quest attiva e c'è un pulsante da
> premere (è arrivato ad una fase in cui c'è una scelta, uno skill check, ecc)
> il tempo si ferma automaticamente e riprende a muoversi dopo l'esito.
> L'esito nn deve cambiare l'immagine mostrata x la fase."*

## 1. Grounding (corretto dal dibattito — ledger nel run dir)

- **`travelDays` authored = andata E ritorno** (PLAN-053 §4); il ritorno non è
  authored separatamente. `routeProgress` = posizione geometrica, **esclude il
  tempo parcheggiato** — il marker è già fermo al beat pin durante un waiting
  beat; il cambio richiesto è solo il glifo («!») non il moto.
- **`processedUpToTick` resta il watermark**; i waiting beat parcheggiano già il
  frontier. La nuova pausa-auto **non tocca l'engine journey**: si implementa
  nel time loop (`isPaused` effettivo → nessun `advanceJourney`), così
  rehydration/beat-scheduling sono inalterati.
- **La scena cinematica `ritorno` esce dal flusso fasi** (PLAN-053 D-4): la
  fase `ritorno` esiste come fase viaggio; nessun cambio ai contenuti.
- **Nessun dato persisted nuovo**: rotta/marker/modo sono proiezione del
  journal. Le pause-claim sono **transienti** (mai nel journal, mai persistite).
- **Una sola spedizione in volo** (launch gate globale): `questPauseClaims`
  keyed su `runId` è difensiva/future-safe; nessuna arbitrage multi-run.
- **`quest-journey-route.INV-1` (PLAN-053) dice oggi**: «the party stays at the
  POI during svolgimento» e «no route is rendered for legacy or terminal runs»
  — R-250 **emenda** la parte svolgimento (rotta+marker nascosti, POI pin vivo)
  via `redfirst:retire` + R-250 a `BASE`. Il resto (fill monotono, reversal,
  niente rotta su legacy/terminal) resta.
- **`quest-journey-phase-strip.INV-1`**: le 3 barre + chip parked/loot restano
  l'autorità timing/status — invariata (le vignette sono decorative).
- **CTR-game-002** copre `useTimeEngineLoop` + `game-frame-pixi` (clock freeze
  durante event theatre); CTR-game-008 lo include come dipendenza esterna. Il
  cambio pause semantics entra nel loro scope → Mode B-amend + nuova INV.

## 2. Ruling Director acquisiti (explorer, 2026-10-21 — R-250 §ruling)

- **E1** «il tempo si ferma» = **entrambi**: progresso journey E orologio mondo.
- **E2** «!» solo su **eventi interattivi** (waiting beat); i pending
  auto-risolventi non mostrano «!» né parcheggiano.
- **E3** finestra quest **attiva/aperta/non minimizzata** e bound al run
  atteso → claim; chiusura/minimizzazione rilascia il claim, il run resta
  parcheggiato al frontier, l'orologio può ripartire.
- **E4** la pausa manuale utente sopravvive al rilascio del claim automatico;
  **Space non può bypassare un claim automatico attivo**.
- **E5** le strip `Nd` restano l'autorità timing (ruling 2026-10-19); le
  vignette sono decorative salvo fork visivo separato.
- **E6** il POI pin resta visibile durante `svolgimento`; spariscono rotta e
  party marker.
- **E7** ritorno = stessa rotta authored ripercorsa in senso inverso; le due
  illustrazioni andata/ritorno sono **asset distinti direzione-specifici**
  (non un mirror).
- **E8** artwork interattivo stabile: l'esito non cambia l'immagine della fase.

## 3. Design decisions (artifact r002, emendate dalle 13 objection del r2)

| # | Decisione |
|---|-----------|
| D-1 | **`effectivePaused = userPaused \|\| questPauseClaims.size > 0`.** Le claim automatiche non mutano mai `isPaused` persistito. |
| D-2 | **`isPaused` persistito = solo intent utente.** Nuovi API `addQuestPauseClaim(runId)` / `clearQuestPauseClaim(runId)`, transienti. Vecchi `pauseGame('user'|'auto')`/`resumeGame(...)` restano shape-compatibili ma `'auto'` non più usato per le claim (audit T-001 decide il pruning). |
| D-3 | **`selectUserPaused` = unico lettore legale del raw persistito**; consumer ticking/HUD leggono `selectEffectivePaused`. Guard statico grep. |
| D-4 | **Barriera idratazione atomica** rispetto al tick pump: journal+finestra ripristinati → claim predicate ricalcolato sincrono nel commit `hydrationComplete` → primo tick vietato prima. |
| D-5 | **`selectFase(runId)` derivato dal journal** guida la proiezione rotta: `andata` visibile, `svolgimento` rotta+marker nascosti (POI pin vivo), `ritorno` visibile reversed, terminal → rimossa nello stesso tick di `ended`. |
| D-6 | **`isParkedAtCurrentNode` = predicato unico engine+UI** (estratto puro da `questJourneyEngine`): waiting-beat pending e non risolto al frontier corrente, `endpointResolving` escluso. |
| D-7 | **Marker «!»** mentre `selectJourneyMarker === 'parked'` su gambe di viaggio: posizione congelata al beat pin (routeProgress già esclude parked), loot pouch adiacente in ritorno, revert a glifo normale esattamente alla risoluzione. Pending/endpointResolving → glifo normale. A11y: `title` nativo + aria/status sul layer DOM, chiave i18n. |
| D-8 | **Vignette viaggio nel componente quest**: due asset ~960×384 painterly distinti (`vignette-andata`, `vignette-ritorno`), decorativi, alt text i18n, config Zod (`questJourneyVignetteConfig.ts`), niente testo baked. Layout deciso dalla visual-fork card T-006. |
| D-9 | **Fade opzionale ≤400 ms render-only** (alpha Pixi/SVG, non CSS; reduced-motion → istantaneo); mai mutazione di stato. |
| D-10 | **Art latch** provato a doppio livello: reference-equality di stato + hash immagine renderizzata headless prima/dopo commit esito. |
| D-11 | **R-247 regression obligation**: ogni task comportamentale porta un'obbligazione `state` bloccante con test di regressione permanente che fallirebbe senza il cambio. |

## 4. NOT in scope

- Arbitraggio multi-spedizione; cambi a scheduling/`processedUpToTick`/pin
  authored/outcome/reward/combat/launch gate; infrastruttura pause-reason
  generica oltre la claim minimale; sostituzione phase strip; backend sync;
  flag persisted nuovi; framework di animazione; chiusura auto della finestra
  quest; cambi a `travelDays`/`ticksPerDay`/algoritmo stima svolgimento;
  simulazione route-independent.

## 5. Tasks

| ID | Task — output verificabile | Dipendenze |
|----|---------------------------|------------|
| T-001 | **Audit call-site** (solo analisi): mappa completa lettori/scrittori `isPaused` (loop, HUD, Space, path idratazione), sito/i del check parked nell'engine, albero mount/label overlay, ordine hydration; classificazione living-contract intent per file toccato; decisione `pauseGame('auto')` pruning. Output: `test-results/r250/call-site-map.md` + tabella intent approvata | — |
| T-002 | **Store pause-claims** (`useMinimalGameplay.ts`): `selectUserPaused`, `selectEffectivePaused`, `selectCanTick`, `questPauseClaims: Set<RunId>` transient, `addQuestPauseClaim`/`clearQuestPauseClaim`, flag `hydrationComplete`; `isPaused` ristretto a user-intent; grep-guard raw readers (whitelist). Mode B-add + nuova copertura contratto store | T-001 |
| T-003 | **Loop + Space + barriera** (`useTimeEngineLoop.ts`, binding Space, init): tick gated su `selectEffectivePaused` + `hydrationComplete`; Space tocca solo user-pause e non rilascia claim; CTR-game-002/008 Mode B-amend | T-002 |
| T-004 | **Predicato + selettori condivisi** (`questJourneyEngine.ts` → `isParkedAtCurrentNode` puro esportato, refactor emit-identico Auto-Neutral; `questJourney.ts` → `selectFase`, `selectJourneyMarker`, `selectRouteProgress` Mode B-add) | T-001 |
| T-005 | **Claim binder** sull'host della quest window (file scelto in T-001): engage quando (windowActive ∧ frontierWaiting ∧ ¬endpointResolving ∧ ¬terminal), release a commit esito/minimize/close; reopening re-engage; decisioni a catena senza blip. Mode B-add su `quest-run-window` (o nuovo hook contrattato) | T-002, T-004 |
| T-006 | **Visual-fork card** (una sola): layout blocco vignetta nella quest window + stile glifo «!» + modo transizione rotta (fade≤400ms/istantaneo). Preview headless, ruling Director | T-001 |
| T-007 | **Ciclo di vita overlay** (`QuestJourneyRoute.tsx` + `questJourneyRouteConfig.ts` + wiring `game-frame-pixi.tsx`): visibilità da `selectFase` (svolgimento → rotta+marker nascosti, POI pin vivo; ritorno → reversed; terminal → rimozione nello stesso tick di `ended`); fade render-only per D-9. Mode B-amend: `redfirst:retire` della porzione svolgimento di `quest-journey-route.INV-1` + INV nuove | T-004, T-006 |
| T-008 | **Marker «!»** (stesso scope T-007): swap glifo su `selectJourneyMarker==='parked'` nelle gambe viaggio; pouch adiacente in ritorno; revert esatto a risoluzione; pending/endpointResolving → glifo normale; a11y `title`+aria/status, chiave i18n `idleVillage` namespace | T-004, T-006, T-007 |
| T-009 | **Vignette**: prompt definitivi (§7) → generazione asset via `painter` + contratto PLAN-052 → `public/assets/quest-vignettes/`; `questJourneyVignetteConfig.ts` (Zod); `JourneyVignette` nel componente quest per il layout ratificato; alt text i18n; decorativo | T-006 |
| T-010 | **Suite determinismo/reload**: unit AC4 (ricalcolo claim deterministico), AC8/9/10 (reload parked/svolgimento/ritorno — stato identico), AC13 (persistenza user/auto), AC14 (art latch reference-equality) | T-002..T-009 secondo focus |
| T-011 | **Witness headless** stessa-viewport before/after: AC1 (rotta nascosta), AC2 (reverse), AC3 («!»+revert), AC5/6/7 (pausa open/minimized/closed), AC11 (POI pin), AC12 (rimozione ad arrivo), AC14 (hash arte renderizzata). Evidence `test-results/r250/` | T-007, T-008, T-009 |
| T-012 | **Chiusura**: docs trusted, R-250 → `fatta` solo dopo bundle PASS, plan disposition + intent ledger, `verify:bundle` + `closure:lint`, riferimento in RICHIESTE | T-010, T-011, OB-7 |

## 6. Acceptance criteria testabili + obbligazioni

| AC | Criterio | Test |
|----|----------|------|
| AC-1 | Durante `svolgimento` rotta+marker assenti nel DOM/layer mappa; POI pin presente | unit + E2E headless |
| AC-2 | A `ritorno` la rotta riappare, fill progredisce POI→villaggio | unit + E2E |
| AC-3 | Waiting beat viaggio → marker «!»; risoluzione → glifo normale; posizione invariata durante l'attesa | unit + E2E |
| AC-4 | `(journal, windowState, userPaused)` identici → claim identico dopo recompute | unit |
| AC-5 | Finestra attiva + decisione pending → effectivePaused true → esito commit → false (senza pausa utente) | unit + E2E |
| AC-6 | Minimize/close durante decisione → claim rilasciato, run parked, clock corre | unit + E2E |
| AC-7 | Pausa utente attiva → rilascio claim non la toglie; Space con claim attivo non unpausa | unit + E2E |
| AC-8/9/10 | Reload durante parked / svolgimento / ritorno → stato identico, niente flag persistiti | unit (journal round-trip) |
| AC-11 | POI pin visibile in svolgimento | E2E headless |
| AC-12 | Rotta+marker rimossi stesso tick di `ended`/arrivo villaggio | unit + E2E |
| AC-13 | `isPaused` persistito contiene solo user intent (round-trip save/load) | unit |
| AC-14 | Arte di fase: reference-equality + hash renderizzato invariato dopo esito | unit + headless |

**Obbligazioni (contratto di chiusura):**

- **OB-1** Unit verdi: pause semantics, split user/auto, barriera idratazione,
  predicato/selettori, transizioni marker (AC-4, AC-13).
- **OB-2** E2E headless: AC-1, AC-2, AC-3, AC-5, AC-6, AC-7, AC-8/9/10, AC-11,
  AC-12, AC-14 — evidence `test-results/r250/`.
- **OB-3** Living-contract sync: INV emendate registrate
  (`redfirst:retire`/B-add), `contracts:check` verde; expected_checks
  surface-map ereditati: **CTR-game-002, 005, 006, 007, 008, 009** +
  `npm run test -- tests/unit/idleVillage` + e2e spec idleVillage quest +
  `quest:journey:lint`.
- **OB-4** Regression-test permanente per task comportamentale (R-247):
  obbligazione `state` bloccante il cui comando fallirebbe senza il cambio.
- **OB-5** Grep-guard: nessun lettore raw `isPaused` fuori whitelist.
- **OB-6** lint / `build:check` / `closure:lint` / `verify:bundle` + suite
  journey characterization invariate.
- **OB-7** Eye-check Director human-witness su: glifo «!», look vignette,
  transizione rotta, layout — side-by-side stessa viewport pre-registrata.
- **OB-8** Prompt immagini (§7) consegnati nel plan + handoff a `painter`.
- **OB-9** `verification.json` → `verify:bundle` → `bundle.json` per task;
  RICHIESTE aggiornato a `fatta` solo dopo evidence.

**Visual-fork:** T-006 card REQUIRED — copre layout vignetta, glifo «!»,
modo transizione. Nessun'altra decisione estetica silenziosa.

## 7. Deliverable: prompt generazione immagini (OB-8)

Stile condiviso (prepend a entrambi):
> *Painterly gouache fantasy-map vignette, wide cinematic band ~2.5:1 (960×384),
> warm parchment and gold palette with muted verdigris and oxblood accents,
> soft ink outlines. No text, numerals, logos, watermarks, UI chrome, frames;
> no photorealism, 3D render, neon, oversaturation. Match an existing
> hand-painted fantasy RPG scene library. Intentional negative space.*

**vignette-andata:**
> Village edge at dawn just inside the gate: thatched roofs and a low stone
> wall in the left third; a winding dirt road leading toward rolling
> wilderness and a distant landmark; a small party silhouette walking
> outward; morning haze; left-to-right travel flow; quiet, purposeful,
> slightly foreboding mood.

**vignette-ritorno:**
> A returning party seen from the wilderness side: village gate and roofs
> glowing in warm late-afternoon light in the far third; the party walking
> inward carrying a loot pouch; long warm shadows, faint hearth smoke;
> right-to-left travel flow; a distinct painting, not a mirrored outbound
> image; homecoming, relief, the weight of a completed expedition.

## 8. Rischi e mitigazioni

- **Race idratazione/claim** → barriera D-4, primo tick post-commit (T-003).
- **Drift predicato engine/UI** → predicato unico D-6 (T-004), grep-guard.
- **Blip unpause tra decisioni a catena** → binder claim continuo, test AC-5.
- **Fade che muta stato** → alpha render-only + reduced-motion (D-9).
- **Regressioni contratto** `quest-journey-route.INV-1` → `redfirst:retire`
  formale + R-250 a `BASE` prima del cambio (T-007).
- **`pauseGame('auto')` legacy residuo** → audit T-001 decide mapping/prune.
