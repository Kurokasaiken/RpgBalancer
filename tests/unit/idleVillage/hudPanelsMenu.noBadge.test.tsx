/**
 * PLAN-067 T-B9 (R-234, DN-2) — the Panels button carries no number. The badge counted hidden panels
 * (a count nobody asked for, painted on a 40px icon); the Director's ruling is «remove it».
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HudPanelsMenu } from '@/ui/idleVillage/components/gameFrame/HudPanelsMenu';
import { HUD_PANELS, type HudPanelId } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('HudPanelsMenu trigger (R-234, DN-2)', () => {
  // INV:R-234-panels-no-badge — hidden panels do not paint a number on the button.
  it('has no badge even when panels are hidden', () => {
    const visible = Object.fromEntries(HUD_PANELS.map((p) => [p.id, false])) as Record<HudPanelId, boolean>;
    const { container } = render(<HudPanelsMenu visible={visible} onToggle={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: 'gameFrame.panels.title' });
    expect(container.querySelector('[data-badge]')).toBeNull();
    expect(trigger.textContent?.trim()).toBe('');
  });
});
