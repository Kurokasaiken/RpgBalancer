#!/usr/bin/env python3
"""Validate the accepted 3-strip pilot composite, including strip/ownership seams."""
import argparse
import json
import sys

import numpy as np
from PIL import Image

from pilotlib import (
    EXPANDED_SIZE, PILOT_DIR, SPEC_DIR, compare_metric_row, expanded_rect,
    load_json, seam_metric_values, sha256_file, write_json,
)

COMPOSITE_PATH = PILOT_DIR / 'apron-composite.png'
STATE_PATH = PILOT_DIR / 'pilot-state.json'


def aggregate(samples):
    out = {}
    for key in ('photoRgbMeanAbs', 'lowFreqRgbMeanAbs'):
        out[key] = [float(v) for v in np.mean(np.array([s[key] for s in samples]), axis=0)]
    for key in ('photoLumMeanAbs', 'gradientContinuityMeanAbs'):
        out[key] = float(np.mean([s[key] for s in samples]))
    return out


def alpha_ok(alpha, ex, ey, vertical):
    if vertical:
        return alpha[ey:ey + 64, ex - 4:ex + 4].size > 0 and bool((alpha[ey:ey + 64, ex - 4:ex + 4] > 0).all())
    return alpha[ey - 4:ey + 4, ex:ex + 64].size > 0 and bool((alpha[ey - 4:ey + 4, ex:ex + 64] > 0).all())


def boundary_metrics(rgb, alpha, boundary_world_x=None, boundary_world_y=None, span=None, vertical=True, stride=64):
    samples = []
    positions = []
    missing = []
    if vertical:
        ex = boundary_world_x + 560
        y = span['y0']
        while y <= span['y1'] - 63:
            ey = y + 200
            if alpha_ok(alpha, ex, ey, True):
                samples.append(seam_metric_values(rgb, ex, ey, True))
                positions.append({'x': boundary_world_x, 'y': y})
            else:
                missing.append({'x': boundary_world_x, 'y': y})
            y += stride
    else:
        ey = boundary_world_y + 200
        x = span['x0']
        while x <= span['x1'] - 63:
            ex = x + 560
            if alpha_ok(alpha, ex, ey, False):
                samples.append(seam_metric_values(rgb, ex, ey, False))
                positions.append({'x': x, 'y': boundary_world_y})
            else:
                missing.append({'x': x, 'y': boundary_world_y})
            x += stride
    return {'sampleCount': len(samples), 'positions': positions, 'missingPositions': missing, 'aggregate': aggregate(samples) if samples else None}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(PILOT_DIR / 'validations' / 'pilot-composite.json'))
    args = ap.parse_args()
    errors = []
    if not STATE_PATH.exists():
        raise SystemExit('pilot-state.json missing: no accepted strips')
    state = load_json(STATE_PATH)
    accepted = [r['cropId'] for r in state.get('accepted', [])]
    required = ['top-05', 'top-04', 'right-01']
    missing = [c for c in required if c not in accepted]
    if missing:
        errors.append(f'pilot incomplete; missing accepted strips: {missing}')
    if not COMPOSITE_PATH.exists():
        errors.append('apron composite missing')
        comp = None
    else:
        comp = np.array(Image.open(COMPOSITE_PATH).convert('RGBA'))
    checks = {}
    if comp is not None:
        if comp.shape[:2] != (EXPANDED_SIZE['height'], EXPANDED_SIZE['width']):
            errors.append(f'composite dimensions {comp.shape[1]}x{comp.shape[0]} != {EXPANDED_SIZE["width"]}x{EXPANDED_SIZE["height"]}')
        rgb = comp[..., :3].astype(np.float32) / 255.0
        alpha = comp[..., 3]
        feasibility = load_json(SPEC_DIR / 'feasibility.json')
        # Vertical strip-strip ownership seam: top-04 | top-05, x=2288, y=-200..-1.
        rows = {}
        rows['top-04:top-05'] = boundary_metrics(rgb, alpha, boundary_world_x=2288, span={'y0': -200, 'y1': -1}, vertical=True)
        # Horizontal corner ownership seam: top-05 over right-01, y=0, x=2752..3311.
        rows['top-05/right-01:corner-ownership'] = boundary_metrics(rgb, alpha, boundary_world_y=0, span={'x0': 2752, 'x1': 3311}, vertical=False)
        for name, row in rows.items():
            if row['missingPositions']:
                errors.append(f'{name}: missing composite pixels at {len(row["missingPositions"])} lattice position(s)')
            if not row['aggregate']:
                errors.append(f'{name}: no measurable seam samples')
                continue
            p95 = feasibility['seamMetricSet']['baselinesByJoinClass']['corner']['p95']
            ok, detail = compare_metric_row(row['aggregate'], p95)
            checks[name] = {'measurement': row, 'thresholdCheck': detail}
            if not ok:
                errors.append(f'{name}: seam aggregate exceeds frozen corner p95')
    status = 'FAIL' if errors else 'PASS'
    payload = {
        'schema': 'plan135-pilot-composite-validation/v1',
        'status': status,
        'errors': errors,
        'accepted': accepted,
        'composite': {'path': '.mw/specs/mappa2-apron/pilot/apron-composite.png', 'sha256': sha256_file(COMPOSITE_PATH) if COMPOSITE_PATH.exists() else None},
        'seams': checks,
    }
    write_json(args.out, payload)
    print(json.dumps({'status': status, 'errors': errors, 'accepted': accepted}))
    sys.exit(2 if errors else 0)


if __name__ == '__main__':
    main()
