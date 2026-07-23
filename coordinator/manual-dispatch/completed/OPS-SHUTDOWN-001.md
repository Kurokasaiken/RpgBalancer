# OPS-SHUTDOWN-001 — Legacy Reference Audit & Classification

## Title

OPS-SHUTDOWN-001 — Legacy shutdown / auto-commit / auto-push reference cleanup

## Description

Audit completo di ogni riferimento legacy a spegnimento automatico, auto-commit, auto-push e watcher idle. Prima di modificare o cancellare qualsiasi cosa, produrre una mappa di classificazione esaustiva.

## Prompt

```text
AGENT
OPS-SHUTDOWN-001 — Legacy Reference Audit & Classification

ISTRUZIONI
Gli invariants e il piano `src/docs/docs/coordinator/ops_shutdown_implementation_plan.md` sono obbligatori.
Fase 1 (obbligatoria): non modificare file sorgente, non cancellare file, non bloccare processi. Prima produrre una mappa completa dei riferimenti legacy e classificarli.
Fase 2 (solo dopo approvazione esplicita dell'utente): agire sulla base della classificazione.

OBIETTIVO
Mappare e classificare ogni riferimento a:
- auto-commit-push-shutdown.sh (anche .DISABLED)
- auto-commit-only.sh
- ai-worker/autospegnimento.sh
- ai-worker/coordinator_watch.py
- ai-worker/start_coordinator_watch.sh
- ai-worker/README_WATCH.md
- shutdown / poweroff / halt / pmset / osascript shut down / sudo shutdown
- auto-commit, auto-push, idle watcher

AMBITO DI RICERCA
1. Repository root e sotto-directory (incluso .claude/worktrees/ se presente).
2. package.json (scripts).
3. .github/workflows/*.
4. Makefile (se esiste).
5. ~/.zshrc, ~/.bashrc, ~/.bash_profile.
6. crontab -l.
7. launchctl list e ~/Library/LaunchAgents/.
8. tests/ e files di fixture che assumono il vecchio comportamento.
9. src/docs/docs/operations/guardian_autopush_mandate.md e altri documenti che descrivono ancora il meccanismo come operativo.

CLASSIFICAZIONE OBBLIGATORIA
Per ogni riferimento trovato, assegnare ESATTAMENTE una delle seguenti categorie:
- ACTIVE: percorso di esecuzione attivo in grado di invocare shutdown / auto-commit / auto-push. Non rimuovere in questa fase; segnalare e bloccare nella Fase 2.
- DEAD: codice/script legacy non più eseguibile o non invocato da nessun percorso attivo. Rimovibile in Fase 2.
- DOCUMENTATION: documento o specifica che descrive il vecchio meccanismo. Da aggiornare o deprecare in Fase 2.
- HISTORICAL: artefatto storico (log, evidence, file archiviato) da conservare immutato e marcare come legacy.
- FALSE_POSITIVE: match accidentale (es. stringa in commento, nome variabile non correlata, file non eseguibile).

REGOLA
Non cancellare ciò che non è ancora stato classificato.

FILE TARGET (per la classificazione, non la modifica in Fase 1)
- ai-worker/autospegnimento.sh
- ai-worker/coordinator_watch.py
- ai-worker/start_coordinator_watch.sh
- ai-worker/README_WATCH.md
- ai-worker/last_activity.json
- archive/legacy_shutdown/auto-commit-push-shutdown.sh.DISABLED
- scripts/autoCommit/commitFailureMonitor.js
- scripts/guardian/vercelDeploymentGuard.ts
- src/docs/docs/operations/guardian_autopush_mandate.md
- test_shutdown_verification.sh, shutdown.log, shutdown_when_done.log, shutdown.pid (se esistono)
- package.json, .github/workflows/*, Makefile
- .claude/worktrees/*/ai-worker/* (se presenti)

FORBIDDEN IN FASE 1
- git reset --hard, git clean -fd, git commit, git push
- Cancellare qualsiasi file
- Modificare file sorgente
- Creare nuovi meccanismi di shutdown
- Eseguire shutdown, kill di processi non pericolosi, o disabilitare servizi senza autorizzazione
- Sostituire il vecchio meccanismo con uno nuovo

EVIDENCE LOG
Crea `test-results/ops-shutdown-001-audit-<YYYY-MM-DD>.log` contenente:
- timestamp di inizio/fine
- comandi eseguiti
- elenco completo dei riferimenti trovati, con percorso, riga, snippet, categoria e motivazione
- mappa riassuntiva per categoria (ACTIVE, DEAD, DOCUMENTATION, HISTORICAL, FALSE_POSITIVE)
- note su percorsi di esecuzione attivi e sulle decisioni proposte per la Fase 2
- output di `launchctl list | grep -i -E 'shutdown|auto|commit|push'`
- output di `crontab -l | grep -i -E 'shutdown|auto|commit|push'`
- output di `grep` ricorsivo in package.json e .github/workflows

SAFEGUARDS FASE 1
- `npm run kanban:lint` (timeout 30s)
- Nessun build/test richiesto per la sola classificazione

NOTE
- Al termine della Fase 1: `KANBAN STATUS: OPS-SHUTDOWN-001 – Audit completato, in attesa di decisione per la rimozione (Evidence: test-results/ops-shutdown-001-audit-<YYYY-MM-DD>.log)`
- Non passare alla Fase 2 senza conferma dell'utente.
```
