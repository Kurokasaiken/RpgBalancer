# Crew Rotation Guide

## Overview

This guide explains how to work with the Phase E Crew Rotation Knowledge Base system implemented in NP‑145. The system provides a config‑first approach to defining, viewing, and documenting crew rotations for Idle Village.

## Configuration Structure

### Crew Rotation Config

The crew rotation system is built around a hierarchical configuration structure:

```
CrewRotationConfig
├── version: string
├── rotations: CrewRotation[]
└── defaults: {
    kpiTargets: CrewRotationKpiTargets
    prerequisites: CrewRotationPrerequisites
  }
```

### Crew Rotation

Each rotation contains:

- **Basic Info**: ID, name, description, version, tags
- **Slots**: Array of crew rotation slots
- **Global KPI Targets**: Overall performance targets
- **Metadata**: Designer notes and custom data

### Crew Rotation Slot

Each slot defines:

- **Identity**: ID, label, icon, tags
- **Capacity**: Maximum residents, priority weight
- **Prerequisites**: Level, fatigue, stat, and activity requirements
- **KPI Targets**: Performance metrics for this slot
- **Modifiers**: Fatigue, risk, and yield multipliers
- **Phase Lock**: Day/night restrictions

## Working with Configurations

### Adding New Rotations

1. **Define the rotation** in `src/balancing/config/idleVillage/crewRotationConfig.ts`:

```typescript
{
  id: 'new-rotation',
  name: 'New Rotation',
  description: 'Description of the rotation',
  version: '1.0.0',
  slots: [...],
  globalKpiTargets: {
    minStatMatchScore: 0.6,
    maxFatigueAverage: 0.7,
    minSpecializationScore: 0.4,
    targetEfficiencyMultiplier: 1.0,
  },
  tags: ['new', 'rotation'],
  enabled: true,
}
```

2. **Define slots** with appropriate prerequisites and KPI targets:

```typescript
{
  id: 'new-slot',
  label: 'New Slot',
  iconName: 'icon-name',
  tags: ['slot-tag'],
  maxResidents: 2,
  prerequisites: {
    minLevel: 1,
    maxFatigue: 0.8,
    requiredActivityTags: ['required-activity'],
  },
  kpiTargets: {
    minStatMatchScore: 0.5,
    maxFatigueAverage: 0.6,
    minSpecializationScore: 0.3,
    targetEfficiencyMultiplier: 1.0,
  },
  supportedActivityTags: ['activity1', 'activity2'],
  priorityWeight: 5.0,
}
```

### Updating Existing Rotations

1. **Increment the version** when making breaking changes
2. **Update KPI targets** based on gameplay feedback
3. **Adjust prerequisites** to balance difficulty
4. **Add new tags** for better categorization

## Using the Crew Rotation Viewer

### Accessing the Viewer

The CrewRotationViewer component can be imported and used in any React component:

```typescript
import { CrewRotationViewer } from '@/ui/idleVillage/components/CrewRotationViewer';

function MyComponent() {
  return (
    <CrewRotationViewer
      config={customConfig}
      showHeader={true}
      showFilters={true}
      onRotationSelected={(rotation) => console.log('Selected:', rotation)}
      onSlotSelected={(rotation, slot) => console.log('Slot selected:', slot)}
    />
  );
}
```

### Viewer Features

#### Filtering and Search

- **Search**: Find rotations by name, description, or ID
- **Tag Filters**: Filter by rotation tags and activity tags
- **Status Filter**: Include/exclude disabled rotations

#### View Options

- **KPI Details**: Toggle between detailed and compact KPI display
- **Prerequisites**: Show/hide prerequisite information
- **Compact View**: Switch between detailed and compact layouts

#### Preference Persistence

The viewer automatically saves user preferences to localStorage:

- Selected rotation
- Active filters
- View options
- Layout preferences

## Documentation Generation

### CLI Usage

Generate documentation from the command line:

```bash
# Generate both Markdown and CSV
npm run crew-rotation-doc

# Generate only Markdown
npm run crew-rotation-doc --format markdown

# Filter by tags
npm run crew-rotation-doc --tags quest,combat

# Include disabled rotations
npm run crew-rotation-doc --include-disabled

# Use compact template
npm run crew-rotation-doc --template compact

# Specify version for filenames
npm run crew-rotation-doc --version v1.2.0
```

### Output Formats

#### Markdown Documentation

- **Summary**: Overview of all rotations and statistics
- **Rotation Details**: Complete information for each rotation
- **Slot Information**: Detailed slot configurations
- **Statistics**: Tag frequency and usage metrics

#### CSV Export

- **Tabular Data**: Machine-readable format for analysis
- **All Fields**: Complete rotation and slot data
- **Filter Support**: Respects CLI filter options

## KPI Targets

### Understanding KPI Metrics

