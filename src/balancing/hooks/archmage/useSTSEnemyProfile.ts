/**
 * Hook for managing STS Enemy Intent Profiles
 * 
 * Provides access to enemy AI configurations and handles intent selection
 * for the STS simulator. All data is config-first and loaded from archmage modules.
 */

import { useMemo } from 'react';
import type { EnemyIntentProfile, EnemyIntentAction } from '../../config/archmage';
import { DEFAULT_ENEMIES } from '../../config/archmage';

/**
 * Hook for accessing STS enemy configurations
 * 
 * @param enemyId - Optional specific enemy ID to load
 * @returns Enemy configuration and available enemies
 */
export function useSTSEnemyProfile(enemyId?: string) {
  const enemies = useMemo(() => DEFAULT_ENEMIES, []);
  
  const selectedEnemy = useMemo(() => {
    if (!enemyId) return null;
    return enemies[enemyId] || null;
  }, [enemyId, enemies]);

  const enemyOptions = useMemo(() => {
    return Object.values(enemies).map(enemy => ({
      id: enemy.id,
      label: enemy.label,
      description: `HP: ${enemy.maxHp}, ${enemy.intents.length} intents`,
      maxHp: enemy.maxHp,
      intentCount: enemy.intents.length
    }));
  }, [enemies]);

  return {
    // Selected enemy
    enemy: selectedEnemy,
    
    // All available enemies
    enemies,
    enemyOptions,
    
    // Convenience getters
    availableEnemyIds: Object.keys(enemies),
    hasEnemy: !!selectedEnemy,
    
    // Enemy validation
    isValidEnemyId: (id: string) => id in enemies,
    
    // Default enemy
    defaultEnemyId: 'tutorial'
  };
}

/**
 * Hook for enemy intent selection and analysis
 * 
 * @param enemy - Enemy configuration
 * @returns Intent selection utilities and analysis
 */
export function useSTSIntents(enemy: EnemyIntentProfile | null) {
  const intents = useMemo(() => {
    if (!enemy) return [];
    return enemy.intents;
  }, [enemy]);

  const weightedIntents = useMemo(() => {
    const totalWeight = intents.reduce((sum, intent) => sum + intent.weight, 0);
    
    return intents.map(intent => ({
      ...intent,
      probability: totalWeight > 0 ? intent.weight / totalWeight : 0,
      expectedValue: intent.baselineValue,
      valueRange: {
        min: Math.max(0, intent.baselineValue - intent.variance),
        max: intent.baselineValue + intent.variance
      }
    }));
  }, [intents]);

  const intentsByType = useMemo(() => {
    return intents.reduce((acc, intent) => {
      const type = intent.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(intent);
      return acc;
    }, {} as Record<string, EnemyIntentAction[]>);
  }, [intents]);

  /**
   * Apply reactive modifiers to intents based on conditions
   */
  const applyReactiveModifiers = useMemo(() => {
    return (baseIntents: EnemyIntentAction[]) => {
      const modifiers = enemy?.reactiveModifiers;
      if (!modifiers || !Array.isArray(modifiers) || modifiers.length === 0) return baseIntents;
      
      return baseIntents.map(intent => {
        // This would need access to current game state (player/enemy HP)
        // For now, return unmodified intents
        // TODO: Pass game state to this hook for proper modifier application
        return intent;
      });
    };
  }, [enemy]);

  /**
   * Select an intent based on weighted probability
   * 
   * @param rng - Random number generator (0-1)
   * @returns Selected intent
   */
  const selectIntent = useMemo(() => {
    return (rng: () => number): EnemyIntentAction | null => {
      if (!enemy || intents.length === 0) return null;
      
      // Apply reactive modifiers if conditions are met
      const modifiedIntents = applyReactiveModifiers(intents);
      
      const totalWeight = modifiedIntents.reduce((sum, intent) => sum + intent.weight, 0);
      if (totalWeight === 0) return null;
      
      let random = rng() * totalWeight;
      
      for (const intent of modifiedIntents) {
        random -= intent.weight;
        if (random <= 0) return intent;
      }
      
      return modifiedIntents[0];
    };
  }, [enemy, intents, applyReactiveModifiers]);

  return {
    intents,
    weightedIntents,
    intentsByType,
    intentCount: intents.length,
    
    // Intent selection
    selectIntent,
    
    // Intent analysis
    getIntentByType: (type: string) => intentsByType[type] || [],
    getMostLikelyIntent: () => {
      return weightedIntents.reduce((most, current) => 
        current.probability > most.probability ? current : most
      , weightedIntents[0] || null);
    },
    
    // Pacing analysis
    isPacingCompliant: (turnNumber: number) => {
      if (!enemy?.pacingCaps) return true;
      const { minTurns, maxTurns } = enemy.pacingCaps;
      return (!minTurns || turnNumber >= minTurns) && 
             (!maxTurns || turnNumber <= maxTurns);
    }
  };
}
