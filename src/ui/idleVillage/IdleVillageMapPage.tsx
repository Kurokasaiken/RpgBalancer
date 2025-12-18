import React, { useCallback, useEffect, useMemo, useState } from 'react';
import idleVillageMap from '@/assets/ui/idleVillage/idle-village-map.jpg';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import {
  createVillageStateFromConfig,
  scheduleActivity,
  type ScheduledActivity,
  type VillageState,
} from '@/engine/game/idleVillage/TimeEngine';
import { tickIdleVillage } from '@/engine/game/idleVillage/IdleVillageEngine';
import type {
  ActivityDefinition,
  FounderPreset,
  IdleVillageConfig,
} from '@/balancing/config/idleVillage/types';
import VerbCard from '@/ui/idleVillage/VerbCard';
import {
  DEFAULT_SECONDS_PER_TIME_UNIT,
  buildPassiveEffectSummary,
  buildQuestOfferSummary,
  buildScheduledVerbSummary,
  type VerbSummary,
} from '@/ui/idleVillage/verbSummaries';

const simpleRng = (() => {
  let seed = 12345;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
})();

interface MapSlotVerbClusterProps {
  slot: { id: string; label: string; icon?: string };
  left: number;
  top: number;
  verbs: VerbSummary[];
}

function MapSlotVerbCluster({ slot, left, top, verbs }: MapSlotVerbClusterProps) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-3 pointer-events-auto"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <div className="rounded-3xl border border-slate-900/70 bg-black/40 px-3 py-2">
        <div className="flex flex-col items-center gap-2">
          {verbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-300 px-4 py-3 min-h-44 min-w-28">
              <span className="text-base">{slot.icon ?? '⌀'}</span>
              <span>{slot.label}</span>
            </div>
          ) : (
            verbs.map((verb) => (
              <VerbCard
                key={verb.key}
                icon={verb.icon}
                progressFraction={verb.progressFraction}
                elapsedSeconds={verb.elapsedSeconds}
                totalDuration={verb.totalDurationSeconds}
                injuryPercentage={verb.injuryPercentage}
                deathPercentage={verb.deathPercentage}
                assignedCount={verb.assignedCount}
                totalSlots={verb.totalSlots}
                visualVariant={verb.visualVariant}
                progressStyle={verb.progressStyle}
                isInteractive={false}
              />
            ))
          )}
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100 drop-shadow">{slot.label}</div>
    </div>
  );
}

function selectDefaultFounder(config?: IdleVillageConfig | null): FounderPreset | null {
  if (!config) return null;
  const founders = config.founders ?? {};
  return founders.founder_standard ?? Object.values(founders)[0] ?? null;
}

