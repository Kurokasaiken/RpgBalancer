# Auto-Commit Guardian – Commit Failure Playbook

Questa guida spiega il flusso del guardiano automatico che interviene quando `auto_commit_push.sh` non riesce a completare un commit/push a causa di lint/test/build errors.

## Flusso

1. **Trigger** – Lo script auto-commit rileva `git commit` o `git push` con exit code ≠ 0.
2. **Invocazione** – Viene eseguito:
   ```bash
   node scripts/autoCommit/commitFailureMonitor.js \
     --stage <commit|push> \
     --branch <BRANCH> \
     --commit-message "<msg>" # solo per stage commit
   ```
   Il monitor salva i log in `test-results/auto-commit-guardian/<timestamp>-<stage>.log`.
3. **Diagnosi** – Il monitor lancia in sequenza:
   - `npm run lint`
   - `npm run test`
   - `npm run build:check`
   - `npm run kanban:lint`
4. **Fix** – Durante la diagnosi vengono applicati i fix necessari (config-first, persistence async, zero hardcode). I log vengono appendati automaticamente.
5. **Retry**
   - Stage `commit`: `git add -A`, `git commit -m "<msg>"`.
   - Stage `push`: `git push origin <branch>`.
6. **Esito**
   - Se tutto ok: log “Guardian completato”.
   - Se fallisce una diagnosi o il retry: guard terminato con exit 1, log completo per intervento manuale.

## Note operative

- Prima di lanciare manualmente il guardian, assicurarsi di aver attivato Node 20.19.6 (`source ~/.nvm/nvm.sh && nvm use`).
- Tutti gli script usano `test-results/auto-commit-guardian/` come radice, così i log sono facilmente consultabili o archiviabili.
- Non modificare `auto_commit_push.sh` per disattivare il guardian; fa parte del protocollo di salvaguardia.
- Se il guardian fallisce due volte di fila, aprire ticket e allegare il log corrispondente.
