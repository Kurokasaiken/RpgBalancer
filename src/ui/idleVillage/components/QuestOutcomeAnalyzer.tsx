import React, { useState, useMemo, useCallback } from 'react';
import { QuestTimeline } from './QuestTimeline';
import { QuestRiskDisplay } from './QuestRiskDisplay';
import { generateQuestMarkdownReport, exportQuestReportToFile } from './QuestOutcomeMarkdownExport';
import type {
  QuestOutcomeAnalysis,
  QuestOutcomeAnalyzerConfig,
  QuestMarkdownExportOptions
} from './QuestOutcomeAnalyzer.types';
import styles from './QuestOutcomeAnalyzer.module.css';

/**
 * Props for QuestOutcomeAnalyzer component
 */
export interface QuestOutcomeAnalyzerProps {
  /** Quest outcome analysis data */
  analysis: QuestOutcomeAnalysis;
  /** Configuration for the analyzer */
  config?: Partial<QuestOutcomeAnalyzerConfig>;
  /** Custom CSS class name */
  className?: string;
  /** Callback when export is requested */
  onExport?: (report: ReturnType<typeof generateQuestMarkdownReport>) => void;
}

/**
 * Quest Outcome Postmortem Analyzer Component
 *
 * Comprehensive analysis interface for quest outcomes with timeline visualization,
 * risk assessment display, performance metrics, and Markdown export capabilities.
 *
 * Features:
 * - Interactive quest timeline with event visualization
 * - Risk stripes showing injury/death percentages
 * - Performance metrics dashboard
 * - Decision analysis with impact assessment
 * - Lessons learned and recommendations
 * - Markdown export for documentation
 */
