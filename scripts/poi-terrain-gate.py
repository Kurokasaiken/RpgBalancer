#!/usr/bin/env python3
"""Cancello di contrasto POI ↔ terreno — PLAN-058 T2.5, bibbia §11.4.

Compone ogni POI del registro icone (Sigillo + glifo) su 8 ritagli reali della
mappa graded (`public/assets/world/wanderlust/base/`) e fallisce se:

  G1 bordo   il bordo del Sigillo ha contrasto < 3:1 col terreno su almeno un ritaglio
             (bordo doppio: conta il migliore tra anello scuro e anello avorio)
  G2 grigio  due famiglie POI diverse sono troppo simili in scala di grigi a 24 px

Il Sigillo segue il contratto di PLAN-058 T4.1 (bordo scuro #0b0a08 2 px + avorio
#efe3c6 1,5 px; sagoma = famiglia: impresa = tondo con coda, lavoro = tessera,
minaccia = rombo). Se T4.1 cambia, aggiornare SIGIL qui sotto.
Il glifo è il file dell'icona (`file` nel registro); finché manca, il Sigillo è
vuoto e il gate misura solo bordo e sagoma (lo segnala come "glifo mancante").

Uso:
    python scripts/poi-terrain-gate.py               # gate sul Sigillo
    python scripts/poi-terrain-gate.py --legacy      # misura anche gli anelli attuali (poiColorConfig.ts)
    python scripts/poi-terrain-gate.py --out <dir>   # dove scrivere sheet.png + report.json

Exit code 0 = verde; 1 = almeno un fallimento G1/G2.
"""
import argparse
import datetime
import itertools
import json
import pathlib
import re
import sys

import numpy as np
import yaml
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
WORLD = ROOT / "public/assets/world/wanderlust/base"
LAYERS = ("layers/base_flat.graded.webp", "layers/Mare.graded.webp")  # ordine z del manifest graded
REGISTRY = ROOT / "src/docs/docs/art-direction/icons/registry.yaml"
POI_COLORS = ROOT / "src/balancing/config/idleVillage/poiColorConfig.ts"

# 8 ritagli reali (centro in px della texture 3072×2049): un bioma ciascuno,
# inclusi i tre su cui gli anelli attuali falliscono (R-177: mare, sabbia, ocra).
CROPS = {
    "prateria": (1250, 1250),
    "foresta": (560, 900),
    "sabbia": (2250, 580),
    "ocra": (2600, 1250),
    "calanchi": (2150, 1480),
    "neve": (1700, 300),
    "mare": (140, 1300),
    "villaggio": (1460, 1130),
}
CROP_PX = 176          # lato del ritaglio a schermo
POI_PX = 56            # lato del Sigillo a schermo
SS = 4                 # supersampling per l'antialias

SIGIL = {
    "dark": (0x0B, 0x0A, 0x08), "dark_px": 2.0,
    "ivory": (0xEF, 0xE3, 0xC6), "ivory_px": 1.5,
    "field": (0x17, 0x34, 0x36),  # --skin-hud-lacquer-base (lacquer_atlas)
}
POI_FAMILIES = ("impresa", "lavoro", "minaccia")
MIN_BORDER = 3.0
MIN_GREY_DIFF = 0.05   # differenza media assoluta (0–1) tra due famiglie a 24 px in grigio


# ── colore ───────────────────────────────────────────────────────────────
def lin(c: np.ndarray) -> np.ndarray:
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def luminance(rgb: np.ndarray) -> np.ndarray:
    l = lin(rgb.astype(float))
    return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]


def contrast(a: float, b: float) -> float:
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


# ── mappa ────────────────────────────────────────────────────────────────
def load_map() -> Image.Image:
    base = None
    for rel in LAYERS:
        layer = Image.open(WORLD / rel).convert("RGBA")
        base = Image.new("RGBA", layer.size, (0, 0, 0, 255)) if base is None else base
        base.alpha_composite(layer)
    return base.convert("RGB")


