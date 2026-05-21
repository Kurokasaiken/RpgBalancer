/**
 * BuildingCard Component
 *
 * POI container for building upgrades - displays current level and upgrade cost.
 * Follows same design pattern as ActivityCard with consistent skin system.
 */

import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';

export interface BuildingUpgradeCost {
  wood?: number;
  gold?: number;
  food?: number;
}

export interface BuildingLevel {
  level: number;
  description: string;
  effect: string; // e.g., "-20% duration" or "+1 daily income"
  cost: BuildingUpgradeCost;
}

export interface BuildingCardProps {
  buildingId: string;
  buildingName: string;
  currentLevel: number;
  maxLevel: number;
  levels: BuildingLevel[];
  icon?: string;
  onUpgrade?: (fromLevel: number, toLevel: number) => void;
  canUpgrade?: boolean;
  'data-testid'?: string;
}

const BuildingCard = memo(({
  buildingId,
  buildingName,
  currentLevel,
  maxLevel,
  levels,
  icon = '🏛️',
  onUpgrade,
  canUpgrade = false,
  'data-testid': testId = 'building-card',
}: BuildingCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const nextLevel = currentLevel < maxLevel ? levels[currentLevel] : null;
  const progressPercent = (currentLevel / maxLevel) * 100;

  const handleUpgrade = () => {
    if (canUpgrade && nextLevel) {
      onUpgrade?.(currentLevel, currentLevel + 1);
    }
  };

  return (
    <motion.div
      data-testid={testId}
      style={{
        border: '2px solid #6B5345',
        borderRadius: '8px',
        padding: '12px',
        backgroundColor: '#E8DCC8',
        marginBottom: '12px',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div
        onClick={() => setExpanded(!expanded)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px',
        }}
        whileHover={{ backgroundColor: 'rgba(107, 83, 69, 0.1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>{buildingName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Level {currentLevel}/{maxLevel}</div>
          </div>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: '14px', color: '#666' }}
        >
          ▼
        </motion.span>
      </motion.div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(107, 83, 69, 0.2)',
          borderRadius: '4px',
          marginTop: '8px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            backgroundColor: '#C9A961',
            width: `${progressPercent}%`,
          }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Expanded Content */}
      <motion.div
        initial={false}
        animate={{
          height: expanded ? 'auto' : 0,
          opacity: expanded ? 1 : 0,
          marginTop: expanded ? 8 : 0,
        }}
        transition={{ duration: 0.3 }}
        style={{
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            paddingTop: '8px',
            borderTop: '1px solid #D4AF8A',
          }}
        >
          {/* Current Level Info */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
              Current Level {currentLevel}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {levels[currentLevel - 1]?.effect || 'Base level'}
            </div>
          </div>

          {/* Next Level Info */}
          {nextLevel && (
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
                Upgrade to Level {nextLevel.level}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                {nextLevel.effect}
              </div>

              {/* Cost Breakdown */}
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                <div>Cost:</div>
                {nextLevel.cost.wood && <div>🪵 Wood: {nextLevel.cost.wood}</div>}
                {nextLevel.cost.gold && <div>🪙 Gold: {nextLevel.cost.gold}</div>}
                {nextLevel.cost.food && <div>🍞 Food: {nextLevel.cost.food}</div>}
              </div>

              {/* Upgrade Button */}
              <motion.button
                onClick={handleUpgrade}
                disabled={!canUpgrade}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: canUpgrade ? '#C9A961' : '#ccc',
                  color: canUpgrade ? '#fff' : '#999',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: canUpgrade ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
                whileHover={canUpgrade ? { backgroundColor: '#B89850' } : {}}
                whileTap={canUpgrade ? { scale: 0.95 } : {}}
                data-testid="upgrade-button"
              >
                {canUpgrade ? 'Upgrade' : 'Not enough resources'}
              </motion.button>
            </div>
          )}

          {/* Max Level */}
          {currentLevel === maxLevel && (
            <div style={{ padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
              <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold' }}>
                ✓ Max Level Reached
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});

BuildingCard.displayName = 'BuildingCard';

export default BuildingCard;
