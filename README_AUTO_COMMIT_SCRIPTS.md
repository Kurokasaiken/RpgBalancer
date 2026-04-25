# Auto Commit Scripts

Questo repository contiene tre script per automazione Git con diverse finalità:

## Script Disponibili

### 1. `auto-commit-only.sh`
**Scopo**: Commit automatico ogni 2 ore **senza** push e **senza** spegnimento
- **Intervallo**: 120 minuti (configurabile con `INTERVAL_MINUTES`)
- **Push**: NO
- **Spegnimento**: NO
- **Uso**: Lavoro continuativo senza interruzioni

```bash
# Esecuzione standard (2 ore)
./auto-commit-only.sh

# Intervallo personalizzato
INTERVAL_MINUTES=90 ./auto-commit-only.sh
```

### 2. `auto-commit-push-shutdown.sh`
**Scopo**: Commit, push ogni 2 cicli e spegnimento automatico
- **Intervallo**: 60 minuti (configurabile con `INTERVAL_MINUTES`)
- **Push**: Sì, ogni 2 cicli (2 ore)
- **Spegnimento**: Sì, dopo deploy verificato
- **Uso**: Sessioni di lavoro con deploy finale

```bash
# Esecuzione standard
./auto-commit-push-shutdown.sh

# Timeout personalizzato
SESSION_TIMEOUT_MINUTES=180 ./auto-commit-push-shutdown.sh
```

### 3. `auto_commit_push.sh` (originale)
**Scopo**: Versione completa con tutte le funzionalità
- **Intervallo**: 60 minuti
- **Push**: Sì, ogni 2 cicli
- **Spegnimento**: Sì, dopo deploy o timeout
- **Uso**: Script completo per produzione

## Variabili d'Ambiente

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `INTERVAL_MINUTES` | 60/120 | Minuti tra i controlli |
| `SESSION_TIMEOUT_MINUTES` | 120 | Timeout sessione (solo script con spegnimento) |
| `BRANCH` | git current | Branch target |

## Comportamenti Comuni

### Guardian Recovery System
Tutti gli script usano il Guardian per recuperare da errori:
- **Commit fallito**: Tentativo di recovery con diagnostica
- **Push fallito**: Tentativo di recovery con diagnostica
- **Recovery fallito**: Log dell'errore e continuazione (solo auto-commit-only)

### Generazione Commit Message
Gli script generano automaticamente commit message basati sui file modificati:
```bash
auto: update ComponentName; add FeatureName; update documentation (+3 more files)
```

### Log e Diagnostica
- Log timestampati per ogni operazione
- Salvataggio diagnostica in `test-results/auto-commit-guardian/`
- Riepilogo modifiche con `git status --porcelain`

## Metodi di Spegnimento (solo script con shutdown)

1. **sudo shutdown** (richiede password sudo)
2. **osascript** (macOS fallback)
3. **Log only** (se nessun metodo funziona)

## Esempi di Utilizzo

### Lavoro continuativo (8 ore)
```bash
# Avvia mattina, lavora tutto il giorno
./auto-commit-only.sh &
```

### Sessione con deploy
```bash
# Lavora per 2 ore, poi deploy e spegni
./auto-commit-push-shutdown.sh
```

### Sviluppo rapido
```bash
# Commit ogni 90 minuti, niente push
INTERVAL_MINUTES=90 ./auto-commit-only.sh
```

## Requisiti

- Bash shell
- Git repository
- Python 3 (per generazione commit message)
- Node.js (per Guardian scripts)
- macOS o Linux (per funzionalità di spegnimento)

## Note Tecniche

- Gli script usano `set -euo pipefail` per robustezza
- Compatibilità macOS per calcolo tempo sessione
- Gestione errori con retry logic
- Husky pre-commit bypassato per push automatici

## Troubleshooting

### "ps: etimes: keyword not found"
Risolto: gli script usano `ps -o pid,etime` compatibile con macOS.

### "npm not found"
Assicurati di avere Node.js attivo:
```bash
source ~/.nvm/nvm.sh && nvm use
```

### Push fallito per permissions
Verifica le credenziali Git o usa SSH keys.

### Spegnimento non funziona
Controlla permissions sudo o configura passwordless sudo.
