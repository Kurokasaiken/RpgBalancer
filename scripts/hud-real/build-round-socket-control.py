#!/usr/bin/env python3
"""Extract the canonical Events round filter socket (PLAN-136).

Input: public/assets/ui/hud-real/events/panel-bodytop.webp
Output: public/assets/ui/hud-real/controls/round-socket-normal.webp
Deterministic: fixed crop around the first filter slot + circular alpha mask.
"""
from pathlib import Path
import hashlib, json
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'public/assets/ui/hud-real/events/panel-bodytop.webp'
OUT = ROOT / 'public/assets/ui/hud-real/controls/round-socket-normal.webp'
PROV = ROOT / '.mw/specs/hud-real/refs/plan136-round-socket-provenance.json'
# Source is 2x design px. First slot centre measured in eventsPanelConfig.
CX, CY, R = 334.5, 68.0, 58.0


def main() -> None:
    im = Image.open(SRC).convert('RGBA')
    box = (round(CX - R), round(CY - R), round(CX + R), round(CY + R))
    crop = im.crop(box)
    size = crop.size[0]
    # Circular alpha: opaque to the outer rim, feathered only over the final 1.5 px.
    mask = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(mask)
    inset = 1
    d.ellipse((inset, inset, size - inset - 1, size - inset - 1), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(0.7))
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(crop, (0, 0), mask)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, 'WEBP', quality=100, method=6)
    sha = hashlib.sha256(OUT.read_bytes()).hexdigest()
    PROV.parent.mkdir(parents=True, exist_ok=True)
    PROV.write_text(json.dumps({
        'artifact': str(OUT.relative_to(ROOT)),
        'sha256': sha,
        'source': str(SRC.relative_to(ROOT)),
        'crop': box,
        'mask': 'circle feather 0.7px',
        'reference': '.mw/specs/hud-real/refs/ref-round-filter-sockets-2026-11-26.png',
        'plan': 'PLAN-136',
    }, indent=2) + '\n')
    print(f'{OUT.relative_to(ROOT)} {out.size} sha256={sha}')

if __name__ == '__main__':
    main()
