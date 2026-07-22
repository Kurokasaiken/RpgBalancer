#!/usr/bin/env python3
"""Run a shell command with a configurable timeout.

Usage:
    python3 scripts/run_with_timeout.py <seconds> "<command>"

If the command exceeds the timeout it is killed and the script exits with 124.
"""
import subprocess
import sys
import os


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: run_with_timeout.py <seconds> <command>", file=sys.stderr)
        sys.exit(2)

    timeout = float(sys.argv[1])
    command = ' '.join(sys.argv[2:])
    cwd = os.getcwd()

    try:
        result = subprocess.run(command, shell=True, timeout=timeout, cwd=cwd)
        sys.exit(result.returncode)
    except subprocess.TimeoutExpired as exc:
        # Kill any lingering children of the shell.
        try:
            subprocess.run(f"pkill -P {exc.pid}", shell=True, check=False)
            subprocess.run(f"kill -9 {exc.pid}", shell=True, check=False)
        except Exception:
            pass
        print(f"\nTIMEOUT after {timeout}s: {command}", file=sys.stderr)
        sys.exit(124)


if __name__ == '__main__':
    main()
