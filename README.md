# Toys Factory ERP

Enterprise ERP frontend built with **Next.js 16** (App Router + TypeScript + Tailwind CSS v4).

## Quick start

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

Sandbox login: `admin@toysfactory.com` / `password123`

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |

All commands run the app in [`web/`](web/).

## Stack

- **Frontend:** React 19, Next.js App Router, Tailwind CSS v4
- **State:** Zustand + localStorage + Firebase Realtime Database (client-side)
- **Backend:** None — no custom Node.js API; Next.js only serves the React app

See [`web/README.md`](web/README.md) for folder structure details.
