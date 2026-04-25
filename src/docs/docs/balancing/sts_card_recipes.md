# STS Card Recipe Template Library

**Since:** NP-056 – STS Card Recipe Template Library  
**Status:** ✅ Complete  
**Last Updated:** 2026-01-20

## Overview

The STS Card Recipe Template Library provides a comprehensive system for creating, managing, and browsing card recipe templates using weight-based creator patterns. It features a React component library with filtering, favorites, search, and export capabilities, all following the config-first philosophy of the RPG Balancer project.

## Features

### 🎯 Core Capabilities
- **Template Management**: Create, edit, and delete card recipe templates
- **Weight-Based Design**: All stats use value/weight pairs for balancing
- **Real-Time Filtering**: Filter by type, rarity, difficulty, tags, and cost range
- **Favorites System**: Save and organize favorite recipes
- **Export Capabilities**: JSON, Markdown, and CSV export formats
- **Search Functionality**: Full-text search across recipe names and descriptions
- **Analytics Dashboard**: View recipe distribution and statistics

### 📊 Dashboard Components
- **Recipe Browser**: Grid layout with recipe cards showing key stats
- **Filter Panel**: Advanced filtering with multiple criteria
- **Analytics Tab**: Statistics and distribution charts
- **Favorites Tab**: Quick access to saved recipes
- **Recommendations**: AI-powered recipe suggestions

### 🔧 Configuration System
- **Recipe Templates**: Pre-defined templates with Zod validation
- **Library Settings**: Configurable UI preferences and limits
- **Export Settings**: Customizable export formats and options
- **UI Configuration**: Grid columns, advanced stats, preview options

## Architecture

### File Structure
```
src/balancing/config/sts/
├── cardRecipes.ts                          # Configuration schemas and utilities
└── buffLibrary.ts                         # Existing buff system (reference)

src/ui/tools/sts/
├── components/
│   └── CardRecipeLibrary.tsx           # Main library component
├── hooks/
│   └── useCardRecipes.ts                # Main React hook
└── types.ts                              # STS type definitions

tests/unit/sts/
└── CardRecipeLibrary.test.tsx            # Comprehensive test suite

docs/balancing/
└── sts_card_recipes.md                 # This documentation
```

### Data Flow
1. **Recipe Creation**: Users create templates via UI or import
2. **Validation**: Zod schemas ensure data integrity
3. **Persistence**: Async storage via PersistenceService
4. **Filtering**: Real-time filtering and sorting
5. **Analytics**: Statistical analysis and recommendations
6. **Export**: Multiple format support with automatic downloads

## Configuration

### Recipe Template Schema
```typescript
interface CardRecipe {
  id: string;
  name: string;
  description: string;
  cost: number;
  cardType: 'attack' | 'skill' | 'power' | 'curse' | 'status';
  rarity: 'common' | 'uncommon' | 'rare' | 'special';
  stats: {
    damage?: CardStatTick[];
    block?: CardStatTick[];
    heal?: CardStatTick[];
    draw?: CardStatTick[];
    energy?: CardStatTick[];
  };
  modifiers: CardModifier[];
  intentTags: string[];
  tags: string[];
  metadata: {
    version: string;
    createdBy: string;
    createdAt: string;
    lastModified: string;
    source: 'sts-core' | 'user-defined' | 'community' | 'migration';
    difficulty: 'basic' | 'intermediate' | 'advanced' | 'expert';
    synergies: string[];
    counters: string[];
  };
}
```

### Stat Tick Definition
```typescript
interface CardStatTick {
  value: number;    // Stat value
  weight: number;    // Weight for balancing
}
```

### Modifier System
```typescript
interface CardModifier {
  id: string;
  type: 'damage' | 'block' | 'heal' | 'buff' | 'debuff' | 'draw' | 'energy' | 'custom';
  value: number;
  operation: 'add' | 'multiply' | 'set';
  target: 'player' | 'enemy' | 'both' | 'self';
  duration?: number;
  tags: string[];
}
```

