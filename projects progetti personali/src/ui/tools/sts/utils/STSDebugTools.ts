/**
 * STS Debug Tools and Troubleshooting Utilities
 * 
 * Comprehensive debugging and troubleshooting tools for STS Numeric Simulator
 * including state inspection, performance monitoring, and issue detection.
 */

import type { SimulatorState, ManaReservoirState, LogEntry } from '../types';

/**
 * Debug configuration
 */
export interface STSDebugConfig {
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
  maxLogEntries: number;
  trackStateChanges: boolean;
  enableMemoryMonitoring: boolean;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  turnDuration: number;
  renderDuration: number;
  memoryUsage: number;
  stateUpdates: number;
  reRenders: number;
}

/**
 * Issue detection results
 */
export interface IssueDetection {
  issues: DetectedIssue[];
  warnings: DetectedWarning[];
  recommendations: string[];
}

export interface DetectedIssue {
  type: 'memory_leak' | 'performance' | 'state_corruption' | 'logic_error';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location?: string;
  data?: any;
  fix?: string;
}

export interface DetectedWarning {
  type: 'performance' | 'best_practice' | 'potential_issue';
  description: string;
  suggestion?: string;
}

/**
 * STS Debug Tools Class
 */
export class STSDebugTools {
  private static config: STSDebugConfig = {
    enableLogging: process.env.NODE_ENV === 'development',
    enablePerformanceMonitoring: true,
    maxLogEntries: 1000,
    trackStateChanges: true,
    enableMemoryMonitoring: false,
  };

  private static debugLogs: LogEntry[] = [];
  private static performanceMetrics: PerformanceMetrics[] = [];
  private static stateHistory: SimulatorState[] = [];
  private static startTime: number = Date.now();

  /**
   * Initialize debug tools
   */
  static initialize(config?: Partial<STSDebugConfig>): void {
    this.config = { ...this.config, ...config };
    this.startTime = Date.now();
    
    // Add global debug object to window
    if (typeof window !== 'undefined') {
      (window as any).stsDebug = {
        getState: () => this.getLastState(),
        getLogs: () => this.debugLogs,
        getMetrics: () => this.getPerformanceMetrics(),
        detectIssues: () => this.detectIssues(),
        exportDebugData: () => this.exportDebugData(),
        analyzeManaCurve: () => this.analyzeManaCurve(),
        analyzePerformance: () => this.analyzePerformance(),
        analyzeAgency: () => this.analyzeAgency(),
      };
    }
  }

