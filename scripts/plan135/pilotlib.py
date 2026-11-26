"""Shared deterministic geometry/colour helpers for the PLAN-135 pilot.

All crop/ownership rectangles in crop-plan.json are inclusive integer pixel
ranges at 1 image px = 1 world px. The apron world rect is instead a continuous
edge rect; its valid inclusive pixel span is [-560,3311] x [-200,1535].
"""
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SPEC_DIR = ROOT / '.mw/specs/mappa2-apron'
PILOT_DIR = SPEC_DIR / 'pilot'
BASE_PATH = ROOT / 'public/assets/world/mappa2/base/layers/base_flat.v2.webp'
CANVAS = {'width': 2752, 'height': 1536}
WORLD_CONT = {'x0': -560, 'y0': -200, 'x1': 3312, 'y1': 1536}
WORLD_INCLUSIVE = {'x0': -560, 'y0': -200, 'x1': 3311, 'y1': 1535}
EXPANDED_OFFSET = {'x': 560, 'y': 200}
EXPANDED_SIZE = {'width': 3872, 'height': 1736}


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def rel(path):
    return str(Path(path).resolve().relative_to(ROOT))


def load_json(path):
    return json.loads(Path(path).read_text())


def write_json(path, payload):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + '\n')


def inclusive_width(r):
    return r['x1'] - r['x0'] + 1


def inclusive_height(r):
    return r['y1'] - r['y0'] + 1


def intersect_rect(a, b):
    return {
        'x0': max(a['x0'], b['x0']),
        'y0': max(a['y0'], b['y0']),
        'x1': min(a['x1'], b['x1']),
        'y1': min(a['y1'], b['y1']),
    }


def positive_rect(r):
    return r['x1'] >= r['x0'] and r['y1'] >= r['y0']


def crop_local_rect(world_rect, crop):
    """Intersect an inclusive world rect with a crop source rect and return crop-local inclusive coords."""
    src = crop['sourceRegionWorldPx']
    inter = intersect_rect(world_rect, src)
    if not positive_rect(inter):
        return None, None
    local = {
        'x0': inter['x0'] - src['x0'],
        'y0': inter['y0'] - src['y0'],
        'x1': inter['x1'] - src['x0'],
        'y1': inter['y1'] - src['y0'],
    }
    return inter, local


def slice_inclusive(arr, r):
    return arr[r['y0']:r['y1'] + 1, r['x0']:r['x1'] + 1]


def load_base_rgb():
    return np.array(Image.open(BASE_PATH).convert('RGB'))


def load_rgba(path):
    return np.array(Image.open(path).convert('RGBA'))


def srgb_to_lab(rgb):
    """uint8/float RGB array -> CIELAB D65, same constants as the frozen baseline."""
    rgb = rgb.astype(np.float32)
    if rgb.max(initial=0) > 1.5:
        rgb = rgb / 255.0
    linear = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    xyz = linear @ np.array([[0.4124, 0.2126, 0.0193], [0.3576, 0.7152, 0.1192], [0.1805, 0.0722, 0.9505]], dtype=np.float32)
    white = np.array([0.95047, 1.0, 1.08883], dtype=np.float32)
    q = xyz / white
    f = np.where(q > 0.008856, q ** (1 / 3), 7.787 * q + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def lab_to_srgb(lab):
    """CIELAB D65 -> sRGB float 0..1, inverse of srgb_to_lab."""
    lab = lab.astype(np.float32)
    fy = (lab[..., 0] + 16.0) / 116.0
    fx = fy + lab[..., 1] / 500.0
    fz = fy - lab[..., 2] / 200.0
    def invf(f):
        return np.where(f ** 3 > 0.008856, f ** 3, (f - 16.0 / 116.0) / 7.787)
    white = np.array([0.95047, 1.0, 1.08883], dtype=np.float32)
    xyz = np.stack([invf(fx), invf(fy), invf(fz)], axis=-1) * white
    m = np.array([[0.4124, 0.2126, 0.0193], [0.3576, 0.7152, 0.1192], [0.1805, 0.0722, 0.9505]], dtype=np.float32)
    linear = xyz @ np.linalg.inv(m)
    rgb = np.where(linear <= 0.0031308, 12.92 * linear, 1.055 * np.power(np.maximum(linear, 0), 1 / 2.4) - 0.055)
    return np.clip(rgb, 0.0, 1.0).astype(np.float32)


def luminance(rgb):
    rgb = rgb.astype(np.float32)
    if rgb.max(initial=0) > 1.5:
        rgb = rgb / 255.0
    return (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]).astype(np.float32)


