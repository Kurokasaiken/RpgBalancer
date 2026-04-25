/**
 * Quest Reward Balancer JSON Export System
 * 
 * Comprehensive export functionality for quest reward balancing data,
 * KPI metrics, calibration results, and configuration management.
 * 
 * @since NP-021
 */

import type { QuestDefinition, QuestEffect } from '@/engine/quest/types';
import type { 
  QuestRewardKPI, 
  QuestRewardBalancerConfig, 
  RewardCalculationResult, 
  CalibrationSession 
} from './questRewardBalancer';
import type { 
  KPITrendAnalysis, 
  KPIBenchmark, 
  KPIAggregation 
} from './questRewardKPITracker';

/**
 * Export format versions
 */
export type ExportVersion = '1.0' | '1.1' | 'latest';

/**
 * Export data structure
 */
export interface QuestRewardBalancerExport {
  // Metadata
  version: ExportVersion;
  exportTimestamp: number;
  exportType: 'full' | 'kpi_only' | 'config_only' | 'session';
  
  // Configuration
  config?: QuestRewardBalancerConfig;
  
  // Quest data
  quests?: QuestExportData[];
  
  // KPI data
  kpiData?: {
    individual: Record<string, QuestRewardKPI[]>;
    trends: Record<string, KPITrendAnalysis>;
    benchmarks: Record<string, KPIBenchmark>;
    aggregation: KPIAggregation;
  };
  
  // Calibration results
  calibrationResults?: RewardCalculationResult[];
  
  // Session data
  session?: CalibrationSession;
  
  // Economic summary
  economicSummary?: {
    totalQuests: number;
    totalRewardValue: number;
    averageBalanceScore: number;
    resourceInflationRate: number;
    performanceDistribution: Record<string, number>;
  };
  
  // Validation results
  validation?: {
    errors: string[];
    warnings: string[];
    recommendations: string[];
  };
}

/**
 * Individual quest export data
 */
export interface QuestExportData {
  quest: QuestDefinition;
  originalRewards: QuestEffect[];
  balancedRewards: QuestEffect[];
  kpi: QuestRewardKPI;
  adjustments: Record<string, number>;
  confidence: number;
  metadata: {
    algorithm: string;
    iterations: number;
    convergenceTime: number;
    warnings: string[];
  };
}

/**
 * Export configuration options
 */
export interface ExportConfig {
  // Data selection
  includeConfig: boolean;
  includeQuestData: boolean;
  includeKPIData: boolean;
  includeCalibrationResults: boolean;
  includeSessionData: boolean;
  includeEconomicSummary: boolean;
  includeValidation: boolean;
  
  // Formatting options
  format: 'json' | 'csv' | 'xlsx';
  prettyPrint: boolean;
  includeMetadata: boolean;
  
  // Filtering options
  questTypeFilter?: string[];
  balanceScoreRange?: [number, number];
  dateRange?: {
    start: number;
    end: number;
  };
  
  // Compression
  compress: boolean;
  compressionLevel: number; // 1-9
}

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  includeConfig: true,
  includeQuestData: true,
  includeKPIData: true,
  includeCalibrationResults: true,
  includeSessionData: false,
  includeEconomicSummary: true,
  includeValidation: true,
  format: 'json',
  prettyPrint: true,
  includeMetadata: true,
  compress: false,
  compressionLevel: 6,
};

/**
 * Quest Reward Balancer Export Manager
 * 
 * Handles exporting of quest reward balancing data in various formats
 */
export class QuestRewardBalancerExportManager {
  private config: ExportConfig;

  constructor(config: Partial<ExportConfig> = {}) {
    this.config = { ...DEFAULT_EXPORT_CONFIG, ...config };
  }

