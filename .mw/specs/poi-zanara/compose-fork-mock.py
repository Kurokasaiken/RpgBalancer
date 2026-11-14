#!/usr/bin/env python3
"""Visual-fork mock cards — F2 radial Place menu (PLAN-117, dibattito r003).
Tre fork Director: D-d slice 12x30 vs 8x45 · D-b hub inset vs medaglione ·
D-c socket vetro vs incisi. Disco inclinato ~ratio 0.72 su crop reale del
villaggio; riempimento orario da NE (ruling)."""
from PIL import Image, ImageDraw, ImageFilter
import math, os

ROOT = '/Users/faustoboni/progetti_personali/RPG'
MAP = f'{ROOT}/public/assets/world/mappa2/base/layers/base_flat.webp'
VILLAGE = f'{ROOT}/public/assets/world/mappa2/base/fx/village/stone-palisade-wood-wood.webp'
SEAL = f'{ROOT}/.mw/runs/20261111-poi-zanara/piece/poi-frame-green-icon-logs.png'
OUT = f'{ROOT}/public/lab-fan-mock'
os.makedirs(OUT, exist_ok=True)

ZX, ZY, ZW, ZH = 1260, 505, 510, 390
VX, VY = ZX + ZW//2, ZY + ZH//2
CROP = 760
RATIO = 0.72          # inclinazione visuale del disco (min/maj)
RX = 215              # raggio maggiore del disco (px schermo)

NAVY   = (14, 30, 51)
EMER   = (18, 74, 64)
GOLD   = (201, 162, 39)
GOLD2  = (232, 199, 102)
INK    = (6, 12, 20)

def ellipse_pt(cx, cy, rx, ry, deg):
    a = math.radians(deg)
    return (cx + rx*math.cos(a), cy + ry*math.sin(a))

def sector(draw, cx, cy, ro_x, ro_y, ri_x, ri_y, a0, a1, **kw):
    """Settore anulare ellittico a0->a1 (gradi screen, y giu', CW=crescente)."""
    pts = [ellipse_pt(cx, cy, ro_x, ro_y, a0 + (a1-a0)*t/24) for t in range(25)]
    pts += [ellipse_pt(cx, cy, ri_x, ri_y, a1 - (a1-a0)*t/24) for t in range(25)]
    draw.polygon(pts, **kw)

def arc_line(draw, cx, cy, rx, ry, a0, a1, **kw):
    pts = [ellipse_pt(cx, cy, rx, ry, a0 + (a1-a0)*t/32) for t in range(33)]
    draw.line(pts, **kw)

