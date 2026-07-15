#!/usr/bin/env python3
"""Bridge dal Kanban interno a ai-worker.

Aggiunge un task a ai-worker/kanban.json e marca la riga corrispondente in
agent_assignments.md come "Delegato ad ai-worker (in attesa)", poi committa e
pusha ai-worker/kanban.json per triggerare la GitHub Action.

Uso:
    python coordinator/bridge_ai_worker.py \
        --task-id task_03 \
        --target-file ai-worker/examples/utility.py \
        --prompt-file prompt.txt \
        --complexity 2

Oppure passando il prompt come argomento:
    python coordinator/bridge_ai_worker.py \
        --task-id task_03 \
        --target-file ai-worker/examples/utility.py \
        --prompt "Create a Python utility module..." \
        --complexity 2
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from dispatch_gates import check_dispatch_gates, extract_file_targets_from_notes, parse_agent_assignments_rows

ROOT_DIR = Path(__file__).resolve().parent.parent
AI_KANBAN_PATH = ROOT_DIR / "ai-worker" / "kanban.json"
AGENT_ASSIGNMENTS_PATH = ROOT_DIR / "src" / "docs" / "docs" / "coordinator" / "agent_assignments.md"


def run_git(args, check: bool = True):
    """Esegue un comando git e ritorna il completamento."""
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
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def add_or_update_ai_task(kanban, task_id: str, target_file: str, prompt: str, complexity: int):
    """Aggiunge o aggiorna un task in ai-worker/kanban.json."""
    for task in kanban.get("tasks", []):
        if task.get("id") == task_id:
            task["target_file"] = target_file
            task["prompt"] = prompt
            task["complexity"] = complexity
            task["status"] = "todo"
            print(f"[BRIDGE] Task {task_id} aggiornato in ai-worker/kanban.json")
            return

    kanban.setdefault("tasks", []).append(
        {
            "id": task_id,
            "status": "todo",
            "target_file": target_file,
            "prompt": prompt,
            "complexity": complexity,
        }
    )
    print(f"[BRIDGE] Task {task_id} aggiunto a ai-worker/kanban.json")


def update_agent_assignments_row(
    content: str,
    task_id: str,
    new_status: str,
    agent: str,
    note: str,
    executor: str = "ai-worker",
    executor_reason: str = "coordinator routing",
):
    """Aggiorna la riga di agent_assignments.md corrispondente a task_id."""
    lines = content.splitlines()
    updated = False
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for i, line in enumerate(lines):
        if not line.lstrip().startswith(f"| {task_id}"):
            continue

        # La riga del task ha 8 colonne: ID | status | data | agent | note | executor | executor_reason | prompt_start
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
        print(f"[BRIDGE] Riga {task_id} in agent_assignments.md aggiornata a '{new_status}'")
        break

    if not updated:
        print(f"[ERROR] Riga con id {task_id} non trovata in {AGENT_ASSIGNMENTS_PATH}")
        sys.exit(1)

    return "\n".join(lines) + ("\n" if content.endswith("\n") else "")


def main():
    parser = argparse.ArgumentParser(description="Bridge verso ai-worker")
    parser.add_argument("--task-id", required=True, help="ID del task (deve esistere in agent_assignments.md)")
    parser.add_argument("--target-file", required=True, help="File relativo da generare")
    parser.add_argument("--prompt-file", help="File contenente il prompt per ai-worker")
    parser.add_argument("--prompt", help="Prompt per ai-worker (se non si usa --prompt-file)")
    parser.add_argument("--complexity", type=int, default=1, help="Complessità del task (default 1)")
    args = parser.parse_args()

    prompt = args.prompt
    if args.prompt_file:
        with open(args.prompt_file, "r", encoding="utf-8") as f:
            prompt = f.read()
    if not prompt:
        print("[ERROR] Devi fornire --prompt o --prompt-file")
        sys.exit(1)

    if not AGENT_ASSIGNMENTS_PATH.exists():
        print(f"[ERROR] {AGENT_ASSIGNMENTS_PATH} non trovato")
        sys.exit(1)

    # Get task info from agent_assignments.md for dispatch gates
    rows = parse_agent_assignments_rows()
    task_row = None
    for row in rows:
        if row["id"].split()[0] == args.task_id:
            task_row = row
            break
    
    if not task_row:
        print(f"[ERROR] Task {args.task_id} non trovato in agent_assignments.md")
        sys.exit(1)
    
    dependencies = task_row.get("dependencies", "")
    file_targets = extract_file_targets_from_notes(task_row.get("notes", ""))
    
    # Run dispatch gates
    allowed, reason = check_dispatch_gates(args.task_id, dependencies, file_targets)
    if not allowed:
        # Update status to "Non assegnato" with blocking reason in note
        # Task remains candidate for next dispatch cycle
        with open(AGENT_ASSIGNMENTS_PATH, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Keep original executor from task_row, don't override to manual
        original_executor = task_row.get("executor", "")
        original_executor_reason = task_row.get("executor_reason", "")
        
        new_content = update_agent_assignments_row(
            content,
            args.task_id,
            "Non assegnato",  # Task remains candidate
            "Coordinator",
            f"Bloccato temporaneo: {reason}",
            original_executor,  # Preserve original executor
            original_executor_reason,  # Preserve original reason
        )
        
        with open(AGENT_ASSIGNMENTS_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
        
        print(f"[BLOCKED] Task {args.task_id}: {reason} (rimane in coda)")
        sys.exit(0)  # Exit cleanly, not an error
    
    # Carica e aggiorna ai-worker kanban
    ai_kanban = load_json(AI_KANBAN_PATH)
    add_or_update_ai_task(ai_kanban, args.task_id, args.target_file, prompt, args.complexity)
    save_json(AI_KANBAN_PATH, ai_kanban)

    # Aggiorna agent_assignments.md
    with open(AGENT_ASSIGNMENTS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = update_agent_assignments_row(
        content,
        args.task_id,
        "Delegato ad ai-worker (in attesa)",
        "Coordinator",
        "In attesa esecuzione ai-worker",
        "ai-worker",
        "coordinator routing",
    )

    with open(AGENT_ASSIGNMENTS_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)

    # Commit e push
    run_git(["add", str(AI_KANBAN_PATH.relative_to(ROOT_DIR)), str(AGENT_ASSIGNMENTS_PATH.relative_to(ROOT_DIR))])

    diff = run_git(["diff", "--cached", "--quiet"], check=False)
    if diff.returncode == 0:
        print("[INFO] Nessuna modifica da committare")
        return

    run_git(
        ["commit", "-m", f"AI worker bridge: dispatch {args.task_id}"],
    )
    run_git(["push"])
    print(f"[DONE] Task {args.task_id} inviato ad ai-worker e pushato")


if __name__ == "__main__":
    main()
