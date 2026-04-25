/**
 * TS-004: Component Integration Examples
 * 
 * Practical examples of integrating existing components with the TS-Series
 * skin system. Demonstrates different integration patterns and best practices.
 */

import React from 'react';
import { 
  SkinSlot, 
  useSkinSlot, 
  withSkinSlot, 
  BasicSkinSlot,
  AdvancedSkinSlot 
} from '../components/SkinSlot';
import { 
  ComponentIntegrationPatterns,
  migrateComponent,
  CommonComponentConfigs,
  type ComponentIntegrationConfig 
} from './ComponentIntegrationPatterns';

// ============================================================================
// MOCK COMPONENTS FOR EXAMPLES
// ============================================================================

// Mock ActivitySlot component
const MockActivitySlot: React.FC<{
  slotId: string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ slotId, label, className = '', style, children }) => {
  return (
    <div className={`activity-slot ${className}`} style={style}>
      <div className="activity-slot__header">{label}</div>
      <div className="activity-slot__content">{children}</div>
      <div className="activity-slot__footer">Slot ID: {slotId}</div>
    </div>
  );
};

// Mock ActiveHUD component
const MockActiveHUD: React.FC<{
  activities: Array<{ name: string; progress: number }>;
  className?: string;
  style?: React.CSSProperties;
}> = ({ activities, className = '', style }) => {
  return (
    <div className={`active-hud ${className}`} style={style}>
      <h3>Active Activities</h3>
      {activities.map((activity, index) => (
        <div key={index} className="active-hud__item">
          <span>{activity.name}</span>
          <div className="active-hud__progress">
            <div 
              className="active-hud__progress-bar" 
              style={{ width: `${activity.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Mock PgCard component
const MockPgCard: React.FC<{
  workerId: string;
  name: string;
  hp: number;
  maxHp: number;
  className?: string;
  style?: React.CSSProperties;
  onDragStart?: () => void;
}> = ({ workerId, name, hp, maxHp, className = '', style, onDragStart }) => {
  return (
    <div 
      className={`pg-card ${className}`} 
      style={style}
      draggable
      onDragStart={onDragStart}
    >
      <div className="pg-card__header">{name}</div>
      <div className="pg-card__stats">
        <div className="pg-card__hp">
          HP: {hp}/{maxHp}
        </div>
        <div 
          className="pg-card__hp-bar"
          style={{ width: `${(hp / maxHp) * 100}%` }}
        />
      </div>
      <div className="pg-card__footer">ID: {workerId}</div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 1: BASIC WRAPPER PATTERN
// ============================================================================

export const BasicWrapperExample: React.FC = () => {
  return (
    <div className="integration-example">
      <h3>Example 1: Basic Wrapper Pattern</h3>
      <p>Simple wrapper using SkinSlot component for basic skin integration.</p>
      
      <SkinSlot
        componentId="ActivitySlot"
        binding={CommonComponentConfigs.ActivitySlot}
        className="example-wrapper"
      >
        <MockActivitySlot
          slotId="example-slot-1"
          label="Example Activity"
        />
      </SkinSlot>
    </div>
  );
};

// ============================================================================
// EXAMPLE 2: HOOK INTEGRATION PATTERN
// ============================================================================

export const HookIntegrationExample: React.FC = () => {
  const skinData = useSkinSlot('ActiveHUD', CommonComponentConfigs.ActiveHUD, {
    generateClasses: true,
    generateAttributes: true,
    generateStyles: true,
  });

  const mockActivities = [
    { name: 'Mining', progress: 75 },
    { name: 'Building', progress: 45 },
    { name: 'Research', progress: 90 },
  ];

  return (
    <div className="integration-example">
      <h3>Example 2: Hook Integration Pattern</h3>
      <p>Direct hook usage for fine-grained control over skin behavior.</p>
      
      <div
        className={skinData.className}
        style={skinData.styles}
        {...skinData.attributes}
      >
        <MockActiveHUD activities={mockActivities} />
      </div>
      
      <div className="integration-example__debug">
        <h4>Skin Data Debug:</h4>
        <pre>{JSON.stringify({
          classes: skinData.classes,
          attributes: skinData.attributes,
          styles: skinData.styles,
          isRegistered: skinData.isRegistered,
          currentPreset: skinData.currentPreset,
        }, null, 2)}</pre>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 3: HIGHER-ORDER COMPONENT PATTERN
// ============================================================================

// Create HOC-wrapped PgCard
const SkinWrappedPgCard = withSkinSlot(
  MockPgCard,
  'PgCard',
  CommonComponentConfigs.PgCard
);

export const HOCExample: React.FC = () => {
  const handleDragStart = () => {
    console.log('PgCard drag started');
  };

  return (
    <div className="integration-example">
      <h3>Example 3: Higher-Order Component Pattern</h3>
      <p>HOC wrapper for existing components that cannot be modified directly.</p>
      
      <SkinWrappedPgCard
        workerId="worker-001"
        name="John Doe"
        hp={85}
        maxHp={100}
        onDragStart={handleDragStart}
      />
    </div>
  );
};

// ============================================================================
// EXAMPLE 4: ADVANCED INTEGRATION PATTERN
// ============================================================================

export const AdvancedIntegrationExample: React.FC = () => {
  const skinData = useSkinSlot('CrewScheduler', CommonComponentConfigs.CrewScheduler, {
    generateClasses: true,
    generateAttributes: true,
    generateStyles: true,
    enableLiveUpdates: true,
    onError: (error) => console.error('Skin error:', error),
    onRegistered: (componentId) => console.log('Component registered:', componentId),
  });

  // Mock crew data
  const crewMembers = [
    { id: 'crew-001', name: 'Alice', role: 'Miner', efficiency: 0.85 },
    { id: 'crew-002', name: 'Bob', role: 'Builder', efficiency: 0.92 },
    { id: 'crew-003', name: 'Charlie', role: 'Researcher', efficiency: 0.78 },
  ];

  return (
    <div className="integration-example">
      <h3>Example 4: Advanced Integration Pattern</h3>
      <p>Full integration with hot-reload, telemetry, and advanced features.</p>
      
      <div
        className={skinData.className}
        style={skinData.styles}
        {...skinData.attributes}
      >
        <div className="crew-scheduler">
          <h4>Crew Scheduler</h4>
          <div className="crew-list">
            {crewMembers.map((member) => (
              <div key={member.id} className="crew-member">
                <div className="crew-member__name">{member.name}</div>
                <div className="crew-member__role">{member.role}</div>
                <div className="crew-member__efficiency">
                  Efficiency: {(member.efficiency * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="integration-example__metrics">
        <h4>Performance Metrics:</h4>
        <div>Render Count: {skinData.renderCount}</div>
        <div>Last Update: {new Date(skinData.lastUpdate).toLocaleTimeString()}</div>
        <div>Current Preset: {skinData.currentPreset}</div>
        <div>Current Pillar: {skinData.currentPillar}</div>
        <div>Motion Level: {skinData.currentMotionLevel}</div>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 5: BATCH MIGRATION PATTERN
// ============================================================================

export const BatchMigrationExample: React.FC = () => {
  const [migrationResults, setMigrationResults] = React.useState<any[]>([]);
  const [isMigrating, setIsMigrating] = React.useState(false);

  const handleBatchMigration = async () => {
    setIsMigrating(true);
    
    try {
      const { batchMigrateComponents } = await import('./ComponentIntegrationPatterns');
      
      const results = await batchMigrateComponents({
        components: [
          {
            component: MockActivitySlot,
            config: CommonComponentConfigs.ActivitySlot,
            pattern: 'Basic Wrapper',
          },
          {
            component: MockActiveHUD,
            config: CommonComponentConfigs.ActiveHUD,
            pattern: 'Hook Integration',
          },
          {
            component: MockPgCard,
            config: CommonComponentConfigs.PgCard,
            pattern: 'Higher-Order Component',
          },
        ],
        onProgress: (completed, total, current) => {
          console.log(`Migration progress: ${completed}/${total} - ${current}`);
        },
        onComplete: (results) => {
          setMigrationResults(results);
          setIsMigrating(false);
        },
        onError: (error, componentId) => {
          console.error(`Migration error for ${componentId}:`, error);
        },
      });
      
      setMigrationResults(results);
    } catch (error) {
      console.error('Batch migration failed:', error);
      setIsMigrating(false);
    }
  };

  return (
    <div className="integration-example">
      <h3>Example 5: Batch Migration Pattern</h3>
      <p>Migrate multiple components simultaneously with progress tracking.</p>
      
      <button
        onClick={handleBatchMigration}
        disabled={isMigrating}
        className="integration-example__button"
      >
        {isMigrating ? 'Migrating...' : 'Start Batch Migration'}
      </button>
      
      {migrationResults.length > 0 && (
        <div className="integration-example__results">
          <h4>Migration Results:</h4>
          {migrationResults.map((result, index) => (
            <div
              key={index}
              className={`integration-example__result ${result.success ? 'success' : 'error'}`}
            >
              <strong>{result.componentId}</strong>: {result.success ? '✓ Success' : '✗ Failed'}
              {result.migrationTime && <span> ({result.migrationTime.toFixed(2)}ms)</span>}
              {result.errors.length > 0 && (
                <div className="integration-example__errors">
                  {result.errors.map((error: string, i: number) => (
                    <div key={i} className="integration-example__error">{error}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 6: CUSTOM CONFIGURATION PATTERN
// ============================================================================

export const CustomConfigurationExample: React.FC = () => {
  // Custom configuration for a specific component
  const customConfig: ComponentIntegrationConfig = {
    componentId: 'CustomCard',
    name: 'Custom Themed Card',
    description: 'A card component with custom skin configuration',
    version: '1.0.0',
    defaultPreset: 'arcane-tech',
    supportedPillars: ['frontier', 'empire'],
    supportedMotionLevels: ['reduced', 'full'],
    cssClassBase: 'custom-card',
    dataAttributePrefix: 'custom-card',
    category: 'ui',
    priority: 75,
    tags: ['custom', 'card', 'themed'],
    skinProperties: {
      customTheme: true,
      animatedBorder: true,
      glowEffect: true,
      interactiveHover: true,
    },
    integrationOptions: {
      enableHotReload: true,
      generateClasses: true,
      generateAttributes: true,
      generateStyles: true,
      enableTelemetry: true,
      customValidation: true,
    },
  };

  const skinData = useSkinSlot('CustomCard', customConfig, {
    generateClasses: true,
    generateAttributes: true,
    generateStyles: true,
  });

  return (
    <div className="integration-example">
      <h3>Example 6: Custom Configuration Pattern</h3>
      <p>Create custom skin configurations for specialized components.</p>
      
      <div
        className={skinData.className}
        style={skinData.styles}
        {...skinData.attributes}
      >
        <div className="custom-card">
          <div className="custom-card__header">Custom Themed Card</div>
          <div className="custom-card__content">
            This card uses a custom skin configuration with specialized properties.
          </div>
          <div className="custom-card__footer">
            Custom Properties: {JSON.stringify(customConfig.skinProperties)}
          </div>
        </div>
      </div>
      
      <div className="integration-example__config-debug">
        <h4>Custom Configuration Debug:</h4>
        <pre>{JSON.stringify(customConfig, null, 2)}</pre>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 7: ERROR HANDLING PATTERN
// ============================================================================

export const ErrorHandlingExample: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [recoveryAttempted, setRecoveryAttempted] = React.useState(false);

  // Intentionally invalid configuration for demonstration
  const invalidConfig: ComponentIntegrationConfig = {
    componentId: '', // Invalid: empty component ID
    name: 'Invalid Component',
    description: 'Component with invalid configuration',
    version: '1.0.0',
    defaultPreset: 'minimal-frontier',
    supportedPillars: [], // Invalid: empty pillars
    supportedMotionLevels: [], // Invalid: empty motion levels
    cssClassBase: 'invalid-component',
    dataAttributePrefix: 'invalid',
    category: 'test',
    priority: 50,
    tags: ['test', 'invalid'],
  };

  const handleError = (error: Error) => {
    setError(error.message);
    setRecoveryAttempted(false);
  };

  const attemptRecovery = () => {
    setError(null);
    setRecoveryAttempted(true);
    
    // Use valid configuration for recovery
    const validConfig = CommonComponentConfigs.ActivitySlot;
    // In a real scenario, you would re-initialize with valid config
    setTimeout(() => {
      setRecoveryAttempted(false);
    }, 1000);
  };

  return (
    <div className="integration-example">
      <h3>Example 7: Error Handling Pattern</h3>
      <p>Demonstrates error handling and recovery mechanisms.</p>
      
      {error ? (
        <div className="integration-example__error-state">
          <h4>Error Detected:</h4>
          <div className="integration-example__error-message">{error}</div>
          <button
            onClick={attemptRecovery}
            disabled={recoveryAttempted}
            className="integration-example__recovery-button"
          >
            {recoveryAttempted ? 'Recovering...' : 'Attempt Recovery'}
          </button>
        </div>
      ) : (
        <div className="integration-example__error-demo">
          <p>This example demonstrates error handling with an intentionally invalid configuration.</p>
          <button
            onClick={() => {
              try {
                const validation = require('./ComponentIntegrationPatterns').validateIntegrationConfig(invalidConfig);
                if (!validation.isValid) {
                  throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }
              } catch (err) {
                handleError(err instanceof Error ? err : new Error('Unknown error'));
              }
            }}
            className="integration-example__trigger-button"
          >
            Trigger Error (Invalid Config)
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE GALLERY COMPONENT
// ============================================================================

export const IntegrationExamplesGallery: React.FC = () => {
  const [activeExample, setActiveExample] = React.useState<string>('basic');

  const examples = [
    { id: 'basic', name: 'Basic Wrapper', component: BasicWrapperExample },
    { id: 'hook', name: 'Hook Integration', component: HookIntegrationExample },
    { id: 'hoc', name: 'HOC Pattern', component: HOCExample },
    { id: 'advanced', name: 'Advanced Integration', component: AdvancedIntegrationExample },
    { id: 'batch', name: 'Batch Migration', component: BatchMigrationExample },
    { id: 'custom', name: 'Custom Configuration', component: CustomConfigurationExample },
    { id: 'error', name: 'Error Handling', component: ErrorHandlingExample },
  ];

  const ActiveExample = examples.find(ex => ex.id === activeExample)?.component || BasicWrapperExample;

  return (
    <div className="integration-examples-gallery">
      <h2>TS-004 Integration Examples Gallery</h2>
      
      <div className="integration-examples__navigation">
        {examples.map((example) => (
          <button
            key={example.id}
            onClick={() => setActiveExample(example.id)}
            className={`integration-examples__nav-button ${
              activeExample === example.id ? 'integration-examples__nav-button--active' : ''
            }`}
          >
            {example.name}
          </button>
        ))}
      </div>
      
      <div className="integration-examples__content">
        <ActiveExample />
      </div>
      
      <div className="integration-examples__info">
        <h3>About These Examples</h3>
        <p>
          These examples demonstrate different integration patterns for the TS-Series skin system.
          Each pattern is suited for different use cases and component types:
        </p>
        <ul>
          <li><strong>Basic Wrapper:</strong> Simple components that need basic skin integration</li>
          <li><strong>Hook Integration:</strong> Components requiring fine-grained control</li>
          <li><strong>HOC Pattern:</strong> Legacy components that cannot be modified</li>
          <li><strong>Advanced Integration:</strong> Critical components with advanced features</li>
          <li><strong>Batch Migration:</strong> Migrating multiple components simultaneously</li>
          <li><strong>Custom Configuration:</strong> Specialized components with custom needs</li>
          <li><strong>Error Handling:</strong> Robust error handling and recovery</li>
        </ul>
      </div>
    </div>
  );
};

export default IntegrationExamplesGallery;
