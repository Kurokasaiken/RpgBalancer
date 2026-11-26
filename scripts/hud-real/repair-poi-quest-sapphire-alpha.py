#!/usr/bin/env python3
"""Repair the quest POI sapphire seats (R-388).

The production quest base was registered from the native sapphire frame at
scale 1.310 / offset (342,340), but its alpha was then clipped inside the
cardinal jewel seats. The clipped pixels are still present in the native
frame; because the far-zoom light asset was baked from the defective base,
the same holes propagate there.

This script restores only the four cardinal gem-seat ellipses:
- `poi-quest-base.webp` receives the missing native-frame pixels;
- `poi-quest-base.webp` and `poi-quest-top.webp` receive the local north-gem
  color normalization;
- `poi-quest-light.webp` is patched underneath with the simplified light-piece
  donor generated from the repaired detail composite, preserving the shipped
  light asset everywhere else, then receives the same north-gem normalization.

The native north sapphire is much paler than the other cardinal gems. After the
alpha repair, the script therefore applies a bounded color correction inside the
north gemstone only, preserving its native facets, alpha and outer silhouette
while making it read as the same sapphire material.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
POI_DIR = ROOT / "public/assets/ui/hud-real/poi"
LAYER_DIR = POI_DIR / "layers"
BASE_PATH = LAYER_DIR / "poi-quest-base.webp"
TOP_PATH = LAYER_DIR / "poi-quest-top.webp"
LIGHT_PATH = LAYER_DIR / "poi-quest-light.webp"
NATIVE_FRAME_PATH = POI_DIR / "poi-quest-frame.webp"

# Registration of the production quest base, documented in the PLAN-117
# handoff errata and verified by exact alpha containment against the shipped
# layer. The larger-than-silhouette scale is deliberate: it registers the
# native sapphire facets under the green-frame top ornament.
NATIVE_SCALE = 1.310
NATIVE_OFFSET = (342, 340)

# Cardinal sapphire-seat regions in canvas coordinates. They are deliberately
# local: the repair must not widen the approved outer silhouette of the marker.
GEM_SEAT_ELLIPSES = (
    (335, 755, 675, 1005),    # west
    (1115, 755, 1455, 1005),  # east
    (765, 325, 1020, 595),    # north
    (755, 1265, 1030, 1555),  # south
)

NORTH_SAPPHIRE_POLYGON = ((892, 398), (837, 455), (892, 512), (948, 455))
NORTH_SATURATION_FLOOR = 0.68
NORTH_VALUE_REDUCTION = 0.14
NORTH_HUE_PULL = 0.25
SAPPHIRE_TARGET_HUE = 0.615

# Light-piece simplification geometry, mirrored from the approved
# `.mw/specs/poi-map-icon/build-light.py` recipe.
RING_CENTRE = (892.49, 878.20)
RING_IN = 332
RING_OUT = 420


def native_reference(size: tuple[int, int]) -> Image.Image:
    """Returns the native quest frame registered on the full layer canvas."""
    source = Image.open(NATIVE_FRAME_PATH).convert("RGBA")
    scaled_size = (int(source.width * NATIVE_SCALE), int(source.height * NATIVE_SCALE))
    scaled = source.resize(scaled_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(scaled, NATIVE_OFFSET)
    return canvas


def gem_seat_mask(size: tuple[int, int]) -> np.ndarray:
    """Builds the union mask of the four cardinal sapphire-seat ellipses."""
    mask_image = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask_image)
    for ellipse in GEM_SEAT_ELLIPSES:
        draw.ellipse(ellipse, fill=255)
    return np.array(mask_image) > 0


def north_sapphire_region(size: tuple[int, int]) -> np.ndarray:
    """Builds the feathered inner north-sapphire region as a float mask."""
    mask_image = Image.new("L", size, 0)
    ImageDraw.Draw(mask_image).polygon(NORTH_SAPPHIRE_POLYGON, fill=255)
    mask_image = mask_image.filter(ImageFilter.GaussianBlur(1.2))
    return np.array(mask_image).astype(np.float32) / 255.0


def rgb_to_hsv(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Converts float RGB in [0,1] to vectorized HSV channels."""
    r, g, b = np.moveaxis(rgb, -1, 0)
    maximum = np.max(rgb, axis=-1)
    minimum = np.min(rgb, axis=-1)
    delta = maximum - minimum
    hue = np.zeros_like(maximum)
    nonzero = delta > 1e-6

    red_max = nonzero & (maximum == r)
    hue[red_max] = ((g[red_max] - b[red_max]) / delta[red_max]) % 6
    green_max = nonzero & (maximum == g)
    hue[green_max] = (b[green_max] - r[green_max]) / delta[green_max] + 2
    blue_max = nonzero & (maximum == b)
    hue[blue_max] = (r[blue_max] - g[blue_max]) / delta[blue_max] + 4

    saturation = np.where(maximum > 1e-6, delta / np.maximum(maximum, 1e-6), 0)
    return hue / 6.0, saturation, maximum


