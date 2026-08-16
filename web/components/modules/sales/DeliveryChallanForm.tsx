'use client';

import { useRef, useState, useMemo, type FormEvent } from 'react';
import {
  Calendar,
  Eye,
  MapPin,
  Package,
  Phone,
  Printer,
  Send,
  Truck,
  User,
  Warehouse,
} from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { IconInput, IconSelect, IconTextarea } from '@/components/modules/crm/customer-form/IconField';
import { DcFormSectionCard } from '@/components/modules/sales/delivery-challan-form/DcFormSectionCard';
import { ChallanProductsTable } from '@/components/modules/sales/delivery-challan-form/ChallanProductsTable';
import {
  CHALLAN_STATUS_OPTIONS,
  DELIVERY_METHOD_OPTIONS,
  listChallanCatalog,
} from '@/components/modules/sales/delivery-challan-form/dc-form-options';
import {
  validateDeliveryChallanForm,
  type DeliveryChallanFieldError,
} from '@/components/modules/sales/delivery-challan-form/dc-form-validation';
import {
  EMPTY_DELIVERY_CHALLAN_FORM,
  summarizeChallanItems,
  type DeliveryChallanFormValues,
  type DeliveryChallanPayload,
} from '@/components/modules/sales/delivery-challan-form/dc-form-types';
import {
  DC_BTN_DRAFT,
  DC_BTN_GHOST,
  DC_BTN_OUTLINE,
  DC_BTN_PRIMARY,
  DC_CHALLAN_BADGE_CLS,
  DC_FIELD_GRID_CLS,
  DC_FOOTER_CLS,
  DC_INFO_BOX_CLS,
  DC_LABEL_CLS,
  DC_STATUS_CARD_CLS,
} from '@/components/modules/sales/delivery-challan-form/dc-form-styles';
import { DC_COMPANY_INFO } from '@/components/modules/sales/delivery-challan-form/dc-company-info';
import type { AppState } from '@/lib/state/types';
import { getSalesOrdersForCustomer } from '@/lib/services/sales-service';

export type DeliveryChallanSaveAction = 'draft' | 'dispatch' | 'print';

