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

const SHOW_TITLE_KEY = 'wanderlust_show_title';

const storage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
};

/** Set just before leaving to the title: the next load shows the title screen, once. */
export function markShowTitle(): void {
  storage()?.setItem(SHOW_TITLE_KEY, '1');
}

/** Reads and clears the flag. */
export function consumeShowTitle(): boolean {
  const s = storage();
  const set = s?.getItem(SHOW_TITLE_KEY) === '1';
  if (set) s?.removeItem(SHOW_TITLE_KEY);
  return set;
}

/**
 * The title shows after a quit, on every launch of the desktop app, and on
 * request (`?title=1`); a plain browser visit (dev, e2e, harness) goes
 * straight to the game. Pure read — `consumeShowTitle` clears the flag.
 */
export function shouldShowTitle({ search, tauri }: { search: string; tauri: boolean }): boolean {
  if (tauri) return true;
  if (new URLSearchParams(search).get('title') === '1') return true;
  return storage()?.getItem(SHOW_TITLE_KEY) === '1';
}

/** Leaves to the title: the page reloads so no game state stays in memory. */
export function quitToTitle(): void {
  markShowTitle();
  window.location.reload();
}
