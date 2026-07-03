import type { ReactNode } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { ResidentRosterPanel } from './ResidentRosterPanel';
import type { GetResidentCompatibility } from './ResidentRosterTypes';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import { rendererStackInstrumentation } from '@/ui/idleVillage/utils/rendererStackInstrumentation';
import { RosterSortIcon } from './RosterSortIcon';
import type { RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import { DEFAULT_ROSTER_SORT_MODE, sortResidents } from '@/ui/idleVillage/config/rosterSortConfig';

/**
 * Props for the {@link VillageRosterSection} component.
 */
export interface VillageRosterSectionProps {
  residents: ResidentState[];
  assignmentFeedback?: string | null;
  onDragStart?: (residentId: string) => void;
  onDragEnd?: (residentId: string) => void;
  onResidentSelect?: (residentId: string) => void;
  isDayPhase?: boolean;
  getResidentCompatibility?: GetResidentCompatibility;
  /** Optional controls rendered above the roster panel */
  controls?: ReactNode;
  /** Validation results for recent drop operations */
  validationResults?: DropValidationResult[];
  /** Whether to show HUD signals */
  showHUDSignals?: boolean;
  /** Card visual variant */
  cardVariant?: 'horizontal' | 'vertical';
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
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Premium drag visual state for CardSocket */
  dragVisualState?: {
    mode: 'idle' | 'dragging' | 'flight';
    residentId?: string;
  };
  /** Current sort mode for roster */
  sortMode?: RosterSortMode;
  /** Callback when sort mode changes */
  onSortModeChange?: (mode: RosterSortMode) => void;
  /** Use Wanderlust skin styling instead of default PgCard */
  useWanderlustSkin?: boolean;
}

/**
 * VillageRosterSection - Roster Section Wrapper (CANONICAL VERSION)
 * 
 * A thin wrapper that provides config-first roster functionality for the MinimalGameplayPage.
 * This component represents the canonical design after post-freeze optimizations.
 * 
 * CANONICAL DESIGN (Post-Freeze Optimizations):
 * - Streamlined wrapper: Minimal DOM structure for roster display
 * - Config-first approach: All behavior wired through sandbox handlers
 * - Inline layout: Uses ResidentRosterPanel with inline layout by default
 * - Drag functionality: Full sortable support with componentId
 * - Compact display: Optimized for minimal gameplay interface
 * 
 * Integration in MinimalGameplayPage:
 * - Positioned after Time Engine controls
 * - Uses horizontal card variant for compact display
 * - Provides componentId for sortable roster dragging
 * - Handles resident selection for detail views
 * 
 * @component
 * @example
 * ```tsx
 * <VillageRosterSection
 *   residents={rosterResidents}
 *   componentId="roster-component"
 *   onResidentSelect={handleRosterSelect}
 *   getResidentCompatibility={() => undefined}
 * />
 * ```
 */
export function VillageRosterSection({
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
  dragVisualState,
  sortMode = DEFAULT_ROSTER_SORT_MODE,
  onSortModeChange,
  useWanderlustSkin = false,
}: VillageRosterSectionProps) {
  // Sort residents based on current sort mode
  const sortedResidents = sortResidents(residents, sortMode);
  
  // Instrument renderer stack at VillageRosterSection level
  rendererStackInstrumentation.captureVillageRosterSection(sortedResidents);
  
  // Create sort control
  const sortControl = onSortModeChange ? (
    <RosterSortIcon
      currentMode={sortMode}
      onSortModeChange={onSortModeChange}
    />
  ) : null;
  
  return (
    <section data-testid="village-roster-section" className="space-y-4">
      {/* Pass existing controls to ResidentRosterPanel */}
      {controls && (
        <div className="mb-2">
          {controls}
        </div>
      )}
      <ResidentRosterPanel
        residents={sortedResidents}
        assignmentFeedback={assignmentFeedback}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onResidentSelect={onResidentSelect}
        isDayPhase={isDayPhase}
        getResidentCompatibility={getResidentCompatibility}
        componentId={componentId}
        pgCardSkinId={pgCardSkinId}
        pillar={pillar}
        context={context}
        dragVisualState={dragVisualState}
        headerControls={sortControl}
        useWanderlustSkin={useWanderlustSkin}
      />
    </section>
  );
}

/**
 * CANONICAL VERSION NOTES:
 * 
 * This version of VillageRosterSection is frozen and represents the canonical design
 * for the MinimalGameplayPage integration after post-freeze optimizations.
 * 
 * Key frozen characteristics:
 * - Minimal wrapper: Simple section with optional controls and roster panel
 * - Config-first: All behavior delegated to ResidentRosterPanel
 * - Inline layout: Optimized for compact display in minimal gameplay
 * - Drag support: Full sortable functionality through componentId
 * - Clean integration: Seamless fit in MinimalGameplayPage layout
 * 
 * MinimalGameplayPage Integration:
 * - Positioned after Time Engine controls section
 * - Uses default inline layout for compact roster display
 * - Provides componentId="roster-component" for sortable dragging
 * - Handles resident selection for potential detail views
 * - No assignment feedback in minimal gameplay (undefined)
 * 
 * Usage Pattern:
 * - Use as direct child in MinimalGameplayPage
 * - Pass rosterResidents from MinimalGameplayPage state
 * - Provide componentId for drag-and-drop functionality
 * - Keep assignmentFeedback undefined for minimal gameplay
 * 
 * @version 1.1.0 (CANONICAL - Post-Freeze Optimizations)
 * @component
 */

export default VillageRosterSection;
