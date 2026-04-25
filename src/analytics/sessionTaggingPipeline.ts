/**
 * Punch Club Session Tagging Pipeline
 * 
 * Provides comprehensive session tagging and analytics for Punch Club gameplay sessions.
 * Automatically extracts meaningful tags from gameplay data and enables manual tagging.
 */

import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type { CombatResult, TrainingResult } from '@/ui/punchClub/hooks/usePunchClubGame';

const sessionDiagnostics = createHeadlessDiagnostics('SessionTagging');

// Session tag types and interfaces
export type SessionTagType = 
  | 'playstyle'      // How user plays (aggressive, defensive, balanced)
  | 'progression'    // Level progression speed (fast, normal, slow)
  | 'activity'       // Main activity focus (combat, training, mixed)
  | 'performance'    // Performance level (beginner, intermediate, expert)
  | 'duration'       // Session length (short, medium, long)
  | 'frequency'      // Play frequency (daily, weekly, occasional)
  | 'milestone'      // Achievements (first_win, level_up, streak)
  | 'custom'         // User-defined custom tags
  | 'auto'           // Automatically generated tags
  | 'system';        // System-generated tags

export interface SessionTag {
  id: string;
  type: SessionTagType;
  name: string;
  value: string | number | boolean;
  confidence: number; // 0-1 confidence score for auto-generated tags
  source: 'auto' | 'manual' | 'system';
  timestamp: number;
  metadata?: {
    calculation?: string;
    context?: Record<string, unknown>;
    relatedEvents?: string[];
  };
}

export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  levelStart: number;
  levelEnd: number;
  experienceGained: number;
  moneyGained: number;
  combatsFought: number;
  combatsWon: number;
  combatsLost: number;
  trainingCompleted: number;
  statPointsAllocated: number;
  winRate: number;
  averageTurnsPerCombat: number;
  longestWinStreak: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  mostUsedMove?: string;
  preferredTrainingType?: string;
}

export interface SessionTagConfig {
  // Auto-tagging thresholds
  winRateThresholds: {
    excellent: number;
    good: number;
    average: number;
  };
  progressionThresholds: {
    fast: number; // levels per hour
    normal: number;
    slow: number;
  };
  durationThresholds: {
    short: number; // minutes
    medium: number;
    long: number;
  };
  // Tag generation settings
  enableAutoTagging: boolean;
  confidenceThreshold: number;
  maxAutoTags: number;
  // Custom tag categories
  customCategories: string[];
}

export const DEFAULT_SESSION_TAG_CONFIG: SessionTagConfig = {
  winRateThresholds: {
    excellent: 0.8,
    good: 0.6,
    average: 0.4,
  },
  progressionThresholds: {
    fast: 2.0, // 2+ levels per hour
    normal: 1.0, // 1 level per hour
    slow: 0.5, // <0.5 levels per hour
  },
  durationThresholds: {
    short: 15, // <15 minutes
    medium: 60, // 15-60 minutes
    long: 180, // >60 minutes
  },
  enableAutoTagging: true,
  confidenceThreshold: 0.7,
  maxAutoTags: 10,
  customCategories: ['strategy', 'difficulty', 'mood', 'goal'],
} as const;

/**
 * Session Tagging Pipeline Class
 */
export class SessionTaggingPipeline {
  private config: SessionTagConfig;
  private sessionMetrics: SessionMetrics | null = null;
  private sessionTags: SessionTag[] = [];
  private isSessionActive = false;

