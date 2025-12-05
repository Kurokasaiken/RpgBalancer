import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useDensity } from '../../contexts/DensityContext';

interface NavItem {
    id: string;
    label: string;
    icon: string;
    section?: string;
}

interface MobileOptimizedLayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    navItems: NavItem[];
    title?: string;
}

// Bottom nav items (max 5 for thumb zone)
const BOTTOM_NAV_ITEMS = [
    { id: 'balancer', label: 'Balance', icon: '⚖️' },
    { id: 'archetypes', label: 'Archetypes', icon: '🎭' },
    { id: 'spellCreation', label: 'Spells', icon: '✨' },
    { id: 'gridArena', label: 'Arena', icon: '⚔️' },
    { id: 'more', label: 'More', icon: '☰' },
];

export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    navItems,
    title = 'RPG Balancer',
}) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { density, toggleDensity } = useDensity();

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleNavClick = (id: string) => {
        if (id === 'more') {
            setIsDrawerOpen(true);
        } else {
            onTabChange(id);
            setIsDrawerOpen(false);
        }
    };

    // Group nav items by section for drawer
    const groupedNavItems = navItems.reduce((acc, item) => {
        const section = item.section || 'Main';
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-gradient-to-br from-obsidian-darkest via-obsidian-dark to-obsidian">
            {/* Desktop Sidebar */}
            {!isMobile && (
                <aside className="fixed inset-y-0 left-0 z-40 w-56 flex flex-col bg-obsidian-light/80 border-r border-slate-darkest">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-darkest">
                        <h1 className="text-lg font-display text-gold">{title}</h1>
                    </div>
                    
                    {/* Nav */}
                    <nav className="flex-1 overflow-y-auto py-2">
                        {Object.entries(groupedNavItems).map(([section, items]) => (
                            <div key={section} className="mb-2">
                                <p className="px-4 py-2 text-2xs uppercase tracking-widest text-teal-muted">
                                    {section}
                                </p>
                                {items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => onTabChange(item.id)}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-2.5 text-left
                                            transition-all duration-150
                                            ${activeTab === item.id
                                                ? 'bg-gold/15 text-gold border-l-2 border-gold'
                                                : 'text-ivory-dark hover:bg-slate-darkest/50 hover:text-ivory border-l-2 border-transparent'
                                            }
                                        `}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span className="text-sm truncate">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-darkest">
                        <button
                            onClick={toggleDensity}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-teal-muted hover:bg-slate-darkest/50 transition-colors"
                        >
                            <span>{density === 'compact' ? '▪' : '▫'}</span>
                            <span className="capitalize">{density} mode</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${!isMobile ? 'ml-56' : ''}`}>
                {/* Mobile Header - compact, in stretch zone */}
                {isMobile && (
                    <header className="flex items-center justify-between px-4 py-3 bg-obsidian-light/90 border-b border-slate-darkest">
                        <h1 className="text-base font-display text-gold truncate">{title}</h1>
                        <button
                            onClick={toggleDensity}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-darkest/50 text-teal text-sm"
                        >
                            {density === 'compact' ? '▪' : '▫'}
                        </button>
                    </header>
                )}

                {/* Content Area */}
                <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20' : ''}`}>
                    <div className="p-4 md:p-6 max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation - THUMB ZONE */}
            {isMobile && (
                <nav className="fixed bottom-0 inset-x-0 z-50 bg-obsidian-light/95 backdrop-blur-sm border-t border-slate-darkest safe-area-inset-bottom">
                    <div className="flex items-center justify-around h-16">
                        {BOTTOM_NAV_ITEMS.map((item) => {
                            const isActive = activeTab === item.id || 
                                (item.id === 'more' && isDrawerOpen);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    className={`
                                        flex flex-col items-center justify-center
                                        w-16 h-14 rounded-xl
                                        transition-all duration-150 active:scale-95
                                        ${isActive
                                            ? 'bg-gold/15 text-gold'
                                            : 'text-teal-muted active:bg-slate-darkest/50'
                                        }
                                    `}
                                >
                                    <span className="text-xl mb-0.5">{item.icon}</span>
                                    <span className="text-2xs">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            )}

            {/* Mobile Drawer (slides up from bottom - gesture friendly) */}
            {isMobile && isDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50 bg-black/60"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    
                    {/* Drawer */}
                    <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] bg-obsidian-light rounded-t-3xl border-t border-slate overflow-hidden animate-slide-up">
                        {/* Handle */}
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-slate rounded-full" />
                        </div>
                        
                        {/* Drawer Content */}
                        <div className="overflow-y-auto max-h-[calc(75vh-60px)] pb-safe">
                            {Object.entries(groupedNavItems).map(([section, items]) => (
                                <div key={section} className="mb-2">
                                    <p className="px-5 py-2 text-2xs uppercase tracking-widest text-teal-muted">
                                        {section}
                                    </p>
                                    <div className="px-3">
                                        {items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleNavClick(item.id)}
                                                className={`
                                                    w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mb-1
                                                    transition-all duration-150 active:scale-98
                                                    ${activeTab === item.id
                                                        ? 'bg-gold/15 text-gold'
                                                        : 'text-ivory hover:bg-slate-darkest/50 active:bg-slate-darkest'
                                                    }
                                                `}
                                            >
                                                <span className="text-xl">{item.icon}</span>
                                                <span className="text-base">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
