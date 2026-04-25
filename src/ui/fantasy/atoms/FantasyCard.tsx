import React from 'react';

interface FantasyCardProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

export const FantasyCard: React.FC<FantasyCardProps> = ({ title, children, className = '', action }) => {
    return (
        <div className={`
            relative p-6 rounded-lg 
            bg-fantasy-paper text-fantasy-text-ink
            border-2 border-[var(--fantasy-bg-wood-light)]
            shadow-[var(--shadow-fantasy-card)]
            hover:shadow-[var(--shadow-fantasy-card-hover)] hover:-translate-y-1
            transition-all duration-300 ease-out
            ${className}
        `}>
            {/* Corner Ornaments (CSS pseudo-elements could also work, but SVG is cleaner) */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--fantasy-text-bronze)] rounded-tl-sm m-1" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--fantasy-text-bronze)] rounded-tr-sm m-1" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--fantasy-text-bronze)] rounded-bl-sm m-1" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--fantasy-text-bronze)] rounded-br-sm m-1" />

            {title && (
                <div className="flex justify-between items-center mb-4 border-b border-[var(--fantasy-text-bronze)] pb-2 opacity-90">
                    <h3 className="font-fantasy-header text-xl font-bold text-fantasy-text-bronze uppercase tracking-wider">
                        {title}
                    </h3>
                    {action && <div>{action}</div>}
                </div>
            )}

            <div className="font-fantasy-body">
                {children}
            </div>
        </div>
    );
};
