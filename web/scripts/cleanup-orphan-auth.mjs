/**
 * Remove Firebase Auth users that have no RTDB profile (failed sign-up leftovers).
 * Usage: npm run cleanup:orphan-auth -- projectmanager@gmail.com
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');

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
    console.error('Missing web/serviceAccount.json — see npm run seed:admin setup.');
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, 'utf8'));
  return {
    projectId: raw.project_id,
    clientEmail: raw.client_email,
    privateKey: raw.private_key,
  };
}

async function main() {
  const email = String(process.argv[2] ?? 'projectmanager@gmail.com').trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run cleanup:orphan-auth -- user@example.com');
    process.exit(1);
  }

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

  const auth = getAuth();
  const db = getDatabase();

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : '';
    if (code === 'auth/user-not-found') {
      console.log(`No Auth user for ${email} — nothing to clean up.`);
      return;
    }
    throw err;
  }

  const profileSnap = await db.ref(`toysfactory/auth/users/${user.uid}`).get();
  if (profileSnap.exists()) {
    console.log(`Profile exists for ${email} (${user.uid}) — not deleting.`);
    return;
  }

  await auth.deleteUser(user.uid);
  console.log(`Deleted orphan Auth user ${email} (${user.uid}) — no RTDB profile was found.`);
  console.log('You can sign up again with this email after RTDB rules are published.');
}

main().catch((err) => {
  console.error('cleanup:orphan-auth failed:', err?.message || err);
  process.exit(1);
});
