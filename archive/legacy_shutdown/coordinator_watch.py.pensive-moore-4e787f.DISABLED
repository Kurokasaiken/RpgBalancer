import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import coordinator

ROOT_DIR = Path(__file__).resolve().parent.parent
AI_WORKER_DIR = ROOT_DIR / "ai-worker"
STATE_PATH = AI_WORKER_DIR / "last_activity.json"
SHUTDOWN_LOG_PATH = AI_WORKER_DIR / "shutdown.log"
# Per test: usa kanban_vuoto.json invece di kanban.json
KANBAN_PATH = AI_WORKER_DIR / "kanban_vuoto.json"

IDLE_TIMEOUT_MINUTES = int(os.environ.get("IDLE_TIMEOUT_MINUTES", "10"))
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "30"))
AMBIENTE = os.environ.get("AMBIENTE", "github_actions")


def now_iso() -> str:
    """Restituisce il timestamp ISO corrente in UTC."""
    return datetime.now(timezone.utc).isoformat()


def load_state() -> dict:
    """Carica lo stato di idle o lo inizializza se mancante."""
    if not STATE_PATH.exists():
        state = {
            "last_task_completed_at": now_iso(),
            "idle_since": None,
        }
        save_state(state)
        return state
    with open(STATE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state: dict) -> None:
    """Salva lo stato di idle."""
    AI_WORKER_DIR.mkdir(parents=True, exist_ok=True)
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def log_shutdown(reason: str) -> None:
    """Scrive una riga nel log di shutdown."""
    AI_WORKER_DIR.mkdir(parents=True, exist_ok=True)
    line = f"{now_iso()} {reason}\n"
    with open(SHUTDOWN_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line)
    print(f"[SHUTDOWN LOG] {line.strip()}")


def confirm_shutdown() -> bool:
    """Chiede conferma da TTY prima dello shutdown di una VM/macchina locale."""
    if not sys.stdin.isatty():
        print("[SHUTDOWN] TTY non disponibile, impossibile chiedere conferma.")
        return False
    try:
        response = input("Confermi lo spegnimento del sistema? (s/n): ")
        return response.strip().lower() == "s"
    except (EOFError, KeyboardInterrupt):
        return False


def get_poweroff_command() -> Optional[str]:
    """Restituisce il comando di shutdown appropriato per il sistema corrente."""
    if sys.platform == "darwin":
        return "sudo shutdown -h now"
    if sys.platform.startswith("linux"):
        return "sudo systemctl poweroff"
    print(f"[SHUTDOWN] Piattaforma non supportata: {sys.platform}")
    return None


def perform_shutdown(idle_minutes: float) -> None:
    """
    Procedura di shutdown parametrica per ambiente.

    Per vm_locale_o_cloud esegue realmente il comando dopo conferma TTY.
    Per altri ambienti mantiene solo il log per sicurezza.
    """
    reason = f"coda vuota da {idle_minutes:.1f} minuti"
    log_shutdown(reason)
    print(f"[SHUTDOWN] AMBIENTE={AMBIENTE}")

    if AMBIENTE == "codespace":
        codespace_name = os.environ.get("CODESPACE_NAME", "")
        if not codespace_name:
            print("[SHUTDOWN] Errore: variabile CODESPACE_NAME non impostata.")
            return
        command = f"gh codespace stop --codespace {codespace_name}"
        print(f"[SHUTDOWN] Comando che verrebbe eseguito: {command}")
        print("[SHUTDOWN] Esecuzione reale disabilitata per codespace per sicurezza.")

    elif AMBIENTE == "vm_locale_o_cloud":
        command = get_poweroff_command()
        if command is None:
            return
        print(f"[SHUTDOWN] Comando da eseguire: {command}")
        if not confirm_shutdown():
            print("[SHUTDOWN] Conferma negata o non disponibile, non eseguo lo shutdown.")
            return
        print("[SHUTDOWN] Conferma ricevuta, eseguo shutdown...")
        os.system(command)

    elif AMBIENTE == "github_actions":
        print("nessun task, esco pulito")

    else:
        print(f"[SHUTDOWN] Ambiente '{AMBIENTE}' non riconosciuto, nessuna azione.")


def has_todo_tasks() -> bool:
    """Verifica se esistono task con status 'todo' in kanban.json."""
    data = coordinator.load_kanban(KANBAN_PATH)
    return coordinator.find_next_todo(data) is not None


def main_loop() -> None:
    """Ciclo di polling con auto-idle-shutdown."""
    if AMBIENTE == os.environ.get("AMBIENTE", ""):
        print(f"[WATCH] AMBIENTE={AMBIENTE}, IDLE_TIMEOUT={IDLE_TIMEOUT_MINUTES}m, POLL_INTERVAL={POLL_INTERVAL}s")
    else:
        print(f"[WATCH] AMBIENTE non impostato, uso default={AMBIENTE}")
        print(f"[WATCH] IDLE_TIMEOUT={IDLE_TIMEOUT_MINUTES}m, POLL_INTERVAL={POLL_INTERVAL}s")

    state = load_state()

    while True:
        if has_todo_tasks():
            print("[WATCH] Task trovato, eseguo e resetto idle.")
            state["idle_since"] = None
            save_state(state)

            coordinator.run_single_task()

            state["last_task_completed_at"] = now_iso()
            save_state(state)
        else:
            now = datetime.now(timezone.utc)
            if state["idle_since"] is None:
                state["idle_since"] = now_iso()
                save_state(state)
                print(f"[WATCH] Nessun task, idle iniziato alle {state['idle_since']}")
            else:
                idle_since = datetime.fromisoformat(state["idle_since"])
                elapsed_minutes = (now - idle_since).total_seconds() / 60.0

                if elapsed_minutes > IDLE_TIMEOUT_MINUTES:
                    print(f"[WATCH] Idle da {elapsed_minutes:.1f} minuti, superata soglia {IDLE_TIMEOUT_MINUTES}m.")
                    perform_shutdown(elapsed_minutes)
                    break
                else:
                    remaining = IDLE_TIMEOUT_MINUTES - elapsed_minutes
                    print(f"[WATCH] Idle da {elapsed_minutes:.1f} minuti, timeout tra {remaining:.1f} minuti")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main_loop()
