/**
 * STS Relic Synergy Analyzer
 * Graph-based analyzer for identifying relic synergies and optimal combinations
 * 
 * @see NP-128 – STS: Relic Synergy Analyzer
 */

import {
  DEFAULT_RELIC_SYNERGY_CONFIG,
  type RelicSynergyConfig,
  type RelicDefinition,
  type SynergyRule,
  type SynergyResult,
  type RelicCombination,
  type SynergyType,
  type RelicTag,
  getRelicById,
  getSynergyRule,
  areRelicsExclusive,
  calculateTagOverlap,
  getRarityWeight,
} from '../../../balancing/config/sts/relicSynergyConfig';

// Synergy graph node
interface SynergyNode {
  relicId: string;
  relic: RelicDefinition;
  connections: Map<string, SynergyEdge>;
  totalScore: number;
}

// Synergy graph edge
interface SynergyEdge {
  targetRelicId: string;
  synergyScore: number;
  powerMultiplier: number;
  synergyType: SynergyType;
  rule?: SynergyRule;
}

// Analysis result
export interface AnalysisResult {
  timestamp: number;
  relics: string[];
  synergies: SynergyResult[];
  topCombinations: RelicCombination[];
  totalScore: number;
  averageMultiplier: number;
  recommendations: string[];
}

/**
 * Relic Synergy Analyzer
 * 
 * Analyzes relic combinations using graph-based synergy detection:
 * - Builds synergy graph from config rules
 * - Calculates pairwise synergy scores
 * - Generates optimal combinations
 * - Provides recommendations
 */
export class RelicSynergyAnalyzer {
  private config: RelicSynergyConfig;
  private synergyGraph: Map<string, SynergyNode>;
  private telemetryEnabled: boolean;

  constructor(config: RelicSynergyConfig = DEFAULT_RELIC_SYNERGY_CONFIG) {
    this.config = config;
    this.synergyGraph = new Map();
    this.telemetryEnabled = config.telemetry.enabled;
    this.buildSynergyGraph();
  }

  /**
   * Build synergy graph from configuration
   */
  private buildSynergyGraph(): void {
    // Create nodes for all relics
    for (const [relicId, relic] of Object.entries(this.config.relics)) {
      this.synergyGraph.set(relicId, {
        relicId,
        relic,
        connections: new Map(),
        totalScore: 0,
      });
    }

    // Create edges from synergy rules
    for (const rule of this.config.synergyRules) {
      const nodeA = this.synergyGraph.get(rule.relicA);
      const nodeB = this.synergyGraph.get(rule.relicB);

      if (!nodeA || !nodeB) continue;

      // Add bidirectional edges
      const edgeAB: SynergyEdge = {
        targetRelicId: rule.relicB,
        synergyScore: this.calculateRuleScore(rule),
        powerMultiplier: rule.powerMultiplier,
        synergyType: rule.type,
        rule,
      };

      const edgeBA: SynergyEdge = {
        targetRelicId: rule.relicA,
        synergyScore: this.calculateRuleScore(rule),
        powerMultiplier: rule.powerMultiplier,
        synergyType: rule.type,
        rule,
      };

      nodeA.connections.set(rule.relicB, edgeAB);
      nodeB.connections.set(rule.relicA, edgeBA);
    }
  }

  /**
   * Calculate score for a synergy rule
   */
  private calculateRuleScore(rule: SynergyRule): number {
    const { scoring } = this.config;
    let score = scoring.baseScore;

    switch (rule.type) {
      case 'multiplicative':
        score += scoring.multiplicativeBonus;
        break;
      case 'additive':
        score += scoring.additiveBonus;
        break;
      case 'conditional':
        score += scoring.conditionalBonus;
        break;
      case 'combo':
        score += scoring.comboBonus;
        break;
      case 'anti_synergy':
        score += scoring.antiSynergyPenalty;
        break;
    }

    // Apply priority weight
    score *= (rule.priority / 10);

    return score;
  }