  /**
   * Exports complete quest reward balancer data
   */
  public exportFull(
    config: QuestRewardBalancerConfig,
    quests: QuestDefinition[],
    originalRewards: Record<string, QuestEffect[]>,
    balancedRewards: Record<string, QuestEffect[]>,
    kpiData: Record<string, QuestRewardKPI[]>,
    calibrationResults: RewardCalculationResult[],
    session?: CalibrationSession
  ): QuestRewardBalancerExport {
    const exportData: QuestRewardBalancerExport = {
      version: 'latest',
      exportTimestamp: Date.now(),
      exportType: 'full',
    };

    // Add configuration
    if (this.config.includeConfig) {
      exportData.config = config;
    }

    // Add quest data
    if (this.config.includeQuestData) {
      exportData.quests = this.prepareQuestExportData(
        quests,
        originalRewards,
        balancedRewards,
        kpiData,
        calibrationResults
      );
    }

    // Add KPI data
    if (this.config.includeKPIData) {
      exportData.kpiData = {
        individual: kpiData,
        trends: {}, // Would be populated by KPI tracker
        benchmarks: {}, // Would be populated by KPI tracker
        aggregation: this.calculateAggregation(kpiData),
      };
    }

    // Add calibration results
    if (this.config.includeCalibrationResults) {
      exportData.calibrationResults = calibrationResults;
    }

    // Add session data
    if (this.config.includeSessionData && session) {
      exportData.session = session;
    }

    // Add economic summary
    if (this.config.includeEconomicSummary) {
      exportData.economicSummary = this.calculateEconomicSummary(
        quests,
        kpiData,
        calibrationResults
      );
    }

    // Add validation
    if (this.config.includeValidation) {
      exportData.validation = this.validateExportData(exportData);
    }

    return exportData;
  }

  /**
   * Exports only KPI data
   */
  public exportKPIOnly(
    kpiData: Record<string, QuestRewardKPI[]>,
    trends?: Record<string, KPITrendAnalysis>,
    benchmarks?: Record<string, KPIBenchmark>,
    aggregation?: KPIAggregation
  ): QuestRewardBalancerExport {
    return {
      version: 'latest',
      exportTimestamp: Date.now(),
      exportType: 'kpi_only',
      kpiData: {
        individual: kpiData,
        trends: trends || {},
        benchmarks: benchmarks || {},
        aggregation: aggregation || this.calculateAggregation(kpiData),
      },
    };
  }

  /**
   * Exports only configuration
   */
  public exportConfigOnly(config: QuestRewardBalancerConfig): QuestRewardBalancerExport {
    return {
      version: 'latest',
      exportTimestamp: Date.now(),
      exportType: 'config_only',
      config,
    };
  }

  /**
   * Exports session data
   */
  public exportSession(session: CalibrationSession): QuestRewardBalancerExport {
    return {
      version: 'latest',
      exportTimestamp: Date.now(),
      exportType: 'session',
      session,
    };
  }

  /**
   * Prepares quest data for export
   */
  private prepareQuestExportData(
    quests: QuestDefinition[],
    originalRewards: Record<string, QuestEffect[]>,
    balancedRewards: Record<string, QuestEffect[]>,
    kpiData: Record<string, QuestRewardKPI[]>,
    calibrationResults: RewardCalculationResult[]
  ): QuestExportData[] {
    return quests.map(quest => {
      const questId = quest.id;
      const original = originalRewards[questId] || [];
      const balanced = balancedRewards[questId] || [];
      const kpis = kpiData[questId] || [];
      const result = calibrationResults.find(r => r.questId === questId);

      return {
        quest,
        originalRewards: original,
        balancedRewards: balanced,
        kpi: kpis[kpis.length - 1] || this.createEmptyKPI(questId),
        adjustments: result?.adjustments || {},
        confidence: result?.confidence || 0,
        metadata: result?.metadata || {
          algorithm: 'unknown',
          iterations: 0,
          convergenceTime: 0,
          warnings: [],
        },
      };
    });
  }

  /**
   * Creates empty KPI for missing data
   */
  private createEmptyKPI(questId: string): QuestRewardKPI {
    return {
      questId,
      questType: 'unknown',
      difficulty: {
        overall: 0.5,
        combat: 0,
        stealth: 0,
        social: 0,
        exploration: 0,
        timePressure: 0,
        complexity: 0,
      },
      estimatedDuration: 300,
      participantCount: 1,
      totalRewardValue: 0,
      rewardDistribution: {
        resources: 0,
        experience: 0,
        items: 0,
        reputation: 0,
        skills: 0,
        special: 0,
      },
      rewardEfficiency: 0,
      riskRewardRatio: 0,
      successRate: 0.5,
      averageCompletionTime: 300,
      playerSatisfactionScore: 0.5,
      resourceInflation: 0,
      rarityScore: 0,
      repeatValue: 0.5,
      balanceScore: 0.5,
      overpoweredIndex: 0,
      underpoweredIndex: 0,
    };
  }

