# Overnight Safety Runner — Strategist Plan

**Task ID:** OPS-OVERNIGHT-001  
**Date:** 2026-07-23  
**Origine:** Critica esterna al piano `OPS-SHUTDOWN` + audit `DISPATCH-OPS-SHUTDOWN-READINESS-REPORT.md`  
**Goal:** Fornire un ponte operativo per stanotte: un runner isolato, fail-closed, che avvolga un batch di comandi, garantisca terminazione entro timeout per task e globale, e produca un log di prova. Non sostituisce il Global Session Shutdown Manager; ne è un precursore a scopo ops.

---

## 1. Contesto e valutazione della proposta

### 1.1 Critica ricevuta (sintesi)

ChatGPT ha proposto di non implementare tutto il sistema `OPS-SHUTDOWN` in una notte, ma di costruire un MVP chiamato **Overnight Safety Runner** con un solo obiettivo: lanciare un batch di agenti/test, andare a dormire, e avere la certezza che il processo si fermi da solo quando il lavoro finisce o quando qualcosa si blocca troppo a lungo.

Componenti proposti:

- orchestratore unico;
- heartbeat osservabile (inattività per X minuti = STUCK);
- hard timeout per task;
- timeout globale;
- shutdown condition automatica (tutti terminati, task bloccato, errore, timeout globale);
- log persistente;
- niente decision engine complesso, n UNKNOWN, niente lease/claim;
- ipotesi di partire da `sequential_runner.py` se esiste.

### 1.2 Valutazione fatta da questo strategist

- **`sequential_runner.py` non esiste nel repository.** I runner più vicini sono:
  - `scripts/run_with_timeout.py` — single command, timeout semplice, no process group, no batch, no heartbeat, no log strutturato.
  - `src/balancing/stressTesting/StressTestRunner.ts`, `src/balancing/archetype/BatchTestRunner.ts` — TypeScript, specifici per balancing/tests, non adatti a wrappare comandi shell Python/Node arbitrari.
- La proposta è **architetturalmente corretta**: stanotte serve un guardrail esterno, non il sistema canonico `Coordinator`/`Execution Runtime`/`shutdownManager`.
- Il Global Session Shutdown Manager (`OPS-SHUTDOWN`) resta il target a medio termine. Questo runner ne è una **prova di concetto operativa**.
- Il runner **deve essere fail-closed**: se qualcosa va storto, uccide il process group ed esce con codice != 0.
- Il runner **non deve chiamare `shutdown`/`poweroff`/`halt`/`osascript`/`pmset`** (`.windsurf/rules/50-shutdown-governance.md`). La "shutdown finale" è la terminazione del process group e l'exit del runner, non lo spegnimento della macchina.
- Nessuna nuova entità canonica (`Execution`, `Attempt`, `Claim`, `Lease`, `Heartbeat`) deve essere introdotta.

---

## 2. Scope e non-goals

### 2.1 In scope (MVP per stanotte)

1. Nuovo script Python `scripts/overnight_runner.py`.
2. Configurazione JSON-first per batch, timeout, heartbeat e logging.
3. Esecuzione sequenziale (default) o parallela (opzionale) di comandi shell.
4. Progress `[N/TOTAL]` stampato live.
5. Streaming stdout/stderr live + log persistente strutturato.
6. Per-task timeout con escalation SIGTERM → SIGKILL su process group.
7. Inactivity / heartbeat timeout: se un task non produce output per X secondi, è marcato STUCK e ucciso.
8. Global timeout: se l'intero batch supera Y secondi, il runner uccide il task corrente ed esce.
9. Exit code affidabile:
   - `0` se tutti i task passano;
   - `1` se un task fallisce/timeout/stuck;
   - `2` se il runner stesso incontra un errore o scatta il global timeout.
10. Dry-run con processi fittizi (completamento, blocco infinito, errore, timeout) per dimostrare che termina sempre.
11. Report di fine esecuzione (`test-results/overnight-runner-{timestamp}.log` + `.json` summary).

