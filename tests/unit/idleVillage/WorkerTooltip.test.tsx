import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import '@testing-library/jest-dom';
import WorkerTooltip from '@/ui/idleVillage/components/WorkerTooltip';
import { useWorkerTooltipData, useWorkerBioConfig } from '@/ui/idleVillage/hooks/useWorkerTooltipData';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { LocalizationHandle } from '@/hooks/useLocalization';
import { useLocalization } from '@/hooks/useLocalization';
import { useModifierVisualization } from '@/ui/idleVillage/hooks/useModifierVisualization';
import type { StatModifierEntry } from '@/ui/styleLab/components/StatModifierDisplay';

// Mock the hooks
vi.mock('@/ui/idleVillage/hooks/useWorkerTooltipData');
vi.mock('@/hooks/useLocalization');
vi.mock('@/ui/idleVillage/hooks/useModifierVisualization');
vi.mock('@/ui/styleLab/components/StatModifierDisplay', () => ({
  StatModifierDisplay: ({ testId }: { testId?: string }) => (
    <div data-testid={testId ?? 'stat-modifier-display'}>mock-modifier-display</div>
  ),
}));

const mockUseWorkerTooltipData = vi.mocked(useWorkerTooltipData);
const mockUseWorkerBioConfig = vi.mocked(useWorkerBioConfig);
const mockUseLocalization = vi.mocked(useLocalization);
const mockUseModifierVisualization = vi.mocked(useModifierVisualization);

// Mock createPortal
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

