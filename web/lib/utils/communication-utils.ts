/** Normalize phone to digits only (handles +880, spaces, dashes). */
export function normalizePhone(phone: string): string {
  return String(phone ?? '').replace(/\D/g, '');
}

/** Build tel: href for dialing. */
export function buildTelHref(phone: string): string {
  const digits = normalizePhone(phone);
  if (!digits) return '';
  return digits.startsWith('880') ? `tel:+${digits}` : `tel:${digits}`;
}

/** Build WhatsApp wa.me link. Bangladesh numbers: 880XXXXXXXXXX. */
export function buildWhatsAppHref(phone: string, message?: string): string {
  const digits = normalizePhone(phone);
  if (!digits) return '';
  let waNumber = digits;
  if (waNumber.startsWith('0')) waNumber = `880${waNumber.slice(1)}`;
  else if (!waNumber.startsWith('880') && waNumber.length <= 11) waNumber = `880${waNumber}`;
  const base = `https://wa.me/${waNumber}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

const DEFAULT_COLLECTION_MESSAGE =
  'Hello, regarding your outstanding balance with ToysFactory ERP. Please let us know when we can expect payment. Thank you.';

export function openPhoneCall(phone: string): boolean {
  const href = buildTelHref(phone);
  if (!href) return false;
  window.location.href = href;
  return true;
}

export function openWhatsApp(phone: string, message = DEFAULT_COLLECTION_MESSAGE): boolean {
  const href = buildWhatsAppHref(phone, message);
  if (!href) return false;
  window.open(href, '_blank', 'noopener,noreferrer');
  return true;
}

export function getCompanyInitials(company: string): string {
  return company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatActionTimeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatActionSchedule(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (isToday) return `Today • ${time}`;
  return d.toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDueMoneyDetailed(value: number): string {
  return `৳${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
