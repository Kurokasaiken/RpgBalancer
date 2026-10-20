export { GameFrame, type GameFrameProps } from './GameFrame';
export { HudRibbon, type HudRibbonProps, type HudRibbonAnchor } from './HudRibbon';
export { HudEventLedger, type HudEventLedgerProps, type HudEvent, type HudEventSort } from './HudEventLedger';
export { ResourceReadout, type ResourceReadoutProps, type ResourceReadoutItem } from './ResourceReadout';
export { buildResourceReadoutItems } from './resourceReadoutItems';
export { HUD_TONE_COLOR, type HudTone } from './hudTones';
export { WhenWhereCluster, type WhenWhereClusterProps } from './WhenWhereCluster';
export { HudGlyph, HUD_ICONS, type HudGlyphProps, type HudIconId } from './hudIcons';
export { DirectorPanel, type DirectorPanelProps, type DirectorAction } from './DirectorPanel';
export { HudPanelsMenu, type HudPanelsMenuProps } from './HudPanelsMenu';
export { HudHideToggle, type HudHideToggleProps } from './HudHideToggle';
export { HudGameMenu, type HudGameMenuProps, type HudSkinControl } from './HudGameMenu';
export { useHudPanels, type HudPanelId, type HudPanelsApi } from './useHudPanels';
export { usePanelWhileOpen } from './usePanelWhileOpen';
export { HUD_PANELS } from './hudPanelRegistry';
export { ObjectiveCartouche, type HudObjective } from './ObjectiveCartouche';
export { RegionTooltip, type RegionTooltipProps } from './RegionTooltip';
export { TuningPanel, type TuningField, type TuningPanelProps } from './TuningPanel';
export { MapDemoPoi } from './MapDemoPoi';
export { usePoiTypeIcon, poiTypeIconUrl } from './usePoiTypeIcon';
export { QuestRunWindow, type QuestRunWindowProps } from './QuestRunWindow';
export { QuestJourneyRoute, type QuestJourneyRouteCanvas, type QuestJourneyRouteProps } from './QuestJourneyRoute';
export { QuestPartyRosterPanel, type QuestPartyRosterPanelProps } from './QuestPartyRosterPanel';
export { QuestBeltPlaque, type QuestBeltPlaqueProps } from './QuestBeltPlaque';
export { QuestLogPanel, type QuestLogPanelProps } from './QuestLogPanel';
export { QuestCheckOptionsPanel, type QuestCheckOptions, type QuestCheckOptionsPanelProps } from './QuestCheckOptionsPanel';
export { QuestRewardPopup, type QuestRewardPopupProps } from './QuestRewardPopup';
export { QuestOverlays, type QuestOverlaysProps, GAME_MODAL_ROOT_ID } from './questOverlays';
export { isTopmostOverlay, overlayStackSnapshot, useOverlayEscape } from './overlayStack';
export { QuestSkillCheckOverlay, type QuestSkillCheckOverlayProps } from './QuestSkillCheckOverlay';
export { resolveQuestShellLayout, type QuestShellLayout } from './questShellLayout';
export { HeroSheetPanel, type HeroSheetPanelProps } from './HeroSheetPanel';
export { VillageStashPanel, type VillageStashPanelProps } from './VillageStashPanel';
export { MapBuildingPoi, type MapBuildingPoiProps } from './MapBuildingPoi';
export { villageStashViewModel, resolveStashItemDescKey, type VillageStashViewModel } from './villageStashViewModel';
/* SP-3: `merchantConfig` is deliberately NOT re-exported — its isolation
 * boundary allows direct importers only (MerchantPanel, game-frame-pixi,
 * tests). */
export { MerchantPanel, type MerchantPanelProps } from './MerchantPanel';
export { MockBuyControl } from './MockBuyControl';
export { MerchantOfferIcon } from './merchantOfferIcons';
export { useHeroSheet, type HeroSheetApi, type UseHeroSheetOptions } from './useHeroSheet';
export { heroSheetReducer, HERO_SHEET_INITIAL_STATE } from './heroSheetMachine';
/* PLAN-043 WS-2 — three-zone stage (solver + reducer + provider surface). */
export {
  GameStageProvider,
  StagePanelEscape,
  StagePanelFrame,
  StageRejectedToast,
  StageStripsLayer,
  isStageManagedPanel,
  useGameStage,
  useGameStageZonesState,
  useStageOverlayEscape,
  useStagePanel,
  type GameStage,
  type GameStageApi,
  type StagePanelFrameProps,
} from './stageZones/useGameStageZones';
export { solveStageLayout, layoutSignature, dropTargetZone } from './stageZones/solveStageLayout';
export type { PanelResolution, StageLayout, StageOccupant, StagePanelId, StageRect, StageRegime, StageZoneId } from './stageZones/solveStageLayout';
export { heroSheetViewModel, type HeroSheetViewModel } from './heroSheetViewModel';
// PLAN-035 — the village view (full-area buildings screen on /game).
export { VillageScreenView, VILLAGE_TOOLTIP_ID, placeTooltip, type VillageScreenViewProps, type VillageScreenViewHandle, type TooltipPlacement, type TooltipSide } from './VillageScreenView';
export { MockUpgradeControl, type MockUpgradeControlProps } from './MockUpgradeControl';
export { VillageBuildingIcon, VillageCostIcon, type VillageBuildingIconProps } from './villageBuildingIcons';
