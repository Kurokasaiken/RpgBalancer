import React, { useState } from 'react';

interface CardWrapperProps {
    title: string;
    color: string;
    onReset?: () => void;
    children: React.ReactNode;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({ title, color, onReset, children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return (
            <div className="bg-gray-800 p-1 rounded shadow border border-gray-700 opacity-50">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{title}</span>
                    <button onClick={() => setIsVisible(true)} className="text-xs text-gray-400 hover:text-white p-0.5">
                        👁️
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`bg-gray-800 rounded shadow border border-gray-700 transition-all duration-200 ${isCollapsed ? 'p-1.5' : 'p-2'}`}
        >
            {/* Header */}
            <div className={`flex justify-between items-center ${isCollapsed ? '' : 'pb-1'}`}>
                <h3 className={`font-bold ${color} flex items-center gap-1 ${isCollapsed ? 'text-xs' : 'text-sm'}`}>
                    <button
                        onClick={() => {
                            console.log('Toggling collapse:', !isCollapsed);
                            setIsCollapsed(!isCollapsed);
                        }}
                        className="hover:text-white transition-colors"
                        title={isCollapsed ? "Espandi" : "Collassa"}
                    >
                        {isCollapsed ? '▶' : '▼'}
                    </button>
                    {title} <span className="text-[10px] text-red-500">({isCollapsed ? 'COLLAPSED' : 'EXPANDED'})</span>
                </h3>

                <div className="flex items-center gap-0.5">
                    {onReset && (
                        <button
                            onClick={() => onReset()}
                            className="p-0.5 rounded text-xs bg-orange-900 text-orange-400 hover:bg-orange-800"
                            title="Reset Card"
                        >
                            ↺
                        </button>
                    )}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-0.5 rounded text-xs bg-gray-600 hover:bg-gray-500 text-gray-300"
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
