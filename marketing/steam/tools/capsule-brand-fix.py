#!/usr/bin/env python3
"""capsule-brand-fix.py — applica il pacchetto ratificato R-288 (critica capsule):

  1. halo scuro radiale dietro il logo (il sole dipinto mangia i bordi);
  2. logo authored (placca+sole, alpha nativa) sovrapposto alla versione
     dipinta, con drop shadow reale (sagoma sfocata offset sotto la placca);
  3. vertical_capsule e library_capsule rigenerate su composizione-eroe
     (crop da Header Capsule.png, arte con eroe di spalle);
  4. library_logo 1050x720 riesportato con drop shadow.

Sorgenti:
  KEYART = ~/Downloads/Header Capsule.png   (eroe sulla rupe, logo dipinto)
  LOGO   = marketing/steam/assets/library-logo.png (placca authored con alpha)

Output su marketing/steam/assets/candidates/fixed/ — promuovere in upload/
dopo eye-check. Uso: python3 marketing/steam/tools/capsule-brand-fix.py
"""
import os
from PIL import Image, ImageFilter, ImageChops

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
STEAM = os.path.join(ROOT, 'marketing/steam')
KEYART = os.path.expanduser('~/Downloads/Header Capsule.png')
LOGO = os.path.join(STEAM, 'assets/library-logo.png')
OUT = os.path.join(STEAM, 'assets/candidates/fixed')
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- helpers

def tight_logo(path=LOGO):
    """Placca authored ritagliata sul bbox dell'alpha (>10)."""
    lg = Image.open(path).convert('RGBA')
    a = lg.getchannel('A')
    px = a.load()
    w, h = lg.size
    cols = [x for x in range(w) if any(px[x, y] > 10 for y in range(0, h, 4))]
    rows = [y for y in range(h) if any(px[x, y] > 10 for x in range(0, w, 4))]
    return lg.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))

LOGO_TIGHT = tight_logo()          # 1383x319 circa
LOGO_AR = LOGO_TIGHT.size[0] / LOGO_TIGHT.size[1]

def scaled_logo(target_w):
    tw = int(round(target_w))
    th = int(round(tw / LOGO_AR))
    return LOGO_TIGHT.resize((tw, th), Image.LANCZOS)

def radial_halo(size, cx, cy, rx, ry, peak=0.42):
    """Ellisse radiale nera: alpha `peak` al centro, 0 al bordo."""
    import numpy as np
    hx, hy = size
    yy, xx = np.mgrid[0:hy, 0:hx].astype(np.float32)
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    a = peak * np.clip(1.0 - d, 0.0, 1.0) ** 1.6
    halo = Image.fromarray((a * 255).astype(np.uint8), 'L')
    return halo.filter(ImageFilter.GaussianBlur(18))

def drop_shadow(logo_img, offset_frac=0.06, blur_frac=0.10, opacity=0.78):
    """Ombra: sagoma nera della placca, offset in basso, sfocata."""
    sil = logo_img.getchannel('A').point(lambda v: int(v * opacity))
    black = Image.new('RGBA', logo_img.size, (10, 8, 4, 255))
    black.putalpha(sil)
    pad = int(logo_img.size[1] * (offset_frac + blur_frac) + 20)
    canvas = Image.new('RGBA', (logo_img.size[0] + pad * 2, logo_img.size[1] + pad * 2), (0, 0, 0, 0))
    canvas.paste(black, (pad, pad + int(logo_img.size[1] * offset_frac)), black)
    shadow = canvas.filter(ImageFilter.GaussianBlur(logo_img.size[1] * blur_frac))
    # non scurire la placca stessa: sottrai l'alpha del logo (non offset)
    la = Image.new('L', shadow.size, 0)
    la.paste(logo_img.getchannel('A'), (pad, pad))
    sh_a = shadow.getchannel('A')
    sh_a = ImageChops.subtract(sh_a, la.point(lambda v: int(v * 0.92)))
    shadow.putalpha(sh_a)
    return shadow, pad

def brand(canvas, logo_target_w, cx, cy, halo_peak=0.42, halo_scale=1.28,
          shadow_op=0.78, keep_baked_margin=0.0):
    """Halo + drop shadow + logo authored centrato in (cx, cy)."""
    canvas = canvas.convert('RGBA')
    logo = scaled_logo(logo_target_w)
    lw, lh = logo.size
    lx, ly = int(cx - lw / 2), int(cy - lh / 2)

    halo = radial_halo(canvas.size, cx, cy + lh * 0.10, lw * halo_scale / 2,
                       lh * halo_scale * 1.15, peak=halo_peak)
    dark = Image.new('RGBA', canvas.size, (8, 6, 3, 255))
    dark.putalpha(halo)
    canvas.alpha_composite(dark)

    shadow, pad = drop_shadow(logo, opacity=shadow_op)
    canvas.alpha_composite(shadow, (lx - pad, ly - pad))
    canvas.alpha_composite(logo, (lx, ly))
    return canvas

