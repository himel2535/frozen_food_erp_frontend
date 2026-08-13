<div align="center">
  
  # 🏭 Toys Factory ERP
  **An Enterprise-Grade, Full-Stack Manufacturing & Operations Management System**

  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
  [![Express.js](https://img.shields.io/badge/Express.js-v5-gray?style=flat-square&logo=express)](https://expressjs.com/)

  [**Live Demo**](https://toys-factory-erp-one.vercel.app/) • 
  [**Frontend Repo**](https://github.com/himel2535/toys_factory_erp) • 
  [**Backend Repo**](https://github.com/himel2535/toys_factory_erp_backend)

</div>

<br />

## 📖 Overview
Toys Factory ERP is a highly scalable, full-stack Enterprise Resource Planning (ERP) web application designed specifically for the manufacturing sector. It digitizes the entire supply chain, from raw material procurement and custom manufacturing (Bill of Materials) to inventory management, sales, HR, and financial accounting.

Built with performance and scalability in mind, this application serves as a unified source of truth for business operations, replacing fragmented legacy systems.

---

## ⚡ Performance & Architectural Highlights (The "Wow" Factor)
To ensure **sub-100ms** UI interactions and support thousands of concurrent operations, the architecture implements several advanced software engineering patterns:

* **Dynamic Abstract CRUD Factory (Backend):** Instead of writing repetitive controllers for 30+ data modules, the backend utilizes a generic, highly abstracted CRUD Factory (`crudFactory.ts`). This generates robust REST APIs dynamically, ensuring DRY (Don't Repeat Yourself) principles and massive codebase maintainability.
* **Hybrid Database Strategy:** The data layer abstracts connections, allowing the system to toggle seamlessly between **MongoDB (via Express)** as the primary enterprise database, and **Firebase** as a lightweight local-parity fallback.
* **Aggressive Client-Side Caching (Frontend):** Powered by **Zustand** and custom SWR-like caching hooks (`usePaginatedApiResource`), list queries and relational data lookups are heavily cached in memory. The UI loads instantly without redundant network waterfalls.
* **Multi-Step Complex State Management:** Features like the "Project Setup Wizard" maintain complex, deeply nested state (Products -> BOM/Recipes -> Tasks -> Deadlines) entirely in the client-side memory before performing a single, optimized transactional commit to the database.

---

## 🔄 Core Business Workflow
The ERP is structured to reflect real-world manufacturing pipelines. Here is the primary data flow:

1. **Procurement & Inventory:** Raw materials are ordered via *Purchase Orders (PO)* and received into Warehouses. Multi-tier inventory tracks Raw Materials, Semi-Finished, and Finished Goods separately.
2. **Projects & Manufacturing:** A customer places an order. A *Project* is created. The *Bill of Materials (BOM) / Recipe* automatically allocates raw materials required to manufacture the toys. 
3. **Production Planning:** *Production Orders* are assigned to staff with strict milestones and deadlines tracked via a kanban/todo system.
4. **Sales & CRM:** Once manufactured, goods are dispatched via *Delivery Challans* and invoiced. The Point of Sale (POS) module handles direct walk-in sales.
5. **Accounting & HR:** Every transaction dynamically generates *Journal Entries*, updating the *General Ledger* and *Trial Balance*. Simultaneously, employee attendance and *Payroll* are calculated in real-time.

---

## 🛠️ Technology Stack

### Frontend (Client)
* **Framework:** Next.js 16 (App Router), React 19
* **Language:** TypeScript
* **Styling:** Tailwind CSS v4 (with PostCSS)
* **State Management:** Zustand (for global state & memory caching)
* **Authentication:** Firebase Auth
* **Utilities:** `jsPDF` / `jspdf-autotable` (PDF Reports), `qrcode.react` (Barcode/QR integration), Lucide React (Icons).

### Backend (Server)
* **Runtime:** Node.js (v20+)
* **Framework:** Express.js v5 (Fast, minimal routing)
* **Database:** MongoDB (Atlas Cloud) with Mongoose v8 ORM
* **Performance:** Redis (Server-side caching for heavy analytical queries)
* **Security & Middleware:** Helmet, CORS, Compression, Morgan (Logging)

---

## 📦 Key Modules

* **🏭 Factory & Production:** Projects/Custom Orders, BOM/Recipes, Production Planning, Machine Maintenance, Molds, Wastage.
* **📦 Inventory:** Multi-warehouse tracking, Stock In/Out, Adjustments, Transfers.
* **🤝 Sales & CRM:** Leads, Deals, Quotations, Orders, Deliveries, Invoices, POS, Complaints.
* **🛒 Procurement:** Suppliers, Purchase Orders, Goods Received (GRN), Vendor Bills.
* **💼 HR & Payroll:** Employee Management, Attendance, Leave, Salary Structures, Monthly Payslips.
* **📊 Accounts:** General Ledger, Dues Management, Cashbox, Profit & Loss, Balance Sheet.
* **⚙️ Admin & Security:** RBAC (Role-Based Access Control), Workflow Approvals, Audit Logs.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20
- MongoDB instance (Atlas or Local)
- Firebase Project (for Auth credentials)

### Installation

1. **Clone the repositories:**
   ```bash
   # Clone Frontend
   git clone https://github.com/himel2535/toys_factory_erp.git
   
   # Clone Backend
   git clone https://github.com/himel2535/toys_factory_erp_backend.git
   ```

2. **Setup Backend:**
   ```bash
   cd toys_factory_erp_backend
   npm install
   # Configure your .env file with MONGO_URI
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd toys_factory_erp
   npm install
   # Configure your .env.local file with Firebase keys and NEXT_PUBLIC_API_URL
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

<div align="center">
  <i>Engineered with clean code, scalability, and performance at its core.</i>
</div>
