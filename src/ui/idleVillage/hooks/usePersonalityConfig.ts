/**
 * NP-034 – Idle Village Resident Personality Config
 * 
 * React hook for personality configuration management with
 * compatibility checking, badge UI, and analytics.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  PersonalityProfile,
  PersonalityTrait,
  PersonalityArchetype,
  PersonalityCategory,
  TraitLevel,
  CompatibilityScore,
  PersonalityBadgeConfig,
  PersonalityConfig,
  PersonalityAnalysisResult,
  PersonalityInsight,
  PersonalityRecommendation,
  PersonalityAnalytics,
  validatePersonalityTrait,
  validatePersonalityProfile,
  validateCompatibilityScore,
  createPersonalityTrait,
  createPersonalityProfile,
  createCompatibilityScore,
  getTraitLevelFromValue,
  getTraitValueFromLevel,
  getTraitColor,
  getArchetypeDescription,
  getCategoryDescription,
  DEFAULT_PERSONALITY_TRAITS,
  DEFAULT_PERSONALITY_COMPATIBILITY,
  DEFAULT_PERSONALITY_BADGE_CONFIG,
} from '../types/residentPersonality';
import { PersonalityEngine, PersonalityCalculationContext } from '../personality/personalityEngine';

export interface UsePersonalityConfigOptions {
  initialProfiles?: PersonalityProfile[];
  initialTraits?: PersonalityTrait[];
  autoAnalyze?: boolean;
  analysisInterval?: number;
  enableCache?: boolean;
  enableTelemetry?: boolean;
  config?: Partial<PersonalityConfig>;
}

export function usePersonalityConfig(options: UsePersonalityConfigOptions = {}) {
  const {
    initialProfiles = [],
    initialTraits = [],
    autoAnalyze = true,
    analysisInterval = 300000, // 5 minutes
    enableCache = true,
    enableTelemetry = true,
    config = {},
  } = options;

  // Core state
  const [profiles, setProfiles] = useState<PersonalityProfile[]>(initialProfiles);
  const [traits, setTraits] = useState<PersonalityTrait[]>(initialTraits.length > 0 ? initialTraits : DEFAULT_PERSONALITY_TRAITS);
  const [compatibilityScores, setCompatibilityScores] = useState<Record<string, CompatibilityScore>>({});
  const [analysis, setAnalysis] = useState<PersonalityAnalysisResult | null>(null);
  const [insights, setInsights] = useState<PersonalityInsight[]>([]);
  const [recommendations, setRecommendations] = useState<PersonalityRecommendation[]>([]);
  const [analytics, setAnalytics] = useState<PersonalityAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<number>(Date.now());

  // Configuration state
  const [personalityConfig, setPersonalityConfig] = useState<PersonalityConfig>({
    id: 'default-personality-config',
    name: 'Default Personality Configuration',
    description: 'Default configuration for resident personality management',
    enabled: true,
    traits: DEFAULT_PERSONALITY_TRAITS,
    archetypes: [
      'leader', 'team_player', 'innovator', 'specialist', 'generalist',
      'mentor', 'rebel', 'mediator', 'perfectionist', 'strategist'
    ],
    compatibility: DEFAULT_PERSONALITY_COMPATIBILITY,
    badges: [DEFAULT_PERSONALITY_BADGE_CONFIG],
    validation: {
      enabled: true,
      rules: [],
      thresholds: {
        minTraitValue: -2,
        maxTraitValue: 2,
        minCompatibilityScore: 0.3,
        maxConflicts: 3,
        requiredTraits: ['social_cooperation', 'work_diligence'],
        forbiddenCombinations: [],
      },
      scoring: {
        weights: {
          social: 0.2,
          work_ethic: 0.2,
          creativity: 0.15,
          adaptability: 0.15,
          leadership: 0.15,
          communication: 0.1,
          problem_solving: 0.15,
          emotional_intelligence: 0.1,
        },
        penalties: {},
        bonuses: {},
      },
      notifications: {
        onValidationError: true,
        onLowCompatibility: true,
        onTraitConflict: true,
        onArchetypeMismatch: true,
      },
    },
    analytics: {
      enabled: true,
      tracking: {
        personalityChanges: true,
        compatibilityChecks: true,
        badgeInteractions: true,
        teamAssignments: true,
      },
      metrics: {
        traitDistribution: true,
        archetypeUsage: true,
        compatibilityScores: true,
        teamPerformance: true,
        successRates: true,
      },
      reporting: {
        frequency: 'daily',
        formats: ['dashboard', 'csv', 'json'],
        recipients: [],
        autoExport: false,
      },
      dashboard: {
        enabled: true,
        widgets: [],
        refreshInterval: 60000,
        filters: [],
      },
    },
    export: {
      enabled: true,
      formats: ['json', 'csv'],
      destinations: ['/exports/personality'],
      schedule: '0 0 * * *',
      filters: {},
      compression: {
        enabled: false,
        algorithm: 'gzip',
        level: 6,
      },
      encryption: {
        enabled: false,
        algorithm: 'aes256',
        key: '',
      },
    },
    metadata: {
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'system',
      description: 'Default personality configuration',
      tags: ['default', 'personality', 'config'],
      category: 'personality',
      dependencies: [],
      compatibility: {
        minVersion: '1.0.0',
        maxVersion: '2.0.0',
      },
    },
    ...config,
  });

  // Refs
  const personalityEngineRef = useRef<PersonalityEngine>(new PersonalityEngine());
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Add personality profile
   */
  const addProfile = useCallback((profile: PersonalityProfile) => {
    if (!validatePersonalityProfile(profile)) {
      throw new Error('Invalid personality profile');
    }

    setProfiles(prev => [...prev, profile]);
    personalityEngineRef.current.addProfile(profile);
    
    if (enableTelemetry) {
      console.log('Personality profile added:', profile.id);
    }
  }, [enableTelemetry]);

  /**
   * Update personality profile
   */
  const updateProfile = useCallback((id: string, updates: Partial<PersonalityProfile>) => {
    setProfiles(prev => prev.map(profile => 
      profile.id === id 
        ? { ...profile, ...updates, updatedAt: Date.now() }
        : profile
    ));

    const profile = profiles.find(p => p.id === id);
    if (profile) {
      const updatedProfile = { ...profile, ...updates, updatedAt: Date.now() };
      personalityEngineRef.current.addProfile(updatedProfile);
    }
  }, [profiles]);

  /**
   * Remove personality profile
   */
  const removeProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(profile => profile.id !== id));
    personalityEngineRef.current.removeProfile(id);
  }, []);

  /**
   * Add personality trait
   */
  const addTrait = useCallback((trait: PersonalityTrait) => {
    if (!validatePersonalityTrait(trait)) {
      throw new Error('Invalid personality trait');
    }

    setTraits(prev => [...prev, trait]);
    personalityEngineRef.current.addTrait(trait);
    
    if (enableTelemetry) {
      console.log('Personality trait added:', trait.id);
    }
  }, [enableTelemetry]);

  /**
   * Update personality trait
   */
  const updateTrait = useCallback((id: string, updates: Partial<PersonalityTrait>) => {
    setTraits(prev => prev.map(trait => 
      trait.id === id ? { ...trait, ...updates } : trait
    ));

    const trait = traits.find(t => t.id === id);
    if (trait) {
      const updatedTrait = { ...trait, ...updates };
      personalityEngineRef.current.addTrait(updatedTrait);
    }
  }, [traits]);

  /**
   * Remove personality trait
   */
  const removeTrait = useCallback((id: string) => {
    setTraits(prev => prev.filter(trait => trait.id !== id));
    personalityEngineRef.current.removeTrait(id);
  }, []);

  /**
   * Update profile trait value
   */
  const updateProfileTrait = useCallback((profileId: string, traitId: string, value: number) => {
    const level = getTraitLevelFromValue(value);
    const color = getTraitColor(level);

    updateProfile(profileId, {
      traits: profiles.find(p => p.id === profileId)?.traits.map(trait =>
        trait.id === traitId 
          ? { ...trait, value, level, color }
          : trait
      ) || [],
    });
  }, [profiles, updateProfile]);

  /**
   * Calculate compatibility between two profiles
   */
  const calculateCompatibility = useCallback((profile1Id: string, profile2Id: string): CompatibilityScore | null => {
    const profile1 = profiles.find(p => p.id === profile1Id);
    const profile2 = profiles.find(p => p.id === profile2Id);

    if (!profile1 || !profile2) {
      return null;
    }

    const score = personalityEngineRef.current.calculateCompatibility(profile1, profile2);
    
    // Update compatibility scores state
    setCompatibilityScores(prev => ({
      ...prev,
      [`${profile1Id}-${profile2Id}`]: score,
      [`${profile2Id}-${profile1Id}`]: score,
    }));

    return score;
  }, [profiles]);

  /**
   * Calculate all compatibility scores
   */
  const calculateAllCompatibilities = useCallback(() => {
    const scores: Record<string, CompatibilityScore> = {};

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const profile1 = profiles[i];
        const profile2 = profiles[j];
        
        const score = personalityEngineRef.current.calculateCompatibility(profile1, profile2);
        scores[`${profile1.id}-${profile2.id}`] = score;
      }
    }

    setCompatibilityScores(scores);
    return scores;
  }, [profiles]);

  /**
   * Perform personality analysis
   */
  const analyzePersonalities = useCallback(async (parameters?: {
    calculationType?: string;
    weights?: Record<PersonalityCategory, number>;
    thresholds?: {
      minCompatibility?: number;
      maxConflicts?: number;
      minConfidence?: number;
    };
    filters?: {
      archetypes?: PersonalityArchetype[];
      categories?: PersonalityCategory[];
      traitLevels?: TraitLevel[];
      minTraitValue?: number;
      maxTraitValue?: number;
    };
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const engine = personalityEngineRef.current;
      
      const context: PersonalityCalculationContext = {
        profiles,
        parameters: {
          calculationType: (parameters?.calculationType as any) || 'compatibility_score',
          weights: parameters?.weights || personalityConfig.validation.scoring.weights,
          thresholds: {
            minCompatibility: parameters?.thresholds?.minCompatibility || personalityConfig.validation.thresholds.minCompatibilityScore,
            maxConflicts: parameters?.thresholds?.maxConflicts || personalityConfig.validation.thresholds.maxConflicts,
            minConfidence: parameters?.thresholds?.minConfidence || 0.5,
          },
          includeArchetypes: true,
          includeTraits: true,
          includeAnalytics: true,
        },
        filters: parameters?.filters || {},
        metadata: {
          timestamp: Date.now(),
          calculationId: `analysis-${Date.now()}`,
          version: '1.0.0',
        },
      };

      const result = engine.analyzePersonalities(context);
      
      setCompatibilityScores(result.results.compatibilityScores);
      setInsights(result.insights);
      setRecommendations(result.recommendations);
      setAnalytics(result.analytics);
      setAnalysis({
        id: result.id,
        timestamp: result.timestamp,
        profiles,
        compatibility: result.results.compatibilityScores,
        insights: result.insights,
        recommendations: result.recommendations,
        analytics: result.analytics,
        metadata: result.metadata,
      });
      
      setLastAnalysis(Date.now());

      if (enableTelemetry) {
        console.log('Personality analysis completed:', {
          profiles: profiles.length,
          compatibilityScores: Object.keys(result.results.compatibilityScores).length,
          insights: result.insights.length,
          recommendations: result.recommendations.length,
          processingTime: result.performance.calculationTime,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Personality analysis failed:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [profiles, personalityConfig, enableTelemetry]);

  /**
   * Get profile statistics
   */
  const getProfileStatistics = useCallback(() => {
    const archetypeDistribution: Record<PersonalityArchetype, number> = {} as any;
    const traitDistribution: Record<string, number> = {};
    const categoryDistribution: Record<PersonalityCategory, number> = {} as any;

    profiles.forEach(profile => {
      // Archetype distribution
      archetypeDistribution[profile.archetype] = (archetypeDistribution[profile.archetype] || 0) + 1;

      // Trait distribution
      profile.traits.forEach(trait => {
        traitDistribution[trait.id] = (traitDistribution[trait.id] || 0) + 1;
        categoryDistribution[trait.category] = (categoryDistribution[trait.category] || 0) + 1;
      });
    });

    const compatibilityValues = Object.values(compatibilityScores).map(score => score.overall);
    const averageCompatibility = compatibilityValues.length > 0 
      ? compatibilityValues.reduce((sum, val) => sum + val, 0) / compatibilityValues.length 
      : 0;

    return {
      totalProfiles: profiles.length,
      archetypeDistribution,
      traitDistribution,
      categoryDistribution,
      averageCompatibility,
      totalCompatibilityScores: Object.keys(compatibilityScores).length,
      averageConfidence: profiles.reduce((sum, p) => sum + p.metadata.confidence, 0) / profiles.length,
    };
  }, [profiles, compatibilityScores]);

  /**
   * Get top compatibility pairs
   */
  const getTopCompatibilityPairs = useCallback((limit: number = 10) => {
    return Object.entries(compatibilityScores)
      .sort(([, a], [, b]) => b.overall - a.overall)
      .slice(0, limit)
      .map(([pair, score]) => {
        const [profile1Id, profile2Id] = pair.split('-');
        const profile1 = profiles.find(p => p.id === profile1Id);
        const profile2 = profiles.find(p => p.id === profile2Id);
        
        return {
          profile1,
          profile2,
          score,
          pair,
        };
      })
      .filter(item => item.profile1 && item.profile2);
  }, [compatibilityScores, profiles]);

  /**
   * Get conflict pairs
   */
  const getConflictPairs = useCallback((threshold: number = 0.3) => {
    return Object.entries(compatibilityScores)
      .filter(([, score]) => score.overall < threshold)
      .map(([pair, score]) => {
        const [profile1Id, profile2Id] = pair.split('-');
        const profile1 = profiles.find(p => p.id === profile1Id);
        const profile2 = profiles.find(p => p.id === profile2Id);
        
        return {
          profile1,
          profile2,
          score,
          pair,
        };
      })
      .filter(item => item.profile1 && item.profile2);
  }, [compatibilityScores, profiles]);

  /**
   * Filter profiles
   */
  const filterProfiles = useCallback((filters: {
    archetypes?: PersonalityArchetype[];
    categories?: PersonalityCategory[];
    traitLevels?: TraitLevel[];
    minTraitValue?: number;
    maxTraitValue?: number;
    search?: string;
  }) => {
    return profiles.filter(profile => {
      // Archetype filter
      if (filters.archetypes && !filters.archetypes.includes(profile.archetype)) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!profile.name.toLowerCase().includes(searchLower) &&
            !profile.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Category filter
      if (filters.categories) {
        const hasMatchingCategory = profile.traits.some(trait => 
          filters.categories!.includes(trait.category)
        );
        if (!hasMatchingCategory) {
          return false;
        }
      }

      // Trait level filter
      if (filters.traitLevels) {
        const hasMatchingTrait = profile.traits.some(trait => 
          filters.traitLevels!.includes(trait.level)
        );
        if (!hasMatchingTrait) {
          return false;
        }
      }

      // Trait value filter
      if (filters.minTraitValue !== undefined || filters.maxTraitValue !== undefined) {
        const hasMatchingTrait = profile.traits.some(trait => {
          if (filters.minTraitValue !== undefined && trait.value < filters.minTraitValue) {
            return false;
          }
          if (filters.maxTraitValue !== undefined && trait.value > filters.maxTraitValue) {
            return false;
          }
          return true;
        });
        if (!hasMatchingTrait) {
          return false;
        }
      }

      return true;
    });
  }, [profiles]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: Partial<PersonalityConfig>) => {
    setPersonalityConfig(prev => ({ 
      ...prev, 
      ...updates, 
      metadata: { 
        ...prev.metadata, 
        ...updates.metadata, 
        updatedAt: Date.now() 
      } 
    }));
  }, []);

  /**
   * Export data
   */
  const exportData = useCallback(() => {
    return {
      profiles,
      traits,
      compatibilityScores,
      insights,
      recommendations,
      analytics,
      config: personalityConfig,
      statistics: personalityEngineRef.current.getStatistics(),
    };
  }, [profiles, traits, compatibilityScores, insights, recommendations, analytics, personalityConfig]);

  /**
   * Import data
   */
  const importData = useCallback((data: {
    profiles?: PersonalityProfile[];
    traits?: PersonalityTrait[];
    config?: Partial<PersonalityConfig>;
  }) => {
    if (data.profiles) {
      const validProfiles = data.profiles.filter(validatePersonalityProfile);
      setProfiles(validProfiles);
      validProfiles.forEach(profile => {
        personalityEngineRef.current.addProfile(profile);
      });
    }

    if (data.traits) {
      const validTraits = data.traits.filter(validatePersonalityTrait);
      setTraits(validTraits);
      validTraits.forEach(trait => {
        personalityEngineRef.current.addTrait(trait);
      });
    }

    if (data.config) {
      updateConfig(data.config);
    }

    if (enableTelemetry) {
      console.log('Data imported:', {
        profiles: data.profiles?.length || 0,
        traits: data.traits?.length || 0,
      });
    }
  }, [updateConfig, enableTelemetry]);

  /**
   * Reset all data
   */
  const resetData = useCallback(() => {
    setProfiles([]);
    setTraits(DEFAULT_PERSONALITY_TRAITS);
    setCompatibilityScores({});
    setAnalysis(null);
    setInsights([]);
    setRecommendations([]);
    setAnalytics(null);
    setError(null);
    setLastAnalysis(Date.now());
    personalityEngineRef.current.clearCache();
  }, []);

  /**
   * Get engine statistics
   */
  const getEngineStatistics = useCallback(() => {
    return personalityEngineRef.current.getStatistics();
  }, []);

  // Effects
  useEffect(() => {
    // Auto-analyze when data changes
    if (autoAnalyze && profiles.length > 1) {
      const timeSinceLastAnalysis = Date.now() - lastAnalysis;
      if (timeSinceLastAnalysis >= analysisInterval) {
        analyzePersonalities();
      }
    }
  }, [profiles, autoAnalyze, analysisInterval, lastAnalysis, analyzePersonalities]);

  useEffect(() => {
    // Set up periodic analysis
    if (autoAnalyze && personalityConfig.analytics.dashboard.enabled) {
      analysisIntervalRef.current = setInterval(() => {
        if (profiles.length > 1) {
          analyzePersonalities();
        }
      }, personalityConfig.analytics.dashboard.refreshInterval);
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [autoAnalyze, personalityConfig.analytics.dashboard, profiles.length, analyzePersonalities]);

  // Memoized values
  const profileStatistics = useMemo(() => getProfileStatistics(), [getProfileStatistics]);
  const topCompatibilityPairs = useMemo(() => getTopCompatibilityPairs(), [getTopCompatibilityPairs]);
  const conflictPairs = useMemo(() => getConflictPairs(), [getConflictPairs]);
  const engineStatistics = useMemo(() => getEngineStatistics(), [getEngineStatistics]);

  return {
    // State
    profiles,
    traits,
    compatibilityScores,
    analysis,
    insights,
    recommendations,
    analytics,
    isLoading,
    error,
    lastAnalysis,
    
    // Configuration
    config: personalityConfig,
    
    // Profile methods
    addProfile,
    updateProfile,
    removeProfile,
    updateProfileTrait,
    
    // Trait methods
    addTrait,
    updateTrait,
    removeTrait,
    
    // Analysis methods
    calculateCompatibility,
    calculateAllCompatibilities,
    analyzePersonalities,
    
    // Utility methods
    getProfileStatistics,
    getTopCompatibilityPairs,
    getConflictPairs,
    filterProfiles,
    
    // Configuration methods
    updateConfig,
    
    // Data management
    exportData,
    importData,
    resetData,
    
    // Statistics
    profileStatistics,
    topCompatibilityPairs,
    conflictPairs,
    engineStatistics,
    
    // Options
    options,
  };
}
