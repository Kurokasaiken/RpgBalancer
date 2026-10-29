#!/usr/bin/env python3
"""Gate for a mappa2 paintover candidate: does it keep the geometry the pack (masks, regions, waterfall, anchors) depends on?

Usage: check-mappa2-paintover.py <candidate.(png|jpg)> [--source ~/Downloads/mappa2.jpeg] [--pack public/assets/world/mappa2/base]
Exit 0 = geometry preserved (pipeline can be rerun with the maps unchanged); non-zero = the pack's masks would be wrong.
It does NOT judge beauty: that stays an eye check by the Director.
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

W, H = 2752, 1536


def lab_l(rgb):
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)[..., 0]


def watery(rgb):
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    return (hsv[..., 0] >= 150) & (hsv[..., 0] <= 240) & (hsv[..., 1] > 0.3) & (hsv[..., 2] > 0.2)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("candidate")
    ap.add_argument("--source", default=str(Path.home() / "Downloads" / "mappa2.jpeg"))
    ap.add_argument("--pack", default="public/assets/world/mappa2/base")
    a = ap.parse_args()
    pack = Path(a.pack)

    cim = Image.open(a.candidate).convert("RGB")
    results = []

    def check(name, ok, detail):
        results.append(ok)
        print(f"{'PASS' if ok else 'FAIL'}  {name}: {detail}")

    check("risoluzione", cim.size == (W, H), f"{cim.size[0]}x{cim.size[1]} (richiesto {W}x{H})")
    if cim.size != (W, H):
        cim = cim.resize((W, H), Image.LANCZOS)
        print("      (ridimensionata a 2752x1536 solo per proseguire i controlli)")
    c = np.asarray(cim).astype(np.float32) / 255
    s = np.asarray(Image.open(a.source).convert("RGB")).astype(np.float32) / 255

    sea = np.array(Image.open(pack / "masks" / "sea_mask.webp"))[..., 3] > 127
    land = np.array(Image.open(pack / "masks" / "land_mask.webp"))[..., 3] > 127
    wf = np.array(Image.open(pack / "masks" / "waterfall_mask.webp"))[..., 3] > 127
    bio = np.array(Image.open(pack / "biome_ids.png"))
    # the pack's sea_mask leaks into snowy alpine rock: judge the sea only where the ORIGINAL really is water
    sea_true = sea & watery(s) & (bio != 1)
    land_true = land & ~watery(s)

    wc = watery(c)
    sea_keep = float(wc[sea_true].mean())
    land_leak = float(wc[land_true].mean())
    check("costa: il mare resta mare", sea_keep >= 0.93, f"{sea_keep:.3f} dei pixel d'acqua originali sono ancora acqua (>= 0.93)")
    check("costa: la terra non diventa acqua", land_leak <= 0.04, f"{land_leak:.3f} della terra originale legge come acqua (<= 0.04)")

    # low-frequency structure: where the big dark/light masses sit
    ls, lc = (cv2.resize(lab_l(x), (172, 96), interpolation=cv2.INTER_AREA) for x in (s, c))
    corr = float(np.corrcoef(ls.ravel(), lc.ravel())[0, 1])
    check("composizione: masse chiare/scure", corr >= 0.90, f"correlazione {corr:.3f} a 172x96 (>= 0.90)")

    # waterfall: same place, same vertical white column
    ys, xs = np.where(wf)
    if len(xs):
        x0, x1, y0, y1 = max(xs.min() - 60, 0), min(xs.max() + 60, W), max(ys.min() - 60, 0), min(ys.max() + 60, H)
        ps, pc = lab_l(s)[y0:y1, x0:x1], lab_l(c)[y0:y1, x0:x1]
        pcorr = float(np.corrcoef(cv2.GaussianBlur(ps, (0, 0), 3).ravel(), cv2.GaussianBlur(pc, (0, 0), 3).ravel())[0, 1])
        check("cascata: stessa posizione e forma", pcorr >= 0.85, f"correlazione {pcorr:.3f} nel riquadro {x1-x0}x{y1-y0} (>= 0.85)")
    else:
        check("cascata", False, "waterfall_mask vuota")

    # coastline: edge of land mask vs strong edges of the candidate near it
    edge = cv2.morphologyEx(land.astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
    near = cv2.dilate(edge.astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
    gs = cv2.Canny((lab_l(s) * 2.55).astype(np.uint8), 60, 140)[near].mean()
    gc = cv2.Canny((lab_l(c) * 2.55).astype(np.uint8), 60, 140)[near].mean()
    check("costa: la linea di costa si legge ancora", gc >= 0.6 * gs, f"densità bordi sulla costa {gc:.3f} vs {gs:.3f} (>= 60%)")

    # signatures / watermarks (T-27): list the 4 corners for an eye check
    out = Path(a.candidate).with_suffix("").as_posix() + "_corners.jpg"
    sz = int(W * 0.12)
    tiles = [cim.crop(b).resize((256, 256)) for b in ((0, 0, sz, sz), (W - sz, 0, W, sz), (0, H - sz, sz, H), (W - sz, H - sz, W, H))]
    sheet = Image.new("RGB", (1040, 256))
    for i, t in enumerate(tiles):
        sheet.paste(t, (i * 260, 0))
    sheet.save(out, quality=88)
    print(f"INFO  firme/watermark: guarda a occhio {out} (T-27)")

    ok = all(results)
    print("\nRISULTATO:", "geometria preservata" if ok else "geometria NON preservata: maschere/territori/cascata da rifare")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
