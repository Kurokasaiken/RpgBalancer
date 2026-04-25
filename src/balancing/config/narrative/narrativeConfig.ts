/**
 * NP-029 – Idle Village Quest Narrative Hooks Refactor
 * 
 * Centralized narrative configuration system for quest narratives.
 * Provides configuration-driven narrative hooks, templates, and
 * telemetry integration for comprehensive narrative management.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { z } from 'zod';

// Narrative configuration schema
export const NarrativeConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  enabled: z.boolean().default(true),
  hooks: z.record(z.string(), z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['quest_start', 'quest_progress', 'quest_complete', 'quest_fail', 'resident_interaction', 'environmental_trigger']),
    priority: z.number().min(0).max(100).default(50),
    conditions: z.array(z.object({
      type: z.enum(['resident_level', 'quest_type', 'time_of_day', 'weather', 'location', 'resident_trait', 'quest_difficulty']),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'in', 'not_in', 'contains']),
      value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
    })).default([]),
    templates: z.array(z.object({
      id: z.string(),
      name: z.string(),
      text: z.string(),
      variables: z.array(z.object({
        name: z.string(),
        type: z.enum(['string', 'number', 'boolean', 'array']),
        required: z.boolean().default(true),
        defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]).optional(),
      })).default([]),
      weight: z.number().min(0).max(100).default(50),
      conditions: z.array(z.object({
        type: z.enum(['resident_level', 'quest_type', 'time_of_day', 'weather', 'location', 'resident_trait', 'quest_difficulty']),
        operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'in', 'not_in', 'contains']),
        value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
      })).default([]),
    })).default([]),
    telemetry: z.object({
      track: z.boolean().default(true),
      metrics: z.array(z.enum(['engagement', 'completion_rate', 'time_to_complete', 'choice_distribution', 'sentiment'])).default([]),
      customEvents: z.array(z.object({
        name: z.string(),
        description: z.string(),
        properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
      })).default([]),
    }).default({
      track: true,
      metrics: ['engagement'],
      customEvents: [],
    }),
  })).default({}),
  templates: z.record(z.string(), z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(['introduction', 'progress', 'completion', 'failure', 'interaction', 'environment']),
    text: z.string(),
    variables: z.array(z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'array']),
      required: z.boolean().default(true),
      defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]).optional(),
    })).default([]),
    weight: z.number().min(0).max(100).default(50),
    conditions: z.array(z.object({
      type: z.enum(['resident_level', 'quest_type', 'time_of_day', 'weather', 'location', 'resident_trait', 'quest_difficulty']),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'in', 'not_in', 'contains']),
      value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
    })).default([]),
    tags: z.array(z.string()).default([]),
  })).default({}),
  variables: z.record(z.string(), z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'array']),
    description: z.string(),
    defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]).optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      enum: z.array(z.union([z.string(), z.number()])).optional(),
    }).optional(),
  })).default({}),
  telemetry: z.object({
    enabled: z.boolean().default(true),
    tracking: z.object({
      events: z.array(z.string()).default([]),
      metrics: z.array(z.string()).default([]),
      sampling: z.object({
        rate: z.number().min(0).max(1).default(1.0),
        maxEvents: z.number().min(0).default(10000),
      }).default({}),
    }).default({}),
    aggregation: z.object({
      windows: z.array(z.object({
        name: z.string(),
        duration: z.number(), // in minutes
        metrics: z.array(z.string()),
      })).default([]),
      custom: z.array(z.object({
        name: z.string(),
        formula: z.string(),
        description: z.string(),
      })).default([]),
    }).default({}),
  }).default({}),
});

export type NarrativeConfig = z.infer<typeof NarrativeConfigSchema>;

// Default narrative configuration
export const DEFAULT_NARRATIVE_CONFIG: NarrativeConfig = {
  version: '1.0.0',
  enabled: true,
  hooks: {
    quest_start: {
      id: 'quest_start',
      name: 'Quest Start Hook',
      description: 'Triggered when a quest begins',
      type: 'quest_start',
      priority: 80,
      conditions: [],
      templates: [
        {
          id: 'quest_start_basic',
          name: 'Basic Quest Start',
          text: 'You begin the quest: {quest_name}. {resident_name} looks determined as they prepare for the journey ahead.',
          variables: [
            { name: 'quest_name', type: 'string', required: true },
            { name: 'resident_name', type: 'string', required: true },
            { name: 'quest_difficulty', type: 'string', required: false, defaultValue: 'normal' },
          ],
          weight: 50,
          conditions: [],
        },
        {
          id: 'quest_start_dangerous',
          name: 'Dangerous Quest Start',
          text: 'The air grows tense as {resident_name} accepts the dangerous quest: {quest_name}. This {quest_difficulty} challenge will test their limits.',
          variables: [
            { name: 'quest_name', type: 'string', required: true },
            { name: 'resident_name', type: 'string', required: true },
            { name: 'quest_difficulty', type: 'string', required: true },
          ],
          weight: 70,
          conditions: [
            {
              type: 'quest_difficulty',
              operator: 'in',
              value: ['hard', 'nightmare'],
            },
          ],
        },
      ],
      telemetry: {
        track: true,
        metrics: ['engagement', 'completion_rate'],
        customEvents: [
          {
            name: 'quest_narrative_generated',
            description: 'Generated narrative for quest start',
            properties: {
              quest_id: 'string',
              hook_id: 'string',
              template_id: 'string',
              resident_id: 'string',
            },
          },
        ],
      },
    },
    quest_progress: {
      id: 'quest_progress',
      name: 'Quest Progress Hook',
      description: 'Triggered when a quest makes progress',
      type: 'quest_progress',
      priority: 60,
      conditions: [],
      templates: [
        {
          id: 'quest_progress_milestone',
          name: 'Progress Milestone',
          text: '{resident_name} has made significant progress on {quest_name}. {progress_description}',
          variables: [
            { name: 'quest_name', type: 'string', required: true },
            { name: 'resident_name', type: 'string', required: true },
            { name: 'progress_description', type: 'string', required: true },
            { name: 'progress_percentage', type: 'number', required: false },
          ],
          weight: 50,
          conditions: [],
        },
      ],
      telemetry: {
        track: true,
        metrics: ['engagement', 'time_to_complete'],
        customEvents: [],
      },
    },
    quest_complete: {
      id: 'quest_complete',
      name: 'Quest Complete Hook',
      description: 'Triggered when a quest is completed successfully',
      type: 'quest_complete',
      priority: 90,
      conditions: [],
      templates: [
        {
          id: 'quest_complete_success',
          name: 'Successful Completion',
          text: 'Success! {resident_name} has completed {quest_name}. {completion_description} The rewards are well deserved.',
          variables: [
            { name: 'quest_name', type: 'string', required: true },
            { name: 'resident_name', type: 'string', required: true },
            { name: 'completion_description', type: 'string', required: true },
            { name: 'rewards', type: 'array', required: false },
          ],
          weight: 50,
          conditions: [],
        },
      ],
      telemetry: {
        track: true,
        metrics: ['completion_rate', 'engagement'],
        customEvents: [],
      },
    },
    quest_fail: {
      id: 'quest_fail',
      name: 'Quest Fail Hook',
      description: 'Triggered when a quest fails',
      type: 'quest_fail',
      priority: 85,
      conditions: [],
      templates: [
        {
          id: 'quest_fail_disappointment',
          name: 'Quest Failure',
          text: '{resident_name} has failed to complete {quest_name}. {failure_reason} The journey ends in disappointment.',
          variables: [
            { name: 'quest_name', type: 'string', required: true },
            { name: 'resident_name', type: 'string', required: true },
            { name: 'failure_reason', type: 'string', required: true },
            { name: 'consequences', type: 'array', required: false },
          ],
          weight: 50,
          conditions: [],
        },
      ],
      telemetry: {
        track: true,
        metrics: ['completion_rate', 'engagement'],
        customEvents: [],
      },
    },
    resident_interaction: {
      id: 'resident_interaction',
      name: 'Resident Interaction Hook',
      description: 'Triggered during resident interactions',
      type: 'resident_interaction',
      priority: 40,
      conditions: [],
      templates: [
        {
          id: 'resident_interaction_basic',
          name: 'Basic Interaction',
          text: '{resident_name} {interaction_action} with {target_name}. {interaction_description}',
          variables: [
            { name: 'resident_name', type: 'string', required: true },
            { name: 'target_name', type: 'string', required: true },
            { name: 'interaction_action', type: 'string', required: true },
            { name: 'interaction_description', type: 'string', required: true },
          ],
          weight: 50,
          conditions: [],
        },
      ],
      telemetry: {
        track: true,
        metrics: ['engagement', 'choice_distribution'],
        customEvents: [],
      },
    },
    environmental_trigger: {
      id: 'environmental_trigger',
      name: 'Environmental Trigger Hook',
      description: 'Triggered by environmental events',
      type: 'environmental_trigger',
      priority: 30,
      conditions: [],
      templates: [
        {
          id: 'environmental_weather',
          name: 'Weather Event',
          text: 'The {weather} weather affects the area. {weather_description} {resident_name} must adapt to these conditions.',
          variables: [
            { name: 'weather', type: 'string', required: true },
            { name: 'weather_description', type: 'string', required: true },
            { name: 'resident_name', type: 'string', required: false },
            { name: 'location', type: 'string', required: false },
          ],
          weight: 50,
          conditions: [],
        },
      ],
      telemetry: {
        track: true,
        metrics: ['engagement'],
        customEvents: [],
      },
    },
  },
  templates: {
    introduction: {
      id: 'introduction',
      name: 'Introduction Templates',
      category: 'introduction',
      text: 'Welcome to {location_name}. {description}',
      variables: [
        { name: 'location_name', type: 'string', required: true },
        { name: 'description', type: 'string', required: true },
      ],
      weight: 50,
      conditions: [],
      tags: ['welcome', 'location'],
    },
    progress: {
      id: 'progress',
      name: 'Progress Templates',
      category: 'progress',
      text: 'Progress update: {progress_info}',
      variables: [
        { name: 'progress_info', type: 'string', required: true },
      ],
      weight: 50,
      conditions: [],
      tags: ['progress', 'update'],
    },
    completion: {
      id: 'completion',
      name: 'Completion Templates',
      category: 'completion',
      text: 'Quest completed! {completion_details}',
      variables: [
        { name: 'completion_details', type: 'string', required: true },
      ],
      weight: 50,
      conditions: [],
      tags: ['completion', 'success'],
    },
    failure: {
      id: 'failure',
      name: 'Failure Templates',
      category: 'failure',
      text: 'Quest failed. {failure_details}',
      variables: [
        { name: 'failure_details', type: 'string', required: true },
      ],
      weight: 50,
      conditions: [],
      tags: ['failure', 'setback'],
    },
    interaction: {
      id: 'interaction',
      name: 'Interaction Templates',
      category: 'interaction',
      text: '{resident_name} {interaction_type} with {target_name}: {interaction_details}',
      variables: [
        { name: 'resident_name', type: 'string', required: true },
        { name: 'interaction_type', type: 'string', required: true },
        { name: 'target_name', type: 'string', required: true },
        { name: 'interaction_details', type: 'string', required: true },
      ],
      weight: 50,
      conditions: [],
      tags: ['interaction', 'social'],
    },
    environment: {
      id: 'environment',
      name: 'Environment Templates',
      category: 'environment',
      text: 'Environmental event: {event_description}',
      variables: [
        { name: 'event_description', type: 'string', required: true },
      ],
      weight: 50,
      conditions: [],
      tags: ['environment', 'weather'],
    },
  },
  variables: {
    quest_name: {
      name: 'quest_name',
      type: 'string',
      description: 'The name of the quest',
      defaultValue: 'Unknown Quest',
    },
    resident_name: {
      name: 'resident_name',
      type: 'string',
      description: 'The name of the resident',
      defaultValue: 'Unknown Resident',
    },
    quest_difficulty: {
      name: 'quest_difficulty',
      type: 'string',
      description: 'The difficulty level of the quest',
      defaultValue: 'normal',
      validation: {
        enum: ['easy', 'normal', 'hard', 'nightmare'],
      },
    },
    location: {
      name: 'location',
      type: 'string',
      description: 'The current location',
      defaultValue: 'Unknown Location',
    },
    weather: {
      name: 'weather',
      type: 'string',
      description: 'The current weather condition',
      defaultValue: 'clear',
      validation: {
        enum: ['clear', 'rain', 'snow', 'storm', 'fog', 'windy'],
      },
    },
    time_of_day: {
      name: 'time_of_day',
      type: 'string',
      description: 'The current time of day',
      defaultValue: 'day',
      validation: {
        enum: ['dawn', 'day', 'dusk', 'night'],
      },
    },
    progress_percentage: {
      name: 'progress_percentage',
      type: 'number',
      description: 'The percentage of quest completion',
      defaultValue: 0,
      validation: {
        min: 0,
        max: 100,
      },
    },
  },
  telemetry: {
    enabled: true,
    tracking: {
      events: [
        'narrative_generated',
        'template_selected',
        'hook_triggered',
        'variable_substituted',
        'condition_evaluated',
      ],
      metrics: [
        'engagement_score',
        'completion_rate',
        'time_to_complete',
        'choice_distribution',
        'template_usage_frequency',
        'hook_success_rate',
      ],
      sampling: {
        rate: 1.0,
        maxEvents: 10000,
      },
    },
    aggregation: {
      windows: [
        {
          name: 'hourly_engagement',
          duration: 60, // 1 hour
          metrics: ['engagement_score', 'template_usage_frequency'],
        },
        {
          name: 'daily_completion',
          duration: 1440, // 24 hours
          metrics: ['completion_rate', 'time_to_complete'],
        },
        {
          name: 'weekly_performance',
          duration: 10080, // 7 days
          metrics: ['hook_success_rate', 'choice_distribution'],
        },
      ],
      custom: [
        {
          name: 'narrative_effectiveness',
          formula: 'engagement_score * completion_rate',
          description: 'Combined measure of narrative engagement and quest completion',
        },
        {
          name: 'template_diversity_index',
          formula: 'COUNT(DISTINCT template_id) / COUNT(template_id)',
          description: 'Measure of template variety in usage',
        },
      ],
    },
  },
};

// Narrative configuration manager
export class NarrativeConfigManager {
  private config: NarrativeConfig;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || join(process.cwd(), 'src/balancing/config/narrative/narrative.json');
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from file
   */
  private loadConfig(): NarrativeConfig {
    try {
      if (existsSync(this.configPath)) {
        const configData = JSON.parse(readFileSync(this.configPath, 'utf8'));
        const parsed = NarrativeConfigSchema.parse(configData);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load narrative config, using defaults:', error);
    }
    
    return DEFAULT_NARRATIVE_CONFIG;
  }

  /**
   * Save configuration to file
   */
  saveConfig(): void {
    try {
      const configDir = dirname(this.configPath);
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save narrative config:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): NarrativeConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<NarrativeConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Get hook configuration
   */
  getHook(hookId: string): NarrativeConfig['hooks'][string] | undefined {
    return this.config.hooks[hookId];
  }

  /**
   * Get template configuration
   */
  getTemplate(templateId: string): NarrativeConfig['templates'][string] | undefined {
    return this.config.templates[templateId];
  }

  /**
   * Get variable configuration
   */
  getVariable(variableName: string): NarrativeConfig['variables'][string] | undefined {
    return this.config.variables[variableName];
  }

  /**
   * Add or update hook
   */
  setHook(hookId: string, hook: NarrativeConfig['hooks'][string]): void {
    this.config.hooks[hookId] = hook;
    this.saveConfig();
  }

  /**
   * Add or update template
   */
  setTemplate(templateId: string, template: NarrativeConfig['templates'][string]): void {
    this.config.templates[templateId] = template;
    this.saveConfig();
  }

  /**
   * Add or update variable
   */
  setVariable(variableName: string, variable: NarrativeConfig['variables'][string]): void {
    this.config.variables[variableName] = variable;
    this.saveConfig();
  }

  /**
   * Remove hook
   */
  removeHook(hookId: string): boolean {
    if (this.config.hooks[hookId]) {
      delete this.config.hooks[hookId];
      this.saveConfig();
      return true;
    }
    return false;
  }

  /**
   * Remove template
   */
  removeTemplate(templateId: string): boolean {
    if (this.config.templates[templateId]) {
      delete this.config.templates[templateId];
      this.saveConfig();
      return true;
    }
    return false;
  }

  /**
   * Remove variable
   */
  removeVariable(variableName: string): boolean {
    if (this.config.variables[variableName]) {
      delete this.config.variables[variableName];
      this.saveConfig();
      return true;
    }
    return false;
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    try {
      NarrativeConfigSchema.parse(this.config);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        };
      }
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_NARRATIVE_CONFIG };
    this.saveConfig();
  }

  /**
   * Get telemetry configuration
   */
  getTelemetryConfig(): NarrativeConfig['telemetry'] {
    return this.config.telemetry;
  }

  /**
   * Update telemetry configuration
   */
  updateTelemetryConfig(updates: Partial<NarrativeConfig['telemetry']>): void {
    this.config.telemetry = { ...this.config.telemetry, ...updates };
    this.saveConfig();
  }

  /**
   * Enable/disable telemetry
   */
  setTelemetryEnabled(enabled: boolean): void {
    this.config.telemetry.enabled = enabled;
    this.saveConfig();
  }

  /**
   * Get all hooks of a specific type
   */
  getHooksByType(type: NarrativeConfig['hooks'][string]['type']): NarrativeConfig['hooks'][string][] {
    return Object.values(this.config.hooks).filter(hook => hook.type === type);
  }

  /**
   * Get all templates of a specific category
   */
  getTemplatesByCategory(category: NarrativeConfig['templates'][string]['category']): NarrativeConfig['templates'][string][] {
    return Object.values(this.config.templates).filter(template => template.category === category);
  }

  /**
   * Search hooks by name or description
   */
  searchHooks(query: string): NarrativeConfig['hooks'][string][] {
    const lowerQuery = query.toLowerCase();
    return Object.values(this.config.hooks).filter(hook =>
      hook.name.toLowerCase().includes(lowerQuery) ||
      hook.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Search templates by name, category, or tags
   */
  searchTemplates(query: string): NarrativeConfig['templates'][string][] {
    const lowerQuery = query.toLowerCase();
    return Object.values(this.config.templates).filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export configuration to JSON string
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  importConfig(configJson: string): { success: boolean; errors: string[] } {
    try {
      const configData = JSON.parse(configJson);
      const parsed = NarrativeConfigSchema.parse(configData);
      this.config = parsed;
      this.saveConfig();
      return { success: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        };
      }
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown import error'],
      };
    }
  }
}

// Singleton instance
export const narrativeConfigManager = new NarrativeConfigManager();

// Helper functions
export function getNarrativeConfig(): NarrativeConfig {
  return narrativeConfigManager.getConfig();
}

export function getHookConfig(hookId: string): NarrativeConfig['hooks'][string] | undefined {
  return narrativeConfigManager.getHook(hookId);
}

export function getTemplateConfig(templateId: string): NarrativeConfig['templates'][string] | undefined {
  return narrativeConfigManager.getTemplate(templateId);
}

export function getVariableConfig(variableName: string): NarrativeConfig['variables'][string] | undefined {
  return narrativeConfigManager.getVariable(variableName);
}

export function getTelemetryConfig(): NarrativeConfig['telemetry'] {
  return narrativeConfigManager.getTelemetryConfig();
}
