import { normalizeAuthUser } from '@/lib/services/access-control-service';
import type { AuthUserRecord, CurrentUserProfile } from '@/lib/state/types';

export type AuthSession = {
  token: string;
  authUser: AuthUserRecord;
};



const AUTH_PROFILE_CACHE_KEY = 'hookerp_auth_profile_cache';
const AUTH_PROFILE_TIME_KEY = 'hookerp_auth_profile_time';
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;

function readCachedAuthProfile(): { profile: AuthUserRecord; isFresh: boolean } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_PROFILE_CACHE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw) as AuthUserRecord;
    const timeRaw = sessionStorage.getItem(AUTH_PROFILE_TIME_KEY);
    const fetchedAt = timeRaw ? parseInt(timeRaw, 10) : 0;
    const isFresh = Date.now() - fetchedAt < PROFILE_CACHE_TTL_MS;
    return { profile, isFresh };
  } catch {
    return null;
  }
}

function writeCachedAuthProfile(authUser: AuthUserRecord) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(AUTH_PROFILE_CACHE_KEY, JSON.stringify(authUser));
    sessionStorage.setItem(AUTH_PROFILE_TIME_KEY, String(Date.now()));
  } catch {}
}

function clearCachedAuthProfile() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(AUTH_PROFILE_CACHE_KEY);
    sessionStorage.removeItem(AUTH_PROFILE_TIME_KEY);
  } catch {}
}

function getApiUrl() {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${getApiUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Login failed');
  }

  const data = await res.json();
  const user = data.user;

  const authUser = normalizeAuthUser(user.uid, {
    ...user,
    createdAt: new Date().toISOString(),
  });

  if (!authUser) {
    throw new Error('Failed to parse user profile.');
  }

  writeCachedAuthProfile(authUser);

  return { token: 'cookie-auth', authUser };
}

export async function signOut(): Promise<void> {
  clearCachedAuthProfile();
  
  try {
    await fetch(`${getApiUrl()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    // Ignore error on logout
  }
}

export async function loadAuthProfile(): Promise<AuthUserRecord | null> {
  try {
    const res = await fetch(`${getApiUrl()}/auth/me`, {
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status === 401) {
        clearCachedAuthProfile();
      }
      return null;
    }
    const data = await res.json();
    const user = data.user;
    return normalizeAuthUser(user.uid, {
      ...user,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    return null;
  }
}

export function onAuthSession(
  callback: (session: AuthSession | null) => void,
): () => void {
  // We use HttpOnly cookies, so we can't check the token directly.
  // Instead, we rely on the cached profile or load from the server.
  const cachedData = readCachedAuthProfile();
  
  if (cachedData?.profile && cachedData.profile.status !== 'disabled') {
    callback({ token: 'cookie-auth', authUser: cachedData.profile });
    // If cached profile is fresh (< 5 mins), avoid immediate duplicate /auth/me network call
    if (cachedData.isFresh) {
      return () => {};
    }
  }

  void (async () => {
    const freshProfile = await loadAuthProfile();
    if (!freshProfile) {
      callback(null);
    } else {
      writeCachedAuthProfile(freshProfile);
      callback({ token: 'cookie-auth', authUser: freshProfile });
    }
  })();

  return () => {};
}

export function authUserToCurrentProfile(authUser: AuthUserRecord): CurrentUserProfile {
  return {
    id: authUser.uid,
    name: authUser.name,
    email: authUser.email,
    role: authUser.isMainAdmin ? 'admin' : 'user',
    branch: 'Main',
    imageUrl: authUser.imageUrl ?? '',
    imagePublicId: authUser.imagePublicId ?? '',
  };
}

export function mapAuthError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
    return 'Incorrect email or password.';
  }
  if (msg.includes('auth/user-disabled')) {
    return 'This account has been disabled.';
  }
  return msg || 'Sign-in failed. Please try again.';
}
