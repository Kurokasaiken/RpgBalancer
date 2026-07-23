#!/usr/bin/env python3
"""Manual Dispatcher for SWE tasks.

Manages persistent queue of manual tasks that require Windsurf SWE execution.
The dispatcher is the single source of truth for how manual tasks are executed.
"""

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

ROOT_DIR = Path(__file__).resolve().parent.parent
MANUAL_DISPATCH_DIR = ROOT_DIR / "coordinator" / "manual-dispatch"
QUEUE_FILE = MANUAL_DISPATCH_DIR / "queue.json"
PENDING_DIR = MANUAL_DISPATCH_DIR / "pending"
COMPLETED_DIR = MANUAL_DISPATCH_DIR / "completed"
FAILED_DIR = MANUAL_DISPATCH_DIR / "failed"
AGENT_ASSIGNMENTS_PATH = ROOT_DIR / "src" / "docs" / "docs" / "coordinator" / "agent_assignments.md"
STRATEGY_TASKS_PATH = ROOT_DIR / "src" / "docs" / "docs" / "coordinator" / "strategy_tasks.md"

# Command to run manual tasks (easily modifiable)
MANUAL_TASKS_COMMAND = "/run-manual-tasks"

# Status sets used to decide if a task is active/unique in the queue.
ACTIVE_STATUSES = {"pending", "assigned", "in_progress"}
TERMINAL_STATUSES = {"completed", "failed", "cancelled"}


