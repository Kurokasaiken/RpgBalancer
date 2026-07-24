"""CLI entry point for the overnight runner."""

import argparse
import sys
from pathlib import Path

from .config import load_config
from .runner import OvernightRunner


def main() -> int:
    parser = argparse.ArgumentParser(description="Overnight Safety Runner")
    parser.add_argument("--config", help="Path to JSON config file")
    parser.add_argument(
        "--dry-run", action="store_true", help="Run built-in dry-run scenarios"
    )
    args = parser.parse_args()

    if args.dry_run:
        from . import dryrun

        return dryrun.main()

    if not args.config:
        parser.error("--config is required (or use --dry-run)")

    config = load_config(args.config)
    log_dir = Path(config["log_dir"])
    runner = OvernightRunner(config, log_dir, run_label="overnight-runner")
    return runner.run()


if __name__ == "__main__":
    sys.exit(main())
