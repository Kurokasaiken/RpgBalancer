#!/usr/bin/env python3
"""Generate medallion-ready square portraits from src/assets/portraits/*.

Each source portrait (e.g. 512x279 landscape) is the FULL portrait used by PgCard.
The medallion (WanderlustMedalOverlay) shows only a square, top-aligned, horizontally
centred crop of it (SVG `preserveAspectRatio="xMidYMin slice"`). This script writes that
exact square to src/assets/portraits/medal/<stem>.webp so the medallion decodes a small
file with the same framing.

Rules:
- Crop = centred square of side min(w, h), anchored at the top (matches xMidYMin slice).
- Native resolution by default (no resampling). --size N downsizes only; never upscales.
- Output is skipped when it is newer than the source (use --force to rebuild).
- Sources smaller than --min-side are reported: a medallion at 2x DPR needs ~256 px.

Usage:
    python scripts/build-medal-portraits.py [--size 256] [--force]
"""
import argparse
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src" / "assets" / "portraits"
OUT_DIR = SRC_DIR / "medal"
EXTS = {".png", ".jpg", ".jpeg", ".webp"}
SKIP = ("placeholder",)  # mirrors SKIP_PATTERNS in portraitAutoImports.ts


def medal_crop(img: Image.Image) -> Image.Image:
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    return img.crop((left, 0, left + side, side))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", type=int, default=0, help="downsize square to N px (0 = native)")
    ap.add_argument("--min-side", type=int, default=256)
    ap.add_argument("--quality", type=int, default=92)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    built = skipped = 0
    for src in sorted(SRC_DIR.iterdir()):
        if src.suffix.lower() not in EXTS or any(s in src.name.lower() for s in SKIP):
            continue
        out = OUT_DIR / f"{src.stem}.webp"
        if out.exists() and not args.force and out.stat().st_mtime >= src.stat().st_mtime:
            skipped += 1
            continue
        with Image.open(src) as im:
            im = im.convert("RGBA")
            sq = medal_crop(im)
            if args.size and args.size < sq.width:
                sq = sq.resize((args.size, args.size), Image.LANCZOS)
            elif sq.width < args.min_side:
                print(f"warn: {src.name} crop is {sq.width}px (< {args.min_side}); medallion will upscale", file=sys.stderr)
            sq.save(out, "WEBP", quality=args.quality, method=6)
        print(f"{src.name} -> medal/{out.name} ({sq.width}px, {out.stat().st_size // 1024} KB)")
        built += 1
    print(f"done: {built} built, {skipped} up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
