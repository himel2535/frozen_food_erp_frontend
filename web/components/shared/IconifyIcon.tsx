'use client';

import { useEffect, useState } from 'react';
import { Icon, iconLoaded, loadIcon } from '@iconify/react';

export interface IconifyIconProps {
  icon: string;
  width?: number;
  height?: number;
  className?: string;
  skeletonClassName?: string;
}

export function IconifyIcon({
  icon,
  width = 32,
  height = 32,
  className = '',
  skeletonClassName = '',
}: IconifyIconProps) {
  const [ready, setReady] = useState(() => iconLoaded(icon));

  useEffect(() => {
    if (iconLoaded(icon)) {
      setReady(true);
      return;
    }

    setReady(false);
    let cancelled = false;

    void loadIcon(icon)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [icon]);

  return (
    <span
      className="iconify-icon-slot inline-flex shrink-0 items-center justify-center"
      style={{ width, height }}
      aria-hidden
    >
      {!ready && (
        <span
          className={`app-skeleton iconify-icon-skeleton ${skeletonClassName}`.trim()}
          style={{ width, height }}
          aria-hidden
        />
      )}
      <Icon
        icon={icon}
        width={width}
        height={height}
        className={`${className} iconify-icon-mark ${ready ? 'iconify-icon-mark--ready' : ''}`.trim()}
        onLoad={() => setReady(true)}
      />
    </span>
  );
}