### 2.2 Out of scope

- Integrazione con `Coordinator`, `Strategist`, `ProjectRunner`, `Execution Runtime`.
- Integrazione con `scripts/shutdownManager/sessionRegistry.ts`.
- Decision engine `canShutdown()`.
- Idle detection utente (`getUserIdleMs`).
- Chiamata di sistema `shutdown`/`poweroff`/`halt`/`osascript`/`pmset`.
- GUI, i18n, skin, persistence applicativa.
- Riuso/duplicazione di runner TypeScript esistenti di balancing.
- Modifica di `scripts/run_with_timeout.py` (può essere citato come riferimento, non toccato).

---

## 3. Design minimale

### 3.1 Entry point

```bash
python3 scripts/overnight_runner.py --config path/to/overnight_batch.json
```

### 3.2 File principali

| File | Scopo |
|------|-------|
| `scripts/overnight_runner.py` | Entry point, parser CLI, orchestratore. |
| `scripts/overnight_runner/config.py` | Caricamento e validazione config JSON. |
| `scripts/overnight_runner/runner.py` | Logica di esecuzione, process group, timeout, heartbeat, log. |
| `scripts/overnight_runner/default.config.json` | Valori di default (config-first). |
| `test-results/overnight-runner-{timestamp}.log` | Log testuale della run. |
| `test-results/overnight-runner-{timestamp}.json` | Summary machine-readable. |
| `test-results/overnight-runner-dryrun-{timestamp}.log` | Prova dry-run. |

### 3.3 Config JSON

```json
{
  "version": "1.0",
  "mode": "sequential",
  "global_timeout_seconds": 14400,
  "grace_period_seconds": 10,
  "log_dir": "test-results",
  "tasks": [
    {
      "id": "lint",
      "command": "npm run lint",
      "timeout_seconds": 600,
      "inactivity_timeout_seconds": 300,
      "heartbeat_pattern": null
    },
    {
      "id": "harness-batch",
      "command": "npm run harness:dispatch -- --wave 1",
      "timeout_seconds": 1800,
      "inactivity_timeout_seconds": 600,
      "heartbeat_pattern": "completed|DONE|heartbeat"
    }
  ]
}
```

Regole:

- `global_timeout_seconds`: limite totale della run. Default `14400` (4h).
- `timeout_seconds`: wall-clock massimo per singolo task.
- `inactivity_timeout_seconds`: se il task non scrive nulla su stdout/stderr per questo tempo, è STUCK. Default = `timeout_seconds`.
- `heartbeat_pattern`: regex opzionale; ogni match su stdout/stderr resetta il timer di inattività. Se omesso, qualsiasi output resetta il timer.
- `mode`: `sequential` per stanotte; `parallel` può essere un'opzione futura, ma per l'MVP usare sequenziale per semplicità e per evitare conflitti su file target.

### 3.4 Process group termination

1. Lanciare ogni comando con `subprocess.Popen(..., start_new_session=True)`.
2. In questo modo il PID del figlio è anche il PGID del nuovo process group.
3. Al per-task timeout o inactivity timeout:
   - `os.killpg(pgid, signal.SIGTERM)`;
   - attendere `grace_period_seconds`;
   - se ancora vivo, `os.killpg(pgid, signal.SIGKILL)`.
4. Gestire `SIGINT`/`SIGTERM` del runner stesso: inoltrare al process group del task corrente, poi cleanup ed exit.
5. Il runner rimane in ascolto di stdout/stderr in thread separati per rilevare output/heartbeat senza bloccare il timer globale.

### 3.5 Log e heartbeat

- Ogni task logga:
  - `STARTED <id> <timestamp>`
  - `HEARTBEAT <id> <timestamp>` (su ogni output o su match pattern)
  - `PASS <id> <exit_code> <duration>`
  - `FAIL <id> <exit_code> <duration>`
  - `TIMEOUT <id> <reason> <duration>`
  - `KILLED <id> <signal> <duration>`
