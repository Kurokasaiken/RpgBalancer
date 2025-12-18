import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';

const STORAGE_KEY = 'idle_village_state';
const HISTORY_KEY = 'idle_village_state_history';
const MAX_HISTORY = 10;
const STATE_UPDATED_EVENT = 'idleVillageStateUpdated';

export interface VillageStateSnapshot {
  timestamp: number;
  description: string;
  state: VillageState;
}

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const getLocalStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
};

function emitUpdateEvent() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(STATE_UPDATED_EVENT));
  } catch {
    // Ignore CustomEvent failures in non-browser environments.
  }
}

export class VillageStateStore {
  private static state: VillageState | null = null;
  private static history: VillageStateSnapshot[] = [];

  static load(initialFactory?: () => VillageState): VillageState {
    if (this.state) return this.state;

    const storage = getLocalStorage();
    if (storage) {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          this.state = JSON.parse(raw) as VillageState;
        } catch (error) {
          console.warn('Failed to parse IdleVillage state snapshot, recreating:', error);
          this.state = null;
        }
      }
    }

    if (!this.state) {
      if (!initialFactory) {
        throw new Error('VillageStateStore.load requires an initial factory when no snapshot is stored');
      }
      this.state = deepClone(initialFactory());
      this.persistState(this.state);
    }

    this.loadHistory();
    return this.state;
  }

  static save(nextState: VillageState, description = 'State update'): void {
    this.addToHistory(description);
    this.state = deepClone(nextState);
    this.persistState(this.state);
    emitUpdateEvent();
  }

  static update(updater: (prev: VillageState) => VillageState, description = 'State update'): VillageState {
    const current = this.load();
    const nextState = updater(current);
    this.save(nextState, description);
    return nextState;
  }

  static export(): string {
    return JSON.stringify(this.load(), null, 2);
  }

  static import(json: string, description = 'Imported state'): VillageState {
    const parsed = JSON.parse(json) as VillageState;
    this.save(parsed, description);
    return parsed;
  }

  static reset(initialFactory: () => VillageState, description = 'Reset state'): VillageState {
    const fresh = deepClone(initialFactory());
    this.save(fresh, description);
    return fresh;
  }

  static undo(): VillageState | null {
    if (this.history.length === 0) return null;
    const [latest, ...rest] = this.history;
    this.history = rest;
    const storage = getLocalStorage();
    if (storage) {
      storage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    }
    this.state = deepClone(latest.state);
    this.persistState(this.state);
    emitUpdateEvent();
    return this.state;
  }

  static getHistory(): VillageStateSnapshot[] {
    return [...this.history];
  }

  static getUpdateEventName(): string {
    return STATE_UPDATED_EVENT;
  }

  private static persistState(state: VillageState) {
    const storage = getLocalStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private static addToHistory(description: string): void {
    if (!this.state) return;
    const snapshot: VillageStateSnapshot = {
      timestamp: Date.now(),
      description,
      state: deepClone(this.state),
    };
    this.history.unshift(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }
    const storage = getLocalStorage();
    if (storage) {
      storage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    }
  }

  private static loadHistory(): void {
    const storage = getLocalStorage();
    if (!storage) {
      this.history = [];
      return;
    }
    try {
      const raw = storage.getItem(HISTORY_KEY);
      this.history = raw ? (JSON.parse(raw) as VillageStateSnapshot[]) : [];
    } catch (error) {
      console.warn('Failed to parse IdleVillage state history, resetting:', error);
      this.history = [];
    }
  }
}
