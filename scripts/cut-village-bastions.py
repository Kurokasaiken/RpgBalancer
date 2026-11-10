#!/usr/bin/env python3
"""PLAN-106 / R-313 — cut the two stone bastions out of Gemini's in-wall repaint.

Input: out/village-chain/tower-sprites/tw-stone-bastion-0.png — a repaint of
stone-wall-none-none with square bastions built INTO the wall (prompt
prompts/tw-stone-bastion.txt, phase-correlation shift ≈ 0). Patch = diff vs the
host (blurred, thresholded) inside one window per slot, closed + filled +
feathered: tower AND the wall course around it, so the stone upgrade reads as
part of the wall instead of a free-standing pillar (Director 2026-11-09).
Output (2× plate res): parts/bastion-s{1,2}.png + parts/bastions.json with each
patch's foot (bottom-centre of the tower body, 2× px).
"""
import json
import cv2
import numpy as np
from PIL import Image

D = 'out/village-chain/tower-sprites/'
V = 'public/assets/world/mappa2/base/fx/village/'
# windows in 2× plate px: x0, y0, x1, y1
WIN = {1: (385, 455, 510, 655), 2: (755, 420, 895, 625)}


def main() -> None:
    ref = np.array(Image.open(D + 'ref-wall-none.png').convert('RGB'))
    gen = np.array(Image.open(D + 'tw-stone-bastion-0.png').convert('RGB').resize((1020, 780), Image.LANCZOS))
    d = cv2.absdiff(cv2.GaussianBlur(ref, (0, 0), 1.5), cv2.GaussianBlur(gen, (0, 0), 1.5)).max(axis=2)
    feet = {}
    for slot, (x0, y0, x1, y1) in WIN.items():
        m = np.zeros(d.shape, np.uint8)
        m[y0:y1, x0:x1] = (d[y0:y1, x0:x1] > 26).astype(np.uint8) * 255
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        n, lab, st, _ = cv2.connectedComponentsWithStats(m)
        big = 1 + int(np.argmax(st[1:, 4]))
        body = ((lab == big) * 255).astype(np.uint8)
        cnts, _ = cv2.findContours(body, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        body = np.zeros_like(body)
        cv2.drawContours(body, cnts, -1, 255, cv2.FILLED)
        a = cv2.GaussianBlur(cv2.dilate(body, np.ones((7, 7), np.uint8)), (0, 0), 2.0)
        ys, xs = np.where(a > 8)
        bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        rgba = np.dstack([gen, a])[by0:by1, bx0:bx1]
        Image.fromarray(rgba, 'RGBA').save(V + f'parts/bastion-s{slot}.png')
        ysb, xsb = np.where(body > 0)
        ymax = ysb.max()
        feet[slot] = {'foot2x': [float(xsb[ysb >= ymax - 10].mean()), float(ymax)], 'origin2x': [int(bx0), int(by0)], 'size': [int(bx1 - bx0), int(by1 - by0)]}
        print(slot, feet[slot])
    json.dump(feet, open(V + 'parts/bastions.json', 'w'), indent=2)


if __name__ == '__main__':
    main()
