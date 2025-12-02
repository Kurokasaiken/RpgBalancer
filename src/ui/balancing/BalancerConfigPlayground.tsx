import React, { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardDefinition, StatDefinition } from '../../balancing/config/types';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';
import { ConfigToolbar } from './ConfigToolbar';
import { ConfigurableCard } from './ConfigurableCard';
import { CardWrapper } from '../components/CardWrapper';
import { SmartInput } from '../components/SmartInput';
import { GildedCardWrapper } from './GildedCardWrapper';
import { GildedSmartInput } from './GildedSmartInput';
import type { LockedParameter, StatBlock } from '../../balancing/types';
import { BalancingSolver } from '../../balancing/solver';
import { DEFAULT_STATS } from '../../balancing/types';

// === ORIGINAL CORE CARD (from FantasyBalancer) ===
const OriginalCoreCard: React.FC = () => {
  const [stats, setStats] = useState<StatBlock>(() => BalancingSolver.recalculate(DEFAULT_STATS));
  const [lockedParam, setLockedParam] = useState<LockedParameter>('none');

  const handleParamChange = (param: keyof StatBlock, value: number) => {
    const newStats = BalancingSolver.solve(stats, param, value, lockedParam);
    setStats(newStats);
  };

  const handleReset = () => {
    setStats(BalancingSolver.recalculate(DEFAULT_STATS));
    setLockedParam('none');
  };

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Original (CardWrapper + SmartInput)</p>
      <CardWrapper title="Core" color="text-blue-400" onReset={handleReset}>
        <div className="space-y-2">
          <SmartInput
            paramId="hp"
            value={stats.hp}
            onChange={(v) => handleParamChange('hp', v)}
            onReset={() => handleParamChange('hp', DEFAULT_STATS.hp)}
            lockedParam={lockedParam}
            onLockToggle={setLockedParam}
            min={10}
            max={1000}
            step={10}
          />
          <SmartInput
            paramId="damage"
            value={stats.damage}
            onChange={(v) => handleParamChange('damage', v)}
            onReset={() => handleParamChange('damage', DEFAULT_STATS.damage)}
            lockedParam={lockedParam}
            onLockToggle={setLockedParam}
            min={1}
            max={200}
            step={1}
          />
          <SmartInput
            paramId="htk"
            value={stats.htk}
            onChange={(v) => handleParamChange('htk', v)}
            onReset={() => handleParamChange('htk', DEFAULT_STATS.htk)}
            lockedParam={lockedParam}
            onLockToggle={setLockedParam}
            min={1}
            max={20}
            step={0.1}
            bgColor="bg-orange-500/10"
          />
        </div>
      </CardWrapper>
    </div>
  );
};

// === GILDED OBSERVATORY CORE CARD ===
const GildedCoreCard: React.FC = () => {
  const [stats, setStats] = useState<StatBlock>(() => BalancingSolver.recalculate(DEFAULT_STATS));
  const [lockedParam, setLockedParam] = useState<LockedParameter>('none');
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editingStatId, setEditingStatId] = useState<string | null>(null);

  const handleParamChange = (param: keyof StatBlock, value: number) => {
    const newStats = BalancingSolver.solve(stats, param, value, lockedParam);
    setStats(newStats);
  };

  const handleLockToggle = (param: LockedParameter) => {
    setLockedParam(lockedParam === param ? 'none' : param);
  };

  const handleReset = () => {
    setStats(BalancingSolver.recalculate(DEFAULT_STATS));
    setLockedParam('none');
  };

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-amber-500/70 mb-2">Gilded Observatory (new theme)</p>
      <GildedCardWrapper
        title="Core"
        color="text-amber-300"
        icon="⚔️"
        onReset={handleReset}
        onEdit={() => setIsEditingCard(!isEditingCard)}
        isEditing={isEditingCard}
      >
        <div className="space-y-2">
          <GildedSmartInput
            label="HP"
            value={stats.hp}
            onChange={(v) => handleParamChange('hp', v)}
            onReset={() => handleParamChange('hp', DEFAULT_STATS.hp)}
            onLockToggle={() => handleLockToggle('hp')}
            isLocked={lockedParam === 'hp'}
            onEdit={() => setEditingStatId(editingStatId === 'hp' ? null : 'hp')}
            isEditing={editingStatId === 'hp'}
            min={10}
            max={1000}
            step={10}
            description="Health Points - Total health of the unit"
          />
          <GildedSmartInput
            label="Damage"
            value={stats.damage}
            onChange={(v) => handleParamChange('damage', v)}
            onReset={() => handleParamChange('damage', DEFAULT_STATS.damage)}
            onLockToggle={() => handleLockToggle('damage')}
            isLocked={lockedParam === 'damage'}
            onEdit={() => setEditingStatId(editingStatId === 'damage' ? null : 'damage')}
            isEditing={editingStatId === 'damage'}
            min={1}
            max={200}
            step={1}
            description="Base damage per attack"
          />
          <GildedSmartInput
            label="HTK"
            value={stats.htk}
            onChange={(v) => handleParamChange('htk', v)}
            onReset={() => handleParamChange('htk', DEFAULT_STATS.htk)}
            onLockToggle={() => handleLockToggle('htk')}
            isLocked={lockedParam === 'htk'}
            onEdit={() => setEditingStatId(editingStatId === 'htk' ? null : 'htk')}
            isEditing={editingStatId === 'htk'}
            min={1}
            max={20}
            step={0.1}
            bgColor="bg-amber-500/10"
            description="Hits to Kill - Number of hits needed to defeat"
          />
        </div>
      </GildedCardWrapper>
    </div>
  );
};

