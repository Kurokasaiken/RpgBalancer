#!/usr/bin/env python3
"""PLAN-110 C4 v2: generated panel image with the frame and a detached CTA plaque (compass medallion) below it
-> frame.webp (+ geometry: field, window) and cta.webp (+ geometry: text field), same scale (frame = --width design px wide).
Cut like the other pieces; components of the alpha are split by size: the biggest is the frame, the widest low one is the CTA.
Usage: tools/hud-real/venv/bin/python -I scripts/hud-real/build-panel2-assets.py --src P.png --width 340 --ts src/ui/idleVillage/hudReal/panelFrameGeometry.ts"""
import argparse, importlib.util, json, os
import cv2, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('bra', os.path.join(HERE, 'build-roster-assets.py')); bra = importlib.util.module_from_spec(spec); spec.loader.exec_module(bra)
ap = argparse.ArgumentParser(); ap.add_argument('--src', required=True); ap.add_argument('--width', type=float, default=340); ap.add_argument('--out', default='public/assets/ui/hud-real/panel'); ap.add_argument('--ts'); a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
rgb, alpha, *_ = bra.cut(a.src)
op = (alpha > 0.5).astype(np.uint8)
op = cv2.morphologyEx(op, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(op, connectivity=8)
comps = sorted([(st[i, cv2.CC_STAT_AREA], i) for i in range(1, n)], reverse=True)
frame_id = comps[0][1]
fy1 = st[frame_id, cv2.CC_STAT_TOP] + st[frame_id, cv2.CC_STAT_HEIGHT]
cta_id = None
for area, i in comps[1:]:
    x, y, w, h = (int(st[i, c]) for c in (cv2.CC_STAT_LEFT, cv2.CC_STAT_TOP, cv2.CC_STAT_WIDTH, cv2.CC_STAT_HEIGHT))
    if w > 2.5 * h and y > st[frame_id, cv2.CC_STAT_TOP] + 0.6 * st[frame_id, cv2.CC_STAT_HEIGHT] and area > 0.01 * comps[0][0]:
        cta_id = i; break
split_y = None
if cta_id is None:  # pendants touch the plaque: split by rows at the first wide opaque band in the lower part
    H, W = alpha.shape; frac = (alpha > 0.5).mean(1)
    yb = max(y for y in range(H) if frac[y] > 0.5)      # last wide row = bottom of the plaque
    yt = yb
    while yt > 0 and frac[yt - 1] > 0.3: yt -= 1          # climb to the plaque top (pendants are narrower)
    split_y = yt - 2
    print('row split at', split_y, 'of', H)
print('frame comp', frame_id, 'cta comp', cta_id)
def part(cid, pad=2, rows=None):
    m = (lab == cid) if cid is not None else np.ones(alpha.shape, bool)
    if rows == 'top': m = m & (np.arange(alpha.shape[0])[:, None] < split_y)
    if rows == 'bottom': m = m & (np.arange(alpha.shape[0])[:, None] >= split_y)
    # keep only pixels of this component (plus anti-aliased fringe) so the neighbour does not leak in
    m = cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    al = np.where(m, alpha, 0.0)
    return bra.crop_to(rgb, al, pad=pad)
frgb, fa, (fx, fy) = part(frame_id, rows='top' if split_y else None)
h, w = fa.shape; s = a.width / w
f = frgb.astype(np.int32); lum = (f[..., 0] * 299 + f[..., 1] * 587 + f[..., 2] * 114) // 1000; chroma = f.max(2) - f.min(2); opq = fa > 0.5
ivory = opq & (lum > 170) & (chroma < 60)
ivory = cv2.morphologyEx(ivory.astype(np.uint8), cv2.MORPH_OPEN, np.ones((9, 9), np.uint8)).astype(bool)
def biggest(m):
    n2, l2, s2, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=4); i = 1 + int(np.argmax(s2[1:, cv2.CC_STAT_AREA])); return l2 == i
def box(m): ys, xs = np.where(m); return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
field = box(biggest(ivory))
dwin = opq & (lum < 45); dwin[int(h * 0.7):, :] = False; dwin[:, :int(w * 0.5)] = False
dwin = cv2.morphologyEx(dwin.astype(np.uint8), cv2.MORPH_OPEN, np.ones((7, 7), np.uint8)).astype(bool)
win = box(biggest(dwin))
# gold grade would stain the alabaster: restore the original ivory in the field
graded = bra.grade(frgb, fa).astype(np.float32)
keep = cv2.GaussianBlur(biggest(ivory).astype(np.float32), (7, 7), 1.5)[..., None]
mixed = (graded * (1 - keep) + frgb.astype(np.float32) * keep).clip(0, 255).astype(np.uint8)
def save2x(img, al, sc, path):
    im = Image.fromarray(np.dstack([img, (al * 255).astype(np.uint8)]), 'RGBA'); im = im.resize((round(im.width * sc * bra.DPR), round(im.height * sc * bra.DPR)), Image.LANCZOS)
    im.save(path, 'WEBP', lossless=True, quality=100, method=6); return list(im.size)
sz = save2x(mixed, fa, s, os.path.join(a.out, 'frame.webp'))
r = lambda b: {'x': round(b[0] * s, 2), 'y': round(b[1] * s, 2), 'w': round((b[2] - b[0]) * s, 2), 'h': round((b[3] - b[1]) * s, 2)}
fgeo = {'w': round(w * s, 2), 'h': round(h * s, 2), 'field': r(field), 'window': r(win), 'asset2x': sz}
cgeo = None
if cta_id is not None or split_y:
    crgb, ca, _ = part(cta_id, rows='bottom' if split_y else None)
    ch, cw = ca.shape; cf = crgb.astype(np.int32); cl = (cf[..., 0] * 299 + cf[..., 1] * 587 + cf[..., 2] * 114) // 1000
    green = (ca > 0.5) & (cf[..., 1] > cf[..., 0] + 15) & (cl > 20) & (cl < 150); green[:, :int(cw * 0.3)] = False
    k = max(5, int(cw * 0.012)) | 1
    green = cv2.erode(cv2.morphologyEx(green.astype(np.uint8), cv2.MORPH_OPEN, np.ones((k, k), np.uint8)), np.ones((k, k), np.uint8))
    gf = box(biggest(green))
    cs = save2x(bra.grade(crgb, ca), ca, s, os.path.join(a.out, 'cta.webp'))
    cgeo = {'w': round(cw * s, 2), 'h': round(ch * s, 2), 'field': r(gf), 'asset2x': cs}
print(json.dumps({'frame': fgeo, 'cta': cgeo}))
if a.ts:
    open(a.ts, 'w').write('/**\n * GENERATED by scripts/hud-real/build-panel2-assets.py — do not edit by hand.\n * Frame (alabaster field, arched dark-glass window) and detached CTA plaque (compass medallion + emerald text field). Design px; assets 2x.\n */\n'
                          'export const PANEL_FRAME = ' + json.dumps(fgeo, indent=2) + ' as const;\n' + ('export const PANEL_CTA = ' + json.dumps(cgeo, indent=2) + ' as const;\n' if cgeo else ''))
