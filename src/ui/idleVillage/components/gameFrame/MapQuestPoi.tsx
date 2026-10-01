import React from 'react';
import { useDndContext, useDroppable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import PoiMatericV3_5, { poiMatericV3_5Styles } from '@/ui/idleVillage/components/poi/PoiMatericV3_5';
import type { PoiState } from '@/ui/idleVillage/components/poi/PoiMarker';
import type { QuestPoiSession } from '@/ui/idleVillage/quests/useQuestPoiSession';

export interface MapQuestPoiProps {
  session: QuestPoiSession;
  sizePx: number;
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
export const MapQuestPoi: React.FC<MapQuestPoiProps> = ({ session, sizePx }) => {
  const { activity, questStatus, activityProgress, poiDropId, canAcceptPoiDrop, handlePoiClick, draggingResidentId } = session;
  const { t } = useTranslation('idleVillage');
  const { setNodeRef } = useDroppable({
    id: poiDropId,
    disabled: !canAcceptPoiDrop,
    data: { accepts: ['resident'] },
  });
  const { active } = useDndContext();
  const isDragActive = Boolean(active || draggingResidentId);

  const state: PoiState = questStatus === 'available' ? 'available' : 'assigned';
  // Running: the circle is written by the quest clock. Otherwise it is whole.
  const progress = questStatus === 'in_progress' ? activityProgress : 1;

  return (
    <div
      ref={setNodeRef}
      data-map-quest-poi-target=""
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
        gap: 2,
        // A drop it cannot take dims the marker; one it can take lights its rim.
        opacity: isDragActive && !canAcceptPoiDrop ? 0.55 : 1,
        transition: 'opacity 160ms ease',
        cursor: 'pointer',
      }}
    >
      <style>{poiMatericV3_5Styles}</style>
      <PoiMatericV3_5
        type="quest"
        state={state}
        progress={progress}
        size={sizePx}
        grounded
        isDragging={isDragActive && canAcceptPoiDrop}
        data-testid="map-quest-poi"
      />
      <span
        style={{
          padding: '2px 10px',
          borderRadius: 6,
          background: 'linear-gradient(180deg, rgba(3,2,2,0.9) 0%, rgba(6,4,3,0.94) 100%)',
          border: '1px solid rgba(223,184,87,0.22)',
          fontFamily: 'var(--wl-font-display, "Cinzel", "Trajan Pro", serif)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          color: 'var(--skin-text-primary, #F5F2E8)',
          textShadow: '0 1px 2px rgba(0,0,0,0.7)',
          pointerEvents: 'none',
        }}
      >
        {activity.label}
      </span>
    </div>
  );
};

export default MapQuestPoi;
