#!/usr/bin/env python3
"""Composite the baptized POI (job green / quest sapphire) onto real mappa2 crops.

Purpose: Director ruling sheets for PLAN-117 handoff §5.6 (quest arc colour)
and §5.7 (urgency red-shift threshold). Composes ONLY from the tracked webp
assets + arc-geometry.json (handoff: layers must be reloaded from files).

Geometry: canvas 1786x1873, ring centre + radii from arc-geometry.json.
Work happens in a 1500x1500 region around the ring centre (piece 1034 +
glow 1342 both fit). CW fill from 12 = work (job); remaining arc anchored
CCW from 12 = deadline drain (quest). Meniscus ~6 deg at channel centre.
Urgency: perceptual (OKLCH) ramp family -> #e8553a near the tip at 12.
"""
import json, os, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
while not os.path.exists(os.path.join(ROOT, 'package.json')):
    ROOT = os.path.dirname(ROOT)
os.chdir(ROOT)

POI = 'public/assets/ui/hud-real/poi/'
LAY = POI + 'layers/'
F0 = 'test-results/poi-zanara-f0/'
OUT = 'test-results/poi-arc-ruling-2026-11-12/'
PIECE_W = 1034  # canvas px — alpha bbox width of poi-green-base (piece incl. punte)
REG = 1500      # working region side (canvas px)

geo = json.load(open(LAY + 'arc-geometry.json'))
CXf, CYf = geo['centre']
RR = geo['ringRadius']
R_IN, R_OUT = geo['innerRadius'], geo['outerRadius']
RX = int(round(CXf)) - REG // 2
RY = int(round(CYf)) - REG // 2
CX = CXf - RX   # ring centre in region coords
CY = CYf - RY

def load(p):
    im = np.array(Image.open(p).convert('RGBA'), dtype=np.float32)
    return im[RY:RY + REG, RX:RX + REG]

glow = load(POI + 'poi-glow-gold.webp')
mask = load(LAY + 'poi-arc-mask.webp')
tube = load(LAY + 'poi-arc-tube.webp')
inc  = load(LAY + 'poi-arc-inc.webp')
top  = load(LAY + 'poi-arc-top.webp')
gbase = load(LAY + 'poi-green-base.webp')
quest_frame = np.array(Image.open(POI + 'poi-quest-frame.webp').convert('RGBA'), dtype=np.float32)
icon = np.array(Image.open(POI + 'poi-icon-logs.webp').convert('RGBA'), dtype=np.float32)

H = W = REG
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dx, dy = xx - CX, CY - yy
ANG = (np.degrees(np.arctan2(dx, dy)) + 360.0) % 360.0   # 0 = 12, clockwise
RN = np.hypot(dx, dy) / RR
print('assets loaded', flush=True)

