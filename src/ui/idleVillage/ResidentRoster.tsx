import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

interface ResidentRosterProps {
  residents: ResidentState[];
  activeResidentId: string | null;
  onDragStart: (residentId: string) => (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  assignmentFeedback: string | null;
  maxFatigueBeforeExhausted: number;
}

type RosterFilter = 'all' | 'heroes' | 'injured';

function getResidentPortrait(resident: ResidentState): string | undefined {
  const directPortrait = (resident as ResidentState & { portraitUrl?: string }).portraitUrl;
  if (typeof directPortrait === 'string' && directPortrait.length > 0) {
    return directPortrait;
  }

  if (resident.statSnapshot && typeof resident.statSnapshot === 'object') {
    const snapshotPortrait = (resident.statSnapshot as Record<string, unknown>).portraitUrl;
    if (typeof snapshotPortrait === 'string' && snapshotPortrait.length > 0) {
      return snapshotPortrait;
    }
  }
  return undefined;
}

function formatLabel(resident: ResidentState) {
  if (resident.id.startsWith('founder-')) {
    return resident.id.replace('founder-', '');
  }
  return resident.id;
}

function ResidentRoster({
  residents,
  activeResidentId,
  onDragStart,
  onDragEnd,
  assignmentFeedback,
  maxFatigueBeforeExhausted,
}: ResidentRosterProps) {
  const [filter, setFilter] = useState<RosterFilter>('all');
  const [heroFlashIds, setHeroFlashIds] = useState<string[]>([]);
  const heroStatusRef = useRef<Record<string, boolean>>({});
  const heroFlashTimeouts = useRef<Record<string, number>>({});
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);
  const [popoverResidentId, setPopoverResidentId] = useState<string | null>(null);

  useEffect(() => {
    const newlyHeroic: string[] = [];
    residents.forEach((resident) => {
      const wasHero = heroStatusRef.current[resident.id];
      if (resident.isHero && !wasHero) {
        newlyHeroic.push(resident.id);
      }
      heroStatusRef.current[resident.id] = resident.isHero;
    });

    newlyHeroic.forEach((id) => {
      setHeroFlashIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      if (heroFlashTimeouts.current[id]) {
        window.clearTimeout(heroFlashTimeouts.current[id]);
      }
      heroFlashTimeouts.current[id] = window.setTimeout(() => {
        setHeroFlashIds((prev) => prev.filter((flashId) => flashId !== id));
        delete heroFlashTimeouts.current[id];
      }, 1400);
    });
  }, [residents]);

  useEffect(
    () => () => {
      Object.values(heroFlashTimeouts.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    },
    [],
  );

  const hpPercentage = (resident: ResidentState) => {
    if (resident.maxHp <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((resident.currentHp / resident.maxHp) * 100)));
  };

  const fatiguePercentage = (fatigue: number) =>
    Math.min(100, Math.round((fatigue / Math.max(1, maxFatigueBeforeExhausted)) * 100));

  const filteredResidents = useMemo(() => {
    return residents.filter((resident) => {
      if (filter === 'heroes') return resident.isHero;
      if (filter === 'injured') return resident.isInjured;
      return true;
    });
  }, [residents, filter]);

  const sortedResidents = useMemo(() => {
    const groupValue = (resident: ResidentState) => {
      if (resident.isHero) return 0;
      const hpPercent = hpPercentage(resident);
      const isBlocked =
        resident.isInjured || resident.status === 'injured' || resident.status === 'exhausted' || hpPercent <= 25;
      if (isBlocked) return 2;
      return 1;
    };

    return [...filteredResidents].sort((a, b) => {
      const groupDiff = groupValue(a) - groupValue(b);
      if (groupDiff !== 0) return groupDiff;

      const aScore = a.survivalScore ?? 0;
      const bScore = b.survivalScore ?? 0;

      if (groupValue(a) === 1 || groupValue(a) === 0) {
        if (bScore !== aScore) {
          return bScore - aScore;
        }
      }

      if (a.isInjured !== b.isInjured) {
        return a.isInjured ? 1 : -1;
      }

      if (a.status === b.status) {
        return a.id.localeCompare(b.id);
      }

      return a.status.localeCompare(b.status);
    });
  }, [filteredResidents]);

  const createDragPreview = (resident: ResidentState, label: string) => {
    const portraitUrl = getResidentPortrait(resident);
    const preview = document.createElement('div');
    preview.className =
      'h-12 w-12 rounded-full border border-amber-200 bg-slate-900 flex items-center justify-center text-[12px] font-semibold text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.45)]';
    if (portraitUrl) {
      preview.style.backgroundImage = `url(${portraitUrl})`;
      preview.style.backgroundSize = 'cover';
      preview.style.backgroundPosition = 'center';
    } else {
      preview.textContent = label;
    }
    preview.style.position = 'absolute';
    preview.style.top = '-999px';
    preview.style.left = '-999px';
    document.body.appendChild(preview);
    return preview;
  };

  const handleDragStart =
    (resident: ResidentState, label: string, isBlocked: boolean) =>
    (event: React.DragEvent<HTMLButtonElement>) => {
      if (isBlocked) {
        event.preventDefault();
        return;
      }
      const preview = createDragPreview(resident, label);
      dragPreviewRef.current = preview;
      event.dataTransfer.setDragImage(preview, 24, 24);
      onDragStart(resident.id)(event);
    };

  const handleDragEndInternal = () => {
    if (dragPreviewRef.current) {
      if (dragPreviewRef.current.parentNode) {
        dragPreviewRef.current.parentNode.removeChild(dragPreviewRef.current);
      }
      dragPreviewRef.current = null;
    }
    onDragEnd();
  };

