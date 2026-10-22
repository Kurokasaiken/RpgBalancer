import { beforeEach, describe, expect, it } from 'vitest';
import type { SaveSlotInfo } from '@/ui/idleVillage/state/gameSave';
import { consumeShowTitle, decideQuit, markShowTitle, pickContinueSlot, shouldShowTitle } from '@/ui/idleVillage/components/gameFrame/menu/menuFlow';

const row = (slot: SaveSlotInfo['slot'], state: SaveSlotInfo['state'], savedAt?: number): SaveSlotInfo => ({ slot, state, savedAt });

describe('menuFlow', () => {
  beforeEach(() => window.sessionStorage.clear());

  // INV:game-menu-screens.INV-4 — «Esci al titolo» leaves at once when nothing would be lost and asks only when the game has moved on since the last save
  it('quits straight away when there is nothing to lose, asks otherwise', () => {
    expect(decideQuit({ unsaved: false })).toBe('quit');
    expect(decideQuit({ unsaved: true })).toBe('confirm');
  });

  // INV:game-menu-screens.INV-5 — «Continua» resumes the newest valid slot; damaged or empty slots are never chosen
  it('continues from the newest valid slot', () => {
    const rows = [row('auto', 'ok', 30), row('slot-1', 'ok', 50), row('slot-2', 'corrupt'), row('slot-3', 'empty')];
    expect(pickContinueSlot(rows)).toBe('slot-1');
    expect(pickContinueSlot([row('auto', 'empty'), row('slot-1', 'corrupt')])).toBeNull();
    expect(pickContinueSlot([row('auto', 'newer-version', 99), row('slot-1', 'ok', 5)])).toBe('slot-1');
  });

  // INV:game-menu-screens.INV-6 — the title shows after a quit (once), in the desktop app and on request; a plain browser visit goes straight to the game
  it('decides when the title screen shows', () => {
    expect(shouldShowTitle({ search: '', tauri: false })).toBe(false);
    expect(shouldShowTitle({ search: '?title=1', tauri: false })).toBe(true);
    expect(shouldShowTitle({ search: '', tauri: true })).toBe(true);
    markShowTitle();
    expect(shouldShowTitle({ search: '', tauri: false })).toBe(true);
    expect(consumeShowTitle()).toBe(true);
    expect(shouldShowTitle({ search: '', tauri: false })).toBe(false);
  });
});
