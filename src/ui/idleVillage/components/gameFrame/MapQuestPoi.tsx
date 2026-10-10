import React, { useEffect, useState } from 'react';
import { useDndContext, useDroppable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import PoiMatericV3_5, { poiMatericV3_5Styles } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import type { PoiState, PoiType } from '@/ui/idleVillage/components/poi/PoiMarker';
import { EXPIRING_BELOW, type QuestAvailability } from './questAvailability';
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
/** How long an expired opportunity takes to fade away. */
export const EXPIRE_FADE_MS = 700;
/** How long a new quest takes to ease in. */
export const ENTER_MS = 800;

/** How the marker's seal reads for each stage of the quest (see `mapQuestPoiView`). */
export interface MapQuestPoiView {
  /** Marker state passed to `PoiMatericV3_5` — always a progress-driven one, never `available`. */
  state: PoiState;
  /** Seal fill 0..1: the run's clock — or, while `expiring`, the share of the deadline stretch still left. */
  progress: number;
  /** The offer's window is in its last stretch — the seal itself carries the warn countdown. */
  deadlineWarn: boolean;
  /** Writing direction: a running quest fills clockwise, an expiring offer drains counter-clockwise. */
  direction: 'clockwise' | 'counterclockwise';
}

/**
 * Maps the quest session to what the marker draws (poi_spec scenario 5 +
 * poi_family_spec S-004 + poi_cooldown_spec §visual contract): a quest POI that
 * is only `available` is inert — bare medallion, no arcane ring, it ignores
 * time. The seal starts writing itself once the expedition is actually running
 * (`in_progress` requires every required slot filled and the Start fired while
 * the clock runs), it tracks `activityProgress`, and it stays whole once the
 * run has ended.
 *
 * `state` is never `available`/`new` because the marker family reads those as
 * "seal fully drawn" — the opposite of an unstarted quest. The deadline is a
 * different clock (the opportunity's window, already counted in the ledger):
 * in its last stretch (`expiring`) the seal itself becomes the countdown — it
 * appears whole when the flag lands, warn-coloured, and unwrites itself
 * counter-clockwise to zero at the deadline, so an idle POI never shows a halo
 * that fills on time alone.
 */
export function mapQuestPoiView(
  questStatus: 'available' | 'in_progress' | 'completed' | 'failed',
  activityProgress: number,
  availability: QuestAvailability | undefined,
): MapQuestPoiView {
  const deadlineState = questStatus === 'available' ? availability?.state : undefined;
  if (deadlineState === 'expired') {
    return { state: 'expired', progress: 0, deadlineWarn: true, direction: 'counterclockwise' };
  }
  if (deadlineState === 'expiring') {
    /* The expiring stretch re-normalises to a full ring: the flag lands at
     * `EXPIRING_BELOW` of the window left, so the warn seal appears whole and
     * drains to zero exactly at the deadline. */
    return {
      state: 'expiring',
      progress: (availability?.progress ?? 0) / EXPIRING_BELOW,
      deadlineWarn: true,
      direction: 'counterclockwise',
    };
  }
  return {
    state: 'assigned',
    progress: questStatus === 'in_progress' ? activityProgress : questStatus === 'available' ? 0 : 1,
    deadlineWarn: false,
    direction: 'clockwise',
  };
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
  // embark); in the window's last stretch the seal itself becomes the warn countdown.
  const view = mapQuestPoiView(questStatus, activityProgress, availability);
  const { state, progress } = view;
  const expired = state === 'expired';

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
        <PoiMatericV3_5
          type={poiType}
          iconUrl={iconUrl}
          state={state}
          progress={progress}
          timerDirection={view.direction}
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
