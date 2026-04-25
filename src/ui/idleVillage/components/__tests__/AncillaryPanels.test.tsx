import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AncillaryPanels, type AncillaryPanelsProps } from '../AncillaryPanels';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';

const mockTelemetry: AggregatedTelemetry = {
  totalQuests: 5,
  successRate: 0.8,
  averageDuration: 150,
  totalBranches: 12,
  averageChoiceTime: 8.5,
  heroicMoments: 3,
  branchDecisions: [],
  recentQuests: [],
  questTypeBreakdown: {},
};

vi.mock('../ResourcePanel', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="resource-panel">{title}</div>,
}));

vi.mock('../QuestTelemetryPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="quest-telemetry-panel" />,
}));

vi.mock('../TradeRoutePanel', () => ({
  __esModule: true,
  default: () => <div data-testid="trade-route-panel" />,
}));

vi.mock('../../ActiveActivityHUD', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="active-activity-hud" />),
}));

const stubActivity: ActivityDefinition = {
  id: 'activity-001',
  label: 'Scout Ruins',
  tags: ['quest'],
  slotTags: ['quest_slot'],
  resolutionEngineId: 'quest_engine',
};

describe('AncillaryPanels (stub)', () => {
  const baseProps: AncillaryPanelsProps = {
    hudEntries: [],
    onResolve: vi.fn(),
    activeSlots: [
      {
        slot: {
          slotId: 'slot-001',
          label: 'Scout Ruins',
          iconName: '🧭',
          assignedWorkerId: 'resident-01',
          activity: stubActivity,
          visualVariant: 'solar',
        },
        state: {
          scheduledId: 'sched-001',
          activityId: 'activity-001',
          residentId: 'resident-01',
          startTime: 0,
          duration: 120,
          elapsed: 30,
          progress: 0.3,
          status: 'running',
        },
      },
    ],
    secondsPerTimeUnit: 45,
    resourceItems: [{ id: 'gold', label: 'Gold', value: 100 }],
    questTelemetryProps: { telemetry: mockTelemetry, compact: true, showHeatmap: false },
    tradeRouteProps: {
      villageIds: ['alpha'],
      tradeRoutes: [
        {
          id: 'trade-1',
          fromVillageId: 'alpha',
          toVillageId: 'beta',
          sendResources: {},
          receiveResources: {},
          duration: 1,
          risk: 0.1,
        },
      ],
      lastTradeResult: null,
      onCreateTradeRoute: () => true,
      onExecuteTradeRoute: () => true,
    },
    migrationQueueProps: {
      migrationQueue: [
        {
          id: 'mig-1',
          fromVillageId: 'alpha',
          toVillageId: 'beta',
          residentId: 'res-1',
          timeRemaining: 2,
          costPaid: {},
        },
      ],
      onProcessMigrationTick: () => [],
    },
    maxVisibleHudEntries: 3,
  };

  it('renders diagnostics and exposes the derived data attributes including metadata', () => {
    const metadata = {
      seed: 'test-seed-123',
      phase: 'day' as const,
      virtualizationEnabled: false,
      residentStatus: { 'res-1': 'available' },
    };
    render(<AncillaryPanels {...baseProps} metadata={metadata} />);

    const section = screen.getByTestId('ancillary-panels');
    expect(section).toBeVisible();
    
    // Verify metadata attributes
    expect(section).toHaveAttribute('data-seed', 'test-seed-123');
    expect(section).toHaveAttribute('data-phase', 'day');
    expect(section).toHaveAttribute('data-virtualization-enabled', 'false');
    expect(section).toHaveAttribute('data-resident-status', JSON.stringify(metadata.residentStatus));

    expect(screen.getByText(/Village Resources/i)).toBeInTheDocument();
    expect(screen.getByTestId('resource-panel')).toBeInTheDocument();
    expect(screen.getByTestId('quest-telemetry-panel')).toBeInTheDocument();
    expect(screen.getByTestId('trade-route-panel')).toBeInTheDocument();
    expect(screen.getByTestId('migration-queue-panel')).toBeInTheDocument();
    expect(screen.getByTestId('active-activity-hud')).toBeInTheDocument();
  });

  it('adds custom className hooks when provided', () => {
    render(<AncillaryPanels {...baseProps} className="test-hook" />);

    const section = screen.getByTestId('ancillary-panels');
    expect(section.className).toContain('test-hook');
  });
});
