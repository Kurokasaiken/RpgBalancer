/**
 * SlotRack Skin Configuration
 * 
 * Config-first skin definitions for ResidentSlotRack component.
 * Bridges Style Lab tokens with SlottedMedal visual styling and interaction physics.
 * 
 * @fileoverview
 * - Defines slot rack visual themes for Minimal Frontier and Wanderlust presets
 * - Configures SlottedMedal styling per skin context
 * - Provides interaction physics for Framer Motion animations
 * - Maps audio profiles to skin presets
 * 
 * @see IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md §5.2
 * @see .windsurf/plans/style-lab-flexibility-1a9890.md
 */

import type { SkinConfig, SlotRackSkinConfig, MedalStyleConfig } from './skinSchemas';

export interface MedalStyleBridgeConfig {
  skinPreset?: 'minimal' | 'enhanced' | 'ceremonial';
  variants?: Record<string, MedalStyleConfig>;
  interactionPhysics?: SlotRackSkinConfig['interactionPhysics'];
}

/**
 * Iron Bronze slot rack configuration
 * Converted from slot-rack-iron-bronze.skin.json to align with config-first architecture
 * Provides oxidized iron tray with bronze bezel and amber medallion glow as new default look.
 */
export const SLOT_RACK_IRON_BRONZE_CONFIG: SlotRackSkinConfig = {
  id: 'slot_rack_iron_bronze',
  label: 'Slot Rack · Iron Bronze',
  description: 'Oxidized iron tray with bronze bezel, riveted edges, and amber medallion glow.',
  version: 1,
  supportedPresets: ['minimal_frontier'],

  grid: {
    gap: '22px',
    padding: '24px 26px',
    borderRadius: '28px',
    background: 'linear-gradient(185deg, #131518 0%, #0e0f10 45%, #0b0c0e 78%, #0f1012 100%)',
    border: '2px solid #3a2008',
  },

  slotContainer: {
    background: 'radial-gradient(circle at 42% 32%, #0f0605 0%, rgba(2,1,1,0.85) 70%, #020101 100%)',
    border: '1px solid rgba(232, 168, 48, 0.45)',
    borderRadius: '50%',
    padding: '12px',
    transition: 'all 0.36s cubic-bezier(0.42, 0, 0.2, 1)',
  },

  navigation: {
    buttonBackground: 'rgba(14, 15, 16, 0.85)',
    buttonBorder: '1px solid rgba(232, 168, 48, 0.35)',
    buttonHoverBackground: 'rgba(58, 32, 8, 0.92)',
    iconColor: 'rgba(255, 252, 205, 0.85)',
    iconSize: '18px',
  },

  medalStyle: {
    defaultPreset: 'enhanced',
    variants: {
      enhanced: {
        depth: 12,
        shadowBlur: 32,
        shadowOpacity: 0.72,
        rimThickness: 4,
        rimColor: '#3a2008',
        faceColor: '#7a4a12',
        highlightColor: '#ffecc5',
        gradients: {
          rim: {
            type: 'radial',
            gradientUnits: 'objectBoundingBox',
            cx: '50%',
            cy: '45%',
            r: '70%',
            stops: [
              { offset: 0, color: 'rgba(255,252,205,0.95)' },
              { offset: 0.35, color: '#e8b858', opacity: 0.92 },
              { offset: 0.75, color: '#7a4a12', opacity: 0.88 },
              { offset: 1, color: '#140a02', opacity: 0.95 },
            ],
          },
          face: {
            type: 'radial',
            gradientUnits: 'objectBoundingBox',
            cx: '45%',
            cy: '32%',
            r: '58%',
            stops: [
              { offset: 0, color: '#ffe3ad' },
              { offset: 0.55, color: '#c27a2d', opacity: 0.95 },
              { offset: 1, color: '#3a1d08', opacity: 0.92 },
            ],
          },
          innerRing: {
            type: 'linear',
            gradientUnits: 'objectBoundingBox',
            x1: '0%',
            y1: '0%',
            x2: '100%',
            y2: '100%',
            stops: [
              { offset: 0, color: '#f5c877', opacity: 0.9 },
              { offset: 0.5, color: '#a05c18', opacity: 0.85 },
              { offset: 1, color: '#3a2008', opacity: 0.92 },
            ],
          },
          field: {
            type: 'radial',
            gradientUnits: 'objectBoundingBox',
            cx: '60%',
            cy: '65%',
            r: '70%',
            stops: [
              { offset: 0, color: '#0f0605', opacity: 0.98 },
              { offset: 0.45, color: '#1c0a05', opacity: 0.94 },
              { offset: 1, color: '#020101', opacity: 0.92 },
            ],
          },
        },
        overlays: {
          patina: {
            fill: 'rgba(58, 32, 8, 0.35)',
            opacity: 0.3,
            blendMode: 'multiply',
          },
          scratches: {
            fill: 'rgba(200, 220, 255, 0.12)',
            opacity: 0.2,
            blendMode: 'screen',
          },
        },
        glow: {
          color: 'rgba(185, 108, 15, 0.55)',
          blur: 42,
          opacity: 0.7,
        },
        glyphStyle: {
          fill: '#140a02',
          stroke: 'rgba(255, 252, 205, 0.35)',
          fontFamily: 'Cinzel, serif',
        },
      },
      minimal: {
        depth: 8,
        shadowBlur: 18,
        shadowOpacity: 0.55,
        rimThickness: 3,
        rimColor: '#5a3810',
        faceColor: '#7a4a12',
        highlightColor: 'rgba(255,252,205,0.72)',
        glow: {
          color: 'rgba(185,108,15,0.45)',
          blur: 28,
          opacity: 0.55,
        },
        glyphStyle: {
          fill: '#fcebb3',
          shadow: '0 1px 4px rgba(0,0,0,0.65)',
        },
      },
    } as Record<string, MedalStyleConfig>,
  },

  interactionPhysics: {
    mass: 1.05,
    damping: 0.32,
    stiffness: 240,
    shadowDepth: 'deep',
    bloomIntensity: 0.85,
  },

  rackMotion: {
    type: 'none',
  },

  audioProfile: 'slotrack.iron-bronze.heavy',

  cssVars: {
    '--slot-rack-slot-size': '80px',
    '--slot-rack-gap': '22px',
    '--slot-rack-padding': '24px 26px',
    '--slot-rack-border-radius': '28px',
    '--slot-rack-bg': 'linear-gradient(185deg, #131518 0%, #0e0f10 45%, #0b0c0e 78%, #0f1012 100%)',
    '--slot-rack-border': '2px solid #3a2008',
    '--slot-rack-bg-gradient': 'linear-gradient(185deg, #131518 0%, #0e0f10 45%, #0b0c0e 78%, #0f1012 100%)',
    '--slot-rack-halo-color': 'rgba(185, 108, 15, 0.55)',
    '--slot-rack-tray-ridge-color': '#3a2008',
    '--slot-rack-nav-bg': 'rgba(14,15,16,0.85)',
    '--slot-rack-nav-border': '1px solid rgba(232,168,48,0.35)',
    '--slot-rack-nav-hover-bg': 'rgba(58,32,8,0.92)',
    '--slot-rack-nav-icon': 'rgba(255,252,205,0.85)',
    '--slot-rack-slot-bg': 'radial-gradient(circle at 42% 32%, #0f0605 0%, rgba(15,8,5,0.85) 70%, #020101 100%)',
    '--slot-rack-slot-border-valid': '1px solid rgba(255, 252, 205, 0.65)',
    '--slot-rack-slot-border-invalid': '1px dashed rgba(185, 108, 15, 0.45)',
    '--slot-rack-slot-border-empty': '1px dashed rgba(232, 168, 48, 0.45)',
    '--slot-rack-slot-border-assigned': '1px solid rgba(232, 168, 48, 0.78)',
    '--slot-rack-slot-text': '#f5d9a8',
    '--slot-rack-slot-empty-text': 'rgba(255, 235, 200, 0.55)',
    '--slot-rack-slot-shadow': '0 16px 32px rgba(0,0,0,0.65)',
    '--slot-rack-slot-shadow-highlighted': '0 0 28px rgba(185,108,15,0.55)',
    '--slot-rack-slot-ring-color': 'rgba(232,168,48,0.68)',
    '--slot-rack-slot-glow': 'rgba(185,108,15,0.55)',
    '--slot-rack-slot-label-color': 'rgba(255, 252, 205, 0.65)',
    '--slot-rack-slot-badge-bg': 'rgba(14,15,16,0.9)',
    '--slot-rack-slot-badge-text': '#ffecc5',
    '--slot-rack-slot-clear-text': 'rgba(255, 252, 205, 0.85)',
  },

  documentation: [
    'slot-rack-iron-bronze.skin.json',
    'src/docs/docs/PROJECT_PHILOSOPHY.md#core-philosophy-weight-based-creator-pattern',
    'src/docs/docs/plans/art_direction_plan.md#wilderness-treatment',
    '.windsurf/plans/style-lab-flexibility-1a9890.md#slotrack-signature',
    'material-canvas-v2.html#wanderlust',
  ],
};

