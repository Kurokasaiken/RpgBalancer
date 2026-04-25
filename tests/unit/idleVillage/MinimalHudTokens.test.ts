import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  defaultMinimalHudTokens,
  resolveHudToken,
  mergeHudTokens,
  MinimalHudTokensSchema,
  type MinimalHudTokens,
} from '../minimalHudTokens';

// Mock console.warn to capture warnings
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('MinimalHudTokens', () => {
  beforeEach(() => {
    consoleWarnSpy.mockClear();
  });

  describe('defaultMinimalHudTokens', () => {
    it('should validate against the schema', () => {
      const result = MinimalHudTokensSchema.safeParse(defaultMinimalHudTokens);
      expect(result.success).toBe(true);
    });

    it('should have all required sections', () => {
      expect(defaultMinimalHudTokens).toHaveProperty('typography');
      expect(defaultMinimalHudTokens).toHaveProperty('gradients');
      expect(defaultMinimalHudTokens).toHaveProperty('spacing');
      expect(defaultMinimalHudTokens).toHaveProperty('badgeVariants');
      expect(defaultMinimalHudTokens).toHaveProperty('warningTokens');
    });

    it('should have valid typography tokens', () => {
      const typography = defaultMinimalHudTokens.typography;
      expect(typeof typography.fontFamily).toBe('string');
      expect(typeof typography.baseFontSize).toBe('number');
      expect(typeof typography.lineHeight).toBe('number');
      expect(typeof typography.fontWeightNormal).toBe('number');
      expect(typeof typography.fontWeightBold).toBe('number');
      expect(typeof typography.letterSpacing).toBe('string');
    });

    it('should have valid gradient tokens', () => {
      const gradients = defaultMinimalHudTokens.gradients;
      expect(typeof gradients.primary).toBe('string');
      expect(typeof gradients.secondary).toBe('string');
      expect(typeof gradients.warning).toBe('string');
      expect(typeof gradients.danger).toBe('string');

      // Should contain 'linear-gradient'
      Object.values(gradients).forEach(gradient => {
        expect(gradient).toContain('linear-gradient');
      });
    });

    it('should have valid spacing tokens', () => {
      const spacing = defaultMinimalHudTokens.spacing;
      expect(typeof spacing.xs).toBe('string');
      expect(typeof spacing.sm).toBe('string');
      expect(typeof spacing.md).toBe('string');
      expect(typeof spacing.lg).toBe('string');
      expect(typeof spacing.xl).toBe('string');
    });

    it('should have valid badge variant tokens', () => {
      const badgeVariants = defaultMinimalHudTokens.badgeVariants;

      ['default', 'success', 'warning', 'danger'].forEach(variant => {
        const badge = badgeVariants[variant as keyof typeof badgeVariants];
        expect(badge).toHaveProperty('backgroundColor');
        expect(badge).toHaveProperty('color');
        expect(badge).toHaveProperty('borderRadius');
        expect(badge).toHaveProperty('padding');
      });
    });

    it('should have valid warning tokens', () => {
      const warningTokens = defaultMinimalHudTokens.warningTokens;

      ['low', 'medium', 'high'].forEach(severity => {
        const warning = warningTokens[severity as keyof typeof warningTokens];
        expect(warning).toHaveProperty('backgroundColor');
        expect(warning).toHaveProperty('color');
        expect(warning).toHaveProperty('border');
        expect(warning).toHaveProperty('animation');
      });
    });
  });

  describe('resolveHudToken', () => {
    it('should resolve typography tokens', () => {
      const result = resolveHudToken('typography.baseFontSize');
      expect(result).toBe(14);
    });

    it('should resolve gradient tokens', () => {
      const result = resolveHudToken('gradients.primary');
      expect(result).toBe(defaultMinimalHudTokens.gradients.primary);
    });

    it('should resolve spacing tokens', () => {
      const result = resolveHudToken('spacing.md');
      expect(result).toBe('1rem');
    });

    it('should resolve badge variant tokens', () => {
      const result = resolveHudToken('badgeVariants.success.backgroundColor');
      expect(result).toBe('rgba(34,197,94,0.1)');
    });

    it('should resolve warning tokens', () => {
      const result = resolveHudToken('warningTokens.high.animation');
      expect(result).toBe('shake 0.5s ease-in-out');
    });

    it('should return fallback for missing tokens', () => {
      const result = resolveHudToken('nonexistent.token', 'fallback-value');
      expect(result).toBe('fallback-value');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[MinimalHudTokens] Token not found: nonexistent.token, using fallback');
    });

    it('should return undefined for missing tokens without fallback', () => {
      const result = resolveHudToken('nonexistent.token');
      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith('[MinimalHudTokens] Token not found: nonexistent.token');
    });

    it('should handle invalid paths gracefully', () => {
      const result = resolveHudToken('', 'fallback');
      expect(result).toBe('fallback');
    });

    it('should handle deep nested paths', () => {
      const result = resolveHudToken('badgeVariants.warning.padding');
      expect(result).toBe('0.125rem 0.5rem');
    });
  });

  describe('mergeHudTokens', () => {
    const baseTokens: MinimalHudTokens = {
      typography: {
        fontFamily: 'Arial',
        baseFontSize: 12,
        lineHeight: 1.2,
        fontWeightNormal: 300,
        fontWeightBold: 500,
        letterSpacing: '0.05em',
      },
      gradients: {
        primary: 'linear-gradient(to right, red, blue)',
        secondary: 'linear-gradient(to right, green, yellow)',
        warning: 'linear-gradient(to right, orange, red)',
        danger: 'linear-gradient(to right, purple, pink)',
      },
      spacing: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      badgeVariants: {
        default: {
          backgroundColor: 'gray',
          color: 'black',
          borderRadius: '2px',
          padding: '2px',
        },
        success: {
          backgroundColor: 'green',
          color: 'white',
          borderRadius: '2px',
          padding: '2px',
        },
        warning: {
          backgroundColor: 'yellow',
          color: 'black',
          borderRadius: '2px',
          padding: '2px',
        },
        danger: {
          backgroundColor: 'red',
          color: 'white',
          borderRadius: '2px',
          padding: '2px',
        },
      },
      warningTokens: {
        low: {
          backgroundColor: 'lightyellow',
          color: 'orange',
          border: '1px solid orange',
          animation: 'slow-pulse',
        },
        medium: {
          backgroundColor: 'yellow',
          color: 'darkorange',
          border: '1px solid darkorange',
          animation: 'medium-pulse',
        },
        high: {
          backgroundColor: 'orange',
          color: 'red',
          border: '1px solid red',
          animation: 'fast-pulse',
        },
      },
    };

    it('should merge typography tokens', () => {
      const override = {
        typography: {
          baseFontSize: 16,
          fontWeightBold: 700,
        },
      };

      const result = mergeHudTokens(baseTokens, override);

      expect(result.typography.baseFontSize).toBe(16);
      expect(result.typography.fontWeightBold).toBe(700);
      expect(result.typography.fontFamily).toBe('Arial'); // Unchanged
    });

    it('should merge gradient tokens', () => {
      const override = {
        gradients: {
          primary: 'linear-gradient(to bottom, blue, green)',
        },
      };

      const result = mergeHudTokens(baseTokens, override);

      expect(result.gradients.primary).toBe('linear-gradient(to bottom, blue, green)');
      expect(result.gradients.secondary).toBe(baseTokens.gradients.secondary); // Unchanged
    });

    it('should merge spacing tokens', () => {
      const override = {
        spacing: {
          md: '12px',
          xl: '24px',
        },
      };

      const result = mergeHudTokens(baseTokens, override);

      expect(result.spacing.md).toBe('12px');
      expect(result.spacing.xl).toBe('24px');
      expect(result.spacing.sm).toBe('4px'); // Unchanged
    });

    it('should merge badge variant tokens', () => {
      const override = {
        badgeVariants: {
          success: {
            backgroundColor: 'darkgreen',
            borderRadius: '4px',
          },
          warning: {
            color: 'darkred',
          },
        },
      };

      const result = mergeHudTokens(baseTokens, override);

      expect(result.badgeVariants.success.backgroundColor).toBe('darkgreen');
      expect(result.badgeVariants.success.borderRadius).toBe('4px');
      expect(result.badgeVariants.success.color).toBe('white'); // Unchanged

      expect(result.badgeVariants.warning.color).toBe('darkred');
      expect(result.badgeVariants.warning.backgroundColor).toBe('yellow'); // Unchanged
    });

    it('should merge warning tokens', () => {
      const override = {
        warningTokens: {
          high: {
            animation: 'shake-hard',
            border: '2px solid red',
          },
        },
      };

      const result = mergeHudTokens(baseTokens, override);

      expect(result.warningTokens.high.animation).toBe('shake-hard');
      expect(result.warningTokens.high.border).toBe('2px solid red');
      expect(result.warningTokens.high.backgroundColor).toBe('orange'); // Unchanged
    });

    it('should handle empty override', () => {
      const result = mergeHudTokens(baseTokens, {});

      expect(result).toEqual(baseTokens);
    });

    it('should handle partial overrides', () => {
      const override = {
        typography: {
          baseFontSize: 18,
        },
      };

      const result = mergeHudTokens(baseTokens, override);

      expect(result.typography.baseFontSize).toBe(18);
      expect(result.gradients).toEqual(baseTokens.gradients); // Unchanged sections
    });

    it('should create deep copies', () => {
      const override = {
        typography: {
          baseFontSize: 16,
        },
      };

      const result = mergeHudTokens(baseTokens, override);

      // Modifying result shouldn't affect original
      result.typography.baseFontSize = 20;
      expect(baseTokens.typography.baseFontSize).toBe(12);
    });
  });

  describe('Schema Validation', () => {
    it('should accept valid token configurations', () => {
      const validTokens: MinimalHudTokens = {
        typography: {
          fontFamily: 'Arial',
          baseFontSize: 14,
          lineHeight: 1.5,
          fontWeightNormal: 400,
          fontWeightBold: 600,
          letterSpacing: '0.01em',
        },
        gradients: {
          primary: 'linear-gradient(red, blue)',
          secondary: 'linear-gradient(green, yellow)',
          warning: 'linear-gradient(orange, red)',
          danger: 'linear-gradient(purple, pink)',
        },
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px',
        },
        badgeVariants: {
          default: {
            backgroundColor: 'gray',
            color: 'black',
            borderRadius: '4px',
            padding: '4px 8px',
          },
          success: {
            backgroundColor: 'green',
            color: 'white',
            borderRadius: '4px',
            padding: '4px 8px',
          },
          warning: {
            backgroundColor: 'yellow',
            color: 'black',
            borderRadius: '4px',
            padding: '4px 8px',
          },
          danger: {
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '4px',
            padding: '4px 8px',
          },
        },
        warningTokens: {
          low: {
            backgroundColor: 'lightyellow',
            color: 'orange',
            border: '1px solid orange',
            animation: 'pulse',
          },
          medium: {
            backgroundColor: 'yellow',
            color: 'orange',
            border: '1px solid orange',
            animation: 'pulse',
          },
          high: {
            backgroundColor: 'red',
            color: 'white',
            border: '1px solid red',
            animation: 'shake',
          },
        },
      };

      const result = MinimalHudTokensSchema.safeParse(validTokens);
      expect(result.success).toBe(true);
    });

    it('should reject invalid configurations', () => {
      const invalidTokens = {
        typography: {
          fontFamily: 123, // Should be string
          baseFontSize: '14px', // Should be number
        },
        // Missing other required sections
      };

      const result = MinimalHudTokensSchema.safeParse(invalidTokens);
      expect(result.success).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety across operations', () => {
      // This test ensures TypeScript types are correct
      const tokens: MinimalHudTokens = defaultMinimalHudTokens;

      // Should compile without type errors
      const fontSize: number = tokens.typography.baseFontSize;
      const gradient: string = tokens.gradients.primary;
      const spacing: string = tokens.spacing.md;
      const badgeColor: string = tokens.badgeVariants.success.color;
      const warningBg: string = tokens.warningTokens.low.backgroundColor;

      expect(typeof fontSize).toBe('number');
      expect(typeof gradient).toBe('string');
      expect(typeof spacing).toBe('string');
      expect(typeof badgeColor).toBe('string');
      expect(typeof warningBg).toBe('string');
    });
  });
});
