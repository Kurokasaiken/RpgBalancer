/**
 * WL-STY-011: ActivityCapsuleDetail Skin Schema (TS-Series Integration)
 * 
 * Advanced TS-Series schema for ActivityCapsuleDetail component with full
 * integration to the TS-Series skin system. Provides comprehensive
 * theming for window, POI, slots, telemetry, and CTA elements.
 * 
 * Dependencies: TS-001 (SkinSchema), TS-002 (SkinSlot), Style Lab tokens
 * Integration: useSkinSystem, SkinRegistry, telemetry, persistence
 */

import { z } from 'zod';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
  ComponentSkinBinding,
  SkinValidationResult
} from '../SkinSchema';

// ============================================================================
// ACTIVITY CAPSULE DETAIL SKIN CONFIGURATION TYPES
// ============================================================================

/**
 * Window frame and container configuration
 */
export interface ActivityCapsuleDetailWindowConfig {
  /** Window appearance */
  windowBackground: string;
  windowBorder: string;
  windowBorderRadius: string;
  windowBoxShadow: string;
  windowWidth: string;
  windowMinHeight: string;
  windowMaxWidth: string;
  windowBackdrop: string;
  
  /** Window frame decorations */
  frameGradient: string;
  frameBorderGradient: string;
  frameCornerDecorations: string;
  frameNoiseFilter: string;
  frameAmbientGlow: string;
  
  /** Window header */
  headerHeight: string;
  headerBackground: string;
  headerBorder: string;
  headerPadding: string;
  
  /** Drag handle */
  dragHandleHeight: string;
  dragHandleBackground: string;
  dragHandleDots: string;
  dragHandleDotSize: string;
  dragHandleDotColor: string;
  
  /** Close button */
  closeButtonSize: string;
  closeButtonBackground: string;
  closeButtonColor: string;
  closeButtonHoverColor: string;
  closeButtonBorderRadius: string;
  
  /** Window content */
  contentPadding: string;
  contentBackground: string;
  contentBorderRadius: string;
  
  /** Responsive behavior */
  mobileWindowWidth: string;
  mobileContentPadding: string;
  compactWindowWidth: string;
}

/**
 * POI (Point of Interest) configuration
 */
export interface ActivityCapsuleDetailPOIConfig {
  /** POI appearance */
  poiSize: string;
  poiBackground: string;
  poiBorder: string;
  poiBorderRadius: string;
  poiGlow: string;
  poiShadow: string;
  
  /** POI crown/rim */
  crownGradient: string;
  crownBorder: string;
  crownWidth: string;
  crownAnimation: string;
  crownBreathAnimation: string;
  
  /** POI core/stone */
  coreGradient: string;
  coreBorder: string;
  coreShadow: string;
  coreInnerGlow: string;
  
  /** POI progress ring */
  progressRingWidth: string;
  progressRingGradient: string;
  progressRingGlow: string;
  progressRingAnimation: string;
  progressRingCap: 'butt' | 'round';
  
  /** POI states */
  idleColor: string;
  activeColor: string;
  completedColor: string;
  blockedColor: string;
  
  /** POI animations */
  entryAnimation: string;
  entryDuration: string;
  entryEasing: string;
  hoverAnimation: string;
  hoverScale: number;
  clickAnimation: string;
  clickScale: number;
}

/**
 * Header section configuration
 */
export interface ActivityCapsuleDetailHeaderConfig {
  /** Header layout */
  headerLayout: 'horizontal' | 'vertical';
  headerGap: string;
  headerPadding: string;
  headerAlignment: 'flex-start' | 'center' | 'flex-end';
  
  /** Activity name */
  nameFont: string;
  nameFontSize: string;
  nameFontWeight: string;
  nameColor: string;
  nameLineHeight: string;
  nameLetterSpacing: string;
  nameTextTransform: string;
  nameTextShadow: string;
  
  /** Activity type/subtitle */
  typeFont: string;
  typeFontSize: string;
  typeFontWeight: string;
  typeColor: string;
  typeLineHeight: string;
  typeLetterSpacing: string;
  typeTextTransform: string;
  typeFontStyle: string;
  
  /** Status indicator */
  statusDotSize: string;
  statusDotBorderRadius: string;
  statusDotAnimation: string;
  statusDotGlow: string;
  statusFont: string;
  statusFontSize: string;
  statusFontWeight: string;
  statusLetterSpacing: string;
  statusTextTransform: string;
  
  /** Status colors */
  statusIdleColor: string;
  statusActiveColor: string;
  statusCompletedColor: string;
  statusBlockedColor: string;
  
  /** POI in header */
  headerPOISize: string;
  headerPOIMargin: string;
  headerPOIAlignment: 'left' | 'right';
}

/**
 * Ornament and divider configuration
 */
export interface ActivityCapsuleDetailOrnamentConfig {
  /** Ornament divider */
  ornamentHeight: string;
  ornamentMargin: string;
  ornamentAlignment: 'center' | 'left' | 'right';
  
  /** Ornament line */
  lineGradient: string;
  lineWidth: string;
  lineOpacity: number;
  
  /** Ornament center */
  centerShape: 'diamond' | 'circle' | 'square' | 'triangle';
  centerSize: string;
  centerColor: string;
  centerRotation: string;
  centerAnimation: string;
  
  /** Ornament spacing */
  sideGap: string;
  centerGap: string;
  
  /** Responsive ornaments */
  mobileOrnamentHeight: string;
  mobileLineOpacity: number;
}

/**
 * Information display configuration
 */
export interface ActivityCapsuleDetailInfoConfig {
  /** Info row layout */
  infoRowGap: string;
  infoRowPadding: string;
  infoRowBackground: string;
  infoRowBorder: string;
  infoRowBorderRadius: string;
  
  /** Info item layout */
  itemPadding: string;
  itemBackground: string;
  itemBorder: string;
  itemBorderRadius: string;
  itemFlex: string;
  
  /** Info separator */
  separatorWidth: string;
  separatorGradient: string;
  separatorOpacity: number;
  
  /** Info labels */
  labelFont: string;
  labelFontSize: string;
  labelFontWeight: string;
  labelColor: string;
  labelLetterSpacing: string;
  labelTextTransform: string;
  labelOpacity: number;
  
  /** Info values */
  valueFont: string;
  valueFontSize: string;
  valueFontWeight: string;
  valueColor: string;
  valueLineHeight: string;
  valueLetterSpacing: string;
  
  /** Special value styling */
  highlightValueColor: string;
  highlightValueGlow: string;
  highlightValueAnimation: string;
  
  /** Info icons */
  iconSize: string;
  iconColor: string;
  iconOpacity: number;
  iconMargin: string;
}

/**
 * Slot rack configuration
 */
export interface ActivityCapsuleDetailSlotRackConfig {
  /** Rack container */
  rackBackground: string;
  rackBorder: string;
  rackBorderRadius: string;
  rackPadding: string;
  rackGap: string;
  rackOverflow: 'scroll' | 'hidden' | 'visible';
  rackScrollbarWidth: string;
  rackScrollbarColor: string;
  
  /** Slot section label */
  sectionLabelFont: string;
  sectionLabelFontSize: string;
  sectionLabelFontWeight: string;
  sectionLabelColor: string;
  sectionLabelLetterSpacing: string;
  sectionLabelTextTransform: string;
  sectionLabelMargin: string;
  
  /** Slot container */
  slotSize: string;
  slotBorderRadius: string;
  slotBackground: string;
  slotBorder: string;
  slotPadding: string;
  slotGap: string;
  
  /** Slot cavity */
  cavityGradient: string;
  cavityBorder: string;
  cavityShadow: string;
  cavityInnerGlow: string;
  
  /** Slot medal/medallion */
  medalGradient: string;
  medalBorder: string;
  medalShadow: string;
  medalInnerGlow: string;
  medalAnimation: string;
  
  /** Slot portrait */
  portraitBackground: string;
  portraitBorder: string;
  portraitShadow: string;
  portraitVignette: string;
  
  /** Slot initials */
  initialsFont: string;
  initialsFontSize: string;
  initialsFontWeight: string;
  initialsColor: string;
  initialsLetterSpacing: string;
  initialsTextTransform: string;
  
  /** Slot progress ring */
  slotProgressWidth: string;
  slotProgressGradient: string;
  slotProgressGlow: string;
  slotProgressAnimation: string;
  
  /** Slot states */
  slotEmptyOpacity: number;
  slotGhostOpacity: number;
  slotIdleGlow: string;
  slotActiveGlow: string;
  slotCompletedGlow: string;
  slotLockedGlow: string;
  
