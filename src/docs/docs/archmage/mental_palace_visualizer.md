# Mental Palace Visualizer Documentation

## Overview

The Mental Palace Visualizer is a PIXI.js-based component for rendering and interacting with Archmage Mental Palace layouts. It provides a config-first, interactive visualization system with zoom, pan, hover effects, and room management capabilities.

## Features

- **Config-First Design**: All visual styling, layout parameters, and interaction settings are configurable
- **PIXI.js Rendering**: Hardware-accelerated 2D graphics for smooth performance
- **Interactive Controls**: Zoom, pan, hover effects, and click interactions
- **Room Management**: Add, remove, update rooms and connections
- **Persistence**: Automatic saving and loading via PersistenceService
- **Telemetry**: Comprehensive event tracking for user interactions
- **Accessibility**: Full keyboard navigation and screen reader support
- **Export/Import**: JSON-based layout sharing and backup

## Architecture

### Core Components

```
src/ui/archmage/
├── mentalPalaceConfig.ts          # Configuration schema and defaults
├── MentalPalaceVisualizer.tsx     # Main PIXI visualization component
└── hooks/
    └── useMentalPalaceLayout.ts   # State management hook

tests/unit/archmage/
└── MentalPalaceVisualizer.test.tsx  # Comprehensive test suite

docs/archmage/
└── mental_palace_visualizer.md    # This documentation
```

### Data Flow

```
MentalPalaceVisualizer.tsx
    ↓ (uses)
useMentalPalaceLayout.ts
    ↓ (persists via)
PersistenceService
    ↓ (emits)
balancerStorageTelemetry
```

## Configuration System

### Layout Configuration

The layout system uses a comprehensive configuration schema:

```typescript
interface MentalPalaceLayout {
  version: string;
  name: string;
  description?: string;
  rooms: PalaceRoom[];
  connections: PalaceConnection[];
  visual: PalaceVisualConfig;
  metadata: {
    createdAt: string;
    modifiedAt: string;
    author?: string;
    tags: string[];
  };
}
```

### Room Types

- `CHAMBER` - Basic room type
- `HALL` - Large corridor or hall
- `SANCTUM` - Sacred or important chamber
- `LABORATORY` - Workshop or experimental area
- `LIBRARY` - Knowledge repository
- `OBSERVATORY` - Celestial study chamber
- `GARDEN` - Natural or outdoor space
- `VAULT` - Secure storage area

### Connection Types

- `PATHWAY` - Standard corridor or path
- `PORTAL` - Magical or dimensional gateway
- `SECRET` - Hidden or concealed passage
- `BRIDGE` - Elevated or aerial connection
- `ELEVATOR` - Vertical transportation

### Symbol Types

- `RUNE` - Magical inscription marker
- `CRYSTAL` - Crystal or gem focus
- `ORB` - Spherical magical object
- `COMPASS` - Directional indicator
- `KEY` - Access or unlock symbol
- `MIRROR` - Reflective or scrying surface
- `LANTERN` - Light or illumination source
- `BOOK` - Knowledge or written record

### Visual Configuration

All visual aspects follow the "Il Drago" art direction with Epic Frontier palette:

```typescript
interface PalaceVisualConfig {
  colors: {
    roomPrimary: string;        // '#0D0F12' - basalt
    roomSecondary: string;      // '#10131a' - card surface
    roomAccent: string;         // '#D4AF37' - bronze
    connectionPathway: string;  // 'rgba(212, 175, 55, 0.6)'
    connectionPortal: string;   // 'rgba(0, 70, 120, 0.8)'
    connectionSecret: string;   // 'rgba(139, 69, 19, 0.4)'
    symbolGlow: string;         // 'rgba(255, 215, 0, 0.6)'
    symbolActive: string;       // '#FFD700'
    backgroundBase: string;     // '#050706'
    backgroundOverlay: string;   // 'rgba(13, 15, 18, 0.45)'
    highlightGlow: string;      // 'rgba(255, 215, 0, 0.45)'
    highlightBorder: string;    // '#8b6a2f'
  };
  layout: {
    cellSize: number;           // 80px
    minRoomSpacing: number;     // 20px
    connectionWidth: number;    // 3px
    symbolSize: number;         // 24px
  };
  animations: {
    enabled: boolean;
    hoverDurationMs: number;    // 300ms
    pulseDurationMs: number;    // 2000ms
    rotationDurationMs: number; // 4000ms
  };
  interaction: {
    enableHover: boolean;
    enableClick: boolean;
    enableZoom: boolean;
    enablePan: boolean;
    minZoom: number;            // 0.5x
    maxZoom: number;            // 3.0x
  };
}
```

## Usage Examples

### Basic Usage

```typescript
import { MentalPalaceVisualizer } from '@/ui/archmage/MentalPalaceVisualizer';

function MyComponent() {
  return (
    <MentalPalaceVisualizer
      width={800}
      height={600}
      debug={false}
      onRoomClick={(room) => console.log('Room clicked:', room)}
      onRoomHover={(room) => console.log('Room hovered:', room)}
    />
  );
}
```

### Custom Layout

