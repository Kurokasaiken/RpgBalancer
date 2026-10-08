"""Draw the game's own cursors: brass and ink, matching the HUD plaques and the inked map.

Three cursors, each at 1x (32 px) and 2x (64 px), supersampled for clean edges:
  - map-arrow:   brass arrowhead with an ink outline (default)
  - map-point:   the same arrow, brighter, with a small brass ring at the tip (something clickable)
  - map-move:    a four-point brass compass star (dragging the map)

Usage: python3 scripts/draw-cursors.py
"""
import os

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'ui', 'cursors')
SS = 8  # supersampling
INK = (14, 10, 6, 255)
BRASS_HI = (240, 214, 140, 255)
BRASS = (200, 160, 80, 255)
BRASS_LO = (122, 86, 34, 255)
GOLD = (255, 226, 150, 255)

OFF = 3  # room for the pointer ring around the tip; the hotspot is (OFF + 2, OFF + 2)
ARROW = [(x + OFF, y + OFF) for x, y in [(2, 2), (2, 24.5), (8, 19), (12.2, 28.5), (16.3, 26.6), (12.3, 17.6), (20, 17.6)]]
BODY = [(x + OFF, y + OFF) for x, y in [(3.3, 5.2), (3.3, 21.6), (8.4, 16.7), (12.9, 26.6), (14.6, 25.8), (10.4, 16.2), (16.8, 16.2)]]


def gradient_fill(size, poly, top, bottom):
    mask = Image.new('L', size, 0)
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    grad = Image.new('RGBA', size)
    gd = ImageDraw.Draw(grad)
    for y in range(size[1]):
        t = y / size[1]
        gd.line([(0, y), (size[0], y)], fill=tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)) + (255,))
    out = Image.new('RGBA', size, (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def arrow(scale: int, bright: bool) -> Image.Image:
    s = scale * SS
    size = (32 * s, 32 * s)
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    poly = [(x * s, y * s) for x, y in ARROW]
    # soft drop shadow
    shadow = Image.new('RGBA', size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).polygon([(x + 1.5 * s, y + 1.5 * s) for x, y in poly], fill=(0, 0, 0, 120))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(1.2 * s)))
    # ink outline: draw the polygon fat in ink, then the brass body inset
    d = ImageDraw.Draw(img)
    d.polygon(poly, fill=INK)
    d.line(poly + [poly[0]], fill=INK, width=int(2.6 * s), joint='curve')
    body = gradient_fill(size, [(x * s, y * s) for x, y in BODY],
                         GOLD if bright else BRASS_HI, BRASS if bright else BRASS_LO)
    img.alpha_composite(body)
    # engraved highlight along the left edge
    d.line([((3.9 + OFF) * s, (6.5 + OFF) * s), ((3.9 + OFF) * s, (19 + OFF) * s)], fill=(255, 245, 210, 200), width=int(0.7 * s))
    if bright:
        cx, cy, r = (2 + OFF) * s, (2 + OFF) * s, 3.6 * s
        d.ellipse([cx - r - 1.2 * s, cy - r - 1.2 * s, cx + r + 1.2 * s, cy + r + 1.2 * s], outline=INK, width=int(1.4 * s))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GOLD, width=int(1.1 * s))
    return img.resize((32 * scale, 32 * scale), Image.LANCZOS)


def star(scale: int) -> Image.Image:
    s = scale * SS
    size = (32 * s, 32 * s)
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    c = 16 * s
    pts = []
    import math
    for k in range(8):
        a = math.pi / 4 * k - math.pi / 2
        r = (13 if k % 2 == 0 else 4.2) * s
        pts.append((c + r * math.cos(a), c + r * math.sin(a)))
    shadow = Image.new('RGBA', size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).polygon([(x + 1.5 * s, y + 1.5 * s) for x, y in pts], fill=(0, 0, 0, 120))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(1.2 * s)))
    d = ImageDraw.Draw(img)
    d.line(pts + [pts[0]], fill=INK, width=int(2.6 * s), joint='curve')
    d.polygon(pts, fill=INK)
    inner = [(c + (x - c) * 0.78, c + (y - c) * 0.78) for x, y in pts]
    img.alpha_composite(gradient_fill(size, inner, BRASS_HI, BRASS_LO))
    d.ellipse([c - 2 * s, c - 2 * s, c + 2 * s, c + 2 * s], fill=INK)
    return img.resize((32 * scale, 32 * scale), Image.LANCZOS)


for scale, suffix in ((1, ''), (2, '@2x')):
    arrow(scale, False).save(os.path.join(OUT, f'map-arrow{suffix}.png'))
    arrow(scale, True).save(os.path.join(OUT, f'map-point{suffix}.png'))
    star(scale).save(os.path.join(OUT, f'map-move{suffix}.png'))
print('ok')
