---
id: PLAN-044
title: "PLAN-044: Verifica comportamentale meccanica — gate fail-closed S0–S5"
status: completed
created: 2026-10-17
baptized: 2026-10-17 / Fausto ("procedi")
desiderata: .mw/desiderata.md v32 FROZEN (2026-10-17)
provenance: dibattito multi-AI `20261017-s0s5-debate` in mind-weaver —
  CONVERGED `artifact-r002` (sha fbee2aa2) + ruling Director seq 48–51.
  Piano sorgente: mind-weaver `.mw/runs/20261017-bv-rpg-critique/plan-s0-s5.md` (r003)
  Secondo dibattito sul piano battezzato: `20261017-plan044-debate` —
  CONVERGED `artifact-r007` (sha 2713bb9a), electorate chatgpt/claude/
  gemini/deepseek (grok escluso: adapter defect). Emendamenti integrati
  sotto (sezioni T-002/T-003/T-007).
---

# PLAN-044: Verifica comportamentale meccanica S0–S5

> Il Director perde tempo nel ciclo "agente dichiara fatto → ritesta →
> fallisce → rispiega → ripete". Le verifiche diventano **gate meccanici
> fail-closed** dentro `verify:bundle`/`closure:lint` — nessun secondo
> giudice LLM (v32 pt. 2; il giudice d'intento è l'asse separato di v33).

## Invarianti (da v32 FROZEN — non eludibili)

- File toccato senza superficie mappata → **disposition obbligatoria**
  (mappatura o `coverage_exception` auditabile). Rosso senza.
- `coverage_exception` su comportamento non verificato → **`awaiting_director`**
  fino a `director_answer`. L'agente non si auto-approva.
- Red-first: hash FILE test + hash OUTPUT run rossa (identità ≠ esecuzione).
- Baseline rossa (anche superfici non toccate): nessun escape hatch —
  si ripara; se i presupposti del test non sussistono più → **test
  scartato** (rimozione registrata).
- `verifier.json`: receipt generato da script, schema backward-compatible
  + `generated_by`; LLM solo advisory.
- Decision report: campi `resolved`/`open`/`escalated` obbligatori
  (schema-check, contenuto advisory).
- Metrica `found-by: agent-bv|director|gate`; `director → ~0` in ~5 plan.

## Tasks (slice usabili singolarmente)

