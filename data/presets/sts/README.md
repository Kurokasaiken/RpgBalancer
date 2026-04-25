# STS Preset Management System

## Overview

The STS (Slay the Spire) Preset Management System provides a comprehensive solution for creating, managing, and sharing simulation presets. This system follows the RPG Balancer philosophy with config-first design, proper type safety, and comprehensive testing.

## Architecture

### Core Components

1. **useSTSPresetManager** - Core preset management logic
2. **useSTSPresetBridge** - UI bridge hook with additional functionality
3. **STSPresetLoader** - Retro-styled UI component
4. **CLI Export Tool** - Command-line preset export utility
5. **Preset Repository** - Built-in and custom preset collection

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Components │───▶│  Bridge Hook     │───▶│ Core Manager    │
│   (STSPreset    │    │ (useSTSPreset    │    │ (useSTSPreset   │
│    Loader)      │    │  Bridge)         │    │  Manager)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Actions   │    │   UI Logic       │    │   Storage       │
│   - Click       │    │   - Filtering    │    │   - Persistence │
│   - Drag/Drop   │    │   - Sorting      │    │   - Telemetry   │
│   - Import      │    │   - Validation   │    │   - Config      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Features

### Preset Management
- **Load Presets**: Built-in and custom presets from JSON files
- **Save Presets**: User-created presets with metadata
- **Delete Presets**: Remove custom presets (built-ins are protected)
- **Duplicate Presets**: Create copies with modified names
- **Export/Import**: Share presets via JSON files

### UI Features
- **Retro Terminal Theme**: C64-inspired styling with monospace fonts
- **Drag-and-Drop Import**: Drop JSON files to import presets
- **Quick Actions**: Apply, Duplicate, Export, Delete buttons per preset
- **ASCII Preview**: Visual representation of preset configuration
- **Filtering & Sorting**: Search and organize presets
- **Accessibility**: Full ARIA support and keyboard navigation

### CLI Tools
- **Export Script**: Convert simulation runs to presets
- **Validation**: Ensure preset schema compliance
- **Batch Operations**: Process multiple presets

## File Structure

```
src/
├── balancing/
│   ├── hooks/archmage/
│   │   └── useSTSPresetManager.ts          # Core preset manager
│   └── config/sts/
│       ├── presetTypes.ts                   # Type definitions
│       └── presets.json                     # Built-in preset config
├── ui/tools/sts/
│   ├── hooks/
│   │   └── useSTSPresetBridge.ts            # UI bridge hook
│   ├── STSPresetLoader.tsx                  # Main UI component
│   ├── STSPresetLoader.module.css           # Retro styling
│   └── types.ts                             # UI-specific types
├── services/
│   └── PersistenceService.ts                # Storage backend
└── analytics/
    └── telemetry.ts                         # Event tracking

data/presets/sts/
├── starter_ironclad.json                    # Ironclad starter preset
├── starter_silent.json                      # Silent starter preset
├── starter_defect.json                      # Defect starter preset
├── boss_guardian.json                        # Guardian boss preset
└── tutorial_basic.json                      # Tutorial preset

scripts/sts/
├── exportPreset.ts                          # CLI export tool
└── export-preset.sh                         # Shell wrapper

tests/unit/sts/
├── useSTSPresetBridge.test.ts               # Bridge hook tests
└── STSPresetLoader.test.tsx                 # UI component tests
```

## Usage

### Basic Usage

```typescript
import { useSTSPresetBridge } from './hooks/useSTSPresetBridge';

function MyComponent() {
  const {
    presets,
    selectedPresetId,
    selectPreset,
    applyPreset,
    duplicatePreset,
    quickExport,
    quickImport
  } = useSTSPresetBridge();

  return (
    <STSPresetLoader />
  );
}
```

### CLI Export

```bash
# Export a simulation run as preset
node scripts/sts/exportPreset.ts run_12345 my_preset.json

# Or use the shell wrapper
./scripts/sts/export-preset.sh run_12345 my_preset.json
```

### Preset Structure

