---
title: 'PLAN-029 SP-3 — Validation orchestrator & gate'
status: candidate
created: 2026-10-12
parent: PLAN-029
debate: mw-web-debate `20261012-quest-gen-lab-sp3-validation-gates` — artifact r006
  converged 4/4 (deepseek ACCEPT, chatgpt ACCEPT, gemini ACCEPT, grok ACCEPT —
  grok's recurring "agreed shapes" objection adjudicated as unfounded: no field-shape
  ratification ever existed; semantics only)
artifact_sha256: f93555dfeb2fca81499c42e00d120352cd7ed61bc14f4d309e2450c42d9441fe
depends_on: PLAN-029 SP-1 (DIAGNOSTIC_GATE_IDS, canonicalize), SP-2 (LabCandidate,
  LabExplorerEntry, page reducer, sessionEpoch)
---

# SP-3 — Validation orchestrator & gate (artifact r006)

6 revisioni. r006 assorbe: deepseek REVISE su r001 (B-1 coverage invariant — ogni
gate registrato produce SEMPRE una riga; B-2 split assi status/execution; B-3
contratto scenarioHash su ogni entry baked+candidate; B-4 applicabilità hookCount
come fatto schema-level); chatgpt OBJECT ×4 a catena (report-inventory = hard +
tutto il tuple ammesso; configWarning → top-level configIssues non riga extra;
rollup richiede ALL hard PASS per aggregate PASS; label test disambiguata — gli
hard gate non sono mai placeholder); gemini 2 caveat (opt-out hard visibile,
coercion sicura input non-oggetto); grok obiezioni respinte con adjudication
documentata (§10 di r002).

## 0. Scope

W3 di PLAN-029: orchestratore di validazione puro + pannello "Quality gates" +
badge inline; report versionati legati a `scenarioHash`. SP-3 fissa la definizione
hook-count, le regole kit↔vocab, il wiring hard/diagnostic, il plumbing async per
MC di SP-4. NON possiede: MC (SP-4), persistenza report (SP-6), drawers (SP-5).

## 1. Tipi — `quests/validation/types.ts`

- `GateStatus = 'PASS'|'FAIL'|'WARNING'|'NOT_RUN'`; `HardGateId = 'schema'|'graph'`;
  `GateId = HardGateId | DiagnosticGateId` (diag id SOLO da `DIAGNOSTIC_GATE_IDS` SP-1);
  `NotRunReason = 'optOut'|'aborted'|'skipped'|'notImplemented'|'notApplicable'`;
  `ExecutionState = 'ok'|'threw'|'aborted'` — **asse separato** dal verdetto di contenuto.
- `GateResult{id, kind, status, execution, summaryKey, issues?, metrics?,
  notRunReason?, durationMs?}` — status = solo verdetto contenuto; execution = salute
  del runner. Diagnostic non emettono MAI FAIL di contenuto: thrown diag →
  `NOT_RUN{skipped}+execution:'threw'`; thrown hard → `FAIL+execution:'threw'`.
- `ValidationReport{reportVersion:1, scenarioHash, entryId, createdAt, gates[],
  aggregate, runScope{requested,full:derived}, sessionEpoch, configIssues?}`.
- `GateIssue` conserva `messageKey`+`messageArgs` (mai stringhe risolte nel report);
  `message` solo fallback DEV, mai renderizzato in prod.
- `rollup(gates)`: ① any FAIL → FAIL; ② else any WARNING → WARNING; ③ else ALL hard
  PASS → PASS; ④ else NOT_RUN. Regola ③ = guardia di onestà: PASS aggregato implica
  schema+graph certificati in QUESTO run (parziale che skippa hard → mai PASS badge).
- **STALE** = `report.scenarioHash !== entry.scenarioHash`, derivato in selector, mai
  persistito. Ogni `LabExplorerEntry` (baked E candidate) DEVE esporre
  `scenarioHash` non vuoto (baked: stesso path canonicalize SP-1); hash mancante →
  stato errore distinto `...error.missingHash`, mai silent PASS né STALE forzato.

