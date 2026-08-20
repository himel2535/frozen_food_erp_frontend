'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from './Button';

export interface SplitButtonItem {
  label: string;
  onClick: () => void;
}

export interface SplitButtonProps {
  label: string;
  onClick: () => void;
  items: SplitButtonItem[];
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SplitButton({
  label,
  onClick,
  items,
  variant = 'primary',
  size = 'md',
  className = '',
}: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={`relative self-start ${className}`}>
      <div className="flex">
        <Button
          type="button"
          onClick={onClick}
          variant={variant}
          size={size}
          className="rounded-r-none"
        >
          {label}
        </Button>
        <Button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          variant={variant}
          size={size}
          className="px-2.5 rounded-l-none border-l border-green-700/40"
          aria-label="More options"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-lg py-1">
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
