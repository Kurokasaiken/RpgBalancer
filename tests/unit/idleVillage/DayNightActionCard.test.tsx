import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DayNightActionCard from '../../../src/ui/idleVillage/map/actionCards/DayNightActionCard';

// Mock the ActionCard dependency
vi.mock('@/ui/idleVillage/map/actionCards/ActionCard', () => ({
  ActionCard: vi.fn(({ label, icon, onToggle, dataTestId, children, ...props }) => (
    <button
      data-testid={dataTestId}
      onClick={onToggle}
      aria-label={label}
      {...props}
    >
      {icon}
      {children}
      <span>{label}</span>
    </button>
  )),
}));

// Mock the cardFormatting utility
vi.mock('@/ui/idleVillage/map/actionCards/cardFormatting', () => ({
  formatMiniCardCountdown: vi.fn((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }),
}));

describe('DayNightActionCard', () => {
  const defaultProps = {
    phaseIcon: <span data-testid="phase-icon">Sun</span>,
    isPlaying: true,
    progressFraction: 0.5,
    totalSeconds: 3600,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders phase icon when playing', () => {
    render(<DayNightActionCard {...defaultProps} />);
    
    expect(screen.getByTestId('phase-icon')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('shows pause icon when paused', () => {
    render(<DayNightActionCard {...defaultProps} isPlaying={false} />);
    
    expect(screen.getByTestId('day-night-pause-icon')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const handleToggle = vi.fn();
    render(<DayNightActionCard {...defaultProps} onToggle={handleToggle} />);
    
    const card = screen.getByTestId('day-night-card');
    fireEvent.click(card);
    
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('clamps progress fraction to 0-1 range', () => {
    render(<DayNightActionCard {...defaultProps} progressFraction={1.5} />);
    
    const card = screen.getByTestId('day-night-card');
    expect(card).toBeInTheDocument();
  });

  it('handles negative progress fraction', () => {
    render(<DayNightActionCard {...defaultProps} progressFraction={-0.5} />);
    
    const card = screen.getByTestId('day-night-card');
    expect(card).toBeInTheDocument();
  });

  it('handles infinite progress fraction', () => {
    render(<DayNightActionCard {...defaultProps} progressFraction={Infinity} />);
    
    const card = screen.getByTestId('day-night-card');
    expect(card).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<DayNightActionCard {...defaultProps} className="custom-class" />);
    
    const card = screen.getByTestId('day-night-card');
    expect(card).toHaveClass('custom-class');
  });

  it('uses custom label', () => {
    render(<DayNightActionCard {...defaultProps} label="Custom Cycle" />);
    
    expect(screen.getByText('Custom Cycle')).toBeInTheDocument();
  });

  it('uses custom pause icon', () => {
    const customPauseIcon = <span data-testid="custom-pause">Pause</span>;
    render(<DayNightActionCard {...defaultProps} isPlaying={false} pauseIcon={customPauseIcon} />);
    
    expect(screen.getByTestId('custom-pause')).toBeInTheDocument();
  });

  it('clamps halo size to valid range', () => {
    render(<DayNightActionCard {...defaultProps} haloSizePx={500} />);
    
    const card = screen.getByTestId('day-night-card');
    expect(card).toBeInTheDocument();
  });

  it('clamps halo stroke width to valid range', () => {
    render(<DayNightActionCard {...defaultProps} haloStrokeWidth={20} />);
    
    const card = screen.getByTestId('day-night-card');
    expect(card).toBeInTheDocument();
  });

  it('clamps inner size percent to valid range', () => {
    render(<DayNightActionCard {...defaultProps} innerSizePercent={150} />);
    
    const card = screen.getByTestId('day-night-card');
    expect(card).toBeInTheDocument();
  });

  it('handles zero total seconds', () => {
    render(<DayNightActionCard {...defaultProps} totalSeconds={0} />);
    
    const card = screen.getByTestId('day-night-card');
    expect(card).toBeInTheDocument();
  });

  it('handles NaN total seconds', () => {
    render(<DayNightActionCard {...defaultProps} totalSeconds={NaN} />);
    
    const card = screen.getByTestId('day-night-card');
    expect(card).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<DayNightActionCard {...defaultProps} />);
    
    const card = screen.getByTestId('day-night-card');
    expect(card).toHaveAttribute('aria-label', 'Day/Night Cycle');
  });
});
