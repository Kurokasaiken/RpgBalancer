import { memo } from 'react';
import type { VillageResources } from '@/engine/game/idleVillage/TimeEngine';

interface VillageResourcePanelProps {
    resources: VillageResources;
}

export const VillageResourcePanel = memo(({ resources }: VillageResourcePanelProps) => {
    return (
        <section className="relative overflow-hidden rounded-[26px] border border-(--panel-border) bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.12),rgba(4,7,14,0.9))] p-4 shadow-[0_25px_45px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'var(--card-surface-radial, radial-gradient(circle at 20% 0%, rgba(255,255,255,0.25), transparent 60%))' }} />
            <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-amber-100">
                    <span>Resources</span>
                    <span>Eco Pulse</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-[11px] uppercase tracking-[0.3em] text-slate-200">
                    <div className="rounded-[18px] border border-amber-300/60 bg-black/40 px-3 py-2 shadow-inner shadow-amber-900/40">
                        <p className="text-[9px] text-amber-200/80">Food</p>
                        <p className="text-xl font-semibold tracking-widest text-amber-100">{resources.food ?? 0}</p>
                    </div>
                    <div className="rounded-[18px] border border-amber-300/60 bg-black/40 px-3 py-2 shadow-inner shadow-amber-900/40">
                        <p className="text-[9px] text-amber-200/80">Gold</p>
                        <p className="text-xl font-semibold tracking-widest text-amber-100">{resources.gold ?? 0}</p>
                    </div>
                    <div className="rounded-[18px] border border-amber-300/60 bg-black/40 px-3 py-2 shadow-inner shadow-amber-900/40">
                        <p className="text-[9px] text-amber-200/80">Day</p>
                        <p className="text-xl font-semibold tracking-widest text-amber-100">{resources.day ?? 0}</p>
                    </div>
                </div>
            </div>
        </section>
    );
});
