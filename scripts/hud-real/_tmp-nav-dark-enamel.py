#!/usr/bin/env python3
"""R-380 v2 (Director 2026-11-24, verbatim spec): the nav dock's enamel is cut
horizontally like the resources bar — top half stays green, bottom half goes
black INSIDE the component, outside the alcoves (socket glass), with gold
trim, rails, medallion and bright gems preserved.

Recipe: black weight = vertical ramp (onset ~48%, saturates ~0.97 at 72%,
held to the bottom edge) × per-pixel enamel weight (green-dominant, not gold,
not dark glass, not bright gem). Out: nav/bar-dark.webp
Run: tools/hud-real/venv/bin/python -I scripts/hud-real/_tmp-nav-dark-enamel.py
"""
import numpy as np
from PIL import Image

SRC = 'public/assets/ui/hud-real/nav/bar.webp'
OUT = 'public/assets/ui/hud-real/nav/bar-dark.webp'
Y_ONSET, Y_SAT, AMAX = 0.30, 0.82, 1.0


def main():
    a = np.array(Image.open(SRC).convert('RGBA')).astype(np.float32)
    h = a.shape[0]
    rgb, alpha = a[..., :3], a[..., 3] / 255.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b

    # enamel weight: 1 on green-dominant midtone, 0 on gold (r>g), dark glass, bright gems
    w = np.clip((g - r + 12) / 26, 0, 1)
    w *= (alpha > 0.5).astype(np.float32)
    w[lum < 22] = 0.0       # socket glass / deep shadow stays painted
    w[g > 150] = 0.0        # bright emeralds & hot highlights keep their colour

    y = np.arange(h, dtype=np.float32) / (h - 1)
    t = np.clip((y - Y_ONSET) / (Y_SAT - Y_ONSET), 0, 1)
    ramp = (t * t * (3 - 2 * t)) * AMAX          # smoothstep up to ~97% black
    k = (ramp[:, None] * w)                     # per-pixel black alpha
    rgb = rgb * (1 - k[..., None])

    out = np.dstack([rgb, a[..., 3]]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(OUT, 'WEBP', quality=95)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
