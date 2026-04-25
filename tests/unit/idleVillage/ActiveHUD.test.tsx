import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActiveHUD from '../../../src/ui/idleVillage/components/ActiveHUD';
import type { ActiveHUDState } from '../../../src/ui/idleVillage/hooks/useActiveHUDState';
import type { VillageState } from '../../../src/engine/game/idleVillage/TimeEngine';

// Mock useActivityTelemetry to avoid side effects in tests
vi.mock('../../../src/ui/idleVillage/hooks/useActivityTelemetry', () => ({
  useActivityTelemetry: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ActiveHUD', () => {
  const mockVillageState: VillageState = {
    currentTime: 100,
    resources: {},
    residents: {
      resident1: {
        id: 'resident1',
        displayName: 'Test Worker',
        status: 'away',
        fatigue: 50,
        currentHp: 100,
        maxHp: 100,
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      },
    },
    activities: {},
    eventLog: [],
    questOffers: {},
  };

  describe('Phase 12 hudState interface', () => {
    it('renders empty state when no activities', () => {
      const emptyHudState: ActiveHUDState = {
        activities: [],
        counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 },
        hasActiveActivities: false,
      };

      render(
        <ActiveHUD
          hudState={emptyHudState}
          villageState={mockVillageState}
          secondsPerTimeUnit={60}
        />
      );

      expect(screen.getByTestId('active-hud')).toBeInTheDocument();
      expect(screen.getByText('Nessuna attività in corso')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders activities from hudState', () => {
      const hudState: ActiveHUDState = {
        activities: [
          {
            key: 'job1-resident1',
            activityType: 'job',
            label: 'Mining',
            icon: '⛏️',
            residentId: 'resident1',
            residentName: 'Test Worker',
            progress: 0.5,
            remainingSeconds: 120,
            status: 'running',
            visualVariant: 'azure',
            scheduledId: 'sched1',
            activityId: 'job_mining',
          },
        ],
        counts: { jobs: 1, quests: 0, maintenance: 0, total: 1 },
        hasActiveActivities: true,
      };

      render(
        <ActiveHUD
          hudState={hudState}
          villageState={mockVillageState}
          secondsPerTimeUnit={60}
        />
      );

      expect(screen.getByText('Mining')).toBeInTheDocument();
      expect(screen.getByText('TEST WORKER')).toBeInTheDocument();
      expect(screen.getByText('2:00')).toBeInTheDocument(); // 120 seconds = 2:00
      expect(screen.getByText('1')).toBeInTheDocument(); // Total count
    });

    it('displays correct time formatting', () => {
      const hudState: ActiveHUDState = {
        activities: [
          {
            key: 'job1-resident1',
            activityType: 'job',
            label: 'Crafting',
            icon: '🔨',
            residentId: 'resident1',
            residentName: 'Crafter',
            progress: 0.75,
            remainingSeconds: 185, // 3 time units + 5 seconds
            status: 'running',
            visualVariant: 'jade',
            scheduledId: 'sched2',
            activityId: 'job_crafting',
          },
        ],
        counts: { jobs: 1, quests: 0, maintenance: 0, total: 1 },
        hasActiveActivities: true,
      };

      render(
        <ActiveHUD
          hudState={hudState}
          villageState={mockVillageState}
          secondsPerTimeUnit={60}
        />
      );

      expect(screen.getByText('3:05')).toBeInTheDocument(); // 185 seconds = 3:05
    });

    it('respects maxVisible limit', () => {
      const hudState: ActiveHUDState = {
        activities: [
          {
            key: 'job1-resident1',
            activityType: 'job',
            label: 'Job 1',
            icon: '⚙️',
            residentId: 'resident1',
            residentName: 'Worker 1',
            progress: 0.5,
            remainingSeconds: 60,
            status: 'running',
            visualVariant: 'azure',
            scheduledId: 'sched1',
            activityId: 'job1',
          },
          {
            key: 'job2-resident2',
            activityType: 'job',
            label: 'Job 2',
            icon: '⚙️',
            residentId: 'resident2',
            residentName: 'Worker 2',
            progress: 0.3,
            remainingSeconds: 90,
            status: 'running',
            visualVariant: 'azure',
            scheduledId: 'sched2',
            activityId: 'job2',
          },
          {
            key: 'job3-resident3',
            activityType: 'job',
            label: 'Job 3',
            icon: '⚙️',
            residentId: 'resident3',
            residentName: 'Worker 3',
            progress: 0.2,
            remainingSeconds: 120,
            status: 'running',
            visualVariant: 'azure',
            scheduledId: 'sched3',
            activityId: 'job3',
          },
        ],
        counts: { jobs: 3, quests: 0, maintenance: 0, total: 3 },
        hasActiveActivities: true,
      };

      render(
        <ActiveHUD
          hudState={hudState}
          villageState={mockVillageState}
          secondsPerTimeUnit={60}
          maxVisible={2}
        />
      );

      expect(screen.getByText('Job 1')).toBeInTheDocument();
      expect(screen.getByText('Job 2')).toBeInTheDocument();
      expect(screen.queryByText('Job 3')).not.toBeInTheDocument();
      expect(screen.getByText('+1 attività aggiuntive in coda')).toBeInTheDocument();
    });

    it('renders compact variant correctly', () => {
      const hudState: ActiveHUDState = {
        activities: [
          {
            key: 'job1-resident1',
            activityType: 'job',
            label: 'Quick Task',
            icon: '⚡',
            residentId: 'resident1',
            residentName: 'Fast Worker',
            progress: 0.9,
            remainingSeconds: 30,
            status: 'running',
            visualVariant: 'solar',
            scheduledId: 'sched1',
            activityId: 'job_quick',
          },
        ],
        counts: { jobs: 1, quests: 0, maintenance: 0, total: 1 },
        hasActiveActivities: true,
      };

      render(
        <ActiveHUD
          hudState={hudState}
          villageState={mockVillageState}
          secondsPerTimeUnit={60}
          variant="compact"
        />
      );

      const section = screen.getByTestId('active-hud');
      expect(section).toHaveAttribute('data-variant', 'compact');
      expect(screen.getByText('Mission Log')).toBeInTheDocument();
    });
  });

  describe('Legacy activeSlots interface', () => {
    it('renders activities from legacy activeSlots', () => {
      const activeSlots = [
        {
          slot: {
            slotId: 'job_mining',
            label: 'Mining',
            iconName: '⛏️',
            assignedWorkerId: 'resident1',
            activity: undefined as never,
            visualVariant: 'azure' as const,
          },
          state: {
            scheduledId: 'sched1',
            activityId: 'job_mining',
            residentId: 'resident1',
            startTime: 0,
            duration: 180,
            elapsed: 60,
            progress: 0.33,
            status: 'running' as const,
          },
        },
      ];

      render(
        <ActiveHUD
          activeSlots={activeSlots}
          secondsPerTimeUnit={60}
        />
      );

      expect(screen.getByText('Mining')).toBeInTheDocument();
      expect(screen.getByText('RESIDENT1')).toBeInTheDocument();
      expect(screen.getByText('2:00')).toBeInTheDocument(); // 120 seconds remaining
    });
  });

  describe('Telemetry integration', () => {
    it('enables telemetry when enableTelemetry is true', async () => {
      const { useActivityTelemetry } = await import('../../../src/ui/idleVillage/hooks/useActivityTelemetry');
      
      const hudState: ActiveHUDState = {
        activities: [],
        counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 },
        hasActiveActivities: false,
      };

      render(
        <ActiveHUD
          hudState={hudState}
          villageState={mockVillageState}
          secondsPerTimeUnit={60}
          enableTelemetry={true}
        />
      );

      expect(useActivityTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          hudState,
          villageState: mockVillageState,
        })
      );
    });

    it('disables telemetry when enableTelemetry is false', async () => {
      const { useActivityTelemetry } = await import('../../../src/ui/idleVillage/hooks/useActivityTelemetry');
      
      const hudState: ActiveHUDState = {
        activities: [],
        counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 },
        hasActiveActivities: false,
      };

      render(
        <ActiveHUD
          hudState={hudState}
          villageState={mockVillageState}
          secondsPerTimeUnit={60}
          enableTelemetry={false}
        />
      );

      expect(useActivityTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });
});