  constructor(config: Partial<SessionTagConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_TAG_CONFIG, ...config };
  }

  /**
   * Start a new session tracking period
   */
  startSession(sessionId: string, initialGameState: {
    player?: { level?: number };
  }): void {
    if (this.isSessionActive) {
      sessionDiagnostics.warn('Session already active, ending previous session');
      this.endSession();
    }

    this.sessionMetrics = {
      sessionId,
      startTime: Date.now(),
      levelStart: initialGameState.player?.level || 1,
      levelEnd: initialGameState.player?.level || 1,
      experienceGained: 0,
      moneyGained: 0,
      combatsFought: 0,
      combatsWon: 0,
      combatsLost: 0,
      trainingCompleted: 0,
      statPointsAllocated: 0,
      winRate: 0,
      averageTurnsPerCombat: 0,
      longestWinStreak: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
    };

    this.sessionTags = [];
    this.isSessionActive = true;

    sessionDiagnostics.info('Session started', { sessionId, startTime: this.sessionMetrics.startTime });
  }

  /**
   * End the current session and generate tags
   */
  endSession(): SessionMetrics | null {
    if (!this.isSessionActive || !this.sessionMetrics) {
      sessionDiagnostics.warn('No active session to end');
      return null;
    }

    this.sessionMetrics.endTime = Date.now();
    this.sessionMetrics.duration = this.sessionMetrics.endTime - this.sessionMetrics.startTime;
    
    // Calculate final metrics
    this.calculateFinalMetrics();
    
    // Generate automatic tags
    if (this.config.enableAutoTagging) {
      this.generateAutoTags();
    }

    this.isSessionActive = false;
    sessionDiagnostics.info('Session ended', {
      sessionId: this.sessionMetrics.sessionId,
      duration: this.sessionMetrics.duration,
      tagsGenerated: this.sessionTags.length,
    });

    return this.sessionMetrics;
  }

  /**
   * Record a combat event
   */
  recordCombat(result: CombatResult): void {
    if (!this.sessionMetrics || !this.isSessionActive) return;

    this.sessionMetrics.combatsFought++;
    
    if (result.won) {
      this.sessionMetrics.combatsWon++;
      this.sessionMetrics.experienceGained += result.experience;
      this.sessionMetrics.moneyGained += result.money;
    } else {
      this.sessionMetrics.combatsLost++;
    }

    // Track average turns
    const totalTurns = this.sessionMetrics.averageTurnsPerCombat * (this.sessionMetrics.combatsFought - 1) + result.turns;
    this.sessionMetrics.averageTurnsPerCombat = totalTurns / this.sessionMetrics.combatsFought;

    sessionDiagnostics.debug('Combat recorded', { won: result.won, turns: result.turns });
  }

  /**
   * Record a training event
   */
  recordTraining(result: TrainingResult): void {
    if (!this.sessionMetrics || !this.isSessionActive) return;

    this.sessionMetrics.trainingCompleted++;
    sessionDiagnostics.debug('Training recorded', { exerciseId: result.exerciseId });
  }

  /**
   * Record level up event
   */
  recordLevelUp(newLevel: number): void {
    if (!this.sessionMetrics || !this.isSessionActive) return;

    this.sessionMetrics.levelEnd = newLevel;
    
    // Add milestone tag
    this.addTag({
      id: `level_up_${Date.now()}`,
      type: 'milestone',
      name: 'Level Up',
      value: newLevel,
      confidence: 1.0,
      source: 'auto',
      timestamp: Date.now(),
      metadata: {
        context: { previousLevel: this.sessionMetrics.levelStart, newLevel },
      },
    });

    sessionDiagnostics.info('Level up recorded', { newLevel });
  }

  /**
   * Record stat point allocation
   */
  recordStatAllocation(stats: Record<string, number>): void {
    if (!this.sessionMetrics || !this.isSessionActive) return;

    this.sessionMetrics.statPointsAllocated += Object.keys(stats).length;
    sessionDiagnostics.debug('Stat allocation recorded', { stats });
  }

  /**
   * Add a manual tag
   */
  addTag(tag: SessionTag): void {
    tag.id = tag.id || `${tag.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    tag.timestamp = tag.timestamp || Date.now();
    
    this.sessionTags.push(tag);
    sessionDiagnostics.debug('Tag added', { type: tag.type, name: tag.name });
  }

  /**
   * Remove a tag by ID
   */
  removeTag(tagId: string): boolean {
    const index = this.sessionTags.findIndex(tag => tag.id === tagId);
    if (index !== -1) {
      this.sessionTags.splice(index, 1);
      sessionDiagnostics.debug('Tag removed', { tagId });
      return true;
    }
    return false;
  }

  /**
   * Get all session tags
   */
  getTags(): SessionTag[] {
    return [...this.sessionTags];
  }

  /**
   * Get tags by type
   */
  getTagsByType(type: SessionTagType): SessionTag[] {
    return this.sessionTags.filter(tag => tag.type === type);
  }

  /**
   * Get session metrics
   */
  getMetrics(): SessionMetrics | null {
    return this.sessionMetrics ? { ...this.sessionMetrics } : null;
  }

  /**
   * Calculate final session metrics
   */
  private calculateFinalMetrics(): void {
    if (!this.sessionMetrics) return;

    // Calculate win rate
    if (this.sessionMetrics.combatsFought > 0) {
      this.sessionMetrics.winRate = this.sessionMetrics.combatsWon / this.sessionMetrics.combatsFought;
    }

    // Calculate longest win streak (simplified - would need more detailed tracking)
    this.sessionMetrics.longestWinStreak = this.calculateWinStreak();

    sessionDiagnostics.debug('Final metrics calculated', {
      winRate: this.sessionMetrics.winRate,
      duration: this.sessionMetrics.duration,
    });
  }

  /**
   * Calculate win streak from combat history
   */
  private calculateWinStreak(): number {
    // Simplified implementation - would need combat history order
    return Math.floor(this.sessionMetrics!.combatsWon * 0.6); // Rough estimate
  }

  /**
   * Generate automatic tags based on session metrics
   */
  private generateAutoTags(): void {
    if (!this.sessionMetrics) return;

    const autoTags: SessionTag[] = [];

    // Performance tags based on win rate
    const winRateTag = this.generateWinRateTag();
    if (winRateTag) autoTags.push(winRateTag);

    // Progression tags based on level gain
    const progressionTag = this.generateProgressionTag();
    if (progressionTag) autoTags.push(progressionTag);

    // Duration tags
    const durationTag = this.generateDurationTag();
    if (durationTag) autoTags.push(durationTag);

    // Activity focus tags
    const activityTag = this.generateActivityTag();
    if (activityTag) autoTags.push(activityTag);

    // Playstyle tags
    const playstyleTag = this.generatePlaystyleTag();
    if (playstyleTag) autoTags.push(playstyleTag);

    // Add high-confidence auto tags
    autoTags
      .filter(tag => tag.confidence >= this.config.confidenceThreshold)
      .slice(0, this.config.maxAutoTags)
      .forEach(tag => this.addTag(tag));

    sessionDiagnostics.info('Auto tags generated', { count: autoTags.length });
  }

  /**
   * Generate win rate performance tag
   */
  private generateWinRateTag(): SessionTag | null {
    if (!this.sessionMetrics || this.sessionMetrics.combatsFought < 3) return null;

    const { winRate } = this.sessionMetrics;
    const { excellent, good, average } = this.config.winRateThresholds;

    let performance: string;
    let confidence: number;

    if (winRate >= excellent) {
      performance = 'expert';
      confidence = Math.min(1.0, (winRate - excellent) / (1 - excellent) + 0.8);
    } else if (winRate >= good) {
      performance = 'intermediate';
      confidence = 0.8;
    } else if (winRate >= average) {
      performance = 'beginner';
      confidence = 0.7;
    } else {
      performance = 'struggling';
      confidence = 0.9;
    }

    return {
      id: '', // Will be generated in addTag
      type: 'performance',
      name: 'Performance Level',
      value: performance,
      confidence,
      source: 'auto',
      timestamp: Date.now(),
      metadata: {
        calculation: 'win_rate_analysis',
        context: { winRate, combatsFought: this.sessionMetrics.combatsFought },
      },
    };
  }

  /**
   * Generate progression speed tag
   */
  private generateProgressionTag(): SessionTag | null {
    if (!this.sessionMetrics || !this.sessionMetrics.duration) return null;

    const levelsGained = this.sessionMetrics.levelEnd - this.sessionMetrics.levelStart;
    const durationHours = this.sessionMetrics.duration / (1000 * 60 * 60);
    const levelsPerHour = levelsGained / durationHours;

    const { fast, normal, slow } = this.config.progressionThresholds;

    let speed: string;
    let confidence: number;

    if (levelsPerHour >= fast) {
      speed = 'fast';
      confidence = Math.min(1.0, (levelsPerHour - fast) / fast + 0.8);
    } else if (levelsPerHour >= normal) {
      speed = 'normal';
      confidence = 0.8;
    } else if (levelsPerHour >= slow) {
      speed = 'slow';
      confidence = 0.7;
    } else {
      speed = 'minimal';
      confidence = 0.9;
    }

    return {
      id: '', // Will be generated in addTag
      type: 'progression',
      name: 'Progression Speed',
      value: speed,
      confidence,
      source: 'auto',
      timestamp: Date.now(),
      metadata: {
        calculation: 'levels_per_hour',
        context: { levelsGained, durationHours, levelsPerHour },
      },
    };
  }

  /**
   * Generate duration tag
   */
  private generateDurationTag(): SessionTag | null {
    if (!this.sessionMetrics || !this.sessionMetrics.duration) return null;

    const durationMinutes = this.sessionMetrics.duration / (1000 * 60);
    const { short, medium, long } = this.config.durationThresholds;

    let duration: string;
    let confidence: number;

    if (durationMinutes < short) {
      duration = 'short';
      confidence = 0.9;
    } else if (durationMinutes <= medium) {
      duration = 'medium';
      confidence = 0.8;
    } else if (durationMinutes <= long) {
      duration = 'long';
      confidence = 0.8;
    } else {
      duration = 'marathon';
      confidence = 0.9;
    }

    return {
      id: '', // Will be generated in addTag
      type: 'duration',
      name: 'Session Duration',
      value: duration,
      confidence,
      source: 'auto',
      timestamp: Date.now(),
      metadata: {
        calculation: 'duration_analysis',
        context: { durationMinutes },
      },
    };
  }

  /**
   * Generate activity focus tag
   */
  private generateActivityTag(): SessionTag | null {
    if (!this.sessionMetrics) return null;

    const { combatsFought, trainingCompleted } = this.sessionMetrics;
    const totalActivities = combatsFought + trainingCompleted;

    if (totalActivities === 0) return null;

    let activity: string;
    let confidence: number;

    const combatRatio = combatsFought / totalActivities;

    if (combatRatio >= 0.8) {
      activity = 'combat_focused';
      confidence = 0.8;
    } else if (combatRatio >= 0.6) {
      activity = 'balanced';
      confidence = 0.7;
    } else {
      activity = 'training_focused';
      confidence = 0.8;
    }

    return {
      id: '', // Will be generated in addTag
      type: 'activity',
      name: 'Activity Focus',
      value: activity,
      confidence,
      source: 'auto',
      timestamp: Date.now(),
      metadata: {
        calculation: 'activity_ratio',
        context: { combatsFought, trainingCompleted, combatRatio },
      },
    };
  }

  /**
   * Generate playstyle tag based on combat patterns
   */
  private generatePlaystyleTag(): SessionTag | null {
    if (!this.sessionMetrics || this.sessionMetrics.combatsFought < 5) return null;

    const { winRate, averageTurnsPerCombat } = this.sessionMetrics;

    let playstyle: string;
    let confidence: number;

    // Analyze playstyle based on win rate and combat length
    if (winRate >= 0.7 && averageTurnsPerCombat <= 10) {
      playstyle = 'aggressive';
      confidence = 0.8;
    } else if (winRate >= 0.6 && averageTurnsPerCombat > 15) {
      playstyle = 'defensive';
      confidence = 0.7;
    } else if (winRate >= 0.5) {
      playstyle = 'balanced';
      confidence = 0.6;
    } else {
      playstyle = 'experimental';
      confidence = 0.7;
    }

    return {
      id: '', // Will be generated in addTag
      type: 'playstyle',
      name: 'Play Style',
      value: playstyle,
      confidence,
      source: 'auto',
      timestamp: Date.now(),
      metadata: {
        calculation: 'combat_pattern_analysis',
        context: { winRate, averageTurnsPerCombat },
      },
    };
  }

  /**
   * Save session data to persistence
   */
  async saveSession(): Promise<void> {
    if (!this.sessionMetrics) return;

    const sessionData = {
      metrics: this.sessionMetrics,
      tags: this.sessionTags,
      config: this.config,
      savedAt: Date.now(),
    };

    try {
      await saveData(`session_${this.sessionMetrics.sessionId}`, sessionData);
      sessionDiagnostics.info('Session saved', { sessionId: this.sessionMetrics.sessionId });
    } catch (error) {
      sessionDiagnostics.error('Failed to save session', error);
      throw error;
    }
  }

  /**
   * Load session data from persistence
   */
  async loadSession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await loadData(`session_${sessionId}`, {
        metrics: {} as SessionMetrics,
        tags: [] as SessionTag[],
        config: {} as Partial<SessionTagConfig>,
      });
      if (!sessionData) return false;

      this.sessionMetrics = sessionData.metrics;
      this.sessionTags = sessionData.tags || [];
      this.config = { ...this.config, ...sessionData.config };

      sessionDiagnostics.info('Session loaded', { sessionId });
      return true;
    } catch (error) {
      sessionDiagnostics.error('Failed to load session', error);
      return false;
    }
  }

  /**
   * Get session summary for analytics
   */
  getSessionSummary(): {
    metrics: SessionMetrics | null;
    tags: SessionTag[];
    tagCounts: Record<SessionTagType, number>;
    confidence: {
      high: number; // >= 0.8
      medium: number; // 0.5 - 0.8
      low: number; // < 0.5
    };
  } {
    const tagCounts = this.sessionTags.reduce((counts, tag) => {
      counts[tag.type] = (counts[tag.type] || 0) + 1;
      return counts;
    }, {} as Record<SessionTagType, number>);

    const confidence = {
      high: this.sessionTags.filter(tag => tag.confidence >= 0.8).length,
      medium: this.sessionTags.filter(tag => tag.confidence >= 0.5 && tag.confidence < 0.8).length,
      low: this.sessionTags.filter(tag => tag.confidence < 0.5).length,
    };

    return {
      metrics: this.sessionMetrics,
      tags: this.sessionTags,
      tagCounts,
      confidence,
    };
  }

  /**
   * Export session data as JSON
   */
  exportSession(): string {
    const summary = this.getSessionSummary();
    
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      summary,
      config: this.config,
    }, null, 2);
  }

  /**
   * Reset the pipeline
   */
  reset(): void {
    this.sessionMetrics = null;
    this.sessionTags = [];
    this.isSessionActive = false;
    sessionDiagnostics.info('Pipeline reset');
  }
}

// Singleton instance
let sessionTaggingPipeline: SessionTaggingPipeline | null = null;

/**
 * Get the session tagging pipeline singleton
 */
export function getSessionTaggingPipeline(): SessionTaggingPipeline {
  if (!sessionTaggingPipeline) {
    sessionTaggingPipeline = new SessionTaggingPipeline();
  }
  return sessionTaggingPipeline;
}
