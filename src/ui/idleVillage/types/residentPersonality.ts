/**
 * NP-034 – Idle Village Resident Personality Config
 * 
 * Personality trait system for residents with compatibility checking
 * and badge UI support.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { z } from 'zod';

// Personality trait categories
export type PersonalityCategory = 
  | 'social'
  | 'work_ethic'
  | 'creativity'
  | 'adaptability'
  | 'leadership'
  | 'communication'
  | 'problem_solving'
  | 'emotional_intelligence';

// Personality trait levels
export type TraitLevel = 
  | 'very_low'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high';

// Personality trait types
export type PersonalityTrait = {
  id: string;
  name: string;
  category: PersonalityCategory;
  level: TraitLevel;
  value: number; // -2 to 2 scale
  description: string;
  icon?: string;
  color?: string;
  weight: number; // 0 to 1, importance in compatibility
  visible: boolean;
  tags: string[];
};

// Personality profile
export type PersonalityProfile = {
  id: string;
  name: string;
  description: string;
  traits: PersonalityTrait[];
  archetype: PersonalityArchetype;
  compatibility: PersonalityCompatibility;
  metadata: PersonalityMetadata;
  createdAt: number;
  updatedAt: number;
};

// Personality archetypes
export type PersonalityArchetype = 
  | 'leader'
  | 'team_player'
  | 'innovator'
  | 'specialist'
  | 'generalist'
  | 'mentor'
  | 'rebel'
  | 'mediator'
  | 'perfectionist'
  | 'strategist';

// Compatibility score
export type CompatibilityScore = {
  overall: number; // 0 to 1
  categories: Record<PersonalityCategory, number>;
  traits: Record<string, number>;
  conflicts: string[];
  synergies: string[];
  recommendations: string[];
  confidence: number; // 0 to 1
};

// Personality compatibility
export type PersonalityCompatibility = {
  preferredArchetypes: PersonalityArchetype[];
  avoidedArchetypes: PersonalityArchetype[];
  traitThresholds: Record<string, { min: number; max: number }>;
  categoryWeights: Record<PersonalityCategory, number>;
  compatibilityMatrix: Record<PersonalityArchetype, number>;
  teamDynamics: {
    leadership: number; // 0 to 1
    collaboration: number; // 0 to 1
    innovation: number; // 0 to 1
    stability: number; // 0 to 1
  };
};

// Personality metadata
export type PersonalityMetadata = {
  version: string;
  source: 'manual' | 'generated' | 'imported';
  confidence: number; // 0 to 1
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number; // 0 to 1
  };
  analytics: {
    usageCount: number;
    successRate: number; // 0 to 1
    averageCompatibility: number; // 0 to 1
    lastUsed: number;
  };
  tags: string[];
  category: string;
};

// Personality badge configuration
export type PersonalityBadgeConfig = {
  id: string;
  name: string;
  description: string;
  type: 'trait' | 'archetype' | 'compatibility' | 'custom';
  display: {
    size: 'small' | 'medium' | 'large';
    shape: 'circle' | 'square' | 'rounded' | 'pill';
    style: 'minimal' | 'detailed' | 'iconic' | 'gradient';
    showValue: boolean;
    showLabel: boolean;
    showIcon: boolean;
    showProgress: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  animation: {
    enabled: boolean;
    type: 'fade' | 'slide' | 'bounce' | 'pulse' | 'none';
    duration: number; // milliseconds
    delay: number; // milliseconds
  };
  interaction: {
    clickable: boolean;
    hoverable: boolean;
    tooltip: boolean;
    expandable: boolean;
    filterable: boolean;
  };
  conditions: {
    showWhen: string[]; // conditions for showing badge
    hideWhen: string[]; // conditions for hiding badge
    highlightWhen: string[]; // conditions for highlighting
  };
  metadata: {
    version: string;
    tags: string[];
    category: string;
  };
};

// Personality configuration
export type PersonalityConfig = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  traits: PersonalityTrait[];
  archetypes: PersonalityArchetype[];
  compatibility: PersonalityCompatibility;
  badges: PersonalityBadgeConfig[];
  validation: PersonalityValidationConfig;
  analytics: PersonalityAnalyticsConfig;
  export: PersonalityExportConfig;
  metadata: PersonalityConfigMetadata;
};

// Personality validation config
export type PersonalityValidationConfig = {
  enabled: boolean;
  rules: PersonalityValidationRule[];
  thresholds: {
    minTraitValue: number;
    maxTraitValue: number;
    minCompatibilityScore: number;
    maxConflicts: number;
    requiredTraits: string[];
    forbiddenCombinations: string[][];
  };
  scoring: {
    weights: Record<PersonalityCategory, number>;
    penalties: Record<string, number>;
    bonuses: Record<string, number>;
  };
  notifications: {
    onValidationError: boolean;
    onLowCompatibility: boolean;
    onTraitConflict: boolean;
    onArchetypeMismatch: boolean;
  };
};

// Personality validation rule
export type PersonalityValidationRule = {
  id: string;
  name: string;
  description: string;
  type: 'trait_range' | 'trait_combination' | 'archetype_compatibility' | 'category_balance';
  condition: string; // expression language
  severity: 'error' | 'warning' | 'info';
  message: string;
  enabled: boolean;
  metadata: {
    version: string;
    tags: string[];
  };
};

// Personality analytics config
export type PersonalityAnalyticsConfig = {
  enabled: boolean;
  tracking: {
    personalityChanges: boolean;
    compatibilityChecks: boolean;
    badgeInteractions: boolean;
    teamAssignments: boolean;
  };
  metrics: {
    traitDistribution: boolean;
    archetypeUsage: boolean;
    compatibilityScores: boolean;
    teamPerformance: boolean;
    successRates: boolean;
  };
  reporting: {
    frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
    formats: ('dashboard' | 'csv' | 'json' | 'pdf')[];
    recipients: string[];
    autoExport: boolean;
  };
  dashboard: {
    enabled: boolean;
    widgets: PersonalityDashboardWidget[];
    refreshInterval: number; // milliseconds
    filters: string[];
  };
};

// Personality dashboard widget
export type PersonalityDashboardWidget = {
  id: string;
  type: 'trait_distribution' | 'archetype_usage' | 'compatibility_matrix' | 'team_performance' | 'custom';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, any>;
  dataSource: string;
  refreshInterval: number;
  enabled: boolean;
};

// Personality export config
export type PersonalityExportConfig = {
  enabled: boolean;
  formats: ('json' | 'csv' | 'xml' | 'pdf')[];
  destinations: string[];
  schedule: string; // cron expression
  filters: {
    archetypes?: PersonalityArchetype[];
    traits?: string[];
    dateRange?: { start: number; end: number };
    minCompatibility?: number;
  };
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'zip' | 'brotli';
    level: number; // 1 to 9
  };
  encryption: {
    enabled: boolean;
    algorithm: 'aes256' | 'rsa';
    key: string;
  };
};

// Personality config metadata
export type PersonalityConfigMetadata = {
  version: string;
  createdAt: number;
  updatedAt: number;
  author: string;
  description: string;
  tags: string[];
  category: string;
  dependencies: string[];
  compatibility: {
    minVersion: string;
    maxVersion: string;
  };
};

// Personality analysis result
export type PersonalityAnalysisResult = {
  id: string;
  timestamp: number;
  profiles: PersonalityProfile[];
  compatibility: Record<string, CompatibilityScore>;
  insights: PersonalityInsight[];
  recommendations: PersonalityRecommendation[];
  analytics: PersonalityAnalytics;
  metadata: {
    version: string;
    algorithm: string;
    processingTime: number;
    confidence: number;
  };
};

// Personality insight
export type PersonalityInsight = {
  id: string;
  type: 'trait_pattern' | 'archetype_cluster' | 'compatibility_gap' | 'team_dynamics' | 'custom';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0 to 1
  data: Record<string, any>;
  recommendations: string[];
  metadata: {
    timestamp: number;
    source: string;
    tags: string[];
  };
};

// Personality recommendation
export type PersonalityRecommendation = {
  id: string;
  type: 'trait_adjustment' | 'archetype_change' | 'team_composition' | 'compatibility_improvement' | 'custom';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // 0 to 1
  feasibility: number; // 0 to 1
  actions: PersonalityRecommendationAction[];
  metadata: {
    timestamp: number;
    source: string;
    tags: string[];
  };
};

// Personality recommendation action
export type PersonalityRecommendationAction = {
  type: 'modify_trait' | 'add_trait' | 'remove_trait' | 'change_archetype' | 'reassign_team' | 'custom';
  target: string; // profile ID or team ID
  parameters: Record<string, any>;
  expectedOutcome: string;
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
};

// Personality analytics
export type PersonalityAnalytics = {
  overview: {
    totalProfiles: number;
    averageCompatibility: number;
    traitDistribution: Record<string, number>;
    archetypeDistribution: Record<PersonalityArchetype, number>;
  };
  trends: {
    compatibilityTrends: Array<{ timestamp: number; score: number }>;
    traitTrends: Record<string, Array<{ timestamp: number; value: number }>>;
    archetypeTrends: Record<PersonalityArchetype, Array<{ timestamp: number; count: number }>>;
  };
  performance: {
    teamSuccessRates: Record<string, number>;
    individualPerformance: Record<string, number>;
    compatibilityVsPerformance: Array<{ compatibility: number; performance: number }>;
  };
  insights: {
    topPerformingTraits: Array<{ trait: string; impact: number }>;
    problematicCombinations: Array<{ traits: string[]; issue: string; frequency: number }>;
    optimalTeamCompositions: Array<{ archetypes: PersonalityArchetype[]; successRate: number }>;
  };
};

// Zod schemas
export const PersonalityCategorySchema = z.enum([
  'social',
  'work_ethic',
  'creativity',
  'adaptability',
  'leadership',
  'communication',
  'problem_solving',
  'emotional_intelligence',
]);

export const TraitLevelSchema = z.enum([
  'very_low',
  'low',
  'moderate',
  'high',
  'very_high',
]);

export const PersonalityArchetypeSchema = z.enum([
  'leader',
  'team_player',
  'innovator',
  'specialist',
  'generalist',
  'mentor',
  'rebel',
  'mediator',
  'perfectionist',
  'strategist',
]);

export const PersonalityTraitSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: PersonalityCategorySchema,
  level: TraitLevelSchema,
  value: z.number().min(-2).max(2),
  description: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  weight: z.number().min(0).max(1),
  visible: z.boolean(),
  tags: z.array(z.string()),
});

export const PersonalityCompatibilitySchema = z.object({
  preferredArchetypes: z.array(PersonalityArchetypeSchema),
  avoidedArchetypes: z.array(PersonalityArchetypeSchema),
  traitThresholds: z.record(z.object({ min: z.number(), max: z.number() })),
  categoryWeights: z.record(z.number().min(0).max(1)),
  compatibilityMatrix: z.record(z.number().min(0).max(1)),
  teamDynamics: z.object({
    leadership: z.number().min(0).max(1),
    collaboration: z.number().min(0).max(1),
    innovation: z.number().min(0).max(1),
    stability: z.number().min(0).max(1),
  }),
});

export const PersonalityMetadataSchema = z.object({
  version: z.string(),
  source: z.enum(['manual', 'generated', 'imported']),
  confidence: z.number().min(0).max(1),
  validation: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    score: z.number().min(0).max(1),
  }),
  analytics: z.object({
    usageCount: z.number().min(0),
    successRate: z.number().min(0).max(1),
    averageCompatibility: z.number().min(0).max(1),
    lastUsed: z.number(),
  }),
  tags: z.array(z.string()),
  category: z.string(),
});

export const PersonalityProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  traits: z.array(PersonalityTraitSchema),
  archetype: PersonalityArchetypeSchema,
  compatibility: PersonalityCompatibilitySchema,
  metadata: PersonalityMetadataSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const CompatibilityScoreSchema = z.object({
  overall: z.number().min(0).max(1),
  categories: z.record(z.number().min(0).max(1)),
  traits: z.record(z.number().min(0).max(1)),
  conflicts: z.array(z.string()),
  synergies: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const PersonalityBadgeConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['trait', 'archetype', 'compatibility', 'custom']),
  display: z.object({
    size: z.enum(['small', 'medium', 'large']),
    shape: z.enum(['circle', 'square', 'rounded', 'pill']),
    style: z.enum(['minimal', 'detailed', 'iconic', 'gradient']),
    showValue: z.boolean(),
    showLabel: z.boolean(),
    showIcon: z.boolean(),
    showProgress: z.boolean(),
  }),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    text: z.string(),
    background: z.string(),
  }),
  animation: z.object({
    enabled: z.boolean(),
    type: z.enum(['fade', 'slide', 'bounce', 'pulse', 'none']),
    duration: z.number().min(0),
    delay: z.number().min(0),
  }),
  interaction: z.object({
    clickable: z.boolean(),
    hoverable: z.boolean(),
    tooltip: z.boolean(),
    expandable: z.boolean(),
    filterable: z.boolean(),
  }),
  conditions: z.object({
    showWhen: z.array(z.string()),
    hideWhen: z.array(z.string()),
    highlightWhen: z.array(z.string()),
  }),
  metadata: z.object({
    version: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
  }),
});

export const PersonalityConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  traits: z.array(PersonalityTraitSchema),
  archetypes: z.array(PersonalityArchetypeSchema),
  compatibility: PersonalityCompatibilitySchema,
  badges: z.array(PersonalityBadgeConfigSchema),
  validation: z.any(), // Will be defined separately
  analytics: z.any(), // Will be defined separately
  export: z.any(), // Will be defined separately
  metadata: z.any(), // Will be defined separately
});

// Default configurations
export const DEFAULT_PERSONALITY_TRAITS: PersonalityTrait[] = [
  // Social traits
  {
    id: 'social_cooperation',
    name: 'Cooperation',
    category: 'social',
    level: 'moderate',
    value: 0,
    description: 'Ability to work well with others and contribute to group goals',
    icon: 'users',
    color: '#3b82f6',
    weight: 0.8,
    visible: true,
    tags: ['teamwork', 'collaboration'],
  },
  {
    id: 'social_empathy',
    name: 'Empathy',
    category: 'social',
    level: 'moderate',
    value: 0,
    description: 'Understanding and sharing the feelings of others',
    icon: 'heart',
    color: '#ef4444',
    weight: 0.7,
    visible: true,
    tags: ['emotional', 'understanding'],
  },
  {
    id: 'social_communication',
    name: 'Communication',
    category: 'communication',
    level: 'moderate',
    value: 0,
    description: 'Ability to express ideas clearly and listen effectively',
    icon: 'message',
    color: '#10b981',
    weight: 0.9,
    visible: true,
    tags: ['expression', 'listening'],
  },
  // Work ethic traits
  {
    id: 'work_diligence',
    name: 'Diligence',
    category: 'work_ethic',
    level: 'moderate',
    value: 0,
    description: 'Careful and persistent work ethic',
    icon: 'briefcase',
    color: '#f59e0b',
    weight: 0.8,
    visible: true,
    tags: ['effort', 'persistence'],
  },
  {
    id: 'work_reliability',
    name: 'Reliability',
    category: 'work_ethic',
    level: 'moderate',
    value: 0,
    description: 'Consistency and dependability in completing tasks',
    icon: 'shield',
    color: '#8b5cf6',
    weight: 0.9,
    visible: true,
    tags: ['consistency', 'trust'],
  },
  // Creativity traits
  {
    id: 'creativity_innovation',
    name: 'Innovation',
    category: 'creativity',
    level: 'moderate',
    value: 0,
    description: 'Ability to generate new ideas and approaches',
    icon: 'lightbulb',
    color: '#fbbf24',
    weight: 0.7,
    visible: true,
    tags: ['ideas', 'creativity'],
  },
  {
    id: 'creativity_problem_solving',
    name: 'Problem Solving',
    category: 'problem_solving',
    level: 'moderate',
    value: 0,
    description: 'Ability to analyze and solve complex problems',
    icon: 'puzzle',
    color: '#06b6d4',
    weight: 0.8,
    visible: true,
    tags: ['analysis', 'solutions'],
  },
  // Adaptability traits
  {
    id: 'adaptability_flexibility',
    name: 'Flexibility',
    category: 'adaptability',
    level: 'moderate',
    value: 0,
    description: 'Ability to adapt to changing circumstances',
    icon: 'refresh',
    color: '#84cc16',
    weight: 0.7,
    visible: true,
    tags: ['adaptation', 'change'],
  },
  {
    id: 'adaptability_resilience',
    name: 'Resilience',
    category: 'adaptability',
    level: 'moderate',
    value: 0,
    description: 'Ability to recover from setbacks and challenges',
    icon: 'battery',
    color: '#f97316',
    weight: 0.8,
    visible: true,
    tags: ['recovery', 'strength'],
  },
  // Leadership traits
  {
    id: 'leadership_authority',
    name: 'Leadership',
    category: 'leadership',
    level: 'moderate',
    value: 0,
    description: 'Ability to guide and motivate others',
    icon: 'crown',
    color: '#dc2626',
    weight: 0.9,
    visible: true,
    tags: ['guidance', 'motivation'],
  },
  {
    id: 'leadership_decision_making',
    name: 'Decision Making',
    category: 'leadership',
    level: 'moderate',
    value: 0,
    description: 'Ability to make sound decisions under pressure',
    icon: 'gavel',
    color: '#7c3aed',
    weight: 0.8,
    visible: true,
    tags: ['judgment', 'choices'],
  },
  // Emotional intelligence traits
  {
    id: 'emotional_self_awareness',
    name: 'Self-Awareness',
    category: 'emotional_intelligence',
    level: 'moderate',
    value: 0,
    description: 'Understanding of one\'s own emotions and behaviors',
    icon: 'eye',
    color: '#0891b2',
    weight: 0.7,
    visible: true,
    tags: ['introspection', 'awareness'],
  },
  {
    id: 'emotional_self_regulation',
    name: 'Self-Regulation',
    category: 'emotional_intelligence',
    level: 'moderate',
    value: 0,
    description: 'Ability to manage and control one\'s emotions',
    icon: 'balance',
    color: '#059669',
    weight: 0.8,
    visible: true,
    tags: ['control', 'emotional'],
  },
];

export const DEFAULT_PERSONALITY_COMPATIBILITY: PersonalityCompatibility = {
  preferredArchetypes: ['team_player', 'generalist'],
  avoidedArchetypes: ['rebel'],
  traitThresholds: {
    social_cooperation: { min: -1, max: 2 },
    work_diligence: { min: -1, max: 2 },
    creativity_innovation: { min: -2, max: 2 },
    leadership_authority: { min: -2, max: 2 },
  },
  categoryWeights: {
    social: 0.2,
    work_ethic: 0.2,
    creativity: 0.15,
    adaptability: 0.15,
    leadership: 0.15,
    communication: 0.1,
    problem_solving: 0.15,
    emotional_intelligence: 0.1,
  },
  compatibilityMatrix: {
    leader: 0.8,
    team_player: 0.9,
    innovator: 0.7,
    specialist: 0.6,
    generalist: 0.8,
    mentor: 0.8,
    rebel: 0.4,
    mediator: 0.7,
    perfectionist: 0.6,
    strategist: 0.7,
  },
  teamDynamics: {
    leadership: 0.7,
    collaboration: 0.8,
    innovation: 0.6,
    stability: 0.7,
  },
};

export const DEFAULT_PERSONALITY_BADGE_CONFIG: PersonalityBadgeConfig = {
  id: 'default-badge',
  name: 'Personality Badge',
  description: 'Default personality trait badge',
  type: 'trait',
  display: {
    size: 'medium',
    shape: 'rounded',
    style: 'minimal',
    showValue: true,
    showLabel: true,
    showIcon: true,
    showProgress: false,
  },
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#f59e0b',
    text: '#1e293b',
    background: '#ffffff',
  },
  animation: {
    enabled: true,
    type: 'fade',
    duration: 200,
    delay: 0,
  },
  interaction: {
    clickable: true,
    hoverable: true,
    tooltip: true,
    expandable: false,
    filterable: true,
  },
  conditions: {
    showWhen: ['trait_visible'],
    hideWhen: [],
    highlightWhen: ['trait_high_value'],
  },
  metadata: {
    version: '1.0.0',
    tags: ['default', 'personality', 'badge'],
    category: 'personality',
  },
};

// Utility functions
export function validatePersonalityTrait(trait: PersonalityTrait): boolean {
  try {
    PersonalityTraitSchema.parse(trait);
    return true;
  } catch {
    return false;
  }
}

export function validatePersonalityProfile(profile: PersonalityProfile): boolean {
  try {
    PersonalityProfileSchema.parse(profile);
    return true;
  } catch {
    return false;
  }
}

export function validateCompatibilityScore(score: CompatibilityScore): boolean {
  try {
    CompatibilityScoreSchema.parse(score);
    return true;
  } catch {
    return false;
  }
}

export function createPersonalityTrait(overrides: Partial<PersonalityTrait> = {}): PersonalityTrait {
  return {
    id: `trait-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'New Trait',
    category: 'social',
    level: 'moderate',
    value: 0,
    description: 'A new personality trait',
    weight: 0.5,
    visible: true,
    tags: [],
    ...overrides,
  };
}

export function createPersonalityProfile(overrides: Partial<PersonalityProfile> = {}): PersonalityProfile {
  const now = Date.now();
  return {
    id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'New Profile',
    description: 'A new personality profile',
    traits: [],
    archetype: 'generalist',
    compatibility: DEFAULT_PERSONALITY_COMPATIBILITY,
    metadata: {
      version: '1.0.0',
      source: 'manual',
      confidence: 0.5,
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        score: 0.8,
      },
      analytics: {
        usageCount: 0,
        successRate: 0,
        averageCompatibility: 0,
        lastUsed: 0,
      },
      tags: [],
      category: 'personality',
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createCompatibilityScore(overrides: Partial<CompatibilityScore> = {}): CompatibilityScore {
  return {
    overall: 0.5,
    categories: {
      social: 0.5,
      work_ethic: 0.5,
      creativity: 0.5,
      adaptability: 0.5,
      leadership: 0.5,
      communication: 0.5,
      problem_solving: 0.5,
      emotional_intelligence: 0.5,
    },
    traits: {},
    conflicts: [],
    synergies: [],
    recommendations: [],
    confidence: 0.5,
    ...overrides,
  };
}

export function getTraitLevelFromValue(value: number): TraitLevel {
  if (value <= -1.5) return 'very_low';
  if (value <= -0.5) return 'low';
  if (value <= 0.5) return 'moderate';
  if (value <= 1.5) return 'high';
  return 'very_high';
}

export function getTraitValueFromLevel(level: TraitLevel): number {
  switch (level) {
    case 'very_low': return -2;
    case 'low': return -1;
    case 'moderate': return 0;
    case 'high': return 1;
    case 'very_high': return 2;
  }
}

export function getTraitColor(level: TraitLevel): string {
  switch (level) {
    case 'very_low': return '#dc2626';
    case 'low': return '#f97316';
    case 'moderate': return '#fbbf24';
    case 'high': return '#84cc16';
    case 'very_high': return '#10b981';
  }
}

export function getArchetypeDescription(archetype: PersonalityArchetype): string {
  switch (archetype) {
    case 'leader': return 'Natural leader who guides and motivates others';
    case 'team_player': return 'Collaborative team member who works well with others';
    case 'innovator': return 'Creative thinker who generates new ideas and solutions';
    case 'specialist': return 'Expert in specific areas with deep knowledge';
    case 'generalist': return 'Versatile individual with broad skills and knowledge';
    case 'mentor': return 'Experienced guide who helps others develop';
    case 'rebel': return 'Challenger of conventions who brings fresh perspectives';
    case 'mediator': return 'Peacemaker who resolves conflicts and builds consensus';
    case 'perfectionist': return 'Detail-oriented individual who strives for excellence';
    case 'strategist': return 'Planner who thinks ahead and optimizes outcomes';
  }
}

export function getCategoryDescription(category: PersonalityCategory): string {
  switch (category) {
    case 'social': return 'How individuals interact and relate to others';
    case 'work_ethic': return 'Approach to work, tasks, and responsibilities';
    case 'creativity': return 'Ability to generate ideas and think creatively';
    case 'adaptability': return 'Capacity to adjust to new situations and challenges';
    case 'leadership': return 'Ability to guide, influence, and motivate others';
    case 'communication': return 'How individuals express themselves and understand others';
    case 'problem_solving': return 'Approach to analyzing and resolving problems';
    case 'emotional_intelligence': return 'Understanding and management of emotions';
  }
}
