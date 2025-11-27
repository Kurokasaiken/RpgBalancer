import React, { useState } from 'react';

interface CardWrapperProps {
    title: string;
    color: string;
    onReset?: () => void;
    children: React.ReactNode;
    defaultVisible?: boolean;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({ title, color, onReset, children, defaultVisible = true }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isVisible, setIsVisible] = useState(defaultVisible);

    if (!isVisible) {
        return (
            <div className="backdrop-blur-md bg-white/5 p-2 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/10 opacity-50 hover:opacity-75 transition-opacity">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">{title}</span>
                    <button onClick={() => setIsVisible(true)} className="text-xs text-gray-300 hover:text-white hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] p-0.5 transition-all">
                        👁️
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`backdrop-blur-md bg-white/5 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/10 hover:border-purple-400/30 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-3'}`}
        >
            {/* Header */}
            <div className={`flex justify-between items-center ${isCollapsed ? '' : 'pb-1'}`}>
                <h3 className={`font-bold ${color} flex items-center gap-1 ${isCollapsed ? 'text-xs' : 'text-sm'}`}>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hover:text-white transition-colors"
                        title={isCollapsed ? "Espandi" : "Collassa"}
                    >
                        {isCollapsed ? '▶' : '▼'}
                    </button>
                    {title}
                </h3>

                <div className="flex items-center gap-0.5">
                    {onReset && (
                        <button
                            onClick={() => onReset()}
                            className="p-1 rounded text-xs bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all"
                            title="Reset Card"
                        >
                            ↺
                        </button>
                    )}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 rounded text-xs bg-white/10 border border-white/20 hover:bg-white/15 text-gray-300 hover:text-white transition-all"
                        title="Nascondi"
                    >
                        👁️
                    </button>
                </div>
            </div>

            {/* Content - only render when not collapsed */}
            {!isCollapsed && (
                <div className="pt-0">
                    {children}
                </div>
            )}
        </div>
    );
};
