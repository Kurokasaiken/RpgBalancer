import type { ReactNode } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { ResidentRosterPanelV2 } from './ResidentRosterPanelV2';
import type { GetResidentCompatibility } from '../components/ResidentRosterTypes';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import { rendererStackInstrumentation } from '@/ui/idleVillage/utils/rendererStackInstrumentation';
import { RosterSortIcon } from '../components/RosterSortIcon';
import type { RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import { DEFAULT_ROSTER_SORT_MODE, sortResidents } from '@/ui/idleVillage/config/rosterSortConfig';
import type { FilterCriterion } from '@/ui/idleVillage/config/rosterFilterConfig';
import { filterResidents } from '@/ui/idleVillage/config/rosterFilterConfig';

/**
 * Props for the {@link VillageRosterSectionV2} component.
 */
export interface VillageRosterSectionV2Props {
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
  dragVisualState?: DragVisualState;
  /** Current sort mode for roster */
  sortMode?: RosterSortMode;
  /** Callback when sort mode changes */
  onSortModeChange?: (mode: RosterSortMode) => void;
  /** Filter criteria for stat-based filtering */
  filterCriteria?: FilterCriterion[];
  /** Use Wanderlust skin styling instead of default PgCard */
  useWanderlustSkin?: boolean;
  /** Residents currently assigned elsewhere: shown as Away, non-interactive */
  lockedResidentIds?: string[];
  /** Status label for locked residents (default: 'Assigned') */
  lockedStatusLabel?: string;
  /** `compact` = one-line resident strips for HUD use. Default keeps the frozen layout. */
  density?: 'default' | 'compact';
  /** Close (X) button in the compact header. */
  onClose?: () => void;
}

type DragVisualState = {
  mode: 'idle' | 'dragging' | 'flight' | 'returning';
  residentId?: string;
};

/**
 * VillageRosterSectionV2 - Roster Section Wrapper (CANONICAL VERSION)
 * 
 * A thin wrapper that provides config-first roster functionality for the MinimalGameplayPage.
 * This component represents the canonical design after post-freeze optimizations.
 * 
 * CANONICAL DESIGN (Post-Freeze Optimizations):
 * - Streamlined wrapper: Minimal DOM structure for roster display
 * - Config-first approach: All behavior wired through sandbox handlers
 * - Inline layout: Uses ResidentRosterPanelV2 with inline layout by default
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
 * <VillageRosterSectionV2
 *   residents={rosterResidents}
 *   componentId="roster-component"
 *   onResidentSelect={handleRosterSelect}
 *   getResidentCompatibility={() => undefined}
 * />
 * ```
 */
export function VillageRosterSectionV2({
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
  filterCriteria = [],
  useWanderlustSkin = false,
  lockedResidentIds,
  lockedStatusLabel,
  density = 'default',
  onClose,
}: VillageRosterSectionV2Props) {
  // Apply filtering before sorting
  const filteredResidents = filterResidents(residents, filterCriteria);
  
  // Sort residents based on current sort mode
  const sortedResidents = sortResidents(filteredResidents, sortMode);
  
  // Instrument renderer stack at VillageRosterSectionV2 level
  rendererStackInstrumentation.captureVillageRosterSection(sortedResidents);
  
  // Create sort control
  const sortControl = onSortModeChange ? (
    <RosterSortIcon
      currentMode={sortMode}
      onSortModeChange={onSortModeChange}
    />
  ) : null;
  
  return (
    <section data-testid="village-roster-section" className={density === 'compact' ? 'space-y-2' : 'space-y-4'}>
      {/* Pass existing controls to ResidentRosterPanelV2 */}
      {controls && (
        <div className="mb-2">
          {controls}
        </div>
      )}
      <ResidentRosterPanelV2
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
        lockedResidentIds={lockedResidentIds}
        lockedStatusLabel={lockedStatusLabel}
        density={density}
        onClose={onClose}
      />
    </section>
  );
}

/**
 * CANONICAL VERSION NOTES:
 * 
 * This version of VillageRosterSectionV2 is frozen and represents the canonical design
 * for the MinimalGameplayPage integration after post-freeze optimizations.
 * 
 * Key frozen characteristics:
 * - Minimal wrapper: Simple section with optional controls and roster panel
 * - Config-first: All behavior delegated to ResidentRosterPanelV2
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

export default VillageRosterSectionV2;
