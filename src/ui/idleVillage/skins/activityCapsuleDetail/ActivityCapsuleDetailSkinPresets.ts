/**
 * WL-STY-011: ActivityCapsuleDetail Skin Presets and Themes (TS-Series Integration)
 * 
 * Comprehensive collection of ActivityCapsuleDetail skin presets and themes
 * with full TS-Series integration, pillar-specific adaptations, and motion level support.
 */

import { 
  ActivityCapsuleDetailSkinConfig,
  DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG,
  mergeActivityCapsuleDetailSkinConfig,
} from './ActivityCapsuleDetailSkinSchema';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
} from '../SkinSchema';

// ============================================================================
// MINIMAL PRESETS
// ============================================================================

/**
 * Minimal Frontier preset - clean, functional design
 */
export const MINIMAL_FRONTIER_PRESET: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    windowBackground: 'linear-gradient(135deg, rgba(30, 58, 138, 0.96) 0%, rgba(30, 64, 175, 0.98) 100%)',
    windowBorder: '1px solid rgba(59, 130, 246, 0.3)',
    frameGradient: 'linear-gradient(0% 0%, #1e3a8a 0%, #1e40af 30%, #1e293b 70%, #0f172a 100%)',
    frameBorderGradient: 'linear-gradient(0% 0%, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0.55) 12%, rgba(59, 130, 246, 0.55) 88%, rgba(59, 130, 246, 0) 100%)',
    frameCornerDecorations: 'rgba(59, 130, 246, 0.42)',
    dragHandleDotColor: 'rgba(96, 165, 250, 0.8)',
    closeButtonColor: 'rgba(96, 165, 250, 0.48)',
    closeButtonHoverColor: 'rgba(147, 197, 253, 0.82)',
  },
  poi: {
    crownGradient: 'linear-gradient(14% 4%, #60a5fa 0%, #3b82f6 9%, #2563eb 28%, #1d4ed8 52%, #1e40af 76%, #1e3a8a 100%)',
    idleColor: 'rgba(59, 130, 246, 0.9)',
    activeColor: 'rgba(96, 165, 250, 0.9)',
    completedColor: 'rgba(72, 230, 105, 0.9)',
    poiGlow: '0 0 20px rgba(59, 130, 246, 0.4)',
  },
  header: {
    nameColor: 'rgba(226, 232, 240, 0.92)',
    typeColor: 'rgba(148, 163, 184, 0.55)',
    statusActiveColor: 'rgba(59, 130, 246, 0.8)',
    statusCompletedColor: 'rgba(72, 230, 105, 0.8)',
  },
  cta: {
    startButtonBackground: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.95))',
    startButtonBorder: 'rgba(96, 165, 250, 0.62)',
    startButtonColor: 'rgba(15, 23, 42, 0.9)',
    startButtonGlow: '0 2px 10px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(96, 165, 250, 0.14)',
    collectButtonBackground: 'linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(37, 99, 235, 0.9))',
    collectButtonBorder: 'rgba(96, 165, 250, 0.48)',
    collectButtonColor: 'rgba(15, 23, 42, 0.88)',
    collectButtonGlow: '0 0 14px rgba(59, 130, 246, 0.18)',
  },
  presetId: 'minimal-frontier',
};

/**
 * Minimal Wilderness preset - nature-inspired design
 */
export const MINIMAL_WILDERNESS_PRESET: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    windowBackground: 'linear-gradient(135deg, rgba(6, 78, 59, 0.96) 0%, rgba(20, 83, 45, 0.98) 100%)',
    windowBorder: '1px solid rgba(34, 197, 94, 0.3)',
    frameGradient: 'linear-gradient(0% 0%, #064f3b 0%, #14532d 30%, #0f5329 70%, #05301a 100%)',
    frameBorderGradient: 'linear-gradient(0% 0%, rgba(34, 197, 94, 0) 0%, rgba(34, 197, 94, 0.55) 12%, rgba(34, 197, 94, 0.55) 88%, rgba(34, 197, 94, 0) 100%)',
    frameCornerDecorations: 'rgba(45, 154, 85, 0.42)',
    dragHandleDotColor: 'rgba(134, 239, 172, 0.8)',
    closeButtonColor: 'rgba(134, 239, 172, 0.48)',
    closeButtonHoverColor: 'rgba(187, 247, 208, 0.82)',
  },
  poi: {
    crownGradient: 'linear-gradient(14% 4%, #86efac 0%, #34d399 9%, #10b981 28%, #059669 52%, #047857 76%, #065f46 100%)',
    idleColor: 'rgba(34, 197, 94, 0.9)',
    activeColor: 'rgba(52, 211, 153, 0.9)',
    completedColor: 'rgba(72, 230, 105, 0.9)',
    poiGlow: '0 0 20px rgba(34, 197, 94, 0.4)',
  },
  header: {
    nameColor: 'rgba(209, 250, 229, 0.92)',
    typeColor: 'rgba(167, 243, 208, 0.55)',
    statusActiveColor: 'rgba(34, 197, 94, 0.8)',
    statusCompletedColor: 'rgba(72, 230, 105, 0.8)',
  },
  cta: {
    startButtonBackground: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.95))',
    startButtonBorder: 'rgba(134, 239, 172, 0.62)',
    startButtonColor: 'rgba(6, 95, 70, 0.9)',
    startButtonGlow: '0 2px 10px rgba(34, 197, 94, 0.28), inset 0 1px 0 rgba(134, 239, 172, 0.14)',
    collectButtonBackground: 'linear-gradient(135deg, rgba(34, 197, 94, 0.85), rgba(16, 185, 129, 0.9))',
    collectButtonBorder: 'rgba(134, 239, 172, 0.48)',
    collectButtonColor: 'rgba(6, 95, 70, 0.88)',
    collectButtonGlow: '0 0 14px rgba(34, 197, 94, 0.18)',
  },
  presetId: 'minimal-wilderness',
};

