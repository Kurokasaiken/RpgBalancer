import type { StatBalanceRun, StatBalanceSession } from './StatBalanceTypes';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

const RUNS_KEY = 'rpg_stat_balance_runs';
const SESSIONS_KEY = 'rpg_stat_balance_sessions';
const MAX_RUNS = 200;
const MAX_SESSIONS = 100;

export class StatBalanceHistoryStore {
  private static runs: StatBalanceRun[] | null = null;
  private static sessions: StatBalanceSession[] | null = null;

  private static async ensureLoaded(): Promise<void> {
    if (this.runs === null) {
      this.runs = await loadData<StatBalanceRun[]>(RUNS_KEY, []);
    }
    if (this.sessions === null) {
      this.sessions = await loadData<StatBalanceSession[]>(SESSIONS_KEY, []);
    }
  }

  static async addRun(run: StatBalanceRun): Promise<void> {
    await this.ensureLoaded();
    if (!this.runs) this.runs = [];

    this.runs.unshift(run);
    if (this.runs.length > MAX_RUNS) {
      this.runs = this.runs.slice(0, MAX_RUNS);
    }

    await saveData(RUNS_KEY, this.runs);
  }

  static async addSession(session: StatBalanceSession): Promise<void> {
    await this.ensureLoaded();
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

    await saveData(SESSIONS_KEY, this.sessions);
  }

  static async listRuns(): Promise<StatBalanceRun[]> {
    await this.ensureLoaded();
    return this.runs ? [...this.runs] : [];
  }

  static async listSessions(): Promise<StatBalanceSession[]> {
    await this.ensureLoaded();
    return this.sessions ? [...this.sessions] : [];
  }

  static async getSession(sessionId: string): Promise<StatBalanceSession | undefined> {
    await this.ensureLoaded();
    return this.sessions?.find((s) => s.sessionId === sessionId);
  }

  /**
   * Remove a single run from history (and from any sessions that reference it).
   * If a session becomes empty after removal, it is dropped.
   */
  static async deleteRun(runId: string): Promise<void> {
    await this.ensureLoaded();

    if (!this.runs) this.runs = [];
    if (!this.sessions) this.sessions = [];

    this.runs = this.runs.filter((r) => r.id !== runId);

    this.sessions = this.sessions
      .map((session) => ({
        ...session,
        runs: session.runs.filter((r) => r.id !== runId),
      }))
      .filter((session) => session.runs.length > 0);

    await saveData(RUNS_KEY, this.runs);
    await saveData(SESSIONS_KEY, this.sessions);
  }

  /**
   * Remove an entire session and all its runs from history.
   */
  static async deleteSession(sessionId: string): Promise<void> {
    await this.ensureLoaded();

    if (!this.sessions) this.sessions = [];
    if (!this.runs) this.runs = [];

    const target = this.sessions.find((s) => s.sessionId === sessionId);
    if (!target) return;

    const runIdsToRemove = new Set(target.runs.map((r) => r.id));

    this.sessions = this.sessions.filter((s) => s.sessionId !== sessionId);
    this.runs = this.runs.filter((r) => !runIdsToRemove.has(r.id));

    await saveData(RUNS_KEY, this.runs);
    await saveData(SESSIONS_KEY, this.sessions);
  }

  static async clear(): Promise<void> {
    this.runs = [];
    this.sessions = [];
    await saveData(RUNS_KEY, []);
    await saveData(SESSIONS_KEY, []);
  }
}
