import { apiRequest } from '@/lib/services/api-client';

export async function approveStockInApi(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest(`/stock-in/${id}/approve`, { method: 'POST', body: JSON.stringify({}) });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Approve failed' };
  }
}

export async function completeStockOutApi(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest(`/stock-out/${id}/complete`, { method: 'POST', body: JSON.stringify({}) });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Complete failed' };
  }
}

export async function completeStockTransferApi(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest(`/stock-transfers/${id}/complete`, { method: 'POST', body: JSON.stringify({}) });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Complete failed' };
  }
}

export async function approveStockAdjustmentApi(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest(`/stock-adjustments/${id}/approve`, { method: 'POST', body: JSON.stringify({}) });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Approve failed' };
  }
}
