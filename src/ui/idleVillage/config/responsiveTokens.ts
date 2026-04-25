/**
 * Responsive Design Tokens for Idle Village
 * Centralized breakpoint-aware design system for mobile-first development
 */

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

export interface ResponsiveSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ResponsiveLayout {
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  spacing: ResponsiveSpacing;
  container: {
    maxWidth: ResponsiveValue<string>;
    padding: ResponsiveValue<string>;
  };
  grid: {
    columns: ResponsiveValue<number>;
    gap: ResponsiveValue<string>;
  };
  touch: {
    minTargetSize: string;
    minSpacing: string;
    gestureArea: string;
  };
}

/**
 * Mobile-first responsive token system
 */
export const responsiveTokens: ResponsiveLayout = {
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  spacing: {
    xs: '2px',    // 0.5 * base
    sm: '4px',    // 1 * base
    md: '8px',    // 2 * base
    lg: '12px',   // 3 * base
    xl: '16px',   // 4 * base
    '2xl': '24px', // 6 * base
  },

  container: {
    maxWidth: {
      xs: '100%',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    padding: {
      xs: '8px',
      sm: '12px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '40px',
    },
  },

  grid: {
    columns: {
      xs: 1,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 4,
    },
    gap: {
      xs: '8px',
      sm: '12px',
      md: '16px',
      lg: '20px',
      xl: '24px',
      '2xl': '32px',
    },
  },

  touch: {
    minTargetSize: '44px',  // iOS HIG minimum touch target
    minSpacing: '8px',      // Minimum spacing between touch targets
    gestureArea: '48px',    // Minimum swipe/drag area
  },
};

/**
 * Helper to generate responsive CSS classes
 */
export function createResponsiveClasses<T extends string>(
  token: ResponsiveValue<T>,
  prefix: string
): string {
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
}

/**
 * Layout configuration for different screen sizes
 */
export interface LayoutConfig {
  mode: 'mobile' | 'tablet' | 'desktop';
  gridColumns: number;
  cardSize: 'compact' | 'normal' | 'large';
  navigation: 'bottom' | 'side' | 'top';
  interaction: 'tap' | 'drag';
}

export function getLayoutConfig(breakpoint: Breakpoint): LayoutConfig {
  switch (breakpoint) {
    case 'xs':
    case 'sm':
      return {
        mode: 'mobile',
        gridColumns: 1,
        cardSize: 'compact',
        navigation: 'bottom',
        interaction: 'tap',
      };
    
    case 'md':
      return {
        mode: 'tablet',
        gridColumns: 2,
        cardSize: 'normal',
        navigation: 'side',
        interaction: 'tap',
      };
    
    case 'lg':
    case 'xl':
    case '2xl':
      return {
        mode: 'desktop',
        gridColumns: responsiveTokens.grid.columns[breakpoint],
        cardSize: 'normal',
        navigation: 'side',
        interaction: 'drag',
      };
    
    default:
      return getLayoutConfig('md');
  }
}

/**
 * Touch-friendly spacing utilities
 */
export const touchSpacing = {
  minTouchTarget: responsiveTokens.touch.minTargetSize,
  minTouchSpacing: responsiveTokens.touch.minSpacing,
  gestureArea: responsiveTokens.touch.gestureArea,
  
  // Helper classes for common touch patterns
  buttonPadding: 'px-4 py-3', // 16px 12px - exceeds 44px minimum
  cardSpacing: 'space-y-3',   // 12px between cards
  listSpacing: 'space-y-2',   // 8px between list items
};

/**
 * Responsive animation durations
 */
export const responsiveAnimation = {
  mobile: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  desktop: {
    fast: '100ms',
    normal: '200ms',
    slow: '400ms',
  },
};

/**
 * Breakpoint-aware utility functions
 */
export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width < 480) return 'xs';
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
}

export function isMobileBreakpoint(breakpoint: Breakpoint): boolean {
  return breakpoint === 'xs' || breakpoint === 'sm';
}

export function isTabletBreakpoint(breakpoint: Breakpoint): boolean {
  return breakpoint === 'md';
}

export function isDesktopBreakpoint(breakpoint: Breakpoint): boolean {
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
}
