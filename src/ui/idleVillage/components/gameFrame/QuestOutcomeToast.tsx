/**
 * QuestOutcomeToast — PLAN-040 T-005: the post-check outcome as a small
 * external popup, EVERYTHING written at once (verdict chip + check title +
 * complete flavor + harm lines + authored consequence — no typewriter, no
 * staged reveal). Click anywhere on it, Escape when topmost, or its X
 * dismisses it; the outcome stays readable in the quest chronicle/log.
 *
 * Trigger is a PREDICATE over the store, not a one-shot event (debate r007):
 *   eligible(N) = checkSeq(N) > dismissedUpTo  AND  bridge.check.checkSeq ≠ N
 * — i.e. the check's overlay must be unmounted and the sequence must not be
 * past the dismissed high-water mark. This covers every presentation path
 * uniformly: click-dismiss, the `checkHoldMs` auto-advance, `skipCheck` /
 * `skipIntro` (no overlay at all → immediate toast), and remounts (the run's
 * persisted `dismissedUpTo` already absorbed settled history).
 *
 * Latest-wins: when several checks are eligible the highest `checkSeq`
 * surfaces — a newer resolution always supersedes a pending older toast.
 *
 * End-of-run (debate2 W-20): while the run is ended the toast is a
 * PENDING-FLUSH — it stays back until `QuestRewardPopup` acknowledges its
 * first painted frame through `markRewardShown(questId, runId)` (the report
 * already carries the outcome → the toast is consumed silently). If the
 * report never acknowledges within `outcomeToast.rewardAckTimeoutMs` —
 * unmounted, failed, hidden — the toast flushes anyway: an outcome is never
 * lost.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EngravedIcon } from './engravedIcons';
import { HudPlaque, SkinCloseButton, SkinScope } from '@/ui/idleVillage/skins/primitives';
import { HudChip, TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { checkHistory, type QuestRunState, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { runIdOf } from '@/ui/idleVillage/quests/questSettlement';
import { useCheckBridge, useQuestRunFromStore, useRewardAck } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { useOverlayEscape } from './overlayStack';

const FONT = {
  display: 'var(--skin-font-display)',
  serif: 'var(--skin-font-serif)',
} as const;

/** Verdict → chip tone — same mapping the check overlay paints. */
const VERDICT_TONE: Record<string, 'ok' | 'warn' | 'danger'> = {
  bigwin: 'ok',
  win: 'ok',
  almost: 'warn',
  fail: 'danger',
  epicfail: 'danger',
  fail_wound: 'danger',
  fail_dead: 'danger',
};

/* ------------------------------------------------------------------ */
/* The view — pure presentation, the controller below owns the when.   */
/* ------------------------------------------------------------------ */

export interface QuestOutcomeToastProps {
  run: QuestRunState;
  check: ResolvedCheck;
  onDismiss: (checkSeq: number) => void;
}

/**
 * The toast plaque itself: `position: fixed`, `zLayers.questToast`, anchor
 * and offsets from `questWindow.outcomeToast`. `role="status"` — it informs,
 * never demands (not an alert).
 */
