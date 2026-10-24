/**
 * candidateStore — page-local reducer + hook for lab candidates
 * (PLAN-029 SP-2 T-2). Subtree-local state per project rule — React
 * `useReducer`, NOT Zustand (candidates live and die with the page).
 *
 * Invariants enforced here:
 * - append order preserved; `seq` is reducer state and resets on clear();
 * - `sessionEpoch` is bumped by clear() — a GenerationRequest submitted
 *   before a clear commits nothing if its async hash resolves after it
 *   (epoch mismatch drops the late result AND suppresses its error
 *   surface — the caller checks `state.sessionEpoch === request.epoch`
 *   before rendering the error);
 * - lineage guard (`lineageOk`) rejects missing target / self-link /
 *   cycle before append;
 * - failed generation mutates nothing: `add` is only ever called with a
 *   fully materialized candidate.
 */

import { useCallback, useMemo, useReducer } from 'react';
import { lineageOk, type LabCandidate } from './candidate';

interface CandidatesState {
  readonly list: readonly LabCandidate[];
  /** Bump on clear() — stale pending work keys off this. */
  readonly sessionEpoch: number;
  /** Next `cand-…-<seq>` suffix. */
  readonly seq: number;
}

type CandidatesAction =
  | { type: 'add'; candidate: LabCandidate }
  | { type: 'clear' }
  | { type: 'hydrate'; candidates: LabCandidate[] };

function reducer(state: CandidatesState, action: CandidatesAction): CandidatesState {
  switch (action.type) {
    case 'add': {
      if (!lineageOk(state.list, action.candidate)) return state;
      return { ...state, list: [...state.list, action.candidate], seq: state.seq + 1 };
    }
    case 'clear':
      return { list: [], sessionEpoch: state.sessionEpoch + 1, seq: 0 };
    case 'hydrate': {
      const ok = action.candidates.filter((c) => lineageOk(action.candidates, c));
      return { ...state, list: ok, seq: ok.length };
    }
    default:
      return state;
  }
}

const INITIAL: CandidatesState = { list: [], sessionEpoch: 0, seq: 0 };

/** The handle the page and panels use — the SP-6 seam never appears here. */
export interface CandidatesApi {
  readonly candidates: readonly LabCandidate[];
  readonly sessionEpoch: number;
  readonly nextSeq: number;
  add(candidate: LabCandidate): void;
  clear(): void;
  /** Replace the list wholesale — used by SP-6 hydration only. */
  hydrate(candidates: LabCandidate[]): void;
}

/**
 * Page-local candidate list.
 * @returns the reducer-backed candidate API.
 */
export function useCandidates(): CandidatesApi {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const add = useCallback((candidate: LabCandidate) => dispatch({ type: 'add', candidate }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const hydrate = useCallback(
    (candidates: LabCandidate[]) => dispatch({ type: 'hydrate', candidates }),
    [],
  );
  return useMemo(
    () => ({
      candidates: state.list,
      sessionEpoch: state.sessionEpoch,
      nextSeq: state.seq,
      add,
      clear,
      hydrate,
    }),
    [state, add, clear, hydrate],
  );
}
