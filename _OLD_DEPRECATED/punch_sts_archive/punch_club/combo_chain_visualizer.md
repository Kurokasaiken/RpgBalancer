# Combo Chain Visualizer

**Since:** NP-196 (2026-01-24)  
**Status:** ✅ Complete

## Overview

Config-first visualizer for combat combo chains with timeline visualization, damage graphs, and replay capabilities. Aggregates data from combat telemetry without hardcoded combo definitions or direct combat state access.

## Features

### Visualization Components
- **Timeline View**: Visual sequence of combo nodes with hit types
- **Damage Graph**: Cumulative damage progression with critical hit markers
- **Stats Panel**: Chain statistics (length, damage, timing, completion)
- **Chain List**: Browse and filter available combo chains

### Replay System
- **Playback Controls**: Play, pause, stop, and seek
- **Variable Speed**: 0.5x, 1.0x, 1.5x, 2.0x playback speeds
- **Progress Tracking**: Visual progress bar with node indicators
- **Node Details**: Real-time display of current move information

### Data Management
- **Filtering**: By length, damage, session, date range
- **Statistics**: Aggregated metrics across all chains
- **Export**: JSON and CSV export for analysis
- **Auto-refresh**: Optional periodic data refresh

## Installation

No installation required. The visualizer is part of the Punch Club analytics suite.

## Usage

### Basic Usage

```tsx
import { ComboChainVisualizer } from '@/ui/punchClub/analytics/ComboChainVisualizer';

function CombatAnalytics() {
  return <ComboChainVisualizer />;
}
```

### With Options

```tsx
<ComboChainVisualizer
  sessionId="session-123"
  autoLoad={true}
  refreshInterval={5000}
  maxChains={50}
  onChainSelect={(chain) => console.log('Selected:', chain)}
  className="custom-visualizer"
/>
```

### Using the Hook

```tsx
import { useComboChainVisualizer } from '@/ui/punchClub/hooks/useComboChainVisualizer';

function CustomVisualization() {
  const {
    chains,
    selectedChain,
    stats,
    selectChain,
    startReplay,
  } = useComboChainVisualizer({
    autoLoad: true,
    maxChains: 100,
  });

  return (
    <div>
      <h2>Total Chains: {stats.totalChains}</h2>
      {chains.map(chain => (
        <button key={chain.id} onClick={() => selectChain(chain.id)}>
          {chain.nodes.length} hits - {chain.totalDamage} dmg
        </button>
      ))}
    </div>
  );
}
```

## Component Props

### ComboChainVisualizerProps

```typescript
interface ComboChainVisualizerProps {
  sessionId?: string;           // Filter by session ID
  autoLoad?: boolean;           // Auto-load on mount (default: true)
  refreshInterval?: number;     // Auto-refresh interval in ms
  maxChains?: number;           // Maximum chains to load (default: 100)
  onChainSelect?: (chain: ComboChain | null) => void;
  className?: string;
}
```

## Hook API

### useComboChainVisualizer

```typescript
const {
  // Data
  chains,                    // All loaded chains
  filteredChains,           // Filtered chains
  selectedChain,            // Currently selected chain
  stats,                    // Aggregated statistics
  replayState,              // Current replay state
  isLoading,                // Loading state
  error,                    // Error message
  
  // Actions
  selectChain,              // Select a chain by ID
  clearSelection,           // Clear selection
  setFilter,                // Apply filters
  clearFilter,              // Clear filters
  
  // Replay
  startReplay,              // Start replay
  pauseReplay,              // Pause/resume replay
  stopReplay,               // Stop replay
  setPlaybackSpeed,         // Set playback speed
  seekToNode,               // Seek to specific node
  
  // Data
  refresh,                  // Refresh data
  exportChain,              // Export chain data
} = useComboChainVisualizer(options);
```

## Data Structures

### ComboChain

```typescript
interface ComboChain {
  id: string;
  sessionId: string;
  startTime: number;
  endTime: number;
  nodes: ComboNode[];
  totalDamage: number;
  maxCombo: number;
  averageTimingMs: number;
  isComplete: boolean;
  breakReason?: 'timeout' | 'miss' | 'interrupted' | 'completed';
}
```

### ComboNode

```typescript
interface ComboNode {
  id: string;
  moveId: string;
  moveName: string;
  timestamp: number;
  damage: number;
  hitType: 'normal' | 'critical' | 'counter' | 'miss';
  position: number;
  duration: number;
}
```

### ComboChainStats

```typescript
interface ComboChainStats {
  totalChains: number;
  averageLength: number;
  averageDamage: number;
  longestChain: number;
  highestDamage: number;
  completionRate: number;
  averageTimingMs: number;
  criticalHitRate: number;
}
```

## Filtering

### Filter Options

```typescript
interface ComboFilterOptions {
  minLength?: number;        // Minimum chain length
  maxLength?: number;        // Maximum chain length
  minDamage?: number;        // Minimum total damage
  sessionId?: string;        // Filter by session
  dateRange?: {
    start: number;
    end: number;
  };
}
```

### Example Filters

```tsx
// Filter chains with 5+ hits
setFilter({ minLength: 5 });

// Filter high damage chains
setFilter({ minDamage: 100 });

// Filter by date range
setFilter({
  dateRange: {
    start: Date.now() - 86400000, // Last 24 hours
    end: Date.now(),
  }
});

// Combined filters
setFilter({
  minLength: 3,
  minDamage: 50,
  sessionId: 'session-123',
});
```

## Replay Controls

### Playback Speeds

- **0.5x**: Slow motion for detailed analysis
- **1.0x**: Normal speed (default)
- **1.5x**: Fast playback
- **2.0x**: Very fast playback

