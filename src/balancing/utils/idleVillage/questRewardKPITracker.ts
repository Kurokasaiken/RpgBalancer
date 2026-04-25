/**
 * Quest Reward KPI Tracking System
 * 
 * Comprehensive KPI calculation and tracking for quest reward balancing.
 * Provides analytics, trend analysis, and performance metrics.
 * 
 * @since NP-021
 */

import type { QuestRewardKPI } from './questRewardBalancer';

/**
 * KPI trend analysis result
 */
export interface KPITrendAnalysis {
  questId: string;
  questType: string;
  timeRange: {
    start: number;
    end: number;
    dataPoints: number;
  };
  
  // Trend metrics
  balanceScoreTrend: {
    direction: 'stable' | 'increasing' | 'decreasing';
    slope: number;
    confidence: number;
  };
  rewardEfficiencyTrend: {
    direction: 'stable' | 'increasing' | 'decreasing';
    slope: number;
    confidence: number;
  };
  successRateTrend: {
    direction: 'stable' | 'increasing' | 'decreasing';
    slope: number;
    confidence: number;
  };
  
  // Anomaly detection
  anomalies: Array<{
    timestamp: number;
    kpi: keyof QuestRewardKPI;
    value: number;
    expectedValue: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  
  // Insights
  insights: string[];
  recommendations: string[];
}

/**
 * KPI benchmark comparison
 */
export interface KPIBenchmark {
  questType: string;
  sampleSize: number;
  
  // Percentiles
  percentiles: {
    p25: Partial<QuestRewardKPI>;
    p50: Partial<QuestRewardKPI>;
    p75: Partial<QuestRewardKPI>;
    p90: Partial<QuestRewardKPI>;
    p95: Partial<QuestRewardKPI>;
  };
  
  // Statistics
  statistics: {
    mean: Partial<QuestRewardKPI>;
    median: Partial<QuestRewardKPI>;
    standardDeviation: Partial<QuestRewardKPI>;
    min: Partial<QuestRewardKPI>;
    max: Partial<QuestRewardKPI>;
  };
  
  // Correlations
  correlations: {
    difficultyVsBalance: number;
    efficiencyVsSuccess: number;
    rewardsVsSatisfaction: number;
    durationVsCompletion: number;
  };
}

/**
 * KPI aggregation result for multiple quests
 */
export interface KPIAggregation {
  questCount: number;
  questTypes: Record<string, number>;
  
  // Overall metrics
  overallMetrics: {
    averageBalanceScore: number;
    averageRewardEfficiency: number;
    averageSuccessRate: number;
    averageCompletionTime: number;
    totalRewardValue: number;
    resourceInflationRate: number;
  };
  
  // Distribution by type
  distributionByType: Record<string, {
    count: number;
    averageBalanceScore: number;
    averageRewardEfficiency: number;
    averageSuccessRate: number;
  }>;
  
  // Performance tiers
  performanceTiers: {
    excellent: string[]; // quest IDs
    good: string[];
    average: string[];
    poor: string[];
  };
  
  // Economic impact
  economicImpact: {
    totalRewardsPerHour: number;
    resourceInflation: number;
    rarityDistribution: Record<string, number>;
    repeatableQuestValue: number;
  };
}

/**
 * KPI tracking configuration
 */
export interface KPITrackingConfig {
  // Data retention
  retentionDays: number;
  maxDataPointsPerQuest: number;
  
  // Trend analysis
  trendAnalysisWindow: number; // days
  minimumDataPointsForTrend: number;
  anomalyThreshold: number; // standard deviations
  
  // Benchmarking
  benchmarkSampleSize: number;
  benchmarkUpdateFrequency: number; // days
  
