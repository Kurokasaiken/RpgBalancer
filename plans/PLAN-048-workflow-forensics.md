# PLAN-048: Workflow forensics — ledger di fase da artefatti esistenti (R-217)

**Status:** `implemented` — battezzato 2026-10-18, in verifica safeguard
**Richiesta:** R-217 (*"devo capire xè i miei agenti sn così lenti a scrivere
codice, nonostante abbiamo già dei plan [...] 1) capire cosa ci fa perdere +
tempo (creare i plan? scrivere codice? burocrazia? aggiornare la
documentazione?) 2) capire come ottimizzare/qual è il problema 3) ottenere
automaticamente queste informazioni, senza dover tornare io in questa
discussione"*)
**Direzione scelta (Director, 2026-10-18):** opzione A — ledger forense da
artefatti esistenti, **zero nuove obbligazioni per gli agenti**.
**Relazioni:** estende `scripts/planTime.ts` (ledger `context/plan-timing.jsonl`,
R-208 — oggi solo 2 plan stampati, di cui 1 retroattivo: prova che lo stamp
manuale non scala); misura il workflow single-agent v31 (R-208) senza
riattivare kanban/dispatch; complementare a PLAN-039/PLAN-041 (benchmark
esecutori esterni — quelli misurano lane esterne, questo misura il ciclo
reale dell'agente locale); rispetta il mapping layer di PLAN-044
(`scripts/metrics/**` = nuova superficie, serve `mapping:propose`).

## 1. Diagnosi

La domanda "dove va il tempo" non è rispondibile oggi perché:

- `plan:stamp` è manuale → ledger sparse (2 plan su ~15 recenti);
- i transcript dell'agente locale non sono accessibili (verificato:
  `windsurfSessionHandoff.db` vuoto, niente trajectory queryable);
- ma il workflow lascia **eventi timestamped veri**: commit git (messaggi con
  `PLAN-NNN`/`R-NNN` + file toccati), `bundle.json` → `produced_at`,
  `plans/PLAN-*.md` (commit di creazione = plan scritto), `RICHIESTE.md`
  (creazione voce, transizione `fatta`), run di dibattito in
  `mind-weaver/.mw/runs/<run>/` (`events.jsonl`, `state.json`, artifact
  `artifact-rNNN.md`, `conversations/*.jsonl`).

Quindi: ricostruzione forense deterministica — legge gli artefatti, non chiede
niente a nessuno. Limite dichiarato (da stampare in testa al report):
**wall-clock tra eventi ≠ tempo-agente**; gli intervalli senza artefatti sono
etichettati `wait` (attesa Director / pausa / contesto perso), non "lavoro".

## 2. Invarianti (non eludibili)

- **Zero nuova burocrazia**: nessun evento richiede azione dell'agente o del
  Director. Tutto derivato da ciò che esiste già. (Se un giorno servirà
  granularità intra-sessione, sarà una fase 2 con opt-in esplicito.)
- **T-06**: il report è una vista derivata; il ledger atomico
  (`context/workflow-timing.jsonl`) è la fonte. Coverage check per entità:
  ogni evento usato nel report è nel ledger; scarti loggati col motivo.
- **T-13**: il miner è **read-only su git**; scrive solo
  `context/workflow-timing.jsonl`, `context/WORKFLOW_METRICS.md` e riempie i
  buchi di `context/plan-timing.jsonl`. File sporchi di sessioni parallele:
  mai toccati (legge `git log`, non il worktree).
- **Niente gate**: non si toccano `scripts/verification/**`, `closureLint`,
  `contractsCheck` ecc. (`GATE_FILES` → servirebbe `director:answer
  --gate-diff`; fuori scope v1).
- Nessuna scelta di ottimizzazione nel codice: il tool **misura e riporta**;
  la diagnosi è del Director sul report (punto 2 della richiesta = artefatto
  del report "top time sinks", non una decisione automatica).

## 3. Fasi e euristiche di attribuzione