export function DeliveryChallanForm({
  mode,
  initialValues,
  challanPreviewId,
  appState,
  customers,
  warehouses,
  onCustomerChange,
  onOrderChange,
  onCancel,
  onSave,
  onPrint,
}: {
  mode: 'create' | 'edit';
  initialValues: DeliveryChallanFormValues;
  challanPreviewId: string;
  appState: AppState;
  customers: Array<{ id: string; name: string; company?: string }>;
  warehouses: Array<{ id: string; name: string }>;
  onCustomerChange: (customerId: string) => void;
  onOrderChange: (orderId: string, customerId: string) => void;
  onCancel: () => void;
  onSave: (payload: DeliveryChallanPayload, action: DeliveryChallanSaveAction) => void;
  onPrint: (payload: DeliveryChallanPayload) => void;
}) {
  const [form, setForm] = useState<DeliveryChallanFormValues>(initialValues);
  const [errors, setErrors] = useState<DeliveryChallanFieldError>({});
  const saveActionRef = useRef<DeliveryChallanSaveAction>('draft');
  const formRef = useRef<HTMLFormElement>(null);

  const updateForm = (patch: Partial<DeliveryChallanFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    const clearedKeys = Object.keys(patch) as Array<keyof DeliveryChallanFormValues>;
    if (!clearedKeys.length) return;
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      clearedKeys.forEach((key) => delete next[key]);
      if (patch.items) delete next.items;
      return next;
    });
  };

  const warehouseName = warehouses.find((w) => w.id === form.warehouseId)?.name ?? '';

  const toPayload = (statusOverride?: string): DeliveryChallanPayload => {
    const { totalItems, totalDeliverQty } = summarizeChallanItems(form.items);
    return {
      ...form,
      status: statusOverride ?? form.status,
      warehouseName,
      preparedBy: 'Sarah Connor',
      authorizedBy: DC_COMPANY_INFO.authorizedBy,
      totalItems,
      totalDeliverQty,
    };
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validateDeliveryChallanForm(form);
    const errorKeys = Object.keys(nextErrors);
    if (errorKeys.length > 0) {
      setErrors(nextErrors);
      const firstKey = errorKeys[0];
      document.getElementById(`dc-field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});
    const action = saveActionRef.current;
    saveActionRef.current = 'draft';
    const status = action === 'dispatch' ? 'dispatched' : form.status;
    const payload = toPayload(status);
    if (action === 'print') {
      onPrint(payload);
      return;
    }
    onSave(payload, action);
  };

  const statusMeta = CHALLAN_STATUS_OPTIONS.find((s) => s.value === form.status) ?? CHALLAN_STATUS_OPTIONS[0];

  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const ordersForCustomer = useMemo(() => {
    if (!form.customerId) return [];
    return getSalesOrdersForCustomer(
      appState,
      form.customerId,
      selectedCustomer?.name,
      selectedCustomer?.company,
    ).map((order) => ({
      id: String(order.id),
      label: String(order.id),
    }));
  }, [appState, form.customerId, selectedCustomer?.name, selectedCustomer?.company]);

  const productCatalog = useMemo(() => listChallanCatalog(appState), [appState]);

  return (
    <div className={MODULE_LIST_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 mb-3 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <FormHeader
            compact
            title={mode === 'edit' ? 'Edit Delivery Challan' : 'Create Delivery Challan'}
            subtitle="Create delivery challan for items from sales order."
            onBack={onCancel}
          />
          <div className={DC_CHALLAN_BADGE_CLS}>
            Challan No. {challanPreviewId}
            <span className="text-emerald-600/70 font-semibold">(Auto Generated)</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <DcFormSectionCard number={1} title="Challan Information">
            <div className={DC_FIELD_GRID_CLS}>
              <IconInput
                label="Date"
                icon={Calendar}
                required
                type="date"
                fieldId="dc-field-date"
                error={errors.date}
                value={form.date}
                onChange={(e) => updateForm({ date: e.target.value })}
              />
              <IconSelect
                label="Customer"
                icon={User}
                required
                fieldId="dc-field-customerId"
                error={errors.customerId}
                value={form.customerId}
                onChange={(e) => {
                  const customerId = e.target.value;
                  const customer = customers.find((c) => c.id === customerId);
                  const label = customer
                    ? `${customer.name}${customer.company ? ` (${customer.company})` : ''}`
                    : '';
                  updateForm({ customerId, customerName: label, orderId: '', items: [] });
                  onCustomerChange(customerId);
                }}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}{customer.company ? ` (${customer.company})` : ''}
                  </option>
                ))}
              </IconSelect>
              <div id="dc-field-orderId">
                <label className={DC_LABEL_CLS}>
                  Sales Order
                  <span className="text-rose-500 normal-case"> *</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      value={form.orderId}
                      onChange={(e) => {
                        updateForm({ orderId: e.target.value });
                        onOrderChange(e.target.value, form.customerId);
                      }}
                      className={`w-full pl-10 pr-4 py-2 rounded-xl border bg-white text-xs font-medium cursor-pointer appearance-none ${
                        errors.orderId ? 'border-rose-400' : 'border-slate-200/90'
                      }`}
                    >
                      <option value="">
                        {form.customerId && ordersForCustomer.length === 0
                          ? 'No sales orders found for this customer'
                          : 'Select sales order'}
                      </option>
                      {ordersForCustomer.map((order) => (
                        <option key={order.id} value={order.id}>{order.label}</option>
                      ))}
                    </select>
                  </div>
                  {form.orderId ? (
                    <button
                      type="button"
                      title="View order"
                      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shrink-0"
                      onClick={() => window.open(`/sales/orders`, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                {form.customerId && ordersForCustomer.length === 0 ? (
                  <p className="mt-1 text-[10px] font-semibold text-amber-700">
                    No sales orders linked to this customer yet. Create one under Sales → Sales Orders, or try Sobuz Hossain (Shoppy) for demo order SO-2026-07-0158.
                  </p>
                ) : null}
                {errors.orderId ? <p className="mt-1 text-[10px] font-semibold text-rose-600">{errors.orderId}</p> : null}
              </div>
            </div>
          </DcFormSectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <DcFormSectionCard number={2} title="Delivery Information">
              <div className="space-y-3">
                <IconTextarea
                  label="Delivery Address"
                  icon={MapPin}
                  required
                  fieldId="dc-field-deliveryAddress"
                  error={errors.deliveryAddress}
                  rows={3}
                  value={form.deliveryAddress}
                  onChange={(e) => updateForm({ deliveryAddress: e.target.value })}
                  placeholder="Enter full delivery address"
                />
                <IconInput
                  label="Contact Person"
                  icon={User}
                  value={form.contactPerson}
                  onChange={(e) => updateForm({ contactPerson: e.target.value })}
                  placeholder="Contact person name"
                />
                <IconInput
                  label="Phone"
                  icon={Phone}
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => updateForm({ contactPhone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                />
                <IconInput
                  label="Expected Delivery Date"
                  icon={Calendar}
                  type="date"
                  value={form.expectedDeliveryDate}
                  onChange={(e) => updateForm({ expectedDeliveryDate: e.target.value })}
                />
              </div>
            </DcFormSectionCard>

            <DcFormSectionCard number={3} title="Transport Information">
              <div className="space-y-3">
                <IconSelect
                  label="Delivery Method"
                  icon={Truck}
                  value={form.deliveryMethod}
                  onChange={(e) => updateForm({ deliveryMethod: e.target.value })}
                >
                  {DELIVERY_METHOD_OPTIONS.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </IconSelect>
                <IconInput
                  label="Vehicle No."
                  icon={Truck}
                  value={form.vehicleNo}
                  onChange={(e) => updateForm({ vehicleNo: e.target.value })}
                  placeholder="Enter vehicle number"
                />
                <IconInput
                  label="Driver Name"
                  icon={User}
                  value={form.driverName}
                  onChange={(e) => updateForm({ driverName: e.target.value })}
                  placeholder="Driver name"
                />
                <IconInput
                  label="Driver Phone"
                  icon={Phone}
                  type="tel"
                  value={form.driverPhone}
                  onChange={(e) => updateForm({ driverPhone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </DcFormSectionCard>
          </div>

          <DcFormSectionCard number={4} title="Products">
            <ChallanProductsTable
              items={form.items}
              catalog={productCatalog}
              onChange={(items) => updateForm({ items })}
              error={errors.items}
            />
          </DcFormSectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <DcFormSectionCard number={5} title="Additional Information">
              <div className="space-y-3">
                <IconSelect
                  label="Warehouse / Stock Location"
                  icon={Warehouse}
                  value={form.warehouseId}
                  onChange={(e) => updateForm({ warehouseId: e.target.value })}
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </IconSelect>
                <IconTextarea
                  label="Notes"
                  icon={Package}
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  placeholder="Add any notes about this delivery..."
                />
              </div>
            </DcFormSectionCard>

            <div className={DC_STATUS_CARD_CLS}>
              <div>
                <label className={DC_LABEL_CLS}>
                  Status
                  <span className="text-rose-500 normal-case"> *</span>
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${statusMeta.dotClass}`} />
                  <select
                    value={form.status}
                    onChange={(e) => updateForm({ status: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200/90 bg-white text-xs font-semibold cursor-pointer appearance-none"
                  >
                    {CHALLAN_STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={DC_INFO_BOX_CLS}>
                You can save as draft or mark as dispatched after confirming the delivery.
              </div>
            </div>
          </div>
        </div>

        <div className={DC_FOOTER_CLS}>
          <button
            type="submit"
            onClick={() => { saveActionRef.current = 'draft'; }}
            className={DC_BTN_DRAFT}
          >
            Save Draft
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button type="button" onClick={onCancel} className={DC_BTN_GHOST}>
              Cancel
            </button>
            <button
              type="submit"
              onClick={() => { saveActionRef.current = 'dispatch'; }}
              className={DC_BTN_PRIMARY}
            >
              <Send className="w-4 h-4" />
              Create &amp; Dispatch
            </button>
            <button
              type="submit"
              onClick={() => { saveActionRef.current = 'print'; }}
              className={DC_BTN_OUTLINE}
            >
              <Printer className="w-4 h-4" />
              Print Challan
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export { EMPTY_DELIVERY_CHALLAN_FORM };
export type { DeliveryChallanFormValues, DeliveryChallanPayload };
