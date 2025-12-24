import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import WorkerDragToken from '@/ui/idleVillage/components/WorkerDragToken';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';

interface ResidentRosterProps {
  residents: ResidentState[];
  activeResidentId: string | null;
  onDragStart: (residentId: string) => (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragIntent?: (residentId: string) => void;
  onDragIntentEnd?: (residentId: string) => void;
  assignmentFeedback: string | null;
  maxFatigueBeforeExhausted: number;
  className?: string;
  listClassName?: string;
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

const formatLabel = (resident: ResidentState) => formatResidentLabel(resident);

function ResidentRoster({
  residents,
  activeResidentId,
  onDragStart,
  onDragEnd,
  onDragIntent,
  onDragIntentEnd,
  assignmentFeedback,
  maxFatigueBeforeExhausted,
  className,
  listClassName,
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
    (event: React.DragEvent<HTMLElement>) => {
      if (isBlocked) {
        event.preventDefault();
        return;
      }
      const preview = createDragPreview(resident, label);
      dragPreviewRef.current = preview;
      event.dataTransfer.setDragImage(preview, 24, 24);
      event.dataTransfer.setData('text/resident-id', resident.id);
      event.dataTransfer.setData('text/plain', resident.id);
      onDragIntent?.(resident.id); // ensure drag mode on desktop mouse-drag without pointerdown firing first
      onDragStart(resident.id)(event);
    };

  const handlePointerDown =
    (resident: ResidentState, isBlocked: boolean) =>
    (event: React.PointerEvent<HTMLElement>) => {
      if (isBlocked || !onDragIntent) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      onDragIntent(resident.id);
    };

  const handlePointerUp =
    (resident: ResidentState, isBlocked: boolean) =>
    () => {
      if (isBlocked || !onDragIntentEnd) return;
      onDragIntentEnd(resident.id);
    };

  const handleDragEndInternal =
    (residentId: string) => (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (dragPreviewRef.current) {
        if (dragPreviewRef.current.parentNode) {
          dragPreviewRef.current.parentNode.removeChild(dragPreviewRef.current);
        }
        dragPreviewRef.current = null;
      }
      onDragEnd();
      if (onDragIntentEnd) {
        onDragIntentEnd(residentId);
      }
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

  const MAX_VISIBLE_ROWS = 5;
  const ESTIMATED_ROW_HEIGHT = 112;
  const shouldEnableScroll = sortedResidents.length > MAX_VISIBLE_ROWS;
  const computedListStyle = shouldEnableScroll
    ? { maxHeight: `${MAX_VISIBLE_ROWS * ESTIMATED_ROW_HEIGHT}px`, overflowY: 'auto' as const }
    : undefined;

  return (
    <div
      className={[
        'flex flex-col gap-4 self-start rounded-2xl border border-gold/40 bg-black/85 px-4 py-4 text-[11px] shadow-lg backdrop-blur',
        className ?? 'w-72',
      ]
        .filter(Boolean)
        .join(' ')}
    >
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

      <div
        className={[
          'flex flex-col gap-2 pr-1',
          shouldEnableScroll ? 'overflow-y-auto' : '',
          listClassName ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={computedListStyle}
      >
        {sortedResidents.length === 0 && (
          <div className="text-[10px] italic text-slate-500">Nessun residente disponibile</div>
        )}
        {sortedResidents.map((resident) => {
          const dragState = activeResidentId === resident.id;
          const fatiguePercent = fatiguePercentage(resident.fatigue);
          const hpPercent = hpPercentage(resident);
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
          const subtitle = resident.isHero ? 'Eroe attivo' : resident.isInjured ? 'Ferito' : undefined;

          return (
            <div
              key={resident.id}
              data-testid="resident-card"
              data-resident-id={resident.id}
              onMouseEnter={() => handleMouseEnter(resident)}
              onMouseLeave={handleMouseLeave}
              className="group relative"
            >
              {heroFlashActive && (
                <span className="pointer-events-none absolute inset-0 rounded-xl border border-amber-200/70 opacity-60 animate-ping" />
              )}
              {isBlocked && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/60 text-[10px] text-amber-200">
                  Recupero necessario
                </div>
              )}
              <WorkerDragToken
                workerId={resident.id}
                label={formatLabel(resident)}
                subtitle={subtitle}
                hp={hpPercent}
                fatigue={fatiguePercent}
                isDragging={dragState}
                disabled={isBlocked}
                className={[
                  'w-full border bg-slate-950/80',
                  heroBorder,
                  dragState ? 'pointer-events-none' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onDragStateChange={() => undefined}
                onDragStart={handleDragStart(resident, initial, isBlocked)}
                onDragEnd={handleDragEndInternal(resident.id)}
                onPointerDown={handlePointerDown(resident, isBlocked)}
                onPointerUp={handlePointerUp(resident, isBlocked)}
                onPointerCancel={handlePointerUp(resident, isBlocked)}
              />
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
            </div>
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
