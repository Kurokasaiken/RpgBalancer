#!/usr/bin/env python3
"""R-357 / PLAN-125 palette: the `draghiGlifo` ghiera (dragon painted out, see ideas.md#ghiera-draghi) graded onto
the nav champagne. Source `ghiera-draghi-clean.webp` + `ghiera-draghi-top.webp` stay untouched; outputs are new files.
Measured before: gold hue 41 / sat 58% / value 55% (bronze); nav: 45 / 49% / 79%."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from lib_grade_gold import grade_gold
D = 'public/assets/ui/hud-real'
for src, out in (('ghiera-draghi-clean', 'ghiera-glifo'), ('ghiera-draghi-top', 'ghiera-glifo-top')):
    im = grade_gold(Image.open(f'{D}/{src}.webp'), src_hue=41.0, sat_k=0.80, val_k=3.1, sat_floor=0.16, min_v=0.08, lo=18, hi=70)
    im.save(f'{D}/{out}.webp', quality=95, method=6); print(out, im.size)
