"""Draw the game's own cursors: brass and ink, matching the HUD plaques and the inked map.

Legacy set (map-*), each at 1x (32 px) and 2x (64 px), supersampled for clean edges:
  - map-arrow:   brass arrowhead with an ink outline (default)
  - map-point:   the same arrow, brighter, with a small brass ring at the tip (something clickable) — legacy, unused
  - map-move:    a four-point brass compass star (dragging the map)

PLAN-058 T5.1 set (game-*), each at 32 / 48 / 64 px (1x / 1.5x / 2x) plus a hotspot manifest:
  point family (the pointer): an armoured gauntlet, index finger out — default, interact, inspect, wait, disabled
  hand family (the grip):     open and closed gauntlets — grab, drag, drop-yes, drop-no, pan
House rule (Director, 2026-10-13): fantasy, never generic UI — the pointer is a gauntlet, not an arrow. No flat
round dot or ring in front of the pointer, no coloured status discs, no traffic-light green/red: a state is told by the SHAPE of a small
emblem cut in the cursor's own material — spark (interact, accepted drop), eye (inspect), hourglass (wait),
iron padlock (disabled), crossed iron blades (refused drop). Colours stay brass and ink; iron is the only
neutral, for what is shut or refused. See EMBLEMS below.
Hotspots are in CSS px of the 32 px grid and sit on the real tip of the pointing finger, or on
the palm for the hands; public/assets/ui/cursors/game-cursors.json is what gameFrameCursors.css and its
test read, so the CSS literals can never drift from the drawing.

Usage: python3 scripts/draw-cursors.py
"""
import json
import math
import os

from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'ui', 'cursors')
SS = 8  # supersampling
INK = (14, 10, 6, 255)
BRASS_HI = (240, 214, 140, 255)
BRASS = (200, 160, 80, 255)
BRASS_LO = (122, 86, 34, 255)
GOLD = (255, 226, 150, 255)
HILITE = (255, 245, 210, 200)
LEAD = (34, 26, 18, 255)
IRON_HI = (178, 176, 166, 255)
IRON_LO = (88, 86, 80, 255)

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


def arrow(scale, bright: bool, palette=None, badge=None, legacy_ring=False) -> Image.Image:
    s = scale * SS
    size = (int(32 * s), int(32 * s))
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
    top, bottom = palette or ((GOLD, BRASS) if bright else (BRASS_HI, BRASS_LO))
    body = gradient_fill(size, [(x * s, y * s) for x, y in BODY], top, bottom)
    img.alpha_composite(body)
    # engraved highlight along the left edge
    d.line([((3.9 + OFF) * s, (6.5 + OFF) * s), ((3.9 + OFF) * s, (19 + OFF) * s)], fill=HILITE if not palette else (230, 228, 218, 150), width=int(0.7 * s))
    if not legacy_ring and badge:
        draw_emblem(img, badge, (26.0, 25.4), s)
    if bright and legacy_ring:
        cx, cy, r = (2 + OFF) * s, (2 + OFF) * s, 3.6 * s
        d.ellipse([cx - r - 1.2 * s, cy - r - 1.2 * s, cx + r + 1.2 * s, cy + r + 1.2 * s], outline=INK, width=int(1.4 * s))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GOLD, width=int(1.1 * s))
    return img.resize((int(32 * scale), int(32 * scale)), Image.LANCZOS)


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



# ---------------------------------------------------------------------------------------------
# PLAN-058 T5.1 — the full set: a pointing gauntlet in five states and four grips, all armoured hands.
# ---------------------------------------------------------------------------------------------
SIZES = ((32, ''), (48, '@1.5x'), (64, '@2x'))


def _star(cx, cy, outer, inner):
    """A four-pointed star, points on the axes."""
    pts = []
    for k in range(8):
        a = math.pi / 4 * k - math.pi / 2
        r = outer if k % 2 == 0 else inner
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def _sword(sign):
    """One blade of the crossed pair: tip up and outward, guard, grip and pommel low on the other side."""
    x = lambda v: sign * v
    return [
        ('cap', (x(-3.9), -4.3), (x(1.3), 0.9), 1.5),  # blade
        ('cap', (x(0.3), 2.7), (x(3.3), -0.3), 1.1),  # guard
        ('cap', (x(2.0), 1.6), (x(4.1), 3.7), 1.2),  # grip
        ('cap', (x(4.5), 4.1), (x(4.5), 4.1), 1.9),  # pommel
    ]


