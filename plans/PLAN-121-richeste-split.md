# PLAN-121 — RICHIESTE split attive/archivio: ledger 1.089k char → file attivo ≤cap

**Stato:** `fatto` (pending verifica) (2026-11-15 — eseguito T-0..T-3:
split commit `ffd90721`, 359 entry → attivo 29/113.479 chars, backlog
126/492.606, archive 204/473.292; union-check sha256 PASS; report
`.mw/runs/plan121-richeste-split/report.md`. Ruling Director "il migliore":
D-1=**b**, D-2=**150k / cutoff `Data`≥2026-11-08**, D-3=**re-baseline** +
union-read ref R-NNN; update read-list AGENTS.md approvato col plan)

**Parent:** R-342 / R-343 (ops: audit contesto fisso Devin + delega subagent).

**Fonte:** Phase-0 finding R-342 — `RICHIESTE.md` = **1.089.264 char ≈ ~272k
token**, oltre la window 262k; domina la read-list AGENTS.md (~386k token).
Report: `.mw/runs/plan120-catalog-slim/phase0-context-inventory.md`.

**Cosa è:** split byte-preserving di `RICHIESTE.md` in file attivo
(auto-letto) + archivio (lookup on-demand) + guard permanente. Solo
SPOSTAMENTO meccanico di intere entry. **Cosa NON è:** niente
riformattazione/dedup/edit di contenuto; niente triage stati (95
`in corso` sospetti stale = task Director separato); non tocca
desiderata né altri file della read-list.

## 0. Fatti verificati (2026-11-15, misura preliminare — T-0 la formalizza)

- **358 entry** `## R-NNN — titolo` (incl. `R-340bis`), cronologico
  R-001→R-345, nessun TOC; header+legenda `## Stati` = 587 char.
- Status = primo token in backtick (364 righe `**Stato:**`):
  **closed-family ≈212 entry / 505.791 char** (`fatta`+varianti,
  `completata/o`, `ritirata`, `superata`, `verificata`, `chiuso`, `✅`);
  **open-family ≈146 entry / 582.886 char** (`in corso` ~95, `aperta` ~10,
  `da chiarire` ~8, `proposta` ~4, `sospesa`, `da verificare`,
  `da pianificare`, residui — elenco esaustivo a T-0).
- **Entry recenti enormi**: ultime 200 (da R-156) = 705.788 char ≈65% del
  file; `Data` ≥11-01: 49 entry/186.240 char; ≥11-08: 32/116.638 char.
- **Feasibility gap (misurato):** "open-family + fatta <30gg" ≈ **600k
  char — 4× il cap 150k** → il cap regge solo con finestra ~7-14gg o
  variante digest (D-1).
- **Blocker tooling:** `scripts/verification/intentGate.ts` impone
  RICHIESTE.md **append-only vs commit di battesimo** (ROSSO su rimozione)
  → re-baseline o gate amend (D-3).
- Trappole: **T-13** (append paralleli — freeze window + commit atomico).
  `visual-fork: skipped — nessuna decisione estetica — .mw/runs/plan120-catalog-slim/phase0-context-inventory.md`.

## 0b. Regola di esecuzione (Director, 2026-11-15)

**Un plan approvato si esegue tutto d'un fiato, senza fermarsi.** L'agente che
esegue non si ferma a chiedere conferme tra un task e l'altro (T-0→T-3 in
sequenza), non rilancia domande già coperte dal contratto, non propone
alternative a metà strada.

**Unica pausa legittima:** una scelta non prevista dal plan che solo il
Director può fare — es. un'eccezione >240 char su D-1, un conflitto scoperto
con lavoro parallelo (T-13), un'invariante violata dall'esecuzione. In quel
caso: stop, domanda mirata con opzioni, ripresa dopo ruling. Errori tecnici,
test falliti, output inattesi **non** sono motivi di stop: si debugga e si
continua dentro lo scope del plan.

## 1. Principi

- **P1 — Split deterministico e rieseguibile:** script + regola meccanica
  (status-token ∩ cutoff-data), mai selezione a mano.
- **P2 — Niente byte persi né duplicati:** unione ordinata == originale,
  verifica meccanica.
- **P3 — Il guard resta:** come PLAN-120, check committato e rieseguibile.

## 2. Decisioni aperte

| ID | Decisione | Proposta | Quando |
|---|---|---|---|
| D-1 | Regola di split — **DECISO: (b)** | **(a)** RICHIESTE.md = header + open-family + fatta <30gg; archivio il resto — **misurata ~600k, viola il cap** (riportata per onestà); **(b)** 3 file: RICHIESTE.md = header + entry `Data`≥cutoff (~7-14gg ⇒ 117-186k), `RICHIESTE-backlog.md` open stale, `RICHIESTE-archive.md` closed; **(c)** digest: RICHIESTE.md canonico intatto (intentGate preservato), si genera `RICHIESTE-digest.md` (indice open + ultime N entry) letto da AGENTS.md — zero rischio migrazione | T-0, ruling Director |
| D-2 | Cap file attivo — **DECISO** | ≤150.000 char con cutoff `Data`≥2026-11-08 (misurato ~117k) | fatto |
| D-3 | intentGate append-only — **DECISO** | re-baseline al commit di split; union-read (attivo+backlog+archivio) per risoluzione ref `R-NNN` | T-2 |

