#!/usr/bin/env python3
"""Night-shift seam-instrument calibration (PLAN-127 §5 batch-review input).

Measures every repeatable strip in `public/assets/ui/hud-real/` (+ the zanara
band tile and the cornici slice-kit) with the candidate instruments:

  * seamRatio      — existing gate: wrap step / mean interior step (RGB+alpha)
  * seamVsP95      — wrap step / P95 of the interior step distribution
  * seamZ          — (wrap - mean) / std of interior steps
  * dispAbs        — wrapStep x displayScale (perceptual magnitude on screen)
  * autocorr       — normalized autocorrelation along the repeat axis:
                     best peak (lag, value) => detected period + regularity
  * wrapPeriodCorr — corr(last p samples, first p samples) at detected period
  * alpha band     — alpha seam ratio, semi-transparent share, edge alpha mean

Each approved tile is also measured after synthetic seam DAMAGE (cut-mid,
burn, foreign-end, no-wrapBlend regen where the source is available) so the
report can check which instrument separates approved-good from actual-bad.

Display scales are sourced from code (see the `scaleSrc` field per asset):
  * cornici EDGE_PX in PanelFrameOrnaments.tsx (line ~55)
  * HudRealCassetto RAIL_W/u() vs cassettoColumnWidthFor (cassettoColumn.ts)
  * C1_RAIL in c1RailGeometry.ts (asset 2x), zanara kit band.w (2x asset)

Output: test-results/slicekit/night-shift/seam-calibration.json
Run:    .mw/venv/bin/python scripts/hud-real/seam-calibration.py
"""
from __future__ import annotations

import json
import os

import numpy as np
from PIL import Image

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(REPO, 'test-results/slicekit/night-shift/seam-calibration.json')

