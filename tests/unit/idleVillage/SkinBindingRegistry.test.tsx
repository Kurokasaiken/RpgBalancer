/**
 * SkinBindingRegistry Tests
 * 
 * Unit tests for the skin binding registry functionality
 * Tests component certification, binding lookup, and utility functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getComponentSkinBinding,
  isCertifiedComponent,
  getCertifiedComponentIds,
  getComponentsForPillar,
  generateSkinClassName,
  generateSkinDataAttributes,
  getComponentTelemetryEvent,
  CERTIFIED_COMPONENT_BINDINGS,
  type CertifiedComponentId,
} from '@/ui/idleVillage/skins/SkinBindingRegistry';

describe('SkinBindingRegistry', () => {
  describe('CERTIFIED_COMPONENT_BINDINGS', () => {
    it('should contain all certified components', () => {
      const expectedComponents: CertifiedComponentId[] = [
        'PgCard',
        'ResidentSlotRack',
        'TimeEngineStrip',
        'ActiveHUD',
        'ActivityCapsule',
        'ActionHalo',
        'SlottedMedal',
        'VillageRosterSection',
      ];

      expectedComponents.forEach(componentId => {
        expect(CERTIFIED_COMPONENT_BINDINGS).toHaveProperty(componentId);
      });
    });

    it('should have valid binding structure for each component', () => {
      Object.values(CERTIFIED_COMPONENT_BINDINGS).forEach(binding => {
        expect(binding).toHaveProperty('componentId');
        expect(binding).toHaveProperty('defaultPreset');
        expect(binding).toHaveProperty('supportedPillars');
        expect(binding).toHaveProperty('cssClassBase');
        expect(binding).toHaveProperty('dataAttributePrefix');
        expect(binding).toHaveProperty('supportsMotionLevel');
        expect(binding).toHaveProperty('supportsTelemetry');
        
        expect(typeof binding.componentId).toBe('string');
        expect(typeof binding.defaultPreset).toBe('string');
        expect(Array.isArray(binding.supportedPillars)).toBe(true);
        expect(typeof binding.cssClassBase).toBe('string');
        expect(typeof binding.dataAttributePrefix).toBe('string');
        expect(typeof binding.supportsMotionLevel).toBe('boolean');
        expect(typeof binding.supportsTelemetry).toBe('boolean');
      });
    });
  });

  describe('getComponentSkinBinding', () => {
    it('should return binding for certified component', () => {
      const binding = getComponentSkinBinding('PgCard');
      
      expect(binding.componentId).toBe('PgCard');
      expect(binding.defaultPreset).toBe('minimal-frontier');
      expect(binding.supportedPillars).toContain('frontier');
      expect(binding.cssClassBase).toBe('pgcard-skin');
      expect(binding.dataAttributePrefix).toBe('pgcard');
      expect(binding.supportsMotionLevel).toBe(true);
      expect(binding.supportsTelemetry).toBe(true);
    });

    it('should throw error for non-certified component', () => {
      expect(() => {
        getComponentSkinBinding('NonExistentComponent' as CertifiedComponentId);
      }).toThrow('No skin binding found for component: NonExistentComponent');
    });
  });

  describe('isCertifiedComponent', () => {
    it('should return true for certified components', () => {
      expect(isCertifiedComponent('PgCard')).toBe(true);
      expect(isCertifiedComponent('ResidentSlotRack')).toBe(true);
      expect(isCertifiedComponent('TimeEngineStrip')).toBe(true);
    });

    it('should return false for non-certified components', () => {
      expect(isCertifiedComponent('NonExistentComponent')).toBe(false);
      expect(isCertifiedComponent('RandomComponent')).toBe(false);
    });
  });

  describe('getCertifiedComponentIds', () => {
    it('should return all certified component IDs', () => {
      const ids = getCertifiedComponentIds();
      
      expect(ids).toHaveLength(8);
      expect(ids).toContain('PgCard');
      expect(ids).toContain('ResidentSlotRack');
      expect(ids).toContain('TimeEngineStrip');
      expect(ids).toContain('ActiveHUD');
      expect(ids).toContain('ActivityCapsule');
      expect(ids).toContain('ActionHalo');
      expect(ids).toContain('SlottedMedal');
      expect(ids).toContain('VillageRosterSection');
    });
  });

  describe('getComponentsForPillar', () => {
    it('should return components that support frontier pillar', () => {
      const components = getComponentsForPillar('frontier');
      
      expect(components).toHaveLength(8); // All components should support frontier
      expect(components).toContain('PgCard');
      expect(components).toContain('ResidentSlotRack');
    });

    it('should return components that support wilderness pillar', () => {
      const components = getComponentsForPillar('wilderness');
      
      expect(components.length).toBeGreaterThan(0);
      expect(components).toContain('PgCard');
      expect(components).toContain('ResidentSlotRack');
    });

    it('should return components that support empire pillar', () => {
      const components = getComponentsForPillar('empire');
      
      expect(components.length).toBeGreaterThan(0);
      expect(components).toContain('PgCard');
      expect(components).toContain('ResidentSlotRack');
    });
  });

  describe('generateSkinClassName', () => {
    it('should generate correct class name for PgCard', () => {
      const className = generateSkinClassName('PgCard', 'wanderlust', 'wilderness');
      
      expect(className).toBe('pgcard-skin-wanderlust pgcard-skin-wilderness');
    });

    it('should generate correct class name for ResidentSlotRack', () => {
      const className = generateSkinClassName('ResidentSlotRack', 'minimal-frontier', 'frontier');
      
      expect(className).toBe('slotrack-skin-minimal-frontier slotrack-skin-frontier');
    });

    it('should generate correct class name for TimeEngineStrip', () => {
      const className = generateSkinClassName('TimeEngineStrip', 'wanderlust', 'empire');
      
      expect(className).toBe('timeengine-skin-wanderlust timeengine-skin-empire');
    });
  });

  describe('generateSkinDataAttributes', () => {
    it('should generate data attributes without motion level', () => {
      const attributes = generateSkinDataAttributes('PgCard', 'wanderlust', 'wilderness');
      
      expect(attributes).toEqual({
        'data-pgcard-preset': 'wanderlust',
        'data-pgcard-pillar': 'wilderness',
      });
    });

    it('should generate data attributes with motion level', () => {
      const attributes = generateSkinDataAttributes('PgCard', 'wanderlust', 'wilderness', 'minimal');
      
      expect(attributes).toEqual({
        'data-pgcard-preset': 'wanderlust',
        'data-pgcard-pillar': 'wilderness',
        'data-pgcard-motion': 'minimal',
      });
    });

    it('should generate correct attributes for different components', () => {
      const pgCardAttrs = generateSkinDataAttributes('PgCard', 'wanderlust', 'frontier');
      const rackAttrs = generateSkinDataAttributes('ResidentSlotRack', 'minimal-frontier', 'frontier');
      
      expect(pgCardAttrs).toHaveProperty('data-pgcard-preset');
      expect(pgCardAttrs).toHaveProperty('data-pgcard-pillar');
      
      expect(rackAttrs).toHaveProperty('data-slotrack-preset');
      expect(rackAttrs).toHaveProperty('data-slotrack-pillar');
    });
  });

  describe('getComponentTelemetryEvent', () => {
    it('should generate correct telemetry event names', () => {
      expect(getComponentTelemetryEvent('PgCard', 'rendered')).toBe('skin_pgcard_rendered');
      expect(getComponentTelemetryEvent('PgCard', 'drag_start')).toBe('skin_pgcard_drag_start');
      expect(getComponentTelemetryEvent('ResidentSlotRack', 'slot_assigned')).toBe('skin_slotrack_slot_assigned');
      expect(getComponentTelemetryEvent('TimeEngineStrip', 'tick')).toBe('skin_timeengine_tick');
    });

    it('should handle different actions for same component', () => {
      const baseEvents = [
        'rendered',
        'click',
        'drag_start',
        'drag_end',
        'hover',
      ];

      baseEvents.forEach(action => {
        const eventName = getComponentTelemetryEvent('PgCard', action);
        expect(eventName).toBe(`skin_pgcard_${action}`);
      });
    });
  });

  describe('component-specific properties', () => {
    it('should have correct skin properties for PgCard', () => {
      const binding = getComponentSkinBinding('PgCard');
      
      expect(binding.skinProperties).toEqual({
        materialType: 'medal',
        interactionPhysics: true,
        audioHaptics: true,
      });
    });

    it('should have correct skin properties for ResidentSlotRack', () => {
      const binding = getComponentSkinBinding('ResidentSlotRack');
      
      expect(binding.skinProperties).toEqual({
        slotType: 'resident',
        dropZones: true,
        dragFeedback: true,
      });
    });

    it('should have correct skin properties for SlottedMedal', () => {
      const binding = getComponentSkinBinding('SlottedMedal');
      
      expect(binding.skinProperties).toEqual({
        medalType: 'bronze',
        interactionPhysics: true,
        resistRing: true,
        haloCanvas: true,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty pillar list gracefully', () => {
      // This would be an edge case if a component had no supported pillars
      const binding = getComponentSkinBinding('PgCard');
      expect(Array.isArray(binding.supportedPillars)).toBe(true);
      expect(binding.supportedPillars.length).toBeGreaterThan(0);
    });

    it('should handle all pillar types', () => {
      const pillars = ['frontier', 'wilderness', 'empire'] as const;
      
      pillars.forEach(pillar => {
        const components = getComponentsForPillar(pillar);
        expect(components.length).toBeGreaterThan(0);
        
        components.forEach(componentId => {
          const binding = getComponentSkinBinding(componentId);
          expect(binding.supportedPillars).toContain(pillar);
        });
      });
    });
  });

  describe('type safety', () => {
    it('should maintain type safety for component IDs', () => {
      const certifiedIds = getCertifiedComponentIds();
      
      certifiedIds.forEach(id => {
        // This should not cause TypeScript errors
        const binding = getComponentSkinBinding(id);
        expect(typeof binding.componentId).toBe('string');
        
        const className = generateSkinClassName(id, 'minimal-frontier', 'frontier');
        expect(typeof className).toBe('string');
        
        const attributes = generateSkinDataAttributes(id, 'minimal-frontier', 'frontier');
        expect(typeof attributes).toBe('object');
      });
    });
  });
});
