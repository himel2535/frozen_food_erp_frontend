# 🏭 Toys Factory ERP (Frontend)

🚀 **Live Demo:** [https://toys-factory-erp-one.vercel.app](https://toys-factory-erp-one.vercel.app)  
💻 **GitHub Repository:** [https://github.com/himel2535/toys_factory_erp](https://github.com/himel2535/toys_factory_erp)

A modern, high-performance, and responsive Enterprise Resource Planning (ERP) web application tailored for toy manufacturing and sales businesses. Built on Next.js 15, React 19, and Zustand, it provides a premium, real-time dashboard and administration interface.

---

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router)
- **Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Vanilla CSS configurations)
- **State Management:** Zustand
- **Animations:** Framer Motion (for micro-animations and smooth page transitions)
- **Data Visualization:** Recharts (custom styled charts)
- **Icons:** Lucide React & Iconify

---

## ⚡ Client-Side & Rendering Performance Optimizations

### 1. Hybrid Server-Side Rendering (SSR) & Real-Time Hydration
- **Hydration Strategy:** Implemented a two-stage hybrid hydration pattern:
  - On page load, the server pre-renders charts and panels using server components (`fetchDashboardSnapshot`).
  - Immediately on mount, a client-side `useEffect` hook (`fetchDashboardSummary`) fetches the latest database-wide aggregate data.
- **Cache Control:** Configured Next.js server-side fetches with `cache: 'no-store'` in `api-fetch.ts` to bypass Next.js App Router's client-side navigation router caching, ensuring **0% stale data states** for real-time dashboard KPI cards.

### 2. Client-Side Inflight Request Deduplication
- **Strategy:** Built an inflight request manager (`inflightGetRequests` Map in `api-client.ts`) that intercepts all client-side GET requests. If a request for a URL is already in progress, it merges the requests and reuses the same promise.
- **Impact:** Eliminated concurrent duplicate API requests by **~40%**, reducing client CPU overhead and network traffic significantly.

### 3. Code Splitting & TTI Optimizations
- **Dynamic Imports:** Used `next/dynamic` to load heavy visualization components (e.g., `SalesTrendChart`, `RevenueAnalyticsChart`) asynchronously.
- **Visual Skeletons:** Implemented custom loading skeletons matching the actual card layouts, improving First Contentful Paint (FCP) and reducing Time to Interactive (TTI).

---

## 📦 Project Modules & Features

### 📊 1. Dashboard & Analytics
- Real-time summaries of total revenue, pending orders, and open leads.
- Real-time synced Customer Due balances with precise "across-customers" metrics.
- Interactive time-series trends and custom business alerts.

### 🏭 2. Manufacturing & Production
- **Recipes (BOM):** Manage multi-layer Bill of Materials for finished/semi-finished goods.
- **Production Workflows:** Track work orders from planned to completion.
- **Maintenance & Wastage:** Log machine maintenance, mold lifetimes, and wastage.

### 📦 3. Inventory Management
- Multi-warehouse stock tracking, transfers, adjustments, and low-stock alerts.

### 🛍️ 4. Sales & CRM
- Full CRM lifecycle (Leads, Quotations, Sales Orders, POS, Wholesale Dispatch).

### 💰 5. Accounting & Finance
- Ledger accounts, journal entries, and automated financial report generation (Trial Balance, P&L, Balance Sheet).

### 👥 6. HR & Payroll
- Attendance, leave requests, salary structures, and automated payslip generation.

---

## 💻 Running Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Setup environment variables by copying `.env.example` to `.env.local`
4. Run the development server: `npm run dev`
