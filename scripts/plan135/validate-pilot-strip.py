#!/usr/bin/env python3
"""Validate one generated PLAN-135 pilot strip before it can be ingested.

Hard gates: exact size/opacity, painted-reference repaint budget, strict outer-water
band, independent-land components, and canvas/apron seam metrics by join class.
"""
import argparse
import json
import sys

import cv2
import numpy as np
from PIL import Image

from pilotlib import (
    ROOT, SPEC_DIR, crop_local_rect, inclusive_height, inclusive_width,
    load_base_rgb, load_json, opened_water_mask, positive_rect, rel,
    seam_metric_values, compare_metric_row, sha256_file, srgb_to_lab,
    slice_inclusive, write_json,
)


def mean_std_metrics(reference, generated):
    ref = reference.astype(np.float32) / 255.0
    gen = generated.astype(np.float32) / 255.0
    rgb_mean_abs = [float(v) for v in np.mean(np.abs(ref - gen), axis=(0, 1))]
    blur_ref = cv2.GaussianBlur(ref, (0, 0), 32)
    blur_gen = cv2.GaussianBlur(gen, (0, 0), 32)
    lowfreq = [float(v) for v in np.mean(np.abs(blur_ref - blur_gen), axis=(0, 1))]
    lab_ref = srgb_to_lab(reference)
    lab_gen = srgb_to_lab(generated)
    delta = np.linalg.norm(lab_ref - lab_gen, axis=2)
    return {
        'rgbMeanAbsNormalized': rgb_mean_abs,
        'maxRgbMeanAbsNormalized': float(max(rgb_mean_abs)),
        'lowFreqRgbMeanAbsNormalized': lowfreq,
        'maxLowFreqRgbMeanAbsNormalized': float(max(lowfreq)),
        'meanDeltaE': float(np.mean(delta)),
        'p95DeltaE': float(np.percentile(delta, 95)),
    }


def aggregate_samples(samples):
    out = {}
    for key in ('photoRgbMeanAbs', 'lowFreqRgbMeanAbs'):
        out[key] = [float(v) for v in np.mean(np.array([s[key] for s in samples]), axis=0)]
    for key in ('photoLumMeanAbs', 'gradientContinuityMeanAbs'):
        out[key] = float(np.mean([s[key] for s in samples]))
    return out


def canvas_join_metrics(comp_rgb_float, crop):
    src = crop['sourceRegionWorldPx']
    ref = crop['paintedReferenceWorldPx']
    kept = crop['keptRegionWorldPx']
    if crop['strip'] == 'top':
        span = {'x0': max(ref['x0'], kept['x0']), 'x1': min(ref['x1'], kept['x1'])}
        if span['x1'] < span['x0']:
            return {'status': 'NOT_APPLICABLE', 'reason': 'no painted x-span adjoining the kept top apron'}
    else:
        span = {'y0': max(ref['y0'], kept['y0']), 'y1': min(ref['y1'], kept['y1'])}
        if span['y1'] < span['y0']:
            return {'status': 'NOT_APPLICABLE', 'reason': 'no painted y-span adjoining the kept side apron'}
    samples = []
    positions = []
    if crop['strip'] == 'top':
        edge_y = 0 - src['y0']
        max_start = span['x1'] - 63
        x = span['x0']
        while x <= max_start:
            cx = x - src['x0']
            if cx - 4 >= 0 and cx + 64 <= comp_rgb_float.shape[1] and edge_y - 4 >= 0 and edge_y + 4 <= comp_rgb_float.shape[0]:
                samples.append(seam_metric_values(comp_rgb_float, cx, edge_y, False))
                positions.append({'x': x, 'y': 0})
            x += 64
    else:
        edge_x = (0 if crop['strip'] == 'left' else 2752) - src['x0']
        max_start = span['y1'] - 63
        y = span['y0']
        while y <= max_start:
            cy = y - src['y0']
            if cy - 4 >= 0 and cy + 64 <= comp_rgb_float.shape[0] and edge_x - 4 >= 0 and edge_x + 4 <= comp_rgb_float.shape[1]:
                samples.append(seam_metric_values(comp_rgb_float, edge_x, cy, True))
                positions.append({'x': 0 if crop['strip'] == 'left' else 2752, 'y': y})
            y += 64
    if not samples:
        return {'status': 'INSUFFICIENT_SAMPLES', 'positions': []}
    return {'status': 'MEASURED', 'aggregate': aggregate_samples(samples), 'sampleCount': len(samples), 'positions': positions}


