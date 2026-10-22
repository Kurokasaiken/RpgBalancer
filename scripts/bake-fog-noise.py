#!/usr/bin/env python3
"""
Bake a horizontally tileable fog-noise texture (PLAN-050 T-013, R-228).

Radial-gradient veils can only ever read as a soft ellipse ("a white
stripe"); real 2D fog needs fibrous matter. This script bakes that matter
as an asset: a fractal (fBm) value-noise field, seamless along X, with a
baked vertical fade so a veil is a ground-hugging bank, not a rectangle.

Output is an RGBA PNG: white RGB + alpha carrying the fog density. The
AtmosphereLayer uses it as a CSS mask over the authored fog colour, so the
tint stays config-driven while the fibrous structure comes from the bake.

Deterministic: fixed seed, no external inputs. Re-run to reproduce
bit-identical output.

Usage:
    .mw/venv/bin/python scripts/bake-fog-noise.py \
        --out public/assets/atmosphere/fog/fog-noise-tile.png \
        --size 512 --seed 20261018
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def value_noise_tile(n: int, freq_y: int, freq_x: int, rng: np.random.Generator) -> np.ndarray:
    """Tileable value noise: `freq_x` x `freq_y` random lattice upsampled to
    `n` x `n` with wrapped smoothstep interpolation (seamless on both axes)."""
    lattice = rng.random((freq_y, freq_x)).astype(np.float32)
    ys = np.linspace(0, freq_y, n, endpoint=False)
    xs = np.linspace(0, freq_x, n, endpoint=False)
    y0 = np.floor(ys).astype(int) % freq_y
    x0 = np.floor(xs).astype(int) % freq_x
    fy = (ys - np.floor(ys))[:, None]
    fx = (xs - np.floor(xs))[None, :]
    sy = fy * fy * (3.0 - 2.0 * fy)
    sx = fx * fx * (3.0 - 2.0 * fx)
    c00 = lattice[np.ix_(y0, x0)]
    c10 = lattice[np.ix_((y0 + 1) % freq_y, x0)]
    c01 = lattice[np.ix_(y0, (x0 + 1) % freq_x)]
    c11 = lattice[np.ix_((y0 + 1) % freq_y, (x0 + 1) % freq_x)]
    top = c00 + (c01 - c00) * sx
    bot = c10 + (c11 - c10) * sx
    return top + (bot - top) * sy


def fbm_tile(n: int, seed: int) -> np.ndarray:
    """Fractal noise field in [0,1], horizontally elongated (fog wisps are
    wider than tall): octave X-frequency is half the Y-frequency."""
    rng = np.random.default_rng(seed)
    field = np.zeros((n, n), dtype=np.float32)
    amp, total = 1.0, 0.0
    for octave in range(6):
        freq_y = 4 * (2 ** octave)
        freq_x = max(2, freq_y // 2)
        field += amp * value_noise_tile(n, freq_y, freq_x, rng)
        total += amp
        amp *= 0.55
    field /= total
    field -= field.min()
    field /= max(field.max(), 1e-6)
    return field


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--size', type=int, default=512)
    ap.add_argument('--seed', type=int, default=20261018)
    args = ap.parse_args()

    n = args.size
    field = fbm_tile(n, args.seed)

    # Density shaping: hollow out the low end so the fog has holes and
    # filaments, not uniform grey — wispy high end stays soft.
    alpha = np.clip((field - 0.28) * 2.4, 0.0, 1.0) ** 1.35

    # Baked vertical envelope: ground-hugging bank, soft top and bottom.
    y = np.linspace(0.0, 1.0, n)[:, None]
    envelope = (np.sin(np.pi * np.clip(y, 0.0, 1.0)) ** 0.85).astype(np.float32)
    alpha *= envelope

    # Anti-banding dither (8-bit output on smooth gradients bands visibly).
    rng = np.random.default_rng(args.seed + 1)
    alpha += (rng.random(alpha.shape, dtype=np.float32) - 0.5) / 255.0
    alpha = np.clip(alpha, 0.0, 1.0)

    rgba = np.zeros((n, n, 4), dtype=np.uint8)
    rgba[..., 0:3] = 255
    rgba[..., 3] = (alpha * 255.0).astype(np.uint8)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, 'RGBA').save(args.out)
    print(f'wrote {args.out} ({n}x{n}, seed={args.seed}, '
          f'alpha mean={alpha.mean():.3f}, p95={np.quantile(alpha, 0.95):.3f})')


if __name__ == '__main__':
    main()
