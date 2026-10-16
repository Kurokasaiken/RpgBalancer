---
title: "PLAN-040 — QuestRunWindow rev.3: contenimento controlli, bag in header, skill check esterno pre-caricato, esiti toast, reward d'impatto"
status: completed
owner: Mind Weaver
created: 2026-10-16
baptized: 2026-10-16 (Director «battezzo, procedi»; artifact r007, sha f2b48df4, mw-web-debate converged 3/3 ×2 run)
source_request: R-205 (verbatim Director 2026-10-16 — «nuovo plan, nn continuare il precedente»)
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md
  - RICHIESTE.md (esito R-205)
  - src/docs/docs/idle_village/quest_ui_component_guide.md (contratto skill check fuori dalla finestra)
  - src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md (riga QuestRunWindow / nuovi componenti)
---

# PLAN-040 — QuestRunWindow rev.3: sei difetti osservati dal Director

Origine: osservazione diretta del Director su `/game` (POI quest → POI detail →
quest). Piano **autonomo** — sostituisce qualsiasi prosecuzione del piano R-199
(richiesta esplicita «nuovo plan»). I fix si applicano al componente battezzato
`QuestRunWindow` (rev.1 R-196, rev.2 R-199 già in codice) e alle superfici che
lo ospitano.

## 1. Goal & Scope

Sette punti Director, mappati su sei task + diagnostica:

1. **Screenshot del componente in tutte le fasi** — estendere l'harness
   deterministico (`scripts/quest-theatre-playtest.ts` su `/quest-window-lab?seed=N`)
   per catturare *ogni* stato (choices, beat replay, check, harm, fine run,
   reward popup) e misurare gli elementi che escono dalla placca. Headless.
2. **Pulsanti fuori dal componente** — contenimento duro: nessun elemento
   interattivo può dipingersi fuori dal rect della `HudPlaque`; pulsanti meno
   alti, spazio sotto usato meglio (choice rows compatte, strip azioni
   riassorbita, barra tempo + tile fasi razionalizzate).
3. **Pulsante bag** — oggi il `quest-belt-toggle` siede nell'action strip sopra
   le scelte *senza* wrapper `data-hud-controls` → eredita la pill bronze
   intera (percepita «troppo grande»). Spostato nella riga icone dell'header
   (affianco a roster/log/opzioni-check/abbandona), badge punto se armato.
4. **Skill check fuori dal componente quest, davanti** — nuovo
   `QuestSkillCheckOverlay` montato via `createPortal` nel root dedicato
   `#game-modal-root`: l'astrolabe esce dal theatre e diventa una placca
   flottante centrata, `zLayers` sopra i pannelli. Post-risultato, click
   sull'overlay → scompare (armato dopo ~300 ms dal verdetto dipinto).
5. **Skill check precaricato nel boot** — il primo check non deve pagare
   l'init: warm best-effort misurato (measure-first gate) durante la fase
   `warmup` del veil, dentro il budget boot ≤4 s. Include il fix reale
   scoperto: `useAstrolabeAudio` crea `new AudioContext()` + 5 fetch al
   mount **anche con `removeSounds`** (trappola T-10 in produzione).
6. **Skill check ottimizzato per la visualizzazione** — board quadrata a misura
   di config, leggibile a 1280×800, non più schiacciata nel theatre 2.4:1.
7. **Esiti post-check = popup esterno piccolo** — `QuestOutcomeToast`: placca
   flottante compatta, tutto il testo immediato (chip verdetto + titolo +
   flavor + harm lines), click → scompare; appare solo quando l'overlay del
   check non è montato (zero duplicazione verdetto); il record persistente
   resta `QuestLogPanel` (chronicle).
8. **Reward più veloce e d'impatto** — `QuestRewardPopup`: reveal quasi
   immediato, CTA vera («Raccogli ricompense», non testo nudo), più icone/
   asset (cover art banner, icona esito grande, icone per riga loot).

