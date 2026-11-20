"""R-357 palette helper: pull gold-hued pixels onto the HUD nav champagne (hue 45, sat ~49%, val ~79%)."""
import numpy as np
from PIL import Image

def grade_gold(img, hue_to=45.0, sat_k=0.80, val_k=0.97, src_hue=38.0, sat_floor=0.30, lo=22, hi=62, min_v=0.25):
    """R-357 palette: pull the golden's orange-leaning brass (hue ~38, sat ~63%) onto the nav's champagne
    (hue ~45, sat ~49%) — the bottom nav is the palette golden standard. Only gold-hued pixels move."""
    rgba = img.convert('RGBA'); a = np.array(rgba).astype(float) / 255.0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a[..., :3].max(axis=2), a[..., :3].min(axis=2); d = mx - mn
    hh = np.zeros_like(mx)
    m = d > 1e-6
    rc = (mx == r) & m; gc = (mx == g) & m & ~rc; bc = m & ~rc & ~gc
    hh[rc] = ((g - b)[rc] / d[rc]) % 6; hh[gc] = (b - r)[gc] / d[gc] + 2; hh[bc] = (r - g)[bc] / d[bc] + 4
    hdeg = hh * 60; sat = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    gold = (hdeg > lo) & (hdeg < hi) & (sat > sat_floor) & (mx > min_v)
    w = np.clip((sat - sat_floor) / 0.15, 0, 1) * gold
    new_h = np.where(gold, hdeg + (hue_to - src_hue) * w, hdeg) % 360
    new_s = np.where(gold, sat * (1 - (1 - sat_k) * w), sat); new_v = np.where(gold, np.minimum(1.0, mx * (1 + (val_k - 1) * w)), mx)
    c = new_v * new_s; x = c * (1 - np.abs((new_h / 60) % 2 - 1)); mm = new_v - c
    z = np.zeros_like(c); hi = (new_h // 60).astype(int)
    tab = [(c, x, z), (x, c, z), (z, c, x), (z, x, c), (x, z, c), (c, z, x)]
    out = np.zeros_like(a)
    for k, (rr, gg, bb) in enumerate(tab):
        sel = hi == k; out[..., 0][sel] = (rr + mm)[sel]; out[..., 1][sel] = (gg + mm)[sel]; out[..., 2][sel] = (bb + mm)[sel]
    out[..., 3] = a[..., 3]
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype('uint8'), 'RGBA')

