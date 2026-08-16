# Toys Factory ERP — Next.js app

The UI lives in this directory (`web/`). Full project overview (frontend + backend, Socket.io, multi-tenant, Vercel, Railway, local Docker): **[repository README](../README.md)**.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login). The API must be running on port 5000 ([backend repo](https://github.com/himel2535/toys_factory_erp_backend)), or use the hosted API at [https://toysfactoryerpbackend-production.up.railway.app](https://toysfactoryerpbackend-production.up.railway.app).

## Layout

| Path | Purpose |
| --- | --- |
| `app/(tenant)/` | Authenticated module routes |
| `app/login/` | Login and first-admin register |
| `components/modules/` | Feature pages |
| `components/providers/SocketProvider.tsx` | Socket.io inbox (`notification:new`) |
| `lib/socket/` | Shared Socket.io client |
| `lib/services/` | Domain API clients |
| `lib/state/` | Zustand stores |
| `styles/globals.css` | Global styles and tokens |

Env template: [`.env.example`](.env.example) (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, Cloudinary). Production builds also read [`.env.production`](.env.production) for Cloudinary.