/**
 * Minimal Frontier slot rack skin configuration
 * Clean, airy grid with subtle depth and reduced motion
 */
export const MINIMAL_FRONTIER_SLOT_RACK_CONFIG: SlotRackSkinConfig = {
  id: 'minimal_frontier_slot_rack',
  label: 'Minimal Frontier Slot Rack',
  description: 'Clean, lightweight slot grid with subtle depth and reduced motion.',
  version: 1,
  supportedPresets: ['minimal_frontier'],
  
  // Grid layout and spacing
  grid: {
    gap: 'var(--slot-rack-gap, 12px)',
    padding: 'var(--slot-rack-padding, 16px)',
    borderRadius: 'var(--slot-rack-border-radius, 8px)',
    background: 'var(--slot-rack-bg, rgba(30, 41, 59, 0.4))',
    border: 'var(--slot-rack-border, 1px solid rgba(71, 85, 105, 0.3))',
  },
  
  // Slot container styling
  slotContainer: {
    background: 'var(--slot-container-bg, rgba(15, 23, 42, 0.6))',
    border: 'var(--slot-container-border, 1px solid rgba(71, 85, 105, 0.2))',
    borderRadius: 'var(--slot-container-border-radius, 6px)',
    padding: 'var(--slot-container-padding, 8px)',
    transition: 'all 0.2s ease-out',
  },
  
  // Navigation controls
  navigation: {
    buttonBackground: 'var(--nav-button-bg, rgba(71, 85, 105, 0.2))',
    buttonBorder: 'var(--nav-button-border, 1px solid rgba(71, 85, 105, 0.3))',
    buttonHoverBackground: 'var(--nav-button-hover-bg, rgba(71, 85, 105, 0.4))',
    iconColor: 'var(--nav-icon-color, #cbd5e1)',
    iconSize: 'var(--nav-icon-size, 16px)',
  },
  
  // SlottedMedal styling bridge
  medalStyle: {
    defaultPreset: 'minimal',
    variants: {
      minimal: {
        depth: 4,
        shadowBlur: 8,
        shadowOpacity: 0.3,
        rimThickness: 2,
        rimColor: 'var(--medal-rim-color, #94a3b8)',
        faceColor: 'var(--medal-face-color, #64748b)',
        highlightColor: 'var(--medal-highlight-color, #cbd5e1)',
      },
    },
  },
  
  // Interaction physics for Framer Motion
  interactionPhysics: {
    mass: 0.95,
    damping: 0.24,
    stiffness: 180,
    shadowDepth: 'medium',
    bloomIntensity: 0.4,
  },

  rackMotion: {
    type: 'fade',
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration: 0.28,
      ease: 'easeOut',
    },
  },
  
  // Audio profile mapping
  audioProfile: 'minimal-frontier.core',
  
  // CSS custom properties
  cssVars: {
    '--slot-rack-gap': '12px',
    '--slot-rack-padding': '16px',
    '--slot-rack-border-radius': '8px',
    '--slot-rack-bg': 'rgba(30, 41, 59, 0.4)',
    '--slot-rack-border': '1px solid rgba(71, 85, 105, 0.3)',
    '--slot-rack-bg-gradient': 'rgba(30, 41, 59, 0.4)',
    '--slot-rack-halo-color': 'rgba(71, 85, 105, 0.2)',
    '--slot-rack-tray-ridge-color': '#94a3b8',
    '--slot-container-bg': 'rgba(15, 23, 42, 0.6)',
    '--slot-container-border': '1px solid rgba(71, 85, 105, 0.2)',
    '--slot-container-border-radius': '6px',
    '--slot-container-padding': '8px',
    '--nav-button-bg': 'rgba(71, 85, 105, 0.2)',
    '--nav-button-border': '1px solid rgba(71, 85, 105, 0.3)',
    '--nav-button-hover-bg': 'rgba(71, 85, 105, 0.4)',
    '--nav-icon-color': '#cbd5e1',
    '--nav-icon-size': '16px',
    '--medal-rim-color': '#94a3b8',
    '--medal-face-color': '#64748b',
    '--medal-highlight-color': '#cbd5e1',
  },
  
  // Documentation references
  documentation: [
    'IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md#5.2-slot-rack-skin',
    '.windsurf/plans/style-lab-flexibility-1a9890.md#interaction-physics',
  ],
};

