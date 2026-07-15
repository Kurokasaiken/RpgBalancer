import type { DragEvent } from 'react';

/**
 * Represents a single tick in the stat slider
 */
export interface StatTick {
  value: number;
  weight: number;
}

/**
 * Base props for EnhancedStatSlider component
 */
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

/**
 * Drag and drop props for EnhancedStatSlider component
 */
export interface EnhancedStatSliderDraggableProps {
  draggable?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>, field: string) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>, field: string) => void;
}

/**
 * Combined props for EnhancedStatSlider component
 */
export type EnhancedStatSliderProps = EnhancedStatSliderBaseProps & EnhancedStatSliderDraggableProps;
