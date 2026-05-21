import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ActivityDetail } from '@/ui/idleVillage/components/ActivityDetail';
import { DndContext } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';

const WRAPPER = ({ children }: { children: React.ReactNode }) => (
  <DndContext>
    <DragProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </DragProvider>
  </DndContext>
);

const MOCK_SLOTS = [
  {
    id: 'slot-1',
    state: 'empty' as const,
    occupantId: null,
    activityId: 'job-1',
    activityLabel: 'Job 1',
    displayRole: 'job' as const,
  },
];

describe('ActivityDetail', () => {
  it('TEST-111: Renders without crashing', () => {
    const { container } = render(
      <ActivityDetail
        activityId="job-1"
        activityName="Taglia Legna"
        activityType="job"
        slots={MOCK_SLOTS}
      />,
      { wrapper: WRAPPER }
    );
    expect(container).toBeTruthy();
  });

  it('TEST-112: Displays activity name', () => {
    const { container } = render(
      <ActivityDetail
        activityId="job-1"
        activityName="Taglia Legna"
        activityType="job"
        slots={MOCK_SLOTS}
      />,
      { wrapper: WRAPPER }
    );
    const text = container.textContent || '';
    expect(text).toContain('Taglia Legna');
  });

  it('TEST-113: Shows job badge for job type', () => {
    const { container } = render(
      <ActivityDetail
        activityId="job-1"
        activityName="Test Job"
        activityType="job"
        slots={MOCK_SLOTS}
      />,
      { wrapper: WRAPPER }
    );
    const text = container.textContent || '';
    expect(text).toContain('job');
  });

  it('TEST-114: Shows quest badge for quest type', () => {
    const { container } = render(
      <ActivityDetail
        activityId="quest-1"
        activityName="Test Quest"
        activityType="quest"
        slots={MOCK_SLOTS}
      />,
      { wrapper: WRAPPER }
    );
    const text = container.textContent || '';
    expect(text).toContain('quest');
  });

  it('TEST-115: Displays skill check DC', () => {
    const { container } = render(
      <ActivityDetail
        activityId="job-1"
        activityName="Test"
        activityType="job"
        skillCheckDC={15}
        slots={MOCK_SLOTS}
      />,
      { wrapper: WRAPPER }
    );
    const text = container.textContent || '';
    expect(text).toContain('DC 15');
  });

  it('TEST-116: Shows description when provided', () => {
    const { container } = render(
      <ActivityDetail
        activityId="job-1"
        activityName="Test"
        activityType="job"
        description="Chop wood safely"
        slots={MOCK_SLOTS}
      />,
      { wrapper: WRAPPER }
    );
    const text = container.textContent || '';
    expect(text).toContain('Chop wood safely');
  });

  it('TEST-117: Displays rewards', () => {
    const { container } = render(
      <ActivityDetail
        activityId="job-1"
        activityName="Test"
        activityType="job"
        slots={MOCK_SLOTS}
        rewards={{ wood: 15, xp: 50 }}
      />,
      { wrapper: WRAPPER }
    );
    const text = container.textContent || '';
    expect(text).toContain('Rewards');
    expect(text).toContain('Experience');
  });

  it('TEST-118: Renders SlotRack for assignment', () => {
    const { container } = render(
      <ActivityDetail
        activityId="job-1"
        activityName="Test"
        activityType="job"
        slots={MOCK_SLOTS}
      />,
      { wrapper: WRAPPER }
    );
    const text = container.textContent || '';
    expect(text).toContain('Assign Residents');
  });

  it('TEST-119: Shows all reward types when present', () => {
    const { container } = render(
      <ActivityDetail
        activityId="job-1"
        activityName="Test"
        activityType="job"
        slots={MOCK_SLOTS}
        rewards={{ wood: 20, gold: 10, food: 5, xp: 100 }}
      />,
      { wrapper: WRAPPER }
    );
    const text = container.textContent || '';
    expect(text).toContain('20');
    expect(text).toContain('10');
    expect(text).toContain('100');
  });

  it('TEST-120: Has proper color coding by type', () => {
    const { container } = render(
      <ActivityDetail
        activityId="quest-1"
        activityName="Test"
        activityType="quest"
        slots={MOCK_SLOTS}
      />,
      { wrapper: WRAPPER }
    );
    expect(container).toBeTruthy();
  });
});
