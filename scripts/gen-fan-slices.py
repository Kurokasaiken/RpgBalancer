#!/usr/bin/env python3
"""gen-fan-slices.py — painter delle lastre dipinte del fanRing.

Warppa le piastre dipinte (`public/assets/ui/poi-radial/cards/plate-*.webp`)
sui settori anulari ellittici definiti da `placesConfig.fanRing`, usando la
STESSA matematica di `placeFanGeometry.ts` (ringPoint). Per ogni slot e
ogni materiale produce `slice-{slot}-{materiale}.webp` nello sliceBase.

Modello (critica GPT-5.6, 2026-11-14): lastre individuali accavallate, non
settori contigui — ogni lastra dipinta copre `overlapDeg` del settore
precedente e viene disegnata sopra (z-order per indice slot crescente).

Uso:
  npx tsx -e "import {PLACES_CONFIG} from './src/balancing/config/idleVillage/placesConfig'; process.stdout.write(JSON.stringify(PLACES_CONFIG.fanRing))" > /tmp/fanring-spec.json
  python3 scripts/gen-fan-slices.py --spec /tmp/fanring-spec.json
"""
import argparse
import json
import math
import os

import numpy as np
from PIL import Image

MATERIALS = ["emerald", "sapphire", "amethyst", "empty"]
PAD = 10  # px di margine trasparente attorno al bbox (come slicePaintBBox)


def ring_point(spec, a_deg, t):
    """Replica di ringPoint() in placeFanGeometry.ts."""
    a = math.radians(a_deg)
    cx = spec["cx"] * spec["refW"]
    cy_in = spec["cy"] * spec["refH"] + spec["innerDy"] * spec["refH"]
    cy = cy_in + (spec["cy"] * spec["refH"] - cy_in) * t
    rx = spec["innerRx"] * spec["refW"] + (spec["outerRx"] * spec["refW"] - spec["innerRx"] * spec["refW"]) * t
    ry = spec["innerRy"] * spec["refH"] + (spec["outerRy"] * spec["refH"] - spec["innerRy"] * spec["refH"]) * t
    return cx + math.cos(a) * rx, cy + math.sin(a) * ry


def sector_bbox(spec, a0, a1):
    x0 = y0 = float("inf")
    x1 = y1 = float("-inf")
    for j in range(13):
        a = a0 + (a1 - a0) * j / 12
        for t in (0.0, 1.0):
            x, y = ring_point(spec, a, t)
            x0, y0 = min(x0, x), min(y0, y)
            x1, y1 = max(x1, x), max(y1, y)
    return x0 - PAD, y0 - PAD, x1 + PAD, y1 + PAD


def invert(spec, X, Y):
    """Mappa inversa cartesian -> (a_deg, t) via Newton vettorializzato."""
    cx = spec["cx"] * spec["refW"]
    cy0 = spec["cy"] * spec["refH"]
    cy_in = cy0 + spec["innerDy"] * spec["refH"]
    dcy = cy0 - cy_in
    ri_x, d_rx = spec["innerRx"] * spec["refW"], (spec["outerRx"] - spec["innerRx"]) * spec["refW"]
    ri_y, d_ry = spec["innerRy"] * spec["refH"], (spec["outerRy"] - spec["innerRy"]) * spec["refH"]

    a = np.arctan2(Y - cy0, X - cx)
    t = np.full_like(X, 0.5)
    for _ in range(10):
        rx = ri_x + d_rx * t
        ry = ri_y + d_ry * t
        c = cy_in + dcy * t
        ca, sa = np.cos(a), np.sin(a)
        ex = cx + ca * rx - X
        ey = c + sa * ry - Y
        j00 = -sa * rx
        j01 = ca * d_rx
        j10 = ca * ry
        j11 = dcy + sa * d_ry
        det = j00 * j11 - j01 * j10
        det = np.where(np.abs(det) < 1e-9, np.sign(det) * 1e-9 + 1e-9, det)
        da = (j11 * ex - j01 * ey) / det
        dt = (-j10 * ex + j00 * ey) / det
        a -= da
        t -= dt
    return np.degrees(a), t


def sample_bilinear(img, u, v):
    """Campionamento bilineare di img (HxWx4 float) alle coord normalizzate (u,v)."""
    h, w = img.shape[:2]
    x = np.clip(u, 0, 1) * (w - 1)
    y = np.clip(v, 0, 1) * (h - 1)
    x0 = np.floor(x).astype(int)
    y0 = np.floor(y).astype(int)
    x1 = np.minimum(x0 + 1, w - 1)
    y1 = np.minimum(y0 + 1, h - 1)
    fx = (x - x0)[..., None]
    fy = (y - y0)[..., None]
    return (
        img[y0, x0] * (1 - fx) * (1 - fy)
        + img[y0, x1] * fx * (1 - fy)
        + img[y1, x0] * (1 - fx) * fy
        + img[y1, x1] * fx * fy
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", required=True, help="JSON con la spec fanRing (dump via tsx)")
    ap.add_argument("--cards", default="public/assets/ui/poi-radial/cards")
    args = ap.parse_args()

    spec = json.load(open(args.spec))
    spec = spec.get("fanRing", spec)
    out_dir = "public" + spec["sliceBase"]
    os.makedirs(out_dir, exist_ok=True)

    step = 360 / spec["slotsTotal"]
    plates = {m: np.asarray(Image.open(f"{args.cards}/plate-{m}.webp").convert("RGBA"), dtype=np.float64) for m in MATERIALS}

    for i in range(spec["slotsTotal"]):
        a0 = spec["startAngleDeg"] + i * step + spec["gapDeg"] / 2 - spec["overlapDeg"]
        a1 = spec["startAngleDeg"] + i * step + spec["gapDeg"] / 2 + step - spec["gapDeg"]
        x0, y0, x1, y1 = sector_bbox(spec, a0, a1)
        w, h = int(math.ceil(x1 - x0)), int(math.ceil(y1 - y0))
        yy, xx = np.mgrid[0:h, 0:w]
        X, Y = xx + x0, yy + y0
        a, t = invert(spec, X, Y)
        # normalizza a nel range paint-span
        a_rel = ((a - a0 + 180) % 360) - 180
        inside = (a_rel >= -0.05) & (a_rel <= (a1 - a0) + 0.05) & (t >= -0.01) & (t <= 1.01)
        u = np.clip(a_rel / (a1 - a0), 0, 1)
        v = 1 - np.clip(t, 0, 1)  # riga top della piastra = rim esterno
        for m, plate in plates.items():
            out = sample_bilinear(plate, u, v)
            out[..., 3] = np.where(inside, out[..., 3], 0)
            Image.fromarray(out.astype(np.uint8)).save(f"{out_dir}/slice-{i}-{m}.webp", quality=92)
        print(f"slot {i}: bbox {w}x{h} span [{a0:.1f},{a1:.1f}]")


if __name__ == "__main__":
    main()
