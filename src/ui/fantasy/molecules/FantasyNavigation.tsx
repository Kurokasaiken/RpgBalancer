import React from 'react';

interface NavItem {
    id: string;
    label: string;
    icon?: string;
}

interface FantasyNavigationProps {
    items: NavItem[];
    activeId: string;
    onSelect: (id: string) => void;
}

export const FantasyNavigation: React.FC<FantasyNavigationProps> = ({ items, activeId, onSelect }) => {
    return (
        <nav className="
            w-64 h-full flex flex-col p-4 gap-2
            bg-[var(--fantasy-bg-wood-dark)] 
            border-r-4 border-[var(--fantasy-bg-leather)]
            shadow-[var(--shadow-fantasy-float)]
        ">
            <div className="mb-6 text-center">
                <h1 className="font-fantasy-header text-2xl text-[var(--fantasy-text-bronze)] drop-shadow-md">
                    Grimoire
                </h1>
                <div className="h-1 w-16 bg-[var(--fantasy-text-bronze)] mx-auto mt-2 rounded-full opacity-50" />
            </div>

            {items.map(item => (
                <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`
                        w-full text-left px-4 py-3 rounded
                        font-fantasy-display font-bold tracking-wide
                        transition-all duration-300
                        flex items-center gap-3
                        ${activeId === item.id
                            ? 'bg-[var(--fantasy-bg-paper)] text-[var(--fantasy-text-ink)] shadow-lg translate-x-2 border-l-4 border-[var(--fantasy-secondary)]'
                            : 'text-[var(--fantasy-text-light)] hover:bg-[var(--fantasy-bg-wood-light)] hover:translate-x-1'}
                    `}
                >
                    {item.icon && <span className="text-xl">{item.icon}</span>}
                    {item.label}
                </button>
            ))}

            <div className="mt-auto pt-4 border-t border-[var(--fantasy-bg-wood-light)] text-center text-xs text-[var(--fantasy-text-light)] opacity-50 font-fantasy-ui">
                v1.0.0 Enchanted
            </div>
        </nav>
    );
};
