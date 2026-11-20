#!/usr/bin/env python3
"""Restyle the PRODUCTION Zanara marker (mounted composite) — PIL-only passes
that implement GPT's diagnosis: dome too dominant, rim too thin, south tail
not distinct enough. No AI edit (all edit channels are dry); these are real
edits on the actual mounted asset, then real-size map cards.

Output: card/restyle-masters.png + card/restyle-dark.png + restyle-light.png
"""
import colorsys
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "card"
TR = Path("/Users/faustoboni/progetti_personali/RPG/test-results/poi-zanara-f0")
SRC = Path("/tmp/poi-quest-composite.png")  # base+top alpha-composited, RGBA

CX, CY = 892.49, 878.20           # arc-geometry.json centre
DOME_R = 705.0                    # enamel dome radius (visual, inside brass bezel)
POINTS = {                        # sapphire dagger centres (measured on canvas)
    "N": (892, 320, 150),
    "E": (1495, 880, 150),
    "W": (290, 880, 150),
}

SIZES = [20, 24, 32, 48]
BGS = [
    ("dark", TR / "1440x900-sea_west-zmid-crop.png"),
    ("light", TR / "1440x900-snow_peaks-zmid-crop.png"),
]


def load_src():
    if not SRC.exists():
        d = Path("/Users/faustoboni/progetti_personali/RPG/public/assets/ui/hud-real/poi/layers")
        base = Image.open(d / "poi-quest-base.webp").convert("RGBA")
        top = Image.open(d / "poi-quest-top.webp").convert("RGBA")
        base.alpha_composite(top)
        base.save(SRC)
    return Image.open(SRC).convert("RGBA")


def radial_mask(size, cx, cy, r, feather=30):
    m = Image.new("L", size, 0)
    dr = ImageDraw.Draw(m)
    dr.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather))


def hls_edit(im: Image.Image, mask: Image.Image, dh=0.0, dl=0.0, ds=0.0, gain=1.0):
    """Shift HLS of pixels under mask (255=full)."""
    a = np.asarray(im).astype(np.float32) / 255.0
    m = (np.asarray(mask).astype(np.float32) / 255.0)[..., None]
    out = a.copy()
    h, w = a.shape[:2]
    flat = a.reshape(-1, 4)
    for i in range(flat.shape[0]):
        r, g, b, al = flat[i]
        if al <= 0:
            continue
        hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
        hh = (hh + dh) % 1.0
        ll = min(1.0, max(0.0, ll + dl))
        ss = min(1.0, max(0.0, ss * gain + ds))
        nr, ng, nb = colorsys.hls_to_rgb(hh, ll, ss)
        out.reshape(-1, 4)[i, :3] = nr, ng, nb
    blended = a * (1 - m) + out * m
    return Image.fromarray((blended * 255).astype(np.uint8), "RGBA")


def contrast_gain(im, mask, sat=1.0, light=1.0):
    a = np.asarray(im).astype(np.float32) / 255.0
    m = (np.asarray(mask).astype(np.float32) / 255.0)[..., None]
    mean = a[..., :3].mean(axis=2, keepdims=True)
    boost = np.clip(mean + (a[..., :3] - mean) * 1.15, 0, 1)
    h, w = a.shape[:2]
    out = a.copy()
    flat = boost.reshape(-1, 3)
    for i in range(h * w):
        r, g, b = flat[i]
        hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
        ss = min(1.0, ss * sat)
        ll = min(1.0, ll * light)
        flat[i] = colorsys.hls_to_rgb(hh, ll, ss)
    out[..., :3] = boost.reshape(h, w, 3)
    return Image.fromarray((np.clip(a * (1 - m) + out * m, 0, 1) * 255).astype(np.uint8), "RGBA")


def dim_points(im, centres, sat_gain=0.5, light_gain=0.85):
    for cx, cy, r in centres:
        m = radial_mask(im.size, cx, cy, r, feather=40)
        im = hls_edit(im, m, dl=-(1 - light_gain) * 0.4, ds=0, gain=sat_gain)
    return im


def ivory_bezel(im, r=DOME_R - 10, width=10, alpha=150):
    """Ivory edge ON the dome's outer rim — clipped to the piece's own alpha so
    it can never float over transparent space."""
    ring = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ring)
    d.ellipse((CX - r, CY - r, CX + r, CY + r), outline=(238, 226, 200, alpha), width=width)
    ring = ring.filter(ImageFilter.GaussianBlur(2))
    src_a = np.asarray(im.split()[3]).astype(np.float32) / 255.0
    ra = np.asarray(ring).astype(np.float32)
    ra[..., 3] *= src_a
    ring = Image.fromarray(ra.astype(np.uint8), "RGBA")
    im.alpha_composite(ring)
    return im


