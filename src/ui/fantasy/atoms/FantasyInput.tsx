import React from 'react';

interface FantasyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const FantasyInput: React.FC<FantasyInputProps> = ({ label, error, className = '', ...props }) => {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="font-fantasy-ui text-sm font-bold text-[var(--fantasy-text-ink)] opacity-80">
                    {label}
                </label>
            )}
            <input
                className={`
                    px-3 py-2 rounded
                    bg-[rgba(0,0,0,0.05)] 
                    border border-[var(--fantasy-bg-wood-light)]
                    text-[var(--fantasy-text-ink)] font-fantasy-ui font-bold
                    shadow-[var(--shadow-fantasy-inset)]
                    focus:outline-none focus:border-[var(--fantasy-secondary)]
                    focus:ring-2 focus:ring-[var(--fantasy-secondary)]/30
                    focus:bg-[rgba(0,0,0,0.1)]
                    disabled:opacity-50
                    transition-all duration-200 ease-in-out
                    ${className}
                `}
                {...props}
            />
            {error && (
                <span className="text-[var(--fantasy-error)] text-xs font-fantasy-ui">{error}</span>
            )}
        </div>
    );
};
