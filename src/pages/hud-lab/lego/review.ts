/**
 * PLAN-134 T-004/T-005 — in-memory review model, ruling packet v1 and pure
 * preflight validation. No function in this module mutates canon or storage.
 */
import { z } from 'zod';
import { REJECT_CODES } from '@/config/hud/pieceSchema';
import {
  baselineForStatus,
  computeInventoryRev,
  createInventorySnapshot,
  type BaselineReview,
  type HudLegoInventorySnapshot,
} from './inventory';

/** Canonical reject reason code from PLAN-130/PLAN-134. */
export type RejectReason = (typeof REJECT_CODES)[number];

/** Explicit Director decision held only in memory by the board. */
export interface PieceRulingInput {
  decision: 'approved' | 'rejected';
  reason?: RejectReason;
  note?: string;
  constraint?: string;
}

/** Touched review state keyed by immutable piece id. */
export type PieceReviewState = Readonly<Record<string, PieceRulingInput | undefined>>;

/** One machine-exportable ruling decision. */
export interface RulingPacketDecision {
  entityType: 'piece';
  id: string;
  decision: 'approved' | 'rejected';
  previousStatus: 'candidate' | 'baptized' | 'retired';
  reason?: RejectReason;
  note?: string;
  constraint?: string;
  decidedAt: string;
}

/** Versioned machine-first ruling packet exported by the board. */
export interface RulingPacket {
  schemaVersion: 1;
  generatedAt: string;
  inventoryRev: string;
  decisions: RulingPacketDecision[];
}

/** Validation issue for export/preflight, machine-readable first. */
export interface RulingValidationIssue {
  code:
    | 'missing-reason'
    | 'missing-other-note'
    | 'retired-reapproval'
    | 'unknown-piece'
    | 'schema-invalid'
    | 'inventory-stale'
    | 'status-conflict'
    | 'no-decisions';
  pieceId?: string;
  message: string;
}

/** Result of building an export packet. */
export interface RulingPacketBuildResult {
  packet?: RulingPacket;
  issues: RulingValidationIssue[];
}

