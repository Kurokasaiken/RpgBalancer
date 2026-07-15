#!/usr/bin/env python3
"""Usage report generator for AI worker multi-provider system.

Calculates statistics from test-results/ai-worker-*.json and coordinator/live_registry.json.
"""

import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List

ROOT_DIR = Path(__file__).resolve().parent.parent
EVIDENCE_DIR = ROOT_DIR / "test-results"
REGISTRY_PATH = ROOT_DIR / "coordinator" / "live_registry.json"
REPORT_PATH = ROOT_DIR / "coordinator" / "usage-report.json"


def load_evidence_files() -> List[dict]:
    """Load all ai-worker evidence files."""
    if not EVIDENCE_DIR.exists():
        return []
    
    evidence_files = list(EVIDENCE_DIR.glob("ai-worker-*.json"))
    evidence = []
    
    for file_path in evidence_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                evidence.append(json.load(f))
        except (json.JSONDecodeError, IOError):
            continue
    
    return evidence


def load_registry() -> dict:
    """Load live registry."""
    if not REGISTRY_PATH.exists():
        return {"running": [], "model_capacity": {}}
    
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_channel_stats(evidence: List[dict]) -> Dict[str, dict]:
    """Calculate statistics by channel (ai-worker, harness, manual)."""
    channel_stats = {
        "ai-worker": {"total": 0, "done": 0, "failed": 0, "skipped": 0},
        "harness": {"total": 0, "done": 0, "failed": 0, "skipped": 0},
        "manual": {"total": 0, "done": 0, "failed": 0, "skipped": 0},
    }
    
    for item in evidence:
        # Determine channel from task_id or other metadata
        # For now, assume all evidence files are from ai-worker
        channel = "ai-worker"
        if channel in channel_stats:
            channel_stats[channel]["total"] += 1
            status = item.get("status", "unknown")
            if status in channel_stats[channel]:
                channel_stats[channel][status] += 1
    
    return channel_stats


def calculate_provider_model_stats(evidence: List[dict]) -> Dict[str, dict]:
    """Calculate statistics by provider and model."""
    provider_model_stats = {}
    
    for item in evidence:
        provider = item.get("used_provider", "unknown")
        model = item.get("used_model", "unknown")
        key = f"{provider}/{model}"
        
        if key not in provider_model_stats:
            provider_model_stats[key] = {
                "provider": provider,
                "model": model,
                "calls": 0,
                "success": 0,
                "failed": 0,
                "fallback_count": 0,
            }
        
        provider_model_stats[key]["calls"] += 1
        status = item.get("status", "unknown")
        if status == "done":
            provider_model_stats[key]["success"] += 1
        elif status == "failed":
            provider_model_stats[key]["failed"] += 1
        
        # Count as fallback if not the first provider in the round-robin list
        # This is a heuristic; for accurate tracking, we'd need to store attempt order
        # For now, we'll estimate based on provider name (openrouter is typically first)
        if provider != "openrouter":
            provider_model_stats[key]["fallback_count"] += 1
    
    return provider_model_stats


def check_unused_providers(provider_model_stats: Dict[str, dict], days: int = 7) -> List[str]:
    """Check for providers/models with no calls in the last N days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    unused = []
    
    # Load evidence and filter by date
    evidence = load_evidence_files()
    recent_evidence = [
        e for e in evidence
        if datetime.fromisoformat(e.get("timestamp", "")) >= cutoff
    ]
    
    # Get all provider/model pairs from providers.py
    from providers import get_all_provider_model_pairs
    all_pairs = get_all_provider_model_pairs()
    
    # Check which pairs have no recent calls
    recent_keys = set()
    for e in recent_evidence:
        provider = e.get("used_provider", "unknown")
        model = e.get("used_model", "unknown")
        recent_keys.add(f"{provider}/{model}")
    
    for provider, model in all_pairs:
        key = f"{provider}/{model}"
        if key not in recent_keys:
            unused.append(key)
    
    return unused


def generate_report() -> dict:
    """Generate usage report."""
    evidence = load_evidence_files()
    registry = load_registry()
    
    channel_stats = calculate_channel_stats(evidence)
    provider_model_stats = calculate_provider_model_stats(evidence)
    unused_providers = check_unused_providers(provider_model_stats)
    
    # Calculate success rates
    for key, stats in provider_model_stats.items():
        if stats["calls"] > 0:
            stats["success_rate"] = round(stats["success"] / stats["calls"] * 100, 2)
            stats["fallback_rate"] = round(stats["fallback_count"] / stats["calls"] * 100, 2)
        else:
            stats["success_rate"] = 0
            stats["fallback_rate"] = 0
    
    # Calculate channel completion rates
    for channel, stats in channel_stats.items():
        if stats["total"] > 0:
            stats["completion_rate"] = round(stats["done"] / stats["total"] * 100, 2)
        else:
            stats["completion_rate"] = 0
    
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_tasks": len(evidence),
            "total_done": sum(s["done"] for s in channel_stats.values()),
            "total_failed": sum(s["failed"] for s in channel_stats.values()),
            "total_skipped": sum(s["skipped"] for s in channel_stats.values()),
        },
        "by_channel": channel_stats,
        "by_provider_model": provider_model_stats,
        "unused_providers_last_7_days": unused_providers,
        "registry_snapshot": {
            "running_tasks": len(registry.get("running", [])),
            "model_capacity": registry.get("model_capacity", {}),
        },
    }
    
    return report


def main():
    """Generate and write usage report."""
    report = generate_report()
    
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"[REPORT] Usage report written to {REPORT_PATH}")
    
    # Print summary
    print("\n=== USAGE REPORT SUMMARY ===")
    print(f"Total tasks: {report['summary']['total_tasks']}")
    print(f"Done: {report['summary']['total_done']}")
    print(f"Failed: {report['summary']['total_failed']}")
    print(f"Skipped: {report['summary']['total_skipped']}")
    
    print("\n=== BY CHANNEL ===")
    for channel, stats in report["by_channel"].items():
        if stats["total"] > 0:
            print(f"{channel}: {stats['total']} total, {stats['completion_rate']}% completion")
    
    print("\n=== BY PROVIDER/MODEL ===")
    for key, stats in report["by_provider_model"].items():
        if stats["calls"] > 0:
            print(f"{key}: {stats['calls']} calls, {stats['success_rate']}% success, {stats['fallback_rate']}% fallback")
    
    if report["unused_providers_last_7_days"]:
        print("\n=== UNUSED PROVIDERS (last 7 days) ===")
        for provider in report["unused_providers_last_7_days"]:
            print(f"  - {provider}")


if __name__ == "__main__":
    main()
