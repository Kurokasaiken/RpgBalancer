/**
 * Sentinel `geometry:small-target` (run sentinel-2026-10-23T0829, S3,
 * R-270) — registry section headers are interactive buttons and must not
 * measure below the 32px interactive minimum (they measured 24px:
 * LIST_BUTTON_RESET declares `height:auto` and the content is ~24px).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { VILLAGE_BUILDINGS_CONFIG } from '@/balancing/config/idleVillage/villageBuildingsConfig';
import { VillageRegistry } from '@/ui/idleVillage/components/gameFrame/VillageRegistry';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('VillageRegistry — section header hit area', () => {
  // INV:village-registry.INV-2 — section header buttons ≥ 32px tall.
  it('section headers declare a min-height of at least 32px', () => {
    render(
      <VillageRegistry
        open
        buildings={VILLAGE_BUILDINGS_CONFIG.buildings}
        activeId={null}
        onActiveChange={() => {}}
        onShowTooltip={() => {}}
      />,
    );
    const headers = [...document.querySelectorAll<HTMLElement>('[data-registry-section] > button[aria-expanded]')];
    expect(headers.length).toBeGreaterThan(0);
    for (const h of headers) {
      expect(parseFloat(h.style.minHeight)).toBeGreaterThanOrEqual(32);
    }
  });
});