# ── inventory ────────────────────────────────────────────────────────────────
# axis = repeat axis of the strip. scale = display px / native px (None = no
# live consumer found; the comparator is display-agnostic anyway, scale only
# conditions the perceptual bound). `approved` = Director-witnessed/shipped.
INV = [
    # cornici slice-kit == panel-frame3 bytes (verified diffPx=0 in cornici.json);
    # the manifest is meant to drive the same EDGE_PX contract as the primitive.
    dict(id='cornici/edge-top',    path='public/assets/ui/hud-real/slicekit/cornici/edge-top.webp',
         axis='x', cls='organic', scale=30/116, approved=True,
         scaleSrc='EDGE_PX.top=30 / native h=116 (PanelFrameOrnaments.tsx:55, manifest corniciFrame.json)'),
    dict(id='cornici/edge-left',   path='public/assets/ui/hud-real/slicekit/cornici/edge-left.webp',
         axis='y', cls='organic', scale=24/71, approved=True,
         scaleSrc='EDGE_PX.left=24 / native w=71'),
    dict(id='cornici/edge-right',  path='public/assets/ui/hud-real/slicekit/cornici/edge-right.webp',
         axis='y', cls='thin-wire', scale=9/31, approved=True,
         scaleSrc='EDGE_PX.right=9 / native w=31 — the witness-v10 ~0.31x case (9/31=0.29)'),
    dict(id='cornici/edge-bottom', path='public/assets/ui/hud-real/slicekit/cornici/edge-bottom.webp',
         axis='x', cls='thin-wire', scale=7/24, approved=True,
         scaleSrc='EDGE_PX.bottom=7 / native h=24'),

    # panel-frame5 = the cornici variant actually rendered today (same golden).
    dict(id='pf5/edge-top',    path='public/assets/ui/hud-real/panel-frame5/edge-top.webp',
         axis='x', cls='organic', scale=30/39, approved=True, scaleSrc='EDGE_PX.top=30 / h=39'),
    dict(id='pf5/edge-left',   path='public/assets/ui/hud-real/panel-frame5/edge-left.webp',
         axis='y', cls='organic', scale=24/29, approved=True, scaleSrc='EDGE_PX.left=24 / w=29'),
    dict(id='pf5/edge-right',  path='public/assets/ui/hud-real/panel-frame5/edge-right.webp',
         axis='y', cls='thin-wire', scale=9/12, approved=True, scaleSrc='EDGE_PX.right=9 / w=12'),
    dict(id='pf5/edge-bottom', path='public/assets/ui/hud-real/panel-frame5/edge-bottom.webp',
         axis='x', cls='thin-wire', scale=7/10, approved=True, scaleSrc='EDGE_PX.bottom=7 / h=10'),

    # panel-frame4 / panel-frame2 — earlier candidate sets, no live consumer.
    dict(id='pf4/edge-top',    path='public/assets/ui/hud-real/panel-frame4/edge-top.webp',
         axis='x', cls='organic', scale=None, approved=False, scaleSrc='no consumer in src/'),
    dict(id='pf4/edge-bottom', path='public/assets/ui/hud-real/panel-frame4/edge-bottom.webp',
         axis='x', cls='organic', scale=None, approved=False, scaleSrc='no consumer'),
    dict(id='pf4/edge-left',   path='public/assets/ui/hud-real/panel-frame4/edge-left.webp',
         axis='y', cls='organic', scale=None, approved=False, scaleSrc='no consumer'),
    dict(id='pf4/edge-right',  path='public/assets/ui/hud-real/panel-frame4/edge-right.webp',
         axis='y', cls='organic', scale=None, approved=False, scaleSrc='no consumer'),
    dict(id='pf4/edge-thin-x', path='public/assets/ui/hud-real/panel-frame4/edge-thin-x.webp',
         axis='x', cls='thin-wire', scale=None, approved=False, scaleSrc='no consumer'),
    dict(id='pf4/edge-thin-y', path='public/assets/ui/hud-real/panel-frame4/edge-thin-y.webp',
         axis='y', cls='thin-wire', scale=None, approved=False, scaleSrc='no consumer'),
    dict(id='pf2/edge-left',   path='public/assets/ui/hud-real/panel-frame2/edge-left.webp',
         axis='y', cls='thin-wire', scale=None, approved=False, scaleSrc='no consumer'),
    dict(id='pf3/header-vine', path='public/assets/ui/hud-real/panel-frame3/header-vine.webp',
         axis='x', cls='organic', scale=None, approved=False,
         scaleSrc='no consumer — ornament strip, measured for reference'),

    # cassetto3 left rail: rail-mid is the repeat-y tile; top/bottom are caps.
    dict(id='cassetto3/rail-mid',    path='public/assets/ui/hud-real/cassetto3/rail-mid.webp',
         axis='y', cls='rail', scale=0.50, scaleRange=[0.44, 0.60], approved=True,
         scaleSrc='rail px = colW*100/1024, colW=min(0.5689*vh, 613) -> 0.44-0.60 (typ 0.50 @512px col)'),
    dict(id='cassetto3/rail-top',    path='public/assets/ui/hud-real/cassetto3/rail-top.webp',
         axis='y', cls='rail', scale=0.50, scaleRange=[0.44, 0.60], approved=True,
         scaleSrc='fixed cap (not a wrap tile) — reference only'),
    dict(id='cassetto3/rail-bottom', path='public/assets/ui/hud-real/cassetto3/rail-bottom.webp',
         axis='y', cls='rail', scale=0.50, scaleRange=[0.44, 0.60], approved=True,
         scaleSrc='fixed cap (not a wrap tile) — reference only'),

    # C1 roster rail: asset is 2x design px (c1RailGeometry.ts).
    dict(id='C1/rail-tile', path='public/assets/ui/hud-real/C1/rail-tile.webp',
         axis='y', cls='rail', scale=149.81/300, approved=True,
         scaleSrc='C1_RAIL.w=149.81 / asset w=300 (2x), tileH 96/192'),
    dict(id='C1/band-tile', path='public/assets/ui/hud-real/C1/band-tile.webp',
         axis='y', cls='rail', scale=None, approved=False, scaleSrc='no consumer (superseded by rail-tile?)'),

    # zanara roster band: asset is 2x; renders at w=14*1.25=17.5 CSS px.
    dict(id='zanara/band-tile', path='public/assets/ui/zanara/roster/band-tile.png',
         axis='y', cls='thin-wire', scale=17.5/28, approved=True,
         scaleSrc='ZG.band.w=14 x BAND_K=1.25 = 17.5px / asset w=28'),

    # gemini prototypes, no consumer.
    dict(id='cassetto/gemini-bar-1280', path='public/assets/ui/hud-real/cassetto/gemini-bar-1280.png',
         axis='y', cls='rail', scale=None, approved=False, scaleSrc='prototype, no consumer'),
    dict(id='cassetto/gemini-bar-1440', path='public/assets/ui/hud-real/cassetto/gemini-bar-1440.png',
         axis='y', cls='rail', scale=None, approved=False, scaleSrc='prototype, no consumer'),
]


def load(p):
    return np.asarray(Image.open(os.path.join(REPO, p)).convert('RGBA'))


