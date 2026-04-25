import { useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import type { HudEntry } from '@/ui/idleVillage/selectors/useHudSelectors';
import ResourcePanel, { type ResourcePanelItem } from './ResourcePanel';
import QuestTelemetryPanel, { type QuestTelemetryPanelProps } from './QuestTelemetryPanel';
import TradeRoutePanel, { type TradeRoutePanelProps } from './TradeRoutePanel';
import MigrationQueuePanel, { type MigrationQueuePanelProps } from './MigrationQueuePanel';
import ActiveActivityHUD from '../ActiveActivityHUD';

/**
 * Shape of the scheduler entries that would eventually populate the AncillaryPanels HUD.
 */
export interface AncillarySlotEntry {
  /** Slot metadata describing the job/quest currently running. */
  slot: ActivitySlotData;
  /** Scheduler runtime state for the slot. */
  state: ScheduledActivityState;
}

/**
 * Props contract for the AncillaryPanels component.
 */
export interface AncillaryPanelsProps {
  /** HUD entries for active activities. */
  hudEntries: HudEntry[];
  /** Handler for resolving completed activities. */
  onResolve?: (scheduledId: string) => void;
  /** Scheduler entries that will later fuel the HUD widget. */
  activeSlots: AncillarySlotEntry[];
  /** Conversion between time units and wall-clock seconds. */
  secondsPerTimeUnit: number;
  /** Resource pills derived from config-first selectors. */
  resourceItems: ResourcePanelItem[];
  /** Quest telemetry configuration/state payload. */
  questTelemetryProps: QuestTelemetryPanelProps;
  /** Trade route state and handlers. */
  tradeRouteProps: TradeRoutePanelProps;
  /** Migration queue state and handlers. */
  migrationQueueProps: MigrationQueuePanelProps;
  /** Optional className hook for layout experiments. */
  className?: string;
  /** Optional clamp for HUD rows; forwarded for future use. */
  maxVisibleHudEntries?: number;
  /** Deterministic metadata for test hooks compatibility */
  metadata?: {
    seed: string | null;
    phase: 'day' | 'night';
    virtualizationEnabled: boolean;
    residentStatus: Record<string, string>;
  };
}

const getSummaryValue = (items: ResourcePanelItem[], id: string): number => {
  const entry = items.find((item) => item.id === id);
  if (!entry) return 0;
  const rawValue = entry.value;
  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue) ? rawValue : 0;
  }
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Observatory HUD container that integrates ActiveActivityHUD with ancillary panels.
 * Config-first approach: renders HUD and panels based on provided data slices.
 *
 * @param props.hudEntries - Active activity entries for the HUD.
 * @param props.onResolve - Handler for resolving completed activities.
 * @param props.activeSlots - Scheduler rows that will feed the HUD list.
 * @param props.resourceItems - Config-derived resources available to the player.
 * @param props.questTelemetryProps - Telemetry panel configuration flags/state.
 * @param props.tradeRouteProps - Trade route entries plus event handlers.
 * @param props.migrationQueueProps - Pending migration entries and processors.
 * @param props.secondsPerTimeUnit - Conversion factor surfaced for instrumentation.
 * @param props.className - Optional wrapper class for layout overrides.
 * @param props.maxVisibleHudEntries - Future-use clamp forwarded for experiments.
 */
export const AncillaryPanels: React.FC<AncillaryPanelsProps> = ({
  hudEntries,
  onResolve,
  activeSlots: _activeSlots,
  resourceItems,
  questTelemetryProps,
  tradeRouteProps,
  migrationQueueProps,
  secondsPerTimeUnit: _secondsPerTimeUnit,
  className,
  maxVisibleHudEntries: _maxVisibleHudEntries,
  metadata,
}) => {
  const diagnostics = createSandboxDiagnostics('AncillaryPanels', 'ancillary');
  const summaryStripValues = useMemo(() => {
    return {
      gold: getSummaryValue(resourceItems, 'gold'),
      food: getSummaryValue(resourceItems, 'food'),
      population: getSummaryValue(resourceItems, 'population'),
    };
  }, [resourceItems]);

  // Log deterministic metadata on mount and when metadata changes
  useEffect(() => {
    if (metadata) {
      diagnostics.info('metadata_updated', {
        metadata,
        timestamp: Date.now(),
        location: 'AncillaryPanels',
        payload: {
          seed: metadata.seed,
          phase: metadata.phase,
          virtualizationEnabled: metadata.virtualizationEnabled,
          residentCount: Object.keys(metadata.residentStatus).length,
          resourceSummary: summaryStripValues,
        },
      }, ['metadata', 'ancillary']);
    }
  }, [metadata, diagnostics, summaryStripValues]);

  return (
    <div 
      className={clsx('space-y-4', className)} 
      data-testid="ancillary-panels" 
      data-seed={metadata?.seed}
      data-phase={metadata?.phase}
      data-virtualization-enabled={metadata?.virtualizationEnabled}
      data-resident-status={JSON.stringify(metadata?.residentStatus)}
      aria-live="polite"
    >
      <ActiveActivityHUD
        hudEntries={hudEntries}
        onResolve={(scheduledId) => {
          diagnostics.info('activity_resolved', { scheduledId, timestamp: Date.now(), location: 'AncillaryPanels', payload: { scheduledId } }, ['activity', 'resolve']);
          onResolve?.(scheduledId);
        }}
      />

      <ResourcePanel
        title="Village Resources"
        items={resourceItems}
        gold={summaryStripValues.gold}
        food={summaryStripValues.food}
        population={summaryStripValues.population}
      />

      <section aria-labelledby="quest-telemetry-heading" className="space-y-3">
        <h3 id="quest-telemetry-heading" className="text-sm font-semibold text-slate-200">
          Quest Telemetry
        </h3>
        <QuestTelemetryPanel {...questTelemetryProps} data-testid="quest-telemetry-panel" />
      </section>

      <section aria-labelledby="trade-routes-heading" className="space-y-3">
        <h3 id="trade-routes-heading" className="text-sm font-semibold text-slate-200">
          Trade Routes
        </h3>
        <TradeRoutePanel key={tradeRouteProps.tradeRoutes.length} {...tradeRouteProps} data-testid="trade-route-panel" />
      </section>

      <section aria-labelledby="migration-queue-heading" className="space-y-3">
        <h3 id="migration-queue-heading" className="text-sm font-semibold text-slate-200">
          Migration Queue
        </h3>
        <MigrationQueuePanel {...migrationQueueProps} data-testid="migration-queue-panel" />
      </section>
    </div>
  );
};

export default AncillaryPanels;
