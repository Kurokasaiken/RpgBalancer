import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STYLE_LAB_PRESET,
  type ActionCardFrameTokens,
  type ActionHaloTokens,
  type ProgressInlayTokens,
} from '../../../src/ui/styleLab/tokens/defaultStyleLabPreset';
import { 
  useStyleLabTokens, 
  getActionCardFeel, 
  getActionHaloTokens 
} from '../../../src/ui/styleLab/hooks/useStyleLabTokens';
import { renderHook } from '@testing-library/react';

describe('StyleLabTokens - WL-STY-002 Extensions', () => {
  describe('Token Structure', () => {
    it('should include actionCardFrame tokens in default preset', () => {
      const { actionCardFrame } = DEFAULT_STYLE_LAB_PRESET;
      
      expect(actionCardFrame).toBeDefined();
      expect(actionCardFrame.frameBorder).toContain('rgba(200, 160, 48, 0.4)');
      expect(actionCardFrame.frameBackground).toContain('linear-gradient');
      expect(actionCardFrame.frameBorderRadius).toBe('var(--action-card-radius, 12px)');
      expect(actionCardFrame.frameBoxShadow).toContain('0 8px 32px');
      expect(actionCardFrame.framePadding).toBe('var(--action-card-padding, 16px)');
      expect(actionCardFrame.frameMinHeight).toBe('var(--action-card-min-height, 80px)');
      expect(actionCardFrame.frameTransition).toContain('cubic-bezier');
    });

    it('should include actionHalo tokens in default preset', () => {
      const { actionHalo } = DEFAULT_STYLE_LAB_PRESET;
      
      expect(actionHalo).toBeDefined();
      expect(actionHalo.haloColor).toContain('rgba(200, 160, 48, 0.6)');
      expect(actionHalo.haloGlowIntensity).toBe(0.8);
      expect(actionHalo.haloSize).toBe('var(--action-halo-size, 48px)');
      expect(actionHalo.haloBorderWidth).toBe('var(--action-halo-border-width, 3px)');
      expect(actionHalo.haloPulseDuration).toBe('var(--action-halo-pulse-duration, 2s)');
      expect(actionHalo.haloPulseEasing).toBe('var(--action-halo-pulse-easing, ease-in-out)');
      expect(actionHalo.haloShadowBlur).toBe('var(--action-halo-shadow-blur, 12px)');
      expect(actionHalo.haloShadowColor).toContain('rgba(200, 160, 48, 0.4)');
    });

    it('should include progressInlay tokens in default preset', () => {
      const { progressInlay } = DEFAULT_STYLE_LAB_PRESET;
      
      expect(progressInlay).toBeDefined();
      expect(progressInlay.progressBackground).toContain('rgba(30, 41, 59, 0.8)');
      expect(progressInlay.progressFill).toContain('linear-gradient');
      expect(progressInlay.progressBorder).toContain('rgba(200, 160, 48, 0.3)');
      expect(progressInlay.progressBorderRadius).toBe('var(--progress-radius, 6px)');
      expect(progressInlay.progressHeight).toBe('var(--progress-height, 6px)');
      expect(progressInlay.progressTransition).toContain('cubic-bezier');
      expect(progressInlay.progressGlowColor).toContain('rgba(200, 160, 48, 0.5)');
      expect(progressInlay.progressGlowIntensity).toBe(0.6);
    });

    it('should include materialFeel.detail tokens in default preset', () => {
      const { materialFeel } = DEFAULT_STYLE_LAB_PRESET;
      
      expect(materialFeel.detail).toBeDefined();
      expect(materialFeel.detail.microTexture).toContain('linear-gradient');
      expect(materialFeel.detail.edgeGlow).toBe('rgba(200, 160, 48, 0.3)');
      expect(materialFeel.detail.surfaceReflection).toBe('rgba(255, 255, 255, 0.08)');
      expect(materialFeel.detail.depthLayers).toBe('var(--depth-layers, 3)');
      expect(materialFeel.detail.metallicFlakes).toContain('radial-gradient');
    });
  });

  describe('Hook Integration', () => {
    it('should expose new token sections through useStyleLabTokens', () => {
      const { result } = renderHook(() => useStyleLabTokens());
      
      expect(result.current.actionCardFrame).toBeDefined();
      expect(result.current.actionHalo).toBeDefined();
      expect(result.current.progressInlay).toBeDefined();
      expect(result.current.materialFeel.detail).toBeDefined();
    });

    it('should generate CSS variables for new token sections', () => {
      const { result } = renderHook(() => useStyleLabTokens());
      const { cssVars } = result.current;
      
      // ActionCard frame CSS variables
      expect(cssVars['--stylelab-action-card-border']).toContain('rgba(200, 160, 48, 0.4)');
      expect(cssVars['--stylelab-action-card-bg']).toContain('linear-gradient');
      expect(cssVars['--stylelab-action-card-radius']).toBe('var(--action-card-radius, 12px)');
      expect(cssVars['--stylelab-action-card-shadow']).toContain('0 8px 32px');
      expect(cssVars['--stylelab-action-card-padding']).toBe('var(--action-card-padding, 16px)');
      expect(cssVars['--stylelab-action-card-min-height']).toBe('var(--action-card-min-height, 80px)');
      expect(cssVars['--stylelab-action-card-transition']).toContain('cubic-bezier');
      
      // ActionHalo CSS variables
      expect(cssVars['--stylelab-action-halo-color']).toContain('rgba(200, 160, 48, 0.6)');
      expect(cssVars['--stylelab-action-halo-glow-intensity']).toBe('0.8');
      expect(cssVars['--stylelab-action-halo-size']).toBe('var(--action-halo-size, 48px)');
      expect(cssVars['--stylelab-action-halo-border-width']).toBe('var(--action-halo-border-width, 3px)');
      expect(cssVars['--stylelab-action-halo-pulse-duration']).toBe('var(--action-halo-pulse-duration, 2s)');
      expect(cssVars['--stylelab-action-halo-pulse-easing']).toBe('var(--action-halo-pulse-easing, ease-in-out)');
      expect(cssVars['--stylelab-action-halo-shadow-blur']).toBe('var(--action-halo-shadow-blur, 12px)');
      expect(cssVars['--stylelab-action-halo-shadow-color']).toContain('rgba(200, 160, 48, 0.4)');
      
      // Progress inlay CSS variables
      expect(cssVars['--stylelab-progress-bg']).toContain('rgba(30, 41, 59, 0.8)');
      expect(cssVars['--stylelab-progress-fill']).toContain('linear-gradient');
      expect(cssVars['--stylelab-progress-border']).toContain('rgba(200, 160, 48, 0.3)');
      expect(cssVars['--stylelab-progress-radius']).toBe('var(--progress-radius, 6px)');
      expect(cssVars['--stylelab-progress-height']).toBe('var(--progress-height, 6px)');
      expect(cssVars['--stylelab-progress-transition']).toContain('cubic-bezier');
      expect(cssVars['--stylelab-progress-glow']).toContain('rgba(200, 160, 48, 0.5)');
      expect(cssVars['--stylelab-progress-glow-intensity']).toBe('0.6');
      
      // Material feel detail CSS variables
      expect(cssVars['--stylelab-detail-texture']).toContain('linear-gradient');
      expect(cssVars['--stylelab-detail-edge-glow']).toBe('rgba(200, 160, 48, 0.3)');
      expect(cssVars['--stylelab-detail-surface-reflection']).toBe('rgba(255, 255, 255, 0.08)');
      expect(cssVars['--stylelab-detail-depth-layers']).toBe('var(--depth-layers, 3)');
      expect(cssVars['--stylelab-detail-metallic-flakes']).toContain('radial-gradient');
    });

    it('should accept preset overrides for new token sections', () => {
      const customFrame: Partial<ActionCardFrameTokens> = {
        frameBorder: 'custom-border',
        framePadding: '20px',
      };
      
      const customHalo: Partial<ActionHaloTokens> = {
        haloColor: 'custom-halo',
        haloGlowIntensity: 1.0,
      };

      const { result } = renderHook(() => useStyleLabTokens({
        presetOverride: {
          actionCardFrame: customFrame,
          actionHalo: customHalo,
        },
      }));
      
      expect(result.current.actionCardFrame.frameBorder).toBe('custom-border');
      expect(result.current.actionCardFrame.framePadding).toBe('20px');
      expect(result.current.actionHalo.haloColor).toBe('custom-halo');
      expect(result.current.actionHalo.haloGlowIntensity).toBe(1.0);
    });
  });

  describe('Helper Functions', () => {
    it('getActionCardFeel should return default tokens without preset', () => {
      const result = getActionCardFeel();
      
      expect(result.frameBorder).toContain('rgba(200, 160, 48, 0.4)');
      expect(result.frameBackground).toContain('linear-gradient');
      expect(result.frameBorderRadius).toBe('var(--action-card-radius, 12px)');
      expect(result.framePadding).toBe('var(--action-card-padding, 16px)');
    });

    it('getActionCardFeel should accept overrides', () => {
      const result = getActionCardFeel(undefined, {
        frameBorder: 'custom-border',
        frameMinHeight: '100px',
      });
      
      expect(result.frameBorder).toBe('custom-border');
      expect(result.frameMinHeight).toBe('100px');
      expect(result.frameBackground).toContain('linear-gradient'); // Should keep default
    });

    it('getActionHaloTokens should return default tokens without preset', () => {
      const result = getActionHaloTokens();
      
      expect(result.haloColor).toContain('rgba(200, 160, 48, 0.6)');
      expect(result.haloGlowIntensity).toBe(0.8);
      expect(result.haloSize).toBe('var(--action-halo-size, 48px)');
      expect(result.haloPulseDuration).toBe('var(--action-halo-pulse-duration, 2s)');
    });

    it('getActionHaloTokens should accept overrides', () => {
      const result = getActionHaloTokens(undefined, {
        haloColor: 'custom-halo',
        haloGlowIntensity: 1.2,
      });
      
      expect(result.haloColor).toBe('custom-halo');
      expect(result.haloGlowIntensity).toBe(1.2);
      expect(result.haloSize).toBe('var(--action-halo-size, 48px)'); // Should keep default
    });

    it('should handle presetId parameter correctly', () => {
      // Test with non-existent preset (should fall back to default)
      const frameResult = getActionCardFeel('non-existent');
      const haloResult = getActionHaloTokens('non-existent');
      
      expect(frameResult.frameBorder).toContain('rgba(200, 160, 48, 0.4)');
      expect(haloResult.haloColor).toContain('rgba(200, 160, 48, 0.6)');
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for new token sections', () => {
      const { result } = renderHook(() => useStyleLabTokens());
      
      // These should not have TypeScript errors
      const frame: ActionCardFrameTokens = result.current.actionCardFrame;
      const halo: ActionHaloTokens = result.current.actionHalo;
      const progress: ProgressInlayTokens = result.current.progressInlay;
      
      expect(frame.frameBorder).toBeDefined();
      expect(halo.haloColor).toBeDefined();
      expect(progress.progressBackground).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing token structure', () => {
      const { result } = renderHook(() => useStyleLabTokens());
      
      // Existing tokens should still be available
      expect(result.current.preset).toBeDefined();
      expect(result.current.cssVars).toBeDefined();
      expect(result.current.modifierScopes).toBeDefined();
      expect(result.current.modifierStatus).toBeDefined();
      expect(result.current.interactionColors).toBeDefined();
      expect(result.current.interactionPhysics).toBeDefined();
      expect(result.current.materialFeel).toBeDefined();
      expect(result.current.audioHaptics).toBeDefined();
    });

    it('should preserve existing CSS variables', () => {
      const { result } = renderHook(() => useStyleLabTokens());
      const { cssVars } = result.current;
      
      // Existing CSS variables should still be present
      expect(cssVars['--stylelab-heading-font']).toBeDefined();
      expect(cssVars['--stylelab-body-font']).toBeDefined();
      expect(cssVars['--stylelab-panel-border']).toBeDefined();
      expect(cssVars['--stylelab-accent-primary']).toBeDefined();
      expect(cssVars['--stylelab-focus-ring']).toBeDefined();
      expect(cssVars['--stylelab-shadow-depth-token']).toBeDefined();
      expect(cssVars['--stylelab-physics-lift-scale']).toBeDefined();
    });
  });
});
