#!/usr/bin/env python3
"""Apply the frozen PLAN-135 CIELAB colour transfer to one generated strip."""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

from pilotlib import (
    ROOT, SPEC_DIR, crop_local_rect, lab_to_srgb, load_base_rgb, load_json,
    positive_rect, rel, sha256_file, srgb_to_lab, slice_inclusive, write_json,
)

OPENED_WATER_MASK = ROOT / '.mw/specs/mappa2-apron/water-mask-opened-3x3.png'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--crop', required=True)
    ap.add_argument('--input', required=True, help='raw generated image')
    ap.add_argument('--output', required=True, help='corrected image')
    ap.add_argument('--report', required=True)
    args = ap.parse_args()
    crop_plan = load_json(SPEC_DIR / 'crop-plan.json')
    feasibility = load_json(SPEC_DIR / 'feasibility.json')
    crop = next((c for c in crop_plan['crops'] if c['id'] == args.crop), None)
    if crop is None:
        raise SystemExit(f'unknown crop {args.crop}')
    cfg = feasibility['classifier']['colorTransfer']
    img = Image.open(args.input).convert('RGB')
    rgb = np.array(img).astype(np.float32) / 255.0
    base = load_base_rgb()
    water_full = np.array(Image.open(OPENED_WATER_MASK).convert('L')) > 0
    ref = crop['paintedReferenceWorldPx']
    inter, local = crop_local_rect(ref, crop)
    if not inter or not positive_rect(inter):
        raise SystemExit('no painted reference overlap')
    water_ref = slice_inclusive(water_full.astype(np.uint8), inter).astype(bool)
    sample_count = int(water_ref.sum())
    src = crop['sourceRegionWorldPx']
    yy, xx = np.indices(rgb.shape[:2])
    wx = xx + src['x0']
    wy = yy + src['y0']
    apron_mask = (wx < 0) | (wx >= 2752) | (wy < 0) | (wy >= 1536)
    status = 'APPLIED'
    params = None
    corrected = rgb.copy()
    if sample_count < cfg['minWaterSamplesPx']:
        status = 'NOT_APPLICABLE_INSUFFICIENT_WATER_OVERLAP'
    else:
        gen_overlap = rgb[local['y0']:local['y1'] + 1, local['x0']:local['x1'] + 1]
        ref_overlap = slice_inclusive(base, inter).astype(np.float32) / 255.0
        lab_gen = srgb_to_lab((gen_overlap[water_ref] * 255).astype(np.uint8))
        lab_ref = srgb_to_lab((ref_overlap[water_ref] * 255).astype(np.uint8))
        mean_gen = lab_gen.mean(axis=0)
        mean_ref = lab_ref.mean(axis=0)
        std_gen = np.maximum(lab_gen.std(axis=0), cfg['stdFloor'])
        std_ref = np.maximum(lab_ref.std(axis=0), cfg['stdFloor'])
        gain = std_ref / std_gen
        all_lab = srgb_to_lab((corrected * 255).astype(np.uint8))
        transferred = (all_lab - mean_gen) * gain + mean_ref
        transferred_rgb = lab_to_srgb(transferred)
        corrected[apron_mask] = transferred_rgb[apron_mask]
        params = {
            'sampleCount': sample_count,
            'meanGeneratedLab': [float(v) for v in mean_gen],
            'meanReferenceLab': [float(v) for v in mean_ref],
            'stdGeneratedLab': [float(v) for v in std_gen],
            'stdReferenceLab': [float(v) for v in std_ref],
            'gain': [float(v) for v in gain],
            'offsetLab': [float(v) for v in (mean_ref - mean_gen * gain)],
            'stdFloor': cfg['stdFloor'],
        }
    out_arr = np.clip(corrected * 255 + 0.5, 0, 255).astype(np.uint8)
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out_arr, 'RGB').save(args.output, optimize=True)
    report = {
        'schema': 'plan135-color-transfer/v1',
        'cropId': args.crop,
        'status': status,
        'input': {'path': rel(args.input), 'sha256': sha256_file(args.input)},
        'output': {'path': rel(args.output), 'sha256': sha256_file(args.output)},
        'parameters': params,
        'rule': cfg,
    }
    write_json(args.report, report)
    print(json.dumps({'status': status, 'samples': sample_count, 'output': rel(args.output)}))
    sys.exit(0)


if __name__ == '__main__':
    main()