# ---- quest frame registration: scale+offset its alpha onto the gbase silhouette ----
ref_a = (gbase[..., 3] > 16).astype(np.uint8)
ref_small = ref_a[::2, ::2]
qb = np.array(Image.fromarray(quest_frame.astype(np.uint8)).resize(
    (quest_frame.shape[1] // 2, quest_frame.shape[0] // 2), Image.LANCZOS), dtype=np.float32)
best = None
for s in np.linspace(1.10, 1.40, 61):   # scale on half-res quest (~422px -> ~517 = half of piece 1034)
    nw, nh = max(1, int(qb.shape[1] * s)), max(1, int(qb.shape[0] * s))
    ra = (np.array(Image.fromarray(qb.astype(np.uint8)).resize((nw, nh), Image.LANCZOS),
                   dtype=np.float32)[..., 3] > 16).astype(np.uint8)
    res = cv2.matchTemplate(ref_small, ra, cv2.TM_CCORR)
    _, mx, _, loc = cv2.minMaxLoc(res)
    union = float(ref_small.sum() + ra.sum() - mx)
    iou = mx / union if union else 0
    if best is None or iou > best[0]:
        best = (iou, s, loc[0], loc[1])
iou, s2, ox2, oy2 = best
# paste quest at full res: same scale factor on the full-res frame, offset x2
sf = s2
nw, nh = int(quest_frame.shape[1] * sf), int(quest_frame.shape[0] * sf)
QR = np.array(Image.fromarray(quest_frame.astype(np.uint8)).resize((nw, nh), Image.LANCZOS), dtype=np.float32)
qox, qoy = ox2 * 2, oy2 * 2
quest_canvas = np.zeros((H, W, 4), dtype=np.float32)
x0d, y0d = max(qox, 0), max(qoy, 0)
x1d, y1d = min(qox + nw, W), min(qoy + nh, H)
if x1d > x0d and y1d > y0d:
    quest_canvas[y0d:y1d, x0d:x1d] = QR[y0d - qoy:y1d - qoy, x0d - qox:x1d - qox]
print(f'quest registration: IoU={iou:.3f} scale={sf:.3f} offset=({qox},{qoy})', flush=True)

# ---- OKLCH ----
def _srgb2oklch(rgb):
    c = np.clip(np.asarray(rgb, dtype=np.float64), 0, 1)
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    l = lin @ np.array([0.4122214708, 0.5363325363, 0.0514459929])
    m = lin @ np.array([0.2119034982, 0.6806995451, 0.1073969566])
    s = lin @ np.array([0.0883024619, 0.2817188376, 0.6299787005])
    l, m, s = np.cbrt(l), np.cbrt(m), np.cbrt(s)
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    return np.array([L, np.hypot(A, B), np.degrees(np.arctan2(B, A)) % 360])

def _oklch2srgb(lch):
    a = np.asarray(lch, dtype=np.float64)
    L, C, h = a[..., 0], a[..., 1], a[..., 2]
    A = C * np.cos(np.radians(h)); B = C * np.sin(np.radians(h))
    l = L + 0.3963377774 * A + 0.2158037573 * B
    m = L - 0.1055613458 * A - 0.0638541728 * B
    s = L - 0.0894841775 * A - 1.2914855480 * B
    l, m, s = l ** 3, m ** 3, s ** 3
    rgb = np.stack([
        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s], axis=-1)
    gam = np.where(rgb <= 0.0031308, 12.92 * rgb, 1.055 * np.clip(rgb, 0, None) ** (1 / 2.4) - 0.055)
    return np.clip(gam, 0, 1)

def lerp_oklch(c0_255, c1_255, t):
    a = _srgb2oklch(np.asarray(c0_255) / 255.0)
    b = _srgb2oklch(np.asarray(c1_255) / 255.0)
    t = np.asarray(t)
    dh = ((b[2] - a[2] + 180) % 360) - 180
    lch = np.stack([a[0] + (b[0] - a[0]) * t,
                    a[1] + (b[1] - a[1]) * t,
                    (a[2] + dh * t) % 360], axis=-1)
    return _oklch2srgb(lch) * 255.0

FAMILY_GREEN = (0x22, 0x6a, 0x40)
URGENT_RED = (0xe8, 0x55, 0x3a)
MENIS = 6.0 * np.sin(np.pi * np.clip((RN - R_IN) / (R_OUT - R_IN), 0, 1))
CHMASK = mask[..., 3] > 60
SHADE = tube[..., 1] / 255.0

def arc_span(kind, frac):
    if frac <= 0:
        return np.zeros((H, W), bool)
    if frac >= 1:
        return CHMASK
    if kind == 'job':
        fill = ANG <= frac * 360 + MENIS
    else:
        fill = ANG >= 360 - frac * 360 - MENIS
    return fill & CHMASK

ICON_IW = int(RR * 0.66)
ICON_IH = int(icon.shape[0] * ICON_IW / icon.shape[1])
ICON = np.array(Image.fromarray(icon.astype(np.uint8)).resize((ICON_IW, ICON_IH), Image.LANCZOS), dtype=np.float32)
COLLAR_K = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (43, 43))

def compose(frame_rgba, family_rgb, kind, frac, red_T=None, red_mode='tip', red_fix_deg=None):
    comp = np.zeros((H, W, 4), dtype=np.float32)
    sil = (frame_rgba[..., 3] > 30).astype(np.float32)
    ring = np.clip(cv2.dilate(sil, COLLAR_K) - sil, 0, 1)[..., None]
    comp[..., :3] = np.array([6, 12, 20], dtype=np.float32) * ring
    comp[..., 3] = ring[..., 0] * 255
    fa = frame_rgba[..., 3:4] / 255
    comp[..., :3] = comp[..., :3] * (1 - fa) + frame_rgba[..., :3] * fa
    comp[..., 3] = np.clip(comp[..., 3:4] + frame_rgba[..., 3:4] * (1 - comp[..., 3:4] / 255), 0, 255)[..., 0]
    span = arc_span(kind, frac)
    col = np.broadcast_to(np.array(family_rgb, dtype=np.float32), comp[..., :3].shape).copy()
    if red_T is not None and kind != 'job' and 0 < frac < red_T:
        span_deg = frac * 360.0
        tipdist = 360.0 - ANG
        if red_mode == 'whole':
            redw = np.full((H, W), np.clip((red_T - frac) / red_T, 0, 1))
        elif red_mode == 'fix':
            redw = np.clip((min(red_fix_deg, span_deg) - tipdist) / 8.0, 0, 1)
        else:
            redw = np.clip((np.clip(1 - frac / red_T, 0, 1) * span_deg - tipdist) / 8.0, 0, 1)
        blended = lerp_oklch(family_rgb, URGENT_RED, np.clip(redw, 0, 1))
        col = np.where((span & (ANG > 180))[..., None], blended.astype(np.float32), col)
    aa = (span.astype(np.float32) * (mask[..., 3] / 255))[..., None]
    comp[..., :3] = comp[..., :3] * (1 - aa) + col * SHADE[..., None] * aa
    comp[..., 3] = np.clip(comp[..., 3:4] + aa * 255 * (1 - comp[..., 3:4] / 255), 0, 255)[..., 0]
    ia = (inc[..., 3] / 255 * 0.85)[..., None]
    comp[..., :3] = comp[..., :3] * (1 - ia) + inc[..., :3] * ia
    ta = (top[..., 3] / 255)[..., None]
    comp[..., :3] = comp[..., :3] * (1 - ta) + top[..., :3] * ta
    ix, iy = int(CX - ICON_IW / 2), int(CY - ICON_IH / 2)
    ica = ICON[..., 3:4] / 255
    comp[iy:iy + ICON_IH, ix:ix + ICON_IW, :3] = comp[iy:iy + ICON_IH, ix:ix + ICON_IW, :3] * (1 - ica) + ICON[..., :3] * ica
    comp[iy:iy + ICON_IH, ix:ix + ICON_IW, 3] = np.clip(comp[iy:iy + ICON_IH, ix:ix + ICON_IW, 3] + ICON[..., 3], 0, 255)
    return comp

GLOW_RGB = glow[..., :3] * (glow[..., 3:4] / 255)

def paste_scaled(crop_rgba, poi_rgba, size_px):
    """Scale region so piece width = size_px; ring centre lands on crop centre. Glow = screen."""
    s = size_px / PIECE_W
    nw, nh = max(1, int(REG * s)), max(1, int(REG * s))
    sc = np.array(Image.fromarray(poi_rgba.astype(np.uint8)).resize((nw, nh), Image.LANCZOS), dtype=np.float32)
    gs = np.array(Image.fromarray(np.dstack([GLOW_RGB, glow[..., 3]]).astype(np.uint8)).resize((nw, nh), Image.LANCZOS), dtype=np.float32)
    out = np.array(crop_rgba.convert('RGBA'), dtype=np.float32)
    ox, oy = int(round(200 - CX * s)), int(round(200 - CY * s))
    x0d, y0d = max(ox, 0), max(oy, 0)
    x1d, y1d = min(ox + nw, 400), min(oy + nh, 400)
    if x1d <= x0d or y1d <= y0d:
        return Image.fromarray(out[..., :3].astype(np.uint8))
    sl = np.s_[y0d - oy:y1d - oy, x0d - ox:x1d - ox]
    region = out[y0d:y1d, x0d:x1d, :3]
    ga = gs[sl][..., 3:4] / 255
    region[...] = 255 - (255 - region) * (255 - gs[sl][..., :3] * ga) / 255
    a = sc[sl][..., 3:4] / 255
    region[...] = region * (1 - a) + sc[sl][..., :3] * a
    return Image.fromarray(np.clip(out[..., :3], 0, 255).astype(np.uint8))

# ---------------- sheets ----------------
os.makedirs(OUT, exist_ok=True)
try:
    FONT = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 15)
    FONT_S = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 12)
