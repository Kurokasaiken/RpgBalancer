---
title: 'PLAN-037 — /game: comparsa automatica sfalsata dei POI quest (una ogni 5s, mai scomparse) + goblin `repeatable`'
status: proposed
created: 2026-10-15
request: R-200
desiderata: nessuna nuova — decisione Director in sessione; lifecycle offerta già ratificato (D-S4-6, PLAN-019-S4, 2026-10-10)
related: PLAN-019-S4 (`repeatable` authored + `consumedPoiIds`), PLAN-031 (boot veil — gate `veilGone`), PLAN-034 (anchor ghosts/entrance-exit), R-124 («nessun POI al boot», superata), QUEST_RULES.md (regola 80)
---

# PLAN-037 — Auto-reveal sfalsato delle offerte quest su `/game` + `repeatable` su goblin

**Richiesta (Director, 2026-10-15, verbatim):** *"quando apro la pagina le quest
che abbiamo nel /director della pagina /game devono apparire una ogni 5 secondi
(e nn scomparire mai). Flagga la quest dei goblin come quest ripetibile (ci
dovrebbe essere nella documentazione cosa fa, come funziona, ecc. Il POI nn
sparisce mai, dopo il reward puoi rifarla, ecc)."*

**Documentation Impact:** REQUIRED — `QUEST_RULES.md` (nuova regola, regola
80-quest-rules-maintenance), `quest_sterminio_goblin_spec.md` (fonte unica della
quest: lifecycle POI), `poi_family_spec.md` (nota lifecycle offerta),
`RICHIESTE.md` (R-200), `plans/INDEX.md` (questa riga).

## Stato attuale (FACT)

- `/game` = `src/pages/game-frame-pixi.tsx`. Le offerte quest sono `QUEST_POIS`
  in `src/balancing/config/idleVillage/quests/questPois.ts`: `poi-goblin` e
  `poi-rovine`, entrambe oggi one-shot.
- Reveal attuale: booleano globale `questShown` (default `false`) +
  `poiDemo` → `questRevealed = questShown || poiDemo` gatea **tutti** i marker
  insieme nel memo `anchors` (`if (!questRevealed || (!exp.run &&
  avail?.state === 'expired')) continue;`). Lo pilota il DirectorPanel
  (azione `quest`, «Mostra quest») e il test hook `revealQuestPois`.
- Lifecycle già implementato (PLAN-019-S4 T-3, D-S4-6): `repeatable?: boolean`
  su `QuestPoiSchema`; `poiConsumesOnReportClose`/`isPoiConsumed`; consumo alla
  chiusura del report su run ended+settled via `consumedPoiIds` persistito
  (`CONSUMED_POIS_KEY`, PersistenceService); un `repeatable` ignora anche un
  record consumato stale.
- Entrata/uscita dei marker passa per `anchorsWithGhosts` (mai pop-off; la
  stessa transizione gioca in entrata) — uno stagger di mount produce
  automaticamente le entrate animate.
- `questPoiAvailability` quantizzata (PLAN-034 T-005); `extraEvents` ha la riga
  ledger `quest-open` per goblin gateata su `questRevealed`.
- E2E che asseriscono il vecchio contratto R-124 («nessun POI al boot»):
  `gameQuestExpedition.spec.ts` (~L111), `gameQuestFullFlow.spec.ts` (~L308),
  `gameQuestLifecycle.spec.ts` (~L363). Il reveal da pulsante Director resta il
  percorso usato da `revealQuestPois(page)` in `gameQuestLifecycle`.

## Decisioni (Director, 2026-10-15)

- **D-1 — Solo goblin `repeatable`.** `poi-goblin` guadagna `repeatable: true`:
  il POI non viene mai consumato; chiuso il report la spedizione si sgancia e
  l'offerta torna `available` (già vero: `run.clear()` → `questStatus`
  derivato). `poi-rovine` resta one-shot (D-S4-6).
- **D-2 — «Mai scomparire» = reveal permanente + goblin mai consumato.**
  Nessun cambio alla finestra authored (`SLICE_OFFER_WINDOW_DAYS` = 10.000 gg;
  il path `expired` resta invariato e coperto dai test di `questAvailability`).
- **D-3 — «Mostra quest» diventa trigger one-way «reveal ora».** Forza la
  comparsa immediata di tutti i POI (salta lo stagger); spegnerlo non nasconde
  i POI già rivelati. «Reset» del Director ri-arma lo stagger (replay della
  sequenza per i take).