/**
 * Minimal Empire preset - imperial design
 */
export const MINIMAL_EMPIRE_PRESET: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    windowBackground: 'linear-gradient(135deg, rgba(38, 38, 38, 0.96) 0%, rgba(55, 48, 38, 0.98) 100%)',
    windowBorder: '1px solid rgba(205, 127, 50, 0.3)',
    frameGradient: 'linear-gradient(0% 0%, #262626 0%, #373026 30%, #1f1f1f 70%, #0a0a0a 100%)',
    frameBorderGradient: 'linear-gradient(0% 0%, rgba(205, 127, 50, 0) 0%, rgba(205, 127, 50, 0.55) 12%, rgba(205, 127, 50, 0.55) 88%, rgba(205, 127, 50, 0) 100%)',
    frameCornerDecorations: 'rgba(192, 96, 48, 0.42)',
    dragHandleDotColor: 'rgba(251, 191, 36, 0.8)',
    closeButtonColor: 'rgba(251, 191, 36, 0.48)',
    closeButtonHoverColor: 'rgba(252, 211, 77, 0.82)',
  },
  poi: {
    crownGradient: 'linear-gradient(14% 4%, #fbbf24 0%, #f59e0b 9%, #d97706 28%, #b45309 52%, #92400e 76%, #78350f 100%)',
    idleColor: 'rgba(217, 119, 6, 0.9)',
    activeColor: 'rgba(251, 191, 36, 0.9)',
    completedColor: 'rgba(212, 175, 55, 0.9)',
    poiGlow: '0 0 20px rgba(217, 119, 6, 0.4)',
  },
  header: {
    nameColor: 'rgba(254, 243, 199, 0.92)',
    typeColor: 'rgba(253, 230, 138, 0.55)',
    statusActiveColor: 'rgba(217, 119, 6, 0.8)',
    statusCompletedColor: 'rgba(212, 175, 55, 0.8)',
  },
  cta: {
    startButtonBackground: 'linear-gradient(135deg, rgba(217, 119, 6, 0.9), rgba(180, 83, 9, 0.95))',
    startButtonBorder: 'rgba(251, 191, 36, 0.62)',
    startButtonColor: 'rgba(38, 38, 38, 0.9)',
    startButtonGlow: '0 2px 10px rgba(217, 119, 6, 0.28), inset 0 1px 0 rgba(251, 191, 36, 0.14)',
    collectButtonBackground: 'linear-gradient(135deg, rgba(217, 119, 6, 0.85), rgba(180, 83, 9, 0.9))',
    collectButtonBorder: 'rgba(251, 191, 36, 0.48)',
    collectButtonColor: 'rgba(38, 38, 38, 0.88)',
    collectButtonGlow: '0 0 14px rgba(217, 119, 6, 0.18)',
  },
  presetId: 'minimal-empire',
};

// ============================================================================
// BASE LAYOUT PRIMITIVES PRESET (GLOBAL DEFAULT)
// ============================================================================

/**
 * Base Layout Primitives preset - Obsidian + Azure + Gold
 * Clean minimal aesthetic with information clarity.
 * This is the global default template for all skin-aware components.
 */
