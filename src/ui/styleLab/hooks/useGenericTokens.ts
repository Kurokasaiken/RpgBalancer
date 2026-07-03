import { useMemo } from 'react';
import { DEFAULT_STYLE_LAB_PRESET, type TypographyTokens, type SpacingTokens, type BorderTokens } from '../tokens/defaultStyleLabPreset';

/**
 * Hook for accessing generic design tokens for new components.
 * Provides typography, spacing, and border tokens that work across all skins.
 *
 * @example
 * ```tsx
 * const { typography, spacing, border } = useGenericTokens();
 *
 * return (
 *   <div style={{
 *     fontFamily: typography.fontFamily.body,
 *     fontSize: typography.fontSize.base,
 *     padding: spacing.md,
 *     border: `${border.width.medium} solid ${border.color.default}`,
 *     borderRadius: border.radius.md,
 *   }}>
 *     Content
 *   </div>
 * );
 * ```
 */
export const useGenericTokens = () => {
  const tokens = useMemo(() => {
    const preset = DEFAULT_STYLE_LAB_PRESET;

    return {
      typography: preset.genericTypography,
      spacing: preset.genericSpacing,
      border: preset.genericBorder,
    };
  }, []);

  return tokens;
};

/**
 * Hook for accessing only typography tokens.
 */
export const useTypographyTokens = (): TypographyTokens => {
  return useGenericTokens().typography;
};

/**
 * Hook for accessing only spacing tokens.
 */
export const useSpacingTokens = (): SpacingTokens => {
  return useGenericTokens().spacing;
};

/**
 * Hook for accessing only border tokens.
 */
export const useBorderTokens = (): BorderTokens => {
  return useGenericTokens().border;
};