| Task | Contenuto | Depends |
|---|---|---|
| T-001 | S0 — `src/ui/idleVillage/AGENTS.md` → pointer alla fonte unica; lint su pattern di workflow sospesi nei file AGENTS annidati (drift impossibile da reintrodurre) | — |
| T-002 | S1a — mapping layer file/glob→superficie (v1 match diretti) + port `contracts:check` nativo TS da `mind-weaver/scripts/contracts-check.py` dentro `verify:bundle`: diff → check/evidence richieste; disposition obbligatoria su unmapped (RED). **Hardening dibattito**: `mapping_change` = classe distinta da `coverage_exception`; proposte batched in un `mapping-proposal` con approvazione Director sul **sha256 del contenuto esatto del batch** (gate verifica mapping diff ⊆ batch approvato — modifiche post-approvazione non attive); flag meccanico anti-glob: entry >K file o glob su directory root richiede conferma esplicita per-entry; campi `proposed_by`/`approved_at`/`source` (audit, non autorizzazione); `expected_checks` per superficie nello schema. Mis-mapping = rischio residuo documentato, NON gateabile in v1 (seed in S5) | T-001 |
| T-003 | S1b — `awaiting_director` per `coverage_exception` su comportamento non verificato: meccanismo `director_answer` nel circuito bundle/skill (porta RPG del verbo del dibattito). **Hardening dibattito**: `director_answer` lega `coverage_exception_id` + hash del record eccezione (file+reason+scope) + **content hash canonizzato del file coperto** al momento dell'approvazione — tweak benigni non invalidano, modifica sostanziale → ri-approvazione (niente stale-hash deadlock, niente scope drift); `tools/mw-director` etichettato **boundary procedurale** (mai "prova meccanica di authorship" — signing = v2); gate-file diffs valutati dalla **versione gate committata precedente** (baseline HEAD) — il gate non giudica se stesso, niente bootstrap-loop | T-002 |
| T-004 | S2 — red-first lockato: bundle registra hash file test + hash output run rossa al commit di riproduzione; ricontrollo a fine task; protocollo re-riproduzione per fixture/helper; asserzioni geometriche Playwright (bounding-rect, HUD↔viewport) su harness esistente per classe /game T-01 | T-002 |
| T-005 | S3 — `verifier.json` receipt generato da script: exit code + hash check sull'albero finale sorgente+test; `generated_by`; LLM demosso a advisory nel decision report | T-002 |
| T-006 | S4 — fase BV nelle skill: `mw-planner` shift-left (plan eredita CTR+traps delle superfici toccate come acceptance); `mw-executor` gate chiusura = bundle+contracts:check verdi + decision report `resolved`/`open`/`escalated` schema-check | T-003 |
| T-007 | S5 — dogfood + metrica: seeded defect su fixture classe /game (rosso→verde); seed mis-mapping; `found-by` sui prossimi REG. **Hardening dibattito**: metriche Director-burden meccaniche — `director_dispositions_per_closure` (batch mapping + director_answer + gate-file dispositions, letti da director-answers.jsonl) e `awaiting_director_wait_minutes`; criterio di successo **congiunto e anti-gaming**: dispositions/closure in trend discendente AND found-by:director non crescente AND wait ≥ floor (sotto floor = flag rubber-stamp, non riduzione); volume minimo N=10 closure o M giorni prima di dichiarare trend; `zero_defect_closures` counter separato — invalida solo il trend found-by (quota alta senza difetti = assenza di segnale), il denominatore dispositions resta TUTTE le closure; baseline pre-T-003 derivata da closure history + defect registry | T-006 |

## Esecuzione

