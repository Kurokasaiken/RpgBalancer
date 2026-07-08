import { createContext } from 'react';
import type { MaterialPreset } from './materialPresets';

/**
 * Provides the active material from the nearest WanderlustSurface ancestor.
 * InsetPanel reads this to inherit the material automatically.
 * Override per-instance with the explicit `material` prop on InsetPanel.
 */
export const WanderlustMaterialContext = createContext<MaterialPreset>('bronze');
