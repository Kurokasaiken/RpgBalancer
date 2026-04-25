import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import type { ResidentState } from '../../../src/engine/game/idleVillage/TimeEngine';
import type { RackScenarioKey } from '../../../src/ui/idleVillage/TestRosterPage';
import { RackScenarioPanel } from '../../../src/ui/idleVillage/TestRosterPage';

vi.mock('../../../src/ui/idleVillage/components/ResidentSlotRack', () => ({
  __esModule: true,
  default: () => <div data-testid="slot-rack-mock" />,
}));

const mockAssignResidentToSlot = vi.fn();

vi.mock('../../../src/ui/idleVillage/slots/useResidentSlotController', () => ({
  useResidentSlotController: () => ({
    slots: [
      {
        id: 'slot-lab-open-slot-0',
        label: 'Slot 0',
        dropState: 'idle',
        bloomState: 'idle',
        isPlaceholder: false,
        requirement: undefined,
      },
    ],
    assignResidentToSlot: mockAssignResidentToSlot,
    clearSlot: vi.fn(),
    getSlotProgress: vi.fn(),
    warnings: [],
    dropState: 'idle',
  }),
}));

describe('RackScenarioPanel registerScenarioApi guards', () => {
  const baseScenario = {
    id: 'open' as RackScenarioKey,
    title: 'Rack A · Scenario permissivo',
    subtitle: 'Accetta qualunque residente disponibile',
  };
  const residentsById: Record<string, ResidentState> = {
    'resident-1': {
      id: 'resident-1',
      displayName: 'Resident 1',
      status: 'available',
      fatigue: 0,
      currentHp: 100,
      maxHp: 100,
      isInjured: false,
      statSnapshot: { hp: 100 },
    } as ResidentState,
  };

  const registerScenarioApi = vi.fn();
  const onAssignmentResult = vi.fn();

  beforeEach(() => {
    registerScenarioApi.mockReset();
    onAssignmentResult.mockReset();
    mockAssignResidentToSlot.mockReset();
  });

  const renderPanel = () =>
    render(
      <RackScenarioPanel
        scenario={baseScenario}
        residentsById={residentsById}
        hoveredResidentId={null}
        assignments={{ 'slot-lab-open-slot-0': null }}
        onAssign={vi.fn()}
        onClear={vi.fn()}
        onAssignmentResult={onAssignmentResult}
        lastAttempt={null}
        registerScenarioApi={registerScenarioApi}
        pickerCandidates={[]}
        onOpenPicker={vi.fn()}
      />,
    );

  const getApi = async () => {
    await waitFor(() => expect(registerScenarioApi).toHaveBeenCalled());
    const call = registerScenarioApi.mock.calls.find(([scenarioId]) => scenarioId === 'open');
    expect(call).toBeDefined();
    return call?.[1]!;
  };

  it('fails assignment when preferredSlotId is missing', async () => {
    renderPanel();
    const api = await getApi();

    const result = api.assignResident('resident-1');

    expect(result.success).toBe(false);
    expect(result.details).toContain('Slot specifico');
    expect(onAssignmentResult).toHaveBeenCalledWith(
      'open',
      expect.objectContaining({ success: false, details: expect.stringContaining('Slot specifico') }),
      'resident-1',
    );
    expect(mockAssignResidentToSlot).not.toHaveBeenCalled();
  });

  it('fails assignment when preferredSlotId does not belong to scenario', async () => {
    renderPanel();
    const api = await getApi();

    const result = api.assignResident('resident-1', 'slot-lab-restricted-slot-0');

    expect(result.success).toBe(false);
    expect(result.details).toContain('Slot non valido');
    expect(onAssignmentResult).toHaveBeenCalledWith(
      'open',
      expect.objectContaining({ success: false, details: expect.stringContaining('Slot non valido') }),
      'resident-1',
    );
    expect(mockAssignResidentToSlot).not.toHaveBeenCalled();
  });
});
