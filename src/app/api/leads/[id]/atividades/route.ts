import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';
import type { TipoAtividadeLead } from '@prisma/client';

const postSchema = z.object({
  tipo: z.enum(['LIGACAO', 'EMAIL_ENVIADO', 'ORCAMENTO_ENVIADO', 'CONTATO_WHATSAPP', 'OBSERVACAO']),
  descricao: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { id } = await params;
    const atividades = await prisma.leadAtividade.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      include: { usuario: { select: { nome: true } } },
    });
    return NextResponse.json(atividades);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, ['COMERCIAL', 'GESTAO', 'ADMIN']);
    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    const body = await request.json();
    const data = postSchema.parse(body);
    const atividade = await prisma.leadAtividade.create({
      data: {
        leadId: id,
        tipo: data.tipo as TipoAtividadeLead,
        descricao: data.descricao?.trim() || null,
        usuarioId: session.sub,
      },
      include: { usuario: { select: { nome: true } } },
    });
    return NextResponse.json(atividade);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : 'Erro';
    const status = msg === 'Não autorizado' ? 401 : msg === 'Acesso negado' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
