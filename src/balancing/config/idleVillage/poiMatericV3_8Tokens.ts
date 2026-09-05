import { z } from 'zod';

/**
 * Tokens for PoiMatericV3_8 — "anchored semantic marker".
 * Reuses the V3.6 material ring tokens; this module only carries what V3.8 adds:
 * semantic per-type glyphs, the ground anchor (stem + contact shadow),
 * the rune dampening, and the state channel.
 */
export const poiMatericV3_8TokensSchema = z.object({
  /** Semantic glyph per POI type, drawn centered at 0,0 in a ~24x24 box. */
  semanticIcons: z.object({
    quest: z.string(),
    job: z.string(),
    event: z.string(),
  }),
  /** Glyph rendering parameters. */
  glyph: z.object({
    scale: z.number(),
    strokeWidth: z.number(),
    shadowOffset: z.number(),
    highlightOffset: z.number(),
  }),
  /** Ground anchor: metal stem + contact shadow under the medal. */
  anchor: z.object({
    stemWidth: z.number(),
    stemLength: z.number(),
    stemTopY: z.number(),
    shadowRx: z.number(),
    shadowRy: z.number(),
    shadowCy: z.number(),
    shadowOpacity: z.number(),
  }),
  /** How much the engraved rim script is dampened so the glyph leads. */
  rune: z.object({
    baseOpacity: z.number(),
    litBoost: z.number(),
    lipOpacity: z.number(),
  }),
  /** State channel: visuals that do not rely on colour alone. */
  state: z.object({
    /** Jagged crack across the medal for `expiring`. */
    crackPath: z.string(),
    crackStrokeWidth: z.number(),
    crackOpacity: z.number(),
    /** Dark wax-seal disc over the field for `assigned`. */
    assignedSealRadius: z.number(),
    assignedSealOpacity: z.number(),
    /** Pulsing threat ring for `critical` importance. */
    threatRingWidth: z.number(),
    threatRingOpacity: z.number(),
    threatRingColor: z.string(),
  }),
  /** Below this px size the badge renders in compact mode. */
  compactBelowPx: z.number(),
});

export type PoiMatericV3_8Tokens = z.infer<typeof poiMatericV3_8TokensSchema>;

export const POI_MATERIC_V3_8_TOKENS = poiMatericV3_8TokensSchema.parse({
  semanticIcons: {
    /* quest → rolled scroll: clear "task/message" affordance */
    quest:
      'M-7 -8 L7 -8 L7 5 L-7 5 Z M-7 -8 a2.4 2.4 0 0 1 0 4.8 M7 -8 a2.4 2.4 0 0 1 0 -4.8 M-3.5 -4.5 L3.5 -4.5 M-3.5 -1.5 L1.5 -1.5 M-3.5 1.5 L0.5 1.5',
    /* job → hammer: clear "work" affordance */
    job: 'M-6.5 7 L1 -0.5 M-4 -6 L6.5 -6 L6.5 -10 L-1.5 -10 Z M-6.5 7 a1.6 1.6 0 0 0 2.2 2.2 L3 1.8',
    /* event → four-point comet star: "something happened here" */
    event:
      'M0 -10 L2.4 -2.4 L10 0 L2.4 2.4 L0 10 L-2.4 2.4 L-10 0 L-2.4 -2.4 Z M4 -4 L10.5 -10.5 M5.5 -1 L12 -7.5',
  },
  glyph: {
    scale: 1.12,
    strokeWidth: 2.1,
    shadowOffset: 0.9,
    highlightOffset: -0.5,
  },
  anchor: {
    stemWidth: 2.6,
    stemLength: 9,
    stemTopY: 84,
    shadowRx: 13,
    shadowRy: 3.2,
    shadowCy: 97,
    shadowOpacity: 0.5,
  },
  rune: {
    baseOpacity: 0.3,
    litBoost: 0.12,
    lipOpacity: 0.12,
  },
  state: {
    crackPath: 'M18 30 L30 42 L26 52 L38 60 L34 70 L46 82',
    crackStrokeWidth: 1.4,
    crackOpacity: 0.75,
    assignedSealRadius: 26,
    assignedSealOpacity: 0.55,
    threatRingWidth: 1.8,
    threatRingOpacity: 0.65,
    threatRingColor: '#c03030',
  },
  compactBelowPx: 72,
});
