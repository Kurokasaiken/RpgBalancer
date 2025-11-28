import React from 'react';
import { EnhancedStatSlider } from './EnhancedStatSlider';

interface StatsGridProps {
  statOrder: string[];
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
  onDragStart: (e: React.DragEvent, field: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, field: string) => void;
  renderDerivedStats?: (field: string, currentValue: number, onUpdate: (newValue: number) => void) => React.ReactNode;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  statOrder,
  getStatDescription,
  isMalus,
  collapsedStats,
  toggleCollapse,
  getStatSteps,
  updateStatStep,
  addStatStep,
  removeStatStep,
  selectedTicks,
  onSelectTick,
  onDragStart,
  onDragOver,
  onDrop,
  renderDerivedStats
}) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {statOrder.map(field => (
        <EnhancedStatSlider
          key={field}
          field={field}
          ticks={getStatSteps(field)}
          selectedTick={selectedTicks[field] || 0}
          onSelectTick={(idx) => onSelectTick(field, idx)}
          description={getStatDescription(field)}
          isMalus={isMalus(field)}
          collapsed={collapsedStats.has(field)}
          onToggleCollapse={() => toggleCollapse(field)}
          onStepChange={(idx, step) => updateStatStep(field, idx, step)}
          onAddStep={(idx) => addStatStep(field, idx)}
          onRemoveStep={(idx) => removeStatStep(field, idx)}
          draggable={true}
          onDragStart={(e) => onDragStart(e, field)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, field)}
          renderDerivedStats={renderDerivedStats ? (val) => renderDerivedStats(field, val, (newVal) => {
            // Find current tick index
            const currentIdx = selectedTicks[field] || 0;
            // Create updated step
            const currentSteps = getStatSteps(field);
            const currentStep = currentSteps[currentIdx];
            const updatedStep = { ...currentStep, value: newVal };
            // Update
            updateStatStep(field, currentIdx, updatedStep);
          }) : undefined}
        />
      ))}
    </div>
  );
};
