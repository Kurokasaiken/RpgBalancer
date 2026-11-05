import sys; sys.path.insert(0, 'tools/hud-real')
import numpy as np
from PIL import Image
import hudreal as H
D = '.mw/specs/hud-real/C1/'
BAND = (21 * 4, 48 * 4)
for k, geo in (('top', True), ('row0', False), ('bottom', False)):
    up = np.asarray(Image.open(f'{D}S1-{k}-swinir.png').convert('RGB'))
    a = np.load(f'{D}S2-{k}-birefnet.npy')
    soft = H.refine_alpha(a, fill_holes=(k == 'top'))
    if geo:  # band under the emblem: measured strip of the prototype (hud-roster-crop.py BAND_X)
        soft[480:, BAND[0]:BAND[1]] = np.maximum(soft[480:, BAND[0]:BAND[1]], 1.0)
    if k == 'top':
        # allowed region from measured geometry (src px, x4): emblem disc r=104 @ (117,101), wing x>=140,
        # left pendant box, spike pendant box. The jungle blob lies outside all of them.
        import cv2
        allow = np.zeros(soft.shape, np.uint8)
        cv2.circle(allow, (117 * 4, 101 * 4), 104 * 4, 1, -1, cv2.LINE_AA)
        allow[:, 140 * 4:] = 1
        allow[160 * 4:216 * 4, 8 * 4:40 * 4] = 1
        allow[165 * 4:, 95 * 4:140 * 4] = 1
        allow[120 * 4:, 21 * 4:48 * 4] = 1
        allow = cv2.GaussianBlur(allow.astype(np.float32), (9, 9), 2.0)
        soft = soft * np.clip(allow * 1.4, 0, 1)
    soft, rem = H.strip_dark_fringe(up, soft, depth={'top': 8, 'row0': 10, 'bottom': 10}[k])
    print(k, 'fringe removed px', rem)
    rgb = H.decontaminate(up, soft)
    rgba = np.dstack([rgb, (soft * 255).round().astype(np.uint8)])
    Image.fromarray(rgba, 'RGBA').save(f'{D}S2-{k}.png')
    for name, col in (('magenta', (255, 0, 255)), ('navy', (10, 22, 34)), ('teal', (22, 117, 173))):
        bg = Image.new('RGBA', (up.shape[1], up.shape[0]), col + (255,)); bg.alpha_composite(Image.fromarray(rgba, 'RGBA')); bg.save(f'{D}S2-{k}-{name}.png')
    edge = (soft > 0) & (soft < 0.98)
    print(k, 'opaque%', round((soft > 0.5).mean() * 100, 1), 'edge px', int(edge.sum()))
