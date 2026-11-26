/**
 * Piece-kit schema — PLAN-130 (battezzato Director 2026-11-21).
 *
 * Un pezzo = unità d'arte/geometria approvata (non componente DOM).
 * Dati: `src/config/hud/pieces.json` — validati da `pieces:check`
 * (globale, in closure:lint) e mai importati a runtime dal primitivo.
 * Convenzioni: revisioni immutabili nell'id `<slug>-vN`; `canonical` e
 * `superseded` sono derivati; sha256 unico in provenance (frame/slice-kit:
 * sha(spec)+sha(golden), MAI del manifest rigenerabile; raster multi-asset:
 * fingerprint canonico delle varianti ordinate, ruling Director 2026-11-26).
 */
import { z } from 'zod';

export const PIECE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9]\d*$/;

/**
 * Tabella normativa ruolo→kind (appendice PLAN-130, estendibile solo via
 * ruling Director). Il `role` del pezzo è la chiave di match: un ornament
 * "skull" non matcha una regione "laurel".
 */
export const ROLE_KIND_TABLE = {
  ctaWindow: 'button-plate',
  sectionFrame: 'frame',
  outerFrame: 'frame',
  controlsFrame: 'frame',
  headerBand: 'band',
  titleBand: 'band',
  engravedBand: 'band',
  railOrnament: 'ornament',
  cornerOrnament: 'ornament',
  laurel: 'ornament',
  gem: 'ornament',
  skull: 'ornament',
  supplyIcon: 'ornament',
  componentGround: 'ground',
  panelGround: 'ground',
  iconPlate: 'icon-plate',
  poiIcon: 'icon-plate',
  // Director ruling 2026-11-26: disco di fase sole/luna multi-asset,
  // riusabile come ornament HUD fuori dalla sola barra Tempo.
  phaseDisc: 'ornament',
  // PLAN-136/R-391: shared Events-derived round control socket and its
  // square alcove sibling. Candidate until Director human-eye baptism.
  controlSocket: 'button-plate',
  alcoveSocket: 'icon-plate',
  // pilota PLAN-130 (provisori, in attesa di ruling Director OB-10):
  nicheFrame: 'frame',
  seatRing: 'ornament',
} as const;

export type PieceRole = keyof typeof ROLE_KIND_TABLE;
export type PieceKind = (typeof ROLE_KIND_TABLE)[PieceRole];

const pieceIdSchema = z
  .string()
  .regex(PIECE_ID_RE, 'id must be <slug>-v<N>, immutable revision in id');

const provenanceSchema = z.object({
  golden: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  ruling: z.string().min(1),
  generator: z.string().optional(),
  promptPath: z.string().optional(),
  date: z.string().min(1),
  deltaE: z.number().optional(),
  partialFields: z.array(z.string()).optional(),
});

const ASSET_KEY_RE = /^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)*$/;

/**
 * Raster assets of a piece. `master` is the legacy single-file form; named
 * variants (for example `sun`/`moon`) make one logical reusable piece
 * multi-asset without splitting immutable revisions that are not independent
 * artworks. Keys are constrained so the provenance fingerprint in the gate
 * is unambiguous and deterministic.
 */
const rasterAssetsSchema = z
  .record(
    z.string().regex(ASSET_KEY_RE, 'asset keys must be lowercase slugs'),
    z.string().min(1),
  )
  .refine((assets) => Object.keys(assets).length > 0, {
    message: 'at least one raster asset is required',
  });

const pieceBase = {
  id: pieceIdSchema,
  scope: z.enum(['hud', 'family']),
  status: z.enum(['candidate', 'baptized', 'retired']),
  role: z.string(),
  dialect: z.string(),
  materials: z.array(z.string()).min(1),
  ornamentScale: z.number().positive().optional(),
  family: z.string().optional(),
  supersedes: pieceIdSchema.optional(),
  nonFusionReason: z.string().optional(),
  provenance: provenanceSchema,
};

const rasterKinds = [
  'ground',
  'ornament',
  'button-plate',
  'band',
  'icon-plate',
] as const;

const rasterPieceSchema = z
  .object({
    ...pieceBase,
    kind: z.enum(rasterKinds),
    assets: rasterAssetsSchema,
  })
  .strict();

