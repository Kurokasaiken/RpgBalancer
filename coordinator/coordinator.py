#!/usr/bin/env python3
"""Coordinator interno per il dispatch dinamico dei task.

Legge agent_assignments.md, applica dispatch gates, calcola cluster indipendenti
basati su file_targets, e seleziona il batch eseguibile in base alla capacità dei modelli.
"""

import argparse
import json
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
STRATEGY_TASKS_PATH = ROOT_DIR / "coordinator" / "strategy_tasks.md"
LAST_RUN_SUMMARY_PATH = ROOT_DIR / "coordinator" / "last-run-summary.json"
PROMPTS_DIR = ROOT_DIR / "prompts"

# Model fallback list in order of preference
MODEL_FALLBACK = [
    "qwen/qwen3-coder:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
]


def get_ready_tasks() -> List[dict]:
    """Get all tasks that are ready for dispatch (status 'Non assegnato' or blocked states that can be retried).
    
    Tasks with temporary blocks (dependencies, file conflicts) remain candidates and will be
    re-evaluated on each dispatch cycle. executor='manual' is reserved only for the original
    resolveExecutor routing (architectural tasks or repeated failures).
    """
    rows = parse_agent_assignments_rows()
    ready = []
    
    for row in rows:
        # Consider tasks that are not already running/completed
        # Include "Non assegnato" even if notes contain "Bloccato temporaneo"
        # These tasks will be re-evaluated by dispatch gates on each cycle
        if row["status"] in ("Non assegnato", "In attesa di dipendenze", "In attesa - file occupato"):
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
    
    if args.select_only:
        # DO NOT register task starts here - that happens in the executor job
        # select-tasks only prepares the batch
        
        # Output batch as JSON for GitHub Actions matrix
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Add max_parallel field to batch metadata
        batch_with_metadata = {
            "max_parallel": max_paralleli,
            "tasks": batch
        }
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(batch_with_metadata, f, indent=2)
        print(f"[INFO] Batch written to {args.output}")
        
        # Write run summary - count tasks that completed during this cycle
        rows_after = parse_agent_assignments_rows()
        status_after = {row["id"].split()[0]: row["status"] for row in rows_after}
        completed_this_cycle = count_completed_this_cycle(status_before, status_after)
        write_run_summary(len(batch), len(blocked_tasks), completed_this_cycle, blocked_tasks, max_paralleli, manual_tasks)
    else:
        # Full dispatch mode: execute harness tasks automatically
        print("[INFO] Full dispatch mode - executing harness tasks automatically")
        
        # Dispatch harness tasks
        harness_count = dispatch_harness_batch(batch)
        if harness_count > 0:
            print(f"[INFO] {harness_count} harness tasks dispatched")
            # Send desktop notification for harness tasks
            send_desktop_notification(
                "Harness tasks in esecuzione",
                f"{harness_count} task harness avviati automaticamente"
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
