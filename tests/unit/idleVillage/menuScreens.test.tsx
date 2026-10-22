import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { GameEntry } from '@/ui/idleVillage/components/gameFrame/menu/GameEntry';
import { SettingsPanel } from '@/ui/idleVillage/components/gameFrame/menu/SettingsPanel';
import { useGameMenuFlow } from '@/ui/idleVillage/components/gameFrame/menu/useGameMenuFlow';
import { captureGameSave, writeSlot, listSaves, type SaveIO } from '@/ui/idleVillage/state/gameSave';
import { resetLastSaved } from '@/ui/idleVillage/state/gameSaveService';
import { getGameSettings, resetGameSettings } from '@/ui/idleVillage/state/gameSettings';
import { GAMEPLAY_STORE_KEY } from '@/ui/idleVillage/store/gameplayStore';
import { INVASION_KEY } from '@/ui/idleVillage/components/gameFrame/questInitialState';

const quitToTitle = vi.fn();
vi.mock('@/ui/idleVillage/components/gameFrame/menu/menuFlow', async (importActual) => ({
  ...(await importActual<typeof import('@/ui/idleVillage/components/gameFrame/menu/menuFlow')>()),
  quitToTitle: () => quitToTitle(),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}|${JSON.stringify(opts)}` : key), i18n: { language: 'en' } }),
}));
const setLocale = vi.fn();
vi.mock('@/hooks/useLocalization', () => ({ useLocalization: () => ({ locale: 'en', setLocale }) }));

/** The app's real persistence in jsdom is localStorage (JSON strings): seed it through that door. */
const localIO: SaveIO = {
  read: async (k) => {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  },
  write: async (k, v) => void localStorage.setItem(k, JSON.stringify(v)),
  clear: async (k) => void localStorage.removeItem(k),
  listKeys: async () => Object.keys(localStorage),
};
const gameplay = (day: number, tick: number) => ({ metadata: { summary: { currentDay: day, gold: 1 } }, data: { currentTime: tick, residents: [] } });

async function seedWorld(day: number, tick: number, invasionStage: number) {
  localStorage.setItem(GAMEPLAY_STORE_KEY, JSON.stringify(gameplay(day, tick)));
  localStorage.setItem(INVASION_KEY, JSON.stringify({ stage: invasionStage }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetLastSaved();
  resetGameSettings();
  quitToTitle.mockClear();
  window.history.pushState({}, '', '/?title=1');
});

describe('GameEntry — title screen', () => {
  // INV:game-menu-screens.INV-7 — nothing of the game is mounted behind the title; «Continua» restores the newest save and then mounts the game
  it('keeps the game unmounted until a way in is picked, and Continua restores the newest save', async () => {
    await seedWorld(9, 50, 1);
    await writeSlot('slot-1', await captureGameSave(localIO, () => 100), localIO);
    await seedWorld(14, 400, 7); // the live world moved on after the save
    render(<GameEntry><div data-testid="game" /></GameEntry>);
    expect(screen.queryByTestId('game')).not.toBeInTheDocument();
    expect(screen.getByTestId('title-screen')).toBeInTheDocument();
    const cont = await screen.findByRole('button', { name: /titleScreen.continue/ });
    await waitFor(() => expect(cont).toBeEnabled());
    expect(cont.textContent).toContain('"day":9');
    await userEvent.click(cont);
    expect(await screen.findByTestId('game')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(INVASION_KEY)!)).toEqual({ stage: 1 });
  }, 20_000);

  it('hides Continua when there is nothing to continue and starts a new game without asking', async () => {
    render(<GameEntry><div data-testid="game" /></GameEntry>);
    await waitFor(() => expect(screen.getByRole('button', { name: 'gameFrame.menu.titleScreen.newGame' })).toBeEnabled());
    expect(screen.queryByRole('button', { name: /titleScreen.continue/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.titleScreen.newGame' }));
    expect(await screen.findByTestId('game')).toBeInTheDocument();
  });

  // INV:game-menu-screens.INV-8 — «Nuova partita» over existing progress asks first; it clears the world and the autosave slot and keeps the manual saves
  it('asks before a new game over progress, then clears the world and the autosave only', async () => {
    await seedWorld(9, 50, 1);
    await writeSlot('slot-1', await captureGameSave(localIO, () => 100), localIO);
    await writeSlot('auto', await captureGameSave(localIO, () => 200), localIO);
    render(<GameEntry><div data-testid="game" /></GameEntry>);
    await waitFor(() => expect(screen.getByRole('button', { name: 'gameFrame.menu.titleScreen.newGame' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.titleScreen.newGame' }));
    expect(screen.getByTestId('new-game-confirm')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.cancel' }));
    expect(localStorage.getItem(INVASION_KEY)).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.titleScreen.newGame' }));
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.newGame.confirm' }));
    expect(await screen.findByTestId('game')).toBeInTheDocument();
    expect(localStorage.getItem(INVASION_KEY)).toBeNull();
    const rows = await listSaves(localIO);
    expect(rows.find((r) => r.slot === 'auto')?.state).toBe('empty');
    expect(rows.find((r) => r.slot === 'slot-1')?.state).toBe('ok');
  });

  // INV:game-menu-screens.INV-9 — «Esci dal gioco» exists only in the desktop app
  it('has no «Esci dal gioco» outside the desktop app', async () => {
    render(<GameEntry><div /></GameEntry>);
    await screen.findByTestId('title-screen');
    expect(screen.queryByRole('button', { name: 'gameFrame.menu.titleScreen.exit' })).not.toBeInTheDocument();
  });
});

describe('SettingsPanel', () => {
  // INV:game-menu-screens.INV-10 — settings act at once; the music level has no row until /game has music
  it('changes audio and motion immediately, offers no music row, and restores defaults', async () => {
    render(<SettingsPanel onClose={vi.fn()} />);
    expect(screen.getAllByRole('slider').map((s) => s.getAttribute('aria-label'))).toEqual(['gameFrame.menu.settingsPanel.master', 'gameFrame.menu.settingsPanel.effects']);
    const master = screen.getByRole('slider', { name: 'gameFrame.menu.settingsPanel.master' });
    fireEvent.change(master, { target: { value: '95' } });
    expect(getGameSettings().master).toBeCloseTo(0.95);
    await userEvent.click(screen.getByRole('switch', { name: 'gameFrame.menu.settingsPanel.reducedMotion' }));
    expect(getGameSettings().reducedMotion).toBe(true);
    await userEvent.click(screen.getByRole('radio', { name: 'gameFrame.menu.languages.it-IT' }));
    expect(setLocale).toHaveBeenCalledWith('it-IT');
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.settingsPanel.reset' }));
    expect(getGameSettings()).toMatchObject({ master: 1, reducedMotion: false });
  });
});

describe('useGameMenuFlow — Esci al titolo', () => {
  const setup = (tick: number, flush = vi.fn(async () => true)) => {
    const hook = renderHook(({ t }) => useGameMenuFlow({ currentTick: t, currentDay: 14, flush }), { initialProps: { t: tick } });
    const view = () => render(<>{hook.result.current.screens}</>);
    return { hook, flush, view };
  };

  // INV:game-menu-screens.INV-11 — leaving with nothing to lose goes straight out; with unsaved progress it asks, and each answer does what it says
  it('quits at once when the game has not moved since the last save', async () => {
    await seedWorld(14, 0, 1);
    const { hook } = setup(0);
    act(() => hook.result.current.menuProps.onQuit());
    expect(quitToTitle).toHaveBeenCalledOnce();
  });

  it('asks when the game has moved, and «Esci senza salvare» writes nothing', async () => {
    const { hook } = setup(300);
    act(() => hook.result.current.menuProps.onQuit());
    expect(quitToTitle).not.toHaveBeenCalled();
    const { unmount } = render(<>{hook.result.current.screens}</>);
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.quitConfirm.quitNoSave' }));
    expect(quitToTitle).toHaveBeenCalledOnce();
    expect((await listSaves(localIO)).every((r) => r.state === 'empty')).toBe(true);
    unmount();
  });

  it('«Salva ed esci» saves into a manual slot and then leaves; «Annulla» stays', async () => {
    await seedWorld(14, 300, 1);
    const { hook, flush } = setup(300);
    act(() => hook.result.current.menuProps.onQuit());
    const first = render(<>{hook.result.current.screens}</>);
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.cancel' }));
    first.unmount();
    expect(quitToTitle).not.toHaveBeenCalled();
    act(() => hook.result.current.menuProps.onQuit());
    render(<>{hook.result.current.screens}</>);
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.quitConfirm.saveAndQuit' }));
    await waitFor(() => expect(quitToTitle).toHaveBeenCalledOnce());
    expect(flush).toHaveBeenCalled();
    expect((await listSaves(localIO)).find((r) => r.slot === 'slot-1')?.state).toBe('ok');
  });
});
