#!/usr/bin/env python3
"""Build the square alcove socket in the Events round-socket material (PLAN-136).

Deterministic raster construction: brass/gold rim, dark green lacquer well,
inner shadow and restrained diagonal specular. No AI generation required.
"""
from pathlib import Path
import hashlib, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/assets/ui/hud-real/controls/square-socket-normal.webp'
PROV = ROOT / '.mw/specs/hud-real/refs/plan136-square-socket-provenance.json'
SIZE = 128
RADIUS = 18
RIM = 9


def rounded_mask(size: int, radius: int, inset: int = 0) -> Image.Image:
    m = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((inset, inset, size - inset - 1, size - inset - 1), radius=radius, fill=255)
    return m


def vertical_gradient(size: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    arr = np.zeros((size, size, 3), dtype=np.uint8)
    for y in range(size):
        f = y / (size - 1)
        arr[y, :, :] = [round(top[i] * (1 - f) + bottom[i] * f) for i in range(3)]
    return Image.fromarray(arr, 'RGB')


def main() -> None:
    s = SIZE
    # Brass rim base: deep shadow at bottom, warm gold on top/left.
    rim = vertical_gradient(s, (244, 205, 92), (91, 55, 18)).convert('RGBA')
    # Horizontal/specular modulation.
    x = np.linspace(-1, 1, s)
    y = np.linspace(-1, 1, s)
    xx, yy = np.meshgrid(x, y)
    shade = 1 + 0.20 * (-xx) - 0.16 * yy
    arr = np.asarray(rim).astype(np.float32)
    arr[:, :, :3] = np.clip(arr[:, :, :3] * shade[:, :, None], 0, 255)
    rim = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    # Dark lacquer well, subtly greener toward lower-left.
    well = vertical_gradient(s, (8, 32, 28), (3, 15, 16)).convert('RGBA')
    noise = np.random.default_rng(136).normal(0, 3.2, (s, s, 1))
    wa = np.asarray(well).astype(np.float32)
    wa[:, :, :3] = np.clip(wa[:, :, :3] + noise, 0, 255)
    well = Image.fromarray(wa.astype(np.uint8), 'RGBA')

    outer_m = rounded_mask(s, RADIUS, 1).filter(ImageFilter.GaussianBlur(0.4))
    inner_m = rounded_mask(s, max(5, RADIUS - 7), RIM)
    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    canvas.paste(rim, (0, 0), outer_m)
    canvas.paste(well, (0, 0), inner_m)

    # Inner shadow just inside the rim, then a thin gold highlight on the rim lip.
    shadow = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((RIM, RIM, s - RIM - 1, s - RIM - 1), radius=max(5, RADIUS - 7), outline=(0, 0, 0, 150), width=4)
    shadow = shadow.filter(ImageFilter.GaussianBlur(3))
    canvas = Image.alpha_composite(canvas, shadow)
    hl = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hl)
    hd.rounded_rectangle((4, 4, s - 5, s - 5), radius=RADIUS - 2, outline=(255, 226, 130, 115), width=2)
    canvas = Image.alpha_composite(canvas, hl)

    # Restrained diagonal glass-like sheen clipped to the well.
    sheen = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    sh = ImageDraw.Draw(sheen)
    sh.polygon([(RIM + 5, RIM + 2), (s - RIM - 8, RIM + 2), (RIM + 20, s - RIM - 6), (RIM + 4, s - RIM - 6)], fill=(255, 255, 255, 18))
    sheen.putalpha(Image.composite(sheen.getchannel('A'), Image.new('L', (s, s), 0), inner_m))
    canvas = Image.alpha_composite(canvas, sheen)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, 'WEBP', quality=100, method=6)
    sha = hashlib.sha256(OUT.read_bytes()).hexdigest()
    PROV.parent.mkdir(parents=True, exist_ok=True)
    PROV.write_text(json.dumps({
        'artifact': str(OUT.relative_to(ROOT)),
        'sha256': sha,
        'construction': 'deterministic rounded-square brass rim + green lacquer well; seed=136',
        'reference': '.mw/specs/hud-real/refs/ref-round-filter-sockets-2026-11-26.png',
        'plan': 'PLAN-136',
    }, indent=2) + '\n')
    print(f'{OUT.relative_to(ROOT)} {canvas.size} sha256={sha}')

if __name__ == '__main__':
    main()