export const BASE_LAYOUT_PRIMITIVES_PRESET: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    windowBackground: 'linear-gradient(160deg, rgba(6, 15, 22, 0.97) 0%, rgba(1, 12, 18, 0.99) 100%)',
    windowBorder: '1px solid rgba(223, 184, 87, 0.35)',
    frameGradient: 'linear-gradient(180deg, rgba(4, 24, 38, 0.96) 0%, rgba(2, 14, 22, 0.98) 50%, rgba(1, 10, 16, 0.99) 100%)',
    frameBorderGradient: 'linear-gradient(180deg, rgba(223, 184, 87, 0) 0%, rgba(223, 184, 87, 0.55) 12%, rgba(223, 184, 87, 0.55) 88%, rgba(223, 184, 87, 0) 100%)',
    frameCornerDecorations: 'rgba(223, 184, 87, 0.45)',
    dragHandleDotColor: 'rgba(0, 229, 255, 0.7)',
    closeButtonColor: 'rgba(223, 184, 87, 0.45)',
    closeButtonHoverColor: 'rgba(247, 240, 227, 0.88)',
  },
  poi: {
    crownGradient: 'linear-gradient(14% 4%, #dfb857 0%, #c9a040 9%, #a07828 28%, #7a5818 52%, #5a3c08 76%, #3a2408 100%)',
    idleColor: 'rgba(0, 200, 180, 0.85)',
    activeColor: 'rgba(0, 229, 255, 0.9)',
    completedColor: 'rgba(75, 196, 168, 0.9)',
    poiGlow: '0 0 22px rgba(0, 229, 255, 0.35)',
  },
  header: {
    nameColor: 'rgba(247, 240, 227, 0.95)',
    typeColor: 'rgba(0, 229, 255, 0.55)',
    statusActiveColor: 'rgba(0, 229, 255, 0.8)',
    statusCompletedColor: 'rgba(75, 196, 168, 0.85)',
  },
  cta: {
    startButtonBackground: 'linear-gradient(135deg, rgba(58, 36, 8, 0.92), rgba(42, 24, 4, 0.96))',
    startButtonBorder: 'rgba(223, 184, 87, 0.65)',
    startButtonColor: 'rgba(247, 240, 227, 0.95)',
    startButtonGlow: '0 2px 12px rgba(223, 184, 87, 0.25), inset 0 1px 0 rgba(223, 184, 87, 0.12)',
    collectButtonBackground: 'linear-gradient(135deg, rgba(0, 180, 160, 0.85), rgba(0, 140, 120, 0.9))',
    collectButtonBorder: 'rgba(0, 229, 255, 0.5)',
    collectButtonColor: 'rgba(247, 240, 227, 0.92)',
    collectButtonGlow: '0 0 14px rgba(0, 229, 255, 0.18)',
  },
  presetId: 'base',
};

// ============================================================================
// THEMED PRESETS
// ============================================================================

/**
 * Wanderlust preset - V9 Oily Prismatic Bronze & Wilderness Green
 * Verde smeraldo profondo + bronzo oro + iridescenza teal
 */
export const WANDERLUST_PRESET: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    windowBackground: 'linear-gradient(160deg, rgba(2, 22, 18, 0.97) 0%, rgba(1, 12, 10, 0.99) 100%)',
    windowBorder: '1px solid rgba(223, 184, 87, 0.35)',
    frameGradient: 'linear-gradient(180deg, rgba(4, 32, 24, 0.96) 0%, rgba(2, 16, 12, 0.98) 50%, rgba(1, 10, 8, 0.99) 100%)',
    frameBorderGradient: 'linear-gradient(180deg, rgba(223, 184, 87, 0) 0%, rgba(223, 184, 87, 0.55) 12%, rgba(223, 184, 87, 0.55) 88%, rgba(223, 184, 87, 0) 100%)',
    frameCornerDecorations: 'rgba(223, 184, 87, 0.45)',
    dragHandleDotColor: 'rgba(0, 229, 255, 0.7)',
    closeButtonColor: 'rgba(223, 184, 87, 0.45)',
    closeButtonHoverColor: 'rgba(247, 240, 227, 0.88)',
  },
  poi: {
    crownGradient: 'linear-gradient(14% 4%, #dfb857 0%, #c9a040 9%, #a07828 28%, #7a5818 52%, #5a3c08 76%, #3a2408 100%)',
    idleColor: 'rgba(0, 200, 180, 0.85)',
    activeColor: 'rgba(0, 229, 255, 0.9)',
    completedColor: 'rgba(75, 196, 168, 0.9)',
    poiGlow: '0 0 22px rgba(0, 229, 255, 0.35)',
  },
  header: {
    nameColor: 'rgba(247, 240, 227, 0.95)',
    typeColor: 'rgba(0, 229, 255, 0.55)',
    statusActiveColor: 'rgba(0, 229, 255, 0.8)',
    statusCompletedColor: 'rgba(75, 196, 168, 0.85)',
  },
  cta: {
    startButtonBackground: 'linear-gradient(135deg, rgba(58, 36, 8, 0.92), rgba(42, 24, 4, 0.96))',
    startButtonBorder: 'rgba(223, 184, 87, 0.65)',
    startButtonColor: 'rgba(247, 240, 227, 0.95)',
    startButtonGlow: '0 2px 12px rgba(223, 184, 87, 0.25), inset 0 1px 0 rgba(223, 184, 87, 0.12)',
    collectButtonBackground: 'linear-gradient(135deg, rgba(0, 180, 160, 0.85), rgba(0, 140, 120, 0.9))',
    collectButtonBorder: 'rgba(0, 229, 255, 0.5)',
    collectButtonColor: 'rgba(247, 240, 227, 0.92)',
    collectButtonGlow: '0 0 14px rgba(0, 229, 255, 0.18)',
  },
  presetId: 'wanderlust',
};

