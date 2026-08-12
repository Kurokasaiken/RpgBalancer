/**
 * questPoiKit
 *
 * Frozen re-export of the quest-POI system: the magic-circle halo that acts as
 * the quest timer, the milestone engine that fires one skill check per phase,
 * the milestone check modal, and the QuestChronicle card the outcome is read
 * from and collected in.
 *
 * These pieces belong to the POI family, not to one page: any POI whose
 * `cardKind` is `quest` can adopt the whole behaviour with a single import.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { MagicCircleHaloStandalone } from '@/ui/idleVillage/frozen/kits/questPoiKit';
 *
 * Reference: src/ui/idleVillage/pages/PoiDetailQuestRosterTimeClockIntegrationPage.tsx
 * (route /poi-quest-detail-roster-time-clock)
 */

import type { ComponentProps } from 'react';
import { MagicCircleHalo } from '@/ui/idleVillage/components/MagicCircleHalo';
import { MilestoneCheckModal } from '@/ui/idleVillage/components/MilestoneCheckModal';
import QuestChronicleComponent from '@/ui/idleVillage/components/QuestChronicle';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Canonical components — re-exported, not re-implemented.
export { MagicCircleHalo } from '@/ui/idleVillage/components/MagicCircleHalo';
export { MilestoneCheckModal } from '@/ui/idleVillage/components/MilestoneCheckModal';
export { default as QuestChronicle } from '@/ui/idleVillage/components/QuestChronicle';
export { FloatingPanel } from '@/ui/idleVillage/components/FloatingPanel';
export { QuestRewardPanel } from '@/ui/idleVillage/components/QuestRewardPanel';
export type { MagicCircleHaloProps } from '@/ui/idleVillage/components/MagicCircleHalo';
export type { MilestoneCheckModalProps } from '@/ui/idleVillage/components/MilestoneCheckModal';
export type { FloatingPanelProps } from '@/ui/idleVillage/components/FloatingPanel';
export type {
  QuestRewardPanelProps,
  QuestRewardPhaseLine,
  QuestRewardLine,
  QuestRewardPartyLine,
} from '@/ui/idleVillage/components/QuestRewardPanel';
export type {
  QuestChronicleProps,
  QuestChroniclePhase,
  QuestChronicleOutcome,
  PhaseVisualState,
} from '@/ui/idleVillage/components/QuestChronicle';

// Milestone timing: the hook plus the pure resolution helpers it feeds.
export {
  useMilestoneEngine,
  type MilestoneEvent,
  type UseMilestoneEngineOptions,
  type UseMilestoneEngineResult,
} from '@/ui/idleVillage/hooks/useMilestoneEngine';
export {
  buildQuestMilestones,
  buildAstrolabeSkillsForPhase,
  resolvePhaseStatTags,
  sumPartyStat,
  applyConsumableRiskEffects,
  resolveMilestoneWithoutAnimation,
  isPassingVerdict,
  type AstrolabeResultShape,
  type PhaseRiskChances,
} from '@/engine/game/idleVillage/questMilestones';

// Config surface: duration and difficulty are authored, never hardcoded.
export {
  questPhaseDurationMs,
  questTotalDurationMs,
  QuestTimeScaleSchema,
  DEFAULT_QUEST_TIME_SCALE,
  type QuestTimeScale,
} from '@/balancing/config/idleVillage/quests/questTimeScale';
export {
  resolvePhaseDifficulty,
  QuestSkillCheckConfigSchema,
  DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  type QuestSkillCheckConfig,
} from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
export {
  getMagicCircleHaloSkinForPreset,
  resolveMagicCircleHaloPresetId,
  defaultMagicCircleHaloConfig,
  type MagicCircleHaloConfig,
  type MagicCircleHaloSkinPresetConfig,
} from '@/ui/idleVillage/skins/magicCircleHaloSkinConfig';

/**
 * The halo and the card only need the skin system; the check modal mounts the
 * astrolabe, which needs nothing further.
 */
export const QUEST_POI_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider'];

/** Smart shell: mounts SkinSystemProvider only when absent above. */
export const QuestPoiKitShell = createKitShell(
  QUEST_POI_PROVIDER_CHAIN,
  'QuestPoiKitShell',
);

/** Drop-in variants: canonical components pre-wrapped in the smart shell. */
export const MagicCircleHaloStandalone = withKitShell<ComponentProps<typeof MagicCircleHalo>>(
  MagicCircleHalo,
  QUEST_POI_PROVIDER_CHAIN,
  'MagicCircleHaloStandalone',
);
export const MilestoneCheckModalStandalone = withKitShell<
  ComponentProps<typeof MilestoneCheckModal>
>(MilestoneCheckModal, QUEST_POI_PROVIDER_CHAIN, 'MilestoneCheckModalStandalone');
export const QuestChronicleStandalone = withKitShell<
  ComponentProps<typeof QuestChronicleComponent>
>(QuestChronicleComponent, QUEST_POI_PROVIDER_CHAIN, 'QuestChronicleStandalone');
