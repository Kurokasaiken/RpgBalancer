---
title: Recurring Traps
type: preflight-checklist
updated: 2026-10-21
---

# Recurring Traps — regole preventive lette in pre-flight

Regole per errori **ricorrenti** (≥2 istanze documentate). Non un registro:
questo file esiste per essere *letto al momento del lavoro* — `mw-executor` e
`mw-planner` lo consultano nel pre-flight quando il task tocca una superficie
taggata nella tabella sotto.

Una trappola entra qui solo dopo ≥2 istanze documentate in `.mw/bugs/`,
`.mw/observation.jsonl` o `.mw/runs/*/pattern-candidate.md` (soglia `learn`).
Un caso singolo resta un pattern-candidate: non viene promosso.

## Indice per superficie

| Se il task tocca… | leggi |
|---|---|
| `PixiWorldMap`, `refit`, `floorZoom`, `seaMargin*`, layout `/game`, HUD su mappa | T-01 |
| archi SVG progressivi, `stroke-dasharray`, `strokeLinecap`, halo/timer radiali | T-02 |
| `data-hud-controls`, `skin-scope`, dropdown/popover/menu su `/game` | T-03 |
| claim percettivi ("si vede", "è percepibile"), verifica di animazioni/effetti | T-04 |
| "migliora X" / "fixa X" su componente coperto da desiderata FROZEN o workflow canonico | T-05 |
| sintesi, spec o mappe prodotte sopra ledger/requisiti atomici | T-06 |
| derivati visuali legati a un'entità sorgente (ombre, halo, countdown) | T-07 |
| `verification.json`, `produceBundle`, `closure:lint`, probe Playwright/`build:check` mentre girano sessioni parallele | T-13 |
| driver E2E/test unitari dopo un piano che sposta testid, hook, timing o archi del grafo | T-14 |
| `page.evaluate`, helper Playwright condivisi, script lanciati via tsx | T-15 |
| `<select>`/`<button>` nativi dentro pill `data-hud-controls`, hit-area, click "che non fa nulla" | T-21 |
| misura di latenza/percezione, verde E2E con sintomo ancora presente, preview vs dev server | T-22 |

---

## T-01 — Coverage-floor vs content-fit: pinna il bordo protetto, non allargare il mare

**Surface:** layout `/game`, `PixiWorldMap.refit()`, `floorZoom`, `seaMarginPx`/`seaMarginYPx`, chrome HUD (nav plinth, placca giorno).

- **Cosa succede:** la mappa diventa troppo grande e la terra scivola sotto
  l'HUD. Il fix "aumenta il mare" abbassa `floorZoom` e **sposta solo la
  soglia** del conflitto — esiste sempre una finestra viewport che rompe — e
  le bande di mare aggiunte producono cuciture visibili tra texture vecchia e
  nuova.
