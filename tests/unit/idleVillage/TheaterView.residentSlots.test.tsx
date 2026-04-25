import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TheaterView from '../../../src/ui/idleVillage/components/TheaterView';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';

// Mock dependencies
vi.mock('@/ui/idleVillage/slots/useResidentSlotController', () => ({
  useResidentSlotController: vi.fn(() => ({
    slots: [
      {
        id: 'slot-0',
        index: 0,
        label: 'Slot 1',
        statHint: 'Strength',
        required: true,
        assignedResidentId: null,
        assignedResident: undefined,
        requirement: undefined,
        modifiers: undefined,
        isPlaceholder: false,
        dropState: 'idle',
        bloomState: 'idle',
        status: 'empty',
        telemetryTags: [],
      },
    ],
    assign: vi.fn(),
    clear: vi.fn(),
    isSlotFull: false,
  })),
}));

vi.mock('@/ui/idleVillage/hooks/useActivityScheduler', () => ({
  useActivityScheduler: vi.fn(() => ({
    scheduledActivities: new Map(),
    getActivityState: vi.fn(() => null),
    villageState: { currentTime: 0 },
  })),
}));

vi.mock('@/shared/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

const mockActivity: ActivityDefinition = {
  id: 'test-activity',
  label: 'Test Activity',
  tags: ['job'],
  slotTags: ['test'],
  resolutionEngineId: 'job',
  maxSlots: 1,
};

const mockVerbs: VerbSummary[] = [
  {
    key: 'verb-1',
    source: 'system',
    activityId: 'test-activity',
    slotId: 'test-slot',
    label: 'Test Verb',
    kindLabel: 'Job',
    isQuest: false,
    isJob: true,
    icon: '🔨',
    visualVariant: 'jade',
    progressStyle: 'border',
    progressFraction: 0,
    elapsedSeconds: 0,
    totalDurationSeconds: 60,
    remainingSeconds: 60,
    injuryPercentage: 5,
    deathPercentage: 0,
    assignedCount: 0,
    totalSlots: 1,
    rewardLabel: 'Gold',
    tone: 'job',
    deadlineLabel: null,
    assigneeNames: [],
  },
];

describe('TheaterView - Resident Slots Integration (IV-RS-C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Legacy fallback behavior', () => {
    it('renders TheaterOverlay when no activity/scheduler provided', () => {
      render(
        <TheaterView
          slotLabel="Test Slot"
          slotIcon="🔨"
          verbs={mockVerbs}
          onClose={vi.fn()}
        />
      );

      // Should render legacy overlay
      expect(screen.getByText('Test Slot')).toBeInTheDocument();
    });
  });

  describe('Resident Slot Controller integration', () => {
    it('renders ResidentSlotRack when activity and scheduler provided', () => {
      const mockScheduler = {
        scheduledActivities: new Map(),
        getActivityState: vi.fn(() => null),
        villageState: { currentTime: 0 },
      };

      render(
        <TheaterView
          slotLabel="Test Slot"
          slotIcon="🔨"
          verbs={mockVerbs}
          onClose={vi.fn()}
          activity={mockActivity}
          residents={{}}
          scheduler={mockScheduler as any}
        />
      );

      // Should render new slot rack implementation
      expect(screen.getByText('Test Slot')).toBeInTheDocument();
      expect(screen.getByText('Slot 1')).toBeInTheDocument();
    });

    it('handles slot assignment telemetry', () => {
      const mockOnAssign = vi.fn();
      const mockScheduler = {
        scheduledActivities: new Map(),
        getActivityState: vi.fn(() => null),
        villageState: { currentTime: 0 },
      };

      render(
        <TheaterView
          slotLabel="Test Slot"
          slotIcon="🔨"
          verbs={mockVerbs}
          onClose={vi.fn()}
          onAssignResident={mockOnAssign}
          activity={mockActivity}
          residents={{}}
          scheduler={mockScheduler as any}
        />
      );

      // TODO: Add interaction tests for telemetry events
      // - theater_slot_rendered on mount
      // - theater_slot_assignment_attempt on click/drop
    });

    it('displays progress data from scheduler', () => {
      const mockScheduler = {
        scheduledActivities: new Map(),
        getActivityState: vi.fn(() => ({
          scheduledId: 'test-id',
          activityId: 'test-activity',
          residentId: 'test-resident',
          startTime: 0,
          duration: 60,
          elapsed: 30,
          progress: 0.5,
          status: 'running' as const,
        })),
        villageState: { currentTime: 30 },
      };

      render(
        <TheaterView
          slotLabel="Test Slot"
          slotIcon="🔨"
          verbs={mockVerbs}
          onClose={vi.fn()}
          activity={mockActivity}
          residents={{}}
          scheduler={mockScheduler as any}
        />
      );

      // Should render with progress data
      expect(screen.getByText('Test Slot')).toBeInTheDocument();
      // TODO: Verify progress bar rendering
    });

    it('handles global pause state', () => {
      // TODO: Test progress freeze when globalPause is active
      // This would require mocking the pause state in scheduler
    });

    it('shows bloom states from slot controller', () => {
      // TODO: Test different drop states (valid/invalid/blocked)
      // and verify bloom state mapping
    });

    it('supports multi-slot activities with badge count', () => {
      // TODO: Test maxSlots > 1 and verify multiple slots rendered
    });
  });

  describe('Backward compatibility', () => {
    it('preserves verb display in new layout', () => {
      const mockScheduler = {
        scheduledActivities: new Map(),
        getActivityState: vi.fn(() => null),
        villageState: { currentTime: 0 },
      };

      render(
        <TheaterView
          slotLabel="Test Slot"
          slotIcon="🔨"
          verbs={mockVerbs}
          onClose={vi.fn()}
          activity={mockActivity}
          residents={{}}
          scheduler={mockScheduler as any}
        />
      );

      // Should show both slots and verbs
      expect(screen.getByText('Test Slot')).toBeInTheDocument();
      expect(screen.getByText('Available Actions')).toBeInTheDocument();
      expect(screen.getByText('Test Verb')).toBeInTheDocument();
    });
  });
});
