import type { ReactNode } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import DragTestContainer from './DragTestContainer';
import type { GetResidentCompatibility } from './ResidentRosterTypes';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { DropFeedbackHUD } from './DropFeedbackUI';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import { rendererStackInstrumentation } from '@/ui/idleVillage/utils/rendererStackInstrumentation';

/** Props for the ResidentRosterPanel component. */
export interface ResidentRosterPanelProps {
  residents: ResidentState[];
  onDragStart?: (residentId: string) => void;
  onDragEnd?: (residentId: string) => void;
  onResidentSelect?: (residentId: string) => void;
  assignmentFeedback?: string | null;
  isDayPhase?: boolean;
  getResidentCompatibility?: GetResidentCompatibility;
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
  /** Premium drag visual state for CardSocket */
  dragVisualState?: {
    mode: 'idle' | 'dragging' | 'flight';
    residentId?: string;
  };
  /** Optional additional controls to render in header */
  headerControls?: ReactNode;
  /** Use Wanderlust skin styling instead of default PgCard */
  useWanderlustSkin?: boolean;
}

/**
 * ResidentRosterPanel - Roster Component (CANONICAL VERSION)
 * 
 * A streamlined roster wrapper that provides drag-and-drop functionality for resident cards.
 * This component represents the canonical design after post-freeze optimizations.
 * 
 * CANONICAL DESIGN (Post-Freeze Optimizations):
 * - Streamlined layout: Removed unnecessary div wrappers for cleaner DOM
 * - Inline header: All header elements (title, count, filters) on single line
 * - Drag handle: GripVertical icon for sortable roster dragging
 * - Compact filters: Only dropdown filter, removed quick filter buttons
 * - Optimized spacing: Minimal gaps and padding for compact display
 * 
 * Header Structure (Inline Layout):
 * ┌─────────────────────────────────────────────────┐
 * │ [⋮⋮] Roster 3/3 [Filtro ▼] [👁] [Collapse ▼]      │
 * └─────────────────────────────────────────────────┘
 * 
 * Key Changes After Freeze:
 * - Removed "Tutti", "Eroi", "Feriti" quick filter buttons
 * - Added GripVertical drag handle for sortable functionality
 * - Made all header elements inline with flex layout
 * - Reduced font sizes and spacing for compact display
 * - Streamlined DOM structure with fewer nested divs
 * 
 * @component
 * @example
 * ```tsx
 * <ResidentRosterPanel
 *   residents={rosterResidents}
 *   componentId="roster-component"
 *   cardVariant="horizontal"
 *   layout="inline"
 *   onResidentSelect={handleSelect}
 * />
 * ```
 */
export function ResidentRosterPanel({
  residents,
  onDragStart,
  onDragEnd,
  onResidentSelect,
  assignmentFeedback,
  isDayPhase = true,
  getResidentCompatibility,
  validationResults = [],
  showHUDSignals = false,
  cardVariant = 'vertical',
  componentId,
  pgCardSkinId,
  pillar,
  context,
  dragVisualState,
  headerControls,
  useWanderlustSkin = false,
}: ResidentRosterPanelProps) {
  // Instrument renderer stack at ResidentRosterPanel level
  rendererStackInstrumentation.captureResidentRosterPanel(residents);
  
  return (
    <section
      data-testid="resident-roster-panel"
      className="p-4"
    >
      <DragTestContainer
        residents={residents}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onResidentSelect={onResidentSelect}
        isDayPhase={isDayPhase}
        getResidentCompatibility={getResidentCompatibility}
        cardVariant={cardVariant}
        dragVisualState={dragVisualState}
        headerControls={headerControls}
        useWanderlustSkin={useWanderlustSkin}
      />

      {assignmentFeedback && (
        <div className="mt-3 text-center text-sm text-amber-200">
          {assignmentFeedback}
        </div>
      )}

      {/* Drop Feedback HUD */}
      <DropFeedbackHUD
        validationResults={validationResults}
        showSignals={showHUDSignals}
      />
    </section>
  );
}

/**
 * CANONICAL VERSION NOTES:
 * 
 * This version of ResidentRosterPanel is frozen and represents the canonical design
 * after post-freeze optimizations for minimal, compact roster display.
 * 
 * Key frozen characteristics:
 * - Streamlined DOM with minimal div nesting
 * - Inline header layout with all controls on single line
 * - GripVertical drag handle for sortable functionality
 * - Dropdown-only filter (removed quick filter buttons)
 * - Compact text sizes: text-[8px] for labels, text-[7px] for options
 * - Optimized spacing: gap-2 between header elements
 * 
 * Header Elements (Inline):
 * - Drag handle: GripVertical icon (w-3 h-3)
 * - Title: "Roster" text-[8px] uppercase
 * - Count: "3/3" text-amber-100
 * - Filter: Dropdown with "Tutti", "Eroi", "Feriti", etc.
 * - Controls: Eye toggle, collapse button
 * 
 * Usage Pattern:
 * - Use with layout="inline" for compact roster display
 * - Provide componentId for sortable drag functionality
 * - Use cardVariant="horizontal" for compact resident cards
 * - Filters automatically update resident display
 * 
 * @version 1.1.0 (CANONICAL - Post-Freeze Optimizations)
 * @component
 */

export default ResidentRosterPanel;
