import {
  DEFAULT_ANNOTATION_ASSISTANT_CONFIG,
  mergeAnnotationConfig,
  type AnnotationAssistantConfig,
} from './config/annotationConfig';
import type { PlaytestEvent, PlaytestSession } from './systems/playtestLogger';
import type { AnnotationSeverity } from './config/annotationConfig';

/**
 * Persisted annotation entry produced by the assistant UI.
 */
export interface PlaytestAnnotation {
  id: string;
  title: string;
  body: string;
  severity: AnnotationSeverity;
  tags: string[];
  timestamp: number;
  eventId?: string;
  quickNoteId?: string;
}

/**
 * Convert an absolute timestamp to a readable offset relative to the session start.
 */
export const formatRelativeTime = (timestamp: number, baseTime?: number): string => {
  if (!baseTime) {
    return new Date(timestamp).toLocaleTimeString();
  }

  const delta = Math.max(0, timestamp - baseTime);
  const seconds = Math.floor(delta / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Remove falsy entries and duplicates while preserving insertion order.
 */
export const dedupe = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

/**
 * Generate a lightweight unique identifier for local annotation storage.
 */
export const generateAnnotationId = (): string =>
  `annotation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Resolve suggested tags for the selected playtest event based on config rules.
 */
export const getAutoTagsForEvent = (
  event: PlaytestEvent | undefined,
  config: AnnotationAssistantConfig,
): string[] => {
  if (!event) {
    return [];
  }

  const tags = config.eventTaggingRules[event.type];
  return tags ? [...tags] : [];
};

/**
 * Input payload for markdown report generation.
 */
export interface MarkdownBuildInput {
  annotations: PlaytestAnnotation[];
  session: PlaytestSession | null;
  events?: PlaytestEvent[];
  config?: Partial<AnnotationAssistantConfig>;
}

/**
 * Produce a markdown report summarizing annotations plus optional session context.
 */
export const buildAnnotationMarkdownReport = ({
  annotations,
  session,
  events = [],
  config,
}: MarkdownBuildInput): string => {
  const resolvedConfig = config ? mergeAnnotationConfig(config) : DEFAULT_ANNOTATION_ASSISTANT_CONFIG;
  const { markdown } = resolvedConfig;
  const sections: string[] = [];
  const headingPrefix = '#'.repeat(markdown.headingLevel);

  sections.push(`${headingPrefix} Playtest Annotation Report`);

  if (markdown.includeSummary) {
    const summaryLines = [
      `- Total annotations: ${annotations.length}`,
      `- Session status: ${session ? 'active' : 'not active'}`,
    ];
    if (session) {
      summaryLines.push(`- Session ID: ${session.id}`);
      summaryLines.push(`- Build: ${session.buildVersion}`);
      summaryLines.push(`- Platform: ${session.platform}`);
      summaryLines.push(`- Errors logged: ${session.errorCount}`);
      summaryLines.push(`- Interaction count: ${session.interactionCount}`);
    }
    sections.push(['## Summary', ...summaryLines].join('\n'));
  }

  if (markdown.includeDeviceInfo && session?.deviceInfo) {
    const device = session.deviceInfo;
    sections.push(
      [
        '## Device Info',
        `- User Agent: ${device.userAgent}`,
        `- Platform: ${device.platform}`,
        `- Resolution: ${device.screenResolution}`,
        `- Memory: ${device.deviceMemory ?? 'n/a'}`,
        `- CPU Threads: ${device.hardwareConcurrency ?? 'n/a'}`,
      ].join('\n'),
    );
  }

  if (annotations.length > 0) {
    const annotationLines = annotations
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((annotation) => {
        const tagLabel = annotation.tags.length > 0 ? `Tags: ${annotation.tags.join(', ')}` : 'Tags: -';
        return [
          `### [${annotation.severity.toUpperCase()}] ${annotation.title}`,
          `- When: ${new Date(annotation.timestamp).toLocaleString()}`,
          `- ${tagLabel}`,
          annotation.body ? `\n${annotation.body}\n` : '',
        ]
          .filter(Boolean)
          .join('\n');
      });
    sections.push(annotationLines.join('\n\n'));
  } else {
    sections.push('No annotations recorded.');
  }

  if (markdown.includeTimeline && session) {
    const timelineLines = events
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((event) => {
        const timestampLabel = formatRelativeTime(event.timestamp, session.startTime);
        const description = event.element ?? event.target ?? event.type;
        return `- [${timestampLabel}] ${event.type} → ${description}`;
      });

    sections.push(['## Timeline Extract', ...timelineLines].join('\n'));
  }

  if (markdown.includePerformance && session) {
    const perfLines = [
      `- Completed: ${session.completed ? 'yes' : 'no'}`,
      `- Crash detected: ${session.crashDetected ? 'yes' : 'no'}`,
      `- Duration: ${session.duration ? `${Math.round(session.duration / 1000)}s` : 'n/a'}`,
    ];
    sections.push(['## Performance', ...perfLines].join('\n'));
  }

  if (markdown.footnote) {
    sections.push(`---\n${markdown.footnote}`);
  }

  return sections.filter(Boolean).join('\n\n').trim();
};