def axis_dims(tile, axis):
    """(L along axis, W cross)."""
    h, w = tile.shape[:2]
    return (w, h) if axis == 'x' else (h, w)


def measure(tile: np.ndarray, axis: str, scale: float | None) -> dict:
    """All candidate instruments on one tile."""
    rgb = tile[:, :, :3].astype(np.float64)
    al = tile[:, :, 3].astype(np.float64)
    ax = 1 if axis == 'x' else 0

    steps = np.abs(np.diff(rgb, axis=ax)).mean(axis=tuple(i for i in range(3) if i != ax))
    wrap = np.abs(np.take(rgb, 0, axis=ax) - np.take(rgb, -1, axis=ax)).mean()
    interior = float(steps.mean())
    p95 = float(np.percentile(steps, 95))
    std = float(steps.std())

    a_steps = np.abs(np.diff(al, axis=ax)).mean(axis=tuple(i for i in range(2) if i != ax))
    a_wrap = np.abs(np.take(al, 0, axis=ax) - np.take(al, -1, axis=ax)).mean()
    a_interior = float(a_steps.mean())
    a_p95 = float(np.percentile(a_steps, 95))

    # 1-D signal along the repeat axis for autocorrelation
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    s = lum.mean(axis=tuple(i for i in range(2) if i != ax))
    s = s - s.mean()
    denom = float((s * s).sum())
    L = len(s)
    k_best, peak, wcorr, phase_ratio, s_phase = None, 0.0, 0.0, None, None
    if denom > 0 and L >= 16:
        ac = np.array([float((s[:L - k] * s[k:]).sum() / denom) for k in range(1, L // 2 + 1)])
        # period = strongest LOCAL maximum of r(k) at lag>=4 — argmax alone
        # degenerates to lag~4 on any smooth signal (ac decays from 1).
        cands = [k + 1 for k in range(4, len(ac) - 1)
                 if ac[k - 1] < ac[k] >= ac[k + 1] and ac[k] > 0.25]
        if cands:
            p = max(cands, key=lambda k: ac[k - 1])
            k_best, peak = int(p), float(ac[p - 1])
            wcorr = float(np.corrcoef(s[L - p:], s[:p])[0, 1])
            # phase-matched steps: interior steps at the same phase as the wrap
            phase_pos = [i for i in range(len(steps)) if i % p == (L - 1) % p]
            if phase_pos:
                s_phase = float(steps[phase_pos].mean())
                phase_ratio = float(wrap / max(s_phase, 0.5))

    semi = tile[:, :, 3]
    semi_frac = float(((semi > 0) & (semi < 255)).mean())
    a_first = float(np.take(al, 0, axis=ax).mean())
    a_last = float(np.take(al, -1, axis=ax).mean())

    return {
        'seamRatio': float(wrap / interior) if interior > 1e-9 else float('inf'),
        'seamVsP95': float(wrap / max(p95, 0.5)),
        'seamZ': float((wrap - interior) / std) if std > 1e-9 else 0.0,
        'wrapStep': float(wrap),
        'interiorStepMean': interior,
        'interiorStepP95': p95,
        'interiorStepMax': float(steps.max()),
        'interiorStepStd': std,
        'dispAbs': float(wrap * scale) if scale is not None else None,
        'alphaSeamRatio': float(a_wrap / a_interior) if a_interior > 1e-9 else None,
        'alphaVsP95': float(a_wrap / max(a_p95, 0.5)),
        'alphaStepP95': a_p95,
        'alphaWrapStep': float(a_wrap),
        'alphaSemiFrac': semi_frac,
        'alphaEdgeMean': [a_first, a_last],
        'autocorrPeriodPx': k_best,
        'autocorrPeak': peak,
        'wrapPeriodCorr': wcorr,
        'phaseMatchedStep': s_phase,
        'phaseRatio': phase_ratio,
    }


# ── synthetic seam damage (actual-bad controls) ─────────────────────────────
def dmg_cut62(tile, axis):
    L, _ = axis_dims(tile, axis)
    n = max(8, int(L * 0.62))
    return tile[:, :n] if axis == 'x' else tile[:n]


def dmg_burn(tile, axis, depth=6, delta=30.0):
    t = tile.copy().astype(np.float64)
    sl = (slice(None), slice(-depth, None)) if axis == 'x' else (slice(-depth, None), slice(None))
    t[sl + (slice(0, 3),)] = np.clip(t[sl + (slice(0, 3),)] - delta, 0, 255)
    return t.astype(np.uint8)


def dmg_foreign(tile, axis, foreign):
    t = tile.copy()
    L, W = axis_dims(tile, axis)
    depth = min(8, L // 4)
    f = foreign
    fh, fw = f.shape[:2]
    if axis == 'x':
        f2 = np.asarray(Image.fromarray(f).resize((depth, tile.shape[0]), Image.BILINEAR))
        t[:, -depth:] = f2
    else:
        f2 = np.asarray(Image.fromarray(f).resize((tile.shape[1], depth), Image.BILINEAR))
        t[-depth:, :] = f2
    return t


def noblend_cornici(piece_id, crop, axis):
    """The TRUE bad control: the cornici spec crop without wrapBlend."""
    src = Image.open(os.path.join(REPO, '.mw/runs/20261117-r357-frame-fix/frame-9slice.png')).convert('RGB')
    px = np.asarray(src.crop(crop[:2] + crop[2:]).convert('RGBA'))
    return px


def ramp_tile(w=40, L=240, axis='x'):
    g = np.linspace(30, 200, L)[None, :, None] * np.ones((w, L, 3))
    if axis == 'y':
        g = np.transpose(g, (1, 0, 2))
    a = np.full(g.shape[:2], 255, np.uint8)
    return np.dstack([g.astype(np.uint8), a])


def main():
    foreign_src = load('public/assets/ui/hud-real/C1/rail-tile.webp')

    # spec crops for the true no-wrapBlend negative (scripts/hud-real/specs/cornici.json)
    spec = json.load(open(os.path.join(REPO, 'scripts/hud-real/specs/cornici.json')))
    spec_crops = {s['id']: s['crop'] for s in spec['slices']}

    results = []
    for item in INV:
        tile = load(item['path'])
        L, W = axis_dims(tile, item['axis'])
        entry = dict(item)
        entry['nativePx'] = [int(tile.shape[1]), int(tile.shape[0])]
        entry['repeatLenPx'] = int(L)
        entry['crossPx'] = int(W)
        entry['metrics'] = measure(tile, item['axis'], item['scale'])

        negs = {}
        for name, t2 in [
            ('cut62', dmg_cut62(tile, item['axis'])),
            ('burn6@-30', dmg_burn(tile, item['axis'])),
            ('foreign8', dmg_foreign(tile, item['axis'], foreign_src)),
        ]:
            negs[name] = measure(t2, item['axis'], item['scale'])
        pid = item['id'].split('/')[-1]
        if item['id'].startswith('cornici/') and pid in spec_crops:
            negs['noblend-src-crop'] = measure(
                noblend_cornici(pid, spec_crops[pid], item['axis']), item['axis'], item['scale'])
        entry['negatives'] = negs
        results.append(entry)

    # global synthetic bad tiles
    synth = {
        'ramp-40x240': measure(ramp_tile(), 'x', 1.0),
        'ramp-0.3x': measure(ramp_tile(), 'x', 0.3),
    }

    out = {
        'generatedAt': __import__('datetime').datetime.now().isoformat(timespec='seconds'),
        'note': 'PLAN-127 §5 batch-review calibration input — proposal only, gate unchanged',
        'assets': results,
        'syntheticBad': synth,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as fh:
        json.dump(out, fh, indent=2)
        fh.write('\n')
    print('wrote', OUT)

    # compact console table
    print(f"{'asset':26s} {'cls':9s} {'scale':>5s} {'ratio':>7s} {'vsP95':>6s} {'wrap':>6s} "
          f"{'dispAbs':>7s} {'acPer':>5s} {'acPk':>5s} {'wCorr':>6s} {'aSemi':>6s}")
    for e in results:
        m = e['metrics']
        sc = f"{e['scale']:.2f}" if e['scale'] else '  -  '
        pr = f"{m['phaseRatio']:5.2f}" if m['phaseRatio'] is not None else '  -  '
        print(f"{e['id']:26s} {e['cls']:9s} {sc:>5s} {m['seamRatio']:7.2f} {m['seamVsP95']:6.2f} "
              f"{m['wrapStep']:6.2f} {('%7.2f' % m['dispAbs']) if m['dispAbs'] is not None else '      -'} "
              f"{str(m['autocorrPeriodPx']):>5s} {m['autocorrPeak']:5.2f} {m['wrapPeriodCorr']:6.2f} "
              f"{m['alphaSemiFrac']:6.3f} phR={pr}")


if __name__ == '__main__':
    main()
