/**
 * Canonical Idle Village roster surface.
 * Import from this module whenever you need a resident list/roster UI.
 * 
 * This bundle provides the complete roster pipeline including:
 * - Data layer: CanonicalRosterBundle (resident data creation and management)
 * - UI components: VillageRosterSection, ResidentRosterPanel, etc.
 * - Drag & drop: DragProvider, CustomDragOverlay, FlightProxy
 * - Types: All component prop types
 * 
 * Based on the trusted roster baseline: roster_drag_trusted.md
 * Extracted from TestRosterPage to ensure functional parity across all pages.
 */

// Data layer
export { canonicalResidentData, useCanonicalRosterData, createResidentsById, useCanonicalRosterBundle } from './CanonicalRosterBundle';
export type { CanonicalRosterBundle } from './CanonicalRosterBundle';

// UI components
export { default as VillageRosterSection } from '@/ui/idleVillage/components/VillageRosterSection';
export { ResidentRosterPanel } from '@/ui/idleVillage/components/ResidentRosterPanel';
export { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
export { default as WanderlustRosterCard } from '@/ui/idleVillage/components/WanderlustRosterCard';
export { MatericRosterComponent } from '@/ui/idleVillage/components/MatericRosterComponent';

// Drag & drop components
export { DragProvider } from '@/ui/idleVillage/components/DragContext';
export { useDragContext } from '@/ui/idleVillage/components/DragContextStore';
export { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
export { FlightProxy } from '@/ui/idleVillage/components/FlightProxy';

// Component types
export type { VillageRosterSectionProps } from '@/ui/idleVillage/components/VillageRosterSection';
export type { ResidentRosterPanelProps } from '@/ui/idleVillage/components/ResidentRosterPanel';
export type { ResidentSlotRackProps } from '@/ui/idleVillage/components/ResidentSlotRack';
export type { WanderlustRosterCardProps } from '@/ui/idleVillage/components/WanderlustRosterCard';
export type { MatericRosterComponentProps } from '@/ui/idleVillage/components/MatericRosterComponent';
