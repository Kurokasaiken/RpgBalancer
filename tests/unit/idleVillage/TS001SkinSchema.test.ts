/**
 * TS-001: Core Schema & Manager Test Suite
 * 
 * Comprehensive test suite for TS-001 compliance of the skin system.
 * Tests schema validation, manager functionality, and integration.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TS001SkinValidator, type ValidatedSkinPreset, type ValidatedComponentBinding } from '@/ui/idleVillage/skins/validation/SkinSchemaValidation';

describe('TS-001: Core Schema & Manager', () => {
  describe('Schema Validation', () => {
    describe('SkinPresetConfig', () => {
      it('should validate a correct minimal preset configuration', () => {
        const validPreset = {
          id: 'minimal-frontier',
          name: 'Minimal Frontier',
          description: 'A minimal preset with frontier theme',
          version: '1.0.0',
          author: 'Test Author',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          
          colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#f59e0b',
            background: '#ffffff',
            surface: '#f8fafc',
            border: '#e2e8f0',
            text: '#1e293b',
            textSecondary: '#64748b',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
          },
          
          animations: {
            enabled: true,
            duration: 300,
            easing: 'ease-in-out',
            delay: 0,
          },
          
          typography: {
            fontFamily: 'Inter, sans-serif',
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem',
              '4xl': '2.25rem',
            },
            fontWeight: {
              light: 300,
              normal: 400,
              medium: 500,
              semibold: 600,
              bold: 700,
            },
            lineHeight: {
              tight: 1.25,
              normal: 1.5,
              relaxed: 1.75,
            },
          },
          
          spacing: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
            '3xl': '4rem',
          },
          
          borders: {
            radius: {
              none: '0',
              sm: '0.125rem',
              md: '0.375rem',
              lg: '0.5rem',
              xl: '0.75rem',
              full: '9999px',
            },
            width: {
              none: '0',
              thin: '1px',
              normal: '2px',
              thick: '4px',
            },
          },
          
          shadows: {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
          },
          
          tags: ['minimal', 'frontier'],
          category: 'minimal' as const,
          isDefault: false,
          isExperimental: false,
          
          supportedComponents: ['PgCard', 'ActivitySlot'],
          supportedPillars: ['frontier'],
          supportedMotionLevels: ['minimal', 'full'],
        };

        const result = TS001SkinValidator.validatePreset(validPreset);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe('minimal-frontier');
          expect(result.data.colors.primary).toBe('#3b82f6');
        }
      });

      it('should reject invalid preset configuration', () => {
        const invalidPreset = {
          id: 'invalid-preset', // Invalid preset ID
          name: '', // Empty name
          description: 'Test',
          version: '1.0', // Invalid version format
          author: 'Test',
          createdAt: 'invalid-date', // Invalid date
          updatedAt: '2024-01-01T00:00:00Z',
          
          colors: {
            primary: 'invalid-color', // Invalid color format
            secondary: '#64748b',
            accent: '#f59e0b',
            background: '#ffffff',
            surface: '#f8fafc',
            border: '#e2e8f0',
            text: '#1e293b',
            textSecondary: '#64748b',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
          },
          
          animations: {
            enabled: true,
            duration: -100, // Invalid negative duration
            easing: 'ease-in-out',
            delay: 0,
          },
          
          typography: {
            fontFamily: 'Inter, sans-serif',
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem',
              '4xl': '2.25rem',
            },
            fontWeight: {
              light: 300,
              normal: 400,
              medium: 500,
              semibold: 600,
              bold: 700,
            },
            lineHeight: {
              tight: 1.25,
              normal: 1.5,
              relaxed: 1.75,
            },
          },
          
          spacing: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
            '3xl': '4rem',
          },
          
          borders: {
            radius: {
              none: '0',
              sm: '0.125rem',
              md: '0.375rem',
              lg: '0.5rem',
              xl: '0.75rem',
              full: '9999px',
            },
            width: {
              none: '0',
              thin: '1px',
              normal: '2px',
              thick: '4px',
            },
          },
          
          shadows: {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
          },
          
          tags: ['minimal', 'frontier'],
          category: 'minimal' as const,
          isDefault: false,
          isExperimental: false,
          
          supportedComponents: [], // Empty components array - invalid
          supportedPillars: ['frontier'],
          supportedMotionLevels: ['minimal', 'full'],
        };

        const result = TS001SkinValidator.validatePreset(invalidPreset);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0);
        }
      });
    });

    describe('ComponentSkinBinding', () => {
      it('should validate a correct component binding', () => {
        const validBinding = {
          componentId: 'PgCard',
          name: 'Player Character Card',
          description: 'Card component for player characters',
          version: '1.0.0',
          
          defaultPreset: 'minimal-frontier',
          supportedPillars: ['frontier', 'wilderness'],
          supportedMotionLevels: ['minimal', 'reduced', 'full'],
          
          cssClassBase: 'pg-card',
          dataAttributePrefix: 'pg-card',
          
          supportsMotionLevel: true,
          supportsTelemetry: true,
          supportsPillarSwitching: true,
          
          requiredProperties: ['hp', 'fatigue'],
          optionalProperties: ['portraitUrl', 'level'],
          
          category: 'interactive' as const,
          priority: 100,
          tags: ['card', 'player', 'character'],
        };

        const result = TS001SkinValidator.validateBinding(validBinding);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.componentId).toBe('PgCard');
          expect(result.data.cssClassBase).toBe('pg-card');
        }
      });

      it('should reject invalid component binding', () => {
        const invalidBinding = {
          componentId: '', // Empty component ID
          name: 'Test',
          description: 'Test',
          version: '1.0.0',
          
          defaultPreset: 'minimal-frontier',
          supportedPillars: [], // Empty array - invalid
          supportedMotionLevels: ['minimal'],
          
          cssClassBase: '123invalid', // Invalid CSS class name
          dataAttributePrefix: 'valid-prefix',
          
          supportsMotionLevel: true,
          supportsTelemetry: true,
          supportsPillarSwitching: true,
          
          requiredProperties: [],
          optionalProperties: [],
          
          category: 'interactive' as const,
          priority: 100,
          tags: [],
        };

        const result = TS001SkinValidator.validateBinding(invalidBinding);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0);
        }
      });
    });

    describe('SkinState', () => {
      it('should validate a correct skin state', () => {
        const validState = {
          currentPreset: 'minimal-frontier',
          currentPillar: 'frontier',
          currentMotionLevel: 'full',
          
          activeBindings: {
            'PgCard': {
              componentId: 'PgCard',
              name: 'Player Character Card',
              description: 'Card component for player characters',
              version: '1.0.0',
              
              defaultPreset: 'minimal-frontier',
              supportedPillars: ['frontier'],
              supportedMotionLevels: ['full'],
              
              cssClassBase: 'pg-card',
              dataAttributePrefix: 'pg-card',
              
              supportsMotionLevel: true,
              supportsTelemetry: true,
              supportsPillarSwitching: true,
              
              requiredProperties: ['hp'],
              optionalProperties: [],
              
              category: 'interactive' as const,
              priority: 100,
              tags: ['card'],
            },
          },
          
          computedStyles: {
            'PgCard': 'color: #3b82f6; background: #ffffff;',
          },
          computedClasses: {
            'PgCard': ['pg-card', 'pg-card--frontier', 'pg-card--full'],
          },
          computedAttributes: {
            'PgCard': {
              'data-skin-preset': 'minimal-frontier',
              'data-skin-pillar': 'frontier',
            },
          },
          
          lastUpdated: '2024-01-01T00:00:00Z',
          updateCount: 5,
          isTransitioning: false,
        };

        const result = TS001SkinValidator.validateState(validState);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentPreset).toBe('minimal-frontier');
          expect(result.data.activeBindings).toHaveProperty('PgCard');
        }
      });
    });

    describe('SkinAction', () => {
      it('should validate SET_PRESET action', () => {
        const validAction = {
          type: 'SET_PRESET' as const,
          payload: { presetId: 'minimal-frontier' },
        };

        const result = TS001SkinValidator.validateAction(validAction);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe('SET_PRESET');
          expect(result.data.payload.presetId).toBe('minimal-frontier');
        }
      });

      it('should validate REGISTER_COMPONENT action', () => {
        const validAction = {
          type: 'REGISTER_COMPONENT' as const,
          payload: {
            binding: {
              componentId: 'TestComponent',
              name: 'Test Component',
              description: 'A test component',
              version: '1.0.0',
              
              defaultPreset: 'minimal-frontier',
              supportedPillars: ['frontier'],
              supportedMotionLevels: ['minimal'],
              
              cssClassBase: 'test-component',
              dataAttributePrefix: 'test',
              
              supportsMotionLevel: false,
              supportsTelemetry: false,
              supportsPillarSwitching: false,
              
              requiredProperties: [],
              optionalProperties: [],
              
              category: 'ui' as const,
              priority: 500,
              tags: ['test'],
            },
          },
        };

        const result = TS001SkinValidator.validateAction(validAction);
        expect(result.success).toBe(true);
      });

      it('should reject invalid action', () => {
        const invalidAction = {
          type: 'INVALID_ACTION' as const,
          payload: {},
        };

        const result = TS001SkinValidator.validateAction(invalidAction);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('TS-001 Compliance', () => {
    it('should validate complete TS-001 compliance', () => {
      const complianceData = {
        presets: [
          {
            id: 'minimal-frontier',
            name: 'Minimal Frontier',
            description: 'A minimal preset with frontier theme',
            version: '1.0.0',
            author: 'Test Author',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            
            colors: {
              primary: '#3b82f6',
              secondary: '#64748b',
              accent: '#f59e0b',
              background: '#ffffff',
              surface: '#f8fafc',
              border: '#e2e8f0',
              text: '#1e293b',
              textSecondary: '#64748b',
              success: '#10b981',
              warning: '#f59e0b',
              error: '#ef4444',
              info: '#3b82f6',
            },
            
            animations: {
              enabled: true,
              duration: 300,
              easing: 'ease-in-out',
              delay: 0,
            },
            
            typography: {
              fontFamily: 'Inter, sans-serif',
              fontSize: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.875rem',
                '4xl': '2.25rem',
              },
              fontWeight: {
                light: 300,
                normal: 400,
                medium: 500,
                semibold: 600,
                bold: 700,
              },
              lineHeight: {
                tight: 1.25,
                normal: 1.5,
                relaxed: 1.75,
              },
            },
            
            spacing: {
              xs: '0.25rem',
              sm: '0.5rem',
              md: '1rem',
              lg: '1.5rem',
              xl: '2rem',
              '2xl': '3rem',
              '3xl': '4rem',
            },
            
            borders: {
              radius: {
                none: '0',
                sm: '0.125rem',
                md: '0.375rem',
                lg: '0.5rem',
                xl: '0.75rem',
                full: '9999px',
              },
              width: {
                none: '0',
                thin: '1px',
                normal: '2px',
                thick: '4px',
              },
            },
            
            shadows: {
              sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
              '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
              inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
            },
            
            tags: ['minimal', 'frontier'],
            category: 'minimal' as const,
            isDefault: false,
            isExperimental: false,
            
            supportedComponents: ['PgCard'],
            supportedPillars: ['frontier'],
            supportedMotionLevels: ['minimal', 'full'],
          },
        ],
        
        bindings: [
          {
            componentId: 'PgCard',
            name: 'Player Character Card',
            description: 'Card component for player characters',
            version: '1.0.0',
            
            defaultPreset: 'minimal-frontier',
            supportedPillars: ['frontier'],
            supportedMotionLevels: ['minimal', 'full'],
            
            cssClassBase: 'pg-card',
            dataAttributePrefix: 'pg-card',
            
            supportsMotionLevel: true,
            supportsTelemetry: true,
            supportsPillarSwitching: true,
            
            requiredProperties: ['hp'],
            optionalProperties: [],
            
            category: 'interactive' as const,
            priority: 100,
            tags: ['card'],
          },
        ],
        
        state: {
          currentPreset: 'minimal-frontier',
          currentPillar: 'frontier',
          currentMotionLevel: 'full',
          
          activeBindings: {
            'PgCard': {
              componentId: 'PgCard',
              name: 'Player Character Card',
              description: 'Card component for player characters',
              version: '1.0.0',
              
              defaultPreset: 'minimal-frontier',
              supportedPillars: ['frontier'],
              supportedMotionLevels: ['full'],
              
              cssClassBase: 'pg-card',
              dataAttributePrefix: 'pg-card',
              
              supportsMotionLevel: true,
              supportsTelemetry: true,
              supportsPillarSwitching: true,
              
              requiredProperties: ['hp'],
              optionalProperties: [],
              
              category: 'interactive' as const,
              priority: 100,
              tags: ['card'],
            },
          },
          
          computedStyles: {
            'PgCard': 'color: #3b82f6;',
          },
          computedClasses: {
            'PgCard': ['pg-card', 'pg-card--frontier'],
          },
          computedAttributes: {
            'PgCard': {
              'data-skin-preset': 'minimal-frontier',
            },
          },
          
          lastUpdated: '2024-01-01T00:00:00Z',
          updateCount: 1,
          isTransitioning: false,
        },
        
        config: {
          enableTelemetry: true,
          enableDebugMode: false,
          enablePerformanceMonitoring: true,
          
          defaultPreset: 'minimal-frontier',
          defaultPillar: 'frontier',
          defaultMotionLevel: 'full',
          
          maxComponentCount: 1000,
          updateDebounceMs: 100,
          transitionTimeoutMs: 5000,
          
          enableStrictValidation: true,
          enableExperimentalFeatures: false,
          
          enableCache: true,
          cacheMaxAge: 3600000,
          cacheMaxSize: 1000,
          
          enablePersistence: true,
          persistenceKey: 'skin-system-state',
          persistenceStrategy: 'localStorage' as const,
        },
      };

      const result = TS001SkinValidator.validateTS001Compliance(complianceData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect TS-001 compliance violations', () => {
      const nonCompliantData = {
        presets: [
          {
            // Invalid preset - missing required fields and invalid values
            id: 'minimal-frontier', // Valid ID but other fields invalid
            name: '', // Empty name - invalid
            description: 'Test',
            version: '1.0.0',
            author: 'Test',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            
            colors: {
              primary: 'invalid-color', // Invalid color format
              secondary: '#64748b',
              accent: '#f59e0b',
              background: '#ffffff',
              surface: '#f8fafc',
              border: '#e2e8f0',
              text: '#1e293b',
              textSecondary: '#64748b',
              success: '#10b981',
              warning: '#f59e0b',
              error: '#ef4444',
              info: '#3b82f6',
            },
            
            animations: {
              enabled: true,
              duration: 300,
              easing: 'ease-in-out',
              delay: 0,
            },
            
            typography: {
              fontFamily: 'Inter, sans-serif',
              fontSize: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.875rem',
                '4xl': '2.25rem',
              },
              fontWeight: {
                light: 300,
                normal: 400,
                medium: 500,
                semibold: 600,
                bold: 700,
              },
              lineHeight: {
                tight: 1.25,
                normal: 1.5,
                relaxed: 1.75,
              },
            },
            
            spacing: {
              xs: '0.25rem',
              sm: '0.5rem',
              md: '1rem',
              lg: '1.5rem',
              xl: '2rem',
              '2xl': '3rem',
              '3xl': '4rem',
            },
            
            borders: {
              radius: {
                none: '0',
                sm: '0.125rem',
                md: '0.375rem',
                lg: '0.5rem',
                xl: '0.75rem',
                full: '9999px',
              },
              width: {
                none: '0',
                thin: '1px',
                normal: '2px',
                thick: '4px',
              },
            },
            
            shadows: {
              sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
              '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
              inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
            },
            
            tags: ['minimal', 'frontier'],
            category: 'minimal' as const,
            isDefault: false,
            isExperimental: false,
            
            supportedComponents: [], // Empty array - invalid
            supportedPillars: ['frontier'],
            supportedMotionLevels: ['minimal', 'full'],
          },
        ],
        
        bindings: [],
        
        state: {
          currentPreset: 'minimal-frontier',
          currentPillar: 'frontier',
          currentMotionLevel: 'full',
          
          activeBindings: {},
          
          computedStyles: {},
          computedClasses: {},
          computedAttributes: {},
          
          lastUpdated: '2024-01-01T00:00:00Z',
          updateCount: 0,
          isTransitioning: false,
        },
        
        config: {
          enableTelemetry: true,
          enableDebugMode: false,
          enablePerformanceMonitoring: true,
          
          defaultPreset: 'minimal-frontier',
          defaultPillar: 'frontier',
          defaultMotionLevel: 'full',
          
          maxComponentCount: 1000,
          updateDebounceMs: 100,
          transitionTimeoutMs: 5000,
          
          enableStrictValidation: true,
          enableExperimentalFeatures: false,
          
          enableCache: true,
          cacheMaxAge: 3600000,
          cacheMaxSize: 1000,
          
          enablePersistence: true,
          persistenceKey: 'skin-system-state',
          persistenceStrategy: 'localStorage' as const,
        },
      };

      const result = TS001SkinValidator.validateTS001Compliance(nonCompliantData);
      
      // Debug: check individual validations
      console.log('Preset validation result:', result.results.presets[0]);
      console.log('State validation result:', result.results.state);
      console.log('Config validation result:', result.results.config);
      console.log('All errors:', result.errors);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const largePresets = Array.from({ length: 100 }, (_, i) => ({
        id: 'minimal-frontier' as any, // Use valid preset ID for all
        name: `Preset ${i}`,
        description: `Test preset ${i}`,
        version: '1.0.0',
        author: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          accent: '#f59e0b',
          background: '#ffffff',
          surface: '#f8fafc',
          border: '#e2e8f0',
          text: '#1e293b',
          textSecondary: '#64748b',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
        
        animations: {
          enabled: true,
          duration: 300,
          easing: 'ease-in-out',
          delay: 0,
        },
        
        typography: {
          fontFamily: 'Inter, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75,
          },
        },
        
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
          '3xl': '4rem',
        },
        
        borders: {
          radius: {
            none: '0',
            sm: '0.125rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
            full: '9999px',
          },
          width: {
            none: '0',
            thin: '1px',
            normal: '2px',
            thick: '4px',
          },
        },
        
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
          '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
          inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        },
        
        tags: ['test'],
        category: 'minimal' as const,
        isDefault: false,
        isExperimental: false,
        
        supportedComponents: ['PgCard'],
        supportedPillars: ['frontier'],
        supportedMotionLevels: ['minimal', 'full'],
      }));

      const startTime = performance.now();
      
      for (const preset of largePresets) {
        const result = TS001SkinValidator.validatePreset(preset);
        expect(result.success).toBe(true);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should validate 100 presets in under 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle null and undefined inputs gracefully', () => {
      expect(TS001SkinValidator.validatePreset(null).success).toBe(false);
      expect(TS001SkinValidator.validatePreset(undefined).success).toBe(false);
      expect(TS001SkinValidator.validateBinding(null).success).toBe(false);
      expect(TS001SkinValidator.validateBinding(undefined).success).toBe(false);
      expect(TS001SkinValidator.validateState(null).success).toBe(false);
      expect(TS001SkinValidator.validateState(undefined).success).toBe(false);
      expect(TS001SkinValidator.validateAction(null).success).toBe(false);
      expect(TS001SkinValidator.validateAction(undefined).success).toBe(false);
      expect(TS001SkinValidator.validateSystemConfig(null).success).toBe(false);
      expect(TS001SkinValidator.validateSystemConfig(undefined).success).toBe(false);
    });
  });
});
