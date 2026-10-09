import React, { useEffect, useId, useRef, useState } from 'react';
import { useDndContext, useDroppable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import PoiMatericV3_5, { poiMatericV3_5Styles } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import type { PoiState, PoiType } from '@/ui/idleVillage/components/poi/PoiMarker';
import type { QuestAvailability } from './questAvailability';
import { usePoiTypeIcon } from './usePoiTypeIcon';

/**
 * The session slice the marker actually consumes — structural so both the
 * mock `useQuestPoiSession` and the real `useQuestExpeditionSession`'s
 * `poiView` fit (PLAN-019-S2.4 T-4).
 */
export interface MapQuestPoiSessionShape {
  activity: { id: string; label: string };
  questStatus: 'available' | 'in_progress' | 'completed' | 'failed';
  /** Seal fill 0..1 — the run clock (expedition: elapsed/duration halo). */
  activityProgress: number;
  poiDropId: string;
  canAcceptPoiDrop: boolean;
  handlePoiClick: () => void;
  draggingResidentId: string | null;
  gameplay: { state: { isPaused: boolean } };
  /** Awaiting a player decision (frontier `waiting`) — binary badge on the
   *  marker (D-H-4): independent from the halo fill, so «full halo, waiting
   *  at a crossroads» reads as such. */
  decisionWaiting?: boolean;
}

export interface MapQuestPoiProps {
  session: MapQuestPoiSessionShape;
  sizePx: number;
  /** Deadline of the open opportunity on the game clock; omit for a marker with no deadline. */
  availability?: QuestAvailability;
  /** Marker family (palette of the medallion): quest, job or event. Defaults to quest. */
  poiType?: PoiType;
}

/** Selector `useQuestPoiSession` flies a dropped resident to while the detail is closed. */
export const MAP_QUEST_POI_TARGET = '[data-map-quest-poi-target]';

/**
 * The quest POI as it sits on the world map: the `PoiMatericV3_5` medallion (the
 * marker chosen on /poi-marker-lab), a drop target for roster strips, and a name
 * plate. Clicking opens the quest detail, or the quest card once the party has left.
 *
 * Time reads straight off the medallion: while the quest runs its magic circle is
 * written by `activityProgress`, which advances with the game clock (paused when the
 * clock is paused, faster at ×2/×4).
 */
/** Gap between the marker and its deadline ring, and the ring's stroke, in px. */
const RING_GAP_PX = 7;
const RING_STROKE_PX = 4;
/** How long an expired opportunity takes to fade away. */
export const EXPIRE_FADE_MS = 700;
/** How long a new quest takes to ease in. */
const ENTER_MS = 800;

/** How the marker's seal reads for each stage of the quest (see `mapQuestPoiView`). */
export interface MapQuestPoiView {
  /** Marker state passed to `PoiMatericV3_5` — always a progress-driven one, never `available`. */
  state: PoiState;
  /** Seal fill 0..1: the run's clock, not the opportunity's. */
  progress: number;
  /** The deadline ring only appears while the open window is about to lapse. */
  deadlineWarn: boolean;
}

/**
 * Maps the quest session to what the marker draws (poi_spec scenario 5 +
 * poi_family_spec S-004): a quest POI that is only `available` is inert — bare
 * medallion, no arcane ring, it ignores time. The seal starts writing itself
 * once the expedition is actually running (`in_progress` requires every
 * required slot filled and the Start fired while the clock runs), it tracks
 * `activityProgress`, and it stays whole once the run has ended.
 *
 * `state` is never `available`/`new` because the marker family reads those as
 * "seal fully drawn" — the opposite of an unstarted quest. The deadline is a
 * different clock (the opportunity's window, already counted in the ledger): it
 * surfaces as the liquid ring only in its last stretch, warn-coloured, so an
 * idle POI never shows a halo that fills on time alone.
 */
export function mapQuestPoiView(
  questStatus: 'available' | 'in_progress' | 'completed' | 'failed',
  activityProgress: number,
  availability: QuestAvailability | undefined,
): MapQuestPoiView {
  const deadlineState = questStatus === 'available' ? availability?.state : undefined;
  return {
    state: deadlineState === 'expired' ? 'expired' : 'assigned',
    progress: questStatus === 'in_progress' ? activityProgress : questStatus === 'available' ? 0 : 1,
    deadlineWarn: deadlineState === 'expiring' || deadlineState === 'expired',
  };
}

/**
 * The deadline halo: no track, it appears with the liquid. The game clock only moves in ticks, so
 * the fill is extrapolated between them (rate learned from the last two ticks, held to one tick of
 * lead and frozen while paused) and eased, then written straight to the SVG each frame: it flows
 * instead of stepping, and costs no React renders.
 */
function LiquidHalo({
  target,
  running,
  warn,
  ringPx,
  ringR,
  offset,
}: {
  target: number;
  running: boolean;
  warn: boolean;
  ringPx: number;
  ringR: number;
  offset: number;
}) {
  const uid = useId().replace(/:/g, '');
  const arc = useRef<SVGCircleElement>(null);
  const glow = useRef<SVGCircleElement>(null);
  const bead = useRef<SVGCircleElement>(null);
  const clock = useRef({ target, at: performance.now(), rate: 0, interval: 1000, shown: target });

  useEffect(() => {
    const c = clock.current;
    if (target === c.target) return;
    const now = performance.now();
    const dt = Math.min(4000, Math.max(50, now - c.at));
    c.rate = (target - c.target) / dt;
    c.interval = c.interval * 0.5 + dt * 0.5;
    c.target = target;
    c.at = now;
  }, [target]);

  useEffect(() => {
    const centre = ringPx / 2;
    const paint = (shown: number, time: number) => {
      const dash = `${(shown * 100).toFixed(3)} 100`;
      arc.current?.setAttribute('stroke-dasharray', dash);
      glow.current?.setAttribute('stroke-dasharray', dash);
      const angle = (-90 + shown * 360) * (Math.PI / 180);
      const head = bead.current;
      if (head) {
        head.setAttribute('cx', (centre + ringR * Math.cos(angle)).toFixed(2));
        head.setAttribute('cy', (centre + ringR * Math.sin(angle)).toFixed(2));
        head.setAttribute('r', (RING_STROKE_PX * 0.8 * (1 + 0.14 * Math.sin(time / 230))).toFixed(2));
        head.setAttribute('opacity', shown > 0.004 ? '1' : '0');
      }
      const visible = shown > 0.004 ? '1' : '0';
      arc.current?.setAttribute('opacity', visible);
      glow.current?.setAttribute('opacity', shown > 0.004 ? '0.4' : '0');
    };
    let frame = 0;
    let last = performance.now();
    const tick = (time: number) => {
      const dt = Math.min(100, time - last);
      last = time;
      const c = clock.current;
      const lead = running ? Math.min(time - c.at, c.interval) * c.rate : 0;
      const goal = Math.min(1, Math.max(0, c.target + lead));
      c.shown += (goal - c.shown) * (1 - Math.exp(-dt / 140));
      paint(c.shown, time);
      frame = requestAnimationFrame(tick);
    };
    paint(clock.current.shown, last);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, ringPx, ringR]);

  const colour = warn ? 'var(--skin-status-unmet)' : 'var(--skin-icon-color)';
  const common = { cx: ringPx / 2, cy: ringPx / 2, r: ringR, fill: 'none', pathLength: 100, strokeLinecap: 'round' as const, transform: `rotate(-90 ${ringPx / 2} ${ringPx / 2})` };
  return (
    <svg
      aria-hidden="true"
      width={ringPx}
      height={ringPx}
      viewBox={`0 0 ${ringPx} ${ringPx}`}
      style={{ position: 'absolute', left: -offset, top: -offset, pointerEvents: 'none', overflow: 'visible' }}
    >
      <defs>
        <filter id={`halo-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>
      <circle ref={glow} {...common} strokeWidth={RING_STROKE_PX * 2.4} strokeDasharray="0 100" opacity="0" filter={`url(#halo-${uid})`} style={{ stroke: colour, transition: 'stroke 400ms ease-out' }} />
      <circle ref={arc} {...common} strokeWidth={RING_STROKE_PX} strokeDasharray="0 100" opacity="0" style={{ stroke: colour, transition: 'stroke 400ms ease-out' }} />
      <circle ref={bead} cx={ringPx / 2} cy={ringPx / 2 - ringR} r={RING_STROKE_PX * 0.8} opacity="0" style={{ fill: colour, transition: 'fill 400ms ease-out' }} />
    </svg>
  );
}

export const MapQuestPoi: React.FC<MapQuestPoiProps> = ({ session, sizePx, availability, poiType = 'quest' }) => {
  const { activity, questStatus, activityProgress, poiDropId, canAcceptPoiDrop, handlePoiClick, draggingResidentId, decisionWaiting } = session;
  const { t } = useTranslation('idleVillage');
  const iconUrl = usePoiTypeIcon(poiType);
  const { setNodeRef } = useDroppable({
    id: poiDropId,
    disabled: !canAcceptPoiDrop,
    data: { accepts: ['resident'] },
  });
  const { active } = useDndContext();
  // A new quest eases in (fade and grow) instead of popping onto the map.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 30);
    return () => window.clearTimeout(timer);
  }, []);
  const isDragActive = Boolean(active || draggingResidentId);

  // While the quest is open the marker stays bare (its seal is the run's clock, unwritten until
  // embark); the liquid halo speaks only for the window's last stretch — warn, not progress.
  const deadline = questStatus === 'available' && availability ? availability : null;
  const view = mapQuestPoiView(questStatus, activityProgress, availability);
  const { state, progress } = view;
  const expired = deadline?.state === 'expired';
  const elapsed = deadline ? 1 - deadline.progress : 0;
  const running = !session.gameplay.state.isPaused;
  const ringPx = sizePx + RING_GAP_PX * 2;
  const ringR = ringPx / 2 - RING_STROKE_PX;

  return (
    <div
      ref={setNodeRef}
      data-map-quest-poi-target=""
      data-quest-poi-id={activity.id}
      role="button"
      tabIndex={0}
      aria-label={t('gameFrame.questPoi.open', { name: activity.label })}
      onClick={handlePoiClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handlePoiClick();
        }
      }}
      data-quest-status={questStatus}
      data-drop-state={isDragActive ? (canAcceptPoiDrop ? 'valid' : 'invalid') : 'idle'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        // A drop it cannot take dims the marker; one it can take lights its rim. When the
        // opportunity runs out it fades and shrinks away instead of vanishing at once.
        opacity: expired || !entered ? 0 : isDragActive && !canAcceptPoiDrop ? 0.55 : 1,
        transform: expired ? 'scale(0.85)' : entered ? 'scale(1)' : 'scale(0.7)',
        pointerEvents: expired ? 'none' : undefined,
        transition: `opacity ${expired ? EXPIRE_FADE_MS : ENTER_MS}ms ease-out, transform ${expired ? EXPIRE_FADE_MS : ENTER_MS}ms ease-out`,
        cursor: 'pointer',
      }}
    >
      <style>{poiMatericV3_5Styles}</style>
      <div style={{ position: 'relative', width: sizePx, height: sizePx }}>
        {decisionWaiting && (
          <span
            data-decision-waiting="true"
            role="status"
            aria-label={t('gameFrame.questPoi.decisionWaiting')}
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'var(--skin-status-unmet, #f59e0b)',
              border: '2px solid var(--skin-panel-bg, #1a120b)',
              boxShadow: '0 0 8px var(--skin-status-unmet, #f59e0b)',
              animation: 'mqp-decision-pulse 1.6s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        )}
        <style>{`@keyframes mqp-decision-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.8); } }`}</style>
        {deadline && view.deadlineWarn && (
          <LiquidHalo target={elapsed} running={running} warn ringPx={ringPx} ringR={ringR} offset={RING_GAP_PX} />
        )}
        <PoiMatericV3_5
          type={poiType}
          iconUrl={iconUrl}
          state={state}
          progress={progress}
          timerDirection="clockwise"
          size={sizePx}
          grounded
          isDragging={isDragActive && canAcceptPoiDrop}
          data-testid="map-quest-poi"
        />
      </div>
    </div>
  );
};

export default MapQuestPoi;
