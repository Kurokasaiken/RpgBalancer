#!/usr/bin/env python3
"""Garbage collector for live_registry.json.

Removes orphaned running entries (tasks that crashed or were abandoned)
to prevent them from blocking cluster calculations indefinitely.
"""

import argparse
import sys
from datetime import datetime, timezone

from registry_manager import cleanup_old_entries, get_running_tasks, load_registry, save_registry

DEFAULT_MAX_AGE_MINUTES = 30


def main():
    parser = argparse.ArgumentParser(description="Garbage collector for live registry")
    parser.add_argument(
        "--max-age-minutes",
        type=int,
        default=DEFAULT_MAX_AGE_MINUTES,
        help="Maximum age in minutes before considering a task orphaned (default: 30)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Show what would be removed without removing")
    args = parser.parse_args()

    print(f"[GC] Running garbage collection with max_age={args.max_age_minutes} minutes")

    # Get current running tasks
    running = get_running_tasks()
    print(f"[GC] Current running tasks: {len(running)}")

    if args.dry_run:
        # Show what would be removed
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=args.max_age_minutes)
        orphaned = [
            r for r in running
            if datetime.fromisoformat(r["started_at"]) < cutoff
        ]
        print(f"[GC] Would remove {len(orphaned)} orphaned tasks:")
        for task in orphaned:
            age = (datetime.now(timezone.utc) - datetime.fromisoformat(task["started_at"])).total_seconds() / 60
            print(f"  - {task['task_id']} (channel: {task['channel']}, age: {age:.1f} min)")
    else:
        # Actually remove orphaned entries
        removed = cleanup_old_entries(args.max_age_minutes)
        if removed:
            print(f"[GC] Removed {len(removed)} orphaned tasks:")
            for task_id in removed:
                print(f"  - {task_id}")
        else:
            print("[GC] No orphaned tasks found")

    print("[GC] Garbage collection complete")


if __name__ == "__main__":
    main()
