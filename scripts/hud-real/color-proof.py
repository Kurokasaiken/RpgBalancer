#!/usr/bin/env python3
"""PLAN-112 F3.1 proof sheet: the same HUD pieces in the CURRENT colour and in two candidate targets, over the three map zones
(sea / jungle / light land) cut from a bare-map screenshot. Writes .mw/specs/hud-real/f3/color-proof.png. Does not touch any asset."""
import argparse
import cv2, numpy as np
from PIL import Image, ImageDraw

def lab(rgb):
    x = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32); return x[..., 0] * 100 / 255, x[..., 1] - 128, x[..., 2] - 128

def retint(rgba, hue, Lt, Ct, gold_c, gold_hi):
    a = np.array(rgba); rgb = a[..., :3]; al = a[..., 3] > 200
    L, A, B = lab(rgb); C = np.hypot(A, B); H = np.degrees(np.arctan2(B, A)) % 360
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    ename = al & (L < 36) & (C < 30) & (H > 140) & (H < 235) & (hsv[..., 1] > 30)
    gold = al & (hsv[..., 0] >= 10) & (hsv[..., 0] <= 34) & (hsv[..., 1] > 60) & (hsv[..., 2] > 90)
    soft = lambda m: cv2.GaussianBlur(m.astype(np.float32), (5, 5), 1.2)
    we, wg = soft(ename), soft(gold)
    if ename.sum() > 300:
        mA, mB, mL = float(np.median(A[ename])), float(np.median(B[ename])), float(np.median(L[ename]))
        d = np.deg2rad(hue) - np.arctan2(mB, mA); cs = min(Ct / max(np.hypot(mA, mB), 1), 2.6)
        A2 = (A * np.cos(d) - B * np.sin(d)) * cs; B2 = (A * np.sin(d) + B * np.cos(d)) * cs
        g = np.clip(np.log(Lt / 100) / np.log(max(mL, 1) / 100), 0.45, 1.3); L2 = 100 * (np.clip(L, 0, 100) / 100) ** g
        L, A, B = L + (L2 - L) * we, A + (A2 - A) * we, B + (B2 - B) * we
    # gold: less saturated, hot highlights pulled down
    Lg = L - np.maximum(0, L - 70) * gold_hi
    L = L + (Lg - L) * wg; A = A + (A * gold_c - A) * wg; B = B + (B * gold_c - B) * wg
    out = np.dstack([L * 255 / 100, A + 128, B + 128]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([cv2.cvtColor(out, cv2.COLOR_LAB2RGB), a[..., 3]]), 'RGBA')

ap = argparse.ArgumentParser(); ap.add_argument('--map-shot', required=True); a = ap.parse_args()
bg = np.array(Image.open(a.map_shot).convert('RGB')); L, A, B = lab(bg); C = np.hypot(A, B); H = np.degrees(np.arctan2(B, A)) % 360
zone = {'sea': (H > 185) & (H < 255) & (L > 28) & (L < 65) & (C > 12), 'jungle': (H > 95) & (H < 165) & (L < 38) & (C > 8), 'terra chiara': (L > 62) & (C > 20) & (H > 55) & (H < 105)}
def window(m, w=520, h=190):
    k = np.ones((h, w), np.float32); s = cv2.filter2D(m.astype(np.float32), -1, k); y, x = np.unravel_index(np.argmax(s), s.shape)
    y0 = int(np.clip(y - h // 2, 0, bg.shape[0] - h)); x0 = int(np.clip(x - w // 2, 0, bg.shape[1] - w)); return Image.fromarray(bg[y0:y0 + h, x0:x0 + w])
nav = Image.open('public/assets/ui/hud-real/nav/bar.webp').convert('RGBA'); plq = Image.open('public/assets/ui/hud-real/C1/plaque.webp').convert('RGBA')
nav = nav.resize((int(nav.width * 0.30), int(nav.height * 0.30)), Image.LANCZOS); plq = plq.resize((int(plq.width * 0.45), int(plq.height * 0.45)), Image.LANCZOS)
V = [('ATTUALE', None), ('A: smalto 196 / L22 / C17, oro -20%', (196, 22, 17, 0.8, 0.45)), ('B: smalto 182 / L22 / C18, oro -10%', (182, 22, 18, 0.9, 0.3))]
W, H_ = 520, 190
sheet = Image.new('RGB', (W * 3 + 20, (H_ + 22) * 3), (16, 16, 16)); d = ImageDraw.Draw(sheet)
for r, (zn, m) in enumerate(zone.items()):
    base = window(m)
    for c, (name, p) in enumerate(V):
        tile = base.copy().convert('RGBA')
        for piece, pos in ((nav, (110, 20)), (plq, (20, 110))):
            im = piece if p is None else retint(piece, *p)
            tile.alpha_composite(im, (pos[0] if piece is nav else 20, pos[1] if piece is nav else 108))
        x, y = c * (W + 10), r * (H_ + 22)
        sheet.paste(tile.convert('RGB'), (x, y + 18)); d.text((x + 3, y + 3), f'{zn} - {name}', fill=(255, 255, 255))
sheet.save('.mw/specs/hud-real/f3/color-proof.png'); print(sheet.size)
