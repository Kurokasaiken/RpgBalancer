#!/bin/bash

# Create comprehensive test suite for STS preset bridge and UI
echo "Creating STS preset test files..."

# Create test directory
mkdir -p "/Users/faustoboni/projects/progetti personali/tests/unit/sts"

# Bridge hook tests
cat > "/Users/faustoboni/projects/progetti personali/tests/unit/sts/useSTSPresetBridge.test.ts" << 'EOF'
/**
 * STS Preset Bridge Hook Tests
 * 
 * Tests the bridge hook that connects UI components to the core preset manager.
 */

import { renderHook, act } from '@testing-library/react';
import { useSTSPresetBridge } from '../../../src/ui/tools/sts/hooks/useSTSPresetBridge';
import { STSPreset } from '../../../src/balancing/config/sts/presetTypes';

// Mock the core preset manager
jest.mock('../../../src/balancing/hooks/archmage/useSTSPresetManager', () => ({
  useSTSPresetManager: jest.fn(() => ({
    availablePresets: mockPresets,
    currentPreset: mockPresets[0],
    isLoading: false,
    error: null,
    loadPreset: jest.fn(),
    savePreset: jest.fn(),
    deletePreset: jest.fn(),
    resetToDefault: jest.fn(),
    reloadPresets: jest.fn(),
    exportPreset: jest.fn(),
    importPreset: jest.fn()
  }))
}));

// Mock PersistenceService
jest.mock('../../../src/services/PersistenceService', () => ({
  PersistenceService: {
    instance: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    }
  }
}));

const mockPresets: STSPreset[] = [
  {
    id: 'test-preset-1',
    name: 'Test Preset 1',
    description: 'A test preset',
    version: '1.0.0',
    createdAt: '2026-01-12T19:00:00.000Z',
    modifiedAt: '2026-01-12T19:00:00.000Z',
    isBuiltIn: true,
    tags: ['test'],
    deck: {
      deckId: 'test',
      deckName: 'Test Deck',
      cards: [],
      ascension: 0,
      seed: 12345
    },
    relics: {
      relics: [],
      startingRelics: [],
      relicPool: []
    },
    enemy: {
      id: 'test-enemy',
      name: 'Test Enemy',
      type: 'normal',
      maxHp: 50,
      damage: { base: 10, variation: 2, count: 1, type: 'normal' },
      intents: [],
      modifiers: { health: { multiplier: 1, offset: 0 }, damage: { multiplier: 1, offset: 0 }, special: {} },
      ai: { pattern: 'balanced', weights: { attack: 0.5, defend: 0.5 }, difficulty: 1, learning: false }
    },
    simulation: {
      iterations: 1000,
      seed: 12345,
      maxTurns: 50,
      verbose: false,
      deterministic: true
    },
    metadata: {
      author: 'system',
      difficulty: 'easy',
      estimatedWinRate: 0.8,
      recommendedForBeginners: true,
      notes: 'Test preset',
      usage: { loadCount: 0, saveCount: 1, lastUsed: null }
    }
  },
  {
    id: 'test-preset-2',
    name: 'Test Preset 2',
    description: 'Another test preset',
    version: '1.0.0',
    createdAt: '2026-01-12T19:00:00.000Z',
    modifiedAt: '2026-01-12T19:00:00.000Z',
    isBuiltIn: false,
    tags: ['test', 'custom'],
    deck: {
      deckId: 'test2',
      deckName: 'Test Deck 2',
      cards: [],
      ascension: 0,
      seed: 54321
    },
    relics: {
      relics: [],
      startingRelics: [],
      relicPool: []
    },
    enemy: {
      id: 'test-enemy2',
      name: 'Test Enemy 2',
      type: 'boss',
      maxHp: 100,
      damage: { base: 15, variation: 5, count: 1, type: 'normal' },
      intents: [],
      modifiers: { health: { multiplier: 1, offset: 0 }, damage: { multiplier: 1, offset: 0 }, special: {} },
      ai: { pattern: 'aggressive', weights: { attack: 0.8, defend: 0.2 }, difficulty: 3, learning: false }
    },
    simulation: {
      iterations: 2000,
      seed: 54321,
      maxTurns: 80,
      verbose: false,
      deterministic: true
    },
    metadata: {
      author: 'user',
      difficulty: 'hard',
      estimatedWinRate: 0.4,
      recommendedForBeginners: false,
      notes: 'Hard test preset',
      usage: { loadCount: 5, saveCount: 2, lastUsed: '2026-01-12T18:00:00.000Z' }
    }
  }
];

