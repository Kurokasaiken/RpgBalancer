import type { JSX } from 'react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DndContext, pointerWithin, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { StyleLaboratoryPanel } from '@/ui/styleLab/StyleLaboratoryPanel';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import { useVillageResidents } from '@/ui/idleVillage/hooks/useVillageResidents';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { DragProvider, useDragContext } from '@/ui/idleVillage/components/DragContext';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { useCentralizedTiming } from '@/ui/idleVillage/hooks/useCentralizedTiming';
import { MINIMAL_GAMEPLAY_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { MinimalConfig } from '@/balancing/config/idleVillage/minimalConfig';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { DragPhysicsProvider } from '@/ui/styleLab/physics/DragPhysicsContext';
import { ClockWidget } from '@/ui/idleVillage/components/minimal/ClockWidget';
import { selectLoopWarnings, selectRosterWithWarnings, useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import DayNightPOI from '@/ui/idleVillage/components/minimal/DayNightPOI';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import ActionToolbar from '@/ui/idleVillage/components/minimal/ActionToolbar';
// Valid architectural components to add
import { PoiDetailSkinWrapper } from '@/ui/idleVillage/components/PoiDetailSkinWrapper';
import { ResourcePanel } from '@/ui/idleVillage/components/ResourcePanel';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import { SlotRackWithSkin } from '@/ui/idleVillage/components/SlotRackWithSkin';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';
import type { RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import { DEFAULT_ROSTER_SORT_MODE } from '@/ui/idleVillage/config/rosterSortConfig';

/**
 * MinimalGameplayPage - Minimal Gameplay Interface (CANONICAL VERSION)
 * 
 * A streamlined gameplay page that provides essential idle village functionality with
 * Style Laboratory integration and compact roster display. This represents the canonical
 * design after post-freeze optimizations.
 * 
 * CANONICAL DESIGN (Post-Freeze Optimizations):
 * - Streamlined interface: Essential gameplay elements only
 * - Style Laboratory: Full theme customization with compact controls
 * - Time Engine: Clock widget and day/night cycle controls
 * - Compact roster: Inline layout with minimal PgCard design
 * - Drag functionality: Full dnd-kit integration with sortable roster
 * - Minimal layout: Optimized spacing and component sizes
 * 
 * Layout Structure:
 * ┌─────────────────────────────────────────────────┐
 * │ Style Laboratory Panel (collapsible)              │
 * ├─────────────────────────────────────────────────┤
 * │ Time Engine Controls (Clock + Day/Night)         │
 * ├─────────────────────────────────────────────────┤
 * │ Roster Section (inline layout, sortable)         │
 * ├─────────────────────────────────────────────────┤
 * │ Activity Slots (simple rack for testing)         │
 * └─────────────────────────────────────────────────┘
 * 
 * Key Components Integration:
 * - VillageRosterSection: Uses canonical inline layout
 * - PgCard: Minimal design with optimized portrait/text
 * - DragTestContainer: Streamlined DOM with drag handle
 * - ClockWidget: Time display with speed controls
 * - DayNightActionCard: Day/night cycle toggle
 * 
 * @component
 * @example
 * // Usage in App.tsx
 * <MinimalGameplayPage />
 */

function MinimalGameplayPageContent(): JSX.Element {
  // Use the actual theme switcher hook for functional Style Laboratory
  const themeApi = useThemeSwitcher();
  
  const { config: idleVillageConfig } = useIdleVillageConfig();
  const resolvedIdleConfig = idleVillageConfig ?? DEFAULT_IDLE_VILLAGE_CONFIG;
  
  // Time engine state from useMinimalGameplay with IdleVillageConfig integration
  const gameplayState = useMinimalGameplayWithIdleVillageConfig();
  const styleLabTokens = useStyleLabTokens();
  const logicConfig: MinimalConfig = gameplayState.config;
  const questFallbackId = MINIMAL_GAMEPLAY_CONFIG.locations[1]?.activityId || 'quest_forest_hunt_minimal';
  const [statusMessage, setStatusMessage] = useState('');
  
  const [selectedPOI, setSelectedPOI] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Roster sort mode state with default Name A -> Z
  const [sortMode, setSortMode] = useState<RosterSortMode>(DEFAULT_ROSTER_SORT_MODE);
  
  // Centralized timing system - single source of truth for all timing
  useCentralizedTiming({ gameplayState });

  const rosterWithWarnings = useMemo(
    () => selectRosterWithWarnings(gameplayState.state, logicConfig),
    [gameplayState.state, logicConfig],
  );

  const loopWarnings = useMemo(
    () => selectLoopWarnings(gameplayState.state, logicConfig),
    [gameplayState.state, logicConfig],
  );

  const announceAriaMessage = useCallback((message: string) => {
    // Create temporary aria-live element for screen reader announcements
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.style.position = 'absolute';
    ariaLive.style.left = '-10000px';
    ariaLive.style.width = '1px';
    ariaLive.style.height = '1px';
    ariaLive.style.overflow = 'hidden';
    document.body.appendChild(ariaLive);
    ariaLive.textContent = message;
    const cleanup = setTimeout(() => document.body.removeChild(ariaLive), 1000); // TODO: Replace with useSandboxClock
    return cleanup;
  }, []);

  useEffect(() => {
    if (loopWarnings.ariaLiveMessage) {
      announceAriaMessage(loopWarnings.ariaLiveMessage);
    }
  }, [announceAriaMessage, loopWarnings.ariaLiveMessage]);

  const handleBuyFood = useCallback(async () => {
    const result = gameplayState.buyFood(logicConfig.ui.actionPanel.buyFood.defaultQuantity);
    if (!result?.success && result?.message) {
      setStatusMessage(result.message);
      announceAriaMessage(`Errore: ${result.message}`);
    } else {
      setStatusMessage('');
    }
    return result;
  }, [announceAriaMessage, gameplayState, logicConfig.ui.actionPanel.buyFood.defaultQuantity]);

  const handleStartQuestDemo = useCallback(async () => {
    const availableResidents = rosterWithWarnings.filter((resident) => !resident.isWorking && !resident.isInjured);
    if (availableResidents.length === 0) {
      const message = 'Nessun residente disponibile per la quest';
      setStatusMessage(message);
      announceAriaMessage(`Errore: ${message}`);
      return { success: false, message } as const;
    }

    const residentIds = [availableResidents[0].id];
    const result = gameplayState.startQuestDemo(questFallbackId, residentIds);

    if (!result?.success && result?.message) {
      setStatusMessage(result.message);
      announceAriaMessage(`Errore: ${result.message}`);
    } else {
      setStatusMessage('');
    }

    return result;
  }, [announceAriaMessage, gameplayState, questFallbackId, rosterWithWarnings]);

  // Drag & Drop setup - SAME as TestRosterPage
  const { activeId, setActiveId } = useDragContext();
  const { validateDrop } = useResidentDropValidation();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  // Use canonical Village Resident Store for functional parity with /test
  const { residents: rosterResidents, getResidentById } = useVillageResidents();
  
  // Create residentsById helper for CustomDragOverlay compatibility
  const residentsById = useMemo(() => {
    const byId: Record<string, typeof rosterResidents[0]> = {};
    rosterResidents.forEach(resident => {
      byId[resident.id] = resident;
    });
    return byId;
  }, [rosterResidents]);

  const handleStartWoodGathering = useCallback(async () => {
    const firstResident = rosterResidents[0];
    if (!firstResident) {
      const message = 'Nessun residente disponibile';
      setStatusMessage(message);
      announceAriaMessage(`Errore: ${message}`);
      return { success: false, message };
    }

    const validation = gameplayState.canStartActivity(firstResident.id, 'job_gathering_basic');
    if (!validation.canStart) {
      const message = validation.reason || 'Impossibile iniziare il legname';
      setStatusMessage(message);
      announceAriaMessage(`Errore: ${message}`);
      return { success: false, message };
    }

    try {
      gameplayState.startActivity(firstResident.id, 'job_gathering_basic');
      setStatusMessage('');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante l\'attività';
      setStatusMessage(message);
      announceAriaMessage(`Errore: ${message}`);
      return { success: false, message };
    }
  }, [announceAriaMessage, gameplayState, rosterResidents]);

  const handleStartRepeatableQuest = useCallback(async () => {
    const firstResident = rosterResidents[0];
    if (!firstResident) {
      const message = 'Nessun residente disponibile';
      setStatusMessage(message);
      announceAriaMessage(`Errore: ${message}`);
      return { success: false, message };
    }

    const validation = gameplayState.canStartActivity(firstResident.id, 'quest_gold_repeatable');
    if (!validation.canStart) {
      const message = validation.reason || 'Impossibile iniziare la quest';
      setStatusMessage(message);
      announceAriaMessage(`Errore: ${message}`);
      return { success: false, message };
    }

    try {
      gameplayState.startActivity(firstResident.id, 'quest_gold_repeatable');
      setStatusMessage('');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante l\'attività';
      setStatusMessage(message);
      announceAriaMessage(`Errore: ${message}`);
      return { success: false, message };
    }
  }, [announceAriaMessage, gameplayState, rosterResidents]);

  const handleStartDangerousQuest = useCallback(async () => {
    const firstResident = rosterResidents[0];
    if (!firstResident) {
      const message = 'Nessun residente disponibile';
      setStatusMessage(message);
      announceAriaMessage(`Errore: ${message}`);
      return { success: false, message };
    }

    const validation = gameplayState.canStartActivity(firstResident.id, 'quest_forest_hunt_minimal');
    if (!validation.canStart) {
      const message = validation.reason || 'Impossibile iniziare la quest pericolosa';
      setStatusMessage(message);
      announceAriaMessage(`Errore: ${message}`);
      return { success: false, message };
    }

    try {
      gameplayState.startActivity(firstResident.id, 'quest_forest_hunt_minimal');
      setStatusMessage('');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante l\'attività';
      setStatusMessage(message);
      announceAriaMessage(`Errore: ${message}`);
      return { success: false, message };
    }
  }, [announceAriaMessage, gameplayState, rosterResidents]);

  const resolvedSkinPillar: StyleLabPillar = useMemo(() => {
    const pillar = styleLabTokens?.meta?.pillar;
    if (pillar === 'frontier' || pillar === 'empire' || pillar === 'wilderness') {
      return pillar;
    }
    return 'frontier';
  }, [styleLabTokens.meta?.pillar]);

  const resolvedPgCardSkinId = useMemo(() => {
    if (styleLabTokens?.pgCardSkin?.enabled) {
      return styleLabTokens.meta?.presetId ?? 'minimal_frontier';
    }
    return 'minimal_frontier';
  }, [styleLabTokens]);

  const dragSkinContext = useMemo(
    () => ({
      locationType: 'minimal-gameplay',
      scenarioType: styleLabTokens?.meta?.presetId ?? 'minimal-frontier',
    }),
    [styleLabTokens.meta?.presetId],
  );

  // POI handlers for ActivityCapsule (follow TestRosterPage pattern)
  const handlePOIClick = useCallback((activityId: string) => {
    setSelectedPOI(activityId);
    setIsDetailOpen(true);
  }, []);

  // Slot assignment handled by ActivityCapsule through canonical store
  // No local slotAssignments state needed

  const handlePOIDetailClose = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedPOI(null);
  }, []);

  // Drag handlers - SAME as TestRosterPage
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const residentId = event.active.id as string;
    setActiveId(residentId);
  }, [setActiveId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { over } = event;
    if (!over) {
      return;
    }

    const residentId = event.active.id as string;
    const dropTargetId = over.id as string;
    
    // Parse drop target ID to extract activity information
    // Expected format: "activity-{activityId}" or "poi-detail-{activityId}"
    const activityMatch = dropTargetId.match(/^(activity|poi-detail)-(.+)$/);
    if (!activityMatch) {
      return;
    }
    
    const activityId = activityMatch[2];
    const resident = rosterResidents.find(r => r.id === residentId);
    
    
    // Get activity definition for validation
    const activityDefinition = idleVillageConfig.activities[activityId];
    
    // Validate drop using canonical validation system
    const validationResult = validateDrop({
      resident,
      activity: activityDefinition,
      context: dropTargetId.startsWith('poi-detail') ? 'poi_detail' : 'map_slot',
    });
    
    
    if (validationResult.isValid) {
      // Start activity through gameplayState
      const result = gameplayState.startActivity(residentId, activityId);
      
      // Close POI detail if open and this is the same activity
      if (isDetailOpen && selectedPOI === activityId) {
        handlePOIDetailClose();
      }
    } else {
    }
  }, [setActiveId, rosterResidents, idleVillageConfig.activities, validateDrop, gameplayState, isDetailOpen, selectedPOI, handlePOIDetailClose]);

  // Get activities from defaultConfig-based architecture
  const availableActivities = useMemo(() => {
    return Object.values(idleVillageConfig.activities).filter((activity: ActivityDefinition) => {
      // Filter for minimal gameplay POI only - show core loop activities
      return activity.id === 'job_training_basic' || 
             activity.id === 'quest_gold_repeatable' ||
             activity.id === 'job_gathering_basic';
    });
  }, [idleVillageConfig.activities]);

  // Canonical slot rack integration using useResidentSlotController
  const slotController = useResidentSlotController({
    activity: availableActivities[0], // Use first activity for minimal gameplay
    assignments: {}, // Empty assignments for now
    residents: residentsById,
    hoveredResidentId: null,
    slotBlueprints: [],
    scheduler: undefined,
    onAssign: (slotId, residentId) => {
      // Handle assignment through gameplayState
      const activity = availableActivities[0];
      if (activity) {
        gameplayState.startActivity(residentId, activity.id);
      }
    },
    onClear: (slotId) => {
      // Handle clear through gameplayState
    }
  });

  // POI activity assignment handler with validation
  const _handlePOIActivityAssign = useCallback((activityId: string, residentId: string) => {
    
    // Get activity definition for validation
    const activityDefinition = idleVillageConfig.activities[activityId];
    
    // Get resident for validation
    const resident = rosterResidents.find(r => r.id === residentId);
    
    // Validate drop using canonical validation system
    const validationResult = validateDrop({
      resident,
      activity: activityDefinition,
      context: 'poi_detail',
    });
    
    
    if (validationResult.isValid) {
      // Start activity through gameplayState
      const result = gameplayState.startActivity(activityId, residentId);
    } else {
    }
  }, [idleVillageConfig.activities, rosterResidents, validateDrop, gameplayState]);

  // Roster select handler
  const handleRosterSelect = useCallback((_residentId: string) => {
    // Handle roster selection logic here (no-op placeholder for canonical shell)
  }, []);

  return (
    <TooltipProvider>
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
        {/* Style Laboratory - Top only */}
        <div className="p-4">
          <StyleLaboratoryPanel
            activePreset={themeApi.activePreset}
            presets={themeApi.presets}
            isRandomized={themeApi.isRandomized}
            onSelectPreset={themeApi.setPreset}
            onRandomize={themeApi.randomizeTheme}
            onResetRandomization={themeApi.resetRandomization}
            kickerLabel="Style Laboratory"
            collapsible={true}
          />
        </div>

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
                {gameplayState.state.isDayPhase ? '☀️ Day' : '🌙 Night'}
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  accentHex={styleLabTokens.modifierScopes.SESSION.border}
                  onSpeedChange={(speed) => gameplayState.setSpeedMultiplier(speed)}
                />
              </div>
              
              {/* Time Controls */}
              <div className="flex flex-col justify-center space-y-2">
                <div className="text-sm">
                  <strong>Day:</strong> {gameplayState.state.currentDay}
                </div>
                <div className="text-sm">
                  <strong>Tick:</strong> {gameplayState.state.currentTick}
                </div>
                <div className="text-sm">
                  <strong>Cycle Progress:</strong> {(gameplayState.state.cycleProgress * 100).toFixed(1)}%
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => gameplayState.state.isPaused ? gameplayState.resumeGame('user') : gameplayState.pauseGame('user')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      gameplayState.state.isPaused 
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {gameplayState.state.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                  </button>
                  <button
                    onClick={() => gameplayState.resetGame()}
                    className="px-3 py-1 rounded text-sm font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
              
              {/* Day/Night Cycle - POI Halo Progress */}
              <div className="flex items-center justify-center">
                <div 
                  className="cursor-pointer"
                  onClick={() => gameplayState.state.isPaused ? gameplayState.resumeGame('user') : gameplayState.pauseGame('user')}
                  data-testid="day-night-poi-skin"
                >
                  <DayNightPOI />
                </div>
              </div>
            </div>
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
            statusMessage={statusMessage}
            disabled={gameplayState.state.isPaused}
            uiConfig={logicConfig.ui}
          />
        </div>

        {/* Roster Section */}
                <VillageRosterSection
          residents={rosterResidents}
          assignmentFeedback={undefined}
          onResidentSelect={handleRosterSelect}
          getResidentCompatibility={() => undefined}
          componentId="roster-component"
          pgCardSkinId={resolvedPgCardSkinId}
          pillar={resolvedSkinPillar}
          context={dragSkinContext}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
        />

        {/* POI Activity Slots - Canonical ResidentSlotRack integration */}
        <div className="p-4">
          <StyleLabSurface variant="card" className="w-full">
            <h3 className="text-lg font-semibold mb-4">Available Activities</h3>
            
            {/* Canonical Slot Rack Integration */}
            <SlotRackWithSkin skinId="slot_wilderness_bronze" rackType="A" slotCount={3}>
              {availableActivities.map(activity => {
                const activeActivity = gameplayState.state.activeActivities.find(a => a.activityId === activity.id);
                const assignedResident = rosterResidents.find(r => r.id === activeActivity?.residentId);
                
                return (
                  <div key={activity.id} className="mb-4">
                    <h4 className="text-sm font-medium mb-2">{activity.label}</h4>
                    <ResidentSlotRack
                      layout="board"
                      overflowBehavior="wrap"
                      slots={slotController.slots}
                      onSlotClick={(slotId) => {
                        // Handle slot click through slot controller
                        const slot = slotController.slots.find(s => s.id === slotId);
                        if (slot && !slot.assignedResidentId) {
                          // Find first available resident
                          const availableResident = rosterResidents.find(r => 
                            r.status === 'available' && !r.isInjured
                          );
                          if (availableResident) {
                            gameplayState.startActivity(availableResident.id, activity.id);
                          }
                        }
                      }}
                      onSlotClear={(slotId) => {
                        // Handle clear through gameplayState
                        if (activeActivity) {
                          // Note: Cancel logic would need gameplayState.cancelActivity
                        }
                      }}
                    />
                  </div>
                );
              })}
            </SlotRackWithSkin>
          </StyleLabSurface>
        </div>
        
        {/* POI Detail Panel - Canonical path: PoiDetailSkinWrapper */}
        {isDetailOpen && selectedPOI && (() => {
          const activityDefinition = idleVillageConfig.activities[selectedPOI];
          const activeActivity = gameplayState.state.activeActivities.find(a => a.activityId === selectedPOI);
          const assignedResident = rosterResidents.find(r => r.id === activeActivity?.residentId);
          const isActive = !!activeActivity;
          
          // Canonical progress calculation from runtime state
          const duration = activityDefinition?.durationFormula ? parseFloat(activityDefinition.durationFormula) : 60;
          const elapsed = isActive ? (duration - (activeActivity?.ticksRemaining || 0)) : 0;
          const progress = isActive ? (elapsed / duration) : 0;
          
          // Build reward display from activity definition
          const rewardDisplay = activityDefinition?.rewards 
            ? activityDefinition.rewards.map(r => `${r.amountFormula || '0'} ${r.resourceId}`).join(', ')
            : 'No rewards';
          
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <PoiDetailSkinWrapper
                activityId={selectedPOI}
                name={activityDefinition?.label || selectedPOI}
                type={activityDefinition?.tags?.includes('job') ? 'job' : 'quest'}
                subtitle={activityDefinition?.description || 'Activity details'}
                status={isActive ? 'in-progress' : 'idle'}
                progress={1 - progress} // Show completion progress
                duration={duration}
                elapsed={isActive ? (duration - (activeActivity?.ticksRemaining || 0)) : 0}
                slots={[
                  {
                    id: 'slot-1',
                    state: assignedResident ? 'active' : 'empty',
                    initial: 'empty',
                    progress: 1 - progress,
                    assignedWorkerName: assignedResident?.displayName,
                    assignedWorkerAvatarUrl: assignedResident?.displayName,
                  }
                ]}
                maxSlots={1}
                durationDisplay={`${duration} ticks`}
                rewardDisplay={rewardDisplay}
                etaDisplay={isActive ? 'In progress...' : 'Ready to start'}
                telemetry={[
                  {
                    id: 'detail-view',
                    timestamp: new Date(),
                    message: 'POI detail viewed',
                    type: 'assign'
                  }
                ]}
                onStart={() => {
                  // Start activity through canonical gameplayState
                  if (assignedResident && !isActive) {
                    gameplayState.startActivity(assignedResident.id, selectedPOI);
                  }
                }}
                onCancel={() => {
                  // Cancel activity through canonical gameplayState when available
                  const activeActivity = gameplayState.state.activeActivities.find(a => a.activityId === selectedPOI);
                  if (activeActivity) {
                    // Note: gameplayState.cancelActivity method needed for full implementation
                    // For now, activity cancellation handled by tick engine completion
                  }
                }}
                onCollect={() => {
                  // Complete activity through canonical gameplayState
                  const activeActivity = gameplayState.state.activeActivities.find(a => a.activityId === selectedPOI);
                  if (activeActivity && activeActivity.ticksRemaining <= 0) {
                    // Activity completion handled by tick engine
                    // Rewards processed automatically through gameplayState
                    setStatusMessage(`${activityDefinition?.label || selectedPOI} completed!`);
                  }
                }}
                onSlotAssign={(slotId) => {
                  // Canonical slot assignment through gameplayState
                  const availableResidents = rosterResidents.filter(r => r.status === 'available' && !r.isInjured);
                  if (availableResidents.length > 0) {
                    const residentId = availableResidents[0].id;
                    gameplayState.startActivity(residentId, selectedPOI);
                  }
                }}
                onSlotDetach={(slotId) => {
                  // Slot detach handled through canonical gameplayState when cancelActivity is available
                }}
                onClose={handlePOIDetailClose}
                isOpen={isDetailOpen}
              />
            </div>
          );
        })()}
      </div>
      <CustomDragOverlay
        residentsById={residentsById}
        usePgCardPreview={true}
        useChildVersion={false}
        dragVisualState={{
          mode: activeId ? 'dragging' : 'idle',
          residentId: activeId || undefined,
        }}
      />
    </DndContext>
    </TooltipProvider>
  );
}

