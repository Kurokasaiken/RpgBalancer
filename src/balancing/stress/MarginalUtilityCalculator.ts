/**
 * Marginal Utility Calculator
 * Computes synergy analysis and marginal utility for stat combinations
 * Uses deterministic simulations with configurable parameters
 */

import type { BalancerConfig } from '../config/types';
import type {
  MarginalUtilityConfig,
  MarginalUtilityResults,
  ArchetypeResult,
  SynergyResult,
  SimulationOptions,
  ProgressCallback,
  StatisticalMetrics,
  HeatmapDataPoint,
  ExportConfig,
} from './types';
import { ArchetypeGenerator, DEFAULT_ARCHETYPE_GENERATOR_CONFIG } from './ArchetypeGenerator';
import { LCG, SeededRandomFactory } from './LCG';
import { DEFAULT_MARGINAL_UTILITY_CONFIG, SYNERGY_THRESHOLDS } from './types';

/**
 * Simulation result for a single combat.
 */
interface CombatResult {
  winner: 'attacker' | 'defender';
  attackerDamage: number;
  defenderDamage: number;
  rounds: number;
  attackerSurvived: boolean;
  defenderSurvived: boolean;
}

/**
 * Internal simulation state.
 */
interface SimulationState {
  rng: LCG;
  totalSimulations: number;
  currentSimulation: number;
  startTime: number;
}

/**
 * Marginal Utility Calculator
 * 
 * Computes marginal utility and synergy analysis for stat combinations
 * using deterministic Monte Carlo simulations.
 * 
 * Features:
 * - Deterministic simulations with seeded RNG
 * - Configurable simulation parameters
 * - Progress tracking and cancellation support
 * - Multiple export formats
 * - Performance optimization with caching
 * - Statistical analysis and confidence intervals
 */
export class MarginalUtilityCalculator {
  private config: MarginalUtilityConfig;
  private rngFactory: SeededRandomFactory;
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Creates a new calculator instance.
   * 
   * @param config - Configuration for calculations
   */
  constructor(config: Partial<MarginalUtilityConfig> = {}) {
    this.config = { ...DEFAULT_MARGINAL_UTILITY_CONFIG, ...config };
    this.rngFactory = new SeededRandomFactory(this.config.seed);
  }

