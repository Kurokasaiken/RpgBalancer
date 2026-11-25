/**
 * PLAN-134 T-001/T-002 — read model for the `/hud-lab` LEGO board.
 *
 * The board never writes canon: it reads `pieces.json`, reconciles the older
 * lab cards with explicit mappings, and derives a deterministic inventory
 * revision used by ruling packets. Entries that fail the PLAN-130 schema are
 * surfaced as unresolved inventory defects instead of becoming rulingable by
 * accident.
 */
import piecesJson from '@/config/hud/pieces.json';
import { pieceSchema, type Piece, type PieceKind, type PieceRole } from '@/config/hud/pieceSchema';

/** Review baseline derived from canon. It is display-only and never exported. */
export type BaselineReview = 'approved' | 'undecided' | 'rejected';

/** Classification of a piece-ish lab card against the PLAN-130 piece registry. */
export type LabReconciliationClassification =
  | 'mapped-piece'
  | 'token-material-reference'
  | 'duplicate-deprecated'
  | 'unresolved'
  | 'control-pattern-observed';

/** Explicit bridge between a lab card and one or more immutable piece ids. */
export interface LabReconciliation {
  labEntryId: string;
  classification: LabReconciliationClassification;
  pieceIds?: readonly string[];
  controlPatternId?: string;
  reason?: string;
}

/** Read-only audit row for a recurring DOM/control composition. */
export interface ControlPatternObservation {
  id: string;
  surface: 'stash' | 'roster' | 'cassetto' | 'nav' | 'top-chrome' | 'quest';
  pattern: string;
  observedIn: readonly string[];
  note: string;
}

/** Machine-usable coverage row for the stash/roster/quest migration audit. */
export interface CoverageMatrixRow {
  surface: 'stash' | 'roster' | 'quest';
  need: string;
  role: PieceRole | 'control-pattern';
  reusablePieceIds: readonly string[];
  missingDelta?: string;
  notes?: string;
}

/** Registry entry that cannot be validated as a PLAN-130 piece. */
export interface InvalidRegistryEntry {
  id: string;
  kind?: string;
  status?: 'candidate' | 'baptized' | 'retired';
  issues: readonly string[];
}

/** Complete board inventory snapshot used by UI, export and pure preflight. */
export interface HudLegoInventorySnapshot {
  pieces: readonly Piece[];
  invalidRegistryEntries: readonly InvalidRegistryEntry[];
  labReconciliation: Readonly<Record<string, LabReconciliation>>;
  controlPatterns: readonly ControlPatternObservation[];
  coverageMatrix: readonly CoverageMatrixRow[];
}

/** Structured audit output for T-001; generated artifacts derive from this object. */
export interface HudLegoInventoryAudit {
  pieceCount: number;
  invalidRegistryCount: number;
  classificationCounts: Record<LabReconciliationClassification, number>;
  unmappedPieceIds: readonly string[];
  orphanMappings: readonly { labEntryId: string; pieceId: string }[];
  duplicateIdGroups: readonly string[][];
  schemaIssues: readonly InvalidRegistryEntry[];
  coverageMatrix: readonly CoverageMatrixRow[];
  controlPatterns: readonly ControlPatternObservation[];
}

