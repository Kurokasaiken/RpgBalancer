#!/usr/bin/env python3
"""Village page: pull an added building's colours onto the painted sunlit houses, PER MATERIAL.

The AI repaint comes back darker/duller than the painting (inn thatch v≈0.71 vs 0.85-0.88 on
the painted houses, 2026-11-10). A single global transfer fails (the inn has more pale plaster
than the targets, so it barely moves the straw): classes are thatch / timber / stone-plaster,
each matched in Lab to the same class of the painted sunlit houses. Grass/meadow is untouched.
Usage: match-village-building-tone.py <layer-id> [amount=0.9]   (run right after harmonize)
"""
import json, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
L = ROOT / 'public/assets/village/layers'
TARGETS = ['house-thatch-big', 'house-stone-mid']


def classes(rgb: np.ndarray) -> dict:
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    h, s, v = hsv[..., 0] * 2, hsv[..., 1] / 255, hsv[..., 2] / 255
    green = (h > 70) & (h < 160) & (s > 0.27)
    thatch = (h >= 38) & (h < 64) & (s > 0.35) & (v > 0.4)
    timber = (h >= 8) & (h < 38) & (s > 0.28) & ~green
    stone = (s <= 0.28) & ~green
    return {'thatch': thatch, 'timber': timber & ~thatch, 'stone': stone & ~thatch & ~timber}


def lab(rgb):
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)


def main() -> None:
    lid = sys.argv[1]
    amount = float(sys.argv[2]) if len(sys.argv) > 2 else 0.9
    spec = json.loads((L / 'layers.json').read_text())
    orig = np.array(Image.open(ROOT / 'src/assets/mood/rude-beauty/villaggio.png').convert('RGB'))
    tgt = {k: [] for k in ('thatch', 'timber', 'stone')}
    for t in TARGETS:
        ly = next(l for l in spec['layers'] if l['id'] == t)
        x, y, w, h = ly['box']
        a = np.array(Image.open(L / ly['file']).convert('RGBA'))[..., 3] > 200
        crop = orig[y:y + h, x:x + w]
        labc = lab(crop).reshape(-1, 3)
        for k, m in classes(crop).items():
            tgt[k].append(labc[(m & a).reshape(-1)])
    tgt = {k: np.concatenate(v) for k, v in tgt.items()}

    ly = next(l for l in spec['layers'] if l['id'] == lid)
    im = np.array(Image.open(L / ly['file']).convert('RGBA'))
    rgb, alpha = im[..., :3], im[..., 3]
    building = (alpha > 200)
    cls = classes(rgb)
    labs = lab(rgb)
    out = labs.copy()
    wsum = np.zeros(alpha.shape, np.float32)
    acc = np.zeros_like(labs)
    for k, m in cls.items():
        mk = m & building
        if mk.sum() < 1500 or len(tgt[k]) < 1500:
            continue
        mu_s, sd_s = labs[mk].mean(0), labs[mk].std(0) + 1e-3
        mu_t, sd_t = tgt[k].mean(0), tgt[k].std(0) + 1e-3
        ratio = np.clip(sd_t / sd_s, 0.6, 1.6)
        moved = (labs - mu_s) * ratio + mu_t
        w = cv2.GaussianBlur(mk.astype(np.float32), (0, 0), 3)
        acc += moved * w[..., None]
        wsum += w
        print(f'{k:7s} n={int(mk.sum()):6d} Lab mean {mu_s.round(0)} -> {mu_t.round(0)}')
    inb = cv2.GaussianBlur(building.astype(np.float32), (0, 0), 3)
    mixed = np.where(wsum[..., None] > 1e-3, acc / np.maximum(wsum, 1e-3)[..., None], labs)
    k = np.clip(inb * np.minimum(wsum, 1.0), 0, 1)[..., None] * amount
    out = np.clip(labs * (1 - k) + mixed * k, 0, 255).astype(np.uint8)
    Image.fromarray(np.dstack([cv2.cvtColor(out, cv2.COLOR_LAB2RGB), alpha]), 'RGBA').save(L / ly['file'], lossless=True)


if __name__ == '__main__':
    main()
