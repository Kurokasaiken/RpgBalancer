import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityArea, {
  type ActivityAreaHandlers,
  type ActivityAreaProps,
  type ActivityAreaSlot,
} from '../ActivityArea';
import {
  createActivityAreaProps,
  createMockActivitySlot,
  mockResidentsCandidates,
} from './utils/ActivityArea.test-utils';
import { RESIDENT_DRAG_MIME } from '../constants';

const createHandlers = (): ActivityAreaHandlers => ({
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
  slotId: overrides.slotId ?? 'gather-slot',
  label: overrides.label ?? 'Gather Supplies',
  iconName: overrides.iconName ?? '🛠️',
  assignedWorkerName: overrides.assignedWorkerName ?? null,
  assignedWorkerAvatarUrl: overrides.assignedWorkerAvatarUrl ?? null,
  visualVariant: overrides.visualVariant ?? 'jade',
  mapSlotLabel: overrides.mapSlotLabel ?? 'Alcova',
  progressFraction: overrides.progressFraction ?? 0.35,
  elapsedSeconds: overrides.elapsedSeconds ?? 18,
  totalDurationSeconds: overrides.totalDurationSeconds ?? 120,
  canAcceptDrop: overrides.canAcceptDrop ?? true,
  isCycleControl: overrides.isCycleControl ?? false,
});

const renderActivityArea = (props?: Partial<ActivityAreaProps>) => {
  const handlers = props?.handlers ?? createHandlers();
  return {
    handlers,
    ...render(
      <ActivityArea
        slots={
          props?.slots ??
          [
            createSlot({
              slotId: 'day-night-cycle',
              label: 'Ciclo Giorno/Notte',
              iconName: '☀️',
              isCycleControl: true,
              canAcceptDrop: false,
            }),
            createSlot(),
          ]
        }
        isDayPhase={props?.isDayPhase ?? true}
        cycleProgressFraction={props?.cycleProgressFraction ?? 0.5}
        cycleElapsedSeconds={props?.cycleElapsedSeconds ?? 45}
        secondsPerTimeUnit={props?.secondsPerTimeUnit ?? 60}
        draggingResidentId={props?.draggingResidentId ?? null}
        slotDropStates={props?.slotDropStates ?? {}}
        locationDropState={props?.locationDropState ?? 'idle'}
        handlers={handlers}
        locationTitle={props?.locationTitle ?? 'Foresta Principale'}
        locationDescription={props?.locationDescription ?? 'Trascina un residente compatibile.'}
      />,
    ),
  };
};

const createDataTransfer = (residentId: string): DataTransfer =>
  ({
    dropEffect: 'none',
    effectAllowed: 'all',
    getData: (key: string) => {
      if (key === 'text/resident-id' || key === 'text/plain' || key === RESIDENT_DRAG_MIME) {
        return residentId;
      }
      return '';
    },
    setData: vi.fn(),
  }) as unknown as DataTransfer;

describe('ActivityArea (RTL)', () => {
  it('renders slots and triggers the cycle CTA when the control card is pressed', () => {
    const { handlers } = renderActivityArea();

    fireEvent.click(screen.getByTestId('activity-slot-day-night-cycle'));

    expect(handlers.onToggleCycle).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Gather Supplies/)).toBeInTheDocument();
    expect(screen.getByText(/Foresta Principale/)).toBeInTheDocument();
  });

  it('reveals the location bloom only when drop state is valid', () => {
    const { rerender } = renderActivityArea({ locationDropState: 'valid' });
    expect(screen.getByTestId('location-card-bloom')).toBeVisible();

    rerender(
      <ActivityArea
        slots={[
          createSlot({
            slotId: 'day-night-cycle',
            label: 'Ciclo Giorno/Notte',
            iconName: '☀️',
            isCycleControl: true,
            canAcceptDrop: false,
          }),
          createSlot(),
        ]}
        isDayPhase
        cycleProgressFraction={0.5}
        cycleElapsedSeconds={45}
        secondsPerTimeUnit={60}
        draggingResidentId={null}
        slotDropStates={{}}
        locationDropState="invalid"
        handlers={createHandlers()}
        locationTitle="Foresta Principale"
        locationDescription="Trascina un residente compatibile."
      />,
    );

    expect(screen.queryByTestId('location-card-bloom')).not.toBeInTheDocument();
  });

  it('forwards resident drops on slots to the worker handler', () => {
    const { handlers } = renderActivityArea();
    const slot = screen.getByTestId('activity-slot-gather-slot');
    const dataTransfer = createDataTransfer('resident-42');

    fireEvent.dragOver(slot, { dataTransfer, preventDefault: () => {} });
    fireEvent.drop(slot, { dataTransfer, preventDefault: () => {} });

    expect(handlers.onWorkerDrop).toHaveBeenCalledWith('gather-slot', 'resident-42');
  });

  it('highlights active slot', () => {
    const slot = createMockActivitySlot();
    const props = createActivityAreaProps({
      slots: [slot],
      selectedSlotId: slot.slotId,
      highlightSelectedSlot: true,
    });
    render(<ActivityArea {...props} />);
    expect(screen.getByText(slot.label)).toBeInTheDocument();
  });

  it('renders picker open with candidates', () => {
    const slot = createMockActivitySlot();
    const props = createActivityAreaProps({
      slots: [slot],
      selectedSlotId: slot.slotId,
      highlightSelectedSlot: true,
      residentsCandidates: mockResidentsCandidates,
      onAssign: vi.fn(),
      onClose: vi.fn(),
    });
    render(<ActivityArea {...props} />);
    expect(screen.getAllByText('Assegna')).toHaveLength(2);
  });

  it('renders stacked layout', () => {
    const slots = [createMockActivitySlot(), createMockActivitySlot({ slotId: 'slot2', label: 'Activity 2' })];
    const props = createActivityAreaProps({
      slots,
      layout: 'stacked',
    });
    const { container } = render(<ActivityArea {...props} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