Per ogni entità `R-NNN` / `PLAN-NNN` nella finestra (default: ultimi 45gg,
flag `--since`):

| Fase | Da evento | A evento |
|---|---|---|
| `intake` | commit che aggiunge `## R-NNN` in RICHIESTE | primo commit di `plans/PLAN-NNN*.md` (o ultimo artifact dibattito) |
| `debate` | primo evento `events.jsonl` del run di dibattito linkato | ultimo artifact `artifact-rNNN.md` / `state.json converged` |
| `implementation` | battesimo (nota `battezzato` in RICHIESTE/plan o primo commit non-doc che cita l'entità) | `bundle.json` `produced_at` del run associato |
| `verification+closure` | `produced_at` bundle | commit che porta la voce a `fatta` |
| `wait` | gap `> waitGapMs` (default 45 min) tra eventi consecutivi | — |

Regole di attribuzione commit → entità: (1) `PLAN-NNN`/`R-NNN` nel subject;
(2) file toccati `plans/PLAN-NNN*`; (3) fallback: commit nel worktree durante
la finestra aperta dell'unica entità attiva (etichetta `confidence: low`).
Non attribuito → bucket `unattributed`, mai buttato via.

## 3b. Dentro `implementation` — la domanda vera

La fase `implementation` si scompone **per intervallo tra commit**, non per
conteggio: ogni intervallo tra due eventi consecutivi della stessa entità è
attribuito alla **classe del commit che lo chiude** (lavori → committi → il
tempo speso appartiene al tipo di lavoro committato). Classi:

| Classe | Regola sui path toccati |
|---|---|
| `code` | `src/**` (non-doc), `public/**` non-asset-doc |
| `tests` | `tests/**`, `*.test.*`, `*.spec.*` |
| `docs` | solo `*.md`, `context/**`, `src/docs/**`, `SESSION_HANDOFF`, `RICHIESTE`, `plans/` |
| `governance` | `scripts/verification/**`, `.windsurf/rules/**`, `.agents/skills/**`, `GATE_FILES` |
| `config` | config Zod, `*.json` dati, i18n resources |
| `mixed` | commit che toccano ≥2 classi (conta in ognuna, pesato per share di file) |
| `wait` | gap > `waitGapMs` senza eventi |

Il report per entità mostra l'implementation come `code X% · docs Y% ·
governance Z% · tests W% · wait K%` — è la risposta diretta a "burocrazia,
doc o codice?". Aggregato su tutta la finestra = il sink principale.

## 3c. Correlazione: dettaglio del plan → velocità di implementazione

Per rispondere a "un plan più preciso riduce il tempo di scrittura codice?"
il miner estrae per ogni plan un **richness score** da segnali oggettivi:

- righe/sezioni del file plan al commit di battesimo (`git show`);
- n. obbligazioni nel contratto di verifica;
- n. ruling verbatim del Director citati nel plan;
- n. round di dibattito (`artifact-rNNN` count nel run linkato);
- n. file-target nominati nel plan.

Il report include una tabella `plan → richness → implementation wall-clock
→ share code` e un **rank-correlation** (Spearman, n piccolo → marcata
"direzionale, non statistica"). Se i plan più ricchi hanno implementazioni
più corte, il dato lo mostra; se no, lo mostra comunque — è un risultato,
non un fallimento del tool.

**Proxy di rework**: commit `fix(`/`fixup` dopo il primo bundle, n. bundle
prodotti per la stessa entità, run rossi in `.mw/red-first.jsonl` — segnale
"il plan non bastava" indipendente dal wall-clock.

## 4. Task

| Task | Contenuto | Depends |
|---|---|---|
| T-001 | `scripts/planForensics.ts` — miner: `git log --format + --name-only`, parser RICHIESTE/plans/runs, classificatore commit→classe (§3b), emissione `context/workflow-timing.jsonl` (schema validato) + backfill `open`/`close` mancanti in `plan-timing.jsonl` | — |
| T-002 | Report `context/WORKFLOW_METRICS.md`: (a) tabella per-entità con implementation scomposta `code/docs/governance/tests/wait` (§3b); (b) sezione correlazione richness→implementation (§3c) con Spearman marcato "direzionale"; (c) top-3 sink aggregato; disclaimer wall-clock; `npm run metrics:report` | T-001 |
| T-003 | Auto-delivery: `plan:stamp` (open/close/note/report) rigenera il report in coda alla sua azione (`planTime.ts` non è gate-file); report sempre rigenerabile on-demand | T-002 |
| T-004 | Test unitari su fixture sintetiche (git log finto, run-dir finto): attribuzione R→commit, classificazione code/docs/governance/mixed, gap→`wait`, span dibattito da `events.jsonl`, richness score da plan finto, robustezza a dati mancanti | T-001 |
| T-005 | Dogfood: run reale sul repo; cross-check PLAN-040 (ledger dice 2h55m — forensics deve confermare l'ordine di grandezza) + PLAN-042; evidence log in `test-results/` | T-002 |
| T-006 | `mapping:propose` per `planForensics`/`metrics` nuova superficie + `context/workflow-*` → Director approva; INDEX.md + docs sync | T-001 |

## 5. Delivery automatica (punto 3 della richiesta)

Default scelto (reversibile al battezzo): **report file nel repo sempre
fresco** — rigenerato a ogni `plan:stamp` e on-demand via `metrics:report`;
nessuna notifica push (Telegram bridge esiste: candidato fase 2 se il report
risulta consultato raramente).

## 6. Contratto di verifica (obbligazioni, `verify:bundle`)

- OB-1: `npm run metrics:report` produce `context/workflow-timing.jsonl` +
  `context/WORKFLOW_METRICS.md` in modo deterministico (stesso input → stesso
  output; prova: due run → diff vuoto).
- OB-2: il report attribuisce per entità le fasi `intake`/`debate`/
  `implementation`/`verification+closure` e scompone `implementation` per
  classe commit (`code`/`tests`/`docs`/`governance`/`config`/`mixed`/`wait`)
  con share %; ogni evento del report è presente nel ledger atomico
  (coverage check, T-06).
- OB-2b: il report include la sezione correlazione: per ogni plan con
  implementation misurata, `richness score` (segnali §3c) vs implementation
  wall-clock vs share `code`, con rank-correlation Spearman etichettata
  "direzionale, non statistica" e n minimo dichiarato.
- OB-3: test unitari sulle fixture coprono: attribuzione per subject e per
  path, classificazione docs vs code vs governance, gap→wait, dibattito da
  `events.jsonl`, entità senza bundle (mai crash, `null` esplicito).
- OB-4: `npm run plan:stamp -- note PLAN-XXX x` rigenera il report senza
  comando aggiuntivo (auto-delivery); `plan-timing.jsonl` backfillato per i
  plan con bundle ma senza stamp.
- OB-5: dogfood reale: il report mostra ≥5 entità recenti con fasi coerenti;
  PLAN-040 elapsed forense entro ±20% dello stamp manuale (2h55m) o
  divergenza spiegata nel report stesso.
- OB-6: nessun gate-file modificato; nessun nuovo obbligo per agenti (il
  diff non introduce step obbligatori in skill/rules — verificato a review).
- SAFE: `npm run lint -- scripts/planForensics.ts scripts/planTime.ts`,
  `npm run test -- <scope>`, `npm run build:check`, `npm run closure:lint`.

## 7. Rischi accettati

- **Wall-clock ≠ effort**: una sessione lasciata aperta gonfia le fasi.
  Mitigazione: bucket `wait` sui gap + disclaimer in testa al report.
- **Commit-time ≠ typing-time**: il tempo è attribuito alla classe del
  commit che *chiude* l'intervallo. Se l'agente scrive codice 1h e aggiorna
  doc 5min in un unico commit misto, la classe è `mixed` — il report mostra
  la quota `mixed` esplicitamente invece di fingere precisione. Se `mixed`
  domina, la granularità commit è insufficiente → fase 2 (strumentazione).
- **Correlazione su n piccolo** (~10-15 plan): Spearman è direzionale, la
  domanda "plan più ricchi → meno tempo" avrà una risposta *indicativa*, da
  riconfermare man mano che il ledger cresce — il report lo dichiara.
- **Attribuzione euristica**: commit senza ID ricadono in `unattributed`/
  `confidence: low`; il report mostra la quota non attribuita invece di
  nasconderla.
- **mind-weaver assente/spostato**: run dibattito irraggiungibili → fase
  `debate` = `null` esplicito, non stimato.

## 8. Note di implementazione (2026-10-18)

Divergenze rispetto al design iniziale, emerse in dogfood:

- **Sort temporale**: tutti gli ordinamenti e i confronti di boundary usano
  epoch ms, non stringa ISO — il ledger mescola offset `+02:00` (commit) e
  `Z` (stamp/bundle) e il confronto lessicografico produce ordini errati.
- **`unobserved` bucket**: intervalli dentro la finestra impl senza commit
  intermedi non sono `wait` — sono lavoro dentro sessione committato dopo
  (squash). È il bucket dominante (≈70% dell'impl osservata) ed è la risposta
  onesta a "dove va il tempo": **dentro le sessioni, non osservabile per
  commit** → eventuale fase 2 = telemetria intra-sessione o commit più fini.
- **`wait` fuori dalla finestra impl soltanto**: un gap >45min dentro
  implStart→implEnd è impl non osservata, non attesa.
- **Debate spans per-run**: gli span sono coppie (start,end) del singolo run
  con `durMs` sull'evento start — mai fusi tra run (PLAN-035 produceva uno
  span Aug→Oct falso). Fallback mtime solo su artefatti dibattito, cap 24h.
- **Recency fallback**: commit senza ID attribuiti all'entità con evento più
  recente ≤12h, `confidence: low`; altrimenti `unattributed` (esposto nel
  report, non nascosto).
- **Weak-row filter**: entità con sole menzioni in subject (<3 commit, nessun
  evento forte) restano nel ledger ma fuori dal report — elimina falsi
  positivi tipo `PLAN-20260803`.
- **`plan-created` da squash-commit**: quando il file plan atterra nel commit
  di implementazione (post-bundle), `implStart` ripiega su `debateEnd`.

Cross-check OB-5: PLAN-040 impl+verify forense = 2h55m vs stamp 2h55m (±0%);
PLAN-042 = 54m vs 53m stampato (divergenza <2%, da boundary implEnd≈bundle).

### Scomposizione intra-implementation (iter 2, 2026-10-18)

Domanda Director: "come è divisa implementazione". Due segnali reali aggiunti:

- **`verify-artifact` events**: mtime dei file prodotti dentro `.mw/runs/*`
  (command-logs, evidence, metrics, frames — esclusi artifact di dibattito).
  Un intervallo che *chiude* su un artifact conta `verification` solo se il
  precedente è anch'esso artifact (i burst di scrittura = verifica in corso;
  il gap prima del burst è lavoro, resta `unobserved`).
- **`mixSplit` (inferred)**: il tempo `unobserved` è distribuito sul mix di
  churn (`git show --numstat`, add+del per file→classe) dei commit di impl
  dell'entità — inclusi i squash-commit che atterrano post-chiusura
  (finestra estesa +24h). Etichettato `file-mix`: dice *cosa* è cambiato,
  non *quanto tempo* ha preso — i doc verbosi sovrastimano il proprio peso.

Risultato aggregato (dogfood 2026-10-18): impl si scompone in
`unobserved` 36% (di cui mix inferito: docs 41% · tests 20% · code 18%) ·
`verification` 32% (burst di produzione artefatti: test run, bundle,
screenshot) · `mixed` 1%. Lettura: **il costo dominante non è il codice —
è documentazione+test+cerimonia di verifica**; il 32% verification conferma
che il ciclo produce-bundles conta quanto un terzo del tempo di impl.