/** Zod schema for the machine packet. This is validation only, not a second source of truth. */
export const rulingPacketSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: z.string().min(1),
    inventoryRev: z.string().regex(/^[0-9a-f]{64}$/),
    decisions: z.array(
      z
        .object({
          entityType: z.literal('piece'),
          id: z.string().min(1),
          decision: z.enum(['approved', 'rejected']),
          previousStatus: z.enum(['candidate', 'baptized', 'retired']),
          reason: z.enum(REJECT_CODES).optional(),
          note: z.string().optional(),
          constraint: z.string().optional(),
          decidedAt: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

/** Effective display state: explicit touched ruling when present, otherwise derived baseline. */
export function effectiveReviewState(pieceStatus: 'candidate' | 'baptized' | 'retired', ruling?: PieceRulingInput): BaselineReview {
  return ruling?.decision ?? baselineForStatus(pieceStatus);
}

/** Validate one touched decision against the deterministic transition table. */
export function validateRulingInput(pieceStatus: 'candidate' | 'baptized' | 'retired', pieceId: string, ruling: PieceRulingInput): RulingValidationIssue[] {
  const issues: RulingValidationIssue[] = [];
  if (pieceStatus === 'retired' && ruling.decision === 'approved') {
    issues.push({
      code: 'retired-reapproval',
      pieceId,
      message: 'A retired immutable piece id cannot be re-approved; create a new revision instead.',
    });
  }
  if (ruling.decision === 'rejected' && !ruling.reason) {
    issues.push({ code: 'missing-reason', pieceId, message: 'Rejected decisions require a reason.' });
  }
  if (ruling.decision === 'rejected' && ruling.reason === 'other' && !(ruling.note ?? '').trim()) {
    issues.push({ code: 'missing-other-note', pieceId, message: 'Reason "other" requires a non-empty note.' });
  }
  return issues;
}

/** Build packet v1 from touched decisions only; derived baselines are never exported. */
export function buildRulingPacket(
  reviewState: PieceReviewState,
  snapshot: HudLegoInventorySnapshot = createInventorySnapshot(),
  now: string = new Date().toISOString(),
): RulingPacketBuildResult {
  const byId = new Map(snapshot.pieces.map((piece) => [piece.id, piece]));
  const issues: RulingValidationIssue[] = [];
  const decisions: RulingPacketDecision[] = [];
  for (const [pieceId, ruling] of Object.entries(reviewState)) {
    if (!ruling) continue;
    const piece = byId.get(pieceId);
    if (!piece) {
      issues.push({ code: 'unknown-piece', pieceId, message: 'Decision references a piece outside the valid inventory.' });
      continue;
    }
    issues.push(...validateRulingInput(piece.status, pieceId, ruling));
    decisions.push({
      entityType: 'piece',
      id: pieceId,
      decision: ruling.decision,
      previousStatus: piece.status,
      ...(ruling.reason ? { reason: ruling.reason } : {}),
      ...(ruling.note?.trim() ? { note: ruling.note.trim() } : {}),
      ...(ruling.constraint?.trim() ? { constraint: ruling.constraint.trim() } : {}),
      decidedAt: now,
    });
  }
  decisions.sort((a, b) => a.id.localeCompare(b.id));
  if (decisions.length === 0) {
    issues.push({ code: 'no-decisions', message: 'No touched decisions to export.' });
  }
  if (issues.length > 0) return { issues };
  return {
    issues: [],
    packet: {
      schemaVersion: 1,
      generatedAt: now,
      inventoryRev: computeInventoryRev(snapshot),
      decisions,
    },
  };
}

/** Deterministic pretty JSON used by the inline export and clipboard copy. */
export function serializeRulingPacket(packet: RulingPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

/** Human-readable summary generated from the same packet object; never an independent source. */
export function renderRulingPacketMarkdown(packet: RulingPacket): string {
  const lines = [
    `# Ruling packet v1`,
    ``,
    `- generatedAt: ${packet.generatedAt}`,
    `- inventoryRev: ${packet.inventoryRev}`,
    `- decisions: ${packet.decisions.length}`,
    ``,
  ];
  for (const decision of packet.decisions) {
    const extras = [decision.reason ? `reason=${decision.reason}` : '', decision.constraint ? `constraint=${decision.constraint}` : '', decision.note ? `note=${decision.note}` : '']
      .filter(Boolean)
      .join(' · ');
    lines.push(`- ${decision.id}: ${decision.decision} (was ${decision.previousStatus})${extras ? ` — ${extras}` : ''}`);
  }
  return `${lines.join('\n')}\n`;
}

/** Preflight outcome for applying a packet to canon. */
export interface RulingPacketPreflightResult {
  status: 'applicable' | 'stale' | 'conflict' | 'invalid';
  issues: RulingValidationIssue[];
  transitions: Array<{ id: string; from: string; to: 'baptized' | 'retired' | 'unchanged' }>;
}

/** Pure packet preflight: validates schema, hash, ids, status and immutable-retirement conflicts. */
export function preflightRulingPacket(
  input: unknown,
  snapshot: HudLegoInventorySnapshot = createInventorySnapshot(),
): RulingPacketPreflightResult {
  const parsed = rulingPacketSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 'invalid',
      issues: parsed.error.issues.map((issue) => ({ code: 'schema-invalid', message: `${issue.path.join('.')}: ${issue.message}` })),
      transitions: [],
    };
  }
  const packet = parsed.data;
  if (packet.inventoryRev !== computeInventoryRev(snapshot)) {
    return {
      status: 'stale',
      issues: [{ code: 'inventory-stale', message: 'Packet inventoryRev does not match the current inventory; rebase or clarify before applying.' }],
      transitions: [],
    };
  }
  const byId = new Map(snapshot.pieces.map((piece) => [piece.id, piece]));
  const issues: RulingValidationIssue[] = [];
  const transitions: RulingPacketPreflightResult['transitions'] = [];
  for (const decision of packet.decisions) {
    const piece = byId.get(decision.id);
    if (!piece) {
      issues.push({ code: 'unknown-piece', pieceId: decision.id, message: 'Packet references a piece outside the valid inventory.' });
      continue;
    }
    if (piece.status !== decision.previousStatus) {
      issues.push({
        code: 'status-conflict',
        pieceId: decision.id,
        message: `previousStatus ${decision.previousStatus} does not match current ${piece.status}.`,
      });
      continue;
    }
    if (piece.status === 'retired' && decision.decision === 'approved') {
      issues.push({
        code: 'retired-reapproval',
        pieceId: decision.id,
        message: 'A retired immutable piece id cannot be re-approved; stop and create a new revision.',
      });
      continue;
    }
    const to = decision.decision === 'approved'
      ? piece.status === 'baptized'
        ? 'unchanged'
        : 'baptized'
      : piece.status === 'retired'
        ? 'unchanged'
        : 'retired';
    transitions.push({ id: decision.id, from: piece.status, to });
  }
  if (issues.length > 0) return { status: 'conflict', issues, transitions: [] };
  return { status: 'applicable', issues: [], transitions };
}
