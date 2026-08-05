'use client';

import Image from 'next/image';
import { Globe } from 'lucide-react';
import {
  FORM_ALERT_ERROR_CLS,
  FORM_BTN_PRIMARY,
  FORM_INPUT_CLS,
  FORM_LABEL_CLS,
} from '@/lib/ui/form-styles';

export type AuthMode = 'signin' | 'signup';

export interface LoginScreenProps {
  mode: AuthMode;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  submitting: boolean;
  bootstrapping: boolean;
  errorMessage: string | null;
  showAutoSetup: boolean;
  lang: 'en' | 'bn';
  t: (key: string) => string;
  onSwitchMode: (mode: AuthMode) => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onLogin: (e: React.FormEvent) => void;
  onSignUp: (e: React.FormEvent) => void;
  onAutoSetup: () => void;
  onToggleLanguage: () => void;
}

const MODULE_CHIPS = [
  { key: 'login.module_crm', image: '/images/sidebar/sales-crm/leads.png' },
  { key: 'login.module_sales', image: '/images/sidebar/sales-crm/orders.png' },
  { key: 'login.module_inventory', image: '/images/sidebar/inventory.png' },
  { key: 'login.module_hrm', image: '/images/sidebar/hr.png' },
] as const;

function SegmentedTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
        active
          ? 'bg-white/95 border border-white shadow-md ring-1 ring-slate-950/5 text-blue-700'
          : 'bg-white/45 hover:bg-white/75 border border-white/80 text-slate-600 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );
}

export function LoginScreen({
  mode,
  name,
  email,
  password,
  confirmPassword,
  submitting,
  bootstrapping,
  errorMessage,
  showAutoSetup,
  lang,
  t,
  onSwitchMode,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onLogin,
  onSignUp,
  onAutoSetup,
  onToggleLanguage,
}: LoginScreenProps) {
  const isSignUp = mode === 'signup';

  return (
    <div
      id="screen-login"
      className="relative min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <button
        type="button"
        onClick={onToggleLanguage}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 h-9 px-2.5 rounded-xl bg-white/50 hover:bg-white/90 border border-white/80 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        title="Switch Language"
      >
        <Globe className="w-[18px] h-[18px] text-slate-600 shrink-0" aria-hidden />
        <span className="uppercase text-[11px] font-extrabold text-slate-800">
          {lang === 'en' ? 'EN' : 'বাংলা'}
        </span>
      </button>

      <div className="w-full max-w-md flex flex-col items-center gap-5 sm:gap-6">
        <header className="text-center space-y-2 px-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <Image
                src="/images/logo-toys.png"
                alt="Toys Factory Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain drop-shadow-xs"
                unoptimized
              />
            </div>
            <div className="flex items-baseline">
              <span className="text-xl sm:text-2xl font-black tracking-tight">
                <span className="text-amber-700">Toys</span>
                <span className="text-cyan-600 ml-0.5">Factory</span>
              </span>
              <span className="ml-1.5 text-xs font-black tracking-widest text-slate-400 uppercase">
                ERP
              </span>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
            {t('login.desc')}
          </p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-extrabold tracking-wide">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            System Active
          </span>
        </header>

        <div className="premium-card premium-shadow w-full p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {isSignUp ? t('login.register_title') : t('login.welcome')}
            </h1>
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 leading-relaxed">
              {isSignUp ? t('login.register_subtitle') : t('login.credentials')}
            </p>
          </div>

          <div className="flex gap-2 p-1 rounded-2xl bg-white/30 border border-white/60">
            <SegmentedTab
              active={!isSignUp}
              label={t('login.tab_signin')}
              onClick={() => onSwitchMode('signin')}
            />
            <SegmentedTab
              active={isSignUp}
              label={t('login.tab_signup')}
              onClick={() => onSwitchMode('signup')}
            />
          </div>

          <form className="space-y-4" onSubmit={isSignUp ? onSignUp : onLogin}>
            {isSignUp ? (
              <div>
                <label className={FORM_LABEL_CLS}>{t('login.full_name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  autoComplete="name"
                  placeholder={t('login.full_name_placeholder')}
                  className={FORM_INPUT_CLS}
                />
              </div>
            ) : null}

            <div>
              <label className={FORM_LABEL_CLS}>{t('login.email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                autoComplete={isSignUp ? 'email' : 'username'}
                placeholder="you@company.com"
                className={FORM_INPUT_CLS}
              />
            </div>

            <div>
              <label className={FORM_LABEL_CLS}>{t('login.password')}</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className={FORM_INPUT_CLS}
              />
            </div>

            {isSignUp ? (
              <div>
                <label className={FORM_LABEL_CLS}>{t('login.confirm_password')}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  autoComplete="new-password"
                  className={FORM_INPUT_CLS}
                />
              </div>
            ) : null}

            {!isSignUp ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500/20 cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-xs font-medium text-slate-600 select-none cursor-pointer">
                  {t('login.remember')}
                </label>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 pt-1">{t('login.register_hint')}</p>
            )}

            {errorMessage ? (
              <div role="alert" className={`${FORM_ALERT_ERROR_CLS} space-y-2`}>
                <p>{errorMessage}</p>
                {showAutoSetup ? (
                  <button
                    type="button"
                    disabled={bootstrapping}
                    onClick={() => void onAutoSetup()}
                    className="w-full mt-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
                  >
                    {bootstrapping ? 'Setting up...' : 'Auto-setup admin profile'}
                  </button>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting || bootstrapping}
              className={`w-full disabled:opacity-60 mt-2 ${FORM_BTN_PRIMARY}`}
            >
              {submitting
                ? (isSignUp ? t('login.signing_up') : t('login.signing_in'))
                : (isSignUp ? t('login.register_btn') : t('login.btn'))}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-md">
          {MODULE_CHIPS.map((chip) => (
            <div
              key={chip.key}
              className="premium-card premium-shadow px-3 py-2.5 flex items-center gap-2 min-h-[52px]"
            >
              <Image
                src={chip.image}
                alt=""
                width={22}
                height={22}
                className="w-[22px] h-[22px] object-contain shrink-0"
                unoptimized
              />
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 leading-tight truncate">
                {t(chip.key)}
              </span>
            </div>
          ))}
        </div>

        <footer className="w-full max-w-md text-center space-y-1 pt-1">
          <p className="text-[11px] font-semibold text-slate-400">{t('login.footer')}</p>
          <p className="text-[10px] text-slate-400/80">© 2026 Toys Factory ERP Cloud</p>
        </footer>
      </div>
    </div>
  );
}
