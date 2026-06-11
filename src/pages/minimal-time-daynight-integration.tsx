/**
 * MinimalTimeDaynightIntegrationPage — Fase 4: Time Engine + Day/Night Cycle Integration
 *
 * Pagina di integrazione che mostra il Time Engine e il Day/Night Cycle insieme
 * per verificare il funzionamento completo dello scorrere del tempo.
 *
 * Questa pagina monta TimeDaynightIntegrationPage che contiene già l'integrazione completa
 * tra TimeEngine (dual-layer architecture) e DayNightPOI con controlli per il tempo.
 *
 * Documentazione:
 * - src/docs/docs/idle_village/trusted/time_engine_trusted.md
 * - src/docs/docs/idle_village/trusted/daynight_trusted.md
 *
 * Test Suite:
 * - src/engine/game/idleVillage/TimeEngine.test.ts
 * - src/ui/idleVillage/map/actionCards/DayNightActionCard.test.tsx
 */

import React from 'react';
import { TimeDaynightIntegrationPage } from '@/ui/idleVillage/pages/TimeDaynightIntegrationPage';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';

/**
 * MinimalTimeDaynightIntegrationPage
 *
 * Layout:
 * ┌────────────────────────────────────────┐
 * │ Title: Fase 4 - Time Engine + Day/Night│
 * ├────────────────────────────────────────┤
 * │ Description & Spec Box                 │
 * ├────────────────────────────────────────┤
 * │ [TimeDaynightIntegrationPage montato]  │
 * │ - Day/Night POI visualization          │
 * │ - Dual-layer time architecture         │
 * │ - Time controls (speed, pause, advance)│
 * └────────────────────────────────────────┘
 */
export default function MinimalTimeDaynightIntegrationPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Fase 4: Time Engine + Day/Night Cycle Integration
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Test completo dual-layer time architecture e day/night cycle con controlli
          </p>
        </div>

        {/* Description Box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📋 Integration Spec
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <strong>Componenti:</strong> TimeEngine + DayNightPOI + useMinimalGameplay
            </li>
            <li>
              <strong>Dual-Layer Architecture:</strong> Simulation layer (1:1) + Gameplay layer (speed multiplier)
            </li>
            <li>
              <strong>Day/Night Calculation:</strong> Derived from simulation time only
            </li>
            <li>
              <strong>Time Controls:</strong> Speed multiplier (0-10x), pause/resume, manual advance
            </li>
            <li>
              <strong>Config Source:</strong> IdleVillageConfig per tutti i valori di dominio
            </li>
            <li>
              <strong>Documentazione:</strong> time_engine_trusted.md + daynight_trusted.md
            </li>
          </ul>
        </div>

        {/* TimeDaynightIntegrationPage Mounted Here */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            ⏱️ TimeDaynightIntegrationPage (Integration Harness)
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>Questa pagina monta TimeDaynightIntegrationPage che contiene:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Day/Night POI con progress halo e phase icon</li>
              <li>• Dual-layer time architecture visualization</li>
              <li>• Simulation layer (1:1 time progression)</li>
              <li>• Gameplay layer (speed multiplied)</li>
              <li>• Time controls: speed, pause, advance</li>
              <li>• Telemetry events per transizioni</li>
            </ul>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <TimeDaynightIntegrationPage />
          </div>
        </div>

        {/* Production Job POI Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🪓 Production Job POI (Woodcutting)
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>POI che mostra come il time engine influenza i job di produzione:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Job: Chop Wood (taglialegna)</li>
              <li>• Produzione: Legna ogni X cicli</li>
              <li>• Influenzato da: Time engine, day/night cycle</li>
              <li>• Config source: IdleVillageConfig.activities.job_chop_wood</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                Job: Chop Wood
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800 dark:text-green-200">
                <div>
                  <strong>ID:</strong> {DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood.id}
                </div>
                <div>
                  <strong>Type:</strong> Job (Production)
                </div>
                <div>
                  <strong>Level:</strong> {DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood.level}
                </div>
                <div>
                  <strong>Danger Rating:</strong> {DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood.dangerRating} (Safe)
                </div>
                <div>
                  <strong>Duration:</strong> {DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood.durationFormula} tick(s)
                </div>
                <div>
                  <strong>Continuous:</strong> {DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood.continuousJob ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Auto Repeat:</strong> {DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood.supportsAutoRepeat ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Daily Fatigue Cost:</strong> {DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood.dailyFatigueCost}
                </div>
              </div>
              <div className="mt-4 text-sm">
                <strong>Description:</strong> {DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood.description}
              </div>
              <div className="mt-2 text-sm">
                <strong>Tags:</strong> {DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood.tags.join(', ')}
              </div>
              <div className="mt-2 text-sm">
                <strong>Slot Tags:</strong> {DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood.slotTags.join(', ')}
              </div>
            </div>
          </div>
        </div>

        {/* Test Coverage Info */}
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6 border border-purple-200 dark:border-purple-700 mb-8">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
            ✅ Test Coverage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800 dark:text-purple-200">
            <div>
              <strong>Unit Tests:</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ TimeEngine.test.ts - Core functionality</li>
                <li>✓ DayNightActionCard.test.tsx - UI component</li>
                <li>✓ useMinimalGameplay.test.ts - Store integration</li>
              </ul>
            </div>
            <div>
              <strong>Manual Verification:</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ Navigate to /minimal-time-daynight-integration</li>
                <li>✓ Day/Night POI shows correct phase</li>
                <li>✓ Progress halo advances smoothly</li>
                <li>✓ Speed multiplier affects gameplay layer only</li>
                <li>✓ Day/night derived from simulation time</li>
                <li>✓ Pause/resume works correctly</li>
                <li>✓ Telemetry events emitted</li>
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
              <strong>Time Engine Contract:</strong>{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                src/docs/docs/idle_village/trusted/time_engine_trusted.md
              </code>
            </li>
            <li>
              <strong>Day/Night Contract:</strong>{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                src/docs/docs/idle_village/trusted/daynight_trusted.md
              </code>
            </li>
            <li>
              <strong>Test Suite:</strong>{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                src/engine/game/idleVillage/TimeEngine.test.ts
              </code>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Fase 4 di 6 — Time Engine + Day/Night Integration</p>
          <p>Basato su time_engine_trusted.md + daynight_trusted.md</p>
        </div>
      </div>
    </div>
  );
}
