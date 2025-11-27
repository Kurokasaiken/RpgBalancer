import React from 'react';
import styles from './GlassButton.module.css';

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
    const classes = [
        styles.button,
        styles[variant],
        styles[size],
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="animate-spin mr-2">⟳</span>
            ) : leftIcon}

            {children}

            {!isLoading && rightIcon}
        </button>
    );
};
