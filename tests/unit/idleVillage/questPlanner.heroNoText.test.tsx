/**
 * PLAN-067 T-B10 (R-234, POI-D = A) — the planner's hero image carries NO text.
 * Title above the image, dispatch line below it, the three seals (Danger / Reward / Duration)
 * in the right preview wing (audit F5: the title sat over the picture and the facts were
 * crammed into the compressed hero).
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { DndContext } from '@dnd-kit/core';
import { QuestExpeditionDetail } from '@/ui/idleVillage/quests/QuestExpeditionDetail';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const renderDetail = () => render(
  <Tooltip.Provider delayDuration={0}>
    <DndContext>
      <QuestExpeditionDetail
        poi={questPoiById('poi-goblin')!}
        scenario={GOBLIN_SCENARIO}
        resolved={null}
        resolvePending={false}
        slots={[]}
        estimate="computing"
        forecastDelta={null}
        intelHints={[]}
        expeditionDuration={{ nodeTicks: 50, estimatedTicks: 250, factor: 1 }}
        requiredFilled={false}
        items={[]}
        selectedItemIds={[]}
        onToggleItem={() => {}}
        onOpenStash={() => {}}
        canSend={false}
        onSend={() => {}}
        onClose={() => {}}
        onSlotClear={() => {}}
      />
    </DndContext>
  </Tooltip.Provider>,
);

describe('planner hero — image only (R-234, POI-D)', () => {
  // INV:R-234-planner-hero-no-text — no text node over the hero image; title above it, dispatch
  // below it, the seals in the forecast wing.
  it('keeps text off the image and puts the facts in the wing', () => {
    renderDetail();
    const hero = screen.getByTestId('quest-planner-hero');
    expect(hero.textContent?.trim() ?? '').toBe('');
    expect(hero.querySelector('h2, p')).toBeNull();
    const title = screen.getByTestId('quest-planner-title');
    expect(hero.contains(title)).toBe(false);
    expect(title.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const dispatch = screen.getByTestId('quest-planner-dispatch');
    expect(hero.contains(dispatch)).toBe(false);
    expect(hero.compareDocumentPosition(dispatch) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const wing = screen.getByTestId('quest-expedition-forecast-column');
    expect(wing.contains(screen.getByTestId('quest-planner-seals'))).toBe(true);
    expect(hero.contains(screen.getByTestId('quest-planner-seals'))).toBe(false);
  }, 30000);
});

describe('planner — key stats under the dispatch line, icons only (R-234, POI-D)', () => {
  // INV:R-234-planner-key-stats-icons — primary then secondary key stats sit under the dispatch
  // line as icons; the stat name is an accessible label, never visible text.
  it('shows primary and secondary stats as icons without names', () => {
    renderDetail();
    const row = screen.getByTestId('quest-planner-key-stats');
    expect(row.textContent?.trim() ?? '').toBe('');
    expect(row.querySelectorAll('svg').length).toBeGreaterThan(0);
    const dispatch = screen.getByTestId('quest-planner-dispatch');
    expect(dispatch.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId('quest-planner-key-stats-primary').querySelectorAll('[role="img"]').length)
      .toBeGreaterThan(0);
  }, 30000);
});
