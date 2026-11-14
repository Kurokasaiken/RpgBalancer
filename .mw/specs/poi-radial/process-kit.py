#!/usr/bin/env python3
"""Build aligned radial layers from the generated candidates.

The generator rasterized a checkerboard into every PNG: flood-fill cannot
recover alpha because the tiles are disconnected. Keep the painted circle
and separate the engraved frame from the enamel surfaces instead.
"""

import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
OUT = ROOT.parents[2] / "public/assets/ui/poi-radial"
SIZE = 1024
EDGE = 0.96
SECTOR_INNER = 0.40
SECTOR_OUTER = 0.69
RIB_HALF_DEG = 4.0
SOURCES = {
    "disc-base": ("disc-base-v1-0.png", (503.5, 536.5), (435, 443)),
    "disc-job": ("disc-job-v1-0.png", (488, 520), (420, 429)),
    "disc-quest": ("disc-quest-v1-0.png", (488, 520), (420, 429)),
    "disc-event": ("disc-event-v1-0.png", (488, 520), (420, 429)),
    "disc-glass": ("disc-glass-v1-0.png", (488, 520), (420, 429)),
    "hub": ("hub-v1-0.png", (488, 520), (420, 429)),
}


def aligned_plate(source: Path, centre: tuple[float, float], axes: tuple[int, int]) -> Image.Image:
    """Map each painted plate onto the same square canvas without keying."""
    cx, cy = centre
    rx, ry = axes
    return Image.open(source).convert("RGBA").transform(
        (SIZE, SIZE),
        Image.Transform.AFFINE,
        (
            2 * rx / (EDGE * SIZE), 0, cx - rx / EDGE,
            0, 2 * ry / (EDGE * SIZE), cy - ry / EDGE,
        ),
        resample=Image.Resampling.BICUBIC,
    )


def masked_plate(image: Image.Image, name: str) -> Image.Image:
    """Keep only frame or enamel, preserving gold ribs and real glass alpha."""
    pixels = image.load()
    mid = SIZE / 2
    for y in range(SIZE):
        dy = (y + 0.5 - mid) / mid
        for x in range(SIZE):
            dx = (x + 0.5 - mid) / mid
            r = math.hypot(dx, dy)
            degrees = math.degrees(math.atan2(dy, dx))
            rib_distance = abs((degrees + 22.5) % 45 - 22.5)
            enamel = SECTOR_INNER < r < SECTOR_OUTER and rib_distance > RIB_HALF_DEG
            alpha = pixels[x, y][3]
            if name == "disc-base":
                if enamel:
                    alpha = 0
            elif name == "disc-glass":
                if enamel:
                    light = max(0, -dy) * 18
                    pixels[x, y] = (27 + round(light), 43 + round(light), 56 + round(light), 78)
                    continue
                alpha = 0
            elif name != "hub" and not enamel:
                alpha = 0
            if r >= EDGE or (name not in ("disc-base", "hub") and not enamel):
                alpha = 0
            pixels[x, y] = (*pixels[x, y][:3], alpha)
    return image


def main() -> None:
    """Export the candidate frame, enamel, glass and optional hub layers."""
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (filename, centre, axes) in SOURCES.items():
        image = aligned_plate(ROOT / "gen" / filename, centre, axes)
        image = masked_plate(image, name)
        image.save(OUT / f"{name}.webp", "WEBP", quality=94)
        print(name, image.size)


if __name__ == "__main__":
    main()
