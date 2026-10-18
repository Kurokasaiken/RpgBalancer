#!/usr/bin/env python3
"""PLAN-046 T-002 — bake depth sidecars for quest scene art.

Depth Anything V2 Small (ONNX, Apache-2.0) → half-res 8-bit WebP depth maps in
``public/assets/depth/<basename>.webp`` consumed by the quest Theater
DepthScene renderer (``.mw/desiderata.md`` v34, plan artifact-r011 §4).

Standalone on purpose (not merged into rpg-gen-mockup.py): different deps —
onnxruntime + pillow only, no torch/diffusers. Model weights are cached under
``~/.cache/huggingface`` like the rest of the local-gen pipeline.

Usage:
    venv/bin/python scripts/bake-depth.py public/assets/scene-library/agguato-foresta.jpg [...]
    venv/bin/python scripts/bake-depth.py --all-mapped        # every NODE_ART cover jpg
"""

import argparse
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

MODEL_REPO = "onnx-community/depth-anything-v2-small"
MODEL_FILE = "onnx/model.onnx"
INPUT_SIZE = 518  # Depth-Anything-V2 fixed input edge (multiple of 14)
OUT_DIR = Path("public/assets/depth")
MAX_BYTES = 200 * 1024  # artifact-r011 §4 byte budget


def load_session() -> ort.InferenceSession:
    from huggingface_hub import hf_hub_download

    path = hf_hub_download(MODEL_REPO, MODEL_FILE)
    return ort.InferenceSession(path, providers=["CPUExecutionProvider"])


def infer_depth(session: ort.InferenceSession, img: Image.Image) -> np.ndarray:
    """Return a float32 relative-depth map (0..1, nearer = brighter)."""
    w, h = img.size
    scale = INPUT_SIZE / max(w, h)
    nw, nh = (round(w * scale / 14) * 14, round(h * scale / 14) * 14)
    inp = img.resize((nw, nh), Image.BICUBIC)
    x = (np.asarray(inp, dtype=np.float32) / 255.0 - 0.5) / 0.5
    x = np.transpose(x, (2, 0, 1))[None]
    (out,) = session.run(None, {"pixel_values": x})
    d = out[0, 0] if out.ndim == 4 else out[0]
    d = (d - d.min()) / max(d.max() - d.min(), 1e-6)
    return np.asarray(
        Image.fromarray((d * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC),
        dtype=np.float32,
    ) / 255.0


def bake(session: ort.InferenceSession, src: Path, blur_radius: float, half: bool) -> Path:
    img = Image.open(src).convert("RGB")
    depth = infer_depth(session, img)
    out = Image.fromarray((depth * 255).astype(np.uint8), "L")
    if half:
        out = out.resize((max(1, out.width // 2), max(1, out.height // 2)), Image.BICUBIC)
    if blur_radius > 0:
        out = out.filter(ImageFilter.GaussianBlur(blur_radius))
    dest = OUT_DIR / (src.stem + ".webp")
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "WEBP", quality=90, method=6)
    size = dest.stat().st_size
    print(f"{src.name}: {img.size[0]}x{img.size[1]} -> {dest} {out.width}x{out.height} {size/1024:.0f}KB")
    if size > MAX_BYTES:
        print(f"  WARNING: exceeds {MAX_BYTES//1024}KB budget — re-save at lower quality", file=sys.stderr)
    return dest


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("images", nargs="*", type=Path, help="scene JPGs to bake")
    ap.add_argument("--blur", type=float, default=1.5, help="post-blur radius px on the half-res map (default 1.5)")
    ap.add_argument("--full-res", action="store_true", help="keep full resolution (default: half)")
    args = ap.parse_args()
    if not args.images:
        ap.error("pass at least one image")
    session = load_session()
    for src in args.images:
        if not src.exists():
            print(f"missing: {src}", file=sys.stderr)
            return 1
        bake(session, src, args.blur, half=not args.full_res)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