```typescript
import { MentalPalaceVisualizer } from '@/ui/archmage/MentalPalaceVisualizer';
import type { MentalPalaceLayout } from '@/ui/archmage/mentalPalaceConfig';

const customLayout: MentalPalaceLayout = {
  version: '1.0.0',
  name: 'My Custom Palace',
  rooms: [
    {
      id: 'entrance',
      name: 'Main Entrance',
      type: 'chamber',
      position: { x: 0, y: 0 },
      size: { width: 2, height: 2 },
      symbol: 'lantern',
      isAccessible: true,
      isHighlighted: false,
    },
    // ... more rooms
  ],
  connections: [
    {
      id: 'entrance-hall',
      from: 'entrance',
      to: 'hall',
      type: 'pathway',
      bidirectional: true,
      isVisible: true,
      strength: 1.0,
    },
    // ... more connections
  ],
  visual: DEFAULT_PALACE_VISUAL_CONFIG,
  metadata: {
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    tags: ['custom'],
  },
};

function MyComponent() {
  return (
    <MentalPalaceVisualizer
      layout={customLayout}
      width={1000}
      height={800}
    />
  );
}
```

### Hook Usage

```typescript
import { useMentalPalaceLayout } from '@/ui/archmage/hooks/useMentalPalaceLayout';

function MyComponent() {
  const {
    layout,
    isLoading,
    error,
    updateRoom,
    addRoom,
    toggleRoomHighlight,
    exportLayout,
    importLayout,
  } = useMentalPalaceLayout();

  const handleAddRoom = () => {
    addRoom({
      name: 'New Room',
      type: 'chamber',
      position: { x: 5, y: 5 },
      size: { width: 1, height: 1 },
      symbol: 'rune',
      isAccessible: true,
      isHighlighted: false,
    });
  };

  const handleExport = () => {
    const json = exportLayout();
    console.log('Layout exported:', json);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleAddRoom}>Add Room</button>
      <button onClick={handleExport}>Export Layout</button>
      <MentalPalaceVisualizer layout={layout} />
    </div>
  );
}
```

## ASCII Screenshot

```
┌─────────────────────────────────────────────────────────────┐
│                    MENTAL PALACE VISUALIZER                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ╔════════════╗              ╔════════════════════════╗   │
│   ║   ENTRANCE  ║──────────────║       LIBRARY          ║   │
│   ║   🏮       ║              ║       📚               ║   │
│   ╚════════════╝              ╚════════════════════════╝   │
│         │                               │                │
│         │                               │                │
│   ╔════════════╗              ╔════════════╗                │
│   ║ LABORATORY ║──────────────║ OBSERVATORY║                │
│   ║    💎      ║              ║     🔮     ║                │
│   ╚════════════╝              ╚════════════╝                │
│                                         │                  │
│                                         │                  │
│                                 ╔════════════╗            │
│                                 ║  SANCTUM   ║            │
│                                 ║    ᚱ      ║            │
│                                 ╚════════════╝            │
│                                                             │
│   Zoom: [🔍]  Pan: [✋]  Hover: [🖱️]  Click: [👆]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Interaction Controls

### Mouse Controls

- **Left Click + Drag**: Pan the view
- **Mouse Wheel**: Zoom in/out
- **Hover**: Highlight rooms and show tooltips
- **Click**: Select rooms or trigger interactions

### Keyboard Controls

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate selected room
- **Arrow Keys**: Pan the view (if implemented)
- **+/-**: Zoom in/out (if implemented)

## Telemetry Events

The visualizer emits comprehensive telemetry events:

```typescript
// Layout viewing
archmage_palace_viewed: {
  layoutName: string;
  roomCount: number;
  connectionCount: number;
  timestamp: number;
}

// Layout management
archmage_palace_layout_saved: {
  layoutName: string;
  roomCount: number;
  connectionCount: number;
  timestamp: number;
}

archmage_palace_layout_loaded: {
  hasSavedLayout: boolean;
  timestamp: number;
}

archmage_palace_layout_reset: {
  timestamp: number;
}

archmage_palace_layout_exported: {
  layoutName: string;
  roomCount: number;
  connectionCount: number;
  timestamp: number;
}

archmage_palace_layout_imported: {
  layoutName: string;
  roomCount: number;
  connectionCount: number;
  timestamp: number;
}

// Room interactions
archmage_palace_room_added: {
  roomId: string;
  roomType: string;
  timestamp: number;
}

archmage_palace_room_removed: {
  roomId: string;
  timestamp: number;
}

archmage_palace_room_highlight_toggled: {
  roomId: string;
  isHighlighted: boolean;
  timestamp: number;
}

archmage_palace_room_accessibility_toggled: {
  roomId: string;
  isAccessible: boolean;
  timestamp: number;
}

// Connection interactions
archmage_palace_connection_added: {
  connectionId: string;
  connectionType: string;
  from: string;
  to: string;
  timestamp: number;
}

