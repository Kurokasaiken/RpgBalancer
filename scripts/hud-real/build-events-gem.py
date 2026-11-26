#!/usr/bin/env python3
"""Build the neutral Events gem from the signed Time dial-frame.

Input: `public/assets/ui/hud-real/time/dial-frame.webp` (NEVER modified —
it belongs to the Time component).
Output: `public/assets/ui/hud-real/events/gem-neutral.webp`

Director 2026-11-26: «togli il cerchio dentro il componente con lo
smeraldone» — the borrowed dial-frame carries the clock dial ring and tick
marks inside the emerald. Here the gem is semantic, not a clock: the faceted
emerald centre (r<100 of 180) is scaled up to fill the whole interior under
the gold bezel, erasing dial ring, seams and ticks. Deterministic.
"""
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/assets/ui/hud-real/time/dial-frame.webp'
OUT = ROOT / 'public/assets/ui/hud-real/events/gem-neutral.webp'

CENTRE_R = 100      # faceted emerald disc radius in the 360px source
COVER_R = 124       # dial ring/ticks end here; the gold bezel band (r~125+) stays IN FRONT of the emerald (Director 2026-11-26: the emerald must not sit over the ring)
FEATHER = 7


def build() -> tuple[int, int]:
    img = Image.open(SRC).convert('RGBA')
    size = img.size[0]
    c = size / 2
    # upscale the faceted centre so it covers the dial ring and ticks
    scale = COVER_R / CENTRE_R
    disc_box = (int(c - CENTRE_R), int(c - CENTRE_R), int(c + CENTRE_R), int(c + CENTRE_R))
    disc = img.crop(disc_box).resize((int(COVER_R * 2), int(COVER_R * 2)), Image.LANCZOS)
    out = img.copy()
    yy, xx = np.mgrid[0 : COVER_R * 2, 0 : COVER_R * 2]
    dist = np.sqrt((yy - COVER_R) ** 2 + (xx - COVER_R) ** 2)
    alpha = np.clip((COVER_R - FEATHER - dist) / FEATHER + 1, 0, 1)
    mask = Image.fromarray((alpha * 255).astype(np.uint8), 'L')
    out.paste(disc, (int(c - COVER_R), int(c - COVER_R)), mask)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, 'WEBP', lossless=True)
    return out.size


if __name__ == '__main__':
    w, h = build()
    print(f'wrote {OUT} {w}x{h}')
