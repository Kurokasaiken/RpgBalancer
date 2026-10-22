/**
 * PLAN-067 T-B5 (R-234, HUD-1 = A) — a critical stock is an ember on a dark tile, not a solid
 * vermilion block. The tile keeps the dark surface and normal ink (contrast), and the danger tone
 * lives on its border and glow.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResourceReadout } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';

const item = (tone?: 'danger') => ({ id: 'food', icon: <i />, label: 'Food', value: 0, max: 20, detail: '−6/d', tone });

describe('ResourceReadout — critical tile (R-234, HUD-1)', () => {
  // INV:R-234-hud-food-ember — the critical tile is NOT filled with the danger colour: dark
  // surface, normal ink, danger on border + glow only.
  it('paints the danger on the border and glow, not as a fill', () => {
    render(<ResourceReadout items={[item('danger')]} />);
    const tile = screen.getByRole('group');
    expect(tile.style.background).not.toContain('skin-event-danger');
    expect(tile.style.background).toContain('--skin-surface-bg');
    expect(tile.style.color).toContain('--skin-text-primary');
    expect(tile.style.border).toContain('skin-event-danger');
    expect(tile.style.boxShadow).toContain('skin-event-danger');
  });

  it('a calm tile has no glow', () => {
    render(<ResourceReadout items={[item()]} />);
    expect(screen.getByRole('group').style.boxShadow).toBe('');
  });
});
