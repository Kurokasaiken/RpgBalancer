import type { StatBalanceRun, StatBalanceSession } from './StatBalanceTypes';

const RUNS_KEY = 'rpg_stat_balance_runs';
const SESSIONS_KEY = 'rpg_stat_balance_sessions';
const MAX_RUNS = 200;
const MAX_SESSIONS = 100;

function loadFromStorage<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, value: T[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Swallow storage errors (quota, etc.) – history is best-effort only.
  }
}

export class StatBalanceHistoryStore {
  private static runs: StatBalanceRun[] | null = null;
  private static sessions: StatBalanceSession[] | null = null;

  private static ensureLoaded(): void {
    if (this.runs === null) {
      this.runs = loadFromStorage<StatBalanceRun>(RUNS_KEY);
    }
    if (this.sessions === null) {
      this.sessions = loadFromStorage<StatBalanceSession>(SESSIONS_KEY);
    }
  }

  static addRun(run: StatBalanceRun): void {
    this.ensureLoaded();
    if (!this.runs) this.runs = [];

    this.runs.unshift(run);
    if (this.runs.length > MAX_RUNS) {
      this.runs = this.runs.slice(0, MAX_RUNS);
    }

    saveToStorage(RUNS_KEY, this.runs);
  }

  static addSession(session: StatBalanceSession): void {
    this.ensureLoaded();
    if (!this.sessions) this.sessions = [];

    const existingIndex = this.sessions.findIndex((s) => s.sessionId === session.sessionId);
    if (existingIndex >= 0) {
      this.sessions[existingIndex] = session;
    } else {
      this.sessions.unshift(session);
    }

    if (this.sessions.length > MAX_SESSIONS) {
      this.sessions = this.sessions.slice(0, MAX_SESSIONS);
    }

    saveToStorage(SESSIONS_KEY, this.sessions);
  }

  static listRuns(): StatBalanceRun[] {
    this.ensureLoaded();
    return this.runs ? [...this.runs] : [];
  }

  static listSessions(): StatBalanceSession[] {
    this.ensureLoaded();
    return this.sessions ? [...this.sessions] : [];
  }

  static getSession(sessionId: string): StatBalanceSession | undefined {
    this.ensureLoaded();
    return this.sessions?.find((s) => s.sessionId === sessionId);
  }

  /**
   * Remove a single run from history (and from any sessions that reference it).
   * If a session becomes empty after removal, it is dropped.
   */
  static deleteRun(runId: string): void {
    this.ensureLoaded();

    if (!this.runs) this.runs = [];
    if (!this.sessions) this.sessions = [];

    this.runs = this.runs.filter((r) => r.id !== runId);

    this.sessions = this.sessions
      .map((session) => ({
        ...session,
        runs: session.runs.filter((r) => r.id !== runId),
      }))
      .filter((session) => session.runs.length > 0);

    saveToStorage(RUNS_KEY, this.runs);
    saveToStorage(SESSIONS_KEY, this.sessions);
  }

  /**
   * Remove an entire session and all its runs from history.
   */
  static deleteSession(sessionId: string): void {
    this.ensureLoaded();

    if (!this.sessions) this.sessions = [];
    if (!this.runs) this.runs = [];

    const target = this.sessions.find((s) => s.sessionId === sessionId);
    if (!target) return;

    const runIdsToRemove = new Set(target.runs.map((r) => r.id));

    this.sessions = this.sessions.filter((s) => s.sessionId !== sessionId);
    this.runs = this.runs.filter((r) => !runIdsToRemove.has(r.id));

    saveToStorage(RUNS_KEY, this.runs);
    saveToStorage(SESSIONS_KEY, this.sessions);
  }

  static clear(): void {
    this.runs = [];
    this.sessions = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(RUNS_KEY);
      localStorage.removeItem(SESSIONS_KEY);
    }
  }
}
