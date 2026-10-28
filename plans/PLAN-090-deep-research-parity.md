---
title: PLAN-090 — Deep-Research-grade context engineering per Mind Weaver
status: in corso — implementazione slice 1 (2026-10-28)
owner: Mind Weaver (planner)
created: 2026-10-28
source_request: R-292
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md (row)
  - RICHIESTE.md (esito dibattito + esito finale)
  - context/INDEX.md (righe per nuovi artefatti quando implementati)
  - test-results/plan-090-deep-research-parity/ (evidence)
---

# PLAN-090 — Deep-Research-grade context engineering per Mind Weaver

## Provenance

Dibattito multi-AI web `mind-weaver/.mw/runs/20261028-r292-deep-research-parity/`
**CONVERGED** su `artifact-r003.md`.

- artifact: `mind-weaver/.mw/runs/20261028-r292-deep-research-parity/artifact-r003.md`
- sha256: `b1bb88444bef71f1b2fa3e23750e573e6cde60056cf1ad61e18adc9143db4b41`
- electorate elegibile: `chatgpt`, `claude`, `gemini`, `grok`, `deepseek` (5/5)
- acceptance: 3 round — r001: 4 ACCEPT + 1 OBJECT (chatgpt, canonical-wins); r002: 4 ACCEPT + 1 OBJECT (chatgpt, fail-closed+regression); r003: **5/5 ACCEPT**
- obiezioni: W-01..W-06, tutte disposizionate `amended`
- grounding: `context/ingestions/2026-10-28-deep-research-context-architecture/` (4 ricerche verbatim) + reverse-engineering system prompt ChatGPT (Embrace The Red, leaks) + Anthropic multi-agent engineering post + Letta/Zep/Graphiti/mem0 docs

## Principio (converged)

Earn complexity **one verified failure mode at a time**. Evidence/provenance quality first (felt pain del Director = qualità di sintesi nelle ricerche), cross-session memory second (narrowed, gated). Ogni artefatto deve migliorare una decisione, preservare evidenza auditabile o enforceare un contratto meccanico — altrimenti non si shipa.

