/**
 * Injury System Configuration
 * 
 * Config-first injury tracking system with injury types, recovery patterns,
 * treatments, and medical items for RPG Balancer.
 * 
 * @author RPG Balancer Team
 * @since 2026-01-24
 */

import { z } from 'zod';

/**
 * Injury severity levels
 */
export const InjurySeveritySchema = z.enum(['minor', 'moderate', 'severe', 'critical', 'fatal']);

export type InjurySeverity = z.infer<typeof InjurySeveritySchema>;

/**
 * Injury body part locations
 */
export const BodyPartSchema = z.enum([
  'head', 'torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg', 'internal'
]);

export type BodyPart = z.infer<typeof BodyPartSchema>;

/**
 * Injury type configuration
 */
export const InjuryTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  severity: InjurySeveritySchema,
  bodyPart: BodyPartSchema,
  effects: z.object({
    statPenalties: z.record(z.string(), z.number()),
    abilityImpairments: z.array(z.string()),
    movementRestriction: z.boolean().optional(),
    consciousnessRisk: z.boolean().optional(),
    bleedingRisk: z.boolean().optional(),
    infectionRisk: z.boolean().optional(),
  }),
  recovery: z.object({
    baseDuration: z.number(), // in hours
    variance: z.number(), // +/- variance in hours
    naturalHealingRate: z.number(), // % per hour
    treatmentBonus: z.number(), // % reduction in duration
    complications: z.array(z.string()).optional(),
  }),
  visuals: z.object({
    icon: z.string(),
    color: z.string(),
    description: z.string(),
  }),
});

export type InjuryType = z.infer<typeof InjuryTypeSchema>;

/**
 * Treatment configuration
 */
export const TreatmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['item', 'ability', 'rest', 'medical']),
  targetInjuries: z.array(z.string()), // injury type IDs
  effects: z.object({
    healingBonus: z.number(), // % reduction in recovery time
    painReduction: z.number(), // % pain reduction
    infectionPrevention: z.boolean().optional(),
    bleedingStop: z.boolean().optional(),
    statRestoration: z.record(z.string(), z.number()).optional(),
  }),
  requirements: z.object({
    items: z.array(z.object({
      id: z.string(),
      quantity: z.number(),
    })).optional(),
    skills: z.array(z.string()).optional(),
    cooldown: z.number().optional(), // in hours
    cost: z.number().optional(),
  }),
  application: z.object({
    duration: z.number(), // in minutes
    successRate: z.number(), // % success chance
    sideEffects: z.array(z.string()).optional(),
  }),
});

export type Treatment = z.infer<typeof TreatmentSchema>;

/**
 * Medical item configuration
 */
export const MedicalItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['consumable', 'equipment', 'permanent']),
  effects: z.object({
    healingAmount: z.number(),
    painRelief: z.number(),
    infectionPrevention: z.boolean().optional(),
    bleedingStop: z.boolean().optional(),
    stabilizationBonus: z.number().optional(),
    statBoosts: z.record(z.string(), z.number()).optional(),
  }),
  usage: z.object({
    consumable: z.boolean(),
    applicationTime: z.number(), // in minutes
    cooldown: z.number(), // in hours
    stackable: z.boolean(),
    maxStack: z.number().optional(),
  }),
  availability: z.object({
    cost: z.number(),
    rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']),
    locations: z.array(z.string()),
  }),
});

export type MedicalItem = z.infer<typeof MedicalItemSchema>;

/**
 * Injury system configuration schema
 */
export const InjurySystemConfigSchema = z.object({
  injuries: z.array(InjuryTypeSchema),
  treatments: z.array(TreatmentSchema),
  medicalItems: z.array(MedicalItemSchema),
  settings: z.object({
    maxConcurrentInjuries: z.number(),
    injuryDecayRate: z.number(), // % chance of injury worsening per hour
    naturalHealingEnabled: z.boolean(),
    treatmentSuccessVariation: z.number(), // +/- variation in success rates
    criticalInjuryThreshold: z.number(), // HP percentage for critical injuries
    fatalInjuryThreshold: z.number(), // HP percentage for fatal injuries
  }),
  telemetry: z.object({
    enabled: z.boolean(),
    events: z.array(z.string()),
  }),
});

