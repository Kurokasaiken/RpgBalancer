import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ResidentSlotRackProps } from '@/ui/idleVillage/components/ResidentSlotRack';
import ActivityCardDetail, {
  type ActivityCardDetailProps,
  type ActivityCardMetric,
} from '../ActivityCardDetail';
import { useModifierVisualization } from '@/ui/idleVillage/hooks/useModifierVisualization';
import type { StatModifierEntry } from '@/ui/styleLab/components/StatModifierDisplay';

vi.mock('@/ui/idleVillage/hooks/useModifierVisualization');
vi.mock('@/ui/styleLab/components/StatModifierDisplay', () => ({
  StatModifierDisplay: ({ testId }: { testId?: string }) => (
    <div data-testid={testId ?? 'stat-modifier-display'}>mock-modifier-display</div>
  ),
}));

const mockUseModifierVisualization = vi.mocked(useModifierVisualization);

const mockTheme = {
  tokens: {
    'card-surface': 'rgba(10,10,15,0.95)',
    'panel-border': 'rgba(255,255,255,0.15)',
    'card-shadow-color': 'rgba(0,0,0,0.6)',
    'card-surface-radial': 'rgba(255,255,255,0.04)',
  },
};

vi.mock('@/hooks/useThemeSwitcher', () => ({
  useThemeSwitcher: () => ({ activePreset: mockTheme }),
}));

vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({
  __esModule: true,
  default: (props: ResidentSlotRackProps) => {
    return (
      <div data-testid="mock-slot-rack">
        <button type="button" onClick={() => props.onSlotDrop?.('slot-1', 'resident-99')}>
          trigger-drop
        </button>
        <button type="button" onClick={() => props.onSlotClear?.('slot-1')}>
          trigger-clear
        </button>
      </div>
    );
  },
}));

const baseActivity: ActivityDefinition = {
  id: 'activity-1',
  label: 'Scout the Ridge',
  resolutionEngineId: 'scouting-engine',
  maxSlots: 2,
  slotModifiers: {},
  statRequirement: { label: 'Cunning', allOf: ['cunning'] },
  rewards: [{ resourceId: 'intel', amountFormula: '+3' }],
  tags: ['quest'],
  slotTags: ['village_job'],
};

const slotViewModels: ResidentSlotViewModel[] = [
  {
    id: 'slot-1',
    index: 0,
    label: 'Pathfinder',
    statHint: 'AGI',
    required: true,
    assignedResidentId: null,
    assignedResident: undefined,
    requirement: { label: 'Cunning', allOf: ['cunning'] },
    modifiers: undefined,
    isPlaceholder: false,
    dropState: 'valid',
  },
];

const metrics: ActivityCardMetric[] = [
  { id: 'engine', label: 'Engine', value: 'scouting-engine' },
  { id: 'danger', label: 'Danger', value: '2', tone: 'warning', helperText: 'Moderate risk' },
];

const baseProps: ActivityCardDetailProps = {
  activity: baseActivity,
  slotLabel: 'North Ridge',
  preview: {
    injuryPercentage: 25,
    deathPercentage: 10,
    rewards: baseActivity.rewards ?? [],
  },
  slotViewModels,
  rewards: baseActivity.rewards ?? [],
  metrics,
  durationSeconds: 120,
  elapsedSeconds: 30,
  onStart: vi.fn(),
  onClose: vi.fn(),
  onDropResident: vi.fn(),
  onRemoveResident: vi.fn(),
  isStartDisabled: false,
  draggingResidentId: null,
};

describe('ActivityCardDetail', () => {
  beforeEach(() => {
    mockUseModifierVisualization.mockReturnValue({ entries: [], isLoading: false });
  });

  const renderDetail = (overrideProps: Partial<typeof baseProps> = {}) => {
    const props = { ...baseProps, ...overrideProps };
    render(<ActivityCardDetail {...props} />);
    return props;
  };

  it('renders header, metrics, rewards, and proportional risk stripe data', () => {
    renderDetail();

    expect(screen.getByText('Scout the Ridge')).toBeInTheDocument();
    expect(screen.getByText('North Ridge')).toBeInTheDocument();
    expect(screen.getByText('intel')).toBeInTheDocument();
    expect(screen.getByText('scouting-engine')).toBeInTheDocument();
    expect(screen.getByText('Moderate risk')).toBeInTheDocument();

    const stripe = screen.getByTestId('activity-detail-risk-stripe');
    expect(stripe).toHaveAttribute('data-injury-percent', '25');
    expect(stripe).toHaveAttribute('data-death-percent', '10');
    expect(stripe).toHaveAttribute('data-has-risk', 'true');
  });

  it('disables the Start button when flagged and prevents invocation', () => {
    const props = renderDetail({ isStartDisabled: true, onStart: vi.fn() });

    const startButton = screen.getByRole('button', { name: /start/i });
    expect(startButton).toBeDisabled();
    fireEvent.click(startButton);
    expect(props.onStart).not.toHaveBeenCalled();
  });

  it('invokes onStart when Start button is enabled and clicked', () => {
    const props = renderDetail({ isStartDisabled: false, onStart: vi.fn() });
    const startButton = screen.getByRole('button', { name: /start/i });
    expect(startButton).not.toBeDisabled();
    fireEvent.click(startButton);
    expect(props.onStart).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is pressed', () => {
    const props = renderDetail({ onClose: vi.fn() });
    const closeButton = screen.getByRole('button', { name: /chiudi scheda/i });
    fireEvent.click(closeButton);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('forwards rack drop and clear events to the provided callbacks', () => {
    const props = renderDetail({
      onDropResident: vi.fn(),
      onRemoveResident: vi.fn(),
    });

    const dropButton = screen.getByText('trigger-drop');
    const clearButton = screen.getByText('trigger-clear');

    fireEvent.click(dropButton);
    expect(props.onDropResident).toHaveBeenCalledWith('slot-1', 'resident-99');

    fireEvent.click(clearButton);
    expect(props.onRemoveResident).toHaveBeenCalledWith('slot-1');
  });

  it('renders modifier preview when hook returns entries', () => {
    const modifiers: StatModifierEntry[] = [
      {
        id: 'mod_mill_guard',
        label: 'Guard Bonus',
        statId: 'stat_core_guard',
        scope: 'LOCATION',
        valueLabel: '+12%',
        operation: 'ADD',
      },
    ];
    mockUseModifierVisualization.mockReturnValue({ entries: modifiers, isLoading: false });

    renderDetail();

    const modifierDisplay = screen.getByTestId('activity-card-modifiers');
    expect(modifierDisplay).toBeInTheDocument();
    expect(mockUseModifierVisualization).toHaveBeenCalledWith(
      'activitySlot',
      expect.objectContaining({ entityId: slotViewModels[0].id }),
    );
  });
});