## 2. Gate inventory v1 — `quests/validation/gates/`

Runner inventory = `schema`, `graph`, `hookCount`, `kitVocab` + slot MC.
**Report inventory ≠ runner inventory**: il report copre hard gates + OGNI id
ammesso dal tuple (una riga ciascuno, ordine tuple); id ammessi senza runner →
riga placeholder `NOT_RUN{notImplemented}`. Altri diagnostici CONTRACTS §8 =
subplan futuro, non edit di registry.

- `schema` (hard): `safeParse(unknown)` → PASS/FAIL con issue da path Zod.
- `graph` (hard): oltre superRefine — BFS nodi irraggiungibili, end orfani, hook id
  duplicati; delega a `exploreScenario` dove copre (reuse = anti-fork; decisione in
  T-4 PR).
- `hookCount` (diag): scena hook-bearing = ≥1 hook con ≥1 effetto verificabile.
  Applicabilità = fatto schema-level (node-kind espone hooks?), config-derived.
  metrics `{hookBearing,totalScenes,ratio}` anche a 0; WARNING sotto
  `validationConfig.hookRatio.advisory` (uncalibrated); mai FAIL; zero scene →
  ratio `null` (mai NaN); no hook field → NOT_RUN{notApplicable}.
- `kitVocab` (diag): `forbiddenTerms` su authored kit con DomainVocab;
  `localeParityIssues` solo con coppia {en,it} reale; findings → WARNING; nessuna
  precondizione → NOT_RUN{notApplicable}; mai FAIL; delega a validateCopy.ts.
- `mc` (slot async): `AsyncGateRunner{id, run(input,{signal})}` + placeholder
  NOT_RUN{notImplemented}; SP-4 registra via registry — zero edit orchestrator.
- Opt-out: `declaredOptOuts` → NOT_RUN{optOut}. Opt-out su HARD gate = errore di
  config → hard gate esegue comunque + entry in `report.configIssues[]`
  (visibile nel blocco config-issue del pannello, NON riga gate).

## 3. Orchestrator — `quests/validation/orchestrator.ts`

`runValidation(entry:{id}&GateInput, opts{signal?,gates?,sessionEpoch?})` — puro,
deterministico. `GateInput.scenario: unknown` (boundary non fidata; schema gate
narrowa; input primitivo → schema FAIL → downstream NOT_RUN{skipped} prima di
qualunque property access).

- Ordine: `schema → graph → diag (ordine tuple) → async last`. Un solo
  short-circuit: schema/graph FAIL → non-eseguiti NOT_RUN{skipped}
  (precedenza skipped > notImplemented, pinned nei test).
- Coverage invariant: `opts.gates` filtra l'ESECUZIONE; gate non richiesti →
  NOT_RUN{skipped}; `runScope.full` derivato (`requested ⊇ {hard} ∪ tuple`).
- Abort (Q-MC-UX): check `signal.aborted` pre-runner → restanti NOT_RUN{aborted};
  gate interrotto NON emette GateResult parziale; righe completate conservate;
  reject-while-aborted → NOT_RUN{aborted}; reject altrimenti → regola threw.
- `gateRegistry.ts`: `registerHardGate` (coppia fissa), `registerDiagnosticRunner`
  (id DEVE ∈ tuple; duplicato/estraneo → throw a module init);
  `resolveGates()` = ordine deterministico; `async:true` dopo i sync, ordine tuple.

## 4. Reducer (nel page-reducer SP-2)

`reportsByHash` = ULTIMO report accettato per hash (re-run = refresh; la coverage
invariant rende impossibile un downgrade silenzioso); `runningHash`,
`runningEntryId`, `runSeq` — arrival rifiutato se epoch/entryId/hash/runSeq non
matchano (guardia cross-wiring: due entry possono condividere hash). Un run
in-flight per sessione; Run disabilitato quando `runningHash !== null`. Report
mai evicted in-session; SP-6 possiede persistenza.

## 5. UI — `questGenLab/QualityGatesPanel.tsx`