# Emblems ride on the pointer's tail in place of the generic round badges: every one is a fantasy
# object cut in the cursor's own material (brass and ink, iron for what is shut or refused) — never a
# flat disc, never a traffic-light green/red. Layers: (parts, top colour, bottom colour), local units
# around (0, 0); a part is ('poly', points) or ('cap', a, b, width).
EMBLEMS = {
    # a spark of the arcane: interactable things and accepted drops glint
    'star': [([('poly', _star(0, 0, 4.9, 1.45))], GOLD, BRASS)],
    # a watching eye: "look closer"
    'eye': [
        ([('poly', [(-4.8, 0.0), (-3.2, -1.9), (-1.2, -2.9), (1.2, -2.9), (3.2, -1.9), (4.8, 0.0),
                    (3.2, 1.9), (1.2, 2.9), (-1.2, 2.9), (-3.2, 1.9)])], BRASS_HI, BRASS),
        ([('cap', (0, 0), (0, 0), 3.4)], LEAD, INK),
        ([('cap', (-0.5, -0.6), (-0.5, -0.6), 1.0)], GOLD, GOLD),
    ],
    # sand running: "the world is busy"
    'hourglass': [
        ([('poly', [(-3.0, -4.0), (3.0, -4.0), (0, 0.1)])], BRASS_HI, BRASS),
        ([('poly', [(-3.0, 4.0), (3.0, 4.0), (0, -0.1)])], BRASS, BRASS_LO),
        ([('cap', (-3.6, -4.4), (3.6, -4.4), 1.4), ('cap', (-3.6, 4.4), (3.6, 4.4), 1.4)], GOLD, BRASS),
    ],
    # an iron padlock: present but shut
    'padlock': [
        ([('cap', (-1.9, -0.6), (-1.9, -2.4), 1.5), ('cap', (-1.9, -2.4), (0, -4.1), 1.5),
          ('cap', (0, -4.1), (1.9, -2.4), 1.5), ('cap', (1.9, -2.4), (1.9, -0.6), 1.5)], IRON_HI, IRON_LO),
        ([('poly', [(-3.4, -0.4), (3.4, -0.4), (3.4, 4.7), (-3.4, 4.7)])], IRON_HI, IRON_LO),
        ([('cap', (0, 1.6), (0, 3.0), 1.2)], LEAD, INK),
    ],
    # two iron blades crossed: the drop is refused
    'swords': [([*_sword(1), *_sword(-1)], IRON_HI, IRON_LO)],
}


def _parts_mask(size, parts, s, ox, oy, grow=0.0):
    mask = Image.new('L', size, 0)
    d = ImageDraw.Draw(mask)
    for part in parts:
        if part[0] == 'poly':
            pts = [((ox + x) * s, (oy + y) * s) for x, y in part[1]]
            d.polygon(pts, fill=255)
            if grow:
                d.line(pts + [pts[0]], fill=255, width=int(2 * grow * s), joint='curve')
        else:
            (x1, y1), (x2, y2), w = part[1:]
            width = (w + 2 * grow) * s
            d.line([((ox + x1) * s, (oy + y1) * s), ((ox + x2) * s, (oy + y2) * s)], fill=255, width=int(width))
            for x, y in ((x1, y1), (x2, y2)):
                d.ellipse([(ox + x) * s - width / 2, (oy + y) * s - width / 2, (ox + x) * s + width / 2, (oy + y) * s + width / 2], fill=255)
    return mask


def draw_emblem(img, kind, center, s):
    """Cut an emblem into the pointer's tail: ink outline first, then each layer in its own gradient."""
    layers = EMBLEMS[kind]
    size = img.size
    ox, oy = center
    union = Image.new('L', size, 0)
    for parts, _, _ in layers:
        union = Image.composite(Image.new('L', size, 255), union, _parts_mask(size, parts, s, ox, oy, grow=1.1))
    img.paste(Image.new('RGBA', size, INK), (0, 0), union)
    for parts, top, bottom in layers:
        fill_mask(img, _parts_mask(size, parts, s, ox, oy), top, bottom, (oy - 5.0) * s, (oy + 5.0) * s)


