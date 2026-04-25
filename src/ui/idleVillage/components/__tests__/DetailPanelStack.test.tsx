import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import { DetailPanelStack, type DetailPanelContext } from '../DetailPanelStack';

type DetailPanelCardProps = import('../DetailPanelCard').DetailPanelCardProps;

vi.mock('../DetailPanelCard', () => {
  const MockCard = ({
    slotId,
    activity,
    onStart,
    onClose,
    onWorkerDrop,
  }: DetailPanelCardProps) => (
    <div data-testid={`detail-card-${slotId}`}>
      <span>{activity.label}</span>
      <button type="button" onClick={() => onStart(slotId)}>
        start
      </button>
      <button type="button" onClick={() => onClose(slotId)}>
        close
      </button>
      <button type="button" onClick={() => onWorkerDrop(activity.id, 'resident-1', { autoStart: true })}>
        assign
      </button>
    </div>
  );
  return { DetailPanelCard: MockCard };
});

const buildContext = (overrides?: Partial<DetailPanelContext>): DetailPanelContext => {
  const activity: ActivityDefinition = {
    id: 'activity-1',
    label: 'Gathering',
    durationFormula: '60',
    tags: [],
    slotTags: [],
    resolutionEngineId: 'job',
    metadata: {},
    rewards: [],
  };

  const slot: ActivitySlotData = {
    slotId: 'slot-1',
    label: 'Slot 1',
    iconName: '★',
    assignedWorkerId: null,
    activity,
    visualVariant: 'azure',
  };

  return {
    slotId: 'slot-1',
    activity,
    slot,
    ...overrides,
  };
};

const residentsById: Record<string, ResidentState> = {};

describe('DetailPanelStack', () => {
  it('renders nothing when there are no contexts', () => {
    const { container } = render(
      <DetailPanelStack
        detailContexts={[]}
        slotAssignments={{}}
        residentsById={residentsById}
        secondsPerTimeUnit={60}
        draggingResidentId={null}
        schedulerBridge={{}}
        onWorkerDrop={vi.fn()}
        onStart={vi.fn()}
        onClose={vi.fn()}
        isTheaterOpen={false}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('wires callbacks through DetailPanelCard mock', async () => {
    const onWorkerDrop = vi.fn();
    const onStart = vi.fn();
    const onClose = vi.fn();

    render(
      <DetailPanelStack
        detailContexts={[buildContext()]}
        slotAssignments={{}}
        residentsById={residentsById}
        secondsPerTimeUnit={60}
        draggingResidentId={null}
        schedulerBridge={{}}
        onWorkerDrop={onWorkerDrop}
        onStart={onStart}
        onClose={onClose}
        isTheaterOpen
      />,
    );

    const startButton = screen.getByRole('button', { name: /start/i });
    const closeButton = screen.getByRole('button', { name: /close/i });
    const assignButton = screen.getByRole('button', { name: /assign/i });

    fireEvent.click(startButton);
    fireEvent.click(closeButton);
    fireEvent.click(assignButton);

    expect(onStart).toHaveBeenCalledWith('slot-1');
    expect(onClose).toHaveBeenCalledWith('slot-1');
    expect(onWorkerDrop).toHaveBeenCalledWith('activity-1', 'resident-1', { autoStart: true });

    const stack = screen.getByTestId('detail-panel-stack');
    expect(stack).toHaveClass('pointer-events-none');
    expect(stack).toHaveClass('lg:pl-16');
    expect(stack).toHaveStyle({ pointerEvents: 'none' });
  });
});
