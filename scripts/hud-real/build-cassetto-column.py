"""build-cassetto-column.py — PLAN-116 F1: the cassetto column art.

Rebuilds `public/assets/ui/hud-real/cassetto/frame.webp` (639x1613) into a wider
column frame at the ruled sizes (420px @1440x900, 400px @1280x800, R-323 fork
ruling "1 - Dentro la cornice"). Technique proven in
`.mw/runs/20261110-cassetto-explore/column/frame_v2.py`:

- ornaments, corners and baked pictures are never stretched — horizontal seams
  live only in neutral fields;
- header 'A': the baked icon row is cleaned so the resources targhette sit there;
- the CONFIRM plaque is lifted out and re-composited at NATIVE proportions,
  centred in a footer box made Vg design rows taller (rows taken from the
  half-empty briefing panel).

Also emits `column-geometry.json`: the cassetto zone rects (title, briefing,
slots, resources band, ...) remapped onto the widened art, so the React overlay
can keep percentage positioning.

Usage:
  tools/hud-real/venv/bin/python -I scripts/hud-real/build-cassetto-column.py \
      <colW> <Hf> <dpr> <out.webp> [header=A|B] [Vg]
"""
import json
import sys

import cv2
import numpy as np
from PIL import Image

SRC = 'public/assets/ui/hud-real/cassetto/frame.webp'
BANDS = [
    (0, 48, [(270, 440, 1.0)]),
    (48, 152, [(264, 272, 0.25), (324, 332, 0.25), (444, 452, 0.25), (501, 509, 0.25)]),
    (152, 232, [(250, 330, 0.5), (440, 520, 0.5)]),
    (232, 890, [(280, 360, 0.5), (420, 500, 0.5)]),
    (890, 1120, [(262, 318, 1 / 3), (372, 428, 1 / 3), (478, 528, 1 / 3)]),
    (1120, 1405, [(363, 369, 0.5), (373, 381, 0.5)]),
    (1405, 1613, [(270, 330, 0.5), (440, 500, 0.5)]),
]
HEADER_A_SEAMS = (48, 152, [(260, 330, 0.5), (440, 520, 0.5)])
PLAQUE = (212, 1416, 584, 1562)
BOX_BORDER_X = (222, 235)
BRIEF_MID = (380, 500)
SIDE_RANGE = (300, 1380)
FOOT_GROW = (1418, 1448)
XL, XR0 = 202, 603

# The cassetto overlay zones in the ORIGINAL 639x1613 art space (mirror of the
# `Z` table in HudRealCassetto.tsx). `resources` is the cleaned header band the
# targhette fill (matching the header-A clean rect x210..574, y52..140).
ZONES = {
    'resources': {'x': 214, 'y': 54, 'w': 356, 'h': 84},
    'title': {'x': 227, 'y': 176, 'w': 318, 'h': 42},
    'subtitle': {'x': 216, 'y': 238, 'w': 340, 'h': 38},
    'briefing': {'x': 215, 'y': 300, 'w': 342, 'h': 256},
    'partyLabel': {'x': 225, 'y': 594, 'w': 322, 'h': 30},
    'slots': {'x': 214, 'y': 632, 'w': 344, 'h': 156},
    'loadout': {'x': 215, 'y': 800, 'w': 342, 'h': 64},
    'journeyLabel': {'x': 260, 'y': 906, 'w': 252, 'h': 38},
    'journeyLegs': {'x': 218, 'y': 980, 'w': 336, 'h': 38},
    'journeySubs': {'x': 215, 'y': 1034, 'w': 342, 'h': 52},
    'riskLabel': {'x': 250, 'y': 1144, 'w': 296, 'h': 38},
    'riskValue': {'x': 244, 'y': 1298, 'w': 116, 'h': 74},
    'rewards': {'x': 382, 'y': 1292, 'w': 172, 'h': 82},
    'confirm': {'x': 224, 'y': 1450, 'w': 336, 'h': 78},
}