def fill_mask(img, mask, top, bottom, y0=None, y1=None):
    size = img.size
    grad = Image.new('RGBA', size)
    gd = ImageDraw.Draw(grad)
    lo, hi = (0, size[1]) if y0 is None else (y0, y1)
    for y in range(size[1]):
        t = min(1.0, max(0.0, (y - lo) / (hi - lo)))
        gd.line([(0, y), (size[0], y)], fill=tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)) + (255,))
    img.paste(grad, (0, 0), mask)


class Place:
    """Rotate (about a pivot), scale and shift the points of a base drawing on the 32 px grid."""

    def __init__(self, ang=0.0, pivot=(16.0, 16.0), k=1.0, ox=0.0, oy=0.0):
        self.ang, self.pivot, self.k, self.ox, self.oy = ang, pivot, k, ox, oy

    def p(self, x, y):
        a = math.radians(self.ang)
        dx, dy = x - self.pivot[0], y - self.pivot[1]
        rx = self.pivot[0] + dx * math.cos(a) - dy * math.sin(a)
        ry = self.pivot[1] + dx * math.sin(a) + dy * math.cos(a)
        return (self.ox + rx * self.k, self.oy + ry * self.k)

    def part(self, part):
        if part[0] == 'poly':
            return ('poly', [self.p(*pt) for pt in part[1]])
        return ('cap', self.p(*part[1]), self.p(*part[2]), part[3] * self.k)

    def seg(self, a, b):
        return (self.p(*a), self.p(*b))


def fit(parts, box, ang=0.0, pivot=(16.0, 16.0), kmax=1.0):
    """The Place that rotates the drawing and puts its bounding box inside `box` (x0, y0, x1, y1), top-left aligned."""
    flat = Place(ang, pivot)
    xs, ys = [], []
    for part in parts:
        if part[0] == 'poly':
            for pt in part[1]:
                x, y = flat.p(*pt)
                xs.append(x), ys.append(y)
        else:
            for pt in (part[1], part[2]):
                x, y = flat.p(*pt)
                xs += [x - part[3] / 2, x + part[3] / 2]
                ys += [y - part[3] / 2, y + part[3] / 2]
    k = min(kmax, (box[2] - box[0]) / (max(xs) - min(xs)), (box[3] - box[1]) / (max(ys) - min(ys)))
    return Place(ang, pivot, k, box[0] - min(xs) * k, box[1] - min(ys) * k)


def render_glove(px, parts, lines=(), lights=(), thumb=None, tris=(), colours=(BRASS_HI, BRASS_LO), line_colour=BRASS_LO,
                 thumb_colours=(GOLD, BRASS), emblem=None, emblem_at=(26.0, 25.4)):
    """Ink outline, gradient plate, engraved joints, a lighter thumb across the front, and the emblem on top."""
    scale = px / 32
    s = scale * SS
    size = (int(32 * s), int(32 * s))
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    sil = _parts_mask(size, parts, s, 0, 0)
    # soft drop shadow, same recipe as the legacy arrows
    shifted = Image.new('L', size, 0)
    shifted.paste(sil, (int(1.5 * s), int(1.5 * s)))
    shadow = Image.new('RGBA', size, (0, 0, 0, 0))
    shadow.paste(Image.new('RGBA', size, (0, 0, 0, 120)), (0, 0), shifted)
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(1.2 * s)))
    d = ImageDraw.Draw(img)
    for tri in tris:
        d.polygon([(x * s, y * s) for x, y in tri], fill=INK)
        d.line([(x * s, y * s) for x, y in tri + [tri[0]]], fill=INK, width=int(2.0 * s), joint='curve')
    img.paste(Image.new('RGBA', size, INK), (0, 0), _parts_mask(size, parts, s, 0, 0, grow=1.3))
    y0, y1 = sil.getbbox()[1], sil.getbbox()[3]
    fill_mask(img, sil, colours[0], colours[1], y0, y1)
    for a, b in lines:
        d.line([(a[0] * s, a[1] * s), (b[0] * s, b[1] * s)], fill=line_colour, width=int(0.8 * s))
    for a, b in lights:
        d.line([(a[0] * s, a[1] * s), (b[0] * s, b[1] * s)], fill=HILITE, width=int(0.7 * s))
    if thumb:
        img.paste(Image.new('RGBA', size, INK), (0, 0), _parts_mask(size, [thumb], s, 0, 0, grow=1.0))
        tm = _parts_mask(size, [thumb], s, 0, 0)
        fill_mask(img, tm, thumb_colours[0], thumb_colours[1], tm.getbbox()[1], tm.getbbox()[3])
    for tri in tris:
        cx = sum(x for x, _ in tri) / 3
        cy = sum(y for _, y in tri) / 3
        d.polygon([(( cx + (x - cx) * 0.62) * s, (cy + (y - cy) * 0.62) * s) for x, y in tri], fill=BRASS_HI)
    if emblem:
        draw_emblem(img, emblem, emblem_at, s)
    return img.resize((px, px), Image.LANCZOS)


