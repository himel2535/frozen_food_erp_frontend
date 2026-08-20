'use client';

import Image from 'next/image';

const LOGO_SRC = '/images/logo-zayan-mart.png';
const TOY_LOGO_SRC = '/images/food-fun-logo-v3.png';

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
    toyIconH: 36,
    toyIconCollapsedH: 30,
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
  const toyIconH = showWordmark ? s.toyIconH : s.toyIconCollapsedH;

  return (
    <span className="inline-flex flex-row flex-nowrap items-center gap-1.5 whitespace-nowrap shrink-0 ml-1">
      <Image
        src={TOY_LOGO_SRC}
        alt="Food Fun Agro Foods Logo"
        width={163}
        height={144}
        className={`object-contain shrink-0 drop-shadow-xs ${s.toyIconOffset}`}
        style={{ height: toyIconH, width: 'auto' }}
        unoptimized
      />
      {showWordmark ? (
        <span className="inline-flex flex-row flex-nowrap items-baseline shrink-0">
          <span className="text-[17px] font-black tracking-tight">
            <span className="text-emerald-600">Food</span>
            <span className="text-amber-500 ml-0.5">Fun</span>
            <span className="text-slate-400 font-extrabold ml-1.5 text-[13px] uppercase tracking-wider">
              Agro Foods
            </span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
