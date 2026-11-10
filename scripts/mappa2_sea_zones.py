#!/usr/bin/env python3
"""Pack the two alpha-only mappa2 masks into ONE opaque texture (2026-11-10, /game GPU budget):

    masks/sea_zones.webp   R = alpha of masks/sea_mask.webp     (deep sea veil, sea pattern, seabed, foam)
                           G = alpha of masks/surf_zones.webp   (where the coast surf may draw)
                           B = 0, A = 255 (opaque: no premultiply can touch R/G)

The renderer reads the channel through a selector (`uSeaSel` / `uZoneSel` in PixiWorldMap), so every sample is
bit-identical to the alpha it replaces — one full-world texture (~21 MB with mipmaps) fewer. Lossless WebP.
Called by build-mappa2-assets.py after it writes the two masks; also runnable on a shipped pack.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def pack_sea_zones(masks_dir: Path) -> Path:
    sea = np.asarray(Image.open(masks_dir / "sea_mask.webp").convert("RGBA"))[..., 3]
    zones = np.asarray(Image.open(masks_dir / "surf_zones.webp").convert("RGBA"))[..., 3]
    assert sea.shape == zones.shape, (sea.shape, zones.shape)
    rgb = np.dstack([sea, zones, np.zeros_like(sea)]).astype(np.uint8)
    out = masks_dir / "sea_zones.webp"
    Image.fromarray(rgb, "RGB").save(out, lossless=True, quality=80, method=4)
    back = np.asarray(Image.open(out).convert("RGB"))
    assert np.array_equal(back[..., 0], sea) and np.array_equal(back[..., 1], zones), "lossless round-trip failed"
    return out


if __name__ == "__main__":
    masks = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("public/assets/world/mappa2/base/masks")
    print("wrote", pack_sea_zones(masks))