  /** Slot animations */
  slotEntryAnimation: string;
  slotEntryDuration: string;
  slotEntryEasing: string;
  slotHoverAnimation: string;
  slotHoverScale: number;
  slotClickAnimation: string;
  slotClickScale: number;
  
  /** Slot interactions */
  slotCursor: 'pointer' | 'default';
  slotTransition: string;
  slotHoverGlow: string;
  slotActiveTransform: string;
}

/**
 * Telemetry log configuration
 */
export interface ActivityCapsuleDetailTelemetryConfig {
  /** Telemetry container */
  telemetryBackground: string;
  telemetryBorder: string;
  telemetryBorderRadius: string;
  telemetryPadding: string;
  telemetryGap: string;
  
  /** Telemetry header */
  telemetryLabelFont: string;
  telemetryLabelFontSize: string;
  telemetryLabelFontWeight: string;
  telemetryLabelColor: string;
  telemetryLabelLetterSpacing: string;
  telemetryLabelTextTransform: string;
  telemetryLabelMargin: string;
  
  /** Telemetry log */
  logBackground: string;
  logBorder: string;
  logBorderRadius: string;
  logPadding: string;
  logGap: string;
  logMaxHeight: string;
  logOverflow: 'scroll' | 'hidden' | 'auto';
  
  /** Log scrollbar */
  logScrollbarWidth: string;
  logScrollbarColor: string;
  logScrollbarTrack: string;
  
  /** Log entry */
  entryBackground: string;
  entryBorder: string;
  entryBorderRadius: string;
  entryPadding: string;
  entryGap: string;
  entryTransition: string;
  
  /** Entry hover */
  entryHoverBackground: string;
  entryHoverBorder: string;
  
  /** Entry timestamp */
  timestampFont: string;
  timestampFontSize: string;
  timestampFontWeight: string;
  timestampColor: string;
  timestampLetterSpacing: string;
  timestampMinWidth: string;
  
  /** Entry message */
  messageFont: string;
  messageFontSize: string;
  messageFontWeight: string;
  messageColor: string;
  messageLineHeight: string;
  messageFontStyle: string;
  
  /** Message emphasis */
  emphasisColor: string;
  emphasisFontWeight: string;
  
  /** Event types */
  eventAssignColor: string;
  eventStartColor: string;
  eventDoneColor: string;
  eventDetachColor: string;
  eventRejectColor: string;
  
  /** Empty state */
  emptyFont: string;
  emptyFontSize: string;
  emptyFontWeight: string;
  emptyColor: string;
  emptyFontStyle: string;
  emptyPadding: string;
}

/**
 * CTA (Call to Action) configuration
 */
export interface ActivityCapsuleDetailCTAConfig {
  /** CTA container */
  ctaContainerGap: string;
  ctaContainerMargin: string;
  ctaContainerPadding: string;
  
  /** Button appearance */
  buttonBackground: string;
  buttonBorder: string;
  buttonBorderRadius: string;
  buttonPadding: string;
  buttonMinHeight: string;
  buttonFlex: string;
  
  /** Button typography */
  buttonFont: string;
  buttonFontSize: string;
  buttonFontWeight: string;
  buttonColor: string;
  buttonLetterSpacing: string;
  buttonTextTransform: string;
  buttonLineHeight: string;
  
  /** Button states */
  buttonHoverBackground: string;
  buttonHoverBorder: string;
  buttonHoverColor: string;
  buttonActiveBackground: string;
  buttonActiveBorder: string;
  buttonActiveColor: string;
  buttonDisabledBackground: string;
  buttonDisabledBorder: string;
  buttonDisabledColor: string;
  buttonDisabledOpacity: number;
  
  /** Button animations */
  buttonTransition: string;
  buttonHoverAnimation: string;
  buttonActiveScale: number;
  buttonDisabledScale: number;
  
  /** Button effects */
  buttonShimmer: string;
  buttonShimmerAnimation: string;
  buttonGlow: string;
  buttonShadow: string;
  
  /** Specific button types */
  startButtonBackground: string;
  startButtonBorder: string;
  startButtonColor: string;
  startButtonGlow: string;
  
  cancelButtonBackground: string;
  cancelButtonBorder: string;
  cancelButtonColor: string;
  cancelButtonGlow: string;
  
  collectButtonBackground: string;
  collectButtonBorder: string;
  collectButtonColor: string;
  collectButtonGlow: string;
}

/**
 * Animation and motion configuration
 */
export interface ActivityCapsuleDetailAnimationConfig {
  /** Window animations */
  windowEntryAnimation: 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'none';
  windowEntryDuration: string;
  windowEntryEasing: string;
  windowExitAnimation: 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'none';
  windowExitDuration: string;
  windowExitEasing: string;
  
  /** POI animations */
  poiIdleAnimation: string;
  poiIdleDuration: string;
  poiActiveAnimation: string;
  poiActiveDuration: string;
  poiCompletedAnimation: string;
  poiCompletedDuration: string;
  
  /** Slot animations */
  slotIdleAnimation: string;
  slotIdleDuration: string;
  slotActiveAnimation: string;
  slotActiveDuration: string;
  slotProgressAnimation: string;
  slotProgressDuration: string;
  
  /** Progress animations */
  progressAnimation: 'smooth' | 'stepped' | 'elastic';
  progressDuration: string;
  progressEasing: string;
  progressPulseAnimation: string;
  progressPulseDuration: string;
  progressPulseIntensity: number;
  
  /** UI animations */
  uiAnimationDuration: string;
  uiAnimationEasing: string;
  hoverAnimationDuration: string;
  hoverAnimationEasing: string;
  clickAnimationDuration: string;
  clickAnimationEasing: string;
  
  /** Motion level adaptations */
  motionLevel: MotionLevel;
  reducedMotionConfig: Partial<ActivityCapsuleDetailAnimationConfig>;
}

/**
 * Typography configuration
 */
export interface ActivityCapsuleDetailTypographyConfig {
  /** Primary typography */
  primaryFont: string;
  primaryFontWeight: string;
  primaryLineHeight: string;
  primaryLetterSpacing: string;
  
  /** Secondary typography */
  secondaryFont: string;
  secondaryFontWeight: string;
  secondaryLineHeight: string;
  secondaryLetterSpacing: string;
  
  /** Monospace typography */
  monospaceFont: string;
  monospaceFontWeight: string;
  monospaceLineHeight: string;
  
  /** Display typography */
  displayFont: string;
  displayFontWeight: string;
  displayLineHeight: string;
  displayLetterSpacing: string;
  
  /** Text colors */
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textInverse: string;
  
  /** Text shadows */
  textShadowSmall: string;
  textShadowMedium: string;
  textShadowLarge: string;
  textShadowGlow: string;
  
  /** Font sizes */
  fontSizeXSmall: string;
  fontSizeSmall: string;
  fontSizeMedium: string;
  fontSizeLarge: string;
  fontSizeXLarge: string;
  
  /** Responsive typography */
  mobileFontSizeScale: number;
  compactFontSizeScale: number;
}

/**
 * Audio configuration
 */
export interface ActivityCapsuleDetailAudioConfig {
  /** Audio settings */
  enableAudio: boolean;
  masterVolume: number;
  effectVolume: number;
  
  /** Sound effects */
  assignSound: string;
  startSound: string;
  completeSound: string;
  cancelSound: string;
  detachSound: string;
  rejectSound: string;
  collectSound: string;
  hoverSound: string;
  clickSound: string;
  
  /** Audio parameters */
  soundFadeIn: string;
  soundFadeOut: string;
  soundPitch: number;
  soundDuration: string;
  
  /** Audio contexts */
  enableAudioContext: boolean;
  audioContextLatency: string;
}

/**
 * Accessibility configuration
 */
export interface ActivityCapsuleDetailAccessibilityConfig {
  /** Screen reader support */
  enableAriaLive: boolean;
  enableAriaLabels: boolean;
  enableAriaDescribedBy: boolean;
  enableAriaExpanded: boolean;
  
  /** Keyboard navigation */
  enableKeyboardNavigation: boolean;
  enableFocusIndicators: boolean;
  focusIndicatorStyle: string;
  focusIndicatorWidth: string;
  focusIndicatorColor: string;
  
  /** High contrast mode */
  highContrastMode: boolean;
  highContrastColors: Partial<ActivityCapsuleDetailWindowConfig>;
  
  /** Reduced motion */
  enableReducedMotion: boolean;
  reducedMotionFallbacks: Partial<ActivityCapsuleDetailAnimationConfig>;
  