  /**
   * Runs complete marginal utility analysis.
   * 
   * @param baselineConfig - Base configuration to analyze
   * @param options - Simulation options
   * @returns Complete analysis results
   */
  async runAnalysis(
    baselineConfig: BalancerConfig,
    options: SimulationOptions = {}
  ): Promise<MarginalUtilityResults> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(baselineConfig, this.config);
    if (this.config.enableCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.results;
      }
    }

    // Generate archetypes
    const generator = new ArchetypeGenerator({
      ...DEFAULT_ARCHETYPE_GENERATOR_CONFIG,
      seed: this.config.seed,
    });
    
    const archetypes = generator.generateArchetypes(baselineConfig);
    
    // Initialize progress tracking
    const totalArchetypes = archetypes.singleStats.length + archetypes.pairStats.length;
    let currentArchetype = 0;

    // Run simulations
    const singleStatResults: ArchetypeResult[] = [];
    const pairStatResults: ArchetypeResult[] = [];

    // Simulate single stat archetypes
    for (const archetype of archetypes.singleStats) {
      if (options.abortSignal?.aborted) {
        throw new Error('Simulation aborted');
      }

      const result = await this.simulateSingleStatArchetype(
        archetype,
        baselineConfig,
        this.config,
        (progress) => {
          currentArchetype++;
          options.onProgress?.({
            current: currentArchetype,
            total: totalArchetypes,
            percentage: (currentArchetype / totalArchetypes) * 100,
            currentArchetype: archetype.description,
            estimatedTimeRemaining: this.estimateTimeRemaining(startTime, currentArchetype, totalArchetypes),
          });
        }
      );
      
      singleStatResults.push(result);
    }

    // Simulate pair stat archetypes
    for (const archetype of archetypes.pairStats) {
      if (options.abortSignal?.aborted) {
        throw new Error('Simulation aborted');
      }

      const result = await this.simulatePairStatArchetype(
        archetype,
        baselineConfig,
        this.config,
        (progress) => {
          currentArchetype++;
          options.onProgress?.({
            current: currentArchetype,
            total: totalArchetypes,
            percentage: (currentArchetype / totalArchetypes) * 100,
            currentArchetype: archetype.description,
            estimatedTimeRemaining: this.estimateTimeRemaining(startTime, currentArchetype, totalArchetypes),
          });
        }
      );
      
      pairStatResults.push(result);
    }

    // Compute synergy matrix
    const synergyMatrix = this.computeSynergyMatrix(singleStatResults, pairStatResults);

    // Calculate performance metrics
    const endTime = Date.now();
    const totalExecutionTime = endTime - startTime;
    const simulationsPerSecond = (totalArchetypes * this.config.simulationsPerArchetype) / (totalExecutionTime / 1000);

    const results: MarginalUtilityResults = {
      config: this.config,
      timestamp: endTime,
      baselineConfig,
      singleStatResults,
      pairStatResults,
      synergyMatrix,
      performance: {
        totalExecutionTime,
        simulationsPerSecond,
        memoryUsage: this.estimateMemoryUsage(),
        cacheHitRate: this.calculateCacheHitRate(),
      },
      exports: {},
    };

    // Generate exports
    results.exports = this.generateExports(results);

    // Cache results
    if (this.config.enableCache) {
      this.cache.set(cacheKey, {
        results,
        timestamp: endTime,
        configHash: cacheKey,
        expiresAt: endTime + (24 * 60 * 60 * 1000), // 24 hours
      });
    }

    return results;
  }

  /**
   * Simulates a single stat archetype.
   * 
   * @param archetype - Single stat archetype
   * @param baselineConfig - Base configuration
   * @param config - Simulation configuration
   * @param onProgress - Progress callback
   * @returns Simulation result
   */
  private async simulateSingleStatArchetype(
    archetype: import('./types').SingleStatArchetype,
    baselineConfig: BalancerConfig,
    config: MarginalUtilityConfig,
    onProgress?: ProgressCallback
  ): Promise<ArchetypeResult> {
    const rng = this.rngFactory.createGenerator(`single-${archetype.statId}`);
    const startTime = Date.now();

    let wins = 0;
    let totalDamage = 0;
    let totalSurvivalTime = 0;

    // Create augmented configuration
    const augmentedConfig = this.createAugmentedConfig(
      baselineConfig,
      [{ statId: archetype.statId, value: archetype.augmentedValue }]
    );

    // Run simulations
    for (let i = 0; i < config.simulationsPerArchetype; i++) {
      if (i % 1000 === 0 && onProgress) {
        onProgress({
          current: i,
          total: config.simulationsPerArchetype,
          percentage: (i / config.simulationsPerArchetype) * 100,
        });
      }

      const result = this.simulateCombat(augmentedConfig, baselineConfig, rng);
      
      if (result.winner === 'attacker') {
        wins++;
      }
      
      totalDamage += result.attackerDamage;
      totalSurvivalTime += result.rounds;
    }

    const executionTime = Date.now() - startTime;

    return {
      archetypeId: archetype.statId,
      description: archetype.description,
      wins,
      totalSimulations: config.simulationsPerArchetype,
      winRate: wins / config.simulationsPerArchetype,
      averageDamage: totalDamage / config.simulationsPerArchetype,
      averageSurvivalTime: totalSurvivalTime / config.simulationsPerArchetype,
      executionTime,
    };
  }

  /**
   * Simulates a pair stat archetype.
   * 
   * @param archetype - Pair stat archetype
   * @param baselineConfig - Base configuration
   * @param config - Simulation configuration
   * @param onProgress - Progress callback
   * @returns Simulation result
   */
  private async simulatePairStatArchetype(
    archetype: import('./types').PairStatArchetype,
    baselineConfig: BalancerConfig,
    config: MarginalUtilityConfig,
    onProgress?: ProgressCallback
  ): Promise<ArchetypeResult> {
    const rng = this.rngFactory.createGenerator(`pair-${archetype.stat1Id}-${archetype.stat2Id}`);
    const startTime = Date.now();

    let wins = 0;
    let totalDamage = 0;
    let totalSurvivalTime = 0;

    // Create augmented configuration
    const augmentedConfig = this.createAugmentedConfig(baselineConfig, [
      { statId: archetype.stat1Id, value: archetype.augmented1Value },
      { statId: archetype.stat2Id, value: archetype.augmented2Value },
    ]);

    // Run simulations
    for (let i = 0; i < config.simulationsPerArchetype; i++) {
      if (i % 1000 === 0 && onProgress) {
        onProgress({
          current: i,
          total: config.simulationsPerArchetype,
          percentage: (i / config.simulationsPerArchetype) * 100,
        });
      }

      const result = this.simulateCombat(augmentedConfig, baselineConfig, rng);
      
      if (result.winner === 'attacker') {
        wins++;
      }
      
      totalDamage += result.attackerDamage;
      totalSurvivalTime += result.rounds;
    }

    const executionTime = Date.now() - startTime;

    return {
      archetypeId: `${archetype.stat1Id}+${archetype.stat2Id}`,
      description: archetype.description,
      wins,
      totalSimulations: config.simulationsPerArchetype,
      winRate: wins / config.simulationsPerArchetype,
      averageDamage: totalDamage / config.simulationsPerArchetype,
      averageSurvivalTime: totalSurvivalTime / config.simulationsPerArchetype,
      executionTime,
    };
  }

  /**
   * Simulates a single combat between two configurations.
   * 
   * @param attackerConfig - Attacker configuration
   * @param defenderConfig - Defender configuration
   * @param rng - Random number generator
   * @returns Combat result
   */
  private simulateCombat(
    attackerConfig: BalancerConfig,
    defenderConfig: BalancerConfig,
    rng: LCG
  ): CombatResult {
    // Simplified combat simulation
    // In a real implementation, this would use the full STS combat engine
    
    const attackerHP = this.calculateEffectiveHP(attackerConfig);
    const defenderHP = this.calculateEffectiveHP(defenderConfig);
    
    const attackerDamage = this.calculateEffectiveDamage(attackerConfig);
    const defenderDamage = this.calculateEffectiveDamage(defenderConfig);
    
    let attackerCurrentHP = attackerHP;
    let defenderCurrentHP = defenderHP;
    let rounds = 0;
    
    while (attackerCurrentHP > 0 && defenderCurrentHP > 0 && rounds < 100) {
      rounds++;
      
      // Attacker attacks
      const damage = this.rollDamage(attackerDamage, rng);
      defenderCurrentHP -= damage;
      
      if (defenderCurrentHP <= 0) {
        break;
      }
      
      // Defender attacks
      const counterDamage = this.rollDamage(defenderDamage, rng);
      attackerCurrentHP -= counterDamage;
    }
    
    return {
      winner: attackerCurrentHP > 0 ? 'attacker' : 'defender',
      attackerDamage: attackerDamage,
      defenderDamage: defenderDamage,
      rounds,
      attackerSurvived: attackerCurrentHP > 0,
      defenderSurvived: defenderCurrentHP > 0,
    };
  }

  /**
   * Computes the synergy matrix from simulation results.
   * 
   * @param singleStatResults - Single stat simulation results
   * @param pairStatResults - Pair stat simulation results
   * @returns Synergy analysis matrix
   */
  private computeSynergyMatrix(
    singleStatResults: ArchetypeResult[],
    pairStatResults: ArchetypeResult[]
  ): SynergyResult[] {
    const synergies: SynergyResult[] = [];
    
    // Create lookup for single stat results
    const singleStatLookup = new Map<string, ArchetypeResult>();
    for (const result of singleStatResults) {
      singleStatLookup.set(result.archetypeId, result);
    }
    
    // Analyze each pair result
    for (const pairResult of pairStatResults) {
      const [stat1Id, stat2Id] = pairResult.archetypeId.split('+');
      
      const single1Result = singleStatLookup.get(stat1Id);
      const single2Result = singleStatLookup.get(stat2Id);
      
      if (!single1Result || !single2Result) {
        continue;
      }
      
      const pairScore = pairResult.winRate;
      const expectedScore = (single1Result.winRate + single2Result.winRate) / 2;
      const synergyMultiplier = pairScore / expectedScore;
      
      // Calculate confidence based on sample size
      const confidence = this.calculateConfidence(
        pairResult.totalSimulations,
        pairScore
      );
      
      synergies.push({
        stat1Id,
        stat2Id,
        pairScore,
        expectedScore,
        synergyMultiplier,
        isOpSynergy: synergyMultiplier >= SYNERGY_THRESHOLDS.opThreshold,
        isWeakSynergy: synergyMultiplier <= SYNERGY_THRESHOLDS.weakThreshold,
        confidence,
        sampleSize: pairResult.totalSimulations,
      });
    }
    
    return synergies;
  }

  /**
   * Creates an augmented configuration with modified stat values.
   * 
   * @param baseConfig - Base configuration
   * @param augmentations - Stat augmentations to apply
   * @returns Augmented configuration
   */
  private createAugmentedConfig(
    baseConfig: BalancerConfig,
    augmentations: Array<{ statId: string; value: number }>
  ): BalancerConfig {
    const augmentedStats = { ...baseConfig.stats };
    
    for (const augmentation of augmentations) {
      if (augmentedStats[augmentation.statId]) {
        augmentedStats[augmentation.statId] = {
          ...augmentedStats[augmentation.statId],
          defaultValue: augmentation.value,
        };
      }
    }
    
    return {
      ...baseConfig,
      stats: augmentedStats,
    };
  }

  /**
   * Calculates effective HP from configuration.
   * 
   * @param config - Configuration
   * @returns Effective HP
   */
  private calculateEffectiveHP(config: BalancerConfig): number {
    const hpStat = config.stats.hp;
    if (!hpStat) return 100;
    
    return hpStat.defaultValue;
  }

  /**
   * Calculates effective damage from configuration.
   * 
   * @param config - Configuration
   * @returns Effective damage
   */
  private calculateEffectiveDamage(config: BalancerConfig): number {
    const damageStat = config.stats.damage;
    if (!damageStat) return 10;
    
    return damageStat.defaultValue;
  }

  /**
   * Rolls damage with randomness.
   * 
   * @param baseDamage - Base damage value
   * @param rng - Random number generator
   * @returns Rolled damage
   */
  private rollDamage(baseDamage: number, rng: LCG): number {
    // Add ±20% randomness
    const variance = 0.2;
    const modifier = 1 + (rng.next() - 0.5) * 2 * variance;
    return Math.max(1, Math.floor(baseDamage * modifier));
  }

  /**
   * Calculates statistical confidence.
   * 
   * @param sampleSize - Sample size
   * @param proportion - Observed proportion
   * @returns Confidence level (0-1)
   */
  private calculateConfidence(sampleSize: number, proportion: number): number {
    // Simplified confidence calculation
    // In a real implementation, this would use proper statistical methods
    if (sampleSize < SYNERGY_THRESHOLDS.minSampleSize) {
      return 0.5;
    }
    
    const standardError = Math.sqrt((proportion * (1 - proportion)) / sampleSize);
    const marginOfError = 1.96 * standardError; // 95% confidence
    
    return Math.max(0, Math.min(1, 1 - marginOfError));
  }

  /**
   * Generates exports in multiple formats.
   * 
   * @param results - Analysis results
   * @returns Export data
   */
  private generateExports(results: MarginalUtilityResults): MarginalUtilityResults['exports'] {
    const exports: MarginalUtilityResults['exports'] = {};
    
    if (this.config.exportFormats.includes('json')) {
      exports.json = JSON.stringify(results, null, 2);
    }
    
    if (this.config.exportFormats.includes('csv')) {
      exports.csv = this.generateCSV(results);
    }
    
    if (this.config.exportFormats.includes('markdown')) {
      exports.markdown = this.generateMarkdown(results);
    }
    
    return exports;
  }

  /**
   * Generates CSV export.
   * 
   * @param results - Analysis results
   * @returns CSV string
   */
  private generateCSV(results: MarginalUtilityResults): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Stat1,Stat2,PairScore,ExpectedScore,SynergyMultiplier,IsOP,IsWeak,Confidence');
    
    // Data rows
    for (const synergy of results.synergyMatrix) {
      lines.push([
        synergy.stat1Id,
        synergy.stat2Id,
        synergy.pairScore.toFixed(4),
        synergy.expectedScore.toFixed(4),
        synergy.synergyMultiplier.toFixed(4),
        synergy.isOpSynergy ? 'TRUE' : 'FALSE',
        synergy.isWeakSynergy ? 'TRUE' : 'FALSE',
        synergy.confidence.toFixed(4),
      ].join(','));
    }
    
    return lines.join('\n');
  }

  /**
   * Generates Markdown export.
   * 
   * @param results - Analysis results
   * @returns Markdown string
   */
  private generateMarkdown(results: MarginalUtilityResults): string {
    const lines: string[] = [];
    
    lines.push('# Marginal Utility Analysis');
    lines.push('');
    lines.push(`Generated: ${new Date(results.timestamp).toISOString()}`);
    lines.push(`Simulations per archetype: ${results.config.simulationsPerArchetype}`);
    lines.push(`Total execution time: ${results.performance.totalExecutionTime}ms`);
    lines.push('');
    
    // Top synergies
    lines.push('## Top Synergies');
    lines.push('');
    lines.push('| Stat 1 | Stat 2 | Multiplier | Confidence |');
    lines.push('|--------|--------|------------|------------|');
    
    const topSynergies = results.synergyMatrix
      .filter(s => s.isOpSynergy)
      .sort((a, b) => b.synergyMultiplier - a.synergyMultiplier)
      .slice(0, 10);
    
    for (const synergy of topSynergies) {
      lines.push(`| ${synergy.stat1Id} | ${synergy.stat2Id} | ${synergy.synergyMultiplier.toFixed(3)} | ${synergy.confidence.toFixed(3)} |`);
    }
    
    return lines.join('\n');
  }

  /**
   * Generates cache key for results.
   * 
   * @param config - Configuration
   * @param analysisConfig - Analysis configuration
   * @returns Cache key
   */
  private generateCacheKey(config: BalancerConfig, analysisConfig: MarginalUtilityConfig): string {
    const configHash = JSON.stringify({
      stats: config.stats,
      activePresetId: config.activePresetId,
    });
    const analysisHash = JSON.stringify(analysisConfig);
    return `${configHash}-${analysisHash}`;
  }

  /**
   * Estimates remaining execution time.
   * 
   * @param startTime - Start time
   * @param current - Current progress
   * @param total - Total items
   * @returns Estimated remaining time in milliseconds
   */
  private estimateTimeRemaining(startTime: number, current: number, total: number): number {
    const elapsed = Date.now() - startTime;
    const rate = current / elapsed;
    const remaining = total - current;
    return Math.round(remaining / rate);
  }

  /**
   * Estimates memory usage.
   * 
   * @returns Estimated memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    // Simplified estimation
    return this.cache.size * 1024; // Assume 1KB per cache entry
  }

  /**
   * Calculates cache hit rate.
   * 
   * @returns Cache hit rate (0-1)
   */
  private calculateCacheHitRate(): number {
    // Simplified - would track actual hits/misses in real implementation
    return 0.5;
  }

  /**
   * Clears the cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics.
   * 
   * @returns Cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      hitRate: this.calculateCacheHitRate(),
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Updates configuration.
   * 
   * @param newConfig - New configuration values
   */
  updateConfig(newConfig: Partial<MarginalUtilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.seed !== undefined) {
      this.rngFactory = new SeededRandomFactory(this.config.seed);
    }
  }

  /**
   * Gets current configuration.
   * 
   * @returns Current configuration
   */
  getConfig(): MarginalUtilityConfig {
    return { ...this.config };
  }
}

/**
 * Cache entry interface.
 */
interface CacheEntry {
  results: MarginalUtilityResults;
  timestamp: number;
  configHash: string;
  expiresAt: number;
}

/**
 * Creates a marginal utility calculator with default configuration.
 * 
 * @param seed - Optional seed override
 * @returns New calculator instance
 */
export function createMarginalUtilityCalculator(seed?: number): MarginalUtilityCalculator {
  const config = { ...DEFAULT_MARGINAL_UTILITY_CONFIG };
  if (seed !== undefined) {
    config.seed = seed;
  }
  return new MarginalUtilityCalculator(config);
}
