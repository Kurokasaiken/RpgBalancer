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
    {
        # Director 2026-10-29: the tributary east of the delta, flowing west into it.
        "id": "river_east_tributary", "enabled": True, "tint": "#8fd8e2",
        "insetPx": 2.0, "corridorWidth": 56,
        "centerline": [(1735, 882), (1660, 912), (1590, 927), (1540, 935), (1500, 946), (1472, 968), (1458, 1000)],
        "hsvLo": (66, 45, 55), "hsvHi": (118, 255, 255),
        "exclusions": [],
        "poolGlintAnchors": [],
    },
    {
        # Director 2026-10-29: the short river leaving the falls pool to the east.
        "id": "river_falls_east", "enabled": True, "tint": "#8fd8e2",
        "insetPx": 2.0, "corridorWidth": 36,
        # Downstream runs from the cliff end towards the falls pool (Director: the first guess was reversed).
        "centerline": [(1483, 512), (1505, 517), (1521, 528), (1527, 542), (1519, 556), (1500, 566), (1477, 577), (1450, 585), (1410, 581), (1385, 590)],
        "hsvLo": (66, 45, 55), "hsvHi": (118, 255, 255),
        # Grey reflective stretch fails the blue band; thin forced line so grass/dirt never join the mask.
        "forceWaterLines": [([(1445, 585), (1471, 580), (1482, 571), (1492, 565), (1502, 560), (1511, 551), (1520, 540)], 9)],
        "exclusions": [[(1265, 540), (1335, 540), (1335, 579), (1265, 579)]],
        "poolGlintAnchors": [],
    },
    {
        # Director 2026-10-29: the last reach of the falls-east river, running west into river_central's head.
        "id": "river_falls_link", "enabled": True, "tint": "#8fd8e2",
        "insetPx": 2.0, "corridorWidth": 36,
        "centerline": [(1385, 590), (1362, 599), (1334, 598), (1310, 589), (1286, 590), (1262, 594), (1240, 600)],
        "hsvLo": (66, 45, 55), "hsvHi": (118, 255, 255),
        "exclusions": [[(1265, 540), (1335, 540), (1335, 579), (1265, 579)]],
        "poolGlintAnchors": [],
    },
    {
        # Director 2026-10-29: the river winding between the red mountains, round the canyon marsh.
        "id": "river_red_mountains", "enabled": True, "tint": "#8fd8e2",
        "insetPx": 2.0, "corridorWidth": 40,
        "centerline": [(1737, 737), (1767, 767), (1797, 782), (1837, 782), (1867, 793), (1893, 810), (1893, 830), (1877, 853), (1857, 870), (1830, 873), (1767, 863), (1730, 880), (1680, 890)],
        "hsvLo": (66, 45, 55), "hsvHi": (118, 255, 255),
        "exclusions": [], "poolGlintAnchors": [],
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
     "polygon": None,  # filled below with WATERFALL_LAKE_POLYGON
     "drift": {"toward": (1340, 380), "px": 12.0}},  # feeds the falls lip
    {"id": "lake_canyon_pond", "enabled": True, "insetPx": 2.0, "glintCount": 1,
     "polygon": np.array([(1840, 812), (1895, 812), (1902, 858), (1882, 892), (1835, 882), (1828, 845)], np.int32),
     "drift": {"angleDeg": 90.0, "px": 8.0}},
    {"id": "west_shallows", "enabled": True, "insetPx": 2.0, "glintCount": 4,
     "polygon": np.array([(860, 660), (1030, 656), (1210, 660), (1215, 705), (1030, 710), (865, 700)], np.int32),
     "drift": {"angleDeg": 180.0, "px": 18.0}},  # Director 2026-10-29: the painted streamlets run WEST, not east
    {"id": "lake_bayou_west", "enabled": True, "insetPx": 4.0, "glintCount": 3,
     "polygon": np.array([(1048, 905), (1105, 900), (1115, 960), (1100, 1025), (1050, 1025), (1042, 965)], np.int32),
     "drift": {"angleDeg": 90.0, "px": 8.0}},
    # Estuary pool below the river mouth: the river dives south into the sea (Director 2026-10-29: delta was still).
    {"id": "lake_estuary", "enabled": True, "insetPx": 2.0, "glintCount": 0,
     "polygon": np.array([(1395, 960), (1530, 955), (1540, 1010), (1400, 1015)], np.int32),
     "drift": {"angleDeg": 90.0, "px": 22.0}},
    {"id": "lake_bayou_east", "enabled": True, "insetPx": 4.0, "glintCount": 1,
     "polygon": np.array([(1205, 925), (1265, 920), (1272, 955), (1255, 985), (1210, 980), (1198, 950)], np.int32),
     "drift": {"angleDeg": 0.0, "px": 8.0}},
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
SW_TOTAL_SEG_CAP = 64
SW_MAX_JOINT_DEG = 60.0

# Territories (regions) and biomes are baked by `build-mappa2-territories.py` (PLAN-099) into
# `region_ids.png` / `biome_ids.png`. Regions are gameplay territories; every animation, canopy and
# ambient decision below keys on BIOMES, never on regions.
SHOAL_BIOME_SEA = "sea"  # fallback label when a shoal cell has no biome (never expected)
CANOPY_BLOCKED_BIOMES = {"alpine", "red_badlands", "volcanic"}
LANDLIFE_MOTE_BIOMES = {"temperate_forest", "mangrove_bayou", "tropical_beach", "meadow", "tropical_isles"}
LANDLIFE_FLUTTER_BIOMES = {"meadow", "mangrove_bayou", "tropical_beach", "tropical_isles"}


def load_territory_maps(out: Path) -> dict:
    """Read the maps `build-mappa2-territories.py` wrote. Fails loudly instead of inventing territories."""
    needed = [out / n for n in ("region_ids.png", "biome_ids.png", "regions.json", "biomes.json")]
    missing = [str(n) for n in needed if not n.exists()]
    if missing:
        raise SystemExit(f"missing territory maps {missing}: run scripts/build-mappa2-territories.py first")
    region_ids = np.array(Image.open(out / "region_ids.png"))
    biome_ids = np.array(Image.open(out / "biome_ids.png"))
    regions = json.loads((out / "regions.json").read_text(encoding="utf-8"))["regions"]
    biomes = json.loads((out / "biomes.json").read_text(encoding="utf-8"))["biomes"]
    if region_ids.shape != (WORLD_H, WORLD_W) or biome_ids.shape != (WORLD_H, WORLD_W):
        raise SystemExit("territory maps do not match the world canvas")
    return {
        "region_ids": region_ids,
        "biome_ids": biome_ids,
        "regions": regions,
        "biomes": biomes,
        "biome_name": {b["index"]: b["id"] for b in biomes},
        "biome_index": {b["id"]: b["index"] for b in biomes},
    }


def biome_mask(biome_ids: np.ndarray, biome_index: dict[str, int], wanted: set[str]) -> np.ndarray:
    return np.isin(biome_ids, [biome_index[b] for b in wanted])


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
        # Painted water that reads grey/neutral (reflective stretch) fails the blue HSV band:
        # author a polygon that forces it in (still clipped to the corridor).
        for pts_f, width_f in spec.get("forceWaterLines", []):
            feature_class |= (_stroke_polyline(shape, pts_f, width_f) > 0) & corridor & ~exclusion
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
        "riverClassMasks": river_class_masks,
        "lakeClassMasks": lake_class_masks,
    }


WATER_POSE_N = 8


