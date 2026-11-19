# WHY-NOT-SPEC: `ctaPlaque` rebuilds the CONFIRM plaque from the golden via
# OpenCV inpainting of the baked label, emerald symmetry-axis detection,
# mirroring of the clean right half, 2x upscale + denoise + unsharp mask and
# connected-component outside-keying — a reconstructive raster pipeline, not
# a source crop (Director 2026-11-18: «il lato pulito … deve essere prima
# fixato, poi usato per fare anche la parte a sinistra»).
# WHY-NOT-SPEC: `frameTop` SYNTHESISES the north bar from the emitted
# rail-mid piece's cross-section profile (median column profile + seeded
# noise + hairline) — procedural generation; no source crop exists because
# the golden's north is only a floating hairline.
"""PLAN-127 plugin for the cassetto surface — see the WHY-NOT-SPEC markers
above. Both functions are verbatim ports of the oracle
`scripts/build-cassetto3-assets.py` blocks; they return UNGRADED RGBA images
(the spec's `regrade` field applies the gold grade uniformly)."""
import os
import sys

import numpy as np
import cv2
from PIL import Image, ImageDraw

SCRIPTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)


def ctaPlaque(ctx: dict) -> Image.Image:
    """Rebuild the CTA plaque — oracle lines verbatim (cv2 pipeline on the
    golden's bottom band, region y1330:1536 x100:1024)."""
    im = ctx['im']  # golden, RGB PIL
    _g = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
    _pl = _g[1330:1536, 100:1024].copy()
    _hsv = cv2.cvtColor(_pl, cv2.COLOR_BGR2HSV)
    _box = np.zeros(_pl.shape[:2], np.uint8); _box[60:150, 150:760] = 255
    _cream = ((_hsv[..., 1] < 110) & (_hsv[..., 2] > 150)).astype(np.uint8) * 255
    _pl = cv2.inpaint(_pl, cv2.dilate(cv2.bitwise_and(_cream, _box), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))), 5, cv2.INPAINT_TELEA)
    _top = cv2.cvtColor(_pl[0:60, 330:530], cv2.COLOR_BGR2HSV)
    _em = (_top[..., 0] > 60) & (_top[..., 0] < 90) & (_top[..., 1] > 90) & (_top[..., 2] > 150)
    _xs = np.where(_em.any(axis=0))[0]; _axis = int(round((_xs.min() + _xs.max()) / 2)) + 330
    _right = cv2.resize(_pl[:, _axis:], None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)
    _right = cv2.fastNlMeansDenoisingColored(_right, None, 3, 3, 5, 15)
    _right = cv2.addWeighted(_right, 1.7, cv2.GaussianBlur(_right, (0, 0), 1.6), -0.7, 0)
    _full = np.hstack([cv2.flip(_right, 1), _right])          # perfectly symmetric
    _rgb = cv2.cvtColor(_full, cv2.COLOR_BGR2RGB).astype(int)
    _mx = _rgb.max(axis=2); _r, _gg, _b = _rgb[..., 0], _rgb[..., 1], _rgb[..., 2]
    _brass = (_r > _gg - 10) & (_r > _b + 25) & (_mx > 90)
    _dark = ((_mx <= 95) & ~_brass).astype(np.uint8)
    _n, _lab = cv2.connectedComponents(_dark, connectivity=4)
    _border = set(np.unique(np.concatenate([_lab[0], _lab[-1], _lab[:, 0], _lab[:, -1]]))) - {0}
    _outside = np.isin(_lab, list(_border)).astype(np.uint8)
    _alpha = cv2.GaussianBlur((255 - _outside * 255).astype(np.float32), (0, 0), 1.2)
    _btn = Image.fromarray(np.dstack([_rgb.astype(np.uint8), np.clip(_alpha, 0, 255).astype(np.uint8)]), 'RGBA')
    _btn = _btn.resize((1500, round(1500 * _btn.height / _btn.width)), Image.LANCZOS)
    return _btn


def frameTop(ctx: dict) -> Image.Image:
    """Synthesise the north gold bar from the emitted rail-mid's gold
    cross-section — oracle lines verbatim. Reads rail-mid.webp from the
    spec's own output dir (piece ordering: rail-mid emits first)."""
    out_dir = ctx['out_dir']
    _rm = np.array(Image.open(os.path.join(out_dir, 'rail-mid.webp')).convert('RGBA')).astype(float)
    _prof = np.median(_rm[:, 54:72, :], axis=0)                 # 18 x RGBA: the rail's gold cross-section (median kills the vines)
    _prof[:, 3] = 255
    _prof = np.concatenate([_prof, _prof[::-1]], axis=0)[:30:2] if False else _prof
    _h = _prof.shape[0]
    _arr = np.repeat(_prof[:, None, :], 936, axis=1)             # horizontal bar: same cross-section along the whole length
    _rng = np.random.default_rng(5); _arr[..., :3] += _rng.normal(0, 2.0, _arr[..., :3].shape)
    _bar = Image.fromarray(np.clip(_arr, 0, 255).astype('uint8'), 'RGBA')
    _full = Image.new('RGBA', (936, _h + 6), (0, 0, 0, 0)); _full.alpha_composite(_bar, (0, 0))
    _hair = Image.new('RGBA', (936, 3), (0, 0, 0, 0)); ImageDraw.Draw(_hair).rectangle((0, 1, 936, 1), fill=(224, 196, 120, 150)); _full.alpha_composite(_hair, (0, _h + 2))
    return _full
