/**
 * VendorShop Component
 *
 * Modal overlay showing vendor catalog with purchase functionality.
 * Follows VictoryComponent pattern with consistent animations and styling.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';

export interface ShopItem {
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

export interface VendorShopProps {
  shopTitle: string;
  items: ShopItem[];
  playerGold: number;
  onPurchase?: (item: ShopItem) => void;
  onDismiss?: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
  'data-testid'?: string;
}

const VendorShop = memo(({
  shopTitle,
  items,
  playerGold,
  onPurchase,
  onDismiss,
  autoClose = false,
  autoCloseDuration = 4000,
  'data-testid': testId = 'vendor-shop',
}: VendorShopProps) => {
  const canAfford = (item: ShopItem) => playerGold >= item.cost;

  const handlePurchase = (item: ShopItem) => {
    if (canAfford(item)) {
      onPurchase?.(item);
    }
  };

  // Auto-close timer
  React.useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(() => {
      onDismiss?.();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [autoClose, autoCloseDuration, onDismiss]);

  return (
    <motion.div
      data-testid={testId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#F5E6D3',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '3px solid #8B7355',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '24px' }}>
            🧪 {shopTitle}
          </h2>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            You have {playerGold} 🪙
          </p>
        </div>

        {/* Items Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {items.map((item) => {
            const affordable = canAfford(item);

            return (
              <motion.div
                key={item.id}
                onClick={() => handlePurchase(item)}
                style={{
                  border: `2px solid ${affordable ? '#C9A961' : '#ccc'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: '#fff',
                  cursor: affordable ? 'pointer' : 'not-allowed',
                  opacity: affordable ? 1 : 0.6,
                  textAlign: 'center',
                }}
                whileHover={affordable ? { scale: 1.08, backgroundColor: '#FFE4B5' } : {}}
                whileTap={affordable ? { scale: 0.92 } : {}}
                data-testid={`shop-item-${item.id}`}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {item.icon}
                </div>
                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '13px', marginBottom: '4px' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                  {item.description}
                </div>
                <div style={{ fontSize: '10px', color: '#999', marginBottom: '6px' }}>
                  Duration: {item.durationMinutes}m
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: affordable ? '#C9A961' : '#999',
                    marginBottom: '8px',
                  }}
                >
                  {item.cost} 🪙
                </div>
                {!affordable && (
                  <div style={{ fontSize: '10px', color: '#d9534f' }}>
                    Need {item.cost - playerGold} more
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
          }}
        >
          <motion.button
            onClick={onDismiss}
            style={{
              padding: '10px 20px',
              backgroundColor: '#8B7355',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
            whileHover={{ backgroundColor: '#6B5345' }}
            whileTap={{ scale: 0.95 }}
          >
            Close Shop
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
});

VendorShop.displayName = 'VendorShop';

export default VendorShop;
