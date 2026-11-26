#!/usr/bin/env python3
"""Freeze PLAN-135 seam/classifier baselines from the approved 1x mappa2 painting."""
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'public/assets/world/mappa2/base/layers/base_flat.v2.webp'
SEA = ROOT / 'public/assets/world/mappa2/base/layers/Mare.v2.webp'
OUT_DIR = ROOT / '.mw/specs/mappa2-apron'
OUT = OUT_DIR / 'painting-baseline.json'
RAW_MASK = OUT_DIR / 'water-mask-raw.png'
OPENED_MASK = OUT_DIR / 'water-mask-opened-3x3.png'


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


OUT_DIR.mkdir(parents=True, exist_ok=True)
rgb = np.array(Image.open(BASE).convert('RGB')).astype(np.float32) / 255.0
sea_alpha = np.array(Image.open(SEA).convert('RGBA'))[..., 3]
water_mask = (sea_alpha == 255).astype(np.uint8)
h, w, _ = rgb.shape

kernel = np.ones((3, 3), dtype=np.uint8)
opened_water_mask = cv2.morphologyEx(water_mask, cv2.MORPH_OPEN, kernel)
Image.fromarray((water_mask * 255).astype(np.uint8), mode='L').save(RAW_MASK, optimize=True)
Image.fromarray((opened_water_mask * 255).astype(np.uint8), mode='L').save(OPENED_MASK, optimize=True)

# sRGB -> CIE XYZ D65 -> CIELAB, vectorized and deterministic.
linear = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
xyz = linear @ np.array([[0.4124, 0.2126, 0.0193], [0.3576, 0.7152, 0.1192], [0.1805, 0.0722, 0.9505]], dtype=np.float32)
white = np.array([0.95047, 1.0, 1.08883], dtype=np.float32)
q = xyz / white
f = np.where(q > 0.008856, q ** (1 / 3), 7.787 * q + 16 / 116)
lab = np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)
lum = (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]).astype(np.float32)

# Water palette: deterministic lattice, only patches that are entirely sea in Mare alpha.
swatches = []
size = 16
for y in range(24, h - size - 24, 128):
    for x in range(24, w - size - 24, 128):
        patch = water_mask[y:y + size, x:x + size]
        if not patch.all():
            continue
        vals = lab[y:y + size, x:x + size].reshape(-1, 3)
        mean = vals.mean(axis=0)
        dist = np.linalg.norm(vals - mean, axis=1)
        patch_p95 = float(np.percentile(dist, 95))
        if patch_p95 > 8.0:
            # Foam, strong wave texture and steep shallow-water gradients are poor
            # reference colours. They remain reviewable pixels, not palette anchors.
            continue
        swatches.append({
            'x': x,
            'y': y,
            'size': size,
            'meanLab': [round(float(v), 4) for v in mean],
            'patchP95DeltaE': round(patch_p95, 4),
            'radiusDeltaE': round(max(18.0, patch_p95 + 6.0), 4),
        })
if len(swatches) < 6:
    raise SystemExit(f'not enough clean water swatches: {len(swatches)}')
water_radius = round(max(s['radiusDeltaE'] for s in swatches), 4)

blur = cv2.GaussianBlur(rgb, (0, 0), 32)
gray = (lum * 255).astype(np.uint8)
sobelx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
sobely = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)


def seam_metrics(x, y, vertical):
    if vertical:
        a = rgb[y:y + 64, x - 4:x]
        b = rgb[y:y + 64, x:x + 4]
        la = lum[y:y + 64, x - 4:x]
        lb = lum[y:y + 64, x:x + 4]
        ba = blur[y:y + 64, x - 4:x]
        bb = blur[y:y + 64, x:x + 4]
        grad = float(np.mean(np.abs(sobelx[y:y + 64, x - 1] - sobelx[y:y + 64, x + 1])))
        landfrac = float(1 - water_mask[y:y + 64, x - 4:x + 4].mean())
    else:
        a = rgb[y - 4:y, x:x + 64]
        b = rgb[y:y + 4, x:x + 64]
        la = lum[y - 4:y, x:x + 64]
        lb = lum[y:y + 4, x:x + 64]
        ba = blur[y - 4:y, x:x + 64]
        bb = blur[y:y + 4, x:x + 64]
        grad = float(np.mean(np.abs(sobely[y - 1, x:x + 64] - sobely[y + 1, x:x + 64])))
        landfrac = float(1 - water_mask[y - 4:y + 4, x:x + 64].mean())
    return {
        'photoRgbMeanAbs': [float(v) for v in np.mean(np.abs(a - b), axis=(0, 1))],
        'photoLumMeanAbs': float(np.mean(np.abs(la - lb))),
        'lowFreqRgbMeanAbs': [float(v) for v in np.mean(np.abs(ba - bb), axis=(0, 1))],
        'gradientContinuityMeanAbs': grad,
        'landFraction': landfrac,
    }


def percentile(rows, key):
    vals = [r[key] for r in rows]
    if isinstance(vals[0], list):
        return [round(float(v), 8) for v in np.percentile(np.array(vals), 95, axis=0)]
    return round(float(np.percentile(vals, 95)), 8)


