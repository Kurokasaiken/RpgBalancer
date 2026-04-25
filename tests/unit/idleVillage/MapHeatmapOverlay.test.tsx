// tests/unit/idleVillage/MapHeatmapOverlay.test.tsx
// Unit tests for MapHeatmapOverlay component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import type { HeatmapState, HeatmapDataPoint } from '@/balancing/config/idleVillage/heatmapConfig';
import { DEFAULT_HEATMAP_CONFIG } from '@/balancing/config/idleVillage/heatmapConfig';
import MapHeatmapOverlay from '@/ui/idleVillage/components/MapHeatmapOverlay';

// Mock console.log to capture telemetry
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('MapHeatmapOverlay', () => {
  const createMockHeatmapDataPoint = (overrides: Partial<HeatmapDataPoint> = {}): HeatmapDataPoint => ({
    x: 100,
    y: 100,
    density: 1.0,
    activityCount: 1,
    activityTypes: ['job'],
    color: 'rgba(34, 197, 94, 0.3)',
    isActive: true,
    ...overrides,
  });

  const createMockHeatmapState = (overrides: Partial<HeatmapState> = {}): HeatmapState => ({
    data: [
      createMockHeatmapDataPoint({ x: 100, y: 100, density: 1.0, activityTypes: ['job'] }),
      createMockHeatmapDataPoint({ x: 200, y: 200, density: 3.0, activityTypes: ['quest', 'job'] }),
      createMockHeatmapDataPoint({ x: 300, y: 300, density: 5.0, activityTypes: ['maintenance'] }),
    ],
    config: DEFAULT_HEATMAP_CONFIG,
    isVisible: true,
    lastUpdate: Date.now(),
    mapDimensions: { width: 1200, height: 800, cellSize: 40, cols: 30, rows: 20 },
    ...overrides,
  });

  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe('Rendering', () => {
    it('should render when visible', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      expect(screen.getByTestId('map-heatmap-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('map-heatmap-overlay')).toHaveAttribute('data-visible', 'true');
    });

    it('should not render when not visible', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={false}
        />
      );

      const overlay = screen.getByTestId('map-heatmap-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveAttribute('data-visible', 'false');
      expect(overlay).toHaveStyle({ opacity: '0' });
    });

    it('should render heatmap tiles', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      // Should render tiles for active data points
      expect(screen.getByTestId('heatmap-tile-100-100')).toBeInTheDocument();
      expect(screen.getByTestId('heatmap-tile-200-200')).toBeInTheDocument();
      expect(screen.getByTestId('heatmap-tile-300-300')).toBeInTheDocument();
    });

    it('should render toggle button', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      const toggleButton = screen.getByTestId('heatmap-toggle-button');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveTextContent('🔥 Hide Heatmap');
    });

    it('should show correct toggle button text when hidden', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={false}
        />
      );

      const toggleButton = screen.getByTestId('heatmap-toggle-button');
      expect(toggleButton).toHaveTextContent('🗺️ Show Heatmap');
    });

    it('should render legend when enabled', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
          showLegend={true}
        />
      );

      expect(screen.getByTestId('heatmap-legend')).toBeInTheDocument();
      expect(screen.getByText('Activity Density')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('should not render legend when disabled', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
          showLegend={false}
        />
      );

      expect(screen.queryByTestId('heatmap-legend')).not.toBeInTheDocument();
    });

    it('should render debug stats in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      expect(screen.getByTestId('heatmap-debug-stats')).toBeInTheDocument();
      expect(screen.getByText(/Active Tiles: 3/)).toBeInTheDocument();
      expect(screen.getByText(/Max Density:/)).toBeInTheDocument();
      expect(screen.getByText(/Grid: 30x20/)).toBeInTheDocument();

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Interactions', () => {
    it('should call onToggle when toggle button is clicked', () => {
      const mockState = createMockHeatmapState();
      const mockOnToggle = vi.fn();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
          onToggle={mockOnToggle}
        />
      );

      const toggleButton = screen.getByTestId('heatmap-toggle-button');
      fireEvent.click(toggleButton);

      expect(mockOnToggle).toHaveBeenCalledWith(false);
    });

    it('should log tile hover interactions when enabled', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
          enableHover={true}
        />
      );

      const tile = screen.getByTestId('heatmap-tile-100-100');
      fireEvent.mouseEnter(tile);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Heatmap] Tile hover:',
        expect.objectContaining({
          x: 100,
          y: 100,
          density: 1.0,
          activityTypes: ['job'],
        })
      );
    });

    it('should log tile click interactions', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
          enableHover={true}
        />
      );

      const tile = screen.getByTestId('heatmap-tile-100-100');
      fireEvent.click(tile);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[Heatmap] Tile click:',
        expect.objectContaining({
          x: 100,
          y: 100,
          density: 1.0,
          activityTypes: ['job'],
        })
      );
    });

    it('should not log interactions when hover is disabled', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
          enableHover={false}
        />
      );

      const tile = screen.getByTestId('heatmap-tile-100-100');
      fireEvent.mouseEnter(tile);
      fireEvent.click(tile);

      expect(mockConsoleLog).not.toHaveBeenCalledWith('[Heatmap] Tile hover:', expect.any(Object));
      expect(mockConsoleLog).not.toHaveBeenCalledWith('[Heatmap] Tile click:', expect.any(Object));
    });
  });

  describe('Data Processing', () => {
    it('should filter out inactive tiles when min threshold is > 0', () => {
      const mockState = createMockHeatmapState({
        data: [
          createMockHeatmapDataPoint({ x: 100, y: 100, density: 0.5, isActive: false }), // Below threshold
          createMockHeatmapDataPoint({ x: 200, y: 200, density: 1.0, isActive: true }),  // Above threshold
        ],
        config: {
          ...DEFAULT_HEATMAP_CONFIG,
          thresholds: {
            ...DEFAULT_HEATMAP_CONFIG.thresholds,
            minActivityThreshold: 1,
          },
        },
      });
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      // Should only render the active tile above threshold
      expect(screen.queryByTestId('heatmap-tile-100-100')).not.toBeInTheDocument();
      expect(screen.getByTestId('heatmap-tile-200-200')).toBeInTheDocument();
    });

    it('should render all tiles when min threshold is 0', () => {
      const mockState = createMockHeatmapState({
        data: [
          createMockHeatmapDataPoint({ x: 100, y: 100, density: 0.5, isActive: false }), // Below threshold but should show
          createMockHeatmapDataPoint({ x: 200, y: 200, density: 1.0, isActive: true }),  // Above threshold
        ],
        config: {
          ...DEFAULT_HEATMAP_CONFIG,
          thresholds: {
            ...DEFAULT_HEATMAP_CONFIG.thresholds,
            minActivityThreshold: 0,
          },
        },
      });
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      // Should render both tiles
      expect(screen.getByTestId('heatmap-tile-100-100')).toBeInTheDocument();
      expect(screen.getByTestId('heatmap-tile-200-200')).toBeInTheDocument();
    });

    it('should display correct activity types in data attributes', () => {
      const mockState = createMockHeatmapState({
        data: [
          createMockHeatmapDataPoint({ x: 100, y: 100, activityTypes: ['job', 'quest'] }),
        ],
      });
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      const tile = screen.getByTestId('heatmap-tile-100-100');
      expect(tile).toHaveAttribute('data-activity-types', 'job,quest');
      expect(tile).toHaveAttribute('data-density', '1');
      expect(tile).toHaveAttribute('data-is-active', 'true');
    });
  });

  describe('Config Integration', () => {
    it('should use custom cell size from config', () => {
      const customConfig = {
        ...DEFAULT_HEATMAP_CONFIG,
        visual: {
          ...DEFAULT_HEATMAP_CONFIG.visual,
          cellSize: 60,
        },
      };

      const mockState = createMockHeatmapState({
        config: customConfig,
        mapDimensions: { width: 1200, height: 800, cellSize: 60, cols: 20, rows: 13 },
      });
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      // Tiles should be positioned based on custom cell size
      const tile = screen.getByTestId('heatmap-tile-100-100');
      expect(tile).toHaveStyle({ width: '60px', height: '60px' });
    });

    it('should use custom colors from config', () => {
      const customConfig = {
        ...DEFAULT_HEATMAP_CONFIG,
        colors: {
          ...DEFAULT_HEATMAP_CONFIG.colors,
          low: 'rgba(255, 0, 0, 0.5)',
        },
      };

      const mockState = createMockHeatmapState({
        config: customConfig,
        data: [
          createMockHeatmapDataPoint({ x: 100, y: 100, density: 1.0, color: 'rgba(255, 0, 0, 0.5)' }),
        ],
      });
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      const tile = screen.getByTestId('heatmap-tile-100-100');
      expect(tile).toHaveStyle({ backgroundColor: 'rgba(255, 0, 0, 0.5)' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const mockState = createMockHeatmapState({ data: [] });
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      expect(screen.getByTestId('map-heatmap-overlay')).toBeInTheDocument();
      expect(screen.queryByTestId('heatmap-tile-100-100')).not.toBeInTheDocument();
    });

    it('should handle missing onToggle gracefully', () => {
      const mockState = createMockHeatmapState();
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      const toggleButton = screen.getByTestId('heatmap-toggle-button');
      expect(() => fireEvent.click(toggleButton)).not.toThrow();
    });

    it('should handle disabled config', () => {
      const mockState = createMockHeatmapState({
        config: {
          ...DEFAULT_HEATMAP_CONFIG,
          enabled: false,
        },
      });
      
      render(
        <MapHeatmapOverlay
          heatmapState={mockState}
          isVisible={true}
        />
      );

      // Should render nothing when config is disabled
      expect(screen.queryByTestId('map-heatmap-overlay')).not.toBeInTheDocument();
    });
  });
});
