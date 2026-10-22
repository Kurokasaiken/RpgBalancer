import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_GAME_SETTINGS,
  GAME_SETTINGS_KEY,
  getGameSettings,
  hydrateGameSettings,
  resetGameSettings,
  setGameSettings,
  subscribeGameSettings,
  type SettingsIO,
} from '@/ui/idleVillage/state/gameSettings';
import { installAudioBus, effectsBusGain } from '@/ui/idleVillage/state/audioBus';

function memoryIO(initial: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(initial));
  const io: SettingsIO = {
    read: async (k) => (store.has(k) ? store.get(k) : null),
    write: async (k, v) => void store.set(k, JSON.parse(JSON.stringify(v))),
  };
  return { io, store };
}

describe('gameSettings', () => {
  beforeEach(() => {
    resetGameSettings();
    document.documentElement.removeAttribute('data-reduced-motion');
  });

  // INV:game-settings.INV-1 — levels stay within 0..1 and nonsense falls back to the defaults
  it('clamps levels and ignores invalid values', async () => {
    const { io } = memoryIO();
    setGameSettings({ master: 3, effects: -1, music: Number.NaN }, io);
    expect(getGameSettings()).toMatchObject({ master: 1, effects: 0, music: DEFAULT_GAME_SETTINGS.music });
  });

  // INV:game-settings.INV-2 — settings persist and come back after a reload; a damaged record falls back to the defaults
  it('persists and hydrates', async () => {
    const { io, store } = memoryIO();
    setGameSettings({ master: 0.4, reducedMotion: true }, io);
    await vi.waitFor(() => expect(store.get(GAME_SETTINGS_KEY)).toMatchObject({ master: 0.4, reducedMotion: true }));
    resetGameSettings();
    await hydrateGameSettings(io);
    expect(getGameSettings()).toMatchObject({ master: 0.4, reducedMotion: true });
    resetGameSettings();
    await hydrateGameSettings(memoryIO({ [GAME_SETTINGS_KEY]: { master: 'loud', effects: 9 } }).io);
    expect(getGameSettings()).toMatchObject({ master: DEFAULT_GAME_SETTINGS.master, effects: 1 });
  });

  it('notifies subscribers once per change', () => {
    const { io } = memoryIO();
    const spy = vi.fn();
    const off = subscribeGameSettings(spy);
    setGameSettings({ effects: 0.5 }, io);
    setGameSettings({ effects: 0.5 }, io);
    off();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // INV:game-settings.INV-4 — reduced motion is a document attribute the stylesheet answers to
  it('marks the document when motion is reduced', () => {
    const { io } = memoryIO();
    setGameSettings({ reducedMotion: true }, io);
    expect(document.documentElement.dataset.reducedMotion).toBe('true');
    setGameSettings({ reducedMotion: false }, io);
    expect(document.documentElement.dataset.reducedMotion).toBeUndefined();
  });
});

describe('audioBus', () => {
  beforeEach(() => resetGameSettings());

  class FakeGain {
    gain = { value: 1, setTargetAtTime: vi.fn((v: number) => void (this.gain.value = v)) };
    connected: unknown = null;
    connect(target: unknown) {
      this.connected = target;
    }
  }
  const created: FakeContext[] = [];
  class FakeContext {
    state = 'running';
    private real = { kind: 'real-destination' };
    currentTime = 0;
    constructor() {
      created.push(this);
    }
    get destination() {
      return this.real;
    }
    createGain() {
      return new FakeGain();
    }
  }

  // INV:game-settings.INV-3 — every AudioContext created after install routes through a master bus at master×effects, live, with no extra context
  it('routes every new context through one bus that follows the settings', () => {
    const win = { AudioContext: FakeContext } as unknown as Window & typeof globalThis;
    installAudioBus(win);
    installAudioBus(win); // idempotent
    const Ctx = (win as never as { AudioContext: new () => FakeContext }).AudioContext;
    const ctx = new Ctx();
    const dest = ctx.destination as unknown as FakeGain;
    expect(dest).toBeInstanceOf(FakeGain);
    expect(dest.connected).toEqual({ kind: 'real-destination' });
    expect(ctx.destination).toBe(dest); // one bus per context
    expect(created).toHaveLength(1); // the bus never makes a second context

    const { io } = memoryIO();
    setGameSettings({ master: 0.5, effects: 0.5 }, io);
    expect(dest.gain.value).toBeCloseTo(0.25);
    expect(effectsBusGain()).toBeCloseTo(0.25);
  });
});
