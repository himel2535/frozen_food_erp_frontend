export type FollowUpContactOption = { value: string; label: string; primary?: boolean };

const FALLBACK_CONTACTS: Array<{ name: string; designation: string }> = [
  { name: 'Accounts Manager', designation: 'Accounts' },
  { name: 'Procurement Head', designation: 'Procurement' },
  { name: 'Director / Owner', designation: 'Management' },
];

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function formatLabel(name: string, designation?: string) {
  const trimmed = name.trim();
  if (!designation?.trim()) return trimmed;
  return `${trimmed} — ${designation.trim()}`;
}

export function buildFollowUpContactOptions(
  contacts: Array<{ name?: string; designation?: string; primary?: boolean }>,
  customerName: string,
): FollowUpContactOption[] {
  const seen = new Set<string>();
  const options: FollowUpContactOption[] = [];

  const addOption = (name: string, designation?: string, primary?: boolean) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = normalizeName(trimmed);
    if (seen.has(key)) return;
    seen.add(key);
    options.push({
      value: trimmed,
      label: formatLabel(trimmed, designation),
      primary: Boolean(primary),
    });
  };

  contacts.forEach((contact) => {
    addOption(String(contact.name ?? ''), contact.designation, contact.primary);
  });

  if (customerName.trim()) {
    addOption(customerName);
  }

  if (options.length < 3) {
    FALLBACK_CONTACTS.forEach(({ name, designation }) => addOption(name, designation));
  }

  options.sort((a, b) => {
    if (a.primary && !b.primary) return -1;
    if (!a.primary && b.primary) return 1;
    return a.label.localeCompare(b.label);
  });

  return options;
}

export function defaultFollowUpContactPerson(options: FollowUpContactOption[]): string {
  return options.find((opt) => opt.primary)?.value ?? options[0]?.value ?? '';
}
