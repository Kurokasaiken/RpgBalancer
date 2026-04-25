import type { QuestResult, QuestState, BranchDecision, QuestEffect } from '@/engine/quest/types';
import type { QuestState as IdleQuestState, QuestPhaseResult } from '@/balancing/config/idleVillage/types';

/**
 * Quest Outcome Postmortem Analyzer Types
 *
 * Defines data structures for analyzing quest outcomes with timeline visualization,
 * risk assessment, and comprehensive postmortem reports.
 */

/**
 * Timeline event representing a significant moment in quest execution
 */
export interface QuestTimelineEvent {
  /** Unique event identifier */
  id: string;
  /** Timestamp when event occurred */
  timestamp: number;
  /** Type of timeline event */
  type: 'phase_start' | 'phase_complete' | 'branch_taken' | 'effect_applied' | 'risk_assessment' | 'fatal_event';
  /** Human-readable description of the event */
  description: string;
  /** Optional phase ID this event relates to */
  phaseId?: string;
  /** Optional branch decision details */
  branchDecision?: BranchDecision;
  /** Optional effect that was applied */
  effect?: QuestEffect;
  /** Risk assessment at this point (0-1) */
  riskLevel?: number;
  /** Whether this event led to quest failure */
  isFatal?: boolean;
  /** Additional metadata for analysis */
  metadata?: Record<string, unknown>;
}

/**
 * Risk assessment data for quest analysis
 */
export interface QuestRiskAssessment {
  /** Overall injury risk percentage (0-100) */
  injuryRiskPercent: number;
  /** Overall death risk percentage (0-100) */
  deathRiskPercent: number;
  /** Risk level classification */
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  /** Risk factors contributing to assessment */
  riskFactors: Array<{
    factor: string;
    impact: 'low' | 'medium' | 'high';
    description: string;
  }>;
  /** Mitigation strategies suggested */
  mitigationStrategies: string[];
}

/**
 * Performance metrics for quest execution
 */
export interface QuestPerformanceMetrics {
  /** Total quest duration in seconds */
  totalDurationSeconds: number;
  /** Average time per phase in seconds */
  averagePhaseDurationSeconds: number;
  /** Number of branches taken */
  branchCount: number;
  /** Number of effects applied */
  effectCount: number;
  /** Efficiency rating (0-1, higher is better) */
  efficiencyRating: number;
  /** Heroic moments identified */
  heroicMomentCount: number;
  /** Critical failure points */
  failurePointCount: number;
}

/**
 * Quest outcome analysis result
 */
export interface QuestOutcomeAnalysis {
  /** Quest identifier */
  questId: string;
  /** Quest blueprint ID */
  blueprintId: string;
  /** Whether the quest was successful */
  success: boolean;
  /** Final outcome description */
  outcome: string;
  /** Timeline of events during quest execution */
  timeline: QuestTimelineEvent[];
  /** Risk assessment throughout the quest */
  riskAssessment: QuestRiskAssessment;
  /** Performance metrics */
  performanceMetrics: QuestPerformanceMetrics;
  /** Key decision points and their impacts */
  decisionPoints: Array<{
    phaseId: string;
    decision: string;
    impact: 'positive' | 'negative' | 'neutral';
    consequence: string;
  }>;
  /** Lessons learned and recommendations */
  lessonsLearned: Array<{
    category: 'strategy' | 'risk_management' | 'resource_allocation' | 'timing';
    lesson: string;
    recommendation: string;
  }>;
  /** Generated timestamp */
  analyzedAt: number;
  /** Analysis version for compatibility */
  version: string;
}

/**
 * Configuration for quest outcome analysis
 */
export interface QuestOutcomeAnalyzerConfig {
  /** Whether to include detailed timeline */
  includeDetailedTimeline: boolean;
  /** Whether to include risk assessment */
  includeRiskAssessment: boolean;
  /** Whether to include performance metrics */
  includePerformanceMetrics: boolean;
  /** Minimum risk level to flag as high-risk */
  highRiskThreshold: number;
  /** Minimum efficiency rating to consider good */
  goodEfficiencyThreshold: number;
  /** Whether to generate recommendations */
  generateRecommendations: boolean;
}

/**
 * Markdown export options
 */
export interface QuestMarkdownExportOptions {
  /** Include timeline section */
  includeTimeline: boolean;
  /** Include risk assessment section */
  includeRiskAssessment: boolean;
  /** Include performance metrics */
  includePerformanceMetrics: boolean;
  /** Include lessons learned */
  includeLessonsLearned: boolean;
  /** Include decision analysis */
  includeDecisionAnalysis: boolean;
  /** Export format */
  format: 'full' | 'summary' | 'technical';
  /** Custom title for the report */
  title?: string;
  /** Include table of contents */
  includeTableOfContents: boolean;
}

/**
 * Quest postmortem report data
 */
export interface QuestPostmortemReport {
  /** Report metadata */
  metadata: {
    questId: string;
    blueprintId: string;
    analyzedAt: number;
    analyzerVersion: string;
    reportTitle: string;
  };
  /** Quest summary */
  summary: {
    outcome: string;
    duration: string;
    riskLevel: string;
    keyMetrics: Record<string, string | number>;
  };
  /** Analysis sections */
  analysis: {
    timeline?: QuestTimelineEvent[];
    riskAssessment?: QuestRiskAssessment;
    performanceMetrics?: QuestPerformanceMetrics;
    decisionPoints?: QuestOutcomeAnalysis['decisionPoints'];
    lessonsLearned?: QuestOutcomeAnalysis['lessonsLearned'];
  };
  /** Generated Markdown content */
  markdownContent: string;
  /** Export options used */
  exportOptions: QuestMarkdownExportOptions;
}
