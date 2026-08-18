import { create } from 'zustand';
import type { AppState, AuthUserRecord, Lang } from './types';
import { ensureBnTranslations, translate as translateKey } from '../i18n/translations';
import {
  authUserToCurrentProfile,
  onAuthSession,
  signOut as authSignOut,
} from '../services/auth-service';
import { isMongoDbBackend } from '../config/data-source';
import { IS_MONGO_BUILD } from '../config/dashboard-activity-mode';
import {
  createMongoBootstrapState,
  LOCAL_STORAGE_KEY,
  stripMongoAlertSeed,
} from './mongo-bootstrap-state';

let authListenerStarted = false;

function mergeMongoAppState(state: Partial<AppState> | null): AppState {
  const nextState = createMongoBootstrapState(state);
  return nextState;
}

function loadInitialState(): AppState {
  if (typeof window === 'undefined') return mergeMongoAppState(null);
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (isMongoDbBackend()) {
      const base = stripMongoAlertSeed(mergeMongoAppState(null));
      if (parsed?.lang) base.lang = parsed.lang;
      if (typeof parsed?.sidebarCollapsed === 'boolean') {
        base.sidebarCollapsed = parsed.sidebarCollapsed;
      }
      return base;
    }
    // Local/firebase demo mode — lazy module keeps CRM/recipes/default-state out of Mongo bundle.
    return mergeMongoAppState(parsed);
  } catch {
    return mergeMongoAppState(null);
  }
}

async function hydrateLocalFromStorage(): Promise<AppState> {
  const { hydrateLocalAppState, LOCAL_STORAGE_KEY: localKey } = await import('./app-store-local-hydrate');
  try {
    const raw = localStorage.getItem(localKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return hydrateLocalAppState(parsed);
  } catch {
    return hydrateLocalAppState(null);
  }
}

export function translate(key: string, vars?: Record<string, string | number>, lang?: Lang): string {
  return translateKey(key, vars, lang ?? 'en');
}

function createT(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => translateKey(key, vars, lang);
}

function applyLanguageDom(lang: Lang) {
  document.documentElement.lang = lang === 'bn' ? 'bn' : 'en-GB';
  document.body.classList.toggle('lang-bn', lang === 'bn');
  window.dispatchEvent(new CustomEvent('hookerp:language-changed', { detail: { lang } }));
}

interface AppStore {
  appState: AppState;
  authUser: AuthUserRecord | null;
  authReady: boolean;
  ready: boolean;
  hydrated: boolean;
  apiDataReady: boolean;
  lastSyncedState: string;
  ignoreRemoteEcho: boolean;
  remoteListenerStarted: boolean;
  setHydrated: () => void;
  initFromStorage: () => void;
  startSync: () => Promise<void>;
  startAuthListener: () => void;
  applyAuthSession: (authUser: AuthUserRecord | null) => void;
  saveAppState: (options?: { immediate?: boolean }) => void;
  recordAuditEvent: (payload: Parameters<typeof import('../services/audit-log-service').logSystemAudit>[1]) => void;
  replaceAppState: (next: Partial<AppState>) => void;
  setApiDataReady: (ready: boolean) => void;
  setLoggedIn: (value: boolean) => void;
  logout: () => Promise<void>;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  toggleLanguage: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const SAVE_DEBOUNCE_MS = 500;
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function flushPersistedAppState(
  get: () => AppStore,
  set: (partial: Partial<AppStore>) => void,
) {
  const { appState, ignoreRemoteEcho, lastSyncedState, remoteListenerStarted } = get();

  if (isMongoDbBackend()) {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          lang: appState.lang,
          sidebarCollapsed: appState.sidebarCollapsed,
        }),
      );
    } catch (error) {
      console.warn('localStorage save failed', error);
    }
    return;
  }

  const serialized = JSON.stringify(appState);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
  } catch (error) {
    console.warn('localStorage save failed', error);
  }

  if (!remoteListenerStarted || ignoreRemoteEcho || serialized === lastSyncedState) {
    set({ lastSyncedState: serialized });
    return;
  }

  set({ lastSyncedState: serialized });
}

const initialAppState = createMongoBootstrapState();

