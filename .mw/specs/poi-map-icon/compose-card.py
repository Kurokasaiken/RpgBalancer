#!/usr/bin/env python3
"""compose-card.py — PLAN-125 Fase-4a POI: composite the keyed brass marker
candidates onto real mappa2 captures at contract sizes.

Keying: FLUX backgrounds are magenta-family gradients (+ occasional drop
shadow). Edge flood-fill on the sampled corner hue, tolerance-scaled; then a
hue-band sweep cleans remaining pink/shadow islands connected to the border.

Outputs (in card/):
  masters.png       — keyed candidates on a flat dark plaque, labelled.
  card-dark.png     — per candidate: 16/20/24/32 px on a dark map crop.
  card-light.png    — same on a light map crop.
  zoom-small.png    — 16 and 20 px pastes enlarged x8 nearest (silhouette check).
"""
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

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

CANDS = [
    ("A0 fermaglio", GEN / "A-fermaglio-raw-0.png"),
    ("A1 fermaglio", GEN / "A-fermaglio-raw-1.png"),
    ("B0 sigillo", GEN / "B-sigillo-ottone-raw-0.png"),
    ("B1 sigillo", GEN / "B-sigillo-ottone-raw-1.png"),
    ("C0 stella enamel(off-brief)", GEN / "C-stella-raw-0.png"),
    ("Co0 stella ottone", GEN / "C-stella-ottone-raw-0.png"),
    ("Co1 stella ottone", GEN / "C-stella-ottone-raw-1.png"),
]


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


def key_out(im: Image.Image, hue_tol: float = 34.0, inset: int = 30) -> Image.Image:
    """Edge-flood key tolerant to gradients: BFS from the border over pixels
    whose hue is within hue_tol of ANY edge-sampled hue, whatever the value
    (catches magenta gradient + cast shadow; and a teal bg for Co1 — its
    interior verdigris is not edge-connected, so it survives). A pre-crop of
    `inset` px drops torn-edge border artefacts. Then one fringe pass keys
    edge-adjacent pixels still in the band."""
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
    # cluster: keep unique hues (>40° apart)
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
    # fringe pass: key band-pixels that touch the mask (antialiased halo)
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


def trim(im: Image.Image, pad: int = 2) -> Image.Image:
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad)
    y1 = min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def paste_center(bg: Image.Image, icon: Image.Image, size: int):
    ic = icon.resize((size, size), Image.LANCZOS)
    x = (bg.width - size) // 2
    y = (bg.height - size) // 2
    bg.paste(ic, (x, y), ic)


def font(sz=22):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", sz)
    except OSError:
        return ImageFont.load_default()


keyed = {}
for label, p in CANDS:
    if not p.exists():
        print("skip missing", label)
        continue
    k = trim(key_out(Image.open(p)))
    keyed[label] = k
    k.save(OUT / f"keyed-{label.split()[0]}.png")
    print("keyed", label, k.size)

PLAQUE = (24, 30, 34)

# ── masters sheet ────────────────────────────────────────────────────────
MW, MH = 220, 260
cols = len(keyed)
sheet = Image.new("RGB", (cols * MW, MH + 40), (18, 18, 20))
d = ImageDraw.Draw(sheet)
for i, (label, im) in enumerate(keyed.items()):
    tile = Image.new("RGB", (MW, MH), PLAQUE)
    s = 180
    ic = im.resize((s, s), Image.LANCZOS)
    tile.paste(ic, ((MW - s) // 2, (MH - s) // 2), ic)
    sheet.paste(tile, (i * MW, 0))
    d.text((i * MW + 8, MH + 8), label, fill=(230, 220, 190), font=font(18))
sheet.save(OUT / "masters.png")

# ── map cards: per bg, rows = candidates, cols = sizes ───────────────────
for bname, bpath in BGS:
    bg0 = Image.open(bpath).convert("RGB")
    rows = len(keyed)
    CW, CH = bg0.width, bg0.height  # 400x400 crops
    sheet = Image.new("RGB", (len(SIZES) * CW, rows * CH + 40), (14, 14, 16))
    d = ImageDraw.Draw(sheet)
    for r, (label, im) in enumerate(keyed.items()):
        for c, sz in enumerate(SIZES):
            cell = bg0.copy()
            paste_center(cell, im, sz)
            sheet.paste(cell, (c * CW, r * CH))
        d.text((6, rows * CH + 10), "rows: " + " | ".join(keyed.keys()) if r == 0 else "", fill=(200, 200, 200), font=font(16))
    # column headers on top-left of each cell
    for c, sz in enumerate(SIZES):
        d.text((c * CW + 8, 6), f"{sz}px", fill=(255, 255, 255), font=font(20))
    sheet.save(OUT / f"card-{bname}.png")

# ── zoom strip: 16/20 px enlarged x8 on dark+light ───────────────────────
ZW = 8
small = [16, 20]
sw = len(small) * 2 * (max(small) * ZW + 20)
sh = len(keyed) * (max(small) * ZW + 30)
sheet = Image.new("RGB", (sw, sh + 30), (12, 12, 14))
d = ImageDraw.Draw(sheet)
bgs = {n: Image.open(p).convert("RGB") for n, p in BGS}
for r, (label, im) in enumerate(keyed.items()):
    x = 10
    for bn, bg in bgs.items():
        for sz in small:
            cell = bg.copy()
            paste_center(cell, im, sz)
            cx, cy = cell.width // 2, cell.height // 2
            crop = cell.crop((cx - sz, cy - sz, cx + sz, cy + sz))
            big = crop.resize((crop.width * ZW, crop.height * ZW), Image.NEAREST)
            sheet.paste(big, (x, r * (max(small) * ZW + 30) + 20))
            x += big.width + 12
    d.text((10, r * (max(small) * ZW + 30) + 2), label, fill=(220, 210, 180), font=font(16))
d.text((10, sh + 4), "per row: dark 16/20 · light 16/20 (x8)", fill=(200, 200, 200), font=font(14))
sheet.save(OUT / "zoom-small.png")
print("cards done")
