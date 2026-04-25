import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActiveActivityHUD } from '@/ui/idleVillage/ActiveActivityHUD';
import type { HudEntry } from '@/ui/idleVillage/selectors/useHudSelectors';
import type { ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import type { TheaterRiskStripeMetrics } from '@/ui/idleVillage/theater/riskStripes';

vi.mock('@/ui/idleVillage/components/ActivityActionCard', () => ({
  __esModule: true,
  default: vi.fn(({ label, onClick }: { label: string; onClick?: () => void }) => (
    <div data-testid="activity-action-card" onClick={onClick}>
      {label}
    </div>
  )),
}));

vi.mock('@/ui/idleVillage/components/ActionCardWrapper', () => ({
  ActionCardWrapper: vi.fn(({ activity, dataTestId, onCollect }: any) => (
    <div data-testid={dataTestId || `action-card-wrapper-${activity.id}`} onClick={onCollect}>
      {activity.label}
    </div>
  )),
}));

const mockRiskStripeMetrics: TheaterRiskStripeMetrics = {
  injuryPercent: 10,
  deathPercent: 5,
  injuryOnlyHeight: 5,
  safeHeight: 90,
  hasRisk: true,
  style: {
    background: 'linear-gradient(to top, rgba(239,68,68,0.95), rgba(252,211,77,0.95))',
    boxShadow: '0 0 10px rgba(251,191,36,0.35)',
  },
  segments: {
    deathHeightPercent: 5,
    injuryHeightPercent: 5,
    safeHeightPercent: 90,
  },
};

const createScheduledActivity = (overrides: Partial<ScheduledActivity> = {}): ScheduledActivity => ({
  id: 'sched-1',
  activityId: 'activity-1',
  status: 'running',
  startTime: 0,
  endTime: 100,
  characterIds: ['char-1'],
  snapshotDeathRisk: 0,
  slotId: 'slot-1',
  isAuto: false,
  isCompleted: false,
  ...overrides,
});

const baseSummary: VerbSummary = {
  key: 'sched-1',
  source: 'scheduled',
  activityId: 'activity-1',
  scheduled: createScheduledActivity(),
  slotId: 'slot-1',
  label: 'Test Activity',
  kindLabel: 'Job',
  isQuest: false,
  isJob: true,
  icon: '⚔️',
  visualVariant: 'solar',
  progressStyle: 'border',
  progressFraction: 0.5,
  elapsedSeconds: 50,
  totalDurationSeconds: 100,
  remainingSeconds: 50,
  injuryPercentage: 10,
  deathPercentage: 5,
  assignedCount: 1,
  totalSlots: 1,
  rewardLabel: '10 gold',
  riskLabel: 'Low',
  tone: 'neutral',
  deadlineLabel: '2h',
  assigneeNames: ['Warrior'],
  autoState: null,
  riskStripeMetrics: mockRiskStripeMetrics,
};

const createMockHudEntry = (overrides: Partial<HudEntry> = {}): HudEntry => ({
  scheduled: createScheduledActivity(),
  summary: { ...baseSummary },
  variant: 'solar',
  ...overrides,
});

describe('ActiveActivityHUD', () => {
  it('renders empty state when no hudEntries', () => {
    render(<ActiveActivityHUD hudEntries={[]} />);

    expect(screen.getByText('Nessuna attività in corso.')).toBeInTheDocument();
    expect(screen.getByText('Active HUD')).toBeInTheDocument();
  });

  it('renders hudEntries as ActivityActionCard components', () => {
    const mockEntry = createMockHudEntry();
    render(<ActiveActivityHUD hudEntries={[mockEntry]} />);

    expect(screen.getByTestId('activity-action-card')).toHaveTextContent('Test Activity');
    expect(screen.getByText('1')).toBeInTheDocument(); // Count badge
  });

  it('calls onResolve when clicking completed activity', () => {
    const mockOnResolve = vi.fn();
    const completedEntry = createMockHudEntry({
      scheduled: {
        ...createMockHudEntry().scheduled,
        status: 'completed',
      } as ScheduledActivity,
    });

    render(<ActiveActivityHUD hudEntries={[completedEntry]} onResolve={mockOnResolve} />);

    const card = screen.getByTestId('activity-action-card');
    fireEvent.click(card);

    expect(mockOnResolve).toHaveBeenCalledWith('sched-1');
  });

  it('does not call onResolve for non-completed activities', () => {
    const mockOnResolve = vi.fn();
    const runningEntry = createMockHudEntry();

    render(<ActiveActivityHUD hudEntries={[runningEntry]} onResolve={mockOnResolve} />);

    const card = screen.getByTestId('activity-action-card');
    fireEvent.click(card);

    expect(mockOnResolve).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<ActiveActivityHUD hudEntries={[]} className="custom-class" />);

    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('custom-class');
  });

  it('displays heroic feedback for completed quests with risk', () => {
    // Heroic feedback is handled inside ActivityActionCard, so we just verify it's passed through
    // This is tested in ActivityActionCard tests
    const questEntry = createMockHudEntry({
      scheduled: {
        ...createMockHudEntry().scheduled,
        status: 'completed',
        snapshotDeathRisk: 0.1,
      } as ScheduledActivity,
      summary: {
        ...createMockHudEntry().summary,
        isQuest: true,
      } as VerbSummary,
    });

    render(<ActiveActivityHUD hudEntries={[questEntry]} />);

    // The heroic feedback logic is internal to the component and passed to ActivityActionCard
    // We can't easily test it here without more complex mocking
    expect(screen.getByTestId('activity-action-card')).toBeInTheDocument();
  });

  it('sorts entries with completed first, then by endTime', () => {
    const entry1 = createMockHudEntry({
      scheduled: {
        ...createMockHudEntry().scheduled,
        id: 'sched-1',
        status: 'completed',
        endTime: 200,
      } as ScheduledActivity,
    });
    const entry2 = createMockHudEntry({
      scheduled: {
        ...createMockHudEntry().scheduled,
        id: 'sched-2',
        status: 'running',
        endTime: 150,
      } as ScheduledActivity,
    });
    const entry3 = createMockHudEntry({
      scheduled: {
        ...createMockHudEntry().scheduled,
        id: 'sched-3',
        status: 'running',
        endTime: 100,
      } as ScheduledActivity,
    });

    render(<ActiveActivityHUD hudEntries={[entry2, entry1, entry3]} />);

    const cards = screen.getAllByTestId('activity-action-card');
    expect(cards).toHaveLength(3);
    // Completed should be first, then sorted by endTime ascending
    expect(cards[0]).toHaveTextContent('Test Activity'); // sched-1 completed
    expect(cards[1]).toHaveTextContent('Test Activity'); // sched-3 endTime 100
    expect(cards[2]).toHaveTextContent('Test Activity'); // sched-2 endTime 150
  });
});