# --- PLAN-094 ambient director: shoal zones + route schema v0 -------------
SHOAL_CELL_PX = 64
SHOAL_COAST_MIN = 85.0          # 1.5 x maxRadius (55) + margin
SHOAL_COAST_MAX = 160.0
SHOAL_MIN_COVERAGE = 0.9
SHOAL_POISSON_PX = 300.0
SHOAL_MAX_RADIUS = 55.0
SHOAL_MAX_TRAVEL = 96.0
SHOAL_ALPHA = 0.22
SHOAL_LSTAR_MIN = 2.0           # perceived |deltaL*| below -> zone "invisible"
SHOAL_LSTAR_MAX = 6.0           # above -> zone "tooLoud" (stain/inversion)
# Director 2026-10-29: shoal = dark "underwater shadow" readable ONLY on the
# light turquoise water — zones gate on turquoise coverage, tint is the
# sampled deep-blue (15,91,115), not a contrast-row pick.
SHOAL_TURQ_MIN = 0.5            # min fraction of cell in the turquoise class
SHOAL_TINT_ROWS = [
    {"id": "deepTeal", "lStar": 28.0},
    {"id": "shallowTeal", "lStar": 24.0},
    {"id": "slate", "lStar": 32.0},
    {"id": "paleTeal", "lStar": 36.0},
]
ROUTE_SCHEMA_VERSION = 0  # experimental — not emitted to manifest until ships


def _lstar_image(rgb: np.ndarray) -> np.ndarray:
    """CIE L* (0-100) per pixel."""
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    return lab[:, :, 0] * (100.0 / 255.0)


def validate_routes(routes: list[dict], sea: np.ndarray, land: np.ndarray,
                    internal_water: np.ndarray, coast_px: np.ndarray,
                    sample_step_px: float = 4.0) -> list[dict]:
    """PLAN-094 route schema v0 offline validator. Every sampled point of a
    route polyline — plus its +/-widthPx/2 corridor offsets — must lie on sea
    mask and outside land/internal_water; coast_px must clear clearancePx
    except within endpoint slack. Returns per-route {id, ok, failures[]}."""
    results = []
    for r in routes:
        pts = [tuple(p) for p in r["polyline"]]
        wid = float(r.get("widthPx", 24))
        clear = float(r.get("clearancePx", 40))
        slack = float(r.get("endpointSlackPx", 60))
        fails: list[str] = []
        samples: list[tuple[float, float]] = []
        for i in range(len(pts) - 1):
            ax, ay = pts[i]; bx, by = pts[i + 1]
            seg = float(np.hypot(bx - ax, by - ay))
            n = max(2, int(seg / sample_step_px) + 1)
            for k in range(n):
                t = k / (n - 1)
                samples.append((ax + (bx - ax) * t, ay + (by - ay) * t))
        def inside(m, x, y):
            xi, yi = int(round(x)), int(round(y))
            return 0 <= xi < WORLD_W and 0 <= yi < WORLD_H and m[yi, xi]
        # self-intersection (non-adjacent segment pairs)
        def seg_hit(a, b, c, d):
            def ccw(p, q, r):
                return (r[1] - p[1]) * (q[0] - p[0]) > (q[1] - p[1]) * (r[0] - p[0])
            return ccw(a, c, d) != ccw(b, c, d) and ccw(a, b, c) != ccw(a, b, d)
        for i in range(len(pts) - 1):
            for j in range(i + 2, len(pts) - 1):
                if seg_hit(pts[i], pts[i + 1], pts[j], pts[j + 1]):
                    fails.append(f"self_intersection_{i}_{j}")
        for idx, (x, y) in enumerate(samples):
            if not inside(sea, x, y):
                fails.append(f"off_sea@{x:.0f},{y:.0f}"); continue
            if inside(land, x, y) or inside(internal_water, x, y):
                fails.append(f"on_land_or_internal@{x:.0f},{y:.0f}")
            # corridor offsets along local normal
            near_end = min(idx, len(samples) - 1 - idx) * sample_step_px <= slack
            if idx + 1 < len(samples):
                dx, dy = samples[idx + 1][0] - x, samples[idx + 1][1] - y
                ln = float(np.hypot(dx, dy)) or 1.0
                nx, ny = -dy / ln, dx / ln
                for sgn in (1, -1):
                    ox, oy = x + nx * sgn * wid / 2.0, y + ny * sgn * wid / 2.0
                    if not inside(sea, ox, oy):
                        fails.append(f"corridor_off_sea@{ox:.0f},{oy:.0f}")
            xi, yi = int(round(x)), int(round(y))
            if not near_end and coast_px[yi, xi] < clear:
                fails.append(f"clearance@{x:.0f},{y:.0f}:{coast_px[yi, xi]:.0f}px")
        # min curvature radius via discrete turn angle
        for i in range(1, len(pts) - 1):
            a = np.array(pts[i - 1], float); b = np.array(pts[i], float); c = np.array(pts[i + 1], float)
            v1, v2 = b - a, c - b
            n1, n2 = np.hypot(*v1), np.hypot(*v2)
            if n1 > 0 and n2 > 0:
                ang = float(np.degrees(np.arccos(np.clip(np.dot(v1, v2) / (n1 * n2), -1, 1))))
                radius = min(n1, n2) / (2 * np.sin(np.radians(ang) / 2)) if ang > 1 else 1e6
                if radius < 120.0:
                    fails.append(f"curvature@{b[0]:.0f},{b[1]:.0f}:r{radius:.0f}px")
        results.append({"id": r.get("id", f"route_{len(results)}"), "ok": not fails,
                        "failures": fails[:24], "samples": len(samples)})
    return results


