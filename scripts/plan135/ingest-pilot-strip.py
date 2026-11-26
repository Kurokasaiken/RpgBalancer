#!/usr/bin/env python3
"""Ingest an automatically valid generated pilot strip into the expanded apron composite."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

from pilotlib import (
    EXPANDED_SIZE, PILOT_DIR, SPEC_DIR, crop_local_rect, expanded_rect,
    load_json, positive_rect, rel, sha256_file, write_json,
)

COMPOSITE_PATH = PILOT_DIR / 'apron-composite.png'
STATE_PATH = PILOT_DIR / 'pilot-state.json'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--crop', required=True)
    ap.add_argument('--image', required=True)
    ap.add_argument('--validation', help='optional validation json output path')
    args = ap.parse_args()
    validation_out = args.validation or str(PILOT_DIR / 'validations' / f'{args.crop}.json')
    cmd = [sys.executable, str(Path(__file__).with_name('validate-pilot-strip.py')), '--crop', args.crop, '--image', args.image, '--out', validation_out]
    proc = subprocess.run(cmd, cwd=Path(__file__).resolve().parents[2], text=True, capture_output=True)
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(f'validation failed for {args.crop}; not ingesting')
    crop_plan = load_json(SPEC_DIR / 'crop-plan.json')
    crop = next(c for c in crop_plan['crops'] if c['id'] == args.crop)
    img = Image.open(args.image).convert('RGBA')
    arr = np.array(img)
    if COMPOSITE_PATH.exists():
        comp = np.array(Image.open(COMPOSITE_PATH).convert('RGBA'))
    else:
        comp = np.zeros((EXPANDED_SIZE['height'], EXPANDED_SIZE['width'], 4), dtype=np.uint8)
    inter, local = crop_local_rect(crop['keptRegionWorldPx'], crop)
    if not inter or not positive_rect(inter):
        raise SystemExit('kept region not present in generated crop')
    patch = arr[local['y0']:local['y1'] + 1, local['x0']:local['x1'] + 1].copy()
    patch[..., 3] = 255
    er = expanded_rect(inter)
    comp[er['y0']:er['y1'] + 1, er['x0']:er['x1'] + 1] = patch
    COMPOSITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(comp, 'RGBA').save(COMPOSITE_PATH, optimize=True)
    state = load_json(STATE_PATH) if STATE_PATH.exists() else {'schema': 'plan135-pilot-state/v1', 'accepted': []}
    state['accepted'] = [r for r in state.get('accepted', []) if r.get('cropId') != args.crop]
    state['accepted'].append({
        'cropId': args.crop,
        'image': {'path': rel(args.image), 'sha256': sha256_file(args.image)},
        'validation': {'path': rel(validation_out), 'sha256': sha256_file(validation_out)},
    })
    state['composite'] = {'path': rel(COMPOSITE_PATH), 'sha256': sha256_file(COMPOSITE_PATH)}
    write_json(STATE_PATH, state)
    print(json.dumps({'ingested': args.crop, 'composite': rel(COMPOSITE_PATH), 'compositeSha256': state['composite']['sha256']}))


if __name__ == '__main__':
    main()