const framePieceSchema = z
  .object({
    ...pieceBase,
    kind: z.literal('frame'),
    source: z.enum(['slice-kit', 'standalone']),
    specRef: z.string().optional(),
    assets: rasterAssetsSchema.optional(),
  })
  .strict()
  .superRefine((piece, ctx) => {
    if (piece.source === 'slice-kit' && !piece.specRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'frame/slice-kit requires specRef (geometry lives in the spec)',
      });
    }
    if (piece.source === 'slice-kit' && piece.assets) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'frame/slice-kit must not carry assets (derived by the slicer)',
      });
    }
    if (
      piece.source === 'standalone' &&
      (!piece.assets?.master || Object.keys(piece.assets).length !== 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'frame/standalone requires exactly one assets.master raster',
      });
    }
  });

export const pieceSchema = z.discriminatedUnion('kind', [
  framePieceSchema,
  rasterPieceSchema.extend({ kind: z.literal('ground') }),
  rasterPieceSchema.extend({ kind: z.literal('ornament') }),
  rasterPieceSchema.extend({ kind: z.literal('button-plate') }),
  rasterPieceSchema.extend({ kind: z.literal('band') }),
  rasterPieceSchema.extend({ kind: z.literal('icon-plate') }),
]);

export const registrySchema = z
  .object({
    version: z.literal(1),
    matching: z.object({ tolerance: z.number().min(0).max(1) }),
    dialects: z.array(z.string()).min(1),
    materials: z.array(z.string()).min(1),
    pieces: z.array(pieceSchema),
  })
  .strict();

export type Piece = z.infer<typeof pieceSchema>;
export type PieceRegistry = z.infer<typeof registrySchema>;

// ---- <surface>.regions.json (porting artifact, PLAN-130 §3) ----

export const REJECT_CODES = [
  'scale-mismatch',
  'dialect-intent',
  'role-nuance',
  'quality-insufficient',
  'other',
] as const;

const rejectReasonSchema = z
  .object({
    code: z.enum(REJECT_CODES),
    note: z.string().optional(),
  })
  .superRefine((r, ctx) => {
    if (r.code === 'other' && (r.note ?? '').trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'reason "other" requires note (>=10 chars)',
      });
    }
  });

const regionBase = {
  region: z.string().min(1),
  expectedRole: z.string().min(1),
  expectedDialect: z.string().optional(),
  expectedScale: z.number().positive().optional(),
};

export const regionClassificationSchema = z
  .discriminatedUnion('strategy', [
    z
      .object({
        ...regionBase,
        strategy: z.literal('reuse'),
        pieceId: pieceIdSchema,
        adoptViaRuling: z.string().optional(),
        frozenGolden: z.string().optional(),
      })
      .strict(),
    z
      .object({
        ...regionBase,
        strategy: z.literal('slice-kit'),
        specRef: z.string().min(1),
        pieceRefs: z.record(z.string(), pieceIdSchema).optional(),
      })
      .strict(),
    z
      .object({
        ...regionBase,
        strategy: z.literal('generate'),
        deltaReason: z.string().min(1),
        checkedPieces: z.array(
          z.object({ pieceId: pieceIdSchema, reason: rejectReasonSchema }),
        ),
      })
      .strict(),
    z
      .object({
        ...regionBase,
        strategy: z.enum(['dom-css', 'existing-component']),
        reason: z.string().min(1),
      })
      .strict(),
  ])
  .superRefine((region, ctx) => {
    const tableKind =
      ROLE_KIND_TABLE[region.expectedRole as PieceRole];
    if ((tableKind === 'frame' || tableKind === 'ornament') && region.expectedScale === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `expectedScale required for role "${region.expectedRole}" (kind ${tableKind})`,
      });
    }
    if (region.strategy === 'generate') {
      const others = region.checkedPieces.filter((c) => c.reason.code === 'other');
      if (others.length > 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'more than 2 "other" reasons in one region: boilerplate rejection',
        });
      }
    }
  });

export const regionsFileSchema = z
  .object({
    surface: z.string().min(1),
    family: z.string().optional(),
    regions: z.array(regionClassificationSchema),
  })
  .strict();

export type RegionClassification = z.infer<typeof regionClassificationSchema>;
export type RegionsFile = z.infer<typeof regionsFileSchema>;
