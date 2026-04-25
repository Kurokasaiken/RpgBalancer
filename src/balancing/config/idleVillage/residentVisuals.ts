// src/balancing/config/idleVillage/residentVisuals.ts
// Config-first registry describing how Idle Village residents map to portrait assets.

import placeholderPortrait from '@/assets/portraits/placeholder.svg';
import { getAutoPortraitSources } from './portraitAutoImports';

export interface PortraitCropSettings {
  focusX: number;
  focusY: number;
  zoom: number;
}

export const DEFAULT_PORTRAIT_CROP: PortraitCropSettings = {
  focusX: 50,
  focusY: 40,
  zoom: 1.15,
};

/**
 * Declarative reference to a single portrait or figure asset.
 */
export interface ResidentPortraitAssetDefinition {
  /** Unique identifier for this asset inside the portrait library. */
  id: string;
  /** Public path (relative to Vite public dir) for the rendered asset. */
  src: string;
  /** Optional short description for accessibility captions. */
  alt?: string;
  /** Optional note about the asset crop (e.g. 'bust', 'full', 'silhouette'). */
  crop?: string;
  /** Optional credits or provenance metadata. */
  credit?: string;
  /** Optional default crop settings for badge rendering. */
  defaultCrop?: PortraitCropSettings;
};

/**
 * Visual profile grouping bust portrait, full figure, and any mapping hints.
 */
export interface ResidentVisualProfileDefinition {
  /** Identifier consumed by ResidentState.visualProfileId. */
  id: string;
  /** Human-readable label for editors/debug panels. */
  label: string;
  /** Primary bust/portrait asset rendered in roster/detail views. */
  portrait: ResidentPortraitAssetDefinition;
  /** Optional full-figure art used by Theater or cutscenes. */
  fullFigure?: ResidentPortraitAssetDefinition;
  /** List of statProfileId values that should reuse this visual profile. */
  appliesToStatProfiles?: string[];
  /** List of concrete resident IDs that should always use this visual profile. */
  appliesToResidentIds?: string[];
  /** Free-form metadata (e.g. palette, wardrobe set) consumed by future tools. */
  metadata?: Record<string, unknown>;
  /** Optional note describing when to fall back to this profile. */
  notes?: string;
}

const AUTO_PORTRAIT_SOURCES = getAutoPortraitSources();

const STATIC_VISUAL_PROFILES: ResidentVisualProfileDefinition[] = [
  {
    id: 'sir-spaccaculi',
    label: 'Sir Spaccaculi',
    portrait: {
      id: 'sir-spaccaculi-portrait',
      src: AUTO_PORTRAIT_SOURCES.find(s => s.id.includes('male warrior'))?.src ?? placeholderPortrait,
      alt: 'Sir Spaccaculi Portrait',
      crop: 'bust',
      defaultCrop: DEFAULT_PORTRAIT_CROP,
    },
    appliesToResidentIds: ['sir-spaccaculi'],
    notes: 'Character-specific profile for Sir Spaccaculi.',
  },
  {
    id: 'salvatrice',
    label: 'Salvatrice',
    portrait: {
      id: 'salvatrice-portrait',
      src: AUTO_PORTRAIT_SOURCES.find(s => s.id.includes('female magician'))?.src ?? placeholderPortrait,
      alt: 'Salvatrice Portrait',
      crop: 'bust',
      defaultCrop: DEFAULT_PORTRAIT_CROP,
    },
    appliesToResidentIds: ['salvatrice'],
    notes: 'Character-specific profile for Salvatrice.',
  },
  {
    id: 'giggiolillo',
    label: 'Giggiolillo',
    portrait: {
      id: 'giggiolillo-portrait',
      src: AUTO_PORTRAIT_SOURCES.find(s => s.id.includes('giggiolillo'))?.src ?? placeholderPortrait,
      alt: 'Giggiolillo Portrait',
      crop: 'bust',
      defaultCrop: DEFAULT_PORTRAIT_CROP,
    },
    appliesToResidentIds: ['giggiolillo'],
    notes: 'Character-specific profile for Giggiolillo.',
  },
  {
    id: 'hero-tank',
    label: 'Hero Tank',
    portrait: {
      id: 'hero-tank-portrait',
      src: AUTO_PORTRAIT_SOURCES.find(s => s.id.includes('male warrior'))?.src ?? placeholderPortrait,
      alt: 'Hero Tank Portrait',
      crop: 'bust',
      defaultCrop: DEFAULT_PORTRAIT_CROP,
    },
    appliesToStatProfiles: ['hero-tank'],
    notes: 'Hero tank profile for tank characters.',
  },
  {
    id: 'hero-support',
    label: 'Hero Support',
    portrait: {
      id: 'hero-support-portrait',
      src: AUTO_PORTRAIT_SOURCES.find(s => s.id.includes('female magician'))?.src ?? placeholderPortrait,
      alt: 'Hero Support Portrait',
      crop: 'bust',
      defaultCrop: DEFAULT_PORTRAIT_CROP,
    },
    appliesToStatProfiles: ['hero-support'],
    notes: 'Hero support profile for support characters.',
  },
  {
    id: 'fallback_placeholder_profile',
    label: 'Placeholder',
    portrait: {
      id: 'fallback_placeholder_portrait',
      src: placeholderPortrait,
      alt: 'Placeholder portrait',
      crop: 'bust',
      defaultCrop: DEFAULT_PORTRAIT_CROP,
    },
    notes: 'Usato solo quando non esistono ritratti reali.',
  },
];

