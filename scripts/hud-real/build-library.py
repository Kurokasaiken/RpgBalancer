#!/usr/bin/env python3
"""HUD language library: motif sketches -> cut + graded runtime assets + library.json.

Source of truth: .mw/specs/hud-real/library/library.src.json (metadata written by hand)
and the raw originals it points to. Output:
  public/assets/ui/hud-real/library/<id>.webp   (cut on navy flood fill, colour grade, 2x)
  public/assets/ui/hud-real/library/library.json (metadata + measured size, read by /hud-library)
Same cut and grade as build-roster-assets.py (one definition of the materials).

Usage: tools/hud-real/venv/bin/python -I scripts/hud-real/build-library.py
"""
import importlib.util
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
_spec = importlib.util.spec_from_file_location('bra', os.path.join(HERE, 'build-roster-assets.py'))
bra = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bra)

SRC = os.path.join(ROOT, '.mw/specs/hud-real/library')
OUT = os.path.join(ROOT, 'public/assets/ui/hud-real/library')
MAX_SIDE = 240.0  # design px of the longest side in the catalog preview


def main():
    os.makedirs(OUT, exist_ok=True)
    src = json.load(open(os.path.join(SRC, 'library.src.json')))
    items = []
    for it in src['items']:
        rgb, alpha, *_ = bra.cut(os.path.join(SRC, it['file']))
        crgb, ca, _ = bra.crop_to(rgb, alpha, pad=2)
        s = MAX_SIDE / max(crgb.shape[:2])
        size = bra.save(crgb, ca, s, os.path.join(OUT, f"{it['id']}.webp"))
        items.append({**it, 'image': f"/assets/ui/hud-real/library/{it['id']}.webp",
                      'w': round(crgb.shape[1] * s, 1), 'h': round(crgb.shape[0] * s, 1), 'asset2x': list(size),
                      'status': 'schizzo 1024² (non scelto)'})
        print(it['id'], it['name'], items[-1]['w'], 'x', items[-1]['h'])
    with open(os.path.join(OUT, 'library.json'), 'w') as f:
        json.dump({'version': src['version'], 'note': src['note'], 'items': items}, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
