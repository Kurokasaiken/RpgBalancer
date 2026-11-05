import numpy as np, cv2
from PIL import Image
D = '.mw/specs/hud-real/C1/'
img = cv2.cvtColor(cv2.imread(D + 'S1-row0-swinir.png'), cv2.COLOR_BGR2RGB)
cx, cy = 86.8 * 4, 47.1 * 4
R, A = 210, 2880        # radius samples (px), angle samples (0.125 deg each)
pol = cv2.warpPolar(img, (R, A), (cx, cy), R, cv2.WARP_POLAR_LINEAR + cv2.INTER_CUBIC)  # rows = angle, cols = radius
np.save(D + 'hybrid/polar.npy', pol)
# contact sheet: the unwrapped annulus, rotated so angle runs left->right; r from 120 to 205
strip = pol[:, 120:206]                       # (A, 86, 3)
strip = np.rot90(strip, k=-1)                 # now width = angle
Image.fromarray(strip.copy()).resize((1440, 258), Image.LANCZOS).save(D + 'hybrid/polar-strip.png')
print(strip.shape)
