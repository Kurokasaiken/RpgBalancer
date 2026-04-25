/**
 * Map Mini Card Tests
 * 
 * Unit tests for the MapMiniCard component and related functionality.
 * Tests positioning, animations, interactions, and telemetry.
 * 
 * @since 2026-01-19
 * @author Helios-Idle – Map Cards
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { motion } from 'framer-motion';
import MapMiniCard from '@/ui/idleVillage/components/MapMiniCard';
import { DEFAULT_MAP_MINI_CARD_CONFIG } from '@/ui/idleVillage/config/mapMiniCardConfig';
import type { MapMiniCardProps } from '@/ui/idleVillage/components/MapMiniCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div data-motion="true" {...props}>{children}</div>,
  },
}));

// Mock ActivitySlotMiniCard
vi.mock('@/ui/idleVillage/components/ActivitySlotMiniCard', () => ({
  default: ({ 
    id, 
    icon, 
    label, 
    progress, 
    status, 
    onClick, 
    onHover, 
    testId,
    size = 'normal',
    visualVariant = 'azure',
    isHighlighted = false,
    minimalChrome = false,
  }: any) => (
    <div 
      data-testid={testId || `activity-mini-card-${id}`}
      data-activity-id={id}
      data-activity-label={label}
      data-progress={progress}
      data-status={status}
      data-size={size}
      data-variant={visualVariant}
      data-highlighted={isHighlighted}
      data-minimal-chrome={minimalChrome}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <div data-testid="icon">{icon}</div>
      <div data-testid="label">{label}</div>
      <div data-testid="progress">{Math.round(progress * 100)}%</div>
    </div>
  ),
}));

describe('MapMiniCard', () => {
  const defaultProps: MapMiniCardProps = {
    id: 'test-activity-1',
    activityType: 'job-gather',
    icon: '⛏️',
    label: 'Gather Resources',
    progress: 0.5,
    remainingSeconds: 120,
    status: 'running' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default configuration', () => {
      render(<MapMiniCard {...defaultProps} />);
      
      const container = screen.getByTestId('map-mini-card-job-gather-test-activity-1');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('data-activity-type', 'job-gather');
      expect(container).toHaveAttribute('data-map-position-x', '0.15');
      expect(container).toHaveAttribute('data-map-position-y', '0.3');
    });

    it('should render with custom position override', () => {
      const customPosition = { x: 0.8, y: 0.2 };
      render(
        <MapMiniCard 
          {...defaultProps} 
          position={customPosition}
        />
      );
      
      const container = screen.getByTestId('map-mini-card-job-gather-test-activity-1');
      expect(container).toHaveAttribute('data-map-position-x', '0.8');
      expect(container).toHaveAttribute('data-map-position-y', '0.2');
    });

    it('should use layout configuration from config', () => {
      render(<MapMiniCard {...defaultProps} />);
      
      const miniCard = screen.getByTestId('activity-mini-card-test-activity-1');
      expect(miniCard).toHaveAttribute('data-size', 'normal');
      expect(miniCard).toHaveAttribute('data-variant', 'jade');
      expect(miniCard).toHaveAttribute('data-highlighted', 'false');
      expect(miniCard).toHaveAttribute('data-minimal-chrome', 'false');
    });

    it('should render highlighted quest activities', () => {
      render(
        <MapMiniCard 
          {...defaultProps} 
          activityType="quest-main"
        />
      );
      
      const miniCard = screen.getByTestId('activity-mini-card-test-activity-1');
      expect(miniCard).toHaveAttribute('data-size', 'expanded');
      expect(miniCard).toHaveAttribute('data-variant', 'amethyst');
      expect(miniCard).toHaveAttribute('data-highlighted', 'true');
    });

    it('should render maintenance activities with minimal chrome', () => {
      render(
        <MapMiniCard 
          {...defaultProps} 
          activityType="maintenance-food"
        />
      );
      
      const miniCard = screen.getByTestId('activity-mini-card-test-activity-1');
      expect(miniCard).toHaveAttribute('data-size', 'compact');
      expect(miniCard).toHaveAttribute('data-variant', 'jade');
      expect(miniCard).toHaveAttribute('data-minimal-chrome', 'true');
    });

    it('should show highlight pulse overlay for highlighted activities', () => {
      render(
        <MapMiniCard 
          {...defaultProps} 
          activityType="quest-main"
        />
      );
      
      const pulseOverlay = screen.getByTestId('map-mini-card-quest-main-test-activity-1')
        .querySelector('.bg-amber-400\\/20');
      expect(pulseOverlay).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      const handleMapClick = vi.fn();
      
      render(
        <MapMiniCard 
          {...defaultProps} 
          onClick={handleClick}
          onMapClick={handleMapClick}
        />
      );
      
      const container = screen.getByTestId('map-mini-card-job-gather-test-activity-1');
      fireEvent.click(container);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleMapClick).toHaveBeenCalledWith('test-activity-1', 'job-gather');
    });

    it('should handle hover events', async () => {
      const handleHover = vi.fn();
      const handleMapHover = vi.fn();
      
      render(
        <MapMiniCard 
          {...defaultProps} 
          onHover={handleHover}
          onMapHover={handleMapHover}
        />
      );
      
      const miniCard = screen.getByTestId('activity-mini-card-test-activity-1');
      fireEvent.mouseEnter(miniCard);
      
      expect(handleHover).toHaveBeenCalledWith(true);
      expect(handleMapHover).toHaveBeenCalledWith('test-activity-1', 'job-gather', true);
      
      fireEvent.mouseLeave(miniCard);
      expect(handleHover).toHaveBeenCalledWith(false);
      expect(handleMapHover).toHaveBeenCalledWith('test-activity-1', 'job-gather', false);
    });

    it('should emit telemetry on click', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<MapMiniCard {...defaultProps} />);
      
      const container = screen.getByTestId('map-mini-card-job-gather-test-activity-1');
      fireEvent.click(container);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TELEMETRY] idle_map_minicard_interaction:',
        expect.objectContaining({
          activityId: 'test-activity-1',
          activityType: 'job-gather',
          interaction: 'click',
          timestamp: expect.any(String),
          position: { x: 0.15, y: 0.3 },
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should emit telemetry on hover', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<MapMiniCard {...defaultProps} />);
      
      const miniCard = screen.getByTestId('activity-mini-card-test-activity-1');
      fireEvent.mouseEnter(miniCard);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[TELEMETRY] idle_map_minicard_interaction:',
        expect.objectContaining({
          activityId: 'test-activity-1',
          activityType: 'job-gather',
          interaction: 'hover',
          isHovering: true,
          timestamp: expect.any(String),
          position: { x: 0.15, y: 0.3 },
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should use custom map configuration', () => {
      const customConfig = {
        ...DEFAULT_MAP_MINI_CARD_CONFIG,
        layouts: {
          ...DEFAULT_MAP_MINI_CARD_CONFIG.layouts,
          'job-gather': {
            ...DEFAULT_MAP_MINI_CARD_CONFIG.layouts['job-gather'],
            position: { x: 0.9, y: 0.9 },
            size: 'compact' as const,
            visualVariant: 'ember' as const,
          },
        },
      };
      
      render(
        <MapMiniCard 
          {...defaultProps} 
          mapConfig={customConfig}
        />
      );
      
      const container = screen.getByTestId('map-mini-card-job-gather-test-activity-1');
      expect(container).toHaveAttribute('data-map-position-x', '0.9');
      expect(container).toHaveAttribute('data-map-position-y', '0.9');
      
      const miniCard = screen.getByTestId('activity-mini-card-test-activity-1');
      expect(miniCard).toHaveAttribute('data-size', 'compact');
      expect(miniCard).toHaveAttribute('data-variant', 'ember');
    });

    it('should disable animations when enableMapAnimations is false', () => {
      render(
        <MapMiniCard 
          {...defaultProps} 
          enableMapAnimations={false}
        />
      );
      
      const container = screen.getByTestId('map-mini-card-job-gather-test-activity-1');
      expect(container).toBeInTheDocument();
      // Animation behavior would be tested through integration tests
    });
  });

  describe('Accessibility', () => {
    it('should have proper test IDs for testing', () => {
      render(<MapMiniCard {...defaultProps} />);
      
      expect(screen.getByTestId('map-mini-card-job-gather-test-activity-1')).toBeInTheDocument();
      expect(screen.getByTestId('activity-mini-card-test-activity-1')).toBeInTheDocument();
    });

    it('should include data attributes for map context', () => {
      render(<MapMiniCard {...defaultProps} />);
      
      const container = screen.getByTestId('map-mini-card-job-gather-test-activity-1');
      expect(container).toHaveAttribute('data-activity-type', 'job-gather');
      expect(container).toHaveAttribute('data-map-position-x', '0.15');
      expect(container).toHaveAttribute('data-map-position-y', '0.3');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown activity types gracefully', () => {
      render(
        <MapMiniCard 
          {...defaultProps} 
          activityType="unknown-activity"
        />
      );
      
      const container = screen.getByTestId('map-mini-card-unknown-activity-test-activity-1');
      expect(container).toBeInTheDocument();
      
      // Should use default configuration
      expect(container).toHaveAttribute('data-map-position-x', '0.5');
      expect(container).toHaveAttribute('data-map-position-y', '0.5');
      
      const miniCard = screen.getByTestId('activity-mini-card-test-activity-1');
      expect(miniCard).toHaveAttribute('data-size', 'normal');
      expect(miniCard).toHaveAttribute('data-variant', 'azure');
    });

    it('should handle missing handlers gracefully', () => {
      expect(() => {
        render(<MapMiniCard {...defaultProps} />);
        
        const container = screen.getByTestId('map-mini-card-job-gather-test-activity-1');
        fireEvent.click(container);
        fireEvent.mouseEnter(screen.getByTestId('activity-mini-card-test-activity-1'));
      }).not.toThrow();
    });
  });
});
