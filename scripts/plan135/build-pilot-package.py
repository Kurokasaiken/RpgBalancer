#!/usr/bin/env python3
"""Build the deterministic PLAN-135 pilot input package.

No generative provider is called here. The script materialises the exact 1024x572
transparent-outpaint inputs, verbatim prompts and manifest for the approved
3-strip pilot (hard top-right corner + adjacent top/side strips).
"""
import argparse
import json
from datetime import datetime, timezone

import numpy as np
from PIL import Image

from pilotlib import (
    BASE_PATH, CANVAS, EXPANDED_SIZE, PILOT_DIR, ROOT, SPEC_DIR,
    crop_local_rect, expanded_rect, inclusive_height, inclusive_width,
    load_base_rgb, load_json, positive_rect, rel, sha256_file, slice_inclusive,
    write_json,
)

PILOT_CROPS = ['top-05', 'top-04', 'right-01']
COMPOSITE_PATH = PILOT_DIR / 'apron-composite.png'


def prompt_for(crop):
    bits = []
    if crop['strip'] == 'top':
        bits.append('the top 60 pixels must resolve to clean open water with no land')
    if crop['strip'] == 'right' or (crop['strip'] == 'top' and crop['keptRegionWorldPx']['x1'] >= 3144):
        bits.append('the rightmost 168 pixels must resolve to clean open water with no land')
    if crop['strip'] == 'left':
        bits.append('the leftmost 168 pixels must resolve to clean open water with no land')
    outer_rule = '; '.join(bits) if bits else 'the outer apron edge must resolve to clean open water with no land'
    return (
        f"PLAN-135 {crop['id']}: outpaint only the transparent missing areas of this exact 1024x572 image, at the same 1:1 scale and with no cropping, resizing, border or frame. "
        "Preserve every non-transparent painted pixel as closely as possible; those pixels are the approved reference and must remain visually recognisable. "
        "Continue the approved painterly fantasy island map style: saturated turquoise sea, sculpted coastline, cliffs, forests, painterly texture, small natural details, same light and colour grade. "
        "Complete only cliffs, coastline, beaches, islands or landforms already cut by the visible painted reference; do not invent independent new islands or significant new landmasses. "
        f"Strict outer-water rule: {outer_rule}; any allowed continuation must fade to zero before that strict band. "
        "No text, labels, icons, UI, grid, vignette, frame, ships, creatures, people, buildings, or modern objects. Output exactly one finished 1024x572 pixel image."
    )


def composite_image():
    if not COMPOSITE_PATH.exists():
        return None
    return Image.open(COMPOSITE_PATH).convert('RGBA')