def hsv_to_rgb(hue: np.ndarray, saturation: np.ndarray, value: np.ndarray) -> np.ndarray:
    """Converts vectorized HSV channels back to float RGB in [0,1]."""
    hue6 = (hue % 1.0) * 6.0
    sector = np.floor(hue6).astype(int)
    fraction = hue6 - sector
    p = value * (1.0 - saturation)
    q = value * (1.0 - fraction * saturation)
    t = value * (1.0 - (1.0 - fraction) * saturation)
    rgb = np.zeros((*hue.shape, 3), dtype=np.float32)
    sectors = (
        (value, t, p),
        (q, value, p),
        (p, value, t),
        (p, q, value),
        (t, p, value),
        (value, p, q),
    )
    for index, (r, g, b) in enumerate(sectors):
        selected = (sector % 6) == index
        rgb[selected] = np.stack((r[selected], g[selected], b[selected]), axis=-1)
    return rgb


def normalize_north_sapphire(image: Image.Image, path: Path) -> tuple[Image.Image, int]:
    """Raises only low-saturation blue pixels inside the native north gem."""
    pixels = np.array(image).astype(np.float32)
    rgb = pixels[..., :3] / 255.0
    hue, saturation, value = rgb_to_hsv(rgb)
    r, g, b = np.moveaxis(rgb, -1, 0)

    blue_score = np.clip(((b - r) * 255.0 - 5.0) / 30.0, 0.0, 1.0) * np.clip(
        ((b - g) * 255.0 - 1.0) / 18.0,
        0.0,
        1.0,
    )
    weight = north_sapphire_region(image.size) * blue_score * (pixels[..., 3] / 255.0)

    graded_saturation = np.maximum(saturation, NORTH_SATURATION_FLOOR)
    needs_color_grade = (saturation < NORTH_SATURATION_FLOOR - 0.02).astype(np.float32)
    brightness = np.clip((value - 0.45) / 0.45, 0.0, 1.0)
    graded_value = value * (1.0 - NORTH_VALUE_REDUCTION * brightness * needs_color_grade)
    hue_delta = ((SAPPHIRE_TARGET_HUE - hue + 0.5) % 1.0) - 0.5
    graded_hue = (hue + hue_delta * NORTH_HUE_PULL * needs_color_grade) % 1.0
    graded_rgb = hsv_to_rgb(graded_hue, graded_saturation, graded_value) * 255.0
    mixed_rgb = rgb * 255.0 * (1.0 - weight[..., None]) + graded_rgb * weight[..., None]

    normalized = pixels.copy()
    normalized[..., :3] = np.clip(mixed_rgb, 0.0, 255.0)
    normalized_image = Image.fromarray(normalized.astype(np.uint8), "RGBA")
    changed = int(np.any(np.array(normalized_image) != np.array(image), axis=2).sum())
    if changed:
        save_webp(normalized_image, path)
    return normalized_image, changed


