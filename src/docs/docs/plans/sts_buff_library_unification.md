# STS Buff Library Unification Guide

## Overview

This document provides comprehensive guidance for migrating and unifying the STS buff library system using a config-first approach with weight-based creator pattern. The unification brings together UI components, engine calculations, and data persistence under a shared configuration system.

## Architecture Overview

### Core Components

1. **Buff Library Configuration** (`src/balancing/config/sts/buffLibrary.ts`)
   - Central configuration with Zod schemas
   - Weight-based buff definitions with ticks
   - Category management and validation rules
   - Default configurations and constraints

2. **UI Hook Integration** (`src/ui/tools/sts/hooks/useBuffLibrary.ts`)
   - React hooks for buff management
   - PersistenceService integration
   - Real-time validation and error handling
   - State management for buff editing

3. **Engine Calculator** (`src/engine/sts/buffs/BuffCalculator.ts`)
   - Core calculation engine using configuration
   - Stacking behavior and duration management
   - Effectiveness calculations based on weights
   - Context-aware buff application

4. **Migration Tool** (`scripts/sts/migrateBuffLibrary.ts`)
   - CLI tool for legacy data migration
   - Format conversion and validation
   - Backup and reporting capabilities
   - Batch processing support

## Configuration Schema

### Buff Definition Structure

```typescript
interface BuffDefinition {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Documentation
  version: string;               // Semver versioning
  ticks: BuffTick[];             // Weight-based effects
  category: BuffCategory;        // Organization
  targetType: BuffTargetType;    // Application rules
  duration: number;              // Duration in turns
  stacking: BuffStacking;        // Stacking behavior
  tags: string[];                // Metadata tags
  metadata: {                     // Creation tracking
    createdBy: string;
    createdAt: string;
    lastModified: string;
    source: 'sts-core' | 'user-defined' | 'migration';
  };
}
```

### Weight-Based Tick System

```typescript
interface BuffTick {
  value: number;    // Base effect value
  weight: number;   // Weight multiplier (0.1 - 10.0)
}
```

The weight-based system allows for:
- **Fine-grained control**: Each tick can have different weights
- **Category scaling**: Categories provide additional multipliers
- **Dynamic balancing**: Weights can be adjusted without code changes
- **Predictable calculations**: Mathematical transparency

### Categories and Their Properties

| Category | Default Weight | Max Value | Color | Icon | Description |
|----------|---------------|-----------|-------|------|-------------|
| Strength | 2.0 | 50 | #FF6B6B | 💪 | Physical power and damage |
| Dexterity | 1.5 | 30 | #4ECDC4 | ⚡ | Speed and evasion |
| Intelligence | 1.8 | 40 | #45B7D1 | 🧠 | Magic and mental |
| Defense | 1.2 | 60 | #96CEB4 | 🛡️ | Protection and resistance |
| Offense | 2.5 | 45 | #FFEAA7 | ⚔️ | Combat enhancement |
| Utility | 1.0 | 25 | #DDA0DD | 🔧 | Support functions |
| Debuff | 3.0 | 75 | #FF4444 | ☠️ | Negative effects |
| Special | 5.0 | 100 | #FFD700 | ✨ | Unique effects |

## Migration Process

### Step 1: Prepare Legacy Data

Identify existing buff data formats:

```json
// Legacy format example
{
  "id": "strength_boost",
  "name": "Strength Boost",
  "effect": 10,
  "duration": 3,
  "type": "strength",
  "target": "self"
}
```

### Step 2: Run Migration Tool

```bash
# Basic migration
tsx scripts/sts/migrateBuffLibrary.ts

# Custom input/output
tsx scripts/sts/migrateBuffLibrary.ts -i legacy/buffs.json -o data/presets/sts/buff-library.json

# Dry run to preview changes
tsx scripts/sts/migrateBuffLibrary.ts --dry-run --verbose

# Force overwrite existing files
tsx scripts/sts/migrateBuffLibrary.ts --force
```

### Step 3: Review Migration Report

The tool generates a detailed report:
- Successfully migrated buffs
- Failed migrations with errors
- Statistics and recommendations
- Next steps for manual fixes

### Step 4: Validate and Test

```typescript
import { BuffLibraryManager } from '../src/balancing/config/sts/buffLibrary';

const manager = new BuffLibraryManager();
const validation = manager.validateBuff(migratedBuff);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## Usage Examples

### UI Integration

```typescript
import { useBuffLibrary } from '../hooks/useBuffLibrary';

function BuffManager() {
  const {
    config,
    loading,
    error,
    addBuff,
    updateBuff,
    removeBuff,
    validateBuff,
    saveConfig,
  } = useBuffLibrary();

  const handleAddBuff = async (buffData) => {
    const result = addBuff(buffData);
    if (result.success) {
      await saveConfig();
    } else {
      console.error('Failed to add buff:', result.error);
    }
  };

  return (
    <div>
      {/* Buff management UI */}
    </div>
  );
}
```

### Engine Integration

```typescript
import { BuffCalculator } from '../engine/sts/buffs/BuffCalculator';

const calculator = new BuffCalculator(buffLibraryConfig);

// Apply buff to target
const activeBuff = calculator.applyBuff(
  buffDefinition,
  'target-id',
  'source-id',
  context
);

// Calculate effects
const result = calculator.calculateBuffResult(activeBuff, context);
```

### Configuration Management

```typescript
import { BuffLibraryManager } from '../src/balancing/config/sts/buffLibrary';