def water_mask_for_rgb(rgb, swatches, radius_delta_e):
    """Classify water by the frozen CIELAB palette. Input is uint8 RGB."""
    lab = srgb_to_lab(rgb).reshape(-1, 3)
    best = np.full(lab.shape[0], np.inf, dtype=np.float32)
    for swatch in swatches:
        mean = np.array(swatch['meanLab'], dtype=np.float32)
        d = np.linalg.norm(lab - mean, axis=1)
        best = np.minimum(best, d)
    return (best.reshape(rgb.shape[:2]) <= radius_delta_e).astype(np.uint8)


def opened_water_mask(rgb, swatches, radius_delta_e):
    raw = water_mask_for_rgb(rgb, swatches, radius_delta_e)
    kernel = np.ones((3, 3), dtype=np.uint8)
    return cv2.morphologyEx(raw, cv2.MORPH_OPEN, kernel)


def expanded_xy(world_x, world_y):
    return world_x + EXPANDED_OFFSET['x'], world_y + EXPANDED_OFFSET['y']


def expanded_rect(world_rect):
    x0, y0 = expanded_xy(world_rect['x0'], world_rect['y0'])
    x1, y1 = expanded_xy(world_rect['x1'], world_rect['y1'])
    return {'x0': x0, 'y0': y0, 'x1': x1, 'y1': y1}


def seam_metric_values(rgb, x, y, vertical):
    """Same metric definitions as measure-painting-baseline.py. rgb is float 0..1."""
    lum = luminance(rgb)
    blur = cv2.GaussianBlur(rgb, (0, 0), 32)
    gray = (lum * 255).astype(np.uint8)
    sobelx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    if vertical:
        a = rgb[y:y + 64, x - 4:x]
        b = rgb[y:y + 64, x:x + 4]
        la = lum[y:y + 64, x - 4:x]
        lb = lum[y:y + 64, x:x + 4]
        ba = blur[y:y + 64, x - 4:x]
        bb = blur[y:y + 64, x:x + 4]
        grad = float(np.mean(np.abs(sobelx[y:y + 64, x - 1] - sobelx[y:y + 64, x + 1])))
    else:
        a = rgb[y - 4:y, x:x + 64]
        b = rgb[y:y + 4, x:x + 64]
        la = lum[y - 4:y, x:x + 64]
        lb = lum[y:y + 4, x:x + 64]
        ba = blur[y - 4:y, x:x + 64]
        bb = blur[y:y + 4, x:x + 64]
        grad = float(np.mean(np.abs(sobely[y - 1, x:x + 64] - sobely[y + 1, x:x + 64])))
    return {
        'photoRgbMeanAbs': [float(v) for v in np.mean(np.abs(a - b), axis=(0, 1))],
        'photoLumMeanAbs': float(np.mean(np.abs(la - lb))),
        'lowFreqRgbMeanAbs': [float(v) for v in np.mean(np.abs(ba - bb), axis=(0, 1))],
        'gradientContinuityMeanAbs': grad,
    }


def compare_metric_row(value, threshold):
    checks = {}
    ok = True
    for key in ('photoRgbMeanAbs', 'lowFreqRgbMeanAbs'):
        checks[key] = {
            'value': [round(float(v), 8) for v in value[key]],
            'threshold': threshold[key],
            'pass': all(float(v) <= float(t) for v, t in zip(value[key], threshold[key])),
        }
        ok = ok and checks[key]['pass']
    for key in ('photoLumMeanAbs', 'gradientContinuityMeanAbs'):
        checks[key] = {
            'value': round(float(value[key]), 8),
            'threshold': threshold[key],
            'pass': float(value[key]) <= float(threshold[key]),
        }
        ok = ok and checks[key]['pass']
    return ok, checks
