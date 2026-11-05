import numpy as np, cv2
from PIL import Image
D = '.mw/specs/hud-real/C1/hybrid/'
pol = np.load(D + 'polar.npy')                    # (2880, 210, 3): row = angle*8, col = radius px
A, R, _ = pol.shape
import sys
a0, a1 = int(sys.argv[1]), int(sys.argv[2])
pol = np.roll(pol, -a0 * 8 if a0 < 0 else 0, axis=0)
if a0 < 0: a1 = a1 - a0; a0 = 0                                  # sample arc (deg), chosen on the polar strip
seg = pol[a0 * 8:a1 * 8].astype(np.float32)        # (360, 210, 3)
# remove the light baked into the sample: divide by its own mean-brightness profile along the arc
lum = seg.mean(axis=(1, 2), keepdims=True)
lum_s = cv2.GaussianBlur(lum[:, :, 0], (1, 61), 0)[:, :, None]
flat = seg / np.maximum(lum_s, 1) * lum_s.mean()
tile = np.concatenate([flat, flat[::-1]] * 4, axis=0)   # 8 arcs, mirrored at every 45 deg: symmetric about both axes
# global light again, one rule for the whole ring (up-left)
ang = (np.arange(A) / 8.0)[:, None, None]
f = 0.66 + 0.62 * (0.5 + 0.5 * np.cos(np.deg2rad(ang - 225)))
lit = np.clip(tile * f * 0.95, 0, 255).astype(np.uint8)
rin, rout = 143, 183
ring = cv2.warpPolar(lit, (420, 420), (210, 210), 210, cv2.WARP_POLAR_LINEAR + cv2.WARP_INVERSE_MAP + cv2.INTER_CUBIC)
yy, xx = np.mgrid[:420, :420]; r = np.hypot(xx - 209.5, yy - 209.5)
alpha = np.clip(np.minimum(r - rin, rout - r) / 2.5 + 0.5, 0, 1)
rgba = np.dstack([ring, (alpha * 255).astype(np.uint8)])
Image.fromarray(rgba).save(D + 'ring.png')
bg = Image.new('RGBA', (420, 420), (22, 117, 173, 255)); bg.alpha_composite(Image.fromarray(rgba)); bg.save(D + 'ring-teal.png')
# symmetry measure: difference to its mirror (left-right and up-down) on the alpha-weighted ring
g = ring.astype(np.float32).mean(2); m = alpha > 0.5
for name, flip in (('LR', g[:, ::-1]), ('UD', g[::-1, :])):
    print('asym', name, round(float(np.abs(g - flip)[m].mean()), 2))
