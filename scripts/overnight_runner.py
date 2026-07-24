#!/usr/bin/env python3
"""Thin wrapper that loads the overnight_runner package and runs its CLI."""

import importlib.util
import os
import sys


def _bootstrap_package() -> None:
    """Manually load the overnight_runner package to avoid file/package name clash."""
    here = os.path.dirname(os.path.abspath(__file__))
    package_dir = os.path.join(here, "overnight_runner")
    init_file = os.path.join(package_dir, "__init__.py")

    if not os.path.isdir(package_dir) or not os.path.isfile(init_file):
        raise RuntimeError("overnight_runner package not found")

    spec = importlib.util.spec_from_file_location(
        "overnight_runner",
        init_file,
        submodule_search_locations=[package_dir],
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Failed to create spec for overnight_runner package")

    module = importlib.util.module_from_spec(spec)
    sys.modules["overnight_runner"] = module
    spec.loader.exec_module(module)


_bootstrap_package()

if __name__ == "__main__":
    from overnight_runner import __main__ as entry

    sys.exit(entry.main())
