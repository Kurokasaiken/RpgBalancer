#!/usr/bin/env python3
"""build-stash-backdrop.py — regenerate `stash-mockup-backdrop.webp` finishes.

Director rulings 2026-11-25 (stash critique pass):
1. The painted tab-pill slabs are flattened to the plain recessed enamel band —
   the kind filter is rendered as DOM ring buttons (time-component sockets,
   roster ring family), so the raised pill shapes must not read through.
2. The inspector medallion interior is repainted: the flat erase disc (plus the
   rectangular erase artifact running below it) becomes a dark radial enamel
   seat so the plain painted item icon can fill the laurel ring 1:1 with the
   mockup.

The script is idempotent in effect but NOT in input: it reads the current
backing and overwrites it, so the pristine extraction is kept as
`stash-mockup-backdrop-src.webp` on first run and always regenerates FROM it.
Run:  python3 scripts/hud-real/build-stash-backdrop.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSET = ROOT / 'public/assets/ui/hud-real/stash-mockup-backdrop.webp'
SRC = ROOT / 'public/assets/ui/hud-real/stash-mockup-backdrop-src.webp'

rng = np.random.default_rng(20261125)


def noise(shape, amp=4.0):
    return rng.normal(0.0, amp, shape)


def main() -> None:
    if not SRC.exists():
        Image.open(ASSET).save(SRC)
    im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float64)
    H, W, _ = im.shape
    print(f'backing {W}x{H}')

    # ------------------------------------------------------------------
    # 1. Flatten the tab-pill strip. Pills span x 48..632, backing rows
    #    ~124..172 (raised edge shading included). The recessed band's own
    #    enamel is a dark green with a soft vertical gradient; rebuild it
    #    from the gap columns between the pills (x 162..173, 284..289,
    #    395..399) which carry pure background for the full strip height.
    # ------------------------------------------------------------------
    x0, x1 = 42, 640
    y0, y1 = 122, 175
    gap_cols = list(range(162, 174)) + list(range(284, 290)) + list(range(395, 400))
    profile = im[y0:y1, gap_cols].mean(axis=1)  # (rows, 3) vertical profile
    fill = np.repeat(profile[:, None, :], x1 - x0, axis=1)
    fill *= 0.55
    fill += noise(fill.shape, 2.5)
    # soft horizontal vignette so the band reads recessed like the original
    xs = np.arange(x1 - x0)
    edge = np.minimum(xs, xs[::-1]).clip(0, 60) / 60.0
    fill *= (0.82 + 0.18 * edge)[None, :, None]
    im[y0:y1, x0:x1] = fill

    # ------------------------------------------------------------------
    # 2. Medallion interior. The erase left a flat disc SMALLER than the
    #    laurel interior plus a rectangular artifact below it — patching only
    #    the flat pixels leaves hard-edged crescents that read as something
    #    covering the icon (Director 2026-11-25). Repaint the full interior:
    #    unconditional radial enamel inside r88; annulus r88–97 only on dark
    #    pixels so the laurel leaf tips survive.
    # ------------------------------------------------------------------
    cx, cy = 150.0, 538.0
    yy, xx = np.mgrid[0:H, 0:W]
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    # Single continuous radial falloff (center glow -> card enamel at r~110):
    # the same fill serves the laurel interior AND the erase footprint below
    # it, so no horizontal seam can appear anywhere (Director 2026-11-25:
    # mezzelune/covering artifact).
    t = (dist / 110.0).clip(0, 1)[..., None]
    # colors sampled from the original mockup medallion (emerald, g dominant)
    center_col = np.array([20.0, 60.0, 38.0])
    edge_col = np.array([5.0, 13.0, 9.0])
    radial = center_col * (1 - t) + edge_col * t
    radial += noise(radial.shape, 2.0)
    erase_flat = np.all(np.abs(im - np.array([12.0, 24.0, 20.0])) < 7, axis=2)
    region = (xx >= 40) & (xx <= 270) & (yy >= 425) & (yy <= 672)
    lum = im.sum(axis=2)
    core = dist <= 86.0
    annulus = (dist > 86.0) & (dist <= 97.0) & (lum < 60 * 3)
    mask = core | annulus | (erase_flat & region)
    im[mask] = radial[mask]

    # Detail text zone: the original erase only flattened the text core, so
    # antialiased glyph fragments and mottled ghost blobs survived around the
    # slabs (Director 2026-11-25 «qualcosa che copre i componenti»). The zone
    # is plain card enamel in the mockup and DOM text renders on top, so
    # repaint the whole rectangle with feathered edges — stopping above the
    # painted «Usable in Expeditions» pill frame (y>=565) and clear of the
    # brass frame edges.
    tx0, tx1, ty0, ty1 = 270, 690, 420, 565
    th, tw = ty1 - ty0, tx1 - tx0
    enamel = np.zeros((th, tw, 3)) + np.array([8.0, 13.0, 10.0])
    enamel += noise(enamel.shape, 2.2)
    fy = np.minimum(np.arange(th), np.arange(th)[::-1]).clip(0, 8) / 8.0
    fx = np.minimum(np.arange(tw), np.arange(tw)[::-1]).clip(0, 8) / 8.0
    feather = (fy[:, None] * fx[None, :])[..., None]
    zsrc = im[ty0:ty1, tx0:tx1]
    im[ty0:ty1, tx0:tx1] = zsrc * (1 - feather) + enamel * feather

    # ------------------------------------------------------------------
    # 3. Use/Pack button regeneration (Director 2026-11-25 «fatti rigenerare
    #    il pulsante da solo»): the «Use» label erase left a flat (16,88,64)
    #    slab on the glossy emerald button. Rebuild the lacquer: vertical
    #    emerald gradient with a centre-top highlight, matched to the
    #    surviving button pixels ((32,102,70) light → (6,72,44) shadow).
    # ------------------------------------------------------------------
    # Rounded-capsule interior reconstruction: the erase rectangle destroyed
    # the button's inner contour, so the fill mask is the button's own
    # interior shape (measured on the brass rim: x 554–698, rows 583–635,
    # corner radius ~24) — never a rectangle. Glossy emerald lacquer with a
    # specular streak and inner shadow at the rim.
    bx0, bx1, by0, by1 = 535, 722, 570, 646
    bzone = im[by0:by1, bx0:bx1].copy()
    bh, bw = bzone.shape[:2]
    yyb, xxb = np.mgrid[0:bh, 0:bw].astype(np.float64)
    # capsule contour in backing px (absolute coords)
    ax, ay = xxb + bx0, yyb + by0
    cxm, cym, hwx, hwy, crad = 624.0, 610.0, 68.0, 23.5, 22.0
    qx = np.abs(ax - cxm) - (hwx - crad)
    qy = np.abs(ay - cym) - (hwy - crad)
    sdf = np.sqrt(np.maximum(qx, 0) ** 2 + np.maximum(qy, 0) ** 2) + np.minimum(np.maximum(qx, qy), 0) - crad
    alpha = np.clip(0.5 - sdf / 2.0, 0, 1)  # 2px feather at the rim
    v = (ay - (cym - hwy)) / (2 * hwy)
    u = (ax - (cxm - hwx)) / (2 * hwx)
    top = np.array([34.0, 110.0, 72.0])
    bot = np.array([5.0, 56.0, 33.0])
    synth = top * (1 - v[..., None]) + bot * v[..., None]
    gx = (u - 0.42) * 2.0
    gy = (v - 0.28) * 2.8
    spec = np.clip(1 - (gx ** 2 + gy ** 2), 0, 1) ** 1.5 * 36.0
    synth[..., 0] += spec * 0.45
    synth[..., 1] += spec
    synth[..., 2] += spec * 0.55
    # inner shadow towards the rim — curved lacquer reading
    inner = np.clip(-sdf / 7.0, 0, 1)
    synth *= (0.62 + 0.38 * inner)[..., None]
    synth += noise(synth.shape, 2.4)
    a3 = alpha[..., None]
    bzone = bzone * (1 - a3) + synth * a3
    im[by0:by1, bx0:bx1] = bzone

    out = Image.fromarray(np.clip(im, 0, 255).astype(np.uint8))
    out.save(ASSET, 'WEBP', quality=92)
    print(f'written {ASSET}')


if __name__ == '__main__':
    main()
