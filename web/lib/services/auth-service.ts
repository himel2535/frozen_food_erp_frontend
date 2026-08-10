import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, getAuthUserRecord, setAuthUserRecord } from '@/lib/firebase';
import { normalizeAuthUser } from '@/lib/services/access-control-service';
import type { AuthUserRecord, CurrentUserProfile } from '@/lib/state/types';

export type AuthSession = {
  firebaseUser: User;
  authUser: AuthUserRecord;
};

const PROFILE_MISSING_MSG = 'User profile not found. Contact your administrator.';
const PROFILE_DENIED_MSG =
  'Database access denied. Check RTDB rules and admin profile.';
const PROFILE_DENIED_SIGNUP_DEV_HINT =
  ' Publish database.rules.json: run `npm run deploy:rules` from the repo root (or paste rules in Firebase Console → Realtime Database → Rules).';
const PROFILE_MISSING_DEV_HINT =
  ' Run: npm run seed:admin (requires web/serviceAccount.json)';

const AUTH_PROFILE_CACHE_KEY = 'hookerp_auth_profile_cache';

function readCachedAuthProfile(uid: string): AuthUserRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { uid?: string; authUser?: AuthUserRecord };
    if (parsed.uid !== uid || !parsed.authUser) return null;
    return parsed.authUser;
  } catch {
    return null;
  }
}

function writeCachedAuthProfile(uid: string, authUser: AuthUserRecord) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(AUTH_PROFILE_CACHE_KEY, JSON.stringify({ uid, authUser }));
  } catch {
    // ignore quota errors
  }
}

function clearCachedAuthProfile() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(AUTH_PROFILE_CACHE_KEY);
  } catch {
    // ignore
  }
}

function profileMissingError(): Error {
  const msg =
    process.env.NODE_ENV === 'development'
      ? `${PROFILE_MISSING_MSG}${PROFILE_MISSING_DEV_HINT}`
      : PROFILE_MISSING_MSG;
  return new Error(msg);
}

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return '';
}

function isPermissionDenied(error: unknown): boolean {
  const code = errorCode(error).toUpperCase();
  if (code === 'PERMISSION_DENIED' || code.endsWith('/PERMISSION_DENIED')) return true;
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /permission_denied|permission denied/i.test(msg);
}

function isTransientNetworkError(error: unknown): boolean {
  const code = errorCode(error).toLowerCase();
  if (code.includes('network') || code === 'unavailable') return true;
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /network|offline|unavailable|timeout/i.test(msg);
}

export function getCurrentAuthUser(): User | null {
  return auth.currentUser;
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const authUser = await loadAuthProfile(credential.user.uid);
  if (!authUser) {
    await firebaseSignOut(auth);
    throw profileMissingError();
  }
  if (authUser.status === 'disabled') {
    await firebaseSignOut(auth);
    throw new Error('This account has been disabled.');
  }
  writeCachedAuthProfile(credential.user.uid, authUser);
  return { firebaseUser: credential.user, authUser };
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedName) throw new Error('Full name is required.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');

  const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
  await updateProfile(credential.user, { displayName: trimmedName });

  const record = {
    uid: credential.user.uid,
    email: trimmedEmail,
    name: trimmedName,
    isMainAdmin: false,
    allowedSections: ['dashboard'],
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  try {
    await setAuthUserRecord(credential.user.uid, record);
  } catch (err) {
    await firebaseSignOut(auth);
    if (isPermissionDenied(err)) {
      const msg =
        process.env.NODE_ENV === 'development'
          ? `${PROFILE_DENIED_MSG}${PROFILE_DENIED_SIGNUP_DEV_HINT}`
          : PROFILE_DENIED_MSG;
      throw Object.assign(new Error(msg), {
        code: 'rtdb/permission_denied',
        cause: err,
      });
    }
    throw err;
  }

  const authUser = normalizeAuthUser(credential.user.uid, record);
  if (!authUser) {
    await firebaseSignOut(auth);
    throw new Error('Failed to create user profile.');
  }
  return { firebaseUser: credential.user, authUser };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function loadAuthProfile(uid: string): Promise<AuthUserRecord | null> {
  try {
    const raw = await getAuthUserRecord(uid);
    return normalizeAuthUser(uid, raw);
  } catch (err) {
    if (isPermissionDenied(err)) {
      throw Object.assign(new Error(PROFILE_DENIED_MSG), {
        code: 'rtdb/permission_denied',
        cause: err,
      });
    }
    throw err;
  }
}

async function resolveSessionForUser(user: User): Promise<AuthSession | null> {
  const authUser = await loadAuthProfile(user.uid);
  if (!authUser || authUser.status === 'disabled') {
    await firebaseSignOut(auth);
    return null;
  }
  return { firebaseUser: user, authUser };
}

export function onAuthSession(
  callback: (session: AuthSession | null) => void,
): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      clearCachedAuthProfile();
      callback(null);
      return;
    }

    const cached = readCachedAuthProfile(user.uid);
    if (cached && cached.status !== 'disabled') {
      callback({ firebaseUser: user, authUser: cached });
    }

    void (async () => {
      try {
        const session = await resolveSessionForUser(user);
        if (session) {
          writeCachedAuthProfile(user.uid, session.authUser);
        }
        callback(session);
      } catch (err) {
        console.warn('[onAuthSession] Failed to load auth profile', err);

        if (isTransientNetworkError(err)) {
          try {
            const session = await resolveSessionForUser(user);
            if (session) {
              writeCachedAuthProfile(user.uid, session.authUser);
            }
            callback(session);
            return;
          } catch (retryErr) {
            console.warn('[onAuthSession] Retry failed', retryErr);
            err = retryErr;
          }
        }

        if (isPermissionDenied(err) || errorCode(err) === 'rtdb/permission_denied') {
          clearCachedAuthProfile();
          void firebaseSignOut(auth).finally(() => callback(null));
          return;
        }

        const msg = err instanceof Error ? err.message : '';
        if (msg === PROFILE_MISSING_MSG || msg === PROFILE_DENIED_MSG) {
          clearCachedAuthProfile();
          void firebaseSignOut(auth).finally(() => callback(null));
          return;
        }

        if (cached && cached.status !== 'disabled') {
          return;
        }

        callback(null);
      }
    })();
  });
}

export function authUserToCurrentProfile(authUser: AuthUserRecord): CurrentUserProfile {
  return {
    id: authUser.uid,
    name: authUser.name,
    email: authUser.email,
    role: authUser.isMainAdmin ? 'admin' : 'user',
    branch: 'Main',
  };
}

export function mapAuthError(error: unknown): string {
  const code = errorCode(error);
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email sign-up is not enabled. Contact your administrator.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    case 'rtdb/permission_denied':
    case 'PERMISSION_DENIED':
      return PROFILE_DENIED_MSG;
    default:
      if (error instanceof Error && error.message) {
        if (/permission_denied|permission denied/i.test(error.message)) {
          return PROFILE_DENIED_MSG;
        }
        if (/profile not found/i.test(error.message)) {
          if (
            process.env.NODE_ENV === 'development' &&
            !error.message.includes('seed:admin')
          ) {
            return `${PROFILE_MISSING_MSG}${PROFILE_MISSING_DEV_HINT}`;
          }
          return error.message;
        }
        return error.message;
      }
      return 'Sign-in failed. Please try again.';
  }
}
