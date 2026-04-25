/**
 * SkinBindingRegistry
 * 
 * Centralized registry for mapping components to skin configurations
 * Provides type-safe binding between certified components and their skin configs
 * Used by NP-SM-021 to apply skin binding to certified roster components
 */

import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import type { SkinPresetId } from '@/ui/idleVillage/skins/skinConfigRegistry';

// Define types locally to avoid import issues
type MotionLevel = 'minimal' | 'reduced' | 'full';

/**
 * Certified component identifiers
 */
// This type is now exported from SkinSchema.ts to avoid duplication
export type { CertifiedComponentId } from './types/SkinSchema';

/**
 * Skin binding configuration for a component
 */
export interface ComponentSkinBinding {
  /** Component identifier */
  componentId: CertifiedComponentId;
  /** Default skin preset for this component */
  defaultPreset: SkinPresetId;
  /** Supported pillars for this component */
  supportedPillars: StyleLabPillar[];
  /** Skin-specific CSS class base */
  cssClassBase: string;
  /** Data attribute prefix */
  dataAttributePrefix: string;
  /** Whether component supports motion level switching */
  supportsMotionLevel: boolean;
  /** Whether component supports telemetry */
  supportsTelemetry: boolean;
  /** Additional skin-specific properties */
  skinProperties?: Record<string, unknown>;
}

/**
 * Registry of all certified component skin bindings
 */
export const CERTIFIED_COMPONENT_BINDINGS: Record<CertifiedComponentId, ComponentSkinBinding> = {
  PgCard: {
    componentId: 'PgCard',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'pgcard-skin',
    dataAttributePrefix: 'pgcard',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      materialType: 'medal',
      interactionPhysics: true,
      audioHaptics: true,
    },
  },

  ResidentSlotRack: {
    componentId: 'ResidentSlotRack',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'slotrack-skin',
    dataAttributePrefix: 'slotrack',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      slotType: 'resident',
      dropZones: true,
      dragFeedback: true,
    },
  },

  TimeEngineStrip: {
    componentId: 'TimeEngineStrip',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'timeengine-skin',
    dataAttributePrefix: 'timeengine',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      clockStyle: 'digital',
      accentGlow: true,
      valueChangeConfig: true,
    },
  },

  ActiveHUD: {
    componentId: 'ActiveHUD',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'activehud-skin',
    dataAttributePrefix: 'activehud',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      hudStyle: 'minimal',
      activityMonitoring: true,
      valueChangeConfig: true,
    },
  },

  ActivityCapsule: {
    componentId: 'ActivityCapsule',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'activitycapsule-skin',
    dataAttributePrefix: 'activitycapsule',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      capsuleStyle: 'minimal',
      slotDisplay: true,
      haloPulses: true,
    },
  },

  ActionHalo: {
    componentId: 'ActionHalo',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'actionhalo-skin',
    dataAttributePrefix: 'actionhalo',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      haloStyle: 'minimal',
      pulseAnimation: true,
      interactionFeedback: true,
    },
  },

  SlottedMedal: {
    componentId: 'SlottedMedal',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'slottedmedal-skin',
    dataAttributePrefix: 'slottedmedal',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      medalType: 'bronze',
      interactionPhysics: true,
      resistRing: true,
      haloCanvas: true,
    },
  },

  VillageRosterSection: {
    componentId: 'VillageRosterSection',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'villageroster-skin',
    dataAttributePrefix: 'villageroster',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      rosterStyle: 'minimal',
      residentCards: true,
      dragOperations: true,
    },
  },

  POI: {
    componentId: 'POI',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'poi-skin',
    dataAttributePrefix: 'poi',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      poiType: 'map-marker',
      haloAnimation: true,
      interactionFeedback: true,
    },
  },

  ActivitySlot: {
    componentId: 'ActivitySlot',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'activityslot-skin',
    dataAttributePrefix: 'activityslot',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      slotType: 'activity',
      dropZone: true,
      progressDisplay: true,
    },
  },
};

/**
 * Get skin binding for a certified component
 */
export function getComponentSkinBinding(componentId: CertifiedComponentId): ComponentSkinBinding {
  const binding = CERTIFIED_COMPONENT_BINDINGS[componentId];
  if (!binding) {
    throw new Error(`No skin binding found for component: ${componentId}`);
  }
  return binding;
}

/**
 * Check if a component is certified for skin binding
 */
export function isCertifiedComponent(componentId: string): componentId is CertifiedComponentId {
  return componentId in CERTIFIED_COMPONENT_BINDINGS;
}

/**
 * Get all certified component IDs
 */
export function getCertifiedComponentIds(): CertifiedComponentId[] {
  return Object.keys(CERTIFIED_COMPONENT_BINDINGS) as CertifiedComponentId[];
}

/**
 * Get components that support a specific pillar
 */
export function getComponentsForPillar(pillar: StyleLabPillar): CertifiedComponentId[] {
  return getCertifiedComponentIds().filter(componentId => {
    const binding = getComponentSkinBinding(componentId);
    return binding.supportedPillars.includes(pillar);
  });
}

/**
 * Generate CSS class name for a component with current skin
 */
export function generateSkinClassName(
  componentId: CertifiedComponentId,
  presetId: SkinPresetId,
  pillar: StyleLabPillar
): string {
  const binding = getComponentSkinBinding(componentId);
  return `${binding.cssClassBase}-${presetId} ${binding.cssClassBase}-${pillar}`;
}

/**
 * Generate data attributes for a component with current skin
 */
export function generateSkinDataAttributes(
  componentId: CertifiedComponentId,
  presetId: SkinPresetId,
  pillar: StyleLabPillar,
  motionLevel: MotionLevel
): Record<string, string> {
  const binding = getComponentSkinBinding(componentId);
  const attributes: Record<string, string> = {
    [`data-${binding.dataAttributePrefix}-preset`]: presetId,
    [`data-${binding.dataAttributePrefix}-pillar`]: pillar,
  };

  if (binding.supportsMotionLevel && motionLevel) {
    attributes[`data-${binding.dataAttributePrefix}-motion`] = motionLevel;
  }

  return attributes;
}

/**
 * Get telemetry event name for a component
 */
export function getComponentTelemetryEvent(
  componentId: CertifiedComponentId,
  action: string
): string {
  const binding = getComponentSkinBinding(componentId);
  return `skin_${binding.dataAttributePrefix}_${action}`;
}

/**
 * Skin binding utilities for components
 */
export const SkinBindingUtils = {
  getBinding: getComponentSkinBinding,
  isCertified: isCertifiedComponent,
  getAllIds: getCertifiedComponentIds,
  getByPillar: getComponentsForPillar,
  generateClassName: generateSkinClassName,
  generateDataAttributes: generateSkinDataAttributes,
  getTelemetryEvent: getComponentTelemetryEvent,
} as const;

export default SkinBindingUtils;
