import { describe, it, beforeEach, vi, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerrainModifierTool } from '@/ui/idleVillage/tools/TerrainModifierTool';
import useTerrainModifiers from '@/ui/idleVillage/hooks/useTerrainModifiers';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { UseTerrainModifiersReturn } from '@/ui/idleVillage/hooks/useTerrainModifiers';

vi.mock('@/ui/idleVillage/hooks/useTerrainModifiers', () => {
  return {
    __esModule: true,
    default: vi.fn(),
  };
});

const mockUseTerrainModifiers = useTerrainModifiers as unknown as vi.MockedFunction<
  typeof useTerrainModifiers
>;

const baseHookState = (): UseTerrainModifiersReturn => ({
  loading: false,
  error: null,
  modifiers: [
    {
      id: 'forest_barrier',
      label: 'Forest Barrier',
      description: 'Dense trees',
      slotIds: ['village_gate'],
      effectType: 'risk',
      magnitude: -0.15,
      icon: '🌲',
      color: 'rgba(34, 197, 94, 0.6)',
      intensity: 0.65,
      layerId: 'environment',
      pattern: 'diagonal',
      isEnabled: true,
    },
  ],
  layers: [
    {
      id: 'environment',
      name: 'Environment',
      description: 'Biomes',
      order: 10,
      defaultVisible: true,
      colorHint: '#4c956c',
      visible: true,
    },
  ],
  previews: [
    {
      slotId: 'village_gate',
      slotLabel: 'Village Gate',
      effects: {
        production: 0,
        risk: -0.15,
        safety: 0,
        mobility: 0,
      },
      layers: [
        {
          modifierId: 'forest_barrier',
          label: 'Forest Barrier',
          color: 'rgba(34, 197, 94, 0.6)',
          intensity: 0.65,
          layerId: 'environment',
          layerName: 'Environment',
          visible: true,
          order: 10,
        },
      ],
      position: {
        leftPercent: 40,
        topPercent: 20,
      },
    },
  ],
  hasUnsavedChanges: true,
  addModifier: vi.fn(() => ({
    id: 'new_id',
    label: 'New Modifier',
    description: '',
    slotIds: ['village_square'],
    effectType: 'production',
    magnitude: 0.1,
    icon: '✨',
    color: 'rgba(141, 179, 165, 0.65)',
    intensity: 0.6,
    layerId: 'environment',
    pattern: 'solid',
    isEnabled: true,
  })),
  updateModifier: vi.fn(),
  removeModifier: vi.fn(),
  toggleModifierEnabled: vi.fn(),
  duplicateModifier: vi.fn(),
  toggleLayerVisibility: vi.fn(),
  reorderLayer: vi.fn(),
  resetToDefaults: vi.fn(),
  saveChanges: vi.fn(),
  exportConfig: () => JSON.stringify({}),
  importConfig: vi.fn(),
  getSlotsForModifier: vi.fn(),
});

describe('TerrainModifierTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modifier list and preview summary', () => {
    mockUseTerrainModifiers.mockReturnValue(baseHookState());

    render(<TerrainModifierTool config={DEFAULT_IDLE_VILLAGE_CONFIG} />);

    expect(
      screen.getByRole('heading', { name: /Terrain Modifier Configurator/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Forest Barrier')).toBeInTheDocument();
    expect(screen.getByText(/1 slots/i)).toBeInTheDocument();
  });

  it('invokes addModifier when clicking add button', () => {
    const state = baseHookState();
    mockUseTerrainModifiers.mockReturnValue(state);

    render(<TerrainModifierTool config={DEFAULT_IDLE_VILLAGE_CONFIG} />);

    fireEvent.click(screen.getByRole('button', { name: /\+ Add/i }));
    expect(state.addModifier).toHaveBeenCalledTimes(1);
  });

  it('saves changes when Save button is clicked', () => {
    const state = baseHookState();
    mockUseTerrainModifiers.mockReturnValue(state);

    render(<TerrainModifierTool config={DEFAULT_IDLE_VILLAGE_CONFIG} />);

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    expect(state.saveChanges).toHaveBeenCalledTimes(1);
  });
});
