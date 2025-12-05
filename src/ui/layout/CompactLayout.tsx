import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { useDensity } from '../../contexts/DensityContext';

interface NavItem {
    id: string;
    label: string;
    icon?: string;
    type?: 'divider';
}

interface CompactLayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    navItems: NavItem[];
    title?: string;
}

export const CompactLayout: React.FC<CompactLayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    navItems,
    title = 'RPG Balancer',
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { density, toggleDensity } = useDensity();

    const sidebarWidth = isSidebarCollapsed ? 'w-14' : 'w-52';

    return (
        <div className="flex h-screen w-full overflow-hidden bg-wood-darkest">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:relative inset-y-0 left-0 z-50
                    ${sidebarWidth} flex flex-col
                    bg-gradient-to-b from-wood-dark to-wood-darkest
                    border-r border-wood/30
                    transition-all duration-200 ease-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-wood/20">
                    {!isSidebarCollapsed && (
                        <span className="text-sm font-display text-gold-bright truncate">{title}</span>
                    )}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="hidden md:flex items-center justify-center w-6 h-6 rounded hover:bg-wood/30 text-parchment-light/60 hover:text-parchment-light transition-colors"
                        title={isSidebarCollapsed ? 'Expand' : 'Collapse'}
                    >
                        {isSidebarCollapsed ? '→' : '←'}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
                    {navItems.map((item) => {
                        if (item.type === 'divider') {
                            return isSidebarCollapsed ? (
                                <div key={item.id} className="my-2 mx-2 h-px bg-wood/30" />
                            ) : (
                                <div key={item.id} className="px-3 py-2 text-2xs uppercase tracking-wider text-parchment-light/40">
                                    {item.label}
                                </div>
                            );
                        }

                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    setIsSidebarOpen(false);
                                }}
                                className={`
                                    w-full flex items-center gap-2 px-3 py-2 text-left
                                    transition-all duration-150
                                    ${isActive
                                        ? 'bg-gold/20 text-gold-bright border-l-2 border-gold'
                                        : 'text-parchment-light/70 hover:bg-wood/20 hover:text-parchment-light border-l-2 border-transparent'
                                    }
                                `}
                                title={isSidebarCollapsed ? item.label : undefined}
                            >
                                {item.icon && <span className="text-base flex-shrink-0">{item.icon}</span>}
                                {!isSidebarCollapsed && (
                                    <span className="text-sm truncate">{item.label}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-2 border-t border-wood/20">
                    <button
                        onClick={toggleDensity}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-parchment-light/50 hover:bg-wood/20 hover:text-parchment-light/70 transition-colors"
                        title={`Switch to ${density === 'compact' ? 'comfortable' : 'compact'} mode`}
                    >
                        <span>{density === 'compact' ? '▪' : '▫'}</span>
                        {!isSidebarCollapsed && (
                            <span className="capitalize">{density}</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center gap-3 p-3 bg-wood-dark border-b border-wood/20">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center justify-center w-8 h-8 rounded bg-wood/30 text-parchment-light"
                    >
                        ☰
                    </button>
                    <span className="text-sm font-display text-gold-bright">{title}</span>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3 md:p-4 lg:p-6 max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
