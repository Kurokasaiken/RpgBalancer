#!/usr/bin/env python3
"""gen-fan-ring-master.py — master full-ring del fanRing (pipeline GPT-5.6).

Genera, nel canvas registrato refW×refH della spec `placesConfig.fanRing`:
  - `ring-{materiale}.webp` per ogni famiglia: l'anello INTERO con tutti gli
    slot warppati con la piastra dipinta di quella famiglia. Il componente
    clipa per settore con le STESSE path della geometria runtime — nessun
    petalo separato, nessuna cucitura possibile.
  - `ring-structure.webp`: struttura oro continua sopra gli smalti — costole
    ai separatori (rim→interno), rim esterno, gemme ai giunti. Mai tagliata:
    è il layer che tiene insieme l'oggetto.

Uso:
  npx tsx -e "import {PLACES_CONFIG} from './src/balancing/config/idleVillage/placesConfig'; process.stdout.write(JSON.stringify(PLACES_CONFIG.fanRing))" > /tmp/fanring-spec.json
  python3 scripts/gen-fan-ring-master.py --spec /tmp/fanring-spec.json
"""
import argparse
import json
import math
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

MATERIALS = ["emerald", "sapphire", "amethyst", "empty"]


def ring_point_np(spec, a_deg, t):
    """ringPoint() vettoriale — stessa matematica di placeFanGeometry.ts."""
    a = np.radians(a_deg)
    cx = spec["cx"] * spec["refW"]
    cy_in = spec["cy"] * spec["refH"] + spec["innerDy"] * spec["refH"]
    cy = cy_in + (spec["cy"] * spec["refH"] - cy_in) * t
    rx = spec["innerRx"] * spec["refW"] + (spec["outerRx"] * spec["refW"] - spec["innerRx"] * spec["refW"]) * t
    ry = spec["innerRy"] * spec["refH"] + (spec["outerRy"] * spec["refH"] - spec["innerRy"] * spec["refH"]) * t
    return cx + np.cos(a) * rx, cy + np.sin(a) * ry


def invert(spec, X, Y):
    """cartesian -> (a_deg, t) via Newton vettorializzato (come gen-fan-slices)."""
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
        det = np.where(np.abs(det) < 1e-9, 1e-9, det)
        a -= (j11 * ex - j01 * ey) / det
        t -= (-j10 * ex + j00 * ey) / det
    return np.degrees(a), t


def sample_bilinear(img, u, v):
    h, w = img.shape[:2]
    x = np.clip(u, 0, 1) * (w - 1)
    y = np.clip(v, 0, 1) * (h - 1)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    x1, y1 = np.minimum(x0 + 1, w - 1), np.minimum(y0 + 1, h - 1)
    fx, fy = (x - x0)[..., None], (y - y0)[..., None]
    return (
        img[y0, x0] * (1 - fx) * (1 - fy)
        + img[y0, x1] * fx * (1 - fy)
        + img[y1, x0] * (1 - fx) * fy
        + img[y1, x1] * fx * fy
    )


def art_profile(plate_rgba):
    """Profilo del trapezoide-arte dentro la piastra: per ogni riga i bordi
    opachi (alpha>40) left/right + estensione verticale. L'arte NON riempe
    l'immagine: warppare l'immagine intera lascia cunei trasparenti fra i
    petali — si warppa solo il trapezoide, bordo arte = bordo settore."""
    a = plate_rgba[:, :, 3]
    h = a.shape[0]
    left = np.zeros(h)
    right = np.zeros(h)
    ys = np.arange(h)
    for y in ys:
        xs = np.where(a[y] > 40)[0]
        if len(xs):
            left[y], right[y] = xs.min(), xs.max()
        else:
            left[y], right[y] = np.nan, np.nan
    ok = ~np.isnan(left)
    # interpola i buchi e liscia: i bordi del trapezoide sono quasi lineari
    left = np.interp(ys, ys[ok], left[ok])
    right = np.interp(ys, ys[ok], right[ok])
    k = np.ones(9) / 9
    left = np.convolve(left, k, "same")
    right = np.convolve(right, k, "same")
    y_top, y_bot = ys[ok].min(), ys[ok].max()
    return left, right, y_top, y_bot


