# 🏭 Toys Factory ERP (Frontend)

🚀 **Live Demo:** [https://toys-factory-erp-one.vercel.app](https://toys-factory-erp-one.vercel.app)  
💻 **GitHub Repository:** [https://github.com/himel2535/toys_factory_erp](https://github.com/himel2535/toys_factory_erp)

A modern, comprehensive, and high-performance Enterprise Resource Planning (ERP) web application tailored for toy manufacturing and sales businesses.

---

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router)
- **Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Data Visualization:** Recharts
- **Icons:** Lucide React & Iconify

---

## ⚡ Performance Optimizations
This project implements several industry-standard optimizations to ensure a blazing-fast user experience:
- **Server-Side Rendering (SSR):** Leverages Next.js App Router for instant initial page loads and better SEO.
- **Zustand with LocalStorage Hydration:** Persists application state locally to avoid redundant API calls and provide a snappy, flicker-free UX.
- **Optimistic UI Updates:** Provides instant visual feedback on user actions before the server responds, ensuring a seamless experience.
- **Debounced Search & Pagination:** Reduces server load and network requests by limiting API calls during active user typing and loading data in chunks.
- **Code Splitting & Lazy Loading:** Optimizes Javascript bundle sizes by dynamically loading components only when they are needed on the screen.
- **Zero Runtime CSS:** Built entirely with Tailwind CSS, eliminating CSS-in-JS runtime overhead.

---

## 📦 Project Modules & Features

### 📊 1. Dashboard & Analytics
- Real-time summary of total revenue, pending orders, and open leads.
- Low stock alerts and production queue tracking.
- Interactive charts and KPI metrics.

### 🏭 2. Manufacturing & Production
- **Recipes (BOM):** Manage Bill of Materials for finished and semi-finished toys.
- **Production Planning:** Track work orders from queue to completion.
- **Machine Maintenance & Wastage:** Log machine downtimes and track production wastage.

### 📦 3. Inventory Management
- Multi-warehouse tracking for **Raw Materials**, **Semi-Finished Goods**, and **Finished Goods**.
- Stock adjustments, stock transfers, and automated low-stock alerts.

### 🛍️ 4. Sales & CRM
- Manage Leads, Quotations, and Customer profiles.
- Process Sales Orders, POS (Point of Sale) transactions, and Wholesale dispatch tracking.

### 🛒 5. Purchases & Suppliers
- Manage Supplier profiles and track payables.
- Generate Purchase Orders and process Goods Received Notes (GRN).

### 💰 6. Accounting & Finance
- Comprehensive General Ledger and Journal Entries.
- Generate Trial Balance, Profit & Loss Statements, and Balance Sheets.
- Track Accounts Receivable (Customer Due) and Accounts Payable (Supplier Due).

### 👥 7. HR & Payroll
- Complete employee database and departmental structures.
- Track daily attendance and manage leave applications.
- Dynamic Salary Structures and automated monthly payslip generation.

### ⚙️ 8. System Settings & Security
- **Role-Based Access Control (RBAC):** Granular permissions for different user roles (Admin, Manager, Staff).
- **Audit Logs:** Secure tracking of critical system actions.
- Company profile, document management, and digital signatures.

---

## 💻 Running Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Setup environment variables by copying `.env.example` to `.env.local`
4. Run the development server: `npm run dev`
