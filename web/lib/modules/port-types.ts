export type FieldType = 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'textarea';

export interface PortField {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  advanced?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface PortColumn {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

export interface PortFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface PortAdapter {
  list: (state: import('@/lib/state/types').AppState) => Array<Record<string, unknown>>;
  create?: (state: import('@/lib/state/types').AppState, payload: Record<string, unknown>) => { ok: boolean; error?: string };
  update?: (state: import('@/lib/state/types').AppState, id: string, payload: Record<string, unknown>) => { ok: boolean; error?: string };
  delete?: (state: import('@/lib/state/types').AppState, id: string) => { ok: boolean; error?: string };
  getInitialForm?: (state: import('@/lib/state/types').AppState) => Record<string, unknown>;
  mapRowToForm?: (row: Record<string, unknown>) => Record<string, unknown>;
}

export interface PortModuleConfig {
  id: string;
  title: string;
  subtitle: string;
  addLabel?: string;
  columns: PortColumn[];
  fields: PortField[];
  searchKeys?: string[];
  filters?: PortFilter[];
  idPrefix?: string;
  adapter: PortAdapter;
}