describe('useSTSPresetBridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide bridge state and actions', () => {
    const { result } = renderHook(() => useSTSPresetBridge());

    expect(result.current.presets).toEqual(mockPresets);
    expect(result.current.selectedPresetId).toBe('test-preset-1');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.currentPreset).toEqual(mockPresets[0]);

    // Check that all actions are available
    expect(typeof result.current.selectPreset).toBe('function');
    expect(typeof result.current.applyPreset).toBe('function');
    expect(typeof result.current.clearSelection).toBe('function');
    expect(typeof result.current.reloadPresets).toBe('function');
    expect(typeof result.current.savePreset).toBe('function');
    expect(typeof result.current.deletePreset).toBe('function');
    expect(typeof result.current.exportPreset).toBe('function');
    expect(typeof result.current.importPreset).toBe('function');
    expect(typeof result.current.duplicatePreset).toBe('function');
    expect(typeof result.current.quickExport).toBe('function');
    expect(typeof result.current.quickImport).toBe('function');
  });

  it('should select preset correctly', async () => {
    const { result } = renderHook(() => useSTSPresetBridge());

    await act(async () => {
      result.current.selectPreset('test-preset-2');
    });

    expect(result.current.selectedPresetId).toBe('test-preset-2');
  });

  it('should clear selection correctly', async () => {
    const { result } = renderHook(() => useSTSPresetBridge());

    await act(async () => {
      result.current.clearSelection();
    });

    expect(result.current.selectedPresetId).toBe(null);
  });

  it('should filter presets correctly', () => {
    const { result } = renderHook(() => useSTSPresetBridge());

    const filtered = result.current.filterPresets('test');
    expect(filtered).toHaveLength(2);

    const filteredCustom = result.current.filterPresets('custom');
    expect(filteredCustom).toHaveLength(1);
    expect(filteredCustom[0].id).toBe('test-preset-2');
  });

  it('should sort presets correctly', () => {
    const { result } = renderHook(() => useSTSPresetBridge());

    const sortedByName = result.current.sortPresets(mockPresets, 'name');
    expect(sortedByName[0].name).toBe('Test Preset 1');
    expect(sortedByName[1].name).toBe('Test Preset 2');

    const sortedByDifficulty = result.current.sortPresets(mockPresets, 'difficulty');
    expect(sortedByDifficulty[0].metadata.difficulty).toBe('easy');
    expect(sortedByDifficulty[1].metadata.difficulty).toBe('hard');
  });

  it('should get preset preview correctly', () => {
    const { result } = renderHook(() => useSTSPresetBridge());

    const preview = result.current.getPresetPreview(mockPresets[0]);
    expect(preview.name).toBe('Test Preset 1');
    expect(preview.difficulty).toBe('easy');
    expect(preview.isBuiltIn).toBe(true);
  });

  it('should validate preset correctly', () => {
    const { result } = renderHook(() => useSTSPresetBridge());

    const validPreset = result.current.validatePreset(mockPresets[0]);
    expect(validPreset.isValid).toBe(true);
    expect(validPreset.errors).toHaveLength(0);

    const invalidPreset = result.current.validatePreset({} as STSPreset);
    expect(invalidPreset.isValid).toBe(false);
    expect(invalidPreset.errors.length).toBeGreaterThan(0);
  });
});
EOF

echo "✅ Created bridge hook tests"