| Task | Stato | Bundle / note |
|---|---|---|
| T-001 | **fatta** (2026-10-17) | bundle: `.mw/runs/plan044-t001-agents-hygiene/bundle.json` — PASS 6/6. `src/ui/idleVillage/AGENTS.md` riscritto come pointer alla fonte unica; `checkNestedAgentsGate` in `gateCore.ts` (pattern workflow sospeso R-208: board, ruoli/script pipeline, prompt-spec) esposto via `npm run agents:lint` e wired in `closure:lint`; test +5 in `gateCore.test.ts`; seeded red→green provato in-repo. Evidence: `test-results/plan044-t001-agents-hygiene-2026-10-17.log`. |
| T-002 | **fatta** (2026-10-17) | bundle: `.mw/runs/plan044-t002-contracts-check/bundle.json` — PASS 7/7. `surfaceMap.ts`+`contractsCheck.ts` (gate fail-closed: unmapped senza disposition → rosso; diff mappa ⊆ batch approvati su sha256; anti-glob K=5/root-glob con conferma per-entry); CLI `contracts:check`/`mapping:propose`/`mapping:approve`/`mapping:status`/`coverage:exception`; wired in `produceBundle` (campo `contracts` → BLOCKED) e `closure:lint`; seed `.mw/surface-map.json` 10 superfici **approvate dal Director** (batch `5751cf1d…` in `.mw/mapping-approvals.jsonl`); 13 test nuovi; dogfood: primo bundle BLOCKED su mappa non approvata → approvazione → PASS. Scope notes: gate-file su versione committata = T-003; `coverage_exception` = audit trail (awaiting_director = T-003); mis-mapping = rischio residuo v1. Evidence: `test-results/plan044-t002-contracts-check-2026-10-17.log`. |
| T-003 | **fatta** (2026-10-17) | bundle: `.mw/runs/plan044-t003-awaiting-director/bundle.json` — PASS 7/7. `awaiting_director`: `coverage_exception --unverified-behavior` → chiusura rossa finché `director_answer` (CLI `director:answer`, journal `.mw/director-answers.jsonl`) non lega exception-id + hash record + canonical hash dei file coperti (edit sostanziale/scope drift/record edit → ri-approvazione; tweak benigni no). Gate-file diffs → delegati al gate committato a HEAD (materializzato in temp dir) o bootstrap `director_answer --gate-diff`; fix reale: package.json type:module in materializzazione + tsxCli via walk-up (import.meta.url non file-scheme sotto vitest). Dogfood: primo bundle BLOCKED → `mapping:approve` (proposal 20-47) + `director:answer --gate-diff` Director → PASS. Boundary procedurale documentato. Evidence: `test-results/plan044-t003-awaiting-director-2026-10-17.log`. |
| T-004 | **fatta** (2026-10-18) | bundle: `.mw/runs/plan044-t004-red-first-lock/bundle.json` — PASS 7/7. `redFirst.ts` (lib+CLI): journal `.mw/red-first.jsonl` + log `.mw/red-first/`; record lega canonical hash file test + sha256 log rossa + exit_code≠0 (record rifiuta run verde); `checkRedFirstGate` enforcea `manifest.red_first` + journal∩diff (test mutato → rosso; `retire` = rimozione registrata); wired in `Manifest`/`Bundle` (`red_first` opzionale, backward-compat), `produceBundle`, `closure:lint`; nuovi file in `GATE_FILES`, journal/log in `EXEMPT_PATTERNS`. Geometria T-01: `tests/helpers/geometry.ts` + `gameGeometryT01.spec.ts` — 3 viewport, canvas⊇viewport, chrome dentro, ancore disgiunte (3/3 PASS). Dogfood: seed live record→mutazione→rosso→retire→verde; spawn failure transitorio OB-1/OB-2 sotto carico sessione parallela; exception per file sporchi di sessione parallela (measure-medal.tmp.mjs, skins primitives, audio). Mappa: `mapping:approve` proposal 22-21-51 (bv-gate+=redFirst, game-tests+=helpers, nuova app-shell). Residuo v1: posizione isola in-canvas = pixel WebGL, non DOM-assertabile. Evidence: `test-results/plan044-t004-red-first-lock-2026-10-18.log`. |
| T-005 | **fatta** (2026-10-18) | bundle: `.mw/runs/plan044-t005-verifier-receipt/bundle.json` — PASS 5/5. `verifierReceipt.ts` (lib+CLI): receipt meccanico `verifier.json` — exit code per obbligazione, sha256 artifact+comando, `source_tree_sha256` deterministico su albero sorgente+test (exempt: journal/artefatti di gate), `generated_by`; wired in `produceBundle` (riscrittura automatica a fine run — un verifier hand-written viene SEMPRE sovrascritto); `checkVerifier` richiede `generated_by` non vuoto → receipt LLM-only rifiutato, LLM demosso a advisory nel decision report; `VerifierEvaluation.exit_code` blocca il "verificatore conferma un FAIL" (selftest caso 11). Test `verifierReceipt.test.ts` 12/12. Dogfood: verifier.json hand-written → riscritto meccanico; fix collaterale `redFirst.test.ts` (child tsx ereditava `NODE_OPTIONS` relativo → cwd temp). Fix gate reale trovato sotto carico parallelo: `runCommittedGate` `execFileSync` con stdout in pipe — al timeout il figlio tsx muore ma il grandchild esbuild tiene la pipe aperta → hang infinito su EOF (SyncProcessRunner `uv__io_poll`, osservato >20min); fix stdio→file temporanei + runner anti-ricorsione (`GATE_FILES.length=0` nel figlio). Evidence: `test-results/plan044-t005-verifier-receipt-2026-10-18.log`. |
| T-006 | **fatta** (2026-10-18) | bundle: `.mw/runs/plan044-t006-bv-skills/bundle.json` — PASS 5/5. `decision-report.json` schema-check in `gateCore` (campi `resolved`/`open`/`escalated` array obbligatori; assente+`decision_report:true` → rosso; malformato → rosso; contenuto advisory, mai prova); `Manifest.decision_report?: boolean` + `Bundle.decision_report`; wired in `produceBundle` → BLOCKED su schema rotto. Skill: `mw-planner` §shift-left (plan eredita `expected_checks` di superficie + recurring-traps come acceptance); `mw-executor` §gate di chiusura (bundle+contracts:check verdi + decision report schema-check). Test `checkDecisionReport` ×5 (in verifierReceipt.test.ts). Dogfood: manifest senza file → `ok:false`; con schema valido → `ok:true`. Evidence: `test-results/plan044-t006-bv-skills-2026-10-18.log`. |
| T-007 | **fatta** (2026-10-18) | bundle: `.mw/runs/plan044-t007-dogfood-metrics/bundle.json` — PASS 6/6. `bvMetrics.ts` (lib+CLI `bv:metrics`/`bv:seed`): metriche Director-burden meccaniche — `director_dispositions_per_closure` pre/post-baseline (0.00 → 0.83), `awaiting_director_wait_minutes`, `found_by` distribution + REG senza tag (0), `zero_defect_closures` (30/33), criterio congiunto anti-gaming (trend dispositions ↓ AND found-by:director non ↑ AND wait ≥ floor → rubber-stamp flag), `INSUFFICIENT_DATA` sotto N=10 closure/14gg (verdetto attuale). Journal append-only `.mw/bv-seeds.jsonl` (coverage_exception registrata): seed `defect` detected_by=gate + `mismapping` detected_by=none (rischio residuo v1 documentato). Dogfood live: spec seed rossa→verde sul check game-tests — falso positivo scoperto: vitest esclude `tests/**/*.spec.ts` ("no files" exit 1 ≠ difetto rilevato) → seed rinominato `.test.ts`. Report `.mw/bv-metrics.json` da dati reali (33 closure, 5 dispositions post-baseline). Test `bvMetrics.test.ts` 4/4. Evidence: `test-results/plan044-t007-dogfood-metrics-2026-10-18.log`. |

