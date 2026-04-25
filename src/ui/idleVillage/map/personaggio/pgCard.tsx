import { useMemo } from 'react';
import clsx from 'clsx';
import { formatResidentLabel } from "../../residentName";
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

export interface PersonaggioCardProps {
  resident: ResidentState;
  isSelected?: boolean;
  onSelect?: (residentId: string) => void;
  className?: string;
}

export function PersonaggioCard({
  resident,
  isSelected = false,
  onSelect,
  className,
}: PersonaggioCardProps) {
  const displayName = useMemo(() => formatResidentLabel(resident), [resident]);

  const statusColor = useMemo(() => {
    switch (resident.status) {
      case 'available':
        return 'border-green-400/60 bg-green-950/20';
      case 'away':
        return 'border-blue-400/60 bg-blue-950/20';
      case 'exhausted':
        return 'border-yellow-400/60 bg-yellow-950/20';
      case 'injured':
        return 'border-red-400/60 bg-red-950/20';
      case 'dead':
        return 'border-gray-400/60 bg-gray-950/20';
      default:
        return 'border-slate-400/60 bg-slate-950/20';
    }
  }, [resident.status]);

  return (
    <button
      type="button"
      className={clsx(
        'flex items-center gap-3 rounded-xl border p-3 text-left text-slate-100 transition-all',
        statusColor,
        isSelected ? 'ring-2 ring-amber-300/70' : 'hover:border-slate-300/70',
        className,
      )}
      onClick={() => onSelect?.(resident.id)}
      aria-pressed={isSelected}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300/40 bg-black/50 text-lg font-semibold">
        {resident.displayName?.charAt(0) ?? resident.id.charAt(0)}
      </div>

      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{displayName}</p>
        <p className="text-xs text-slate-300 capitalize">{resident.status}</p>
        <div className="flex gap-2 text-[10px] text-slate-400">
          <span>HP: {resident.currentHp}/{resident.maxHp}</span>
          <span>Fatica: {resident.fatigue}</span>
        </div>
      </div>

      {resident.isHero && (
        <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
          Eroe
        </span>
      )}
    </button>
  );
}

export default PersonaggioCard;
