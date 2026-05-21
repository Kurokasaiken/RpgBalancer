/**
 * VendorCard Component
 *
 * POI container for vendor (shop) - displays available potions and allows purchase.
 * Follows same design pattern as ActivityCard with consistent skin system.
 */

import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';

export interface Potion {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  durationMinutes: number;
  effect: {
    type: 'strength' | 'wisdom' | 'speed' | 'resilience';
    value: number;
  };
}

export interface VendorCardProps {
  vendorId: string;
  vendorName: string;
  potions: Potion[];
  playerGold: number;
  onPotionPurchase?: (potion: Potion) => void;
  icon?: string;
  'data-testid'?: string;
}

const VendorCard = memo(({
  vendorId,
  vendorName,
  potions,
  playerGold,
  onPotionPurchase,
  icon = '🧪',
  'data-testid': testId = 'vendor-card',
}: VendorCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedPotion, setSelectedPotion] = useState<Potion | null>(null);

  const handlePotionClick = (potion: Potion) => {
    if (playerGold >= potion.cost) {
      onPotionPurchase?.(potion);
      setSelectedPotion(potion);
      // Reset selection after brief moment
      setTimeout(() => setSelectedPotion(null), 500);
    }
  };

  const canAfford = (potion: Potion) => playerGold >= potion.cost;

  return (
    <motion.div
      data-testid={testId}
      style={{
        border: '2px solid #8B7355',
        borderRadius: '8px',
        padding: '12px',
        backgroundColor: '#F5E6D3',
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
        whileHover={{ backgroundColor: 'rgba(139, 115, 85, 0.1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <span style={{ fontWeight: 'bold', color: '#333' }}>{vendorName}</span>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: '14px', color: '#666' }}
        >
          ▼
        </motion.span>
      </motion.div>

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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #D4AF8A',
          }}
        >
          {potions.map((potion) => {
            const affordable = canAfford(potion);
            const isSelected = selectedPotion?.id === potion.id;

            return (
              <motion.div
                key={potion.id}
                onClick={() => handlePotionClick(potion)}
                style={{
                  border: `2px solid ${affordable ? '#C9A961' : '#ccc'}`,
                  borderRadius: '6px',
                  padding: '8px',
                  backgroundColor: isSelected ? '#FFE4B5' : '#fff',
                  cursor: affordable ? 'pointer' : 'not-allowed',
                  opacity: affordable ? 1 : 0.6,
                }}
                whileHover={affordable ? { scale: 1.05, backgroundColor: '#FFE4B5' } : {}}
                whileTap={affordable ? { scale: 0.95 } : {}}
                data-testid={`potion-${potion.id}`}
              >
                <div style={{ fontSize: '24px', textAlign: 'center' }}>
                  {potion.icon}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginTop: '4px' }}>
                  {potion.name}
                </div>
                <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '2px' }}>
                  {potion.description}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#999',
                    textAlign: 'center',
                    marginTop: '4px',
                  }}
                >
                  {potion.durationMinutes}m
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginTop: '6px',
                    color: affordable ? '#C9A961' : '#999',
                  }}
                >
                  {potion.cost} 🪙
                </div>
                {!affordable && (
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#d9534f',
                      textAlign: 'center',
                      marginTop: '4px',
                    }}
                  >
                    Need {potion.cost - playerGold} more
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
});

VendorCard.displayName = 'VendorCard';

export default VendorCard;
