/**
 * PLAN-071 T-B3 (R-239) — player-facing copy must read like language, not
 * engine shorthand.
 *
 * Video audit (Director, 2026-10-21):
 *  (a) choice `detail` stat labels carried a stray authored period
 *      («Strength.» — a label is not a sentence);
 *  (b) generated harm lines use a single neutral pronoun («their») — there is
 *      no authored gender per member, so consistency IS the contract;
 *  (c) the planner's downtime chip read «≈2.6d down» — engine shorthand, not
 *      readable copy;
 *  (d) quest-window chrome let the OS select text while dragging.
 *
 * Contract:
 * - `QuestOptionSchema.detail` rejects a bare stat label ending in a period
 *   (tokens joined by `+`/`or`/`o` are still a label); clause details stay
 *   legal;
 * - the authored scenarios carry no bare-label detail;
 * - the downtime chip is localized prose, not `≈…d …`;
 * - the quest plaque is `user-select: none`.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { QuestOptionSchema } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { GOBLIN_SCENARIO, GOBLIN_SCENARIO_AUTHORED } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { ROVINE_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/rovine';
import { createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';

/** The schema's label shape: bare tokens joined only by `+`/`or`/`o` + period. */
const BARE_LABEL_PERIOD = /^[\p{L}]+(?:\s*(?:\+|\bor\b|\bo\b)\s*[\p{L}]+)*\.\s*$/u;

const allDetails = (scenario: { nodes: Record<string, { options?: { detail?: string }[] }> }) =>
  Object.values(scenario.nodes).flatMap((n) => (n.options ?? []).map((o) => o.detail ?? ''));

describe('quest option detail — stat labels are labels, not sentences (R-239)', () => {
  // INV:R-239-stat-detail — the schema refuses a bare label with a period.
  it('rejects bare stat labels ending in a period', () => {
    for (const detail of ['Strength.', 'Agility.', 'Strength + Perception.', 'Intelligence or Perception.', 'Forza.']) {
      expect(QuestOptionSchema.safeParse({ id: 'o', label: 'x', detail, next: 'n' }).success, detail).toBe(false);
    }
  });

  it('still accepts bare labels and full clauses', () => {
    for (const detail of [
      'Strength',
      'Intelligence or Perception',
      'Lower your weapons.',
      'The trophy hits the dirt.',
      'Steel drawn.',
      '+1 day. Safer, and maybe richer.',
      'Strength. Always costs something — but the loot is yours.',
    ]) {
      expect(QuestOptionSchema.safeParse({ id: 'o', label: 'x', detail, next: 'n' }).success, detail).toBe(true);
    }
  });

  // INV:R-239-stat-detail — the authored scenarios carry no bare label with a
  // period (both the authored literal and the parsed scenario agree).
  it('authored goblin/rovine details are free of bare labels ending in a period', () => {
    for (const s of [GOBLIN_SCENARIO, ROVINE_SCENARIO]) {
      for (const d of allDetails(s)) {
        expect(BARE_LABEL_PERIOD.test(d.trim()), `"${d}"`).toBe(false);
      }
    }
    for (const d of allDetails(GOBLIN_SCENARIO_AUTHORED)) {
      expect(BARE_LABEL_PERIOD.test(d.trim()), `authored "${d}"`).toBe(false);
    }
  });
});

describe('planner forecast copy (R-239)', () => {
  // INV:R-239-forecast-copy — «≈2.6d down» becomes readable localized prose.
  it('downtime chip reads as prose with the unit spelled out', () => {
    const en = JSON.parse(readFileSync(join(process.cwd(), 'public/locales/en/idleVillage.json'), 'utf8'));
    const it_ = JSON.parse(readFileSync(join(process.cwd(), 'public/locales/it-IT/idleVillage.json'), 'utf8'));
    const enV = en.questExpedition.members.downtime as string;
    const itV = it_.questExpedition.members.downtime as string;
    expect(enV).not.toContain('≈');
    expect(enV).toContain('days');
    expect(itV).not.toContain('≈');
    expect(itV).toContain('giorni');
  });
});

describe('quest window chrome (R-239)', () => {
  // INV:R-239-chrome-select — dragging the window must not select text.
  it('the plaque is user-select: none', () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 42, 'goblin');
    render(
      <Tooltip.Provider>
        <QuestRunWindow
          run={run}
          phases={[emptyPhase(0)]}
          beats={GOBLIN_SCENARIO.beats}
          queuedBeats={[]}
          beatTiming={{ sceneMs: 60000, checkMs: 60000, harmMs: 60000, endMs: 60000, recapMs: 60000 }}
          title={GOBLIN_SCENARIO.title}
          flavour={GOBLIN_SCENARIO.flavour}
          artFor={() => undefined}
          time={{ progress: 0, label: 'Giorno 1 di 2' }}
          onChoose={() => undefined}
          armedFlags={new Set()}
          onToggleArmedFlag={() => undefined}
          onClose={() => undefined}
          anchor={{ left: 0, top: 0 }}
          widthPx={640}
          theaterAspect={2.9}
          tooltipLines={6}
        />
      </Tooltip.Provider>,
    );
    expect(screen.getByTestId('quest-window').style.userSelect).toBe('none');
  });
});
