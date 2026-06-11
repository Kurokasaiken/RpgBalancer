/**
 * JobPoiRosterTimeIntegrationPage — Integration: POI + Roster + Time Engine + Rewards
 *
 * Pagina di integrazione completa che unisce POI job, roster drag & drop, time engine,
 * e visualizzazione dei reward automatici generati dal time engine.
 *
 * Features:
 * - POI job detail (Chop Wood) con PoiDetailSkinWrapper
 * - Roster con PgTokenDraggable
 * - Drag & drop per assegnare residenti al job
 * - Time Engine con controlli (speed, pause, advance)
 * - Visualizzazione dei reward automatici generati
 * - Bloom effect quando si trascina sopra il POI
 * - Logica di assegnazione resident → job
 */

import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';
import { PoiDetailSkinWrapper } from '@/ui/idleVillage/components/PoiDetailSkinWrapper';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';

/**
 * JobPoiRosterTimeIntegrationPage
 *
 * Integration page for POI + Roster + Time Engine + Rewards
 */
export const JobPoiRosterTimeIntegrationPage: React.FC = () => {
  const gameplayState = useMinimalGameplayWithIdleVillageConfig();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [assignedResident, setAssignedResident] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rewards, setRewards] = useState<Array<{ timestamp: number; resource: string; amount: number }>>([]);

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
  useEffect(() => {
    setIsDraggingOver(isOver);
  }, [isOver]);

  // Track rewards from time engine
  useEffect(() => {
    if (!gameplayState) return;

    const handleReward = (reward: any) => {
      setRewards(prev => [...prev, {
        timestamp: Date.now(),
        resource: reward.resourceId || 'unknown',
        amount: reward.amount || 0,
      }]);
    };

    // Subscribe to reward events (this would be implemented in the actual time engine)
    // For now, we'll simulate rewards when a resident is assigned and time advances
    if (assignedResident && gameplayState.state.currentTick > 0) {
      const simulatedReward = {
        resourceId: 'wood',
        amount: Math.floor(gameplayState.state.currentTick / 10) * 5, // 5 wood per 10 ticks
      };
      handleReward(simulatedReward);
    }
  }, [gameplayState?.state.currentTick, assignedResident]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    trackTelemetryEvent('job_poi_roster_time_drag_start', {
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
      trackTelemetryEvent('job_poi_roster_time_assigned', {
        residentId,
        jobId: jobConfig.id,
      });
    } else {
      trackTelemetryEvent('job_poi_roster_time_drag_cancelled', {
        residentId: active.id as string,
        jobId: jobConfig.id,
      });
    }
  };

  const handleRemoveAssignment = () => {
    if (assignedResident) {
      trackTelemetryEvent('job_poi_roster_time_removed', {
        residentId: assignedResident,
        jobId: jobConfig.id,
      });
      setAssignedResident(null);
      setRewards([]);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (gameplayState?.setSpeedMultiplier) {
      gameplayState.setSpeedMultiplier(speed);
      trackTelemetryEvent('job_poi_roster_time_speed_change', {
        speed,
        jobId: jobConfig.id,
      });
    }
  };

  const handlePauseToggle = () => {
    if (gameplayState?.state.isPaused) {
      gameplayState.resumeGame('user');
    } else {
      gameplayState.pauseGame('user');
    }
    trackTelemetryEvent('job_poi_roster_time_pause_toggle', {
      paused: !gameplayState?.state.isPaused,
      jobId: jobConfig.id,
    });
  };

  const handleAdvanceTime = () => {
    if (gameplayState?.tick) {
      gameplayState.tick(1000, 'manual');
      trackTelemetryEvent('job_poi_roster_time_advance', {
        amount: 1000,
        jobId: jobConfig.id,
      });
    }
  };

  const activeMedal = rosterMedals.find((medal) => medal.id === activeId);
  const assignedHero = assignedResident ? TEST_ROSTER_HEROES.find((h) => h.id === assignedResident) : null;

  return (
    <StyleLabSurface>
      <div className="job-poi-roster-time-integration-page">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Job POI + Roster + Time Engine Integration
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Integrazione completa con time engine e visualizzazione reward automatici
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    progress={gameplayState?.state.currentTick ? (gameplayState.state.currentTick % 100) / 100 : 0}
                    duration={parseInt(jobConfig.durationFormula) * 1000}
                    elapsed={gameplayState?.state.currentTick ? gameplayState.state.currentTick % 100 : 0}
                    slots={assignedResident ? [{ id: assignedResident, state: 'active', initial: assignedHero?.name.charAt(0) || 'R', progress: 0 }] : []}
                    maxSlots={jobConfig.maxSlots === 'infinite' ? 99 : jobConfig.maxSlots}
                    durationDisplay={`${jobConfig.durationFormula}s`}
                    rewardDisplay="Wood + XP"
                    etaDisplay={`${jobConfig.durationFormula}s`}
                    telemetry={[]}
                    isOpen={true}
                    onStart={() => {
                      trackTelemetryEvent('job_poi_roster_time_detail_start', {
                        jobId: jobConfig.id,
                        residentId: assignedResident,
                      });
                    }}
                    onCollect={() => {
                      trackTelemetryEvent('job_poi_roster_time_detail_collect', {
                        jobId: jobConfig.id,
                        residentId: assignedResident,
                      });
                    }}
                  />
                </div>
              )}
            </div>

            {/* Time Engine Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                ⏱️ Time Engine Controls
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Speed: {gameplayState?.state.speedMultiplier || 1}x
                  </span>
                  <div className="flex gap-2">
                    {[1, 2, 5, 10].map(speed => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedChange(speed)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          (gameplayState?.state.speedMultiplier || 1) === speed
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePauseToggle}
                    className={`px-4 py-2 rounded text-sm transition-colors ${
                      gameplayState?.state.isPaused
                        ? 'bg-green-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}
                  >
                    {gameplayState?.state.isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleAdvanceTime}
                    className="px-4 py-2 bg-purple-500 text-white rounded text-sm transition-colors"
                  >
                    Advance 1s
                  </button>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Current Tick:</strong> {gameplayState?.state.currentTick || 0}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Paused:</strong> {gameplayState?.state.isPaused ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Roster */}
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
                <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Right Column: Rewards */}
          <div className="space-y-6">
            {/* Rewards Display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                💰 Automatic Rewards
              </h2>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                <strong>Total Rewards:</strong> {rewards.length} |{' '}
                <strong>Total Wood:</strong> {rewards.filter(r => r.resource === 'wood').reduce((sum, r) => sum + r.amount, 0)}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rewards.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No rewards yet. Assign a resident and advance time to see rewards.
                  </p>
                ) : (
                  rewards.slice().reverse().map((reward, index) => (
                    <div
                      key={index}
                      className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-yellow-900 dark:text-yellow-100">
                            {reward.resource}
                          </div>
                          <div className="text-sm text-yellow-700 dark:text-yellow-300">
                            +{reward.amount}
                          </div>
                        </div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">
                          {new Date(reward.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setRewards([])}
                className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
              >
                Clear Rewards
              </button>
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
                <li>• Usa i controlli Time Engine per avanzare il tempo</li>
                <li>• I reward automatici appaiono nel pannello Rewards</li>
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
