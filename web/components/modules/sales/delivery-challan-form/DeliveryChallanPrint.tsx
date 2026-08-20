'use client';

import { Dancing_Script } from 'next/font/google';
import { QRCodeSVG } from 'qrcode.react';
import { formatAppDate } from '@/lib/i18n/locale-format';
import {
  Calendar,
  ClipboardList,
  Globe,
  Info,
  Mail,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
} from 'lucide-react';
import type { DeliveryChallanPayload } from '@/components/modules/sales/delivery-challan-form/dc-form-types';
import { summarizeChallanItems } from '@/components/modules/sales/delivery-challan-form/dc-form-types';
import { DC_COMPANY_INFO } from '@/components/modules/sales/delivery-challan-form/dc-company-info';
import { useAppStore } from '@/lib/state/app-store';
import { getCompanyProfile } from '@/lib/services/settings-service';
import { CHALLAN_STATUS_OPTIONS } from '@/components/modules/sales/delivery-challan-form/dc-form-options';
import {
  DC_PRINT_FOOTER,
  DC_PRINT_GRID_2,
  DC_PRINT_GRID_3,
  DC_PRINT_HEADER,
  DC_PRINT_ICON_CIRCLE,
  DC_PRINT_INFO_BANNER,
  DC_PRINT_META_LABEL,
  DC_PRINT_META_VALUE,
  DC_PRINT_META_VALUE_HIGHLIGHT,
  DC_PRINT_PAGE,
  DC_PRINT_PRODUCTS_HEADING,
  DC_PRINT_SECTION,
  DC_PRINT_SECTION_TITLE,
  DC_PRINT_SIGNATURE_BOX,
  DC_PRINT_SIGNATURE_LINE,
  DC_PRINT_STATUS_BADGE,
  DC_PRINT_TABLE,
  DC_PRINT_TABLE_FOOTER,
  DC_PRINT_TABLE_HEAD,
  DC_PRINT_TABLE_WRAP,
} from '@/components/modules/sales/delivery-challan-form/dc-print-styles';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

const signatureFont = Dancing_Script({ subsets: ['latin'], weight: ['600', '700'], preload: false });

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '—';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return formatAppDate(parsed, { day: '2-digit', month: 'short', year: 'numeric' });
}

function PrintSectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className={DC_PRINT_ICON_CIRCLE}>
      {children}
    </span>
  );
}

