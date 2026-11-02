#!/usr/bin/env python3
"""PLAN-106 — deterministic defended plates via compositing.

One canonical tower sprite per (slot, material), extracted by diffing a
generated tower plate against its host (same registered lineage → the matte
IS the changed pixels). Each defended combo = host plate + stamped sprites:
the ring/village is pixel-identical across all 9 combos and a given tower
looks THE SAME everywhere. Run after plates for hosts+sources are exported.

Sources (canonical): wall family plates (cleanest towers).
Slots: slot1 = gate-side (lower-left), slot2 = far-side (upper-right).
"""
import cv2, numpy as np, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIL = ROOT / 'public/assets/world/mappa2/base/fx/village'
PLATE = (510, 390)  # zone w,h

def load_rgba(name):
    im = cv2.imread(str(VIL / name), cv2.IMREAD_UNCHANGED)
    return cv2.cvtColor(im, cv2.COLOR_BGRA2RGBA)

def extract_sprite(host_rgba, src_rgba, roi, thr=32):
    """RGBA cutout of what changed vs host inside roi (x,y,w,h)."""
    x, y, w, h = roi
    diff = cv2.absdiff(src_rgba[:,:,:3], host_rgba[:,:,:3]).max(axis=2)
    mask = np.zeros(diff.shape, np.uint8)
    mask[y:y+h, x:x+w] = 255
    m = ((diff > thr) & (mask > 0)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7,7),np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3,3),np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    if n < 2: return None
    keep = np.zeros_like(m)
    for i in 1 + np.argsort(stats[1:,4])[-2:]:  # tower may split in 2 blobs
        keep[lab == i] = 255
    keep = cv2.dilate(keep, np.ones((5,5),np.uint8))
    keep = cv2.GaussianBlur(keep, (9,9), 0)
    out = src_rgba.copy()
    out[:,:,3] = np.minimum(src_rgba[:,:,3], keep)
    ys, xs = np.where(keep > 60)
    return out[ys.min()-4:ys.max()+5, xs.min()-4:xs.max()+5], (int(xs.min()), int(ys.min()))

def stamp(base_rgba, sprite_rgba, bottom_center):
    """Alpha-over sprite with its bottom-centre at bottom_center (x,y)."""
    h, w = sprite_rgba.shape[:2]
    cx, cy = bottom_center
    x0, y0 = cx - w//2, cy - h
    x1, y1 = x0 + w, y0 + h
    bx0, by0, bx1, by1 = max(0,x0), max(0,y0), min(base_rgba.shape[1],x1), min(base_rgba.shape[0],y1)
    if bx1 <= bx0 or by1 <= by0: return
    sx0, sy0 = bx0-x0, by0-y0
    sp = sprite_rgba[sy0:sy0+(by1-by0), sx0:sx0+(bx1-bx0)]
    a = sp[:,:,3:4].astype(np.float32)/255
    reg = base_rgba[by0:by1, bx0:bx1].astype(np.float32)
    reg[:,:,:3] = sp[:,:,:3]*a + reg[:,:,:3]*(1-a)
    reg[:,:,3] = np.maximum(reg[:,:,3], sp[:,:,3]*255*a[:,:,0:1].reshape(-1,1) if False else sp[:,:,3].astype(np.float32))
    base_rgba[by0:by1, bx0:bx1] = reg.astype(np.uint8)

# canonical sources: (slot, material) -> (plate file, roi, stamp-anchor bottom-center)
HOSTS = {'palisade': 'stone-palisade-none-none.webp', 'wall': 'stone-wall-none-none.webp'}
SRC = {
    (1,'wood'):  ('stone-wall-wood-none.webp',      'wall',    (40,170,170,210), (110,300)),
    (1,'stone'): ('stone-palisade-stone-none.webp', 'palisade',(40,180,210,210), (115,295)),
    (2,'wood'):  ('stone-wall-none-wood.webp',      'wall',    (330,0,180,190),  (415,210)),
    (2,'stone'): ('stone-wall-none-stone.webp',     'wall',    (310,20,190,210), (415,210)),
}
def main():
    hosts = {d: load_rgba(f) for d, f in HOSTS.items()}
    sprites = {}
    for (slot,mat),(src,hostkey,roi,anchor) in SRC.items():
        got = extract_sprite(hosts[hostkey], load_rgba(src), roi)
        if not got: print('EXTRACT FAIL', slot, mat); continue
        sp, off = got
        cv2.imwrite(str(VIL/f'_tower-s{slot}-{mat}.png'), cv2.cvtColor(sp, cv2.COLOR_RGBA2BGRA))
        sprites[(slot,mat)] = (sp, anchor)
        print('sprite', slot, mat, sp.shape, 'off', off)
    for defence, host_f in HOSTS.items():
        host = load_rgba(host_f)
        for m1 in ('none','wood','stone'):
            for m2 in ('none','wood','stone'):
                if m1 == 'none' and m2 == 'none': continue
                out = host.copy()
                for (slot,mat),(sp,anchor) in sprites.items():
                    if (slot == 1 and m1 == mat) or (slot == 2 and m2 == mat):
                        stamp(out, sp, anchor)
                key = f'stone|{defence}|{m1}+{m2}'.replace('|','-').replace('+','-')
                cv2.imwrite(str(VIL/f'{key}.webp'), cv2.cvtColor(out, cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_WEBP_QUALITY, 95])
    print('composed 16 plates')
if __name__ == '__main__': main()