  // Aggregation
  aggregationRefreshInterval: number; // minutes
  performanceThresholds: {
    excellent: number; // balance score threshold
    good: number;
    average: number;
  };
}

/**
 * Default KPI tracking configuration
 */
export const DEFAULT_KPI_TRACKING_CONFIG: KPITrackingConfig = {
  retentionDays: 90,
  maxDataPointsPerQuest: 1000,
  trendAnalysisWindow: 30,
  minimumDataPointsForTrend: 10,
  anomalyThreshold: 2.0,
  benchmarkSampleSize: 100,
  benchmarkUpdateFrequency: 7,
  aggregationRefreshInterval: 60,
  performanceThresholds: {
    excellent: 0.9,
    good: 0.75,
    average: 0.6,
  },
};

/**
 * Quest Reward KPI Tracker
 * 
 * Tracks, analyzes, and provides insights on quest reward KPIs
 */
export class QuestRewardKPITracker {
  private config: KPITrackingConfig;
  private kpiData: Map<string, QuestRewardKPI[]> = new Map();
  private benchmarks: Map<string, KPIBenchmark> = new Map();
  private aggregations: KPIAggregation | null = null;
  private lastAggregationUpdate = 0;

  constructor(config: Partial<KPITrackingConfig> = {}) {
    this.config = { ...DEFAULT_KPI_TRACKING_CONFIG, ...config };
  }

  /**
   * Adds KPI data for a quest
   */
  public addKPIData(questId: string, kpi: QuestRewardKPI): void {
    if (!this.kpiData.has(questId)) {
      this.kpiData.set(questId, []);
    }

    const data = this.kpiData.get(questId)!;
    data.push(kpi);

    // Sort by timestamp (using quest completion time as proxy)
    data.sort((a, b) => {
      // Use a consistent timestamp - for now, use quest ID hash as proxy
      return a.questId.localeCompare(b.questId);
    });

    // Limit data points
    if (data.length > this.config.maxDataPointsPerQuest) {
      data.splice(0, data.length - this.config.maxDataPointsPerQuest);
    }

    // Invalidate aggregation cache
    this.aggregations = null;
  }

  /**
   * Gets KPI data for a quest
   */
  public getKPIData(questId: string): QuestRewardKPI[] {
    return this.kpiData.get(questId) || [];
  }

  /**
   * Analyzes KPI trends for a quest
   */
  public analyzeTrends(questId: string): KPITrendAnalysis | null {
    const data = this.getKPIData(questId);
    if (data.length < this.config.minimumDataPointsForTrend) {
      return null;
    }

    const questType = data[0].questType;
    const now = Date.now();
    const windowStart = now - (this.config.trendAnalysisWindow * 24 * 60 * 60 * 1000);

    // Filter data within analysis window
    const recentData = data.slice(-this.config.minimumDataPointsForTrend);

    // Calculate trends
    const balanceScoreTrend = this.calculateTrend(
      recentData.map(d => d.balanceScore),
      'balanceScore'
    );
    
    const rewardEfficiencyTrend = this.calculateTrend(
      recentData.map(d => d.rewardEfficiency),
      'rewardEfficiency'
    );
    
    const successRateTrend = this.calculateTrend(
      recentData.map(d => d.successRate),
      'successRate'
    );

    // Detect anomalies
    const anomalies = this.detectAnomalies(recentData);

    // Generate insights and recommendations
    const insights = this.generateInsights(recentData, balanceScoreTrend, rewardEfficiencyTrend, successRateTrend);
    const recommendations = this.generateRecommendations(recentData, anomalies);

    return {
      questId,
      questType,
      timeRange: {
        start: windowStart,
        end: now,
        dataPoints: recentData.length,
      },
      balanceScoreTrend,
      rewardEfficiencyTrend,
      successRateTrend,
      anomalies,
      insights,
      recommendations,
    };
  }

