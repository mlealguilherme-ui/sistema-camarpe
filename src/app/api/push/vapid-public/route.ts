import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return NextResponse.json({ error: 'Push não configurado' }, { status: 503 });
    return NextResponse.json({ publicKey: key });
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
}
