/**
 * Physics Lab README
 *
 * Documentation for the Physics Lab micro-app implementation.
 */

# Physics Lab Micro-App

## Overview
The Physics Lab is a Style Laboratory micro-app that provides real-time physics parameter tuning for UI interactions. It migrates the standalone `physics-lab.html` into a React component with proper persistence and Style Lab integration.

## Architecture

### Core Components
- **PhysicsLabApp**: Main application component
- **PhysicsCanvas**: Interactive canvas with draggable card and slot
- **LabControls**: Slider controls for physics parameters
- **ChaosMode**: Stub for advanced particle effects (PL-FX)

### Hook System
- **usePhysicsLabSync**: Bidirectional preset synchronization with PersistenceService
  - Loads/saves presets using `styleLab_physicsPreset` key
  - Attaches Guardian evidence hashes on apply/export
  - Uses `useSyncExternalStore` for reactive state

### Schema & Configuration
- **PhysicsPreset**: Zod schema defining all physics parameters
  - `liftScale`: Card lift height during drag
  - `spring.stiffness`: Spring rigidity
  - `spring.tiltIntensity`: Tilt degrees based on velocity
  - `mass`: Perceived mass/inertia
  - `damping.coefficient`: Oscillation damping
  - `buttonSquash`: Click compression factor
  - `slotGlow`: Drop feedback intensity
  - `cursor`: Trail configuration
  - `fxProfile`: Particle effects profile

### Presets
Built-in presets following Style Lab themes:
- **minimalFrontier**: Balanced baseline feel
- **obsidianVault**: Heavy, dampened interactions
- **blizzardRift**: Light, responsive feel

## Usage

```tsx
import { PhysicsLabApp } from '@/ui/styleLab/physicsLab/PhysicsLabApp';

function App() {
  return (
    <StyleLaboratoryProvider>
      <PhysicsLabApp />
    </StyleLaboratoryProvider>
  );
}
```

## API Reference

### usePhysicsLabSync Hook
```tsx
const {
  preset,           // Current active preset
  applyPreset,      // Apply built-in preset by ID
  updatePreset,     // Update current preset with partial fields
  exportPreset,     // Export as JSON with evidence hash
  resetToDefault,   // Reset to default preset
  error,            // Last storage error
  isSaving,         // Save operation in progress
  lastEvidenceHash  // Guardian evidence hash
} = usePhysicsLabSync();
```

### Preset Structure
```tsx
interface PhysicsPreset {
  id: 'minimalFrontier' | 'obsidianVault' | 'blizzardRift';
  label: string;
  description: string;
  liftScale: number;           // 1.01 - 1.5
  spring: {
    stiffness: number;         // 10 - 800
    tiltIntensity: number;      // 0 - 45 degrees
  };
  mass: number;                // 0.1 - 10
  damping: {
    coefficient: number;        // 0 - 120
    friction: number;          // 0 - 1
  };
  buttonSquash: number;         // 0.6 - 1
  slotGlow: {
    intensity: number;         // 0 - 1
    chroma: number;             // 0 - 1
  };
  cursor: {
    trail: 'ember' | 'aether' | 'frost';
    velocityScale: number;      // 0.1 - 5
    emittersEnabled: boolean;
  };
  fxProfile: {
    id: 'gildedObservatory' | 'obsidianPulse' | 'blizzardVeil';
    particleDensity: number;    // 0 - 1
    vignetteStrength: number;   // 0 - 1
  };
  metadata: {
    summary: string;
    lastEvidenceHash?: string;
  };
}
```

## Implementation Notes

### Style Lab Integration
- All UI components use Style Laboratory tokens
- No hardcoded colors or values
- Config-first approach throughout

### Persistence
- Uses `PersistenceService` for async storage
- Key: `styleLab_physicsPreset`
- Automatic validation with Zod schema

### Guardian Evidence
- Evidence hashes attached on `applyPreset` and `exportPreset`
- Format: `{gitHash}-{timestamp}`
- Fallback for environments without git

### TODO Items
- **PL-FX**: Implement ChaosMode particle effects
- **PL-REG**: Component registry and sidebar controls
- **PL-AUD**: Audio and haptics integration
- **PL-TEL**: Telemetry and performance HUD

## File Structure
```
src/ui/styleLab/physicsLab/
├── PhysicsLabApp.tsx          # Main app component
├── hooks/
│   └── usePhysicsLabSync.ts   # Sync hook
├── components/
│   ├── LabPanel.tsx           # Lab controls panel
│   ├── TactileCard.tsx        # Draggable card
│   ├── SunkenSlot.tsx         # Drop target slot
│   ├── GoldButton.tsx         # Interactive buttons
│   ├── LabControlsSidebar.tsx # Sidebar controls
│   ├── FloatText.tsx          # Floating text effects
│   └── ChaosMode.tsx           # Chaos Mode stub
├── __stories__/
│   ├── PhysicsLab.stories.tsx # Storybook stories
│   └── SidebarControls.stories.tsx # Controls stories
├── __tests__/
│   └── PhysicsLabAccessibility.test.tsx # Accessibility tests
└── README.md                  # This file
```

