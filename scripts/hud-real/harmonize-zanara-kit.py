#!/usr/bin/env python3
"""Harmonize the zanara roster kit gold/enamel to the nav astrolabe reference (Director ruling
2026-11-06: «i colori corretti sono il vero oro del primo componente — il secondo è da rifare»).
Same finding as the hud-real palette restore: the kit's gold is darker, less chromatic and with
crushed highlights vs nav (L50 61.2 / C50 44.0 / L90 95.7 / hue 84°).
Per piece: scale gold Lab L to nav L50 (linear, which also lands highlights ~L90), scale chroma to
nav C50 (cap 1.6), rotate gold hue +8° toward 84°; mild lift on saturated greens (Lx1.08, Cx1.12).
Originals backed up in .mw/specs/hud-real/rollback-zanara/.
Usage: tools/hud-real/venv/bin/python -I scripts/hud-real/harmonize-zanara-kit.py
"""
import glob, os, cv2, numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REF = {'L50': 61.2, 'C50': 44.0, 'hue': 84.1}

def gold_stats(lab, mask):
    if mask.sum() < 60:
        return None
    L = lab[..., 0][mask] * 100 / 255
    a = lab[..., 1][mask].astype(np.float32) - 128
    b = lab[..., 2][mask].astype(np.float32) - 128
    return float(np.median(L)), float(np.median(np.sqrt(a * a + b * b)))

def process(path):
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if im is None or im.shape[2] < 4:
        return
    a8 = im[..., 3]
    hsv = cv2.cvtColor(im[..., :3], cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    lab = cv2.cvtColor(im[..., :3], cv2.COLOR_BGR2LAB).astype(np.float32)
    gold = (a8 > 128) & (s > 70) & (v > 90) & (h >= 10) & (h <= 42)
    green = (a8 > 128) & (s > 60) & (v > 60) & (h > 42) & (h <= 95)
    st = gold_stats(lab, gold)
    if st:
        l50, c50 = st
        kL = REF['L50'] / max(l50, 1)
        kC = min(REF['C50'] / max(c50, 1), 1.6)
        L = lab[..., 0] * 100 / 255
        a_ = lab[..., 1] - 128
        b_ = lab[..., 2] - 128
        # gold: lift L, boost chroma, rotate hue +8° toward the nav's warmer gold
        th = np.deg2rad(8.0)
        a2 = a_ * np.cos(th) - b_ * np.sin(th)
        b2 = a_ * np.sin(th) + b_ * np.cos(th)
        lab[..., 0] = np.where(gold, np.clip(L * kL, 0, 100) * 2.55, lab[..., 0])
        lab[..., 1] = np.where(gold, np.clip(a2 * kC + 128, 0, 255), lab[..., 1])
        lab[..., 2] = np.where(gold, np.clip(b2 * kC + 128, 0, 255), lab[..., 2])
        # greens: mild lift only (emeralds read too dim vs the nav's)
        lab[..., 0] = np.where(green, np.clip(L * 1.08, 0, 100) * 2.55, lab[..., 0])
        lab[..., 1] = np.where(green, np.clip((lab[..., 1] - 128) * 1.12 + 128, 0, 255), lab[..., 1])
        lab[..., 2] = np.where(green, np.clip((lab[..., 2] - 128) * 1.12 + 128, 0, 255), lab[..., 2])
        im[..., :3] = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
        cv2.imwrite(path, im)
        print(os.path.basename(path), f'L50 {l50:.1f}->{REF["L50"]} C50 {c50:.1f}->{REF["C50"]}')

for f in sorted(glob.glob(f'{ROOT}/public/assets/ui/zanara/roster/*.png')):
    process(f)
