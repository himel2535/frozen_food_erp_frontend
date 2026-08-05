import { NextResponse } from 'next/server';
import { getApps } from 'firebase-admin/app';
import { getAdminDatabase } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDatabase();
    if (!getApps().length) {
      throw new Error('Firebase Admin not initialized');
    }
    await db.ref('toysfactory/auth/roles').limitToFirst(1).get();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Firebase Admin unavailable';
    if (process.env.NODE_ENV === 'development') {
      console.error('[api/admin/health GET]', message);
    }
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
