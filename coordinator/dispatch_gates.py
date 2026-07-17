#!/usr/bin/env python3
"""Dispatch gates for the Coordinator.

Implements two mandatory checks before dispatching any task to any executor:
1. DEPENDENCY GATE: Verifies all dependencies are completed
2. CROSS-CHANNEL FILE-TARGET AUDIT: Verifies file_targets are not occupied by other channels
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Set, Tuple

ROOT_DIR = Path(__file__).resolve().parent.parent
AGENT_ASSIGNMENTS_PATH = ROOT_DIR / "src" / "docs" / "docs" / "coordinator" / "agent_assignments.md"
AI_KANBAN_PATH = ROOT_DIR / "ai-worker" / "kanban.json"
DISPATCH_BLOCKS_LOG = ROOT_DIR / "coordinator" / "dispatch-blocks.log"


def log_dispatch_block(task_id: str, reason: str, blocking_info: str):
    """Log a dispatch block event to coordinator/dispatch-blocks.log."""
    timestamp = datetime.now(timezone.utc).isoformat()
    log_entry = f"[{timestamp}] BLOCKED {task_id} | {reason} | {blocking_info}\n"
    
    DISPATCH_BLOCKS_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(DISPATCH_BLOCKS_LOG, "a", encoding="utf-8") as f:
        f.write(log_entry)
    
    print(f"[BLOCK] {task_id}: {reason} ({blocking_info})")


def parse_agent_assignments_rows() -> List[dict]:
    """Parse agent_assignments.md and return list of row dicts.

    Supports multi-line prompt blocks embedded in the last table cell (```text ... ```).
    """
    if not AGENT_ASSIGNMENTS_PATH.exists():
        return []

    with open(AGENT_ASSIGNMENTS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.splitlines()
    rows = []
    i = 0

    def _title_from_prompt(prompt: str, fallback: str) -> str:
        """Extract a title from the prompt block (line after AGENT)."""
        if not prompt:
            return fallback
        prompt_lines = prompt.splitlines()
        for idx, pline in enumerate(prompt_lines):
            if pline.strip() == "AGENT" and idx + 1 < len(prompt_lines):
                return prompt_lines[idx + 1].strip()
        first = prompt.strip().lstrip("`").strip()
        return first or fallback

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if not stripped.startswith("|"):
            i += 1
            continue
        if "---" in stripped or stripped.startswith("| Prompt ID/Descrizione"):
            i += 1
            continue

        # Split the row into cells. Do not drop the last cell even when the row
        # does not end with a trailing |, because the last cell may start the
        # multi-line prompt block.
        raw_cells = stripped.strip("|").split("|")
        columns = [c.strip() for c in raw_cells]
        # Drop a truly empty trailing cell caused by a trailing |.
        if columns and columns[-1] == "":
            columns = columns[:-1]

        # Consume a multi-line prompt block when the last cell starts with ```text.
        if columns and columns[-1].startswith("```text"):
            prompt_lines = [columns[-1]]
            i += 1
            while i < len(lines):
                pline = lines[i]
                if pline.strip().startswith("```") and not pline.strip().startswith("```text"):
                    prompt_lines.append(pline.strip())
                    i += 1
                    break
                prompt_lines.append(pline)
                i += 1
            columns[-1] = "\n".join(prompt_lines).strip()

        if len(columns) < 5:
            i += 1
            continue
        if columns[0] == "Prompt ID/Descrizione":
            i += 1
            continue

        prompt_text = ""
        if len(columns) >= 10:
            # ADR/GOV 10-column format: ID, Status, Dependencies, Agent, Notes,
            # Executor, Executor Reason, Date, Prompt/Notes.
            # The exact column layout varies, so we detect the executor by value.
            known_executors = {"ai-worker", "harness", "manual", "agent", "swe", "Cascade"}
            executor = ""
            executor_reason = ""
            for idx, value in enumerate(columns[4:-1], start=4):
                if value in known_executors:
                    executor = value
                    if idx + 1 < len(columns) - 1:
                        executor_reason = columns[idx + 1]
                    break

            # Treat the last non-prompt cell before the prompt/notes as last_update
            # if it looks like a timestamp or date; otherwise leave empty.
            last_update = columns[8] if len(columns) > 8 else ""
            notes = columns[9] if len(columns) > 9 else columns[4]
            prompt_text = columns[-1] if columns[-1].startswith("```text") else notes

            row = {
                "id": columns[0],
                "status": columns[1],
                "dependencies": columns[2],
                "agent": columns[3],
                "last_update": last_update,
                "notes": notes,
                "executor": executor,
                "executor_reason": executor_reason,
            }
        elif len(columns) >= 8:
            # Trailer 8-column format: ID, Status, Data, Agent, Notes, Executor,
            # Executor Reason, Prompt.
            prompt_text = columns[7]
            row = {
                "id": columns[0],
                "status": columns[1],
                "dependencies": "",
                "agent": columns[3],
                "last_update": columns[2],
                "notes": columns[4],
                "executor": columns[5],
                "executor_reason": columns[6],
            }
        elif len(columns) == 7:
            # 7-column format (no Data column): ID, Status, Agent, Notes, Executor,
            # Executor Reason, Prompt/Reason.
            prompt_text = columns[6] if columns[6].startswith("```text") else ""
            reason = "" if prompt_text else columns[6]
            row = {
                "id": columns[0],
                "status": columns[1],
                "dependencies": "",
                "agent": columns[2],
                "last_update": "",
                "notes": columns[3],
                "executor": columns[4],
                "executor_reason": reason,
            }
        else:
            # Legacy 5-column format: ID, Status, Agent, Data, Notes.
            prompt_text = columns[4]
            row = {
                "id": columns[0],
                "status": columns[1],
                "dependencies": "",
                "agent": columns[2],
                "last_update": columns[3],
                "notes": columns[4],
                "executor": "",
                "executor_reason": "",
            }

        row["prompt"] = prompt_text
        row["title"] = _title_from_prompt(prompt_text, row["id"])
        row["description"] = row["title"]
        rows.append(row)
        # If we consumed a prompt block, i already points to the next line.
        if not (columns and columns[-1].startswith("```text")):
            i += 1

    return rows


def extract_file_targets_from_notes(notes: str) -> Set[str]:
    """Extract FILE TARGET or FILES TO MODIFY entries from notes/prompt."""
    # Try the explicit "FILE TARGET:" section first.
    match = re.search(r"FILE TARGET:\s*(.+?)(?=\n\n|\n[A-Z]|\n#|$)", notes, re.DOTALL)
    if match:
        targets_text = match.group(1).strip()
        targets = set()
        for target in re.split(r",|\n", targets_text):
            target = target.strip().strip("`")
            if target:
                targets.add(target)
        return targets

    # Try a "FILES TO MODIFY" numbered list (common in prompts).
    match = re.search(r"FILES TO MODIFY\s*\n(.*?)(?=\n\n|\n[A-Z][A-Z\s]+\n|\n#|$)", notes, re.DOTALL)
    if not match:
        return set()

    targets_text = match.group(1).strip()
    targets = set()
    for line in targets_text.splitlines():
        line = line.strip()
        if not line:
            continue
        # Match "1. `path/to/file` (note)" or just "1. path/to/file"
        m = re.match(r"\d+\.\s*`?(.+?)`?\s*$", line)
        if not m:
            continue
        target = m.group(1).strip("`").split(" - ")[0].split(" (")[0].strip()
        if target:
            targets.add(target)

    return targets


def get_in_progress_file_targets() -> Set[Tuple[str, str]]:
    """Get file_targets currently occupied by tasks in progress.
    
    Returns set of (file_path, task_id) tuples.
    """
    rows = parse_agent_assignments_rows()
    occupied = set()
    
    for row in rows:
        if row["status"] not in ("In corso", "Delegato ad ai-worker (in attesa)"):
            continue
        
        file_targets = extract_file_targets_from_notes(row["notes"])
        for target in file_targets:
            occupied.add((target, row["id"]))
    
    return occupied


def get_ai_worker_file_targets() -> Set[Tuple[str, str]]:
    """Get file_targets occupied by ai-worker tasks.
    
    Returns set of (file_path, task_id) tuples.
    """
    if not AI_KANBAN_PATH.exists():
        return set()
    
    with open(AI_KANBAN_PATH, "r", encoding="utf-8") as f:
        kanban = json.load(f)
    
    occupied = set()
    for task in kanban.get("tasks", []):
        status = task.get("status", "")
        if status in ("todo", "in_progress"):
            target_file = task.get("target_file", "")
            task_id = task.get("id", "")
            if target_file and task_id:
                occupied.add((target_file, task_id))
    
    return occupied


def get_harness_file_targets() -> Set[Tuple[str, str]]:
    """Get file_targets occupied by harness worktrees.
    
    Currently returns empty set as harness does not expose worktree state.
    In the future, this could read from a harness state file or log.
    """
    # TODO: Implement harness worktree state tracking if needed
    return set()


def check_dependency_gate(task_id: str, dependencies: str) -> Tuple[bool, str]:
    """Check if all dependencies are completed.
    
    Returns (allowed, reason) tuple.
    """
    if not dependencies or dependencies == "-":
        return True, ""
    
    rows = parse_agent_assignments_rows()
    row_by_id = {row["id"].split()[0]: row for row in rows}
    
    dep_ids = [dep.strip() for dep in re.split(r",|\s+", dependencies) if dep.strip() and dep.strip() != "-"]
    
    incomplete_deps = []
    for dep_id in dep_ids:
        dep_row = row_by_id.get(dep_id)
        if not dep_row:
            # Unknown dependency, treat as blocking
            incomplete_deps.append(f"{dep_id} (not found)")
        elif dep_row["status"] != "Completato":
            incomplete_deps.append(f"{dep_id} (status: {dep_row['status']})")
    
    if incomplete_deps:
        reason = f"Dependencies not completed: {', '.join(incomplete_deps)}"
        return False, reason
    
    return True, ""


def check_file_target_audit(task_id: str, file_targets: Set[str]) -> Tuple[bool, str]:
    """Check if file_targets conflict with occupied files across channels.
    
    Returns (allowed, reason) tuple.
    """
    if not file_targets:
        return True, ""
    
    # Get occupied files from all channels
    in_progress = get_in_progress_file_targets()
    ai_worker = get_ai_worker_file_targets()
    harness = get_harness_file_targets()
    
    all_occupied = in_progress | ai_worker | harness
    
    conflicts = []
    for target in file_targets:
        for (occupied_file, occupied_task_id) in all_occupied:
            if target == occupied_file or target in occupied_file or occupied_file in target:
                # Determine channel
                channel = "unknown"
                if (occupied_file, occupied_task_id) in in_progress:
                    channel = "agent_assignments"
                elif (occupied_file, occupied_task_id) in ai_worker:
                    channel = "ai-worker"
                elif (occupied_file, occupied_task_id) in harness:
                    channel = "harness"
                
                conflicts.append(f"{target} occupied by {occupied_task_id} ({channel})")
    
    if conflicts:
        reason = f"File conflicts: {', '.join(conflicts)}"
        return False, reason
    
    return True, ""


def check_dispatch_gates(
    task_id: str,
    dependencies: str,
    file_targets: Set[str],
) -> Tuple[bool, str]:
    """Run both dispatch gates before dispatching a task.
    
    Returns (allowed, reason) tuple. If not allowed, logs the block.
    """
    # Check dependency gate
    dep_allowed, dep_reason = check_dependency_gate(task_id, dependencies)
    if not dep_allowed:
        log_dispatch_block(task_id, "DEPENDENCY GATE", dep_reason)
        return False, f"In attesa di dipendenze: {dep_reason}"
    
    # Check file target audit
    file_allowed, file_reason = check_file_target_audit(task_id, file_targets)
    if not file_allowed:
        log_dispatch_block(task_id, "FILE TARGET AUDIT", file_reason)
        return False, f"In attesa - file occupato: {file_reason}"
    
    return True, ""