def build_ambient_director(*, rgb: np.ndarray, sea: np.ndarray, land: np.ndarray,
                           internal_water: np.ndarray, shallow: np.ndarray,
                           coast_px: np.ndarray, foam: np.ndarray,
                           exclusion_masks: dict[str, np.ndarray],
                           confluences: list[dict], source_hash: str,
                           debug_dir: Path, biome_ids: np.ndarray, biome_name: dict[int, str],
                           lstar: np.ndarray | None = None) -> dict:
    """PLAN-094: bake shoal spawn zones + exclusion list + maskDigest.
    Returns {"json": ambient-director payload, "report": per-zone report,
    "zonesMask": uint8 mask, "failures": [str]}."""
    rng = np.random.default_rng(
        int(hashlib.sha256(str(source_hash).encode()).hexdigest()[:16], 16) ^ 0xA4B1E)
    lstar = lstar if lstar is not None else _lstar_image(rgb)
    shape = (WORLD_H, WORLD_W)
    # shallow_mask is a soft gradient (exp decay from coast): it is the zone
    # WEIGHT, never a binary gate — coverage is measured on sea_mask, since
    # the coast band [85,160] sits where shallow has already decayed <127.
    sea_bin = sea > 0
    # Shoal domain (Director 2026-10-29): the shoal reads as a dark underwater
    # shadow ONLY on the light turquoise water — zones require SHOAL_TURQ_MIN
    # coverage of sea pixels in the light-teal HSV band.
    _hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    turquoise = sea_bin & (lstar >= 50.0) & (_hsv[:, :, 0] >= 75) & (_hsv[:, :, 0] <= 105) & (_hsv[:, :, 1] >= 50)

    # exclusion union: dilated foam + waterfall/river masks + confluence buffers
    excl = np.zeros(shape, dtype=bool)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (49, 49))
    excl |= cv2.dilate((foam > 0).astype(np.uint8), kernel) > 0
    excl_reasons: list[dict] = [{"type": "foam", "dilatePx": 24}]
    for name, m in exclusion_masks.items():
        if m is None:
            continue
        em = cv2.dilate((m > 0).astype(np.uint8), kernel) > 0
        excl |= em
        excl_reasons.append({"type": name, "dilatePx": 24})
    for c in confluences:
        cm = np.zeros(shape, dtype=np.uint8)
        cv2.circle(cm, (c["x"], c["y"]), 40, 255, -1)
        excl |= cm > 0
    excl_reasons.append({"type": "confluences", "bufferPx": 40, "count": len(confluences)})

    coast_grad_y, coast_grad_x = np.gradient(coast_px.astype(np.float32))

    candidates: list[dict] = []
    rejected: list[dict] = []
    half = SHOAL_CELL_PX // 2
    for y0 in range(0, WORLD_H, SHOAL_CELL_PX):
        for x0 in range(0, WORLD_W, SHOAL_CELL_PX):
            cx, cy = x0 + half, y0 + half
            cell = (slice(y0, y0 + SHOAL_CELL_PX), slice(x0, x0 + SHOAL_CELL_PX))
            zone_id = f"shoal-z-{cx // 160}-{cy // 160}"
            cov = float(np.count_nonzero(sea_bin[cell])) / (SHOAL_CELL_PX * SHOAL_CELL_PX)
            if cov < SHOAL_MIN_COVERAGE:
                rejected.append({"zone": zone_id, "reason": "coverage", "coverage": round(cov, 3)})
                continue
            cd = float(coast_px[cell].mean())
            if not (SHOAL_COAST_MIN <= cd <= SHOAL_COAST_MAX):
                rejected.append({"zone": zone_id, "reason": "coastBand", "coastPx": round(cd, 1)})
                continue
            if excl[cy, cx] or float(np.count_nonzero(excl[cell])) > 0.10 * SHOAL_CELL_PX * SHOAL_CELL_PX:
                rejected.append({"zone": zone_id, "reason": "excluded"})
                continue
            biome = biome_name.get(int(biome_ids[cy, cx]), SHOAL_BIOME_SEA)
            # heading = seaward (increasing coast distance), fallback tangential
            gx, gy = float(coast_grad_x[cy, cx]), float(coast_grad_y[cy, cx])
            n = float(np.hypot(gx, gy))
            hx, hy = (gx / n, gy / n) if n > 1e-4 else (1.0, 0.0)
            # swept-footprint validation: capsule of radius maxRadius along
            # heading*maxTravel; every perimeter point must stay sea & shallow
            # (the 1.5x soft-falloff margin is already baked in coastDistMin).
            ok = True
            r_foot = SHOAL_MAX_RADIUS
            for t in np.linspace(0.0, SHOAL_MAX_TRAVEL, 9):
                sx, sy = cx + hx * t, cy + hy * t
                for ang in np.linspace(0.0, 2 * np.pi, 8, endpoint=False):
                    xi = int(round(sx + np.cos(ang) * r_foot))
                    yi = int(round(sy + np.sin(ang) * r_foot))
                    if not (0 <= xi < WORLD_W and 0 <= yi < WORLD_H and sea_bin[yi, xi] and shallow[yi, xi] > 0):
                        ok = False
                        break
                if not ok:
                    break
            if not ok:
                rejected.append({"zone": zone_id, "reason": "sweptFootprint"})
                continue
            paint_l = float(lstar[cell].mean())
            turq_cov = float(np.count_nonzero(turquoise[cell])) / (SHOAL_CELL_PX * SHOAL_CELL_PX)
            if turq_cov < SHOAL_TURQ_MIN:
                rejected.append({"zone": zone_id, "reason": "notTurquoise", "turq": round(turq_cov, 2)})
                continue
            candidates.append({
                "id": zone_id, "family": "shoal", "biome": biome,
                "cell": SHOAL_CELL_PX, "cells": [[cx, cy, round(cov, 3)]],
                "heading": [round(hx, 3), round(hy, 3)], "maxTravelPx": SHOAL_MAX_TRAVEL,
                "coastPx": round(cd, 1), "paintL": round(paint_l, 1),
                "tintRow": "deepTeal", "deltaL": round(SHOAL_ALPHA * abs(paint_l - 28.0), 2),
            })

    # deterministic Poisson repulsion: seeded order, greedy keep >=300px
    order = rng.permutation(len(candidates))
    zones: list[dict] = []
    for i in order:
        z = candidates[i]
        cx, cy = z["cells"][0][0], z["cells"][0][1]
        if all((cx - q["cells"][0][0]) ** 2 + (cy - q["cells"][0][1]) ** 2 >= SHOAL_POISSON_PX ** 2
               for q in zones):
            zones.append(z)
    zones.sort(key=lambda z: z["id"])
    zones_mask = np.zeros(shape, dtype=np.uint8)
    for z in zones:
        cv2.rectangle(zones_mask, (z["cells"][0][0] - half, z["cells"][0][1] - half),
                      (z["cells"][0][0] + half, z["cells"][0][1] + half), 255, 1)

    mask_files = ["masks/sea_mask.webp", "masks/land_mask.webp", "masks/shallow_mask.webp",
                  "masks/coast_distance.webp", "masks/foam_mask.webp",
                  "masks/internal_water_mask.webp", "masks/river_flow_mask.webp",
                  "masks/waterfall_mask.webp"]
    digest_src = b"".join((debug_dir.parent / f).read_bytes()
                          for f in mask_files if (debug_dir.parent / f).exists())
    payload = {
        "version": 1, "canvas": [WORLD_W, WORLD_H], "seed": "mappa2-v1",
        "maskDigest": hashlib.sha256(digest_src).hexdigest(),
        "constants": {
            "cellPx": SHOAL_CELL_PX, "coastPx": [SHOAL_COAST_MIN, SHOAL_COAST_MAX],
            "poissonPx": SHOAL_POISSON_PX, "maxRadiusPx": SHOAL_MAX_RADIUS,
            "maxTravelPx": SHOAL_MAX_TRAVEL, "alpha": SHOAL_ALPHA,
            "deltaLBand": [SHOAL_LSTAR_MIN, SHOAL_LSTAR_MAX],
            "tintRows": SHOAL_TINT_ROWS,
        },
        "zones": zones,
        "exclusions": excl_reasons,
        "routes": [],  # schema v0: not emitted to manifest until ships (slice 2)
        "generatedFrom": {"sourceSha256": source_hash, "artifact": "ambient-director artifact-r003"},
    }
    report = {"accepted": zones, "rejected": rejected,
              "acceptedCount": len(zones), "rejectedCount": len(rejected)}
    dbg = rgb.copy()
    dbg[zones_mask > 0] = np.clip(dbg[zones_mask > 0].astype(np.int16) + [0, 90, 40], 0, 255).astype(np.uint8)
    Image.fromarray(dbg).save(debug_dir / "ambient-director-preview.webp", quality=90, method=4)
    return {"json": payload, "report": report, "zonesMask": zones_mask,
            "failures": [] if zones else ["no_shoal_zones_accepted"]}


