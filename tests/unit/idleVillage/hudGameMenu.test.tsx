import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { HudGameMenu } from '@/ui/idleVillage/components/gameFrame/HudGameMenu';
import { HUD_PANELS, HUD_PANEL_DEV_ONLY, HUD_PANEL_KEY_TO_ID, HUD_PANEL_UNLISTED, isHudPanelListed, type HudPanelId } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';

const trackTelemetryEvent = vi.fn();
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: (...args: unknown[]) => trackTelemetryEvent(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const setLocale = vi.fn();
let currentLocale = 'en';
vi.mock('@/hooks/useLocalization', () => ({
  useLocalization: () => ({ locale: currentLocale, setLocale }),
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
      HUD_PANELS.filter((p) => !HUD_PANEL_DEV_ONLY.has(p.id) && isHudPanelListed(p.id)).map((p) => `gameFrame.panels.names.${p.id}${p.shortcut.toUpperCase()}`),
    );
    await userEvent.click(items[0]);
    expect(onTogglePanel).toHaveBeenCalledWith('roster');
  });

  it('includes dev panels only when includeDev is set', async () => {
    renderMenu({ includeDev: true });
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(HUD_PANELS.filter((p) => isHudPanelListed(p.id)).length);
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

  it('keeps the dropdown items inside the data-hud-controls scope (pill controls, R-138)', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    const menu = screen.getByRole('menu');
    expect(menu.closest('[data-hud-controls]')).not.toBeNull();
  });

  it('offers EN and IT as language radios wired to setLocale', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    const group = screen.getByRole('radiogroup', { name: 'gameFrame.menu.language' });
    const radios = screen.getAllByRole('menuitemradio').filter((r) => group.contains(r));
    expect(radios.map((r) => r.textContent)).toEqual(['gameFrame.menu.languages.en', 'gameFrame.menu.languages.it-IT']);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(radios[1]);
    expect(setLocale).toHaveBeenCalledWith('it-IT');
    expect(trackTelemetryEvent).toHaveBeenCalledWith('game_menu_language_select', { locale: 'it-IT' });
  });

  // INV:R-234-menu-no-theme — the player's menu has no Theme section: the rejected Lacquer Atlas skin is
  // not offered in any build (Director 2026-10-21, DN-6). `?skin=` and the Director panel keep the comparison for dev.
  it('has no Theme section, even if a caller still passes a skin control', async () => {
    const onChange = vi.fn();
    renderMenu({ skin: { id: 'base', onChange } } as never);
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    expect(screen.queryByRole('radiogroup', { name: 'gameFrame.menu.theme' })).toBeNull();
    expect(screen.queryByText('gameFrame.menu.theme')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders the future entries (load, quit, settings) disabled', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.title' }));
    for (const key of ['loadGame', 'quit', 'settings']) {
      expect(screen.getByRole('menuitem', { name: `gameFrame.menu.${key}` })).toBeDisabled();
    }
  });
});

describe('unlisted panels (PLAN-043 T1.3, Director 2026-10-16)', () => {
  it('the quest window, the planner and the hero sheet have no menu entry and no key', () => {
    expect([...HUD_PANEL_UNLISTED].sort()).toEqual(['heroSheet', 'quest', 'questDetail']);
    expect(HUD_PANEL_KEY_TO_ID.q).toBeUndefined();
    expect(HUD_PANEL_KEY_TO_ID.p).toBeUndefined();
    /* WS-2: the planner is a stage-managed centerStage occupant — it opens
     *  from a POI click only, so `o` must not summon it either. */
    expect(HUD_PANEL_KEY_TO_ID.o).toBeUndefined();
  });
  it('every other panel keeps its key', () => {
    expect(HUD_PANEL_KEY_TO_ID.r).toBe('roster');
    expect(HUD_PANEL_KEY_TO_ID.e).toBe('events');
    expect(HUD_PANEL_KEY_TO_ID.v).toBe('villageStash');
    expect(HUD_PANEL_KEY_TO_ID.m).toBe('merchant');
  });
});
