#!/usr/bin/env python3
"""hud-gen-gate.py — G-5 auto gate, PLAN-110 §12 + §13 E-03/E-16/E-18.

Two tiers (E-16):
  Tier-A = hard auto-reject, no taste needed: wrong counts, purple, glyph-like
           clusters, non-flat navy background.
  Tier-B = drift alarms (escalate to Director, not pass/fail): edge-SSIM, mask
           IoU, MAD, symmetry diff, repeat variance, Laplacian ratio, HF energy.

Thresholds come from gate-calibration.json produced by --calibrate on a
known-positive crop and known-negatives. Without calibration the script still
reports metrics but marks verdict UNCALIBRATED.

Usage:
  hud-gen-gate.py --candidate img.png --base base.png [--zone zone.yaml] [--json]
  hud-gen-gate.py --calibrate --positive pos.png --negatives n1.png n2.png \
      --base base.png --out gate-calibration.json
"""
import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim

NAVY = np.array([10, 22, 34])  # #0a1622 flat bg target (BGR-ish, computed in RGB)


def load(path):
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise SystemExit(f"cannot read {path}")
    if img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    return img


def to_rgb(img):
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def purple_fraction(rgb):
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hue = hsv[..., 0].astype(float) * 2.0  # opencv hue*2 = degrees
    sat = hsv[..., 1] / 255.0
    return float(((hue > 255) & (hue < 320) & (sat > 0.25)).mean())


def bg_flatness(rgb, mask_bg):
    if mask_bg.sum() == 0:
        return 99.0
    return float(np.abs(rgb[mask_bg].astype(float) - NAVY).max(axis=1).mean())


def bg_mask(rgb):
    d = np.abs(rgb.astype(float) - NAVY).max(axis=2)
    return d < 18


def count_components(rgb, min_area_frac=0.0002):
    """Count salient foreground blobs (gems/notches/volutes proxy)."""
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    bg = bg_mask(rgb)
    fg = (~bg).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    areas = stats[1:, cv2.CC_STAT_AREA]
    min_area = max(8, min_area_frac * rgb.shape[0] * rgb.shape[1])
    return int((areas >= min_area).sum())


def glyph_clusters(rgb):
    """Small text-like component clusters: >=3 tiny aligned components."""
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 60, 160)
    n, _, stats, cents = cv2.connectedComponentsWithStats(edges, 8)
    small = [(stats[i, cv2.CC_STAT_AREA], cents[i]) for i in range(1, n)
             if 6 <= stats[i, cv2.CC_STAT_AREA] <= 60]
    return len(small) >= 12


def edge_ssim(rgb_a, rgb_b):
    a = cv2.resize(rgb_a, (rgb_b.shape[1], rgb_b.shape[0]))
    ea = cv2.Canny(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY), 50, 150)
    eb = cv2.Canny(cv2.cvtColor(rgb_b, cv2.COLOR_RGB2GRAY), 50, 150)
    return float(ssim(ea, eb))


def mask_iou(rgb_a, rgb_b):
    a = ~bg_mask(cv2.resize(rgb_a, (rgb_b.shape[1], rgb_b.shape[0])))
    b = ~bg_mask(rgb_b)
    k = np.ones((9, 9), np.uint8)
    a = cv2.GaussianBlur(a.astype(np.uint8) * 255, (0, 0), 2) > 80
    b = cv2.GaussianBlur(b.astype(np.uint8) * 255, (0, 0), 2) > 80
    inter = (a & b).sum()
    union = (a | b).sum()
    return float(inter / union) if union else 0.0


def mad(rgb_a, rgb_b):
    a = cv2.resize(rgb_a, (rgb_b.shape[1], rgb_b.shape[0])).astype(float)
    return float(np.abs(a - rgb_b.astype(float)).mean())


def symmetry_diff(rgb):
    m = ~bg_mask(rgb)
    ys, xs = np.where(m)
    if len(xs) < 50:
        return 99.0
    cx = (xs.min() + xs.max()) // 2
    left = rgb[:, :cx]
    right = np.fliplr(rgb[:, cx:cx + left.shape[1]])
    w = min(left.shape[1], right.shape[1])
    if w < 8:
        return 99.0
    return float(np.abs(left[:, :w].astype(float) - right[:, :w].astype(float)).mean())


