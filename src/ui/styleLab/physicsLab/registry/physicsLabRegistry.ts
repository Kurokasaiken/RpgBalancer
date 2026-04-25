/**
 * Physics Lab Registry
 *
 * Registry metadata for Physics Lab components.
 * Provides component definitions for Style Lab Registry Service.
 */

import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';

/**
 * Component metadata for registry publishing.
 */
export interface PhysicsLabComponentMetadata {
  /** Unique component identifier */
  componentId: string;
  /** Human-readable component name */
  name: string;
  /** Component description */
  description: string;
  /** Component category */
  category: 'canvas' | 'controls' | 'ui' | 'effects';
  /** Required props schema */
  propsSchema: Record<string, any>;
  /** Style Lab tokens used by component */
  tokensUsed: string[];
  /** Audio hooks used by component */
  audioHooks: string[];
  /** Physics parameters that affect component */
  physicsParams: string[];
  /** Whether component is experimental */
  experimental?: boolean;
}

/**
 * Registry payload for Style Lab Service.
 */
export interface PhysicsLabRegistryPayload {
  /** Registry version */
  version: string;
  /** Registry timestamp */
  timestamp: string;
  /** Component metadata collection */
  components: PhysicsLabComponentMetadata[];
  /** Current physics preset */
  currentPreset: PhysicsPreset;
  /** Registry metadata */
  metadata: {
    /** Registry name */
    name: string;
    /** Registry description */
    description: string;
    /** Registry author */
    author: string;
    /** Registry tags */
    tags: string[];
  };
}

/**
 * Component registry definitions.
 */
export const physicsLabRegistry: PhysicsLabComponentMetadata[] = [
  {
    componentId: 'tactile-card',
    name: 'Tactile Card',
    description: 'Interactive draggable card with physics-based lift and tilt effects',
    category: 'canvas',
    propsSchema: {
      config: 'PhysicsPreset',
      title: 'string',
      subtitle: 'string',
      icon: 'string',
      stats: 'Array<{label: string, value: string, negative?: boolean}>',
    },
    tokensUsed: ['colors.surface', 'colors.accent', 'shadows.medium'],
    audioHooks: ['useCardLiftSound', 'useCardDropSound'],
    physicsParams: ['liftScale', 'spring.stiffness', 'spring.tiltIntensity', 'mass'],
  },
  {
    componentId: 'sunken-slot',
    name: 'Sunken Slot',
    description: 'Interactive drop zone with physics-based glow effects',
    category: 'canvas',
    propsSchema: {
      config: 'PhysicsPreset',
      label: 'string',
      isActive: 'boolean',
    },
    tokensUsed: ['colors.surface', 'colors.border', 'shadows.inset'],
    audioHooks: ['useSlotHoverSound', 'useSlotDropSound'],
    physicsParams: ['slotGlow.intensity', 'slotGlow.chroma'],
  },
  {
    componentId: 'gold-button',
    name: 'Gold Button',
    description: 'Interactive button with physics-based squash animation',
    category: 'ui',
    propsSchema: {
      config: 'PhysicsPreset',
      children: 'ReactNode',
      variant: '"primary" | "secondary"',
      icon: 'string',
    },
    tokensUsed: ['colors.accent', 'colors.surface', 'shadows.medium'],
    audioHooks: ['useButtonClickSound'],
    physicsParams: ['buttonSquash'],
  },
  {
    componentId: 'lab-panel',
    name: 'Lab Panel',
    description: 'Main control panel with tabbed interface for physics parameters',
    category: 'controls',
    propsSchema: {
      config: 'PhysicsPreset',
      onUpdateConfig: 'Function',
      availablePresets: 'string[]',
      onApplyPreset: 'Function',
    },
    tokensUsed: ['colors.surface', 'colors.border', 'colors.accent'],
    audioHooks: [],
    physicsParams: ['liftScale', 'spring.stiffness', 'mass', 'damping.coefficient'],
  },
  {
    componentId: 'float-text',
    name: 'Float Text',
    description: 'Floating text animation for visual feedback',
    category: 'effects',
    propsSchema: {
      text: 'string',
      x: 'number',
      y: 'number',
      duration: 'number',
      color: 'string',
      fontSize: 'string',
    },
    tokensUsed: ['colors.accent', 'shadows.glow'],
    audioHooks: ['useFloatTextSound'],
    physicsParams: [],
  },
];

/**
 * Create registry payload with current preset.
 */
export function createRegistryPayload(
  currentPreset: PhysicsPreset
): PhysicsLabRegistryPayload {
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    components: physicsLabRegistry,
    currentPreset,
    metadata: {
      name: 'Physics Lab Registry',
      description: 'Component registry for Physics Lab micro-app',
      author: 'RPG Balancer Team',
      tags: ['physics', 'style-lab', 'interactive', 'tactile'],
    },
  };
}

/**
 * Registry publisher stub for Style Lab Service.
 * In production, this would make HTTP POST requests to the registry endpoint.
 */
export class RegistryPublisher {
  private endpoint: string;

  constructor(endpoint: string = process.env.STYLELAB_REGISTRY_URL ?? '') {
    this.endpoint = endpoint;
  }

  /**
   * Push registry payload to Style Lab Service.
   * Currently stubbed with logging - no real HTTP requests.
   */
  async pushToStyleLabRegistry(payload: PhysicsLabRegistryPayload): Promise<void> {
    // TODO: Replace with actual HTTP POST when registry service is available
    console.log('[RegistryPublisher] Pushing to Style Lab Registry:', {
      endpoint: this.endpoint,
      componentCount: payload.components.length,
      presetId: payload.currentPreset.id,
      timestamp: payload.timestamp,
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('[RegistryPublisher] Registry push completed successfully');
  }

  /**
   * Validate registry payload before publishing.
   */
  validatePayload(payload: PhysicsLabRegistryPayload): boolean {
    const required = ['version', 'timestamp', 'components', 'currentPreset', 'metadata'];
    const missing = required.filter(field => !(field in payload));
    
    if (missing.length > 0) {
      console.error('[RegistryPublisher] Missing required fields:', missing);
      return false;
    }

    if (!Array.isArray(payload.components) || payload.components.length === 0) {
      console.error('[RegistryPublisher] Invalid components array');
      return false;
    }

    return true;
  }
}

/**
 * Default registry publisher instance.
 */
export const defaultRegistryPublisher = new RegistryPublisher();
