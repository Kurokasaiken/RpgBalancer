import React from 'react';
import styles from './GlassSelect.module.css';

/**
 * Props for the GlassSelect component.
 */
interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: Array<{ value: string | number; label: string }>;
    fullWidth?: boolean;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
    label,
    error,
    options,
    className = '',
    fullWidth = true,
    disabled,
    ...props
}) => {
    const selectClasses = [
        styles.select,
        error ? styles.hasError : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={styles.container} style={{ width: fullWidth ? '100%' : 'auto' }}>
            {label && <label className={styles.label}>{label}</label>}

            <div className={styles.selectWrapper}>
                <select
                    className={selectClasses}
                    disabled={disabled}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
                            {opt.label}
                        </option>
                    ))}
                </select>

                <svg className={styles.arrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};
