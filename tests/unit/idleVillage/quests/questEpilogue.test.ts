/**
 * PLAN-019-S4 T-2 — questEpilogue: il rapporto di ritorno deriva dai dati
 * reali (run + settlement plan), mai da una seconda derivazione:
 * sezioni ordinate da config, mostrate solo quando non vuote; seam
 * authored `epilogue` (titoli/malattie/lore) concessi da flag/outcome.
 */
import { describe, expect, it } from 'vitest';
import { buildQuestEpilogue } from '@/ui/idleVillage/quests/questEpilogue';
import { useHealing, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { parseQuestScenario, type QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';

function terminalRun(over: Partial<QuestRunState>): QuestRunState {
  return {
    seed: 7,
    rngCalls: 0,
    questId: 'goblin',
    presetId: 'test',
    nodeId: 'gob-end',
    party: [
      { id: 'hero-leader', name: 'Aldo', stats: {}, role: 'leader', hp: 40, maxHp: 100, wounded: false, dead: false },
      { id: 'hero-member', name: 'Bruna', stats: {}, role: 'member', hp: 10, maxHp: 60, wounded: true, dead: false },
      { id: 'hero-guard', name: 'Ciro', stats: {}, role: 'bodyguard', hp: 0, maxHp: 80, wounded: false, dead: true },
    ],
    gold: 15,
    days: 1,
    bottinoOro: 0,
    loot: ['trofeo dei goblin'],
    info: ['mappaRovine'],
    flags: [],
    alarm: false,
    objectiveDone: true,
    ended: true,
    outcome: 'reward',
    lastEvent: '',
    checkQueue: [],
    log: [],
    combatTurn: 0,
    goblinLeft: 0,
    exploreTurn: 0,
    xp: 3,
    engineSchemaVersion: 2,
    frontierVersion: 1,
    frontier: { status: 'waiting', startedAt: 0, readyAt: 0 },
    nodeTicks: 10,
    visitedNodes: ['gob-end'],
    scenarioInstanceId: 'qsi-test-1',
    launchedAtTick: 100,
    resolvedOffer: {
      offerSchemaVersion: 1,
      poiId: 'poi-goblin',
      questId: 'goblin',
      rewardResolved: 42,
      resolvedAtDay: 0,
    } as QuestRunState['resolvedOffer'],
    ...over,
  } as QuestRunState;
}

const sectionIds = (run: QuestRunState, scenario?: QuestScenario) =>
  buildQuestEpilogue(run, scenario).map((s) => s.id);

describe('buildQuestEpilogue', () => {
  it('reward: costo prima, resa dopo — ordine da config', () => {
    const sections = buildQuestEpilogue(terminalRun({}), GOBLIN_SCENARIO);
    const ids = sections.map((s) => s.id);
    expect(ids).toEqual(['dead', 'wounded', 'reward', 'loot', 'xp', 'info', 'titles', 'lore']);

    const dead = sections.find((s) => s.id === 'dead');
    expect(dead?.lines).toEqual([expect.objectContaining({ text: 'Ciro', memberId: 'hero-guard' })]);

    const wounded = sections.find((s) => s.id === 'wounded');
    expect(wounded?.lines).toEqual([expect.objectContaining({ text: 'Bruna', memberId: 'hero-member' })]);

    /* Reward vs loot split by the settlement effect key — the report and
     * the ledger can never disagree. */
    const reward = sections.find((s) => s.id === 'reward');
    expect(reward?.lines).toEqual([
      expect.objectContaining({ key: 'gameFrame.questEpilogue.goldAmount', params: { amount: 42 } }),
    ]);
    const loot = sections.find((s) => s.id === 'loot');
    expect(loot?.lines[0]).toEqual(
      expect.objectContaining({ key: 'gameFrame.questEpilogue.goldAmount', params: { amount: 15 } }),
    );
    expect(loot?.lines[1]).toEqual(expect.objectContaining({ text: 'trofeo dei goblin' }));
  });

  it('wipe: solo i caduti — niente economia, sezioni vuote filtrate', () => {
    const ids = sectionIds(
      terminalRun({
        outcome: 'wipe',
        objectiveDone: false,
        loot: [],
        gold: 0,
        xp: 0,
        info: [],
        party: [
          { id: 'hero-leader', name: 'Aldo', stats: {}, role: 'leader', hp: 0, maxHp: 100, wounded: false, dead: true },
        ],
      }),
      GOBLIN_SCENARIO,
    );
    expect(ids).toEqual(['dead']);
  });

  it('consumablesUsed: item catalogo via labelKey, flag ignoto mostrato raw', () => {
    const sections = buildQuestEpilogue(
      terminalRun({ consumablesUsed: ['hasFumogeno', 'bandiera-sconosciuta'] }),
    );
    const consumed = sections.find((s) => s.id === 'consumed');
    expect(consumed?.lines).toEqual([
      expect.objectContaining({ key: 'questS1Lab.item.smoke' }),
      expect.objectContaining({ text: 'bandiera-sconosciuta' }),
    ]);
  });

  it('info via intelLabels; id senza label resta raw', () => {
    const sections = buildQuestEpilogue(
      terminalRun({ info: ['mappaRovine', 'segnale-ignoto'] }),
      GOBLIN_SCENARIO,
    );
    const info = sections.find((s) => s.id === 'info');
    /* GOBLIN_SCENARIO has no intelLabels — both raw. With rovine's map the
     * first would resolve to its authored label (covered by rovine data). */
    expect(info?.lines.map((l) => l.text)).toEqual(['mappaRovine', 'segnale-ignoto']);
  });

  it('seam authored: titolo concesso su reward, nascosto su fled', () => {
    expect(sectionIds(terminalRun({}), GOBLIN_SCENARIO)).toContain('titles');
    expect(
      sectionIds(terminalRun({ outcome: 'fled', objectiveDone: false }), GOBLIN_SCENARIO),
    ).not.toContain('titles');
    /* Lore is granted on reward and survived alike. */
    expect(sectionIds(terminalRun({ outcome: 'survived' }), GOBLIN_SCENARIO)).toContain('lore');
  });

  it('grant requiresFlag: mostrato solo se il flag è sul run', () => {
    const scenario = parseQuestScenario({
      ...GOBLIN_SCENARIO,
      id: 'goblin',
      epilogue: {
        lore: [{ label: 'una cicatrice a forma di zanna', requiresFlag: 'cicatriceZanna' }],
      },
    });
    expect(sectionIds(terminalRun({}), scenario)).not.toContain('lore');
    expect(sectionIds(terminalRun({ flags: ['cicatriceZanna'] }), scenario)).toContain('lore');
  });
});

describe('consumablesUsed (record motore)', () => {
  it('useHealing spende il flag e lo registra', () => {
    const run = terminalRun({
      ended: false,
      outcome: 'running',
      nodeId: 'gob-esplora',
      flags: ['hasHealing'],
      party: [
        { id: 'hero-leader', name: 'Aldo', stats: {}, role: 'leader', hp: 20, maxHp: 100, wounded: true, dead: false },
      ],
    });
    const next = useHealing(run);
    expect(next.flags).not.toContain('hasHealing');
    expect(next.consumablesUsed).toEqual(['hasHealing']);
  });
});
