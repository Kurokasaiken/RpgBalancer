import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import VillageSandbox from '@/ui/idleVillage/VillageSandbox';
import { createMockContext, type MockSandboxContext } from '@/ui/idleVillage/__tests__/testUtils/mockVillageSandboxContext';
import { useVillageSandbox, type UseVillageSandboxReturn } from '@/ui/idleVillage/hooks/useVillageSandbox';

// Mock useVillageSandbox to return our controlled context
vi.mock('@/ui/idleVillage/hooks/useVillageSandbox', () => ({
  useVillageSandbox: vi.fn(),
}));

const mockUseVillageSandbox = vi.mocked(useVillageSandbox);
const originalIntersectionObserver = globalThis.IntersectionObserver;
const originalResizeObserver = globalThis.ResizeObserver;

const setMockSandboxReturn = (context: MockSandboxContext) => {
  mockUseVillageSandbox.mockReturnValue(context as unknown as UseVillageSandboxReturn);
};

class IntersectionObserverMock {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

class ResizeObserverMock {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords(): ResizeObserverEntry[] {
    return [];
  }
}

describe('VillageSandbox.cycle', () => {
  let mockContext = createMockContext();

  beforeEach(() => {
    mockContext = createMockContext({
      isDayPhase: true,
      cycleProgressFraction: 0.5,
      cycleElapsedSeconds: 120,
      cycleDayCount: 1,
      cyclePhaseLabel: 'Fase giorno',
      cyclePhaseIcon: '☀️',
      secondsPerTimeUnit: 60,
      totalCycleSeconds: 600,
      isCyclePlaying: true,
      handleQuickWorkShift: vi.fn(),
      handleQuickRest: vi.fn(),
      isResting: false,
      headerResources: {
        gold: 120,
        food: 75,
        population: 38,
      },
    });
    setMockSandboxReturn(mockContext);
  });

  beforeAll(() => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: IntersectionObserverMock,
    });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: ResizeObserverMock,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: originalIntersectionObserver,
    });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: originalResizeObserver,
    });
  });

  const renderSandbox = () =>
    render(
      <DragProvider>
        <VillageSandbox />
      </DragProvider>,
    );

  describe('Cycle panel display', () => {
    it('renders day count, phase info, and progress', () => {
      renderSandbox();

      expect(screen.getByTestId('cycle-day-count')).toHaveTextContent('Giorno 2');
      expect(screen.getByText('☀️')).toBeInTheDocument();
      expect(screen.getByText('Fase giorno')).toBeInTheDocument();
      expect(screen.getByText('Velocità: 60s / TU')).toBeInTheDocument();
      expect(screen.getByTestId('cycle-progress-value')).toHaveTextContent('50% · 2:00');
      expect(screen.getByTestId('cycle-duration-value')).toHaveTextContent('10:00s');
    });

    it('shows pause/resume button state', () => {
      const view = renderSandbox();

      const toggleButton = screen.getByTestId('cycle-toggle-button');
      expect(toggleButton).toHaveTextContent('Pausa');

      mockContext.isCyclePlaying = false;
      setMockSandboxReturn(mockContext);
      view.rerender(
        <DragProvider>
          <VillageSandbox />
        </DragProvider>,
      );

      expect(screen.getByTestId('cycle-toggle-button')).toHaveTextContent('Riprendi');
    });

    it('displays average fatigue', () => {
      renderSandbox();

      expect(screen.getByTestId('avg-fatigue-value')).toHaveTextContent('8');
    });
  });

  describe('Quick action buttons', () => {
    it('renders Work Shift and Rest buttons', () => {
      renderSandbox();

      const workButton = screen.getByTestId('work-shift-button');
      const restButton = screen.getByTestId('rest-button');

      expect(workButton).toHaveTextContent('Work Shift');
      expect(restButton).toHaveTextContent('Rest');
    });

    it('calls handleQuickWorkShift when Work Shift clicked', async () => {
      renderSandbox();

      const workButton = screen.getByTestId('work-shift-button');
      fireEvent.click(workButton);

      await waitFor(() => {
        expect(mockContext.handleQuickWorkShift).toHaveBeenCalledTimes(1);
      });
    });

    it('calls handleQuickRest when Rest clicked', async () => {
      renderSandbox();

      const restButton = screen.getByTestId('rest-button');
      fireEvent.click(restButton);

      await waitFor(() => {
        expect(mockContext.handleQuickRest).toHaveBeenCalledTimes(1);
      });
    });

    it('shows Resume Work when resting', () => {
      mockContext.isResting = true;
      setMockSandboxReturn(mockContext);

      renderSandbox();

      const restButton = screen.getByTestId('rest-button');
      expect(restButton).toHaveTextContent('Resume Work');
    });
  });

  describe('Resource updates', () => {
    it('displays current resources in SummaryStrip', () => {
      renderSandbox();

      expect(screen.getByTestId('summary-gold-value')).toHaveTextContent('120');
      expect(screen.getByTestId('summary-food-value')).toHaveTextContent('75');
      expect(screen.getByTestId('summary-population-value')).toHaveTextContent('38');
    });

    it('updates resources after work shift', async () => {
      // Mock resource consumption (food decrease)
      mockContext.headerResources = { gold: 120, food: 70, population: 38 };
      mockUseVillageSandbox.mockReturnValue(mockContext as unknown as UseVillageSandboxReturn);

      const view = renderSandbox();

      await waitFor(() => {
        view.rerender(
          <DragProvider>
            <VillageSandbox />
          </DragProvider>,
        );
        expect(screen.getByTestId('summary-food-value')).toHaveTextContent('70');
      });
    });
  });

  describe('Clock synchronization', () => {
    it('toggles cycle playing when button clicked', async () => {
      renderSandbox();

      const toggleButton = screen.getByTestId('cycle-toggle-button');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(mockContext.toggleCyclePlaying).toHaveBeenCalledTimes(1);
      });
    });

    it('updates progress bar width based on cycleProgressFraction', () => {
      mockContext.cycleProgressFraction = 0.75;
      setMockSandboxReturn(mockContext);

      renderSandbox();

      const progressBar = screen.getByRole('progressbar'); // Assuming progress bar has role
      expect(progressBar).toHaveStyle({ width: '75%' });
    });
  });
});
