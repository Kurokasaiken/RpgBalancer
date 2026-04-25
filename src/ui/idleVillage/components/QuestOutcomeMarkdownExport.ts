import type {
  QuestOutcomeAnalysis,
  QuestPostmortemReport,
  QuestMarkdownExportOptions,
  QuestTimelineEvent,
  QuestRiskAssessment,
  QuestPerformanceMetrics
} from './QuestOutcomeAnalyzer.types';

/**
 * Quest Outcome Markdown Export Utilities
 *
 * Generates comprehensive Markdown reports from quest outcome analysis,
 * including timeline, risk assessment, performance metrics, and recommendations.
 */

/**
 * Generate a complete Markdown report from quest outcome analysis
 */
export const generateQuestMarkdownReport = (
  analysis: QuestOutcomeAnalysis,
  exportOptions: QuestMarkdownExportOptions = {}
): QuestPostmortemReport => {
  const options = {
    includeTimeline: true,
    includeRiskAssessment: true,
    includePerformanceMetrics: true,
    includeLessonsLearned: true,
    includeDecisionAnalysis: true,
    format: 'full' as const,
    title: `Quest Postmortem: ${analysis.questId}`,
    includeTableOfContents: true,
    ...exportOptions,
  };

  const sections: string[] = [];

  // Title and metadata
  sections.push(generateTitleSection(analysis, options));

  // Table of contents
  if (options.includeTableOfContents) {
    sections.push(generateTableOfContents(options));
  }

  // Executive summary
  sections.push(generateExecutiveSummary(analysis));

  // Timeline (if included)
  if (options.includeTimeline && analysis.timeline.length > 0) {
    sections.push(generateTimelineSection(analysis.timeline));
  }

  // Risk assessment (if included)
  if (options.includeRiskAssessment) {
    sections.push(generateRiskAssessmentSection(analysis.riskAssessment));
  }

  // Performance metrics (if included)
  if (options.includePerformanceMetrics) {
    sections.push(generatePerformanceMetricsSection(analysis.performanceMetrics));
  }

  // Decision analysis (if included)
  if (options.includeDecisionAnalysis && analysis.decisionPoints.length > 0) {
    sections.push(generateDecisionAnalysisSection(analysis.decisionPoints));
  }

  // Lessons learned (if included)
  if (options.includeLessonsLearned && analysis.lessonsLearned.length > 0) {
    sections.push(generateLessonsLearnedSection(analysis.lessonsLearned));
  }

  // Footer
  sections.push(generateFooter(analysis));

  const markdownContent = sections.join('\n\n');

  return {
    metadata: {
      questId: analysis.questId,
      blueprintId: analysis.blueprintId,
      analyzedAt: analysis.analyzedAt,
      analyzerVersion: analysis.version,
      reportTitle: options.title,
    },
    summary: {
      outcome: analysis.outcome,
      duration: formatDuration(analysis.performanceMetrics.totalDurationSeconds),
      riskLevel: analysis.riskAssessment.riskLevel.toUpperCase(),
      keyMetrics: {
        'Success Rate': analysis.success ? '100%' : '0%',
        'Total Phases': analysis.performanceMetrics.effectCount.toString(),
        'Heroic Moments': analysis.performanceMetrics.heroicMomentCount.toString(),
        'Branch Decisions': analysis.performanceMetrics.branchCount.toString(),
      },
    },
    analysis: {
      timeline: options.includeTimeline ? analysis.timeline : undefined,
      riskAssessment: options.includeRiskAssessment ? analysis.riskAssessment : undefined,
      performanceMetrics: options.includePerformanceMetrics ? analysis.performanceMetrics : undefined,
      decisionPoints: options.includeDecisionAnalysis ? analysis.decisionPoints : undefined,
      lessonsLearned: options.includeLessonsLearned ? analysis.lessonsLearned : undefined,
    },
    markdownContent,
    exportOptions: options,
  };
};

/**
 * Generate the title section with metadata
 */
