import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ActivityAreaHandlers, ActivityAreaSlot } from '../ActivityArea';
import type { ActivitySlotCardProps } from '../components/ActivitySlot';
import type { LocationCardProps } from '../components/LocationCard';
import ActivityArea from '../ActivityArea';

const activitySlotCardMock = vi.fn(({ slotId, label, onWorkerDrop }: ActivitySlotCardProps) => (
  <button type="button" data-testid={`activity-slot-${slotId}`} onClick={() => onWorkerDrop?.('resident-mock')}>
    {label}
  </button>
));

vi.mock('../components/ActivitySlot', () => ({
  __esModule: true,
  default: (props: ActivitySlotCardProps) => activitySlotCardMock(props),
}));

const locationCardMock = vi.fn(({ title, onResidentDrop }: LocationCardProps) => (
  <button type="button" data-testid="location-card" onClick={() => onResidentDrop?.('resident-loc')}>
    {title}
  </button>
));

vi.mock('../components/LocationCard', () => ({
  __esModule: true,
  default: (props: LocationCardProps) => locationCardMock(props),
}));

const baseHandlers = (): ActivityAreaHandlers => ({
  onWorkerDrop: vi.fn(),
  onInspect: vi.fn(),
  onToggleCycle: vi.fn(),
  onLocationInspect: vi.fn(),
  onLocationDragEnter: vi.fn(),
  onLocationDragLeave: vi.fn(),
  onLocationDrop: vi.fn(),
  onSlotResidentDragEnter: vi.fn(),
  onSlotResidentDragLeave: vi.fn(),
});

const createSlot = (overrides: Partial<ActivityAreaSlot> = {}): ActivityAreaSlot => ({
  slotId: overrides.slotId ?? 'slot-1',
  label: overrides.label ?? 'Foraging',
  iconName: overrides.iconName ?? '🍃',
  assignedWorkerName: overrides.assignedWorkerName ?? 'Atria',
  assignedWorkerAvatarUrl: overrides.assignedWorkerAvatarUrl ?? null,
  visualVariant: overrides.visualVariant ?? 'jade',
  mapSlotLabel: overrides.mapSlotLabel,
  progressFraction: overrides.progressFraction ?? 0.5,
  elapsedSeconds: overrides.elapsedSeconds ?? 30,
  totalDurationSeconds: overrides.totalDurationSeconds ?? 120,
  canAcceptDrop: overrides.canAcceptDrop ?? true,
  isCycleControl: overrides.isCycleControl ?? false,
});

describe('ActivityArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders slots, forwards handlers, and shows location info', () => {
    const handlers = baseHandlers();
    const slots: ActivityAreaSlot[] = [
      createSlot({ slotId: 'slot-b', label: 'Brew', mapSlotLabel: 'Tavern' }),
      createSlot({ slotId: 'cycle', label: 'Cycle Control', isCycleControl: true }),
      createSlot({ slotId: 'slot-a', label: 'Gather' }),
    ];

    render(
      <ActivityArea
        slots={slots}
        isDayPhase
        cycleProgressFraction={0.4}
        cycleElapsedSeconds={24}
        secondsPerTimeUnit={60}
        draggingResidentId="resident-mock"
        slotDropStates={{ 'slot-a': 'valid', 'slot-b': 'idle' }}
        locationDropState="idle"
        handlers={handlers}
        locationTitle="Foresta Ombrosa"
        locationDescription="Il cuore delle spedizioni."
      />,
    );

    const slotButtons = screen.getAllByTestId(/activity-slot-/);
    expect(slotButtons).toHaveLength(3);

    activitySlotCardMock.mock.calls.forEach(([props]) => {
      expect(props).toMatchObject({ isInteractive: true });
    });

    const cycleCall = activitySlotCardMock.mock.calls.find(([props]) => props.slotId === 'cycle');
    const gatherCall = activitySlotCardMock.mock.calls.find(([props]) => props.slotId === 'slot-a');
    expect(cycleCall?.[0].onResidentDragEnter).toBeUndefined();
    expect(gatherCall?.[0].onResidentDragEnter).toBe(handlers.onSlotResidentDragEnter);

    gatherCall?.[0].onResidentDragEnter?.('slot-a', 'resident-mock');
    expect(handlers.onSlotResidentDragEnter).toHaveBeenCalledWith('slot-a', 'resident-mock');

    gatherCall?.[0].onResidentDragLeave?.('slot-a');
    expect(handlers.onSlotResidentDragLeave).toHaveBeenCalledWith('slot-a');

    slotButtons[1].click(); // triggers onWorkerDrop with resident-mock
    expect(handlers.onWorkerDrop).toHaveBeenCalledWith(expect.any(String), 'resident-mock');

    const locationButton = screen.getByTestId('location-card');
    locationButton.click();
    expect(handlers.onLocationDrop).toHaveBeenCalledWith('resident-loc');
    expect(screen.getAllByText('Foresta Ombrosa').length).toBeGreaterThanOrEqual(1);
  });

  it('matches snapshot with mixed slot types', () => {
    const { container } = render(
      <ActivityArea
        slots={[
          createSlot({ slotId: 'cycle', label: 'Cycle Control', isCycleControl: true }),
          createSlot({ slotId: 'slot-a', label: 'Gather', assignedWorkerName: null }),
        ]}
        isDayPhase={false}
        cycleProgressFraction={0.25}
        cycleElapsedSeconds={90}
        secondsPerTimeUnit={45}
        draggingResidentId={null}
        slotDropStates={{}}
        locationDropState="invalid"
        handlers={baseHandlers()}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
