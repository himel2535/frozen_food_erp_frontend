import { create } from 'zustand';
import { DEFAULT_STATE, LOCAL_STORAGE_KEY } from './default-state';
import type { AppState, AuthUserRecord, Lang } from './types';
import { ensureCrmState } from '../services/crm-service';
import { ensureSettingsState } from '../services/settings-service';
import { ensureRecipesState } from '../services/recipes-service';
import { ensureBnTranslations, translate as translateKey } from '../i18n/translations';
import {
  authUserToCurrentProfile,
  onAuthSession,
  signOut as authSignOut,
} from '../services/auth-service';

type FirebaseApi = typeof import('../firebase');

let firebaseApi: FirebaseApi | null = null;
let authListenerStarted = false;

async function getFirebase(): Promise<FirebaseApi> {
  if (!firebaseApi) {
    firebaseApi = await import('../firebase');
  }
  return firebaseApi;
}

function hydrateAppState(state: Partial<AppState> | null): AppState {
  const nextState = { ...DEFAULT_STATE, ...(state ?? {}) } as AppState;
  if (!nextState.inventory) nextState.inventory = DEFAULT_STATE.inventory;
  if (!nextState.invoices) nextState.invoices = DEFAULT_STATE.invoices;
  if (!nextState.employees) nextState.employees = DEFAULT_STATE.employees;
  if (!nextState.attendance) nextState.attendance = DEFAULT_STATE.attendance;
  if (!nextState.purchases) nextState.purchases = DEFAULT_STATE.purchases;
  if (!nextState.accounting) nextState.accounting = DEFAULT_STATE.accounting;
  if (!nextState.cashboxEntries) nextState.cashboxEntries = DEFAULT_STATE.cashboxEntries;
  if (!nextState.dueEntries) nextState.dueEntries = DEFAULT_STATE.dueEntries;
  if (!nextState.purchasePayments) nextState.purchasePayments = DEFAULT_STATE.purchasePayments;
  if (!nextState.trialBalance) nextState.trialBalance = DEFAULT_STATE.trialBalance;
  if (!nextState.profitLoss) nextState.profitLoss = DEFAULT_STATE.profitLoss;
  if (!nextState.balanceSheet) nextState.balanceSheet = DEFAULT_STATE.balanceSheet;
  if (!nextState.salaryStructures) nextState.salaryStructures = DEFAULT_STATE.salaryStructures;
  if (!nextState.salarySheetEntries) nextState.salarySheetEntries = DEFAULT_STATE.salarySheetEntries;
  if (!nextState.payroll) nextState.payroll = DEFAULT_STATE.payroll;
  if (!nextState.projects) nextState.projects = DEFAULT_STATE.projects;
  if (!nextState.manufacturing) nextState.manufacturing = DEFAULT_STATE.manufacturing;
  if (!nextState.productionOrders) nextState.productionOrders = DEFAULT_STATE.productionOrders;
  if (!nextState.salesOrders) nextState.salesOrders = DEFAULT_STATE.salesOrders;
  if (!nextState.purchasesSuppliers) nextState.purchasesSuppliers = DEFAULT_STATE.purchasesSuppliers;
  if (!nextState.purchaseRmOrders) nextState.purchaseRmOrders = DEFAULT_STATE.purchaseRmOrders;
  if (!nextState.approvals) nextState.approvals = DEFAULT_STATE.approvals;
  if (!nextState.lang) nextState.lang = 'en';
  ensureCrmState(nextState);
  ensureSettingsState(nextState);
  ensureRecipesState(nextState);
  return nextState;
}

function loadInitialState(): AppState {
  if (typeof window === 'undefined') return hydrateAppState(null);
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return hydrateAppState(raw ? JSON.parse(raw) : null);
  } catch {
    return hydrateAppState(null);
  }
}

export function translate(key: string, vars?: Record<string, string | number>, lang?: Lang): string {
  return translateKey(key, vars, lang ?? 'en');
}

function createT(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => translateKey(key, vars, lang);
}

function applyLanguageDom(lang: Lang) {
  document.documentElement.lang = lang;
  document.body.classList.toggle('lang-bn', lang === 'bn');
  window.dispatchEvent(new CustomEvent('hookerp:language-changed', { detail: { lang } }));
}