- Alla fine: `SUMMARY total=N passed=X failed=Y timed_out=Z stuck=W exit_code=E`.

### 3.6 Dry-run obbligatorio

Prima di usare il runner in produzione, l'agente implementatore deve eseguire un dry-run con processi fittizi:

1. **Completa** — comandi che terminano in 1-2s.
2. **Blocco infinito** — `sleep 10000`; deve essere ucciso dal per-task timeout.
3. **Errore** — `exit 1`; runner deve registrare FAIL ed eventualmente continuare/fermarsi secondo `fail_fast`.
4. **Timeout globale** — due task `sleep 10000` con `global_timeout_seconds` basso; il secondo non deve nemmeno partire o deve essere abortito.
5. **Inactivity/stuck** — processo che scrive un heartbeat all'inizio e poi tace; deve essere ucciso per inattività.

### 3.7 Modalità "overnight"

- Non richiede input utente.
- Stampa progress ogni N secondi anche se non c'è output (`progress_interval_seconds`, default 30s).
- Scollega stdin dal TTY del processo figlio (`stdin=DEVNULL`) per evitare che il processo figlio aspetti input.
- Non apre browser, non richiede GUI.

### 3.8 Eventuale callback finale

- Opzione `on_complete` nella config: comando da eseguire dopo il cleanup finale.
- **Restrizione**: non deve essere utilizzato per chiamare `shutdown`/`poweroff`/`halt`/`osascript -e 'tell application "System Events" to shut down'`/`pmset sleep`/`sudo shutdown` o equivalenti (`.windsurf/rules/50-shutdown-governance.md`).
- Se il callback fallisce, il runner logga un warning ma esce comunque con il proprio exit code determinato dai task.
- Per stanotte si consiglia di non impostare `on_complete` oppure di usarlo solo per notifiche/testuali (es. `say` o `osascript display notification`).

---

## 4. Fasi e milestones

### Fase 1 — Skeleton (15 min)

- Creare `scripts/overnight_runner.py` con argparser `--config` e `--dry-run`.
- Creare `scripts/overnight_runner/default.config.json`.
- Loggare `SUMMARY` vuoto e uscire.

### Fase 2 — Config loader (15 min)

- Caricare JSON, validare con `jsonschema` o con dataclass + controlli manuali.
- Aprire `default.config.json` come fallback per chiavi mancanti.
- Bloccare config con `shutdown`/`poweroff`/`halt`/`osascript`/`pmset` nei comandi (static guard semplice). Ciò rispetta `50-shutdown-governance.md` e protegge da errori di copia-incolla.

### Fase 3 — Single task execution (30 min)

- `subprocess.Popen` con `start_new_session=True`.
- Thread reader per stdout/stderr.
- Per-task timeout con `SIGTERM` → attesa `grace_period` → `SIGKILL`.
- Cattura exit code.

### Fase 4 — Inactivity / heartbeat watchdog (20 min)

- Timer che scatta se nessun output (o nessun match `heartbeat_pattern`) entro `inactivity_timeout_seconds`.
- Uccisione del process group come sopra.

### Fase 5 — Sequential batch + global timeout (20 min)

- Loop su `tasks`;
- `global_timeout` come timer assoluto dall'avvio;
- se scatta, uccidi il task corrente ed esci.
- Opzione `fail_fast` (default `true`): se un task fallisce/timeout/stuck, termina subito.

### Fase 6 — Progress, log, summary (20 min)

- Stampa `[N/TOTAL] <id> <status>` live.
- Scrivere `.log` e `.json` in `test-results/`.
- Gestire `SIGINT`/`SIGTERM`.

### Fase 7 — Dry-run e report (30 min)

- Script `scripts/overnight_runner/dryrun.py` che genera config fittizio e invoca il runner.
- Verifica: tutti e 5 gli scenari producono terminazione entro i limiti.
- Generare `test-results/overnight-runner-dryrun-{timestamp}.log`.

