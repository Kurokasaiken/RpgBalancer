#!/usr/bin/env python3
"""Single clean comparison sheet for the LIGHT-version candidates.

Layout: rows = candidates + baptized Zanara; columns = sizes (16/24/32px)
x backgrounds (dark/light). Each cell = a SMALL map crop centered on the
marker pasted at its TRUE raster size, upscaled NEAREST so real pixels
show. One sheet, no ambiguity.

Output: card/light-sheet.png
"""
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
GEN = ROOT / "gen"
OUT = ROOT / "card"
TR = Path("/Users/faustoboni/progetti_personali/RPG/test-results/poi-zanara-f0")

SIZES = [16, 24, 32]
BGS = [
    ("mare scura", TR / "1440x900-sea_west-zmid-crop.png"),
    ("terra chiara", TR / "1440x900-snow_peaks-zmid-crop.png"),
]
CELL = 300          # display px per cell
CTX = 4             # map crop = marker size * CTX (context radius)

BAPTIZED = Path("/tmp/poi-quest-composite.png")


def font(px):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", px)
    except Exception:
        return ImageFont.load_default()


def rgb2hue(r, g, b):
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn:
        return -1.0
    d = mx - mn
    if mx == r:
        h = ((g - b) / d) % 6
    elif mx == g:
        h = (b - r) / d + 2
    else:
        h = (r - g) / d + 4
    return h * 60.0


def hue_dist(a, b):
    d = abs(a - b) % 360.0
    return min(d, 360.0 - d)


def key_out(im, hue_tol=34.0, inset=30):
    im = im.convert("RGBA")
    if inset:
        im = im.crop((inset, inset, im.width - inset, im.height - inset))
    w, h = im.size
    px = im.load()
    hues = []
    for x in range(0, w, 24):
        for y in (0, h - 1):
            hh = rgb2hue(*px[x, y][:3])
            if hh >= 0:
                hues.append(hh)
    for y in range(0, h, 24):
        for x in (0, w - 1):
            hh = rgb2hue(*px[x, y][:3])
            if hh >= 0:
                hues.append(hh)
    uniq = []
    for hh in hues:
        if all(hue_dist(hh, u) > 40 for u in uniq):
            uniq.append(hh)

    def is_bg(p):
        if p[3] == 0:
            return False
        hh = rgb2hue(*p[:3])
        if hh < 0:
            return False
        mx, mn = max(p[:3]), min(p[:3])
        sat = (mx - mn) / mx if mx else 0
        if sat < 0.10:
            return False
        return any(hue_dist(hh, u) <= hue_tol for u in uniq)

    mask = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(px[x, y]) and not mask[y * w + x]:
                mask[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(px[x, y]) and not mask[y * w + x]:
                mask[y * w + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not mask[ny * w + nx] and is_bg(px[nx, ny]):
                mask[ny * w + nx] = 1
                q.append((nx, ny))
    for _ in range(2):
        grew = []
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if not mask[y * w + x] and is_bg(px[x, y]) and (
                    mask[y * w + x - 1] or mask[y * w + x + 1] or mask[(y - 1) * w + x] or mask[(y + 1) * w + x]
                ):
                    grew.append(y * w + x)
        for i in grew:
            mask[i] = 1
        if not grew:
            break
    for y in range(h):
        for x in range(w):
            if mask[y * w + x]:
                px[x, y] = (0, 0, 0, 0)
    return im


def trim(im, pad=4):
    bb = im.split()[3].getbbox()
    return im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad))) if bb else im


def cell(bg, icon, s):
    """Map crop of CTX*s px centred, marker at true s px, upscaled to CELL."""
    ctx = CTX * s
    cx, cy = bg.width // 2, bg.height // 2
    crop = bg.crop((cx - ctx // 2, cy - ctx // 2, cx + ctx // 2, cy + ctx // 2))
    ic = icon.copy()
    ic.thumbnail((s, s), Image.LANCZOS)
    crop.paste(ic, ((ctx - ic.width) // 2, (ctx - ic.height) // 2), ic)
    return crop.resize((CELL, CELL), Image.NEAREST)


def main():
    keyed = {}
    for p in sorted(GEN.glob("L3-halo-raw-*.png")):
        name = p.stem.replace("-raw-", "-")
        keyed[name] = trim(key_out(Image.open(p)))
    rows = list(keyed.items()) + [("Zanara battezzato", trim(Image.open(BAPTIZED).convert("RGBA")))]

    bgs = [(n, Image.open(p).convert("RGB")) for n, p in BGS]
    cols = len(SIZES) * len(BGS)
    head_h, rowlab_w, pad = 34, 170, 8
    W = rowlab_w + cols * (CELL + pad) + pad
    H = head_h + len(rows) * (CELL + pad) + pad + 26
    sheet = Image.new("RGB", (W, H), (16, 17, 21))
    d = ImageDraw.Draw(sheet)

    # column headers: bg group + size
    ci = 0
    for bname, _ in bgs:
        for s in SIZES:
            x = rowlab_w + ci * (CELL + pad) + pad
            d.text((x + 4, 8), f"{bname} {s}px", fill=(230, 220, 190), font=font(15))
            ci += 1

    for ri, (name, icon) in enumerate(rows):
        y = head_h + ri * (CELL + pad) + pad
        d.text((pad, y + CELL // 2 - 8), name, fill=(235, 230, 218), font=font(15))
        ci = 0
        for bname, bg in bgs:
            for s in SIZES:
                c = cell(bg, icon, s)
                x = rowlab_w + ci * (CELL + pad) + pad
                sheet.paste(c, (x, y))
                ci += 1

    d.text((pad, H - 22), "cella = crop mappa (4× la taglia) con il marker alla sua dimensione reale, upscaled NEAREST — i pixel che vedi sono quelli veri",
           fill=(160, 158, 150), font=font(13))
    sheet.save(OUT / "light-sheet.png")
    print("saved light-sheet.png", sheet.size)


if __name__ == "__main__":
    main()
