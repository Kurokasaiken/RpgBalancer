#!/bin/bash

# Script di avvio automatico per coordinator_watch.py
# Avvia il monitoraggio idle con auto-shutdown quando la coda è vuota

# Impostazioni default - possono essere sovrascritte con variabili d'ambiente
export AMBIENTE="${AMBIENTE:-vm_locale_o_cloud}"
export IDLE_TIMEOUT_MINUTES="${IDLE_TIMEOUT_MINUTES:-10}"
export POLL_INTERVAL="${POLL_INTERVAL:-30}"

# Directory corrente
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Avvio coordinator_watch ==="
echo "AMBIENTE: $AMBIENTE"
echo "IDLE_TIMEOUT: $IDLE_TIMEOUT_MINUTES minuti"
echo "POLL_INTERVAL: $POLL_INTERVAL secondi"
echo "Directory: $(pwd)"
echo "=============================="

# Controlla che coordinator_watch.py esista
if [ ! -f "coordinator_watch.py" ]; then
    echo "Errore: coordinator_watch.py non trovato in $(pwd)"
    exit 1
fi

# Controlla che kanban.json esista
if [ ! -f "kanban.json" ]; then
    echo "Errore: kanban.json non trovato in $(pwd)"
    exit 1
fi

# Avvia coordinator_watch in foreground
python3 coordinator_watch.py

echo "=== coordinator_watch terminato ==="