const generateTitleSection = (
  analysis: QuestOutcomeAnalysis,
  options: QuestMarkdownExportOptions
): string => {
  const lines = [
    `# ${options.title}`,
    '',
    `**Quest ID:** ${analysis.questId}`,
    `**Blueprint:** ${analysis.blueprintId}`,
    `**Outcome:** ${analysis.success ? '✅ Success' : '❌ Failure'}`,
    `**Analysis Date:** ${new Date(analysis.analyzedAt).toLocaleString()}`,
    `**Analyzer Version:** ${analysis.version}`,
  ];

  return lines.join('\n');
};

/**
 * Generate table of contents
 */
const generateTableOfContents = (options: QuestMarkdownExportOptions): string => {
  const sections = ['## Table of Contents'];

  sections.push('- [Executive Summary](#executive-summary)');

  if (options.includeTimeline) {
    sections.push('- [Quest Timeline](#quest-timeline)');
  }

  if (options.includeRiskAssessment) {
    sections.push('- [Risk Assessment](#risk-assessment)');
  }

  if (options.includePerformanceMetrics) {
    sections.push('- [Performance Metrics](#performance-metrics)');
  }

  if (options.includeDecisionAnalysis) {
    sections.push('- [Decision Analysis](#decision-analysis)');
  }

  if (options.includeLessonsLearned) {
    sections.push('- [Lessons Learned](#lessons-learned)');
  }

  return sections.join('\n');
};

/**
 * Generate executive summary
 */
const generateExecutiveSummary = (analysis: QuestOutcomeAnalysis): string => {
  const lines = [
    '## Executive Summary',
    '',
    `This quest ${analysis.success ? 'succeeded' : 'failed'} with the following key outcomes:`,
    '',
    `### Key Metrics`,
    `- **Duration:** ${formatDuration(analysis.performanceMetrics.totalDurationSeconds)}`,
    `- **Risk Level:** ${analysis.riskAssessment.riskLevel.toUpperCase()}`,
    `- **Injury Risk:** ${analysis.riskAssessment.injuryRiskPercent.toFixed(1)}%`,
    `- **Death Risk:** ${analysis.riskAssessment.deathRiskPercent.toFixed(1)}%`,
    `- **Efficiency Rating:** ${(analysis.performanceMetrics.efficiencyRating * 100).toFixed(1)}%`,
    `- **Heroic Moments:** ${analysis.performanceMetrics.heroicMomentCount}`,
    `- **Branch Decisions:** ${analysis.performanceMetrics.branchCount}`,
    '',
    `### Outcome`,
    analysis.outcome,
  ];

  return lines.join('\n');
};

/**
 * Generate timeline section
 */
const generateTimelineSection = (timeline: QuestTimelineEvent[]): string => {
  const lines = [
    '## Quest Timeline',
    '',
    'Chronological sequence of significant events during quest execution:',
    '',
    '| Time | Event Type | Description | Risk Level |',
    '|------|------------|-------------|------------|',
  ];

  timeline.forEach(event => {
    const timeStr = new Date(event.timestamp).toLocaleTimeString();
    const eventType = formatEventType(event.type);
    const riskLevel = event.riskLevel ? `${(event.riskLevel * 100).toFixed(1)}%` : '-';

    lines.push(`| ${timeStr} | ${eventType} | ${event.description} | ${riskLevel} |`);
  });

  return lines.join('\n');
};

/**
 * Generate risk assessment section
 */
const generateRiskAssessmentSection = (riskAssessment: QuestRiskAssessment): string => {
  const lines = [
    '## Risk Assessment',
    '',
    `**Overall Risk Level:** ${riskAssessment.riskLevel.toUpperCase()}`,
    '',
    `### Risk Metrics`,
    `- **Injury Risk:** ${riskAssessment.injuryRiskPercent.toFixed(1)}%`,
    `- **Death Risk:** ${riskAssessment.deathRiskPercent.toFixed(1)}%`,
    '',
    '### Risk Factors',
  ];

  riskAssessment.riskFactors.forEach(factor => {
    const impactIcon = factor.impact === 'high' ? '🔴' :
                      factor.impact === 'medium' ? '🟡' : '🟢';
    lines.push(`- ${impactIcon} **${factor.factor}** (${factor.impact}): ${factor.description}`);
  });

  if (riskAssessment.mitigationStrategies.length > 0) {
    lines.push('', '### Recommended Mitigation Strategies');
    riskAssessment.mitigationStrategies.forEach(strategy => {
      lines.push(`- ${strategy}`);
    });
  }

  return lines.join('\n');
};

