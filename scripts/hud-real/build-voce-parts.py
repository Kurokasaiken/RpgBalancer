#!/usr/bin/env python3
"""PLAN-112 F4: split the Voce piece and mint the standalone delicate plaque frame.

Director rulings (2026-11-05):
  - closing Voce must hide ONLY the plaque (bandiera): the bust stays -> `voce/bust.webp` is a clean
    cut of the piece left of the plaque's rounded end (x<385, through the foliage);
  - the roster name plaque and the "esito spedizione" toast must carry the SAME delicate frame as
    Voce's plaque (thin double gold rail + ornate pointed end) -> `voce/frame-<w>.webp` rebuilds the
    band standalone: the clean right end is mirrored for the left, the flat field stretches in between
    (vertical squash to the target height keeps the rails thin = 'delicato').

Outputs: voce/bust.webp, voce/frame-200.webp (roster placca), voce/frame-320.webp (toast),
and voce/frameGeometry.json with each frame's dark-glass text field (design px).
Usage: tools/hud-real/venv/bin/python -I scripts/hud-real/build-voce-parts.py
"""
import json
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = f'{ROOT}/public/assets/ui/hud-real/voce/piece.webp'
OUT = f'{ROOT}/public/assets/ui/hud-real/voce'
BAND_Y0, BAND_Y1 = 71, 271          # the plaque band (2x px)
CLEAN_X = 515                        # foliage-free start of the flat field
RIGHT_END_X = 745                    # the ornate pointed end starts here
PIECE_W = 880


def emit_frame(im, target_w2x, name):
    """Compose a standalone plaque at width target_w2x (2x): mirrored right end + stretched field."""
    band = im[BAND_Y0:BAND_Y1]
    end = band[:, RIGHT_END_X:PIECE_W]
    mid = band[:, CLEAN_X:RIGHT_END_X]
    endw = end.shape[1]
    mid2 = cv2.resize(mid, (target_w2x - 2 * endw, band.shape[0]), interpolation=cv2.INTER_AREA)
    frame = np.concatenate([np.flip(end, axis=1), mid2, end], axis=1)
    cv2.imwrite(f'{OUT}/{name}.webp', frame, [cv2.IMWRITE_WEBP_QUALITY, 98])
    return frame


def field_rect(frame):
    """The dark emerald field inside the frame (where live text sits)."""
    a = frame[..., 3]
    lum = (frame[..., 0].astype(np.int32) * 29 + frame[..., 1].astype(np.int32) * 59 + frame[..., 2].astype(np.int32) * 11) // 100
    dark = ((lum < 55) & (a > 128)).astype(np.uint8)
    n, _, st, _ = cv2.connectedComponentsWithStats(dark, connectivity=4)
    fc = [i for i in range(1, n) if st[i, cv2.CC_STAT_WIDTH] > 1.5 * st[i, cv2.CC_STAT_HEIGHT]]
    fc.sort(key=lambda i: -st[i, cv2.CC_STAT_AREA])
    x, y, w, h, _ = st[fc[0]]
    return {'x': round(x / 2, 1), 'y': round(y / 2, 1), 'w': round(w / 2, 1), 'h': round(h / 2, 1)}


def main():
    im = cv2.imread(SRC, cv2.IMREAD_UNCHANGED)
    # bust 'drawn without the plaque' (Director: the straight x-cut looked amputated): keep the whole
    # medallion cluster out to the foliage's organic edge (~x520), erase ONLY the flat plaque field
    # under the leaves (dark emerald), keeping bright foliage/rail strokes as organic ornament.
    bust = im[:, :520].copy()
    lum = (bust[..., 0].astype(np.int32) * 29 + bust[..., 1].astype(np.int32) * 59 + bust[..., 2].astype(np.int32) * 11) // 100
    zone = np.zeros(bust.shape[:2], bool)
    zone[60:285, 390:] = True                       # the plaque band zone, right of the medallion face
    bust[..., 3] = np.where(zone & (lum < 78), 0, bust[..., 3])
    field = np.zeros(bust.shape[:2], bool)
    field[95:275, 365:] = True                      # field + its left frame edge inside the zone
    bust[..., 3] = np.where(field & (lum < 165), 0, bust[..., 3])
    # drop the thin filigree underline: bottom rows whose ink covers <20% of the width
    a = bust[..., 3]
    for y in range(bust.shape[0] - 60, bust.shape[0]):
        if (a[y] > 8).mean() < 0.20:
            a[y] = 0
    # NO alpha-crop: the bust must stay registered 1:1 with the piece so the plaque overlay
    # covers the erased zone seamlessly (Director: the offset crop left a hole mid-component)
    cv2.imwrite(f'{OUT}/bust.webp', bust, [cv2.IMWRITE_WEBP_QUALITY, 98])
    geo = {}
    for w2x, name in ((400, 'frame-200'), (640, 'frame-320')):
        frame = emit_frame(im, w2x, name)
        geo[name.replace('.webp', '')] = {'w': w2x // 2, 'h': (BAND_Y1 - BAND_Y0) // 2, 'field': field_rect(frame)}
    with open(f'{OUT}/frameGeometry.json', 'w') as f:
        json.dump(geo, f, indent=2)
    print(json.dumps(geo, indent=1))


if __name__ == '__main__':
    main()
