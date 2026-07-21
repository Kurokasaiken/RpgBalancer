import { z } from 'zod';

/**
 * Valid urgency levels for a world/presentation threat indicator.
 */
export const urgencyLevelSchema = z.enum(['CALM', 'WARNING', 'CRITICAL']);

/** Urgency level type inferred from the schema. */
export type UrgencyLevel = z.infer<typeof urgencyLevelSchema>;

/**
 * Per-urgency visual and localization config.
 */
export const urgencyConfigSchema = z.object({
  color: z.string(),
  ringColor: z.string(),
  labelKey: z.string(),
});

/** Urgency config type inferred from the schema. */
export type UrgencyConfig = z.infer<typeof urgencyConfigSchema>;

/**
 * Config schema for the {@link ThreatStatusIndicator} component.
 *
 * All colors, fallback icon/progress and i18n key prefixes are centralized here
 * so the component stays config-first and can be skinned by swapping presets.
 */
export const threatStatusConfigSchema = z.object({
  urgencies: z.object({
    CALM: urgencyConfigSchema,
    WARNING: urgencyConfigSchema,
    CRITICAL: urgencyConfigSchema,
  }),
  defaultIcon: z.string(),
  defaultProgress: z.number().min(0).max(100),
  typeLabelPrefix: z.string(),
});

/** Threat status config type inferred from the schema. */
export type ThreatStatusConfig = z.infer<typeof threatStatusConfigSchema>;

/**
 * Default threat status configuration.
 *
 * Uses high-contrast signal colors (calm green, warning yellow, critical red)
 * and the English locale keys under `idleVillage:threatStatus`.
 */
export const DEFAULT_THREAT_STATUS_CONFIG: ThreatStatusConfig = {
  urgencies: {
    CALM: {
      color: '#22c55e',
      ringColor: '#22c55e',
      labelKey: 'threatStatus.urgency.calm',
    },
    WARNING: {
      color: '#eab308',
      ringColor: '#eab308',
      labelKey: 'threatStatus.urgency.warning',
    },
    CRITICAL: {
      color: '#ef4444',
      ringColor: '#ef4444',
      labelKey: 'threatStatus.urgency.critical',
    },
  },
  defaultIcon: '/goblin-march-trasparente.png',
  defaultProgress: 65,
  typeLabelPrefix: 'threatStatus.type',
};