def lattice_rows():
    rows = []
    for y in range(96, h - 96, 128):
        for x in range(128, w - 128, 128):
            for vertical in (True, False):
                if x + 64 >= w or y + 64 >= h or x < 4 or y < 4:
                    continue
                metrics = seam_metrics(x, y, vertical)
                rows.append({
                    'x': x,
                    'y': y,
                    'orientation': 'vertical' if vertical else 'horizontal',
                    'landFraction': round(metrics['landFraction'], 8),
                    'metrics': metrics,
                })
    return rows


rows = lattice_rows()


def select_rows(kind):
    if kind == 'coast-crossing':
        return [r for r in rows if 0.05 <= r['landFraction'] <= 0.95]
    if kind == 'open-water':
        return [r for r in rows if r['landFraction'] <= 0.02]
    if kind == 'corner':
        return [r for r in rows if (r['x'] < 384 or r['x'] > w - 384) and (r['y'] < 384 or r['y'] > h - 384)]
    raise ValueError(kind)


def selection_rule(kind):
    if kind == 'coast-crossing':
        return 'lattice positions whose 64px x 8px seam neighbourhood has 5%..95% land coverage in the raw Mare alpha mask'
    if kind == 'open-water':
        return 'lattice positions whose seam neighbourhood has at most 2% land coverage in the raw Mare alpha mask'
    if kind == 'corner':
        return 'lattice positions within 384px of a painted-canvas corner in both axes; internal corner proxy because apron corners do not exist in the source painting'
    raise ValueError(kind)


def baselines_for(kind):
    selected = select_rows(kind)
    metric_rows = [r['metrics'] for r in selected]
    if len(metric_rows) < 4:
        return {'status': 'INSUFFICIENT_BASELINE', 'sampleCount': len(metric_rows), 'selectionRule': selection_rule(kind)}
    return {
        'sampleCount': len(metric_rows),
        'selectionRule': selection_rule(kind),
        'stripPx': 4,
        'patchLengthPx': 64,
        'blurSigmaPx': 32,
        'positions': [{k: r[k] for k in ('x', 'y', 'orientation', 'landFraction')} for r in selected],
        'p95': {k: percentile(metric_rows, k) for k in ['photoRgbMeanAbs', 'photoLumMeanAbs', 'lowFreqRgbMeanAbs', 'gradientContinuityMeanAbs']},
    }


source_images = {
    'painting': {'path': rel(BASE), 'sha256': sha256(BASE), 'width': w, 'height': h},
    'seaAlpha': {'path': rel(SEA), 'sha256': sha256(SEA), 'width': int(sea_alpha.shape[1]), 'height': int(sea_alpha.shape[0])},
}
raw_mask_ref = {'path': rel(RAW_MASK), 'sha256': sha256(RAW_MASK), 'encoding': 'PNG grayscale: 255=water, 0=non-water, derived as Mare alpha==255'}
opened_mask_ref = {'path': rel(OPENED_MASK), 'sha256': sha256(OPENED_MASK), 'encoding': 'PNG grayscale after cv2.MORPH_OPEN square 3x3 on raw water mask'}

payload = {
    'schema': 'plan135-painting-baseline/v2',
    'generatedBy': 'scripts/plan135/measure-painting-baseline.py',
    'generatorSha256': sha256(Path(__file__).resolve()),
    'coordinateSystem': '1 image px = 1 world px; integer x/y are source pixel indices',
    'sourceImages': source_images,
    'classifier': {
        'colorSpace': 'CIELAB D65',
        'distance': 'deltaEab-euclidean',
        'scale': '1 image px = 1 world px',
        'swatchReference': {'path': source_images['painting']['path'], 'sha256': source_images['painting']['sha256']},
        'waterSwatches': swatches,
        'swatchSelectionRule': '16px patch fully water in raw Mare alpha and homogeneous (patch P95 deltaE <= 8); radius = max(18, patchP95+6)',
        'waterRadiusDeltaE': water_radius,
        'waterMask': raw_mask_ref,
        'waterMaskAfterOpening': opened_mask_ref,
        'morphologicalOpening': {'kernel': 'square', 'sizePx': 3, 'operation': 'cv2.MORPH_OPEN on binary water mask'},
        'independentLandHardFail': {'areaPx2': 64, 'bboxMaxSidePx': 8},
    },
    'seamMetricSet': {
        'samplingMask': raw_mask_ref,
        'lattice': {
            'originPx': {'x': 128, 'y': 96},
            'stridePx': {'x': 128, 'y': 128},
            'orientations': ['vertical', 'horizontal'],
            'stripPx': 4,
            'patchLengthPx': 64,
            'candidateCount': len(rows),
        },
        'metrics': [
            'photometric mean absolute sRGB per-channel, normalized 0..1',
            'photometric mean absolute luminance, normalized 0..1',
            'low-frequency mean absolute sRGB after blur sigma 32px, normalized 0..1',
            'Sobel gradient continuity across join, 0..255 grayscale delta',
        ],
        'baselinesByJoinClass': {k: baselines_for(k) for k in ['coast-crossing', 'open-water', 'corner']},
    },
}
text = json.dumps(payload, indent=2) + '\n'
if not OUT.exists() or OUT.read_text() != text:
    OUT.write_text(text)
print(json.dumps({
    'out': rel(OUT),
    'swatches': len(swatches),
    'classes': {k: v.get('sampleCount') for k, v in payload['seamMetricSet']['baselinesByJoinClass'].items()},
    'masks': [raw_mask_ref['sha256'][:12], opened_mask_ref['sha256'][:12]],
}))
