/**
 * menuFlow — the pure decisions behind the menu screens (PLAN-076 T-5/T-6):
 * when leaving needs a question, which slot "Continua" resumes, when the title
 * screen shows. Kept free of React so each rule has one test.
 */
import type { SupportedLocale } from '@/localization/LocaleConfig';
import type { SaveSlotId, SaveSlotInfo } from '../../../state/gameSave';

/** Locales offered in the settings panel (same pair as the menu's language switch, R-138). */
export const MENU_LOCALES: readonly SupportedLocale[] = ['en', 'it-IT'];

/** Leave at once when nothing would be lost (the game has not moved on since the last save); ask otherwise. */
export function decideQuit({ unsaved }: { unsaved: boolean }): 'quit' | 'confirm' {
  return unsaved ? 'confirm' : 'quit';
}

/** The newest slot that can actually be loaded; null when there is none. */
export function pickContinueSlot(rows: readonly SaveSlotInfo[]): SaveSlotId | null {
  const valid = rows.filter((r) => r.state === 'ok');
  if (valid.length === 0) return null;
  return [...valid].sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))[0].slot;
}

/** One-shot session flag: 'show' = the next load shows the title; 'skip' = the next load does not (a reload the game asked for). */
const TITLE_FLAG_KEY = 'wanderlust_title_flag';

const storage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
};

/** Set just before leaving to the title: the next load shows the title screen, once. */
export function markShowTitle(): void {
  storage()?.setItem(TITLE_FLAG_KEY, 'show');
}

/** Set just before a reload the game asks for itself (loading a slot): the next load goes straight to the game, once. */
export function markSkipTitle(): void {
  storage()?.setItem(TITLE_FLAG_KEY, 'skip');
}

/** Reads and clears the flag; true when it asked for the title. */
export function consumeShowTitle(): boolean {
  const s = storage();
  const flag = s?.getItem(TITLE_FLAG_KEY);
  if (flag) s?.removeItem(TITLE_FLAG_KEY);
  return flag === 'show';
}

/**
 * The title shows after a quit, on every launch of the desktop app, and on
 * request (`?title=1`); a plain browser visit (dev, e2e, harness) goes
 * straight to the game; a reload the game asked for skips it once. Pure read —
 * `consumeShowTitle` clears the flag.
 */
export function shouldShowTitle({ search, tauri }: { search: string; tauri: boolean }): boolean {
  const flag = storage()?.getItem(TITLE_FLAG_KEY);
  if (flag === 'skip') return false;
  if (flag === 'show' || tauri) return true;
  return new URLSearchParams(search).get('title') === '1';
}

/** Leaves to the title: the page reloads so no game state stays in memory. */
export function quitToTitle(): void {
  markShowTitle();
  window.location.reload();
}
