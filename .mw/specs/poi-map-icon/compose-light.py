#!/usr/bin/env python3
"""Compose the LIGHT-version candidates onto real map crops at contract
sizes + a morph strip (light -> 50% blend -> baptized Zanara) to check the
two-LOD transition reads as the same object.

Output: card/light-masters.png, card/light-dark.png, card/light-light.png,
        card/light-zoom.png, card/light-morph.png
"""
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
GEN = ROOT / "gen"
OUT = ROOT / "card"
OUT.mkdir(exist_ok=True)
TR = Path("/Users/faustoboni/progetti_personali/RPG/test-results/poi-zanara-f0")

SIZES = [16, 20, 24, 32]
BGS = [
    ("dark", TR / "1440x900-sea_west-zmid-crop.png"),
    ("light", TR / "1440x900-snow_peaks-zmid-crop.png"),
]

CANDS = sorted(GEN.glob("L2-light-raw-*.png"))
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
    edge_hues = []
    for x in range(0, w, 24):
        for y in (0, h - 1):
            hh = rgb2hue(*px[x, y][:3])
            if hh >= 0:
                edge_hues.append(hh)
    for y in range(0, h, 24):
        for x in (0, w - 1):
            hh = rgb2hue(*px[x, y][:3])
            if hh >= 0:
                edge_hues.append(hh)
    uniq = []
    for hh in edge_hues:
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
                if mask[y * w + x] or not is_bg(px[x, y]):
                    continue
                if mask[y * w + x - 1] or mask[y * w + x + 1] or mask[(y - 1) * w + x] or mask[(y + 1) * w + x]:
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
    if not bb:
        return im
    return im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))


def paste_center(bg, icon, size):
    ic = icon.copy()
    ic.thumbnail((size, size), Image.LANCZOS)
    x = (bg.width - ic.width) // 2
    y = (bg.height - ic.height) // 2
    bg.paste(ic, (x, y), ic)
    return bg


def fit_to(im, size):
    """Resize so the piece fills `size` px on its longest side, centered on a square canvas."""
    ic = trim(im).copy()
    ic.thumbnail((size, size), Image.LANCZOS)
    cv = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cv.paste(ic, ((size - ic.width) // 2, (size - ic.height) // 2), ic)
    return cv


def blend(a, b, t):
    """Alpha-blend two same-size RGBA canvases."""
    out = a.copy()
    ba = b.copy()
    ba.putalpha(ba.split()[3].point(lambda v: int(v * t)))
    out.alpha_composite(ba)
    return out


def main():
    if not CANDS:
        raise SystemExit("no L2-light-raw-* in gen/")
    keyed = {}
    for p in CANDS:
        name = p.stem.replace("-raw-", "-")
        keyed[name] = trim(key_out(Image.open(p)))
        print("keyed", name, keyed[name].size)
    baptized = trim(Image.open(BAPTIZED).convert("RGBA"))

    # ── masters ──
    labels = list(keyed) + ["Zanara (baptized)"]
    mw = 300
    sheet = Image.new("RGB", (mw * len(labels), 360), (24, 26, 30))
    d = ImageDraw.Draw(sheet)
    items = list(keyed.items()) + [("Zanara (baptized)", baptized)]
    for i, (name, im) in enumerate(items):
        th = im.copy()
        th.thumbnail((mw - 20, 310), Image.LANCZOS)
        sheet.paste(th, (i * mw + (mw - th.width) // 2, 15), th)
        d.text((i * mw + 10, 335), name, fill=(235, 230, 218), font=font(16))
    sheet.save(OUT / "light-masters.png")

    # ── map cards ──
    bgs = {n: Image.open(p).convert("RGB") for n, p in BGS}
    for bname, bg in bgs.items():
        cw, ch = bg.width // len(SIZES), bg.height
        rows = len(keyed) + 1
        card = Image.new("RGB", (bg.width, rows * ch + 30), (18, 20, 24))
        dd = ImageDraw.Draw(card)
        all_rows = list(keyed.items()) + [("Zanara (baptized)", baptized)]
        for ri, (name, im) in enumerate(all_rows):
            for ci, s in enumerate(SIZES):
                cell = bg.copy().resize((cw, ch), Image.LANCZOS)
                cell = paste_center(cell, im, s)
                card.paste(cell, (ci * cw, ri * ch))
            dd.text((8, ri * ch + 6), name, fill=(235, 230, 218), font=font(16))
        for ci, s in enumerate(SIZES):
            dd.text((ci * cw + 8, rows * ch + 6), f"{s}px", fill=(255, 255, 255), font=font(15))
        card.save(OUT / f"light-{bname}.png")

    # ── zoom strip 16/20 x8 on both bgs ──
    ZW = 8
    rows = list(keyed.items()) + [("Zanara (baptized)", baptized)]
    cell_big = []
    for name, im in rows:
        r = []
        for bname, bgp in BGS:
            bg = Image.open(bgp).convert("RGB")
            for s in (16, 20):
                cell = bg.copy()
                cell = paste_center(cell, im, s)
                cx, cy = cell.width // 2, cell.height // 2
                crop = cell.crop((cx - s, cy - s, cx + s, cy + s))
                r.append(crop.resize((crop.width * ZW, crop.height * ZW), Image.NEAREST))
        cell_big.append((name, r))
    w = sum(c.width for c in cell_big[0][1]) + 60
    h = len(cell_big) * (max(16, 20) * ZW + 30) + 20
    sheet = Image.new("RGB", (w, h), (12, 12, 14))
    d = ImageDraw.Draw(sheet)
    for ri, (name, r) in enumerate(cell_big):
        y = ri * (20 * ZW + 30)
        d.text((10, y + 2), name, fill=(220, 210, 180), font=font(15))
        x = 10
        for c in r:
            sheet.paste(c, (x, y + 22))
            x += c.width + 12
    sheet.save(OUT / "light-zoom.png")

    # ── morph strip: light -> blend50 -> baptized, at 64px zoomed x4 and at 20px real ──
    MS = 64
    zb = fit_to(baptized, MS)
    cols = []
    for name, im in keyed.items():
        li = fit_to(im, MS)
        bl = blend(li, zb, 0.55)
        cols.append((name, [li, bl, zb]))
    cellpx = MS * 4
    w = 3 * (cellpx + 12) + 20
    h = len(cols) * (cellpx + 26) + 40
    sheet = Image.new("RGB", (w, h), (14, 15, 18))
    d = ImageDraw.Draw(sheet)
    for ri, (name, frames) in enumerate(cols):
        y = ri * (cellpx + 26) + 8
        d.text((10, y), name + "  →  baptized", fill=(220, 210, 180), font=font(15))
        x = 10
        for f in frames:
            big = f.resize((cellpx, cellpx), Image.NEAREST)
            plaque = Image.new("RGBA", (cellpx, cellpx), (28, 30, 36, 255))
            plaque.alpha_composite(big)
            sheet.paste(plaque.convert("RGB"), (x, y + 22))
            x += cellpx + 12
    d.text((10, h - 22), "cols: light 100% | blend 50% | baptized 100% (64px master x4)", fill=(200, 200, 200), font=font(14))
    sheet.save(OUT / "light-morph.png")
    print("cards done")


if __name__ == "__main__":
    main()
