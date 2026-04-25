/**
 * Centralized feature flag definitions.
 * Config-first: every feature toggle is sourced from env vars (with safe fallbacks)
 * so specs can reference a single object (e.g., FeatureFlags.archmage.stsSimulator).
 */

type FlagValue = boolean;

const parseBooleanFlag = (value: string | undefined, fallback: boolean): boolean => {
  if (value == null) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'on') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'off') {
    return false;
  }
  return fallback;
};

export interface FeatureFlagNamespaces {
  archmage: {
    /**
     * Enables the STS Numeric Simulator tool (KS-080 / KS-081).
     * Default: enabled in dev builds, disabled otherwise unless explicitly flipped.
     */
    stsSimulator: FlagValue;
  };
  idleVillage: {
    /**
     * Enables drag preview instrumentation for dev workflows (NP-144).
     * Default: enabled in dev builds, disabled otherwise unless explicitly flipped.
     */
    dragPreviewInstrumentation: FlagValue;
    /**
     * Enables gameplay modifier telemetry emissions (GM-TEL).
     * Default: disabled unless explicitly flipped.
     */
    modifierTelemetry: FlagValue;
    /**
     * Enables SlottedMedal integration in ResidentSlotRack (NP-SM-007).
     * Default: enabled in dev builds, disabled otherwise unless explicitly flipped.
     */
    slottedMedalIntegration: FlagValue;
  };
}

export const isDevRuntime = Boolean(import.meta.env?.DEV);

export const FeatureFlags: FeatureFlagNamespaces = {
  archmage: {
    stsSimulator: parseBooleanFlag(
      import.meta.env?.VITE_FEATURE_ARCHMAGE_STS_SIMULATOR,
      isDevRuntime,
    ),
  },
  idleVillage: {
    dragPreviewInstrumentation: parseBooleanFlag(
      import.meta.env?.VITE_FEATURE_IDLE_VILLAGE_DRAG_PREVIEW_INSTRUMENTATION,
      isDevRuntime,
    ),
    modifierTelemetry: parseBooleanFlag(
      import.meta.env?.VITE_FEATURE_IDLE_VILLAGE_MODIFIER_TELEMETRY,
      false,
    ),
    slottedMedalIntegration: parseBooleanFlag(
      import.meta.env?.VITE_FEATURE_IDLE_VILLAGE_SLOTTED_MEDAL_INTEGRATION,
      isDevRuntime,
    ),
  },
} as const;

/**
 * Helper for checks in components/hooks to reduce direct object drilling.
 */
export function isFeatureEnabled(namespace: keyof FeatureFlagNamespaces, flag: string): boolean {
  const group = FeatureFlags[namespace];
  if (!group || !(flag in group)) {
    return false;
  }
  return Boolean((group as Record<string, FlagValue>)[flag]);
}
