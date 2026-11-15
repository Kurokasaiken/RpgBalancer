#!/usr/bin/env python3
"""Extract painted icon glyphs from the approved mockup.
Chroma-key enamel → keep ONLY the largest connected component (icon blob);
text/labels are separate smaller blobs and get discarded."""
import math, os
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

MOCK = '.mw/specs/poi-radial/refs/mockup-hub-fan-village.jpg'
OUT = 'public/assets/ui/poi-radial/icons'
os.makedirs(OUT, exist_ok=True)
mw, mh = 1946, 544
M = Image.open(MOCK).convert('RGBA')

SLOTS = [
    (5,  'compass',  0.244, 0.460, 93.1,  0.154, 0.580, (0.00, -0.14, 0.60)),
    (9,  'axe',      0.383, 0.553, 11.1,  0.103, 0.630, (0.00, -0.26, 0.60)),
    (7,  'pickaxe',  0.380, 0.735, 15.0,  0.100, 0.370, (0.00, -0.22, 0.62)),
    (12, 'wheat',    0.503, 0.900, -154.1, 0.159, 0.420, (0.00, -0.22, 0.56)),
    (10, 'moneybag', 0.650, 0.500, 37.0,  0.128, 0.550, (0.00, -0.24, 0.54)),
    (13, 'anvil',    0.620, 0.827, 159.2, 0.154, 0.430, (0.00, -0.22, 0.56)),
    (8,  'scales',   0.768, 0.735, 50.0,  0.108, 0.370, (0.00, -0.22, 0.56)),
    (6,  'scroll',   0.763, 0.267, 37.0,  0.130, 0.340, (0.00, -0.14, 0.60)),
    (4,  'swords',   0.838, 0.340, 13.0,  0.105, 0.330, (0.00, -0.16, 0.60)),
    (11, 'tankard',  0.879, 0.717, 100.0, 0.121, 0.450, (0.00, -0.18, 0.58)),
]
ENAMELS = np.array([[30, 110, 75], [32, 72, 135], [95, 70, 40], [20, 30, 45]], dtype=np.float32)

def largest_component(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask, bool)
    best = np.zeros_like(mask, bool); best_n = 0
    for sy in range(0, h, 3):
        for sx in range(0, w, 3):
            if mask[sy, sx] and not seen[sy, sx]:
                q = deque([(sy, sx)]); seen[sy, sx] = True; comp = []
                while q:
                    y, x = q.popleft(); comp.append((y, x))
                    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                        ny, nx = y+dy, x+dx
                        if 0<=ny<h and 0<=nx<w and mask[ny,nx] and not seen[ny,nx]:
                            seen[ny,nx] = True; q.append((ny,nx))
                if len(comp) > best_n:
                    best_n = len(comp); best = np.zeros_like(mask, bool)
                    for y,x in comp: best[y,x] = True
    return best

for idx, name, fx, fy, deg, wf, hf, (icx, icy, iw) in SLOTS:
    cx, cy = fx * mw, fy * mh
    cw, ch = wf * mw, hf * mh
    r = math.radians(deg)
    lx, ly = icx * cw, icy * ch
    ix, iy = cx + lx*math.cos(r) - ly*math.sin(r), cy + lx*math.sin(r) + ly*math.cos(r)
    side = int(cw * iw * 1.5)
    crop = M.crop((int(ix-side/2), int(iy-side/2), int(ix+side/2), int(iy+side/2))).rotate(-deg, resample=Image.BICUBIC, expand=True)
    a = np.array(crop.convert('RGB'), dtype=np.float32)
    alpha = np.array(crop.getchannel('A'), dtype=np.float32)/255
    d = np.stack([np.linalg.norm(a-e,axis=2) for e in ENAMELS]).min(axis=0)
    mask = (d > 55) & (alpha > 0.4)
    H, W = mask.shape
    bx, by = int(W*0.14), int(H*0.14)
    mask[:by]=False; mask[-by:]=False; mask[:,:bx]=False; mask[:,-bx:]=False
    mask = largest_component(mask)
    m = Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = crop.copy()
    out.putalpha(Image.fromarray(np.minimum(np.array(m), np.array(out.getchannel('A')))))
    bb = out.getchannel('A').getbbox()
    if bb: out = out.crop(bb)
    out.save(f'{OUT}/icon-{name}.webp','WEBP',quality=90,method=4)
    print(name, out.size)
