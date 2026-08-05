/**
 * Publish database.rules.json to Firebase RTDB.
 * Uses Firebase CLI with web/serviceAccount.json (no interactive login required).
 * Usage: npm run deploy:rules
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const PROJECT_ID = 'toys-erp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
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

function main() {
  const rulesPath = join(repoRoot, 'database.rules.json');
  if (!existsSync(rulesPath)) {
    console.error(`Missing ${rulesPath}`);
    process.exit(1);
  }

  const serviceAccountPath = resolveServiceAccountPath();
  if (!serviceAccountPath && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(`
Missing service account JSON.
Place credentials at web/serviceAccount.json (see docs/FIREBASE_AUTH_BOOTSTRAP.md)
or run \`firebase login\` then: npx firebase-tools deploy --only database --project ${PROJECT_ID}
`);
    process.exit(1);
  }

  if (serviceAccountPath) {
    try {
      const raw = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      if (raw.project_id && raw.project_id !== PROJECT_ID) {
        console.warn(
          `Warning: service account project_id is "${raw.project_id}" but .firebaserc default is "${PROJECT_ID}".`,
        );
      }
    } catch {
      console.warn(`Warning: could not parse ${serviceAccountPath} as JSON.`);
    }
  }

  const env = {
    ...process.env,
    ...(serviceAccountPath ? { GOOGLE_APPLICATION_CREDENTIALS: serviceAccountPath } : {}),
  };

  console.log(`Deploying RTDB rules to ${PROJECT_ID}...`);
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['firebase-tools', 'deploy', '--only', 'database', '--project', PROJECT_ID],
    { cwd: repoRoot, env, stdio: 'inherit', shell: false },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log('Self sign-up should now work at /login → Create account.');
}

main();
