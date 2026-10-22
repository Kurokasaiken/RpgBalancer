/**
 * dispatcher — single-writer facade for the ledger (PLAN-077 T-002).
 *
 * The dispatcher is the ONLY component allowed to append domain events to
 * the journal. `applyEvent` validates the transition against the derived
 * state BEFORE journaling: an illegal event never enters history — the
 * journal stays a replayable source of truth, not a log of accidents.
 */

import {
  appendRecord,
  initLedger,
  validateJournal,
  LEDGER_DIR,
  type JournalRecord,
  type JournalValidation,
} from './ledgerCore';
import { deriveState, reduceRecord, type LedgerState, type WorkItem } from './workItem';
import { validateReceiptPayload } from './verification';

export interface ApplyResult {
  applied: boolean;
  record?: JournalRecord;
  error?: string;
}

export interface LedgerHandle {
  dir: string;
  validate(): JournalValidation;
  state(): LedgerState;
  item(id: string): WorkItem | undefined;
  apply(type: string, payload: unknown): ApplyResult;
  watermark(): number;
}

/** Open (and initialize if needed) the ledger. */
export function openLedger(dir: string = LEDGER_DIR): LedgerHandle {
  initLedger(dir);
  const validate = () => validateJournal(dir);
  const state = () => deriveState(validate().records);
  return {
    dir,
    validate,
    state,
    item: (id) => state().items.get(id),
    watermark: () => {
      const v = validate();
      return v.records.length ? v.records[v.records.length - 1].seq : -1;
    },
    apply: (type, payload) => {
      const v = validate();
      if (!v.ok || !v.history_complete) {
        return { applied: false, error: `journal not healthy: ${v.corrupt?.reason ?? 'no genesis'} — repair first` };
      }
      const cur = deriveState(v.records);
      // Closed vocabularies (T-004): a payload outside the vocabulary is
      // rejected before the journal, not just folded to a no-op.
      if (type === 'verification_receipt') {
        const err = validateReceiptPayload((payload ?? {}) as Record<string, unknown>);
        if (err) return { applied: false, error: err };
      }
      // Tentative transition on a throwaway copy — never journal an
      // illegal event.
      const probe: JournalRecord = {
        seq: v.records.length,
        type,
        payload,
        prev_checksum: null,
        checksum: '',
      };
      try {
        reduceRecord(cur, probe);
      } catch (e) {
        return { applied: false, error: e instanceof Error ? e.message : String(e) };
      }
      const record = appendRecord(type, payload, dir);
      return { applied: true, record };
    },
  };
}
