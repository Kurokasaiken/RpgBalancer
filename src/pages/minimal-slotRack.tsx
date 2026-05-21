import React, { useState } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * MinimalSlotRackPage
 *
 * Isolated test page for ResidentSlotRack component.
 * Shows 6 slots with empty/occupied states.
 *
 * Route: /minimal-slotRack
 * Spec: src/docs/docs/minimal_slice/05_slotRack.md
 */

// 6 mock slots with 3 occupied
const mockSlotData: (ResidentState | null)[] = [
  {
    id: 'res_001',
    name: 'Elara the Scout',
    portraitUrl: 'https://via.placeholder.com/80/FF6B6B/FFFFFF?text=Elara',
    status: 'available',
    isInjured: false,
    isHero: false,
    level: 1,
    currentHp: 45,
    maxHp: 100,
    fatigue: 20,
    survivalScore: 8,
    statSnapshot: { str: 10, dex: 14, con: 12, int: 11, wis: 13, cha: 12 },
  },
  {
    id: 'res_002',
    name: 'Ragnar Strongarm',
    portraitUrl: 'https://via.placeholder.com/80/4ECDC4/FFFFFF?text=Ragnar',
    status: 'available',
    isInjured: true,
    isHero: true,
    level: 2,
    currentHp: 75,
    maxHp: 120,
    fatigue: 45,
    survivalScore: 12,
    statSnapshot: { str: 16, dex: 10, con: 15, int: 9, wis: 11, cha: 13 },
  },
  null,
  {
    id: 'res_003',
    name: 'Lyra the Sage',
    portraitUrl: 'https://via.placeholder.com/80/95E1D3/FFFFFF?text=Lyra',
    status: 'away',
    isInjured: false,
    isHero: true,
    level: 3,
    currentHp: 60,
    maxHp: 90,
    fatigue: 85,
    survivalScore: 14,
    statSnapshot: { str: 9, dex: 12, con: 11, int: 16, wis: 15, cha: 14 },
  },
  null,
  null,
];

export default function MinimalSlotRackPage() {
  const [slots, setSlots] = useState(mockSlotData);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const getRarityColor = (level: number): string => {
    if (level === 1) return '#CD7F32'; // Bronze
    if (level === 2) return '#C0C0C0'; // Silver
    return '#FFD700'; // Gold
  };

  const getRarityLabel = (level: number): string => {
    if (level === 1) return 'Bronze';
    if (level === 2) return 'Silver';
    return 'Gold';
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ResidentSlotRack Isolated Test</h1>
      <p style={styles.subtitle}>Route: /minimal-slotRack | Spec: src/docs/docs/minimal_slice/05_slotRack.md</p>

      <div style={styles.slotRackPanel}>
        <div style={styles.slotRack} data-testid="slot-rack-container">
          {slots.map((resident, idx) => (
            <div
              key={idx}
              style={{
                ...styles.slot,
                backgroundColor: selectedSlot === idx ? '#e8f5e9' : '#f0f0f0',
                borderColor: selectedSlot === idx ? '#4caf50' : '#ddd',
              }}
              data-testid={`slot-${idx}`}
              data-occupied={resident !== null}
              data-selected={selectedSlot === idx}
              onClick={() => setSelectedSlot(idx)}
              onMouseEnter={() => setHoveredSlot(idx)}
              onMouseLeave={() => setHoveredSlot(null)}
            >
              {resident ? (
                <div style={styles.occupiedSlot} data-testid={`slot-${idx}-resident`}>
                  <img
                    src={resident.portraitUrl}
                    alt={resident.name}
                    style={styles.portrait}
                    data-testid={`slot-${idx}-portrait`}
                  />
                  <div style={styles.rarityRing} data-testid={`slot-${idx}-rarity`}>
                    <div
                      style={{
                        ...styles.rarityBadge,
                        backgroundColor: getRarityColor(resident.level),
                      }}
                    >
                      {resident.level}
                    </div>
                  </div>

                  {resident.isHero && (
                    <div style={styles.heroStar} data-testid={`slot-${idx}-hero`}>
                      ⭐
                    </div>
                  )}

                  {resident.isInjured && (
                    <div style={styles.injuredBadge} data-testid={`slot-${idx}-injured`}>
                      🩹
                    </div>
                  )}

                  <div
                    style={{
                      ...styles.fatigueBar,
                      width: `${100 - resident.fatigue}%`,
                    }}
                    data-testid={`slot-${idx}-fatigue`}
                  />
                </div>
              ) : (
                <div style={styles.emptySlot} data-testid={`slot-${idx}-empty`}>
                  <div style={styles.emptyText}>+</div>
                </div>
              )}

              {hoveredSlot === idx && resident && (
                <div style={styles.tooltip} data-testid={`slot-${idx}-tooltip`}>
                  <strong>{resident.name}</strong>
                  <div>Lv {resident.level} ({getRarityLabel(resident.level)})</div>
                  <div>HP: {resident.currentHp}/{resident.maxHp}</div>
                  <div>Fatigue: {resident.fatigue}%</div>
                  <div>Survival: {resident.survivalScore}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.info}>
        <h2>Test Information</h2>
        <ul>
          <li><strong>Component:</strong> ResidentSlotRack</li>
          <li><strong>Test Cases:</strong> 32 (rendering, slot states, resident display, interactions, state, edge cases)</li>
          <li><strong>Test File:</strong> tests/e2e/minimal_slice_05_slotRack.spec.ts</li>
          <li><strong>Slots:</strong> 6 (3 occupied, 3 empty)</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  } as React.CSSProperties,
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: '#333',
  } as React.CSSProperties,
  subtitle: {
    color: '#666',
    marginBottom: '2rem',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  slotRackPanel: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  } as React.CSSProperties,
  slotRack: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  } as React.CSSProperties,
  slot: {
    width: '100px',
    height: '100px',
    borderRadius: '8px',
    border: '2px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  occupiedSlot: {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  portrait: {
    width: '90%',
    height: '90%',
    borderRadius: '6px',
    objectFit: 'cover',
  } as React.CSSProperties,
  rarityRing: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
  } as React.CSSProperties,
  rarityBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#fff',
    border: '2px solid #fff',
  } as React.CSSProperties,
  heroStar: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    fontSize: '1.2rem',
  } as React.CSSProperties,
  injuredBadge: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    fontSize: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '4px',
    padding: '2px 4px',
  } as React.CSSProperties,
  fatigueBar: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    height: '4px',
    backgroundColor: '#4caf50',
    borderBottomLeftRadius: '6px',
    borderBottomRightRadius: '6px',
  } as React.CSSProperties,
  emptySlot: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '2rem',
  } as React.CSSProperties,
  emptyText: {
    fontSize: '2rem',
    color: '#bbb',
  } as React.CSSProperties,
  tooltip: {
    position: 'absolute',
    bottom: '120%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: '#fff',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    zIndex: 10,
  } as React.CSSProperties,
  info: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
};
