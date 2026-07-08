/**
 * VerticalSliceTestSection – Skin Integration Test Surface
 * 
 * Comprehensive test section that integrates all skin wrappers (NP-SM-011..014)
 * into a single surface for visual validation, pillar switching, and motion testing.
 * 
 * Dependencies: NP-SM-011..014 completed
 * Integration: useSkinPreferences, Style Lab tokens, telemetry
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';
import VillageRosterSectionSkin from '@/ui/idleVillage/components/VillageRosterSectionSkin';
import ResidentSlotRackSkin from '@/ui/idleVillage/components/ResidentSlotRackSkin';
import { TimeEngineStrip } from '@/ui/idleVillage/frozen/kits/clockKit';
import ActiveHUD from '@/ui/idleVillage/components/ActiveHUD';
import ActivityCapsule from '@/ui/idleVillage/components/ActivityCapsule';
import ActionHalo from '@/ui/idleVillage/map/actionCards/ActionHalo';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import type { SkinPresetId } from '@/ui/idleVillage/skins/skinConfigRegistry';
import { getSupportedPillars, getSkinPresetConfig } from '@/ui/idleVillage/skins/skinConfigRegistry';

/**
 * Props for VerticalSliceTestSection
 */
export interface VerticalSliceTestSectionProps {
  /** Optional override for initial preset */
  initialPresetId?: SkinPresetId;
  /** Optional override for initial pillar */
  initialPillar?: StyleLabPillar;
  /** Show motion controls */
  showMotionControls?: boolean;
  /** Show pillar switcher */
  showPillarSwitcher?: boolean;
  /** Show preset switcher */
  showPresetSwitcher?: boolean;
  /** Compact mode for smaller viewports */
  compact?: boolean;
  /** Test data for components */
  testData?: {
    residents?: any[];
    activities?: any[];
    slots?: any[];
  };
  /** Additional className */
  className?: string;
  /** Data-testid for testing */
  dataTestId?: string;
}

/**
 * Motion level options
 */
const MOTION_LEVELS = [
  { value: 'full', label: 'Full Motion', description: 'All animations and effects' },
  { value: 'reduced', label: 'Reduced Motion', description: 'Limited animations' },
  { value: 'minimal', label: 'Minimal Motion', description: 'Essential animations only' },
] as const;

/**
 * VerticalSliceTestSection component
 */
