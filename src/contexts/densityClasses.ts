// Density-specific class mappings
export const densityClasses = {
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
} as const;