- **Min Stat Match Score**: Minimum stat tag match percentage (0‑1)
- **Max Fatigue Average**: Maximum acceptable fatigue level (0‑1)
- **Min Specialization Score**: Minimum specialization requirement (0‑1)
- **Target Efficiency Multiplier**: Desired efficiency multiplier (1.0 = baseline)

### Setting KPI Targets

1. **Start with baseline values** from `DEFAULT_CREW_ROTATION_KPI_TARGETS`
2. **Adjust based on rotation difficulty**
3. **Consider slot-specific requirements**
4. **Balance between challenge and accessibility**

## Prerequisites

### Types of Prerequisites

- **Level Requirements**: Minimum resident level
- **Fatigue Limits**: Maximum fatigue for eligibility
- **Stat Requirements**: Required stat tags (allOf/anyOf/noneOf)
- **Activity Tags**: Required and blacklisted activity experience

### Best Practices

1. **Use level gates** for progression
2. **Set reasonable fatigue limits** to prevent burnout
3. **Balance stat requirements** with slot availability
4. **Provide multiple paths** through different activity tags

## Modifiers

### Modifier Types

- **Fatigue Multiplier**: Affects fatigue accumulation rate
- **Risk Multiplier**: Influences injury/risk calculations
- **Yield Multiplier**: Modifies resource/reward outputs

### Usage Guidelines

1. **Use fatigue modifiers** for high‑intensity activities
2. **Apply risk modifiers** for dangerous assignments
3. **Set yield modifiers** for specialized or efficient slots

## Phase Locking

### Day/Night Restrictions

Slots can be locked to specific phases:

```typescript
phaseLocked: 'day' | 'night' | undefined
```

- **Day Locks**: Slot only available during day phase
- **Night Locks**: Slot only available during night phase
- **Undefined**: Available in both phases

## Versioning

### Semantic Versioning

Use semantic versioning for rotation configurations:

- **Major**: Breaking changes to structure or core mechanics
- **Minor**: New features or non‑breaking changes
- **Patch**: Bug fixes or balance adjustments

### Migration Strategy

1. **Backward compatibility** for minor versions
2. **Migration scripts** for major version changes
3. **Version validation** in the viewer and CLI

## Testing

### Unit Tests

Run the test suite:

```bash
npm run test:unit -- tests/unit/idleVillage/CrewRotationViewer.test.tsx
```

### Test Coverage

- **Rendering tests**: Component display and layout
- **Interaction tests**: User interactions and state changes
- **Filter tests**: Search and tag filtering
- **Preference tests**: Persistence and restoration
- **Accessibility tests**: ARIA labels and keyboard navigation

## Troubleshooting

### Common Issues

1. **Configuration not loading**: Check Zod validation errors
2. **Filters not working**: Verify tag names and case sensitivity
3. **Preferences not saving**: Check localStorage availability
4. **CLI generation failing**: Verify file permissions and output directory

### Debug Tips

1. **Enable console logging** for detailed error information
2. **Check browser dev tools** for localStorage issues
3. **Validate configuration** using `validateCrewRotationConfig()`
4. **Use test configuration** for isolated testing

## Best Practices

### Configuration Design

1. **Use descriptive IDs** that are easy to reference
2. **Provide clear descriptions** for all rotations and slots
3. **Use consistent tagging** for better filtering
4. **Document design decisions** in metadata

### Performance Considerations

1. **Limit rotation count** for better viewer performance
2. **Use efficient filtering** algorithms
3. **Cache computed values** where appropriate
4. **Optimize for mobile** viewing experiences

### Maintenance

1. **Regular validation** of configuration files
2. **Automated testing** of viewer functionality
3. **Documentation updates** for new features
4. **Version control** of configuration changes

## Integration Points

### Game Engine Integration

The crew rotation system integrates with:

- **Crew Scheduler**: For assignment and priority calculations
- **Activity System**: For slot-activity compatibility
- **Resident System**: For prerequisite validation
- **Phase System**: For day/night restrictions

### Analytics Integration

Telemetry events are automatically emitted for:

- **Rotation Views**: When users view rotation details
- **Documentation Generation**: When CLI generates docs
- **Filter Usage**: When users apply filters
- **Preference Changes**: When user settings are updated

## Future Enhancements

### Planned Features

1. **Advanced Filtering**: Multi‑criteria filtering options
2. **Export Formats**: Additional export formats (JSON, XML)
3. **Import/Export**: Configuration import/export functionality
4. **Validation Tools**: Advanced configuration validation
5. **Performance Metrics**: Real‑time KPI tracking

### Extension Points

The system is designed for extensibility:

- **Custom Modifiers**: Additional modifier types
- **Dynamic Prerequisites**: Runtime prerequisite evaluation
- **AI Recommendations**: Suggested configurations
- **Integration APIs**: External system integration

## Support

For questions or issues with the crew rotation system:

1. **Check this guide** for common solutions
2. **Review test cases** for usage examples
3. **Consult configuration schema** for validation rules
4. **Contact the development team** for advanced issues
