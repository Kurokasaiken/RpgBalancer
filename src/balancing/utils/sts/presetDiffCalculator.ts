/**
 * STS Preset Diff Calculator
 * 
 * Core engine for comparing STS presets and generating detailed diff analysis.
 * Supports card, relic, enemy, simulation parameter, and metadata comparisons.
 * 
 * @module PresetDiffCalculator
 * @since 2026-01-13
 * @author Cascade
 */

import type { STSPreset, STSCardConfig, STSRelicItem, STSEnemyProfile, STSSimulationParams } from '../../config/sts/presetTypes';
import type { PresetDiffConfig, DiffSeverity, DiffCategory } from '../../config/sts/presetDiffConfig';
import { DEFAULT_PRESET_DIFF_CONFIG } from '../../config/sts/presetDiffConfig';

/**
 * Card difference result
 */
export interface CardDiff {
  /** Card identifier */
  cardId: string;
  /** Card name */
  cardName: string;
  /** Type of change */
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  /** Severity of the change */
  severity: DiffSeverity;
  /** Old card configuration (if modified) */
  oldCard?: STSCardConfig;
  /** New card configuration (if modified or added) */
  newCard?: STSCardConfig;
  /** Specific changes for modified cards */
  changes?: {
    quantityChanged: boolean;
    costChanged: boolean;
    upgradedChanged: boolean;
    tagsChanged: boolean;
  };
}

/**
 * Relic difference result
 */
export interface RelicDiff {
  /** Relic identifier */
  relicId: string;
  /** Relic name */
  relicName: string;
  /** Type of change */
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  /** Severity of the change */
  severity: DiffSeverity;
  /** Old relic configuration (if modified) */
  oldRelic?: STSRelicItem;
  /** New relic configuration (if modified or added) */
  newRelic?: STSRelicItem;
  /** Specific changes for modified relics */
  changes?: {
    tierChanged: boolean;
    descriptionChanged: boolean;
    countersChanged: boolean;
  };
}

/**
 * Enemy profile difference result
 */
export interface EnemyDiff {
  /** Enemy identifier */
  enemyId: string;
  /** Enemy name */
  enemyName: string;
  /** Type of change */
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  /** Severity of the change */
  severity: DiffSeverity;
  /** Old enemy configuration (if modified) */
  oldEnemy?: STSEnemyProfile;
  /** New enemy configuration (if modified or added) */
  newEnemy?: STSEnemyProfile;
  /** Specific changes for modified enemies */
  changes?: {
    hpChanged: boolean;
    damageChanged: boolean;
    typeChanged: boolean;
    modifiersChanged: boolean;
    aiChanged: boolean;
  };
}

/**
 * Simulation parameters difference result
 */
export interface SimulationDiff {
  /** Type of change */
  changeType: 'modified' | 'unchanged';
  /** Severity of the change */
  severity: DiffSeverity;
  /** Old simulation parameters */
  oldParams?: STSSimulationParams;
  /** New simulation parameters */
  newParams?: STSSimulationParams;
  /** Specific changes */
  changes?: {
    iterationsChanged: boolean;
    seedChanged: boolean;
    maxTurnsChanged: boolean;
    deterministicChanged: boolean;
  };
}

/**
 * Metadata difference result
 */
export interface MetadataDiff {
  /** Type of change */
  changeType: 'modified' | 'unchanged';
  /** Severity of the change */
  severity: DiffSeverity;
  /** Specific changes */
  changes?: {
    versionChanged: boolean;
    difficultyChanged: boolean;
    estimatedWinRateChanged: boolean;
    recommendedForBeginnersChanged: boolean;
    notesChanged: boolean;
  };
}

/**
 * Complete preset diff analysis result
 */
export interface PresetDiffResult {
  /** Unique identifier for this diff analysis */
  id: string;
  /** Comparison metadata */
  comparison: {
    /** Baseline preset ID */
    baselinePresetId: string;
    /** Baseline preset name */
    baselinePresetName: string;
    /** Comparison preset ID */
    comparisonPresetId: string;
    /** Comparison preset name */
    comparisonPresetName: string;
    /** Analysis timestamp */
    timestamp: number;
    /** Analysis duration in milliseconds */
    duration: number;
  };
  /** Card differences */
  cardDiffs: CardDiff[];
  /** Relic differences */
  relicDiffs: RelicDiff[];
  /** Enemy profile differences */
  enemyDiffs: EnemyDiff[];
  /** Simulation parameter differences */
  simulationDiff: SimulationDiff | null;
  /** Metadata differences */
  metadataDiff: MetadataDiff | null;
  /** Summary statistics */
  summary: {
    /** Total number of changes */
    totalChanges: number;
    /** Changes by severity */
    changesBySeverity: Record<DiffSeverity, number>;
    /** Changes by category */
    changesByCategory: Record<DiffCategory, number>;
    /** Overall compatibility score (0-1) */
    compatibilityScore: number;
    /** Recommended action */
    recommendedAction: 'safe_upgrade' | 'caution_required' | 'breaking_change' | 'identical';
  };
}

