import type { StatEfficiency } from '../testing/RoundRobinRunner';

export interface StatBalanceRun {
  id: string;
  timestamp: number;
  configVersion: string;
  /** Snapshot of non-derived stat weights at the time of the run */
  weights: Record<string, number>;
  tiers: number[];
  iterationsPerTier: number;
  efficiencies?: StatEfficiency[];
  /** Aggregate balance metric, e.g. mean |efficiency-0.5| across stats */
  balanceScore: number;
  summary: {
    overpowered: string[];
    underpowered: string[];
  };
}

export type StatBalanceStrategy = 'manual' | 'auto';

export interface StatBalanceSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  runs: StatBalanceRun[];
  strategy: StatBalanceStrategy;
}