/**
 * Wanderlust slot rack skin configuration  
 * Dark luxury floating slots with enhanced depth and full motion
 */
export const WANDERLUST_SLOT_RACK_CONFIG: SlotRackSkinConfig = {
  id: 'wanderlust_slot_rack',
  label: 'Wanderlust Slot Rack',
  description: 'Dark luxury floating slot grid with enhanced depth and full motion support.',
  version: 1,
  supportedPresets: ['wanderlust'],
  
  // Grid layout and spacing
  grid: {
    gap: 'var(--slot-rack-gap, 16px)',
    padding: 'var(--slot-rack-padding, 20px)',
    borderRadius: 'var(--slot-rack-border-radius, 12px)',
    background: 'var(--slot-rack-bg, rgba(10, 4, 2, 0.8))',
    border: 'var(--slot-rack-border, 1px solid rgba(216, 119, 6, 0.3))',
  },
  
  // Slot container styling
  slotContainer: {
    background: 'var(--slot-container-bg, rgba(0, 0, 0, 0.7))',
    border: 'var(--slot-container-border, 1px solid rgba(216, 119, 6, 0.2))',
    borderRadius: 'var(--slot-container-border-radius, 8px)',
    padding: 'var(--slot-container-padding, 12px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Navigation controls
  navigation: {
    buttonBackground: 'var(--nav-button-bg, rgba(216, 119, 6, 0.2))',
    buttonBorder: 'var(--nav-button-border, 1px solid rgba(216, 119, 6, 0.4))',
    buttonHoverBackground: 'var(--nav-button-hover-bg, rgba(216, 119, 6, 0.4))',
    iconColor: 'var(--nav-icon-color, #d87706)',
    iconSize: 'var(--nav-icon-size, 18px)',
  },
  
  // SlottedMedal styling bridge
  medalStyle: {
    defaultPreset: 'enhanced',
    variants: {
      minimal: {
        depth: 4,
        shadowBlur: 8,
        shadowOpacity: 0.3,
        rimThickness: 2,
        rimColor: 'var(--medal-rim-color, #92400e)',
        faceColor: 'var(--medal-face-color, #78350f)',
        highlightColor: 'var(--medal-highlight-color, #d97706)',
      },
      enhanced: {
        depth: 8,
        shadowBlur: 16,
        shadowOpacity: 0.6,
        rimThickness: 3,
        rimColor: 'var(--medal-rim-color-enhanced, #d87706)',
        faceColor: 'var(--medal-face-color-enhanced, #92400e)',
        highlightColor: 'var(--medal-highlight-color-enhanced, #fbbf24)',
      },
      ceremonial: {
        depth: 12,
        shadowBlur: 24,
        shadowOpacity: 0.8,
        rimThickness: 4,
        rimColor: 'var(--medal-rim-color-ceremonial, #fbbf24)',
        faceColor: 'var(--medal-face-color-ceremonial, #d87706)',
        highlightColor: 'var(--medal-highlight-color-ceremonial, #fef3c7)',
      },
    },
  },
  
  // Interaction physics for Framer Motion
  interactionPhysics: {
    mass: 1.2,
    damping: 0.18,
    stiffness: 220,
    shadowDepth: 'deep',
    bloomIntensity: 1.2,
  },

  rackMotion: {
    type: 'spring',
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      mass: 1.05,
      damping: 0.28,
      stiffness: 190,
    },
  },
  
  // Audio profile mapping
  audioProfile: 'wanderlust.obsidian',
  
  // CSS custom properties
  cssVars: {
    '--slot-rack-gap': '16px',
    '--slot-rack-padding': '20px',
    '--slot-rack-border-radius': '12px',
    '--slot-rack-bg': 'rgba(10, 4, 2, 0.8)',
    '--slot-rack-border': '1px solid rgba(216, 119, 6, 0.3)',
    '--slot-container-bg': 'rgba(0, 0, 0, 0.7)',
    '--slot-container-border': '1px solid rgba(216, 119, 6, 0.2)',
    '--slot-container-border-radius': '8px',
    '--slot-container-padding': '12px',
    '--nav-button-bg': 'rgba(216, 119, 6, 0.2)',
    '--nav-button-border': '1px solid rgba(216, 119, 6, 0.4)',
    '--nav-button-hover-bg': 'rgba(216, 119, 6, 0.4)',
    '--nav-icon-color': '#d87706',
    '--nav-icon-size': '18px',
    '--medal-rim-color': '#92400e',
    '--medal-face-color': '#78350f',
    '--medal-highlight-color': '#d97706',
    '--medal-rim-color-enhanced': '#d87706',
    '--medal-face-color-enhanced': '#92400e',
    '--medal-highlight-color-enhanced': '#fbbf24',
    '--medal-rim-color-ceremonial': '#fbbf24',
    '--medal-face-color-ceremonial': '#d87706',
    '--medal-highlight-color-ceremonial': '#fef3c7',
  },
  
  // Documentation references
  documentation: [
    'IMPLEMENTATION_PLAN_SKIN_READY_COMPONENTS.md#5.2-slot-rack-skin',
    '.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md',
  ],
};

