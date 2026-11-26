#!/usr/bin/env python3
"""stash-frame-prep-source.py — assemble the stash frame slice source sheet.

Director 2026-11-26: the Gemini kit has no bottom corners (it returned top corners twice), and the
slicer has no flip/rotate. The bottom corners are therefore the TOP corners mirrored vertically,
done ONCE here on the source sheet (one reproducible op, recorded in the slice record), not as a
per-piece patch.

Rows (each 448 px tall, 2293 wide, all on the same flat fuchsia):
  0: kit-champagne-v3.jpg           top corners, plain edge strips, horizontal and vertical gems
  1: kit-champagne-v3.jpg flipped   vertically -> bottom corners (strips/gems on this row are unused)
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

RUN = Path('.mw/runs/stash-frame-slice')


def main() -> None:
    kit = Image.open(RUN / 'kit-champagne-v3.jpg').convert('RGB')
    w, h = kit.size
    out = Image.new('RGB', (w, h * 2))
    out.paste(kit, (0, 0))
    out.paste(ImageOps.flip(kit), (0, h))
    dst = RUN / 'kit-source-sheet.png'
    out.save(dst)
    print(f'wrote {dst} {out.size}')


if __name__ == '__main__':
    main()