```json
{
  "id": "unique-preset-id",
  "name": "Preset Name",
  "description": "Preset description",
  "tags": ["tag1", "tag2"],
  "difficulty": "easy|normal|hard|expert",
  "deck": {
    "deckId": "ironclad",
    "deckName": "Ironclad Deck",
    "cards": [...],
    "ascension": 0,
    "seed": 12345
  },
  "relics": {
    "relics": [...],
    "startingRelics": [...],
    "relicPool": [...]
  },
  "enemy": {
    "id": "jaw_worm",
    "name": "Jaw Worm",
    "type": "normal",
    "maxHp": 44,
    "damage": {...},
    "intents": [...],
    "ai": {...}
  },
  "simulation": {
    "iterations": 1000,
    "seed": 12345,
    "maxTurns": 50,
    "deterministic": true
  },
  "metadata": {
    "author": "author-name",
    "difficulty": "easy",
    "estimatedWinRate": 0.75,
    "notes": "Custom notes"
  },
  "ui": {
    "asciiPreview": "ASCII art preview",
    "colorTheme": "ironclad",
    "layout": "compact"
  }
}
```

## Configuration

### Preset Config

Built-in presets are defined in `src/balancing/config/sts/presets.json`:

```json
{
  "presets": [
    {
      "id": "ironclad-starter",
      "name": "Ironclad Starter",
      "file": "starter_ironclad.json",
      "category": "starter",
      "difficulty": "beginner"
    }
  ]
}
```

### Bridge Options

```typescript
const bridge = useSTSPresetBridge({
  enableTelemetry: true,
  autoSave: true,
  initialPresetId: 'starter-ironclad',
  onPresetApplied: (preset) => console.log('Applied:', preset.name),
  onSelectionChange: (presetId) => console.log('Selected:', presetId)
});
```

## Testing

### Unit Tests

```bash
# Run bridge hook tests
npm test tests/unit/sts/useSTSPresetBridge.test.ts

# Run UI component tests
npm test tests/unit/sts/STSPresetLoader.test.tsx

# Run all STS tests
npm test tests/unit/sts/
```

### Integration Tests

```bash
# Test CLI export tool
node scripts/sts/exportPreset.ts test-run-id output.json

# Validate preset files
node scripts/sts/validatePresets.ts data/presets/sts/
```

## Telemetry

The system tracks usage analytics:

```typescript
// Preset application
{
  event: 'sts_preset_applied',
  payload: {
    presetId: 'starter-ironclad',
    presetName: 'Ironclad Starter',
    isBuiltIn: true,
    difficulty: 'beginner',
    timestamp: '2026-01-12T19:00:00.000Z'
  }
}

// Preset creation
{
  event: 'sts_preset_saved',
  payload: {
    presetId: 'custom-preset-123',
    presetName: 'My Custom Preset',
    isBuiltIn: false,
    cardCount: 15,
    timestamp: '2026-01-12T19:00:00.000Z'
  }
}
```

## Development Guidelines

### Config-First Design
- All preset data stored in JSON files
- No hardcoded values in components
- Centralized configuration management

### Type Safety
- Strict TypeScript interfaces
- Zod schema validation
- Comprehensive error handling

### Testing
- Unit tests for all hooks and components
- Integration tests for CLI tools
- Accessibility testing for UI components

### Performance
- Memoized computations
- Efficient filtering and sorting
- Lazy loading of preset data

## Troubleshooting

### Common Issues

1. **Preset not loading**: Check JSON syntax and required fields
2. **Import failing**: Validate file format and schema
3. **UI not updating**: Check bridge hook dependencies
4. **Telemetry not working**: Verify analytics configuration

### Debug Mode

Enable debug logging:

```typescript
const bridge = useSTSPresetBridge({
  enableTelemetry: true,
  debug: true  // Enables console logging
});
```

## Future Enhancements

- [ ] Preset sharing platform
- [ ] Advanced preset analytics
- [ ] Preset versioning system
- [ ] Bulk preset operations
- [ ] Preset templates
- [ ] AI-powered preset suggestions

## Contributing

When contributing to the STS preset system:

1. Follow the config-first philosophy
2. Add comprehensive tests
3. Update documentation
4. Ensure accessibility compliance
5. Validate with linting and type checking

```bash
# Run quality checks
npm run lint
npm run build:check
npm test
npm run kanban:lint
```