### Library Configuration
```typescript
interface CardRecipeLibraryConfig {
  id: string;
  version: string;
  recipes: CardRecipe[];
  settings: {
    maxRecipesPerPage: number;
    enableFavorites: boolean;
    enableUserRecipes: boolean;
    defaultSort: 'name' | 'cost' | 'rarity' | 'difficulty' | 'created' | 'power';
    defaultFilters: {
      cardTypes: string[];
      rarities: string[];
      difficulties: string[];
      tags: string[];
    };
  };
  ui: {
    gridColumns: number;
    showAdvancedStats: boolean;
    enablePreview: boolean;
    exportFormats: ('json' | 'markdown' | 'csv')[];
  };
}
```

## Usage

### React Hook Integration
```typescript
import { useCardRecipes } from '@/ui/tools/sts/hooks/useCardRecipes';

function MyComponent() {
  const cardRecipes = useCardRecipes({
    // Custom configuration
    settings: {
      maxRecipesPerPage: 20,
      enableUserRecipes: true,
    },
    ui: {
      gridColumns: 4,
      showAdvancedStats: true,
    },
  });

  return (
    <div>
      <p>Total Recipes: {cardRecipes.recipes.length}</p>
      <p>Favorites: {cardRecipes.favorites.length}</p>
      <button onClick={() => cardRecipes.addRecipe({})}>
        Add Recipe
      </button>
    </div>
  );
}
```

### Component Integration
```typescript
import { CardRecipeLibrary } from '@/ui/tools/sts/components/CardRecipeLibrary';

function STSToolsPage() {
  return (
    <div className="sts-tools-page">
      <h1>STS Tools</h1>
      <CardRecipeLibrary />
    </div>
  );
}
```

### Recipe Creation
```typescript
import { useCardRecipes } from '@/ui/tools/sts/hooks/useCardRecipes';

function RecipeCreator() {
  const { addRecipe } = useCardRecipes();

  const handleCreateRecipe = () => {
    addRecipe({
      name: 'Custom Strike',
      description: 'A custom attack card',
      cost: 2,
      cardType: 'attack',
      rarity: 'uncommon',
      stats: {
        damage: [
          { value: 8, weight: 1.2 },
        ],
      },
      tags: ['custom', 'attack'],
      intentTags: ['attack'],
    });
  };

  return (
    <button onClick={handleCreateRecipe}>
      Create Recipe
    </button>
  );
}
```

### Filtering and Search
```typescript
import { useCardRecipes } from '@/ui/tools/sts/hooks/useCardRecipes';

function RecipeBrowser() {
  const { 
    recipes, 
    updateFilters, 
    filters, 
    sortBy, 
    updateSort 
  } = useCardRecipes();

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    updateFilters(newFilters);
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    updateSort(newSort);
  };

  return (
    <div>
      <input
        placeholder="Search recipes..."
        value={filters.search}
        onChange={(e) => handleFilterChange({ search: e.target.value })}
      />
      
      <select
        value={sortBy}
        onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
      >
        <option value="name">Name</option>
        <option value="cost">Cost</option>
        <option value="power">Power Level</option>
      </select>
      
      <div>
        {recipes.map(recipe => (
          <div key={recipe.id}>
            <h3>{recipe.name}</h3>
            <p>{recipe.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Export Functionality
```typescript
import { useCardRecipes } from '@/ui/tools/sts/hooks/useCardRecipes';