export function DeliveryChallanPrint({
  challanId,
  data,
}: {
  challanId: string;
  data: DeliveryChallanPayload;
}) {
  const { formatCount } = useLocaleFormat();
  const appState = useAppStore((s) => s.appState);
  const companyLogo = getCompanyProfile(appState).logoUrl || DC_COMPANY_INFO.logoUrl;
  const { totalItems, totalDeliverQty } = summarizeChallanItems(data.items);
  const activeItems = data.items.filter((item) => item.productName.trim());
  const statusLabel = CHALLAN_STATUS_OPTIONS.find((s) => s.value === data.status)?.label ?? data.status;
  const preparedBy = data.preparedBy || 'Sarah Connor';
  const authorizedBy = data.authorizedBy || DC_COMPANY_INFO.authorizedBy;
  const displayDate = formatDisplayDate(data.date);

  const signatureBlocks = [
    { title: 'Prepared By', name: preparedBy, signature: preparedBy, showDate: true },
    { title: 'Authorized By', name: authorizedBy, signature: authorizedBy, showDate: true },
    { title: 'Received By (Customer)', name: '', signature: '', showDate: false },
  ];

  return (
    <div className={DC_PRINT_PAGE}>
      <div className={DC_PRINT_HEADER}>
        <div className="space-y-2 max-w-[55%]">
          <div className="flex items-start gap-2.5">
            <img
              src={companyLogo}
              alt=""
              className="w-11 h-11 rounded-lg border border-slate-200 object-cover shrink-0"
            />
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Food Fun Agro Foods <span className="text-slate-400 font-bold">ERP</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-600 mt-0.5">{DC_COMPANY_INFO.tagline}</p>
              <p className="text-[9px] text-slate-500 leading-snug">{DC_COMPANY_INFO.description}</p>
            </div>
          </div>
          <div className="space-y-1 text-[9px] text-slate-600">
            <p className="flex items-start gap-1.5">
              <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-blue-600" />
              {DC_COMPANY_INFO.address}
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 shrink-0 text-blue-600" />
              {DC_COMPANY_INFO.phone}
            </p>
            <p className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 shrink-0 text-blue-600" />
              {DC_COMPANY_INFO.website}
            </p>
            <p className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 shrink-0 text-blue-600" />
              {DC_COMPANY_INFO.email}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <h2 className="text-xl font-extrabold tracking-wide text-blue-800 mb-2">DELIVERY CHALLAN</h2>
          <table className="ml-auto text-left text-[10px]">
            <tbody>
              <tr>
                <td className={DC_PRINT_META_LABEL}>Challan No.</td>
                <td className={DC_PRINT_META_VALUE_HIGHLIGHT}>{challanId}</td>
              </tr>
              <tr>
                <td className={DC_PRINT_META_LABEL}>Date</td>
                <td className={DC_PRINT_META_VALUE}>{displayDate}</td>
              </tr>
              <tr>
                <td className={DC_PRINT_META_LABEL}>Sales Order No.</td>
                <td className={DC_PRINT_META_VALUE}>{data.orderId || '—'}</td>
              </tr>
              <tr>
                <td className={DC_PRINT_META_LABEL}>Delivery Status</td>
                <td>
                  <span className={DC_PRINT_STATUS_BADGE}>{statusLabel}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={DC_PRINT_GRID_2}>
        <div className={DC_PRINT_SECTION}>
          <h3 className={DC_PRINT_SECTION_TITLE}>
            <PrintSectionIcon><User className="w-3.5 h-3.5 text-blue-600" /></PrintSectionIcon>
            Customer Information
          </h3>
          <div className="space-y-1 text-[10px]">
            <p><span className="font-bold text-slate-500">Customer Name:</span> {data.customerName || '—'}</p>
            <p><span className="font-bold text-slate-500">Contact Person:</span> {data.contactPerson || '—'}</p>
            <p><span className="font-bold text-slate-500">Phone:</span> {data.contactPhone || '—'}</p>
          </div>
        </div>

        <div className={DC_PRINT_SECTION}>
          <h3 className={DC_PRINT_SECTION_TITLE}>
            <PrintSectionIcon><MapPin className="w-3.5 h-3.5 text-blue-600" /></PrintSectionIcon>
            Delivery Address
          </h3>
          <p className="text-[10px] mb-1.5 leading-snug">{data.deliveryAddress || '—'}</p>
          <p className="flex items-center gap-1.5 text-[10px]">
            <Phone className="w-3 h-3 text-blue-600 shrink-0" />
            {data.contactPhone || '—'}
          </p>
          <p className="flex items-center gap-1.5 text-[10px] mt-1">
            <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
            Expected Delivery Date: {formatDisplayDate(data.expectedDeliveryDate)}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <h3 className={DC_PRINT_PRODUCTS_HEADING}>
          <PrintSectionIcon><Package className="w-3.5 h-3.5 text-blue-600" /></PrintSectionIcon>
          Products
        </h3>
        <div className={DC_PRINT_TABLE_WRAP}>
          <table className={DC_PRINT_TABLE}>
            <thead>
              <tr className={DC_PRINT_TABLE_HEAD}>
                <th className="px-2 py-1.5 text-left w-8">SL</th>
                <th className="px-2 py-1.5 text-left">Product</th>
                <th className="px-2 py-1.5 text-left">SKU / Code</th>
                <th className="px-2 py-1.5 text-right">Ordered Qty</th>
                <th className="px-2 py-1.5 text-right">Previously Delivered</th>
                <th className="px-2 py-1.5 text-right">Delivered Qty (This Time)</th>
                <th className="px-2 py-1.5 text-right">Remaining Qty</th>
                <th className="px-2 py-1.5 text-left">Unit</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item, index) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-2 py-1.5 font-bold text-slate-500">{index + 1}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={item.imageUrl || '/images/logo-toys.png'}
                        alt=""
                        className="w-6 h-6 rounded border border-slate-200 object-cover shrink-0"
                      />
                      <span className="font-semibold leading-tight">{item.productName}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 font-semibold">{item.sku}</td>
                  <td className="px-2 py-1.5 text-right">{formatCount(item.orderedQty)}</td>
                  <td className="px-2 py-1.5 text-right">{formatCount(item.previouslyDelivered)}</td>
                  <td className="px-2 py-1.5 text-right font-bold text-blue-700">{formatCount(item.deliverNow)}</td>
                  <td className="px-2 py-1.5 text-right font-bold text-emerald-600">{formatCount(item.remainingQty)}</td>
                  <td className="px-2 py-1.5">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={DC_PRINT_TABLE_FOOTER}>
            <span>Total Items: <strong>{totalItems}</strong></span>
            <span>
              Total Deliver Now Qty:{' '}
              <strong className="text-blue-700">{formatCount(totalDeliverQty)} Pcs</strong>
            </span>
          </div>
        </div>
      </div>

      <div className={DC_PRINT_GRID_2}>
        <div className={DC_PRINT_SECTION}>
          <h3 className={DC_PRINT_SECTION_TITLE}>
            <PrintSectionIcon><Truck className="w-3.5 h-3.5 text-blue-600" /></PrintSectionIcon>
            Transport Information
          </h3>
          <div className="space-y-1 text-[10px]">
            <p><span className="font-bold text-slate-500">Delivery Method:</span> {data.deliveryMethod || '—'}</p>
            <p><span className="font-bold text-slate-500">Vehicle No.:</span> {data.vehicleNo || '—'}</p>
            <p><span className="font-bold text-slate-500">Driver Name:</span> {data.driverName || '—'}</p>
            <p><span className="font-bold text-slate-500">Driver Phone:</span> {data.driverPhone || '—'}</p>
          </div>
        </div>

        <div className={DC_PRINT_SECTION}>
          <h3 className={DC_PRINT_SECTION_TITLE}>
            <PrintSectionIcon><ClipboardList className="w-3.5 h-3.5 text-blue-600" /></PrintSectionIcon>
            Other Information
          </h3>
          <div className="space-y-1 text-[10px]">
            <p><span className="font-bold text-slate-500">Warehouse / Stock Location:</span> {data.warehouseName || '—'}</p>
            <p><span className="font-bold text-slate-500">Prepared By:</span> {preparedBy}</p>
            <p><span className="font-bold text-slate-500">Notes:</span> {data.notes || '—'}</p>
          </div>
        </div>
      </div>

      <div className={DC_PRINT_GRID_3}>
        {signatureBlocks.map((block) => (
          <div key={block.title} className={DC_PRINT_SIGNATURE_BOX}>
            <p className="text-[10px] font-extrabold text-slate-700 mb-3">{block.title}</p>
            <div className={`${DC_PRINT_SIGNATURE_LINE} ${signatureFont.className}`}>
              {block.signature}
            </div>
            <p className="text-[10px] font-semibold">
              {block.name || 'Name: _______________'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Date: {block.showDate ? displayDate : '_______________'}
            </p>
          </div>
        ))}
      </div>

      <div className={DC_PRINT_FOOTER}>
        <div className={DC_PRINT_INFO_BANNER}>
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Please sign &amp; return this copy as an acknowledgement of the goods received in good condition. Thank you for your business!
        </div>
        <div className="shrink-0 p-1 border border-slate-200 rounded-lg bg-white">
          <QRCodeSVG value={challanId} size={64} level="M" includeMargin={false} />
        </div>
      </div>
    </div>
  );
}
