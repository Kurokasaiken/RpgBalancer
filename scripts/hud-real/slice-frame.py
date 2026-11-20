#!/usr/bin/env python3
"""PLAN-127 infra pilot — unified slice-kit engine (MVP).

One PIL engine driven by a data-only JSON spec (`--spec <file>.json`), the
unified replacement for the ~10 surface-specific slicers. Anti-DSL rule: the
spec carries data only — no per-surface branches; every behaviour is a typed
op activated by spec fields.

Ops implemented (ONLY what the pilot oracles actually use — nothing
speculative; cornici: `scripts/build-panel-frame3-9slice.py`, cassetto:
`scripts/build-cassetto3-assets.py`, panel-frame5:
`scripts/build-panel-frame5-assets.py`):
  * `flatBgMaxDiff` keying   — alpha from max channel distance to a sampled
                               flat background (threshold + linear gain).
  * `lumaFloor` keying       — alpha = clip((max(R,G,B) - lo) * gain), the
                               cassetto oracle's `key_black` (keys true-black
                               ground without sampling a bg rect).
  * `colorClassDelta` keying — per-pixel colour-CLASS key (specVersion 2):
                               keep = max over `classes[]` of
                               (px[channel] - max(px[over]) + bias);
                               alpha = clip((keep - threshold) * gain). The
                               frame5 oracle's `keyart` (brass r-max(g,b),
                               gem g-max(r,b)-8) — keys by colour class on a
                               painted, non-flat ground where no sampleRect
                               exists.
  * `key` per-slice          — `slices[].key` overrides `source.key`
                               (specVersion 2): per-piece key dispatch —
                               e.g. class-keyed corners + explicit
                               `{"type":"none"}` opaque edges in one spec.
  * `despeckle`              — post-key morphology (specVersion 2): an opaque
                               px survives only with >= `minNeighbors` opaque
                               8-neighbours (the keyart speck filter).
  * `borderSoften`           — rim alpha floor ramp (specVersion 2): the last
                               `width` px on each side are multiplied by
                               minFactor*(i+1) — keeps a floor at the rim,
                               unlike tailFade which zeroes it.
  * `cutouts` / zeroAlpha    — punch alpha to 0 where a crop overlaps a
                               source rect (the frame's interior hole).
  * `tailFade`               — linear alpha ramp on the sides of a corner
                               piece that run into neighbouring edges.
  * `wrapBlend`              — crop `overlap` px longer than the emitted tile
                               along the wrap axis and crossfade the first
                               `overlap` px of the tile between the strip's
                               real continuation and its start (seamless
                               repeat; alpha = max, never faded).
  * `alphaOps`               — per-slice alpha-plane ops in order:
                               `minFilter` / `gaussianBlur` / `ellipseWindow`
                               (min(max(core, alpha), wide) — the cassetto
                               medal mask).
  * `postOps`                — per-slice RGBA ops after compositing:
                               `cropToAlpha` / `padSquare` / `resize`.
  * `regrade` (`goldHue`)    — typed colour regrade, passthrough to
                               `scripts/lib_grade_gold.grade_gold` (R-357
                               champagne palette).
  * `displayScale`           — per-slice display px / native px, copied into
                               the manifest piece (specVersion 2) — feeds the
                               comparator's dispAbs seam backstop.
  * `displaySize`            — per-slice explicit CSS display px [w,h]
                               (specVersion 2, render side): the authored
                               display dims the primitive renders the piece
                               at. Mutually exclusive with `displayScale`
                               (which DERIVES displaySize for the manifest).
                               Needed because the production primitive's
                               corner/stud dims are hand-tuned per axis —
                               not a clean scalar of the native crop.
  * `pos`                    — authored placement for corner|ornament
                               (specVersion 2, render side): CSS offsets
                               {left,right,top,bottom} in px (number) or %
                               (string), copied verbatim to the manifest.
                               Genuinely autorial — the golden-derived set
                               has no cutout hole to derive the piece's
                               panel-corner pixel from (holeCornerPx needs
                               `source.cutouts`, which would punch the art).
  * `span`                   — edge-only [before, after] px (specVersion 2,
                               render side): how far the strip extends
                               beyond the panel rect along its axis to tuck
                               under the corner art (before = left/top end,
                               after = right/bottom end). The rim-side
                               offset is DERIVED — -(displayThick -
                               geometry.rimOverlapPx) — never stored.
  * `variants`               — per-slice variant tag list (specVersion 2):
                               the primitive renders the piece only when the
                               active variant is listed (emblem-chest →
                               "corniciStash"). Absent = every variant.
  * `geometry.backings`      — DOM backfill patches (specVersion 2): solid
                               rects anchored at a panel corner behind the
                               frame — cover the crescent of backdrop left
                               between the bands' inner rims and the
                               plaque's rounded corner arc ("corner-bite"
                               contract, needs ≥2 surfaces: roster + stash
                               panels share it).
  * `output.tsModule`        — emit the PLAN-127 `<surface>Frame.ts` module
                               alongside the JSON manifest: {path,
                               typeImport, exportName?} — the generated TS
                               the primitive imports (OB-2: zero
                               hand-maintained geometry).
  * `plugin`                 — `plugins/<surface>.py` escape hatch for ops
                               the data-only spec cannot express (file must
                               carry a `# WHY-NOT-SPEC:` marker or emission
                               fails — PLAN-127 anti-DSL).

Fixed pipeline order per piece (matches oracle semantics):
  crop (+wrapBlend extension) -> key -> cutout punch -> despeckle -> alphaOps
  -> tailFade -> borderSoften -> wrapBlend -> postOps -> regrade ->
  WebP RGBA save.

Also emits `<surface>Frame` manifest JSON: corner px, edge thickness,
content insets, rimOverlap and per-piece anchor/stretch/tileSafe/
compositeMode plus the derived hole-boundary datum the renderer needs
(the frame's inner edge lands on the panel edge). `geometry.holes[]`
(runtime-bound windows — PLAN-127 `compositeMode:"hole-bound"`) emits a
manifest `ctaWindow` entry {shape, rect, inset, maskRef, marginPx}; the
primitive clips the live DOM element into the window at runtime via CSS
clip-path/mask — the slicer stays static and deterministic.

Validation: JSON Schema (structural) + PLAN-127 semantic rules:
  role corner|ornament => stretch:"none"; stretch:"tile" => tileSafe present;
  tileSafe:false => complete `fallback` block (authored segments) AND loud
  escalation (the pilot emits tileSafe:true only — never silent output);
  anchor coherent with role; tailFade only on corner|ornament; wrapBlend
  only on edge-*; crops (incl. wrap extension) inside source bounds;
  key type requires its params (flatBgMaxDiff: sampleRect/threshold/gain;
  lumaFloor: lo/gain); compositeMode:"hole-bound" => geometry.holes present
  + outerRect declared; hole rect (inflated by marginPx) never overlaps any
  main-source slice crop; sprite-mask holes => maskPiece names an emitted
  slice; plugin emission requires `plugins/<surface>.py` carrying a
  `# WHY-NOT-SPEC:` marker; budgets maxPieces/maxBytes fail loudly.

Usage (from repo root, .mw/venv/bin/python):
  python scripts/hud-real/slice-frame.py --spec scripts/hud-real/specs/cornici.json
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

try:
    import jsonschema
except ImportError:  # pragma: no cover - venv provides it; degrade to hand-rolled
    jsonschema = None

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

ROLES = ('corner', 'edge-x', 'edge-y', 'ornament')
ANCHORS_BY_ROLE = {
    'corner': {'tl', 'tr', 'bl', 'br'},
    'edge-x': {'top', 'bottom'},
    'edge-y': {'left', 'right'},
    'ornament': {'tl', 'tr', 'bl', 'br', 'top', 'bottom', 'left', 'right', 'explicit'},
}
CORNER_ANCHORS = {'tl', 'tr', 'bl', 'br'}

SCHEMA = {
    'type': 'object',
    'required': ['specVersion', 'surface', 'source', 'output', 'slices'],
    'properties': {
        'specVersion': {'type': 'integer', 'enum': [1, 2]},
        'surface': {'type': 'string', 'pattern': '^[a-z0-9-]+$'},
        'comment': {'type': 'string'},
        'source': {
            'type': 'object',
            'required': ['path'],
            'properties': {
                'path': {'type': 'string'},
                'key': {'$ref': '#/$defs/key'},
                'cutouts': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'required': ['rect', 'apply'],
                        'properties': {
                            'rect': {'$ref': '#/$defs/rect'},
                            'apply': {'type': 'string', 'enum': ['zeroAlpha']},
                            'comment': {'type': 'string'},
                        },
                        'additionalProperties': False,
                    },
                },
            },
            'additionalProperties': False,
        },
        'geometry': {
            'type': 'object',
            'properties': {
                'outerRect': {'$ref': '#/$defs/rect'},
                'contentRect': {'$ref': '#/$defs/rect'},
                'rimOverlapPx': {'type': 'number'},
                'holes': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'required': ['id', 'shape', 'rect'],
                        'properties': {
                            'id': {'type': 'string',
                                   'pattern': '^[a-z0-9-]+$'},
                            'shape': {'type': 'string',
                                      'enum': ['rect', 'sprite-mask']},
                            'rect': {'$ref': '#/$defs/rect'},
                            'maskPiece': {'type': 'string'},
                            'marginPx': {'type': 'integer', 'minimum': 0},
                            'comment': {'type': 'string'},
                        },
                        'additionalProperties': False,
                    },
                },
                'backings': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'required': ['anchor', 'w', 'h', 'color'],
                        'properties': {
                            'anchor': {'type': 'string',
                                       'enum': ['tl', 'tr', 'bl', 'br']},
                            'w': {'type': 'integer', 'minimum': 1},
                            'h': {'type': 'integer', 'minimum': 1},
                            'radius': {'type': 'string'},
                            'shape': {'type': 'string',
                                      'enum': ['rect', 'crescent']},
                            'color': {'type': 'string'},
                            'comment': {'type': 'string'},
                        },
                        'additionalProperties': False,
                    },
                },
                'comment': {'type': 'string'},
            },
            'additionalProperties': False,
        },
        'output': {
            'type': 'object',
            'required': ['dir'],
            'properties': {
                'dir': {'type': 'string'},
                'format': {'type': 'string', 'enum': ['webp']},
                'quality': {'type': 'integer', 'minimum': 0, 'maximum': 100},
                'alphaQuality': {'type': 'integer', 'minimum': 0, 'maximum': 100},
                'method': {'type': 'integer', 'minimum': 0, 'maximum': 6},
                'manifest': {'type': 'string'},
                'tsModule': {
                    'type': 'object',
                    'required': ['path', 'typeImport'],
                    'properties': {
                        'path': {'type': 'string'},
                        'typeImport': {'type': 'string'},
                        'exportName': {'type': 'string',
                                       'pattern': '^[a-zA-Z_$][a-zA-Z0-9_$]*$'},
                    },
                    'additionalProperties': False,
                },
            },
            'additionalProperties': False,
        },
        'budgets': {
            'type': 'object',
            'properties': {
                'maxPieces': {'type': 'integer', 'minimum': 1},
                'maxBytes': {'type': 'integer', 'minimum': 1},
            },
            'additionalProperties': False,
        },
        'slices': {
            'type': 'array',
            'minItems': 1,
            'items': {'$ref': '#/$defs/slice'},
        },
    },
    'additionalProperties': False,
    '$defs': {
        'rect': {
            'type': 'array',
            'items': {'type': 'integer'},
            'minItems': 4,
            'maxItems': 4,
        },
        'key': {
            'type': 'object',
            'required': ['type'],
            'properties': {
                'type': {'type': 'string',
                         'enum': ['flatBgMaxDiff', 'lumaFloor',
                                  'colorClassDelta', 'sourceAlpha', 'none']},
                'sampleRect': {'$ref': '#/$defs/rect'},
                'threshold': {'type': 'number'},
                'gain': {'type': 'number'},
                'lo': {'type': 'number'},
                'classes': {
                    'type': 'array',
                    'minItems': 1,
                    'items': {
                        'type': 'object',
                        'required': ['channel'],
                        'properties': {
                            'channel': {'type': 'string',
                                        'enum': ['r', 'g', 'b']},
                            'over': {'type': 'array',
                                     'items': {'type': 'string',
                                               'enum': ['r', 'g', 'b']},
                                     'minItems': 1, 'maxItems': 2},
                            'bias': {'type': 'number'},
                            'comment': {'type': 'string'},
                        },
                        'additionalProperties': False,
                    },
                },
                'comment': {'type': 'string'},
            },
            'additionalProperties': False,
        },
        'alphaOp': {
            'type': 'object',
            'required': ['op'],
            'properties': {
                'op': {'type': 'string',
                       'enum': ['minFilter', 'gaussianBlur', 'ellipseWindow']},
                'size': {'type': 'integer', 'minimum': 3},
                'radius': {'type': 'number'},
                'cx': {'type': 'number'}, 'cy': {'type': 'number'},
                'rx': {'type': 'number'}, 'ry': {'type': 'number'},
                'coreK': {'type': 'number'},
                'feather': {'type': 'number'},
            },
            'additionalProperties': False,
        },
        'postOp': {
            'type': 'object',
            'required': ['op'],
            'properties': {
                'op': {'type': 'string',
                       'enum': ['cropToAlpha', 'padSquare', 'resize']},
                'threshold': {'type': 'integer', 'minimum': 0, 'maximum': 255},
                'w': {'type': 'integer', 'minimum': 1},
                'h': {'type': 'integer', 'minimum': 1},
            },
            'additionalProperties': False,
        },
        'regrade': {
            'type': 'object',
            'required': ['type'],
            'properties': {
                'type': {'type': 'string', 'enum': ['goldHue']},
                'hueTo': {'type': 'number'}, 'satK': {'type': 'number'},
                'valK': {'type': 'number'}, 'srcHue': {'type': 'number'},
                'satFloor': {'type': 'number'},
                'lo': {'type': 'number'}, 'hi': {'type': 'number'},
                'minV': {'type': 'number'},
            },
            'additionalProperties': False,
        },
        'despeckle': {
            'type': 'object',
            'required': ['minNeighbors'],
            'properties': {
                'minNeighbors': {'type': 'integer', 'minimum': 1,
                                 'maximum': 8},
                'comment': {'type': 'string'},
            },
            'additionalProperties': False,
        },
        'borderSoften': {
            'type': 'object',
            'required': ['width', 'minFactor'],
            'properties': {
                'width': {'type': 'integer', 'minimum': 1},
                'minFactor': {'type': 'number', 'minimum': 0,
                              'maximum': 1},
                'sides': {'type': 'string', 'pattern': '^[rltb]{1,4}$'},
                'comment': {'type': 'string'},
            },
            'additionalProperties': False,
        },
        'slice': {
            'type': 'object',
            'required': ['id', 'role', 'anchor', 'stretch'],
            'properties': {
                'id': {'type': 'string', 'pattern': '^[a-z0-9-]+$'},
                'role': {'type': 'string', 'enum': list(ROLES)},
                'anchor': {
                    'type': 'string',
                    'enum': ['tl', 'tr', 'bl', 'br', 'top', 'bottom',
                             'left', 'right', 'explicit'],
                },
                'crop': {'$ref': '#/$defs/rect'},
                'stretch': {'type': 'string', 'enum': ['tile', 'none']},
                'tileSafe': {'type': 'boolean'},
                'compositeMode': {'type': 'string',
                                  'enum': ['static', 'hole-bound']},
                'key': {'$ref': '#/$defs/key'},
                'source': {
                    'type': 'object',
                    'required': ['path'],
                    'properties': {'path': {'type': 'string'}},
                    'additionalProperties': False,
                },
                'alphaOps': {'type': 'array',
                             'items': {'$ref': '#/$defs/alphaOp'}},
                'postOps': {'type': 'array',
                            'items': {'$ref': '#/$defs/postOp'}},
                'regrade': {'$ref': '#/$defs/regrade'},
                'despeckle': {'$ref': '#/$defs/despeckle'},
                'borderSoften': {'$ref': '#/$defs/borderSoften'},
                'displayScale': {'type': 'number', 'exclusiveMinimum': 0},
                'displaySize': {
                    'type': 'array',
                    'items': {'type': 'integer', 'minimum': 1},
                    'minItems': 2, 'maxItems': 2,
                },
                'pos': {
                    'type': 'object',
                    'properties': {
                        'left': {'type': ['number', 'string']},
                        'right': {'type': ['number', 'string']},
                        'top': {'type': ['number', 'string']},
                        'bottom': {'type': ['number', 'string']},
                        'comment': {'type': 'string'},
                    },
                    'additionalProperties': False,
                },
                'span': {
                    'type': 'array',
                    'items': {'type': 'integer'},
                    'minItems': 2, 'maxItems': 2,
                },
                'variants': {
                    'type': 'array',
                    'items': {'type': 'string',
                              'pattern': '^[a-zA-Z0-9-]+$'},
                    'minItems': 1,
                },
                'quality': {'type': 'integer', 'minimum': 0, 'maximum': 100},
                'opaque': {'type': 'boolean'},
                'plugin': {
                    'type': 'object',
                    'required': ['fn'],
                    'properties': {
                        'fn': {'type': 'string',
                               'pattern': '^[a-zA-Z_][a-zA-Z0-9_]*$'},
                        'comment': {'type': 'string'},
                    },
                    'additionalProperties': False,
                },
                'tailFade': {
                    'type': 'object',
                    'required': ['sides'],
                    'properties': {
                        'sides': {'type': 'string', 'pattern': '^[rltb]{1,4}$'},
                        'x': {'type': 'integer', 'minimum': 0},
                        'y': {'type': 'integer', 'minimum': 0},
                    },
                    'additionalProperties': False,
                },
                'wrapBlend': {
                    'type': 'object',
                    'required': ['overlap'],
                    'properties': {
                        'overlap': {'type': 'integer', 'minimum': 1},
                    },
                    'additionalProperties': False,
                },
                'fallback': {
                    'type': 'object',
                    'required': ['segmentIds', 'startCapId', 'endCapId',
                                 'minSpanPx', 'placement'],
                    'properties': {
                        'segmentIds': {'type': 'array',
                                       'items': {'type': 'string'},
                                       'minItems': 1},
                        'startCapId': {'type': 'string'},
                        'endCapId': {'type': 'string'},
                        'minSpanPx': {'type': 'integer', 'minimum': 1},
                        'maxSpanPx': {'type': 'integer', 'minimum': 1},
                        'placement': {'type': 'string',
                                      'enum': ['fixed', 'anchored']},
                    },
                    'additionalProperties': False,
                },
                'transform': {'type': 'string'},
                'comment': {'type': 'string'},
            },
            'additionalProperties': False,
        },
    },
}


class SpecError(Exception):
    """Loud spec validation failure — never emit silently (PLAN-127)."""


def _resolve(path: str) -> str:
    """Resolve a spec-relative path against the repo root."""
    return path if os.path.isabs(path) else os.path.join(REPO_ROOT, path)


# --- slice-kit receipts journal (PLAN-127 OB-12b, trap T-32) ---------------
# Append-only `test-results/slicekit/<surface>.journal.jsonl`: one JSON entry
# per pipeline event, written by tools only. `patch_attempts` is a COUNT of
# `patch` entries appended after the last `regenerated` entry — it cannot be
# zeroed by editing a record field; tampering the journal itself is the
# declared trust-boundary residual (the tripwire stops skipped steps under
# pressure, not sabotage).
TRIPWIRE_PATCH_LIMIT = 3


def _sha12(path: str) -> str:
    with open(path, 'rb') as fh:
        return hashlib.sha256(fh.read()).hexdigest()[:12]


def _journal_path(surface: str) -> str:
    return _resolve(os.path.join('test-results', 'slicekit',
                                 f'{surface}.journal.jsonl'))


def _journal_entries(jpath: str) -> list[dict]:
    if not os.path.exists(jpath):
        return []
    out = []
    with open(jpath, 'r', encoding='utf-8') as fh:
        for line in fh:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out


def _patches_since_regenerated(entries: list[dict]) -> int:
    count = 0
    for entry in entries:
        if entry.get('kind') == 'regenerated':
            count = 0
        elif entry.get('kind') == 'patch':
            count += 1
    return count


def _journal_append(jpath: str, entry: dict) -> None:
    os.makedirs(os.path.dirname(jpath), exist_ok=True)
    entry = {'ts': datetime.now(timezone.utc).isoformat(), **entry}
    with open(jpath, 'a', encoding='utf-8') as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + '\n')


def load_spec(spec_path: str) -> dict:
    """Load + structurally validate the spec via JSON Schema."""
    with open(spec_path, 'r', encoding='utf-8') as fh:
        spec = json.load(fh)
    if jsonschema is not None:
        try:
            jsonschema.validate(spec, SCHEMA)
        except jsonschema.ValidationError as exc:
            raise SpecError(f'schema: {exc.message} (at {".".join(map(str, exc.path))})') from exc
    else:
        for key in SCHEMA['required']:
            if key not in spec:
                raise SpecError(f'schema: missing required key "{key}" (no jsonschema)')
    return spec


def _check_key(cfg: dict, where: str, errs: list[str]) -> None:
    """Each key type requires its params — loud failure, never a silent
    pass-through."""
    if not cfg:
        return
    t = cfg['type']
    if t == 'flatBgMaxDiff':
        for p in ('sampleRect', 'threshold', 'gain'):
            if p not in cfg:
                errs.append(f'{where}: flatBgMaxDiff key requires "{p}"')
    elif t == 'lumaFloor':
        for p in ('lo', 'gain'):
            if p not in cfg:
                errs.append(f'{where}: lumaFloor key requires "{p}"')
    elif t == 'colorClassDelta':
        for p in ('classes', 'threshold', 'gain'):
            if p not in cfg:
                errs.append(f'{where}: colorClassDelta key requires "{p}"')
    elif t == 'none':
        pass


def validate_semantics(spec: dict, src_size: tuple[int, int]) -> None:
    """PLAN-127 semantic rules beyond the JSON Schema — loud failures."""
    errs: list[str] = []
    sw, sh = src_size
    ids: set[str] = set()

    _check_key(spec['source'].get('key'), 'source.key', errs)
    holes = spec.get('geometry', {}).get('holes', [])

    for sl in spec['slices']:
        sid = sl.get('id', '?')
        role, anchor, stretch = sl['role'], sl['anchor'], sl['stretch']

        if sid in ids:
            errs.append(f'{sid}: duplicate slice id')
        ids.add(sid)

        if anchor not in ANCHORS_BY_ROLE[role]:
            errs.append(f'{sid}: anchor "{anchor}" incoherent with role "{role}"')

        if role in ('corner', 'ornament') and stretch != 'none':
            errs.append(f'{sid}: role {role} requires stretch:"none"')

        if 'crop' not in sl and 'plugin' not in sl:
            errs.append(f'{sid}: requires "crop" (or "plugin" for emitted '
                        'pieces the spec cannot express as a crop)')
        if 'wrapBlend' in sl and 'crop' not in sl:
            errs.append(f'{sid}: wrapBlend requires an explicit crop')
        _check_key(sl.get('key'), f'{sid}.key', errs)
        if (sl.get('key') or {}).get('type') == 'none' and 'despeckle' in sl:
            errs.append(f'{sid}: despeckle is meaningless on key.type "none" '
                        '(explicit opaque — post-key morphology never runs)')
        if sl.get('compositeMode') == 'hole-bound':
            if not holes:
                errs.append(f'{sid}: compositeMode "hole-bound" requires '
                            'geometry.holes')
            if 'outerRect' not in spec.get('geometry', {}):
                errs.append(f'{sid}: hole-bound requires geometry.outerRect '
                            '(manifest inset is computed against it)')

        if stretch == 'tile':
            if 'tileSafe' not in sl:
                errs.append(f'{sid}: stretch:"tile" requires explicit tileSafe')
            elif sl['tileSafe'] is False and 'fallback' not in sl:
                errs.append(f'{sid}: tileSafe:false requires a complete fallback block')
            elif sl['tileSafe'] is False:
                errs.append(
                    f'{sid}: tileSafe:false (authored-segment fallback) is not '
                    'emitted by this pilot — escalate to fixed art per PLAN-127, '
                    'no silent output')
        if role not in ('edge-x', 'edge-y') and stretch == 'tile':
            errs.append(f'{sid}: stretch:"tile" only valid on edge roles')

        if 'tailFade' in sl and role not in ('corner', 'ornament'):
            errs.append(f'{sid}: tailFade only valid on corner|ornament')
        if 'wrapBlend' in sl and role not in ('edge-x', 'edge-y'):
            errs.append(f'{sid}: wrapBlend only valid on edge-x|edge-y')
        if 'wrapBlend' in sl and sl.get('stretch') != 'tile':
            errs.append(f'{sid}: wrapBlend requires stretch:"tile"')

        # ── render-side fields (manifest consumption, OB-2) ──
        if 'span' in sl and role not in ('edge-x', 'edge-y'):
            errs.append(f'{sid}: span only valid on edge-x|edge-y '
                        '(tuck-under-corners extension along the edge axis)')
        if 'pos' in sl and role not in ('corner', 'ornament'):
            errs.append(f'{sid}: pos only valid on corner|ornament '
                        '(authored placement; edges derive the rim side '
                        'from displaySize + geometry.rimOverlapPx)')
        if 'pos' in sl and role == 'corner':
            need = {'tl': ('left', 'top'), 'tr': ('right', 'top'),
                    'bl': ('left', 'bottom'), 'br': ('right', 'bottom')}
            missing = [k for k in need[anchor] if k not in sl['pos']]
            if missing:
                errs.append(f'{sid}: pos for corner anchor "{anchor}" '
                            f'requires {missing}')
        if 'displaySize' in sl and 'displayScale' in sl:
            errs.append(f'{sid}: displaySize and displayScale are mutually '
                        'exclusive (displayScale derives displaySize)')

        if 'crop' in sl and 'source' not in sl:
            x0, y0, x1, y1 = sl['crop']
            if not (0 <= x0 < x1 <= sw and 0 <= y0 < y1 <= sh):
                errs.append(f'{sid}: crop {sl["crop"]} outside source {sw}x{sh}')
            if 'wrapBlend' in sl:
                ov = sl['wrapBlend']['overlap']
                ex1, ey1 = (x1 + ov, y1) if role == 'edge-x' else (x1, y1 + ov)
                if ex1 > sw or ey1 > sh:
                    errs.append(f'{sid}: wrapBlend extension ({ex1},{ey1}) exceeds source')
        # slice-source slices: bounds checked loudly at emit against THEIR source

    # PLAN-127: "i buchi non si sovrappongono mai ai crop dei pezzi" — and
    # hole-bound keeps a GENEROUS transparent margin: the hole inflated by
    # marginPx must still clear every main-source crop.
    for hole in holes:
        hid = hole.get('id', '?')
        hx0, hy0, hx1, hy1 = hole['rect']
        if not (0 <= hx0 < hx1 <= sw and 0 <= hy0 < hy1 <= sh):
            errs.append(f'hole {hid}: rect {hole["rect"]} outside source {sw}x{sh}')
            continue
        if hole['shape'] == 'sprite-mask' and hole.get('maskPiece') not in ids:
            errs.append(f'hole {hid}: sprite-mask requires maskPiece naming '
                        'an emitted slice')
        m = hole.get('marginPx', 0)
        rx0, ry0, rx1, ry1 = hx0 - m, hy0 - m, hx1 + m, hy1 + m
        for sl in spec['slices']:
            if 'crop' not in sl or 'source' in sl:
                continue
            cx0, cy0, cx1, cy1 = sl['crop']
            if 'wrapBlend' in sl:
                ov = sl['wrapBlend']['overlap']
                if sl['role'] == 'edge-x':
                    cx1 += ov
                else:
                    cy1 += ov
            if rx0 < cx1 and rx1 > cx0 and ry0 < cy1 and ry1 > cy0:
                errs.append(f'hole {hid} inflated by marginPx={m} overlaps '
                            f'crop of {sl["id"]} {sl["crop"]}')

    budgets = spec.get('budgets', {})
    if 'maxPieces' in budgets and len(spec['slices']) > budgets['maxPieces']:
        errs.append(f'budget maxPieces={budgets["maxPieces"]} exceeded: {len(spec["slices"])}')

    if errs:
        raise SpecError('spec invalid:\n  - ' + '\n  - '.join(errs))


# ── ops (oracle-exact reimplementations) ─────────────────────────────────────


def key_flat_bg_maxdiff(px: np.ndarray, cfg: dict,
                        src_arr: np.ndarray | None = None) -> np.ndarray:
    """Alpha = clip((maxdiff(px, BG) - threshold) * gain, 0, 255).

    BG = mean colour of `sampleRect` on the source (oracle `key`). `src_arr`
    overrides the module source when a slice carries its own `source`."""
    x0, y0, x1, y1 = cfg['sampleRect']
    arr = _SRC_ARR if src_arr is None else src_arr
    bg = arr[y0:y1, x0:x1].reshape(-1, 3).mean(0)
    d = np.abs(px - bg).max(2)
    return np.clip((d - cfg['threshold']) * cfg['gain'], 0, 255).astype(np.uint8)


def key_luma_floor(px: np.ndarray, cfg: dict) -> np.ndarray:
    """Alpha = clip((max(R,G,B) - lo) * gain, 0, 255) — keys a true-black
    ground without sampling a bg rect (cassetto oracle `key_black`)."""
    return np.clip((px.max(2) - cfg['lo']) * cfg['gain'], 0, 255).astype(np.uint8)


def key_color_class_delta(px: np.ndarray, cfg: dict) -> np.ndarray:
    """Per-pixel colour-CLASS key (frame5 oracle `keyart`).

    keep = max over `classes[]` of (px[channel] - max(px[over...]) + bias);
    alpha = clip((keep - threshold) * gain, 0, 255). `over` defaults to the
    other two channels, `bias` to 0 — oracle classes: brass r-max(g,b)+0,
    gem g-max(r,b)-8. Keys by colour class on a painted non-flat ground."""
    f = px.astype(np.float64)
    chans = {'r': f[:, :, 0], 'g': f[:, :, 1], 'b': f[:, :, 2]}
    keep = None
    for cls in cfg['classes']:
        ch = cls['channel']
        over = cls.get('over') or [c for c in 'rgb' if c != ch]
        v = chans[ch] - np.maximum.reduce(
            [chans[o] for o in over]) + cls.get('bias', 0)
        keep = v if keep is None else np.maximum(keep, v)
    return np.clip((keep - cfg['threshold']) * cfg['gain'],
                   0, 255).astype(np.uint8)


def despeckle_alpha(alpha: np.ndarray, min_neighbors: int) -> np.ndarray:
    """Post-key morphology (frame5 oracle `keyart`): an opaque px survives
    only with >= `min_neighbors` opaque 8-neighbours — kills lone specks
    that keyed to the wrong class (map foliage read as gem-green)."""
    op = (alpha > 0).astype(np.uint8)
    nb = np.zeros_like(op)
    nb[1:, :] += op[:-1, :]; nb[:-1, :] += op[1:, :]
    nb[:, 1:] += op[:, :-1]; nb[:, :-1] += op[:, 1:]
    nb[1:, 1:] += op[:-1, :-1]; nb[:-1, :-1] += op[1:, 1:]
    nb[1:, :-1] += op[:-1, 1:]; nb[:-1, 1:] += op[1:, :-1]
    out = alpha.copy()
    out[nb < min_neighbors] = 0
    return out


def border_soften(alpha: np.ndarray, width: int, min_factor: float,
                  sides: str) -> np.ndarray:
    """Rim alpha floor ramp (frame5 oracle `keyart` border soften): the last
    `width` px on each side are multiplied by minFactor*(i+1) — at the rim
    px the factor is `min_factor`, never 0 (unlike tailFade, which fades the
    rim to 0 and is meant for corner->edge transitions). Per-side order
    t,b,l,r and per-px uint8 truncation replicate the oracle exactly —
    corner px are multiplied by BOTH their row and column ramp."""
    a = alpha
    h, w = a.shape
    for i in range(min(width, h, w)):
        f = min_factor * (i + 1)
        if 't' in sides:
            a[i, :] = (a[i, :] * f).astype(np.uint8)
        if 'b' in sides:
            a[h - 1 - i, :] = (a[h - 1 - i, :] * f).astype(np.uint8)
        if 'l' in sides:
            a[:, i] = (a[:, i] * f).astype(np.uint8)
        if 'r' in sides:
            a[:, w - 1 - i] = (a[:, w - 1 - i] * f).astype(np.uint8)
    return a


def apply_alpha_ops(alpha: np.ndarray, ops: list[dict]) -> np.ndarray:
    """Ordered alpha-plane ops (all PIL 'L' ops, oracle-exact)."""
    a = alpha
    for op in ops:
        name = op['op']
        if name == 'minFilter':
            a = np.asarray(Image.fromarray(a).filter(
                ImageFilter.MinFilter(op['size'])))
        elif name == 'gaussianBlur':
            a = np.asarray(Image.fromarray(a).filter(
                ImageFilter.GaussianBlur(op['radius'])))
        elif name == 'ellipseWindow':
            a = _ellipse_window(a, op)
        else:  # pragma: no cover - schema blocks this
            raise SpecError(f'alphaOp unsupported: {name}')
    return a.astype(np.uint8)


def _ellipse_window(alpha: np.ndarray, op: dict) -> np.ndarray:
    """min(max(coreEllipse, alpha), wideEllipse) — the cassetto `medal`
    mask: inside the tight core everything stays; between core and wide only
    bright (keyed) pixels survive; outside the wide ellipse nothing."""
    h, w = alpha.shape

    def _ell(rx: float, ry: float, blur: float) -> np.ndarray:
        e = Image.new('L', (w, h), 0)
        ImageDraw.Draw(e).ellipse(
            (op['cx'] - rx, op['cy'] - ry, op['cx'] + rx, op['cy'] + ry),
            fill=255)
        return np.asarray(e.filter(ImageFilter.GaussianBlur(blur)))

    feather = op.get('feather', 2)
    k = op.get('coreK', 1.0)
    core = _ell(op['rx'] * k, op['ry'] * k, feather)
    wide = _ell(op['rx'], op['ry'], feather)
    return np.minimum(np.maximum(core, alpha), wide)


def apply_post_ops(rgba: np.ndarray, ops: list[dict]) -> np.ndarray:
    """Ordered RGBA ops after compositing (bbox/pad/resize — supply-bag)."""
    out = rgba
    for op in ops:
        name = op['op']
        if name == 'cropToAlpha':
            mask = np.where(out[:, :, 3] > op.get('threshold', 0),
                            255, 0).astype(np.uint8)
            bbox = Image.fromarray(mask).getbbox()
            if bbox is None:
                raise SpecError('cropToAlpha: empty alpha bbox')
            out = out[bbox[1]:bbox[3], bbox[0]:bbox[2]]
        elif name == 'padSquare':
            h, w = out.shape[:2]
            side = max(w, h)
            sq = np.zeros((side, side, 4), np.uint8)
            y, x = (side - h) // 2, (side - w) // 2
            sq[y:y + h, x:x + w] = out
            out = sq
        elif name == 'resize':
            out = np.asarray(Image.fromarray(out, 'RGBA').resize(
                (op['w'], op['h']), Image.LANCZOS))
        else:  # pragma: no cover - schema blocks this
            raise SpecError(f'postOp unsupported: {name}')
    return out


def apply_regrade(rgba: np.ndarray, cfg: dict) -> np.ndarray:
    """Typed colour regrade. `goldHue` passes through to
    `scripts/lib_grade_gold.grade_gold` (R-357 champagne palette); spec
    params map 1:1 onto its keyword args."""
    if cfg['type'] != 'goldHue':  # pragma: no cover - schema blocks this
        raise SpecError(f"regrade type unsupported: {cfg['type']}")
    scripts_dir = os.path.join(REPO_ROOT, 'scripts')
    if scripts_dir not in sys.path:
        sys.path.insert(0, scripts_dir)
    from lib_grade_gold import grade_gold
    kw = {}
    for spec_k, lib_k in (('hueTo', 'hue_to'), ('satK', 'sat_k'),
                          ('valK', 'val_k'), ('srcHue', 'src_hue'),
                          ('satFloor', 'sat_floor'), ('lo', 'lo'),
                          ('hi', 'hi'), ('minV', 'min_v')):
        if spec_k in cfg:
            kw[lib_k] = cfg[spec_k]
    return np.asarray(grade_gold(Image.fromarray(rgba, 'RGBA'), **kw))


def run_plugin(spec: dict, sl: dict, ctx: dict) -> Image.Image:
    """`plugins/<surface>.py` hook — the ONLY escape hatch for ops the
    data-only spec cannot express (PLAN-127 anti-DSL). The plugin file must
    carry a `# WHY-NOT-SPEC:` marker naming the inexpressible op or emission
    fails loudly."""
    import importlib.util
    pdir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'plugins')
    pfile = os.path.join(pdir, f"{spec['surface']}.py")
    if not os.path.exists(pfile):
        raise SpecError(f"slice {sl['id']}: plugin file missing: {pfile}")
    with open(pfile, 'r', encoding='utf-8') as fh:
        if '# WHY-NOT-SPEC:' not in fh.read():
            raise SpecError(f"plugin {pfile}: missing '# WHY-NOT-SPEC:' marker "
                            '(PLAN-127 anti-DSL gate)')
    mspec = importlib.util.spec_from_file_location(
        f"slicekit_plugin_{spec['surface']}", pfile)
    mod = importlib.util.module_from_spec(mspec)
    mspec.loader.exec_module(mod)
    fn = getattr(mod, sl['plugin']['fn'], None)
    if fn is None:
        raise SpecError(f"plugin {pfile}: no function {sl['plugin']['fn']}")
    return fn(ctx)


def punch_cutouts(alpha: np.ndarray, box: tuple[int, int, int, int],
                  cutouts: list[dict]) -> np.ndarray:
    """Zero alpha where the crop (global `box`) overlaps a cutout rect
    (oracle `punch_hole`)."""
    x0, y0, x1, y1 = box
    for cut in cutouts:
        hx0, hy0, hx1, hy1 = cut['rect']
        ox0, oy0 = max(hx0, x0) - x0, max(hy0, y0) - y0
        ox1, oy1 = min(hx1, x1) - x0, min(hy1, y1) - y0
        if ox1 > ox0 and oy1 > oy0:
            alpha[oy0:oy1, ox0:ox1] = 0
    return alpha


def tail_fade(alpha: np.ndarray, sides: str, fx: int, fy: int) -> np.ndarray:
    """Linear alpha soften on the sides that run into neighbouring edges.

    Ramp width = min(f, dim // 3) per axis (oracle `corner` — deliberately
    tiny: the neighbouring tile is phase-continuous, a long fade would ghost
    two pattern phases)."""
    a = alpha
    h, w = a.shape
    n = min(fx, w // 3)
    if 'r' in sides:
        for i in range(n):
            a[:, w - 1 - i] = (a[:, w - 1 - i] * (i / n)).astype(np.uint8)
    if 'l' in sides:
        for i in range(n):
            a[:, i] = (a[:, i] * (i / n)).astype(np.uint8)
    n = min(fy, h // 3)
    if 'b' in sides:
        for i in range(n):
            a[h - 1 - i, :] = (a[h - 1 - i, :] * (i / n)).astype(np.uint8)
    if 't' in sides:
        for i in range(n):
            a[i, :] = (a[i, :] * (i / n)).astype(np.uint8)
    return a


def wrap_blend(px: np.ndarray, alpha: np.ndarray, axis: str,
               ov: int) -> tuple[np.ndarray, np.ndarray]:
    """Make the strip a seamless repeat tile on `axis`.

    The strip was cropped `ov` px longer than the emitted tile; the tile's
    first `ov` px become a crossfade between the real continuation and the
    tile start. Alpha = max(both) — the ornament must stay opaque across the
    join (oracle `edge`)."""
    px = px.astype(np.float64)
    a = alpha.astype(np.float64)
    h, w = a.shape
    n = ov
    if axis == 'x':
        w -= n
        t = np.linspace(1, 0, n)[None, :, None]
        px[:, :n] = px[:, w:w + n] * t + px[:, :n] * (1 - t)
        a[:, :n] = np.maximum(a[:, w:w + n], a[:, :n])
        px, a = px[:, :w], a[:, :w]
    else:
        h -= n
        t = np.linspace(1, 0, n)[:, None, None]
        px[:n] = px[h:h + n] * t + px[:n] * (1 - t)
        a[:n] = np.maximum(a[h:h + n], a[:n])
        px, a = px[:h], a[:h]
    return px, a


# ── engine ───────────────────────────────────────────────────────────────────

_SRC_ARR: np.ndarray = np.zeros((1, 1, 3))
# `sourceAlpha` key: the source PNG already carries its alpha (a derivative prepared offline — e.g. an
# analytic silhouette that a distance-to-background key cannot express). None = not in use.
_SRC_ALPHA: np.ndarray | None = None


def _slice_source_image(sl: dict, cache: dict) -> Image.Image:
    """Per-slice source override (e.g. an icon generated on its own ground)
    — cached per path."""
    path = _resolve(sl['source']['path'])
    if path not in cache:
        if not os.path.exists(path):
            raise SpecError(f"{sl['id']}: slice source not found: {path}")
        cache[path] = Image.open(path).convert('RGB')
    return cache[path]


def _save_rgba(path: str, rgba: np.ndarray, opaque: bool,
               save_kw: dict) -> None:
    """WebP save; `opaque` emits RGB (no alpha plane — oracle saves plain
    RGB crops without a key as RGB)."""
    img = Image.fromarray(rgba, 'RGBA')
    if opaque:
        img = img.convert('RGB')
    img.save(path, **save_kw)


def emit_slice(im: Image.Image, sl: dict, key_cfg: dict | None,
               cutouts: list[dict], out_dir: str,
               quality: int, alpha_quality: int,
               spec: dict | None = None, method: int | None = None,
               src_cache: dict | None = None) -> tuple[int, int, int]:
    """Run the fixed pipeline for one slice; returns (w, h, bytes).

    Order: [plugin →] crop (+wrapBlend extension) → key → cutout punch →
    despeckle → alphaOps → tailFade → borderSoften → wrapBlend → postOps →
    regrade → WebP save."""
    path = os.path.join(out_dir, f"{sl['id']}.webp")
    save_kw = {'quality': sl.get('quality', quality),
               'alpha_quality': alpha_quality}
    if method is not None:
        save_kw['method'] = method

    # ── plugin path: piece built by plugins/<surface>.py (WHY-NOT-SPEC) ──
    if 'plugin' in sl:
        ctx = {'spec': spec, 'slice': sl, 'im': im, 'out_dir': out_dir,
               'repo_root': REPO_ROOT}
        rgba = np.asarray(run_plugin(spec, sl, ctx).convert('RGBA'))
        if 'postOps' in sl:
            rgba = apply_post_ops(rgba, sl['postOps'])
        if 'regrade' in sl:
            rgba = apply_regrade(rgba, sl['regrade'])
        _save_rgba(path, rgba, sl.get('opaque', False), save_kw)
        return rgba.shape[1], rgba.shape[0], os.path.getsize(path)

    role = sl['role']
    sim, src_arr = im, _SRC_ARR
    if 'source' in sl:
        sim = _slice_source_image(sl, src_cache if src_cache is not None else {})
        src_arr = np.asarray(sim).astype(np.int16)
    sw, sh = sim.size
    x0, y0, x1, y1 = sl.get('crop') or [0, 0, sw, sh]
    if 'wrapBlend' in sl:
        ov = sl['wrapBlend']['overlap']
        box = (x0, y0, x1 + ov, y1) if role == 'edge-x' else (x0, y0, x1, y1 + ov)
    else:
        box = (x0, y0, x1, y1)
    if box[0] < 0 or box[1] < 0 or box[2] > sw or box[3] > sh:
        raise SpecError(f"{sl['id']}: crop/wrap box {box} outside source {sw}x{sh}")

    px = np.asarray(sim.crop(box).convert('RGB')).astype(np.int16)
    eff_key = sl.get('key', key_cfg)
    if eff_key and eff_key['type'] == 'flatBgMaxDiff':
        a = key_flat_bg_maxdiff(px, eff_key, src_arr)
    elif eff_key and eff_key['type'] == 'lumaFloor':
        a = key_luma_floor(px, eff_key)
    elif eff_key and eff_key['type'] == 'colorClassDelta':
        a = key_color_class_delta(px, eff_key)
    elif eff_key and eff_key['type'] == 'sourceAlpha':
        if _SRC_ALPHA is None or 'source' in sl:
            raise SpecError(f"{sl['id']}: sourceAlpha needs the spec's own RGBA source (no per-slice source)")
        a = _SRC_ALPHA[box[1]:box[3], box[0]:box[2]].copy()
    else:  # no key or explicit {"type":"none"} — opaque
        a = np.full(px.shape[:2], 255, np.uint8)
    a = punch_cutouts(a, box, cutouts)

    if 'despeckle' in sl:
        a = despeckle_alpha(a, sl['despeckle']['minNeighbors'])

    if 'alphaOps' in sl:
        a = apply_alpha_ops(a, sl['alphaOps'])

    if 'tailFade' in sl:
        tf = sl['tailFade']
        a = tail_fade(a, tf['sides'], tf.get('x', 0), tf.get('y', 0))

    if 'borderSoften' in sl:
        bs = sl['borderSoften']
        a = border_soften(a, bs['width'], bs['minFactor'],
                          bs.get('sides', 'rltb'))

    if 'wrapBlend' in sl:
        axis = 'x' if role == 'edge-x' else 'y'
        pxf, af = wrap_blend(px, a, axis, sl['wrapBlend']['overlap'])
        rgba = np.dstack([pxf.astype(np.uint8), af.astype(np.uint8)])
    else:
        rgba = np.dstack([px.astype(np.uint8), a])

    if 'postOps' in sl:
        rgba = apply_post_ops(rgba, sl['postOps'])
    if 'regrade' in sl:
        rgba = apply_regrade(rgba, sl['regrade'])

    _save_rgba(path, rgba, sl.get('opaque', False), save_kw)
    return rgba.shape[1], rgba.shape[0], os.path.getsize(path)


def hole_boundary(sl: dict, cutouts: list[dict]) -> dict | None:
    """Derived datum for the manifest: where the content hole lands inside
    the emitted piece. Corners get `holeCornerPx` (the local pixel that sits
    on the panel corner); edges get `holeBoundary` (which side faces the
    content + the hole line's offset inward from that side)."""
    if not cutouts or 'crop' not in sl:
        return None
    hole = cutouts[0]['rect']
    hx0, hy0, hx1, hy1 = hole
    x0, y0, x1, y1 = sl['crop']
    role, anchor = sl['role'], sl['anchor']

    if role == 'corner':
        cx = hx0 if anchor in ('tl', 'bl') else hx1
        cy = hy0 if anchor in ('tl', 'tr') else hy1
        return {'holeCornerPx': [cx - x0, cy - y0]}
    if role == 'edge-x':
        if anchor == 'top':
            return {'holeBoundary': {'side': 'bottom', 'offsetPx': y1 - hy0}}
        return {'holeBoundary': {'side': 'top', 'offsetPx': hy1 - y0}}
    if role == 'edge-y':
        if anchor == 'left':
            return {'holeBoundary': {'side': 'right', 'offsetPx': x1 - hx0}}
        return {'holeBoundary': {'side': 'left', 'offsetPx': hx1 - x0}}
    return None


def build_manifest(spec: dict, pieces: list[dict], out_dir: str) -> dict:
    """Assemble the `<surface>Frame` manifest — single source of truth for
    render geometry (corner px, edge thickness, content insets, rimOverlap,
    per-piece anchor/stretch/tileSafe)."""
    src_path = _resolve(spec['source']['path'])
    with open(src_path, 'rb') as fh:
        sha = hashlib.sha256(fh.read()).hexdigest()

    geo = spec.get('geometry', {})
    manifest: dict = {
        'surface': spec['surface'],
        'specVersion': spec['specVersion'],
        'generator': 'scripts/hud-real/slice-frame.py',
        'generatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'source': {'path': spec['source']['path'], 'sha256': sha},
        'assetBase': '/' + spec['output']['dir'].removeprefix('public/').rstrip('/') + '/',
        'pieces': pieces,
    }

    if 'outerRect' in geo and 'contentRect' in geo:
        ox0, oy0, ox1, oy1 = geo['outerRect']
        cx0, cy0, cx1, cy1 = geo['contentRect']
        manifest['geometry'] = {
            'outer': {'x': ox0, 'y': oy0, 'w': ox1 - ox0, 'h': oy1 - oy0},
            'contentRect': {'x': cx0, 'y': cy0, 'w': cx1 - cx0, 'h': cy1 - cy0},
            'contentInsets': {
                'top': cy0 - oy0, 'right': ox1 - cx1,
                'bottom': oy1 - cy1, 'left': cx0 - ox0,
            },
            'rimOverlapPx': geo.get('rimOverlapPx', 1),
            'corners': {p['anchor']: {'w': p['nativeSize'][0], 'h': p['nativeSize'][1]}
                        for p in pieces if p['role'] == 'corner'},
            'edgeThickness': {
                p['anchor']: (p['nativeSize'][1] if p['role'] == 'edge-x'
                              else p['nativeSize'][0])
                for p in pieces if p['role'] in ('edge-x', 'edge-y')
            },
        }

    # DOM backfill patches ("corner-bite" contract) — data passthrough, the
    # primitive renders them behind the frame pieces.
    if 'backings' in geo:
        manifest.setdefault('geometry', {})['backings'] = geo['backings']

    # Runtime-bound windows (compositeMode:"hole-bound" pieces) — the
    # primitive clips the live DOM element into the window via CSS
    # clip-path (shape "rect") or mask-image (shape "sprite-mask" →
    # maskRef points at the emitted piece whose alpha is the silhouette).
    holes = geo.get('holes', [])
    if holes and 'outerRect' in geo:
        ox0, oy0, ox1, oy1 = geo['outerRect']
        ow, oh = ox1 - ox0, oy1 - oy0
        windows: dict = {}
        for hole in holes:
            hx0, hy0, hx1, hy1 = hole['rect']
            entry: dict = {
                'shape': hole['shape'],
                # rect in OUTER-RECT-relative px (primitive coordinate space)
                'rect': [hx0 - ox0, hy0 - oy0, hx1 - ox0, hy1 - oy0],
                # fractional insets of the outer box — direct CSS `inset`
                'inset': {
                    'left': round((hx0 - ox0) / ow, 6),
                    'top': round((hy0 - oy0) / oh, 6),
                    'right': round((ox1 - hx1) / ow, 6),
                    'bottom': round((oy1 - hy1) / oh, 6),
                },
            }
            if hole.get('marginPx'):
                entry['marginPx'] = hole['marginPx']
            if hole['shape'] == 'sprite-mask':
                entry['maskRef'] = f"{hole['maskPiece']}.webp"
            windows[hole['id']] = entry
        if len(windows) == 1:
            manifest['ctaWindow'] = dict(next(iter(windows.values())),
                                         id=next(iter(windows)))
        else:
            manifest['windows'] = windows
            if 'cta-window' in windows:
                manifest['ctaWindow'] = dict(windows['cta-window'],
                                             id='cta-window')
    return manifest


def main() -> int:
    """CLI entry: --spec <file.json> [--out-dir override]."""
    ap = argparse.ArgumentParser(description='PLAN-127 slice-kit engine (MVP)')
    ap.add_argument('--spec', required=True, help='path to spec JSON')
    ap.add_argument('--out-dir', default=None, help='override spec output.dir')
    ap.add_argument('--no-manifest', action='store_true')
    ap.add_argument('--regenerate', action='store_true',
                    help='the source golden was regenerated: record a '
                         '`regenerated` journal entry and reset the T-32 '
                         'patch counter')
    args = ap.parse_args()

    spec = load_spec(args.spec)
    src_path = _resolve(spec['source']['path'])
    if not os.path.exists(src_path):
        raise SpecError(f'source not found: {src_path}')

    # T-32 tripwire (OB-12b): a run on a surface that already has journal
    # entries is a `patch` attempt; the next patch is refused once
    # TRIPWIRE_PATCH_LIMIT patches stand unregenerated. The entry is
    # appended BEFORE the work: a failed attempt is still an attempt.
    surface = spec.get('surface') or os.path.splitext(
        os.path.basename(args.spec))[0]
    jpath = _journal_path(surface)
    prior = _journal_entries(jpath)
    if args.regenerate:
        jkind = 'regenerated'
    elif not prior:
        jkind = 'slice'
    else:
        jkind = 'patch'
        if _patches_since_regenerated(prior) >= TRIPWIRE_PATCH_LIMIT:
            raise SpecError(
                f'T-32 tripwire: {TRIPWIRE_PATCH_LIMIT} patch entries on '
                f'{jpath} without `regenerated` — regenerate the frame art '
                f'or re-run with --regenerate (PLAN-127 OB-12b)')
    _journal_append(jpath, {
        'kind': jkind, 'tool': 'slice-frame.py',
        'toolSha': _sha12(os.path.abspath(__file__)),
        'surface': surface,
        'spec': os.path.relpath(os.path.abspath(args.spec), REPO_ROOT),
        'specHash': _sha12(os.path.abspath(args.spec)),
        'inputSha': _sha12(src_path),
    })
    global _SRC_ARR, _SRC_ALPHA
    _kc = spec['source'].get('key')
    if _kc and _kc.get('type') == 'sourceAlpha':
        _rgba = Image.open(src_path).convert('RGBA')
        im = _rgba.convert('RGB')
        _SRC_ALPHA = np.asarray(_rgba)[..., 3].copy()
    else:
        im = Image.open(src_path).convert('RGB')
        _SRC_ALPHA = None
    _SRC_ARR = np.asarray(im).astype(np.int16)

    validate_semantics(spec, im.size)

    out = spec['output']
    out_dir = _resolve(args.out_dir or out['dir'])
    os.makedirs(out_dir, exist_ok=True)
    quality = out.get('quality', 92)
    alpha_quality = out.get('alphaQuality', 100)
    key_cfg = spec['source'].get('key')
    cutouts = spec['source'].get('cutouts', [])

    pieces: list[dict] = []
    total_bytes = 0
    src_cache: dict = {}
    for sl in spec['slices']:
        w, h, nbytes = emit_slice(im, sl, key_cfg, cutouts, out_dir,
                                  quality, alpha_quality, spec=spec,
                                  method=out.get('method'),
                                  src_cache=src_cache)
        total_bytes += nbytes
        piece = {
            'id': sl['id'], 'file': f"{sl['id']}.webp", 'role': sl['role'],
            'anchor': sl['anchor'], 'stretch': sl['stretch'],
            'nativeSize': [w, h], 'bytes': nbytes,
        }
        if 'tileSafe' in sl:
            piece['tileSafe'] = sl['tileSafe']
        if sl.get('compositeMode'):
            piece['compositeMode'] = sl['compositeMode']
        if 'displayScale' in sl:
            piece['displayScale'] = sl['displayScale']
        # render-side datums for the manifest-consuming primitive (OB-2):
        # displaySize is ALWAYS emitted — explicit, derived from
        # displayScale, or the native crop size — so the primitive has one
        # consumption field for every piece.
        if 'displaySize' in sl:
            piece['displaySize'] = list(sl['displaySize'])
        elif 'displayScale' in sl:
            piece['displaySize'] = [round(w * sl['displayScale']),
                                    round(h * sl['displayScale'])]
        else:
            piece['displaySize'] = [w, h]
        if 'pos' in sl:
            piece['pos'] = {k: v for k, v in sl['pos'].items()
                            if k != 'comment'}
        if 'span' in sl:
            piece['span'] = list(sl['span'])
        if 'variants' in sl:
            piece['variants'] = list(sl['variants'])
        hb = hole_boundary(sl, cutouts)
        if hb:
            piece.update(hb)
        pieces.append(piece)
        print(f"{sl['id']:14s} {w}x{h}  {nbytes}B")

    max_bytes = spec.get('budgets', {}).get('maxBytes')
    if max_bytes and total_bytes > max_bytes:
        raise SpecError(f'budget maxBytes={max_bytes} exceeded: {total_bytes}')

    if not args.no_manifest:
        manifest = build_manifest(spec, pieces, out_dir)
        mname = out.get('manifest', f"{spec['surface']}Frame.json")
        mpath = os.path.join(out_dir, mname)
        with open(mpath, 'w', encoding='utf-8') as fh:
            json.dump(manifest, fh, indent=2, ensure_ascii=False)
            fh.write('\n')
        print('manifest →', mpath)

        # PLAN-127 `<surface>Frame.ts` — the generated TS module the
        # primitive imports (OB-2: geometry consumed from the manifest,
        # never hand-maintained in components).
        ts_mod = out.get('tsModule')
        if ts_mod:
            ident = ts_mod.get('exportName')
            if not ident:
                camel = spec['surface'].replace('-', ' ').title().replace(' ', '')
                ident = camel[0].lower() + camel[1:] + 'Frame'
            ts_path = _resolve(ts_mod['path'])
            os.makedirs(os.path.dirname(ts_path), exist_ok=True)
            with open(ts_path, 'w', encoding='utf-8') as fh:
                fh.write(
                    '// GENERATED by scripts/hud-real/slice-frame.py from '
                    'a data-only spec — PLAN-127 <surface>Frame.ts.\n'
                    '// Single source of truth for slice-kit render '
                    'geometry. Do not edit: re-run the slicer.\n'
                    f"import type {{ SliceKitFrameManifest }} from '{ts_mod['typeImport']}';\n\n"
                    f'export const {ident}: SliceKitFrameManifest = ')
                json.dump(manifest, fh, indent=2, ensure_ascii=False)
                fh.write(';\n\n'
                         f'export default {ident};\n')
            print('tsModule →', ts_path)

    print(f"done → {out_dir} ({len(pieces)} pieces, {total_bytes}B)")
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except SpecError as exc:
        print(f'SPEC ERROR: {exc}', file=sys.stderr)
        sys.exit(2)
