/**
 * Character-to-Resident Canonical Bootstrap
 * 
 * Implements the single canonical path for converting Character entities
 * to Resident projections for Idle Village usage.
 * 
 * This is the ONLY place where Character -> Resident conversion should happen.
 * All pages and components must consume residents through this bootstrap.
 */

import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { getStartingResidentFatigue } from '@/engine/game/idleVillage/TimeEngine';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { savedCharacterToResident } from '@/engine/game/idleVillage/characterImport';
import { loadCharacters } from '@/engine/idle/characterStorage';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import type { StatBlock } from '@/balancing/types';

/**
 * Fallback residents used when character storage is empty or corrupted.
 * These are NOT test fixtures - they are minimal fallback residents
 * to ensure the village can function when no characters exist.
 */
const FALLBACK_RESIDENTS: ResidentState[] = [
  {
    id: 'fallback-worker-1',
    displayName: 'Worker',
    status: 'available',
    fatigue: 0,
    statProfileId: 'worker',
    visualProfileId: 'hero-tank',
    statTags: ['strength'],
    statSnapshot: { strength: 50, hp: 100 } as Partial<StatBlock>,
    currentHp: 100,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
  },
  {
    id: 'fallback-worker-2', 
    displayName: 'Scout',
    status: 'available',
    fatigue: 0,
    statProfileId: 'scout',
    visualProfileId: 'hero-support',
    statTags: ['speed'],
    statSnapshot: { speed: 60, hp: 80 } as Partial<StatBlock>,
    currentHp: 80,
    maxHp: 80,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
  },
];

/**
 * Options for bootstrapping residents from characters
 */
export interface BootstrapResidentsOptions {
  /** Optional config for determining starting fatigue */
  config?: IdleVillageConfig;
  /** Whether to use fallback residents when character storage is empty */
  enableFallback?: boolean;
  /** Custom override for starting fatigue (ignores config) */
  startingFatigueOverride?: number;
}

/**
 * Result of resident bootstrap operation
 */
export interface BootstrapResidentsResult {
  /** The bootstrapped residents */
  residents: ResidentState[];
  /** Whether fallback residents were used */
  usedFallback: boolean;
  /** Number of characters successfully converted */
  charactersConverted: number;
  /** Any error that occurred during conversion */
  error?: string;
}

/**
 * Canonical bootstrap function that converts Characters to Residents.
 * 
 * This is the SINGLE source of truth for all Character -> Resident conversion.
 * All pages and components must use this function instead of direct conversion.
 * 
 * @param options - Bootstrap configuration options
 * @returns Bootstrap result with residents and metadata
 */
export function bootstrapResidentsFromCharacters(
  options: BootstrapResidentsOptions = {}
): BootstrapResidentsResult {
  const { config, enableFallback = true, startingFatigueOverride } = options;
  
  try {
    // Load characters from primary storage
    const characters = loadCharacters();
    
    if (characters.length === 0) {
      // Character storage is empty - use fallback if enabled
      if (enableFallback) {
        trackTelemetryEvent('character_to_resident_fallback_used', {
          reason: 'character_storage_empty',
          fallbackCount: FALLBACK_RESIDENTS.length,
          timestamp: Date.now(),
        });
        
        // Resolve portrait URLs for fallback residents with direct mapping
        const fallbackResidentsWithPortraits = FALLBACK_RESIDENTS.map(resident => {
          let portraitUrl = getResidentPortraitUrl(resident);
          
          // If portrait resolution returns empty, apply direct mapping
          if (!portraitUrl) {
            if (resident.visualProfileId === 'hero-tank') {
              portraitUrl = '/src/assets/portraits/portrait male warrior.png';
            } else if (resident.visualProfileId === 'hero-support') {
              portraitUrl = '/src/assets/portraits/portrait female magician.png';
            }
          }
          
          return {
            ...resident,
            portraitUrl,
          };
        });
        
        return {
          residents: fallbackResidentsWithPortraits,
          usedFallback: true,
          charactersConverted: 0,
        };
      } else {
        return {
          residents: [],
          usedFallback: false,
          charactersConverted: 0,
        };
      }
    }

    // Convert characters to residents using existing canonical conversion
    const defaultFatigue = startingFatigueOverride ?? 
      (config && config.globalRules ? getStartingResidentFatigue(config) : 0);
    
    const residents = characters.map((character) =>
      savedCharacterToResident(character, { defaultFatigue })
    );

    trackTelemetryEvent('character_to_resident_bootstrap_success', {
      characterCount: characters.length,
      residentCount: residents.length,
      defaultFatigue,
      timestamp: Date.now(),
    });

    return {
      residents,
      usedFallback: false,
      charactersConverted: characters.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    trackTelemetryEvent('character_to_resident_bootstrap_error', {
      error: errorMessage,
      timestamp: Date.now(),
    });

    // Fallback to minimal residents if conversion fails
    if (enableFallback) {
      return {
        residents: FALLBACK_RESIDENTS,
        usedFallback: true,
        charactersConverted: 0,
        error: errorMessage,
      };
    }

    return {
      residents: [],
      usedFallback: false,
      charactersConverted: 0,
      error: errorMessage,
    };
  }
}

/**
 * Legacy compatibility wrapper for existing code.
 * 
 * @deprecated Use bootstrapResidentsFromCharacters() instead
 */
export function loadResidentsFromCharacterManager(options?: { config?: IdleVillageConfig }): ResidentState[] {
  console.warn(
    '[CharacterToResidentBootstrap] loadResidentsFromCharacterManager is deprecated. ' +
    'Use bootstrapResidentsFromCharacters() instead.'
  );
  
  const result = bootstrapResidentsFromCharacters({ config: options?.config });
  return result.residents;
}
