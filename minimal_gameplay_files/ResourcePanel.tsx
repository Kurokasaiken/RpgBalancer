/**
 * Compact resource panel used in the Idle Village Sandbox header column.
 * Renders config-driven resources as Observatory-styled pills with optional delta badges.
 */
import React from 'react';
import SummaryStrip, { type SummaryStripProps } from './SummaryStrip';

/**
 * UI payload for each resource pill rendered by {@link ResourcePanel}.
 */
export interface ResourcePanelItem {
  /** Stable identifier for React rendering */
  id: string;
  /** Human friendly resource label */
  label: string;
  /** Optional emoji/icon describing the resource */
  icon?: string;
  /** Current numeric value shown in the pill */
  value: number | string;
  /** Optional delta rendered as +N/-N under the value */
  delta?: number;
  /** Accent color utility class matching the Style Lab palette */
  accentClass?: string;
}

export interface ResourcePanelProps extends Partial<SummaryStripProps> {
  /** Title displayed above the resource grid */
  title?: string;
  /** Custom className for layout hooks */
  className?: string;
  /** Config-driven items to display (preferred). Falls back to legacy gold/food/population props when absent. */
  items?: ResourcePanelItem[];
  /** Legacy rate props maintained for backwards compatibility */
  goldRate?: number;
  foodRate?: number;
  populationRate?: number;
}

const legacyIconMap: Record<string, string> = {
  gold: '🪙',
  food: '🍖',
  population: '👥',
};

const legacyColorMap: Record<string, string> = {
  gold: 'text-amber-200',
  food: 'text-green-200',
  population: 'text-blue-200',
};

/**
 * ResourcePanel visualises the current economy snapshot.
 */
export const ResourcePanel: React.FC<ResourcePanelProps> = ({
  title = 'Resources',
  className = '',
  items,
  gold = 0,
  food = 0,
  population = 0,
  goldRate = 0,
  foodRate = 0,
  populationRate = 0,
}) => {
  const resolvedItems: ResourcePanelItem[] =
    items && items.length > 0
      ? items
      : [
          {
            id: 'gold',
            label: 'Gold',
            icon: legacyIconMap.gold,
            value: gold,
            delta: goldRate,
            accentClass: legacyColorMap.gold,
          },
          {
            id: 'food',
            label: 'Food',
            icon: legacyIconMap.food,
            value: food,
            delta: foodRate,
            accentClass: legacyColorMap.food,
          },
          {
            id: 'population',
            label: 'Population',
            icon: legacyIconMap.population,
            value: population,
            delta: populationRate,
            accentClass: legacyColorMap.population,
          },
        ];

  const showLegacyStrip = !items || items.length === 0;

  return (
    <section
      className={[
        'default-card relative overflow-hidden border border-(--panel-border) bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.08),rgba(4,7,14,0.95))] p-4 shadow-[0_25px_45px_rgba(0,0,0,0.55)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="resource-panel"
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-amber-200/80">Economy Pulse</p>
          <h3 className="text-sm font-semibold text-ivory">{title}</h3>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-300">
          {resolvedItems.length}&nbsp;res
        </span>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {resolvedItems.map((item) => {
          const delta =
            typeof item.delta === 'number' && Number.isFinite(item.delta) ? Number(item.delta) : null;
          const deltaClass =
            delta == null || delta === 0
              ? 'text-slate-400'
              : delta > 0
                ? 'text-emerald-300'
                : 'text-rose-300';
          return (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-left shadow-inner shadow-black/30"
              data-testid={`resource-pill-${item.id}`}
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-300">
                <span className="flex items-center gap-1 text-slate-100">
                  {item.icon && <span aria-hidden>{item.icon}</span>}
                  {item.label}
                </span>
                {delta !== null && delta !== 0 && (
                  <span className={`${deltaClass} text-[10px] tracking-[0.2em]`}>
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </span>
                )}
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-widest text-amber-100">
                <span
                  className={item.accentClass}
                  data-testid={`resource-value-${item.id}`}
                >
                  {item.value}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {showLegacyStrip && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <SummaryStrip gold={gold} food={food} population={population} className="justify-center" />
        </div>
      )}
    </section>
  );
};

export default ResourcePanel;