/**
 * Arcane Tech preset - magical technology theme
 */
export const ARCANE_TECH_PRESET: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    windowBackground: 'linear-gradient(135deg, rgba(6, 182, 212, 0.96) 0%, rgba(8, 145, 178, 0.98) 100%)',
    windowBorder: '1px solid rgba(34, 211, 238, 0.3)',
    frameGradient: 'linear-gradient(0% 0%, #164e63 0%, #0e7490 30%, #155e75 70%, #083344 100%)',
    frameBorderGradient: 'linear-gradient(0% 0%, rgba(34, 211, 238, 0) 0%, rgba(34, 211, 238, 0.55) 12%, rgba(34, 211, 238, 0.55) 88%, rgba(34, 211, 238, 0) 100%)',
    frameCornerDecorations: 'rgba(103, 232, 249, 0.42)',
    dragHandleDotColor: 'rgba(103, 232, 249, 0.8)',
    closeButtonColor: 'rgba(103, 232, 249, 0.48)',
    closeButtonHoverColor: 'rgba(165, 243, 252, 0.82)',
  },
  poi: {
    crownGradient: 'linear-gradient(14% 4%, #67e8f9 0%, #22d3ee 9%, #06b6d4 28%, #0891b2 52%, #0e7490 76%, #155e75 100%)',
    idleColor: 'rgba(6, 182, 212, 0.9)',
    activeColor: 'rgba(34, 211, 238, 0.9)',
    completedColor: 'rgba(72, 230, 105, 0.9)',
    poiGlow: '0 0 20px rgba(6, 182, 212, 0.4)',
  },
  header: {
    nameColor: 'rgba(240, 249, 255, 0.92)',
    typeColor: 'rgba(207, 250, 254, 0.55)',
    statusActiveColor: 'rgba(6, 182, 212, 0.8)',
    statusCompletedColor: 'rgba(72, 230, 105, 0.8)',
  },
  cta: {
    startButtonBackground: 'linear-gradient(135deg, rgba(6, 182, 212, 0.9), rgba(8, 145, 178, 0.95))',
    startButtonBorder: 'rgba(103, 232, 249, 0.62)',
    startButtonColor: 'rgba(240, 249, 255, 0.9)',
    startButtonGlow: '0 2px 10px rgba(6, 182, 212, 0.28), inset 0 1px 0 rgba(103, 232, 249, 0.14)',
    collectButtonBackground: 'linear-gradient(135deg, rgba(6, 182, 212, 0.85), rgba(8, 145, 178, 0.9))',
    collectButtonBorder: 'rgba(103, 232, 249, 0.48)',
    collectButtonColor: 'rgba(240, 249, 255, 0.88)',
    collectButtonGlow: '0 0 14px rgba(6, 182, 212, 0.18)',
  },
  presetId: 'arcane-tech',
};

/**
 * Gilded Observatory preset - luxury astronomy theme
 */
export const GILDED_OBSERVATORY_PRESET: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    windowBackground: 'linear-gradient(135deg, rgba(217, 119, 6, 0.96) 0%, rgba(180, 83, 9, 0.98) 100%)',
    windowBorder: '1px solid rgba(251, 191, 36, 0.3)',
    frameGradient: 'linear-gradient(0% 0%, #92400e 0%, #b45309 30%, #78350f 70%, #451a03 100%)',
    frameBorderGradient: 'linear-gradient(0% 0%, rgba(251, 191, 36, 0) 0%, rgba(251, 191, 36, 0.55) 12%, rgba(251, 191, 36, 0.55) 88%, rgba(251, 191, 36, 0) 100%)',
    frameCornerDecorations: 'rgba(252, 211, 77, 0.42)',
    dragHandleDotColor: 'rgba(254, 240, 138, 0.8)',
    closeButtonColor: 'rgba(254, 240, 138, 0.48)',
    closeButtonHoverColor: 'rgba(254, 252, 232, 0.82)',
  },
  poi: {
    crownGradient: 'linear-gradient(14% 4%, #fef3c7 0%, #fde68a 9%, #fcd34d 28%, #fbbf24 52%, #f59e0b 76%, #d97706 100%)',
    idleColor: 'rgba(251, 191, 36, 0.9)',
    activeColor: 'rgba(254, 240, 138, 0.9)',
    completedColor: 'rgba(72, 230, 105, 0.9)',
    poiGlow: '0 0 20px rgba(251, 191, 36, 0.4)',
  },
  header: {
    nameColor: 'rgba(255, 251, 235, 0.92)',
    typeColor: 'rgba(254, 243, 199, 0.55)',
    statusActiveColor: 'rgba(251, 191, 36, 0.8)',
    statusCompletedColor: 'rgba(72, 230, 105, 0.8)',
  },
  cta: {
    startButtonBackground: 'linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(217, 119, 6, 0.95))',
    startButtonBorder: 'rgba(254, 240, 138, 0.62)',
    startButtonColor: 'rgba(45, 45, 45, 0.9)',
    startButtonGlow: '0 2px 10px rgba(251, 191, 36, 0.28), inset 0 1px 0 rgba(254, 240, 138, 0.14)',
    collectButtonBackground: 'linear-gradient(135deg, rgba(251, 191, 36, 0.85), rgba(217, 119, 6, 0.9))',
    collectButtonBorder: 'rgba(254, 240, 138, 0.48)',
    collectButtonColor: 'rgba(45, 45, 45, 0.88)',
    collectButtonGlow: '0 0 14px rgba(251, 191, 36, 0.18)',
  },
  presetId: 'gilded-observatory',
};

