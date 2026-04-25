import { createContext } from 'react';
import type { DensityContextType } from './DensityContext';

/**
 * Density context instance
 */
export const DensityContext = createContext<DensityContextType | undefined>(undefined);