/**
 * Resident Slot Signature skin configuration
 * Dedicated preset for the /test harness ResidentSlotRack surface.
 */
export const RESIDENT_SLOT_RACK_SIGNATURE_CONFIG: SlotRackSkinConfig = {
  id: 'resident_slotrack_signature_skin',
  label: 'Resident Slot Signature Skin',
  description: 'Preset interno fedele al prototipo medal4.html (bronze rim + emerald core).',
  version: 1,
  supportedPresets: ['resident_slotrack_signature'],

  grid: {
    gap: '24px',
    padding: '32px 36px',
    borderRadius: '26px',
    background: 'linear-gradient(145deg, rgba(5, 6, 11, 0.96), rgba(10, 8, 4, 0.82))',
    border: '1px solid rgba(252, 232, 144, 0.22)',
  },

  slotContainer: {
    background: 'radial-gradient(circle at 38% 32%, rgba(33, 20, 9, 0.78), rgba(5, 3, 2, 0.95))',
    border: '1px solid rgba(252, 232, 144, 0.35)',
    borderRadius: '50%',
    padding: '12px',
    transition: 'all 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
  },

  navigation: {
    buttonBackground: 'rgba(5, 3, 2, 0.92)',
    buttonBorder: '1px solid rgba(252, 232, 144, 0.25)',
    buttonHoverBackground: 'rgba(10, 6, 4, 0.9)',
    iconColor: '#fcefd5',
    iconSize: '18px',
  },

  medalStyle: {
    defaultPreset: 'enhanced',
    variants: {
      enhanced: {
        depth: 14,
        shadowBlur: 34,
        shadowOpacity: 0.78,
        rimThickness: 4,
        rimColor: '#fcebb3',
        faceColor: '#a15a1c',
        highlightColor: '#fff1c1',
        gradients: {
          rim: {
            type: 'radial',
            cx: '50%',
            cy: '40%',
            r: '70%',
            stops: [
              { offset: 0, color: '#fff4cf', opacity: 0.95 },
              { offset: 0.32, color: '#f0c878', opacity: 0.92 },
              { offset: 0.68, color: '#c27a2d', opacity: 0.9 },
              { offset: 1, color: '#6b3516', opacity: 0.95 },
            ],
          },
          face: {
            type: 'radial',
            cx: '45%',
            cy: '30%',
            r: '60%',
            stops: [
              { offset: 0, color: '#f6dfb3', opacity: 1 },
              { offset: 0.5, color: '#c98337', opacity: 0.98 },
              { offset: 1, color: '#5a2b11', opacity: 0.96 },
            ],
          },
          innerRing: {
            type: 'linear',
            x1: '0%',
            y1: '0%',
            x2: '100%',
            y2: '100%',
            gradientUnits: 'userSpaceOnUse',
            stops: [
              { offset: 0, color: '#fbe4a6', opacity: 0.9 },
              { offset: 0.45, color: '#d79a42', opacity: 0.85 },
              { offset: 1, color: '#8b4c1c', opacity: 0.9 },
            ],
          },
          field: {
            type: 'radial',
            cx: '60%',
            cy: '65%',
            r: '70%',
            stops: [
              { offset: 0, color: '#0a2917', opacity: 0.98 },
              { offset: 0.4, color: '#124e2d', opacity: 0.92 },
              { offset: 0.78, color: '#0d2a1a', opacity: 0.96 },
              { offset: 1, color: '#030906', opacity: 0.9 },
            ],
          },
          glass: {
            type: 'linear',
            x1: '0%',
            y1: '0%',
            x2: '100%',
            y2: '100%',
            stops: [
              { offset: 0, color: 'rgba(255,255,255,0.5)', opacity: 0.5 },
              { offset: 0.45, color: 'rgba(255,255,255,0.08)', opacity: 0.25 },
              { offset: 1, color: 'rgba(255,255,255,0)', opacity: 0 },
            ],
          },
        },
        overlays: {
          patina: {
            fill: 'rgba(19, 48, 28, 0.28)',
            opacity: 0.35,
            blendMode: 'multiply',
          },
          oxidation: {
            fill: 'rgba(255, 255, 255, 0.28)',
            opacity: 0.3,
            blendMode: 'screen',
          },
          scratches: {
            fill: 'rgba(255, 248, 210, 0.5)',
            opacity: 0.25,
            blendMode: 'overlay',
          },
        },
        glassLayer: {
          tint: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.7)',
          opacity: 0.5,
          blurPx: 10,
        },
        glow: {
          color: 'rgba(255, 248, 200, 0.85)',
          blur: 48,
          opacity: 0.6,
        },
        glyphStyle: {
          fill: '#2b1408',
          stroke: 'rgba(255, 255, 255, 0.3)',
          shadow: '0 1px 2px rgba(0,0,0,0.85)',
          fontFamily: 'Cinzel, serif',
        },
        gem: {
          enabled: true,
          bodyGradient: {
            type: 'radial',
            cx: '50%',
            cy: '50%',
            r: '60%',
            stops: [
              { offset: 0, color: '#7af4c9', opacity: 0.95 },
              { offset: 0.4, color: '#43c293', opacity: 0.9 },
              { offset: 1, color: '#0f3d2b', opacity: 0.95 },
            ],
          },
          glowColor: 'rgba(142, 255, 214, 0.9)',
          clawColor: '#f7e9c1',
          position: { x: '82%', y: '78%' },
          size: '24px',
          animationDurationMs: 2200,
        },
      },
    } as Record<string, MedalStyleConfig>,
  },

  interactionPhysics: {
    mass: 0.85,
    damping: 0.35,
    stiffness: 260,
    shadowDepth: 'medium',
    bloomIntensity: 0.75,
  },

  rackMotion: {
    type: 'none',
  },

  audioProfile: 'slotrack.signature.satin',

  cssVars: {
    '--slot-rack-bg': 'linear-gradient(165deg, rgba(5,3,2,0.98), rgba(12,8,4,0.86))',
    '--slot-rack-border': '1px solid rgba(252, 232, 144, 0.28)',
    '--slot-rack-border-radius': '26px',
    '--slot-rack-padding': '32px 36px',
    '--slot-rack-shadow': '0 18px 60px rgba(0,0,0,0.65), inset 0 0 60px rgba(252, 232, 144, 0.08)',
    '--slot-rack-scroll-fade-left': 'linear-gradient(90deg, rgba(8,6,4,0.92), rgba(8,6,4,0.25), transparent)',
    '--slot-rack-scroll-fade-right': 'linear-gradient(270deg, rgba(8,6,4,0.92), rgba(8,6,4,0.25), transparent)',
    '--slot-rack-nav-bg': 'rgba(5,3,2,0.92)',
    '--slot-rack-nav-border': '1px solid rgba(252, 232, 144, 0.25)',
    '--slot-rack-nav-icon': '#fcefd5',
    '--slot-rack-slot-bg': 'radial-gradient(circle at 35% 30%, rgba(33,20,9,0.78), rgba(5,3,2,0.95))',
    '--slot-rack-slot-border-valid': '1px solid rgba(114, 238, 130, 0.75)',
    '--slot-rack-slot-border-invalid': '1px dashed rgba(255, 255, 255, 0.32)',
    '--slot-rack-slot-border-assigned': '1px solid rgba(252, 232, 144, 0.78)',
    '--slot-rack-slot-border-empty': '1px dashed rgba(252, 232, 144, 0.45)',
    '--slot-rack-slot-text': '#fff6c4',
    '--slot-rack-slot-empty-text': 'rgba(252, 232, 144, 0.68)',
    '--slot-rack-slot-shadow-valid': '0 0 28px rgba(114, 238, 130, 0.55)',
    '--slot-rack-slot-shadow-highlighted': '0 0 26px rgba(255, 208, 128, 0.65)',
    '--slot-rack-slot-shadow': '0 0 16px rgba(0, 0, 0, 0.55)',
    '--slot-rack-slot-ring-color': 'rgba(255, 248, 200, 0.45)',
    '--slot-rack-slot-label-color': 'rgba(249, 222, 166, 0.52)',
    '--slot-rack-slot-badge-bg': 'rgba(8, 6, 4, 0.9)',
    '--slot-rack-slot-badge-text': '#fdf4ff',
    '--slot-rack-slot-clear-text': 'rgba(255, 248, 200, 0.78)',
    '--slot-rack-slot-initials-bg': 'linear-gradient(200deg, rgba(28,14,6,0.88), rgba(5,3,2,0.9))',
  },

  documentation: [
    'docs/idle_village/roster_trusted_components.md#resident-slotrack-signature',
    '.windsurf/plans/style-lab-flexibility-1a9890.md#slotrack-signature',
  ],
};

