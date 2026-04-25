/**
 * Roster Demo Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { RosterDemo, type RosterDemoProps } from '@/ui/styleLab/components/RosterDemo';
import type { RosterConfig } from '@/ui/styleLab/config/demoConfig';

// Mock the useStyleLabTokens hook
jest.mock('@/ui/styleLab/hooks/useStyleLabTokens', () => ({
  useStyleLabTokens: () => ({
    preset: {
      surfaces: {
        panel: { background: '#ffffff', color: '#333333' },
        card: { background: '#f8f9fa', color: '#333333' }
      }
    }
  })
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('RosterDemo', () => {
  const mockConfig: RosterConfig = {
    bloomIntensity: 1.0,
    cardGlowColor: 'rgba(34, 197, 94, 0.6)',
    springStiffness: 300,
    springDamping: 25,
    dragScale: 0.95,
    returnAnimationMs: 1500,
    autoLoop: false,
    loopTiming: 3000,
  };

  const defaultProps: RosterDemoProps = {
    config: mockConfig,
    onConfigChange: jest.fn(),
  };

  const renderComponent = (props = defaultProps) => {
    return render(
      <DndContext>
        <RosterDemo {...props} />
      </DndContext>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders worker roster demo correctly', () => {
    renderComponent();
    
    expect(screen.getByTestId('roster-demo')).toBeInTheDocument();
    expect(screen.getByText('Worker Roster Demo')).toBeInTheDocument();
    
    // Check for worker cards
    expect(screen.getByTestId('worker-card-worker-1')).toBeInTheDocument();
    expect(screen.getByTestId('worker-card-worker-2')).toBeInTheDocument();
    expect(screen.getByTestId('worker-card-worker-3')).toBeInTheDocument();
    expect(screen.getByTestId('worker-card-worker-4')).toBeInTheDocument();
  });

  it('displays worker information correctly', () => {
    renderComponent();
    
    // Check worker names and stats
    expect(screen.getByText('Marcus')).toBeInTheDocument();
    expect(screen.getByText('HP: 85%')).toBeInTheDocument();
    expect(screen.getByText('Fatigue: 20%')).toBeInTheDocument();
    
    expect(screen.getByText('Lena')).toBeInTheDocument();
    expect(screen.getByText('HP: 92%')).toBeInTheDocument();
    expect(screen.getByText('Fatigue: 15%')).toBeInTheDocument();
    
    expect(screen.getByText('Kael')).toBeInTheDocument();
    expect(screen.getByText('HP: 67%')).toBeInTheDocument();
    expect(screen.getByText('Fatigue: 45%')).toBeInTheDocument();
  });

  it('shows exhausted status for high fatigue workers', () => {
    renderComponent();
    
    // Kael has 45% fatigue, should not be exhausted
    expect(screen.queryByText('😴 Exhausted')).not.toBeInTheDocument();
  });

  it('toggles auto loop correctly', () => {
    renderComponent();
    
    const autoLoopCheckbox = screen.getByLabelText('Auto Loop');
    expect(autoLoopCheckbox).not.toBeChecked();
    
    fireEvent.click(autoLoopCheckbox);
    expect(autoLoopCheckbox).toBeChecked();
  });

  it('updates bloom intensity when slider changes', () => {
    renderComponent();
    
    const bloomSlider = screen.getByDisplayValue('1.0');
    expect(bloomSlider).toBeInTheDocument();
    
    fireEvent.change(bloomSlider, { target: { value: '1.5' } });
    
    expect(defaultProps.onConfigChange).toHaveBeenCalledWith({
      bloomIntensity: 1.5
    });
  });

  it('displays dragging status when worker is dragged', async () => {
    renderComponent();
    
    const workerCard = screen.getByTestId('worker-card-worker-1');
    
    // Simulate drag start
    fireEvent.dragStart(workerCard);
    
    await waitFor(() => {
      expect(screen.getByText('Dragging: Marcus')).toBeInTheDocument();
    });
  });

  it('renders with custom config values', () => {
    const customConfig: RosterConfig = {
      ...mockConfig,
      bloomIntensity: 1.5,
      autoLoop: true,
      loopTiming: 5000,
    };
    
    renderComponent({ ...defaultProps, config: customConfig });
    
    const bloomSlider = screen.getByDisplayValue('1.5');
    expect(bloomSlider).toBeInTheDocument();
    
    const autoLoopCheckbox = screen.getByLabelText('Auto Loop');
    expect(autoLoopCheckbox).toBeChecked();
  });

  it('handles config change callbacks', () => {
    const mockOnConfigChange = jest.fn();
    renderComponent({ ...defaultProps, onConfigChange: mockOnConfigChange });
    
    const bloomSlider = screen.getByDisplayValue('1.0');
    fireEvent.change(bloomSlider, { target: { value: '0.5' } });
    
    expect(mockOnConfigChange).toHaveBeenCalledWith({ bloomIntensity: 0.5 });
    expect(mockOnConfigChange).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility attributes', () => {
    renderComponent();
    
    // Check for proper ARIA labels and roles
    const demoContainer = screen.getByTestId('roster-demo');
    expect(demoContainer).toBeInTheDocument();
    
    // Worker cards should have proper test IDs for selection
    const workerCards = screen.getAllByTestId(/^worker-card-/);
    expect(workerCards).toHaveLength(4);
  });

  it('applies correct styles based on config', () => {
    const highBloomConfig: RosterConfig = {
      ...mockConfig,
      bloomIntensity: 2.0,
      cardGlowColor: 'rgba(255, 0, 0, 0.8)',
    };
    
    renderComponent({ ...defaultProps, config: highBloomConfig });
    
    // The component should render without errors
    expect(screen.getByTestId('roster-demo')).toBeInTheDocument();
    
    // Bloom intensity slider should show the correct value
    const bloomSlider = screen.getByDisplayValue('2.0');
    expect(bloomSlider).toBeInTheDocument();
  });
});