  /**
   * Log debug message
   */
  static log(message: string, data?: any, category: string = 'general'): void {
    if (!this.config.enableLogging) return;

    const logEntry: LogEntry = {
      id: `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'debug',
      message,
      data,
      category,
      turn: this.getLastState()?.turn || 0,
    };

    this.debugLogs.push(logEntry);
    
    // Limit log entries
    if (this.debugLogs.length > this.config.maxLogEntries) {
      this.debugLogs = this.debugLogs.slice(-this.config.maxLogEntries);
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[STS DEBUG] [${category}] ${message}`, data);
    }
  }

  /**
   * Track performance metrics
   */
  static trackPerformance(operation: string, startTime: number, endTime?: number): void {
    if (!this.config.enablePerformanceMonitoring) return;

    const duration = (endTime || Date.now()) - startTime;
    
    this.performanceMetrics.push({
      turnDuration: duration,
      renderDuration: 0, // Will be updated by React
      memoryUsage: this.getMemoryUsage(),
      stateUpdates: 1,
      reRenders: 0, // Will be updated by React
    });

    // Warn about slow operations
    if (duration > 16) { // > 60fps
      this.log(`Slow operation detected: ${operation}`, {
        duration: `${duration.toFixed(2)}ms`,
        threshold: '16ms (60fps)',
      }, 'performance');
    }
  }

  /**
   * Track state changes
   */
  static trackStateChange(newState: SimulatorState, oldState?: SimulatorState): void {
    if (!this.config.trackStateChanges) return;

    this.stateHistory.push({ ...newState });
    
    // Limit state history
    if (this.stateHistory.length > 100) {
      this.stateHistory = this.stateHistory.slice(-100);
    }

    // Detect state issues
    if (oldState) {
      this.detectStateIssues(newState, oldState);
    }
  }

  /**
   * Get last state
   */
  static getLastState(): SimulatorState | null {
    return this.stateHistory.length > 0 ? this.stateHistory[this.stateHistory.length - 1] : null;
  }

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics(): PerformanceMetrics[] {
    return this.performanceMetrics;
  }

  /**
   * Get memory usage
   */
  static getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Detect issues in current state
   */
  static detectIssues(): IssueDetection {
    const state = this.getLastState();
    if (!state) {
      return {
        issues: [],
        warnings: [],
        recommendations: ['No state available for analysis'],
      };
    }

    const issues: DetectedIssue[] = [];
    const warnings: DetectedWarning[] = [];

    // Check for memory leaks
    if (this.debugLogs.length > this.config.maxLogEntries * 0.9) {
      issues.push({
        type: 'memory_leak',
        severity: 'medium',
        description: 'Debug log approaching limit - potential memory leak',
        location: 'STSDebugTools.log',
        fix: 'Clear debug logs or investigate log accumulation',
      });
    }

    // Check for performance issues
    const recentMetrics = this.performanceMetrics.slice(-10);
    const avgTurnDuration = recentMetrics.reduce((sum, m) => sum + m.turnDuration, 0) / recentMetrics.length;
    
    if (avgTurnDuration > 50) {
      issues.push({
        type: 'performance',
        severity: 'high',
        description: `Slow average turn duration: ${avgTurnDuration.toFixed(2)}ms`,
        location: 'Simulation Engine',
        data: { avgTurnDuration },
        fix: 'Optimize state updates and reduce re-renders',
      });
    }

    // Check mana issues
    const manaIssues = this.detectManaIssues(state.mana);
    issues.push(...manaIssues);

    // Check agency issues
    const agencyIssues = this.detectAgencyIssues(state);
    issues.push(...agencyIssues);

    // Check for state corruption
    const corruptionIssues = this.detectStateCorruption(state);
    issues.push(...corruptionIssues);

    // Add warnings
    if (state.turn > 100) {
      warnings.push({
        type: 'potential_issue',
        description: 'Very long simulation - consider adding turn limits',
        suggestion: 'Add maxTurns configuration to prevent infinite loops',
      });
    }

    return {
      issues,
      warnings,
      recommendations: this.generateRecommendations(issues, warnings),
    };
  }

  /**
   * Detect mana-related issues
   */
  private static detectManaIssues(mana: ManaReservoirState): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for resonance issues
    const totalResonance = Object.values(mana.resonance).reduce((sum, val) => sum + val, 0);
    if (totalResonance === 0) {
      issues.push({
        type: 'logic_error',
        severity: 'critical',
        description: 'No resonance mana available - player cannot act',
        location: 'ManaReservoirState',
        fix: 'Ensure resonance regeneration is working correctly',
      });
    }

    // Check for inspiration overflow
    if (mana.inspiration.current > mana.inspiration.maxStack) {
      issues.push({
        type: 'state_corruption',
        severity: 'high',
        description: 'Inspiration exceeds maximum stack',
        location: 'ManaReservoirState.inspiration',
        data: { current: mana.inspiration.current, max: mana.inspiration.maxStack },
        fix: 'Fix inspiration stack management logic',
      });
    }

    return issues;
  }

  /**
   * Detect agency-related issues
   */
  private static detectAgencyIssues(state: SimulatorState): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for consecutive turns without action
    if (state.agencyMetrics.turnsWithoutAction > 3) {
      issues.push({
        type: 'logic_error',
        severity: 'high',
        description: `Player inactive for ${state.agencyMetrics.turnsWithoutAction} turns`,
        location: 'AgencyMetrics',
        data: { turnsWithoutAction: state.agencyMetrics.turnsWithoutAction },
        fix: 'Check deck configuration for affordable cards',
      });
    }

    // Check for low agency score
    if (state.agencyMetrics.agencyScore < 20) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        description: `Very low agency score: ${state.agencyMetrics.agencyScore}`,
        location: 'AgencyMetrics',
        fix: 'Review deck mana curve and card availability',
      });
    }

    return issues;
  }

  /**
   * Detect state corruption
   */
  private static detectStateCorruption(state: SimulatorState): DetectedIssue[] {
    const issues: DetectedIssue[] = [];

    // Check for negative HP
    if (state.player.hp < 0) {
      issues.push({
        type: 'state_corruption',
        severity: 'high',
        description: 'Player HP is negative',
        location: 'SimulatorState.player.hp',
        data: { hp: state.player.hp },
        fix: 'Fix HP calculation logic',
      });
    }

    if (state.enemy.hp < 0) {
      issues.push({
        type: 'state_corruption',
        severity: 'high',
        description: 'Enemy HP is negative',
        location: 'SimulatorState.enemy.hp',
        data: { hp: state.enemy.hp },
        fix: 'Fix HP calculation logic',
      });
    }

    // Check for invalid hand size
    if (state.hand.length < 0 || state.hand.length > 10) {
      issues.push({
        type: 'state_corruption',
        severity: 'critical',
        description: 'Invalid hand size detected',
        location: 'SimulatorState.hand',
        data: { handSize: state.hand.length },
        fix: 'Fix hand management logic',
      });
    }

    return issues;
  }

  /**
   * Detect state issues during changes
   */
  private static detectStateIssues(newState: SimulatorState, oldState: SimulatorState): void {
    // Check for sudden HP drops
    const hpDrop = oldState.player.hp - newState.player.hp;
    if (hpDrop > 20 && !this.wasDamageDealt()) {
      this.log('Sudden HP drop detected without damage event', {
        hpDrop,
        oldHP: oldState.player.hp,
        newHP: newState.player.hp,
      }, 'state');
    }

    // Check for mana anomalies
    const manaChange = this.calculateManaChange(oldState.mana, newState.mana);
    if (manaChange.total > 10 && !this.wasManaGain()) {
      this.log('Unusual mana increase detected', {
        manaChange,
        oldMana: oldState.mana,
        newMana: newState.mana,
      }, 'state');
    }
  }

  /**
   * Analyze mana curve
   */
  static analyzeManaCurve(): {
    curve: any;
    issues: string[];
    recommendations: string[];
  } {
    const state = this.getLastState();
    if (!state) {
      return {
        curve: null,
        issues: ['No state available'],
        recommendations: ['Start a simulation to analyze mana curve'],
      };
    }

    const cardCosts = state.hand.map(card => this.calculateManaCost(card));
    const avgCost = cardCosts.reduce((sum, cost) => sum + cost.total, 0) / cardCosts.length;
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (avgCost > 3.5) {
      issues.push('High mana curve detected');
      recommendations.push('Add more low-cost cards (1-2 mana)');
    }

    if (avgCost < 1.5) {
      issues.push('Very low mana curve detected');
      recommendations.push('Add more impactful mid-cost cards');
    }

    const affordableCards = cardCosts.filter(cost => 
      this.canAfford(cost, state.mana)
    ).length;

    if (affordableCards === 0) {
      issues.push('No affordable cards in hand');
      recommendations.push('Check mana generation and card costs');
    }

    return {
      curve: {
        avgCost,
        cardCosts,
        affordableCards,
        totalCards: cardCosts.length,
      },
      issues,
      recommendations,
    };
  }

  /**
   * Analyze performance
   */
  static analyzePerformance(): {
    status: string;
    metrics?: {
      avgTurnDuration: number;
      maxTurnDuration: number;
      avgMemoryUsage: number;
      totalSamples: number;
    };
    issues: string[];
    recommendations: string[];
  } {
    const metrics = this.getPerformanceMetrics();
    if (metrics.length === 0) {
      return {
        status: 'No data available',
        recommendations: ['Run simulation to collect performance data'],
      };
    }

    const avgTurnDuration = metrics.reduce((sum, m) => sum + m.turnDuration, 0) / metrics.length;
    const maxTurnDuration = Math.max(...metrics.map(m => m.turnDuration));
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (avgTurnDuration > 16) {
      issues.push(`Slow average turn duration: ${avgTurnDuration.toFixed(2)}ms`);
      recommendations.push('Optimize state updates and reduce re-renders');
    }

    if (maxTurnDuration > 100) {
      issues.push(`Very slow turn detected: ${maxTurnDuration.toFixed(2)}ms`);
      recommendations.push('Investigate performance bottlenecks');
    }

    if (avgMemoryUsage > 50000000) { // 50MB
      issues.push(`High memory usage: ${(avgMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
      recommendations.push('Check for memory leaks and optimize data structures');
    }

    return {
      status: issues.length === 0 ? 'Good' : 'Needs Optimization',
      metrics: {
        avgTurnDuration,
        maxTurnDuration,
        avgMemoryUsage,
        totalSamples: metrics.length,
      },
      issues,
      recommendations,
    };
  }

  /**
   * Analyze agency
   */
  static analyzeAgency(): {
    agency: any;
    issues: string[];
    recommendations: string[];
  } {
    const state = this.getLastState();
    if (!state) {
      return {
        agency: null,
        issues: ['No state available'],
        recommendations: ['Start a simulation to analyze agency'],
      };
    }

    const { agencyMetrics } = state;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (agencyMetrics.turnsWithoutAction > 2) {
      issues.push(`Inactive for ${agencyMetrics.turnsWithoutAction} turns`);
      recommendations.push('Review deck configuration for playable cards');
    }

    if (agencyMetrics.agencyScore < 30) {
      issues.push(`Low agency score: ${agencyMetrics.agencyScore}`);
      recommendations.push('Add more affordable cards and meaningful choices');
    }

    if (agencyMetrics.fallbackUsed) {
      issues.push('Fallback agency used - player forced to act');
      recommendations.push('Improve card availability and mana generation');
    }

    return {
      agency: {
        score: agencyMetrics.agencyScore,
        turnsWithoutAction: agencyMetrics.turnsWithoutAction,
        availableActions: agencyMetrics.availableActionsCount,
        fallbackUsed: agencyMetrics.fallbackUsed,
      },
      issues,
      recommendations,
    };
  }

  /**
   * Export debug data
   */
  static exportDebugData(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - this.startTime,
      config: this.config,
      logs: this.debugLogs,
      performanceMetrics: this.performanceMetrics,
      stateHistory: this.stateHistory,
      lastState: this.getLastState(),
      issues: this.detectIssues(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate recommendations based on issues
   */
  private static generateRecommendations(issues: DetectedIssue[], warnings: DetectedWarning[]): string[] {
    const recommendations: string[] = [];

    // Add recommendations from issues
    issues.forEach(issue => {
      if (issue.fix) {
        recommendations.push(issue.fix);
      }
    });

    // Add recommendations from warnings
    warnings.forEach(warning => {
      if (warning.suggestion) {
        recommendations.push(warning.suggestion);
      }
    });

    // Add general recommendations
    if (issues.some(i => i.type === 'performance')) {
      recommendations.push('Consider implementing React.memo and useMemo optimizations');
    }

    if (issues.some(i => i.type === 'memory_leak')) {
      recommendations.push('Review event listeners and clean up unused references');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Helper methods
   */
  private static calculateManaCost(card: any): any {
    // Simplified mana cost calculation
    return {
      total: card.cost?.total || 0,
      resonance: card.cost?.resonance || {},
      inspiration: card.cost?.inspiration || 0,
    };
  }

  private static canAfford(cost: any, mana: ManaReservoirState): boolean {
    // Simplified affordability check
    return cost.total <= this.getAvailableMana(mana);
  }

  private static getAvailableMana(mana: ManaReservoirState): number {
    return Object.values(mana.resonance).reduce((sum, val) => sum + val, 0) + mana.inspiration.current;
  }

  private static calculateManaChange(oldMana: ManaReservoirState, newMana: ManaReservoirState): any {
    const oldTotal = this.getAvailableMana(oldMana);
    const newTotal = this.getAvailableMana(newMana);
    
    return {
      total: newTotal - oldTotal,
      resonance: {
        alteration: newMana.resonance.alteration - oldMana.resonance.alteration,
        bio: newMana.resonance.bio - oldMana.resonance.bio,
        waves: newMana.resonance.waves - oldMana.resonance.waves,
        entropy: newMana.resonance.entropy - oldMana.resonance.entropy,
      },
      inspiration: newMana.inspiration.current - oldMana.inspiration.current,
    };
  }

  private static wasDamageDealt(): boolean {
    // Check recent logs for damage events
    return this.debugLogs.slice(-5).some(log => 
      log.message.includes('damage') || log.category === 'combat'
    );
  }

  private static wasManaGain(): boolean {
    // Check recent logs for mana gain events
    return this.debugLogs.slice(-5).some(log => 
      log.message.includes('mana') || log.message.includes('resonance')
    );
  }

  /**
   * Clear debug data
   */
  static clearDebugData(): void {
    this.debugLogs = [];
    this.performanceMetrics = [];
    this.stateHistory = [];
    this.startTime = Date.now();
    
    this.log('Debug data cleared', {}, 'system');
  }
}

/**
 * React hook for using STS debug tools
 */
export function useSTSDebugTools(config?: Partial<STSDebugConfig>) {
  React.useEffect(() => {
    STSDebugTools.initialize(config);
    
    return () => {
      // Cleanup if needed
    };
  }, [config]);

  const log = React.useCallback((message: string, data?: any, category?: string) => {
    STSDebugTools.log(message, data, category);
  }, []);

  const detectIssues = React.useCallback(() => {
    return STSDebugTools.detectIssues();
  }, []);

  const exportDebugData = React.useCallback(() => {
    return STSDebugTools.exportDebugData();
  }, []);

  const analyzeManaCurve = React.useCallback(() => {
    return STSDebugTools.analyzeManaCurve();
  }, []);

  const analyzePerformance = React.useCallback(() => {
    return STSDebugTools.analyzePerformance();
  }, []);

  const analyzeAgency = React.useCallback(() => {
    return STSDebugTools.analyzeAgency();
  }, []);

  return {
    log,
    detectIssues,
    exportDebugData,
    analyzeManaCurve,
    analyzePerformance,
    analyzeAgency,
    clearDebugData: STSDebugTools.clearDebugData.bind(STSDebugTools),
  };
}
