import sys; sys.path.insert(0, 'tools/hud-real')
import numpy as np, cv2
from PIL import Image
import hudreal as H
D = '.mw/specs/hud-real/C1/'
# measured geometry (src px, hud-roster-crop.py), x4
HOLE = (86.8, 47.1); RING_R = 50.5
PLAQUE = np.array([(116, 10), (216, 10), (241, 43), (247, 45), (247, 50), (241, 52), (216, 86), (116, 86)], np.float32)
BAND = (21, 48)
M = 5  # margin src px
def allowed(h, w):
    a = np.zeros((h, w), np.uint8)
    a[:, (BAND[0] - 2) * 4:BAND[1] * 4] = 1
    cv2.circle(a, (round(HOLE[0] * 4), round(HOLE[1] * 4)), round((RING_R + 1) * 4), 1, -1, cv2.LINE_AA)
    left = a[:, :round(HOLE[0] * 4) + 1]
    pts = np.argwhere(left > 0)[:, ::-1].astype(np.int32)
    cv2.fillPoly(a, [cv2.convexHull(pts)], 1)
    cv2.fillPoly(a, [np.round(np.array([(88, 79), (95, 86), (88, 94), (81, 86)], np.float32) * 4).astype(np.int32)], 1)
    a = cv2.dilate(a, np.ones((M * 2 + 1, M * 2 + 1), np.uint8))
    pl = np.zeros((h, w), np.uint8)
    cv2.fillPoly(pl, [np.round(PLAQUE * 4).astype(np.int32)], 1)
    pl = cv2.dilate(pl, np.ones((2 * 2 * 4 + 1, 2 * 2 * 4 + 1), np.uint8))
    a = np.maximum(a, pl)
    return cv2.GaussianBlur(a.astype(np.float32), (7, 7), 1.5)
for i in range(4):
    k = f'row{i}'
    up = np.asarray(Image.open(f'{D}S1-{k}-swinir.png').convert('RGB'))
    a = np.load(f'{D}S2-{k}-birefnet.npy')
    soft = H.refine_alpha(a, fill_holes=False)
    soft = soft * np.clip(allowed(*soft.shape) * 1.6, 0, 1)
    soft, _ = H.strip_dark_fringe(up, soft, depth=10)
    rgb = H.decontaminate(up, soft)
    Image.fromarray(np.dstack([rgb, (soft * 255).round().astype(np.uint8)]), 'RGBA').save(f'{D}S2-{k}.png')
print('rows ok')
