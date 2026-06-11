/**
 * MinimalJobPoiRosterIntegrationPage — Fase 5: Job POI + Roster Integration
 *
 * Pagina di integrazione che mostra il Job POI (Chop Wood) con il roster drag & drop.
 * Monta JobPoiRosterIntegrationPage che contiene l'integrazione completa.
 *
 * Documentazione:
 * - src/docs/docs/idle_village/trusted/roster_trusted_components.md
 * - src/balancing/config/idleVillage/defaultConfig (job_chop_wood)
 */

import React from 'react';
import { JobPoiRosterIntegrationPage } from '@/ui/idleVillage/pages/JobPoiRosterIntegrationPage';

/**
 * MinimalJobPoiRosterIntegrationPage
 *
 * Layout:
 * ┌────────────────────────────────────────┐
 * │ Title: Fase 5 - Job POI + Roster        │
 * ├────────────────────────────────────────┤
 * │ Description & Spec Box                 │
 * ├────────────────────────────────────────┤
 * │ [JobPoiRosterIntegrationPage montato]   │
 * │ - Job POI (Chop Wood) con detail        │
 * │ - Roster con PgTokenDraggable           │
 * │ - Drag & drop per assegnazione          │
 * │ - Bloom effect su drop                  │
 * └────────────────────────────────────────┘
 */
export default function MinimalJobPoiRosterIntegrationPage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Fase 5: Job POI + Roster Integration
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Integrazione Job POI (Chop Wood) con roster drag & drop per assegnazione residenti
          </p>
        </div>

        {/* Description Box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            📋 Integration Spec
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <strong>Componenti:</strong> JobPoiRosterIntegrationPage + PoiDetailSkinWrapper + SlottedMedal
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
              <strong>Bloom Effect:</strong> Visual feedback quando si trascina sopra il POI
            </li>
            <li>
              <strong>Assignment Logic:</strong> State locale per assegnazione resident → job
            </li>
            <li>
              <strong>Telemetry:</strong> Eventi per drag start, drag end, assignment, removal
            </li>
          </ul>
        </div>

        {/* JobPoiRosterIntegrationPage Mounted Here */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🪓👥 JobPoiRosterIntegrationPage (Integration Harness)
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p>Questa pagina monta JobPoiRosterIntegrationPage che contiene:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Job POI (Chop Wood) con PoiDetailSkinWrapper</li>
              <li>• Roster con PgTokenDraggable (TEST_ROSTER_HEROES)</li>
              <li>• Drag & drop per assegnare residenti al job</li>
              <li>• Bloom effect verde quando si trascina sopra il POI</li>
              <li>• Display resident assegnato con pulsante Remove</li>
              <li>• Detail view toggle per POI detail</li>
              <li>• Telemetry events per tutte le interazioni</li>
            </ul>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <JobPoiRosterIntegrationPage />
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
                <li>✓ Navigate to /minimal-job-poi-roster-integration</li>
                <li>✓ Job POI mostra Chop Wood configuration</li>
                <li>✓ Roster mostra tutti i residenti disponibili</li>
                <li>✓ Trascina resident sul POI → bloom effect verde</li>
                <li>✓ Rilascia → resident assegnato al job</li>
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
          <p>Fase 5 di 6 — Job POI + Roster Integration</p>
          <p>Basato su roster_trusted_components.md + IdleVillageConfig</p>
        </div>
      </div>
    </div>
  );
}
