---
name: hookerp-guide
description: Specific development guidelines for creating, modifying, and structuring screens in Toys Factory ERP. Includes routing, layout parameters, form design, and dynamic rendering scripts.
---

# Toys Factory ERP Development Skill

Use this skill when designing, building, or modifying views, navigation menus, and screens for Toys Factory ERP.

All frontend work lives in **`web/`** (Next.js App Router + TypeScript).

## Page Layout Template

Each module is a Next.js route under `web/app/(tenant)/`. The tenant layout injects sidebar and header automatically.

```tsx
// web/app/(tenant)/crm/leads/page.tsx
import { LeadsPage } from '@/components/modules/crm/LeadsPage';

export default function Page() {
  return <LeadsPage />;
}
```

Module component pattern (list + inline form):

```tsx
'use client';

import { useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';

export function ExampleModulePage() {
  const [view, setView] = useState<'main' | 'form'>('main');

  if (view === 'form') {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          <FormHeader
            title="Add New Record"
            subtitle="Capture required fields."
            onBack={() => setView('main')}
          />
          <form className="bg-white rounded-2xl border border-slate-200 p-6 premium-shadow space-y-6">
            {/* inputs */}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
      {/* list view: header, filters, table */}
      <Footer />
    </div>
  );
}
```

For simple list-only modules, use `GenericListModule` via `web/lib/modules/registry.ts` and `ModulePage`.

## Fast File Routing

Before editing, check this ownership map:

| What | Where |
|------|-------|
| Sidebar, header, footer, form header | `web/components/layout/` |
| Auth guard, app bootstrap | `web/components/auth/`, `web/hooks/use-app-ready.tsx` |
| Global state, Firebase sync | `web/lib/state/app-store.ts` |
| CRM and domain services | `web/lib/services/` |
| Navigation config | `web/lib/navigation/tenant-sidebar.ts` |
| i18n translations | `web/lib/i18n/translations.ts` |
| Global CSS | `web/styles/globals.css` |
| Module list configs | `web/lib/modules/registry.ts` |
| Dedicated module UI | `web/components/modules/` |
| Route entry points | `web/app/(tenant)/` |

If the request changes every page's layout or navigation, start from `web/components/layout/` and `web/lib/navigation/tenant-sidebar.ts` — not a single module page.

## Form Logic & Validation

1. **Dynamic Titles:** Use state to swap form header title between "Create" and "Edit" via `FormHeader` props.
2. **Email Optional:** Email fields must NOT have the `required` attribute.
3. **Advanced Toggles:** Collapsible section labelled **"Show Advanced Details"**, collapsed by default:

```tsx
const [showAdvanced, setShowAdvanced] = useState(false);

<button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-blue-600 text-xs font-bold cursor-pointer">
  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
  Show Advanced Details
</button>
{showAdvanced && (
  <div className="space-y-6 pt-4 border-t border-slate-100">{/* advanced fields */}</div>
)}
```

## State & Data

- Read/write app data via `useAppStore` from `web/lib/state/app-store.ts`
- CRM helpers: `web/lib/services/crm-service.ts`
- No server API — all persistence is client-side (localStorage + Firebase RTDB)
