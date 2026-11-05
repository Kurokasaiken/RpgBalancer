#!/usr/bin/env python3
"""PLAN-106 — deterministic defended plates via compositing (v2, Director 2026-11-02).

Every defended/towered plate = ONE growth base plate + a stamped defence ring +
stamped tower sprites, so a state transition only ever ADDS an element over a
pixel-identical village — the old per-state repaints morphed the whole zone on
every cross-fade («continua a flickerare»).

Two leaks fixed from v1:
  - towers are stamped from the clean purpose-cut sprites `parts/tower-*.png`,
    not diff-extracted from the raw raws — those carried a crenellated wall arc
    with them («un muro nella cinta muraria»);
  - one canonical foot per slot across materials AND families — s2 used to be
    (412,242) for wood and (439,246) for stone («la torre è in un posto diverso»).

Ring sprite = the defended plate's pixels inside a band that follows the PAINTED
ring (diff-driven mask, dilated + feathered), taken from the approved stone
plates. Towers stand INSIDE the ring (Director 2026-11-02): s1 = west inner,
s2 = east inner.
"""
import json as _json_mod
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIL = ROOT / 'public/assets/world/mappa2/base/fx/village'

# Ring geometry (manifest anchors): centre (251,186), radii (210,128).
YY, XX = np.mgrid[0:390, 0:510]
DE = ((XX - 251) / 210) ** 2 + ((YY - 186) / 128) ** 2
RING_VICINITY = (DE > 0.55) & (DE < 1.75)
RING_BAND = (DE > 0.8) & (DE < 1.3)

# Closed-ring source (2026-11-03): `out/village-chain/ring-src-stone-*.webp` are
# full repaints whose ring is painted CLOSED all round — no rotated north arc
# needed. Their ring ellipse (cv2.fitEllipse on the diff vs the stone base):
# centre (289.4,212.7), semi-axes 155 (≈horizontal) × 96, tilted 5°.
_T = np.deg2rad(85.0)
_XR = (XX - 289.4) * np.cos(_T) + (YY - 212.7) * np.sin(_T)
_YR = -(XX - 289.4) * np.sin(_T) + (YY - 212.7) * np.cos(_T)
SRC_DE = (_XR / 95.6) ** 2 + (_YR / 154.9) ** 2

# Canonical tower feet (plate px), shared by every material and defence.
# Kept well INSIDE the courtyard (Director: towers at the wall line merge into
# the ring and read as «half not visible»; these sit in open ground).
FEET = {1: (183, 262), 2: (395, 262)}  # SRC_DE ≈ 0.73: west/east inner courtyard
TOWER_SCALE = {'wood': 0.108, 'stone': 0.14}

GROWTHS = ('cottages', 'straw', 'stone')
DEFENCES = ('palisade', 'wall')


def load_rgba(name):
    return np.array(Image.open(VIL / name).convert('RGBA'))


def load_ring_src(defence: str) -> np.ndarray:
    """The approved painted defended plate the ring is cut from. Kept OUTSIDE the
    output dir: this script overwrites `stone-<defence>-none-none.webp`, and
    re-reading its own (or a foreign rebake's) output degrades the ring every run
    (2026-11-03: an opaque RGB rebake fed back in → rectangle seams on the map)."""
    return np.array(Image.open(ROOT / f'out/village-chain/ring-src-stone-{defence}.webp').convert('RGBA'))


