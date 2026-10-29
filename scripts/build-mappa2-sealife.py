"""Sea-life silhouettes (PLAN-094, Director art 2026-10-29): Gemini black-on-white sheets -> separated RGBA
parts (white RGB + alpha, tinted at runtime) + a rig json (pivot/attach per part).

Each sheet holds one animal drawn top-down, head to the RIGHT, as separate pieces with small hinge tabs.
The largest piece is the body; every other piece is hinged back onto it at the closest point."""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

SRC = Path(__file__).parent / "assets-src" / "mappa2-sealife"
OUT = Path("public/assets/world/mappa2/base/fx/sea-life")
# id -> (flip horizontally so the head points right, target body length px in the shipped png)
ANIMALS = {
    "pesce": (False, 160), "pescione": (False, 384), "martello": (True, 384),
    "delfino": (False, 288), "manta": (False, 384), "tartaruga": (False, 224),
}
MIN_AREA = 400  # px in the source sheet: drops specks and the numeral labels' islands


def process(name: str, flip: bool, body_len: int) -> dict:
    img = Image.open(SRC / f"{name}.jpeg").convert("L")
    if flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    g = np.array(img).astype(np.float32)
    ink = (g < 128).astype(np.uint8)
    # numerals and slits inside a shape are white holes: fill them (external contours only)
    cnts, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros_like(ink)
    cv2.drawContours(filled, cnts, -1, 1, -1)
    n, lab, st, _ = cv2.connectedComponentsWithStats(filled)
    comps = [i for i in range(1, n) if st[i, 4] >= MIN_AREA]
    comps.sort(key=lambda i: -st[i, 4])
    body_i = comps[0]
    # anti-aliased alpha from luminance, solid inside the filled shape
    soft = np.clip((215.0 - g) / (215.0 - 40.0), 0, 1)
    alpha = np.maximum(soft, filled.astype(np.float32))
    body_mask = lab == body_i
    bx, by, bw, bh = st[body_i, :4]
    scale = body_len / float(bw)
    body_c = np.array([bx + bw / 2.0, by + bh / 2.0])
    body_pts = np.column_stack(np.where(body_mask)[::-1]).astype(np.float32)  # (x, y)
    parts, out = [], {}
    for k, i in enumerate(comps):
        x, y, w, h = st[i, :4]
        pad = 3
        x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(g.shape[1], x + w + pad), min(g.shape[0], y + h + pad)
        sub = alpha[y0:y1, x0:x1] * (np.isin(lab[y0:y1, x0:x1], [0, i]).astype(np.float32))
        rgba = np.dstack([np.full(sub.shape, 255, np.uint8)] * 3 + [(sub * 255).astype(np.uint8)])
        im = Image.fromarray(rgba, "RGBA")
        nw, nh = max(1, round(im.width * scale)), max(1, round(im.height * scale))
        im = im.resize((nw, nh), Image.LANCZOS)
        role = "body" if i == body_i else f"part{k}"
        fname = f"{name}_{role}.png"
        OUT.mkdir(parents=True, exist_ok=True)
        im.save(OUT / fname, optimize=True)
        entry = {"role": role, "file": f"fx/sea-life/{fname}", "width": nw, "height": nh}
        if i != body_i:
            py, px = np.where(lab == i)
            pts = np.column_stack([px, py]).astype(np.float32)
            # closest pair (part pixel, body pixel): the hinge sits where the tab meets the body
            best = (1e18, None, None)
            for chunk in np.array_split(pts, max(1, len(pts) // 400)):
                d2 = ((chunk[:, None, :] - body_pts[None, ::3, :]) ** 2).sum(2)
                a_i, b_i = np.unravel_index(np.argmin(d2), d2.shape)
                if d2[a_i, b_i] < best[0]:
                    best = (float(d2[a_i, b_i]), chunk[a_i], body_pts[::3][b_i])
            pivot_sheet, attach_sheet = best[1].astype(float), best[2].astype(float)
            entry["pivot"] = [round(float((pivot_sheet[0] - x0) * scale), 1), round(float((pivot_sheet[1] - y0) * scale), 1)]
            entry["attach"] = [round(float((attach_sheet[0] - body_c[0]) * scale), 1), round(float((attach_sheet[1] - body_c[1]) * scale), 1)]
            entry["gapPx"] = round(float(np.linalg.norm(pivot_sheet - attach_sheet) * scale), 1)
            cen = np.array([px.mean(), py.mean()])
            entry["offset"] = [round(float((cen[0] - body_c[0]) * scale), 1), round(float((cen[1] - body_c[1]) * scale), 1)]
        parts.append(entry)
    return {"lengthPx": body_len, "parts": parts}


def main() -> None:
    rig = {"version": 1, "animals": {n: process(n, f, L) for n, (f, L) in ANIMALS.items()}}
    (OUT.parent.parent / "sea-life.json").write_text(json.dumps(rig, indent=2), encoding="utf-8")
    for n, a in rig["animals"].items():
        print(n, [(p["role"], p["width"], p["height"], p.get("gapPx")) for p in a["parts"]])


if __name__ == "__main__":
    main()