def save_webp(image: Image.Image, path: Path) -> None:
    """Writes the repaired asset at the production asset's lossy quality band."""
    image.save(path, "WEBP", quality=95, method=6)


def repair_base() -> tuple[Image.Image, int]:
    """Restores missing native pixels inside the quest base jewel seats."""
    base_image = Image.open(BASE_PATH).convert("RGBA")
    reference_image = native_reference(base_image.size)
    base = np.array(base_image)
    reference = np.array(reference_image)
    restore = gem_seat_mask(base_image.size) & (
        reference[..., 3].astype(np.int16) > base[..., 3].astype(np.int16)
    )
    repaired = base.copy()
    repaired[restore] = reference[restore]
    repaired_image = Image.fromarray(repaired, "RGBA")
    if restore.any():
        save_webp(repaired_image, BASE_PATH)
    return repaired_image, int(restore.sum())


def simplified_light_donor(base_image: Image.Image) -> Image.Image:
    """Builds the flattened light-piece donor from the repaired detail art."""
    detail = base_image.copy()
    detail.alpha_composite(Image.open(TOP_PATH).convert("RGBA"))

    cx, cy = RING_CENTRE
    annulus = Image.new("L", detail.size, 0)
    draw = ImageDraw.Draw(annulus)
    draw.ellipse((cx - RING_OUT, cy - RING_OUT, cx + RING_OUT, cy + RING_OUT), fill=255)
    draw.ellipse((cx - RING_IN, cy - RING_IN, cx + RING_IN, cy + RING_IN), fill=0)
    annulus = annulus.filter(ImageFilter.GaussianBlur(5))

    flattened = detail.copy()
    flattened.paste(detail.filter(ImageFilter.GaussianBlur(14)), (0, 0), annulus)
    return flattened


def repair_light(base_image: Image.Image) -> int:
    """Patches only the light asset's jewel seats using the repaired donor."""
    light_image = Image.open(LIGHT_PATH).convert("RGBA")
    donor = simplified_light_donor(base_image)

    # The light asset is already the topmost baked piece. Put the repaired
    # donor underneath it: transparent holes reveal the corrected art, while
    # existing opaque light pixels remain pixel-for-pixel authoritative.
    composited = donor.copy()
    composited.alpha_composite(light_image)

    seat_mask = gem_seat_mask(light_image.size)
    light = np.array(light_image)
    repaired = light.copy()
    # Only transparent/feathered pixels need the donor. Fully opaque light
    # pixels are already authoritative; leaving them untouched avoids codec
    # noise on already-opaque pixels.
    patch = seat_mask & (light[..., 3] < 250)
    repaired[patch] = np.array(composited)[patch]
    changed = int(np.any(repaired != light, axis=2).sum())
    if changed:
        save_webp(Image.fromarray(repaired, "RGBA"), LIGHT_PATH)
    return changed


def main() -> None:
    """Repairs alpha, normalizes the north sapphire, then rebuilds light seats."""
    repaired_base, base_pixels = repair_base()
    normalized_base, base_color_pixels = normalize_north_sapphire(repaired_base, BASE_PATH)

    top_image = Image.open(TOP_PATH).convert("RGBA")
    _, top_color_pixels = normalize_north_sapphire(top_image, TOP_PATH)

    light_pixels = repair_light(normalized_base)
    repaired_light = Image.open(LIGHT_PATH).convert("RGBA")
    _, light_color_pixels = normalize_north_sapphire(repaired_light, LIGHT_PATH)

    print(f"repaired {BASE_PATH}: restored {base_pixels} native pixels")
    print(f"normalized {BASE_PATH}: graded {base_color_pixels} north sapphire pixels")
    print(f"normalized {TOP_PATH}: graded {top_color_pixels} north sapphire pixels")
    print(f"repaired {LIGHT_PATH}: patched {light_pixels} light pixels")
    print(f"normalized {LIGHT_PATH}: graded {light_color_pixels} north sapphire pixels")


if __name__ == "__main__":
    main()
