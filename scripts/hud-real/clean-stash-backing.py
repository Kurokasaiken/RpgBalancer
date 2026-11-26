#!/usr/bin/env python3
"""Remove painted alcove wells and scrollbar track from the stash backing (PLAN-136).

Deterministic OpenCV inpainting over measured rectangles. The outer frame,
medallion, proportions and all other backing art are left untouched.
"""
from pathlib import Path
import hashlib, json
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/assets/ui/hud-real/stash-frame-clean.webp'
OUT = ROOT / 'public/assets/ui/hud-real/stash-frame-no-grid.webp'
PROV = ROOT / '.mw/specs/hud-real/refs/plan136-stash-backing-provenance.json'

# Measured on the 1146×831 backing. Wells: 5 columns × 3 rows inside the shelf;
# track: narrow painted strip in the right gutter. Rectangles include the full rims.
WELL_RECTS = []
for cx in (144, 349, 550, 752, 954):
    for cy in (280, 428, 576):
        WELL_RECTS.append((cx - 82, cy - 76, cx + 82, cy + 76))
TRACK_RECT = (1008, 190, 1068, 725)


def main() -> None:
    im = Image.open(SRC).convert('RGBA')
    arr = np.array(im)
    mask = np.zeros(arr.shape[:2], dtype=np.uint8)
    for x0, y0, x1, y1 in [*WELL_RECTS, TRACK_RECT]:
        cv2.rectangle(mask, (x0, y0), (x1, y1), 255, thickness=-1)
    # Procedural lacquer fill. The backing behind DOM sockets is mostly hidden;
    # the visible requirement is that no painted wells/track survive. A blurred
    # noise patch sampled to the local dark-green range avoids the triangular
    # artifacts of large-hole inpainting and the hard seams of strip copying.
    out_arr = arr.copy()
    rng = np.random.default_rng(391136)

    def fill_rect(rect, seed_offset=0, base_override=None):
        x0, y0, x1, y1 = rect
        w, h = x1 - x0, y1 - y0
        # Estimate the local dark lacquer from a thin ring around the hole,
        # rejecting bright brass/grey pixels and very dark shadows.
        pads = []
        for yy0, yy1, xx0, xx1 in (
            (max(0, y0 - 8), y0, x0, x1),
            (y1, min(arr.shape[0], y1 + 8), x0, x1),
            (y0, y1, max(0, x0 - 8), x0),
            (y0, y1, x1, min(arr.shape[1], x1 + 8)),
        ):
            if yy1 > yy0 and xx1 > xx0:
                pads.append(arr[yy0:yy1, xx0:xx1, :3].reshape(-1, 3))
        if pads:
            ring = np.concatenate(pads, axis=0).astype(np.float32)
            lum = ring.mean(axis=1)
            dark = ring[(lum > 8) & (lum < 55) & (ring[:, 1] >= ring[:, 0])]
            base = np.median(dark, axis=0) if len(dark) else np.array([10.0, 34.0, 24.0])
        else:
            base = np.array([10.0, 34.0, 24.0])
        if base_override is not None:
            base = np.array(base_override, dtype=np.float32)
        local_rng = np.random.default_rng(391136 + seed_offset)
        fine = local_rng.normal(0, 1, (h, w)).astype(np.float32)
        fine = cv2.GaussianBlur(fine, (0, 0), 1.4)
        broad = local_rng.normal(0, 1, (h, w)).astype(np.float32)
        broad = cv2.GaussianBlur(broad, (0, 0), 9.0)
        yy = np.linspace(-1, 1, h, dtype=np.float32)[:, None]
        xx = np.linspace(-1, 1, w, dtype=np.float32)[None, :]
        mod = fine * 2.0 + broad * 4.0 + yy * 2.0 - xx * 0.8
        patch = np.clip(base[None, None, :] + mod[:, :, None], 0, 255).astype(np.uint8)
        alpha = np.zeros((h, w), dtype=np.float32)
        alpha[:, :] = 1.0
        # Feather only the outer 5px so the fill joins the surviving lacquer.
        for i in range(5):
            v = (i + 1) / 6.0
            alpha[i, :] = np.minimum(alpha[i, :], v)
            alpha[-i - 1, :] = np.minimum(alpha[-i - 1, :], v)
            alpha[:, i] = np.minimum(alpha[:, i], v)
            alpha[:, -i - 1] = np.minimum(alpha[:, -i - 1], v)
        old = out_arr[y0:y1, x0:x1, :3].astype(np.float32)
        out_arr[y0:y1, x0:x1, :3] = np.clip(old * (1 - alpha[:, :, None]) + patch.astype(np.float32) * alpha[:, :, None], 0, 255).astype(np.uint8)

    # Wells: copy the clean gap beside each column at the same y-range and
    # stretch it horizontally. This preserves the backing's vertical mottling
    # better than a flat procedural patch; the DOM sockets cover most seams.
    centers = (144, 349, 550, 752, 954)
    rows = (280, 428, 576)
    for col, cx in enumerate(centers):
        for cy in rows:
            x0, y0, x1, y1 = cx - 82, cy - 76, cx + 82, cy + 76
            if col < len(centers) - 1:
                gx0, gx1 = cx + 88, centers[col + 1] - 88
            else:
                gx0, gx1 = centers[col - 1] + 88, cx - 88
            patch = arr[y0:y1, gx0:gx1, :3]
            if patch.size:
                patch_img = Image.fromarray(patch, 'RGB').resize((x1 - x0, y1 - y0), Image.Resampling.BILINEAR)
                out_arr[y0:y1, x0:x1, :3] = np.asarray(patch_img)
    # Track: procedural fill; it stays visible when the scrollbar is absent,
    # so continuity matters more here than behind the sockets.
    fill_rect(TRACK_RECT, 100, base_override=(9, 33, 23))
    out = Image.fromarray(out_arr, 'RGBA')
    out.save(OUT, 'WEBP', quality=100, method=6)
    sha = hashlib.sha256(OUT.read_bytes()).hexdigest()
    PROV.parent.mkdir(parents=True, exist_ok=True)
    PROV.write_text(json.dumps({
        'artifact': str(OUT.relative_to(ROOT)),
        'sha256': sha,
        'source': str(SRC.relative_to(ROOT)),
        'wellRects': WELL_RECTS,
        'trackRect': TRACK_RECT,
        'method': 'hybrid deterministic: gap texture transfer for wells, procedural dark-lacquer fill for track',
        'plan': 'PLAN-136',
    }, indent=2) + '\n')
    print(f'{OUT.relative_to(ROOT)} {out.size} sha256={sha}')

if __name__ == '__main__':
    main()
