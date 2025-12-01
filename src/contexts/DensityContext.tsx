import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type DensityMode = 'compact' | 'comfortable';

interface DensityContextType {
    density: DensityMode;
    setDensity: (mode: DensityMode) => void;
    toggleDensity: () => void;
    // Utility classes based on density
    spacing: {
        card: string;
        section: string;
        item: string;
        input: string;
    };
    text: {
        heading: string;
        subheading: string;
        body: string;
        small: string;
        label: string;
    };
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

const STORAGE_KEY = 'ui_density_mode';

// Density-specific class mappings
const densityClasses = {
    compact: {
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
    },
    comfortable: {
        spacing: {
            card: 'p-4 gap-3',
            section: 'space-y-4',
            item: 'py-2 px-3',
            input: 'h-10 px-3 text-base',
        },
        text: {
            heading: 'text-xl font-semibold',
            subheading: 'text-lg font-medium',
            body: 'text-base',
            small: 'text-sm',
            label: 'text-sm font-medium uppercase tracking-wide',
        },
    },
};

interface DensityProviderProps {
    children: ReactNode;
}

export const DensityProvider: React.FC<DensityProviderProps> = ({ children }) => {
    const [density, setDensityState] = useState<DensityMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'compact' || saved === 'comfortable') {
                return saved;
            }
        }
        return 'compact'; // Default to compact for better information density
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, density);
        // Update CSS custom property for global access
        document.documentElement.setAttribute('data-density', density);
    }, [density]);

    const setDensity = (mode: DensityMode) => {
        setDensityState(mode);
    };

    const toggleDensity = () => {
        setDensityState(prev => prev === 'compact' ? 'comfortable' : 'compact');
    };

    const value: DensityContextType = {
        density,
        setDensity,
        toggleDensity,
        spacing: densityClasses[density].spacing,
        text: densityClasses[density].text,
    };

    return (
        <DensityContext.Provider value={value}>
            {children}
        </DensityContext.Provider>
    );
};

export const useDensity = (): DensityContextType => {
    const context = useContext(DensityContext);
    if (!context) {
        throw new Error('useDensity must be used within a DensityProvider');
    }
    return context;
};

// Hook for responsive density (auto-compact on mobile)
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
            density: 'compact',
            spacing: densityClasses.compact.spacing,
            text: densityClasses.compact.text,
        };
    }

    return context;
};