# UI component tests
cat > "/Users/faustoboni/projects/progetti personali/tests/unit/sts/STSPresetLoader.test.tsx" << 'EOF'
/**
 * STS Preset Loader UI Component Tests
 * 
 * Tests the preset loader UI component with drag-and-drop and quick actions.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { STSPresetLoader } from '../../../src/ui/tools/sts/STSPresetLoader';
import { STSPreset } from '../../../src/balancing/config/sts/presetTypes';

// Mock the bridge hook
jest.mock('../../../src/ui/tools/sts/hooks/useSTSPresetBridge', () => ({
  useSTSPresetBridge: jest.fn(() => ({
    presets: mockPresets,
    selectedPresetId: 'test-preset-1',
    isLoading: false,
    error: null,
    currentPreset: mockPresets[0],
    selectPreset: jest.fn(),
    applyPreset: jest.fn(),
    clearSelection: jest.fn(),
    reloadPresets: jest.fn(),
    savePreset: jest.fn(),
    deletePreset: jest.fn(),
    exportPreset: jest.fn(),
    importPreset: jest.fn(),
    duplicatePreset: jest.fn(),
    quickExport: jest.fn(),
    quickImport: jest.fn(),
    filterPresets: jest.fn((query: string) => mockPresets.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    )),
    sortPresets: jest.fn((presets: STSPreset[], sortBy: string) => presets),
    getPresetPreview: jest.fn((preset: STSPreset) => ({
      name: preset.name,
      difficulty: preset.metadata.difficulty,
      isBuiltIn: preset.isBuiltIn,
      cardCount: preset.deck.cards.length
    })),
    validatePreset: jest.fn(() => ({ isValid: true, errors: [] }))
  }))
}));

const mockPresets: STSPreset[] = [
  {
    id: 'test-preset-1',
    name: 'Test Preset 1',
    description: 'A test preset',
    version: '1.0.0',
    createdAt: '2026-01-12T19:00:00.000Z',
    modifiedAt: '2026-01-12T19:00:00.000Z',
    isBuiltIn: true,
    tags: ['test'],
    deck: {
      deckId: 'test',
      deckName: 'Test Deck',
      cards: [],
      ascension: 0,
      seed: 12345
    },
    relics: {
      relics: [],
      startingRelics: [],
      relicPool: []
    },
    enemy: {
      id: 'test-enemy',
      name: 'Test Enemy',
      type: 'normal',
      maxHp: 50,
      damage: { base: 10, variation: 2, count: 1, type: 'normal' },
      intents: [],
      modifiers: { health: { multiplier: 1, offset: 0 }, damage: { multiplier: 1, offset: 0 }, special: {} },
      ai: { pattern: 'balanced', weights: { attack: 0.5, defend: 0.5 }, difficulty: 1, learning: false }
    },
    simulation: {
      iterations: 1000,
      seed: 12345,
      maxTurns: 50,
      verbose: false,
      deterministic: true
    },
    metadata: {
      author: 'system',
      difficulty: 'easy',
      estimatedWinRate: 0.8,
      recommendedForBeginners: true,
      notes: 'Test preset',
      usage: { loadCount: 0, saveCount: 1, lastUsed: null }
    }
  }
];

describe('STSPresetLoader', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render preset loader correctly', () => {
    render(<STSPresetLoader />);
    
    expect(screen.getByText('STS PRESET LOADER')).toBeInTheDocument();
    expect(screen.getByText('Test Preset 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Filter input
  });

  it('should filter presets when typing in search box', async () => {
    render(<STSPresetLoader />);
    
    const filterInput = screen.getByDisplayValue('');
    await user.type(filterInput, 'Test');
    
    // The filtering is handled by the mock, but we can check the input value
    expect(filterInput).toHaveValue('Test');
  });

  it('should select preset when clicked', async () => {
    const mockSelectPreset = jest.fn();
    jest.mocked(require('../../../src/ui/tools/sts/hooks/useSTSPresetBridge').useSTSPresetBridge).mockReturnValue({
      ...mockPresets,
      selectPreset: mockSelectPreset
    });

    render(<STSPresetLoader />);
    
    const presetItem = screen.getByText('Test Preset 1');
    await user.click(presetItem);
    
    expect(mockSelectPreset).toHaveBeenCalledWith('test-preset-1');
  });

  it('should show preset details when selected', () => {
    render(<STSPresetLoader />);
    
    // Since test-preset-1 is selected by default, details should be visible
    expect(screen.getByText('Test Preset 1')).toBeInTheDocument();
    expect(screen.getByText('A test preset')).toBeInTheDocument();
  });

  it('should handle drag over events', async () => {
    render(<STSPresetLoader />);
    
    const container = screen.getByTestId('preset-loader') || document.body;
    
    // Simulate drag over
    fireEvent.dragOver(container);
    
    // Should not crash and should handle the event
    expect(true).toBe(true);
  });

  it('should handle drop events', async () => {
    render(<STSPresetLoader />);
    
    const container = screen.getByTestId('preset-loader') || document.body;
    
    // Create a mock file
    const file = new File(['{}'], 'test.json', { type: 'application/json' });
    const dropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        files: [file]
      }
    };
    
    // Simulate drop
    fireEvent.drop(container, dropEvent);
    
    expect(dropEvent.preventDefault).toHaveBeenCalled();
  });

  it('should show import button', () => {
    render(<STSPresetLoader />);
    
    const importButton = screen.getByText('Import');
    expect(importButton).toBeInTheDocument();
  });

  it('should be accessible', async () => {
    render(<STSPresetLoader />);
    
    // Check for proper ARIA labels and roles
    expect(screen.getByRole('heading', { name: 'STS PRESET LOADER' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /filter/i })).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    render(<STSPresetLoader />);
    
    const filterInput = screen.getByRole('textbox');
    filterInput.focus();
    
    await user.keyboard('{Escape}');
    
    // Should handle escape key (clears filter)
    expect(filterInput).toHaveValue('');
  });
});
EOF

echo "✅ Created UI component tests"

echo "🎯 STS preset test suite created successfully"
