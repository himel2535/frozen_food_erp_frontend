import type { AppState } from '@/lib/state/types';
import { listFromState, createInState, updateInState, deleteFromState, formatCurrency } from '@/lib/services/domain-service';

type Row = Record<string, unknown>;

export function listProductionOrders(state: AppState) {
  return listFromState(state, 'productionOrders');
}

export function listMachineMaintenance(state: AppState) {
  return listFromState(state, 'machineMaintenance');
}

export function listMolds(state: AppState) {
  return listFromState(state, 'molds');
}

export function listWastage(state: AppState) {
  return listFromState(state, 'wastage');
}

export function listPacking(state: AppState) {
  return listFromState(state, 'packing');
}

export function createProductionOrder(state: AppState, payload: Row) {
  return createInState(state, 'productionOrders', {
    ...payload,
    plannedQuantity: Number(payload.plannedQuantity ?? payload.qty ?? 0),
    actualQuantity: Number(payload.actualQuantity ?? 0),
    status: payload.status ?? 'Planned',
  }, 'PROD');
}

export function updateProductionOrder(state: AppState, id: string, payload: Row) {
  return updateInState(state, 'productionOrders', id, payload);
}

export function deleteProductionOrder(state: AppState, id: string) {
  return deleteFromState(state, 'productionOrders', id);
}

export function startProductionOrder(state: AppState, id: string) {
  const rows = listProductionOrders(state);
  const record = rows.find((r) => String(r.id) === id);
  if (!record || record.status !== 'Planned') return { ok: false, error: 'Only planned orders can be started' };
  return updateInState(state, 'productionOrders', id, { status: 'In Progress', startDate: new Date().toISOString().split('T')[0] });
}

export function completeProductionOrder(state: AppState, id: string) {
  const rows = listProductionOrders(state);
  const record = rows.find((r) => String(r.id) === id);
  if (!record || record.status !== 'In Progress') return { ok: false, error: 'Only in-progress orders can be completed' };
  return updateInState(state, 'productionOrders', id, {
    status: 'Completed',
    actualQuantity: Number(record.plannedQuantity ?? record.qty ?? 0),
    endDate: new Date().toISOString().split('T')[0],
  });
}

export function crudFactory(stateKey: string, prefix: string) {
  return {
    list: (state: AppState) => listFromState(state, stateKey),
    create: (state: AppState, payload: Row) => createInState(state, stateKey, payload, prefix),
    update: (state: AppState, id: string, payload: Row) => updateInState(state, stateKey, id, payload),
    delete: (state: AppState, id: string) => deleteFromState(state, stateKey, id),
  };
}

export { formatCurrency as formatMoney };
