/**
 * Frozen Kits Barrel Export
 * 
 * Central export point for all certified frozen kits.
 * Import components from here to ensure you're using the certified,
 * contract-enforced versions with proper provider chains.
 * 
 * Usage:
 *   import { JobPOIStandalone } from '@/ui/idleVillage/frozen/kits';
 *   import { ClockWidget } from '@/ui/idleVillage/frozen/kits';
 */

// POI Kit
export {
  JobPOI,
  ActivityPOI,
  QuestPOI,
  DayNightPOI,
  GenericPoiSkin,
  DayNightPoiSkin,
  JobPOIStandalone,
  ActivityPOIStandalone,
  QuestPOIStandalone,
  PoiKitShell,
  POI_PROVIDER_CHAIN,
} from './poiKit';
export type { JobStatus, ActivityStatus, QuestStatus, QuestPOIPhase } from './poiKit';

// Clock Kit
export {
  ClockWidget,
  TimeEngineStrip,
  ClockWidgetStandalone,
  ClockKitShell,
  CLOCK_PROVIDER_CHAIN,
} from './clockKit';
export type { ClockWidgetProps } from './clockKit';

// Roster Kit
export {
  RosterDraggable,
  VillageRosterSection,
  RosterKitShell,
} from './rosterKit';

// Slot Rack Kit
export {
  ResidentSlotRack,
  SlotRackKitShell,
} from './slotRackKit';

// Destiny Astrolabe Kit
export {
  DestinyAstrolabeStandalone,
  DESTINY_ASTROLABE_PROVIDER_CHAIN,
} from './destinyAstrolabeKit';

// World Surface Kit (draft) — mappa multi-layer full-canvas, pixel-perfect
export {
  WorldSurfaceStandalone,
  WorldSurfaceRenderer,
  useWorldSurface,
  WANDERLUST_BASE_MANIFEST,
  WORLD_SURFACE_PROVIDER_CHAIN,
} from './worldSurfaceKit';
export type { WorldSurfaceStandaloneProps } from './worldSurfaceKit';

// Draft Kits (not yet certified, but available for use)
export {
  ResourcePanelStandalone,
  ResourceHudKitShell,
  RESOURCE_HUD_PROVIDER_CHAIN,
} from './resourceHudKit';

export {
  QuestCardStandalone,
  QuestCardKitShell,
  QUEST_CARD_PROVIDER_CHAIN,
} from './questCardKit';

export {
  OutcomeKitShell,
} from './outcomeKit';

export {
  MarketKitShell,
} from './marketKit';

export {
  IntegrationQuestFlowKitShell,
} from './integrationQuestFlowKit';

export {
  SkillCheckComponentStandalone,
  SkillCheckKitShell,
  SKILL_CHECK_PROVIDER_CHAIN,
} from './skillCheckKit';

export {
  ActiveHUDStandalone,
  ActiveHudKitShell,
} from './activeHudKit';

export {
  ActivityCapsuleStandalone,
  ActivityCapsuleKitShell,
} from './activityCapsuleKit';

export {
  SlottedMedalStandalone,
  SlottedMedalKitShell,
} from './slottedMedalKit';

export {
  PgCardStandalone,
  PgCardKitShell,
} from './pgcardKit';

export {
  JobDetailKitShell,
} from './jobDetailKit';

export {
  LocationDetailKitShell,
} from './locationDetailKit';

// Registry
export { KIT_REGISTRY, getKitEntry, getContractEnforcedKits } from '../registry';
export type { KitStatus, KitHubMeta, KitRegistryEntry } from '../registry';
