/**
 * Market Card Component
 * 
 * Displays market with purchasable items and gold management.
 * Shows prices, stock levels, and bulk discounts.
 * 
 * @module MarketCard
 */

import React, { useCallback, useState } from 'react';
import type { JSX } from 'react';
import type { MarketConfig, PriceListItem } from '../../../balancing/config/idleVillage/types/economyTypes';
import { applyBulkDiscount, validatePurchase } from '../../../engine/game/idleVillage/EconomyEngine';

/**
 * Props for MarketCard component
 */
export interface MarketCardProps {
  /** Market configuration */
  config: MarketConfig;
  /** Player's current gold */
  playerGold: number;
  /** Current stock levels */
  currentStock: Record<string, number>;
  /** Callback when item is purchased */
  onPurchase?: (itemId: string, quantity: number, finalPrice: number) => void;
  /** Whether the card is in compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Market Item Row Component
 */
interface MarketItemRowProps {
  item: PriceListItem;
  stock: number;
  playerGold: number;
  bulkDiscounts: Array<{ minQuantity: number; discountPercent: number }>;
  onPurchase: (quantity: number, finalPrice: number) => void;
  compact: boolean;
}

function MarketItemRow({
  item,
  stock,
  playerGold,
  bulkDiscounts,
  onPurchase,
  compact,
}: MarketItemRowProps): JSX.Element {
  const [quantity, setQuantity] = useState(1);

  // Calculate price with discount
  const { finalPrice, discountApplied } = applyBulkDiscount(
    item.basePrice,
    quantity,
    bulkDiscounts
  );

  const canAfford = finalPrice <= playerGold;
  const hasStock = quantity <= stock;
  const canPurchase = canAfford && hasStock && quantity > 0;

  const handlePurchase = useCallback(() => {
    if (canPurchase) {
      onPurchase(quantity, finalPrice);
      setQuantity(1);
    }
  }, [canPurchase, quantity, finalPrice, onPurchase]);

  return (
    <div
      style={{
        padding: compact ? '8px' : '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '4px',
        marginBottom: '8px',
      }}
    >
      {/* Item Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: compact ? '20px' : '24px' }} role="img" aria-label={item.name}>
          {item.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: compact ? '13px' : '14px',
              fontWeight: 600,
              color: 'rgb(240, 239, 228)',
            }}
          >
            {item.name}
          </div>
          <div
            style={{
              fontSize: compact ? '10px' : '11px',
              color: 'rgba(240, 239, 228, 0.6)',
            }}
          >
            {item.description}
          </div>
        </div>
        <div
          style={{
            fontSize: compact ? '11px' : '12px',
            color: 'rgba(240, 239, 228, 0.7)',
          }}
        >
          Stock: {stock}
        </div>
      </div>

      {/* Price and Quantity Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'space-between',
        }}
      >
        {/* Quantity Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            style={{
              width: compact ? '24px' : '28px',
              height: compact ? '24px' : '28px',
              backgroundColor: 'rgba(240, 239, 228, 0.1)',
              border: '1px solid rgba(240, 239, 228, 0.3)',
              borderRadius: '4px',
              color: 'rgb(240, 239, 228)',
              cursor: quantity > 1 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: quantity > 1 ? 1 : 0.5,
            }}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={stock}
            style={{
              width: compact ? '40px' : '50px',
              height: compact ? '24px' : '28px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(240, 239, 228, 0.3)',
              borderRadius: '4px',
              color: 'rgb(240, 239, 228)',
              textAlign: 'center',
              fontSize: compact ? '12px' : '13px',
            }}
            aria-label="Quantity"
          />
          <button
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            disabled={quantity >= stock}
            style={{
              width: compact ? '24px' : '28px',
              height: compact ? '24px' : '28px',
              backgroundColor: 'rgba(240, 239, 228, 0.1)',
              border: '1px solid rgba(240, 239, 228, 0.3)',
              borderRadius: '4px',
              color: 'rgb(240, 239, 228)',
              cursor: quantity < stock ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: quantity < stock ? 1 : 0.5,
            }}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Price Display */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: compact ? '14px' : '16px',
              fontWeight: 600,
              color: canAfford ? 'rgb(201, 162, 39)' : 'rgb(239, 68, 68)',
            }}
          >
            {Math.floor(finalPrice)}g
          </div>
          {discountApplied > 0 && (
            <div
              style={{
                fontSize: '10px',
                color: 'rgb(34, 197, 94)',
              }}
            >
              {Math.floor(discountApplied * 100)}% off
            </div>
          )}
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={!canPurchase}
          style={{
            padding: compact ? '4px 12px' : '6px 16px',
            backgroundColor: canPurchase
              ? 'rgb(141, 179, 165)'
              : 'rgba(240, 239, 228, 0.1)',
            color: canPurchase ? '#050509' : 'rgba(240, 239, 228, 0.3)',
            border: 'none',
            borderRadius: '4px',
            fontSize: compact ? '11px' : '12px',
            fontWeight: 600,
            cursor: canPurchase ? 'pointer' : 'not-allowed',
            opacity: canPurchase ? 1 : 0.5,
            transition: 'all 0.2s ease',
          }}
          aria-label={`Buy ${quantity} ${item.name}`}
        >
          Buy
        </button>
      </div>

      {/* Validation Messages */}
      {!canAfford && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '10px',
            color: 'rgb(239, 68, 68)',
          }}
        >
          ⚠️ Insufficient gold
        </div>
      )}
      {!hasStock && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '10px',
            color: 'rgb(239, 68, 68)',
          }}
        >
          ⚠️ Not enough stock
        </div>
      )}
    </div>
  );
}

