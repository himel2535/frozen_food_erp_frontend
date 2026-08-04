export {
  DUE_BTN_RECEIVE,
  DUE_AVATAR_CLS,
  DUE_PANEL_CLS,
  DUE_TAB_ACTIVE,
  DUE_TAB_INACTIVE,
} from '../due-management/due-styles';

export const CUSTOMER_DUE_STATUS_BADGE: Record<string, string> = {
  overdue: 'bg-rose-100 text-rose-700 border-rose-200',
  due_soon: 'bg-amber-100 text-amber-700 border-amber-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  active: 'bg-sky-100 text-sky-700 border-sky-200',
};

export const COLLECTION_STATUS_BADGE: Record<string, string> = {
  promise_missed: 'bg-rose-100 text-rose-700 border-rose-200',
  payment_promise: 'bg-amber-100 text-amber-700 border-amber-200',
  follow_up_scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  reminder_sent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  none: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const CUSTOMER_DUE_AGING_BADGE: Record<string, string> = {
  overdue: 'bg-rose-50 text-rose-600 border-rose-200',
  due_soon: 'bg-amber-50 text-amber-600 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  active: 'bg-slate-50 text-slate-600 border-slate-200',
};

export const ROW_BG_BY_COLLECTION: Record<string, string> = {
  promise_missed: 'bg-rose-50/60',
  payment_promise: 'bg-amber-50/40',
  follow_up_scheduled: '',
  reminder_sent: '',
  none: '',
};

export function nextActionTimeCls(type?: string, isMissed?: boolean): string {
  if (isMissed || type === 'call') return 'text-rose-600 font-semibold';
  if (type === 'whatsapp') return 'text-emerald-600 font-semibold';
  if (type === 'follow_up') return 'text-amber-600 font-semibold';
  return 'text-slate-500';
}