describe('WorkerTooltip', () => {
  const mockResident: ResidentState = {
    id: 'test-worker-1',
    displayName: 'Test Worker',
    status: 'available',
    fatigue: 25,
    currentHp: 80,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    survivalCount: 0,
  };

  const mockTooltipData = {
    id: 'test-worker-1',
    name: 'Test Worker',
    hp: 80,
    maxHp: 100,
    fatigue: 25,
    status: 'Available',
    statTags: ['strength', 'agility'],
    riskLevel: 'low' as const,
    performanceScore: 75,
    recommendations: ['Keep up the good work'],
  };

  const mockBioConfig = {
    id: 'test-worker-1',
    displayName: 'Test Worker',
    shortBio: 'A reliable worker with good stats',
    personality: ['Hardworking', 'Reliable'],
    skills: ['Basic tasks', 'Heavy lifting'],
    preferences: ['Day shifts', 'Team work'],
    background: 'Joined the village recently',
    quotes: ['Work hard, rest well'],
  };

  const createLocalizationHandle = (
    overrides?: Partial<LocalizationHandle['workerTooltip']>,
  ): LocalizationHandle => ({
    locale: 'en',
    setLocale: vi.fn(),
    format: (template: string, params?: Record<string, string | number>) => {
      if (!params) return template;
      return Object.entries(params).reduce(
        (acc, [key, value]) => acc.replace(new RegExp(`{${key}}`, 'g'), String(value)),
        template,
      );
    },
    workerTooltip: {
      labels: {
        hp: 'HP',
        fatigue: 'Fatigue',
        performance: 'Performance',
        specialties: 'Specialties',
        bio: 'Bio',
        recommendations: 'Recommendations',
      },
      statuses: {
        available: 'Available',
      },
      riskLevels: {
        low: 'Low Risk',
        medium: 'Medium Risk',
        high: 'High Risk',
        critical: 'Critical Risk',
      },
      recommendations: {
        lowHp: 'Rest needed - HP critical',
        highFatigue: 'High fatigue - consider rest',
        injured: 'Recovering from injury',
        critical: 'Immediate rest required',
      },
      accessibility: {
        tooltipDetails: '{name} - Worker details',
        riskBadge: '{level} status',
        closeTooltip: 'Close tooltip for {name}',
      },
      actions: {
        close: 'Close tooltip',
      },
      sections: {
        quote: 'Quote',
      },
      ...overrides,
    },
  });

  const setupLocalizationMock = (
    overrides?: Partial<LocalizationHandle['workerTooltip']>,
  ) => {
    mockUseLocalization.mockReturnValue(createLocalizationHandle(overrides));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkerTooltipData.mockReturnValue(mockTooltipData);
    mockUseWorkerBioConfig.mockReturnValue(mockBioConfig);
    setupLocalizationMock();
    mockUseModifierVisualization.mockReturnValue({ entries: [], isLoading: false });
  });

  it('should render tooltip when visible', () => {
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('worker-tooltip')).toBeInTheDocument();
    expect(screen.getByText('Test Worker')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={false}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('worker-tooltip')).not.toBeInTheDocument();
  });

  it('should display worker stats correctly', () => {
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    // Check HP display
    expect(screen.getByText('80/100')).toBeInTheDocument();
    
    // Check fatigue display
    expect(screen.getByText('25%')).toBeInTheDocument();
    
    // Check performance score
    expect(screen.getByText('75/100')).toBeInTheDocument();
  });

  it('should show risk level with correct styling', () => {
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    const riskBadge = screen.getByText('Low Risk');
    expect(riskBadge).toBeInTheDocument();
    expect(riskBadge).toHaveClass('text-green-400');
  });

  it('should display stat tags when available', () => {
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('strength')).toBeInTheDocument();
    expect(screen.getByText('agility')).toBeInTheDocument();
  });

  it('should display bio information when available', () => {
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Bio')).toBeInTheDocument();
    expect(screen.getByText('A reliable worker with good stats')).toBeInTheDocument();
  });

  it('should display recommendations when available', () => {
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Keep up the good work')).toBeInTheDocument();
  });

  it('should display quote when available', () => {
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('"Work hard, rest well"')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close tooltip');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when escape key is pressed', async () => {
    const mockOnClose = vi.fn();
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={mockOnClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should adjust position to stay within viewport', () => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={700} // Near right edge
        y={500} // Near bottom edge
        onClose={vi.fn()}
      />
    );

    const tooltip = screen.getByTestId('worker-tooltip');
    expect(tooltip).toBeInTheDocument();
    
    // Position should be adjusted to stay in viewport
    const style = window.getComputedStyle(tooltip);
    expect(parseInt(style.left || '0')).toBeLessThan(700);
    expect(parseInt(style.top || '0')).toBeLessThan(500);
  });

  it('should have proper accessibility attributes', () => {
    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    const tooltip = screen.getByTestId('worker-tooltip');
    expect(tooltip).toHaveAttribute('role', 'tooltip');
    expect(tooltip).toHaveAttribute('aria-label', 'Test Worker - Worker details');
  });

  it('should handle missing bio config gracefully', () => {
    mockUseWorkerBioConfig.mockReturnValue(undefined);

    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    // Should still render other content
    expect(screen.getByTestId('worker-tooltip')).toBeInTheDocument();
    expect(screen.getByText('Test Worker')).toBeInTheDocument();
    
    // Bio section should not be present
    expect(screen.queryByText('Bio')).not.toBeInTheDocument();
    expect(screen.queryByText('A reliable worker with good stats')).not.toBeInTheDocument();
  });

  it('should handle different risk levels correctly', () => {
    const criticalRiskData = { ...mockTooltipData, riskLevel: 'critical' as const };
    mockUseWorkerTooltipData.mockReturnValue(criticalRiskData);

    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    const riskBadge = screen.getByText('Critical Risk');
    expect(riskBadge).toBeInTheDocument();
    expect(riskBadge).toHaveClass('text-red-400');
  });

  it('applies localized labels when provided', () => {
    setupLocalizationMock({
      labels: {
        specialties: 'Punti di forza',
      },
      riskLevels: {
        low: 'Rischio basso',
      },
    });

    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Punti di forza')).toBeInTheDocument();
    expect(screen.getByText('Rischio basso')).toBeInTheDocument();
  });

  it('renders modifier preview block when modifier data is available', () => {
    const modifiers: StatModifierEntry[] = [
      {
        id: 'mod_nightowl',
        label: 'Night Owl',
        statId: 'stat_core_focus',
        scope: 'RESIDENT',
        valueLabel: '+5',
        operation: 'ADD',
      },
    ];
    mockUseModifierVisualization.mockReturnValue({ entries: modifiers, isLoading: false });

    render(
      <WorkerTooltip
        resident={mockResident}
        isVisible={true}
        x={100}
        y={100}
        onClose={vi.fn()}
      />
    );

    const modifierDisplay = screen.getByTestId('worker-test-worker-1-modifier-display');
    expect(modifierDisplay).toBeInTheDocument();
    expect(mockUseModifierVisualization).toHaveBeenCalledWith(
      'workerPanel',
      expect.objectContaining({ entityId: mockResident.id }),
    );
  });
});