// Wilderness Bronze Slot Rack Config (scaled down from 210px to reasonable size)
export const WILDERNESS_BRONZE_SLOT_RACK_CONFIG: SlotRackSkinConfig = {
  id: 'slot_wilderness_bronze',
  label: 'Wilderness Bronze Slot Rack',
  description: 'Bronze skin scaled appropriately for slot racks',
  version: 1,
  supportedPresets: ['wanderlust'],
  
  grid: {
    gap: '16px',
    padding: '0px',
    borderRadius: '20px',
    background: 'linear-gradient(165deg, rgba(15,12,8,0.98), rgba(25,20,12,0.86))',
    border: '1px solid rgba(139, 69, 19, 0.4)',
  },
  
  slotContainer: {
    background: 'radial-gradient(circle at 35% 30%, rgba(45, 25, 15, 0.78), rgba(15, 8, 4, 0.95))',
    border: '2px solid rgba(139, 69, 19, 0.6)',
    borderRadius: '50%',
    padding: '0px !important',
    transition: 'all 0.2s ease',
  },
  
  // CSS custom properties for dynamic styling - KEY PART FOR SIZING
  cssVars: {
    '--slot-rack-slot-size': '60px !important', // Match POI slot size
    '--slot-rack-slot-width': '60px !important',
    '--slot-rack-slot-height': '60px !important',
    '--slot-rack-slot-bg': 'radial-gradient(circle at 35% 30%, rgba(45, 25, 15, 0.78), rgba(15, 8, 4, 0.95))',
    '--slot-rack-slot-border': '2px solid rgba(139, 69, 19, 0.6)',
    '--slot-rack-slot-border-radius': '50%',
    '--slot-rack-slot-shadow': 'inset 0 2px 8px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)',
  },
  
  navigation: {
    buttonBackground: 'rgba(15, 12, 8, 0.85)',
    buttonBorder: '1px solid rgba(139, 69, 19, 0.35)',
    buttonHoverBackground: 'rgba(58, 32, 8, 0.92)',
    iconColor: 'rgba(205, 127, 50, 0.85)',
    iconSize: '18px',
  },
  
  medalStyle: {
    defaultPreset: 'enhanced',
    variants: {
      enhanced: {
        depth: 8,
        shadowBlur: 24,
        shadowOpacity: 0.6,
        rimThickness: 3,
        rimColor: '#8b4513',
        faceColor: '#cd7f32',
        highlightColor: '#ffecc5',
        gradients: {
          rim: {
            type: 'radial',
            gradientUnits: 'objectBoundingBox',
            cx: '50%',
            cy: '45%',
            r: '70%',
            stops: [
              { offset: 0, color: 'rgba(205,127,50,0.95)' },
              { offset: 0.35, color: '#cd7f32', opacity: 0.92 },
              { offset: 0.75, color: '#8b4513', opacity: 0.88 },
              { offset: 1, color: '#654321', opacity: 0.95 },
            ],
          },
          face: {
            type: 'radial',
            gradientUnits: 'objectBoundingBox',
            cx: '45%',
            cy: '32%',
            r: '58%',
            stops: [
              { offset: 0, color: '#ffe4b5' },
              { offset: 0.55, color: '#cd7f32', opacity: 0.95 },
              { offset: 1, color: '#8b4513', opacity: 0.92 },
            ],
          },
        },
      },
    },
  },
  
  interactionPhysics: {
    mass: 1.0,
    damping: 0.25,
    stiffness: 200,
    shadowDepth: 'medium',
    bloomIntensity: 0.5,
  },
  
  documentation: [
    'Wilderness bronze skin scaled for slot racks',
  ],
  
  rackMotion: {
    type: 'none',
  },
  
  audioProfile: 'slotrack.signature.bronze',
};

