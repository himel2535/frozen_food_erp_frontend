# Toys Factory ERP Project Architecture & Development Plan

This document outlines the core architecture, navigation hierarchy, file structure, and UX standards for Toys Factory ERP. Refer to this plan to implement, modify, or extend pages and components.

---

## 1. Application Architecture

Toys Factory ERP is built as a **Multi-Page Application (MPA)** using **Vite**.
- **Page Layout:** Each module is a standalone `.html` file.
- **Shared Components:** Components like `<app-sidebar>`, `<app-header>`, and `<app-footer>` are globally defined Web Components in [layout.js](file:///Users/safiulalom/SA%20Jony/Work/Hook%20Agency/Toys Factory ERP/layout.js).
- **Core State System:** Configured dynamically in [js/shared.js](file:///Users/safiulalom/SA%20Jony/Work/Hook%20Agency/Toys Factory ERP/js/shared.js). State is synchronized using `localStorage`.
- **Styling:** Defined in [index.css](file:///Users/safiulalom/SA%20Jony/Work/Hook%20Agency/Toys Factory ERP/index.css) using a clean slate of custom utility utilities, CSS variables, and transitions.

---

## 2. Navigation Hierarchy & File Mapping

Below is the complete menu, submenu tree, and mapping to HTML/JS files:

| Main Menu | Submenu / Section | View Type / Page | Target HTML File | Target JS Controller |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Overview Metrics | Summary Cards & Charts | `dashboard.html` | `js/dashboard.js` |
| **CRM** | Leads | Kanban / Tables / Inline Form | `crm.html` | `js/crm.js` |
| | Deals | Stage Progression | `crm.html` | `js/crm.js` |
| | Customers | List Profile & Activity logs | `crm.html` | `js/crm.js` |
| | Activities | Log & Tasks Timeline | `crm.html` | `js/crm.js` |
| **Sales** | Quotations | Listing & Form View | `sales-quotations.html` | `js/sales-quotations.js` |
| | Sales Orders | Order Processing | `sales-orders.html` | `js/sales-orders.js` |
| | Deliveries | Shipments Tracking | `sales-deliveries.html` | `js/sales-deliveries.js` |
| | Invoices | Billing & Invoicing | `sales-invoices.html` | `js/sales-invoices.js` |
| | Payments | Cash/Card Receipts | `sales-payments.html` | `js/sales-payments.js` |
| | Sales Returns | Credit Notes | `sales-returns.html` | `js/sales-returns.js` |
| **Inventory** | Products | SKU Master Records | `inventory.html` | `js/inventory.js` |
| | Categories | Product Classifications | `inventory.html` | `js/inventory.js` |
| | Warehouses | Location Control | `inventory.html` | `js/inventory.js` |
| | Stock In | Purchase Receipt Storage | `inventory.html` | `js/inventory.js` |
| | Stock Out | Sales Shipments Delivery | `inventory.html` | `js/inventory.js` |
| | Stock Transfers | Inter-warehouse Movement | `inventory.html` | `js/inventory.js` |
| | Stock Adjustments | Audits & Stock correction | `inventory.html` | `js/inventory.js` |
| **Purchases** | Suppliers | Supplier Directory | `purchases.html` | `js/purchases.js` |
| | Purchase Orders | PO Invoicing/Procurement | `purchases.html` | `js/purchases.js` |
| | Goods Received | Receiving Notes | `purchases.html` | `js/purchases.js` |
| | Vendor Bills | Payables Logging | `purchases.html` | `js/purchases.js` |
| | Payments | Disbursements Ledger | `purchases.html` | `js/purchases.js` |
| | Purchase Returns | Return Debit Notes | `purchases.html` | `js/purchases.js` |
| **Accounting** | Receivables | Customer Invoices Tracking | `accounting.html` | `js/accounting.js` |
| | Payables | Bills Settlement Tracker | `accounting.html` | `js/accounting.js` |
| | Journal Entries | Manual Adjustments | `accounting.html` | `js/accounting.js` |
| | General Ledger | Complete Accounts Book | `accounting.html` | `js/accounting.js` |
| | Trial Balance | Debits/Credits Summary | `accounting.html` | `js/accounting.js` |
| | Profit & Loss | Revenue & Expense Report | `accounting.html` | `js/accounting.js` |
| | Balance Sheet | Assets/Liabilities Statement | `accounting.html` | `js/accounting.js` |
| **HR** | Employees | Staff Profiles Directory | `hrm.html` | `js/hrm.js` |
| | Departments | Corp Segments List | `hrm.html` | `js/hrm.js` |
| | Designations | Role Titles Master | `hrm.html` | `js/hrm.js` |
| | Attendance | In/Out Check-ins Logs | `hrm.html` | `js/hrm.js` |
| | Leave Management | PTO Approvals System | `hrm.html` | `js/hrm.js` |
| **Payroll** | Salary Structures | Compensation Definitions | `payroll.html` | `js/payroll.js` |
| | Payroll Runs | Monthly Run Generator | `payroll.html` | `js/payroll.js` |
| | Payslips | Pay Slip Drawer & Archive | `payroll.html` | `js/payroll.js` |
| **Reports** | Sales Reports | Financial Analytics | `reports.html` | `js/reports.js` |
| | Purchase Reports | Supplier Spend Analysis | `reports.html` | `js/reports.js` |
| | Inventory Reports | Stock Levels valuation | `reports.html` | `js/reports.js` |
| | Customer Reports | Receivables Ageing | `reports.html` | `js/reports.js` |
| | Supplier Reports | Outstanding Aging Tracker | `reports.html` | `js/reports.js` |
| | Financial Reports | Ledger audit lists | `reports.html` | `js/reports.js` |
| | HR Reports | Payroll & Leave summary | `reports.html` | `js/reports.js` |
| **Administration** | Users | Core Account settings | `settings.html` | `js/settings.js` |
| | Roles | Security Access control | `settings.html` | `js/settings.js` |
| | Permissions | Feature Gate Definitions | `settings.html` | `js/settings.js` |
| | Company Settings | Basic Profile & Logos | `settings.html` | `js/settings.js` |

---

## 3. Core UX Standards (No Popups Pattern)

To maintain a clean, standardized, and user-friendly ERP environment:

1. **Popup-Free Inline Form Switching:**
   - Instead of modal/dialog popups, pages use two inline containers:
     - `[module]-main-view` for the data lists/tables.
     - `[module]-form-view` for creation or modification.
   - When users click "Add" or "Edit", the main view is hidden (`classList.add('hidden')`) and the form view is revealed.

2. **Form Header Custom Component:**
   - Every form header must use the `<app-form-header>` Web Component:
     ```html
     <app-form-header 
       title-id="crm-customer-modal-title" 
       title="Create Customer" 
       subtitle="Capture customer master data, legal profile, and assignment." 
       back-action="window.showCrmMainView()">
     </app-form-header>
     ```
   - This ensures a uniform look (back button on left, title, and subtitle) managed from a single file ([layout.js](file:///Users/safiulalom/SA%20Jony/Work/Hook Agency/Toys Factory ERP/layout.js)).

3. **Field Categorization (Basic vs. Advanced):**
   - **No emails required:** In any form (CRM, HRM, etc.), email inputs must be **optional** (do not use `required`).
   - Only expose critical fields in the primary view.
   - Secondary or technical inputs should be wrapped in an advanced section (`id="[module]-advanced-section" class="hidden"`) toggled with a **"Show Advanced Details"** link/button.
