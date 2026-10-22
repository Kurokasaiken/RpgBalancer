/**
 * Legacy reliquary config (PLAN-067 T-C4, R-234, LEG = B; DN-1 decided: dynamic slots from the built buildings).
 *
 * Each legacy category is fed by one village building: a category has as many slots as that building's level,
 * and none while the building is absent or not built. Presentation and mock only — the choice is kept in memory.
 */
import { z } from 'zod';

export const legacyReliquaryConfigSchema = z
  .object({
    categories: z
      .array(
        z
          .object({
            category: z.enum(['items', 'heroes', 'blueprints']),
            buildingId: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export type LegacyReliquaryConfig = z.infer<typeof legacyReliquaryConfigSchema>;

export const LEGACY_RELIQUARY_CONFIG: LegacyReliquaryConfig = legacyReliquaryConfigSchema.parse({
  categories: [
    { category: 'items', buildingId: 'warehouse' },
    { category: 'heroes', buildingId: 'sanctuary' },
    { category: 'blueprints', buildingId: 'mageTower' },
  ],
});