interface AppStore {
  appState: AppState;
  authUser: AuthUserRecord | null;
  authReady: boolean;
  ready: boolean;
  hydrated: boolean;
  lastSyncedState: string;
  ignoreRemoteEcho: boolean;
  remoteListenerStarted: boolean;
  setHydrated: () => void;
  initFromStorage: () => void;
  startSync: () => Promise<void>;
  startAuthListener: () => void;
  applyAuthSession: (authUser: AuthUserRecord | null) => void;
  saveAppState: () => void;
  replaceAppState: (next: Partial<AppState>) => void;
  setLoggedIn: (value: boolean) => void;
  logout: () => Promise<void>;
  toggleSidebar: () => void;
  toggleLanguage: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const useAppStore = create<AppStore>((set, get) => ({
  appState: DEFAULT_STATE,
  authUser: null,
  authReady: false,
  ready: false,
  hydrated: false,
  lastSyncedState: '',
  ignoreRemoteEcho: false,
  remoteListenerStarted: false,
  t: createT(DEFAULT_STATE.lang ?? 'en'),

  setHydrated: () => {
    const appState = loadInitialState();
    // Do not trust stale local isLoggedIn — Firebase Auth is source of truth
    appState.isLoggedIn = false;
    const lang = (appState.lang ?? 'en') as Lang;
    set({
      appState,
      hydrated: true,
      ready: true,
      lastSyncedState: JSON.stringify(appState),
      t: createT(lang),
    });
    if (lang === 'bn') {
      void ensureBnTranslations().then(() => {
        set((s) => ({ t: createT((s.appState.lang ?? 'bn') as Lang) }));
      });
    }
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
    get().saveAppState();
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
      void getFirebase()
        .then(({ subscribeToRemoteAppState, saveRemoteAppState }) => {
          subscribeToRemoteAppState((remoteState) => {
            if (!remoteState) {
              const { appState } = get();
              const { isLoggedIn: _li, sidebarCollapsed: _sc, ...toSend } = appState;
              saveRemoteAppState(toSend as Record<string, unknown>).catch(() => {});
            } else {
              const current = get();
              const hydrated = hydrateAppState(remoteState as Partial<AppState>);
              const serialized = JSON.stringify(hydrated);
              if (serialized !== current.lastSyncedState) {
                const loggedIn = current.appState.isLoggedIn;
                const sidebar = current.appState.sidebarCollapsed;
                const authUser = current.authUser;
                hydrated.isLoggedIn = loggedIn;
                hydrated.sidebarCollapsed = sidebar;
                if (authUser) {
                  hydrated.currentUser = {
                    ...hydrated.currentUser,
                    ...authUserToCurrentProfile(authUser),
                  };
                }
                const lang = (hydrated.lang ?? 'en') as Lang;
                set({
                  ignoreRemoteEcho: true,
                  appState: hydrated,
                  lastSyncedState: serialized,
                  t: createT(lang),
                });
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(hydrated));
                set({ ignoreRemoteEcho: false });
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('hookerp:state-synced'));
                }
              }
            }
          });
          resolve();
        })
        .catch(() => {
          set({ remoteListenerStarted: false });
          resolve();
        });
    }),

  saveAppState: () => {
    set((s) => ({ appState: { ...s.appState } }));
    const { appState, ignoreRemoteEcho, lastSyncedState, remoteListenerStarted } = get();
    const serialized = JSON.stringify(appState);
    localStorage.setItem(LOCAL_STORAGE_KEY, serialized);

    if (!remoteListenerStarted || ignoreRemoteEcho || serialized === lastSyncedState) {
      set({ lastSyncedState: serialized });
      return;
    }

    set({ lastSyncedState: serialized });
    const { isLoggedIn: _li, sidebarCollapsed: _sc, ...toSend } = appState;
    void getFirebase().then(({ saveRemoteAppState }) => {
      saveRemoteAppState(toSend as Record<string, unknown>).catch((error) => {
        console.warn('Firebase sync failed', error);
      });
    });
  },

  replaceAppState: (next) => {
    const current = get().appState;
    const hydrated = hydrateAppState({ ...current, ...next });
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
    get().saveAppState();
  },

  setLoggedIn: (value) => {
    set((s) => ({ appState: { ...s.appState, isLoggedIn: value } }));
    get().saveAppState();
  },

  logout: async () => {
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
}
