import { z } from 'zod';

/**
 * Layout mode for panels display
 * - 'full': All panels visible
 * - 'strip': Only active panel visible
 * - 'grid': Grid of minimized panels
 */
export type LayoutMode = 'full' | 'strip' | 'grid';

/**
 * Panel position in viewport
 */
export interface PanelPosition {
  x: number;
  y: number;
}

/**
 * Panel size
 */
export interface PanelSize {
  width: number;
  height: number;
}

/**
 * Panel data structure
 */
export interface Panel {
  id: string;
  title: string;
  content?: React.ReactNode;
  position: PanelPosition;
  size: PanelSize;
  isVisible: boolean;
  isMinimized: boolean;
  zIndex: number;
}

/**
 * Panel state structure
 */
export interface PanelState {
  panels: Record<string, Panel>;
  activePanelId: string | null;
  layoutMode: LayoutMode;
  zIndexCounter: number;
}

/**
 * Panel store actions
 */
export interface PanelsStoreActions {
  // CRUD operations
  addPanel: (panel: Omit<Panel, 'zIndex'>) => void;
  removePanel: (panelId: string) => void;
  updatePanel: (panelId: string, updates: Partial<Panel>) => void;
  
  // Visibility and state
  setActivePanel: (panelId: string | null) => void;
  togglePanel: (panelId: string) => void;
  minimizePanel: (panelId: string) => void;
  maximizePanel: (panelId: string) => void;
  
  // Layout
  setLayoutMode: (mode: LayoutMode) => void;
  reorderPanels: (panelIds: string[]) => void;
  
  // Position and size
  movePanel: (panelId: string, position: PanelPosition) => void;
  resizePanel: (panelId: string, size: PanelSize) => void;
  
  // Bulk operations
  resetPanels: () => void;
  
  // Persistence operations
  saveState: () => Promise<void>;
  loadState: () => Promise<void>;
  clearState: () => Promise<void>;
}

/**
 * Full panel store type
 */
export type PanelsStore = PanelState & PanelsStoreActions;

// Zod schemas for validation

/**
 * Zod schema for PanelPosition
 */
export const PanelPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/**
 * Zod schema for PanelSize
 */
export const PanelSizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

/**
 * Zod schema for Panel
 */
export const PanelSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.any().optional(),
  position: PanelPositionSchema,
  size: PanelSizeSchema,
  isVisible: z.boolean(),
  isMinimized: z.boolean(),
  zIndex: z.number().int().nonnegative(),
});

/**
 * Zod schema for LayoutMode
 */
export const LayoutModeSchema = z.enum(['full', 'strip', 'grid']);

/**
 * Zod schema for PanelState
 */
export const PanelStateSchema = z.object({
  panels: z.record(PanelSchema),
  activePanelId: z.string().nullable(),
  layoutMode: LayoutModeSchema,
  zIndexCounter: z.number().int().nonnegative(),
});

/**
 * Default panel position
 */
export const DEFAULT_PANEL_POSITION: PanelPosition = { x: 100, y: 100 };

/**
 * Default panel size
 */
export const DEFAULT_PANEL_SIZE: PanelSize = { width: 400, height: 300 };

/**
 * Default layout mode
 */
export const DEFAULT_LAYOUT_MODE: LayoutMode = 'full';

/**
 * Create a default panel with minimal required fields
 */
export function createDefaultPanel(
  id: string,
  title: string,
  overrides?: Partial<Omit<Panel, 'id' | 'title'>>
): Panel {
  return {
    id,
    title,
    position: DEFAULT_PANEL_POSITION,
    size: DEFAULT_PANEL_SIZE,
    isVisible: true,
    isMinimized: false,
    zIndex: 0,
    ...overrides,
  };
}
