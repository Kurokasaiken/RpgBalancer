#!/usr/bin/env python3
"""Bake the "Zaffiro" sea grade for mappa2 as two sheets laid over the painting (no runtime filter):
  fx/sea-sapphire-mult.webp  RGB multiply sheet (<=1)   fx/sea-sapphire-add.webp  RGB additive sheet (stored x2)
Water only (real water pixels of the painting, coral kept): depth ladder emerald/turquoise shallows -> cobalt -> deep
sapphire, from the painted light + the pipeline's coast_distance. Everything else is identity (mult 1, add 0).
Look-board variant 9 of .mw/runs/20261029-mappa2-grade-fork (sea part only; land grading is separate)."""
import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def lch(im):
    lab = cv2.cvtColor(im.astype(np.float32), cv2.COLOR_RGB2LAB)
    return lab[..., 0], np.hypot(lab[..., 1], lab[..., 2])


def rgb(L, C, h):
    r = np.radians(h)
    lab = np.stack([L, C * np.cos(r), C * np.sin(r)], -1).astype(np.float32)
    return np.clip(cv2.cvtColor(lab, cv2.COLOR_LAB2RGB), 0, 1)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=str(Path.home() / "Downloads" / "mappa2.jpeg"))
    ap.add_argument("--pack", default="public/assets/world/mappa2/base")
    ap.add_argument("--deep-hue", type=float, default=265)
    ap.add_argument("--deep-l", type=float, default=15)
    ap.add_argument("--depth-gain", type=float, default=1.55)
    a = ap.parse_args()
    pack = Path(a.pack)
    src = np.asarray(Image.open(a.source).convert("RGB")).astype(np.float32) / 255
    sea = np.array(Image.open(pack / "masks" / "sea_mask.webp"))[..., 3].astype(np.float32) / 255
    cd = np.array(Image.open(pack / "masks" / "coast_distance.webp"))[..., 0].astype(np.float32) / 255
    bio = np.array(Image.open(pack / "biome_ids.png"))
    hsv = cv2.cvtColor(src, cv2.COLOR_RGB2HSV)
    water = ((hsv[..., 0] >= 150) & (hsv[..., 0] <= 260) & (hsv[..., 1] > 0.38) & (hsv[..., 2] > 0.2)).astype(np.float32)
    water = cv2.GaussianBlur(water, (0, 0), 2.0)
    reef = cv2.GaussianBlur((bio == 11).astype(np.float32), (0, 0), 20)

    Ls, _ = lch(src)
    lum = cv2.GaussianBlur(Ls, (0, 0), 10)
    t = np.clip((0.5 * np.clip((60 - lum) / 40, 0, 1) + 0.5 * np.clip(cd / 0.55, 0, 1)) * a.depth_gain, 0, 1)
    t = t * t * (3 - 2 * t)
    rt = [0.0, 0.3, 0.6, 1.0]
    H = np.interp(t, rt, [168, 186.5, 225, a.deep_hue])
    L = np.interp(t, rt, [64, 52, 36, a.deep_l])
    C = np.interp(t, rt, [34, 38, 36, 34])
    detail = Ls - cv2.GaussianBlur(Ls, (0, 0), 12)
    new = rgb(0.35 * cv2.GaussianBlur(Ls, (0, 0), 12) + 0.65 * L + 1.2 * detail, C, H)
    w = (sea * water * 0.85 * (1 - 0.7 * reef))[..., None]
    target = np.clip(src * (1 - w) + new * w, 0, 1)

    ratio = np.clip(target / np.maximum(src, 1e-3), 0, 1)
    mult = np.minimum(ratio, 1.0)
    add = np.clip(target - src * mult, 0, 1)
    fx = pack / "fx"
    Image.fromarray((mult * 255).round().astype(np.uint8), "RGB").save(fx / "sea-sapphire-mult.webp", quality=96)
    Image.fromarray(np.clip(add * 255 * 2, 0, 255).round().astype(np.uint8), "RGB").save(fx / "sea-sapphire-add.webp", quality=96)
    check = np.clip(src * mult + add, 0, 1)
    print(f"sea px {int((w[..., 0] > 0.5).sum())}, residual vs target {np.abs(check - target).mean():.4f}, mean add {add[w[...,0]>0.5].mean():.3f}")


if __name__ == "__main__":
    main()