  /** Screen reader announcements */
  announceActivityStart: boolean;
  announceActivityComplete: boolean;
  announceSlotAssign: boolean;
  announceSlotDetach: boolean;
  announceError: boolean;
  
  /** Color blind support */
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  colorBlindAdjustments: Record<string, string>;
}

/**
 * Complete ActivityCapsuleDetail TS-Series skin configuration
 */
export interface ActivityCapsuleDetailSkinConfig {
  /** Core configuration sections */
  window: ActivityCapsuleDetailWindowConfig;
  poi: ActivityCapsuleDetailPOIConfig;
  header: ActivityCapsuleDetailHeaderConfig;
  ornament: ActivityCapsuleDetailOrnamentConfig;
  info: ActivityCapsuleDetailInfoConfig;
  slotRack: ActivityCapsuleDetailSlotRackConfig;
  telemetry: ActivityCapsuleDetailTelemetryConfig;
  cta: ActivityCapsuleDetailCTAConfig;
  animation: ActivityCapsuleDetailAnimationConfig;
  typography: ActivityCapsuleDetailTypographyConfig;
  audio: ActivityCapsuleDetailAudioConfig;
  accessibility: ActivityCapsuleDetailAccessibilityConfig;
  
  /** Pillar-specific overrides */
  wilderness: Partial<ActivityCapsuleDetailSkinConfig>;
  empire: Partial<ActivityCapsuleDetailSkinConfig>;
  frontier: Partial<ActivityCapsuleDetailSkinConfig>;
  
  /** TS-Series integration */
  motionLevel: MotionLevel;
  pillar: StyleLabPillar;
  presetId: SkinPresetId;
  
  /** Feature flags */
  enableTelemetry: boolean;
  enableHotReload: boolean;
  enableValidation: boolean;
  enableDevTools: boolean;
  enableAudio: boolean;
  enableAnimations: boolean;
  enableDragAndDrop: boolean;
  
  /** Version and compatibility */
  version: string;
  compatibility: string[];
  lastModified: number;
}

// ============================================================================
// ZOD SCHEMAS FOR RUNTIME VALIDATION
// ============================================================================

export const ActivityCapsuleDetailWindowConfigSchema = z.object({
  windowBackground: z.string(),
  windowBorder: z.string(),
  windowBorderRadius: z.string(),
  windowBoxShadow: z.string(),
  windowWidth: z.string(),
  windowMinHeight: z.string(),
  windowMaxWidth: z.string(),
  windowBackdrop: z.string(),
  frameGradient: z.string(),
  frameBorderGradient: z.string(),
  frameCornerDecorations: z.string(),
  frameNoiseFilter: z.string(),
  frameAmbientGlow: z.string(),
  headerHeight: z.string(),
  headerBackground: z.string(),
  headerBorder: z.string(),
  headerPadding: z.string(),
  dragHandleHeight: z.string(),
  dragHandleBackground: z.string(),
  dragHandleDots: z.string(),
  dragHandleDotSize: z.string(),
  dragHandleDotColor: z.string(),
  closeButtonSize: z.string(),
  closeButtonBackground: z.string(),
  closeButtonColor: z.string(),
  closeButtonHoverColor: z.string(),
  closeButtonBorderRadius: z.string(),
  contentPadding: z.string(),
  contentBackground: z.string(),
  contentBorderRadius: z.string(),
  mobileWindowWidth: z.string(),
  mobileContentPadding: z.string(),
  compactWindowWidth: z.string(),
});

export const ActivityCapsuleDetailPOIConfigSchema = z.object({
  poiSize: z.string(),
  poiBackground: z.string(),
  poiBorder: z.string(),
  poiBorderRadius: z.string(),
  poiGlow: z.string(),
  poiShadow: z.string(),
  crownGradient: z.string(),
  crownBorder: z.string(),
  crownWidth: z.string(),
  crownAnimation: z.string(),
  crownBreathAnimation: z.string(),
  coreGradient: z.string(),
  coreBorder: z.string(),
  coreShadow: z.string(),
  coreInnerGlow: z.string(),
  progressRingWidth: z.string(),
  progressRingGradient: z.string(),
  progressRingGlow: z.string(),
  progressRingAnimation: z.string(),
  progressRingCap: z.enum(['butt', 'round']),
  idleColor: z.string(),
  activeColor: z.string(),
  completedColor: z.string(),
  blockedColor: z.string(),
  entryAnimation: z.string(),
  entryDuration: z.string(),
  entryEasing: z.string(),
  hoverAnimation: z.string(),
  hoverScale: z.number().min(0.8).max(1.2),
  clickAnimation: z.string(),
  clickScale: z.number().min(0.8).max(1.2),
});

export const ActivityCapsuleDetailHeaderConfigSchema = z.object({
  headerLayout: z.enum(['horizontal', 'vertical']),
  headerGap: z.string(),
  headerPadding: z.string(),
  headerAlignment: z.enum(['flex-start', 'center', 'flex-end']),
  nameFont: z.string(),
  nameFontSize: z.string(),
  nameFontWeight: z.string(),
  nameColor: z.string(),
  nameLineHeight: z.string(),
  nameLetterSpacing: z.string(),
  nameTextTransform: z.string(),
  nameTextShadow: z.string(),
  typeFont: z.string(),
  typeFontSize: z.string(),
  typeFontWeight: z.string(),
  typeColor: z.string(),
  typeLineHeight: z.string(),
  typeLetterSpacing: z.string(),
  typeTextTransform: z.string(),
  typeFontStyle: z.string(),
  statusDotSize: z.string(),
  statusDotBorderRadius: z.string(),
  statusDotAnimation: z.string(),
  statusDotGlow: z.string(),
  statusFont: z.string(),
  statusFontSize: z.string(),
  statusFontWeight: z.string(),
  statusLetterSpacing: z.string(),
  statusTextTransform: z.string(),
  statusIdleColor: z.string(),
  statusActiveColor: z.string(),
  statusCompletedColor: z.string(),
  statusBlockedColor: z.string(),
  headerPOISize: z.string(),
  headerPOIMargin: z.string(),
  headerPOIAlignment: z.enum(['left', 'right']),
});

export const ActivityCapsuleDetailOrnamentConfigSchema = z.object({
  ornamentHeight: z.string(),
  ornamentMargin: z.string(),
  ornamentAlignment: z.enum(['center', 'left', 'right']),
  lineGradient: z.string(),
  lineWidth: z.string(),
  lineOpacity: z.number().min(0).max(1),
  centerShape: z.enum(['diamond', 'circle', 'square', 'triangle']),
  centerSize: z.string(),
  centerColor: z.string(),
  centerRotation: z.string(),
  centerAnimation: z.string(),
  sideGap: z.string(),
  centerGap: z.string(),
  mobileOrnamentHeight: z.string(),
  mobileLineOpacity: z.number().min(0).max(1),
});

export const ActivityCapsuleDetailInfoConfigSchema = z.object({
  infoRowGap: z.string(),
  infoRowPadding: z.string(),
  infoRowBackground: z.string(),
  infoRowBorder: z.string(),
  infoRowBorderRadius: z.string(),
  itemPadding: z.string(),
  itemBackground: z.string(),
  itemBorder: z.string(),
  itemBorderRadius: z.string(),
  itemFlex: z.string(),
  separatorWidth: z.string(),
  separatorGradient: z.string(),
  separatorOpacity: z.number().min(0).max(1),
  labelFont: z.string(),
  labelFontSize: z.string(),
  labelFontWeight: z.string(),
  labelColor: z.string(),
  labelLetterSpacing: z.string(),
  labelTextTransform: z.string(),
  labelOpacity: z.number().min(0).max(1),
  valueFont: z.string(),
  valueFontSize: z.string(),
  valueFontWeight: z.string(),
  valueColor: z.string(),
  valueLineHeight: z.string(),
  valueLetterSpacing: z.string(),
  highlightValueColor: z.string(),
  highlightValueGlow: z.string(),
  highlightValueAnimation: z.string(),
  iconSize: z.string(),
  iconColor: z.string(),
  iconOpacity: z.number().min(0).max(1),
  iconMargin: z.string(),
});

