import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardDefinition, StatDefinition } from '../../balancing/config/types';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';
import { solveConfigChange } from '../../balancing/config/ConfigSolver';
import type { StatBlock } from '../../balancing/types';
import { DEFAULT_STATS } from '../../balancing/types';
import { simulateExpectedTTK } from '../../balancing/1v1/simulator';
import { MathEngine } from '../../balancing/1v1/mathEngine';
import { ConfigurableCard } from './ConfigurableCard';
import { ConfigToolbar } from './ConfigToolbar';
import { Sparkles } from 'lucide-react';

interface SortableCardProps {
  card: CardDefinition;
  stats: Record<string, StatDefinition>;
  simValues: Record<string, number>;
  onSimValueChange: (statId: string, value: number) => void;
  onClickAddStat: (card: CardDefinition) => void;
  onEditStat: (statId: string, updates: Partial<StatDefinition>) => void;
  onDeleteStat: (statId: string) => void;
  onResetStat?: (statId: string) => void;
  onResetCard?: () => void;
  newStatId?: string;
  onUpdateCard: (updates: Partial<CardDefinition>) => void;
  onDeleteCard: () => void;
  startHeaderInEdit?: boolean;
  availableStats: { id: string; label: string }[];
  dependencyHighlights?: Record<string, boolean>;
  errorHighlights?: Record<string, boolean>;
}

const SortableCard: React.FC<SortableCardProps> = ({
  card,
  stats,
  simValues,
  onSimValueChange,
  onClickAddStat,
  onEditStat,
  onDeleteStat,
  onResetStat,
  onResetCard,
  newStatId,
  onUpdateCard,
  onDeleteCard,
  startHeaderInEdit,
  availableStats,
  dependencyHighlights,
  errorHighlights,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });

  const hasManyStats = card.statIds.length >= 4;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  const className = hasManyStats ? 'sm:col-span-2 md:col-span-2 lg:col-span-2 2xl:col-span-2' : '';

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={className}>
      <ConfigurableCard
        card={card}
        stats={stats}
        simValues={simValues}
        onSimValueChange={onSimValueChange}
        onEditStat={onEditStat}
        onDeleteStat={onDeleteStat}
        onResetStat={onResetStat}
        onResetCard={onResetCard}
        newStatId={newStatId}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
        startHeaderInEdit={startHeaderInEdit}
        availableStats={availableStats}
        dragListeners={listeners}
        dependencyHighlights={dependencyHighlights}
        errorHighlights={errorHighlights}
      />
      {!card.isHidden && (
        <button
          type="button"
          className="mt-1 w-full text-[10px] px-2 py-1.5 rounded-lg border border-dashed border-amber-400/60 text-amber-200 hover:bg-amber-500/10 tracking-[0.3em] uppercase transition-colors"
          onClick={() => onClickAddStat(card)}
        >
          ＋ Stat
        </button>
      )}
    </div>
  );
};

// Build a StatBlock for the 1v1 math engine from the current simValues.
// Uses DEFAULT_STATS as a safe baseline and overrides only known fields.
function buildStatBlockFromSimValues(simValues: Record<string, number>): StatBlock {
  const base: StatBlock = { ...DEFAULT_STATS };
  Object.entries(simValues).forEach(([id, value]) => {
    if (typeof value === 'number' && Object.prototype.hasOwnProperty.call(base, id)) {
      (base as any)[id] = value;
    }
  });
  return base;
}

