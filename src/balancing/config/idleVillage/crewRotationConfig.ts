/**
 * Crew Rotation Configuration – NP‑145 Phase E Knowledge Base
 * 
 * Config-first schema for crew rotation definitions including slots,
 * prerequisites, and KPI targets. All rotation data lives here
 * to enable designer-driven updates without code changes.
 * 
 * @since NP‑145
 * @version phase-e-1.0.0
 */

import { z } from 'zod';
import type { StatRequirement } from './types';

/**
 * KPI targets for a crew rotation slot.
 */
export interface CrewRotationKpiTargets {
  /** Minimum total stat tag match score across all assigned residents (0‑1) */
  minStatMatchScore: number;
  /** Maximum acceptable fatigue average for the rotation (0‑1) */
  maxFatigueAverage: number;
  /** Minimum specialization score for preferred activities (0‑1) */
  minSpecializationScore: number;
  /** Target efficiency multiplier (1.0 = baseline) */
  targetEfficiencyMultiplier: number;
}

/**
 * Prerequisites for residents to be eligible for a rotation slot.
 */
export interface CrewRotationPrerequisites {
  /** Required stat tags (allOf/anyOf/noneOf) */
  statRequirement?: StatRequirement;
  /** Minimum resident level */
  minLevel?: number;
  /** Maximum resident fatigue to be eligible */
  maxFatigue?: number;
  /** Required activity tags residents must have experience with */
  requiredActivityTags?: string[];
  /** Blacklisted activity tags residents must not have */
  blacklistedActivityTags?: string[];
}

/**
 * Definition of a single crew rotation slot.
 */
export interface CrewRotationSlot {
  /** Unique slot identifier */
  id: string;
  /** Human‑readable slot label */
  label: string;
  /** Slot description for UI tooltips */
  description?: string;
  /** Icon name for visual representation */
  iconName: string;
  /** Slot tags used for filtering/grouping */
  tags: string[];
  /** Maximum number of residents that can occupy this slot */
  maxResidents: number;
  /** Prerequisites for residents to be eligible */
  prerequisites: CrewRotationPrerequisites;
  /** KPI targets this slot should achieve */
  kpiTargets: CrewRotationKpiTargets;
  /** Activity tags this slot supports */
  supportedActivityTags: string[];
  /** Optional per‑slot modifiers (fatigue, risk, yield) */
  modifiers?: {
    fatigueMult?: number;
    riskMult?: number;
    yieldMult?: number;
  };
  /** Whether this slot is locked by phase (day/night) */
  phaseLocked?: 'day' | 'night';
  /** Priority weight for assignment decisions */
  priorityWeight: number;
}

/**
 * Complete crew rotation definition.
 */
export interface CrewRotation {
  /** Unique rotation identifier */
  id: string;
  /** Human‑readable rotation name */
  name: string;
  /** Rotation description */
  description?: string;
  /** Rotation version for compatibility tracking */
  version: string;
  /** Array of slots that make up this rotation */
  slots: CrewRotationSlot[];
  /** Global KPI targets for the entire rotation */
  globalKpiTargets: CrewRotationKpiTargets;
  /** Tags for categorizing rotations */
  tags: string[];
  /** Whether this rotation is active/enabled */
  enabled: boolean;
  /** Metadata for designer notes */
  metadata?: Record<string, unknown>;
}

/**
 * Complete crew rotation configuration container.
 */
export interface CrewRotationConfig {
  /** Configuration version */
  version: string;
  /** All defined crew rotations */
  rotations: CrewRotation[];
  /** Global configuration defaults */
  defaults: {
    /** Default KPI targets for new rotations */
    kpiTargets: CrewRotationKpiTargets;
    /** Default prerequisites for new slots */
    prerequisites: CrewRotationPrerequisites;
  };
}

// Zod schemas for validation

const CrewRotationKpiTargetsSchema = z.object({
  minStatMatchScore: z.number().min(0).max(1),
  maxFatigueAverage: z.number().min(0).max(1),
  minSpecializationScore: z.number().min(0).max(1),
  targetEfficiencyMultiplier: z.number().min(0),
});

const CrewRotationPrerequisitesSchema = z.object({
  statRequirement: z.object({
    allOf: z.array(z.string()).optional(),
    anyOf: z.array(z.string()).optional(),
    noneOf: z.array(z.string()).optional(),
    label: z.string().optional(),
  }).optional(),
  minLevel: z.number().int().min(1).optional(),
  maxFatigue: z.number().min(0).max(1).optional(),
  requiredActivityTags: z.array(z.string()).optional(),
  blacklistedActivityTags: z.array(z.string()).optional(),
});

const CrewRotationSlotSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  iconName: z.string().min(1),
  tags: z.array(z.string()),
  maxResidents: z.number().int().min(1),
  prerequisites: CrewRotationPrerequisitesSchema,
  kpiTargets: CrewRotationKpiTargetsSchema,
  supportedActivityTags: z.array(z.string()),
  modifiers: z.object({
    fatigueMult: z.number().min(0).optional(),
    riskMult: z.number().min(0).optional(),
    yieldMult: z.number().min(0).optional(),
  }).optional(),
  phaseLocked: z.enum(['day', 'night']).optional(),
  priorityWeight: z.number().min(0),
});

const CrewRotationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().min(1),
  slots: z.array(CrewRotationSlotSchema),
  globalKpiTargets: CrewRotationKpiTargetsSchema,
  tags: z.array(z.string()),
  enabled: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CrewRotationConfigSchema = z.object({
  version: z.string().min(1),
  rotations: z.array(CrewRotationSchema),
  defaults: z.object({
    kpiTargets: CrewRotationKpiTargetsSchema,
    prerequisites: CrewRotationPrerequisitesSchema,
  }),
});

// Default configuration

export const DEFAULT_CREW_ROTATION_KPI_TARGETS: CrewRotationKpiTargets = {
  minStatMatchScore: 0.5,
  maxFatigueAverage: 0.7,
  minSpecializationScore: 0.3,
  targetEfficiencyMultiplier: 1.0,
};

export const DEFAULT_CREW_ROTATION_PREREQUISITES: CrewRotationPrerequisites = {
  minLevel: 1,
  maxFatigue: 0.8,
};

export const DEFAULT_CREW_ROTATION_CONFIG: CrewRotationConfig = {
  version: 'phase-e-1.0.0',
  rotations: [
    {
      id: 'basic-village-rotation',
      name: 'Basic Village Rotation',
      description: 'Standard rotation for daily village activities',
      version: '1.0.0',
      slots: [
        {
          id: 'village-guard',
          label: 'Village Guard',
          description: 'Protects the village during day hours',
          iconName: 'shield',
          tags: ['defense', 'day'],
          maxResidents: 2,
          prerequisites: {
            minLevel: 2,
            requiredActivityTags: ['combat', 'guard'],
            maxFatigue: 0.6,
          },
          kpiTargets: {
            minStatMatchScore: 0.6,
            maxFatigueAverage: 0.5,
            minSpecializationScore: 0.4,
            targetEfficiencyMultiplier: 1.1,
          },
          supportedActivityTags: ['guard', 'patrol'],
          modifiers: {
            fatigueMult: 0.9,
            riskMult: 1.2,
          },
          phaseLocked: 'day',
          priorityWeight: 8.0,
        },
        {
          id: 'resource-gatherer',
          label: 'Resource Gatherer',
          description: 'Collects resources from the surrounding area',
          iconName: 'axe',
          tags: ['gathering', 'day'],
          maxResidents: 3,
          prerequisites: {
            minLevel: 1,
            requiredActivityTags: ['gathering'],
            maxFatigue: 0.7,
          },
          kpiTargets: {
            minStatMatchScore: 0.4,
            maxFatigueAverage: 0.6,
            minSpecializationScore: 0.3,
            targetEfficiencyMultiplier: 1.0,
          },
          supportedActivityTags: ['gathering', 'hunting', 'fishing'],
          modifiers: {
            fatigueMult: 1.1,
            yieldMult: 1.0,
          },
          phaseLocked: 'day',
          priorityWeight: 6.0,
        },
        {
          id: 'night-watch',
          label: 'Night Watch',
          description: 'Watches over the village during night hours',
          iconName: 'moon',
          tags: ['defense', 'night'],
          maxResidents: 1,
          prerequisites: {
            minLevel: 3,
            requiredActivityTags: ['guard', 'night'],
            maxFatigue: 0.4,
          },
          kpiTargets: {
            minStatMatchScore: 0.7,
            maxFatigueAverage: 0.3,
            minSpecializationScore: 0.5,
            targetEfficiencyMultiplier: 1.2,
          },
          supportedActivityTags: ['watch', 'patrol'],
          modifiers: {
            fatigueMult: 1.3,
            riskMult: 1.1,
          },
          phaseLocked: 'night',
          priorityWeight: 9.0,
        },
      ],
      globalKpiTargets: DEFAULT_CREW_ROTATION_KPI_TARGETS,
      tags: ['basic', 'village'],
      enabled: true,
    },
    {
      id: 'specialized-quest-rotation',
      name: 'Specialized Quest Rotation',
      description: 'Rotation optimized for quest-based activities',
      version: '1.0.0',
      slots: [
        {
          id: 'quest-leader',
          label: 'Quest Leader',
          description: 'Leads parties on dangerous quests',
          iconName: 'crown',
          tags: ['quest', 'leadership'],
          maxResidents: 1,
          prerequisites: {
            minLevel: 5,
            requiredActivityTags: ['quest', 'leadership'],
            maxFatigue: 0.3,
            statRequirement: {
              allOf: ['leadership', 'combat'],
            },
          },
          kpiTargets: {
            minStatMatchScore: 0.8,
            maxFatigueAverage: 0.2,
            minSpecializationScore: 0.7,
            targetEfficiencyMultiplier: 1.3,
          },
          supportedActivityTags: ['quest', 'expedition'],
          modifiers: {
            fatigueMult: 0.8,
            riskMult: 1.4,
            yieldMult: 1.2,
          },
          priorityWeight: 10.0,
        },
        {
          id: 'quest-support',
          label: 'Quest Support',
          description: 'Supports the quest leader with specialized skills',
          iconName: 'hearts',
          tags: ['quest', 'support'],
          maxResidents: 2,
          prerequisites: {
            minLevel: 3,
            requiredActivityTags: ['quest', 'support'],
            maxFatigue: 0.5,
            statRequirement: {
              anyOf: ['healing', 'stealth', 'magic'],
            },
          },
          kpiTargets: {
            minStatMatchScore: 0.6,
            maxFatigueAverage: 0.4,
            minSpecializationScore: 0.5,
            targetEfficiencyMultiplier: 1.1,
          },
          supportedActivityTags: ['quest', 'support'],
          modifiers: {
            fatigueMult: 0.9,
            riskMult: 1.2,
          },
          priorityWeight: 7.0,
        },
      ],
      globalKpiTargets: {
        minStatMatchScore: 0.7,
        maxFatigueAverage: 0.3,
        minSpecializationScore: 0.6,
        targetEfficiencyMultiplier: 1.2,
      },
      tags: ['quest', 'specialized'],
      enabled: true,
    },
  ],
  defaults: {
    kpiTargets: DEFAULT_CREW_ROTATION_KPI_TARGETS,
    prerequisites: DEFAULT_CREW_ROTATION_PREREQUISITES,
  },
};