---

## 5. Rischi e mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| Processi figli spawnano nipoti che scappano dal process group | `start_new_session=True` + `killpg` riduce il rischio; per daemonizzatori espliciti usare `psutil` come fallback per kill tree (opzionale). |
| `SIGTERM` ignorato da processo figlio | `grace_period_seconds` breve (10s) poi `SIGKILL`. |
| Task silenzioso ma sano ucciso per inattività | `inactivity_timeout_seconds` configurabile; default = `timeout_seconds` (non più aggressivo del timeout). |
| Global timeout non uccide il task corrente | Implementare il check in un thread watchdog separato che segnala al main loop. |
| Runner crash lascia processi orfani | `try/finally` + `atexit` + signal handlers che inoltrano segnali. |
| Config contiene comandi di shutdown | Static guard che blocca stringhe proibite in `command`/`on_complete`. |

---

## 6. Safeguards

- `npm run kanban:lint` (30s) — per verificare che l'aggiunta in `agent_assignments.md` e `strategy_tasks.md` non rompa il kanban.
- Nessun `build:check` necessario (solo script Python).
- `python3 scripts/overnight_runner.py --dry-run` deve passare prima del merge.
- `scripts/shutdown:lint-capability` non è ancora disponibile; si userà un grep locale per verificare che nessun nuovo file contenga chiamate a `shutdown`/`poweroff`/`halt`/`osascript`/`pmset`.

---

## 7. Documentazione e tracciamento

- Nuovo piano: `src/docs/docs/plans/overnight_safety_runner_plan.md` (questo file).
- Prompt implementativo: `prompts/OPS-OVERNIGHT-001.spec.json`.
- Aggiornamento `src/docs/docs/coordinator/strategy_tasks.md` con riga `OPS-OVERNIGHT-001`.
- Aggiornamento `src/docs/docs/coordinator/agent_assignments.md` con riga `Non assegnato`.
- Una volta implementato, il runner produce i propri evidence log in `test-results/`.

---

## 8. Relazione con OPS-SHUTDOWN

| Fase OPS-SHUTDOWN | Stato attuale | Come si collega a Overnight Runner |
|-------------------|---------------|------------------------------------|
| 000 Kill switch | ✅ Completato | Il runner non può e non deve bypassare la neutralizzazione. |
| 001 Audit | ✅ Completato | Il runner è un nuovo file; non deve contenere call site proibiti. |
| 002 Registry | ✅ Completato | **Non** integrato stanotte; il runner scrive il proprio log locale. |
| 003 canShutdown | ❌ Mancante | Il runner non lo implementa; termina su timeout/errori in modo fail-closed. |
| 004 Idle detection | ❌ Mancante | Il runner usa inactivity/heartbeat basata su output, non idle macchina. |
| 005 Manager + Executor | ❌ Mancante | Dopo stanotte, il runner può diventare un client del registry/executor. |
| 006 Integrazioni | ❌ Mancante | Dopo stanotte, Coordinator/Harness/Manual possono registrare sessioni. |
| 009 Lint capability | ❌ Mancante | Per stanotte, un grep locale sul runner è sufficiente. |

---

## 9. Criteri di successo

1. `python3 scripts/overnight_runner.py --dry-run` termina entro 60 secondi e tutti gli scenari producono `PASS`/`TIMEOUT`/`KILLED` come atteso.
2. Il runner esegue un batch reale di 2-3 comandi `sleep` e `echo` senza errori.
3. Un task `sleep 1000` con `timeout_seconds=5` viene `KILLED` e il runner esce con codice 1.
4. Un task che non produce output per `inactivity_timeout_seconds` viene `STUCK` e `KILLED`.
5. `global_timeout_seconds=10` con due task `sleep 1000` blocca il runner entro 10s.
6. Nessuna stringa `shutdown`/`poweroff`/`halt`/`osascript`/`pmset` appare nel codice del runner (a parte nei commenti di governance).
7. `kanban:lint` passa dopo l'aggiornamento dei documenti di tracciamento.

