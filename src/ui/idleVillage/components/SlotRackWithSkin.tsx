/**
 * SlotRackWithSkin - Wrapper component that applies temporary skin to slot racks
 * and emits telemetry events for skin rendering
 */

import React, { useEffect, useMemo } from 'react';
import { SkinSlot } from './SkinSlot';
import { getTemporarySkinConfig } from '@/ui/idleVillage/skins/temporary/temporarySkinRegistry';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import SlotRackRenderer from '@/ui/idleVillage/skins/slotRack/SlotRackRenderer';

const SLOT_COMPONENT_BINDING = {
  componentId: 'SlotComponent',
  name: 'Resident Slot Wilderness Bronze',
  description: 'Temporary Wilderness Bronze slot skin wrapper',
  version: '1.0.0',
  defaultPreset: 'wanderlust' as const,
  supportedPillars: ['wilderness'] as const,
  supportedMotionLevels: ['minimal', 'reduced', 'full'] as const,
  cssClassBase: 'slot-v12',
  dataAttributePrefix: 'slot',
  supportsMotionLevel: true,
  supportsTelemetry: true,
  supportsPillarSwitching: false,
  category: 'slot',
  priority: 4,
  tags: ['slot', 'resident', 'temporary-skin'],
};

interface SlotRackWithSkinProps {
  children: React.ReactNode;
  skinId?: string;
  rackType?: 'A' | 'B' | 'detail';
  slotCount?: number;
}

export const SlotRackWithSkin: React.FC<SlotRackWithSkinProps> = ({
  children,
  skinId = 'slot_wilderness_bronze',
  rackType = 'A',
  slotCount = 6
}) => {
  // Get the temporary skin config
  const skinConfig = useMemo(() => {
    return getTemporarySkinConfig(skinId);
  }, [skinId]);

  // Emit telemetry when skin is rendered
  useEffect(() => {
    if (skinConfig) {
      trackTelemetryEvent('slot_skin_rendered', {
        skinId,
        rackType,
        slotCount,
        renderTimestamp: Date.now(),
        skinName: skinConfig.name,
        skinVersion: skinConfig.version,
        targetVersion: skinConfig.targetVersion
      });
    }
  }, [skinConfig, skinId, rackType, slotCount]);

  // If no skin config found, render children without skin
  if (!skinConfig) {
    console.warn(`SlotRackWithSkin: Skin config not found for ID "${skinId}"`);
    return <>{children}</>;
  }

  return (
    <SkinSlot binding={SLOT_COMPONENT_BINDING}>
      <div 
        className="slot-rack-with-skin-wrapper"
        data-skin-id={skinId}
        data-rack-type={rackType}
        data-slot-count={slotCount}
        style={{
          // Apply CSS vars from skin config without double margins
          ...(skinConfig.cssStyles ? { 
            backgroundColor: typeof skinConfig.colorTokens?.body_base === 'string' 
              ? skinConfig.colorTokens.body_base 
              : '#0c0a08',
            border: `2px solid ${typeof skinConfig.colorTokens?.bronze_mid === 'string' 
              ? skinConfig.colorTokens.bronze_mid 
              : '#3a2008'}`,
          } : {}),
        }}
      >
        {/* Render the slot rack renderer as background */}
        <SlotRackRenderer
          rackType={rackType}
          slotCount={slotCount}
          className="slot-rack-background"
        />
        
        {/* Render children (actual slots) overlay */}
        <div className="slot-rack-content-overlay">
          {children}
        </div>
      </div>
      {children}
    </SkinSlot>
  );
};

export default SlotRackWithSkin;
