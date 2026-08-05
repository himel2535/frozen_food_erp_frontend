# Firebase Auth Bootstrap — toys-erp (Main Admin)

Project: **toys-erp**  
Database: `https://toys-erp-default-rtdb.firebaseio.com`  
Main admin email: **admin@toysfactory.com**  
Main admin UID: **kdnUotlpnOSBzEzSvX1VwGK6ZYA2**

This app uses **Firebase Authentication** for login and RTDB path `toysfactory/auth/users/{uid}` for section access.

---

## Automated setup (recommended)

Skip manual Realtime Database editing. Use Admin SDK once:

### 1. Service account JSON (one-time)

1. [Firebase Console](https://console.firebase.google.com/) → **toys-erp** → **Project settings** → **Service accounts**
2. **Generate new private key**
3. Save the file as:

```
web/serviceAccount.json
```

(This file is gitignored — never commit it.)

### 2. Seed the admin RTDB profile

```bash
cd web
npm run seed:admin
```

Expected output:

```
✓ Wrote toysfactory/auth/users/kdnUotlpnOSBzEzSvX1VwGK6ZYA2
✓ Verified profile exists (isMainAdmin: true)
```

### 3. Dev login auto-setup (optional)

With `npm run dev` running and `serviceAccount.json` present:

1. Open `/login` and try signing in
2. If you see **User profile not found**, click **Auto-setup admin profile**
3. That calls `POST /api/dev/bootstrap` (development only) and retries sign-in

### 4. Sign in

- URL: `http://localhost:3000/login`
- Email: `admin@toysfactory.com`
- Password: the one you set in Firebase Authentication

### Self-registration (sign up)

Users can create an account from `/login` → **Create account**:

- Full name, email, password (min 6 characters)
- New accounts get **Dashboard only** access (`allowedSections: ["dashboard"]`)
- Main admin can grant more sections under **Settings → Users**

Requires:

- **Authentication → Sign-in method → Email/Password** enabled in Firebase Console
- Updated RTDB rules (see [`database.rules.json`](../database.rules.json)) published — new users must be allowed to create their own profile at `toysfactory/auth/users/{uid}` once

---

### Prerequisites

- Email/Password enabled under **Authentication → Sign-in method**
- Auth user `admin@toysfactory.com` already exists (UID above)
- Publish [`database.rules.json`](../database.rules.json) on the Realtime Database **Rules** tab (or `firebase deploy --only database`)

---

## Alternative: Admin SDK via `.env.local`

If you prefer env vars instead of a JSON file:

1. Copy [`web/.env.example`](../web/.env.example) → `web/.env.local`
2. Fill:

```
FIREBASE_ADMIN_PROJECT_ID=toys-erp
FIREBASE_ADMIN_CLIENT_EMAIL=...@toys-erp.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_DATABASE_URL=https://toys-erp-default-rtdb.firebaseio.com
```

Client `NEXT_PUBLIC_FIREBASE_*` values are optional — [`web/lib/firebase.ts`](../web/lib/firebase.ts) already falls back to toys-erp config.

Restart `npm run dev` after saving.

---

## Fallback: Manual Console seed

Only if you cannot use the service account:

1. **Authentication** → ensure `admin@toysfactory.com` exists
2. **Realtime Database** → import [`docs/seed-main-admin.json`](seed-main-admin.json) (UID already filled)
3. Publish [`database.rules.json`](../database.rules.json)

---

## Daily use

1. Sign in at `/login` with `admin@toysfactory.com` + your password
2. Open **Administration → Users**
3. **Add User** → set name, email, password, and section checkboxes
4. New user signs in and only sees allowed sidebar sections

(Add User API still needs Admin SDK credentials via `serviceAccount.json` or `.env.local`.)

---

## Troubleshooting: Admin API returns 500 (Windows)

**Settings → Users / Roles** call `/api/admin/users` and `/api/admin/roles`, which require **firebase-admin** on the server.

On **Windows**, **Turbopack** (`next dev --turbo`) cannot load `firebase-admin` (junction/symlink error). Use the default dev script instead:

```bash
# from repo root
npm run dev
```

This runs `next dev --webpack`, which works with Admin APIs.

**Verify:** After starting, the terminal must **not** say `(Turbopack)`. Quick check:

```bash
curl http://localhost:3000/api/admin/health
```

Expected: `{"ok":true}`. If `ok` is false, read the `error` field — it usually mentions junction/Turbopack or missing credentials.

If you still see 500 after switching:

1. Stop the dev server
2. Delete `web/.next`
3. Run `npm run dev` again
4. Confirm `web/serviceAccount.json` exists (or `.env.local` Admin vars)

For faster HMR on pages that do **not** use Admin APIs, you can use `npm run dev:turbo --prefix web` — but Users/Roles management will not work until you switch back to webpack dev.

---

## Troubleshooting: Sign up → Database access denied

**Create account** creates a Firebase Auth user, then writes `toysfactory/auth/users/{uid}`. If RTDB rules on the live project are outdated, the profile write fails with:

> Database access denied. Check RTDB rules and admin profile.

**Fix:** publish [`database.rules.json`](../database.rules.json):

```bash
# from repo root (uses web/serviceAccount.json automatically)
npm run deploy:rules
```

Requires `web/serviceAccount.json` or `GOOGLE_APPLICATION_CREDENTIALS`. Alternatively run `firebase login` and `npx firebase-tools deploy --only database --project toys-erp`.

Or Firebase Console → **toys-erp** → **Realtime Database** → **Rules** → paste the file → **Publish**.

The published rules must allow one-time self-write: `auth.uid == $uid && !data.exists()` under `toysfactory/auth/users/$uid`.

**If signup failed once:** the email may exist in Authentication without an RTDB profile. Remove the orphan Auth user:

```bash
npm run cleanup:orphan-auth -- user@example.com
```

Or delete that user in Firebase Console → **Authentication** → **Users**, then sign up again.

---

## Data paths

```
toysfactory/
  appState/          ← business ERP data
  auth/
    users/{uid}/     ← login profile + allowedSections
```

Main admin: `isMainAdmin: true`, `allowedSections: ["*"]`
