# PLAN-077 — Flusso automatico di chiusura work-item e avanzamento della coda

**Status:** `baptized` — Director «procedi» 2026-10-22 (su convergenza di
sostanza, precedente PLAN-053 decision_memo).
**Richiesta:** R-262
**Dibattito:** `mind-weaver/.mw/runs/20261022-bug-closure-queue/`
**Artifact:** `artifact-r012.md` — sha256
`311e6d4994e62e6974bb85fae30de3ef6c5738b85ded42b6bcfa3963deedaa03`
**Esito dibattito:** decision_memo (round cap 10). deepseek ACCEPT ×5;
chatgpt 8 obiezioni seriali (WITNESS-1…8), tutte disposizionate `amended`
e incorporate — convergenza di sostanza, acceptance formale mancante.
**visual-fork:** skipped — governance/ops, nessuna superficie grafica
(`files_touched` ∩ `src/ui/**` = ∅).

## 1. Intento

Implementare il ciclo «conferma Director → verifiche contrattuali →
chiusura → avanzamento coda» per work-item (non solo bug), testato **in
isolamento** senza riattivare il dispatch R-208. Fonte autorevole unica
(ledger JSON tool-managed), coda = vista derivata.

## 2. Tassonomia (decisione chiave del dibattito)

| Tipo | Intent | Chiusura richiede |
|---|---|---|
| `defect` | viola intento già specificato | test regressione + contratto + conferma Director se superficie visibile |
| `change` | intento nuovo verbatim Director su comportamento esistente | conferma Director (=criterio di verità) + check tecnici + intent-gate v33 |
| `feature` | intento non specificato | `NEEDS_PLAN` fino a plan battezzato; mai `RUNNING` diretto |

## 3. Macchina a stati

`OPEN → READY → RUNNING → VERIFYING → AWAITING_DIRECTOR →
DIRECTOR_CONFIRMED → CLOSED` + laterali `NEEDS_PLAN`, `RETRY_PENDING`,
`BLOCKED_VERIFY` (retry-budget, vocabolari chiusi `blocked_reason`/
`next_action`), `BLOCKED_VERIFY_TERMINAL` (mai re-picked).
`AWAITING_DIRECTOR` si lega a (item, latest_attempt); `await_ttl` →
`awaiting_stale` nel report; exit solo: conferma valida | nuovo tentativo
| `item-withdraw` | `surface-release --force` (tutti atti umani journaled).

## 4. Invarianti di sistema (emersi dal dibattito)

- **Ledger**: journal NDJSON (seq contiguo + checksum per record) +
  snapshot atomico; replay deterministico; repair = troncamento tail +
  `journal_repair` journaled; corruzione interna ⇒ fail-closed.
- **Conferma**: dedup (item, attempt, revision, hash) + puntatore
  `active_confirmation`; conferma stale giornalizzata, mai chiusura;
  nessuna eredità tra tentativi.
- **Gate anti-TOCTOU** (detective): ricalcolo `surface_manifest_hash` +
  contract-hash pre-CLOSED; scarto residuo catturato dal CLOSED-watch
  (`suspect_regression`, allarme conservativo non diagnostico).
- **`surface_manifest` deterministico**: {path, sha256, size} ordinato +
  voci `absent:true` per file attesi mancanti; glob→0 file =
  `contract_invalid`; `allow_empty_surface` solo `feature` +
  `empty_surface_reason` + zero file attesi dichiarati + verginità
  verificata su storia (`history_complete` richiesto).
- **Archivio**: `.mw/ledger/blobs/<manifest_hash>/` = manifest + blob con
  integrità referenziale; CLOSED certifica la revisione archiviata.
- **Lock**: granularità surface-map id + file-set contratto; tenuto in
  AWAITING_DIRECTOR; ricostruito da journal; `attempt_token` fencing.
- **Tick linearizzato**: `tick_id` + watermark ingest; release →
  recompute → dedup (`suspect_fixed_by` conservativa) → select;
  `assignment_id` univoco; slot verifica ≠ slot esecuzione.

## 5. Task

- **T-001** Ledger+journal: `.mw/ledger/` NDJSON, checksum, snapshot
  atomico, replay, repair, genesis/`history_complete`.
- **T-002** Modello item + FSM: stati, eventi (confirmation,
  confirmation_invalidated, contract_amended, journal_repair,
  stale_attempt_output), `active_confirmation`, `surface_manifest`
  completo (absent, non-vuotezza, verginità/storia).
- **T-003** Lock di superficie: risoluzione surface-map+file-set,
  normalizzazione, fencing token, rebuild da journal.
