/**
 * NP-034 – Idle Village Resident Personality Config
 * 
 * Personality engine for trait management, compatibility checking,
 * and personality analysis.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import {
  PersonalityProfile,
  PersonalityTrait,
  PersonalityArchetype,
  PersonalityCategory,
  TraitLevel,
  CompatibilityScore,
  PersonalityCompatibility,
  PersonalityBadgeConfig,
  PersonalityAnalysisResult,
  PersonalityInsight,
  PersonalityRecommendation,
  PersonalityAnalytics,
  validatePersonalityTrait,
  validatePersonalityProfile,
  validateCompatibilityScore,
  getTraitLevelFromValue,
  getTraitValueFromLevel,
  getTraitColor,
  getArchetypeDescription,
  getCategoryDescription,
  DEFAULT_PERSONALITY_TRAITS,
  DEFAULT_PERSONALITY_COMPATIBILITY,
} from '../types/residentPersonality';

// Personality calculation types
export type PersonalityCalculationType = 
  | 'compatibility_score'
  | 'trait_analysis'
  | 'archetype_detection'
  | 'team_composition'
  | 'conflict_detection'
  | 'synergy_analysis';

// Personality calculation context
export interface PersonalityCalculationContext {
  profiles: PersonalityProfile[];
  parameters: {
    calculationType: PersonalityCalculationType;
    weights: Record<PersonalityCategory, number>;
    thresholds: {
      minCompatibility: number;
      maxConflicts: number;
      minConfidence: number;
    };
    includeArchetypes: boolean;
    includeTraits: boolean;
    includeAnalytics: boolean;
  };
  filters: {
    archetypes?: PersonalityArchetype[];
    categories?: PersonalityCategory[];
    traitLevels?: TraitLevel[];
    minTraitValue?: number;
    maxTraitValue?: number;
  };
  metadata: {
    timestamp: number;
    calculationId: string;
    version: string;
  };
}

// Personality calculation result
export interface PersonalityCalculationResult {
  id: string;
  timestamp: number;
  context: PersonalityCalculationContext;
  results: {
    compatibilityScores: Record<string, CompatibilityScore>;
    traitAnalysis: Record<string, any>;
    archetypeDistribution: Record<PersonalityArchetype, number>;
    teamComposition: {
      optimalTeams: PersonalityArchetype[][];
      problematicCombinations: PersonalityArchetype[][];
      recommendations: string[];
    };
    conflicts: Array<{
      profile1: string;
      profile2: string;
      type: 'trait' | 'archetype' | 'category';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      resolution: string[];
    }>;
    synergies: Array<{
      profile1: string;
      profile2: string;
      type: 'trait' | 'archetype' | 'category';
      strength: number; // 0 to 1
      description: string;
      benefits: string[];
    }>;
  };
  insights: PersonalityInsight[];
  recommendations: PersonalityRecommendation[];
  analytics: PersonalityAnalytics;
  performance: {
    calculationTime: number; // milliseconds
    memoryUsage: number; // bytes
    accuracy: number; // 0 to 1
    completeness: number; // 0 to 1
  };
  metadata: {
    version: string;
    algorithm: string;
    sampleSize: number;
    confidence: number; // 0 to 1
  };
}

// Personality engine class
export class PersonalityEngine {
  private traits: Map<string, PersonalityTrait> = new Map();
  private profiles: Map<string, PersonalityProfile> = new Map();
  private compatibilityMatrix: Map<string, Map<string, CompatibilityScore>> = new Map();
  private cache: Map<string, PersonalityCalculationResult> = new Map();
  private statistics: {
    calculations: number;
    cacheHits: number;
    errors: number;
    averageCalculationTime: number;
  } = {
    calculations: 0,
    cacheHits: 0,
    errors: 0,
    averageCalculationTime: 0,
  };

  constructor() {
    this.initializeDefaultTraits();
  }

  /**
   * Initialize default personality traits
   */
  private initializeDefaultTraits(): void {
    DEFAULT_PERSONALITY_TRAITS.forEach(trait => {
      this.traits.set(trait.id, trait);
    });
  }

  /**
   * Add or update a personality trait
   */
  addTrait(trait: PersonalityTrait): boolean {
    if (!validatePersonalityTrait(trait)) {
      throw new Error('Invalid personality trait');
    }

    this.traits.set(trait.id, trait);
    this.invalidateCache();
    return true;
  }

  /**
   * Remove a personality trait
   */
  removeTrait(traitId: string): boolean {
    const removed = this.traits.delete(traitId);
    if (removed) {
      this.invalidateCache();
    }
    return removed;
  }

  /**
   * Get a personality trait
   */
  getTrait(traitId: string): PersonalityTrait | undefined {
    return this.traits.get(traitId);
  }

  /**
   * Get all personality traits
   */
  getAllTraits(): PersonalityTrait[] {
    return Array.from(this.traits.values());
  }

  /**
   * Get traits by category
   */
  getTraitsByCategory(category: PersonalityCategory): PersonalityTrait[] {
    return Array.from(this.traits.values()).filter(trait => trait.category === category);
  }

  /**
   * Add or update a personality profile
   */
  addProfile(profile: PersonalityProfile): boolean {
    if (!validatePersonalityProfile(profile)) {
      throw new Error('Invalid personality profile');
    }

    this.profiles.set(profile.id, profile);
    this.invalidateCache();
    return true;
  }

  /**
   * Remove a personality profile
   */
  removeProfile(profileId: string): boolean {
    const removed = this.profiles.delete(profileId);
    if (removed) {
      this.invalidateCache();
    }
    return removed;
  }

  /**
   * Get a personality profile
   */
  getProfile(profileId: string): PersonalityProfile | undefined {
    return this.profiles.get(profileId);
  }

  /**
   * Get all personality profiles
   */
  getAllProfiles(): PersonalityProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get profiles by archetype
   */
  getProfilesByArchetype(archetype: PersonalityArchetype): PersonalityProfile[] {
    return Array.from(this.profiles.values()).filter(profile => profile.archetype === archetype);
  }

  /**
   * Calculate compatibility between two profiles
   */
  calculateCompatibility(profile1: PersonalityProfile, profile2: PersonalityProfile): CompatibilityScore {
    const cacheKey = `compatibility-${profile1.id}-${profile2.id}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return cached.results.compatibilityScores[`${profile1.id}-${profile2.id}`] || 
             cached.results.compatibilityScores[`${profile2.id}-${profile1.id}`] ||
             this.createEmptyCompatibilityScore();
    }

    try {
      const score = this.computeCompatibilityScore(profile1, profile2);
      
      // Cache the result
      const pairKey = `${profile1.id}-${profile2.id}`;
      if (!this.compatibilityMatrix.has(profile1.id)) {
        this.compatibilityMatrix.set(profile1.id, new Map());
      }
      this.compatibilityMatrix.get(profile1.id)!.set(profile2.id, score);

      return score;
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      return this.createEmptyCompatibilityScore();
    }
  }

  /**
   * Compute compatibility score between two profiles
   */
  private computeCompatibilityScore(profile1: PersonalityProfile, profile2: PersonalityProfile): CompatibilityScore {
    const categories: PersonalityCategory[] = [
      'social', 'work_ethic', 'creativity', 'adaptability',
      'leadership', 'communication', 'problem_solving', 'emotional_intelligence'
    ];

    const categoryScores: Record<PersonalityCategory, number> = {} as any;
    const traitScores: Record<string, number> = {};
    const conflicts: string[] = [];
    const synergies: string[] = [];
    const recommendations: string[] = [];

    // Calculate category-level compatibility
    categories.forEach(category => {
      const categoryScore = this.calculateCategoryCompatibility(profile1, profile2, category);
      categoryScores[category] = categoryScore;
    });

    // Calculate trait-level compatibility
    profile1.traits.forEach(trait1 => {
      const trait2 = profile2.traits.find(t => t.id === trait1.id);
      if (trait2) {
        const traitScore = this.calculateTraitCompatibility(trait1, trait2);
        traitScores[trait1.id] = traitScore;

        // Detect conflicts and synergies
        if (traitScore < 0.3) {
          conflicts.push(`${trait1.name}: Low compatibility (${traitScore.toFixed(2)})`);
        } else if (traitScore > 0.8) {
          synergies.push(`${trait1.name}: High compatibility (${traitScore.toFixed(2)})`);
        }
      }
    });

    // Calculate archetype compatibility
    const archetypeScore = this.calculateArchetypeCompatibility(profile1.archetype, profile2.archetype);

    // Calculate overall compatibility
    const categoryWeights = profile1.compatibility.categoryWeights;
    const weightedCategoryScore = Object.entries(categoryScores).reduce((sum, [category, score]) => {
      return sum + score * (categoryWeights[category as PersonalityCategory] || 0.125);
    }, 0);

    const overallCompatibility = (weightedCategoryScore * 0.7) + (archetypeScore * 0.3);

    // Generate recommendations
    if (overallCompatibility < 0.4) {
      recommendations.push('Consider reassigning to different teams or roles');
      recommendations.push('Focus on improving communication and understanding');
    } else if (overallCompatibility > 0.8) {
      recommendations.push('Excellent team composition - maintain current arrangement');
      recommendations.push('Consider pairing for complex tasks requiring synergy');
    }

    // Detect team dynamics issues
    const teamDynamics = this.analyzeTeamDynamics(profile1, profile2);
    if (teamDynamics.leadership < 0.5) {
      recommendations.push('May benefit from clear leadership structure');
    }
    if (teamDynamics.collaboration < 0.5) {
      recommendations.push('Focus on improving collaboration skills');
    }

    return {
      overall: overallCompatibility,
      categories: categoryScores,
      traits: traitScores,
      conflicts,
      synergies,
      recommendations,
      confidence: this.calculateCompatibilityConfidence(profile1, profile2),
    };
  }

  /**
   * Calculate category-level compatibility
   */
  private calculateCategoryCompatibility(profile1: PersonalityProfile, profile2: PersonalityProfile, category: PersonalityCategory): number {
    const categoryTraits1 = profile1.traits.filter(t => t.category === category);
    const categoryTraits2 = profile2.traits.filter(t => t.category === category);

    if (categoryTraits1.length === 0 || categoryTraits2.length === 0) {
      return 0.5; // Neutral score if no traits in category
    }

    let totalScore = 0;
    let count = 0;

    categoryTraits1.forEach(trait1 => {
      const trait2 = categoryTraits2.find(t => t.id === trait1.id);
      if (trait2) {
        const traitScore = this.calculateTraitCompatibility(trait1, trait2);
        totalScore += traitScore;
        count++;
      }
    });

    return count > 0 ? totalScore / count : 0.5;
  }

  /**
   * Calculate trait-level compatibility
   */
  private calculateTraitCompatibility(trait1: PersonalityTrait, trait2: PersonalityTrait): number {
    const value1 = trait1.value;
    const value2 = trait2.value;
    
    // Calculate absolute difference
    const difference = Math.abs(value1 - value2);
    
    // Convert to compatibility score (0 to 1)
    // Lower difference = higher compatibility
    const maxDifference = 4; // -2 to 2 scale
    const compatibility = 1 - (difference / maxDifference);
    
    // Apply trait weight
    const weightedCompatibility = compatibility * ((trait1.weight + trait2.weight) / 2);
    
    return Math.max(0, Math.min(1, weightedCompatibility));
  }

  /**
   * Calculate archetype compatibility
   */
  private calculateArchetypeCompatibility(archetype1: PersonalityArchetype, archetype2: PersonalityArchetype): number {
    const compatibilityMatrix = DEFAULT_PERSONALITY_COMPATIBILITY.compatibilityMatrix;
    
    // Get base compatibility
    const baseCompatibility = compatibilityMatrix[archetype1] || 0.5;
    
    // Check for preferred/avoided archetypes
    const isPreferred = DEFAULT_PERSONALITY_COMPATIBILITY.preferredArchetypes.includes(archetype2);
    const isAvoided = DEFAULT_PERSONALITY_COMPATIBILITY.avoidedArchetypes.includes(archetype2);
    
    // Adjust based on preferences
    let adjustedCompatibility = baseCompatibility;
    if (isPreferred) {
      adjustedCompatibility += 0.2;
    }
    if (isAvoided) {
      adjustedCompatibility -= 0.3;
    }
    
    return Math.max(0, Math.min(1, adjustedCompatibility));
  }

  /**
   * Analyze team dynamics between two profiles
   */
  private analyzeTeamDynamics(profile1: PersonalityProfile, profile2: PersonalityProfile): {
    leadership: number;
    collaboration: number;
    innovation: number;
    stability: number;
  } {
    const leadershipTraits = ['leadership_authority', 'leadership_decision_making'];
    const collaborationTraits = ['social_cooperation', 'social_communication'];
    const innovationTraits = ['creativity_innovation', 'creativity_problem_solving'];
    const stabilityTraits = ['work_diligence', 'work_reliability', 'adaptability_resilience'];

    const calculateAverage = (traitIds: string[]) => {
      const values1 = traitIds.map(id => {
        const trait = profile1.traits.find(t => t.id === id);
        return trait ? (trait.value + 2) / 4 : 0.5; // Normalize to 0-1
      });
      const values2 = traitIds.map(id => {
        const trait = profile2.traits.find(t => t.id === id);
        return trait ? (trait.value + 2) / 4 : 0.5; // Normalize to 0-1
      });
      
      const allValues = [...values1, ...values2];
      return allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    };

    return {
      leadership: calculateAverage(leadershipTraits),
      collaboration: calculateAverage(collaborationTraits),
      innovation: calculateAverage(innovationTraits),
      stability: calculateAverage(stabilityTraits),
    };
  }

  /**
   * Calculate compatibility confidence
   */
  private calculateCompatibilityConfidence(profile1: PersonalityProfile, profile2: PersonalityProfile): number {
    // Base confidence from metadata
    const baseConfidence = (profile1.metadata.confidence + profile2.metadata.confidence) / 2;
    
    // Adjust based on number of traits
    const traitCount = Math.min(profile1.traits.length, profile2.traits.length);
    const traitConfidence = Math.min(traitCount / 10, 1); // Normalize to max 10 traits
    
    // Adjust based on validation scores
    const validationScore = (profile1.metadata.validation.score + profile2.metadata.validation.score) / 2;
    
    return (baseConfidence * 0.4) + (traitConfidence * 0.3) + (validationScore * 0.3);
  }

  /**
   * Create empty compatibility score
   */
  private createEmptyCompatibilityScore(): CompatibilityScore {
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
    };
  }

  /**
   * Perform comprehensive personality analysis
   */
  analyzePersonalities(context: PersonalityCalculationContext): PersonalityCalculationResult {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(context);

    // Check cache
    if (this.cache.has(cacheKey)) {
      this.statistics.cacheHits++;
      const cached = this.cache.get(cacheKey)!;
      return {
        ...cached,
        performance: {
          ...cached.performance,
          calculationTime: performance.now() - startTime,
        },
      };
    }

    try {
      // Filter profiles based on context
      const filteredProfiles = this.filterProfiles(context.profiles, context.filters);

      // Calculate compatibility scores
      const compatibilityScores: Record<string, CompatibilityScore> = {};
      const conflicts: any[] = [];
      const synergies: any[] = [];

      for (let i = 0; i < filteredProfiles.length; i++) {
        for (let j = i + 1; j < filteredProfiles.length; j++) {
          const profile1 = filteredProfiles[i];
          const profile2 = filteredProfiles[j];
          
          const score = this.calculateCompatibility(profile1, profile2);
          const pairKey = `${profile1.id}-${profile2.id}`;
          compatibilityScores[pairKey] = score;

          // Extract conflicts and synergies
          score.conflicts.forEach(conflict => {
            conflicts.push({
              profile1: profile1.id,
              profile2: profile2.id,
              type: 'trait' as const,
              severity: this.getConflictSeverity(conflict),
              description: conflict,
              resolution: this.generateConflictResolution(conflict),
            });
          });

          score.synergies.forEach(synergy => {
            synergies.push({
              profile1: profile1.id,
              profile2: profile2.id,
              type: 'trait' as const,
              strength: this.getSynergyStrength(synergy),
              description: synergy,
              benefits: this.generateSynergyBenefits(synergy),
            });
          });
        }
      }

      // Analyze archetype distribution
      const archetypeDistribution = this.analyzeArchetypeDistribution(filteredProfiles);

      // Analyze team composition
      const teamComposition = this.analyzeTeamComposition(filteredProfiles);

      // Generate insights
      const insights = this.generateInsights(filteredProfiles, compatibilityScores, conflicts, synergies);

      // Generate recommendations
      const recommendations = this.generateRecommendations(filteredProfiles, compatibilityScores, conflicts, synergies);

      // Generate analytics
      const analytics = this.generateAnalytics(filteredProfiles, compatibilityScores);

      // Create result
      const result: PersonalityCalculationResult = {
        id: context.metadata.calculationId,
        timestamp: context.metadata.timestamp,
        context,
        results: {
          compatibilityScores,
          traitAnalysis: this.analyzeTraits(filteredProfiles),
          archetypeDistribution,
          teamComposition,
          conflicts,
          synergies,
        },
        insights,
        recommendations,
        analytics,
        performance: {
          calculationTime: performance.now() - startTime,
          memoryUsage: this.estimateMemoryUsage(filteredProfiles),
          accuracy: this.calculateAccuracy(compatibilityScores),
          completeness: this.calculateCompleteness(filteredProfiles, context),
        },
        metadata: {
          version: context.metadata.version,
          algorithm: 'personality-analysis-engine',
          sampleSize: filteredProfiles.length,
          confidence: this.calculateOverallConfidence(filteredProfiles),
        },
      };

      this.cache.set(cacheKey, result);
      this.updateStatistics(startTime);
      
      return result;
    } catch (error) {
      this.statistics.errors++;
      throw error;
    }
  }

  /**
   * Filter profiles based on context
   */
  private filterProfiles(profiles: PersonalityProfile[], filters: PersonalityCalculationContext['filters']): PersonalityProfile[] {
    return profiles.filter(profile => {
      // Archetype filter
      if (filters.archetypes && !filters.archetypes.includes(profile.archetype)) {
        return false;
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
  }

  /**
   * Analyze archetype distribution
   */
  private analyzeArchetypeDistribution(profiles: PersonalityProfile[]): Record<PersonalityArchetype, number> {
    const distribution: Record<PersonalityArchetype, number> = {} as any;
    
    profiles.forEach(profile => {
      distribution[profile.archetype] = (distribution[profile.archetype] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Analyze team composition
   */
  private analyzeTeamComposition(profiles: PersonalityProfile[]): {
    optimalTeams: PersonalityArchetype[][];
    problematicCombinations: PersonalityArchetype[][];
    recommendations: string[];
  } {
    const archetypes = profiles.map(p => p.archetype);
    const uniqueArchetypes = Array.from(new Set(archetypes));

    // Generate optimal team combinations
    const optimalTeams: PersonalityArchetype[][] = [];
    
    // Look for balanced teams with diverse archetypes
    if (uniqueArchetypes.length >= 3) {
      for (let i = 0; i < uniqueArchetypes.length - 2; i++) {
        for (let j = i + 1; j < uniqueArchetypes.length - 1; j++) {
          for (let k = j + 1; k < uniqueArchetypes.length; k++) {
            const team = [uniqueArchetypes[i], uniqueArchetypes[j], uniqueArchetypes[k]];
            if (this.isBalancedTeam(team)) {
              optimalTeams.push(team);
            }
          }
        }
      }
    }

    // Identify problematic combinations
    const problematicCombinations: PersonalityArchetype[][] = [];
    
    // Check for rebel + perfectionist conflicts
    if (uniqueArchetypes.includes('rebel') && uniqueArchetypes.includes('perfectionist')) {
      problematicCombinations.push(['rebel', 'perfectionist']);
    }

    // Check for multiple leaders without mediators
    const leaderCount = archetypes.filter(a => a === 'leader').length;
    const mediatorCount = archetypes.filter(a => a === 'mediator').length;
    if (leaderCount > 1 && mediatorCount === 0) {
      problematicCombinations.push(['leader', 'leader']);
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (optimalTeams.length === 0) {
      recommendations.push('Consider adding more diverse archetypes to create balanced teams');
    }

    if (problematicCombinations.length > 0) {
      recommendations.push('Address problematic archetype combinations through role reassignment');
    }

    if (leaderCount === 0) {
      recommendations.push('Consider adding a leader archetype for better team coordination');
    }

    return {
      optimalTeams,
      problematicCombinations,
      recommendations,
    };
  }

  /**
   * Check if a team composition is balanced
   */
  private isBalancedTeam(archetypes: PersonalityArchetype[]): boolean {
    // Check for essential roles
    const hasLeader = archetypes.includes('leader');
    const hasTeamPlayer = archetypes.includes('team_player');
    const hasInnovator = archetypes.includes('innovator');

    // Basic balance check
    return hasLeader && hasTeamPlayer && hasInnovator;
  }

  /**
   * Analyze traits
   */
  private analyzeTraits(profiles: PersonalityProfile[]): Record<string, any> {
    const traitAnalysis: Record<string, any> = {};

    profiles.forEach(profile => {
      profile.traits.forEach(trait => {
        if (!traitAnalysis[trait.id]) {
          traitAnalysis[trait.id] = {
            name: trait.name,
            category: trait.category,
            values: [],
            average: 0,
            distribution: {
              very_low: 0,
              low: 0,
              moderate: 0,
              high: 0,
              very_high: 0,
            },
          };
        }

        traitAnalysis[trait.id].values.push(trait.value);
        traitAnalysis[trait.id].distribution[trait.level]++;
      });
    });

    // Calculate averages
    Object.values(traitAnalysis).forEach((analysis: any) => {
      const sum = analysis.values.reduce((acc: number, val: number) => acc + val, 0);
      analysis.average = sum / analysis.values.length;
    });

    return traitAnalysis;
  }

  /**
   * Generate insights
   */
  private generateInsights(
    profiles: PersonalityProfile[],
    compatibilityScores: Record<string, CompatibilityScore>,
    conflicts: any[],
    synergies: any[]
  ): PersonalityInsight[] {
    const insights: PersonalityInsight[] = [];

    // High compatibility insights
    const highCompatibilityPairs = Object.entries(compatibilityScores)
      .filter(([_, score]) => score.overall > 0.8)
      .map(([pair, score]) => ({ pair, score }));

    if (highCompatibilityPairs.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        type: 'compatibility_gap',
        title: 'High Compatibility Teams',
        description: `Found ${highCompatibilityPairs.length} highly compatible team combinations`,
        severity: 'low',
        confidence: 0.9,
        data: { pairs: highCompatibilityPairs },
        recommendations: ['Maintain these team compositions', 'Use these pairs for complex tasks'],
        metadata: {
          timestamp: Date.now(),
          source: 'personality-engine',
          tags: ['compatibility', 'teams'],
        },
      });
    }

    // Conflict insights
    if (conflicts.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-2`,
        type: 'trait_pattern',
        title: 'Team Conflicts Detected',
        description: `Found ${conflicts.length} potential conflicts in team composition`,
        severity: conflicts.some(c => c.severity === 'critical') ? 'critical' : 'medium',
        confidence: 0.8,
        data: { conflicts },
        recommendations: ['Address conflicts through team restructuring', 'Consider mediation or training'],
        metadata: {
          timestamp: Date.now(),
          source: 'personality-engine',
          tags: ['conflicts', 'teams'],
        },
      });
    }

    // Archetype imbalance insights
    const archetypeDistribution = this.analyzeArchetypeDistribution(profiles);
    const dominantArchetype = Object.entries(archetypeDistribution)
      .sort(([,a], [,b]) => b - a)[0];

    if (dominantArchetype && dominantArchetype[1] > profiles.length * 0.5) {
      insights.push({
        id: `insight-${Date.now()}-3`,
        type: 'archetype_cluster',
        title: 'Archetype Imbalance',
        description: `High concentration of ${dominantArchetype[0]} archetype (${dominantArchetype[1]} profiles)`,
        severity: 'medium',
        confidence: 0.7,
        data: { distribution: archetypeDistribution, dominant: dominantArchetype },
        recommendations: ['Consider diversifying team composition', 'Balance archetype distribution'],
        metadata: {
          timestamp: Date.now(),
          source: 'personality-engine',
          tags: ['archetypes', 'balance'],
        },
      });
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    profiles: PersonalityProfile[],
    compatibilityScores: Record<string, CompatibilityScore>,
    conflicts: any[],
    synergies: any[]
  ): PersonalityRecommendation[] {
    const recommendations: PersonalityRecommendation[] = [];

    // Team composition recommendations
    const teamComposition = this.analyzeTeamComposition(profiles);
    
    teamComposition.recommendations.forEach((rec, index) => {
      recommendations.push({
        id: `recommendation-${Date.now()}-${index}`,
        type: 'team_composition',
        title: 'Team Composition Improvement',
        description: rec,
        priority: 'medium',
        impact: 0.7,
        feasibility: 0.8,
        actions: [{
          type: 'reassign_team',
          target: 'team',
          parameters: { recommendation: rec },
          expectedOutcome: 'Improved team dynamics and performance',
          effort: 'medium',
          risk: 'low',
        }],
        metadata: {
          timestamp: Date.now(),
          source: 'personality-engine',
          tags: ['team', 'composition'],
        },
      });
    });

    // Conflict resolution recommendations
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
    
    criticalConflicts.forEach((conflict, index) => {
      recommendations.push({
        id: `recommendation-${Date.now()}-${index + 100}`,
        type: 'compatibility_improvement',
        title: 'Critical Conflict Resolution',
        description: `Resolve conflict between ${conflict.profile1} and ${conflict.profile2}`,
        priority: 'high',
        impact: 0.9,
        feasibility: 0.6,
        actions: [{
          type: 'reassign_team',
          target: conflict.profile1,
          parameters: { newTeam: 'different_team' },
          expectedOutcome: 'Reduced team conflicts',
          effort: 'high',
          risk: 'medium',
        }],
        metadata: {
          timestamp: Date.now(),
          source: 'personality-engine',
          tags: ['conflict', 'resolution'],
        },
      });
    });

    return recommendations;
  }

  /**
   * Generate analytics
   */
  private generateAnalytics(
    profiles: PersonalityProfile[],
    compatibilityScores: Record<string, CompatibilityScore>
  ): PersonalityAnalytics {
    const archetypeDistribution = this.analyzeArchetypeDistribution(profiles);
    const traitAnalysis = this.analyzeTraits(profiles);

    // Calculate average compatibility
    const compatibilityValues = Object.values(compatibilityScores).map(score => score.overall);
    const averageCompatibility = compatibilityValues.length > 0 
      ? compatibilityValues.reduce((sum, val) => sum + val, 0) / compatibilityValues.length 
      : 0;

    return {
      overview: {
        totalProfiles: profiles.length,
        averageCompatibility,
        traitDistribution: Object.keys(traitAnalysis).length,
        archetypeDistribution,
      },
      trends: {
        compatibilityTrends: [], // Would need historical data
        traitTrends: {}, // Would need historical data
        archetypeTrends: {}, // Would need historical data
      },
      performance: {
        teamSuccessRates: {}, // Would need performance data
        individualPerformance: {}, // Would need performance data
        compatibilityVsPerformance: [], // Would need performance data
      },
      insights: {
        topPerformingTraits: [], // Would need performance data
        problematicCombinations: [], // Would need conflict data
        optimalTeamCompositions: this.analyzeTeamComposition(profiles).optimalTeams.map(archetypes => ({
          archetypes,
          successRate: 0.8, // Placeholder
        })),
      },
    };
  }

  /**
   * Get conflict severity
   */
  private getConflictSeverity(conflict: string): 'low' | 'medium' | 'high' | 'critical' {
    if (conflict.includes('very_low') || conflict.includes('critical_failure')) {
      return 'critical';
    }
    if (conflict.includes('low') || conflict.includes('failure')) {
      return 'high';
    }
    if (conflict.includes('moderate')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate conflict resolution
   */
  private generateConflictResolution(conflict: string): string[] {
    if (conflict.includes('communication')) {
      return ['Improve communication channels', 'Add regular team meetings', 'Provide communication training'];
    }
    if (conflict.includes('leadership')) {
      return ['Clarify leadership roles', 'Add leadership training', 'Consider role reassignment'];
    }
    if (conflict.includes('creativity')) {
      return ['Balance creative approaches', 'Provide innovation workshops', 'Encourage diverse perspectives'];
    }
    return ['Mediate conflict resolution', 'Provide team building activities', 'Consider team restructuring'];
  }

  /**
   * Get synergy strength
   */
  private getSynergyStrength(synergy: string): number {
    if (synergy.includes('very_high')) return 0.9;
    if (synergy.includes('high')) return 0.8;
    if (synergy.includes('moderate')) return 0.6;
    if (synergy.includes('low')) return 0.4;
    return 0.5;
  }

  /**
   * Generate synergy benefits
   */
  private generateSynergyBenefits(synergy: string): string[] {
    if (synergy.includes('leadership')) {
      return ['Strong team coordination', 'Clear decision making', 'Effective motivation'];
    }
    if (synergy.includes('creativity')) {
      return ['Innovative solutions', 'Creative problem solving', 'Out-of-the-box thinking'];
    }
    if (synergy.includes('communication')) {
      return ['Clear information flow', 'Effective collaboration', 'Reduced misunderstandings'];
    }
    return ['Improved team performance', 'Enhanced productivity', 'Better outcomes'];
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(profiles: PersonalityProfile[]): number {
    return profiles.length * 2048; // Rough estimate: 2KB per profile
  }

  /**
   * Calculate accuracy
   */
  private calculateAccuracy(compatibilityScores: Record<string, CompatibilityScore>): number {
    const scores = Object.values(compatibilityScores);
    if (scores.length === 0) return 0.5;
    
    const confidenceSum = scores.reduce((sum, score) => sum + score.confidence, 0);
    return confidenceSum / scores.length;
  }

  /**
   * Calculate completeness
   */
  private calculateCompleteness(profiles: PersonalityProfile[], context: PersonalityCalculationContext): number {
    const expectedTraits = this.traits.size;
    const actualTraits = profiles.reduce((sum, profile) => sum + profile.traits.length, 0);
    const expectedTotalTraits = profiles.length * expectedTraits;
    
    return Math.min(actualTraits / expectedTotalTraits, 1);
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(profiles: PersonalityProfile[]): number {
    if (profiles.length === 0) return 0.5;
    
    const confidenceSum = profiles.reduce((sum, profile) => sum + profile.metadata.confidence, 0);
    return confidenceSum / profiles.length;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(context: PersonalityCalculationContext): string {
    const key = [
      context.metadata.calculationId,
      context.parameters.calculationType,
      JSON.stringify(context.filters),
      context.profiles.map(p => p.id).sort().join(','),
    ].join('|');
    
    return btoa(key);
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    this.cache.clear();
    this.compatibilityMatrix.clear();
  }

  /**
   * Update statistics
   */
  private updateStatistics(startTime: number): void {
    const calculationTime = performance.now() - startTime;
    
    this.statistics.calculations++;
    this.statistics.averageCalculationTime = 
      (this.statistics.averageCalculationTime * (this.statistics.calculations - 1) + calculationTime) / 
      this.statistics.calculations;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      cacheSize: this.cache.size,
      traitCount: this.traits.size,
      profileCount: this.profiles.size,
      cacheHitRate: this.statistics.calculations > 0 ? this.statistics.cacheHits / this.statistics.calculations : 0,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.compatibilityMatrix.clear();
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = {
      calculations: 0,
      cacheHits: 0,
      errors: 0,
      averageCalculationTime: 0,
    };
  }

  /**
   * Export data
   */
  exportData(): {
    traits: PersonalityTrait[];
    profiles: PersonalityProfile[];
    statistics: any;
  } {
    return {
      traits: this.getAllTraits(),
      profiles: this.getAllProfiles(),
      statistics: this.getStatistics(),
    };
  }

  /**
   * Import data
   */
  importData(data: {
    traits?: PersonalityTrait[];
    profiles?: PersonalityProfile[];
  }): void {
    if (data.traits) {
      data.traits.forEach(trait => {
        if (validatePersonalityTrait(trait)) {
          this.traits.set(trait.id, trait);
        }
      });
    }

    if (data.profiles) {
      data.profiles.forEach(profile => {
        if (validatePersonalityProfile(profile)) {
          this.profiles.set(profile.id, profile);
        }
      });
    }

    this.invalidateCache();
  }
}

// Default personality engine instance
export const defaultPersonalityEngine = new PersonalityEngine();

// Utility functions
export function createPersonalityEngine(): PersonalityEngine {
  return new PersonalityEngine();
}

export function getPersonalityEngine(): PersonalityEngine {
  return defaultPersonalityEngine;
}
