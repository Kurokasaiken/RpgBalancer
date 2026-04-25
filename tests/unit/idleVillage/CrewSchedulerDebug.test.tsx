/**
 * Crew Scheduler Debug Panel Tests – NP-106
 * 
 * Unit tests for the crew scheduler debug panel components and hooks.
 * 
 * @since NP-106
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { useCrewSchedulerDebug } from '@/ui/idleVillage/hooks/useCrewSchedulerDebug';
import { CrewSchedulerDebugPanel } from '@/ui/idleVillage/components/CrewSchedulerDebugPanel';
import type { QueuedAssignment } from '@/ui/idleVillage/hooks/useCrewScheduler';
import { DEFAULT_CREW_SCHEDULER_CONFIG } from '@/balancing/config/idleVillage/crewScheduler';

describe('useCrewSchedulerDebug', () => {
  const mockQueue: QueuedAssignment[] = [
    {
      id: 'test-1',
      residentId: 'resident-1',
      activityId: 'activity-1',
      priorityScore: 10.5,
      factors: {
        statTagMatch: 0.8,
        fatigue: 0.3,
        questUrgency: 5,
        specialization: 0.7,
        difficulty: 0.5,
      },
      timestamp: Date.now(),
    },
    {
      id: 'test-2',
      residentId: 'resident-2',
      activityId: 'activity-2',
      priorityScore: 8.2,
      factors: {
        statTagMatch: 0.6,
        fatigue: 0.9,
        questUrgency: 10,
        specialization: 0.4,
        difficulty: 0.7,
      },
      timestamp: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default config', () => {
    const { result } = renderHook(() =>
      useCrewSchedulerDebug({
        queue: [],
        schedulerConfig: DEFAULT_CREW_SCHEDULER_CONFIG,
        isActive: true,
      })
    );

    expect(result.current.config).toBeDefined();
    expect(result.current.config.enabled).toBe(true);
    expect(result.current.metrics).toBeDefined();
  });

  it('should calculate metrics from queue', async () => {
    const { result } = renderHook(() =>
      useCrewSchedulerDebug({
        queue: mockQueue,
        schedulerConfig: DEFAULT_CREW_SCHEDULER_CONFIG,
        isActive: true,
      })
    );

    await waitFor(() => {
      expect(result.current.metrics.queueSize).toBe(2);
      expect(result.current.metrics.avgPriority).toBeCloseTo(9.35, 1);
      expect(result.current.metrics.avgFatigue).toBeCloseTo(0.6, 1);
    });
  });

  it('should detect conflicts in queue', async () => {
    const largeQueue: QueuedAssignment[] = Array.from({ length: 50 }, (_, i) => ({
      id: `test-${i}`,
      residentId: `resident-${i % 3}`,
      activityId: `activity-${i}`,
      priorityScore: Math.random() * 10,
      factors: {
        statTagMatch: 0.5,
        fatigue: 0.9,
        questUrgency: 5,
        specialization: 0.5,
        difficulty: 0.5,
      },
      timestamp: Date.now(),
    }));

    const { result } = renderHook(() =>
      useCrewSchedulerDebug({
        queue: largeQueue,
        schedulerConfig: DEFAULT_CREW_SCHEDULER_CONFIG,
        isActive: true,
      })
    );

    await waitFor(() => {
      expect(result.current.conflicts.length).toBeGreaterThan(0);
    });
  });

  it('should calculate slot occupancy', async () => {
    const { result } = renderHook(() =>
      useCrewSchedulerDebug({
        queue: mockQueue,
        schedulerConfig: DEFAULT_CREW_SCHEDULER_CONFIG,
        isActive: true,
      })
    );

    await waitFor(() => {
      expect(result.current.slotOccupancy.length).toBeGreaterThan(0);
      expect(result.current.slotOccupancy[0]).toHaveProperty('slotId');
      expect(result.current.slotOccupancy[0]).toHaveProperty('occupancyRate');
      expect(result.current.slotOccupancy[0]).toHaveProperty('assignmentCount');
    });
  });

  it('should track timeline entries', async () => {
    const { result } = renderHook(() =>
      useCrewSchedulerDebug({
        queue: mockQueue,
        schedulerConfig: DEFAULT_CREW_SCHEDULER_CONFIG,
        debugConfig: {
          refreshRate: 'manual',
        },
        isActive: true,
      })
    );

    await waitFor(() => {
      expect(result.current.timeline).toBeDefined();
      expect(Array.isArray(result.current.timeline)).toBe(true);
    });
  });

  it('should clear timeline', async () => {
    const { result } = renderHook(() =>
      useCrewSchedulerDebug({
        queue: mockQueue,
        schedulerConfig: DEFAULT_CREW_SCHEDULER_CONFIG,
        isActive: true,
      })
    );

    await waitFor(() => {
      result.current.clearTimeline();
      expect(result.current.timeline.length).toBe(0);
    });
  });

  it('should handle empty queue', () => {
    const { result } = renderHook(() =>
      useCrewSchedulerDebug({
        queue: [],
        schedulerConfig: DEFAULT_CREW_SCHEDULER_CONFIG,
        isActive: true,
      })
    );

    expect(result.current.metrics.queueSize).toBe(0);
    expect(result.current.metrics.avgPriority).toBe(0);
    expect(result.current.conflicts.length).toBe(0);
    expect(result.current.slotOccupancy.length).toBe(0);
  });

  it('should respect isActive flag', () => {
    const { result } = renderHook(() =>
      useCrewSchedulerDebug({
        queue: mockQueue,
        schedulerConfig: DEFAULT_CREW_SCHEDULER_CONFIG,
        isActive: false,
      })
    );

    expect(result.current.timeline.length).toBe(0);
  });

  it('should change visualization mode', async () => {
    const { result } = renderHook(() =>
      useCrewSchedulerDebug({
        queue: mockQueue,
        schedulerConfig: DEFAULT_CREW_SCHEDULER_CONFIG,
        isActive: true,
      })
    );

    expect(result.current.visualizationMode).toBe('split');

    await waitFor(() => {
      result.current.setVisualizationMode('timeline');
      expect(result.current.visualizationMode).toBe('timeline');
    });
  });
});

describe('CrewSchedulerDebugPanel', () => {
  const mockQueue: QueuedAssignment[] = [
    {
      id: 'test-1',
      residentId: 'resident-1',
      activityId: 'mining',
      priorityScore: 10.5,
      factors: {
        statTagMatch: 0.8,
        fatigue: 0.3,
        questUrgency: 5,
        specialization: 0.7,
        difficulty: 0.5,
      },
      timestamp: Date.now(),
    },
  ];

  it('should render when visible', () => {
    render(
      <CrewSchedulerDebugPanel
        queue={mockQueue}
        isVisible={true}
      />
    );

    expect(screen.getByText('Crew Scheduler Debug')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    const { container } = render(
      <CrewSchedulerDebugPanel
        queue={mockQueue}
        isVisible={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display metrics', () => {
    render(
      <CrewSchedulerDebugPanel
        queue={mockQueue}
        isVisible={true}
      />
    );

    expect(screen.getByText('Queue Size')).toBeInTheDocument();
    expect(screen.getByText('Avg Priority')).toBeInTheDocument();
  });

  it('should display visualization mode buttons', () => {
    render(
      <CrewSchedulerDebugPanel
        queue={mockQueue}
        isVisible={true}
      />
    );

    expect(screen.getByText('timeline')).toBeInTheDocument();
    expect(screen.getByText('heatmap')).toBeInTheDocument();
    expect(screen.getByText('list')).toBeInTheDocument();
    expect(screen.getByText('split')).toBeInTheDocument();
  });

  it('should display clear and export buttons', () => {
    render(
      <CrewSchedulerDebugPanel
        queue={mockQueue}
        isVisible={true}
      />
    );

    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should show empty state for conflicts', () => {
    render(
      <CrewSchedulerDebugPanel
        queue={[]}
        isVisible={true}
      />
    );

    expect(screen.getByText(/No conflicts detected/i)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <CrewSchedulerDebugPanel
        queue={mockQueue}
        isVisible={true}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('crew-scheduler-debug-panel');
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