def crop(world: Image.Image, centre: tuple[int, int]) -> Image.Image:
    manifest = json.loads((WORLD / "manifest-flat-graded.json").read_text())
    tex_per_screen = world.size[0] / manifest["coordinateSystem"]["canvas"]["width"]  # imageFit: fill
    half = CROP_PX * tex_per_screen / 2
    x, y = centre
    box = tuple(int(round(v)) for v in (x - half, y - half, x + half, y + half))
    return world.crop(box).resize((CROP_PX, CROP_PX), Image.LANCZOS)


# ── Sigillo ──────────────────────────────────────────────────────────────
def shape_mask(family: str, size: int) -> Image.Image:
    """Maschera piena della sagoma di famiglia, supersampled."""
    s = size * SS
    m = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(m)
    pad = 2 * SS
    if family == "impresa":  # tondo con coda (goccia verso il basso)
        r = (s - 2 * pad) * 0.40
        cx, cy = s / 2, pad + r
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
        d.polygon([(cx - r * 0.62, cy + r * 0.78), (cx + r * 0.62, cy + r * 0.78), (cx, s - pad)], fill=255)
    elif family == "lavoro":  # tessera
        d.rounded_rectangle([pad + 4 * SS, pad + 4 * SS, s - pad - 4 * SS, s - pad - 4 * SS], radius=6 * SS, fill=255)
    elif family == "minaccia":  # rombo
        d.polygon([(s / 2, pad), (s - pad, s / 2), (s / 2, s - pad), (pad, s / 2)], fill=255)
    else:
        raise ValueError(family)
    return m


def erode(mask: Image.Image, px: float) -> Image.Image:
    k = int(round(px * SS)) * 2 + 1
    return mask.filter(ImageFilter.MinFilter(k)) if k > 1 else mask