  /**
   * Analyze synergies between two relics
   */
  analyzePair(relicAId: string, relicBId: string): SynergyResult | null {
    const relicA = getRelicById(this.config, relicAId);
    const relicB = getRelicById(this.config, relicBId);

    if (!relicA || !relicB) return null;

    // Check for exclusivity
    if (areRelicsExclusive(this.config, relicAId, relicBId)) {
      return {
        relicA: relicAId,
        relicB: relicBId,
        synergyScore: this.config.scoring.antiSynergyPenalty,
        powerMultiplier: 0.0,
        synergyType: 'anti_synergy',
        explanation: 'These relics are mutually exclusive',
        tags: [],
        conditions: [],
      };
    }

    // Check for explicit synergy rule
    const rule = getSynergyRule(this.config, relicAId, relicBId);
    if (rule) {
      return {
        relicA: relicAId,
        relicB: relicBId,
        synergyScore: this.calculateRuleScore(rule),
        powerMultiplier: rule.powerMultiplier,
        synergyType: rule.type,
        explanation: rule.description,
        tags: rule.tags as RelicTag[],
        conditions: rule.conditions,
      };
    }

    // Calculate implicit synergy from tag overlap
    const tagOverlap = calculateTagOverlap(relicA, relicB);
    if (tagOverlap > 0) {
      const score = this.config.scoring.baseScore + (tagOverlap * this.config.scoring.tagMatchBonus);
      const multiplier = 1.0 + (tagOverlap * 0.5);

      return {
        relicA: relicAId,
        relicB: relicBId,
        synergyScore: score,
        powerMultiplier: multiplier,
        synergyType: 'additive',
        explanation: `Shared tags: ${[...new Set([...relicA.tags, ...relicB.tags].filter(tag => relicA.tags.includes(tag) && relicB.tags.includes(tag)))].join(', ')}`,
        tags: [...new Set([...relicA.tags, ...relicB.tags])] as RelicTag[],
        conditions: [],
      };
    }

    // No synergy found
    return {
      relicA: relicAId,
      relicB: relicBId,
      synergyScore: this.config.scoring.baseScore,
      powerMultiplier: 1.0,
      synergyType: 'additive',
      explanation: 'No significant synergy',
      tags: [],
      conditions: [],
    };
  }

  /**
   * Analyze a collection of relics
   */
  analyzeCollection(relicIds: string[]): AnalysisResult {
    const timestamp = Date.now();
    const synergies: SynergyResult[] = [];
    let totalScore = 0;
    let totalMultiplier = 0;
    let pairCount = 0;

    // Analyze all pairs
    for (let i = 0; i < relicIds.length; i++) {
      for (let j = i + 1; j < relicIds.length; j++) {
        const synergy = this.analyzePair(relicIds[i], relicIds[j]);
        if (synergy) {
          synergies.push(synergy);
          totalScore += synergy.synergyScore;
          totalMultiplier += synergy.powerMultiplier;
          pairCount++;
        }
      }
    }

    const averageMultiplier = pairCount > 0 ? totalMultiplier / pairCount : 1.0;

    // Generate top combinations
    const topCombinations = this.generateTopCombinations(relicIds, synergies);

    // Generate recommendations
    const recommendations = this.generateRecommendations(relicIds, synergies);

    // Emit telemetry
    if (this.telemetryEnabled && this.config.telemetry.trackAnalysis) {
      this.emitTelemetry('relic_synergy_analyzed', {
        relicCount: relicIds.length,
        synergyCount: synergies.length,
        totalScore,
        averageMultiplier,
      });
    }

    return {
      timestamp,
      relics: relicIds,
      synergies,
      topCombinations,
      totalScore,
      averageMultiplier,
      recommendations,
    };
  }

