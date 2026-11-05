#!/usr/bin/env python3
"""Retint the emerald enamel of an exported piece toward a target Lab hue/chroma/lightness (soft mask on green pixels).
Used for the roster name plaque: the mockup's enamel is a deep teal (Lab a~-7 b~-11, L~17), ours was yellowish green.
Usage: retint-enamel.py asset.webp --rot DEG --chroma K --L TARGET   (original kept in .mw/specs/hud-real/regrade-backup/)"""
import argparse, os, shutil
import cv2, numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('path'); ap.add_argument('--rot', type=float, default=64); ap.add_argument('--chroma', type=float, default=0.65); ap.add_argument('--L', type=float, default=17)
a = ap.parse_args()
BK = '.mw/specs/hud-real/regrade-backup'; os.makedirs(BK, exist_ok=True)
bk = os.path.join(BK, 'retint__' + a.path.replace('/', '__'))
if not os.path.exists(bk): shutil.copy(a.path, bk)
im = np.array(Image.open(bk).convert('RGBA')); rgb = im[..., :3]; al = im[..., 3] > 200
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
m = al & (hsv[..., 0] >= 45) & (hsv[..., 0] <= 110) & (hsv[..., 1] > 40)
w = cv2.GaussianBlur(m.astype(np.float32), (5, 5), 1.2)
lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
L = lab[..., 0] * 100 / 255; A = lab[..., 1] - 128; B = lab[..., 2] - 128
th = np.deg2rad(a.rot); A2 = (A * np.cos(th) - B * np.sin(th)) * a.chroma; B2 = (A * np.sin(th) + B * np.cos(th)) * a.chroma
med = float(np.median(L[m])); L2 = np.clip(L * (a.L / max(med, 1)), 0, 100)
out = np.dstack([L + (L2 - L) * w, A + (A2 - A) * w, B + (B2 - B) * w])
out = np.dstack([out[..., 0] * 255 / 100, out[..., 1] + 128, out[..., 2] + 128]).clip(0, 255).astype(np.uint8)
res = cv2.cvtColor(out, cv2.COLOR_LAB2RGB)
Image.fromarray(np.dstack([res, im[..., 3]]), 'RGBA').save(a.path, 'WEBP', lossless=True, quality=100, method=6)
print('retinted', a.path, 'masked px', int(m.sum()))
