import React from 'react';
import type { CombatStageSlot } from '../../balancing/config/combatStage';
import type { ActiveFxInstance } from '../../balancing/hooks/useCombatAnimator';
import clsx from 'clsx';

interface CombatFxLayerProps {
    fx: ActiveFxInstance[];
    slotLookup: Map<string, CombatStageSlot>;
}

const FX_CLASSMAP: Record<string, string> = {
    attack: 'bg-linear-to-r from-cyan-500/40 via-slate-900/30 to-rose-400/40 text-white shadow-[0_0_24px_rgba(6,182,212,0.35)]',
    miss: 'bg-linear-to-r from-slate-600/40 to-slate-800/40 text-slate-100 shadow-[0_0_18px_rgba(148,163,184,0.2)]',
    crit: 'bg-linear-to-r from-rose-500/60 via-amber-300/70 to-rose-400/60 text-rose-100 shadow-[0_0_24px_rgba(255,75,114,0.45)]',
    shield: 'bg-linear-to-r from-cyan-400/50 to-emerald-300/50 text-cyan-50 shadow-[0_0_24px_rgba(56,189,248,0.45)]',
    heal: 'bg-linear-to-r from-emerald-400/50 to-lime-300/50 text-emerald-50 shadow-[0_0_24px_rgba(16,185,129,0.45)]',
    shake: 'bg-linear-to-r from-yellow-500/50 to-orange-400/40 text-amber-50 shadow-[0_0_24px_rgba(251,191,36,0.45)]',
    status: 'bg-linear-to-r from-violet-500/50 to-indigo-400/40 text-violet-50 shadow-[0_0_24px_rgba(139,92,246,0.45)]'
};

export const CombatFxLayer: React.FC<CombatFxLayerProps> = ({ fx, slotLookup }) => {
    if (!fx.length) return null;

    return (
        <div className="relative h-full w-full">
            {fx.map(instance => {
                const slot = (instance.actorId && slotLookup.get(instance.actorId))
                    || (instance.targetId && slotLookup.get(instance.targetId));
                if (!slot) return null;

                const style: React.CSSProperties = {
                    left: `${slot.position.xPercent}%`,
                    top: `${slot.position.yPercent}%`,
                    transform: 'translate(-50%, -50%)'
                };

                const magnitude =
                    typeof instance.metadata?.damage === 'number'
                        ? Math.round(Number(instance.metadata.damage))
                        : typeof instance.metadata?.hpLost === 'number'
                            ? Math.round(Number(instance.metadata.hpLost))
                            : typeof instance.metadata?.amount === 'number'
                                ? Math.round(Number(instance.metadata.amount))
                                : undefined;
                const isHeal = instance.type === 'heal';
                const label = magnitude !== undefined
                    ? `${isHeal ? '+' : '-'}${Math.abs(magnitude)}`
                    : instance.type.toUpperCase();

                return (
                    <div
                        key={instance.id}
                        className={clsx(
                            'absolute pointer-events-none select-none rounded-full px-4 py-1 text-[10px] uppercase tracking-[0.4em] backdrop-blur-sm border border-white/20',
                            FX_CLASSMAP[instance.type] ?? 'bg-white/20 text-white'
                        )}
                        style={style}
                    >
                        {label}
                    </div>
                );
            })}
        </div>
    );
};