export const ActivityCapsuleDetailSlotRackConfigSchema = z.object({
  rackBackground: z.string(),
  rackBorder: z.string(),
  rackBorderRadius: z.string(),
  rackPadding: z.string(),
  rackGap: z.string(),
  rackOverflow: z.enum(['scroll', 'hidden', 'visible']),
  rackScrollbarWidth: z.string(),
  rackScrollbarColor: z.string(),
  sectionLabelFont: z.string(),
  sectionLabelFontSize: z.string(),
  sectionLabelFontWeight: z.string(),
  sectionLabelColor: z.string(),
  sectionLabelLetterSpacing: z.string(),
  sectionLabelTextTransform: z.string(),
  sectionLabelMargin: z.string(),
  slotSize: z.string(),
  slotBorderRadius: z.string(),
  slotBackground: z.string(),
  slotBorder: z.string(),
  slotPadding: z.string(),
  slotGap: z.string(),
  cavityGradient: z.string(),
  cavityBorder: z.string(),
  cavityShadow: z.string(),
  cavityInnerGlow: z.string(),
  medalGradient: z.string(),
  medalBorder: z.string(),
  medalShadow: z.string(),
  medalInnerGlow: z.string(),
  medalAnimation: z.string(),
  portraitBackground: z.string(),
  portraitBorder: z.string(),
  portraitShadow: z.string(),
  portraitVignette: z.string(),
  initialsFont: z.string(),
  initialsFontSize: z.string(),
  initialsFontWeight: z.string(),
  initialsColor: z.string(),
  initialsLetterSpacing: z.string(),
  initialsTextTransform: z.string(),
  slotProgressWidth: z.string(),
  slotProgressGradient: z.string(),
  slotProgressGlow: z.string(),
  slotProgressAnimation: z.string(),
  slotEmptyOpacity: z.number().min(0).max(1),
  slotGhostOpacity: z.number().min(0).max(1),
  slotIdleGlow: z.string(),
  slotActiveGlow: z.string(),
  slotCompletedGlow: z.string(),
  slotLockedGlow: z.string(),
  slotEntryAnimation: z.string(),
  slotEntryDuration: z.string(),
  slotEntryEasing: z.string(),
  slotHoverAnimation: z.string(),
  slotHoverScale: z.number().min(0.8).max(1.2),
  slotClickAnimation: z.string(),
  slotClickScale: z.number().min(0.8).max(1.2),
  slotCursor: z.enum(['pointer', 'default']),
  slotTransition: z.string(),
  slotHoverGlow: z.string(),
  slotActiveTransform: z.string(),
});

export const ActivityCapsuleDetailTelemetryConfigSchema = z.object({
  telemetryBackground: z.string(),
  telemetryBorder: z.string(),
  telemetryBorderRadius: z.string(),
  telemetryPadding: z.string(),
  telemetryGap: z.string(),
  telemetryLabelFont: z.string(),
  telemetryLabelFontSize: z.string(),
  telemetryLabelFontWeight: z.string(),
  telemetryLabelColor: z.string(),
  telemetryLabelLetterSpacing: z.string(),
  telemetryLabelTextTransform: z.string(),
  telemetryLabelMargin: z.string(),
  logBackground: z.string(),
  logBorder: z.string(),
  logBorderRadius: z.string(),
  logPadding: z.string(),
  logGap: z.string(),
  logMaxHeight: z.string(),
  logOverflow: z.enum(['scroll', 'hidden', 'auto']),
  logScrollbarWidth: z.string(),
  logScrollbarColor: z.string(),
  logScrollbarTrack: z.string(),
  entryBackground: z.string(),
  entryBorder: z.string(),
  entryBorderRadius: z.string(),
  entryPadding: z.string(),
  entryGap: z.string(),
  entryTransition: z.string(),
  entryHoverBackground: z.string(),
  entryHoverBorder: z.string(),
  timestampFont: z.string(),
  timestampFontSize: z.string(),
  timestampFontWeight: z.string(),
  timestampColor: z.string(),
  timestampLetterSpacing: z.string(),
  timestampMinWidth: z.string(),
  messageFont: z.string(),
  messageFontSize: z.string(),
  messageFontWeight: z.string(),
  messageColor: z.string(),
  messageLineHeight: z.string(),
  messageFontStyle: z.string(),
  emphasisColor: z.string(),
  emphasisFontWeight: z.string(),
  eventAssignColor: z.string(),
  eventStartColor: z.string(),
  eventDoneColor: z.string(),
  eventDetachColor: z.string(),
  eventRejectColor: z.string(),
  emptyFont: z.string(),
  emptyFontSize: z.string(),
  emptyFontWeight: z.string(),
  emptyColor: z.string(),
  emptyFontStyle: z.string(),
  emptyPadding: z.string(),
});

export const ActivityCapsuleDetailCTAConfigSchema = z.object({
  ctaContainerGap: z.string(),
  ctaContainerMargin: z.string(),
  ctaContainerPadding: z.string(),
  buttonBackground: z.string(),
  buttonBorder: z.string(),
  buttonBorderRadius: z.string(),
  buttonPadding: z.string(),
  buttonMinHeight: z.string(),
  buttonFlex: z.string(),
  buttonFont: z.string(),
  buttonFontSize: z.string(),
  buttonFontWeight: z.string(),
  buttonColor: z.string(),
  buttonLetterSpacing: z.string(),
  buttonTextTransform: z.string(),
  buttonLineHeight: z.string(),
  buttonHoverBackground: z.string(),
  buttonHoverBorder: z.string(),
  buttonHoverColor: z.string(),
  buttonActiveBackground: z.string(),
  buttonActiveBorder: z.string(),
  buttonActiveColor: z.string(),
  buttonDisabledBackground: z.string(),
  buttonDisabledBorder: z.string(),
  buttonDisabledColor: z.string(),
  buttonDisabledOpacity: z.number().min(0).max(1),
  buttonTransition: z.string(),
  buttonHoverAnimation: z.string(),
  buttonActiveScale: z.number().min(0.8).max(1.0),
  buttonDisabledScale: z.number().min(0.8).max(1.0),
  buttonShimmer: z.string(),
  buttonShimmerAnimation: z.string(),
  buttonGlow: z.string(),
  buttonShadow: z.string(),
  startButtonBackground: z.string(),
  startButtonBorder: z.string(),
  startButtonColor: z.string(),
  startButtonGlow: z.string(),
  cancelButtonBackground: z.string(),
  cancelButtonBorder: z.string(),
  cancelButtonColor: z.string(),
  cancelButtonGlow: z.string(),
  collectButtonBackground: z.string(),
  collectButtonBorder: z.string(),
  collectButtonColor: z.string(),
  collectButtonGlow: z.string(),
});

export const ActivityCapsuleDetailAnimationConfigSchema = z.object({
  windowEntryAnimation: z.enum(['fade', 'scale', 'slide-up', 'slide-down', 'none']),
  windowEntryDuration: z.string(),
  windowEntryEasing: z.string(),
  windowExitAnimation: z.enum(['fade', 'scale', 'slide-up', 'slide-down', 'none']),
  windowExitDuration: z.string(),
  windowExitEasing: z.string(),
  poiIdleAnimation: z.string(),
  poiIdleDuration: z.string(),
  poiActiveAnimation: z.string(),
  poiActiveDuration: z.string(),
  poiCompletedAnimation: z.string(),
  poiCompletedDuration: z.string(),
  slotIdleAnimation: z.string(),
  slotIdleDuration: z.string(),
  slotActiveAnimation: z.string(),
  slotActiveDuration: z.string(),
  slotProgressAnimation: z.string(),
  slotProgressDuration: z.string(),
  progressAnimation: z.enum(['smooth', 'stepped', 'elastic']),
  progressDuration: z.string(),
  progressEasing: z.string(),
  progressPulseAnimation: z.string(),
  progressPulseDuration: z.string(),
  progressPulseIntensity: z.number().min(0).max(1),
  uiAnimationDuration: z.string(),
  uiAnimationEasing: z.string(),
  hoverAnimationDuration: z.string(),
  hoverAnimationEasing: z.string(),
  clickAnimationDuration: z.string(),
  clickAnimationEasing: z.string(),
  motionLevel: z.enum(['minimal', 'reduced', 'full']),
  reducedMotionConfig: z.object({}).passthrough().optional(),
});

export const ActivityCapsuleDetailTypographyConfigSchema = z.object({
  primaryFont: z.string(),
  primaryFontWeight: z.string(),
  primaryLineHeight: z.string(),
  primaryLetterSpacing: z.string(),
  secondaryFont: z.string(),
  secondaryFontWeight: z.string(),
  secondaryLineHeight: z.string(),
  secondaryLetterSpacing: z.string(),
  monospaceFont: z.string(),
  monospaceFontWeight: z.string(),
  monospaceLineHeight: z.string(),
  displayFont: z.string(),
  displayFontWeight: z.string(),
  displayLineHeight: z.string(),
  displayLetterSpacing: z.string(),
  textPrimary: z.string(),
  textSecondary: z.string(),
  textTertiary: z.string(),
  textDisabled: z.string(),
  textInverse: z.string(),
  textShadowSmall: z.string(),
  textShadowMedium: z.string(),
  textShadowLarge: z.string(),
  textShadowGlow: z.string(),
  fontSizeXSmall: z.string(),
  fontSizeSmall: z.string(),
  fontSizeMedium: z.string(),
  fontSizeLarge: z.string(),
  fontSizeXLarge: z.string(),
  mobileFontSizeScale: z.number().min(0.8).max(1.2),
  compactFontSizeScale: z.number().min(0.8).max(1.2),
});