export default function MinimalGameplayPage(): JSX.Element {
  // Lightweight diagnostic exposure for user session portrait truth capture
  useEffect(() => {
    // Expose diagnostic function to window for user console access
    (window as any).__USER_SESSION_PORTRAIT_DIAGNOSTIC__ = async () => {
      try {
        const resolverModule = await import('@/engine/game/idleVillage/residentVisualResolver');
        const resolveResidentPortrait = resolverModule.resolveResidentPortrait;

        // Get storage values
        const storeRaw = localStorage.getItem('village-resident-store');
        const storeData = storeRaw ? JSON.parse(storeRaw) : null;
        const residents = Array.isArray(storeData?.residents) ? storeData.residents : [];

        const idleCharactersRaw = localStorage.getItem('idle_combat_characters');
        const idleCharacters = idleCharactersRaw ? JSON.parse(idleCharactersRaw) : [];

        // Get DOM card data
        const cards = Array.from(document.querySelectorAll('[data-testid="pg-card"]'));
        const domById = new Map();
        cards.forEach((card) => {
          const workerId = card.getAttribute('data-worker-id') ?? 'unknown';
          const img = card.querySelector('img');
          domById.set(workerId, {
            hasImg: !!img,
            imgSrc: img?.getAttribute('src') ?? null,
            imgCurrentSrc: img?.currentSrc ?? null,
            naturalWidth: img?.naturalWidth ?? 0,
            naturalHeight: img?.naturalHeight ?? 0,
            renderedWidth: img?.clientWidth ?? 0,
            renderedHeight: img?.clientHeight ?? 0,
            hasPortraitAttr: card.getAttribute('data-has-portrait'),
          });
        });

        // Build resident diagnostics
        const residentDiagnostics = residents.map((resident) => {
          const resolved = resolveResidentPortrait(resident);
          const domInfo = domById.get(resident.id) ?? null;
          return {
            id: resident.id,
            displayName: resident.displayName,
            visualProfileId: resident.visualProfileId ?? null,
            statProfileId: resident.statProfileId ?? null,
            rawPortraitUrl: resident.portraitUrl ?? null,
            resolvedPortraitUrl: resolved.portraitUrl,
            resolvedSource: resolved.source,
            dom: domInfo,
          };
        });

        return {
          timestamp: new Date().toISOString(),
          residents: residentDiagnostics,
          storage: {
            idleCombatCharacters: idleCharacters,
            villageResidentStore: {
              residents: residents,
              metadata: {
                usedFallback: storeData?.usedFallback ?? null,
                charactersConverted: storeData?.charactersConverted ?? null,
                savedAt: storeData?.savedAt ?? null,
              },
            },
          },
          domCardCount: cards.length,
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        };
      }
    };

    // Add console helper for easy user access
    console.log(
      '%c🔍 User Session Portrait Diagnostic',
      'color: #4f46e5; font-weight: bold; font-size: 14px;',
      '\nRun: __USER_SESSION_PORTRAIT_DIAGNOSTIC__() in console to capture portrait truth'
    );
  }, []);

  return (
    <DragPhysicsProvider>
      <DragProvider>
        <MinimalGameplayPageContent />
      </DragProvider>
    </DragPhysicsProvider>
  );
}