/**
 * Preset diff calculator engine
 */
export class PresetDiffCalculator {
  private config: PresetDiffConfig;

  /**
   * Create a new preset diff calculator
   * 
   * @param config - Configuration for diff analysis
   */
  constructor(config: PresetDiffConfig = DEFAULT_PRESET_DIFF_CONFIG) {
    this.config = config;
  }

  /**
   * Compare two STS presets and generate detailed diff analysis
   * 
   * @param baselinePreset - The baseline preset to compare against
   * @param comparisonPreset - The preset to compare
   * @returns Complete diff analysis result
   * 
   * @example
   * ```typescript
   * const calculator = new PresetDiffCalculator();
   * const diff = calculator.comparePresets(preset1, preset2);
   * console.log(`Found ${diff.summary.totalChanges} changes`);
   * ```
   */
  comparePresets(baselinePreset: STSPreset, comparisonPreset: STSPreset): PresetDiffResult {
    const startTime = performance.now();
    const id = `diff-${baselinePreset.id}-vs-${comparisonPreset.id}-${Date.now()}`;

    // Calculate individual diffs
    const cardDiffs = this.compareCards(baselinePreset.deck.cards, comparisonPreset.deck.cards);
    const relicDiffs = this.compareRelics(baselinePreset.relics.relics, comparisonPreset.relics.relics);
    const enemyDiffs = this.compareEnemies(baselinePreset.enemy, comparisonPreset.enemy);
    const simulationDiff = this.compareSimulation(baselinePreset.simulation, comparisonPreset.simulation);
    const metadataDiff = this.compareMetadata(baselinePreset, comparisonPreset);

    // Generate summary
    const summary = this.generateSummary(cardDiffs, relicDiffs, enemyDiffs, simulationDiff, metadataDiff);

    const duration = performance.now() - startTime;

    return {
      id,
      comparison: {
        baselinePresetId: baselinePreset.id,
        baselinePresetName: baselinePreset.name,
        comparisonPresetId: comparisonPreset.id,
        comparisonPresetName: comparisonPreset.name,
        timestamp: Date.now(),
        duration,
      },
      cardDiffs,
      relicDiffs,
      enemyDiffs,
      simulationDiff,
      metadataDiff,
      summary,
    };
  }

  /**
   * Compare card lists between two presets
   * 
   * @param baselineCards - Baseline card list
   * @param comparisonCards - Comparison card list
   * @returns Array of card differences
   */
  private compareCards(baselineCards: STSCardConfig[], comparisonCards: STSCardConfig[]): CardDiff[] {
    const diffs: CardDiff[] = [];
    
    // Create maps for efficient lookup
    const baselineMap = new Map(baselineCards.map(card => [card.id, card]));
    const comparisonMap = new Map(comparisonCards.map(card => [card.id, card]));

    // Get all unique card IDs
    const allCardIds = new Set([...baselineMap.keys(), ...comparisonMap.keys()]);

    for (const cardId of allCardIds) {
      const baselineCard = baselineMap.get(cardId);
      const comparisonCard = comparisonMap.get(cardId);

      if (!baselineCard && comparisonCard) {
        // Card was added
        diffs.push({
          cardId,
          cardName: comparisonCard.name,
          changeType: 'added',
          severity: this.calculateCardSeverity(null, comparisonCard),
          newCard: comparisonCard,
        });
      } else if (baselineCard && !comparisonCard) {
        // Card was removed
        diffs.push({
          cardId,
          cardName: baselineCard.name,
          changeType: 'removed',
          severity: this.calculateCardSeverity(baselineCard, null),
          oldCard: baselineCard,
        });
      } else if (baselineCard && comparisonCard) {
        // Card was modified or unchanged
        const changes = this.analyzeCardChanges(baselineCard, comparisonCard);
        const hasChanges = Object.values(changes).some(Boolean);
        
        diffs.push({
          cardId,
          cardName: baselineCard.name,
          changeType: hasChanges ? 'modified' : 'unchanged',
          severity: hasChanges ? this.calculateCardSeverity(baselineCard, comparisonCard) : 'info',
          oldCard: baselineCard,
          newCard: comparisonCard,
          changes: hasChanges ? changes : undefined,
        });
      }
    }

    return diffs;
  }

