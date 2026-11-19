#!/usr/bin/env python3
"""PLAN-128 — keyed derivative of the controls golden (controls-sheet-g2.png).

Why: the slicer's flatBgMaxDiff key is a function of the distance to the background grey only. In this sheet
the dark petrol wells (and the washed «disabled» wells) are close to that grey, and the hover/selected halos
are blended with it, so any single threshold either punches the wells or leaves a grey haze. Controls have a
KNOWN geometry, so the alpha is drawn analytically instead:
  * ring extent  = bbox of the pixels above an adaptive threshold (0.55 x P99 of the distance to the bg),
                   so a soft halo does not widen the silhouette;
  * silhouette   = circle (row 1) or stadium / pill (rows 2-4), expanded 2 px to keep the dark outline,
                   4x supersampled for a clean anti-aliased edge;
  * halos        = NOT in the raster: hover / selected glow is drawn in CSS (box-shadow, token colours).
RGB is the golden's, except ONE declared regrade (2026-11-19, Director «troppo arancio quei ring»): the ring gold is
moved onto the Nav gold's hue and chroma per luminance bin (L kept) — the sheet's gold measured hue 64-75 deg /
chroma 63-75 against the Nav's 75-84 deg / 41-47. Disabled (low-saturation) metal is not touched. Output: controls-sheet-g2-keyed.png (RGBA) + controls-silhouettes.json.
Run: python3 scripts/hud-real/prep_controls_keyed.py
"""
import json
from pathlib import Path

import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from material_palette import segment, srgb_to_lab, lab_to_hex  # noqa: E402,F401

REPO = Path(__file__).resolve().parents[2]
SRC = REPO / ".mw/specs/expedition-ui/refs/controls-sheet-g2.png"
DST = REPO / ".mw/specs/expedition-ui/refs/controls-sheet-g2-keyed.png"
OUT_JSON = REPO / "scripts/hud-real/specs/controls-silhouettes.json"

ROW_Y = [197, 418, 614, 811]                  # row centres measured on the golden
COL_X = [190, 480, 769, 1059, 1350]           # state column centres (normal, hover, pressed, selected, disabled)
ROW_TYPE = ["round", "oval", "pill", "dropdown"]
STATES = ["normal", "hover", "pressed", "selected", "disabled"]
OUTLINE_PX = 1
SS = 4


_M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
_W = np.array([0.95047, 1.0, 1.08883])


def lab_to_rgb(lab: np.ndarray) -> np.ndarray:
    fy = (lab[..., 0] + 16) / 116
    f = np.stack([fy + lab[..., 1] / 500, fy, fy - lab[..., 2] / 200], -1)
    xyz = np.where(f ** 3 > 216 / 24389, f ** 3, (116 * f - 16) / (24389 / 27)) * _W
    lin = np.clip(xyz @ np.linalg.inv(_M).T, 0, 1)
    c = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * lin ** (1 / 2.4) - 0.055)
    return np.clip(np.round(c * 255), 0, 255).astype(np.uint8)


def regrade_gold_to_nav(img: Image.Image) -> tuple[Image.Image, dict]:
    """Move the saturated ring gold onto the Nav gold's (a,b) at the same L."""
    nav = np.array(Image.open(REPO / "public/assets/ui/hud-real/nav/bar.webp").convert("RGBA"))
    nl = srgb_to_lab(nav[..., :3])[segment(nav)["oro"]]
    centers = np.arange(18.0, 100.0, 6.0)
    la, lb = [], []
    for c in centers:
        sel = np.abs(nl[:, 0] - c) <= 6.0
        la.append(np.median(nl[sel, 1]) if sel.sum() >= 60 else np.nan)
        lb.append(np.median(nl[sel, 2]) if sel.sum() >= 60 else np.nan)
    la, lb = np.array(la), np.array(lb)
    ok = ~np.isnan(la)
    c, la, lb = centers[ok], la[ok], lb[ok]
    rgb = np.array(img)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV_FULL).astype(float)
    H, S, V = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    warm = (H >= 10) & (H <= 75)
    w = np.clip((S - 0.30) / 0.20, 0, 1) * warm * (V >= 0.2)
    lab = srgb_to_lab(rgb)
    out = lab.copy()
    out[..., 1] = lab[..., 1] + w * (np.interp(lab[..., 0], c, la) - lab[..., 1])
    out[..., 2] = lab[..., 2] + w * (np.interp(lab[..., 0], c, lb) - lab[..., 2])
    res = lab_to_rgb(out)
    rgb2 = np.where((w > 0)[..., None], res, rgb).astype(np.uint8)
    return Image.fromarray(rgb2), {"bins_L": c.tolist(), "nav_a": np.round(la, 1).tolist(), "nav_b": np.round(lb, 1).tolist(), "px_regraded": int((w > 0.5).sum())}


def main() -> None:
    img = Image.open(SRC).convert("RGB")
    img_graded, info = regrade_gold_to_nav(img)
    print("regrade:", info["px_regraded"], "px moved to the Nav gold hue/chroma")
    shape_src = img          # geometry is measured on the untouched golden
    a = np.array(img).astype(int)
    bg = a[5:40, 5:40].reshape(-1, 3).mean(0)
    diff = np.abs(a - bg).max(2)
    alpha = Image.new("L", img.size, 0)
    out: dict = {}
    for ri, cy0 in enumerate(ROW_Y):
        for ci, cx0 in enumerate(COL_X):
            r = 150
            x0, y0, x1, y1 = cx0 - 165, cy0 - 95, cx0 + 165, cy0 + 95
            region = diff[y0:y1, x0:x1]
            thr = 0.55 * float(np.percentile(region, 99))
            m = (region > thr).astype(np.uint8)
            m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
            n, cc, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
            big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
            bx, by, bw, bh = (int(st[big, k]) for k in range(4))
            L, T = x0 + bx - OUTLINE_PX, y0 + by - OUTLINE_PX
            W, H = bw + 2 * OUTLINE_PX, bh + 2 * OUTLINE_PX
            kind = ROW_TYPE[ri]
            big_img = Image.new("L", (W * SS, H * SS), 0)
            d = ImageDraw.Draw(big_img)
            if kind == "round":
                dia = max(W, H)
                cxm, cym = L + W / 2, T + H / 2
                L, T, W, H = int(round(cxm - dia / 2)), int(round(cym - dia / 2)), dia, dia
                big_img = Image.new("L", (W * SS, H * SS), 0)
                ImageDraw.Draw(big_img).ellipse([0, 0, W * SS - 1, H * SS - 1], fill=255)
            else:
                d.rounded_rectangle([0, 0, W * SS - 1, H * SS - 1], radius=(H * SS) // 2, fill=255)
            alpha.paste(big_img.resize((W, H), Image.LANCZOS), (L, T), big_img.resize((W, H), Image.LANCZOS))
            out.setdefault(kind, {})[STATES[ci]] = {"x": L, "y": T, "w": W, "h": H, "thr": round(thr, 1)}
    rgba = img_graded.convert("RGBA")
    rgba.putalpha(alpha)
    rgba.save(DST)
    OUT_JSON.write_text(json.dumps(out, indent=1))
    print("keyed sheet ->", DST.relative_to(REPO))
    for k, v in out.items():
        print(k, {s: (e["w"], e["h"]) for s, e in v.items()})


if __name__ == "__main__":
    main()