# ---- the pointer: an armoured gauntlet, index finger out, leaning up-left like the arrow it replaces ----
def _cuff(x0, x1, top, bottom):
    """A flared plate cuff with a rim band."""
    return [('poly', [(x0, bottom), (x1, bottom), (x1 - 1.8, top), (x0 + 1.8, top)]),
            ('cap', (x0 + 0.7, bottom - 0.7), (x1 - 0.7, bottom - 0.7), 1.5)]


def _cuff_lines(top, bottom, xs):
    return [((x, top + 0.9), (x, bottom - 1.9)) for x in xs]


POINTER_BASE = [
    *_cuff(8.5, 23.5, 25.2, 31.0),
    ('cap', (12.5, 20.5), (20.0, 20.5), 9.0),  # the fist behind the finger
    ('cap', (15.4, 16.6), (15.4, 16.6), 4.4), ('cap', (18.8, 16.2), (18.8, 16.2), 4.4),  # curled knuckles
    ('cap', (21.8, 16.8), (21.8, 16.8), 4.0),
    ('cap', (21.2, 20.6), (24.0, 17.6), 3.4),  # the thumb, folded against the side
    ('cap', (11.8, 16.5), (11.8, 4.6), 4.5),  # the pointing finger
]
POINTER_THUMB = None
POINTER_LINES = [((9.7, 8.6), (13.9, 8.6)), ((9.7, 12.2), (13.9, 12.2)),  # plate joints on the finger
                 ((17.1, 15.2), (17.1, 18.6)), ((20.3, 15.4), (20.3, 18.6)),  # knuckle creases
                 *_cuff_lines(25.2, 31.0, (12.0, 15.9, 19.8))]
POINTER_LIGHTS = [((10.3, 6.4), (10.3, 15.0)), ((9.4, 26.4), (10.2, 29.8))]
POINTER_TIP = (11.8, 4.6 - 2.25 + 1.0)  # a hair inside the end of the finger
POINTER_BOX = (1.6, 1.6, 24.0, 30.6)  # the emblem may graze the cuff's lower right
POINTER_PLACE = fit(POINTER_BASE, POINTER_BOX, ang=-30.0, pivot=(16.0, 22.0))
POINTER_HOTSPOT = tuple(round(v) for v in POINTER_PLACE.p(*POINTER_TIP))


def pointer(px, colours=(BRASS_HI, BRASS_LO), line_colour=BRASS_LO, thumb_colours=(GOLD, BRASS), emblem=None):
    pl = POINTER_PLACE
    return render_glove(px, [pl.part(x) for x in POINTER_BASE],
                        lines=[pl.seg(*ln) for ln in POINTER_LINES], lights=[pl.seg(*ln) for ln in POINTER_LIGHTS],
                        colours=colours, line_colour=line_colour,
                        thumb_colours=thumb_colours, emblem=emblem)


# ---- the grip: open and closed gauntlets ----
def open_hand_parts(pl):
    fingers = [(9.2, 7.5), (13.6, 5.1), (18.0, 6.3), (22.4, 10.1)]  # x, top centre
    parts = [('cap', (x, top), (x, 17.5), 3.8) for x, top in fingers]
    parts += [('cap', (11.0, 20.0), (21.5, 20.0), 11.0), ('cap', (8.5, 20.5), (4.6, 14.7), 4.4)]
    parts += _cuff(8.0, 24.5, 25.0, 30.5)
    lines = [((x - 1.7, top + 4.6), (x + 1.7, top + 4.6)) for x, top in fingers]  # plate joints
    lines += [((x - 1.7, top + 8.4), (x + 1.7, top + 8.4)) for x, top in fingers[:3]]
    lines += _cuff_lines(25.0, 30.5, (12.2, 16.2, 20.2))
    lights = [((x - 1.2, top + 0.6), (x - 1.2, top + 4.0)) for x, top in fingers]
    return [pl.part(x) for x in parts], [pl.seg(*ln) for ln in lines], [pl.seg(*ln) for ln in lights], pl.p(17.0, 17.0)


