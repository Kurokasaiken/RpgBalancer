"""Built-in dry-run scenarios for the overnight runner."""

from pathlib import Path

from .config import validate_config
from .runner import OvernightRunner


def build_dryrun_config() -> dict:
    return {
        "version": "1.0",
        "mode": "sequential",
        "global_timeout_seconds": 14,
        "grace_period_seconds": 2,
        "log_dir": "test-results",
        "progress_interval_seconds": 2,
        "fail_fast": False,
        "tasks": [
            {
                "id": "complete",
                "command": "echo 'step1' && sleep 1 && echo 'step2'",
                "timeout_seconds": 5,
                "inactivity_timeout_seconds": 5,
            },
            {
                "id": "hang",
                "command": "sleep 10000",
                "timeout_seconds": 4,
                "inactivity_timeout_seconds": 4,
            },
            {
                "id": "error",
                "command": "echo 'failure' && exit 1",
                "timeout_seconds": 5,
                "inactivity_timeout_seconds": 5,
            },
            {
                "id": "stuck",
                "command": "echo 'heartbeat' && sleep 10000",
                "timeout_seconds": 30,
                "inactivity_timeout_seconds": 3,
                "heartbeat_pattern": "^heartbeat$",
            },
            {
                "id": "global_1",
                "command": "sleep 10000",
                "timeout_seconds": 100,
                "inactivity_timeout_seconds": 100,
            },
            {
                "id": "global_2",
                "command": "sleep 10000",
                "timeout_seconds": 100,
                "inactivity_timeout_seconds": 100,
            },
        ],
    }


def main() -> int:
    config = build_dryrun_config()
    validate_config(config)
    log_dir = Path(config["log_dir"])
    runner = OvernightRunner(config, log_dir, run_label="overnight-runner-dryrun")
    return runner.run()
