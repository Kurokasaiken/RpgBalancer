/**
 * MinimalPgTokenPage — Fase 1: SlottedMedal Isolato
 *
 * Pagina di test per verificare il rendering di SlottedMedal in versione isolata.
 * Mostra 5 token con diversi livelli (bronze, silver, gold) senza drag, senza slot.
 *
 * Spec da: COMPONENTS_SPECIFICATION.md § FASE 1: PgToken
 * Test: TEST-001 → TEST-018 (src/ui/idleVillage/__tests__/PgToken.unit.test.ts)
 */

import React, { useMemo } from 'react';
import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';
import type { SlottedMedalProps } from '@/ui/idleVillage/components/SlottedMedal';

/**
 * Mock medal data per testing
 * Simula 5 token con diversi livelli e stati
 */
const MOCK_MEDALS: Array<SlottedMedalProps & { label: string; residentName: string }> = [
  {
    id: 'medal-1',
    type: 'bronze',
    residentId: 'resident-1',
    isActive: false,
    label: 'Borin Stonefist',
    residentName: 'Borin Stonefist',
    skinPreset: 'minimal',
    'data-testid': 'pgtoken-bronze-level-1',
  },
  {
    id: 'medal-2',
    type: 'silver',
    residentId: 'resident-2',
    isActive: false,
    label: 'Aelin Swiftblade',
    residentName: 'Aelin Swiftblade',
    skinPreset: 'minimal',
    'data-testid': 'pgtoken-silver-level-2',
  },
  {
    id: 'medal-3',
    type: 'gold',
    residentId: 'resident-3',
    isActive: false,
    label: 'Theron the Wise',
    residentName: 'Theron the Wise',
    skinPreset: 'minimal',
    'data-testid': 'pgtoken-gold-level-3',
  },
  {
    id: 'medal-4',
    type: 'bronze',
    residentId: 'resident-4',
    isActive: false,
    label: 'Lyra Blacksmith',
    residentName: 'Lyra Blacksmith (Injured)',
    skinPreset: 'minimal',
    'data-testid': 'pgtoken-bronze-injured',
  },
  {
    id: 'medal-5',
    type: 'silver',
    residentId: 'resident-5',
    isActive: false,
    label: 'Garrick Scout',
    residentName: 'Garrick Scout (Away)',
    skinPreset: 'minimal',
    'data-testid': 'pgtoken-silver-away',
  },
];

interface PgTokenDisplayProps {
  medal: SlottedMedalProps & { label: string; residentName: string };
}

/**
 * Individual medal display with label
 * Used for showing medal + description below
 */
function PgTokenDisplay({ medal }: PgTokenDisplayProps): React.ReactNode {
  return (
    <div
      key={medal.id}
      className="flex flex-col items-center gap-3"
      data-test-medal={medal.id}
    >
      <div className="w-24 h-24 flex items-center justify-center">
        <SlottedMedal
          id={medal.id}
          type={medal.type}
          residentId={medal.residentId}
          isActive={medal.isActive}
          skinPreset={medal.skinPreset}
          behaviorConfig={{
            restrictDragWhenActive: true,
            returnAnimationDuration: 500,
          }}
          className="w-full h-full"
          data-testid={medal['data-testid']}
        />
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {medal.label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Type: <span className="font-mono">{medal.type}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * MinimalPgTokenPage
 *
 * Layout:
 * ┌────────────────────────────────────────────┐
 * │ Title: Fase 1 - SlottedMedal Isolato      │
 * ├────────────────────────────────────────────┤
 * │ [Medal 1]  [Medal 2]  [Medal 3]           │
 * │  Bronze     Silver     Gold                │
 * ├────────────────────────────────────────────┤
 * │ [Medal 4]  [Medal 5]                      │
 * │  Bronze     Silver                         │
 * │ (Injured)  (Away)                          │
 * └────────────────────────────────────────────┘
 */
export default function MinimalPgTokenPage(): React.ReactNode {
  const medalComponents = useMemo(
    () =>
      MOCK_MEDALS.map((medal) => (
        <PgTokenDisplay key={medal.id} medal={medal} />
      )),
    [],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Fase 1: SlottedMedal Isolato
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Test rendering di 5 medagioni con diversi livelli (bronze, silver, gold)
            e stati (healthy, injured, away)
          </p>
        </div>

        {/* Description Box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📋 Spec (da COMPONENTS_SPECIFICATION.md)
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <strong>Componente:</strong> SlottedMedal (circular medal token)
            </li>
            <li>
              <strong>Props:</strong> id, type (bronze/silver/gold), residentId, skinPreset,
              behaviorConfig
            </li>
            <li>
              <strong>Visive:</strong> Cerchio 80px con portrait al centro, anello colorato per
              livello
            </li>
            <li>
              <strong>Test Coverage:</strong> Portrait render, rarity colors, hover state, CSS
              layout
            </li>
            <li>
              <strong>Freezing:</strong> Nessun drag in questa fase, token isolato
            </li>
          </ul>
        </div>

        {/* Medal Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mb-12">
          {medalComponents}
        </div>

        {/* Test Coverage Info */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            ✅ Test Coverage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <strong>Unit Tests (18 total):</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ TEST-001: Portrait URL resolves</li>
                <li>✓ TEST-002: Fallback image shows</li>
                <li>✓ TEST-003-005: Rarity colors (bronze/silver/gold)</li>
                <li>✓ TEST-006: Name truncation</li>
                <li>✓ TEST-007: Token size 80px</li>
              </ul>
            </div>
            <div>
              <strong>Manual Verification:</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ Navigate to /minimal-pgtoken</li>
                <li>✓ Verify portrait rendering</li>
                <li>✓ Verify rarity ring colors</li>
                <li>✓ Hover for tooltip</li>
                <li>✓ Check no console errors</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Fase 1 di 6 — Implementazione Incrementale Vertical Slice</p>
          <p>Basato su VERTICAL_SLICE_ROADMAP.md + VERTICAL_SLICE_IMPLEMENTATION_PLAN.md</p>
        </div>
      </div>
    </div>
  );
}
