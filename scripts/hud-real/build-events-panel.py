#!/usr/bin/env python3
"""Build the Events OPEN panel production slices from the Director-registered reference.

Input: `.mw/specs/hud-eventi/refs/ref-eventi-panel-aperto-2026-11-26.jpg`
Output: `public/assets/ui/hud-real/events/panel-top.webp`, `panel-row.webp`, `panel-bottom.webp`

Same magenta-key/decontamination recipe as build-events-bar.py. The keyed art
is cut into horizontal full-width bands so the panel stretches vertically:
bodytop cap (filter slots row + first divider, starting below the header band — the collapsed bar stays the visual header), one row band ending with
its divider (tiling), bottom cap (closing ornament). Slices never overwrite
the registered reference.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
from goldgrade import grade_gold_toward_time

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / '.mw/specs/hud-eventi/refs/ref-eventi-panel-aperto-2026-11-26.jpg'
OUT_DIR = ROOT / 'public/assets/ui/hud-real/events'

# Source-px cut lines measured on the registered reference (1024x682):
# dividers at y 293/294, 393, 492/493, 592/593; bottom ornament from ~593.
CUT_BODYTOP_START = 162  # just below the header band divider (154-161)
CUT_TOP_END = 294   # end of slots row divider -> bodytop cap [162, 294)
CUT_ROW_END = 393   # one full row + its divider  -> row band [294, 393)
CUT_BOTTOM_START = 593  # after the last divider -> bottom cap [593, 682)


def key_image() -> Image.Image:
    rgb = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    magenta = np.minimum(r, b) - g
    t0, t1 = 20.0, 125.0
    alpha_f = np.clip((t1 - magenta) / (t1 - t0), 0, 1)
    backing = np.array([254, 1, 252], dtype=np.float32)
    out = np.zeros_like(rgb)
    valid = alpha_f > 0.03
    for channel in range(3):
        out[..., channel] = np.where(
            valid,
            (rgb[..., channel] - (1 - alpha_f) * backing[channel]) / np.maximum(alpha_f, 0.03),
            0,
        )
    alpha = (alpha_f * 255).astype(np.uint8)
    alpha[alpha < 10] = 0
    rgba = np.dstack([np.clip(out, 0, 255).astype(np.uint8), alpha])
    image = Image.fromarray(rgba, 'RGBA')
    arr = np.array(image)
    matte = Image.fromarray(arr[..., 3]).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.35))
    arr[..., 3] = np.array(matte)
    return Image.fromarray(arr, 'RGBA')


def build() -> list[tuple[str, int, int]]:
    image = key_image()
    arr = np.array(image)
    # Horizontal trim once, on the union bbox of the whole panel, so every
    # slice shares the same width and x origin and bands stack aligned.
    alpha = arr[..., 3]
    xs = np.where(alpha.max(axis=0) > 20)[0]
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    w = image.size[0]
    results = []
    bands = [
        ('panel-bodytop', CUT_BODYTOP_START, CUT_TOP_END),
        ('panel-row', CUT_TOP_END, CUT_ROW_END),
        ('panel-bottom', CUT_BOTTOM_START, image.size[1]),
    ]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, y0, y1 in bands:
        crop = image.crop((x0, y0, x1, y1))
        if name == 'panel-bodytop':
            crop = deglow_first_slot(crop)
        path = OUT_DIR / f'{name}.webp'
        crop = grade_gold_toward_time(crop)
        crop.save(path, 'WEBP', lossless=True)
        results.append((name, crop.size[0], crop.size[1]))
    return results


def deglow_first_slot(crop: Image.Image) -> Image.Image:
    """The reference bakes a lit green glow on the first filter slot. The
    active-slot glow is dynamic in production (CSS owns it), so the first
    slot must start dark like the others: copy the second slot's gem patch —
    same gem design, same size — over the first. Slot centers in slice coords:
    x 334.5/437.5, y ~68, patch 92px square stays inside the rims' footprint."""
    arr = crop.copy()
    cy, radius, feather = 68, 64, 14
    x1s, x2s = 334, 437
    src = arr.crop((x2s - radius, cy - radius, x2s + radius, cy + radius))
    # Circular feathered mask: hard inside the gem rim, fading over the marble
    # so no rectangular seam and no leftover halo.
    mask = Image.new('L', (radius * 2, radius * 2), 0)
    import numpy as _np
    yy, xx = _np.mgrid[0 : radius * 2, 0 : radius * 2]
    dist = _np.sqrt((yy - radius) ** 2 + (xx - radius) ** 2)
    alpha = _np.clip((radius - dist) / feather, 0, 1)
    mask = Image.fromarray((alpha * 255).astype(_np.uint8), 'L')
    arr.paste(src, (x1s - radius, cy - radius), mask)
    return arr


if __name__ == '__main__':
    for name, w, h in build():
        print(f'wrote {name}.webp {w}x{h}')