def build_input(crop, base_rgb, composite):
    src = crop['sourceRegionWorldPx']
    width = inclusive_width(src)
    height = inclusive_height(src)
    out = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    canvas_world = {'x0': 0, 'y0': 0, 'x1': CANVAS['width'] - 1, 'y1': CANVAS['height'] - 1}
    inter, local = crop_local_rect(canvas_world, crop)
    if inter and positive_rect(inter):
        patch = slice_inclusive(base_rgb, inter)
        out.paste(Image.fromarray(patch).convert('RGBA'), (local['x0'], local['y0']))
    if composite is not None:
        comp = np.array(composite)
        # Copy only already-owned apron pixels overlapping this crop. Expanded coords are world+offset.
        crop_world = src
        ex0 = crop_world['x0'] + 560
        ey0 = crop_world['y0'] + 200
        ex1 = crop_world['x1'] + 560
        ey1 = crop_world['y1'] + 200
        ex0 = max(ex0, 0); ey0 = max(ey0, 0); ex1 = min(ex1, EXPANDED_SIZE['width'] - 1); ey1 = min(ey1, EXPANDED_SIZE['height'] - 1)
        if ex1 >= ex0 and ey1 >= ey0:
            region = comp[ey0:ey1 + 1, ex0:ex1 + 1]
            alpha = region[..., 3] > 0
            if alpha.any():
                lx0 = ex0 - (crop_world['x0'] + 560)
                ly0 = ey0 - (crop_world['y0'] + 200)
                rgba = np.array(out)
                target = rgba[ly0:ly0 + region.shape[0], lx0:lx0 + region.shape[1]]
                target[alpha] = region[alpha]
                rgba[ly0:ly0 + region.shape[0], lx0:lx0 + region.shape[1]] = target
                out = Image.fromarray(rgba, 'RGBA')
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--crops', nargs='*', default=PILOT_CROPS)
    args = ap.parse_args()
    plan_path = SPEC_DIR / 'crop-plan.json'
    feasibility_path = SPEC_DIR / 'feasibility.json'
    crop_plan = load_json(plan_path)
    feasibility = load_json(feasibility_path)
    base_rgb = load_base_rgb()
    comp = composite_image()
    inputs_dir = PILOT_DIR / 'inputs'
    prompts_dir = PILOT_DIR / 'prompts'
    inputs_dir.mkdir(parents=True, exist_ok=True)
    prompts_dir.mkdir(parents=True, exist_ok=True)
    rows = []
    for crop_id in args.crops:
        crop = next((c for c in crop_plan['crops'] if c['id'] == crop_id), None)
        if crop is None:
            raise SystemExit(f'unknown crop {crop_id}')
        image = build_input(crop, base_rgb, comp)
        input_path = inputs_dir / f'{crop_id}.png'
        image.save(input_path, optimize=True)
        prompt_path = prompts_dir / f'{crop_id}.txt'
        prompt_path.write_text(prompt_for(crop) + '\n')
        rows.append({
            'cropId': crop_id,
            'orderInPilot': args.crops.index(crop_id) + 1,
            'joinClass': crop['joinClass'],
            'input': {'path': rel(input_path), 'sha256': sha256_file(input_path), 'width': image.width, 'height': image.height, 'alpha': 'transparent pixels are the missing apron/outpaint region'},
            'prompt': {'path': rel(prompt_path), 'sha256': sha256_file(prompt_path), 'verbatimFile': True},
            'sourceRegionWorldPx': crop['sourceRegionWorldPx'],
            'paintedReferenceWorldPx': crop['paintedReferenceWorldPx'],
            'keptRegionWorldPx': crop['keptRegionWorldPx'],
            'retryBudget': crop['retryBudget'],
        })
    manifest = {
        'schema': 'plan135-pilot-package/v1',
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'selection': {
            'cropIds': args.crops,
            'order': args.crops,
            'rationale': 'hard top-right coast/corner crop plus adjacent top and right strips: exercises canvas joins, corner ownership and horizontal/vertical continuity before batch spend',
        },
        'generationPreconditions': {
            'feasibility': {'path': rel(feasibility_path), 'sha256': sha256_file(feasibility_path), 'status': feasibility.get('status')},
            'cropPlan': {'path': rel(plan_path), 'sha256': sha256_file(plan_path)},
            'sourcePainting': {'path': rel(BASE_PATH), 'sha256': sha256_file(BASE_PATH), 'note': 'approved 1x painting used by the runtime look; hi-res source is not resampled into the scale-locked Gemini crop'},
            'canary': 'one Gemini/Canary window may exist only hidden/background (open -g -j or existing hidden session); automation must never focus it',
            'scaleLock': 'input and output are exactly 1024x572; world_to_crop scale is 1:1; resampling is forbidden',
        },
        'acceptedComposite': {'path': rel(COMPOSITE_PATH), 'sha256': sha256_file(COMPOSITE_PATH)} if COMPOSITE_PATH.exists() else None,
        'crops': rows,
        'killCriteria': feasibility['frozenConstants']['pilotKillCriteria'],
    }
    manifest_path = PILOT_DIR / 'pilot-manifest.json'
    write_json(manifest_path, manifest)
    print(json.dumps({'manifest': rel(manifest_path), 'crops': args.crops, 'composite': COMPOSITE_PATH.exists()}))


if __name__ == '__main__':
    main()