// ============================================================================
// EXPERIMENTAL PRESETS
// ============================================================================

/**
 * Neon Cyber preset - futuristic cyberpunk theme
 */
export const NEON_CYBER_PRESET: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    windowBackground: 'linear-gradient(135deg, rgba(236, 72, 153, 0.96) 0%, rgba(219, 39, 119, 0.98) 100%)',
    windowBorder: '1px solid rgba(244, 114, 182, 0.3)',
    frameGradient: 'linear-gradient(0% 0%, #9f1239 0%, #be185d 30%, #881337 70%, #500724 100%)',
    frameBorderGradient: 'linear-gradient(0% 0%, rgba(244, 114, 182, 0) 0%, rgba(244, 114, 182, 0.55) 12%, rgba(244, 114, 182, 0.55) 88%, rgba(244, 114, 182, 0) 100%)',
    frameCornerDecorations: 'rgba(251, 207, 232, 0.42)',
    dragHandleDotColor: 'rgba(251, 207, 232, 0.8)',
    closeButtonColor: 'rgba(251, 207, 232, 0.48)',
    closeButtonHoverColor: 'rgba(252, 231, 243, 0.82)',
  },
  poi: {
    crownGradient: 'linear-gradient(14% 4%, #fbcfe8 0%, #f9a8d4 9%, #ec4899 28%, #db2777 52%, #be185d 76%, #9f1239 100%)',
    idleColor: 'rgba(236, 72, 153, 0.9)',
    activeColor: 'rgba(244, 114, 182, 0.9)',
    completedColor: 'rgba(72, 230, 105, 0.9)',
    poiGlow: '0 0 20px rgba(236, 72, 153, 0.4)',
  },
  header: {
    nameColor: 'rgba(253, 244, 255, 0.92)',
    typeColor: 'rgba(251, 207, 232, 0.55)',
    statusActiveColor: 'rgba(236, 72, 153, 0.8)',
    statusCompletedColor: 'rgba(72, 230, 105, 0.8)',
  },
  cta: {
    startButtonBackground: 'linear-gradient(135deg, rgba(236, 72, 153, 0.9), rgba(219, 39, 119, 0.95))',
    startButtonBorder: 'rgba(251, 207, 232, 0.62)',
    startButtonColor: 'rgba(253, 244, 255, 0.9)',
    startButtonGlow: '0 2px 10px rgba(236, 72, 153, 0.28), inset 0 1px 0 rgba(251, 207, 232, 0.14)',
    collectButtonBackground: 'linear-gradient(135deg, rgba(236, 72, 153, 0.85), rgba(219, 39, 119, 0.9))',
    collectButtonBorder: 'rgba(251, 207, 232, 0.48)',
    collectButtonColor: 'rgba(253, 244, 255, 0.88)',
    collectButtonGlow: '0 0 14px rgba(236, 72, 153, 0.18)',
  },
  presetId: 'neon-cyber',
};

/**
 * Shadow Realm preset - dark mystical theme
 */
