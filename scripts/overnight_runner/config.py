"""Configuration loading and validation for the overnight runner."""

import json
import re
from pathlib import Path
from typing import Any, Dict

DEFAULT_CONFIG_PATH = Path(__file__).with_name("default.config.json")

FORBIDDEN_PATTERNS = [
    r"shutdown",
    r"poweroff",
    r"halt",
    r"osascript",
    r"pmset",
    r"sudo\s+shutdown",
    r"tell\s+application.*shut\s+down",
]


def load_config(config_path: str) -> Dict[str, Any]:
    """Load user config merged over defaults."""
    with open(DEFAULT_CONFIG_PATH, "r", encoding="utf-8") as f:
        defaults = json.load(f)
    with open(config_path, "r", encoding="utf-8") as f:
        user_config = json.load(f)

    config = {**defaults, **user_config}
    config["tasks"] = user_config.get("tasks", defaults.get("tasks", []))
    validate_config(config)
    return config


def validate_config(config: Dict[str, Any]) -> None:
    """Validate config structure and guard against forbidden command strings."""
    required = ["global_timeout_seconds", "grace_period_seconds", "log_dir", "tasks"]
    for key in required:
        if key not in config:
            raise ValueError(f"Missing required config key: {key}")

    if not isinstance(config["tasks"], list):
        raise ValueError("tasks must be a list")

    for index, task in enumerate(config["tasks"]):
        validate_task(task, index)

    if config.get("on_complete"):
        guard_string(config["on_complete"], "on_complete")


def validate_task(task: Any, index: int) -> None:
    """Validate a single task entry."""
    if not isinstance(task, dict):
        raise ValueError(f"Task {index} must be an object")

    if "id" not in task or "command" not in task or "timeout_seconds" not in task:
        raise ValueError(f"Task {index} missing id/command/timeout_seconds")

    timeout = task["timeout_seconds"]
    if not isinstance(timeout, (int, float)) or timeout <= 0:
        raise ValueError(f"Task {index} timeout_seconds must be positive")

    task.setdefault("inactivity_timeout_seconds", timeout)
    task.setdefault("heartbeat_pattern", None)

    if task["inactivity_timeout_seconds"] is None:
        task["inactivity_timeout_seconds"] = timeout

    guard_string(task["command"], f"tasks[{index}].command")


def guard_string(value: Any, context: str) -> None:
    """Reject strings that contain forbidden shutdown/poweroff commands."""
    if not isinstance(value, str):
        return

    lower_value = value.lower()
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, lower_value):
            raise ValueError(f"Forbidden pattern '{pattern}' found in {context}: {value}")
