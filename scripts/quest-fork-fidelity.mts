/**
 * PLAN-102 T-0(b) — fork-fidelity spike.
 * Plays the SAME scripted deterministic run on the goblin scenario twice:
 * questId 'goblin' (authored path, QUESTS registry) vs questId 'gen'
 * (ScenarioInstance fork — what the quest editor will produce).
 * Diff = the set of engine behaviors that key on state.questId and are
 * lost/silent in a fork. Output: JSON manifest to stdout.
 */
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { createScenarioInstance } from '@/ui/idleVillage/questS1Lab/questOffer';
import { applyChoice, availableOptions, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { QUESTS } from '@/ui/idleVillage/questS1Lab/questScenario';

const SEED = 7;
const MAX_STEPS = 400;

function play(state: QuestRunState): QuestRunState {
  for (let i = 0; i < MAX_STEPS; i++) {
    if (state.ended) break;
    const opts = availableOptions(state);
    const pick = opts.find((o) => !o.disabled);
    if (!pick) {
      if (state.frontier?.status === 'pending') { state = { ...state, frontier: { ...state.frontier, readyAt: 0 } }; continue; }
      break;
    }
    state = applyChoice(state, pick.id);
  }
  return state;
}

const preset = GOBLIN_PRESETS[0];
const authored = play(createRun({ party: { members: preset.members, gold: preset.gold, presetId: preset.id }, seed: SEED, questId: 'goblin' }));
const instance = createScenarioInstance(GOBLIN_SCENARIO, { dangerScale: 1, rewardScale: 1 } as never, 'goblin' as never);
const forked = play(createRun({ party: { members: preset.members, gold: preset.gold, presetId: preset.id }, seed: SEED, questId: 'gen', scenarioInstance: instance }));

function snap(s: QuestRunState) {
  return {
    ended: s.ended, outcome: s.outcome, nodeId: s.nodeId, xp: s.xp, gold: s.gold, days: s.days,
    bottinoOro: s.bottinoOro, flags: [...s.flags].sort(), loot: [...s.loot].sort(), info: [...s.info].sort(),
    alarm: s.alarm, objectiveDone: s.objectiveDone,
    party: s.party.map((m) => ({ id: m.id, hp: m.hp, wounded: m.wounded, dead: m.dead })),
    logTail: s.log.slice(-12).map((l: { text?: string }) => l.text),
    logLen: s.log.length,
  };
}
const a = snap(authored), b = snap(forked);
const diff: Record<string, { authored: unknown; forked: unknown }> = {};
for (const k of Object.keys(a) as (keyof typeof a)[]) {
  if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) diff[k] = { authored: a[k], forked: b[k] };
}
console.log(JSON.stringify({ seed: SEED, diff, fieldsIdentical: Object.keys(diff).length === 0 }, null, 1));