export const SHADOW_REALM_PRESET: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    windowBackground: 'linear-gradient(135deg, rgba(88, 28, 135, 0.96) 0%, rgba(76, 29, 149, 0.98) 100%)',
    windowBorder: '1px solid rgba(147, 51, 234, 0.3)',
    frameGradient: 'linear-gradient(0% 0%, #4c1d95 0%, #5b21b6 30%, #4a044e 70%, #2e1065 100%)',
    frameBorderGradient: 'linear-gradient(0% 0%, rgba(147, 51, 234, 0) 0%, rgba(147, 51, 234, 0.55) 12%, rgba(147, 51, 234, 0.55) 88%, rgba(147, 51, 234, 0) 100%)',
    frameCornerDecorations: 'rgba(196, 181, 253, 0.42)',
    dragHandleDotColor: 'rgba(196, 181, 253, 0.8)',
    closeButtonColor: 'rgba(196, 181, 253, 0.48)',
    closeButtonHoverColor: 'rgba(221, 214, 254, 0.82)',
  },
  poi: {
    crownGradient: 'linear-gradient(14% 4%, #e9d5ff 0%, #d8b4fe 9%, #c084fc 28%, #a855f7 52%, #9333ea 76%, #7c3aed 100%)',
    idleColor: 'rgba(147, 51, 234, 0.9)',
    activeColor: 'rgba(196, 181, 253, 0.9)',
    completedColor: 'rgba(72, 230, 105, 0.9)',
    poiGlow: '0 0 20px rgba(147, 51, 234, 0.4)',
  },
  header: {
    nameColor: 'rgba(250, 245, 255, 0.92)',
    typeColor: 'rgba(233, 213, 255, 0.55)',
    statusActiveColor: 'rgba(147, 51, 234, 0.8)',
    statusCompletedColor: 'rgba(72, 230, 105, 0.8)',
  },
  cta: {
    startButtonBackground: 'linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(124, 58, 237, 0.95))',
    startButtonBorder: 'rgba(196, 181, 253, 0.62)',
    startButtonColor: 'rgba(250, 245, 255, 0.9)',
    startButtonGlow: '0 2px 10px rgba(147, 51, 234, 0.28), inset 0 1px 0 rgba(196, 181, 253, 0.14)',
    collectButtonBackground: 'linear-gradient(135deg, rgba(147, 51, 234, 0.85), rgba(124, 58, 237, 0.9))',
    collectButtonBorder: 'rgba(196, 181, 253, 0.48)',
    collectButtonColor: 'rgba(250, 245, 255, 0.88)',
    collectButtonGlow: '0 0 14px rgba(147, 51, 234, 0.18)',
  },
  presetId: 'shadow-realm',
};

// ============================================================================
// MOTION LEVEL ADAPTATIONS
// ============================================================================

/**
 * Minimal motion adaptations
 */
export const MINIMAL_MOTION_ADAPTATIONS: Partial<ActivityCapsuleDetailSkinConfig> = {
  animation: {
    windowEntryAnimation: 'fade',
    windowEntryDuration: '0.2s',
    windowEntryEasing: 'ease-out',
    windowExitAnimation: 'fade',
    windowExitDuration: '0.2s',
    windowExitEasing: 'ease-in',
    poiIdleAnimation: 'none',
    poiIdleDuration: '0s',
    poiActiveAnimation: 'none',
    poiActiveDuration: '0s',
    poiCompletedAnimation: 'none',
    poiCompletedDuration: '0s',
    slotIdleAnimation: 'none',
    slotIdleDuration: '0s',
    slotActiveAnimation: 'none',
    slotActiveDuration: '0s',
    slotProgressAnimation: 'stepped',
    slotProgressDuration: '0.1s',
    progressAnimation: 'stepped',
    progressDuration: '0.1s',
    progressEasing: 'linear',
    progressPulseAnimation: 'none',
    progressPulseDuration: '0s',
    progressPulseIntensity: 0,
    uiAnimationDuration: '0.1s',
    uiAnimationEasing: 'linear',
    hoverAnimationDuration: '0.1s',
    hoverAnimationEasing: 'linear',
    clickAnimationDuration: '0.05s',
    clickAnimationEasing: 'linear',
    motionLevel: 'minimal',
  },
  poi: {
    entryAnimation: 'none',
    entryDuration: '0s',
    entryEasing: 'linear',
    hoverAnimation: 'none',
    hoverScale: 1,
    clickAnimation: 'none',
    clickScale: 1,
  },
  slotRack: {
    slotEntryAnimation: 'none',
    slotEntryDuration: '0s',
    slotEntryEasing: 'linear',
    slotHoverAnimation: 'none',
    slotHoverScale: 1,
    slotClickAnimation: 'none',
    slotClickScale: 1,
  },
  cta: {
    buttonHoverAnimation: 'none',
    buttonActiveScale: 1,
    buttonDisabledScale: 1,
  },
};

/**
 * Reduced motion adaptations
 */
