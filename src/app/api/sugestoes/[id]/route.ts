import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';

const statusEnum = ['NOVA', 'EM_DISCUSSAO', 'APROVADA', 'IMPLEMENTADA', 'ARQUIVADA'] as const;
const patchSchema = z.object({ status: z.enum(statusEnum) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['GESTAO', 'ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const data = patchSchema.parse(body);
    const sugestao = await prisma.sugestaoMelhoria.update({
      where: { id },
      data: { status: data.status },
      include: {
        usuario: { select: { id: true, nome: true } },
        projeto: { select: { id: true, nome: true } },
      },
    });
    return NextResponse.json(sugestao);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
