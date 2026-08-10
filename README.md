# Toys Factory ERP

A production-oriented **Enterprise Resource Planning (ERP)** web application built for manufacturing and trading businesses. The system covers sales, CRM, inventory, purchases, factory operations, accounting, HR, payroll, reporting, and administration — all in a unified Next.js workspace.

Originally migrated from a legacy multi-page HTML/Vite application, the project is now a **fully client-rendered Next.js App Router application** with real-time Firebase sync and a modular React component architecture.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Application Workflow](#application-workflow)
- [Module Coverage](#module-coverage)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment & Firebase Setup](#environment--firebase-setup)
- [Available Scripts](#available-scripts)
- [Development Conventions](#development-conventions)
- [Performance & UX Patterns](#performance--ux-patterns)
- [Legacy Compatibility](#legacy-compatibility)
- [Deployment](#deployment)
- [Roadmap & Known Limitations](#roadmap--known-limitations)
- [Documentation](#documentation)

---

## Overview

| Property | Detail |
|----------|--------|
| **Product name** | Toys Factory ERP (HookERP) |
| **Frontend** | Next.js 16 · React 19 · TypeScript |
| **Routes** | 100+ App Router pages under `web/app/` |
| **State model** | Single unified `appState` object (Zustand) |
| **Persistence** | `localStorage` + Firebase Realtime Database |
| **Auth** | Firebase Authentication (Email/Password) |
| **Backend** | No standalone Express server — minimal Next.js API routes for admin operations |

The application is designed for **low-friction inline workflows**: list views and create/edit forms live on the same route (no modal-based primary CRUD), with a persistent sidebar shell, KPI dashboards per module, and role-based section access.

---

## Tech Stack

### Core

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) | Routing, SSR shell, API routes |
| UI Library | [React 19](https://react.dev/) | Component model |
| Language | [TypeScript 5](https://www.typescriptlang.org/) | Type safety across services and UI |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling + design tokens |
| State | [Zustand 5](https://zustand.docs.pmnd.rs/) | Global app state and auth session |

### Data & Auth

| Service | Technology | Purpose |
|---------|------------|---------|
| Authentication | Firebase Auth | Login, signup, session management |
| Database | Firebase Realtime Database (RTDB) | Cloud sync of `toysfactory/appState` |
| Local cache | `localStorage` (`hookerp_auth_state`) | Offline-first hydration and fast reload |
| Admin SDK | `firebase-admin` | Server-side user/role management (API routes only) |

### UI & Assets

| Library | Purpose |
|---------|---------|
| `@iconify/react` | Flaticon-style (`flat-color-icons`) and Fluent color icons |
| `lucide-react` | Line icons for actions, navigation, and tables |
| `jspdf` + `jspdf-autotable` | PDF export (reports, production plans, invoices) |
| `qrcode.react` | QR code generation (POS / document flows) |

### Tooling

| Tool | Purpose |
|------|---------|
| ESLint + `eslint-config-next` | Linting |
| `@next/bundle-analyzer` | Bundle size analysis (`npm run analyze`) |
| Firebase CLI | RTDB rules deployment |

---

## Architecture

```mermaid
flowchart TB
  subgraph browser [Browser Client]
    NextApp[Next.js App Router]
    Components[React Module Components]
    Zustand[Zustand Store appState]
    LS[(localStorage)]
  end

  subgraph firebase [Firebase Cloud]
    Auth[Firebase Auth]
    RTDB[Realtime Database]
  end

  subgraph nextapi [Next.js API Routes]
    AdminUsers[/api/admin/users]
    AdminRoles[/api/admin/roles]
    DevBootstrap[/api/dev/bootstrap]
  end

  NextApp --> Components
  Components --> Zustand
  Zustand <-->|read/write| LS
  Zustand <-->|real-time sync| RTDB
  NextApp --> Auth
  AdminUsers --> RTDB
  AdminRoles --> RTDB
  DevBootstrap --> RTDB
```

### Key architectural decisions

1. **Client-side domain logic** — Business rules live in `web/lib/services/` (40+ service modules). Components call services; services mutate `appState`.
2. **Unified state document** — Inventory, sales, CRM, accounting, HR, and payroll data share one serializable state tree, synced to RTDB path `toysfactory/appState`.
3. **Debounced persistence** — State saves are debounced (500 ms) to reduce write churn; flushed on `pagehide` for reliability.
4. **Section-based access control** — User profiles in RTDB define `allowedSections`; sidebar and routes respect role permissions.
5. **No modal CRUD** — Primary create/edit flows use inline form views toggled with React state on the same page.

---

## Application Workflow

### 1. Boot & authentication

```
User opens app
  → Zustand hydrates from localStorage
  → Firebase Auth listener resolves session
  → RTDB subscription starts (authenticated users)
  → Remote appState merges into local store
  → Tenant shell renders (Sidebar + Header + Module content)
```

### 2. Typical module page flow

```
Route loads (e.g. /inventory/raw-materials)
  → ModulePageHeader resolves title, icon, actions
  → KPI section renders metrics from service layer
  → Filter bar + data table render filtered rows
  → User clicks "Add" → inline FormHeader + form (same route)
  → Submit → service mutates appState → debounced save → RTDB sync
  → User clicks "Back" → returns to list view
```

### 3. Data mutation pipeline

```
UI event
  → lib/services/*-service.ts (validation + business rules)
  → useAppStore.replaceAppState() / saveAppState()
  → localStorage (immediate)
  → Firebase RTDB (debounced, authenticated)
  → Other connected clients receive onValue update
```

### 4. Admin & user management

```
Main admin → Settings → Users / Roles
  → Next.js API routes (firebase-admin)
  → RTDB auth/users and auth/roles paths
  → Section access enforced on next login
```

---

## Module Coverage

The sidebar defines **14 top-level sections** with **70+ navigable screens**. Implementation depth varies by module:

### Fully implemented (dedicated React UI)

Rich KPI cards, filters, tables, inline forms, detail views, and domain-specific workflows.

| Section | Screens |
|---------|---------|
| **Dashboard** | KPI analytics, revenue charts, sales trend, top products, recent invoices, activity feed, business alerts |
| **Sales & CRM** | Customers, Leads (table + kanban), Deals pipeline, Complaints, Quotations, Orders, Deliveries, Invoices, POS |
| **Inventory** | Products, Raw Materials, Semi-Finished, Finished Goods, Stock In/Out, Transfers, Adjustments, Warehouses, Categories, Units |
| **Purchases** | Suppliers, Purchase Orders, Purchase RM, Recipes (BOM), production planning |
| **Accounting** | Cashbox, Due Management, Customer/Supplier Due, Trial Balance, P&L, Balance Sheet |
| **Reports** | Sales, Purchases, Inventory, Customers, Suppliers, Financial, HR (charts, tables, print/export) |
| **Settings** | Users, Roles, Company, Profile, Signatures, Alert Settings |
| **Payroll** | Salary Setup, Salary Sheet, Payments & Due, employee review flows |
| **HR** | Employee directory, detail pages, registration forms |

### Config-driven (functional baseline UI)

Uses `DedicatedModule` / `SalesDocumentModule` / `ReportModule` wrappers with port configs and legacy parity adapters. Core CRUD works; UI depth is lighter than dedicated modules.

| Section | Screens |
|---------|---------|
| **Factory** | Machine Maintenance, Mold Management, Wastage, Packing |
| **Purchases (partial)** | Goods Received, Vendor Bills, Payments, Returns |
| **HR (partial)** | Departments, Designations, Attendance, Leave |
| **Payroll (partial)** | Payroll Runs, Payslips |
| **Other** | Projects, Asset Management, Workflow Approvals, Super Admin |

> **Note:** All routes exist and are navigable. Dedicated modules represent the target UX standard; config-driven pages are scheduled for incremental porting.

---

## Project Structure

```
toys_factory_erp/
├── README.md                    # This file
├── package.json                 # Root scripts (delegates to web/)
├── firebase.json                # Firebase RTDB rules config
├── database.rules.json          # RTDB security rules
├── docs/
│   └── FIREBASE_AUTH_BOOTSTRAP.md
└── web/                         # Next.js application
    ├── app/
    │   ├── (tenant)/            # Authenticated routes (sidebar shell)
    │   │   ├── dashboard/
    │   │   ├── crm/
    │   │   ├── sales/
    │   │   ├── inventory/
    │   │   ├── purchases/
    │   │   ├── manufacturing/
    │   │   ├── accounting/
    │   │   ├── hrm/
    │   │   ├── payroll/
    │   │   ├── reports/
    │   │   └── settings/
    │   ├── login/
    │   └── api/                 # Admin + dev bootstrap routes
    ├── components/
    │   ├── layout/              # Sidebar, Header, Footer, ModuleShell
    │   ├── modules/             # Feature page components
    │   └── shared/              # KpiCards, AppTable, IconifyIcon, etc.
    ├── lib/
    │   ├── state/               # Zustand store, types, seeds
    │   ├── services/            # Domain logic (CRM, inventory, sales…)
    │   ├── navigation/          # Sidebar config, page meta, access control
    │   ├── modules/             # Port configs, legacy parity, page factories
    │   └── ui/                  # Icons, form styles, KPI mappings
    ├── styles/globals.css       # Global Tailwind + component tokens
    ├── public/images/           # Sidebar and branding assets
    └── scripts/                 # Route generation, admin seed, deploy helpers
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+
- A Firebase project with **Authentication** and **Realtime Database** enabled

### Install & run

```bash
# Clone the repository
git clone <repository-url>
cd toys_factory_erp

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **[http://localhost:3000/login](http://localhost:3000/login)**

### First-time login

1. Place Firebase service account JSON at `web/serviceAccount.json` (gitignored).
2. Ensure an Auth user exists (e.g. `admin@toysfactory.com`).
3. Seed the admin RTDB profile:

```bash
npm run seed:admin
```

4. Sign in with your Firebase Auth credentials.

Full bootstrap guide: [`docs/FIREBASE_AUTH_BOOTSTRAP.md`](docs/FIREBASE_AUTH_BOOTSTRAP.md)

---

## Environment & Firebase Setup

Create `web/.env.local` to override defaults (optional):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Firebase paths

| Path | Purpose |
|------|---------|
| `toysfactory/appState` | Full ERP application state |
| `toysfactory/auth/users/{uid}` | User profile, roles, section access |
| `toysfactory/auth/roles` | Role definitions |

### Deploy RTDB rules

```bash
npm run deploy:rules
```

Rules are defined in [`database.rules.json`](database.rules.json).

---

## Available Scripts

Run from the **repository root**:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (webpack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm run analyze` | Build with bundle analyzer |
| `npm run seed:admin` | Seed main admin RTDB profile |
| `npm run deploy:rules` | Deploy Firebase RTDB security rules |
| `npm run cleanup:orphan-auth` | Clean orphaned Auth records |

---

## Development Conventions

These rules are enforced across the codebase (see also [`AGENTS.md`](AGENTS.md)):

| Rule | Detail |
|------|--------|
| **Inline forms** | No modals for primary create/edit — use `useState<'main' \| 'form'>` toggle |
| **FormHeader** | Reuse `FormHeader` for back navigation on form views |
| **Advanced fields** | Hide secondary fields behind **"Show Advanced Details"** (collapsed by default) |
| **Email fields** | Optional by default — never required unless explicitly needed |
| **Shared components** | Layout → `components/layout/`, state → `lib/state/`, services → `lib/services/` |
| **New routes** | Add under `app/(tenant)/[module]/` + sidebar entry in `tenant-sidebar.ts` |
| **Pointer cursors** | All interactive elements use `cursor: pointer` (global CSS) |

### Adding a new screen

1. Create route: `web/app/(tenant)/[module]/page.tsx`
2. Build component in `web/components/modules/` or register in `lib/modules/`
3. Add sidebar entry in `web/lib/navigation/tenant-sidebar.ts`
4. Optionally run `node web/scripts/generate-routes.mjs` for bulk route generation

---

## Performance & UX Patterns

| Pattern | Implementation |
|---------|----------------|
| **Debounced saves** | 500 ms debounce on `saveAppState()` + flush on `pagehide` |
| **Icon preloading** | Module layouts preload Iconify icons; `IconifyIcon` shows skeleton until loaded |
| **KPI icon mapping** | Flaticon-style icons via `flat-color-icons:*` with per-row deduplication |
| **Navigation stability** | Fixed action column widths, scroll reset only on top-level module change |
| **Dashboard splitting** | Dynamic imports for heavy dashboard sub-panels |
| **Deferred metrics** | `useDeferredValue` for dashboard KPI calculations |

---

## Legacy Compatibility

The application was migrated from a static HTML multi-page app. Compatibility is preserved:

| Legacy | Modern equivalent |
|--------|-------------------|
| `inventory.html` | `/inventory/products` |
| `crm-leads.html` | `/crm/leads` |
| `sales-orders.html` | `/sales/orders` |
| *(90+ redirects)* | See `web/next.config.ts` |

- Same `localStorage` key: `hookerp_auth_state`
- Same RTDB path: `toysfactory/appState`
- No `.html` source files remain in the repository

---

## Deployment

### Build for production

```bash
npm run build
npm run start
```

Deploy the `web/` Next.js app to any Node-compatible host (Vercel, Railway, VPS, etc.).

### Production checklist

- [ ] Set `NEXT_PUBLIC_FIREBASE_*` env vars for production Firebase project
- [ ] Deploy RTDB rules: `npm run deploy:rules`
- [ ] Seed admin user profile via `npm run seed:admin`
- [ ] Enable Email/Password auth in Firebase Console
- [ ] Do **not** commit `web/serviceAccount.json`
- [ ] Restrict `/api/dev/bootstrap` to development environments only

---

## Roadmap & Known Limitations

| Area | Status |
|------|--------|
| Dedicated UI for Factory, partial HR/Payroll/Purchases | Planned incremental port |
| Standalone Express/PostgreSQL backend | Not implemented — Firebase RTDB is current data layer |
| Multi-tenant isolation | Single-tenant RTDB document model today |
| Server-side validation | Client-side services only; RTDB rules provide auth-level guards |
| Real-time conflict resolution | Last-write-wins on full `appState` document |

Replacing Firebase with a custom Express + SQL backend is **feasible** but requires redesigning the unified state model, refactoring 40+ service modules to API calls, and implementing auth/session middleware.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/FIREBASE_AUTH_BOOTSTRAP.md`](docs/FIREBASE_AUTH_BOOTSTRAP.md) | Firebase Auth + admin seed setup |
| [`AGENTS.md`](AGENTS.md) | AI/developer coding rules and constraints |
| [`web/README.md`](web/README.md) | Quick reference for the Next.js app folder |

---

## License

Private / proprietary. All rights reserved unless otherwise specified by the repository owner.
