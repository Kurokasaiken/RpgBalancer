#!/usr/bin/env python3
"""Coordinator interno per il dispatch dinamico dei task.

Legge agent_assignments.md, applica dispatch gates, calcola cluster indipendenti
basati su file_targets, e seleziona il batch eseguibile in base alla capacità dei modelli.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Set, Tuple

from dispatch_gates import check_dispatch_gates, extract_file_targets_from_notes, parse_agent_assignments_rows
from dispatcher import (
    dispatch_batch_to_manual,
    get_manual_status,
    print_manual_reminder,
    send_manual_notification,
)
from registry_manager import (
    get_available_models,
    get_model_capacity,
    increment_model_usage,
    reconcile_registry,
    register_task_end,
    register_task_start,
    reset_registry,
)

ROOT_DIR = Path(__file__).resolve().parent.parent
AGENT_ASSIGNMENTS_PATH = ROOT_DIR / "src" / "docs" / "docs" / "coordinator" / "agent_assignments.md"
STRATEGY_TASKS_PATH = ROOT_DIR / "src" / "docs" / "docs" / "coordinator" / "strategy_tasks.md"
LAST_RUN_SUMMARY_PATH = ROOT_DIR / "coordinator" / "last-run-summary.json"
PROMPTS_DIR = ROOT_DIR / "prompts"
AI_KANBAN_PATH = ROOT_DIR / "ai-worker" / "kanban.json"

# Model fallback list in order of preference
MODEL_FALLBACK = [
    "qwen/qwen3-coder:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
]


def get_ready_tasks() -> List[dict]:
    """Get all tasks that are ready for dispatch (status 'Non assegnato', 'Assegnato' or blocked states that can be retried).
    
    Tasks with temporary blocks (dependencies, file conflicts) remain candidates and will be
    re-evaluated on each dispatch cycle. executor='manual' is reserved only for the original
    resolveExecutor routing (architectural tasks or repeated failures).
    """
    rows = parse_agent_assignments_rows()
    ready = []
    
    for row in rows:
        # Consider tasks that are not already running/completed
        # Include "Assegnato" so tasks assigned by the coordinator/plan can be dispatched
        # Include "Non assegnato" even if notes contain "Bloccato temporaneo"
        # These tasks will be re-evaluated by dispatch gates on each cycle
        if row["status"] in ("Non assegnato", "Assegnato", "In attesa di dipendenze", "In attesa - file occupato"):
            ready.append(row)
    
    return ready


def check_dependencies_satisfied(task_id: str, dependencies: str) -> bool:
    """Check if all dependencies are completed."""
    if not dependencies or dependencies == "-":
        return True
    
    rows = parse_agent_assignments_rows()
    row_by_id = {row["id"].split()[0]: row for row in rows}
    
    dep_ids = [dep.strip() for dep in re.split(r",|\s+", dependencies) if dep.strip() and dep.strip() != "-"]
    
    for dep_id in dep_ids:
        dep_row = row_by_id.get(dep_id)
        if not dep_row or dep_row["status"] != "Completato":
            return False
    
    return True


def _format_assignment_line(cells: List[str]) -> str:
    """Reconstruct a markdown table row from a list of cell values."""
    return "| " + " | ".join(cells) + " |"


def _update_row_status(content: str, task_id: str, old_status: str, new_status: str) -> str:
    """Find the first markdown table row for task_id and replace the status cell.

    Also updates the last_update cell when the row has at least 10 columns.
    """
    lines = content.splitlines()
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if not cells or not cells[0].startswith(task_id):
            continue
        if len(cells) > 1 and cells[1] == old_status:
            cells[1] = new_status
            if len(cells) > 9:
                cells[8] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            lines[i] = _format_assignment_line(cells)
            break
    return "\n".join(lines)


def unblock_blocked_tasks() -> List[str]:
    """Promote 'Bloccato' tasks to 'Assegnato' when all dependencies are completed.

    This enables automatic dispatch of dependency chains: as soon as a blocking
    task is marked Completato, the blocked task becomes ready for execution in
    the same coordinator cycle.
    """
    rows = parse_agent_assignments_rows()
    unblocked: List[str] = []
    path = AGENT_ASSIGNMENTS_PATH
    if not path.exists():
        return unblocked

    content = path.read_text(encoding="utf-8")
    for row in rows:
        if row["status"] != "Bloccato":
            continue
        task_id = row["id"].split()[0]
        dependencies = row.get("dependencies", "")
        # Only auto-unblock tasks whose block is explicitly a dependency;
        # tasks with no dependencies are blocked for other reasons and stay Bloccato.
        if dependencies and dependencies != "-" and check_dependencies_satisfied(task_id, dependencies):
            content = _update_row_status(content, row["id"], "Bloccato", "Assegnato")
            unblocked.append(task_id)

    if unblocked:
        path.write_text(content, encoding="utf-8")
        print(f"[UNBLOCK] {len(unblocked)} task(s) unblocked: {', '.join(unblocked)}")
    else:
        print("[INFO] No blocked tasks to unblock")

    return unblocked


def build_file_target_clusters(tasks: List[dict]) -> List[List[dict]]:
    """Group tasks into independent clusters based on file_targets.
    
    Two tasks are in the same cluster if they share at least one file_target.
    Tasks in different clusters can run in parallel.
    """
    clusters: List[List[dict]] = []
    
    for task in tasks:
        file_targets = extract_file_targets_from_notes(task["notes"])
        
        # Find existing cluster that shares any file_target
        found_cluster = None
        for cluster in clusters:
            for cluster_task in cluster:
                cluster_targets = extract_file_targets_from_notes(cluster_task["notes"])
                if file_targets & cluster_targets:  # Intersection non-empty
                    found_cluster = cluster
                    break
            if found_cluster:
                break
        
        if found_cluster:
            found_cluster.append(task)
        else:
            clusters.append([task])
    
    return clusters


def calcola_max_paralleli(model_capacity: dict) -> int:
    """Calcola il numero massimo di task parallelizzabili basandosi sulla capacità residua reale dei modelli disponibili.
    
    Restituisce il numero di task che possono essere lanciati ora senza saturare nessun modello oltre il suo limite.
    
    Args:
        model_capacity: Dict con {modello: {limit_per_min, used_last_60s}}
    
    Returns:
        Numero massimo di task paralleli (con tetto tecnico di 20 per GitHub Actions)
    """
    # Capacità totale = somma delle richieste disponibili su tutti i modelli
    capacita_per_modello = {
        modello: dati["limit_per_min"] - dati["used_last_60s"]
        for modello, dati in model_capacity.items()
        if dati["limit_per_min"] > dati["used_last_60s"]
    }
    if not capacita_per_modello:
        return 0  # Tutti i modelli saturi, aspetta
    
    # Il numero di task paralleli è limitato dalla capacità totale disponibile
    # su tutti i modelli combinati (con distribuzione round-robin tra modelli per non saturarne uno solo)
    capacita_totale = sum(capacita_per_modello.values())
    return min(capacita_totale, 20)  # 20 = tetto tecnico GitHub Actions


def select_model_for_task(available_models: List[str]) -> str:
    """Select the best available model from fallback list."""
    for model in MODEL_FALLBACK:
        if model in available_models:
            return model
    return MODEL_FALLBACK[0]  # Fallback to first model if all saturated


def get_file_targets_from_spec_or_notes(task_id: str, notes: str) -> List[str]:
    """Get file_targets from spec.json if available, otherwise extract from notes.
    
    Priority:
    1. Read from prompts/<task_id>.spec.json field "file_targets"
    2. Fallback to extract from notes field
    
    Spec formats supported:
    - "deliverables" array with "files" sub-arrays
    - "scope" object with "files_to_modify" array
    """
    spec_path = PROMPTS_DIR / f"{task_id}.spec.json"
    
    if spec_path.exists():
        try:
            with open(spec_path, "r", encoding="utf-8") as f:
                spec = json.load(f)
            
            file_targets = []
            
            # Try format 1: deliverables -> files
            for deliverable in spec.get("deliverables", []):
                for file_path in deliverable.get("files", []):
                    file_targets.append(file_path)
            
            # Try format 2: scope -> files_to_modify
            if not file_targets:
                scope = spec.get("scope", {})
                for file_path in scope.get("files_to_modify", []):
                    file_targets.append(file_path)
            
            if file_targets:
                return file_targets
        except (json.JSONDecodeError, IOError) as e:
            print(f"[WARN] Failed to read spec for {task_id}: {e}")
    
    # Fallback to notes extraction
    return list(extract_file_targets_from_notes(notes))


def parse_strategy_tasks() -> List[dict]:
    """Parse strategy_tasks.md and extract tasks with status 'Non assegnato'.
    
    Only processes tasks that have a "Full Prompt for Coordinator" section.
    Task headers without prompt sections are ignored.
    
    Returns:
        List of task dicts with keys: task_id, title, status, dependencies, prompt, executor, execution_hint
    """
    if not STRATEGY_TASKS_PATH.exists():
        print(f"[WARN] strategy_tasks.md not found at {STRATEGY_TASKS_PATH}")
        return []
    
    try:
        with open(STRATEGY_TASKS_PATH, "r", encoding="utf-8") as f:
            content = f.read()
    except IOError as e:
        print(f"[ERROR] Failed to read strategy_tasks.md: {e}")
        return []
    
    tasks = []
    lines = content.split("\n")
    current_task = None
    in_prompt_section = False
    prompt_lines = []
    seen_ids = set()  # Track task IDs that have been fully processed with prompts
    
    for line in lines:
        # Detect task header: ## Task: TASK-ID
        task_match = re.match(r"## Task:\s+(\S+)", line)
        if task_match:
            task_id = task_match.group(1)
            
            # Save previous task if it has a prompt and "Non assegnato" status
            if current_task and current_task.get("status") == "Non assegnato" and current_task.get("prompt"):
                if current_task["task_id"] not in seen_ids:
                    tasks.append(current_task)
                    seen_ids.add(current_task["task_id"])
            
            # Start new task (always start fresh, don't skip based on seen_ids)
            current_task = {
                "task_id": task_id,
                "title": "",
                "status": "",
                "dependencies": "-",
                "prompt": "",
                "executor": "manual",
                "execution_hint": ""
            }
            in_prompt_section = False
            prompt_lines = []
            continue
        
        if not current_task:
            continue
        
        # Parse task metadata
        if line.startswith("**Title:**"):
            current_task["title"] = line.replace("**Title:**", "").strip()
        elif line.startswith("**Status:**"):
            current_task["status"] = line.replace("**Status:**", "").strip()
        elif line.startswith("**Dependencies:**"):
            current_task["dependencies"] = line.replace("**Dependencies:**", "").strip()
        elif line.startswith("**Execution Hint**"):
            current_task["execution_hint"] = line.replace("**Execution Hint**", "").strip()
        elif line.startswith("### Execution Hint"):
            current_task["execution_hint"] = line.replace("### Execution Hint", "").strip()
        
        # Detect prompt section start
        if "## Full Prompt for Coordinator" in line or "### Task ID:" in line:
            in_prompt_section = True
            continue
        
        # Collect prompt lines
        if in_prompt_section:
            prompt_lines.append(line)
    
    # Save last task if it has a prompt and "Non assegnato" status
    if current_task and current_task.get("status") == "Non assegnato" and current_task.get("prompt"):
        if current_task["task_id"] not in seen_ids:
            current_task["prompt"] = "\n".join(prompt_lines).strip()
            tasks.append(current_task)
    
    return tasks


def migrate_strategy_to_assignments() -> int:
    """Migrate tasks from strategy_tasks.md to agent_assignments.md.
    
    Only migrates tasks with status "Non assegnato" that don't already exist
    in agent_assignments.md. Updates strategy_tasks.md status to "In corso"
    after successful migration.
    
    Returns:
        Number of tasks migrated
    """
    # Parse strategy tasks
    strategy_tasks = parse_strategy_tasks()
    if not strategy_tasks:
        print("[INFO] No tasks to migrate from strategy_tasks.md")
        return 0
    
    # Parse existing agent assignments to check for duplicates
    existing_ids = set()
    try:
        with open(AGENT_ASSIGNMENTS_PATH, "r", encoding="utf-8") as f:
            content = f.read()
            for line in content.split("\n"):
                if line.startswith("| ") and "|" in line:
                    parts = [p.strip() for p in line.split("|")]
                    if len(parts) >= 2 and parts[1]:
                        existing_ids.add(parts[1].split()[0])  # Extract ID before space
    except IOError as e:
        print(f"[WARN] Failed to read agent_assignments.md for duplicate check: {e}")
    
    # Filter new tasks
    new_tasks = [t for t in strategy_tasks if t["task_id"] not in existing_ids]
    if not new_tasks:
        print("[INFO] All strategy tasks already migrated")
        return 0
    
    # Prepare new rows for agent_assignments.md
    new_rows = []
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    for task in new_tasks:
        task_id = task["task_id"]
        title = task.get("title", task_id)
        status = "Non assegnato"
        agent = ""
        note = f"Executor: {task.get('executor', 'manual')}"
        if task.get("execution_hint"):
            note += f", {task['execution_hint']}"
        executor = task.get("executor", "manual")
        executor_reason = task.get("execution_hint", "Strategy task migration")
        prompt = task.get("prompt", "")
        
        # Format as markdown table row
        row = f"| {task_id} | {status} | {today} | {agent} | {note} | {executor} | {executor_reason} | ```text\n{prompt}\n``` |"
        new_rows.append(row)
    
    # Append to agent_assignments.md
    try:
        with open(AGENT_ASSIGNMENTS_PATH, "a", encoding="utf-8") as f:
            f.write("\n\n")
            for row in new_rows:
                f.write(row + "\n")
        
        print(f"[MIGRATION] Migrated {len(new_rows)} tasks from strategy_tasks.md to agent_assignments.md")
        for task in new_tasks:
            print(f"  - {task['task_id']}: {task.get('title', 'N/A')}")
        
        return len(new_rows)
    except IOError as e:
        print(f"[ERROR] Failed to write to agent_assignments.md: {e}")
        return 0


def calcola_batch_eseguibile(coda_task: List[dict]) -> Tuple[List[dict], List[dict], List[dict], int]:
    """Calculate the executable batch of tasks.
    
    a. Group ready tasks into independent clusters based on file_targets
    b. For each cluster, select one representative task (serial within cluster)
    c. Filter selected tasks based on model capacity from live_registry.json
    d. Limit batch size based on dynamic max_paralleli calculation
    e. Separate manual tasks (executor='manual' or 'swe') from automatic tasks
    f. Dispatch manual tasks to the manual queue
    g. Return list of {task_id, channel, model} ready for dispatch, list of blocked tasks, list of manual tasks, and max_paralleli
    """
    # Step 1: Filter tasks with satisfied dependencies
    ready_with_deps = []
    for task in coda_task:
        if check_dependencies_satisfied(task["id"], task["dependencies"]):
            ready_with_deps.append(task)
    
    # Step 2: Build independent clusters
    clusters = build_file_target_clusters(ready_with_deps)
    
    # Step 3: Select one representative per cluster
    selected_tasks = []
    for cluster in clusters:
        # Select the first task from each cluster (could be smarter: priority, etc.)
        selected_tasks.append(cluster[0])
    
    # Step 4: Calculate dynamic max_paralleli based on model capacity
    capacity = get_model_capacity()
    max_paralleli = calcola_max_paralleli(capacity)
    
    # Step 5: Apply dispatch gates and filter by model capacity
    available_models = get_available_models()
    batch = []
    blocked_tasks = []
    manual_tasks = []
    
    for task in selected_tasks:
        task_id = task["id"].split()[0]
        dependencies = task["dependencies"]
        file_targets_source = f"{task.get('prompt', '')}\n{task['notes']}".strip()
        file_targets = get_file_targets_from_spec_or_notes(task_id, file_targets_source)
        
        # Determine channel from executor field or default
        executor = task.get("executor", "manual")
        
        # Separate manual tasks immediately (manual, swe, Cascade executors)
        if executor in ("manual", "swe", "Cascade"):
            manual_tasks.append({
                "task_id": task_id,
                "channel": "manual",
                "model": "N/A",
                "file_targets": list(file_targets),
                "title": task.get("title", ""),
                "description": task.get("description", ""),
                "prompt": task.get("prompt", ""),
                "dependencies": task.get("dependencies", "-"),
                "executor": executor,
            })
            continue  # Manual tasks don't go through automatic dispatch
        
        # For automatic tasks, check dispatch gates and capacity
        # Stop if we've reached max_paralleli
        if len(batch) >= max_paralleli:
            blocked_tasks.append({
                "task_id": task_id,
                "motivo": f"batch limit reached (max_paralleli={max_paralleli})"
            })
            continue
        
        # Run dispatch gates
        allowed, reason = check_dispatch_gates(task_id, dependencies, file_targets)
        if not allowed:
            blocked_tasks.append({"task_id": task_id, "motivo": reason})
            continue  # Skip blocked tasks
        
        # Select model based on capacity
        model = select_model_for_task(available_models)
        
        # Check if model has capacity
        if model in capacity:
            used = capacity[model]["used_last_60s"]
            limit = capacity[model]["limit_per_min"]
            if used >= limit:
                # Model saturated, try next in fallback list
                remaining_models = [m for m in MODEL_FALLBACK if m != model and m in available_models]
                if remaining_models:
                    model = remaining_models[0]
                else:
                    # All models saturated, skip this task for this cycle
                    blocked_tasks.append({"task_id": task_id, "motivo": "all models saturated"})
                    continue
        
        # Determine channel for automatic tasks
        if executor == "ai-worker":
            channel = "ai-worker"
        elif executor == "harness":
            channel = "harness"
        else:
            channel = "manual"  # Fallback
        
        batch.append({
            "task_id": task_id,
            "channel": channel,
            "model": model,
            "file_targets": list(file_targets),
        })
        
        # Increment model usage (will be decremented on task completion)
        increment_model_usage(model)
    
    return batch, blocked_tasks, manual_tasks, max_paralleli


def dispatch_task(task_id: str, channel: str, model: str, file_targets: List[str]):
    """Dispatch a single task and register it in the live registry.

    This function should be called by the actual executor (ai-worker, harness, manual)
    to register the task start. The executor must call register_task_end() when done.
    """
    register_task_start(task_id, channel, file_targets, model)
    print(f"[DISPATCH] Task {task_id} started on {channel} with model {model}")


def write_batch_json(batch: List[dict], max_paralleli: int, output_path: str):
    """Write the selected batch to a JSON file for CI matrix consumption.

    This is emitted both in select-only and full-dispatch modes so that
    downstream jobs or workflows can inspect the selected tasks.
    """
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    batch_with_metadata = {
        "max_parallel": max_paralleli,
        "tasks": batch,
    }
    with open(output, "w", encoding="utf-8") as f:
        json.dump(batch_with_metadata, f, indent=2)
    print(f"[INFO] Batch written to {output_path}")


def build_ai_worker_payload(task: dict) -> List[dict]:
    """Convert a coordinator task into one or more ai-worker kanban entries.

    If the task has multiple file targets, it is split into one ai-worker
    entry per target so that each entry writes a single file.  The prompt
    is kept identical for each split entry.
    """
    prompt = task.get("prompt", task.get("notes", ""))
    # Remove ```text fences if present
    prompt = re.sub(r"^```text\s*", "", prompt.strip())
    prompt = re.sub(r"\s*```\s*$", "", prompt)

    file_targets = task.get("file_targets", [])
    if not file_targets:
        # Fallback: try to extract from prompt using common patterns
        target_match = re.search(r"FILE TARGET:\s*(.+?)(?=\n\n|\n[A-Z]|\n#|$)", prompt, re.DOTALL)
        if target_match:
            file_targets = [c.strip().strip("`") for c in re.split(r"[,\n]", target_match.group(1)) if c.strip()]

    if not file_targets:
        file_targets = [""]

    # Complexity extraction
    complexity_match = re.search(r"(?i)(?:complexity|complessit[aà])[:=]\s*(\d+)", prompt)
    complexity = int(complexity_match.group(1)) if complexity_match else 1

    # Execution hint extraction
    execution_hint = "atomic"
    hint_match = re.search(r"(?i)(?:execution hint|execution_hint)[:=]\s*(assisted|atomic)", prompt)
    if hint_match:
        execution_hint = hint_match.group(1).lower()

    entries = []
    for idx, target_file in enumerate(file_targets):
        task_id = task["task_id"]
        if len(file_targets) > 1:
            task_id = f"{task['task_id']}-{chr(ord('a') + idx)}"
        entries.append({
            "id": task_id,
            "status": "todo",
            "target_file": target_file,
            "prompt": prompt,
            "complexity": complexity,
            "execution_hint": execution_hint,
        })

    return entries


def dispatch_ai_worker_batch(batch: List[dict], timeout_per_task: int = 600) -> int:
    """Prepare and run ai-worker tasks automatically.

    Writes ai-worker/kanban.json with the selected ai-worker tasks and
    invokes ai-worker/coordinator.py in a loop until no todo tasks remain.
    If OPENROUTER_API_KEY is missing the batch is skipped without failing.
    """
    ai_tasks = [task for task in batch if task.get("channel") == "ai-worker"]
    if not ai_tasks:
        print("[INFO] No ai-worker tasks in batch")
        return 0

    if not os.environ.get("OPENROUTER_API_KEY"):
        print("[WARN] OPENROUTER_API_KEY not set; skipping ai-worker dispatch")
        return 0

    print(f"[INFO] Preparing {len(ai_tasks)} ai-worker tasks...")

    ai_entries = []
    for task in ai_tasks:
        ai_entries.extend(build_ai_worker_payload(task))

    payload = {"tasks": ai_entries}
    AI_KANBAN_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(AI_KANBAN_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"[INFO] ai-worker kanban written to {AI_KANBAN_PATH}")

    completed = 0
    while True:
        # Run one ai-worker task per invocation
        try:
            result = subprocess.run(
                ["python", str(ROOT_DIR / "ai-worker" / "coordinator.py")],
                cwd=ROOT_DIR,
                capture_output=True,
                text=True,
                timeout=timeout_per_task,
            )
            print(result.stdout[-500:] if len(result.stdout) > 500 else result.stdout)
            if result.returncode != 0:
                print(f"[ERROR] ai-worker coordinator failed: {result.stderr[-500:]}")
                break
        except subprocess.TimeoutExpired:
            print(f"[ERROR] ai-worker task timed out after {timeout_per_task}s")
            break
        except (subprocess.SubprocessError, FileNotFoundError) as e:
            print(f"[ERROR] Failed to invoke ai-worker: {e}")
            break

        # Check kanban status and remaining todo tasks
        try:
            with open(AI_KANBAN_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            tasks = data.get("tasks", [])
            completed = sum(1 for t in tasks if t.get("status") == "done")
            if not any(t.get("status") == "todo" for t in tasks):
                print("[INFO] All ai-worker tasks completed")
                break
        except (json.JSONDecodeError, IOError) as e:
            print(f"[WARN] Failed to read ai-worker kanban: {e}")
            break

    return completed


def dispatch_harness_batch(batch: List[dict], timeout_seconds: int = 1800):
    """Dispatch harness tasks by invoking npm run harness:dispatch.
    
    Filters tasks with channel="harness" from the batch and executes them
    via the harness system with proper timeout and error handling.
    
    Args:
        batch: List of task dicts with task_id, channel, model, file_targets
        timeout_seconds: Maximum time to wait for harness dispatch (default 1800s)
    
    Returns:
        Number of harness tasks dispatched
    """
    # Filter harness tasks
    harness_tasks = [task for task in batch if task.get("channel") == "harness"]
    
    if not harness_tasks:
        print("[INFO] No harness tasks in batch")
        return 0
    
    print(f"[INFO] Dispatching {len(harness_tasks)} harness tasks...")
    
    # Build task IDs for harness:dispatch
    task_ids = [task["task_id"] for task in harness_tasks]
    
    try:
        # Invoke harness:dispatch with task ID filter
        cmd = [
            "npm", "run", "harness:dispatch", "--",
            "--id-filter", ",".join(task_ids),
            "--max-parallel", str(min(len(harness_tasks), 5))  # Limit parallelism
        ]
        
        print(f"[HARNESS] Executing: {' '.join(cmd)}")
        
        # Run with timeout
        result = subprocess.run(
            cmd,
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=timeout_seconds
        )
        
        if result.returncode == 0:
            print(f"[HARNESS] Dispatch completed successfully")
            print(f"[HARNESS] Output: {result.stdout[:500]}")  # First 500 chars
            return len(harness_tasks)
        else:
            print(f"[ERROR] Harness dispatch failed with code {result.returncode}")
            print(f"[ERROR] Stderr: {result.stderr}")
            return 0
            
    except subprocess.TimeoutExpired:
        print(f"[ERROR] Harness dispatch timed out after {timeout_seconds}s")
        return 0
    except (subprocess.SubprocessError, FileNotFoundError) as e:
        print(f"[ERROR] Failed to invoke harness: {e}")
        return 0


def send_desktop_notification(title: str, message: str):
    """Send a desktop notification on macOS using osascript."""
    try:
        subprocess.run([
            "osascript",
            "-e",
            f'display notification "{message}" with title "{title}"'
        ], check=True, capture_output=True)
        print(f"[NOTIFY] Desktop notification sent: {title}")
    except (subprocess.SubprocessError, FileNotFoundError) as e:
        print(f"[WARN] Failed to send desktop notification: {e}")


def write_run_summary(
    task_lanciati: int,
    task_bloccati: int,
    task_completati_questo_giro: int,
    dettaglio_bloccati: List[dict],
    max_paralleli_calcolato: int = 0,
    task_manuali_in_attesa: List[dict] = None,
):
    """Write the coordinator run summary to last-run-summary.json."""
    # Get manual dispatch status
    manual_status = get_manual_status()
    
    summary = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "task_lanciati": task_lanciati,
        "task_bloccati": task_bloccati,
        "task_completati_questo_giro": task_completati_questo_giro,
        "dettaglio_bloccati": dettaglio_bloccati,
        "max_paralleli_calcolato": max_paralleli_calcolato,
        "task_manuali_in_attesa": task_manuali_in_attesa or [],
        "manual_dispatch": {
            "pending": manual_status["pending"],
            "completed": manual_status["completed"],
            "failed": manual_status["failed"],
            "queue_file": manual_status["queue_file"],
            "next_action": "Aprire Windsurf ed eseguire /run-manual-tasks"
        }
    }
    
    LAST_RUN_SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LAST_RUN_SUMMARY_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    print(f"[SUMMARY] Run summary written to {LAST_RUN_SUMMARY_PATH}")


def count_completed_this_cycle(before_status: dict, after_status: dict) -> int:
    """Count tasks that changed from 'In corso' to 'Completato' during this cycle.
    
    Args:
        before_status: {task_id: status} before dispatch
        after_status: {task_id: status} after dispatch
    
    Returns:
        Number of tasks that completed during this cycle
    """
    completed_count = 0
    for task_id, status_after in after_status.items():
        status_before = before_status.get(task_id)
        if status_before == "In corso" and status_after == "Completato":
            completed_count += 1
    return completed_count


def main():
    parser = argparse.ArgumentParser(description="Coordinator interno per dispatch dinamico")
    parser.add_argument("--select-only", action="store_true", help="Only select and output batch, don't dispatch")
    parser.add_argument("--output", default="coordinator/batch.json", help="Output file for selected batch")
    parser.add_argument("--skip-migration", action="store_true", help="Skip strategy_tasks.md migration")
    args = parser.parse_args()
    
    # Migrate tasks from strategy_tasks.md to agent_assignments.md
    if not args.skip_migration:
        migrated_count = migrate_strategy_to_assignments()
        if migrated_count > 0:
            print(f"[INFO] Migration completed: {migrated_count} tasks added to agent_assignments.md")
    
    # Capture status before dispatch for completion counting
    rows_before = parse_agent_assignments_rows()
    status_before = {row["id"].split()[0]: row["status"] for row in rows_before}
    
    # Reset registry to clean state before reconcile
    reset_registry()
    
    # Reconcile registry from end events (process files from parallel jobs)
    reconcile_registry()
    
    # Auto-unblock tasks whose dependencies are now completed
    unblock_blocked_tasks()
    
    # Get ready tasks from agent_assignments.md
    ready_tasks = get_ready_tasks()
    
    if not ready_tasks:
        print("[INFO] No ready tasks found")
        if args.select_only:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump({"max_parallel": 0, "tasks": []}, f, indent=2)
            # Write summary even when no tasks
            write_run_summary(0, 0, 0, [], 0)
        return
    
    # Calculate executable batch
    batch, blocked_tasks, manual_tasks, max_paralleli = calcola_batch_eseguibile(ready_tasks)
    
    print(f"[INFO] Selected {len(batch)} tasks for dispatch (max_paralleli={max_paralleli})")
    for item in batch:
        print(f"  - {item['task_id']} -> {item['channel']} ({item['model']})")
    
    if manual_tasks:
        print(f"[INFO] {len(manual_tasks)} manual tasks detected, dispatching to queue...")
        
        # Convert manual tasks to dispatcher format
        dispatcher_tasks = []
        for task in manual_tasks:
            dispatcher_tasks.append({
                "task_id": task["task_id"],
                "title": task.get("title", task["task_id"]),
                "description": task.get("description", ""),
                "prompt": task.get("prompt", ""),
                "file_targets": task["file_targets"],
                "dependencies": task.get("dependencies", "-"),
                "executor": task.get("executor", "manual"),
            })
        
        # Dispatch to manual queue
        added_count = dispatch_batch_to_manual(dispatcher_tasks)
        print(f"[INFO] {added_count} new tasks added to manual queue")
        
        # Send desktop notification if new tasks were added
        if added_count > 0:
            send_manual_notification(
                "Nuovi task SWE disponibili",
                f"{added_count} nuovi task in attesa di esecuzione manuale"
            )
    
    if blocked_tasks:
        print(f"[INFO] {len(blocked_tasks)} tasks blocked:")
        for item in blocked_tasks:
            print(f"  - {item['task_id']}: {item['motivo']}")
    
    # Always emit batch.json so CI and downstream jobs can see the selected tasks
    write_batch_json(batch, max_paralleli, args.output)

    if args.select_only:
        # select-tasks only prepares the batch; dispatch happens later
        rows_after = parse_agent_assignments_rows()
        status_after = {row["id"].split()[0]: row["status"] for row in rows_after}
        completed_this_cycle = count_completed_this_cycle(status_before, status_after)
        write_run_summary(len(batch), len(blocked_tasks), completed_this_cycle, blocked_tasks, max_paralleli, manual_tasks)
    else:
        # Full dispatch mode: execute automatic tasks
        print("[INFO] Full dispatch mode - executing automatic tasks")

        # Dispatch harness tasks
        harness_count = dispatch_harness_batch(batch)
        if harness_count > 0:
            print(f"[INFO] {harness_count} harness tasks dispatched")
            send_desktop_notification(
                "Harness tasks in esecuzione",
                f"{harness_count} task harness avviati automaticamente"
            )

        # Dispatch ai-worker tasks
        ai_worker_count = dispatch_ai_worker_batch(batch)
        if ai_worker_count > 0:
            print(f"[INFO] {ai_worker_count} ai-worker tasks completed")
            send_desktop_notification(
                "AI worker tasks completati",
                f"{ai_worker_count} task ai-worker completati automaticamente"
            )

        # Write run summary
        rows_after = parse_agent_assignments_rows()
        status_after = {row["id"].split()[0]: row["status"] for row in rows_after}
        completed_this_cycle = count_completed_this_cycle(status_before, status_after)
        write_run_summary(len(batch), len(blocked_tasks), completed_this_cycle, blocked_tasks, max_paralleli, manual_tasks)

    # Always print manual reminder if queue is not empty
    print_manual_reminder()


if __name__ == "__main__":
    main()
