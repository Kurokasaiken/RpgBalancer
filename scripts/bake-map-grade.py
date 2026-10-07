"""Bake the graded sea + land layers of the flat world map.

The painted map is greyer than the HUD it sits under (sea saturation ~0.19 on screen against
~0.40 in the approved mockup). The grade is baked into new files next to the originals
(`layers/<name>.graded.webp`) instead of running as a runtime filter: zero cost per frame, and the original
layers stay untouched for A/B (`gameFrameConfig.worldDressing.grade`, `?map=graded|original` in dev).

Usage: python3 scripts/bake-map-grade.py
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'world', 'wanderlust', 'base')
LAYERS = os.path.join(ROOT, 'layers')

# (saturation multiplier, value multiplier, hue shift in degrees)
GRADES = {
    'Mare.webp': (2.3, 1.08, -3.0),
    'base_flat.webp': (1.38, 1.0, 0.0),
    'Isola basso sinistra.webp': (1.38, 1.0, 0.0),
    'Isola basso a destra.webp': (1.38, 1.0, 0.0),
}


def grade(path, sat, val, hue):
    im = Image.open(path).convert('RGBA')
    alpha = im.getchannel('A')
    hsv = np.asarray(im.convert('RGB').convert('HSV')).astype(np.float32)
    hsv[..., 0] = (hsv[..., 0] + hue / 360.0 * 255.0) % 256
    hsv[..., 1] = np.clip(hsv[..., 1] * sat, 0, 255)
    hsv[..., 2] = np.clip(hsv[..., 2] * val, 0, 255)
    rgb = Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')
    rgb.putalpha(alpha)
    return rgb


def graded_name(name):
    return name.replace('.webp', '.graded.webp')


def main():
    for name, (sat, val, hue) in GRADES.items():
        grade(os.path.join(LAYERS, name), sat, val, hue).save(os.path.join(LAYERS, graded_name(name)), quality=92, method=6)
        print('baked', name, sat, val, hue)

    manifest = json.load(open(os.path.join(ROOT, 'manifest-flat.json')))
    for layer in manifest['surfaceLayers']:
        if layer['file'] in GRADES:
            layer['file'] = graded_name(layer['file'])
    manifest['id'] = manifest.get('id', 'base_flat') + '_graded'
    json.dump(manifest, open(os.path.join(ROOT, 'manifest-flat-graded.json'), 'w'), indent=2)
    print('wrote manifest-flat-graded.json')


if __name__ == '__main__':
    main()
