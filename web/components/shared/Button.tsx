'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'secondary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseCls =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    // Variant styles
    const variantCls = {
      primary:
        'btn-premium-3d-green text-white focus:ring-green-600/30 border-none',
      secondary:
        'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98] focus:ring-slate-500/20 border border-transparent',
      outline:
        'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98] focus:ring-slate-500/20',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] focus:ring-rose-500/20 border border-transparent',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] focus:ring-emerald-500/20 border border-transparent',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500/20 border border-transparent',
    }[variant];

    // Size styles
    const sizeCls = {
      sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
      md: 'px-4 py-2.5 text-xs rounded-xl gap-2',
      lg: 'px-5 py-3 text-sm rounded-xl gap-2',
    }[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${baseCls} ${variantCls} ${sizeCls} ${className}`}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-current shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
