# Bozza piano — R-188: fix dei 7 problemi dell'audit trailer (R-187)

Bozza post-deliberazione (2 run: `.mw/runs/20261014-114519/` e
`20261014-120000/` — entrambe 1 ciclo, critiche integrate dove valide).
Evidenza: `test-results/trailer-report-2026-10-14/REPORT.md`.

## Goal

- Eliminare i jank percettibili su `/game` (quest window, map pan, menu open,
  invasion mount): target p95 < 33 ms, 0 frame > 100 ms nei segmenti misurati.
- Bonificare la hub trailer (link canonici `/trailer?scene=<id>`, via le voci
  morte).
- Settlement Lost come trigger dev-only nel DirectorPanel.
- Verifiche residue (R-185.1, 400, hero-lab) senza riscritture (T-05).

## NOT In Scope

- `GameOverService` / trigger canonico day-30 (descoped PLAN-033, confermato Director).
- Route dedicate per `trailer-threat-iter` / `trailer-legacy-v2` (eliminate).
- Rewrite di renderer Pixi / refactor massivo state management (T-05).
- Modifica della marcia `invasion_v1` (comportamento voluto da PLAN-033).
- CI gates, monitoring windows, hook pre-flight nelle skill (critico li
  propone; rifiutati per YAGNI su progetto personale).

## Premesse

- PLAN-032 (scheda PG, magazzino, mercante, consumabili in viaggio, level-up) è
  già *design converged*: il problema 5 non si ri-pianifica, si dispatcha.
- R-185.1 (marker/sticker visibile prima dello stage) è in attesa di decisione
  Director — task bloccato, non decidibile nel piano.
- Trap T-04: i claim percettivi si chiudono solo a occhio in browser reale e
  visibile — il rAF è bloccato quando `document.hidden === true`, quindi le
  misure FPS vanno prese con finestra in primo piano e flag anti-occlusione.
  Metrica = supporto, occhio = verdetto.
- Trap T-05: fix ≠ rewrite. Si patcha dentro i componenti esistenti
  (`QuestRunWindow`, `PixiWorldMap`, `WorldSurfaceEventCard`); nessun refactor
  strutturale non approvato.
- Soglie verificabili: p95 < 33 ms, 0 frame > 100 ms nei segmenti misurati;
  dove oggi siamo a 60 fps, non si regredisce.

## Fase A — diagnostica (sblocca i fix)

- **T-A1 · 400 Bad Request su `/game`** (problema 7a). Re-run headed con
  `page.on('response')` su sequenza completa invasione+quest (headless non lo
  riproduce — verificato: idle e invasion+reveal puliti). Deliverable: URL
  identificato + classificazione (asset, telemetry, vite-dev) + fix o
  "benigno-in-dev" documentato.
- **T-A2 · Profiling quest-window** (problema 1). Chrome/React Profiler durante
  run a ×4: discriminare (a) re-render React (`run.log.map`, `resolved`,
  `previews` ricalcolati ogni tick), (b) lavoro motore quest nel tick, (c)
  entrambi. Deliverable: trace salvata in `.mw/runs/<ts>/quest-jank-*` +
  top-3 cause documentate, prima di qualsiasi fix.
- **T-A3 · Profiling pan/menu** (problema 2). Pan: distinguere sync React↔Pixi
  a pointermove vs lavoro nel ticker Pixi. Menu open: lazy chunk vs layout
  thrashing. Deliverable: trace salvata + cause documentate.
- **T-A4 · Profiling invasion mount** (problema 3a). Trace su shroud→card→peel:
  asset decode vs mount DOM vs ticker. Deliverable: trace + causa documentata.

## Fase B — fix perf (ciascuno gated dalla sua diagnosi)

- **T-B1 · quest-window jank** (da T-A2). Strade candidate: memo dei sub-render
  (log rows, verdict list, party rows), `previews` memo su input stabili, e/o
  render della window disaccoppiato dal tick (il run avanza a fasi discrete —
  non serve re-render continuo). Nessuna sospensione del ticker Pixi senza
  verifica che HUD/clock restino vivi. Target: p95 < 40 ms durante run ×4,
  0 frame > 100 ms + eye-check.
- **T-B2 · map-pan** (da T-A3). Se sync React↔Pixi: posizione camera gestita
  nel container Pixi, stato React aggiornato a pointerup/debounce. Target:
  p95 < 33 ms su pan continuo 10 s.
- **T-B3 · menu-open** (da T-A3). Se lazy chunk → estendere il warm-up dietro
  il veil (pattern già esistente per roster/medaglie). Se layout thrashing →
  rimuovere letture sincrone. Target: p95 < 33 ms su open/close ripetuti.