def blur_band(img, frac=0.24, blur=14):
    """Sfuma la banda alta (copre residui di logo dipinto nei crop nuovi)."""
    img = img.convert('RGBA')
    w, h = img.size
    band_h = int(h * frac)
    top = img.crop((0, 0, w, band_h)).filter(ImageFilter.GaussianBlur(blur))
    mask = Image.new('L', (w, band_h), 0)
    px = mask.load()
    for y in range(band_h):
        v = int(255 * max(0.0, 1.0 - y / band_h) ** 1.4)
        for x in range(w):
            px[x, y] = v
    out = img.copy()
    out.paste(top, (0, 0), mask)
    return out

def blur_region(img, rect, blur=16, feather=0.30):
    """Sfoca `rect` (x0,y0,x1,y1) con bordi sfumati — cancella il logo dipinto."""
    import numpy as np
    img = img.convert('RGBA')
    x0, y0, x1, y1 = rect
    w, h = x1 - x0, y1 - y0
    blurred = img.crop(rect).filter(ImageFilter.GaussianBlur(blur))
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    fx, fy = w * feather, h * feather
    mx = np.clip(np.minimum(xx, w - 1 - xx) / fx, 0, 1)
    my = np.clip(np.minimum(yy, h - 1 - yy) / fy, 0, 1)
    mask = Image.fromarray(((mx * my) * 255).astype(np.uint8), 'L')
    out = img.copy()
    out.paste(blurred, (x0, y0), mask)
    return out

# ---------------------------------------------------------------- jobs

JOBS = [
    # — esistenti: cancella logo dipinto (blur) + halo + logo authored + shadow —
    dict(src='upload/capsules/header_capsule_920x430.png',
         out='header_capsule_920x430.png', erase=(150, 0, 770, 195),
         logo_w=492, cx=460, cy=74, halo_peak=0.40, halo_scale=1.24),
    dict(src='upload/capsules/main_capsule_1232x706.png',
         out='main_capsule_1232x706.png', erase=(190, 10, 1035, 240),
         logo_w=648, cx=612, cy=108, halo_peak=0.40, halo_scale=1.24),
    dict(src='upload/capsules/small_capsule_462x174.png',
         out='small_capsule_462x174.png', erase=(5, 0, 457, 150),
         logo_w=392, cx=231, cy=66, halo_peak=0.44, halo_scale=1.18),
    dict(src='upload/capsules/optional_event_capsule_800x450.png',
         out='optional_event_capsule_800x450.png', erase=(140, 5, 660, 190),
         logo_w=404, cx=400, cy=78, halo_peak=0.40, halo_scale=1.24),
    # — rigenerate su composizione-eroe (crop da Header Capsule.png) —
    dict(crop=(70, 258, 70 + 700, 1024), resize=(748, 896),
         out='vertical_capsule_748x896.png', logo_w=560, cx=374, cy=118,
         halo_peak=0.46, halo_scale=1.22, blur_top=0.20),
    dict(crop=(60, 258, 60 + 540, 1024), resize=(600, 900),
         out='library_capsule_600x900.png', logo_w=452, cx=300, cy=120,
         halo_peak=0.46, halo_scale=1.22, blur_top=0.20),
]

def main():
    keyart = Image.open(KEYART).convert('RGBA')
    print('keyart', keyart.size, '| logo tight', LOGO_TIGHT.size)
    for j in JOBS:
        if 'crop' in j:
            bg = keyart.crop(j['crop']).resize(j['resize'], Image.LANCZOS)
            if j.get('blur_top'):
                bg = blur_band(bg, j['blur_top'])
        else:
            bg = Image.open(os.path.join(STEAM, j['src'])).convert('RGBA')
            if 'erase' in j:
                bg = blur_region(bg, j['erase'], blur=55, feather=0.16)
        out = brand(bg, j['logo_w'], j['cx'], j['cy'],
                    halo_peak=j['halo_peak'], halo_scale=j['halo_scale'])
        dst = os.path.join(OUT, j['out'])
        out.convert('RGB').save(dst)
        print('wrote', dst)

    # library logo standalone con drop shadow (slot Steam overlayed sull'hero)
    canvas = Image.new('RGBA', (1050, 720), (0, 0, 0, 0))
    logo = scaled_logo(980)
    lx, ly = (1050 - logo.size[0]) // 2, (720 - logo.size[1]) // 2 - 8
    shadow, pad = drop_shadow(logo, offset_frac=0.10, blur_frac=0.14, opacity=0.85)
    canvas.alpha_composite(shadow, (lx - pad, ly - pad))
    canvas.alpha_composite(logo, (lx, ly))
    canvas.save(os.path.join(OUT, 'library_logo_1050x720.png'))
    print('wrote', os.path.join(OUT, 'library_logo_1050x720.png'))

if __name__ == '__main__':
    main()
