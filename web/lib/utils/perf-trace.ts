/** PERF_TRACE — client-side performance marks for mutation tracing. */

export function isPerfTraceEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PERF_TRACE === '1';
}

export function perfMark(name: string): void {
  if (!isPerfTraceEnabled() || typeof performance === 'undefined') return;
  performance.mark(name);
}

export function perfMeasure(name: string, startMark: string, endMark?: string): number | null {
  if (!isPerfTraceEnabled() || typeof performance === 'undefined') return null;
  try {
    performance.measure(name, startMark, endMark);
    const entries = performance.getEntriesByName(name, 'measure');
    const last = entries[entries.length - 1];
    return last?.duration ?? null;
  } catch {
    return null;
  }
}

export type MutationTrace = {
  operation: string;
  marks: Record<string, number>;
  apiDurationMs?: number;
  perfTraceHeader?: string;
};

const mutationTraces: MutationTrace[] = [];

export function recordMutationTrace(trace: MutationTrace): void {
  if (!isPerfTraceEnabled()) return;
  mutationTraces.push(trace);
  if (mutationTraces.length > 50) mutationTraces.shift();
  if (typeof window !== 'undefined') {
    (window as Window & { __erpMutationTraces?: MutationTrace[] }).__erpMutationTraces = mutationTraces;
  }
}

export function getMutationTraces(): MutationTrace[] {
  return [...mutationTraces];
}

export function clearMutationTraces(): void {
  mutationTraces.length = 0;
}

/** Wrap a mutation: T0 submit → T2 API start → T14 response → T16 UI. */
export async function traceMutation<T>(
  operation: string,
  fn: () => Promise<T>,
  opts?: { onComplete?: () => void },
): Promise<T> {
  if (!isPerfTraceEnabled()) {
    const result = await fn();
    opts?.onComplete?.();
    return result;
  }

  const prefix = `erp:${operation}:${Date.now()}`;
  perfMark(`${prefix}:T0`);
  perfMark(`${prefix}:T1`);

  const apiStart = `${prefix}:T2`;
  perfMark(apiStart);

  const started = performance.now();
  try {
    const result = await fn();
    perfMark(`${prefix}:T14`);
    opts?.onComplete?.();
    perfMark(`${prefix}:T16`);

    const marks: Record<string, number> = {};
    for (const key of ['T0', 'T1', 'T2', 'T14', 'T16']) {
      const m = perfMeasure(`${prefix}:${key}:dur`, `${prefix}:T0`, `${prefix}:${key}`);
      if (m != null) marks[key] = Math.round(m);
    }
    marks.total = Math.round(performance.now() - started);

    recordMutationTrace({ operation, marks });
    return result;
  } catch (err) {
    perfMark(`${prefix}:T-error`);
    throw err;
  }
}
