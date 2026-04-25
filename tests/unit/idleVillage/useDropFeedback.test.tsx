/**
 * RTL Tests for Drop Feedback Hook and UI Components
 * 
 * Comprehensive test suite for the drop feedback system including
 * hook functionality, UI components, and telemetry integration.
 * 
 * @since IV-PhaseE-drop-feedback
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useDropFeedback } from '@/ui/idleVillage/hooks/useDropFeedback';
import { useDropFeedbackTelemetry } from '@/ui/idleVillage/utils/dropFeedbackTelemetry';
import {
  DropFeedbackOverlay,
  DropFeedbackTooltip,
  DropFeedbackIndicator,
  DropFeedbackContainer,
} from '@/ui/idleVillage/components/DropFeedbackUI';
import { DEFAULT_DROP_FEEDBACK_CONFIG } from '@/ui/idleVillage/config/dropFeedbackConfig';

// Mock diagnostics
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock validation hook
vi.mock('@/ui/idleVillage/hooks/useResidentDropValidation', () => ({
  useResidentDropValidation: vi.fn(() => ({
    validateDrop: vi.fn((params) => ({
      isValid: params.resident.id === 'valid-resident',
      failedRule: params.resident.id === 'invalid-resident' ? 'fatigue_threshold' : undefined,
      message: params.resident.id === 'invalid-resident' ? 'Too exhausted' : undefined,
      meta: params.resident.id === 'invalid-resident' ? {
        fatigue: { current: 95, threshold: 90 },
      } : undefined,
    })),
    validateBatchDrop: vi.fn(),
    getErrorMessage: vi.fn(),
    isResidentEligible: vi.fn(),
    config: {},
  })),
}));

// Test wrapper component for hook testing
function TestComponent({ children }: { children: React.ReactNode }) {
  return <div data-testid="test-wrapper">{children}</div>;
}

// Mock resident data
const mockResident: ResidentState = {
  id: 'test-resident',
  name: 'Test Resident',
  status: 'available',
  fatigue: 50,
  stats: {
    strength: 10,
    agility: 8,
    intelligence: 12,
  },
};

const mockExhaustedResident: ResidentState = {
  ...mockResident,
  id: 'invalid-resident',
  fatigue: 95,
};

const mockActivity: ActivityDefinition = {
  id: 'test-activity',
  name: 'Test Activity',
  type: 'work',
  maxSlots: 2,
  statRequirement: {
    allOf: ['strength'],
  },
};

describe('useDropFeedback Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate drop and return valid feedback', () => {
    const TestHook = () => {
      const { validateDropWithFeedback } = useDropFeedback();
      const result = validateDropWithFeedback({
        resident: mockResident,
        activity: mockActivity,
        currentOccupants: 0,
      });
      
      return <div data-testid="result">{JSON.stringify(result)}</div>;
    };

    render(
      <TestComponent>
        <TestHook />
      </TestComponent>
    );

    const resultElement = screen.getByTestId('result');
    const result = JSON.parse(resultElement.textContent || '{}');
    
    expect(result.isValid).toBe(true);
    expect(result.feedbackType).toBe('valid');
    expect(result.visuals).toBeDefined();
    expect(result.message).toBeDefined();
  });

  it('should validate drop and return invalid feedback', () => {
    const TestHook = () => {
      const { validateDropWithFeedback } = useDropFeedback();
      const result = validateDropWithFeedback({
        resident: mockExhaustedResident,
        activity: mockActivity,
        currentOccupants: 0,
      });
      
      return <div data-testid="result">{JSON.stringify(result)}</div>;
    };

    render(
      <TestComponent>
        <TestHook />
      </TestComponent>
    );

    const resultElement = screen.getByTestId('result');
    const result = JSON.parse(resultElement.textContent || '{}');
    
    expect(result.isValid).toBe(false);
    expect(result.feedbackType).toBe('warning');
    expect(result.validationRule).toBe('fatigue_threshold');
    expect(result.message).toContain('exhausted');
  });

  it('should get visual feedback for different types', () => {
    const TestHook = () => {
      const { getVisualFeedback } = useDropFeedback();
      const validVisuals = getVisualFeedback('valid');
      const invalidVisuals = getVisualFeedback('invalid');
      
      return (
        <div>
          <div data-testid="valid-visuals">{JSON.stringify(validVisuals)}</div>
          <div data-testid="invalid-visuals">{JSON.stringify(invalidVisuals)}</div>
        </div>
      );
    };

    render(
      <TestComponent>
        <TestHook />
      </TestComponent>
    );

    const validElement = screen.getByTestId('valid-visuals');
    const validVisuals = JSON.parse(validElement.textContent || '{}');
    
    const invalidElement = screen.getByTestId('invalid-visuals');
    const invalidVisuals = JSON.parse(invalidElement.textContent || '{}');
    
    expect(validVisuals.borderColor).toBe('rgb(34, 197, 94)');
    expect(invalidVisuals.borderColor).toBe('rgb(239, 68, 68)');
  });

  it('should show and clear slot feedback', async () => {
    const TestHook = () => {
      const { showSlotFeedback, clearSlotFeedback, slotFeedbackState } = useDropFeedback();
      
      const handleShowFeedback = () => {
        showSlotFeedback({
          slotId: 'test-slot',
          feedbackType: 'invalid',
          message: 'Test message',
          validationRule: 'test_rule',
        });
      };
      
      const handleClearFeedback = () => {
        clearSlotFeedback('test-slot');
      };
      
      return (
        <div>
          <button data-testid="show-feedback" onClick={handleShowFeedback}>
            Show Feedback
          </button>
          <button data-testid="clear-feedback" onClick={handleClearFeedback}>
            Clear Feedback
          </button>
          <div data-testid="feedback-state">
            {JSON.stringify(slotFeedbackState)}
          </div>
        </div>
      );
    };

    render(
      <TestComponent>
        <TestHook />
      </TestComponent>
    );

    // Initially no feedback
    const stateElement = screen.getByTestId('feedback-state');
    expect(JSON.parse(stateElement.textContent || '{}')).toEqual({});

    // Show feedback
    fireEvent.click(screen.getByTestId('show-feedback'));
    
    await waitFor(() => {
      const state = JSON.parse(stateElement.textContent || '{}');
      expect(state['test-slot']).toBeDefined();
      expect(state['test-slot'].feedbackType).toBe('invalid');
      expect(state['test-slot'].message).toBe('Test message');
    });

    // Clear feedback
    fireEvent.click(screen.getByTestId('clear-feedback'));
    
    await waitFor(() => {
      const state = JSON.parse(stateElement.textContent || '{}');
      expect(state['test-slot'].visible).toBe(false);
    });
  });

  it('should use test configuration in test mode', () => {
    const TestHook = () => {
      const { config } = useDropFeedback({ testMode: true });
      
      return <div data-testid="config">{JSON.stringify(config)}</div>;
    };

    render(
      <TestComponent>
        <TestHook />
      </TestComponent>
    );

    const configElement = screen.getByTestId('config');
    const config = JSON.parse(configElement.textContent || '{}');
    
    expect(config.animation.durationMs).toBe(0);
    expect(config.animation.enableHoverAnimations).toBe(false);
  });
});

describe('DropFeedbackUI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render DropFeedbackOverlay with correct styles', () => {
    const visuals = DEFAULT_DROP_FEEDBACK_CONFIG.visual.valid;
    
    render(
      <TestComponent>
        <DropFeedbackOverlay
          visuals={visuals}
          visible={true}
          testId="feedback-overlay"
        >
          <div data-testid="overlay-content">Content</div>
        </DropFeedbackOverlay>
      </TestComponent>
    );

    const overlay = screen.getByTestId('feedback-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveStyle({
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
    });
    
    const content = screen.getByTestId('overlay-content');
    expect(content).toBeInTheDocument();
  });

  it('should not render DropFeedbackOverlay when not visible', () => {
    const visuals = DEFAULT_DROP_FEEDBACK_CONFIG.visual.valid;
    
    render(
      <TestComponent>
        <DropFeedbackOverlay
          visuals={visuals}
          visible={false}
          testId="feedback-overlay"
        >
          <div data-testid="overlay-content">Content</div>
        </DropFeedbackOverlay>
      </TestComponent>
    );

    expect(screen.queryByTestId('feedback-overlay')).not.toBeInTheDocument();
    expect(screen.getByTestId('overlay-content')).toBeInTheDocument();
  });

  it('should render DropFeedbackTooltip with correct styling', () => {
    render(
      <TestComponent>
        <DropFeedbackTooltip
          message="Test message"
          feedbackType="invalid"
          visible={true}
          testId="feedback-tooltip"
        />
      </TestComponent>
    );

    const tooltip = screen.getByTestId('feedback-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('✗ Test message');
    expect(tooltip).toHaveClass('bg-red-600');
  });

  it('should render DropFeedbackIndicator with correct styling', () => {
    render(
      <TestComponent>
        <DropFeedbackIndicator
          feedbackType="valid"
          pulsing={true}
          size="lg"
          testId="feedback-indicator"
        />
      </TestComponent>
    );

    const indicator = screen.getByTestId('feedback-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('bg-green-500', 'w-4', 'h-4', 'animate-pulse');
  });

  it('should render DropFeedbackContainer with all elements', () => {
    const visuals = DEFAULT_DROP_FEEDBACK_CONFIG.visual.invalid;
    
    render(
      <TestComponent>
        <DropFeedbackContainer
          isDragActive={true}
          feedbackType="invalid"
          message="Cannot drop here"
          showTooltip={true}
          showIndicator={true}
          visuals={visuals}
          testId="feedback-container"
        >
          <div data-testid="container-content">Drop Target</div>
        </DropFeedbackContainer>
      </TestComponent>
    );

    const container = screen.getByTestId('feedback-container');
    expect(container).toBeInTheDocument();
    
    const content = screen.getByTestId('container-content');
    expect(content).toBeInTheDocument();
    
    const overlay = screen.getByTestId('feedback-container-overlay');
    expect(overlay).toBeInTheDocument();
    
    const tooltip = screen.getByTestId('feedback-container-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('✗ Cannot drop here');
    
    const indicator = screen.getByTestId('feedback-container-indicator');
    expect(indicator).toBeInTheDocument();
  });

  it('should not show feedback elements when drag is not active', () => {
    const visuals = DEFAULT_DROP_FEEDBACK_CONFIG.visual.invalid;
    
    render(
      <TestComponent>
        <DropFeedbackContainer
          isDragActive={false}
          feedbackType="invalid"
          message="Cannot drop here"
          showTooltip={true}
          showIndicator={true}
          visuals={visuals}
          testId="feedback-container"
        >
          <div data-testid="container-content">Drop Target</div>
        </DropFeedbackContainer>
      </TestComponent>
    );

    const container = screen.getByTestId('feedback-container');
    expect(container).toBeInTheDocument();
    
    expect(screen.queryByTestId('feedback-container-overlay')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feedback-container-tooltip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feedback-container-indicator')).toBeInTheDocument();
  });
});

describe('Drop Feedback Telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should emit feedback shown telemetry', () => {
    const mockDiagnostics = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    
    vi.doMock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
      createSandboxDiagnostics: vi.fn(() => mockDiagnostics),
    }));

    const TestHook = () => {
      const { emitFeedbackShown } = useDropFeedbackTelemetry();
      
      const handleEmit = () => {
        emitFeedbackShown({
          feedbackType: 'invalid',
          validationRule: 'fatigue_threshold',
          residentId: 'test-resident',
          activityId: 'test-activity',
          context: 'test-context',
          interactive: true,
          metadata: {
            message: 'Too exhausted',
          },
        });
      };
      
      return (
        <button data-testid="emit-telemetry" onClick={handleEmit}>
          Emit Telemetry
        </button>
      );
    };

    render(
      <TestComponent>
        <TestHook />
      </TestComponent>
    );

    fireEvent.click(screen.getByTestId('emit-telemetry'));
    
    expect(mockDiagnostics.info).toHaveBeenCalledWith('drop_feedback_shown', expect.objectContaining({
      feedbackType: 'invalid',
      validationRule: 'fatigue_threshold',
      residentId: 'test-resident',
      activityId: 'test-activity',
      context: 'test-context',
      interactive: true,
      timestamp: expect.any(Number),
      metadata: {
        message: 'Too exhausted',
      },
    }));
  });

  it('should emit feedback clicked telemetry', () => {
    const mockDiagnostics = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    
    vi.doMock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
      createSandboxDiagnostics: vi.fn(() => mockDiagnostics),
    }));

    const TestHook = () => {
      const { emitFeedbackClicked } = useDropFeedbackTelemetry();
      
      const handleClick = () => {
        emitFeedbackClicked('invalid', 'test-context', { source: 'tooltip' });
      };
      
      return (
        <button data-testid="click-feedback" onClick={handleClick}>
          Click Feedback
        </button>
      );
    };

    render(
      <TestComponent>
        <TestHook />
      </TestComponent>
    );

    fireEvent.click(screen.getByTestId('click-feedback'));
    
    expect(mockDiagnostics.info).toHaveBeenCalledWith('drop_feedback_clicked', expect.objectContaining({
      feedbackType: 'invalid',
      context: 'test-context',
      metadata: { source: 'tooltip' },
      timestamp: expect.any(Number),
    }));
  });

  it('should emit feedback dismissed telemetry', () => {
    const mockDiagnostics = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    
    vi.doMock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
      createSandboxDiagnostics: vi.fn(() => mockDiagnostics),
    }));

    const TestHook = () => {
      const { emitFeedbackDismissed } = useDropFeedbackTelemetry();
      
      const handleDismiss = () => {
        emitFeedbackDismissed('warning', 'test-context', 2000);
      };
      
      return (
        <button data-testid="dismiss-feedback" onClick={handleDismiss}>
          Dismiss Feedback
        </button>
      );
    };

    render(
      <TestComponent>
        <TestHook />
      </TestComponent>
    );

    fireEvent.click(screen.getByTestId('dismiss-feedback'));
    
    expect(mockDiagnostics.info).toHaveBeenCalledWith('drop_feedback_dismissed', expect.objectContaining({
      feedbackType: 'warning',
      context: 'test-context',
      duration: 2000,
      timestamp: expect.any(Number),
    }));
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should integrate hook with UI components', async () => {
    const TestIntegration = () => {
      const { validateDropWithFeedback, slotFeedbackState } = useDropFeedback();
      const [result, setResult] = React.useState<any>(null);
      
      const handleValidate = () => {
        const validation = validateDropWithFeedback({
          resident: mockExhaustedResident,
          activity: mockActivity,
          currentOccupants: 1,
        });
        setResult(validation);
      };
      
      return (
        <div>
          <button data-testid="validate-drop" onClick={handleValidate}>
            Validate Drop
          </button>
          {result && (
            <DropFeedbackContainer
              isDragActive={true}
              feedbackType={result.feedbackType}
              message={result.message}
              visuals={result.visuals}
              testId="integrated-feedback"
            >
              <div data-testid="drop-target">Drop Target</div>
            </DropFeedbackContainer>
          )}
          <div data-testid="slot-state">{JSON.stringify(slotFeedbackState)}</div>
        </div>
      );
    };

    render(
      <TestComponent>
        <TestIntegration />
      </TestComponent>
    );

    // Initially no feedback
    expect(screen.queryByTestId('integrated-feedback')).not.toBeInTheDocument();

    // Validate drop
    fireEvent.click(screen.getByTestId('validate-drop'));
    
    await waitFor(() => {
      const feedback = screen.getByTestId('integrated-feedback');
      expect(feedback).toBeInTheDocument();
      
      const tooltip = screen.getByTestId('integrated-feedback-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent(/exhausted/);
      
      const overlay = screen.getByTestId('integrated-feedback-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  it('should handle accessibility features', () => {
    const visuals = DEFAULT_DROP_FEEDBACK_CONFIG.visual.invalid;
    
    render(
      <TestComponent>
        <DropFeedbackOverlay
          visuals={visuals}
          visible={true}
          testId="accessible-overlay"
        />
      </TestComponent>
    );

    const overlay = screen.getByTestId('accessible-overlay');
    expect(overlay).toHaveAttribute('role', 'presentation');
    expect(overlay).toHaveAttribute('aria-label', 'Drop feedback indicator');
  });
});
