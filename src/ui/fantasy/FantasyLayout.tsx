import { useState } from 'react';
import { FantasyNavigation } from './molecules/FantasyNavigation';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { FantasyButton } from './atoms/FantasyButton';

interface FantasyLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const FantasyLayout: React.FC<FantasyLayoutProps> = ({ children, activeTab, onTabChange }) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [isNavOpen, setIsNavOpen] = useState(false);

    const navItems = [
        { id: 'balancer', label: 'Balance Scales', icon: '⚖️' },
        { id: 'archetypes', label: 'Archetypes', icon: '🎭' },
        { id: 'archetypeBuilder', label: 'Builder', icon: '🏗️' },
        { id: 'matchupMatrix', label: 'War Room', icon: '🗺️' },
        { id: 'spellLibrary', label: 'Grimoire', icon: '📚' },
        { id: 'spellCreation', label: 'Scribe Spell', icon: '✨' },
        { id: 'gridArena', label: 'Battlefield', icon: '⚔️' },
        { id: 'characterCreator', label: 'Heroes', icon: '👤' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
        { id: 'divider-mockups', label: '— Mockups —', type: 'divider' as const },
        { id: 'mockArcaneTech', label: 'Arcane Tech Glass', icon: '💠' },
        { id: 'mockGildedObservatory', label: 'Gilded Observatory', icon: '🜂' },
        { id: 'mockObsidianSanctum', label: 'Obsidian Sanctum', icon: '🜃' },
        { id: 'mockAuroraWorkshop', label: 'Aurora Workshop', icon: '✺' },
        { id: 'mockAetherBrass', label: 'Aether Brass Lab', icon: '⚗️' },
        { id: 'mockQuantumScriptorium', label: 'Quantum Scriptorium', icon: '✒️' },
        { id: 'mockMidnightMeridian', label: 'Midnight Meridian', icon: '✦' },
        { id: 'mockSeraphimArchive', label: 'Seraphim Archive', icon: '✶' },
        { id: 'mockVerdantAlloy', label: 'Verdant Alloy Deck', icon: '🌿' },
    ];

    const handleNavSelect = (id: string) => {
        onTabChange(id);
        if (isMobile) setIsNavOpen(false);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[var(--fantasy-bg-wood-dark)] bg-[image:var(--texture-wood)]">
            {/* Mobile Menu Button */}
            {isMobile && (
                <div className="absolute top-4 left-4 z-50">
                    <FantasyButton
                        variant="icon"
                        onClick={() => setIsNavOpen(!isNavOpen)}
                        className="bg-[var(--fantasy-bg-paper)] border border-[var(--fantasy-text-bronze)] shadow-lg"
                    >
                        {isNavOpen ? '✕' : '☰'}
                    </FantasyButton>
                </div>
            )}

            {/* Navigation Sidebar / Drawer */}
            <div className={`
                fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
                ${isMobile ? (isNavOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0 relative'}
            `}>
                <FantasyNavigation
                    items={navItems}
                    activeId={activeTab}
                    onSelect={handleNavSelect}
                />
            </div>

            {/* Backdrop for mobile */}
            {isMobile && isNavOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
                    onClick={() => setIsNavOpen(false)}
                />
            )}

            <main className={`flex-1 overflow-y-auto p-4 md:p-8 relative transition-all duration-300 ${isMobile ? 'pt-16' : ''}`}>
                {/* Background Overlay for depth */}
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
