#!/usr/bin/env python3
"""PLAN-126 T-B2 — pixel-diff harness for bake-output visual regression.

Compares a re-encoded/downscaled asset set against the committed baseline and
produces (a) a JSON report with per-file delta stats and (b) side-by-side
contact sheets for the Director eyeball gate (OB-4 / D-1).

Usage:
  python3 scripts/asset-pixel-diff.py --old <dir> --new <dir> \
      [--glob '*.webp'] [--threshold 8] [--report out.json] [--sheets <dir>]

  --old / --new    asset roots matched by relative path (same filenames)
  --glob           file pattern inside the roots (default: *.webp)
  --threshold      per-channel abs delta counted as "changed" (0-255, default 8)
  --sheets <dir>   write <name>.diff.png contact sheets: old | new | heatmap
  --report <path>  JSON report (default: stdout)

Metrics per file: dims-match, meanAbsDelta, p95Delta, maxDelta,
pctPixelsOverThreshold (on RGBA union; alpha channel included).
"""
import argparse
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def delta_stats(a: np.ndarray, b: np.ndarray, threshold: int) -> dict:
    d = np.abs(a.astype(np.int16) - b.astype(np.int16))
    per_px = d.max(axis=2)  # worst channel per pixel
    return {
        "meanAbsDelta": round(float(d.mean()), 3),
        "p95Delta": int(np.percentile(d, 95)),
        "maxDelta": int(d.max()),
        "pctPixelsOverThreshold": round(float((per_px > threshold).mean() * 100), 3),
    }


def sheet(old: Image.Image, new: Image.Image, delta: np.ndarray, out: Path) -> None:
    heat = np.clip(delta.max(axis=2).astype(np.float32) * 4, 0, 255).astype(np.uint8)
    heat_rgb = np.stack([heat, np.zeros_like(heat), np.zeros_like(heat)], axis=2)
    old_rgba = np.array(old.convert("RGBA"))
    new_rgba = np.array(new.convert("RGBA"))
    canvas = np.concatenate([old_rgba, new_rgba, np.dstack([heat_rgb, np.full(heat.shape, 255, np.uint8)])], axis=1)
    Image.fromarray(canvas, "RGBA").save(out)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--old", required=True)
    ap.add_argument("--new", required=True)
    ap.add_argument("--glob", default="*.webp")
    ap.add_argument("--threshold", type=int, default=8)
    ap.add_argument("--report")
    ap.add_argument("--sheets")
    args = ap.parse_args()

    old_root, new_root = Path(args.old), Path(args.new)
    files = sorted(p.relative_to(old_root) for p in old_root.rglob(args.glob))
    if not files:
        print(f"no files matching {args.glob} under {old_root}", file=sys.stderr)
        return 2

    results = []
    worst = {"file": None, "pctPixelsOverThreshold": -1.0}
    for rel in files:
        old_p, new_p = old_root / rel, new_root / rel
        entry = {"file": str(rel)}
        if not new_p.exists():
            entry["error"] = "missing-in-new"
            results.append(entry)
            continue
        old_img = Image.open(old_p).convert("RGBA")
        new_img = Image.open(new_p).convert("RGBA")
        entry["dims"] = {"old": list(old_img.size), "new": list(new_img.size)}
        if old_img.size != new_img.size:
            new_img = new_img.resize(old_img.size, Image.LANCZOS)
            entry["resizedNewToOld"] = True
        stats = delta_stats(np.array(old_img), np.array(new_img), args.threshold)
        entry.update(stats)
        if args.sheets:
            os.makedirs(args.sheets, exist_ok=True)
            sheet(old_img, new_img, np.abs(np.array(old_img).astype(np.int16) - np.array(new_img).astype(np.int16)),
                  Path(args.sheets) / f"{rel.stem}.diff.png")
        if stats["pctPixelsOverThreshold"] > worst["pctPixelsOverThreshold"]:
            worst = {"file": str(rel), "pctPixelsOverThreshold": stats["pctPixelsOverThreshold"]}
        results.append(entry)

    report = {
        "old": str(old_root),
        "new": str(new_root),
        "glob": args.glob,
        "threshold": args.threshold,
        "files": len(results),
        "worst": worst,
        "results": results,
    }
    out = json.dumps(report, indent=2)
    if args.report:
        Path(args.report).parent.mkdir(parents=True, exist_ok=True)
        Path(args.report).write_text(out)
        print(f"report -> {args.report}")
    else:
        print(out)
    print(f"{len(results)} files, worst: {worst['file']} ({worst['pctPixelsOverThreshold']}% px > {args.threshold})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
