# Stat Profile Radar Documentation

## Overview

The `StatProfileRadar` component provides a radar chart visualization for comparing stat profiles across different archetypes in the stress testing system.

## Implementation

**File:** `src/ui/balancing/StatProfileRadar.tsx`

**Props:**
- `profiles: StressTestArchetype[]` - Array of stat profiles to compare
- `baselineProfile?: StressTestArchetype` - Optional baseline profile for comparison

## Features

- **Config-Driven Labels:** Uses `BalancerConfig` to get dynamic stat labels
- **Multiple Profile Comparison:** Supports comparing baseline vs. boosted stat archetypes
- **Filtering:** Automatically filters out derived and hidden stats
- **Placeholder Implementation:** Current version shows tabular data; full radar chart requires D3.js

## Data Source

Data comes from `StressTestArchetypeGenerator` archetypes, structured as:

```typescript
interface StressTestArchetype {
  id: string;
  name: string;
  stats: Record<string, number>; // statId -> value
}
```

## Usage Example

```tsx
import { StatProfileRadar } from '@/ui/balancing/StatProfileRadar';

<StatProfileRadar
  profiles={singleStatArchetypes}
  baselineProfile={baselineArchetype}
/>
```

## Current Output

Displays stat values in a grid format for each profile:

- Baseline Profile
  - HP: 100.00
  - Damage: 50.00
  - ...

- HP +25 Profile
  - HP: 125.00
  - Damage: 50.00
  - ...

## Future Enhancements

- Integrate D3.js for SVG radar chart rendering
- Add interactive tooltips showing stat differences
- Implement export to PNG/SVG for reports
- Add animation for profile transitions

## Testing

Component is tested via `StressTestDashboard` integration, ensuring proper rendering with config data.

## Related Components

- `MarginalUtilityTable` - Tabular efficiency data
- `SynergyHeatmap` - 2D stat synergy visualization
- `StressTestDashboard` - Main dashboard integrating all visualizations