def component_review(kept_rgb, crop, classifier):
    water = opened_water_mask(kept_rgb, classifier['waterSwatches'], classifier['waterRadiusDeltaE'])
    land = (1 - water).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(land, connectivity=8)
    kept_world = crop['keptRegionWorldPx']
    outer = crop['outerWaterBands'] if 'outerWaterBands' in crop else None
    hard = []
    review = []
    outer_violations = []
    hard_area = classifier['independentLandHardFail']['areaPx2']
    hard_span = classifier['independentLandHardFail']['bboxMaxSidePx']
    # continuation zones are evaluated in the kept-local frame; corner crops use the union
    continuation_rects = crop.get('continuationZonesWorldPx', [])
    outer_rects = crop.get('outerWaterRectsWorldPx', [])
    for label in range(1, count):
        x, y, w, h, area = [int(v) for v in stats[label]]
        if area <= 0:
            continue
        comp_mask = labels == label
        touches_continuation = False
        touches_outer = False
        for z in continuation_rects:
            inter, local = crop_local_rect(z, {'sourceRegionWorldPx': kept_world})
            if inter and positive_rect(inter):
                zone_mask = np.zeros_like(comp_mask)
                zone_mask[local['y0']:local['y1'] + 1, local['x0']:local['x1'] + 1] = True
                if np.logical_and(comp_mask, zone_mask).any():
                    touches_continuation = True
        for z in outer_rects:
            inter, local = crop_local_rect(z, {'sourceRegionWorldPx': kept_world})
            if inter and positive_rect(inter):
                zone_mask = np.zeros_like(comp_mask)
                zone_mask[local['y0']:local['y1'] + 1, local['x0']:local['x1'] + 1] = True
                if np.logical_and(comp_mask, zone_mask).any():
                    touches_outer = True
        row = {'areaPx2': area, 'bboxPx': {'x': x, 'y': y, 'width': w, 'height': h}, 'touchesContinuation': touches_continuation, 'touchesOuterStrictBand': touches_outer}
        if touches_outer:
            outer_violations.append(row)
        if not touches_continuation and (area >= hard_area or max(w, h) >= hard_span):
            hard.append(row)
        elif not touches_continuation:
            review.append(row)
    return {
        'waterPixelRatio': float(np.mean(water)),
        'landComponentCount': count - 1,
        'outerStrictViolations': outer_violations,
        'independentHardFailComponents': hard,
        'reviewComponents': review,
    }


def enrich_crop_geometry(crop, crop_plan):
    kept = crop['keptRegionWorldPx']
    zones = crop_plan['outerWaterBands']['continuationZones']
    outers = {k: v for k, v in crop_plan['outerWaterBands'].items() if k in ('top', 'left', 'right')}
    relevant_zones = []
    relevant_outers = []
    # A crop uses the continuation/outer rules for every strict band its kept rect intersects.
    for key, zone in zones.items():
        inter, _ = crop_local_rect(zone, {'sourceRegionWorldPx': kept})
        if inter and positive_rect(inter):
            relevant_zones.append(zone)
        elif crop['joinClass'] == 'corner' and key in ('left', 'right') and zone['x1'] >= kept['x0'] and zone['x0'] <= kept['x1']:
            # PLAN-135 §10.6: in corners the union of the side rules applies even
            # where the side band's canonical y range starts at y=0.
            relevant_zones.append({**zone, 'y0': kept['y0'], 'y1': kept['y1']})
    for key, outer in outers.items():
        inter, _ = crop_local_rect(outer, {'sourceRegionWorldPx': kept})
        if inter and positive_rect(inter):
            relevant_outers.append(outer)
        elif crop['joinClass'] == 'corner' and key in ('left', 'right') and outer['x1'] >= kept['x0'] and outer['x0'] <= kept['x1']:
            relevant_outers.append({**outer, 'y0': kept['y0'], 'y1': kept['y1']})
    c = dict(crop)
    c['continuationZonesWorldPx'] = relevant_zones
    c['outerWaterRectsWorldPx'] = relevant_outers
    return c


