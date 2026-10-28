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


def save_alpha_mask(mask: np.ndarray, path: Path) -> None:
    rgba = np.dstack([
        np.full(mask.shape, 255, dtype=np.uint8),
        np.full(mask.shape, 255, dtype=np.uint8),
        np.full(mask.shape, 255, dtype=np.uint8),
        np.clip(mask, 0, 255).astype(np.uint8),
    ])
    Image.fromarray(rgba, "RGBA").save(path, quality=90, alpha_quality=100, method=4)


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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=str(Path.home() / "Downloads" / "mappa2.jpeg"))
    parser.add_argument("--out", default="public/assets/world/mappa2/base")
    parser.add_argument("--pipeline-version", default="mappa2-assets-v1")
    parser.add_argument("--mask-revision", type=int, default=2)
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
    canopy_regions = {"western_forest", "bayou", "waterfall_plateau", "western_archipelago", "coral_lagoon"}
    canopy_allowed = np.zeros((WORLD_H, WORLD_W), dtype=np.uint8)
    for region_id, _, polygon in REGION_SPECS:
        if region_id in canopy_regions:
            cv2.fillPoly(canopy_allowed, [np.array(polygon, np.int32)], 255)
    canopy_allowed = canopy_allowed > 0

    Image.fromarray(rgb, "RGB").convert("RGBA").save(layers / "base_flat.webp", quality=94, method=4)
    save_webp_rgba(rgb, (sea.astype(np.uint8) * 255), layers / "Mare.webp", quality=94)
    save_webp_rgba(rgb, (foreground.astype(np.uint8) * 255), layers / "Foreground.webp", quality=94)

    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    laplacian = np.abs(cv2.Laplacian(gray, cv2.CV_32F, ksize=3))
    edge_density = cv2.boxFilter((laplacian > 24).astype(np.float32), -1, (9, 9), normalize=True)
    canopy_seed = (land & ~foreground & canopy_allowed & (h >= 34) & (h <= 88) & (s >= 90) & (v <= 100) & (edge_density >= 0.55)).astype(np.uint8) * 255
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
    cloud_mask_src = (bg_delta > 24).astype(np.uint8) * 255
    cloud_mask_src = cv2.morphologyEx(cloud_mask_src, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
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
        crop_mask = (cloud_labels[y0:y1, x0:x1] == component_id).astype(np.float32)
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
            "landPlusSea": round(float(((land | sea)).mean()), 4),
        },
        "canopyLayers": len(canopy_layers),
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
            "canopyLayers": canopy_layers,
            "cloudBands": cloud_bands,
            "fxAtlases": {"ambientSeaLife": "fx/ambient-sea-life.webp", "ambientLandLife": "fx/ambient-land-life.webp", "ambientWeather": "fx/ambient-weather.webp", "rare": "fx/rare-events.webp"},
            "bootPhases": {
                "manifest": ["manifest.json"],
                "core-paint": ["layers/base_flat.webp", "layers/Mare.webp", "layers/Foreground.webp", "layers/base_flat.nocanopy.webp", "layers/base_flat.clean.webp"],
                "terrain-masks": ["masks/sea_mask.webp", "masks/land_mask.webp", "masks/shallow_mask.webp", "masks/internal_water_mask.webp", "masks/coast_distance.webp", "masks/foam_mask.webp"],
                "ambient": [f"layers/{l['id']}.canopy.webp" for l in canopy_layers] + [s["src"] for b in cloud_bands for s in b["sprites"]] + [s["shadowSrc"] for b in cloud_bands for s in b["sprites"]],
                "ambient-fx": ["fx/ambient-sea-life.webp", "fx/ambient-land-life.webp", "fx/ambient-weather.webp"],
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