class ManualDispatcher:
    """Dispatcher for manual SWE tasks."""
    
    def __init__(self):
        """Initialize dispatcher and ensure directory structure exists."""
        self._ensure_directories()
        self._ensure_queue_file()
    
    def _ensure_directories(self):
        """Create directory structure if it doesn't exist."""
        PENDING_DIR.mkdir(parents=True, exist_ok=True)
        COMPLETED_DIR.mkdir(parents=True, exist_ok=True)
        FAILED_DIR.mkdir(parents=True, exist_ok=True)
    
    def _ensure_queue_file(self):
        """Create queue.json if it doesn't exist."""
        if not QUEUE_FILE.exists():
            self._write_queue({"version": "1.0", "tasks": [], "last_updated": None})
    
    def _read_queue(self) -> dict:
        """Read queue.json."""
        try:
            with open(QUEUE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"[ERROR] Failed to read queue: {e}")
            return {"version": "1.0", "tasks": [], "last_updated": None}
    
    def _write_queue(self, queue_data: dict):
        """Write queue.json."""
        queue_data["last_updated"] = datetime.now(timezone.utc).isoformat()
        with open(QUEUE_FILE, "w", encoding="utf-8") as f:
            json.dump(queue_data, f, indent=2, ensure_ascii=False)
    
    def _task_exists_in_queue(self, task_id: str) -> bool:
        """Check if task is already active in the queue.

        Active means any non-terminal status (pending, assigned, in_progress).
        This prevents duplicate dispatch while still allowing retry/re-dispatch
        of completed or failed tasks if explicitly required.
        """
        queue = self._read_queue()
        for task in queue["tasks"]:
            if task["task_id"] == task_id and task.get("status") not in TERMINAL_STATUSES:
                return True
        return False
    
    def _update_agent_assignments_status(self, task_id: str, status: str):
        """Update task status in agent_assignments.md.

        Updates only the second column (Status) of the matching table row and
        preserves the original trailing pipe and multi-line prompt block.

        Args:
            task_id: Task ID to update
            status: New status (e.g., "Completato", "Fallito")
        """
        if not AGENT_ASSIGNMENTS_PATH.exists():
            print(f"[WARN] agent_assignments.md not found at {AGENT_ASSIGNMENTS_PATH}")
            return

        try:
            with open(AGENT_ASSIGNMENTS_PATH, "r", encoding="utf-8") as f:
                content = f.read()

            lines = content.split("\n")
            updated_lines = []
            prefix = f"| {task_id} "

            for line in lines:
                # Match the task row at the start (allow leading whitespace).
                if line.strip().startswith(prefix):
                    parts = line.split("|")
                    if len(parts) >= 3:
                        # parts[0] is empty (before the first |), parts[1] is the ID,
                        # parts[2] is the Status column.
                        parts[2] = f" {status} "
                        updated_line = "|".join(parts)
                        updated_lines.append(updated_line)
                        print(f"[DISPATCH] Updated {task_id} status to {status} in agent_assignments.md")
                        continue
                updated_lines.append(line)

            with open(AGENT_ASSIGNMENTS_PATH, "w", encoding="utf-8") as f:
                f.write("\n".join(updated_lines))

        except IOError as e:
            print(f"[ERROR] Failed to update agent_assignments.md: {e}")

    def _update_strategy_tasks_status(self, task_id: str, status: str, evidence_log: str = ""):
        """Update task status in strategy_tasks.md.

        Updates the Status column for an exact task row, or appends a completion
        note to the Notes column when the task_id is referenced inside a stream
        row (e.g. OPS-SHUTDOWN-002 inside the OPS-SHUTDOWN row).

        Args:
            task_id: Task ID to update
            status: New status (e.g. "Completato", "Fallito", "In corso")
            evidence_log: Optional evidence log path to append to notes
        """
        if not STRATEGY_TASKS_PATH.exists():
            print(f"[WARN] strategy_tasks.md not found at {STRATEGY_TASKS_PATH}")
            return

        try:
            with open(STRATEGY_TASKS_PATH, "r", encoding="utf-8") as f:
                content = f.read()

            lines = content.split("\n")
            updated_lines = []
            updated = False
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            if status == "Completato":
                display_status = f"✅ {date_str}"
            elif status == "Fallito":
                display_status = f"❌ {date_str}"
            else:
                display_status = status

            note_entry = f"[{task_id}: {display_status}"
            if evidence_log:
                note_entry += f", evidence: {evidence_log}"
            note_entry += "]"

            def _append_note(cells):
                current = cells[-1] if cells[-1] and cells[-1] != "-" else ""
                if note_entry in current:
                    return cells
                if current:
                    cells[-1] = f"{current} {note_entry}"
                else:
                    cells[-1] = note_entry
                return cells

            for line in lines:
                if not line.strip().startswith("|"):
                    updated_lines.append(line)
                    continue

                cells = [c.strip() for c in line.strip().strip("|").split("|")]
                if len(cells) < 7:
                    updated_lines.append(line)
                    continue

                # Exact match: task_id is the first column
                if cells[0] == task_id:
                    cells[4] = display_status
                    cells = _append_note(cells)
                    updated_lines.append("|" + "|".join(cells) + "|")
                    updated = True
                    continue

                # Partial match: task_id is referenced in the status or notes columns
                # (e.g. stream rows like OPS-SHUTDOWN that contain OPS-SHUTDOWN-002)
                status_cell = cells[4] if len(cells) > 4 else ""
                notes_cell = cells[-1] if cells else ""
                if task_id in status_cell or task_id in notes_cell:
                    cells = _append_note(cells)
                    updated_lines.append("|" + "|".join(cells) + "|")
                    updated = True
                    continue

                updated_lines.append(line)

            if updated:
                with open(STRATEGY_TASKS_PATH, "w", encoding="utf-8") as f:
                    f.write("\n".join(updated_lines))
                print(f"[DISPATCH] Updated {task_id} in strategy_tasks.md")
            else:
                print(f"[WARN] Task {task_id} not found in strategy_tasks.md")

        except IOError as e:
            print(f"[ERROR] Failed to update strategy_tasks.md: {e}")

    def _create_task_file(self, task: dict) -> Path:
        """Create task markdown file in pending directory.

        If the file already exists, existing content is preserved. This avoids
        overwriting manually-edited prompts when the coordinator re-dispatches
        an already-queued manual task.
        """
        task_id = task["task_id"]
        file_path = PENDING_DIR / f"{task_id}.md"

        if file_path.exists():
            print(f"[INFO] Task file {file_path} already exists, preserving existing content")
            return file_path

        content = f"""# Manual Task: {task_id}

## Title
{task.get('title', 'N/A')}

## Description
{task.get('description', 'N/A')}

## Prompt
{task.get('prompt', 'N/A')}

## Files to Modify
{chr(10).join(task.get('file_targets', [])) or 'N/A'}

## Expected Output
{task.get('expected_output', 'N/A')}

## Dependencies
{task.get('dependencies', 'N/A')}

## Timestamp
{task.get('timestamp', 'N/A')}

## Executor
{task.get('executor', 'manual')}
"""
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        return file_path
    
    def dispatch_to_manual(self, task: dict) -> bool:
        """Dispatch a task to the manual queue.
        
        Args:
            task: dict with keys:
                - task_id: str
                - title: str
                - description: str
                - prompt: str
                - file_targets: List[str]
                - expected_output: str (optional)
                - dependencies: str (optional)
                - executor: str (optional, default "manual")
        
        Returns:
            True if task was added to queue, False if duplicate
        """
        task_id = task.get("task_id")
        if not task_id:
            print("[ERROR] Task missing task_id")
            return False
        
        # Check for duplicates (any non-terminal status)
        if self._task_exists_in_queue(task_id):
            print(f"[INFO] Task {task_id} already active in queue, skipping dispatch")
            return False

        # Add timestamp if not present
        if "timestamp" not in task:
            task["timestamp"] = datetime.now(timezone.utc).isoformat()
        
        # Create task file
        try:
            self._create_task_file(task)
        except IOError as e:
            print(f"[ERROR] Failed to create task file for {task_id}: {e}")
            return False
        
        # Update queue
        queue = self._read_queue()
        queue["tasks"].append({
            "task_id": task_id,
            "status": "pending",
            "timestamp": task["timestamp"],
            "file_path": str(PENDING_DIR / f"{task_id}.md")
        })
        self._write_queue(queue)
        
        print(f"[DISPATCH] Task {task_id} dispatched to manual queue")
        return True
    
    def dispatch_batch_to_manual(self, tasks: List[dict]) -> int:
        """Dispatch multiple tasks to manual queue.
        
        Args:
            tasks: List of task dicts
        
        Returns:
            Number of tasks actually added (excluding duplicates)
        """
        added_count = 0
        for task in tasks:
            if self.dispatch_to_manual(task):
                added_count += 1
        return added_count
    
    def get_manual_status(self) -> dict:
        """Get status of manual queue.
        
        Returns:
            dict with:
                - pending: int
                - completed: int
                - failed: int
                - pending_tasks: List[dict] (task_id, timestamp)
        """
        queue = self._read_queue()
        
        pending = 0
        completed = 0
        failed = 0
        pending_tasks = []

        for task in queue["tasks"]:
            status = task.get("status", "pending")
            if status in ACTIVE_STATUSES:
                pending += 1
                pending_tasks.append({
                    "task_id": task["task_id"],
                    "timestamp": task.get("timestamp"),
                    "status": status
                })
            elif status in TERMINAL_STATUSES:
                if status == "completed":
                    completed += 1
                elif status == "failed":
                    failed += 1
        
        return {
            "pending": pending,
            "completed": completed,
            "failed": failed,
            "pending_tasks": pending_tasks,
            "queue_file": str(QUEUE_FILE)
        }
    
    def mark_task_completed(self, task_id: str, evidence_log: str = ""):
        """Mark a task as completed and move its file."""
        queue = self._read_queue()

        for task in queue["tasks"]:
            if task["task_id"] == task_id and task.get("status") in ACTIVE_STATUSES:
                # Move file from pending to completed
                old_path = Path(task.get("file_path", ""))
                if old_path.exists():
                    new_path = COMPLETED_DIR / f"{task_id}.md"
                    old_path.rename(new_path)
                    task["file_path"] = str(new_path)

                task["status"] = "completed"
                task["completed_at"] = datetime.now(timezone.utc).isoformat()
                if evidence_log:
                    task["evidence_log"] = evidence_log
                self._write_queue(queue)
                print(f"[DISPATCH] Task {task_id} marked as completed")
                return

        print(f"[WARN] Task {task_id} not found in pending queue")
    
    def mark_task_failed(self, task_id: str, error_message: str = "", evidence_log: str = ""):
        """Mark a task as failed and move its file."""
        queue = self._read_queue()

        for task in queue["tasks"]:
            if task["task_id"] == task_id and task.get("status") in ACTIVE_STATUSES:
                # Move file from pending to failed
                old_path = Path(task.get("file_path", ""))
                if old_path.exists():
                    new_path = FAILED_DIR / f"{task_id}.md"
                    old_path.rename(new_path)
                    task["file_path"] = str(new_path)

                task["status"] = "failed"
                task["failed_at"] = datetime.now(timezone.utc).isoformat()
                task["error_message"] = error_message
                if evidence_log:
                    task["evidence_log"] = evidence_log
                self._write_queue(queue)
                print(f"[DISPATCH] Task {task_id} marked as failed")
                return

        print(f"[WARN] Task {task_id} not found in pending queue")
    
    def complete_manual_task(
        self,
        task_id: str,
        status: str = "Completato",
        evidence_log: str = "",
    ):
        """Complete a manual task with full cleanup.

        This method:
        1. Moves the task file from pending/ to completed/ or failed/
        2. Updates queue.json with new status
        3. Updates agent_assignments.md status
        4. Updates strategy_tasks.md status / notes

        Args:
            task_id: Task ID to complete
            status: Status to set ("Completato" for success, "Fallito" for failure)
            evidence_log: Optional evidence log path to record in strategy_tasks.md
        """
        if status == "Completato":
            # Move file and update queue
            self.mark_task_completed(task_id, evidence_log)
            # Update agent_assignments
            self._update_agent_assignments_status(task_id, "Completato")
            # Update strategy_tasks
            self._update_strategy_tasks_status(task_id, "Completato", evidence_log)
        elif status == "Fallito":
            # Move file and update queue with error
            self.mark_task_failed(task_id, "Task execution failed", evidence_log)
            # Update agent_assignments
            self._update_agent_assignments_status(task_id, "Fallito")
            # Update strategy_tasks
            self._update_strategy_tasks_status(task_id, "Fallito", evidence_log)
        else:
            print(f"[ERROR] Invalid status: {status}. Use 'Completato' or 'Fallito'")
    
    def send_desktop_notification(self, title: str, message: str):
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
    
    def print_reminder(self):
        """Print reminder message if queue is not empty."""
        status = self.get_manual_status()
        
        if status["pending"] > 0:
            print("\n" + "=" * 50)
            print("[MANUAL DISPATCH]")
            print(f"Sono presenti {status['pending']} task in attesa.")
            print(f"\nPer eseguirli apri Windsurf ed esegui:")
            print(f"  {MANUAL_TASKS_COMMAND}")
            print(f"\nDopo il completamento rilancia:")
            print(f"  python3 coordinator/coordinator.py")
            print(f"oppure attendi il prossimo ciclo automatico.")
            print("=" * 50 + "\n")
    
    def dispatch_to_gui(self) -> str:
        """Stub for future GUI integration.
        
        Returns:
            "not_implemented"
        """
        return "not_implemented"