## Contratto di verifica (obbligazioni, `verify:bundle`)

- O: `contracts:check` esiste come script TS, fallisce il bundle su
  evidence mancante e su unmapped-senza-disposition (prova: caso rosso
  seminato → rosso; disposition → verde).
- O: `awaiting_director` blocca la chiusura finché non esiste
  `director_answer` registrato e legato all'hash del record eccezione +
  content hash del file coperto (prova: eccezione senza risposta → rosso;
  modifica sostanziale del file coperto post-approvazione → rosso).
- O: una modifica al mapping non è attiva finché il suo diff ⊆ batch
  `mapping-proposal` approvato su sha256 esatto (prova: edit mapping
  post-approvazione → rosso; batch ri-approvato → verde).
- O: un gate-file diff è valutato dalla versione gate committata
  precedente (prova: `contracts:check` modificato non può validare il
  proprio record di approvazione pendente).
- O: il bundle rifiuta un fix il cui test di riproduzione ha hash file o
  hash run-rossa diverso da quello registrato (prova: mutazione → rosso).
- O: `verifier.json` è prodotto da script con `generated_by` (prova:
  diff sul file → receipt rigenerato, non editabile a mano senza delta).
- O: decision report senza i tre campi → schema-check rosso.
- O: seeded defect classe /game → rosso prima del fix, verde dopo,
  con il check che lo ha trovato registrato `found-by: gate`.
- O: `npm run lint`/`test`/`build:check`/`closure:lint` verdi su scope.

## Rischi accettati

- Costo iniziale mapping (molte disposition finché /game non è coperto —
  mitigato da batching `mapping-proposal` e flag anti-glob; il budget di
  copertura resta still-unresolved in v32).
- **Mis-mapping residuo** (dibattito): un mapping sbagliato produce
  verde falso e nessun gate v1 lo intercetta — documentato, misurato dal
  seed S5; rilevazione meccanica completa è v2+.
- `director_answer` è boundary **procedurale** (shortcut dedicato +
  journal append-only), non prova crittografica di authorship — signing
  rinviato a v2.
- Parametro K del flag anti-glob aperto (default proposto K=5 —
  conferma Director a T-002).
- v33 (intent gate) è asse cumulativo separato: `fatta` richiederà anche
  intent PASS quando v33 sarà avallata — non scope di questo piano.
