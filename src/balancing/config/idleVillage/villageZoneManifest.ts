import { z } from 'zod';

/**
 * PLAN-106 T1: manifest v2 for the mappa2 village-upgrade zone.
 * Single source of truth for zone, growth ladder, axes, plates, gen lineage
 * and semantic anchors. Runtime, builder and lab all derive from it.
 */

const zoneSchema = z.object({
  x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive(),
  feather: z.object({ shape: z.literal('ellipse'), px: z.number().nonnegative() }),
});

const SLOT_VALUES = ['none', 'wood', 'stone'] as const;
const plateKeyRegex = /^[a-z0-9-]+\|[a-z0-9-]+\|(none|wood|stone)\+(none|wood|stone)$/;

const anchorSchema = z.object({ x: z.number(), y: z.number() });

const plateSchema = z.object({
  /** `growth|defence|slot1+slot2` — slot identity encoded. */
  key: z.string().regex(plateKeyRegex),
  src: z.string().min(1),
  gen: z.object({ parent: z.string().optional(), prompt: z.string().optional() }).optional(),
  /** false = schema-legal state not yet generated (lab hides it). */
  shipped: z.boolean().default(true),
  /** Paired semantic anchors for Gate B layout-lock (defended states required). */
  anchors: z.object({
    buildings: z.array(anchorSchema).optional(),
    ring: z.array(anchorSchema).optional(),
  }).optional(),
});

export const villageManifestSchema = z.object({
  version: z.literal(2),
  zone: zoneSchema,
  growth: z.array(z.string().min(1)).min(1),
  axes: z.object({
    defence: z.object({ values: z.array(z.string().min(1)).min(1) }),
    towers: z.object({ slots: z.literal(2), each: z.array(z.enum(SLOT_VALUES)).min(1) }),
  }),
  uiRules: z.object({ towersRequireDefence: z.boolean() }).default({ towersRequireDefence: true }),
  /**
   * Per-slot upgrade chain (Director 2026-11-04): a slot's tower climbs `chain` in
   * order; a level may need a defence (stone towers only with the stone wall).
   */
  upgrades: z.object({
    towers: z.object({
      chain: z.array(z.enum(SLOT_VALUES)).min(2),
      requires: z.record(z.string(), z.object({ defence: z.string().min(1) })),
    }),
  }).optional(),
  registration: z.object({
    nullEditResidualPx: z.number().nullable(),
    layoutLockMaxPx: z.number().positive(),
  }),
  plates: z.array(plateSchema).min(1),
}).superRefine((m, ctx) => {
  const seen = new Set<string>();
  for (const p of m.plates) {
    if (seen.has(p.key)) ctx.addIssue({ code: 'custom', message: `duplicate plate key ${p.key}` });
    seen.add(p.key);
    const [g, d, slots] = p.key.split('|');
    if (!m.growth.includes(g)) ctx.addIssue({ code: 'custom', message: `key ${p.key}: undeclared growth ${g}` });
    if (!m.axes.defence.values.includes(d)) ctx.addIssue({ code: 'custom', message: `key ${p.key}: undeclared defence ${d}` });
    const [s1, s2] = slots.split('+');
    for (const s of [s1, s2]) if (!m.axes.towers.each.includes(s as (typeof SLOT_VALUES)[number]))
      ctx.addIssue({ code: 'custom', message: `key ${p.key}: undeclared tower value ${s}` });
    if (d !== 'none' && p.shipped && !p.anchors?.ring?.length)
      ctx.addIssue({ code: 'custom', message: `shipped defended key ${p.key} must declare anchors.ring` });
  }
});

export type VillageManifestV2 = z.infer<typeof villageManifestSchema>;


type Upgrades = NonNullable<VillageManifestV2['upgrades']>;

/** Is `level` unlocked for a slot under `defence`? No `upgrades` block = anything goes. */
export function towerLevelAllowed(up: Upgrades | undefined, level: string, defence: string): boolean {
  const need = up?.towers.requires[level];
  return !need || need.defence === defence;
}

/** Next level of the chain above `level` that `defence` unlocks, or null (top / locked). */
export function nextTowerLevel(up: Upgrades | undefined, level: string, defence: string): string | null {
  const chain = up?.towers.chain ?? [];
  const next = chain[chain.indexOf(level as never) + 1];
  return next && towerLevelAllowed(up, next, defence) ? next : null;
}
