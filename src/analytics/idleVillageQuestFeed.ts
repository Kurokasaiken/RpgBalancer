import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

const diagnostics = createHeadlessDiagnostics('IdleVillageQuestFeedTelemetry', 'analytics');

export type QuestFeedEventType = 'quest_feed_event' | 'quest_feed_export';

export interface QuestFeedEventPayload extends Record<string, unknown> {
  filter: string;
  sort: string;
  searchTerm?: string;
  groupByQuest: boolean;
  tags: string[];
  totalDecisions: number;
  visibleDecisions: number;
  sampleDecision?: {
    phaseId: string;
    timestamp: number;
    success: boolean;
    choice?: string;
  };
}

export interface QuestFeedExportPayload extends Record<string, unknown> {
  format: 'json' | 'csv';
  filter: string;
  sort: string;
  exportedCount: number;
  totalCount: number;
}

function dispatchTelemetry<TPayload extends Record<string, unknown>>(type: QuestFeedEventType, payload: TPayload): void {
  diagnostics.info(`Telemetry: ${type}`, payload);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('idleVillageQuestFeedTelemetry', {
        detail: {
          type,
          timestamp: Date.now(),
          payload,
        },
      }),
    );
  }
}

export function trackQuestFeedEvent(payload: QuestFeedEventPayload): void {
  dispatchTelemetry('quest_feed_event', payload);
}

export function trackQuestFeedExport(payload: QuestFeedExportPayload): void {
  dispatchTelemetry('quest_feed_export', payload);
}
