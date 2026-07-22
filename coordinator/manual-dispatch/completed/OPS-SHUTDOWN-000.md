# OPS-SHUTDOWN-000 — Emergency Kill Switch

## Title

OPS-SHUTDOWN-000 — Neutralizza auto-commit-push-shutdown.sh

## Description

Ferma e neutralizza immediatamente il meccanismo di auto-commit/auto-push/shutdown pericoloso. Non eseguire operazioni git. Crea sentinel e evidence log.

## Prompt

```text
AGENT
OPS-SHUTDOWN-000 — Emergency Kill Switch

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `coordinator-mandate` e il piano `src/docs/docs/coordinator/ops_shutdown_implementation_plan.md` prima di iniziare. Questo task è EMERGENZA ed esegui in isolamento: nessun'altra fase OPS-SHUTDOWN può partire in parallelo.

OBIETTIVO
Neutralizzare immediatamente il meccanismo di auto-commit/auto-push/shutdown pericoloso. Non eliminare `auto-commit-push-shutdown.sh` (l'eliminazione è OPS-SHUTDOWN-001); spostarlo/disabilitarlo in modo che non sia eseguibile dal percorso originale.

FILE TARGET
- `auto-commit-push-shutdown.sh` → sposta in `archive/legacy_shutdown/auto-commit-push-shutdown.sh.DISABLED`
- [nuovo] `SHUTDOWN_DISABLED.sentinel`
- [nuovo] `test-results/ops-shutdown-000-emergency-2026-07-22.log`

COMANDI DA ESEGUIRE
1. Ferma processi in esecuzione:
   ps aux | grep -E 'auto-commit-push|auto-commit-only|coordinator_watch|start_coordinator_watch' | grep -v grep
   per ogni match, esegui `kill -9 <PID>` (se il processo esiste).
2. Neutralizza `auto-commit-push-shutdown.sh`:
   mkdir -p archive/legacy_shutdown
   mv auto-commit-push-shutdown.sh archive/legacy_shutdown/auto-commit-push-shutdown.sh.DISABLED
   chmod -x archive/legacy_shutdown/auto-commit-push-shutdown.sh.DISABLED
3. Verifica scheduler e riferimenti:
   crontab -l | grep -i -E 'shutdown|auto|commit|push'
   launchctl list | grep -i -E 'shutdown|auto|commit|push'
   grep -R "auto-commit-push-shutdown.sh" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=archive
   grep -R "auto-commit-only.sh" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=archive
   grep -R "start_coordinator_watch.sh" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=archive
   grep -R "coordinator_watch.py" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=archive
   grep "auto-commit-push-shutdown.sh\|auto-commit-only.sh\|autospegnimento.sh" ~/.zshrc ~/.bashrc ~/.bash_profile 2>/dev/null
4. Verifica:
   ls -la auto-commit-push-shutdown.sh 2>&1
   ls -la archive/legacy_shutdown/auto-commit-push-shutdown.sh.DISABLED 2>&1
   ps aux | grep -E 'auto-commit-push|auto-commit-only|coordinator_watch|start_coordinator_watch' | grep -v grep

FORBIDDEN
- `git reset --hard`
- `git clean -fd`
- `git commit`
- `git push`
- Eliminare `auto-commit-push-shutdown.sh` (solo spostamento/rinomina)
- Modificare file sorgente non correlati
- Creare un nuovo meccanismo di shutdown

EVIDENCE LOG
Crea `test-results/ops-shutdown-000-emergency-2026-07-22.log` con:
- timestamp di inizio/fine
- output di `ps aux` prima e dopo
- output di `crontab -l` e `launchctl list`
- output delle verifiche `ls -la`
- output del grep ricorsivo
- note su eventuali processi terminati

SENTINEL
Crea `SHUTDOWN_DISABLED.sentinel` con:
- timestamp ISO
- motivo: "Emergency kill switch OPS-SHUTDOWN-000"
- puntatore a `src/docs/docs/plans/global_session_shutdown_manager_plan_v2.md`
- percorso originale disabilitato

SAFEGUARDS
- `npm run kanban:lint` (timeout 30s)
- Nessun build/test richiesto per questa fase

NOTE
- Al completamento: `KANBAN STATUS: OPS-SHUTDOWN-000 – Completato (Evidence: test-results/ops-shutdown-000-emergency-2026-07-22.log)`
- Il coordinator verificherà l'evidence log prima di accodare OPS-SHUTDOWN-001.
```

## Dependencies

None

## Executor

manual (Cascade) — local shell emergency execution

## Timestamp

2026-07-22
