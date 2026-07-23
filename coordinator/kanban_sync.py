#!/usr/bin/env python3
"""Kanban sync verifier and repair tool.

Compares the three sources of truth for task status:
- coordinator/manual-dispatch/queue.json
- src/docs/docs/coordinator/agent_assignments.md
- src/docs/docs/coordinator/strategy_tasks.md

Run with --check to report mismatches, --fix to repair them.
"""

import argparse
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from dispatcher import get_dispatcher
from dispatch_gates import parse_agent_assignments_rows

ROOT_DIR = Path(__file__).resolve().parent.parent
QUEUE_FILE = ROOT_DIR / "coordinator" / "manual-dispatch" / "queue.json"
STRATEGY_TASKS_PATH = ROOT_DIR / "src" / "docs" / "docs" / "coordinator" / "strategy_tasks.md"


def _status_map(queue_status: str) -> str:
    """Map queue.json status to agent_assignments/strategy_tasks status text."""
    return {
        "completed": "Completato",
        "failed": "Fallito",
        "pending": "Non assegnato",
    }.get(queue_status, queue_status)


def _is_terminal_status(status: str, queue_status: str) -> bool:
    """Return True if status matches the queue terminal status, accepting legacy formats."""
    status_lower = status.lower()
    if queue_status == "completed":
        return status.startswith("✅") or "completato" in status_lower
    if queue_status == "failed":
        return status.startswith("❌") or "fallito" in status_lower
    if queue_status == "pending":
        return status in ("Non assegnato", "In attesa")
    return status == queue_status


def parse_strategy_tasks_table() -> List[Dict[str, List[str]]]:
    """Parse strategy_tasks.md and return list of table row dicts.

    Each dict contains:
    - cells: list of stripped cell strings
    - line_index: original line number in the file
    """
    rows = []
    if not STRATEGY_TASKS_PATH.exists():
        return rows

    lines = STRATEGY_TASKS_PATH.read_text(encoding="utf-8").splitlines()
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if len(cells) < 7:
            continue
        if cells[0] in ("", "Task ID", "Task") or cells[0].startswith("-"):
            continue
        rows.append({"cells": cells, "line_index": idx})
    return rows


def _find_strategy_row(task_id: str, rows: List[Dict[str, List[str]]]) -> Tuple[Optional[Dict], str]:
    """Find the best strategy_tasks.md row for a task_id.

    Returns (row, match_type) where match_type is "exact", "partial" or "missing".
    """
    for row in rows:
        cells = row["cells"]
        if cells[0] == task_id:
            return row, "exact"
    for row in rows:
        cells = row["cells"]
        # Partial match only in status or notes columns to avoid false positives
        status_cell = cells[4] if len(cells) > 4 else ""
        notes_cell = cells[-1] if cells else ""
        if task_id in status_cell or task_id in notes_cell:
            return row, "partial"
    return None, "missing"


def check_sync() -> List[str]:
    """Check consistency between queue, agent_assignments and strategy_tasks.

    Only reports issues for tasks that are present in at least one of the
    markdown tables. Tasks that live only in queue.json (e.g. ad-hoc manual
    tasks) are ignored because strategy_tasks.md is a curated strategy view.

    Returns a list of human-readable issue strings.
    """
    issues: List[str] = []

    if not QUEUE_FILE.exists():
        return [f"[ERROR] Queue file not found: {QUEUE_FILE}"]

    queue = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
    agent_rows = parse_agent_assignments_rows()
    strategy_rows = parse_strategy_tasks_table()

    agent_by_id = {row["id"].split()[0]: row for row in agent_rows}

    for task in queue.get("tasks", []):
        task_id = task["task_id"]
        queue_status = task.get("status", "pending")
        expected_status = _status_map(queue_status)

        # Check agent_assignments (operational source of truth)
        agent_row = agent_by_id.get(task_id)
        if agent_row:
            agent_status = agent_row.get("status", "")
            if agent_status != expected_status:
                issues.append(
                    f"{task_id}: queue is '{queue_status}' but agent_assignments status is '{agent_status}'"
                )
        elif queue_status in ("completed", "failed"):
            # Terminal tasks should always be recorded in agent_assignments.md
            issues.append(f"{task_id}: present in queue.json as '{queue_status}' but missing from agent_assignments.md")

        # Check strategy_tasks only when the task is referenced there
        strategy_row, match_type = _find_strategy_row(task_id, strategy_rows)
        if not strategy_row:
            continue

        cells = strategy_row["cells"]
        if match_type == "exact":
            status_cell = cells[4] if len(cells) > 4 else ""
            if not _is_terminal_status(status_cell, queue_status):
                issues.append(
                    f"{task_id}: strategy_tasks.md status '{status_cell}' does not match queue '{queue_status}'"
                )
        else:
            notes_cell = cells[-1] if cells else ""
            marker = f"[{task_id}:"
            if marker not in notes_cell:
                issues.append(
                    f"{task_id}: referenced in strategy_tasks.md but not marked in notes (queue '{queue_status}')"
                )

    return issues


def fix_sync() -> List[str]:
    """Repair inconsistencies by aligning agent_assignments and strategy_tasks to queue.json."""
    fixed: List[str] = []

    if not QUEUE_FILE.exists():
        return [f"[ERROR] Queue file not found: {QUEUE_FILE}"]

    dispatcher = get_dispatcher()
    queue = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
    strategy_rows = parse_strategy_tasks_table()

    for task in queue.get("tasks", []):
        task_id = task["task_id"]
        queue_status = task.get("status", "pending")
        evidence_log = task.get("evidence_log", "")

        if queue_status == "completed":
            dispatcher._update_agent_assignments_status(task_id, "Completato")
            # Only touch strategy_tasks.md if the task is actually referenced there
            if _find_strategy_row(task_id, strategy_rows)[0]:
                dispatcher._update_strategy_tasks_status(task_id, "Completato", evidence_log)
                fixed.append(f"{task_id}: aligned to Completato (strategy + agent)")
            else:
                fixed.append(f"{task_id}: aligned to Completato (agent only)")
        elif queue_status == "failed":
            dispatcher._update_agent_assignments_status(task_id, "Fallito")
            if _find_strategy_row(task_id, strategy_rows)[0]:
                dispatcher._update_strategy_tasks_status(task_id, "Fallito", evidence_log)
                fixed.append(f"{task_id}: aligned to Fallito (strategy + agent)")
            else:
                fixed.append(f"{task_id}: aligned to Fallito (agent only)")

    return fixed


def main():
    parser = argparse.ArgumentParser(
        description="Verify/repair kanban sync across queue, agent_assignments and strategy_tasks"
    )
    parser.add_argument("--check", action="store_true", help="Report mismatches without writing")
    parser.add_argument("--fix", action="store_true", help="Repair mismatches from queue.json")
    args = parser.parse_args()

    if args.fix:
        fixed = fix_sync()
        print("\n".join(fixed) if fixed else "No terminal tasks to fix.")
        return

    if args.check:
        issues = check_sync()
        if issues:
            print("Sync issues found:")
            print("\n".join(f"  - {issue}" for issue in issues))
            raise SystemExit(1)
        print("Kanban sync OK: queue, agent_assignments.md and strategy_tasks.md are aligned.")
        return

    parser.print_help()


if __name__ == "__main__":
    main()
