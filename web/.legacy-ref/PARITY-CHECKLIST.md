# Inventory Legacy Parity Checklist

Side-by-side verification: legacy HTML (`toy-factory-erp/inventory-*.html`) vs Next.js (`/inventory/*`).

| Module | Route | Legacy JS | Dedicated Page | KPIs | Filters | Table Cols | Pagination | Form Basic/Advanced | Dynamic Selects | Computed | Workflow Actions | Status |
|--------|-------|-----------|----------------|------|---------|------------|------------|---------------------|-----------------|----------|------------------|--------|
| Products | `/inventory/products` | `inventory-products.js` | `ProductsPage.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| Raw Materials | `/inventory/raw-materials` | `inventory-raw-materials.js` | `RawMaterialsPage.tsx` | ✅ | ✅ search | ✅ 9 cols + low-stock badge | ✅ 15/page | ✅ + advanced | ✅ supplier | ✅ live total | edit | PASS |
| Categories | `/inventory/categories` | `inventory-categories.js` | `CategoriesPage.tsx` | ✅ 4 KPIs | ✅ status + type + search | ✅ 9 cols + hierarchy stats | — | ✅ + advanced | ✅ parent category | — | edit/delete | PASS |
| Units | `/inventory/units` | `inventory-units.js` | `UnitsPage.tsx` | ✅ 3 KPIs | ✅ status + search | ✅ 8 cols + conversion | — | ✅ + advanced | — | products using | edit/delete | PASS |
| Warehouses | `/inventory/warehouses` | `inventory-warehouses.js` | `WarehousesPage.tsx` | ✅ capacity/utilization | ✅ status + search | ✅ 11 cols + derived metrics | — | ✅ + advanced | — | utilization | edit/delete | PASS |
| Stock In | `/inventory/stock-in` | `inventory-stock-in.js` | `StockInPage.tsx` | ✅ 4 KPIs | ✅ status + warehouse + search | ✅ 10 cols | — | ✅ + advanced | ✅ product + warehouse | ✅ total value | ✅ Approve | PASS |
| Stock Out | `/inventory/stock-out` | `inventory-stock-out.js` | `StockOutPage.tsx` | ✅ 5 KPIs | ✅ status + warehouse + search | ✅ 11 cols | — | ✅ + advanced | ✅ product + warehouse | — | ✅ Complete | PASS |
| Transfers | `/inventory/transfers` | `inventory-transfers.js` | `TransfersPage.tsx` | ✅ 4 KPIs | ✅ status + search | ✅ 10 cols | — | ✅ + advanced | ✅ from/to warehouse | — | ✅ Complete | PASS |
| Adjustments | `/inventory/adjustments` | `inventory-adjustments.js` | `AdjustmentsPage.tsx` | ✅ 5 KPIs | ✅ status + type + search | ✅ 11 cols | — | ✅ + advanced | ✅ product + warehouse | ✅ net value KPI | ✅ Approve | PASS |

## Shared utilities (Phase 1)

- `web/components/modules/inventory/shared/inventory-ui.tsx` — list/form layout, pagination, filters
- `web/components/modules/inventory/shared/selects.tsx` — ProductSelect, WarehouseSelect, SupplierSelect, CategorySelect, UnitSelect

## Removed generic shells

- `web/lib/modules/inventory-configs.tsx` — deleted; routes no longer use `InventoryMasterModule`

## State keys aligned with legacy

- `rawMaterials` — separate RM model (not filtered `inventory`)
- `inventoryStockIn`, `inventoryStockOut`, `inventoryStockTransfers`, `inventoryStockAdjustments`

## Verification steps

1. Open legacy: `file:///.../toy-factory-erp/inventory-{module}.html`
2. Open Next: `http://localhost:3000/inventory/{route}`
3. Compare KPIs, filters, table columns, form fields, row actions
