/**
 * NP-029 – Idle Village Quest Narrative Hooks Refactor
 * 
 * Refactored narrative hooks system using centralized configuration.
 * Provides hooks for narrative generation, template selection, and
 * telemetry integration with comprehensive error handling.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNarrativeConfig } from './useNarrativeConfig';
import { useNarrativeTelemetry } from './useNarrativeTelemetry';
import { 
  NarrativeConfig, 
  getHookConfig, 
  getTemplateConfig, 
  getVariableConfig,
  getTelemetryConfig 
} from '../../../balancing/config/narrative/narrativeConfig';

// Types for narrative hooks
export interface NarrativeContext {
  questId?: string;
  questName?: string;
  questType?: string;
  questDifficulty?: string;
  residentId?: string;
  residentName?: string;
  residentLevel?: number;
  location?: string;
  weather?: string;
  timeOfDay?: string;
  progressPercentage?: number;
  [key: string]: any;
}

export interface NarrativeTemplate {
  id: string;
  name: string;
  text: string;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    defaultValue?: any;
  }>;
  weight: number;
  conditions: Array<{
    type: string;
    operator: string;
    value: any;
  }>;
}

export interface NarrativeHook {
  id: string;
  name: string;
  description: string;
  type: 'quest_start' | 'quest_progress' | 'quest_complete' | 'quest_fail' | 'resident_interaction' | 'environmental_trigger';
  priority: number;
  conditions: Array<{
    type: string;
    operator: string;
    value: any;
  }>;
  templates: NarrativeTemplate[];
  telemetry: {
    track: boolean;
    metrics: string[];
    customEvents: Array<{
      name: string;
      description: string;
      properties: Record<string, string>;
    }>;
  };
}

export interface GeneratedNarrative {
  id: string;
  hookId: string;
  templateId: string;
  text: string;
  variables: Record<string, any>;
  context: NarrativeContext;
  timestamp: number;
  metadata: {
    hookName: string;
    templateName: string;
    conditionsMatched: string[];
    telemetryTracked: boolean;
  };
}

export interface NarrativeHookOptions {
  enableTelemetry?: boolean;
  fallbackTemplate?: string;
  strictValidation?: boolean;
  maxRetries?: number;
  cacheResults?: boolean;
}

// Main narrative hook
export function useNarrativeHooks(options: NarrativeHookOptions = {}) {
  const {
    enableTelemetry = true,
    fallbackTemplate = 'introduction',
    strictValidation = false,
    maxRetries = 3,
    cacheResults = true,
  } = options;

  const { config } = useNarrativeConfig();
  const { trackEvent, trackMetric } = useNarrativeTelemetry({ enabled: enableTelemetry });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, GeneratedNarrative>>(new Map());

  // Clear cache when config changes
  useEffect(() => {
    if (cacheResults) {
      setCache(new Map());
    }
  }, [config, cacheResults]);

  /**
   * Evaluate conditions against context
   */
  const evaluateConditions = useCallback((
    conditions: NarrativeHook['conditions'],
    context: NarrativeContext
  ): boolean => {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      const { type, operator, value } = condition;
      const contextValue = context[type];

      switch (operator) {
        case 'equals':
          return contextValue === value;
        case 'not_equals':
          return contextValue !== value;
        case 'greater_than':
          return Number(contextValue) > Number(value);
        case 'less_than':
          return Number(contextValue) < Number(value);
        case 'in':
          return Array.isArray(value) && value.includes(contextValue);
        case 'not_in':
          return Array.isArray(value) && !value.includes(contextValue);
        case 'contains':
          return String(contextValue).toLowerCase().includes(String(value).toLowerCase());
        default:
          console.warn(`Unknown condition operator: ${operator}`);
          return true;
      }
    });
  }, []);

  /**
   * Substitute variables in template text
   */
  const substituteVariables = useCallback((
    template: NarrativeTemplate,
    context: NarrativeContext
  ): { text: string; variables: Record<string, any> } => {
    let text = template.text;
    const variables: Record<string, any> = {};

    // Process each variable in the template
    for (const variable of template.variables) {
      const { name, type, required, defaultValue } = variable;
      let value = context[name];

      // Use default value if context value is missing
      if (value === undefined || value === null) {
        if (defaultValue !== undefined) {
          value = defaultValue;
        } else if (required && strictValidation) {
          throw new Error(`Required variable '${name}' is missing from context`);
        } else if (required) {
          value = `[${name}]`; // Placeholder for missing required variable
        } else {
          value = ''; // Empty string for optional variables
        }
      }

      // Type validation
      if (strictValidation && value !== undefined) {
        switch (type) {
          case 'string':
            if (typeof value !== 'string') {
              throw new Error(`Variable '${name}' must be a string, got ${typeof value}`);
            }
            break;
          case 'number':
            if (typeof value !== 'number') {
              throw new Error(`Variable '${name}' must be a number, got ${typeof value}`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              throw new Error(`Variable '${name}' must be a boolean, got ${typeof value}`);
            }
            break;
          case 'array':
            if (!Array.isArray(value)) {
              throw new Error(`Variable '${name}' must be an array, got ${typeof value}`);
            }
            break;
        }
      }

      variables[name] = value;
      
      // Substitute in text
      const placeholder = `{${name}}`;
      text = text.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(value));
    }

    return { text, variables };
  }, [strictValidation]);

  /**
   * Select template based on conditions and weights
   */
  const selectTemplate = useCallback((
    templates: NarrativeTemplate[],
    context: NarrativeContext
  ): NarrativeTemplate | null => {
    if (!templates || templates.length === 0) return null;

    // Filter templates by conditions
    const eligibleTemplates = templates.filter(template => 
      evaluateConditions(template.conditions, context)
    );

    if (eligibleTemplates.length === 0) return null;

    // Weighted random selection
    const totalWeight = eligibleTemplates.reduce((sum, template) => sum + template.weight, 0);
    let random = Math.random() * totalWeight;

    for (const template of eligibleTemplates) {
      random -= template.weight;
      if (random <= 0) {
        return template;
      }
    }

    // Fallback to first template
    return eligibleTemplates[0];
  }, [evaluateConditions]);

  /**
   * Generate narrative for a specific hook
   */
  const generateNarrative = useCallback(async (
    hookId: string,
    context: NarrativeContext
  ): Promise<GeneratedNarrative | null> => {
    const startTime = performance.now();
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheKey = `${hookId}_${JSON.stringify(context)}`;
      if (cacheResults && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        if (enableTelemetry) {
          trackEvent('narrative_cache_hit', {
            hookId,
            templateId: cached.templateId,
            context: cached.context,
          });
        }
        return cached;
      }

      // Get hook configuration
      const hookConfig = getHookConfig(hookId);
      if (!hookConfig) {
        throw new Error(`Hook configuration not found: ${hookId}`);
      }

      // Evaluate hook conditions
      if (!evaluateConditions(hookConfig.conditions, context)) {
        return null;
      }

      // Select template
      const template = selectTemplate(hookConfig.templates, context);
      if (!template) {
        // Try fallback template
        const fallbackTemplateConfig = getTemplateConfig(fallbackTemplate);
        if (!fallbackTemplateConfig) {
          throw new Error(`No eligible templates found for hook: ${hookId}`);
        }
        
        const { text, variables } = substituteVariables(fallbackTemplateConfig, context);
        const narrative: GeneratedNarrative = {
          id: `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          hookId,
          templateId: fallbackTemplate,
          text,
          variables,
          context,
          timestamp: Date.now(),
          metadata: {
            hookName: hookConfig.name,
            templateName: fallbackTemplateConfig.name,
            conditionsMatched: [],
            telemetryTracked: false,
          },
        };

        if (cacheResults) {
          setCache(prev => new Map(prev).set(cacheKey, narrative));
        }

        return narrative;
      }

      // Substitute variables
      const { text, variables } = substituteVariables(template, context);

      // Create narrative object
      const narrative: GeneratedNarrative = {
        id: `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        hookId,
        templateId: template.id,
        text,
        variables,
        context,
        timestamp: Date.now(),
        metadata: {
          hookName: hookConfig.name,
          templateName: template.name,
          conditionsMatched: template.conditions.map(c => c.type),
          telemetryTracked: false,
        },
      };

      // Track telemetry
      if (enableTelemetry && hookConfig.telemetry.track) {
        trackEvent('narrative_generated', {
          hookId,
          templateId: template.id,
          context,
          variables,
        });

        // Track custom events
        for (const customEvent of hookConfig.telemetry.customEvents) {
          trackEvent(customEvent.name, {
            ...customEvent.properties,
            hookId,
            templateId: template.id,
          });
        }

        narrative.metadata.telemetryTracked = true;
      }

      // Cache result
      if (cacheResults) {
        setCache(prev => new Map(prev).set(cacheKey, narrative));
      }

      return narrative;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      if (enableTelemetry) {
        trackEvent('narrative_generation_error', {
          hookId,
          context,
          error: errorMessage,
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
      
      if (enableTelemetry) {
        const duration = performance.now() - startTime;
        trackMetric('narrative_generation_time', duration);
      }
    }
  }, [
    cacheResults,
    cache,
    enableTelemetry,
    fallbackTemplate,
    trackEvent,
    trackMetric,
    evaluateConditions,
    selectTemplate,
    substituteVariables,
  ]);

  /**
   * Generate multiple narratives for different hooks
   */
  const generateMultipleNarratives = useCallback(async (
    hookIds: string[],
    context: NarrativeContext
  ): Promise<GeneratedNarrative[]> => {
    const narratives: GeneratedNarrative[] = [];
    
    for (const hookId of hookIds) {
      const narrative = await generateNarrative(hookId, context);
      if (narrative) {
        narratives.push(narrative);
      }
    }
    
    return narratives;
  }, [generateNarrative]);

  /**
   * Get available hooks for context
   */
  const getAvailableHooks = useCallback((context: NarrativeContext): string[] => {
    if (!config?.hooks) return [];

    return Object.entries(config.hooks)
      .filter(([_, hook]) => evaluateConditions(hook.conditions, context))
      .map(([hookId, _]) => hookId);
  }, [config, evaluateConditions]);

  /**
   * Validate context against hook requirements
   */
  const validateContext = useCallback((
    hookId: string,
    context: NarrativeContext
  ): { valid: boolean; missing: string[] } => {
    const hookConfig = getHookConfig(hookId);
    if (!hookConfig) {
      return { valid: false, missing: [`Hook not found: ${hookId}`] };
    }

    const missing: string[] = [];
    
    // Check hook conditions
    for (const condition of hookConfig.conditions) {
      if (context[condition.type] === undefined) {
        missing.push(condition.type);
      }
    }

    // Check template variables
    for (const template of hookConfig.templates) {
      for (const variable of template.variables) {
        if (variable.required && context[variable.name] === undefined) {
          missing.push(variable.name);
        }
      }
    }

    return { valid: missing.length === 0, missing };
  }, []);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
      entries: Array.from(cache.entries()),
    };
  }, [cache]);

  // Memoized values
  const availableHooks = useMemo(() => {
    return Object.keys(config?.hooks || {});
  }, [config]);

  const hookTypes = useMemo(() => {
    const types = new Set<string>();
    Object.values(config?.hooks || {}).forEach(hook => types.add(hook.type));
    return Array.from(types);
  }, [config]);

  return {
    // State
    isLoading,
    error,
    availableHooks,
    hookTypes,
    
    // Main functions
    generateNarrative,
    generateMultipleNarratives,
    
    // Utility functions
    getAvailableHooks,
    validateContext,
    clearCache,
    getCacheStats,
    
    // Configuration
    config,
    options,
  };
}