export function VerticalSliceTestSection({
  initialPresetId,
  initialPillar,
  showMotionControls = true,
  showPillarSwitcher = true,
  showPresetSwitcher = true,
  compact = false,
  testData = {},
  className,
  dataTestId = 'vertical-slice-test-section',
}: VerticalSliceTestSectionProps) {
  // Skin preferences
  const {
    presetId: currentPresetId,
    pillar: currentPillar,
    overrides,
    setPreset,
    setPillar,
    updateOverrides,
    supportedPillars,
    availablePresets,
    isLoading: skinLoading,
  } = useSkinPreferences();

  // Local state
  const [motionLevel, setMotionLevel] = useState<'full' | 'reduced' | 'minimal'>('full');
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [telemetryEvents, setTelemetryEvents] = useState<Array<{ timestamp: number; event: string; data: any }>>([]);

  // Initialize with props if provided
  useEffect(() => {
    if (initialPresetId && initialPresetId !== currentPresetId) {
      setPreset(initialPresetId, initialPillar);
    } else if (initialPillar && initialPillar !== currentPillar) {
      setPillar(initialPillar);
    }
  }, [initialPresetId, initialPillar, currentPresetId, currentPillar, setPreset, setPillar]);

  // Telemetry capture
  useEffect(() => {
    if (!showTelemetry) return;

    const originalTrackTelemetryEvent = trackTelemetryEvent;
    
    // Override telemetry to capture events
    const captureTelemetry = (event: string, data: any) => {
      originalTrackTelemetryEvent(event, data);
      setTelemetryEvents(prev => [...prev, { timestamp: Date.now(), event, data }]);
    };

    // Store original and restore on cleanup
    (window as any).__originalTrackTelemetryEvent = originalTrackTelemetryEvent;
    (window as any).trackTelemetryEvent = captureTelemetry;

    return () => {
      // Restore original
      if ((window as any).__originalTrackTelemetryEvent) {
        (window as any).trackTelemetryEvent = (window as any).__originalTrackTelemetryEvent;
        delete (window as any).__originalTrackTelemetryEvent;
      }
    };
  }, [showTelemetry]);

  // Handle preset change
  const handlePresetChange = useCallback((presetId: SkinPresetId) => {
    const presetConfig = getSkinPresetConfig(presetId);
    setPreset(presetId, presetConfig.defaultPillar);
    
    trackTelemetryEvent('vertical_slice_preset_changed', {
      presetId,
      previousPresetId: currentPresetId,
      pillar: presetConfig.defaultPillar,
      timestamp: Date.now(),
    });
  }, [currentPresetId, setPreset]);

  // Handle pillar change
  const handlePillarChange = useCallback((pillar: StyleLabPillar) => {
    setPillar(pillar);
    
    trackTelemetryEvent('vertical_slice_pillar_changed', {
      pillar,
      previousPillar: currentPillar,
      presetId: currentPresetId,
      timestamp: Date.now(),
    });
  }, [currentPillar, setPillar]);

  // Handle motion level change
  const handleMotionChange = useCallback((level: 'full' | 'reduced' | 'minimal') => {
    setMotionLevel(level);
    
    updateOverrides({
      motionLevel: level,
    });
    
    trackTelemetryEvent('vertical_slice_motion_changed', {
      motionLevel: level,
      presetId: currentPresetId,
      pillar: currentPillar,
      timestamp: Date.now(),
    });
  }, [currentPresetId, currentPillar, updateOverrides]);

  // Generate test data for components
  const mockResidents = useMemo(() => testData.residents || [
    { id: 'resident-1', name: 'Aria', class: 'Warrior', level: 5 },
    { id: 'resident-2', name: 'Thorne', class: 'Mage', level: 3 },
    { id: 'resident-3', name: 'Luna', class: 'Rogue', level: 4 },
  ], [testData.residents]);

  const mockSlots = useMemo(() => testData.slots || [
    { slotId: 'slot-1', isOccupied: true, assignedWorkerName: 'Aria' },
    { slotId: 'slot-2', isOccupied: false },
    { slotId: 'slot-3', isOccupied: true, assignedWorkerName: 'Thorne' },
  ], [testData.slots]);

  const mockActivities = useMemo(() => testData.activities || [
    { id: 'activity-1', name: 'Gold Mine', type: 'job' },
    { id: 'activity-2', name: 'Forest Hunt', type: 'quest' },
    { id: 'activity-3', name: 'Market', type: 'shop' },
  ], [testData.activities]);

  // Clear telemetry events
  const clearTelemetry = useCallback(() => {
    setTelemetryEvents([]);
  }, []);

  // Component render telemetry
  useEffect(() => {
    trackTelemetryEvent('vertical_slice_rendered', {
      presetId: currentPresetId,
      pillar: currentPillar,
      motionLevel,
      componentCount: 6, // Number of skin components being tested
      compact,
      timestamp: Date.now(),
    });
  }, [currentPresetId, currentPillar, motionLevel, compact]);

  if (skinLoading) {
    return (
      <StyleLabSurface>
        <div data-testid={dataTestId} className={className}>
          <div>Loading skin preferences...</div>
        </div>
      </StyleLabSurface>
    );
  }

  return (
    <StyleLabSurface>
      <div
        data-testid={dataTestId}
        data-preset-id={currentPresetId}
        data-pillar={currentPillar}
        data-motion-level={motionLevel}
        className={className}
      >
        {/* Control Panel */}
        <StyleLabSurface variant="card">
          <StyleLabStack spacing="md">
            <div className="text-lg font-semibold">
              Vertical Slice Test Controls
            </div>
            <StyleLabStack direction="horizontal" spacing="md" align="center">
              {/* Preset Switcher */}
              {showPresetSwitcher && (
                <div>
                  <label>Preset:</label>
                  <select
                    value={currentPresetId}
                    onChange={(e) => handlePresetChange(e.target.value as SkinPresetId)}
                  >
                    {availablePresets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pillar Switcher */}
              {showPillarSwitcher && (
                <div>
                  <label>Pillar:</label>
                  <select
                    value={currentPillar}
                    onChange={(e) => handlePillarChange(e.target.value as StyleLabPillar)}
                  >
                    {supportedPillars.map(pillar => (
                      <option key={pillar} value={pillar}>
                        {pillar.charAt(0).toUpperCase() + pillar.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Motion Controls */}
              {showMotionControls && (
                <div>
                  <label>Motion:</label>
                  <select
                    value={motionLevel}
                    onChange={(e) => handleMotionChange(e.target.value as 'full' | 'reduced' | 'minimal')}
                  >
                    {MOTION_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Telemetry Toggle */}
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={showTelemetry}
                    onChange={(e) => setShowTelemetry(e.target.checked)}
                  />
                  Show Telemetry
                </label>
              </div>

              {/* Clear Telemetry */}
              {showTelemetry && (
                <button onClick={clearTelemetry}>
                  Clear
                </button>
              )}
            </StyleLabStack>
          </StyleLabStack>
        </StyleLabSurface>

        {/* Component Grid */}
        <StyleLabStack spacing="lg" direction={compact ? 'vertical' : 'horizontal'}>
          {/* VillageRosterSectionSkin */}
          <StyleLabSurface variant="card">
            <StyleLabStack spacing="md">
              <div className="text-lg font-semibold">
                VillageRosterSectionSkin ({currentPillar})
              </div>
              <VillageRosterSectionSkin
                residents={mockResidents}
                skinPresetId={currentPresetId}
                pillar={currentPillar}
              />
            </StyleLabStack>
          </StyleLabSurface>

          {/* ResidentSlotRackSkin */}
          <StyleLabSurface variant="card">
            <StyleLabStack spacing="md">
              <div className="text-lg font-semibold">
                ResidentSlotRackSkin ({currentPillar})
              </div>
              <ResidentSlotRackSkin
                slots={mockSlots}
                skinPresetId={currentPresetId}
              />
            </StyleLabStack>
          </StyleLabSurface>

          {/* TimeEngineStrip */}
          <StyleLabSurface variant="card">
            <StyleLabStack spacing="md">
              <div className="text-lg font-semibold">
                TimeEngineStrip ({currentPillar})
              </div>
              <TimeEngineStrip
                skinPresetId={currentPresetId}
                pillar={currentPillar}
              />
            </StyleLabStack>
          </StyleLabSurface>

          {/* ActiveHUD */}
          <StyleLabSurface variant="card">
            <StyleLabStack spacing="md">
              <div className="text-lg font-semibold">
                ActiveHUD ({currentPillar})
              </div>
              <ActiveHUD
                skinPresetId={currentPresetId}
                pillar={currentPillar}
                secondsPerTimeUnit={1}
              />
            </StyleLabStack>
          </StyleLabSurface>

          {/* ActivityCapsule */}
          <StyleLabSurface variant="card">
            <StyleLabStack spacing="md">
              <div className="text-lg font-semibold">
                ActivityCapsule ({currentPillar})
              </div>
              <ActivityCapsule
                activityId="test-activity"
                label="Test Activity"
                slots={mockSlots}
                maxSlots={3}
                progressFraction={0.65}
                elapsedSeconds={45}
                totalDurationSeconds={120}
                status="in-progress"
                canCollect={false}
                pillar={currentPillar}
                compact={compact}
              />
            </StyleLabStack>
          </StyleLabSurface>

          {/* ActionHalo */}
          <StyleLabSurface variant="card">
            <StyleLabStack spacing="md">
              <div className="text-lg font-semibold">
                ActionHalo ({currentPillar})
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <ActionHalo
                  size={32}
                  iconText="JOB"
                  pillar={currentPillar}
                />
                <ActionHalo
                  size={48}
                  iconText="QUEST"
                  pillar={currentPillar}
                  enableBloom={motionLevel !== 'minimal'}
                />
                <ActionHalo
                  size={64}
                  iconText="SHOP"
                  pillar={currentPillar}
                  pulseIntensity={motionLevel === 'full' ? 0.8 : 0.4}
                />
              </div>
            </StyleLabStack>
          </StyleLabSurface>
        </StyleLabStack>

        {/* Telemetry Display */}
        {showTelemetry && (
          <StyleLabSurface variant="card">
            <StyleLabStack spacing="md">
              <div className="text-lg font-semibold">
                Telemetry Events
              </div>
              <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
                {telemetryEvents.length === 0 ? (
                  <div>No telemetry events captured yet</div>
                ) : (
                  telemetryEvents.map((event, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      [{new Date(event.timestamp).toISOString()}] {event.event}: {JSON.stringify(event.data)}
                    </div>
                  ))
                )}
              </div>
            </StyleLabStack>
          </StyleLabSurface>
        )}

        {/* Status Bar */}
        <StyleLabSurface variant="card">
          <StyleLabStack direction="horizontal" spacing="md" align="center">
            <div>
              <strong>Preset:</strong> {currentPresetId}
            </div>
            <div>
              <strong>Pillar:</strong> {currentPillar}
            </div>
            <div>
              <strong>Motion:</strong> {motionLevel}
            </div>
            <div>
              <strong>Components:</strong> 6 skin wrappers
            </div>
            {showTelemetry && (
              <div>
                <strong>Events:</strong> {telemetryEvents.length}
              </div>
            )}
          </StyleLabStack>
        </StyleLabSurface>
      </div>
    </StyleLabSurface>
  );
}

export default VerticalSliceTestSection;
