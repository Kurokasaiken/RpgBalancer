import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Edit3, Lock, EyeOff } from 'lucide-react';
import type { CardDefinition, StatDefinition } from '../../../balancing/config/types';

interface BalancerCardProps {
  card: CardDefinition;
  stats: Record<string, StatDefinition>;
  simValues: Record<string, number>;
  onSimValueChange: (statId: string, value: number) => void;
  onEditStat: (statId: string, updates: Partial<StatDefinition>) => void;
  onDeleteStat: (statId: string) => void;
  onResetStat?: (statId: string) => void;
  onDeleteCard: () => void;
  onAddStat: () => void;
  onEditCard?: () => void;
  isCore?: boolean;
  dragListeners?: React.HTMLAttributes<HTMLButtonElement>;
  dependencyHighlights?: Record<string, boolean>;
  errorHighlights?: Record<string, boolean>;
}

/**
 * BalancerCard component with drag & drop support and config-driven behavior
 * Provides visual feedback for dependencies and errors, stat editing, and card management
 */
export const BalancerCard: React.FC<BalancerCardProps> = ({
  card,
  stats,
  simValues,
  onSimValueChange,
  onEditStat,
  onDeleteStat,
  onResetStat,
  onDeleteCard,
  onAddStat,
  onEditCard,
  isCore = false,
  dragListeners = {},
  dependencyHighlights = {},
  errorHighlights = {},
}) => {
  const { attributes, setNodeRef, transform, transition } = useSortable({ 
    id: card.id,
    disabled: card.isLocked 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardStats = card.statIds.map(id => stats[id]).filter(Boolean);
  const hasManyStats = cardStats.length >= 4;

  const handleStatValueChange = (statId: string, value: number) => {
    const stat = stats[statId];
    if (!stat) return;

    // Validate against stat constraints
    const clampedValue = Math.max(stat.min, Math.min(stat.max, value));
    onSimValueChange(statId, clampedValue);
  };

  const getStatInputType = () => {
    return 'number';
  };

  const formatStatValue = (stat: StatDefinition, value: number) => {
    if (stat.type === 'percentage') {
      return `${value}%`;
    }
    return value.toString();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        rounded-xl border bg-slate-900/80 backdrop-blur-sm p-4 space-y-3
        ${card.isLocked ? 'border-slate-700/50 opacity-75' : 'border-slate-700/60'}
        ${hasManyStats ? 'sm:col-span-2 md:col-span-2 lg:col-span-2 2xl:col-span-2' : ''}
        ${dependencyHighlights[card.id] ? 'ring-2 ring-amber-400/50 ring-offset-1 ring-offset-slate-900' : ''}
        ${errorHighlights[card.id] ? 'ring-2 ring-red-400/50 ring-offset-1 ring-offset-slate-900' : ''}
      `}
      data-testid={`balancer-card-${card.id}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!card.isLocked && (
            <button
              {...attributes}
              {...dragListeners}
              className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-400 transition-colors"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: card.color }}
          />
          <h3 className="font-semibold text-slate-200">{card.title}</h3>
          {card.isLocked && <Lock className="w-3 h-3 text-slate-500" />}
          {card.isHidden && <EyeOff className="w-3 h-3 text-slate-500" />}
        </div>
        
        <div className="flex items-center gap-1">
          {onEditCard && (
            <button
              type="button"
              onClick={onEditCard}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              title="Edit card"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
          {!isCore && !card.isLocked && (
            <button
              type="button"
              onClick={onDeleteCard}
              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
              title="Delete card"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-2 ${hasManyStats ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {cardStats.map((stat) => {
          const hasDependency = dependencyHighlights[stat.id];
          const hasError = errorHighlights[stat.id];
          const currentValue = simValues[stat.id] ?? stat.defaultValue;

          return (
            <div
              key={stat.id}
              className={`
                flex items-center justify-between p-2 rounded-lg border
                ${hasDependency ? 'border-amber-400/60 bg-amber-500/5' : ''}
                ${hasError ? 'border-red-400/60 bg-red-500/5' : ''}
                ${!hasDependency && !hasError ? 'border-slate-700/50 bg-slate-800/30' : ''}
              `}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-slate-400 truncate">{stat.label}</span>
                {stat.isLocked && <Lock className="shrink-0 w-3 h-3 text-slate-600" />}
              </div>
              
              <div className="flex items-center gap-1">
                <input
                  type={getStatInputType()}
                  min={stat.min}
                  max={stat.max}
                  step={stat.step}
                  value={currentValue}
                  onChange={(e) => handleStatValueChange(stat.id, Number(e.target.value))}
                  disabled={stat.isLocked}
                  className={`
                    w-16 px-1.5 py-0.5 text-xs rounded border bg-slate-950 text-right
                    ${stat.isLocked 
                      ? 'border-slate-700 text-slate-600 cursor-not-allowed' 
                      : 'border-slate-600 text-slate-200 focus:border-indigo-400 outline-none'
                    }
                  `}
                />
                <span className="text-xs text-slate-500 w-8 text-right">
                  {formatStatValue(stat, currentValue)}
                </span>
                
                <div className="flex items-center gap-0.5">
                  {!stat.isLocked && (
                    <button
                      type="button"
                      onClick={() => onEditStat(stat.id, {})}
                      className="p-0.5 text-slate-600 hover:text-slate-400 transition-colors"
                      title="Edit stat"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {!stat.isCore && !stat.isLocked && (
                    <button
                      type="button"
                      onClick={() => onDeleteStat(stat.id)}
                      className="p-0.5 text-slate-600 hover:text-red-400 transition-colors"
                      title="Delete stat"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {onResetStat && !stat.isLocked && (
                    <button
                      type="button"
                      onClick={() => onResetStat(stat.id)}
                      className="p-0.5 text-slate-600 hover:text-amber-400 transition-colors"
                      title="Reset to default"
                    >
                      ↺
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Stat Button */}
      {!card.isLocked && !card.isHidden && (
        <button
          type="button"
          onClick={onAddStat}
          className="w-full py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-2 text-xs"
        >
          <Plus className="w-3 h-3" />
          Add Stat
        </button>
      )}

      {/* Card Stats Summary */}
      <div className="text-xs text-slate-500 border-t border-slate-800 pt-2">
        {cardStats.length} stats • {cardStats.filter(s => s.isLocked).length} locked
      </div>
    </div>
  );
};
