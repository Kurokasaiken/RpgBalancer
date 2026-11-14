"""Regression checks for compositing the radial material on the painted map."""

import math
import unittest
from pathlib import Path

from PIL import Image


ASSETS = Path(__file__).resolve().parents[3] / "public/assets/ui/poi-radial"


def sample(image: Image.Image, radius: float, degrees: float) -> int:
    """Return alpha at a normalized radial position on a square plate."""
    cx = image.width / 2
    x = round(cx + cx * radius * math.cos(math.radians(degrees)))
    y = round(cx + cx * radius * math.sin(math.radians(degrees)))
    return image.getpixel((x, y))[3]


class RadialAssetCompositingTest(unittest.TestCase):
    def test_frame_has_real_transparency_and_preserves_gold_ribs(self):
        frame = Image.open(ASSETS / "disc-base.webp").convert("RGBA")
        self.assertLess(sample(frame, 0.99, -60), 10)  # no baked checkerboard
        self.assertLess(sample(frame, 0.55, -65), 10)  # see map through socket
        self.assertGreater(sample(frame, 0.55, -45), 180)  # rib remains
        self.assertGreater(sample(frame, 0.85, -65), 180)  # outer rim remains

    def test_family_plates_contain_only_enamel_not_extra_medallions(self):
        for name in ("job", "quest", "event"):
            with self.subTest(name=name):
                plate = Image.open(ASSETS / f"disc-{name}.webp").convert("RGBA")
                self.assertGreater(sample(plate, 0.55, -65), 180)
                self.assertLess(sample(plate, 0.3, -65), 10)  # no second hub
                self.assertLess(sample(plate, 0.85, -65), 10)  # no second rim


if __name__ == "__main__":
    unittest.main()
