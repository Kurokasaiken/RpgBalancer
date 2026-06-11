/**
 * MinimalJobPoiRosterTimeIntegrationPage — Fase 6: Job POI + Roster + Time Engine + Rewards
 *
 * Pagina di integrazione che mostra il Job POI (Chop Wood) con roster drag & drop,
 * time engine con controlli, e visualizzazione dei reward automatici.
 *
 * Documentazione:
 * - src/docs/docs/idle_village/trusted/roster_trusted_components.md
 * - src/balancing/config/idleVillage/defaultConfig (job_chop_wood)
 * - src/docs/docs/idle_village/trusted/time_engine_trusted.md
 */

import React from 'react';
import { JobPoiRosterTimeIntegrationPage } from '@/ui/idleVillage/pages/JobPoiRosterTimeIntegrationPage';

/**
 * MinimalJobPoiRosterTimeIntegrationPage
 *
 * Layout:
 * ┌────────────────────────────────────────┐
 * │ Title: Fase 6 - Job POI + Roster + Time│
 * ├────────────────────────────────────────┤
 * │ Description & Spec Box                 │
 * ├────────────────────────────────────────┤
 * │ [JobPoiRosterTimeIntegrationPage montato]│
 * │ - Job POI (Chop Wood) con detail        │
 * │ - Roster con PgTokenDraggable           │
 * │ - Drag & drop per assegnazione          │
 * │ - Time Engine con controlli              │
 * │ - Visualizzazione reward automatici      │
 * └────────────────────────────────────────┘
 */
export default function MinimalJobPoiRosterTimeIntegrationPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Fase 6: Job POI + Roster + Time Engine + Rewards
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Integrazione completa con time engine e visualizzazione reward automatici
          </p>
        </div>

        {/* Description Box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📋 Integration Spec
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <strong>Componenti:</strong> JobPoiRosterTimeIntegrationPage + PoiDetailSkinWrapper + SlottedMedal + Time Engine
            </li>
            <li>
              <strong>Job:</strong> Chop Wood (job_chop_wood da IdleVillageConfig)
            </li>
            <li>
              <strong>Roster:</strong> TEST_ROSTER_HEROES con PgTokenDraggable
            </li>
            <li>
              <strong>Drag & Drop:</strong> dnd-kit per assegnazione resident → job
            </li>
            <li>
              <strong>Time Engine:</strong> Controlli speed, pause, advance time
            </li>
            <li>
              <strong>Rewards:</strong> Visualizzazione automatici generati dal time engine
            </li>
            <li>
              <strong>Telemetry:</strong> Eventi per drag start, drag end, assignment, time controls
            </li>
          </ul>
        </div>

        {/* JobPoiRosterTimeIntegrationPage Mounted Here */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🪓👥⏱️💰 JobPoiRosterTimeIntegrationPage (Integration Harness)
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>Questa pagina monta JobPoiRosterTimeIntegrationPage che contiene:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Job POI (Chop Wood) con PoiDetailSkinWrapper</li>
              <li>• Roster con PgTokenDraggable (TEST_ROSTER_HEROES)</li>
              <li>• Drag & drop per assegnare residenti al job</li>
              <li>• Bloom effect verde quando si trascina sopra il POI</li>
              <li>• Time Engine con controlli (speed, pause, advance)</li>
              <li>• Visualizzazione reward automatici generati</li>
              <li>• Display resident assegnato con pulsante Remove</li>
              <li>• Detail view toggle per POI detail</li>
              <li>• Telemetry events per tutte le interazioni</li>
            </ul>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <JobPoiRosterTimeIntegrationPage />
          </div>
        </div>

        {/* Test Coverage Info */}
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6 border border-purple-200 dark:border-purple-700 mb-8">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
            ✅ Test Coverage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800 dark:text-purple-200">
            <div>
              <strong>Manual Verification:</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ Navigate to /minimal-job-poi-roster-time-integration</li>
                <li>✓ Job POI mostra Chop Wood configuration</li>
                <li>✓ Roster mostra tutti i residenti disponibili</li>
                <li>✓ Trascina resident sul POI → bloom effect verde</li>
                <li>✓ Rilascia → resident assegnato al job</li>
                <li>✓ Usa controlli Time Engine per avanzare il tempo</li>
                <li>✓ Reward automatici appaiono nel pannello Rewards</li>
                <li>✓ Detail view mostra slot occupato</li>
                <li>✓ Pulsante Remove rimuove assegnazione</li>
                <li>✓ Telemetry events emessi correttamente</li>
              </ul>
            </div>
            <div>
              <strong>E2E Tests:</strong>
              <ul className="mt-2 space-y-1 ml-4">
                <li>✓ Rendering page e componenti</li>
                <li>✓ Drag & drop assegnazione</li>
                <li>✓ Bloom effect su drag over</li>
                <li>✓ Time Engine controls</li>
                <li>✓ Reward visualization</li>
                <li>✓ Detail view toggle</li>
                <li>✓ Remove assignment</li>
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
              <strong>Roster Trusted Components:</strong>{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                src/docs/docs/idle_village/roster_trusted_components.md
              </code>
            </li>
            <li>
              <strong>Time Engine Trusted:</strong>{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                src/docs/docs/idle_village/trusted/time_engine_trusted.md
              </code>
            </li>
            <li>
              <strong>Job Config:</strong>{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                src/balancing/config/idleVillage/defaultConfig (job_chop_wood)
              </code>
            </li>
            <li>
              <strong>Drag & Drop:</strong>{' '}
              <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                @dnd-kit/core
              </code>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Fase 6 di 6 — Job POI + Roster + Time Engine + Rewards</p>
          <p>Basato su roster_trusted_components.md + time_engine_trusted.md + IdleVillageConfig</p>
        </div>
      </div>
    </div>
  );
}
