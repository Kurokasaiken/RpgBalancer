/**
 * Gold Mine Card Component
 * 
 * Displays gold mine activity with worker assignment and production tracking.
 * Reuses LocationCard as base with drag & drop integration.
 * 
 * @module GoldMineCard
 */

import React, { useCallback, useMemo } from 'react';
import type { JSX } from 'react';
import type { GoldMineConfig } from '../../../balancing/config/idleVillage/types/economyTypes';
import { calculateGoldProduction } from '../../../engine/game/idleVillage/EconomyEngine';

/**
 * Props for GoldMineCard component
 */
export interface GoldMineCardProps {
  /** Gold mine configuration */
  config: GoldMineConfig;
  /** Currently assigned worker IDs */
  assignedWorkers: string[];
  /** Duration of current work session in hours */
  durationHours: number;
  /** Callback when worker is assigned */
  onWorkerAssigned?: (workerId: string) => void;
  /** Callback when worker is removed */
  onWorkerRemoved?: (workerId: string) => void;
  /** Callback when production is collected */
  onCollectProduction?: (goldAmount: number) => void;
  /** Whether the card is in compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Gold Mine Card Component
 * 
 * Displays gold mine with:
 * - Worker slots with drag & drop
 * - Production rate display
 * - Total production tracking
 * - Collect button
 * 
 * Uses config-first design with no hardcoded values.
 */
export function GoldMineCard({
  config,
  assignedWorkers,
  durationHours,
  onWorkerAssigned,
  onWorkerRemoved,
  onCollectProduction,
  compact = false,
  className = '',
}: GoldMineCardProps): JSX.Element {
  // Calculate current production
  const production = useMemo(
    () => calculateGoldProduction(config, assignedWorkers.length, durationHours),
    [config, assignedWorkers.length, durationHours]
  );

  // Handle collect production
  const handleCollect = useCallback(() => {
    if (production.totalGold > 0 && onCollectProduction) {
      onCollectProduction(production.totalGold);
    }
  }, [production.totalGold, onCollectProduction]);

  // Calculate available slots
  const availableSlots = config.crewCapacity - assignedWorkers.length;

  return (
    <div
      className={`gold-mine-card ${className}`}
      style={{
        backgroundColor: config.visual.backgroundColor,
        borderColor: config.visual.color,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '8px',
        padding: compact ? '12px' : '16px',
        minWidth: compact ? '200px' : '280px',
      }}
      role="region"
      aria-label={`${config.name} - Gold production facility`}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontSize: compact ? '24px' : '32px',
          }}
          role="img"
          aria-label="Gold mine icon"
        >
          {config.visual.icon}
        </span>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: compact ? '14px' : '16px',
              fontWeight: 600,
              color: config.visual.color,
            }}
          >
            {config.name}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: compact ? '11px' : '12px',
              color: 'rgba(240, 239, 228, 0.7)',
            }}
          >
            {assignedWorkers.length}/{config.crewCapacity} workers
          </p>
        </div>
      </div>

      {/* Production Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '1fr 1fr',
          gap: '8px',
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '4px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(240, 239, 228, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Rate
          </div>
          <div
            style={{
              fontSize: compact ? '14px' : '16px',
              fontWeight: 600,
              color: config.visual.color,
            }}
          >
            {config.goldPerHourPerWorker}g/h
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(240, 239, 228, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Total
          </div>
          <div
            style={{
              fontSize: compact ? '14px' : '16px',
              fontWeight: 600,
              color: config.visual.color,
            }}
          >
            {Math.floor(production.totalGold)}g
          </div>
        </div>
      </div>

      {/* Worker Slots */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        {Array.from({ length: config.crewCapacity }).map((_, index) => {
          const workerId = assignedWorkers[index];
          const isOccupied = !!workerId;

          return (
            <div
              key={index}
              style={{
                width: compact ? '32px' : '40px',
                height: compact ? '32px' : '40px',
                borderRadius: '4px',
                border: '2px dashed rgba(240, 239, 228, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isOccupied
                  ? 'rgba(201, 162, 39, 0.2)'
                  : 'rgba(0, 0, 0, 0.2)',
                cursor: isOccupied ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                if (isOccupied && onWorkerRemoved) {
                  onWorkerRemoved(workerId);
                }
              }}
              role="button"
              tabIndex={isOccupied ? 0 : -1}
              aria-label={
                isOccupied
                  ? `Worker ${index + 1} - Click to remove`
                  : `Empty slot ${index + 1}`
              }
            >
              {isOccupied ? (
                <span style={{ fontSize: compact ? '16px' : '20px' }}>👷</span>
              ) : (
                <span
                  style={{
                    fontSize: compact ? '12px' : '14px',
                    color: 'rgba(240, 239, 228, 0.3)',
                  }}
                >
                  +
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Fatigue Cost Warning */}
      {production.totalFatigueCost > 0 && (
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(239, 68, 68, 0.8)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>⚠️</span>
          <span>Fatigue cost: {Math.floor(production.totalFatigueCost)}</span>
        </div>
      )}

      {/* Collect Button */}
      <button
        onClick={handleCollect}
        disabled={production.totalGold === 0}
        style={{
          width: '100%',
          padding: compact ? '6px 12px' : '8px 16px',
          backgroundColor:
            production.totalGold > 0
              ? config.visual.color
              : 'rgba(240, 239, 228, 0.1)',
          color: production.totalGold > 0 ? '#050509' : 'rgba(240, 239, 228, 0.3)',
          border: 'none',
          borderRadius: '4px',
          fontSize: compact ? '12px' : '14px',
          fontWeight: 600,
          cursor: production.totalGold > 0 ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          opacity: production.totalGold > 0 ? 1 : 0.5,
        }}
        aria-label={`Collect ${Math.floor(production.totalGold)} gold`}
      >
        Collect {Math.floor(production.totalGold)}g
      </button>

      {/* Available Slots Info */}
      {availableSlots > 0 && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            color: 'rgba(240, 239, 228, 0.5)',
            textAlign: 'center',
          }}
        >
          {availableSlots} slot{availableSlots !== 1 ? 's' : ''} available
        </div>
      )}
    </div>
  );
}

export default GoldMineCard;
