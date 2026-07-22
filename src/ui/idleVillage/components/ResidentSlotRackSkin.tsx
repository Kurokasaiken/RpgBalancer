/**
 * ResidentSlotRackSkin Component
 * 
 * Skin-aware wrapper for ResidentSlotRack that applies Style Lab tokens,
 * interaction physics, and SlottedMedal styling bridges.
 * 
 * @fileoverview
 * - Wraps ResidentSlotRack with skin-aware CSS custom properties
 * - Bridges interaction physics to Framer Motion animations
 * - Routes SlottedMedal styling through skin config
 * - Emits telemetry events for skin rendering
 * - Applies data attributes for CSS targeting
 * 
 * @see IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md §5.2
 * @see .windsurf/plans/style-lab-flexibility-1a9890.md
 */

import React, { memo, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import ResidentSlotRack, { type ResidentSlotRackProps } from './ResidentSlotRack';
import { useSkinPreferences, type UseSkinPreferencesResult } from '@/ui/idleVillage/hooks/useSkinPreferences';
import {
  DEFAULT_SLOT_RACK_PRESET_ID,
  getSlotRackSkinForPreset,
  resolveSlotRackPresetId,
  type SlotRackSkinConfig,
} from '@/ui/idleVillage/skins/slotRackSkinConfig';
import { trackSlotRackSkinRendered } from '@/ui/idleVillage/utils/telemetry/slotRackTelemetry';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';

/**
 * Props for the skin-aware wrapper
 */
export interface ResidentSlotRackSkinProps extends Omit<ResidentSlotRackProps, 'className'> {
  /** Optional skin preset override (uses preferences if not provided) */
  skinPresetId?: string;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing (defaults to resident-slot-rack-skin) */
  'data-testid'?: string;
}

/**
 * Skin-aware wrapper for ResidentSlotRack
 * 
 * Applies Style Lab tokens, interaction physics, and SlottedMedal styling
 * bridges to the base ResidentSlotRack component.
 */
export const ResidentSlotRackSkin = memo(({
  skinPresetId,
  className = '',
  'data-testid': testId = 'resident-slot-rack-skin',
  ...residentSlotRackProps
}: ResidentSlotRackSkinProps) => {
  const skinPreferences = useSkinPreferences();
  const styleLabTokens = useStyleLabTokens();
  
  // Determine active preset
  const activePresetId = skinPresetId || skinPreferences.presetId || DEFAULT_SLOT_RACK_PRESET_ID;
  const preferredPresetId = resolveSlotRackPresetId(activePresetId);
  const skinConfig = useMemo(() => getSlotRackSkinForPreset(preferredPresetId), [preferredPresetId]);
  
  // Extract halo/bloom tokens from Style Lab
  const interactionPhysics = styleLabTokens.preset.interactionPhysics || {
    shadowDepth: 8,
    mass: 1.0,
    damping: 0.15,
    stiffness: 100,
  };
  
  const materialFeel = (styleLabTokens.preset.materialFeel || {
    detail: 'subtle',
    bloom: 'moderate',
  }) as any;

  const hasAnimatedRef = useRef(false);
  const previousSkinIdRef = useRef<string | null>(null);
  if (skinConfig?.id !== previousSkinIdRef.current) {
    hasAnimatedRef.current = false;
    previousSkinIdRef.current = skinConfig?.id ?? null;
  }
  
  // Framer Motion animation config from interaction physics
  const motionConfig = useMemo(() => {
    if (!skinConfig) return {};

    const { interactionPhysics, rackMotion } = skinConfig;

    if (rackMotion && rackMotion.type === 'none') {
      hasAnimatedRef.current = true;
      return { initial: false };
    }

    const resolvedInitial = rackMotion?.initial ?? { opacity: 0, scale: 0.95 };
    const resolvedAnimate = rackMotion?.animate ?? { opacity: 1, scale: 1 };
    const resolvedTransition = (() => {
      if (rackMotion?.transition) return rackMotion.transition;
      if (rackMotion?.type === 'fade') {
        return { duration: 0.3, ease: 'easeOut' };
      }
      if (rackMotion?.type === 'spring' || !rackMotion) {
        return {
          type: 'spring' as const,
          mass: interactionPhysics.mass,
          damping: interactionPhysics.damping,
          stiffness: interactionPhysics.stiffness,
        };
      }
      return undefined;
    })();

    if (!hasAnimatedRef.current) {
      const baseConfig = {
        initial: { opacity: 0, scale: 0.95, y: '10px' },
        animate: { opacity: 1, scale: 1, y: '0px' },
        transition: { 
          type: 'spring', 
          stiffness: interactionPhysics.stiffness, 
          damping: interactionPhysics.damping, 
          mass: interactionPhysics.mass,
          ease: 'easeOut'
        },
      };
      
      // Add halo/bloom effects based on material feel
      if (materialFeel.bloom === 'strong') {
        return {
          ...baseConfig,
          animate: {
            ...baseConfig.animate,
            filter: `drop-shadow(0 0 ${interactionPhysics.shadowDepth}px rgba(255, 215, 0, 0.3))`,
          },
        };
      }
      
      return baseConfig;
    }

    return {
      initial: false,
      animate: resolvedAnimate,
    };
  }, [skinConfig, interactionPhysics, materialFeel]);
  
  // Emit telemetry event when skin config changes
  useEffect(() => {
    if (!skinConfig) return;

    trackSlotRackSkinRendered(
      skinConfig as any,
      residentSlotRackProps.slots.length,
      residentSlotRackProps.layout || 'board',
      'idle'
    );
  }, [skinConfig, activePresetId, skinPreferences.pillar, residentSlotRackProps.slots.length, residentSlotRackProps.layout]);
  
  // Generate CSS custom properties string for inline styles
  // The inner ResidentSlotRack root consumes these variables via rackShellStyle.
  const cssVarsString = useMemo(() => {
    if (!skinConfig) return {};

    const vars: Record<string, string> = {};
    Object.entries(skinConfig.cssVars).forEach(([key, value]) => {
      // Convert CSS custom property format to inline style format
      const styleKey = key.startsWith('--') ? key : `--${key}`;
      vars[styleKey] = value;
    });

    return vars;
  }, [skinConfig]);
  
  // Generate data attributes for CSS targeting
  const dataAttributes = useMemo(() => ({
    'data-slot-skin': skinConfig?.id ?? activePresetId,
    'data-skin-preset': preferredPresetId,
    'data-style-lab-pillar': skinPreferences.pillar || 'frontier',
    'data-testid': testId,
  }), [activePresetId, preferredPresetId, skinConfig?.id, skinPreferences.pillar, testId]);
  
  // Extract SlottedMedal styling from skin config
  const medalStyleConfig = useMemo(() => {
    if (!skinConfig) return undefined;
    return {
      skinPreset: skinConfig.medalStyle.defaultPreset,
      variants: skinConfig.medalStyle.variants,
      interactionPhysics: skinConfig.interactionPhysics,
    };
  }, [skinConfig]);
  
  // Enhanced slot props with skin-aware styling
  const enhancedSlotProps = useMemo(() => {
    if (!skinConfig) return residentSlotRackProps;
    
    return {
      ...residentSlotRackProps,
      // Pass medal styling through to SlottedMedal components
      medalStyleConfig,
      // Apply skin-aware CSS classes
      className: `resident-slot-rack-skin ${className}`.trim(),
    };
  }, [residentSlotRackProps, skinConfig, medalStyleConfig, className]);
  
  // Loading state
  if (skinPreferences.isLoading || !skinConfig) {
    return (
      <div 
        className="resident-slot-rack-skin loading"
        data-testid={testId}
        data-loading="true"
        style={{
          opacity: 0.5,
          transition: 'opacity 0.2s ease-out',
        }}
      >
        <ResidentSlotRack {...residentSlotRackProps} />
      </div>
    );
  }
  
  return (
    <motion.div
      className={`resident-slot-rack-skin ${activePresetId} ${className}`.trim()}
      style={cssVarsString}
      {...motionConfig}
      {...dataAttributes}
    >
      <ResidentSlotRack {...enhancedSlotProps} />
    </motion.div>
  );
});

ResidentSlotRackSkin.displayName = 'ResidentSlotRackSkin';

export default ResidentSlotRackSkin;
