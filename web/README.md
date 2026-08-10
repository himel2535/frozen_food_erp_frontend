# Toys Factory ERP — Next.js App

The Next.js application lives in this directory. For the full project overview, architecture, module coverage, and setup guide, see the **[root README](../README.md)**.

## Quick start

```bash
# From repository root
npm install
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

## App-specific paths

| Path | Purpose |
|------|---------|
| `app/(tenant)/` | Authenticated module routes |
| `app/login/` | Login and signup |
| `app/api/` | Admin API routes (firebase-admin) |
| `components/modules/` | Feature page components |
| `lib/services/` | Domain business logic |
| `lib/state/app-store.ts` | Zustand store + Firebase sync |
| `styles/globals.css` | Global styles and design tokens |

## Firebase bootstrap

See [docs/FIREBASE_AUTH_BOOTSTRAP.md](../docs/FIREBASE_AUTH_BOOTSTRAP.md).
