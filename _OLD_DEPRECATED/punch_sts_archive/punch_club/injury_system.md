# Injury System Documentation

## Overview

The Injury System provides comprehensive injury tracking, treatment management, and recovery simulation for RPG Balancer. It features a config-first design with multiple injury types, treatment options, medical items, and real-time recovery tracking.

## Features

### 🚨 Core Functionality
- **Injury Tracking**: Track multiple concurrent injuries with severity levels and body parts
- **Treatment System**: Apply treatments with success rates and side effects
- **Medical Inventory**: Manage medical items with stacking and usage
- **Recovery Simulation**: Natural healing and treatment-based recovery with complications
- **Pain Management**: Dynamic pain level tracking and reduction
- **Telemetry Integration**: Comprehensive event tracking for analytics

### 🏥 Injury Types
- **Minor**: Small cuts, bruises, sprains
- **Moderate**: Deep wounds, fractures, severe burns
- **Severe**: Broken bones, internal injuries
- **Critical**: Head trauma, internal bleeding
- **Fatal**: Life-threatening injuries

### 🏥 Treatment Options
- **Items**: Bandages, sutures, healing potions
- **Medical**: Surgery, professional medical care
- **Rest**: Natural healing through rest
- **Equipment**: Splints, medical kits

### 💊 Medical Items
- **Consumables**: Bandages, potions, medical kits
- **Equipment**: Medical kits, diagnostic tools
- **Permanent**: Permanent medical devices

## Architecture

### File Structure
```
src/balancing/
├── config/
│   └── injurySystemConfig.ts     # Configuration schemas and defaults
├── injurySystem.ts              # Core InjurySystem class
└── ...

src/ui/punchClub/
├── hooks/
│   └── useInjurySystem.ts        # React hook for UI integration
├── components/
│   └── InjuryPanel.tsx           # Main UI component
└── ...

tests/unit/punchClub/
├── InjurySystem.test.ts            # Core class tests
├── useInjurySystem.test.tsx        # Hook tests
└── ...

docs/punch_club/
└── injury_system.md               # This documentation
└── ...
```

### Core Components

#### 1. InjurySystemConfig
Configuration system with Zod validation for:
- Injury type definitions with effects and recovery patterns
- Treatment configurations with requirements and success rates
- Medical item specifications with usage rules
- System settings and telemetry configuration

#### 2. InjurySystem Class
Main engine providing:
- Injury sustenance and tracking
- Treatment application with success calculation
- Medical inventory management
- Recovery simulation and complication handling
- Statistics and analytics

#### 3. useInjurySystem Hook
React hook for UI integration with:
- State management for injuries and treatments
- Callback support for events
- Auto-update functionality
- Utility functions for UI components

#### 4. InjuryPanel Component
React component displaying:
- Active injury list with progress bars
- Treatment options and medical inventory
- Statistics and analytics
- Critical injury alerts

## Configuration

### Injury Types

```typescript
interface InjuryType {
  id: string;
  name: string;
  description: string;
  severity: InjurySeverity;
  bodyPart: BodyPart;
  effects: {
    statPenalties: Record<string, number>;
    abilityImpairments: string[];
    movementRestriction?: boolean;
    consciousnessRisk?: boolean;
    bleedingRisk?: boolean;
    infectionRisk?: boolean;
  };
  recovery: {
    baseDuration: number; // in hours
    variance: number; // +/- variance in hours
    naturalHealingRate: number; // % per hour
    treatmentBonus: number; // % reduction in duration
    complications?: string[];
  };
  visuals: {
    icon: string;
    color: string;
    description: string;
  };
}
```

### Treatment Configuration

```typescript
interface Treatment {
  id: string;
  name: string;
  description: string;
  type: 'item' | 'ability' | 'rest' | 'medical';
  targetInjuries: string[];
  effects: {
    healingBonus: number;
    painReduction: number;
    infectionPrevention?: boolean;
    bleedingStop?: boolean;
    statRestoration?: Record<string, number>;
  };
  requirements: {
    items?: Array<{ id: string; quantity: number }>;
    skills?: string[];
    cooldown?: number; // in hours
    cost?: number;
  };
  application: {
    duration: number; // in minutes
    successRate: number; // % success chance
    sideEffects?: string[];
  };
}
```

### Medical Items

```typescript
interface MedicalItem {
  id: string;
  name: string;
  description: string;
  category: 'consumable' | 'equipment' | 'permanent';
  effects: {
    healingAmount: number;
    painRelief: number;
    infectionPrevention?: boolean;
    bleedingStop?: boolean;
    statBoosts?: Record<string, number>;
  };
  usage: {
    consumable: boolean;
    applicationTime: number; // in minutes
    cooldown: number; // in hours
    stackable: boolean;
    maxStack?: number;
  };
  availability: {
    cost: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    locations: string[];
  };
}
```