  /**
   * Generate top relic combinations
   */
  generateTopCombinations(
    availableRelics: string[],
    existingSynergies: SynergyResult[]
  ): RelicCombination[] {
    const combinations: RelicCombination[] = [];
    const maxSize = Math.min(this.config.analysis.maxCombinationSize, availableRelics.length);

    // Generate combinations of different sizes
    for (let size = 2; size <= maxSize; size++) {
      const combos = this.generateCombinations(availableRelics, size);
      
      for (const combo of combos) {
        // Check if combination is valid (no exclusive relics)
        if (!this.isValidCombination(combo)) continue;

        // Calculate combination score
        const comboSynergies = this.getSynergiesForCombination(combo, existingSynergies);
        const totalScore = comboSynergies.reduce((sum, s) => sum + s.synergyScore, 0);
        const averageMultiplier = comboSynergies.length > 0
          ? comboSynergies.reduce((sum, s) => sum + s.powerMultiplier, 0) / comboSynergies.length
          : 1.0;

        // Skip low-scoring combinations
        if (totalScore < this.config.analysis.minSynergyScore) continue;

        // Collect tags
        const tags = new Set<RelicTag>();
        for (const relicId of combo) {
          const relic = getRelicById(this.config, relicId);
          if (relic) {
            relic.tags.forEach(tag => tags.add(tag));
          }
        }

        // Generate strengths and weaknesses
        const strengths = this.identifyStrengths(combo, comboSynergies);
        const weaknesses = this.identifyWeaknesses(combo, comboSynergies);
        const recommendedFor = this.identifyRecommendations(combo, Array.from(tags));

        combinations.push({
          relics: combo,
          totalScore,
          averageMultiplier,
          synergies: comboSynergies,
          tags: Array.from(tags),
          strengths,
          weaknesses,
          recommendedFor,
        });
      }
    }

    // Sort by total score and return top combinations
    return combinations
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
  }

  /**
   * Generate all combinations of size k from array
   */
  private generateCombinations(arr: string[], k: number): string[][] {
    const result: string[][] = [];
    
    const combine = (start: number, combo: string[]) => {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        combine(i + 1, combo);
        combo.pop();
      }
    };
    
