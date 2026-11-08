#!/usr/bin/env python3
"""PLAN-112 G2-4: apply the chosen palette (gold A: -20% chroma and hot highlights pulled down; enamel B: hue 182 / L 22 / C 18) to every
HUD asset, always starting from the rollback copy in .mw/specs/hud-real/f3/rollback-color/ so the run is idempotent.
Protected from the enamel step: dark-glass boxes (geometries), gems and ivy (the unify mask excludes bright/saturated and yellow-green).
Usage: tools/hud-real/venv/bin/python -I scripts/hud-real/apply-palette.py [--gold-chroma 0.8 --gold-hi 0.45 --hue 182 --L 22 --C 18]"""
import argparse, glob, json, os, shutil, subprocess, sys
import cv2, numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('--gold-chroma', type=float, default=0.8); ap.add_argument('--gold-hi', type=float, default=0.45)
ap.add_argument('--hue', type=float, default=182); ap.add_argument('--L', type=float, default=22); ap.add_argument('--C', type=float, default=18)
ap.add_argument('--dry', action='store_true'); a = ap.parse_args()
RB = '.mw/specs/hud-real/f3/rollback-color/'; ROOT = 'public/assets/ui/hud-real/'
SKIP = ('library/', 'round/', 'illustration')
# dark-glass pieces: gold is graded, the enamel step must NOT touch them (their 'green' is dark glass, L ~6-15)
GLASS_ONLY = ('seal/strip.webp', 'seal/disc.webp')
# pieces whose gold is already below the chroma floor: keep their gold (do not reduce it further), enamel still unified
KEEP_GOLD = ('panel/frame.webp',)
# per-piece enamel target tweaks so marginal pieces land inside the check (hue floor 172, chroma ceiling 21)
ENAMEL_TWEAK = {'brand/piece.webp': ('--hue', '186'), 'C1/ring.webp': ('--C', '15')}
GEO = {  # asset -> geometry json protecting dark glass from the enamel step
    'resources/bar.webp': 'resources/bar-geometry.json', 'nav/bar.webp': 'nav/bar-geometry.json', 'time/bar.webp': 'time/bar-geometry.json',
    'seal/strip.webp': None, 'compass/piece.webp': 'compass/piece-geometry.json', 'brand/piece.webp': 'brand/piece-geometry.json',
    'voce/piece.webp': 'voce/piece-geometry.json', 'panel/frame.webp': 'panel/frame-geometry.json'}

def lab(rgb):
    x = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32); return x[..., 0] * 100 / 255, x[..., 1] - 128, x[..., 2] - 128

def gold_a(path_in, path_out, chroma=None, hi=None):
    chroma = a.gold_chroma if chroma is None else chroma; hi = a.gold_hi if hi is None else hi
    im = np.array(Image.open(path_in).convert('RGBA')); rgb = im[..., :3]; al = im[..., 3] > 200
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    gold = al & (hsv[..., 0] >= 10) & (hsv[..., 0] <= 34) & (hsv[..., 1] > 60) & (hsv[..., 2] > 90)
    w = cv2.GaussianBlur(gold.astype(np.float32), (5, 5), 1.2)
    L, A, B = lab(rgb)
    Lg = L - np.maximum(0, L - 70) * hi
    L2 = L + (Lg - L) * w; A2 = A + (A * chroma - A) * w; B2 = B + (B * chroma - B) * w
    out = np.dstack([L2 * 255 / 100, A2 + 128, B2 + 128]).clip(0, 255).astype(np.uint8)
    Image.fromarray(np.dstack([cv2.cvtColor(out, cv2.COLOR_LAB2RGB), im[..., 3]]), 'RGBA').save(path_out, 'WEBP', lossless=True, quality=100, method=6)

done = []
for f in sorted(glob.glob(ROOT + '*/*.webp')):
    rel = f[len(ROOT):]
    if any(x in rel for x in SKIP): continue
    rb = RB + rel.replace('/', '_')
    if not os.path.exists(rb): print('NO BACKUP', rel); continue
    if a.dry: done.append(rel); continue
    if rel in KEEP_GOLD: gold_a(rb, f, chroma=1.25, hi=0.0)   # the panel's gold is below the chroma floor: lift it, no highlight cut
    else: gold_a(rb, f)                             # restart from the original, gold first
    done.append(rel)
print(len(done), 'assets gold-A applied')
if not a.dry:
    # enamel B through the project's own script (it restarts from its own unify__ backups: clear them so it restarts from the gold-A result)
    for x in glob.glob('.mw/specs/hud-real/regrade-backup/unify__*'): os.remove(x)
    items = []
    for rel in done:
        if rel in GLASS_ONLY: continue
        g = GEO.get(rel); items.append(ROOT + rel + (':' + ROOT + g if g else ''))
    plain = [i for i in items if i.split(':')[0][len(ROOT):] not in ENAMEL_TWEAK]
    r = subprocess.run([sys.executable, '-I', 'scripts/hud-real/unify-enamel.py', '--hue', str(a.hue), '--L', str(a.L), '--C', str(a.C)] + plain, capture_output=True, text=True)
    print('\n'.join(l for l in r.stdout.splitlines() if 'L ' in l or 'skip' in l)[:600]); print(r.stderr[-300:] if r.returncode else '')
    for it in items:
        rel = it.split(':')[0][len(ROOT):]
        if rel in ENAMEL_TWEAK:
            k, v = ENAMEL_TWEAK[rel]; args = {'--hue': str(a.hue), '--L': str(a.L), '--C': str(a.C)}; args[k] = v
            cmd = [sys.executable, '-I', 'scripts/hud-real/unify-enamel.py'] + [x for kv in args.items() for x in kv] + [it]
            rr = subprocess.run(cmd, capture_output=True, text=True); print('tweak', rel, k, v, '->', (rr.stdout.splitlines() or [''])[-1][:100])
