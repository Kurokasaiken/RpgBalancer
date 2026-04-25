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
            w-72 h-full flex flex-col
            bg-gradient-to-b from-wood-dark via-wood to-wood-dark
            border-r-4 border-leather-dark
            shadow-fantasy-float
            relative
        " style={{ backgroundImage: 'var(--texture-wood)' }}>
            {/* Top ornamental border */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
            
            {/* Header */}
            <div className="p-6 text-center border-b border-wood-dark/50">
                <h1 className="font-display text-2xl text-gold-bright tracking-widest drop-shadow-lg">
                    ✦ Grimoire ✦
                </h1>
                <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-3 opacity-70" />
            </div>

            {/* Navigation Items */}
            <div className="flex-1 p-4 space-y-1.5 overflow-y-auto fantasy-scrollbar">
                {items.map(item => {
                    const isActive = activeId === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={`
                                w-full text-left px-4 py-3 rounded-lg
                                font-display text-sm font-semibold tracking-wide
                                transition-all duration-200 ease-out
                                flex items-center gap-3
                                relative overflow-hidden
                                ${isActive
                                    ? `
                                        bg-parchment text-wood-dark 
                                        shadow-fantasy border-l-4 border-gold
                                        translate-x-1
                                    `
                                    : `
                                        text-parchment-light/90 
                                        hover:bg-wood-light/30 hover:text-parchment-light
                                        hover:translate-x-1 hover:shadow-soft
                                        border-l-4 border-transparent
                                    `
                                }
                            `}
                        >
                            {/* Active glow effect */}
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent pointer-events-none" />
                            )}
                            
                            {item.icon && (
                                <span className={`text-lg ${isActive ? 'drop-shadow-sm' : ''}`}>
                                    {item.icon}
                                </span>
                            )}
                            <span className="relative z-10">{item.label}</span>
                            
                            {/* Active indicator dot */}
                            {isActive && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-gold shadow-glow-gold" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-wood-light/20">
                <div className="text-center text-xs text-parchment-light/40 font-ui tracking-wide">
                    <span className="text-gold/50">✦</span> v1.0.0 Enchanted Grove <span className="text-gold/50">✦</span>
                </div>
            </div>
            
            {/* Bottom ornamental border */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-bronze to-transparent opacity-40" />
        </nav>
    );
};
