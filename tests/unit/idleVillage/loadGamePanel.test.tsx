import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LoadGamePanel } from '@/ui/idleVillage/components/gameFrame/menu/LoadGamePanel';
import { captureGameSave, writeSlot, type SaveIO } from '@/ui/idleVillage/state/gameSave';
import { resetLastSaved } from '@/ui/idleVillage/state/gameSaveService';
import { GAMEPLAY_STORE_KEY } from '@/ui/idleVillage/store/gameplayStore';
import { INVASION_KEY } from '@/ui/idleVillage/components/gameFrame/questInitialState';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}|${JSON.stringify(opts)}` : key), i18n: { language: 'en' } }),
}));

function memoryIO(initial: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(initial));
  const io: SaveIO = {
    read: async (k) => (store.has(k) ? JSON.parse(JSON.stringify(store.get(k))) : null),
    write: async (k, v) => void store.set(k, JSON.parse(JSON.stringify(v))),
    clear: async (k) => void store.delete(k),
    listKeys: async () => [...store.keys()],
  };
  return { io, store };
}
const gameplay = (day: number, tick: number) => ({ metadata: { summary: { currentDay: day, gold: 5 } }, data: { currentTime: tick, residents: [{ name: 'Aldra', isHero: true }] } });

async function seed() {
  const m = memoryIO({ [GAMEPLAY_STORE_KEY]: gameplay(9, 50), [INVASION_KEY]: { stage: 1 } });
  await writeSlot('auto', await captureGameSave(m.io, () => 2000), m.io);
  await writeSlot('slot-1', await captureGameSave(m.io, () => 1000), m.io);
  m.store.set('wanderlust_save_slot-2', { garbage: true });
  m.store.set(GAMEPLAY_STORE_KEY, gameplay(14, 400)); // the world has moved on
  m.store.set(INVASION_KEY, { stage: 5 });
  return m;
}

describe('LoadGamePanel', () => {
  beforeEach(() => resetLastSaved());

  // INV:game-menu-screens.INV-1 — Load lists the four slots (auto, three manual) with their state; empty and damaged slots cannot be loaded
  it('lists every slot and only lets a valid one be loaded', async () => {
    const { io } = await seed();
    render(<LoadGamePanel io={io} inGame unsaved onClose={vi.fn()} onLoaded={vi.fn()} />);
    const rows = await screen.findAllByRole('radio');
    expect(rows).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'gameFrame.menu.load.loadAction' })).toBeEnabled();
    await userEvent.click(rows[2]); // damaged slot-2
    expect(screen.getByRole('button', { name: 'gameFrame.menu.load.loadAction' })).toBeDisabled();
    await userEvent.click(rows[3]); // empty slot-3
    expect(screen.getByRole('button', { name: 'gameFrame.menu.load.loadAction' })).toBeDisabled();
  });

  // INV:game-menu-screens.INV-2 — loading over a game with unsaved progress asks before replacing it; cancelling changes nothing
  it('asks before replacing unsaved progress and does nothing on cancel', async () => {
    const { io, store } = await seed();
    const onLoaded = vi.fn();
    render(<LoadGamePanel io={io} inGame unsaved currentDay={14} onClose={vi.fn()} onLoaded={onLoaded} />);
    await userEvent.click(await screen.findByRole('button', { name: 'gameFrame.menu.load.loadAction' }));
    expect(screen.getByText(/gameFrame.menu.load.replaceAsk/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.cancel' }));
    expect(store.get(INVASION_KEY)).toEqual({ stage: 5 });
    expect(onLoaded).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.load.loadAction' }));
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.load.replaceConfirm' }));
    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith('auto'));
    expect(store.get(INVASION_KEY)).toEqual({ stage: 1 });
  });

  it('loads straight away when there is nothing to lose', async () => {
    const { io, store } = await seed();
    const onLoaded = vi.fn();
    render(<LoadGamePanel io={io} inGame unsaved={false} onClose={vi.fn()} onLoaded={onLoaded} />);
    await userEvent.click(await screen.findByRole('button', { name: 'gameFrame.menu.load.loadAction' }));
    await waitFor(() => expect(onLoaded).toHaveBeenCalled());
    expect(store.get(INVASION_KEY)).toEqual({ stage: 1 });
  });

  // INV:game-menu-screens.INV-3 — deleting a save asks first
  it('asks before deleting a save', async () => {
    const { io } = await seed();
    render(<LoadGamePanel io={io} inGame={false} unsaved={false} onClose={vi.fn()} onLoaded={vi.fn()} />);
    await screen.findAllByRole('radio');
    await userEvent.click(screen.getByRole('button', { name: 'gameFrame.menu.load.deleteAction' }));
    const ask = screen.getByText(/gameFrame.menu.load.deleteAsk/).closest('div') as HTMLElement;
    await userEvent.click(within(ask.parentElement as HTMLElement).getByRole('button', { name: 'gameFrame.menu.cancel' }));
    expect(screen.queryByText(/gameFrame.menu.load.deleteAsk/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('closes with Escape', async () => {
    const { io } = await seed();
    const onClose = vi.fn();
    render(<LoadGamePanel io={io} inGame unsaved onClose={onClose} onLoaded={vi.fn()} />);
    await screen.findAllByRole('radio');
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
