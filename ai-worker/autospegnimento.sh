#!/bin/bash

# Script di autospegnimento - avvia il monitoraggio idle
# Quando non ci sono più task nel kanban, il PC si spegne automaticamente

cd "$(dirname "$0")"
echo "🚀 Avvio autospegnimento PC..."
echo "⏱️  Timeout: ${IDLE_TIMEOUT_MINUTES:-10} minuti senza task"
echo "🔄 Controllo ogni ${POLL_INTERVAL:-30} secondi"
echo ""

python3 coordinator_watch.py