- **T-004** Verifica: ricevute su snapshot, classificazione
  infra/defect-persisted, gate finale, vocabolari blocked, archivio blobs.
- **T-005** Coda+tick: watermark, ordine release→recompute→dedup→select,
  assegnazione atomica, slot verifica, load-controller statico (cap config).
- **T-006** Comandi+report: `item-ingest`, `item-confirm`, `item-withdraw`,
  `surface-release --force`; report chiuso/bloccato/awaiting/da correggere/
  awaiting-stale/suspect_regression.
- **T-007** Pilota + test di accettazione (§10 artifact: crash/replay,
  TOCTOU, doppia assegnazione, conferma stale, esaurimento budget,
  starvation, ingest durante tick, crash launch, gate tassonomia).

## 5bis. Ampliamenti approvati dal Director (2026-10-22)

- **Conferme via Telegram**: `tools/telegram-mw-bridge.py` come canale di
  input — `item-confirm` / `item-withdraw` / `surface-release` dal bot;
  la coda non si ferma ad aspettare il Director alla scrivania.
- **Digest delle conferme**: gli item in `AWAITING_DIRECTOR` escono in UN
  report aggregato da eye-checkare in blocco, non N interruzioni.
- **`item-prioritize` con semantica di preemption**: comando Director che
  fa salire un item in testa; l'item in `RUNNING` viene parcheggiato a un
  checkpoint recuperabile (journal) oppure lasciato finire — default da
  ruling (proposto: checkpoint-park).
- **Cost accounting per tentativo**: tempo/token per attempt nei campi
  ledger → il Director vede il costo di chiusura di un item; informa anche
  il benchmark PLAN-039 sulla riattivazione.
- **`quota_exhausted` come failure-class** (`blocked_reason` +
  `next_action: retry_after_quota`): interruzione per quota Devin =
  infra-failure recuperabile, non consuma tentativi di fix, ripresa dal
  journal. *Escluso per ruling Director*: nessuna schedulazione quota-aware
  (la quota NON è un budget del load-controller).
- **Modalità notturna + auto-spegnimento**: gli esecutori registrati in
  `~/.rpg-shutdown/session-registry.json` tengono il Mac sveglio dentro la
  quiet window (rule 50); coda drenata → nessun heartbeat → shutdown.
  Serve `pmset schedule wake` per la run successiva — **va registrato
  come nuovo componente nella governance shutdown** (rule 50: ogni
  nuovo attore machine-state si registra, fail-closed di default).
- **Feed-back loop su `learn`**: una catena `RETRY_PENDING` ≥2 genera
  automaticamente un pattern-candidate per `context/recurring-traps.md`.
- **Candidato (ruling separato)**: worktree git per tentativo —
  eliminerebbe T-13 alla radice ma cambia il modello di esecuzione; non
  è in scope di questo plan, segnato come direzione da decidere.

## 6. Default battezzati + punti ancora aperti

**Adottati al battesimo (Director «procedi», 2026-10-22):**

- `await_ttl` = **48h**; cap tentativi fix = **3**; retry infra = **3**.
- Cap concorrenza pilota = **1** (load-controller statico da config; il
  dispatch resta in pausa R-208, il pilota è in isolamento — si alza a
  runtime dopo il benchmark PLAN-039).
- Preemption di `item-prioritize` = **checkpoint-park** (l'item RUNNING si
  parcheggia su checkpoint recuperabile nel journal).
- Acceptance chatgpt non cercata in run nuovo: battesimo su decision_memo
  (convergenza di sostanza), precedente PLAN-053.

**Restano aperti in implementazione:**

- Wake-schedule notturna: orario `pmset` + registrazione come nuovo
  componente della governance shutdown (rule 50 — fail-closed,
  `shutdown:status` + evidence log richiesti prima di abilitarla).
- Finestra watch sui CLOSED (dimensionamento nel pilota); costo
  `.mw/ledger/blobs/` accettato su file-set ≤ ~15 file.
- Worktree git per tentativo — candidato a ruling separato (§5bis).

## 7. Contratto di chiusura (per il plan stesso)

- `verification.json` del task: obbligazioni = build:check + lint scope
  + test unitari del ledger/FSM/lock (T-001…T-005) + scenario test del
  pilota (T-007) — ogni obbligazione con esecuzione reale (v32).
- Regression-test permanente: suite scenario del ciclo
  (confirm→verify→close / retry / blocked / invalidated) — R-247.
- `bundle:` citato alla chiusura `fatta` di R-262 in `RICHIESTE.md`.