def make_bg():
    base = Image.open(MAP).convert('RGBA')
    vill = Image.open(VILLAGE).convert('RGBA').resize((ZW, ZH), Image.LANCZOS)
    base.paste(vill, (ZX, ZY), vill)
    return base.crop((VX - CROP//2, VY - CROP//2, VX + CROP//2, VY + CROP//2))

def gem(draw, x, y, r, col=(46, 190, 140)):
    draw.polygon([(x, y-r), (x+r*0.7, y), (x, y+r), (x-r*0.7, y)],
                 fill=col, outline=GOLD2)

def draw_hub(img, cx, cy, mode, village_img):
    """mode: 'medallion' | 'inset'"""
    d = ImageDraw.Draw(img)
    hx, hy = 88*RX/215, 88*RX/215*RATIO
    d.ellipse([cx-hx-6, cy-hy-6, cx+hx+6, cy+hy+6], fill=GOLD)            # collarino oro
    d.ellipse([cx-hx, cy-hy, cx+hx, cy+hy], fill=NAVY)                   # campo navy
    if mode == 'inset':
        iw, ih = int(hx*1.18), int(hy*1.18)
        ins = village_img.resize((iw*2, ih*2), Image.LANCZOS)
        mask = Image.new('L', (iw*2, ih*2), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, iw*2-1, ih*2-1], fill=255)
        img.paste(ins, (cx-iw, cy-ih), mask)
        d.ellipse([cx-iw, cy-ih, cx+iw, cy+ih], outline=GOLD, width=3)
    else:
        # emblema oro inciso: rombo + gemma centrale (medaglione uniforme)
        d.ellipse([cx-hx*0.62, cy-hy*0.62, cx+hx*0.62, cy+hy*0.62], outline=GOLD, width=3)
        d.ellipse([cx-hx*0.40, cy-hy*0.40, cx+hx*0.40, cy+hy*0.40], outline=(140,115,50), width=2)
        gem(d, cx, cy, int(hx*0.30))
    for k in range(4):                                                  # 4 punte-gemma
        a = math.radians(-45 + k*90)
        gx, gy = cx + (hx+10)*math.cos(a), cy + (hy+10)*math.sin(a)
        gem(d, gx, gy, 9)

def draw_slice_icons(img, cx, cy, slots, active, seal):
    """icone sigillo battezzato al 65% raggio nelle slice attive + numero ordine."""
    d = ImageDraw.Draw(img)
    for i in active:
        a = math.radians(slots[i][2])
        ix, iy = cx + RX*0.68*math.cos(a), cy + RX*RATIO*0.68*math.sin(a)
        s = seal.copy(); s.thumbnail((42, 42), Image.LANCZOS)
        img.paste(s, (int(ix-21), int(iy-21)), s)
        d.text((ix, iy+16), str(i+1), fill=GOLD2, anchor='mm')

def draw_disc(n_slots, active, socket_mode, hub_mode, village_img, seal):
    """socket_mode: 'glass'|'engraved' ; hub_mode: 'medallion'|'inset'"""
    img = make_bg()
    img = img.filter(ImageFilter.GaussianBlur(1.1))                     # vignetta/dim leggero
    dim = Image.new('RGBA', img.size, (10, 16, 30, 70))
    img.alpha_composite(dim)
    cx = cy = CROP//2
    ov = Image.new('RGBA', img.size, (0,0,0,0))
    d = ImageDraw.Draw(ov)
    ro_x, ro_y = RX, RX*RATIO
    rm_x, rm_y = RX*0.89, RX*RATIO*0.89        # rim temporale esterno
    ri_x, ri_y = RX*0.49, RX*RATIO*0.49        # bordo collare/hub
    step = 360/n_slots
    NE = -45
    slots = []
    for i in range(n_slots):
        c = NE + step/2 + i*step                # slot0 centrato su NE, poi CW
        a0, a1 = c - step/2 + 1, c + step/2 - 1 # 2deg gutter
        slots.append((a0, a1, c))
        if i in set(active):
            col = EMER if i % 2 == 0 else NAVY
            sector(d, cx, cy, rm_x, rm_y, ri_x, ri_y, a0, a1, fill=col+(255,))
            sector(d, cx, cy, rm_x, rm_y, ri_x, ri_y, a0, a1, outline=GOLD+(255,), width=2)
        else:
            if socket_mode == 'glass':
                sector(d, cx, cy, rm_x, rm_y, ri_x, ri_y, a0, a1,
                       fill=(20, 40, 70, 90), outline=(160, 140, 80, 140), width=2)
            else:  # engraved
                sector(d, cx, cy, rm_x, rm_y, ri_x, ri_y, a0, a1,
                       fill=(10, 18, 32, 235), outline=GOLD+(230,), width=2)
                sector(d, cx, cy, rm_x*0.86, rm_y*0.86, ri_x*1.14, ri_y*1.14,
                       a0+4, a1-4, outline=(110, 90, 45, 200), width=1)
        # nervatura oro fra slice
        for aa in (a0, a1):
            p_in = ellipse_pt(cx, cy, ri_x, ri_y, aa)
            p_out = ellipse_pt(cx, cy, rm_x, rm_y, aa)
            d.line([p_in, p_out], fill=GOLD+(220,), width=2)
    # rim temporale (doppia pista demo sulle slice attive)
    for i in active[:3]:
        a0, a1, _ = slots[i]
        arc_line(d, cx, cy, RX*0.955, RX*RATIO*0.955, a0+3, a0+(a1-a0)*0.7, fill=GOLD2+(255,), width=5)
        arc_line(d, cx, cy, RX*0.825, RX*RATIO*0.825, a1-3, a1-(a1-a0)*0.5, fill=(190,170,120,255), width=3)
    # bordo esterno oro
    d.ellipse([cx-ro_x-3, cy-ro_y-3, cx+ro_x+3, cy+ro_y+3], outline=GOLD, width=4)
    d.ellipse([cx-ri_x, cy-ri_y, cx+ri_x, cy+ri_y], fill=INK)
    img.alpha_composite(ov)
    draw_hub(img, cx, cy, hub_mode, village_img)
    draw_slice_icons(img, cx, cy, slots, active, seal)
    return img

def card(a, b, label_a, label_b, name):
    W, H = a.size
    c = Image.new('RGBA', (W*2 + 30, H + 40), (8, 10, 18, 255))
    c.paste(a, (0, 40)); c.paste(b, (W+30, 40))
    d = ImageDraw.Draw(c)
    d.text((W//2, 18), label_a, fill=GOLD2, anchor='mm')
    d.text((W + 30 + W//2, 18), label_b, fill=GOLD2, anchor='mm')
    c.convert('RGB').save(f'{OUT}/{name}.png')
    print(name)

base_vill = Image.open(VILLAGE).convert('RGBA')
seal = Image.open(SEAL).convert('RGBA')

act12 = [0,1,2,3,4,5]
act8  = [0,1,2,3,4]
# D-d — slice count
card(draw_disc(12, act12, 'glass', 'inset', base_vill, seal),
     draw_disc(8,  act8,  'glass', 'inset', base_vill, seal),
     'D-d/A: 12 slice x 30deg', 'D-d/B: 8 slice x 45deg', 'fork-Dd-slice')
# D-c — socket vuoti
card(draw_disc(12, act12, 'glass', 'inset', base_vill, seal),
     draw_disc(12, act12, 'engraved', 'inset', base_vill, seal),
     'D-c/A: socket vetro traslucido', 'D-c/B: socket incisi oro', 'fork-Dc-socket')
# D-b — hub
card(draw_disc(12, act12, 'glass', 'inset', base_vill, seal),
     draw_disc(12, act12, 'glass', 'medallion', base_vill, seal),
     'D-b/A: frame + inset villaggio', 'D-b/B: medaglione uniforme', 'fork-Db-hub')
