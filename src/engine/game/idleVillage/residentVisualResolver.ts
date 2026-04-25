// src/engine/game/idleVillage/residentVisualResolver.ts
// Pure helper utilities that convert ResidentState hints into concrete portrait assets.

import type { ResidentState } from './TimeEngine';
import {
  DEFAULT_RESIDENT_VISUAL_PROFILE_ID,
  matchVisualProfile,
  type ResidentVisualProfileDefinition,
  type PortraitCropSettings,
  DEFAULT_PORTRAIT_CROP,
} from '@/balancing/config/idleVillage/residentVisuals';

/**
 * Heuristic guard that rejects stale/legacy portrait URLs persisted from earlier sessions.
 * A URL is considered likely valid when it is:
 * - a data URI (inline SVG / generated placeholder)
 * - an absolute http(s) URL
 * - a Vite-resolved asset (path typically contains a content-hash segment)
 * Raw paths such as `/assets/portraits/sir-spaccaculi.png` that were stored before
 * the portrait pipeline was canonical are NOT considered valid because the underlying
 * files no longer exist.
 */
function isLikelyValidPortraitUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  // Data URIs are always valid (generated placeholders, inline SVGs)
  if (trimmed.startsWith('data:')) return true;
  // Absolute external URLs are valid
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  // Vite-resolved assets contain a hash segment with mixed alphanumerics including
  // at least one digit (e.g. /assets/portrait-D1K3m9Fq.png). The digit requirement
  // prevents false positives on human-readable names like "sir-spaccaculi.png".
  if (/\/assets\/.*-(?=[a-zA-Z0-9]*[0-9])[a-zA-Z0-9]{8,}\.[a-z]+$/.test(trimmed)) return true;
  // Blob URLs from runtime canvas/image generation
  if (trimmed.startsWith('blob:')) return true;
  // Everything else (raw /assets/portraits/name.png) is likely stale
  return false;
}

/** Enumeration describing where the resolved portrait originated. */
export type ResidentPortraitSource = 'resident_override' | 'snapshot' | 'profile';

/**
 * Structured payload describing the final portrait/full-figure assets chosen for a resident.
 */
export interface ResolvedResidentPortrait {
  /** Profile metadata used for this resident (always defined). */
  profile: ResidentVisualProfileDefinition;
  /** Absolute/relative URL used by roster/detail views. */
  portraitUrl: string;
  /** Optional full-figure illustration resolved for cinematic layouts. */
  fullFigureUrl?: string;
  /** Crop settings used for badge rendering. */
  crop: PortraitCropSettings;
  /** Hint describing which input produced the portrait (useful for debugging). */
  source: ResidentPortraitSource;
}

/**
 * Resolves the best visual profile reference for a resident and derives portrait/full-figure URLs.
 * Order of precedence:
 * 1. Resident-level overrides (resident.portraitUrl / resident.fullFigureUrl)
 * 2. Stat snapshot hints (statSnapshot.portraitUrl / fullFigureUrl)
 * 3. Visual profile registry (matchVisualProfile)
 */
export function resolveResidentPortrait(resident?: ResidentState | null): ResolvedResidentPortrait {
  const fallbackProfile =
    matchVisualProfile({ profileId: DEFAULT_RESIDENT_VISUAL_PROFILE_ID }) ??
    ({
      id: DEFAULT_RESIDENT_VISUAL_PROFILE_ID,
      label: 'Default Portrait',
      portrait: { id: 'default', src: '', defaultCrop: DEFAULT_PORTRAIT_CROP },
    } as ResidentVisualProfileDefinition);

  if (!resident) {
    return {
      profile: fallbackProfile,
      portraitUrl: fallbackProfile.portrait?.src ?? '',
      fullFigureUrl: fallbackProfile.fullFigure?.src,
      crop: fallbackProfile.portrait?.defaultCrop ?? DEFAULT_PORTRAIT_CROP,
      source: 'profile',
    };
  }

  const snapshot = (resident.statSnapshot ?? {}) as Record<string, unknown>;
  const snapshotPortrait = typeof snapshot.portraitUrl === 'string' ? snapshot.portraitUrl : undefined;
  const snapshotFullFigure = typeof snapshot.fullFigureUrl === 'string' ? snapshot.fullFigureUrl : undefined;

  if (typeof resident.portraitUrl === 'string' && isLikelyValidPortraitUrl(resident.portraitUrl)) {
    return {
      profile: matchVisualProfile({
        profileId: resident.visualProfileId,
        statProfileId: resident.statProfileId,
        residentId: resident.id,
      }) ?? fallbackProfile,
      portraitUrl: resident.portraitUrl,
      fullFigureUrl: resident.fullFigureUrl ?? snapshotFullFigure,
      crop: resident.portraitCrop ?? fallbackProfile.portrait?.defaultCrop ?? DEFAULT_PORTRAIT_CROP,
      source: 'resident_override',
    };
  }

  if (snapshotPortrait && isLikelyValidPortraitUrl(snapshotPortrait)) {
    return {
      profile: matchVisualProfile({
        profileId: resident.visualProfileId,
        statProfileId: resident.statProfileId,
        residentId: resident.id,
      }) ?? fallbackProfile,
      portraitUrl: snapshotPortrait,
      fullFigureUrl: snapshotFullFigure,
      crop: fallbackProfile.portrait?.defaultCrop ?? DEFAULT_PORTRAIT_CROP,
      source: 'snapshot',
    };
  }

  const profile =
    matchVisualProfile({
      profileId: resident.visualProfileId,
      statProfileId: resident.statProfileId,
      residentId: resident.id,
    }) ?? fallbackProfile;

  return {
    profile,
    portraitUrl: profile.portrait?.src ?? fallbackProfile.portrait?.src ?? '',
    fullFigureUrl: profile.fullFigure?.src ?? snapshotFullFigure ?? resident.fullFigureUrl,
    crop: profile.portrait?.defaultCrop ?? DEFAULT_PORTRAIT_CROP,
    source: 'profile',
  };
}

/**
 * Convenience helper returning only the portrait URL, falling back to an empty string.
 */
export function getResidentPortraitUrl(resident?: ResidentState | null): string {
  return resolveResidentPortrait(resident).portraitUrl;
}