Card nella right-side detail column esistente (no tab/sidebar). Header: entry +
badge aggregato + badge STALE se derivato. Righe gate: kind chip + status chip +
execution-defect marker (distinto dal FAIL di contenuto) + `t(summaryKey)` +
issue espandibili (`t(messageKey,args)`; `message` solo DEV) + metrics non
colorate. Run gates manuale + progress + Cancel → abort (report parziale onesto
conservato). Banner STALE con hash prefix. Blocco configIssues. `validationConfig.ts`
(Zod): `hookRatio.advisory` `uncalibrated:true`. Tutto `questGenLab.gates.*` en+it;
primitive labUi; slate/amber. **Un badge PASS non è autorizzazione runtime** — il
runtime canonico continua a enforzare.

## 6. Task

| T | Task | Test chiave |
|---|------|-------------|
| T-1 | types + rollup + coverage helpers | truth table esaustiva incl. {schema NOT_RUN, graph PASS, diag* PASS} → NOT_RUN; ratio-null |
| T-2 | registry + riconciliazione tuple | unknown/dup throw; admitted-unregistered → notImplemented; MC registrabile senza edit orchestrator |
| T-3 | schemaGate (unknown boundary) | PASS 5 baked + candidate; FAIL mappa path Zod; input primitivo → FAIL senza accessi downstream |
| T-4 | graphGate | unreachable/orphan/dup → FAIL; delega vs BFS registrata |
| T-5 | hookCountGate | mai content-FAIL; sotto advisory → WARNING; 0 hook → metrics+WARNING; notApplicable schema-level |
| T-6 | kitVocabGate | forbidden-term → WARNING; parity drift → WARNING; no-precond → NOT_RUN |
| T-7 | async slot + placeholder MC | notImplemented → NOT_RUN; abort mid-run → NOT_RUN{aborted}, nessuna riga parziale |
| T-8 | orchestrator | ordering, short-circuit, abort matrix, threw→execution, optOut, hard opt-out→configIssues, scope parziale→skipped+full=false, skipped>notImplemented, all-diag-placeholder+hard PASS→PASS, hard NOT_RUN→NOT_RUN |
| T-9 | reducer + selectors | rejection epoch/entryId/hash/runSeq; same-hash replace; cross-hash STALE; un-stale; missing-hash |
| T-10 | panel + badge + i18n + config | RTL run→cancel→NOT_RUN; banner STALE; configIssues block senza riga extra; zero stringhe hardcoded |

## 7. Acceptance

1. `runValidation` puro, deterministico, AbortSignal-aware, boundary `unknown`;
   report con version + scenarioHash + runScope derivato + una riga per gate
   registrato.
2. Assi contenuto/esecuzione separati; diagnostic mai FAIL di contenuto; difetti
   infra visibili ma non forgiano verdetti.
3. STALE solo derivato; optOut/abort/skip mai mascherati da PASS; opt-out su hard
   = misconfig visibile in configIssues.
4. SP-4 registra MC con zero modifiche orchestrator (solo entry tuple + registry).
5. Panel in detail column; run manuale + cancel; i18n-only; labUi; slate/amber;
   badge ≠ autorizzazione runtime.
6. Safeguard: lint scope, test scope, build:check, kanban:lint.

## 8. Non-goals

MC impl (SP-4); persistenza/export (SP-6); drawers (SP-5); diagnostici CONTRACTS §8
restanti (subplan futuro); auto-run on select; nuova pagina/silo; calibrazione
hook-ratio; framework di migrazione report; badge come autorizzazione runtime.

## 9. Gate di ingresso (binding)

- SP-1 atterra prima: tuple DIAGNOSTIC_GATE_IDS esistente pre-T-2; i nomi v1
  (`hookCount`,`kitVocab`,`mc`) riconciliati al tuple in T-2 — mismatch emersi,
  mai inventati.
- graphGate delega vs BFS decisa in T-4 contro coverage di `exploreScenario`.
- Report conserva solo keys+args; mai stringhe risolte.
