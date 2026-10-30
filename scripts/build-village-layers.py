#!/usr/bin/env python3
"""Village-zone layers for /mappa2-lab (Director 2026-10-30).

1. House stages: the Gemini repaints (opaque 360x280 crops) become RGBA patches —
   an elliptical feathered mask around the buildings + low-frequency tone match to
   the real base map, so no rectangular crop edge or tone seam survives.
2. Defence rings: the cleaned ring sprites have the two back arcs cut out
   (gaps). Close them by column-cloning the intact back segment (edges
   interpolated to the arc ends) so palisade / wall are closed by construction.

Sources live in context/research/2026-10-29-mappa2-sprite-pilot/out/village-src/.
Run: python3 scripts/build-village-layers.py
"""
from pathlib import Path
import numpy as np
import cv2
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "context/research/2026-10-29-mappa2-sprite-pilot/out/village-src"
PACK = ROOT / "public/assets/world/mappa2/base"
VIL = PACK / "fx/village"
ZONE = (1399, 572, 360, 280)

# (stage file, ellipse centre x, y, radii rx, ry) in zone px
STAGES = [
    ("stage0", 148, 116, 108, 50),
    ("stage1", 153, 114, 112, 50),
]
FEATHER = 16.0


def stage_rgba(name, cx, cy, rx, ry, base):
    st = np.asarray(Image.open(SRC / f"{name}-src.webp").convert("RGB"), np.float32)
    # tone match: remove the low-frequency colour offset between repaint and map
    off = cv2.GaussianBlur(base, (0, 0), 14) - cv2.GaussianBlur(st, (0, 0), 14)
    st = np.clip(st + off, 0, 255)
    h, w = st.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)  # 1 at the ellipse
    edge = (1.0 - d) * min(rx, ry) / FEATHER
    a = np.clip(edge, 0, 1)
    a = a * a * (3 - 2 * a)
    rgba = np.dstack([st, a * 255]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(VIL / f"{name}.webp", quality=95, method=6)


def close_ring(src_name, out_name, upper_y, gaps, src_cols, center_x, strays=(), mirror=False):
    """Rebuild the back arc of a ring sprite.
    gaps: [(x0, x1)] columns (exclusive end) of the upper band (y < upper_y) to
    regenerate; their top/bottom edges follow a parabola through the two intact
    arc ends and the sprite's own back-centre, so the outline is one smooth
    ellipse arc. Column content is cloned (ping-pong) from the intact back
    segment `src_cols`, resampled vertically between the smoothed source edges
    so merlons / spikes survive. strays: [(x0,x1,y0,y1)] fragments to erase."""
    im = np.asarray(Image.open(SRC / src_name).convert("RGBA")).copy()

    def edges(x):
        ys = np.where(im[:upper_y, x, 3] > 128)[0]
        return (ys.min(), ys.max()) if ys.size else None

    for (x0, x1, y0, y1) in strays:
        im[y0:y1, x0:x1, :] = 0
    orig = im.copy()
    a, b = src_cols
    # smoothed source edges (min of tops / max of bottoms over a window) keep
    # crenellation notches inside the resampled range instead of flattening them
    srcE = {x: edges(x) for x in range(a, b)}
    xs = [x for x in range(a, b) if srcE[x]]
    tops = np.array([srcE[x][0] for x in xs], np.float32)
    bots = np.array([srcE[x][1] for x in xs], np.float32)
    k = 25
    tops_s = cv2.erode(tops[None, :], np.ones((1, k)))[0]
    bots_s = cv2.dilate(bots[None, :], np.ones((1, k)))[0]
    smooth = {x: (int(tops_s[i]), int(bots_s[i])) for i, x in enumerate(xs)}
    span = b - a

    for (x0, x1) in gaps:
        xl = x0 - 1
        while edges(xl) is None: xl -= 1
        xr = x1
        while edges(xr) is None: xr += 1
        pts = [(xl, *edges(xl)), (center_x, *edges(center_x)), (xr, *edges(xr))]
        px = np.array([p[0] for p in pts], np.float32)
        Tc = np.polyfit(px, np.array([p[1] for p in pts], np.float32), 2)
        Bc = np.polyfit(px, np.array([p[2] for p in pts], np.float32), 2)
        im[:upper_y, x0:x1, :] = 0
        for x in range(x0, x1):
            T = np.polyval(Tc, x); B = np.polyval(Bc, x)
            kk = (x - x0) % (2 * span)
            sx = a + (kk if kk < span else 2 * span - 1 - kk)  # ping-pong clone
            if sx not in smooth:
                continue
            st, sb = smooth[sx]
            col = orig[st:sb + 1, sx, :]
            n = max(2, int(round(B - T)) + 1)
            res = cv2.resize(col[:, None, :], (1, n), interpolation=cv2.INTER_LINEAR)[:, 0, :]
            y0 = int(round(T))
            im[y0:y0 + n, x, :] = res
    if mirror:
        im = im[:, ::-1].copy()
    Image.fromarray(im, "RGBA").save(VIL / "parts" / out_name)


def main():
    base = np.asarray(
        Image.open(PACK / "layers/base_flat.webp").convert("RGB").crop(
            (ZONE[0], ZONE[1], ZONE[0] + ZONE[2], ZONE[1] + ZONE[3])), np.float32)
    for s in STAGES:
        stage_rgba(*s, base)
    close_ring("ring-pal-src.png", "ring-pal-closed.png", 400,
               gaps=[(205, 385), (715, 890)], src_cols=(392, 560), center_x=560)
    # wall: the whole back arc is rebuilt so the S-curve of the old back segment goes away
    close_ring("ring-wall-src.png", "ring-wall-closed.png", 300,
               gaps=[(212, 905)], src_cols=(392, 700), center_x=560,
               mirror=True)  # gate right of centre, away from the river on the left
    print("ok")


if __name__ == "__main__":
    main()
