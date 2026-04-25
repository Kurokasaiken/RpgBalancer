/**
 * Map Asset Registry Configuration
 * 
 * Config-first mapping of assets to components for Phase E map consistency checking.
 * Provides centralized asset definitions with validation and component mapping.
 */

import type { WorkerCardProps } from '@/ui/idleVillage/components/WorkerCard';
import type { LocationFeaturedActivity } from '@/ui/idleVillage/components/LocationCard';

/** Asset severity levels for consistency reporting */
export type AssetSeverity = 'error' | 'warning' | 'info';

/** Asset types supported in the map system */
export type AssetType = 'worker' | 'location' | 'activity' | 'quest';

/** Validation result for a single asset */
export interface AssetValidation {
  assetId: string;
  severity: AssetSeverity;
  message: string;
  componentPath?: string;
  missingProps?: string[];
  missingAssets?: string[];
}

/** Complete asset configuration entry */
export interface MapAssetConfig {
  /** Unique asset identifier */
  id: string;
  /** Asset type classification */
  type: AssetType;
  /** Relative path to React component */
  componentPath: string;
  /** Required props for component instantiation */
  requiredProps: string[];
  /** Asset file paths (images, icons, etc.) */
  assetPaths: string[];
  /** Component interface for type checking */
  componentInterface?: string;
  /** Validation rules specific to this asset */
  validationRules?: {
    minProps?: number;
    maxProps?: number;
    requiredAssets?: number;
  };
}

/** Registry containing all map assets and metadata */
export interface MapAssetRegistry {
  /** Complete list of registered assets */
  assets: MapAssetConfig[];
  /** Registry metadata */
  metadata: {
    lastUpdated: string;
    version: string;
    totalAssets: number;
    supportedTypes: AssetType[];
  };
  /** Validation configuration */
  validation: {
    /** Severity thresholds for different issues */
    severityThresholds: {
      missingComponent: AssetSeverity;
      missingProps: AssetSeverity;
      missingAssets: AssetSeverity;
      invalidInterface: AssetSeverity;
    };
    /** File paths to scan for assets */
    scanPaths: {
      components: string[];
      assets: string[];
      metadata: string[];
    };
  };
}

/** Default registry configuration with Phase E mappings */
export const DEFAULT_MAP_ASSET_REGISTRY: MapAssetRegistry = {
  assets: [
    // Worker Card assets
    {
      id: 'worker-card',
      type: 'worker',
      componentPath: 'src/ui/idleVillage/components/WorkerCard.tsx',
      requiredProps: ['id', 'name', 'hp', 'fatigue'],
      assetPaths: [
        'src/assets/ui/idleVillage/portraits/',
        'src/assets/ui/idleVillage/worker-icons/',
      ],
      componentInterface: 'WorkerCardProps',
      validationRules: {
        minProps: 3,
        maxProps: 6,
        requiredAssets: 0,
      },
    },
    // Location Card assets
    {
      id: 'location-card',
      type: 'location',
      componentPath: 'src/ui/idleVillage/components/LocationCard.tsx',
      requiredProps: ['locationId', 'name', 'featuredActivity'],
      assetPaths: [
        'src/assets/ui/idleVillage/panorama-hotspring.jpg',
        'src/assets/ui/idleVillage/locations/',
      ],
      componentInterface: 'LocationCardProps',
      validationRules: {
        minProps: 2,
        maxProps: 8,
        requiredAssets: 1,
      },
    },
    // Activity Slot assets
    {
      id: 'activity-slot',
      type: 'activity',
      componentPath: 'src/ui/idleVillage/components/ActivitySlot.tsx',
      requiredProps: ['activityId', 'type', 'status'],
      assetPaths: [
        'src/assets/ui/idleVillage/activities/',
        'src/assets/ui/idleVillage/icons/',
      ],
      componentInterface: 'ActivitySlotProps',
      validationRules: {
        minProps: 3,
        maxProps: 10,
        requiredAssets: 0,
      },
    },
    // Quest Card assets
    {
      id: 'quest-card',
      type: 'quest',
      componentPath: 'src/ui/idleVillage/components/QuestCard.tsx',
      requiredProps: ['questId', 'title', 'status'],
      assetPaths: [
        'src/assets/ui/idleVillage/quests/',
        'src/assets/ui/idleVillage/quest-icons/',
      ],
      componentInterface: 'QuestCardProps',
      validationRules: {
        minProps: 3,
        maxProps: 8,
        requiredAssets: 1,
      },
    },
  ],
  metadata: {
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
    totalAssets: 4,
    supportedTypes: ['worker', 'location', 'activity', 'quest'],
  },
  validation: {
    severityThresholds: {
      missingComponent: 'error',
      missingProps: 'warning',
      missingAssets: 'info',
      invalidInterface: 'error',
    },
    scanPaths: {
      components: [
        'src/ui/idleVillage/components/',
        'src/ui/idleVillage/map/',
      ],
      assets: [
        'src/assets/ui/idleVillage/',
        'public/assets/ui/idleVillage/',
      ],
      metadata: [
        'data/presets/idleVillage/',
        'data/idleVillage/',
      ],
    },
  },
};

/** Helper function to get asset by ID */
export function getAssetById(registry: MapAssetRegistry, assetId: string): MapAssetConfig | undefined {
  return registry.assets.find(asset => asset.id === assetId);
}

/** Helper function to get assets by type */
export function getAssetsByType(registry: MapAssetRegistry, type: AssetType): MapAssetConfig[] {
  return registry.assets.filter(asset => asset.type === type);
}

/** Helper function to validate asset configuration */
export function validateAssetConfig(asset: MapAssetConfig): AssetValidation[] {
  const validations: AssetValidation[] = [];

  // Check required props
  if (asset.requiredProps.length === 0) {
    validations.push({
      assetId: asset.id,
      severity: 'warning',
      message: 'No required props defined',
      componentPath: asset.componentPath,
    });
  }

  // Check component path format
  if (!asset.componentPath.endsWith('.tsx') && !asset.componentPath.endsWith('.ts')) {
    validations.push({
      assetId: asset.id,
      severity: 'error',
      message: 'Component path must end with .tsx or .ts',
      componentPath: asset.componentPath,
    });
  }

  return validations;
}
