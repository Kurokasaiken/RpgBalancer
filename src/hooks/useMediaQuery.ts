import { useState, useEffect } from 'react';

/**
 * Custom hook to detect screen size breakpoints
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean - true if query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);

        // Set initial value
        setMatches(mediaQuery.matches);

        // Create event listener
        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Add listener
        mediaQuery.addEventListener('change', handler);

        // Cleanup
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

/**
 * Predefined breakpoints matching Tailwind defaults
 */
export const breakpoints = {
    isMobile: () => useMediaQuery('(max-width: 767px)'),
    isTablet: () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)'),
    isDesktop: () => useMediaQuery('(min-width: 1024px)'),
    isLargeDesktop: () => useMediaQuery('(min-width: 1280px)'),
} as const;

/**
 * Get current breakpoint name
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'large' {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
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
    const [hasTouch, setHasTouch] = useState<boolean>(false);

    useEffect(() => {
        setHasTouch(
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0
        );
    }, []);

    return hasTouch;
}
