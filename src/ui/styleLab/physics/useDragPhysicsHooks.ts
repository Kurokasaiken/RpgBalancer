/**
 * Drag Physics Hooks - Export-only functions for fast refresh compliance
 * 
 * This file contains hook exports that were moved from DragPhysicsContext.tsx
 * to comply with React fast refresh rules (only component exports).
 */

import { useContext } from 'react';
import { DragPhysicsContext } from './DragPhysicsContext';
import {
  DRAG_PHYSICS_PRESETS,
  type DragPhysicsConfig,
  type DragPhysicsPresetKey,
} from './dragPhysicsPresets';

export type { DragPhysicsContextValue, DragPhysicsConfig, DragPhysicsPresetKey } from './DragPhysicsContext';

/**
 * useDragPhysics - Full context access with setPreset
 * 
 * Use this in components that need to change presets or access full context.
 * Must be used inside <DragPhysicsProvider>.
 */
export const useDragPhysics = (): DragPhysicsContextValue => {
  const ctx = useContext(DragPhysicsContext);
  if (!ctx) {
    throw new Error(
      'useDragPhysics deve essere usato dentro <DragPhysicsProvider>.\n' +
      'Aggiungi <DragPhysicsProvider> sopra <DndContext> nell\'app shell.',
    );
  }
  return ctx;
};

/**
 * useDragPhysicsConfig - Read-only config access
 * 
 * Use this in visual components (Ghost, Shadow) that only need config.
 * Lighter than useDragPhysics - no setPreset access.
 */
export const useDragPhysicsConfig = (): DragPhysicsConfig => {
  return useDragPhysics().config;
};