## 3. Fasi / Task

### T-0 — Inventory script + regola esatta

- `scripts/richesteSplit.ts inventory --json` → per entry: id,
  status-token, `Data`, byte range; istogramma + classificazione status
  non canonici (default fail-safe = open). Output
  `.mw/runs/plan121-richeste-split/inventory.json` + regola meccanica nel
  plan (post D-1) con tabella status→famiglia.

**Regola meccanica (post-ruling):** entry con `Data`≥2026-11-08 →
`RICHIESTE.md`; open-family `Data`<2026-11-08 (o `Data` assente/non
parsabile) → `RICHIESTE-backlog.md`; closed-family `Data`<2026-11-08 →
`RICHIESTE-archive.md`. Header+legenda `## Stati` in testa ai tre file
(identica, con nota di provenienza). Ordine canonico concatenazione:
attivo → backlog → archivio.

### T-1 — Migration script + verifica deterministica

- `scripts/richesteSplit.ts split --dry-run|apply` con check built-in:
  concatenazione ordinata == sha256 originale; multiset heading-sha
  identico; 358 entry prima = 358 dopo. Deliverable: tool + dry-run
  report, nessun file mutato.

### T-2 — Freeze window, apply, tooling/docs

- Freeze annunciato (T-13) → `apply` + commit atomico; re-check sha se
  mtime cambia mid-task.
- Update post-apply (elenco al grep, nessun edit in draft): `AGENTS.md`
  read-list + "catturala in RICHIESTE.md" — **governance, approvazione
  Director esplicita**; `CANON.md`, `CURRENT_STATE.md`,
  `context/INDEX.md`, `context/recurring-traps.md`, `.mw/INDEX.md`;
  scripts: `intentGate.ts` (D-3), `contractSchema.ts`+`syncBug.ts` (ref
  `R-NNN` su union), `closureLint.ts`+`gateCore.ts`+`selftest.ts`,
  `taskClose.ts`+`agentComplete.js`, `inventory.ts`, `planForensics.ts`,
  `masterplanSyncCheck.ts`; 10 SKILL.md in `coordinator/skills/` (mw-*,
  agent-execution-mandate, strategist, painter, mockup-generator,
  auditor-sentinel, idle-village-task, fixer-task — symlinked).
  Deliverable: diff scoped + guard `richesteSplit.ts check --cap <n>`
  (npm `richeste:check`).

### T-3 — Re-misura + report + handoff

- Read-list post-split (char/token stimati) → `.mw/runs/plan121-richeste-split/report.md`;
  update handoff + `plans/INDEX.md` riga PLAN-121.

## 4. Contratto di chiusura (verification.json → verify:bundle → bundle.json)

| OB | Tipo | Obbligazione | Blocking |
|---|---|---|---|
| OB-1 | state | unione split byte-identica: `cat` parti in ordine canonico == sha256 pre-split (no-op sotto D-1c, dichiarato) | sì |
| OB-2 | state | ogni entry esattamente una volta: 358 heading prima = 358 dopo, multiset sha-per-entry identico | sì |
| OB-3 | state | file auto-letto post-split ≤ cap D-2 (proposta ≤150.000 char; aperto a ruling) | sì |
| OB-4 | state | guard permanente `richeste:check` committato e verde, rieseguibile | sì |
| OB-5 | human-eye | Director spot-check: entry `aperta`/`in corso` della finestra nel file attivo; campione archivio intatto | no |
| OB-6 | state | docs: AGENTS.md read-list, context/INDEX.md, handoff; `closure:lint` verde post-migrazione | sì |

**Nota R-247:** nessun codice di gioco toccato — l'equivalente del test di
regressione permanente è OB-4. Eccezioni silentiose: nessuna.

## 5. Rischi / note

- **intentGate append-only = blocker vero** (§0): senza D-3 il primo gate
  post-split va ROSSO. Decisione esplicita.
- **Ref `R-NNN` single-file** in contractSchema/syncBug → union read o i
  gate `source_ref` rompono su ref archiviati.
- **Append paralleli (T-13):** freeze window + commit atomico; file
  cambiato mid-task → si rifà T-1 (deterministico, costo ~zero).
- **Assunzione file-unico:** elenco in T-2 (13 script, 10 skill, 7+ doc);
  `tools/` e `.mw/` scripts puliti al grep 2026-11-15 — T-0 ri-verifica.
- **AGENTS.md è governance:** read-list + "catturala" solo su ruling
  Director esplicito. **95 `in corso` sospetti stale:** lo split non li
  cura; T-0 li elenca per triage separato.
