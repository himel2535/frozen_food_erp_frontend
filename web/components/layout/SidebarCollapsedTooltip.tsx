'use client';

import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function SidebarCollapsedTooltip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);

  if (!collapsed) return <>{children}</>;

  const showTip = () => {
    const anchor = wrapRef.current?.querySelector('a') as HTMLElement | null;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setTipPos({ top: rect.top + rect.height / 2, left: rect.right + 10 });
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      onMouseEnter={showTip}
      onMouseLeave={() => setTipPos(null)}
      onFocus={showTip}
      onBlur={() => setTipPos(null)}
    >
      {children}
      {typeof document !== 'undefined' && tipPos
        ? createPortal(
            <span
              role="tooltip"
              className="sidebar-collapsed-tooltip pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/90 bg-white/95 px-3 py-1.5 text-xs font-extrabold text-slate-800 shadow-lg"
              style={{ top: tipPos.top, left: tipPos.left }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </div>
  );
}