  /**
   * Compare relic lists between two presets
   * 
   * @param baselineRelics - Baseline relic list
   * @param comparisonRelics - Comparison relic list
   * @returns Array of relic differences
   */
  private compareRelics(baselineRelics: STSRelicItem[], comparisonRelics: STSRelicItem[]): RelicDiff[] {
    const diffs: RelicDiff[] = [];
    
    const baselineMap = new Map(baselineRelics.map(relic => [relic.id, relic]));
    const comparisonMap = new Map(comparisonRelics.map(relic => [relic.id, relic]));

    const allRelicIds = new Set([...baselineMap.keys(), ...comparisonMap.keys()]);

    for (const relicId of allRelicIds) {
      const baselineRelic = baselineMap.get(relicId);
      const comparisonRelic = comparisonMap.get(relicId);

      if (!baselineRelic && comparisonRelic) {
        diffs.push({
          relicId,
          relicName: comparisonRelic.name,
          changeType: 'added',
          severity: 'major',
          newRelic: comparisonRelic,
        });
      } else if (baselineRelic && !comparisonRelic) {
        diffs.push({
          relicId,
          relicName: baselineRelic.name,
          changeType: 'removed',
          severity: 'major',
          oldRelic: baselineRelic,
        });
      } else if (baselineRelic && comparisonRelic) {
        const changes = this.analyzeRelicChanges(baselineRelic, comparisonRelic);
        const hasChanges = Object.values(changes).some(Boolean);
        
        diffs.push({
          relicId,
          relicName: baselineRelic.name,
          changeType: hasChanges ? 'modified' : 'unchanged',
          severity: hasChanges ? 'minor' : 'info',
          oldRelic: baselineRelic,
          newRelic: comparisonRelic,
          changes: hasChanges ? changes : undefined,
        });
      }
    }

    return diffs;
  }

  /**
   * Compare enemy profiles between two presets
   * 
   * @param baselineEnemy - Baseline enemy configuration
   * @param comparisonEnemy - Comparison enemy configuration
   * @returns Enemy difference result
   */
  private compareEnemies(baselineEnemy: STSEnemyProfile, comparisonEnemy: STSEnemyProfile): EnemyDiff[] {
    const diffs: EnemyDiff[] = [];

    // Check if enemy is completely different
    if (baselineEnemy.id !== comparisonEnemy.id) {
      diffs.push({
        enemyId: comparisonEnemy.id,
        enemyName: comparisonEnemy.name,
        changeType: 'modified',
        severity: 'critical',
        oldEnemy: baselineEnemy,
        newEnemy: comparisonEnemy,
        changes: {
          hpChanged: true,
          damageChanged: true,
          typeChanged: baselineEnemy.type !== comparisonEnemy.type,
          modifiersChanged: true,
          aiChanged: true,
        },
      });
    } else {
      // Same enemy, check for modifications
      const changes = this.analyzeEnemyChanges(baselineEnemy, comparisonEnemy);
      const hasChanges = Object.values(changes).some(Boolean);
      
      diffs.push({
        enemyId: baselineEnemy.id,
        enemyName: baselineEnemy.name,
        changeType: hasChanges ? 'modified' : 'unchanged',
        severity: hasChanges ? this.calculateEnemySeverity(baselineEnemy, comparisonEnemy) : 'info',
        oldEnemy: baselineEnemy,
        newEnemy: comparisonEnemy,
        changes: hasChanges ? changes : undefined,
      });
    }

    return diffs;
  }

  /**
   * Compare simulation parameters between two presets
   * 
   * @param baselineSimulation - Baseline simulation parameters
   * @param comparisonSimulation - Comparison simulation parameters
   * @returns Simulation difference result
   */
  private compareSimulation(
    baselineSimulation: STSSimulationParams,
    comparisonSimulation: STSSimulationParams
  ): SimulationDiff | null {
    const changes = {
      iterationsChanged: baselineSimulation.iterations !== comparisonSimulation.iterations,
      seedChanged: baselineSimulation.seed !== comparisonSimulation.seed,
      maxTurnsChanged: baselineSimulation.maxTurns !== comparisonSimulation.maxTurns,
      deterministicChanged: baselineSimulation.deterministic !== comparisonSimulation.deterministic,
    };

    const hasChanges = Object.values(changes).some(Boolean);

    if (!hasChanges) {
      return null;
    }

    return {
      changeType: 'modified',
      severity: this.calculateSimulationSeverity(baselineSimulation, comparisonSimulation),
      oldParams: baselineSimulation,
      newParams: comparisonSimulation,
      changes,
    };
  }

