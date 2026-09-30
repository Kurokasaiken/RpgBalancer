#!/usr/bin/env python3
"""
Pre-composite the STATIC scenery layers of a World Surface manifest into one
image, and emit a companion manifest that uses it.

Why
---
The canonical manifest is the AUTHORING shape: one layer per painted element,
so an artist can move, retint, hide or replace any piece. At runtime the game
does not need them separate — as of 2026-09-22 not one surface layer declares
an animation, a condition or a parallax, so the renderer was compositing 19
static textures every frame to draw a painting that never changes.

This flattens exactly those, and nothing else. Measured on the Wanderlust base
map: 23 layers -> 5, 4.64 MB -> 0.83 MB, pixel identical.

The important property: THIS IS NOT A DESTRUCTIVE BAKE. The canonical manifest
and every source layer are untouched, and re-running this with a different
DYNAMIC list takes seconds. So when an element has to become a new version
(a forest burns, a portal opens, a settlement falls), you have two options and
both are cheap:

  1. The new art sits ON TOP of the old — add it as its own layer above
     `base_flat`. Nothing here changes at all. This is the normal case: a
     portal, a fire, a banner, an army.

  2. The old art must DISAPPEAR or be REPLACED by something that does not
     fully cover it — then that element cannot be part of the flat base. Add
     its id to DYNAMIC below and re-run: it pops back out as its own layer,
     free to be hidden or swapped per visual state, and everything else stays
     flattened.

Usage
-----
    python scripts/flatten-world-layers.py
    python scripts/flatten-world-layers.py --world wanderlust --dynamic village forest_dark_north
"""

from __future__ import annotations

import argparse
import copy
import json
import os
import sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required: pip install Pillow")

# Layers that must NEVER be flattened, because the game manipulates them at
# runtime. Extend this (or pass --dynamic) the moment a layer needs to change.
DYNAMIC_DEFAULT = {
    "event_shroud_left",   # the invasion shroud slides in; fires ~once an hour
    "event_shroud_right",
    "border",              # toggleable: the game shell may provide its own frame
    "frame",
    # The coastal ripple resolves its target layers BY ID and silently disables
    # itself when it cannot find them (`seaRippleActive` needs `Boolean(seaLayer)`
    # in WorldSurfaceRenderer). Flattening the sea away therefore kills the
    # effect with no error. The two islands are `seaRipple.extraLayerIds`: their
    # paint overlaps the opaque sea, so their own edge is the waterline there.
    "sea",
    "island_bottom_left",
    "island_bottom_right",
}


def flatten(world: str, dynamic: set[str], out_name: str) -> None:
    base = f"public/assets/world/{world}/base"
    manifest_path = f"{base}/manifest.json"
    with open(manifest_path) as fh:
        manifest = json.load(fh)

    # The layer rects are expressed in the SOURCE space the extraction pipeline
    # used, not in the manifest canvas — `renderer.imageFit: "fill"` stretches
    # the result. Compose in source space so every rect lands where it was cut.
    any_rect = next((l["rect"] for l in manifest["surfaceLayers"] if l.get("rect")), None)
    if not any_rect:
        sys.exit("no layer carries a rect; cannot infer the source space")
    src_w, src_h = int(any_rect["sourceWidth"]), int(any_rect["sourceHeight"])

    ordered = sorted(manifest["surfaceLayers"], key=lambda l: l["zIndex"])
    static = [l for l in ordered if l["id"] not in dynamic]
    kept = [l for l in ordered if l["id"] in dynamic]

    if not static:
        sys.exit("nothing to flatten")

    canvas = Image.new("RGBA", (src_w, src_h), (0, 0, 0, 0))
    bytes_in = 0
    for layer in static:
        path = f"{base}/layers/{layer['file']}"
        if not os.path.exists(path):
            sys.exit(f"missing layer file: {path}")
        bytes_in += os.path.getsize(path)
        img = Image.open(path).convert("RGBA")
        rect = layer.get("rect")
        if rect:
            box = (int(rect["x"]), int(rect["y"]))
            size = (int(rect["width"]), int(rect["height"]))
        else:
            box, size = (0, 0), (src_w, src_h)
        if img.size != size:
            img = img.resize(size, Image.LANCZOS)
        canvas.alpha_composite(img, box)

    out_path = f"{base}/layers/{out_name}"
    canvas.save(out_path, "WEBP", quality=92, method=6)

    # The flat layer inherits the base layer's z so it sits under everything kept.
    flat_layer = copy.deepcopy(static[0])
    flat_layer.update(
        {
            "id": "base_flat",
            "file": out_name,
            "zIndex": static[0]["zIndex"],
            "tags": ["background", "flattened"],
        }
    )
    flat_layer.pop("rect", None)  # full source size, like the sea layer

    out_manifest = copy.deepcopy(manifest)
    out_manifest["id"] = f"{manifest.get('id', world)}_flat"
    out_manifest["surfaceLayers"] = sorted([flat_layer] + kept, key=lambda l: l["zIndex"])
    with open(f"{base}/manifest-flat.json", "w") as fh:
        json.dump(out_manifest, fh, indent=2)

    print(f"flattened {len(static)} layers -> {out_name}")
    print(f"  in : {bytes_in / 1024 / 1024:.2f} MB across {len(static)} textures")
    print(f"  out: {os.path.getsize(out_path) / 1024 / 1024:.2f} MB across 1 texture")
    print(f"  kept separate: {[l['id'] for l in kept] or '(none)'}")
    print(f"  wrote {base}/manifest-flat.json")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--world", default="wanderlust")
    ap.add_argument("--out", default="base_flat.webp")
    ap.add_argument(
        "--dynamic",
        nargs="*",
        default=None,
        help="layer ids to keep separate, in ADDITION to the built-in defaults",
    )
    args = ap.parse_args()
    dynamic = set(DYNAMIC_DEFAULT) | set(args.dynamic or [])
    flatten(args.world, dynamic, args.out)


if __name__ == "__main__":
    main()
