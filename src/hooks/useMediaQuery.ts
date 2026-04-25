import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * Custom hook to detect screen size breakpoints
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean - true if query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
const supportsDOM = typeof window !== 'undefined';

/**
 * useSyncExternalStore-based media query listener to avoid synchronous setState in effects.
 */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback((onStoreChange: () => void) => {
        if (!supportsDOM) return () => undefined;
        const mediaQuery = window.matchMedia(query);
        const handler = () => onStoreChange();
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    const getSnapshot = useCallback(() => {
        if (!supportsDOM) return false;
        return window.matchMedia(query).matches;
    }, [query]);

    const getServerSnapshot = useMemo(() => () => false, []);

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Predefined breakpoint hooks matching Tailwind defaults.
 */
export const useIsMobile = (): boolean => useMediaQuery('(max-width: 767px)');
export const useIsTablet = (): boolean => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 1024px)');
export const useIsLargeDesktop = (): boolean => useMediaQuery('(min-width: 1280px)');

/**
 * Get current breakpoint name
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'large' {
    const isMobile = useIsMobile();
    const isTablet = useIsTablet();
    const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');

    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isDesktop) return 'desktop';
    return 'large';
}

/**
 * Detect if device has touch support
 */
export function useHasTouch(): boolean {
    if (!supportsDOM) {
        return false;
    }
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
