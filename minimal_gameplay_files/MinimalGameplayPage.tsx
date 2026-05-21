import type { JSX } from 'react';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DndContext, pointerWithin, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import type { ResidentState, ResidentStatus } from '@/engine/game/idleVillage/TimeEngine';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { DragProvider, useDragContext } from '@/ui/idleVillage/components/DragContext';
import { SandboxTimingProvider, useSandboxTiming } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { useGameDirectorSimple } from '@/ui/idleVillage/hooks/useGameDirectorSimple';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { DragPhysicsProvider } from '@/ui/styleLab/physics/DragPhysicsContext';
import MinimalActivityPOI from '@/ui/idleVillage/components/minimal/MinimalActivityPOI';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import { DEFAULT_MINIMAL_CONFIG, type MinimalConfig } from '@/balancing/config/idleVillage/minimalConfig';
import { MINIMAL_GAMEPLAY_RESIDENTS } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import { ClockWidget } from '@/ui/idleVillage/components/minimal/ClockWidget';
import DayNightActionCard from '@/ui/idleVillage/map/actionCards/DayNightActionCard';
import ActionToolbar from '@/ui/idleVillage/components/minimal/ActionToolbar';
import { ResourcePanel, type ResourcePanelItem } from '@/ui/idleVillage/components/ResourcePanel';
import TemporaryTimeStatus from '@/ui/idleVillage/components/minimal/TemporaryTimeStatus';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { ActivityCapsule, type ActivitySlotData } from '@/ui/idleVillage/components/ActivityCapsule';
import PoiDetailSkinWrapper from '@/ui/idleVillage/components/PoiDetailSkinWrapper';
import ActionDetailHarness from '@/ui/idleVillage/components/ActionDetailHarness';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import ResidentSlotRack from '@/ui/idleVillage/components/ResidentSlotRack';
import { resolveResidentRackDisplayInfo } from '@/ui/idleVillage/slots/residentSlotDisplay';
import type { RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import { DEFAULT_ROSTER_SORT_MODE } from '@/ui/idleVillage/config/rosterSortConfig';

/**
 * MinimalGameplayPage - Reusing proven /test DnD stack
 * 
 * This page now uses the exact same DnD components and patterns as TestRosterPage
 * to ensure visual and functional parity.
 */

// STEP 1: Premium drag visual state (exact from TestRosterPage)
type DragVisualState = 
  | { mode: 'idle' }
  | { mode: 'dragging'; residentId: string }
  | { 
      mode: 'flight'; 
      residentId: string; 
      slotId: string; 
      fromX: number; 
      fromY: number; 
      toX: number; 
      toY: number; 
    };

function MinimalGameplayPageContent(): JSX.Element {
  // Style tokens - simplified to avoid errors
  const surfaceStyle = useMemo(() => ({
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
  }), []);

  // Time engine state from useMinimalGameplay
  const gameplayState = useMinimalGameplayStore();
  const logicConfig: MinimalConfig = gameplayState.config;
  
  const [residents, setResidents] = useState<ResidentState[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  
  // STEP 1: Premium drag visual state (exact from TestRosterPage)
  const [dragVisualState, setDragVisualState] = useState<DragVisualState>({ mode: 'idle' });
  
  // Game Director integration
  const gameDirector = useGameDirectorSimple();

  // Drop validation hook
  const { validateDrop } = useResidentDropValidation();

  // POI detail state for normal flow
  const [selectedPOI, setSelectedPOI] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Sort mode state for roster
  const [sortMode, setSortMode] = useState<RosterSortMode>(DEFAULT_ROSTER_SORT_MODE);

  // Convert residents array to Record for slot controller
  const residentsById = useMemo(() => 
    residents.reduce((acc, resident) => {
      acc[resident.id] = resident;
      return acc;
    }, {} as Record<string, ResidentState>),
    [residents]
  );

  // Get activity definition for Wood POI
  const woodActivityDefinition = useMemo(() => {
    const activities = Object.values(gameplayState.config.activities);
    console.log('Available activities:', activities.map(a => ({ id: a.id, name: a.name })));
    const found = activities.find(a => a.id === 'job_wood_gathering_stable');
    console.log('Wood activity found:', found);
    return found;
  }, [gameplayState.config.activities]);

  // Slot controller for POI detail - only initialize if activity exists
  const slotController = useResidentSlotController({
    activity: woodActivityDefinition || {
      id: 'fallback',
      name: 'Fallback',
      type: 'job',
      baseReward: { gold: 0, food: 0, wood: 0, xp: 0 },
      cost: { gold: 0, food: 0 },
      durationTicks: 1,
      dangerRating: 0,
      fatiguePerTick: 0,
      maxSlots: 'infinite',
    },
    assignments: selectedPOI ? { [selectedPOI]: gameplayState.state.activeActivities.find(a => a.activityId === selectedPOI)?.residentId } : {},
    residents: residentsById,
    hoveredResidentId: null,
    maxFatigueBeforeExhausted: 20,
    onAssign: (slotId, residentId) => {
      console.log('POI Detail - Slot assign:', { slotId, residentId });
      // Validate and assign through the normal flow
      const activityDefinition = Object.values(gameplayState.config.activities).find(a => a.id === slotId);
      if (activityDefinition) {
        const resident = residents.find(r => r.id === residentId);
        if (resident) {
          const validationResult = validateDrop({
            resident,
            activity: activityDefinition,
            context: 'poi_detail',
          });
          
          if (validationResult.isValid) {
            handlePOIActivityAssign(slotId, residentId);
          } else {
            console.log('POI Detail - Assignment rejected:', validationResult);
          }
        }
      }
    },
    onClear: (slotId) => {
      console.log('POI Detail - Slot clear:', { slotId });
      // Clear assignment logic
    },
  });

  const {
    assignResidentToSlot,
    clearSlot,
    getSlotProgress,
    warnings,
    dropState,
  } = slotController;
  
  // Time loop management using useSandboxClock
  const { scheduleTimeout } = useSandboxTiming();
  
  // Initialize Game loop for cycleProgress advancement
  useEffect(() => {
    if (gameplayState.state.isPaused) return;

    const runTick = () => {
      gameplayState.tick(gameplayState.state.tickIntervalMs, 'auto');
      
      // Schedule next tick only if not paused
      if (!gameplayState.state.isPaused) {
        setTimeout(runTick, gameplayState.state.tickIntervalMs);
      }
    };

    // Start the game loop
    const timeoutId = setTimeout(runTick, gameplayState.state.tickIntervalMs);
    
    return () => clearTimeout(timeoutId);
  }, [gameplayState.state.isPaused, gameplayState.state.tickIntervalMs, gameplayState]);

  // Auto-start game and initialize GameDirector on page load
  const hasInitializedGameDirector = useRef(false);
  const hasStartedGame = useRef(false);
  
  useEffect(() => {
    // Start game on first load
    if (!hasStartedGame.current && gameplayState.state.isPaused) {
      gameplayState.resumeGame('auto');
      hasStartedGame.current = true;
    }
    
    // Initialize GameDirector
    if (!hasInitializedGameDirector.current && gameDirector) {
      gameDirector.startRun();
      hasInitializedGameDirector.current = true;
    }
  }, [gameplayState.state.isPaused, gameplayState, gameDirector]);

  // DnD setup - SAME as TestRosterPage
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
  );

  // Drag & Drop setup - SAME as TestRosterPage
  const { activeId, setActiveId } = useDragContext();

  // Residents hydration - SAME as TestRosterPage
  useEffect(() => {
    const loadResidents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to load from character manager first
        const loadedResidents = await loadResidentsFromCharacterManager();
        
        if (loadedResidents.length > 0) {
          console.log('[MinimalGameplayPage] Loaded residents from character manager:', loadedResidents.length);
          setResidents(loadedResidents);
        } else {
          // Fallback to minimal residents
          console.log('[MinimalGameplayPage] No residents in character manager, using fallback');
          const fallbackResidents = MINIMAL_GAMEPLAY_RESIDENTS.map(resident => ({
            id: resident.id,
            name: resident.name,
            level: resident.level,
            stats: resident.stats,
            currentHp: 100,
            maxHp: 100,
            fatigue: 0,
            isInjured: false,
            isWorking: false,
            isHero: false,
            survivalCount: 0,
            survivalScore: 0,
            status: 'available' as ResidentStatus,
          }));
          setResidents(fallbackResidents);
        }
      } catch (error) {
        console.error('[MinimalGameplayPage] Error loading residents:', error);
        setError('Failed to load residents');
      } finally {
        setIsLoading(false);
      }
    };

    loadResidents();
  }, []);

  // Memoized resident data for components - residentsById already declared above

  const rosterResidents = useMemo(() => residents, [residents]);

  // Activity assignment handler
  const handlePOIActivityAssign = useCallback((activityId: string, residentId: string) => {
    console.log('Wood POI assignment - using TestRosterPage pattern:', { residentId, activityId });
    try {
      const result = gameplayState.startActivity(activityId, residentId);
      console.log('Activity start result:', result);
    } catch (error) {
      console.error('Error in handlePOIActivityAssign:', error);
    }
  }, [gameplayState]);

  const handleRosterSelect = useCallback((residentId: string) => {
    console.log('Resident selected:', residentId);
  }, []);

  // Action handlers for complete page functionality
  const handleBuyFood = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Buy food action');
    try {
      const result = gameplayState.buyFood(1);
      return result;
    } catch (error) {
      return { success: false, message: 'Failed to buy food' };
    }
  }, [gameplayState]);

  const handleStartQuestDemo = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start quest demo');
    try {
      // Implementation for starting quest demo
      return { success: true, message: 'Quest started' };
    } catch (error) {
      return { success: false, message: 'Failed to start quest' };
    }
  }, []);

  const handleStartWoodGathering = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start wood gathering');
    try {
      handlePOIActivityAssign('job_wood_gathering_stable', residents[0]?.id || '');
      return { success: true, message: 'Wood gathering started' };
    } catch (error) {
      return { success: false, message: 'Failed to start wood gathering' };
    }
  }, [handlePOIActivityAssign, residents]);

  const handleStartRepeatableQuest = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start repeatable quest');
    try {
      // Implementation for starting repeatable quest
      return { success: true, message: 'Repeatable quest started' };
    } catch (error) {
      return { success: false, message: 'Failed to start repeatable quest' };
    }
  }, []);

  const handleStartDangerousQuest = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start dangerous quest');
    try {
      // Implementation for starting dangerous quest
      return { success: true, message: 'Dangerous quest started' };
    } catch (error) {
      return { success: false, message: 'Failed to start dangerous quest' };
    }
  }, []);

  // Exact drag handlers from TestRosterPage - no custom logic
  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log('DndContext - onDragStart:', { 
      activeId: event.active.id, 
      activeData: event.active.data.current,
      timestamp: Date.now()
    });
    const residentId = event.active.id as string;
    
    // STEP 2: Set premium visual state (exact from TestRosterPage)
    setDragVisualState({
      mode: 'dragging',
      residentId,
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    // Mark the exact millisecond when drag ended and which resident was dragged
    const { active, over } = event;

    // CRITICAL FIX: If dropped outside any droppable (over is null), do NOT trigger any assignment
    // This prevents the bug where dropping outside slots still assigns to the first available slot
    if (!over) {
      console.log('Dropped outside droppable - COMPLETELY blocking any assignment');
      setDragVisualState({ mode: 'idle' }); // STEP 3: Reset visual state
      return;
    }

    const residentId = active.id as string;
    const slotId = over.id as string;

    // Handle Wood POI slot (adapted from TestRosterPage slot pattern)
    if (slotId.startsWith('poi-drop-')) {
      const activityId = slotId.replace('poi-drop-', '');
      const resident = residents.find(r => r.id === residentId);
      
      if (resident) {
        console.log('Wood POI assignment - validating drop:', { residentId, activityId });
        
        // Get activity definition for validation
        const activityDefinition = Object.values(gameplayState.config.activities).find(a => a.id === activityId);
        
        if (activityDefinition) {
          // Validate drop using the same pattern as TestRosterPage
          const validationResult = validateDrop({
            resident,
            activity: activityDefinition,
            context: 'wood_poi',
          });
          
          console.log('Wood POI validation result:', validationResult);
          
          if (validationResult.isValid) {
            console.log('Wood POI assignment - validation passed:', { residentId, activityId });
            handlePOIActivityAssign(activityId, residentId);
          } else {
            console.log('Wood POI assignment - validation failed:', validationResult);
            // Don't assign if validation fails
          }
        } else {
          console.log('Wood POI assignment - activity definition not found:', activityId);
        }
      }
    }

    // Reset visual state
    setDragVisualState({ mode: 'idle' });
  }, [residents, handlePOIActivityAssign]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {activeId && (
        <style>{`
          body, body * {
            cursor: grabbing !important;
          }
        `}</style>
      )}
      
      <div data-testid="minimal-gameplay-page">

        {/* Resource Display */}
        <div className="p-4">
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ResourcePanel
              items={[
                {
                  id: 'gold',
                  label: 'Gold',
                  icon: 'gold',
                  value: gameplayState.state.gold,
                  accentClass: 'text-yellow-600'
                },
                {
                  id: 'food',
                  label: 'Food',
                  icon: 'food',
                  value: `${gameplayState.state.food}/${gameplayState.state.maxFood}`,
                  accentClass: gameplayState.state.food < 3 ? 'text-red-600' : 'text-green-600'
                }
              ]}
            />
          </StyleLabSurface>
        </div>

        {/* Time Engine Controls */}
        <div className="p-4">
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Time Engine
              <span className={`text-sm px-2 py-1 rounded ${gameplayState.state.isDayPhase ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                {gameplayState.state.isDayPhase ? 'Day' : 'Night'}
              </span>
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Clock Widget */}
              <div>
                <ClockWidget
                  currentDay={gameplayState.state.currentDay}
                  isPaused={gameplayState.state.isPaused}
                  speedMultiplier={gameplayState.state.speedMultiplier}
                  defaultSpeedMultiplier={gameplayState.config.loop.defaultSpeedMultiplier}
                  maxSpeedMultiplier={gameplayState.config.loop.maxSpeedMultiplier}
                  tickIntervalMs={gameplayState.state.tickIntervalMs}
                  warmupDelayMs={gameplayState.config.loop.warmupDelayMs}
                  accentHex={'#3b82f6'}
                  onSpeedChange={(speed) => gameplayState.setSpeedMultiplier(speed)}
                />
              </div>
              
              {/* Time Controls */}
              <div className="flex flex-col justify-center space-y-2">
                <div className="text-sm">
                  <strong>Day:</strong> {gameplayState.state.currentDay}
                </div>
                <div className="text-sm">
                  <strong>Time:</strong> {gameplayState.state.currentTime?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm">
                  <strong>Speed:</strong> {gameplayState.state.speedMultiplier}x
                </div>
                <div className="text-sm">
                  <strong>Status:</strong> {gameplayState.state.isPaused ? 'Paused' : 'Running'}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => gameplayState.state.isPaused ? gameplayState.resumeGame('user') : gameplayState.pauseGame('user')}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    {gameplayState.state.isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={() => gameplayState.resetGame()}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Reset
                  </button>
                </div>
              </div>
              
              {/* Temporary Time Status Component */}
              <TemporaryTimeStatus />
            </div>
          </StyleLabSurface>
        </div>

        {/* Roster Section - Keep working drag source */}
        <div className="p-4">
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-lg font-semibold mb-4">Roster</h3>
            <VillageRosterSection
              residents={rosterResidents}
              assignmentFeedback={undefined}
              onDragStart={(residentId) => setActiveId(residentId)}
              onDragEnd={() => setActiveId(null)}
              onResidentSelect={handleRosterSelect}
              getResidentCompatibility={() => undefined}
              componentId="minimal-gameplay-roster"
              pgCardSkinId="minimal_frontier"
              pillar="frontier"
              context={{ locationType: 'slot-lab', residentType: 'worker', scenarioType: 'test' }}
              dragVisualState={dragVisualState}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
            />
          </StyleLabSurface>
        </div>

        {/* POI Activity Slots - Normal POI flow */}
        <div className="p-4">
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-lg font-semibold mb-4">Available Activities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Wood Gathering POI - Map level node */}
              <div 
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  console.log('Wood POI clicked - opening detail');
                  setSelectedPOI('job_wood_gathering_stable');
                  setIsDetailOpen(true);
                }}
              >
                <StyleLabSurface variant="card">
                <div className="p-4">
                  <div className="text-2xl mb-2">axe</div>
                  <h4 className="font-semibold text-white">Wood Gathering</h4>
                  <p className="text-sm text-gray-300 mt-1">
                    Stable job: Collect wood from nearby forest. Low-risk work.
                  </p>
                  {gameplayState.state.activeActivities
                    .filter(a => a.activityId === 'job_wood_gathering_stable').length > 0 && (
                    <div className="mt-2 text-xs text-green-400">
                      Active: {gameplayState.state.activeActivities
                        .filter(a => a.activityId === 'job_wood_gathering_stable')
                        .map(a => residents.find(r => r.id === a.residentId)?.displayName || a.residentId)
                        .join(', ')}
                    </div>
                  )}
                </div>
                </StyleLabSurface>
              </div>
              
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded">
                <p className="text-sm">Gold Quest</p>
                <p className="text-xs mt-1">Coming soon</p>
              </div>
              
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded">
                <p className="text-sm">Dangerous Hunt</p>
                <p className="text-xs mt-1">Coming soon</p>
              </div>
            </div>
          </StyleLabSurface>
        </div>

        {/* POI Detail Panel - Real assignment surface */}
        {isDetailOpen && selectedPOI === 'job_wood_gathering_stable' && (
          <div className="p-4">
            <StyleLabSurface variant="card" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Wood Gathering - Details</h3>
                <button
                  onClick={() => {
                    console.log('Closing POI detail');
                    setIsDetailOpen(false);
                    setSelectedPOI(null);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
              
              {/* ActionDetailHarness - Real assignment surface */}
              <ActionDetailHarness
                title="Wood Gathering"
                slotId="job_wood_gathering_stable"
                assignedResidentName={gameplayState.state.activeActivities
                  .find(a => a.activityId === 'job_wood_gathering_stable')?.residentId
                  ? residents.find(r => r.id === gameplayState.state.activeActivities.find(a => a.activityId === 'job_wood_gathering_stable')?.residentId)?.displayName
                  : undefined}
                helperText="Drag a resident here to assign them to wood gathering"
                icon={<span> axe </span>}
                dropState={dropState === 'locked' ? 'idle' : dropState}
                isPlaying={!!gameplayState.state.activeActivities.find(a => a.activityId === 'job_wood_gathering_stable')}
                progressFraction={0}
                elapsedSeconds={0}
                totalDurationSeconds={4}
                elapsedLabel="0s"
                remainingLabel="4s"
                onJobDrop={assignResidentToSlot}
                onJobDragOver={() => {}}
                showBloom={dropState === 'valid'}
              />
              
              {/* ResidentSlotRack - Reused from /test */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Assignment Slots</h4>
                <ResidentSlotRack
                  slots={slotController.slots}
                  layout="detail"
                  overflowBehavior="wrap"
                  getSlotProgress={getSlotProgress}
                  resolveDisplayInfo={resolveResidentRackDisplayInfo}
                  onSlotDrop={assignResidentToSlot}
                  onSlotClear={clearSlot}
                />
              </div>
            </StyleLabSurface>
          </div>
        )}

        {/* Active Activities Display */}
        <div className="p-4">
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-lg font-semibold mb-4">Active Activities</h3>
            {gameplayState.state.activeActivities.length > 0 ? (
              <div className="space-y-2">
                {gameplayState.state.activeActivities.map((activity) => (
                  <div key={activity.activityId} className="p-3 border rounded">
                    <div className="font-medium">{activity.activityId}</div>
                    <div className="text-sm text-gray-600">
                      Resident: {activity.residentId}
                    </div>
                    <div className="text-sm text-gray-600">
                      Ticks Remaining: {activity.ticksRemaining}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                No active activities
              </div>
            )}
          </StyleLabSurface>
        </div>

        
        {/* Action Toolbar */}
        <div className="p-4">
          <ActionToolbar
            actionPanel={logicConfig.ui.actionPanel}
            onBuyFood={handleBuyFood}
            onStartQuest={handleStartQuestDemo}
            onStartWoodGathering={handleStartWoodGathering}
            onStartRepeatableQuest={handleStartRepeatableQuest}
            onStartDangerousQuest={handleStartDangerousQuest}
            statusMessage={undefined}
            disabled={gameplayState.state.isPaused}
            uiConfig={logicConfig.ui}
          />
        </div>

      </div>
      <CustomDragOverlay
        residentsById={residentsById}
        usePgCardPreview={true}
        dragVisualState={dragVisualState}
      />
    </DndContext>
  );
}

export default function MinimalGameplayPage(): JSX.Element {
  return (
    <DragPhysicsProvider>
      <SandboxTimingProvider>
        <DragProvider>
          <MinimalGameplayPageContent />
        </DragProvider>
      </SandboxTimingProvider>
    </DragPhysicsProvider>
  );
}
