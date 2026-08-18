'use client';

import Image from 'next/image';

const LOGO_SRC = '/images/logo-zayan-mart.png';
const TOY_LOGO_SRC = '/images/toy-logo-zayan-horse.png';

type BrandMarkSize = 'sidebar' | 'header';

const SIZE: Record<
  BrandMarkSize,
  {
    logoH: number;
    word: string;
    logoOnlyH: number;
    wordOffset: string;
    logoOffset: string;
    toyIconH: number;
    toyIconCollapsedH: number;
    toyIconOffset: string;
  }
> = {
  sidebar: {
    logoH: 26,
    logoOnlyH: 22,
    logoOffset: 'translate-y-[1px]',
    toyIconH: 46,
    toyIconCollapsedH: 38,
    toyIconOffset: 'translate-y-[1px]',
    word: 'text-base',
    wordOffset: 'translate-y-[2px]',
  },
  header: {
    logoH: 36,
    logoOnlyH: 32,
    logoOffset: '',
    toyIconH: 32,
    toyIconCollapsedH: 32,
    toyIconOffset: '',
    word: 'text-[15px] md:text-base',
    wordOffset: 'translate-y-[4px]',
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
  const toyIconH = showWordmark ? s.toyIconH : s.toyIconCollapsedH;
  const sidebarCollapsed = size === 'sidebar' && !showWordmark;

  return (
    <span className="inline-flex flex-row flex-nowrap items-center gap-0 whitespace-nowrap shrink-0 -ml-[8px]">
      {size === 'sidebar' ? (
        <Image
          src={TOY_LOGO_SRC}
          alt="Toy Store logo"
          width={163}
          height={144}
          className={`object-contain shrink-0 drop-shadow-xs ${s.toyIconOffset}`}
          style={{ height: toyIconH, width: 'auto' }}
          unoptimized
        />
      ) : null}
      {!sidebarCollapsed ? (
        <span className="inline-flex flex-row flex-nowrap items-center gap-0 shrink-0 -ml-1.5">
          <Image
            src={LOGO_SRC}
            alt="Zayan Mart"
            width={819}
            height={300}
            className={`block w-auto shrink-0 object-contain object-left drop-shadow-xs ${s.logoOffset}`}
            style={{ height: logoH, width: 'auto' }}
            unoptimized
            priority
          />
          {showWordmark ? (
            <span
              className={`${s.word} shrink-0 font-black tracking-tight leading-none text-cyan-600 ${s.wordOffset}`}
            >
              Mart
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
