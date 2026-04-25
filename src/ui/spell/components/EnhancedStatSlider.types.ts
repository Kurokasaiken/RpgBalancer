import React from 'react';

export interface StatTick {
  value: number;
  weight: number;
}

export interface EnhancedStatSliderBaseProps {
  field: string;
  ticks: StatTick[];
  selectedTick: number;
  onSelectTick: (index: number) => void;
  description: string;
  isMalus: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onStepChange: (index: number, step: StatTick) => void;
  onAddStep: (index: number) => void;
  onRemoveStep: (index: number) => void;
  label?: string;
}

export interface EnhancedStatSliderDraggableProps {
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, field: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, field: string) => void;
}

export type EnhancedStatSliderProps = EnhancedStatSliderBaseProps & EnhancedStatSliderDraggableProps;
