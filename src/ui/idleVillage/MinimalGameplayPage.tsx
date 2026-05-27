import type { JSX } from 'react';
import React, { useState, useMemo, useCallback } from 'react';
import { DndContext, pointerWithin, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { StyleLaboratoryPanel } from '@/ui/styleLab/StyleLaboratoryPanel';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import { useVillageResidents } from '@/ui/idleVillage/hooks/useVillageResidents';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { DragProvider, useDragContext } from '@/ui/idleVillage/components/DragContext';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { useCentralizedTiming } from '@/ui/idleVillage/hooks/useCentralizedTiming';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { DragPhysicsProvider } from '@/ui/styleLab/physics/DragPhysicsContext';
import { ClockWidget } from '@/ui/idleVillage/components/minimal/ClockWidget';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import DayNightPOI from '@/ui/idleVillage/components/minimal/DayNightPOI';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';
import { ResourcePanel } from '@/ui/idleVillage/components/ResourcePanel';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';
import type { RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import { DEFAULT_ROSTER_SORT_MODE } from '@/ui/idleVillage/config/rosterSortConfig';

function MinimalGameplayPageContent(): JSX.Element {
  const themeApi = useThemeSwitcher();
  const { config: idleVillageConfig } = useIdleVillageConfig();
  const gameplayState = useMinimalGameplayWithIdleVillageConfig();
  const styleLabTokens = useStyleLabTokens();
  const [sortMode, setSortMode] = useState<RosterSortMode>(DEFAULT_ROSTER_SORT_MODE);

  useCentralizedTiming({ gameplayState });

  const { activeId, setActiveId } = useDragContext();
  const { validateDrop } = useResidentDropValidation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const { residents: rosterResidents } = useVillageResidents();

  const residentsById = useMemo(() => {
    const byId: Record<string, typeof rosterResidents[0]> = {};
    rosterResidents.forEach(resident => { byId[resident.id] = resident; });
    return byId;
  }, [rosterResidents]);

  const resolvedSkinPillar: StyleLabPillar = useMemo(() => {
    const pillar = styleLabTokens?.meta?.pillar;
    if (pillar === 'frontier' || pillar === 'empire' || pillar === 'wilderness') return pillar;
    return 'frontier';
  }, [styleLabTokens.meta?.pillar]);

  const resolvedPgCardSkinId = useMemo(() => {
    if (styleLabTokens?.pgCardSkin?.enabled) return styleLabTokens.meta?.presetId ?? 'minimal_frontier';
    return 'minimal_frontier';
  }, [styleLabTokens]);

  const dragSkinContext = useMemo(() => ({
    locationType: 'minimal-gameplay',
    scenarioType: styleLabTokens?.meta?.presetId ?? 'minimal-frontier',
  }), [styleLabTokens.meta?.presetId]);

  const handleRosterSelect = useCallback((_residentId: string) => {}, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, [setActiveId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { over } = event;
    if (!over) return;

    const residentId = event.active.id as string;
    const dropTargetId = over.id as string;
    const activityMatch = dropTargetId.match(/^(activity|poi-detail)-(.+)$/);
    if (!activityMatch) return;

    const activityId = activityMatch[2];
    const resident = rosterResidents.find(r => r.id === residentId);
    const activityDefinition = idleVillageConfig.activities[activityId];

    const validationResult = validateDrop({
      resident,
      activity: activityDefinition,
      context: dropTargetId.startsWith('poi-detail') ? 'poi_detail' : 'map_slot',
    });

    if (validationResult.isValid) {
      gameplayState.startActivity(residentId, activityId);
    }
  }, [setActiveId, rosterResidents, idleVillageConfig.activities, validateDrop, gameplayState]);

  const availableActivities = useMemo(() => {
    return Object.values(idleVillageConfig.activities).filter((activity: ActivityDefinition) =>
      activity.id === 'job_training_basic' ||
      activity.id === 'quest_gold_repeatable' ||
      activity.id === 'job_gathering_basic'
    );
  }, [idleVillageConfig.activities]);

  const slotController = useResidentSlotController({
    activity: availableActivities[0],
    assignments: {},
    residents: residentsById,
    hoveredResidentId: null,
    slotBlueprints: [],
    scheduler: undefined,
    onAssign: (_slotId, residentId) => {
      const activity = availableActivities[0];
      if (activity) gameplayState.startActivity(residentId, activity.id);
    },
    onClear: (_slotId) => {},
  });

  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {activeId && (
          <style>{`body, body * { cursor: grabbing !important; }`}</style>
        )}

        <div data-testid="minimal-gameplay-page" className="bg-slate-950 min-h-screen">

          {/* SECTION 1: Style Laboratory */}
          <div className="p-4 border-b border-slate-800">
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

          {/* SECTION 2: Time Engine */}
          <div className="p-4">
            <StyleLabSurface variant="card" className="w-full">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Time Engine
                <span className={`text-sm px-2 py-1 rounded ${gameplayState.state.isDayPhase ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                  {gameplayState.state.isDayPhase ? '☀️ Day' : '🌙 Night'}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="flex flex-col justify-center space-y-2">
                  <div className="text-sm"><strong>Day:</strong> {gameplayState.state.currentDay}</div>
                  <div className="text-sm"><strong>Tick:</strong> {gameplayState.state.currentTick}</div>
                  <div className="text-sm"><strong>Cycle Progress:</strong> {(gameplayState.state.cycleProgress * 100).toFixed(1)}%</div>
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
                <div
                  className="flex items-center justify-center cursor-pointer"
                  onClick={() => gameplayState.state.isPaused ? gameplayState.resumeGame('user') : gameplayState.pauseGame('user')}
                  data-testid="day-night-poi-skin"
                >
                  <DayNightPOI />
                </div>
              </div>
            </StyleLabSurface>
          </div>

          {/* SECTION 3: Resources */}
          <div className="p-4">
            <StyleLabSurface variant="card" className="w-full">
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ResourcePanel
                items={[
                  { id: 'gold', label: 'Gold', icon: 'gold', value: gameplayState.state.gold, accentClass: 'text-yellow-600' },
                  {
                    id: 'food', label: 'Food', icon: 'food',
                    value: `${gameplayState.state.food}/${gameplayState.state.maxFood}`,
                    accentClass: gameplayState.state.food < 3 ? 'text-red-600' : 'text-green-600'
                  },
                ]}
              />
            </StyleLabSurface>
          </div>

          {/* SECTION 4: Roster (single instance) */}
          <div className="p-4">
            <StyleLabSurface variant="card" className="w-full">
              <h3 className="text-lg font-semibold mb-4">Roster</h3>
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
            </StyleLabSurface>
          </div>

          {/* SECTION 5: Slot Rack (simplified) */}
          <div className="p-4">
            <StyleLabSurface variant="card" className="w-full">
              <h3 className="text-lg font-semibold mb-4">Available Activities</h3>
              <ResidentSlotRack
                layout="board"
                overflowBehavior="wrap"
                slots={slotController.slots}
                onSlotClick={(slotId) => {
                  const slot = slotController.slots.find(s => s.id === slotId);
                  if (slot && !slot.assignedResidentId) {
                    const availableResident = rosterResidents.find(r => r.status === 'available' && !r.isInjured);
                    if (availableResident) {
                      gameplayState.startActivity(availableResident.id, availableActivities[0]?.id || '');
                    }
                  }
                }}
                onSlotClear={(_slotId) => {}}
              />
            </StyleLabSurface>
          </div>

          {/* PLACEHOLDER: SlottedMetal (white box) */}
          <div className="p-4">
            <StyleLabSurface variant="card" className="w-full">
              <h3 className="text-lg font-semibold mb-4">SlottedMetal (Placeholder)</h3>
              <div className="w-full h-32 bg-white rounded border border-gray-300 flex items-center justify-center">
                <p className="text-gray-500">SlottedMetal component — To be developed</p>
              </div>
            </StyleLabSurface>
          </div>

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
  return (
    <DragPhysicsProvider>
      <DragProvider>
        <MinimalGameplayPageContent />
      </DragProvider>
    </DragPhysicsProvider>
  );
}