    combine(0, []);
    return result;
  }

  /**
   * Check if combination is valid (no exclusive relics)
   */
  private isValidCombination(relicIds: string[]): boolean {
    for (let i = 0; i < relicIds.length; i++) {
      for (let j = i + 1; j < relicIds.length; j++) {
        if (areRelicsExclusive(this.config, relicIds[i], relicIds[j])) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Get synergies for a specific combination
   */
  private getSynergiesForCombination(
    relicIds: string[],
    allSynergies: SynergyResult[]
  ): SynergyResult[] {
    const comboSet = new Set(relicIds);
    return allSynergies.filter(
      s => comboSet.has(s.relicA) && comboSet.has(s.relicB)
    );
  }

  /**
   * Identify strengths of a combination
   */
  private identifyStrengths(relicIds: string[], synergies: SynergyResult[]): string[] {
    const strengths: string[] = [];
    
    // High synergy count
    if (synergies.length >= relicIds.length) {
      strengths.push('High synergy density');
    }

    // Strong multipliers
    const avgMultiplier = synergies.reduce((sum, s) => sum + s.powerMultiplier, 0) / synergies.length;
    if (avgMultiplier > 2.0) {
      strengths.push('Powerful multiplicative synergies');
    }

    // Tag concentration
    const tagCounts = new Map<RelicTag, number>();
    for (const relicId of relicIds) {
      const relic = getRelicById(this.config, relicId);
      if (relic) {
        relic.tags.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
      }
    }

    for (const [tag, count] of tagCounts) {
      if (count >= 3) {
        strengths.push(`Strong ${tag} focus`);
      }
    }

    return strengths;
  }

  /**
   * Identify weaknesses of a combination
   */
  private identifyWeaknesses(relicIds: string[], synergies: SynergyResult[]): string[] {
    const weaknesses: string[] = [];

    // Anti-synergies
    const antiSynergies = synergies.filter(s => s.synergyType === 'anti_synergy');
    if (antiSynergies.length > 0) {
      weaknesses.push(`${antiSynergies.length} anti-synergies present`);
    }

    // Low synergy count
    if (synergies.length < relicIds.length / 2) {
      weaknesses.push('Low synergy density');
    }

    // Rarity imbalance
    const rarities = relicIds.map(id => getRelicById(this.config, id)?.rarity).filter(Boolean);
    const bossRelics = rarities.filter(r => r === 'boss').length;
    if (bossRelics > this.config.limits.maxBossRelics) {
      weaknesses.push(`Too many boss relics (${bossRelics}/${this.config.limits.maxBossRelics})`);
    }

    return weaknesses;
  }

  /**
   * Identify what this combination is recommended for
   */
  private identifyRecommendations(relicIds: string[], tags: RelicTag[]): string[] {
    const recommendations: string[] = [];

    if (tags.includes('damage') && tags.includes('scaling')) {
      recommendations.push('Long fights and boss encounters');
    }

    if (tags.includes('block') && tags.includes('defense')) {
      recommendations.push('Defensive playstyles');
    }

    if (tags.includes('draw') && tags.includes('energy')) {
      recommendations.push('Card-heavy strategies');
    }

    if (tags.includes('exhaust')) {
      recommendations.push('Exhaust-focused decks');
    }

    if (tags.includes('poison') || tags.includes('vulnerable') || tags.includes('weak')) {
      recommendations.push('Debuff-focused strategies');
    }

    return recommendations;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(relicIds: string[], synergies: SynergyResult[]): string[] {
    const recommendations: string[] = [];

    // Check for missing synergies
    const strongSynergies = synergies.filter(s => s.synergyScore > 2.0);
    if (strongSynergies.length > 0) {
      recommendations.push(`You have ${strongSynergies.length} strong synergies - capitalize on them!`);
    }

    // Check for anti-synergies
    const antiSynergies = synergies.filter(s => s.synergyType === 'anti_synergy');
    if (antiSynergies.length > 0) {
      recommendations.push(`Warning: ${antiSynergies.length} anti-synergies detected`);
    }

    // Suggest missing relics for existing synergies
    const existingTags = new Set<RelicTag>();
    for (const relicId of relicIds) {
      const relic = getRelicById(this.config, relicId);
      if (relic) {
        relic.tags.forEach(tag => existingTags.add(tag));
      }
    }

    // Find relics that would synergize well
    const potentialRelics = Object.keys(this.config.relics).filter(id => !relicIds.includes(id));
    for (const potentialId of potentialRelics.slice(0, 3)) {
      const potential = getRelicById(this.config, potentialId);
      if (!potential) continue;

      const tagOverlap = potential.tags.filter(tag => existingTags.has(tag)).length;
      if (tagOverlap >= 2) {
        recommendations.push(`Consider adding ${potential.name} for additional synergy`);
      }
    }

    return recommendations;
  }

  /**
   * Find optimal relic to add to existing collection
   */
  findOptimalAddition(existingRelics: string[]): string | null {
    const available = Object.keys(this.config.relics).filter(
      id => !existingRelics.includes(id)
    );

    let bestRelic: string | null = null;
    let bestScore = -Infinity;

    for (const candidateId of available) {
      // Check if valid with existing relics
      let valid = true;
      for (const existingId of existingRelics) {
        if (areRelicsExclusive(this.config, candidateId, existingId)) {
          valid = false;
          break;
        }
      }

      if (!valid) continue;

      // Calculate total synergy score with existing relics
      let totalScore = 0;
      for (const existingId of existingRelics) {
        const synergy = this.analyzePair(candidateId, existingId);
        if (synergy) {
          totalScore += synergy.synergyScore;
        }
      }

      // Apply rarity weight
      const candidate = getRelicById(this.config, candidateId);
      if (candidate && this.config.analysis.weightByRarity) {
        const rarityWeight = getRarityWeight(this.config, candidate.rarity);
        totalScore *= rarityWeight;
      }

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestRelic = candidateId;
      }
    }

    return bestRelic;
  }

  /**
   * Emit telemetry event
   */
  private emitTelemetry(eventName: string, data: Record<string, unknown>): void {
    if (!this.telemetryEnabled) return;

    console.log(`[Telemetry] ${eventName}`, {
      timestamp: Date.now(),
      ...data,
    });

    // In production, send to telemetry endpoint
    // fetch(this.config.telemetry.endpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ event: eventName, data }),
    // });
  }

  /**
   * Get synergy graph for visualization
   */
  getSynergyGraph(): Map<string, SynergyNode> {
    return this.synergyGraph;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: RelicSynergyConfig): void {
    this.config = newConfig;
    this.telemetryEnabled = newConfig.telemetry.enabled;
    this.synergyGraph.clear();
    this.buildSynergyGraph();
  }
}
