---
description: Execute manual SWE tasks from the dispatcher queue
---

# Run Manual Tasks Workflow

This workflow executes manual SWE tasks that have been dispatched to the manual queue by the coordinator.

## Steps

1. **Check queue status**
   ```bash
   python3 coordinator/dispatcher.py
   ```
   Or use the status function:
   ```python
   from coordinator.dispatcher import get_manual_status
   status = get_manual_status()
   print(f"Pending: {status['pending']}")
   ```

2. **List pending tasks**
   Read the pending task files from `coordinator/manual-dispatch/pending/`
   Each file contains: task_id, title, description, prompt, file_targets, dependencies

3. **Execute task**
   For each pending task:
   - Read the task markdown file
   - Execute the task in Windsurf SWE
   - Follow the prompt instructions
   - Modify the specified files
   - Verify the expected output

4. **Mark task as completed**
   After successful execution, call:
   ```python
   from coordinator.dispatcher import complete_manual_task
   complete_manual_task("TASK-ID", "Completato")
   ```
   This will:
   - Move the task file from pending/ to completed/
   - Update queue.json
   - Update agent_assignments.md status to "Completato"

5. **Mark task as failed** (if execution fails)
   If the task cannot be completed:
   ```python
   from coordinator.dispatcher import complete_manual_task
   complete_manual_task("TASK-ID", "Fallito")
   ```
   This will:
   - Move the task file from pending/ to failed/
   - Update queue.json
   - Update agent_assignments.md status to "Fallito"

6. **Repeat for all pending tasks**
   Continue until all pending tasks are completed or failed

7. **Re-run coordinator**
   After completing all manual tasks, re-run the coordinator to process any new tasks:
   ```bash
   python coordinator.py
   ```

## Example Usage

```python
# Example script to run all pending tasks
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from coordinator.dispatcher import get_manual_status, complete_manual_task

# Get pending tasks
status = get_manual_status()
print(f"Found {status['pending']} pending tasks")

for task_info in status['pending_tasks']:
    task_id = task_info['task_id']
    print(f"\nProcessing task: {task_id}")
    
    # Read task file
    task_file = Path("coordinator/manual-dispatch/pending") / f"{task_id}.md"
    with open(task_file, "r") as f:
        task_content = f.read()
    
    print(task_content)
    
    # Ask user if task was completed
    result = input(f"Was task {task_id} completed successfully? (y/n): ")
    
    if result.lower() == 'y':
        complete_manual_task(task_id, "Completato")
        print(f"Task {task_id} marked as completed")
    else:
        complete_manual_task(task_id, "Fallito")
        print(f"Task {task_id} marked as failed")
```

## Notes

- The workflow should be executed in Windsurf SWE context
- Each task should be executed completely before marking as completed
- If a task is partially completed but cannot be finished, mark as failed
- The coordinator will automatically dispatch new tasks on the next cycle
