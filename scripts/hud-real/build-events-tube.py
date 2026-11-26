#!/usr/bin/env python3
"""Replace the Events bar fat pipe rails with the Time slim rail profile.

Director 2026-11-26: «il componente eventi ha un body differente… parlo del
frame della parte tipo tubo… renderla uguale a quella di Tempo. L'interno lo
manteniamo uguale, il medaglione grande finale nn va toccato».

Measured structures (source px, interior columns):
  TIME  top rail: y2 partial dark edge (67,67,22) / y3-4 bright (250,247,188)
        / y5 shadow (92,88,35) / y6 dark groove (26,33,4) — crisp thin line.
  EVENTS fat pipe: y33-51 top (6 rows bright gold + dark groove + teal glow),
        y131-149 bottom mirror — total ~19px per side.

Surgery per interior column: stretch the existing enamel gradient to cover
the freed pipe/groove/glow zone (interior enamel is preserved — same columns,
same horizontal light variation), then repaint thin rails replicating the
Time row profile transplanted horizontally from the Time art itself. The
outer silhouette (alpha) never changes. The end medallions are preserved by
fading the surgery out near them.

Deterministic post-step: run AFTER build-events-bar.py (which regenerates
bar.webp from the reference) and BEFORE goldgrade is irrelevant — ordering
with grading does not matter because grading adapts per-asset. Re-running
build-events-bar.py requires re-running this script and then build-events-interior.py.
"""
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
EVENTS = ROOT / 'public/assets/ui/hud-real/events/bar.webp'
TIME = ROOT / 'public/assets/ui/hud-real/time/bar-slim.webp'

# geometry in source px (measured 2026-11-26, see header)
EV_ENAMEL_TOP, EV_ENAMEL_BOT = 52, 130      # events interior enamel rows to preserve
EV_NEW_ENAMEL_TOP, EV_NEW_ENAMEL_BOT = 39, 142  # span after surgery
EV_RAIL_TOP_ROWS = (33, 38)   # rows repainted as thin rail (top)
EV_RAIL_BOT_ROWS = (143, 148) # rows repainted as thin rail (bottom)
TIME_TOP_STRIP = (2, 7)       # time rows that form the top rail+groove
TIME_BOT_STRIP = (102, 107)   # time rows for the bottom rail+groove
INTERIOR_X = (205, 795)       # straight tube section between end medallions
FADE = 55                     # horizontal fade width toward the end medallions


def column_stretch_enamel(arr, x):
    """Stretch one column's enamel gradient onto the wider span (in place).

    Director 2026-11-26: «la scritta sembra abbia uno sfondo dietro che
    sporca» — the naive per-row stretch smeared residual pipe-glow rows and
    high-frequency texture into a dirty haze band behind the title. Fix:
    heavy vertical smoothing of the source gradient before stretching — the
    enamel keeps its smooth cloudy low-frequency variation but no streaks.
    """
    src = arr[EV_ENAMEL_TOP:EV_ENAMEL_BOT + 1, x, :3].astype(np.float32)
    n_src = src.shape[0]
    kernel = 9
    pad = kernel // 2
    padded = np.vstack([np.repeat(src[:1], pad, axis=0), src, np.repeat(src[-1:], pad, axis=0)])
    smooth = np.apply_along_axis(lambda c: np.convolve(c, np.ones(kernel) / kernel, mode='valid'), 0, padded)
    n_dst = EV_NEW_ENAMEL_BOT - EV_NEW_ENAMEL_TOP + 1
    idx = np.linspace(0, n_src - 1, n_dst)
    lo = np.floor(idx).astype(int)
    hi = np.minimum(lo + 1, n_src - 1)
    frac = (idx - lo)[:, None]
    stretched = smooth[lo] * (1 - frac) + smooth[hi] * frac
    arr[EV_NEW_ENAMEL_TOP:EV_NEW_ENAMEL_BOT + 1, x, :3] = stretched


def horizontal_resize_strip(strip, width):
    """Resize a time rail strip horizontally to cover the events interior."""
    img = Image.fromarray(strip)
    return np.array(img.resize((width, strip.shape[1] if strip.ndim == 3 else width), Image.LANCZOS))


def main() -> None:
    ev = np.array(Image.open(EVENTS).convert('RGBA')).astype(np.float32)
    tm = np.array(Image.open(TIME).convert('RGBA')).astype(np.float32)
    x0, x1 = INTERIOR_X
    width = x1 - x0

    # 1. enamel stretch in the interior section (preserves horizontal variation)
    for x in range(x0, x1):
        column_stretch_enamel(ev, x)

    # 2. transplant the time rail rows, horizontally scaled to the interior width
    t_top = tm[TIME_TOP_STRIP[0]:TIME_TOP_STRIP[1], 300:500].astype(np.uint8)
    t_bot = tm[TIME_BOT_STRIP[0]:TIME_BOT_STRIP[1], 300:500].astype(np.uint8)
    top_rows = np.array(Image.fromarray(t_top).resize((width, 5), Image.LANCZOS)).astype(np.float32)
    bot_rows = np.array(Image.fromarray(t_bot).resize((width, 5), Image.LANCZOS)).astype(np.float32)

    # rail rows mapping: time rows y2-6 -> events rows y34-38 (top), y143-147 (bottom)
    # events row y33/y148 keep their partial-alpha silhouette edge: repaint with
    # the time partial-edge colour but keep events alpha.
    for i in range(5):
        ev[34 + i, x0:x1, :3] = top_rows[i, :, :3]
        ev[143 + i, x0:x1, :3] = bot_rows[i, :, :3]

    # 3. horizontal fade toward the end medallions: blend surgery with original
    orig = np.array(Image.open(EVENTS).convert('RGBA')).astype(np.float32)
    zone_y = slice(EV_RAIL_TOP_ROWS[0], EV_RAIL_BOT_ROWS[1] + 1)
    for fx in range(FADE):
        w = fx / FADE  # 0 near medallion -> 1 inside interior
        for x, ww in ((x0 + fx, w), (x1 - 1 - fx, w)):
            ev[zone_y, x, :3] = orig[zone_y, x, :3] * (1 - ww) + ev[zone_y, x, :3] * ww

    out = np.clip(ev, 0, 255).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(EVENTS, 'WEBP', lossless=True)
    print(f'tube surgery applied to {EVENTS}')


if __name__ == '__main__':
    main()