def build_shoal_atlas(out_path: Path, source_hash: str) -> dict:
    """PLAN-094: procedural ambient-sealife atlas 512x256 — 4 tint rows x
    3 blob variants (128x64 cells, rightmost column reserved). Seeded
    gaussian blobs + low-freq noise + blue-noise dither."""
    rng = np.random.default_rng(
        int(hashlib.sha256(str(source_hash).encode()).hexdigest()[:16], 16) ^ 0x5EAF)
    tints = {"deepTeal": (15, 91, 115), "shallowTeal": (10, 72, 96),
             "slate": (22, 110, 130), "paleTeal": (30, 128, 138)}
    canvas_rgb = np.zeros((256, 512, 3), dtype=np.uint8)
    canvas_a = np.zeros((256, 512), dtype=np.uint8)
    for row, rw in enumerate(SHOAL_TINT_ROWS):
        rgb_t = tints[rw["id"]]
        for col in range(3):
            yy, xx = np.mgrid[0:64, 0:128].astype(np.float32)
            cx, cy = 64.0 + rng.uniform(-8, 8), 32.0 + rng.uniform(-4, 4)
            sx, sy = rng.uniform(34, 48), rng.uniform(16, 24)
            base = np.exp(-(((xx - cx) / sx) ** 2 + ((yy - cy) / sy) ** 2))
            noise = cv2.resize(rng.uniform(0.7, 1.3, (8, 16)).astype(np.float32), (128, 64))
            noise = cv2.GaussianBlur(noise, (0, 0), 2.0)
            alpha = np.clip(base * noise * 235, 0, 255)
            alpha += rng.integers(-1, 2, alpha.shape).astype(np.float32)  # dither
            alpha = np.clip(alpha, 0, 255).astype(np.uint8)
            y0, x0 = row * 64, col * 128
            canvas_rgb[y0:y0 + 64, x0:x0 + 128] = rgb_t
            canvas_a[y0:y0 + 64, x0:x0 + 128] = alpha
    out_path.parent.mkdir(parents=True, exist_ok=True)
    save_webp_rgba_lossless(canvas_rgb, canvas_a, out_path)
    sha = hashlib.sha256(out_path.read_bytes()).hexdigest()
    return {"file": f"fx/ambient-sea-life.webp", "sha256": sha,
            "layout": {"rows": [r["id"] for r in SHOAL_TINT_ROWS], "cols": ["blob_a", "blob_b", "blob_c", "reserved"],
                       "cell": [128, 64], "frames": 12}}


