#!/usr/bin/env python3
"""Retouch the compass medallion PNG:
1) isolate the medallion from map/banner/text background -> alpha channel
2) empty the center (central emerald, gold X, gold +) -> teal-green disc,
   ready to host icons.

Medallion geometry (measured on the 230x248 source): centre ~(115,124),
outer ring r~100, four spikes (N/E/S/W) reaching r~118-122. Background is
a green plaque with gold borders + map/water.

Run: .mw/venv/bin/python scripts/_tmp-medallion-retouch.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "out" / "medallion-edit" / "pylib"))
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "out" / "medallion-edit" / "source.png"
OUT = ROOT / "out" / "medallion-edit"

im = cv2.imread(str(SRC), cv2.IMREAD_COLOR)
H, W = im.shape[:2]
cx, cy = 115.0, 124.0

yy, xx = np.mgrid[0:H, 0:W]
rr = np.hypot(xx - cx, yy - cy)
ang = np.degrees(np.arctan2(yy - cy, xx - cx)) % 360          # 0=E,90=S,180=W,270=N
# distance (deg) to nearest cardinal direction. N/S spikes are long
# (r~120), E/W barely protrude past the ring (tip r~97) -> separate cones.
d_ns = np.minimum.reduce([np.abs(ang - a) for a in (90, 270)])
d_ew = np.minimum.reduce([np.abs(ang - a) for a in (0, 180, 360)])
cone_ns = d_ns < 22
cone_ew = d_ew < 18

# ---------------- step 1: background removal (GrabCut) ----------------
mask = np.full((H, W), cv2.GC_BGD, np.uint8)
mask[rr < 95] = cv2.GC_FGD                                   # ring + disc surely medallion
mask[(rr >= 95) & (rr < 140) & cone_ns] = cv2.GC_PR_FGD      # long N/S spikes
mask[(rr >= 95) & (rr < 110) & cone_ew] = cv2.GC_PR_FGD      # short E/W tips

bgd = np.zeros((1, 65), np.float64)
fgd = np.zeros((1, 65), np.float64)
cv2.grabCut(im, mask, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

# keep largest blob, fill holes
n, lbl, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
best = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
fg = np.where(lbl == best, 255, 0).astype(np.uint8)
cnts, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
cv2.drawContours(fg, cnts, -1, 255, thickness=cv2.FILLED)

alpha = np.clip(cv2.GaussianBlur(cv2.erode(fg, np.ones((3, 3), np.uint8)), (3, 3), 0)
                .astype(float) * 1.15, 0, 255).astype(np.uint8)

# ---------------- step 2: empty the center ----------------
rgb = cv2.cvtColor(im, cv2.COLOR_BGR2RGB).astype(float)
r_, g_, b_ = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
goldish = (r_ > 110) & (r_ > b_ * 1.55) & (g_ > b_ * 1.2)
emeraldish = (g_ > 120) & (g_ > r_ * 1.15) & (g_ > b_ * 1.1)
bright = (r_ > 170) & (g_ > 170) & (b_ > 150)
# erase the 8-needle star (+ and X), needle stubs and central emerald;
# keep the filigree dial ring (r~74+)
ERASE_R = float(sys.argv[3]) if len(sys.argv) > 3 else 72.0
erase = ((rr < ERASE_R) & (goldish | emeraldish | bright)).astype(np.uint8) * 255
erase = cv2.dilate(erase, np.ones((3, 3), np.uint8), iterations=1)

inpainted = cv2.inpaint(im, erase, 5, cv2.INPAINT_TELEA).astype(np.float64)

# --- smooth glassy centre: radial gradient fitted on the surviving disc ---
disc = (rr < 64) & ~goldish & ~emeraldish & ~bright
inp_rgb = cv2.cvtColor(inpainted.astype(np.uint8), cv2.COLOR_BGR2RGB).astype(np.float64)
disc &= inp_rgb.sum(axis=2) > 40                                # skip near-black
# median colour per radius bin on the real disc (source, not inpainted)
src_rgb = cv2.cvtColor(im, cv2.COLOR_BGR2RGB).astype(np.float64)
bins = np.arange(0, 65, 4)
centroid, cols = [], []
for lo, hi in zip(bins[:-1], bins[1:]):
    sel = disc & (rr >= lo) & (rr < hi)
    if sel.sum() > 30:
        centroid.append((lo + hi) / 2)
        cols.append(np.median(src_rgb[sel], axis=0))
centroid, cols = np.array(centroid), np.array(cols)
fit = [np.polyfit(centroid, cols[:, c], 1) for c in range(3)]   # linear colour(r)
grad = np.stack([np.polyval(f, rr) for f in fit], axis=2)

rng = np.random.default_rng(7)
noise = cv2.GaussianBlur(rng.normal(0, 5, (H, W)).astype(np.float32), (0, 0), 2.5)
fill_bgr = cv2.cvtColor((grad + noise[:, :, None]).clip(0, 255).astype(np.uint8),
                        cv2.COLOR_RGB2BGR).astype(np.float64)

# feathered blend: whole r<62 area -> smooth glassy gradient; outside, the
# inpainted result (covers needle stubs at r 62-74)
w = np.clip((62 - rr) / 8.0, 0, 1)[:, :, None]
merged = inpainted * (1 - w) + fill_bgr * w
out = cv2.cvtColor(merged.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2BGRA)
out[:, :, 3] = alpha

tag = sys.argv[2] if len(sys.argv) > 2 else ""
pil = Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGRA2RGBA))
pil.save(OUT / f"medallion-fullframe{tag}.png")

ys, xs = np.where(alpha > 8)
x0, x1, y0, y1 = xs.min() - 4, xs.max() + 5, ys.min() - 4, ys.max() + 5
crop = pil.crop((max(x0, 0), max(y0, 0), min(x1, W), min(y1, H)))
crop.save(OUT / f"medallion{tag}.png")
crop.resize((crop.width * 4, crop.height * 4), Image.LANCZOS).save(OUT / f"medallion-4x{tag}.png")
print("wrote", f"medallion-fullframe{tag}.png", f"medallion{tag}.png", crop.size,
      f"medallion-4x{tag}.png")
