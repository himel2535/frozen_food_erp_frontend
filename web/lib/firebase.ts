import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, onValue, ref, set, get, update, remove } from 'firebase/database';

/** toys-erp Firebase project — override via NEXT_PUBLIC_FIREBASE_* in .env.local */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyD7B3wDKJ-y37AbNNqGDsWdy7Kutwa3Tos',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'toys-erp.firebaseapp.com',
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ??
    'https://toys-erp-default-rtdb.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'toys-erp',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'toys-erp.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '600573219203',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:600573219203:web:e7672dbf1093a5de61a6b6',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp, firebaseConfig.databaseURL);
const auth = getAuth(firebaseApp);
const appStateRef = ref(database, 'toysfactory/appState');

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripUndefinedDeep) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefinedDeep(v)]),
    ) as T;
  }
  return value;
}

export function subscribeToRemoteAppState(callback: (state: Record<string, unknown> | null) => void) {
  return onValue(appStateRef, (snapshot) => {
    callback(snapshot.val() as Record<string, unknown> | null);
  });
}

export async function saveRemoteAppState(state: Record<string, unknown>) {
  await set(appStateRef, stripUndefinedDeep(state));
}

export function authUserRef(uid: string) {
  return ref(database, `toysfactory/auth/users/${uid}`);
}

export function authUsersRef() {
  return ref(database, 'toysfactory/auth/users');
}

export function authRolesRef() {
  return ref(database, 'toysfactory/auth/roles');
}

export function authRoleRef(id: string) {
  return ref(database, `toysfactory/auth/roles/${id}`);
}

export async function listAuthRoleRecords(): Promise<Record<string, Record<string, unknown>>> {
  const snapshot = await get(authRolesRef());
  if (!snapshot.exists()) return {};
  return snapshot.val() as Record<string, Record<string, unknown>>;
}

export async function getAuthUserRecord(uid: string): Promise<Record<string, unknown> | null> {
  const snapshot = await get(authUserRef(uid));
  return snapshot.exists() ? (snapshot.val() as Record<string, unknown>) : null;
}

export async function setAuthUserRecord(uid: string, data: Record<string, unknown>) {
  await set(authUserRef(uid), stripUndefinedDeep(data));
}

export async function updateAuthUserRecord(uid: string, data: Record<string, unknown>) {
  await update(authUserRef(uid), stripUndefinedDeep(data));
}

export async function removeAuthUserRecord(uid: string) {
  await remove(authUserRef(uid));
}

export async function listAuthUserRecords(): Promise<Record<string, Record<string, unknown>>> {
  const snapshot = await get(authUsersRef());
  if (!snapshot.exists()) return {};
  return snapshot.val() as Record<string, Record<string, unknown>>;
}

export { firebaseConfig, auth, database, firebaseApp };
