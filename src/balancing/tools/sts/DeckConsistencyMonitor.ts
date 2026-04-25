/**
 * STS Deck Consistency Monitor
 * 
 * Monitors deck/preset consistency by comparing allocated points vs config weights,
 * with alerts for imbalances >5% and suggestions for fixes.
 */

import { z } from 'zod';
import { 
  DeckConsistencyResult, 
  CardConsistencyResult, 
  DeckConsistencyRules,
  PresetSchema,
  DEFAULT_DECK_CONSISTENCY_THRESHOLDS
} from '../../config/sts/deckRules';
import { saveData, loadData } from '../../../shared/persistence/PersistenceService';

/**
 * Deck consistency monitor configuration
 */
export interface DeckMonitorConfig {
  thresholds: {
    maxCardDeviationPercent: number;
    maxDeckDeviationPercent: number;
    minDeckSize: number;
    maxDeckSize: number;
    maxDuplicateCards: number;
    maxCostDeviationPercent: number;
  };
  telemetry: {
    enabled: boolean;
    namespace: string;
  };
  persistence: {
    namespace: string;
    lastPresetKey: string;
  };
}

/**
 * Deck consistency analysis options
 */
export interface AnalysisOptions {
  includeSuggestions: boolean;
  includeWarnings: boolean;
  strictMode: boolean;
  customThresholds?: Partial<DeckMonitorConfig['thresholds']>;
}

/**
 * Default monitor configuration
 */
export const DEFAULT_DECK_MONITOR_CONFIG: DeckMonitorConfig = {
  thresholds: DEFAULT_DECK_CONSISTENCY_THRESHOLDS,
  telemetry: {
    enabled: true,
    namespace: 'sts_deck_consistency',
  },
  persistence: {
    namespace: 'sts-deck-monitor',
    lastPresetKey: 'last_preset_analyzed',
  },
};

/**
 * STS Deck Consistency Monitor
 * 
 * Analyzes STS deck presets for consistency with balancing rules,
 * identifies imbalances, and provides actionable suggestions.
 */
export class DeckConsistencyMonitor {
  private rules: DeckConsistencyRules;
  private config: DeckMonitorConfig;
  private persistence: PersistenceService;

  constructor(config: Partial<DeckMonitorConfig> = {}) {
    this.config = { ...DEFAULT_DECK_MONITOR_CONFIG, ...config };
    this.rules = new DeckConsistencyRules(this.config.thresholds);
    this.persistence = new PersistenceService(this.config.persistence.namespace);
  }

  /**
   * Analyze a single deck preset for consistency
   */
  async analyzeDeck(preset: unknown, options: AnalysisOptions = {
    includeSuggestions: true,
    includeWarnings: true,
    strictMode: false,
  }): Promise<DeckConsistencyResult> {
    // Validate preset structure
    const validatedPreset = PresetSchema.parse(preset);
    
    // Store last analyzed preset for CLI interactive mode
    await this.persistence.saveData(this.config.persistence.lastPresetKey, {
      presetId: validatedPreset.id,
      analyzedAt: new Date().toISOString(),
    });

    // Analyze each card
    const cardResults: CardConsistencyResult[] = [];
    let totalActualPoints = 0;
    let totalExpectedPoints = 0;

    for (const card of validatedPreset.deck.cards) {
      const cardResult = this.analyzeCard(card, options);
      cardResults.push(cardResult);
      totalActualPoints += cardResult.actualPoints;
      totalExpectedPoints += cardResult.expectedPoints;
    }

    // Calculate overall deck consistency
    const totalDeviationPercent = this.rules.calculateDeviation(totalActualPoints, totalExpectedPoints);
    const isConsistent = totalDeviationPercent <= this.config.thresholds.maxDeckDeviationPercent;

    // Collect all warnings and suggestions
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Add card-specific warnings and suggestions
    cardResults.forEach(result => {
      if (options.includeWarnings) {
        warnings.push(...result.warnings);
      }
      if (options.includeSuggestions) {
        suggestions.push(...result.suggestions);
      }
    });

    // Add deck-level validation
    const deckSizeValidation = this.rules.validateDeckSize(validatedPreset.deck.cards.length);
    if (options.includeWarnings) {
      warnings.push(...deckSizeValidation.warnings);
    }

    const duplicateValidation = this.rules.validateDuplicates(validatedPreset.deck.cards);
    if (options.includeWarnings) {
      warnings.push(...duplicateValidation.warnings);
    }

    const costValidation = this.rules.validateCostDistribution(validatedPreset.deck.cards);
    if (options.includeWarnings) {
      warnings.push(...costValidation.warnings);
    }

    // Generate deck-level suggestions
    if (options.includeSuggestions) {
      suggestions.push(...this.generateDeckSuggestions(cardResults, validatedPreset));
    }

    // Calculate summary
    const consistentCards = cardResults.filter(r => r.isConsistent).length;
    const inconsistentCards = cardResults.filter(r => !r.isConsistent).length;
    const severity = this.rules.calculateSeverity(cardResults);

    return {
      deckId: validatedPreset.id,
      deckName: validatedPreset.name,
      totalCards: validatedPreset.deck.cards.length,
      actualTotalPoints: totalActualPoints,
      expectedTotalPoints: totalExpectedPoints,
      totalDeviationPercent,
      isConsistent,
      cardResults,
      warnings,
      suggestions,
      summary: {
        consistentCards,
        inconsistentCards,
        totalWarnings: warnings.length,
        severity,
      },
    };
  }