  /**
   * Calculates aggregation from KPI data
   */
  private calculateAggregation(kpiData: Record<string, QuestRewardKPI[]>): KPIAggregation {
    const allKPIs = Object.values(kpiData).flat();
    
    if (allKPIs.length === 0) {
      return this.createEmptyAggregation();
    }

    const questCount = allKPIs.length;
    const questTypes: Record<string, number> = {};
    
    allKPIs.forEach(kpi => {
      questTypes[kpi.questType] = (questTypes[kpi.questType] || 0) + 1;
    });

    const overallMetrics = {
      averageBalanceScore: allKPIs.reduce((sum, k) => sum + k.balanceScore, 0) / questCount,
      averageRewardEfficiency: allKPIs.reduce((sum, k) => sum + k.rewardEfficiency, 0) / questCount,
      averageSuccessRate: allKPIs.reduce((sum, k) => sum + k.successRate, 0) / questCount,
      averageCompletionTime: allKPIs.reduce((sum, k) => sum + k.averageCompletionTime, 0) / questCount,
      totalRewardValue: allKPIs.reduce((sum, k) => sum + k.totalRewardValue, 0),
      resourceInflationRate: allKPIs.reduce((sum, k) => sum + k.resourceInflation, 0) / questCount,
    };

    const distributionByType: Record<string, { count: number; averageBalanceScore: number; averageRewardEfficiency: number; averageSuccessRate: number; }> = {};
    Object.keys(questTypes).forEach(type => {
      const typeKPIs = allKPIs.filter(k => k.questType === type);
      distributionByType[type] = {
        count: typeKPIs.length,
        averageBalanceScore: typeKPIs.reduce((sum, k) => sum + k.balanceScore, 0) / typeKPIs.length,
        averageRewardEfficiency: typeKPIs.reduce((sum, k) => sum + k.rewardEfficiency, 0) / typeKPIs.length,
        averageSuccessRate: typeKPIs.reduce((sum, k) => sum + k.successRate, 0) / typeKPIs.length,
      };
    });

    const performanceTiers = {
      excellent: [] as string[],
      good: [] as string[],
      average: [] as string[],
      poor: [] as string[],
    };

    Object.entries(kpiData).forEach(([questId, kpis]) => {
      if (kpis.length === 0) return;
      const latest = kpis[kpis.length - 1];
      if (latest.balanceScore >= 0.9) performanceTiers.excellent.push(questId);
      else if (latest.balanceScore >= 0.75) performanceTiers.good.push(questId);
      else if (latest.balanceScore >= 0.6) performanceTiers.average.push(questId);
      else performanceTiers.poor.push(questId);
    });

    const economicImpact = {
      totalRewardsPerHour: overallMetrics.totalRewardValue / (overallMetrics.averageCompletionTime / 3600),
      resourceInflation: overallMetrics.resourceInflationRate,
      rarityDistribution: this.calculateRarityDistribution(allKPIs),
      repeatableQuestValue: allKPIs.reduce((sum, k) => sum + k.repeatValue, 0) / questCount,
    };

    return {
      questCount,
      questTypes,
      overallMetrics,
      distributionByType,
      performanceTiers,
      economicImpact,
    };
  }

  /**
   * Creates empty aggregation
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
   * Calculates economic summary
   */
  private calculateEconomicSummary(
    quests: QuestDefinition[],
    kpiData: Record<string, QuestRewardKPI[]>,
    _calibrationResults: RewardCalculationResult[]
  ) {
    const allKPIs = Object.values(kpiData).flat();
    const totalQuests = quests.length;
    const totalRewardValue = allKPIs.reduce((sum, k) => sum + k.totalRewardValue, 0);
    const averageBalanceScore = allKPIs.reduce((sum, k) => sum + k.balanceScore, 0) / Math.max(1, allKPIs.length);
    const resourceInflationRate = allKPIs.reduce((sum, k) => sum + k.resourceInflation, 0) / Math.max(1, allKPIs.length);

    const performanceDistribution = {
      excellent: allKPIs.filter(k => k.balanceScore >= 0.9).length,
      good: allKPIs.filter(k => k.balanceScore >= 0.75 && k.balanceScore < 0.9).length,
      average: allKPIs.filter(k => k.balanceScore >= 0.6 && k.balanceScore < 0.75).length,
      poor: allKPIs.filter(k => k.balanceScore < 0.6).length,
    };

    return {
      totalQuests,
      totalRewardValue,
      averageBalanceScore,
      resourceInflationRate,
      performanceDistribution,
    };
  }

  /**
   * Calculates rarity distribution
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
   * Validates export data
   */
  private validateExportData(data: QuestRewardBalancerExport) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate structure
    if (!data.version) {
      errors.push('Missing version information');
    }

    if (!data.exportTimestamp) {
      errors.push('Missing export timestamp');
    }

