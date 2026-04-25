import { describe, it, expect } from 'vitest';
import {
  WANDERLUST_PRESETS,
  createWanderlustPreset,
  applyWanderlustPreset,
  getWanderlustTokens,
  createWanderlustActionCardDemo,
  type WanderlustPillar,
} from '../../../src/ui/styleLab/presets/wanderlust';
import { DEFAULT_STYLE_LAB_PRESET } from '../../../src/ui/styleLab/tokens/defaultStyleLabPreset';

describe('Wanderlust Preset - WL-STY-003', () => {
  describe('Preset Creation', () => {
    it('should create wilderness preset with correct styling', () => {
      const preset = createWanderlustPreset('wilderness');
      
      expect(preset.name).toBe('Wanderlust Wilderness');
      expect(preset.description).toContain('wilderness theme');
      expect(preset.actionHalo.haloColor).toContain('58, 215, 80'); // Green
      expect(preset.actionCardFrame.frameBackground).toContain('2a1810'); // Brown
      expect(preset.progressInlay.progressFill).toContain('d8ffd8'); // Green gradient
    });

    it('should create empire preset with correct styling', () => {
      const preset = createWanderlustPreset('empire');
      
      expect(preset.name).toBe('Wanderlust Empire');
      expect(preset.description).toContain('empire theme');
      expect(preset.actionHalo.haloColor).toContain('216, 144, 64'); // Gold
      expect(preset.actionCardFrame.frameBackground).toContain('0a0402'); // Dark
      expect(preset.progressInlay.progressFill).toContain('fce890'); // Gold gradient
    });

    it('should have different styling between pillars', () => {
      const wilderness = createWanderlustPreset('wilderness');
      const empire = createWanderlustPreset('empire');
      
      // Different halo colors
      expect(wilderness.actionHalo.haloColor).not.toBe(empire.actionHalo.haloColor);
      // Different frame backgrounds
      expect(wilderness.actionCardFrame.frameBackground).not.toBe(empire.actionCardFrame.frameBackground);
      // Different progress fills
      expect(wilderness.progressInlay.progressFill).not.toBe(empire.progressInlay.progressFill);
    });

    it('should maintain base preset structure', () => {
      const preset = createWanderlustPreset('wilderness');
      
      // Should have all required sections
      expect(preset.surfaces).toBeDefined();
      expect(preset.typography).toBeDefined();
      expect(preset.modifierScopes).toBeDefined();
      expect(preset.modifierStatus).toBeDefined();
      expect(preset.interactionColors).toBeDefined();
      expect(preset.interactionPhysics).toBeDefined();
      expect(preset.materialFeel).toBeDefined();
      expect(preset.audioHaptics).toBeDefined();
      expect(preset.actionCardFrame).toBeDefined();
      expect(preset.actionHalo).toBeDefined();
      expect(preset.progressInlay).toBeDefined();
    });
  });

  describe('WANDERLUST_PRESETS Registry', () => {
    it('should export presets for both pillars', () => {
      expect(WANDERLUST_PRESETS.wilderness).toBeDefined();
      expect(WANDERLUST_PRESETS.empire).toBeDefined();
      expect(WANDERLUST_PRESETS.wilderness.name).toBe('Wanderlust Wilderness');
      expect(WANDERLUST_PRESETS.empire.name).toBe('Wanderlust Empire');
    });

    it('should have consistent structure across presets', () => {
      const wilderness = WANDERLUST_PRESETS.wilderness;
      const empire = WANDERLUST_PRESETS.empire;
      
      // Both should have the same structure
      expect(Object.keys(wilderness)).toEqual(Object.keys(empire));
      expect(Object.keys(wilderness.actionCardFrame)).toEqual(Object.keys(empire.actionCardFrame));
      expect(Object.keys(wilderness.actionHalo)).toEqual(Object.keys(empire.actionHalo));
    });
  });

  describe('Helper Functions', () => {
    it('applyWanderlustPreset should extend base config', () => {
      const baseConfig = { existing: 'value', other: 123 };
      const result = applyWanderlustPreset(baseConfig, 'wilderness');
      
      expect(result.existing).toBe('value');
      expect(result.other).toBe(123);
      expect(result.wanderlust).toBeDefined();
      expect(result.wanderlust.pillar).toBe('wilderness');
      expect(result.wanderlust.tokens).toBeDefined();
    });

    it('getWanderlustTokens should return correct tokens', () => {
      const wildernessTokens = getWanderlustTokens('wilderness');
      const empireTokens = getWanderlustTokens('empire');
      
      expect(wildernessTokens.mapHalo.baseColor).toContain('58, 215, 80');
      expect(empireTokens.mapHalo.baseColor).toContain('216, 144, 64');
      expect(wildernessTokens.detailCard.frameGradient).toContain('2a1810');
      expect(empireTokens.detailCard.frameGradient).toContain('0a0402');
    });

    it('createWanderlustActionCardDemo should return demo config', () => {
      const demo = createWanderlustActionCardDemo('wilderness');
      
      expect(demo.frame).toBeDefined();
      expect(demo.halo).toBeDefined();
      expect(demo.progress).toBeDefined();
      expect(demo.frame.background).toContain('2a1810');
      expect(demo.halo.color).toContain('58, 215, 80');
      expect(demo.progress.fill).toContain('d8ffd8');
    });
  });

  describe('Token Values', () => {
    it('should use Wanderlust-specific colors', () => {
      const wilderness = createWanderlustPreset('wilderness');
      const empire = createWanderlustPreset('empire');
      
      // Wilderness should use green accents
      expect(wilderness.interactionColors.accentPrimary).toBe('var(--wanderlust-accent-primary, #d87706)');
      expect(wilderness.modifierScopes.QUEST.border).toContain('216, 144, 64');
      
      // Empire should use gold accents
      expect(empire.interactionColors.accentPrimary).toBe('var(--wanderlust-accent-primary, #d87706)');
      expect(empire.modifierScopes.QUEST.border).toContain('216, 144, 64');
    });

    it('should have appropriate physics values', () => {
      const preset = createWanderlustPreset('wilderness');
      
      expect(preset.interactionPhysics.liftScale).toBe(1.05);
      expect(preset.interactionPhysics.springStiffness).toBe(180);
      expect(preset.interactionPhysics.springDamping).toBe(16);
      expect(preset.interactionPhysics.mass).toBe(1.2);
    });

    it('should have Dark Luxury styling', () => {
      const preset = createWanderlustPreset('empire');
      
      expect(preset.typography.headingFont).toContain('Cinzel');
      expect(preset.typography.bodyFont).toContain('Crimson Text');
      expect(preset.materialFeel.density).toBe('heavy');
      expect(preset.materialFeel.surfaceSheen).toBe('wanderlust-basalt');
    });

    it('should have appropriate audio/haptic settings', () => {
      const preset = createWanderlustPreset('wilderness');
      
      expect(preset.audioHaptics.audioProfileId).toBe('wanderlust-immersive');
      expect(preset.audioHaptics.masterVolume).toBe(0.8);
      expect(preset.audioHaptics.hapticPreset).toBe('wanderlust-rich');
      expect(preset.audioHaptics.vibrationIntensity).toBe(0.7);
    });
  });

  describe('Material Feel Detail Tokens', () => {
    it('should include detail tokens with pillar-specific values', () => {
      const wilderness = createWanderlustPreset('wilderness');
      const empire = createWanderlustPreset('empire');
      
      expect(wilderness.materialFeel.detail).toBeDefined();
      expect(empire.materialFeel.detail).toBeDefined();
      
      // Should have pillar-specific textures
      expect(wilderness.materialFeel.detail.microTexture).toContain('44,116,66');
      expect(empire.materialFeel.detail.microTexture).toContain('192,112,40');
      
      // Should have pillar-specific edge glows
      expect(wilderness.materialFeel.detail.edgeGlow).toContain('58, 215, 80');
      expect(empire.materialFeel.detail.edgeGlow).toContain('216, 144, 64');
    });
  });

  describe('ActionCard Frame Tokens', () => {
    it('should have appropriate frame styling', () => {
      const wilderness = createWanderlustPreset('wilderness');
      const empire = createWanderlustPreset('empire');
      
      // Wilderness frame
      expect(wilderness.actionCardFrame.frameBorder).toContain('58, 215, 80');
      expect(wilderness.actionCardFrame.frameBackground).toContain('2a1810');
      expect(wilderness.actionCardFrame.frameBorderRadius).toBe('var(--wanderlust-frame-radius, 12px)');
      
      // Empire frame
      expect(empire.actionCardFrame.frameBorder).toContain('216, 144, 64');
      expect(empire.actionCardFrame.frameBackground).toContain('0a0402');
      expect(empire.actionCardFrame.frameBorderRadius).toBe('var(--wanderlust-frame-radius, 12px)');
    });
  });

  describe('ActionHalo Tokens', () => {
    it('should have appropriate halo styling', () => {
      const wilderness = createWanderlustPreset('wilderness');
      const empire = createWanderlustPreset('empire');
      
      // Wilderness halo
      expect(wilderness.actionHalo.haloColor).toContain('58, 215, 80');
      expect(wilderness.actionHalo.haloGlowIntensity).toBe(0.6);
      expect(wilderness.actionHalo.haloBorderWidth).toBe('2px');
      
      // Empire halo
      expect(empire.actionHalo.haloColor).toContain('216, 144, 64');
      expect(empire.actionHalo.haloGlowIntensity).toBe(0.8);
      expect(empire.actionHalo.haloBorderWidth).toBe('3px');
    });
  });

  describe('Progress Inlay Tokens', () => {
    it('should have appropriate progress styling', () => {
      const wilderness = createWanderlustPreset('wilderness');
      const empire = createWanderlustPreset('empire');
      
      // Wilderness progress
      expect(wilderness.progressInlay.progressFill).toContain('d8ffd8');
      expect(wilderness.progressInlay.progressGlowColor).toContain('58, 215, 80');
      
      // Empire progress
      expect(empire.progressInlay.progressFill).toContain('fce890');
      expect(empire.progressInlay.progressGlowColor).toContain('216, 144, 64');
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for all interfaces', () => {
      const preset = createWanderlustPreset('wilderness');
      const tokens = getWanderlustTokens('wilderness');
      const demo = createWanderlustActionCardDemo('empire');
      
      // These should not have TypeScript errors
      expect(preset.actionCardFrame.frameBorder).toBeDefined();
      expect(tokens.mapHalo.baseColor).toBeDefined();
      expect(demo.frame.background).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should extend base preset without breaking existing structure', () => {
      const wanderlust = createWanderlustPreset('wilderness');
      const base = DEFAULT_STYLE_LAB_PRESET;
      
      // Should have all base properties
      expect(Object.keys(wanderlust)).toEqual(Object.keys(base));
      
      // Should maintain base structure but with Wanderlust values
      expect(wanderlust.surfaces).toBeDefined();
      expect(wanderlust.typography).toBeDefined();
      expect(wanderlust.modifierScopes).toBeDefined();
    });
  });
});
