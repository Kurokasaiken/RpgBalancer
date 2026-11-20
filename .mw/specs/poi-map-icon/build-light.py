#!/usr/bin/env python3
"""Build the LIGHT far-zoom version FROM the production Zanara piece —
Director ruling: same object, less complicated. Engraved ring band ->
smooth solid ring; dome identical; corner gems identical; halo = full
luminous ring at the production rail, colour variants to judge.

Geometry (canvas 1786x1873, centre 892,878 — arc-geometry.json):
  dome outer edge      r ~ 330
  engraved brass band  r ~ 335 .. 420  -> blurred flat ("ring intero")
  piece outer edge     r ~ 416 (points reach ~500 in cardinal sectors)
  halo band            r ~ 425 .. 515  (haloOuterRailPx.quest = 515)

Output: card/light-sheet.png (rows = halo colour variants + baptized ref)
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "card"
TR = Path("/Users/faustoboni/progetti_personali/RPG/test-results/poi-zanara-f0")
LAY = Path("/Users/faustoboni/progetti_personali/RPG/public/assets/ui/hud-real/poi/layers")

CX, CY = 892.49, 878.20
RING_IN, RING_OUT = 332, 420      # engraved annulus to flatten
HALO_IN, HALO_OUT = 425, 513      # production rail band, drawn full ("intero")

SIZES = [16, 24, 32]
BGS = [
    ("mare scura", TR / "1440x900-sea_west-zmid-crop.png"),
    ("terra chiara", TR / "1440x900-snow_peaks-zmid-crop.png"),
]
CELL = 300
CTX = 4

# halo colour candidates — luminous, readable on both bgs, no purple
HALOS = [
    ("halo blu attuale #4d82ff", (77, 130, 255)),
    ("halo teal #2fd4c8", (47, 212, 200)),
    ("halo oro #f2b23e", (242, 178, 62)),
    ("halo avorio #efe2c4", (239, 226, 196)),
    ("halo ghiaccio #7fd4ff", (127, 212, 255)),
]


def font(px):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", px)
    except Exception:
        return ImageFont.load_default()


def load_piece():
    base = Image.open(LAY / "poi-quest-base.webp").convert("RGBA")
    top = Image.open(LAY / "poi-quest-top.webp").convert("RGBA")
    base.alpha_composite(top)
    return base


def annulus_mask(size, r_in, r_out, feather=6):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    d.ellipse((CX - r_out, CY - r_out, CX + r_out, CY + r_out), fill=255)
    d.ellipse((CX - r_in, CY - r_in, CX + r_in, CY + r_in), fill=0)
    return m.filter(ImageFilter.GaussianBlur(feather))


def simplify_piece(im):
    """Blur the engraved annulus only — dome, bezel edges and points keep
    their sharpness; the ring reads 'intero' (solid metal)."""
    m = annulus_mask(im.size, RING_IN, RING_OUT, feather=5)
    # protect the protruding points: they sit OUTSIDE r_out at cardinals —
    # the mask is annular so they are untouched already.
    blurred = im.filter(ImageFilter.GaussianBlur(14))
    out = im.copy()
    out.paste(blurred, (0, 0), m)
    return out


def draw_halo(im, rgb, band_w=None, glow=90):
    """Full luminous ring at production rail + soft outer glow, UNDER the piece."""
    if band_w is None:
        band_w = HALO_OUT - HALO_IN
    r = (HALO_IN + HALO_OUT) / 2
    halo = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(halo)
    d.ellipse((CX - r, CY - r, CX + r, CY + r), outline=(*rgb, 235), width=band_w)
    glow_l = Image.new("RGBA", im.size, (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow_l)
    dg.ellipse((CX - r, CY - r, CX + r, CY + r), outline=(*rgb, glow), width=band_w + 30)
    glow_l = glow_l.filter(ImageFilter.GaussianBlur(22))
    under = Image.new("RGBA", im.size, (0, 0, 0, 0))
    under.alpha_composite(glow_l)
    under.alpha_composite(halo)
    under.alpha_composite(im)
    return under


def trim(im, pad=4):
    bb = im.split()[3].getbbox()
    return im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad))) if bb else im


def cell(bg, icon, s):
    ctx = CTX * s
    cx, cy = bg.width // 2, bg.height // 2
    crop = bg.crop((cx - ctx // 2, cy - ctx // 2, cx + ctx // 2, cy + ctx // 2))
    ic = icon.copy()
    ic.thumbnail((s, s), Image.LANCZOS)
    crop.paste(ic, ((ctx - ic.width) // 2, (ctx - ic.height) // 2), ic)
    return crop.resize((CELL, CELL), Image.NEAREST)


def main():
    piece = load_piece()
    simple = simplify_piece(piece)

    rows = []
    for name, rgb in HALOS:
        rows.append((f"light sempl. + {name}", trim(draw_halo(simple.copy(), rgb))))
    # reference: baptized piece with current far-mode halo colour
    rows.append(("Zanara as-is + halo attuale", trim(draw_halo(piece.copy(), (77, 130, 255)))))
    # save zoomed masters for inspection
    mw = 320
    masters = Image.new("RGB", (mw * len(rows), 400), (24, 26, 30))
    d = ImageDraw.Draw(masters)
    for i, (name, im) in enumerate(rows):
        th = im.copy()
        th.thumbnail((mw - 20, 350), Image.LANCZOS)
        masters.paste(th, (i * mw + (mw - th.width) // 2, 12), th)
        d.text((i * mw + 8, 372), name, fill=(235, 230, 218), font=font(14))
    masters.save(OUT / "light-masters.png")

    bgs = [(n, Image.open(p).convert("RGB")) for n, p in BGS]
    cols = len(SIZES) * len(BGS)
    head_h, rowlab_w, pad = 34, 230, 8
    W = rowlab_w + cols * (CELL + pad) + pad
    H = head_h + len(rows) * (CELL + pad) + pad + 26
    sheet = Image.new("RGB", (W, H), (16, 17, 21))
    d = ImageDraw.Draw(sheet)
    ci = 0
    for bname, _ in bgs:
        for s in SIZES:
            x = rowlab_w + ci * (CELL + pad) + pad
            d.text((x + 4, 8), f"{bname} {s}px", fill=(230, 220, 190), font=font(15))
            ci += 1
    for ri, (name, icon) in enumerate(rows):
        y = head_h + ri * (CELL + pad) + pad
        d.text((pad, y + CELL // 2 - 8), name, fill=(235, 230, 218), font=font(14))
        ci = 0
        for bname, bg in bgs:
            for s in SIZES:
                sheet.paste(cell(bg, icon, s), (rowlab_w + ci * (CELL + pad) + pad, y))
                ci += 1
    d.text((pad, H - 22), "cella = crop mappa (4x la taglia) con il marker alla sua dimensione reale, upscaled NEAREST",
           fill=(160, 158, 150), font=font(13))
    sheet.save(OUT / "light-sheet.png")
    print("saved light-sheet.png + light-masters.png")


if __name__ == "__main__":
    main()
