import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm";

    const variants = {
        primary: "bg-purple-600/80 hover:bg-purple-500/80 text-white border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]",
        secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20",
        danger: "bg-red-600/80 hover:bg-red-500/80 text-white border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]",
        ghost: "bg-transparent hover:bg-white/5 text-gray-300 hover:text-white"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-8 py-3 text-base",
        icon: "p-2"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="animate-spin mr-2">⟳</span>
            ) : leftIcon && <span className="mr-2">{leftIcon}</span>}

            {children}

            {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
        </button>
    );
};