/**
 * Market Card Component
 * 
 * Displays market with:
 * - Item list with prices
 * - Stock tracking
 * - Bulk discount display
 * - Purchase controls
 * 
 * Uses config-first design with no hardcoded values.
 */
export function MarketCard({
  config,
  playerGold,
  currentStock,
  onPurchase,
  compact = false,
  className = '',
}: MarketCardProps): JSX.Element {
  const handleItemPurchase = useCallback(
    (itemId: string) => (quantity: number, finalPrice: number) => {
      if (onPurchase) {
        onPurchase(itemId, quantity, finalPrice);
      }
    },
    [onPurchase]
  );

  return (
    <div
      className={`market-card ${className}`}
      style={{
        backgroundColor: config.visual.backgroundColor,
        borderColor: config.visual.color,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '8px',
        padding: compact ? '12px' : '16px',
        minWidth: compact ? '280px' : '360px',
        maxWidth: '480px',
      }}
      role="region"
      aria-label={`${config.name} - Purchase items with gold`}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontSize: compact ? '24px' : '32px',
          }}
          role="img"
          aria-label="Market icon"
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
            Your gold: {Math.floor(playerGold)}g
          </p>
        </div>
      </div>

      {/* Bulk Discount Info */}
      {config.bulkDiscounts.length > 0 && (
        <div
          style={{
            padding: '8px',
            backgroundColor: 'rgba(141, 179, 165, 0.1)',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(240, 239, 228, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}
          >
            Bulk Discounts
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {config.bulkDiscounts.map((discount, index) => (
              <span
                key={index}
                style={{
                  fontSize: '11px',
                  color: 'rgb(141, 179, 165)',
                }}
              >
                {discount.minQuantity}+ items: {Math.floor(discount.discountPercent * 100)}% off
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Item List */}
      <div>
        {config.priceList.map((item) => (
          <MarketItemRow
            key={item.itemId}
            item={item}
            stock={currentStock[item.itemId] ?? 0}
            playerGold={playerGold}
            bulkDiscounts={config.bulkDiscounts}
            onPurchase={handleItemPurchase(item.itemId)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

export default MarketCard;
