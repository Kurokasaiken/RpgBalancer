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

# Command to run manual tasks (easily modifiable)
MANUAL_TASKS_COMMAND = "/run-manual-tasks"


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
        """Check if task already exists in queue (pending or completed)."""
        queue = self._read_queue()
        for task in queue["tasks"]:
            if task["task_id"] == task_id and task["status"] in ("pending", "completed"):
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
    
    def _create_task_file(self, task: dict) -> Path:
        """Create task markdown file in pending directory."""
        task_id = task["task_id"]
        file_path = PENDING_DIR / f"{task_id}.md"
        
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
        
        # Check for duplicates
        if self._task_exists_in_queue(task_id):
            print(f"[INFO] Task {task_id} already in queue, skipping")
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
            if status == "pending":
                pending += 1
                pending_tasks.append({
                    "task_id": task["task_id"],
                    "timestamp": task.get("timestamp")
                })
            elif status == "completed":
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
    
    def mark_task_completed(self, task_id: str):
        """Mark a task as completed and move its file."""
        queue = self._read_queue()
        
        for task in queue["tasks"]:
            if task["task_id"] == task_id and task["status"] == "pending":
                # Move file from pending to completed
                old_path = Path(task.get("file_path", ""))
                if old_path.exists():
                    new_path = COMPLETED_DIR / f"{task_id}.md"
                    old_path.rename(new_path)
                    task["file_path"] = str(new_path)
                
                task["status"] = "completed"
                task["completed_at"] = datetime.now(timezone.utc).isoformat()
                self._write_queue(queue)
                print(f"[DISPATCH] Task {task_id} marked as completed")
                return
        
        print(f"[WARN] Task {task_id} not found in pending queue")
    
    def mark_task_failed(self, task_id: str, error_message: str = ""):
        """Mark a task as failed and move its file."""
        queue = self._read_queue()
        
        for task in queue["tasks"]:
            if task["task_id"] == task_id and task["status"] == "pending":
                # Move file from pending to failed
                old_path = Path(task.get("file_path", ""))
                if old_path.exists():
                    new_path = FAILED_DIR / f"{task_id}.md"
                    old_path.rename(new_path)
                    task["file_path"] = str(new_path)
                
                task["status"] = "failed"
                task["failed_at"] = datetime.now(timezone.utc).isoformat()
                task["error_message"] = error_message
                self._write_queue(queue)
                print(f"[DISPATCH] Task {task_id} marked as failed")
                return
        
        print(f"[WARN] Task {task_id} not found in pending queue")
    
    def complete_manual_task(self, task_id: str, status: str = "Completato"):
        """Complete a manual task with full cleanup.
        
        This method:
        1. Moves the task file from pending/ to completed/ or failed/
        2. Updates queue.json with new status
        3. Updates agent_assignments.md status to Completato
        
        Args:
            task_id: Task ID to complete
            status: Status to set ("Completato" for success, "Fallito" for failure)
        """
        if status == "Completato":
            # Move file and update queue
            self.mark_task_completed(task_id)
            # Update agent_assignments
            self._update_agent_assignments_status(task_id, "Completato")
        elif status == "Fallito":
            # Move file and update queue with error
            self.mark_task_failed(task_id, "Task execution failed")
            # Update agent_assignments
            self._update_agent_assignments_status(task_id, "Fallito")
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


def complete_manual_task(task_id: str, status: str = "Completato"):
    """Convenience function to complete a manual task with full cleanup.
    
    This is the main function that should be called by the /run-manual-tasks
    workflow after each task execution.
    
    Args:
        task_id: Task ID to complete
        status: Status to set ("Completato" for success, "Fallito" for failure)
    """
    get_dispatcher().complete_manual_task(task_id, status)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] in ("--status", "status"):
        import json
        print(json.dumps(get_manual_status(), indent=2, ensure_ascii=False))
    elif len(sys.argv) > 2 and sys.argv[1] in ("--complete", "complete"):
        complete_manual_task(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "Completato")
    else:
        print_manual_reminder()
