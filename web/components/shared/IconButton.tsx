'use client';

import React from 'react';
import { Button, type ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  'aria-label': string; // Enforce accessibility
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className = '', size = 'md', children, ...props }, ref) => {
    // Size styles specifically for square dimensions
    const sizeCls = {
      sm: 'p-1.5 text-xs rounded-lg min-w-[28px] min-h-[28px] h-7 w-7',
      md: 'p-2.5 text-xs rounded-xl min-w-[38px] min-h-[38px] h-10 w-10',
      lg: 'p-3 text-sm rounded-xl min-w-[46px] min-h-[46px] h-12 w-12',
    }[size];

    return (
      <Button
        ref={ref}
        className={`${sizeCls} ${className}`}
        size={size}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