export const REDUCED_MOTION_ADAPTATIONS: Partial<ActivityCapsuleDetailSkinConfig> = {
  animation: {
    windowEntryAnimation: 'fade',
    windowEntryDuration: '0.3s',
    windowEntryEasing: 'ease-out',
    windowExitAnimation: 'fade',
    windowExitDuration: '0.3s',
    windowExitEasing: 'ease-in',
    poiIdleAnimation: 'none',
    poiIdleDuration: '0s',
    poiActiveAnimation: 'none',
    poiActiveDuration: '0s',
    poiCompletedAnimation: 'none',
    poiCompletedDuration: '0s',
    slotIdleAnimation: 'none',
    slotIdleDuration: '0s',
    slotActiveAnimation: 'none',
    slotActiveDuration: '0s',
    slotProgressAnimation: 'stepped',
    slotProgressDuration: '0.15s',
    progressAnimation: 'stepped',
    progressDuration: '0.15s',
    progressEasing: 'linear',
    progressPulseAnimation: 'none',
    progressPulseDuration: '0s',
    progressPulseIntensity: 0,
    uiAnimationDuration: '0.2s',
    uiAnimationEasing: 'ease',
    hoverAnimationDuration: '0.15s',
    hoverAnimationEasing: 'ease',
    clickAnimationDuration: '0.1s',
    clickAnimationEasing: 'ease',
    motionLevel: 'reduced',
  },
  poi: {
    entryAnimation: 'fade',
    entryDuration: '0.2s',
    entryEasing: 'ease-out',
    hoverAnimation: 'none',
    hoverScale: 1,
    clickAnimation: 'none',
    clickScale: 1,
  },
  slotRack: {
    slotEntryAnimation: 'fade',
    slotEntryDuration: '0.2s',
    slotEntryEasing: 'ease-out',
    slotHoverAnimation: 'none',
    slotHoverScale: 1,
    slotClickAnimation: 'none',
    slotClickScale: 1,
  },
  cta: {
    buttonHoverAnimation: 'none',
    buttonActiveScale: 0.98,
    buttonDisabledScale: 1,
  },
};

// ============================================================================
// PRESET REGISTRY
// ============================================================================

/**
 * Complete preset registry
 */
export const ACTIVITY_CAPSULE_DETAIL_SKIN_PRESETS: Record<SkinPresetId, Partial<ActivityCapsuleDetailSkinConfig>> = {
  'base': BASE_LAYOUT_PRIMITIVES_PRESET,
  'minimal-frontier': MINIMAL_FRONTIER_PRESET,
  'minimal-wilderness': MINIMAL_WILDERNESS_PRESET,
  'minimal-empire': MINIMAL_EMPIRE_PRESET,
  'wanderlust': WANDERLUST_PRESET,
  'arcane-tech': ARCANE_TECH_PRESET,
  'gilded-observatory': GILDED_OBSERVATORY_PRESET,
  'neon-cyber': NEON_CYBER_PRESET,
  'shadow-realm': SHADOW_REALM_PRESET,
};

/**
 * Motion level adaptations registry
 */
