/**
 * NP-033 – Idle Village Quest Narrative Telemetry Correlator
 * 
 * Narrative-outcome correlation engine for analyzing relationships
 * between narrative content and quest outcomes with statistical methods.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import {
  NarrativeData,
  QuestOutcomeData,
  CorrelationData,
  CorrelationAnalysis,
  CorrelationMethod,
  NarrativeType,
  NarrativeTone,
  NarrativeStyle,
  QuestOutcome,
  QuestDifficulty,
  QuestCategory,
  validateNarrativeData,
  validateQuestOutcomeData,
  validateCorrelationData,
} from '../types/narrativeCorrelation';

// Correlation calculation types
export type CorrelationCalculationType = 'pearson' | 'spearman' | 'kendall' | 'mutual_info' | 'chi_square' | 'custom';
export type CorrelationDirection = 'positive' | 'negative' | 'neutral';

// Correlation calculation context
export interface CorrelationCalculationContext {
  narratives: NarrativeData[];
  outcomes: QuestOutcomeData[];
  parameters: {
    methods: CorrelationCalculationType[];
    minSampleSize: number;
    significanceThreshold: number;
    confidenceLevel: number;
    multipleTestingCorrection: boolean;
  };
  filters: {
    timeRange?: {
      start: number;
      end: number;
    };
    narrativeTypes?: NarrativeType[];
    questCategories?: QuestCategory[];
    difficulties?: QuestDifficulty[];
    outcomes?: QuestOutcome[];
    tones?: NarrativeTone[];
    styles?: NarrativeStyle[];
  };
  metadata: {
    timestamp: number;
    calculationId: string;
    version: string;
  };
}

// Correlation calculation result
export interface CorrelationCalculationResult {
  id: string;
  timestamp: number;
  context: CorrelationCalculationContext;
  correlations: CorrelationData[];
  summary: {
    totalCorrelations: number;
    significantCorrelations: number;
    strongCorrelations: number;
    averageCorrelation: number;
    averageSignificance: number;
    methodDistribution: Record<string, number>;
  };
  insights: {
    topPositiveCorrelations: CorrelationData[];
    topNegativeCorrelations: CorrelationData[];
    unexpectedCorrelations: CorrelationData[];
    actionableInsights: string[];
  };
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

// Statistical calculation utilities
export class StatisticalCalculations {
  /**
   * Calculate Pearson correlation coefficient
   */
  static pearsonCorrelation(x: number[], y: number[]): { coefficient: number; pValue: number; significance: number } {
    if (x.length !== y.length || x.length < 2) {
      return { coefficient: 0, pValue: 1, significance: 0 };
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) {
      return { coefficient: 0, pValue: 1, significance: 0 };
    }

    const coefficient = numerator / denominator;
    
    // Calculate p-value (simplified for demonstration)
    const t = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
    const pValue = 2 * (1 - this.tDistribution(Math.abs(t), n - 2));
    const significance = 1 - pValue;

    return { coefficient, pValue, significance };
  }

  /**
   * Calculate Spearman rank correlation
   */
  static spearmanCorrelation(x: number[], y: number[]): { coefficient: number; pValue: number; significance: number } {
    if (x.length !== y.length || x.length < 2) {
      return { coefficient: 0, pValue: 1, significance: 0 };
    }

    const rankX = this.getRanks(x);
    const rankY = this.getRanks(y);
    
    return this.pearsonCorrelation(rankX, rankY);
  }

  /**
   * Calculate Kendall's tau correlation
   */
  static kendallTau(x: number[], y: number[]): { coefficient: number; pValue: number; significance: number } {
    if (x.length !== y.length || x.length < 2) {
      return { coefficient: 0, pValue: 1, significance: 0 };
    }

    const n = x.length;
    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const xDiff = x[i] - x[j];
        const yDiff = y[i] - y[j];
        
        if (xDiff * yDiff > 0) {
          concordant++;
        } else if (xDiff * yDiff < 0) {
          discordant++;
        }
      }
    }

    const total = concordant + discordant;
    if (total === 0) {
      return { coefficient: 0, pValue: 1, significance: 0 };
    }

    const coefficient = (concordant - discordant) / total;
    
    // Calculate p-value (simplified)
    const z = coefficient * Math.sqrt((n * (n - 1)) / (2 * (2 * n + 5)));
    const pValue = 2 * (1 - this.normalDistribution(Math.abs(z)));
    const significance = 1 - pValue;

    return { coefficient, pValue, significance };
  }

  /**
   * Calculate mutual information
   */
  static mutualInformation(x: number[], y: number[], bins: number = 10): { coefficient: number; pValue: number; significance: number } {
    if (x.length !== y.length || x.length < 2) {
      return { coefficient: 0, pValue: 1, significance: 0 };
    }

    const n = x.length;
    const xBins = this.createBins(x, bins);
    const yBins = this.createBins(y, bins);
    
    // Calculate joint and marginal probabilities
    const jointProb: number[][] = Array(bins).fill(0).map(() => Array(bins).fill(0));
    const xProb: number[] = Array(bins).fill(0);
    const yProb: number[] = Array(bins).fill(0);

    for (let i = 0; i < n; i++) {
      const xBin = xBins[i];
      const yBin = yBins[i];
      jointProb[xBin][yBin]++;
      xProb[xBin]++;
      yProb[yBin]++;
    }

    // Normalize to probabilities
    for (let i = 0; i < bins; i++) {
      for (let j = 0; j < bins; j++) {
        jointProb[i][j] /= n;
      }
      xProb[i] /= n;
      yProb[i] /= n;
    }

    // Calculate mutual information
    let mi = 0;
    for (let i = 0; i < bins; i++) {
      for (let j = 0; j < bins; j++) {
        if (jointProb[i][j] > 0 && xProb[i] > 0 && yProb[j] > 0) {
          mi += jointProb[i][j] * Math.log(jointProb[i][j] / (xProb[i] * yProb[j]));
        }
      }
    }

    // Normalize to correlation coefficient (0 to 1)
    const maxMI = Math.log(Math.min(bins, x.length));
    const coefficient = mi / maxMI;
    
    // Calculate p-value (simplified permutation test)
    const pValue = this.permutationTest(x, y, 1000);
    const significance = 1 - pValue;

    return { coefficient, pValue, significance };
  }

  /**
   * Calculate chi-square test
   */
  static chiSquareTest(x: number[], y: number[], bins: number = 10): { coefficient: number; pValue: number; significance: number } {
    if (x.length !== y.length || x.length < 2) {
      return { coefficient: 0, pValue: 1, significance: 0 };
    }

    const n = x.length;
    const xBins = this.createBins(x, bins);
    const yBins = this.createBins(y, bins);
    
    // Create contingency table
    const contingency: number[][] = Array(bins).fill(0).map(() => Array(bins).fill(0));
    const rowTotals: number[] = Array(bins).fill(0);
    const colTotals: number[] = Array(bins).fill(0);

    for (let i = 0; i < n; i++) {
      const xBin = xBins[i];
      const yBin = yBins[i];
      contingency[xBin][yBin]++;
      rowTotals[xBin]++;
      colTotals[yBin]++;
    }

    // Calculate chi-square statistic
    let chiSquare = 0;
    for (let i = 0; i < bins; i++) {
      for (let j = 0; j < bins; j++) {
        const expected = (rowTotals[i] * colTotals[j]) / n;
        if (expected > 0) {
          chiSquare += Math.pow(contingency[i][j] - expected, 2) / expected;
        }
      }
    }

    // Calculate p-value
    const df = (bins - 1) * (bins - 1);
    const pValue = 1 - this.chiSquareDistribution(chiSquare, df);
    const significance = 1 - pValue;
    
    // Convert to correlation coefficient
    const coefficient = Math.sqrt(chiSquare / (chiSquare + n));

    return { coefficient, pValue, significance };
  }

  /**
   * Get ranks for Spearman correlation
   */
  private static getRanks(values: number[]): number[] {
    const indexed = values.map((value, index) => ({ value, index }));
    indexed.sort((a, b) => a.value - b.value);
    
    const ranks = new Array(values.length);
    let i = 0;
    while (i < indexed.length) {
      const j = i;
      while (j < indexed.length && indexed[j].value === indexed[i].value) {
        j++;
      }
      
      // Handle ties
      const avgRank = (i + j - 1) / 2 + 1;
      for (let k = i; k < j; k++) {
        ranks[indexed[k].index] = avgRank;
      }
      
      i = j;
    }
    
    return ranks;
  }

  /**
   * Create bins for discretization
   */
  private static createBins(values: number[], bins: number): number[] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins;
    
    return values.map(value => {
      const bin = Math.floor((value - min) / binSize);
      return Math.min(bin, bins - 1);
    });
  }

  /**
   * Simplified t-distribution CDF
   */
  private static tDistribution(t: number, df: number): number {
    // Simplified approximation for demonstration
    return 0.5 + 0.5 * Math.sign(t) * Math.sqrt(1 - Math.exp(-2 * t * t / df));
  }

  /**
   * Simplified normal distribution CDF
   */
  private static normalDistribution(z: number): number {
    // Simplified approximation for demonstration
    return 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI)));
  }

  /**
   * Simplified chi-square distribution CDF
   */
  private static chiSquareDistribution(chi2: number, df: number): number {
    // Simplified approximation for demonstration
    return 1 - Math.exp(-chi2 / (2 * df));
  }

  /**
   * Simplified permutation test
   */
  private static permutationTest(x: number[], y: number[], iterations: number): number {
    const originalCorrelation = this.pearsonCorrelation(x, y).coefficient;
    let count = 0;
    
    for (let i = 0; i < iterations; i++) {
      const shuffledY = [...y].sort(() => Math.random() - 0.5);
      const permutedCorrelation = this.pearsonCorrelation(x, shuffledY).coefficient;
      
      if (Math.abs(permutedCorrelation) >= Math.abs(originalCorrelation)) {
        count++;
      }
    }
    
    return count / iterations;
  }
}

