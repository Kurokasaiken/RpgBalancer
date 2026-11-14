"""Cassetto frame v2 for the composition fork (2026-11-10, after the Director's critique):
- narrower; ornaments, corners and baked pictures never stretched (seams only in neutral fields);
- the CONFIRM plaque is lifted out as a sprite and put back at its NATIVE proportions, centred in a footer box made
  Vg design rows taller (the rows come out of the half-empty briefing panel), so it has air above and below;
- header 'A': the baked icon row is cleaned (resources go there); header 'B': kept (the cassetto's own controls)."""
import json, sys
import cv2
import numpy as np
from PIL import Image

SRC = 'public/assets/ui/hud-real/cassetto/frame.webp'
BANDS = [
    (0, 48, [(270, 440, 1.0)]),
    (48, 152, [(264, 272, 0.25), (324, 332, 0.25), (444, 452, 0.25), (501, 509, 0.25)]),  # icon gaps, centre diamond untouched
    (152, 232, [(250, 330, 0.5), (440, 520, 0.5)]),
    (232, 890, [(280, 360, 0.5), (420, 500, 0.5)]),
    (890, 1120, [(262, 318, 1 / 3), (372, 428, 1 / 3), (478, 528, 1 / 3)]),
    (1120, 1405, [(363, 369, 0.5), (373, 381, 0.5)]),
    (1405, 1613, [(270, 330, 0.5), (440, 500, 0.5)]),
]
HEADER_A_SEAMS = (48, 152, [(260, 330, 0.5), (440, 520, 0.5)])  # icon row cleaned → any neutral seam
PLAQUE = (212, 1416, 584, 1562)          # x0, y0, x1, y1 of the CONFIRM plaque (with its diamonds and end gems)
BOX_BORDER_X = (222, 235)                # the footer box's left gold line, hidden behind the plaque's left gem
BRIEF_MID = (380, 500)                   # uniform rows inside the briefing panel (panel columns only)
SIDE_RANGE = (300, 1380)                 # side ornaments absorb the same change spread thin
FOOT_GROW = (1418, 1448)                 # uniform rows at the top of the cleaned footer box (full width)
XL, XR0 = 202, 603