export const ActivityCapsuleDetailAudioConfigSchema = z.object({
  enableAudio: z.boolean(),
  masterVolume: z.number().min(0).max(1),
  effectVolume: z.number().min(0).max(1),
  assignSound: z.string(),
  startSound: z.string(),
  completeSound: z.string(),
  cancelSound: z.string(),
  detachSound: z.string(),
  rejectSound: z.string(),
  collectSound: z.string(),
  hoverSound: z.string(),
  clickSound: z.string(),
  soundFadeIn: z.string(),
  soundFadeOut: z.string(),
  soundPitch: z.number().min(0.5).max(2.0),
  soundDuration: z.string(),
  enableAudioContext: z.boolean(),
  audioContextLatency: z.string(),
});

export const ActivityCapsuleDetailAccessibilityConfigSchema = z.object({
  enableAriaLive: z.boolean(),
  enableAriaLabels: z.boolean(),
  enableAriaDescribedBy: z.boolean(),
  enableAriaExpanded: z.boolean(),
  enableKeyboardNavigation: z.boolean(),
  enableFocusIndicators: z.boolean(),
  focusIndicatorStyle: z.string(),
  focusIndicatorWidth: z.string(),
  focusIndicatorColor: z.string(),
  highContrastMode: z.boolean(),
  highContrastColors: ActivityCapsuleDetailWindowConfigSchema.partial().optional(),
  enableReducedMotion: z.boolean(),
  reducedMotionFallbacks: ActivityCapsuleDetailAnimationConfigSchema.partial().optional(),
  announceActivityStart: z.boolean(),
  announceActivityComplete: z.boolean(),
  announceSlotAssign: z.boolean(),
  announceSlotDetach: z.boolean(),
  announceError: z.boolean(),
  colorBlindMode: z.enum(['none', 'protanopia', 'deuteranopia', 'tritanopia']),
  colorBlindAdjustments: z.record(z.string(), z.string()),
});

export const ActivityCapsuleDetailSkinConfigSchema = z.object({
  window: ActivityCapsuleDetailWindowConfigSchema,
  poi: ActivityCapsuleDetailPOIConfigSchema,
  header: ActivityCapsuleDetailHeaderConfigSchema,
  ornament: ActivityCapsuleDetailOrnamentConfigSchema,
  info: ActivityCapsuleDetailInfoConfigSchema,
  slotRack: ActivityCapsuleDetailSlotRackConfigSchema,
  telemetry: ActivityCapsuleDetailTelemetryConfigSchema,
  cta: ActivityCapsuleDetailCTAConfigSchema,
  animation: ActivityCapsuleDetailAnimationConfigSchema,
  typography: ActivityCapsuleDetailTypographyConfigSchema,
  audio: ActivityCapsuleDetailAudioConfigSchema,
  accessibility: ActivityCapsuleDetailAccessibilityConfigSchema,
  wilderness: z.object({}).passthrough().optional(),
  empire: z.object({}).passthrough().optional(),
  frontier: z.object({}).passthrough().optional(),
  motionLevel: z.enum(['minimal', 'reduced', 'full']),
  pillar: z.enum(['frontier', 'wilderness', 'empire']),
  presetId: z.enum(['minimal-frontier', 'minimal-wilderness', 'minimal-empire', 'wanderlust', 'arcane-tech', 'gilded-observatory']),
  enableTelemetry: z.boolean(),
  enableHotReload: z.boolean(),
  enableValidation: z.boolean(),
  enableDevTools: z.boolean(),
  enableAudio: z.boolean(),
  enableAnimations: z.boolean(),
  enableDragAndDrop: z.boolean(),
  version: z.string(),
  compatibility: z.array(z.string()),
  lastModified: z.number(),
});

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default ActivityCapsuleDetail TS-Series skin configuration
 * Based on the existing HTML implementation with TS-Series enhancements
 */