// Create custom configuration
const customConfig = {
  version: '2.0.0',
  maxStacks: 15,
  defaultDuration: 5,
  validation: {
    maxTicksPerBuff: 25,
    maxTotalWeight: 75,
    maxDuration: 999,
    requiredFields: ['id', 'name', 'ticks'],
    allowedTags: ['positive', 'negative', 'combat-only'],
  },
};

const manager = new BuffLibraryManager(customConfig);
```

## Validation Rules

### Required Fields

- `id`: Unique identifier (1-50 chars)
- `name`: Display name (1-100 chars)
- `description`: Documentation (1-500 chars)
- `ticks`: At least one tick, maximum 20
- `category`: Valid category enum
- `targetType`: Valid target type enum

### Constraints

- **Tick Values**: 0-100
- **Tick Weights**: 0-10
- **Duration**: 1-999 turns
- **Total Weight**: Maximum 50 per buff
- **Tags**: Maximum 10, from allowed list

### Custom Validation

```typescript
const validation = manager.validateBuff(buff);

if (!validation.valid) {
  validation.errors.forEach(error => {
    console.error(`Validation error: ${error}`);
  });
}
```

## Performance Considerations

### Memory Usage

- **Single Buff**: ~1KB
- **Full Library (100 buffs)**: ~100KB
- **Active Buffs (per character)**: ~10KB
- **Calculation Cache**: ~50KB

### Calculation Performance

- **Single Buff Calculation**: < 1ms
- **Full Library Load**: < 10ms
- **Migration (100 buffs)**: < 500ms
- **Validation (per buff)**: < 0.5ms

### Optimization Tips

1. **Cache Calculations**: Store frequently used calculations
2. **Lazy Loading**: Load buff definitions on demand
3. **Batch Operations**: Process multiple buffs together
4. **Validation Caching**: Cache validation results

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```
   Cannot find module '../../../balancing/config/sts/buffLibrary'
   ```
   **Solution**: Check file paths and ensure all files are created

2. **Type Errors**
   ```
   'BuffCategory' cannot be used as a value
   ```
   **Solution**: Use regular imports instead of type-only imports for enums

3. **Validation Failures**
   ```
   Invalid tags: custom-tag
   ```
   **Solution**: Add custom tags to allowedTags in configuration

### Debug Mode

Enable verbose logging:

```typescript
const manager = new BuffLibraryManager();
// Verbose mode will log detailed operations
```

### Migration Issues

1. **Missing Fields**: Legacy data missing required fields
2. **Type Mismatches**: Incompatible data types
3. **Validation Errors**: Converted data fails validation

**Solutions**:
- Review migration report for specific errors
- Manually fix problematic legacy data
- Update migration logic for edge cases

## Best Practices

### Configuration Management

1. **Version Control**: Track configuration changes with git
2. **Backups**: Always create backups before major changes
3. **Validation**: Validate all configuration changes
4. **Documentation**: Document custom configurations

### Buff Design

1. **Weight Balance**: Use appropriate weights for balance
2. **Category Consistency**: Keep similar buffs in same category
3. **Duration Logic**: Match duration to effect strength
4. **Tag Usage**: Use tags for filtering and organization

### Performance

1. **Lazy Loading**: Load data only when needed
2. **Caching**: Cache calculation results
3. **Batching**: Process operations in batches
4. **Validation**: Validate early, validate often

## Testing Strategy

### Unit Tests

- Configuration validation
- Buff calculations
- Migration logic
- Error handling

### Integration Tests

- UI hook integration
- Engine calculations
- Persistence operations
- End-to-end workflows

### Performance Tests

- Large library handling
- Migration performance
- Calculation benchmarks
- Memory usage

## Future Enhancements

### Planned Features

1. **Advanced Analytics**: Buff usage statistics
2. **Auto-Balancing**: AI-assisted weight tuning
3. **Visual Editor**: Drag-and-drop buff creation
4. **Import/Export**: Multiple format support
5. **Versioning**: Buff version management

### Extension Points

1. **Custom Categories**: User-defined categories
2. **Plugin System**: Extensible calculation logic
3. **API Integration**: External buff sources
4. **Real-time Sync**: Multi-user collaboration

## Migration Checklist

### Pre-Migration

- [ ] Backup existing buff data
- [ ] Identify all legacy data sources
- [ ] Review current buff usage
- [ ] Plan migration timeline

### Migration

- [ ] Run migration tool in dry-run mode
- [ ] Review migration report
- [ ] Fix any data issues
- [ ] Run actual migration
- [ ] Validate migrated data

### Post-Migration

- [ ] Test UI components
- [ ] Verify engine calculations
- [ ] Update documentation
- [ ] Train team on new system
- [ ] Monitor for issues

## Support and Resources

### Documentation

- **API Reference**: Detailed function documentation
- **Configuration Guide**: Configuration options
- **Migration Guide**: Step-by-step migration
- **Troubleshooting**: Common issues and solutions

### Tools

- **Migration CLI**: `scripts/sts/migrateBuffLibrary.ts`
- **Validation Tool**: Built-in validation functions
- **Testing Suite**: Comprehensive test coverage
- **Debug Utilities**: Development and debugging tools

### Community

- **Issue Tracking**: Report bugs and request features
- **Discussion Forum**: Share experiences and tips
- **Code Contributions**: Submit improvements and fixes
- **Documentation**: Help improve documentation

---

*This guide covers the complete STS buff library unification process. For specific implementation details, refer to the individual component documentation.*

*Last updated: 2026-01-16*
*Version: 1.0.0*
