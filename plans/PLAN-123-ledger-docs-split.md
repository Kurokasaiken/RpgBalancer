# PLAN-123 — Ledger-docs split: DECISION_LOG + desiderata → file attivi ≤cap + archivio union-read

**Stato:** `draft` (2026-11-15 — spec sola, in attesa di battesimo Director.
Misura strutturale reale già eseguita in sede di draft; D-1..D-4 a ruling.)

**Parent:** R-342/R-343 (ops: audit contesto fisso Devin + delega subagent);
segue PLAN-121 (`fatto`).

**Fonte:** Phase-4 finding R-342 — post PLAN-121 la read-list AGENTS.md resta
**578.169 char ≈ ~145k token stimati**; `context/DECISION_LOG.md` (149.255) +
`.mw/desiderata.md` (147.770) = **~297k char ≈ ~74k token, rank #1 e #2 della
leva residua**. Report: `.mw/runs/plan120-catalog-slim/phase4-remeasure.md` §5.

**Cosa è:** split byte-preserving dei due ledger canonici in file attivo
(auto-letto) + archivio (lookup on-demand) + guard permanente, regola diversa
per file (D-1/D-2). Solo SPOSTAMENTO meccanico di intere sezioni. **Cosa NON
è:** niente edit/dedup/riformattazione; niente ri-numerazione `vN`/
`Decision-NNN`; niente triage semantico; non tocca RICHIESTE né altri file
read-list.

## 0. Fatti verificati (2026-11-15, misura reale — T-0 la formalizza)