function buildAutoVisualProfiles(): ResidentVisualProfileDefinition[] {
  return AUTO_PORTRAIT_SOURCES
    .map((source) => ({
      id: source.id,
      label: source.label,
      portrait: {
        id: `${source.id}_portrait`,
        src: source.src,
        alt: source.label,
        crop: 'bust',
        credit: 'Auto-imported portrait',
        defaultCrop: DEFAULT_PORTRAIT_CROP,
      },
      metadata: {
        autoDiscovered: true,
        fileName: source.fileName,
      },
      notes: 'Asset auto-importato dalla cartella portraits.',
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

const AUTO_VISUAL_PROFILES = buildAutoVisualProfiles();

export const DEFAULT_RESIDENT_VISUAL_PROFILE_ID =
  AUTO_VISUAL_PROFILES[0]?.id ?? STATIC_VISUAL_PROFILES[0]?.id ?? 'fallback_placeholder_profile';

const ALL_VISUAL_PROFILES: ResidentVisualProfileDefinition[] = [
  ...STATIC_VISUAL_PROFILES,
  ...AUTO_VISUAL_PROFILES,
];

/**
 * Config-first registry of portrait definitions. Authors can extend this object
 * (or expose it via future UI) without touching UI components.
 */
export const RESIDENT_VISUAL_PROFILES: Record<string, ResidentVisualProfileDefinition> = ALL_VISUAL_PROFILES.reduce(
  (acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  },
  {} as Record<string, ResidentVisualProfileDefinition>,
);

const profileById = new Map<string, ResidentVisualProfileDefinition>(Object.entries(RESIDENT_VISUAL_PROFILES));
const profileByStatId = new Map<string, ResidentVisualProfileDefinition>();
const profileByResidentId = new Map<string, ResidentVisualProfileDefinition>();

Object.values(RESIDENT_VISUAL_PROFILES).forEach((profile) => {
  profile.appliesToStatProfiles?.forEach((statProfileId) => {
    if (!profileByStatId.has(statProfileId)) {
      profileByStatId.set(statProfileId, profile);
    }
  });
  profile.appliesToResidentIds?.forEach((residentId) => {
    if (!profileByResidentId.has(residentId)) {
      profileByResidentId.set(residentId, profile);
    }
  });
});

/**
 * Input payload used to resolve a resident visual profile without importing ResidentState.
 */
export interface VisualProfileLookupParams {
  /** Direct visualProfileId preferred over other hints. */
  profileId?: string | null;
  /** statProfileId exported by the Balancer or archetype editor. */
  statProfileId?: string | null;
  /** Concrete resident id (useful for story NPCs). */
  residentId?: string | null;
}

/**
 * Returns the visual profile registered with the provided identifier, if any.
 */
export function getVisualProfileById(profileId?: string | null): ResidentVisualProfileDefinition | undefined {
  if (!profileId) return undefined;
  return profileById.get(profileId) ?? undefined;
}

/**
 * Resolves the best visual profile using profileId, statProfileId, or residentId hints.
 * Falls back to DEFAULT_RESIDENT_VISUAL_PROFILE_ID when no mapping exists.
 */
export const matchVisualProfile = ({
  profileId,
  statProfileId,
  residentId,
}: VisualProfileLookupParams = {}): ResidentVisualProfileDefinition | undefined => {
  if (profileId) {
    const direct = getVisualProfileById(profileId);
    if (direct) {
      return direct;
    }
  }

  if (statProfileId) {
    const statProfileMatch = profileByStatId.get(statProfileId);
    if (statProfileMatch) {
      return statProfileMatch;
    }
  }

  if (residentId) {
    const residentMatch = profileByResidentId.get(residentId);
    if (residentMatch) {
      return residentMatch;
    }
  }

  return getVisualProfileById(DEFAULT_RESIDENT_VISUAL_PROFILE_ID);
}
