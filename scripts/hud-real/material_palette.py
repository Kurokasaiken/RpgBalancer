#!/usr/bin/env python3
"""Palette per MATERIALE di un asset HUD (PLAN-128 OB-2, profilo [P3]).

Un materiale dipinto (ottone, smalto, gemma) non e' un colore: ha ombre,
mezzitoni e luci. Questo script segmenta l'arte in materiali e ne misura la
firma in CIELAB (D65, 2 gradi): mediana, scala per quantili di luminosita',
percentili P5/P95. Il confronto tra pezzi usa la MEDIANA di materiale
(robusta alla texture) e l'inviluppo di contrasto, non il ΔE pixel-per-pixel.

Uso:
  python3 scripts/hud-real/material_palette.py reference   # misura la Nav, scrive JSON+PNG
  python3 scripts/hud-real/material_palette.py compare A.webp B.webp ...   # ΔE vs Nav

Segmentazione (regole dichiarate, perche' decidono il risultato):
  - pixel validi: alpha >= 200
  - oro:    tinta 28-68, sat >= .35, V >= .25; piu' i pixel caldi (ombre/luci) a <= 4 px
  - smalto: tinta 100-185, sat >= .30, V .10-.62 (senza la fascia centrale della Nav: e' vetro)
  - gemma:  verde con V >= .62, oppure sat >= .85 e V >= .5
  - fondo:  tinta 170-260, V < .32; componenti connesse < 1000 px riassegnate allo smalto
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
NAV = ROOT / "public/assets/ui/hud-real/nav/bar.webp"
OUT = ROOT / "test-results/slicekit"
CENTER = (0.40, 0.60)  # fascia centrale (astrolabio) esclusa dallo smalto
BINS = [(0, 5, "ombra profonda"), (5, 25, "ombra"), (25, 75, "mezzo"), (75, 95, "luce"), (95, 100, "riflesso")]

_M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
_W = np.array([0.95047, 1.0, 1.08883])


def srgb_to_lab(rgb):
    c = np.asarray(rgb, dtype=np.float64) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    xyz = lin @ _M.T / _W
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def lab_to_hex(lab):
    fy = (lab[0] + 16) / 116
    f = np.array([fy + lab[1] / 500, fy, fy - lab[2] / 200])
    xyz = np.where(f ** 3 > 216 / 24389, f ** 3, (116 * f - 16) / (24389 / 27)) * _W
    lin = np.clip(xyz @ np.linalg.inv(_M).T, 0, 1)
    c = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * lin ** (1 / 2.4) - 0.055)
    r, g, b = np.clip(np.round(c * 255), 0, 255).astype(int)
    return f"#{r:02x}{g:02x}{b:02x}"


def de2000(l1, l2):
    """CIEDE2000 (kL=kC=kH=1); validata sui valori di Sharma et al. 2005."""
    L1, a1, b1 = [np.asarray(l1, float)[..., i] for i in range(3)]
    L2, a2, b2 = [np.asarray(l2, float)[..., i] for i in range(3)]
    C1, C2 = np.hypot(a1, b1), np.hypot(a2, b2)
    Cb = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = np.hypot(a1p, b1), np.hypot(a2p, b2)
    h1 = np.degrees(np.arctan2(b1, a1p)) % 360
    h2 = np.degrees(np.arctan2(b2, a2p)) % 360
    dL, dC = L2 - L1, C2p - C1p
    dh = h2 - h1
    dh = np.where(dh > 180, dh - 360, np.where(dh < -180, dh + 360, dh))
    dh = np.where(C1p * C2p == 0, 0, dh)
    dH = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dh / 2))
    Lb, Cbp = (L1 + L2) / 2, (C1p + C2p) / 2
    hs = h1 + h2
    hb = np.where(np.abs(h1 - h2) <= 180, hs / 2, np.where(hs < 360, (hs + 360) / 2, (hs - 360) / 2))
    hb = np.where(C1p * C2p == 0, hs, hb)
    T = (1 - 0.17 * np.cos(np.radians(hb - 30)) + 0.24 * np.cos(np.radians(2 * hb))
         + 0.32 * np.cos(np.radians(3 * hb + 6)) - 0.20 * np.cos(np.radians(4 * hb - 63)))
    dth = 30 * np.exp(-(((hb - 275) / 25) ** 2))
    Rc = 2 * np.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lb - 50) ** 2 / np.sqrt(20 + (Lb - 50) ** 2)
    Sc, Sh = 1 + 0.045 * Cbp, 1 + 0.015 * Cbp * T
    Rt = -np.sin(np.radians(2 * dth)) * Rc
    return np.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh))


def segment(a):
    """a: RGBA uint8 -> dict materiale -> maschera booleana."""
    rgb, solid = a[..., :3], a[..., 3] >= 200
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV_FULL).astype(float)
    H, S, V = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    gold = solid & (H >= 28) & (H <= 68) & (S >= .35) & (V >= .25)
    green = solid & (H >= 100) & (H <= 185) & (S >= .30)
    gem = green & ((V >= .62) | ((S >= .85) & (V >= .5)))
    lacq = green & ~gem & (V >= .10) & (V < .62)
    well = solid & (H >= 170) & (H <= 260) & (V < .32)
    dG = cv2.distanceTransform((~gold).astype(np.uint8), cv2.DIST_L2, 3)
    dL = cv2.distanceTransform((~lacq).astype(np.uint8), cv2.DIST_L2, 3)
    dW = cv2.distanceTransform((~well).astype(np.uint8), cv2.DIST_L2, 3)
    rest = solid & ~(gold | lacq | gem | well)
    warm = rest & ((H <= 75) | (H >= 330)) & (dG <= 4)
    rest &= ~warm
    lacq2 = lacq | (rest & (H >= 100) & (H <= 185) & (V < .62) & (dL <= 4))
    rest &= ~lacq2
    well2 = well | (rest & (H >= 170) & (H <= 260) & (dW <= 4))
    n, cc, st, _ = cv2.connectedComponentsWithStats(well2.astype(np.uint8), connectivity=8)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 1000:
            lacq2 |= cc == i
            well2 &= cc != i
    return {"oro": gold | warm, "smalto": lacq2, "gemma": gem, "fondo": well2}


def signature(lab_px):
    L = lab_px[:, 0]
    C = np.hypot(lab_px[:, 1], lab_px[:, 2])
    return {"pixel": int(len(L)), "mediana_lab": [round(float(v), 1) for v in np.median(lab_px, 0)],
            "L_P5": round(float(np.percentile(L, 5)), 1), "L_P95": round(float(np.percentile(L, 95)), 1),
            "croma_mediana": round(float(np.median(C)), 1)}


def ramp(lab_px):
    order = np.argsort(lab_px[:, 0])
    P, n, out = lab_px[order], len(lab_px), []
    for lo, hi, name in BINS:
        a, b = int(n * lo / 100), max(int(n * hi / 100), int(n * lo / 100) + 1)
        med = np.median(P[a:b], 0)
        out.append({"nome": name, "hex": lab_to_hex(med), "lab": [round(float(v), 1) for v in med]})
    return out


def load(path):
    return np.array(Image.open(path).convert("RGBA"))


def reference():
    a = load(NAV)
    lab = srgb_to_lab(a[..., :3])
    masks = segment(a)
    w = a.shape[1]
    masks["smalto"] = masks["smalto"] & ~((np.arange(w) >= CENTER[0] * w) & (np.arange(w) <= CENTER[1] * w))[None, :]
    res = {"fonte": str(NAV.relative_to(ROOT)), "metodo": "CIEDE2000, sRGB->Lab D65 2deg, alpha>=200, mediana per materiale", "materiali": {}}
    for name, m in masks.items():
        px = lab[m]
        res["materiali"][name] = {**signature(px), "scala": ramp(px)}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "material-palette-nav.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    sw, pad = 52, 12
    img = Image.new("RGB", (120 + 5 * (sw + 6) + 2 * pad, len(res["materiali"]) * (sw + 24) + 2 * pad), (235, 230, 220))
    d = ImageDraw.Draw(img)
    y = pad
    for name, r in res["materiali"].items():
        d.text((pad, y + sw // 2 - 5), name, fill=(20, 20, 20))
        x = 120
        for s in r["scala"]:
            d.rectangle([x, y, x + sw, y + sw], fill=s["hex"], outline=(0, 0, 0))
            d.text((x, y + sw + 3), s["hex"], fill=(40, 40, 40))
            x += sw + 6
        y += sw + 24
    img.resize((img.width * 2, img.height * 2), Image.NEAREST).save(OUT / "material-palette-nav.png")
    for name, r in res["materiali"].items():
        print(f"{name:7s} px={r['pixel']:6d} mediana Lab={r['mediana_lab']} L P5/P95={r['L_P5']}/{r['L_P95']} croma={r['croma_mediana']}")
    print("scritto", OUT / "material-palette-nav.json", "e .png")


def compare(paths):
    ref = json.loads((OUT / "material-palette-nav.json").read_text())["materiali"]
    print(f"{'asset':40s} {'materiale':8s} {'px':>7s} {'L med':>6s} {'L P5':>5s} {'L P95':>6s} {'ΔE00 mediana vs Nav':>20s}")
    for p in paths:
        a = load(p)
        lab = srgb_to_lab(a[..., :3])
        for name, m in segment(a).items():
            if name not in ("oro", "smalto") or m.sum() < 300:
                continue
            s = signature(lab[m])
            d = float(de2000(np.array(s["mediana_lab"]), np.array(ref[name]["mediana_lab"])))
            print(f"{str(p)[-40:]:40s} {name:8s} {s['pixel']:7d} {s['mediana_lab'][0]:6.1f} {s['L_P5']:5.1f} {s['L_P95']:6.1f} {d:20.2f}")


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "reference":
        reference()
    elif len(sys.argv) >= 3 and sys.argv[1] == "compare":
        compare(sys.argv[2:])
    else:
        print(__doc__)
        sys.exit(2)
