/**
 * Location Tooltip Test Suite - NP-109
 * 
 * Comprehensive tests for location tooltip system including:
 * - Config-first design validation
 * - Hook state management
 * - Component rendering
 * - Accessibility features
 * - Integration with LocationCard
 * 
 * @since 2026-01-23
 * @author Cascade
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import LocationTooltip from '@/ui/idleVillage/components/LocationTooltip';
import { useLocationTooltip, useLocationTooltipData } from '@/ui/idleVillage/hooks/useLocationTooltip';
import type { LocationTooltipData } from '@/ui/idleVillage/hooks/useLocationTooltip';
import {
  DEFAULT_LOCATION_TOOLTIP_CONFIG,
  getCrewCapacityStatus,
  getCrewCapacityColor,
  getRiskLevelColor,
  formatDuration,
  formatPercentage,
} from '@/ui/idleVillage/config/locationTooltipConfig';

describe('LocationTooltip Config', () => {
  describe('getCrewCapacityStatus', () => {
    it('returns empty when current is 0', () => {
      expect(getCrewCapacityStatus(0, 5)).toBe('empty');
    });

    it('returns available when current is less than 75% of max', () => {
      expect(getCrewCapacityStatus(2, 5)).toBe('available');
      expect(getCrewCapacityStatus(3, 5)).toBe('available');
    });

    it('returns filling when current is 75% or more of max', () => {
      expect(getCrewCapacityStatus(4, 5)).toBe('filling');
    });

    it('returns full when current equals max', () => {
      expect(getCrewCapacityStatus(5, 5)).toBe('full');
    });

    it('returns overfull when current exceeds max', () => {
      expect(getCrewCapacityStatus(6, 5)).toBe('overfull');
    });
  });

  describe('getCrewCapacityColor', () => {
    it('returns correct colors for each status', () => {
      expect(getCrewCapacityColor('empty')).toContain('rgb');
      expect(getCrewCapacityColor('available')).toContain('rgb');
      expect(getCrewCapacityColor('filling')).toContain('rgb');
      expect(getCrewCapacityColor('full')).toContain('rgb');
      expect(getCrewCapacityColor('overfull')).toContain('rgb');
    });
  });

  describe('getRiskLevelColor', () => {
    it('returns correct colors for each risk level', () => {
      expect(getRiskLevelColor('none')).toContain('rgb');
      expect(getRiskLevelColor('low')).toContain('rgb');
      expect(getRiskLevelColor('medium')).toContain('rgb');
      expect(getRiskLevelColor('high')).toContain('rgb');
      expect(getRiskLevelColor('critical')).toContain('rgb');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds correctly', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(45)).toBe('45s');
    });

    it('formats minutes correctly', () => {
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(120)).toBe('2m');
    });

    it('formats hours correctly', () => {
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(3660)).toBe('1h 1m');
      expect(formatDuration(7200)).toBe('2h');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentage values correctly', () => {
      expect(formatPercentage(0)).toBe('0%');
      expect(formatPercentage(0.5)).toBe('50%');
      expect(formatPercentage(0.75)).toBe('75%');
      expect(formatPercentage(1)).toBe('100%');
    });
  });

  describe('DEFAULT_LOCATION_TOOLTIP_CONFIG', () => {
    it('has all required visual properties', () => {
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.visual).toHaveProperty('backgroundColor');
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.visual).toHaveProperty('borderColor');
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.visual).toHaveProperty('textColor');
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.visual).toHaveProperty('maxWidth');
    });

    it('has all required behavior properties', () => {
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.behavior).toHaveProperty('showDelayMs');
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.behavior).toHaveProperty('hideDelayMs');
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.behavior).toHaveProperty('showOnHover');
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.behavior).toHaveProperty('showOnFocus');
    });

    it('has all required content properties', () => {
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.content).toHaveProperty('showTitle');
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.content).toHaveProperty('showCrewCapacity');
      expect(DEFAULT_LOCATION_TOOLTIP_CONFIG.content).toHaveProperty('showRequirements');
    });
  });
});

describe('useLocationTooltip Hook', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useLocationTooltip());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.position).toBeNull();
    expect(result.current.tooltipData).toBeNull();
  });

  it('shows tooltip after delay', async () => {
    const { result } = renderHook(() => useLocationTooltip());

    const mockData: LocationTooltipData = {
      locationId: 'test-location',
      title: 'Test Location',
      description: 'Test Description',
      crewCurrent: 2,
      crewMax: 5,
      crewStatus: 'available',
      assignedCrew: ['Worker 1', 'Worker 2'],
      isLockedByPhase: false,
    };

    const mockEvent = {
      clientX: 100,
      clientY: 100,
    } as MouseEvent;

    act(() => {
      result.current.showTooltip(mockData, mockEvent);
    });

    expect(result.current.isVisible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
      expect(result.current.tooltipData).toEqual(expect.objectContaining({
        locationId: 'test-location',
        title: 'Test Location',
      }));
    });
  });

  it('hides tooltip after delay', async () => {
    const { result } = renderHook(() => useLocationTooltip());

    const mockData: LocationTooltipData = {
      locationId: 'test-location',
      title: 'Test Location',
      description: 'Test Description',
      crewCurrent: 2,
      crewMax: 5,
      crewStatus: 'available',
      assignedCrew: [],
      isLockedByPhase: false,
    };

    const mockEvent = {
      clientX: 100,
      clientY: 100,
    } as MouseEvent;

    act(() => {
      result.current.showTooltip(mockData, mockEvent);
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
    });

    act(() => {
      result.current.hideTooltip();
      vi.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(result.current.isVisible).toBe(false);
    });
  });

  it('hides tooltip immediately without delay', async () => {
    const { result } = renderHook(() => useLocationTooltip());

    const mockData: LocationTooltipData = {
      locationId: 'test-location',
      title: 'Test Location',
      description: 'Test Description',
      crewCurrent: 2,
      crewMax: 5,
      crewStatus: 'available',
      assignedCrew: [],
      isLockedByPhase: false,
    };

    const mockEvent = {
      clientX: 100,
      clientY: 100,
    } as MouseEvent;

    act(() => {
      result.current.showTooltip(mockData, mockEvent);
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true);
    });

    act(() => {
      result.current.hideTooltipImmediate();
    });

    expect(result.current.isVisible).toBe(false);
  });
});

describe('useLocationTooltipData Hook', () => {
  it('processes location data correctly', () => {
    const { result } = renderHook(() =>
      useLocationTooltipData(
        'test-location',
        'Test Location',
        'Test Description',
        {
          slotId: 'test-slot',
          icon: '⚔️',
          label: 'Test Quest',
          progressFraction: 0.75,
          assignedNames: ['Worker 1', 'Worker 2'],
          tone: 'quest',
        },
        {
          crewMax: 5,
          requiredStats: ['strength', 'agility'],
          riskLevel: 'medium',
        }
      )
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        locationId: 'test-location',
        title: 'Test Location',
        description: 'Test Description',
        crewCurrent: 2,
        crewMax: 5,
        assignedCrew: ['Worker 1', 'Worker 2'],
        requiredStats: ['strength', 'agility'],
        riskLevel: 'medium',
        progressFraction: 0.75,
      })
    );
  });

  it('calculates crew status correctly', () => {
    const { result } = renderHook(() =>
      useLocationTooltipData('test-location', 'Test', 'Description', null, {
        crewMax: 5,
      })
    );

    expect(result.current.crewStatus).toBe('empty');
  });

  it('infers risk level from activity tone', () => {
    const { result: dangerResult } = renderHook(() =>
      useLocationTooltipData(
        'test-location',
        'Test',
        'Description',
        {
          slotId: 'test-slot',
          label: 'Danger',
          progressFraction: 0,
          assignedNames: [],
          tone: 'danger',
        },
        {}
      )
    );

    expect(dangerResult.current.riskLevel).toBe('high');

    const { result: questResult } = renderHook(() =>
      useLocationTooltipData(
        'test-location',
        'Test',
        'Description',
        {
          slotId: 'test-slot',
          label: 'Quest',
          progressFraction: 0,
          assignedNames: [],
          tone: 'quest',
        },
        {}
      )
    );

    expect(questResult.current.riskLevel).toBe('medium');
  });
});

describe('LocationTooltip Component', () => {
  const mockData: LocationTooltipData = {
    locationId: 'test-location',
    title: 'Test Location',
    description: 'A test location for tooltip',
    crewCurrent: 3,
    crewMax: 5,
    crewStatus: 'available',
    assignedCrew: ['Worker 1', 'Worker 2', 'Worker 3'],
    requiredStats: ['strength', 'agility'],
    riskLevel: 'medium',
    isLockedByPhase: false,
    progressFraction: 0.6,
    etaSeconds: 120,
  };

  const mockPosition = {
    x: 100,
    y: 100,
    placement: 'bottom' as const,
  };

  it('renders tooltip with all sections', () => {
    render(
      <LocationTooltip
        data={mockData}
        position={mockPosition}
        isVisible={true}
        testId="test-tooltip"
      />
    );

    expect(screen.getByTestId('test-tooltip')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText('A test location for tooltip')).toBeInTheDocument();
  });

  it('displays crew capacity correctly', () => {
    render(
      <LocationTooltip
        data={mockData}
        position={mockPosition}
        isVisible={true}
      />
    );

    expect(screen.getByText('3 / 5')).toBeInTheDocument();
    expect(screen.getByText('Crew Assignment')).toBeInTheDocument();
  });

  it('displays assigned crew members', () => {
    render(
      <LocationTooltip
        data={mockData}
        position={mockPosition}
        isVisible={true}
      />
    );

    expect(screen.getByText('Worker 1')).toBeInTheDocument();
    expect(screen.getByText('Worker 2')).toBeInTheDocument();
    expect(screen.getByText('Worker 3')).toBeInTheDocument();
  });

  it('displays required stats', () => {
    render(
      <LocationTooltip
        data={mockData}
        position={mockPosition}
        isVisible={true}
      />
    );

    expect(screen.getByText('strength')).toBeInTheDocument();
    expect(screen.getByText('agility')).toBeInTheDocument();
  });

  it('displays risk level badge', () => {
    render(
      <LocationTooltip
        data={mockData}
        position={mockPosition}
        isVisible={true}
      />
    );

    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('displays progress information', () => {
    render(
      <LocationTooltip
        data={{
          ...mockData,
          featuredActivity: {
            slotId: 'test-slot',
            icon: '⚔️',
            label: 'Test Quest',
            progressFraction: 0.6,
            assignedNames: [],
          },
        }}
        position={mockPosition}
        isVisible={true}
      />
    );

    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('2m')).toBeInTheDocument();
  });

  it('shows phase lock warning when locked', () => {
    render(
      <LocationTooltip
        data={{
          ...mockData,
          isLockedByPhase: true,
          phaseStatus: 'Night - Rest Phase',
        }}
        position={mockPosition}
        isVisible={true}
      />
    );

    expect(screen.getByText('Night - Rest Phase')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <LocationTooltip
        data={mockData}
        position={mockPosition}
        isVisible={true}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByLabelText('Close tooltip');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when not visible', () => {
    render(
      <LocationTooltip
        data={mockData}
        position={mockPosition}
        isVisible={false}
        testId="test-tooltip"
      />
    );

    expect(screen.queryByTestId('test-tooltip')).not.toBeInTheDocument();
  });

  it('respects custom config for content display', () => {
    render(
      <LocationTooltip
        data={mockData}
        position={mockPosition}
        isVisible={true}
        config={{
          content: {
            ...DEFAULT_LOCATION_TOOLTIP_CONFIG.content,
            showCrewCapacity: false,
            showRequirements: false,
          },
        }}
      />
    );

    expect(screen.queryByText('3 / 5')).not.toBeInTheDocument();
    expect(screen.queryByText('strength')).not.toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(
      <LocationTooltip
        data={mockData}
        position={mockPosition}
        isVisible={true}
        testId="test-tooltip"
      />
    );

    const tooltip = screen.getByTestId('test-tooltip');
    expect(tooltip).toHaveAttribute('role', 'tooltip');
    expect(tooltip).toHaveAttribute('aria-label');
  });

  it('limits crew display to maxCrewDisplay', () => {
    const manyCrewData = {
      ...mockData,
      assignedCrew: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
    };

    render(
      <LocationTooltip
        data={manyCrewData}
        position={mockPosition}
        isVisible={true}
        config={{
          content: {
            ...DEFAULT_LOCATION_TOOLTIP_CONFIG.content,
            maxCrewDisplay: 3,
          },
        }}
      />
    );

    expect(screen.getByText('W1')).toBeInTheDocument();
    expect(screen.getByText('W2')).toBeInTheDocument();
    expect(screen.getByText('W3')).toBeInTheDocument();
    expect(screen.getByText('+4 more')).toBeInTheDocument();
  });
});