export const QuestOutcomeToast: React.FC<QuestOutcomeToastProps> = ({ run, check, onDismiss }) => {
  const { t } = useTranslation('idleVillage');
  const cfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.outcomeToast;
  const zIndex = DEFAULT_GAME_FRAME_CONFIG.zLayers.questToast;
  const overlayId = `quest-outcome:${runIdOf(run)}:${check.checkSeq}`;
  useOverlayEscape(overlayId, useCallback(() => onDismiss(check.checkSeq), [onDismiss, check.checkSeq]));

  /* Auto-dismiss is opt-in — default 0 keeps the toast until clicked. */
  useEffect(() => {
    if (cfg.autoDismissMs <= 0) return undefined;
    const id = window.setTimeout(() => onDismiss(check.checkSeq), cfg.autoDismissMs);
    return () => window.clearTimeout(id);
  }, [cfg.autoDismissMs, check.checkSeq, onDismiss]);

  const anchorStyle =
    cfg.anchor === 'right'
      ? { right: cfg.offsetXPx, bottom: cfg.offsetYPx }
      : { left: '50%', bottom: cfg.offsetYPx, transform: 'translateX(-50%)' };

  return (
    <SkinScope>
      <div
        data-quest-owned
        data-testid="quest-outcome-toast"
        role="status"
        aria-live="polite"
        onClick={() => onDismiss(check.checkSeq)}
        style={{ position: 'fixed', zIndex, width: cfg.widthPx, maxWidth: `calc(100vw - ${cfg.offsetXPx * 2}px)`, cursor: 'pointer', ...anchorStyle }}
      >
        <HudPlaque
          shape="panel"
          style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HudChip tone={VERDICT_TONE[check.verdict] ?? 'warn'}>{t(`questS1Lab.verdict.${check.verdict}`)}</HudChip>
            <span style={{ flex: 1, minWidth: 0, fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.06em', color: 'var(--skin-title-color)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {check.title}
            </span>
            <SkinCloseButton
              aria-label={t('gameFrame.questWindow.outcomeToast.dismiss')}
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(check.checkSeq);
              }}
            />
          </div>
          {(check.flavor ?? check.outcomeText) && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 13, lineHeight: 1.45, color: TONE.label }}>
              {check.flavor ?? check.outcomeText}
            </p>
          )}
          {check.harmLines.map((line, i) => (
            <p
              key={i}
              style={{ margin: 0, fontFamily: FONT.serif, fontSize: 12, lineHeight: 1.4, color: check.deathLines?.includes(line) ? TONE.death : TONE.warn }}
            >
              {line}
            </p>
          ))}
          {check.authoredText && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 12, lineHeight: 1.4, color: TONE.secondary }}>{check.authoredText}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 11, color: TONE.muted }}>
            <EngravedIcon id="ico-scroll" size={11} />
            {t('gameFrame.questWindow.outcomeToast.logHint')}
          </div>
        </HudPlaque>
      </div>
    </SkinScope>
  );
};

/* ------------------------------------------------------------------ */
/* The controller — derives WHAT/WHEN from the store; the view paints.  */
/* ------------------------------------------------------------------ */

export interface QuestOutcomeToastHostProps {
  questId: string;
  /** Persists the dismissal into the run (`dismissedUpTo`) — the durable
   *  half of the gate; the session floor below is the immediate one. */
  onDismissOutcome?: (checkSeq: number) => void;
  /** PLAN-043 WS-4: the right-wing column owns the check's verdict surface —
   *  seqs whose bridge the column painted are consumed there (exactly-once,
   *  BV-05), never re-toasted. A `skipCheck` beat publishes no bridge, so
   *  its outcome still lands here — the documented fallback. */
  columnMode?: boolean;
}

/**
 * Reads `runs`/`bridges`/`rewardAck` from `questRunStore` and mounts the
 * toast for the newest eligible check. Keeps three session-local ledgers,
 * all reset when the run identity changes:
 * - `sessionFloor` — dismissed seqs this session (the immediate half of the
 *   persisted `dismissedUpTo`, which lags one commit);
 * - `rewardConsumed` — seqs the acknowledged end-of-run report absorbed;
 * - `flushOverdue` — seqs whose report never acknowledged in time.
 */
