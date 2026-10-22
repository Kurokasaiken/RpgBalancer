/**
 * PLAN-067 T-C5 (R-234, DEATH-1 = B) — the Memoriale is one entry of the game menu and lists the fallen.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HudGameMenu } from '@/ui/idleVillage/components/gameFrame/HudGameMenu';
import { HUD_PANELS, type HudPanelId } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';
import { MemorialPanel } from '@/ui/idleVillage/components/gameFrame/menu/MemorialPanel';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (o && 'level' in o ? `${k}:${o.level}` : o && 'day' in o ? `${k}:${o.day}` : k) }),
}));
vi.mock('@/hooks/useLocalization', () => ({ useLocalization: () => ({ locale: 'en', setLocale: vi.fn() }) }));

const visible = Object.fromEntries(HUD_PANELS.map((p) => [p.id, p.defaultVisible])) as Record<HudPanelId, boolean>;

describe('Memoriale (R-234, T-C5)', () => {
  // INV:R-234-memorial-menu — the menu opens the Memoriale; the panel lists each fallen with name, level, place, day.
  it('is an enabled menu entry that calls onOpenMemorial', () => {
    const onOpenMemorial = vi.fn();
    render(<HudGameMenu visible={visible} onTogglePanel={vi.fn()} onOpenMemorial={onOpenMemorial} />);
    fireEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    const entry = screen.getByRole('menuitem', { name: 'gameFrame.menu.memorial' });
    expect(entry).not.toBeDisabled();
    fireEvent.click(entry);
    expect(onOpenMemorial).toHaveBeenCalledTimes(1);
  });

  it('lists every fallen entry, and an empty line when nobody fell', () => {
    useMinimalGameplayStore.setState({ memorial: [] });
    const { unmount } = render(<MemorialPanel onClose={() => {}} />);
    expect(screen.getByText('gameFrame.menu.memorialEmpty')).toBeInTheDocument();
    unmount();
    act(() => {
      useMinimalGameplayStore.setState({ memorial: [{ key: 'r:dead:0:h', name: 'Sir Spaccaculi', level: 3, place: 'Goblin', day: 41 }] });
    });
    render(<MemorialPanel onClose={() => {}} />);
    const rows = screen.getAllByTestId('memorial-entry');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Sir Spaccaculi');
    expect(rows[0].textContent).toContain('Goblin');
  });
});
