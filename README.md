# Toys Factory ERP

Toys Factory ERP is a modern, light-themed multi-tenant enterprise ERP SaaS platform built for high-growth business environments. It features a desktop-first design with a dark sidebar, modern glassmorphism details, and unified client-side hashless routing.

## 🚀 Technology Stack

- **Core**: HTML5 Semantic markup & Vanilla ES6+ JavaScript.
- **Styling**: Tailwind CSS v4 with custom styling tokens (Primary: `#2563EB`, Success: `#22C55E`, Warning: `#F59E0B`, Danger: `#EF4444`, Dark: `#0F172A`, Background: `#F8FAFC`).
- **Icons**: Lucide Icons dynamic rendering engine.
- **Component Modularity**: Native Web Components (`Custom Elements`) for layouts.
- **Build System**: Vite for static asset bundling.

## 🛠️ Reusable Layout Architecture

The sidebar, header, and footer layout blocks are abstracted into standard custom web elements inside [layout.js](file:///Users/safiulalom/SA Jony/Work/Hook Agency/Toys Factory ERP/layout.js):
- `<app-sidebar>`: Renders sidebars for `tenant` or `super-admin` dashboards.
- `<app-header>`: Loads top navigation bars.
- `<app-footer>`: Displays standardized corporate statements.

All sidebar click actions and toggles use document-level **Event Delegation** in `app.js` and `super-admin.js`, preventing race conditions.

## 💼 Implemented Enterprise Modules

All 12 modules are fully integrated and linked:

1. **Dashboard** (`/dashboard`): Sales Trend chart & KPI statistics cards.
2. **CRM** (`/crm`): Customer registry database, visual profile drawers, and search queries.
3. **Sales** (`/sales`): Invoicing list, paid/due calculations, and export simulations.
4. **Inventory** (`/inventory`): SKU catalog, stock level warning triggers, and category filters.
5. **Purchases** (`/purchases`): Procurement PO lists, supplier stats, and received stock tracking.
6. **Accounting** (`/accounting`): Ledger ledger accounting debit/credit journals and cash balances.
7. **HRM** (`/hrm`): Employee directory, detailed profile drawers, and Check-In/Check-Out sheets.
8. **Payroll** (`/payroll`): Monthly salary disbursement logs, allowances, and deductions.
9. **Projects** (`/projects`): Task checklist timeline, deadline dates, progress bars.
10. **Manufacturing** (`/manufacturing`): Bill of Materials (BOM) work orders batch processing.
11. **Reports** (`/reports`): Financial statements summaries and data export triggers.
12. **Settings** (`/settings`): Corporate metadata form profiles and primary system currencies.

---

## 💻 Local Execution & Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Development Server**:
   ```bash
   npm run dev
   ```
3. **Compile Production Assets**:
   ```bash
   npm run build
   ```