archmage_palace_connection_removed: {
  connectionId: string;
  timestamp: number;
}
```

## Performance Considerations

### Rendering Optimization

- **Container-based rendering**: Separate containers for rooms and connections
- **Graphics pooling**: Reuse PIXI.Graphics objects when possible
- **Viewport culling**: Only render visible elements (future enhancement)
- **LOD system**: Reduce detail at zoom levels (future enhancement)

### Memory Management

- **Automatic cleanup**: PIXI application destroyed on unmount
- **Event listener removal**: Proper cleanup of event handlers
- **Graphics disposal**: Clear graphics maps when layout changes

### Large Layout Support

- **Virtualization**: Implement for layouts with 100+ rooms
- **Batch rendering**: Group similar draw operations
- **Progressive loading**: Load large layouts in chunks

## Testing

The visualizer includes comprehensive test coverage:

```bash
# Run all Mental Palace tests
npm run test -- tests/unit/archmage/

# Run with coverage
npm run test -- tests/unit/archmage/ --coverage

# Run specific test file
npm run test -- tests/unit/archmage/MentalPalaceVisualizer.test.tsx
```

### Test Categories

- **Rendering Tests**: Component mounting and PIXI initialization
- **Interaction Tests**: Click, hover, zoom, pan behaviors
- **Hook Integration Tests**: State management and persistence
- **Accessibility Tests**: Keyboard navigation and screen readers
- **Performance Tests**: Large layout rendering efficiency
- **Error Handling Tests**: Graceful failure modes

## Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **WebGL Support**: Required for hardware acceleration
- **Canvas Fallback**: Automatic fallback if WebGL unavailable
- **Touch Support**: Full touch interaction support on mobile devices

## Future Enhancements

### Planned Features

1. **Advanced Animations**
   - Room entrance/exit animations
   - Connection flow effects
   - Symbol rotation and pulsing

2. **Enhanced Interactions**
   - Room drag-and-drop repositioning
   - Connection drawing tools
   - Multi-selection support

3. **Visual Themes**
   - Multiple art direction themes
   - Custom color palettes
   - Room type variations

4. **Export Formats**
   - PNG/SVG image export
   - PDF layout documentation
   - Markdown room descriptions

5. **Collaboration Features**
   - Real-time multi-user editing
   - Version history and branching
   - Comment and annotation system

### Technical Improvements

1. **Performance**
   - WebGL shader effects
   - Offscreen canvas rendering
   - Web Workers for layout calculations

2. **Accessibility**
   - Enhanced screen reader support
   - High contrast mode
   - Reduced motion preferences

3. **Mobile Experience**
   - Touch gesture recognition
   - Responsive layout adaptation
   - PWA integration

## Troubleshooting

### Common Issues

**PIXI initialization fails**
- Check WebGL support in browser
- Verify canvas element is not hidden
- Ensure proper cleanup on component unmount

**Layout not loading**
- Verify PersistenceService is available
- Check localStorage quota limits
- Validate layout JSON structure

**Performance issues**
- Reduce number of rooms in layout
- Disable animations for large layouts
- Check for memory leaks in PIXI objects

**Interaction not working**
- Verify event listeners are properly attached
- Check canvas element dimensions
- Ensure pointer events are not blocked

### Debug Mode

Enable debug mode to see internal state:

```typescript
<MentalPalaceVisualizer debug={true} />
```

Debug overlay shows:
- Room and connection counts
- Current hovered room
- Panning state
- Performance metrics

## Integration Examples

### With Idle Village

```typescript
import { MentalPalaceVisualizer } from '@/ui/archmage/MentalPalaceVisualizer';

function VillagePalaceView() {
  const villageLayout = convertVillageToPalaceLayout(villageData);
  
  return (
    <div className="village-palace-container">
      <MentalPalaceVisualizer
        layout={villageLayout}
        onRoomClick={(room) => navigateToVillageLocation(room.id)}
        className="village-palace-view"
      />
    </div>
  );
}
```

### With STS Simulator

```typescript
import { MentalPalaceVisualizer } from '@/ui/archmage/MentalPalaceVisualizer';

function STSMindPalace() {
  const stsLayout = convertSTSToPalaceLayout(stsData);
  
  return (
    <div className="sts-palace-container">
      <MentalPalaceVisualizer
        layout={stsLayout}
        width={1200}
        height={800}
        debug={process.env.NODE_ENV === 'development'}
        onRoomClick={(room) => loadSTSRoom(room.id)}
      />
    </div>
  );
}
```

## Contributing

When contributing to the Mental Palace Visualizer:

1. **Follow Config-First Pattern**: All new features should be configurable
2. **Add Comprehensive Tests**: Cover new functionality with unit tests
3. **Update Documentation**: Keep this file current with new features
4. **Maintain Accessibility**: Ensure all interactions are keyboard accessible
5. **Performance Testing**: Verify impact on rendering performance
6. **Telemetry Coverage**: Add appropriate telemetry events for new interactions

## License and Credits

- **Developed by**: Cascade (AI Agent)
- **Project**: RPG Balancer - Archmage Module
- **Art Direction**: "Il Drago" - Noble Heroic Realism
- **Technology Stack**: React, TypeScript, PIXI.js, Vitest
- **Design Philosophy**: Config-first, weight-based creator pattern