/**
 * Wanderlust V8 Slot Rack skin configuration
 * Precise borders for external component (via WanderlustSurface) and internal slots
 */
export const WANDERLUST_V8_SLOT_RACK_CONFIG: SlotRackSkinConfig = {
  id: 'wanderlust_v8_slot_rack',
  label: 'Wanderlust V8 Slot Rack',
  description: 'V8 skin with precise borders for external WanderlustSurface wrapper and internal slot borders.',
  version: 1,
  supportedPresets: ['wanderlust'],

  grid: {
    gap: '12px',
    padding: '16px',
    borderRadius: '0px', // Border handled by WanderlustSurface
    background: 'transparent', // Background handled by WanderlustSurface
    border: 'none', // Border handled by WanderlustSurface
  },

  slotContainer: {
    background: 'radial-gradient(circle at 35% 30%, rgba(45, 25, 15, 0.78), rgba(15, 8, 4, 0.95))',
    border: '2px solid rgba(216, 119, 6, 0.6)', // Precise bronze border for internal slots
    borderRadius: '50%',
    padding: '0px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  navigation: {
    buttonBackground: 'rgba(15, 12, 8, 0.85)',
    buttonBorder: '1px solid rgba(216, 119, 6, 0.35)',
    buttonHoverBackground: 'rgba(58, 32, 8, 0.92)',
    iconColor: 'rgba(205, 127, 50, 0.85)',
    iconSize: '18px',
  },

  medalStyle: {
    defaultPreset: 'enhanced',
    variants: {
      enhanced: {
        depth: 8,
        shadowBlur: 24,
        shadowOpacity: 0.6,
        rimThickness: 3,
        rimColor: '#d87706',
        faceColor: '#92400e',
        highlightColor: '#fbbf24',
        gradients: {
          rim: {
            type: 'radial',
            gradientUnits: 'objectBoundingBox',
            cx: '50%',
            cy: '45%',
            r: '70%',
            stops: [
              { offset: 0, color: 'rgba(205,127,50,0.95)' },
              { offset: 0.35, color: '#cd7f32', opacity: 0.92 },
              { offset: 0.75, color: '#8b4513', opacity: 0.88 },
              { offset: 1, color: '#654321', opacity: 0.95 },
            ],
          },
          face: {
            type: 'radial',
            gradientUnits: 'objectBoundingBox',
            cx: '45%',
            cy: '32%',
            r: '58%',
            stops: [
              { offset: 0, color: '#ffe4b5' },
              { offset: 0.55, color: '#cd7f32', opacity: 0.95 },
              { offset: 1, color: '#8b4513', opacity: 0.92 },
            ],
          },
        },
      },
    },
  },

  interactionPhysics: {
    mass: 1.0,
    damping: 0.25,
    stiffness: 200,
    shadowDepth: 'medium',
    bloomIntensity: 0.5,
  },

  rackMotion: {
    type: 'none',
  },

  audioProfile: 'slotrack.signature.bronze',

  cssVars: {
    '--slot-rack-slot-size': '60px',
    '--slot-rack-slot-width': '60px',
    '--slot-rack-slot-height': '60px',
    '--slot-rack-slot-bg': 'radial-gradient(circle at 35% 30%, rgba(45, 25, 15, 0.78), rgba(15, 8, 4, 0.95))',
    '--slot-rack-slot-border': '2px solid rgba(216, 119, 6, 0.6)', // Precise internal slot border
    '--slot-rack-slot-border-radius': '50%',
    '--slot-rack-slot-shadow': 'inset 0 2px 8px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)',
    '--slot-rack-slot-border-valid': '2px solid rgba(114, 238, 130, 0.75)',
    '--slot-rack-slot-border-invalid': '2px dashed rgba(255, 255, 255, 0.32)',
    '--slot-rack-slot-border-assigned': '2px solid rgba(216, 119, 6, 0.78)',
    '--slot-rack-slot-border-empty': '2px dashed rgba(216, 119, 6, 0.45)',
    '--slot-rack-slot-text': '#f5d9a8',
    '--slot-rack-slot-empty-text': 'rgba(252, 232, 144, 0.68)',
    '--slot-rack-slot-shadow-valid': '0 0 28px rgba(114, 238, 130, 0.55)',
    '--slot-rack-slot-shadow-highlighted': '0 0 26px rgba(255, 208, 128, 0.65)',
    '--slot-rack-slot-ring-color': 'rgba(255, 248, 200, 0.45)',
    '--slot-rack-slot-label-color': 'rgba(249, 222, 166, 0.52)',
    '--slot-rack-slot-badge-bg': 'rgba(8, 6, 4, 0.9)',
    '--slot-rack-slot-badge-text': '#fdf4ff',
    '--slot-rack-slot-clear-text': 'rgba(255, 248, 200, 0.78)',
  },

  documentation: [
    'Wanderlust V8 skin with precise borders for external wrapper and internal slots',
  ],
};