export const QuestOutcomeAnalyzer: React.FC<QuestOutcomeAnalyzerProps> = ({
  analysis,
  config: customConfig,
  className,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'risk' | 'performance' | 'decisions' | 'lessons'>('overview');
  const [exportOptions] = useState<QuestMarkdownExportOptions>({
    includeTimeline: true,
    includeRiskAssessment: true,
    includePerformanceMetrics: true,
    includeLessonsLearned: true,
    includeDecisionAnalysis: true,
    format: 'full',
    includeTableOfContents: true,
  });

  // Merge configuration with defaults
  const config = useMemo<QuestOutcomeAnalyzerConfig>(() => ({
    includeDetailedTimeline: true,
    includeRiskAssessment: true,
    includePerformanceMetrics: true,
    highRiskThreshold: 0.7,
    goodEfficiencyThreshold: 0.8,
    generateRecommendations: true,
    ...customConfig,
  }), [customConfig]);

  // Generate risk level assessment
  const riskLevel = useMemo(() => {
    const { injuryRiskPercent, deathRiskPercent } = analysis.riskAssessment;
    if (deathRiskPercent >= 50 || injuryRiskPercent >= 80) return 'extreme';
    if (deathRiskPercent >= 25 || injuryRiskPercent >= 50) return 'high';
    if (deathRiskPercent >= 10 || injuryRiskPercent >= 25) return 'medium';
    return 'low';
  }, [analysis.riskAssessment]);

  // Handle export
  const handleExport = useCallback(() => {
    const report = generateQuestMarkdownReport(analysis, exportOptions);
    exportQuestReportToFile(report);
    onExport?.(report);
  }, [analysis, exportOptions, onExport]);

  // Render overview tab
  const renderOverviewTab = () => (
    <div className={styles.overview}>
      <div className={styles.outcomeHeader}>
        <div className={`${styles.outcomeStatus} ${analysis.success ? styles.success : styles.failure}`}>
          {analysis.success ? '✅ Quest Succeeded' : '❌ Quest Failed'}
        </div>
        <div className={styles.outcomeDescription}>
          {analysis.outcome}
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h4>Duration</h4>
          <div className={styles.metricValue}>
            {formatDuration(analysis.performanceMetrics.totalDurationSeconds)}
          </div>
        </div>

        <div className={styles.metricCard}>
          <h4>Risk Level</h4>
          <div className={`${styles.metricValue} ${styles[riskLevel]}`}>
            {riskLevel.toUpperCase()}
          </div>
        </div>

        <div className={styles.metricCard}>
          <h4>Efficiency</h4>
          <div className={styles.metricValue}>
            {(analysis.performanceMetrics.efficiencyRating * 100).toFixed(1)}%
          </div>
        </div>

        <div className={styles.metricCard}>
          <h4>Heroic Moments</h4>
          <div className={styles.metricValue}>
            {analysis.performanceMetrics.heroicMomentCount}
          </div>
        </div>
      </div>

      {/* Risk Display */}
      <div className={styles.riskSection}>
        <h3>Risk Assessment</h3>
        <div className={styles.riskDisplay}>
          <QuestRiskDisplay
            questId={analysis.questId}
            injuryPercentage={analysis.riskAssessment.injuryRiskPercent}
            deathPercentage={analysis.riskAssessment.deathRiskPercent}
            polygonHeight={120}
            polygonWidth={160}
            showLabels={true}
          />
        </div>
        <div className={styles.riskDetails}>
          <div className={styles.riskMetric}>
            <span className={styles.riskLabel}>Injury Risk:</span>
            <span className={styles.riskValue}>{analysis.riskAssessment.injuryRiskPercent.toFixed(1)}%</span>
          </div>
          <div className={styles.riskMetric}>
            <span className={styles.riskLabel}>Death Risk:</span>
            <span className={styles.riskValue}>{analysis.riskAssessment.deathRiskPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render timeline tab
  const renderTimelineTab = () => (
    <div className={styles.timelineTab}>
      <QuestTimeline
        events={analysis.timeline}
        showTimestamps={true}
        highlightRiskEvents={true}
        maxHeight="500px"
      />
    </div>
  );

  // Render risk tab
  const renderRiskTab = () => (
    <div className={styles.riskTab}>
      <div className={styles.riskAssessment}>
        <h3>Detailed Risk Assessment</h3>
        <div className={styles.riskLevel}>
          <span className={styles.riskLevelLabel}>Overall Risk Level:</span>
          <span className={`${styles.riskLevelValue} ${styles[riskLevel]}`}>
            {riskLevel.toUpperCase()}
          </span>
        </div>

        <div className={styles.riskMetrics}>
          <div className={styles.riskChart}>
            <QuestRiskDisplay
              questId={analysis.questId}
              injuryPercentage={analysis.riskAssessment.injuryRiskPercent}
              deathPercentage={analysis.riskAssessment.deathRiskPercent}
              polygonHeight={200}
              polygonWidth={300}
              showLabels={true}
            />
          </div>
        </div>

        <div className={styles.riskFactors}>
          <h4>Risk Factors</h4>
          {analysis.riskAssessment.riskFactors.map((factor, index) => (
            <div key={index} className={`${styles.riskFactor} ${styles[factor.impact]}`}>
              <div className={styles.factorHeader}>
                <span className={styles.factorName}>{factor.factor}</span>
                <span className={styles.factorImpact}>{factor.impact.toUpperCase()}</span>
              </div>
              <div className={styles.factorDescription}>{factor.description}</div>
            </div>
          ))}
        </div>

        {analysis.riskAssessment.mitigationStrategies.length > 0 && (
          <div className={styles.mitigationStrategies}>
            <h4>Mitigation Strategies</h4>
            <ul>
              {analysis.riskAssessment.mitigationStrategies.map((strategy, index) => (
                <li key={index}>{strategy}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // Render performance tab
  const renderPerformanceTab = () => (
    <div className={styles.performanceTab}>
      <div className={styles.performanceGrid}>
        <div className={styles.performanceMetric}>
          <h4>Total Duration</h4>
          <div className={styles.metricLarge}>
            {formatDuration(analysis.performanceMetrics.totalDurationSeconds)}
          </div>
        </div>

        <div className={styles.performanceMetric}>
          <h4>Average Phase Time</h4>
          <div className={styles.metricLarge}>
            {formatDuration(analysis.performanceMetrics.averagePhaseDurationSeconds)}
          </div>
        </div>

        <div className={styles.performanceMetric}>
          <h4>Efficiency Rating</h4>
          <div className={`${styles.metricLarge} ${analysis.performanceMetrics.efficiencyRating >= config.goodEfficiencyThreshold ? styles.good : styles.poor}`}>
            {(analysis.performanceMetrics.efficiencyRating * 100).toFixed(1)}%
          </div>
        </div>

        <div className={styles.performanceMetric}>
          <h4>Branch Decisions</h4>
          <div className={styles.metricLarge}>
            {analysis.performanceMetrics.branchCount}
          </div>
        </div>

        <div className={styles.performanceMetric}>
          <h4>Effects Applied</h4>
          <div className={styles.metricLarge}>
            {analysis.performanceMetrics.effectCount}
          </div>
        </div>

        <div className={styles.performanceMetric}>
          <h4>Heroic Moments</h4>
          <div className={styles.metricLarge}>
            {analysis.performanceMetrics.heroicMomentCount}
          </div>
        </div>
      </div>
    </div>
  );

  // Render decisions tab
  const renderDecisionsTab = () => (
    <div className={styles.decisionsTab}>
      <h3>Decision Analysis</h3>
      {analysis.decisionPoints.length === 0 ? (
        <div className={styles.noData}>No significant decision points identified.</div>
      ) : (
        <div className={styles.decisionList}>
          {analysis.decisionPoints.map((point, index) => (
            <div key={index} className={`${styles.decisionPoint} ${styles[point.impact]}`}>
              <div className={styles.decisionHeader}>
                <span className={styles.phaseId}>{point.phaseId}</span>
                <span className={`${styles.impactBadge} ${styles[point.impact]}`}>
                  {point.impact.toUpperCase()}
                </span>
              </div>
              <div className={styles.decisionText}>{point.decision}</div>
              <div className={styles.consequence}>{point.consequence}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render lessons tab
  const renderLessonsTab = () => (
    <div className={styles.lessonsTab}>
      <h3>Lessons Learned</h3>
      {analysis.lessonsLearned.length === 0 ? (
        <div className={styles.noData}>No lessons learned identified.</div>
      ) : (
        <div className={styles.lessonsGrid}>
          {analysis.lessonsLearned.map((lesson, index) => (
            <div key={index} className={`${styles.lessonCard} ${styles[lesson.category]}`}>
              <div className={styles.lessonCategory}>
                {formatCategoryName(lesson.category)}
              </div>
              <div className={styles.lessonContent}>
                <div className={styles.lessonText}>{lesson.lesson}</div>
                <div className={styles.recommendation}>{lesson.recommendation}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`${styles.analyzer} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          Quest Postmortem: {analysis.questId}
        </h2>
        <div className={styles.headerActions}>
          <button
            className={styles.exportButton}
            onClick={handleExport}
            title="Export analysis as Markdown"
          >
            📄 Export Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'timeline' ? styles.active : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'risk' ? styles.active : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          Risk Analysis
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'performance' ? styles.active : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'decisions' ? styles.active : ''}`}
          onClick={() => setActiveTab('decisions')}
        >
          Decisions
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'lessons' ? styles.active : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          Lessons
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'timeline' && renderTimelineTab()}
        {activeTab === 'risk' && renderRiskTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'decisions' && renderDecisionsTab()}
        {activeTab === 'lessons' && renderLessonsTab()}
      </div>
    </div>
  );
};

/**
 * Helper function to format duration
 */
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
};

/**
 * Helper function to format category names
 */
const formatCategoryName = (category: string): string => {
  return category.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default QuestOutcomeAnalyzer;
