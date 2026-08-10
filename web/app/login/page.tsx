'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginGuard } from '@/components/auth/AuthGuard';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { BengaliFontLoader } from '@/components/shared/BengaliFontLoader';
import { ToysLoader } from '@/components/shared/ToysLoader';
import { useAppStore } from '@/lib/state/app-store';
import { mapAuthError, signIn } from '@/lib/services/auth-service';
import { logSystemAudit } from '@/lib/services/audit-log-service';
import { getFirstAllowedHref } from '@/lib/services/access-control-service';
import { toast } from '@/lib/ui/feedback';

const PROFILE_MISSING_HINT = 'User profile not found';
const isDev = process.env.NODE_ENV === 'development';

export default function LoginPage() {
  const router = useRouter();
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.appState.lang ?? 'en');
  const hydrated = useAppStore((s) => s.hydrated);
  const authReady = useAppStore((s) => s.authReady);
  const toggleLanguage = useAppStore((s) => s.toggleLanguage);
  const applyAuthSession = useAppStore((s) => s.applyAuthSession);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [email, setEmail] = useState('admin@toysfactory.com');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showAutoSetup =
    isDev && Boolean(errorMessage && errorMessage.includes(PROFILE_MISSING_HINT));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const session = await signIn(email, password);
      applyAuthSession(session.authUser);
      logSystemAudit(useAppStore.getState().appState, {
        action: 'LOGIN',
        module: 'Auth',
        description: `Successful login (${session.authUser.email})`,
        actorId: session.authUser.uid,
        actorName: session.authUser.name,
      });
      saveAppState();
      toast.success(t('login.success_signin'), { description: session.authUser.name });
      router.push(getFirstAllowedHref(session.authUser));
    } catch (err) {
      const message = mapAuthError(err);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSetup = async () => {
    if (bootstrapping) return;
    setBootstrapping(true);
    try {
      const res = await fetch('/api/dev/bootstrap', { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { error?: string; path?: string };
      if (!res.ok) {
        throw new Error(data.error || `Bootstrap failed (${res.status})`);
      }
      toast.success('Admin profile ready', {
        description: data.path ? `Seeded ${data.path}` : 'You can sign in again.',
      });
      setErrorMessage(null);
      if (password) {
        setSubmitting(true);
        try {
          const session = await signIn(email, password);
          applyAuthSession(session.authUser);
          toast.success(t('login.success_signin'), { description: session.authUser.name });
          router.push(getFirstAllowedHref(session.authUser));
        } catch (err) {
          const message = mapAuthError(err);
          setErrorMessage(message);
          toast.error(message);
        } finally {
          setSubmitting(false);
        }
      } else {
        setErrorMessage('Profile seeded. Enter your password and sign in again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Auto-setup failed';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setBootstrapping(false);
    }
  };

  return (
    <LoginGuard>
      <BengaliFontLoader />
      {!hydrated || !authReady ? (
        <ToysLoader label="Loading..." sublabel={t('login.title')} />
      ) : (
        <LoginScreen
          email={email}
          password={password}
          submitting={submitting}
          bootstrapping={bootstrapping}
          errorMessage={errorMessage}
          showAutoSetup={showAutoSetup}
          lang={lang}
          t={t}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onLogin={(e) => void handleLogin(e)}
          onAutoSetup={() => void handleAutoSetup()}
          onToggleLanguage={toggleLanguage}
        />
      )}
    </LoginGuard>
  );
}
