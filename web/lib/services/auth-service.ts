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
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setJwtToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearJwtToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
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
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${getApiUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  setJwtToken(token);
  writeCachedAuthProfile(authUser);

  return { token, authUser };
}

export async function signOut(): Promise<void> {
  clearJwtToken();
  clearCachedAuthProfile();
}

export async function loadAuthProfile(): Promise<AuthUserRecord | null> {
  const token = getJwtToken();
  if (!token) return null;

  try {
    const res = await fetch(`${getApiUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
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
  // Check if we have a token
  const token = getJwtToken();
  if (!token) {
    clearCachedAuthProfile();
    callback(null);
    return () => {};
  }

  const cached = readCachedAuthProfile();
  if (cached && cached.status !== 'disabled') {
    callback({ token, authUser: cached });
  }

  void (async () => {
    const freshProfile = await loadAuthProfile();
    if (!freshProfile) {
      callback(null);
    } else {
      writeCachedAuthProfile(freshProfile);
      callback({ token, authUser: freshProfile });
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
