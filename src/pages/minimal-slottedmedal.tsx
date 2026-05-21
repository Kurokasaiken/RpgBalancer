import React from 'react';
import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * MinimalSlottedMedalPage
 *
 * Isolated test page for SlottedMedal component.
 * Shows 5 residents with different levels, statuses, and injuries.
 *
 * Purpose: Verify SlottedMedal rendering (circular token variant)
 * Route: /minimal-slottedmedal
 * Spec: src/docs/docs/minimal_slice/02_slottedmedal.md
 */

// Same mock residents as PgCard
const mockResidents: ResidentState[] = [
  {
    id: 'res_001',
    name: 'Elara the Scout',
    portraitUrl: 'https://via.placeholder.com/100/FF6B6B/FFFFFF?text=Elara',
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
    portraitUrl: 'https://via.placeholder.com/100/4ECDC4/FFFFFF?text=Ragnar',
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
  {
    id: 'res_003',
    name: 'Lyra the Sage',
    portraitUrl: 'https://via.placeholder.com/100/95E1D3/FFFFFF?text=Lyra',
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
  {
    id: 'res_004',
    name: 'Theron the Merchant',
    portraitUrl: 'https://via.placeholder.com/100/F38181/FFFFFF?text=Theron',
    status: 'busy',
    isInjured: false,
    isHero: false,
    level: 1,
    currentHp: 50,
    maxHp: 100,
    fatigue: 30,
    survivalScore: 6,
    statSnapshot: { str: 11, dex: 13, con: 12, int: 14, wis: 12, cha: 15 },
  },
  {
    id: 'res_005',
    name: 'Very Long Name Test',
    portraitUrl: 'https://via.placeholder.com/100/AA96DA/FFFFFF?text=LongName',
    status: 'available',
    isInjured: true,
    isHero: false,
    level: 2,
    currentHp: 30,
    maxHp: 80,
    fatigue: 95,
    survivalScore: 7,
    statSnapshot: { str: 12, dex: 11, con: 10, int: 12, wis: 11, cha: 10 },
  },
];

export function MinimalSlottedMedalPage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>SlottedMedal Isolated Component Test</h1>
      <p style={styles.subtitle}>
        Route: /minimal-slottedmedal | Spec: src/docs/docs/minimal_slice/02_slottedmedal.md
      </p>

      <div style={styles.grid}>
        {mockResidents.map((resident) => (
          <div key={resident.id} style={styles.medalWrapper}>
            <SlottedMedal
              id={resident.id}
              type={resident.level === 1 ? 'bronze' : resident.level === 2 ? 'silver' : resident.level === 3 ? 'gold' : 'platinum'}
              residentId={resident.id}
              isActive={resident.status === 'available'}
              skinPreset="minimal"
              data-testid={`slottedmedal-${resident.id}`}
            />
            <div style={styles.label}>{resident.name}</div>
            <div style={styles.sublabel}>Lv {resident.level} | {resident.status}</div>
          </div>
        ))}
      </div>

      <div style={styles.info}>
        <h2>Test Information</h2>
        <ul>
          <li><strong>Component:</strong> SlottedMedal (src/ui/idleVillage/components/SlottedMedal.tsx)</li>
          <li><strong>Test Cases:</strong> 30 (identical structure to PgCard, circular variant)</li>
          <li><strong>Test File:</strong> tests/e2e/minimal_slice_02_slottedmedal.spec.ts</li>
          <li><strong>Spec Doc:</strong> src/docs/docs/minimal_slice/02_slottedmedal.md</li>
          <li><strong>Expected Duration:</strong> 3-4 minutes (all tests)</li>
          <li><strong>Difference from PgCard:</strong> Circular shape, optimized for slots</li>
        </ul>

        <h3>Visual Differences</h3>
        <ul>
          <li><strong>Shape:</strong> Circular (border-radius: 50%) vs. Rectangular</li>
          <li><strong>Use Case:</strong> Used in ResidentSlotRack (slot display)</li>
          <li><strong>Optional Halo:</strong> May have glow when selected/active</li>
          <li><strong>Same Features:</strong> Portrait, rarity ring, status icons, tooltip</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem',
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  medalWrapper: {
    textAlign: 'center',
  } as React.CSSProperties,
  label: {
    marginTop: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#333',
  } as React.CSSProperties,
  sublabel: {
    fontSize: '0.8rem',
    color: '#999',
    marginTop: '0.25rem',
  } as React.CSSProperties,
  info: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
};
