#!/usr/bin/env python3
"""Add a NEW building to the village page (2026-11-09, sprite approach).

Input: a green-screen painting of one building (Gemini, #00FF00 background).
  1. key the green out: flood fill from the border (key-village-tower.py logic)
  2. scale so the house is `--width` painting px wide (perspective: pick it for the
     depth of the foot — a lower foot means a bigger house)
  3. drop a soft contact shadow under the foot (painting light: upper-left)
  4. write parts-free layer public/assets/village/layers/<id>.webp (lossless) and
     append it to layers.json with source "added" (the identity test ignores these)

The foot (x, y) is the bottom centre of the house in painting px (3168×1344): the
building stands there, whatever the layer's box is.
"""
import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
LAYERS = ROOT / 'public/assets/village/layers'


def key_green(rgb: np.ndarray) -> np.ndarray:
    h, w = rgb.shape[:2]
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    screen = np.median(border, axis=0)
    dist = np.linalg.norm(rgb.astype(np.float32) - screen, axis=2)
    near = (dist < 90).astype(np.uint8)
    bg = np.zeros((h + 2, w + 2), np.uint8)
    seeds = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    canvas = near.copy()
    for sx, sy in seeds:
        if canvas[sy, sx] == 1 and bg[sy + 1, sx + 1] == 0:
            cv2.floodFill(canvas, bg, (sx, sy), 2, loDiff=0, upDiff=0, flags=4 | (1 << 8))
    fg = (bg[1:-1, 1:-1] == 0).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    # keep the main body plus any sizeable detached prop (stump, cart…): >= 3% of the main body
    areas = stats[1:, 4]
    keep = [1 + i for i, a in enumerate(areas) if a >= 0.03 * areas.max()]
    fg = np.isin(lab, keep).astype(np.uint8) * 255
    cnts, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    solid = np.zeros_like(fg)
    cv2.drawContours(solid, cnts, -1, 255, cv2.FILLED)
    # enclosed see-through gaps (screen colour) inside the silhouette
    gaps = ((solid > 0) & (dist < 70)).astype(np.uint8)
    gn, glab, gstats, _ = cv2.connectedComponentsWithStats(gaps)
    for i in range(1, gn):
        if gstats[i, 4] >= 30:
            solid[glab == i] = 0
    # green spill left at the base (the screen's green ground, not caught by the flood):
    # any pixel where green clearly dominates red and blue is not part of the building
    r, g, b = [rgb[..., i].astype(np.int32) for i in range(3)]
    greenish = (g - np.maximum(r, b) > 28).astype(np.uint8)
    solid = solid * (1 - cv2.dilate(greenish, np.ones((3, 3), np.uint8)))
    return cv2.GaussianBlur(cv2.erode(solid, np.ones((3, 3), np.uint8)), (3, 3), 0)


