import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
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
import { CardEditor } from './CardEditor';
import { StatEditor } from './StatEditor';
import { Sparkles } from 'lucide-react';
import { ScenarioCard } from './scenario/ScenarioCard';
import { SCENARIO_CONFIGS, type ScenarioConfig, type ScenarioType } from '../../balancing/contextWeights';
import { getScenarioPowerMapForStatBlockWithConfigs } from '../../balancing/expectedValue';
import { runScenarioMatchupWithOverride, type ScenarioMatchupResult } from '../../balancing/scenario/ScenarioSimulationRunner';
import { ELITE_SCENARIOS, type EliteScenarioId } from '../../balancing/scenario/eliteScenarios';

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
  onOpenStatEditor?: (cardId: string, statId?: string) => void;
  onOpenCardEditor?: (cardId: string) => void;
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
  onOpenStatEditor,
  onOpenCardEditor,
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
        onOpenStatEditor={
          onOpenStatEditor ? (statId) => onOpenStatEditor(card.id, statId) : undefined
        }
        onOpenCardEditor={onOpenCardEditor ? () => onOpenCardEditor(card.id) : undefined}
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

export const Balancer: React.FC = () => {
  const { config, reorderCards, updateStat, deleteStat, updateCard, deleteCard, resetStatToInitial, resetCardToInitial, resetToInitialConfig } = useBalancerConfig();

  const [lastCreatedStatId, setLastCreatedStatId] = useState<string | null>(null);
  const [lastCreatedCardId, setLastCreatedCardId] = useState<string | null>(null);
  const [isCardEditorOpen, setCardEditorOpen] = useState(false);
  const [cardEditorTargetId, setCardEditorTargetId] = useState<string | null>(null);
  const [cardEditorMode, setCardEditorMode] = useState<'create' | 'edit'>('create');
  const [isStatEditorOpen, setStatEditorOpen] = useState(false);
  const [statEditorTargetCardId, setStatEditorTargetCardId] = useState<string | null>(null);
  const [statEditorTargetStatId, setStatEditorTargetStatId] = useState<string | null>(null);
  const [resetConfirmPending, setResetConfirmPending] = useState(false);
  const [showScenarioLab, setShowScenarioLab] = useState(false);
  const [dependencyHighlights, setDependencyHighlights] = useState<Record<string, boolean>>({});
  const [errorHighlights, setErrorHighlights] = useState<Record<string, boolean>>({});
  const cascadeTimeoutsRef = useRef<Record<string, number>>({});
  const errorTimeoutsRef = useRef<Record<string, number>>({});
  
  const SIM_VALUES_KEY = 'balancer_sim_values';
  const SCENARIO_CONFIGS_KEY = 'balancer_scenario_configs_v1';
  
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

  const [scenarioConfigs, setScenarioConfigs] = useState<Record<ScenarioType, ScenarioConfig>>(() => {
    try {
      const saved = localStorage.getItem(SCENARIO_CONFIGS_KEY);
      if (!saved) {
        return SCENARIO_CONFIGS;
      }
      const parsed = JSON.parse(saved) as Partial<Record<ScenarioType, Partial<ScenarioConfig>>>;
      const merged: Record<ScenarioType, ScenarioConfig> = { ...SCENARIO_CONFIGS } as Record<ScenarioType, ScenarioConfig>;
      (Object.keys(SCENARIO_CONFIGS) as ScenarioType[]).forEach((type) => {
        const override = parsed[type];
        if (override) {
          merged[type] = { ...SCENARIO_CONFIGS[type], ...override };
        }
      });
      return merged;
    } catch {
      return SCENARIO_CONFIGS;
    }
  });

  const handleScenarioConfigChange = useCallback(
    (type: ScenarioType, updates: Partial<ScenarioConfig>) => {
      setScenarioConfigs((prev) => ({
        ...prev,
        [type]: { ...prev[type], ...updates },
      }));
    },
    [],
  );

  useEffect(() => {
    try {
      localStorage.setItem(SCENARIO_CONFIGS_KEY, JSON.stringify(scenarioConfigs));
    } catch {
    }
  }, [scenarioConfigs]);

  useEffect(() => {
    const handleScenarioStorageChange = (e: StorageEvent) => {
      if (e.key !== SCENARIO_CONFIGS_KEY || !e.newValue) {
        return;
      }
      try {
        const parsed = JSON.parse(e.newValue) as Partial<Record<ScenarioType, Partial<ScenarioConfig>>>;
        setScenarioConfigs((prev) => {
          const next: Record<ScenarioType, ScenarioConfig> = { ...prev } as Record<ScenarioType, ScenarioConfig>;
          (Object.keys(SCENARIO_CONFIGS) as ScenarioType[]).forEach((type) => {
            const override = parsed[type];
            if (override) {
              next[type] = { ...SCENARIO_CONFIGS[type], ...override };
            }
          });
          return next;
        });
      } catch {
      }
    };

    window.addEventListener('storage', handleScenarioStorageChange);
    return () => window.removeEventListener('storage', handleScenarioStorageChange);
  }, []);

  const scenarioTypeList = Object.keys(SCENARIO_CONFIGS) as ScenarioType[];
  const [selectedScenarioType, setSelectedScenarioType] = useState<ScenarioType>(
    scenarioTypeList[0] ?? 'duel_1v1',
  );
  const [scenarioIterations, setScenarioIterations] = useState<number>(500);
  const [isScenarioSimRunning, setIsScenarioSimRunning] = useState(false);
  const [scenarioSimResult, setScenarioSimResult] = useState<ScenarioMatchupResult | null>(null);
  const [selectedEliteId, setSelectedEliteId] = useState<EliteScenarioId | ''>('');

  const handleExportScenarios = useCallback(() => {
    try {
      const data = JSON.stringify(scenarioConfigs, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `balancer-scenarios-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    }
  }, [scenarioConfigs]);

  const handleImportScenarios = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        if (!text) {
          return;
        }
        const parsed = JSON.parse(text) as Partial<Record<ScenarioType, Partial<ScenarioConfig>>>;
        setScenarioConfigs((prev) => {
          const next: Record<ScenarioType, ScenarioConfig> = { ...prev } as Record<ScenarioType, ScenarioConfig>;
          (Object.keys(SCENARIO_CONFIGS) as ScenarioType[]).forEach((type) => {
            const override = parsed[type];
            if (override) {
              next[type] = { ...SCENARIO_CONFIGS[type], ...override };
            }
          });
          return next;
        });
      } catch {
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  }, []);

  const handleApplyElitePreset = useCallback(
    (eliteId: EliteScenarioId) => {
      const preset = ELITE_SCENARIOS[eliteId];
      if (!preset) {
        return;
      }

      const baseType = preset.baseScenarioType;
      const overrides = preset.scenarioOverrides;
      if (!overrides) {
        return;
      }

      setScenarioConfigs((prev) => {
        const current = prev[baseType] ?? SCENARIO_CONFIGS[baseType];
        const mergedEffectiveness = {
          ...current.statEffectiveness,
          ...(overrides.statEffectiveness ?? {}),
        };

        return {
          ...prev,
          [baseType]: {
            ...current,
            ...overrides,
            statEffectiveness: mergedEffectiveness,
          },
        };
      });
    },
    [],
  );

  const handleRunScenarioSimulation = useCallback(() => {
    try {
      setIsScenarioSimRunning(true);
      const attacker = buildStatBlockFromSimValues(simValues);
      const defender = DEFAULT_STATS;
      const scenario = scenarioConfigs[selectedScenarioType];
      const result = runScenarioMatchupWithOverride({
        scenarioType: selectedScenarioType,
        iterations: scenarioIterations,
        attacker,
        defender,
        attackerName: 'Build',
        defenderName: 'Baseline',
        logSampleSize: 10,
        scenarioOverride: scenario,
      });
      setScenarioSimResult(result);
    } catch {
      setScenarioSimResult(null);
    } finally {
      setIsScenarioSimRunning(false);
    }
  }, [simValues, scenarioConfigs, selectedScenarioType, scenarioIterations]);

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

  const scenarioPowerMap = useMemo(() => {
    try {
      const statBlock = buildStatBlockFromSimValues(simValues);
      return getScenarioPowerMapForStatBlockWithConfigs(statBlock, scenarioConfigs);
    } catch {
      return null;
    }
  }, [simValues, scenarioConfigs]);

  const handleDragEnd = (event: DragEndEvent) => {
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

  const openCardEditor = useCallback((cardId?: string) => {
    setCardEditorMode(cardId ? 'edit' : 'create');
    setCardEditorTargetId(cardId ?? null);
    setCardEditorOpen(true);
  }, []);

  const closeCardEditor = useCallback(() => {
    setCardEditorOpen(false);
    setCardEditorTargetId(null);
  }, []);

  const handleCardEditorSaveComplete = useCallback(
    (cardId: string, mode: 'create' | 'edit') => {
      if (mode === 'create') {
        setLastCreatedCardId(cardId);
      }
      closeCardEditor();
    },
    [closeCardEditor],
  );

  const handleAddCard = useCallback(() => {
    openCardEditor();
  }, [openCardEditor]);

  const handleOpenExistingCardEditor = useCallback(
    (cardId: string) => {
      openCardEditor(cardId);
    },
    [openCardEditor],
  );

  const openStatEditor = useCallback((cardId: string, statId?: string) => {
    setStatEditorTargetCardId(cardId);
    setStatEditorTargetStatId(statId ?? null);
    setStatEditorOpen(true);
  }, []);

  const closeStatEditor = useCallback(() => {
    setStatEditorOpen(false);
    setStatEditorTargetCardId(null);
    setStatEditorTargetStatId(null);
  }, []);

  const handleStatEditorSaveComplete = useCallback(
    (statId: string) => {
      setLastCreatedStatId(statId);
      closeStatEditor();
    },
    [closeStatEditor],
  );

  const handleAddStat = useCallback(
    (card: CardDefinition) => {
      openStatEditor(card.id);
    },
    [openStatEditor],
  );

  const handleOpenStatEditor = useCallback(
    (cardId: string, statId?: string) => {
      openStatEditor(cardId, statId);
    },
    [openStatEditor],
  );

  const cardEditorCard = cardEditorTargetId ? config.cards[cardEditorTargetId] : undefined;
  const statEditorCard = statEditorTargetCardId ? config.cards[statEditorTargetCardId] ?? null : null;
  const statEditorStat =
    statEditorTargetStatId && config.stats[statEditorTargetStatId]
      ? config.stats[statEditorTargetStatId]
      : undefined;

  useEffect(() => {
    if (!isCardEditorOpen) return;
    if (cardEditorMode === 'edit' && cardEditorTargetId && !config.cards[cardEditorTargetId]) {
      closeCardEditor();
    }
  }, [isCardEditorOpen, cardEditorMode, cardEditorTargetId, config.cards, closeCardEditor]);

  useEffect(() => {
    if (!isStatEditorOpen) return;
    if (!statEditorTargetCardId || !config.cards[statEditorTargetCardId]) {
      closeStatEditor();
      return;
    }
    if (statEditorTargetStatId && !config.stats[statEditorTargetStatId]) {
      setStatEditorTargetStatId(null);
    }
  }, [
    isStatEditorOpen,
    statEditorTargetCardId,
    statEditorTargetStatId,
    config.cards,
    config.stats,
    closeStatEditor,
  ]);

  return (
    <>
      <div className="observatory-page" data-testid="app-loaded">
        {/* Subtle animated glow/stars */}
        <div className="observatory-bg-orbits">
          <div className="observatory-bg-orbit-left" />
          <div className="observatory-bg-orbit-right" />
        </div>

        <div className="observatory-shell space-y-3">
          <header className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-col">
              <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-semibold tracking-[0.22em] md:tracking-[0.3em] uppercase text-indigo-200 drop-shadow-[0_0_14px_rgba(129,140,248,0.9)]">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-cyan-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                <span>Balancer</span>
              </h1>
              <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.26em]">
                Arcane Tech Glass · Config-Driven
              </p>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 mt-2 md:mt-0">
              <button
                type="button"
                onClick={handleResetAll}
                className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border text-[10px] tracking-[0.3em] uppercase transition-colors ${
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
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-amber-400/60 text-amber-200 text-[10px] tracking-[0.35em] uppercase hover:bg-amber-500/10"
              >
                ＋ Nuova Card
              </button>
              <button
                type="button"
                onClick={() => setShowScenarioLab((prev) => !prev)}
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-cyan-400/60 text-cyan-200 text-[10px] tracking-[0.3em] uppercase hover:bg-cyan-500/10"
              >
                Scenario Lab
              </button>
            </div>
          </header>

          <ConfigToolbar />

          {equalFightMetrics && (
            <div className="mt-3 rounded-xl border border-cyan-500/40 bg-slate-900/70 px-3 md:px-4 py-2.5 md:py-3 flex flex-wrap items-center gap-3 md:gap-4 text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.22em]">
              <div className="flex flex-col min-w-[120px]">
                <span className="text-slate-400">1v1 Equal (Self vs Self)</span>
                <span className="font-mono text-cyan-300 text-[11px] md:text-xs">
                  {equalFightMetrics.ttk.toFixed(2)} turns
                </span>
              </div>
              <div className="flex flex-col min-w-[120px]">
                <span className="text-slate-400">EDPT vs Self</span>
                <span className="font-mono text-emerald-300 text-[11px] md:text-xs">
                  {equalFightMetrics.edpt.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col min-w-[140px]">
                <span className="text-slate-400">Early Impact (3T)</span>
                <span className="font-mono text-amber-300 text-[11px] md:text-xs">
                  {equalFightMetrics.earlyImpact.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {showScenarioLab && (
            <>
              <div className="mt-4 rounded-xl border border-indigo-500/40 bg-slate-900/70 px-3 md:px-4 py-2.5 md:py-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.2em] md:tracking-[0.24em] text-indigo-300">
                      Scenario Simulation (vs Baseline)
                    </h3>
                    <select
                      className="rounded-full border border-indigo-500/60 bg-slate-950 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-indigo-200 hover:border-indigo-400/80"
                      value={selectedScenarioType}
                      onChange={(e) => setSelectedScenarioType(e.target.value as ScenarioType)}
                    >
                      {(Object.entries(scenarioConfigs) as Array<[ScenarioType, ScenarioConfig]>).map(
                        ([type, scenario]) => (
                          <option key={type} value={type}>
                            {scenario.icon} {scenario.name}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] md:text-[10px]">
                    <label className="flex items-center gap-1 text-slate-300">
                      <span className="uppercase tracking-[0.2em]">Iter</span>
                      <input
                        type="number"
                        min={50}
                        max={5000}
                        step={50}
                        value={scenarioIterations}
                        onChange={(e) => setScenarioIterations(Number(e.target.value) || 50)}
                        className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-0.5 text-[9px] md:text-[10px] text-slate-100 outline-none focus:border-indigo-400"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRunScenarioSimulation}
                      disabled={isScenarioSimRunning}
                      className="rounded-full border border-indigo-500/80 px-2.5 md:px-3 py-1 text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.22em] text-indigo-100 hover:bg-indigo-500/10 disabled:opacity-50"
                    >
                      {isScenarioSimRunning ? 'Running...' : 'Run Sim'}
                    </button>
                  </div>
                </div>

                {scenarioSimResult && (
                  <div className="grid gap-2.5 text-[9px] md:text-[10px] sm:grid-cols-3">
                    <div className="flex flex-col">
                      <span className="text-slate-400 uppercase tracking-[0.2em]">Winrate</span>
                      <span className="mt-0.5 font-mono text-emerald-300">
                        Build: {(scenarioSimResult.summary.winRates.entity1 * 100).toFixed(1)}%
                      </span>
                      <span className="font-mono text-rose-300">
                        Baseline: {(scenarioSimResult.summary.winRates.entity2 * 100).toFixed(1)}%
                      </span>
                      <span className="font-mono text-slate-400">
                        Draws: {(scenarioSimResult.summary.winRates.draws * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 uppercase tracking-[0.2em]">TTK (Turns)</span>
                      <span className="mt-0.5 font-mono text-cyan-300">
                        Avg: {scenarioSimResult.combatStatistics.averageTurns.toFixed(1)}
                      </span>
                      <span className="font-mono text-slate-200">
                        Median: {scenarioSimResult.combatStatistics.medianTurns.toFixed(1)}
                      </span>
                      <span className="font-mono text-slate-400">
                        Range: {scenarioSimResult.combatStatistics.minTurns.toFixed(0)}-
                        {scenarioSimResult.combatStatistics.maxTurns.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 uppercase tracking-[0.2em]">Damage/Overkill</span>
                      <span className="mt-0.5 font-mono text-amber-300">
                        DPT Build: {scenarioSimResult.damageMetrics.entity1.average.toFixed(1)}
                      </span>
                      <span className="font-mono text-amber-200">
                        DPT Base: {scenarioSimResult.damageMetrics.entity2.average.toFixed(1)}
                      </span>
                      <span className="font-mono text-slate-400">
                        Overkill Avg: {scenarioSimResult.damageMetrics.averageOverkill.entity1.toFixed(1)} /
                        {scenarioSimResult.damageMetrics.averageOverkill.entity2.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.22em] md:tracking-[0.26em] text-cyan-300">
                    🎯 Configurazione Scenari
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] md:text-[9px] uppercase tracking-[0.18em] md:tracking-[0.2em] text-slate-500">
                      Duel · Boss · Swarm · 5v5
                    </span>
                    <select
                      className="rounded-full border border-cyan-500/60 bg-slate-950 px-2 py-0.5 text-[8px] md:text-[9px] uppercase tracking-[0.18em] md:tracking-[0.2em] text-cyan-200 hover:border-cyan-400/80"
                      value={selectedEliteId}
                      onChange={(e) => {
                        const value = e.target.value as EliteScenarioId | '';
                        setSelectedEliteId(value);
                        if (value) {
                          handleApplyElitePreset(value);
                        }
                      }}
                    >
                      <option value="">Elite Preset</option>
                      {(Object.values(ELITE_SCENARIOS) as typeof ELITE_SCENARIOS[keyof typeof ELITE_SCENARIOS][]).map(
                        (elite) => (
                          <option key={elite.id} value={elite.id}>
                            {elite.name}
                          </option>
                        ),
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={handleExportScenarios}
                      className="rounded-full border border-cyan-500/60 px-2 py-0.5 text-[8px] md:text-[9px] uppercase tracking-[0.18em] md:tracking-[0.2em] text-cyan-200 hover:bg-cyan-500/10"
                    >
                      Export
                    </button>
                    <label className="cursor-pointer rounded-full border border-cyan-500/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-cyan-200 hover:bg-cyan-500/10">
                      Import
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={handleImportScenarios}
                      />
                    </label>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {(Object.values(scenarioConfigs) as ScenarioConfig[]).map((scenario) => (
                    <ScenarioCard
                      key={scenario.type}
                      config={scenario}
                      onConfigChange={handleScenarioConfigChange}
                      onReset={() =>
                        setScenarioConfigs((prev) => ({
                          ...prev,
                          [scenario.type]: SCENARIO_CONFIGS[scenario.type],
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              {scenarioPowerMap && (
                <div className="mt-3 rounded-xl border border-amber-500/40 bg-slate-900/70 px-4 py-3">
                  <div className="mb-2 flex items-baseline justify-between">
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300">
                      Scenario Power (HP eq)
                    </h3>
                    <span className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
                      Basato sul build corrente
                    </span>
                  </div>
                  <div className="grid gap-2 xs:grid-cols-2 xl:grid-cols-4">
                    {(Object.entries(scenarioConfigs) as Array<[ScenarioType, ScenarioConfig]>).map(
                      ([type, scenario]) => {
                        const power = scenarioPowerMap[type] ?? 0;
                        return (
                          <div
                            key={type}
                            className="rounded-lg border border-amber-500/30 bg-slate-950/70 px-2.5 md:px-3 py-1.5 md:py-2 text-[9px] md:text-[10px]"
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1 truncate text-amber-100">
                                <span aria-hidden>{scenario.icon}</span>
                                <span className="truncate">{scenario.name}</span>
                              </span>
                              <span className="font-mono text-emerald-300">
                                {power.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </>
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
                  <span className="text-[10px] tracking-[0.18em] uppercase truncate max-w-28">{card.title}</span>
                </button>
              ))}
            </div>
          )}

          <div className="observatory-panel min-h-[600px]">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {visibleCards.map((card, idx) => (
                    <React.Fragment key={card.id}>
                      <SortableCard
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
                        onOpenCardEditor={handleOpenExistingCardEditor}
                        onOpenStatEditor={handleOpenStatEditor}
                      />
                      {idx === visibleCards.length - 1 && (
                        <button
                          type="button"
                          onClick={handleAddCard}
                          className="flex items-center justify-center rounded-2xl border border-dashed border-amber-500/50 text-amber-200 text-xl hover:bg-amber-500/5 min-h-[120px]"
                          title="Add Card"
                        >
                          ＋
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                  {visibleCards.length === 0 && (
                    <button
                      type="button"
                      onClick={handleAddCard}
                      className="flex items-center justify-center rounded-2xl border border-dashed border-amber-500/50 text-amber-200 text-xl hover:bg-amber-500/5 min-h-[120px]"
                      title="Add Card"
                    >
                      ＋
                    </button>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>

      {isCardEditorOpen && (
        <CardEditor
          isOpen={isCardEditorOpen}
          onClose={closeCardEditor}
          editingCard={cardEditorMode === 'edit' ? cardEditorCard : undefined}
          onSaveComplete={handleCardEditorSaveComplete}
        />
      )}

      {isStatEditorOpen && statEditorCard && (
        <StatEditor
          isOpen={isStatEditorOpen}
          onClose={closeStatEditor}
          card={statEditorCard}
          editingStat={statEditorStat}
          onSaveComplete={handleStatEditorSaveComplete}
        />
      )}
    </>
  );
};
