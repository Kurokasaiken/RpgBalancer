#!/usr/bin/env python3
"""Build the mappa2 territory (Risiko-style region) and biome id maps.

Two independent layers (PLAN-099):

* **Regions** — contiguous gameplay territories that tile the whole canvas, sea included.
  Borders follow natural features (coast, river, ridges). Written to `region_ids.png` + `regions.json`.
* **Biomes** — what the terrain *is*; the same biome can appear in many distant regions.
  Written to `biome_ids.png` + `biomes.json`. Animations (shoals, land-life, canopy sway, ambient
  director) key on biomes, never on regions.

Inputs are the masks emitted by `build-mappa2-assets.py` (`sea_mask`, `river_flow_mask`, `waterfall_*`,
`shallow_mask`) and `layers/base_flat.webp`. Run this after the mask pass and before the animation
pass of `build-mappa2-assets.py`, which reads the maps produced here.
"""
import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

WORLD_W, WORLD_H = 2752, 1536
# Seeds are authored on a half-resolution canvas (1376x768); labels are grown there and upsampled.
HW, HH = WORLD_W // 2, WORLD_H // 2

# (id, label, kind, continent, biome, seeds). Seeds are (x, y) on the half-res canvas.
# Sea territories have a base biome of open_sea; shallow / reef pixels are refined per pixel below.
REGIONS = [
    ("snow_peaks", "Vette Nevose", "land", "mainland", "alpine", [(620, 100), (740, 70), (790, 130), (560, 150), (600, 140), (790, 200), (840, 170)]),
    ("waterfall_plateau", "Altopiano della Cascata", "land", "mainland", "highland", []),  # carved from the waterfall masks
    ("ridge_forest", "Bosco del Crinale", "land", "mainland", "temperate_forest", [(440, 190), (480, 290)]),
    ("deep_forest", "Selva Profonda", "land", "mainland", "temperate_forest", [(560, 400)]),
    ("river_meadows", "Praterie del Fiume", "land", "mainland", "meadow", [(780, 380)]),
    ("red_desert", "Deserto Rosso", "land", "mainland", "red_badlands", [(950, 250), (1030, 190), (940, 110)]),
    ("red_canyons", "Canyon Rossi", "land", "mainland", "red_badlands", [(960, 360), (1040, 400)]),
    ("volcanic_massif", "Massiccio Vulcanico", "land", "mainland", "volcanic", [(900, 520)]),
    ("bayou", "Bayou", "land", "mainland", "mangrove_bayou", [(540, 500), (600, 520)]),
    ("sandy_coast", "Costa Sabbiosa", "land", "mainland", "tropical_beach", [(390, 580), (470, 600)]),
    ("green_islet", "Isolotto Verde", "land", "islands", "tropical_isles", [(700, 580)]),
    ("nw_archipelago", "Arcipelago Nord-Ovest", "land", "islands", "tropical_isles", [(100, 60), (390, 45), (160, 125)]),
    ("west_atoll", "Atollo e Arco Ovest", "land", "islands", "tropical_isles", [(60, 250), (270, 370), (205, 390), (210, 520)]),
    ("east_cliffs", "Scogliere Orientali", "land", "islands", "rocky_coast", [(1200, 40), (1300, 70), (1190, 95), (1330, 300), (1280, 540), (1130, 230)]),
    ("se_volcanic_isles", "Isolotti Vulcanici", "land", "islands", "volcanic", [(1060, 540), (1035, 630)]),
    ("sea_west", "Mare Ovest", "sea", "sea", "open_sea", [(200, 220), (100, 420)]),
    ("sea_north", "Mare Nord", "sea", "sea", "open_sea", [(900, 30), (300, 110)]),
    ("sea_east", "Mare Est", "sea", "sea", "open_sea", [(1150, 380), (1200, 560)]),
    ("coral_lagoon", "Laguna Corallina", "sea", "sea", "coral_reef", [(680, 680), (560, 640), (880, 660)]),
    ("sea_south", "Mare Sud", "sea", "sea", "open_sea", [(1100, 730), (1250, 650)]),
]