def validate(crop_id, image_path, out_path=None):
    crop_plan = load_json(SPEC_DIR / 'crop-plan.json')
    feasibility = load_json(SPEC_DIR / 'feasibility.json')
    raw_crop = next((c for c in crop_plan['crops'] if c['id'] == crop_id), None)
    if raw_crop is None:
        raise SystemExit(f'unknown crop {crop_id}')
    crop = enrich_crop_geometry(raw_crop, crop_plan)
    errors = []
    flags = []
    image = Image.open(image_path).convert('RGBA')
    arr = np.array(image)
    expected = crop['outputSizePx']
    if image.width != expected['width'] or image.height != expected['height']:
        errors.append(f'dimensions {image.width}x{image.height} != expected {expected["width"]}x{expected["height"]}')
    src = crop['sourceRegionWorldPx']
    if inclusive_width(src) != image.width or inclusive_height(src) != image.height:
        errors.append('scale lock cannot be verified: source rect does not match output dimensions at 1:1')
    if arr[..., 3].min() < 255:
        errors.append('generated output has transparent pixels; pilot requires a fully opaque finished image')
    rgb = arr[..., :3]
    if errors:
        payload = {
            'schema': 'plan135-pilot-strip-validation/v1',
            'cropId': crop_id,
            'image': {'path': rel(image_path), 'sha256': sha256_file(image_path)},
            'status': 'FAIL',
            'errors': errors,
            'reviewFlags': [],
            'earlyExit': 'dimension/scale/opacity hard failure; semantic repaint, seam and land metrics are not meaningful on a wrongly sized output',
        }
        if out_path:
            write_json(out_path, payload)
        return payload
    base = load_base_rgb()
    repaint = None
    ref = crop['paintedReferenceWorldPx']
    inter, local = crop_local_rect(ref, crop)
    if inter and positive_rect(inter):
        reference = slice_inclusive(base, inter)
        generated = rgb[local['y0']:local['y1'] + 1, local['x0']:local['x1'] + 1]
        repaint = mean_std_metrics(reference, generated)
        rule = feasibility['frozenConstants']['pilotKillCriteria']['repaintReference']
        if repaint['meanDeltaE'] > rule['maxMeanDeltaE']:
            errors.append(f'painted reference meanDeltaE {repaint["meanDeltaE"]:.4f} > {rule["maxMeanDeltaE"]}')
        if repaint['p95DeltaE'] > rule['maxP95DeltaE']:
            errors.append(f'painted reference p95DeltaE {repaint["p95DeltaE"]:.4f} > {rule["maxP95DeltaE"]}')
        if repaint['maxRgbMeanAbsNormalized'] > rule['maxRgbMeanAbsNormalized']:
            errors.append(f'painted reference rgbMeanAbs {repaint["maxRgbMeanAbsNormalized"]:.4f} > {rule["maxRgbMeanAbsNormalized"]}')
        if repaint['maxLowFreqRgbMeanAbsNormalized'] > rule['maxLowFreqRgbMeanAbsNormalized']:
            errors.append(f'painted reference lowFreqRgbMeanAbs {repaint["maxLowFreqRgbMeanAbsNormalized"]:.4f} > {rule["maxLowFreqRgbMeanAbsNormalized"]}')
    else:
        errors.append('missing painted reference overlap')
    # Seam continuity uses original painted pixels inside the canvas and generated pixels outside it.
    seam_rgb = rgb.copy()
    if inter and positive_rect(inter):
        seam_rgb[local['y0']:local['y1'] + 1, local['x0']:local['x1'] + 1] = slice_inclusive(base, inter)
    seam = canvas_join_metrics(seam_rgb.astype(np.float32) / 255.0, crop)
    seam_check = None
    if seam.get('status') == 'MEASURED':
        p95 = feasibility['seamMetricSet']['baselinesByJoinClass'][crop['joinClass']]['p95']
        seam_ok, seam_check = compare_metric_row(seam['aggregate'], p95)
        if not seam_ok:
            errors.append(f'canvas seam aggregate exceeds frozen {crop["joinClass"]} p95')
    else:
        errors.append(f'canvas seam not measurable: {seam.get("status")}')
    # Water/land review only on the exclusive kept apron region.
    kept_inter, kept_local = crop_local_rect(crop['keptRegionWorldPx'], crop)
    land_review = None
    if kept_inter and positive_rect(kept_inter):
        kept_rgb = rgb[kept_local['y0']:kept_local['y1'] + 1, kept_local['x0']:kept_local['x1'] + 1]
        # component_review needs coordinates relative to the kept rect itself.
        kept_crop = dict(crop)
        kept_crop['sourceRegionWorldPx'] = crop['keptRegionWorldPx']
        land_review = component_review(kept_rgb, kept_crop, feasibility['classifier'])
        if land_review['outerStrictViolations']:
            errors.append(f'outer strict water band has {len(land_review["outerStrictViolations"])} land component(s)')
        if land_review['independentHardFailComponents']:
            errors.append(f'independent land hard-fail components: {len(land_review["independentHardFailComponents"])}')
        if land_review['reviewComponents']:
            flags.append(f'{len(land_review["reviewComponents"])} minor independent component(s) require human review')
    else:
        errors.append('kept region is not measurable inside the generated crop')
    status = 'FAIL' if errors else ('PASS_WITH_REVIEW_FLAGS' if flags else 'PASS')
    payload = {
        'schema': 'plan135-pilot-strip-validation/v1',
        'cropId': crop_id,
        'image': {'path': rel(image_path), 'sha256': sha256_file(image_path)},
        'status': status,
        'errors': errors,
        'reviewFlags': flags,
        'repaintReference': repaint,
        'canvasSeam': {'measurement': seam, 'thresholdCheck': seam_check, 'joinClass': crop['joinClass']},
        'landReview': land_review,
    }
    if out_path:
        write_json(out_path, payload)
    return payload


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--crop', required=True)
    ap.add_argument('--image', required=True)
    ap.add_argument('--out')
    args = ap.parse_args()
    payload = validate(args.crop, args.image, args.out)
    print(json.dumps({'status': payload['status'], 'errors': payload['errors'], 'reviewFlags': payload['reviewFlags']}))
    sys.exit(2 if payload['status'] == 'FAIL' else 0)


if __name__ == '__main__':
    main()
