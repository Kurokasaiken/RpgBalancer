/**
 * Zanara roster kit contract (LINGUAGGIO-v1, KIT-ROSTER.md).
 *
 * Asset URLs and mount geometry come from `scripts/build-zanara-kit.py`
 * (public/assets/ui/zanara/roster/kit.json, measured on the approved pieces);
 * the component reads only this module — no literals in the component.
 * Units: design px in the 1600x900 space; assets are 2x.
 */

const BASE = '/assets/ui/zanara/roster/';

/** Asset URLs of the approved kit pieces (K1 ritratto, K2, K3, K4, K5, K6). */
export const ZANARA_ROSTER_ASSETS = {
  ring: `${BASE}ring.png`,
  plaqueLeft: `${BASE}plaque-left.png`,
  plaqueMid: `${BASE}plaque-mid.png`,
  plaqueRight: `${BASE}plaque-right.png`,
  bandTile: `${BASE}band-tile.png`,
  bandNode: `${BASE}band-node.png`,
  bandEnd: `${BASE}band-end.png`,
  emblem: `${BASE}emblem.png`,
  gemRoundLit: `${BASE}gem-round-lit.png`,
  gemRoundDim: `${BASE}gem-round-dim.png`,
} as const;

/** Mount geometry measured by the build script (kit.json), plus layout choices. */
export const ZANARA_ROSTER_GEOMETRY = {
  columnW: 214,
  pitch: 62,
  visibleRows: 4,
  band: { x: 6, w: 14, tileH: 23.81, nodeH: 9.43 },
  bandEnd: { w: 17.32, h: 54.02, bandX: 1.56 },
  emblem: { size: 84, overlap: 14 },
  ring: { left: 14, size: 59.83, outerD: 56, holeD: 40.47, gemX: 29.92, gemY: 54.24 },
  stateGem: 9,
  plaque: { h: 50, leftW: 23.17, rightW: 30.89, bodyTop: 1.93, bodyBottom: 47.88 },
  text: { left: 78, top: 6, nameSize: 13, subSize: 12, barH: 3, barGap: 2, barW: 80 },
} as const;

/** Colour contract (Zanara preset seed; moves to --skin-hud-* when the preset lands, PLAN-107 T-101). */
export const ZANARA_ROSTER_COLORS = {
  name: '#efe6c8',
  sub: '#b9d2c4',
  exception: '#f0c987',
  fallen: '#93a4ad',
  hpFill: 'linear-gradient(180deg, #3fd6a4, #149a72)',
  staminaFill: 'linear-gradient(180deg, #ecd28a, #b38a3a)',
  barTrack: 'rgba(3, 26, 30, 0.75)',
  focus: '#e8c766',
  portraitShade: 'inset 0 0 6px 2px rgba(3, 26, 30, 0.6)',
  fade: 'linear-gradient(180deg, #000 78%, transparent)',
} as const;