## Usage Examples

### Basic Injury Management

```typescript
import { useInjurySystem } from '@/ui/punchClub/hooks/useInjurySystem';

function InjuryManager() {
  const {
    injuries,
    totalPain,
    worstInjury,
    criticalInjuries,
    canTreat,
    sustainInjury,
    applyTreatment,
    useMedicalItem,
    addMedicalItem,
  } = useInjurySystem({
    autoUpdate: true,
    updateInterval: 30000, // 30 seconds
    onInjurySustained: (injury) => {
      console.log(`Injury sustained: ${injury.injuryType.name}`);
    },
    onInjuryHealed: (injury) => {
      console.log(`Injury healed: ${injury.injuryType.name}`);
    },
  });

  const handleCombatInjury = async () => {
    await sustainInjury('deep_wound', 'combat');
  };

  const handleTreatment = async (treatmentId: string, injuryId: string) => {
    await applyTreatment(treatmentId, injuryId);
  };

  return (
    <div className="injury-manager">
      <div className="injury-status">
        <h3>Injury Status</h3>
        <div className="pain-indicator">
          Total Pain: {totalPain}%
        </div>
        {criticalInjuries.length > 0 && (
          <div className="critical-alert">
            🚨 Critical Injuries: {criticalInjuries.length}
          </div>
        )}
      </div>

      <div className="injury-list">
        {injuries.map((injury) => (
          <div key={injury.id} className="injury-card">
            <div className="injury-header">
              <span>{injury.injuryType.visuals.icon}</span>
              <h4>{injury.injuryType.name}</h4>
              <span className="severity-badge">{injury.currentSeverity}</span>
            </div>
            <div className="injury-details">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${injury.recoveryProgress}%` }} />
              </div>
              <div className="pain-bar">
                <div className="pain-fill" style={{ width: `${injury.painLevel}%` }} />
              </div>
              <div className="recovery-time">
                Recovery: {formatRecoveryTime(injury.estimatedRecoveryTime)}
              </div>
            </div>
            <div className="treatment-options">
              {getTreatmentsForInjury(injury.id).map(({ treatment, canApply }) => (
                <button
                  key={treatment.id}
                  onClick={() => handleTreatment(treatment.id, injury.id)}
                  disabled={!canApply}
                  className={`treatment-button ${
                    canApply ? 'available' : 'disabled'
                  }`}
                >
                  {treatment.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="medical-inventory">
        <h4>Medical Inventory</h4>
        {Object.entries(medicalInventory).map(([itemId, quantity]) => (
          <div key={itemId} className="inventory-item">
            <span>{itemId}: {quantity}</span>
            <button onClick={() => useMedicalItem(itemId)}>
              Use Item
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Advanced Configuration

```typescript
import { useInjurySystem } from '@/ui/punchClub/hooks/useInjurySystem';

const customConfig = {
  ...DEFAULT_INJURY_SYSTEM_CONFIG,
  settings: {
    maxConcurrentInjuries: 8,
    injuryDecayRate: 10, // 10% chance of worsening per hour
    naturalHealingEnabled: true,
    treatmentSuccessVariation: 15, // +/- 15% variation
    criticalInjuryThreshold: 20, // 20% HP for critical injuries
    fatalInjuryThreshold: 5, // 5% HP for fatal injuries
  },
  telemetry: {
    enabled: true,
    events: [
      'injury_sustained',
      'treatment_applied',
      'injury_healed',
      'injury_complicated',
      'injury_worsened',
    ],
  },
};

function AdvancedInjuryManager() {
  const injurySystem = useInjurySystem({ 
    config: customConfig,
    onInjurySustained: (injury) => {
      // Custom injury handling
      if (injury.injuryType.severity === 'critical') {
        triggerEmergencyProtocol(injury);
      }
    },
  });

  // ... rest of component
}
```

### Treatment Flow

```typescript
const TreatmentFlow = () => {
  const { 
    injuries, 
    getAvailableTreatments, 
    canApplyTreatment,
    applyTreatment 
  } = useInjurySystem();

  const handleTreatmentFlow = async (injuryId: string) => {
    const availableTreatments = getTreatmentsForInjury(injuryId);
    
    // Try best treatment first
    const bestTreatment = availableTreatments
      .sort((a, b) => (b.treatment.effects.healingBonus - a.treatment.effects.healingBonus))
      [0];

    if (bestTreatment && canApplyTreatment(bestTreatment.treatment.id, injuryId)) {
      await applyTreatment(bestTreatment.treatment.id, injuryId);
      return bestTreatment;
    }

    // Try alternative treatments
    for (const { treatment } of availableTreatments) {
      if (canApplyTreatment(treatment.treatment.id, injuryId)) {
        await applyTreatment(treatment.treatment.id, injuryId);
        return treatment;
      }
    }
  };

  return null;
};
```

## Recovery System

### Natural Healing

The injury system includes a natural healing mechanism that progresses recovery over time:

```typescript
// Natural healing rates by severity
const naturalHealingRates = {
  minor: 15,    // 15% per hour
  moderate: 8,    // 8% per hour
  severe: 2,     // 2% per hour
  critical: 3,   // 3% per hour
  fatal: 1,     // 1% per hour
};
```

### Treatment Acceleration

Treatments provide healing bonuses that accelerate recovery:

```typescript
// Treatment bonuses by type
const treatmentBonuses = {
  basic: 25,     // 25% reduction in recovery time
  medical: 40,    // 40% reduction in recovery time
  equipment: 50,   // 50% reduction in recovery time
  surgery: 60,   // 60% reduction in recovery time
};
```

### Complications

Injuries can develop complications during recovery:

```typescript
// Possible complications by injury type
const complicationChances = {
  deep_wound: ['infection', 'scarring'],
  broken_bone: ['malunion', 'nerve_damage'],
  head_trauma: ['memory_loss', 'personality_change'],
  internal_bleeding: ['organ_failure', 'shock'],
};
```

## Pain Management

### Pain Levels

Pain is calculated based on injury severity and treatment effects:

```typescript
// Initial pain levels by severity
const initialPainLevels = {
  minor: 20,    // 20% pain
  moderate: 40,  // 40% pain
  severe: 60,    // 60% pain
  critical: 80,  // 80% pain
  fatal: 95,    // 95% pain
};
```

### Pain Reduction

Treatments and medical items provide pain reduction:

```typescript
// Pain reduction by treatment type
const painReductions = {
  basic: 20,     // 20% pain reduction
  medical: 30,    // 30% pain reduction
  equipment: 40,   // 40% pain reduction
  rest: 10,       // 10% pain reduction
  healing_potion: 40, // 40% pain reduction
};
```

## Medical Items

### Categories

#### Consumables
- **Bandages**: Basic wound care
- **Potions**: Magical healing elixirs
- **Medical Kits**: Professional medical supplies

#### Equipment
- **Medical Kit**: Comprehensive medical equipment
- **Diagnostic Tools**: Injury assessment tools

#### Permanent
- **Implants**: Permanent medical devices

### Usage Rules

```typescript
// Stack limits
const stackLimits = {
  bandage: 10,        // Max 10 bandages
  suture_kit: 5,       // Max 5 suture kits
  healing_potion: 3,       // Max 3 potions
};

// Cooldown periods
const cooldowns = {
  basic_bandage: 0,      // No cooldown
  sutures: 0,          // No cooldown
  surgery: 4,            // 4 hours
  healing_potion: 1,        // 1 hour
};
```

## Statistics and Analytics

### Key Metrics

The system tracks comprehensive statistics:

```typescript
interface InjuryStatistics {
  totalInjuries: number;
  activeInjuries: number;
  healedInjuries: number;
  totalTreatments: number;
  averageRecoveryTime: number; // in hours
  mostCommonInjury: string;
  treatmentSuccessRate: number; // percentage
}
```

### Telemetry Events

The system emits telemetry for analytics:

```typescript
// Injury events
const injuryEvents = [
  'injury_sustained',
  'treatment_applied',
  'injury_healed',
  'injury_complicated',
  'injury_worsened',
];
```

### Event Payloads

```typescript
// Example injury sustained event
{
  event: 'injury_sustained',
  data: {
    injuryId: 'injury_123',
    injuryType: 'deep_wound',
    severity: 'moderate',
    bodyPart: 'torso',
    source: 'combat',
    timestamp: 1641894400000,
  },
}
```

## Best Practices

### Config-First Design
- All injury types, treatments, and items defined in config
- No hardcoded values in components
- Use Zod for validation
- Centralize all configuration changes

### Error Handling
- Graceful degradation for unsupported features
- User-friendly error messages
- Automatic retry for transient failures
- Comprehensive logging for debugging

### Performance
- Efficient state updates with React hooks
- Debounced recovery updates
- Optimized telemetry emission
- Minimal re-renders

### Testing
- Comprehensive unit test coverage
- Mock all external dependencies
- Test edge cases and error conditions
- Integration testing for UI components

## Troubleshooting

### Common Issues

#### Treatment Not Available
- Check if treatment targets the injury type
- Verify requirements are met (items, skills, cooldown)
- Ensure injury is not already healed

#### Recovery Not Progressing
- Check if natural healing is enabled
- Verify update interval is active
- Check for complications blocking recovery

#### Pain Not Reducing
- Verify treatment has pain reduction effects
- Check if treatment was successfully applied
- Monitor for treatment side effects

#### Medical Items Not Working
- Check item availability in inventory
- Verify item is consumable and not equipment
- Check if injury exists for targeted use

### Debug Mode

Enable debug logging for detailed information:

```typescript
const injurySystem = new InjurySystem({
  ...config,
  telemetry: {
    enabled: true,
    verbose: true,
  },
});
```

## Migration Guide

### From Existing System

1. **Replace direct injury tracking**:
```typescript
// Old
const injuries = [];
injuries.push({ type: 'cut', severity: 'minor' });

// New
const injurySystem = new InjurySystem();
await injurySystem.sustainInjury('minor_cut');
```

2. **Add treatment system**:
```typescript
// Old
function applyTreatment(treatment, injury) {
  // Manual treatment logic
}

// New
const result = await injurySystem.applyTreatment(treatment.id, injury.id);
```

3. **Add medical items**:
```typescript
// Old
const inventory = { bandage: 5 };

// New
injurySystem.addMedicalItem('bandage', 5);
```

### Integration Checklist

- [ ] Import and initialize InjurySystem
- [ ] Replace direct injury management
- [ ] Update UI components to use hook
- [ ] Add medical item management
- [ ] Implement treatment callbacks
- [ ] Update telemetry integration
- [ ] Test all injury scenarios
- [ ] Update documentation

## Future Enhancements

### Planned Features
- **Advanced AI Treatment**: AI-powered treatment recommendations
- **Injury Prevention**: Proactive injury avoidance systems
- **Recovery Optimization**: Machine learning for recovery prediction
- **Multi-character Support**: Group injury management
- **Visual Injury Display**: 3D injury visualization

### Platform Expansion
- **Mobile Medical Apps**: Mobile-first injury management
- **Wearable Integration**: Health device integration
- **Cloud Sync**: Cross-device medical data sync
- **Voice Commands**: Voice-activated treatment

### Advanced Features
- **Genetic Factors**: Injury susceptibility based on character stats
- **Environmental Factors**: Environmental injury risks
- **Social Support**: Group injury management
- **Insurance System**: Medical cost management

## API Reference

### InjurySystem Class

#### Constructor
```typescript
new InjurySystem(config?: InjurySystemConfig)
```

#### Methods
- `sustainInjury(injuryId: string, source?: string): Promise<ActiveInjury | null>`
- `applyTreatment(treatmentId: string, injuryId: string): Promise<TreatmentResult | null>`
- `useMedicalItem(itemId: string, injuryId?: string): Promise<boolean>`
- `addMedicalItem(itemId: string, quantity: number): boolean`
- `updateRecovery(deltaTime: number): void`
- `getInjuryStatus(): InjuryStatus`
- `getAvailableTreatments(): Array<TreatmentInfo>`
- `getState(): InjurySystemState`
- `getStatistics(): InjuryStatistics`
- `reset(): void`

### useInjurySystem Hook

#### Parameters
```typescript
useInjurySystem(options?: InjurySystemOptions)
```

#### Returns
- **State**: Current injury system state
- **Actions**: Injury and treatment management functions
- **Getters**: Utility functions
- **Utilities**: Helper functions

### Types

#### ActiveInjury
```typescript
interface ActiveInjury {
  id: string;
  injuryType: InjuryType;
  sustainedAt: number;
  currentSeverity: InjurySeverity;
  recoveryProgress: number; // 0-100%
  estimatedRecoveryTime: number; // in hours
  treatments: string[]; // treatment IDs applied
  complications: string[];
  painLevel: number; // 0-100%
  isHealed: boolean;
  isWorsening: boolean;
}
```

#### TreatmentResult
```typescript
interface TreatmentResult {
  success: boolean;
  treatmentId: string;
  injuryId: string;
  effects: {
    healingProgress: number; // % increase
    painReduction: number; // % reduction
    durationReduction: number; // hours reduced
    sideEffects: string[];
  };
  timestamp: number;
}
```

#### InjurySystemOptions
```typescript
interface InjurySystemOptions {
  config?: InjurySystemConfig;
  autoUpdate?: boolean;
  updateInterval?: number; // in milliseconds
  onInjurySustained?: (injury: ActiveInjury) => void;
  onTreatmentApplied?: (result: TreatmentResult) => void;
  onInjuryHealed?: (injury: ActiveInjury) => void;
  onPainChanged?: (painLevel: number) => void;
}
```

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm run test`
4. Start development server: `npm run dev`

### Code Style
- Follow TypeScript strict mode
- Use JSDoc comments for all public APIs
- Maintain 95%+ test coverage
- Use config-first design principles

### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation
4. Run full test suite
5. Submit PR with detailed description

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-24  
**Author**: RPG Balancer Team  
**License**: Project License

The Injury System provides a comprehensive solution for injury management in RPG Balancer with config-first design, robust error handling, and extensive customization options.