def draw_sigil(family: str, glyph: Image.Image | None) -> tuple[Image.Image, Image.Image]:
    """Ritorna (sigillo RGBA a POI_PX, maschera esterna L a POI_PX)."""
    outer = shape_mask(family, POI_PX)
    ivory = erode(outer, SIGIL["dark_px"])
    field = erode(ivory, SIGIL["ivory_px"])
    s = outer.size[0]
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    img.paste(Image.new("RGBA", (s, s), SIGIL["dark"] + (255,)), mask=outer)
    img.paste(Image.new("RGBA", (s, s), SIGIL["ivory"] + (255,)), mask=ivory)
    img.paste(Image.new("RGBA", (s, s), SIGIL["field"] + (255,)), mask=field)
    if glyph is not None:
        bbox = field.getbbox()
        side = int(min(bbox[2] - bbox[0], bbox[3] - bbox[1]) * 0.72)
        g = glyph.copy()
        g.thumbnail((side, side), Image.LANCZOS)
        cx, cy = (bbox[0] + bbox[2]) // 2, (bbox[1] + bbox[3]) // 2
        if family == "impresa":
            cy = int(bbox[1] + (bbox[3] - bbox[1]) * 0.40)
        layer = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        layer.paste(g, (cx - g.size[0] // 2, cy - g.size[1] // 2), g)
        layer.putalpha(Image.fromarray(np.minimum(np.array(layer.getchannel("A")), np.array(field))))
        img.alpha_composite(layer)
    small = (POI_PX, POI_PX)
    return img.resize(small, Image.LANCZOS), outer.resize(small, Image.LANCZOS)


def draw_legacy_ring(color: tuple[int, int, int]) -> tuple[Image.Image, Image.Image]:
    """Anello attuale (rim medio di poiColorConfig) su pietra scura, per il confronto prima/dopo."""
    s = POI_PX * SS
    outer = Image.new("L", (s, s), 0)
    ImageDraw.Draw(outer).ellipse([2 * SS, 2 * SS, s - 2 * SS, s - 2 * SS], fill=255)
    stone = erode(outer, 3)
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    img.paste(Image.new("RGBA", (s, s), color + (255,)), mask=outer)
    img.paste(Image.new("RGBA", (s, s), (0x2A, 0x1A, 0x0E, 255)), mask=stone)
    small = (POI_PX, POI_PX)
    return img.resize(small, Image.LANCZOS), outer.resize(small, Image.LANCZOS)


def place(bg: Image.Image, sigil: Image.Image) -> Image.Image:
    out = bg.convert("RGBA")
    off = (CROP_PX - POI_PX) // 2
    out.alpha_composite(sigil, (off, off))
    return out.convert("RGB")


def terrain_ring_lum(bg: Image.Image, outer: Image.Image) -> float:
    """Luminanza media del terreno in una corona di 6 px subito fuori dal bordo."""
    full = Image.new("L", bg.size, 0)
    off = (CROP_PX - POI_PX) // 2
    full.paste(outer, (off, off))
    inside = np.array(full) > 127
    grown = np.array(full.filter(ImageFilter.MaxFilter(13))) > 127
    ring = grown & ~inside
    return float(luminance(np.array(bg))[ring].mean())


def border_ratio(terrain_l: float, rings: list[tuple[int, int, int]]) -> float:
    return max(contrast(float(luminance(np.array([c]))[0]), terrain_l) for c in rings)


# ── registro ─────────────────────────────────────────────────────────────
def poi_entries() -> list[dict]:
    icons = yaml.safe_load(REGISTRY.read_text())["icons"]
    return [i for i in icons if i["livello"] == "dipinta" and i["famiglia"] in POI_FAMILIES]


def load_glyph(entry: dict) -> Image.Image | None:
    f = entry.get("file")
    return Image.open(ROOT / f).convert("RGBA") if f and (ROOT / f).exists() else None


def legacy_colors() -> dict[str, tuple[int, int, int]]:
    text = POI_COLORS.read_text()
    out = {}
    for kind in ("quest", "job", "event"):
        m = re.search(rf"\b{kind}: \{{.*?rimColors: \['#\w+', '#(\w{{6}})'", text, re.S)
        if m:
            out[kind] = tuple(int(m.group(1)[i:i + 2], 16) for i in (0, 2, 4))
    return out


def grey24(img: Image.Image) -> np.ndarray:
    flat = Image.new("RGBA", img.size, (128, 128, 128, 255))
    flat.alpha_composite(img)
    return np.array(flat.convert("L").resize((24, 24), Image.LANCZOS), dtype=float) / 255.0


# ── main ─────────────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--legacy", action="store_true", help="misura anche gli anelli attuali di poiColorConfig.ts")
    ap.add_argument("--out", default=None, help="cartella di uscita (default test-results/poi-terrain-gate/<data>)")
    args = ap.parse_args()

    out_dir = pathlib.Path(args.out) if args.out else ROOT / "test-results/poi-terrain-gate" / datetime.date.today().isoformat()
    out_dir.mkdir(parents=True, exist_ok=True)
    world = load_map()
    crops = {k: crop(world, c) for k, c in CROPS.items()}
    terrain = {}

    # Righe del foglio: una per famiglia (Sigillo vuoto) + una per ogni POI con glifo.
    rows: list[tuple[str, str, Image.Image, Image.Image, list]] = []
    for fam in POI_FAMILIES:
        sig, outer = draw_sigil(fam, None)
        rows.append((f"famiglia {fam}", fam, sig, outer, [SIGIL["dark"], SIGIL["ivory"]]))
    missing = []
    for e in poi_entries():
        g = load_glyph(e)
        if g is None:
            missing.append(e["id"])
            continue
        sig, outer = draw_sigil(e["famiglia"], g)
        rows.append((e["id"], e["famiglia"], sig, outer, [SIGIL["dark"], SIGIL["ivory"]]))
    legacy_rows = []
    if args.legacy:
        for kind, col in legacy_colors().items():
            sig, outer = draw_legacy_ring(col)
            legacy_rows.append((f"attuale {kind}", kind, sig, outer, [col]))

    report = {"date": datetime.date.today().isoformat(), "min_border": MIN_BORDER,
              "min_grey_diff": MIN_GREY_DIFF, "glyph_missing": missing, "rows": [], "legacy": [], "grey_pairs": []}
    failed = False

    def measure(rowset, key):
        nonlocal failed
        print(f"\n{'riga':<22}" + "".join(f"{c:>10}" for c in CROPS) + f"{'min':>8}")
        for name, fam, sig, outer, rings in rowset:
            ratios = {}
            for cname, bg in crops.items():
                tl = terrain.setdefault((cname, fam if key == "legacy" else "sigil", name), terrain_ring_lum(bg, outer))
                ratios[cname] = round(border_ratio(tl, rings), 2)
            mn = min(ratios.values())
            ok = mn >= MIN_BORDER
            if key == "rows" and not ok:
                failed = True
            print(f"{name:<22}" + "".join(f"{r:>10.2f}" for r in ratios.values()) + f"{mn:>8.2f} {'✓' if ok else '✗'}")
            report[key].append({"row": name, "family": fam, "ratios": ratios, "min": mn, "pass": ok})

    print(f"G1 bordo ≥ {MIN_BORDER}:1 sul terreno (contrasto WCAG, corona di 6 px fuori dal bordo)")
    measure(rows, "rows")
    if legacy_rows:
        print("\nconfronto — anelli attuali (poiColorConfig.ts, rim medio), non bloccante:")
        measure(legacy_rows, "legacy")

    print(f"\nG2 famiglie distinte in grigio a 24 px (differenza media ≥ {MIN_GREY_DIFF}):")
    by_name = {r[0]: r for r in rows}
    for a, b in itertools.combinations(rows, 2):
        if a[1] == b[1]:
            continue
        diff = float(np.abs(grey24(a[2]) - grey24(b[2])).mean())
        ok = diff >= MIN_GREY_DIFF
        failed |= not ok
        print(f"  {a[0]:<22} ↔ {b[0]:<22} {diff:.3f} {'✓' if ok else '✗'}")
        report["grey_pairs"].append({"a": a[0], "b": b[0], "diff": round(diff, 4), "pass": ok})
    if missing:
        print(f"\nglifo mancante (Sigillo vuoto, misurati solo bordo e sagoma): {', '.join(missing)}")

    # Foglio: per riga, ritagli a colori e poi in grigio.
    allrows = rows + legacy_rows
    label_w, gap = 150, 6
    w = label_w + len(CROPS) * (CROP_PX + gap)
    h = 22 + len(allrows) * 2 * (CROP_PX + gap)
    sheet = Image.new("RGB", (w, h), (24, 24, 24))
    d = ImageDraw.Draw(sheet)
    for i, cname in enumerate(CROPS):
        d.text((label_w + i * (CROP_PX + gap) + 4, 6), cname, fill=(230, 230, 230))
    y = 22
    for name, fam, sig, outer, rings in allrows:
        for mode in ("colore", "grigio"):
            d.text((6, y + CROP_PX // 2 - 12), name, fill=(230, 230, 230))
            d.text((6, y + CROP_PX // 2 + 2), mode, fill=(150, 150, 150))
            for i, bg in enumerate(crops.values()):
                tile = place(bg, sig)
                if mode == "grigio":
                    tile = tile.convert("L").convert("RGB")
                sheet.paste(tile, (label_w + i * (CROP_PX + gap), y))
            y += CROP_PX + gap
    sheet.save(out_dir / "sheet.png")
    (out_dir / "report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
    rel = out_dir.relative_to(ROOT) if out_dir.is_relative_to(ROOT) else out_dir
    print(f"\nfoglio: {rel}/sheet.png · report: {rel}/report.json")
    print("RISULTATO:", "FALLITO" if failed else "verde")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
