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
  removeStatStep
}) => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 mb-4">
    {/* Core Stats */}
    {coreStats.map(field => (
      <EnhancedStatSlider
        key={field}
        field={field}
        steps={getStatSteps(field)}
        description={getStatDescription(field)}
        isMalus={isMalus(field)}
        collapsed={collapsedStats.has(field)}
        onToggleCollapse={() => toggleCollapse(field)}
        onStepChange={(idx: number, step: { value: number; weight: number }) => updateStatStep(field, idx, step)}
        onAddStep={(idx: number) => addStatStep(field, idx)}
        onRemoveStep={(idx: number) => removeStatStep(field, idx)}
      />
    ))}
    {/* Advanced Stats */}
    {advancedStats.map(field => (
      <EnhancedStatSlider
        key={field}
        field={field}
        steps={getStatSteps(field)}
        description={getStatDescription(field)}
        isMalus={isMalus(field)}
        collapsed={collapsedStats.has(field)}
        onToggleCollapse={() => toggleCollapse(field)}
        onStepChange={(idx: number, step: { value: number; weight: number }) => updateStatStep(field, idx, step)}
        onAddStep={(idx: number) => addStatStep(field, idx)}
        onRemoveStep={(idx: number) => removeStatStep(field, idx)}
      />
    ))}
    {/* Optional Stats: collassate di default */}
    {optionalStats.map(field => (
      <EnhancedStatSlider
        key={field}
        field={field}
        steps={getStatSteps(field)}
        description={getStatDescription(field)}
        isMalus={isMalus(field)}
        collapsed={collapsedStats.has(field) || true}
        onToggleCollapse={() => toggleCollapse(field)}
        onStepChange={(idx: number, step: { value: number; weight: number }) => updateStatStep(field, idx, step)}
        onAddStep={(idx: number) => addStatStep(field, idx)}
        onRemoveStep={(idx: number) => removeStatStep(field, idx)}
      />
    ))}
  </div>
);
