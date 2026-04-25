/**
 * Advanced Components Test Suite
 * 
 * Tests for Slider, Toggle, Progress Ring, Text Field, Toast, and Hover Card components
 * using Style Lab tokens and config-driven parameters.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SliderDemo } from '../components/SliderDemo';
import { ToggleDemo } from '../components/ToggleDemo';
import { ProgressRingDemo } from '../components/ProgressRingDemo';
import { TextFieldDemo } from '../components/TextFieldDemo';
import { ToastDemo } from '../components/ToastDemo';
import { HoverCardDemo } from '../components/HoverCardDemo';
import { defaultDemoConfig } from '../config/demoConfig';

// Mock useStyleLabTokens hook
vi.mock('../hooks/useStyleLabTokens', () => ({
  useStyleLabTokens: () => ({
    preset: {
      surfaces: {
        panel: {
          background: 'rgb(30, 41, 59)',
          color: 'rgb(241, 245, 249)',
          borderColor: 'rgb(71, 85, 105)',
        },
        card: {
          background: 'rgb(51, 65, 85)',
          color: 'rgb(241, 245, 249)',
          borderColor: 'rgb(71, 85, 105)',
        },
      },
      modifierStatus: {
        active: {
          background: 'rgb(59, 130, 246)',
          border: 'rgb(147, 197, 253)',
          foreground: 'rgb(255, 255, 255)',
        },
        hover: {
          background: 'rgb(99, 102, 241)',
          border: 'rgb(165, 180, 252)',
          foreground: 'rgb(255, 255, 255)',
        },
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: '400',
        lineHeight: '1.5',
      },
    },
    modifierScopes: {
      GLOBAL: {
        background: 'rgb(59, 130, 246)',
        border: 'rgb(147, 197, 253)',
        foreground: 'rgb(255, 255, 255)',
      },
    },
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('SliderDemo', () => {
  const mockConfig = defaultDemoConfig.slider;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders slider with initial value', () => {
    render(<SliderDemo config={mockConfig} isActive={true} />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue(String(mockConfig.currentValue));
  });

  it('displays current value when showValue is true', () => {
    render(<SliderDemo config={{ ...mockConfig, showValue: true }} isActive={true} />);
    
    expect(screen.getByText(`${mockConfig.currentValue}`)).toBeInTheDocument();
  });

  it('hides value when showValue is false', () => {
    render(<SliderDemo config={{ ...mockConfig, showValue: false }} isActive={true} />);
    
    expect(screen.queryByText(`${mockConfig.currentValue}`)).not.toBeInTheDocument();
  });

  it('handles manual value changes', async () => {
    render(<SliderDemo config={mockConfig} isActive={true} />);
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });
    
    expect(slider).toHaveValue('75');
  });

  it('respects min and max boundaries', () => {
    render(<SliderDemo config={mockConfig} isActive={true} />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', String(mockConfig.minValue));
    expect(slider).toHaveAttribute('max', String(mockConfig.maxValue));
  });
});

describe('ToggleDemo', () => {
  const mockConfig = defaultDemoConfig.toggle;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toggle switch', () => {
    render(<ToggleDemo config={mockConfig} isActive={true} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toBeChecked();
  });

  it('shows label when showLabel is true', () => {
    render(<ToggleDemo config={{ ...mockConfig, showLabel: true }} isActive={true} />);
    
    expect(screen.getByText('OFF')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<ToggleDemo config={{ ...mockConfig, showLabel: false }} isActive={true} />);
    
    expect(screen.queryByText('OFF')).not.toBeInTheDocument();
  });

  it('handles manual toggle', async () => {
    render(<ToggleDemo config={mockConfig} isActive={true} />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    
    expect(toggle).toBeChecked();
    expect(screen.getByText('ON')).toBeInTheDocument();
  });

  it('starts with isOn state when true', () => {
    render(<ToggleDemo config={{ ...mockConfig, isOn: true }} isActive={true} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeChecked();
    expect(screen.getByText('ON')).toBeInTheDocument();
  });
});

describe('ProgressRingDemo', () => {
  const mockConfig = defaultDemoConfig.progressRing;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders progress ring', () => {
    render(<ProgressRingDemo config={mockConfig} isActive={true} />);
    
    // Check for SVG element
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Check for circle element
    const circle = document.querySelector('circle');
    expect(circle).toBeInTheDocument();
  });

  it('displays percentage when showPercentage is true', () => {
    render(<ProgressRingDemo config={{ ...mockConfig, showPercentage: true, percentage: 45 }} isActive={true} />);
    
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('hides percentage when showPercentage is false', () => {
    render(<ProgressRingDemo config={{ ...mockConfig, showPercentage: false, percentage: 45 }} isActive={true} />);
    
    expect(screen.queryByText('45%')).not.toBeInTheDocument();
  });

  it('respects percentage boundaries', () => {
    render(<ProgressRingDemo config={{ ...mockConfig, percentage: 150 }} isActive={true} />);
    
    // Should clamp to 100
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});

describe('TextFieldDemo', () => {
  const mockConfig = defaultDemoConfig.textField;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders text field with placeholder', () => {
    render(<TextFieldDemo config={mockConfig} isActive={true} />);
    
    const input = screen.getByPlaceholderText(mockConfig.placeholder);
    expect(input).toBeInTheDocument();
  });

  it('handles text input', async () => {
    render(<TextFieldDemo config={mockConfig} isActive={true} />);
    
    const input = screen.getByPlaceholderText(mockConfig.placeholder);
    fireEvent.change(input, { target: { value: 'test input' } });
    
    expect(input).toHaveValue('test input');
  });

  it('respects maxLength', () => {
    render(<TextFieldDemo config={{ ...mockConfig, maxLength: 10 }} isActive={true} />);
    
    const input = screen.getByPlaceholderText(mockConfig.placeholder);
    expect(input).toHaveAttribute('maxlength', '10');
  });

  it('shows clear button when showClearButton is true', () => {
    render(<TextFieldDemo config={{ ...mockConfig, showClearButton: true }} isActive={true} />);
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('hides clear button when showClearButton is false', () => {
    render(<TextFieldDemo config={{ ...mockConfig, showClearButton: false }} isActive={true} />);
    
    const clearButton = screen.queryByRole('button', { name: /clear/i });
    expect(clearButton).not.toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    render(<TextFieldDemo config={{ ...mockConfig, showClearButton: true }} isActive={true} />);
    
    const input = screen.getByPlaceholderText(mockConfig.placeholder);
    const clearButton = screen.getByRole('button', { name: /clear/i });
    
    fireEvent.change(input, { target: { value: 'test input' } });
    fireEvent.click(clearButton);
    
    expect(input).toHaveValue('');
  });
});

describe('ToastDemo', () => {
  const mockConfig = defaultDemoConfig.toast;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toast when visible', () => {
    render(<ToastDemo config={mockConfig} isActive={true} />);
    
    // Toast should be visible after autoShow
    waitFor(() => {
      expect(screen.getByText(mockConfig.message)).toBeInTheDocument();
    });
  });

  it('shows toast message', async () => {
    render(<ToastDemo config={mockConfig} isActive={true} />);
    
    waitFor(() => {
      expect(screen.getByText(mockConfig.message)).toBeInTheDocument();
    });
  });

  it('can be manually shown', async () => {
    render(<ToastDemo config={{ ...mockConfig, autoShow: false }} isActive={true} />);
    
    // Should not be visible initially
    expect(screen.queryByText(mockConfig.message)).not.toBeInTheDocument();
    
    // Manually show toast
    fireEvent.click(screen.getByRole('button', { name: /show/i }));
    
    waitFor(() => {
      expect(screen.getByText(mockConfig.message)).toBeInTheDocument();
    });
  });

  it('can be manually hidden', async () => {
    render(<ToastDemo config={mockConfig} isActive={true} />);
    
    waitFor(() => {
      const toast = screen.getByText(mockConfig.message);
      const closeButton = screen.getByRole('button', { name: /close/i });
      
      fireEvent.click(closeButton);
      
      expect(toast).not.toBeInTheDocument();
    });
  });
});

describe('HoverCardDemo', () => {
  const mockConfig = defaultDemoConfig.hoverCard;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hover card', () => {
    render(<HoverCardDemo config={mockConfig} isActive={true} />);
    
    const card = screen.getByTestId('hover-card');
    expect(card).toBeInTheDocument();
  });

  it('displays card content', () => {
    render(<HoverCardDemo config={mockConfig} isActive={true} />);
    
    expect(screen.getByText(mockConfig.content[0])).toBeInTheDocument();
  });

  it('handles hover events', async () => {
    render(<HoverCardDemo config={{ ...mockConfig, autoHover: false }} isActive={true} />);
    
    const card = screen.getByTestId('hover-card');
    
    fireEvent.mouseEnter(card);
    waitFor(() => {
      expect(card).toHaveClass('hovered');
    });
    
    fireEvent.mouseLeave(card);
    waitFor(() => {
      expect(card).not.toHaveClass('hovered');
    });
  });

  it('rotates content when contentRotation is true', () => {
    render(<HoverCardDemo config={{ ...mockConfig, contentRotation: true }} isActive={true} />);
    
    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
  });

  it('does not rotate content when contentRotation is false', () => {
    render(<HoverCardDemo config={{ ...mockConfig, contentRotation: false }} isActive={true} />);
    
    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
  });

  it('respects card dimensions', () => {
    render(<HoverCardDemo config={mockConfig} isActive={true} />);
    
    const card = screen.getByTestId('hover-card');
    expect(card).toHaveStyle({
      width: `${mockConfig.cardWidth}px`,
      height: `${mockConfig.cardHeight}px`,
    });
  });
});

describe('Component Integration', () => {
  it('all components render without errors', () => {
    const components = [
      <SliderDemo key="slider" config={defaultDemoConfig.slider} isActive={false} />,
      <ToggleDemo key="toggle" config={defaultDemoConfig.toggle} isActive={false} />,
      <ProgressRingDemo key="progress" config={defaultDemoConfig.progressRing} isActive={false} />,
      <TextFieldDemo key="textfield" config={defaultDemoConfig.textField} isActive={false} />,
      <ToastDemo key="toast" config={defaultDemoConfig.toast} isActive={false} />,
      <HoverCardDemo key="hovercard" config={defaultDemoConfig.hoverCard} isActive={false} />,
    ];

    components.forEach((component) => {
      expect(() => render(component)).not.toThrow();
    });
  });

  it('components respect isActive prop', () => {
    const { rerender } = render(<SliderDemo config={defaultDemoConfig.slider} isActive={false} />);
    
    // When inactive, auto-animations should not run
    expect(screen.getByRole('slider')).toBeInTheDocument();
    
    // When active, auto-animations should run
    rerender(<SliderDemo config={defaultDemoConfig.slider} isActive={true} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });
});
