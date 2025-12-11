/**
 * Minimal Idle Village Game UI (Cultist Simulator-style lanes + drag&drop)
 * This is a barebones prototype to allow testing the time+activity+job+quest engines.
 * Uses the Gilded Observatory theme and follows config-first principles.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { Briefcase, MapPin, ScrollText, Pause, Play, Eye } from 'lucide-react';
import idleVillageMap from '@/assets/ui/idleVillage/idle-village-map.jpg';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { createInitialVillageState, scheduleActivity } from '@/engine/game/idleVillage/TimeEngine';
import type { VillageState, ResidentState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import { tickIdleVillage } from '@/engine/game/idleVillage/IdleVillageEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { DefaultSection } from '@/ui/components/DefaultUI';

// Minimal deterministic RNG for reproducible testing
const simpleRng = (() => {
  let seed = 12345;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
})();

// Stub resident for testing
const stubResident: ResidentState = { id: 'resident-1', status: 'available', fatigue: 0 };

interface ResidentCardProps {
  resident: ResidentState;
  getFatigueColor: (fatigue: number) => string;
}

function ResidentCard({ resident, getFatigueColor }: ResidentCardProps) {
  const isAvailable = resident.status === 'available';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `resident-${resident.id}`,
    data: { type: 'resident', residentId: resident.id },
    disabled: !isAvailable,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const cardClasses = [
    'default-card flex flex-col gap-0.5 cursor-grab active:cursor-grabbing transition-opacity px-1.5 py-1 max-w-[160px]',
    !isAvailable ? 'opacity-40 cursor-not-allowed' : '',
    isDragging ? 'opacity-0 pointer-events-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cardClasses}
    >
      <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-200">
        {resident.id}
      </div>
      <div
        className="h-1.5 w-24 sm:w-28 bg-slate-700 rounded overflow-hidden mt-1"
        title={`Fatigue: ${resident.fatigue}/100`}
      >
        <div
          className={getFatigueColor(resident.fatigue) + ' h-1.5 transition-all duration-200'}
          style={{ width: `${Math.min(100, Math.max(0, resident.fatigue))}%` }}
        />
      </div>
    </div>
  );
}

interface MapSlotMarkerProps {
  slot: { id: string; label: string; slotTags: string[]; icon?: string; colorClass?: string };
  left: number;
  top: number;
  isSelected: boolean;
  hasJobs: boolean;
  hasQuests: boolean;
  jobLabels: string[];
  questLabels: string[];
  onClick: () => void;
}

function MapSlotMarker({ slot, left, top, isSelected, hasJobs, hasQuests, jobLabels, questLabels, onClick }: MapSlotMarkerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slot.id}`,
    data: { type: 'mapSlot', slotId: slot.id },
  });

  const emphasisClass = isSelected || isOver
    ? 'scale-105 drop-shadow-[0_0_12px_rgba(250,250,210,0.9)]'
    : 'opacity-90 hover:opacity-100';

  const hasCustomIcon = typeof slot.icon === 'string' && slot.icon.trim().length > 0;
  const markerTextColor = slot.colorClass ?? 'text-slate-200';

  return (
    <button
      ref={setNodeRef}
      key={slot.id}
      type="button"
      onClick={onClick}
      className={`group absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-1 pointer-events-auto focus:outline-none ${emphasisClass}`}
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <div
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-black/80 border border-gold/70 shadow-lg"
      >
        <span className="absolute inset-0 rounded-full bg-gold/20 blur-[6px] opacity-70" aria-hidden />
        <div className="relative flex items-center justify-center gap-0.5 text-xs">
          {hasCustomIcon ? (
            <span className={`text-base ${markerTextColor}`} aria-hidden>
              {slot.icon}
            </span>
          ) : (
            <>
              {hasQuests && (
                <ScrollText className="w-4 h-4 text-amber-200" />
              )}
              {hasJobs && (
                <Briefcase className="w-4 h-4 text-teal-200" />
              )}
              {!hasQuests && !hasJobs && (
                <MapPin className="w-4 h-4 text-slate-200" />
              )}
            </>
          )}
        </div>
      </div>
      <div className="px-2 py-0.5 rounded-full bg-black/80 border border-slate-700 text-[9px] uppercase tracking-[0.16em] text-slate-100 max-w-[140px] truncate">
        {slot.label}
      </div>
      {/* Hover tooltip with basic location + activity info (desktop focus; mobile can rely on click/select) */}
      <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="rounded bg-black/90 border border-slate-700 px-2 py-1 max-w-xs text-[9px] text-slate-100 text-left shadow-lg">
          <div className="font-semibold uppercase tracking-[0.16em] truncate">{slot.label}</div>
          {jobLabels.length > 0 && (
            <div className="mt-0.5 truncate">
              <span className="text-slate-400">Jobs: </span>
              {jobLabels.join(', ')}
            </div>
          )}
          {questLabels.length > 0 && (
            <div className="mt-0.5 truncate">
              <span className="text-slate-400">Quests: </span>
              {questLabels.join(', ')}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

interface DayCycleRingProps {
  totalSegments: number;
  filledSegments: number;
  isNight: boolean;
}

function DayCycleRing({ totalSegments, filledSegments, isNight }: DayCycleRingProps) {
  const clampedTotal = Math.max(1, totalSegments);
  const clampedFilled = Math.max(0, Math.min(clampedTotal, filledSegments));
  const segmentSize = 100 / clampedTotal;

  const stops: string[] = [];
  for (let i = 0; i < clampedTotal; i += 1) {
    const start = i * segmentSize;
    const end = (i + 1) * segmentSize;
    const color =
      i < clampedFilled
        ? isNight
          ? 'rgba(129, 140, 248, 1)'
          : 'rgba(45, 212, 191, 1)'
        : 'rgba(15, 23, 42, 0.85)';
    stops.push(`${color} ${start}% ${end}%`);
  }

  const backgroundImage = `conic-gradient(${stops.join(', ')})`;

  return (
    <div
      className="relative w-8 h-8 rounded-full border border-gold/60 shadow-inner bg-slate-950 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage }}
      />
      <div className="absolute inset-1.5 rounded-full bg-black/90 border border-slate-800 flex items-center justify-center text-[10px] text-slate-200">
        {isNight ? '☾' : '☼'}
      </div>
    </div>
  );
}

export default function IdleVillagePage() {
  const { config } = useIdleVillageConfig();
  const [villageState, setVillageState] = useState<VillageState>(() => {
    const starting = config.globalRules.startingResources ?? {};
    const initialResources: Record<string, number> = {};
    Object.entries(starting).forEach(([id, value]) => {
      if (typeof value === 'number' && value > 0) {
        initialResources[id] = value;
      }
    });
    const base = createInitialVillageState(initialResources);
    base.residents[stubResident.id] = stubResident;
    return base;
  });
  const [activeResidentId, setActiveResidentId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [resourceDeltas, setResourceDeltas] = useState<Record<string, number>>({});
  const resourceDeltaTimeoutRef = useRef<number | null>(null);
  const [showJobsAndQuests, setShowJobsAndQuests] = useState(true);

  // Schedule an activity (drag&drop simulation via button for now)
  const handleSchedule = useCallback(
    (activityId: string, residentId?: string, explicitSlotId?: string) => {
      if (!config) return;
      const availableResidents = Object.values(villageState.residents).filter(
        (r) => r.status === 'available',
      );
      const chosenResidentId = residentId ?? availableResidents[0]?.id;
      if (!chosenResidentId) {
        console.warn('No available resident to assign to activity');
        return;
      }

      const activityDef = config.activities[activityId] as ActivityDefinition | undefined;
      if (!activityDef) {
        console.warn('Activity not found in config:', activityId);
        return;
      }

      let slotId: string | undefined = explicitSlotId;
      const meta = (activityDef.metadata ?? {}) as { mapSlotId?: string } | undefined;

      if (!slotId && selectedSlotId) {
        slotId = selectedSlotId;
      } else if (!slotId && meta?.mapSlotId) {
        slotId = meta.mapSlotId;
      } else if (!slotId) {
        const allSlots = Object.values(config.mapSlots ?? {});
        const compatible = allSlots.find((slot) =>
          slot.slotTags?.some((tag: string) => activityDef.slotTags.includes(tag)),
        );
        slotId = compatible?.id;
      }

      if (!slotId) {
        console.warn('No suitable map slot found for activity', activityId);
        return;
      }

      try {
        const result = scheduleActivity(
          { config, rng: simpleRng },
          villageState,
          { activityId, characterIds: [chosenResidentId], slotId },
        );
        setVillageState(result.state);
      } catch (e) {
        console.error('Failed to schedule activity', e);
      }
    },
    [config, villageState, selectedSlotId]
  );

  const handleAssignResidentToSlot = useCallback(
    (slotId: string, residentId: string) => {
      if (!config) return;

      const slotDef = config.mapSlots[slotId];
      if (!slotDef) {
        console.warn('No map slot in config with id', slotId);
        return;
      }

      const allActivities = Object.values(config.activities ?? {}) as ActivityDefinition[];
      const candidates = allActivities.filter((activity) => {
        if (!activity.tags?.includes('job')) return false;
        const meta = (activity.metadata ?? {}) as { mapSlotId?: string } | undefined;
        if (meta?.mapSlotId && meta.mapSlotId !== slotId) return false;
        if (!activity.slotTags || activity.slotTags.length === 0) return false;
        const acceptsTag = activity.slotTags.some((tag) => slotDef.slotTags.includes(tag));
        return acceptsTag;
      });

      if (candidates.length === 0) {
        console.warn('No job activity configured for slot', slotId);
        return;
      }

      // Prefer continuous jobs first when multiple jobs exist for a slot.
      candidates.sort((a, b) => {
        const metaA = (a.metadata ?? {}) as { continuousJob?: boolean } | undefined;
        const metaB = (b.metadata ?? {}) as { continuousJob?: boolean } | undefined;
        const aCont = metaA?.continuousJob ? 1 : 0;
        const bCont = metaB?.continuousJob ? 1 : 0;
        return bCont - aCont;
      });

      const chosen = candidates[0];
      handleSchedule(chosen.id, residentId, slotId);
    },
    [config, handleSchedule],
  );

  const advanceTimeBy = useCallback(
    (delta: number) => {
      if (!config) return;
      setVillageState((prev) => {
        const result = tickIdleVillage({ config, rng: simpleRng }, prev, delta);
        let nextState = result.state;

        if (result.completedJobs.length > 0) {
          for (const job of result.completedJobs) {
            const activity = config.activities[job.activityId] as ActivityDefinition | undefined;
            if (!activity) continue;

            const metadata = (activity.metadata ?? {}) as { supportsAutoRepeat?: boolean; continuousJob?: boolean };
            const isContinuous = !!metadata.continuousJob;
            const supportsAuto = !!metadata.supportsAutoRepeat;
            const isAutoOn = isContinuous || supportsAuto;
            if (!isAutoOn) continue;

            const scheduled = nextState.activities[job.scheduledId];
            if (!scheduled) continue;

            const schedResult = scheduleActivity(
              { config, rng: simpleRng },
              nextState,
              {
                activityId: scheduled.activityId,
                characterIds: [...scheduled.characterIds],
                slotId: scheduled.slotId,
              },
            );
            nextState = schedResult.state;
          }
        }

        // Compute per-resource delta for this tick (to drive +X overlays)
        const diffs: Record<string, number> = {};
        const allResourceIds = new Set([
          ...Object.keys(prev.resources ?? {}),
          ...Object.keys(nextState.resources ?? {}),
        ]);
        allResourceIds.forEach((id) => {
          const before = prev.resources[id] ?? 0;
          const after = nextState.resources[id] ?? 0;
          const deltaVal = after - before;
          if (deltaVal !== 0) {
            diffs[id] = (diffs[id] ?? 0) + deltaVal;
          }
        });

        if (Object.keys(diffs).length > 0) {
          setResourceDeltas(diffs);
          if (resourceDeltaTimeoutRef.current !== null) {
            window.clearTimeout(resourceDeltaTimeoutRef.current);
          }
          resourceDeltaTimeoutRef.current = window.setTimeout(() => {
            setResourceDeltas({});
          }, 600);
        }

        return nextState;
      });
    },
    [config],
  );

  // Real-time ticking when playing
  useEffect(() => {
    if (!isPlaying || !config) return undefined;

    const tickMs = 1000;
    const id = window.setInterval(() => {
      advanceTimeBy(1);
    }, tickMs);

    return () => window.clearInterval(id);
  }, [isPlaying, config, advanceTimeBy]);

  // Spacebar hotkey to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;

      event.preventDefault();
      setIsPlaying((prev) => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeType = active.data.current?.type;
    const residentId = active.data.current?.residentId as string | undefined;

    if (activeType === 'resident' && residentId) {
      setActiveResidentId(residentId);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveResidentId(null);
      if (!over) return;

      const activeType = active.data.current?.type;
      const overType = over.data.current?.type;
      const residentId = active.data.current?.residentId as string | undefined;

      if (activeType === 'resident' && residentId) {
        if (overType === 'mapSlot') {
          const slotId = over.data.current?.slotId as string | undefined;
          if (slotId) {
            handleAssignResidentToSlot(slotId, residentId);
          }
        } else {
          const activityId = over.data.current?.activityId as string | undefined;
          if (activityId) {
            handleSchedule(activityId, residentId);
          }
        }
      }
    },
    [handleAssignResidentToSlot, handleSchedule],
  );

  // Simple activity list from config (used for per-location descriptions)
  const activities = useMemo(() => {
    if (!config) return [] as ActivityDefinition[];
    return Object.values(config.activities) as ActivityDefinition[];
  }, [config]);

  const mapSlots = useMemo(() => {
    if (!config) {
      return [] as {
        id: string;
        x: number;
        y: number;
        slotTags: string[];
        label: string;
        icon?: string;
        colorClass?: string;
      }[];
    }
    return Object.values(config.mapSlots ?? {}) as {
      id: string;
      x: number;
      y: number;
      slotTags: string[];
      label: string;
      icon?: string;
      colorClass?: string;
    }[];
  }, [config]);

  const mapSlotLayout = useMemo(() => {
    if (mapSlots.length === 0) return [] as { slot: (typeof mapSlots)[number]; left: number; top: number }[];

    const xs = mapSlots.map((s) => s.x);
    const ys = mapSlots.map((s) => s.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    return mapSlots.map((slot) => {
      const normX = (slot.x - minX) / spanX;
      const normY = (slot.y - minY) / spanY;
      // Keep markers within a comfortable frame over the map background and away from the bottom jobs panel
      const left = 8 + normX * 80;
      const top = 12 + normY * 55;
      return { slot, left, top };
    });
  }, [mapSlots]);

  const activeActivities = useMemo(() => {
    const all = Object.values(villageState.activities) as ScheduledActivity[];
    return all
      .filter((a) => a.status === 'pending' || a.status === 'running')
      .sort((a, b) => {
        if (a.endTime === b.endTime) return a.startTime - b.startTime;
        return a.endTime - b.endTime;
      });
  }, [villageState.activities]);

  const activeJobsCount = useMemo(() => {
    if (!config) return 0;
    return activeActivities.filter((scheduled) => {
      const def = config.activities[scheduled.activityId] as ActivityDefinition | undefined;
      return def?.tags?.includes('job');
    }).length;
  }, [activeActivities, config]);

  const activeQuestsCount = useMemo(() => {
    if (!config) return 0;
    return activeActivities.filter((scheduled) => {
      const def = config.activities[scheduled.activityId] as ActivityDefinition | undefined;
      return def?.tags?.includes('quest');
    }).length;
  }, [activeActivities, config]);

  // Render
  if (!config) {
    return <div className="p-4 text-ivory">Loading Idle Village config...</div>;
  }

  const { fatigueYellowThreshold, fatigueRedThreshold } = config.globalRules;

  const getFatigueColor = (fatigue: number) => {
    if (fatigue >= fatigueRedThreshold) return 'bg-red-600';
    if (fatigue >= fatigueYellowThreshold) return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  const resourceDefinitions = config.resources ?? {};

  const getResourceLabel = (resourceId: string) => {
    const def = resourceDefinitions[resourceId];
    return def?.label ?? resourceId;
  };

  // Day/night segmentation based on config-global day length
  const dayLength = config.globalRules.dayLengthInTimeUnits || 5;
  const currentTime = villageState.currentTime;
  const currentDayIndex = dayLength > 0 ? Math.floor(currentTime / dayLength) : 0;
  const currentDayNumber = currentDayIndex + 1;
  const currentSegmentIndex = dayLength > 0 ? currentTime % dayLength : 0;
  const isNightSegment = dayLength > 0 && currentSegmentIndex === dayLength - 1;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#020617_0,#020617_55%,#000000_100%)] text-ivory flex items-center">
        <section className="relative w-full aspect-video">
          {/* Map background filling the whole main content area */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${idleVillageMap})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="absolute inset-0 bg-obsidian/45" aria-hidden="true" />

          {/* Map slot markers (jobs/quests) layered over the map */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {mapSlotLayout.map(({ slot, left, top }) => {
              const jobsForSlot = activities.filter((activity) => {
                if (!activity.tags?.includes('job')) return false;
                const meta = (activity.metadata ?? {}) as { mapSlotId?: string } | undefined;
                if (meta?.mapSlotId && meta.mapSlotId !== slot.id) return false;
                if (!activity.slotTags || activity.slotTags.length === 0) return false;
                return activity.slotTags.some((tag) => slot.slotTags.includes(tag));
              });

              const questsForSlot = activities.filter((activity) => {
                if (!activity.tags?.includes('quest')) return false;
                const meta = (activity.metadata ?? {}) as { mapSlotId?: string } | undefined;
                if (meta?.mapSlotId && meta.mapSlotId !== slot.id) return false;
                if (!activity.slotTags || activity.slotTags.length === 0) return false;
                return activity.slotTags.some((tag) => slot.slotTags.includes(tag));
              });

              const hasJobs = jobsForSlot.length > 0;
              const hasQuests = questsForSlot.length > 0;
              const jobLabels = jobsForSlot.map((a) => a.label);
              const questLabels = questsForSlot.map((a) => a.label);

              return (
                <MapSlotMarker
                  key={slot.id}
                  slot={slot}
                  left={left}
                  top={top}
                  isSelected={selectedSlotId === slot.id}
                  hasJobs={hasJobs}
                  hasQuests={hasQuests}
                  jobLabels={jobLabels}
                  questLabels={questLabels}
                  onClick={() => setSelectedSlotId(slot.id)}
                />
              );
            })}
          </div>

          {/* Foreground content stacked on top of the map */}
          <div className="relative z-20 flex flex-col h-full">
            {/* Top overlay: time/resources + events row, residents below */}
            <div className="p-4">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                {/* Compact time/resources + day/night ring and transport controls */}
                <div className="inline-flex flex-wrap items-center gap-3 rounded-full bg-black/80 border border-gold/40 shadow-md px-3 py-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((prev) => !prev)}
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900/90 border border-slate-600 text-ivory hover:bg-slate-800"
                    title="Spacebar: play/pause"
                  >
                    {isPlaying ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <DayCycleRing
                      totalSegments={dayLength}
                      filledSegments={currentSegmentIndex + 1}
                      isNight={isNightSegment}
                    />
                    <div className="flex flex-col leading-tight min-w-[72px]">
                      <span className="uppercase tracking-[0.18em] text-ivory">
                        Day
                        {' '}
                        {currentDayNumber}
                      </span>
                      <span className="text-[9px] text-slate-300">
                        t=
                        {villageState.currentTime}
                      </span>
                    </div>
                  </div>
                  <span className="mx-1 h-3 w-px bg-slate-600/80" aria-hidden="true" />
                  <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                    {Object.entries(villageState.resources).map(([id, value]) => {
                      const def = resourceDefinitions[id];
                      const colorClass = def?.colorClass ?? 'text-amber-200';
                      const delta = resourceDeltas[id] ?? 0;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-950/85 text-[10px] tracking-[0.12em] text-ivory border border-slate-700/80 shadow-sm"
                        >
                          {def?.icon && (
                            <span aria-hidden className="text-xs">
                              {def.icon}
                            </span>
                          )}
                          <span className={`font-semibold ${colorClass}`}>
                            {getResourceLabel(id)}
                          </span>
                          <span className="font-mono text-slate-100 text-[10px]">
                            {value}
                          </span>
                          {delta !== 0 && (
                            <span
                              className={`ml-1 font-mono text-[9px] ${
                                delta > 0 ? 'text-emerald-300' : 'text-red-300'
                              }`}
                            >
                              {delta > 0 ? `+${delta}` : `${delta}`}
                            </span>
                          )}
                        </span>
                      );
                    })}
                    {Object.keys(villageState.resources).length === 0 && (
                      <span className="text-[10px] text-slate-300">No resources yet</span>
                    )}
                  </div>
                </div>

                {/* Events panel (aligned to the right of the bar) */}
                <div className="mt-3 lg:mt-0 w-full lg:w-1/2 max-w-md">
                  <DefaultSection
                    title="Jobs & Quests in progress"
                    actions={(
                      <button
                        type="button"
                        className="flex items-center justify-center w-4 h-4 rounded text-slate-400 hover:text-amber-200"
                        title={showJobsAndQuests ? 'Nascondi lista' : 'Mostra lista'}
                        onClick={() => setShowJobsAndQuests((prev) => !prev)}
                      >
                        <Eye className="w-3 h-3" />
                        <span className="sr-only">Toggle Jobs and Quests visibility</span>
                      </button>
                    )}
                  >
                    {showJobsAndQuests && (
                      <>
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700">
                            <Briefcase className="w-3 h-3 text-teal-300" />
                            <span>Jobs: {activeJobsCount}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700">
                            <ScrollText className="w-3 h-3 text-amber-300" />
                            <span>Quests: {activeQuestsCount}</span>
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-[10px]">
                          {activeActivities.length > 0 ? (
                            activeActivities.map((scheduled) => {
                          const def = config.activities[scheduled.activityId] as ActivityDefinition | undefined;
                          const assignedNames = scheduled.characterIds.map(
                            (cid) => villageState.residents[cid]?.id ?? cid,
                          );
                          const rewardsLabel =
                            def?.rewards && def.rewards.length > 0
                              ? def.rewards.map((d) => getResourceLabel(d.resourceId)).join(', ')
                              : null;

                          const duration = Math.max(1, scheduled.endTime - scheduled.startTime || 1);
                          const elapsed = Math.max(0, villageState.currentTime - scheduled.startTime);
                          const clamped = Math.min(1, elapsed / duration);

                          const meta = (def?.metadata ?? {}) as { questDeadlineInDays?: number };
                          const questDeadlineDays = typeof meta.questDeadlineInDays === 'number'
                            ? meta.questDeadlineInDays
                            : undefined;
                          let deadlineLabel: string | null = null;
                          if (typeof questDeadlineDays === 'number' && questDeadlineDays > 0) {
                            const totalDayLength = dayLength || 5;
                            const deadlineTime = scheduled.startTime + questDeadlineDays * totalDayLength;
                            const remainingUnits = Math.max(0, deadlineTime - currentTime);
                            if (remainingUnits <= 0) {
                              deadlineLabel = 'Expired';
                            } else {
                              const remainingDays = Math.floor(remainingUnits / totalDayLength);
                              if (remainingDays >= 1) {
                                deadlineLabel = `${remainingDays}d left`;
                              } else {
                                deadlineLabel = `${remainingUnits}u left`;
                              }
                            }
                          }

                          const isQuest = !!def?.tags?.includes('quest');
                          const isJob = !!def?.tags?.includes('job');
                          const kindLabel = isQuest ? 'Quest' : isJob ? 'Job' : 'Activity';

                          return (
                            <div
                              key={scheduled.id}
                              className="rounded bg-obsidian/80 border border-slate-700 px-2 py-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-slate-100 truncate">
                                    {def?.label ?? scheduled.activityId}
                                  </div>
                                  <div className="mt-0.5 flex flex-wrap gap-1">
                                    {assignedNames.map((name) => (
                                      <span
                                        key={name}
                                        className="px-1 py-0.5 rounded-full bg-obsidian/80 text-[9px] uppercase tracking-[0.14em] text-slate-200 border border-slate-600"
                                      >
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-600/80 text-[8px] uppercase tracking-[0.16em] text-slate-100">
                                    {isQuest ? (
                                      <ScrollText className="w-3 h-3 text-amber-300" />
                                    ) : isJob ? (
                                      <Briefcase className="w-3 h-3 text-teal-300" />
                                    ) : (
                                      <MapPin className="w-3 h-3 text-slate-300" />
                                    )}
                                    <span>{kindLabel}</span>
                                  </span>
                                  <span className="text-[9px] uppercase tracking-[0.14em] text-slate-300">
                                    {scheduled.status}
                                  </span>
                                </div>
                              </div>
                              {rewardsLabel && (
                                <div className="mt-0.5 text-[9px] text-teal-200 truncate">
                                  {rewardsLabel}
                                </div>
                              )}
                              {deadlineLabel && (
                                <div className="mt-0.5 text-[9px] text-amber-300 truncate">
                                  Deadline:
                                  {' '}
                                  {deadlineLabel}
                                </div>
                              )}
                              <div className="mt-1 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div
                                  className="h-1 bg-teal-400"
                                  style={{ width: `${Math.max(5, Math.min(100, clamped * 100))}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-slate-400">No active events.</p>
                      )}
                        </div>
                      </>
                    )}
                  </DefaultSection>
                </div>
              </div>

              {/* Residents list under the bar */}
              <div className="mt-4 space-y-2 pr-1 max-w-xs">
                {Object.values(villageState.residents).map((r) => (
                  <ResidentCard
                    key={r.id}
                    resident={r}
                    getFatigueColor={getFatigueColor}
                  />
                ))}
                {Object.values(villageState.residents).length === 0 && (
                  <p className="text-xs text-slate-300">No residents defined yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <DragOverlay>
        {activeResidentId && villageState.residents[activeResidentId] ? (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-gold/70 shadow-lg flex items-center justify-center text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-100">
              {villageState.residents[activeResidentId].id.slice(0, 2)}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
