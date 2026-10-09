/**
 * residentToQuestMember — the real-resident → quest-party adapter
 * (PLAN-019-S2.2 T-2, D-C/D-G).
 *
 * Pure, deterministic, no UI: reads `ResidentState` (the canonical roster
 * shape — `statSnapshot` is the merged `{...statBlock, ...overrides}` combat
 * block from `savedCharacterToResident`) and produces the `LabMember` the
 * quest engine consumes.
 *
 * Contract:
 * - Channels `str`/`con`/`perc`/`agi` derive from the REAL statSnapshot via
 *   `QUEST_MEMBER_STATS`; `int`/`cha` are declared mock channels in config.
 * - Run HP comes from the `runHp` row; wounded residents (`isInjured` or
 *   `currentHp < maxHp`) are admitted with proportionally reduced start HP —
 *   InjuryEngine exposes no numeric stat modifier (`injured.statPenalty`
 *   stays `null`, declared hook).
 * - Equipment does NOT feed stats: `statSnapshot` carries no equip bonus
 *   (FACT r2) — the adapter must be equip-invariant.
 * - `role` is a caller parameter (leader/member/bodyguard); slot→role
 *   mapping lives in S2.4.
 */

import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { deriveQuestStats, deriveRunHp, type QuestMemberStats, QUEST_MEMBER_STATS } from '@/balancing/config/idleVillage/quests/questMemberStats';
import type { LabMember } from './questScenario';

/**
 * Converts a roster resident into a quest-party member.
 * @param resident - Canonical resident (needs `statSnapshot`, `currentHp`,
 *   `maxHp`, `isInjured`, `displayName`).
 * @param role - Quest slot role (`leader` is the fixed first slot; `bodyguard`
 *   the optional interceptor).
 * @param config - Derivation table override (tests).
 * @returns `LabMember` with real-channel stats, run HP and portrait.
 */
export function residentToQuestMember(
  resident: Pick<ResidentState, 'id' | 'displayName' | 'statSnapshot' | 'currentHp' | 'maxHp' | 'isInjured'> &
    Partial<ResidentState>,
  role: LabMember['role'],
  config: QuestMemberStats = QUEST_MEMBER_STATS,
): LabMember {
  const snapshot = resident.statSnapshot ?? {};
  const stats = deriveQuestStats(snapshot, config);
  // The wounded rule reads currentHp/maxHp directly — `isInjured` with full
  // HP reduces nothing, a hurt-but-unflagged resident still scales down.
  const hp = deriveRunHp(snapshot, resident.currentHp, resident.maxHp, config);
  return {
    id: resident.id,
    name: resident.displayName,
    role,
    stats,
    hp,
    portrait: getResidentPortraitUrl(resident as ResidentState),
    ...(resident.traits?.length ? { traits: [...resident.traits] } : {}),
  };
}
