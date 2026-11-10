#!/usr/bin/env python3
"""Village page: blend the house exactly as Gemini painted it (same size/position, real
ground contact) onto the painting. Mask = hand-traced house outline + a ground band under
the base; colours matched on a ring around the mask; wide feather. Writes layer chief-house.
"""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
L = ROOT / 'public/assets/village/layers'
GEN = ROOT / 'out/village-chain/rude/chief-smaller-0.png'
OX, OY = 850, 480  # crop offset of the outline below, painting px
HOUSE = [(140,425),(125,305),(108,298),(165,215),(215,190),(270,170),(285,128),(330,112),(440,70),(462,52),
         (490,65),(572,285),(548,300),(545,437)]
# Gemini moved the meadow: in OUR painting the light grass starts ~24 px lower than in its
# repaint (at Gemini's foot line ours has the dark tree line) -> drop the house onto our meadow.
SHIFT_Y = 24
GROUND = [(545,437),(560,452),(400,462),(150,455)]


def main() -> None:
    base = np.array(Image.open(L / 'base.webp').convert('RGB')).astype(np.float32)
    H, W = base.shape[:2]
    gen = np.array(Image.open(GEN).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32)
    gen = np.roll(gen, SHIFT_Y, axis=0)
    # house only: Gemini's ground (its river/grass are repainted, not ours) is NOT used
    mh = np.zeros((H, W), np.uint8)
    cv2.fillPoly(mh, [np.array([(x + OX, y + OY + SHIFT_Y) for x, y in HOUSE], np.int32)], 255)
    mh = cv2.erode(mh, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
    a = np.clip(cv2.GaussianBlur(mh.astype(np.float32) / 255, (0, 0), 3) * 1.4 - 0.1, 0, 1)
    ys0, xs0 = np.where(mh > 0)
    foot_y = int(ys0.max())            # lowest row of the stone base
    fx0, fx1 = int(xs0[ys0 > foot_y - 12].min()), int(xs0[ys0 > foot_y - 12].max())
    rgb = gen.copy()

    # 1) contact shadow: deep teal-green (like the painted shadows), single pass, alpha only
    sh = np.zeros((H, W), np.float32)
    cv2.ellipse(sh, ((fx0 + fx1) // 2 - 10, foot_y + 3), ((fx1 - fx0) // 2 + 18, 13), 0, 0, 360, 1.0, -1)
    sh = cv2.GaussianBlur(sh, (0, 0), 6) * 0.8

    # 2) the lowest rows of the stone fade out in a ragged, blade-like edge (2-D noise at two scales)
    rng = np.random.default_rng(5)
    n1 = cv2.GaussianBlur(rng.random((H, W)).astype(np.float32), (0, 0), 2.0)
    n2 = cv2.GaussianBlur(rng.random((H, W)).astype(np.float32), (0, 0), 5.0)
    nz = n1 + n2
    nz = (nz - nz.min()) / max(nz.max() - nz.min(), 1e-3)
    fade_h = 5
    yy = np.arange(H, dtype=np.float32)[:, None]
    depth = np.clip((foot_y - yy) / fade_h, 0, 1)        # 0 at the foot row, 1 fade_h px above
    keep = np.clip(depth * 1.2 - (1 - nz) * 0.5 + 0.55, 0, 1)
    a = a * np.where(yy > foot_y - fade_h, keep, 1.0)
    a = np.where(yy > foot_y, 0, a)

    la = np.clip(a + sh * (1 - a), 0, 1)
    shade = np.array([14, 38, 36], np.float32)
    out_rgb = np.where(a[..., None] > 0.02, gen, shade)
    # where shadow overlaps partially covered house pixels, composite correctly
    mixa = np.where(la > 0, a / np.maximum(la, 1e-3), 0)[..., None]
    out_rgb = gen * mixa + shade * (1 - mixa)
    ys, xs = np.where(la > 0.01)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    rgba[..., :3] = np.clip(out_rgb[y0:y1, x0:x1], 0, 255).astype(np.uint8)
    rgba[..., 3] = (la[y0:y1, x0:x1] * 255).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(L / 'chief-house.webp', lossless=True)
    spec = json.loads((L / 'layers.json').read_text())
    spec['layers'] = [l for l in spec['layers'] if l['id'] != 'chief-house']
    spec['layers'].append({'id': 'chief-house', 'file': 'chief-house.webp', 'box': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)], 'source': 'added'})
    (L / 'layers.json').write_text(json.dumps(spec, indent=2))
    print('chief-house', x0, y0, x1 - x0, y1 - y0, 'foot_y', foot_y)


if __name__ == '__main__':
    main()
