/**
 * DropTimelinePanel Component Tests (NP-141)
 *
 * Ensures the telemetry dashboard renders metrics, handles states, fires exports,
 * and wires filter controls to the analytics hook contract.
 */

import { describe, it, expect, beforeEach, vi, afterAll, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DropTimelinePanel from '@/ui/idleVillage/components/DropTimelinePanel';
import type {
  DropTimelineData,
  DropTimelineFilters,
  DropTimelineSession,
} from '@/analytics/idleVillageDropTimeline';
import { DEFAULT_DROP_TIMELINE_FILTERS } from '@/analytics/idleVillageDropTimeline';
import type { UseDropTimelineDataReturn } from '@/ui/idleVillage/hooks/useDropTimelineData';
import { useDropTimelineData } from '@/ui/idleVillage/hooks/useDropTimelineData';

vi.mock('@/ui/idleVillage/hooks/useDropTimelineData');

const mockUseDropTimelineData = useDropTimelineData as unknown as vi.Mock<UseDropTimelineDataReturn>;

const baseFilters: DropTimelineFilters = {
  ...DEFAULT_DROP_TIMELINE_FILTERS,
  residentIds: [],
  activityIds: [],
  contexts: [...DEFAULT_DROP_TIMELINE_FILTERS.contexts],
};

const mockSessions: DropTimelineSession[] = [
  {
    sessionId: 'session-1',
    residentId: 'resident-1',
    activityId: 'activity-1',
    context: 'map_drag',
    startedAt: 1_700_000_000_000,
    endedAt: 1_700_000_003_000,
    events: [
      {
        eventType: 'drag_start',
        timestamp: 1_700_000_000_000,
        phase: 'drag',
        displayLabel: 'Drag started',
        offsetPct: 0,
        relativeMs: 0,
        residentId: 'resident-1',
        context: 'map_drag',
      },
      {
        eventType: 'validation_start',
        timestamp: 1_700_000_001_000,
        phase: 'validation',
        displayLabel: 'Validation started',
        offsetPct: 33,
        relativeMs: 1_000,
        residentId: 'resident-1',
        context: 'map_drag',
      },
      {
        eventType: 'drop_apply',
        timestamp: 1_700_000_003_000,
        phase: 'drop',
        displayLabel: 'Drop applied',
        offsetPct: 100,
        relativeMs: 3_000,
        residentId: 'resident-1',
        context: 'map_drag',
      },
    ],
    summary: {
      durationMs: 3_000,
      dropResult: 'applied',
      eventsCount: 3,
      validationLatencyMs: 2_000,
      applyLatencyMs: 2_000,
    },
  },
  {
    sessionId: 'session-2',
    residentId: 'resident-2',
    activityId: 'activity-2',
    context: 'roster_drag',
    startedAt: 1_700_000_010_000,
    endedAt: 1_700_000_011_500,
    events: [
      {
        eventType: 'drag_start',
        timestamp: 1_700_000_010_000,
        phase: 'drag',
        displayLabel: 'Drag started',
        offsetPct: 0,
        relativeMs: 0,
        residentId: 'resident-2',
        context: 'roster_drag',
      },
      {
        eventType: 'drop_block',
        timestamp: 1_700_000_011_500,
        phase: 'drop',
        displayLabel: 'Drop blocked',
        offsetPct: 100,
        relativeMs: 1_500,
        residentId: 'resident-2',
        context: 'roster_drag',
      },
    ],
    summary: {
      durationMs: 1_500,
      dropResult: 'blocked',
      eventsCount: 2,
      validationLatencyMs: undefined,
      applyLatencyMs: undefined,
    },
  },
];

const mockData: DropTimelineData = {
  sessions: mockSessions,
  metrics: {
    totalEvents: 5,
    sessionCount: 2,
    validDrops: 1,
    blockedDrops: 1,
    cancelledDrops: 0,
    averageValidationMs: 1500,
    averageApplyMs: 1000,
  },
  range: {
    start: 1_700_000_000_000,
    end: 1_700_000_011_500,
  },
  catalog: {
    residents: ['resident-1', 'resident-2'],
    activities: ['activity-1', 'activity-2'],
    contexts: ['map_drag', 'roster_drag'],
  },
};

const createHookReturn = (overrides: Partial<UseDropTimelineDataReturn> = {}): UseDropTimelineDataReturn => ({
  data: mockData,
  filters: baseFilters,
  isLoading: false,
  error: null,
  lastUpdated: 1_700_000_020_000,
  updateFilters: vi.fn(),
  resetFilters: vi.fn(),
  ingestEvents: vi.fn(),
  refresh: vi.fn().mockResolvedValue(undefined),
  exportAsCSV: vi.fn().mockReturnValue('csv-data'),
  exportAsJSON: vi.fn().mockReturnValue('json-data'),
  ...overrides,
});

beforeAll(() => {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DropTimelinePanel', () => {
  it('renders metrics and session list from analytics data', () => {
    mockUseDropTimelineData.mockReturnValue(createHookReturn());

    render(<DropTimelinePanel />);

    expect(screen.getByText('Drop Timeline Telemetry')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('resident-1')).toBeInTheDocument();
    expect(screen.getByText('resident-2')).toBeInTheDocument();
  });

  it('shows loading state when hook is fetching data', () => {
    mockUseDropTimelineData.mockReturnValue(
      createHookReturn({
        data: { ...mockData, sessions: [] },
        isLoading: true,
      }),
    );

    render(<DropTimelinePanel />);

    expect(screen.getByText('Loading drop timeline telemetry…')).toBeInTheDocument();
  });

  it('renders error banner when hook returns error', () => {
    mockUseDropTimelineData.mockReturnValue(
      createHookReturn({
        error: 'Unable to load drop telemetry',
      }),
    );

    render(<DropTimelinePanel />);

    expect(screen.getByText('Unable to load drop telemetry')).toBeInTheDocument();
  });

  it('invokes refresh and export callbacks when actions are triggered', () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const exportAsJSON = vi.fn().mockReturnValue('json-data');
    const exportAsCSV = vi.fn().mockReturnValue('csv-data');

    mockUseDropTimelineData.mockReturnValue(
      createHookReturn({ refresh, exportAsJSON, exportAsCSV }),
    );

    render(<DropTimelinePanel />);

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    fireEvent.click(screen.getByRole('button', { name: /json/i }));
    fireEvent.click(screen.getByRole('button', { name: /csv/i }));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(exportAsJSON).toHaveBeenCalledTimes(1);
    expect(exportAsCSV).toHaveBeenCalledTimes(1);
  });

  it('calls updateFilters when resident chip is toggled', () => {
    const updateFilters = vi.fn();

    mockUseDropTimelineData.mockReturnValue(
      createHookReturn({
        updateFilters,
        filters: {
          ...baseFilters,
          residentIds: [],
        },
      }),
    );

    render(<DropTimelinePanel />);

    fireEvent.click(screen.getByRole('button', { name: 'resident-1' }));

    expect(updateFilters).toHaveBeenCalledWith({ residentIds: ['resident-1'] });
  });

  it('updates boolean filters when toggles are switched', () => {
    const updateFilters = vi.fn();

    mockUseDropTimelineData.mockReturnValue(
      createHookReturn({
        updateFilters,
        filters: {
          ...baseFilters,
          showBlockedOnly: false,
        },
      }),
    );

    render(<DropTimelinePanel />);

    const checkbox = screen.getByLabelText('Show blocked only');
    fireEvent.click(checkbox);

    expect(updateFilters).toHaveBeenCalledWith({ showBlockedOnly: true });
  });

  it('updates numeric filters from selects', () => {
    const updateFilters = vi.fn();

    mockUseDropTimelineData.mockReturnValue(
      createHookReturn({
        updateFilters,
        filters: {
          ...baseFilters,
          timeWindowHours: null,
          sessionLimit: null,
        },
      }),
    );

    render(<DropTimelinePanel />);

    const timeWindowSelect = screen.getByLabelText('Time window');
    fireEvent.change(timeWindowSelect, { target: { value: '6' } });

    expect(updateFilters).toHaveBeenCalledWith({ timeWindowHours: 6 });

    const sessionLimitSelect = screen.getByLabelText('Session limit');
    fireEvent.change(sessionLimitSelect, { target: { value: '25' } });

    expect(updateFilters).toHaveBeenCalledWith({ sessionLimit: 25 });
  });

  it('resets filters when the reset button is clicked', () => {
    const resetFilters = vi.fn();

    mockUseDropTimelineData.mockReturnValue(
      createHookReturn({ resetFilters }),
    );

    render(<DropTimelinePanel />);

    fireEvent.click(screen.getByRole('button', { name: /reset filters/i }));

    expect(resetFilters).toHaveBeenCalledTimes(1);
  });
});