### Control Methods

```tsx
// Start from beginning
startReplay();

// Pause/resume
pauseReplay();

// Stop and reset
stopReplay();

// Change speed
setPlaybackSpeed(2.0);

// Seek to specific node
seekToNode(5);
```

## Export Formats

### JSON Export

```json
{
  "id": "chain-001",
  "sessionId": "session-123",
  "startTime": 1000,
  "endTime": 3000,
  "nodes": [
    {
      "id": "node-1",
      "moveId": "jab",
      "moveName": "Jab",
      "timestamp": 1000,
      "damage": 10,
      "hitType": "normal",
      "position": 0,
      "duration": 500
    }
  ],
  "totalDamage": 45,
  "maxCombo": 3,
  "averageTimingMs": 666,
  "isComplete": true
}
```

### CSV Export

```csv
Position,Move,Damage,Hit Type,Timing (ms)
0,Jab,10,normal,500
1,Cross,15,critical,600
2,Hook,20,normal,900
```

## Telemetry

The visualizer emits `pc_combo_chain_visualized` telemetry events:

```json
{
  "eventType": "pc_combo_chain_visualized",
  "timestamp": 1706097600000,
  "chainId": "chain-001",
  "chainLength": 3,
  "totalDamage": 45,
  "isComplete": true
}
```

## Visual Design

### ASCII Screenshot

```
┌─────────────────────────────────────────────────────────┐
│  COMBO CHAIN VISUALIZER                                  │
├─────────────────────────────────────────────────────────┤
│  Total: 15 | Avg Length: 4.2 | Avg Damage: 67 | 85.3%   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  TIMELINE                                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ████  ██████  ████  ██████████                    │  │
│  │  1      2      3        4                         │  │
│  └───────────────────────────────────────────────────┘  │
│  0ms                                            2000ms   │
│                                                           │
│  DAMAGE GRAPH                                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                              ╱     │  │
│  │                                         ╱╱╱╱      │  │
│  │                                    ╱╱╱╱           │  │
│  │                              ╱╱╱╱╱                │  │
│  │                         ╱╱╱╱╱                     │  │
│  │                    ╱╱╱╱╱                          │  │
│  │               ╱╱╱╱╱                               │  │
│  │          ╱╱╱╱╱                                    │  │
│  │     ╱╱╱╱╱                                         │  │
│  │ ╱╱╱╱                                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  REPLAY CONTROLS                                          │
│  [▶] [⏸] [⏹]  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  2/4       │
│  Speed: [1.0x ▼]                                         │
│                                                           │
│  CURRENT MOVE                                             │
│  Move: Cross                                              │
│  Damage: 15                                               │
│  Type: critical                                           │
│  Timing: 600ms                                            │
└─────────────────────────────────────────────────────────┘
```

## Integration

### With Combat Telemetry

```typescript
// Combat telemetry would emit combo events
const comboEvent = {
  eventType: 'pc_combo_node',
  chainId: 'chain-001',
  node: {
    id: 'node-1',
    moveId: 'jab',
    moveName: 'Jab',
    damage: 10,
    hitType: 'normal',
    timestamp: Date.now(),
  },
};

// Visualizer loads from aggregated telemetry
```

### With Balancer Analysis

```typescript
// Link to balancer combo analysis
import { analyzeComboBalance } from '@/balancing/combo/comboAnalyzer';

const chain = selectedChain;
const analysis = analyzeComboBalance(chain);

console.log('Balance Score:', analysis.balanceScore);
console.log('Optimal Timing:', analysis.optimalTiming);
```

## Performance

### Benchmarks

- **Load 100 chains**: <100ms
- **Filter chains**: <10ms
- **Render timeline**: <16ms (60fps)
- **Replay animation**: 60fps at 1.0x speed

### Optimization

- Uses `useMemo` for expensive calculations
- Debounced filtering for large datasets
- Virtual scrolling for chain list (future)
- Canvas rendering for large timelines (future)

## Accessibility

- **Keyboard Navigation**: Full keyboard support for controls
- **ARIA Labels**: All interactive elements labeled
- **Screen Reader**: Compatible with screen readers
- **Focus Management**: Proper focus handling
- **Color Contrast**: WCAG AA compliant

## Troubleshooting

### Issue: No chains displayed

**Symptom**: Empty chain list

**Solution**: Verify combat telemetry is being collected and chains are being saved.

### Issue: Replay not working

**Symptom**: Replay controls don't respond

**Solution**: Ensure a chain is selected before starting replay.

### Issue: Export fails

**Symptom**: Export buttons don't download files

**Solution**: Check browser permissions for file downloads.

### Issue: Performance issues

**Symptom**: Slow rendering with many chains

**Solution**: Reduce `maxChains` prop or apply filters to limit displayed chains.

## Future Enhancements

- [ ] PNG/SVG export of visualizations
- [ ] 3D timeline view
- [ ] Combo comparison mode
- [ ] Pattern recognition and suggestions
- [ ] Integration with training mode
- [ ] Real-time visualization during combat
- [ ] Combo builder from visualized chains
- [ ] Advanced filtering (by move type, damage type)

## Related Documentation

- [PC-M2 Combat Telemetry](../punch_club/combat_telemetry.md)
- [NP-166 Combo Validator](../docs/coordinator/agent_assignments.md)
- [Balancer Combo Analysis](../balancing/combo_analysis.md)

## License

Part of the RPG Balancer project. See main project LICENSE.

---

**Last Updated**: 2026-01-24  
**Maintainer**: Lumen-PC – Combo Viz  
**Status**: Production Ready
