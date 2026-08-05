import { NextResponse } from 'next/server';
import { seedMainAdminProfile } from '@/lib/services/bootstrap-admin';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const result = await seedMainAdminProfile();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bootstrap failed';
    console.error('[api/dev/bootstrap]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({
    hint: 'POST to this endpoint to seed the main admin RTDB profile (dev only).',
  });
}
