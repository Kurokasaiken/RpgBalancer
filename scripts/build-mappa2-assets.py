#!/usr/bin/env python3
"""Build the initial mappa2 World Surface asset pack from a flat source painting."""
import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

WORLD_W = 2752
WORLD_H = 1536
D_MAX = 160.0
CANOPY_MIN_AREA = 900
# The large dark forest east of the western-forest biome (Director sway reference).
# `central_valley` as a whole is too broad; allow canopy extraction only inside this core.
DENSE_FOREST_CORE_POLYGON = np.array([
    (730, 650), (900, 620), (1160, 620), (1400, 700),
    (1470, 830), (1430, 1100), (1160, 1160), (900, 1080),
    (720, 950), (700, 780),
], np.int32)
WATERFALL_FLOW_POLYGON = np.array([
    (1282, 372), (1398, 374), (1408, 505), (1425, 525),
    (1375, 540), (1285, 532), (1258, 510), (1265, 405),
], np.int32)
WATERFALL_IMPACT_POLYGON = np.array([
    (1240, 485), (1410, 485), (1460, 545), (1400, 580),
    (1270, 575), (1200, 540),
], np.int32)
WATERFALL_BASIN_POLYGON = np.array([
    (1150, 498), (1260, 495), (1385, 500), (1440, 515),
    (1470, 540), (1430, 560), (1360, 580), (1270, 590),
    (1190, 580), (1130, 560), (1115, 535), (1130, 512),
], np.int32)
WATERFALL_IMPACT_POINT = {"x": 1340, "y": 532}
# The alpine lake that feeds the falls (PLAN-091): shimmer drifts toward the outflow lip.
WATERFALL_LAKE_POLYGON = np.array([
    (1150, 335), (1320, 308), (1490, 300), (1570, 340),
    (1560, 410), (1480, 465), (1360, 480), (1220, 455), (1150, 400),
], np.int32)

# --- PLAN-095 secondary water: authored corridors/centerlines (upstream->downstream) ---
RIVER_SPECS = [
    {
        "id": "river_central", "enabled": True, "tint": "#8fd8e2",
        "insetPx": 2.0, "corridorWidth": 80,
        "centerline": [(1228, 605), (1188, 648), (1200, 682), (1256, 715), (1318, 775), (1385, 850), (1455, 905), (1468, 948)],
        "hsvLo": (66, 45, 55), "hsvHi": (118, 255, 255),
        # Open estuary pool below the river mouth: it is lagoon water, not river.
        "exclusions": [[(1395, 960), (1530, 955), (1540, 1010), (1400, 1015)]],
        # Pool bulges along the waterway (fork junction + wide bends):
        # shimmer pockets measured from the painted mask.
        "poolGlintAnchors": [(1175, 640), (1160, 675), (1249, 598), (1309, 737), (1382, 821), (1401, 896), (1485, 949), (1455, 790), (1290, 780)],
    },
]
# NOTE (T-001 finding, 2026-10-28): the west "branch" is a fragmented shallow
# streamlet field (y~673-690, x~860-1239, broken by fords/vegetation), not a
# continuous river — it ships as `west_shallows` glint feature, not a river.
# NOTE (T-001 finding, 2026-10-28): the artifact's "river_east_canyon" is a
# painted DIRT PATH, not water — HSV probing along the corridor finds no teal
# (candidate corridor ∩ chroma caught the path as false positive). The only
# real water there is the teal pond ~ (1840-1890, 810-890): shipped as
# lake_canyon_pond instead. The river_east_canyon kill-switch design proved
# its worth at authoring time — no false-positive feature ships.
LAKE_SPECS = [
    {"id": "lake_alpine", "enabled": True, "insetPx": 4.0, "glintCount": 10,
     "polygon": None},  # filled below with WATERFALL_LAKE_POLYGON
    {"id": "lake_canyon_pond", "enabled": True, "insetPx": 2.0, "glintCount": 1,
     "polygon": np.array([(1840, 812), (1895, 812), (1902, 858), (1882, 892), (1835, 882), (1828, 845)], np.int32)},
    {"id": "west_shallows", "enabled": True, "insetPx": 2.0, "glintCount": 4,
     "polygon": np.array([(860, 660), (1030, 656), (1210, 660), (1215, 705), (1030, 710), (865, 700)], np.int32)},
    {"id": "lake_bayou_west", "enabled": True, "insetPx": 4.0, "glintCount": 3,
     "polygon": np.array([(1048, 905), (1105, 900), (1115, 960), (1100, 1025), (1050, 1025), (1042, 965)], np.int32)},
    {"id": "lake_bayou_east", "enabled": True, "insetPx": 4.0, "glintCount": 1,
     "polygon": np.array([(1205, 925), (1265, 920), (1272, 955), (1255, 985), (1210, 980), (1198, 950)], np.int32)},
]
LAKE_SPECS[0]["polygon"] = WATERFALL_LAKE_POLYGON
CONFLUENCE_SPECS = [
    {"id": "basin_outflow", "x": 1250, "y": 600},
    {"id": "west_fork", "x": 1205, "y": 655},
    {"id": "central_bend_upper", "x": 1322, "y": 795},
    {"id": "central_bend_lower", "x": 1384, "y": 862},
    {"id": "west_mouth", "x": 880, "y": 680},
    {"id": "estuary", "x": 1472, "y": 970},
]
SW_MAX_BEND_DEG = 28.0
SW_SEG_CAP_PER_RIVER = 12
SW_TOTAL_SEG_CAP = 22
SW_MAX_JOINT_DEG = 60.0

REGION_SPECS = [
    ("snow_peaks", "Vette Innevate e Ghiacciaio", [(760, 0), (2050, 0), (2100, 340), (900, 390)]),
    ("waterfall_plateau", "Altopiano della Cascata e Lago Alpino", [(850, 280), (1620, 270), (1680, 620), (900, 610)]),
    ("western_forest", "Foresta Densa", [(300, 300), (980, 330), (1000, 960), (260, 940)]),
    ("bayou", "Bayou/Palude di Mangrovie", [(220, 860), (980, 900), (1020, 1380), (160, 1320)]),
    ("central_valley", "Valle Fluviale e Praterie Centrali", [(980, 560), (1770, 560), (1810, 1080), (980, 1080)]),
    ("dry_steppe", "Steppe Aride", [(1620, 300), (2290, 290), (2330, 720), (1720, 720)]),
    ("red_canyons", "Canyon Rossi e Arco Naturale", [(2050, 620), (2600, 610), (2650, 1130), (2040, 1130)]),
    ("volcanic_massif", "Massiccio Vulcanico Nero", [(1830, 1030), (2660, 1060), (2700, 1536), (1810, 1536)]),
    ("coral_lagoon", "Laguna Corallina", [(820, 1050), (1830, 1050), (1810, 1536), (900, 1536)]),
    ("western_archipelago", "Arcipelago e Atollo", [(0, 620), (390, 610), (420, 1280), (0, 1280)]),
]


