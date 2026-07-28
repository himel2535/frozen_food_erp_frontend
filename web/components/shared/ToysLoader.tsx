'use client';

import Image from 'next/image';

interface ToysLoaderProps {
  label?: string;
  sublabel?: string;
  fullScreen?: boolean;
}

export function ToysLoader({
  label = 'Loading Workspace...',
  sublabel = 'Setting up real-time factory modules',
  fullScreen = true,
}: ToysLoaderProps) {
  return (
    <div
      className={`${
        fullScreen ? 'fixed inset-0 z-50 min-h-screen' : 'w-full py-16'
      } flex items-center justify-center bg-slate-900/10 backdrop-blur-md transition-all`}
    >
      <div className="p-7 rounded-3xl bg-white/90 border border-white/90 shadow-2xl flex flex-col items-center text-center max-w-xs mx-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Animated Toy Loader Emblem */}
        <div className="relative flex items-center justify-center w-20 h-20 mb-4">
          {/* Glowing colorful aura */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/30 via-cyan-400/30 to-indigo-500/30 blur-lg animate-pulse" />

          {/* Spinning gradient ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-amber-500 border-r-cyan-500 border-b-indigo-500 animate-spin" />

          {/* Bouncing Teddy Bear Icon */}
          <div className="relative z-10 w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-xs border border-slate-100 p-1.5 animate-bounce">
            <Image
              src="/images/logo-toys.png"
              alt="Toys Factory Loader"
              width={40}
              height={40}
              className="w-full h-full object-contain shrink-0"
              unoptimized
            />
          </div>
        </div>

        {/* Brand Title */}
        <div className="text-base font-black tracking-tight mb-1">
          <span className="text-amber-700">Toys</span>
          <span className="text-cyan-600 ml-0.5">Factory</span>
          <span className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">ERP</span>
        </div>

        {/* Dynamic Label & Pulse Dots */}
        <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
          <span>{label}</span>
          <span className="flex items-center gap-1 ml-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping [animation-delay:0.4s]" />
          </span>
        </div>

        {sublabel && (
          <p className="text-[11px] font-semibold text-slate-400 mt-1 truncate max-w-[220px]">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