export const MOTION_LEVEL_ADAPTATIONS: Record<MotionLevel, Partial<ActivityCapsuleDetailSkinConfig>> = {
  minimal: MINIMAL_MOTION_ADAPTATIONS,
  reduced: REDUCED_MOTION_ADAPTATIONS,
  full: {},
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get preset by ID
 */
export function getActivityCapsuleDetailSkinPreset(
  presetId: SkinPresetId
): Partial<ActivityCapsuleDetailSkinConfig> {
  return ACTIVITY_CAPSULE_DETAIL_SKIN_PRESETS[presetId] || {};
}

/**
 * Get motion level adaptations
 */
export function getActivityCapsuleDetailMotionAdaptations(
  motionLevel: MotionLevel
): Partial<ActivityCapsuleDetailSkinConfig> {
  return MOTION_LEVEL_ADAPTATIONS[motionLevel] || {};
}

/**
 * Get complete skin configuration with preset and motion adaptations
 */
export function getActivityCapsuleDetailSkinConfigWithPreset(
  presetId: SkinPresetId,
  pillar?: StyleLabPillar,
  motionLevel: MotionLevel = 'full',
  customOverrides?: Partial<ActivityCapsuleDetailSkinConfig>
): ActivityCapsuleDetailSkinConfig {
  const baseConfig = { ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG };
  
  // Apply preset
  const preset = getActivityCapsuleDetailSkinPreset(presetId);
  let config = mergeActivityCapsuleDetailSkinConfig(baseConfig, preset);
  
  // Apply pillar-specific overrides
  if (pillar && pillar !== 'frontier') {
    const pillarOverrides = config[pillar];
    if (pillarOverrides) {
      config = mergeActivityCapsuleDetailSkinConfig(config, pillarOverrides);
    }
    config.pillar = pillar;
  }
  
  // Apply motion level adaptations
  const motionAdaptations = getActivityCapsuleDetailMotionAdaptations(motionLevel);
  config = mergeActivityCapsuleDetailSkinConfig(config, motionAdaptations);
  
  // Apply custom overrides
  if (customOverrides) {
    config = mergeActivityCapsuleDetailSkinConfig(config, customOverrides);
  }
  
  // Set metadata
  config.presetId = presetId;
  config.motionLevel = motionLevel;
  
  return config;
}

/**
 * Search presets by keywords
 */
export function searchActivityCapsuleDetailSkinPresets(
  keywords: string[]
): SkinPresetId[] {
  const presetEntries = Object.entries(ACTIVITY_CAPSULE_DETAIL_SKIN_PRESETS);
  
  return presetEntries
    .filter(([presetId, preset]) => {
      const presetText = `${presetId} ${JSON.stringify(preset)}`.toLowerCase();
      return keywords.some(keyword => presetText.includes(keyword.toLowerCase()));
    })
    .map(([presetId]) => presetId as SkinPresetId);
}

/**
 * Get recommended presets based on context
 */
export function getRecommendedActivityCapsuleDetailSkinPresets(
  pillar: StyleLabPillar,
  motionLevel: MotionLevel = 'full'
): SkinPresetId[] {
  const baseRecommendations: Record<StyleLabPillar, SkinPresetId[]> = {
    frontier: ['minimal-frontier', 'arcane-tech', 'wanderlust'],
    wilderness: ['minimal-wilderness', 'wanderlust', 'gilded-observatory'],
    empire: ['minimal-empire', 'gilded-observatory', 'neon-cyber'],
  };
  
  const motionFiltered = motionLevel === 'minimal' 
    ? baseRecommendations[pillar].filter(id => id.startsWith('minimal-'))
    : baseRecommendations[pillar];
  
  return motionFiltered;
}

/**
 * Validate preset compatibility
 */
export function validateActivityCapsuleDetailSkinPreset(
  presetId: SkinPresetId,
  pillar?: StyleLabPillar,
  motionLevel?: MotionLevel
): boolean {
  const preset = getActivityCapsuleDetailSkinPreset(presetId);
  
  if (!preset || Object.keys(preset).length === 0) {
    return false;
  }
  
  // Check pillar compatibility
  if (pillar && preset.pillar && preset.pillar !== pillar) {
    return false;
  }
  
  // Check motion level compatibility
  if (motionLevel && preset.animation?.motionLevel) {
    const presetMotion = preset.animation.motionLevel;
    if (presetMotion === 'minimal' && motionLevel !== 'minimal') return false;
    if (presetMotion === 'reduced' && motionLevel === 'full') return false;
  }
  
  return true;
}

/**
 * Export preset configuration as JSON
 */
export function exportActivityCapsuleDetailSkinPreset(
  presetId: SkinPresetId
): string {
  const preset = getActivityCapsuleDetailSkinPreset(presetId);
  return JSON.stringify(preset, null, 2);
}

/**
 * Import preset configuration from JSON
 */
export function importActivityCapsuleDetailSkinPreset(
  presetJson: string,
  presetId: SkinPresetId
): boolean {
  try {
    const preset = JSON.parse(presetJson);
    
    // Basic validation
    if (!preset || typeof preset !== 'object') {
      return false;
    }
    
    // Store in registry (in a real implementation, this would persist)
    ACTIVITY_CAPSULE_DETAIL_SKIN_PRESETS[presetId] = preset;
    
    return true;
  } catch (error) {
    console.error('Failed to import ActivityCapsuleDetail skin preset:', error);
    return false;
  }
}

/**
 * Get preset metadata
 */
export function getActivityCapsuleDetailSkinPresetMetadata(
  presetId: SkinPresetId
): {
  id: SkinPresetId;
  name: string;
  description: string;
  category: 'minimal' | 'themed' | 'experimental';
  pillar?: StyleLabPillar;
  motionLevel?: MotionLevel;
  tags: string[];
} {
  const metadata: Record<SkinPresetId, any> = {
    'minimal-frontier': {
      name: 'Minimal Frontier',
      description: 'Clean, functional design with blue accents',
      category: 'minimal',
      pillar: 'frontier',
      tags: ['clean', 'functional', 'blue'],
    },
    'minimal-wilderness': {
      name: 'Minimal Wilderness',
      description: 'Nature-inspired design with green accents',
      category: 'minimal',
      pillar: 'wilderness',
      tags: ['nature', 'green', 'organic'],
    },
    'minimal-empire': {
      name: 'Minimal Empire',
      description: 'Imperial design with gold accents',
      category: 'minimal',
      pillar: 'empire',
      tags: ['imperial', 'gold', 'elegant'],
    },
    'wanderlust': {
      name: 'Wanderlust',
      description: 'Adventure theme with purple accents',
      category: 'themed',
      tags: ['adventure', 'purple', 'mystical'],
    },
    'arcane-tech': {
      name: 'Arcane Tech',
      description: 'Magical technology theme with cyan accents',
      category: 'themed',
      tags: ['technology', 'magic', 'cyan'],
    },
    'gilded-observatory': {
      name: 'Gilded Observatory',
      description: 'Luxury astronomy theme with gold accents',
      category: 'themed',
      tags: ['luxury', 'astronomy', 'gold'],
    },
    'neon-cyber': {
      name: 'Neon Cyber',
      description: 'Futuristic cyberpunk theme with pink accents',
      category: 'experimental',
      tags: ['cyberpunk', 'futuristic', 'pink'],
    },
    'shadow-realm': {
      name: 'Shadow Realm',
      description: 'Dark mystical theme with purple accents',
      category: 'experimental',
      tags: ['dark', 'mystical', 'purple'],
    },
  };
  
  return {
    id: presetId,
    ...metadata[presetId],
  };
}

export default ACTIVITY_CAPSULE_DETAIL_SKIN_PRESETS;
