/**
 * MinimalRosterSlotIntegrationPage — Fase 6: Roster + SlotRack Integration
 *
 * Pagina di integrazione che mostra il roster e gli slot rack insieme
 * per verificare il funzionamento completo del drag & drop.
 *
 * Questa pagina monta TestRosterPage che contiene già l'integrazione completa
 * tra VillageRosterSection e ResidentSlotRack con validazione drag & drop.
 *
 * Documentazione:
 * - src/docs/docs/idle_village/roster_slot_integration_spec.md
 * - src/docs/docs/idle_village/roster_slot_interaction_documentation.md
 *
 * Test Suite:
 * - tests/integration/roster-slotRack.spec.ts (18 tests)
 */

import React from 'react';
import TestRosterPage from '@/ui/idleVillage/TestRosterPage';

/**
 * MinimalRosterSlotIntegrationPage
 *
 * Layout:
 * ┌────────────────────────────────────────┐
 * │ Title: Fase 6 - Roster + SlotRack      │
 * ├────────────────────────────────────────┤
 * │ Description & Spec Box                 │
 * ├────────────────────────────────────────┤
 * │ [TestRosterPage montato qui]           │
 * │ - Roster a sinistra                    │
 * │ - Slot Rack A (open)                   │
 * │ - Slot Rack B (restricted, HP≥200)    │
 * └────────────────────────────────────────┘
 */
export default function MinimalRosterSlotIntegrationPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Fase 6: Roster + SlotRack Integration
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Test completo drag & drop dal roster agli slot con validazione
          </p>
        </div>

        {/* Description Box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📋 Integration Spec
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <strong>Componenti:</strong> VillageRosterSection + ResidentSlotRack
            </li>
            <li>
              <strong>Drag & Drop:</strong> @dnd-kit con pointerWithin collision detection
            </li>
            <li>
              <strong>Scenari:</strong> 2 rack (open, restricted con HP≥200)
            </li>
            <li>
              <strong>Validazione:</strong> Custom validator + useResidentDropValidation
            </li>
            <li>
              <strong>Guard System:</strong> 6 livelli di protezione contro ghost clicks
            </li>
            <li>
              <strong>Documentazione:</strong> roster_slot_integration_spec.md
            </li>
          </ul>
        </div>

        {/* TestRosterPage Mounted Here */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🎮 TestRosterPage (Integration Harness)
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>Questa pagina monta TestRosterPage che contiene:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Roster con PgCard draggable</li>
              <li>• Slot Rack A (open) - accetta qualsiasi residente</li>
              <li>• Slot Rack B (restricted) - richiede HP ≥ 200</li>
              <li>• Validazione drag & drop completa</li>
              <li>• Sistema di guard contro ghost clicks</li>
            </ul>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <TestRosterPage />
          </div>
        </div>

        {/* Test Coverage Info */}
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6 border border-purple-200 dark:border-purple-700 mb-8">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
            ✅ Test Coverage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800 dark:text-purple-200">
            <div>
              <strong>Integration Tests (18 total):</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ TEST-044: Roster renders draggable items</li>
                <li>✓ TEST-045: SlotRack renders drop targets</li>
                <li>✓ TEST-046: Draggable items have dnd-kit attributes</li>
                <li>✓ TEST-047: Drop targets are accessible</li>
                <li>✓ TEST-048: Both components render together</li>
                <li>✓ TEST-049-053: Drag end event handling</li>
                <li>✓ TEST-054-058: Resident state updates</li>
                <li>✓ TEST-059-061: Freezing & spring-return</li>
              </ul>
            </div>
            <div>
              <strong>Manual Verification:</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ Navigate to /minimal-roster-slot-integration</li>
                <li>✓ Roster appears on left with PgCards</li>
                <li>✓ Slot Rack A (open) appears</li>
                <li>✓ Slot Rack B (restricted) appears</li>
                <li>✓ Drag resident from roster to slot</li>
                <li>✓ HP validation works (restricted rack)</li>
                <li>✓ Drop outside triggers return animation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📚 Documentation
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>
              <strong>Integration Spec:</strong>{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                src/docs/docs/idle_village/roster_slot_integration_spec.md
              </code>
            </li>
            <li>
              <strong>Interaction Documentation:</strong>{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                src/docs/docs/idle_village/roster_slot_interaction_documentation.md
              </code>
            </li>
            <li>
              <strong>Test Suite:</strong>{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                tests/integration/roster-slotRack.spec.ts
              </code>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Fase 6 di 6 — Vertical Slice Integration Complete</p>
          <p>Basato su roster_slot_integration_spec.md + roster_slot_interaction_documentation.md</p>
        </div>
      </div>
    </div>
  );
}