// Specialized hooks for common use cases
export function useQuestNarrative(options?: NarrativeHookOptions) {
  const { generateNarrative, ...rest } = useNarrativeHooks(options);

  const generateQuestStart = useCallback(async (context: NarrativeContext) => {
    return generateNarrative('quest_start', context);
  }, [generateNarrative]);

  const generateQuestProgress = useCallback(async (context: NarrativeContext) => {
    return generateNarrative('quest_progress', context);
  }, [generateNarrative]);

  const generateQuestComplete = useCallback(async (context: NarrativeContext) => {
    return generateNarrative('quest_complete', context);
  }, [generateNarrative]);

  const generateQuestFail = useCallback(async (context: NarrativeContext) => {
    return generateNarrative('quest_fail', context);
  }, [generateNarrative]);

  return {
    generateQuestStart,
    generateQuestProgress,
    generateQuestComplete,
    generateQuestFail,
    generateNarrative,
    ...rest,
  };
}

export function useResidentNarrative(options?: NarrativeHookOptions) {
  const { generateNarrative, ...rest } = useNarrativeHooks(options);

  const generateResidentInteraction = useCallback(async (context: NarrativeContext) => {
    return generateNarrative('resident_interaction', context);
  }, [generateNarrative]);

  return {
    generateResidentInteraction,
    generateNarrative,
    ...rest,
  };
}

