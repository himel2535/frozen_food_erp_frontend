import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBlF3L5TW1cP-_25S3T_A4CMeOaPc2oCmk',
  authDomain: 'aharbox-91135.firebaseapp.com',
  databaseURL: 'https://aharbox-91135-default-rtdb.firebaseio.com',
  projectId: 'aharbox-91135',
  storageBucket: 'aharbox-91135.firebasestorage.app',
  messagingSenderId: '713385684302',
  appId: '1:713385684302:web:ae97d870a997fda36e821f',
  measurementId: 'G-37RGXSN8LF',
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp, firebaseConfig.databaseURL);
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

export { firebaseConfig };
