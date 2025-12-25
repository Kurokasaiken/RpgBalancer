import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableWorkerProps {
  id: string;
  label: string;
  subtitle?: string;
  hp: number;
  fatigue: number;
  disabled?: boolean;
  className?: string;
}

export function DraggableWorker({ 
  id, 
  label, 
  subtitle, 
  hp, 
  fatigue, 
  disabled = false,
  className 
}: DraggableWorkerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
    disabled,
  });

  const constrainedHp = Math.max(0, Math.min(100, hp));
  const constrainedFatigue = Math.max(0, Math.min(100, fatigue));

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/85 px-4 py-3 text-left text-xs text-amber-100 shadow-[0_10px_25px_rgba(0,0,0,0.45)] transition',
        disabled ? 'cursor-not-allowed opacity-60 grayscale' : 'cursor-grab active:cursor-grabbing active:scale-95 hover:border-emerald-400/70',
        isDragging ? 'opacity-40' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-[0.08em] text-ivory">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/60 bg-slate-900 text-base font-semibold uppercase tracking-[0.3em]">
          {label.charAt(0) || id.charAt(0)}
        </div>
      </div>
      {subtitle && <span className="text-[10px] tracking-wide text-slate-400">{subtitle}</span>}
      <div className="space-y-2 pt-1 text-[10px] tracking-[0.2em] uppercase">
        <div>
          <div className="mb-1 flex items-center justify-between text-emerald-200/80">
            <span>HP</span>
            <span>{constrainedHp}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-300 to-emerald-500 transition-all"
              style={{ width: `${constrainedHp}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-amber-200/80">
            <span>FATICA</span>
            <span>{constrainedFatigue}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-300 via-amber-400 to-orange-400 transition-all"
              style={{ width: `${constrainedFatigue}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
