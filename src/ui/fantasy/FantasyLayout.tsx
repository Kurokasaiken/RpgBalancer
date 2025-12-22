import { useState, useEffect } from 'react';
import { useDensity } from '../../contexts/DensityContext';
import {
    BOTTOM_NAV,
    NAV_SECTIONS,
    type AppNavTabId,
} from '@/shared/navigation/navConfig';

interface FantasyLayoutProps {
    children: React.ReactNode;
    activeTab: AppNavTabId;
    onTabChange: (tab: AppNavTabId) => void;
}

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

    const handleNavClick = (id: AppNavTabId | 'more') => {
        if (id === 'more') {
            setIsDrawerOpen(true);
        } else {
            onTabChange(id);
            setIsDrawerOpen(false);
        }
    };

    return (
        <>
            <div className="flex h-screen w-full overflow-hidden bg-linear-to-br from-obsidian-darkest via-obsidian-dark to-obsidian">
                {/* Desktop Left Menu */}
                {!isMobile && (
                    <aside className="hidden lg:flex w-64 shrink-0 px-4 py-6">
                        <div className="observatory-nav-frame w-full">
                            <div className="observatory-nav-orb" aria-hidden="true" />
                            <nav className="flex flex-col gap-4">
                                {NAV_SECTIONS.map((section) => (
                                    <div key={section.title}>
                                        <p className="px-3 pb-1 text-[9px] uppercase tracking-[0.35em] text-slate-400/70">
                                            {section.title}
                                        </p>
                                        <div className="flex flex-col gap-1">
                                            {section.items.map((item) => {
                                                const isActive = activeTab === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        data-tab-id={item.id}
                                                        data-testid={`nav-btn-${item.id}`}
                                                        onClick={() => onTabChange(item.id)}
                                                        className={`observatory-nav-item ${isActive ? 'is-active' : ''}`}
                                                    >
                                                        <span className="text-lg">{item.icon}</span>
                                                        <span className="truncate">{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </nav>
                        </div>
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

            </div>

            {/* Mobile Bottom Navigation - THUMB ZONE */}
            {isMobile && (
                <nav className="fixed bottom-0 inset-x-0 z-50 bg-obsidian-light/95 backdrop-blur-sm border-t border-slate-darkest safe-area-inset-bottom">
                    <div className="flex items-center justify-around h-16">
                        {BOTTOM_NAV.map((item) => {
                            const isActive = activeTab === item.id || (item.id === 'more' && isDrawerOpen);
                            return (
                                <button
                                    key={item.id}
                                    data-testid={`nav-btn-${item.id}`}
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
                                                data-testid={`nav-btn-${item.id}`}
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
        </>
    );
};
