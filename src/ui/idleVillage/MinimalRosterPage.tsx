/**
 * MinimalRosterPage — Fase 2: VillageRosterSection + Ordinamento
 *
 * Pagina di test per verificare il rendering di roster ordinabile.
 * Mostra VillageRosterSection con dropdown per cambiare ordinamento.
 *
 * Spec da: COMPONENTS_SPECIFICATION.md § FASE 2: Roster + PgToken
 * Test: TEST-019 → TEST-031 (src/ui/idleVillage/__tests__/VillageRosterSection.unit.test.ts)
 */

import React, { useState, useMemo } from 'react';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import { sortResidents, type RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Mock resident data per testing
 * Simula 5 resident con diversi livelli e stati
 */
const MOCK_RESIDENTS: ResidentState[] = [
  {
    id: 'res-1',
    name: 'Borin Stonefist',
    type: 'artisan',
    level: 2,
    hp: 30,
    maxHp: 30,
    fatigue: 5,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/borin.jpg',
    statSnapshot: {
      strength: 15,
      perception: 10,
      wisdom: 12,
      charisma: 8,
      rarity: 2,
    },
  },
  {
    id: 'res-2',
    name: 'Aelin Swiftblade',
    type: 'hero',
    level: 1,
    hp: 25,
    maxHp: 25,
    fatigue: 2,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/aelin.jpg',
    statSnapshot: {
      strength: 12,
      perception: 14,
      wisdom: 10,
      charisma: 11,
      rarity: 1,
    },
  },
  {
    id: 'res-3',
    name: 'Theron the Wise',
    type: 'artisan',
    level: 3,
    hp: 35,
    maxHp: 35,
    fatigue: 8,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/theron.jpg',
    statSnapshot: {
      strength: 10,
      perception: 12,
      wisdom: 16,
      charisma: 13,
      rarity: 3,
    },
  },
  {
    id: 'res-4',
    name: 'Lyra Blacksmith',
    type: 'artisan',
    level: 1,
    hp: 20,
    maxHp: 20,
    fatigue: 10,
    isAway: false,
    isInjured: true,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/lyra.jpg',
    statSnapshot: {
      strength: 14,
      perception: 9,
      wisdom: 11,
      charisma: 7,
      rarity: 1,
    },
  },
  {
    id: 'res-5',
    name: 'Garrick Scout',
    type: 'hero',
    level: 2,
    hp: 28,
    maxHp: 28,
    fatigue: 3,
    isAway: true,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/garrick.jpg',
    statSnapshot: {
      strength: 11,
      perception: 15,
      wisdom: 9,
      charisma: 10,
      rarity: 2,
    },
  },
];

/**
 * MinimalRosterPage
 *
 * Layout:
 * ┌────────────────────────────────────────────┐
 * │ Title: Fase 2 - VillageRosterSection       │
 * ├────────────────────────────────────────────┤
 * │ Sort Dropdown: [Name A→Z ▼]                │
 * ├────────────────────────────────────────────┤
 * │ [Resident 1]  [Resident 2]  [Resident 3] │
 * │ [Resident 4]  [Resident 5]                │
 * ├────────────────────────────────────────────┤
 * │ Test Coverage Info                         │
 * └────────────────────────────────────────────┘
 */
export default function MinimalRosterPage(): React.ReactNode {
  const [sortMode, setSortMode] = useState<RosterSortMode>('name-asc');
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);

  const sortedResidents = useMemo(
    () => sortResidents(MOCK_RESIDENTS, sortMode),
    [sortMode]
  );

  const handleSortChange = (newMode: RosterSortMode) => {
    setSortMode(newMode);
  };

  const handleResidentSelect = (residentId: string) => {
    setSelectedResidentId(residentId);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Fase 2: VillageRosterSection + Ordinamento
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Test rendering di roster ordinabile con 5 residenti e dropdown per cambiare ordine
          </p>
        </div>

        {/* Description Box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📋 Spec (da COMPONENTS_SPECIFICATION.md)
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <strong>Componente:</strong> VillageRosterSection (wrapper per roster)
            </li>
            <li>
              <strong>Props:</strong> residents, sortMode, onSortModeChange, onResidentSelect
            </li>
            <li>
              <strong>Sort Modes:</strong> name-asc, name-desc, rarity-desc, status-available
            </li>
            <li>
              <strong>Freezing:</strong> Durante ordinamento, nessun token è draggabile
            </li>
            <li>
              <strong>Test Coverage:</strong> Sort functionality, filter logic, update timing
              &lt; 100ms
            </li>
          </ul>
        </div>

        {/* Sort Control */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-12">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Sort Mode:
          </label>
          <select
            value={sortMode}
            onChange={(e) => handleSortChange(e.target.value as RosterSortMode)}
            className="w-full max-w-xs px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="roster-sort-dropdown"
          >
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
            <option value="rarity-desc">Rarity (High → Low)</option>
            <option value="status-available">Status (Available First)</option>
          </select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Current mode: <span className="font-mono font-semibold">{sortMode}</span>
          </p>
        </div>

        {/* Roster Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-12">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Residents ({sortedResidents.length})
          </h3>
          <VillageRosterSection
            residents={sortedResidents}
            sortMode={sortMode}
            onSortModeChange={handleSortChange}
            onResidentSelect={handleResidentSelect}
            componentId="minimal-roster-test"
            cardVariant="horizontal"
            data-testid="minimal-roster-section"
          />
        </div>

        {/* Selected Resident Info */}
        {selectedResidentId && (
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700 mb-12">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Selected Resident
            </h3>
            {(() => {
              const resident = MOCK_RESIDENTS.find((r) => r.id === selectedResidentId);
              return resident ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800 dark:text-blue-200">Name:</span>
                    <p className="text-blue-900 dark:text-blue-100">{resident.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800 dark:text-blue-200">Level:</span>
                    <p className="text-blue-900 dark:text-blue-100">{resident.level}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800 dark:text-blue-200">Status:</span>
                    <p className="text-blue-900 dark:text-blue-100">
                      {resident.isInjured
                        ? 'Injured'
                        : resident.isAway
                          ? 'Away'
                          : resident.isBusy
                            ? 'Busy'
                            : 'Available'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800 dark:text-blue-200">HP:</span>
                    <p className="text-blue-900 dark:text-blue-100">
                      {resident.hp} / {resident.maxHp}
                    </p>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Test Coverage Info */}
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6 border border-green-200 dark:border-green-700">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
            ✅ Test Coverage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800 dark:text-green-200">
            <div>
              <strong>Unit Tests (12 total):</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ TEST-019: Roster renders all tokens</li>
                <li>✓ TEST-020-022: Sort modes (A-Z, Z-A, Rarity)</li>
                <li>✓ TEST-023: Update timing &lt; 100ms</li>
                <li>✓ TEST-024-026: Filtering logic</li>
              </ul>
            </div>
            <div>
              <strong>Manual Verification:</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ Navigate to /minimal-roster</li>
                <li>✓ 5+ tokens in list</li>
                <li>✓ Sort dropdown changes order</li>
                <li>✓ Verify A-Z alphabetical</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Fase 2 di 6 — Implementazione Incrementale Vertical Slice</p>
          <p>Basato su VERTICAL_SLICE_ROADMAP.md + VERTICAL_SLICE_IMPLEMENTATION_PLAN.md</p>
        </div>
      </div>
    </div>
  );
}