  /**
   * Analyze multiple deck presets
   */
  async analyzeMultipleDecks(presets: unknown[], options: AnalysisOptions = {
    includeSuggestions: true,
    includeWarnings: true,
    strictMode: false,
  }): Promise<DeckConsistencyResult[]> {
    const results: DeckConsistencyResult[] = [];
    
    for (const preset of presets) {
      try {
        const result = await this.analyzeDeck(preset, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to analyze preset:`, error);
        // Continue with other presets
      }
    }
    
    return results;
  }

  /**
   * Analyze a single card for consistency
   */
  private analyzeCard(card: any, options: AnalysisOptions): CardConsistencyResult {
    const expectedPoints = this.rules.calculateExpectedPoints(card);
    const actualPoints = this.rules.calculateActualPoints(card);
    const deviationPercent = this.rules.calculateDeviation(actualPoints, expectedPoints);
    const isConsistent = deviationPercent <= this.config.thresholds.maxCardDeviationPercent;

    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (options.includeWarnings) {
      if (!isConsistent) {
        warnings.push(`Card ${card.name} has ${deviationPercent.toFixed(1)}% deviation (threshold: ${this.config.thresholds.maxCardDeviationPercent}%)`);
      }
      
      if (card.quantity > 3 && !['strike', 'defend'].includes(card.name.toLowerCase())) {
        warnings.push(`High quantity for ${card.name}: ${card.quantity} copies`);
      }
    }

    if (options.includeSuggestions) {
      if (deviationPercent > 10) {
        suggestions.push(`Consider adjusting ${card.name} quantity or cost to reduce ${deviationPercent.toFixed(1)}% deviation`);
      }
      
      if (card.cost > 3 && card.type === 'attack') {
        suggestions.push(`High-cost attack card ${card.name} may be inefficient; consider cost reduction`);
      }
      
      if (!card.upgraded && card.quantity >= 2) {
        suggestions.push(`Consider upgrading ${card.name} for better efficiency`);
      }
    }

    return {
      cardId: card.id,
      cardName: card.name,
      actualPoints,
      expectedPoints,
      deviationPercent,
      isConsistent,
      warnings,
      suggestions,
    };
  }

  /**
   * Generate deck-level suggestions
   */
  private generateDeckSuggestions(cardResults: CardConsistencyResult[], preset: any): string[] {
    const suggestions: string[] = [];
    
    // Analyze cost curve
    const costDistribution = this.analyzeCostCurve(cardResults, preset.deck.cards);
    if (costDistribution.avgCost > 2.5) {
      suggestions.push('Deck has high average cost; consider adding more 0-1 cost cards');
    } else if (costDistribution.avgCost < 1.2) {
      suggestions.push('Deck has very low average cost; consider adding higher impact cards');
    }

    // Analyze type balance
    const typeBalance = this.analyzeTypeBalance(cardResults);
    if (typeBalance.attackPercentage < 30) {
      suggestions.push('Low attack card percentage; consider adding more damage sources');
    } else if (typeBalance.attackPercentage > 70) {
      suggestions.push('High attack card percentage; consider adding more skill/utility cards');
    }

    // Analyze upgrade level
    const upgradeStats = this.analyzeUpgrades(cardResults);
    if (upgradeStats.upgradedPercentage < 20) {
      suggestions.push('Low upgrade percentage; consider upgrading key cards');
    }

    return suggestions;
  }

  /**
   * Analyze deck cost curve
   */
  private analyzeCostCurve(cardResults: CardConsistencyResult[], cards: any[]) {
    const totalCost = cards.reduce((sum, card) => sum + (card.cost * card.quantity), 0);
    const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
    const avgCost = totalCost / totalCards;

    return { avgCost };
  }

  /**
   * Analyze card type balance
   */
  private analyzeTypeBalance(cardResults: CardConsistencyResult[]) {
    const typeCounts = new Map<string, number>();
    
    // This would need access to original card data - simplified for now
    const totalCards = cardResults.length;
    const attackCards = cardResults.filter(r => r.cardName.toLowerCase().includes('strike') || 
                                                   r.cardName.toLowerCase().includes('bash') ||
                                                   r.cardName.toLowerCase().includes('cleave')).length;
    
    const attackPercentage = (attackCards / totalCards) * 100;

    return { attackPercentage };
  }

  /**
   * Analyze upgrade statistics
   */
  private analyzeUpgrades(cardResults: CardConsistencyResult[]) {
    // This would need access to original card data - simplified for now
    const totalCards = cardResults.length;
    const upgradedCards = Math.floor(totalCards * 0.3); // Placeholder
    
    const upgradedPercentage = (upgradedCards / totalCards) * 100;

    return { upgradedPercentage, upgradedCards };
  }

  /**
   * Get last analyzed preset information
   */
  async getLastAnalyzedPreset(): Promise<{ presetId: string; analyzedAt: string } | null> {
    try {
      return await this.persistence.loadData(this.config.persistence.lastPresetKey);
    } catch {
      return null;
    }
  }

  /**
   * Export analysis results to JSON
   */
  exportToJSON(results: DeckConsistencyResult[]): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      config: this.config,
      results,
      summary: {
        totalDecks: results.length,
        consistentDecks: results.filter(r => r.isConsistent).length,
        inconsistentDecks: results.filter(r => !r.isConsistent).length,
        averageDeviation: results.reduce((sum, r) => sum + r.totalDeviationPercent, 0) / results.length,
      },
    }, null, 2);
  }

  /**
   * Export analysis results to Markdown
   */
  exportToMarkdown(results: DeckConsistencyResult[]): string {
    const lines: string[] = [
      '# STS Deck Consistency Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Total Decks: ${results.length}`,
      '',
      '## Summary',
      '',
      '| Deck | Cards | Deviation | Status | Severity |',
      '|------|-------|-----------|--------|----------|',
    ];

    results.forEach(result => {
      const status = result.isConsistent ? '✅ Consistent' : '❌ Inconsistent';
      const severity = result.summary.severity.toUpperCase();
      lines.push(`| ${result.deckName} | ${result.totalCards} | ${result.totalDeviationPercent.toFixed(1)}% | ${status} | ${severity} |`);
    });

    lines.push('', '## Detailed Analysis', '');

    results.forEach(result => {
      lines.push(`### ${result.deckName}`, '');
      lines.push(`- **Total Cards**: ${result.totalCards}`);
      lines.push(`- **Deviation**: ${result.totalDeviationPercent.toFixed(1)}%`);
      lines.push(`- **Status**: ${result.isConsistent ? 'Consistent' : 'Inconsistent'}`);
      lines.push(`- **Severity**: ${result.summary.severity.toUpperCase()}`);
      lines.push(`- **Consistent Cards**: ${result.summary.consistentCards}/${result.totalCards}`);
      
      if (result.warnings.length > 0) {
        lines.push('', '**Warnings**:', '');
        result.warnings.forEach(warning => {
          lines.push(`- ⚠️ ${warning}`);
        });
      }

      if (result.suggestions.length > 0) {
        lines.push('', '**Suggestions**:', '');
        result.suggestions.forEach(suggestion => {
          lines.push(`- 💡 ${suggestion}`);
        });
      }

      lines.push('');
    });

    return lines.join('\n');
  }
}