## Storybook Integration

### Stories Available
- **PhysicsLab Stories**: Main app stories with different presets
  - `Default`: Minimal Frontier preset
  - `ObsidianVault`: Heavy drag feel
  - `BlizzardRift`: Light, responsive feel
  - `HighContrast`: Accessibility testing
  - `ReducedMotion`: Motion preference testing
  - `PerformanceTest`: Performance benchmarking
  - `PresetComparison`: Grid comparison of all presets

- **SidebarControls Stories**: Control panel stories
  - `Default`: Full panel with physics tab
  - `MaterialsTab`: Materials configuration (placeholder)
  - `FXTab`: Visual effects controls
  - `OutcomesTab`: Export and metrics display
  - `HighContrast`: High contrast mode
  - `CompactLayout`: Smaller layout testing
  - `InteractiveDemo`: Live interaction demo

### Running Stories
```bash
# Start Storybook
npm run storybook

# Navigate to Physics Lab stories
http://localhost:6006/?path=/story/physics-lab-physicslabapp--default
```

## Accessibility Certification

### Accessibility Features
- **Keyboard Navigation**: Full keyboard workflow support
- **Screen Reader Support**: ARIA labels and live regions
- **Reduced Motion**: Respects user motion preferences
- **High Contrast**: Maintains accessibility in high contrast mode
- **Focus Management**: Visible focus indicators and logical tab order

### Testing
```bash
# Run accessibility tests
npm run test -- src/ui/styleLab/physicsLab/__tests__/PhysicsLabAccessibility.test.tsx

# Run visual regression tests
npm run test:visual -- tests/visual/styleLab/physicsLab.spec.ts
```

### Axe-Core Integration
All components are tested with axe-core for WCAG 2.1 AA compliance:
- Color contrast ratios
- Semantic HTML structure
- ARIA attribute correctness
- Keyboard accessibility
- Screen reader compatibility

## Visual Testing

### Playwright Visual Tests
Comprehensive visual regression testing covers:
- **Preset Rendering**: All three physics presets
- **Control Panels**: Tab navigation and controls
- **Responsive Layout**: Mobile and tablet viewports
- **Accessibility Modes**: High contrast and reduced motion
- **Interactive States**: Drag and drop operations
- **Performance**: Load time benchmarks

### Baseline Management
Visual baselines are stored in:
```
test-results/vrt-baseline/physics-lab/
├── physics-lab-default.png
├── physics-lab-obsidian.png
├── physics-lab-blizzard.png
├── lab-panel-default.png
├── physics-lab-high-contrast.png
└── physics-lab-reduced-motion.png
```

### Running Visual Tests
```bash
# Update baselines
npm run test:visual -- tests/visual/styleLab/physicsLab.spec.ts --update-snapshots

# Run visual regression
npm run test:visual -- tests/visual/styleLab/physicsLab.spec.ts
```

## Safeguards
```bash
npm run lint -- src/ui/styleLab/physicsLab
npm run build:check
npm run kanban:lint
```

## Guardian Workflow

### Evidence Automation
The Physics Lab includes automated evidence collection and Guardian handoff scripts:

```bash
# Run evidence collection
npx tsx scripts/guardian/physicsLabEvidence.ts

# Run Guardian health check
npx tsx scripts/guardian/guardianHandoff.ts health-check

# Run deployment validation
npx tsx scripts/guardian/guardianHandoff.ts validate

# Run complete Guardian handoff
npx tsx scripts/guardian/guardianHandoff.ts handoff
```

### Evidence Reports
Evidence automation generates:
- **JSON Report**: Complete structured data for programmatic analysis
- **Markdown Report**: Human-readable summary with recommendations
- **Log Report**: Simplified text output for quick review

### Guardian Health Checks
Comprehensive health checks include:
- **Build Validation**: TypeScript compilation and bundle generation
- **Test Suite**: Unit test execution and coverage reporting
- **Lint Analysis**: Code quality and style guide compliance
- **Performance Monitoring**: Bundle size and load time benchmarks
- **Accessibility Testing**: WCAG 2.1 AA compliance verification

### Deployment Validation
Before production deployment, Guardian validates:
- Safeguard compliance across all Physics Lab components
- Performance baseline adherence (bundle size < 20MB)
- Security scan for known vulnerabilities
- Overall deployment readiness (APPROVED/NEEDS_REVIEW/REJECTED)

### Evidence Hash Tracking
The `usePhysicsLabSync` hook automatically tracks Guardian evidence hashes:
- Applied on preset changes and exports
- Format: `{gitHash}-{timestamp}`
- Stored in preset metadata for traceability
- Fallback for environments without git

### Troubleshooting
Common issues and solutions:
- **Build Failures**: Check TypeScript errors and fix import issues
- **Test Failures**: Review test output and update failing assertions
- **Lint Warnings**: Resolve code style issues with ESLint auto-fix
- **Performance Issues**: Optimize bundle size and reduce dependencies
