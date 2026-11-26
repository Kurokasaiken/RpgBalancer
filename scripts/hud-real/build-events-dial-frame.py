#!/usr/bin/env python3
"""Build the Events medallion frame from the shared Time medallion frame.

Only the asymmetric inward scroll is removed: the clean left outer edge of the
same asset is mirrored onto the right outer edge with a narrow feather. The
gem, ring, ticks, spikes, geometry and alpha otherwise remain the Time object.
"""
from pathlib import Path
import json

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "public/assets/ui/hud-real/time/dial-frame.webp"
OUTPUT = ROOT / "public/assets/ui/hud-real/events/dial-frame.webp"
X_START = 300
FEATHER = 12


def regenerate() -> dict:
    im = Image.open(SOURCE).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    mirrored = arr[:, ::-1, :]
    h, w = arr.shape[:2]
    xx = np.arange(w, dtype=np.float32)[None, :]
    blend = np.clip((xx - X_START) / FEATHER, 0, 1)
    blend = np.repeat(blend, h, axis=0)[..., None]
    out = arr * (1 - blend) + mirrored * blend
    result = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")
    result.save(OUTPUT, "WEBP", lossless=True)

    diff = np.abs(np.array(result).astype(np.int16) - np.array(im).astype(np.int16)).max(axis=2)
    ys, xs = np.where(diff > 0)
    return {
        "output": str(OUTPUT.relative_to(ROOT)),
        "source": str(SOURCE.relative_to(ROOT)),
        "changed_pixels": int((diff > 0).sum()),
        "bbox": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else [0, 0, 0, 0],
        "x_start": X_START,
        "feather": FEATHER,
    }


if __name__ == "__main__":
    print(json.dumps(regenerate(), indent=2))
