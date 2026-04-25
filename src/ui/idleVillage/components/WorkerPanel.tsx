import { useMemo, useState } from 'react';
import type { ReactNode, JSX } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { MinimalResident } from '@/ui/idleVillage/types/gameplayTypes';
import { getCurrentDragConfig } from '@/ui/idleVillage/config/dragConfig';
import WorkerCard from './WorkerCard';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { StyleLabStack } from '@/ui/styleLab/StyleLabStack';

type WorkerStatusTone = 'default' | 'working' | 'injured' | 'fatigued';

const getStatusToneClasses = (tone: WorkerStatusTone): string => {
  switch (tone) {
    case 'default':
      return 'border-[var(--panel-border)] bg-[var(--card-surface)] text-[var(--text-primary)]';
    case 'working':
      return 'border-[var(--accent-color)] bg-[var(--card-highlight)] text-[var(--accent-color)]';
    case 'injured':
      return 'border-red-400 bg-red-500/10 text-red-100';
    case 'fatigued':
      return 'border-purple-400 bg-purple-500/10 text-purple-100';
    default:
      return 'border-[var(--panel-border)] bg-[var(--card-surface)] text-[var(--text-primary)]';
  }
};

interface DraggableWorkerProps {
  resident: MinimalResident;
  isActive: boolean;
  isSelected: boolean;
  fatigueWarningPercent: number;
  injuryBadgeCopy: string;
  onSelect?: (residentId: string) => void;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const getStatusTone = (resident: MinimalResident, fatigueWarningPercent: number): WorkerStatusTone => {
  if (resident.isInjured) return 'injured';
  if (resident.isWorking) return 'working';
  if (resident.fatigue >= fatigueWarningPercent) return 'fatigued';
  return 'default';
};

const getStatusLabel = (
  resident: MinimalResident,
  fatigueWarningPercent: number,
  injuryBadgeCopy: string,
): string => {
  if (resident.isInjured) return injuryBadgeCopy;
  if (resident.isWorking) return 'Al lavoro';
  if (resident.fatigue >= fatigueWarningPercent) return 'Affaticato';
  return 'Disponibile';
};

const DraggableWorkerCard: React.FC<DraggableWorkerProps> = ({
  resident,
  isActive,
  isSelected,
  fatigueWarningPercent,
  injuryBadgeCopy,
  onSelect,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: resident.id,
    data: {
      type: 'resident-token',
      residentId: resident.id,
    },
  });

  const style = transform ? { transform: CSS.Transform.toString(transform) } : undefined;
  const fatigue = clampPercent(resident.fatigue);
  const tone = getStatusTone(resident, fatigueWarningPercent);

  return (
    <article
      ref={setNodeRef}
      style={style}
      data-worker-id={resident.id}
      className={clsx(
        'rounded-3xl border border-white/10 bg-white/5 p-4 transition-all duration-200',
        'shadow-[0_22px_55px_rgba(4,5,15,0.45)] focus-within:ring-2 focus-within:ring-amber-300/50',
        (isActive || isDragging) && 'ring-2 ring-amber-300/70 shadow-amber-500/30',
        isSelected && 'ring-2 ring-emerald-300/80',
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelect?.(resident.id)}
          className="text-left"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{resident.level ? `Lv. ${resident.level}` : 'Crew'}</p>
          <h3 className="text-lg font-semibold text-ivory">{resident.name}</h3>
        </button>
        <span
          className={clsx(
            'rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]',
            getStatusToneClasses(tone),
          )}
        >
          {getStatusLabel(resident, fatigueWarningPercent, injuryBadgeCopy)}
        </span>
      </div>

      <div className="mt-4">
        <WorkerCard
          id={resident.id}
          name={resident.name}
          hp={clampPercent(resident.stats.hp ?? 100)}
          fatigue={fatigue}
          onHoverChange={(_, hovering) => setIsHovering(hovering)}
          isHovering={isHovering || isSelected}
          isDragging={isActive || isDragging}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-400">
        <span>{resident.isWorking ? 'Shift attivo' : 'Pronto'}</span>
        <span className="text-slate-300">Fatigue • {fatigue}%</span>
      </div>
    </article>
  );
};

export interface WorkerPanelProps {
  residents: MinimalResident[];
  selectedResidentId?: string | null;
  onWorkerSelect?: (residentId: string) => void;
  onWorkerDrop?: (event: DragEndEvent) => void;
  /** Optional callback to signal the currently dragged resident id. */
  onDragStateChange?: (residentId: string | null) => void;
  /** Override the sensors used by DndContext (defaults to pointer + touch). */
  sensors?: ReturnType<typeof useSensors>;
  /** Optional slot to render decks/boards inside the same DnD context. */
  children?: ReactNode;
  /** Config-driven fatigue threshold (percent) that should trigger warning badges. */
  fatigueWarningPercent?: number;
  /** Copy used when a resident is injured. */
  injuryBadgeCopy?: string;
}

export function WorkerPanel({
  residents,
  selectedResidentId = null,
  onWorkerSelect,
  onWorkerDrop,
  onDragStateChange,
  sensors,
  children,
  fatigueWarningPercent: fatigueWarningPercentOverride,
  injuryBadgeCopy = 'Infortunato',
}: WorkerPanelProps): JSX.Element {
  const [activeResidentId, setActiveResidentId] = useState<string | null>(null);
  const dragConfig = getCurrentDragConfig();
  const defaultSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: dragConfig.thresholds.minDragDistance },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: dragConfig.timing.feedbackDelayMs,
        tolerance: dragConfig.thresholds.minDragDistance,
      },
    }),
  );
  const resolvedSensors = sensors ?? defaultSensors;
  const fatigueWarningPercent = Number.isFinite(fatigueWarningPercentOverride)
    ? Number(fatigueWarningPercentOverride)
    : 70;
  const sortedResidents = useMemo(
    () => [...residents].sort((a, b) => a.name.localeCompare(b.name)),
    [residents],
  );

  return (
    <DndContext
      sensors={resolvedSensors}
      collisionDetection={pointerWithin}
      onDragStart={(event) => {
        const activeId = event.active?.id ? String(event.active.id) : null;
        setActiveResidentId(activeId);
        onDragStateChange?.(activeId);
      }}
      onDragEnd={(event) => {
        setActiveResidentId(null);
        onWorkerDrop?.(event);
        onDragStateChange?.(null);
      }}
      onDragCancel={() => {
        setActiveResidentId(null);
        onDragStateChange?.(null);
      }}
    >
      <StyleLabStack direction="vertical" spacing="large">
        <StyleLabSurface
          variant="panel"
          testId="worker-panel"
        >
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-teal-muted">Crew</p>
              <h2 className="text-2xl font-semibold">Pannello residenti</h2>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p className="uppercase tracking-[0.3em]">Fatigue alert ≥ {fatigueWarningPercent}%</p>
              <p>{sortedResidents.length} residenti online</p>
            </div>
          </header>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="worker-panel-list">
            {sortedResidents.map((resident) => (
              <DraggableWorkerCard
                key={resident.id}
                resident={resident}
                isActive={activeResidentId === resident.id}
                isSelected={selectedResidentId === resident.id}
                fatigueWarningPercent={fatigueWarningPercent}
                injuryBadgeCopy={injuryBadgeCopy}
                onSelect={onWorkerSelect}
              />
            ))}

            {sortedResidents.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-slate-400">
                Nessun residente disponibile.
              </p>
            )}
          </div>
        </StyleLabSurface>

        {children}
      </StyleLabStack>
    </DndContext>
  );
}

export default WorkerPanel;
