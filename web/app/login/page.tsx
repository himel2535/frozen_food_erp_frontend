'use client';

import { useRouter } from 'next/navigation';
import { LoginGuard } from '@/components/auth/AuthGuard';
import { useAppStore } from '@/lib/state/app-store';

export default function LoginPage() {
  const router = useRouter();
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const t = useAppStore((s) => s.t);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggedIn(true);
    router.push('/dashboard');
  };

  return (
    <LoginGuard>
      <div id="screen-login" className="min-h-screen flex flex-col md:flex-row w-full">
        <div className="hidden md:flex md:w-[55%] lg:w-[60%] bg-slate-950 p-12 flex-col justify-between relative overflow-hidden text-white border-r border-slate-900">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[150px]" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/20">H</div>
            <span className="text-xl font-bold tracking-tight">{t('login.title')}</span>
          </div>

          <div className="my-auto max-w-xl relative z-10">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              <span dangerouslySetInnerHTML={{ __html: t('login.subtitle').replace('. ', '.<br>') }} />
            </h1>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-md">
              Streamline your CRM, Sales, Inventory, HRM, and Accounting in a modern multi-tenant enterprise system designed for high-growth SaaS environments.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('login.realtime')}</span>
                <span className="text-xl font-extrabold text-white block mt-2">$1,243,150</span>
                <span className="text-[9px] text-emerald-500 font-bold block mt-1">▲ +12.5% vs last month</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('login.active')}</span>
                <span className="text-xl font-extrabold text-white block mt-2">1,452 SKU</span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">In Stock: 14 Sectors</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 relative z-10">© 2026 Toys Factory ERP Cloud. All rights reserved.</div>
        </div>

        <div className="flex-1 bg-slate-50 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 lg:p-24">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2.5 mb-8 md:hidden">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-md">H</div>
              <span className="text-md font-bold tracking-tight text-slate-950">Toys Factory ERP</span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">{t('login.welcome')}</h2>
            <p className="text-xs text-slate-500 mt-2 font-medium">{t('login.credentials')} to access your sandbox company workspace.</p>

            <form className="mt-8 space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">{t('login.email')}</label>
                <input type="email" required defaultValue="admin@toysfactory.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-700">{t('login.password')}</label>
                  <a href="#" className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors">{t('login.forgot')}</a>
                </div>
                <input type="password" required defaultValue="password123" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="remember-me" className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500/20 cursor-pointer" />
                <label htmlFor="remember-me" className="text-xs font-medium text-slate-600 select-none">{t('login.remember')} for 30 days</label>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-500/15 mt-6 hover:scale-[1.01] cursor-pointer">
                {t('login.btn')}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>{t('login.footer')}</span>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">{t('login.create')}</a>
            </div>
          </div>
        </div>
      </div>
    </LoginGuard>
  );
}
