/**
 * Displays key resource values as compact pill-shaped indicators.
 * Used in headers and summary panels to show gold, food, and population.
 */
import React from 'react';

export interface SummaryStripProps {
  /** Current gold amount */
  gold: number;
  /** Current food amount */
  food: number;
  /** Current population count */
  population: number;
  /** Optional per-resource deltas (positive = gain, negative = consumption) */
  deltas?: Partial<Record<'gold' | 'food' | 'population', number>>;
  /** Optional className for styling */
  className?: string;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({
  gold,
  food,
  population,
  deltas,
  className = '',
}) => {
  const formattedDelta = (value?: number) => {
    if (value == null || value === 0) {
      return null;
    }
    const sign = value > 0 ? '+' : '';
    return `${sign}${Math.round(value * 10) / 10}`;
  };

  const renderPill = (
    id: 'gold' | 'food' | 'population',
    icon: string,
    value: number,
    colors: string,
  ) => {
    const delta = formattedDelta(deltas?.[id]);
    const deltaTone = (deltas?.[id] ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300';

    return (
      <div
        key={id}
        className={`flex flex-col items-start gap-0.5 rounded-full border px-3 py-1 text-xs font-medium ${colors}`}
      >
        <div className="flex items-center gap-1">
          <span aria-hidden>{icon}</span>
          <span data-testid={`summary-${id}-value`}>{value}</span>
        </div>
        {delta && (
          <span
            className={`text-[10px] font-semibold ${deltaTone}`}
            data-testid={`summary-${id}-delta`}
          >
            {delta}
          </span>
        )}
      </div>
    );
  };

  return (
    <div data-testid="summary-strip" className={`flex flex-wrap items-center gap-2 ${className}`}>
      {renderPill('gold', '🪙', gold, 'border-amber-200/30 bg-amber-900/20 text-amber-100')}
      {renderPill('food', '🍖', food, 'border-green-200/30 bg-green-900/20 text-green-100')}
      {renderPill(
        'population',
        '👥',
        population,
        'border-blue-200/30 bg-blue-900/20 text-blue-100',
      )}
    </div>
  );
};

export default SummaryStrip;