- **Istanze:** fix margini `8254e8e1` (260/300→700/400: spostò la soglia, non
  risolse); `.mw/bugs/2026-10-10-game-island-under-hud/` (fix strutturale: pin
  del bordo sud sull'area libera quando `landH > freeH`); segnalazione Director
  2026-10-11 (ricorrenza + "linee tra il mare vecchio e quello nuovo").
- **Regola:** quando il floor di copertura (mare a tutto schermo) e il fit del
  contenuto (terra nell'area libera) confliggono, **pinna il bordo che il
  design protegge** (isola poggiata sopra il nav); l'eccesso va dalla parte non
  protetta. MAI risolvere allargando la decorazione: sposta la soglia e aggiunge
  artefatti.
- **Risoluzione (R-148, `.mw/bugs/2026-10-11-game-map-fit-seams/`):** il floor
  vinceva su tutti i viewport larghi/bassi e stretti. Fix: i margini sono
  diventati la *portata* del mare aperto (`3600/1800`), oltre la quale lo shader
  è già nebbia piatta → il floor scende sotto il fit a tutti i viewport target;
  `SEA_QUAD_PAD` estende i quad mare oltre i bound di pan → il bordo quad non
  raggiunge mai lo schermo (causa probabile delle "linee": sliver dello stage
  `#489397`, più chiaro del mare profondo, quando il pan clappava il bordo quad
  esattamente sul bordo schermo; la rottura di texture alla riga dipinto↔generato
  resta morbida — profilo RGB continuo, verificato). `cameraConfig.minZoom`
  (0.18, prima ignorato) ora vale solo sullo zoom-out utente; il recenter resetta
  `userMoved` così i resize rifanno il fit. Contratto e misura:
  `src/docs/docs/design/game_map_fit_contract.md`.

## T-02 — Arco progressivo da 0 + `strokeLinecap="round"` = punto alle 12

**Surface:** halo, timer radiali, gauge: `stroke-dasharray`, `stroke-dashoffset`, `strokeLinecap`, `sealProgress`, `LiquidHalo`, `MagicCircleHalo`.

- **Cosa succede:** un arco la cui lunghezza è pilotata dal progresso e parte
  da 0, con cap tondo, disegna un puntino/bolla all'inizio dell'arco anche a
  progresso zero — non appartiene al disegno e la gravità cresce con
  `strokeWidth`.
- **Istanze:** `DayNightPoiSkin` + `HaloProgressComponent` (2026-08-15),
  `GenericPoiSkin` + `MagicCircleHalo` (2026-08-15), **reintrodotto** in
  `PoiMatericV4` (2026-08-28) dopo due registrazioni — il caso che dimostra
  perché questo file esiste.
- **Regola:** nessun `strokeLinecap="round"` su archi che possono avere
  lunghezza 0; clamp del cap o soglia minima di visibilità. Verifica a
  progresso 0, non solo a progresso pieno.

## T-03 — Scope CSS a discendenti: il bordo è invisibile finché non apri una seconda superficie

**Surface:** `data-hud-controls`, `skin-scope`, `SkinScope`, dropdown, popover, portal, submenu su `/game`.

- **Cosa succede:** il trigger sta dentro lo scope e sembra giusto; gli elementi
  di una seconda superficie (dropdown, popover, portal) restano **fuori** dallo
  scope ed ereditano il default (es. voci menu come barre bronze-CTA invece di
  pill 26px). Nessun errore: solo look sbagliato, invisibile finché la
  superficie non si apre.
- **Istanze:** icona+testo nudo schiacciato a 26px (`:has(> svg:only-child)`);
  dropdown di `HudGameMenu` fuori scope (R-138, 2026-10-11). Regola già
  promossa in `hud_component_guide.md` §5.
- **Regola:** lo scope va sul **root del componente** e copre ogni superficie
  che il componente apre (dropdown/popover/portal). Test: `menu.closest('[data-hud-controls]')` non-null.

## T-04 — Claim percettivi: verifica a occhio nel browser reale, non solo a metrica

**Surface:** animazioni, effetti visivi, "si vede / non si vede", diff pixel, `readPixels`, screenshot-based acceptance.

- **Cosa succede:** la metrica misura la cosa sbagliata (deriva accumulata
  invece di velocità di cambiamento; settle-time non escluso; nuvole contate
  come mare) e l'occhio del Director la contraddice — quattro tentativi sul
  mare respinti prima di trovare la forma giusta.
- **Istanze:** saga moto del mare R-056 (metrica errata in 3 modi, *"l'ho detto
  due volte e mi sono sbagliato"*); correzione Director 2026-09-10: *"prima di
  dire che hai finito devi vederlo tu a schermo se è percepibile da occhio
  umano"*; animazioni non osservabili in browser pane con `document.hidden`
  (rAF bloccato); invasione `/game` 2026-10-13/14: «funziona» dichiarato da
  sole misure di posizione in un pane nascosto, il video del Director mostra 5
  difetti (`.mw/bugs/20261014-verification-false-pass/bug.md`; proposta P-001).
- **Regola:** un claim percettivo si chiude solo con verifica a occhio in un
  browser reale e viewport realistico. La metrica è supporto, non verdetto. Se
  metrica e occhio divergono, crede l'occhio — e la metrica va corretta prima
  di riusarla.

## T-05 — "Migliora X" ≠ "riscrivi X": la desiderata decide lo scope

**Surface:** task worded come improve/fix/polish su componente con desiderata FROZEN, frozen kit, o workflow canonico (mockup→componente, spec-driven).

- **Cosa succede:** l'istinto "serve una riscrittura" parte senza leggere la
  desiderata: 3000+ LOC di fork (V1→V5) scoperti solo a metà; oppure si genera
  fuori dal workflow canonico (mockup senza spec → R-024 ha dovuto aggiungere
  il gate `--enforce-canon`); oppure si "copia" un esempio invece di seguire il
  linguaggio di design (bocciatura Director 2026-09-21: *"ti avevo dato un
  esempio, hai fatto una copia"*).
- **Istanze:** `.mw/pattern-big-rewrite-without-authority.md` (2026-08-17);
  R-024 enforce-canon (mockup fuori workflow); R-012 V4 "inguardabile" fuori
  foundation recipe.
- **Regola:** prima di codare, grep della desiderata FROZEN sul nome del
  componente — una frase di scope. Se l'istinto è "rewrite" e la desiderata
  non lo approva: fermarsi e chiedere ("patch o revisione desiderata?"). Se
  esiste un workflow canonico per quell'artefatto, si passa da lì. Max ~200
  LOC prima della prima verifica nel browser.

## T-06 — Sintesi sopra un ledger: coverage check per-ID alla scrittura

**Surface:** mappe, spec, riassunti strutturati prodotti sopra Extraction Ledger, RICHIESTE, liste di requisiti o contratti enumerati.

- **Cosa succede:** riorganizzando un ledger atomico per un'altra chiave
  (meccanica, fase, componente), i dettagli senza slot nello schema di
  destinazione diventano orfani e cadono in silenzio — ~20% di perdita
  misurata (18 ledger → 12 schede). Ogni passaggio di sintesi senza invariante
  perde risoluzione.
- **Istanze:** `.mw/runs/20261007-learn-coverage-invariant/` (NARRATIVE §5);
  `KNOWLEDGE_INVENTORY.md` con 648 file "pending canonical review" mai
  rivisti; `KNOWLEDGE_CONFLICTS.md` falso negativo su conflitti reali
  (`KNOWLEDGE_AUDIT.md` §C).
- **Regola:** ogni ID sorgente ha uno sbarco esplicito o un motivo di
  esclusione scritto — **alla scrittura**, non a verifica richiesta. La copertura
  si dimostra per-ID, non a impressione.

## T-07 — Derivati visuali: lifecycle e progresso dal proprietario, mai da una simulazione parallela

**Surface:** ombre, halo, countdown, anelli di stato legati a entità sorgente (nuvole, offerte quest, POI).

- **Cosa succede:** un derivato animato da un loop indipendente perde la
  corrispondenza con la sorgente (ombre orfane al 100%, invisibili sulla
  terra) o inverte il contratto (halo countdown che si riempie in senso
  orario invece di scaricarsi antiorario).
- **Istanze:** `.mw/bugs/2026-10-10-game-cloud-shadows/` (ombra creata nel
  factory della nuvola, stesso `t0`/progress/envelope); `.mw/bugs/2026-10-10-game-poi-halo-state/`
  (stato semantico vs progress numerico — `mapQuestPoiView` unico punto di
  coerenza).
- **Regola:** il derivato nasce dentro il proprietario, condivide
  lifecycle/progress normalizzato, muore con esso. Stati semantici del
  contratto (`available`/`expiring`…) si mappano nel view-model, non passando
  progress numerico a casaccio.

## T-08 — Per-tick re-render su superfici con orologio: stabilizzare le reference, non patchare i figli

**Surface:** componenti sotto un clock che ticca (`currentTick` in Zustand): marker mappa, HUD, overlay animati.

- **Cosa succede:** un memo/derivato keyed su un oggetto ricostruito a ogni
  tick (`useCallback` dep su `currentTick`, sessione che embeda l'intero
  store, callback non memoizzati passati ai figli) annulla ogni
  ottimizzazione a valle: il subtree ri-renderizza a frequenza tick anche se
  nessun valore visibile è cambiato. Le mutazioni DOM per render restano
  ~50 sul medallion POI; misurare solo i longtask non basta.
- **Istanze:** PLAN-034 T-002/T-004 — `poiView` instabile per `gameplay`
  (intero store) e `onOpenRun` non memoizzato; `anchors` memo con dep su
  `session`/`currentTick` non usati nel corpo.
- **Regola:** traccia la catena di identità referenziale dalla sorgente del
  tick fino alla foglia pesante. Throttle/quantize il VALORE alla sorgente
  (`useThrottledValue` + quantize alla risoluzione visiva, es. step-lettere
  del sigillo), e rendi stabile ogni prop intermedio — una sola callback
  non memoizzata in mezzo rompe tutto.

## T-09 — Verifica perf su dev server ≠ perf del gioco: misura su build di produzione prima di ottimizzare

**Surface:** qualsiasi misura di frame time, longtask, CPU su `vite dev` / React dev-mode.

- **Cosa succede:** `react_jsx-dev-runtime` (validazione props/key per
  elemento) pesa 25–30% della CPU con UI attiva e produce longtask ogni
  ~300 ms; la stessa scena su `vite preview` crolla (quest run ×4: 37 → 11
  longtask, max 191 → 104 ms). Ottimizzare sulla base dei numeri dev
  rischia di rincorrere overhead che in produzione non esiste.
- **Istanze:** PLAN-034 diag3–6 vs diag-prod (2026-10-14): invasione/quest/
  pan/menu tutti puliti in prod.
- **Regola:** prima di pianificare un fix perf, rifai la misura su
  `npm run build && npx vite preview`. Se il problema sparisce lì, il fix è
  "registra/testa sulla build di produzione", non codice. Vale anche per le
  catture trailer/screenshot ufficiali.

## T-10 — `new AudioContext()` è una syscall pesante: mai dentro un'animazione

**Surface:** SFX procedurale (WebAudio) dentro handler/timer di animazione.

- **Cosa succede:** il costruttore `AudioContext` blocca il main thread
  (~1 s misurato, CDP self-time) — `playThud` al landing dello sticker era il
  mega-hitch 0.8–1.2 s della sequenza invasione.
- **Istanze:** PLAN-034 T-008 — `WorldSurfaceEventCard` peel→land.
- **Regola:** il context si crea UNA volta nel warm-up della superficie
  (idle callback / mount) e si `resume()` dentro il gesto utente (autoplay
  policy); il handler di animazione usa solo il context condiviso.

## T-11 — `i18next-icu` è app-wide: le chiavi `{{var}}` renderizzano letterali

**Surface:** qualsiasi chiave i18n con interpolazione (`idleVillage.json`,
`common.json`).

- **Cosa succede:** il progetto registra `i18next-icu` globalmente
  (`src/localization/i18n.ts`). La sintassi mustache `{{n}}` è malformata
  sotto ICU → la stringa renderizza letteralmente (`"Lv {{n}}"` invece di
  `"Lv 4"`). Sintassi corretta: `{n}` singolo. Nessun errore in console:
  il testo grezzo passa silenzioso — lo trovi solo a runtime/by-eye.
- **Istanze:** PLAN-032 SP-5 (2026-10-14) — spec r009 indicava `{{n}}`,
  smoke headed ha mostrato `Lv {{n}}` letterale; corretto a `{n}`.
  **R-193 (2026-10-14): audit+fix batch CHIUSO** — 27 placeholder
  `{{var}}`→`{var}` ×3 locale (en/it-IT/pseudo idleVillage), `missingCount`
  common en+pseudo, `{{count}` dentro plural ICU → `#` (de slotFreed/
  workerAssigned, swordCount ×4), defaultValue in design-vs-fidelity,
  mirror i18n.types.ts. Guard regression: `tests/i18n/icuInterpolation.test.ts`
  (zero `{{` in tutti i JSON + interpolazione reale via i18next+ICU).
- **Regola:** chiavi nuove → sempre `{var}` ICU. Quando una spec/artifact
  indica `{{var}}`, correggi e documenta la divergenza nel plan. Dentro un
  `plural` ICU il count si scrive `#`, non `{count}`.

## T-12 — `import.meta.env` non esiste fuori da Vite: il gate dev/prod va difensivo

**Surface:** config module in `src/balancing/config/**` importati da test
vitest/tsx o script node.

- **Cosa succede:** `import.meta.env` è `undefined` fuori dal bundler Vite
  (tsx diretto, alcuni setup vitest). Un accesso `import.meta.env.PROD` in
  top-level di un config fa throw a module-eval → tutti gli export
  risultano `undefined` nei test con errore criptico a valle.
- **Istanze:** PLAN-032 SP-5 (2026-10-14) — `heroLevelConfig.ts` export
  `undefined` in vitest; fix `const viteEnv = (import.meta as {env?:{PROD?:boolean}}).env`
  e gate `viteEnv?.PROD === true` (strict-throw come default sicuro).
- **Regola:** mai accesso diretto a `import.meta.env.X` in top-level di
  moduli consumati dai test: optional-chain + default al ramo sicuro
  (strict/dev). Il salvage permissivo solo se `PROD === true` esplicito.

## T-13 — Sessioni parallele sul worktree: lo stato condiviso rompe le prove, non il codice

**Surface:** `.mw/runs/*/verification.json`+`command-logs`, `closure:lint`,
probe Playwright, `build:check`, dev server — quando un'altra sessione lavora
sullo stesso worktree.

- **Cosa succede:** i failure non sono nel tuo scope: `verifier.json` scritto
  da una sessione estranea nella tua run dir (hash stantii → BLOCKED);
  `closure:lint` rosso su righe/bundle a metà scrittura altrui
  (`bundle.json non leggibile`); artefatti riscritti post-bundle → FORGED;
  dev server killato (`ERR_CONNECTION_REFUSED`) o HMR full-reload da edit
  altrui → `Execution context destroyed` e hook
  `__idleVillageTestHooks` transientemente `undefined` nella probe;
  `build:check` timeout a 180s sotto carico condiviso.
- **Istanze:** R-196 (verifier estraneo, safeguards.log FORGED) · R-198/PLAN-035/R-202
  (kanban su bundle a metà) · R-199 (2 probe failure HMR + dev server down +
  build timeout). `.mw/runs/learn-r199-20261016-092815/pattern-candidate.md`
  §A, `PROPOSALS.md` P-002.
- **Regola:**
  1. Prima `ls -la`: mtime recente + autore diverso = collisione →
     **riprova**, non fixare (la sessione proprietaria chiude da sé).
  2. Non scrivere nelle run dir/righe kanban altrui; hash drift →
     `produceBundle --no-exec` (ri-valuta, non riesegue).
  3. Probe: flusso in retry+reload con resume su stato persistito
     (`getRun()` esiste → salta launch), selettori-unione (`window` OR
     `popup`), guard `?.` su hook durante HMR.
  4. Nessun commit scoped su worktree condiviso: catturerebbe lavoro altrui.


## T-14 — Driver e prove contro un contratto mobile: selettori, timing e archi del grafo mentono in silenzio

**Surface:** driver E2E (`tests/e2e/**`), test di copertura grafo/predicati
statici (`*.bench.test`, `reachableFrom`), dopo ogni piano che sposta
testid, hook, timing engine o tipi di transizione.

- **Cosa succede:** il contratto evolve (rev UI, gate engine, nuovo tipo di
  arco) ma la prova resta sulla versione precedente. Il fallimento sembra
  un bug di prodotto: selettore morto → `checkHoldMs` 45s di attesa invece
  di errore chiaro; `readyAt` ignorato → comandi rifiutati in silenzio;
  `reachableFrom` su 2 archi di 4 → 22 nodi "orfani" che l'engine
  attraversa normalmente.
- **Istanze:** R-199 (`readyAt` → 5 file di test rotti) · PLAN-040 T-003
  (astrolabe `quest-check-astrolabe` → `quest-check-overlay` in
  `#game-modal-root`, testid morti) · PLAN-040 chiusura
  (`generatedCatalog.bench`: mancavano `node.next` e
  `combat.nextCleared`/`nextSurvivors` in `edgesOf`).
  `PROPOSALS.md` P-003 (approvata Director 2026-10-16).
- **Regola:**
  1. Dopo un atterraggio parallelo, grep dei selettori/hook/edge-type
     usati dal driver vs `src/`: match zero = contratto cambiato, non
     bug di prodotto.
  2. Driver su affordance **semantiche e version-tolleranti** (`.da-tira`,
     `aria-label`, `data-drop-state`, hook `getRun`) con fallback, non su
     testid posizionali di una singola rev.
  3. Il driver deve fallire diagnostico in secondi, non attendere la
     guardia: asserire "il controllo atteso esiste" prima del loop.
  4. Predicato statico di grafo: enumera TUTTI i tipi di arco che
     l'engine segue (`options.next`, `verdictTable.goto`, `node.next`,
     `combat.nextCleared`/`nextSurvivors`); un nuovo tipo di transizione
     → aggiornare la prova nello stesso commit.

## T-15 — `page.evaluate(fn)` sotto tsx/esbuild: la closure non esiste nel browser

**Surface:** script Playwright/Puppeteer lanciati via `tsx` (`scripts/**`,
helper condivisi come `scripts/verification/attestEnv.ts`).

- **Cosa succede:** `page.evaluate(fn)` con una **funzione** compila sotto
  tsx/esbuild con l'helper `__name` (keepNames), che non esiste nel
  contesto pagina → `ReferenceError: __name is not defined`. In un
  `.catch()` muto diventa un dato nullo silenzioso (`env: null`,
  `samples: []`) che esplode solo a valle (INVALID_ENV nel bundle).
- **Istanze:** `quest-theatre-playtest.ts` (nota inline già presente) ·
  `attestEnv.ts` importato dal harness PLAN-040 → 5 obbligazioni
  INVALID_ENV finché convertito a string-evaluate.
  `PROPOSALS.md` P-004 (approvata Director 2026-10-16).
- **Regola:**
  1. `page.evaluate` riceve solo **sorgenti stringa** (`page.evaluate(SRC)`),
     mai closure — vale per ogni runner (tsx, vitest, node).
  2. Un probe/attestato fallito deve fallire rumoroso: niente
     `env: null` che scorre fino al gate.
  3. In pre-flight su uno script evaluate: grep `page.evaluate(` con
     argomento funzione → convertire a stringa prima di fidarsi.

## T-16 — `z-index` non esce da uno stacking context antenato: gli overlay vanno portaled a `document.body`

**Surface:** overlay/ghost di drag, tooltip, layer "sopra tutto" dentro
pannelli `fixed`/`absolute` con `z-index` proprio (`/game` Game Frame,
planner quest, HudPlaque).

- **Cosa succede:** un overlay con `z-index: 10000` viene dipinto **sotto**
  un pannello a `z-index: 12` perché un antenato dell'overlay ha
  `position` + `z-index` non-auto → forma uno stacking context e lo
  z-index locale vale solo al suo interno. Aumentare il valore non serve.
- **Istanza:** `CustomDragOverlay` (run
  `.mw/runs/20261018-quest-planner-drag-feedback/`) — ghost del medaglione
  spariva sotto la colonna Forecast malgrado `z-index: 10000`.
- **Regola:**
  1. Diagnosi prima del fix: walk `parentElement` cercando il primo
     antenato con `position !== static` + `z-index !== auto` —
     quello è il soffitto, non il valore dell'overlay.
  2. Fix = `createPortal(..., document.body)`, mai alzare lo z-index.
  3. Assert unit: l'antenato del nodo overlay deve essere `document.body`.

## T-17 — Dev server Vite serve transform cache stale: il disco è corretto, il modulo servito no

**Surface:** dev server Vite (`localhost:5173`) dopo edit ravvicinati o
edit concorrenti di altri agenti sullo stesso file (T-13).

- **Cosa succede:** il file su disco contiene la modifica, ma
  `curl http://localhost:5173/src/<file>` restituisce il modulo
  **precedente**: route nuove assenti, schemi/default vecchi, boot rotti
  su file ormai coerenti. La transform cache invalida sul save parziale
  e non riprende il secondo.
- **Istanze:** `App.tsx` senza il blocco route `/bezel-variants` nel
  modulo servito · `gameFrameConfig.ts` stale dopo mid-edit altrui
  (run `20261018-quest-planner-drag-feedback`). Correlato:
  `stale-preview-bundle` in observation (variante dist-playwright).
- **Regola:**
  1. Prima di diagnosticare "la modifica non ha effetto": `curl` il
     modulo servito e grep del literal atteso — confrontare modulo
     servito vs sorgente, non fidarsi del disco.
  2. Fix = `touch <file>` (o restart dev server); poi ri-testare.
  3. Mai cercare il bug nel proprio codice quando disco e servito
     divergono: è cache, non logica.

## T-18 — `cmd | tail` in un manifest/command: l'exit code è quello di tail, non di cmd

**Surface:** `verification.json` obligations, produceBundle, qualsiasi command
in evidenza che viene valutato dal suo exit code.

- **Cosa succede:** `npm run closure:lint 2>&1 | tail -15` esce 0 anche quando
  closure:lint esce 1 — la pipeline ritorna l'exit code dell'ULTIMO comando
  (`tail`, sempre 0). Il command log mostra il FAIL nel testo, il bundle
  valuta PASS: **falso verde silenzioso**, la classe di bug peggiore per un
  sistema di evidence.
- **Istanza:** PLAN-047 run `20261018-plan-047-visual-fork-gate` — primo
  bundle PASS spurio su OB-6b (closure:lint rosso su visual-fork) per la pipe
  nel command; scoperto leggendo il command-log a mano.
- **Regola:**
  1. In un command valutato per exit code: mai terminare con `| tail`/`| head`
    /`| grep` nudi — chiudi con `; exit ${PIPESTATUS[0]}` (bash) o `set -o pipefail`.
  2. In generale: leggi il command-log, non solo il verdetto — il bundle lega
     l'exit code, il log contiene la verità.
  3. Se scrivi un produttore di bundle: preferisci ridirigere su file
     (`> log 2>&1`) invece di pipe — niente mascheramento.

## T-19 — Devin `browser_preview` va registrato sulla ROOT: il proxy path-scoped serve index.html per ogni asset

**Surface:** `browser_preview` / scheda Preview Devin Desktop, visual-fork
preview, qualsiasi app servita via dev server con asset sub-path (Vite ESM).

- **Cosa succede:** `browser_preview(http://localhost:5173/mia-route)` crea
  un proxy che inoltra correttamente solo il documento registrato. Le
  richieste a `/src/*.tsx`, `/@vite/client`, `/assets/*` ricevono la shell
  `index.html` (`content-type: text/html`) → `<script type="module">` fallisce
  → **pagina bianca**, anche in headless. Sintomo ingannevole: la pagina
  renderizza diretta su :5173 ma è bianca nel proxy.
- **Istanza:** bug `.mw/bugs/20261018-devin-preview-white/` (PLAN-047 dry-run).
- **Regola:**
  1. Registra la preview sulla **ROOT del dev server** (`http://localhost:5173`,
     senza path — come dice anche la doc del tool).
  2. Per aprire direttamente una sub-route: redirect-stub (mini-server che
     inoltra tutto all'upstream e risponde `/` con `302 → <route>`); registra
     la preview sullo stub. Implementazione in
     `.mw/bugs/20261018-devin-preview-white/preview-redirect.mjs`.
  3. Verifica: `#root` popolato attraverso il proxy, non solo l'HTTP 200.

## T-20 — `button:has(> svg:only-child)` colpisce anche i pulsanti icona+testo: i nodi testo non contano

**Surface:** qualsiasi `<button>` con icona (`<svg>`/icon component) **e** label testuale
sotto un selettore `:only-child` — in concreto `skinScope.css`
(`[data-hud-controls] button:has(> svg:only-child) { width: var(--skin-hud-control-height) }`).

- **Cosa succede:** `:only-child` considera solo i nodi *elemento* — un `#text`
  non conta. Un pulsante `<EngravedIcon/>{t('label')}` matcha comunque
  `svg:only-child` → viene forzato a quadrato (es. 26px) mentre il testo,
  centrato e `nowrap`, straborda simmetricamente sopra i pulsanti vicini.
  Sintomo: **overlap visivo + hit-region** — `getBoundingClientRect` mostra
  box adiacenti non sovrapposti (26px+26px) ma i click reali a coordinate del
  pulsante di sinistra dispatchano sul pulsante di destra (il testo overflow
  è hittable). `elementsFromPoint` e il hit-test reale di Chrome possono
  divergere: fidarsi del dispatch reale, non del bounding box.
- **Istanza:** PLAN-073/R-240 (2026-10-21) — «il pulsante apri warehouse si
  sovrappone»: `quest-open-stash` e `quest-bag-release-all` erano entrambi
  26px con testo debordante; click su release-all → retarget a open-stash.
  Scambiato inizialmente per race col boot overlay (`game-boot-screen`
  intercettava DAVVERO gli eventi finché `pointer-events` non passa a
  `none` — doppia trappola sovrapposta).
- **Regola:**
  1. Fix a monte preferito: wrappare icona+testo in uno `<span>` dentro il
     button → `svg` non è più `:only-child`, la pill si dimensiona al contenuto.
  2. Non progettare selettori `*:only-child` per discriminare "icona sola":
     in React il testo accanto a un svg è quasi sempre `#text`, invisibile
     al selettore.
  3. Debug: prima escludi gli overlay intercettanti (`elementsFromPoint` al
     punto), poi confronta `getBoundingClientRect` con il **dispatch reale**
     (listener capture su `document`) — se divergono, è overflow centrato
     di un elemento vicino, non il tuo handler.

## T-21 — Controlli nativi dentro un pill `data-hud-controls`: la hit region è il rect dell'elemento, non il pill

**Surface:** `<select>`/`<button>` nativi dentro `<label>`/pill visivi sotto
`data-hud-controls` o qualunque wrapper decorativo — filtro/sort roster,
controlli header.

- **Cosa succede:** il pill *visibile* (~80px) e la regione interattiva reale
  divergono. Un `<select>` dentro `<label>` occupa solo il suo rect nativo:
  cliccare icona/testo forwarda **focus** ma non apre il picker — in Chrome il
  picker si apre solo sul default-action del `mousedown` diretto sulla select.
  Sintomo tipico: «la prima volta non fa nulla, la seconda sì» — in realtà il
  click sull'icona non apre MAI, il secondo capita nella porzione che copre il
  rect nativo. Il meccanismo è lo stesso di T-20 (geometria nativa ≠ chrome
  visivo), superficie speculare: lì il testo straborda la hit region, qui la
  hit region è più piccola del pill.
- **Istanze:** R-238 Bug B (2026-10-21, `.mw/bugs/20261021-game-first-interaction`)
  — pill filtro ~82px, select nativa ~24px a destra: click sull'icona →
  `open:false` in headed; fix = select `position:absolute; inset:0` trasparente
  su tutta la label + replica `aria-hidden` del valore. Sibling: T-20
  (PLAN-073, stesso giorno, stessa famiglia).
- **Regola:**
  1. Se il chrome avvolge un controllo nativo, **allarga il controllo**
     (trasparente, `inset:0`) non il contrario — il gesto diretto raggiunge
     l'elemento reale ovunque sul pill.
  2. Alternativa: `el.showPicker()` su `pointerdown` del wrapper — attenzione
     che resta un path diverso dal gesto nativo.
  3. Headless NON testimonia il picker nativo: `select:open` resta `false`
     anche su una select vanilla via click sintetici — witness headed oppure
     `elementFromPoint` campionato sul pill come proxy geometrico.

## T-22 — La misura percettiva va presa sul runtime che esibisce il sintomo

**Surface:** bug di latenza/percezione ("è lento", "appare in ritardo",
"non si vede"), suite E2E su `vite preview`, probe su dev server — in
generale: verifica su un layer diverso da quello dell'utente.

- **Cosa succede:** la suite E2E gira sul build minificato `vite preview`
  (:5179) ma il Director lavora sul dev server (:5173), dove `jsxDEV`
  (strumentazione React dev, ~5.5 s self-time), source map e `startTransition`
  a bassa priorità costano un fattore **2-3×** sul gesto misurato. Il test è
  verde sull'ambiente sbagliato → il fix sembra sufficiente ma il sintomo
  resta. Stessa famiglia di P-005 (superficie ≠ layer dell'utente: bundle
  stantio, HMR churn, e ora runtime diverso).
- **Istanze:** R-238 Bug A (2026-10-21) — preview 376-431 ms verde, dev
  server 510-732 ms reale; il residuo era il commit React del subtree
  overlay, invisibile alla metrica su preview. Sibling: P-005 (`[swapdbg]`
  su bundle stantio), learn-20261020-2115 A (churn HMR sotto il Director).
- **Regola:**
  1. Per latenza/percezione: diagnosi e signoff sul runtime che esibisce il
     sintomo (dev server se il Director vive lì); il preview build resta il
     runner della suite, non l'ambiente di misura.
  2. Misura l'elemento che l'utente *vede*, non il marker DOM più precoce —
     o fai coincidere i due (stesso `data-debug-*` sul nodo realmente
     visibile, es. il warm-flip).
  3. «Test verde ma il sintomo resta» non è rumore: è il divario di layer —
     confronta gli ambienti (instrumentation, scheduling, build) prima di
     ricalibrare il budget del test.
  4. Corollario tecnico: se il commit React è il collo, il primo paint può
     avvenire via DOM diretto sul subtree warm-mounted con handoff
     `useLayoutEffect` pre-paint (pattern B,
     `.mw/runs/learn-20261021-1404/pattern-candidate.md`).

## T-23 — Striscia collassata di un `HudPlaque`: controllo che non si sposta, click-tail guard, fascia che dipinge dentro

**Surface:** qualunque pannello HUD con stato «ridotto a striscia»
(`HudPlaque shape="hang"` + pulsanti header `data-hud-controls`) —
stash, quest window, roster.

- **Cosa succede:** tre difetti gemelli scoperti insieme (R-251, 2026-10-21):
  1. Se la striscia mostra *solo* il restore, il flex lo spinge al bordo
     destro — nello slot del *close*, ~30 px a destra del minimise che il
     giocatore ha appena premuto. L'icona «si muove»: il secondo click di un
     doppio-click veloce la becca → chiudi-e-riapri.
  2. Tenere il controllo fermo *crea* il problema opposto: il secondo click
     cade sul restore nello stesso punto → toggle accidentale.
  3. La placca dipinge banda+step+highlight ~6-7 px **dentro** la silhouette
     (più i cappelli curvi `hang`): con padding da header (6 px) le pill 26 px
     cavalcano la fascia — «le icone toccano i bordi» anche se sono dentro
     il rect.
- **Istanze:** R-251 — stash minimise 694 → restore 724 (slot close) e pill
  a 6 px dalla fascia; fix misurato restoreX≈minX, inset 8-22 px su tutti i
  lati, screenshot `test-results/r251-strip-insets.png`.
- **Regola:**
  1. La striscia replica il cluster controlli dell'header **negli stessi
     slot** (`[restore][close]`, non `[restore]` solo) **e** l'header espanso
     usa gli stessi content-inset della striscia (R-251 bis: placca 10 +
     riga 12/8 = box 22/18) — il collapse cambia il glifo, mai la geometria
     (dx=0/dy=0 misurato). Attenzione: uno spostamento ~-2px misurato sul
     pulsante sotto il cursore è `--skin-btn-hover-lift`, feedback voluto —
     misura col puntatore fuori dal pannello.
  2. Guard temporale sul restore (~350 ms): il secondo click del doppio-click
     è coda, non intento. `Date.now`, non `performance.now` — i fake timers
     di vitest non fregano il secondo.
  3. Inset striscia ≥ profondità fascia + margine: riferimento `10px 18px`
     (+4 px lato icona). Misure sempre su bbox live (T-04), non a occhio.
  4. Regression test: ordine dei bottoni nel cluster + padding della placca
     (asserzione di struttura, non di pixel).

## T-14 — Research prompt = executor-spec (codifica la risposta nella domanda)

Quando il Director chiede ricerca — a provider esterni O dentro il repo/web —
formularla come explorer: domande da rispondere + vincoli, mai la forma del
deliverable né la lista di file da leggere. Cercare anche lo spazio negativo
(cosa manca che dovrebbe esserci) e almeno una smentita prima di concludere.
Checklist obbligatoria: `.mw/contracts/research-prompt-protocol.md` (R-278).

## T-15 — Effetti inventati da zero (non cercare le implementazioni di riferimento)

Prima di implementare un effetto/animazione: cercare come viene fatto nei
progetti reali (skill pubbliche, librerie, reference canvas/pixi, esempi
documentati) e riusare la ricetta — il tumble della foglia
(`scale(cos(spin),1)`) non si inventa, si trova. Il bocciamento delle
leaves v1 (ellissi traslucide) era evitabile con 5 minuti di ricerca.
Vale anche per il routing delle dipendenze: controllare prima se esiste
una libreria matura (es. @pixi/particle-emitter) e valutare se adotta o
se la tecnica si porta sul nostro engine (vincolo: particelle = funzione
pura del clock per i test deterministici).

## T-16 — Prompt consegnati "a memoria del formato" (saltare il preflight di bibbia)

Un brief/prompt per un generatore esterno NON si scrive a memoria del
formato: prima della consegna si riapplica meccanicamente il preflight
`R4bis` di `scene_prompt_authoring_guide.md` — clausola di luminosità
canonica verbatim su ogni scena non-giorno, pigmenti Wanderlust nominati
(ultramarine/cinabro/ambra/verde Veronese, ombre deep teal), cielo azure
vibrante, direzione dell'azione esplicita (chi agisce su chi), kill-list
completa, correlazione archetype×shot×ambient×hooks. Fallimento reale
2026-10-24: brief f2–f6 consegnati senza clausola/pigmenti (output dark)
e f4 con soggetto ambiguo ("a massed charge" letto come i goblin che
attaccano noi, mentre gli eroi caricano VERSO il campo). Il contratto
esisteva già — non era stato eseguito come checklist.

## T-24 — Componente desktop-only: il test a 1280 non prova nulla sotto 768

**Surface:** qualsiasi componente/pannello/nav nuovo su `/game` (PLAN-083).

- **Cosa succede:** il componente viene scritto e verificato a 1280px
  desktop; sotto `mobileFitConfig.breakpointPx` (768) è rotto — clippato,
  irraggiungibile, con azioni solo-hover/tastiera senza equivalente touch.
  Non è mai stato "scoperto mobile", solo non guardato.
- **Istanze:** probe 2026-10-23 su `/game` (`test-results/mobile-probe-
  2026-10-23/`): nav 452px>390px, top HUD clip, quest window 820px,
  hint «Esc/Enter/frecce» senza equivalente, 9/13 target <44px.
- **Regola:** ogni componente `/game` nuovo si verifica a 390×844 touch
  **prima** del «fatta» — target ≥44px, niente azioni solo-hover/tastiera,
  `panelMode` sheet regge, niente magic number (mobileFitConfig). Le regole
  di authoring complete sono in `hud_component_guide.md` §6c; la checklist
  §6.12 punto 11 le rende obbligatorie. Come T-04 impone l'occhio, questa
  impone il viewport.
