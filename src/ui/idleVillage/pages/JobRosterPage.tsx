/**
 * JobRosterPage — Roster with PgTokenDraggable for Job Assignment
 *
 * Pagina di test che mostra il roster con PgTokenDraggable per l'assegnazione al job.
 * Riutilizza la logica di drag & drop da TestRosterPage.
 *
 * Config source: IdleVillageConfig + TEST_ROSTER_HEROES
 */

import React, { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';

/**
 * JobRosterPage
 *
 * Shows roster with draggable PgToken for job assignment
 */
export const JobRosterPage: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Convert TEST_ROSTER_HEROES to SlottedMedal props
  const rosterMedals = TEST_ROSTER_HEROES.map((hero) => ({
    id: hero.id,
    type: 'bronze' as const,
    residentId: hero.id,
    isActive: false,
  }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    trackTelemetryEvent('job_roster_drag_start', {
      residentId: event.active.id as string,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    trackTelemetryEvent('job_roster_drag_end', {
      residentId: event.active.id as string,
      dropped: !!event.over,
    });
  };

  const activeMedal = rosterMedals.find((medal) => medal.id === activeId);

  return (
    <StyleLabSurface>
      <div className="job-roster-page">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Job Roster with PgTokenDraggable
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Roster con PgToken trascinabili per assegnazione al job
          </p>
        </header>

        {/* Roster Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700 mb-6">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Roster Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <strong>Total Residents:</strong> {rosterMedals.length}
            </div>
            <div>
              <strong>Available:</strong> {rosterMedals.filter((m) => !m.isActive).length}
            </div>
            <div>
              <strong>Active:</strong> {rosterMedals.filter((m) => m.isActive).length}
            </div>
          </div>
        </div>

        {/* Roster Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Available Residents
          </h2>
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {rosterMedals.map((medal) => (
                <div
                  key={medal.id}
                  className="flex flex-col items-center gap-2"
                  data-testid={`roster-medal-${medal.id}`}
                >
                  <div className="w-20 h-20 flex items-center justify-center">
                    <SlottedMedal
                      id={medal.id}
                      type={medal.type}
                      residentId={medal.residentId}
                      isActive={medal.isActive}
                      className="w-full h-full cursor-grab active:cursor-grabbing"
                      data-testid={`pgtoken-${medal.id}`}
                    />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    {TEST_ROSTER_HEROES.find((h) => h.id === medal.id)?.name || medal.id}
                  </div>
                </div>
              ))}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeMedal ? (
                <div className="w-20 h-20 flex items-center justify-center">
                  <SlottedMedal
                    id={activeMedal.id}
                    type={activeMedal.type}
                    residentId={activeMedal.residentId}
                    isActive={activeMedal.isActive}
                    className="w-full h-full opacity-80"
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Instructions */}
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6 border border-green-200 dark:border-green-700">
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
            Instructions
          </h2>
          <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
            <li>• Trascina un PgToken dal roster sul job POI per assegnarlo</li>
            <li>• Il bloom effect appare quando trascini sopra il POI</li>
            <li>• Clicca sul POI per aprire il detail view</li>
            <li>• L'assegnazione al job viene registrata nello store</li>
          </ul>
        </div>
      </div>
    </StyleLabSurface>
  );
};