    // Validate quest data
    if (data.quests) {
      data.quests.forEach((questData, index) => {
        if (!questData.quest.id) {
          errors.push(`Quest at index ${index} missing ID`);
        }
        if (!questData.kpi) {
          warnings.push(`Quest ${questData.quest.id || 'unknown'} missing KPI data`);
        }
        if (questData.confidence < 0.5) {
          recommendations.push(`Consider reviewing quest ${questData.quest.id || 'unknown'} - low confidence`);
        }
      });
    }

    // Validate KPI data
    if (data.kpiData) {
      const totalKPIs = Object.values(data.kpiData.individual).reduce((sum, kpis) => sum + kpis.length, 0);
      if (totalKPIs === 0) {
        warnings.push('No KPI data available');
      }
    }

    // Validate economic summary
    if (data.economicSummary) {
      const { totalQuests, averageBalanceScore } = data.economicSummary;
      if (totalQuests === 0) {
        warnings.push('No quests in economic summary');
      }
      if (averageBalanceScore < 0.6) {
        recommendations.push('Overall balance score is low - review reward configuration');
      }
    }

    return {
      errors,
      warnings,
      recommendations,
    };
  }

  /**
   * Serializes export data to JSON string
   */
  public serialize(data: QuestRewardBalancerExport): string {
    const jsonString = JSON.stringify(data, null, this.config.prettyPrint ? 2 : 0);
    
    if (this.config.compress) {
      // In a real implementation, would use compression library
      return jsonString; // Placeholder
    }
    
    return jsonString;
  }

  /**
   * Deserializes JSON string to export data
   */
  public deserialize(jsonString: string): QuestRewardBalancerExport {
    try {
      const data = JSON.parse(jsonString) as QuestRewardBalancerExport;
      
      // Validate structure
      if (!data.version || !data.exportTimestamp) {
        throw new Error('Invalid export data structure');
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to deserialize export data: ${error}`);
    }
  }

  /**
   * Exports to file (Node.js environment)
   */
  public async exportToFile(
    data: QuestRewardBalancerExport,
    filePath: string
  ): Promise<void> {
    const { writeFileSync } = await import('fs');
    const serialized = this.serialize(data);
    
    try {
      writeFileSync(filePath, serialized, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write export file: ${error}`);
    }
  }

  /**
   * Imports from file (Node.js environment)
   */
  public async importFromFile(filePath: string): Promise<QuestRewardBalancerExport> {
    const { readFileSync } = await import('fs');
    
    try {
      const content = readFileSync(filePath, 'utf8');
      return this.deserialize(content);
    } catch (error) {
      throw new Error(`Failed to read import file: ${error}`);
    }
  }

  /**
   * Exports to CSV format
   */
  public exportToCSV(data: QuestRewardBalancerExport): string {
    if (!data.quests || data.quests.length === 0) {
      throw new Error('No quest data available for CSV export');
    }

    const headers = [
      'Quest ID',
      'Quest Type',
      'Balance Score',
      'Reward Efficiency',
      'Success Rate',
      'Total Reward Value',
      'Resource Inflation',
      'Confidence',
      'Original Rewards',
      'Balanced Rewards',
    ];

    const rows = data.quests.map(questData => [
      questData.quest.id,
      questData.kpi.questType,
      questData.kpi.balanceScore.toFixed(3),
      questData.kpi.rewardEfficiency.toFixed(2),
      (questData.kpi.successRate * 100).toFixed(1) + '%',
      questData.kpi.totalRewardValue.toFixed(0),
      (questData.kpi.resourceInflation * 100).toFixed(1) + '%',
      questData.confidence.toFixed(3),
      questData.originalRewards.length.toString(),
      questData.balancedRewards.length.toString(),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Gets current export configuration
   */
  public getConfig(): ExportConfig {
    return { ...this.config };
  }

  /**
   * Updates export configuration
   */
  public updateConfig(newConfig: Partial<ExportConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Creates export summary
   */
  public createSummary(data: QuestRewardBalancerExport): {
    exportType: string;
    version: string;
    timestamp: number;
    questCount: number;
    kpiDataPoints: number;
    fileSize: number;
  } {
    const questCount = data.quests?.length || 0;
    const kpiDataPoints = Object.values(data.kpiData?.individual || {}).reduce((sum, kpis) => sum + kpis.length, 0);
    const serialized = this.serialize(data);
    const fileSize = new Blob([serialized]).size;

    return {
      exportType: data.exportType,
      version: data.version,
      timestamp: data.exportTimestamp,
      questCount,
      kpiDataPoints,
      fileSize,
    };
  }
}

export default QuestRewardBalancerExportManager;
