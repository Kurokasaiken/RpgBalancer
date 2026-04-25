import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TooltipProvider, Tooltip } from '@/ui/idleVillage/components/TooltipProvider';
import type { MinimalUITooltipPolicy } from '@/balancing/config/idleVillage/minimalConfig';

describe('TooltipProvider', () => {
  const defaultPolicy: MinimalUITooltipPolicy = {
    showDelayMs: 500,
    hideDelayMs: 200,
    showOnHover: true,
    showOnFocus: true,
    autoHideDurationMs: 0,
    disableHoverableContent: false,
    skipDelayDuration: false,
  };

  it('should render children without tooltip provider when disabled', () => {
    render(
      <TooltipProvider disabled>
        <div>Test Content</div>
      </TooltipProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render children with tooltip provider', () => {
    render(
      <TooltipProvider policy={defaultPolicy}>
        <div>Test Content</div>
      </TooltipProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply test ID', () => {
    render(
      <TooltipProvider testId="custom-tooltip-provider">
        <div>Test Content</div>
      </TooltipProvider>
    );

    expect(screen.getByTestId('custom-tooltip-provider')).toBeInTheDocument();
  });

  it('should merge policy with defaults', () => {
    const customPolicy = {
      showDelayMs: 1000,
      showOnHover: false,
    };

    render(
      <TooltipProvider policy={customPolicy}>
        <div>Test Content</div>
      </TooltipProvider>
    );

    // Component renders successfully with merged policy
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

describe('Tooltip', () => {
  beforeEach(() => {
    // Mock timers for tooltip delays
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render tooltip with content', () => {
    render(
      <TooltipProvider>
        <Tooltip content="Tooltip content">
          <button>Hover me</button>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });

  it('should show tooltip on hover', async () => {
    const user = userEvent.setup();
    
    render(
      <TooltipProvider>
        <Tooltip content="Tooltip content">
          <button>Hover me</button>
        </Tooltip>
      </TooltipProvider>
    );

    const button = screen.getByRole('button', { name: 'Hover me' });
    
    // Initial state - tooltip should not be visible
    expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
    
    // Hover over button
    await user.hover(button);
    
    // Fast-forward past delay
    vi.advanceTimersByTime(500);
    
    // Tooltip should now be visible
    expect(screen.getByText('Tooltip content')).toBeInTheDocument();
  });

  it('should hide tooltip on unhover', async () => {
    const user = userEvent.setup();
    
    render(
      <TooltipProvider>
        <Tooltip content="Tooltip content">
          <button>Hover me</button>
        </Tooltip>
      </TooltipProvider>
    );

    const button = screen.getByRole('button', { name: 'Hover me' });
    
    // Hover to show tooltip
    await user.hover(button);
    vi.advanceTimersByTime(500);
    expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    
    // Unhover to hide tooltip
    await user.unhover(button);
    vi.advanceTimersByTime(200);
    
    // Tooltip should be hidden
    expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
  });

  it('should respect custom delay duration', async () => {
    const user = userEvent.setup();
    
    render(
      <TooltipProvider>
        <Tooltip content="Tooltip content" delayDuration={1000}>
          <button>Hover me</button>
        </Tooltip>
      </TooltipProvider>
    );

    const button = screen.getByRole('button', { name: 'Hover me' });
    
    // Hover over button
    await user.hover(button);
    
    // Should not show before custom delay
    vi.advanceTimersByTime(500);
    expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
    
    // Should show after custom delay
    vi.advanceTimersByTime(500);
    expect(screen.getByText('Tooltip content')).toBeInTheDocument();
  });

  it('should render with custom side and align', async () => {
    const user = userEvent.setup();
    
    render(
      <TooltipProvider>
        <Tooltip content="Tooltip content" side="bottom" align="end">
          <button>Hover me</button>
        </Tooltip>
      </TooltipProvider>
    );

    const button = screen.getByRole('button', { name: 'Hover me' });
    
    await user.hover(button);
    vi.advanceTimersByTime(500);
    
    // Tooltip should be visible with custom positioning
    expect(screen.getByText('Tooltip content')).toBeInTheDocument();
  });
});