def save_webp_rgba(rgb: np.ndarray, alpha: np.ndarray, path: Path, quality: int = 92) -> None:
    rgba = np.dstack([rgb, alpha]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(path, quality=quality, method=4)


def save_webp_rgba_lossless(rgb: np.ndarray, alpha: np.ndarray, path: Path) -> None:
    rgba = np.dstack([rgb, alpha]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(path, lossless=True, quality=100, method=4)


def save_alpha_mask(mask: np.ndarray, path: Path) -> None:
    rgba = np.dstack([
        np.full(mask.shape, 255, dtype=np.uint8),
        np.full(mask.shape, 255, dtype=np.uint8),
        np.full(mask.shape, 255, dtype=np.uint8),
        np.clip(mask, 0, 255).astype(np.uint8),
    ])
    Image.fromarray(rgba, "RGBA").save(path, quality=90, alpha_quality=100, method=4)


def fill_polygon(shape: tuple[int, int], polygon: np.ndarray) -> np.ndarray:
    mask = np.zeros(shape, dtype=np.uint8)
    cv2.fillPoly(mask, [polygon], 255)
    return mask


def fill_binary_holes(mask: np.ndarray) -> np.ndarray:
    """Fill enclosed cavities in a binary sprite mask without changing outer concavities."""
    binary = (mask > 0).astype(np.uint8)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(binary)
    cv2.drawContours(filled, contours, -1, 1, thickness=cv2.FILLED)
    return filled


def polygon_rect(polygon: np.ndarray) -> dict:
    x, y, w, h = cv2.boundingRect(polygon)
    return {"x": int(x), "y": int(y), "width": int(w), "height": int(h), "sourceWidth": WORLD_W, "sourceHeight": WORLD_H}


def mask_to_polygon(mask: np.ndarray, epsilon_px: float = 4.0) -> list[list[float]]:
    """Largest-contour polygon of a mask, simplified — runtime clip path
    (Graphics mask, Canvas-safe) so overlays stay pixel-accurate to the
    painted shape instead of a bounding rect."""
    contours, _ = cv2.findContours((mask > 127).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return []
    contour = max(contours, key=cv2.contourArea)
    approx = cv2.approxPolyDP(contour, epsilon_px, True)
    return [[round(float(p[0][0]), 1), round(float(p[0][1]), 1)] for p in approx]


def scatter(mask: np.ndarray, count: int, min_sep: float, rng: np.random.Generator, point_type: str) -> list[dict]:
    ys, xs = np.nonzero(mask)
    order = rng.permutation(len(xs))
    chosen = []
    for i in order:
        x, y = int(xs[i]), int(ys[i])
        if all((x - p["x"]) ** 2 + (y - p["y"]) ** 2 >= min_sep * min_sep for p in chosen):
            chosen.append({
                "id": f"{point_type}_{len(chosen) + 1:02d}",
                "type": point_type,
                "x": x,
                "y": y,
                "confidence": round(float(mask[y, x]) / 255, 3),
                "source": "auto",
            })
            if len(chosen) >= count:
                break
    return chosen



def _stroke_polyline(shape: tuple[int, int], points: list[tuple[int, int]], width: int) -> np.ndarray:
    """Thick-stroke rasterization of an authored polyline corridor/centerline."""
    mask = np.zeros(shape, dtype=np.uint8)
    cv2.polylines(mask, [np.array(points, np.int32)], False, 255, thickness=width, lineType=cv2.LINE_8)
    for px, py in points:
        cv2.circle(mask, (px, py), width // 2, 255, -1)
    return mask



def _fillet_centerline(points: list[tuple[int, int]], max_bend_deg: float, seg_cap: int) -> list[list[float]]:
    """Cut polyline corners so every joint bend stays under max_bend_deg.
    Each sharp vertex V is replaced by two points (0.7/0.3 lerps on adjacent
    legs), splitting the bend ~in half; iterates while under the segment cap."""
    pts = [[float(x), float(y)] for x, y in points]

    def bends():
        out = []
        for i in range(1, len(pts) - 1):
            v1 = np.array([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]])
            v2 = np.array([pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]])
            n1, n2 = np.hypot(*v1), np.hypot(*v2)
            ang = float(np.degrees(np.arccos(np.clip((v1 @ v2) / max(n1 * n2, 1e-9), -1, 1))))
            out.append((i, ang))
        return out

    for _ in range(6):
        sharp = [b for b in bends() if b[1] > max_bend_deg]
        if not sharp or len(pts) - 1 + len(sharp) > seg_cap:
            break
        for i, _ang in reversed(sharp):
            a, v, b = np.array(pts[i - 1]), np.array(pts[i]), np.array(pts[i + 1])
            p1 = a + (v - a) * 0.7
            p2 = v + (b - v) * 0.3
            pts[i:i + 1] = [p1.tolist(), p2.tolist()]
    return pts

def _oriented_rect(seg: dict) -> np.ndarray:
    """Corners (x,y) of an oriented rectangle for a flow segment dict."""
    dx, dy = np.cos(seg["angleRad"]), np.sin(seg["angleRad"])
    nx, ny = -dy, dx
    hw, hh = seg["length"] / 2.0, seg["width"] / 2.0
    cx, cy = seg["cx"], seg["cy"]
    return np.array([
        (cx - dx * hw - nx * hh, cy - dy * hw - ny * hh),
        (cx + dx * hw - nx * hh, cy + dy * hw - ny * hh),
        (cx + dx * hw + nx * hh, cy + dy * hw + ny * hh),
        (cx - dx * hw + nx * hh, cy - dy * hw + ny * hh),
    ], np.int32)


def build_secondary_water(
    *,
    water: np.ndarray,
    sea: np.ndarray,
    internal_water: np.ndarray,
    canopy_mask: np.ndarray,
    hsv_planes: tuple[np.ndarray, np.ndarray, np.ndarray],
    waterfall_flow_polygon: np.ndarray,
    waterfall_lake_mask: np.ndarray,
    source_hash: str,
    masks_dir: Path,
    debug_dir: Path,
    rgb: np.ndarray,
) -> dict:
    """PLAN-095: authored-corridor class/render mask split, oriented flow
    segments with joint extension, lake glint points and confluence anchors.
    Returns {internalWater, riverClassMasks, riverRenderMasks, lakeRenderMasks,
    geometry, gateFailures}."""
    h, s, v = hsv_planes
    shape = (WORLD_H, WORLD_W)
    failures: list[str] = []
    rng = np.random.default_rng(int(source_hash[:16], 16) ^ 0x5EC0D)

    river_class_masks: dict[str, np.ndarray] = {}
    river_render_masks: dict[str, np.ndarray] = {}
    lake_class_masks: dict[str, np.ndarray] = {}
    lake_render_masks: dict[str, np.ndarray] = {}
    geometry = {"rivers": [], "lakes": [], "confluences": []}

    for spec in RIVER_SPECS:
        filleted = _fillet_centerline(spec["centerline"], SW_MAX_BEND_DEG, SW_SEG_CAP_PER_RIVER)
        corridor = _stroke_polyline(shape, [tuple(int(round(c)) for c in p) for p in filleted], spec["corridorWidth"]) > 0
        candidate = (
            (h >= spec["hsvLo"][0]) & (h <= spec["hsvHi"][0])
            & (s >= spec["hsvLo"][1]) & (v >= spec["hsvLo"][2])
            & (s <= spec["hsvHi"][1]) & (v <= spec["hsvHi"][2])
        )
        exclusion = np.zeros(shape, dtype=bool)
        for poly in spec.get("exclusions", []):
            exclusion |= fill_polygon(shape, np.array(poly, np.int32)) > 0
        feature_class = corridor & candidate & ~exclusion & ~canopy_mask
        if spec["id"] != "river_east_canyon":
            # Global HSV water band applies; east canyon uses its wider
            # corridor-scoped greenish-teal candidate instead.
            feature_class &= water > 0
        feature_class = cv2.morphologyEx(
            feature_class.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)) > 0
        feature_class &= corridor
        river_class_masks[spec["id"]] = feature_class

        dist = cv2.distanceTransform(feature_class.astype(np.uint8), cv2.DIST_L2, 5)

        # Segments first: render = eroded class clipped to what the oriented
        # rects actually serve (side pockets/fork pools outside any rect are
        # excluded from the animated region by construction).
        pts0 = spec["centerline"]
        filleted = _fillet_centerline(pts0, SW_MAX_BEND_DEG, SW_SEG_CAP_PER_RIVER)
        pts = [(int(round(p[0])), int(round(p[1]))) for p in filleted]
        segments = []
        prev_dir = None
        for i in range(len(pts) - 1):
            ax, ay = pts[i]
            bx, by = pts[i + 1]
            vx, vy = bx - ax, by - ay
            leg_len = float(np.hypot(vx, vy))
            if leg_len < 1.0:
                continue
            d = (vx / leg_len, vy / leg_len)
            if prev_dir is not None:
                dot = d[0] * prev_dir[0] + d[1] * prev_dir[1]
                bend = float(np.degrees(np.arccos(np.clip(dot, -1, 1))))
                if bend > SW_MAX_BEND_DEG:
                    failures.append(f"{spec['id']}_bend_{bend:.0f}deg_at_pt{i}")
            prev_dir = d
            nx_l, ny_l = -d[1], d[0]
            widths = []
            for tt in (0.2, 0.5, 0.8):
                px0, py0 = ax + vx * tt, ay + vy * tt
                run_p = run_n = 0
                for k in range(1, 60):
                    xi, yi = int(round(px0 + nx_l * k)), int(round(py0 + ny_l * k))
                    if not (0 <= xi < WORLD_W and 0 <= yi < WORLD_H and feature_class[yi, xi]):
                        break
                    run_p += 1
                for k in range(1, 60):
                    xi, yi = int(round(px0 - nx_l * k)), int(round(py0 - ny_l * k))
                    if not (0 <= xi < WORLD_W and 0 <= yi < WORLD_H and feature_class[yi, xi]):
                        break
                    run_n += 1
                widths.append(float(run_p + run_n + 1))
            w_local = max(float(np.max(widths)) + 4.0, spec["insetPx"] * 4.0)
            segments.append({
                "a": [ax, ay], "b": [bx, by], "dir": d, "len": leg_len, "w": w_local,
                "angleRad": float(np.arctan2(d[1], d[0])),
            })
        for i, seg in enumerate(segments):
            ext_a = ext_b = 0.0
            for end, other in ((0, i - 1), (1, i + 1)):
                if 0 <= other < len(segments):
                    o = segments[other]["dir"]
                    dot = seg["dir"][0] * o[0] + seg["dir"][1] * o[1]
                    theta = float(np.degrees(np.arccos(np.clip(abs(dot), -1, 1))))
                    if theta >= SW_MAX_JOINT_DEG:
                        failures.append(f"{spec['id']}_joint_{theta:.0f}deg_ge_60")
                        continue
                    ext = seg["w"] * np.tan(np.radians(theta) / 2.0)
                    if end == 0:
                        ext_a = ext
                    else:
                        ext_b = ext
            seg["extStart"], seg["extEnd"] = float(ext_a), float(ext_b)
            seg["cx"] = (seg["a"][0] + seg["b"][0]) / 2.0
            seg["cy"] = (seg["a"][1] + seg["b"][1]) / 2.0
            seg["length"] = seg["len"] + seg["extStart"] + seg["extEnd"]
            seg["width"] = seg["w"]

        rect_union = np.zeros(shape, dtype=np.uint8)
        for seg in segments:
            cv2.fillPoly(rect_union, [_oriented_rect(seg)], 255)
        eroded = dist >= spec["insetPx"]
        render = eroded & (rect_union > 0)
        river_render_masks[spec["id"]] = render

        # Disjoint safePolygons (RETR_EXTERNAL, no nested holes).
        contours, _ = cv2.findContours(render.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        safe_polys = []
        raster_check = np.zeros(shape, dtype=np.uint8)
        for c in contours:
            poly = None
            for eps in (1.6, 1.1, 0.8, 0.5):
                approx = cv2.approxPolyDP(c, eps, True)
                if len(approx) < 3:
                    break
                cand = [[round(float(p[0][0]), 1), round(float(p[0][1]), 1)] for p in approx]
                test = np.zeros(shape, dtype=np.uint8)
                cv2.fillPoly(test, [np.array(cand, np.int32)], 255)
                if int(np.count_nonzero((test > 0) & ~feature_class)) == 0:
                    poly = cand
                    break
            if poly is None:
                approx = cv2.approxPolyDP(c, 0.4, True)
                poly = [[round(float(p[0][0]), 1), round(float(p[0][1]), 1)] for p in approx]
            if len(poly) < 3:
                continue
            safe_polys.append(poly)
            cv2.fillPoly(raster_check, [np.array(poly, np.int32)], 255)
        inside = raster_check > 0
        if int(np.count_nonzero(inside & ~feature_class)) > 0:
            failures.append(f"{spec['id']}_safePoly_outside_classMask")
        pair_i = np.zeros(shape, dtype=np.uint8)
        overlaps = False
        for poly in safe_polys:
            m = np.zeros(shape, dtype=np.uint8)
            cv2.fillPoly(m, [np.array(poly, np.int32)], 1)
            if np.count_nonzero(pair_i & (m > 0)) > 0:
                overlaps = True
            pair_i |= m
        if overlaps:
            failures.append(f"{spec['id']}_safePoly_overlap")
        render_area = float(np.count_nonzero(render))
        poly_area = float(np.count_nonzero(inside))
        if render_area == 0 or abs(poly_area - render_area) / render_area > 0.03:
            failures.append(f"{spec['id']}_safePoly_area_drift")
        flow_hit = np.count_nonzero(inside & (fill_polygon(shape, waterfall_flow_polygon) > 0))
        if flow_hit > 0:
            failures.append(f"{spec['id']}_waterfall_flow_overlap")

        # Pool glints: this painting's rivers are pool chains — interior water
        # that no rect serves gets deterministic glints (shimmer, not scroll),
        # exactly like lakes. Glint disks count toward coverage service.
        pool_glints = [{"x": int(x), "y": int(y)} for x, y in spec.get("poolGlintAnchors", [])]
        served = rect_union > 0
        leftover = eroded & ~served
        if leftover.any():
            dist_l = cv2.distanceTransform(leftover.astype(np.uint8), cv2.DIST_L2, 5)
            cand_pts = np.argwhere(dist_l >= 3.0)
            # Greedy deepest-pocket placement (deterministic), so glints land
            # on the largest unserved interiors rather than random pixels.
            order = np.lexsort((cand_pts[:, 0], cand_pts[:, 1], -dist_l[cand_pts[:, 0], cand_pts[:, 1]]))
            cand_pts = cand_pts[order]
            for gy, gx in cand_pts:
                if all((gx - g["x"]) ** 2 + (gy - g["y"]) ** 2 >= 3600 for g in pool_glints):
                    pool_glints.append({"x": int(gx), "y": int(gy)})
                    if len(pool_glints) >= 20:
                        break
        glint_disk = np.zeros(shape, dtype=np.uint8)
        for g in pool_glints:
            cv2.circle(glint_disk, (g["x"], g["y"]), 30, 255, -1)
        served |= glint_disk > 0

        # Coverage gate (WITNESS-13 honest form): rects + pool glints must serve
        # the eroded interior — uncovered <=15%, no uncovered component >300px.
        # (A single bounded organic pool pocket is residual; the gate exists to
        # catch the systematic outer-bank wedge, ~10k px holes.)
        bbox_area_sum = sum(s["length"] * s["width"] for s in segments)
        uncovered = eroded & ~served
        eroded_area = float(np.count_nonzero(eroded))
        unc_area = float(np.count_nonzero(uncovered))
        unc_ratio = unc_area / max(eroded_area, 1.0)
        n_comp, comp_lab, comp_stats, _ = cv2.connectedComponentsWithStats(uncovered.astype(np.uint8), connectivity=8)
        max_comp = int(comp_stats[1:, cv2.CC_STAT_AREA].max()) if n_comp > 1 else 0
        if unc_ratio > 0.15 or max_comp > 300:
            failures.append(f"{spec['id']}_bend_coverage_{unc_ratio:.4f}_{max_comp}px")
        # 8x ratio (thin painted rivers): rects >> tiny eroded render by
        # construction; the absolute 150k px2 cap bounds Canvas overdraw.
        if render_area > 0 and (bbox_area_sum > 8.0 * render_area or bbox_area_sum > 150000):
            failures.append(f"{spec['id']}_bbox_overdraw_{bbox_area_sum:.0f}_of_{render_area:.0f}")

        # East-canyon offline gate: IoU >= 0.85 vs checked-in reference band,
        # 0% canopy overlap, >= 2500 safe px.
        if spec.get("referenceFixture"):
            fx = json.loads(Path(spec["referenceFixture"]).read_text(encoding="utf-8"))
            band = _stroke_polyline(shape, [tuple(p) for p in fx["centerline"]], int(fx["width"])) > 0
            class_area = float(np.count_nonzero(feature_class))
            containment = float(np.count_nonzero(band & feature_class)) / max(class_area, 1.0)
            if containment < 0.9:
                failures.append(f"{spec['id']}_containment_{containment:.2f}_below_0.9")
            # centroid-deviation: class mask must track the authored line, not bleed.
            ref_pts = [tuple(p) for p in fx["centerline"]]
            worst_dev = 0.0
            ys_c, xs_c = np.nonzero(feature_class)
            for yb in range(0, WORLD_H, 40):
                m = (ys_c >= yb) & (ys_c < yb + 40)
                if m.sum() < 10:
                    continue
                cx_b = float(xs_c[m].mean()); cy_b = yb + 20.0
                dev = min(
                    abs(cx_b - (p1[0] + (p2[0] - p1[0]) * np.clip((cy_b - p1[1]) / max(p2[1] - p1[1], 1e-9), 0, 1)))
                    if abs(p2[1] - p1[1]) > 2 else abs(cx_b - p1[0])
                    for p1, p2 in zip(ref_pts, ref_pts[1:])
                )
                worst_dev = max(worst_dev, dev)
            if worst_dev > 42.0:
                failures.append(f"{spec['id']}_centroid_deviation_{worst_dev:.0f}px")
            if int(np.count_nonzero(feature_class & canopy_mask)) > 0:
                failures.append(f"{spec['id']}_canopy_overlap")
            if int(np.count_nonzero(render)) < 800:
                failures.append(f"{spec['id']}_safe_area_below_800")

        geometry["rivers"].append({
            "id": spec["id"], "enabled": spec["enabled"], "tint": spec["tint"],
            "glintPoints": pool_glints,
            "safePolygons": safe_polys,
            "segments": [
                {"cx": round(s2["cx"], 1), "cy": round(s2["cy"], 1),
                 "angleRad": round(s2["angleRad"], 4),
                 "length": round(s2["length"], 1), "width": round(s2["width"], 1)}
                for s2 in segments
            ],
        })

    total_verts = sum(len(p) for r in geometry["rivers"] for p in r["safePolygons"])
    total_segs = sum(len(r["segments"]) for r in geometry["rivers"])
    if total_verts > 400:
        failures.append(f"total_vertices_{total_verts}_above_400")
    if total_segs > SW_TOTAL_SEG_CAP:
        failures.append(f"total_segments_{total_segs}_above_{SW_TOTAL_SEG_CAP}")

    for spec in LAKE_SPECS:
        roi = fill_polygon(shape, spec["polygon"]) > 0
        if spec["id"] == "lake_alpine":
            lake_class = roi & (waterfall_lake_mask > 127) & ~canopy_mask
        else:
            lake_class = roi & (water > 0) & ~canopy_mask
        lake_class_masks[spec["id"]] = lake_class
        dist = cv2.distanceTransform(lake_class.astype(np.uint8), cv2.DIST_L2, 5)
        render = dist >= spec["insetPx"]
        lake_render_masks[spec["id"]] = render
        contours, _ = cv2.findContours(render.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        safe_polys = []
        for c in contours:
            approx = cv2.approxPolyDP(c, 1.6, True)
            if len(approx) >= 3:
                safe_polys.append([[round(float(p[0][0]), 1), round(float(p[0][1]), 1)] for p in approx])
        safe_polys = [p for p in safe_polys if len(p) >= 3]
        eligible = np.argwhere(dist >= 4.0)
        rng.shuffle(eligible)
        glints = []
        for gy, gx in eligible:
            if all((gx - g["x"]) ** 2 + (gy - g["y"]) ** 2 >= 1156 for g in glints):
                glints.append({"x": int(gx), "y": int(gy)})
                if len(glints) >= spec["glintCount"]:
                    break
        if len(glints) < spec["glintCount"]:
            failures.append(f"{spec['id']}_glints_{len(glints)}_below_{spec['glintCount']}")
        geometry["lakes"].append({
            "id": spec["id"], "enabled": spec["enabled"],
            "safePolygons": safe_polys, "glintPoints": glints,
        })

    class_union = np.zeros(shape, dtype=bool)
    for m in list(river_class_masks.values()) + list(lake_class_masks.values()):
        class_union |= m
    water_dt = cv2.distanceTransform(class_union.astype(np.uint8), cv2.DIST_L2, 5)
    for c in CONFLUENCE_SPECS:
        y0, y1 = max(0, c["y"] - 25), min(WORLD_H, c["y"] + 26)
        x0, x1 = max(0, c["x"] - 25), min(WORLD_W, c["x"] + 26)
        local_dt = float(water_dt[y0:y1, x0:x1].max())
        geometry["confluences"].append({
            "id": c["id"], "x": c["x"], "y": c["y"],
            "radiusPx": round(min(max(2.0 * local_dt * 0.1, 2.0), 18.0), 1),
        })

    internal_water = internal_water | class_union
    river_flow = np.zeros(shape, dtype=np.uint8)
    for m in river_render_masks.values():
        river_flow[m] = 255
    lake_shimmer = np.zeros(shape, dtype=np.uint8)
    for m in lake_render_masks.values():
        lake_shimmer[m] = 255
    save_alpha_mask(river_flow, masks_dir / "river_flow_mask.webp")
    save_alpha_mask(lake_shimmer, masks_dir / "lake_shimmer_mask.webp")

    # Debug sheet: corridors outline, class teal, render cyan, segments magenta,
    # exclusions red, glints yellow, confluences orange.
    dbg = rgb.astype(np.float32)
    dbg[class_union] = dbg[class_union] * 0.45 + np.array([40, 200, 200]) * 0.55
    render_union = np.zeros(shape, dtype=bool)
    for m in list(river_render_masks.values()) + list(lake_render_masks.values()):
        render_union |= m
    dbg[render_union] = dbg[render_union] * 0.35 + np.array([40, 240, 255]) * 0.65
    dbg = np.clip(dbg, 0, 255).astype(np.uint8)
    for spec in RIVER_SPECS:
        cv2.polylines(dbg, [np.array(spec["centerline"], np.int32)], False, (255, 255, 0), 1, cv2.LINE_8)
        for poly in spec.get("exclusions", []):
            cv2.polylines(dbg, [np.array(poly, np.int32)], True, (255, 40, 40), 2, cv2.LINE_8)
    for r in geometry["rivers"]:
        pts_cl = [(int(s["cx"]), int(s["cy"])) for s in r["segments"]]
        for s in r["segments"]:
            cv2.polylines(dbg, [_oriented_rect(s)], True, (255, 0, 255), 1, cv2.LINE_8)
    for lk in geometry["lakes"]:
        for g in lk["glintPoints"]:
            cv2.circle(dbg, (g["x"], g["y"]), 4, (255, 255, 0), -1, cv2.LINE_8)
    for rr in geometry["rivers"]:
        for g in rr.get("glintPoints", []):
            cv2.circle(dbg, (g["x"], g["y"]), 5, (0, 200, 255), -1, cv2.LINE_8)
    for cf in geometry["confluences"]:
        cv2.circle(dbg, (cf["x"], cf["y"]), max(2, int(cf["radiusPx"])), (255, 140, 0), 1, cv2.LINE_8)
    Image.fromarray(dbg, "RGB").save(debug_dir / "secondary-water-preview.webp", quality=90, method=4)

    geometry_json = {
        "generatedFrom": "PLAN-095 authored corridors + local candidates",
        "riverFlowMask": "masks/river_flow_mask.webp",
        "lakeShimmerMask": "masks/lake_shimmer_mask.webp",
        "rivers": geometry["rivers"],
        "lakes": geometry["lakes"],
        "confluences": geometry["confluences"],
    }
    canonical = json.dumps(geometry_json, sort_keys=True, separators=(",", ":"))
    geometry_json["geometrySha256"] = hashlib.sha256(canonical.encode()).hexdigest()
    (debug_dir / "secondary-water-geometry.json").write_text(json.dumps(geometry_json, indent=2), encoding="utf-8")

    return {
        "internalWater": internal_water,
        "gateFailures": failures,
        "geometry": geometry_json,
    }

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=str(Path.home() / "Downloads" / "mappa2.jpeg"))
    parser.add_argument("--out", default="public/assets/world/mappa2/base")
    parser.add_argument("--pipeline-version", default="mappa2-assets-v1")
    parser.add_argument("--mask-revision", type=int, default=5)
    parser.add_argument("--cloud-source", default=str(Path.home() / "Downloads" / "nuvole.jpeg"))
    args = parser.parse_args()

    source = Path(args.source).expanduser().resolve()
    out = Path(args.out)
    layers = out / "layers"
    masks_dir = out / "masks"
    debug_dir = out / "debug"
    for d in (layers, masks_dir, debug_dir):
        d.mkdir(parents=True, exist_ok=True)

    raw = source.read_bytes()
    source_hash = hashlib.sha256(raw).hexdigest()
    image = Image.open(source).convert("RGB")
    if image.size != (WORLD_W, WORLD_H):
        raise SystemExit(f"mappa2 source must be {WORLD_W}x{WORLD_H}, got {image.size}")
    rgb = np.array(image)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, s, v = cv2.split(hsv)

    water = ((h >= 76) & (h <= 116) & (s >= 32) & (v >= 28)).astype(np.uint8) * 255
    water = cv2.morphologyEx(water, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    water = cv2.morphologyEx(water, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    count, labels = cv2.connectedComponents(water, connectivity=8)
    border_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    sea = np.isin(labels, border_labels[border_labels > 0])
    internal_water = (water > 0) & ~sea
    land = ~(sea | internal_water)

    foreground = np.zeros((WORLD_H, WORLD_W), dtype=np.uint8)
    cv2.fillPoly(foreground, [np.array([(0, 1160), (0, 1536), (610, 1536), (320, 1180)], np.int32)], 255)
    cv2.fillPoly(foreground, [np.array([(2752, 1120), (2752, 1536), (2130, 1536), (2420, 1160)], np.int32)], 255)
    foreground = (foreground > 0) & land
    canopy_blocked_regions = {"snow_peaks", "dry_steppe", "red_canyons", "volcanic_massif"}
    canopy_blocked = np.zeros((WORLD_H, WORLD_W), dtype=np.uint8)
    for region_id, _, polygon in REGION_SPECS:
        if region_id in canopy_blocked_regions:
            cv2.fillPoly(canopy_blocked, [np.array(polygon, np.int32)], 255)
    canopy_blocked = canopy_blocked > 0
    dense_forest_core = fill_polygon((WORLD_H, WORLD_W), DENSE_FOREST_CORE_POLYGON) > 0

    Image.fromarray(rgb, "RGB").convert("RGBA").save(layers / "base_flat.webp", quality=94, method=4)
    save_webp_rgba(rgb, (sea.astype(np.uint8) * 255), layers / "Mare.webp", quality=94)
    save_webp_rgba(rgb, (foreground.astype(np.uint8) * 255), layers / "Foreground.webp", quality=94)

    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    laplacian = np.abs(cv2.Laplacian(gray, cv2.CV_32F, ksize=3))
    edge_density = cv2.boxFilter((laplacian > 24).astype(np.float32), -1, (9, 9), normalize=True)
    green_score = rgb[:, :, 1].astype(np.float32) - (rgb[:, :, 0].astype(np.float32) + rgb[:, :, 2].astype(np.float32)) * 0.5
    broad_canopy = land & ~foreground & ~canopy_blocked & (h >= 18) & (h <= 100) & (s >= 40) & (v <= 200) & (green_score >= 30) & (edge_density >= 0.45)
    dense_core_seed = land & ~foreground & dense_forest_core & (h >= 34) & (h <= 88) & (s >= 90) & (v <= 100) & (edge_density >= 0.55)
    canopy_seed = (broad_canopy | dense_core_seed).astype(np.uint8) * 255
    canopy_seed = cv2.morphologyEx(canopy_seed, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    canopy_seed = cv2.morphologyEx(canopy_seed, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    canopy_count, canopy_labels, canopy_stats, _ = cv2.connectedComponentsWithStats(canopy_seed, connectivity=8)
    canopy_layers = []
    canopy_union = np.zeros((WORLD_H, WORLD_W), dtype=np.uint8)
    for i in range(1, canopy_count):
        x, y, w, hgt, area = [int(vv) for vv in canopy_stats[i]]
        if area < CANOPY_MIN_AREA:
            continue
        component = (canopy_labels[y:y + hgt, x:x + w] == i).astype(np.uint8) * 255
        component = cv2.morphologyEx(component, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        if int(np.count_nonzero(component)) < CANOPY_MIN_AREA:
            continue
        canopy_union[y:y + hgt, x:x + w] |= component
        cid = f"forest_canopy_{len(canopy_layers) + 1:02d}"
        save_webp_rgba(rgb[y:y + hgt, x:x + w], component, layers / f"{cid}.canopy.webp", quality=94)
        canopy_layers.append({
            "id": cid,
            "file": f"{cid}.webp",
            "rect": {"x": x, "y": y, "width": w, "height": hgt, "sourceWidth": WORLD_W, "sourceHeight": WORLD_H},
        })

    canopy_mask = canopy_union > 0

    yy, xx = np.indices((WORLD_H, WORLD_W))
    waterfall_flow_roi = fill_polygon((WORLD_H, WORLD_W), WATERFALL_FLOW_POLYGON)
    waterfall_waterish = (
        ((h >= 88) & (h <= 116) & (s >= 18) & (v >= 65))
        | ((s <= 80) & (v >= 175))
    )
    waterfall_seed = ((waterfall_flow_roi > 0) & waterfall_waterish & (yy >= 375) & (yy <= 515)).astype(np.uint8) * 255
    waterfall_seed = cv2.morphologyEx(waterfall_seed, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    waterfall_seed = cv2.morphologyEx(waterfall_seed, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    waterfall_count, waterfall_labels, waterfall_stats, _ = cv2.connectedComponentsWithStats(waterfall_seed, connectivity=8)
    waterfall_mask = np.zeros((WORLD_H, WORLD_W), dtype=np.uint8)
    for i in range(1, waterfall_count):
        x, y, w, hgt, area = [int(vv) for vv in waterfall_stats[i]]
        if area >= 100 and x < 1440 and x + w > 1260 and y < 515 and y + hgt > 390:
            waterfall_mask[waterfall_labels == i] = 255
    waterfall_mask = cv2.morphologyEx(waterfall_mask, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    waterfall_mask = cv2.bitwise_and(waterfall_mask, waterfall_flow_roi)
    waterfall_mask = cv2.GaussianBlur(waterfall_mask, (0, 0), 1.2)

    waterfall_impact_roi = fill_polygon((WORLD_H, WORLD_W), WATERFALL_IMPACT_POLYGON)
    waterfall_impact = ((waterfall_impact_roi > 0) & (waterfall_waterish | ((h >= 85) & (h <= 118) & (v >= 110)))).astype(np.uint8) * 255
    waterfall_impact = cv2.morphologyEx(waterfall_impact, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    waterfall_impact = cv2.GaussianBlur(waterfall_impact, (0, 0), 2.0)

    waterfall_basin_roi = fill_polygon((WORLD_H, WORLD_W), WATERFALL_BASIN_POLYGON)
    waterfall_basin = ((waterfall_basin_roi > 0) & internal_water).astype(np.uint8) * 255
    waterfall_basin = cv2.morphologyEx(waterfall_basin, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    waterfall_basin = cv2.GaussianBlur(waterfall_basin, (0, 0), 1.4)

    waterfall_lake_roi = fill_polygon((WORLD_H, WORLD_W), WATERFALL_LAKE_POLYGON)
    waterfall_lake = ((waterfall_lake_roi > 0) & internal_water).astype(np.uint8) * 255
    waterfall_lake = cv2.morphologyEx(waterfall_lake, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    waterfall_lake = cv2.GaussianBlur(waterfall_lake, (0, 0), 1.4)

    waterfall_patch = np.zeros((WORLD_H, WORLD_W), dtype=np.uint8)
    cv2.rectangle(waterfall_patch, (1260, 220), (1400, 430), 255, -1)
    village_patch = np.zeros((WORLD_H, WORLD_W), dtype=np.uint8)
    cv2.rectangle(village_patch, (1180, 560), (1590, 850), 255, -1)
    canopy_inpaint_mask = (canopy_mask.astype(np.uint8) * 255)
    nocanopy_rgb = cv2.inpaint(rgb, canopy_inpaint_mask, 7, cv2.INPAINT_TELEA)
    clean_mask = ((canopy_mask | foreground | (waterfall_patch > 0) | (village_patch > 0)).astype(np.uint8) * 255)
    clean_rgb = cv2.inpaint(rgb, clean_mask, 7, cv2.INPAINT_TELEA)
    Image.fromarray(nocanopy_rgb, "RGB").convert("RGBA").save(layers / "base_flat.nocanopy.webp", quality=94, method=4)
    Image.fromarray(clean_rgb, "RGB").convert("RGBA").save(layers / "base_flat.clean.webp", quality=94, method=4)
    save_alpha_mask((canopy_mask.astype(np.uint8) * 255), masks_dir / "canopy_mask.webp")
    save_alpha_mask(waterfall_mask, masks_dir / "waterfall_mask.webp")
    save_alpha_mask(waterfall_impact, masks_dir / "waterfall_impact_mask.webp")
    save_alpha_mask(waterfall_basin, masks_dir / "waterfall_basin_mask.webp")
    save_alpha_mask(waterfall_lake, masks_dir / "waterfall_lake_mask.webp")

    waterfall_fx_dir = out / "fx" / "waterfall"
    waterfall_fx_dir.mkdir(parents=True, exist_ok=True)
    flow_rect = polygon_rect(WATERFALL_FLOW_POLYGON)
    flow_w = int(flow_rect["width"])
    flow_tile_h = 256
    flow_rng = np.random.default_rng(int(source_hash[:16], 16) ^ 0x51F00D)
    fy, fx = np.indices((flow_tile_h, flow_w))
    side_fade = np.clip(1.0 - np.abs((fx - (flow_w - 1) / 2.0) / ((flow_w - 1) / 2.0)) ** 1.8, 0, 1)
    flow_alpha = 24.0 * side_fade * (0.55 + 0.45 * np.cos(2.0 * np.pi * fy / flow_tile_h))
    for _ in range(14):
        center = flow_rng.uniform(flow_w * 0.14, flow_w * 0.86)
        drift = flow_rng.uniform(3.0, 11.0)
        width = flow_rng.uniform(1.4, 5.2)
        amp = flow_rng.uniform(55.0, 135.0)
        phase = flow_rng.uniform(0.0, 2.0 * np.pi)
        phase2 = flow_rng.uniform(0.0, 2.0 * np.pi)
        lane_center = center + drift * np.sin(2.0 * np.pi * fy / flow_tile_h + phase) + drift * 0.35 * np.sin(4.0 * np.pi * fy / flow_tile_h + phase * 1.7)
        lane = np.exp(-((fx - lane_center) / width) ** 2.0)
        band = 0.65 + 0.35 * np.cos(2.0 * np.pi * fy / flow_tile_h + phase2)
        flow_alpha += amp * lane * band
    flow_alpha = np.clip(flow_alpha * side_fade, 0, 220)
    flow_alpha_wrapped = np.vstack([flow_alpha, flow_alpha, flow_alpha])
    flow_alpha = cv2.GaussianBlur(flow_alpha_wrapped, (0, 0), 1.1)[flow_tile_h:flow_tile_h * 2]
    flow_rgb = np.dstack([
        np.clip(205 + 45 * (flow_alpha / 220.0), 0, 255),
        np.clip(228 + 24 * (flow_alpha / 220.0), 0, 255),
        np.full(flow_alpha.shape, 255, dtype=np.float64),
    ]).astype(np.uint8)
    save_webp_rgba(flow_rgb, flow_alpha.astype(np.uint8), waterfall_fx_dir / "flow_streaks.webp", quality=90)

    mist_size = 128
    my, mx = np.indices((mist_size, mist_size))
    mist_rng = np.random.default_rng(int(source_hash[:16], 16) ^ 0x5EA5EED)
    mist_alpha = np.zeros((mist_size, mist_size), dtype=np.float64)
    for cx, cy, sx, sy, amp in [
        (0.50, 0.50, 0.28, 0.24, 185.0),
        (0.34, 0.56, 0.18, 0.15, 95.0),
        (0.66, 0.55, 0.18, 0.16, 105.0),
        (0.50, 0.34, 0.16, 0.13, 75.0),
    ]:
        mist_alpha += amp * np.exp(-(((mx / mist_size - cx) / sx) ** 2.0 + ((my / mist_size - cy) / sy) ** 2.0))
    mist_alpha += mist_rng.normal(0.0, 5.0, mist_alpha.shape)
    mist_alpha = cv2.GaussianBlur(np.clip(mist_alpha, 0, 230), (0, 0), 3.0)
    mist_rgb = np.dstack([
        np.full(mist_alpha.shape, 226, dtype=np.uint8),
        np.full(mist_alpha.shape, 246, dtype=np.uint8),
        np.full(mist_alpha.shape, 255, dtype=np.uint8),
    ])
    save_webp_rgba(mist_rgb, mist_alpha.astype(np.uint8), waterfall_fx_dir / "mist_blob.webp", quality=88)

    ripple_size = 256
    ry, rx = np.indices((ripple_size, ripple_size))
    rr = np.sqrt((rx - (ripple_size - 1) / 2.0) ** 2.0 + (ry - (ripple_size - 1) / 2.0) ** 2.0) / ((ripple_size - 1) / 2.0)
    ripple_alpha = 205.0 * np.exp(-((rr - 0.78) / 0.035) ** 2.0) + 72.0 * np.exp(-((rr - 0.58) / 0.018) ** 2.0)
    ripple_alpha = cv2.GaussianBlur(np.clip(ripple_alpha, 0, 220), (0, 0), 1.2)
    ripple_rgb = np.dstack([
        np.full(ripple_alpha.shape, 224, dtype=np.uint8),
        np.full(ripple_alpha.shape, 248, dtype=np.uint8),
        np.full(ripple_alpha.shape, 255, dtype=np.uint8),
    ])
    save_webp_rgba(ripple_rgb, ripple_alpha.astype(np.uint8), waterfall_fx_dir / "ripple_ring.webp", quality=88)

    waterfall_fx_preview = rgb.astype(np.float32)
    flow_preview = np.array(Image.open(waterfall_fx_dir / "flow_streaks.webp").convert("RGBA"))
    x0, y0 = int(flow_rect["x"]), int(flow_rect["y"])
    crop = flow_preview[: int(flow_rect["height"]), : int(flow_rect["width"])]
    alpha = (crop[..., 3:4] / 255.0) * 0.65
    waterfall_fx_preview[y0:y0 + crop.shape[0], x0:x0 + crop.shape[1]] = (
        waterfall_fx_preview[y0:y0 + crop.shape[0], x0:x0 + crop.shape[1]] * (1 - alpha)
        + crop[..., :3] * alpha
    )
    mist_preview = np.array(Image.open(waterfall_fx_dir / "mist_blob.webp").convert("RGBA").resize((150, 150)))
    mx0, my0 = 1260, 480
    alpha = (mist_preview[..., 3:4] / 255.0) * 0.55
    waterfall_fx_preview[my0:my0 + 150, mx0:mx0 + 150] = (
        waterfall_fx_preview[my0:my0 + 150, mx0:mx0 + 150] * (1 - alpha)
        + mist_preview[..., :3] * alpha
    )
    ripple_preview = np.array(Image.open(waterfall_fx_dir / "ripple_ring.webp").convert("RGBA").resize((190, 190)))
    rx0, ry0 = 1245, 445
    alpha = (ripple_preview[..., 3:4] / 255.0) * 0.5
    waterfall_fx_preview[ry0:ry0 + 190, rx0:rx0 + 190] = (
        waterfall_fx_preview[ry0:ry0 + 190, rx0:rx0 + 190] * (1 - alpha)
        + ripple_preview[..., :3] * alpha
    )
    Image.fromarray(np.clip(waterfall_fx_preview, 0, 255).astype(np.uint8)).save(debug_dir / "waterfall-fx-preview.webp", quality=92, method=4)

    # PLAN-092: painted-flow tile — crop of the PAINTED falls (extended vertically).
    # Only the mask-interior pixels are trusted: non-falls cells inside the rect
    # (green river above, blue basin below, rocks at the sides) are filled by
    # vertically re-sampling the same column's masked rows, so the scrolled tile
    # is all falls, all the way down. Then edge-blend the Y wrap seam.
    pf_crop = rgb[
        max(0, int(flow_rect["y"]) - 40): min(WORLD_H, int(flow_rect["y"]) + int(flow_rect["height"]) + 40),
        int(flow_rect["x"]): int(flow_rect["x"]) + int(flow_rect["width"]),
    ].astype(np.float32)
    pf_mask = waterfall_mask[
        max(0, int(flow_rect["y"]) - 40): min(WORLD_H, int(flow_rect["y"]) + int(flow_rect["height"]) + 40),
        int(flow_rect["x"]): int(flow_rect["x"]) + int(flow_rect["width"]),
    ] > 127
    pf_h, pf_w = pf_crop.shape[:2]
    for x in range(pf_w):
        col_rows = np.where(pf_mask[:, x])[0]
        if col_rows.size == 0:
            continue
        src = col_rows[np.searchsorted(col_rows, np.arange(pf_h)) % col_rows.size]
        pf_crop[~pf_mask[:, x], x] = pf_crop[src[~pf_mask[:, x]], x]
    pf_tile = cv2.GaussianBlur(pf_crop, (0, 0), 0.9)
    pf_band = 36
    pf_tile = pf_tile.copy()
    for i in range(pf_band):
        wgt = (i + 1) / (pf_band + 1)
        pf_tile[i] = pf_crop[pf_h - pf_band + i] * (1 - wgt) + pf_crop[i] * wgt
        pf_tile[pf_h - pf_band + i] = pf_crop[i] * (1 - wgt) + pf_crop[pf_h - pf_band + i] * wgt
    pf_tile = cv2.GaussianBlur(pf_tile, (1, 9), 0, 0.8)
    pf_crop_y0 = max(0, int(flow_rect["y"]) - 40)
    painted_flow_rect = {"x": int(flow_rect["x"]), "y": int(pf_crop_y0), "width": int(pf_w), "height": int(pf_h), "sourceWidth": WORLD_W, "sourceHeight": WORLD_H}
    save_webp_rgba(
        np.clip(pf_tile, 0, 255).astype(np.uint8),
        np.full((pf_h, pf_w), 255, dtype=np.uint8),
        waterfall_fx_dir / "painted_flow_tile.webp", quality=92)

    # PLAN-092 flipbook (choice B): N painted poses = the Y-tileable tile rolled
    # by k*(H/N) per frame — every pose is seamless by construction (the tile
    # already wraps). Runtime cycles them at 10fps = painted cel animation.
    FLIP_N = 6
    flip_files = []
    for k in range(FLIP_N):
        rolled = np.roll(pf_tile, -k * (pf_h // FLIP_N), axis=0)
        fname = f"flip_f{k}.webp"
        save_webp_rgba(
            np.clip(rolled, 0, 255).astype(np.uint8),
            np.full((pf_h, pf_w), 255, dtype=np.uint8),
            waterfall_fx_dir / fname, quality=90)
        flip_files.append(f"fx/waterfall/{fname}")
    # Inner-inset clip: contour of the ERODED mask (8px) — a clean interior
    # shape that never cuts into the falls silhouette nor exposes skew edges.
    pf_clip_src = cv2.erode((waterfall_mask > 127).astype(np.uint8) * 255, np.ones((9, 9), np.uint8))
    painted_flow_clip = mask_to_polygon(pf_clip_src, epsilon_px=2.0)


    # PLAN-095: secondary water — authored corridors + class/render mask split.
    sw_result = build_secondary_water(
        water=water, sea=sea, internal_water=internal_water,
        canopy_mask=canopy_mask, hsv_planes=(h, s, v),
        waterfall_flow_polygon=WATERFALL_FLOW_POLYGON,
        waterfall_lake_mask=waterfall_lake,
        source_hash=source_hash, masks_dir=masks_dir, debug_dir=debug_dir, rgb=rgb,
    )
    internal_water = sw_result["internalWater"]
    sw_gate_failures = sw_result["gateFailures"]

    # PLAN-095 T-002: deterministic lossless river-flow tile (256x256 RGBA,
    # alpha=0 between filaments, x-periodic so TilingSprite wraps cleanly).
    water_fx_dir = out / "fx" / "water"
    water_fx_dir.mkdir(parents=True, exist_ok=True)
    sw_rng = np.random.default_rng(int(source_hash[:16], 16) ^ 0x51A9E7)
    ty, tx = np.indices((256, 256))
    sw_alpha = np.zeros((256, 256), dtype=np.float64)
    for _ in range(9):
        cy0 = sw_rng.uniform(16, 240)
        k1 = int(sw_rng.integers(1, 4))
        ph = sw_rng.uniform(0, 2 * np.pi)
        drift = sw_rng.uniform(4, 14)
        width = sw_rng.uniform(1.6, 4.5)
        amp = sw_rng.uniform(60, 150)
        k2 = int(sw_rng.integers(2, 7))
        ph2 = sw_rng.uniform(0, 2 * np.pi)
        lane_c = cy0 + drift * np.sin(2 * np.pi * k1 * tx / 256.0 + ph)
        lane = np.exp(-((ty - lane_c) / width) ** 2.0)
        band = 0.55 + 0.45 * np.cos(2 * np.pi * k2 * tx / 256.0 + ph2)
        sw_alpha += amp * lane * band
    sw_alpha = np.clip(sw_alpha, 0, 180)
    sw_alpha = cv2.GaussianBlur(sw_alpha, (0, 0), 0.9)
    sw_rgb = np.dstack([
        np.full(sw_alpha.shape, 215, dtype=np.uint8),
        np.full(sw_alpha.shape, 242, dtype=np.uint8),
        np.full(sw_alpha.shape, 248, dtype=np.uint8),
    ])
    save_webp_rgba_lossless(sw_rgb, sw_alpha.astype(np.uint8), water_fx_dir / "river_flow_tile.webp")
    river_tile_sha = hashlib.sha256((water_fx_dir / "river_flow_tile.webp").read_bytes()).hexdigest()
    sw_geometry = sw_result["geometry"]
    secondary_water_json = {
        "generatedFrom": sw_geometry["generatedFrom"],
        "sourceSha256": source_hash,
        "geometrySha256": sw_geometry["geometrySha256"],
        "waterfallFlowPolygonSha256": hashlib.sha256(
            json.dumps(np.array(WATERFALL_FLOW_POLYGON).tolist(), separators=(",", ":")).encode()).hexdigest(),
        "riverFlowTile": "fx/water/river_flow_tile.webp",
        "riverFlowTileSha256": river_tile_sha,
        "riverFlowMask": sw_geometry["riverFlowMask"],
        "lakeShimmerMask": sw_geometry["lakeShimmerMask"],
        "rivers": sw_geometry["rivers"],
        "lakes": sw_geometry["lakes"],
        "confluences": sw_geometry["confluences"],
    }
    (out / "secondary-water.json").write_text(json.dumps(secondary_water_json, indent=2), encoding="utf-8")

    save_alpha_mask((sea.astype(np.uint8) * 255), masks_dir / "sea_mask.webp")
    save_alpha_mask((land.astype(np.uint8) * 255), masks_dir / "land_mask.webp")
    save_alpha_mask((internal_water.astype(np.uint8) * 255), masks_dir / "internal_water_mask.webp")

    coast_px = cv2.distanceTransform(sea.astype(np.uint8), cv2.DIST_L2, 5)
    shallow = np.clip(np.exp(-coast_px / 45.0) * 255, 0, 255).astype(np.uint8)
    shallow[~sea] = 0
    save_alpha_mask(shallow, masks_dir / "shallow_mask.webp")
    foam = (sea & (coast_px <= 20)).astype(np.uint8) * 255
    save_alpha_mask(foam, masks_dir / "foam_mask.webp")
    dist_rgb = np.dstack([
        (np.clip(coast_px / D_MAX, 0, 1) * 255).astype(np.uint8),
        (sea.astype(np.uint8) * 255),
        np.zeros((WORLD_H, WORLD_W), dtype=np.uint8),
    ])
    Image.fromarray(dist_rgb, "RGB").save(masks_dir / "coast_distance.webp", lossless=True, method=4)

    region_ids = np.zeros((WORLD_H, WORLD_W), dtype=np.uint8)
    regions_meta = []
    biome_seeds = []
    paintable = land | internal_water | sea
    for idx, (rid, label, poly) in enumerate(REGION_SPECS, start=1):
        p = np.array(poly, np.int32)
        zone = np.zeros((WORLD_H, WORLD_W), dtype=np.uint8)
        cv2.fillPoly(zone, [p], 255)
        take = (zone > 0) & paintable
        region_ids[take] = idx
        yy, xx = np.nonzero(take)
        meta = {
            "id": rid,
            "index": idx,
            "nameKey": f"world.region.{rid}",
            "label": label,
            "center": [round(float(xx.mean()) / WORLD_W, 4), round(float(yy.mean()) / WORLD_H, 4)] if len(xx) else [0, 0],
            "bounds": {
                "x": int(xx.min()) if len(xx) else 0,
                "y": int(yy.min()) if len(yy) else 0,
                "width": int(xx.max() - xx.min() + 1) if len(xx) else 0,
                "height": int(yy.max() - yy.min() + 1) if len(yy) else 0,
            },
            "areaFraction": round(float(len(xx) / region_ids.size), 4),
        }
        regions_meta.append(meta)
        biome_seeds.append({"id": rid, "index": idx, "label": label, "polygon": poly})

    Image.fromarray(region_ids, mode="L").save(out / "region_ids.png", optimize=True)
    (out / "regions.json").write_text(json.dumps({"size": [WORLD_W, WORLD_H], "regions": regions_meta}, indent=2), encoding="utf-8")
    (out / "biomes.json").write_text(json.dumps({"canvas": {"width": WORLD_W, "height": WORLD_H}, "biomes": regions_meta}, indent=2), encoding="utf-8")
    (out / "biomes.seed.json").write_text(json.dumps({"canvas": {"width": WORLD_W, "height": WORLD_H}, "seeds": biome_seeds}, indent=2), encoding="utf-8")

    rng = np.random.default_rng(int(source_hash[:8], 16))
    land_dist = cv2.distanceTransform(land.astype(np.uint8), cv2.DIST_L2, 5)
    anchors = []
    anchors += scatter(sea & (coast_px <= 10), 18, 150, rng, "coast")
    anchors += scatter(sea & (coast_px >= 80), 14, 220, rng, "sea")
    anchors += scatter(shallow > 40, 10, 190, rng, "shallow")
    anchors += scatter(land & (land_dist >= 50), 10, 250, rng, "land")
    anchors += scatter(internal_water, 8, 220, rng, "internal_water")
    points_payload = {
        "canvas": {"width": WORLD_W, "height": WORLD_H},
        "points": anchors,
        "wonder": [{"x": a["x"], "y": a["y"]} for a in anchors if a["type"] == "sea"],
    }
    (out / "points.json").write_text(json.dumps(points_payload, indent=2), encoding="utf-8")

    # ── Ambient land-life (PLAN-093) ──────────────────────────────────────
    # Anchors must be born from real painted entities (T-07): leaves scatter
    # inside the extracted canopy mask, motes above canopy + candidate land
    # biomes, flutters on meadow/lagoon/bayou land. Seeded like the rest of
    # the pack so every rebuild reproduces the same layout.
    ll_rng = np.random.default_rng(int(source_hash[:16], 16) ^ 0x1EAFF5)
    region_by_index = {idx: rid for idx, (rid, _label, _poly) in enumerate(REGION_SPECS, start=1)}

    def landlife_scatter(zone_mask: np.ndarray, count: int, min_sep: float, prefix: str, radius: float, min_density: float = 0.0) -> list[dict]:
        """Deterministic anchor scatter inside a zone mask, with region attribution
        from `region_ids` and weight = local density of the zone itself.
        `min_density` keeps anchors inside foliage mass, not on thin edge slivers."""
        density = cv2.boxFilter((zone_mask > 0).astype(np.float32), -1, (61, 61), normalize=True)
        ys, xs = np.nonzero(zone_mask)
        order = ll_rng.permutation(len(xs))
        chosen = []
        for i in order:
            x, y = int(xs[i]), int(ys[i])
            if density[y, x] < min_density:
                continue
            if all((x - p["x"]) ** 2 + (y - p["y"]) ** 2 >= min_sep * min_sep for p in chosen):
                chosen.append({
                    "id": f"{prefix}_{len(chosen) + 1:02d}",
                    "x": x,
                    "y": y,
                    "regionId": region_by_index.get(int(region_ids[y, x]), "unassigned"),
                    "type": prefix,
                    "weight": round(float(density[y, x]) + 0.25, 3),
                    "radius": radius,
                })
                if len(chosen) >= count:
                    break
        return chosen

    def region_zone(region_ids_wanted: set[str]) -> np.ndarray:
        zone = np.zeros((WORLD_H, WORLD_W), dtype=np.uint8)
        for rid, _label, poly in REGION_SPECS:
            if rid in region_ids_wanted:
                cv2.fillPoly(zone, [np.array(poly, np.int32)], 255)
        return zone > 0

    mote_zone = (
        (cv2.dilate(canopy_mask.astype(np.uint8), np.ones((25, 25), np.uint8)) > 0)
        | (land & ~foreground & region_zone({"western_forest", "bayou", "central_valley", "coral_lagoon"}))
    )
    flutter_zone = land & ~foreground & region_zone({"coral_lagoon", "central_valley", "bayou"})

    landlife_anchors = (
        landlife_scatter(canopy_mask, 18, 150, "leaf", 58, min_density=0.35)
        + landlife_scatter(mote_zone, 14, 210, "mote", 130)
        + landlife_scatter(flutter_zone, 6, 300, "flutter", 110)
    )
    (out / "land-life-anchors.json").write_text(
        json.dumps({"canvas": {"width": WORLD_W, "height": WORLD_H}, "anchors": landlife_anchors}, indent=2),
        encoding="utf-8",
    )

    landlife_fx_dir = out / "fx" / "land-life"
    landlife_fx_dir.mkdir(parents=True, exist_ok=True)

    # leaf: irregular pointed lens with a midrib — warm green toward amber at
    # the tip, small enough to read as foliage at overview zoom.
    leaf_w, leaf_h = 28, 20
    ly, lx = np.indices((leaf_h, leaf_w))
    lu = (lx / (leaf_w - 1)) * 2 - 1
    lv = (ly / (leaf_h - 1)) * 2 - 1
    leaf_body = np.clip((1 - lu ** 4) ** 0.6 * 0.9 - np.abs(lv + 0.10 * lu), 0, 1) * 6
    leaf_alpha = np.clip(leaf_body * 255, 0, 255)
    leaf_alpha += ll_rng.normal(0, 8, leaf_alpha.shape)
    leaf_alpha = cv2.GaussianBlur(np.clip(leaf_alpha, 0, 245), (0, 0), 0.7)
    midrib = np.exp(-((lv + 0.10 * lu) / 0.10) ** 2) * (leaf_body > 0)
    leaf_rgb = np.dstack([
        np.clip(118 + 80 * (lu + 1) * 0.5 - 34 * midrib, 0, 255),
        np.clip(128 + 44 * (1 - np.abs(lu)) - 26 * midrib, 0, 255),
        np.clip(52 + 18 * (1 - np.abs(lv)) - 10 * midrib, 0, 255),
    ]).astype(np.uint8)
    save_webp_rgba(leaf_rgb, leaf_alpha.astype(np.uint8), landlife_fx_dir / "leaf.webp", quality=90)

    # mote: soft radial speck, pale green-gold — pollen/dust glint.
    mote_s = 24
    my_, mx_ = np.indices((mote_s, mote_s))
    mr = np.sqrt((mx_ - (mote_s - 1) / 2.0) ** 2 + (my_ - (mote_s - 1) / 2.0) ** 2) / ((mote_s - 1) / 2.0)
    mote_alpha = np.clip(175 * np.exp(-((mr / 0.55) ** 2)) + 60 * np.exp(-((mr / 0.9) ** 2)), 0, 200)
    mote_alpha += ll_rng.normal(0, 4, mote_alpha.shape)
    mote_alpha = cv2.GaussianBlur(np.clip(mote_alpha, 0, 200), (0, 0), 0.6)
    mote_rgb = np.dstack([
        np.full(mote_alpha.shape, 226, dtype=np.uint8),
        np.full(mote_alpha.shape, 232, dtype=np.uint8),
        np.full(mote_alpha.shape, 168, dtype=np.uint8),
    ])
    save_webp_rgba(mote_rgb, mote_alpha.astype(np.uint8), landlife_fx_dir / "mote.webp", quality=88)

    # butterfly: two wing lobes + slim body, warm amber-dark silhouette.
    bf_s = 26
    by, bx = np.indices((bf_s, bf_s))
    bu = (bx / (bf_s - 1)) * 2 - 1
    bv = (by / (bf_s - 1)) * 2 - 1
    wing_top = np.exp(-(((np.abs(bu) - 0.42) / 0.30) ** 2 + ((bv + 0.28) / 0.34) ** 2))
    wing_low = np.exp(-(((np.abs(bu) - 0.34) / 0.24) ** 2 + ((bv - 0.34) / 0.26) ** 2)) * 0.8
    body = np.exp(-((bu / 0.10) ** 2 + (bv / 0.6) ** 2))
    bf_alpha = np.clip((wing_top + wing_low) * 210 + body * 160, 0, 235)
    bf_alpha = cv2.GaussianBlur(bf_alpha, (0, 0), 0.8)
    bf_rgb = np.dstack([
        np.full(bf_alpha.shape, 176, dtype=np.uint8),
        np.full(bf_alpha.shape, 118, dtype=np.uint8),
        np.full(bf_alpha.shape, 62, dtype=np.uint8),
    ])
    save_webp_rgba(bf_rgb, bf_alpha.astype(np.uint8), landlife_fx_dir / "butterfly.webp", quality=88)

    landlife_debug = rgb.astype(np.float32)
    for anchor in landlife_anchors:
        color = {"leaf": (255, 210, 40), "mote": (40, 220, 255), "flutter": (255, 80, 200)}[anchor["type"]]
        cv2.circle(landlife_debug, (anchor["x"], anchor["y"]), int(anchor["radius"]), color, 2)
        cv2.circle(landlife_debug, (anchor["x"], anchor["y"]), 4, color, -1)
    Image.fromarray(np.clip(landlife_debug, 0, 255).astype(np.uint8)).save(debug_dir / "land-life-preview.webp", quality=92, method=4)

    cloud_dir = out / "fx" / "clouds"
    cloud_dir.mkdir(parents=True, exist_ok=True)
    cloud_src = cv2.imread(str(Path(args.cloud_source).expanduser().resolve()), cv2.IMREAD_COLOR)
    if cloud_src is None:
        raise SystemExit(f"cloud source not found: {args.cloud_source}")
    cloud_rgb_src = cv2.cvtColor(cloud_src, cv2.COLOR_BGR2RGB)
    border = np.concatenate([
        cloud_rgb_src[:12].reshape(-1, 3), cloud_rgb_src[-12:].reshape(-1, 3),
        cloud_rgb_src[:, :12].reshape(-1, 3), cloud_rgb_src[:, -12:].reshape(-1, 3),
    ])
    cloud_bg = np.median(border, axis=0)
    bg_delta = np.linalg.norm(cloud_rgb_src.astype(np.float32) - cloud_bg, axis=2)
    cloud_mask_src = (bg_delta > 14).astype(np.uint8) * 255
    cloud_mask_src = cv2.morphologyEx(cloud_mask_src, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    cloud_mask_src = cv2.morphologyEx(cloud_mask_src, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    cloud_count, cloud_labels, cloud_stats, _ = cv2.connectedComponentsWithStats(cloud_mask_src, connectivity=8)
    cloud_items = []
    for i in range(1, cloud_count):
        x, y, w, hgt, area = [int(vv) for vv in cloud_stats[i]]
        if area < 1100 or w < 70 or hgt < 35:
            continue
        # Exclude the decorative compass in the lower-right corner of the sheet.
        if x + w > 1240 and y + hgt > 790:
            continue
        cloud_items.append((area, x, y, w, hgt, i))
    cloud_items.sort(key=lambda item: item[0], reverse=True)
    cloud_specs = []
    for i, (area, x, y, w, hgt, component_id) in enumerate(cloud_items[:16], start=1):
        pad = 8
        x0, y0 = max(0, x - pad), max(0, y - pad)
        x1, y1 = min(cloud_rgb_src.shape[1], x + w + pad), min(cloud_rgb_src.shape[0], y + hgt + pad)
        crop_rgb = cloud_rgb_src[y0:y1, x0:x1].astype(np.float32)
        crop_component = (cloud_labels[y0:y1, x0:x1] == component_id).astype(np.uint8)
        # Interior luminosity is painted shading, not a hole: fill enclosed cavities and
        # feather only the outside edge so the sheet cannot peek through the cloud body.
        crop_mask = fill_binary_holes(crop_component).astype(np.float32)
        crop_mask = cv2.GaussianBlur(crop_mask, (0, 0), 2.2)
        crop_mask = np.clip(crop_mask * 1.08, 0, 1)
        # Harmonise the painted cloud toward the mappa2 turquoise sea while keeping its internal modelling.
        luma = crop_rgb.mean(axis=2, keepdims=True)
        cloud_rgb = np.clip(crop_rgb * 0.82 + luma * 0.18 + np.array([4, 22, 24]), 0, 245).astype(np.uint8)
        cloud_name = f"mappa2_cloud_{i:02d}.webp"
        save_webp_rgba(cloud_rgb, np.clip(crop_mask * 245, 0, 245).astype(np.uint8), cloud_dir / cloud_name, quality=90)
        shadow_alpha = cv2.GaussianBlur((crop_mask > 0.12).astype(np.float32), (0, 0), 12)
        shadow_name = f"mappa2_cloud_{i:02d}_shadow.webp"
        save_webp_rgba(np.zeros_like(cloud_rgb), np.clip(shadow_alpha * 110, 0, 110).astype(np.uint8), cloud_dir / shadow_name, quality=88)
        cloud_specs.append({"src": f"fx/clouds/{cloud_name}", "shadowSrc": f"fx/clouds/{shadow_name}", "width": int(w * 0.72)})

    cloud_bands = [
        {"name": "far", "driftSeconds": 2600, "opacity": 0.62, "shadowOpacity": 0.026, "scale": 0.76, "sprites": [
            {**s, "y": 160 + n * 330, "delaySeconds": n * 710} for n, s in enumerate(cloud_specs[:5])]},
        {"name": "mid", "driftSeconds": 1700, "opacity": 0.74, "shadowOpacity": 0.034, "scale": 1.05, "sprites": [
            {**s, "y": 110 + n * 320, "delaySeconds": 220 + n * 560} for n, s in enumerate(cloud_specs[4:9])]},
        {"name": "near", "driftSeconds": 1150, "opacity": 0.92, "shadowOpacity": 0.044, "scale": 1.38, "sprites": [
            {**s, "y": 80 + n * 360, "delaySeconds": 370 + n * 450} for n, s in enumerate(cloud_specs[8:11])]},
    ]

    debug = rgb.copy()
    debug[sea] = (debug[sea] * 0.35 + np.array([30, 130, 220]) * 0.65).astype(np.uint8)
    debug[internal_water] = (debug[internal_water] * 0.35 + np.array([40, 220, 180]) * 0.65).astype(np.uint8)
    debug[foreground] = (debug[foreground] * 0.35 + np.array([255, 90, 30]) * 0.65).astype(np.uint8)
    Image.fromarray(debug, "RGB").save(debug_dir / "segmentation-preview.webp", quality=90, method=4)

    waterfall_debug = rgb.astype(np.float32)
    waterfall_debug = waterfall_debug * (1 - (waterfall_mask[..., None] / 255.0) * 0.55) + np.array([255, 40, 40]) * (waterfall_mask[..., None] / 255.0) * 0.55
    waterfall_debug = waterfall_debug * (1 - (waterfall_impact[..., None] / 255.0) * 0.45) + np.array([255, 80, 255]) * (waterfall_impact[..., None] / 255.0) * 0.45
    waterfall_debug = waterfall_debug * (1 - (waterfall_basin[..., None] / 255.0) * 0.50) + np.array([255, 230, 40]) * (waterfall_basin[..., None] / 255.0) * 0.50
    Image.fromarray(np.clip(waterfall_debug, 0, 255).astype(np.uint8)).save(debug_dir / "waterfall-masks-preview.webp", quality=92, method=4)

    unique_ids = set(np.unique(region_ids).tolist()) - {0}
    gate_failures = []
    if float((land | sea).mean()) < 0.95:
        gate_failures.append("coverage_below_0.95")
    if len(unique_ids) != len(REGION_SPECS):
        gate_failures.append(f"region_ids_{len(unique_ids)}_expected_{len(REGION_SPECS)}")
    if len(canopy_layers) == 0:
        gate_failures.append("no_canopy_layers")
    if len(anchors) < 12:
        gate_failures.append("anchors_below_12")
    if int(np.count_nonzero(waterfall_mask)) < 3000:
        gate_failures.append("waterfall_mask_below_3000px")
    if int(np.count_nonzero(waterfall_basin)) < 8000:
        gate_failures.append("waterfall_basin_below_8000px")
    gate_failures.extend(sw_gate_failures)

    report = {
        "source": str(source),
        "sourceSha256": source_hash,
        "pipelineVersion": args.pipeline_version,
        "maskRevision": args.mask_revision,
        "coverage": {
            "sea": round(float(sea.mean()), 4),
            "land": round(float(land.mean()), 4),
            "internalWater": round(float(internal_water.mean()), 4),
            "foreground": round(float(foreground.mean()), 4),
            "canopy": round(float(canopy_mask.mean()), 4),
            "waterfall": round(float((waterfall_mask > 0).mean()), 5),
            "waterfallImpact": round(float((waterfall_impact > 0).mean()), 5),
            "waterfallBasin": round(float((waterfall_basin > 0).mean()), 5),
            "landPlusSea": round(float(((land | sea)).mean()), 4),
        },
        "canopyLayers": len(canopy_layers),
        "waterfall": {
            "flowPixels": int(np.count_nonzero(waterfall_mask)),
            "impactPixels": int(np.count_nonzero(waterfall_impact)),
            "basinPixels": int(np.count_nonzero(waterfall_basin)),
            "fxFiles": ["fx/waterfall/flow_streaks.webp", "fx/waterfall/mist_blob.webp", "fx/waterfall/ripple_ring.webp"],
        },
        "landLife": {
            "anchors": len(landlife_anchors),
            "fxFiles": ["fx/land-life/leaf.webp", "fx/land-life/mote.webp", "fx/land-life/butterfly.webp"],
        },
        "regions": len(REGION_SPECS),
        "anchors": len(anchors),
        "gate": {"status": "pass" if not gate_failures else "needs_manual_mask", "failures": gate_failures},
        "files": sorted(str(p.relative_to(out)) for p in out.rglob("*") if p.is_file()),
    }
    (out / "pipeline-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    manifest = {
        "version": "1.2.0",
        "world": "mappa2",
        "variant": "base",
        "coordinateSystem": {"space": "world_pixels", "origin": "top_left", "unit": "px", "canvas": {"width": WORLD_W, "height": WORLD_H}},
        "resolutionHint": {"runtime": {"width": WORLD_W, "height": WORLD_H}, "source": {"width": WORLD_W, "height": WORLD_H}, "scaleTarget": 1},
        "assetPolicy": {"resolution": "prefer_hd"},
        "camera": {"minZoom": 0.18, "maxZoom": 3, "defaultZoom": 1, "panEnabled": True, "zoomEnabled": True, "bounds": {"minX": 0, "maxX": WORLD_W, "minY": 0, "maxY": WORLD_H}},
        "renderer": {"mode": "auto", "domObjectThreshold": 50, "enableForParticles": True, "enableForShaders": True, "fallbackToDom": True, "imageFit": "fill", "autoFit": True},
        "surfaceLayers": [
            {"id": "base_flat", "file": "base_flat.webp", "type": "texture", "zIndex": 5, "tags": ["background", "flattened"]},
            {"id": "sea", "file": "Mare.webp", "type": "texture", "zIndex": 10, "tags": ["water"]},
            {"id": "foreground", "file": "Foreground.webp", "type": "texture", "zIndex": 80, "tags": ["foreground"]},
        ],
        "atmosphereLayers": [],
        "visualStates": [{"id": "default", "labelKey": "world.states.default", "base": True, "overrides": []}],
        "regions": [{k: v for k, v in r.items() if k in ("id", "nameKey", "bounds", "tags")} | {"tags": ["biome"]} for r in regions_meta],
        "anchors": [],
        "tags": ["world-map", "mappa2"],
        "pack": {
            "packVersion": 1,
            "packRoot": "/assets/world/mappa2/base/",
            "generator": {"sourceSha256": source_hash, "pipelineVersion": args.pipeline_version, "maskRevision": args.mask_revision},
            "maskFiles": {
                "sea": "masks/sea_mask.webp",
                "land": "masks/land_mask.webp",
                "shallow": "masks/shallow_mask.webp",
                "internalWater": "masks/internal_water_mask.webp",
                "coastDistance": "masks/coast_distance.webp",
                "foam": "masks/foam_mask.webp",
            },
            "anchorFiles": {"points": "points.json"},
            "regionIndex": {"idsFile": "region_ids.png", "metadataFile": "regions.json", "biomesFile": "biomes.json"},
            "waterfall": {
                "flowMask": "masks/waterfall_mask.webp",
                "impactMask": "masks/waterfall_impact_mask.webp",
                "basinMask": "masks/waterfall_basin_mask.webp",
                "flowRect": polygon_rect(WATERFALL_FLOW_POLYGON),
                "impactRect": polygon_rect(WATERFALL_IMPACT_POLYGON),
                "basinRect": polygon_rect(WATERFALL_BASIN_POLYGON),
                "impactPoint": WATERFALL_IMPACT_POINT,
                "lakeMask": "masks/waterfall_lake_mask.webp",
                "lakeRect": polygon_rect(WATERFALL_LAKE_POLYGON),
                "lakePolygon": WATERFALL_LAKE_POLYGON.tolist(),
                "flowPolygon": mask_to_polygon(waterfall_mask),
                "basinPolygon": mask_to_polygon(waterfall_basin),
                "paintedFlowTile": "fx/waterfall/painted_flow_tile.webp",
                "paintedFlowRect": painted_flow_rect,
                "paintedFlowClip": painted_flow_clip,
                "paintedFlowFrames": flip_files,
            },
            "canopyLayers": canopy_layers,
            "cloudBands": cloud_bands,
            "fxAtlases": {"ambientSeaLife": "fx/ambient-sea-life.webp", "ambientLandLife": "fx/ambient-land-life.webp", "ambientWeather": "fx/ambient-weather.webp", "rare": "fx/rare-events.webp", "waterfallFlow": "fx/waterfall/flow_streaks.webp", "waterfallMist": "fx/waterfall/mist_blob.webp", "waterfallRipple": "fx/waterfall/ripple_ring.webp", "landLifeLeaf": "fx/land-life/leaf.webp", "landLifeMote": "fx/land-life/mote.webp", "landLifeFlutter": "fx/land-life/butterfly.webp"},
            "landLife": {
                "anchorsFile": "land-life-anchors.json",
                "maxLeaves": 24,
                "maxMotes": 36,
                "maxFlutters": 10,
            },
            "bootPhases": {
                "manifest": ["manifest.json"],
                "core-paint": ["layers/base_flat.webp", "layers/Mare.webp", "layers/Foreground.webp", "layers/base_flat.nocanopy.webp", "layers/base_flat.clean.webp"],
                "terrain-masks": ["masks/sea_mask.webp", "masks/land_mask.webp", "masks/shallow_mask.webp", "masks/internal_water_mask.webp", "masks/coast_distance.webp", "masks/foam_mask.webp", "masks/waterfall_mask.webp", "masks/waterfall_impact_mask.webp", "masks/waterfall_basin_mask.webp"],
                "ambient": [f"layers/{l['id']}.canopy.webp" for l in canopy_layers] + [s["src"] for b in cloud_bands for s in b["sprites"]] + [s["shadowSrc"] for b in cloud_bands for s in b["sprites"]],
                "ambient-fx": ["fx/ambient-sea-life.webp", "fx/ambient-land-life.webp", "fx/ambient-weather.webp", "fx/waterfall/flow_streaks.webp", "fx/waterfall/mist_blob.webp", "fx/waterfall/ripple_ring.webp", "fx/land-life/leaf.webp", "fx/land-life/mote.webp", "fx/land-life/butterfly.webp"],
                "rare": ["fx/rare-events.webp"],
                "region-hover": ["region_ids.png", "regions.json", "biomes.json"],
            },
        },
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    if gate_failures:
        raise SystemExit("needs_manual_mask: " + ", ".join(gate_failures))
    print(json.dumps({"out": str(out), "sourceSha256": source_hash, "coverage": report["coverage"], "anchors": len(anchors), "canopyLayers": len(canopy_layers)}, indent=2))


if __name__ == "__main__":
    main()
