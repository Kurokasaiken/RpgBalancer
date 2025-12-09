import { useState, useEffect } from 'react';
import { useDensity } from '../../contexts/DensityContext';

interface FantasyLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

// Bottom nav items for mobile (max 5 for thumb zone)
const BOTTOM_NAV = [
    { id: 'balancer', label: 'Balancer', icon: '⚖️' },
    { id: 'archetypes', label: 'Archetypes', icon: '🎭' },
    { id: 'spellCreationNew', label: 'Spells', icon: '✨' },
    { id: 'gridArena', label: 'Arena', icon: '⚔️' },
    { id: 'more', label: 'More', icon: '☰' },
];

// Full nav items for desktop sidebar
const NAV_SECTIONS = [
    {
        title: 'Core',
        items: [
            { id: 'balancer', label: 'Balancer', icon: '⚖️' },
            { id: 'balancerStats', label: 'Stat Testing', icon: '📊' },
            { id: 'spellCreationNew', label: 'Spell Creation', icon: '✨' },
            { id: 'archetypes', label: 'Archetypes', icon: '🎭' },
            { id: 'archetypeBuilder', label: 'Builder', icon: '🏗️' },
            { id: 'matchupMatrix', label: 'War Room', icon: '🗺️' },
            { id: 'archetypeTesting', label: '1v1 Archetypes', icon: '⚔️' },
        ]
    },
    {
        title: 'Content',
        items: [
            { id: 'spellLibrary', label: 'Grimoire', icon: '📚' },
            { id: 'gridArena', label: 'Battlefield', icon: '⚔️' },
            { id: 'characterCreator', label: 'Heroes', icon: '👤' },
        ]
    },
    {
        title: 'Idle Village',
        items: [
            { id: 'idleVillage', label: 'Idle Village', icon: '🏡' },
            { id: 'idleVillageConfig', label: 'Idle Village Config', icon: '⚙️' },
        ]
    },
    {
        title: 'Mockups',
        items: [
            { id: 'mockGildedObservatory', label: 'Gilded Observatory', icon: '🜂' },
            { id: 'mockObsidianSanctum', label: 'Obsidian Sanctum', icon: '🜃' },
            { id: 'mockAuroraWorkshop', label: 'Aurora Workshop', icon: '✺' },
            { id: 'mockArcaneTech', label: 'Arcane Tech Glass', icon: '💠' },
            { id: 'mockAetherBrass', label: 'Aether Brass Lab', icon: '⚗️' },
            { id: 'mockQuantumScriptorium', label: 'Quantum Scriptorium', icon: '✒️' },
            { id: 'mockMidnightMeridian', label: 'Midnight Meridian', icon: '✦' },
            { id: 'mockSeraphimArchive', label: 'Seraphim Archive', icon: '✶' },
            { id: 'mockVerdantAlloy', label: 'Verdant Alloy Deck', icon: '🌿' },
        ]
    },
    {
        title: 'System',
        items: [
            { id: 'tacticalLab', label: 'Tactical Lab', icon: '⚔️' },
        ]
    }
];

export const FantasyLayout: React.FC<FantasyLayoutProps> = ({ children, activeTab, onTabChange }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

    return (
        <div className="flex h-screen w-full overflow-hidden bg-linear-to-br from-obsidian-darkest via-obsidian-dark to-obsidian">
            {/* Desktop Sidebar */}
            {!isMobile && (
                <aside className="w-56 flex flex-col bg-linear-to-b from-obsidian-darkest/95 via-obsidian-dark/90 to-obsidian-light/90 shadow-fantasy-soft">
                    {/* Header */}
                    <div className="h-3" />
                    
                    {/* Nav Sections */}
                    <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
                        <div className="mx-3 observatory-nav-frame">
                            <div className="observatory-nav-orb" aria-hidden="true" />
                            <div className="py-2">
                                {NAV_SECTIONS.map((section) => (
                                    <div key={section.title} className="mb-2 last:mb-1">
                                        <p className="px-3 pb-1">
                                            <span className="flex items-center gap-2 text-[8px] text-teal-muted/40">
                                                <span className="h-px flex-1 bg-slate-800/60" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-gold/70 shadow-glow-gold" />
                                                <span className="h-px flex-1 bg-slate-800/60" />
                                            </span>
                                        </p>
                                        {section.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => onTabChange(item.id)}
                                                className={`
                                                    w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-xl
                                                    transition-all duration-fast relative overflow-hidden
                                                    ${activeTab === item.id
                                                        ? 'bg-linear-to-r from-gold/20 via-gold/10 to-transparent text-gold'
                                                        : 'text-ivory-muted hover:bg-obsidian-dark/70 hover:text-ivory hover:border-gold/40 hover:shadow-fantasy-soft'
                                                    }
                                                `}
                                            >
                                                <span className="text-base">{item.icon}</span>
                                                <span className="text-sm truncate">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="p-3" />
                </aside>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                {isMobile && (
                    <header className="flex items-center justify-between px-4 py-3 bg-obsidian-light/90 border-b border-slate-darkest">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full border border-gold/70 bg-obsidian-darkest/90 flex items-center justify-center shadow-glow-gold">
                                <span className="text-gold text-lg">✶</span>
                                <span className="sr-only">Main navigation</span>
                            </div>
                        </div>
                        <button
                            onClick={toggleDensity}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-darkest/50 text-teal text-sm"
                        >
                            {density === 'compact' ? '▪' : '▫'}
                        </button>
                    </header>
                )}

                {/* Content */}
                <div className={`flex-1 overflow-y-auto scroll-smooth ${isMobile ? 'pb-20' : ''}`}>
                    <div className="p-3 md:p-4">
                        <div className="observatory-main-frame">
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation - THUMB ZONE */}
            {isMobile && (
                <nav className="fixed bottom-0 inset-x-0 z-50 bg-obsidian-light/95 backdrop-blur-sm border-t border-slate-darkest safe-area-inset-bottom">
                    <div className="flex items-center justify-around h-16">
                        {BOTTOM_NAV.map((item) => {
                            const isActive = activeTab === item.id || (item.id === 'more' && isDrawerOpen);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    className={`
                                        flex flex-col items-center justify-center
                                        w-16 h-14 rounded-xl no-select
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

            {/* Mobile Drawer */}
            {isMobile && isDrawerOpen && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setIsDrawerOpen(false)} />
                    <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] bg-obsidian-light rounded-t-3xl border-t border-slate overflow-hidden animate-slide-up">
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-slate rounded-full" />
                        </div>
                        <div className="overflow-y-auto max-h-[calc(75vh-60px)] pb-safe scrollbar-hide">
                            {NAV_SECTIONS.map((section) => (
                                <div key={section.title} className="mb-2">
                                    <p className="px-5 pt-2 pb-1">
                                        <span className="flex items-center gap-2 text-[8px] text-teal-muted/40">
                                            <span className="h-px flex-1 bg-slate-700/60" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-gold/70 shadow-glow-gold" />
                                            <span className="h-px flex-1 bg-slate-700/60" />
                                        </span>
                                    </p>
                                    <div className="px-3">
                                        {section.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleNavClick(item.id)}
                                                className={`
                                                    w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mb-1
                                                    transition-all duration-150 active:scale-98 no-select
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
