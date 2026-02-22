import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  return NextResponse.json([]);
}

export async function POST(_request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'GESTAO') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  return NextResponse.json({ error: 'Use /api/estoque-alerta' }, { status: 410 });
}
