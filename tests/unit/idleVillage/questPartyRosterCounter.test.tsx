/**
 * PLAN-071 T-A7 (R-239) — the roster counter must not be an ambiguous «6/6».
 *
 * Video audit (Director, 2026-10-21): the party wing header reads a bare
 * «alive/total» fraction and the section title ellipsises to «COMPANI…» at
 * narrow widths — sighted players had no way to learn what the pair means
 * (aria-label alone is invisible). The counter and the truncated title now
 * carry the full `partyStatus`/`roster` copy on `title` too.
 *
 * INV:R-239-roster-counter
 *
 * Contract:
 * - the counter's `title` and `aria-label` resolve `partyStatus` (names the
 *   fraction as «alive of total standing»), never the raw pair;
 * - the ellipsisable section title exposes the full `roster` string.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { QuestPartyRosterPanel } from '@/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel';
import enIdleVillage from '../../../public/locales/en/idleVillage.json';

const partyStatusKey = 'gameFrame.questWindow.partyStatus';
const rosterKey = 'gameFrame.questWindow.roster';

describe('QuestPartyRosterPanel — counter semantics (R-239)', () => {
  // INV:R-239-roster-counter — the bare «alive/total» pair must carry the
  // resolved partyStatus copy on title+aria, and the ellipsisable section
  // title must expose the full roster string.
  it('the alive/total counter exposes the explicit partyStatus copy on title+aria', () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 7, 'goblin');
    const alive = run.party.filter((m) => !m.dead).length;
    const expected = enIdleVillage.gameFrame.questWindow.partyStatus
      .replace('{alive}', String(alive))
      .replace('{total}', String(run.party.length));
    const { container } = render(
      <QuestPartyRosterPanel panelId="p" run={run} onClose={vi.fn()} />,
    );
    const counter = container.querySelector(`[title="${expected}"]`);
    expect(counter, 'counter with resolved partyStatus title').not.toBeNull();
    expect(counter?.getAttribute('aria-label')).toBe(expected);
    expect(counter?.textContent).toBe(`${alive}/${run.party.length}`);
  });

  it('the ellipsisable section title carries the full roster string on title', () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 11, 'goblin');
    const { container } = render(
      <QuestPartyRosterPanel panelId="p" run={run} onClose={vi.fn()} />,
    );
    const roster = enIdleVillage.gameFrame.questWindow.roster;
    const title = [...container.querySelectorAll('span[title]')].find((el) => el.textContent === roster);
    expect(title, 'title span carrying the full roster label').toBeTruthy();
  });
});