def outer_stroke(im, grow=10, blur=4, alpha=170):
    a = im.split()[3].filter(ImageFilter.MaxFilter(grow * 2 + 1)).filter(ImageFilter.GaussianBlur(blur))
    under = Image.new("RGBA", im.size, (0, 0, 0, 0))
    navy = Image.new("RGBA", im.size, (16, 20, 34, 255))
    under.paste(navy, (0, 0), a.point(lambda v: int(v * alpha / 255)))
    canvas = under.copy()
    canvas.alpha_composite(im)
    return canvas


def make_variants():
    src = load_src()
    dome = radial_mask(src.size, CX, CY, DOME_R, feather=25)
    anti_dome = dome.point(lambda v: 255 - v)

    variants = []

    # R0 — untouched production marker, for direct comparison
    variants.append(("R0 produzione (as-is)", src))

    # R1 — smalto profondo: dome −30% light, −20% sat; minor gems dimmed
    v = hls_edit(src, dome, dh=-0.01, dl=-0.10, gain=0.80)
    v = dim_points(v, list(POINTS.values()), sat_gain=0.55)
    variants.append(("R1 smalto profondo", v))

    # R2 — bezel avorio: dome near-obsidian + ivory ring at bezel
    v = hls_edit(src, dome, dh=-0.02, dl=-0.16, gain=0.70)
    v = dim_points(v, list(POINTS.values()), sat_gain=0.6)
    v = ivory_bezel(v)
    variants.append(("R2 bezel avorio", v))

    # R3 — metallo primo: slight dome dim, brass boosted, soft dark outline
    v = hls_edit(src, dome, dl=-0.06, gain=0.9)
    v = contrast_gain(v, anti_dome, sat=1.12, light=1.05)
    v = dim_points(v, list(POINTS.values()), sat_gain=0.7)
    v = outer_stroke(v)
    variants.append(("R3 metallo primo", v))

    return variants


def trim(im, pad=6):
    bb = im.split()[3].getbbox()
    return im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad))) if bb else im


def paste_center(bg, icon, size):
    ic = icon.copy()
    ic.thumbnail((size, size), Image.LANCZOS)
    x = (bg.width - ic.width) // 2
    y = (bg.height - ic.height) // 2
    bg.paste(ic, (x, y), ic)
    return bg


def label(draw, xy, text, size=18):
    try:
        from PIL import ImageFont
        f = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
    except Exception:
        f = ImageFont.load_default()
    draw.text(xy, text, fill=(235, 230, 218), font=f)


def main():
    variants = [(name, trim(im)) for name, im in make_variants()]

    # ── masters strip (zoom) ──
    mw = 380
    masters = Image.new("RGB", (mw * len(variants), 430), (24, 26, 30))
    d = ImageDraw.Draw(masters)
    for i, (name, im) in enumerate(variants):
        thumb = im.copy()
        thumb.thumbnail((mw - 20, 380), Image.LANCZOS)
        x = i * mw + (mw - thumb.width) // 2
        masters.paste(thumb, (x, 20), thumb)
        label(d, (i * mw + 12, 405), name, 17)
    masters.save(OUT / "restyle-masters.png")

    # ── real-size rows: variants × sizes on each bg ──
    for bgname, bgp in BGS:
        bg = Image.open(bgp).convert("RGB")
        cell_w, cell_h = bg.width // len(SIZES), bg.height
        rows = len(variants)
        card = Image.new("RGB", (bg.width, rows * cell_h + 30), (18, 20, 24))
        for ri, (name, im) in enumerate(variants):
            for ci, s in enumerate(SIZES):
                cell = bg.copy().resize((cell_w, cell_h), Image.LANCZOS)
                cell = paste_center(cell, im, s)
                card.paste(cell, (ci * cell_w, ri * cell_h))
            dd = ImageDraw.Draw(card)
            label(dd, (8, ri * cell_h + 6), name, 16)
        dd = ImageDraw.Draw(card)
        for ci, s in enumerate(SIZES):
            label(dd, (ci * cell_w + 8, rows * cell_h + 6), f"{s}px", 15)
        card.save(OUT / f"restyle-{bgname}.png")

    # ── zoom strip 20/24px ×8 on both bgs ──
    zcells = []
    for name, im in variants:
        row = []
        for bgname, bgp in BGS:
            for s in (20, 24):
                cell = Image.open(bgp).convert("RGB").resize((160, 160), Image.LANCZOS)
                cell = paste_center(cell, im, s)
                row.append(cell.resize((480, 480), Image.NEAREST))
        zcells.append((name, row))
    w = sum(c.width for c in zcells[0][1]) + 20
    h = 480 * len(zcells) + 30 * len(zcells) + 10
    z = Image.new("RGB", (w, h), (18, 20, 24))
    dd = ImageDraw.Draw(z)
    y = 10
    for name, row in zcells:
        label(dd, (10, y), name, 15)
        y += 24
        x = 10
        for c in row:
            z.paste(c, (x, y))
            x += c.width
        y += 480
    z.save(OUT / "restyle-zoom.png")
    print("done:", [p.name for p in OUT.glob("restyle-*.png")])


if __name__ == "__main__":
    main()