  /**
   * Compare metadata between two presets
   * 
   * @param baselinePreset - Baseline preset
   * @param comparisonPreset - Comparison preset
   * @returns Metadata difference result
   */
  private compareMetadata(baselinePreset: STSPreset, comparisonPreset: STSPreset): MetadataDiff | null {
    const changes = {
      versionChanged: baselinePreset.version !== comparisonPreset.version,
      difficultyChanged: baselinePreset.metadata.difficulty !== comparisonPreset.metadata.difficulty,
      estimatedWinRateChanged: 
        Math.abs(baselinePreset.metadata.estimatedWinRate - comparisonPreset.metadata.estimatedWinRate) > 
        this.config.sensitivity.percentageThreshold,
      recommendedForBeginnersChanged: 
        baselinePreset.metadata.recommendedForBeginners !== comparisonPreset.metadata.recommendedForBeginners,
      notesChanged: baselinePreset.metadata.notes !== comparisonPreset.metadata.notes,
    };

    const hasChanges = Object.values(changes).some(Boolean);

    if (!hasChanges) {
      return null;
    }

    return {
      changeType: 'modified',
      severity: 'minor',
      changes,
    };
  }

  /**
   * Analyze specific changes between two cards
   * 
   * @param baselineCard - Baseline card
   * @param comparisonCard - Comparison card
   * @returns Object indicating what changed
   */
  private analyzeCardChanges(baselineCard: STSCardConfig, comparisonCard: STSCardConfig) {
    return {
      quantityChanged: baselineCard.quantity !== comparisonCard.quantity,
      costChanged: baselineCard.cost !== comparisonCard.cost,
      upgradedChanged: baselineCard.upgraded !== comparisonCard.upgraded,
      tagsChanged: JSON.stringify(baselineCard.tags.sort()) !== JSON.stringify(comparisonCard.tags.sort()),
    };
  }

  /**
   * Analyze specific changes between two relics
   * 
   * @param baselineRelic - Baseline relic
   * @param comparisonRelic - Comparison relic
   * @returns Object indicating what changed
   */
  private analyzeRelicChanges(baselineRelic: STSRelicItem, comparisonRelic: STSRelicItem) {
    return {
      tierChanged: baselineRelic.tier !== comparisonRelic.tier,
      descriptionChanged: baselineRelic.description !== comparisonRelic.description,
      countersChanged: JSON.stringify(baselineRelic.counters) !== JSON.stringify(comparisonRelic.counters),
    };
  }

  /**
   * Analyze specific changes between two enemies
   * 
   * @param baselineEnemy - Baseline enemy
   * @param comparisonEnemy - Comparison enemy
   * @returns Object indicating what changed
   */
  private analyzeEnemyChanges(baselineEnemy: STSEnemyProfile, comparisonEnemy: STSEnemyProfile) {
    const hpChanged = Math.abs(baselineEnemy.maxHp - comparisonEnemy.maxHp) >= this.config.sensitivity.enemyHpThreshold;
    const damageChanged = 
      Math.abs(baselineEnemy.damage.base - comparisonEnemy.damage.base) >= this.config.sensitivity.enemyDamageThreshold;

    return {
      hpChanged,
      damageChanged,
      typeChanged: baselineEnemy.type !== comparisonEnemy.type,
      modifiersChanged: JSON.stringify(baselineEnemy.modifiers) !== JSON.stringify(comparisonEnemy.modifiers),
      aiChanged: JSON.stringify(baselineEnemy.ai) !== JSON.stringify(comparisonEnemy.ai),
    };
  }

  /**
   * Calculate severity level for card changes
   * 
   * @param baselineCard - Baseline card (null if added)
   * @param comparisonCard - Comparison card (null if removed)
   * @returns Severity level
   */
  private calculateCardSeverity(baselineCard: STSCardConfig | null, comparisonCard: STSCardConfig | null): DiffSeverity {
    if (!baselineCard || !comparisonCard) {
      // Added or removed cards are major changes
      return 'major';
    }

    // Check for critical changes
    if (baselineCard.rarity === 'basic' && comparisonCard.rarity !== 'basic') {
      return 'critical';
    }

    if (baselineCard.type !== comparisonCard.type) {
      return 'major';
    }

    // Check for significant quantity changes
    const quantityDiff = Math.abs(baselineCard.quantity - comparisonCard.quantity);
    if (quantityDiff >= 2) {
      return 'major';
    } else if (quantityDiff >= 1) {
      return 'minor';
    }

    // Check for cost changes
    if (baselineCard.cost !== comparisonCard.cost) {
      return 'minor';
    }

    return 'info';
  }

