import React from 'react';
import { EnhancedStatSlider } from './EnhancedStatSlider';
import type { Spell } from '../../../balancing/spellTypes';

interface StatsGridProps {
  coreStats: string[];
  advancedStats: string[];
  optionalStats: string[];
  getStatDescription: (field: string) => string;
  isMalus: (field: string) => boolean;
  collapsedStats: Set<string>;
  toggleCollapse: (field: string) => void;
  getStatSteps: (field: string) => Array<{ value: number; weight: number }>;
  updateStatStep: (field: string, idx: number, step: { value: number; weight: number }) => void;
  addStatStep: (field: string, idx: number) => void;
  removeStatStep: (field: string, idx: number) => void;
  selectedTicks: Record<string, number>;
  onSelectTick: (field: string, idx: number) => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  coreStats,
  advancedStats,
  optionalStats,
  getStatDescription,
  isMalus,
  collapsedStats,
  toggleCollapse,
  getStatSteps,
  updateStatStep,
  addStatStep,
  removeStatStep,
  selectedTicks,
  onSelectTick
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
      {[...coreStats, ...advancedStats, ...optionalStats].map(field => (
        <EnhancedStatSlider
          key={field}
          field={field}
          steps={getStatSteps(field)}
          selectedTick={selectedTicks[field] !== undefined ? selectedTicks[field] : 0}
          onSelectTick={(idx) => onSelectTick(field, idx)}
          description={getStatDescription(field)}
          isMalus={isMalus(field)}
          collapsed={collapsedStats.has(field)}
          onToggleCollapse={() => toggleCollapse(field)}
          onStepChange={(idx: number, step: { value: number; weight: number }) => updateStatStep(field, idx, step)}
          onAddStep={(idx: number) => addStatStep(field, idx)}
          onRemoveStep={(idx: number) => removeStatStep(field, idx)}
        />
      ))}
    </div>
  );
};
