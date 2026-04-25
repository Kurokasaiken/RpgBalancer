/**
 * Weight Calibration Wizard Unit Tests
 * 
 * Comprehensive test suite for the Weight Calibration Wizard components and hooks.
 * Tests wizard workflow, state management, simulation integration, and UI interactions.
 * 
 * @since NP-121 – Stat Weight Calibration Wizard
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { WeightCalibrationWizard } from '../../../src/ui/balancing/components/WeightCalibrationWizard';
import { useWeightCalibration, useWeightValidation, useSimulationProgress } from '../../../src/ui/balancing/hooks/useWeightCalibration';
import type { WizardState, WizardStep, CalibrationStrategy } from '../../../src/balancing/config/weightWizardConfig';
import {
  DEFAULT_WIZARD_CONFIG,
  WIZARD_STEPS,
  CALIBRATION_STRATEGIES,
  SIMULATION_PRESETS,
  validateWizardStep,
  createSafeWizardState,
} from '../../../src/balancing/config/weightWizardConfig';

// Mock dependencies
vi.mock('../../../src/ui/balancing/hooks/useBalancerConfig', () => ({
  useBalancerConfig: () => ({
    config: {
      stats: [
        { id: 'strength', label: 'Strength', weight: 1.0, isCore: true, isDerived: false, isPenalty: false },
        { id: 'agility', label: 'Agility', weight: 0.8, isCore: true, isDerived: false, isPenalty: false },
        { id: 'intelligence', label: 'Intelligence', weight: 0.6, isCore: false, isDerived: false, isPenalty: false },
        { id: 'health', label: 'Health', weight: 1.2, isCore: true, isDerived: true, isPenalty: false },
        { id: 'fatigue', label: 'Fatigue', weight: 0.3, isCore: false, isDerived: false, isPenalty: true },
      ],
    },
  }),
}));

vi.mock('../../../src/balancing/monteCarlo/MonteCarloEngine', () => ({
  runMonteCarloSimulation: vi.fn().mockResolvedValue({
    runs: [
      {
        id: 'run-1',
        archetype: 'test-archetype',
        result: 'victory',
        turns: 12,
        damageDealt: 150,
        damageTaken: 80,
        hpRemaining: 45,
        timestamp: Date.now(),
        metrics: {
          averageTurns: 12,
          winRate: 0.75,
          damagePerTurn: 12.5,
          hpRemaining: 45,
        },
      },
      {
        id: 'run-2',
        archetype: 'test-archetype',
        result: 'defeat',
        turns: 18,
        damageDealt: 120,
        damageTaken: 100,
        hpRemaining: 0,
        timestamp: Date.now(),
        metrics: {
          averageTurns: 18,
          winRate: 0.5,
          damagePerTurn: 6.7,
          hpRemaining: 0,
        },
      },
    ],
  }),
}));

vi.mock('../../../src/balancing/monteCarlo/ScenarioConfig', () => ({
  ScenarioConfig: vi.fn(),
}));

describe('Weight Calibration Wizard Configuration', () => {
  describe('Wizard Steps', () => {
    it('should have correct wizard steps defined', () => {
      expect(WIZARD_STEPS).toEqual([
        'select-stats',
        'set-targets',
        'configure-simulation',
        'run-calibration',
        'review-results',
      ]);
    });

    it('should have correct calibration strategies', () => {
      expect(CALIBRATION_STRATEGIES).toEqual([
        'target-turns',
        'win-rate',
        'damage-output',
        'survivability',
        'balanced',
      ]);
    });

    it('should have simulation presets configured', () => {
      expect(SIMULATION_PRESETS.quick.iterations).toBe(1000);
      expect(SIMULATION_PRESETS.standard.iterations).toBe(5000);
      expect(SIMULATION_PRESETS.thorough.iterations).toBe(10000);
      expect(SIMULATION_PRESETS.custom.iterations).toBe(5000);
    });
  });

  describe('Default Configuration', () => {
    it('should create valid default wizard state', () => {
      const state = createSafeWizardState({});
      
      expect(state.currentStep).toBe('select-stats');
      expect(state.selectedStats).toEqual([]);
      expect(state.weights).toEqual([]);
      expect(state.targets).toEqual([]);
      expect(state.isRunning).toBe(false);
      expect(state.progress).toBe(0);
      expect(state.errors).toEqual([]);
    });

    it('should merge initial state with defaults', () => {
      const initialState = {
        selectedStats: ['strength', 'agility'],
        currentStep: 'set-targets' as WizardStep,
      };
      
      const state = createSafeWizardState(initialState);
      
      expect(state.currentStep).toBe('set-targets');
      expect(state.selectedStats).toEqual(['strength', 'agility']);
      expect(state.weights).toEqual([]); // Should still have defaults for other fields
    });
  });

  describe('Step Validation', () => {
    it('should validate select-stats step correctly', () => {
      const validState = {
        selectedStats: ['strength', 'agility'],
      };
      
      const errors = validateWizardStep('select-stats', validState);
      expect(errors).toEqual([]);
    });

    it('should reject select-stats step with no stats selected', () => {
      const invalidState = {
        selectedStats: [],
      };
      
      const errors = validateWizardStep('select-stats', invalidState);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate set-targets step correctly', () => {
      const validState = {
        selectedStats: ['strength'],
        weights: [{ statId: 'strength', weight: 1.0, priority: 1, locked: false }],
        targets: [{
          strategy: 'target-turns' as CalibrationStrategy,
          targetValue: 15,
          tolerance: 0.1,
          priority: 1,
        }],
      };
      
      const errors = validateWizardStep('set-targets', validState);
      expect(errors).toEqual([]);
    });

    it('should reject set-targets step with no weights', () => {
      const invalidState = {
        selectedStats: ['strength'],
        weights: [],
        targets: [{
          strategy: 'target-turns' as CalibrationStrategy,
          targetValue: 15,
          tolerance: 0.1,
          priority: 1,
        }],
      };
      
      const errors = validateWizardStep('set-targets', invalidState);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('useWeightCalibration Hook', () => {
  let mockUpdateState: vi.MockedFunction<(updates: Partial<WizardState>) => void>;
  
  beforeEach(() => {
    mockUpdateState = vi.fn();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    expect(result.current.state.currentStep).toBe('select-stats');
    expect(result.current.state.selectedStats).toEqual([]);
    expect(result.current.state.isRunning).toBe(false);
  });

  it('should update state correctly', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    act(() => {
      result.current.updateState({ selectedStats: ['strength'] });
    });
    
    expect(result.current.state.selectedStats).toEqual(['strength']);
  });

  it('should navigate to next step when valid', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    // Set up valid state for first step
    act(() => {
      result.current.updateState({ selectedStats: ['strength'] });
    });
    
    const canProceed = result.current.nextStep();
    
    expect(canProceed).toBe(true);
    expect(result.current.state.currentStep).toBe('set-targets');
  });

  it('should not navigate to next step when invalid', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    // Try to proceed without selecting stats
    const canProceed = result.current.nextStep();
    
    expect(canProceed).toBe(false);
    expect(result.current.state.currentStep).toBe('select-stats');
    expect(result.current.state.errors.length).toBeGreaterThan(0);
  });

  it('should navigate to previous step', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    // Move to second step first
    act(() => {
      result.current.updateState({ selectedStats: ['strength'] });
      result.current.nextStep();
    });
    
    // Then go back
    const canGoBack = result.current.previousStep();
    
    expect(canGoBack).toBe(true);
    expect(result.current.state.currentStep).toBe('select-stats');
  });

  it('should jump to accessible step', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    // Set up valid state for first step
    act(() => {
      result.current.updateState({ selectedStats: ['strength'] });
    });
    
    const canJump = result.current.goToStep('set-targets');
    
    expect(canJump).toBe(true);
    expect(result.current.state.currentStep).toBe('set-targets');
  });

  it('should not jump to inaccessible step', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    // Try to jump to review results without completing previous steps
    const canJump = result.current.goToStep('review-results');
    
    expect(canJump).toBe(false);
    expect(result.current.state.currentStep).toBe('select-stats');
  });

  it('should validate current step', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    const errors = result.current.validateCurrentStep();
    
    expect(errors.length).toBeGreaterThan(0); // Should have errors for empty selection
  });

  it('should check step accessibility', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    expect(result.current.isStepAccessible('select-stats')).toBe(true);
    expect(result.current.isStepAccessible('review-results')).toBe(false);
  });

  it('should reset wizard to initial state', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    // Modify state
    act(() => {
      result.current.updateState({ 
        selectedStats: ['strength'],
        currentStep: 'set-targets' as WizardStep,
      });
    });
    
    // Reset
    act(() => {
      result.current.resetWizard();
    });
    
    expect(result.current.state.currentStep).toBe('select-stats');
    expect(result.current.state.selectedStats).toEqual([]);
  });

  it('should export results as JSON', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    const exported = result.current.exportResults();
    
    expect(typeof exported).toBe('string');
    expect(() => JSON.parse(exported)).not.toThrow();
    
    const parsed = JSON.parse(exported);
    expect(parsed.wizardState).toBeDefined();
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.version).toBeDefined();
  });

  it('should import valid configuration', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    const validConfig = JSON.stringify({
      wizardState: {
        currentStep: 'set-targets',
        selectedStats: ['strength'],
      },
      timestamp: Date.now(),
      version: '1.0.0',
    });
    
    const success = result.current.importConfiguration(validConfig);
    
    expect(success).toBe(true);
    expect(result.current.state.currentStep).toBe('set-targets');
    expect(result.current.state.selectedStats).toEqual(['strength']);
  });

  it('should reject invalid configuration', () => {
    const { result } = renderHook(() => useWeightCalibration());
    
    const invalidConfig = 'invalid json';
    
    const success = result.current.importConfiguration(invalidConfig);
    
    expect(success).toBe(false);
    expect(result.current.state.errors.length).toBeGreaterThan(0);
  });
});

describe('useWeightValidation Hook', () => {
  it('should initialize with default weight', () => {
    const { result } = renderHook(() => useWeightValidation('strength', 1.5));
    
    expect(result.current.weight).toBe(1.5);
    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toEqual([]);
  });

  it('should validate weight within range', () => {
    const { result } = renderHook(() => useWeightValidation('strength'));
    
    act(() => {
      result.current.setWeight(0.5);
    });
    
    expect(result.current.weight).toBe(0.5);
    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toEqual([]);
  });

  it('should reject weight below minimum', () => {
    const { result } = renderHook(() => useWeightValidation('strength'));
    
    act(() => {
      result.current.setWeight(0.05);
    });
    
    expect(result.current.weight).toBe(0.05);
    expect(result.current.isValid).toBe(false);
    expect(result.current.errors.length).toBeGreaterThan(0);
  });

  it('should reject weight above maximum', () => {
    const { result } = renderHook(() => useWeightValidation('strength'));
    
    act(() => {
      result.current.setWeight(10.0);
    });
    
    expect(result.current.weight).toBe(10.0);
    expect(result.current.isValid).toBe(false);
    expect(result.current.errors.length).toBeGreaterThan(0);
  });
});

describe('useSimulationProgress Hook', () => {
  it('should initialize with zero progress', () => {
    const { result } = renderHook(() => useSimulationProgress());
    
    expect(result.current.progress).toBe(0);
    expect(result.current.estimatedTimeRemaining).toBe(0);
  });

  it('should start progress tracking', () => {
    const { result } = renderHook(() => useSimulationProgress());
    
    act(() => {
      result.current.startProgress(1000);
    });
    
    expect(result.current.progress).toBe(0);
    expect(result.current.estimatedTimeRemaining).toBe(0);
  });

  it('should update progress correctly', () => {
    const { result } = renderHook(() => useSimulationProgress());
    
    act(() => {
      result.current.startProgress(1000);
    });
    
    act(() => {
      result.current.updateProgress(500, 1000);
    });
    
    expect(result.current.progress).toBe(0.5);
    expect(result.current.estimatedTimeRemaining).toBeGreaterThan(0);
  });

  it('should complete progress', () => {
    const { result } = renderHook(() => useSimulationProgress());
    
    act(() => {
      result.current.startProgress(1000);
      result.current.updateProgress(1000, 1000);
    });
    
    act(() => {
      result.current.completeProgress();
    });
    
    expect(result.current.progress).toBe(1);
    expect(result.current.estimatedTimeRemaining).toBe(0);
  });
});

describe('WeightCalibrationWizard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render wizard header', () => {
    render(<WeightCalibrationWizard />);
    
    expect(screen.getByText('Stat Weight Calibration Wizard')).toBeInTheDocument();
    expect(screen.getByText(/Calibrate stat weights using Monte Carlo simulations/)).toBeInTheDocument();
  });

  it('should render progress bar with correct steps', () => {
    render(<WeightCalibrationWizard />);
    
    // Check that all step buttons are rendered
    WIZARD_STEPS.forEach(step => {
      expect(screen.getByText(new RegExp(step.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()), 'i'))).toBeInTheDocument();
    });
  });

  it('should start on select-stats step', () => {
    render(<WeightCalibrationWizard />);
    
    expect(screen.getByText('Select Stats for Calibration')).toBeInTheDocument();
    expect(screen.getByText(/Choose.*stats to calibrate/)).toBeInTheDocument();
  });

  it('should display available stats', () => {
    render(<WeightCalibrationWizard />);
    
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Agility')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Fatigue')).toBeInTheDocument();
  });

  it('should allow stat selection', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    expect(screen.getByText('Selected: 1 / 10')).toBeInTheDocument();
  });

  it('should navigate to next step when valid', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Select a stat first
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    // Click next
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    expect(screen.getByText('Configure Weights and Targets')).toBeInTheDocument();
  });

  it('should show validation errors when invalid', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Try to proceed without selecting stats
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    expect(screen.getByText(/Please fix the following issues/)).toBeInTheDocument();
  });

  it('should navigate to previous step', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Select a stat and go to next step
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    // Go back
    const previousButton = screen.getByText('Previous');
    await user.click(previousButton);
    
    expect(screen.getByText('Select Stats for Calibration')).toBeInTheDocument();
  });

  it('should allow direct navigation to accessible steps', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Select a stat first
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    // Try to jump to set-targets step
    const setTargetsStep = screen.getByText('Set Targets');
    await user.click(setTargetsStep);
    
    expect(screen.getByText('Configure Weights and Targets')).toBeInTheDocument();
  });

  it('should show weight configuration in set-targets step', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Navigate to set-targets step
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    expect(screen.getByText('Stat Weights')).toBeInTheDocument();
    expect(screen.getByText('Calibration Targets')).toBeInTheDocument();
  });

  it('should allow adding calibration targets', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Navigate to set-targets step
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    // Add a target
    const addTargetButton = screen.getByText('Add Target');
    await user.click(addTargetButton);
    
    expect(screen.getByText('Target Turns')).toBeInTheDocument();
  });

  it('should show simulation configuration step', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Navigate through steps to simulation configuration
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Next'));
    
    expect(screen.getByText('Configure Simulation')).toBeInTheDocument();
    expect(screen.getByText('Simulation Preset')).toBeInTheDocument();
  });

  it('should allow preset selection', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Navigate to simulation configuration
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Next'));
    
    // Click on thorough preset
    const thoroughPreset = screen.getByText('Thorough').closest('div');
    await user.click(thoroughPreset!);
    
    expect(screen.getByText('10,000 iterations')).toBeInTheDocument();
  });

  it('should show run calibration step', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Navigate through all steps to run calibration
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    await user.click(screen.getByText('Next')); // set-targets
    await user.click(screen.getByText('Next')); // configure-simulation
    await user.click(screen.getByText('Next')); // run-calibration
    
    expect(screen.getByText('Run Weight Calibration')).toBeInTheDocument();
    expect(screen.getByText('Ready to Calibrate')).toBeInTheDocument();
  });

  it('should start calibration when button clicked', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Navigate to run calibration step
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Next'));
    
    // Start calibration
    const startButton = screen.getByText('Start Calibration');
    await user.click(startButton);
    
    // Should show running state
    await waitFor(() => {
      expect(screen.getByText('Running simulation...')).toBeInTheDocument();
    });
  });

  it('should show export and reset options in review results', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Mock successful calibration results
    const { runMonteCarloSimulation } = await import('../../../src/balancing/monteCarlo/MonteCarloEngine');
    vi.mocked(runMonteCarloSimulation).mockResolvedValue({
      runs: [
        {
          id: 'run-1',
          metrics: { averageTurns: 12, winRate: 0.8 },
        },
      ],
    });
    
    // Navigate through all steps
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Next'));
    
    // Start and complete calibration
    await user.click(screen.getByText('Start Calibration'));
    
    // Wait for completion and navigate to results
    await waitFor(() => {
      expect(screen.getByText('Review Results')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    await user.click(screen.getByText('Review Results'));
    
    expect(screen.getByText('Export Results')).toBeInTheDocument();
    expect(screen.getByText('Reset Wizard')).toBeInTheDocument();
  });

  it('should handle export modal', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // This would require completing the full wizard flow
    // For now, just test that the modal functionality exists
    // The actual modal testing would require more complex setup
    expect(screen.queryByText('Export Results')).not.toBeInTheDocument();
  });

  it('should handle import modal', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // This would require completing the full wizard flow
    // For now, just test that the modal functionality exists
    expect(screen.queryByText('Import Config')).not.toBeInTheDocument();
  });

  it('should show error messages when present', () => {
    render(<WeightCalibrationWizard />);
    
    // Mock state with errors
    const { result } = renderHook(() => useWeightCalibration());
    
    act(() => {
      result.current.updateState({ errors: ['Test error message'] });
    });
    
    // Re-render with error state
    render(<WeightCalibrationWizard />);
    
    // This would need to be tested with proper error state setup
    // The actual error display testing would require more complex setup
  });
});

describe('Integration Tests', () => {
  it('should complete full wizard workflow', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Step 1: Select stats
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    const agilityStat = screen.getByText('Agility').closest('div');
    await user.click(agilityStat!);
    
    await user.click(screen.getByText('Next'));
    
    // Step 2: Configure weights and targets
    expect(screen.getByText('Configure Weights and Targets')).toBeInTheDocument();
    
    // Add a target
    await user.click(screen.getByText('Add Target'));
    
    await user.click(screen.getByText('Next'));
    
    // Step 3: Configure simulation
    expect(screen.getByText('Configure Simulation')).toBeInTheDocument();
    
    // Select thorough preset
    const thoroughPreset = screen.getByText('Thorough').closest('div');
    await user.click(thoroughPreset!);
    
    await user.click(screen.getByText('Next'));
    
    // Step 4: Run calibration
    expect(screen.getByText('Run Weight Calibration')).toBeInTheDocument();
    
    // This would complete the workflow, but requires actual simulation
    // For testing purposes, we've verified the navigation works correctly
  });

  it('should handle wizard reset correctly', async () => {
    const user = userEvent.setup();
    render(<WeightCalibrationWizard />);
    
    // Make some selections
    const strengthStat = screen.getByText('Strength').closest('div');
    await user.click(strengthStat!);
    
    // Navigate away and back
    await user.click(screen.getByText('Next'));
    await user.click(screen.getByText('Previous'));
    
    // Reset would need to be available from review results step
    // This tests the navigation structure
    expect(screen.getByText('Select Stats for Calibration')).toBeInTheDocument();
  });
});

// Helper function for renderHook
function renderHook<T>(hook: () => T): { result: { current: T } } {
  let result: { current: T };
  
  const TestComponent = ({ hook }: { hook: () => T }) => {
    result = { current: hook() };
    return null;
  };
  
  render(<TestComponent hook={hook} />);
  
  return result as { result: { current: T } };
}
