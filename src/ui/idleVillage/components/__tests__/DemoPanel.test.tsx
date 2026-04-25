import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoPanel } from '../demo/DemoPanel';
import type { DemoPanelState, ResidentSlotViewModel } from '@/ui/idleVillage/hooks/useSandboxDemoPanel';

const mockSetRequirement = vi.fn();
const mockOnStart = vi.fn();

const createMockSlotViewModel = (overrides?: Partial<ResidentSlotViewModel>): ResidentSlotViewModel => ({
  id: 'slot1',
  label: 'Slot 1',
  assignedResidentId: null,
  index: 0,
  slotId: 'slot1',
  requirement: undefined,
  isRequired: true,
  isPlaceholder: false,
  dropState: 'idle',
  isPlusButton: false,
  portraitUrl: undefined,
  assignedResident: undefined,
  ...overrides,
});

const createMockDemoPanelState = (overrides?: Partial<DemoPanelState>): DemoPanelState => ({
  requirement: 'none',
  requirementLabel: 'Nessun Requisito',
  requirementDescription: 'Tutti gli slot accettano qualsiasi residente.',
  slotViewModels: [
    createMockSlotViewModel({ id: 'slot1', label: 'Slot 1', isPlusButton: false }),
    createMockSlotViewModel({ id: 'plus', label: '+', isPlusButton: true }),
  ],
  metrics: [],
  activityDefinition: {
    id: 'demo',
    label: 'Demo',
    description: 'Demo',
    tags: [],
    slotTags: [],
    resolutionEngineId: 'system',
    durationFormula: '60',
    metadata: {},
    rewards: [],
  },
  preview: { rewards: [], injuryPercentage: 0, deathPercentage: 0 },
  hasAssignments: false,
  assignedResidentIds: [],
  elapsedSeconds: 0,
  progressFraction: 0,
  ...overrides,
});

const mockDemoPanelHandlers = {
  setRequirement: mockSetRequirement,
  onStart: mockOnStart,
};

describe('DemoPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the demo panel with title and buttons', () => {
    const mockState = createMockDemoPanelState();
    render(<DemoPanel demoPanelState={mockState} demoPanelHandlers={mockDemoPanelHandlers} />);

    expect(screen.getByText('Demo Panel')).toBeTruthy();
    expect(screen.getByText('Nessuno')).toBeTruthy();
    expect(screen.getByText('200 HP')).toBeTruthy();
    expect(screen.getByText('Start Demo')).toBeTruthy();
  });

  it('calls setRequirement with "none" when Nessuno button is clicked', () => {
    const mockState = createMockDemoPanelState({ requirement: 'hp200' });
    render(<DemoPanel demoPanelState={mockState} demoPanelHandlers={mockDemoPanelHandlers} />);

    const noneButton = screen.getByText('Nessuno');
    fireEvent.click(noneButton);

    expect(mockSetRequirement).toHaveBeenCalledWith('none');
  });

  it('calls setRequirement with "hp200" when 200 HP button is clicked', () => {
    const mockState = createMockDemoPanelState({ requirement: 'none' });
    render(<DemoPanel demoPanelState={mockState} demoPanelHandlers={mockDemoPanelHandlers} />);

    const hpButton = screen.getByText('200 HP');
    fireEvent.click(hpButton);

    expect(mockSetRequirement).toHaveBeenCalledWith('hp200');
  });

  it('renders slot view models including plus-card', () => {
    const mockState = createMockDemoPanelState();
    render(<DemoPanel demoPanelState={mockState} demoPanelHandlers={mockDemoPanelHandlers} />);

    expect(screen.getByText('Slot 1')).toBeTruthy();
    expect(screen.getByText('+')).toBeTruthy();
  });

  it('calls onStart when Start Demo button is clicked', () => {
    const mockState = createMockDemoPanelState({ hasAssignments: true });
    render(<DemoPanel demoPanelState={mockState} demoPanelHandlers={mockDemoPanelHandlers} />);

    const startButton = screen.getByText('Start Demo');
    fireEvent.click(startButton);

    expect(mockOnStart).toHaveBeenCalled();
  });

  it('disables Start Demo button when hasAssignments is false', () => {
    const mockState = createMockDemoPanelState({ hasAssignments: false });
    render(<DemoPanel demoPanelState={mockState} demoPanelHandlers={mockDemoPanelHandlers} />);

    const startButton = screen.getByText('Start Demo') as HTMLButtonElement;
    expect(startButton.disabled).toBe(true);
  });
});