def lift_plaque(a):
    x0, y0, x1, y1 = PLAQUE
    reg = a[y0:y1, x0:x1, :3].astype(np.int32)
    m = ((reg[..., 0] > 45) | (reg[..., 1] > 85)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    h, w = m.shape
    ff = np.zeros((h + 2, w + 2), np.uint8); ff[1:-1, 1:-1] = m
    cv2.floodFill(ff, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 2)   # outside = everything reachable from the padded edge
    m = (ff[1:-1, 1:-1] != 2).astype(np.uint8)    # plaque + its enclosed glass (dark ghost text)
    core = m.copy()
    m = cv2.dilate(m, np.ones((9, 9), np.uint8))
    ys = np.arange(y0, y1)[:, None]; xs = np.arange(x0, x1)[None, :]
    keep_left = (((xs >= 220) & (xs < 237)) & ~((ys >= 1445) & (ys < 1529))) | ((xs < 250) & (ys >= 1528))  # box line, corner gem
    keep_right = (xs > 578) & ~((ys >= 1476) & (ys < 1517))    # corner cluster stays
    keep_bottom = (ys >= 1553) & ((xs < 380) | (xs > 440))     # box bottom line (only the lower diamond belongs)
    keep_top = (ys < 1421) & ((xs < 380) | (xs > 440))         # box top edge
    keep = keep_left | keep_right | keep_bottom | keep_top
    m = (m.astype(bool) & ~keep).astype(np.uint8)
    core = (core.astype(bool) & ~keep).astype(np.uint8)
    full = np.zeros(a.shape[:2], np.uint8); full[y0:y1, x0:x1] = m
    sprite = a[y0:y1, x0:x1].copy()
    n, lab, stats, _ = cv2.connectedComponentsWithStats(core, connectivity=8)
    big_id = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    core = (lab == big_id).astype(np.uint8)                       # the plaque only, no stray frame bits
    sm = cv2.dilate(core, np.ones((3, 3), np.uint8)).astype(np.float32)
    sprite[..., 3] = (cv2.GaussianBlur(sm, (5, 5), 0) * 255).clip(0, 255).astype(np.uint8)
    # the left end gem sits on the box's gold line: rebuild the left half as the mirror of the clean right half
    best, axis = None, None
    for c2 in range(2 * 190, 2 * 205):          # axis (in sprite px, half-steps) where the plaque matches its mirror
        L = c2 // 2 - 40; Rr = c2 - L
        d = np.abs(sprite[:, L - 60:L, :3].astype(int) - sprite[:, Rr:Rr + 60, :3][:, ::-1].astype(int)).mean()
        if best is None or d < best: best, axis = d, c2
    out_sp = sprite.copy()
    for x in range(sprite.shape[1]):
        xm = axis - x
        if x * 2 < axis:
            if 0 <= xm < sprite.shape[1]: out_sp[:, x] = sprite[:, xm]
            else: out_sp[:, x, 3] = 0
    sprite = out_sp
    lift_plaque.axis_x = x0 + axis / 2
    # background under the plaque: per-row colour of the clean box interior (dark green only, no gold), smoothed
    img = a[..., :3].astype(np.float32)
    rowc = np.full((a.shape[0], 3), np.nan, np.float32)
    for y in range(y0 - 4, y1 + 4):
        cols = np.r_[240:262, 300:330, 480:510, 566:592]
        px = img[y, cols]; ok = (full[y, cols] == 0) & (px[:, 0] < 30) & (px[:, 1] < 90) & (px[:, 1] > 25)
        if ok.sum() > 8: rowc[y] = np.median(px[ok], axis=0)
    yy = np.arange(a.shape[0]); good = ~np.isnan(rowc[:, 0])
    for k in range(3): rowc[:, k] = np.interp(yy, yy[good], rowc[good, k])
    rowc = cv2.GaussianBlur(rowc[:, None, :], (0, 0), sigmaX=0.1, sigmaY=6)[:, 0, :]
    out = a.copy(); sel = full.astype(bool)
    fill = np.repeat(rowc[:, None, :], a.shape[1], axis=1)
    out[..., :3][sel] = fill[sel].clip(0, 255).astype(np.uint8)
    bx0, bx1 = BOX_BORDER_X                       # rebuild the box's left line behind the old gem
    for y in range(1445, 1529):
        out[y, bx0:bx1] = a[1440, bx0:bx1]
    return out, sprite


def clean_icons(a):
    # cover the baked icon row with real panel texture (the plain strip under the title plaque), feathered edges
    y0, y1, x0, x1 = 54, 136, 210, 574
    y0, y1 = 52, 140
    ref = a[150:157, x0:x1, :3].astype(np.float32).mean(axis=0)
    ref = cv2.GaussianBlur(ref[None], (0, 0), sigmaX=8, sigmaY=0.1)[0]
    strip = np.repeat(ref[None], y1 - y0, axis=0).clip(0, 255).astype(np.uint8)
    f = np.ones((y1 - y0, x1 - x0), np.float32)
    for i in range(3):
        k = (i + 1) / 4; f[i, :] *= k; f[-1 - i, :] *= k; f[:, i] *= k; f[:, -1 - i] *= k
    out = a.copy()
    out[y0:y1, x0:x1, :3] = (np.asarray(strip)[..., :3] * f[..., None] + a[y0:y1, x0:x1, :3] * (1 - f[..., None])).astype(np.uint8)
    return out


def stretch_band(a, segs, E):
    parts, x = [], 0
    for (x0, x1, share) in segs:
        parts.append(a[:, x:x0])
        w = (x1 - x0) + int(round(E * share))
        parts.append(np.asarray(Image.fromarray(np.ascontiguousarray(a[:, x0:x1])).resize((w, a.shape[0]), Image.BICUBIC)))
        x = x1
    parts.append(a[:, x:])
    return np.concatenate(parts, axis=1)


def vres(a, y0, y1, V):
    mid = np.asarray(Image.fromarray(np.ascontiguousarray(a[y0:y1])).resize((a.shape[1], (y1 - y0) + V), Image.BICUBIC))
    return np.concatenate([a[:y0], mid, a[y1:]], axis=0)


def build(colW, Hf, dpr, out, header='A', Vg=40):
    a0 = np.asarray(Image.open(SRC).convert('RGBA'))
    a, sprite = lift_plaque(a0)
    if header == 'A':
        a = clean_icons(a)
    s = Hf / a.shape[0]
    Wd = int(round(colW / s)); E = Wd - a.shape[1]
    bands = [HEADER_A_SEAMS if (header == 'A' and b[0] == 48) else b for b in BANDS]
    rows = []
    for (y0, y1, segs) in bands:
        b = stretch_band(a[y0:y1], segs, E)
        if b.shape[1] != Wd:
            b = np.asarray(Image.fromarray(b).resize((Wd, b.shape[0]), Image.BICUBIC))
        rows.append(b)
    big = np.concatenate(rows, axis=0)
    big = vres(big, *FOOT_GROW, Vg)                                   # footer box +Vg (full width, neutral rows)
    xr = XR0 + E
    big = np.concatenate([vres(big[:, :XL], *SIDE_RANGE, -Vg), vres(big[:, XL:xr], *BRIEF_MID, -Vg), vres(big[:, xr:], *SIDE_RANGE, -Vg)], axis=1)
    # plaque back at native size, centred in the (wider, taller) footer box
    # uniform scale only (never stretched): as large as the box allows, capped
    boxC = (228 + 605 + E) / 2
    boxW, boxH = (605 + E) - 228, (1575 - 1410) + Vg
    pw, ph = sprite.shape[1], sprite.shape[0]
    k = min(1.2, 0.8 * boxW / pw, 0.92 * boxH / ph)
    sp = Image.fromarray(sprite).resize((round(pw * k), round(ph * k)), Image.LANCZOS)
    axis_off = (lift_plaque.axis_x - PLAQUE[0]) * k          # plaque's own symmetry axis inside the scaled sprite
    cy0 = (PLAQUE[1] + PLAQUE[3]) / 2                       # original centre row (the box grew by Vg upwards)
    cy = cy0 - Vg / 2
    px = int(round(boxC - axis_off)); py = int(round(cy - ph * k / 2))
    im = Image.fromarray(big); im.alpha_composite(sp, (px, py))
    im.resize((colW * dpr, Hf * dpr), Image.LANCZOS).save(out)
    return {'s': s, 'E': E, 'Wd': Wd, 'Vg': Vg, 'plaque': {'k': k, 'cx0': lift_plaque.axis_x, 'cy0': cy0, 'cx': boxC, 'cy': cy}}


if __name__ == '__main__':
    print(json.dumps(build(int(sys.argv[1]), int(sys.argv[2]), 2, sys.argv[3], sys.argv[4], int(sys.argv[5]))))