interface SortableCardProps {
  card: CardDefinition;
  stats: Record<string, StatDefinition>;
  onClickAddStat: (card: CardDefinition) => void;
  onEditStat: (statId: string, updates: Partial<StatDefinition>) => void;
  onDeleteStat: (statId: string) => void;
  newStatId?: string;
  onUpdateCard: (updates: Partial<CardDefinition>) => void;
  onDeleteCard: () => void;
  startHeaderInEdit?: boolean;
  availableStats: string[];
}

const SortableCard: React.FC<SortableCardProps> = ({ card, stats, onClickAddStat, onEditStat, onDeleteStat, newStatId, onUpdateCard, onDeleteCard, startHeaderInEdit, availableStats }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ConfigurableCard
        card={card}
        stats={stats}
        onEditStat={onEditStat}
        onDeleteStat={onDeleteStat}
        newStatId={newStatId}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
        startHeaderInEdit={startHeaderInEdit}
        availableStats={availableStats}
        dragListeners={listeners}
      />
      <button
        type="button"
        className="mt-1 w-full text-[11px] px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
        onClick={() => onClickAddStat(card)}
      >
        + Add Stat
      </button>
    </div>
  );
};

export const BalancerConfigPlayground: React.FC = () => {
  const { config, reorderCards, updateStat, deleteStat, addCard, addStat, updateCard, deleteCard } = useBalancerConfig();

  const [lastCreatedStatId, setLastCreatedStatId] = useState<string | null>(null);
  const [lastCreatedCardId, setLastCreatedCardId] = useState<string | null>(null);

  const cards = Object.values(config.cards).sort((a, b) => a.order - b.order);
  const allStatIds = Object.keys(config.stats);

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
    const result = addCard({ id, title: 'New Card', color: 'text-blue-400', icon: '🂠' });
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
    <div className="h-full overflow-y-auto p-4 bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto">
        <header className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Config-Driven System</p>
            <h1 className="text-2xl font-semibold text-slate-50 mt-1">Balancer Config Playground</h1>
            <p className="text-xs text-slate-400 mt-1">
              Editor sperimentale per card e stat del Balancer. Usa la nuova configurazione JSON + Zod + localStorage.
            </p>
          </div>
        </header>

        <ConfigToolbar />

        {/* === COMPARISON: Original vs Gilded Observatory === */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-amber-300 mb-3">Card Comparison: Original vs Gilded Observatory</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Original CardWrapper + SmartInput */}
            <OriginalCoreCard />

            {/* Gilded Observatory version */}
            <GildedCoreCard />
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent my-6" />

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  stats={config.stats}
                  onClickAddStat={handleAddStat}
                  onEditStat={(statId, updates) => updateStat(statId, updates)}
                  onDeleteStat={(statId) => { deleteStat(statId); }}
                  newStatId={lastCreatedStatId ?? undefined}
                  onUpdateCard={(updates) => { updateCard(card.id, updates); }}
                  onDeleteCard={() => { deleteCard(card.id); }}
                  startHeaderInEdit={card.id === lastCreatedCardId}
                  availableStats={allStatIds}
                />
              ))}
              <button
                type="button"
                onClick={handleAddCard}
                className="flex items-center justify-center rounded-xl border border-dashed border-amber-500/60 text-amber-300 text-xl hover:bg-amber-500/10 min-h-[72px]"
                title="Add Card"
              >
                +
              </button>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
