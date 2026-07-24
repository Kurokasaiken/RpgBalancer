"""Verification harness for OPS-OVERNIGHT-001 success criteria.

Streams runner output live so long waits do not appear stuck.
"""

import json
import os
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple


def build_config(tasks: List[Dict[str, Any]], **overrides: Any) -> Dict[str, Any]:
    """Build a config with defaults and provided tasks/overrides."""
    config: Dict[str, Any] = {
        "version": "1.0",
        "mode": "sequential",
        "global_timeout_seconds": 60,
        "grace_period_seconds": 2,
        "log_dir": "test-results",
        "progress_interval_seconds": 2,
        "fail_fast": True,
        "tasks": tasks,
    }
    config.update(overrides)
    return config


def run_scenario(name: str, config: Dict[str, Any]) -> Tuple[int, float]:
    """Run a single scenario and stream its output."""
    fd, path = tempfile.mkstemp(suffix=".json", prefix="overnight-verify-")
    os.close(fd)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(config, f)

        print(f"\n>>> {name} starting", flush=True)
        start = time.monotonic()
        proc = subprocess.Popen(
            ["python3", "scripts/overnight_runner.py", "--config", path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        assert proc.stdout is not None
        for line in proc.stdout:
            print(line, end="", flush=True)
        elapsed = time.monotonic() - start
        proc.wait()
        print(f">>> {name} exit={proc.returncode} time={elapsed:.2f}s", flush=True)
        return proc.returncode, elapsed
    finally:
        try:
            os.remove(path)
        except FileNotFoundError:
            pass


def main() -> int:
    """Execute all OPS-OVERNIGHT-001 success criteria scenarios."""
    scenarios: List[Tuple[str, Dict[str, Any], int]] = [
        (
            "real_batch",
            build_config([
                {"id": "r1", "command": "echo real1 && sleep 1", "timeout_seconds": 10, "inactivity_timeout_seconds": 10, "heartbeat_pattern": None},
                {"id": "r2", "command": "echo real2 && sleep 1", "timeout_seconds": 10, "inactivity_timeout_seconds": 10, "heartbeat_pattern": None},
                {"id": "r3", "command": "echo real3", "timeout_seconds": 10, "inactivity_timeout_seconds": 10, "heartbeat_pattern": None},
            ]),
            0,
        ),
        (
            "per_task_timeout",
            build_config([
                {"id": "long", "command": "sleep 1000", "timeout_seconds": 5, "inactivity_timeout_seconds": 5, "heartbeat_pattern": None},
            ]),
            1,
        ),
        (
            "global_timeout",
            build_config(
                [
                    {"id": "g1", "command": "sleep 1000", "timeout_seconds": 100, "inactivity_timeout_seconds": 100, "heartbeat_pattern": None},
                    {"id": "g2", "command": "sleep 1000", "timeout_seconds": 100, "inactivity_timeout_seconds": 100, "heartbeat_pattern": None},
                ],
                global_timeout_seconds=10,
                fail_fast=False,
            ),
            2,
        ),
    ]

    results: List[Tuple[str, int, int, float]] = []
    all_pass = True
    for name, config, expected in scenarios:
        code, elapsed = run_scenario(name, config)
        ok = code == expected
        all_pass = all_pass and ok
        results.append((name, code, expected, elapsed))

    print("\n=== VERIFICATION SUMMARY ===", flush=True)
    for name, code, expected, elapsed in results:
        status = "PASS" if code == expected else "FAIL"
        print(f"{status}: {name} exit={code} expected={expected} time={elapsed:.2f}s", flush=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    log_path = Path("test-results") / f"overnight-runner-verify-{timestamp}.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with open(log_path, "w", encoding="utf-8") as f:
        f.write(f"=== VERIFICATION SUMMARY {datetime.now(timezone.utc).isoformat()} ===\n")
        for name, code, expected, elapsed in results:
            status = "PASS" if code == expected else "FAIL"
            f.write(f"{status}: {name} exit={code} expected={expected} time={elapsed:.2f}s\n")
    print(f"\nVerification log: {log_path}", flush=True)

    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
