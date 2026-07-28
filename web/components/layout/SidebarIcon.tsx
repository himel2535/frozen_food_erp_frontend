'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';

interface SidebarIconProps {
  imageIcon?: string;
  iconifyIcon?: string;
  className?: string;
  size?: number;
}

export function SidebarIcon({ imageIcon, iconifyIcon, className = '', size = 32 }: SidebarIconProps) {
  if (imageIcon) {
    return (
      <Image
        src={imageIcon}
        alt=""
        width={size}
        height={size}
        className={`sidebar-icon object-contain ${className}`}
      />
    );
  }
  if (iconifyIcon) {
    return <Icon icon={iconifyIcon} width={size} height={size} className={`sidebar-icon ${className}`} />;
  }
  return null;
}
