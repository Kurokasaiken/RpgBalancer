/**
 * ActivityDetail — Expanded view of an activity (Job/Quest)
 *
 * Mostra:
 *  - Descrizione dell'attività
 *  - Skill check requirements
 *  - SlotRack per assegnare resident
 *  - Timer se in progress
 *  - Rewards
 *
 * Props:
 *  - activityId: string
 *  - activityName: string
 *  - activityType: 'job' | 'quest'
 *  - description?: string
 *  - skillCheckDC?: number
 *  - slots: ResidentSlotViewModel[]
 *  - rewards?: { wood?: number, gold?: number, xp: number }
 *  - onSlotClick?: (slotId: string) => void
 */

import React from 'react';
import { ResidentSlotRack } from './ResidentSlotRack';
import type { ResidentSlotViewModel } from '../slots/types';

export interface ActivityDetailProps {
  activityId: string;
  activityName: string;
  activityType: 'job' | 'quest';
  description?: string;
  skillCheckDC?: number;
  slots: ResidentSlotViewModel[];
  rewards?: {
    wood?: number;
    gold?: number;
    food?: number;
    xp: number;
  };
  onSlotClick?: (slotId: string) => void;
}

export function ActivityDetail({
  activityId,
  activityName,
  activityType,
  description,
  skillCheckDC,
  slots,
  rewards,
  onSlotClick,
}: ActivityDetailProps) {
  const typeColor = activityType === 'job' ? '#FF9800' : '#2196F3';

  return (
    <div
      style={{
        border: `2px solid ${typeColor}`,
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: 'white',
        marginBottom: '15px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <span
            style={{
              backgroundColor: typeColor,
              color: 'white',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
          >
            {activityType}
          </span>
          <h3 style={{ margin: 0, color: '#333' }}>{activityName}</h3>
        </div>

        {description && (
          <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>{description}</p>
        )}
      </div>

      {/* Skill Check Info */}
      {skillCheckDC !== undefined && (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            fontSize: '14px',
          }}
        >
          <strong>Skill Check Required:</strong> DC {skillCheckDC}
        </div>
      )}

      {/* Slots */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ color: '#333', marginBottom: '10px' }}>Assign Residents:</h4>
        <ResidentSlotRack slots={slots} layout="board" onSlotClick={onSlotClick} />
      </div>

      {/* Rewards */}
      {rewards && (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <strong>Rewards:</strong>
          <div style={{ marginTop: '5px' }}>
            {rewards.wood && <div>🌲 Wood: +{rewards.wood}</div>}
            {rewards.gold && <div>💰 Gold: +{rewards.gold}</div>}
            {rewards.food && <div>🍖 Food: +{rewards.food}</div>}
            <div style={{ color: '#ffc107' }}>⭐ Experience: +{rewards.xp}</div>
          </div>
        </div>
      )}
    </div>
  );
}