def tone_to_painting(rgb: np.ndarray, alpha: np.ndarray, ref_id: str, amount: float) -> np.ndarray:
    """Pull the new building's per-channel mean/std toward a painted building's (2026-11-09:
    the Gemini chief house was darker and cooler than the painted houses next to it)."""
    if amount <= 0:
        return rgb
    spec = json.loads((ROOT / 'public/assets/village/layers/buildings.json').read_text())
    poly = next(b['poly'] for b in spec['buildings'] if b['id'] == ref_id)
    src = np.array(Image.open(ROOT / spec['source']).convert('RGB')).astype(np.float32)
    m = np.zeros(src.shape[:2], np.uint8)
    cv2.fillPoly(m, [np.array(poly, np.int32)], 255)
    ref = src[m > 0]
    mask = alpha > 128
    out = rgb.astype(np.float32)
    for c in range(3):
        mu_s, sd_s = out[..., c][mask].mean(), out[..., c][mask].std() + 1e-3
        mu_r, sd_r = ref[:, c].mean(), ref[:, c].std() + 1e-3
        moved = (out[..., c] - mu_s) / sd_s * sd_r + mu_r
        out[..., c] = out[..., c] + (moved - out[..., c]) * amount
    return np.clip(out, 0, 255).astype(np.uint8)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('raw')
    ap.add_argument('id')
    ap.add_argument('--foot', nargs=2, type=float, required=True, help='x y of the bottom centre, painting px')
    ap.add_argument('--width', type=float, required=True, help='house width in painting px')
    ap.add_argument('--shadow', type=float, default=0.6)
    ap.add_argument('--flip', action='store_true', help='mirror the sprite horizontally')
    ap.add_argument('--soften', type=float, default=0.0, help='gaussian sigma (px, after scaling) to match the painting brushwork; also feathers the outline')
    ap.add_argument('--tone-ref', default='house-stone-mid', help='painted building whose colours the new one takes')
    ap.add_argument('--tone', type=float, default=0.5, help='0 = keep Gemini colours, 1 = full match')
    args = ap.parse_args()

    rgb = np.array(Image.open(args.raw).convert('RGB'))
    if args.flip:
        rgb = np.ascontiguousarray(rgb[:, ::-1])
    alpha = key_green(rgb)
    ys, xs = np.where(alpha > 8)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgb, alpha = rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1]

    rgb = tone_to_painting(rgb, alpha, args.tone_ref, args.tone)
    scale = args.width / rgb.shape[1]
    nw, nh = round(rgb.shape[1] * scale), round(rgb.shape[0] * scale)
    rgb = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_LANCZOS4)
    alpha = cv2.resize(alpha, (nw, nh), interpolation=cv2.INTER_LINEAR)
    # resizing mixes the screen green of the removed ground into the edge pixels: drop them again
    rr, gg, bb = [rgb[..., i].astype(np.int32) for i in range(3)]
    spill = cv2.dilate((gg - np.maximum(rr, bb) > 28).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    alpha = np.where(spill, 0, alpha).astype(np.uint8)

    if args.soften > 0:
        # painted-in look: soften detail and give the outline a soft edge (px after scaling)
        # blur colour weighted by opacity, so the removed screen green never bleeds into the edge
        a0 = (alpha.astype(np.float32) / 255)[..., None]
        pm = cv2.GaussianBlur(rgb.astype(np.float32) * a0, (0, 0), args.soften)
        aw = cv2.GaussianBlur(a0[..., 0], (0, 0), args.soften)[..., None]
        rgb = np.clip(pm / np.maximum(aw, 1e-3), 0, 255).astype(np.uint8)
        alpha = cv2.GaussianBlur(cv2.erode(alpha, np.ones((3, 3), np.uint8)), (0, 0), args.soften * 1.2)
    # despill on the soft edge: green must not exceed red/blue there
    edge = alpha < 245
    r2, g2, b2 = [rgb[..., i].astype(np.int32) for i in range(3)]
    cap = np.maximum(r2, b2) + 4
    rgb = rgb.copy()
    rgb[..., 1] = np.where(edge, np.minimum(g2, cap), g2).astype(np.uint8)
    # foot = bottom centre of the solid house (rows near the lowest opaque pixel)
    solid = alpha > 128
    yb = np.where(solid.any(axis=1))[0].max()
    fx = np.where(solid[max(0, yb - 6):yb + 1].any(axis=0))[0]
    fx = fx.mean()
    fy = float(yb)

    # sink the base into the ground: the lowest rows fade out in a ragged, grass-like line
    # (blades of the meadow overlap the stone, as in the painted houses) instead of a straight cut
    rng = np.random.default_rng(7)
    ragged = cv2.GaussianBlur(rng.random((1, nw)).astype(np.float32), (0, 0), 2.2)[0]
    ragged = (ragged - ragged.min()) / max(ragged.max() - ragged.min(), 1e-3)
    sink = max(4, int(nw * 0.016))
    for dy in range(sink + 1):
        row = yb - dy
        keep = np.clip((dy / sink) * 1.2 - ragged * 0.45 + 0.1, 0, 1)
        alpha[row] = (alpha[row].astype(np.float32) * keep).astype(np.uint8)
    solid = alpha > 128
    yb = np.where(solid.any(axis=1))[0].max()
    fy = float(yb)
    # contact shadow: soft dark ellipse under the footprint, lit from upper-left
    pad = int(nw * 0.25)
    H, W = nh + pad * 2, nw + pad * 2
    rgba = np.zeros((H, W, 4), np.uint8)
    ox, oy = pad, pad
    sh = np.zeros((H, W), np.float32)
    # a dense contact shadow hugging the footprint (wider than the house, pushed to the
    # lower right) + a softer halo; the house itself sits on top of it
    cv2.ellipse(sh, (int(ox + fx - nw * 0.04), int(oy + fy - nw * 0.005)), (int(nw * 0.40), int(nw * 0.045)), 0, 0, 360, 1.0, -1)
    tight = cv2.GaussianBlur(sh, (0, 0), nw * 0.012)
    wide = cv2.GaussianBlur(sh, (0, 0), nw * 0.05)
    sh = np.clip(tight * 0.7 + wide * 0.5, 0, 1) * args.shadow
    rgba[..., 3] = (sh * 255).astype(np.uint8)
    rgba[..., :3] = (14, 38, 36)  # deep teal-green, like the painted shadows
    rgba[oy:oy + nh, ox:ox + nw, :3] = rgb
    a = alpha.astype(np.float32)
    base_a = rgba[oy:oy + nh, ox:ox + nw, 3].astype(np.float32)
    out_a = a + base_a * (1 - a / 255)
    rgba[oy:oy + nh, ox:ox + nw, 3] = np.clip(out_a, 0, 255).astype(np.uint8)
    # building pixels stay full colour; shadow outside them
    rgba[oy:oy + nh, ox:ox + nw, :3] = np.where(a[..., None] > 0, rgb, np.array([14, 38, 36], np.uint8))  # no stray screen colour under the shadow

    # box in painting px so that the foot lands on (x, y)
    foot_x, foot_y = args.foot
    left = round(foot_x - (ox + fx))
    top = round(foot_y - (oy + fy))
    Image.fromarray(rgba, 'RGBA').save(LAYERS / f'{args.id}.webp', lossless=True)

    spec = json.loads((LAYERS / 'layers.json').read_text())
    spec['layers'] = [l for l in spec['layers'] if l['id'] != args.id]
    spec['layers'].append({'id': args.id, 'file': f'{args.id}.webp', 'box': [int(left), int(top), int(W), int(H)], 'source': 'added'})
    for l in spec['layers']:
        l.setdefault('source', 'painting')
    (LAYERS / 'layers.json').write_text(json.dumps(spec, indent=2))
    print(f'{args.id}: box {left},{top},{W},{H} foot ({foot_x},{foot_y}) scale {scale:.3f}')


if __name__ == '__main__':
    main()
