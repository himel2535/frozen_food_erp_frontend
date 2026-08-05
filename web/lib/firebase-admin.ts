import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

type ServiceAccountFields = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function loadServiceAccountFromFile(): ServiceAccountFields | null {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    join(process.cwd(), 'serviceAccount.json'),
    join(process.cwd(), 'web', 'serviceAccount.json'),
  ].filter((p): p is string => Boolean(p));

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf8')) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (!raw.project_id || !raw.client_email || !raw.private_key) continue;
      return {
        projectId: raw.project_id,
        clientEmail: raw.client_email,
        privateKey: raw.private_key,
      };
    } catch {
      // try next candidate
    }
  }
  return null;
}

function resolveCredentials(): ServiceAccountFields {
  const fromEnv =
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? {
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }
      : null;

  if (fromEnv) return fromEnv;

  const fromFile = loadServiceAccountFromFile();
  if (fromFile) return fromFile;

  throw new Error(
    'Missing Firebase Admin credentials. Place web/serviceAccount.json (from Firebase Console → Project settings → Service accounts → Generate new private key) or set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.',
  );
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  try {
    const creds = resolveCredentials();
    const serviceAccount: ServiceAccount = {
      projectId: creds.projectId,
      clientEmail: creds.clientEmail,
      privateKey: creds.privateKey,
    };

    return initializeApp({
      credential: cert(serviceAccount),
      databaseURL:
        process.env.FIREBASE_ADMIN_DATABASE_URL ||
        'https://toys-erp-default-rtdb.firebaseio.com',
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const turbopackHint =
      detail.includes('junction') || detail.includes('Turbopack')
        ? ' On Windows, use `npm run dev` (webpack), not `npm run dev:turbo`. Delete `web/.next` and restart if the error persists.'
        : '';
    throw new Error(`Firebase Admin failed to initialize: ${detail}.${turbopackHint}`);
  }
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDatabase() {
  return getDatabase(getAdminApp());
}

export async function verifyIdToken(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (!token) throw new Error('Unauthorized');
  return getAdminAuth().verifyIdToken(token);
}

export async function requireMainAdmin(authorizationHeader: string | null) {
  const decoded = await verifyIdToken(authorizationHeader);
  const snap = await getAdminDatabase().ref(`toysfactory/auth/users/${decoded.uid}`).get();
  if (!snap.exists()) {
    throw new Error('Forbidden');
  }
  const profile = snap.val() as { isMainAdmin?: boolean; status?: string };
  if (!profile.isMainAdmin || profile.status === 'disabled') {
    throw new Error('Forbidden');
  }
  return { uid: decoded.uid, email: decoded.email ?? '', profile };
}