/**
 * Generate performance metrics section
 */
const generatePerformanceMetricsSection = (metrics: QuestPerformanceMetrics): string => {
  const lines = [
    '## Performance Metrics',
    '',
    `### Timing Metrics`,
    `- **Total Duration:** ${formatDuration(metrics.totalDurationSeconds)}`,
    `- **Average Phase Duration:** ${formatDuration(metrics.averagePhaseDurationSeconds)}`,
    `- **Efficiency Rating:** ${(metrics.efficiencyRating * 100).toFixed(1)}%`,
    '',
    `### Activity Metrics`,
    `- **Branch Decisions:** ${metrics.branchCount}`,
    `- **Effects Applied:** ${metrics.effectCount}`,
    `- **Heroic Moments:** ${metrics.heroicMomentCount}`,
    `- **Failure Points:** ${metrics.failurePointCount}`,
  ];

  return lines.join('\n');
};

/**
 * Generate decision analysis section
 */
const generateDecisionAnalysisSection = (decisionPoints: QuestOutcomeAnalysis['decisionPoints']): string => {
  const lines = [
    '## Decision Analysis',
    '',
    'Key decision points and their impact on quest outcome:',
    '',
    '| Phase | Decision | Impact | Consequence |',
    '|-------|----------|--------|-------------|',
  ];

  decisionPoints.forEach(point => {
    const impactIcon = point.impact === 'positive' ? '✅' :
                      point.impact === 'negative' ? '❌' : '⚪';
    lines.push(`| ${point.phaseId} | ${point.decision} | ${impactIcon} ${point.impact} | ${point.consequence} |`);
  });

  return lines.join('\n');
};

/**
 * Generate lessons learned section
 */
const generateLessonsLearnedSection = (lessons: QuestOutcomeAnalysis['lessonsLearned']): string => {
  const lines = [
    '## Lessons Learned',
    '',
    'Key insights and recommendations for future quests:',
  ];

  const categories = ['strategy', 'risk_management', 'resource_allocation', 'timing'] as const;

  categories.forEach(category => {
    const categoryLessons = lessons.filter(lesson => lesson.category === category);
    if (categoryLessons.length > 0) {
      lines.push('', `### ${formatCategoryName(category)}`);
      categoryLessons.forEach(lesson => {
        lines.push(`- **Lesson:** ${lesson.lesson}`);
        lines.push(`  **Recommendation:** ${lesson.recommendation}`);
      });
    }
  });

  return lines.join('\n');
};

/**
 * Generate footer with metadata
 */
const generateFooter = (analysis: QuestOutcomeAnalysis): string => {
  const lines = [
    '---',
    '',
    `*Report generated by Quest Outcome Postmortem Analyzer v${analysis.version}*`,
    `*Analysis completed on ${new Date(analysis.analyzedAt).toLocaleString()}*`,
  ];

  return lines.join('\n');
};

/**
 * Helper function to format event types for display
 */
const formatEventType = (type: QuestTimelineEvent['type']): string => {
  const typeMap: Record<QuestTimelineEvent['type'], string> = {
    phase_start: 'Phase Start',
    phase_complete: 'Phase Complete',
    branch_taken: 'Branch Taken',
    effect_applied: 'Effect Applied',
    risk_assessment: 'Risk Assessment',
    fatal_event: 'Fatal Event',
  };

  return typeMap[type] || type;
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

/**
 * Export quest report to file (client-side download)
 */
export const exportQuestReportToFile = (report: QuestPostmortemReport): void => {
  const blob = new Blob([report.markdownContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `quest-postmortem-${report.metadata.questId}-${Date.now()}.md`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
