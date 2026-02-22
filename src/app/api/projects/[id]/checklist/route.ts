import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  return NextResponse.json({ error: 'Use /api/projetos/:id/checklist' }, { status: 410 });
}
