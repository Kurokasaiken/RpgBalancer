#!/usr/bin/env python3
"""R-301 (2026-10-30): one-off retouch of baked-in artifacts in the mappa2 painting.

The source painting `~/Downloads/mappa2.jpeg` shipped an inpaint/edit rectangle in
the open sea NW of the archipelago (visible straight edges = the "riga"), plus a
white dome, bubble trails, speckles and blotchy dark smudges around the rocky
islets east of it. Everything was propagated into the derived layers.

Technique (no pipeline re-run, so sha256 seeds/masks stay untouched):
  - clone clean sea over the patch rectangle + debris (feathered blend)
  - restore the ringed atoll (~480,693) from the original — Director ruling: keep it
  - inpaint only for small blobs (sea-mask restricted: B>R+4 so coast/foam are safe)
  - "outlier pull" for vague smudges/specks: pixels darker/brighter than the local
    sea median inside a feathered ellipse are blended toward that median

Applied to: source jpeg, layers/{base_flat,base_flat.clean,base_flat.nocanopy,Mare}.webp,
fx/sea-sapphire-{add,mult}.webp, and the 12 animated poses fx/water/sea_arch_f*.webp
(per-frame, dy=-300, so each pose keeps its own painted phase — no frozen patch).

Usage: python3 scripts/retouch-mappa2-archipelago-sea.py [--apply]
Default = preview to /tmp/mappa2_fix/; --apply rewrites the assets in place.
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

WORLD = (2752, 1536)
SEA_ARCH_RECT = (0, 300, 640, 540)  # secondary-water.json seaPatches.sea_arch

# ── ops ──────────────────────────────────────────────────────────────────────

def feather(w, h, f=14):
    m = np.zeros((h, w), np.float32)
    m[f:-f, f:-f] = 1.0
    return cv2.GaussianBlur(m, (0, 0), f / 2.5)


def clone_rect(img, dst_xy, src_xy, wh, f=14):
    """Feather-blend a clean sea donor rect over a dirty one."""
    x, y = dst_xy; sx, sy = src_xy; w, h = wh
    donor = img[sy:sy + h, sx:sx + w].astype(np.float32)
    a = feather(w, h, f)[:, :, None]
    roi = img[y:y + h, x:x + w].astype(np.float32)
    img[y:y + h, x:x + w] = (donor * a + roi * (1 - a)).astype(np.uint8)


def paste_back_ellipse(img, orig, center, axes, angle, f=8):
    """Restore `orig` content inside a feathered ellipse (keeps the atoll)."""
    m = np.zeros(img.shape[:2], np.uint8)
    cv2.ellipse(m, center, axes, angle, 0, 360, 255, -1)
    mf = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), f / 2.5)[:, :, None]
    img[:] = (orig.astype(np.float32) * mf + img.astype(np.float32) * (1 - mf)).astype(np.uint8)


def sea_map(img, margin=7):
    """Rough sea mask: teal pixels (B>R), dilated so blob edges stay in water."""
    b, r = img[:, :, 0].astype(np.int16), img[:, :, 2].astype(np.int16)
    sea = ((b - r) > 4).astype(np.uint8) * 255
    return cv2.dilate(sea, np.ones((margin, margin), np.uint8))


def inpaint_blobs(img, blobs):
    m = np.zeros(img.shape[:2], np.uint8)
    for cx, cy, rr in blobs:
        cv2.circle(m, (cx, cy), rr, 255, -1)
    m = cv2.bitwise_and(m, sea_map(img))
    img[:] = cv2.inpaint(img, m, 8, cv2.INPAINT_TELEA)


def soften_ellipse(img, center, axes, angle, k=0.7, dark_thr=12, bright_thr=20):
    """Pull dark-teal smudges and bright specks toward the local sea median,
    estimated from a ring around the ellipse. Sand/foam hues are excluded."""
    m = np.zeros(img.shape[:2], np.uint8)
    cv2.ellipse(m, center, axes, angle, 0, 360, 255, -1)
    ring = cv2.dilate(m, np.ones((41, 41), np.uint8)) - m
    b, r = img[:, :, 0].astype(np.int16), img[:, :, 2].astype(np.int16)
    sea_like = (b - r) > 4
    ring_sea = (ring > 0) & sea_like
    if ring_sea.sum() < 50:
        return
    med = np.median(img[ring_sea].reshape(-1, 3), axis=0)
    L = img.mean(axis=2)
    medL = float(med.mean())
    target = m > 0
    dark = target & sea_like & (L < medL - dark_thr)
    bright = target & (L > medL + bright_thr) & ((b - r) > -6)
    sel = dark | bright
    if not sel.any():
        return
    mf = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 6)[:, :, None]
    medcol = med.reshape(1, 1, 3).astype(np.float32)
    out = img.astype(np.float32)
    pull = out * (1 - k) + medcol * k
    sel3 = np.repeat(sel[:, :, None], 3, axis=2)
    out = np.where(sel3 & (mf > 0), pull * mf + out * (1 - mf), out)
    img[:] = out.astype(np.uint8)


# ── authored ops list (world coords; frames shift y by -SEA_ARCH_RECT[1]) ────

def process(arr, dy=0):
    img = arr.copy()
    orig = img.copy()
    clone = lambda dst, src, wh, f: clone_rect(img, (dst[0], dst[1] - dy), (src[0], src[1] - dy), wh, f)
    keep = lambda c, ax, a, f: paste_back_ellipse(img, orig, (c[0], c[1] - dy), ax, a, f)
    blobs = lambda bs: inpaint_blobs(img, [(x, y - dy, r) for x, y, r in bs])
    soft = lambda c, ax, a, k, **kw: soften_ellipse(img, (c[0], c[1] - dy), ax, a, k=k, **kw)

    # Zone A — patch rect + dome + bubble trail; atoll kept
    clone((392, 615), (392, 523), (185, 92), 16)
    clone((435, 703), (512, 703), (70, 48), 10)
    keep((480, 693), (38, 25), -15, 8)
    blobs([(419, 686, 12), (412, 678, 10)])
    soft((465, 730), (45, 24), 25, 0.7, dark_thr=10)

    # Zone B — discrete dark blobs + vague diagonal smudges
    blobs([(711, 700, 14), (787, 722, 9), (752, 766, 12)])
    soft((650, 745), (75, 40), 35, 0.45)
    soft((610, 800), (60, 30), 30, 0.45)

    # Zone C — specks/smudges around the rocky islets
    blobs([(780, 840, 11), (795, 838, 10), (810, 842, 9), (825, 845, 9),
           (745, 828, 10), (760, 830, 10), (772, 826, 9), (742, 792, 11),
           (870, 928, 12), (855, 918, 11), (905, 865, 11), (960, 875, 11)])
    soft((655, 858), (40, 22), 10, 0.45)
    soft((930, 846), (34, 18), 0, 0.45)
    soft((698, 840), (50, 26), 20, 0.4)
    return img


# ── io ───────────────────────────────────────────────────────────────────────

def load_bgr(path):
    return np.asarray(Image.open(path).convert('RGB'))[:, :, ::-1].copy()


def save(path, out_bgr, mode):
    out = out_bgr[:, :, ::-1]
    if mode == 'RGBA':
        a = np.asarray(Image.open(path))[:, :, 3]
        Image.fromarray(np.dstack([out, a]), 'RGBA').save(path)
    else:
        Image.fromarray(out, 'RGB').save(path, quality=95)


def main():
    apply = '--apply' in sys.argv
    src = Path.home() / 'Downloads' / 'mappa2.jpeg'
    layers = Path(__file__).resolve().parents[1] / 'public/assets/world/mappa2/base'
    targets = [
        (src, 0),
        (layers / 'layers/base_flat.webp', 0),
        (layers / 'layers/base_flat.clean.webp', 0),
        (layers / 'layers/base_flat.nocanopy.webp', 0),
        (layers / 'layers/Mare.webp', 0),
        (layers / 'fx/sea-sapphire-add.webp', 0),
        (layers / 'fx/sea-sapphire-mult.webp', 0),
    ] + [(layers / f'fx/water/sea_arch_f{i}.webp', SEA_ARCH_RECT[1]) for i in range(12)]
    for path, dy in targets:
        im = Image.open(path)
        out = process(np.asarray(im.convert('RGB'))[:, :, ::-1].copy(), dy)
        if apply:
            save(path, out, im.mode)
            print('patched', path.name)
        else:
            outdir = Path('/tmp/mappa2_fix')
            outdir.mkdir(exist_ok=True)
            Image.fromarray(out[:, :, ::-1]).save(outdir / f'preview_{path.stem}.png')
            print('preview', path.name)


if __name__ == '__main__':
    main()