export const BalancerNew: React.FC = () => {
  const { config, reorderCards, updateStat, deleteStat, addCard, addStat, updateCard, deleteCard, resetStatToInitial, resetCardToInitial, resetToInitialConfig } = useBalancerConfig();

  const [lastCreatedStatId, setLastCreatedStatId] = useState<string | null>(null);
  const [lastCreatedCardId, setLastCreatedCardId] = useState<string | null>(null);
  const [resetConfirmPending, setResetConfirmPending] = useState(false);
  const [dependencyHighlights, setDependencyHighlights] = useState<Record<string, boolean>>({});
  const [errorHighlights, setErrorHighlights] = useState<Record<string, boolean>>({});
  const cascadeTimeoutsRef = useRef<Record<string, number>>({});
  const errorTimeoutsRef = useRef<Record<string, number>>({});
  
  const SIM_VALUES_KEY = 'balancer_sim_values';
  
  // Simulation values - initialized from localStorage or config defaults
  const [simValues, setSimValues] = useState<Record<string, number>>(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem(SIM_VALUES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with config defaults for any new stats
        const merged: Record<string, number> = {};
        Object.entries(config.stats).forEach(([id, stat]) => {
          merged[id] = typeof parsed[id] === 'number' ? parsed[id] : stat.defaultValue;
        });
        return merged;
      } catch {
        // Fall through to defaults
      }
    }
    // Initialize from config defaults
    const initial: Record<string, number> = {};
    Object.entries(config.stats).forEach(([id, stat]) => {
      initial[id] = stat.defaultValue;
    });
    return initial;
  });
  
  // Save simValues to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SIM_VALUES_KEY, JSON.stringify(simValues));
  }, [simValues]);
  
  // When config.stats changes (new stat added, stat deleted), update simValues
  // but ONLY for new stats - preserve existing values
  useEffect(() => {
    setSimValues(prev => {
      const next: Record<string, number> = {};
      Object.entries(config.stats).forEach(([id, stat]) => {
        // Preserve existing value if present, otherwise use defaultValue
        next[id] = typeof prev[id] === 'number' ? prev[id] : stat.defaultValue;
      });
      return next;
    });
  }, [config.stats]);
  
  // Listen for storage changes (from import or other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SIM_VALUES_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const merged: Record<string, number> = {};
          Object.entries(config.stats).forEach(([id, stat]) => {
            merged[id] = typeof parsed[id] === 'number' ? parsed[id] : stat.defaultValue;
          });
          setSimValues(merged);
        } catch {
          // Ignore parse errors
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [config.stats]);
  
  // Handle simulation value change - this triggers config-driven formula solving
  const handleSimValueChange = useCallback(
    (statId: string, value: number) => {
      setSimValues((prev) => {
        const result = solveConfigChange(config, prev, statId, value);

        if (result.error) {
          const ids = [result.error.statId, ...result.error.blockingStats];

          setErrorHighlights((prevErr) => {
            const next = { ...prevErr };
            ids.forEach((id) => {
              next[id] = true;
            });
            return next;
          });

          ids.forEach((id) => {
            const existing = errorTimeoutsRef.current[id];
            if (existing) window.clearTimeout(existing);
            errorTimeoutsRef.current[id] = window.setTimeout(() => {
              setErrorHighlights((curr) => {
                const next = { ...curr };
                delete next[id];
                return next;
              });
            }, 800);
          });

          // Do not apply invalid change
          return prev;
        }

        if (result.changed.length > 0) {
          setDependencyHighlights((prevDeps) => {
            const next = { ...prevDeps };
            result.changed.forEach((id) => {
              next[id] = true;
            });
            return next;
          });

          result.changed.forEach((id) => {
            const existing = cascadeTimeoutsRef.current[id];
            if (existing) window.clearTimeout(existing);
            cascadeTimeoutsRef.current[id] = window.setTimeout(() => {
              setDependencyHighlights((curr) => {
                const next = { ...curr };
                delete next[id];
                return next;
              });
            }, 500);
          });
        }

        return result.values;
      });
    },
    [config],
  );

  // Reset all configuration and simulation values back to the initial snapshot
  const handleResetAll = () => {
    if (!resetConfirmPending) {
      setResetConfirmPending(true);
      // Small window to confirm reset without blocking UI
      setTimeout(() => {
        setResetConfirmPending(false);
      }, 2000);
      return;
    }

    setResetConfirmPending(false);
    // Clear simValues so that the next config snapshot repopulates them from defaults
    setSimValues({});
    // Reset config to the initial snapshot stored by useBalancerConfig
    resetToInitialConfig();
  };

  const cards = Object.values(config.cards).sort((a, b) => a.order - b.order);
  const allStatInfos = Object.values(config.stats).map((stat) => ({ id: stat.id, label: stat.label }));
  const visibleCards = cards.filter((card) => !card.isHidden);
  const hiddenCards = cards.filter((card) => card.isHidden);

  // Deterministic 1v1 equal-fight metrics (Self vs Self), updated in real time
  const equalFightMetrics = useMemo(() => {
    try {
      const statBlock = buildStatBlockFromSimValues(simValues);
      const edpt = MathEngine.calcEDPT(statBlock, statBlock);
      const sim = simulateExpectedTTK(statBlock, statBlock);
      const earlyImpact = edpt * 3;
      return { edpt, ttk: sim.turns, earlyImpact };
    } catch {
      return null;
    }
  }, [simValues]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = cards.map((c) => c.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = [...ids];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    reorderCards(updated);
  };

  const handleAddCard = () => {
    const id = `card_${Date.now()}`;
    const result = addCard({ id, title: 'New Card', color: 'text-amber-300', icon: '🂠' });
    if (result.success) {
      setLastCreatedCardId(id);
    }
  };

  const handleAddStat = (card: CardDefinition) => {
    const id = `stat_${Date.now()}`;
    addStat(card.id, {
      id,
      label: 'New Stat',
      description: undefined,
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 0,
      weight: 1,
      isDerived: false,
      formula: undefined,
      bgColor: undefined,
    });
    setLastCreatedStatId(id);
  };

  return (
    <div className="observatory-page">
      {/* Subtle animated glow/stars */}
      <div className="observatory-bg-orbits">
        <div className="observatory-bg-orbit-left" />
        <div className="observatory-bg-orbit-right" />
      </div>

      <div className="observatory-shell space-y-3">
        <header className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-[0.3em] uppercase text-indigo-200 drop-shadow-[0_0_14px_rgba(129,140,248,0.9)]">
              <Sparkles className="w-6 h-6 text-cyan-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
              <span>Balancer</span>
            </h1>
            <p className="mt-1 text-[10px] text-slate-400 uppercase tracking-[0.26em]">
              Arcane Tech Glass · Config-Driven
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className={`px-3 py-1.5 rounded-full border text-xs tracking-[0.35em] uppercase transition-colors ${
                resetConfirmPending
                  ? 'border-red-400/80 text-red-100 bg-red-500/20'
                  : 'border-red-500/60 text-red-200 hover:bg-red-500/10'
              }`}
              title={resetConfirmPending ? 'Clicca di nuovo per confermare il reset completo' : 'Resetta tutto ai valori iniziali'}
            >
              ↺ Reset All
            </button>
            <button
              type="button"
              onClick={handleAddCard}
              className="px-4 py-2 rounded-full border border-amber-400/60 text-amber-200 text-xs tracking-[0.4em] uppercase hover:bg-amber-500/10 transition-colors"
            >
              ＋ Nuova Card
            </button>
          </div>
        </header>

        <ConfigToolbar />

        {equalFightMetrics && (
          <div className="mt-3 rounded-xl border border-cyan-500/40 bg-slate-900/70 px-4 py-3 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.22em]">
            <div className="flex flex-col min-w-[120px]">
              <span className="text-slate-400">1v1 Equal (Self vs Self)</span>
              <span className="font-mono text-cyan-300 text-xs">
                {equalFightMetrics.ttk.toFixed(2)} turns
              </span>
            </div>
            <div className="flex flex-col min-w-[120px]">
              <span className="text-slate-400">EDPT vs Self</span>
              <span className="font-mono text-emerald-300 text-xs">
                {equalFightMetrics.edpt.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col min-w-[140px]">
              <span className="text-slate-400">Early Impact (3T)</span>
              <span className="font-mono text-amber-300 text-xs">
                {equalFightMetrics.earlyImpact.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Hidden cards row */}
        {hiddenCards.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="mr-2 uppercase tracking-[0.22em] text-slate-400">Cards nascoste</span>
            {hiddenCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => updateCard(card.id, { isHidden: false })}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-600/70 bg-slate-900/60 text-slate-200 hover:border-indigo-400/80 hover:text-indigo-100 hover:bg-slate-900/90 transition-colors"
                title="Mostra card"
              >
                <span aria-hidden className="text-xs">{card.icon || '🂠'}</span>
                <span className="text-[10px] tracking-[0.18em] uppercase truncate max-w-[7rem]">{card.title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="observatory-panel min-h-[600px]">
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {visibleCards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    stats={config.stats}
                    simValues={simValues}
                    onSimValueChange={handleSimValueChange}
                    onClickAddStat={handleAddStat}
                    onEditStat={(statId, updates) => updateStat(statId, updates)}
                    onDeleteStat={(statId) => {
                      deleteStat(statId);
                    }}
                    onResetStat={(statId) => {
                      resetStatToInitial(statId);
                    }}
                    onResetCard={() => {
                      resetCardToInitial(card.id);
                    }}
                    newStatId={lastCreatedStatId ?? undefined}
                    onUpdateCard={(updates) => {
                      updateCard(card.id, updates);
                    }}
                    onDeleteCard={() => {
                      deleteCard(card.id);
                    }}
                    startHeaderInEdit={card.id === lastCreatedCardId}
                    availableStats={allStatInfos}
                    dependencyHighlights={dependencyHighlights}
                    errorHighlights={errorHighlights}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="flex items-center justify-center rounded-2xl border border-dashed border-amber-500/50 text-amber-200 text-xl hover:bg-amber-500/5 min-h-[120px]"
                  title="Add Card"
                >
                  ＋
                </button>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};