/**
 * Base V9 slot rack skin configuration
 * Default obsidian surface with antique gold/bronze accents and azure light leak.
 */
export const SLOT_RACK_BASE_CONFIG: SlotRackSkinConfig = {
  id: 'slot_rack_base',
  label: 'Slot Rack · Base V9',
  description: 'Default V9 obsidian surface with antique gold/bronze accents and azure light leak.',
  version: 1,
  supportedPresets: ['base'],

  grid: {
    gap: 'var(--slot-rack-gap, 12px)',
    padding: 'var(--slot-rack-padding, 18px)',
    borderRadius: 'var(--slot-rack-border-radius, 14px)',
    background: 'var(--slot-rack-bg, #060f16)',
    border: 'var(--slot-rack-border, 1px solid rgba(223,184,87,0.45))',
  },

  slotContainer: {
    background: 'rgba(0, 0, 0, 0.38)',
    border: '1px solid rgba(223, 184, 87, 0.28)',
    borderRadius: '50%',
    padding: '0px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  navigation: {
    buttonBackground: 'rgba(6, 15, 22, 0.9)',
    buttonBorder: '1px solid rgba(223, 184, 87, 0.35)',
    buttonHoverBackground: 'rgba(223, 184, 87, 0.25)',
    iconColor: '#f7dd80',
    iconSize: '18px',
  },

  medalStyle: {
    defaultPreset: 'minimal',
    variants: {
      minimal: {
        depth: 8,
        shadowBlur: 24,
        shadowOpacity: 0.6,
        rimThickness: 3,
        rimColor: '#dfb857',
        faceColor: '#7a4a12',
        highlightColor: '#f7dd80',
        glow: {
          color: 'rgba(0, 229, 255, 0.25)',
          blur: 28,
          opacity: 0.5,
        },
        glyphStyle: {
          fill: '#F5F2E8',
          shadow: '0 1px 4px rgba(0,0,0,0.65)',
        },
      } as MedalStyleConfig,
    },
  },

  interactionPhysics: {
    mass: 1.0,
    damping: 0.28,
    stiffness: 220,
    shadowDepth: 'medium',
    bloomIntensity: 0.6,
  },

  rackMotion: {
    type: 'none',
  },

  audioProfile: 'slotrack.base.v9',

  cssVars: {
    '--slot-rack-slot-size': '96px',
    '--slot-rack-gap': '12px',
    '--slot-rack-padding': '18px',
    '--slot-rack-border-radius': '14px',
    '--slot-rack-bg': 'radial-gradient(circle at 0% 0%, rgba(0,229,255,0.10) 0%, transparent 45%), #060f16',
    '--slot-rack-bg-gradient': 'radial-gradient(circle at 0% 0%, rgba(0,229,255,0.10) 0%, transparent 45%), #060f16',
    '--slot-rack-border': '1px solid rgba(223,184,87,0.45)',
    '--slot-rack-shadow': '0 8px 24px rgba(0,0,0,0.45)',
    '--slot-rack-halo-color': 'rgba(0,229,255,0.25)',
    '--slot-rack-tray-ridge-color': 'rgba(223,184,87,0.25)',
    '--slot-rack-nav-bg': 'rgba(6,15,22,0.9)',
    '--slot-rack-nav-border': '1px solid rgba(223,184,87,0.35)',
    '--slot-rack-nav-hover-bg': 'rgba(223,184,87,0.25)',
    '--slot-rack-nav-icon': '#f7dd80',
    '--slot-rack-slot-bg': 'rgba(0,0,0,0.38)',
    '--slot-rack-slot-border-valid': '1px solid rgba(0,229,255,0.7)',
    '--slot-rack-slot-border-invalid': '1px dashed rgba(217,138,74,0.5)',
    '--slot-rack-slot-border-empty': 'rgba(223,184,87,0.28)',
    '--slot-rack-slot-border-assigned': '1px solid rgba(223,184,87,0.7)',
    '--slot-rack-slot-text': '#F5F2E8',
    '--slot-rack-slot-empty-text': 'rgba(245,242,232,0.50)',
    '--slot-rack-slot-shadow': '0 8px 24px rgba(0,0,0,0.45)',
    '--slot-rack-slot-shadow-valid': '0 0 28px rgba(0,229,255,0.55)',
    '--slot-rack-slot-shadow-highlighted': '0 0 26px rgba(247,221,128,0.65)',
    '--slot-rack-slot-ring-color': 'rgba(223,184,87,0.55)',
    '--slot-rack-slot-glow': 'rgba(0,229,255,0.25)',
    '--slot-rack-slot-label-color': '#e8c56a',
    '--slot-rack-slot-badge-bg': 'rgba(0,0,0,0.6)',
    '--slot-rack-slot-badge-text': '#F5F2E8',
    '--slot-rack-slot-clear-text': 'rgba(245,242,232,0.85)',
    '--slot-rack-slot-initials-bg': 'rgba(0,0,0,0.6)',
    '--slot-rack-scroll-fade-left': 'linear-gradient(90deg, rgba(6,15,22,0.95), rgba(6,15,22,0.25), transparent)',
    '--slot-rack-scroll-fade-right': 'linear-gradient(270deg, rgba(6,15,22,0.95), rgba(6,15,22,0.25), transparent)',
  },

  documentation: [
    'Base V9 obsidian skin with antique gold/bronze accents and azure light leak',
  ],
};