/**
 * CANONICAL VERSION NOTES:
 * 
 * This version of MinimalGameplayPage is frozen and represents the canonical design
 * for the minimal idle village gameplay interface after post-freeze optimizations.
 * 
 * Key frozen characteristics:
 * - Streamlined layout: Essential gameplay elements only
 * - Style Laboratory integration: Full theme customization
 * - Time Engine controls: Clock widget and day/night cycle
 * - Compact roster: Uses canonical inline layout with minimal PgCards
 * - Drag functionality: Full dnd-kit integration with sortable roster
 * - Optimized spacing: Minimal gaps and padding throughout
 * 
 * Roster Integration (Canonical):
 * - VillageRosterSection with componentId="roster-component"
 * - Uses default inline layout for compact display
 * - PgCard horizontal variant with minimal design
 * - Full drag-and-drop support with CustomDragOverlay
 * - No assignment feedback (minimal gameplay)
 * 
 * Component Stack (Post-Freeze):
 * - StyleLaboratoryPanel: Theme customization (collapsible)
 * - ClockWidget: Time display and speed controls
 * - DayNightActionCard: Day/night cycle toggle
 * - VillageRosterSection: Compact inline roster
 * - ResidentSlotRack: Simple activity slots for testing
 * - CustomDragOverlay: Visual feedback for drag operations
 * 
 * Usage Pattern:
 * - Use as main gameplay interface for minimal idle village
 * - Provides all essential functionality in compact form
 * - Integrates with Style Laboratory for theming
 * - Supports full drag-and-drop resident management
 * - Maintains canonical design consistency across components
 * 
 * @version 1.1.0 (CANONICAL - Post-Freeze Optimizations)
 * @component
 */

