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

/** Terminal + running states of a run. v2 adds 'survived' (returned without
 *  the objective — neither a success nor a retreat). */
export type TheatreRunState = 'running' | 'success' | 'survived' | 'fled' | 'wiped';

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
  /** v2 — set only while the node matures on the caller's clock (v27
   *  pending frontier): the theatre shows the scene and may render the
   *  maturation progress; effects land at `readyAt`, not before. */
  pending?: { startedAt: number; readyAt: number };
}

/** Read-only party member view. */
export interface TheatrePartyMemberView {
  id: string;
  name: string;
  role?: string;
  state: TheatreMemberState;
  portraitUrl?: string;
  /** v2 — hit points for readable combat and multi-death beats. */
  hp?: number;
  maxHp?: number;
}

/** v2 — a bag item carried on the run (stash consumable). Arming is UI
 *  state; the runtime only knows the item exists and its flag. `labelKey`
 *  is an i18n key — the theatre translates, the adapter never bakes copy. */
export interface TheatreBagItem {
  flag: string;
  labelKey: string;
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
  /* ---- v2 (PLAN-025 T-006 — real engine adapter) --------------------- */
  /** The caller's tick this snapshot was projected at — lets the theatre
   *  show pending maturation progress without owning a clock. */
  tick?: number;
  /** Stash items still in the bag (unspent consumables + instant items). */
  bag?: TheatreBagItem[];
  /** Present only while the frontier node is a combat: live telemetry. */
  combat?: { turn: number; enemiesLeft: number };
}

/** UI intents — semantic, not runtime commands. */
export type TheatreIntent =
  | {
      kind: 'submitDecision';
      commandId: string;
      nodeId: string;
      expectedFrontierVersion: number;
      optionId: string;
      /** v2 — whether an armed bag item may boost a resolving check;
       *  the player's explicit call, never a silent default. */
      useConsumable?: boolean;
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
    }
  | {
      /** v2 — an instant bag action (healing kit, potion) at a waiting
       *  frontier; never resolves a check by itself. */
      kind: 'useItem';
      commandId: string;
      nodeId: string;
      expectedFrontierVersion: number;
      flag: string;
    };

/** Runtime answers: `stale` → re-read the snapshot; `duplicate` → the same
 *  commandId already landed (double-fire guard); anything else → show the message. */
export type TheatreCommandResult =
  | { status: 'accepted' }
  | { status: 'pending' }
  | { status: 'rejected'; reason: 'stale' | 'duplicate' | 'other'; message?: string };

/** What the theatre needs from its adapter: a snapshot + an intent channel. */
export interface TheatreAdapter {
  getSnapshot: () => TheatreRunView;
  dispatch: (intent: TheatreIntent) => TheatreCommandResult;
}
