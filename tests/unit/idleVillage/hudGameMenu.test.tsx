import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { HudGameMenu } from '@/ui/idleVillage/components/gameFrame/HudGameMenu';
import { HUD_PANELS, HUD_PANEL_DEV_ONLY, type HudPanelId } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';

const trackTelemetryEvent = vi.fn();
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: (...args: unknown[]) => trackTelemetryEvent(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const visible = Object.fromEntries(HUD_PANELS.map((p) => [p.id, p.defaultVisible])) as Record<HudPanelId, boolean>;

const renderMenu = (props: Partial<Parameters<typeof HudGameMenu>[0]> = {}) =>
  render(<HudGameMenu visible={visible} onTogglePanel={vi.fn()} {...props} />);

describe('HudGameMenu', () => {
  beforeEach(() => trackTelemetryEvent.mockClear());

  it('opens the dropdown from the Menu button and closes it on Escape', async () => {
    renderMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(trackTelemetryEvent).toHaveBeenCalledWith('game_menu_toggle', { open: true });
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('lists non-dev panels as checkboxes wired to onTogglePanel', async () => {
    const onTogglePanel = vi.fn();
    renderMenu({ onTogglePanel });
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    const items = screen.getAllByRole('menuitemcheckbox');
    expect(items.map((i) => i.textContent)).toEqual(
      HUD_PANELS.filter((p) => !HUD_PANEL_DEV_ONLY.has(p.id)).map((p) => `gameFrame.panels.names.${p.id}${p.shortcut.toUpperCase()}`),
    );
    await userEvent.click(items[0]);
    expect(onTogglePanel).toHaveBeenCalledWith('roster');
  });

  it('includes dev panels only when includeDev is set', async () => {
    renderMenu({ includeDev: true });
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(HUD_PANELS.length);
  });

  it('runs the manual save and flashes the saved state', async () => {
    const onSaveNow = vi.fn().mockResolvedValue(true);
    renderMenu({ onSaveNow });
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'gameFrame.menu.saveNow' }));
    expect(onSaveNow).toHaveBeenCalledOnce();
    expect(await screen.findByRole('menuitem', { name: 'gameFrame.menu.saved' })).toBeInTheDocument();
    expect(trackTelemetryEvent).toHaveBeenCalledWith('game_menu_save_now', { success: true });
  });

  it('disables Save now when no save handler is provided', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    expect(screen.getByRole('menuitem', { name: 'gameFrame.menu.saveNow' })).toBeDisabled();
  });

  it('offers the comparable skins as radios wired to onChange', async () => {
    const onChange = vi.fn();
    renderMenu({ skin: { id: 'base', onChange } });
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    const radios = screen.getAllByRole('menuitemradio');
    expect(radios).toHaveLength(2);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(radios[1]);
    expect(onChange).toHaveBeenCalledWith('lacquer_atlas');
  });

  it('renders the future entries (load, quit, settings) disabled', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    for (const key of ['loadGame', 'quit', 'settings']) {
      expect(screen.getByRole('menuitem', { name: `gameFrame.menu.${key}` })).toBeDisabled();
    }
  });
});