// Narrative-Outcome Correlator
export class NarrativeOutcomeCorrelator {
  private correlationMethods: Map<string, CorrelationMethod> = new Map();
  private cache: Map<string, CorrelationCalculationResult> = new Map();
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
    this.initializeCorrelationMethods();
  }

  /**
   * Initialize correlation methods
   */
  private initializeCorrelationMethods(): void {
    // Pearson correlation
    this.correlationMethods.set('pearson', {
      name: 'Pearson Correlation',
      type: 'parametric',
      description: 'Measures linear correlation between two variables',
      parameters: {},
      requirements: {
        minSampleSize: 3,
        dataTypes: ['numeric'],
        assumptions: ['linearity', 'normality', 'homoscedasticity'],
      },
      performance: {
        complexity: 'low',
        accuracy: 0.9,
        speed: 1.0,
      },
    });

    // Spearman correlation
    this.correlationMethods.set('spearman', {
      name: 'Spearman Rank Correlation',
      type: 'non_parametric',
      description: 'Measures monotonic correlation using ranks',
      parameters: {},
      requirements: {
        minSampleSize: 2,
        dataTypes: ['ordinal', 'numeric'],
        assumptions: ['monotonicity'],
      },
      performance: {
        complexity: 'medium',
        accuracy: 0.85,
        speed: 0.8,
      },
    });

    // Kendall's tau
    this.correlationMethods.set('kendall', {
      name: 'Kendall\'s Tau',
      type: 'non_parametric',
      description: 'Measures ordinal association between two variables',
      parameters: {},
      requirements: {
        minSampleSize: 2,
        dataTypes: ['ordinal', 'numeric'],
        assumptions: ['ordinality'],
      },
      performance: {
        complexity: 'high',
        accuracy: 0.8,
        speed: 0.6,
      },
    });

    // Mutual information
    this.correlationMethods.set('mutual_info', {
      name: 'Mutual Information',
      type: 'information_theoretic',
      description: 'Measures dependency between variables using information theory',
      parameters: { bins: 10 },
      requirements: {
        minSampleSize: 10,
        dataTypes: ['numeric', 'categorical'],
        assumptions: ['independence'],
      },
      performance: {
        complexity: 'medium',
        accuracy: 0.85,
        speed: 0.7,
      },
    });

    // Chi-square test
    this.correlationMethods.set('chi_square', {
      name: 'Chi-Square Test',
      type: 'non_parametric',
      description: 'Tests independence between categorical variables',
      parameters: { bins: 10 },
      requirements: {
        minSampleSize: 20,
        dataTypes: ['categorical'],
        assumptions: ['independence', 'expected_frequency'],
      },
      performance: {
        complexity: 'medium',
        accuracy: 0.8,
        speed: 0.8,
      },
    });
  }

  /**
   * Calculate correlations between narratives and outcomes
   */
  calculateCorrelations(context: CorrelationCalculationContext): CorrelationCalculationResult {
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
      // Filter data
      const filteredNarratives = this.filterNarratives(context.narratives, context.filters);
      const filteredOutcomes = this.filterOutcomes(context.outcomes, context.filters);

      // Validate minimum sample size
      if (filteredNarratives.length < context.parameters.minSampleSize || 
          filteredOutcomes.length < context.parameters.minSampleSize) {
        throw new Error(`Insufficient sample size: need at least ${context.parameters.minSampleSize} samples`);
      }

      // Match narratives with outcomes
      const matchedPairs = this.matchNarrativesWithOutcomes(filteredNarratives, filteredOutcomes);

      // Calculate correlations for each method
      const correlations: CorrelationData[] = [];
      const methodDistribution: Record<string, number> = {};

      for (const method of context.parameters.methods) {
        const methodCorrelations = this.calculateCorrelationsForMethod(matchedPairs, method);
        correlations.push(...methodCorrelations);
        methodDistribution[method] = methodCorrelations.length;
      }

      // Apply multiple testing correction if enabled
      if (context.parameters.multipleTestingCorrection) {
        this.applyMultipleTestingCorrection(correlations);
      }

      // Filter by significance threshold
      const significantCorrelations = correlations.filter(c => 
        c.correlation.significance >= context.parameters.confidenceLevel
      );

      // Generate insights
      const insights = this.generateInsights(correlations, significantCorrelations);

      // Create result
      const result: CorrelationCalculationResult = {
        id: context.metadata.calculationId,
        timestamp: context.metadata.timestamp,
        context,
        correlations,
        summary: {
          totalCorrelations: correlations.length,
          significantCorrelations: significantCorrelations.length,
          strongCorrelations: correlations.filter(c => Math.abs(c.correlation.strength) >= 0.7).length,
          averageCorrelation: correlations.reduce((sum, c) => sum + Math.abs(c.correlation.strength), 0) / correlations.length,
          averageSignificance: correlations.reduce((sum, c) => sum + c.correlation.significance, 0) / correlations.length,
          methodDistribution,
        },
        insights,
        performance: {
          calculationTime: performance.now() - startTime,
          memoryUsage: this.estimateMemoryUsage(correlations),
          accuracy: this.calculateAccuracy(correlations),
          completeness: this.calculateCompleteness(correlations, context),
        },
        metadata: {
          version: context.metadata.version,
          algorithm: 'narrative-outcome-correlator',
          sampleSize: matchedPairs.length,
          confidence: context.parameters.confidenceLevel,
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
   * Filter narratives based on criteria
   */
  private filterNarratives(narratives: NarrativeData[], filters: CorrelationCalculationContext['filters']): NarrativeData[] {
    return narratives.filter(narrative => {
      // Time range filter
      if (filters.timeRange) {
        if (narrative.timestamp < filters.timeRange.start || narrative.timestamp > filters.timeRange.end) {
          return false;
        }
      }

      // Narrative type filter
      if (filters.narrativeTypes && !filters.narrativeTypes.includes(narrative.type)) {
        return false;
      }

      // Tone filter
      if (filters.tones && !filters.tones.includes(narrative.tone)) {
        return false;
      }

      // Style filter
      if (filters.styles && !filters.styles.includes(narrative.style)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Filter outcomes based on criteria
   */
  private filterOutcomes(outcomes: QuestOutcomeData[], filters: CorrelationCalculationContext['filters']): QuestOutcomeData[] {
    return outcomes.filter(outcome => {
      // Time range filter
      if (filters.timeRange) {
        if (outcome.timestamp < filters.timeRange.start || outcome.timestamp > filters.timeRange.end) {
          return false;
        }
      }

      // Quest category filter
      if (filters.questCategories && !filters.questCategories.includes(outcome.category)) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulties && !filters.difficulties.includes(outcome.difficulty)) {
        return false;
      }

      // Outcome filter
      if (filters.outcomes && !filters.outcomes.includes(outcome.outcome)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Match narratives with outcomes
   */
  private matchNarrativesWithOutcomes(narratives: NarrativeData[], outcomes: QuestOutcomeData[]): Array<{ narrative: NarrativeData; outcome: QuestOutcomeData }> {
    const pairs: Array<{ narrative: NarrativeData; outcome: QuestOutcomeData }> = [];

    for (const narrative of narratives) {
      const outcome = outcomes.find(o => o.questId === narrative.questId);
      if (outcome) {
        pairs.push({ narrative, outcome });
      }
    }

    return pairs;
  }

  /**
   * Calculate correlations for a specific method
   */
  private calculateCorrelationsForMethod(pairs: Array<{ narrative: NarrativeData; outcome: QuestOutcomeData }>, method: CorrelationCalculationType): CorrelationData[] {
    const correlations: CorrelationData[] = [];

    // Extract features from narratives
    const narrativeFeatures = this.extractNarrativeFeatures(pairs.map(p => p.narrative));
    
    // Extract features from outcomes
    const outcomeFeatures = this.extractOutcomeFeatures(pairs.map(p => p.outcome));

    // Calculate correlations for each feature pair
    for (const [narrativeFeature, narrativeValues] of Object.entries(narrativeFeatures)) {
      for (const [outcomeFeature, outcomeValues] of Object.entries(outcomeFeatures)) {
        const correlation = this.calculateFeatureCorrelation(
          narrativeValues,
          outcomeValues,
          narrativeFeature,
          outcomeFeature,
          method,
          pairs
        );
        
        if (correlation) {
          correlations.push(correlation);
        }
      }
    }

    return correlations;
  }

  /**
   * Extract features from narratives
   */
  private extractNarrativeFeatures(narratives: NarrativeData[]): Record<string, number[]> {
    const features: Record<string, number[]> = {};

    // Basic narrative features
    features.tone = narratives.map(n => this.toneToNumeric(n.tone));
    features.style = narratives.map(n => this.styleToNumeric(n.style));
    features.sentiment = narratives.map(n => n.sentiment.score);
    features.complexity = narratives.map(n => n.metadata.complexity);
    features.engagement = narratives.map(n => n.metadata.engagement);
    features.urgency = narratives.map(n => n.metadata.urgency);
    features.length = narratives.map(n => n.metadata.length);
    features.readability = narratives.map(n => n.metadata.readability);

    // Derived features
    features.emotionalIntensity = narratives.map(n => Math.abs(n.sentiment.score));
    features.contentRichness = narratives.map(n => n.sentiment.keywords.length);
    features.contextualDepth = narratives.map(n => n.context.previousNarratives.length);

    return features;
  }

  /**
   * Extract features from outcomes
   */
  private extractOutcomeFeatures(outcomes: QuestOutcomeData[]): Record<string, number[]> {
    const features: Record<string, number[]> = {};

    // Basic outcome features
    features.successRate = outcomes.map(o => o.successRate);
    features.completionRate = outcomes.map(o => o.completionRate);
    features.duration = outcomes.map(o => o.duration);
    features.experience = outcomes.map(o => o.metrics.experience);
    features.efficiency = outcomes.map(o => o.metrics.performance.efficiency);
    features.accuracy = outcomes.map(o => o.metrics.performance.accuracy);
    features.creativity = outcomes.map(o => o.metrics.performance.creativity);
    features.teamwork = outcomes.map(o => o.metrics.performance.teamwork);

    // Derived features
    features.goldReward = outcomes.map(o => o.metrics.rewards.gold);
    features.reputationGain = outcomes.map(o => o.metrics.rewards.rewards.reputation);
    features.fatigueCost = outcomes.map(o => o.metrics.penalties.fatigue);
    features.participantCount = outcomes.map(o => o.participantIds.length);
    features.attempts = outcomes.map(o => o.metadata.attempts);

    // Normalized features
    features.outcomeScore = outcomes.map(o => this.outcomeToScore(o.outcome));
    features.difficultyScore = outcomes.map(o => this.difficultyToScore(o.difficulty));

    return features;
  }

  /**
   * Calculate correlation between two features
   */
  private calculateFeatureCorrelation(
    xValues: number[],
    yValues: number[],
    xFeature: string,
    yFeature: string,
    method: CorrelationCalculationType,
    pairs: Array<{ narrative: NarrativeData; outcome: QuestOutcomeData }>
  ): CorrelationData | null {
    try {
      let result: { coefficient: number; pValue: number; significance: number };

      switch (method) {
        case 'pearson':
          result = StatisticalCalculations.pearsonCorrelation(xValues, yValues);
          break;
        case 'spearman':
          result = StatisticalCalculations.spearmanCorrelation(xValues, yValues);
          break;
        case 'kendall':
          result = StatisticalCalculations.kendallTau(xValues, yValues);
          break;
        case 'mutual_info':
          result = StatisticalCalculations.mutualInformation(xValues, yValues);
          break;
        case 'chi_square':
          result = StatisticalCalculations.chiSquareTest(xValues, yValues);
          break;
        default:
          return null;
      }

      const correlation: CorrelationData = {
        id: `correlation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        narrativeId: pairs[0].narrative.id,
        outcomeId: pairs[0].outcome.id,
        timestamp: Date.now(),
        correlation: {
          strength: Math.abs(result.coefficient),
          direction: result.coefficient >= 0 ? 'positive' : 'negative',
          significance: result.significance,
          confidence: 1 - result.pValue,
        },
        analysis: {
          method,
          sampleSize: xValues.length,
          pValue: result.pValue,
          effectSize: Math.abs(result.coefficient),
          power: result.significance,
        },
        factors: {
          narrative: {
            tone: 0,
            style: 0,
            sentiment: 0,
            complexity: 0,
            engagement: 0,
            urgency: 0,
          },
          outcome: {
            successRate: 0,
            completionRate: 0,
            duration: 0,
            performance: 0,
            efficiency: 0,
          },
          contextual: {
            weather: 0,
            timeOfDay: 0,
            location: 0,
            participantCount: 0,
          },
        },
        patterns: {
          trends: [],
          anomalies: [],
          clusters: [],
          outliers: [],
        },
        metadata: {
          version: '1.0.0',
          algorithm: method,
          parameters: {},
          processingTime: 0,
          accuracy: result.significance,
        },
      };

      return correlation;
    } catch (error) {
      console.error(`Error calculating correlation for ${xFeature} vs ${yFeature}:`, error);
      return null;
    }
  }

  /**
   * Apply multiple testing correction (Bonferroni)
   */
  private applyMultipleTestingCorrection(correlations: CorrelationData[]): void {
    const m = correlations.length;
    const alpha = 0.05 / m; // Bonferroni correction

    correlations.forEach(correlation => {
      correlation.analysis.pValue = Math.min(correlation.analysis.pValue * m, 1);
      correlation.correlation.significance = 1 - correlation.analysis.pValue;
      correlation.correlation.confidence = 1 - correlation.analysis.pValue;
    });
  }

  /**
   * Generate insights from correlations
   */
  private generateInsights(correlations: CorrelationData[], significantCorrelations: CorrelationData[]): CorrelationCalculationResult['insights'] {
    // Sort by correlation strength
    const sortedCorrelations = [...correlations].sort((a, b) => b.correlation.strength - a.correlation.strength);

    // Top positive correlations
    const topPositive = sortedCorrelations
      .filter(c => c.correlation.direction === 'positive')
      .slice(0, 10);

    // Top negative correlations
    const topNegative = sortedCorrelations
      .filter(c => c.correlation.direction === 'negative')
      .slice(0, 10);

    // Unexpected correlations (high strength but low confidence)
    const unexpected = correlations
      .filter(c => c.correlation.strength > 0.7 && c.correlation.confidence < 0.5)
      .slice(0, 10);

    // Generate actionable insights
    const actionableInsights: string[] = [];

    if (topPositive.length > 0) {
      actionableInsights.push(`Found ${topPositive.length} strong positive correlations between narrative features and quest outcomes`);
    }

    if (topNegative.length > 0) {
      actionableInsights.push(`Identified ${topNegative.length} strong negative correlations that may indicate narrative risks`);
    }

    if (unexpected.length > 0) {
      actionableInsights.push(`Discovered ${unexpected.length} unexpected correlations that warrant further investigation`);
    }

    const avgSignificance = significantCorrelations.reduce((sum, c) => sum + c.correlation.significance, 0) / significantCorrelations.length;
    if (avgSignificance > 0.8) {
      actionableInsights.push('High overall significance suggests strong narrative-outcome relationships');
    }

    return {
      topPositiveCorrelations: topPositive,
      topNegativeCorrelations: topNegative,
      unexpectedCorrelations: unexpected,
      actionableInsights,
    };
  }

  /**
   * Helper methods for feature conversion
   */
  private toneToNumeric(tone: NarrativeTone): number {
    const toneMap: Record<NarrativeTone, number> = {
      positive: 1,
      neutral: 0,
      negative: -1,
      urgent: 0.5,
      mysterious: -0.5,
      humorous: 0.8,
      dramatic: -0.8,
    };
    return toneMap[tone];
  }

  private styleToNumeric(style: NarrativeStyle): number {
    const styleMap: Record<NarrativeStyle, number> = {
      descriptive: 0.5,
      dialogue: 0.7,
      action: 0.8,
      exposition: 0.3,
      reflection: 0.4,
      instruction: 0.6,
    };
    return styleMap[style];
  }

  private outcomeToScore(outcome: QuestOutcome): number {
    const outcomeMap: Record<QuestOutcome, number> = {
      success: 1,
      partial_success: 0.5,
      failure: 0,
      abandoned: -0.5,
      timeout: -0.3,
      critical_success: 1.5,
      critical_failure: -1,
    };
    return outcomeMap[outcome];
  }

  private difficultyToScore(difficulty: QuestDifficulty): number {
    const difficultyMap: Record<QuestDifficulty, number> = {
      trivial: 0.2,
      easy: 0.4,
      normal: 0.6,
      hard: 0.8,
      extreme: 1,
      impossible: 1.2,
    };
    return difficultyMap[difficulty];
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(correlations: CorrelationData[]): number {
    return correlations.length * 1024; // Rough estimate: 1KB per correlation
  }

  /**
   * Calculate accuracy
   */
  private calculateAccuracy(correlations: CorrelationData[]): number {
    const significantCorrelations = correlations.filter(c => c.correlation.significance > 0.5);
    return significantCorrelations.length / correlations.length;
  }

  /**
   * Calculate completeness
   */
  private calculateCompleteness(correlations: CorrelationData[], context: CorrelationCalculationContext): number {
    // Simplified completeness calculation
    const expectedCorrelations = context.parameters.methods.length * 20; // Rough estimate
    return Math.min(correlations.length / expectedCorrelations, 1);
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(context: CorrelationCalculationContext): string {
    const key = [
      context.metadata.calculationId,
      context.parameters.methods.join(','),
      context.parameters.minSampleSize,
      context.parameters.significanceThreshold,
      JSON.stringify(context.filters),
    ].join('|');
    
    return btoa(key);
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
      methodCount: this.correlationMethods.size,
      cacheHitRate: this.statistics.calculations > 0 ? this.statistics.cacheHits / this.statistics.calculations : 0,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
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
   * Get correlation methods
   */
  getCorrelationMethods(): CorrelationMethod[] {
    return Array.from(this.correlationMethods.values());
  }

  /**
   * Add custom correlation method
   */
  addCorrelationMethod(method: CorrelationMethod): void {
    this.correlationMethods.set(method.name, method);
  }

  /**
   * Remove correlation method
   */
  removeCorrelationMethod(name: string): boolean {
    return this.correlationMethods.delete(name);
  }
}