def lift_plaque(a):
    x0, y0, x1, y1 = PLAQUE
    reg = a[y0:y1, x0:x1, :3].astype(np.int32)
    m = ((reg[..., 0] > 45) | (reg[..., 1] > 85)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    h, w = m.shape
    ff = np.zeros((h + 2, w + 2), np.uint8)
    ff[1:-1, 1:-1] = m
    cv2.floodFill(ff, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 2)
    m = (ff[1:-1, 1:-1] != 2).astype(np.uint8)
    core = m.copy()
    m = cv2.dilate(m, np.ones((9, 9), np.uint8))
    ys = np.arange(y0, y1)[:, None]
    xs = np.arange(x0, x1)[None, :]
    keep_left = (((xs >= 220) & (xs < 237)) & ~((ys >= 1445) & (ys < 1529))) | ((xs < 250) & (ys >= 1528))
    keep_right = (xs > 578) & ~((ys >= 1476) & (ys < 1517))
    keep_bottom = (ys >= 1553) & ((xs < 380) | (xs > 440))
    keep_top = (ys < 1421) & ((xs < 380) | (xs > 440))
    keep = keep_left | keep_right | keep_bottom | keep_top
    m = (m.astype(bool) & ~keep).astype(np.uint8)
    core = (core.astype(bool) & ~keep).astype(np.uint8)
    full = np.zeros(a.shape[:2], np.uint8)
    full[y0:y1, x0:x1] = m
    sprite = a[y0:y1, x0:x1].copy()
    n, lab, stats, _ = cv2.connectedComponentsWithStats(core, connectivity=8)
    big_id = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    core = (lab == big_id).astype(np.uint8)
    sm = cv2.dilate(core, np.ones((3, 3), np.uint8)).astype(np.float32)
    sprite[..., 3] = (cv2.GaussianBlur(sm, (5, 5), 0) * 255).clip(0, 255).astype(np.uint8)
    best, axis = None, None
    for c2 in range(2 * 190, 2 * 205):
        L = c2 // 2 - 40
        Rr = c2 - L
        d = np.abs(sprite[:, L - 60:L, :3].astype(int) - sprite[:, Rr:Rr + 60, :3][:, ::-1].astype(int)).mean()
        if best is None or d < best:
            best, axis = d, c2
    out_sp = sprite.copy()
    for x in range(sprite.shape[1]):
        xm = axis - x
        if x * 2 < axis:
            if 0 <= xm < sprite.shape[1]:
                out_sp[:, x] = sprite[:, xm]
            else:
                out_sp[:, x, 3] = 0
    sprite = out_sp
    lift_plaque.axis_x = x0 + axis / 2
    img = a[..., :3].astype(np.float32)
    rowc = np.full((a.shape[0], 3), np.nan, np.float32)
    for y in range(y0 - 4, y1 + 4):
        cols = np.r_[240:262, 300:330, 480:510, 566:592]
        px = img[y, cols]
        ok = (full[y, cols] == 0) & (px[:, 0] < 30) & (px[:, 1] < 90) & (px[:, 1] > 25)
        if ok.sum() > 8:
            rowc[y] = np.median(px[ok], axis=0)
    yy = np.arange(a.shape[0])
    good = ~np.isnan(rowc[:, 0])
    for k in range(3):
        rowc[:, k] = np.interp(yy, yy[good], rowc[good, k])
    rowc = cv2.GaussianBlur(rowc[:, None, :], (0, 0), sigmaX=0.1, sigmaY=6)[:, 0, :]
    out = a.copy()
    sel = full.astype(bool)
    fill = np.repeat(rowc[:, None, :], a.shape[1], axis=1)
    out[..., :3][sel] = fill[sel].clip(0, 255).astype(np.uint8)
    bx0, bx1 = BOX_BORDER_X
    for y in range(1445, 1529):
        out[y, bx0:bx1] = a[1440, bx0:bx1]
    return out, sprite


def clean_icons(a):
    y0, y1, x0, x1 = 52, 140, 210, 574
    ref = a[150:157, x0:x1, :3].astype(np.float32).mean(axis=0)
    ref = cv2.GaussianBlur(ref[None], (0, 0), sigmaX=8, sigmaY=0.1)[0]
    strip = np.repeat(ref[None], y1 - y0, axis=0).clip(0, 255).astype(np.uint8)
    f = np.ones((y1 - y0, x1 - x0), np.float32)
    for i in range(3):
        k = (i + 1) / 4
        f[i, :] *= k
        f[-1 - i, :] *= k
        f[:, i] *= k
        f[:, -1 - i] *= k
    out = a.copy()
    out[y0:y1, x0:x1, :3] = (
        np.asarray(strip)[..., :3] * f[..., None] + a[y0:y1, x0:x1, :3] * (1 - f[..., None])
    ).astype(np.uint8)
    return out


def stretch_band(a, segs, E):
    parts, x = [], 0
    for (x0, x1, share) in segs:
        parts.append(a[:, x:x0])
        w = (x1 - x0) + int(round(E * share))
        parts.append(
            np.asarray(Image.fromarray(np.ascontiguousarray(a[:, x0:x1])).resize((w, a.shape[0]), Image.BICUBIC))
        )
        x = x1
    parts.append(a[:, x:])
    return np.concatenate(parts, axis=1)


def vres(a, y0, y1, V):
    mid = np.asarray(
        Image.fromarray(np.ascontiguousarray(a[y0:y1])).resize((a.shape[1], (y1 - y0) + V), Image.BICUBIC)
    )
    return np.concatenate([a[:y0], mid, a[y1:]], axis=0)


# ---------------------------------------------------------------- zone mapping
def make_xmap(segs, E):
    """Piecewise-linear x mapping for one band (original art x -> widened art x)."""
    cuts = []
    acc = 0.0
    for (x0, x1, share) in segs:
        grow = E * share
        cuts.append((x0, x1, acc, grow))
        acc += grow

    def xmap(x):
        off = 0.0
        for (x0, x1, acc0, grow) in cuts:
            if x <= x0:
                return x + acc0
            if x < x1:
                return x + acc0 + grow * (x - x0) / (x1 - x0)
            off = acc0 + grow
        return x + off

    return xmap


def band_of(y):
    for i, (y0, y1, _segs) in enumerate(BANDS):
        if y < y1:
            return i
    return len(BANDS) - 1


def make_ymap(Vg):
    """Panel-column y mapping (original art y -> widened art y).

    build() first inserts Vg rows inside FOOT_GROW (1418..1448), then removes
    Vg rows inside BRIEF_MID (380..500) for panel columns. Net height = 1613.
    """
    b0, b1 = BRIEF_MID
    f0, f1 = FOOT_GROW
    bh = (b1 - b0) - Vg
    fh = (f1 - f0) + Vg

    def ymap(y):
        if y < b0:
            return float(y)
        if y < b1:
            return b0 + (y - b0) * bh / (b1 - b0)
        if y < f0:
            return y - Vg
        if y < f1:
            return f0 - Vg + (y - f0) * fh / (f1 - f0)
        return float(y)

    return ymap


def remap_zones(E, Vg, header):
    bands = [HEADER_A_SEAMS if (header == 'A' and b[0] == HEADER_A_SEAMS[0] and b[1] == HEADER_A_SEAMS[1]) else b for b in BANDS]
    # simpler: replace the (48,152) band segs when header A
    bands = []
    for b in BANDS:
        if header == 'A' and b[0] == 48 and b[1] == 152:
            bands.append((b[0], b[1], HEADER_A_SEAMS[2]))
        else:
            bands.append(b)
    xmaps = {i: make_xmap(segs, E) for i, (_y0, _y1, segs) in enumerate(bands)}
    ymap = make_ymap(Vg)
    out = {}
    for name, z in ZONES.items():
        bi = band_of(z['y'] + z['h'] / 2)
        xm = xmaps[bi]
        x0 = xm(z['x'])
        x1 = xm(z['x'] + z['w'])
        y0 = ymap(z['y'])
        y1 = ymap(z['y'] + z['h'])
        out[name] = {
            'x': round(x0, 1),
            'y': round(y0, 1),
            'w': round(x1 - x0, 1),
            'h': round(y1 - y0, 1),
        }
    return out


def build(colW, Hf, dpr, out, header='A', Vg=40):
    a0 = np.asarray(Image.open(SRC).convert('RGBA'))
    a, sprite = lift_plaque(a0)
    if header == 'A':
        a = clean_icons(a)
    s = Hf / a.shape[0]
    Wd = int(round(colW / s))
    E = Wd - a.shape[1]
    bands = []
    for b in BANDS:
        if header == 'A' and b[0] == 48 and b[1] == 152:
            bands.append((b[0], b[1], HEADER_A_SEAMS[2]))
        else:
            bands.append(b)
    rows = []
    for (y0, y1, segs) in bands:
        b = stretch_band(a[y0:y1], segs, E)
        if b.shape[1] != Wd:
            b = np.asarray(Image.fromarray(b).resize((Wd, b.shape[0]), Image.BICUBIC))
        rows.append(b)
    big = np.concatenate(rows, axis=0)
    big = vres(big, *FOOT_GROW, Vg)
    xr = XR0 + E
    big = np.concatenate(
        [
            vres(big[:, :XL], *SIDE_RANGE, -Vg),
            vres(big[:, XL:xr], *BRIEF_MID, -Vg),
            vres(big[:, xr:], *SIDE_RANGE, -Vg),
        ],
        axis=1,
    )
    boxC = (228 + 605 + E) / 2
    boxW, boxH = (605 + E) - 228, (1575 - 1410) + Vg
    pw, ph = sprite.shape[1], sprite.shape[0]
    k = min(1.2, 0.8 * boxW / pw, 0.92 * boxH / ph)
    sp = Image.fromarray(sprite).resize((round(pw * k), round(ph * k)), Image.LANCZOS)
    axis_off = (lift_plaque.axis_x - PLAQUE[0]) * k
    cy0 = (PLAQUE[1] + PLAQUE[3]) / 2
    cy = cy0 - Vg / 2
    px = int(round(boxC - axis_off))
    py = int(round(cy - ph * k / 2))
    im = Image.fromarray(big)
    im.alpha_composite(sp, (px, py))
    im.resize((colW * dpr, Hf * dpr), Image.LANCZOS).save(out)
    zones = remap_zones(E, Vg, header)
    # the CONFIRM hit zone = the re-composited plaque rect (native proportions)
    zones['confirm'] = {
        'x': round(px, 1),
        'y': round(py, 1),
        'w': round(pw * k, 1),
        'h': round(ph * k, 1),
    }
    return {
        's': s,
        'E': E,
        'Wd': Wd,
        'Hd': a.shape[0],
        'Vg': Vg,
        'header': header,
        'zones': zones,
        'plaque': {'k': k, 'cx': boxC, 'cy': cy},
    }


if __name__ == '__main__':
    colW = int(sys.argv[1])
    Hf = int(sys.argv[2])
    dpr = int(sys.argv[3])
    out = sys.argv[4]
    header = sys.argv[5] if len(sys.argv) > 5 else 'A'
    Vg = int(sys.argv[6]) if len(sys.argv) > 6 else 40
    meta = build(colW, Hf, dpr, out, header, Vg)
    geo_path = out.rsplit('.', 1)[0] + '.geometry.json'
    with open(geo_path, 'w') as f:
        json.dump(meta, f, indent=2)
    print(json.dumps({'art': out, 'geometry': geo_path, 'Wd': meta['Wd'], 'Hd': meta['Hd'], 'E': meta['E']}))
