# Legacy → Next.js Parity Mapping

**Legacy source:** `C:\Users\sdfsa\Desktop\toy-factory-erp` (73 HTML + 73 JS modules)  
**Next.js target:** `web/` (73 routes under `app/(tenant)/`)

## Summary

| Status | Count | Description |
|--------|-------|-------------|
| FULL | 7 | Dedicated pages: Dashboard, CRM×4, Products, POS |
| PARTIAL+ | 8 | InventoryMasterModule (inventory sub-pages) |
| PARTIAL+ | 7 | SalesDocumentModule (sales docs) |
| LEGACY_PARITY | ~51 | `legacy-parity-configs.ts` — legacy-matched fields, KPIs, columns |
| REPORT | 7 | `ReportModule` — read-only filters + KPIs (no CRUD) |

## Module Map

| Legacy JS | Next Route | Component |
|-----------|------------|-----------|
| `js/dashboard.js` | `/dashboard` | `DashboardView.tsx` |
| `js/crm-customers.js` | `/crm/customers` | `CustomersPage.tsx` |
| `js/crm-leads.js` | `/crm/leads` | `LeadsPage.tsx` |
| `js/crm-deals.js` | `/crm/deals` | `DealsPage.tsx` |
| `js/crm-complaints.js` | `/crm/complaints` | `ComplaintsPage.tsx` |
| `js/crm-activities.js` | `/crm/activities` | `legacy-parity-configs` |
| `js/sales-*.js` (7 docs) | `/sales/*` | `SalesDocumentModule` + configs |
| `js/sales-pos.js` | `/sales/pos` | `PosPage.tsx` |
| `js/sales-wholesale.js` | `/sales/wholesale` | `legacy-parity-configs` |
| `js/inventory-products.js` | `/inventory/products` | `ProductsPage.tsx` |
| `js/inventory-*.js` (8 others) | `/inventory/*` | `inventory-configs.tsx` |
| `js/purchases-*.js` (7) | `/purchases/*` | `legacy-parity-configs` + `purchases-service.ts` |
| `js/manufacturing-*.js` (6) | `/manufacturing/*` | `legacy-parity-configs` + `manufacturing-service.ts` |
| `js/accounting-*.js` (8) | `/accounting/*` | `legacy-parity-configs` + `accounting-service.ts` |
| `js/hrm-*.js` (5) | `/hrm/*` | `legacy-parity-configs` + `hrm-service.ts` |
| `js/payroll-*.js` (3) | `/payroll/*` | `legacy-parity-configs` |
| `js/reports-*.js` (7) | `/reports/*` | `report-configs.tsx` (read-only) |
| `js/settings-*.js` (7) | `/settings/*` | `legacy-parity-configs` |
| `js/projects.js` | `/projects` | `legacy-parity-configs` |
| `js/asset-management.js` | `/asset-management` | `legacy-parity-configs` |
| `js/notifications.js` | `/notifications` | `legacy-parity-configs` |

## Key Parity Features Restored

- **Purchase Orders:** 10 fields, 4 KPIs, 8 columns, Send/Receive/Cancel workflows + stock/ledger side effects
- **Journals:** 5 fields, 3 KPIs, auto-posts to general ledger
- **Reports:** Date/status filters, KPI metrics, read-only tables (legacy pattern)
- **HRM Employees:** 8 fields matching legacy form (basic + advanced)
- **All stub modules:** Expanded from 3-field generic to 5–10 legacy-matched fields with KPIs

## Gap Matrix Status: 73/73 routes covered
