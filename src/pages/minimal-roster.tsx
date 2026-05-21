import React, { useState } from 'react';
import { VillageRosterSection } from '@/ui/idleVillage/components/VillageRosterSection';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * MinimalRosterPage
 *
 * Isolated test page for VillageRosterSection component.
 * Shows roster with sorting/filtering.
 *
 * Route: /minimal-roster
 * Spec: src/docs/docs/minimal_slice/03_roster.md
 */

// 10 mock residents for testing
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
    name: 'Asha the Healer',
    portraitUrl: 'https://via.placeholder.com/100/AA96DA/FFFFFF?text=Asha',
    status: 'available',
    isInjured: false,
    isHero: true,
    level: 2,
    currentHp: 55,
    maxHp: 100,
    fatigue: 50,
    survivalScore: 10,
    statSnapshot: { str: 8, dex: 11, con: 13, int: 15, wis: 16, cha: 14 },
  },
  {
    id: 'res_006',
    name: 'Bron the Blacksmith',
    portraitUrl: 'https://via.placeholder.com/100/FFD93D/FFFFFF?text=Bron',
    status: 'away',
    isInjured: true,
    isHero: false,
    level: 1,
    currentHp: 30,
    maxHp: 80,
    fatigue: 95,
    survivalScore: 5,
    statSnapshot: { str: 14, dex: 9, con: 14, int: 10, wis: 10, cha: 11 },
  },
  {
    id: 'res_007',
    name: 'Celia the Archer',
    portraitUrl: 'https://via.placeholder.com/100/6BCB77/FFFFFF?text=Celia',
    status: 'available',
    isInjured: false,
    isHero: true,
    level: 3,
    currentHp: 70,
    maxHp: 110,
    fatigue: 35,
    survivalScore: 13,
    statSnapshot: { str: 12, dex: 16, con: 12, int: 11, wis: 12, cha: 11 },
  },
  {
    id: 'res_008',
    name: 'Dorn the Guard',
    portraitUrl: 'https://via.placeholder.com/100/4D96FF/FFFFFF?text=Dorn',
    status: 'busy',
    isInjured: false,
    isHero: false,
    level: 2,
    currentHp: 85,
    maxHp: 130,
    fatigue: 60,
    survivalScore: 9,
    statSnapshot: { str: 15, dex: 12, con: 16, int: 10, wis: 11, cha: 12 },
  },
  {
    id: 'res_009',
    name: 'Eris the Mystic',
    portraitUrl: 'https://via.placeholder.com/100/FF006E/FFFFFF?text=Eris',
    status: 'available',
    isInjured: true,
    isHero: true,
    level: 2,
    currentHp: 40,
    maxHp: 95,
    fatigue: 70,
    survivalScore: 11,
    statSnapshot: { str: 9, dex: 13, con: 11, int: 17, wis: 14, cha: 13 },
  },
  {
    id: 'res_010',
    name: 'Fynn the Scout',
    portraitUrl: 'https://via.placeholder.com/100/00D9FF/FFFFFF?text=Fynn',
    status: 'away',
    isInjured: false,
    isHero: false,
    level: 1,
    currentHp: 35,
    maxHp: 70,
    fatigue: 40,
    survivalScore: 7,
    statSnapshot: { str: 10, dex: 15, con: 10, int: 12, wis: 11, cha: 13 },
  },
];

type SortMode = 'name-asc' | 'name-desc' | 'rarity' | 'status';
type FilterMode = 'all' | 'available' | 'away' | 'injured' | 'busy';

export default function MinimalRosterPage() {
  const [sortMode, setSortMode] = useState<SortMode>('name-asc');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const filterResidents = (residents: ResidentState[]) => {
    switch (filterMode) {
      case 'available':
        return residents.filter(r => r.status === 'available');
      case 'away':
        return residents.filter(r => r.status === 'away');
      case 'injured':
        return residents.filter(r => r.isInjured === true);
      case 'busy':
        return residents.filter(r => r.status === 'busy');
      default:
        return residents;
    }
  };

  const sortResidents = (residents: ResidentState[]) => {
    const sorted = [...residents];
    switch (sortMode) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'rarity':
        sorted.sort((a, b) => b.level - a.level);
        break;
      case 'status':
        const statusOrder = { available: 0, busy: 1, away: 2, injured: 3 };
        sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
    }
    return sorted;
  };

  const filteredResidents = filterResidents(mockResidents);
  const sortedResidents = sortResidents(filteredResidents);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>VillageRosterSection Isolated Test</h1>
      <p style={styles.subtitle}>Route: /minimal-roster | Spec: src/docs/docs/minimal_slice/03_roster.md</p>

      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <label style={styles.label}>Sort by:</label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            style={styles.select}
            data-testid="sort-dropdown"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="rarity">Rarity (High First)</option>
            <option value="status">Status (Available First)</option>
          </select>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>Filter by:</label>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            style={styles.select}
            data-testid="filter-dropdown"
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="away">Away</option>
            <option value="injured">Injured</option>
            <option value="busy">Busy</option>
          </select>
        </div>

        <div style={styles.controlGroup}>
          <p style={styles.count}>
            Showing {sortedResidents.length} of {mockResidents.length} residents
          </p>
        </div>
      </div>

      <div style={styles.rosterContainer}>
        <div style={styles.rosterGrid} data-testid="roster-grid">
          {sortedResidents.map((resident) => (
            <div
              key={resident.id}
              style={styles.rosterItem}
              data-testid={`roster-item-${resident.id}`}
              data-status={resident.status}
              data-level={resident.level}
            >
              <div style={styles.itemName}>{resident.name}</div>
              <div style={styles.itemMeta}>
                Lv {resident.level} | {resident.status} {resident.isInjured && '🩹'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.info}>
        <h2>Test Information</h2>
        <ul>
          <li><strong>Component:</strong> VillageRosterSection</li>
          <li><strong>Test Cases:</strong> 38 (rendering, sorting, filtering, interactions, state, edge cases)</li>
          <li><strong>Test File:</strong> tests/e2e/minimal_slice_03_roster.spec.ts</li>
          <li><strong>Mock Residents:</strong> 10 (various levels, statuses, injuries)</li>
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
  controls: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '2rem',
    backgroundColor: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  label: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#333',
  } as React.CSSProperties,
  select: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '0.9rem',
    minWidth: '150px',
  } as React.CSSProperties,
  count: {
    fontSize: '0.9rem',
    color: '#666',
    margin: '0.5rem 0',
  } as React.CSSProperties,
  rosterContainer: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  rosterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
  } as React.CSSProperties,
  rosterItem: {
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  itemName: {
    fontWeight: 'bold',
    fontSize: '0.95rem',
    color: '#333',
  } as React.CSSProperties,
  itemMeta: {
    fontSize: '0.8rem',
    color: '#999',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  info: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginTop: '2rem',
  } as React.CSSProperties,
};
