#!/usr/bin/env python3
"""Village page (R-313, 2026-11-09): empty base + one lossless layer per building.

Source of truth: src/assets/mood/rude-beauty/villaggio.png (the painting the page
shows today). Inputs:
  - public/assets/village/layers/buildings.json   polygons per building (source px)
  - out/village-chain/rude/empty-0.png            Gemini repaint with no buildings
                                                   (layout differs; used only inside
                                                   the masks, after alignment)
Outputs (public/assets/village/layers/):
  - base.webp        empty village, LOSSLESS. Outside every mask it is the painting
                     pixel for pixel; inside, the aligned+tone-matched ground.
  - <id>.webp        one building layer each, LOSSLESS, RGB = painting pixels, alpha
                     = 255 over its feathered region U_i (where base != painting).
  - layers.json      id, file, box (x, y, w, h in painting px) — the page reads this.

Identity by construction: base + all layers == painting exactly (checked by
scripts/_tmp-village-identity.py / the unit test).
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src/assets/mood/rude-beauty/villaggio.png'
GEN = ROOT / 'out/village-chain/rude/empty-0.png'
OUT = ROOT / 'public/assets/village/layers'


def align_gen(orig: np.ndarray, gen: np.ndarray) -> np.ndarray:
    """Affine-register the Gemini repaint to the painting on the shared mountain band."""
    H, W = orig.shape[:2]
    g = np.array(Image.fromarray(gen).resize((W, H), Image.LANCZOS))
    band = np.zeros((H, W), np.uint8)
    band[: int(H * 0.45), :] = 255
    orb = cv2.ORB_create(4000)
    k1, d1 = orb.detectAndCompute(cv2.cvtColor(orig, cv2.COLOR_RGB2GRAY), band)
    k2, d2 = orb.detectAndCompute(cv2.cvtColor(g, cv2.COLOR_RGB2GRAY), band)
    matches = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2), key=lambda m: m.distance)[:300]
    src = np.float32([k2[m.trainIdx].pt for m in matches])
    dst = np.float32([k1[m.queryIdx].pt for m in matches])
    A, _ = cv2.estimateAffinePartial2D(src, dst, ransacReprojThreshold=4)
    return cv2.warpAffine(g, A, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)


# Grow each mask past the roof/wall edge so no building pixel survives in the base;
# the feather then hands the fill back to the painting over GROW_SOFT px (2026-11-09:
# a dark roof line showed at the stone house edge, a green fill block by the east house).
GROW = 14
GROW_SOFT = 8


def feather(poly: list, H: int, W: int) -> np.ndarray:
    m = np.zeros((H, W), np.uint8)
    cv2.fillPoly(m, [np.array(poly, np.int32)], 255)
    k = 2 * GROW + 1
    grown = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    return np.clip(cv2.GaussianBlur(grown.astype(np.float32) / 255, (0, 0), GROW_SOFT) * 1.6 - 0.3, 0, 1)


def tone_match(gen: np.ndarray, orig: np.ndarray, ring: np.ndarray, inside: np.ndarray) -> np.ndarray:
    out = gen.copy()
    for c in range(3):
        mo, so = orig[..., c][ring].mean(), orig[..., c][ring].std() + 1e-3
        mg, sg = gen[..., c][ring].mean(), gen[..., c][ring].std() + 1e-3
        out[..., c] = (gen[..., c] - mg) / sg * so + mo
    out = np.clip(out, 0, 255)
    # Gemini sometimes keeps a bit of the roof it was asked to remove (a pale wedge
    # inside the mask, 2026-11-09). Where the fill is much brighter than the painting
    # around it, take the local painting colour instead (normalised blur of the ring).
    w = cv2.GaussianBlur(ring.astype(np.float32), (0, 0), 25)
    have = w > 0.05  # only where the ring has real painting nearby
    local = np.dstack([cv2.GaussianBlur(orig[..., c] * ring, (0, 0), 25) for c in range(3)]) / np.maximum(w, 1e-3)[..., None]
    lum = out.mean(axis=2)
    lum_local = local.mean(axis=2)
    bad = inside & have & (lum - lum_local > 14)
    bad = cv2.GaussianBlur(bad.astype(np.float32), (0, 0), 4)[..., None]
    return out * (1 - bad) + local * bad


def main() -> None:
    orig = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
    H, W = orig.shape[:2]
    gen = align_gen(orig.astype(np.uint8), np.array(Image.open(GEN).convert('RGB'))).astype(np.float32)
    spec = json.loads((OUT / 'buildings.json').read_text())

    base = orig.copy()
    layers = []
    for b in spec['buildings']:
        m = np.zeros((H, W), np.uint8)
        cv2.fillPoly(m, [np.array(b['poly'], np.int32)], 255)
        ring = (cv2.dilate(m, np.ones((61, 61), np.uint8)) & ~cv2.dilate(m, np.ones((21, 21), np.uint8))) > 0
        a = feather(b['poly'], H, W)
        inside = cv2.dilate(m, np.ones((5, 5), np.uint8)) > 0
        base = base * (1 - a[..., None]) + tone_match(gen, base, ring, inside) * a[..., None]
        # the layer: painting pixels wherever the base was touched, fully opaque there
        u = a > 0
        ys, xs = np.where(u)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        rgba[..., :3] = orig[y0:y1, x0:x1].astype(np.uint8)
        rgba[..., 3] = (u[y0:y1, x0:x1] * 255).astype(np.uint8)
        Image.fromarray(rgba, 'RGBA').save(OUT / f"{b['id']}.webp", lossless=True)
        layers.append({'id': b['id'], 'file': f"{b['id']}.webp", 'box': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]})

    # outside every feather the base must be the painting itself
    Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), 'RGB').save(OUT / 'base.webp', lossless=True)
    (OUT / 'layers.json').write_text(json.dumps({'size': [W, H], 'base': 'base.webp', 'layers': layers}, indent=2))
    print('base + %d layers written' % len(layers))


if __name__ == '__main__':
    main()
