#!/usr/bin/env python3
"""R-357 / PLAN-125 — baptized panel frame assets ("cornici" grammar), sliced from the
approved golden `.mw/specs/expedition-ui/refs/mockup-r357-cornici-aperta.png` (1376x768).

Grammar (from the golden): a continuous engraved champagne spine on the LEFT edge with
acanthus scrolls gripping a gem at top-left and bottom-left of each panel; plain gold
wires close top/right/bottom. The header band is dark enamel with the title on the left
and the vine-engraved champagne strip filling the rest. The stash panel carries a chest
emblem seated on its top edge. Right corners are plain wire junctions — no asset.

Old `panel-frame/` corners had the map baked in (R-357 defect); these are re-cut with a
gold/green/dark key so the gaps read through. Live text/buttons stay DOM.
Run: python3 scripts/build-panel-frame2-assets.py"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, os, sys
SRC = '.mw/specs/expedition-ui/refs/mockup-r357-cornici-aperta.png'
OUT = 'public/assets/ui/hud-real/panel-frame2'
os.makedirs(OUT, exist_ok=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib_grade_gold import grade_gold
im = Image.open(SRC).convert('RGB')

def key_ornament(img, keep=(), lo=70):
    """Alpha for ornate metalwork over map/enamel: keep gold (r>b), emerald (g>r), pale gem
    (bright, low-sat) and warm dark (mx<lo) — drop the map's blue/sand. `keep` = list of
    (cx,cy,rx,ry) ellipses in crop coords that stay fully opaque (gems whose pale body
    would otherwise key out)."""
    a = np.array(img.convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a.max(axis=2)
    gold = (r - b) > 24
    green = (g - r) > 10
    pale = (mx > 145) & ((r - b) < 40) & (mx - a.min(axis=2) < 90)
    dark = mx < lo
    mask = (gold | green | pale | dark).astype('uint8') * 255
    m = Image.fromarray(mask).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.9))
    mask = np.array(m).astype(int)
    for cx, cy, rx, ry in keep:
        e = Image.new('L', img.size, 0)
        ImageDraw.Draw(e).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
        mask = np.maximum(mask, np.array(e.filter(ImageFilter.GaussianBlur(1.2))).astype(int))
    out = img.convert('RGBA')
    out.putalpha(Image.fromarray(np.clip(mask, 0, 255).astype('uint8')))
    return out

def save(img, name, grade=True, q=94):
    if grade:
        img = grade_gold(img, src_hue=40.0, sat_k=0.85, val_k=1.05, min_v=0.18)
    img.save(f'{OUT}/{name}.webp', quality=q, method=6)
    print(name, img.size)

# ── roster corners: acanthus scroll + pale-mint gem (top-left), emerald (bottom-left).
#    Boxes end before the ROSTER title (x~47) and the row content.
save(key_ornament(im.crop((12, 98, 48, 178)), keep=[(12, 22, 9, 13)]), 'corner-tl')
# roster BL: gem + downward curl along the bottom wire, before the vine band's x~37 tail
save(key_ornament(im.crop((16, 421, 52, 458)), keep=[(12, 19, 8, 10)]), 'corner-bl')

# ── stash corners: acanthus + emerald; the chest ships apart (it seats on the top wire).
save(key_ornament(im.crop((12, 458, 46, 532)), keep=[(9, 14, 8, 11)]), 'corner-tl-stash')
save(key_ornament(im.crop((12, 646, 74, 698)), keep=[(26, 27, 9, 10)]), 'corner-bl-stash')
save(key_ornament(im.crop((44, 462, 90, 506)), lo=64), 'emblem-chest')

# ── header vine band: the engraved champagne strip filling the band past the title
#    (opaque strip — it is a full-bleed piece cropped by the container, not an overlay)
save(im.crop((158, 116, 268, 158)), 'header-vine', grade=True)

# ── left spine: the vertical engraved strip between the two corner knuckles
save(im.crop((25, 500, 38, 640)), 'edge-left', grade=True)

# wires are token-driven CSS borders — no asset needed.
