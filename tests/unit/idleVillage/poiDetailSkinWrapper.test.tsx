/**
 * POI Detail Skin Wrapper Unit Tests
 * 
 * Test suite for PoiDetailSkinWrapper component covering:
 * - Skin configuration loading and validation
 * - Fallback rendering when skin missing
 * - Telemetry event emission
 * - Props mapping and data transformation
 * - Integration with ActivityCapsuleDetailSkinAware
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { PoiDetailSkinWrapper } from '@/ui/idleVillage/components/PoiDetailSkinWrapper';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

// Mock dependencies
vi.mock('@/analytics/telemetry/telemetryProvider');

const mockTrackTelemetryEvent = vi.mocked(trackTelemetryEvent);

// Mock the entire ActivityCapsuleDetailSkinAware module to avoid TS-Series dependencies
vi.mock('@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware', () => ({
  ActivityCapsuleDetailSkinAware: vi.fn(({ children, ...props }) => (
    <div data-testid="activity-capsule-detail-skin-aware" {...props}>
      {children || 'Mocked ActivityCapsuleDetailSkinAware'}
    </div>
  )),
}));

// Mock the temporary skin registry to return undefined by default (simulating missing skin)
vi.mock('@/ui/idleVillage/skins/temporary/temporarySkinRegistry', () => ({
  getTemporarySkinConfig: vi.fn(() => undefined),
}));

// Mock the hooks used by ActivityCapsuleDetailSkinAware
vi.mock('@/ui/idleVillage/hooks/useSkinSystem', () => ({
  useSkinSystem: () => ({
    pillar: 'wilderness',
    presetId: 'wanderlust',
    motionLevel: 'full',
  }),
}));

vi.mock('@/ui/idleVillage/components/SkinSlot', () => ({
  useSkinSlot: () => ({
    binding: null,
    register: vi.fn(),
    unregister: vi.fn(),
    update: vi.fn(),
  }),
}));

vi.mock('@/ui/idleVillage/SkinReplacementAPI_TS003', () => ({
  getSkinReplacementAPI_TS003: () => ({}),
}));

vi.mock('@/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinSchema', () => ({
  ActivityCapsuleDetailSkinConfig: {},
  DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG: {},
  getActivityCapsuleDetailSkinConfig: () => ({}),
  createActivityCapsuleDetailSkinBinding: () => ({}),
  validateActivityCapsuleDetailSkinConfig: () => ({ isValid: true, errors: [], warnings: [] }),
  mergeActivityCapsuleDetailSkinConfig: () => ({}),
}));

describe('PoiDetailSkinWrapper', () => {
  const baseProps = {
    activityId: 'test-activity-1',
    name: 'Test Activity',
    type: 'poi-activity',
    subtitle: 'Test subtitle',
    status: 'idle' as const,
    progress: 0.5,
    duration: 3600,
    elapsed: 1800,
    slots: [
      {
        id: 'slot-1',
        state: 'empty' as const,
        initial: '',
        progress: 0,
      },
      {
        id: 'slot-2',
        state: 'idle' as const,
        initial: 'W',
        progress: 0.3,
        assignedWorkerName: 'Worker 1',
      },
    ],
    maxSlots: 3,
    durationDisplay: '1h',
    rewardDisplay: 'Resources + XP',
    etaDisplay: '30m',
    telemetry: [
      {
        id: '1',
        timestamp: new Date(),
        message: 'Activity initialized',
        type: 'assign' as const,
      },
    ],
    isOpen: true,
    showTelemetry: true,
    showSlots: true,
    showInfo: true,
    compact: false,
    ariaLive: 'polite' as const,
    dataTestId: 'test-poi-detail-wrapper',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Skin Configuration Loading', () => {
    it('should load POI detail skin configuration from registry', () => {
      const mockSkinConfig = {
        id: 'poi_detail_dark_luxury',
        name: 'POI Detail - Dark Luxury',
        version: '1.0.0',
        targetVersion: 'poi@v1',
        colorTokens: {
          body_base: '#0c0a08',
          title_color: '#ffd84a',
        },
      };

      mockGetTemporarySkinConfig.mockReturnValue(mockSkinConfig as any);

      render(<PoiDetailSkinWrapper {...baseProps} />);

      expect(mockGetTemporarySkinConfig).toHaveBeenCalledWith('poi_detail_dark_luxury');
      expect(screen.getByTestId('activity-capsule-detail-skin-aware')).toBeInTheDocument();
    });

    it('should render fallback UI when skin config is not found', () => {
      // Mock is already set to return undefined by default in the mock setup
      render(<PoiDetailSkinWrapper {...baseProps} />);

      expect(screen.getByTestId('test-poi-detail-wrapper')).toBeInTheDocument();
      expect(screen.queryByTestId('activity-capsule-detail-skin-aware')).not.toBeInTheDocument();
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    });

    it('should log warning when skin config is missing', async () => {
      const { getTemporarySkinConfig } = await import('@/ui/idleVillage/skins/temporary/temporarySkinRegistry');
      const mockGetTemporarySkinConfig = vi.mocked(getTemporarySkinConfig);
      
      mockGetTemporarySkinConfig.mockReturnValue(undefined);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<PoiDetailSkinWrapper {...baseProps} />);

      expect(consoleSpy).toHaveBeenCalledWith(
        'POI Detail skin "poi_detail_dark_luxury" not found, rendering without skin'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Telemetry Events', () => {
    it('should emit telemetry event when skin is loaded and component is open', async () => {
      const mockSkinConfig = {
        id: 'poi_detail_dark_luxury',
        name: 'POI Detail – Dark Luxury',
        version: '1.0.0',
        targetVersion: 'poi@v1',
      };

      mockGetTemporarySkinConfig.mockReturnValue(mockSkinConfig as any);

      render(<PoiDetailSkinWrapper {...baseProps} />);

      await waitFor(() => {
        expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('poi_detail_skin_rendered', {
          skinId: 'poi_detail_dark_luxury',
          skinName: 'POI Detail – Dark Luxury',
          skinVersion: '1.0.0',
          targetVersion: 'poi@v1',
          activityId: 'test-activity-1',
          activityType: 'poi-activity',
          status: 'idle',
          progress: 0.5,
          slotCount: 2,
          renderTimestamp: expect.any(Number),
          isOpen: true,
          compact: false,
          hasSkinConfig: true,
        });
      });
    });

    it('should not emit telemetry when component is not open', () => {
      const mockSkinConfig = {
        id: 'poi_detail_dark_luxury',
        name: 'POI Detail – Dark Luxury',
      };

      mockGetTemporarySkinConfig.mockReturnValue(mockSkinConfig as any);

      render(<PoiDetailSkinWrapper {...baseProps} isOpen={false} />);

      expect(mockTrackTelemetryEvent).not.toHaveBeenCalled();
    });

    it('should not emit telemetry when skin config is missing', () => {
      mockGetTemporarySkinConfig.mockReturnValue(undefined);

      render(<PoiDetailSkinWrapper {...baseProps} />);

      expect(mockTrackTelemetryEvent).not.toHaveBeenCalled();
    });
  });

  describe('Props Mapping', () => {
    it('should map slots data correctly for ActivityCapsuleDetailSkinAware', () => {
      const mockSkinConfig = {
        id: 'poi_detail_dark_luxury',
        name: 'POI Detail – Dark Luxury',
      };

      mockGetTemporarySkinConfig.mockReturnValue(mockSkinConfig as any);

      render(<PoiDetailSkinWrapper {...baseProps} />);

      const activityCapsule = screen.getByTestId('activity-capsule-detail-skin-aware');
      
      expect(activityCapsule).toHaveAttribute('activityId', 'test-activity-1');
      expect(activityCapsule).toHaveAttribute('name', 'Test Activity');
      expect(activityCapsule).toHaveAttribute('type', 'poi-activity');
      expect(activityCapsule).toHaveAttribute('status', 'idle');
      expect(activityCapsule).toHaveAttribute('progress', '0.5');
      expect(activityCapsule).toHaveAttribute('duration', '3600');
      expect(activityCapsule).toHaveAttribute('elapsed', '1800');
      expect(activityCapsule).toHaveAttribute('maxSlots', '3');
      expect(activityCapsule).toHaveAttribute('durationDisplay', '1h');
      expect(activityCapsule).toHaveAttribute('rewardDisplay', 'Resources + XP');
      expect(activityCapsule).toHaveAttribute('etaDisplay', '30m');
      expect(activityCapsule).toHaveAttribute('isOpen', 'true');
      expect(activityCapsule).toHaveAttribute('showTelemetry', 'true');
      expect(activityCapsule).toHaveAttribute('showSlots', 'true');
      expect(activityCapsule).toHaveAttribute('showInfo', 'true');
      expect(activityCapsule).toHaveAttribute('compact', 'false');
      expect(activityCapsule).toHaveAttribute('ariaLive', 'polite');
      expect(activityCapsule).toHaveAttribute('dataTestId', 'test-poi-detail-wrapper');
    });

    it('should transform slot states correctly', () => {
      const mockSkinConfig = {
        id: 'poi_detail_dark_luxury',
        name: 'POI Detail – Dark Luxury',
      };

      mockGetTemporarySkinConfig.mockReturnValue(mockSkinConfig as any);

      const propsWithSlotUpdates = {
        ...baseProps,
        slots: [
          {
            id: 'slot-1',
            isOccupied: true,
            assignedWorkerName: 'John Doe',
          },
          {
            id: 'slot-2',
            isOccupied: false,
            assignedWorkerName: undefined,
          },
        ],
      };

      render(<PoiDetailSkinWrapper {...propsWithSlotUpdates} />);

      // The slots should be transformed to ActivityDetailSlotData format
      // This would be verified through the ActivityCapsuleDetailSkinAware props
      expect(screen.getByTestId('activity-capsule-detail-skin-aware')).toBeInTheDocument();
    });
  });

  describe('Fallback UI Rendering', () => {
    it('should render all basic information in fallback mode', () => {
      mockGetTemporarySkinConfig.mockReturnValue(undefined);

      render(<PoiDetailSkinWrapper {...baseProps} />);

      expect(screen.getByText('Test Activity')).toBeInTheDocument();
      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
      expect(screen.getByText('Status: idle')).toBeInTheDocument();
      expect(screen.getByText('Progress: 50%')).toBeInTheDocument();
      expect(screen.getByText('Slots: 2/3')).toBeInTheDocument();
      expect(screen.getByText('Assigned Workers:')).toBeInTheDocument();
    });

    it('should render action buttons based on status in fallback mode', () => {
      // Mock is already set to return undefined by default in the mock setup
      const { rerender } = render(<PoiDetailSkinWrapper {...baseProps} status="idle" />);

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Collect')).not.toBeInTheDocument();

      rerender(<PoiDetailSkinWrapper {...baseProps} status="in-progress" />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('Collect')).not.toBeInTheDocument();

      rerender(<PoiDetailSkinWrapper {...baseProps} status="completed" />);
      
      expect(screen.getByText('Collect')).toBeInTheDocument();
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('should handle button clicks in fallback mode', () => {
      // Mock is already set to return undefined by default in the mock setup
      const onStart = vi.fn();
      const onCancel = vi.fn();
      const onCollect = vi.fn();
      const onClose = vi.fn();

      render(
        <PoiDetailSkinWrapper
          {...baseProps}
          onStart={onStart}
          onCancel={onCancel}
          onCollect={onCollect}
          onClose={onClose}
        />
      );

      fireEvent.click(screen.getByText('Start'));
      expect(onStart).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Close'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes in fallback mode', () => {
      // Mock is already set to return undefined by default in the mock setup
      render(
        <PoiDetailSkinWrapper
          {...baseProps}
          ariaLabel="Custom POI detail"
          ariaLive="assertive"
        />
      );

      const wrapper = screen.getByTestId('test-poi-detail-wrapper');
      expect(wrapper).toHaveAttribute('aria-label', 'Custom POI detail');
      expect(wrapper).toHaveAttribute('aria-live', 'assertive');
    });

    it('should pass accessibility props to ActivityCapsuleDetailSkinAware', async () => {
      const { getTemporarySkinConfig } = await import('@/ui/idleVillage/skins/temporary/temporarySkinRegistry');
      const mockGetTemporarySkinConfig = vi.mocked(getTemporarySkinConfig);
      
      const mockSkinConfig = {
        id: 'poi_detail_dark_luxury',
        name: 'POI Detail - Dark Luxury',
      };

      mockGetTemporarySkinConfig.mockReturnValue(mockSkinConfig as any);

      render(
        <PoiDetailSkinWrapper
          {...baseProps}
          ariaLabel="Custom POI detail"
          ariaLive="assertive"
        />
      );

      const activityCapsule = screen.getByTestId('activity-capsule-detail-skin-aware');
      expect(activityCapsule).toHaveAttribute('ariaLabel', 'Custom POI detail');
      expect(activityCapsule).toHaveAttribute('ariaLive', 'assertive');
    });
  });

  describe('Skin Configuration Overrides', () => {
    it('should apply skin configuration overrides to ActivityCapsuleDetailSkinAware', async () => {
      const { getTemporarySkinConfig } = await import('@/ui/idleVillage/skins/temporary/temporarySkinRegistry');
      const mockGetTemporarySkinConfig = vi.mocked(getTemporarySkinConfig);
      
      const mockSkinConfig = {
        id: 'poi_detail_dark_luxury',
        name: 'POI Detail - Dark Luxury',
        version: '1.0.0',
        colorTokens: {
          body_base: '#0c0a08',
          title_color: '#ffd84a',
          bronze_mid: '#3a2008',
        },
      };

      mockGetTemporarySkinConfig.mockReturnValue(mockSkinConfig as any);

      render(<PoiDetailSkinWrapper {...baseProps} />);

      const activityCapsule = screen.getByTestId('activity-capsule-detail-skin-aware');
      
      // Verify that skin config overrides are applied
      expect(activityCapsule).toHaveAttribute('pillar', 'wilderness');
      expect(activityCapsule).toHaveAttribute('skinPresetId', 'wanderlust');
      expect(activityCapsule).toHaveAttribute('motionLevel', 'full');
      expect(activityCapsule).toHaveAttribute('enableSkinBinding', 'true');
      expect(activityCapsule).toHaveAttribute('enableValidation', 'true');
      expect(activityCapsule).toHaveAttribute('enableTelemetry', 'true');
      expect(activityCapsule).toHaveAttribute('skinBindingId', 'poi-detail-test-activity-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const { getTemporarySkinConfig } = await import('@/ui/idleVillage/skins/temporary/temporarySkinRegistry');
      const mockGetTemporarySkinConfig = vi.mocked(getTemporarySkinConfig);
      
      const mockSkinConfig = {
        id: 'poi_detail_dark_luxury',
        name: 'POI Detail - Dark Luxury',
      };

      mockGetTemporarySkinConfig.mockReturnValue(mockSkinConfig as any);

      const onValidationError = vi.fn();

      render(
        <PoiDetailSkinWrapper
          {...baseProps}
          enableDevTools={true}
        />
      );

      // Validation errors would be handled by ActivityCapsuleDetailSkinAware
      expect(screen.getByTestId('activity-capsule-detail-skin-aware')).toBeInTheDocument();
    });
  });
});
