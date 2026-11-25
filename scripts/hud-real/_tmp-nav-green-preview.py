#!/usr/bin/env python3
"""R-380 preview: recolour the nav dock's enamel band with the resources bar's
emerald-to-black gradient profile. Gold trim, dark glass sockets and alpha are
preserved; only green-dominant pixels are steered, row by row, onto the target
profile sampled from `resources/bar-slim.webp`.

Output: public/assets/ui/hud-real/nav/bar-green.webp (same size as bar.webp).
Run: tools/hud-real/venv/bin/python -I scripts/hud-real/_tmp-nav-green-preview.py
"""
import numpy as np
from PIL import Image

NAV = 'public/assets/ui/hud-real/nav/bar.webp'
RES = 'public/assets/ui/hud-real/resources/bar-slim.webp'
OUT = 'public/assets/ui/hud-real/nav/bar-green.webp'


def band_rows(a):
    """Per-row mean rgb of opaque, green-dominant, non-dark pixels (the enamel)."""
    h, w = a.shape[:2]
    rgb = a[..., :3].astype(np.float32)
    alpha = a[..., 3] / 255.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    mask = (alpha > 0.5) & (g > r) & (g > b) & (lum > 20)
    out = np.full((h, 3), np.nan, dtype=np.float32)
    count = np.zeros(h, dtype=np.int32)
    for y in range(h):
        m = mask[y]
        if m.sum() > 4:
            out[y] = rgb[y][m].mean(axis=0)
            count[y] = int(m.sum())
    return out, count


def interp_nan(profile):
    """Fill NaN rows by nearest-neighbour interpolation along y."""
    h = profile.shape[0]
    good = ~np.isnan(profile[:, 0])
    idx = np.where(good)[0]
    filled = profile.copy()
    for y in range(h):
        if not good[y]:
            nearest = idx[np.argmin(np.abs(idx - y))]
            filled[y] = profile[nearest]
    return filled


def smooth(profile, k=9):
    """Box smooth to remove texture noise from the row profile."""
    h = profile.shape[0]
    pad = np.pad(profile, ((k // 2, k // 2), (0, 0)), mode='edge')
    kern = np.ones(k) / k
    return np.stack([np.convolve(pad[:, c], kern, mode='valid') for c in range(3)], axis=1)[:h]


def main():
    nav = np.array(Image.open(NAV).convert('RGBA')).astype(np.float32)
    res = np.array(Image.open(RES).convert('RGBA')).astype(np.float32)

    res_prof, res_cnt = band_rows(res)
    res_prof = smooth(interp_nan(res_prof))
    nav_prof, nav_cnt = band_rows(nav)
    nav_prof = interp_nan(nav_prof)

    hn, hr = nav.shape[0], res.shape[0]
    rgb = nav[..., :3]
    alpha = nav[..., 3] / 255.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b

    # steer weight: strong where clearly green enamel, zero on gold (R>G) and navy glass (B>=G)
    w = np.clip((g - np.maximum(r, b)) / 18.0, 0.0, 1.0) * np.clip(alpha * 1.5, 0, 1)
    w[lum < 18] = 0.0  # keep the dark glass/sockets untouched

    for y in range(hn):
        yt = min(hr - 1, int(y * hr / hn))
        target = res_prof[yt]
        if np.isnan(nav_prof[y]).any() or nav_cnt[y] < 4:
            continue
        ratio = np.clip(target / np.maximum(nav_prof[y], 6.0), 0.3, 2.6)
        wy = w[y][:, None]
        rgb[y] = np.clip(rgb[y] * (1 - wy) + rgb[y] * ratio[None, :] * wy, 0, 255)

    out = np.dstack([rgb, nav[..., 3]]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(OUT, 'WEBP', quality=95)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
