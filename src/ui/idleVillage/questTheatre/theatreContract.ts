/**
 * Theatre contract — read-model v1 (PLAN-021 / quest_theatre_spec.md).
 *
 * These types describe the INFORMATION the theatre UI requires from a quest
 * runtime — not runtime semantics. The contract is explicitly provisional
 * (`contractVersion`): the canonical runtime contract is born in S2 and may
 * ask for a v2; the theatre adapts. Nothing here decides scheduling,
 * catch-up, persistence, economy or RNG.
 */

/** Observable state of a single node in the frontier. */
export type TheatreNodeState = 'pending' | 'resolved' | 'awaitingPlayer' | 'unsupported';

/** Terminal + running states of a run. */
export type TheatreRunState = 'running' | 'success' | 'fled' | 'wiped';

/** Life state of a party member, read-only for the theatre. */
export type TheatreMemberState = 'alive' | 'injured' | 'dead';

/** A choice option exactly as the runtime provides it. */
export interface TheatreChoiceOption {
  id: string;
  label: string;
  /** Runtime-provided preview (intel-gated upstream); never derived by the theatre. */
  preview?: string;
  disabled?: boolean;
}

/** Runtime-provided check summary for the decision panel. */
export interface TheatreCheckPreview {
  probabilityPct?: number;
  note?: string;
}

/** One node in the frontier: resolved nodes + the current one only. */
export interface TheatreNodeView {
  nodeId: string;
  /** e.g. 'timed' | 'choice' | 'check' | 'checkpoint' | 'consequence' | 'reward' | <unknown> */
  kind: string;
  state: TheatreNodeState;
  title?: string;
  text?: string;
  options?: TheatreChoiceOption[];
  /** Runtime-provided retreat consequences; the theatre never reconstructs them. */
  retreatPreview?: string;
  /** One-line summary used by the track for resolved nodes. */
  resolvedSummary?: string;
  checkPreview?: TheatreCheckPreview;
}

/** Read-only party member view. */
export interface TheatrePartyMemberView {
  id: string;
  name: string;
  role?: string;
  state: TheatreMemberState;
  portraitUrl?: string;
}

/** One chronicle/log line, exactly as the runtime logs it. */
export interface TheatreLogEntry {
  id: string;
  text: string;
}

/** The full frontier snapshot handed to the theatre. */
export interface TheatreRunView {
  contractVersion: number;
  runId: string;
  title: string;
  objective?: string;
  runState: TheatreRunState;
  /** Bumps on every new snapshot emission; intents carry it as expectedFrontierVersion. */
  frontierVersion: number;
  /** Resolved nodes + the current node ONLY — nothing past the frontier. */
  nodes: TheatreNodeView[];
  party: TheatrePartyMemberView[];
  log: TheatreLogEntry[];
  /** Optional runtime-provided fields — the UI omits them when absent. */
  nextKnown?: string;
  inAttesaDal?: number;
  attentionPolicy?: 'free' | 'partyLocked' | 'expires';
  blockedReason?: string;
}

/** UI intents — semantic, not runtime commands. */
export type TheatreIntent =
  | {
      kind: 'submitDecision';
      commandId: string;
      nodeId: string;
      expectedFrontierVersion: number;
      optionId: string;
    }
  | {
      kind: 'retreat';
      commandId: string;
      nodeId: string;
      expectedFrontierVersion: number;
    }
  | {
      kind: 'collectReward';
      commandId: string;
      nodeId: string;
      expectedFrontierVersion: number;
    };

/** Runtime answers: `stale` → re-read the snapshot; anything else → show the message. */
export type TheatreCommandResult =
  | { status: 'accepted' }
  | { status: 'pending' }
  | { status: 'rejected'; reason: 'stale' | 'other'; message?: string };

/** What the theatre needs from its adapter: a snapshot + an intent channel. */
export interface TheatreAdapter {
  getSnapshot: () => TheatreRunView;
  dispatch: (intent: TheatreIntent) => TheatreCommandResult;
}
