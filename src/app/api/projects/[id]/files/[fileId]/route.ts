import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  return NextResponse.json({ error: 'Use /api/projetos/:id/arquivos/:arquivoId' }, { status: 410 });
}
