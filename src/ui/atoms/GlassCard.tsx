import React from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'neon' | 'danger';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    interactive = false,
    onClick
}) => {
    const classes = [
        styles.card,
        styles[`variant-${variant}`],
        styles[`padding-${padding}`],
        interactive ? styles.interactive : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} onClick={onClick}>
            {children}
        </div>
    );
};
