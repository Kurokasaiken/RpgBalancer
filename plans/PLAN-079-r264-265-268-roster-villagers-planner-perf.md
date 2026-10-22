# PLAN-079 — R-264/R-265/R-268: villager mancanti, rename+portrait, planner responsivo

Stato: in corso (implementazione completata, verifica runtime raccolta)
Richieste: `RICHIESTE.md` R-264, R-265, R-268 — verbatim Director 2026-10-22.
Desiderata: v1 (FROZEN).

visual-fork: skipped — modifiche solo di percorso dati/render (throttle, memo, structural sharing) e wiring asset, nessuna rappresentazione grafica nuova o alterata — PLAN-079 §3 Scope

## 1. Scope

- **R-264 — villager spariti dal roster.** Causa: `isDead: true` nel save
  live (quest `qsi-d99fed19`, ledger `dead:villager-*`); il roster filtra
  `currentHp: 0`. Morte permanente = design FROZEN, non toccata: la
  reintegrazione passa dall'azione Director `reviveDeadResidents`
  (store action + bottone Director panel + i18n + regression test).
- **R-265 — click-assignment scattoso col planner aperto.** Fix render-path:
  forecast Monte Carlo spostata su Web Worker (`questForecast.worker.ts` +
  `estimateForPartyAsync` con abort), `setFlyingResidentId` sotto
  `startTransition`, `React.memo` su `QuestExpeditionDetail`, resolver
  `customValidator`/`dropStateResolver` stabilizzati con `useCallback`,
  `send` legge `currentTick` dallo store (non dalle deps), 4 `console.log`
  con deep-serialization rimossi dal roster bundle, `useThrottledValue` non
  dispatcha se il valore è referenzialmente uguale, `EMPTY_QUEST_RUN_TIME`
  stabile senza run, `useStableValue` (shallow-equal) a monte di
  `questRunTimeView`/`haloView`, `questElapsedTicks` congelato a
  `settledAtTick` per run concluse.
- **R-268 — nomi + ritratti villager.** `villager-mastro-beppe` → **Bertoldo**
  (falegname), `villager-lisetta` → **Lisetta** (invariato), `villager-baldassarre`
  → **Manno** (macellaio). ID interni preservati: `mergeStoreConsequences`
  lega le conseguenze per ID e gli E2E dipendono dagli ID. Portrait
  scaricati (`carpentiere/sarta/macellaio.jpeg`) copiati in
  `src/assets/portraits/` + crop quadrati in `medal/`; `visualProfileId`
  collegato nel seed (`testRosterResidents.ts`, `residentVisuals.ts`);
  `src/assets/portraits/README.md` esteso con la catena
  residente → profilo → asset → medaglia → character sheet.

## 2. File toccati (superfici)

- `src/store/useMinimalGameplay.ts` — `reviveDeadResidents` action.
- `src/pages/game-frame-pixi.tsx` — Director action, `EMPTY_QUEST_RUN_TIME`,
  `questRunTimeEqual`, `useStableValue` su `questRunTimeView`.
- `src/ui/idleVillage/hooks/useThrottledValue.ts` — skip dispatch se
  `Object.is` uguale (nessun cambio visivo).
- `src/ui/idleVillage/quests/useQuestExpeditionSession.tsx` — resolver
  stabili, `send` senza dep su tick, `useStableValue` su halo.
- `src/ui/idleVillage/quests/QuestExpeditionDetail.tsx` — `React.memo`.
- `src/ui/idleVillage/quests/useQuestPoiSession.tsx` — `startTransition` su
  flying.
- `src/ui/idleVillage/questS1Lab/questForecast.worker.ts` (nuovo) +
  `questOffer.ts` — forecast off-main-thread.
- `src/ui/idleVillage/questS1Lab/questSchedule.ts` — `questElapsedTicks`
  congelato a `settledAtTick`/`outcomeResolvedAtTick` per run `ended`.
- `src/ui/idleVillage/roster/CanonicalRosterBundle.ts` — memo
  `canonicalResidentData`, rimossi `console.log` con serializzazione profonda.
- `src/balancing/config/idleVillage/residentVisuals.ts`,
  `testRosterResidents.ts` — nomi + `visualProfileId`.
- `src/assets/portraits/**` — asset + README; `.mw/specs/villager-*/identity.md`.
- `src/localization/i18n.types.ts` + locale — chiavi revive.
- Test: `tests/unit/store/reviveDeadResidents.test.ts`,
  `tests/unit/idleVillage/questForecastWorker.test.ts`,
  `tests/unit/idleVillage/villagerPortraits.test.ts`.

## 3. Note visual-fork

I file sotto `src/ui/` nel diff non introducono né modificano
rappresentazioni grafiche: il fork non è richiesto (skip puntato qui
sopra). I ritratti sono asset esistenti del Director collegati a profili
già previsti dalla pipeline `residentVisualResolver` — nessun nuovo
elemento grafico.

## 4. Misura (headless, dev server :5173, save live del Director)

| Stato | Prima | Dopo |
|---|---|---|
| Idle mappa (3s) | ~1.5s busy | ~0.4s busy |
| Idle planner+roster (3s) | ~8.5s busy, ~24 longtask | ~2.1s busy, ~13 longtask |
| Click assign (finestra 3s) | 5–10s busy, timeout 30s | ~2.7–3.7s busy, click servito |
| Max longtask | 1748ms | ~560ms |

Residuo strutturale (fuori scope, da plan dedicata): la pagina sottoscrive
l'intero store → ~2.6 commit/s di pubblicazioni legittime (tick 1/s +
viste throttled) × ~200–300ms di render dev-mode (`jsxDEV` ~23% self).
Leva futura: sottoscrizioni narrow per componente o valori ticking spinti
a foglia.

## 5. Salvaguardie

- `npm run lint -- <scope>`: 0 errori (file in ignore pattern, da convenzione).
- Typecheck (`tsc --noEmit`): pulito.
- Test: revive 5/5, portraits 4/4(+5 config), worker 4/4, questSchedule 6/6.
  Pre-esistente NON di questo diff: `questTheatreSequencer` aspetta
  `revealMs=1400`, il config dichiara 900 (mismatch a HEAD).
- `npm run build:check`: passato.
- `closure:lint`: rosso sul worktree condiviso. Errori di questo diff
  risolti: visual-fork (skip qui sopra), STRICT_FILES (`questForecast.worker.ts`
  in `scope_files` di `game-frame-pixi`), superficie non mappata
  (5 `coverage_exception` EXC-20261022-* con motivazione + puntatore),
  probe `scripts/_tmp/` rimossi. **Restano, e richiedono il Director o un
  sigillo pulito:** (a) Mode B-amend su ~30 INV la cui import-closure include
  `testRosterResidents.ts`/`residentVisuals.ts`/`CanonicalRosterBundle.ts` —
  blast radius >3 ⇒ serve `sync-amend-override` (`.mw/mapping-approvals.jsonl`)
  o la ricattura baseline `checkout al sigillo + run reale`, impossibile su
  worktree sporco condiviso; (b) errori di file di sessioni parallele
  (`FlightProxy`, `scripts/ledger`, `astro-witness`, R-269); (c) mismatch
  `revealMs` pre-esistente a HEAD.
