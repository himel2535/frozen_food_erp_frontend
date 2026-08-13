import { ReportInitialDataProvider } from '@/components/providers/ReportInitialDataProvider';
import { isMongoDbBackend } from '@/lib/config/data-source';
import type { ReportType, ReportPayload } from '@/lib/services/report-api-service';
import { serverApiRequest } from '@/lib/server/api-fetch';

export async function fetchServerReportData(
  type: ReportType,
  revalidateSeconds = 30,
): Promise<ReportPayload | null> {
  const result = await serverApiRequest<ReportPayload>(`/reports/${type}`, revalidateSeconds);
  return result?.data ?? null;
}
/** Server-side report prefetch — one aggregate API call instead of multi-module full lists. */
export async function prefetchReportPage(
  reportType: ReportType,
  children: React.ReactNode,
  revalidateSeconds = 30,
) {
  let payload = null;
  if (isMongoDbBackend()) {
    payload = await fetchServerReportData(reportType, revalidateSeconds);
  }

  return (
    <ReportInitialDataProvider data={payload ? { [reportType]: payload } : null}>
      {children}
    </ReportInitialDataProvider>
  );
}
