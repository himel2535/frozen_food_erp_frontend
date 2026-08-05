# Toys Factory ERP — Next.js Frontend

TypeScript Next.js App Router migration of the legacy Vite MPA.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

### Login setup (automated)

1. Download a Firebase **service account** JSON → save as `web/serviceAccount.json` (gitignored)
2. Ensure Auth user `admin@toysfactory.com` exists in project **toys-erp**
3. Seed the RTDB admin profile:

```bash
npm run seed:admin
```

4. Sign in with that email + your Firebase Auth password

Full guide: [docs/FIREBASE_AUTH_BOOTSTRAP.md](../docs/FIREBASE_AUTH_BOOTSTRAP.md)

In development, if login shows **User profile not found**, use the **Auto-setup admin profile** button on `/login` (requires `serviceAccount.json`).


## Structure

- `app/(tenant)/` — authenticated routes with sidebar shell
- `app/login/` — login page
- `components/layout/` — Sidebar, Header, Footer, FormHeader
- `components/modules/` — page views (Dashboard, CRM Leads, GenericListModule)
- `lib/state/` — Zustand store + Firebase sync
- `lib/modules/module-metadata.ts` — module titles, columns, and static demo rows for port configs
- `lib/services/crm-service.ts` — CRM domain logic (ported from legacy)
- `styles/globals.css` — global Tailwind styles

## Adding a new module route

1. Add config to `lib/modules/port-configs.ts` (or create a dedicated component under `components/modules/`)
2. Run `node scripts/generate-routes.mjs` if adding a new HTML-equivalent route
3. Or manually add `app/(tenant)/[module]/page.tsx`

## Legacy compatibility

- `.html` URLs redirect to new routes via `next.config.ts`
- Same `localStorage` key: `hookerp_auth_state`
- Same Firebase RTDB path: `toysfactory/appState`
