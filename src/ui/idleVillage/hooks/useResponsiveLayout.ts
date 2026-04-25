import { useCallback, useMemo } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { 
  type Breakpoint, 
  type LayoutConfig, 
  responsiveTokens, 
  getLayoutConfig,
  isMobileBreakpoint,
  isTabletBreakpoint,
  isDesktopBreakpoint 
} from '@/ui/idleVillage/config/responsiveTokens';

/**
 * Hook for responsive layout management
 * Provides breakpoint-aware layout configuration and utilities
 */
export interface UseResponsiveLayoutReturn {
  /** Current breakpoint */
  breakpoint: Breakpoint;
  /** Layout configuration for current breakpoint */
  layoutConfig: LayoutConfig;
  /** Whether current breakpoint is mobile */
  isMobile: boolean;
  /** Whether current breakpoint is tablet */
  isTablet: boolean;
  /** Whether current breakpoint is desktop */
  isDesktop: boolean;
  /** Responsive grid columns count */
  gridColumns: number;
  /** Touch-friendly interaction mode */
  interactionMode: 'tap' | 'drag';
  /** Navigation position for current breakpoint */
  navigationPosition: 'bottom' | 'side' | 'top';
  /** Card size variant for current breakpoint */
  cardSize: 'compact' | 'normal' | 'large';
  /** Generate responsive CSS classes */
  getResponsiveClasses: <T extends string>(token: T | Partial<Record<Breakpoint, T>>, prefix: string) => string;
  /** Get responsive spacing value */
  getSpacing: (size: keyof typeof responsiveTokens.spacing) => string;
  /** Get responsive grid gap */
  getGridGap: () => string;
  /** Check if touch interaction should be used */
  shouldUseTouch: boolean;
}

export function useResponsiveLayout(): UseResponsiveLayoutReturn {
  // Detect current breakpoint using media queries
  const isXs = useMediaQuery(`(max-width: 479px)`);
  const isSm = useMediaQuery(`(min-width: 480px) and (max-width: 639px)`);
  const isMd = useMediaQuery(`(min-width: 640px) and (max-width: 767px)`);
  const isLg = useMediaQuery(`(min-width: 768px) and (max-width: 1023px)`);
  const isXl = useMediaQuery(`(min-width: 1024px) and (max-width: 1279px)`);

  const breakpoint: Breakpoint = useMemo(() => {
    if (isXs) return 'xs';
    if (isSm) return 'sm';
    if (isMd) return 'md';
    if (isLg) return 'lg';
    if (isXl) return 'xl';
    return '2xl';
  }, [isXs, isSm, isMd, isLg, isXl]);

  const layoutConfig = useMemo(() => getLayoutConfig(breakpoint), [breakpoint]);

  const getResponsiveClasses = useCallback(<T extends string>(
    token: T | Partial<Record<Breakpoint, T>>,
    prefix: string
  ): string => {
    if (typeof token === 'string') {
      return `${prefix}-${token}`;
    }

    const classes: string[] = [];
    
    // Always include base (xs) value
    if (token.xs) {
      classes.push(`${prefix}-${token.xs}`);
    }
    
    // Add breakpoint-specific classes
    (Object.keys(token) as Breakpoint[]).forEach(bp => {
      if (bp !== 'xs' && token[bp]) {
        classes.push(`${bp}:${prefix}-${token[bp]}`);
      }
    });

    return classes.join(' ');
  }, []);

  const getSpacing = useCallback((size: keyof typeof responsiveTokens.spacing): string => {
    return responsiveTokens.spacing[size];
  }, []);

  const getGridGap = useCallback((): string => {
    return responsiveTokens.grid.gap[breakpoint];
  }, [breakpoint]);

  const shouldUseTouch = useMemo(() => {
    return isMobileBreakpoint(breakpoint) || isTabletBreakpoint(breakpoint);
  }, [breakpoint]);

  return {
    breakpoint,
    layoutConfig,
    isMobile: isMobileBreakpoint(breakpoint),
    isTablet: isTabletBreakpoint(breakpoint),
    isDesktop: isDesktopBreakpoint(breakpoint),
    gridColumns: layoutConfig.gridColumns,
    interactionMode: layoutConfig.interaction,
    navigationPosition: layoutConfig.navigation,
    cardSize: layoutConfig.cardSize,
    getResponsiveClasses,
    getSpacing,
    getGridGap,
    shouldUseTouch,
  };
}

/**
 * Hook for responsive container sizing
 */
export function useResponsiveContainer() {
  const { breakpoint } = useResponsiveLayout();
  
  return {
    maxWidth: responsiveTokens.container.maxWidth[breakpoint],
    padding: responsiveTokens.container.padding[breakpoint],
    className: `max-w-${responsiveTokens.container.maxWidth[breakpoint]} px-${responsiveTokens.container.padding[breakpoint]}`,
  };
}

/**
 * Hook for touch-friendly sizing
 */
export function useTouchSizing() {
  const { shouldUseTouch } = useResponsiveLayout();
  
  return {
    minTargetSize: shouldUseTouch ? responsiveTokens.touch.minTargetSize : '32px',
    minSpacing: shouldUseTouch ? responsiveTokens.touch.minSpacing : '4px',
    gestureArea: shouldUseTouch ? responsiveTokens.touch.gestureArea : '32px',
    buttonPadding: shouldUseTouch ? 'px-4 py-3' : 'px-3 py-2',
    cardSpacing: shouldUseTouch ? 'space-y-3' : 'space-y-2',
  };
}
