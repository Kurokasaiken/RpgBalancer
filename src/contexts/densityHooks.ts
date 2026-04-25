import { useContext, useState, useEffect } from 'react';
import { DensityContext } from './DensityContextCore';
import type { DensityMode, DensityContextType } from './DensityContext';

/**
 * Hook for accessing density context
 */
export const useDensity = (): DensityContextType => {
    const context = useContext(DensityContext);
    if (!context) {
        throw new Error('useDensity must be used within a DensityProvider');
    }
    return context;
};

/**
 * Hook for responsive density management, automatically switching to compact on mobile.
 */
export const useResponsiveDensity = (): DensityContextType => {
    const context = useDensity();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Force compact on mobile
    if (isMobile) {
        return {
            ...context,
            density: 'compact' as DensityMode,
            spacing: {
                card: 'p-3 gap-2',
                section: 'space-y-3',
                item: 'py-1.5 px-2',
                input: 'h-8 px-2 text-sm',
            },
            text: {
                heading: 'text-lg font-semibold',
                subheading: 'text-base font-medium',
                body: 'text-sm',
                small: 'text-xs',
                label: 'text-xs font-medium uppercase tracking-wide',
            },
        };
    }

    return context;
};
