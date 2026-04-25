import React from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

interface PgCardProps {
  resident: ResidentState;
}

export const PgCard: React.FC<PgCardProps> = ({ resident }) => (
  <div data-testid="pg-card">
    {resident.displayName}
  </div>
);