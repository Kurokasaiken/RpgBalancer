---
title: 'PLAN-029 SP-4 — MC integration (single-run)'
status: candidate
created: 2026-10-12
parent: PLAN-029
debate: mw-web-debate `20261012-quest-gen-lab-sp4-mc-integration` — artifact r003
  converged 3/3 eligible (deepseek ACCEPT — incl. own-counterexample rebutted;
  chatgpt ACCEPT; gemini ACCEPT; grok provider_dead — 2 prompt consegnati,
  zero generazioni)
artifact_sha256: a26f68a56b80296037a916274a60b85b9b815c933980d47e729cdef5b136b821
depends_on: PLAN-029 SP-3 (AsyncGateRunner, gateRegistry, GateResult.details
  additive extension), simulateQuestAsync + questOffer (existing engine)
---

# SP-4 — MC integration (single-run) — artifact r003

3 revisioni. r003 assorbe: deepseek B1–B3 (registration statica engine-side,
warnIf* droppati, hashSimInput→canonical seed come emendamento esplicito di A6
con rebuttal del controesempio collisione — conceso da deepseek stesso); chatgpt
B1–B2 (una sola invariante di parità, niente lifecycle mount/unmount) + OBJECT
finale (parità dimostrata DAL TEST, non dalla ricetta); gemini caveat.

## 0. Scope

W4 di PLAN-029: `simulateQuestAsync` esistente diventa il gate diagnostico `mc`
dell'orchestratore SP-3 — UNA run deterministica per entry eleggibile → metriche
flat + finding di coerenza + payload ricco per la riga espandibile. NON possiede:
sweep/multi-strategy/multi-party (SP-10, v1.1), soglie calibrate (S2.5),
persistenza report (SP-6).

## 1. Runner `mcGate` (registrato `async:true` sotto l'id `mc` del tuple)

```
party ← scenario.offer.referenceParty
  assente   → NOT_RUN{notApplicable} + issue mc.noReferenceParty
  invalido  → NOT_RUN{notApplicable} + issue mc.referencePartyInvalid  (defensivo)
instance ← createScenarioInstance(scenario, {dangerScale:1, rewardScale:1}, 'gen')
run ← createRun({party:{members: structuredClone(refParty)}, seed, questId:'gen',
                 scenarioInstance:instance})
strategy ← defaultStrategy(run)
result ← await simulateQuestAsync(run, strategy, {runs, seed, chunkRuns, signal})
```

- **PARITY INVARIANT**: la parità è un'invariante stabilita DAL TEST T-2
  (assert bit-exact su codice reale), non assunta dalla ricetta. Seed e runs sono
  PINNATI alle costanti canoniche (`BAND_SEED`/`BAND_RUNS` di questOffer.ts) —
  NON configurabili. La banda misurata è identica a quella di `deriveOfferBand`
  per costruzione+test.
- **A6 emendato esplicitamente** (non "preservato"): la convenzione hashSimInput
  è stata sostituita perché solo stessa costruzione+stesso sampling garantisce
  banda-lab == banda-produzione — che è lo scopo del diagnostico. Il controesempio
  di collisione di deepseek è respinto: la sim attraversa il grafo dello scenario,
  il seed controlla solo lo stream RNG; entry con stesso hash condividono i
  risultati per design (SP-3 reportsByHash).
- Abort: reject tra chunk → `NOT_RUN{aborted}`, execution:'aborted', zero
  metriche/details — incluso abort-post-ultimo-chunk.
- Costruzione identica a `deriveOfferBand`: stessi scale, `'gen'`, clone profondo
  (structuredClone), stessa sorgente strategy.

## 2. Findings contract

- **Metriche flat**: `mc.runs`, `mc.{reward,survived,fled,wipe}Pct`,
  `mc.anyDeathPct`, `mc.zeroDeathsPct`, `mc.avgWounded`, `mc.leader{Wound,Death}Pct`,
  `mc.leaderDowntimeDays`, `mc.days{Avg,P50,P90}`, `mc.goldAvg`, `mc.lootAvgCount`.
- **Issues (mai FAIL)**:
  - `bandMismatch` → WARNING quando `dangerBandRef` dichiarato E
    `dangerBandFor(measuredAnyDeathPct) !== declared` — args {measured, declared,
    anyDeathPct}; copy "provisional band comparison" (tabella non calibrata, S2.5).
  - `noDeclaredBand` → issue informazionale su riga PASS (issue senza severity =
    info by construction) quando `dangerBandRef` assente.
- **`warnIf*` droppati interamente** — niente soglie unanchored: solo il confronto
  con la banda canonica ha un'ancora; S2.5 aggiungerà soglie calibrate.

## 3. Rich payload — estensione additiva SP-3 [RATIFIED]

`GateResult.details?: JsonValue` additivo su types.ts SP-3.
`details.mc = {v:1, config:{runs,seed,chunkRuns,strategy:'default'},
measuredBand, declaredBand, result: QuestSimResult}` + `isMcDetails()` narrow
guard; assente su NOT_RUN; full result incl. perMember/whyBySource (in-memory,
UI capa il display a top-5, non il payload).

## 4. Progress

Coarse (running/finished via lifecycle esistente). Nessun progress callback —
deferito a SP-10 (sweep UX).

## 5. UI — dettaglio espandibile nella riga mc

Collapsed: chip + summary `wipe X% · anyDeath Y% · band measured (declared: —|D)`
non colorato. Expanded (affordance locale, NON API generica): stacked bar
outcome, distribuzione deaths, days p50/p90, top-5 whyBySource, tabella
perMember compatta. labUi; `questGenLab.gates.mc.*` en+it; details con hash
diverso mai renderizzati come correnti.

## 6. Config — `validationConfig.mc` (Zod, uncalibrated:true)

Solo `{ chunkRuns: 50 }`. seed/runs NON in config (parity invariant). chunkRuns
alimenta T-7 latency + frame-budget.

## 7. File placement

`quests/validation/gates/mcGate.ts` — runner engine-side, registrazione STATICA
in gateRegistry (niente mount-lifetime: il gate esiste per ogni consumer
dell'orchestratore incluse path headless/SP-6 future). Importa moduli engine che
vivono in `src/ui/idleVillage/questS1Lab/` (home storica della sim) — direzione
validation→engine corretta.

## 8. Task

| T | Task | Test chiave |
|---|------|-------------|
| T-1 | `GateResult.details?` + McDetails + isMcDetails | zero rottura SP-3 |
| T-2 | mcGate: party resolution + parity construction + abort | **parity bit-exact**: anyDeathPct E band == deriveOfferBand; NOT_RUN paths |
| T-3 | findings + metrics flatten | bandMismatch→WARNING+args; noDeclaredBand→info; mai FAIL |
| T-4 | registrazione statica | mc row presente; mismatch id tuple → throw init |
| T-5 | determinismo + abort | deep-equal incl. details; abort mid/post-chunk → NOT_RUN{aborted} |
| T-6 | UI espandibile + i18n | summary em-dash; sezioni; stale-hash nascosto; en+it |
| T-7 | latency measurement | wall-time BAND_RUNS → data per SP-10 |

## 9. Non-goals (v1)

Sweep/multi-strategy/multi-party/preset picker; cost governance; soglie
calibrate o arbitrarie; re-seed manuale; progress callback; MC in report
persistiti; design progress channel.
