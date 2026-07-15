#!/usr/bin/env python3
"""Sincronizza i risultati di ai-worker con agent_assignments.md.

Va eseguito dopo un `git pull`. Legge i file `test-results/ai-worker-*.json`
non ancora processati, aggiorna la riga corrispondente in agent_assignments.md,
salva `ai-worker/.synced_tasks.json` e committa/pusha automaticamente.

Uso:
    python coordinator/sync_ai_worker.py
"""

import glob
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
EVIDENCE_DIR = ROOT_DIR / "test-results"
SYNC_STATE_PATH = ROOT_DIR / "ai-worker" / ".synced_tasks.json"
AGENT_ASSIGNMENTS_PATH = ROOT_DIR / "src" / "docs" / "docs" / "coordinator" / "agent_assignments.md"


def run_git(args, check: bool = True):
    """Esegue un comando git e ritorna il risultato."""
    cmd = ["git", *args]
    print(f"[GIT] {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[GIT ERROR] {result.stderr.strip()}")
        if check:
            sys.exit(1)
    elif result.stdout.strip():
        print(f"[GIT] {result.stdout.strip()}")
    return result


def load_json(path: Path):
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_synced():
    state = load_json(SYNC_STATE_PATH)
    return state.get("processed_files", [])


def save_synced(processed):
    save_json(SYNC_STATE_PATH, {"processed_files": processed})


def update_agent_assignments_row(
    content: str,
    task_id: str,
    new_status: str,
    agent: str,
    note: str,
    executor: str,
    executor_reason: str,
):
    """Aggiorna la riga di agent_assignments.md corrispondente a task_id."""
    lines = content.splitlines()
    updated = False
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for i, line in enumerate(lines):
        if not line.lstrip().startswith(f"| {task_id}"):
            continue

        parts = line.split("|", 8)
        if len(parts) < 7:
            print(f"[WARN] Riga {i + 1} non ha il formato tabella atteso, skip")
            continue

        if len(parts) == 7:
            # Formato legacy 6 colonne: inserisce executor e executor_reason prima del prompt
            parts = parts[:6] + [f" {executor} ", f" {executor_reason} "] + parts[6:]

        parts[2] = f" {new_status} "
        parts[3] = f" {today} "
        parts[4] = f" {agent} "
        parts[5] = f" {note} "
        parts[6] = f" {executor} "
        parts[7] = f" {executor_reason} "
        lines[i] = "|".join(parts)
        updated = True
        print(f"[SYNC] Riga {task_id} aggiornata a '{new_status}'")
        break

    if not updated:
        print(f"[WARN] Riga con id {task_id} non trovata in agent_assignments.md")

    return "\n".join(lines) + ("\n" if content.endswith("\n") else "")


def process_evidence(evidence_path: Path, content: str):
    """Processa un singolo evidence file e restituisce il content aggiornato."""
    evidence = load_json(evidence_path)
    task_id = evidence.get("task_id")
    status = evidence.get("status")
    error = evidence.get("error") or "unknown"
    used_model = evidence.get("used_model")
    elapsed = evidence.get("elapsed_seconds")

    if not task_id:
        print(f"[WARN] {evidence_path} non contiene task_id, skip")
        return content

    if status == "done":
        new_status = "Completato"
        note = f"Evidence: {evidence_path.relative_to(ROOT_DIR)}"
        if used_model is not None:
            note += f" - model: {used_model}"
        if elapsed is not None:
            note += f" - {elapsed}s"
        content = update_agent_assignments_row(
            content, task_id, new_status, "ai-worker", note, "ai-worker", "completed via ai-worker"
        )
    elif status in ("failed", "skipped"):
        new_status = "Non assegnato"
        note = f"ai-worker fallito: {error}, richiede executor manuale"
        content = update_agent_assignments_row(
            content, task_id, new_status, "ai-worker", note, "manual", f"ai-worker failed: {error}"
        )
    else:
        print(f"[WARN] Stato {status} non gestito per {task_id}, skip")

    return content


def main():
    if not AGENT_ASSIGNMENTS_PATH.exists():
        print(f"[ERROR] {AGENT_ASSIGNMENTS_PATH} non trovato")
        sys.exit(1)

    with open(AGENT_ASSIGNMENTS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    processed = load_synced()
    new_processed = list(processed)

    evidence_files = sorted(EVIDENCE_DIR.glob("ai-worker-*.json"))
    if not evidence_files:
        print("[INFO] Nessun evidence file trovato")
        return

    updated = False
    for evidence_path in evidence_files:
        rel_path = str(evidence_path.relative_to(ROOT_DIR))
        if rel_path in processed:
            continue

        content = process_evidence(evidence_path, content)
        new_processed.append(rel_path)
        updated = True

    if not updated:
        print("[INFO] Nessun nuovo evidence da sincronizzare")
        return

    with open(AGENT_ASSIGNMENTS_PATH, "w", encoding="utf-8") as f:
        f.write(content)

    save_synced(new_processed)
    print("[DONE] Sincronizzazione completata")

    run_git(["add", str(AGENT_ASSIGNMENTS_PATH.relative_to(ROOT_DIR)), str(SYNC_STATE_PATH.relative_to(ROOT_DIR))])
    diff = run_git(["diff", "--cached", "--quiet"], check=False)
    if diff.returncode == 0:
        print("[INFO] Nessuna modifica da committare")
        return

    run_git(["commit", "-m", "AI worker sync: aggiornati stati task"])
    run_git(["push"])
    print("[DONE] Modifiche committate e pushate")


if __name__ == "__main__":
    main()
