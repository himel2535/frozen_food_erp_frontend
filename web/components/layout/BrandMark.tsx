'use client';

import Image from 'next/image';

const LOGO_SRC = '/images/logo-zayan-mart.png';

type BrandMarkSize = 'sidebar' | 'header';

const SIZE: Record<BrandMarkSize, { logoH: number; word: string; logoOnlyH: number }> = {
  sidebar: {
    logoH: 36,
    logoOnlyH: 32,
    word: 'text-lg',
  },
  header: {
    logoH: 36,
    logoOnlyH: 32,
    word: 'text-[15px] md:text-base',
  },
};

export function BrandMark({
  size = 'sidebar',
  showWordmark = true,
}: {
  size?: BrandMarkSize;
  showWordmark?: boolean;
}) {
  const s = SIZE[size];
  const logoH = showWordmark ? s.logoH : s.logoOnlyH;
  return (
    <span className={`flex items-center gap-2 min-w-0 ${showWordmark ? 'h-9' : 'h-8'}`}>
      <Image
        src={LOGO_SRC}
        alt="Zayan Mart"
        width={819}
        height={300}
        className="block w-auto shrink-0 object-contain object-left drop-shadow-xs"
        style={{ height: logoH, width: 'auto' }}
        unoptimized
        priority
      />
      {showWordmark ? (
        <span
          className={`${s.word} font-black tracking-tight leading-none text-cyan-600 translate-y-[4px]`}
        >
          Mart
        </span>
      ) : null}
    </span>
  );
}
