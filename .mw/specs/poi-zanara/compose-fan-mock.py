#!/usr/bin/env python3
"""Mock ventaglio Luogo (PLAN-117 F2, ruling Director 2026-11-12):
il Luogo è l'elemento dipinto (villaggio con palizzata), NON un marker.
Clic sul villaggio → ventaglio di sigilli POI (cornice battezzata):
primo a Nord, poi alternando destra/sinistra; semiventaglio inferiore
quando il superiore è pieno."""
from PIL import Image, ImageDraw, ImageFont
import math, os

ROOT = '/Users/faustoboni/progetti_personali/RPG'
MAP = f'{ROOT}/public/assets/world/mappa2/base/layers/base_flat.webp'
VILLAGE = f'{ROOT}/public/assets/world/mappa2/base/fx/village/stone-palisade-wood-wood.webp'
SEAL = f'{ROOT}/.mw/runs/20261111-poi-zanara/piece/poi-frame-green-icon-logs.png'
OUT = f'{ROOT}/.mw/specs/poi-zanara/fan-mock'
os.makedirs(OUT, exist_ok=True)

ZX, ZY, ZW, ZH = 1260, 505, 510, 390   # village zone rect (world px)
VX, VY = ZX + ZW//2, ZY + ZH//2        # 1515,700 — centro luogo
CROP = 940
SEAL_PX = 68

base = Image.open(MAP).convert('RGBA')
vill = Image.open(VILLAGE).convert('RGBA').resize((ZW, ZH), Image.LANCZOS)
base.paste(vill, (ZX, ZY), vill)
crop = base.crop((VX - CROP//2, VY - CROP//2, VX + CROP//2, VY + CROP//2))
cx, cy = CROP//2, CROP//2

seal = Image.open(SEAL).convert('RGBA')
seal.thumbnail((SEAL_PX, SEAL_PX), Image.LANCZOS)

def font(sz):
    try:
        return ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', sz)
    except Exception:
        return ImageFont.load_default()

def paste_seal(base_im, x, y, num):
    base_im.paste(seal, (int(x - seal.width/2), int(y - seal.height/2)), seal)
    d = ImageDraw.Draw(base_im)
    bx, by, r = x + seal.width*0.34, y + seal.height*0.34, 10
    d.ellipse((bx-r, by-r, bx+r, by+r), fill='#0b1524', outline='#e8ddc0', width=1)
    d.text((bx, by), str(num), fill='#e8ddc0', font=font(12), anchor='mm')

STEP = math.radians(30)

def fan_offsets(cap):
    """Ordine ventaglio: centro (N), poi +dx, -sx, +2dx, -2sx, ..."""
    order = [0.0]
    k = 1
    while len(order) < cap:
        order.append(+k * STEP)
        if len(order) < cap:
            order.append(-k * STEP)
        k += 1
    return order

R_UPPER, R_LOWER = 215, 180
UPPER_CAP = 7   # -90°±90° a passi di 30° → 7 slot nel semicerchio superiore

def render(n_items, name):
    im = crop.copy()
    nums = []
    offs = fan_offsets(UPPER_CAP)
    for i in range(min(n_items, UPPER_CAP)):
        a = -math.pi/2 + offs[i]
        nums.append((i+1, cx + math.cos(a)*R_UPPER, cy + math.sin(a)*R_UPPER))
    for i in range(max(0, n_items - UPPER_CAP)):
        a = math.pi/2 - fan_offsets(UPPER_CAP)[i]   # specchio: parte da Sud
        nums.append((UPPER_CAP + i + 1, cx + math.cos(a)*R_LOWER, cy + math.sin(a)*R_LOWER))
    for num, x, y in nums:
        paste_seal(im, x, y, num)
    im.convert('RGB').save(f'{OUT}/{name}.png')
    print(name, len(nums), 'sigilli')

# click-zone ghost (solo mock: dove si clicca = il villaggio dipinto)
im0 = crop.copy()
d = ImageDraw.Draw(im0)
d.ellipse((cx-200, cy-150, cx+200, cy+150), outline=(232,221,192,150), width=2)
d.text((cx, cy-165), 'zona clic', fill=(232,221,192,220), font=font(16), anchor='mm')
im0.convert('RGB').save(f'{OUT}/mock-0-villaggio-click.png')

render(5, 'mock-5-upper')
render(7, 'mock-7-upper-full')
render(10, 'mock-10-upper+lower')
render(14, 'mock-14-full')