---

## 10. Note al coordinator

- Assegnare a un agente Python/ops con execution_hint `verified`.
- Non accavallare con `OPS-SHUTDOWN-003`+: questa è una task a sé, non un'implementazione del decision engine.
- Non permettere all'agente di modificare `Coordinator`, `Strategist`, `ProjectRunner`, `Execution Runtime`, `scripts/shutdownManager/**` o `scripts/run_with_timeout.py`.
- Verificare esplicitamente il dry-run prima di dichiarare completato.
- Se l'agente propone di aggiungere una chiamata a `osascript` per spegnere il Mac, rifiutare e citare `.windsurf/rules/50-shutdown-governance.md`.

---

## 11. Handoff al Coordinator

Il prompt implementativo e pronto nei seguenti artifact:

- `src/docs/docs/plans/overnight_safety_runner_plan.md` — piano completo (questo file).
- `prompts/OPS-OVERNIGHT-001.spec.json` — specifica strutturata per parsing automatico.
- `coordinator/manual-dispatch/pending/OPS-OVERNIGHT-001.md` — dispatch card manuale.
- `src/docs/docs/coordinator/strategy_tasks.md` — riga di tracciamento `OPS-OVERNIGHT-001`.
- `src/docs/docs/coordinator/agent_assignments.md` — riga Kanban `Non assegnato` con prompt completo.

### Azioni richieste al coordinator

1. Assegnare `OPS-OVERNIGHT-001` a un agente Python/ops.
2. Verificare che l'agente non modifichi file al di fuori di `scripts/overnight_runner/**` e `test-results/`.
3. Richiedere l'evidence log `test-results/overnight-runner-dryrun-<timestamp>.log` prima di segnare `Completato`.
4. Non permettere integrazione con `scripts/shutdownManager/**` in questa fase.

---

## 12. Chiusura

- **Stato:** Completato
- **Data chiusura:** 2026-07-23
- **Agent:** Cascade (manual executor)
- **Evidence:**
  - `test-results/overnight-runner-dryrun-20260723T205155Z.log`
  - `test-results/overnight-runner-dryrun-20260723T205155Z.json`
  - `test-results/overnight-runner-20260723T193228Z.log` (default empty config run)
  - `test-results/overnight-runner-verify-20260723T201556Z.log` (success-criteria harness)
- **Risultati dry-run:**
  - `complete` → PASS
  - `hang` → TIMEOUT (per-task timeout)
  - `error` → FAIL (exit 1)
  - `stuck` → STUCK (inactivity/heartbeat timeout)
  - `global_1` → TIMEOUT (global timeout, runner exit 2)
- **Success criteria verification (`scripts/overnight_runner/verify.py`):**
  - `real_batch` → PASS (exit 0, 3 tasks `sleep`/`echo`)
  - `per_task_timeout` → PASS (exit 1, `sleep 1000` killed in 5s)
  - `global_timeout` → PASS (exit 2, two `sleep 1000` blocked within 10s)
- **Safeguards:**
  - `kanban:lint` passato (37 prompt validati)
  - Grep locale: zero call site `shutdown`/`poweroff`/`halt`/`osascript`/`pmset` in `scripts/overnight_runner/**`
- **Note:** Il runner è un ponte isolato e non integra `Coordinator`, `Strategist`, `ProjectRunner`, `Execution Runtime`, `shutdownManager` o entità canoniche (`Execution`, `Attempt`, `Claim`, `Lease`, `Heartbeat`).
- **Miglioramento robustezza:** `_kill` ora raccoglie ricorsivamente i discendenti con `pgrep -P`, invia `SIGTERM`/`SIGKILL` al process group e ai singoli PID, e chiude `stdout`/`stderr` per sbloccare i reader thread (mitigazione del problema noto di `subprocess` con pipe e processi figli che sopravvivono).
