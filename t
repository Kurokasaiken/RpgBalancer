ai-worker/autospegnimento.sh:3:# Script di autospegnimento - avvia il monitoraggio idle
ai-worker/autospegnimento.sh:7:echo "🚀 Avvio autospegnimento PC..."
ai-worker/coordinator_watch.py:14:SHUTDOWN_LOG_PATH = AI_WORKER_DIR / "shutdown.log"
ai-worker/coordinator_watch.py:48:def log_shutdown(reason: str) -> None:
ai-worker/coordinator_watch.py:49:    """Scrive una riga nel log di shutdown."""
ai-worker/coordinator_watch.py:57:def confirm_shutdown() -> bool:
ai-worker/coordinator_watch.py:58:    """Chiede conferma da TTY prima dello shutdown di una VM/macchina locale."""
ai-worker/coordinator_watch.py:63:        response = input("Confermi lo spegnimento del sistema? (s/n): ")
ai-worker/coordinator_watch.py:69:def get_poweroff_command() -> Optional[str]:
ai-worker/coordinator_watch.py:70:    """Restituisce il comando di shutdown appropriato per il sistema corrente."""
ai-worker/coordinator_watch.py:72:        return "sudo shutdown -h now"
ai-worker/coordinator_watch.py:74:        return "sudo systemctl poweroff"
ai-worker/coordinator_watch.py:79:def perform_shutdown(idle_minutes: float) -> None:
ai-worker/coordinator_watch.py:81:    Procedura di shutdown parametrica per ambiente.
ai-worker/coordinator_watch.py:87:    log_shutdown(reason)
ai-worker/coordinator_watch.py:100:        command = get_poweroff_command()
ai-worker/coordinator_watch.py:104:        if not confirm_shutdown():
ai-worker/coordinator_watch.py:105:            print("[SHUTDOWN] Conferma negata o non disponibile, non eseguo lo shutdown.")
ai-worker/coordinator_watch.py:107:        print("[SHUTDOWN] Conferma ricevuta, eseguo shutdown...")
ai-worker/coordinator_watch.py:124:    """Ciclo di polling con auto-idle-shutdown."""
ai-worker/coordinator_watch.py:155:                    perform_shutdown(elapsed_minutes)
ai-worker/start_coordinator_watch.sh:4:# Avvia il monitoraggio idle con auto-shutdown quando la coda è vuota
scripts/autoCommit/commitFailureMonitor.js:46:    shutdownSystem('DIAGNOSTICS_FAILED', `${step.label} failed during Guardian recovery`);
scripts/autoCommit/commitFailureMonitor.js:54:    shutdownSystem('GIT_ADD_FAILED', 'git add -A failed during Guardian recovery');
scripts/autoCommit/commitFailureMonitor.js:58:    shutdownSystem('GIT_COMMIT_FAILED', 'git commit failed during Guardian recovery');
scripts/autoCommit/commitFailureMonitor.js:65:    shutdownSystem('GIT_PUSH_FAILED', `git push origin ${branch} failed during Guardian recovery`);
scripts/autoCommit/commitFailureMonitor.js:140:function shutdownSystem(reason, detail) {
scripts/autoCommit/commitFailureMonitor.js:141:  log(`Session failed - initiating shutdown: ${reason}`);
scripts/autoCommit/commitFailureMonitor.js:161:  // Attempt graceful shutdown with unattended safety checks
scripts/autoCommit/commitFailureMonitor.js:168:      log('Executing unattended Linux shutdown...');
scripts/autoCommit/commitFailureMonitor.js:169:      exec('sudo shutdown -h now', (err) => {
scripts/autoCommit/commitFailureMonitor.js:171:          log('Linux shutdown failed - no fallback available');
scripts/autoCommit/commitFailureMonitor.js:175:      log('No unattended sudo access - cannot shutdown Linux');
scripts/autoCommit/commitFailureMonitor.js:178:    log('Executing macOS shutdown via osascript...');
scripts/autoCommit/commitFailureMonitor.js:179:    exec('osascript -e "tell application \\"System Events\\" to shut down"', (err) => {
scripts/autoCommit/commitFailureMonitor.js:181:        log('macOS shutdown failed - no fallback available');
scripts/guardian/vercelDeploymentGuard.ts:377:function shutdownSystem(reason: string, detail: string): void {
scripts/guardian/vercelDeploymentGuard.ts:378:  console.log(`Session ${reason === 'SUCCESS' ? 'completed' : 'failed'} - initiating shutdown: ${reason}`);
scripts/guardian/vercelDeploymentGuard.ts:402:  // Attempt graceful shutdown with unattended safety checks
scripts/guardian/vercelDeploymentGuard.ts:409:      console.log('Executing unattended Linux shutdown...');
scripts/guardian/vercelDeploymentGuard.ts:410:      exec('sudo shutdown -h now', (err: any) => {
scripts/guardian/vercelDeploymentGuard.ts:412:          console.log('Linux shutdown failed - no fallback available');
scripts/guardian/vercelDeploymentGuard.ts:416:      console.log('No unattended sudo access - cannot shutdown Linux');
scripts/guardian/vercelDeploymentGuard.ts:419:    console.log('Executing macOS shutdown via osascript...');
scripts/guardian/vercelDeploymentGuard.ts:420:    exec('osascript -e "tell application \\"System Events\\" to shut down"', (err: any) => {
scripts/guardian/vercelDeploymentGuard.ts:422:        console.log('macOS shutdown failed - no fallback available');
scripts/guardian/vercelDeploymentGuard.ts:443:        shutdownSystem('SUCCESS', 'Deployment completed successfully');
scripts/guardian/vercelDeploymentGuard.ts:447:        shutdownSystem('DEPLOYMENT_FAILED', result.error || 'Unknown deployment error');
scripts/guardian/vercelDeploymentGuard.ts:453:      shutdownSystem('DEPLOYMENT_ERROR', (error as Error).message);
auto-commit-only.sh:3:# Auto-commit script: esegue commit ogni 2 ore senza spegnimento
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:3:# Auto-commit, push e shutdown: esegue commit, push ogni 2 cicli e spegne il PC
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:4:# Script completo con Guardian e spegnimento automatico
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:32:shutdown_system() {
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:33:  log "Session completed - initiating system shutdown..."
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:47:  # Attempt graceful shutdown with unattended safety checks
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:49:    log "Executing unattended system shutdown..."
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:50:    sudo shutdown -h now 2>/dev/null || {
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:51:      log "Sudo shutdown failed - trying fallback methods"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:56:  if command -v osascript >/dev/null 2>&1; then
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:57:    log "Fallback: using osascript for macOS shutdown..."
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:58:    osascript -e 'tell application "System Events" to shut down' 2>/dev/null || {
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:59:      log "osascript shutdown failed"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:64:  log "No unattended shutdown method available - session ended cleanly"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:89:    shutdown_system "TIMEOUT" "Session timeout reached"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:232:log "Auto-commit, push e shutdown watcher attivo: ogni ${INTERVAL_MINUTES} minuti eseguo commit, push ogni 2 ore su ${BRANCH}, poi spegni."
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:255:        log "Guardian recovery failed - initiating shutdown"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:256:        shutdown_system "FAILED" "Guardian recovery failed for commit"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:271:          log "Guardian recovery failed - initiating shutdown"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:272:          shutdown_system "FAILED" "Guardian recovery failed for push"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:284:        log "Deployment verified successfully - initiating shutdown"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:285:        shutdown_system "SUCCESS" "Deployment completed and verified"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:288:        log "Deployment verification failed - initiating shutdown"
.claude/worktrees/pensive-moore-4e787f/auto-commit-push-shutdown.sh:289:        shutdown_system "DEPLOYMENT_FAILED" "Deployment verification failed"
