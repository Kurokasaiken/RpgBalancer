"""PLAN-094 T-001: ambient-director bake + route schema v0 validator.

Adversarial fixture suite — runs offline against the emitted mappa2 pack
masks, no full pipeline rebuild required:
- shoal zone gate assertions (coverage/coast band/swept footprint/L* band/
  Poisson >=300px/determinism/maskDigest)
- route validator: known-valid lane, land crossing, clearance violation,
  internal-water crossing, self-intersection.
"""
import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import numpy as np
import pytest
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
PACK = REPO / "public/assets/world/mappa2/base"
MASKS = PACK / "masks"
SEA_BIOMES = {"coral_reef", "shallow_waters", "open_sea"}

spec = importlib.util.spec_from_file_location(
    "build_mappa2_assets", REPO / "scripts/build-mappa2-assets.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def _mask(name: str) -> np.ndarray:
    img = Image.open(MASKS / name)
    arr = np.array(img.convert("RGBA"))
    return arr[:, :, 3]


def _load_inputs():
    rgb = np.array(Image.open(PACK / "layers/base_flat.webp").convert("RGB"))
    sea = _mask("sea_mask.webp") > 127
    land = _mask("land_mask.webp") > 127
    internal = _mask("internal_water_mask.webp") > 127
    shallow = _mask("shallow_mask.webp")
    coast = np.array(Image.open(MASKS / "coast_distance.webp").convert("RGB"))[:, :, 0].astype(np.float32)
    coast = coast / 255.0 * mod.D_MAX
    foam = _mask("foam_mask.webp") > 127
    excl = {}
    for n, k in (("waterfall_mask.webp", "waterfall"),
                 ("waterfall_impact_mask.webp", "waterfallImpact"),
                 ("waterfall_basin_mask.webp", "waterfallBasin"),
                 ("river_flow_mask.webp", "riverFlow")):
        if (MASKS / n).exists():
            excl[k] = _mask(n)
    return rgb, sea, land, internal, shallow, coast, foam, excl


def _biome_kwargs():
    t = mod.load_territory_maps(PACK)
    return {"biome_ids": t["biome_ids"], "biome_name": t["biome_name"]}


@pytest.fixture(scope="module")
def ambient():
    rgb, sea, land, internal, shallow, coast, foam, excl = _load_inputs()
    confluences = [{"id": c["id"], "x": c["x"], "y": c["y"]} for c in mod.CONFLUENCE_SPECS]
    return mod.build_ambient_director(
        rgb=rgb, sea=sea, land=land, internal_water=internal,
        shallow=shallow, coast_px=coast, foam=foam,
        exclusion_masks=excl, confluences=confluences,
        source_hash="t001-fixture-seed", debug_dir=PACK / "debug", **_biome_kwargs())


class TestShoalZones:
    def test_zones_exist(self, ambient):
        assert ambient["failures"] == []
        assert len(ambient["json"]["zones"]) > 0

    def test_zone_gates(self, ambient):
        _, sea, _, _, shallow, coast, _, _ = _load_inputs()
        for z in ambient["json"]["zones"]:
            cx, cy = z["cells"][0][0], z["cells"][0][1]
            assert sea[cy, cx], f"{z['id']} center not on sea"
            assert shallow[cy, cx] > 0, f"{z['id']} center not on shallows gradient"
            assert mod.SHOAL_COAST_MIN <= z["coastPx"] <= mod.SHOAL_COAST_MAX
            assert mod.SHOAL_LSTAR_MIN <= z["deltaL"] <= mod.SHOAL_LSTAR_MAX
            assert z["tintRow"] in {r["id"] for r in mod.SHOAL_TINT_ROWS}
            assert z["biome"] in SEA_BIOMES | {mod.SHOAL_BIOME_SEA}, z["biome"]

    def test_poisson_repulsion(self, ambient):
        zs = ambient["json"]["zones"]
        for i, a in enumerate(zs):
            for b in zs[i + 1:]:
                d2 = (a["cells"][0][0] - b["cells"][0][0]) ** 2 + \
                     (a["cells"][0][1] - b["cells"][0][1]) ** 2
                assert d2 >= mod.SHOAL_POISSON_PX ** 2, f"{a['id']} vs {b['id']}"

    def test_determinism(self, ambient):
        rgb, sea, land, internal, shallow, coast, foam, excl = _load_inputs()
        again = mod.build_ambient_director(
            rgb=rgb, sea=sea, land=land, internal_water=internal,
            shallow=shallow, coast_px=coast, foam=foam, exclusion_masks=excl,
            confluences=[{"id": c["id"], "x": c["x"], "y": c["y"]} for c in mod.CONFLUENCE_SPECS],
            source_hash="t001-fixture-seed", debug_dir=PACK / "debug", **_biome_kwargs())
        assert [z["id"] for z in again["json"]["zones"]] == \
               [z["id"] for z in ambient["json"]["zones"]]

    def test_mask_digest(self, ambient):
        names = ["sea_mask.webp", "land_mask.webp", "shallow_mask.webp",
                 "coast_distance.webp", "foam_mask.webp", "internal_water_mask.webp",
                 "river_flow_mask.webp", "waterfall_mask.webp"]
        digest = hashlib.sha256(b"".join((MASKS / n).read_bytes()
                                         for n in names if (MASKS / n).exists())).hexdigest()
        assert ambient["json"]["maskDigest"] == digest
        assert ambient["json"]["maskDigest"] != hashlib.sha256(b"stale").hexdigest()

    def test_routes_schema_v0_not_shipped(self, ambient):
        assert ambient["json"]["routes"] == []
        assert mod.ROUTE_SCHEMA_VERSION == 0


class TestRouteValidator:
    def _masks(self):
        _, sea, land, internal, _, coast, _, _ = _load_inputs()
        return sea, land, internal, coast

    def test_known_valid_sea_lane(self):
        sea, land, internal, coast = self._masks()
        # adaptive: find a 300px horizontal run fully on sea with coast>=80
        lane = None
        for y in range(150, 1500, 10):
            for x in range(50, 2400, 10):
                run = np.arange(x, x + 300, 4)
                if sea[y, x:x + 300:4].all() and coast[y, run].min() >= 80:
                    lane = [(x, y), (x + 300, y)]
                    break
            if lane:
                break
        if lane is None:  # relax: 200px run at coast>=60
            for y in range(150, 1500, 10):
                for x in range(50, 2500, 10):
                    run = np.arange(x, x + 200, 4)
                    if sea[y, x:x + 200:4].all() and coast[y, run].min() >= 60:
                        lane = [(x, y), (x + 200, y)]
                        break
                if lane:
                    break
        assert lane, "no valid sea lane found — mask probing failed"
        res = mod.validate_routes([{"id": "lane_valid", "polyline": lane,
                                    "widthPx": 24, "clearancePx": 40}],
                                  sea, land, internal, coast)
        assert res[0]["ok"], res[0]["failures"]

    def test_bad_land_crossing(self):
        sea, land, internal, coast = self._masks()
        ys, xs = np.nonzero(land)
        if len(xs) == 0:
            pytest.skip("no land")
        cx, cy = int(xs[len(xs) // 2]), int(ys[len(ys) // 2])
        res = mod.validate_routes([{"id": "lane_land", "polyline": [(cx - 200, cy), (cx + 200, cy)],
                                    "widthPx": 24, "clearancePx": 40}],
                                  sea, land, internal, coast)
        assert not res[0]["ok"]
        assert any("off_sea" in f or "on_land" in f for f in res[0]["failures"])

    def test_bad_clearance(self):
        sea, land, internal, coast = self._masks()
        ys, xs = np.nonzero((coast > 1) & (coast < 15) & sea)
        assert len(xs) > 0
        x, y = int(xs[0]), int(ys[0])
        res = mod.validate_routes([{"id": "lane_coast", "polyline": [(x, y), (x + 300, y)],
                                    "widthPx": 24, "clearancePx": 40, "endpointSlackPx": 8}],
                                  sea, land, internal, coast)
        assert not res[0]["ok"]
        assert any("clearance" in f for f in res[0]["failures"])

    def test_bad_internal_water(self):
        sea, land, internal, coast = self._masks()
        ys, xs = np.nonzero(internal)
        assert len(xs) > 0
        cx, cy = int(xs[len(xs) // 2]), int(ys[len(ys) // 2])
        res = mod.validate_routes([{"id": "lane_internal", "polyline": [(cx - 100, cy), (cx + 100, cy)],
                                    "widthPx": 24, "clearancePx": 40}],
                                  sea, land, internal, coast)
        assert not res[0]["ok"]

    def test_bad_self_intersection(self):
        sea, land, internal, coast = self._masks()
        res = mod.validate_routes([{"id": "lane_loop", "polyline": [(100, 100), (300, 100), (300, 300), (100, 300), (100, 50)],
                                    "widthPx": 24, "clearancePx": 40}],
                                  sea, land, internal, coast)
        assert not res[0]["ok"]
        assert any("self_intersection" in f for f in res[0]["failures"])