- **D-4 — Il stagger è wall-clock** (come `eventTheatre.cardDelayMs`), non
  game-tick: è pacing di entrata UI, non tempo di gioco. Valori in config.
- **D-5 — Lo stagger parte quando il boot veil è uscito** (`veilGone`): le
  entrate devono essere visibili (T-04). Un run attivo/persistito mostra il suo
  POI subito, senza aspettare il proprio slot dello stagger (hydration:
  la quest in corso non può risultare nascosta dopo un reload).

## Interpretazione della richiesta

«Le quest che abbiamo nel /director» = le due offerte reali rivelate
dall'azione «Mostra quest» (`questPois` → `MapQuestPoi`). `questRun`
(«Start goblin quest») è un lancio di run, non un'offerta — fuori scope.
`poiDemo` («POI types») monta esemplari finti job/event — fuori scope (R-180:
un marker quest non è mai un demo).

## Task

### T-001 — Config: `questReveal` + `repeatable` su goblin

- `src/balancing/config/idleVillage/gameFrameConfig.ts`: nuovo schema
  `gameFrameQuestRevealSchema` `{ enabled: boolean, initialDelayMs:
  number.nonnegative(), staggerMs: number.positive() }` + sezione `questReveal`
  in `gameFrameConfigSchema`; defaults `enabled: true, initialDelayMs: 1000,
  staggerMs: 5000` (accanto a `eventTheatre` — stessa famiglia di timing
  wall-clock di presentazione).
- `src/balancing/config/idleVillage/quests/questPois.ts`: `repeatable: true` su
  `poi-goblin`.

### T-002 — Pagina: auto-reveal sfalsato in `game-frame-pixi.tsx`

- Nuovo stato `autoRevealedIds: ReadonlySet<string>` (o count → slice di
  `QUEST_POIS` in ordine authored) + `revealCycle` (re-arm per «Reset»).
- `useEffect` su `[veilGone, revealCycle]`, gated su
  `DEFAULT_GAME_FRAME_CONFIG.questReveal.enabled`: per ogni POI i, un
  `setTimeout` a `initialDelayMs + i * staggerMs` che aggiunge `poi.id` al set;
  cleanup dei timer in teardown.
- Gate per-POI nel memo `anchors`:
  `revealed = questShown || poiDemo || autoRevealedIds.has(p.id) || !!exp.run`
  (D-5: il run vivo non attende lo stagger). Filtri `isPoiConsumed` e
  `expired`-senza-run invariati.
- `extraEvents`: la riga `quest-open` (goblin) si attiva quando il POI goblin è
  revealed (stessa condizione del marker).
- Test hook `revealQuestPois` → rivela tutto istantaneamente (mantiene il
  contratto E2E esistente: «la seam che «Mostra quest» pilota»).
- Azione Director `quest`: `onTrigger` → `setQuestShown(true)` (one-way — D-3);
  `active` = tutti i POI rivelati. `onReset` → `setQuestShown(false)`,
  `autoRevealedIds` vuoto, `revealCycle + 1` (replay dello stagger).
- Logica pura in un modulo testabile (guida HUD §6): es.
  `src/ui/idleVillage/components/gameFrame/questRevealSchedule.ts` con
  `questRevealSchedule(pois, { initialDelayMs, staggerMs })` →
  `{ poiId, delayMs }[]` e/o il predicato `isQuestPoiRevealed(…)`. JSDoc su
  ogni export.

### T-003 — Test

- `tests/unit/idleVillage/questOffer.test.ts`: il test lifecycle (~L131) oggi
  asserisce `poi.repeatable` undefined su **entrambi** i POI — aggiornare:
  goblin `repeatable === true` + predicati (mai consumato, ignora record
  stale), rovine one-shot invariato.
- Nuovo unit test per `questRevealSchedule` (ordine authored, delay
  `initial + i*stagger`, deterministico) e per il predicato di reveal (run
  attivo → revealed anche senza stagger).
- E2E — aggiornare i tre assert «count 0 al boot»
  (`gameQuestExpedition` ~L115, `gameQuestFullFlow` ~L308,
  `gameQuestLifecycle` ~L363): il contratto R-124 è superato — le asserzioni
  diventano «nessun marker prima della prima finestra di reveal» oppure
  restano solo informative; la suite lifecycle continua a usare il click
  Director reale (ora «reveal ora», compatibile).
