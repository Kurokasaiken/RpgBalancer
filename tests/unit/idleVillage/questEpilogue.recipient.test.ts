/**
 * PLAN-067 T-C6 (R-234) — titles and diseases belong to a PERSON, not to the party.
 * The authored grant names its recipient (`recipient`); the return report resolves it to the
 * member(s) and each line carries the `memberId`, so the report can hang it on the right person.
 */
import { describe, expect, it } from 'vitest';
import { buildQuestEpilogue } from '@/ui/idleVillage/quests/questEpilogue';
import { createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { ScenarioEpilogueSchema } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';

const member = (id: string, role: 'leader' | 'member' | 'bodyguard', over: Record<string, unknown> = {}) =>
  ({ id, name: id.toUpperCase(), role, hp: 50, maxHp: 50, wounded: false, dead: false, stats: {}, ...over });

const run = (party: ReturnType<typeof member>[]): QuestRunState => {
  const r = createRun(GOBLIN_PRESETS[0].id, 7, 'goblin');
  Object.assign(r, { party, outcome: 'reward', ended: true, flags: [], loot: [], info: [], consumablesUsed: [] });
  return r;
};

const scenario = (epilogue: unknown) => ({ epilogue } as unknown as QuestScenario);

const lines = (r: QuestRunState, s: QuestScenario, id: 'titles' | 'diseases') =>
  buildQuestEpilogue(r, s).find((x) => x.id === id)?.lines ?? [];

describe('epilogue grants name their recipient (R-234, T-C6)', () => {
  // INV:R-234-epilogue-per-person — a title/disease is granted to a person: one line per
  // recipient, carrying that member's id; a grant with no recipient stays a party line.
  it('resolves leader / survivors / wounded recipients to member lines', () => {
    const r = run([member('ada', 'leader'), member('bo', 'member', { wounded: true }), member('cy', 'member', { dead: true })]);
    const s = scenario({
      titles: [{ label: 'Slayer', recipient: 'leader' }, { label: 'Veteran', recipient: 'survivors' }],
      diseases: [{ label: 'Fever', recipient: 'wounded' }, { label: 'Dread' }],
    });
    expect(lines(r, s, 'titles').map((l) => [l.text, l.memberId])).toEqual([
      ['Slayer', 'ada'], ['Veteran', 'ada'], ['Veteran', 'bo'],
    ]);
    expect(lines(r, s, 'diseases').map((l) => [l.text, l.memberId])).toEqual([['Fever', 'bo'], ['Dread', undefined]]);
  });

  it('the schema accepts recipients and the goblin title goes to the leader', () => {
    expect(ScenarioEpilogueSchema.safeParse({ titles: [{ label: 'x', recipient: 'leader' }] }).success).toBe(true);
    expect(ScenarioEpilogueSchema.safeParse({ titles: [{ label: 'x', recipient: 'nobody' }] }).success).toBe(false);
    expect(GOBLIN_SCENARIO.epilogue?.titles?.[0]).toMatchObject({ recipient: 'leader' });
  });
});