export type InjurySystemConfig = z.infer<typeof InjurySystemConfigSchema>;

/**
 * Default injury system configuration
 */
export const DEFAULT_INJURY_SYSTEM_CONFIG: InjurySystemConfig = {
  injuries: [
    {
      id: 'minor_cut',
      name: 'Minor Cut',
      description: 'A small superficial wound that heals quickly',
      severity: 'minor',
      bodyPart: 'torso',
      effects: {
        statPenalties: {
          strength: -5,
          agility: -3,
        },
        abilityImpairments: [],
        bleedingRisk: true,
      },
      recovery: {
        baseDuration: 6, // 6 hours
        variance: 2,
        naturalHealingRate: 15, // 15% per hour
        treatmentBonus: 25, // 25% reduction with treatment
      },
      visuals: {
        icon: '🩹',
        color: '#ff6b6b',
        description: 'Small cut requiring basic bandaging',
      },
    },
    {
      id: 'deep_wound',
      name: 'Deep Wound',
      description: 'A serious laceration that may require stitches',
      severity: 'moderate',
      bodyPart: 'torso',
      effects: {
        statPenalties: {
          strength: -15,
          agility: -10,
          vitality: -8,
        },
        abilityImpairments: ['heavy_lifting', 'running'],
        bleedingRisk: true,
        infectionRisk: true,
      },
      recovery: {
        baseDuration: 24, // 24 hours
        variance: 6,
        naturalHealingRate: 8, // 8% per hour
        treatmentBonus: 40, // 40% reduction with treatment
        complications: ['infection', 'scarring'],
      },
      visuals: {
        icon: '🩸',
        color: '#ff4757',
        description: 'Deep wound requiring medical attention',
      },
    },
    {
      id: 'broken_bone',
      name: 'Broken Bone',
      description: 'A fracture that immobilizes the affected limb',
      severity: 'severe',
      bodyPart: 'left_arm',
      effects: {
        statPenalties: {
          strength: -25,
          agility: -20,
          dexterity: -30,
        },
        abilityImpairments: ['weapon_use', 'climbing', 'swimming'],
        movementRestriction: true,
      },
      recovery: {
        baseDuration: 168, // 7 days
        variance: 24,
        naturalHealingRate: 2, // 2% per hour
        treatmentBonus: 50, // 50% reduction with treatment
        complications: ['malunion', 'nerve_damage'],
      },
      visuals: {
        icon: '🦴',
        color: '#ff6348',
        description: 'Broken bone requiring immobilization',
      },
    },
    {
      id: 'head_trauma',
      name: 'Head Trauma',
      description: 'A serious head injury affecting consciousness and cognition',
      severity: 'critical',
      bodyPart: 'head',
      effects: {
        statPenalties: {
          intelligence: -20,
          wisdom: -15,
          perception: -25,
        },
        abilityImpairments: ['spellcasting', 'concentration', 'complex_tasks'],
        consciousnessRisk: true,
      },
      recovery: {
        baseDuration: 72, // 3 days
        variance: 12,
        naturalHealingRate: 3, // 3% per hour
        treatmentBonus: 35, // 35% reduction with treatment
        complications: ['memory_loss', 'personality_change'],
      },
      visuals: {
        icon: '🤕',
        color: '#ff3838',
        description: 'Critical head injury requiring immediate care',
      },
    },
    {
      id: 'internal_bleeding',
      name: 'Internal Bleeding',
      description: 'Life-threatening internal hemorrhage',
      severity: 'critical',
      bodyPart: 'internal',
      effects: {
        statPenalties: {
          vitality: -30,
          strength: -20,
          agility: -15,
        },
        abilityImpairments: ['all_physical'],
        consciousnessRisk: true,
        bleedingRisk: true,
      },
      recovery: {
        baseDuration: 48, // 2 days
        variance: 8,
        naturalHealingRate: 1, // 1% per hour
        treatmentBonus: 60, // 60% reduction with treatment
        complications: ['organ_failure', 'shock'],
      },
      visuals: {
        icon: '🚨',
        color: '#c0392b',
        description: 'Critical internal injury requiring surgery',
      },
    },
  ],
  treatments: [
    {
      id: 'basic_bandage',
      name: 'Basic Bandage',
      description: 'Simple bandaging for minor wounds',
      type: 'item',
      targetInjuries: ['minor_cut'],
      effects: {
        healingBonus: 25,
        painReduction: 20,
        bleedingStop: true,
      },
      requirements: {
        items: [{ id: 'bandage', quantity: 1 }],
        skills: [],
        cooldown: 0,
        cost: 5,
      },
      application: {
        duration: 5, // 5 minutes
        successRate: 95,
        sideEffects: [],
      },
    },
    {
      id: 'sutures',
      name: 'Sutures',
      description: 'Professional stitching for deep wounds',
      type: 'medical',
      targetInjuries: ['deep_wound'],
      effects: {
        healingBonus: 40,
        painReduction: 30,
        infectionPrevention: true,
        bleedingStop: true,
      },
      requirements: {
        items: [{ id: 'suture_kit', quantity: 1 }],
        skills: ['medicine'],
        cooldown: 0,
        cost: 50,
      },
      application: {
        duration: 30, // 30 minutes
        successRate: 85,
        sideEffects: ['scarring'],
      },
    },
    {
      id: 'splint',
      name: 'Splint',
      description: 'Immobilization device for broken bones',
      type: 'item',
      targetInjuries: ['broken_bone'],
      effects: {
        healingBonus: 50,
        painReduction: 40,
      },
      requirements: {
        items: [{ id: 'splint_material', quantity: 2 }],
        skills: ['first_aid'],
        cooldown: 0,
        cost: 25,
      },
      application: {
        duration: 15, // 15 minutes
        successRate: 90,
        sideEffects: [],
      },
    },
    {
      id: 'rest',
      name: 'Rest',
      description: 'Natural healing through rest',
      type: 'rest',
      targetInjuries: ['minor_cut', 'deep_wound'],
      effects: {
        healingBonus: 15,
        painReduction: 10,
      },
      requirements: {
        items: [],
        skills: [],
        cooldown: 0,
        cost: 0,
      },
      application: {
        duration: 60, // 1 hour
        successRate: 100,
        sideEffects: [],
      },
    },
    {
      id: 'surgery',
      name: 'Emergency Surgery',
      description: 'Critical surgical intervention',
      type: 'medical',
      targetInjuries: ['internal_bleeding', 'head_trauma'],
      effects: {
        healingBonus: 60,
        painReduction: 50,
        bleedingStop: true,
        statRestoration: {
          vitality: 10,
        },
      },
      requirements: {
        items: [{ id: 'surgical_kit', quantity: 1 }],
        skills: ['surgery', 'medicine'],
        cooldown: 4, // 4 hours
        cost: 200,
      },
      application: {
        duration: 120, // 2 hours
        successRate: 70,
        sideEffects: ['exhaustion', 'recovery_time'],
      },
    },
  ],
  medicalItems: [
    {
      id: 'bandage',
      name: 'Bandage',
      description: 'Basic sterile bandage',
      category: 'consumable',
      effects: {
        healingAmount: 10,
        painRelief: 15,
        bleedingStop: true,
      },
      usage: {
        consumable: true,
        applicationTime: 2, // 2 minutes
        cooldown: 0,
        stackable: true,
        maxStack: 10,
      },
      availability: {
        cost: 5,
        rarity: 'common',
        locations: ['general_store', 'medical_shop'],
      },
    },
    {
      id: 'suture_kit',
      name: 'Suture Kit',
      description: 'Professional medical suturing kit',
      category: 'consumable',
      effects: {
        healingAmount: 25,
        painRelief: 20,
        infectionPrevention: true,
        bleedingStop: true,
      },
      usage: {
        consumable: true,
        applicationTime: 5, // 5 minutes
        cooldown: 0,
        stackable: true,
        maxStack: 5,
      },
      availability: {
        cost: 30,
        rarity: 'uncommon',
        locations: ['medical_shop'],
      },
    },
    {
      id: 'healing_potion',
      name: 'Healing Potion',
      description: 'Magical healing elixir',
      category: 'consumable',
      effects: {
        healingAmount: 50,
        painRelief: 40,
        statBoosts: {
          vitality: 10,
        },
      },
      usage: {
        consumable: true,
        applicationTime: 1, // 1 minute
        cooldown: 1, // 1 hour
        stackable: true,
        maxStack: 3,
      },
      availability: {
        cost: 100,
        rarity: 'rare',
        locations: ['alchemist', 'magic_shop'],
      },
    },
    {
      id: 'medical_kit',
      name: 'Medical Kit',
      description: 'Comprehensive medical equipment',
      category: 'equipment',
      effects: {
        healingAmount: 30,
        painRelief: 35,
        infectionPrevention: true,
      },
      usage: {
        consumable: false,
        applicationTime: 10, // 10 minutes
        cooldown: 0,
        stackable: false,
      },
      availability: {
        cost: 150,
        rarity: 'rare',
        locations: ['medical_shop', 'specialty_vendor'],
      },
    },
    {
      id: 'splint_material',
      name: 'Splint Material',
      description: 'Rigid strips for stabilizing fractures and severe limb injuries',
      category: 'consumable',
      effects: {
        healingAmount: 15,
        painRelief: 10,
        bleedingStop: false,
        stabilizationBonus: 20,
      },
      usage: {
        consumable: true,
        applicationTime: 10,
        cooldown: 0,
        stackable: true,
        maxStack: 5,
      },
      availability: {
        cost: 25,
        rarity: 'uncommon',
        locations: ['medical_shop', 'field_hospital'],
      },
    },
    {
      id: 'surgical_kit',
      name: 'Emergency Surgical Kit',
      description: 'Sterile surgical instruments required for emergency procedures',
      category: 'equipment',
      effects: {
        healingAmount: 30,
        painRelief: 5,
        infectionPrevention: true,
      },
      usage: {
        consumable: false,
        applicationTime: 30,
        cooldown: 0,
        stackable: false,
        maxStack: 1,
      },
      availability: {
        cost: 200,
        rarity: 'rare',
        locations: ['surgical_center', 'field_hospital'],
      },
    },
  ],
  settings: {
    maxConcurrentInjuries: 5,
    injuryDecayRate: 5, // 5% chance of worsening per hour
    naturalHealingEnabled: true,
    treatmentSuccessVariation: 10, // +/- 10% variation
    criticalInjuryThreshold: 25, // 25% HP for critical injuries
    fatalInjuryThreshold: 10, // 10% HP for fatal injuries
  },
  telemetry: {
    enabled: true,
    events: [
      'injury_sustained',
      'treatment_applied',
      'injury_healed',
      'injury_complicated',
      'injury_worsened',
    ],
  },
};