  /**
   * Calculate severity level for enemy changes
   * 
   * @param baselineEnemy - Baseline enemy
   * @param comparisonEnemy - Comparison enemy
   * @returns Severity level
   */
  private calculateEnemySeverity(baselineEnemy: STSEnemyProfile, comparisonEnemy: STSEnemyProfile): DiffSeverity {
    const hpDiff = Math.abs(baselineEnemy.maxHp - comparisonEnemy.maxHp);
    const damageDiff = Math.abs(baselineEnemy.damage.base - comparisonEnemy.damage.base);

    if (baselineEnemy.type !== comparisonEnemy.type) {
      return 'critical';
    }

    if (hpDiff >= 20 || damageDiff >= 10) {
      return 'major';
    }

    if (hpDiff >= 5 || damageDiff >= 2) {
      return 'minor';
    }

    return 'info';
  }

  /**
   * Calculate severity level for simulation changes
   * 
   * @param baselineSimulation - Baseline simulation parameters
   * @param comparisonSimulation - Comparison simulation parameters
   * @returns Severity level
   */
  private calculateSimulationSeverity(
    baselineSimulation: STSSimulationParams,
    comparisonSimulation: STSSimulationParams
  ): DiffSeverity {
    const iterationsDiff = Math.abs(baselineSimulation.iterations - comparisonSimulation.iterations);
    const seedChanged = baselineSimulation.seed !== comparisonSimulation.seed;

    if (baselineSimulation.deterministic !== comparisonSimulation.deterministic) {
      return 'critical';
    }

    if (iterationsDiff >= 1000) {
      return 'major';
    }

    if (seedChanged || iterationsDiff >= 100) {
      return 'minor';
    }

    return 'info';
  }

  /**
   * Generate summary statistics for the diff analysis
   * 
   * @param cardDiffs - Card differences
   * @param relicDiffs - Relic differences
   * @param enemyDiffs - Enemy differences
   * @param simulationDiff - Simulation differences
   * @param metadataDiff - Metadata differences
   * @returns Summary statistics
   */
  private generateSummary(
    cardDiffs: CardDiff[],
    relicDiffs: RelicDiff[],
    enemyDiffs: EnemyDiff[],
    simulationDiff: SimulationDiff | null,
    metadataDiff: MetadataDiff | null
  ): PresetDiffResult['summary'] {
    // Count changes by severity
    const changesBySeverity: Record<DiffSeverity, number> = {
      critical: 0,
      major: 0,
      minor: 0,
      info: 0,
    };

    // Count changes by category
    const changesByCategory: Record<DiffCategory, number> = {
      cards: cardDiffs.filter(d => d.changeType !== 'unchanged').length,
      relics: relicDiffs.filter(d => d.changeType !== 'unchanged').length,
      enemy: enemyDiffs.filter(d => d.changeType !== 'unchanged').length,
      simulation: simulationDiff ? 1 : 0,
      metadata: metadataDiff ? 1 : 0,
      deck: 0, // Deck-level changes are counted in cards
    };

    // Count severity changes
    const allDiffs: Array<{severity: DiffSeverity}> = [...cardDiffs, ...relicDiffs, ...enemyDiffs];
    if (simulationDiff) allDiffs.push(simulationDiff);
    if (metadataDiff) allDiffs.push(metadataDiff);

    for (const diff of allDiffs) {
      changesBySeverity[diff.severity]++;
    }

    const totalChanges = Object.values(changesBySeverity).reduce((sum, count) => sum + count, 0);

    // Calculate compatibility score
    const criticalWeight = 10;
    const majorWeight = 5;
    const minorWeight = 2;
    const infoWeight = 1;

    const weightedScore = 
      (changesBySeverity.critical * criticalWeight +
       changesBySeverity.major * majorWeight +
       changesBySeverity.minor * minorWeight +
       changesBySeverity.info * infoWeight);

    const maxPossibleScore = 100; // Normalized scale
    const compatibilityScore = Math.max(0, 1 - (weightedScore / maxPossibleScore));

    // Determine recommended action
    let recommendedAction: PresetDiffResult['summary']['recommendedAction'];
    if (totalChanges === 0) {
      recommendedAction = 'identical';
    } else if (changesBySeverity.critical > 0) {
      recommendedAction = 'breaking_change';
    } else if (changesBySeverity.major > 2 || weightedScore > 20) {
      recommendedAction = 'caution_required';
    } else {
      recommendedAction = 'safe_upgrade';
    }

    return {
      totalChanges,
      changesBySeverity,
      changesByCategory,
      compatibilityScore,
      recommendedAction,
    };
  }
}
