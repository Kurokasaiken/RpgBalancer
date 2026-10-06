/**
 * QuestTheatre — the quest as a story that waits at the crossroads (PLAN-021).
 *
 * Strictly read / present / command surface: it renders the frontier snapshot
 * an adapter hands it (resolved nodes + the current node, never the future)
 * and emits semantic intents — submitDecision, retreat, collectReward —
 * tagged with `expectedFrontierVersion`. It owns no gameplay state, computes
 * no outcomes and never advances on its own.
 *
 * Closing the panel parks the run (`awaitingPlayer`), it does not retreat:
 * retreat is a first-class option inside the decision stage, showing only the
 * `retreatPreview` the runtime provides.
 */

import { useCallback, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import { FloatingPanel } from '@/ui/idleVillage/components/FloatingPanel';
import { SkinButton } from '@/ui/idleVillage/skins/primitives';
import { DEFAULT_QUEST_THEATRE_CONFIG } from '@/balancing/config/idleVillage/questTheatreConfig';
import type {
  TheatreCommandResult,
  TheatreIntent,
  TheatreMemberState,
  TheatreNodeView,
  TheatreRunView,
} from './theatreContract';

export interface QuestTheatreProps {
  /** The frontier snapshot handed down by the adapter. */
  snapshot: TheatreRunView;
  /** Intent channel back to the runtime owner. */
  dispatch: (intent: TheatreIntent) => TheatreCommandResult;
  /** Hides the panel; the run keeps waiting — closing is not retreating. */
  onClose?: () => void;
}

const MEMBER_STATE_CLASS: Record<TheatreMemberState, string> = {
  alive: 'border-emerald-700/60 text-emerald-200',
  injured: 'border-amber-700/60 text-amber-200',
  dead: 'border-rose-800/60 text-rose-300 line-through opacity-60',
};

let commandCounter = 0;

function nextCommandId(): string {
  commandCounter += 1;
  return `qt-cmd-${commandCounter}`;
}

/** Narrative trail: resolved nodes only + the current marker (never the future). */
function TheatreTrack({ nodes }: { nodes: TheatreNodeView[] }): JSX.Element {
  const { maxVisibleNodes } = DEFAULT_QUEST_THEATRE_CONFIG.track;
  const visible = nodes.slice(-maxVisibleNodes);
  const hidden = nodes.length - visible.length;
  return (
    <div
      data-testid="theatre-track"
      className="flex items-center gap-1.5 overflow-x-auto border-b border-amber-800/20 px-4 py-2"
    >
      {hidden > 0 && <span className="text-[10px] text-slate-500">…+{hidden}</span>}
      {visible.map((node, index) => {
        const isCurrent = index === visible.length - 1 && node.state !== 'resolved';
        return (
          <div key={node.nodeId} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-amber-800/50">·</span>}
            <span
              data-testid={`track-node-${node.nodeId}`}
              title={node.resolvedSummary ?? node.title}
              className={
                isCurrent
                  ? 'h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.8)]'
                  : 'h-2 w-2 rounded-full bg-emerald-700/80'
              }
            />
          </div>
        );
      })}
    </div>
  );
}

/** Read-only party strip — "how things are going" without opening panels. */
function PartyStrip({ party }: { party: TheatreRunView['party'] }): JSX.Element {
  return (
    <div data-testid="theatre-party" className="flex flex-wrap gap-1.5 px-4 py-2">
      {party.map((member) => (
        <span
          key={member.id}
          data-testid={`party-member-${member.id}`}
          className={`rounded-full border px-2 py-0.5 text-[11px] ${MEMBER_STATE_CLASS[member.state]}`}
        >
          {member.name}
          {member.role ? ` · ${member.role}` : ''}
        </span>
      ))}
    </div>
  );
}

/**
 * The stage for the current node — one shape per kind. Unknown kinds get an
 * explicit `unsupported` state: no input, no auto-resolution.
 */
function StageRenderer({
  node,
  snapshot,
  onIntent,
}: {
  node: TheatreNodeView;
  snapshot: TheatreRunView;
  onIntent: (intent: TheatreIntent) => void;
}): JSX.Element {
  const { t } = useTranslation('idleVillage');
  const intent = useCallback(
    (kind: TheatreIntent['kind'], optionId?: string): TheatreIntent => ({
      kind,
      commandId: nextCommandId(),
      nodeId: node.nodeId,
      expectedFrontierVersion: snapshot.frontierVersion,
      ...(optionId !== undefined ? { optionId } : {}),
    }) as TheatreIntent,
    [node.nodeId, snapshot.frontierVersion],
  );

  const retreatOption = node.retreatPreview ? (
    <div className="mt-3 rounded border border-rose-800/40 bg-rose-950/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-rose-300/80">
        {t('questTheatre.retreat.label', { defaultValue: 'Ritirata' })}
      </p>
      <p className="mt-0.5 text-xs text-rose-200/90">{node.retreatPreview}</p>
      <SkinButton
        variant="utility"
        data-testid="theatre-retreat"
        className="mt-2"
        onClick={() => onIntent(intent('retreat'))}
      >
        {t('questTheatre.retreat.action', { defaultValue: 'Ritirati' })}
      </SkinButton>
    </div>
  ) : null;

  switch (node.kind) {
    case 'timed':
    case 'consequence':
      return (
        <p className="px-4 py-3 text-sm leading-relaxed text-slate-300" data-testid="stage-timed">
          {node.text}
        </p>
      );
    case 'choice':
    case 'checkpoint':
      return (
        <div className="space-y-3 px-4 py-3" data-testid="stage-choice">
          <p className="text-sm leading-relaxed text-slate-300">{node.text}</p>
          <div className="space-y-2">
            {(node.options ?? []).map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={option.disabled}
                data-testid={`theatre-option-${option.id}`}
                onClick={() => onIntent(intent('submitDecision', option.id))}
                className="w-full rounded border border-amber-700/40 bg-slate-900/60 px-3 py-2 text-left text-sm text-amber-100 transition-colors hover:bg-amber-900/30 disabled:opacity-40"
              >
                <span className="font-semibold">{option.label}</span>
                {option.preview && (
                  <span className="mt-0.5 block text-xs text-slate-400">{option.preview}</span>
                )}
              </button>
            ))}
          </div>
          {retreatOption}
        </div>
      );
    case 'check':
      return (
        <div className="space-y-3 px-4 py-3" data-testid="stage-check">
          <p className="text-sm leading-relaxed text-slate-300">{node.text}</p>
          {node.checkPreview && (
            <div className="rounded border border-sky-800/40 bg-sky-950/20 px-3 py-2 text-xs">
              {node.checkPreview.probabilityPct !== undefined && (
                <p className="tabular-nums text-sky-200">
                  {t('questTheatre.check.probability', {
                    pct: node.checkPreview.probabilityPct,
                    defaultValue: 'Probabilità stimata: {{pct}}%',
                  })}
                </p>
              )}
              {node.checkPreview.note && <p className="mt-1 text-slate-400">{node.checkPreview.note}</p>}
            </div>
          )}
          <SkinButton
            variant="cta"
            data-testid="theatre-check-submit"
            onClick={() => onIntent(intent('submitDecision', 'resolve'))}
          >
            {t('questTheatre.check.submit', { defaultValue: 'Affronta il check' })}
          </SkinButton>
          {retreatOption}
        </div>
      );
    case 'reward':
      return (
        <div className="space-y-3 px-4 py-3" data-testid="stage-reward">
          <p className="text-sm leading-relaxed text-slate-300">{node.text}</p>
          <SkinButton
            variant="cta"
            data-testid="theatre-collect"
            onClick={() => onIntent(intent('collectReward'))}
          >
            {t('questTheatre.reward.collect', { defaultValue: 'Riscuoti la ricompensa' })}
          </SkinButton>
        </div>
      );
    default:
      return (
        <div
          className="mx-4 my-3 rounded border border-slate-700/60 bg-slate-900/40 px-3 py-3 text-sm text-slate-400"
          data-testid="stage-unsupported"
        >
          {t('questTheatre.unsupported', {
            defaultValue: 'Questo momento della storia usa una forma che il teatro non conosce.',
          })}
        </div>
      );
  }
}

