import type { DragEvent } from 'react';

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
  onDragStart?: (e: DragEvent<HTMLDivElement>, field: string) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>, field: string) => void;
}

export type EnhancedStatSliderProps = EnhancedStatSliderBaseProps & EnhancedStatSliderDraggableProps;