/** Explicit reconciliation table. A lab card is presentation; these ids are the canonical target. */
export const LAB_PIECE_RECONCILIATION = {
  'frame-smeraldo': {
    labEntryId: 'frame-smeraldo',
    classification: 'mapped-piece',
    pieceIds: ['panel-frame7-v1'],
  },
  'cornici-mockup': {
    labEntryId: 'cornici-mockup',
    classification: 'unresolved',
    reason: 'Legacy extracted corner assets are mounted in production but are not registered as immutable PLAN-130 pieces.',
  },
  'scroll-band': {
    labEntryId: 'scroll-band',
    classification: 'control-pattern-observed',
    controlPatternId: 'scroll-band-vertical',
  },
  'scroll-band-x': {
    labEntryId: 'scroll-band-x',
    classification: 'control-pattern-observed',
    controlPatternId: 'scroll-band-horizontal',
  },
  piastrina: {
    labEntryId: 'piastrina',
    classification: 'unresolved',
    reason: 'Hover/selected plate asset exists but has no immutable piece id or PLAN-130 provenance yet.',
  },
  'cta-confirm': {
    labEntryId: 'cta-confirm',
    classification: 'mapped-piece',
    pieceIds: ['cta-plaque-v1', 'cta-plaque-enamel-v1'],
  },
  'stash-tabs': {
    labEntryId: 'stash-tabs',
    classification: 'control-pattern-observed',
    controlPatternId: 'tab-filter-radiogroup',
  },
  'palette-nav': {
    labEntryId: 'palette-nav',
    classification: 'token-material-reference',
    reason: 'Measured material palette; informational reference, not an artwork piece.',
  },
  'tokens-hud': {
    labEntryId: 'tokens-hud',
    classification: 'token-material-reference',
    reason: 'Skin token sample; informational reference, not an artwork piece.',
  },
  'ground-marmo': {
    labEntryId: 'ground-marmo',
    classification: 'mapped-piece',
    pieceIds: ['cassetto-ground-v1'],
  },
  'box-frame-oro': {
    labEntryId: 'box-frame-oro',
    classification: 'mapped-piece',
    pieceIds: ['box-frame-v1'],
  },
  'niche-oro': {
    labEntryId: 'niche-oro',
    classification: 'mapped-piece',
    pieceIds: ['niche-v1'],
  },
  'rim-oro': {
    labEntryId: 'rim-oro',
    classification: 'mapped-piece',
    pieceIds: ['cassetto-rim-v1'],
  },
  'seat-ring': {
    labEntryId: 'seat-ring',
    classification: 'mapped-piece',
    pieceIds: ['seat-ring-v1'],
  },
  'cornice-cassetto': {
    labEntryId: 'cornice-cassetto',
    classification: 'mapped-piece',
    pieceIds: ['frame-corner-tl-v1', 'frame-corner-bl-v1', 'rail-mid-fold-v1'],
  },
  'cartiglio-vignetta': {
    labEntryId: 'cartiglio-vignetta',
    classification: 'mapped-piece',
    pieceIds: ['cart-corner-v1', 'cart-gem-v1'],
  },
  'emblemi-cassetto': {
    labEntryId: 'emblemi-cassetto',
    classification: 'mapped-piece',
    pieceIds: ['skull-v1', 'chest-v1', 'laurel-v1'],
  },
} as const satisfies Readonly<Record<string, LabReconciliation>>;

/** Read-only control pattern inventory. These objects are not rulingable in v1. */
export const CONTROL_PATTERNS_OBSERVED: readonly ControlPatternObservation[] = [
  {
    id: 'tab-filter-radiogroup',
    surface: 'stash',
    pattern: 'Icon filter tabs as a radiogroup with selected state',
    observedIn: ['stash-tabs'],
    note: 'DOM/control composition; no canonical control id in v1.',
  },
  {
    id: 'scroll-band-vertical',
    surface: 'stash',
    pattern: 'Vertical engraved scroll band bound to real overflow',
    observedIn: ['scroll-band', 'roster', 'stash'],
    note: 'Already reusable as a component primitive, outside piece ruling.',
  },
  {
    id: 'scroll-band-horizontal',
    surface: 'cassetto',
    pattern: 'Horizontal engraved scroll band for seat/supply rails',
    observedIn: ['scroll-band-x', 'cassetto'],
    note: 'Read-only audit row; governance requires a later control-pattern plan.',
  },
  {
    id: 'slot-grid-inventory',
    surface: 'stash',
    pattern: 'Inventory niche grid with hover/selected affordance',
    observedIn: ['stash', 'niche-oro', 'piastrina'],
    note: 'The niche artwork is rulingable; interaction composition is not.',
  },
  {
    id: 'roster-row-medallion',
    surface: 'roster',
    pattern: 'Resident row: medallion, name, status chips, compact actions',
    observedIn: ['roster'],
    note: 'Observed composition for migration; no new registry entry.',
  },
  {
    id: 'drawer-section-collapse',
    surface: 'cassetto',
    pattern: 'Drawer section headers with dense inline values',
    observedIn: ['cassetto'],
    note: 'Open design question from the cassetto critique; not governed here.',
  },
  {
    id: 'nav-icon-command',
    surface: 'nav',
    pattern: 'Painted navigation icon button with active state',
    observedIn: ['nav'],
    note: 'Audit only; active/hover/disabled states need a later control contract.',
  },
  {
    id: 'speed-control-pills',
    surface: 'top-chrome',
    pattern: 'Speed/pause engraved pill controls',
    observedIn: ['time-sole', 'top-chrome'],
    note: 'Audit only; related round control art exists as controls-frame-v1.',
  },
];

