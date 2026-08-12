'use client';

import { createContext, useContext } from 'react';
import type { ReportPayload, ReportType } from '@/lib/services/report-api-service';

const ReportInitialDataContext = createContext<Partial<Record<ReportType, ReportPayload>> | null>(null);

export function ReportInitialDataProvider({
  data,
  children,
}: {
  data?: Partial<Record<ReportType, ReportPayload>> | null;
  children: React.ReactNode;
}) {
  return (
    <ReportInitialDataContext.Provider value={data ?? null}>
      {children}
    </ReportInitialDataContext.Provider>
  );
}

export function useReportInitialData(type: ReportType): ReportPayload | undefined {
  const ctx = useContext(ReportInitialDataContext);
  return ctx?.[type];
}
