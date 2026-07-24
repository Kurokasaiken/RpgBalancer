"""Core runner logic: process groups, timeouts, logging, summary."""

import json
import os
import re
import signal
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


class TaskResult:
    """Result of a single task execution."""

    def __init__(self, task_id: str):
        self.id = task_id
        self.status = "PENDING"
        self.exit_code: Optional[int] = None
        self.duration = 0.0
        self.reason = ""
        self.output = ""


class OvernightRunner:
    """Fail-closed batch executor with per-task and global timeouts."""

    def __init__(
        self,
        config: Dict[str, Any],
        log_dir: Path,
        run_label: str = "overnight-runner",
    ):
        self.config = config
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        self.log_path = self.log_dir / f"{run_label}-{self.timestamp}.log"
        self.summary_path = self.log_dir / f"{run_label}-{self.timestamp}.json"
        self.start_time = time.monotonic()
        self.global_deadline = self.start_time + float(config["global_timeout_seconds"])
        self.current_process: Optional[subprocess.Popen] = None
        self.current_pgid: Optional[int] = None
        self.shutdown_requested = False
        self.runner_timeout = False
        self.results: List[TaskResult] = []
        self.log_lock = threading.Lock()
        self._setup_signal_handlers()

    def _setup_signal_handlers(self) -> None:
        for sig in (signal.SIGINT, signal.SIGTERM):
            signal.signal(sig, self._handle_signal)

    def _handle_signal(self, signum, _frame) -> None:
        self.shutdown_requested = True
        self.log_event(f"SIGNAL {signum} received, terminating current task")
        if self.current_process:
            self._kill(self.current_process, float(self.config["grace_period_seconds"]))
        sys.exit(2)

    def log_event(self, message: str) -> None:
        line = f"{datetime.now(timezone.utc).isoformat()} {message}"
        print(line, flush=True)
        with self.log_lock:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(line + "\n")

    def run(self) -> int:
        tasks = self.config["tasks"]
        total = len(tasks)
        exit_code = 0

        try:
            for i, task in enumerate(tasks, 1):
                if self.shutdown_requested or self.runner_timeout:
                    self.log_event("RUNNER abort: shutdown or timeout flag set")
                    exit_code = 2
                    break

                now = time.monotonic()
                if now >= self.global_deadline:
                    self.log_event("GLOBAL TIMEOUT reached before starting next task")
                    self.runner_timeout = True
                    exit_code = 2
                    break

                result = self.run_task(task, i, total)
                self.results.append(result)

                if result.status != "PASS":
                    exit_code = 1
                    if self.config.get("fail_fast", True):
                        break

                if self.runner_timeout:
                    exit_code = 2
                    break
        except Exception as exc:
            self.log_event(f"RUNNER ERROR {exc}")
            exit_code = 2
        finally:
            self.write_summary(exit_code)
            self.run_on_complete()

        return exit_code

    def run_task(self, task: Dict[str, Any], index: int, total: int) -> TaskResult:
        result = TaskResult(task["id"])
        timeout_seconds = float(task["timeout_seconds"])
        inactivity_seconds = float(task["inactivity_timeout_seconds"])
        heartbeat_pattern = task.get("heartbeat_pattern")
        heartbeat_re = re.compile(heartbeat_pattern) if heartbeat_pattern else None
        grace = float(self.config["grace_period_seconds"])
        task_start = time.monotonic()
        task_deadline = task_start + timeout_seconds

        self.log_event(f"STARTED {task['id']} [{index}/{total}]")
        print(f"[{index}/{total}] {task['id']} STARTED", flush=True)

        try:
            proc = subprocess.Popen(
                task["command"],
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.DEVNULL,
                start_new_session=True,
                text=True,
                bufsize=1,
            )
        except Exception as exc:
            duration = time.monotonic() - task_start
            result.status = "FAIL"
            result.reason = f"spawn error: {exc}"
            result.duration = duration
            self.log_event(f"FAIL {task['id']} spawn error {exc}")
            print(f"[{index}/{total}] {task['id']} FAIL", flush=True)
            return result

        self.current_process = proc
        try:
            self.current_pgid = os.getpgid(proc.pid)
        except ProcessLookupError:
            self.current_pgid = None

        output_lock = threading.Lock()
        last_output = [time.monotonic()]
        output_buffer: List[str] = []

        def reader(stream, name: str) -> None:
            try:
                for line in stream:
                    line = line.rstrip("\n")
                    with output_lock:
                        output_buffer.append(line)
                        self.log_event(f"OUTPUT {task['id']} {name} {line}")
                        now = time.monotonic()
                        if heartbeat_re is None or heartbeat_re.search(line):
                            last_output[0] = now
            except Exception:
                pass

        stdout_thread = threading.Thread(
            target=reader, args=(proc.stdout, "stdout"), daemon=True
        )
        stderr_thread = threading.Thread(
            target=reader, args=(proc.stderr, "stderr"), daemon=True
        )
        stdout_thread.start()
        stderr_thread.start()

        progress_interval = float(self.config.get("progress_interval_seconds", 30))
        last_progress = time.monotonic()

        while True:
            now = time.monotonic()

            if now >= self.global_deadline:
                self.log_event(f"GLOBAL TIMEOUT during {task['id']}")
                self._kill(proc, grace)
                result.status = "TIMEOUT"
                result.reason = "global timeout"
                result.duration = now - task_start
                self.runner_timeout = True
                break

            if now >= task_deadline:
                self.log_event(f"TIMEOUT {task['id']} per-task timeout")
                self._kill(proc, grace)
                result.status = "TIMEOUT"
                result.reason = "per-task timeout"
                result.duration = timeout_seconds
                break

            if now - last_output[0] >= inactivity_seconds:
                self.log_event(f"STUCK {task['id']} inactivity timeout")
                self._kill(proc, grace)
                result.status = "STUCK"
                result.reason = "inactivity timeout"
                result.duration = now - task_start
                break

            if now - last_progress >= progress_interval:
                elapsed = int(now - task_start)
                print(f"[{index}/{total}] {task['id']} RUNNING ({elapsed}s)", flush=True)
                last_progress = now

            ret = proc.poll()
            if ret is not None:
                duration = time.monotonic() - task_start
                result.duration = duration
                result.exit_code = ret
                if ret == 0:
                    result.status = "PASS"
                    self.log_event(f"PASS {task['id']} {ret} {duration:.2f}s")
                    print(f"[{index}/{total}] {task['id']} PASS", flush=True)
                else:
                    result.status = "FAIL"
                    result.reason = f"exit code {ret}"
                    self.log_event(f"FAIL {task['id']} {ret} {duration:.2f}s")
                    print(f"[{index}/{total}] {task['id']} FAIL", flush=True)
                break

            time.sleep(0.1)

        stdout_thread.join(timeout=1)
        stderr_thread.join(timeout=1)

        with output_lock:
            result.output = "\n".join(output_buffer)

        self.current_process = None
        self.current_pgid = None
        return result

    def _kill(self, proc: subprocess.Popen, grace: float) -> None:
        if proc.poll() is not None:
            return

        pgid = None
        try:
            pgid = os.getpgid(proc.pid)
        except ProcessLookupError:
            pass

        pids = self._descendant_pids(proc.pid) | ({proc.pid} if pgid is None else set())

        self._signal_pids(pids, pgid, signal.SIGTERM)

        try:
            proc.wait(timeout=grace)
        except subprocess.TimeoutExpired:
            self._signal_pids(pids, pgid, signal.SIGKILL)
            try:
                proc.kill()
            except ProcessLookupError:
                pass
            try:
                proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                pass

        self._close_pipes(proc)

    def _descendant_pids(self, pid: int) -> set:
        """Recursively collect PIDs of child processes using pgrep (best-effort)."""
        pids: set = set()
        try:
            out = subprocess.run(
                ["pgrep", "-P", str(pid)],
                capture_output=True,
                text=True,
                check=False,
            ).stdout
            for line in out.splitlines():
                child_pid = int(line.strip())
                if child_pid and child_pid != pid and child_pid not in pids:
                    pids.add(child_pid)
                    pids |= self._descendant_pids(child_pid)
        except (ValueError, FileNotFoundError, subprocess.SubprocessError):
            pass
        return pids

    def _signal_pids(
        self,
        pids: set,
        pgid: Optional[int],
        sig: int,
    ) -> None:
        """Send signal to the process group and to any known descendants."""
        if pgid:
            try:
                os.killpg(pgid, sig)
            except ProcessLookupError:
                pass
        for target_pid in pids:
            try:
                os.kill(target_pid, sig)
            except ProcessLookupError:
                pass

    def _close_pipes(self, proc: subprocess.Popen) -> None:
        """Close stdout/stderr to unblock reader threads after kill."""
        for stream in (proc.stdout, proc.stderr):
            if stream:
                try:
                    stream.close()
                except Exception:
                    pass

    def write_summary(self, exit_code: int) -> None:
        summary = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "config": {k: v for k, v in self.config.items() if k != "tasks"},
            "tasks": self.config.get("tasks", []),
            "log_path": str(self.log_path),
            "results": [
                {
                    "id": r.id,
                    "status": r.status,
                    "exit_code": r.exit_code,
                    "duration": round(r.duration, 3),
                    "reason": r.reason,
                    "output": r.output,
                }
                for r in self.results
            ],
            "total": len(self.results),
            "passed": sum(1 for r in self.results if r.status == "PASS"),
            "failed": sum(1 for r in self.results if r.status == "FAIL"),
            "timed_out": sum(1 for r in self.results if r.status == "TIMEOUT"),
            "stuck": sum(1 for r in self.results if r.status == "STUCK"),
            "runner_timeout": self.runner_timeout,
            "exit_code": exit_code,
        }

        with open(self.summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        self.log_event(
            f"SUMMARY total={summary['total']} passed={summary['passed']} "
            f"failed={summary['failed']} timed_out={summary['timed_out']} "
            f"stuck={summary['stuck']} exit_code={exit_code}"
        )
        print(
            f"SUMMARY total={summary['total']} passed={summary['passed']} "
            f"failed={summary['failed']} timed_out={summary['timed_out']} "
            f"stuck={summary['stuck']} exit_code={exit_code}",
            flush=True,
        )

    def run_on_complete(self) -> None:
        command = self.config.get("on_complete")
        if not command:
            return

        self.log_event(f"ON_COMPLETE START {command}")
        try:
            proc = subprocess.run(
                command,
                shell=True,
                timeout=60,
                capture_output=True,
                text=True,
            )
            self.log_event(
                f"ON_COMPLETE DONE exit={proc.returncode} "
                f"stdout={proc.stdout.strip()} stderr={proc.stderr.strip()}"
            )
        except Exception as exc:
            self.log_event(f"ON_COMPLETE WARN {exc}")
