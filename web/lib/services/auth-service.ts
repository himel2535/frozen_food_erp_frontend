import { normalizeAuthUser } from '@/lib/services/access-control-service';
import type { AuthUserRecord, CurrentUserProfile } from '@/lib/state/types';

export type AuthSession = {
  token: string;
  authUser: AuthUserRecord;
};

const AUTH_TOKEN_KEY = 'hookerp_jwt_token';
const AUTH_PROFILE_CACHE_KEY = 'hookerp_auth_profile_cache';

export function getJwtToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeJwtToken(token: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore quota / private mode
  }
}

function clearJwtToken() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

function readCachedAuthProfile(): AuthUserRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUserRecord;
  } catch {
    return null;
  }
}

function writeCachedAuthProfile(authUser: AuthUserRecord) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(AUTH_PROFILE_CACHE_KEY, JSON.stringify(authUser));
  } catch {}
}

function clearCachedAuthProfile() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(AUTH_PROFILE_CACHE_KEY);
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
  const token = data.token;
  const user = data.user;

  const authUser = normalizeAuthUser(user.uid, {
    ...user,
    createdAt: new Date().toISOString(),
  });

  if (!authUser) {
    throw new Error('Failed to parse user profile.');
  }

  writeCachedAuthProfile(authUser);
  if (typeof token === 'string' && token) {
    writeJwtToken(token);
  }

  return { token, authUser };
}

export async function signOut(): Promise<void> {
  clearJwtToken();
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
        clearJwtToken();
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
  const cached = readCachedAuthProfile();
  
  // We can pass a dummy token string because the real token is in the cookie
  if (cached && cached.status !== 'disabled') {
    callback({ token: 'cookie-auth', authUser: cached });
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

  // No real-time listener for JWT, so we just return a no-op un-subscriber
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
