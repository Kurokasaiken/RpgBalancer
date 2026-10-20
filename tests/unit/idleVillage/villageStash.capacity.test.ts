/**
 * PLAN-067 T-A7 (R-234, DN-1: the Warehouse holds the items, its level sets
 * the room) — one capacity number. The stash panel said «7 OF 12 GOODS» while
 * the Warehouse tooltip promised «Storage capacity: 24 → 48» (audit F3 stash
 * §4): two literals for one fact. The panel's capacity is the Warehouse
 * tier's `effectValue` at the level the Village view shows.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VillageStashPanel } from '@/ui/idleVillage/components/gameFrame/VillageStashPanel';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { VILLAGE_BUILDINGS_CONFIG } from '@/balancing/config/idleVillage/villageBuildingsConfig';
import { villageStashViewModel } from '@/ui/idleVillage/components/gameFrame/villageStashViewModel';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('village stash — capacity has one source (R-234)', () => {
  // INV:R-234-stash-capacity-one-source — the stash panel's capacity equals the Warehouse
  // tier's storage capacity at the level the Village view shows; no second literal.
  it('panel capacity = Warehouse storage capacity at its current level', () => {
    const { buildings } = VILLAGE_BUILDINGS_CONFIG;
    const warehouse = buildings.find((b) => b.id === 'warehouse')!;
    const tooltipValue = warehouse.initialLevel > 0 ? warehouse.tiers[warehouse.initialLevel - 1].effectValue : 0;
    expect(villageStashViewModel(VILLAGE_STASH_CONFIG).capacityMax).toBe(tooltipValue);
  });
});

describe('village stash — stays inside its zone (R-234)', () => {
  // INV:R-234-stash-inside-zone — the panel never grows past the height of the zone the stage
  // solver gives it: the list scrolls inside, title and capacity footer stay on screen.
  it('caps its height at the zone height and scrolls the list inside', () => {
    render(
      React.createElement(VillageStashPanel, { config: VILLAGE_STASH_CONFIG, left: 0, top: 400, widthPx: 320, maxHeightPx: 380, zIndex: 12, onClose: () => {} }),
    );
    const panel = document.querySelector<HTMLElement>('[data-hud-panel="villageStash"]')!;
    expect(panel.style.maxHeight).toBe('380px');
    expect(getComputedStyle(screen.getByRole('list')).overflowY).toBe('auto');
  });
});
