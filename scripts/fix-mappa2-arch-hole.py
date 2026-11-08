#!/usr/bin/env python3
"""Repaint the flat teal "hole" in the NW sea-arch of the mappa2 painting (Director 2026-11-05, "buco nella scogliera").

The arch opening (world ~x185-240, y475-575) is a single flat teal polygon with a ragged outline: no ripples, no
depth, it reads as a cut-out. Replace its interior with cave water: the colour of the open sea just outside (so it
joins the waves below it), darkened towards the top (shade under the rock) with the sea's own high-frequency
ripple texture, feathered 1.5 px into the rock outline. Applied to every base layer variant (1x and 2x).
Idempotent against the pre-fix backups kept in --bak (first run copies them there)."""
import argparse
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

PACK = Path("public/assets/world/mappa2/base/layers")
VARIANTS = ["base_flat.webp", "base_flat.clean.webp", "base_flat.nocanopy.webp", "base_flat.hi.webp"]
BOX = (160, 455, 270, 580)  # world px x0,y0,x1,y1
SEA_REF = (420, 440, 500, 520)  # open dark sea right of the pinnacle: ripple texture + colour


def teal_mask(c):
    hsv = cv2.cvtColor(c, cv2.COLOR_RGB2HSV)
    m = ((hsv[..., 0] > 172) & (hsv[..., 0] < 208) & (hsv[..., 1] > 0.55) & (hsv[..., 2] > 0.28)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lbl, st, _ = cv2.connectedComponentsWithStats(m)
    big = (lbl == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
    # fill pinholes
    cnts, _ = cv2.findContours(big, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    out = np.zeros_like(big)
    cv2.drawContours(out, cnts, -1, 1, -1)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bak", default="/tmp/mappa2-arch-bak")
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    bak = Path(a.bak)
    bak.mkdir(parents=True, exist_ok=True)
    # mask from the 1x painting (original, from backup if present)
    flat_src = bak / "base_flat.webp" if (bak / "base_flat.webp").exists() else PACK / "base_flat.webp"
    x0, y0, x1, y1 = BOX
    c1 = np.asarray(Image.open(flat_src).convert("RGB").crop(BOX)).astype(np.float32) / 255
    mask1 = teal_mask(c1)
    print("mask px (1x):", int(mask1.sum()))
    for name in VARIANTS:
        p = PACK / name
        if not (bak / name).exists() and not a.dry:
            shutil.copy2(p, bak / name)
        src_path = bak / name if (bak / name).exists() else p
        im = Image.open(src_path).convert("RGB")
        s = im.size[0] // 2752
        box = tuple(v * s for v in BOX)
        crop = np.asarray(im.crop(box)).astype(np.float32) / 255
        h, w = crop.shape[:2]
        m = cv2.resize(mask1.astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR)
        m = cv2.GaussianBlur((m > 0.5).astype(np.float32), (0, 0), 1.5 * s)
        # sea reference: mean colour + high-frequency ripples
        r = np.asarray(im.crop(tuple(v * s for v in SEA_REF))).astype(np.float32) / 255
        lab_r = cv2.cvtColor(r, cv2.COLOR_RGB2LAB)
        base_lab = lab_r.reshape(-1, 3).mean(0)
        hf = lab_r - cv2.GaussianBlur(lab_r, (0, 0), 6 * s)
        hf = np.tile(hf, (h // hf.shape[0] + 1, w // hf.shape[1] + 1, 1))[:h, :w]
        yy = np.linspace(0, 1, h, dtype=np.float32)[:, None]
        # vertical depth: dark under the rock at the top, opening to the sea colour at the bottom
        shade = 0.45 + 0.55 * np.clip((yy - 0.1) / 0.8, 0, 1) ** 1.2
        lab = np.empty((h, w, 3), np.float32)
        lab[..., 0] = base_lab[0] * shade * 0.9 + hf[..., 0] * 1.4
        lab[..., 1] = base_lab[1] * (0.6 + 0.4 * shade) + hf[..., 1]
        lab[..., 2] = base_lab[2] * (0.6 + 0.4 * shade) + hf[..., 2]
        fill = np.clip(cv2.cvtColor(lab, cv2.COLOR_LAB2RGB), 0, 1)
        # keep the painted foam/light at the very bottom: fade the repaint out in the last 12% of the box
        m = m * np.clip((0.88 - np.linspace(0, 1, h, dtype=np.float32)[:, None]) / 0.1, 0, 1)
        out = crop * (1 - m[..., None]) + fill * m[..., None]
        print(name, "scale", s, "mean change", float(np.abs(out - crop).mean()))
        if a.dry:
            Image.fromarray((out * 255).round().astype(np.uint8)).resize((w * 4 // s, h * 4 // s)).save(bak / f"preview_{name}.png")
            continue
        full = im.copy()
        full.paste(Image.fromarray((out * 255).round().astype(np.uint8), "RGB"), box[:2])
        full.save(p, quality=95, method=6)


if __name__ == "__main__":
    main()