BIOMES = [
    ("alpine", "Alpino e Ghiacciai"),
    ("highland", "Altopiano e Lago Alpino"),
    ("temperate_forest", "Foresta"),
    ("meadow", "Prateria"),
    ("red_badlands", "Deserto e Canyon Rossi"),
    ("volcanic", "Vulcanico"),
    ("mangrove_bayou", "Bayou e Mangrovie"),
    ("tropical_beach", "Spiaggia Tropicale"),
    ("tropical_isles", "Isole Tropicali"),
    ("rocky_coast", "Scogliere"),
    ("coral_reef", "Barriera Corallina"),
    ("shallow_waters", "Acque Basse"),
    ("open_sea", "Mare Aperto"),
]
SHALLOW_THRESHOLD = 40  # same cut as the sea-life `shallow` anchors in build-mappa2-assets.py

# Peaks that no mask covers (the glacier + summits read as sea in `sea_mask`), and the dark western
# flank between Bosco del Crinale and the peaks. Half-res polygons, forced to land and, for the flank,
# to snow_peaks.
PEAKS_POLY = [(545, 135), (570, 100), (630, 62), (690, 25), (725, 22), (770, 55), (815, 75), (865, 100), (880, 150), (700, 160), (600, 170)]
WEST_FLANK_POLY = [(470, 125), (520, 100), (575, 112), (610, 170), (610, 215), (540, 218), (490, 208), (462, 170)]


def load_alpha(path: Path, size: tuple[int, int]) -> np.ndarray:
    a = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)[..., 3]
    return cv2.resize(a, size, interpolation=cv2.INTER_AREA)


def grow(domain: np.ndarray, seeds: list[tuple[int, int, int]]) -> np.ndarray:
    """Multi-source flood fill (alternating cross/square kernels ≈ geodesic Voronoi inside `domain`)."""
    labels = np.zeros(domain.shape, np.uint8)
    for i, x, y in seeds:
        cv2.circle(labels, (x, y), 6, int(i), -1)
    labels[~domain] = 0
    cross = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
    square = np.ones((3, 3), np.uint8)
    for it in range(4000):
        grown = cv2.dilate(labels, cross if it % 2 == 0 else square)
        new = (labels == 0) & domain & (grown > 0)
        if not new.any():
            break
        labels[new] = grown[new]
    return labels