def lap_var(rgb):
    return float(cv2.Laplacian(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY), cv2.CV_64F).var())


def border_navy_frac(rgb):
    """Fraction of border pixels that look like flat navy — detects whether the
    candidate is a navy-bg generation (G-4) vs a mockup crop on painted bg."""
    h, w = rgb.shape[:2]
    band = np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3),
                           rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)])
    return float((np.abs(band.astype(float) - NAVY).max(axis=1) < 18).mean())


def native_size(img):
    """Gemini web outputs are <= 1408 px on the long side (G-0); larger means a page capture."""
    h, w = img.shape[:2]
    return max(w, h) <= 1408 and min(w, h) >= 512


def ui_chrome_frac(rgb):
    """Fraction of near-white, low-saturation pixels: the Gemini page (composer bar,
    footer) is light; a navy-background asset has almost none."""
    mx = rgb.max(axis=2).astype(int)
    mn = rgb.min(axis=2).astype(int)
    return float(((mn > 228) & (mx - mn < 18)).mean())


def gem_count(rgb):
    """Bright saturated emerald blobs (lit gems), merged when close."""
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    m = ((hsv[:, :, 0] >= 48) & (hsv[:, :, 0] <= 88) & (hsv[:, :, 1] > 110) & (hsv[:, :, 2] > 120)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.dilate(m, np.ones((9, 9), np.uint8))
    n, _, st, _ = cv2.connectedComponentsWithStats(m)
    area = rgb.shape[0] * rgb.shape[1]
    return int(sum(1 for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 0.0008 * area))


def metrics(cand, base):
    c = to_rgb(cand)
    b = to_rgb(base)
    return {
        "counts": count_components(c),
        "native_size": native_size(cand),
        "ui_chrome": ui_chrome_frac(c),
        "gems": gem_count(c),
        "purple_frac": purple_fraction(c),
        "bg_dev": bg_flatness(c, bg_mask(c)),
        "navy_bg": border_navy_frac(c) > 0.6,
        "glyphs": glyph_clusters(c),
        "edge_ssim": edge_ssim(c, b),
        "mask_iou": mask_iou(c, b),
        "mad": mad(c, b),
        "sym_diff": symmetry_diff(c),
        "lap_ratio": lap_var(c) / max(lap_var(b), 1e-6),
    }


def calibrate(pos, negs, base, out):
    m_pos = metrics(load(pos), load(base))
    m_negs = [metrics(load(n), load(base)) for n in negs]
    rep = {
        "positive": {"file": pos, "metrics": m_pos, "verdict": verdict(m_pos)},
        "negatives": [{"file": n, "metrics": m, "verdict": verdict(m)} for n, m in zip(negs, m_negs)],
    }
    # Tier-A defaults (plan §12 G-5): purple 0, glyphs none, bg <=3/255,
    # counts equal to base.
    base_m = metrics(load(base), load(base))
    cal = {
        "tierA": {
            "purple_frac_max": 0.0,
            "glyph_clusters": 0,
            "bg_dev_max": max(3.0, m_pos["bg_dev"] * 1.5),
            "counts_tol": 0,
        },
        "tierB": {
            "edge_ssim_min": min(0.80, round(m_pos["edge_ssim"] * 0.9, 3)),
            "mask_iou_min": min(0.93, round(m_pos["mask_iou"] * 0.95, 3)),
            "sym_diff_max": round(max(6.0, m_pos["sym_diff"] * 1.2), 2),
            "mad_max": round(max(4.0, m_pos["mad"] * 1.2), 2),
            "lap_ratio_min": round(min(1.5, m_pos["lap_ratio"] * 0.9), 2),
        },
        "base_counts": base_m["counts"],
    }
    ok = rep["positive"]["verdict"]["tierA"] == "PASS" and all(
        v["verdict"]["tierA"] != "PASS" or v["verdict"]["tierB_fail"] for v in rep["negatives"])
    rep["calibration"] = cal
    rep["calibration_ok"] = bool(ok)
    Path(out).write_text(json.dumps(rep, indent=2))
    print(json.dumps({"calibration_ok": ok, "out": out}, indent=1))
    return 0 if ok else 1


def verdict(m, cal=None):
    if cal is None:
        cal = DEFAULTS
    ta = []
    if m["purple_frac"] > max(0.005, cal["tierA"]["purple_frac_max"]):
        ta.append(f"purple {m['purple_frac']:.3f}")
    if m["navy_bg"] and m["bg_dev"] > cal["tierA"]["bg_dev_max"]:
        ta.append(f"bg dev {m['bg_dev']:.1f}")
    if not m.get("native_size", True):
        ta.append("not a native Gemini output (size)")
    if m.get("ui_chrome", 0) > cal["tierA"].get("ui_chrome_max", 0.015):
        ta.append(f"ui chrome {m['ui_chrome']:.3f}")
    gems = cal["tierA"].get("gems")  # Tier-B until calibrated: highlights on enamel count as gems (probe2, 2026-11-03)
    gem_alarm = gems is not None and m.get("gems") != gems
    expect = cal["tierA"].get("expect")
    if expect is not None and abs(m["counts"] - expect) > cal["tierA"]["counts_tol"]:
        ta.append(f"counts {m['counts']}")
    tb = [k for k, lim in (("edge_ssim", ("min", cal["tierB"]["edge_ssim_min"])),
                           ("mask_iou", ("min", cal["tierB"]["mask_iou_min"])),
                           ("sym_diff", ("max", cal["tierB"]["sym_diff_max"])),
                           ("mad", ("max", cal["tierB"]["mad_max"])),
                           ("lap_ratio", ("min", cal["tierB"]["lap_ratio_min"])))
          if (m[k] < lim[1] if lim[0] == "min" else m[k] > lim[1])]
    if m["glyphs"]:
        tb.append("glyph-like clusters")
    if gem_alarm:
        tb.append(f"gems {m.get('gems')} != {gems}")
    return {"tierA": "PASS" if not ta else "REJECT", "tierA_reasons": ta,
            "tierB_fail": tb, "tierB": "OK" if not tb else "ALARM"}


DEFAULTS = {
    "tierA": {"purple_frac_max": 0.0, "glyph_clusters": 0, "bg_dev_max": 3.0, "counts_tol": 0, "expect": None},
    "tierB": {"edge_ssim_min": 0.80, "mask_iou_min": 0.93, "sym_diff_max": 6.0,
              "mad_max": 4.0, "lap_ratio_min": 1.5},
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidate")
    ap.add_argument("--base", required=True)
    ap.add_argument("--calibration", default="scripts/hud-real/gate-calibration.json")
    ap.add_argument("--calibrate", action="store_true")
    ap.add_argument("--positive")
    ap.add_argument("--negatives", nargs="+", default=[])
    ap.add_argument("--out", default="scripts/hud-real/gate-calibration.json")
    ap.add_argument("--expect-counts", type=int)
    ap.add_argument("--gems", type=int, help="expected lit gem count of the zone (Tier-A)")
    a = ap.parse_args()

    if a.calibrate:
        if not a.positive or len(a.negatives) < 2:
            sys.exit("need --positive and 2 --negatives")
        sys.exit(calibrate(a.positive, a.negatives, a.base, a.out))

    if not a.candidate:
        sys.exit("need --candidate or --calibrate")
    cal = None
    p = Path(a.calibration)
    if p.exists():
        cal = json.loads(p.read_text()).get("calibration")
    else:
        cal = {"tierA": dict(DEFAULTS["tierA"]), "tierB": DEFAULTS["tierB"]}
    if a.expect_counts is not None:
        cal["tierA"]["expect"] = a.expect_counts
    if a.gems is not None:
        cal["tierA"]["gems"] = a.gems
    m = metrics(load(a.candidate), load(a.base))
    v = verdict(m, cal)
    v["metrics"] = m
    v["calibrated"] = p.exists()
    print(json.dumps(v, indent=2))
    sys.exit(0 if v["tierA"] == "PASS" else 1)


if __name__ == "__main__":
    main()