/**
 * Registry of all slot rack skin configurations
 */
export const SLOT_RACK_SKIN_REGISTRY: Record<string, SlotRackSkinConfig> = {
  [SLOT_RACK_BASE_CONFIG.id]: SLOT_RACK_BASE_CONFIG,
  [SLOT_RACK_IRON_BRONZE_CONFIG.id]: SLOT_RACK_IRON_BRONZE_CONFIG,
  [MINIMAL_FRONTIER_SLOT_RACK_CONFIG.id]: MINIMAL_FRONTIER_SLOT_RACK_CONFIG,
  [WANDERLUST_SLOT_RACK_CONFIG.id]: WANDERLUST_SLOT_RACK_CONFIG,
  [RESIDENT_SLOT_RACK_SIGNATURE_CONFIG.id]: RESIDENT_SLOT_RACK_SIGNATURE_CONFIG,
  [WILDERNESS_BRONZE_SLOT_RACK_CONFIG.id]: WILDERNESS_BRONZE_SLOT_RACK_CONFIG,
  [WANDERLUST_V8_SLOT_RACK_CONFIG.id]: WANDERLUST_V8_SLOT_RACK_CONFIG,
};

export const DEFAULT_SLOT_RACK_PRESET_ID = SLOT_RACK_BASE_CONFIG.id;

export function resolveSlotRackPresetId(presetId?: string): string {
  if (!presetId) {
    return DEFAULT_SLOT_RACK_PRESET_ID;
  }

  return SLOT_RACK_PRESET_OVERRIDES[presetId] ?? presetId;
}

/**
 * Helper to get slot rack skin config by ID
 */
export function getSlotRackSkinConfig(skinId: string): SlotRackSkinConfig | null {
  return SLOT_RACK_SKIN_REGISTRY[skinId] || null;
}

/**
 * Helper to get slot rack skin config for preset
 */
export function getSlotRackSkinForPreset(presetId: string): SlotRackSkinConfig | null {
  switch (presetId) {
    case 'base':
    case 'slot_rack_base':
      return SLOT_RACK_BASE_CONFIG;
    case 'minimal_frontier':
    case 'slot_rack_iron_bronze':
      return SLOT_RACK_IRON_BRONZE_CONFIG;
    case 'minimal_frontier_slot_rack':
      return MINIMAL_FRONTIER_SLOT_RACK_CONFIG;
    case 'wanderlust':
      return WANDERLUST_SLOT_RACK_CONFIG;
    case 'wanderlust_v8':
      return WANDERLUST_V8_SLOT_RACK_CONFIG;
    case 'resident_slotrack_signature':
      return RESIDENT_SLOT_RACK_SIGNATURE_CONFIG;
    case 'wilderness_bronze':
      return WILDERNESS_BRONZE_SLOT_RACK_CONFIG;
    default:
      return SLOT_RACK_BASE_CONFIG;
  }
}


// Slot rack preset overrides - must be defined after the configs
const SLOT_RACK_PRESET_OVERRIDES: Record<string, string> = {
  minimal_frontier: SLOT_RACK_IRON_BRONZE_CONFIG.id,
  wanderlust: WILDERNESS_BRONZE_SLOT_RACK_CONFIG.id,
  wanderlust_dual_pillar: WILDERNESS_BRONZE_SLOT_RACK_CONFIG.id,
  wanderlust_v8: WANDERLUST_V8_SLOT_RACK_CONFIG.id,
};

// Re-export the type for convenience
export type { SlotRackSkinConfig };