  const handleMouseEnter = (resident: ResidentState) => {
    setPopoverResidentId(resident.id);
  };

  const handleMouseLeave = () => {
    setPopoverResidentId(null);
  };

  const filterButtonClasses = (value: RosterFilter) =>
    [
      'px-2 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] transition-colors',
      filter === value ? 'bg-amber-400/20 text-amber-200 border border-amber-300/50' : 'text-slate-400 border border-slate-700 hover:text-amber-100',
    ].join(' ');

  return (
    <div className="flex w-72 min-h-[60vh] flex-col gap-4 self-start rounded-2xl border border-gold/40 bg-black/85 px-4 py-4 text-[11px] shadow-lg backdrop-blur">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-300">Residenti</span>
        <span className="text-[11px] text-slate-400">{sortedResidents.length || '—'} pronti</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={filterButtonClasses('all')}
          onClick={() => setFilter('all')}
        >
          Tutti
        </button>
        <button
          type="button"
          className={filterButtonClasses('heroes')}
          onClick={() => setFilter('heroes')}
        >
          Eroi
        </button>
        <button
          type="button"
          className={filterButtonClasses('injured')}
          onClick={() => setFilter('injured')}
        >
          Feriti
        </button>
      </div>

      <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
        {sortedResidents.length === 0 && (
          <div className="text-[10px] italic text-slate-500">Nessun residente disponibile</div>
        )}
        {sortedResidents.map((resident) => {
          const dragState = activeResidentId === resident.id;
          const fatiguePercent = fatiguePercentage(resident.fatigue);
          const hpPercent = hpPercentage(resident);
          const portraitUrl = getResidentPortrait(resident);
          const initial =
            resident.statTags?.[0]?.slice(0, 2).toUpperCase() ??
            resident.id
              .split('-')
              .pop()
              ?.slice(0, 2)
              .toUpperCase() ??
            'R';
          const heroBorder = resident.isHero
            ? 'border-gold/70 shadow-[0_0_28px_rgba(201,162,39,0.45)]'
            : 'border-slate-800/80';
          const isBlocked =
            resident.isInjured || resident.status === 'injured' || resident.status === 'exhausted' || hpPercent <= 25;
          const heroFlashActive = heroFlashIds.includes(resident.id);
          const injuredBadge = resident.isInjured ? (
            <span className="ml-2 text-[10px]" role="img" aria-label="Injured">
              🩹
            </span>
          ) : null;

          return (
            <button
              key={resident.id}
              type="button"
              draggable
              onDragStart={handleDragStart(resident, initial, isBlocked)}
              onDragEnd={handleDragEndInternal}
              onMouseEnter={() => handleMouseEnter(resident)}
              onMouseLeave={handleMouseLeave}
              data-testid="resident-card"
              data-resident-id={resident.id}
              className={[
                'group relative flex w-full items-center gap-3 rounded-xl border bg-slate-950/70 px-3 py-3 transition-all',
                heroBorder,
                dragState
                  ? 'opacity-0 pointer-events-none scale-95'
                  : 'opacity-100 hover:border-amber-300/70 hover:bg-slate-900/70',
                isBlocked ? 'cursor-not-allowed grayscale opacity-70' : 'cursor-grab',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {heroFlashActive && (
                <span className="pointer-events-none absolute inset-0 rounded-xl border border-amber-200/70 opacity-60 animate-ping" />
              )}
              {isBlocked && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 text-[10px] text-amber-200">
                  Recupero necessario
                </div>
              )}
              <div
                className={[
                  'relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border text-[12px] font-semibold tracking-wide',
                  resident.isHero ? 'border-amber-200 text-amber-100' : 'border-slate-600 text-slate-100',
                ].join(' ')}
              >
                {portraitUrl ? (
                  <img src={portraitUrl} alt={formatLabel(resident)} className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <span>{initial}</span>
                )}
                {resident.isHero && (
                  <span className="absolute -bottom-1 -right-1 rounded-full bg-black/80 px-1 text-[9px] text-amber-200" aria-label="Hero">
                    ⚜︎
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1 text-left">
                <div className="flex items-center text-[11px] font-semibold text-ivory">
                  <span className="truncate">{formatLabel(resident)}</span>
                  {injuredBadge}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>HP</span>
                    <span>
                      {resident.currentHp}/{resident.maxHp}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800/80">
                    <div
                      className="h-full rounded-full bg-green-400 transition-all"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>Fatigue</span>
                    <span>
                      {resident.fatigue}/{maxFatigueBeforeExhausted}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800/80">
                    <div
                      className="h-full rounded-full bg-amber-300 transition-all"
                      style={{ width: `${fatiguePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {popoverResidentId === resident.id && (
                <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 min-w-40 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 text-[10px] text-slate-100 shadow-xl">
                  <div className="mb-1 text-[11px] font-semibold text-amber-200">{formatLabel(resident)}</div>
                  <div className="flex justify-between text-slate-400">
                    <span>Missions</span>
                    <span>{resident.survivalCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Score</span>
                    <span>{resident.survivalScore ?? 0}</span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {(resident.statSnapshot && Object.entries(resident.statSnapshot).length > 0
                      ? Object.entries(resident.statSnapshot).slice(0, 4)
                      : [['Stat', '?'] as [string, unknown]]) // fallback
                      .map(([statKey, statValue]) => (
                        <div key={statKey} className="flex justify-between text-slate-400">
                          <span>{statKey}</span>
                          <span>{typeof statValue === 'number' ? statValue : String(statValue)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {assignmentFeedback && (
        <div className="text-[10px] text-amber-200 bg-amber-500/10 border border-amber-200/30 rounded-lg px-2 py-1">
          {assignmentFeedback}
        </div>
      )}
    </div>
  );
}

export default ResidentRoster;