**PRECEDENCE RULE (canonical-wins):** contenuto advisory sempre subordinato ai file canonici — in conflitto vince il canonico per definizione. Le note advisory non possono mai ribadire/indebolire/contraddire veto o decisioni canoniche; ogni file advisory porta banner di subordinazione; un lint deterministico (advisory-vs-canonical, tag-keyed — NON prova semantica) in closure path fa quarantine **fail-closed** (= drop dall'injection, mai solo warning) delle note contraddittorie; un regression-test fixture nella safeguard suite asserisce che i veto canonici restano efficaci nel read path quando si inietta contenuto advisory. Una nota advisory non può mai sovrascrivere un veto — può solo proporre, e le proposte passano per promotion diff approvata dal Director.

## Fasi (contratto sintetico; dettaglio in artifact-r003)

**PHASE 0 — Pre-work (nessuna modifica al loop, ~1-2gg)**
- P0-1 Veto-block pre-test (diagnostico falsificabile, 3 branch): hand-extract dei veto HUD da RICHIESTE/recurring-traps in VETO_BLOCK ≤40 righe tagged; replay del task. (a) retrievable+preventivo → fix = surfacing deterministico (Task 4), no LLM. (b) presente ma ignorato → fix = obbligo di contratto, non memoria. (c) non retrievable → prima evidenza reale PER la A narrowed. Output: `eval/veto-pretest.md`.
- P0-2 Verify-only baseline replay (3 deliberazioni storiche): `mw-ledger.py verify` post-hoc su artefatti esistenti + soft-fail memo lint sul loop corrente. Metriche: anchored-claim rate, share di claim inferred, obiezioni perse tra round, blind Director memo rating. Output: `eval/baseline.md`.

**TASK 1 — Evidence Ledger (schema flat + verifier)**
- `scripts/mw-ledger.py` (stdlib-only): append | verify | render | diff, write atomiche tmp+rename.
- `schemas/evidence-ledger.schema.json` + `docs/evidence-ledger.md`.
- Per run: `.mw/runs/<run>/evidence.jsonl` append-only + `rejected.jsonl` (item malformati in quarantena, mai droppati silenti).
- Entry v1 FLAT: `{id, claim, quote≤300c, source:{kind:repo|snapshot|grounding, path, lines, rev|sha256}, citable:bool, status:proposed|confirmed|contested|superseded, supersedes:{id,rationale}|null, round, provider}` — niente enum class a 3 assi in v1; claim non ancorate → `citable:false`, mai base unica di supported; supersedes esplicito con rationale; anchor solo su materiale pre-round (repo, grounding, snapshot archiviati — web solo via snapshot in ingestions, mai URL live).
- Check meccanici `verify` (in verify:bundle solo se esiste evidence.jsonl): schema, id unici, anchor risolve (path+line bounds+`git cat-file -e rev`/sha256 snapshot), quote = substring normalizzato (whitespace+markup, NO fuzzy — T-04), Findings-lint (bullet sotto `## Findings` con ≥1 `[E-nnn]` citabile). Il gate blocca fonti fabbricate; NON prova entailment — limitazione dichiarata, mitigata da audit umano campionato nel pilot.

**TASK 2 — Provider claim-output contract + hook (dietro flag A/B)**
- mw-iterative-deliberate.py: riuso della macchina di contratto critiche (critique_count + field lines) per un claim-output contract; parse → append → verify a fine round.
- Flag A/B: braccio rendered-ledger vs full-transcript. Transcript immutabili su disco in ENTRAMBI i bracci; ledger = handoff di default, mai unica verità.
- Round prompt nel braccio ledger: brief + rendered ledger + ultima posizione di ogni provider (≤15 righe).
- Degradazione: obiezioni sopravvivono a provider morti; round fallito non scrive nulla di parziale (atomic); sotto quorum il decision_memo cita il ledger e nomina i claim scoperti.
- Pilot: 2 deliberazioni live, entrambi i bracci; confronto blind del Director.
  KILL CRITERION (pre-registrato): Director preferisce blind il braccio transcript in ≥2/3 O anchored-claim rate <90% → writer gate droppato; ledger resta artefatto audit-only.

**TASK 3 — Separazione ricerca/scrittura (C), gated dal kill criterion di Task 2**
- Explorer emette il ledger; planner/writer riceve brief + rendered ledger (+ contesto task), non log grezzi; accesso mirato agli originali immutabili se evidenza insufficiente.
- Contratto writer: claim fattuali conseguenti referenziano id del ledger; le raccomandazioni dichiarano le premesse.

**TASK 4 — Surfacing deterministico + close-time delta (E+H), gated da P0-1 branch**
- Se branch (a): `mw-brief` grep-tag su RICHIESTE/recurring-traps → blocco tagged cappato iniettato via read list di AGENTS.md. No LLM.
- Close-time delta: a chiusura, l'agente appende SOLO item non-derivabili (filtro H: salta ciò che è derivabile da codice/git/file canonici) in `context/auto/` advisory; ogni riga = source pointer + data + class + review-by; banner "ADVISORY - NOT CANON"; provenance lint in closure:lint.
- **Mid-session delta (emendamento Director 2026-10-28):** quando il Director esprime in conversazione preferenza/gusto/veto/correzione durevole, appendere SUBITO via mw-delta — modello bio di ChatGPT, non solo ingest/close-time. Dubbio → confidence:low + review_by breve (meglio una nota in più che una persa; lint dedup/expiry pulisce).
- **Ingest-time durable extraction (emendamento Director 2026-10-28):** quando il Director incolla una discussione/ricerca esterna in `context/ingestions/`, l'estrazione di item durevoli — preferenze, scelte, veto, correzioni, vincoli dichiarati — nella lane advisory è obbligo del workflow, non optional. Oggi il file viene archiviato ma MW "non resta arricchito": errore osservabile da misurare. Stesso formato close-time delta (provenance + confidence + review-by), stesso filtro H, stesso banner. Trigger: nuovo file in ingestions/ → delta extraction → advisory lane. Questo è il merge E (incremental writes) che grok difendeva, scoped sulla sorgente ad alto segnale (~1MB curata) — non su .mw/runs.

**TASK 5 — mw-dream narrowed (gated dai dati di Task 4 + amnesia residua misurata)**
- Sorgenti: front-matter di context/ingestions + RICHIESTE + DECISION_LOG + recurring-traps (~1MB strutturato) — MAI raw .mw/runs wholesale (rumore dead-run; filtro superseded/status su fonti canoniche).
- Incrementale: watermark durevole + checkpoint recuperabile; upsert idempotente per (topic,kind); dedup; output ≤2k token advisory in `context/auto/`; provider cheap (groq/gemini flash/cerebras); stato parziale mai perso su failure.
- Mining .mw/runs: solo v2, retrieval bounded task-relevant, dopo lift misurato di v1.

## CUT espliciti (difesi nel dibattito)

Mining LLM di raw .mw/runs (v1) · Zep/Graphiti temporal KG (campi superseded_by/valid_until bastano) · memory block Letta self-editing (collisione col modello di approval) · I scoring standalone (folded in A) · E standalone (=A con trigger diverso) · fuzzy quote matching (riapre T-04) · citazioni obbligatorie su ogni frase · loop RL-style a saturazione · auto-write su CANON/desiderata/RICHIESTE-authoritative · claim DB/embeddings/vector store (grep + INDEX.md bastano a ~1MB).

## Metriche di acceptance

Extraction precision (claim campionate vs anchor) · anchor validity % · retention delle contraddizioni · obiezioni perse = 0 · blind Director memo rating · comportamento degrade su provider failure · lift misurato prima di promuovere una lane advisory nella read list di sessione.

## Aperto per il Director

- Battesimo del piano e priorità rispetto a PLAN-089 in corso.
- Emendamento post-debate (Director 2026-10-28): ingest-time durable extraction resa obbligo esplicito in Task 4 + P0-3 ingest-amnesia case — registrata come interpretazione Director del piano, non nuova obiezione dell'elettorato.
- Ruling Director (2026-10-28, registrato in R-292): il problema dichiarato dal Director è un dato; l'evidenza si chiede solo su causa/efficacia/misure oggettive, con diagnostica bounded mai bloccante. Conseguenza di priorità: il lane "imparare dalle interazioni del Director" (Task 4 ingest-time + close-time delta) è il felt pain primario dichiarato — alla prima esecuzione va considerato candidato prioritario insieme al veto-pretest, non trattato come deferred per default.
- Se P0-1 dà branch (b) (veto presente ma ignorato), la fix è un obbligo di contratto — richiede scelta di dove inserirlo.


## Avanzamento (2026-10-28, slice 1)

- **P0-1 fatto:** `eval/veto-pretest.md` — branch (a) confermato (veto retrievable → surfacing, non distillazione). `context/auto/veto-block.md` creato.
- **P0-3 fatto:** `eval/ingest-amnesia-pretest.md` — baseline = 0 estrazioni durevoli per ingestion. Gap confermato.
- **TASK 1 fatto (core):** `mind-weaver/scripts/mw-ledger.py` (append|verify|render|diff, stdlib, atomic) + `schemas/evidence-ledger.schema.json`. Testato: dedup id, anchor missing→FAIL, render ordinato. Wiring verify:bundle atteso a primo evidence.jsonl reale.
- **TASK 4 fatto (core):** `mind-weaver/scripts/mw-delta.py` (append|verify|render; filtro skip-derivable, classi preference/choice/veto/correction/constraint/insight) + `context/auto/director-profile.jsonl` seed (D-001..D-004) + `context/auto/veto-block.md` + obblighi ingest-time/close-time in AGENTS.md + lane in context/INDEX.md L0.
- **Avanzamento slice 2 (2026-10-28):** `mw-ledger-extract.py` (fenced ```claims block → evidence.jsonl, malformed→rejected.jsonl); `mw-delta.py lint` (deterministic advisory-vs-canonical: provenance resolve, review_by expiry, dedup, veto/constraint→canonical source) — tested PASS su director-profile; `mw-iterative-deliberate.py` claim-contract + extraction hook dietro env `MW_LEDGER_CLAIMS=1` (shadow mode, audit-only — transcript invariato, A/B arm non attivo); `docs/evidence-ledger.md` in mind-weaver.
**Avanzamento slice 3 (2026-10-28):** P0-2 baseline fatto — v1 opzionale=0 claim, v2 obbligatorio=3 claim PASS (`eval/baseline-ledger-p02.md`); CLAIMS_FORMAT_SPEC reso mandatory-when-citing; retro-extract `--retro` su mw-ledger-extract; A/B arm implementato: `MW_LEDGER_ARM=ledger` comprime round context (brief+rendered ledger+last position ≤15 righe), `evidence_mode` in state.json; run test `20261028-ab-arm-test` conferma arm ledger attivo + 2 claim estratte.
- **Pilota A/B fatto (slice 4):** 3 run — transcript:4 claim, ledger×2:0 claim; arm ledger meccanicamente ok ma cold-start a ciclo1; compliance provider non deterministica → next: gate hard su missing-block o retro-extract fallback. Blind comparison pronta per il Director.
**Avanzamento slice 5 (2026-10-28):** TASK 5 mw-dream implementato e prima run reale — `mind-weaver/scripts/mw-dream.py` (scan|run|render; sorgenti solo strutturate: ingestions+RICHIESTE+DECISION_LOG+recurring-traps; watermark sha256 + checkpoint per file; extraction via mw-ask groq; append via mw-delta). Prima run: **+204 delta** su 39 fonti (director-profile.jsonl 5→209). Lint fail-closed flagga correttamente ~89 veto/constraint mintati da fonti non-canoniche (ingestions/DECISION_LOG non in canon set) — candidati quarantena, da rivedere: DECISION_LOG forse va in canon set. Bug risolti: excerpt head-only→head+tail (i ruling stanno in coda); interpreter .mw/venv vs browser-runtime.
- **Aperti:** quarantena/curate dei flagged; blind rating Director (kill criterion); Task 3 writer contract (Findings→E-ids); regression-test canonical-vetoes (W-06).
