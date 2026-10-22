/**
 * PLAN-067 T-B8 (R-234, INV-1 = B) — one item, three dresses (tray tile / stash row / merchant row)
 * with ONE engraved icon family: every catalog icon — emoji literals included — renders as an engraved
 * brass glyph, never as a coloured emoji, and the tray's selected tile is brass, not cyan.
 */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { VillageStashItemIcon } from '@/ui/idleVillage/components/gameFrame/villageStashItemIcons';

describe('item icons — one engraved family (R-234, INV-1)', () => {
  // INV:R-234-item-three-kits — every catalog icon (emoji included) is an engraved svg glyph; the
  // tray's selected tile never uses the cyan accent.
  it('renders every catalog icon as an engraved glyph, never as emoji text', () => {
    const icons = [...new Set(Object.values(defaultQuestItems).map((i) => i.icon))];
    expect(icons.length).toBeGreaterThan(5);
    for (const icon of icons) {
      const { container, unmount } = render(<VillageStashItemIcon icon={icon} size={20} />);
      expect(container.querySelector('svg'), `icon ${icon}`).not.toBeNull();
      expect((container.textContent ?? '').trim(), `icon ${icon}`).toBe('');
      unmount();
    }
  });

  it('the tray tile is brass when selected, not cyan', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../../src/ui/idleVillage/quests/QuestExpeditionDetail.tsx'), 'utf8');
    const tile = src.slice(src.indexOf('data-testid={`picker-item-${item.id}`}'), src.indexOf('<VillageStashItemIcon icon={item.icon} size={22} />'));
    expect(tile.length).toBeGreaterThan(100);
    expect(tile).not.toContain('TONE.accent');
  });
});
