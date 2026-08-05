/** ISO yyyy-mm-dd → display dd/mm/yyyy */
export function isoToDisplayDate(iso: string): string {
  if (!iso) return '';
  const raw = iso.split('T')[0];
  const [y, m, d] = raw.split('-');
  if (!y || !m || !d) return '';
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}

/** Parse dd/mm/yyyy (or d/m/yyyy) → ISO yyyy-mm-dd. Returns null when invalid. */
export function displayDateToIso(display: string): string | null {
  const trimmed = display.trim();
  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parts = trimmed.split(/[/.\-]/).map((p) => p.trim());
  if (parts.length !== 3) return null;

  const [dRaw, mRaw, yRaw] = parts;
  const day = Number(dRaw);
  const month = Number(mRaw);
  let year = Number(yRaw);
  if (yRaw.length === 2) year = 2000 + year;

  if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12) return null;

  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return null;
  return iso;
}

export function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test((value ?? '').split('T')[0] ?? '');
}

/** Keys that typically hold date-only values in table rows. */
export function isLikelyDateColumnKey(key: string): boolean {
  const k = key.toLowerCase();
  if (k === 'date') return true;
  if (k.endsWith('date') && !k.endsWith('updated')) return true;
  return false;
}