/**
 * Validates a crew rotation configuration.
 * 
 * @param config - Configuration to validate
 * @returns True if configuration is valid
 */
export function validateCrewRotationConfig(config: CrewRotationConfig): boolean {
  const result = CrewRotationConfigSchema.safeParse(config);
  return result.success;
}

/**
 * Gets a crew rotation by ID from the configuration.
 * 
 * @param config - Crew rotation configuration
 * @param rotationId - Rotation ID to find
 * @returns Rotation or null if not found
 */
export function getCrewRotationById(
  config: CrewRotationConfig,
  rotationId: string
): CrewRotation | null {
  return config.rotations.find(r => r.id === rotationId) || null;
}

/**
 * Gets all enabled crew rotations from the configuration.
 * 
 * @param config - Crew rotation configuration
 * @returns Array of enabled rotations
 */
export function getEnabledCrewRotations(config: CrewRotationConfig): CrewRotation[] {
  return config.rotations.filter(r => r.enabled);
}

/**
 * Filters crew rotations by tags.
 * 
 * @param rotations - Rotations to filter
 * @param tags - Tags to match (all must be present)
 * @returns Filtered rotations
 */
export function filterRotationsByTags(rotations: CrewRotation[], tags: string[]): CrewRotation[] {
  return rotations.filter(rotation => 
    tags.every(tag => rotation.tags.includes(tag))
  );
}

/**
 * Gets slots from a rotation that support specific activity tags.
 * 
 * @param rotation - Crew rotation
 * @param activityTags - Activity tags to match
 * @returns Matching slots
 */
export function getSlotsByActivityTags(
  rotation: CrewRotation,
  activityTags: string[]
): CrewRotationSlot[] {
  return rotation.slots.filter(slot =>
    activityTags.some(tag => slot.supportedActivityTags.includes(tag))
  );
}

/**
 * Constants for persistence and telemetry
 */
export const CREW_ROTATION_VERSION = 'phase-e-1.0.0';
export const CREW_ROTATION_VIEWER_PREFERENCES_KEY = 'idle-village-crew-rotation-preferences';