/** Stash/roster/quest coverage matrix. `missingDelta` is explicit when no piece covers the need. */
export const COVERAGE_MATRIX: readonly CoverageMatrixRow[] = [
  {
    surface: 'stash',
    need: 'Panel ground behind grid/detail',
    role: 'panelGround',
    reusablePieceIds: ['cassetto-ground-v1'],
    notes: 'Already the same material family used by the cassetto.',
  },
  {
    surface: 'stash',
    need: 'Outer panel frame',
    role: 'outerFrame',
    reusablePieceIds: ['panel-frame7-v1', 'panel-frame5-v1'],
  },
  {
    surface: 'stash',
    need: 'Inventory item niches',
    role: 'nicheFrame',
    reusablePieceIds: ['niche-v1'],
  },
  {
    surface: 'stash',
    need: 'Primary CTA plate',
    role: 'ctaWindow',
    reusablePieceIds: ['cta-plaque-v1', 'cta-plaque-enamel-v1'],
  },
  {
    surface: 'stash',
    need: 'Hover/selected plate for grid tiles',
    role: 'control-pattern',
    reusablePieceIds: [],
    missingDelta: 'piastrina asset is present but unresolved in pieces.json',
  },
  {
    surface: 'stash',
    need: 'Filter tabs and sort controls',
    role: 'control-pattern',
    reusablePieceIds: ['controls-frame-v1'],
    missingDelta: 'control composition/state contract is audit-only in v1',
  },
  {
    surface: 'roster',
    need: 'Outer frame for roster panel/columns',
    role: 'outerFrame',
    reusablePieceIds: ['panel-frame7-v1', 'panel-frame5-v1'],
  },
  {
    surface: 'roster',
    need: 'Resident medallion/seat ring',
    role: 'seatRing',
    reusablePieceIds: ['seat-ring-v1', 'dial-frame-v1'],
    missingDelta: 'production dragon ghiera is approved but not represented as an immutable piece',
  },
  {
    surface: 'roster',
    need: 'Row separators/engraved bands',
    role: 'engravedBand',
    reusablePieceIds: ['cassetto-rim-v1', 'frame-bar-north-v1', 'frame-bar-south-v1'],
  },
  {
    surface: 'roster',
    need: 'Small secondary action plates',
    role: 'ctaWindow',
    reusablePieceIds: ['cta-plaque-v1'],
    missingDelta: 'small/medium button-plate scale family is missing',
  },
  {
    surface: 'quest',
    need: 'Quest drawer/theatre ground',
    role: 'panelGround',
    reusablePieceIds: ['cassetto-ground-v1'],
  },
  {
    surface: 'quest',
    need: 'Vignette/story cartouche frame',
    role: 'cornerOrnament',
    reusablePieceIds: ['cart-corner-v1', 'cart-gem-v1'],
  },
  {
    surface: 'quest',
    need: 'Risk/reward iconography',
    role: 'supplyIcon',
    reusablePieceIds: ['skull-v1', 'chest-v1', 'laurel-v1'],
  },
  {
    surface: 'quest',
    need: 'Primary launch/confirm CTA',
    role: 'ctaWindow',
    reusablePieceIds: ['cta-plaque-v1', 'cta-plaque-enamel-v1'],
  },
  {
    surface: 'quest',
    need: 'Choice rows and check option controls',
    role: 'control-pattern',
    reusablePieceIds: ['controls-frame-v1'],
    missingDelta: 'choice-row composition and state variants need a control-pattern plan',
  },
];

/** Canonical kind order from PLAN-130; labels stay in i18n. */
export const PIECE_KIND_ORDER: readonly PieceKind[] = ['ground', 'frame', 'button-plate', 'band', 'ornament', 'icon-plate'];

/** Map canonical status to the display baseline required by PLAN-134. */
export function baselineForStatus(status: Piece['status']): BaselineReview {
  if (status === 'baptized') return 'approved';
  if (status === 'retired') return 'rejected';
  return 'undecided';
}