def paint_material(spec, plate):
    """Anello intero warppato su canvas refW×refH: slot per slot, stessa
    matematica di slotPaintAngles (a0-overlap → a1). Restituisce RGBA."""
    W, H = spec["refW"], spec["refH"]
    step = 360 / spec["slotsTotal"]
    yy, xx = np.mgrid[0:H, 0:W]
    a_all, t_all = invert(spec, xx.astype(np.float64), yy.astype(np.float64))
    a_norm = (a_all + 180) % 360 - 180  # (-180,180]

    ih, iw = plate.shape[:2]
    al, ar, yt, yb = art_profile(plate)

    out = np.zeros((H, W, 4), dtype=np.float64)
    covered = np.zeros((H, W), dtype=bool)
    # z-order: slot i+1 sopra slot i (ogni lastra copre il bordo CCW della
    # precedente; la giunzione wrap resta in basso, nascosta dalla gonna)
    for i in range(spec["slotsTotal"]):
        a0 = spec["startAngleDeg"] + i * step + spec["gapDeg"] / 2 - spec["overlapDeg"]
        a1 = spec["startAngleDeg"] + i * step + spec["gapDeg"] / 2 + step - spec["gapDeg"]
        # span può superare ±180: normalizza per settore
        am = ((a_all - a0 + 180) % 360) - 180
        inside = (am >= 0) & (am <= (a1 - a0)) & (t_all >= 0) & (t_all <= 1.01)
        u = np.clip(am / (a1 - a0), 0, 1)
        v = 1 - np.clip(t_all, 0, 1)
        # sector (u,v) → trapezoide arte: v_img lungo l'estensione verticale,
        # u_img dentro i bordi opachi a quella riga
        y_img = yt + v * (yb - yt)
        yi = np.clip(y_img.astype(int), 0, ih - 1)
        l = al[yi]
        r = ar[yi]
        x_img = l + u * np.maximum(r - l, 1)
        smp = sample_bilinear(plate, x_img / iw, y_img / ih)
        # lift materico: smalti più luminosi E più saturi (critica GPT-5.6)
        rgb = smp[..., :3].astype(np.float32) * 1.16 + 6
        mean = rgb.mean(axis=-1, keepdims=True)
        rgb = mean + (rgb - mean) * 1.22
        smp[..., :3] = np.clip(rgb, 0, 255)
        out[inside] = smp[inside]
        covered |= inside
    return out.astype(np.uint8), covered


def gold_structure(spec, covered):
    """Struttura oro continua: costole ai separatori + rim + gemme ai giunti.
    Profilo a 3 bande (groove scura / bronzo / filo caldo) — mai tagliata."""
    W, H = spec["refW"], spec["refH"]
    g0, g1, g2 = spec["gold"]  # [luce, base, ombra]
    step = 360 / spec["slotsTotal"]

    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(layer)

    def arc_band(t0, t1, a0, a1, fill):
        """Banda anulare fra angoli a0→a1 e raggi t0→t1."""
        n = 48
        aas = np.linspace(a0, a1, n)
        ox, oy = ring_point_np(spec, aas, t1)
        ix, iy = ring_point_np(spec, aas, t0)
        poly = np.vstack([np.stack([ox, oy], 1), np.stack([ix, iy], 1)[::-1]])
        dr.polygon([tuple(p) for p in poly], fill=fill)

    seps = [spec["startAngleDeg"] + i * step - spec["gapDeg"] / 2 for i in range(spec["slotsTotal"])]

    def hexcol(h, alpha):
        return tuple(int(h.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)) + (alpha,)

    # niente costole: le cornici warppate delle lastre fanno già da
    # separatori continui — una costola seconda si disallinea e raddoppia.

    # rim esterno: fascia oro continua più sottile, bronzo opaco —
    # highlight ridotto perché l'anello legga placche, non disco
    # (critica GPT-5.6 #2-3)
    arc_band(0.968, 1.02, -200, 200, (40, 30, 10, 255))
    arc_band(0.973, 1.012, -200, 200, hexcol(g1, 255))
    arc_band(1.005, 1.018, -200, 200, hexcol(g0, 150))
    arc_band(0.968, 0.973, -200, 200, hexcol(g2, 230))

    # bordo interno: filetto oro sul bordo del foro
    arc_band(-0.045, 0.0, -200, 200, hexcol(g1, 255))
    arc_band(-0.045, -0.028, -200, 200, hexcol(g0, 200))

    # gemme ai giunti sul rim: castone scuro + corpo + highlight
    for s in seps:
        gx, gy = ring_point_np(spec, s, 0.99)
        r = spec["rimFrac"] * spec["refH"] * 0.62
        dr.ellipse([gx - r * 1.5, gy - r * 1.5, gx + r * 1.5, gy + r * 1.5], fill=(30, 22, 8, 255))
        dr.ellipse([gx - r, gy - r, gx + r, gy + r], fill=(20, 90, 60, 255))
        dr.ellipse([gx - r * 0.45, gy - r * 0.55, gx + r * 0.15, gy - r * 0.05], fill=(160, 230, 190, 235))

    # sfuma leggerissima sui soli bordi oro per integrare la vernice
    return layer.filter(ImageFilter.GaussianBlur(0.6))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", required=True)
    ap.add_argument("--cards", default="public/assets/ui/poi-radial/cards")
    args = ap.parse_args()

    spec = json.load(open(args.spec))
    spec = spec.get("fanRing", spec)
    out_dir = "public" + spec["sliceBase"]
    os.makedirs(out_dir, exist_ok=True)

    covered = None
    for m in MATERIALS:
        plate = np.asarray(Image.open(f"{args.cards}/plate-{m}.webp").convert("RGBA"), dtype=np.float64)
        img, covered = paint_material(spec, plate)
        Image.fromarray(img).save(f"{out_dir}/ring-{m}.webp", quality=92)
        print(f"ring-{m}.webp")

    struct = gold_structure(spec, covered)
    struct.save(f"{out_dir}/ring-structure.png")
    print("ring-structure.png")


if __name__ == "__main__":
    main()
