#!/usr/bin/env python3
"""Night «luna e torce» plates for mappa2 (Director 2026-11-11: «1 · Luna e torce»).

Every colour, intensity and threshold comes from src/balancing/config/idleVillage/mappa2NightPlates.json (Director
2026-11-11: all values governed by config, none hard-coded). Writes into `output.dir` (scaled down by `output.downscale`,
sampled stretched over the 2752x1536 world):
  night-mult.webp   multiply plate: moonlit land, darker sea that keeps its hue, snow that keeps the moon, colour restored near lights
  night-add.webp    additive plate: warm window glows, lava glow, faint moon path on sea and sheen on snow
  night-lights.json light positions (world px)
  bio-*.webp        additive bioluminescence (patterns the map cross-fades): shallow water, seabed, reef, bayou, faint surf, deep sparks

Lights come from the scene itself: windows = where the shown village plate differs from the meadow plate under it;
lava = the crater (fx/volcano/crater.json).
Usage: .mw/venv/bin/python -I scripts/build-mappa2-night.py
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

CFG = json.loads(Path("src/balancing/config/idleVillage/mappa2NightPlates.json").read_text())
PACK = Path("public/assets/world/mappa2/base")
OUT = Path(CFG["output"]["dir"])


def rgb(v):
    return np.array(v, np.float32)


def mask(name):
    a = np.asarray(Image.open(PACK / "masks" / name).convert("RGBA")).astype(np.float32) / 255
    return a[..., 3] * a[..., :3].max(axis=2) if a[..., 3].min() < 1 else a[..., :3].max(axis=2)


def house_lights():
    c = CFG["windows"]
    vj = json.loads((PACK / "fx" / "village" / "village.json").read_text())
    z = vj["zone"]
    plate = np.asarray(Image.open(PACK / "fx" / "village" / c["village"]["plate"]).convert("RGBA")).astype(np.float32)
    meadow = np.asarray(Image.open(PACK / "fx" / "village" / c["village"]["under"]).convert("RGBA")).astype(np.float32)
    diff = np.abs(plate[..., :3] - meadow[..., :3]).max(axis=2) * (plate[..., 3] / 255)
    d = c["detect"]
    m = (cv2.GaussianBlur(diff, (0, 0), d["blur"]) > d["threshold"]).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, stats, cent = cv2.connectedComponentsWithStats(m, connectivity=8)
    lights = []
    rr = c["radius"]
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < d["minArea"]:
            continue
        cx, cy = cent[i]
        # big blocks (several houses) get a few lights spread over their box
        k = int(min(d["maxLightsPerBlock"], max(1, area // d["areaPerLight"])))
        x0, y0, bw, bh = stats[i, :4]
        rng = np.random.default_rng(i)
        for _ in range(k):
            px = cx if k == 1 else x0 + bw * (0.25 + 0.5 * rng.random())
            py = cy if k == 1 else y0 + bh * (0.3 + 0.5 * rng.random())
            lights.append({"x": float(z["x"] + px), "y": float(z["y"] + py), "kind": "window",
                           "r": rr["base"] + min(rr["max"], area ** 0.5 * rr["areaFactor"])})
    return lights


def radial(xx, yy, x, y, r):
    return np.exp(-(((xx - x) ** 2 + (yy - y) ** 2) / (r * r)))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    canvas = json.loads((PACK / "manifest.json").read_text())["coordinateSystem"]["canvas"]
    W, H, S = canvas["width"], canvas["height"], CFG["output"]["downscale"]
    q = CFG["output"]["quality"]
    w, h = W // S, H // S
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32) * S
    sea = cv2.resize(mask("sea_mask.webp"), (w, h), interpolation=cv2.INTER_AREA)
    land = cv2.resize(mask("land_mask.webp"), (w, h), interpolation=cv2.INTER_AREA)
    base = np.asarray(Image.open(PACK / "layers" / "base_flat.webp").convert("RGB").resize((w, h), Image.LANCZOS)).astype(np.float32) / 255
    hsv = cv2.cvtColor((base * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    mo = CFG["moon"]
    sd = mo["snowDetect"]
    snow = np.clip((hsv[..., 2] - sd["valueFrom"]) / sd["valueRange"], 0, 1) * np.clip((sd["saturationBelow"] - hsv[..., 1]) / sd["saturationRange"], 0, 1) * land
    snow = cv2.GaussianBlur(snow, (0, 0), sd["blur"])

    # --- multiply: moonlit grade ---
    seaw = np.clip(sea, 0, 1)[..., None]
    mult = rgb(mo["land"]) * (1 - seaw) + rgb(mo["sea"]) * seaw
    sw = snow[..., None]
    mult = mult * (1 - sw) + rgb(mo["snow"]) * sw

    lights = house_lights()
    cz = json.loads((PACK / "fx" / "volcano" / "crater.json").read_text())
    lv = CFG["lava"]
    lava = {"x": float(cz["centre"][0]), "y": float(cz["centre"][1]), "kind": "lava", "r": float(lv["radius"])}
    win = CFG["windows"]

    relit = np.zeros((h, w), np.float32)
    for L in lights:
        relit = np.maximum(relit, radial(xx, yy, L["x"], L["y"], L["r"] * win["relight"]["radiusK"]) * win["relight"]["strength"])
    relit = np.maximum(relit, radial(xx, yy, lava["x"], lava["y"], lava["r"] * lv["relight"]["radiusK"]) * lv["relight"]["strength"])
    rl = relit[..., None]
    mult = mult * (1 - rl) + rgb(CFG["relightColour"]) * rl

    # --- add: windows, lava, moon path, snow sheen ---
    add = np.zeros((h, w, 3), np.float32)
    for L in lights:
        core = radial(xx, yy, L["x"], L["y"], L["r"] * win["core"]["radiusK"]) * win["core"]["strength"]
        halo = radial(xx, yy, L["x"], L["y"], L["r"] * win["halo"]["radiusK"]) * win["halo"]["strength"]
        add += (core + halo)[..., None] * rgb(win["colour"])
    add += (radial(xx, yy, lava["x"], lava["y"], lava["r"] * lv["core"]["radiusK"]) * lv["core"]["strength"]
            + radial(xx, yy, lava["x"], lava["y"], lava["r"] * lv["halo"]["radiusK"]) * lv["halo"]["strength"])[..., None] * rgb(lv["colour"])
    mp = CFG["moonPath"]
    t = xx * mp["dirX"] + yy * mp["dirY"]
    band = np.exp(-(((t - mp["centre"]) / mp["width"]) ** 2)) * np.clip(sea, 0, 1)
    add += (band * mp["strength"])[..., None] * rgb(mp["colour"])
    ss = CFG["snowSheen"]
    add += (snow * ss["strength"])[..., None] * rgb(ss["colour"])

    Image.fromarray(np.clip(mult * 255, 0, 255).astype(np.uint8)).save(OUT / "night-mult.webp", quality=q)
    Image.fromarray(np.clip(add * 255, 0, 255).astype(np.uint8)).save(OUT / "night-add.webp", quality=q)
    (OUT / "night-lights.json").write_text(json.dumps({"canvas": {"width": W, "height": H}, "lights": lights + [lava]}, indent=1))

    # --- bioluminescence in the water ---
    b = CFG["bioluminescence"]
    mare = np.asarray(Image.open(PACK / "layers" / "Mare.webp").convert("RGBA")).astype(np.float32)
    lum = mare[..., :3].mean(axis=2)
    shallow_full = np.asarray(Image.open(PACK / "masks" / "shallow_mask.webp").convert("RGBA")).astype(np.float32)[..., 3] / 255
    sb = b["seabed"]
    seabed = np.clip((cv2.GaussianBlur(lum, (0, 0), sb["radius"]) - lum - sb["minContrast"]) / sb["range"], 0, 1) * shallow_full * (mare[..., 3] / 255)
    seabed = cv2.resize(cv2.GaussianBlur(seabed, (0, 0), sb["blur"]), (w, h), interpolation=cv2.INTER_AREA)
    shallow = cv2.resize(shallow_full, (w, h), interpolation=cv2.INTER_AREA) * np.clip(sea, 0, 1)
    fo = b["foam"]
    foam = np.asarray(Image.open(PACK / "masks" / "foam_clean.webp").convert("RGBA")).astype(np.float32)[..., 3] / 255
    foam = cv2.resize(cv2.GaussianBlur(foam, (0, 0), fo["blur"]), (w, h), interpolation=cv2.INTER_AREA)
    bid = np.asarray(Image.open(PACK / "biome_ids.png")).astype(np.int32)
    rf, by = b["reef"], b["bayou"]
    reef = cv2.GaussianBlur(cv2.resize((bid == b["biomes"]["reef"]).astype(np.float32), (w, h), interpolation=cv2.INTER_AREA), (0, 0), rf["blur"]) * np.clip(sea, 0, 1)
    inner = cv2.resize(mask("internal_water_mask.webp"), (w, h), interpolation=cv2.INTER_AREA)
    bayou = cv2.resize((bid == b["biomes"]["bayou"]).astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)
    bayou_w = cv2.GaussianBlur(cv2.GaussianBlur(bayou, (0, 0), by["blurBiome"]) * inner, (0, 0), by["blurWater"])
    sh = b["shallow"]
    deep = np.clip(sea, 0, 1) * (1 - np.clip(shallow * sh["deepFromShallowK"], 0, 1))
    pa, sp = b["patches"], b["sparks"]
    for f in b["files"]:
        rng = np.random.default_rng(f["seed"])
        nz = cv2.GaussianBlur(rng.random((h, w)).astype(np.float32), (0, 0), pa["blur"])
        nz = (nz - nz.min()) / (nz.max() - nz.min())
        patch = np.clip((nz - pa["from"]) / pa["range"], 0, 1) ** pa["power"]
        dots = cv2.GaussianBlur((rng.random((h, w)) > 1 - sp["density"]).astype(np.float32), (0, 0), sp["blur"]) * sp["gain"]
        water = shallow * (sh["floor"] + sh["patch"] * patch) + reef * rf["strength"] * patch \
            + np.clip(bayou_w * by["gain"], 0, 1) * by["strength"] * (by["floor"] + (1 - by["floor"]) * patch) \
            + np.clip(foam * fo["gain"], 0, 1) * fo["strength"] + deep * dots * b["deepSparks"]
        bed_m = np.clip(seabed * sb["gain"], 0, 1)
        bed = bed_m * (sb["floor"] + (1 - sb["floor"]) * patch) + bed_m * dots * sb["sparks"]
        v = water[..., None] * rgb(b["plankton"]) + bed[..., None] * rgb(b["coral"])
        Image.fromarray(np.clip(v * 255, 0, 255).astype(np.uint8)).save(OUT / f["name"], quality=q)

    print(f"lights: {len(lights)} windows + lava; plates {w}x{h} + {len(b['files'])} bio -> {OUT}")


if __name__ == "__main__":
    main()