export const QuestOutcomeToastHost: React.FC<QuestOutcomeToastHostProps> = ({ questId, onDismissOutcome, columnMode = false }) => {
  const run = useQuestRunFromStore(questId);
  const bridge = useCheckBridge(questId);
  const rewardAckRunId = useRewardAck(questId);
  const cfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.outcomeToast;

  const runId = run ? runIdOf(run) : null;
  const [sessionFloor, setSessionFloor] = useState(0);
  const [rewardConsumed, setRewardConsumed] = useState<ReadonlySet<number>>(new Set());
  const [flushOverdue, setFlushOverdue] = useState<ReadonlySet<number>>(new Set());
  const flushTimers = useRef(new Map<number, number>());
  const shownFor = useRef<number | null>(null);
  /* WS-4: seqs whose bridge the right-wing column presented — a presented
   * verdict must never re-surface as a toast (exactly-once, BV-05). */
  const columnPresented = useRef(new Set<number>());

  /* New run → the session ledgers reset with its identity (the persisted
   * `dismissedUpTo` inside the run is the durable floor). */
  useEffect(() => {
    setSessionFloor(0);
    setRewardConsumed(new Set());
    setFlushOverdue(new Set());
    shownFor.current = null;
    columnPresented.current.clear();
    for (const t of flushTimers.current.values()) window.clearTimeout(t);
    flushTimers.current.clear();
  }, [runId]);

  /* A live bridge in column mode marks its seq consumed-by-column — the
   * ledger persists after the bridge clears so the dismissal never revives
   * the toast. */
  useEffect(() => {
    if (columnMode && bridge) columnPresented.current.add(bridge.check.checkSeq);
  }, [columnMode, bridge]);

  /** Latest-wins eligibility: highest unsettled-elsewhere, undismissed seq. */
  const eligible = useMemo<ResolvedCheck | null>(() => {
    if (!run) return null;
    const floor = Math.max(run.dismissedUpTo ?? 0, sessionFloor);
    let best: ResolvedCheck | null = null;
    for (const c of checkHistory(run)) {
      if (!Number.isInteger(c.checkSeq) || c.checkSeq <= floor) continue;
      if (bridge && bridge.check.checkSeq === c.checkSeq) continue;
      if (columnMode && columnPresented.current.has(c.checkSeq)) continue;
      if (!best || c.checkSeq > best.checkSeq) best = c;
    }
    return best;
  }, [run, bridge, sessionFloor, columnMode]);
  const seq = eligible?.checkSeq;

  const ended = !!run?.ended;
  const acked = runId !== null && rewardAckRunId === runId;

  /* Reward acknowledged its first frame → the report carries the outcome;
   * consume the pending toast silently. */
  useEffect(() => {
    if (!ended || seq === undefined || !acked) return;
    setRewardConsumed((s) => (s.has(seq) ? s : new Set(s).add(seq)));
  }, [ended, seq, acked]);

  /* No acknowledgement within the deadline → flush the pending toast rather
   * than losing the outcome (reward unmounted, failed, or hidden). */
  useEffect(() => {
    if (!ended || seq === undefined || acked || rewardConsumed.has(seq) || flushOverdue.has(seq)) return;
    if (flushTimers.current.has(seq)) return;
    const id = window.setTimeout(() => {
      flushTimers.current.delete(seq);
      setFlushOverdue((s) => new Set(s).add(seq));
    }, cfg.rewardAckTimeoutMs);
    flushTimers.current.set(seq, id);
  }, [ended, seq, acked, rewardConsumed, flushOverdue, cfg.rewardAckTimeoutMs]);

  const suppressedByReward = ended && seq !== undefined && (rewardConsumed.has(seq) || (acked && !flushOverdue.has(seq)));
  const heldForReward = ended && seq !== undefined && !rewardConsumed.has(seq) && !flushOverdue.has(seq);
  const visible = !!eligible && !suppressedByReward && !heldForReward;

  /* `quest_outcome_shown` — once per seq per session. */
  useEffect(() => {
    if (!visible || !eligible || !run || shownFor.current === eligible.checkSeq) return;
    shownFor.current = eligible.checkSeq;
    trackTelemetryEvent('quest_outcome_shown', {
      runId: runIdOf(run),
      checkSeq: eligible.checkSeq,
      visitSeq: eligible.visitSeq,
      beatIndex: eligible.beatIndex,
      outcome: eligible.verdict,
      flush: ended ? (flushOverdue.has(eligible.checkSeq) ? 'timeout' : 'direct') : 'live',
    });
  }, [visible, eligible, run, ended, flushOverdue]);

  const dismiss = useCallback(
    (checkSeq: number) => {
      setSessionFloor((f) => Math.max(f, checkSeq));
      if (run) {
        const c = checkHistory(run).find((x) => x.checkSeq === checkSeq);
        trackTelemetryEvent('quest_outcome_dismissed', {
          runId: runIdOf(run),
          checkSeq,
          visitSeq: c?.visitSeq,
          outcome: c?.verdict,
        });
      }
      onDismissOutcome?.(checkSeq);
    },
    [run, onDismissOutcome],
  );

  if (!visible || !run || !eligible) return null;
  return <QuestOutcomeToast run={run} check={eligible} onDismiss={dismiss} />;
};

export default QuestOutcomeToast;
