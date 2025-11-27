import React from 'react';
import styles from './GlassInput.module.css';

interface GlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    className = '',
    fullWidth = true,
    disabled,
    ...props
}) => {
    const inputClasses = [
        styles.input,
        error ? styles.hasError : '',
        leftIcon ? styles.withIconLeft : '',
        rightIcon ? styles.withIconRight : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={styles.container} style={{ width: fullWidth ? '100%' : 'auto' }}>
            {label && <label className={styles.label}>{label}</label>}

            <div className={styles.inputWrapper}>
                {leftIcon && <div className={styles.iconLeft}>{leftIcon}</div>}

                <input
                    className={inputClasses}
                    disabled={disabled}
                    {...props}
                />

                {rightIcon && <div className={styles.iconRight}>{rightIcon}</div>}
            </div>

            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};