except Exception:
    FONT = FONT_S = ImageFont.load_default()

CROPS = {
    'sea':    '1440x900-sea_west-zmid-crop.png',
    'lagoon': '1440x900-coral_lagoon-zmid-crop.png',
    'forest': '1440x900-ridge_forest-zmid-crop.png',
    'village':'1440x900-village-zmid-crop.png',
    'canyon': '1440x900-red_canyons-zmid-crop.png',
    'snow':   '1440x900-snow_peaks-zmid-crop.png',
}
crops = {k: Image.open(F0 + v) for k, v in CROPS.items()}

def cell(crop, poi, size, sub=140):
    return paste_scaled(crop, poi, size).crop((200 - sub // 2, 200 - sub // 2, 200 + sub // 2, 200 + sub // 2))

def sheet(grid, rowlabels, collabels, path, cellsize):
    pad, lft, tpp = 8, 190, 44
    cw = ch = cellsize
    img = Image.new('RGB', (lft + len(collabels) * (cw + pad) + pad, tpp + len(rowlabels) * (ch + pad) + pad), (18, 18, 22))
    d = ImageDraw.Draw(img)
    for j, c in enumerate(collabels):
        d.text((lft + j * (cw + pad) + 4, 8), c, fill=(235, 225, 200), font=FONT_S)
    for i, rl in enumerate(rowlabels):
        d.text((8, tpp + i * (ch + pad) + ch // 2 - 6), rl, fill=(235, 225, 200), font=FONT_S)
        for j, cellimg in enumerate(grid[i]):
            img.paste(cellimg, (lft + j * (cw + pad), tpp + i * (ch + pad)))
    img.save(path)
    print('wrote', path, flush=True)

# ---------- Sheet A: quest arc colour ----------
BLUE_CANDS = [
    ('p50 #113368',   (0x11, 0x33, 0x68)),
    ('p75 #2d4a87',   (0x2d, 0x4a, 0x87)),
    ('mid #485c94',   (0x48, 0x5c, 0x94)),
    ('p90 #636fa1',   (0x63, 0x6f, 0xa1)),
    ('bright #2f6fd0',(0x2f, 0x6f, 0xd0)),
    ('navy #0e2a5c',  (0x0e, 0x2a, 0x5c)),
]
quest_pois = {}
for label, rgb in BLUE_CANDS:
    quest_pois[label] = compose(quest_canvas, rgb, 'quest', 0.5)
    print('composed', label, flush=True)

cols = ['sea 32', 'sea 48', 'sea 64', 'lagoon 48', 'forest 48', 'village 48', 'canyon 48']
grid = []
for label, _ in BLUE_CANDS:
    p = quest_pois[label]
    grid.append([cell(crops['sea'], p, 32), cell(crops['sea'], p, 48), cell(crops['sea'], p, 64),
                 cell(crops['lagoon'], p, 48), cell(crops['forest'], p, 48),
                 cell(crops['village'], p, 48), cell(crops['canyon'], p, 48)])
sheet(grid, [l for l, _ in BLUE_CANDS], cols, OUT + 'A-quest-arc-color-grid.png', 140)

grid2 = [[paste_scaled(crops['sea'], quest_pois[l], 48)] for l, _ in BLUE_CANDS]
sheet(grid2, [l for l, _ in BLUE_CANDS], ['sea_west 48px — full crop'],
      OUT + 'A-quest-arc-color-sea-full.png', 400)

# ---------- Sheet B: urgency threshold ----------
WORK_BLUE = (0x2d, 0x4a, 0x87)
THRESH_ROWS = [
    ('T=10% tip',   dict(red_T=0.10, red_mode='tip')),
    ('T=15% tip',   dict(red_T=0.15, red_mode='tip')),
    ('T=25% tip',   dict(red_T=0.25, red_mode='tip')),
    ('T=25% fix45', dict(red_T=0.25, red_mode='fix', red_fix_deg=45)),
    ('T=25% whole', dict(red_T=0.25, red_mode='whole')),
]
REM = [0.30, 0.25, 0.20, 0.15, 0.10, 0.05]
thresh_pois = {}
for label, kw in THRESH_ROWS:
    for r in REM:
        thresh_pois[(label, r)] = compose(quest_canvas, WORK_BLUE, 'quest', r, **kw)
    print('composed row', label, flush=True)
for biome in ['sea', 'village']:
    grid = [[cell(crops[biome], thresh_pois[(label, r)], 48) for r in REM] for label, _ in THRESH_ROWS]
    sheet(grid, [l for l, _ in THRESH_ROWS], [f'rest {int(r*100)}%' for r in REM],
          OUT + f'B-urgency-threshold-{biome}.png', 140)

# reference: green job fill on sea/village
gp = [compose(gbase, FAMILY_GREEN, 'job', p) for p in (0.4, 0.8)]
grid = [[cell(crops['sea'], gp[0], 48), cell(crops['sea'], gp[1], 48),
         cell(crops['village'], gp[0], 48), cell(crops['village'], gp[1], 48)]]
sheet(grid, ['job green'], ['sea 40%', 'sea 80%', 'village 40%', 'village 80%'],
      OUT + 'C-job-green-reference.png', 140)

# ---------- zoom sheets: 90x70 around ring top, x4 ----------
def zoom_cell(crop, poi, size):
    im = paste_scaled(crop, poi, size)
    z = im.crop((200 - 45, 200 - 55, 200 + 45, 200 + 15))
    return z.resize((360, 280), Image.LANCZOS)

# zoom A: 6 candidates, sea at 48 and 64
gridz = [[zoom_cell(crops['sea'], quest_pois[l], 48), zoom_cell(crops['sea'], quest_pois[l], 64)]
          for l, _ in BLUE_CANDS]
sheet(gridz, [l for l, _ in BLUE_CANDS], ['sea 48 zoom4', 'sea 64 zoom4'],
      OUT + 'A-quest-arc-color-zoom.png', 360)

# zoom B: thresholds, sea at 48
for biome in ['sea', 'village']:
    gridz = [[zoom_cell(crops[biome], thresh_pois[(label, r)], 48) for r in REM]
             for label, _ in THRESH_ROWS]
    sheet(gridz, [l for l, _ in THRESH_ROWS], [f'rest {int(r*100)}%' for r in REM],
          OUT + f'B-urgency-threshold-{biome}-zoom.png', 360)

print('DONE', flush=True)
