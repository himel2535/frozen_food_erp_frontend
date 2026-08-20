# Food Fun Agro Foods AI Coding Rules and Constraints

These instructions govern all future modifications to Food Fun Agro Foods to maintain UI consistency, codebase safety, and logical simplicity.

## Architecture (Next.js — `web/`)

The frontend is a **Next.js 16 App Router** app in [`web/`](web/). Run with `npm run dev` from repo root.

1. **Routing:** One route per module under `web/app/(tenant)/` — e.g. `/crm/leads`, `/sales/orders`.
2. **Layout shell:** React components in `web/components/layout/` (`Sidebar`, `Header`, `Footer`, `FormHeader`). Tenant shell is in `web/app/(tenant)/layout.tsx`.
3. **Never use popups/modals for primary data creation.** All creation or editing forms must reside inline on the same route.
4. **State:** Zustand store in `web/lib/state/app-store.ts` with Firebase RTDB + `localStorage` (`hookerp_auth_state`).
5. **No custom Node.js backend.** No API routes unless explicitly requested. Data is client-side.

## Inline Form Navigation Pattern

Use React `useState` to toggle between list and form views on the same page:

```tsx
'use client';
const [view, setView] = useState<'main' | 'form'>('main');
return view === 'main'
  ? <MainView onAdd={() => setView('form')} />
  : <FormView onBack={() => setView('main')} />;
```

Reuse `<FormHeader title="..." subtitle="..." onBack={() => setView('main')} />` from `web/components/layout/FormHeader.tsx`.

## Form Fields & UX Standards

1. **Low Cognitive Load Forms:**
   - Keep basic fields (Name, Status, Dates, core details) visible at all times.
   - Hide complex or secondary fields behind a collapsible toggle labelled **"Show Advanced Details"** (collapsed by default).

2. **Validation Safeguards:**
   - **Do not make email required.** It is optional by default.
   - Only make absolutely necessary fields `required` (e.g., Name, total value, or identifier SKU).

3. **Global Control / Reusability:**
   - Shared layout components → `web/components/layout/`
   - Shared state/helpers → `web/lib/state/`, `web/lib/services/`
   - Global styles → `web/styles/globals.css`
   - Module registry for generic list pages → `web/lib/modules/registry.ts`

## Adding a New Screen

1. Add route: `web/app/(tenant)/[module]/page.tsx`
2. Either register in `web/lib/modules/registry.ts` + use `ModulePage`, or create a dedicated component in `web/components/modules/`
3. Add nav entry in `web/lib/navigation/tenant-sidebar.ts` if needed
4. Run `node web/scripts/generate-ported-pages.mjs` when bulk-adding routes

## Interactive Elements & UX Standards

1. **Pointer Cursors:** All clickable elements must have `cursor: pointer`. Global rules live in `web/styles/globals.css`.

## Legacy URL Redirects

`web/next.config.ts` redirects old `/*.html` bookmarks to new App Router paths (e.g. `/crm-leads.html` → `/crm/leads`).
