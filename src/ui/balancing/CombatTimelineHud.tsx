import React from 'react';
import clsx from 'clsx';
import type { CombatAnimationEvent } from '../../balancing/simulation/types';

interface CombatTimelineHudProps {
    events: CombatAnimationEvent[];
    cursor: number;
}

const EVENT_LABELS: Partial<Record<CombatAnimationEvent['type'], string>> = {
    attack: 'Attack',
    miss: 'Miss',
    crit: 'Crit',
    heal: 'Heal',
    shield: 'Shield',
    shake: 'Impact',
    status: 'Phase'
};

const typeColor: Partial<Record<CombatAnimationEvent['type'], string>> = {
    attack: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    miss: 'bg-slate-600/30 text-slate-200 border-slate-300/30',
    crit: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
    heal: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    shield: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40',
    shake: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    status: 'bg-slate-800/60 text-slate-200 border-white/20'
};

export const CombatTimelineHud: React.FC<CombatTimelineHudProps> = ({ events, cursor }) => {
    if (!events.length) {
        return (
            <div className="default-card bg-slate-950/50 text-xs text-slate-500">No timeline events</div>
        );
    }

    const windowStart = Math.max(0, cursor - 1);
    const windowEnd = Math.min(events.length, windowStart + 6);
    const windowEvents = events.slice(windowStart, windowEnd);
    const progress = events.length ? (cursor / events.length) * 100 : 0;

    return (
        <div className="default-card bg-slate-950/70">
            <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-slate-400">
                <span>Timeline</span>
                <span>{cursor}/{events.length}</span>
            </div>
            <div className="relative mb-4 h-1 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-linear-to-r from-cyan-400 to-rose-400" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
                {windowEvents.map((evt, index) => {
                    const isActive = windowStart + index === cursor;
                    const label = EVENT_LABELS[evt.type] ?? evt.type;
                    const damage = evt.metadata?.damage ?? evt.metadata?.amount;
                    return (
                        <div
                            key={evt.id}
                            className={clsx(
                                'rounded-2xl border px-3 py-2 text-center transition-colors duration-200 shadow-inner shadow-black/30',
                                typeColor[evt.type] ?? 'bg-slate-800/80 text-slate-200 border-white/10',
                                isActive && 'ring-2 ring-cyan-300/70'
                            )}
                        >
                            <p className="text-[10px] uppercase tracking-[0.35em] text-white/70">{evt.phase}</p>
                            <p className="text-sm font-semibold text-white">{label}</p>
                            {typeof damage === 'number' && (
                                <p className={clsx('text-xs font-semibold', evt.type === 'heal' ? 'text-emerald-200' : 'text-rose-200')}>
                                    {evt.type === 'heal' ? '+' : '-'}{Math.round(Number(damage))}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