export function useEnvironmentalNarrative(options?: NarrativeHookOptions) {
  const { generateNarrative, ...rest } = useNarrativeHooks(options);

  const generateEnvironmentalTrigger = useCallback(async (context: NarrativeContext) => {
    return generateNarrative('environmental_trigger', context);
  }, [generateNarrative]);

  return {
    generateEnvironmentalTrigger,
    generateNarrative,
    ...rest,
  };
}

// Utility hooks
export function useNarrativeValidation() {
  const validateTemplate = useCallback((template: NarrativeTemplate, context: NarrativeContext) => {
    const missing: string[] = [];
    
    for (const variable of template.variables) {
      if (variable.required && context[variable.name] === undefined) {
        missing.push(variable.name);
      }
    }
    
    return { valid: missing.length === 0, missing };
  }, []);

  const validateHook = useCallback((hook: NarrativeHook, context: NarrativeContext) => {
    const missing: string[] = [];
    
    // Check conditions
    for (const condition of hook.conditions) {
      if (context[condition.type] === undefined) {
        missing.push(condition.type);
      }
    }
    
    // Check template variables
    for (const template of hook.templates) {
      const templateValidation = validateTemplate(template, context);
      missing.push(...templateValidation.missing);
    }
    
    return { valid: missing.length === 0, missing };
  }, [validateTemplate]);

  return {
    validateTemplate,
    validateHook,
  };
}

export function useNarrativeCache() {
  const [cache, setCache] = useState<Map<string, GeneratedNarrative>>(new Map());

  const get = useCallback((key: string) => {
    return cache.get(key);
  }, [cache]);

  const set = useCallback((key: string, narrative: GeneratedNarrative) => {
    setCache(prev => new Map(prev).set(key, narrative));
  }, []);

  const remove = useCallback((key: string) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
  }, []);

  const clear = useCallback(() => {
    setCache(new Map());
  }, []);

  const size = useCallback(() => {
    return cache.size;
  }, [cache]);

  const keys = useCallback(() => {
    return Array.from(cache.keys());
  }, [cache]);

  const values = useCallback(() => {
    return Array.from(cache.values());
  }, [cache]);

  return {
    get,
    set,
    remove,
    clear,
    size,
    keys,
    values,
  };
}
