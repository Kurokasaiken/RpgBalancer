import React, { useState } from 'react';

/**
 * Props for the Tooltip component.
 */
interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute z-50 w-64 p-2 mt-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl border border-gray-700 -left-1/2 transform translate-x-1/4">
                    {content}
                </div>
            )}
        </div>
    );
};
