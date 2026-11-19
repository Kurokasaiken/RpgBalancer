#!/usr/bin/env python3
"""PLAN-127 — mechanical raster diff: slice-kit output vs oracle pieces.

Per-region instruments (PLAN-127 §3 step-5 "Strumenti di raster diff"):
  * corners / ornaments : strict RGBA diff — pixel count where any channel
    differs, plus max |delta| per channel (cut pixel-identical, tolerance ~0).
    The alpha channel is also diffed SEPARATELY: WebP lossy may rewrite RGB
    under alpha<255, so RGB noise under transparent px is reported but the
    alpha plane must match exactly.
  * edges               : CALIBRATED seam gate (night-shift 2026-11-19,
    replaces the retired mean-denominator seam-ratio which flagged 4/9
    shipped tiles):
      primary   seamVsP95 = wrapStep / max(P95 interior step, 0.5), on BOTH
                the RGB and the alpha plane — WARN >= 2.5, REJ >= 4.0;
      backstop  dispAbs = wrapStep x displayScale (display px mean |delta|),
                per pattern class — flat (interiorStepMean < 5): WARN >= 17,
                REJ >= 22; textured: WARN >= 27, REJ >= 32;
      verdict = worst of the three. displayScale resolution: manifest
                pieces[].displayScale -> manifest top-level displayScale ->
                --display-scale map -> dispAbs skipped (vsP95 still gates).
      The legacy mean-denominator ratio is still recorded for reference.
  * ornaments           : alpha-bbox (bounds of alpha>0) compared in
    addition to the strict diff.

Verdicts: PASS / WARN / FAIL per piece+instrument; table printed; a
conversion record is written to test-results/slicekit/<surface>.json
(PLAN-127 §5 feedback loop input).

Usage (from repo root, .mw/venv/bin/python):
  python scripts/hud-real/compare-to-oracle.py \
      --candidate-dir public/assets/ui/hud-real/slicekit/cornici \
      --oracle-dir public/assets/ui/hud-real/panel-frame3
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone

import numpy as np
from PIL import Image

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# ── calibrated seam gate (night-shift 2026-11-19, applied per the proposal) ─
# Source: test-results/slicekit/night-shift/seam-calibration.{json,md}
# The retired gate was seamRatio = wrapStep / mean(interiorStep) pass <=1.5 /
# fail >3 — its mean denominator -> ~0 on flat wires, flagging 4/9 APPROVED
# tiles while real defects sat an order of magnitude away (ratio 15-17).
# Primary instrument is the robust relative ratio; the absolute display-scaled
# step is the backstop for hot-textured strips where a relative metric
# under-fires. Autocorrelation is NOT a gate — it only feeds the class/record.
SEAM_VSP95_WARN = 2.5
SEAM_VSP95_FAIL = 4.0
SEAM_FLAT_MEAN = 5.0        # interiorStepMean < 5 => 'flat' pattern class
SEAM_DISPABS_WARN = {'flat': 17.0, 'textured': 27.0}
SEAM_DISPABS_FAIL = {'flat': 22.0, 'textured': 32.0}


def _resolve(path: str) -> str:
    """Resolve a CLI path against the repo root."""
    return path if os.path.isabs(path) else os.path.join(REPO_ROOT, path)


def load_rgba(path: str) -> np.ndarray:
    """Decode an image to an RGBA uint8 array."""
    return np.asarray(Image.open(path).convert('RGBA'))


def rgba_diff(a: np.ndarray, b: np.ndarray) -> dict:
    """Strict per-channel diff between two same-shaped RGBA arrays."""
    if a.shape != b.shape:
        return {'shapeMismatch': [list(a.shape), list(b.shape)]}
    d = np.abs(a.astype(np.int16) - b.astype(np.int16))
    return {
        'diffPx': int((d.max(2) > 0).sum()),
        'alphaDiffPx': int((d[:, :, 3] > 0).sum()),
        'rgbDiffPxOpaqueOnly': int(((d[:, :, :3].max(2) > 0) & (b[:, :, 3] == 255)).sum()),
        'maxDelta': [int(d[:, :, c].max()) for c in range(4)],
        'meanDeltaOnDiffPx': float(d.max(2)[d.max(2) > 0].mean()) if (d.max(2) > 0).any() else 0.0,
    }


def seam_ratio(tile: np.ndarray, axis: str) -> dict:
    """LEGACY instrument (recorded for reference, no longer the gate):
    wrap-boundary step / mean interior step on the tile's repeat axis.
    Retired by the night-shift calibration — the mean denominator -> ~0 on
    flat wires and flagged 4/9 shipped tiles.

    Step = mean |next - prev| over RGB channels and the full strip length.
    A seamless tile has the wrap step inside the interior distribution."""
    rgb = tile[:, :, :3].astype(np.float64)
    al = tile[:, :, 3].astype(np.float64)
    if axis == 'x':
        interior = np.abs(np.diff(rgb, axis=1)).mean()
        wrap = np.abs(rgb[:, 0] - rgb[:, -1]).mean()
        a_interior = np.abs(np.diff(al, axis=1)).mean()
        a_wrap = np.abs(al[:, 0] - al[:, -1]).mean()
    else:
        interior = np.abs(np.diff(rgb, axis=0)).mean()
        wrap = np.abs(rgb[0] - rgb[-1]).mean()
        a_interior = np.abs(np.diff(al, axis=0)).mean()
        a_wrap = np.abs(al[0] - al[-1]).mean()
    return {
        'rgb': float(wrap / interior) if interior > 0 else float('inf'),
        'alpha': float(a_wrap / a_interior) if a_interior > 0 else float('inf'),
        'wrapStep': float(wrap), 'interiorStep': float(interior),
    }


def plane_steps(plane: np.ndarray, axis: str) -> tuple[np.ndarray, float]:
    """Per-position |next - prev| steps along the repeat axis on ONE plane
    + the wrap step."""
    ax = 1 if axis == 'x' else 0
    steps = np.abs(np.diff(plane, axis=ax)).mean(
        axis=tuple(i for i in range(plane.ndim) if i != ax))
    wrap = float(np.abs(np.take(plane, 0, axis=ax)
                        - np.take(plane, -1, axis=ax)).mean())
    return steps, wrap


def interior_steps(tile: np.ndarray, axis: str) -> tuple[np.ndarray, float]:
    """Per-position |next - prev| steps along the repeat axis + the wrap step."""
    rgb = tile[:, :, :3].astype(np.float64)
    return plane_steps(rgb, axis)


def autocorr_summary(tile: np.ndarray, axis: str) -> dict:
    """Best LOCAL maximum of the normalized autocorrelation along the repeat
    axis (lag>=4, peak>0.25). argmax alone degenerates to lag~4 on any smooth
    signal; no local max = flat/aperiodic strip (the approved corpus is mostly
    aperiodic — engraved art is not pixel-periodic)."""
    lum = tile[:, :, :3].astype(np.float64) @ np.array([0.299, 0.587, 0.114])
    ax = 1 if axis == 'x' else 0
    s = lum.mean(axis=tuple(i for i in range(2) if i != ax))
    s = s - s.mean()
    denom = float((s * s).sum())
    L = len(s)
    if denom <= 0 or L < 16:
        return {'periodPx': None, 'peak': 0.0}
    ac = np.array([float((s[:L - k] * s[k:]).sum() / denom) for k in range(1, L // 2 + 1)])
    cands = [k + 1 for k in range(4, len(ac) - 1)
             if ac[k - 1] < ac[k] >= ac[k + 1] and ac[k] > 0.25]
    if not cands:
        return {'periodPx': None, 'peak': 0.0}
    p = max(cands, key=lambda k: ac[k - 1])
    return {'periodPx': int(p), 'peak': float(ac[p - 1])}


def seam_assess(tile: np.ndarray, axis: str,
                display_scale: float | None) -> dict:
    """CALIBRATED seam gate (night-shift 2026-11-19) — the default verdict.

    Primary: seamVsP95 = wrapStep / max(P95 interior steps, 0.5) on the RGB
    AND the alpha plane — WARN >= 2.5, REJ >= 4.0. Backstop: dispAbs =
    wrapStep x displayScale vs class-aware bounds (flat 17/22, textured
    27/32). class = 'flat' when interiorStepMean < SEAM_FLAT_MEAN. Verdict =
    worst of the three signals; dispAbs is skipped without a scale."""
    steps, wrap = interior_steps(tile, axis)
    a_steps, a_wrap = plane_steps(tile[:, :, 3].astype(np.float64), axis)
    mean = float(steps.mean())
    p95 = float(np.percentile(steps, 95))
    vs_p95 = float(wrap / max(p95, 0.5))
    a_p95 = float(np.percentile(a_steps, 95))
    a_vs_p95 = float(a_wrap / max(a_p95, 0.5))
    cls = 'flat' if mean < SEAM_FLAT_MEAN else 'textured'
    disp_abs = float(wrap * display_scale) if display_scale else None

    band = 'OK'
    if vs_p95 >= SEAM_VSP95_FAIL or a_vs_p95 >= SEAM_VSP95_FAIL:
        band = 'REJ'
    elif vs_p95 >= SEAM_VSP95_WARN or a_vs_p95 >= SEAM_VSP95_WARN:
        band = 'WARN'
    if disp_abs is not None:
        if disp_abs >= SEAM_DISPABS_FAIL[cls]:
            band = 'REJ'
        elif disp_abs >= SEAM_DISPABS_WARN[cls] and band != 'REJ':
            band = 'WARN'
    return {
        'band': band,
        'patternClass': cls,
        'seamVsP95': vs_p95,
        'alphaVsP95': a_vs_p95,
        'wrapStep': wrap,
        'interiorStepMean': mean,
        'interiorStepP95': p95,
        'displayScale': display_scale,
        'dispAbs': disp_abs,
        'autocorr': autocorr_summary(tile, axis),
    }


def display_scale_for(piece_id: str, manifest: dict | None,
                      cli_scales: dict[str, float]) -> float | None:
    """displayScale resolution order: manifest pieces[].displayScale (emitted
    from the spec slice field) -> manifest top-level displayScale ->
    --display-scale map (per-id then '*') -> None (dispAbs skipped)."""
    if manifest:
        for p in manifest.get('pieces', []):
            if p['id'] == piece_id and 'displayScale' in p:
                return float(p['displayScale'])
        if 'displayScale' in manifest:
            return float(manifest['displayScale'])
    return cli_scales.get(piece_id, cli_scales.get('*'))


def alpha_bbox(tile: np.ndarray) -> list[int] | None:
    """Bounding box (x0,y0,x1,y1) of alpha>0 — ornament footprint."""
    ys, xs = np.where(tile[:, :, 3] > 0)
    if len(xs) == 0:
        return None
    return [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]


def role_of(piece_id: str, manifest: dict | None) -> str:
    """Role from the candidate manifest; falls back to the id prefix."""
    if manifest:
        for p in manifest.get('pieces', []):
            if p['id'] == piece_id:
                return p['role']
    if piece_id.startswith('corner'):
        return 'corner'
    if piece_id.startswith('edge-top') or piece_id.startswith('edge-bottom'):
        return 'edge-x'
    if piece_id.startswith('edge'):
        return 'edge-y'
    return 'ornament'


def axis_of(role: str) -> str:
    """Repeat axis for an edge role."""
    return 'x' if role == 'edge-x' else 'y'


def main() -> int:
    """CLI entry: diff a slice-kit dir against an oracle dir."""
    ap = argparse.ArgumentParser(description='slice-kit vs oracle raster diff')
    ap.add_argument('--candidate-dir', required=True)
    ap.add_argument('--oracle-dir', required=True)
    ap.add_argument('--manifest', default=None,
                    help='candidate <surface>Frame.json (default: first *.json in candidate dir)')
    ap.add_argument('--record', default=None,
                    help='conversion record path (default test-results/slicekit/<surface>.json)')
    ap.add_argument('--sweep', action='store_true',
                    help='detail mode: per edge piece, also print seamVsP95 / alphaVsP95 / '
                         'pattern class / dispAbs / autocorrelation and the calibrated band '
                         '(the same instrument that IS the default gate, with full metrics).')
    ap.add_argument('--display-scale', default=None,
                    help='display scale for the dispAbs backstop: a single float applied '
                         'to every edge, or an inline JSON map {"edge-right": 0.29, ...}. '
                         'Used ONLY when the manifest carries no displayScale — resolution '
                         'order is manifest pieces[].displayScale -> manifest top-level '
                         'displayScale -> this map -> dispAbs skipped.')
    args = ap.parse_args()

    scales: dict[str, float] = {}
    if args.display_scale:
        try:
            scales = {k: float(v) for k, v in json.loads(args.display_scale).items()}
        except (json.JSONDecodeError, AttributeError):
            scales = {'*': float(args.display_scale)}

    cand_dir, orc_dir = _resolve(args.candidate_dir), _resolve(args.oracle_dir)
    manifest = None
    mpath = args.manifest
    if mpath is None:
        for f in sorted(os.listdir(cand_dir)):
            if f.endswith('.json'):
                mpath = os.path.join(args.candidate_dir, f)
                break
    if mpath:
        with open(_resolve(mpath), 'r', encoding='utf-8') as fh:
            manifest = json.load(fh)

    cand_files = sorted(f for f in os.listdir(cand_dir) if f.endswith('.webp'))
    orc_files = set(f for f in os.listdir(orc_dir) if f.endswith('.webp'))

    rows: list[dict] = []
    missing = [f for f in cand_files if f not in orc_files]
    for name in cand_files:
        if name not in orc_files:
            continue
        pid = name[:-5]
        role = role_of(pid, manifest)
        cand = load_rgba(os.path.join(cand_dir, name))
        orc = load_rgba(os.path.join(orc_dir, name))
        row: dict = {'piece': pid, 'role': role}

        diff = rgba_diff(cand, orc)
        row['diff'] = diff
        # FIDELITY verdict: does the candidate reproduce the oracle piece?
        row['verdict'] = 'PASS' if diff.get('diffPx') == 0 else 'FAIL'
        if diff.get('alphaDiffPx', 0) > 0:
            row['verdict'] = 'FAIL'  # alpha plane must match exactly

        if role in ('edge-x', 'edge-y'):
            ax = axis_of(role)
            # Legacy mean-denominator ratio — recorded for reference only.
            row['seamCandidate'] = seam_ratio(cand, ax)
            row['seamOracle'] = seam_ratio(orc, ax)
            # TILEABILITY filter (PLAN-127 rejection filter) — a separate
            # signal from fidelity: it measures the tile itself, so it
            # applies to the oracle baseline too. Calibrated instrument:
            # seamVsP95 (RGB + alpha) primary, dispAbs class-aware backstop.
            row['seam'] = seam_assess(
                cand, ax, display_scale_for(pid, manifest, scales))
            row['seamVerdict'] = row['seam']['band']
        if role == 'ornament':
            row['alphaBBoxCandidate'] = alpha_bbox(cand)
            row['alphaBBoxOracle'] = alpha_bbox(orc)
        rows.append(row)

    # ── report ──
    print(f'{"piece":14s} {"role":8s} {"diffPx":>7s} {"aDiff":>6s} {"rgbDiff@a255":>12s} '
          f'{"maxD":>12s} {"vsP95":>6s} {"class":>9s} {"dispAbs":>8s} {"tile":>5s} {"fidelity":>8s}')
    print('-' * 98)
    for r in rows:
        d = r['diff']
        if 'shapeMismatch' in d:
            print(f"{r['piece']:14s} {r['role']:8s} SHAPE {d['shapeMismatch']} -> FAIL")
            r['verdict'] = 'FAIL'
            continue
        sm = r.get('seam')
        vs = f"{sm['seamVsP95']:.2f}" if sm else '-'
        cl = sm['patternClass'] if sm else '-'
        da = f"{sm['dispAbs']:.2f}" if sm and sm['dispAbs'] is not None else '-'
        sv = r.get('seamVerdict', '-')
        print(f"{r['piece']:14s} {r['role']:8s} {d['diffPx']:>7d} {d['alphaDiffPx']:>6d} "
              f"{d['rgbDiffPxOpaqueOnly']:>12d} {str(d['maxDelta']):>12s} {vs:>6s} {cl:>9s} "
              f"{da:>8s} {sv:>5s} {r['verdict']:>8s}")
    for name in missing:
        print(f'{name[:-5]:14s} {"?":8s} MISSING IN ORACLE -> FAIL')

    fidelity = 'PASS' if not missing and all(r['verdict'] == 'PASS' for r in rows) else 'FAIL'
    seam_rejects = [r['piece'] for r in rows if r.get('seamVerdict') == 'REJ']
    seam_warns = [r['piece'] for r in rows if r.get('seamVerdict') == 'WARN']
    print('-' * 98)
    print(f'FIDELITY vs oracle: {fidelity}  ({len(rows)} pieces vs {len(orc_files)} oracle files)')
    if seam_rejects or seam_warns:
        print(f'SEAM FILTER findings (calibrated tileability gate): '
              f'REJ={seam_rejects or "[]"} WARN={seam_warns or "[]"}')
    else:
        print('SEAM FILTER: all tiles within calibrated band '
              '(vsP95<2.5, dispAbs under class bound)')

    if args.sweep:
        print('-' * 98)
        print('SEAM DETAIL (the calibrated default gate, full metrics):')
        print(f'{"piece":14s} {"class":9s} {"vsP95":>6s} {"aVsP95":>7s} {"dispAbs":>8s} '
              f'{"scale":>6s} {"acPer":>6s} {"acPk":>5s} {"band":>5s}')
        for r in rows:
            sm = r.get('seam')
            if not sm:
                continue
            da = f"{sm['dispAbs']:8.2f}" if sm['dispAbs'] is not None else '       -'
            sc = f"{sm['displayScale']:.2f}" if sm['displayScale'] else '   -  '
            ac = sm['autocorr']
            print(f"{r['piece']:14s} {sm['patternClass']:9s} {sm['seamVsP95']:6.2f} "
                  f"{sm['alphaVsP95']:7.2f} {da} {sc:>6s} "
                  f"{str(ac['periodPx']):>6s} {ac['peak']:5.2f} {sm['band']:>5s}")
        print('bounds: vsP95 (RGB+alpha) warn>=2.5 rej>=4.0 | dispAbs warn/rej '
              'flat 17/22, textured 27/32 (display px mean |Δ|)')

    verdict = fidelity

    # ── conversion record (PLAN-127 §5) ──
    surface = (manifest or {}).get('surface', os.path.basename(cand_dir.rstrip('/')))
    record = {
        'surface': surface,
        'recordedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'specVersion': (manifest or {}).get('specVersion'),
        'golden_sha256': (manifest or {}).get('source', {}).get('sha256'),
        'candidate_dir': os.path.relpath(cand_dir, REPO_ROOT),
        'oracle_dir': os.path.relpath(orc_dir, REPO_ROOT),
        'pieces_emitted': len(cand_files),
        'bytes': sum(os.path.getsize(os.path.join(cand_dir, f)) for f in cand_files),
        'checks': rows,
        'seam_rejections': [
            {'piece': r['piece'],
             'metric': 'seamVsP95+dispAbs (calibrated night-shift 2026-11-19)',
             'seamVsP95': r['seam']['seamVsP95'],
             'alphaVsP95': r['seam']['alphaVsP95'],
             'patternClass': r['seam']['patternClass'],
             'dispAbs': r['seam']['dispAbs'],
             'displayScale': r['seam']['displayScale'],
             'wrapStep': r['seam']['wrapStep'],
             'legacySeamRatio': {'candidate': r['seamCandidate']['rgb'],
                                 'oracle': r['seamOracle']['rgb']},
             'band': r['seamVerdict']}
            for r in rows if r.get('seamVerdict') in ('WARN', 'REJ')
        ],
        'missing_in_oracle': missing,
        'verdict': verdict,
        'fidelity': fidelity,
        'notes': 'mechanical diff only — T-04 visual witness is the Director\'s gate',
    }
    rec_path = _resolve(args.record or f'test-results/slicekit/{surface}.json')
    os.makedirs(os.path.dirname(rec_path), exist_ok=True)
    with open(rec_path, 'w', encoding='utf-8') as fh:
        json.dump(record, fh, indent=2, ensure_ascii=False)
        fh.write('\n')
    print('record →', rec_path)

    return 0 if verdict == 'PASS' else (1 if verdict == 'FAIL' else 0)


if __name__ == '__main__':
    sys.exit(main())
