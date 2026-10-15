#!/usr/bin/env python3
"""Montaggio di un'icona dipinta — PLAN-058 T3.3.

Prende l'immagine generata su sfondo magenta piatto (#FF00FF, come da kit per
Gemini e Grok), toglie il fondo con alfa graduale, decontamina il magenta sui
bordi, ritaglia al soggetto e scrive le quattro taglie WebP con alfa:

    <dest>/<id>.webp      master 512
    <dest>/<id>-128.webp
    <dest>/<id>-64.webp
    <dest>/<id>-32.webp   passata di nitidezza leggera (taglia d'uso piccola)

Uso:
    python scripts/mount-icon.py <sorgente.jpeg|png> <id> <dest-dir>

Le immagini generate con sfondo trasparente (GPT image) passano comunque: il
magenta non c'è e l'alfa originale viene mantenuta.
"""
import pathlib
import sys

import numpy as np
from PIL import Image, ImageFilter

MASTER = 512
SIZES = (128, 64, 32)
MAGENTA = np.array([255.0, 0.0, 255.0])
SOFT_LO, SOFT_HI = 70.0, 170.0  # distanza dal magenta: sotto LO = fondo, sopra HI = soggetto
MARGIN = 0.06                   # aria attorno al soggetto, frazione del lato


def cut_background(img: Image.Image) -> Image.Image:
    rgba = np.array(img.convert("RGBA"), dtype=float)
    rgb = rgba[..., :3]
    dist = np.linalg.norm(rgb - MAGENTA, axis=-1)
    keep = np.clip((dist - SOFT_LO) / (SOFT_HI - SOFT_LO), 0.0, 1.0)
    alpha = np.minimum(keep, rgba[..., 3] / 255.0)
    # decontaminazione: dove il magenta filtra nei bordi (R e B sopra G), riporta R e B al G
    spill = (rgb[..., 0] > rgb[..., 1]) & (rgb[..., 2] > rgb[..., 1]) & (alpha < 1.0)
    r = np.where(spill, np.minimum(rgb[..., 0], rgb[..., 1]), rgb[..., 0])
    b = np.where(spill, np.minimum(rgb[..., 2], rgb[..., 1]), rgb[..., 2])
    out = np.dstack([r, rgb[..., 1], b, alpha * 255.0])
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def square_crop(img: Image.Image) -> Image.Image:
    alpha = img.getchannel("A").point(lambda v: 255 if v > 8 else 0)
    box = alpha.getbbox()
    if box is None:
        raise SystemExit("ERRORE: nessun soggetto trovato dopo aver tolto il fondo")
    subj = img.crop(box)
    side = int(max(subj.size) * (1 + 2 * MARGIN))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(subj, ((side - subj.size[0]) // 2, (side - subj.size[1]) // 2))
    return canvas


def main() -> int:
    if len(sys.argv) != 4:
        print(__doc__)
        return 2
    src, icon_id, dest = pathlib.Path(sys.argv[1]), sys.argv[2], pathlib.Path(sys.argv[3])
    dest.mkdir(parents=True, exist_ok=True)

    cut = square_crop(cut_background(Image.open(src)))
    master = cut.resize((MASTER, MASTER), Image.LANCZOS)
    master.save(dest / f"{icon_id}.webp", "WEBP", quality=92, lossless=False)
    for s in SIZES:
        small = master.resize((s, s), Image.LANCZOS)
        if s <= 32:
            small = small.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=2))
        small.save(dest / f"{icon_id}-{s}.webp", "WEBP", quality=92)
    print(f"{icon_id}: {dest}/ (512, 128, 64, 32)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
