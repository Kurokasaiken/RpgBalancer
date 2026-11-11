#!/usr/bin/env python3
"""compose-card.py — PLAN-117 T1.2: composite the generated Zanara POI
directions onto real mappa2 captures at production sizes.

For each direction (A/B/C) the raw Gemini render is keyed off its flat
navy background (edge flood-fill, tolerance-based), trimmed, and pasted
onto 400x400 map crops at the four contract sizes (32/44/55/69 px),
in colour and in grayscale. Output: one comparison sheet per map
background + a clean grid of the keyed markers.
"""
from PIL import Image, ImageDraw, ImageFont
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TR = Path('/Users/faustoboni/progetti_personali/RPG/test-results/poi-zanara-f0')
OUT = ROOT / 'card'
OUT.mkdir(exist_ok=True)

SIZES = [32, 44, 55, 69]
BACKGROUNDS = [
    ('village-zmid', TR / '1440x900-village-zmid-crop.png'),
    ('canyons-zfloor', TR / '1440x900-red_canyons-zfloor-crop.png'),
]
DIRS = [
    ('A', 'smalto smeraldo', ROOT / 'gen/A/raw-1.png'),
    ('B', 'oro inciso', ROOT / 'gen/B/raw-2.png'),
    ('C', 'gem heart', ROOT / 'gen/C/raw-3.png'),
]


def key_out(im: Image.Image, tol: int = 46) -> Image.Image:
    """Alpha-key the flat background via BFS flood fill from the edges."""
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    bg = px[0, 0][:3]

    def near(p):
        return sum(abs(p[i] - bg[i]) for i in range(3)) <= tol * 3

    mask = bytearray(w * h)  # 1 = background
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near(px[x, y][:3]) and not mask[y * w + x]:
                mask[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if near(px[x, y][:3]) and not mask[y * w + x]:
                mask[y * w + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not mask[ny * w + nx] and near(px[nx, ny][:3]):
                mask[ny * w + nx] = 1
                q.append((nx, ny))

    # soften the keyed edge by 1px on the mask border
    for y in range(h):
        for x in range(w):
            if mask[y * w + x]:
                px[x, y] = (*px[x, y][:3], 0)

    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im


def paste_marker(bg: Image.Image, marker: Image.Image, size: int, cx: int, cy: int) -> Image.Image:
    m = marker.copy()
    m.thumbnail((size, size), Image.LANCZOS)
    out = bg.copy()
    out.paste(m, (cx - m.width // 2, cy - m.height // 2), m)
    return out


def sheet(bg_path: Path, gray: bool) -> Image.Image:
    bg = Image.open(bg_path).convert('RGBA')
    if gray:
        bg = bg.convert('L').convert('RGBA')
    cell_w, cell_h = bg.width + 12, bg.height + 34
    cols, rows = len(SIZES) + 1, len(DIRS) + 1
    W, H = 150 + cols * cell_w, 40 + rows * cell_h
    canvas = Image.new('RGBA', (W, H), (16, 18, 24, 255))
    d = ImageDraw.Draw(canvas)
    d.text((14, 12), f"{'grayscale ' if gray else ''}{bg_path.stem}", fill=(220, 220, 220))
    for j, sz in enumerate(SIZES):
        d.text((150 + j * cell_w + cell_w // 2 - 12, 22), f'{sz}px', fill=(200, 200, 200))
    for i, (did, dname, mpath) in enumerate(DIRS):
        d.text((14, 40 + i * cell_h + cell_h // 2 - 8), f'{did} {dname}', fill=(235, 210, 140))
        # reference: full-size keyed marker in col 0
        mk_full = key_out(Image.open(mpath))
        ref = mk_full.copy()
        ref.thumbnail((cell_w - 20, cell_h - 40), Image.LANCZOS)
        canvas.paste(ref, (150 - cell_w // 2 - ref.width // 2 + 60, 40 + i * cell_h + (cell_h - 30 - ref.height) // 2), ref)
        for j, sz in enumerate(SIZES):
            tile = paste_marker(bg, mk_full, sz, bg.width // 2, bg.height // 2)
            x, y = 150 + j * cell_w, 40 + i * cell_h
            canvas.paste(tile, (x, y))
            d.rectangle([x, y, x + bg.width - 1, y + bg.height - 1], outline=(70, 70, 80))
    return canvas


def grid_clean() -> Image.Image:
    """Plain grid: keyed markers at every size on navy — shape/readability check."""
    cell = 110
    W = 120 + (len(SIZES) + 1) * cell
    H = 40 + len(DIRS) * cell
    c = Image.new('RGBA', (W, H), (10, 22, 34, 255))
    d = ImageDraw.Draw(c)
    for j, sz in enumerate(SIZES):
        d.text((170 + j * cell + cell // 2 - 14, 14), f'{sz}px', fill=(200, 200, 200))
    for i, (did, dname, mp) in enumerate(DIRS):
        d.text((14, 40 + i * cell + cell // 2 - 6), f'{did} {dname}', fill=(235, 210, 140))
        mk = key_out(Image.open(mp))
        for j, sz in enumerate(SIZES):
            m = mk.copy()
            m.thumbnail((sz, sz), Image.LANCZOS)
            c.paste(m, (170 + j * cell + cell // 2 - m.width // 2, 40 + i * cell + cell // 2 - m.height // 2), m)
        big = mk.copy()
        big.thumbnail((96, 96), Image.LANCZOS)
        c.paste(big, (W - cell + cell // 2 - big.width // 2, 40 + i * cell + cell // 2 - big.height // 2), big)
    return c


if __name__ == '__main__':
    grid_clean().convert('RGB').save(OUT / 'grid-clean.png')
    for name, bp in BACKGROUNDS:
        for gray in (False, True):
            f = OUT / f"card-{name}{'-gray' if gray else ''}.png"
            sheet(bp, gray).convert('RGB').save(f)
            print(f)
    print(OUT / 'grid-clean.png')