def tone_stats(rgba: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Per-channel mean/std of the opaque mid-tones of a sprite."""
    px = rgba[..., :3][rgba[..., 3] > 200].astype(np.float32)
    lum = px.mean(axis=1)
    px = px[(lum > 30) & (lum < 200)]
    return px.mean(axis=0), px.std(axis=0)


def tone_match(rgba: np.ndarray, target: tuple[np.ndarray, np.ndarray], amount: float = 0.85) -> np.ndarray:
    """Reinhard-style per-channel transfer toward `target` (mean, std) — guide
    rule 10: a green-screen sprite comes back in its own palette (the wood
    lattice tower: dark olive, read as slate-blue next to the warm palisade)."""
    mu, sd = tone_stats(rgba)
    tmu, tsd = target
    rgb = rgba[..., :3].astype(np.float32)
    moved = (rgb - mu) / np.maximum(sd, 1) * tsd + tmu
    out = rgba.copy()
    out[..., :3] = np.clip(rgb + (moved - rgb) * amount, 0, 255).astype(np.uint8)
    return out


def load_tower(name: str, sat: float, brightness: float) -> np.ndarray:
    """Clean purpose-cut sprite, softened to sit inside the painted plate:
    desaturated + dimmed toward the plate palette, lightly blurred and
    alpha-feathered — the crisp parts/ sprites otherwise read as pasted."""
    im = Image.open(VIL / name).convert('RGBA')
    rgb = ImageEnhance.Brightness(ImageEnhance.Color(im.convert('RGB')).enhance(sat)).enhance(brightness)
    rgb = rgb.filter(ImageFilter.GaussianBlur(0.8))
    a = cv2.GaussianBlur(np.asarray(im)[..., 3].astype(np.float32), (3, 3), 0)
    out = np.array(rgb.convert('RGBA'))
    out[..., 3] = a.astype(np.uint8)
    return out


def close_north_arc(defended_rgb: np.ndarray, host_rgb: np.ndarray) -> np.ndarray:
    """The generator never painted the NORTH arc of the ring — every defended raw
    stops at the west/east shoulders, and the little it painted is hidden behind
    foreground trees («mura non chiuse»). Complete it: rotate the painted south
    arc 180° around the ellipse centre (251,186) into the whole north band so the
    wall renders OVER the painted vegetation, feathered at the band edges."""
    band = (DE > 0.75) & (DE < 1.45)
    gap = band & (YY < 150)
    rot = cv2.warpAffine(defended_rgb, cv2.getRotationMatrix2D((251.0, 186.0), 180, 1.0), (510, 390))
    patch = cv2.GaussianBlur(gap.astype(np.uint8) * 255, (0, 0), 7).astype(np.float32) / 255
    out = defended_rgb.astype(np.float32)
    for c in range(3):
        out[..., c] = rot[..., c] * patch + out[..., c] * (1 - patch)
    return out.astype(np.uint8)


def extract_ring(host_rgb: np.ndarray, defended_rgb: np.ndarray) -> np.ndarray:
    """RGBA band sprite of the painted defence ring: defended-plate pixels where
    the plate differs from its host inside the ring vicinity, dilated into a
    full band (ring + ground under it) and feathered so it blends on any base."""
    d = cv2.absdiff(defended_rgb, host_rgb).max(axis=2)
    m = ((d > 14) & RING_VICINITY).astype(np.uint8) * 255
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros_like(m)
    for i in range(1, n):
        comp = lab == i
        if stats[i, 4] < 400:
            continue
        if (RING_BAND & comp).sum() > 60:  # must touch the ring line, not interior noise
            keep[comp] = 255
    keep = cv2.dilate(keep, np.ones((25, 25), np.uint8))
    keep = cv2.GaussianBlur(keep, (0, 0), 9)
    a = keep.astype(np.float32) / 255
    return np.dstack([defended_rgb, (a * 255).astype(np.uint8)]).astype(np.uint8)


def extract_closed_ring(host_rgb: np.ndarray, defended_rgb: np.ndarray) -> np.ndarray:
    """RGBA band sprite of a CLOSED painted ring: defended pixels that differ from
    the host inside the fitted ring annulus, dilated + feathered. The source is a
    full repaint, so the band is kept tight to avoid dragging its houses along."""
    d = cv2.absdiff(defended_rgb, host_rgb).max(axis=2)
    band = ((SRC_DE > 0.62) & (SRC_DE < 1.42) & (d > 22)).astype(np.uint8) * 255
    band = cv2.dilate(band, np.ones((9, 9), np.uint8))
    band = cv2.GaussianBlur(band, (0, 0), 4)
    return np.dstack([defended_rgb, band]).astype(np.uint8)


def over(base: np.ndarray, spr: np.ndarray) -> np.ndarray:
    """Alpha-over a full-plate-size sprite."""
    a = spr[..., 3:4].astype(np.float32) / 255
    base = base.astype(np.float32)
    base[..., :3] = spr[..., :3] * a + base[..., :3] * (1 - a)
    return base.astype(np.uint8)


# Gemini repaint width → plate width, ×0.8: the stone tower upgrades the wood one in the SAME
# slot, so its footprint stays close to the lattice tower's (Director 2026-11-04)
STONE_INT_SCALE = 510 / 1172 * 0.8


def cast_shadow(base: np.ndarray, foot: tuple[int, int], width: float, strength: float = 0.5) -> None:
    """Soft cast shadow on the ground, falling lower-right (the plates are lit
    from the upper left) — gives the stamped tower ground contact."""
    fx, fy = foot
    sh = np.zeros(base.shape[:2], np.float32)
    cv2.ellipse(sh, (int(fx + width * 0.45), int(fy - width * 0.12)), (int(width * 0.7), max(3, int(width * 0.16))), -12, 0, 360, 1.0, -1)
    sh = cv2.GaussianBlur(sh, (0, 0), max(1.0, width * 0.1)) * strength
    base[..., :3] = (base[..., :3].astype(np.float32) * (1 - sh[..., None])).astype(np.uint8)


def stamp_foot(base: np.ndarray, spr: np.ndarray, foot: tuple[int, int], scale: float) -> None:
    """Alpha-over a sprite anchored by its footprint (bottom-centre of opaque
    pixels) at `foot` — wood and stone stand at exactly the same spot."""
    spr = np.array(Image.fromarray(spr).resize(
        (int(spr.shape[1] * scale), int(spr.shape[0] * scale)), Image.LANCZOS)).astype(np.float32)
    h, w = spr.shape[:2]
    al = spr[..., 3] > 60
    ys, xs = np.where(al)
    ybot = ys.max()
    fc = xs[ys >= ybot - 8].mean()
    fx, fy = foot
    x0, y0 = int(fx - fc), int(fy - ybot)
    bx0, by0, bx1, by1 = max(0, x0), max(0, y0), min(base.shape[1], x0 + w), min(base.shape[0], y0 + h)
    if bx1 <= bx0 or by1 <= by0:
        return
    sp = spr[by0 - y0:by0 - y0 + (by1 - by0), bx0 - x0:bx0 - x0 + (bx1 - bx0)]
    a = sp[..., 3:4] / 255
    reg = base[by0:by1, bx0:bx1].astype(np.float32)
    reg[..., :3] = sp[..., :3] * a + reg[..., :3] * (1 - a)
    reg[..., 3] = np.maximum(reg[..., 3], sp[..., 3])
    base[by0:by1, bx0:bx1] = reg.astype(np.uint8)


def scaled_with_foot(spr: np.ndarray, scale: float) -> tuple[np.ndarray, tuple[float, int]]:
    """Sprite resized exactly like `stamp_foot` does, plus its foot (bottom-centre
    of the opaque pixels) in sprite px — the runtime anchor of an element."""
    out = np.array(Image.fromarray(spr).resize(
        (int(spr.shape[1] * scale), int(spr.shape[0] * scale)), Image.LANCZOS))
    ys, xs = np.where(out[..., 3] > 60)
    ybot = int(ys.max())
    return out, (float(xs[ys >= ybot - 8].mean()), ybot)


def shadow_sprite(width: float) -> tuple[np.ndarray, tuple[int, int]]:
    """`cast_shadow` as a black RGBA sprite (alpha = darkening) + the foot
    position inside it — drawn under an element at runtime."""
    pad = int(width * 1.6)
    canvas = np.full((pad * 2, pad * 3, 4), 255, np.uint8)
    canvas[..., 3] = 255
    foot = (pad, pad)
    cast_shadow(canvas, foot, width)
    a = 255 - canvas[..., 0]
    ys, xs = np.where(a > 2)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    rgba[..., 3] = a[y0:y1, x0:x1]
    return rgba, (foot[0] - x0, foot[1] - y0)


def export_elements(rings: dict, kinds: dict[str, tuple[np.ndarray, float]]) -> None:
    """R-313 prototype: the same layers this script bakes into plates, exported
    as runtime elements (`fx/village/elements/`): one RGBA per ring, one per
    element kind with its foot anchor + shadow. The plate path is unchanged."""
    out_dir = VIL / 'elements'
    out_dir.mkdir(exist_ok=True)
    spec: dict = {'version': 1, 'slots': {str(k): list(v) for k, v in FEET.items()}, 'rings': {}, 'kinds': {}}
    for d, ring in rings.items():
        Image.fromarray(ring, 'RGBA').save(out_dir / f'ring-{d}.webp', quality=95)
        spec['rings'][d] = f'ring-{d}.webp'
    for kind, (spr, scale) in kinds.items():
        img, foot = scaled_with_foot(spr, scale)
        Image.fromarray(img, 'RGBA').save(out_dir / f'{kind}.png')
        sh, sh_foot = shadow_sprite(img.shape[1])
        Image.fromarray(sh, 'RGBA').save(out_dir / f'{kind}-shadow.png')
        spec['kinds'][kind] = {'src': f'{kind}.png', 'foot': [round(foot[0], 1), foot[1]],
                               'shadow': {'src': f'{kind}-shadow.png', 'foot': [int(v) for v in sh_foot]}}
    with open(out_dir / 'elements.json', 'w') as f:
        _json_mod.dump(spec, f, indent=2)
    print('elements exported', list(spec['kinds']))


def main() -> None:
    stone_base = load_rgba('stone-none-none-none.webp')
    rings = {d: extract_closed_ring(stone_base[..., :3], load_ring_src(d)[..., :3]) for d in DEFENCES}
    towers = {
        # Director 2026-11-03: lattice tower A («A, traliccio»), toned to the painted palisade
        'wood': tone_match(load_tower('parts/tower-wood-v2a.png', sat=1.0, brightness=1.0), tone_stats(rings['palisade'])),
        'stone': load_tower('parts/tower-stone-gen.png', sat=1.0, brightness=1.0),
    }

    # Stone towers (Director 2026-11-03 «sembrano immagini appoggiate»): a keyed
    # sprite always reads as a sticker (GUIDE anti-pattern). The canonical sprite
    # was stamped once, Gemini repainted it INTO the plate (shaded side, stone of
    # the wall: prompts/tw-stone-integrate.txt), and the east tower was cut back
    # out of that repaint with the known silhouette (`parts/tower-stone-int.png`,
    # Gemini-res, ×STONE_INT_SCALE to plate). Gemini left the west one untouched
    # twice, so the east cut is the canonical sprite for both slots.
    stone_int = load_rgba('parts/tower-stone-int.png')

    export_elements(rings, {'tower-wood': (towers['wood'], TOWER_SCALE['wood']),
                            'tower-stone': (stone_int, STONE_INT_SCALE)})

    def plate(growth: str, defence: str, t1: str, t2: str) -> np.ndarray:
        out = load_rgba(f'{growth}-none-none-none.webp')
        if defence != 'none':
            out = over(out, rings[defence])
        for slot, mat in ((1, t1), (2, t2)):
            if mat == 'stone':
                cast_shadow(out, FEET[slot], stone_int.shape[1] * STONE_INT_SCALE)
                stamp_foot(out, stone_int, FEET[slot], STONE_INT_SCALE)
            elif mat != 'none':
                stamp_foot(out, towers[mat], FEET[slot], TOWER_SCALE[mat])
        return out

    def save(img: np.ndarray, key: str) -> None:
        name = key.replace('|', '-').replace('+', '-') + '.webp'
        Image.fromarray(img, 'RGBA').save(VIL / name, quality=95)
        print('composed', name)

    # Defence bases for every shipped growth (replaces the per-state repaints).
    for growth in GROWTHS:
        for defence in DEFENCES:
            save(plate(growth, defence, 'none', 'none'), f'{growth}|{defence}|none+none')
    # Stone tower combos on both defences.
    for defence in DEFENCES:
        for m1 in ('none', 'wood', 'stone'):
            for m2 in ('none', 'wood', 'stone'):
                if m1 == 'none' and m2 == 'none':
                    continue
                save(plate('stone', defence, m1, m2), f'stone|{defence}|{m1}+{m2}')
    # Shipped straw towers.
    save(plate('straw', 'none', 'wood', 'none'), 'straw|none|wood+none')
    save(plate('straw', 'palisade', 'wood', 'none'), 'straw|palisade|wood+none')
    save(plate('straw', 'palisade', 'wood', 'wood'), 'straw|palisade|wood+wood')


if __name__ == '__main__':
    main()
    # Cache-bust stamp: the runtime appends ?v=<bake> to plate URLs — updating it
    # here forces browsers off stale webp after every re-bake.
    import json as _json
    from datetime import datetime, timezone as _tz
    _m = VIL / 'village.json'
    _mf = _json.load(open(_m))
    _mf['bake'] = datetime.now(_tz.utc).isoformat()
    _json.dump(_mf, open(_m, 'w'), indent=2)
    print('bake stamp', _mf['bake'])
