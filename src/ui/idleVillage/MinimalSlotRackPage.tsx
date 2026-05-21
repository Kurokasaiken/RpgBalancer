/**
 * MinimalSlotRackPage — Fase 3: ResidentSlotRack Isolato
 *
 * Pagina di test per verificare il rendering di slot rack senza drag.
 * Mostra 4 slot in griglia 2x2, vuoti e pronti per future attività.
 *
 * Spec da: COMPONENTS_SPECIFICATION.md § FASE 3: SlotRack
 * Test: TEST-032 → TEST-043 (src/ui/idleVillage/__tests__/ResidentSlotRack.unit.test.ts)
 */

import React, { useMemo } from 'react';
import { ResidentSlotRack } from '@/ui/idleVillage/roster';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

/**
 * Mock slot data per testing
 * Simula 4 slot vuoti in griglia 2x2
 */
const MOCK_SLOTS: ResidentSlotViewModel[] = [
  {
    id: 'slot-job-0',
    state: 'empty',
    occupantId: null,
    activityId: 'job-woodcutting',
    activityLabel: 'Taglia Legna',
    displayRole: 'job',
  },
  {
    id: 'slot-job-1',
    state: 'empty',
    occupantId: null,
    activityId: 'job-blacksmith',
    activityLabel: 'Forgia',
    displayRole: 'job',
  },
  {
    id: 'slot-quest-0',
    state: 'empty',
    occupantId: null,
    activityId: 'quest-forest-hunt',
    activityLabel: 'Missione: Caccia',
    displayRole: 'quest',
  },
  {
    id: 'slot-quest-1',
    state: 'empty',
    occupantId: null,
    activityId: 'quest-collect',
    activityLabel: 'Raccolta Materiali',
    displayRole: 'quest',
  },
];

/**
 * MinimalSlotRackPage
 *
 * Layout:
 * ┌────────────────────────────────────────┐
 * │ Title: Fase 3 - ResidentSlotRack       │
 * ├────────────────────────────────────────┤
 * │ Description & Spec Box                 │
 * ├────────────────────────────────────────┤
 * │ [Slot 1]  [Slot 2]                    │
 * │ Empty     Empty                        │
 * │                                        │
 * │ [Slot 3]  [Slot 4]                    │
 * │ Empty     Empty                        │
 * └────────────────────────────────────────┘
 */
export default function MinimalSlotRackPage(): React.ReactNode {
  const slots = useMemo(() => MOCK_SLOTS, []);

  const handleSlotClick = (slotId: string) => {
    console.log('Slot clicked:', slotId);
  };

  const handleSlotClear = (slotId: string) => {
    console.log('Slot cleared:', slotId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Fase 3: ResidentSlotRack Isolato
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Test rendering di 4 slot vuoti in griglia 2x2, pronti per assegnazione
          </p>
        </div>

        {/* Description Box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📋 Spec (da COMPONENTS_SPECIFICATION.md)
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <strong>Componente:</strong> ResidentSlotRack (contenitore di slot)
            </li>
            <li>
              <strong>Props:</strong> slots, layout='board', onSlotClick, onSlotClear
            </li>
            <li>
              <strong>Slot States:</strong> empty | occupied | ready_to_complete
            </li>
            <li>
              <strong>Layout:</strong> Griglia 2x2 responsiva
            </li>
            <li>
              <strong>Freezing:</strong> SlotRack è stateless, non è congelato
            </li>
            <li>
              <strong>Niente Drag:</strong> Solo visual rendering in questa fase
            </li>
          </ul>
        </div>

        {/* Slot Rack */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-12">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Activity Slots ({slots.length})
          </h3>

          {/* Actual SlotRack Component */}
          <ResidentSlotRack
            slots={slots}
            layout="board"
            onSlotClick={handleSlotClick}
            onSlotClear={handleSlotClear}
            className="w-full"
            data-testid="minimal-slot-rack"
          />
        </div>

        {/* Slot Info Table */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-12">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Slot Details
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-700">
                  <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-300">
                    Slot ID
                  </th>
                  <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-300">
                    Activity
                  </th>
                  <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-300">
                    State
                  </th>
                  <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-300">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr
                    key={slot.id}
                    className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-2 font-mono text-gray-900 dark:text-gray-100">
                      {slot.id}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                      {slot.activityLabel}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          slot.state === 'empty'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            : slot.state === 'occupied'
                              ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}
                      >
                        {slot.state}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-semibold">
                        {slot.displayRole}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Coverage Info */}
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
            ✅ Test Coverage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800 dark:text-purple-200">
            <div>
              <strong>Unit Tests (12 total):</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ TEST-032: SlotRack renders 4 slots</li>
                <li>✓ TEST-033: Each slot has correct id attribute</li>
                <li>✓ TEST-034: Empty slot shows gray + "+"</li>
                <li>✓ TEST-035: Occupied slot shows card</li>
                <li>✓ TEST-036: Ready slot shows green highlight</li>
                <li>✓ TEST-037-038: Grid layout responsive</li>
              </ul>
            </div>
            <div>
              <strong>Manual Verification:</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ Navigate to /minimal-slotRack</li>
                <li>✓ 4 slots in grid 2x2</li>
                <li>✓ Slots gray with "+"</li>
                <li>✓ No layout shift</li>
                <li>✓ Slot IDs visible in DOM</li>
                <li>✓ No console errors</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Fase 3 di 6 — Implementazione Incrementale Vertical Slice</p>
          <p>Basato su VERTICAL_SLICE_ROADMAP.md + VERTICAL_SLICE_IMPLEMENTATION_PLAN.md</p>
        </div>
      </div>
    </div>
  );
}
