import { getAdminAuth, getAdminDatabase } from '@/lib/firebase-admin';

/** Known Auth UID for admin@toysfactory.com in project toys-erp */
export const MAIN_ADMIN_UID = 'kdnUotlpnOSBzEzSvX1VwGK6ZYA2';
export const MAIN_ADMIN_EMAIL = 'admin@toysfactory.com';
export const MAIN_ADMIN_NAME = 'Main Admin';
export const AUTH_USER_PATH = `toysfactory/auth/users/${MAIN_ADMIN_UID}`;
export const RTDB_DATABASE_URL =
  process.env.FIREBASE_ADMIN_DATABASE_URL ||
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://toys-erp-default-rtdb.firebaseio.com';

export type BootstrapAdminResult = {
  ok: true;
  uid: string;
  path: string;
  databaseURL: string;
  created: boolean;
  isMainAdmin: boolean;
};

export type MainAdminProfile = {
  uid: string;
  email: string;
  name: string;
  isMainAdmin: true;
  allowedSections: ['*'];
  status: 'active';
  createdAt: string;
};

export function buildMainAdminProfile(createdAt?: string): MainAdminProfile {
  return {
    uid: MAIN_ADMIN_UID,
    email: MAIN_ADMIN_EMAIL,
    name: MAIN_ADMIN_NAME,
    isMainAdmin: true,
    allowedSections: ['*'],
    status: 'active',
    createdAt: createdAt ?? new Date().toISOString(),
  };
}

/**
 * Idempotent: writes main admin RTDB profile via Admin SDK (bypasses client rules).
 * Does not create the Auth user — that must already exist in Firebase Authentication.
 */
export async function seedMainAdminProfile(): Promise<BootstrapAdminResult> {
  const db = getAdminDatabase();
  const ref = db.ref(AUTH_USER_PATH);
  const existing = await ref.get();
  const created = !existing.exists();

  let createdAt = new Date().toISOString();
  if (existing.exists()) {
    const prev = existing.val() as { createdAt?: string };
    if (prev.createdAt) createdAt = String(prev.createdAt);
  }

  const profile = buildMainAdminProfile(createdAt);
  await ref.set(profile);

  const verify = await ref.get();
  if (!verify.exists()) {
    throw new Error(
      `Write appeared to succeed but profile missing at ${AUTH_USER_PATH}. Database: ${RTDB_DATABASE_URL}`,
    );
  }

  const written = verify.val() as { isMainAdmin?: boolean };
  if (!written.isMainAdmin) {
    throw new Error(`Profile at ${AUTH_USER_PATH} is missing isMainAdmin: true`);
  }

  // Soft-check Auth user exists (warn via throw only if getUser fails hard)
  try {
    await getAdminAuth().getUser(MAIN_ADMIN_UID);
  } catch (err) {
    const code =
      typeof err === 'object' && err && 'code' in err
        ? String((err as { code: string }).code)
        : '';
    if (code === 'auth/user-not-found') {
      throw new Error(
        `RTDB profile written, but Firebase Auth has no user with UID ${MAIN_ADMIN_UID}. Create admin@toysfactory.com in Authentication first.`,
      );
    }
    // Other auth lookup errors: profile is still usable for login if Auth user exists
    console.warn('[bootstrap-admin] Could not verify Auth user', err);
  }

  return {
    ok: true,
    uid: MAIN_ADMIN_UID,
    path: AUTH_USER_PATH,
    databaseURL: RTDB_DATABASE_URL,
    created,
    isMainAdmin: true,
  };
}