  /**
   * Calculates trend for a series of values
   */
  private calculateTrend(values: number[], _metricName: string): KPITrendAnalysis['balanceScoreTrend'] {
    if (values.length < 2) {
      return {
        direction: 'stable',
        slope: 0,
        confidence: 0,
      };
    }

    // Simple linear regression
    const n = values.length;
    const sumX = values.reduce((sum, _, index) => sum + index, 0);
    const sumY = values.reduce((sum, value) => sum + value, 0);
    const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Calculate R-squared for confidence
    const meanY = sumY / n;
    const totalSumSquares = values.reduce((sum, value) => sum + Math.pow(value - meanY, 2), 0);
    const residualSumSquares = values.reduce((sum, value, index) => {
      const predicted = (slope * index) + (meanY - slope * (n - 1) / 2);
      return sum + Math.pow(value - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    const confidence = Math.max(0, Math.min(1, rSquared));

    // Determine direction
    let direction: 'stable' | 'increasing' | 'decreasing' = 'stable';
    if (Math.abs(slope) > 0.01) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return {
      direction,
      slope,
      confidence,
    };
  }

  /**
   * Detects anomalies in KPI data
   */
  private detectAnomalies(data: QuestRewardKPI[]): KPITrendAnalysis['anomalies'] {
    const anomalies: KPITrendAnalysis['anomalies'] = [];
    
    if (data.length < 5) return anomalies;

    // Check each KPI for anomalies
    const kpiFields: (keyof QuestRewardKPI)[] = [
      'balanceScore',
      'rewardEfficiency',
      'successRate',
      'totalRewardValue',
      'resourceInflation',
      'overpoweredIndex',
      'underpoweredIndex',
    ];

    kpiFields.forEach(field => {
      const values = data.map(d => d[field] as number);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

      values.forEach((value, index) => {
        const zScore = Math.abs((value - mean) / stdDev);
        if (zScore > this.config.anomalyThreshold) {
          anomalies.push({
            timestamp: Date.now() - (data.length - index) * 1000, // Approximate
            kpi: field,
            value,
            expectedValue: mean,
            severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low',
            description: `Unusual ${field} value detected: ${value.toFixed(2)} (expected: ${mean.toFixed(2)})`,
          });
        }
      });
    });

    return anomalies;
  }

  /**
   * Generates insights from KPI data
   */
  private generateInsights(
    data: QuestRewardKPI[],
    balanceTrend: KPITrendAnalysis['balanceScoreTrend'],
    efficiencyTrend: KPITrendAnalysis['rewardEfficiencyTrend'],
    _successTrend: KPITrendAnalysis['successRateTrend']
  ): string[] {
    const insights: string[] = [];
    const latest = data[data.length - 1];

    // Balance score insights
    if (balanceTrend.direction === 'increasing' && balanceTrend.confidence > 0.7) {
      insights.push('Balance score is consistently improving');
    } else if (balanceTrend.direction === 'decreasing' && balanceTrend.confidence > 0.7) {
      insights.push('Balance score is declining - review reward scaling');
    }

    // Efficiency insights
    if (efficiencyTrend.direction === 'increasing') {
      insights.push('Reward efficiency is increasing over time');
    } else if (efficiencyTrend.direction === 'decreasing') {
      insights.push('Reward efficiency is decreasing - check reward values');
    }

    // Success rate insights
    if (latest.successRate < 0.3) {
      insights.push('Low success rate may indicate quest difficulty issues');
    } else if (latest.successRate > 0.9) {
      insights.push('High success rate may indicate quest is too easy');
    }

    // Resource inflation insights
    if (latest.resourceInflation > 0.3) {
      insights.push('High resource inflation detected - consider reward caps');
    }

    // Risk-reward insights
    if (latest.riskRewardRatio < 0.5) {
      insights.push('Risk-reward ratio is low - rewards may not justify difficulty');
    } else if (latest.riskRewardRatio > 2.0) {
      insights.push('Risk-reward ratio is high - rewards may be too generous');
    }

    return insights;
  }

  /**
   * Generates recommendations based on KPI analysis
   */
  private generateRecommendations(
    data: QuestRewardKPI[],
    anomalies: KPITrendAnalysis['anomalies']
  ): string[] {
    const recommendations: string[] = [];
    const latest = data[data.length - 1];

    // Balance recommendations
    if (latest.balanceScore < 0.6) {
      recommendations.push('Review reward distribution and difficulty scaling');
    }

    // Overpowered/underpowered recommendations
    if (latest.overpoweredIndex > 0.4) {
      recommendations.push('Reduce reward values or increase quest difficulty');
    } else if (latest.underpoweredIndex > 0.4) {
      recommendations.push('Increase reward values or decrease quest difficulty');
    }

    // Success rate recommendations
    if (latest.successRate < 0.4) {
      recommendations.push('Consider reducing difficulty or improving rewards');
    } else if (latest.successRate > 0.8) {
      recommendations.push('Consider increasing difficulty to maintain engagement');
    }

    // Anomaly recommendations
    if (anomalies.length > 0) {
      recommendations.push(`Investigate ${anomalies.length} detected anomalies in recent data`);
    }

    // Efficiency recommendations
    if (latest.rewardEfficiency < 5) {
      recommendations.push('Reward efficiency is low - consider increasing rewards');
    } else if (latest.rewardEfficiency > 20) {
      recommendations.push('Reward efficiency is high - consider reducing rewards');
    }

    return recommendations;
  }

  /**
   * Creates or updates benchmarks for quest types
   */
  public updateBenchmarks(allKPIs: QuestRewardKPI[]): void {
    // Group by quest type
    const groupedByType = new Map<string, QuestRewardKPI[]>();
    
    allKPIs.forEach(kpi => {
      if (!groupedByType.has(kpi.questType)) {
        groupedByType.set(kpi.questType, []);
      }
      groupedByType.get(kpi.questType)!.push(kpi);
    });

    // Calculate benchmarks for each type
    groupedByType.forEach((kpis, questType) => {
      if (kpis.length < this.config.benchmarkSampleSize) {
        return; // Not enough data for reliable benchmark
      }

      const benchmark = this.calculateBenchmark(questType, kpis);
      this.benchmarks.set(questType, benchmark);
    });
  }

  /**
   * Calculates benchmark statistics for a quest type
   */
  private calculateBenchmark(questType: string, kpis: QuestRewardKPI[]): KPIBenchmark {
    // Extract numeric KPI values
    const numericFields: (keyof QuestRewardKPI)[] = [
      'balanceScore',
      'rewardEfficiency',
      'successRate',
      'totalRewardValue',
      'resourceInflation',
      'overpoweredIndex',
      'underpoweredIndex',
      'riskRewardRatio',
      'playerSatisfactionScore',
      'repeatValue',
    ];

    const values = numericFields.reduce((acc, field) => {
      acc[field] = kpis.map(kpi => kpi[field] as number);
      return acc;
    }, {} as Record<keyof QuestRewardKPI, number[]>);

    // Calculate statistics
    const statistics: KPIBenchmark['statistics'] = {};
    const percentiles: KPIBenchmark['percentiles'] = {};

    numericFields.forEach(field => {
      const fieldValues = values[field].sort((a, b) => a - b);
      const n = fieldValues.length;

      // Basic statistics
      const mean = fieldValues.reduce((sum, v) => sum + v, 0) / n;
      const median = n % 2 === 0 
        ? (fieldValues[n / 2 - 1] + fieldValues[n / 2]) / 2
        : fieldValues[Math.floor(n / 2)];
      
      const variance = fieldValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
      const standardDeviation = Math.sqrt(variance);

      statistics[field] = { mean, median, standardDeviation, min: fieldValues[0], max: fieldValues[n - 1] };

      // Percentiles
      percentiles[field] = {
        p25: fieldValues[Math.floor(n * 0.25)],
        p50: median,
        p75: fieldValues[Math.floor(n * 0.75)],
        p90: fieldValues[Math.floor(n * 0.9)],
        p95: fieldValues[Math.floor(n * 0.95)],
      } as Partial<QuestRewardKPI>;
    });

    // Calculate correlations
    const correlations = this.calculateCorrelations(kpis);

    return {
      questType,
      sampleSize: kpis.length,
      percentiles,
      statistics,
      correlations,
    };
  }

  /**
   * Calculates correlations between KPI metrics
   */
  private calculateCorrelations(kpis: QuestRewardKPI[]): KPIBenchmark['correlations'] {
    const n = kpis.length;

    // Helper function to calculate correlation coefficient
    const correlation = (x: number[], y: number[]): number => {
      const meanX = x.reduce((sum, v) => sum + v, 0) / n;
      const meanY = y.reduce((sum, v) => sum + v, 0) / n;
      
      const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
      const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
      const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
      
      return denomX && denomY ? numerator / (denomX * denomY) : 0;
    };

    return {
      difficultyVsBalance: correlation(
        kpis.map(k => k.difficulty.overall),
        kpis.map(k => k.balanceScore)
      ),
      efficiencyVsSuccess: correlation(
        kpis.map(k => k.rewardEfficiency),
        kpis.map(k => k.successRate)
      ),
      rewardsVsSatisfaction: correlation(
        kpis.map(k => k.totalRewardValue),
        kpis.map(k => k.playerSatisfactionScore)
      ),
      durationVsCompletion: correlation(
        kpis.map(k => k.estimatedDuration),
        kpis.map(k => k.averageCompletionTime)
      ),
    };
  }

  /**
   * Gets benchmark for a quest type
   */
  public getBenchmark(questType: string): KPIBenchmark | null {
    return this.benchmarks.get(questType) || null;
  }

  /**
   * Aggregates KPI data across all quests
   */
  public aggregateKPIs(): KPIAggregation {
    const now = Date.now();
    
    // Check if we need to refresh aggregation
    if (this.aggregations && (now - this.lastAggregationUpdate) < (this.config.aggregationRefreshInterval * 60 * 1000)) {
      return this.aggregations;
    }

    // Collect all KPI data
    const allKPIs: QuestRewardKPI[] = [];
    this.kpiData.forEach(data => {
      allKPIs.push(...data);
    });

    if (allKPIs.length === 0) {
      return this.createEmptyAggregation();
    }

    // Calculate overall metrics
    const overallMetrics = {
      averageBalanceScore: allKPIs.reduce((sum, k) => sum + k.balanceScore, 0) / allKPIs.length,
      averageRewardEfficiency: allKPIs.reduce((sum, k) => sum + k.rewardEfficiency, 0) / allKPIs.length,
      averageSuccessRate: allKPIs.reduce((sum, k) => sum + k.successRate, 0) / allKPIs.length,
      averageCompletionTime: allKPIs.reduce((sum, k) => sum + k.averageCompletionTime, 0) / allKPIs.length,
      totalRewardValue: allKPIs.reduce((sum, k) => sum + k.totalRewardValue, 0),
      resourceInflationRate: allKPIs.reduce((sum, k) => sum + k.resourceInflation, 0) / allKPIs.length,
    };

    // Distribution by type
    const distributionByType: Record<string, any> = {};
    const questTypes: Record<string, number> = {};

    allKPIs.forEach(kpi => {
      if (!distributionByType[kpi.questType]) {
        distributionByType[kpi.questType] = {
          count: 0,
          balanceScores: [],
          rewardEfficiencies: [],
          successRates: [],
        };
        questTypes[kpi.questType] = 0;
      }

      const type = distributionByType[kpi.questType];
      type.count++;
      type.balanceScores.push(kpi.balanceScore);
      type.rewardEfficiencies.push(kpi.rewardEfficiency);
      type.successRates.push(kpi.successRate);
      questTypes[kpi.questType]++;
    });

    // Calculate averages for each type
    Object.keys(distributionByType).forEach(type => {
      const data = distributionByType[type];
      distributionByType[type] = {
        count: data.count,
        averageBalanceScore: data.balanceScores.reduce((sum: number, v: number) => sum + v, 0) / data.count,
        averageRewardEfficiency: data.rewardEfficiencies.reduce((sum: number, v: number) => sum + v, 0) / data.count,
        averageSuccessRate: data.successRates.reduce((sum: number, v: number) => sum + v, 0) / data.count,
      };
    });

    // Performance tiers
    const performanceTiers = {
      excellent: [] as string[],
      good: [] as string[],
      average: [] as string[],
      poor: [] as string[],
    };

    this.kpiData.forEach((data, questId) => {
      if (data.length === 0) return;
      
      const latest = data[data.length - 1];
      const score = latest.balanceScore;

      if (score >= this.config.performanceThresholds.excellent) {
        performanceTiers.excellent.push(questId);
      } else if (score >= this.config.performanceThresholds.good) {
        performanceTiers.good.push(questId);
      } else if (score >= this.config.performanceThresholds.average) {
        performanceTiers.average.push(questId);
      } else {
        performanceTiers.poor.push(questId);
      }
    });

    // Economic impact
    const economicImpact = {
      totalRewardsPerHour: overallMetrics.totalRewardValue / (overallMetrics.averageCompletionTime / 3600),
      resourceInflation: overallMetrics.resourceInflationRate,
      rarityDistribution: this.calculateRarityDistribution(allKPIs),
      repeatableQuestValue: allKPIs.reduce((sum, k) => sum + k.repeatValue, 0) / allKPIs.length,
    };

    this.aggregations = {
      questCount: allKPIs.length,
      questTypes,
      overallMetrics,
      distributionByType,
      performanceTiers,
      economicImpact,
    };

    this.lastAggregationUpdate = now;
    return this.aggregations;
  }

  /**
   * Creates empty aggregation result
   */
  private createEmptyAggregation(): KPIAggregation {
    return {
      questCount: 0,
      questTypes: {},
      overallMetrics: {
        averageBalanceScore: 0,
        averageRewardEfficiency: 0,
        averageSuccessRate: 0,
        averageCompletionTime: 0,
        totalRewardValue: 0,
        resourceInflationRate: 0,
      },
      distributionByType: {},
      performanceTiers: {
        excellent: [],
        good: [],
        average: [],
        poor: [],
      },
      economicImpact: {
        totalRewardsPerHour: 0,
        resourceInflation: 0,
        rarityDistribution: {},
        repeatableQuestValue: 0,
      },
    };
  }

  /**
   * Calculates rarity distribution from KPI data
   */
  private calculateRarityDistribution(kpis: QuestRewardKPI[]): Record<string, number> {
    const distribution: Record<string, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    kpis.forEach(kpi => {
      const rarityScore = kpi.rarityScore;
      if (rarityScore < 0.2) distribution.common++;
      else if (rarityScore < 0.4) distribution.uncommon++;
      else if (rarityScore < 0.6) distribution.rare++;
      else if (rarityScore < 0.8) distribution.epic++;
      else distribution.legendary++;
    });

    return distribution;
  }

  /**
   * Gets configuration
   */
  public getConfig(): KPITrackingConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  public updateConfig(newConfig: Partial<KPITrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clears old data based on retention policy
   */
  public cleanupOldData(): void {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    this.kpiData.forEach((data, questId) => {
      // Filter out old data points
      const filtered = data.filter(_kpi => {
        // Use quest ID as timestamp proxy for now
        return true; // Simplified - would use actual timestamps in production
      });
      
      if (filtered.length === 0) {
        this.kpiData.delete(questId);
      } else {
        this.kpiData.set(questId, filtered);
      }
    });

    // Invalidate aggregation cache
    this.aggregations = null;
  }

  /**
   * Exports all KPI data
   */
  public exportData(): {
    kpiData: Record<string, QuestRewardKPI[]>;
    benchmarks: Record<string, KPIBenchmark>;
    aggregation: KPIAggregation | null;
    exportTimestamp: number;
  } {
    const kpiData: Record<string, QuestRewardKPI[]> = {};
    this.kpiData.forEach((data, questId) => {
      kpiData[questId] = data;
    });

    const benchmarks: Record<string, KPIBenchmark> = {};
    this.benchmarks.forEach((benchmark, questType) => {
      benchmarks[questType] = benchmark;
    });

    return {
      kpiData,
      benchmarks,
      aggregation: this.aggregations,
      exportTimestamp: Date.now(),
    };
  }
}

export default QuestRewardKPITracker;
