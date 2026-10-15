#!/bin/bash

# Safe test script to verify shutdown_when_done.sh functionality
# This script creates a modified version with 1-minute timeout and no actual shutdown

set -euo pipefail

TEST_DIR="/tmp/shutdown_test_$(date +%s)"
TEST_SCRIPT="$TEST_DIR/shutdown_test.sh"

echo "Creating safe test environment in $TEST_DIR..."
mkdir -p "$TEST_DIR"

# Create a safe test version of the shutdown script
cat > "$TEST_SCRIPT" <<'TEST_SCRIPT'
#!/bin/bash

# --- SAFE TEST CONFIGURATION ---
SILENCE_MINUTES=1          # 1 minute for quick testing
CHECK_INTERVAL=5           # 5 second checks for faster feedback
BRANCH="main"              # ramo remoto da pushare
WATCH_PATH="$1"            # percorso da monitorare (passed as argument)
DRY_RUN=true               # safety flag - no actual shutdown

set -euo pipefail

log() {
  echo "[$(date '+%H:%M:%S')] $1"
}

latest_activity_ts() {
  python3 - "$WATCH_PATH" <<'PY'
import os, sys, time

root = sys.argv[1]
latest = 0
for dirpath, dirnames, filenames in os.walk(root):
    if '.git' in dirnames:
        dirnames.remove('.git')
    for name in filenames:
        path = os.path.join(dirpath, name)
        try:
            mtime = int(os.path.getmtime(path))
        except (FileNotFoundError, PermissionError):
            continue
        if mtime > latest:
            latest = mtime

now = int(time.time())
print(latest or now)
PY
}

format_rel_time() {
  local seconds=$1
  local minutes=$((seconds / 60))
  local secs=$((seconds % 60))
  printf "%02dm%02ds" "$minutes" "$secs"
}

SILENCE_THRESHOLD=$((SILENCE_MINUTES * 60))
log "TEST MODE: Watcher avviato. Simulerò shutdown dopo $SILENCE_MINUTES minuti di silenzio in $WATCH_PATH."

last_activity=$(latest_activity_ts)
log "TEST: Ultima attività rilevata alle $(date -r "$last_activity" '+%H:%M:%S')."
last_activity=$(date +%s)
log "TEST: Timer azzerato: conto i $SILENCE_MINUTES minuti di inattività a partire da adesso ($(date '+%H:%M:%S'))."

while true; do
  latest=$(latest_activity_ts)
  if (( latest > last_activity )); then
    last_activity=$latest
    log "TEST: Nuova attività rilevata alle $(date -r "$last_activity" '+%H:%M:%S')."
  fi

  now=$(date +%s)
  idle=$(( now - last_activity ))

  if (( idle >= SILENCE_THRESHOLD )); then
    break
  fi

  remaining=$(( SILENCE_THRESHOLD - idle ))
  log "TEST: Nessuna attività da $(format_rel_time "$idle"). Mancano $(format_rel_time "$remaining") allo shutdown simulato."
  sleep "$CHECK_INTERVAL"
done

log "TEST: Nessuna attività negli ultimi $SILENCE_MINUTES minuti. Inizio procedure di chiusura simulate..."

# --- OPERAZIONI GIT SIMULATE ---
log "TEST: Simulo salvataggio e Push su Git..."
if git status --porcelain | grep -q "."; then
  log "TEST: Ci sono modifiche da committare (hook disattivati)."
  log "TEST: git add ."
  log "TEST: git commit -m \"Auto-commit: Sessione terminata e pulizia completata\""
else
  log "TEST: Nessuna modifica da committare."
fi
log "TEST: git push origin \"$BRANCH\""

# --- SPEGNIMENTO SIMULATO ---
if [ "$DRY_RUN" = true ]; then
  log "TEST: DRY RUN - Non eseguo realmente lo shutdown del Mac."
  log "TEST: Il comando reale sarebbe: osascript -e 'tell application \"System Events\" to shut down'"
else
  log "TEST: Eseguo shutdown reale..."
  osascript -e 'tell application "System Events" to shut down'
fi

log "TEST: Test completato con successo!"
TEST_SCRIPT

chmod +x "$TEST_SCRIPT"

echo "Test script created: $TEST_SCRIPT"
echo ""
echo "To run the test:"
echo "  bash $TEST_SCRIPT /path/to/directory/to/monitor"
echo ""
echo "Example:"
echo "  bash $TEST_SCRIPT /tmp/test_monitor_dir"
echo ""
echo "The test will run for 1 minute and simulate all actions without actually shutting down."