function RecipeExporter() {
  const { exportRecipes } = useCardRecipes();

  const handleExport = (format: 'json' | 'markdown' | 'csv') => {
    const data = exportRecipes(format);
    
    // Create download
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card-recipes-${Date.now()}.${format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'csv'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <button onClick={() => handleExport('json')}>Export JSON</button>
      <button onClick={() => handleExport('markdown')}>Export Markdown</button>
      <button onClick={() => handleExport('csv')}>Export CSV</button>
    </div>
  );
}
```

## Default Templates

### Basic Attack Recipe
```typescript
{
  id: 'strike-basic',
  name: 'Strike',
  description: 'Basic attack card that deals damage',
  cost: 1,
  cardType: 'attack',
  rarity: 'common',
  stats: {
    damage: [
      { value: 6, weight: 1.0 },
    ],
  },
  modifiers: [],
  intentTags: ['attack', 'damage'],
  tags: ['basic', 'attack', 'damage'],
  metadata: {
    version: '1.0.0',
    createdBy: 'sts-core',
    createdAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
    source: 'sts-core',
    difficulty: 'basic',
    synergies: ['strength', 'vulnerable'],
    counters: ['block', 'intangible'],
  },
}
```

### Power Attack Recipe
```typescript
{
  id: 'bash-power',
  name: 'Bash',
  description: 'Power attack that applies vulnerable',
  cost: 2,
  cardType: 'attack',
  rarity: 'uncommon',
  stats: {
    damage: [
      { value: 8, weight: 1.0 },
    ],
  },
  modifiers: [
    {
      id: 'vulnerable-debuff',
      type: 'debuff',
      value: 3,
      operation: 'add',
      target: 'enemy',
      duration: 3,
      tags: ['vulnerable', 'debuff'],
    },
  ],
  intentTags: ['attack', 'damage', 'debuff'],
  tags: ['power', 'attack', 'vulnerable'],
  metadata: {
    version: '1.0.0',
    createdBy: 'sts-core',
    createdAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
    source: 'sts-core',
    difficulty: 'intermediate',
    synergies: ['strength', 'weak'],
    counters: ['block', 'intangible'],
  },
}
```

### Skill Recipe
```typescript
{
  id: 'draw-power',
  name: 'Draw Power',
  description: 'Power card that draws additional cards',
  cost: 1,
  cardType: 'skill',
  rarity: 'rare',
  stats: {
    draw: [
      { value: 2, weight: 1.0 },
    ],
  },
  modifiers: [],
  intentTags: ['draw', 'card-draw'],
  tags: ['power', 'draw', 'card-draw'],
  metadata: {
    version: '1.0.0',
    createdBy: 'sts-core',
    createdAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
    source: 'sts-core',
    difficulty: 'advanced',
    synergies: ['exhaust', 'hand-size'],
    counters: ['deck-exhaustion'],
  },
}
```

## Power Level Calculation

The power level is calculated using the formula:

```
Power Level = (Total Stat Value × Weight) / Cost × Rarity Multiplier
```

Where:
- **Total Stat Value**: Sum of all stat values
- **Weight**: Weight multipliers for balance
- **Cost**: Energy cost of the card
- **Rarity Multiplier**: Common (1.0), Uncommon (1.2), Rare (1.5), Special (2.0)

### Example Calculation
```typescript
// Strike (Common, Cost 1, Damage 6, Weight 1.0)
Power Level = (6 × 1.0) / 1 × 1.0 = 6

// Bash (Uncommon, Cost 2, Damage 8, Weight 1.0, Vulnerable 3)
Power Level = (8 + 3) / 2 × 1.2 = 5.83 ≈ 6
```

## Filter System

### Available Filters
- **Card Types**: attack, skill, power, curse, status
- **Rarities**: common, uncommon, rare, special
- **Difficulties**: basic, intermediate, advanced, expert
- **Tags**: Custom tags for categorization
- **Search**: Full-text search in names and descriptions
- **Cost Range**: Min/max energy cost filter

### Filter Combinations
Multiple filters can be combined for precise recipe discovery:
```typescript
const filteredRecipes = filterRecipes(allRecipes, {
  cardTypes: ['attack', 'skill'],
  rarities: ['common', 'uncommon'],
  maxCost: 3,
  search: 'damage',
  tags: ['basic'],
});
```

### Sort Options
- **Name**: Alphabetical by recipe name
- **Cost**: Numerical by energy cost
- **Rarity**: By rarity tier
- **Difficulty**: By difficulty level
- **Created**: By creation date
- **Power**: By calculated power level

## Analytics

### Recipe Distribution
The system provides analytics for:
- **Total Recipes**: Overall count in library
- **Type Distribution**: Breakdown by card type
- **Rarity Distribution**: Breakdown by rarity tier
- **Difficulty Distribution**: Breakdown by difficulty level
- **Cost Distribution**: Histogram of energy costs
- **Power Levels**: Min, max, and average power levels

### Statistical Metrics
- **Average Cost**: Mean energy cost across all recipes
- **Average Power**: Mean power level across all recipes
- **Cost Efficiency**: Power-to-cost ratios
- **Tag Frequency**: Most common tags across recipes
- **Intent Tag Coverage**: AI targeting analysis

### Usage Analytics
The system tracks user interactions:
- **Recipe Views**: When recipes are viewed in detail
- **Recipe Creation**: When new recipes are added
- **Recipe Updates**: When recipes are modified
- **Recipe Deletion**: When recipes are removed
- **Favorite Toggles**: When favorites are added/removed
- **Export Actions**: When data is exported

## Export Formats

### JSON Export
```json
{
  "recipes": [...],
  "favorites": [...],
  "exportedAt": "2024-01-20T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Markdown Export
```markdown
# STS Card Recipe Templates

**Exported:** January 20, 2024  
**Total Recipes:** 42

## Recipe List

### Strike
**Type:** attack | **Cost:** 1 | **Rarity:** common | **Power:** 6

**Description:** Basic attack card that deals damage

**Stats:** damage: 6

**Tags:** basic, attack, damage

**Intent Tags:** attack, damage

---

### Bash
**Type:** attack | **Cost:** 2 | **Rarity:** uncommon | **Power:** 5

**Description:** Power attack that applies vulnerable

**Stats:** damage: 8

**Modifiers:** vulnerable 3 to enemy for 3 turns

**Tags:** power, attack, vulnerable

**Intent Tags:** attack, damage, debuff

---
```

### CSV Export
```csv
ID,Name,Type,Cost,Rarity,Power Level,Description,Tags,Intent Tags,Created At
strike-basic,Strike,attack,1,common,6,Basic attack card that deals damage,"basic;attack;damage",attack;damage,2024-01-01T00:00:00.000Z
bash-power,Bash,attack,2,uncommon,5,Power attack that applies vulnerable,"power;attack;vulnerable",attack;damage;debuff,2024-01-01T00:00:00.000Z
```

## Telemetry Integration

### Tracked Events
The system emits telemetry events for user interactions:

#### Recipe Creation
```typescript
{
  eventType: 'sts_card_recipe_created',
  data: {
    recipe_id: 'recipe-123',
    recipe_type: 'attack',
    recipe_rarity: 'uncommon',
    timestamp: 1640995200000,
  }
}
```

#### Recipe Viewed
```typescript
{
  eventType: 'sts_card_recipe_viewed',
  data: {
    recipe_id: 'recipe-123',
    view_duration: 5000,
    timestamp: 1924-01-01T00:00:00.000Z,
  },
}
```

#### Export Actions
```typescript
{
  eventType: 'sts_card_recipes_exported',
  data: {
    format: 'json',
    recipe_count: 42,
    timestamp: 1640995200000,
  },
}
```

## Testing

### Test Coverage
The library includes comprehensive test coverage:

#### Component Tests
- Rendering with different recipe collections
- Filter panel interactions
- Tab switching behavior
- Modal interactions
- Export functionality
- Accessibility compliance

#### Hook Tests
- State management
- CRUD operations
- Filtering and sorting
- Persistence integration
- Telemetry emission
- Error handling

#### Utility Tests
- Recipe validation
- Power level calculations
- Filter combinations
- Sort algorithms
- Export formatting

### Test Structure
```typescript
describe('CardRecipeLibrary', () => {
  // Component rendering tests
  it('renders library with recipes', () => {});
  it('shows loading state', () => {});
  it('shows error state', () => {});
  
  // Interaction tests
  it('handles filter changes', () => {});
  it('handles tab switching', () => {});
  it('handles recipe actions', () => {});
  
  // Integration tests
  it('integrates with PersistenceService', () => {});
  it('emits telemetry events', () => {});
});

describe('useCardRecipes', () => {
  // Hook functionality tests
  it('provides correct default state', () => {});
  it('handles recipe addition', () => {});
  it('handles favorite toggling', () => {});
  it('handles filter updates', () => {});
});
```

## Integration Points

### Existing STS Systems
- **BalancerConfigStore**: Card configuration store
- **PersistenceService**: Async data persistence
- **Telemetry System**: Event tracking and analytics
- **STS Theme**: Consistent styling with STS tools

### Phase 10 Integration
The library is designed to integrate with the Config-Driven Balancer (Phase 10):
- **Card Config Store**: Reads from existing card configuration
- **Formula Engine**: Uses existing formula validation
- **Persistence**: Follows async PersistenceService patterns

### Mobile Compatibility
- **Responsive Design**: Adapts to mobile screens
- **Touch Interactions**: Optimized for touch devices
- **Performance**: Efficient rendering for large recipe collections

## Performance Considerations

### Data Limits
- **Max Recipes**: 10,000 recipes (configurable)
- **Batch Processing**: 100 recipes per batch
- **Memory Usage**: ~2MB for full dataset
- **Render Performance**: Optimized with React.memo

### Optimization Features
- **Memoized Calculations**: Power level calculations cached
- **Virtual Scrolling**: For large recipe lists
- **Lazy Loading**: Components loaded on demand
- **Incremental Updates**: Only process changed data

### Performance Metrics
| Operation | Expected Time |
|-----------|---------------|
| Filter 1000 recipes | < 10ms |
| Sort 1000 recipes | < 5ms |
| Export JSON | < 2ms |
| Export Markdown | < 5ms |
| Export CSV | < 3ms |

## Security Considerations

### Data Validation
- **Zod Schemas**: All data validated before storage
- **Type Safety**: TypeScript interfaces for all data structures
- **Input Sanitization**: User inputs are sanitized
- **Export Filtering**: Sensitive data is excluded from exports

### Persistence Security
- **Async Storage**: All operations use PersistenceService
- **Error Handling**: Graceful failure recovery
- **Data Integrity**: Validation on load/save operations
- **Access Control**: User recipes isolated by user ID

### Import Security
- **Schema Validation**: Imported data must match schemas
- **Malicious Content**: Invalid data rejected
- **Size Limits**: Large imports are blocked
- **Format Validation**: Only supported formats allowed

## Troubleshooting

### Common Issues

#### No Recipes Displayed
**Cause**: Empty data store or filtering issues
**Solution**: Check filters and ensure recipes exist in config

#### Import Fails
**Cause**: Invalid JSON format or schema violations
**Solution**: Validate JSON structure and check Zod schemas

#### Export Errors
**Cause**: Invalid data or missing required fields
**Solution**: Check recipe validation before export

#### Performance Issues
**Cause**: Too many recipes or complex calculations
**Solution**: Reduce data limits or optimize calculations

### Debug Mode
Enable verbose logging in configuration:
```typescript
const config = createSafeCardRecipeLibraryConfig({
  settings: {
    verbose: true,
  },
});
```

### Error Recovery
The system includes automatic error recovery:
- **Validation Errors**: Falls back to safe defaults
- **Storage Failures**: Continues with cached data
- **Network Issues**: Shows appropriate error messages
- **Type Errors**: Maintains type safety

## Future Enhancements

### Planned Features
- **Recipe Templates**: Pre-built template library
- **AI Recommendations**: Smart recipe suggestions
- **Collaborative Editing**: Multi-user recipe sharing
- **Version History**: Track recipe changes over time
- **Import/Export**: Enhanced file format support

### API Extensions
- **REST API**: External recipe management
- **GraphQL**: Advanced querying capabilities
- **Webhook Support**: Real-time notifications
- **Batch Operations**: Bulk recipe operations

### UI Enhancements
- **Drag & Drop**: Visual recipe organization
- **Visual Editor**: WYSIWYG recipe creation
- **Preview Mode**: Live recipe preview
- **Advanced Search**: Fuzzy search and suggestions

## Contributing

When contributing to the Card Recipe Library:

1. **Follow Config-First Principles**: All thresholds and settings in configuration
2. **Maintain Type Safety**: Use TypeScript interfaces for all data
3. **Add Tests**: Cover new features with comprehensive tests
4. **Update Documentation**: Keep this file synchronized
5. **Performance Test**: Validate with large datasets

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm run test

# Run linting
npm run lint -- src/balancing src/ui/tools/sts

# Build check
npm run build:check
```

### Code Style
- Use JSDoc comments for all functions
- Follow existing naming conventions
- Maintain consistent code formatting
- Add type annotations for all parameters

### Testing Guidelines
- Test all public APIs
- Mock external dependencies
- Cover edge cases and error conditions
- Include accessibility tests
- Performance test with large datasets

## License

This component is part of the RPG Balancer project and follows the same licensing terms.

---

**Related Documentation:**
- [RPG Balancer Philosophy](../../docs/plans/art_direction_plan.md)
- [Config-Driven Architecture](../../docs/plans/config_driven_balancer_plan.md)
- [STS Tools Integration](../../docs/plans/sts_simulator_ui_redesign_plan.md)
- [Storage Testing Framework](../../docs/STORAGE_TESTING_GUIDE.md)
