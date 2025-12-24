#!/bin/bash

# --- CONFIGURAZIONE ---
SILENCE_MINUTES=30         # minuti di inattività richiesti prima dello shutdown
CHECK_INTERVAL=60          # secondi tra un controllo e l'altro
BRANCH="main"              # ramo remoto da pushare
WATCH_PATH="$(pwd)"        # percorso da monitorare (default: repo corrente)

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
log "🚀 Watcher avviato. Spegnerò il Mac dopo $SILENCE_MINUTES minuti di silenzio in $WATCH_PATH."

last_activity=$(latest_activity_ts)
log "⏱️ Ultima attività rilevata alle $(date -r "$last_activity" '+%H:%M:%S')."

while true; do
  latest=$(latest_activity_ts)
  if (( latest > last_activity )); then
    last_activity=$latest
    log "✏️ Nuova attività rilevata alle $(date -r "$last_activity" '+%H:%M:%S')."
  fi

  now=$(date +%s)
  idle=$(( now - last_activity ))

  if (( idle >= SILENCE_THRESHOLD )); then
    break
  fi

  remaining=$(( SILENCE_THRESHOLD - idle ))
  log "⏳ Nessuna attività da $(format_rel_time "$idle"). Mancano $(format_rel_time "$remaining") allo shutdown."
  sleep "$CHECK_INTERVAL"
done

log "✅ Nessuna attività negli ultimi $SILENCE_MINUTES minuti. Inizio procedure di chiusura..."

# --- OPERAZIONI GIT ---
log "📦 Salvataggio e Push su Git..."
if git status --porcelain | grep -q "."; then
  git add .
  git commit -m "Auto-commit: Sessione terminata e pulizia completata"
else
  log "ℹ️ Nessuna modifica da committare, procedo comunque con il push."
fi

git push origin "$BRANCH"

# --- SPEGNIMENTO ---
log "💤 Spegnimento Mac in corso..."
osascript -e 'tell application "System Events" to shut down'

# Per uno spegnimento forzato (richiede sudo), sostituisci la riga sopra con:
# sudo shutdown -h now
