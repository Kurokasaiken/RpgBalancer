/**
 * JobPoiRosterIntegrationPage — Integration: POI Job Detail + Roster with Drag & Drop
 *
 * Pagina di integrazione che unisce il POI job detail con il roster drag & drop.
 * Permette di trascinare residenti sul job POI per assegnarli.
 *
 * Features:
 * - POI job detail (Chop Wood) con PoiDetailSkinWrapper
 * - Roster con PgTokenDraggable
 * - Drag & drop per assegnare residenti al job
 * - Bloom effect quando si trascina sopra il POI
 * - Logica di assegnazione resident → job
 */

import React, { useState } from 'react';
import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';
import { PoiDetailSkinWrapper } from '@/ui/idleVillage/components/PoiDetailSkinWrapper';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';

/**
 * JobPoiRosterIntegrationPage
 *
 * Integration page for POI job detail + roster with drag & drop
 */
export const JobPoiRosterIntegrationPage: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [assignedResident, setAssignedResident] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const jobConfig = DEFAULT_IDLE_VILLAGE_CONFIG.activities.job_chop_wood;

  // Convert TEST_ROSTER_HEROES to SlottedMedal props
  const rosterMedals = TEST_ROSTER_HEROES.map((hero) => ({
    id: hero.id,
    type: 'bronze' as const,
    residentId: hero.id,
    isActive: hero.id === assignedResident,
  }));

  // Setup droppable for job POI
  const { setNodeRef, isOver } = useDroppable({
    id: 'job-poi-drop-zone',
    data: {
      accepts: ['resident'],
      jobId: jobConfig.id,
    },
  });

  // Track drag over state for bloom effect
  React.useEffect(() => {
    setIsDraggingOver(isOver);
  }, [isOver]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    trackTelemetryEvent('job_poi_roster_drag_start', {
      residentId: event.active.id as string,
      jobId: jobConfig.id,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDraggingOver(false);

    if (over && over.id === 'job-poi-drop-zone') {
      const residentId = active.id as string;
      setAssignedResident(residentId);
      trackTelemetryEvent('job_poi_roster_assigned', {
        residentId,
        jobId: jobConfig.id,
      });
    } else {
      trackTelemetryEvent('job_poi_roster_drag_cancelled', {
        residentId: active.id as string,
        jobId: jobConfig.id,
      });
    }
  };

  const handleRemoveAssignment = () => {
    if (assignedResident) {
      trackTelemetryEvent('job_poi_roster_removed', {
        residentId: assignedResident,
        jobId: jobConfig.id,
      });
      setAssignedResident(null);
    }
  };

  const activeMedal = rosterMedals.find((medal) => medal.id === activeId);
  const assignedHero = assignedResident ? TEST_ROSTER_HEROES.find((h) => h.id === assignedResident) : null;

  return (
    <StyleLabSurface>
      <div className="job-poi-roster-integration-page">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Job POI + Roster Integration
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Integrazione POI job detail con roster drag & drop per assegnazione residenti
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Job POI */}
          <div className="space-y-6">
            {/* Job POI Card */}
            <div
              ref={setNodeRef}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 border-2 transition-all duration-200 ${
                isDraggingOver
                  ? 'border-green-400 ring-4 ring-green-400/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                🪓 Job: Chop Wood
              </h2>

              {/* Assigned Resident Display */}
              {assignedHero ? (
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-700 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                        {assignedHero.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-green-900 dark:text-green-100">
                          {assignedHero.name}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          Assigned to job
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveAssignment}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {isDraggingOver ? 'Drop to assign' : 'Drag a resident here to assign'}
                  </p>
                </div>
              )}

              {/* Job Details */}
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <strong>ID:</strong> {jobConfig.id}
                </div>
                <div>
                  <strong>Level:</strong> {jobConfig.level}
                </div>
                <div>
                  <strong>Danger Rating:</strong> {jobConfig.dangerRating} (Safe)
                </div>
                <div>
                  <strong>Duration:</strong> {jobConfig.durationFormula} tick(s)
                </div>
                <div>
                  <strong>Daily Fatigue Cost:</strong> {jobConfig.dailyFatigueCost}
                </div>
              </div>

              {/* Detail Toggle */}
              <div className="mt-4">
                <button
                  onClick={() => setShowDetail(!showDetail)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                >
                  {showDetail ? 'Hide Detail' : 'Show Detail'}
                </button>
              </div>

              {/* POI Detail */}
              {showDetail && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <PoiDetailSkinWrapper
                    activityId={jobConfig.id}
                    name={jobConfig.label}
                    type="job"
                    subtitle="Production Job - Woodcutting"
                    status={assignedResident ? 'in-progress' : 'idle'}
                    progress={0}
                    duration={parseInt(jobConfig.durationFormula) * 1000}
                    elapsed={0}
                    slots={assignedResident ? [{ id: assignedResident, state: 'active', initial: assignedHero?.name.charAt(0) || 'R', progress: 0 }] : []}
                    maxSlots={jobConfig.maxSlots === 'infinite' ? 99 : jobConfig.maxSlots}
                    durationDisplay={`${jobConfig.durationFormula}s`}
                    rewardDisplay="Wood + XP"
                    etaDisplay={`${jobConfig.durationFormula}s`}
                    telemetry={[]}
                    isOpen={true}
                    onStart={() => {
                      trackTelemetryEvent('job_poi_detail_start', {
                        jobId: jobConfig.id,
                        residentId: assignedResident,
                      });
                    }}
                    onCollect={() => {
                      trackTelemetryEvent('job_poi_detail_collect', {
                        jobId: jobConfig.id,
                        residentId: assignedResident,
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Roster */}
          <div className="space-y-6">
            {/* Roster Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                👥 Available Residents
              </h2>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                <strong>Total:</strong> {rosterMedals.length} |{' '}
                <strong>Available:</strong> {rosterMedals.filter((m) => !m.isActive).length} |{' '}
                <strong>Assigned:</strong> {rosterMedals.filter((m) => m.isActive).length}
              </div>

              <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-3 gap-3">
                  {rosterMedals.map((medal) => (
                    <div
                      key={medal.id}
                      className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                        medal.isActive
                          ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
                          : 'bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700'
                      }`}
                      data-testid={`roster-medal-${medal.id}`}
                    >
                      <div className="w-16 h-16 flex items-center justify-center">
                        <SlottedMedal
                          id={medal.id}
                          type={medal.type}
                          residentId={medal.residentId}
                          isActive={medal.isActive}
                          className={`w-full h-full ${medal.isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                          data-testid={`pgtoken-${medal.id}`}
                        />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full">
                        {TEST_ROSTER_HEROES.find((h) => h.id === medal.id)?.name || medal.id}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                  {activeMedal ? (
                    <div className="w-16 h-16 flex items-center justify-center">
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
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                📋 Instructions
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• Trascina un PgToken dal roster sul job POI</li>
                <li>• Il bloom effect verde appare quando trascini sopra il POI</li>
                <li>• Rilascia per assegnare il resident al job</li>
                <li>• Clicca "Show Detail" per vedere il detail del POI</li>
                <li>• Clicca "Remove" per rimuovere l'assegnazione</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StyleLabSurface>
  );
};
