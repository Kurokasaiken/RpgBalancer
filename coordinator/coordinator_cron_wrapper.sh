#!/bin/bash
# Coordinator cron wrapper - previene esecuzioni concorrenti
# Controlla se c'è già un coordinator in esecuzione prima di lanciarne uno nuovo

cd /Users/faustoboni/progetti_personali/RPG

# Path ai file di lock
PID_FILE="coordinator/.coordinator.pid"
REGISTRY_FILE="coordinator/live_registry.json"

# Funzione per controllare se un processo è ancora in esecuzione
is_process_running() {
    local pid=$1
    if [ -z "$pid" ]; then
        return 1
    fi
    # Controlla se il processo esiste e non è uno zombie
    if ps -p "$pid" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Controlla PID file
if [ -f "$PID_FILE" ]; then
    LOCK_PID=$(cat "$PID_FILE")
    if is_process_running "$LOCK_PID"; then
        echo "[$(date)] Coordinator già in esecuzione (PID: $LOCK_PID), skip"
        exit 0
    else
        echo "[$(date)] PID file trovato ma processo $LOCK_PID non in esecuzione, rimuovo lock"
        rm -f "$PID_FILE"
    fi
fi

# Controlla registry per task in esecuzione
if [ -f "$REGISTRY_FILE" ]; then
    RUNNING_COUNT=$(python3 -c "import json; data=json.load(open('$REGISTRY_FILE')); print(len(data.get('running', [])))" 2>/dev/null || echo "0")
    if [ "$RUNNING_COUNT" -gt "0" ] 2>/dev/null; then
        echo "[$(date)] $RUNNING_COUNT task in esecuzione nel registry, skip"
        exit 0
    fi
fi

# Crea PID file
echo $$ > "$PID_FILE"

# Esegui coordinator
echo "[$(date)] Avvio coordinator select-only"
python3 coordinator/coordinator.py --select-only --output coordinator/batch.json

# Rimuovi PID file
rm -f "$PID_FILE"

echo "[$(date)] Coordinator completato"
