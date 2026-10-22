/**
 * PLAN-067 T-B6 (R-234, HUD-2 = H1) — the MENU plaque is one of three top plaques of the same
 * family and height, and its button sits in the middle of it (audit F3: it hung short and the
 * label sat off-centre).
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HudGameMenu } from '@/ui/idleVillage/components/gameFrame/HudGameMenu';
import { HUD_PANELS, type HudPanelId } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/hooks/useLocalization', () => ({ useLocalization: () => ({ locale: 'en', setLocale: vi.fn() }) }));

const visible = Object.fromEntries(HUD_PANELS.map((p) => [p.id, p.defaultVisible])) as Record<HudPanelId, boolean>;

describe('HudGameMenu — plaque (R-234, HUD-2)', () => {
  // INV:R-234-hud-menu-centered — the plaque stretches to the row height and centres its button.
  it('fills the row and centres the button', () => {
    render(<HudGameMenu visible={visible} onTogglePanel={vi.fn()} />);
    const plaque = screen.getByRole('region', { name: 'gameFrame.menu.title' });
    const root = plaque.parentElement!;
    expect(root.style.display).toBe('flex');
    expect(plaque.style.flex).toMatch(/^1/);
    expect(plaque.style.justifyContent).toBe('center');
  });
});
