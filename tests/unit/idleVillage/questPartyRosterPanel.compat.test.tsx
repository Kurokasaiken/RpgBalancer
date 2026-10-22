/**
 * R-241 B5 (INV:R-241-roster-status-only) — the quest's OWN party roster
 * (`quest-party-toggle` → `QuestPartyRosterPanel`) must paint resident
 * statuses only: away / injured / dead (greyed). No planner compatibility
 * strip — «Nessuno slot compatibile» has no meaning for members already
 * committed to the run.
 *
 * Bug record: `.mw/bugs/20261021-quest-run-window-five/bug.md` — the panel
 * rendered `PgCard` without `compatibilityState`, and `undefined !== 'idle'`
 * made every card paint the invalid planner label on top of its status.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { QuestPartyRosterPanel } from '@/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel';
import enIdleVillage from '../../../public/locales/en/idleVillage.json';

const statuses = enIdleVillage.roster.status as Record<string, string>;

describe('QuestPartyRosterPanel — R-241 B5: statuses, never planner compatibility', () => {
  // INV:R-241-roster-status-only — the quest party roster paints statuses
  // only; no planner compatibility strip on committed members.
  it('every card shows a status chip, no «Nessuno slot compatibile»', () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 7, 'goblin');
    const { container } = render(<QuestPartyRosterPanel panelId="p" run={run} onClose={vi.fn()} />);
    expect(container.textContent).not.toContain('Nessuno slot compatibile');
    expect(container.textContent).not.toContain('No compatible slots');
    expect(container.querySelector('[data-compatibility="invalid"]')).toBeNull();
    /* One status chip per member (away while the quest runs). */
    for (const m of run.party) {
      const key = m.dead ? 'dead' : m.wounded ? 'injured' : 'away';
      expect(container.textContent).toContain(statuses[key]);
    }
  });

  // INV:R-241-roster-status-only — dead member: greyed, status-only.
  it('a dead member renders greyed (disabled), still status-only', () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 7, 'goblin');
    run.party[0].dead = true;
    const { container } = render(<QuestPartyRosterPanel panelId="p" run={run} onClose={vi.fn()} />);
    const deadCard = container.querySelector('[data-drag-state="disabled"]');
    expect(deadCard, 'dead member card greyed via the disabled presentation').not.toBeNull();
    expect(deadCard?.getAttribute('aria-disabled')).toBe('true');
    expect(deadCard?.className).toContain('grayscale');
    expect(container.textContent).toContain(statuses.dead);
    expect(container.textContent).not.toContain('Nessuno slot compatibile');
  });
});