def fist_parts(pl, cuff=True):
    parts = [('cap', (10.5, 19.0), (21.5, 19.0), 13.0)]
    parts += [('cap', (x, 14.0), (x, 14.0), 5.2) for x in (10.0, 14.0, 18.0, 22.0)]  # knuckle plates
    lines = [((x, 13.4), (x, 18.2)) for x in (12.0, 16.0, 20.0)]
    if cuff:
        parts += _cuff(8.0, 24.0, 25.5, 30.8)
        lines += _cuff_lines(25.5, 30.8, (12.2, 16.0, 19.8))
    thumb = ('cap', (9.5, 22.2), (19.0, 22.8), 4.6)
    return [pl.part(x) for x in parts], [pl.seg(*ln) for ln in lines], pl.part(thumb), pl.p(16.0, 17.0)


def hand(px, kind):
    emblem = {'drop-yes': 'star', 'drop-no': 'swords'}.get(kind)
    tris = []
    if kind in ('grab', 'drop-yes', 'drop-no'):
        pl = Place(k=1.0, ox=1.0, oy=0.3) if kind == 'grab' else Place(k=0.84, ox=1.0, oy=0.5)
        parts, lines, lights, hot = open_hand_parts(pl)
        img = render_glove(px, parts, lines=lines, lights=lights, emblem=emblem, emblem_at=(25.2, 25.4))
    else:
        if kind == 'drag':
            pl = Place(k=1.0, ox=0.0, oy=-1.0)
            parts, lines, thumb, hot = fist_parts(pl)
        else:  # pan: the fist alone, a small one, inside four compass points
            pl = Place(k=0.72, ox=4.48, oy=3.2)
            parts, lines, thumb, hot = fist_parts(pl, cuff=False)
            for tip, a, b in (((16, 1.2), (13.4, 5.8), (18.6, 5.8)), ((16, 30.8), (13.4, 26.2), (18.6, 26.2)),
                              ((1.2, 16.5), (5.8, 13.9), (5.8, 19.1)), ((30.8, 16.5), (26.2, 13.9), (26.2, 19.1))):
                tris.append([tip, a, b])
        img = render_glove(px, parts, lines=lines, thumb=thumb, tris=tris)
    return img, (round(hot[0]), round(hot[1]))


# Pointer family: the same gauntlet in five states. Iron for the disabled one.
POINTERS = {
    'point-default': dict(),
    'point-interact': dict(colours=(GOLD, BRASS), thumb_colours=(GOLD, BRASS_HI), emblem='star'),
    'point-inspect': dict(emblem='eye'),
    'point-wait': dict(emblem='hourglass'),
    'point-disabled': dict(colours=(IRON_HI, IRON_LO), line_colour=IRON_LO, thumb_colours=(IRON_HI, IRON_LO), emblem='padlock'),
}
HANDS = ('grab', 'drag', 'drop-yes', 'drop-no', 'pan')


def build_set():
    manifest = {}
    for name, opts in POINTERS.items():
        for px, suffix in SIZES:
            pointer(px, **opts).save(os.path.join(OUT, f'game-{name}{suffix}.png'))
        manifest[name] = {'hotspot': list(POINTER_HOTSPOT), 'sizes': [px for px, _ in SIZES]}
    for kind in HANDS:
        hot = None
        for px, suffix in SIZES:
            im, hot = hand(px, kind)
            im.save(os.path.join(OUT, f'game-hand-{kind}{suffix}.png'))
        manifest[f'hand-{kind}'] = {'hotspot': list(hot), 'sizes': [px for px, _ in SIZES]}
    with open(os.path.join(OUT, 'game-cursors.json'), 'w') as fh:
        json.dump(manifest, fh, indent=2)
        fh.write('\n')


for scale, suffix in ((1, ''), (2, '@2x')):
    arrow(scale, False).save(os.path.join(OUT, f'map-arrow{suffix}.png'))
    arrow(scale, True, legacy_ring=True).save(os.path.join(OUT, f'map-point{suffix}.png'))
    star(scale).save(os.path.join(OUT, f'map-move{suffix}.png'))
build_set()
print('ok')
