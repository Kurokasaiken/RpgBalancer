/**
 * PLAN-067 T-A9 (R-234) — the bag/tray item tooltip stays inside the planner.
 * It is portalled (T-03: a portal does not know its host's edges) and used to
 * slide out over the roster from the tiles near the planner's left edge (audit
 * F5 §2). The tooltip now collides with the planner shell. jsdom has no
 * layout: the test pins the boundary handed to Radix; the harness witnesses
 * the rect.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { BagItemTooltip, PlannerBoundaryContext } from '@/ui/idleVillage/quests/QuestExpeditionDetail';

const contentProps: Array<Record<string, unknown>> = [];
vi.mock('@radix-ui/react-tooltip', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/react-tooltip')>();
  return {
    ...actual,
    Content: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
      contentProps.push(props);
      return <div data-testid="tooltip-content">{props.children}</div>;
    },
  };
});
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('planner item tooltip — boundary (R-234)', () => {
  // INV:R-234-planner-tooltip-inside — the planner's item tooltips collide with the planner
  // shell: they flip/shift inside it, never spilling over the roster or another panel.
  it('hands the planner shell to Radix as the collision boundary', () => {
    const item = Object.values(defaultQuestItems).find((i) => i.kind === 'consumable')!;
    const shell = document.createElement('div');
    document.body.appendChild(shell);
    render(
      <PlannerBoundaryContext.Provider value={{ current: shell }}>
        <Tooltip.Provider>
          <Tooltip.Root open>
            <Tooltip.Trigger>t</Tooltip.Trigger>
            <BagItemTooltip entry={{ item, qty: 2 } as never} />
          </Tooltip.Root>
        </Tooltip.Provider>
      </PlannerBoundaryContext.Provider>,
    );
    expect(contentProps.at(-1)?.collisionBoundary).toBe(shell);
  }, 30000);
});
