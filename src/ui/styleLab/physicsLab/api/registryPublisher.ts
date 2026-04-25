/**
 * Registry Publisher API
 *
 * HTTP client stub for Style Lab Registry Service.
 * Provides registry publishing functionality with logging.
 */

import { 
  type PhysicsLabRegistryPayload, 
  type PhysicsLabComponentMetadata,
  RegistryPublisher,
  defaultRegistryPublisher 
} from '../registry/physicsLabRegistry';

/**
 * Registry publishing options.
 */
export interface RegistryPublishOptions {
  /** Whether to validate payload before publishing */
  validate?: boolean;
  /** Custom endpoint URL */
  endpoint?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to enable detailed logging */
  verbose?: boolean;
}

/**
 * Registry publishing result.
 */
export interface RegistryPublishResult {
  /** Whether publishing was successful */
  success: boolean;
  /** Error message if publishing failed */
  error?: string;
  /** Publishing duration in milliseconds */
  duration: number;
  /** Registry response data */
  response?: any;
}

/**
 * Enhanced registry publisher with additional features.
 */
export class RegistryPublisherClient {
  private publisher: typeof defaultRegistryPublisher;
  private options: Required<RegistryPublishOptions>;

  constructor(options: RegistryPublishOptions = {}) {
    this.options = {
      validate: options.validate ?? true,
      endpoint: options.endpoint ?? process.env.STYLELAB_REGISTRY_URL ?? '',
      timeout: options.timeout ?? 5000,
      verbose: options.verbose ?? false,
    };

    this.publisher = new RegistryPublisher(this.options.endpoint);
  }

  /**
   * Publish registry payload with enhanced error handling and logging.
   */
  async publishRegistry(
    payload: PhysicsLabRegistryPayload
  ): Promise<RegistryPublishResult> {
    const startTime = Date.now();

    try {
      if (this.options.verbose) {
        console.log('[RegistryPublisherClient] Starting registry publish:', {
          componentCount: payload.components.length,
          presetId: payload.currentPreset.id,
          endpoint: this.options.endpoint,
        });
      }

      // Validate payload if requested
      if (this.options.validate && !this.publisher.validatePayload(payload)) {
        throw new Error('Registry payload validation failed');
      }

      // Check for feature flag
      if (!process.env.ENABLE_LAB_REGISTRY_PUBLISH) {
        if (this.options.verbose) {
          console.log('[RegistryPublisherClient] Registry publishing disabled by feature flag');
        }
        return {
          success: true,
          duration: Date.now() - startTime,
          response: { message: 'Registry publishing disabled' },
        };
      }

      // Publish to registry
      await this.publisher.pushToStyleLabRegistry(payload);

      const duration = Date.now() - startTime;

      if (this.options.verbose) {
        console.log('[RegistryPublisherClient] Registry publish completed:', {
          duration: `${duration}ms`,
          componentCount: payload.components.length,
        });
      }

      return {
        success: true,
        duration,
        response: { message: 'Registry published successfully' },
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('[RegistryPublisherClient] Registry publish failed:', {
        error: errorMessage,
        duration: `${duration}ms`,
      });

      return {
        success: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Publish individual component metadata.
   */
  async publishComponent(
    component: PhysicsLabComponentMetadata,
    presetId: string
  ): Promise<RegistryPublishResult> {
    const payload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      components: [component],
      currentPreset: {
        id: presetId as any,
        label: presetId,
        description: '',
        liftScale: 1.08,
        spring: { stiffness: 180, tiltIntensity: 8 },
        mass: 1.2,
        damping: { coefficient: 22, friction: 0.8 },
        buttonSquash: 0.94,
        slotGlow: { intensity: 0.6, chroma: 0.8 },
        cursor: { trail: 'ember' as const, velocityScale: 1, emittersEnabled: false },
        fxProfile: { id: 'gildedObservatory' as const, particleDensity: 0.5, vignetteStrength: 0.3 },
        metadata: { summary: '', lastEvidenceHash: '' },
      },
      metadata: {
        name: 'Physics Lab Registry',
        description: 'Component registry for Physics Lab micro-app',
        author: 'RPG Balancer Team',
        tags: ['physics', 'style-lab', 'interactive', 'tactile'],
      },
    };

    return this.publishRegistry(payload);
  }

  /**
   * Get registry publishing status.
   */
  getPublishingStatus(): {
    enabled: boolean;
    endpoint: string;
    featureFlag: string;
  } {
    return {
      enabled: !!process.env.ENABLE_LAB_REGISTRY_PUBLISH,
      endpoint: this.options.endpoint,
      featureFlag: 'ENABLE_LAB_REGISTRY_PUBLISH',
    };
  }
}

/**
 * Default registry publisher client instance.
 */
export const defaultRegistryPublisherClient = new RegistryPublisherClient({
  verbose: process.env.NODE_ENV === 'development',
});

/**
 * Convenience function to publish registry with default client.
 */
export async function publishPhysicsLabRegistry(
  payload: PhysicsLabRegistryPayload,
  options?: RegistryPublishOptions
): Promise<RegistryPublishResult> {
  const client = new RegistryPublisherClient(options);
  return client.publishRegistry(payload);
}
