/**
 * SlogProxy Component
 * 
 * Handles PG token animation from slot back to roster during "slog" (removal).
 * Reuses FlightProxy logic but specifically for returning PG to roster.
 * 
 * Usage:
 * - Triggered when user removes PG from slot
 * - Animates PG token from slot position to roster position
 * - Completes after 600ms spring animation
 */

import React from 'react';
import { FlightProxy } from './FlightProxy';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

interface SlogProxyProps {
  residentId: string;
  slotX: number;          // Starting X (slot position)
  slotY: number;          // Starting Y (slot position)
  rosterX: number;        // Target X (roster position)
  rosterY: number;        // Target Y (roster position)
  onComplete: (residentId: string) => void;
  residentsById: Record<string, ResidentState>;
}

export function SlogProxy({ 
  residentId, 
  slotX, 
  slotY, 
  rosterX, 
  rosterY, 
  onComplete, 
  residentsById 
}: SlogProxyProps) {
  // Reuse FlightProxy with coordinates from slot to roster
  return (
    <FlightProxy
      residentId={residentId}
      fromX={slotX}
      fromY={slotY}
      toX={rosterX}
      toY={rosterY}
      onComplete={(completedResidentId) => onComplete(completedResidentId)}
      residentsById={residentsById}
    />
  );
}