def build_water_flow_poses(
    rgb: np.ndarray, class_mask: np.ndarray, flow_dir: np.ndarray, disp_px: float,
    out_dir: Path, prefix: str, seed: int, pad: int = 6,
) -> dict | None:
    """PLAN-095 v2 (Director 2026-10-29, same recipe as the falls flipbook):
    painted cinemagraph poses for one river/lake. The low-frequency painting
    (banks, shading) never moves; only its fine painted detail flows along
    `flow_dir` (unit vectors, HxW x2), flow-map style — two phases half a
    cycle apart, each faded out before it resets. Faster mid-channel, slower
    at the banks, per-region speed/phase noise so nothing moves as a strip.
    RGBA poses: alpha = feathered class mask, so at rest a pose IS the
    painting and the runtime needs no clip mask."""
    ys, xs = np.where(class_mask)
    if ys.size == 0:
        return None
    y0, y1 = max(0, int(ys.min()) - pad), min(WORLD_H, int(ys.max()) + pad + 1)
    x0, x1 = max(0, int(xs.min()) - pad), min(WORLD_W, int(xs.max()) + pad + 1)
    h, w = y1 - y0, x1 - x0
    src = rgb[y0:y1, x0:x1].astype(np.float32)
    m = class_mask[y0:y1, x0:x1].astype(np.uint8)
    low = cv2.GaussianBlur(src, (0, 0), 3.0)
    detail = src - low
    # flowing detail is drawn only from the water itself: bank texture never smears in
    src_gate = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.0)
    # Flat painted water (lake centres, estuary) has no detail to carry: add fine anisotropic
    # luminance streaks (stretched along the flow) so the whole surface moves, not only the rims.
    srng = np.random.default_rng(seed + 7)
    synth = cv2.GaussianBlur(srng.standard_normal((h, w)).astype(np.float32), (0, 0), 1.3)
    synth = synth - cv2.GaussianBlur(synth, (0, 0), 5.0)
    synth = synth / (np.abs(synth).max() + 1e-6) * 14.0
    detail = detail + synth[..., None]
    # Warm (brown/sand/orange) pixels are bank, never water: they neither flow nor get replaced by a pose.
    warm = np.clip((cv2.GaussianBlur(src[..., 0] - src[..., 2], (0, 0), 1.0) - 22.0) / 23.0, 0.0, 1.0)
    src_gate = src_gate * (1.0 - warm)
    flow_src = detail * src_gate[..., None]
    alpha = cv2.GaussianBlur(cv2.erode(m, np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), 1.2)
    alpha = alpha * (1.0 - warm)
    dt = cv2.distanceTransform(m, cv2.DIST_L2, 3)
    mid = np.clip(dt / max(1.0, float(np.percentile(dt[m > 0], 90))), 0, 1)
    rng = np.random.default_rng(seed)

    def noise(sigma: float) -> np.ndarray:
        n = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), sigma)
        return n / (np.abs(n).max() + 1e-6)

    speed = disp_px * (0.45 + 0.55 * mid) * (1.0 + 0.35 * noise(6.0)) * alpha
    phase = noise(14.0) * 0.5 + 0.5
    fd = flow_dir[y0:y1, x0:x1]
    dx, dy = fd[..., 0] * speed, fd[..., 1] * speed
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))

    def layer(ph: np.ndarray) -> np.ndarray:
        return cv2.remap(flow_src, (gx - dx * ph).astype(np.float32), (gy - dy * ph).astype(np.float32),
                         cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    frames = []
    for k in range(WATER_POSE_N):
        pa = (k / WATER_POSE_N + phase) % 1.0
        pb = (pa + 0.5) % 1.0
        wa = 1.0 - np.abs(2.0 * pa - 1.0)
        wb = 1.0 - wa
        # boost mid-fade contrast only where the two phases are displaced apart
        norm = 1.0 + (np.sqrt(wa ** 2 + wb ** 2) - 1.0) * np.clip(speed / 6.0, 0, 1)
        mix = (layer(pa) * wa[..., None] + layer(pb) * wb[..., None]) / norm[..., None]
        pose = low + detail * (1 - src_gate[..., None]) + mix
        name = f"{prefix}_f{k}.webp"
        save_webp_rgba(np.clip(pose, 0, 255).astype(np.uint8),
                       np.clip(alpha * 255, 0, 255).astype(np.uint8), out_dir / name, quality=90)
        frames.append(f"fx/water/{name}")
    return {"frames": frames, "rect": {"x": x0, "y": y0, "width": w, "height": h}}


def polyline_flow_field(points: list[tuple[int, int]]) -> np.ndarray:
    """Unit downstream tangent of the nearest centerline leg, for every world px
    (labelled distance transform over the rasterized polyline), smoothed."""
    tangent = np.zeros((WORLD_H, WORLD_W, 2), np.float32)
    line = np.full((WORLD_H, WORLD_W), 255, np.uint8)
    for (ax, ay), (bx, by) in zip(points[:-1], points[1:]):
        v = np.array([bx - ax, by - ay], np.float32)
        v /= max(1e-6, float(np.hypot(*v)))
        seg = np.zeros((WORLD_H, WORLD_W), np.uint8)
        cv2.line(seg, (ax, ay), (bx, by), 1, 1, cv2.LINE_8)
        tangent[seg > 0] = v
        line[seg > 0] = 0
    _, labels = cv2.distanceTransformWithLabels(line, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    zy, zx = np.where(line == 0)
    by_label = np.zeros((int(labels.max()) + 1, 2), np.float32)
    by_label[labels[zy, zx]] = tangent[zy, zx]
    field = cv2.GaussianBlur(by_label[labels], (0, 0), 6.0)
    return field / np.maximum(1e-6, np.linalg.norm(field, axis=2, keepdims=True))


def drift_flow_field(drift: dict) -> np.ndarray:
    """Lake surface drift: toward a point (outflow) or along a fixed angle."""
    if "toward" in drift:
        tx, ty = drift["toward"]
        gx, gy = np.meshgrid(np.arange(WORLD_W, dtype=np.float32), np.arange(WORLD_H, dtype=np.float32))
        field = np.dstack([tx - gx, ty - gy])
        return field / np.maximum(1e-6, np.linalg.norm(field, axis=2, keepdims=True))
    a = np.deg2rad(drift["angleDeg"])
    field = np.empty((WORLD_H, WORLD_W, 2), np.float32)
    field[..., 0], field[..., 1] = np.cos(a), np.sin(a)
    return field



# --- PLAN-098: regional weather anchors (mist + embers v1) -----------------
WEATHER_DRIFT_MAX = {"mist": 6, "ember": 12, "volcano": 90}
WEATHER_MIN_REACH = {"mist": 12, "ember": 14}
WEATHER_MIN_RADIUS = {"mist": 5, "ember": 5}
WEATHER_MIN_SPACING = {"mist": 40.0, "ember": 45.0}
WEATHER_SEED = 97421


def _weather_domain(kind: str, *, sea, land, internal_water, biome_ids, bidx):
    """PLAN-098 + PLAN-099 re-key: eligible domain per family, BIOME-keyed."""
    if kind == "mist":
        return biome_mask(biome_ids, bidx, {"mangrove_bayou", "coral_reef", "shallow_waters"}) & internal_water
    if kind == "ember":
        return biome_mask(biome_ids, bidx, {"volcanic"}) & land & ~sea
    raise ValueError(kind)


def build_weather_anchors(*, sea, land, internal_water, biome_ids, bidx,
                          source_hash: str, debug_dir: Path, out: Path) -> dict:
    """Emit weather-anchors.json (leaf contract) + debug preview. Mist+embers
    only for v1; dust/glint caps pinned at 0 (stretch families)."""
    rng = np.random.default_rng(WEATHER_SEED)
    anchors, rejected = [], []
    # The painting has no volcano: the Director picked the tall dark southern peak (apex ~ (1754,982),
    # 2026-10-29 «cima 1»); the crater glow, lava veins and the smoke plume are all runtime.
    VOLCANO_VENTS = [(1754, 982, 26.0)]
    for vi, (vx, vy, vr) in enumerate(VOLCANO_VENTS):
        anchors.append({"id": f"volcano_{vi+1:02d}", "type": "volcano", "x": vx, "y": vy,
                        "radius": vr, "reach": vr + 90.0,
                        "weight": 1.0 if vi == 0 else 0.6,
                        "phase": round(float(rng.random()), 4)})
    # ── orographic cloud bank + snow glints (Director second-slice 2026-10-29):
    # one bank anchor per alpine massif >=3000px (peak-reach point + coverage
    # radius); glints scattered on alpine land at wide spacing.
    alpine = biome_mask(biome_ids, bidx, {"alpine"}) & land & ~sea
    n_m, lab_m, stats_m, cent_m = cv2.connectedComponentsWithStats(alpine.astype(np.uint8))
    oi = 0
    for i in sorted(range(1, n_m), key=lambda k: -stats_m[k, 4]):
        if stats_m[i, 4] < 3000 or oi >= 6:
            break
        oi += 1
        comp = lab_m == i
        rr = cv2.distanceTransform(comp.astype(np.uint8), cv2.DIST_L2, 5)
        my, mx = np.unravel_index(int(np.argmax(rr)), rr.shape)
        cov = min(330.0, float(np.sqrt(stats_m[i, 4]) * 1.55))
        anchors.append({"id": f"orographic_{oi:02d}", "type": "orographic",
                        "x": int(mx), "y": int(my), "radius": round(cov * 0.35, 1),
                        "reach": round(cov, 1), "weight": round(min(1.0, stats_m[i, 4] / 90000.0), 3),
                        "phase": round(float(rng.random()), 4)})
    gi = 0
    g_reach = cv2.distanceTransform(alpine.astype(np.uint8), cv2.DIST_L2, 5)
    gys, gxs = np.nonzero(alpine)
    for i in rng.permutation(len(gxs)):
        x, y = int(gxs[i]), int(gys[i])
        r = float(g_reach[y, x])
        if r < 8 or gi >= 14:
            if gi >= 14:
                break
            continue
        if any((x - a["x"]) ** 2 + (y - a["y"]) ** 2 < 110.0 * 110.0 for a in anchors if a["type"] == "glint"):
            continue
        gi += 1
        anchors.append({"id": f"glint_{gi:02d}", "type": "glint", "x": x, "y": y,
                        "radius": round(min(24.0, max(2.0, r - 8.0)), 1), "reach": round(r, 1),
                        "weight": 1.0, "phase": round(float(rng.random()), 4)})
    caps = {"mist": 16, "ember": 0, "volcano": 16}
    for kind, cap in (("mist", caps["mist"]),):
        domain = _weather_domain(kind, sea=sea, land=land, internal_water=internal_water,
                                 biome_ids=biome_ids, bidx=bidx)
        reach = cv2.distanceTransform(domain.astype(np.uint8), cv2.DIST_L2, 5)
        ys, xs = np.nonzero(domain)
        order = rng.permutation(len(xs))
        picked = []
        if kind == "ember":
            # Coverage-first: top-reach candidate per coarse grid cell of the
            # domain bbox — volcanic spans massif + SE isles and a depth-only
            # scatter strands every anchor on the deepest block (the isles),
            # leaving the visible massif bare (Director eye-check 2026-10-29).
            gx0, gy0 = xs.min(), ys.min()
            gw = max(1, (xs.max() - gx0 + 1) // 4)
            gh = max(1, (ys.max() - gy0 + 1) // 3)
            cells: dict[tuple[int, int], list[int]] = {}
            for i in order:
                cells.setdefault(((xs[i] - gx0) // gw, (ys[i] - gy0) // gh), []).append(i)
            cells = dict(sorted(cells.items()))
            for cell, idxs in cells.items():
                best = max(idxs, key=lambda i: (reach[ys[i], xs[i]], -i))
                x, y = int(xs[best]), int(ys[best])
                r = float(reach[y, x])
                if r < WEATHER_MIN_REACH[kind]:
                    continue
                radius = min(90.0, r - WEATHER_DRIFT_MAX[kind])
                if radius < WEATHER_MIN_RADIUS[kind]:
                    continue
                sp = WEATHER_MIN_SPACING[kind]
                if any((x - a["x"]) ** 2 + (y - a["y"]) ** 2 < sp * sp for a in picked):
                    continue
                picked.append({"id": f"ember_{len(picked)+1:02d}", "type": kind, "x": x, "y": y,
                               "radius": round(radius, 1), "reach": round(r, 1),
                               "weight": round(min(1.0, r / 180.0), 3), "phase": round(float(rng.random()), 4)})
                if len(picked) >= cap:
                    break
        else:
            for i in order:
                x, y = int(xs[i]), int(ys[i])
                r = float(reach[y, x])
                if r < WEATHER_MIN_REACH[kind]:
                    continue
                radius = r - WEATHER_DRIFT_MAX[kind]
                if radius < WEATHER_MIN_RADIUS[kind]:
                    continue
                radius = min(120.0, radius)
                sp = WEATHER_MIN_SPACING[kind]
                if any((x - a["x"]) ** 2 + (y - a["y"]) ** 2 < sp * sp for a in picked):
                    continue
                picked.append({"id": f"{kind}_{len(picked)+1:02d}", "type": kind, "x": x, "y": y,
                               "radius": round(radius, 1), "reach": round(r, 1),
                               "weight": round(min(1.0, r / 180.0), 3), "phase": round(float(rng.random()), 4)})
                if len(picked) >= cap:
                    break
        anchors += picked
        rejected += [{"type": kind, "count_domain_px": int(domain.sum()), "accepted": len(picked)}]
    payload = {
        "schemaVersion": 1, "seed": WEATHER_SEED,
        "canvas": {"width": WORLD_W, "height": WORLD_H},
        "caps": {"mist": caps["mist"], "embers": 0, "volcano": caps["volcano"],
                 "orographic": 12, "glints": 14, "dust": 0},
        "thresholds": {"minReach": {"mist": WEATHER_MIN_REACH["mist"], "ember": WEATHER_MIN_REACH["ember"], "volcano": 40, "orographic": 40, "dust": 40, "glint": 8},
                       "minSpacing": {"mist": WEATHER_MIN_SPACING["mist"], "ember": WEATHER_MIN_SPACING["ember"], "volcano": 60.0, "orographic": 60.0, "dust": 60.0, "glint": 110.0},
                       "shorelineMargin": 24,
                       "driftMax": {"mist": WEATHER_DRIFT_MAX["mist"], "ember": WEATHER_DRIFT_MAX["ember"], "volcano": WEATHER_DRIFT_MAX["volcano"], "orographic": 24, "dust": 30, "glint": 0}},
        "generatedFrom": {"sourceSha256": source_hash, "artifact": "PLAN-098 v1 mist+embers (biome-keyed)"},
        "anchors": sorted(anchors, key=lambda a: a["id"]),
    }
    (out / "weather-anchors.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    # debug preview: domain tint + accepted markers
    dbg = np.zeros((WORLD_H, WORLD_W, 3), np.uint8)
    dbg[_weather_domain("mist", sea=sea, land=land, internal_water=internal_water,
                        biome_ids=biome_ids, bidx=bidx)] = (140, 160, 255)
    dbg[_weather_domain("ember", sea=sea, land=land, internal_water=internal_water,
                        biome_ids=biome_ids, bidx=bidx)] = (255, 120, 40)
    for a in anchors:
        c = (255, 255, 255) if a["type"] == "mist" else (255, 200, 0)
        cv2.circle(dbg, (a["x"], a["y"]), int(a["radius"]), c, 2)
        cv2.circle(dbg, (a["x"], a["y"]), int(a["reach"]), tuple(v // 2 for v in c), 1)
        cv2.circle(dbg, (a["x"], a["y"]), 4, (255, 0, 255), -1)
    Image.fromarray(dbg, "RGB").save(debug_dir / "weather-anchors-preview.webp", quality=90, method=4)
    return {"payload": payload, "report": rejected}


def build_weather_textures(out_fx: Path, debug_dir: Path) -> dict:
    """fx/weather/{mist_blob,ash,ember}.webp — deterministic procedural sprites."""
    out_fx.mkdir(parents=True, exist_ok=True)
    files = {}
    # mist_blob: 256px soft radial alpha blob (RGB white, alpha gaussian)
    g = np.zeros((256, 256), np.float32)
    yy, xx = np.mgrid[0:256, 0:256]
    d2 = ((xx - 128) ** 2 + (yy - 128) ** 2) / (110.0 ** 2)
    a = np.clip(np.exp(-d2 * 2.2) - 0.04, 0, 1)
    a = cv2.GaussianBlur(a, (0, 0), 9)
    rgb = np.full((256, 256, 3), 235, np.uint8)
    save_webp_rgba_lossless(rgb, (a * 255).astype(np.uint8), out_fx / "mist_blob.webp")
    files["mist"] = "fx/weather/mist_blob.webp"
    # ash: 16px dark speck; ember: 16px amber dot with baked glow (never additive blend)
    for name, col, sigma in (("ash", (70, 62, 58), 2.6), ("ember", (255, 176, 70), 3.2)):
        yy, xx = np.mgrid[0:16, 0:16]
        dd = ((xx - 8) ** 2 + (yy - 8) ** 2) / 36.0
        al = np.clip(np.exp(-dd * sigma) - 0.05, 0, 1)
        rgb = np.dstack([np.full((16, 16), col[0]), np.full((16, 16), col[1]),
                         np.full((16, 16), col[2])]).astype(np.uint8)
        save_webp_rgba_lossless(rgb, (al * 255).astype(np.uint8), out_fx / f"{name}.webp")
        files[name] = f"fx/weather/{name}.webp"
    # snow_glint: 24px 4-point star sparkle (white-cyan)
    gl = np.zeros((24, 24), np.float32)
    for i in range(24):
        for j in range(24):
            dx, dy = abs(i - 12), abs(j - 12)
            gl[i, j] = max(0.0, 1.0 - (dx + dy * 2.4) / 11.0) if dx < 12 else 0.0
            gl[i, j] = max(gl[i, j], max(0.0, 1.0 - (dx * 2.4 + dy) / 11.0))
    gl = np.clip(gl, 0, 1) ** 1.4
    gcol = np.dstack([np.full((24, 24), 215), np.full((24, 24), 240), np.full((24, 24), 255)]).astype(np.uint8)
    save_webp_rgba_lossless(gcol, (gl * 255).astype(np.uint8), out_fx / "snow_glint.webp")
    files["glint"] = "fx/weather/snow_glint.webp"
    # fx preview: swatches on dark plate
    prev = np.zeros((64, 3 * 80 + 16, 3), np.uint8)
    for i, p in enumerate((out_fx / "mist_blob.webp", out_fx / "ash.webp", out_fx / "ember.webp")):
        t = np.array(Image.open(p).convert("RGBA").resize((64, 64)))
        bg = prev[:, 8 + i * 80:8 + i * 80 + 64]
        alpha = t[:, :, 3:4].astype(np.float32) / 255.0
        prev[:, 8 + i * 80:8 + i * 80 + 64] = (t[:, :, :3] * alpha + bg * (1 - alpha)).astype(np.uint8)
    Image.fromarray(prev, "RGB").save(debug_dir / "weather-fx-preview.webp", quality=90, method=4)
    return files


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
    territory = load_territory_maps(out)
    biome_ids = territory["biome_ids"]
    canopy_blocked = biome_mask(biome_ids, territory["biome_index"], CANOPY_BLOCKED_BIOMES)
    dense_forest_core = fill_polygon((WORLD_H, WORLD_W), DENSE_FOREST_CORE_POLYGON) > 0

    Image.fromarray(rgb, "RGB").convert("RGBA").save(layers / "base_flat.webp", quality=94, method=4)
    save_webp_rgba(rgb, (sea.astype(np.uint8) * 255), layers / "Mare.webp", quality=94)
    # Foreground is two corner wedges: ship only the strip that holds them (layer `rect` maps it
    # back to world px), not a 2752x1536 texture that is 92% transparent (PLAN-092 GPU diet).
    fg_ys, fg_xs = np.where(foreground)
    fg_x0, fg_x1 = max(0, int(fg_xs.min()) - 2), min(WORLD_W, int(fg_xs.max()) + 3)
    fg_y0, fg_y1 = max(0, int(fg_ys.min()) - 2), min(WORLD_H, int(fg_ys.max()) + 3)
    foreground_rect = {"x": fg_x0, "y": fg_y0, "width": fg_x1 - fg_x0, "height": fg_y1 - fg_y0,
                       "sourceWidth": WORLD_W, "sourceHeight": WORLD_H}
    save_webp_rgba(rgb[fg_y0:fg_y1, fg_x0:fg_x1],
                   (foreground[fg_y0:fg_y1, fg_x0:fg_x1].astype(np.uint8) * 255),
                   layers / "Foreground.webp", quality=94)

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

    # PLAN-092 flipbook (choice B): painted cinemagraph poses built on the
    # UNFILLED painting crop (pose at rest == the base painting, no pop). A
    # rigid roll of the whole tile read as a sliding shutter (the bright lip
    # travelled down), so: the low-frequency structure (lip, shading, rock
    # edges) never moves; only the fine painted detail flows, flow-map style —
    # two phases half a cycle apart, each faded out before it resets, so a
    # pose step is a few px. Speed is per lane (smooth across x -> shear, not
    # a strip) and accelerates down the drop; zero outside the falls mask.
    FLIP_N = 24
    pf_rows = slice(pf_crop_y0, pf_crop_y0 + pf_h)
    pf_cols = slice(int(flow_rect["x"]), int(flow_rect["x"]) + pf_w)
    flip_src = rgb[pf_rows, pf_cols].astype(np.float32)
    flip_low = cv2.GaussianBlur(flip_src, (0, 0), 6.0)
    flip_detail = flip_src - flip_low
    flip_rng = np.random.default_rng(92)

    def flip_lanes(sigma: float) -> np.ndarray:
        v = cv2.GaussianBlur(flip_rng.standard_normal((1, pf_w)).astype(np.float32), (0, 0), sigma)[0]
        return v / (np.abs(v).max() + 1e-6)

    flip_m = cv2.GaussianBlur((waterfall_mask[pf_rows, pf_cols] > 127).astype(np.float32), (0, 0), 5.0)
    flip_rows_in = np.where(flip_m.max(axis=1) > 0.5)[0]
    flip_lip, flip_foot = int(flip_rows_in.min()), int(flip_rows_in.max())
    flip_drop = np.clip((np.arange(pf_h, dtype=np.float32) - flip_lip) / max(1, flip_foot - flip_lip), 0, 1)
    # cycle displacement in px: ~64px per 0.8s loop, x0.6..x1.4 by lane, x0.5..x1.3 down
    # the drop. The mask starts on the river above the painted lip (~0.14 of the
    # drop): hold still through it, ease in below, so the bright lip stays crisp.
    flip_ease = np.clip((flip_drop - 0.16) / 0.16, 0, 1)
    flip_ease = flip_ease ** 2 * (3 - 2 * flip_ease)
    flip_disp = 64.0 * (1.0 + 0.4 * flip_lanes(5.0))[None, :] * (flip_ease * (0.5 + 0.8 * flip_drop))[:, None] * flip_m
    flip_phase = flip_lanes(9.0) * 0.5 + 0.5
    flip_xs = np.broadcast_to(np.arange(pf_w, dtype=np.float32)[None, :], (pf_h, pf_w))
    flip_ys = np.arange(pf_h, dtype=np.float32)[:, None]

    # The flowing detail is drawn only from the falls body: the strong dark/bright
    # edge of the painted lip, dragged down, reads as dark bubbles in the water.
    flip_gate = np.clip((flip_drop - 0.2) / 0.08, 0, 1)
    flip_src = flip_detail * (flip_gate * flip_gate * (3 - 2 * flip_gate))[:, None, None]
    # where the water holds still (above the ease) the painting keeps its own detail
    flip_w = flip_m * flip_ease[:, None]

    def flip_layer(ph: np.ndarray) -> np.ndarray:
        return cv2.remap(flip_src, flip_xs, (flip_ys - flip_disp * ph[None, :]).astype(np.float32),
                         cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    flip_files = []
    for k in range(FLIP_N):
        pa = (k / FLIP_N + flip_phase) % 1.0
        pb = (pa + 0.5) % 1.0
        wa = (1.0 - np.abs(2.0 * pa - 1.0))[None, :, None]
        wb = 1.0 - wa
        # the two phases only decorrelate where they are displaced apart: boost the
        # mid-fade contrast there, never where the water holds still (no pulsing)
        flip_norm = 1.0 + (np.sqrt(wa ** 2 + wb ** 2) - 1.0) * np.clip(flip_disp / 8.0, 0, 1)[..., None]
        mix = (flip_layer(pa) * wa + flip_layer(pb) * wb) / flip_norm
        pose = flip_low + flip_detail * (1 - flip_w[..., None]) + mix * flip_w[..., None]
        fname = f"flip_f{k}.webp"
        save_webp_rgba(
            np.clip(pose, 0, 255).astype(np.uint8),
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
    # PLAN-095 v2: painted flow poses per feature (outside geometrySha256 — the
    # geometry contract is unchanged; poses only add what the runtime cycles).
    for i, spec in enumerate(RIVER_SPECS):
        poses = build_water_flow_poses(
            rgb, sw_result["riverClassMasks"][spec["id"]], polyline_flow_field(spec["centerline"]),
            28.0, water_fx_dir, spec["id"], seed=950 + i)
        if poses:
            next(r for r in secondary_water_json["rivers"] if r["id"] == spec["id"])["flowPoses"] = poses
    for i, spec in enumerate(LAKE_SPECS):
        poses = build_water_flow_poses(
            rgb, sw_result["lakeClassMasks"][spec["id"]], drift_flow_field(spec["drift"]),
            spec["drift"]["px"], water_fx_dir, spec["id"], seed=960 + i)
        if poses:
            next(lk for lk in secondary_water_json["lakes"] if lk["id"] == spec["id"])["flowPoses"] = poses
    # Falls basin (PLAN-092 v3): the water around the plunge point drifts OUTWARD, so the painted arcs
    # read as ripples leaving the impact. Same recipe as the river poses; the lip and rock stay still.
    basin_class = (fill_polygon((WORLD_H, WORLD_W), WATERFALL_BASIN_POLYGON) > 0) & internal_water
    bgy, bgx = np.meshgrid(np.arange(WORLD_H, dtype=np.float32), np.arange(WORLD_W, dtype=np.float32), indexing="ij")
    radial = np.dstack([bgx - WATERFALL_IMPACT_POINT["x"], bgy - WATERFALL_IMPACT_POINT["y"]]).astype(np.float32)
    radial /= np.maximum(1e-6, np.linalg.norm(radial, axis=2, keepdims=True))
    basin_poses = build_water_flow_poses(rgb, basin_class, radial, 14.0, water_fx_dir, "basin", seed=970)
    if basin_poses:
        secondary_water_json["basin"] = {"flowPoses": basin_poses}
    # Sea patches (Director 2026-10-29): bay 2 and the river mouths. Painted poses over the sea water itself;
    # flow runs away from the shore / away from the river, so freshwater visibly spills out.
    sea_patches = []
    kern = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    sea_u8 = sea.astype(np.uint8)
    hsv_img = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    teal_m = (hsv_img[..., 0] >= 70) & (hsv_img[..., 0] <= 105) & (hsv_img[..., 1] >= 80) & (hsv_img[..., 2] >= 70)
    near_coast = sea & ~(cv2.morphologyEx(sea_u8, cv2.MORPH_OPEN, kern(28)) > 0) & teal_m
    near_coast = cv2.morphologyEx(cv2.morphologyEx(near_coast.astype(np.uint8), cv2.MORPH_OPEN, kern(3)), cv2.MORPH_CLOSE, kern(5))
    n_cc, lab_cc, st_cc, cen_cc = cv2.connectedComponentsWithStats(near_coast)
    bay2 = None
    for i in range(1, n_cc):
        if st_cc[i, 4] > 2500 and abs(cen_cc[i][0] - 2032) < 60 and abs(cen_cc[i][1] - 905) < 60:
            bay2 = lab_cc == i
    land_dist = cv2.distanceTransform(sea_u8, cv2.DIST_L2, 5)
    gy_l, gx_l = np.gradient(cv2.GaussianBlur(land_dist, (0, 0), 8.0))
    away_shore = np.dstack([gx_l, gy_l]).astype(np.float32)
    away_shore /= np.maximum(1e-6, np.linalg.norm(away_shore, axis=2, keepdims=True))
    if bay2 is not None:
        bp = build_water_flow_poses(rgb, bay2, away_shore, 10.0, water_fx_dir, "bay2", seed=980)
        if bp:
            sea_patches.append({"id": "bay_2", "flowPoses": bp})
    # River mouths: sea within 45 px of the inland water, drifting away from it.
    iw_u8 = internal_water.astype(np.uint8)
    iw_dist = cv2.distanceTransform(1 - iw_u8, cv2.DIST_L2, 5)
    mouth = sea & (iw_dist < 45) & teal_m
    mouth = cv2.morphologyEx(mouth.astype(np.uint8), cv2.MORPH_OPEN, kern(2)) > 0
    # Only the main delta (stray lagoon spots of the inland-water mask would balloon the pose rect), and
    # never where a river/lake pose already draws, so no two pose sprites stack on the same pixels.
    n_m, lab_m, st_m, _ = cv2.connectedComponentsWithStats(mouth.astype(np.uint8))
    n_m, lab_m, st_m, cen_m = cv2.connectedComponentsWithStats(mouth.astype(np.uint8))
    delta_ids = [i for i in range(1, n_m) if st_m[i, 4] > 8000 and abs(cen_m[i][0] - 1460) < 120 and abs(cen_m[i][1] - 985) < 120]
    mouth = np.isin(lab_m, delta_ids)
    for cm in list(sw_result["riverClassMasks"].values()) + list(sw_result["lakeClassMasks"].values()):
        mouth &= ~cm
    if mouth.sum() > 400:
        gy_m, gx_m = np.gradient(cv2.GaussianBlur(iw_dist, (0, 0), 6.0))
        away_river = np.dstack([gx_m, gy_m]).astype(np.float32)
        away_river /= np.maximum(1e-6, np.linalg.norm(away_river, axis=2, keepdims=True))
        mp = build_water_flow_poses(rgb, mouth, away_river, 16.0, water_fx_dir, "mouths", seed=990)
        if mp:
            sea_patches.append({"id": "river_mouths", "flowPoses": mp})
    # Open water below the delta (between the two coasts, around the island): the river water keeps
    # spreading south, so the surface drifts away from the mouth. Director 2026-10-29.
    lagoon = np.zeros_like(sea)
    lagoon[990:1295, 1250:1720] = True
    lagoon &= sea & teal_m
    lagoon = cv2.morphologyEx(lagoon.astype(np.uint8), cv2.MORPH_OPEN, kern(2)) > 0
    for prev in [mouth]:
        lagoon &= ~prev
    for cm in list(sw_result["riverClassMasks"].values()) + list(sw_result["lakeClassMasks"].values()):
        lagoon &= ~cm
    if lagoon.sum() > 2000:
        lgy, lgx = np.meshgrid(np.arange(WORLD_H, dtype=np.float32), np.arange(WORLD_W, dtype=np.float32), indexing="ij")
        spread = np.dstack([(lgx - 1465.0) * 0.6, (lgy - 985.0)]).astype(np.float32)
        spread /= np.maximum(1e-6, np.linalg.norm(spread, axis=2, keepdims=True))
        lp = build_water_flow_poses(rgb, lagoon, spread, 16.0, water_fx_dir, "delta_sea", seed=995)
        if lp:
            sea_patches.append({"id": "delta_sea", "flowPoses": lp})
    if sea_patches:
        secondary_water_json["seaPatches"] = sea_patches
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

    # ── Ambient director (PLAN-094): shoal zones + route schema v0 ─────────
    ambient_exclusions: dict[str, np.ndarray] = {
        "waterfall": waterfall_mask,
        "waterfallImpact": waterfall_impact,
        "waterfallBasin": waterfall_basin,
    }
    river_flow_file = masks_dir / "river_flow_mask.webp"
    if river_flow_file.exists():
        ambient_exclusions["riverFlow"] = np.array(
            Image.open(river_flow_file).convert("RGBA"))[:, :, 3]
    ambient_result = build_ambient_director(
        rgb=rgb, sea=sea, land=land, internal_water=internal_water,
        shallow=shallow, coast_px=coast_px, foam=foam,
        exclusion_masks=ambient_exclusions,
        confluences=sw_result["geometry"]["confluences"],
        source_hash=source_hash, debug_dir=debug_dir,
        biome_ids=biome_ids, biome_name=territory["biome_name"])
    (out / "ambient-director.json").write_text(
        json.dumps(ambient_result["json"], indent=2), encoding="utf-8")
    (debug_dir / "ambient-zones-report.json").write_text(
        json.dumps(ambient_result["report"], indent=2), encoding="utf-8")
    if ambient_result["failures"]:
        print("AMBIENT-DIRECTOR GATE FAILURES:", ambient_result["failures"])
    ambient_atlas = build_shoal_atlas(out / "fx" / "ambient-sea-life.webp", source_hash)
    # NOTE: ambient is a LEAF contract (ambient-director.json fetched by
    # name, atlas via fxAtlases.ambientSeaLife) — no pack.* field, since
    # WorldSurfacePackSchema is strict (PLAN-095 leaf pattern, zero
    # contracts:check cascade).
    ambient_atlas_layout = ambient_atlas["layout"]

    # Territories + biomes come from build-mappa2-territories.py (already loaded as `territory`).
    region_ids = territory["region_ids"]
    regions_meta = territory["regions"]

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


    # ── Regional weather (PLAN-098 v1): mist + embers, biome-keyed ────────
    weather = build_weather_anchors(
        sea=sea, land=land, internal_water=internal_water,
        biome_ids=biome_ids, bidx=territory["biome_index"],
        source_hash=source_hash, debug_dir=debug_dir, out=out)
    (debug_dir / "weather-anchors-report.json").write_text(
        json.dumps(weather["report"], indent=2), encoding="utf-8")
    weather_fx = build_weather_textures(out / "fx" / "weather", debug_dir)
    print("WEATHER:", weather["report"], weather_fx)

    # ── Ambient land-life (PLAN-093) ──────────────────────────────────────
    # Anchors must be born from real painted entities (T-07): leaves scatter
    # inside the extracted canopy mask, motes above canopy + candidate land
    # biomes, flutters on meadow/lagoon/bayou land. Seeded like the rest of
    # the pack so every rebuild reproduces the same layout.
    ll_rng = np.random.default_rng(int(source_hash[:16], 16) ^ 0x1EAFF5)
    biome_name = territory["biome_name"]

    def landlife_scatter(zone_mask: np.ndarray, count: int, min_sep: float, prefix: str, radius: float, min_density: float = 0.0) -> list[dict]:
        """Deterministic anchor scatter inside a zone mask, with biome attribution
        from `biome_ids` and weight = local density of the zone itself.
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
                    "biomeId": biome_name.get(int(biome_ids[y, x]), "unassigned"),
                    "type": prefix,
                    "weight": round(float(density[y, x]) + 0.25, 3),
                    "radius": radius,
                })
                if len(chosen) >= count:
                    break
        return chosen

    mote_zone = (
        (cv2.dilate(canopy_mask.astype(np.uint8), np.ones((25, 25), np.uint8)) > 0)
        | (land & ~foreground & biome_mask(biome_ids, territory["biome_index"], LANDLIFE_MOTE_BIOMES))
    )
    flutter_zone = land & ~foreground & biome_mask(biome_ids, territory["biome_index"], LANDLIFE_FLUTTER_BIOMES)

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
    if len(unique_ids) != len(regions_meta):
        gate_failures.append(f"region_ids_{len(unique_ids)}_expected_{len(regions_meta)}")
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
        "regions": len(regions_meta),
        "biomes": len(territory["biomes"]),
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
            {"id": "foreground", "file": "Foreground.webp", "rect": foreground_rect, "type": "texture", "zIndex": 80, "tags": ["foreground"]},
        ],
        "atmosphereLayers": [],
        "visualStates": [{"id": "default", "labelKey": "world.states.default", "base": True, "overrides": []}],
        "regions": [{k: v for k, v in r.items() if k in ("id", "nameKey", "bounds", "tags")} | {"tags": ["region"]} for r in regions_meta],
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