- Nuovo spec `tests/e2e/idleVillage/gameQuestReveal.spec.ts` (headless): boot
  pulito → `[data-map-quest-poi-target]`/`[data-quest-poi-id]` count 0 prima di
  `initialDelayMs`, 1 dopo il primo reveal, 2 dopo `staggerMs`; i marker non
  scompaiono più (count 2 stabile +N s); reload con run attivo → marker subito
  presente (D-5). Timing con tolleranza (stagger esatto verificato dal unit
  test; l'E2E asserisce l'ordine e la permanenza, non i millisecondi).

### T-004 — Documentazione (REQUIRED)

- `QUEST_RULES.md` — nuova RULE §8 (o nuova sezione «Lifecycle offerta POI»):
  one-shot di default (D-S4-6); `repeatable` authored → POI mai consumato,
  riproponibile dopo il reward finché la finestra è aperta; goblin ripetibile,
  rovine one-shot; le offerte compaiono da sole su `/game` a stagger (config
  `questReveal`, una ogni `staggerMs`). STATUS `vigente`. SOURCE: Director
  2026-10-15 (R-200) + D-S4-6.
- `src/docs/docs/idle_village/quest_sterminio_goblin_spec.md` — riga in
  «Parametri globali»: lifecycle POI = ripetibile (mai consumato; dopo il
  reward la quest si rifà).
- `src/docs/docs/idle_village/poi_family_spec.md` — nota lifecycle nella
  sezione quest tier / stati: consumo one-shot vs `repeatable`
  (`consumedPoiIds`, chiusura report ended+settled), auto-reveal a stagger.
- `plans/INDEX.md` — riga PLAN-037.
- `RICHIESTE.md` — R-200 aggiornata a esito.

### T-005 — Safeguards + verifica runtime

- `npm run lint -- <scope>` (120 s), `npm run test -- idleVillage quest`
  (300 s), `npm run build:check` (180 s), `npm run kanban:lint` (30 s).
- Smoke runtime headless su `http://localhost:5173/game` (regola
  16-no-foreground-windows: nessuna finestra in primo piano; Puppeteer/Playwright
  headless o in background): pre-flight `curl /src/main.tsx` = 200 javascript;
  screenshot sequenziali (~+1s / +7s / +13s dall'uscita del veil) come evidence
  in `test-results/plan-037-*/`.
- **T-04:** «le quest compaiono una ogni 5 secondi» è un claim percettivo — si
  chiude solo con verifica a occhio del Director in un browser reale
  (step manuale). Se non verificato, si dichiara non verificato.

## Invarianti / trappole

- Config-first: nessun `5000`/`1000` hardcoded nella pagina — solo
  `DEFAULT_GAME_FRAME_CONFIG.questReveal`.
- Timer wall-clock ≥ 500 ms (invariante): `staggerMs`/`initialDelayMs` ok.
- T-07/T-08: nessun nuovo timer sul tick di gioco; lo stagger usa
  `setTimeout` una tantum, non `setInterval` su `currentTick`.
- Persistenza: nessuna — il reveal è session-state (ogni apertura riproduce
  l'entrata; «quando apro la pagina»). `consumedPoiIds` resta l'unico stato
  persistito del lifecycle (PersistenceService, invariato).
- R-124 superata esplicitamente: «nessun POI al boot» → «le offerte compaiono
  da sole a stagger dopo il veil».
- i18n: nessuna nuova stringa utente (le label Director esistono; se il label
  del bottone cambia, chiave `gameFrame.director.*` in `idleVillage` ns —
  `{var}` ICU, T-11 — + mirror `i18n.types.ts`).

## Open questions

- (chiusa) Solo goblin ripetibile / rovine one-shot — **D-1**.
- (chiusa) Scadenza offerta — **D-2**: finestra 10.000 gg invariata.
- (chiusa) Bottone Director — **D-3**: one-way «reveal ora» + Reset ri-arma lo
  stagger.
- Aperta: ordine delle entrate — default = ordine authored di `QUEST_POIS`
  (goblin → rovine). Se il Director vuole un ordine diverso, è un campo config
  (`order` su `QuestPoiSchema` o sequenza in `questReveal`) — non deciso qui.
- Aperta: se il reveal stagger debba valere anche su altre superfici che
  montano i POI quest (nessuna oggi — solo `/game`).
