import { create } from 'zustand';
import { DEFAULT_STATE, LOCAL_STORAGE_KEY } from './default-state';
import type { AppState, Lang } from './types';
import { saveRemoteAppState, subscribeToRemoteAppState } from '../firebase';
import { ensureCrmState } from '../services/crm-service';
import { translations } from '../i18n/translations';

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
  const activeLang = lang ?? 'en';
  let text =
    (translations[activeLang] as Record<string, string>)?.[key] ??
    (translations.en as Record<string, string>)?.[key] ??
    key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
    });
  }
  return text;
}

interface AppStore {
  appState: AppState;
  ready: boolean;
  hydrated: boolean;
  lastSyncedState: string;
  ignoreRemoteEcho: boolean;
  remoteListenerStarted: boolean;
  setHydrated: () => void;
  initFromStorage: () => void;
  startSync: () => Promise<void>;
  saveAppState: () => void;
  replaceAppState: (next: Partial<AppState>) => void;
  setLoggedIn: (value: boolean) => void;
  toggleSidebar: () => void;
  toggleLanguage: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const useAppStore = create<AppStore>((set, get) => ({
  appState: DEFAULT_STATE,
  ready: false,
  hydrated: false,
  lastSyncedState: '',
  ignoreRemoteEcho: false,
  remoteListenerStarted: false,

  setHydrated: () => {
    const appState = loadInitialState();
    set({ appState, hydrated: true, lastSyncedState: JSON.stringify(appState) });
  },

  initFromStorage: () => {
    if (get().hydrated) return;
    get().setHydrated();
  },

  startSync: () =>
    new Promise((resolve) => {
      const state = get();
      if (state.remoteListenerStarted) {
        resolve();
        return;
      }
      set({ remoteListenerStarted: true });
      try {
        let resolved = false;
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
              hydrated.isLoggedIn = loggedIn;
              hydrated.sidebarCollapsed = sidebar;
              set({ ignoreRemoteEcho: true, appState: hydrated, lastSyncedState: serialized });
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(hydrated));
              set({ ignoreRemoteEcho: false });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('hookerp:state-synced'));
              }
            }
          }
          if (!resolved) {
            resolved = true;
            set({ ready: true });
            resolve();
          }
        });
      } catch {
        set({ remoteListenerStarted: false, ready: true });
        resolve();
      }
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
    saveRemoteAppState(toSend as Record<string, unknown>).catch((error) => {
      console.warn('Firebase sync failed', error);
    });
  },

  replaceAppState: (next) => {
    const current = get().appState;
    const hydrated = hydrateAppState({ ...current, ...next });
    hydrated.isLoggedIn = current.isLoggedIn;
    hydrated.sidebarCollapsed = current.sidebarCollapsed;
    set({ appState: hydrated });
    get().saveAppState();
  },

  setLoggedIn: (value) => {
    set((s) => ({ appState: { ...s.appState, isLoggedIn: value } }));
    get().saveAppState();
  },

  toggleSidebar: () => {
    set((s) => ({ appState: { ...s.appState, sidebarCollapsed: !s.appState.sidebarCollapsed } }));
    get().saveAppState();
  },

  toggleLanguage: () => {
    set((s) => {
      const lang: Lang = s.appState.lang === 'bn' ? 'en' : 'bn';
      return { appState: { ...s.appState, lang } };
    });
    get().saveAppState();
    if (typeof window !== 'undefined') {
      const lang = get().appState.lang;
      document.documentElement.lang = lang ?? 'en';
      document.body.classList.toggle('lang-bn', lang === 'bn');
      window.dispatchEvent(new CustomEvent('hookerp:language-changed', { detail: { lang } }));
    }
  },

  t: (key, vars) => translate(key, vars, get().appState.lang as Lang),
}));

export function useAppState() {
  return useAppStore((s) => s.appState);
}

export function useIsLoggedIn() {
  return useAppStore((s) => s.appState.isLoggedIn);
}

export let appReadyPromise: Promise<void> = Promise.resolve();

export function bootstrapAppStore() {
  const store = useAppStore.getState();
  store.initFromStorage();
  appReadyPromise = store.startSync();
  return appReadyPromise;
}