/** Deterministic JSON serialization: object keys sorted recursively, arrays preserved. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((key) => obj[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`)
    .join(',')}}`;
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/** Synchronous SHA-256 hex digest for browser and test runtimes. */
export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const paddedLen = (((bytes.length + 8) >> 6) + 1) << 6;
  const buf = new Uint8Array(paddedLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let block = 0; block < paddedLen; block += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(block + i * 4, false);
    for (let i = 16; i < 64; i += 1) {
      const x = w[i - 15];
      const y = w[i - 2];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    for (let i = 0; i < 64; i += 1) {
      const s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7].map((n) => n.toString(16).padStart(8, '0')).join('');
}

/** Parse the registry piece-by-piece so one invalid entry cannot hide the valid inventory. */
export function createInventorySnapshot(): HudLegoInventorySnapshot {
  const rawPieces = (piecesJson as { pieces?: unknown[] }).pieces ?? [];
  const pieces: Piece[] = [];
  const invalidRegistryEntries: InvalidRegistryEntry[] = [];
  rawPieces.forEach((raw, index) => {
    const parsed = pieceSchema.safeParse(raw);
    if (parsed.success) {
      pieces.push(parsed.data);
      return;
    }
    const partial = raw as { id?: string; kind?: string; status?: 'candidate' | 'baptized' | 'retired' };
    invalidRegistryEntries.push({
      id: partial.id ?? `index-${index}`,
      kind: partial.kind,
      status: partial.status,
      issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    });
  });
  return {
    pieces,
    invalidRegistryEntries,
    labReconciliation: LAB_PIECE_RECONCILIATION,
    controlPatterns: CONTROL_PATTERNS_OBSERVED,
    coverageMatrix: COVERAGE_MATRIX,
  };
}

/** Serialize the inventory inputs that define `inventoryRev`, sorted and presentation-independent. */
export function inventoryRevisionPayload(snapshot: HudLegoInventorySnapshot): unknown {
  const mappings = Object.values(snapshot.labReconciliation)
    .flatMap((entry) => (entry.pieceIds ?? []).map((pieceId) => ({ labEntryId: entry.labEntryId, pieceId })))
    .sort((a, b) => `${a.labEntryId}:${a.pieceId}`.localeCompare(`${b.labEntryId}:${b.pieceId}`));
  const unresolvedLab = Object.values(snapshot.labReconciliation)
    .filter((entry) => entry.classification === 'unresolved')
    .map((entry) => ({ labEntryId: entry.labEntryId, reason: entry.reason ?? '' }))
    .sort((a, b) => a.labEntryId.localeCompare(b.labEntryId));
  const unresolvedRegistry = snapshot.invalidRegistryEntries
    .map((entry) => ({ labEntryId: `registry:${entry.id}`, reason: entry.issues.join('; ') }))
    .sort((a, b) => a.labEntryId.localeCompare(b.labEntryId));
  return {
    schemaVersion: 1,
    pieces: snapshot.pieces
      .map((piece) => ({ id: piece.id, kind: piece.kind, status: piece.status }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    labMappings: mappings,
    unresolved: [...unresolvedLab, ...unresolvedRegistry],
  };
}

/** Compute the deterministic SHA-256 inventory revision required by ruling packet v1. */
export function computeInventoryRev(snapshot: HudLegoInventorySnapshot = createInventorySnapshot()): string {
  return sha256Hex(canonicalize(inventoryRevisionPayload(snapshot)));
}

/** Build the machine-usable audit object consumed by docs, tests and the generator script. */
export function buildInventoryAudit(snapshot: HudLegoInventorySnapshot = createInventorySnapshot()): HudLegoInventoryAudit {
  const pieceIds = new Set(snapshot.pieces.map((piece) => piece.id));
  const mappedIds = new Set(Object.values(snapshot.labReconciliation).flatMap((entry) => entry.pieceIds ?? []));
  const orphanMappings = Object.values(snapshot.labReconciliation).flatMap((entry) =>
    (entry.pieceIds ?? [])
      .filter((pieceId) => !pieceIds.has(pieceId))
      .map((pieceId) => ({ labEntryId: entry.labEntryId, pieceId })),
  );
  const byBaseId = new Map<string, string[]>();
  for (const piece of snapshot.pieces) {
    const base = piece.id.replace(/-v[1-9]\d*$/, '');
    byBaseId.set(base, [...(byBaseId.get(base) ?? []), piece.id]);
  }
  const duplicateIdGroups = [...byBaseId.values()].filter((ids) => ids.length > 1).map((ids) => ids.sort());
  const classificationCounts: Record<LabReconciliationClassification, number> = {
    'mapped-piece': 0,
    'token-material-reference': 0,
    'duplicate-deprecated': 0,
    unresolved: 0,
    'control-pattern-observed': 0,
  };
  for (const entry of Object.values(snapshot.labReconciliation)) classificationCounts[entry.classification] += 1;
  return {
    pieceCount: snapshot.pieces.length,
    invalidRegistryCount: snapshot.invalidRegistryEntries.length,
    classificationCounts,
    unmappedPieceIds: snapshot.pieces.map((piece) => piece.id).filter((id) => !mappedIds.has(id)).sort(),
    orphanMappings,
    duplicateIdGroups,
    schemaIssues: snapshot.invalidRegistryEntries,
    coverageMatrix: snapshot.coverageMatrix,
    controlPatterns: snapshot.controlPatterns,
  };
}