# Global dispatcher instance
_dispatcher = None


def get_dispatcher() -> ManualDispatcher:
    """Get or create global dispatcher instance."""
    global _dispatcher
    if _dispatcher is None:
        _dispatcher = ManualDispatcher()
    return _dispatcher


def dispatch_to_manual(task: dict) -> bool:
    """Convenience function to dispatch a single task."""
    return get_dispatcher().dispatch_to_manual(task)


def dispatch_batch_to_manual(tasks: List[dict]) -> int:
    """Convenience function to dispatch multiple tasks."""
    return get_dispatcher().dispatch_batch_to_manual(tasks)


def get_manual_status() -> dict:
    """Convenience function to get manual queue status."""
    return get_dispatcher().get_manual_status()


def print_manual_reminder():
    """Convenience function to print manual queue reminder."""
    get_dispatcher().print_reminder()


def send_manual_notification(title: str, message: str):
    """Convenience function to send desktop notification."""
    get_dispatcher().send_desktop_notification(title, message)


def complete_manual_task(task_id: str, status: str = "Completato", evidence_log: str = ""):
    """Convenience function to complete a manual task with full cleanup.

    This is the main function that should be called by the /run-manual-tasks
    workflow after each task execution.

    Args:
        task_id: Task ID to complete
        status: Status to set ("Completato" for success, "Fallito" for failure)
        evidence_log: Optional evidence log path to record in strategy_tasks.md
    """
    get_dispatcher().complete_manual_task(task_id, status, evidence_log)


def update_strategy_tasks_status(task_id: str, status: str = "Completato", evidence_log: str = ""):
    """Convenience function to update a task status in strategy_tasks.md.

    Args:
        task_id: Task ID to update
        status: Status to set ("Completato", "Fallito", "In corso")
        evidence_log: Optional evidence log path to append to notes
    """
    get_dispatcher()._update_strategy_tasks_status(task_id, status, evidence_log)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] in ("--status", "status"):
        import json
        print(json.dumps(get_manual_status(), indent=2, ensure_ascii=False))
    elif len(sys.argv) > 2 and sys.argv[1] in ("--complete", "complete"):
        evidence = sys.argv[4] if len(sys.argv) > 4 else ""
        complete_manual_task(
            sys.argv[2],
            sys.argv[3] if len(sys.argv) > 3 else "Completato",
            evidence,
        )
    else:
        print_manual_reminder()