const IdleVillageMapPage: React.FC = () => {
  const { config } = useIdleVillageConfig();
  const defaultFounderPreset = useMemo(() => selectDefaultFounder(config), [config]);
  const [villageState, setVillageState] = useState<VillageState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!config) return;
    setVillageState(createVillageStateFromConfig({ config, founderPreset: defaultFounderPreset }));
  }, [config, defaultFounderPreset]);

  const advanceTimeBy = useCallback(
    (delta: number) => {
      if (!config) return;
      setVillageState((prev) => {
        if (!prev) return prev;
        const result = tickIdleVillage({ config, rng: simpleRng }, prev, delta);
        let nextState = result.state;

        if (result.completedJobs.length > 0) {
          for (const job of result.completedJobs) {
            const activity = config.activities[job.activityId] as ActivityDefinition | undefined;
            if (!activity) continue;

            const metadata = (activity.metadata ?? {}) as {
              supportsAutoRepeat?: boolean;
              continuousJob?: boolean;
            };
            const isContinuous = !!metadata.continuousJob;
            const supportsAuto = !!metadata.supportsAutoRepeat;
            const isAutoOn = isContinuous || supportsAuto;
            const scheduled = nextState.activities[job.scheduledId];
            if (!scheduled || !isAutoOn || scheduled.characterIds.length === 0) {
              continue;
            }

            const { maxFatigueBeforeExhausted } = config.globalRules;
            const assigneesReady = scheduled.characterIds.every((cid) => {
              const resident = nextState.residents[cid];
              if (!resident) return false;
              if (resident.status !== 'available') return false;
              return resident.fatigue < maxFatigueBeforeExhausted;
            });

            if (!assigneesReady) {
              continue;
            }

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

        if (result.completedQuests.length > 0) {
          result.completedQuests.forEach(() => {
            // No extra UI side-effects yet for completed quests.
          });
        }

        const questOffers = nextState.questOffers ?? {};
        const filteredEntries = Object.entries(questOffers).filter(([, offer]) => {
          if (typeof offer.expiresAtTime !== 'number') return true;
          return offer.expiresAtTime > nextState.currentTime;
        });
        if (filteredEntries.length !== Object.keys(questOffers).length) {
          nextState = {
            ...nextState,
            questOffers: Object.fromEntries(filteredEntries),
          };
        }

        return nextState;
      });
    },
    [config],
  );

  useEffect(() => {
    if (!isPlaying) return undefined;
    const id = window.setInterval(() => {
      advanceTimeBy(1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPlaying, advanceTimeBy]);

  const mapSlots = useMemo(() => {
    if (!config) return [];
    return Object.values(config.mapSlots ?? {});
  }, [config]);

  const mapSlotLayout = useMemo(() => {
    if (mapSlots.length === 0) return [];
    return mapSlots.map((slot) => {
      const normX = slot.x / 10;
      const normY = slot.y / 10;
      const left = 8 + normX * 80;
      const top = 12 + normY * 55;
      return { slot, left, top };
    });
  }, [mapSlots]);

  const secondsPerTimeUnit = config?.globalRules.secondsPerTimeUnit ?? DEFAULT_SECONDS_PER_TIME_UNIT;
  const dayLengthSetting = config?.globalRules.dayLengthInTimeUnits || 5;

  const getResourceLabel = useCallback(
    (resourceId: string) => {
      const def = config?.resources?.[resourceId];
      return def?.label ?? resourceId;
    },
    [config],
  );

  const activeActivities = useMemo(() => {
    if (!villageState) return [] as ScheduledActivity[];
    const all = Object.values(villageState.activities) as ScheduledActivity[];
    return all
      .filter((activity) => activity.status === 'pending' || activity.status === 'running')
      .sort((a, b) => {
        if (a.endTime === b.endTime) return a.startTime - b.startTime;
        return a.endTime - b.endTime;
      });
  }, [villageState]);

  const scheduledVerbSummaries = useMemo(() => {
    if (!config || !villageState) return [] as VerbSummary[];
    return activeActivities
      .map((scheduled) => {
        const activity = config.activities[scheduled.activityId] as ActivityDefinition | undefined;
        if (!activity) return null;
        const slotIcon = scheduled.slotId ? config.mapSlots?.[scheduled.slotId]?.icon : undefined;
        const assigneeNames = scheduled.characterIds.map(
          (cid) => villageState.residents[cid]?.id ?? cid,
        );
        return buildScheduledVerbSummary({
          scheduled,
          activity,
          slotIcon,
          resourceLabeler: getResourceLabel,
          currentTime: villageState.currentTime,
          secondsPerTimeUnit,
          dayLength: dayLengthSetting,
          assigneeNames,
        });
      })
      .filter(Boolean) as VerbSummary[];
  }, [
    config,
    villageState,
    activeActivities,
    getResourceLabel,
    secondsPerTimeUnit,
    dayLengthSetting,
  ]);

  const questOffers = useMemo(
    () => Object.values(villageState?.questOffers ?? {}),
    [villageState?.questOffers],
  );

  const questOfferSummaries = useMemo(() => {
    if (!config || !villageState) return [] as VerbSummary[];
    return questOffers
      .map((offer) => {
        const activity = config.activities[offer.activityId] as ActivityDefinition | undefined;
        if (!activity) return null;
        const slotIcon = config.mapSlots?.[offer.slotId]?.icon;
        return buildQuestOfferSummary({
          offer,
          activity,
          slotIcon,
          resourceLabeler: getResourceLabel,
          currentTime: villageState.currentTime,
          secondsPerTimeUnit,
          dayLength: dayLengthSetting,
        });
      })
      .filter(Boolean) as VerbSummary[];
  }, [config, questOffers, villageState, getResourceLabel, secondsPerTimeUnit, dayLengthSetting]);

  const passiveEffectSummaries = useMemo(() => {
    if (!config || !villageState) return [] as VerbSummary[];
    const mapSlotsRecord = config.mapSlots ?? {};
    return Object.values(config.passiveEffects ?? {})
      .map((effect) =>
        buildPassiveEffectSummary({
          effect,
          currentTime: villageState.currentTime,
          secondsPerTimeUnit,
          mapSlots: mapSlotsRecord,
          resourceLabeler: getResourceLabel,
        }),
      )
      .filter(Boolean) as VerbSummary[];
  }, [config, villageState, secondsPerTimeUnit, getResourceLabel]);

  const verbsBySlot = useMemo(() => {
    const grouped: Record<string, VerbSummary[]> = {};
    const addSummary = (summary: VerbSummary) => {
      if (!summary.slotId) return;
      if (!grouped[summary.slotId]) grouped[summary.slotId] = [];
      grouped[summary.slotId].push(summary);
    };
    scheduledVerbSummaries.forEach(addSummary);
    passiveEffectSummaries.forEach(addSummary);
    return grouped;
  }, [scheduledVerbSummaries, passiveEffectSummaries]);

  const questOffersBySlot = useMemo(() => {
    const grouped: Record<string, VerbSummary[]> = {};
    questOfferSummaries.forEach((summary) => {
      if (!summary.slotId) return;
      if (!grouped[summary.slotId]) grouped[summary.slotId] = [];
      grouped[summary.slotId].push(summary);
    });
    return grouped;
  }, [questOfferSummaries]);

  if (!config || !villageState) {
    return <div className="p-4 text-ivory">Loading Idle Village map...</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#020617_0,#020617_55%,#000000_100%)] text-ivory flex items-center">
      <section className="relative w-full aspect-video max-w-6xl mx-auto">
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

        <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-3 rounded-full bg-black/80 border border-gold/40 shadow-md px-3 py-1.5 text-[10px]">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900/90 border border-slate-600 text-ivory hover:bg-slate-800"
          >
            {isPlaying ? '❚❚' : '►'}
          </button>
          <div className="text-[9px] text-slate-300">t={villageState.currentTime}</div>
        </div>

        <div className="absolute inset-0 z-10 pointer-events-none">
          {mapSlotLayout.map(({ slot, left, top }) => {
            const slotVerbs = verbsBySlot[slot.id] ?? [];
            const slotOffers = questOffersBySlot[slot.id] ?? [];
            const combined = [...slotVerbs, ...slotOffers];
            return (
              <MapSlotVerbCluster
                key={slot.id}
                slot={{ id: slot.id, label: slot.label, icon: slot.icon }}
                left={left}
                top={top}
                verbs={combined}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default IdleVillageMapPage;
