import { z } from 'zod';

/**
 * PLAN-094 leaf contract: `sea-life.json` — the Director's top-down silhouettes cut into hinged parts
 * (scripts/build-mappa2-sealife.py). White + alpha PNGs, tinted at runtime. Strict, like the other leaves.
 */
const Pair = z.tuple([z.number(), z.number()]);

const RigPartSchema = z
  .object({
    role: z.string().min(1),
    file: z.string().regex(/^fx\/sea-life\/[a-z0-9_]+\.png$/),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    pivot: Pair.optional(),
    attach: Pair.optional(),
    gapPx: z.number().nonnegative().optional(),
    offset: Pair.optional(),
  })
  .strict();

const AnimalSchema = z
  .object({
    lengthPx: z.number().int().positive(),
    parts: z.array(RigPartSchema).min(1).max(8),
  })
  .strict()
  .superRefine((value, ctx) => {
    const bodies = value.parts.filter((p) => p.role === 'body').length;
    if (bodies !== 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `expected exactly one body, got ${bodies}` });
    for (const p of value.parts) {
      if (p.role !== 'body' && (!p.pivot || !p.attach)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `part ${p.role} needs pivot and attach` });
      }
    }
  });

export const Mappa2SeaLifeSchema = z
  .object({
    version: z.literal(1),
    animals: z.record(z.string().regex(/^[a-z]+$/), AnimalSchema),
  })
  .strict();

export type Mappa2SeaLife = z.infer<typeof Mappa2SeaLifeSchema>;
