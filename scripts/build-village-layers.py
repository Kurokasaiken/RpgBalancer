#!/usr/bin/env python3
"""Village-zone layers for /mappa2-lab (Director 2026-10-30).

1. House stages: the Gemini repaints (opaque 360x280 crops) become RGBA patches —
   an elliptical feathered mask around the buildings + low-frequency tone match to
   the real base map, so no rectangular crop edge or tone seam survives.
2. Defence rings: the cleaned ring sprites have the two back arcs cut out
   (gaps). Close them by column-cloning the intact back segment (edges
   interpolated to the arc ends) so palisade / wall are closed by construction.

Sources live in context/research/2026-10-29-mappa2-sprite-pilot/out/village-src/.
Run: python3 scripts/build-village-layers.py
"""
from pathlib import Path
import numpy as np
import cv2
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "context/research/2026-10-29-mappa2-sprite-pilot/out/village-src"
PACK = ROOT / "public/assets/world/mappa2/base"
VIL = PACK / "fx/village"
ZONE = (1399, 572, 360, 280)

# (stage file, ellipse centre x, y, radii rx, ry) in zone px
STAGES = [
    ("stage0", 148, 116, 108, 50),
    ("stage1", 153, 114, 112, 50),
]
FEATHER = 16.0


def stage_rgba(name, cx, cy, rx, ry, base):
    st = np.asarray(Image.open(SRC / f"{name}-src.webp").convert("RGB"), np.float32)
    # tone match: remove the low-frequency colour offset between repaint and map
    off = cv2.GaussianBlur(base, (0, 0), 14) - cv2.GaussianBlur(st, (0, 0), 14)
    st = np.clip(st + off, 0, 255)
    h, w = st.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)  # 1 at the ellipse
    edge = (1.0 - d) * min(rx, ry) / FEATHER
    a = np.clip(edge, 0, 1)
    a = a * a * (3 - 2 * a)
    rgba = np.dstack([st, a * 255]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(VIL / f"{name}.webp", quality=95, method=6)


def close_ring(src_name, out_name, upper_y, gaps, src_cols, center_x, strays=(), mirror=False):
    """Rebuild the back arc of a ring sprite.
    gaps: [(x0, x1)] columns (exclusive end) of the upper band (y < upper_y) to
    regenerate; their top/bottom edges follow a parabola through the two intact
    arc ends and the sprite's own back-centre, so the outline is one smooth
    ellipse arc. Column content is cloned (ping-pong) from the intact back
    segment `src_cols`, resampled vertically between the smoothed source edges
    so merlons / spikes survive. strays: [(x0,x1,y0,y1)] fragments to erase."""
    im = np.asarray(Image.open(SRC / src_name).convert("RGBA")).copy()

    def edges(x):
        ys = np.where(im[:upper_y, x, 3] > 128)[0]
        return (ys.min(), ys.max()) if ys.size else None

    for (x0, x1, y0, y1) in strays:
        im[y0:y1, x0:x1, :] = 0
    orig = im.copy()
    a, b = src_cols
    # smoothed source edges (min of tops / max of bottoms over a window) keep
    # crenellation notches inside the resampled range instead of flattening them
    srcE = {x: edges(x) for x in range(a, b)}
    xs = [x for x in range(a, b) if srcE[x]]
    tops = np.array([srcE[x][0] for x in xs], np.float32)
    bots = np.array([srcE[x][1] for x in xs], np.float32)
    k = 25
    tops_s = cv2.erode(tops[None, :], np.ones((1, k)))[0]
    bots_s = cv2.dilate(bots[None, :], np.ones((1, k)))[0]
    smooth = {x: (int(tops_s[i]), int(bots_s[i])) for i, x in enumerate(xs)}
    span = b - a

    for (x0, x1) in gaps:
        xl = x0 - 1
        while edges(xl) is None: xl -= 1
        xr = x1
        while edges(xr) is None: xr += 1
        pts = [(xl, *edges(xl)), (center_x, *edges(center_x)), (xr, *edges(xr))]
        px = np.array([p[0] for p in pts], np.float32)
        Tc = np.polyfit(px, np.array([p[1] for p in pts], np.float32), 2)
        Bc = np.polyfit(px, np.array([p[2] for p in pts], np.float32), 2)
        im[:upper_y, x0:x1, :] = 0
        for x in range(x0, x1):
            T = np.polyval(Tc, x); B = np.polyval(Bc, x)
            kk = (x - x0) % (2 * span)
            sx = a + (kk if kk < span else 2 * span - 1 - kk)  # ping-pong clone
            if sx not in smooth:
                continue
            st, sb = smooth[sx]
            col = orig[st:sb + 1, sx, :]
            n = max(2, int(round(B - T)) + 1)
            res = cv2.resize(col[:, None, :], (1, n), interpolation=cv2.INTER_LINEAR)[:, 0, :]
            y0 = int(round(T))
            im[y0:y0 + n, x, :] = res
    if mirror:
        im = im[:, ::-1].copy()
    Image.fromarray(im, "RGBA").save(VIL / "parts" / out_name)


def main():
    base = np.asarray(
        Image.open(PACK / "layers/base_flat.webp").convert("RGB").crop(
            (ZONE[0], ZONE[1], ZONE[0] + ZONE[2], ZONE[1] + ZONE[3])), np.float32)
    for s in STAGES:
        stage_rgba(*s, base)
    close_ring("ring-pal-src.png", "ring-pal-closed.png", 400,
               gaps=[(205, 385), (715, 890)], src_cols=(392, 560), center_x=560)
    # wall: the whole back arc is rebuilt so the S-curve of the old back segment goes away
    close_ring("ring-wall-src.png", "ring-wall-closed.png", 300,
               gaps=[(212, 905)], src_cols=(392, 700), center_x=560,
               mirror=True)  # gate right of centre, away from the river on the left
    print("ok")


if __name__ == "__main__":
    main()

# ─────────────────────────────────────────────────────────────────────────────
# PLAN-106 T3 — Gate A: rigid frame registration to the base map (r009)
# Each raw Gemini crop is registered to the base-map crop: rigid
# translation+scale (MOTION_EUCLIDEAN) estimated on un-edited context, masked
# to exclude zone+margin. Residual on the 40-80px band around the zone.
# Calibration: a null-edit control repaint sets the drift noise floor.
# ─────────────────────────────────────────────────────────────────────────────

def register_to_zone(raw_bgr, base_bgr, zone, mask_margin=40, band=(40, 80)):
    """Warp `raw_bgr` (same crop as `base_bgr`) onto the base frame via rigid
    ECC on un-edited context. `zone` = (x,y,w,h) in CROP coords (excluded).
    Returns (warped, residual_px, ok). Residual = mean abs diff on the band
    `band` px around the zone rect, after warp."""
    x, y, w, h = zone
    H, W = base_bgr.shape[:2]
    mask = np.ones((H, W), np.uint8) * 255
    cv2.rectangle(mask, (x - mask_margin, y - mask_margin),
                  (x + w + mask_margin, y + h + mask_margin), 0, -1)
    g_raw = cv2.cvtColor(raw_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    g_bas = cv2.cvtColor(base_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        cv2.findTransformECC(g_bas, g_raw, warp, cv2.MOTION_EUCLIDEAN,
                             (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-5),
                             mask, 5)
    except cv2.error:
        warp = np.eye(2, 3, dtype=np.float32)  # ECC no-converge → identity, residual will flag
    warped = cv2.warpAffine(raw_bgr, warp, (W, H),
                            flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                            borderMode=cv2.BORDER_REPLICATE)
    # band residual 40-80px around zone
    band_mask = np.zeros((H, W), np.uint8)
    cv2.rectangle(band_mask, (x - band[1], y - band[1]), (x + w + band[1], y + h + band[1]), 255, -1)
    cv2.rectangle(band_mask, (x - band[0], y - band[0]), (x + w + band[0], y + h + band[0]), 0, -1)
    diff = cv2.absdiff(warped, base_bgr).mean(axis=2)
    residual = float(diff[band_mask > 0].mean())
    return warped, residual, True

def normalize_border_band(warped_bgr, base_bgr, zone, band_px=24):
    """Per-channel mean/std match of the zone's outer border band to the base
    map (band-limited Reinhard) — kills tone seams before feathering."""
    x, y, w, h = zone
    roi_w, roi_b = warped_bgr[y:y+h, x:x+w], base_bgr[y:y+h, x:x+w]
    band = np.zeros((h, w), bool)
    band[:band_px, :] = band[-band_px:, :] = True
    band[:, :band_px] = band[:, -band_px:] = True
    src, dst = roi_w[band].astype(np.float32), roi_b[band].astype(np.float32)
    for c in range(3):
        s, d = src[:, c], dst[:, c]
        roi_w[:, :, c] = np.clip((roi_w[:, :, c].astype(np.float32) - s.mean())
                                 * (d.std() / max(s.std(), 1e-3)) + d.mean(), 0, 255)
    out = warped_bgr.copy(); out[y:y+h, x:x+w] = roi_w.astype(np.uint8)
    return out

# ─────────────────────────────────────────────────────────────────────────────
# PLAN-106 T4 — Gate B: paired-anchor layout-lock (r009)
# The operator marks the SAME physical structure on parent and child (paired
# correspondence sets — the human is the oracle, not coordinate coincidence).
# For each child plate, per-anchor displacement is measured vs (1) generation
# parent, (2) shared ancestor (defended states: stone), (3) runtime-adjacent
# shipped states (pairs differing in exactly one axis value on one slot).
# Tripwire: over layoutLockMaxPx → hold for regeneration, never silent.
# ─────────────────────────────────────────────────────────────────────────────

def anchor_displacement(parent_anchors, child_anchors):
    """Max and mean displacement (px) between paired anchor lists."""
    if len(parent_anchors) != len(child_anchors) or not parent_anchors:
        return None, None
    d = [float(np.hypot(cx - px, cy - py))
         for (px, py), (cx, cy) in zip(parent_anchors, child_anchors)]
    return max(d), sum(d) / len(d)

def axis_siblings(key, keys):
    """Shipped keys differing from `key` in exactly one axis value on one
    slot (defence swap, per-slot tower swap, or single growth step)."""
    g, d, slots = key.split('|'); s1, s2 = slots.split('+')
    out = []
    for k in keys:
        if k == key: continue
        kg, kd, kslots = k.split('|'); ks1, ks2 = kslots.split('+')
        diffs = (g != kg) + (d != kd) + (s1 != ks1) + (s2 != ks2)
        if diffs == 1:
            out.append(k)
    return out

def layout_lock_report(child_key, anchors_by_key, parent_key, ancestor_key, shipped_keys, max_px):
    """Build the Gate B report for one plate. anchors_by_key maps key ->
    {buildings:[(x,y)], ring:[(x,y)]}. Returns dict; caller decides hold/pass."""
    checks = {}
    for label, other in (("parent", parent_key), ("ancestor", ancestor_key)):
        if other and other in anchors_by_key:
            for kind in ("buildings", "ring"):
                mx, mn = anchor_displacement(
                    anchors_by_key[other].get(kind) or [],
                    anchors_by_key[child_key].get(kind) or [])
                if mx is not None:
                    checks[f"{label}:{kind}"] = {"max": mx, "mean": mn, "ok": mx <= max_px}
    for sib in axis_siblings(child_key, shipped_keys):
        if sib in anchors_by_key:
            mx, mn = anchor_displacement(
                anchors_by_key[sib].get("buildings") or [],
                anchors_by_key[child_key].get("buildings") or [])
            if mx is not None:
                checks[f"sibling:{sib}"] = {"max": mx, "mean": mn, "ok": mx <= max_px}
    ok = all(c["ok"] for c in checks.values()) if checks else False
    return {"key": child_key, "checks": checks, "verdict": "pass" if ok else "hold"}

# ─────────────────────────────────────────────────────────────────────────────
# PLAN-106 — orchestration: raw Gemini crop → Gate A → normalize → crop zone →
# feathered RGBA plate + reports. Run:
#   python3 scripts/build-village-layers.py --plate <key> --raw <900x620.png>
#       [--parent <key>] [--ancestor <key>] [--null-edit]
# ─────────────────────────────────────────────────────────────────────────────
import json, argparse

def crop_rect(img, rect):
    x, y, w, h = [int(v) for v in rect]
    return img[y:y + h, x:x + w]

def export_plate(warped_bgr, base_zone_bgr, zone, out_webp, feather_px=24):
    """Crop zone, border-band normalize vs base, feather ellipse alpha, write RGBA webp."""
    x, y, w, h = [int(v) for v in zone]
    z_warp = normalize_border_band(
        warped_bgr[y:y + h, x:x + w].copy(),
        base_zone_bgr, (0, 0, w, h), band_px=min(feather_px * 2, 40))
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy, rx, ry = w / 2, h / 2, w / 2 - 1, h / 2 - 1
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    a = np.clip((1.0 - d) * min(rx, ry) / max(feather_px, 1), 0, 1)
    a = a * a * (3 - 2 * a)
    rgba = np.dstack([cv2.cvtColor(z_warp, cv2.COLOR_BGR2RGB), a * 255]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(out_webp, quality=95, method=6)
    return out_webp

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--plate'); ap.add_argument('--raw')
    ap.add_argument('--parent'); ap.add_argument('--ancestor')
    ap.add_argument('--zone', default='110,125,510,390', help='zone rect in CROP coords (world 1260,505,510,390 - crop 1150,380,900,660)')
    ap.add_argument('--crop', default='1150,380,900,660')
    ap.add_argument('--max-px', type=float, default=2.0)
    ap.add_argument('--reports', default='reports')
    args = ap.parse_args()
    zone = tuple(int(v) for v in args.zone.split(','))
    Path(args.reports).mkdir(exist_ok=True)
    raw = cv2.imread(args.raw)
    base = cv2.imread(str(ROOT / 'public/assets/world/mappa2/base/layers/base_flat.webp'))
    crop = tuple(int(v) for v in args.crop.split(','))
    base_crop = crop_rect(base, crop)
    if raw.shape[:2] != base_crop.shape[:2]:
        raw = cv2.resize(raw, (base_crop.shape[1], base_crop.shape[0]), interpolation=cv2.INTER_AREA)
    warped, residual, _ = register_to_zone(raw, base_crop, zone)
    rep = {'plate': args.plate, 'gateA_residual': residual}
    out = VIL / (args.plate.replace('|', '-').replace('+', '-') + '.webp')
    # zone is in CROP coords; world-zone rect = crop origin + zone offset
    world_zone = (crop[0] + zone[0], crop[1] + zone[1], zone[2], zone[3])
    export_plate(warped, crop_rect(base, world_zone), zone, out)
    rep['exported'] = str(out)
    (Path(args.reports) / f"village-{args.plate.replace('|','_')}.json").write_text(json.dumps(rep, indent=1))
    print(json.dumps(rep))

if __name__ == '__main__':
    main()
