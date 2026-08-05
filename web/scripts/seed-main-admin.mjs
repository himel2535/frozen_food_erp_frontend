/**
 * Seed main admin RTDB profile via Admin SDK.
 * Usage: place web/serviceAccount.json then run `npm run seed:admin`
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');

const MAIN_ADMIN_UID = 'kdnUotlpnOSBzEzSvX1VwGK6ZYA2';
const MAIN_ADMIN_EMAIL = 'admin@toysfactory.com';
const AUTH_USER_PATH = `toysfactory/auth/users/${MAIN_ADMIN_UID}`;
const DATABASE_URL = 'https://toys-erp-default-rtdb.firebaseio.com';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');

function resolveServiceAccountPath() {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    join(webRoot, 'serviceAccount.json'),
    join(process.cwd(), 'serviceAccount.json'),
  ].filter(Boolean);

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function loadCredentials() {
  const filePath = resolveServiceAccountPath();
  if (!filePath) {
    console.error(`
Missing service account JSON.

1. Firebase Console → toys-erp → Project settings → Service accounts
2. Generate new private key
3. Save as: web/serviceAccount.json
4. Re-run: npm run seed:admin
`);
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!raw.project_id || !raw.client_email || !raw.private_key) {
    console.error(`Invalid service account file: ${filePath}`);
    process.exit(1);
  }

  console.log(`Using credentials: ${filePath}`);
  return {
    projectId: raw.project_id,
    clientEmail: raw.client_email,
    privateKey: raw.private_key,
    filePath,
  };
}

async function main() {
  const creds = loadCredentials();

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: creds.projectId,
        clientEmail: creds.clientEmail,
        privateKey: creds.privateKey,
      }),
      databaseURL: DATABASE_URL,
    });
  }

  const db = getDatabase();
  const ref = db.ref(AUTH_USER_PATH);
  const existing = await ref.get();
  const created = !existing.exists();

  let createdAt = new Date().toISOString();
  if (existing.exists()) {
    const prev = existing.val();
    if (prev?.createdAt) createdAt = String(prev.createdAt);
  }

  const profile = {
    uid: MAIN_ADMIN_UID,
    email: MAIN_ADMIN_EMAIL,
    name: 'Main Admin',
    isMainAdmin: true,
    allowedSections: ['*'],
    status: 'active',
    createdAt,
  };

  await ref.set(profile);

  const verify = await ref.get();
  if (!verify.exists()) {
    console.error(`✗ Write failed — profile missing at ${AUTH_USER_PATH}`);
    console.error(`  Database: ${DATABASE_URL}`);
    process.exit(1);
  }

  const written = verify.val();
  console.log(`${created ? '✓ Wrote' : '✓ Updated'} ${AUTH_USER_PATH}`);
  console.log(`✓ Verified profile exists (isMainAdmin: ${Boolean(written.isMainAdmin)})`);
  console.log(`  Database: ${DATABASE_URL}`);
  console.log(`  UID: ${MAIN_ADMIN_UID}`);
  console.log(`  Email: ${MAIN_ADMIN_EMAIL}`);

  try {
    await getAuth().getUser(MAIN_ADMIN_UID);
    console.log('✓ Firebase Auth user exists for this UID');
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : '';
    if (code === 'auth/user-not-found') {
      console.warn(
        `⚠ Auth user ${MAIN_ADMIN_UID} not found. Create admin@toysfactory.com in Authentication before logging in.`,
      );
    } else {
      console.warn('⚠ Could not verify Auth user:', err?.message || err);
    }
  }

  console.log(`
Next:
  1. Publish RTDB rules if needed (database.rules.json)
  2. npm run dev
  3. Sign in at /login with ${MAIN_ADMIN_EMAIL} + your Auth password
`);
}

main().catch((err) => {
  console.error('seed:admin failed:', err?.message || err);
  process.exit(1);
});
