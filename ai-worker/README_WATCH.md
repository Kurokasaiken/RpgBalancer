# coordinator_watch.py - Auto Idle Shutdown

Modulo di polling che monitora la coda `kanban.json` e attiva una procedura di shutdown quando non ci sono task "todo" per più di N minuti.

## Come funziona

1. **Polling**: Ogni `POLL_INTERVAL` secondi controlla se esistono task con status `"todo"` in `kanban.json`
2. **Idle tracking**: Se non ci sono task, imposta `idle_since` (se non già impostato) e calcola il tempo trascorso
3. **Shutdown**: Quando il tempo idle supera `IDLE_TIMEOUT_MINUTES`, esegue la procedura di shutdown parametrica
4. **Stato persistente**: Mantiene `last_activity.json` con timestamp dell'ultimo task completato e inizio idle

## Variabili d'ambiente

| Variabile | Default | Descrizione |
|----------|---------|-------------|
| `AMBIENTE` | `github_actions` | Ambiente di esecuzione. Valori validi: `codespace`, `vm_locale_o_cloud`, `github_actions` |
| `IDLE_TIMEOUT_MINUTES` | `10` | Minuti di idle prima di attivare lo shutdown |
| `POLL_INTERVAL` | `30` | Secondi tra un controllo e l'altro |
| `CODESPACE_NAME` | (richiesto per `codespace`) | Nome del codespace da fermare (passato a `gh codespace stop`) |

## Comportamento per ambiente

### `codespace`

- Comando: `gh codespace stop --codespace $CODESPACE_NAME`
- Requisito: variabile `CODESPACE_NAME` impostata
- Log: Scrive `shutdown.log` con motivo e timestamp

### `vm_locale_o_cloud`

- Comandi platform-specific:
  - macOS: `sudo shutdown -h now`
  - Linux: `sudo systemctl poweroff`
- Conferma TTY: Chiede conferma da terminale prima di eseguire
- Log: Scrive `shutdown.log` con motivo e timestamp

### `github_actions`

- Azione: Stampa `"nessun task, esco pulito"` e termina il ciclo
- Nessun comando di sistema eseguito

## File creati/modificati

- `ai-worker/last_activity.json` - Stato idle (creato automaticamente)
- `ai-worker/shutdown.log` - Log delle operazioni di shutdown (append)

## Esecuzione

```bash
# Esempio base (default github_actions)
python3 ai-worker/coordinator_watch.py

# Codespace con timeout 5 minuti
AMBIENTE=codespace CODESPACE_NAME=my-codespace IDLE_TIMEOUT_MINUTES=5 python3 ai-worker/coordinator_watch.py

# VM locale con conferma TTY
AMBIENTE=vm_locale_o_cloud IDLE_TIMEOUT_MINUTES=15 python3 ai-worker/coordinator_watch.py
```

## Sicurezza

- **Nessun comando reale eseguito** in questa fase: il sistema stampa solo il comando che verrebbe eseguito e logga
- Per abilitare l'esecuzione reale, rimuovere i commenti e i controlli di sicurezza dopo esplicita conferma
- La conferma TTY per `vm_locale_o_cloud` è sempre richiesta prima di qualsiasi azione

## Dipendenze

- `coordinator.py` (stessa directory) - per `load_kanban()` e `find_next_todo()`
- Moduli standard Python: `json`, `os`, `sys`, `time`, `datetime`, `pathlib`

## Log di esempio

```bash
2026-07-14T16:15:30.123Z coda vuota da 10.2 minuti
[SHUTDOWN] AMBIENTE=codespace
[SHUTDOWN] Comando che verrebbe eseguito: gh codespace stop --codespace my-codespace
[SHUTDOWN] Esecuzione reale non attiva in attesa di conferma.
```