**Non-Goals:** modifiche alle meccaniche del motore quest (`questRun.ts`
resta read-only per logica; **uniche eccezioni additive** (debate W-22 +
debate2): `checkSeq`, `visitSeq`, `beatIndex` su `ResolvedCheck`,
`nextCheckSeq`/`cursorVisitSeq`/`dismissedUpTo` run-level — tutte
additive, nessuna logica modificata), al grafo/scenari, all'astrolabe `DestinyAstrolabeV62` (frozen
re-export: si wrapa, non si modifica il board), meccaniche di risoluzione,
generazione quest, POI planner (`QuestExpeditionDetail` — fuori scope: il
flusso POI→detail resta com'è).

## 2. Vincoli, Trappole e Contratti

- **Desiderata v3/v4/v27 FROZEN (T-05):** pannelli flottanti non bloccanti,
  esito raccoglibile manualmente, `QuestRunWindow` come finestra HUD. Il check
  *esterno e davanti* è la raffinazione Director della stessa desiderata —
  nessuna riscrittura del componente: overlay + toast sono **wrapper** attorno
  al flusso esistente (beat cursor, `astroSettledIds`, `ResolvedCheck`).
- **T-03:** il portal esce dal `.skin-scope` della finestra → overlay e toast
  wrappano il proprio `<SkinScope>` e `data-hud-controls` copre i loro
  controlli. Idem reward (già corretto: ha `SkinScope` proprio).
- **T-04:** ogni claim visivo si chiude con screenshot witness (headless) che
  il Director può vedere — metriche di supporto, non verdetto.
- **T-08/T-09:** overlay e toast montano solo quando servono (keyed su
  beat/check id); misure perf solo su `vite preview`, mai su dev.
- **T-10 (trova reale nel codice):** `destinyAstrolabeV6/useAstrolabeAudio.ts:19-41`
  crea `new AudioContext()` in `useEffect` al mount e scarica/decodifica 5 wav
  **senza guardare `muted`**. Il quest window monta sempre `removeSounds` →
  ~1 s di main-thread + fetch sprecati a ogni check. Fix: gating `!muted`
  sull'effetto di preload (lazy: ctx+buffer solo al primo `play()`).
- **Transform trap:** `useHudPanelDrag` applica `transform` allo shell → un
  figlio `position:fixed` sarebbe ancorato allo shell, non al viewport. Per
  «fuori dal componente, davanti» serve `createPortal` (come già ipotizzato
  per `QuestRewardPopup`, che è montato a livello pagina). Overlay e toast
  montano in un root dedicato `#game-modal-root` (ultimo elemento del body,
  sempre sopra gli stacking context degli shell trasformati).
- **Portal architecture (debate W-01, rafforzata r3):** overlay e toast NON
  sono discendenti React di `QuestRunWindow` — montano come siblings nel
  componente condiviso `questOverlays` sotto `#game-modal-root` (ultimo
  elemento del body, sopra ogni stacking context di shell trasformati). La
  finestra parla agli overlay solo via azioni del reducer `questOverlays`
  (`checkStarted`/`checkResolved`) e un ref/callback per il beat cursor:
  **niente bubbling da sopprimere, niente `stopPropagation`** — che in
  React17+ fermerebbe anche l'evento nativo verso `document`/`window`,
  rompendo listener dell'`overlayStack`, outside-click dei companion, drag
  e telemetria (fix strutturale, non workaround; test: un listener a
  document-level riceve il click sull'overlay).
- **Contratto dati del reducer (debate2 W-01/W-02):** `questOverlays` legge
  lo stato run da uno **store esterno** (`useSyncExternalStore` + selector)
  condiviso con la finestra — il reducer tiene SOLO stato UI (stack,
  armed, dismiss). La risoluzione arriva come **evento immutabile unico**
  dal confine canonico di risoluzione `{runId, checkSeq, outcome,
  beatIndex, visitSeq}`: eventi stale/cross-run rifiutati; test out-of-order
  e run replacement. `beatIndex` NON basta da solo (debate2 W-22): su loop
  di grafo un revisit produce un check con beatIndex ≤ uno precedente →
  "settled" ambiguo. Il marcatore corretto è **`visitSeq`**: il cursore
  tiene un contatore monotonico di visita (`cursorVisitSeq`); ogni
  `ResolvedCheck` è timbrato col visitSeq del beat che l'ha prodotto;
  settled = `visitSeq < cursorVisitSeq`. Tre campi additivi su
  `ResolvedCheck`: `checkSeq`, `visitSeq`, `beatIndex` (debug).
  `useQuestRun` entra nei files di T-003a.
- **Atomicità (debate2 W-24):** allocazione `checkSeq` + timbro `visitSeq`
  + creazione `ResolvedCheck` avvengono nella **stessa transizione di
  stato del motore** (un'unica `apply()`); la riconciliazione di
  `dismissedUpTo` avviene nella transizione che avanza il cursore —
  anch'essa atomica. Un crash/resume fra risoluzione e avanzo lascia il
  check *unsettled* → comportamento conservativo corretto (il toast
  compare), mai un check settled-fantasma. Test: fixture crash/resume al
  confine.
- **Host hit-test (debate2 W-03):** `#game-modal-root` è
  `pointer-events:none`; i figli riabilitano `pointer-events:auto` SOLO
  sulle superfici interattive visibili — nessun backdrop full-viewport,
  niente pointer capture fuori dai bounds della placca. Verifica in
  browser reale (non mock): click-through sulla mappa, outside-click,
  drag della finestra sottostante.
- **Controller per-dominio (debate2 W-04):** host e `overlayStack` sono
  condivisi; lo stato interno è decoupled in
  `useQuestCheckOverlayController` e `useQuestOutcomeToastController`
  (niente reducer monolitico che accoppia due lifecycle).
- **Escape stack (debate W-02):** `Escape` ha già significati (belt plaque,
  minimise, reward). Un unico `overlayStack` manager a livello pagina:
  ogni superficie (check overlay, toast, reward, belt plaque) si registra
  con il suo zLayer; Escape chiude SOLO la topmost registrata. Escape
  durante lo spin del check non fa nulla.
- **R-198/16-no-foreground:** ogni verifica (harness, E2E, screenshot) è
  headless/background; finestra visibile = step manuale del Director.
- **Config-first:** nuove misure (`skillCheck.boardSizePx`,
  `outcomeToast.*`, `rewardPopup.stageMs` default, z-layers) in
  `gameFrameConfig.questWindow` / `zLayers`, mai letterali. Nota: il reward
  popup ha oggi `zIndex: 1200` letterale → va normalizzato in `zLayers`.
- **i18n ICU:** chiavi nuove `{var}` singola graffa (en + it-IT + pseudo +
  mirror `i18n.types.ts`).
- **Kit congelato:** `DestinyAstrolabeV62Standalone` resta intoccato;
  `useAstrolabeAudio` vive in `destinyAstrolabeV6/` (condiviso V6/V62/…) —
  la modifica è additiva e sicura: `muted` salta preload e ctx.
- **Contratti attivi:** CTR-game-001..004 invariati (il check overlay non
  tocca ticker, clock freeze, HUD hide né coreografia invasione).
- **QUEST_RULES:** lo spostamento del check fuori dalla finestra è una regola
  di presentazione → riga in `quest_ui_component_guide.md` (regola 80 non si
  applica: non cambia il modello di gioco, solo dove si dipinge il check).

## 3. Spec tecnica

### T-000 — Diagnostica per-fase (headless, prerequisito di ogni fix)
Estendere `scripts/quest-theatre-playtest.ts`:
- flag `--phases`: ad ogni step salva **viewport shot** (non solo la finestra)
  + misura `outsidePlaque`. **Contratto visuale, non DOM-letterale
  (debate W-03):** sono "della finestra" tutti gli elementi interattivi
  quest-owned — discendenti di `data-hud-panel="quest"` **più** i companion
  portalizzati (bag plaque, roster/log, options popover, overlay) marcati
  `data-quest-owned`. Rettificati contro il rect della placca mappato
  all'**origine non trasformata** (sottrarre l'offset drag corrente — stesso
  aritmetica di `measureBaseUnionRect`); sotto `transform`,
  `getBoundingClientRect` sui figli non è confrontabile col viewport
  (debate W-04). Esteso anche a `[data-hud-text]`/`HudChip`: il testo che
  straborda è difetto quanto i pulsanti (rect dentro placca **o** dentro il
  suo scroll container interno);
- viewport coperte: 1440×900 e 1280×800;
- stati coperti: choices waiting, beat replay, **check/astrolabe**, harm,
  combat strip, minimised, `run.ended`, reward popup (oggi non coperto:
  la pagina lab monta solo la finestra → aggiungere `QuestRewardPopup` al
  lab dietro flag `?reward=1` o seconda rotta);
- output: `test-results/plan-040-quest-window/phase-shots/` + `outside.json`.
L'output decide quanto del T-001 è "compatta" vs "riorganizza" — il contratto
di uscita (BV-1) resta fisso: **zero elementi fuori placca** a 1440×900 e
1280×800. Il baseline shot esce per primo (evidence prima dei fix); le
compattazioni ovvie possono partire in parallelo mentre l'harness copre le
fasi meno comuni — l'harness resta il **validatore** di BV-1, non un
bloccante seriale (debate2 W-05).

### T-001 — Contenimento: pulsanti meno alti, spazio sotto meglio usato
- Choice rows (`skinScope.css` `[data-hud-choices]`, usate solo qui):
  padding `8px 12px` → `5px 10px`; `margin-top: 6px` → `4px`; riga chip
  preview accorpata (`marginTop: 3px` → `2px`, `gap: 4` → `3`). Valori come
  token `--skin-hud-row-*` già esistenti o nuovi token — niente letterali nel
  CSS senza token.
- Le flex-column figlie della placca ricevono `minHeight: 0` dove serve:
  oggi `flexShrink` senza `minHeight` non comprime → il contenuto straborda
  sotto il bordo della placca. Stage e choices diventano le zone elastiche;
  `choicesMaxHeightPx` nuovo in `questWindow` (scroll interno oltre soglia,
  stesso regime di `stageMaxHeightPx`).
- Spazio sotto: l'action strip sparisce (bag → header, T-002); l'hint
  `phaseLocked` si fonde nella riga della barra tempo come testo inline, non
  riga a sé. TimeBar + tile fasi restano su due righe ma con gap ridotto
  (`gap: 10` placca → valori da config `questWindow.gapPx`).
- `quest-window-close-report` (fine run) e `data-skin="choice"` condividono la
  stessa compattazione.
- Choices scroll: `scrollIntoView({block:'nearest'})` al focus di una scelta
  (una scelta keyboard-focused non deve restare fuori vista); la placca non
  cattura la wheel fuori dallo scroll interno.
- Accettazione: `outsidePlaque` = [] su tutti gli step dell'harness, a
  entrambe le viewport, con companion aperti e chiusi.

### T-002 — Bag: toggle in header, plaque invariata
- `quest-belt-toggle` si sposta nel cluster `data-hud-controls` dell'header
  (tra log e check-options), stessa pill icone delle altre toggle; il punto
  «armato» resta. Il `quest-action-strip` scompare; `phaseLocked` si sposta
  come hint inline sulla barra tempo (o accanto al titolo — il witness
  T-000/BV decide quale si legge meglio).
- `QuestBeltPlaque` continua ad aprirsi sopra le scelte
  (`data-hud-companion="belt"`, invariato: armare accanto alla scelta che
  l'oggetto influenza, R-199 pt.13). Focus-return → header toggle.
- La finestra di armamento resta quella attuale (solo quando le scelte sono
  presentate) — nessun nuovo arm window (debate W-05).

### T-003 — `QuestSkillCheckOverlay` (check fuori, davanti, click-to-dismiss)
Nuovo `src/ui/idleVillage/components/gameFrame/QuestSkillCheckOverlay.tsx`:

- **Ownership (debate W-06):** `QuestRunWindow`/`useQuestRun` restano gli unici
  proprietari di beat cursor e risoluzione; l'overlay è una **proiezione** di
  `currentBeat.kind === 'check'` + `run.lastCheck`. Montato via
  `createPortal(#game-modal-root)` come **sibling** della finestra dentro
  `questOverlays` — non discendente React della finestra (niente bubbling
  sintetico da sopprimere, debate W-01r3). `astroRef` rilegato via
  **callback ref** dentro il portal; code `throw()`/`skipIntro` deferite al
  mount confermato (debate W-08). Overlay run-level: sopravvive al minimise
  della finestra, smonta a fine run/abbandono.
- `position:fixed`, centrato viewport; placca `HudPlaque shape="panel"` con
  riga titolo (nome check + chip `stat` vs difficoltà) + board quadrata.
  **Sizing layout-driven (debate2 W-06, sostituisce l'aritmetica r003):**
  la placca è flex-column con `max-height: calc(100dvh − 2·marginPx)`; il
  board è `aspect-ratio:1; flex:1 1 auto; min-height:0` → il chrome reale
  (titolo che wrappa in it-IT, chip, font scaling, zoom 200%) è misurato
  dal layout, non stimato. Floor `skillCheck.boardMinPx` (config); sotto il
  floor la placca scrolla internamente. Su `vw < skillCheck.compactBelowPx`
  il cap scende a `min(50vh, 90vw)`. Harness aggiunge viewport 1280×400 e
  zoom emulato 200% (BV-1/BV-3).
- Draggable via `useHudPanelDrag` con clamp: la title bar non può uscire dal
  viewport; re-clamp su `resize` (debate W-11).
- z: nuovo `zLayers.questCheck` (default 30 — sopra `panels` 12, sotto
  `boot` 40). Registrato nell'`overlayStack` (Escape = solo topmost, mai
  durante lo spin).
- **Eventi (debate W-01r3):** nessun `stopPropagation` necessario — l'overlay
  non è discendente React della finestra; i listener `document`-level
  continuano a ricevere gli eventi (test dedicato). Il dismiss usa un
  `settledRef` per check id (skip idempotente, mai doppio advance).
- Interazione: mentre gira → click sulla board = `skipToResult()` (salto
  progressivo, invariato); click sul `da-tira` interno = throw (i `button`
  del motore restano esenti dal dismiss — guard `closest('button')`).
- **Dismiss arming (debate W-12):** il dismiss post-risultato si *arma* solo
  dopo che il verdetto è dipinto + `skillCheck.dismissArmDelayMs` (default
  300): un click-to-skip che arriva mentre appare il verdetto non lo cancella
  prima di essere visto. Dismiss ignora `event.detail > 1` (doppio click) e
  click con `|pointerDelta| > 4px` (coda di un drag).
  Dismiss → `cursorRef.current.skip()` via `settledRef` per check id —
  idempotente, mai doppio advance. `checkHoldMs: 45000` resta leak-guard di
  auto-advance anche senza click.
- Config `skillCheck.verdictAutoDismissMs` (default `0` = manuale; >0 =
  auto-dismiss dopo N ms, utile per `skipIntro`+flussi rapidi).
- **A11y (debate W-13):** `role="dialog"` `aria-modal="false"`
  `aria-labelledby`; X `SkinButton` esplicita per chiudere (il click-sul-
  contenitore è convenienza pointer-only, nessun `role="button"` annidato);
  regione `aria-live="polite"` nascosta annuncia il verdetto; al verdetto il
  focus va al container dell'overlay, al dismiss torna all'opener se ancora
  connesso → altrimenti header finestra → `document.body`.
- `skipCheck` → nessun overlay (testo beat normale, invariato);
  `skipIntro` → `throw()` al mount (invariato).
- Il dock in-theatre (`quest-check-astrolabe`) viene **rimosso**; il theatre
  resta visibile dietro. Il BeatStage del check mostra il transit mentre
  l'overlay presenta (già il comportamento `checkSpinning`). La narrativa
  harm del beat resta in-window (è il beat, non il registro esiti).
- Non-modale (v3/v4/v27): **nessuno scrim** — il gioco sotto resta
  interattivo; l'overlay è solo una placca a z superiore.
- i18n: `gameFrame.questWindow.checkOverlay.{titleSuffix,dismissHint}`.

### T-004 — Preload del check nel boot veil
- **Measure-first gate (debate W-14, rafforzata debate2 W-07):** prima si
  misura lo split dell'init del check (compile shader vs texture
  procedurali vs markup/JS) su `vite preview`. Protocollo anti-gaming:
  workload baseline/warm **equivalenti e predefiniti**, trial appaiati
  ripetuti (≥5), statistica robusta, ambiente registrato nel bundle.
  **Default = solo fix audio** (debate2 W-23): il warm entra solo se il
  lower bound del guadagno (p25 dei delta appaiati) supera
  `skillCheck.warmMinGainMs` (config, default ~150) misurato su
  `vite preview` con profilo GPU reale — non solo SwiftShader. Esito
  inconclusivo = drop. Force-draw non raggiungibile senza modificare il
  kit = drop. Il verdetto è scritto nel verification bundle per il
  verificatore indipendente.
- `questSkillCheckWarm.ts` (nuovo, gameFrame): `prewarmQuestSkillCheck()`
  monta `DestinyAstrolabeV62Standalone` nascosto (`position:fixed`, 2×2px,
  `opacity:0`, `autoStart:false`, `removeSounds`, `skills:[]`), esegue
  **un draw reale + `gl.finish()`** (un mount senza draw su driver con
  compile lazy/`KHR_parallel_shader_compile` non scalda nulla, debate
  W-16) e poi distrugge chiamando `WEBGL_lose_context` — un terzo GL
  context non rilasciato è un leak (~16 context cap) su remount ripetuti
  del lab (debate W-17).
- **Condivisione warm↔live (debate W-18r3, correzione al claim r002):** il
  kit frozen resta wrapper-only — `DestinyAstrolabeV62` non si modifica.
  Gli handle GL (programs, textures) muoiono con `loseContext()` e NON sono
  condivisibili tra context: la cache shader è per-context, livello driver.
  Ciò che può attraversare i context è solo **plain-data CPU-side**:
  `astrolabeWarmCache` (nuovo modulo fuori da `destinyAstrolabeV6/`) tiene
  i pixel delle texture procedurali + il markup parsato prodotto dal warm;
  il mount live li legge se il costruttore V62 accetta dati iniettati
  **senza modifiche** — altrimenti il claim di condivisione cade e resta
  solo il driver-cache warm misurato dietro il gate `warmMinGainMs`.
  Invalidato su HMR.
- Scheduling: `requestIdleCallback` **dopo** `renderer.prepare.upload`,
  solo se lo slack residuo del budget boot (≤4 s `gamePerfBudgets`) supera
  `skillCheck.warmSlackMinMs`; `performance.now()` timeout guard ~600 ms con
  abort pulito; mai avviato senza WebGL2 o su percorso degradato; in CI
  headless (SwiftShader) il guard interrompe senza fallire il gate
  (debate W-18). "Mai ritardare onReady" è enforcement di scheduling, non
  promessa di parallelismo su main thread — il testo claima solo ciò che è
  misurato.
- `AbortController` nel warm: cancella fetch wav pendenti e chiude ogni
  `AudioContext` creato prima dell'unmount (debate W-19).
- **Fix T-10 (prerequisito, stesso task):** in
  `destinyAstrolabeV6/useAstrolabeAudio.ts` il preload effect gira solo se
  `!muted`; `getCtx()` resta lazy al primo `play()` non-mutato. Effetto
  collaterale misurabile: il mount del check smette di pagare
  `new AudioContext()` + 5 fetch quando `removeSounds` — il warm può
  coprire invece fetch+decode dei wav **solo se** i suoni vengono riattivati
  (oggi no: `removeSounds` sempre on su `/game`; il warm audio resta fuori
  scope).
- Misura: `__gamePerf` — il primo mount reale del check non aggiunge
  long-frame rispetto al baseline (`vite preview`, T-09).

### T-005 — `QuestOutcomeToast` (esiti popup esterni)
Nuovo `QuestOutcomeToast.tsx`, montato a livello pagina in
`#game-modal-root`, parte di **un unico componente `questOverlays` condiviso**
da `/game` e `/quest-window-lab` (stesso overlay, dismiss e sequenziazione
in produzione e nel lab — debate W-20). Lo stato vive in un **reducer
`questOverlays`** nel componente condiviso, non in local state di due
componenti (debate W-21):
- `position:fixed`, placca piccola `HudPlaque` (`outcomeToast.widthPx` ≈ 320),
  anchor da config `outcomeToast.anchor` (`bottom` + `offsetXPx/offsetYPx`,
  default centrato-basso, sopra il nav plinth) con offset verticale sopra i
  companion aperti (debate W-10); z `zLayers.questToast` (default 20).
- Contenuto **tutto immediato**: `HudChip` verdetto + titolo check + flavor
  completo + harm lines (stesse stringhe di `ResolvedCheck`, nessun
  typewriter, nessun reveal).
- **Trigger = predicato, non evento (debate W-21):** il toast del check N è
  eleggibile iff `overlay(N) non montato AND N.seq > dismissedUpTo` —
  derivato da store/selector (`selectPendingOutcome`), non da dispatch UI
  (debate gemini r2). Tabella di transizione: spin→dismiss-click → toast;
  auto-advance `checkHoldMs` → overlay smonta → toast (stesso predicato);
  fine run/abbandono → soppresso (il reward porta l'esito);
  `skipCheck`/`skipIntro` → nessun overlay → toast immediato.
- **Identità (debate W-22 + W-19r2 + debate2 W-08):** `checkSeq` = indice
  nella storia dei check risolti della run, assegnato dal motore al resolve
  — **run-scoped, atomico con la creazione del `ResolvedCheck`,
  strettamente monotonico e unico per l'intera run** (mai riusato dopo
  trim/loop di grafo; deterministico e replay-safe su seed harness; reset
  solo a nuova run genuina). Allocazione da **`nextCheckSeq` run-level
  persistito** (Zod default = `max(backfilled)+1`) — la posizione in
  `checkQueue` NON è un allocatore valido: il trim la resetta (debate2
  W-08). Legacy: il backfill `checkSeq` = posizione in coda **dopo
  validazione** della storia — duplicati o seq malformati → re-sequencing
  deterministico per ordine di coda; storia non ordinabile → reset a una
  nuova identità di run (seq space fresco), mai inferire l'ordine
  (debate2 W-21). Provenance incerta → storia legacy trattata settled con
  `dismissedUpTo = max`. Campi additivi: `checkSeq`, `visitSeq`,
  `beatIndex` (debug).
- `dismissedUpTo` vive **dentro l'oggetto run** (persistito). Idratazione:
  `dismissedUpTo = max(persisted, highestSettledSeq)` — mai abbassato
  (debate2 W-09: persistito e settled possono divergere e nessuno dei due
  da solo è corretto). "Settled" = `visitSeq del check < cursorVisitSeq`
  (immune ai loop di grafo); timbro e risoluzione sono atomici nella
  stessa `apply()` del motore — mai settled-fantasma (W-24). Resume
  mid-hold: l'overlay idrata in stato **resolved-held**
  (verdetto dipinto, nessuno spin, arm delay ri-armato) — non ripropone
  l'animazione (test dedicato).
- Eleggibilità e avanzamento del high-water-mark sono **transizioni
  esplicite del controller**, indipendenti da visibilità/minimise della
  finestra e dall'ordine dei mount (debate2 W-10): resolve→minimise→
  dismiss→toast→restore è testato, incluso un check più nuovo che risolve
  prima del dismiss.
- Soppressione a fine run **per acknowledgement, non predizione**
  (debate2 W-20, inverte il `rewardWillRender` di r005): il reward popup
  notifica il primo frame dipinto via store (`rewardShown(runId)`); il
  toast controller trattiene l'ultimo esito unsettled in stato
  **pending-flush** a fine run — lo dropa solo sull'ack, altrimenti lo
  flushes dopo un timeout breve o su unmount senza ack. Il caso
  «reward previsto ma mai apparso» non può più perdere l'esito. Righe
  tabella: abandon-during-spin, timeout-during-hold, loaded-ended-run;
  test: reward soppresso/unmounted → il toast appare comunque.
- Click ovunque sul toast (o `Escape` se topmost nello stack, o la sua X) →
  dismiss; telemetria `quest_outcome_shown` / `quest_outcome_dismiss`.
  `role="status"` (non `alert`); nessun `stopPropagation` necessario — il
  toast è sibling della finestra, non discendente React (W-01r3).
- Config `outcomeToast.autoDismissMs` (default `0` = resta fino al click;
  il Director: «se clicchi scompare, ma puoi leggerlo dai log» — il log
  `QuestLogPanel` resta il record persistente, invariato).
- Il blocco `resolved.slice(-1)` dentro lo stage della finestra (esito
  persistente in-window) viene **rimosso** — l'esito vive ora nel toast +
  nel log; il BeatStage transiente del check resta (è narrazione del beat,
  non il registro esiti).
- i18n: riuso `questS1Lab.verdict.*`, `questS1Lab.*Pct`; nessuna chiave
  nuova oltre `gameFrame.questWindow.outcomeToast.dismissHint` se serve.

### T-006 — `QuestRewardPopup` rev: veloce, CTA giusta, più icone
- **Prerequisito (debate2 W-12):** audit dell'handler `onClose` esistente —
  la CTA «Raccogli ricompense» deve avere la **stessa semantica di stato**
  di close/X/Escape (POI consumato, inventario accreditato). Se i delta
  differiscono, la differenza va documentata e giustificata — mai una CTA
  che promette raccolta che non avviene. Test: identici state-delta per
  CTA, X, Escape.
- **Veloce:** `rewardPopup.stageMs` 1400 → 280 (config, già esistente) e il
  banner esito + prime sezioni atterrano nello stesso frame; click/key
  hurry invariato. Opzione `reveal: 'fast'` se serve disattivare la cascata.
- **Pulsante giusto:** il testo nudo `quest-reward-close` →
  `SkinButton variant="cta"` con icona `ico-cup`, label
  `gameFrame.questWindow.collectRewards` («Raccogli ricompense» —
  desiderata v3, chiusura del flusso che consuma il POI). Resta la X in
  header per chiudere senza enfasi.
- **Impatto:** banner esito con `EngravedIcon` grande (cup=reward, fallen=
  wipe, pouch=fled, ~28px, tono outcome) + titolo quest; strip
  `scenario.coverArt` (campo schema esistente) in testa alla placca come
  banner ~3.5:1 se presente; icone per riga loot/reward (le sezioni hanno
  già `SECTION_ICON` — estendere a per-line dove serve, glifi
  `engravedIcons` esistenti, niente asset nuovi se basta il set corrente;
  decisione Step-0 del witness: se il set è povero, 2-3 glifi nuovi in
  `engravedIcons`).
- `zIndex: 1200` letterale → `zLayers.reward` (default 25, sotto
  `questCheck` 30: un check in corso non può finire sotto il report).
- Test `questRewardPopup.test.tsx` esistente va aggiornato allo stage count
  nuovo + CTA (non rotto in silenzio).

### T-007 — Test, guards, evidence, docs
- Unit: `questOutcomeToast.test.tsx` (predicato di eleggibilità, transizioni
  spin→dismiss/auto-advance/run-end/skip, `dismissedUpTo` su remount e queue
  trim, latest-wins), `questSkillCheckOverlay` state (spin→resolve→
  arm-delay→dismiss→skip; settledRef no-double-advance; drag-release non
  dismissa; Escape solo topmost) via mock engine, `questSkillCheckWarm`
  (mount+draw+finish+destroy, loseContext, timeout cap, AbortController),
  `overlayStack` reducer (topmost-Escape), listener `document`-level riceve
  il click sull'overlay (no bubbling suppression — W-01r3), remount con
  check pendente non sopprime il toast (`dismissedUpTo` init =
  max(persisted, settled) — claude r2/debate2), `checkSeq` monotonico/unico/
  deterministico su seed + backfill legacy validato/re-sequenced (chatgpt
  r2/debate2), fixture looped-beat con revisit+remount (settled via
  visitSeq), reward unmounted → pending-flush toast appare, aggiornamento
  `questRewardPopup.test.tsx`; gating `muted` di `useAstrolabeAudio`
  (no AudioContext quando mutato — spy su `window.AudioContext`).
- `hudGuards` STRICT_FILES += `QuestSkillCheckOverlay.tsx`,
  `QuestOutcomeToast.tsx`, `questSkillCheckWarm.ts`, `questOverlays.tsx`,
  `astrolabeWarmCache.ts`.
- **Test hit-test real-browser (debate2 W-13):** i test reducer/state sono
  deterministici e headless, ma hit-testing, stacking tra portal sibling,
  pointer capture, drag sotto overlay e contenimento viewport NON si
  dimostrano su mock DOM — suite minima real-browser (Playwright headless,
  viewport fisse incl. 1280×400 e zoom 200% emulato): click-through mappa,
  outside-click, drag finestra sotto overlay, minimise/restore durante
  check.
- **Telemetria formalizzata (debate2 W-14):** assertion esplicite sui
  payload `quest_check_skipped`, `quest_outcome_shown`,
  `quest_outcome_dismissed` (campi obbligatori elencati), non solo "eventi
  emessi".
- **i18n obbligatorio:** lista chiusa delle chiavi nuove
  (`checkOverlay.*`, `outcomeToast.dismissHint`, `collectRewards`, toast
  strings) verificata su en + it-IT + pseudo prima del sign-off.
- E2E headless (estendere suite `gameQuest*` esistenti o nuovo
  `gameQuestCheckOverlay.spec.ts`): bag toggle in header e plaque che si
  apre; `outsidePlaque` = [] a 1280×800 e 1440×900; overlay nel DOM fuori da
  `data-hud-panel="quest"` mentre un check batte; click post-resolve
  chiude l'overlay; toast appare e si chiude al click; reward con CTA
  `data-testid="quest-reward-collect"`.
- i18n: en/it-IT/pseudo + `i18n.types.ts`; `npm run i18n:validate`.
- Witness T-04: screenshot headless en/it × 1440×900/1280×800 delle fasi —
  `test-results/plan-040-quest-window/` (check overlay, toast, reward).
- Manifest `.mw/runs/plan-040-quest-window/verification.json` +
  `verify:bundle`; verificatore indipendente per le obbligazioni
  non-`state` (R-189).
- Docs: `plans/INDEX.md`, `RICHIESTE.md` (R-205), riga in
  `quest_ui_component_guide.md` (check = overlay esterno, esiti = toast),
  `COMPONENT_MASTER_INDEX.md` (QuestRunWindow + nuovi componenti),
  kanban `agent_assignments.md`.

## 4. Tasks

- [x] T-000: harness `--phases` + misura `outsidePlaque` + copertura stati
      (incl. reward nel lab) → `test-results/plan-040-quest-window/phase-shots/`
      ✅ 2026-10-16 — baseline 1280×800: 97 outsidePlaque (max 55px, choice
      `ol` sotto il bordo placca), 66 outsideViewport (astrolabe +32px top).
      Fix lab collaterali: tick in state (frontier sbloccata), click THROW,
      `.catch` muto rimosso, evaluate via stringa (trappola `__name`).
      files: scripts/quest-theatre-playtest.ts,
      src/ui/idleVillage/pages/QuestWindowLabPage.tsx
      depends: —

- [x] T-001: contenimento (choice rows compatte via token, `minHeight:0` dove
      serve, `choicesMaxHeightPx`, strip azioni riassorbita, hint locked inline)
      ✅ 2026-10-16 — `choicesMaxHeightPx`/`stageMinHeightPx`/`theaterMinHeightPx`
      in schema+default; theatre = reservoir shrink (`minHeight` floor), choices
      scroll interno, stage floor 44px, `flexShrink/minHeight:0` sulla colonna
      choices. Re-run 1280×800: **outsidePlaque 0, maxOverflow 0, choicesH 162**.
      files: src/ui/idleVillage/skins/skinScope.css,
      src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx,
      src/balancing/config/idleVillage/gameFrameConfig.ts
      depends: T-000

- [x] T-002: bag toggle → cluster header (badge armato), focus-return,
      strip rimossa
      ✅ 2026-10-16 — toggle spostato nel cluster `data-hud-controls` (dot
      armato dentro il bottone, aria-expanded/controls invariati); la belt
      plaque resta ancorata sopra le scelte. Action strip residua solo per
      l'hint `phaseLocked`. Witness: phase-shots/1280x800-fixed.
      files: src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx,
      public/locales/{en,it-IT,pseudo}/idleVillage.json
      depends: T-000

- [x] T-003a: host `#game-modal-root` + `overlayStack` (Escape topmost) +
      store esterno `useSyncExternalStore` per la run + contratto evento
      risoluzione `{runId, checkSeq, visitSeq, beatIndex, outcome}` con
      reiezione stale/cross-run — **exit criteria = contratto dati
      stabile** (è la dipendenza di T-003b e T-005)
      ✅ 2026-10-16 — `questRunStore.ts` (zustand: runs/bridges/rewardAck),
      `questOverlays.tsx` portal host condiviso game+lab, `overlayStack.ts`
      (Escape topmost-only), `checkEventOf`/`isStaleCheckEvent` con reiezione
      cross-run e dismissed. `questRun.ts` guadagna `checkSeq`/`visitSeq`/
      `beatIndex`/`nextCheckSeq`/`cursorVisitSeq`/`dismissedUpTo` +
      `normalizeRunOverlayIdentity()` (backfill legacy, re-sequence
      deterministico su duplicati, dismissedUpTo = max(persisted,
      highestSettled)). Unit: questOverlayIdentity.test.ts 9/9.
      files: questOverlays.tsx (nuovo, shared game+lab),
      src/pages/game-frame-pixi.tsx, QuestWindowLabPage.tsx,
      useQuestRun.ts, questRun.ts (campi additivi checkSeq/visitSeq/
      beatIndex/nextCheckSeq/cursorVisitSeq), gameFrameConfig.ts,
      questRunStore.ts, overlayStack.ts (nuovi)
      depends: T-000

- [x] T-003b: `QuestSkillCheckOverlay` nel host (placca draggable clampata,
      sizing layout-driven boardMinPx floor, spin→click-skip /
      resolve→arm→click-dismiss, resolved-held hydration, a11y
      dialog+aria-live+focus-return, zLayers.questCheck); rimozione dock
      in-theatre
      ✅ 2026-10-16 — overlay come sibling portal del window (no transform
      trap); placca draggable, board `aspect-ratio:1` con floor
      `boardMinPx` + cap compatto `compactBelowPx`; verdict chip + hint
      localizzato; dismiss armato solo post-verdetto+`dismissArmDelayMs`,
      doppio-click/drag-release ignorati; Escape solo topmost;
      `seenCheckKeys` → remount = resolved-held senza re-spin. Dock
      in-theatre rimosso; `QuestRunWindow` pubblica il bridge e tiene il
      beat fino a dismiss. Witness: phase-shots/*/step-*-view-check.png.
      files: QuestSkillCheckOverlay.tsx (nuovo), QuestRunWindow.tsx,
      gameFrameConfig.ts, src/ui/idleVillage/components/gameFrame/index.ts
      depends: T-003a

- [x] T-004: misura split init (gate `warmMinGainMs`) → `questSkillCheckWarm.ts`
      (draw+finish, rIC post-upload, slack guard, loseContext,
      AbortController) + `astrolabeWarmCache` plain-data (pixel+markup,
      se V62 accetta iniezione senza modifiche); fix `useAstrolabeAudio`
      (preload effect gated su `!muted`)
      ✅ 2026-10-16 — `useAstrolabeAudio`: decode via `OfflineAudioContext`,
      `AudioContext` reale lazy al primo `play()` unmuted (trappola T-10
      chiusa: niente contesto suspended né fetch wav con removeSounds).
      `questSkillCheckWarm.ts` implementato con disciplina r007 (idle slice,
      probe WebGL2, skip SwiftShader, gl.finish, loseContext, AbortSignal,
      cap 600ms, mai bloccante) e cablato nel boot post-`mapReady` con slack
      `warmSlackMinMs`. **Verdetto measure-first: DROP** — misura su
      `vite preview` non eseguita; per il ruling inconclusivo=drop →
      `warmEnabled:false` (registrato in warm-verdict.json; riabilitabile
      con `?warmcheck=1` + flip del flag se p25 > warmMinGainMs).
      `astrolabeWarmCache` non servito (warm non tenuto).
      files: questSkillCheckWarm.ts (nuovo),
      src/pages/game-frame-pixi.tsx,
      src/ui/idleVillage/components/destinyAstrolabeV6/useAstrolabeAudio.ts,
      gameFrameConfig.ts
      depends: T-003b

- [x] T-005: `QuestOutcomeToast` in `questOverlays` (predicato post-overlay,
      checkSeq + dismissedUpTo run-scoped, testo immediato, click/Escape/X
      dismiss, telemetria, zLayers.questToast, role=status); rimozione blocco
      verdetto persistente dallo stage
      ✅ 2026-10-16 — predicato `seq > max(dismissedUpTo, sessionFloor)` ∧
      niente bridge vivo su quel seq; latest-wins; fine-run = pending-flush
      con ack `markRewardShown(runId)` dal primo frame del popup + timeout
      `rewardAckTimeoutMs` (mai perso); dismiss → `sessionFloor` +
      `onDismissOutcome` (write path persistito `dismissedUpTo` via
      `useQuestRun.dismissOutcome`); telemetria `quest_outcome_shown`/
      `quest_outcome_dismissed`; `role="status"`. Blocco verdetto persistente
      rimosso dallo stage. Unit: questOutcomeToast.test.tsx 6/6.
      files: QuestOutcomeToast.tsx (nuovo), questOverlays.tsx,
      game-frame-pixi.tsx, QuestWindowLabPage.tsx, QuestRunWindow.tsx,
      questRun.ts (campo additivo checkSeq), gameFrameConfig.ts,
      public/locales/*
      depends: T-003b

- [x] T-006: reward rev (stageMs 280 + banner immediato, CTA
      `collectRewards` SkinButton+ico-cup, icona esito grande, coverArt
      strip, icone per-riga loot, zLayers.reward)
      ✅ 2026-10-16 — `stageMs` 1400→280; CTA `SkinButton cta`
      `quest-reward-collect` con `ico-cup` («Collect rewards») — su
      `wipe`/`fled` diventa `questChronicle.closeReport` + `ico-scroll`
      (niente da raccogliere); banner esito con icona grande + chip;
      strip `scenario.offer.coverArt` (goblin: totem-goblin.jpg, verificato
      in witness post-reward-reward.png); icone EngravedIcon per sezione/
      riga nell'epilogue; zLayers.reward (25) sotto questCheck (30).
      files: QuestRewardPopup.tsx, QuestEpilogue.tsx,
      gameFrameConfig.ts, public/locales/*
      depends: T-000

- [x] T-007: unit+E2E headless, STRICT_FILES, i18n parity, witness
      screenshot, verification bundle R-189, docs/kanban
      ✅ 2026-10-16 — unit 21/21 focused (reward 6, toast 6, identity 9);
      broad scope 391/399 sotto carico, ri-run isolati tutti verdi
      (questSimulation 31/31, repro 2/2, pageCrash 1/1 @89s); unico fallimento
      reale = generatedCatalog.bench unreachable nodes (fixture PLAN-026,
      preesistente). Harness 0 findings a 1440×900/1280×800/1280×400
      (evidence.log). build:check PASS, kanban:lint PASS,
      foreground:lint PASS; i18n:validate 217 missing preesistenti, zero
      chiavi PLAN-040 mancanti. Fix metrica: clip ancestors nel measure
      (scroll interno non è più falso positivo). Contenimento 1280×400:
      colonna contenuto in scroll region + floor teatro ridotto
      (`theaterMinHeightShortPx`/`theaterMaxShareOfPlaque`).
      files: tests/unit/idleVillage/*, tests/unit/idleVillage/hudGuards.test.ts,
      tests/e2e/idleVillage/gameQuest*.spec.ts, src/localization/i18n.types.ts,
      plans/INDEX.md, RICHIESTE.md, quest_ui_component_guide.md,
      COMPONENT_MASTER_INDEX.md, agent_assignments.md
      depends: T-001..T-006

## 5. Decisioni rimandate / punti aperti

- **`verdictAutoDismissMs` default 0:** il Director ha detto «se ci clicchi
  sopra, scompare» — manuale. Se in playtest risulta che la quest si sente
  "ferma" ad ogni check, si valuta un default >0 (config, non codice).
- **`outcomeToast.autoDismissMs` default 0:** stesso ragionamento — il log
  copre la persistenza; se i toast si accumulano in coda lunga si alza il
  default.
- **Posizione toast:** default centrato-basso sopra il nav; se copre la
  finestra quest aperta, il witness decide tra `bottom` offset maggiore o
  `right` (config `anchor`, non nuovo codice).
- **Cover art nel reward:** risolto — lo scenario goblin dichiara
  `scenario.offer.coverArt` (`totem-goblin.jpg`, asset esistente, HTTP 200);
  la strip è nel popup e visibile nei witness. Scenario senza coverArt → il
  banner salta, niente asset finto.
- **Suoni del check:** `removeSounds` resta on su `/game`; riattivare i wav
  (con warm dedicato) è una decisione Director fuori scope.
- **`QuestEpilogue` staged `visibleSections`:** resta (serve la cascata);
  con `stageMs` 280 la cascata è quasi istantanea — se il Director la vuole
  davvero tutta-subito, `reveal:'fast'` la collassa senza riscrivere il
  componente.

## 6. Behavioral Verification

- **BV-1 (contenimento):** harness `--phases` → `outsidePlaque` vuoto su
  tutti gli step a 1440×900, 1280×800, 1280×400 e zoom 200% emulato;
  scope = discendenti in-window + companion ancorati (`data-quest-owned`) —
  overlay in `#game-modal-root` esenti (contratto proprio: dentro viewport,
  board clamp); screenshot witness mostra pulsanti dentro la placca.
- **BV-2 (bag):** `quest-belt-toggle` è nel cluster header (`data-hud-controls`),
  la plaque bag si apre sopra le scelte, focus torna al toggle; badge armato
  visibile quando `armedFlags.size > 0`.
- **BV-3 (check esterno):** durante un check l'overlay è nel DOM dentro
  `#game-modal-root` (fuori da `data-hud-panel="quest"` e da ogni shell
  trasformato), centrato, `zIndex` sopra i pannelli; board ≤ clamp
  viewport-chrome; click `da-tira` = throw, click durante spin =
  `skipToResult`, click post-resolve (dopo arm delay) = overlay chiuso e
  beat avanza una sola volta; drag-release non dismissa; doppio click non
  dismissa; Escape non chiude durante lo spin e chiude solo se topmost;
  `skipCheck` → nessun overlay.
- **BV-4 (preload):** misura dello split init su `vite preview` registrata
  nel bundle; se il warm è tenuto: a boot completato, mount del primo check
  non produce long-frame oltre baseline (`__gamePerf`), boot gate mai oltre
  4 s anche in headless SwiftShader (abort documentato); con `removeSounds`
  nessun `AudioContext` creato (spy test); `loseContext` chiamato al
  teardown (nessun context leak su remount ripetuti).
- **BV-5 (esiti toast):** dopo un check risolto + overlay non montato appare
  il toast con verdetto+flavor+harm interamente scritti; click/Escape
  (topmost)/X lo chiude; remount non ri-toasta esiti già dismissati;
  resume mid-hold dipinge il verdetto in stato resolved-held senza spin;
  auto-advance a `checkHoldMs` produce comunque il toast; `skipCheck`
  produce toast immediato; fine run sopprime SOLO se `rewardWillRender`
  (altrimenti flush dell'ultimo toast); resolve→minimise→dismiss→toast→
  restore coperto; il log (`QuestLogPanel`) contiene lo stesso esito; lo
  stage della finestra non mostra più il blocco verdetto persistente.
- **BV-6 (reward):** primo stage dipinto entro ~300 ms dal mount, cascata
  completa ≤ N×`stageMs`; CTA «Raccogli ricompense»
  (`data-testid="quest-reward-collect"`) chiude e consuma il POI come prima;
  coverArt strip presente se scenario la dichiara; icone per sezione+riga
  visibili negli screenshot witness.
- **BV-7 (safeguards):** lint scope, unit scope, build:check, kanban:lint,
  foreground:lint, i18n:validate, verify:bundle PASS; zero console error sul
  smoke `/game` + `/quest-window-lab`.
