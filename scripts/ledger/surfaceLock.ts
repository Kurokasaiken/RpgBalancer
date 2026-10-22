/**
 * surfaceLock — derived surface reservations (PLAN-077 T-003).
 *
 * Locks are never a separate file: they are REBUILT from the journal.
 * Two event types carry them — `lock_acquired` / `lock_released` — and
 * the live set is the deterministic fold of:
 *
 *  - a `lock_acquired {item, attempt, token, surfaces[], files[]}` opens
 *    reservations on normalized keys (`surf:<id>` / `file:<path>`);
 *  - a `lock_released` with the same (item, attempt) closes matching keys;
 *    a release carrying a foreign `attempt_token` is journaled but inert
 *    (fencing — a superseded writer cannot free the successor's holds);
 *  - implicit release: a later `attempt_started` for the same item
 *    supersedes the attempt — its locks die with it;
 *  - terminal release: when the item reaches CLOSED / WITHDRAWN /
 *    BLOCKED_VERIFY_TERMINAL all its locks drop (never re-picked).
 *
 * AWAITING_DIRECTOR and BLOCKED_VERIFY KEEP the lock — the surface stays
 * reserved across the human wait and the retry budget (the exit paths are
 * confirmation, withdraw, or `surface-release --force`).
 */

import type { JournalRecord } from './ledgerCore';
import type { LedgerState } from './workItem';

export interface SurfaceLock {
  key: string; // 'surf:<id>' | 'file:<normalized-path>'
  kind: 'surface' | 'file';
  item_id: string;
  attempt_id: string;
  attempt_token: string;
  acquired_seq: number;
}

export interface LockConflict {
  key: string;
  held_by_item: string;
  held_by_attempt: string;
}

/** Normalize a declared key: surface ids stay ids, paths get cleaned. */
export function normalizeKey(raw: string, kind: 'surface' | 'file'): string {
  if (kind === 'surface') return `surf:${raw.trim()}`;
  const p = raw.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/{2,}/g, '/');
  return `file:${p}`;
}

/** All reservation keys an item's contract declares. */
export function keysFor(surfaces: string[], files: string[]): string[] {
  return [...surfaces.map((s) => normalizeKey(s, 'surface')), ...files.map((f) => normalizeKey(f, 'file'))];
}

const TERMINAL = new Set(['CLOSED', 'WITHDRAWN', 'BLOCKED_VERIFY_TERMINAL']);

/**
 * Rebuild the live lock set from the journal. Needs the item view to know
 * which attempts were superseded and which items are terminal — pass the
 * `deriveState(records)` output.
 */
export function deriveLocks(records: JournalRecord[], state: LedgerState): Map<string, SurfaceLock> {
  const locks = new Map<string, SurfaceLock>();

  // Attempt supersession index: an attempt dies when a LATER
  // attempt_started lands on the same item.
  const attemptAlive = new Map<string, { item: string; seq: number; token: string; alive: boolean }>();
  for (const rec of records) {
    if (rec.type !== 'attempt_started') continue;
    const p = rec.payload as { item_id: string; attempt_id: string; attempt_token: string };
    for (const [aid, a] of attemptAlive) {
      if (a.item === p.item_id && aid !== p.attempt_id) a.alive = false;
    }
    attemptAlive.set(`${p.item_id}/${p.attempt_id}`, { item: p.item_id, seq: rec.seq, token: p.attempt_token, alive: true });
  }

  const held = new Map<string, SurfaceLock[]>(); // item/attempt → its locks
  const heldKey = (item: string, attempt: string) => `${item}/${attempt}`;

  for (const rec of records) {
    const p = (rec.payload ?? {}) as Record<string, unknown>;
    if (rec.type === 'lock_acquired') {
      const item = p.item_id as string;
      const attempt = p.attempt_id as string;
      const token = p.attempt_token as string;
      const a = attemptAlive.get(`${item}/${attempt}`);
      // Fencing: the recorded token must be the attempt's real token —
      // otherwise this acquisition belongs to a stale/forged writer.
      if (!a || a.token !== token) continue;
      const keys = [
        ...((p.surfaces as string[]) ?? []).map((s) => normalizeKey(s, 'surface')),
        ...((p.files as string[]) ?? []).map((f) => normalizeKey(f, 'file')),
      ];
      const list = held.get(heldKey(item, attempt)) ?? [];
      for (const key of keys) {
        const l: SurfaceLock = {
          key,
          kind: key.startsWith('surf:') ? 'surface' : 'file',
          item_id: item,
          attempt_id: attempt,
          attempt_token: token,
          acquired_seq: rec.seq,
        };
        list.push(l);
        locks.set(key, l);
      }
      held.set(heldKey(item, attempt), list);
    } else if (rec.type === 'lock_released') {
      const item = p.item_id as string;
      const attempt = p.attempt_id as string;
      const token = p.attempt_token as string | undefined;
      const a = attemptAlive.get(`${item}/${attempt}`);
      // Fencing: a release must carry the holder's token (absent token on
      // old events is grandfathered only if the attempt is dead anyway —
      // force-releases go through `surface-release --force` = human act).
      if (a && a.alive && token !== undefined && token !== a.token) continue;
      const keys = p.keys as string[] | undefined;
      const list = held.get(heldKey(item, attempt)) ?? [];
      const released = new Set<string>();
      for (const l of list) {
        if (!keys || keys.includes(l.key) || keys.includes(l.key.replace(/^(surf|file):/, ''))) {
          locks.delete(l.key);
          released.add(l.key);
        }
      }
      held.set(heldKey(item, attempt), list.filter((l) => !released.has(l.key)));
    } else if (rec.type === 'attempt_started') {
      // Implicit release: every earlier attempt of this item loses its holds.
      const item = p.item_id as string;
      const attempt = p.attempt_id as string;
      for (const [ha, list] of held) {
        if (!ha.startsWith(`${item}/`) || ha === heldKey(item, attempt)) continue;
        for (const l of list) locks.delete(l.key);
        held.delete(ha);
      }
    }
  }

  // Terminal release: locks held by attempts of terminal items drop.
  for (const [key, l] of locks) {
    const it = state.items.get(l.item_id);
    if (!it || TERMINAL.has(it.status)) locks.delete(key);
    else {
      const a = attemptAlive.get(`${l.item_id}/${l.attempt_id}`);
      if (!a?.alive) locks.delete(key);
    }
  }
  return locks;
}

/** Which of `keys` are already held — excluding locks of `excludeItem`. */
export function conflictsFor(
  locks: Map<string, SurfaceLock>,
  keys: string[],
  excludeItem?: string,
): LockConflict[] {
  const out: LockConflict[] = [];
  for (const key of keys) {
    const l = locks.get(key);
    if (l && l.item_id !== excludeItem) {
      out.push({ key, held_by_item: l.item_id, held_by_attempt: l.attempt_id });
    }
  }
  return out;
}
