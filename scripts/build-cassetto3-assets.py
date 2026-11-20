#!/usr/bin/env python3
"""R-357 / PLAN-125 — cassetto v3 assets, sliced from the approved golden
`.mw/specs/expedition-ui/refs/mockup-r357-cassetto-largo.png` (1024x1536).
Everything live (text, rack, pouches, journey, CTA label) is rendered in DOM;
only painted parts are sliced here: left rail (top cap / tile / bottom cap),
the vignette, the bottom CTA plaque with its label erased, skull and chest.
Run: python3 scripts/build-cassetto3-assets.py"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, os
SRC = '.mw/specs/expedition-ui/refs/mockup-r357-cassetto-largo.png'
OUT = 'public/assets/ui/hud-real/cassetto3'
os.makedirs(OUT, exist_ok=True)
im = Image.open(SRC).convert('RGB')

def key_black(img, lo=14, gain=10):
    a = np.array(img).astype(int)
    alpha = np.clip((a.max(axis=2) - lo) * gain, 0, 255).astype('uint8')
    out = img.convert('RGBA'); out.putalpha(Image.fromarray(alpha)); return out

import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib_grade_gold import grade_gold

def save(img, name, q=94):
    if name.startswith(('rail-', 'frame-top', 'cta-plaque')):
        img = grade_gold(img)
    elif name == 'skull':      # copper-rose ring (hue ~30) -> champagne; the red of the skull is untouched
        img = grade_gold(img, src_hue=30.0, sat_floor=0.40, sat_k=0.80, val_k=1.06)
    elif name == 'chest':      # warm orange gold (hue ~36)
        img = grade_gold(img, src_hue=36.0, sat_k=0.85, val_k=1.10)
    elif name == 'supply-bag':  # dull bronze trim (hue ~41, value ~51%)
        img = grade_gold(img, src_hue=41.0, sat_k=0.88, val_k=1.62)
    img.save(f'{OUT}/{name}.webp', quality=q, method=6); print(name, img.size)

# left rail: black margin keyed out so the map shows through
save(key_black(im.crop((0, 0, 100, 360))), 'rail-top')
save(key_black(im.crop((0, 780, 100, 940))), 'rail-mid')
save(key_black(im.crop((0, 1160, 100, 1536))), 'rail-bottom')

# vignette (painting + its hairline), flush to the right edge
save(im.crop((88, 28, 1024, 290)), 'vignette')
# north frame: the thin gold bar over the vignette (the old crop lost it — Director: «la parte alta è stata ritagliata?»)
# the golden's north is only a floating hairline; the Director wants a real frame like the left rail:
# build a solid gold bar from the rail's own gold core (x 52..74 of the 100x160 mid tile), rotated, tiled.
_rm = np.array(Image.open(f'{OUT}/rail-mid.webp').convert('RGBA')).astype(float)
_prof = np.median(_rm[:, 54:72, :], axis=0)                 # 18 x RGBA: the rail's gold cross-section (median kills the vines)
_prof[:, 3] = 255
_prof = np.concatenate([_prof, _prof[::-1]], axis=0)[:30:2] if False else _prof
_h = _prof.shape[0]
_arr = np.repeat(_prof[:, None, :], 936, axis=1)             # horizontal bar: same cross-section along the whole length
_rng = np.random.default_rng(5); _arr[..., :3] += _rng.normal(0, 2.0, _arr[..., :3].shape)
_bar = Image.fromarray(np.clip(_arr, 0, 255).astype('uint8'), 'RGBA')
_full = Image.new('RGBA', (936, _h + 6), (0, 0, 0, 0)); _full.alpha_composite(_bar, (0, 0))
_hair = Image.new('RGBA', (936, 3), (0, 0, 0, 0)); ImageDraw.Draw(_hair).rectangle((0, 1, 936, 1), fill=(224, 196, 120, 150)); _full.alpha_composite(_hair, (0, _h + 2))
_full.save(f'{OUT}/frame-top.webp', quality=94, method=6); print('frame-top', _full.size)

# CTA button — built ONLY from the golden's clean RIGHT half (Director 2026-11-18: «il lato pulito … deve essere prima fixato,
# poi usato per fare anche la parte a sinistra»; every Gemini regeneration made it worse). Steps: erase the label strokes
# (OpenCV inpaint) → find the symmetry axis (centre of the top emerald) → take axis..right end → 2x upscale + gentle
# denoise + unsharp ("fix the slop") → MIRROR it for the left half → key the dark ground outside the brass.
import cv2
_g = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
_pl = _g[1330:1536, 100:1024].copy()
_hsv = cv2.cvtColor(_pl, cv2.COLOR_BGR2HSV)
_box = np.zeros(_pl.shape[:2], np.uint8); _box[60:150, 150:760] = 255
_cream = ((_hsv[..., 1] < 110) & (_hsv[..., 2] > 150)).astype(np.uint8) * 255
_pl = cv2.inpaint(_pl, cv2.dilate(cv2.bitwise_and(_cream, _box), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))), 5, cv2.INPAINT_TELEA)
_top = cv2.cvtColor(_pl[0:60, 330:530], cv2.COLOR_BGR2HSV)
_em = (_top[..., 0] > 60) & (_top[..., 0] < 90) & (_top[..., 1] > 90) & (_top[..., 2] > 150)
_xs = np.where(_em.any(axis=0))[0]; _axis = int(round((_xs.min() + _xs.max()) / 2)) + 330
_right = cv2.resize(_pl[:, _axis:], None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)
_right = cv2.fastNlMeansDenoisingColored(_right, None, 3, 3, 5, 15)
_right = cv2.addWeighted(_right, 1.7, cv2.GaussianBlur(_right, (0, 0), 1.6), -0.7, 0)
_full = np.hstack([cv2.flip(_right, 1), _right])          # perfectly symmetric
_rgb = cv2.cvtColor(_full, cv2.COLOR_BGR2RGB).astype(int)
_mx = _rgb.max(axis=2); _r, _gg, _b = _rgb[..., 0], _rgb[..., 1], _rgb[..., 2]
_brass = (_r > _gg - 10) & (_r > _b + 25) & (_mx > 90)
_dark = ((_mx <= 95) & ~_brass).astype(np.uint8)
_n, _lab = cv2.connectedComponents(_dark, connectivity=4)
_border = set(np.unique(np.concatenate([_lab[0], _lab[-1], _lab[:, 0], _lab[:, -1]]))) - {0}
_outside = np.isin(_lab, list(_border)).astype(np.uint8)
_alpha = cv2.GaussianBlur((255 - _outside * 255).astype(np.float32), (0, 0), 1.2)
_btn = Image.fromarray(np.dstack([_rgb.astype(np.uint8), np.clip(_alpha, 0, 255).astype(np.uint8)]), 'RGBA')
_btn = _btn.resize((1500, round(1500 * _btn.height / _btn.width)), Image.LANCZOS)
print('cta-plaque aspect', _btn.size)
save(_btn, 'cta-plaque', 95)

# skull + chest, elliptical soft mask
def medal(box, name, close_iter):
    """Skull/chest (R-357, rebuilt 2026-11-20: «il baule sembra ritagliato male», «ombra grigia sotto il teschio»): the old luminance key
    cut the chest's dark body away and kept the skull's dark shadow halo. Now: classify OBJECT pixels (brass | red | bone | gem), close
    small gaps, flood-fill the background from the borders, keep everything enclosed (dark interiors stay opaque), undo the closing
    growth, keep only the largest component, soften by 0.9 px. The shadow around the object is background, so it goes."""
    cr = np.array(im.crop(box)); rgb = cr.astype(int); r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]; mx = rgb.max(axis=2)
    obj = (((r > g - 8) & (r > b + 30) & (r > 95)) | ((r > g + 30) & (r > b + 30) & (r > 55)) | ((mx > 150) & (abs(r - g) < 70)) | ((g > r + 20) & (g > 95) & (b > 60))).astype(np.uint8)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    closed = cv2.dilate(obj, k, iterations=close_iter)
    n, lab = cv2.connectedComponents((1 - closed).astype(np.uint8), connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    inside = (~np.isin(lab, list(border))).astype(np.uint8)
    inside = cv2.erode(inside, k, iterations=max(0, close_iter - 1))
    cnt, comp, stats, _ = cv2.connectedComponentsWithStats(inside, connectivity=8)
    if cnt > 2:
        big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA])); inside = (comp == big).astype(np.uint8)
    al = cv2.GaussianBlur((inside * 255).astype(np.float32), (0, 0), 0.9)
    out = Image.fromarray(np.dstack([cr, np.clip(al, 0, 255).astype(np.uint8)]), 'RGBA'); save(out, name)
medal((130, 1160, 296, 1326), 'skull', 2)
medal((610, 1170, 770, 1330), 'chest', 3)

# title cartouche ornaments (Director 2026-11-20: «il titolo ha perso il frame»): the golden's thin gold corner curl (top-left) and the
# bottom-centre gem with leaves, keyed by brass class from the golden pixels. Right/bottom corners are the same piece MIRRORED
# (clean side mirrored, like the CTA) so the cartouche is symmetric by construction.
def brass_key(img, grow=1):
    a = np.array(img.convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = ((r > g - 8) & (r > b + 30) & (r > 105)) | ((g > r + 25) & (g > b + 5) & (g > 120) & (b > 70))   # brass | emerald gem
    al = Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = img.convert('RGBA'); out.putalpha(al); return out
save(brass_key(im.crop((84, 276, 140, 330))), 'cart-corner')      # top-left curl, 56x54
save(brass_key(im.crop((448, 492, 580, 534))), 'cart-gem')        # bottom gem + leaves, 132x42

# laurel wreath icon (success %): GENERATED by Gemini on flat black (Director 2026-11-20: «la foglia d'alloro è molto brutta, falla generare a Gemini»);
# source kept in .mw/specs/expedition-ui/refs/icon-laurel.png, black keyed out here, then graded onto the nav champagne.
_lr = Image.open('.mw/specs/expedition-ui/refs/icon-laurel.png').convert('RGB')
_lr = key_black(_lr, lo=22, gain=12)
_lr = _lr.crop(_lr.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()).copy()
_side = max(_lr.size); _sq = Image.new('RGBA', (_side, _side), (0, 0, 0, 0)); _sq.paste(_lr, ((_side - _lr.width) // 2, (_side - _lr.height) // 2))
save(_sq.resize((192, 192), Image.LANCZOS), 'laurel')

# supply bag icon (R-357: generated by Gemini on flat black, keyed here) — source kept in
# .mw/specs/expedition-ui/refs/icon-supply-bag.png
bag = Image.open('.mw/specs/expedition-ui/refs/icon-supply-bag.png').convert('RGB')
bag = key_black(bag, lo=18, gain=12)
bag = bag.crop(bag.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()).copy()
side = max(bag.size); sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(bag, ((side - bag.width) // 2, (side - bag.height) // 2))
save(sq.resize((192, 192), Image.LANCZOS), 'supply-bag')