**`context/DECISION_LOG.md`** (149.255 char, 2.041 righe, **108 sezioni `## `**):
header 177 char; **14 sezioni legacy non-datate ~18.254 char** — 11
`## Decision NNN:` (001–011, incl. `0xx`) + `Regressions Found & Fixed` +
`Open Questions` + `Future Decisions`; **94 entry datate `## YYYY-MM-DD —
titolo` ~128.854 char**. Istogramma date: 08: 3/3.367 · 09: 3/5.503 · 10:
62/88.187 · 11(→15): 26/31.797. Cutoff datate: ≥10-24 → 38/**45.649** ·
≥10-26 → 33/37.237 · ≥11-01 → 26/31.797 · ≥10-16 → 59/75.150 · ≥10-01 →
88/119.984. Finestra 60-90gg (~120k+) viola cap 50k; **≥10-24 = massimo sotto
cap senza legacy**; con legacy (~18.4k) il cap regge solo da ≥11-07 (~49.2k).
CANON.md:56-60 dichiara il file **storia**, non stato → split a data
difendibile; vincoli binding (freezing, protocol-first) vivono già in
`00-project-invariants.md`/CANON.

**`.mw/desiderata.md`** (147.770 byte / 146.336 char, **38 sezioni `## v1`…
`## v38`**): header 706 char (regola «versione corrente = vN più alto
FROZEN»); **TUTTE le sezioni FROZEN** (37 `**Status:** FROZEN` espliciti +
v35 FROZEN per PLAN-047/INDEX senza marker letterale) → **quota FROZEN ≈
100%: uno split per status non archivia NIENTE**. Recency: v25–v38 ≈ 46.950
(+header ≈47.6k) · v28–v38 ≈ ~35k · v30–v38 ≈ ~31.5k. **Blocker tooling**
(equivalente intentGate di PLAN-121): mind-weaver `desiderata_slice.py` +
`mw-desiderata-slice.py` = unico egress sancito (PLAN-045): parsano `## vNN —`,
sha256 sul body, **rifiutano status≠FROZEN**, auto-slicano al latest FROZEN —
split fisico rompe `--desiderata` su tutti i consumer salvo union-read → D-4.

**Consumer (grep 2026-11-15):** `AGENTS.md` (read-list riga 1, entrambi),
`CANON.md` (17/27/43/56/60), `CURRENT_STATE.md`, `context/INDEX.md`,
`context/recurring-traps.md`; skill `coordinator/skills/` (+`.windsurf/skills/`
symlinked): strategist (legge + **scrive DECISION_LOG solo su parola
Director**), mw-explorer, mw-planner, mw-regression, mw-executor, painter,
idle-village-task, README; rules `85-documentation-impact.md` (DECISION_LOG
write-target), `80-quest-rules-maintenance.md`, `mw-rpg-bridge.md`; repo:
`scripts/planForensics.ts:208` legge DECISION_LOG, **nessuno scrive i due
file** (taskClose.ts tocca solo RICHIESTE); mind-weaver (fuori repo, D-4):
`desiderata_slice.py`, `mw-desiderata-slice.py`, `mw-iterative-deliberate.py`,
`mw-critique-plan.py`, `mw-deliberate-legacy.py`, `mw-recall.py`, `mw-delta.py`,
`mw-director.py`, `mw-dream.py`, `mw-plan-disposition.py`, `mw-pool.py`. NON
consumer del file: `visualForkGate.ts`/`intentRegistry.ts` (righe `Desiderata:`
dei plan, non il ledger). Trappole: **T-13** (sessione parallela attiva —
freeze window + commit atomico). `visual-fork: skipped — nessuna decisione
estetica — .mw/runs/plan120-catalog-slim/phase4-remeasure.md`.

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
  (cutoff data / versione / digest), mai selezione a mano.
- **P2 — Niente byte persi né duplicati:** unione ordinata == originale,
  verifica meccanica.
- **P3 — Il guard resta:** check committato e rieseguibile (come PLAN-120/121).
- **P4 — FROZEN resta binding:** l'archivio è solo read-path, mai semantico;
  nessuna sezione FROZEN diventa «deprecated» per spostamento.

## 2. Decisioni aperte

| ID | Decisione | Proposta | Quando |
|---|---|---|---|
| D-1 | Regola split **DECISION_LOG** | **(a)** attivo = header + datate `Data`≥cutoff; legacy + datate vecchie → `context/DECISION_LOG-archive.md` — **raccomandata** (cutoff 10-24 ⇒ ~45.8k); **(b)** attivo = header + `Decision NNN` + datate≥cutoff, meta-sezioni (Regressions/Open/Future ~3.2k) in archivio — cutoff ≥10-30 ⇒ ~48k; **(c)** digest come D-2c | T-0, ruling Director |
| D-2 | Regola split **desiderata** | **(a)** split per status → **misurata NULLA: 100% FROZEN, archivia zero byte** (per onestà); **(b)** recency split: attivo = header + v25–v38 (~47.6k), v1–v24 → `desiderata-archive.md`, FROZEN archiviate restano binding via union-read — richiede D-4 pre-apply; **(c)** **digest — raccomandata**: `desiderata.md` canonico INTATTO (egress slice invariato, zero rischio), si genera `desiderata-digest.md` (indice vN + ultime K verbatim) che sostituisce il file in read-list | T-0, ruling Director |
| D-3 | Cap per file | ≤50.000 char ciascuno sul file in read-list (D-1a: ~45.8k misurato; D-2c digest: ~35–48k con K da ruling) | T-0, ruling Director |
| D-4 | Tooling desiderata (blocker sotto D-2b) | union-read in `desiderata_slice`/`mw-desiderata-slice` (glob ordinato `desiderata*.md` o manifest) + re-baseline slice; sotto D-2c = no-op, solo generator+check digest. `planForensics.ts` → union-read DECISION_LOG | T-2 |

## 3. Fasi / Task

### T-0 — Inventory script + regole esatte

- `scripts/ledgerSplit.ts inventory --json` (pattern `richesteSplit.ts`) → per
  sezione: id (`vN`/`Decision-NNN`/data), status, `Data`, byte range;
  istogrammi + output `.mw/runs/plan123-ledger-split/inventory.json` + regole
  meccaniche post-ruling nel plan.

### T-1 — Migration script + verifica deterministica

- `scripts/ledgerSplit.ts split --dry-run|apply` (+ `digest` sotto D-2c):
  concatenazione ordinata == sha256 originale; multiset heading-sha identico;
  108 sezioni / 38 vN prima = dopo. Nessun file mutato in dry-run.

### T-2 — Freeze window, apply, tooling/docs

- Freeze annunciato (T-13) → `apply` + commit atomico; re-check sha se mtime
  cambia mid-task.
- Update post-apply: `AGENTS.md` read-list (**governance, ruling Director
  esplicito**), `CANON.md`, `CURRENT_STATE.md`, `context/INDEX.md`,
  `context/recurring-traps.md`, skill/rules di §0, `planForensics.ts`,
  union-read helper `scripts/verification/ledgerUnion.ts` (pattern
  `richiesteUnion.ts`); mind-weaver D-4.
- Deliverable: diff scoped + guard `ledgerSplit.ts check` (npm `ledger:check`)
  + check digest deterministico se D-2c.

### T-3 — Re-misura + report + handoff

- Read-list post-split (char/token stimati) →
  `.mw/runs/plan123-ledger-split/report.md`; update `plans/INDEX.md`.

## 4. Contratto di chiusura (verification.json → verify:bundle → bundle.json)

| OB | Tipo | Obbligazione | Blocking |
|---|---|---|---|
| OB-1 | state | unione split byte-identica: `cat` parti in ordine canonico == sha256 pre-split (sotto D-2c: canonico intatto + digest deterministico, dichiarato) | sì |
| OB-2 | state | ogni sezione esattamente una volta: 108 `##` DECISION_LOG / 38 `vN` desiderata, multiset sha-per-sezione identico | sì |
| OB-3 | state | ogni file in read-list post-split ≤ cap D-3 (proposta ≤50.000 char ciascuno) | sì |
| OB-4 | state | guard permanente `ledger:check` committato e verde, rieseguibile | sì |
| OB-5 | human-eye | Director spot-check: entry recenti/vN correnti nel file attivo o digest; campione archivio intatto | no |
| OB-6 | state | docs: AGENTS.md read-list, CANON.md, context/INDEX.md, skill di §0; `closure:lint` verde post-migrazione | sì |

**Nota R-247:** nessun codice di gioco toccato — l'equivalente del test di
regressione permanente è OB-4. Eccezioni silentiose: nessuna.

## 5. Rischi / note

- **desiderata FROZEN = binding forever:** a differenza delle entry chiuse di
  RICHIESTE, le sezioni FROZEN non perdono mai valenza. D-2b le sposta fuori
  dal read-path obbligato pur restando canone (union-read); D-2c elimina il
  rischio non toccando il canonico. Mai presentare l'archivio come «superato».
- **`mw-desiderata-slice` sha-bound:** le slice sono hash-verified per
  section-body — i body non cambiano, ma `load_desiderata_input` sul path
  singolo non trova più le vN archiviate → D-4 **precondizione** all'apply
  sotto D-2b.
- **Ref per path** in CANON/AGENTS/plan/skills → union-read (attivo+archivio);
  citazioni `vN`/`Decision-NNN` risolvono sull'unione.
- **Append post-split:** nessuno script scrive i due file; append manuali
  (strategist DECISION_LOG solo su parola Director; nuove `vN`) vanno in coda
  al file attivo — la regola lo dichiara.
- **T-13:** sessione parallela attiva — freeze window + commit atomico; file
  cambiato mid-task → si rifà T-1 (deterministico, costo ~zero).
- **Backfire:** gli archivi (~250k char) restano a un bulk-read/grep ricorsivo
  di distanza — caveat Phase-4, nessun nuovo meccanismo.
