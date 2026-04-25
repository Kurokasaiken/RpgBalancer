import React from 'react';
import type { ReactNode } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { VillageRosterSection } from './VillageRosterSection';
import type { GetResidentCompatibility } from './ResidentRosterTypes';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { RosterSkinConfig } from '@/ui/idleVillage/skins/rosterSkinConfig';
import { createRosterSkinConfig } from '@/ui/idleVillage/skins/rosterSkinConfig';

/**
 * Props for the VillageRosterSectionSkin component
 */
export interface VillageRosterSectionSkinProps {
  residents: ResidentState[];
  assignmentFeedback?: string | null;
  onDragStart?: (residentId: string) => void;
  onDragEnd?: (residentId: string) => void;
  onResidentSelect?: (residentId: string) => void;
  isDayPhase?: boolean;
  getResidentCompatibility?: GetResidentCompatibility;
  /** Optional controls rendered above the roster panel */
  controls?: ReactNode;
  /** Component ID for sortable dragging */
  componentId?: string;
  /** Style Lab skin configuration for PgCard */
  pgCardSkinId?: string;
  /** Override pillar for skin variant (Wilderness/Empire) */
  pillar?: StyleLabPillar;
  /** Context for automatic pillar detection */
  context?: {
    locationType?: string;
    residentType?: string;
    scenarioType?: string;
  };
  /** Skin preset identifier */
  skinPresetId?: string;
  /** Custom skin configuration (overrides preset) */
  skinConfig?: Partial<RosterSkinConfig>;
}

/**
 * VillageRosterSectionSkin - Skin wrapper for VillageRosterSection
 * 
 * This component wraps the canonical VillageRosterSection with skin configuration
 * and telemetry. It applies CSS variables for styling and emits telemetry events
 * when the skin is rendered.
 * 
 * Features:
 * - Config-first skin system using registry tokens
 * - CSS variable application for dynamic styling
 * - Telemetry emission for skin rendering
 * - Forward all props to base component
 * - Support for custom skin configuration overrides
 * 
 * @component
 * @example
 * ```tsx
 * <VillageRosterSectionSkin
 *   residents={rosterResidents}
 *   componentId="roster-component"
 *   skinPresetId="minimal_frontier"
 *   pillar="frontier"
 *   onResidentSelect={handleRosterSelect}
 * />
 * ```
 */
export function VillageRosterSectionSkin({
  residents,
  assignmentFeedback,
  onDragStart,
  onDragEnd,
  onResidentSelect,
  isDayPhase = true,
  getResidentCompatibility,
  controls,
  componentId,
  pgCardSkinId,
  pillar,
  context,
  skinPresetId = 'minimal_frontier',
  skinConfig,
}: VillageRosterSectionSkinProps) {
  // Create skin configuration from preset and pillar
  const config = React.useMemo(() => 
    createRosterSkinConfig(skinPresetId, pillar || 'frontier'),
    [skinPresetId, pillar]
  );
  
  // Apply custom overrides if provided
  const finalConfig = React.useMemo(() => ({
    ...config,
    ...skinConfig,
  }), [config, skinConfig]);

  // Emit telemetry event when skin is rendered
  React.useEffect(() => {
    trackTelemetryEvent('village_roster_skin_rendered', {
      skinPresetId,
      pillar: finalConfig.pillar,
      componentTheme: finalConfig.componentTheme,
      residentCount: residents.length,
      componentId,
      hasControls: !!controls,
      hasAssignmentFeedback: !!assignmentFeedback,
      isDayPhase,
      context,
    });
  }, [
    skinPresetId,
    finalConfig.pillar,
    finalConfig.componentTheme,
    residents.length,
    componentId,
    controls,
    assignmentFeedback,
    isDayPhase,
    context,
  ]);

  // Apply CSS variables for skin styling
  const cssVariables = React.useMemo(() => {
    const vars: Record<string, string> = {};
    
    // Frame variables
    vars['--roster-border'] = `var(${finalConfig.frame.borderToken})`;
    vars['--roster-background'] = `var(${finalConfig.frame.backgroundToken})`;
    if (finalConfig.frame.shadowToken) {
      vars['--roster-shadow'] = `var(${finalConfig.frame.shadowToken})`;
    }
    vars['--roster-radius'] = `var(${finalConfig.frame.radiusToken})`;
    
    // Typography variables
    vars['--roster-heading-font'] = `var(${finalConfig.typography.headingToken})`;
    vars['--roster-body-font'] = `var(${finalConfig.typography.bodyToken})`;
    vars['--roster-caption-font'] = `var(${finalConfig.typography.captionToken})`;
    
    // Spacing variables
    vars['--roster-container-padding'] = `var(${finalConfig.spacing.containerPadding})`;
    vars['--roster-section-spacing'] = `var(${finalConfig.spacing.sectionSpacing})`;
    vars['--roster-item-spacing'] = `var(${finalConfig.spacing.itemSpacing})`;
    
    // Effects variables
    if (finalConfig.effects.glowToken) {
      vars['--roster-glow'] = `var(${finalConfig.effects.glowToken})`;
    }
    if (finalConfig.effects.hoverToken) {
      vars['--roster-hover'] = `var(${finalConfig.effects.hoverToken})`;
    }
    if (finalConfig.effects.focusToken) {
      vars['--roster-focus'] = `var(${finalConfig.effects.focusToken})`;
    }
    
    return vars;
  }, [finalConfig]);

  return (
    <section
      data-testid="village-roster-section-skin"
      data-skin-preset={skinPresetId}
      data-style-lab-pillar={finalConfig.pillar}
      data-component-theme={finalConfig.componentTheme}
      className="village-roster-section-skin"
      style={cssVariables}
    >
      <VillageRosterSection
        residents={residents}
        assignmentFeedback={assignmentFeedback}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onResidentSelect={onResidentSelect}
        isDayPhase={isDayPhase}
        getResidentCompatibility={getResidentCompatibility}
        controls={controls}
        componentId={componentId}
        pgCardSkinId={pgCardSkinId}
        pillar={pillar}
        context={context}
      />
    </section>
  );
}

export default VillageRosterSectionSkin;
