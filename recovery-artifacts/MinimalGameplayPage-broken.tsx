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
import { PoiDetailSkinWrapper } from '@/ui/idleVillage/components/PoiDetailSkinWrapper';
import { ActivityCapsule } from '@/ui/idleVillage/components/ActivityCapsule';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import { DEFAULT_MINIMAL_CONFIG, type MinimalConfig } from '@/balancing/config/idleVillage/minimalConfig';
import { MINIMAL_GAMEPLAY_RESIDENTS } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import { ClockWidget } from '@/ui/idleVillage/components/minimal/ClockWidget';
import DayNightActionCard from '@/ui/idleVillage/map/actionCards/DayNightActionCard';
import ActionToolbar from '@/ui/idleVillage/components/minimal/ActionToolbar';
import { ResourcePanel } from '@/ui/idleVillage/components/ResourcePanel';
import TemporaryTimeStatus from '@/ui/idleVillage/components/minimal/TemporaryTimeStatus';
import DayNightPOI from '@/ui/idleVillage/components/minimal/DayNightPOI';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import MapMiniCard from '@/ui/idleVillage/components/MapMiniCard';

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
  // Minimal test to isolate hooks error
  const [selectedPOI, setSelectedPOI] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Test if basic hooks work without complex dependencies
  const woodActivityDefinition = useMemo(() => ({
    id: 'job_wood_gathering_stable',
    label: 'Wood Gathering',
    description: 'Gather wood from the nearby forest',
    tags: ['job', 'resource'],
    slotTags: ['village_job'],
    resolutionEngineId: 'job',
    type: 'job',
    baseReward: { gold: 0, food: 0, wood: 1, xp: 5 },
    cost: { gold: 0, food: 0 },
    durationTicks: 5,
    dangerRating: 1,
    fatiguePerTick: 0.1,
    maxSlots: 'infinite',
  }), []);
  
  const getWoodPOIState = useCallback((): 'idle' | 'running' | 'completed' => {
    return 'idle'; // Simplified state
  }, []);
  
  const handleWoodPOIClick = useCallback(() => {
    setSelectedPOI('job_wood_gathering_stable');
    setIsDetailOpen(true);
  }, [setSelectedPOI, setIsDetailOpen]);
  
  const handleWoodPOIDetailClose = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedPOI(null);
  }, [setIsDetailOpen, setSelectedPOI]);
  
  // Get Wood POI state from game state
  const getWoodPOIState = useCallback((): 'idle' | 'running' | 'completed' => {
    const activeActivity = gameplayState.state.activeActivities.find(a => a.activityId === 'job_wood_gathering_stable');
    if (activeActivity) {
      return activeActivity.ticksRemaining <= 0 ? 'completed' : 'running';
    }
    return 'idle';
  }, [gameplayState.state.activeActivities]);
  
  // Convert residents array to Record for slot controller
  const residentsById = useMemo(() => 
    residents.reduce((acc, resident) => {
      acc[resident.id] = resident;
      return acc;
    }, {} as Record<string, ResidentState>),
    [residents]
  );

  // Get activity definition for Wood POI - simplified to avoid hooks issues
  const woodActivityDefinition = useMemo(() => {
    return {
      id: 'job_wood_gathering_stable',
      label: 'Wood Gathering',
      description: 'Gather wood from the nearby forest',
      tags: ['job', 'resource'],
      slotTags: ['village_job'],
      resolutionEngineId: 'job',
      type: 'job',
      baseReward: { gold: 0, food: 0, wood: 1, xp: 5 },
      cost: { gold: 0, food: 0 },
      durationTicks: 5,
      dangerRating: 1,
      fatiguePerTick: 0.1,
      maxSlots: 'infinite',
    };
  }, []);

  // Get Wood POI progress
  const getWoodPOIProgress = useCallback((): number => {
    const activeActivity = gameplayState.state.activeActivities.find(a => a.activityId === 'job_wood_gathering_stable');
    if (!activeActivity) return 0;
    
    const woodActivity = woodActivityDefinition;
    if (!woodActivity) return 0;
    
    const totalTicks = Math.ceil(woodActivity.durationTicks);
    const elapsedTicks = totalTicks - activeActivity.ticksRemaining;
    return Math.max(0, Math.min(1, elapsedTicks / totalTicks));
  }, [gameplayState.state.activeActivities, woodActivityDefinition]);
  
  // Get assigned resident for Wood POI
  const getWoodPOIAssignedResident = useCallback((): string | undefined => {
    const activeActivity = gameplayState.state.activeActivities.find(a => a.activityId === 'job_wood_gathering_stable');
    return activeActivity?.residentId;
  }, [gameplayState.state.activeActivities]);
  
  // Handle Wood POI collect
  const handleCollectWoodPOI = useCallback(() => {
    console.log('Collecting Wood POI rewards');
    try {
      const result = gameplayState.collectActivity('job_wood_gathering_stable');
      console.log('Collect result:', result);
    } catch (error) {
      console.error('Error collecting Wood POI:', error);
    }
  }, [gameplayState]);

  // Handle Wood POI click
  const handleWoodPOIClick = useCallback(() => {
    const state = getWoodPOIState();
    if (state === 'completed') {
      // Collect rewards
      handleCollectWoodPOI();
    } else {
      // Open detail
      setSelectedPOI('job_wood_gathering_stable');
      setIsDetailOpen(true);
    }
  }, [getWoodPOIState, handleCollectWoodPOI]);

  // Get defaultConfig for proper ActivityDefinition-driven binding
  const { config: idleVillageConfig } = useIdleVillageConfig();
  
  // Get activities from defaultConfig-based architecture
  const availableActivities = useMemo(() => {
    return Object.values(idleVillageConfig.activities).filter(activity => {
      // Filter for activities that should be visible in minimal gameplay
      return activity.id === 'job_wood_gathering_stable' && 
             (activity.metadata as any)?.mapSlotId;
    });
  }, [idleVillageConfig.activities]);

  // Get map slot for wood gathering activity
  const woodGatheringSlot = useMemo(() => {
    const woodActivity = availableActivities.find(a => a.id === 'job_wood_gathering_stable');
    const mapSlotId = (woodActivity?.metadata as any)?.mapSlotId;
    if (mapSlotId) {
      return idleVillageConfig.mapSlots[mapSlotId as string];
    }
    return null;
  }, [availableActivities, idleVillageConfig.mapSlots]);
  
  // Handle Wood POI detail close
  const handleWoodPOIDetailClose = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedPOI(null);
  }, []);

  // Slot controller for POI detail - temporarily disabled to isolate hooks issue
  // const slotController = useResidentSlotController({
  //   activity: (woodActivityDefinition as any) || {
  //     id: 'fallback',
  //     label: 'Fallback',
  //     description: 'Fallback activity',
  //     tags: ['job'],
  //     slotTags: ['village_job'],
  //     resolutionEngineId: 'job',
  //     type: 'job',
  //     baseReward: { gold: 0, food: 0, wood: 0, xp: 0 },
  //     cost: { gold: 0, food: 0 },
  //     durationTicks: 1,
  //     dangerRating: 0,
  //     fatiguePerTick: 0,
  //     maxSlots: 'infinite',
  //   },
  //   assignments: selectedPOI ? { [selectedPOI]: gameplayState.state.activeActivities.find(a => a.activityId === selectedPOI)?.residentId } : {},
  //   residents: residentsById,
  //   hoveredResidentId: null,
  //   maxFatigueBeforeExhausted: 20,
  //   onAssign: (slotId, residentId) => {
  //     console.log('POI Detail - Slot assign:', { slotId, residentId });
  //     // Validate and assign through the normal flow
  //     const activityDefinition = Object.values(gameplayState.config.activities).find(a => a.id === slotId);
  //     if (activityDefinition) {
  //       const resident = residents.find(r => r.id === residentId);
  //       if (resident) {
  //         const validationResult = validateDrop({
  //           resident,
  //           activity: activityDefinition,
  //           context: 'poi_detail',
  //         });
  //         
  //         if (validationResult.isValid) {
  //           handlePOIActivityAssign(slotId, residentId);
  //         } else {
  //           console.log('POI Detail - Assignment rejected:', validationResult);
  //         }
  //       }
  //     }
  //   },
  //   onClear: (slotId) => {
  //     console.log('POI Detail - Slot clear:', { slotId });
  //     // Clear assignment logic
  //   },
  // });

    
  // Time loop management using useSandboxClock
  const { scheduleTimeout } = useSandboxTiming();
  
  // Refs to track timeout state and prevent overlapping loops
  const timeoutCleanupRef = useRef<(() => void) | null>(null);
  const isLoopActiveRef = useRef(false);
  const currentLoopIdRef = useRef(0);
  
  // Initialize Game loop for cycleProgress advancement
  useEffect(() => {
    // FIXED: Clear any existing timeout when dependencies change or component unmounts
    if (timeoutCleanupRef.current) {
      timeoutCleanupRef.current();
      timeoutCleanupRef.current = null;
    }
    isLoopActiveRef.current = false;
    
    if (gameplayState.state.isPaused) {
      return;
    }
    
    // FIXED: Generate unique loop ID to prevent stale closures
    const loopId = ++currentLoopIdRef.current;
    isLoopActiveRef.current = true;
    
    const runTick = () => {
      // FIXED: Check both pause state and loop ID to prevent stale closures
      if (gameplayState.state.isPaused || !isLoopActiveRef.current || loopId !== currentLoopIdRef.current) {
        return;
      }
      
      // Execute tick
      gameplayState.tick(gameplayState.state.tickIntervalMs, 'auto');
      
      // FIXED: Schedule next tick only if still active and not paused, with loop ID check
      if (!gameplayState.state.isPaused && isLoopActiveRef.current && loopId === currentLoopIdRef.current) {
        timeoutCleanupRef.current = scheduleTimeout(runTick, gameplayState.state.tickIntervalMs);
      }
    };
    
    // Start the game loop only if active
    if (isLoopActiveRef.current && loopId === currentLoopIdRef.current) {
      timeoutCleanupRef.current = scheduleTimeout(runTick, gameplayState.state.tickIntervalMs);
    }
    
    // FIXED: Enhanced cleanup function - clear timeout and mark loop as inactive
    return () => {
      if (timeoutCleanupRef.current) {
        timeoutCleanupRef.current();
        timeoutCleanupRef.current = null;
      }
      isLoopActiveRef.current = false;
    };
  }, [gameplayState.state.isPaused, gameplayState.state.tickIntervalMs, gameplayState.tick, scheduleTimeout]);

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
    } catch (_error) {
      console.error('Error in handlePOIActivityAssign');
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
    } catch (_error) {
      return { success: false, message: 'Failed to buy food' };
    }
  }, [gameplayState]);

  const handleStartQuestDemo = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start quest demo');
    try {
      // Implementation for starting quest demo
      return { success: true, message: 'Quest started' };
    } catch (_error) {
      return { success: false, message: 'Failed to start quest' };
    }
  }, []);

  const handleStartWoodGathering = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start wood gathering');
    try {
      handlePOIActivityAssign('job_wood_gathering_stable', residents[0]?.id || '');
      return { success: true, message: 'Wood gathering started' };
    } catch (_error) {
      return { success: false, message: 'Failed to start wood gathering' };
    }
  }, [handlePOIActivityAssign, residents]);

  const handleStartRepeatableQuest = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start repeatable quest');
    try {
      // Implementation for starting repeatable quest
      return { success: true, message: 'Repeatable quest started' };
    } catch (_error) {
      return { success: false, message: 'Failed to start repeatable quest' };
    }
  }, []);

  const handleStartDangerousQuest = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start dangerous quest');
    try {
      // Implementation for starting dangerous quest
      return { success: true, message: 'Dangerous quest started' };
    } catch (_error) {
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
  }, [residents, handlePOIActivityAssign, gameplayState.config.activities, validateDrop]);

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
              
              {/* Day/Night POI Component */}
              <DayNightPOI />
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
            />
          </StyleLabSurface>
        </div>

        {/* POI Activity Slots - Standard Path: ActivityDefinition -> metadata.mapSlotId -> mapSlots -> MapMiniCard */}
        <div className="p-4">
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-lg font-semibold mb-4">Available Activities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Woodcutter - Following confirmed standard path */}
              {availableActivities.map(activity => {
                const metadata = activity.metadata as any;
                const mapSlot = idleVillageConfig.mapSlots[metadata?.mapSlotId || ''];
                return (
                  <div key={activity.id} className="flex flex-col items-center space-y-2">
                    <MapMiniCard
                      id={activity.id}
                      activityType={metadata?.cardKind || 'job'}
                      label={activity.label}
                      icon={metadata?.icon || 'axe'}
                      residentName={getWoodPOIAssignedResident() ? residents.find(r => r.id === getWoodPOIAssignedResident())?.displayName : undefined}
                      residentAvatarUrl={getWoodPOIAssignedResident() ? residents.find(r => r.id === getWoodPOIAssignedResident())?.displayName : undefined}
                      progress={getWoodPOIProgress()}
                      remainingSeconds={0}
                      status={getWoodPOIState() === 'running' ? 'running' : getWoodPOIState() === 'completed' ? 'completed' : 'paused'}
                      onMapClick={(activityId, activityType) => {
                        console.log('MapMiniCard clicked:', { activityId, activityType });
                        setSelectedPOI(activityId);
                        setIsDetailOpen(true);
                      }}
                      position={mapSlot ? { x: mapSlot.x, y: mapSlot.y } : undefined}
                    />
                    <p className="text-xs text-gray-600">{activity.label}</p>
                  </div>
                );
              })}
              
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded">
                <p className="text-sm">Gold Quest</p>
                <p className="text-xs mt-1">Coming soon</p>
              </div>
              
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded">
                <p className="text-sm">More Activities</p>
                <p className="text-xs mt-1">Coming soon</p>
              </div>
            </div>
          </StyleLabSurface>
        </div>

        {/* POI Detail Panel - Canonical path: PoiDetailSkinWrapper */}
        {isDetailOpen && selectedPOI === 'job_wood_gathering_stable' && woodActivityDefinition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <PoiDetailSkinWrapper
              activityId={woodActivityDefinition.id}
              name={(woodActivityDefinition as any).label || (woodActivityDefinition as any).name}
              type={woodActivityDefinition.type}
              subtitle="Gather wood from the nearby forest"
              status={getWoodPOIState() === 'running' ? 'in-progress' : getWoodPOIState() === 'completed' ? 'completed' : 'idle'}
              progress={getWoodPOIProgress()}
              duration={woodActivityDefinition.durationTicks * 3}
              elapsed={getWoodPOIProgress() * woodActivityDefinition.durationTicks * 3}
              slots={[
                {
                  id: 'slot-1',
                  state: getWoodPOIAssignedResident() ? 'idle' : 'empty',
                  initial: 'empty',
                  progress: getWoodPOIProgress(),
                  assignedWorkerName: getWoodPOIAssignedResident() ? residents.find(r => r.id === getWoodPOIAssignedResident())?.displayName : undefined,
                  assignedWorkerAvatarUrl: getWoodPOIAssignedResident() ? residents.find(r => r.id === getWoodPOIAssignedResident())?.displayName : undefined,
                }
              ]}
              maxSlots={1}
              durationDisplay={`${woodActivityDefinition.durationTicks} ticks`}
              rewardDisplay={`${woodActivityDefinition.baseReward.wood} wood, ${woodActivityDefinition.baseReward.xp} xp`}
              etaDisplay={getWoodPOIState() === 'running' ? 'In progress...' : 'Ready to start'}
              telemetry={[
                {
                  id: 'detail-view',
                  timestamp: new Date(),
                  message: 'POI detail viewed',
                  type: 'assign'
                }
              ]}
              onStart={() => {
                console.log('Start activity:', selectedPOI);
              }}
              onCancel={() => {
                console.log('Cancel activity:', selectedPOI);
              }}
              onCollect={handleCollectWoodPOI}
              onSlotAssign={(slotId) => {
                console.log('Slot assign:', slotId);
              }}
              onSlotDetach={(slotId) => {
                console.log('Slot detach:', slotId);
              }}
              isOpen={isDetailOpen}
            />
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
      setSelectedPOI('job_wood_gathering_stable');
      setIsDetailOpen(true);
    }
  }, [getWoodPOIState, handleCollectWoodPOI]);

  // Get defaultConfig for proper ActivityDefinition-driven binding
  const { config: idleVillageConfig } = useIdleVillageConfig();
  
  // Get activities from defaultConfig-based architecture
  const availableActivities = useMemo(() => {
    return Object.values(idleVillageConfig.activities).filter(activity => {
      // Filter for activities that should be visible in minimal gameplay
      return activity.id === 'job_wood_gathering_stable' && 
             (activity.metadata as any)?.mapSlotId;
    });
  }, [idleVillageConfig.activities]);

  // Get map slot for wood gathering activity
  const woodGatheringSlot = useMemo(() => {
    const woodActivity = availableActivities.find(a => a.id === 'job_wood_gathering_stable');
    const mapSlotId = (woodActivity?.metadata as any)?.mapSlotId;
    if (mapSlotId) {
      return idleVillageConfig.mapSlots[mapSlotId as string];
    }
    return null;
  }, [availableActivities, idleVillageConfig.mapSlots]);
  
  // Handle Wood POI detail close
  const handleWoodPOIDetailClose = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedPOI(null);
  }, []);

  // Slot controller for POI detail - temporarily disabled to isolate hooks issue
  // const slotController = useResidentSlotController({
  //   activity: (woodActivityDefinition as any) || {
  //     id: 'fallback',
  //     label: 'Fallback',
  //     description: 'Fallback activity',
  //     tags: ['job'],
  //     slotTags: ['village_job'],
  //     resolutionEngineId: 'job',
  //     type: 'job',
  //     baseReward: { gold: 0, food: 0, wood: 0, xp: 0 },
  //     cost: { gold: 0, food: 0 },
  //     durationTicks: 1,
  //     dangerRating: 0,
  //     fatiguePerTick: 0,
  //     maxSlots: 'infinite',
  //   },
  //   assignments: selectedPOI ? { [selectedPOI]: gameplayState.state.activeActivities.find(a => a.activityId === selectedPOI)?.residentId } : {},
  //   residents: residentsById,
  //   hoveredResidentId: null,
  //   maxFatigueBeforeExhausted: 20,
  //   onAssign: (slotId, residentId) => {
  //     console.log('POI Detail - Slot assign:', { slotId, residentId });
  //     // Validate and assign through the normal flow
  //     const activityDefinition = Object.values(gameplayState.config.activities).find(a => a.id === slotId);
  //     if (activityDefinition) {
  //       const resident = residents.find(r => r.id === residentId);
  //       if (resident) {
  //         const validationResult = validateDrop({
  //           resident,
  //           activity: activityDefinition,
  //           context: 'poi_detail',
  //         });
  //         
  //         if (validationResult.isValid) {
  //           handlePOIActivityAssign(slotId, residentId);
  //         } else {
  //           console.log('POI Detail - Assignment rejected:', validationResult);
  //         }
  //       }
  //     }
  //   },
  //   onClear: (slotId) => {
  //     console.log('POI Detail - Slot clear:', { slotId });
  //     // Clear assignment logic
  //   },
  // });

    
  // Time loop management using useSandboxClock
  const { scheduleTimeout } = useSandboxTiming();
  
  // Refs to track timeout state and prevent overlapping loops
  const timeoutCleanupRef = useRef<(() => void) | null>(null);
  const isLoopActiveRef = useRef(false);
  const currentLoopIdRef = useRef(0);
  
  // Initialize Game loop for cycleProgress advancement
  useEffect(() => {
    // FIXED: Clear any existing timeout when dependencies change or component unmounts
    if (timeoutCleanupRef.current) {
      timeoutCleanupRef.current();
      timeoutCleanupRef.current = null;
    }
    isLoopActiveRef.current = false;
    
    if (gameplayState.state.isPaused) {
      return;
    }
    
    // FIXED: Generate unique loop ID to prevent stale closures
    const loopId = ++currentLoopIdRef.current;
    isLoopActiveRef.current = true;
    
    const runTick = () => {
      // FIXED: Check both pause state and loop ID to prevent stale closures
      if (gameplayState.state.isPaused || !isLoopActiveRef.current || loopId !== currentLoopIdRef.current) {
        return;
      }
      
      // Execute tick
      gameplayState.tick(gameplayState.state.tickIntervalMs, 'auto');
      
      // FIXED: Schedule next tick only if still active and not paused, with loop ID check
      if (!gameplayState.state.isPaused && isLoopActiveRef.current && loopId === currentLoopIdRef.current) {
        timeoutCleanupRef.current = scheduleTimeout(runTick, gameplayState.state.tickIntervalMs);
      }
    };
    
    // Start the game loop only if active
    if (isLoopActiveRef.current && loopId === currentLoopIdRef.current) {
      timeoutCleanupRef.current = scheduleTimeout(runTick, gameplayState.state.tickIntervalMs);
    }
    
    // FIXED: Enhanced cleanup function - clear timeout and mark loop as inactive
    return () => {
      if (timeoutCleanupRef.current) {
        timeoutCleanupRef.current();
        timeoutCleanupRef.current = null;
      }
      isLoopActiveRef.current = false;
    };
  }, [gameplayState.state.isPaused, gameplayState.state.tickIntervalMs, gameplayState.tick, scheduleTimeout]);

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
    } catch (_error) {
      console.error('Error in handlePOIActivityAssign');
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
    } catch (_error) {
      return { success: false, message: 'Failed to buy food' };
    }
  }, [gameplayState]);

  const handleStartQuestDemo = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start quest demo');
    try {
      // Implementation for starting quest demo
      return { success: true, message: 'Quest started' };
    } catch (_error) {
      return { success: false, message: 'Failed to start quest' };
    }
  }, []);

  const handleStartWoodGathering = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start wood gathering');
    try {
      handlePOIActivityAssign('job_wood_gathering_stable', residents[0]?.id || '');
      return { success: true, message: 'Wood gathering started' };
    } catch (_error) {
      return { success: false, message: 'Failed to start wood gathering' };
    }
  }, [handlePOIActivityAssign, residents]);

  const handleStartRepeatableQuest = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start repeatable quest');
    try {
      // Implementation for starting repeatable quest
      return { success: true, message: 'Repeatable quest started' };
    } catch (_error) {
      return { success: false, message: 'Failed to start repeatable quest' };
    }
  }, []);

  const handleStartDangerousQuest = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    console.log('Start dangerous quest');
    try {
      // Implementation for starting dangerous quest
      return { success: true, message: 'Dangerous quest started' };
    } catch (_error) {
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
  }, [residents, handlePOIActivityAssign, gameplayState.config.activities, validateDrop]);

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
              
              {/* Day/Night POI Component */}
              <DayNightPOI />
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
            />
          </StyleLabSurface>
        </div>

        {/* POI Activity Slots - Standard Path: ActivityDefinition -> metadata.mapSlotId -> mapSlots -> MapMiniCard */}
        <div className="p-4">
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-lg font-semibold mb-4">Available Activities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Woodcutter - Following confirmed standard path */}
              {availableActivities.map(activity => {
                const metadata = activity.metadata as any;
                const mapSlot = idleVillageConfig.mapSlots[metadata?.mapSlotId || ''];
                return (
                  <div key={activity.id} className="flex flex-col items-center space-y-2">
                    <MapMiniCard
                      id={activity.id}
                      activityType={metadata?.cardKind || 'job'}
                      label={activity.label}
                      icon={metadata?.icon || 'axe'}
                      residentName={getWoodPOIAssignedResident() ? residents.find(r => r.id === getWoodPOIAssignedResident())?.displayName : undefined}
                      residentAvatarUrl={getWoodPOIAssignedResident() ? residents.find(r => r.id === getWoodPOIAssignedResident())?.displayName : undefined}
                      progress={getWoodPOIProgress()}
                      remainingSeconds={0}
                      status={getWoodPOIState() === 'running' ? 'running' : getWoodPOIState() === 'completed' ? 'completed' : 'paused'}
                      onMapClick={(activityId, activityType) => {
                        console.log('MapMiniCard clicked:', { activityId, activityType });
                        setSelectedPOI(activityId);
                        setIsDetailOpen(true);
                      }}
                      position={mapSlot ? { x: mapSlot.x, y: mapSlot.y } : undefined}
                    />
                    <p className="text-xs text-gray-600">{activity.label}</p>
                  </div>
                );
              })}
              
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded">
                <p className="text-sm">Gold Quest</p>
                <p className="text-xs mt-1">Coming soon</p>
              </div>
              
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded">
                <p className="text-sm">More Activities</p>
                <p className="text-xs mt-1">Coming soon</p>
              </div>
            </div>
          </StyleLabSurface>
        </div>

        {/* POI Detail Panel - Canonical path: PoiDetailSkinWrapper */}
        {isDetailOpen && selectedPOI === 'job_wood_gathering_stable' && woodActivityDefinition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <PoiDetailSkinWrapper
              activityId={woodActivityDefinition.id}
              name={(woodActivityDefinition as any).label || (woodActivityDefinition as any).name}
              type={woodActivityDefinition.type}
              subtitle="Gather wood from the nearby forest"
              status={getWoodPOIState() === 'running' ? 'in-progress' : getWoodPOIState() === 'completed' ? 'completed' : 'idle'}
              progress={getWoodPOIProgress()}
              duration={woodActivityDefinition.durationTicks * 3}
              elapsed={getWoodPOIProgress() * woodActivityDefinition.durationTicks * 3}
              slots={[
                {
                  id: 'slot-1',
                  state: getWoodPOIAssignedResident() ? 'idle' : 'empty',
                  initial: 'empty',
                  progress: getWoodPOIProgress(),
                  assignedWorkerName: getWoodPOIAssignedResident() ? residents.find(r => r.id === getWoodPOIAssignedResident())?.displayName : undefined,
                  assignedWorkerAvatarUrl: getWoodPOIAssignedResident() ? residents.find(r => r.id === getWoodPOIAssignedResident())?.displayName : undefined,
                }
              ]}
              maxSlots={1}
              durationDisplay={`${woodActivityDefinition.durationTicks} ticks`}
              rewardDisplay={`${woodActivityDefinition.baseReward.wood} wood, ${woodActivityDefinition.baseReward.xp} xp`}
              etaDisplay={getWoodPOIState() === 'running' ? 'In progress...' : 'Ready to start'}
              telemetry={[
                {
                  id: 'detail-view',
                  timestamp: new Date(),
                  message: 'POI detail viewed',
                  type: 'assign'
                }
              ]}
              onStart={() => {
                console.log('Start activity:', selectedPOI);
              }}
              onCancel={() => {
                console.log('Cancel activity:', selectedPOI);
              }}
              onCollect={handleCollectWoodPOI}
              onSlotAssign={(slotId) => {
                console.log('Slot assign:', slotId);
              }}
              onSlotDetach={(slotId) => {
                console.log('Slot detach:', slotId);
              }}
              isOpen={isDetailOpen}
            />
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