- **T-B4 · invasion mount hitch** (problema 3a). Non "pre-warm globale"
  (critica c1-3: rischio boot): lazy-batch mirato — decode/off-screen-paint
  degli asset della card nel warm-up già esistente (root 0×0 c'è già) +
  `requestIdleCallback` durante lo shroud (finestra morta di ~1 s prima del
  card delay). Misurare impatto su `__gameBoot.interactiveMs` (non deve
  regredire). Target: 0 frame > 100 ms tra shroud-close e card-visible.
- ~~T-B5 · R-185.1~~ **RISOLTO dal Director** (2026-10-14): il marker a boot da
  `invasion_v1` persistito è il comportamento voluto (PLAN-033); contratto
  documentato in `GAME_INVASION_SEQUENCE.md` §4. Niente da fare.

## Fase C — integrazione superfici

- **T-C1 · Link hub morti** (problema 4). Allineare `SteamTrailerHub` a
  `/trailer?scene=<id>` per le 7 scene (source of truth: `trailerConfig.sceneOrder`).
  **Decisione Director: eliminare** le voci `trailer-threat-iter` e
  `trailer-legacy-v2` dall'hub — niente route dedicate.
  Verifica: Playwright, ogni link → scena corretta montata, no 404
  (critica c1-4: serve E2E, non solo "compila").
- **T-C2 · Dispatch PLAN-032** (problema 5). Conversione dei 5 sub-plan
  converged in spec eseguibili e dispatch. Copre scheda PG (hover→HudPlaque),
  magazzino, mercante, consumabili in viaggio/beat, level-up mock.
- **T-C3 · Settlement Lost su `/game` = pulsante Director** (problema 6).
  **Decisione Director: dev-only trigger, non logica canonica.** Aggiungere un
  pulsante "Settlement Lost" al `DirectorPanel` di `/game` che monta
  l'overlay esistente (quello di `/world-surface`) sopra la mappa — utile per
  registrare il beat "consequence" con footage reale. Nessuna logica day-30,
  nessun game-over: resta descoped come da PLAN-033. Il trigger automatico
  sarà parte del futuro piano difesa.

## Fase D — minori + chiusura

- **T-D1 · hero-components-lab** (7b). Dev-only: lazy ~12 s = cold compile vite
  + chunk grandi. Opzione economica: documentare come noto + prefetch link dal
  test-hub. Non investire in code-splitting fine (YAGNI per un lab).
- **T-D2 · traps registration** (critica c1-2): ogni problema confermato e
  fixato → entry in `context/recurring-traps.md` (es. "jank quest-window a
  ×4", "hitch mount card invasione"). Pattern con ≥2 occorrenze → candidato
  PROPOSALS.md.
- **T-D3 · compliance finale**: checklist T-04/T-05 nel report di chiusura
  (verifica a occhio fatta; nessuna rewrite non autorizzata).

## Behavioral Verification

- Re-run `test-results/trailer-report-2026-10-14/capture2.mjs` (esteso dove
  serve) in finestra visibile: soglie p95 sopra; ogni fix emette un artifact
  JSON `{ segment, avgFps, p50ms, p95ms, worstMs, longFrames50, pass }`
  confrontabile con la baseline `metrics2.json` del 2026-10-14.
- Eye-check headed: invasione completa, quest run a ×4, pan/zoom continuo.
- Hub: tutti i link montano la scena attesa (Playwright).
- DirectorPanel: bottone "Settlement Lost" monta/smonta l'overlay su `/game`.
- Safeguard per ogni task: `npm run lint -- <scope>`, `npm run test -- <scope>`,
  `npm run build:check`, `npm run kanban:lint`.

## Sequenza e dipendenze

T-A1–A3 in parallelo (solo diagnostica) → B1–B4 gated dalle diagnosi →
C1 indipendente → C2 dispatch (blocco più grande, parallelizzabile) →
C3 dopo call Director → D in coda.

## Decisioni del Director (2026-10-14)

1. **R-185.1**: dichiarato **fixato** dal Director — il marker a boot con
   marcia salvata è voluto e documentato. Task rimosso.
2. **T-C3**: settlement-lost = **pulsante del DirectorPanel su `/game`**,
   overlay riusato, niente logica difesa.
3. **T-C1**: varianti `iter`/`v2` → **eliminate dall'hub**.
4. **Deliberazione**: continuare (multi-ciclo).

## Critiche residue della deliberazione (esito)

- c1-1 (fix quest-window non provato) → accolto: fase diagnosi bloccante.
- c1-2 (traps registration) → accolto: T-D2.
- c1-3 (pre-warm globale vs boot) → accolto: T-B4 lazy-batch.
- c1-4 (route fix senza E2E) → accolto: verifica Playwright in T-C1.
- c1-5 (misread T-04 / T-05 non affrontato) → accolto: premesse corrette +
  T-D3. Le proposte `useCriticalTicker`, `GameOverService`, feature-flag per
  PLAN-032 e middleware 400 del critico non entrate: eccedono lo scope
  approvato o sono over-engineering per il problema osservato (YAGNI).
