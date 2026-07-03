import { useState, useCallback, useEffect, useMemo } from 'react';
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { JobPOI } from '@/ui/idleVillage/components/minimal/JobPOI';
import { RosterDraggable } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import ResidentSlotRack from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import { useMinimalGameplayStore, initializeMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';

export default function MinimalJobPoiRosterIntegrationPage() {
  const [initialized, setInitialized] = useState(false);
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);

  // Initialize store on mount
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      initializeMinimalGameplayStore().catch((err) => {
        console.error('Failed to initialize minimal gameplay store:', err);
      });
    }
  }, [initialized]);

  // Get real data from store
  const gameplayState = useMinimalGameplayStore();
  const residents = gameplayState.state.residents;
  const activeActivities = gameplayState.state.activeActivities;
  const startActivity = gameplayState.startActivity;
  const canStartActivity = gameplayState.canStartActivity;
  const isLoading = gameplayState.isLoading;
  const error = gameplayState.error;

  // Derive slot view models from real store data
  const slotViewModels: ResidentSlotViewModel[] = useMemo(() => {
    const jobActivityId = 'chop-wood';
    const activeActivity = activeActivities.find(a => a.activityId === jobActivityId);
    
    return [{
      id: 'slot-1',
      index: 0,
      label: 'Slot 1',
      assignedResidentId: activeActivity?.residentId ?? null,
      assignedResident: activeActivity?.residentId ? residents.find(r => r.id === activeActivity.residentId) : undefined,
      activity: {
        id: jobActivityId,
        label: 'Chop Wood',
        icon: '🪓',
        statRequirement: { allOf: ['hp200'] },
      },
      requirement: { label: 'HP > 200' },
      required: true,
      isLocked: false,
      isPlaceholder: false,
      activityState: {
        state: activeActivity?.status === 'working' ? 'working' : 'idle',
        progress: activeActivity?.progress ?? 0,
        remainingSeconds: 0,
        isLockedByPhase: false,
      },
    }];
  }, [activeActivities, residents]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const residentId = event.active.id as string;
    setDraggingResidentId(residentId);
  }, []);

  // Handle drag end - uses real store validation
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      // Dropped outside any droppable - spring-back happens automatically
      setDraggingResidentId(null);
      return;
    }

    const residentId = active.id as string;
    const slotId = over.id as string;
    const activityId = 'chop-wood';

    // Validate using real store logic
    const validation = canStartActivity(residentId, activityId);
    if (validation.canStart) {
      startActivity(residentId, activityId);
    } else {
      console.warn('Cannot start activity:', validation.reason);
    }
    
    setDraggingResidentId(null);
  }, [canStartActivity, startActivity]);

  // Handle slot drop - uses real store
  const handleSlotDrop = useCallback((slotId: string, residentId: string) => {
    const activityId = 'chop-wood';
    const validation = canStartActivity(residentId, activityId);
    if (validation.canStart) {
      startActivity(residentId, activityId);
    }
  }, [canStartActivity, startActivity]);

  // Handle slot clear - uses real store
  const handleSlotClear = useCallback((slotId: string) => {
    const activeActivity = activeActivities.find(a => a.activityId === 'chop-wood');
    if (activeActivity?.residentId) {
      // TODO: Implement remove activity in store
      console.log('Clear slot:', slotId, 'resident:', activeActivity.residentId);
    }
  }, [activeActivities]);

  // Handle slot click
  const handleSlotClick = useCallback((slotId: string) => {
    console.log('Slot clicked:', slotId);
  }, []);

  if (isLoading) {
    return <div className="text-ivory">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <TooltipProvider>
      <SkinSystemProvider>
        <SandboxTimingProvider>
          <DragProvider>
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <CustomDragOverlay />
              <div data-testid="minimal-job-poi-roster-integration-page" className="min-h-screen bg-slate-950 p-8 text-ivory">
                <div className="mx-auto max-w-6xl space-y-8">
                  <header>
                    <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Minimal Slice · Job POI + Roster</p>
                    <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">JOB POI + ROSTER INTEGRATION</h1>
                    <p className="mt-1 text-sm text-slate-400">Canonical components from TestHub</p>
                    <p className="mt-2 text-xs text-slate-500">Route: /minimal-job-poi-roster-integration</p>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Roster */}
                    <div className="space-y-4">
                      <div className="bg-slate-900/30 border border-slate-700/50 rounded-lg p-6">
                        <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider mb-4">Village Roster</h2>
                        <RosterDraggable componentId="job-poi-roster" useWanderlustSkin={true} />
                      </div>
                    </div>

                    {/* Right: Job POI + Slot */}
                    <div className="space-y-4">
                      <div className="bg-white border border-slate-700/50 rounded-lg p-6">
                        <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wider mb-4">Job POI + Slot (Same Requirements)</h2>
                        <div className="flex items-center justify-center gap-8 h-80">
                          <JobPOI
                            activityId="chop-wood"
                            label="Chop Wood"
                            icon="🪓"
                            status={slotViewModels[0]?.activityState.state === 'working' ? 'working' : 'idle'}
                            progress={slotViewModels[0]?.activityState.progress ?? 0}
                            rewardLabel="🪵 +10/h"
                            size={160}
                            freeSlots={slotViewModels[0]?.assignedResidentId ? 0 : 1}
                            maxSlots={1}
                            canAcceptDrop={true}
                            requirements={{
                              minHp: 200,
                            }}
                            slots={[
                              {
                                id: 'slot-1',
                                requirements: {
                                  minHp: 200,
                                },
                              },
                            ]}
                            onClick={() => {
                              console.log('Navigate to POI detail for activityId: chop-wood');
                            }}
                          />
                          <ResidentSlotRack
                            slots={slotViewModels}
                            onSlotDrop={handleSlotDrop}
                            onSlotClear={handleSlotClear}
                            onSlotClick={handleSlotClick}
                            draggingResidentId={draggingResidentId}
                            layout="horizontal"
                            slotSize={60}
                          />
                          <div className="text-xs text-slate-400 mt-2">
                            {slotViewModels[0]?.requirement?.label || 'No requirement'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DndContext>
          </DragProvider>
        </SandboxTimingProvider>
      </SkinSystemProvider>
    </TooltipProvider>
  );
}
