#!/usr/bin/env python3
"""Live registry manager for the Coordinator.

Manages coordinator/live_registry.json which tracks:
- Running tasks across all channels (ai-worker, harness, manual)
- Model capacity usage per minute
"""

import json
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Set, Tuple

ROOT_DIR = Path(__file__).resolve().parent.parent
REGISTRY_PATH = ROOT_DIR / "coordinator" / "live_registry.json"
REGISTRY_EVENTS_DIR = ROOT_DIR / "coordinator" / "registry-events"
REGISTRY_PROCESSED_DIR = REGISTRY_EVENTS_DIR / "processed"


def load_registry() -> dict:
    """Load the live registry from disk."""
    if not REGISTRY_PATH.exists():
        return {"running": [], "model_capacity": {}}
    
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def reset_registry():
    """Reset registry to clean state before each select-tasks cycle.
    
    Resets to:
    {
      "running": [],
      "model_capacity": {
        "qwen/qwen3-coder:free": {"limit_per_min": 20, "used_last_60s": 0},
        "meta-llama/llama-3.1-8b-instruct:free": {"limit_per_min": 20, "used_last_60s": 0},
        "mistralai/mistral-7b-instruct:free": {"limit_per_min": 20, "used_last_60s": 0}
      }
    }
    
    This happens BEFORE reconcile_registry(), which then reapplies real events
    from registry-events/*-end.json files.
    """
    clean_registry = {
        "running": [],
        "model_capacity": {
            "qwen/qwen3-coder:free": {"limit_per_min": 20, "used_last_60s": 0},
            "meta-llama/llama-3.1-8b-instruct:free": {"limit_per_min": 20, "used_last_60s": 0},
            "mistralai/mistral-7b-instruct:free": {"limit_per_min": 20, "used_last_60s": 0}
        }
    }
    
    save_registry(clean_registry)
    print("[RESET] Registry reset to clean state")


def save_registry(registry: dict):
    """Save the live registry to disk."""
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)


def register_task_start(
    task_id: str,
    channel: str,
    file_targets: List[str],
    model: str,
):
    """Register a task as starting in the live registry."""
    registry = load_registry()
    
    # Remove any existing entry for this task (in case of retry)
    registry["running"] = [r for r in registry["running"] if r["task_id"] != task_id]
    
    # Add new running entry
    registry["running"].append({
        "task_id": task_id,
        "channel": channel,
        "file_targets": file_targets,
        "model": model,
        "started_at": datetime.now(timezone.utc).isoformat(),
    })
    
    save_registry(registry)


def register_task_end(task_id: str, model: str):
    """Remove a task from running and update model capacity."""
    registry = load_registry()
    
    # Remove from running
    registry["running"] = [r for r in registry["running"] if r["task_id"] != task_id]
    
    # Update model capacity (decrement used_last_60s)
    if model in registry["model_capacity"]:
        registry["model_capacity"][model]["used_last_60s"] = max(
            0, registry["model_capacity"][model]["used_last_60s"] - 1
        )
    
    save_registry(registry)


def increment_model_usage(model: str):
    """Increment the usage counter for a model."""
    registry = load_registry()
    
    if model not in registry["model_capacity"]:
        registry["model_capacity"][model] = {"limit_per_min": 20, "used_last_60s": 0}
    
    registry["model_capacity"][model]["used_last_60s"] += 1
    save_registry(registry)


def get_running_tasks() -> List[dict]:
    """Get all currently running tasks."""
    registry = load_registry()
    return registry.get("running", [])


def get_model_capacity() -> Dict[str, Dict[str, int]]:
    """Get current model capacity status."""
    registry = load_registry()
    return registry.get("model_capacity", {})


def get_available_models() -> List[str]:
    """Get list of models with available capacity."""
    capacity = get_model_capacity()
    available = []
    
    for model, data in capacity.items():
        if data["used_last_60s"] < data["limit_per_min"]:
            available.append(model)
    
    return available


def cleanup_old_entries(max_age_minutes: int = 30) -> List[str]:
    """Remove running entries older than max_age_minutes.
    
    Returns list of removed task_ids (orphaned tasks).
    """
    registry = load_registry()
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=max_age_minutes)
    
    original_count = len(registry["running"])
    registry["running"] = [
        r for r in registry["running"]
        if datetime.fromisoformat(r["started_at"]) > cutoff
    ]
    
    removed_count = original_count - len(registry["running"])
    
    if removed_count > 0:
        save_registry(registry)
    
    # Return removed task_ids for logging
    return [r["task_id"] for r in registry["running"][:removed_count]]


def get_file_targets_by_channel() -> Dict[str, Set[str]]:
    """Get file targets currently occupied by each channel."""
    running = get_running_tasks()
    by_channel: Dict[str, Set[str]] = {
        "ai-worker": set(),
        "harness": set(),
        "manual": set(),
    }
    
    for task in running:
        channel = task["channel"]
        if channel in by_channel:
            for target in task["file_targets"]:
                by_channel[channel].add(target)
    
    return by_channel


def reconcile_registry() -> int:
    """Reconcile registry by processing end events from parallel jobs.
    
    Reads all files in coordinator/registry-events/*-end.json, calls
    register_task_end() for each, and moves processed files to processed/ subdirectory.
    
    Returns number of events processed.
    """
    if not REGISTRY_EVENTS_DIR.exists():
        return 0
    
    # Create processed directory if needed
    REGISTRY_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    
    # Find all -end.json files
    end_files = list(REGISTRY_EVENTS_DIR.glob("*-end.json"))
    
    if not end_files:
        return 0
    
    processed_count = 0
    
    for end_file in end_files:
        try:
            with open(end_file, "r", encoding="utf-8") as f:
                event = json.load(f)
            
            task_id = event.get("task_id")
            model_used = event.get("model_used", "")
            
            if task_id:
                register_task_end(task_id, model_used)
                processed_count += 1
            
            # Move to processed directory
            processed_path = REGISTRY_PROCESSED_DIR / end_file.name
            end_file.rename(processed_path)
            
        except (json.JSONDecodeError, KeyError, IOError) as e:
            print(f"[RECONCILE] Error processing {end_file.name}: {e}")
            continue
    
    print(f"[RECONCILE] Processed {processed_count} end events")
    return processed_count