export const useAppStore = create<AppStore>((set, get) => ({
  appState: initialAppState,
  authUser: null,
  authReady: false,
  ready: false,
  hydrated: false,
  apiDataReady: !isMongoDbBackend(),
  lastSyncedState: '',
  ignoreRemoteEcho: false,
  remoteListenerStarted: false,
  mobileSidebarOpen: false,
  t: createT('en'),

  setHydrated: () => {
    if (IS_MONGO_BUILD || isMongoDbBackend()) {
      const appState = loadInitialState();
      appState.isLoggedIn = false;
      const lang = (appState.lang ?? 'en') as Lang;
      set({
        appState,
        hydrated: true,
        ready: true,
        apiDataReady: !isMongoDbBackend(),
        lastSyncedState: JSON.stringify(appState),
        t: createT(lang),
      });
      if (lang === 'bn') {
        void ensureBnTranslations().then(() => {
          set((s) => ({ t: createT((s.appState.lang ?? 'bn') as Lang) }));
        });
      }
      return;
    }

    void hydrateLocalFromStorage().then((appState) => {
      appState.isLoggedIn = false;
      const lang = (appState.lang ?? 'en') as Lang;
      set({
        appState,
        hydrated: true,
        ready: true,
        apiDataReady: false,
        lastSyncedState: JSON.stringify(appState),
        t: createT(lang),
      });
      if (lang === 'bn') {
        void ensureBnTranslations().then(() => {
          set((s) => ({ t: createT((s.appState.lang ?? 'bn') as Lang) }));
        });
      }
    });
  },

  initFromStorage: () => {
    if (get().hydrated) return;
    get().setHydrated();
  },

  applyAuthSession: (authUser) => {
    set((s) => {
      const next = { ...s.appState, isLoggedIn: Boolean(authUser) };
      if (authUser) {
        next.currentUser = {
          ...s.appState.currentUser,
          ...authUserToCurrentProfile(authUser),
        };
      }
      return { authUser, authReady: true, appState: next };
    });
    get().saveAppState({ immediate: true });
  },

  startAuthListener: () => {
    if (typeof window === 'undefined' || authListenerStarted) return;
    authListenerStarted = true;
    onAuthSession((session) => {
      get().applyAuthSession(session?.authUser ?? null);
    });
  },

  startSync: () =>
    new Promise((resolve) => {
      const state = get();
      if (state.remoteListenerStarted) {
        resolve();
        return;
      }
      set({ remoteListenerStarted: true, ready: true });

      if (isMongoDbBackend()) {
        resolve();
        return;
      }

      resolve();
    }),

  saveAppState: (options) => {
    const flush = () => {
      if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer);
        saveDebounceTimer = null;
      }
      flushPersistedAppState(get, set);
    };

    if (options?.immediate) {
      flush();
      return;
    }

    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(flush, SAVE_DEBOUNCE_MS);
  },

  recordAuditEvent: (payload) => {
    const state = get().appState;
    void import('../services/audit-log-service').then(({ logSystemAudit }) => {
      const next = logSystemAudit(state, payload);
      set({
        appState: {
          ...get().appState,
          systemAuditLogsById: {
            ...(get().appState.systemAuditLogsById ?? {}),
            [next.id]: next,
          },
        },
      });
    });
  },

  replaceAppState: (next) => {
    const current = get().appState;
    if (IS_MONGO_BUILD || isMongoDbBackend()) {
      const hydrated = mergeMongoAppState({ ...current, ...next });
      hydrated.isLoggedIn = current.isLoggedIn;
      hydrated.sidebarCollapsed = current.sidebarCollapsed;
      const authUser = get().authUser;
      if (authUser) {
        hydrated.currentUser = {
          ...hydrated.currentUser,
          ...authUserToCurrentProfile(authUser),
        };
      }
      const lang = (hydrated.lang ?? 'en') as Lang;
      set({ appState: hydrated, t: createT(lang) });
      if (!isMongoDbBackend()) {
        get().saveAppState({ immediate: true });
      }
      return;
    }

    void import('./app-store-local-hydrate').then(({ hydrateLocalAppState }) => {
      const hydrated = hydrateLocalAppState({ ...current, ...next });
      hydrated.isLoggedIn = current.isLoggedIn;
      hydrated.sidebarCollapsed = current.sidebarCollapsed;
      const authUser = get().authUser;
      if (authUser) {
        hydrated.currentUser = {
          ...hydrated.currentUser,
          ...authUserToCurrentProfile(authUser),
        };
      }
      const lang = (hydrated.lang ?? 'en') as Lang;
      set({ appState: hydrated, t: createT(lang) });
      get().saveAppState({ immediate: true });
    });
  },

  setApiDataReady: (ready) => {
    set({ apiDataReady: ready });
  },

  setLoggedIn: (value) => {
    set((s) => ({ appState: { ...s.appState, isLoggedIn: value } }));
    get().saveAppState({ immediate: true });
  },

  logout: async () => {
    const prevUser = get().authUser;
    if (prevUser) {
      get().recordAuditEvent({
        action: 'LOGOUT',
        module: 'Auth',
        description: `Signed out (${prevUser.email})`,
        actorId: prevUser.uid,
        actorName: prevUser.name,
      });
    }
    try {
      await authSignOut();
    } catch {
      // still clear local session
    }
    get().applyAuthSession(null);
  },

  toggleSidebar: () => {
    set((s) => ({ appState: { ...s.appState, sidebarCollapsed: !s.appState.sidebarCollapsed } }));
    get().saveAppState();
  },

  setMobileSidebarOpen: (open) => {
    set({ mobileSidebarOpen: open });
  },

  toggleMobileSidebar: () => {
    set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen }));
  },

  toggleLanguage: () => {
    const nextLang: Lang = get().appState.lang === 'bn' ? 'en' : 'bn';
    set((s) => ({
      appState: { ...s.appState, lang: nextLang },
      t: createT(nextLang),
    }));
    get().saveAppState();

    if (typeof window === 'undefined') return;

    if (nextLang === 'bn') {
      applyLanguageDom('bn');
      void ensureBnTranslations().then(() => {
        set((s) => ({ t: createT((s.appState.lang ?? 'bn') as Lang) }));
      });
    } else {
      applyLanguageDom('en');
    }
  },
}));

export function useAppState() {
  return useAppStore((s) => s.appState);
}

export function useIsLoggedIn() {
  return useAppStore((s) => s.appState.isLoggedIn);
}

export function useAuthUser() {
  return useAppStore((s) => s.authUser);
}

export function useTranslation() {
  const lang = useAppStore((s) => s.appState.lang ?? 'en');
  const t = useAppStore((s) => s.t);
  return { lang, t };
}

export let appReadyPromise: Promise<void> = Promise.resolve();

export function bootstrapAppStore() {
  useAppStore.getState().startAuthListener();
  appReadyPromise = useAppStore.getState().startSync();
  return appReadyPromise;
}

if (typeof window !== 'undefined') {
  useAppStore.getState().initFromStorage();
  useAppStore.getState().startAuthListener();
  window.addEventListener('pagehide', () => {
    const store = useAppStore.getState();
    store.saveAppState({ immediate: true });
  });
}