export const DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG: ActivityCapsuleDetailSkinConfig = {
  window: {
    windowBackground: 'linear-gradient(135deg, rgba(28, 19, 6, 0.96) 0%, rgba(19, 14, 4, 0.98) 100%)',
    windowBorder: '1px solid rgba(200, 155, 50, 0.3)',
    windowBorderRadius: '2px',
    windowBoxShadow: '0 24px 60px rgba(0, 0, 0, 0.88), 0 8px 20px rgba(0, 0, 0, 0.65), 0 2px 6px rgba(0, 0, 0, 0.5)',
    windowWidth: '400px',
    windowMinHeight: '480px',
    windowMaxWidth: '90vw',
    windowBackdrop: 'rgba(0, 0, 0, 0.8)',
    frameGradient: 'linear-gradient(0% 0%, #1c1306 0%, #130e04 30%, #0f0b03 70%, #090602 100%)',
    frameBorderGradient: 'linear-gradient(0% 0%, rgba(200, 155, 50, 0) 0%, rgba(200, 155, 50, 0.55) 12%, rgba(200, 155, 50, 0.55) 88%, rgba(200, 155, 50, 0) 100%)',
    frameCornerDecorations: 'rgba(180, 132, 42, 0.42)',
    frameNoiseFilter: 'fractalNoise',
    frameAmbientGlow: 'radial-gradient(circle at 50% 92%, rgba(255, 188, 30, 0) 0%, rgba(255, 188, 30, 0) 100%)',
    headerHeight: '40px',
    headerBackground: 'transparent',
    headerBorder: 'none',
    headerPadding: '0',
    dragHandleHeight: '40px',
    dragHandleBackground: 'transparent',
    dragHandleDots: 'flex',
    dragHandleDotSize: '3px',
    dragHandleDotColor: 'rgba(200, 160, 55, 0.8)',
    closeButtonSize: '22px',
    closeButtonBackground: 'transparent',
    closeButtonColor: 'rgba(160, 118, 38, 0.48)',
    closeButtonHoverColor: 'rgba(220, 168, 55, 0.82)',
    closeButtonBorderRadius: '0',
    contentPadding: '36px 28px 32px',
    contentBackground: 'transparent',
    contentBorderRadius: '0',
    mobileWindowWidth: '95vw',
    mobileContentPadding: '20px 16px 24px',
    compactWindowWidth: '320px',
  },
  
  poi: {
    poiSize: '68px',
    poiBackground: 'transparent',
    poiBorder: 'none',
    poiBorderRadius: '50%',
    poiGlow: '0 0 20px rgba(255, 200, 60, 0.4)',
    poiShadow: '0 0 40px rgba(0, 0, 0, 0.6)',
    crownGradient: 'linear-gradient(14% 4%, #fce890 0%, #e4b048 9%, #a05c18 28%, #602c08 52%, #341604 76%, #0e0602 100%)',
    crownBorder: 'rgba(0, 0, 0, 0.55)',
    crownWidth: '0.14em',
    crownAnimation: 'rim-breath 9.4s ease-in-out infinite',
    crownBreathAnimation: 's-amb 12.1s ease-in-out infinite',
    coreGradient: 'radial-gradient(36% 28%, #1e1608 0%, #030202 100%)',
    coreBorder: 'rgba(0, 0, 0, 0.95)',
    coreShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    coreInnerGlow: 'radial-gradient(50% 50%, rgba(255, 220, 120, 0.22) 0%, rgba(255, 180, 60, 0) 100%)',
    progressRingWidth: '0.20em',
    progressRingGradient: 'rgba(255, 200, 60, 0.5)',
    progressRingGlow: '0 0 12px rgba(255, 200, 60, 0.8)',
    progressRingAnimation: 'flicker 4.3s steps(1, end) infinite',
    progressRingCap: 'round',
    idleColor: 'rgba(192, 138, 30, 0.9)',
    activeColor: 'rgba(255, 220, 72, 0.9)',
    completedColor: 'rgba(72, 230, 105, 0.9)',
    blockedColor: 'rgba(200, 50, 30, 0.9)',
    entryAnimation: 'scale',
    entryDuration: '0.3s',
    entryEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    hoverAnimation: 'scale',
    hoverScale: 1.05,
    clickAnimation: 'scale',
    clickScale: 0.95,
  },
  
  header: {
    headerLayout: 'horizontal',
    headerGap: '16px',
    headerPadding: '0',
    headerAlignment: 'flex-start',
    nameFont: 'Cinzel, serif',
    nameFontSize: '14px',
    nameFontWeight: '700',
    nameColor: 'rgba(240, 220, 155, 0.92)',
    nameLineHeight: '1.2',
    nameLetterSpacing: '0.05em',
    nameTextTransform: 'none',
    nameTextShadow: 'none',
    typeFont: 'inherit',
    typeFontSize: '10px',
    typeFontWeight: '400',
    typeColor: 'rgba(180, 140, 58, 0.55)',
    typeLineHeight: '1.4',
    typeLetterSpacing: '0.02em',
    typeTextTransform: 'none',
    typeFontStyle: 'italic',
    statusDotSize: '5px',
    statusDotBorderRadius: '50%',
    statusDotAnimation: 'dot-pulse 1.8s ease-in-out infinite',
    statusDotGlow: '0 0 7px rgba(255, 200, 60, 0.85)',
    statusFont: 'Cinzel, serif',
    statusFontSize: '8px',
    statusFontWeight: '400',
    statusLetterSpacing: '0.18em',
    statusTextTransform: 'uppercase',
    statusIdleColor: 'rgba(140, 110, 50, 0.55)',
    statusActiveColor: 'rgba(255, 200, 60, 0.80)',
    statusCompletedColor: 'rgba(80, 200, 100, 0.80)',
    statusBlockedColor: 'rgba(200, 50, 30, 0.80)',
    headerPOISize: '68px',
    headerPOIMargin: '0',
    headerPOIAlignment: 'left',
  },
  
  ornament: {
    ornamentHeight: 'auto',
    ornamentMargin: '10px 0',
    ornamentAlignment: 'center',
    lineGradient: 'linear-gradient(90deg, transparent, rgba(180, 130, 40, 0.28), transparent)',
    lineWidth: '1px',
    lineOpacity: 1,
    centerShape: 'diamond',
    centerSize: '4px',
    centerColor: 'rgba(200, 155, 50, 0.4)',
    centerRotation: '45deg',
    centerAnimation: 'none',
    sideGap: '8px',
    centerGap: '8px',
    mobileOrnamentHeight: 'auto',
    mobileLineOpacity: 0.7,
  },
  
  info: {
    infoRowGap: '0',
    infoRowPadding: '0',
    infoRowBackground: 'transparent',
    infoRowBorder: 'none',
    infoRowBorderRadius: '0',
    itemPadding: '8px 10px',
    itemBackground: 'transparent',
    itemBorder: 'none',
    itemBorderRadius: '0',
    itemFlex: '1',
    separatorWidth: '1px',
    separatorGradient: 'linear-gradient(to bottom, transparent, rgba(180, 130, 40, 0.2), transparent)',
    separatorOpacity: 1,
    labelFont: 'Cinzel, serif',
    labelFontSize: '7px',
    labelFontWeight: '400',
    labelColor: 'rgba(160, 118, 40, 0.48)',
    labelLetterSpacing: '0.22em',
    labelTextTransform: 'uppercase',
    labelOpacity: 1,
    valueFont: 'Cinzel, serif',
    valueFontSize: '13px',
    valueFontWeight: '600',
    valueColor: 'rgba(235, 212, 140, 0.88)',
    valueLineHeight: '1.2',
    valueLetterSpacing: '0.02em',
    highlightValueColor: 'rgba(255, 200, 58, 0.9)',
    highlightValueGlow: 'none',
    highlightValueAnimation: 'none',
    iconSize: '16px',
    iconColor: 'rgba(200, 155, 50, 0.6)',
    iconOpacity: 1,
    iconMargin: '4px',
  },
  
  slotRack: {
    rackBackground: 'transparent',
    rackBorder: 'none',
    rackBorderRadius: '0',
    rackPadding: '6px 2px 12px',
    rackGap: '14px',
    rackOverflow: 'auto',
    rackScrollbarWidth: '2px',
    rackScrollbarColor: 'rgba(180, 130, 40, 0.18)',
    sectionLabelFont: 'Cinzel, serif',
    sectionLabelFontSize: '7.5px',
    sectionLabelFontWeight: '400',
    sectionLabelColor: 'rgba(150, 110, 38, 0.42)',
    sectionLabelLetterSpacing: '0.28em',
    sectionLabelTextTransform: 'uppercase',
    sectionLabelMargin: '0 0 10px 0',
    slotSize: '80px',
    slotBorderRadius: '50%',
    slotBackground: 'transparent',
    slotBorder: 'none',
    slotPadding: '0',
    slotGap: '0',
    cavityGradient: 'radial-gradient(36% 28%, #181006 0%, #0b0703 44%, #040201 100%)',
    cavityBorder: 'rgba(52, 36, 10, 0.62)',
    cavityShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    cavityInnerGlow: 'radial-gradient(50% 50%, rgba(255, 245, 200, 0.16) 0%, rgba(255, 220, 140, 0) 100%)',
    medalGradient: 'linear-gradient(14% 4%, #fce890 0%, #e4b048 9%, #a05c18 28%, #602c08 52%, #341604 76%, #0e0602 100%)',
    medalBorder: 'rgba(0, 0, 0, 0.95)',
    medalShadow: '0 0 40px rgba(0, 0, 0, 0.6)',
    medalInnerGlow: 'radial-gradient(38% 30%, #2e2012 0%, #18100a 40%, #050302 100%)',
    medalAnimation: 'sm-rim-idle 9.4s ease-in-out infinite',
    portraitBackground: 'radial-gradient(26% 20%, #2e2012 0%, #18100a 40%, #050302 100%)',
    portraitBorder: 'rgba(172, 105, 24, 0.24)',
    portraitShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.14)',
    portraitVignette: 'radial-gradient(50% 46%, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.12) 50%, rgba(0, 0, 0, 0.76) 100%)',
    initialsFont: 'Cinzel, Georgia, serif',
    initialsFontSize: '0.82em',
    initialsFontWeight: '600',
    initialsColor: 'rgba(200, 155, 50, 0.62)',
    initialsLetterSpacing: '0',
    initialsTextTransform: 'none',
    slotProgressWidth: '4.2px',
    slotProgressGradient: 'rgba(255, 200, 60, 0.78)',
    slotProgressGlow: '0 0 12px rgba(255, 200, 60, 0.8)',
    slotProgressAnimation: 'none',
    slotEmptyOpacity: 1,
    slotGhostOpacity: 0.45,
    slotIdleGlow: 'none',
    slotActiveGlow: '0 0 16px rgba(255, 200, 60, 0.6)',
    slotCompletedGlow: '0 0 16px rgba(72, 230, 105, 0.6)',
    slotLockedGlow: '0 0 12px rgba(120, 88, 25, 0.6)',
    slotEntryAnimation: 'slot-appear 0.32s cubic-bezier(0.22, 0.72, 0, 1) both',
    slotEntryDuration: '0.32s',
    slotEntryEasing: 'cubic-bezier(0.22, 0.72, 0, 1)',
    slotHoverAnimation: 'scale',
    slotHoverScale: 1.02,
    slotClickAnimation: 'scale',
    slotClickScale: 0.98,
    slotCursor: 'pointer',
    slotTransition: 'transform 0.2s ease',
    slotHoverGlow: '0 0 8px rgba(255, 200, 60, 0.4)',
    slotActiveTransform: 'scale(0.91) translate(0, 3)',
  },
  
  telemetry: {
    telemetryBackground: 'transparent',
    telemetryBorder: 'none',
    telemetryBorderRadius: '0',
    telemetryPadding: '0',
    telemetryGap: '0',
    telemetryLabelFont: 'Cinzel, serif',
    telemetryLabelFontSize: '7.5px',
    telemetryLabelFontWeight: '400',
    telemetryLabelColor: 'rgba(150, 110, 38, 0.42)',
    telemetryLabelLetterSpacing: '0.28em',
    telemetryLabelTextTransform: 'uppercase',
    telemetryLabelMargin: '0 0 6px 0',
    logBackground: 'transparent',
    logBorder: 'none',
    logBorderRadius: '0',
    logPadding: '0',
    logGap: '0',
    logMaxHeight: '120px',
    logOverflow: 'auto',
    logScrollbarWidth: '2px',
    logScrollbarColor: 'rgba(180, 130, 40, 0.18)',
    logScrollbarTrack: 'transparent',
    entryBackground: 'transparent',
    entryBorder: '1.5px solid transparent',
    entryBorderRadius: '0 1px 1px 0',
    entryPadding: '3px 6px',
    entryGap: '8px',
    entryTransition: 'background 0.12s',
    entryHoverBackground: 'rgba(255, 200, 60, 0.03)',
    entryHoverBorder: 'transparent',
    timestampFont: 'Cinzel, serif',
    timestampFontSize: '8px',
    timestampFontWeight: '400',
    timestampColor: 'rgba(140, 102, 30, 0.42)',
    timestampLetterSpacing: '0.03em',
    timestampMinWidth: '28px',
    messageFont: 'inherit',
    messageFontSize: '10px',
    messageFontWeight: '400',
    messageColor: 'rgba(190, 158, 85, 0.58)',
    messageLineHeight: '1.4',
    messageFontStyle: 'italic',
    emphasisColor: 'rgba(210, 175, 88, 0.82)',
    emphasisFontWeight: 'normal',
    eventAssignColor: 'rgba(210, 148, 28, 0.65)',
    eventStartColor: 'rgba(255, 200, 60, 0.65)',
    eventDoneColor: 'rgba(60, 180, 80, 0.65)',
    eventDetachColor: 'rgba(180, 130, 40, 0.35)',
    eventRejectColor: 'rgba(200, 60, 40, 0.65)',
    emptyFont: 'inherit',
    emptyFontSize: '10px',
    emptyFontWeight: '400',
    emptyColor: 'rgba(130, 95, 28, 0.28)',
    emptyFontStyle: 'italic',
    emptyPadding: '4px 6px',
  },
  
  cta: {
    ctaContainerGap: '8px',
    ctaContainerMargin: '10px 0 0 0',
    ctaContainerPadding: '0',
    buttonBackground: 'linear-gradient(135deg, rgba(160, 90, 8, 0.9), rgba(120, 65, 4, 0.95))',
    buttonBorder: '1px solid transparent',
    buttonBorderRadius: '1px',
    buttonPadding: '8px 12px',
    buttonMinHeight: 'auto',
    buttonFlex: '1',
    buttonFont: 'Cinzel, serif',
    buttonFontSize: '9px',
    buttonFontWeight: '600',
    buttonColor: 'rgba(238, 208, 118, 0.9)',
    buttonLetterSpacing: '0.16em',
    buttonTextTransform: 'uppercase',
    buttonLineHeight: '1.2',
    buttonHoverBackground: 'linear-gradient(135deg, rgba(188, 108, 12, 0.94), rgba(148, 82, 6, 1))',
    buttonHoverBorder: 'transparent',
    buttonHoverColor: 'rgba(238, 208, 118, 0.9)',
    buttonActiveBackground: 'linear-gradient(135deg, rgba(148, 82, 6, 1), rgba(120, 65, 4, 0.95))',
    buttonActiveBorder: 'transparent',
    buttonActiveColor: 'rgba(238, 208, 118, 0.9)',
    buttonDisabledBackground: 'transparent',
    buttonDisabledBorder: 'rgba(180, 58, 38, 0.28)',
    buttonDisabledColor: 'rgba(178, 78, 58, 0.62)',
    buttonDisabledOpacity: 0.32,
    buttonTransition: 'all 0.16s ease',
    buttonHoverAnimation: 'none',
    buttonActiveScale: 0.95,
    buttonDisabledScale: 1,
    buttonShimmer: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent)',
    buttonShimmerAnimation: 'left 0.3s',
    buttonGlow: '0 2px 10px rgba(160, 90, 8, 0.28), inset 0 1px 0 rgba(255, 218, 95, 0.14)',
    buttonShadow: 'none',
    startButtonBackground: 'linear-gradient(135deg, rgba(160, 90, 8, 0.9), rgba(120, 65, 4, 0.95))',
    startButtonBorder: 'rgba(180, 120, 28, 0.62)',
    startButtonColor: 'rgba(238, 208, 118, 0.9)',
    startButtonGlow: '0 2px 10px rgba(160, 90, 8, 0.28), inset 0 1px 0 rgba(255, 218, 95, 0.14)',
    cancelButtonBackground: 'transparent',
    cancelButtonBorder: 'rgba(180, 58, 38, 0.28)',
    cancelButtonColor: 'rgba(178, 78, 58, 0.62)',
    cancelButtonGlow: 'none',
    collectButtonBackground: 'linear-gradient(135deg, rgba(38, 138, 58, 0.85), rgba(24, 98, 44, 0.9))',
    collectButtonBorder: 'rgba(58, 178, 78, 0.48)',
    collectButtonColor: 'rgba(158, 238, 178, 0.88)',
    collectButtonGlow: '0 0 14px rgba(58, 178, 78, 0.18)',
  },
  
  animation: {
    windowEntryAnimation: 'scale',
    windowEntryDuration: '0.3s',
    windowEntryEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    windowExitAnimation: 'scale',
    windowExitDuration: '0.3s',
    windowExitEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    poiIdleAnimation: 'rim-breath 9.4s ease-in-out infinite',
    poiIdleDuration: '9.4s',
    poiActiveAnimation: 'flicker 4.3s steps(1, end) infinite',
    poiActiveDuration: '4.3s',
    poiCompletedAnimation: 'none',
    poiCompletedDuration: '0s',
    slotIdleAnimation: 'sm-rim-idle 9.4s ease-in-out infinite',
    slotIdleDuration: '9.4s',
    slotActiveAnimation: 'sm-rim-active 4.2s ease-in-out infinite',
    slotActiveDuration: '4.2s',
    slotProgressAnimation: 'smooth',
    slotProgressDuration: '0.12s',
    progressAnimation: 'smooth',
    progressDuration: '0.12s',
    progressEasing: 'linear',
    progressPulseAnimation: 'none',
    progressPulseDuration: '2s',
    progressPulseIntensity: 0.3,
    uiAnimationDuration: '0.16s',
    uiAnimationEasing: 'ease',
    hoverAnimationDuration: '0.2s',
    hoverAnimationEasing: 'ease',
    clickAnimationDuration: '0.1s',
    clickAnimationEasing: 'ease',
    motionLevel: 'full',
    reducedMotionConfig: {
      windowEntryAnimation: 'fade',
      windowEntryDuration: '0.2s',
      poiIdleAnimation: 'none',
      slotIdleAnimation: 'none',
      progressAnimation: 'stepped',
      buttonHoverAnimation: 'none',
      buttonActiveScale: 1,
      slotHoverScale: 1,
      slotClickScale: 1,
    },
  },
  
  typography: {
    primaryFont: 'Cinzel, serif',
    primaryFontWeight: '400',
    primaryLineHeight: '1.4',
    primaryLetterSpacing: '0.02em',
    secondaryFont: 'Crimson Text, serif',
    secondaryFontWeight: '400',
    secondaryLineHeight: '1.5',
    secondaryLetterSpacing: '0.01em',
    monospaceFont: 'JetBrains Mono, monospace',
    monospaceFontWeight: '400',
    monospaceLineHeight: '1.3',
    displayFont: 'Cinzel, serif',
    displayFontWeight: '700',
    displayLineHeight: '1.2',
    displayLetterSpacing: '0.05em',
    textPrimary: 'rgba(240, 220, 155, 0.92)',
    textSecondary: 'rgba(190, 158, 85, 0.58)',
    textTertiary: 'rgba(140, 102, 30, 0.42)',
    textDisabled: 'rgba(100, 80, 40, 0.3)',
    textInverse: 'rgba(15, 23, 42, 0.92)',
    textShadowSmall: 'none',
    textShadowMedium: 'none',
    textShadowLarge: 'none',
    textShadowGlow: '0 0 8px rgba(255, 200, 60, 0.3)',
    fontSizeXSmall: '7px',
    fontSizeSmall: '9px',
    fontSizeMedium: '11px',
    fontSizeLarge: '13px',
    fontSizeXLarge: '16px',
    mobileFontSizeScale: 0.9,
    compactFontSizeScale: 0.85,
  },
  
  audio: {
    enableAudio: true,
    masterVolume: 0.5,
    effectVolume: 0.7,
    assignSound: 'clank',
    startSound: 'appear',
    completeSound: 'complete',
    cancelSound: 'reject',
    detachSound: 'detach',
    rejectSound: 'reject',
    collectSound: 'complete',
    hoverSound: 'resist',
    clickSound: 'clank',
    soundFadeIn: '0.01s',
    soundFadeOut: '0.05s',
    soundPitch: 1,
    soundDuration: '0.2s',
    enableAudioContext: true,
    audioContextLatency: 'interactive',
  },
  
  accessibility: {
    enableAriaLive: true,
    enableAriaLabels: true,
    enableAriaDescribedBy: true,
    enableAriaExpanded: true,
    enableKeyboardNavigation: true,
    enableFocusIndicators: true,
    focusIndicatorStyle: '2px solid rgba(255, 200, 60, 0.8)',
    focusIndicatorWidth: '2px',
    focusIndicatorColor: 'rgba(255, 200, 60, 0.8)',
    highContrastMode: false,
    highContrastColors: undefined,
    enableReducedMotion: false,
    reducedMotionFallbacks: {
      windowEntryAnimation: 'fade',
      poiIdleAnimation: 'none',
      slotIdleAnimation: 'none',
      progressAnimation: 'stepped',
      buttonHoverAnimation: 'none',
      buttonActiveScale: 1,
      slotHoverScale: 1,
      slotClickScale: 1,
    },
    announceActivityStart: true,
    announceActivityComplete: true,
    announceSlotAssign: true,
    announceSlotDetach: true,
    announceError: true,
    colorBlindMode: 'none',
    colorBlindAdjustments: {},
  },
  
  wilderness: {
    window: {
      frameGradient: 'linear-gradient(0% 0%, #064f3b 0%, #14532d 30%, #0f5329 70%, #05301a 100%)',
      frameBorderGradient: 'linear-gradient(0% 0%, rgba(34, 197, 94, 0) 0%, rgba(34, 197, 94, 0.55) 12%, rgba(34, 197, 94, 0.55) 88%, rgba(34, 197, 94, 0) 100%)',
      frameCornerDecorations: 'rgba(45, 154, 85, 0.42)',
      frameAmbientGlow: 'radial-gradient(circle at 50% 92%, rgba(34, 197, 94, 0) 0%, rgba(34, 197, 94, 0) 100%)',
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
  },
  
  empire: {
    window: {
      frameGradient: 'linear-gradient(0% 0%, #262626 0%, #373026 30%, #1f1f1f 70%, #0a0a0a 100%)',
      frameBorderGradient: 'linear-gradient(0% 0%, rgba(205, 127, 50, 0) 0%, rgba(205, 127, 50, 0.55) 12%, rgba(205, 127, 50, 0.55) 88%, rgba(205, 127, 50, 0) 100%)',
      frameCornerDecorations: 'rgba(192, 96, 48, 0.42)',
      frameAmbientGlow: 'radial-gradient(circle at 50% 92%, rgba(205, 127, 50, 0) 0%, rgba(205, 127, 50, 0) 100%)',
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
  },
  
  frontier: {
    window: {
      frameGradient: 'linear-gradient(0% 0%, #1e3a8a 0%, #1e40af 30%, #1e293b 70%, #0f172a 100%)',
      frameBorderGradient: 'linear-gradient(0% 0%, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0.55) 12%, rgba(59, 130, 246, 0.55) 88%, rgba(59, 130, 246, 0) 100%)',
      frameCornerDecorations: 'rgba(59, 130, 246, 0.42)',
      frameAmbientGlow: 'radial-gradient(circle at 50% 92%, rgba(59, 130, 246, 0) 0%, rgba(59, 130, 246, 0) 100%)',
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
  },
  
  motionLevel: 'full',
  pillar: 'frontier',
  presetId: 'minimal-frontier',
  enableTelemetry: true,
  enableHotReload: true,
  enableValidation: true,
  enableDevTools: false,
  enableAudio: true,
  enableAnimations: true,
  enableDragAndDrop: true,
  version: '1.0.0',
  compatibility: ['1.0.0'],
  lastModified: Date.now(),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Deep merge helper for ActivityCapsuleDetail skin configuration
 */
export function mergeActivityCapsuleDetailSkinConfig(
  base: ActivityCapsuleDetailSkinConfig,
  overrides?: Partial<ActivityCapsuleDetailSkinConfig>
): ActivityCapsuleDetailSkinConfig {
  if (!overrides) return base;
  
  return {
    window: { ...base.window, ...(overrides.window ?? {}) },
    poi: { ...base.poi, ...(overrides.poi ?? {}) },
    header: { ...base.header, ...(overrides.header ?? {}) },
    ornament: { ...base.ornament, ...(overrides.ornament ?? {}) },
    info: { ...base.info, ...(overrides.info ?? {}) },
    slotRack: { ...base.slotRack, ...(overrides.slotRack ?? {}) },
    telemetry: { ...base.telemetry, ...(overrides.telemetry ?? {}) },
    cta: { ...base.cta, ...(overrides.cta ?? {}) },
    animation: { ...base.animation, ...(overrides.animation ?? {}) },
    typography: { ...base.typography, ...(overrides.typography ?? {}) },
    audio: { ...base.audio, ...(overrides.audio ?? {}) },
    accessibility: { ...base.accessibility, ...(overrides.accessibility ?? {}) },
    wilderness: { ...base.wilderness, ...(overrides.wilderness ?? {}) },
    empire: { ...base.empire, ...(overrides.empire ?? {}) },
    frontier: { ...base.frontier, ...(overrides.frontier ?? {}) },
    motionLevel: overrides.motionLevel ?? base.motionLevel,
    pillar: overrides.pillar ?? base.pillar,
    presetId: overrides.presetId ?? base.presetId,
    enableTelemetry: overrides.enableTelemetry ?? base.enableTelemetry,
    enableHotReload: overrides.enableHotReload ?? base.enableHotReload,
    enableValidation: overrides.enableValidation ?? base.enableValidation,
    enableDevTools: overrides.enableDevTools ?? base.enableDevTools,
    enableAudio: overrides.enableAudio ?? base.enableAudio,
    enableAnimations: overrides.enableAnimations ?? base.enableAnimations,
    enableDragAndDrop: overrides.enableDragAndDrop ?? base.enableDragAndDrop,
    version: overrides.version ?? base.version,
    compatibility: overrides.compatibility ?? base.compatibility,
    lastModified: overrides.lastModified ?? base.lastModified,
  };
}

/**
 * Get pillar-specific ActivityCapsuleDetail configuration
 */
export function getActivityCapsuleDetailSkinConfig(
  pillar?: StyleLabPillar,
  overrides?: Partial<ActivityCapsuleDetailSkinConfig>
): ActivityCapsuleDetailSkinConfig {
  const baseConfig = { ...DEFAULT_ACTIVITY_CAPSULE_DETAIL_SKIN_CONFIG };
  
  // Apply pillar-specific overrides
  if (pillar && pillar !== 'frontier') {
    const pillarOverrides = baseConfig[pillar];
    if (pillarOverrides) {
      Object.assign(baseConfig, mergeActivityCapsuleDetailSkinConfig(baseConfig, pillarOverrides));
    }
    baseConfig.pillar = pillar;
  }
  
  // Apply custom overrides
  return mergeActivityCapsuleDetailSkinConfig(baseConfig, overrides);
}

/**
 * Validate ActivityCapsuleDetail skin configuration
 */
export function validateActivityCapsuleDetailSkinConfig(
  config: unknown
): SkinValidationResult {
  const result = ActivityCapsuleDetailSkinConfigSchema.safeParse(config);
  
  if (result.success) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }
  
  return {
    isValid: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
    warnings: [],
  };
}

/**
 * Create ActivityCapsuleDetail skin binding for TS-Series integration
 */
export function createActivityCapsuleDetailSkinBinding(
  componentId: string,
  config: Partial<ActivityCapsuleDetailSkinConfig>
): ComponentSkinBinding {
  return {
    componentId,
    componentType: 'ActivityCapsuleDetail',
    skinPresetId: config.presetId || 'minimal-frontier',
    pillar: config.pillar || 'frontier',
    motionLevel: config.motionLevel || 'full',
    config,
    enabled: true,
    priority: 'normal',
    metadata: {
      version: config.version || '1.0.0',
      lastModified: config.lastModified || Date.now(),
      compatibility: config.compatibility || ['1.0.0'],
    },
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidActivityCapsuleDetailSkinConfig(
  config: unknown
): config is ActivityCapsuleDetailSkinConfig {
  return ActivityCapsuleDetailSkinConfigSchema.safeParse(config).success;
}

export function isActivityCapsuleDetailSkinBinding(
  binding: unknown
): binding is ComponentSkinBinding {
  const candidate = binding as ComponentSkinBinding;
  return (
    candidate &&
    typeof candidate === 'object' &&
    candidate.componentType === 'ActivityCapsuleDetail' &&
    typeof candidate.componentId === 'string' &&
    isValidActivityCapsuleDetailSkinConfig(candidate.config)
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type ActivityCapsuleDetailSkinConfigType = z.infer<typeof ActivityCapsuleDetailSkinConfigSchema>;
