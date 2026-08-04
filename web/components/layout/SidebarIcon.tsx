'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';

interface SidebarIconProps {
  imageIcon?: string;
  iconifyIcon?: string;
  className?: string;
  size?: number;
}

export function SidebarIcon({ imageIcon, iconifyIcon, className = '', size = 26 }: SidebarIconProps) {
  const slotStyle = { width: size, height: size };

  if (iconifyIcon) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={slotStyle}
      >
        <Icon icon={iconifyIcon} width={size} height={size} className={`sidebar-icon ${className}`} />
      </span>
    );
  }
  if (imageIcon) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={slotStyle}
      >
        <Image
          src={imageIcon}
          alt=""
          width={size}
          height={size}
          className={`sidebar-icon object-contain ${className}`}
        />
      </span>
    );
  }
  return <span className="inline-flex shrink-0" style={slotStyle} aria-hidden />;
}
