/**
 * UI Catalog manifest schema — PLAN-086 (artifact-r012).
 * Single source of truth for the living catalog of /game visible UI
 * components: statuses, versions, declared states, typed drivers,
 * sourceHash staleness, ground_truth evidence cards.
 */
import { z } from 'zod';

/** Machine statuses — append-only history; re-giro adds a version, never resets. */
export const CatalogStatus = z.enum([
  'unassigned',
  'documenting',
  'documented',
  'in_critique',
  'in_review',
  'ruled',
  'implementing',
  'updated',
  'failed',
  'stale',
  'rejected',
  'needs_revision',
  'blocked_contract',
]);
export type CatalogStatus = z.infer<typeof CatalogStatus>;

/** Legal transitions (others are rejected by catalog.mts). */
export const LEGAL_TRANSITIONS: Record<string, string[]> = {
  unassigned: ['documenting'],
  documenting: ['documented', 'documented', 'failed'],
  documented: ['in_critique', 'stale'],
  in_critique: ['in_review', 'failed', 'stale'],
  in_review: ['ruled', 'rejected', 'needs_revision', 'stale'],
  needs_revision: ['in_review'],
  ruled: ['implementing', 'unassigned'],
  implementing: ['updated', 'failed'],
  updated: ['stale', 'unassigned', 'documenting'],
  failed: ['documenting', 'unassigned'],
  stale: ['documenting'],
  rejected: ['unassigned'],
  blocked_contract: ['in_review', 'rejected'],
};

/** Typed state driver — discriminated union, never freeform. */
export const StateDriver = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('surface'), id: z.string().regex(/^S\d+_/) }),
  z.object({ kind: z.literal('surface+key'), surface: z.string(), key: z.string() }),
  z.object({ kind: z.literal('hook'), name: z.string() }),
  z.object({ kind: z.literal('script'), ref: z.string() }),
]);

export const ComponentCategory = z.enum([
  'hud_cluster', 'panel', 'overlay', 'control', 'marker', 'view',
]);

/** Declared state: driver + observable assertion (no shot without pass). */
export const DeclaredState = z.object({
  id: z.string(),
  driver: StateDriver,
  /** Observable assertion that must hold before capture (selector/expected). */
  assertion: z.object({
    selector: z.string(),
    property: z.string().optional(),
    expected: z.string().optional(),
  }),
  viewport: z.object({ width: z.number(), height: z.number() }).optional(),
});

/** ground_truth fact — appearance-specific, discriminating (WITNESS-06..11). */
export const GroundTruthFact = z.object({
  attribute: z.string(),
  expectedValue: z.string(),
  shotId: z.string(),
  stateId: z.string(),
  region: z.string(),
  absenceCheck: z.object({
    method: z.string(),
    inputsInspected: z.array(z.string()),
    result: z.enum(['absent', 'present', 'unverified']),
    at: z.string(),
  }).optional(),
  reviewerOutcome: z.enum(['verified_absent', 'verified_present', 'unverifiable']).optional(),
});

export const ComponentVersion = z.object({
  v: z.number().int().positive(),
  shots: z.array(z.string()),
  pageRevision: z.string().optional(),
  ruling: z.string().nullable(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const CatalogEntry = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  category: ComponentCategory,
  status: CatalogStatus,
  currentVersion: z.number().int().positive().default(1),
  states: z.array(DeclaredState),
  scopeFiles: z.array(z.string()),
  sourceHash: z.string().nullable().default(null),
  links: z.object({
    contract: z.array(z.string()).default([]),
    trusted: z.array(z.string()).default([]),
  }),
  groundTruth: z.array(GroundTruthFact).default([]),
  /** Locator for the isolated component capture (region clip). */
  captureSelector: z.string().nullable().default(null),
  groundTruthApproved: z.object({
    approved: z.boolean(),
    shotSetRevision: z.string(),
    by: z.string().optional(),
    at: z.string().optional(),
  }).nullable().default(null),
  versions: z.array(ComponentVersion).default([]),
  children: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const CatalogManifest = z.object({
  schemaVersion: z.literal(1),
  entries: z.array(CatalogEntry),
});
export type CatalogManifest = z.infer<typeof CatalogManifest>;
export type CatalogEntry = z.infer<typeof CatalogEntry>;
