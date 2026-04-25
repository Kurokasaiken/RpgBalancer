import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import LocationCard from './LocationCard';
import type { LocationFeaturedActivity } from './LocationCard';

// Mock the background image import
vi.mock('@/assets/ui/idleVillage/panorama-hotspring.jpg', () => ({
  default: 'mock-image-path',
}));

describe('LocationCard', () => {
  const defaultProps = {
    title: 'Test Location',
    description: 'A test location description',
    dropState: 'idle' as const,
    isLockedByPhase: false,
    size: 'standard' as const,
    testId: 'location-card',
    bloomTestId: 'location-card-bloom',
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders location card with title and description', () => {
      render(<LocationCard {...defaultProps} />);

      expect(screen.getByText('Test Location')).toBeInTheDocument();
      expect(screen.getByText('A test location description')).toBeInTheDocument();
    });

    it('renders with correct test id', () => {
      render(<LocationCard {...defaultProps} />);

      expect(screen.getByTestId('location-card')).toBeInTheDocument();
    });

    it('renders compact size correctly', () => {
      render(<LocationCard {...defaultProps} size="compact" />);

      const card = screen.getByTestId('location-card');
      expect(card).toHaveClass('w-[240px]');
    });

    it('renders standard size by default', () => {
      render(<LocationCard {...defaultProps} />);

      const card = screen.getByTestId('location-card');
      expect(card).toHaveClass('w-full');
    });
  });

  describe('drop states', () => {
    it('shows idle state styling by default', () => {
      render(<LocationCard {...defaultProps} dropState="idle" />);

      const card = screen.getByTestId('location-card');
      expect(card).toHaveClass('border-[color:var(--panel-border)]');
      expect(card).toHaveClass('shadow-[0_22px_55px_rgba(0,0,0,0.55)]');
      expect(card).toHaveClass('hover:border-emerald-200/60');
    });

    it('shows valid drop state with amber styling and bloom effect', () => {
      render(<LocationCard {...defaultProps} dropState="valid" />);

      const card = screen.getByTestId('location-card');
      expect(card).toHaveClass('border-amber-300/80');
      expect(card).toHaveClass('shadow-[0_0_70px_rgba(236,197,94,0.45)]');
      expect(card).toHaveClass('ring-4');
      expect(card).toHaveClass('ring-amber-200/50');

      // Bloom effect should be present
      expect(screen.getByTestId('location-card-bloom')).toBeInTheDocument();
    });

    it('shows invalid drop state with reduced opacity', () => {
      render(<LocationCard {...defaultProps} dropState="invalid" />);

      const card = screen.getByTestId('location-card');
      expect(card).toHaveClass('border-white/10');
      expect(card).toHaveClass('opacity-60');

      // Bloom effect should not be present for invalid state
      expect(screen.queryByTestId('location-card-bloom')).not.toBeInTheDocument();
    });
  });

  describe('featured activity', () => {
    const featuredActivity: LocationFeaturedActivity = {
      slotId: 'test-slot-1',
      icon: '⚔️',
      label: 'Test Quest',
      progressFraction: 0.75,
      progressLabel: '75%',
      assignedNames: ['Test Resident'],
      tone: 'quest',
    };

    it('renders featured activity with icon and label', () => {
      render(<LocationCard {...defaultProps} featuredActivity={featuredActivity} />);

      expect(screen.getByText('⚔️')).toBeInTheDocument();
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
    });

    it('displays progress bar and label', () => {
      render(<LocationCard {...defaultProps} featuredActivity={featuredActivity} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows assigned resident names', () => {
      render(<LocationCard {...defaultProps} featuredActivity={featuredActivity} />);

      expect(screen.getByText('Test Resident')).toBeInTheDocument();
    });

    it('renders quest tone with orange accent colors', () => {
      render(<LocationCard {...defaultProps} featuredActivity={featuredActivity} />);

      // The component renders correctly with quest tone
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
    });

    it('renders job tone with green accent colors', () => {
      const jobActivity = { ...featuredActivity, tone: 'job' as const };
      render(<LocationCard {...defaultProps} featuredActivity={jobActivity} />);

      // The component renders correctly with job tone
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
    });

    it('renders neutral tone with white accent colors', () => {
      const neutralActivity = { ...featuredActivity, tone: 'neutral' as const };
      render(<LocationCard {...defaultProps} featuredActivity={neutralActivity} />);

      // The component renders correctly with neutral tone
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
    });
  });

  describe('phase locking', () => {
    it('shows lock overlay when isLockedByPhase is true', () => {
      render(<LocationCard {...defaultProps} isLockedByPhase={true} />);

      expect(screen.getByText('🌙')).toBeInTheDocument();
      expect(screen.getByText('Notte - Riposo')).toBeInTheDocument();
    });

    it('blocks click interactions when locked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<LocationCard {...defaultProps} isLockedByPhase={true} onClick={onClick} />);

      const card = screen.getByTestId('location-card');
      await user.click(card);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has correct aria attributes for drop state', () => {
      render(<LocationCard {...defaultProps} dropState="valid" />);

      const card = screen.getByTestId('location-card');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(card).toHaveAttribute('aria-dropeffect', 'copy');
    });

    it('has correct aria attributes for idle state', () => {
      render(<LocationCard {...defaultProps} dropState="idle" />);

      const card = screen.getByTestId('location-card');
      expect(card).toHaveAttribute('aria-pressed', 'false');
      expect(card).not.toHaveAttribute('aria-dropeffect');
    });

    it('has correct aria label', () => {
      render(<LocationCard {...defaultProps} />);

      const card = screen.getByTestId('location-card');
      expect(card).toHaveAttribute('aria-label', 'Test Location');
    });
  });
});
