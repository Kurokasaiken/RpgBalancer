/**
 * SkinHarnessControls Component
 * 
 * Reusable control panel for skin harness functionality
 * Provides UI controls for preset/pillar switching, motion levels, and telemetry
 * Designed to be used in TestRosterPage and other test harness surfaces
 */

import React from 'react';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';
import { useSkinHarness, MOTION_LEVELS, type MotionLevel } from '@/ui/idleVillage/hooks/useSkinHarness';
import type { SkinPresetId } from '@/ui/idleVillage/skins/skinConfigRegistry';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';

export interface SkinHarnessControlsProps {
  /** Show preset switcher */
  showPresetSwitcher?: boolean;
  /** Show pillar switcher */
  showPillarSwitcher?: boolean;
  /** Show motion controls */
  showMotionControls?: boolean;
  /** Show telemetry controls */
  showTelemetryControls?: boolean;
  /** Compact mode for smaller viewports */
  compact?: boolean;
  /** Additional className */
  className?: string;
  /** Data-testid for testing */
  dataTestId?: string;
  /** Override initial values */
  initialPresetId?: SkinPresetId;
  initialPillar?: StyleLabPillar;
  initialMotionLevel?: MotionLevel;
  /** Enable telemetry by default */
  enableTelemetry?: boolean;
}

/**
 * SkinHarnessControls component
 */
export function SkinHarnessControls({
  showPresetSwitcher = true,
  showPillarSwitcher = true,
  showMotionControls = true,
  showTelemetryControls = true,
  compact = false,
  className = '',
  dataTestId = 'skin-harness-controls',
  initialPresetId,
  initialPillar,
  initialMotionLevel,
  enableTelemetry = true,
}: SkinHarnessControlsProps) {
  const {
    presetId: currentPresetId,
    pillar: currentPillar,
    motionLevel: currentMotionLevel,
    showTelemetry,
    telemetryEvents,
    isLoading,
    availablePresets,
    supportedPillars,
    setPreset,
    setPillar,
    setMotionLevel,
    toggleTelemetry,
    clearTelemetry,
    getDataAttributes,
  } = useSkinHarness({
    initialPresetId,
    initialPillar,
    initialMotionLevel,
    enableTelemetry,
  });

  if (isLoading) {
    return (
      <StyleLabSurface className={className} data-testid={dataTestId}>
        <div>Loading skin preferences...</div>
      </StyleLabSurface>
    );
  }

  return (
    <StyleLabSurface variant="card" className={className} data-testid={dataTestId}>
      <div {...getDataAttributes()}>
        <StyleLabStack spacing={compact ? 'sm' : 'md'}>
          {/* Header */}
          <div className="text-lg font-semibold" style={{ color: 'var(--minimal-text-primary)' }}>
            Skin Harness Controls
          </div>

          {/* Control Row */}
          <StyleLabStack direction="horizontal" spacing="md" align="center" wrap="wrap">
            {/* Preset Switcher */}
            {showPresetSwitcher && (
              <div>
                <label htmlFor="skin-preset-select" className="text-sm font-medium">
                  Preset:
                </label>
                <select
                  id="skin-preset-select"
                  value={currentPresetId}
                  onChange={(e) => setPreset(e.target.value as SkinPresetId)}
                  className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded"
                  data-testid="preset-selector"
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
                <label htmlFor="skin-pillar-select" className="text-sm font-medium">
                  Pillar:
                </label>
                <select
                  id="skin-pillar-select"
                  value={currentPillar}
                  onChange={(e) => setPillar(e.target.value as StyleLabPillar)}
                  className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded"
                  data-testid="pillar-selector"
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
                <label htmlFor="motion-level-select" className="text-sm font-medium">
                  Motion:
                </label>
                <select
                  id="motion-level-select"
                  value={currentMotionLevel}
                  onChange={(e) => setMotionLevel(e.target.value as MotionLevel)}
                  className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded"
                  data-testid="motion-selector"
                >
                  {MOTION_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Telemetry Controls */}
            {showTelemetryControls && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={showTelemetry}
                    onChange={toggleTelemetry}
                    className="mr-1"
                    data-testid="telemetry-toggle"
                  />
                  Show Telemetry
                </label>
                
                {showTelemetry && telemetryEvents.length > 0 && (
                  <button
                    onClick={clearTelemetry}
                    className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                    data-testid="clear-telemetry"
                  >
                    Clear ({telemetryEvents.length})
                  </button>
                )}
              </div>
            )}
          </StyleLabStack>

          {/* Current State Display */}
          {!compact && (
            <StyleLabSurface variant="card" className="text-xs">
              <div className="font-semibold mb-1">Current State:</div>
              <div className="space-y-1">
                <div>Preset: <span className="font-mono">{currentPresetId}</span></div>
                <div>Pillar: <span className="font-mono">{currentPillar}</span></div>
                <div>Motion: <span className="font-mono">{currentMotionLevel}</span></div>
                <div>Telemetry: <span className="font-mono">{showTelemetry ? 'ON' : 'OFF'}</span></div>
                {showTelemetry && (
                  <div>Events: <span className="font-mono">{telemetryEvents.length}</span></div>
                )}
              </div>
            </StyleLabSurface>
          )}

          {/* Telemetry Events Display */}
          {showTelemetry && telemetryEvents.length > 0 && !compact && (
            <StyleLabSurface variant="card">
              <div className="font-semibold text-sm mb-2">Recent Telemetry Events:</div>
              <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                {telemetryEvents.slice(-5).reverse().map((event, index) => (
                  <div key={index} className="font-mono border-b border-gray-200 pb-1">
                    <div className="font-semibold">{event.event}</div>
                    <div className="text-gray-600">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-gray-500 truncate">
                      {JSON.stringify(event.data, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            </StyleLabSurface>
          )}
        </StyleLabStack>
      </div>
    </StyleLabSurface>
  );
}

export default SkinHarnessControls;
