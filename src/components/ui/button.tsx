import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const variantClass = {
      default: 'bg-slate-900 text-white hover:bg-slate-800',
      outline: 'border bg-white hover:bg-slate-100',
      ghost: 'hover:bg-slate-100',
      link: 'text-slate-900 underline-offset-4 hover:underline',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
    }[variant];

    const sizeClass = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3',
      lg: 'h-11 px-8',
      icon: 'h-10 w-10',
    }[size];

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 ${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