/**
 * Get injury type by ID
 */
export function getInjuryType(config: InjurySystemConfig, injuryId: string): InjuryType | undefined {
  return config.injuries.find(injury => injury.id === injuryId);
}

/**
 * Get treatment by ID
 */
export function getTreatment(config: InjurySystemConfig, treatmentId: string): Treatment | undefined {
  return config.treatments.find(treatment => treatment.id === treatmentId);
}

/**
 * Get medical item by ID
 */
export function getMedicalItem(config: InjurySystemConfig, itemId: string): MedicalItem | undefined {
  return config.medicalItems.find(item => item.id === itemId);
}

/**
 * Get injuries by body part
 */
export function getInjuriesByBodyPart(config: InjurySystemConfig, bodyPart: BodyPart): InjuryType[] {
  return config.injuries.filter(injury => injury.bodyPart === bodyPart);
}

/**
 * Get injuries by severity
 */
export function getInjuriesBySeverity(config: InjurySystemConfig, severity: InjurySeverity): InjuryType[] {
  return config.injuries.filter(injury => injury.severity === severity);
}

/**
 * Get treatments for injury type
 */
export function getTreatmentsForInjury(config: InjurySystemConfig, injuryId: string): Treatment[] {
  return config.treatments.filter(treatment => 
    treatment.targetInjuries.includes(injuryId)
  );
}