def nearest_fill(labels: np.ndarray, target: np.ndarray) -> np.ndarray:
    """Give every `target` pixel the label of its nearest labelled pixel (Euclidean)."""
    src = (labels == 0).astype(np.uint8)
    _, pix = cv2.distanceTransformWithLabels(src, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    lut = np.zeros(int(pix.max()) + 1, np.uint8)
    lut[pix[src == 0]] = labels[src == 0]
    return np.where(target, lut[pix], labels).astype(np.uint8)


def tidy(labels: np.ndarray, land: np.ndarray, min_px: int = 1200) -> np.ndarray:
    """Merge label fragments smaller than `min_px` into their dominant neighbour of the same domain."""
    for _ in range(3):
        for i in [int(v) for v in np.unique(labels) if v]:
            n, cc, st, _ = cv2.connectedComponentsWithStats((labels == i).astype(np.uint8), connectivity=8)
            for k in range(1, n):
                if st[k, 4] >= min_px:
                    continue
                comp = cc == k
                ring = cv2.dilate(comp.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & ~comp
                dom = land if land[comp].mean() > 0.5 else ~land
                nb = labels[ring & dom & (labels != i)]
                if nb.size:
                    labels[comp] = np.bincount(nb).argmax()
    return labels


def build_half_res(base: Path):
    size = (HW, HH)
    sea0 = load_alpha(base / "masks" / "sea_mask.webp", size) > 127
    river = load_alpha(base / "masks" / "river_flow_mask.webp", size) > 127
    img = cv2.resize(cv2.imread(str(base / "layers" / "base_flat.webp")), size)

    # Land = not sea, closed and de-speckled; plus the hand-drawn peaks / flank, plus thin rock the
    # sea mask swallowed (arch, cliff face) found by "sea but not water-coloured".
    land = (~sea0).astype(np.uint8)
    cv2.fillPoly(land, [np.array(PEAKS_POLY, np.int32)], 1)
    land = cv2.morphologyEx(land, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    n, cc, st, _ = cv2.connectedComponentsWithStats((1 - land).astype(np.uint8), connectivity=4)
    for k in range(1, n):
        if st[k, 4] < 400:
            land[cc == k] = 1
    n, cc, st, _ = cv2.connectedComponentsWithStats(land, connectivity=8)
    for k in range(1, n):
        if st[k, 4] < 40:
            land[cc == k] = 0
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(int)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    water = ((h >= 80) & (h <= 112) & (s > 90)) | ((h >= 70) & (h <= 120) & (v < 90) & (s > 60))
    swallowed = (sea0 & ~water).astype(np.uint8)
    swallowed = cv2.morphologyEx(swallowed, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    swallowed = cv2.morphologyEx(swallowed, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    flank = np.zeros((HH, HW), np.uint8)
    cv2.fillPoly(flank, [np.array(WEST_FLANK_POLY, np.int32)], 1)
    land = (land > 0) | (flank > 0) | (cv2.dilate(swallowed, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))) > 0)
    flank = flank > 0

    ids = {r[0]: i + 1 for i, r in enumerate(REGIONS)}
    land_seeds = [(ids[r[0]], x, y) for r in REGIONS if r[2] == "land" for x, y in r[5]]
    sea_seeds = [(ids[r[0]], x, y) for r in REGIONS if r[2] == "sea" for x, y in r[5]]

    # The waterfall plateau is fixed around the falls, lake and basin: its hull, not a grown cell.
    fall = np.zeros((HH, HW), bool)
    for name in ("waterfall_mask", "waterfall_basin_mask", "waterfall_lake_mask", "waterfall_impact_mask"):
        fall |= load_alpha(base / "masks" / f"{name}.webp", size) > 127
    fall = cv2.dilate(fall.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))).astype(bool) & land
    contours, _ = cv2.findContours(fall.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    hull = np.zeros((HH, HW), np.uint8)
    cv2.fillPoly(hull, [cv2.convexHull(np.vstack(contours))], 1)
    fall = cv2.dilate(hull, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))).astype(bool) & land

    wall = cv2.dilate(river.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    lab_land = grow(land & ~wall & ~fall, land_seeds)
    lab_land = nearest_fill(lab_land, land & (lab_land == 0))
    lab_land[fall] = ids["waterfall_plateau"]
    lab_land[flank & ~fall] = ids["snow_peaks"]
    lab_land[~land] = 0
    return lab_land, land.astype(np.uint8), ids, sea_seeds


# Biomes a land region may contain, besides its base biome (the colour decides within this set).
REGION_ALLOWED_BIOMES = {
    "snow_peaks": {"alpine", "rocky_coast", "temperate_forest", "highland"},
    "waterfall_plateau": {"highland", "alpine", "temperate_forest", "meadow"},
    "ridge_forest": {"temperate_forest", "meadow", "rocky_coast", "highland"},
    "deep_forest": {"temperate_forest", "mangrove_bayou", "meadow"},
    "river_meadows": {"meadow", "temperate_forest", "mangrove_bayou"},
    "red_desert": {"red_badlands", "meadow", "rocky_coast"},
    "red_canyons": {"red_badlands", "rocky_coast", "volcanic"},
    "volcanic_massif": {"volcanic", "red_badlands", "rocky_coast"},
    "bayou": {"mangrove_bayou", "temperate_forest", "meadow", "tropical_beach"},
    "sandy_coast": {"tropical_beach", "mangrove_bayou", "meadow"},
    "green_islet": {"tropical_isles", "tropical_beach", "temperate_forest"},
    "nw_archipelago": {"tropical_isles", "temperate_forest", "rocky_coast"},
    "west_atoll": {"tropical_isles", "tropical_beach", "rocky_coast"},
    "east_cliffs": {"rocky_coast", "temperate_forest", "tropical_isles"},
    "se_volcanic_isles": {"volcanic", "rocky_coast", "tropical_beach"},
}


def classify_land(rgb, canopy, region_ids, land, biome_ids, allowed, biome_index):
    """Per-pixel land biome from painted colour (HSV), restricted to the region's allowed set.

    Colour rules are heuristics tuned by eye on base_flat; they are a first pass, not ground truth.
    A 9x9 majority filter inside each region removes speckle so biomes read as areas.
    """
    hsv = cv2.cvtColor(rgb, cv2.COLOR_BGR2HSV).astype(np.int32)
    h, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    cls = np.full(region_ids.shape, -1, np.int32)  # -1 = no colour opinion
    snow = (val > 200) & (sat < 60)
    sand = (h >= 10) & (h <= 30) & (sat >= 40) & (sat <= 140) & (val > 150)
    red = ((h <= 14) | (h >= 165)) & (sat > 120) & (val > 90)
    dark = val < 90
    rock = (sat < 50) & (val >= 90) & (val <= 200)
    forest = canopy | ((h >= 35) & (h <= 90) & (sat > 60) & (val < 140))
    meadow = (h >= 25) & (h <= 50) & (sat > 60) & (val >= 120)
    swamp = (h >= 35) & (h <= 90) & (sat > 30) & (val >= 60) & (val < 130)
    for name, mask in (("alpine", snow), ("tropical_beach", sand), ("red_badlands", red),
                       ("volcanic", dark), ("rocky_coast", rock), ("temperate_forest", forest),
                       ("meadow", meadow), ("mangrove_bayou", swamp)):
        cls[mask & land & (cls < 0)] = biome_index[name]

    out = biome_ids.copy()
    for rid, allow in allowed.items():
        ok_idx = [biome_index[b] for b in allow]
        in_r = (region_ids == rid) & land
        pick = in_r & (cls >= 0) & np.isin(cls, ok_idx)
        out[pick] = cls[pick]
        # majority filter inside the region
        votes = np.zeros((len(biome_index) + 1,) + region_ids.shape, np.float32)
        for bi in ok_idx:
            votes[bi] = cv2.blur(((out == bi) & in_r).astype(np.float32), (9, 9))
        smooth = np.argmax(votes, axis=0).astype(np.uint8)
        out[in_r] = smooth[in_r]
    return out.astype(np.uint8)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="public/assets/world/mappa2/base")
    args = parser.parse_args()
    out = Path(args.out)
    base = out

    lab_land, land_u8, ids, sea_seeds = build_half_res(base)
    land = land_u8.astype(bool)

    # Sea: Euclidean Voronoi from the sea seeds.
    yy, xx = np.mgrid[0:HH, 0:HW]
    best = np.full((HH, HW), 1e9, np.float32)
    lab_sea = np.zeros((HH, HW), np.uint8)
    for i, x, y in sea_seeds:
        d = ((xx - x) ** 2 + (yy - y) ** 2).astype(np.float32)
        m = d < best
        best[m] = d[m]
        lab_sea[m] = i

    n_reg = len(REGIONS)
    land_ids = [ids[r[0]] for r in REGIONS if r[2] == "land"]
    sea_ids = [ids[r[0]] for r in REGIONS if r[2] == "sea"]

    def smooth_scores(labels: np.ndarray, ids_: list[int], sigma: float) -> np.ndarray:
        return np.stack([cv2.GaussianBlur((labels == i).astype(np.float32), (0, 0), sigma) for i in ids_])

    # Smooth the half-res labels, upsample the *scores* (not the labels) to full res, argmax there:
    # borders come out as smooth curves at 2752x1536 instead of 2x nearest-neighbour stairs.
    land_full = cv2.resize(cv2.GaussianBlur(land_u8.astype(np.float32), (0, 0), 1.5), (WORLD_W, WORLD_H), interpolation=cv2.INTER_CUBIC) > 0.5
    region_ids = np.zeros((WORLD_H, WORLD_W), np.uint8)
    for domain_ids, labels, dom_full in ((land_ids, lab_land, land_full), (sea_ids, lab_sea, ~land_full)):
        sc = smooth_scores(labels, domain_ids, 9)
        best_s = np.full((WORLD_H, WORLD_W), -1, np.float32)
        arg = np.zeros((WORLD_H, WORLD_W), np.uint8)
        for k, i in enumerate(domain_ids):
            up = cv2.resize(sc[k], (WORLD_W, WORLD_H), interpolation=cv2.INTER_CUBIC)
            m = up > best_s
            best_s[m] = up[m]
            arg[m] = i
        region_ids[dom_full] = arg[dom_full]
    # Drop fragments the smoothing left behind.
    region_ids = tidy(region_ids, land_full, min_px=4800)
    assert region_ids.min() > 0, "every pixel must belong to a region"

    # ── biomes ────────────────────────────────────────────────────────────────
    biome_index = {b: i + 1 for i, (b, _l) in enumerate(BIOMES)}
    lut = np.zeros(n_reg + 1, np.uint8)
    for r in REGIONS:
        lut[ids[r[0]]] = biome_index[r[4]]
    biome_ids = lut[region_ids]
    shallow = cv2.imread(str(base / "masks" / "shallow_mask.webp"), cv2.IMREAD_UNCHANGED)[..., 3]
    sea_full = ~land_full
    is_open = biome_ids == biome_index["open_sea"]
    biome_ids[is_open & sea_full & (shallow > SHALLOW_THRESHOLD)] = biome_index["shallow_waters"]

    # Land: classify each pixel by its painted colour, then keep only biomes the region allows.
    canopy = cv2.imread(str(base / "masks" / "canopy_mask.webp"), cv2.IMREAD_UNCHANGED)[..., 3] > 127
    rgb_full = cv2.imread(str(base / "layers" / "base_flat.webp"))
    allowed = {ids[r[0]]: REGION_ALLOWED_BIOMES.get(r[0], {r[4]}) | {r[4]} for r in REGIONS if r[2] == "land"}
    biome_ids = classify_land(rgb_full, canopy, region_ids, land_full, biome_ids, allowed, biome_index)

    Image.fromarray(region_ids, mode="L").save(out / "region_ids.png", optimize=True)
    Image.fromarray(biome_ids, mode="L").save(out / "biome_ids.png", optimize=True)

    # ── metadata ──────────────────────────────────────────────────────────────
    area = region_ids.size
    neighbours: dict[int, set[int]] = {i: set() for i in range(1, n_reg + 1)}
    for dy, dx in ((0, 1), (1, 0)):
        a = region_ids[: WORLD_H - dy, : WORLD_W - dx]
        b = region_ids[dy:, dx:]
        diff = a != b
        for p, q in set(zip(a[diff].tolist(), b[diff].tolist())):
            neighbours[p].add(q)
            neighbours[q].add(p)
    # a border is only a real adjacency if it is longer than a few pixels of dither
    def border_len(p: int, q: int) -> int:
        mp = cv2.dilate((region_ids == p).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        return int(np.count_nonzero(mp & (region_ids == q)))

    regions_meta = []
    for r in REGIONS:
        rid, label, kind, continent, _biome, _seeds = r
        idx = ids[rid]
        ys, xs = np.nonzero(region_ids == idx)
        in_biome = np.bincount(biome_ids[region_ids == idx], minlength=len(BIOMES) + 1)
        regions_meta.append({
            "id": rid,
            "index": idx,
            "nameKey": f"world.region.{rid}",
            "label": label,
            "kind": kind,
            "continent": continent,
            "center": [round(float(xs.mean()) / WORLD_W, 4), round(float(ys.mean()) / WORLD_H, 4)],
            "bounds": {"x": int(xs.min()), "y": int(ys.min()), "width": int(xs.max() - xs.min() + 1), "height": int(ys.max() - ys.min() + 1)},
            "areaFraction": round(float(len(xs) / area), 4),
            "biomes": {BIOMES[k - 1][0]: round(float(c / in_biome.sum()), 3) for k, c in enumerate(in_biome) if k > 0 and c / in_biome.sum() >= 0.02},
            "neighbors": sorted(REGIONS[q - 1][0] for q in neighbours[idx] if border_len(idx, q) >= 40),
        })
    (out / "regions.json").write_text(json.dumps({"size": [WORLD_W, WORLD_H], "regions": regions_meta}, indent=2), encoding="utf-8")

    biomes_meta = []
    for b, label in BIOMES:
        bi = biome_index[b]
        mask = biome_ids == bi
        ys, xs = np.nonzero(mask)
        in_region = np.bincount(region_ids[mask], minlength=n_reg + 1)
        biomes_meta.append({
            "id": b,
            "index": bi,
            "nameKey": f"world.biome.{b}",
            "label": label,
            "kind": "sea" if b in ("coral_reef", "shallow_waters", "open_sea") else "land",
            "areaFraction": round(float(mask.sum() / area), 4),
            "bounds": {"x": int(xs.min()), "y": int(ys.min()), "width": int(xs.max() - xs.min() + 1), "height": int(ys.max() - ys.min() + 1)} if len(xs) else None,
            "regions": [REGIONS[k - 1][0] for k, c in enumerate(in_region) if k > 0 and c / mask.sum() >= 0.02],
        })
    (out / "biomes.json").write_text(json.dumps({"canvas": {"width": WORLD_W, "height": WORLD_H}, "biomes": biomes_meta}, indent=2), encoding="utf-8")

    # debug overlay for review
    rng = np.random.RandomState(7)
    pal = np.vstack([[0, 0, 0], rng.randint(40, 255, (n_reg, 3))]).astype(np.uint8)
    base_img = cv2.imread(str(base / "layers" / "base_flat.webp"))
    ov = cv2.addWeighted(base_img, 0.5, pal[region_ids][..., ::-1].copy(), 0.5, 0)
    edge = cv2.dilate(region_ids, np.ones((5, 5), np.uint8)) != cv2.erode(region_ids, np.ones((5, 5), np.uint8))
    ov[edge] = (255, 255, 255)
    cv2.imwrite(str(out / "debug" / "regions-preview.webp"), ov, [cv2.IMWRITE_WEBP_QUALITY, 85])
    # fixed colours per biome (BGR-independent RGB table) so the preview reads the same every build
    fixed = [(0, 0, 0), (235, 245, 255), (200, 70, 200), (40, 110, 40), (150, 220, 80), (210, 90, 40),
             (120, 40, 120), (60, 200, 200), (255, 220, 120), (230, 150, 110), (90, 90, 90), (40, 120, 220),
             (30, 60, 140), (255, 255, 255)]
    pal_b = np.array(fixed[: len(BIOMES) + 1], np.uint8)
    ovb = cv2.addWeighted(base_img, 0.5, pal_b[biome_ids][..., ::-1].copy(), 0.5, 0)
    cv2.imwrite(str(out / "debug" / "biomes-preview.webp"), ovb, [cv2.IMWRITE_WEBP_QUALITY, 85])
    print(json.dumps({"regions": n_reg, "biomes": len(BIOMES), "unassigned": int((region_ids == 0).sum())}))


if __name__ == "__main__":
    main()