/**
 * The theatre: header (objective + wait info), the narrative trail, the party
 * strip, the current stage and the chronicle drawer — all inside a floating,
 * expandable, non-blocking panel.
 */
export function QuestTheatre({ snapshot, dispatch, onClose }: QuestTheatreProps): JSX.Element | null {
  const { t } = useTranslation('idleVillage');
  const { panel, expanded } = DEFAULT_QUEST_THEATRE_CONFIG;
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [lastRejection, setLastRejection] = useState<string | null>(null);

  const currentNode = useMemo(
    () => snapshot.nodes[snapshot.nodes.length - 1],
    [snapshot.nodes],
  );

  const handleIntent = useCallback(
    (intent: TheatreIntent) => {
      const result = dispatch(intent);
      setLastRejection(
        result.status === 'rejected' ? (result.message ?? result.reason) : null,
      );
    },
    [dispatch],
  );

  if (!currentNode && snapshot.runState === 'running') return null;

  return (
    <FloatingPanel
      panelId="quest-theatre"
      title={snapshot.title}
      icon="🗺"
      width={panel.widthPx}
      initialPosition={{ x: panel.initialX, y: panel.initialY }}
      maxBodyHeight={panel.maxBodyHeightPx}
      expandable
      expandedInsetPx={expanded.insetPx}
      onClose={onClose}
    >
      <div data-testid="quest-theatre" className="flex min-h-0 flex-col">
        <div className="border-b border-amber-800/20 px-4 py-2">
          {snapshot.objective && (
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/80">
              {snapshot.objective}
            </p>
          )}
          {snapshot.inAttesaDal !== undefined && (
            <p className="mt-0.5 text-[11px] text-slate-400" data-testid="theatre-awaiting">
              {t('questTheatre.awaiting', { defaultValue: 'La storia attende la tua decisione' })}
            </p>
          )}
          {snapshot.runState !== 'running' && (
            <p className="mt-0.5 text-[11px] font-semibold text-slate-200" data-testid="theatre-runstate">
              {t(`questTheatre.runState.${snapshot.runState}`, { defaultValue: snapshot.runState })}
            </p>
          )}
          {snapshot.blockedReason && (
            <p className="mt-0.5 text-[11px] text-rose-300" data-testid="theatre-blocked">
              {snapshot.blockedReason}
            </p>
          )}
        </div>

        <TheatreTrack nodes={snapshot.nodes} />
        <PartyStrip party={snapshot.party} />

        {currentNode && currentNode.state !== 'resolved' && (
          <StageRenderer node={currentNode} snapshot={snapshot} onIntent={handleIntent} />
        )}

        {lastRejection && (
          <p className="px-4 pb-2 text-[11px] text-rose-300" data-testid="theatre-rejection">
            {lastRejection}
          </p>
        )}

        <div className="mt-auto border-t border-amber-800/20">
          <button
            type="button"
            data-testid="theatre-chronicle-toggle"
            aria-expanded={chronicleOpen}
            onClick={() => setChronicleOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-amber-200/70 hover:text-amber-100"
          >
            {t('questTheatre.chronicle', { defaultValue: 'Cronaca' })}
            <span aria-hidden>{chronicleOpen ? '−' : '+'}</span>
          </button>
          {chronicleOpen && (
            <ul className="max-h-40 space-y-1 overflow-y-auto px-4 pb-3" data-testid="theatre-chronicle">
              {snapshot.log.length === 0 && (
                <li className="text-xs text-slate-500">
                  {t('questTheatre.chronicleEmpty', { defaultValue: 'La storia non è ancora cominciata.' })}
                </li>
              )}
              {snapshot.log.map((entry) => (
                <li key={entry.id} className="text-xs text-slate-300">
                  {entry.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </FloatingPanel>
  );
}

export default QuestTheatre;
