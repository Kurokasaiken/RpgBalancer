import { z } from 'zod';

/**
 * Runtime schema for HTML-based temporary skins (Activity Capsule POI preview, dev skins, etc.).
 */
export const TemporarySkinColorValueSchema = z.union([
  z.string(),
  z.object({
    r: z.number(),
    g: z.number(),
    b: z.number(),
    label: z.string().optional(),
  }),
]);

export const TemporarySkinComponentSlotSchema = z.object({
  /** CSS selector for the container that hosts this slot */
  container: z.string(),
  /** Replace host markup entirely (dangerous, default false) */
  replaceContent: z.boolean().default(false),
  /** Preserve the existing DOM structure within the container */
  preserveStructure: z.boolean().default(true),
  /** Map between logical slot IDs and DOM selectors inside the template */
  slotBindings: z.record(z.string(), z.string()),
});

export const TemporarySkinConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  author: z.string(),
  quality: z.enum(['placeholder', 'wip', 'final']).default('final'),
  targetVersion: z.string(),
  compatibility: z.array(z.string()).nonempty(),
  htmlTemplate: z.string(),
  cssStyles: z.string(),
  componentSlots: z.record(z.string(), TemporarySkinComponentSlotSchema),
  colorTokens: z.record(z.string(), TemporarySkinColorValueSchema),
  filters: z.record(z.string(), z.any()).optional(),
  animation: z.record(z.string(), z.any()).optional(),
  particles: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type TemporarySkinComponentSlot = z.infer<typeof TemporarySkinComponentSlotSchema>;
export type TemporarySkinConfig = z.infer<typeof TemporarySkinConfigSchema>;

export function validateTemporarySkinConfig(config: TemporarySkinConfig): void {
  TemporarySkinConfigSchema.parse(config);
}
